// ===================================================================
// ビュー: ランキング
// 全生徒の直近ログを集計し、最高スコア／週間学習単語数／週間正解率の
// 3タブで表示する。スタッフ（STAFF_IDS）は集計から除外する。
// ===================================================================

import { STAFF_IDS } from '../../data/students.js';
import { GRADE_NAMES } from '../constants.js';
import { state } from '../state.js';
import { esc } from '../dom.js';
import { fetchRankingData, fetchRoster } from '../cloud.js';

const TABS = [
  { key: 'score', label: '🏆 最高スコア' },
  { key: 'words', label: '📚 学習単語数' },
  { key: 'rate', label: '📈 正解率' },
];

const MEDALS = ['🥇', '🥈', '🥉'];

/** モードのエントリポイント */
export function renderRanking(el) {
  el.innerHTML = '<div style="font-size:14px;font-weight:600;margin-bottom:8px">🏆 ランキング</div>'
    + '<div style="text-align:center;color:#aaa;padding:32px 0;font-size:13px">読み込み中...</div>';

  // 除外IDは内蔵スタッフ名簿＋クラウド名簿のTグループ（admin登録スタッフ）
  fetchRoster().then((roster) => {
    const exclude = new Set(Object.keys(STAFF_IDS));
    Object.keys(roster).forEach((id) => {
      if (roster[id].group === 'T') exclude.add(id);
    });
    return fetchRankingData(exclude);
  })
    .then((rankData) => renderTabs(el, rankData))
    .catch((e) => {
      el.innerHTML = '<div style="text-align:center;color:#A32D2D;padding:24px;font-size:13px">ランキングの取得に失敗しました</div>';
      console.error(e);
    });
}

function renderTabs(el, rankData) {
  const activeTab = state.rankingTab;

  let html = '<div style="font-size:14px;font-weight:600;margin-bottom:4px">🏆 ランキング</div>';
  html += '<div style="font-size:11px;color:#888;margin-bottom:10px">📅 今週（直近7日間）の記録</div>';
  html += '<div class="tab-row" id="rank-tab-row">';
  TABS.forEach((t) => {
    html += `<button class="tab-btn${activeTab === t.key ? ' active' : ''}" data-tab="${t.key}" style="font-size:12px;padding:8px 10px">${t.label}</button>`;
  });
  html += '</div>';
  html += '<div id="rank-list">';

  if (activeTab === 'score') {
    html += '<div style="font-size:12px;color:#555;padding:6px 0;margin-bottom:4px">単語テスト（100問テスト）の最高スコア</div>';
    const sorted = rankData.slice().sort((a, b) => (b.bestScore || 0) - (a.bestScore || 0));
    html += buildList(sorted, (d) => `${d.bestScore}点`, (d) => d.bestScore, 'テスト受験データがまだありません');
  } else if (activeTab === 'words') {
    html += '<div style="font-size:12px;color:#555;padding:6px 0;margin-bottom:4px">今週学習した単語の総数</div>';
    const sorted = rankData.slice().sort((a, b) => (b.weekTotal || 0) - (a.weekTotal || 0));
    html += buildList(sorted, (d) => `${d.weekTotal}語`, (d) => (d.weekTotal > 0 ? d.weekTotal : null), '今週の学習データがまだありません');
  } else {
    html += '<div style="font-size:12px;color:#555;padding:6px 0;margin-bottom:4px">今週の正解率（10問以上で集計）</div>';
    const sorted = rankData.slice().sort((a, b) => (b.weekRate || 0) - (a.weekRate || 0));
    html += buildList(sorted, (d) => `${d.weekRate}%`, (d) => d.weekRate, '正解率データが足りません（10問以上必要）');
  }
  html += '</div>';
  html += '<div style="font-size:11px;color:#ccc;text-align:center;margin-top:8px">正解率は今週10問以上で集計</div>';

  el.innerHTML = html;
  el.querySelectorAll('#rank-tab-row .tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.rankingTab = btn.dataset.tab;
      renderTabs(el, rankData);
    });
  });
}

/**
 * ランキングリストの HTML を組み立てる（上位20名）。
 * @param {Array} sorted - ソート済みデータ
 * @param {(d) => string} valueLabel - 表示値
 * @param {(d) => number|null} valueFn - null なら集計対象外
 * @param {string} emptyMsg
 */
function buildList(sorted, valueLabel, valueFn, emptyMsg) {
  const withValue = sorted.filter((d) => valueFn(d) !== null);
  if (withValue.length === 0) {
    return `<div style="text-align:center;color:#bbb;padding:24px;font-size:13px">${emptyMsg}</div>`;
  }
  let html = '';
  withValue.slice(0, 20).forEach((d, i) => {
    const rank = i + 1;
    const bg = d.isSelf ? '#FFF9E6' : '#fff';
    const border = d.isSelf ? '2px solid #BA7517' : '1px solid #f0f0f0';
    const rankStr = rank <= 3
      ? MEDALS[rank - 1]
      : `<span style="font-size:13px;color:#aaa;font-weight:700;min-width:24px;display:inline-block;text-align:center">${rank}</span>`;
    html += `<div style="display:flex;align-items:center;padding:10px 12px;background:${bg};border:${border};border-radius:10px;margin-bottom:6px;gap:10px">`;
    html += `<div style="font-size:20px;min-width:28px;text-align:center">${rankStr}</div>`;
    html += '<div style="flex:1;min-width:0">';
    html += `<div style="font-size:14px;font-weight:${d.isSelf ? '700' : '600'};color:${d.isSelf ? '#BA7517' : '#111'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(d.name)}${d.isSelf ? ' 👈' : ''}</div>`;
    html += `<div style="font-size:11px;color:#aaa;margin-top:1px">${GRADE_NAMES[d.grade] || esc(d.grade)}</div>`;
    html += '</div>';
    html += `<div style="font-size:17px;font-weight:700;color:${rank === 1 ? '#BA7517' : rank <= 3 ? '#555' : '#1A4FBF'}">${valueLabel(d)}</div>`;
    html += '</div>';
  });
  return html;
}
