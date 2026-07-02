import {
  addDays,
  addMinutesToTime,
  fromISODate,
  gcalDate,
  gcalDateTime,
  toISODate,
} from './datetime';
import type { FormState } from './parser/types';

const DEFAULT_DURATION_MIN = 60;

// 日本は夏時間なしなので固定オフセットの VTIMEZONE を同梱する
// (TZID を使う場合、RFC 5545 では定義の同梱が必須)
const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  'TZID:Asia/Tokyo',
  'BEGIN:STANDARD',
  'DTSTART:19700101T000000',
  'TZOFFSETFROM:+0900',
  'TZOFFSETTO:+0900',
  'TZNAME:JST',
  'END:STANDARD',
  'END:VTIMEZONE',
];

/** TEXT 値のエスケープ（RFC 5545 3.3.11）。改行はリテラル \n にする。 */
function escapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** 75オクテット超の行を UTF-8 の文字境界で折り返す（継続行は先頭スペース）。 */
function foldLine(line: string): string[] {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return [line];
  const out: string[] = [];
  let cur = '';
  let curBytes = 0;
  let limit = 75;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (curBytes + b > limit) {
      out.push(cur);
      cur = ' ';
      curBytes = 1;
      limit = 75;
    }
    cur += ch;
    curBytes += b;
  }
  if (cur) out.push(cur);
  return out;
}

/** Date を UTC の 'YYYYMMDDTHHMMSSZ' に変換（DTSTAMP 用）。 */
function utcStamp(d: Date): string {
  return d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/**
 * フォーム内容から iCalendar 文字列を生成する純関数。
 * now/uid はテストで固定注入できるよう引数で受ける。
 */
export function buildIcs(f: FormState, opts: { now: Date; uid: string }): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//schedule-capture//JA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  const allDay = f.allDay || !f.startTime;
  if (!allDay) lines.push(...VTIMEZONE);

  lines.push('BEGIN:VEVENT', `UID:${opts.uid}`, `DTSTAMP:${utcStamp(opts.now)}`);

  if (f.date) {
    if (allDay) {
      const endExclusive = gcalDate(toISODate(addDays(fromISODate(f.date), 1)));
      lines.push(`DTSTART;VALUE=DATE:${gcalDate(f.date)}`, `DTEND;VALUE=DATE:${endExclusive}`);
    } else {
      const end = f.endTime || addMinutesToTime(f.startTime, DEFAULT_DURATION_MIN);
      lines.push(
        `DTSTART;TZID=Asia/Tokyo:${gcalDateTime(f.date, f.startTime)}`,
        `DTEND;TZID=Asia/Tokyo:${gcalDateTime(f.date, end)}`,
      );
    }
  }

  lines.push(`SUMMARY:${escapeText(f.title || '予定')}`);
  if (f.location) lines.push(`LOCATION:${escapeText(f.location)}`);
  if (f.notes) lines.push(`DESCRIPTION:${escapeText(f.notes)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.flatMap(foldLine).join('\r\n') + '\r\n';
}

/** .ics を生成してダウンロードさせる（DOM 副作用あり）。 */
export function downloadIcs(f: FormState): void {
  const ics = buildIcs(f, { now: new Date(), uid: `${crypto.randomUUID()}@schedule-capture` });
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `event-${f.date ? gcalDate(f.date) : 'nodate'}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
