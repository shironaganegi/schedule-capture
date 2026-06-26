import { addDays, addMinutesToTime, fromISODate, gcalDate, gcalDateTime, toISODate } from './datetime';
import type { FormState } from './parser/types';

const DETAILS_MAX = 1500;

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '\n…（以下省略）' : s;
}

/**
 * 認証不要の Google カレンダー テンプレート URL を生成する。
 * 時間指定は JST(ctz=Asia/Tokyo)、終日は dates=開始/翌日 で扱う。
 */
export function buildGcalUrl(f: FormState): string {
  const params: [string, string][] = [
    ['action', 'TEMPLATE'],
    ['text', f.title || '予定'],
  ];

  if (f.date) {
    if (f.allDay || !f.startTime) {
      const endExclusive = toISODate(addDays(fromISODate(f.date), 1));
      params.push(['dates', `${gcalDate(f.date)}/${gcalDate(endExclusive)}`]);
    } else {
      const end = f.endTime || addMinutesToTime(f.startTime, 60);
      params.push(['dates', `${gcalDateTime(f.date, f.startTime)}/${gcalDateTime(f.date, end)}`]);
      params.push(['ctz', 'Asia/Tokyo']);
    }
  }

  if (f.location) params.push(['location', f.location]);
  if (f.notes) params.push(['details', truncate(f.notes, DETAILS_MAX)]);

  const qs = params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  return `https://calendar.google.com/calendar/render?${qs}`;
}
