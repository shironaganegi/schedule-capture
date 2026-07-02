import { useCallback, useState } from 'react';
import { PasteArea } from './components/PasteArea';
import { EventForm } from './components/EventForm';
import { parseEvent } from './lib/parser/parseEvent';
import { buildGcalUrl } from './lib/gcal';
import { downloadIcs } from './lib/ics';
import type { FormState } from './lib/parser/types';

const EMPTY: FormState = {
  title: '',
  date: '',
  startTime: '',
  endTime: '',
  allDay: false,
  location: '',
  notes: '',
};

const MAX_INPUT = 2000;

// ?text= 起動（iOS ショートカット共有）の初期テキスト
function readLaunchText(): string {
  const t = new URLSearchParams(window.location.search).get('text');
  return t ? t.slice(0, MAX_INPUT) : '';
}

// 起動時テキストはページロード時に一度だけ解析する
const LAUNCH_TEXT = readLaunchText();
const LAUNCH_PARSED = LAUNCH_TEXT ? parseEvent(LAUNCH_TEXT, new Date()) : null;

function toForm(p: NonNullable<typeof LAUNCH_PARSED>): FormState {
  return {
    title: p.title,
    date: p.date,
    startTime: p.startTime,
    endTime: p.endTime,
    allDay: p.allDay,
    location: p.location,
    notes: p.notes,
  };
}

export default function App() {
  const [text, setText] = useState(LAUNCH_TEXT);
  const [form, setForm] = useState<FormState>(LAUNCH_PARSED ? toForm(LAUNCH_PARSED) : EMPTY);
  const [dirty, setDirty] = useState<Set<keyof FormState>>(new Set());
  const [timeGuessed, setTimeGuessed] = useState(!!LAUNCH_PARSED?.guessed.time);

  // 解析結果をフォームへ反映。ユーザーが触った(dirty)フィールドは上書きしない。
  const applyParsed = useCallback(
    (raw: string) => {
      const p = parseEvent(raw, new Date());
      setForm((prev) => {
        const next = { ...prev };
        const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
          if (!dirty.has(k)) next[k] = v;
        };
        set('title', p.title);
        set('date', p.date);
        set('startTime', p.startTime);
        set('endTime', p.endTime);
        set('allDay', p.allDay);
        set('location', p.location);
        set('notes', p.notes);
        return next;
      });
      if (!dirty.has('startTime')) setTimeGuessed(!!p.guessed.time);
    },
    [dirty],
  );

  const handlePaste = (raw: string) => {
    const t = raw.slice(0, MAX_INPUT);
    setText(t);
    applyParsed(t);
  };

  const handleField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty((prev) => new Set(prev).add(key));
    if (key === 'startTime') setTimeGuessed(false);
  };

  const handleClear = () => {
    setText('');
    setForm(EMPTY);
    setDirty(new Set());
    setTimeGuessed(false);
  };

  const handleAdd = () => {
    window.open(buildGcalUrl(form), '_blank', 'noopener');
    // 連続登録に備えて全リセット
    handleClear();
  };

  return (
    <div className="app">
      <header className="header">
        <h1>予定クイックキャプチャ</h1>
        <p className="sub">貼って、確認して、カレンダーへ。</p>
      </header>

      <PasteArea
        value={text}
        onChange={setText}
        onPaste={handlePaste}
        onAnalyze={() => applyParsed(text)}
        onClear={handleClear}
      />

      <EventForm
        form={form}
        timeGuessed={timeGuessed}
        onField={handleField}
        onAdd={handleAdd}
        onDownloadIcs={() => downloadIcs(form)}
      />

      <footer className="footer">
        貼ったテキストはどこにも送信されません（解析はすべてブラウザ内）。
        カレンダー登録時のみ予定内容が Google に渡ります。
      </footer>
    </div>
  );
}
