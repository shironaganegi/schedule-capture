// イベント語（長い順に評価して、より具体的な件名を優先）。
const KEYWORDS = [
  '会社説明会', '合同説明会', '説明会',
  'カジュアル面談', '一次面接', '二次面接', '三次面接', '最終面接', '面接', '面談', '面談会',
  'グループディスカッション', 'グループワーク',
  'セミナー', '選考会', '選考', '筆記試験', '適性検査', 'webテスト', '試験',
  'ガイダンス', 'インターンシップ', 'インターン', '懇親会', '勉強会', 'イベント',
];

function clean(s: string): string {
  return s.trim().replace(/^[【\[][^】\]]*[】\]]\s*/, '');
}

/** 件名を抽出。空にしない。 */
export function extractTitle(text: string): string {
  const lines = text.split(/\r?\n/);

  // 1) 明示の件名行
  for (const ln of lines) {
    const m = ln.match(/(?:件名|題名|タイトル|subject)\s*[:：]\s*(.+)/i);
    if (m && m[1].trim()) return clean(m[1]);
  }

  // 2) イベント語（長い順）
  const sorted = [...KEYWORDS].sort((a, b) => b.length - a.length);
  for (const k of sorted) {
    if (text.toLowerCase().includes(k.toLowerCase())) return k;
  }

  // 3) フォールバック: 先頭の非空行
  const first = lines.map((l) => l.trim()).find((l) => l.length > 0);
  return first ? clean(first).slice(0, 60) : '予定';
}
