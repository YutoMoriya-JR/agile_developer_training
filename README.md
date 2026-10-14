# 日報管理システム

![Run Tests](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Run%20Tests/badge.svg)

## 概要
メンバーの作業状況や困りごとを共有する、Laravel + MySQL の日報管理システムです。

## 実装済みの機能

- 利用者登録、メールアドレス・パスワードによるログイン、ログアウト。
- 登録時に所属チームを指定。同名チームがあれば所属し、なければ作成。
- 日報は1人1日1件。対象日と作業内容・進捗は提出時必須、困りごと・相談事項と次の予定は任意。
- 下書きは本人だけが閲覧・編集・削除可能。作業内容が空でも下書き保存可能。
- 提出済みの日報はログイン済みの全員がチームをまたいで閲覧・コメント可能。
- 提出後も本人が編集可能。更新日時を表示し、削除や下書きへの差し戻しは不可。
- 過去の日付での作成・提出に対応。承認・差し戻しのフローはなし。
- 対象日の降順で表示し、日付・投稿者・チーム・キーワード・困りごとの有無で検索。
- 自分の日報・下書きへの切り替え、15件ごとのページ送り、日本語表示、スマートフォン対応。
- 日時表示の既定値は日本時間（`Asia/Tokyo`）。

## 初回利用

セットアップ後、http://localhost:8086/register から利用者を登録してください。
既定のパスワードや共通の管理者アカウントはありません。パスワードは12文字以上です。

### 初期版の範囲と運用前の確認

- 現在は自己登録方式です。URLにアクセスできる人が登録できるため、社外公開の前に招待制・社内ネットワーク制限などを決めてください。
- 役職別の管理操作、利用者の無効化・所属変更、パスワード再設定、メール認証は未実装です。
- 未提出者の確認、通知、承認、編集履歴、コメントの編集・削除は初期版に含みません。
- フィルタのチームは投稿者の現在の所属チームです。過去時点の所属は保存しません。
- 本番ではHTTPS、`APP_DEBUG=false`、適切なCookie設定、DBバックアップを設定してください。

# Laravel Docker Environment

- Udemyのフルスタックエンジニアになるためのスキルの学び方を学習するためのレポジトリです
- PHP 8.4 + nginx + MySQL を使用した Laravel プロジェクト用の Docker 環境です。

## 構成

- **Laravel**: 13.x（PHP 8.3 以上が必須）
- **PHP**: 8.4-fpm (Composer 2.10 / Node.js 24 / OPcache 含む)
- **Web Server**: nginx 1.30-alpine
- **Database**: MySQL 8.4 (LTS)
- **Port**: 8086 (HTTP), 3386 (MySQL), 5173 (Vite)
  - MySQL と Vite は `127.0.0.1` にのみバインドしており、外部からは接続できません
  - 本番では `.env` に `WEB_PORT=80` を指定して起動します

## 使い方

Laravel アプリは `src/` にすでに入っています。`composer create-project` は不要です。

### 1. 環境変数の設定（Docker 用）

```bash
cp .env.example .env
```

### 2. 開発環境の起動

```bash
docker compose up -d
```

### 3. Laravel のセットアップ

`vendor/` と `.env` は Git 管理外のため、初回だけ以下を実行します。

```bash
docker compose exec app bash

composer install
cp .env.example .env
php artisan key:generate

# .env の DB_CONNECTION を mysql に設定してから実行
# DB_HOST / DB_PORT / DB_DATABASE / DB_USERNAME / DB_PASSWORD は
# docker-compose.yml から渡される環境変数を使用
php artisan migrate
npm install
npm run build

exit
```

すでにセットアップ済みの場合は、既存の `.env` を上書きせず次を実行します。

```bash
docker compose exec app php artisan migrate
docker compose exec app npm install
docker compose exec app npm run build
```

MySQL接続の確認:

```bash
docker compose exec app php artisan migrate:status
```

### 4. アクセス

- アプリケーション: http://localhost:8086
- ヘルスチェック: http://localhost:8086/up

### 5. テストの実行

```bash
docker compose exec app php artisan test
```

テストでは `phpunit.xml` がSQLiteのメモリDBを強制指定します。
DockerのMySQL接続環境変数が設定されていても、通常のDBを消去しません。
設定をキャッシュしている場合は、先に `php artisan config:clear` を実行してください。

## よく使うコマンド

```bash
# コンテナの状況確認
docker-compose ps

# ログの確認
docker-compose logs -f

# PHPコンテナに入る
docker-compose exec app bash

# Composer実行
docker-compose exec app composer install

# Artisanコマンド実行
docker-compose exec app php artisan migrate

# 環境の停止
docker-compose down

# 環境の完全削除（データベースも削除）
docker-compose down -v
```

## 本番環境

本番環境では以下を想定：

- Aurora MySQL（ローカルの MySQL は使用しないケースを想定）

```bash
# 本番環境での起動
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## ディレクトリ構成

```
.
├── infra/
│   ├── mysql/          # MySQL設定
│   ├── nginx/          # nginx設定
│   └── php/            # PHP設定
├── src/                # Laravelプロジェクトを配置
├── docker-compose.yml  # 開発環境設定
├── docker-compose.prod.yml # 本番環境設定
└── .env.example        # 環境変数テンプレート
```

## 注意事項

- `src/` にアプリケーションが含まれています
- 本番環境では CloudFront と ACM を使用することを推奨
- データベースの永続化は `db-store` ボリュームで行われます

## tailwind CSS ver4 を使用する場合

vite.config.js を下記のコードで 5173 ポートを Docker のコンテナの外からもアクセスできるように開ける

```js
import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    laravel({
      input: ["resources/css/app.css", "resources/js/app.js"],
      refresh: true,
    }),
    tailwindcss(),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    hmr: {
      host: "localhost",
      port: 5173,
    },
  },
});
```
