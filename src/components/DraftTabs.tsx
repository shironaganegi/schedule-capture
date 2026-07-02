import type { Draft } from '../hooks/useCapture';

interface Props {
  drafts: Draft[];
  activeIndex: number;
  onSelect: (i: number) => void;
}

function chipLabel(d: Draft): string {
  const date = d.form.date
    ? `${Number(d.form.date.slice(5, 7))}/${Number(d.form.date.slice(8, 10))}`
    : '';
  const title = d.form.title.slice(0, 8) || '予定';
  return date ? `${date} ${title}` : title;
}

/** 複数の予定候補があるときだけ表示するチップ列。 */
export function DraftTabs({ drafts, activeIndex, onSelect }: Props) {
  if (drafts.length < 2) return null;
  return (
    <div className="draft-tabs">
      <p className="draft-count">{drafts.length} 件の予定候補が見つかりました</p>
      <div className="chips" role="tablist">
        {drafts.map((d, i) => (
          <button
            key={d.id}
            type="button"
            role="tab"
            aria-selected={i === activeIndex}
            className={`chip${i === activeIndex ? ' active' : ''}${d.added ? ' added' : ''}`}
            onClick={() => onSelect(i)}
          >
            {d.added ? '✓ ' : ''}
            {chipLabel(d)}
          </button>
        ))}
      </div>
    </div>
  );
}
