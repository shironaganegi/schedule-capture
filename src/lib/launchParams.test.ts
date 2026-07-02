import { describe, it, expect } from 'vitest';
import { readLaunchText } from './launchParams';

describe('readLaunchText', () => {
  it('text 単独', () => {
    expect(readLaunchText('?text=' + encodeURIComponent('7/3 説明会'))).toBe('7/3 説明会');
  });

  it('title + text + url を改行結合', () => {
    const q = `?title=${encodeURIComponent('件名')}&text=${encodeURIComponent('本文')}&url=${encodeURIComponent('https://example.com')}`;
    expect(readLaunchText(q)).toBe('件名\n本文\nhttps://example.com');
  });

  it('空・空白のみのパラメータは無視', () => {
    expect(readLaunchText('?title=&text=%20&url=')).toBe('');
    expect(readLaunchText('')).toBe('');
  });

  it('max 文字で切り詰め', () => {
    expect(readLaunchText('?text=' + 'a'.repeat(100), 10)).toHaveLength(10);
  });
});
