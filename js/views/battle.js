// ===================================================================
// ビュー: みんなで早押し対戦
// Firestore の battle_rooms をリアルタイム購読して最大6人で対戦する。
// 進行: 部屋作成/参加（ロビー）→ 対戦（ホストが問題を配信）→ 結果。
// 問題の送出・終了判定はホスト端末のみが書き込む（二重送出防止）。
// ===================================================================

import { GRADES, GRADE_NAMES, BATTLE } from '../constants.js';
import { state } from '../state.js';
import { $, esc, contentArea } from '../dom.js';
import { battleRoomRef, increment } from '../cloud.js';
import { makeBattleQuestion } from '../quiz.js';
import { switchMode } from '../router.js';

/* global firebase */

/** バトルのセッション状態 */
const battleState = {
  roomId: null,
  unsubRoom: null,
  myId: null,
  myName: null,
  isHost: false,
  hostId: null,
  currentQ: null,
  answered: false,
  timerInt: null,
  grade: '3',
};

/** ランダムな部屋コード（6文字英数）を作る */
const makeBattleId = () => Math.random().toString(36).slice(2, 8).toUpperCase();

/** 購読・タイマーを解除する */
function cleanup({ keepRoom = false } = {}) {
  if (battleState.timerInt) {
    clearInterval(battleState.timerInt);
    battleState.timerInt = null;
  }
  if (battleState.unsubRoom) {
    battleState.unsubRoom();
    battleState.unsubRoom = null;
  }
  if (!keepRoom) {
    battleState.roomId = null;
    battleState.isHost = false;
  }
}

// ---- 入口（部屋作成画面） ----------------------------------------------

/** モードのエントリポイント */
export function renderBattle(el) {
  // URL パラメータ ?battle=XXXXXX で参加
  const params = new URLSearchParams(window.location.search);
  const joinRoom = params.get('battle');
  if (joinRoom) {
    window.history.replaceState({}, '', window.location.pathname);
    renderLobby(el, joinRoom.toUpperCase());
    return;
  }

  const myName = state.currentUser?.name || null;
  let html = '<div style="text-align:center;padding:8px 0 16px">';
  html += '<div style="font-size:24px;margin-bottom:4px">⚡</div>';
  html += '<div style="font-size:18px;font-weight:700;color:#9C27B0;margin-bottom:4px">みんなで早押し対戦</div>';
  html += `<div style="font-size:12px;color:var(--text3);margin-bottom:18px">URLを友達に共有して最大${BATTLE.MAX_PLAYERS}人で対戦！</div>`;
  if (!myName) {
    html += '<div style="font-size:13px;color:var(--text2);margin-bottom:10px">ゲストとして参加する場合はニックネームを入力：</div>';
    html += '<input id="battle-guest-name" placeholder="ニックネーム（例：たろう）" style="width:100%;border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;font-size:14px;margin-bottom:12px;outline:none;font-family:\'DM Sans\',sans-serif;background:var(--app-bg);color:var(--text)">';
  }
  html += '<div style="font-size:13px;color:var(--text2);margin-bottom:8px">対戦する英検の級：</div>';
  html += '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:18px">';
  GRADES.forEach((g) => {
    html += `<button class="battle-grade-btn" data-g="${g}">${GRADE_NAMES[g]}</button>`;
  });
  html += '</div>';
  html += '<button id="battle-create-btn" class="battle-primary-btn">🎮 部屋を作って開始</button>';
  html += '<div style="font-size:12px;color:var(--text3);margin-top:4px">友達はURLを受け取るだけで参加できます</div>';
  html += '</div>';
  el.innerHTML = html;

  // 級セレクタ（デフォルト3級）
  let selGrade = '3';
  const syncGradeButtons = () => {
    el.querySelectorAll('.battle-grade-btn').forEach((b) => {
      b.classList.toggle('selected', b.dataset.g === selGrade);
    });
  };
  syncGradeButtons();
  el.querySelectorAll('.battle-grade-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      selGrade = btn.dataset.g;
      syncGradeButtons();
    });
  });

  $('battle-create-btn').addEventListener('click', () => {
    let name = myName;
    if (!name) {
      const input = $('battle-guest-name');
      name = input ? input.value.trim() : '';
      if (!name) {
        input.style.borderColor = 'var(--wrong)';
        return;
      }
    }
    const roomId = makeBattleId();
    battleState.myName = name;
    battleState.myId = state.currentUser ? state.currentUser.uid : `guest_${Date.now()}`;
    battleState.isHost = true;
    battleState.grade = selGrade;
    battleState.roomId = roomId;

    battleRoomRef(roomId).set({
      grade: selGrade,
      status: 'waiting',
      host: battleState.myId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      players: {},
    }).then(() => battleRoomRef(roomId).update({
      [`players.${battleState.myId}`]: { name, score: 0, joinedAt: Date.now() },
    })).then(() => {
      renderLobby(el, roomId);
    }).catch((e) => alert(`部屋作成失敗: ${e.message}`));
  });
}

// ---- ロビー ------------------------------------------------------------

function playerRowHtml(uid, player, hostId, extraClass = '') {
  const me = uid === battleState.myId ? ' me' : '';
  return `<div class="battle-player-row${me}${extraClass}">`
    + `<span style="font-size:13px;font-weight:600">${esc(player.name)}${uid === hostId ? ' 👑' : ''}</span>`
    + `<span class="battle-score-badge">${player.score}pt</span></div>`;
}

function renderPlayersList(players, hostId) {
  const list = $('battle-players-list');
  if (!list) return;
  let html = `<div style="font-size:12px;color:var(--text3);margin-bottom:6px;font-weight:600">参加者 (${Object.keys(players).length}/${BATTLE.MAX_PLAYERS}人)</div>`;
  Object.keys(players).forEach((uid) => {
    html += playerRowHtml(uid, players[uid], hostId);
  });
  list.innerHTML = html;
}

function renderLobby(el, roomId) {
  battleState.roomId = roomId;
  if (battleState.unsubRoom) battleState.unsubRoom();

  const shareUrl = `${window.location.origin}${window.location.pathname}?battle=${roomId}`;
  let html = '<div style="text-align:center;padding:4px 0 8px">';
  html += '<div style="font-size:11px;color:var(--text3);margin-bottom:2px">部屋コード</div>';
  html += `<div style="font-size:32px;font-weight:700;color:#9C27B0;letter-spacing:4px;font-family:'DM Mono',monospace">${esc(roomId)}</div>`;
  html += '<div style="font-size:11px;color:var(--text3);margin-bottom:8px">このURLを友達に共有してね</div>';
  html += `<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 10px;font-size:11px;word-break:break-all;margin-bottom:8px;font-family:'DM Mono',monospace;color:var(--text2)">${esc(shareUrl)}</div>`;
  html += '<button id="battle-copy-btn" style="padding:6px 18px;background:var(--primary-light);border:1.5px solid var(--primary);border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;color:var(--primary);font-family:\'DM Sans\',sans-serif;margin-bottom:14px">📋 URLをコピー</button>';
  html += '</div>';
  html += '<div id="battle-players-list" style="margin-bottom:14px"></div>';
  html += '<div id="battle-lobby-action"></div>';
  el.innerHTML = html;

  $('battle-copy-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      $('battle-copy-btn').textContent = '✅ コピーしました！';
      setTimeout(() => {
        const btn = $('battle-copy-btn');
        if (btn) btn.textContent = '📋 URLをコピー';
      }, 2000);
    });
  });

  // ホストでなければ参加処理
  if (!battleState.isHost) {
    const joinName = state.currentUser?.name || null;
    if (!joinName) {
      askGuestNameAndJoin(el, roomId);
      return;
    }
    battleState.myName = joinName;
    battleState.myId = state.currentUser.uid;
    joinRoom(roomId, el);
    return;
  }

  // ホストとして部屋を購読
  battleState.unsubRoom = battleRoomRef(roomId).onSnapshot((snap) => {
    if (!snap.exists) {
      el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3)">部屋が見つかりません</div>';
      return;
    }
    const data = snap.data();
    if (data.status === 'playing') {
      renderGame(el, data);
      return;
    }
    const players = data.players || {};
    renderPlayersList(players, data.host);

    const actionDiv = $('battle-lobby-action');
    if (!actionDiv) return;
    const count = Object.keys(players).length;
    if (count >= 2) {
      actionDiv.innerHTML = `<button id="battle-start-btn" class="battle-primary-btn">⚡ ゲームスタート！(${count}人)</button>`;
      $('battle-start-btn').addEventListener('click', startGame);
    } else {
      actionDiv.innerHTML = `<div style="text-align:center;font-size:13px;color:var(--text3);padding:12px">あと${2 - count}人参加待ち…</div>`;
    }
  });
}

/** ゲスト参加時のニックネーム入力モーダル */
function askGuestNameAndJoin(el, roomId) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:300;padding:20px';
  modal.innerHTML = '<div style="background:#fff;border-radius:16px;padding:24px;width:100%;max-width:320px">'
    + '<div style="font-size:16px;font-weight:700;margin-bottom:12px">ニックネームを入力</div>'
    + '<input id="battle-join-name" placeholder="例：たろう" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:10px 12px;font-size:14px;margin-bottom:12px;outline:none;font-family:\'DM Sans\',sans-serif">'
    + '<button id="battle-join-ok" style="width:100%;padding:12px;background:#9C27B0;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">参加する</button></div>';
  document.body.appendChild(modal);
  $('battle-join-ok').addEventListener('click', () => {
    const name = $('battle-join-name').value.trim();
    if (!name) return;
    battleState.myName = name;
    battleState.myId = `guest_${Date.now()}`;
    modal.remove();
    joinRoom(roomId, el);
  });
}

/** 部屋に参加してロビーを購読する */
function joinRoom(roomId, el) {
  battleRoomRef(roomId).get().then((snap) => {
    if (!snap.exists) {
      el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--wrong)">❌ 部屋が見つかりません</div>';
      return null;
    }
    const data = snap.data();
    if (Object.keys(data.players || {}).length >= BATTLE.MAX_PLAYERS) {
      el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--wrong)">❌ 部屋が満員です</div>';
      return null;
    }
    return battleRoomRef(roomId).update({
      [`players.${battleState.myId}`]: { name: battleState.myName, score: 0, joinedAt: Date.now() },
    }).then(() => {
      battleState.unsubRoom = battleRoomRef(roomId).onSnapshot((s) => {
        if (!s.exists) return;
        const d = s.data();
        renderPlayersList(d.players || {}, d.host);
        const actionDiv = $('battle-lobby-action');
        if (actionDiv && d.status === 'waiting') {
          actionDiv.innerHTML = '<div style="text-align:center;font-size:13px;color:var(--text3);padding:12px">👑 ホストの開始を待っています…</div>';
        }
        if (d.status === 'playing') renderGame(contentArea(), d);
      });
    });
  }).catch((e) => console.warn('join error', e));
}

// ---- 対戦 --------------------------------------------------------------

/** ホストが最初の問題を配信してゲームを開始する */
function startGame() {
  const q = makeBattleQuestion(battleState.grade);
  battleRoomRef(battleState.roomId).update({
    status: 'playing',
    currentQuestion: {
      word: q.word,
      answer: q.answer,
      choices: q.choices,
      qNum: 1,
      totalQ: BATTLE.TOTAL_QUESTIONS,
      startedAt: Date.now(),
      timeLimit: BATTLE.TIME_LIMIT_SEC,
    },
    answers: {},
    qNum: 1,
  });
}

function renderGame(el, roomData) {
  if (battleState.unsubRoom) {
    battleState.unsubRoom();
    battleState.unsubRoom = null;
  }
  const roomId = battleState.roomId;
  battleState.grade = roomData.grade;
  battleState.answered = false;
  battleState.hostId = roomData.host;
  battleState.currentQ = null;

  let html = '<div id="battle-game-wrap">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">';
  html += '<div><span style="font-size:11px;color:var(--text3)">早押し対戦</span><span id="battle-qnum" style="font-size:12px;color:var(--primary);font-weight:700;margin-left:6px"></span></div>';
  html += `<div><span class="battle-timer" id="battle-timer">${BATTLE.TIME_LIMIT_SEC}</span><span style="font-size:11px;color:var(--text3)">秒</span></div>`;
  html += '</div>';
  html += '<div id="battle-buzz-msg" style="text-align:center;height:24px;font-size:13px;font-weight:700;color:#9C27B0;margin-bottom:4px"></div>';
  html += '<div class="battle-word" id="battle-word">…</div>';
  html += '<div class="battle-choices" id="battle-choices"></div>';
  html += '<div id="battle-players-score" style="margin-top:10px"></div>';
  html += '</div>';
  el.innerHTML = html;

  battleState.unsubRoom = battleRoomRef(roomId).onSnapshot((snap) => {
    if (!snap.exists) return;
    const data = snap.data();
    if (data.status === 'finished') {
      renderResult(el, data);
      return;
    }
    const q = data.currentQuestion;
    if (!q) return;

    const qnumEl = $('battle-qnum');
    if (qnumEl) qnumEl.textContent = `${q.qNum}/${q.totalQ}問`;
    const wordEl = $('battle-word');
    if (wordEl) wordEl.textContent = q.word;

    // 新しい問題が来たら選択肢とタイマーを組み直す
    const choicesEl = $('battle-choices');
    if (choicesEl && (!battleState.currentQ || battleState.currentQ.word !== q.word)) {
      setupQuestion(choicesEl, roomId, q);
    }

    renderScoreboard(data);
  });
}

/** 選択肢とタイマーを新しい問題用に組み立てる */
function setupQuestion(choicesEl, roomId, q) {
  battleState.currentQ = q;
  battleState.answered = false;
  choicesEl.innerHTML = '';

  q.choices.forEach((choice) => {
    const btn = document.createElement('button');
    btn.className = 'battle-choice';
    btn.textContent = choice;
    btn.addEventListener('click', () => {
      if (battleState.answered) return;
      battleState.answered = true;
      const isCorrect = choice === q.answer;
      submitAnswer(roomId, isCorrect, choice, q);
      document.querySelectorAll('.battle-choice').forEach((b) => {
        b.classList.add('disabled');
        if (b.textContent === q.answer) b.classList.add('correct');
        else if (b === btn && !isCorrect) b.classList.add('wrong');
      });
    });
    choicesEl.appendChild(btn);
  });

  // タイマー（開始時刻からの経過で残り秒を計算）
  if (battleState.timerInt) clearInterval(battleState.timerInt);
  const startTs = q.startedAt || Date.now();
  const updateTimer = () => {
    const elapsed = (Date.now() - startTs) / 1000;
    const remaining = Math.max(0, Math.ceil(q.timeLimit - elapsed));
    const timerEl = $('battle-timer');
    if (timerEl) {
      timerEl.textContent = remaining;
      timerEl.className = `battle-timer${remaining <= 3 ? ' danger' : ''}`;
    }
    if (remaining <= 0) {
      clearInterval(battleState.timerInt);
      if (!battleState.answered) {
        battleState.answered = true;
        document.querySelectorAll('.battle-choice').forEach((b) => {
          b.classList.add('disabled');
          if (b.textContent === q.answer) b.classList.add('correct');
        });
        // 時間切れ: 空回答を送って進行を止めない
        submitAnswer(roomId, false, '', q);
      }
    }
  };
  updateTimer();
  battleState.timerInt = setInterval(updateTimer, 500);
}

/** スコアボードと早押しメッセージを更新する */
function renderScoreboard(data) {
  const answers = data.answers || {};
  const players = data.players || {};

  let html = '<div style="font-size:11px;color:var(--text3);margin-bottom:5px;font-weight:600">スコア</div>';
  Object.keys(players)
    .sort((a, b) => (players[b].score || 0) - (players[a].score || 0))
    .forEach((uid) => {
      const ans = answers[uid];
      const icon = ans ? (ans.correct ? '✅' : '❌') : '…';
      const stateClass = ans ? (ans.correct ? ' answered-correct' : ' answered-wrong') : '';
      const me = uid === battleState.myId ? ' me' : '';
      html += `<div class="battle-player-row${me}${stateClass}">`
        + `<span style="font-size:12px;font-weight:600">${icon} ${esc(players[uid].name)}</span>`
        + `<span class="battle-score-badge">${players[uid].score}pt</span></div>`;
    });
  const scoreEl = $('battle-players-score');
  if (scoreEl) scoreEl.innerHTML = html;

  // 最速正解者の表示
  let firstCorrect = null;
  let firstTime = Infinity;
  Object.keys(answers).forEach((uid) => {
    const a = answers[uid];
    if (a.correct && a.answeredAt < firstTime) {
      firstTime = a.answeredAt;
      firstCorrect = uid;
    }
  });
  const buzzEl = $('battle-buzz-msg');
  if (buzzEl && firstCorrect && players[firstCorrect]) {
    buzzEl.textContent = `⚡ ${players[firstCorrect].name} が早押し！`;
    buzzEl.classList.add('battle-buzz');
  }
}

/**
 * 解答を Firestore へ送信する。
 * 正解は早いほど高得点（最大5pt、経過1秒ごとに-1、最低1pt）。
 * 送信から一定時間後、全員回答済み or 時間切れならホストのみが次の問題を配信する。
 */
function submitAnswer(roomId, isCorrect, chosen, q) {
  const now = Date.now();
  const scoreAdd = isCorrect ? Math.max(1, 5 - Math.floor((now - q.startedAt) / 1000)) : 0;
  const updateData = {
    [`answers.${battleState.myId}`]: { correct: isCorrect, chosen, answeredAt: now },
  };
  if (isCorrect) {
    updateData[`players.${battleState.myId}.score`] = increment(scoreAdd);
  }
  battleRoomRef(roomId).update(updateData).then(() => {
    setTimeout(() => advanceIfReady(roomId, q), BATTLE.ADVANCE_DELAY_MS);
  });
}

/** 進行条件を確認し、満たしていればホストが次の問題 or 終了を書き込む */
function advanceIfReady(roomId, q) {
  battleRoomRef(roomId).get().then((snap) => {
    if (!snap.exists) return;
    const data = snap.data();
    if (data.status !== 'playing') return;
    const cq = data.currentQuestion;
    // 既に次の問題へ進んでいたら何もしない（二重送出防止）
    if (!cq || cq.qNum !== q.qNum) return;

    const players = data.players || {};
    const answers = data.answers || {};
    const allAnswered = Object.keys(players).length > 0
      && Object.keys(players).every((uid) => !!answers[uid]);
    const elapsed = (Date.now() - cq.startedAt) / 1000;
    if (!allAnswered && elapsed < cq.timeLimit + 1) return;

    // 書き込みはホスト端末のみ
    if (data.host !== battleState.myId) return;

    if (cq.qNum >= cq.totalQ) {
      battleRoomRef(roomId).update({ status: 'finished' });
    } else {
      const nextQ = makeBattleQuestion(battleState.grade);
      battleRoomRef(roomId).update({
        currentQuestion: {
          word: nextQ.word,
          answer: nextQ.answer,
          choices: nextQ.choices,
          qNum: cq.qNum + 1,
          totalQ: cq.totalQ,
          startedAt: Date.now(),
          timeLimit: BATTLE.TIME_LIMIT_SEC,
        },
        answers: {},
      });
    }
  });
}

// ---- 結果 --------------------------------------------------------------

function renderResult(el, data) {
  cleanup({ keepRoom: true });
  const players = data.players || {};
  const sorted = Object.keys(players)
    .sort((a, b) => (players[b].score || 0) - (players[a].score || 0));
  const medals = ['🥇', '🥈', '🥉'];

  let html = '<div style="text-align:center;padding:8px 0 16px">';
  html += '<div style="font-size:28px;margin-bottom:4px">🎉</div>';
  html += '<div style="font-size:20px;font-weight:700;color:#9C27B0;margin-bottom:16px">対戦終了！</div>';
  sorted.forEach((uid, i) => {
    const p = players[uid];
    const isMe = uid === battleState.myId;
    html += `<div class="battle-player-row${isMe ? ' me' : ''}" style="${i === 0 ? 'border-color:#FFD700;background:#FFFDE7;' : ''}">`;
    html += `<span style="font-size:16px;font-weight:700">${medals[i] || '  '} ${esc(p.name)}${isMe ? ' (あなた)' : ''}</span>`;
    html += `<span class="battle-score-badge" style="font-size:22px">${p.score || 0}pt</span>`;
    html += '</div>';
  });
  html += '<button id="battle-again-btn" class="battle-primary-btn" style="margin-top:16px">🔄 もう一度遊ぶ</button>';
  html += '<button id="battle-exit-btn" style="width:100%;padding:10px;background:var(--app-bg);color:var(--text2);border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:13px;font-weight:600;cursor:pointer;font-family:\'DM Sans\',sans-serif;margin-top:8px">← モード一覧へ</button>';
  html += '</div>';
  el.innerHTML = html;

  $('battle-again-btn').addEventListener('click', () => {
    if (battleState.isHost) {
      startGame();
      renderLobby(el, battleState.roomId); // 再購読して 'playing' を検知させる
    } else {
      renderLobby(el, battleState.roomId);
    }
  });
  $('battle-exit-btn').addEventListener('click', () => {
    cleanup();
    switchMode('vocab');
  });
}
