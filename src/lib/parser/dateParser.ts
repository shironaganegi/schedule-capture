import { addDays, startOfDay, toISODate, pad2 } from '../datetime';

export interface DateCandidate {
  iso: string; // 'YYYY-MM-DD'
  index: number; // 元テキスト上の出現位置
}

const WD: Record<string, number> = { 月: 1, 火: 2, 水: 3, 木: 4, 金: 5, 土: 6, 日: 7 };

const EXCLUDE = /(締切|締め切り|〆切|〆|申込|応募|期限|回答|返信)/;
const EVENT =
  /(会社説明会|合同説明会|説明会|面接|面談|セミナー|選考|試験|ガイダンス|イベント|懇親会|インターン|ディスカッション)/;

function daysInMonth(y: number, mo: number): number {
  return new Date(y, mo, 0).getDate();
}

/** 月別日数まで検証する（2/30 は拒否、閏年の 2/29 は受理）。 */
function isValidDate(y: number, mo: number, d: number): boolean {
  return mo >= 1 && mo <= 12 && d >= 1 && d <= daysInMonth(y, mo);
}

function isoOf(y: number, mo: number, d: number): string {
  return `${y}-${pad2(mo)}-${pad2(d)}`;
}

/** 年なし月日の年を決める。当日は過去扱いしない（=今年）。当日より前なら翌年。 */
function resolveYear(base: Date, mo: number, d: number): number {
  const y = base.getFullYear();
  const cand = startOfDay(new Date(y, mo - 1, d));
  return cand.getTime() < base.getTime() ? y + 1 : y;
}

function relOffset(word: string): number {
  if (word === '明々後日' || word === '明明後日') return 3;
  if (word === '明後日' || word === 'あさって') return 2;
  if (word === '明日' || word === 'あした') return 1;
  return 0; // 今日 / きょう / 本日
}

/** 週起点は月曜。来週=次の月曜起点週、今週/単独は過去なら翌週送り。 */
function weekdayDate(base: Date, targetIso: number, modifier: string | undefined): Date {
  const baseIso = ((base.getDay() + 6) % 7) + 1; // Mon=1..Sun=7
  if (modifier === '来週') {
    const daysToNextMon = 8 - baseIso; // 必ず次週の月曜
    const nextMon = addDays(base, daysToNextMon);
    return addDays(nextMon, targetIso - 1);
  }
  // 今週 / 単独
  let diff = targetIso - baseIso;
  if (diff < 0) diff += 7; // 過去日は翌週へ送る
  return addDays(base, diff);
}

/** テキストから日付候補を出現順で抽出。 */
export function extractDateCandidates(text: string, baseDate: Date): DateCandidate[] {
  const base = startOfDay(baseDate);
  const cands: DateCandidate[] = [];
  const masked = text.split('');
  const mask = (start: number, len: number) => {
    for (let i = start; i < start + len; i++) masked[i] = ' ';
  };

  let m: RegExpExecArray | null;

  // 1) 年あり: 2025年7月3日 / 2025/7/3 / 2025-07-03
  const ymd = /(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})日?/g;
  while ((m = ymd.exec(text))) {
    const y = +m[1],
      mo = +m[2],
      d = +m[3];
    if (isValidDate(y, mo, d)) {
      cands.push({ iso: isoOf(y, mo, d), index: m.index });
      mask(m.index, m[0].length);
    }
  }

  // 2) 年なし月日: 7月3日 / 7/3（年ありの内側は除外済み）
  const md = /(\d{1,2})[月/](\d{1,2})日?/g;
  const src1 = masked.join('');
  while ((m = md.exec(src1))) {
    const mo = +m[1],
      d = +m[2];
    // 年を解決してから検証する（2/29 の妥当性は年に依存する）
    const y = resolveYear(base, mo, d);
    if (isValidDate(y, mo, d)) {
      cands.push({ iso: isoOf(y, mo, d), index: m.index });
      mask(m.index, m[0].length);
    }
  }

  // 3) 相対語
  const rel = /(明々後日|明明後日|明後日|あさって|明日|あした|今日|きょう|本日)/g;
  const src2 = masked.join('');
  while ((m = rel.exec(src2))) {
    cands.push({ iso: toISODate(addDays(base, relOffset(m[1]))), index: m.index });
    mask(m.index, m[0].length);
  }

  // 4) 曜日。カッコ付き「(木)」も拾うが、「7/3(木)」のように直前が日付
  //    （マスク済み）の場合は確認表記なので重複候補を作らない。
  const wd = /(今週|来週)?(?:([月火水木金土日])曜日?|[（(]([月火水木金土日])[)）])/g;
  const src3 = masked.join('');
  while ((m = wd.exec(src3))) {
    const ch = m[2] ?? m[3];
    if (m[3]) {
      let i = m.index - 1;
      while (i >= 0 && /\s/.test(text[i])) i--;
      if (i >= 0 && text[i] !== src3[i]) continue; // 直前が日付としてマスク済み
    }
    cands.push({ iso: toISODate(weekdayDate(base, WD[ch], m[1])), index: m.index });
  }

  cands.sort((a, b) => a.index - b.index);
  return cands;
}

/** 複数候補から予定日を選定する。締切系を除外し、イベント語に最も近い日付を採用。 */
export function selectDate(cands: DateCandidate[], text: string): string {
  if (cands.length === 0) return '';

  const kept = cands.filter((c) => !EXCLUDE.test(text.slice(Math.max(0, c.index - 14), c.index)));
  const pool = kept.length ? kept : cands;

  const events: number[] = [];
  const re = new RegExp(EVENT, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) events.push(m.index);

  if (events.length) {
    let best = pool[0];
    let bestDist = Infinity;
    for (const c of pool) {
      for (const e of events) {
        const dist = Math.abs(e - c.index);
        if (dist < bestDist) {
          bestDist = dist;
          best = c;
        }
      }
    }
    return best.iso;
  }
  return pool[0].iso;
}
