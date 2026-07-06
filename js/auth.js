// ===================================================================
// 認証
// 生徒ID（8桁）を名簿（STUDENTS）と照合するシンプルなログイン。
// - 手動ログイン（ログイン画面）
// - URL パラメータ ?sid=XXXXXXXX による自動ログイン
// - localStorage セッションの復元（事実上無期限）
// ===================================================================

import { STUDENTS } from '../data/students.js';
import { state } from './state.js';
import { $ } from './dom.js';
import * as storage from './storage.js';
import { fetchUserDoc, ensureUserDoc, restoreProgressFromCloud } from './cloud.js';
import { updateScoreDisplay, setHeaderLoggedIn, syncGradeButtons } from './ui.js';
import { checkUnreadNotif } from './settings.js';
import { renderContent } from './router.js';

/**
 * 入力された ID を名簿と照合する。
 * 先頭の 'S' や先行ゼロの有無は吸収する。
 * @param {string} raw
 * @returns {{sid: string, name: string}|null}
 */
function matchStudent(raw) {
  const normalized = raw.replace(/^S/i, '');
  for (const sid of Object.keys(STUDENTS)) {
    if (sid === raw || sid === normalized
        || sid.replace(/^0+/, '') === raw.replace(/^0+/, '')) {
      return { sid, name: STUDENTS[sid] };
    }
  }
  return null;
}

/** ログイン完了後の共通処理（画面反映） */
function completeLogin(sid, name, grade) {
  state.currentUser = { uid: sid, name };
  storage.saveSession(sid, name);
  state.grade = grade;
  state.loginGrade = grade;
  storage.saveLastGrade(grade);
  if (state.mode === 'vocab') state.vocabShowLevelSelect = true;
  renderContent();
  syncGradeButtons();
  setHeaderLoggedIn(true);
  updateScoreDisplay();
  checkUnreadNotif();
}

/** ログイン画面のイベントを紐付ける */
export function initLoginScreen() {
  // 級選択ボタン
  const highlightLoginGrade = () => {
    document.querySelectorAll('.login-grade-btn').forEach((b) => {
      const sel = b.dataset.g === state.loginGrade;
      b.style.background = sel ? '#1A4FBF' : '#fff';
      b.style.color = sel ? '#fff' : '#555';
      b.style.borderColor = sel ? '#1A4FBF' : '#ddd';
    });
  };
  highlightLoginGrade();
  document.querySelectorAll('.login-grade-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.loginGrade = btn.dataset.g;
      storage.saveLastGrade(state.loginGrade);
      highlightLoginGrade();
    });
  });

  // ログインボタン
  $('login-btn').addEventListener('click', () => {
    const raw = $('login-sid').value.trim();
    const err = $('login-err');
    if (!raw) {
      err.style.display = 'block';
      err.textContent = 'IDを入力してください';
      return;
    }
    const student = matchStudent(raw);
    if (!student) {
      err.style.display = 'block';
      err.textContent = 'IDが見つかりません。先生に確認してください';
      return;
    }
    err.style.display = 'none';
    fetchUserDoc(student.sid).then((snap) => {
      ensureUserDoc(student.sid, student.name, state.loginGrade, snap);
      restoreProgressFromCloud(snap.data() || {});
      completeLogin(student.sid, student.name, state.loginGrade);
    }).catch((e) => {
      err.style.display = 'block';
      err.textContent = 'エラーが発生しました';
      console.error(e);
    });
  });

  // Enter キーでログイン
  $('login-sid').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('login-btn').click();
  });

  // ログアウトボタン
  $('logout-btn').addEventListener('click', logout);
}

/** ログアウトする */
export function logout() {
  if (!confirm('ログアウトしますか？')) return;
  storage.clearSession();
  state.currentUser = null;
  state.score = { correct: 0, total: 0 };
  setHeaderLoggedIn(false);
}

/**
 * 起動時の自動ログインを試みる。
 * 優先順位: URL パラメータ ?sid= → localStorage セッション。
 */
export function tryAutoLogin() {
  // URL パラメータでの自動ログイン
  const params = new URLSearchParams(window.location.search);
  const sidParam = params.get('sid');
  if (sidParam) {
    const student = matchStudent(sidParam);
    if (student) {
      fetchUserDoc(student.sid).then((snap) => {
        const data = snap.data() || {};
        ensureUserDoc(student.sid, student.name, storage.loadLastGrade(), snap);
        // クラウドに保存された級があればそれを使う
        const savedGrade = data.grade || storage.loadLastGrade();
        restoreProgressFromCloud(data);
        completeLogin(student.sid, student.name, savedGrade);
        window.history.replaceState({}, '', window.location.pathname);
      }).catch(() => { /* 通信不可時はログイン画面のまま */ });
      return;
    }
  }

  // localStorage セッションの復元
  const saved = storage.loadSession();
  if (!saved) return;
  try {
    if (!saved.uid || !saved.name) return;
    state.currentUser = { uid: saved.uid, name: saved.name };

    // まず端末に残っている級で即時描画（描画後にクラウドで補完）
    const localGrade = storage.hasLocalGrade() ? storage.loadLastGrade() : null;
    state.grade = localGrade || '5';
    state.loginGrade = state.grade;
    if (state.mode === 'vocab') state.vocabShowLevelSelect = true;
    renderContent();
    syncGradeButtons();
    setHeaderLoggedIn(true);
    updateScoreDisplay();
    checkUnreadNotif();

    // クラウドから非同期で進捗を復元。
    // 級は端末に前回選択が無い場合のみ補完する（古い級での上書き防止）。
    fetchUserDoc(saved.uid).then((snap) => {
      const data = snap.data() || {};
      if (!localGrade && data.grade && data.grade !== state.grade) {
        state.grade = data.grade;
        state.loginGrade = data.grade;
        storage.saveLastGrade(data.grade);
        syncGradeButtons();
        if (state.mode === 'vocab') state.vocabShowLevelSelect = true;
        renderContent();
      }
      restoreProgressFromCloud(data);
    }).catch(() => { /* オフラインでもローカルで続行 */ });
  } catch {
    storage.clearSession();
  }
}
