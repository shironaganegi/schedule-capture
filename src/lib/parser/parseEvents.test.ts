import { describe, it, expect } from 'vitest';
import { parseEvents } from './parseEvents';
import { parseEvent } from './parseEvent';

// 基準日: 2025-06-26（木）
const BASE = new Date(2025, 5, 26);

describe('parseEvents', () => {
  it('単一日付のテキストは parseEvent と同一結果 1 件（完全互換）', () => {
    const text = '2025年7月3日（木）14:00〜15:30 〇〇ビル3F 会社説明会';
    const events = parseEvents(text, BASE);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      ...parseEvent(text, BASE),
      sourceRange: { start: 0, end: text.length },
    });
  });

  it('締切+本命の組み合わせは 1 件のまま（締切は除外）', () => {
    const events = parseEvents('申込締切 7/1 ／ 会社説明会 7/3 14:00', BASE);
    expect(events).toHaveLength(1);
    expect(events[0].date).toBe('2025-07-03');
    expect(events[0].title).toBe('会社説明会');
  });

  it('複数行の複数予定を分割する', () => {
    const events = parseEvents('7/1 面談 10:00\n7/3 説明会 14:00〜15:00 〇〇ビル', BASE);
    expect(events).toHaveLength(2);
    expect(events[0].date).toBe('2025-07-01');
    expect(events[0].startTime).toBe('10:00');
    expect(events[0].title).toBe('面談');
    expect(events[1].date).toBe('2025-07-03');
    expect(events[1].startTime).toBe('14:00');
    expect(events[1].endTime).toBe('15:00');
    expect(events[1].title).toBe('説明会');
    expect(events[1].location).toBe('〇〇ビル');
  });

  it('同一行の複数予定も候補位置で分割する', () => {
    const events = parseEvents('7/1 面談 10:00 / 7/3 説明会 14:00', BASE);
    expect(events).toHaveLength(2);
    expect(events[0].date).toBe('2025-07-01');
    expect(events[1].date).toBe('2025-07-03');
  });

  it('セグメントで件名が取れない場合は全文の件名を流用', () => {
    const events = parseEvents('一次面接のご案内\n7/1 10:00\n7/3 14:00', BASE);
    expect(events).toHaveLength(2);
    expect(events[1].title).toBe('一次面接');
  });

  it('maxEvents で上限を切る', () => {
    const events = parseEvents('7/1 面談\n7/2 面談\n7/3 面談\n7/4 面談', BASE, 2);
    expect(events).toHaveLength(2);
  });

  it('同じ日付の複数回出現は 1 件にマージ', () => {
    const events = parseEvents('7/3 説明会。繰り返しますが 7/3 開催です。14:00', BASE);
    expect(events).toHaveLength(1);
  });

  it('日付なしテキストも 1 件返す', () => {
    const events = parseEvents('なにかのテキスト', BASE);
    expect(events).toHaveLength(1);
    expect(events[0].date).toBe('');
  });
});
