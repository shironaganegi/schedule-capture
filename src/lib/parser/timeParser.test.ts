import { describe, it, expect } from 'vitest';
import { extractTime } from './timeParser';

describe('extractTime', () => {
  it('「12:」（分なしコロン）は時刻として検出しない', () => {
    expect(extractTime('本日 12: 集合').startTime).toBe('');
  });

  it('12:30 は検出する', () => {
    expect(extractTime('12:30 集合')).toEqual({ startTime: '12:30', endTime: '', guessed: false });
  });

  it('時間範囲の各種セパレータ', () => {
    for (const sep of ['〜', '～', '-', 'から']) {
      const r = extractTime(`14:00${sep}15:30`);
      expect(r.startTime, sep).toBe('14:00');
      expect(r.endTime, sep).toBe('15:30');
    }
  });

  it('「14時〜15時半」の日本語範囲', () => {
    expect(extractTime('14時〜15時半')).toEqual({
      startTime: '14:00',
      endTime: '15:30',
      guessed: false,
    });
  });

  it('「正午」は12:00で確定', () => {
    expect(extractTime('正午に集合')).toEqual({ startTime: '12:00', endTime: '', guessed: false });
  });

  it('「夜7時」は修飾語ありなので19:00で確定', () => {
    expect(extractTime('夜7時から懇親会')).toEqual({
      startTime: '19:00',
      endTime: '',
      guessed: false,
    });
  });

  it('「朝9時」は09:00で確定', () => {
    expect(extractTime('朝9時 集合')).toEqual({ startTime: '09:00', endTime: '', guessed: false });
  });

  it('「夕方」だけなら17:00の推測', () => {
    expect(extractTime('明日の夕方に面談')).toEqual({
      startTime: '17:00',
      endTime: '',
      guessed: true,
    });
  });

  it('裸時刻2時は午後に倒して推測フラグ', () => {
    expect(extractTime('2時集合')).toEqual({ startTime: '14:00', endTime: '', guessed: true });
  });

  it('午前明示は変換しない', () => {
    expect(extractTime('午前10時')).toEqual({ startTime: '10:00', endTime: '', guessed: false });
  });

  it('時刻なしは空', () => {
    expect(extractTime('特になし')).toEqual({ startTime: '', endTime: '', guessed: false });
  });
});
