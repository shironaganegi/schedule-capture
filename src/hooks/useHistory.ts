import { useCallback, useState } from 'react';
import { loadHistory, saveEntry, removeEntry, clearHistory } from '../lib/history';
import type { HistoryEntry } from '../lib/history';
import type { FormState } from '../lib/parser/types';

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => loadHistory());

  const add = useCallback((form: FormState) => {
    setEntries(saveEntry(form));
  }, []);

  const remove = useCallback((id: string) => {
    setEntries(removeEntry(id));
  }, []);

  const clear = useCallback(() => {
    setEntries(clearHistory());
  }, []);

  return { entries, add, remove, clear };
}
