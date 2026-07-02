import { PasteArea } from './components/PasteArea';
import { EventForm } from './components/EventForm';
import { DraftTabs } from './components/DraftTabs';
import { useCapture, MAX_INPUT } from './hooks/useCapture';
import { buildGcalUrl } from './lib/gcal';
import { downloadIcs } from './lib/ics';

// ?text= 起動（iOS ショートカット共有）の初期テキスト。ページロード時に一度だけ読む。
function readLaunchText(): string {
  const t = new URLSearchParams(window.location.search).get('text');
  return t ? t.slice(0, MAX_INPUT) : '';
}

const LAUNCH_TEXT = readLaunchText();

export default function App() {
  const cap = useCapture(LAUNCH_TEXT);

  const handleAdd = () => {
    window.open(buildGcalUrl(cap.active.form), '_blank', 'noopener');
    const remaining = cap.drafts.filter((d, i) => i !== cap.activeIndex && !d.added);
    if (remaining.length === 0) {
      // 全件登録済み: 連続登録に備えて全リセット
      cap.clearAll();
    } else {
      cap.markAdded();
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>予定クイックキャプチャ</h1>
        <p className="sub">貼って、確認して、カレンダーへ。</p>
      </header>

      <PasteArea
        value={cap.text}
        onChange={cap.setText}
        onPaste={(raw) => cap.analyzeNow(raw)}
        onAnalyze={() => cap.analyzeNow()}
        onClear={cap.clearAll}
      />

      <DraftTabs drafts={cap.drafts} activeIndex={cap.activeIndex} onSelect={cap.selectDraft} />

      <EventForm
        form={cap.active.form}
        timeGuessed={cap.active.timeGuessed}
        onField={cap.updateField}
        onAdd={handleAdd}
        onDownloadIcs={() => downloadIcs(cap.active.form)}
      />

      <footer className="footer">
        貼ったテキストはどこにも送信されません（解析はすべてブラウザ内）。
        カレンダー登録時のみ予定内容が Google に渡ります。
      </footer>
    </div>
  );
}
