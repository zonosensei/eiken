// ===================================================================
// localStorage アクセス層
// キー名は constants.js の LS_KEYS のみを使い、JSON の
// パース失敗時は安全なデフォルト値へフォールバックする。
// ===================================================================

import { LS_KEYS } from './constants.js';

/**
 * JSON を安全に読む。壊れていたら fallback を返す。
 * @param {string} key
 * @param {*} fallback
 */
function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---- 級 ----------------------------------------------------------

export const loadLastGrade = () => localStorage.getItem(LS_KEYS.LAST_GRADE) || '5';
export const saveLastGrade = (grade) => localStorage.setItem(LS_KEYS.LAST_GRADE, grade);
/** 端末にこの前選んだ級が保存されているか（自動ログイン時の級復元判定に使う） */
export const hasLocalGrade = () => localStorage.getItem(LS_KEYS.LAST_GRADE) !== null;

// ---- 単語ごとの正誤記録 { "grade_word": {correct, wrong} } --------

export const loadWordStatus = () => readJson(LS_KEYS.WORD_STATUS, {});
export const saveWordStatus = (status) => writeJson(LS_KEYS.WORD_STATUS, status);

// ---- 当日の学習カウンター ----------------------------------------

export const loadDailyStats = (dayKey) =>
  readJson(LS_KEYS.DAILY_PREFIX + dayKey, { correct: 0, total: 0 });
export const saveDailyStats = (dayKey, stats) =>
  writeJson(LS_KEYS.DAILY_PREFIX + dayKey, stats);

// ---- まちがいノート [{word, meaning, grade, date, weak, correct}] --

export const loadMistakes = () => readJson(LS_KEYS.MISTAKES, []);
export const saveMistakes = (mistakes) => writeJson(LS_KEYS.MISTAKES, mistakes);
export const clearMistakes = () => localStorage.removeItem(LS_KEYS.MISTAKES);

// ---- 合格記録 { "pass_grade_label": {score, grade, label, date} } --

export const loadPasses = () => readJson(LS_KEYS.PASSES, {});
export const savePasses = (passes) => writeJson(LS_KEYS.PASSES, passes);

// ---- ログインセッション {uid, name, ts} ---------------------------

export const loadSession = () => readJson(LS_KEYS.USER, null);
export const saveSession = (uid, name) =>
  writeJson(LS_KEYS.USER, { uid, name, ts: Date.now() });
export const clearSession = () => localStorage.removeItem(LS_KEYS.USER);

// ---- お知らせ既読 ------------------------------------------------

export const loadReadNotifs = () => readJson(LS_KEYS.READ_NOTIFS, []);
export function markNotifRead(id) {
  const read = loadReadNotifs();
  if (!read.includes(id)) {
    read.push(id);
    writeJson(LS_KEYS.READ_NOTIFS, read);
  }
}

// ---- ユーザー設定 {nickname, volume, theme} ------------------------

export const loadSettings = () => readJson(LS_KEYS.SETTINGS, {});
export const saveSettings = (settings) => writeJson(LS_KEYS.SETTINGS, settings);

// ---- テーマ --------------------------------------------------------

export const loadTheme = () => localStorage.getItem(LS_KEYS.THEME);
export const saveTheme = (theme) => localStorage.setItem(LS_KEYS.THEME, theme || 'light');
/** 旧バージョンの darkMode フラグ（テーマ移行用） */
export const loadLegacyDarkMode = () => localStorage.getItem('zeiken_darkmode') === '1';
