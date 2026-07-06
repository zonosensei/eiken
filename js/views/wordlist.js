// ===================================================================
// ビュー: 単語リスト
// 級のレベルを選んで単語一覧を表示。検索・発音・学習状況アイコン付き。
// posBadgeHtml は他ビュー（クイズ・テスト・ミス帳）からも使う共通部品。
// ===================================================================

import { VOCAB } from '../../data/vocab.js';
import { LEVEL_MAP, GRADE_NAMES } from '../constants.js';
import { state, getWordResult } from '../state.js';
import { $, esc } from '../dom.js';
import { speakWord } from '../audio.js';

/** 品詞 → CSS クラス */
export function posClass(pos) {
  const known = ['動', '名', '形', '副', '前', '接', '代', '間'];
  return known.includes(pos) ? `pos-${pos}` : 'pos-他';
}

/**
 * 品詞バッジの HTML を返す。
 * @param {string} pos - 品詞（空なら空文字を返す）
 * @param {string} [extraStyle]
 */
export function posBadgeHtml(pos, extraStyle = '') {
  if (!pos) return '';
  return `<span class="pos-badge ${posClass(pos)}"${extraStyle ? ` style="${extraStyle}"` : ''}>${esc(pos)}</span>`;
}

/** モードのエントリポイント */
export function renderWordList(el) {
  const levels = LEVEL_MAP[state.grade];
  const total = VOCAB[state.grade].length;

  let html = `<div style="font-size:14px;font-weight:600;margin-bottom:4px">${GRADE_NAMES[state.grade]}の単語リスト</div>`;
  html += `<div style="font-size:12px;color:#888;margin-bottom:14px">全${total}語 ／ レベルを選んでください</div>`;

  html += '<div id="wl-level-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px">';
  levels.forEach((range, i) => {
    const lv = i + 1;
    html += `<button class="tg-btn wl-lv-btn" data-lv="${lv}" style="padding:10px 4px">`;
    html += `<div style="font-weight:700">Lv.${lv}</div>`;
    html += `<div style="font-size:11px;color:#aaa;margin-top:2px">${range[1] - range[0]}語</div>`;
    html += '</button>';
  });
  html += '</div>';
  html += '<button class="tg-btn wl-lv-btn" data-lv="0" style="width:100%;margin-bottom:14px">';
  html += '<div style="font-weight:600">全レベルまとめて</div>';
  html += `<div style="font-size:11px;color:#aaa;margin-top:2px">${total}語</div>`;
  html += '</button>';

  // レベル選択後に表示される検索＋一覧
  html += '<div id="wl-search-wrap" style="display:none">';
  html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">';
  html += '<button id="wl-back-btn" style="font-size:12px;padding:4px 12px;border:1px solid var(--border);border-radius:20px;background:var(--app-bg);color:var(--text2);cursor:pointer">← レベル選択に戻る</button>';
  html += '<span id="wl-level-label" style="font-size:13px;font-weight:600;color:var(--primary)"></span>';
  html += '</div>';
  html += '<input type="text" class="search-input" id="word-search" placeholder="単語を検索...">';
  html += '<div class="word-list-scroll" id="word-list-body"></div>';
  html += '</div>';

  el.innerHTML = html;

  el.querySelectorAll('.wl-lv-btn').forEach((btn) => {
    btn.addEventListener('click', () => showLevel(el, parseInt(btn.dataset.lv, 10)));
  });
}

function showLevel(el, lv) {
  const pool = lv === 0
    ? VOCAB[state.grade]
    : (() => {
        const r = LEVEL_MAP[state.grade][lv - 1];
        return VOCAB[state.grade].slice(r[0], r[1]);
      })();
  const label = lv === 0 ? `全レベル（${pool.length}語）` : `Lv.${lv}（${pool.length}語）`;

  $('wl-level-label').textContent = label;
  $('wl-search-wrap').style.display = 'block';
  el.querySelectorAll('.wl-lv-btn').forEach((b) => { b.style.display = 'none'; });
  $('wl-level-grid').style.display = 'none';

  const body = $('word-list-body');
  const renderList = (query) => {
    body.innerHTML = buildWordListHTML(pool, query);
    body.querySelectorAll('.word-list-speak').forEach((btn) => {
      btn.addEventListener('click', () => speakWord(btn.dataset.w));
    });
  };
  renderList('');

  const search = $('word-search');
  search.value = '';
  search.addEventListener('input', () => renderList(search.value.trim().toLowerCase()));
  $('wl-back-btn').addEventListener('click', () => renderWordList(el));
}

/**
 * 単語一覧の HTML を組み立てる。
 * @param {Array<[string,string,string]>} words
 * @param {string} query - 検索文字列（小文字）
 */
function buildWordListHTML(words, query) {
  const filtered = words.filter((w) =>
    !query || w[0].toLowerCase().includes(query) || w[1].includes(query));
  if (filtered.length === 0) {
    return '<div style="text-align:center;color:#bbb;padding:20px">見つかりません</div>';
  }
  return filtered.map((w, i) => {
    const st = getWordResult(w[0], state.grade);
    let statusIcon = '';
    if (st) {
      if (st.correct > 0 && st.wrong === 0) {
        statusIcon = '<span style="color:#3B6D11;font-size:12px;margin-right:4px" title="正解済">✓</span>';
      } else if (st.correct > 0 && st.wrong > 0) {
        statusIcon = `<span style="color:#BA7517;font-size:12px;margin-right:4px" title="正解${st.correct}回/不正解${st.wrong}回">△</span>`;
      } else {
        statusIcon = '<span style="color:#A32D2D;font-size:12px;margin-right:4px" title="不正解のみ">✗</span>';
      }
    }
    return '<div class="word-list-item">'
      + `<span class="word-list-num">${statusIcon}${i + 1}</span>`
      + `<span class="word-list-en">${esc(w[0])}</span>`
      + `<span class="word-list-pos">${posBadgeHtml(w[2])}</span>`
      + `<span class="word-list-ja">${esc(w[1])}</span>`
      + `<button class="word-list-speak" data-w="${esc(w[0])}" title="発音を聞く">🔊</button>`
      + '</div>';
  }).join('');
}
