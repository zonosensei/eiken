// ===================================================================
// ビュー: 単語・熟語クイズ（20問セット）
// レベル選択 → 出題 → 結果 の3画面を持つ。
// ===================================================================

import { VOCAB } from '../../data/vocab.js';
import { LEVEL_MAP, GRADE_NAMES, VOCAB_SET_SIZE } from '../constants.js';
import { state, recordWordResult, getWordResult, addDailyResult } from '../state.js';
import { $, esc, contentArea } from '../dom.js';
import { buildVocabSet } from '../quiz.js';
import { playCorrect, playWrong, speakWord } from '../audio.js';
import { addMistake, recordMistakeCorrect } from '../mistakes-store.js';
import { saveVocabSetResult, saveLog } from '../cloud.js';
import { updateScoreDisplay } from '../ui.js';
import { renderBaseballAnim } from '../graphics.js';
import { posBadgeHtml } from './wordlist.js';

/** 進行中のセット状態 */
let vocabSet = { questions: [], current: 0, correct: 0, wrongList: [] };
let answered = false;

function resetSet() {
  vocabSet = { questions: [], current: 0, correct: 0, wrongList: [] };
}

/** モードのエントリポイント */
export function renderVocab(el) {
  answered = false;
  if (state.vocabShowLevelSelect) {
    state.vocabShowLevelSelect = false;
    renderLevelSelect(el);
    return;
  }
  if (vocabSet.current === 0 && vocabSet.questions.length === 0) {
    vocabSet = buildVocabSet();
  }
  renderQuestion(el);
}

// ---- レベル選択 ------------------------------------------------------

function renderLevelSelect(el) {
  const levels = LEVEL_MAP[state.grade];
  let html = `<div style="font-size:14px;font-weight:600;color:#111;margin-bottom:4px">${GRADE_NAMES[state.grade]}　レベルを選んでください</div>`;
  html += '<div style="font-size:12px;color:#888;margin-bottom:16px">各レベル約200語</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">';
  levels.forEach((range, i) => {
    const lv = i + 1;
    const count = range[1] - range[0];
    // 1回でも正解した単語数で進捗を計算
    let done = 0;
    for (let wi = range[0]; wi < range[1]; wi++) {
      const st = getWordResult(VOCAB[state.grade][wi][0], state.grade);
      if (st && st.correct > 0) done++;
    }
    const pct = Math.round((done / count) * 100);
    html += `<button class="tg-btn" data-lv="${lv}" style="position:relative;overflow:hidden;">`;
    html += `<div style="position:absolute;bottom:0;left:0;height:3px;width:${pct}%;background:#1A4FBF"></div>`;
    html += `<div style="font-weight:700;font-size:15px">Lv.${lv}</div>`;
    html += `<div style="font-size:11px;color:#aaa;margin-top:2px">${count}語</div>`;
    if (done > 0) html += `<div style="font-size:10px;color:var(--primary);margin-top:1px">${pct}%</div>`;
    html += '</button>';
  });
  html += '</div>';
  html += '<button class="tg-btn" id="lv-all" style="width:100%;margin-top:4px">';
  html += '<div style="font-weight:600">全レベルまとめて</div>';
  html += `<div style="font-size:11px;color:#aaa;margin-top:2px">${VOCAB[state.grade].length}語</div>`;
  html += '</button>';
  el.innerHTML = html;

  el.querySelectorAll('[data-lv]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.currentLevel = parseInt(btn.dataset.lv, 10);
      startNewSet(el);
    });
  });
  $('lv-all').addEventListener('click', () => {
    state.currentLevel = 0;
    startNewSet(el);
  });
}

function startNewSet(el) {
  answered = false;
  vocabSet = buildVocabSet();
  renderQuestion(el);
}

// ---- 出題 ------------------------------------------------------------

function renderQuestion(el) {
  answered = false;
  const q = vocabSet.questions[vocabSet.current];
  const levelName = state.currentLevel === 0 ? '全レベル' : `Lv.${state.currentLevel}`;
  const setNo = vocabSet.current + 1;
  const pct = Math.round((vocabSet.current / VOCAB_SET_SIZE) * 100);
  const pos = q.item?.[2] || '';

  let html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">';
  html += `<span style="font-size:12px;color:#888">${levelName} | ${setNo} / ${VOCAB_SET_SIZE}問</span>`;
  html += '<button id="vocab-end-btn" style="font-size:12px;padding:4px 12px;border:1px solid var(--border);border-radius:20px;background:var(--app-bg);color:var(--text2);cursor:pointer">終了</button>';
  html += '</div>';
  html += '<div style="background:#eee;border-radius:20px;height:5px;margin-bottom:14px">';
  html += `<div style="height:5px;border-radius:20px;background:var(--primary);width:${pct}%;transition:width 0.3s"></div></div>`;
  html += `<div style="font-size:12px;color:#3B6D11;text-align:right;margin-bottom:6px">✓ ${vocabSet.correct}正解</div>`;
  html += '<div class="word-display" style="display:flex;align-items:center;justify-content:center;gap:10px">'
    + (pos ? `${posBadgeHtml(pos, 'font-size:12px;vertical-align:middle')} ` : '')
    + esc(q.word)
    + '<button id="vocab-speak" style="background:none;border:none;cursor:pointer;font-size:20px;opacity:.65;padding:0" title="発音">🔊</button>'
    + '</div>';
  html += '<div style="height:8px"></div>';
  html += '<div id="vfb" class="feedback" style="display:none"></div>';
  html += '<div class="choices" id="vchoices">';
  q.choices.forEach((c) => {
    html += `<button class="choice-btn" data-choice="${esc(c)}">${esc(c)}</button>`;
  });
  html += '</div>';
  html += '<button class="choice-btn" id="vdontknow" style="margin-top:4px;width:100%;grid-column:1/-1;background:var(--bg);color:var(--text3);border-color:var(--border);font-size:13px">分からない</button>';
  html += `<button class="next-btn" id="vnext" style="display:none">${setNo < VOCAB_SET_SIZE ? '次の問題へ →' : '結果を見る 🎉'}</button>`;

  el.innerHTML = html;

  // 問題表示時に自動発音
  setTimeout(() => speakWord(q.word), 300);
  $('vocab-speak').addEventListener('click', () => speakWord(q.word));

  el.querySelectorAll('.choice-btn').forEach((btn) => {
    if (btn.id === 'vdontknow') return;
    btn.addEventListener('click', () => checkAnswer(btn, q));
  });

  $('vdontknow').addEventListener('click', function onDontKnow() {
    if (answered) return;
    answered = true;
    state.score.total++;
    recordWordResult(q.item[0], state.grade, false);
    addDailyResult(false);
    vocabSet.wrongList.push({ word: q.item[0], meaning: q.meaning });
    addMistake(q.item[0], q.meaning, state.grade);
    updateScoreDisplay();
    revealChoices(q.meaning, null);
    this.disabled = true;
    this.style.opacity = '0.4';
    showFeedback(false, q.meaning);
    playWrong();
    $('vnext').style.display = 'block';
  });

  $('vnext').addEventListener('click', () => advance(el));
  $('vocab-end-btn').addEventListener('click', () => {
    resetSet();
    answered = false;
    renderLevelSelect(el);
  });
}

/** 選択肢を採点表示状態にする */
function revealChoices(correctMeaning, wrongBtn) {
  document.querySelectorAll('.choice-btn').forEach((b) => {
    b.classList.add('disabled');
    if (b.dataset.choice === correctMeaning) b.classList.add('correct');
    else if (b === wrongBtn) b.classList.add('wrong');
  });
}

function showFeedback(ok, correctMeaning) {
  const fb = $('vfb');
  fb.style.display = 'block';
  fb.className = `feedback ${ok ? 'correct' : 'wrong'}`;
  fb.textContent = ok ? '正解！' : `不正解… 正解は「${correctMeaning}」`;
}

function checkAnswer(btn, q) {
  if (answered) return;
  answered = true;
  state.score.total++;
  const ok = btn.dataset.choice === q.meaning;
  recordWordResult(q.item[0], state.grade, ok);
  addDailyResult(ok);
  if (ok) {
    state.score.correct++;
    vocabSet.correct++;
    recordMistakeCorrect(q.item[0], state.grade);
  } else {
    vocabSet.wrongList.push({ word: q.item[0], meaning: q.meaning });
    addMistake(q.item[0], q.meaning, state.grade);
  }
  updateScoreDisplay();
  revealChoices(q.meaning, ok ? null : btn);
  showFeedback(ok, q.meaning);
  if (ok) {
    playCorrect();
    setTimeout(() => advance(contentArea()), 900);
  } else {
    playWrong();
    $('vnext').style.display = 'block';
  }
}

function advance(el) {
  vocabSet.current++;
  if (vocabSet.current >= VOCAB_SET_SIZE) renderResult(el);
  else renderQuestion(el);
}

// ---- 結果 ------------------------------------------------------------

function renderResult(el) {
  const { correct } = vocabSet;
  const pct = Math.round((correct / VOCAB_SET_SIZE) * 100);
  const levelName = state.currentLevel === 0 ? '全レベル' : `Lv.${state.currentLevel}`;
  const color = pct >= 80 ? '#3B6D11' : pct >= 60 ? '#BA7517' : '#A32D2D';

  // 進捗をクラウドへ保存
  saveVocabSetResult(state.grade, state.currentLevel, correct, VOCAB_SET_SIZE);
  saveLog('vocab', state.grade, correct, VOCAB_SET_SIZE, null);

  const message = pct >= 95 ? '⚾ ホームラン！やるじゃないか！'
    : pct >= 80 ? '⚾ ヘッドスライディング！惜しい！'
    : pct >= 60 ? '⚾ フライアウト…もう少し！'
    : '⚾ 空振り三振…鍛錬が足りとらん！';

  let html = '<div style="text-align:center;padding:8px 0 16px">';
  html += `<div style="font-size:13px;color:#888;margin-bottom:4px">${GRADE_NAMES[state.grade]} ${levelName} ${VOCAB_SET_SIZE}問セット完了！</div>`;
  html += '<div id="vocab-baseball-wrap" style="width:100%;text-align:center;margin:8px 0 4px"></div>';
  html += `<div style="font-size:56px;font-weight:700;color:${color}">${correct}<span style="font-size:20px;font-weight:400;color:#888"> / ${VOCAB_SET_SIZE}</span></div>`;
  html += `<div style="font-size:18px;font-weight:600;color:${color};margin-bottom:4px">正答率 ${pct}%</div>`;
  html += `<div style="font-size:14px;color:#555;margin-bottom:16px">${message}</div>`;
  html += '</div>';

  if (vocabSet.wrongList.length > 0) {
    html += `<div style="font-size:13px;font-weight:600;color:#A32D2D;margin-bottom:8px">間違えた単語（${vocabSet.wrongList.length}語）</div>`;
    html += '<div class="wrong-list" style="margin-bottom:16px">';
    vocabSet.wrongList.forEach((w) => {
      html += `<div class="wrong-item"><span class="wrong-word">${esc(w.word)}</span><span class="wrong-meaning">${esc(w.meaning)}</span></div>`;
    });
    html += '</div>';
  }

  html += '<button class="next-btn" id="vocab-next-set" style="margin-bottom:10px">次の20問へ →</button>';
  html += '<button class="next-btn" id="vocab-back-lv" style="background:#888">レベル選択に戻る</button>';

  el.innerHTML = html;

  // 20問の正答率を100点換算して野球アニメーション
  renderBaseballAnim($('vocab-baseball-wrap'), pct);

  $('vocab-next-set').addEventListener('click', () => startNewSet(el));
  $('vocab-back-lv').addEventListener('click', () => {
    resetSet();
    renderLevelSelect(el);
  });
}
