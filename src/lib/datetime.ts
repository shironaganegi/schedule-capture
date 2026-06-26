/** 日付・時刻のローカル(JST想定)ユーティリティ。 */

export const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Date -> 'YYYY-MM-DD'（ローカル日付）。 */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** 'YYYY-MM-DD' -> Date（ローカル 0時）。 */
export function fromISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** 'HH:MM' に分を加算（日跨ぎは丸め込み）。 */
export function addMinutesToTime(t: string, mins: number): string {
  const [h, m] = t.split(':').map(Number);
  const total = ((h * 60 + m + mins) % 1440 + 1440) % 1440;
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

/** GCal の時間指定フォーマット 'YYYYMMDDTHHMMSS'。 */
export function gcalDateTime(dateIso: string, time: string): string {
  const [y, mo, da] = dateIso.split('-');
  const [h, mi] = time.split(':');
  return `${y}${mo}${da}T${h}${mi}00`;
}

/** GCal の終日フォーマット 'YYYYMMDD'。 */
export function gcalDate(dateIso: string): string {
  return dateIso.replace(/-/g, '');
}
