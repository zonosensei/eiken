// ===================================================================
// 効果音・発音
// Web Audio API によるトーンシーケンスと、SpeechSynthesis による
// 英単語の読み上げ。すべての効果音は state.volume（設定画面の
// 音量スライダー）を反映する。
// ===================================================================

import { state } from './state.js';

/**
 * トーン列を再生する共通処理。
 * @param {Array<{freq:number, at:number, dur:number, type?:string, gain?:number, rampIn?:boolean}>} notes
 * @param {number} [volumeOverride] - 0〜1。省略時は state.volume。
 */
function playTones(notes, volumeOverride) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = volumeOverride ?? state.volume;
    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = n.freq;
      osc.type = n.type || 'sine';
      const t = ctx.currentTime + n.at;
      const level = (n.gain ?? 0.3) * master;
      if (n.rampIn) {
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(level, t + 0.02);
      } else {
        gain.gain.setValueAtTime(level, t);
      }
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.dur);
      osc.start(t);
      osc.stop(t + n.dur + 0.05);
    });
  } catch {
    /* 音が出せない環境では黙って続行 */
  }
}

// ---- クイズ・テスト用 ----------------------------------------------

/** 正解音（上昇アルペジオ） */
export function playCorrect() {
  playTones([
    { freq: 523, at: 0,   dur: 0.2, gain: 0.25, rampIn: true },
    { freq: 659, at: 0.1, dur: 0.2, gain: 0.25, rampIn: true },
    { freq: 784, at: 0.2, dur: 0.2, gain: 0.25, rampIn: true },
  ]);
}

/** 不正解音（低いノイズ風） */
export function playWrong() {
  playTones([{ freq: 180, at: 0, dur: 0.3, type: 'sawtooth' }]);
}

/** ミス帳卒業のファンファーレ */
export function playGraduation() {
  playTones([
    { freq: 523,  at: 0,    dur: 0.18, rampIn: true },
    { freq: 659,  at: 0.12, dur: 0.18, rampIn: true },
    { freq: 784,  at: 0.24, dur: 0.18, rampIn: true },
    { freq: 1047, at: 0.38, dur: 0.5,  rampIn: true },
  ]);
  setTimeout(() => {
    playTones(
      [1047, 1175, 1319, 1047].map((freq, i) => ({
        freq, at: i * 0.1, dur: 0.12, type: 'triangle', gain: 0.18, rampIn: true,
      })),
    );
  }, 500);
}

// ---- カウントダウン用 ----------------------------------------------

/** カウントダウンの「3, 2, 1」ビープ */
export function playCountNum() {
  playTones([{ freq: 880, at: 0, dur: 0.15, gain: 0.4 }]);
}

/** カウントダウンの「GAME START!」ジングル */
export function playCountGo() {
  playTones([
    { freq: 1100, at: 0,   dur: 0.25, type: 'triangle', gain: 0.5 },
    { freq: 1100, at: 0.1, dur: 0.25, type: 'triangle', gain: 0.5 },
    { freq: 1320, at: 0.2, dur: 0.25, type: 'triangle', gain: 0.5 },
  ]);
}

// ---- 設定画面用 ----------------------------------------------------

/**
 * 設定画面の「テスト再生」。
 * @param {number} volume - 0〜1（スライダーの値）
 */
export function playTestBeep(volume) {
  playTones(
    [523, 659, 784].map((freq, i) => ({
      freq, at: i * 0.08, dur: 0.2, type: 'triangle', gain: 0.35,
    })),
    volume ?? 0.8,
  );
}

// ---- 発音（読み上げ） ----------------------------------------------

let audioUnlocked = false;

/**
 * iOS の消音モード対策。最初のユーザー操作時に無音バッファを再生して
 * AudioContext / speechSynthesis を有効化する。
 */
function unlockAudioContext() {
  if (audioUnlocked) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createBufferSource();
    src.buffer = ctx.createBuffer(1, 1, 22050);
    src.connect(ctx.destination);
    src.start(0);
    ctx.resume?.();
    audioUnlocked = true;
  } catch {
    /* noop */
  }
}

document.addEventListener('touchstart', unlockAudioContext, { once: true, passive: true });
document.addEventListener('click', unlockAudioContext, { once: true, passive: true });

/**
 * 英単語を読み上げる。
 * @param {string} word
 */
export function speakWord(word) {
  unlockAudioContext();
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(word);
  u.lang = 'en-US';
  u.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}
