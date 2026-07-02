import type { FormState } from './parser/types';

/**
 * 登録した予定の履歴。localStorage(この端末のみ)に保存する。
 * Storage は node 環境のテストで注入できるよう引数で受ける。
 * localStorage が使えない環境(プライベートモード等)でも UI を壊さないよう全操作を例外安全にする。
 */
export interface HistoryEntry {
  id: string;
  savedAt: string; // ISO 8601
  form: FormState;
}

const KEY = 'schedule-capture:history:v1';
export const HISTORY_LIMIT = 50;

function defaultStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

export function loadHistory(storage = defaultStorage()): HistoryEntry[] {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(entries: HistoryEntry[], storage = defaultStorage()): void {
  try {
    storage?.setItem(KEY, JSON.stringify(entries));
  } catch {
    // 容量超過などは黙って諦める(登録フローは止めない)
  }
}

function sameForm(a: FormState, b: FormState): boolean {
  return (
    a.title === b.title &&
    a.date === b.date &&
    a.startTime === b.startTime &&
    a.endTime === b.endTime &&
    a.allDay === b.allDay &&
    a.location === b.location &&
    a.notes === b.notes
  );
}

/** 先頭に追加して保存。直近と同一内容ならスキップ。上限超は古い順に削除。 */
export function saveEntry(form: FormState, storage = defaultStorage()): HistoryEntry[] {
  const entries = loadHistory(storage);
  if (entries[0] && sameForm(entries[0].form, form)) return entries;
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    form: { ...form },
  };
  const next = [entry, ...entries].slice(0, HISTORY_LIMIT);
  persist(next, storage);
  return next;
}

export function removeEntry(id: string, storage = defaultStorage()): HistoryEntry[] {
  const next = loadHistory(storage).filter((e) => e.id !== id);
  persist(next, storage);
  return next;
}

export function clearHistory(storage = defaultStorage()): HistoryEntry[] {
  persist([], storage);
  return [];
}
