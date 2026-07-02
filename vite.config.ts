import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub プロジェクトページ用に base を固定。
// リポジトリ名を変える場合はこの 1 箇所だけ変更すれば scope/start_url も追従する。
const base = '/schedule-capture/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/maskable.svg', 'icons/apple-touch-icon-180.png'],
      manifest: {
        name: '予定クイックキャプチャ',
        short_name: '予定キャプチャ',
        description: '貼るだけで Google カレンダーに予定を登録',
        lang: 'ja',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4f46e5',
        icons: [
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
          { src: 'icons/apple-touch-icon-180.png', sizes: '180x180', type: 'image/png' },
        ],
        // Android 等の共有メニューから起動(インストール済み PWA のみ)。
        // iOS は非対応なので既存の ?text= ショートカット経路を併用する。
        share_target: {
          action: base,
          method: 'GET',
          params: { title: 'title', text: 'text', url: 'url' },
        },
      } as import('vite-plugin-pwa').ManifestOptions & { share_target: unknown },
      workbox: {
        navigateFallback: base + 'index.html',
      },
    }),
  ],
});
