import type { FormState } from '../lib/parser/types';

interface Props {
  form: FormState;
  timeGuessed: boolean;
  onField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onAdd: () => void;
}

export function EventForm({ form, timeGuessed, onField, onAdd }: Props) {
  return (
    <section className="form">
      <label className="field">
        <span className="label">件名</span>
        <input type="text" value={form.title} onChange={(e) => onField('title', e.target.value)} />
      </label>

      <label className="field">
        <span className="label">日付</span>
        <input type="date" value={form.date} onChange={(e) => onField('date', e.target.value)} />
      </label>

      <label className="field checkbox">
        <input
          type="checkbox"
          checked={form.allDay}
          onChange={(e) => onField('allDay', e.target.checked)}
        />
        <span className="label">終日</span>
      </label>

      {!form.allDay && (
        <div className="row">
          <label className="field">
            <span className="label">
              開始 {timeGuessed && <span className="guess-tag">推測</span>}
            </span>
            <input
              type="time"
              className={timeGuessed ? 'guessed' : ''}
              value={form.startTime}
              onChange={(e) => onField('startTime', e.target.value)}
            />
          </label>
          <label className="field">
            <span className="label">終了</span>
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => onField('endTime', e.target.value)}
            />
          </label>
        </div>
      )}

      {timeGuessed && !form.allDay && (
        <p className="hint">
          ⚠️ 午前/午後が明記されていないため時刻を推測しました。ご確認ください。
        </p>
      )}

      <label className="field">
        <span className="label">場所</span>
        <input
          type="text"
          value={form.location}
          onChange={(e) => onField('location', e.target.value)}
        />
      </label>

      <label className="field">
        <span className="label">メモ</span>
        <textarea
          className="notes"
          value={form.notes}
          onChange={(e) => onField('notes', e.target.value)}
        />
      </label>

      <button type="button" className="btn add" onClick={onAdd}>
        Google カレンダーに追加
      </button>
    </section>
  );
}
