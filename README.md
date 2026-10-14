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

## ローカルビンゴ — BINGO CLUB

http://localhost:8086/bingo で、ログイン不要のビンゴゲームを遊べます。
既存の日報機能とは独立した、React + Tailwind CSS + GSAP の画面です。
1台のPC・1つのタブで、司会者画面と参加者画面を切り替えて使います。

### ルールと進行

| 全員共通の盤面 | 抽選範囲 | ビンゴに必要な列数 |
| --- | --- | --- |
| 3×3 | 1〜27 | 1〜8列 |
| 5×5（初期値） | 1〜75 | 1〜12列 |
| 7×7 | 1〜147 | 1〜16列 |

- 開始前に盤面・必要列数（初期値1）・参加者名を設定します。参加者は1人以上、1人につき1つの名前入力欄（動的に追加・削除可）、名前は40文字までです。
- カードは参加者ごとにランダム生成します。列による数字範囲の制約はなく、カード内の数字は重複しません。中央は全サイズでFREEです。
- 縦・横・盤面全体を横切る2本の斜めを数え、設定列数以上でビンゴ成立です。
- **司会者が1つ抽選 → 全員のカードを同じ画面で確認 → まとめて確認完了 → 勝敗判定**の順に進みます。
- 全参加者のカードを1つの画面に一覧表示します。人数や画面幅に応じて折り返し、必要な場合は縦スクロールで確認できます。結果画面にも全員のカードを表示します。
- 抽選した数字は全員のカードで同時に開きます。ルーレット下のボタンは、抽選前は「ルーレットを回す」、抽選後は「全員の確認を完了」に切り替わります。確認ボタンを1回押すとラウンドを確定します。全員の確認前には次の抽選や結果確定はできません。
- 各カードで、あと1つの数字で設定列数に届く場合は「リーチ」を表示します。新たにリーチになったターンには、大きな「REACH!」・参加者名・紙吹雪の全画面演出（約2.6秒）を出します。既にリーチの参加者には毎ターン再表示しません。
- 1回約1.4秒のルーレット演出と、ブラウザ内で生成する短いドラムロール音を再生します。音量の調整ではなく、各自で音のON/OFFを切り替えられます。
- 成立者がいなければ司会者画面に戻ります。最初に成立者が出たターンで終了し、同じターンの成立者は全員同率1位です。数字は再抽選されません。
- 開始前に設定した景品名を結果画面に表示し、同率1位の参加者にもそれぞれ贈ります。初期値は「ビンゴチャンピオン賞」です。
- 全員の確認で勝敗を確定すると、「BINGO!」・優勝者全員の名前・景品の全画面演出（約3.4秒）を表示します。同じターンにビンゴ成立者がいる場合は、リーチ演出より勝敗確定後のビンゴ演出を優先します。演出は自動終了し、スキップボタンやEscでも閉じられます。再読み込みでは演出を再生し直しません。
- ゲーム中の設定変更・参加者の追加や退出には対応しません。「ゲームを破棄して設定へ戻る」は確認ダイアログ後に保存データを削除します。新しいゲームでは設定・参加者・景品名を入力し直します。

### 保存と再開

- 設定済みのルール・景品名・全カード・抽選履歴・抽選後の確認状態・結果を、各操作時にブラウザの `localStorage` へ保存します。開始前の入力途中の設定は保存しません。ルーレットの結果は演出完了時に保存されます。
- 同じブラウザの同じURLのオリジン（ホスト・ポート・プロトコル）で開くと、自動で再開します。再読み込みで数字が引き直されたり、確認状態が失われたりすることはありません。
- 保存失敗時はエラーを表示し、ゲームを進めません。不正な保存データは自動上書きしません。複数タブでの同時プレイは非対応で、別タブの変更を検知した場合は再読み込みを案内します。
- データはサーバーや他の端末には同期されません。ブラウザのサイトデータ削除やプライベートモード終了で失われる場合があります。画面の表示・再読み込みにはローカルのWebサーバーが必要です。
- OSの「視差効果を減らす」などの設定時はGSAPのアニメーションを停止します。
- ドラムロールはブラウザ内で生成し、外部への通信はしません。初回操作やブラウザの設定により音声を再生できない場合は、画面に案内を表示します。

依存関係・画面のビルドと関連テスト:

```bash
docker compose exec app npm install
docker compose exec app npm run build
docker compose exec app npm run test:bingo
docker compose exec app php artisan test --filter='BingoTest|ExampleTest'
```

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
