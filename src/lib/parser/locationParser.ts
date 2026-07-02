const ONLINE =
  /(Google\s*Meet|Microsoft\s*Teams|Teams|Zoom|ｚｏｏｍ|オンライン|ウェビナー|Webex|Skype)/i;

// 建物・会場っぽい語。接尾辞の前に最大12文字（ひらがな=助詞は含めず名前部分だけ拾う）、
// 後ろに「3F」「2階」等を許容。
const BUILDING =
  /[\p{Script=Han}\p{Script=Katakana}\p{Script=Latin}0-9０-９〇ー・]{0,12}(?:ビル|ホール|会館|センター|キャンパス|大学|本社|支社|オフィス|プラザ|タワー|ルーム|教室|講堂)(?:[0-9０-９]{1,3}\s*(?:F|Ｆ|階))?/u;

/** 場所を抽出。なければ ''。 */
export function extractLocation(text: string): string {
  // 1) 明示キーワード行
  for (const ln of text.split(/\r?\n/)) {
    const m = ln.match(/(?:場所|会場|開催場所|開催地|住所|会議室)\s*[:：]\s*(.+)/);
    if (m && m[1].trim()) return m[1].trim();
  }

  // 2) @ 表記
  const at = text.match(/[@＠]\s*([^\s、。\n]+)/);
  if (at) return at[1].trim();

  // 3) 建物・会場名
  const b = text.match(BUILDING);
  if (b) return b[0].replace(/\s+/g, '').trim();

  // 4) オンライン系
  const on = text.match(ONLINE);
  if (on) return on[0];

  // 5) 「〜にて」
  const nite = text.match(/([\p{L}0-9０-９〇ー・]{1,20}?)にて/u);
  if (nite) return nite[1];

  return '';
}
