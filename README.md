# ミニシューティングゲーム

## 公開先

- [Mini Shooting Game](https://gunj0.github.io/shooting/)

## 技術スタック

- Vanilla JavaScript (ES Modules)
- HTML / CSS

## ローカルでの実行

ES Modules はファイルを直接ブラウザで開くと動作しません。ローカル HTTP サーバーを使ってください。

```bash
npx serve .
```

起動後、ブラウザで表示された URL を開いてください。

## ディレクトリ構成

```
.
├── index.html          # エントリーポイント
├── style/
│   └── style.css       # スタイル
├── js/
│   ├── script.js       # ゲームループ・イベント登録
│   ├── state.js        # 状態の初期化
│   ├── systems.js      # ゲーム進行ロジック
│   ├── render.js       # DOM 描画
│   ├── storage.js      # localStorage 読み書き
│   ├── constants.js    # 全定数
│   └── utils.js        # 汎用純粋関数
├── tests/              # ユニットテスト
└── docs/
    ├── 設計書.md        # ゲーム設計書
    └── コーディング規約.md # コーディング規約
```

## 開発ルール

- パッケージ管理は `pnpm` を使用（`npm` は使用しない）
- テストは依存関係を最小化する方針とし、原則として Node.js 標準の `node:test` / `node:assert` を使用

詳細は [docs/コーディング規約.md](./docs/コーディング規約.md) を参照してください。

## テスト

```bash
pnpm test
```

`tests/` 配下のユニットテストが実行されます。

## コントリビューション

[CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。

## ドキュメント

- [docs/設計書.md](./docs/設計書.md) — ゲーム仕様・アーキテクチャ設計
- [docs/コーディング規約.md](./docs/コーディング規約.md) — コーディングルール

