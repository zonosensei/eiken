# Z-eiken（クリーン版）

英検単語学習 PWA。旧・単一HTML版（3,035行）を保守可能なマルチファイル構成へ全面書き直したもの。

## 互換性（重要）
- **Firestore スキーマ・localStorage キーは旧版と完全互換。** 既存生徒の学習ログ・進捗・ミス帳・合格記録・ランキングはそのまま引き継がれる。
- 合格記録のクラウド保存フィールド名は歴史的経緯で `pass_pass_…` の二重接頭辞（意図的に維持）。

## 構成
```
index.html          画面シェル（ログイン・ヘッダー・モードカード）
manifest.json       PWA マニフェスト / icon-192.png
css/styles.css      全スタイル（テーマは CSS 変数で切替）
assets/logo1.png    ロゴ（旧版の base64 埋め込みを外出し）
data/vocab.js       語彙データ 6,650語（5級〜準1級）
data/students.js    生徒名簿・スタッフID
js/
  constants.js      定数（級・レベル・テスト設定・テーマ・LSキー）
  state.js          セッション中の可変状態
  storage.js        localStorage 層
  cloud.js          Firestore 層（スキーマはここに集約）
  audio.js          効果音・発音（設定の音量を反映）
  quiz.js           出題エンジン
  mistakes-store.js まちがいノートのデータ操作
  router.js / ui.js / dom.js / settings.js / auth.js / app.js
  views/            vocab / test / mistakes / wordlist / ranking / stats / battle
```

## デプロイ
ディレクトリごと GitHub Pages（zonosensei.github.io/eiken）へ配置するだけ。
ES modules を使用しているため **http(s) 経由での配信が必要**（file:// 直開きは不可）。

## 旧版からの変更点
- 音量設定が実際に全効果音へ反映されるようになった（旧版は保存のみで未使用）
- バトル結果画面でホストが「もう一度遊ぶ」を押しても画面が進まないバグを修正
- `showCountdown` の二重定義を統一、未使用コードを削除
- 動的文字列の HTML エスケープを導入（XSS 対策）
