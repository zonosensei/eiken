// ===================================================================
// DOM ユーティリティ
// ===================================================================

/** document.getElementById の短縮形 */
export const $ = (id) => document.getElementById(id);

/** メインコンテンツ領域を返す */
export const contentArea = () => $('content-area');

/**
 * HTML 特殊文字をエスケープする。
 * 単語データ・ニックネームなど、動的な文字列を innerHTML に埋め込む際は必ず通すこと。
 * @param {string} s
 * @returns {string}
 */
export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * SVG 要素を生成する。
 * @param {string} tag - SVG タグ名
 * @param {Object<string,string|number>} [attrs] - 属性
 * @returns {SVGElement}
 */
export function svgEl(tag, attrs = {}) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

/**
 * 画面下部にトーストを表示する。
 * @param {string} message
 * @param {number} [durationMs=2000]
 */
export function showToast(message, durationMs = 2000) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText =
    'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);' +
    'background:#333;color:#fff;padding:10px 20px;border-radius:24px;' +
    "font-size:13px;z-index:500;font-family:'DM Sans',sans-serif";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), durationMs);
}

/**
 * 全画面オーバーレイを生成して body に追加する。
 * 背景クリックで閉じる挙動つき。
 * @param {string} boxHtml - 中央ボックスの innerHTML
 * @param {{topAligned?: boolean}} [opts]
 * @returns {{overlay: HTMLElement, box: HTMLElement, close: () => void}}
 */
export function createOverlay(boxHtml, opts = {}) {
  const overlay = document.createElement('div');
  overlay.style.cssText =
    'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.45);' +
    `display:flex;align-items:${opts.topAligned ? 'flex-start' : 'center'};` +
    'justify-content:center;z-index:400;padding:20px;overflow-y:auto';
  const box = document.createElement('div');
  box.style.cssText =
    'background:var(--app-bg);border-radius:16px;width:100%;max-width:380px;padding:20px;' +
    (opts.topAligned ? 'margin-top:20px;' : '');
  box.innerHTML = boxHtml;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  const close = () => { if (document.body.contains(overlay)) overlay.remove(); };
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  return { overlay, box, close };
}
