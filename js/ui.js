// ===================================================================
// 共有 UI 部品
// ヘッダーのスコア表示、ログイン後のボタン表示、カウントダウン演出。
// ===================================================================

import { $ } from './dom.js';
import { state } from './state.js';
import { playCountNum, playCountGo } from './audio.js';

/** ヘッダーのスコア表示を更新する */
export function updateScoreDisplay() {
  const { currentUser, dailyStats } = state;
  const daily = `今日:${dailyStats.correct}/${dailyStats.total}`;
  $('session-score').textContent = currentUser
    ? `${currentUser.name} さん | ${daily}`
    : daily;
}

/** ログイン状態に応じてヘッダーのボタン群を表示/非表示にする */
export function setHeaderLoggedIn(loggedIn) {
  const display = loggedIn ? 'block' : 'none';
  $('logout-btn').style.display = display;
  $('settings-btn').style.display = display;
  $('notif-btn').style.display = display;
  $('login-overlay').style.display = loggedIn ? 'none' : 'flex';
  if (!loggedIn) $('session-score').textContent = 'ログインしてください';
}

/** ヘッダーの級ボタンのハイライトを現在の級に同期する */
export function syncGradeButtons() {
  document.querySelectorAll('.grade-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
}

/**
 * 全画面カウントダウン（3 → 2 → 1 → GAME START!）を表示してから
 * コールバックを実行する。100問テスト・バトル共通。
 * @param {() => void} callback
 */
export function showCountdown(callback) {
  const overlay = document.createElement('div');
  overlay.style.cssText =
    'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(10,10,30,0.88);' +
    'display:flex;align-items:center;justify-content:center;z-index:500;flex-direction:column';
  document.body.appendChild(overlay);

  const steps = ['3', '2', '1', 'GAME\nSTART!'];
  const colors = ['#FF5722', '#FF9800', '#FFC107', '#76FF03'];
  let idx = 0;

  function showNext() {
    if (idx >= steps.length) {
      overlay.remove();
      callback();
      return;
    }
    const n = steps[idx];
    const c = colors[idx];
    overlay.innerHTML =
      `<div style="font-size:${n.length > 2 ? '52px' : '96px'};font-weight:900;color:${c};` +
      "text-align:center;white-space:pre-line;font-family:'DM Sans',sans-serif;" +
      `text-shadow:0 0 40px ${c},0 0 80px ${c};animation:cdbounce 0.3s ease-out;letter-spacing:-1px">${n}</div>`;
    if (idx < 3) playCountNum(); else playCountGo();
    idx++;
    setTimeout(showNext, idx <= 3 ? 900 : 1100);
  }
  showNext();
}
