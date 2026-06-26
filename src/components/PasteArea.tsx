import { useRef } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onPaste: (v: string) => void; // 貼り付け確定後の全文
  onAnalyze: () => void;
  onClear: () => void;
}

export function PasteArea({ value, onChange, onPaste, onAnalyze, onClear }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  return (
    <section className="paste">
      <textarea
        ref={ref}
        className="paste-input"
        value={value}
        placeholder="ここに予定のテキストを貼り付け（メール・LINE・就活マイページなど）"
        onChange={(e) => onChange(e.target.value)}
        onPaste={() => {
          // 既定の貼り付け反映後の全文を読んで解析する
          setTimeout(() => onPaste(ref.current?.value ?? ''), 0);
        }}
      />
      <div className="paste-actions">
        <button type="button" className="btn primary" onClick={onAnalyze}>
          解析する
        </button>
        <button type="button" className="btn ghost" onClick={onClear}>
          クリア
        </button>
      </div>
    </section>
  );
}
