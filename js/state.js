// ===================================================================
// アプリ状態
// セッション中に変化する可変状態をここに集約する。
// 永続化は storage.js / cloud.js が担当し、このモジュールは
// メモリ上の「今」だけを持つ。
// ===================================================================

import * as storage from './storage.js';

/** 今日の日付キー（YYYY-MM-DD） */
export const todayKey = new Date().toISOString().slice(0, 10);

export const state = {
  /** 現在の級（'5'|'4'|'3'|'p2'|'2'|'p1'） */
  grade: storage.loadLastGrade(),

  /** 現在のモード（'vocab'|'stats'|'mistakes'|'wordlist'|'test100'|'ranking'|'battle'） */
  mode: 'vocab',

  /** ログイン中ユーザー {uid, name} または null */
  currentUser: null,

  /** ログイン画面で選択中の級 */
  loginGrade: storage.loadLastGrade(),

  /** 単語クイズのレベル（1〜 / 0=全レベル） */
  currentLevel: 1,

  /** 単語クイズでレベル選択画面を出すフラグ */
  vocabShowLevelSelect: true,

  /** セッション累計スコア */
  score: { correct: 0, total: 0 },

  /** 当日の学習カウンター（localStorageと同期） */
  dailyStats: storage.loadDailyStats(todayKey),

  /** 単語ごとの正誤記録（localStorageと同期） */
  wordStatus: storage.loadWordStatus(),

  /**
   * 出題順シャッフルの進行位置。キーは "grade" または "grade-level"。
   * 値は {arr: number[], pos: number}。クラウドにも保存・復元される。
   */
  shuffledIdx: {},

  /** まちがいノート画面のアクティブタブ */
  mistakesTab: 'list',

  /** ランキング画面のアクティブタブ */
  rankingTab: 'score',

  /** 効果音のマスター音量（0〜1） */
  volume: 0.8,
};

// ---- 単語ごとの正誤記録 --------------------------------------------

/**
 * 単語の正誤を記録して永続化する。
 * @param {string} word
 * @param {string} grade
 * @param {boolean} isCorrect
 */
export function recordWordResult(word, grade, isCorrect) {
  const key = `${grade}_${word}`;
  if (!state.wordStatus[key]) state.wordStatus[key] = { correct: 0, wrong: 0 };
  state.wordStatus[key][isCorrect ? 'correct' : 'wrong']++;
  storage.saveWordStatus(state.wordStatus);
}

/**
 * 単語の正誤記録を取得する。
 * @returns {{correct:number, wrong:number}|null}
 */
export function getWordResult(word, grade) {
  return state.wordStatus[`${grade}_${word}`] || null;
}

// ---- 当日の学習カウンター ------------------------------------------

/** 今日の解答数を加算して永続化する */
export function addDailyResult(isCorrect) {
  state.dailyStats.total++;
  if (isCorrect) state.dailyStats.correct++;
  storage.saveDailyStats(todayKey, state.dailyStats);
}
