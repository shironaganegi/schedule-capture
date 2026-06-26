import { describe, it, expect } from 'vitest';
import { parseEvent } from './parseEvent';
import { buildGcalUrl } from '../gcal';

// 基準日: 2025-06-26（木）。相対表現を決定論的にする。
const BASE = new Date(2025, 5, 26);

describe('parseEvent', () => {
  it('正式な案内文（年月日・曜日・時間範囲・場所）', () => {
    const p = parseEvent('2025年7月3日（木）14:00〜15:30 〇〇ビル3F 会社説明会', BASE);
    expect(p.title).toBe('会社説明会');
    expect(p.date).toBe('2025-07-03');
    expect(p.startTime).toBe('14:00');
    expect(p.endTime).toBe('15:30');
    expect(p.allDay).toBe(false);
    expect(p.location).toBe('〇〇ビル3F');
    expect(p.guessed.time).toBe(false);
  });

  it('相対表現「明日14時」+ 場所、終了は+60分補完', () => {
    const p = parseEvent('明日14時に〇〇ビルで説明会', BASE);
    expect(p.date).toBe('2025-06-27');
    expect(p.startTime).toBe('14:00');
    expect(p.endTime).toBe('15:00');
    expect(p.title).toBe('説明会');
    expect(p.location).toBe('〇〇ビル');
  });

  it('来週月曜（週起点=月曜）+ 午後2時半 + オンライン', () => {
    const p = parseEvent('来週月曜 午後2時半 オンライン面談', BASE);
    expect(p.date).toBe('2025-06-30');
    expect(p.startTime).toBe('14:30');
    expect(p.title).toBe('面談');
    expect(p.location).toBe('オンライン');
    expect(p.guessed.time).toBe(false); // 午後明示なので確定
  });

  it('年なし月日は最近接未来（当日は今年扱い）', () => {
    const p = parseEvent('7/3 14時', BASE);
    expect(p.date).toBe('2025-07-03');
    expect(p.startTime).toBe('14:00');
  });

  it('複数日付: 締切は除外しイベント語に近い日付を採用', () => {
    const p = parseEvent('申込締切 7/1 ／ 会社説明会 7/3 14:00', BASE);
    expect(p.date).toBe('2025-07-03');
    expect(p.startTime).toBe('14:00');
    expect(p.title).toBe('会社説明会');
  });

  it('裸時刻は常識ルールで午後に倒し、推測フラグを立てる', () => {
    const p = parseEvent('2時半集合', BASE);
    expect(p.startTime).toBe('14:30');
    expect(p.guessed.time).toBe(true);
  });

  it('日付のみは終日イベント', () => {
    const p = parseEvent('7/3 説明会', BASE);
    expect(p.date).toBe('2025-07-03');
    expect(p.allDay).toBe(true);
    expect(p.startTime).toBe('');
  });

  it('件名は空にしない（フォールバック）', () => {
    const p = parseEvent('なにかのテキスト', BASE);
    expect(p.title.length).toBeGreaterThan(0);
  });
});

describe('buildGcalUrl', () => {
  it('時間指定イベントは ctz=Asia/Tokyo 付きの dates', () => {
    const url = buildGcalUrl({
      title: '会社説明会',
      date: '2025-07-03',
      startTime: '14:00',
      endTime: '15:30',
      allDay: false,
      location: '〇〇ビル3F',
      notes: 'メモ',
    });
    expect(url).toContain('action=TEMPLATE');
    expect(url).toContain('dates=20250703T140000%2F20250703T153000');
    expect(url).toContain('ctz=Asia%2FTokyo');
    expect(url).toContain('text=' + encodeURIComponent('会社説明会'));
    expect(url).toContain('location=' + encodeURIComponent('〇〇ビル3F'));
  });

  it('終日イベントは翌日を排他終了に、ctz は付けない', () => {
    const url = buildGcalUrl({
      title: '説明会',
      date: '2025-07-03',
      startTime: '',
      endTime: '',
      allDay: true,
      location: '',
      notes: '',
    });
    expect(url).toContain('dates=20250703%2F20250704');
    expect(url).not.toContain('ctz=');
  });
});
