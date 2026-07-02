/**
 * 起動クエリから初期テキストを読む。
 * - iOS ショートカット連携: ?text=...
 * - Web Share Target(Android 等): ?title=...&text=...&url=...
 */
export function readLaunchText(search: string, max = 2000): string {
  const p = new URLSearchParams(search);
  const parts = [p.get('title'), p.get('text'), p.get('url')].filter(
    (v): v is string => !!v && !!v.trim(),
  );
  return parts.join('\n').slice(0, max);
}
