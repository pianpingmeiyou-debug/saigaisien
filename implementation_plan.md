# 明日の環（アスノワ）改善仕様書に基づく改修計画

## 1. 概要
`asunowa_improvement_spec.md` に基づき、現在のプロトタイプを認証（Google/LINE/デモ）、ユーザー管理（表示名・登録地域・役割・凍結）、通報システム（理由選択・重複防止・5件以上一時非表示・管理者確認）、管理者機能（/admin: 災害レベル・通報・ユーザー管理・凍結）、レスポンシブPC上部タブUI・ヘッダー災害レベル移動、地図画像アップロード修正、チャット送受信者表示修正、ヘルプセンター完全削除に対応した完全なアプリケーションへ改善します。

## 2. 実装計画

### Phase 1: コンフリクト解消 & 共通基盤整理
- `app/layout.tsx`, `lib/supabase/proxy.ts`, `next-env.d.ts`, `package-lock.json`, `app/account/declaration/page.tsx`, `app/home/page.tsx`, `app/matching/page.tsx` のコンフリクトマーカーを解消
- ヘルプセンター（`app/help`）の完全削除およびリンク・ルーティングの削除
- 47都道府県・全国市区町村データ拡充（初期レベルLv0、全都道府県主要市区町村）

### Phase 2: データ型 & ストア設計（lib/types.ts, lib/store.ts）
- ユーザー役割（被災者 victim / 支援者 supporter / 共助 both）
- プロフィール（id, display_name, role: user/admin, user_role: victim/supporter/both, region_pref, region_city, account_status: active/frozen, linked_providers: google/line）
- 投稿型（id, user_id, user_name, type: request/offer, category, title, description, received_location, received_pref, received_city, urgency, created_at, status: published/hidden/deleted, report_count）
- 通報型（id, reporter_user_id, target_type: post/map_pin/chat_user, target_id, reason, detail, status: pending/deleted/rejected, created_at）
- チャット型（id, post_id, post_title, victim_id, supporter_id, messages: {id, chat_id, sender_id, sender_name, body, created_at}[], status）
- 地図ピン型（id, user_id, author_name, type, title, content, lat, lng, image_url, report_count, status）
- 5件以上の通報による自動一時非表示ロジック
- 重複通報防止ロジック
- ユーザー凍結時制限チェック（閲覧可、投稿・チャット・通報不可、凍結警告文言表示）

### Phase 3: UI/UX & ナビゲーション改修（app/page.tsx, app/globals.css）
- PCおよびスマホ向けの上部タブナビゲーション（[ホーム] [地図] [検索] [チャット] [マイページ]）常時表示
- ヘッダーへの登録地域および災害レベル常時表示（フッターからは削除）
- レスポンシブデザインの最適化（PC・タブレット・スマートフォンでのはみ出し防止、文字切れ解消）
- 投稿カードへの投稿者「表示名」表示、役割（被災者=依頼 / 支援者=提供 / 共助=依頼・提供両方）に応じた投稿機能

### Phase 4: マイページ & 投稿履歴管理（app/account/page.tsx, app/account/history/page.tsx 等）
- プロフィール編集（表示名、登録地域、役割: 被災者/支援者/共助）
- アカウント連携（Google / LINE連携UI）
- 自分の投稿履歴一覧、投稿の編集・削除機能
- 凍結アカウント時の案内メッセージ表示

### Phase 5: 認証フロー（app/auth/login, sign-up, /auth/setup）
- Googleログイン / LINEログイン / ログインせずに見る（デモ）
- 初回ユーザー設定（表示名入力、登録地域選択、役割選択）
- GoogleとLINEの同一アカウント連携機能

### Phase 6: 地図 & 画像アップロード（components/disaster-map.tsx, app/map-pin/new/page.tsx）
- 地図ピン作成時の画像アップロード（PNG/JPG/JPEG 2.5MB以下、プレビュー表示 & Supabase Storage / ローカルDataURL保存）
- ピン選択時の画像表示不具合修正
- 地図ピンへの通報ダイアログ（選択式理由、確認、送信）

### Phase 7: 通報ダイアログ（検索投稿・地図ピン・チャットユーザー）
- 共通通報ダイアログコンポーネント（7つの固定理由 + その他自由記述、重複防止、5件以上で一時非表示）

### Phase 8: チャット機能改善（app/chat/page.tsx）
- ログイン中ユーザーIDと`sender_id`の比較による左右正しい吹き出し表示
- チャット相手への通報機能追加
- 凍結ユーザーの送信制限

### Phase 9: 管理者コンソール（app/admin/page.tsx, /admin/*）
- admin権限チェック（一般ユーザー・未ログインはアクセス制限）
- 3カテゴリタブ:
  1. 災害・レベル管理（全国市区町村Lv0初期値、レベル変更機能）
  2. 通報・投稿管理（通報一覧、投稿削除 / 通報却下・再公開）
  3. ユーザー管理（全ユーザー一覧、権限表示、凍結 / 凍結解除切り替え）

### Phase 10: ビルド検証・テスト
- `npm run build` でTypeScript / Turbopackビルドエラー 0件を確認
