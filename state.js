// ===================================================================
// ルーター
// モード名 → ビュー描画関数のレジストリ。
// ビュー同士（例: バトル終了 → 単語クイズへ）が互いを直接 import
// せずに画面遷移できるようにするための仲介役。
// ===================================================================

import { state } from './state.js';
import { contentArea } from './dom.js';

/** @type {Object<string, (el: HTMLElement) => void>} */
const views = {};

/**
 * ビューを登録する（app.js が起動時に呼ぶ）。
 * @param {string} mode
 * @param {(el: HTMLElement) => void} renderFn
 */
export function registerView(mode, renderFn) {
  views[mode] = renderFn;
}

/** 現在のモードのビューをコンテンツ領域へ描画する */
export function renderContent() {
  const render = views[state.mode] || views.stats;
  render(contentArea());
}

/**
 * モードを切り替えて描画し、モードカードのハイライトも同期する。
 * @param {string} mode
 */
export function switchMode(mode) {
  state.mode = mode;
  document.querySelectorAll('.mode-card').forEach((c) => {
    c.classList.toggle('active', c.dataset.mode === mode);
  });
  renderContent();
}
