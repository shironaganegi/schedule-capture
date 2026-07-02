import { PasteArea } from './components/PasteArea';
import { EventForm } from './components/EventForm';
import { DraftTabs } from './components/DraftTabs';
import { HistoryPanel } from './components/HistoryPanel';
import { Toast } from './components/Toast';
import { useCapture } from './hooks/useCapture';
import { useHistory } from './hooks/useHistory';
import { useToast } from './hooks/useToast';
import { buildGcalUrl } from './lib/gcal';
import { downloadIcs } from './lib/ics';
import { readLaunchText } from './lib/launchParams';

// ?text=（iOS ショートカット）/ ?title=&text=&url=（Web Share Target）起動の初期テキスト。
// ページロード時に一度だけ読み、以後の再表示・履歴汚染を避けるためクエリを消す。
const LAUNCH_TEXT = readLaunchText(window.location.search);
if (LAUNCH_TEXT) {
  window.history.replaceState(null, '', window.location.pathname);
}

export default function App() {
  const cap = useCapture(LAUNCH_TEXT);
  const history = useHistory();
  const { toast, show, dismiss } = useToast();

  const handleAdd = () => {
    const before = cap.snapshot();
    window.open(buildGcalUrl(cap.active.form), '_blank', 'noopener');
    history.add(cap.active.form);
    const remaining = cap.drafts.filter((d, i) => i !== cap.activeIndex && !d.added);
    const doneCount = cap.drafts.filter((d) => d.added).length + 1;
    if (remaining.length === 0) {
      // 全件登録済み: 連続登録に備えて全リセット
      cap.clearAll();
      const message =
        cap.drafts.length > 1 ? `${cap.drafts.length}件すべて登録しました` : '登録しました';
      show(message, { actionLabel: '元に戻す', onAction: () => cap.restoreSnapshot(before) });
    } else {
      cap.markAdded();
      show(`${doneCount}/${cap.drafts.length}件を追加しました`, {
        actionLabel: '元に戻す',
        onAction: () => cap.restoreSnapshot(before),
      });
    }
  };

  const handleIcs = () => {
    downloadIcs(cap.active.form);
    history.add(cap.active.form);
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
        onCompositionChange={cap.setComposing}
      />

      <DraftTabs drafts={cap.drafts} activeIndex={cap.activeIndex} onSelect={cap.selectDraft} />

      <EventForm
        form={cap.active.form}
        timeGuessed={cap.active.timeGuessed}
        onField={cap.updateField}
        onAdd={handleAdd}
        onDownloadIcs={handleIcs}
      />

      <HistoryPanel
        entries={history.entries}
        onRestore={cap.restoreForm}
        onRemove={history.remove}
        onClear={history.clear}
      />

      <footer className="footer">
        貼ったテキストはどこにも送信されません（解析はすべてブラウザ内）。
        カレンダー登録時のみ予定内容が Google に渡ります。 履歴はこの端末にのみ保存されます。
      </footer>

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
