import { describe, it, expect } from 'vitest';
import { extractLocation } from './locationParser';

describe('extractLocation', () => {
  it('「場所:」行を最優先', () => {
    expect(extractLocation('場所: 東京本社 3F\nその他')).toBe('東京本社 3F');
  });

  it('@ 表記', () => {
    expect(extractLocation('7/3 14時 @渋谷ヒカリエ')).toBe('渋谷ヒカリエ');
  });

  it('建物名+階数', () => {
    expect(extractLocation('〇〇ビル3Fにお越しください')).toBe('〇〇ビル3F');
  });

  it('オンライン系キーワード', () => {
    expect(extractLocation('Zoomで開催します')).toBe('Zoom');
  });

  it('「〜にて」', () => {
    expect(extractLocation('大阪会場にて開催')).toBe('大阪会場');
  });

  it('該当なしは空文字', () => {
    expect(extractLocation('特になし')).toBe('');
  });
});
