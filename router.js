// ===================================================================
// ビュー: 100問テスト（8分間・95点以上で合格）
// レベル選択 → カウントダウン → 出題（タイマー付き）→ 結果。
// 合格すると localStorage / Firestore に合格記録が保存され、
// スタンプカードに赤ハンコが押される。
// ===================================================================

import { VOCAB } from '../../data/vocab.js';
import { LEVEL_MAP, GRADE_NAMES, TEST } from '../constants.js';
import { state, recordWordResult, addDailyResult } from '../state.js';
import { $, esc, contentArea } from '../dom.js';
import * as storage from '../storage.js';
import { shuffled, getRandomMeanings } from '../quiz.js';
import { playCorrect, playWrong, speakWord } from '../audio.js';
import { addMistake } from '../mistakes-store.js';
import { saveLog, savePassToCloud } from '../cloud.js';
import { showCountdown } from '../ui.js';
import { renderBaseballAnim, renderStampCard } from '../graphics.js';
import { posBadgeHtml } from './wordlist.js';

/** 進行中のテスト状態（null = 未開始） */
let testState = null;
let testTimer = null;

/** モードのエントリポイント */
export function renderTest100Start(el) {
  if (testState && !testState.finished) {
    renderQuestion();
    return;
  }
  const g = state.grade; // 級はログイン時に固定
  const passes = storage.loadPasses();
  const levels = LEVEL_MAP[g];

  let html = '<div style="text-align:center;padding:8px 0 4px">';
  html += '<div style="font-size:28px;margin-bottom:6px">⏱️</div>';
  html += '<div style="font-size:16px;font-weight:700;color:#111;margin-bottom:2px">100問テスト</div>';
  html += `<div style="font-size:12px;color:#888;margin-bottom:12px">${GRADE_NAMES[g]} ／ 8分間・4択 ／ ${TEST.PASS_SCORE}点以上で合格</div>`;
  html += '<div style="font-size:11px;font-weight:600;color:#555;margin-bottom:6px;text-align:left">レベルを選ぶ</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">';
  levels.forEach((range, i) => {
    const lv = i + 1;
    const count = range[1] - range[0];
    const pass = passes[`pass_${g}_Lv.${lv}`];
    html += `<button class="tg-btn" data-lv="${lv}" style="padding:10px 4px;position:relative;${pass ? 'border-color:#c00;' : ''}">`;
    if (pass) html += '<span style="position:absolute;top:2px;right:4px;font-size:10px;color:#c00;font-weight:700">✔</span>';
    html += `<div style="font-weight:700">Lv.${lv}</div>`;
    html += `<div style="font-size:11px;color:#aaa;margin-top:2px">${count}語</div>`;
    if (pass) html += `<div style="font-size:10px;color:#c00;margin-top:1px">合格 ${pass.score}点</div>`;
    html += '</button>';
  });
  html += '</div>';

  const passAll = passes[`pass_${g}_全レベル`];
  html += `<button class="tg-btn" id="test-all-lv" style="width:100%;margin-top:2px;${passAll ? 'border-color:#c00;' : ''}">`;
  if (passAll) html += `<span style="color:#c00;font-size:11px;font-weight:700;margin-right:4px">✔ 合格 ${passAll.score}点</span>`;
  html += '<div style="font-weight:600">全レベルまとめて</div>';
  html += `<div style="font-size:11px;color:#aaa;margin-top:2px">${VOCAB[g].length}語から100問</div>`;
  html += '</button>';

  html += renderStampCard(passes);

  el.innerHTML = html;

  el.querySelectorAll('[data-lv]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lv = parseInt(btn.dataset.lv, 10);
      const range = LEVEL_MAP[g][lv - 1];
      startTest(g, VOCAB[g].slice(range[0], range[1]), `Lv.${lv}`);
    });
  });
  $('test-all-lv').addEventListener('click', () => startTest(g, VOCAB[g], '全レベル'));
}

// ---- テスト進行 --------------------------------------------------------

/**
 * テストを開始する。
 * @param {string} grade
 * @param {Array} pool - 出題プール
 * @param {string} label - 'Lv.1' や '全レベル'
 */
function startTest(grade, pool, label) {
  const questions = shuffled(pool).slice(0, Math.min(TEST.QUESTION_COUNT, pool.length));
  testState = {
    grade,
    label,
    questions,
    current: 0,
    correct: 0,
    wrong: [],
    timeLeft: TEST.TIME_LIMIT_SEC,
    answered: false,
    finished: false,
  };
  showCountdown(() => {
    renderQuestion();
    if (testTimer) clearInterval(testTimer);
    testTimer = setInterval(() => {
      testState.timeLeft--;
      updateTimerDisplay();
      if (testState.timeLeft <= 0) {
        clearInterval(testTimer);
        finishTest();
      }
    }, 1000);
  });
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function updateTimerDisplay() {
  const el = $('test-timer');
  if (!el) return;
  el.textContent = formatTime(testState.timeLeft);
  el.className = `timer-num${testState.timeLeft <= 60 ? ' danger' : ''}`;
}

function renderQuestion() {
  const el = contentArea();
  const q = testState.questions[testState.current];
  const correct = q[1];
  const wrongs = getRandomMeanings(testState.grade, correct, 3, q[2]);
  const choices = shuffled([correct, ...wrongs]);
  const pct = testState.current; // /100 なのでそのまま%

  let html = '<div class="timer-bar">';
  html += '<div><div style="font-size:11px;color:#888;margin-bottom:2px">残り時間</div>';
  html += `<div class="timer-num${testState.timeLeft <= 60 ? ' danger' : ''}" id="test-timer">${formatTime(testState.timeLeft)}</div></div>`;
  html += `<div style="text-align:right"><div class="test-progress">${testState.current + 1} / ${TEST.QUESTION_COUNT}問</div>`;
  html += `<div style="font-size:12px;color:#3B6D11;margin-top:2px">正解 ${testState.correct}</div></div></div>`;
  html += `<div class="test-prog-bar-wrap"><div class="test-prog-bar" style="width:${pct}%"></div></div>`;
  html += '<div class="test-word" style="display:flex;align-items:center;justify-content:center;gap:8px">'
    + (q[2] ? posBadgeHtml(q[2], 'font-size:11px;vertical-align:middle;margin-right:6px') : '')
    + esc(q[0])
    + '<button id="test-speak" style="background:none;border:none;cursor:pointer;font-size:18px;opacity:.6;padding:0">🔊</button>'
    + '</div>';
  html += '<div class="test-choices">';
  choices.forEach((c) => {
    html += `<button class="test-choice" data-c="${esc(c)}">${esc(c)}</button>`;
  });
  html += '</div>';
  html += '<button id="test-dontknow" style="margin-top:6px;width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:12px;background:#f5f5f5;color:#999;font-size:13px;cursor:pointer;font-weight:600">分からない</button>';
  el.innerHTML = html;

  setTimeout(() => speakWord(q[0]), 200);
  $('test-speak').addEventListener('click', () => speakWord(q[0]));

  el.querySelectorAll('.test-choice').forEach((btn) => {
    btn.addEventListener('click', () => answerQuestion(btn.dataset.c, btn, correct));
  });
  $('test-dontknow').addEventListener('click', function onDontKnow() {
    if (testState.answered) return;
    answerQuestion('__dontknow__', null, correct);
    this.disabled = true;
    this.style.opacity = '0.4';
  });
}

/**
 * 解答を処理する。
 * @param {string} chosen - 選んだ意味（分からない場合は '__dontknow__'）
 * @param {HTMLElement|null} btn - 押されたボタン（分からない場合は null）
 * @param {string} correct - 正解の意味
 */
function answerQuestion(chosen, btn, correct) {
  if (testState.answered) return;
  testState.answered = true;
  const ok = chosen === correct;
  const q = testState.questions[testState.current];
  recordWordResult(q[0], testState.grade, ok);
  addDailyResult(ok);

  document.querySelectorAll('.test-choice').forEach((b) => {
    b.classList.add('disabled');
    if (b.dataset.c === correct) b.classList.add('correct');
    else if (b === btn && !ok) b.classList.add('wrong');
  });

  if (ok) {
    testState.correct++;
    playCorrect();
    showAnswerFeedback(true);
  } else {
    testState.wrong.push({ word: q[0], correct });
    addMistake(q[0], correct, testState.grade);
    playWrong();
    showAnswerFeedback(false, correct);
  }

  setTimeout(() => {
    testState.current++;
    testState.answered = false;
    if (testState.current >= TEST.QUESTION_COUNT) finishTest();
    else renderQuestion();
  }, ok ? 600 : 1000);
}

/** 画面中央に ⭕ / ❌ のフィードバックを一瞬表示する */
function showAnswerFeedback(ok, correct) {
  document.getElementById('test-feedback')?.remove();
  const div = document.createElement('div');
  div.id = 'test-feedback';
  div.style.cssText =
    'position:fixed;top:50%;left:50%;transform:translate(-50%,-60%);z-index:50;' +
    'text-align:center;pointer-events:none;animation:fbpop 0.3s ease-out';
  div.innerHTML = ok
    ? '<div style="font-size:56px">⭕</div><div style="font-size:18px;font-weight:700;color:#3B6D11;margin-top:4px">正解！</div>'
    : `<div style="font-size:56px">❌</div><div style="font-size:14px;font-weight:600;color:#A32D2D;margin-top:4px">${esc(correct)}</div>`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 900);
}

// ---- 終了・結果 --------------------------------------------------------

function finishTest() {
  if (testTimer) clearInterval(testTimer);
  testState.finished = true;
  const score = testState.correct;
  const { grade, label } = testState;

  saveLog('test100', grade, score, TEST.QUESTION_COUNT, score);

  // 合格記録の保存（自己ベストのみ更新）
  if (score >= TEST.PASS_SCORE) {
    const passKey = `pass_${grade}_${label.replace(/\s/g, '_')}`;
    const passData = { score, grade, label, date: Date.now() };
    const passes = storage.loadPasses();
    if (!passes[passKey] || passes[passKey].score < score) passes[passKey] = passData;
    storage.savePasses(passes);
    savePassToCloud(passKey, passData);
  }

  renderResult();
}

function renderResult() {
  const el = contentArea();
  const { correct, wrong, label } = testState;
  const total = testState.current;
  const used = TEST.TIME_LIMIT_SEC - testState.timeLeft;
  const passed = correct >= TEST.PASS_SCORE;

  const [message, _color] =
    correct >= 95 ? ['合格！おめでとう！🎉', '#c00']
    : correct >= 80 ? ['惜しい！次は必ず合格するんじゃ！', '#BA7517']
    : correct >= 60 ? ['もう少し！精進せえよ！', '#e85d00']
    : correct >= 50 ? ['甘い！鍛錬が足りとらん！', '#c05000']
    : ['不合格！基本がなっちょらん！', '#A32D2D'];

  let html = `<div style="font-size:13px;color:#888;text-align:center;margin-bottom:4px">テスト結果　${esc(label || '')}</div>`;

  // 合格スタンプ（押印アニメーション付き）
  if (passed) {
    html += '<div id="stamp-wrap" style="text-align:center;margin-bottom:8px">';
    html += '<svg id="pass-stamp" width="160" height="170" viewBox="0 0 160 170" style="display:inline-block;opacity:0;transform:scale(2) rotate(-12deg);transition:opacity .45s,transform .45s">';
    html += '<ellipse cx="80" cy="82" rx="72" ry="74" fill="none" stroke="#c00" stroke-width="7" stroke-dasharray="14 6" opacity="0.92"/>';
    html += '<text x="80" y="72" text-anchor="middle" font-size="42" font-weight="900" fill="#c00" font-family="serif" letter-spacing="4">合格</text>';
    html += `<text x="80" y="108" text-anchor="middle" font-size="16" font-weight="700" fill="#c00" font-family="sans-serif">${esc(label)}</text>`;
    html += `<text x="80" y="128" text-anchor="middle" font-size="15" font-weight="700" fill="#c00" font-family="sans-serif">${correct}点</text>`;
    html += '</svg></div>';
  }

  html += `<div class="result-score-big" style="color:${passed ? '#c00' : '#1A4FBF'}">${correct}<span style="font-size:20px;font-weight:400;color:#888"> / ${TEST.QUESTION_COUNT}</span></div>`;
  html += `<div class="result-label">${message}</div>`;
  html += `<div style="font-size:12px;color:#aaa;text-align:center;margin-bottom:8px">使用時間 ${Math.floor(used / 60)}分${used % 60}秒</div>`;
  html += '<div class="result-stats">';
  html += `<div class="result-stat"><div class="result-stat-num" style="color:#3B6D11">${correct}</div><div class="result-stat-label">正解</div></div>`;
  html += `<div class="result-stat"><div class="result-stat-num" style="color:#A32D2D">${wrong.length}</div><div class="result-stat-label">不正解</div></div>`;
  html += `<div class="result-stat"><div class="result-stat-num">${TEST.QUESTION_COUNT - total}</div><div class="result-stat-label">未解答</div></div>`;
  html += '</div>';

  if (wrong.length > 0) {
    html += `<div style="font-size:13px;font-weight:600;color:#333;margin-bottom:8px">間違えた単語（${wrong.length}語）</div>`;
    html += '<div class="wrong-list">';
    wrong.forEach((w) => {
      html += `<div class="wrong-item"><span class="wrong-word">${esc(w.word)}</span><span class="wrong-meaning">${esc(w.correct)}</span></div>`;
    });
    html += '</div>';
  } else if (correct === TEST.QUESTION_COUNT) {
    html += '<div style="text-align:center;color:#3B6D11;padding:12px;font-weight:600">全問正解！！パーフェクト！</div>';
  }

  html += '<div id="baseball-wrap" style="width:100%;text-align:center;margin:8px 0 4px"></div>';
  html += '<button class="next-btn" style="background:#e85d00;margin-top:14px" id="retry-btn">もう一度テストを受ける</button>';
  el.innerHTML = html;

  if (passed) {
    setTimeout(() => {
      const stamp = $('pass-stamp');
      if (stamp) {
        stamp.style.opacity = '1';
        stamp.style.transform = 'scale(1) rotate(-8deg)';
      }
    }, 200);
  }

  renderBaseballAnim($('baseball-wrap'), correct);

  $('retry-btn').addEventListener('click', () => {
    testState = null;
    renderTest100Start(el);
  });
}
