# 予定クイックキャプチャ

就活・大学などの予定を「貼るだけ」で Google カレンダーに登録できる静的 PWA。
メール・LINE・就活マイページなど、どこから来た予定でも **テキストをコピーして貼る** の一手で登録できる。

## 特徴

- **完全クライアントサイド**: 解析（件名・日付・時刻・場所の抽出）はすべてブラウザ内のルールベースで完結。外部 API・APIキー・LLM・バックエンドは一切なし。
- **認証不要の登録**: Google カレンダーのテンプレート URL（`action=TEMPLATE`）を事前入力状態で開くだけ。保存画面で登録先カレンダー（「就活」等）を選んで保存する。
- **`?text=` 対応**: `?text=明日14時に〇〇ビルで説明会` で開くと、貼り付けなしで自動解析される（iOS ショートカットからの共有入口）。
- **インストール可能な PWA**: iPhone Safari の「ホーム画面に追加」でアプリのように使える。

## プライバシー

- 貼ったテキストは **どこにも送信されません**（解析はすべてブラウザ内）。
- **Google カレンダー登録の瞬間だけ**、予定内容（件名・日時・場所・メモ）が Google に渡ります。
- アナリティクスなし・秘密情報なし。**公開リポジトリでも安全に使えます。**

## 開発

```bash
npm install
npm run dev      # 開発サーバ
npm run test     # パーサ単体テスト（vitest）
npm run build    # 型チェック + 本番ビルド（dist/）
npm run preview  # ビルド成果物をプレビュー
```

> `predev`/`prebuild` で `scripts/gen-icons.mjs` が走り、apple-touch-icon の PNG を依存ゼロで自動生成します。

## 解析が拾える形式（例）

- `2025年7月3日（木）14:00〜15:30 〇〇ビル3F 会社説明会`
- `明日14時に〇〇ビルで説明会`
- `来週月曜 午後2時半 オンライン面談`
- `7/3 14時`（年なしは最近接の未来。当日は今年扱い）

崩れた口語表現は取りこぼすことがあります。フォームはすべて編集可能なので、外したら手修正してください。
午前/午後が明記されていない時刻は常識で推測し、**「推測」マーク**で確認を促します。

## デプロイ（GitHub Pages）

リポジトリ名は **`schedule-capture`** 前提（`vite.config.ts` の `base = '/schedule-capture/'`）。
別名にする場合は `vite.config.ts` の `base` を変更すれば manifest の `scope`/`start_url` も追従します。

1. このコードを `schedule-capture` という名前の GitHub リポジトリに push する。
2. リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定する。
3. `main` ブランチへの push で `.github/workflows/deploy.yml` が自動でビルド・デプロイする。
4. 公開 URL: `https://<ユーザー名>.github.io/schedule-capture/`

## スコープ外

iOS ショートカット本体 / .ics 出力 / 複数イベント同時登録 / メール自動取り込み / Notion 連携 / 通知・リマインダー。
1 回の貼り付けにつき 1 イベント。
