import { useCallback, useState } from 'react';
import { loadHistory, saveEntry, removeEntry, clearHistory } from '../lib/history';
import type { HistoryEntry } from '../lib/history';
import type { FormState } from '../lib/parser/types';

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => loadHistory());

  /** 保存して、実際に新規追加された場合のみ id を返す（重複スキップ時は undefined）。 */
  const add = useCallback((form: FormState): string | undefined => {
    const before = loadHistory();
    const next = saveEntry(form);
    setEntries(next);
    return next.length > before.length ? next[0].id : undefined;
  }, []);

  const remove = useCallback((id: string) => {
    setEntries(removeEntry(id));
  }, []);

  const clear = useCallback(() => {
    setEntries(clearHistory());
  }, []);

  return { entries, add, remove, clear };
}
