# Copilot Instructions

## 言語ルール

- このリポジトリで新規作成・更新するドキュメントは日本語で記載すること。
- Copilot のチャット応答、進捗共有、実装説明も日本語で記載すること。

## ビルド・テスト・lint

- パッケージ管理は `pnpm` を使用し、`npm` は使用しない。
- 脆弱性対応の観点から、テスト基盤は依存関係が最小の構成を優先する。
- テストは原則として Node.js 標準の `node:test` / `node:assert` を用い、外部テストライブラリの追加は明確な理由がある場合に限る。
- 自動テスト実行コマンドは `pnpm test` とする。

## アーキテクチャ概要

- これは `index.html`・`style/style.css`・ES Modules の JavaScript で構成された静的なブラウザゲーム。`index.html` から `<script type="module" src="js/script.js">` で直接読み込んでおり、バンドラやフレームワークは使っていない。
- `js/script.js` は全体の司令塔で、DOM 要素の取得、キーボード入力、開始・再開フロー、`requestAnimationFrame` のループ、被弾フラッシュ、高スコア更新を担当する。
- `js/state.js` はミュータブルな `gameState` の初期化を担当する。`js/constants.js` にゲーム領域サイズ、各エンティティサイズ、速度、保存キー、演出時間、パワーアップ値、`DIFFICULTY_SETTINGS` が集約されている。
- `js/systems.js` はゲーム進行ロジックをまとめた層で、難易度更新、プレイヤー移動、自動発射、敵とパワーアップの生成、位置更新、当たり判定、スコア加算、演出寿命の更新を担当する。
- `js/render.js` は毎フレーム `#game` の中身を空にして、絶対配置した `div` 要素を再構築する。見た目は `player` / `bullet` / `enemy` / `powerup` / `effect-*` などのクラス名で `style/style.css` と結び付いている。
- `js/storage.js` は高スコアの `localStorage` 読み書きだけを担当する。
- `js/utils.js` はゲームロジックに依存しない純粋関数（`clamp`・`isColliding`）を提供する。複数モジュールで共有できる副作用のない関数はここに追加する。

## 主要な規約

- 設計書どおり、外部ライブラリなしの Vanilla JS を維持すること。描画は canvas ではなく `div` ベース、画像アセットも使わない前提。
- `js/script.js` のフレーム更新順は崩さないこと。難易度更新 -> 入力反映 -> 発射 -> 弾移動 -> 敵生成 -> パワーアップ生成 -> 敵移動 -> パワーアップ移動 -> 当たり判定 -> 演出更新 -> 描画、という順序に意味がある。
- ゲームバランスやサイズ・速度・時間調整は `js/constants.js` を単一の調整ポイントとして扱い、マジックナンバーを他ファイルへ散らさないこと。
- `js/systems.js` は共有 state を直接更新するスタイルで統一されている。配列更新は `map(...).filter(...)` で置き換える実装に合わせること。
- 画面状態は `hasStarted` と `isGameOver`、および overlay の `hidden` クラスで管理する。別画面遷移やルーティングを導入しない前提で拡張すること。
- 再開導線は 2 種類ある。`RESTART` ボタンはタイトル画面に戻し、スペースキーは即時リトライする。
- 高スコアは `createInitialState(loadHighScore())` で初期化し、`js/script.js` の `updateHighScore()` から保存する。`js/storage.js` にゲーム進行ロジックを持ち込まないこと。
- スペースキーと左右キーでは `preventDefault()` を呼び、ブラウザのスクロール動作を抑止する前提を維持すること。

## 命名規則

- 変数・関数: `camelCase`（例: `bulletSpeed`, `updateEnemies`）
- モジュールトップレベルの定数: `SCREAMING_SNAKE_CASE`（例: `GAME_WIDTH`, `SHOOT_INTERVAL`）
- CSS クラス名: `kebab-case`（例: `game-area`, `hit-flash`）
- HTML 要素 ID: `camelCase`（例: `gameOverOverlay`, `finalScore`）
- ブール値: `is` / `has` プレフィックスを付ける（例: `isGameOver`, `hasStarted`）
- イベントハンドラ関数: `handle` プレフィックスを付ける（例: `handleKeyDown`, `handleKeyUp`）

## テスト作成指針

- **テストする対象**: `js/systems.js`・`js/state.js`・`js/storage.js`・`js/utils.js` の純粋関数または副作用が限定的な関数。
- **テストしない対象**: `js/render.js`・`js/script.js` のような DOM / `requestAnimationFrame` に依存するコード（Node.js 環境では動作しないため）。
- テストファイルは `tests/<モジュール名>.test.js` に配置する。
- テスト名は「何が・どういう条件で・どう振る舞う」を日本語で記述する（例: `"updateBullets は弾を上へ移動し、画面外の弾を削除する"`）。
- `Math.random` などグローバルをモックした場合は、テスト終了後に必ず元に戻す。

## 新規ファイル・機能追加のルール

- 新しいエンティティや機能を追加する場合: 定数 → systems → render → script の順に追加する。
- 新しいファイルを追加する場合: `docs/設計書.md` のファイル分割構成も更新する。
- 仕様変更（エンティティ型・操作・定数設計など）が伴う場合: `docs/設計書.md` の該当セクションも同時に更新する。
- 詳細なコーディングルールは [docs/コーディング規約.md](../docs/コーディング規約.md) を参照すること。
