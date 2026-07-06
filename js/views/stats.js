// ===================================================================
// ビュー: 進捗確認
// 今日の学習カウンター・級の単語進捗・レベル別進捗と、
// 進捗に応じて育つおじさんイラストを表示する。
// ===================================================================

import { VOCAB } from '../../data/vocab.js';
import { LEVEL_MAP, GRADE_NAMES } from '../constants.js';
import { state, todayKey, getWordResult } from '../state.js';
import { $ } from '../dom.js';
import { renderOjisan } from '../graphics.js';

/** 進捗10%刻みのステージラベル */
const STAGE_LABELS = [
  'つるつる…', 'うぶ毛がぴょっと！', '芽が育ってきた！', '草原が広がった！',
  '低木が育ってる！', '花畑が咲き誇る🦋', '高い木と白い鳥🕊', '小さな家が建った🏠',
  '滝ができた💧', '虹が架かった🌈', 'オーロラが輝く✨',
];

/** モードのエントリポイント */
export function renderStats(el) {
  const { correct: dCorrect, total: dTotal } = state.dailyStats;
  const dPct = dTotal ? Math.round((dCorrect / dTotal) * 100) : 0;
  const gradeTotal = VOCAB[state.grade].length;

  // 1回でも正解した単語数
  let learnedCount = 0;
  VOCAB[state.grade].forEach((w) => {
    const st = getWordResult(w[0], state.grade);
    if (st && st.correct > 0) learnedCount++;
  });
  const progPct = Math.round((learnedCount / gradeTotal) * 100);

  // レベル別進捗
  const levels = LEVEL_MAP[state.grade];
  const levelProgress = levels.map((range, i) => {
    const pool = VOCAB[state.grade].slice(range[0], range[1]);
    let learned = 0;
    pool.forEach((w) => {
      const st = getWordResult(w[0], state.grade);
      if (st && st.correct > 0) learned++;
    });
    return { lv: i + 1, total: pool.length, learned, pct: Math.round((learned / pool.length) * 100) };
  });

  // イラスト用に10%刻みへ丸める
  const animPct = Math.floor(progPct / 10) * 10;

  let html = '<div style="font-size:14px;font-weight:600;margin-bottom:12px">📊 進捗確認</div>';
  html += `<div style="font-size:12px;color:#888;margin-bottom:8px">📅 今日の学習（${todayKey}）</div>`;
  html += '<div class="stats-row">';
  html += `<div class="stat-card"><div class="stat-num">${dCorrect}</div><div class="stat-label">正解数</div></div>`;
  html += `<div class="stat-card"><div class="stat-num">${dTotal}</div><div class="stat-label">挑戦数</div></div>`;
  html += `<div class="stat-card"><div class="stat-num">${dPct}%</div><div class="stat-label">正解率</div></div>`;
  html += '</div>';
  html += `<div style="font-size:13px;font-weight:600;color:#888;margin-bottom:6px">${GRADE_NAMES[state.grade]}の単語進捗（正解した単語数）</div>`;
  html += '<div class="cat-row" style="margin-bottom:8px">';
  html += '<div style="display:flex;justify-content:space-between;margin-bottom:4px">';
  html += `<span style="font-size:13px;font-weight:500">${learnedCount} / ${gradeTotal}語</span>`;
  html += `<span style="font-size:13px;color:var(--primary);font-weight:600">${progPct}%</span></div>`;
  html += `<div class="progress-bar-wrap"><div class="progress-bar" style="width:${progPct}%"></div></div>`;
  html += '</div>';

  html += `<div style="display:grid;grid-template-columns:repeat(${Math.min(levels.length, 4)},1fr);gap:6px;margin-bottom:14px">`;
  levelProgress.forEach((lp) => {
    html += '<div style="background:#f5f5f5;border-radius:8px;padding:8px;text-align:center">';
    html += `<div style="font-size:11px;color:#888">Lv.${lp.lv}</div>`;
    html += `<div style="font-size:16px;font-weight:700;color:var(--primary)">${lp.pct}%</div>`;
    html += `<div style="font-size:10px;color:#aaa">${lp.learned}/${lp.total}</div>`;
    html += '</div>';
  });
  html += '</div>';

  html += `<div style="text-align:center;font-size:13px;color:#BA7517;font-weight:600;margin-bottom:6px">${STAGE_LABELS[Math.floor(animPct / 10)]}</div>`;
  html += '<div id="ojisan-svg-wrap" style="width:100%;display:flex;justify-content:center"></div>';
  el.innerHTML = html;

  renderOjisan($('ojisan-svg-wrap'), animPct);
}
