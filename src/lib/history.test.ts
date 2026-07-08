import { describe, it, expect, beforeEach } from 'vitest';
import { loadHistory, saveEntry, removeEntry, clearHistory, HISTORY_LIMIT } from './history';
import type { FormState } from './parser/types';

// node 環境用のフェイク Storage
function fakeStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
}

function form(over: Partial<FormState> = {}): FormState {
  return {
    title: '説明会',
    date: '2025-07-03',
    startTime: '14:00',
    endTime: '15:00',
    allDay: false,
    location: '',
    notes: '',
    ...over,
  };
}

describe('history', () => {
  let storage: Storage;
  beforeEach(() => {
    storage = fakeStorage();
  });

  it('保存して読み込める(先頭に追加)', () => {
    saveEntry(form({ title: 'A' }), storage);
    const after = saveEntry(form({ title: 'B' }), storage);
    expect(after).toHaveLength(2);
    expect(after[0].form.title).toBe('B');
    expect(loadHistory(storage)).toHaveLength(2);
  });

  it('直近と同一内容はスキップ', () => {
    saveEntry(form(), storage);
    const after = saveEntry(form(), storage);
    expect(after).toHaveLength(1);
  });

  it('上限を超えたら古い順に削除', () => {
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) {
      saveEntry(form({ title: `予定${i}` }), storage);
    }
    const entries = loadHistory(storage);
    expect(entries).toHaveLength(HISTORY_LIMIT);
    expect(entries[0].form.title).toBe(`予定${HISTORY_LIMIT + 4}`);
  });

  it('破損 JSON は空配列に握りつぶす', () => {
    const s = fakeStorage({ 'schedule-capture:history:v1': '{broken' });
    expect(loadHistory(s)).toEqual([]);
  });

  it('配列でない JSON も空配列', () => {
    const s = fakeStorage({ 'schedule-capture:history:v1': '{"a":1}' });
    expect(loadHistory(s)).toEqual([]);
  });

  it('id 指定で削除できる', () => {
    saveEntry(form({ title: 'A' }), storage);
    const two = saveEntry(form({ title: 'B' }), storage);
    const after = removeEntry(two[1].id, storage);
    expect(after).toHaveLength(1);
    expect(after[0].form.title).toBe('B');
  });

  it('全削除', () => {
    saveEntry(form(), storage);
    expect(clearHistory(storage)).toEqual([]);
    expect(loadHistory(storage)).toEqual([]);
  });

  it('storage が無くても例外を出さない', () => {
    expect(() => saveEntry(form(), undefined)).not.toThrow();
    expect(loadHistory(undefined)).toEqual([]);
  });
});
