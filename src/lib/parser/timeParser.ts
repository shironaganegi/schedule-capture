import { pad2 } from '../datetime';

export interface TimeResult {
  startTime: string; // 'HH:MM' or ''
  endTime: string; // 'HH:MM' or ''
  guessed: boolean; // 裸時刻を午前/午後変換した（要確認）
}

// 1つの時刻トークン。: か 時 を必須にして、ただの数字の誤検出を避ける。
const TIME =
  '(?:午前|午後|ＡＭ|ＰＭ|AM|PM|am|pm)?\\s*\\d{1,2}\\s*(?::|時)\\s*(?:\\d{1,2}|半)?\\s*分?';

interface ParsedToken {
  time: string;
  guessed: boolean;
}

function parseToken(s: string): ParsedToken {
  const isPM = /午後|PM|pm|ＰＭ/.test(s);
  const isAM = /午前|AM|am|ＡＭ/.test(s);
  const hm = s.match(/(\d{1,2})\s*(?::|時)\s*(\d{1,2}|半)?/);
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
  return { startTime: '', endTime: '', guessed: false };
}
