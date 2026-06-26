import { defineConfig } from 'vitest/config';

// パーサ単体テストは純関数。PWA プラグインを読み込まない軽量設定で実行する。
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
