// ===================================================================
// Firestore アクセス層
// クラウドとの読み書きをすべてここに集約する。
// ★ コレクション名・フィールド名は旧バージョンと完全互換。
//    既存の学習ログ・進捗・ミス帳データがそのまま使える。
//
// スキーマ:
//   users/{生徒ID}
//     name, grade, nickname, createdAt, lastActive,
//     mistakes (JSON文字列), mistakesUpdatedAt,
//     vocabProgress (JSON文字列), vocabProgressUpdatedAt,
//     vocab_{級}_lv{n|all}: {correct, total, updatedAt},
//     pass_pass_{級}_{ラベル}: JSON文字列（歴史的経緯で pass_ が二重）
//   users/{生徒ID}/logs/{auto}
//     mode, grade, correct, total, score, timestamp
//   battle_rooms/{部屋ID}
//     grade, status, host, createdAt, players, currentQuestion, answers, qNum
// ===================================================================

import { FIREBASE_CONFIG } from './constants.js';
import { state } from './state.js';
import * as storage from './storage.js';

/* global firebase */

firebase.initializeApp(FIREBASE_CONFIG);

/** Firestore インスタンス */
export const db = firebase.firestore();

/** serverTimestamp の短縮形 */
const serverNow = () => firebase.firestore.FieldValue.serverTimestamp();

/** FieldValue.increment の短縮形（バトルのスコア加算用） */
export const increment = (n) => firebase.firestore.FieldValue.increment(n);

// ---- users ---------------------------------------------------------

/**
 * ユーザードキュメントを取得する。
 * @param {string} uid
 * @returns {Promise<firebase.firestore.DocumentSnapshot>}
 */
export const fetchUserDoc = (uid) => db.collection('users').doc(uid).get();

/**
 * ユーザードキュメントが無ければ作成する。
 * @param {string} uid
 * @param {string} name
 * @param {string} grade
 * @param {firebase.firestore.DocumentSnapshot} snap - 取得済みスナップショット
 */
export function ensureUserDoc(uid, name, grade, snap) {
  if (!snap.exists) {
    db.collection('users').doc(uid).set({ name, grade, createdAt: serverNow() });
  }
}

/** ニックネームを保存する */
export function saveNickname(nickname) {
  if (!state.currentUser) return;
  db.collection('users').doc(state.currentUser.uid)
    .set({ nickname }, { merge: true })
    .catch((e) => console.warn('ニックネーム保存エラー', e));
}

// ---- 学習ログ --------------------------------------------------------

/**
 * 学習ログを1件追加し、ユーザーの級・最終学習日時も更新する。
 * 単語進捗（出題順の進行位置）もあわせてクラウドへ保存する。
 * @param {string} mode - 'vocab' | 'test100' など
 * @param {string} grade
 * @param {number} correct
 * @param {number} total
 * @param {number|null} score - 100問テストの得点（それ以外は null）
 */
export function saveLog(mode, grade, correct, total, score) {
  if (!state.currentUser) return;
  const userRef = db.collection('users').doc(state.currentUser.uid);
  userRef.collection('logs').add({
    mode,
    grade,
    correct: correct || 0,
    total: total || 0,
    score: score ?? null,
    timestamp: serverNow(),
  }).catch((e) => console.warn('保存エラー', e));
  userRef.set({ grade, lastActive: serverNow() }, { merge: true });
  saveVocabProgressToCloud();
}

// ---- 単語進捗 --------------------------------------------------------

/** 出題順の進行位置（shuffledIdx）をクラウドへ保存する */
export function saveVocabProgressToCloud() {
  if (!state.currentUser) return;
  db.collection('users').doc(state.currentUser.uid).set(
    {
      vocabProgress: JSON.stringify(state.shuffledIdx),
      vocabProgressUpdatedAt: serverNow(),
    },
    { merge: true },
  ).catch((e) => console.warn('単語進捗保存エラー', e));
}

/**
 * 単語クイズ 1 セット分の結果をユーザードキュメントへ保存する。
 * フィールド名: vocab_{級}_lv{レベル|all}
 * @param {string} grade
 * @param {number} level - 0 は全レベル
 * @param {number} correct
 * @param {number} total
 */
export function saveVocabSetResult(grade, level, correct, total) {
  if (!state.currentUser) return;
  const key = `vocab_${grade}_lv${level === 0 ? 'all' : level}`;
  db.collection('users').doc(state.currentUser.uid).set(
    { [key]: { correct, total, updatedAt: serverNow() } },
    { merge: true },
  ).catch((e) => console.warn(e));
}

// ---- まちがいノート ---------------------------------------------------

/** まちがいノート全体を JSON 文字列としてクラウドへ保存する */
export function saveMistakesToCloud(mistakes) {
  if (!state.currentUser) return;
  db.collection('users').doc(state.currentUser.uid).set(
    { mistakes: JSON.stringify(mistakes), mistakesUpdatedAt: serverNow() },
    { merge: true },
  ).catch((e) => console.warn('まちがいノート保存エラー', e));
}

// ---- 合格記録 --------------------------------------------------------

/**
 * 合格記録をクラウドへ保存する。
 * ※ フィールド名は互換性のため「pass_pass_...」の二重接頭辞を維持している。
 * @param {string} passKey - 'pass_{級}_{ラベル}'
 * @param {object} passData - {score, grade, label, date}
 */
export function savePassToCloud(passKey, passData) {
  if (!state.currentUser) return;
  db.collection('users').doc(state.currentUser.uid).set(
    { [`pass_${passKey}`]: JSON.stringify(passData) },
    { merge: true },
  ).catch((e) => console.warn(e));
}

// ---- クラウド → ローカル復元 -----------------------------------------

/**
 * ユーザードキュメントの内容をローカルへ復元（マージ）する。
 * - まちがいノート: word+grade をキーに、更新日時が新しい方を採用
 * - 単語進捗: クラウド側で上書き
 * - 合格記録: スコアが高い方を採用
 * @param {object} data - ユーザードキュメントの data()
 */
export function restoreProgressFromCloud(data) {
  // まちがいノート
  if (data.mistakes) {
    try {
      const cloudMistakes = JSON.parse(data.mistakes);
      const merged = {};
      storage.loadMistakes().forEach((m) => { merged[`${m.grade}_${m.word}`] = m; });
      cloudMistakes.forEach((m) => {
        const key = `${m.grade}_${m.word}`;
        if (!merged[key] || (m.date || 0) > (merged[key].date || 0)) merged[key] = m;
      });
      storage.saveMistakes(Object.values(merged));
    } catch (e) {
      console.warn('まちがいノート復元エラー', e);
    }
  }

  // 単語進捗
  if (data.vocabProgress) {
    try {
      const prog = JSON.parse(data.vocabProgress);
      Object.keys(prog).forEach((k) => { state.shuffledIdx[k] = prog[k]; });
    } catch (e) {
      console.warn('単語進捗復元エラー', e);
    }
  }

  // 合格記録（pass_pass_ / pass_ の両接頭辞に対応）
  try {
    const localPasses = storage.loadPasses();
    Object.keys(data).forEach((k) => {
      if (k.startsWith('pass_')) {
        const passKey = k.replace(/^pass_/, '');
        try {
          const p = JSON.parse(data[k]);
          if (!localPasses[passKey] || p.score > localPasses[passKey].score) {
            localPasses[passKey] = p;
          }
        } catch {
          /* 壊れた記録はスキップ */
        }
      }
    });
    storage.savePasses(localPasses);
  } catch (e) {
    console.warn('合格記録復元エラー', e);
  }
}

// ---- ランキング ------------------------------------------------------

/**
 * 全ユーザーの直近ログを集計してランキング用データを作る。
 * @param {Set<string>} excludeIds - 集計から除外する ID（スタッフ等）
 * @returns {Promise<Array<{uid, name, grade, bestScore, weekCount, weekRate, weekTotal, isSelf}>>}
 */
export function fetchRankingData(excludeIds) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return db.collection('users').get().then((usersSnap) => {
    const rankData = [];
    const promises = [];
    usersSnap.forEach((userDoc) => {
      const uid = userDoc.id;
      const userData = userDoc.data();
      const p = userDoc.ref.collection('logs')
        .orderBy('timestamp', 'desc').limit(100).get()
        .then((logsSnap) => {
          const logs = logsSnap.docs.map((d) => d.data());
          const testLogs = logs.filter((l) => l.mode === 'test100');
          const bestScore = testLogs.length
            ? Math.max(...testLogs.map((l) => l.score || 0))
            : null;
          const weekLogs = logs.filter(
            (l) => l.timestamp?.toMillis && l.timestamp.toMillis() > weekAgo,
          );
          const weekCorrect = weekLogs.reduce((s, l) => s + (l.correct || 0), 0);
          const weekTotal = weekLogs.reduce((s, l) => s + (l.total || 0), 0);
          const weekRate = weekTotal >= 10 ? Math.round((weekCorrect / weekTotal) * 100) : null;
          if (!excludeIds.has(uid)) {
            rankData.push({
              uid,
              name: userData.nickname || userData.name || '名無し',
              grade: userData.grade || '3',
              bestScore,
              weekCount: weekLogs.length,
              weekRate,
              weekTotal,
              isSelf: state.currentUser?.uid === uid,
            });
          }
        });
      promises.push(p);
    });
    return Promise.all(promises).then(() => rankData);
  });
}

// ---- 生徒名簿（roster） ----------------------------------------------

/**
 * クラウドの生徒名簿を取得する。
 * admin.html の「生徒名簿管理」で登録された生徒がここに入る。
 * @returns {Promise<Object<string,{name:string, group:string}>>}
 *   キーは 8桁生徒ID。取得失敗・空の場合は {} を返す。
 */
export function fetchRoster() {
  return db.collection('roster').get().then((snap) => {
    const roster = {};
    snap.forEach((doc) => {
      const d = doc.data();
      roster[doc.id] = { name: d.name || '', group: d.group === 'T' ? 'T' : 'S' };
    });
    return roster;
  }).catch((e) => {
    console.warn('名簿取得エラー', e);
    return {};
  });
}

// ---- バトル ----------------------------------------------------------

/** battle_rooms のドキュメント参照 */
export const battleRoomRef = (roomId) => db.collection('battle_rooms').doc(roomId);
