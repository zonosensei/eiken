// ===================================================================
// まちがいノートのデータ操作
// localStorage を正とし、変更のたびにクラウドへも保存する。
// エントリ形式: {word, meaning, grade, date, weak, correct}
//   weak    … 苦手度（間違えるたび +1）
//   correct … 連続正解カウント（3回で卒業＝削除）
// ===================================================================

import { MISTAKES } from './constants.js';
import * as storage from './storage.js';
import { saveMistakesToCloud } from './cloud.js';

/**
 * 間違えた単語をノートへ追加する。既にあれば苦手度を上げる。
 * @param {string} word
 * @param {string} meaning
 * @param {string} grade
 */
export function addMistake(word, meaning, grade) {
  let mistakes = storage.loadMistakes();
  const found = mistakes.find((m) => m.word === word && m.grade === grade);
  if (!found) {
    mistakes.push({ word, meaning, grade, date: Date.now(), weak: 1, correct: 0 });
  } else {
    found.weak = (found.weak || 0) + 1;
    found.date = Date.now();
  }
  if (mistakes.length > MISTAKES.MAX_ENTRIES) {
    mistakes = mistakes.slice(-MISTAKES.MAX_ENTRIES);
  }
  storage.saveMistakes(mistakes);
  saveMistakesToCloud(mistakes);
}

/**
 * 正解を記録する。規定回数（3回）に達したらノートから削除（卒業）。
 * @param {string} word
 * @param {string} grade
 */
export function recordMistakeCorrect(word, grade) {
  let mistakes = storage.loadMistakes();
  const found = mistakes.find((m) => m.word === word && m.grade === grade);
  if (found) {
    found.correct = (found.correct || 0) + 1;
    if (found.correct >= MISTAKES.GRADUATE_CORRECT) {
      mistakes = mistakes.filter((m) => !(m.word === word && m.grade === grade));
    }
  }
  storage.saveMistakes(mistakes);
  saveMistakesToCloud(mistakes);
}

/** 苦手度の高い順に並べた復習用プール（上位30語）を返す */
export function getReviewPool() {
  return storage.loadMistakes()
    .sort((a, b) => (b.weak || 1) - (a.weak || 1))
    .slice(0, MISTAKES.REVIEW_POOL_SIZE);
}
