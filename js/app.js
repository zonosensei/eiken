// ===================================================================
// エントリポイント
// ビューの登録、ヘッダー・モードカード・級ボタンの配線、起動処理。
// ===================================================================

import { state } from './state.js';
import { $ } from './dom.js';
import { registerView, renderContent, switchMode } from './router.js';
import { updateScoreDisplay, syncGradeButtons } from './ui.js';
import { initSettings, openSettings, openNotif } from './settings.js';
import { initLoginScreen, tryAutoLogin } from './auth.js';

import { renderVocab } from './views/vocab.js';
import { renderStats } from './views/stats.js';
import { renderMistakes } from './views/mistakes.js';
import { renderWordList } from './views/wordlist.js';
import { renderTest100Start } from './views/test.js';
import { renderRanking } from './views/ranking.js';
import { renderBattle } from './views/battle.js';

// ---- ビュー登録 ----------------------------------------------------

registerView('vocab', renderVocab);
registerView('stats', renderStats);
registerView('mistakes', renderMistakes);
registerView('wordlist', renderWordList);
registerView('test100', renderTest100Start);
registerView('ranking', renderRanking);
registerView('battle', renderBattle);

// ---- ヘッダー -------------------------------------------------------

$('settings-btn').addEventListener('click', openSettings);
$('notif-btn').addEventListener('click', openNotif);

// 級ボタン（ログイン後は表示のみ・変更不可）
document.querySelectorAll('.grade-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (state.currentUser) {
      alert('級を変更するにはログアウトが必要です');
      return;
    }
    state.grade = btn.dataset.grade;
    syncGradeButtons();
    state.currentLevel = 1;
    if (state.mode === 'vocab') state.vocabShowLevelSelect = true;
    renderContent();
  });
});

// モードカード
document.querySelectorAll('.mode-card').forEach((card) => {
  card.addEventListener('click', () => switchMode(card.dataset.mode));
});

// ---- 起動 -----------------------------------------------------------

initSettings();       // テーマ・音量の復元
initLoginScreen();    // ログイン画面の配線
syncGradeButtons();
updateScoreDisplay();
state.vocabShowLevelSelect = true;
renderContent();      // 初期画面（ログイン前でも背後に描画）
tryAutoLogin();       // セッション復元 / ?sid= 自動ログイン
