import { describe, it, expect } from 'vitest';
import { extractDateCandidates, selectDate } from './dateParser';

// 基準日: 2025-06-26（木）
const BASE = new Date(2025, 5, 26);

function parse(text: string, base = BASE): string {
  return selectDate(extractDateCandidates(text, base), text);
}

describe('extractDateCandidates / selectDate', () => {
  it('存在しない日付は拒否する', () => {
    expect(parse('2月30日')).toBe('');
    expect(parse('2025年2月30日')).toBe('');
    expect(parse('4/31')).toBe('');
  });

  it('閏年の2/29は受理し、平年の2/29は拒否する', () => {
    expect(parse('2024年2月29日')).toBe('2024-02-29');
    expect(parse('2025年2月29日')).toBe('');
    // 年なし: 2023年7月基準 → 過去日なので翌年送り、2024は閏年で受理
    expect(parse('2/29', new Date(2023, 6, 1))).toBe('2024-02-29');
    // 2025年基準 → 翌年2026は平年なので拒否
    expect(parse('2/29')).toBe('');
  });

  it('カッコ付き曜日「7/3(木)」は日付1件として扱う（曜日の重複候補を作らない）', () => {
    const cands = extractDateCandidates('7/3(木) 14:00 説明会', BASE);
    expect(cands).toHaveLength(1);
    expect(cands[0].iso).toBe('2025-07-03');
  });

  it('全角カッコ「2025年7月3日（木）」も日付1件', () => {
    const cands = extractDateCandidates('2025年7月3日（木）14:00〜15:30', BASE);
    expect(cands).toHaveLength(1);
    expect(cands[0].iso).toBe('2025-07-03');
  });

  it('単独のカッコ曜日「(木)」は直近の木曜として扱う', () => {
    // 基準日が木曜なので当日
    expect(parse('説明会 (木) 開催')).toBe('2025-06-26');
  });

  it('来週月曜は次週月曜起点', () => {
    expect(parse('来週月曜')).toBe('2025-06-30');
  });

  it('締切系の日付は除外してイベント語に近い日付を選ぶ', () => {
    expect(parse('申込締切 7/1 ／ 会社説明会 7/3 14:00')).toBe('2025-07-03');
  });

  it('年なし月日で過去の月日は翌年送り', () => {
    expect(parse('1/15')).toBe('2026-01-15');
  });
});
