import { describe, it, expect } from 'vitest';
import { buildIcs } from './ics';
import type { FormState } from './parser/types';

const OPTS = { now: new Date(Date.UTC(2025, 6, 1, 3, 0, 0)), uid: 'test-uid@schedule-capture' };

const TIMED: FormState = {
  title: '会社説明会',
  date: '2025-07-03',
  startTime: '14:00',
  endTime: '15:30',
  allDay: false,
  location: '〇〇ビル3F',
  notes: 'メモ1行目\nメモ2行目',
};

describe('buildIcs', () => {
  it('CRLF 改行で必須プロパティを含む', () => {
    const ics = buildIcs(TIMED, OPTS);
    expect(ics).toContain('BEGIN:VCALENDAR\r\n');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//schedule-capture//JA');
    expect(ics).toContain('UID:test-uid@schedule-capture');
    expect(ics).toContain('DTSTAMP:20250701T030000Z');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    // すべての改行が CRLF（裸の LF がない）
    expect(ics.replace(/\r\n/g, '')).not.toContain('\n');
  });

  it('時間指定イベントは TZID=Asia/Tokyo + VTIMEZONE 同梱', () => {
    const ics = buildIcs(TIMED, OPTS);
    expect(ics).toContain('BEGIN:VTIMEZONE');
    expect(ics).toContain('TZID:Asia/Tokyo');
    expect(ics).toContain('DTSTART;TZID=Asia/Tokyo:20250703T140000');
    expect(ics).toContain('DTEND;TZID=Asia/Tokyo:20250703T153000');
  });

  it('終日イベントは VALUE=DATE で翌日排他終了、VTIMEZONE なし', () => {
    const ics = buildIcs({ ...TIMED, allDay: true, startTime: '', endTime: '' }, OPTS);
    expect(ics).toContain('DTSTART;VALUE=DATE:20250703');
    expect(ics).toContain('DTEND;VALUE=DATE:20250704');
    expect(ics).not.toContain('VTIMEZONE');
  });

  it('終了時刻がなければ +60 分補完', () => {
    const ics = buildIcs({ ...TIMED, endTime: '' }, OPTS);
    expect(ics).toContain('DTEND;TZID=Asia/Tokyo:20250703T150000');
  });

  it('TEXT 値のエスケープ（カンマ・セミコロン・バックスラッシュ・改行）', () => {
    const ics = buildIcs({ ...TIMED, title: 'a,b;c\\d', notes: '1行目\n2行目' }, OPTS);
    expect(ics).toContain('SUMMARY:a\\,b\\;c\\\\d');
    expect(ics).toContain('DESCRIPTION:1行目\\n2行目');
  });

  it('75オクテット超の行は文字境界で折り返す（継続行は先頭スペース）', () => {
    const longNotes = 'あ'.repeat(100); // 300 バイト超
    const ics = buildIcs({ ...TIMED, notes: longNotes }, OPTS);
    const lines = ics.split('\r\n');
    const enc = new TextEncoder();
    for (const ln of lines) {
      expect(enc.encode(ln).length).toBeLessThanOrEqual(75);
    }
    // 折り返した継続行はスペースで始まる
    const descIdx = lines.findIndex((l) => l.startsWith('DESCRIPTION:'));
    expect(lines[descIdx + 1].startsWith(' ')).toBe(true);
    // アンフォールドすると元の文字列に戻る
    const unfolded = ics.replace(/\r\n /g, '');
    expect(unfolded).toContain(`DESCRIPTION:${longNotes}`);
  });

  it('タイトル空はデフォルト「予定」', () => {
    const ics = buildIcs({ ...TIMED, title: '' }, OPTS);
    expect(ics).toContain('SUMMARY:予定');
  });
});
