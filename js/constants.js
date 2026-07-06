// ===================================================================
// Z-eiken 定数定義
// アプリ全体で使う不変の設定値をここに集約する。
// ===================================================================

/** Firebase プロジェクト設定（v8 compat SDK 用） */
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCOP4iunnWjSE9C4LHwYBPVjLcTsKETRs8',
  authDomain: 'eiken-37781.firebaseapp.com',
  projectId: 'eiken-37781',
  storageBucket: 'eiken-37781.firebasestorage.app',
  messagingSenderId: '369428206114',
  appId: '1:369428206114:web:ec7d82d632609f2062707b',
};

/** 級キーの一覧（表示順） */
export const GRADES = ['5', '4', '3', 'p2', '2', 'p1'];

/** 級キー → 表示名 */
export const GRADE_NAMES = {
  5: '5級', 4: '4級', 3: '3級', p2: '準2級', 2: '2級', p1: '準1級',
};

/**
 * 級ごとのレベル区切り。VOCAB[grade] のインデックス範囲 [start, end)。
 * 各レベル約200語。
 */
export const LEVEL_MAP = {
  5: [[0, 200], [200, 400], [400, 600], [600, 680]],
  4: [[0, 200], [200, 400], [400, 561]],
  3: [[0, 200], [200, 400], [400, 600], [600, 746]],
  p2: [[0, 200], [200, 400], [400, 600], [600, 679]],
  2: [[0, 200], [200, 400], [400, 600], [600, 800], [800, 1000], [1000, 1200], [1200, 1388]],
  p1: [[0, 200], [200, 400], [400, 600], [600, 800], [800, 1000], [1000, 1200],
       [1200, 1400], [1400, 1600], [1600, 1800], [1800, 2000], [2000, 2200],
       [2200, 2400], [2400, 2596]],
};

/** 単語クイズ 1セットの問題数 */
export const VOCAB_SET_SIZE = 20;

/** 100問テストの設定 */
export const TEST = {
  QUESTION_COUNT: 100,   // 出題数
  TIME_LIMIT_SEC: 480,   // 制限時間（8分）
  PASS_SCORE: 95,        // 合格ライン
};

/** ミス帳の設定 */
export const MISTAKES = {
  MAX_ENTRIES: 200,      // 保存上限（超過分は古い順に破棄）
  GRADUATE_CORRECT: 3,   // この回数正解で卒業（ノートから削除）
  REVIEW_POOL_SIZE: 30,  // 復習クイズの出題対象数（苦手度上位）
};

/** 早押しバトルの設定 */
export const BATTLE = {
  MAX_PLAYERS: 6,
  TOTAL_QUESTIONS: 10,
  TIME_LIMIT_SEC: 8,
  CHOICE_COUNT: 4,
  ADVANCE_DELAY_MS: 3500, // 全員回答後、次の問題へ進むまでの待ち
};

/** 設定パネルで選べるテーマ */
export const THEMES = [
  { id: 'light',  label: '☀️ ライト',   bg: '#F2F0EB', app: '#FFFFFF', pri: '#1A4FBF', txt: '#1A1A2E' },
  { id: 'dark',   label: '🌙 ダーク',   bg: '#111318', app: '#1C1F26', pri: '#5B8CFF', txt: '#E8EAFE' },
  { id: 'blue',   label: '🌊 ブルー',   bg: '#E8F4FD', app: '#FFFFFF', pri: '#0077B6', txt: '#003559' },
  { id: 'green',  label: '🌿 グリーン', bg: '#EAF5EE', app: '#FFFFFF', pri: '#2D7D46', txt: '#1A3A24' },
  { id: 'purple', label: '💜 パープル', bg: '#F3EEF9', app: '#FFFFFF', pri: '#7B2FBE', txt: '#2A1050' },
];

/** お知らせ（新しい順） */
export const NOTIFICATIONS = [
  { id: 'notif_004', date: '2025-06-10', title: '⚡ 早押し対戦モード追加！',
    body: '友達とURLを共有してリアルタイム早押しクイズで対戦できるようになりました！最大6人で対戦可能です。' },
  { id: 'notif_003', date: '2025-05-20', title: '🌙 ダークモード対応',
    body: '設定からダークモードに切り替えられるようになりました。夜間の学習に目に優しい表示です。' },
  { id: 'notif_002', date: '2025-04-15', title: '📊 学習グラフ改善',
    body: '進捗確認の画面に日別グラフを追加しました。学習の継続具合が一目で分かります。' },
  { id: 'notif_001', date: '2025-03-01', title: '🚀 Z-eiken リリース！',
    body: '英検単語学習アプリZ-eikenを公開しました！単語練習・模擬テスト・まちがいノートなど多彩なモードで学習できます。' },
];

/** localStorage のキー名（表記ゆれ防止のため一元管理） */
export const LS_KEYS = {
  LAST_GRADE: 'eiken_lastGrade',
  WORD_STATUS: 'eiken_wordStatus',
  DAILY_PREFIX: 'eiken_daily_',   // + YYYY-MM-DD
  MISTAKES: 'eiken_mistakes',
  PASSES: 'eiken_passes',
  USER: 'eiken_user',
  READ_NOTIFS: 'zeiken_read_notifs',
  SETTINGS: 'zeiken_settings',
  THEME: 'zeiken_theme',
};
