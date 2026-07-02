import { pad2 } from '../datetime';

export interface TimeResult {
  startTime: string; // 'HH:MM' or ''
  endTime: string; // 'HH:MM' or ''
  guessed: boolean; // 裸時刻を午前/午後変換した（要確認）
}

// 1つの時刻トークン。コロン形式は分必須（「12:」の誤検出防止）、「時」形式は分任意。
const TIME =
  '(?:(?:午前|午後|ＡＭ|ＰＭ|AM|PM|am|pm|朝|夕方|夜)?\\s*(?:\\d{1,2}\\s*[:：]\\s*\\d{1,2}|\\d{1,2}\\s*時\\s*(?:\\d{1,2}\\s*分?|半)?)|正午)';

interface ParsedToken {
  time: string;
  guessed: boolean;
}

function parseToken(s: string): ParsedToken {
  if (s.includes('正午')) return { time: '12:00', guessed: false };
  // 朝/夕方/夜は午前午後の明示とみなす（「夜7時」→ 19:00 確定）
  const isPM = /午後|PM|pm|ＰＭ|夕方|夜/.test(s);
  const isAM = /午前|AM|am|ＡＭ|朝/.test(s);
  const hm = s.match(/(\d{1,2})\s*(?:[:：]|時)\s*(\d{1,2}|半)?/);
  let h = hm ? Number(hm[1]) : 0;
  const min = hm && hm[2] ? (hm[2] === '半' ? 30 : Number(hm[2])) : 0;
  let guessed = false;

  if (isPM) {
    if (h < 12) h += 12;
  } else if (isAM) {
    if (h === 12) h = 0;
  } else {
    // 裸時刻の常識ルール: 1〜7時は午後扱い(+12)、8〜12時はそのまま、13時以降そのまま。
    if (h >= 1 && h <= 7) {
      h += 12;
      guessed = true; // 変換したので要確認
    }
  }
  h = ((h % 24) + 24) % 24;
  return { time: `${pad2(h)}:${pad2(Math.min(min, 59))}`, guessed };
}

/** テキストから開始/終了時刻を抽出。範囲指定を優先。 */
export function extractTime(text: string): TimeResult {
  const range = text.match(new RegExp(`(${TIME})\\s*(?:〜|～|~|-|－|ー|から|to)\\s*(${TIME})`));
  if (range) {
    const a = parseToken(range[1]);
    const b = parseToken(range[2]);
    return { startTime: a.time, endTime: b.time, guessed: a.guessed || b.guessed };
  }
  const single = text.match(new RegExp(TIME));
  if (single) {
    const a = parseToken(single[0]);
    return { startTime: a.time, endTime: '', guessed: a.guessed };
  }
  // 時刻トークンが無い場合のあいまい語彙（時間帯の目安なので推測扱い）
  const vague = text.match(/朝|夕方|夜/);
  if (vague) {
    const t = vague[0] === '朝' ? '09:00' : vague[0] === '夕方' ? '17:00' : '19:00';
    return { startTime: t, endTime: '', guessed: true };
  }
  return { startTime: '', endTime: '', guessed: false };
}
