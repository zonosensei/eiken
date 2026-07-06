// ===================================================================
// 出題エンジン
// 語彙プールの切り出し・出題順シャッフル・誤答選択肢の生成など、
// 「何をどう出すか」のロジックを集約する。
// ===================================================================

import { VOCAB } from '../data/vocab.js';
import { LEVEL_MAP, VOCAB_SET_SIZE, BATTLE } from './constants.js';
import { state } from './state.js';

/** 配列をその場でシャッフルする（Fisher–Yates） */
export function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 配列のシャッフル済みコピーを返す */
export const shuffled = (arr) => shuffleInPlace(arr.slice());

/**
 * 現在の級・レベルの語彙プールを返す。
 * @returns {Array<[string,string,string]>} [単語, 意味, 品詞] の配列
 */
export function getVocabPool() {
  if (state.currentLevel === 0) return VOCAB[state.grade];
  const range = LEVEL_MAP[state.grade][state.currentLevel - 1];
  return VOCAB[state.grade].slice(range[0], range[1]);
}

/** shuffledIdx のキー（"級" または "級-レベル"） */
export function getLevelKey() {
  return state.grade + (state.currentLevel === 0 ? '' : `-${state.currentLevel}`);
}

/**
 * 現在のレベルから次の 1 語を取り出す。
 * 出題順は一度シャッフルした順序を保持し、末尾まで行ったら先頭に戻る。
 * 進行位置（pos）はクラウド保存の対象。
 */
export function nextVocabItem() {
  const pool = getVocabPool();
  const key = getLevelKey();
  if (!state.shuffledIdx[key]) {
    const arr = shuffleInPlace([...pool.keys()]);
    state.shuffledIdx[key] = { arr, pos: 0 };
  }
  const s = state.shuffledIdx[key];
  const idx = s.arr[s.pos % s.arr.length];
  s.pos++;
  return pool[idx];
}

/**
 * 誤答の選択肢（意味）をランダムに選ぶ。
 * 同品詞の候補を優先し、足りなければ級全体からフォールバックする。
 * @param {string} grade
 * @param {string} exclude - 正解の意味（除外）
 * @param {number} [n=3] - 必要な数
 * @param {string} [pos] - 品詞
 * @returns {string[]}
 */
export function getRandomMeanings(grade, exclude, n = 3, pos) {
  const samePosPool = [];
  const allPool = [];
  VOCAB[grade].forEach((w) => {
    if (w[1] !== exclude) {
      allPool.push(w[1]);
      if (pos && w[2] === pos) samePosPool.push(w[1]);
    }
  });
  const pool = samePosPool.length >= n ? samePosPool : allPool;
  const result = [];
  const used = new Set();
  let tries = 0;
  while (result.length < n && tries < 300) {
    const m = pool[Math.floor(Math.random() * pool.length)];
    if (!used.has(m)) {
      used.add(m);
      result.push(m);
    }
    tries++;
  }
  return result;
}

/**
 * 単語クイズ 1 セット（20問）を生成する。
 * @returns {{questions:Array, current:number, correct:number, wrongList:Array}}
 */
export function buildVocabSet() {
  const questions = [];
  for (let i = 0; i < VOCAB_SET_SIZE; i++) {
    const item = nextVocabItem();
    const wrongs = getRandomMeanings(state.grade, item[1], 3, item[2]);
    const choices = shuffled([item[1], ...wrongs]);
    questions.push({ word: item[0], meaning: item[1], item, choices });
  }
  return { questions, current: 0, correct: 0, wrongList: [] };
}

/**
 * 苦手度（weak）で重み付けして 1 語を抽選する。
 * @param {Array<{weak?:number}>} pool
 */
export function pickWeighted(pool) {
  const total = pool.reduce((s, m) => s + (m.weak || 1), 0);
  const r = Math.random() * total;
  let acc = 0;
  for (const m of pool) {
    acc += m.weak || 1;
    if (r <= acc) return m;
  }
  return pool[pool.length - 1];
}

/**
 * ミス帳の単語用に誤答選択肢を作る。
 * 同一級・同一品詞 → 全級・同一品詞 → 全級すべて の順でフォールバック。
 * @param {{word:string, meaning:string, grade:string, pos?:string}} item
 * @returns {string[]} シャッフル済みの4択（正解を含む）
 */
export function buildMistakeChoices(item) {
  const correct = item.meaning;
  const pos = item.pos || '';
  const fromPool = (words, targetPos) =>
    words.filter((w) => w[1] !== correct && (!targetPos || w[2] === targetPos)).map((w) => w[1]);

  const sameGradePos = VOCAB[item.grade] ? fromPool(VOCAB[item.grade], pos) : [];
  const allPos = Object.values(VOCAB).flatMap((words) => fromPool(words, pos));
  const anyAll = Object.values(VOCAB).flatMap((words) =>
    words.map((w) => w[1]).filter((m) => m !== correct));

  const wrongPool = sameGradePos.length >= 3 ? sameGradePos
    : allPos.length >= 3 ? allPos : anyAll;

  const wrongs = [];
  const used = new Set();
  while (wrongs.length < 3 && wrongPool.length > 0) {
    const pick = wrongPool[Math.floor(Math.random() * wrongPool.length)];
    if (!used.has(pick)) {
      used.add(pick);
      wrongs.push(pick);
    }
  }
  return shuffled([correct, ...wrongs]);
}

/**
 * バトル用の問題を 1 問生成する。
 * @param {string} grade
 * @returns {{word, answer, choices, grade, createdAt}}
 */
export function makeBattleQuestion(grade) {
  const pool = VOCAB[grade];
  const item = pool[Math.floor(Math.random() * pool.length)];
  const wrongs = [];
  let tries = 0;
  while (wrongs.length < BATTLE.CHOICE_COUNT - 1 && tries < 200) {
    tries++;
    const r = pool[Math.floor(Math.random() * pool.length)][1];
    if (r !== item[1] && !wrongs.includes(r)) wrongs.push(r);
  }
  return {
    word: item[0],
    answer: item[1],
    choices: shuffled([item[1], ...wrongs]),
    grade,
    createdAt: Date.now(),
  };
}
