import type { HistoryEntry } from '../lib/history';
import type { FormState } from '../lib/parser/types';

interface Props {
  entries: HistoryEntry[];
  onRestore: (form: FormState) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

function fmtDate(iso: string): string {
  if (!iso) return '';
  return `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;
}

function fmtSavedAt(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')} 保存`;
}

/** 登録した予定の履歴一覧。タップでフォームに復元できる。 */
export function HistoryPanel({ entries, onRestore, onRemove, onClear }: Props) {
  if (entries.length === 0) return null;
  return (
    <details className="history">
      <summary className="history-summary">履歴（{entries.length}）</summary>
      <ul className="history-list">
        {entries.map((e) => (
          <li key={e.id} className="history-item">
            <button
              type="button"
              className="history-main"
              onClick={() => onRestore(e.form)}
              title="タップしてフォームに復元"
            >
              <span className="history-title">
                {e.form.date && <span className="history-date">{fmtDate(e.form.date)}</span>}
                {e.form.title || '予定'}
                {e.form.startTime && ` ${e.form.startTime}`}
              </span>
              <span className="history-saved">{fmtSavedAt(e.savedAt)}</span>
            </button>
            <button
              type="button"
              className="history-remove"
              aria-label="この履歴を削除"
              onClick={() => onRemove(e.id)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn ghost history-clear" onClick={onClear}>
        履歴をすべて削除
      </button>
    </details>
  );
}
