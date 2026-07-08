import { describe, it, expect } from 'vitest';
import { extractTitle } from './titleParser';

describe('extractTitle', () => {
  it('明示の件名行を最優先', () => {
    expect(extractTitle('件名: 一次面接のご案内\n7/3 14時')).toBe('一次面接のご案内');
  });

  it('イベント語は長い順に優先（会社説明会 > 説明会）', () => {
    expect(extractTitle('会社説明会のお知らせ')).toBe('会社説明会');
  });

  it('【】プレフィックスを除去', () => {
    expect(extractTitle('【重要】株式会社〇〇より')).toBe('株式会社〇〇より');
  });

  it('フォールバックは先頭の非空行', () => {
    expect(extractTitle('\n\nなにかの連絡\n詳細は以下')).toBe('なにかの連絡');
  });

  it('空テキストはデフォルト「予定」', () => {
    expect(extractTitle('')).toBe('予定');
  });
});
