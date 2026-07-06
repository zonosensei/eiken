// ===================================================================
// ビュー: まちがいノート
// 「単語一覧」タブ（苦手度順）と「復習クイズ」タブ。
// 復習クイズは苦手度の重み付き抽選で出題し、3回正解で卒業。
// ===================================================================

import { GRADE_NAMES, MISTAKES } from '../constants.js';
import { state } from '../state.js';
import { $, esc } from '../dom.js';
import * as storage from '../storage.js';
import { pickWeighted, buildMistakeChoices } from '../quiz.js';
import { playCorrect, playWrong, playGraduation, speakWord } from '../audio.js';
import { addMistake, recordMistakeCorrect, getReviewPool } from '../mistakes-store.js';
import { updateScoreDisplay } from '../ui.js';
import { posBadgeHtml } from './wordlist.js';

/** モードのエントリポイント */
export function renderMistakes(el) {
  const mistakes = storage.loadMistakes();
  const activeTab = state.mistakesTab;

  let html = '<div style="font-size:14px;font-weight:600;margin-bottom:12px">📕 まちがいノート</div>';
  html += '<div class="tab-row">';
  html += `<button class="tab-btn${activeTab === 'list' ? ' active' : ''}" data-tab="list">単語一覧</button>`;
  html += `<button class="tab-btn${activeTab === 'review' ? ' active' : ''}" data-tab="review">🔄 復習クイズ</button>`;
  html += '</div>';

  const bindTabs = () => {
    el.querySelectorAll('.tab-btn').forEach((b) => {
      b.addEventListener('click', () => {
        state.mistakesTab = b.dataset.tab;
        renderMistakes(el);
      });
    });
  };

  if (mistakes.length === 0) {
    html += '<div style="text-align:center;color:#bbb;padding:40px 0"><div style="font-size:32px;margin-bottom:8px">📝</div><div>間違えた単語はまだありません</div></div>';
    el.innerHTML = html;
    bindTabs();
    return;
  }

  if (activeTab === 'list') {
    html += renderListTab(mistakes);
    el.innerHTML = html;
    bindTabs();
    $('clear-mistakes')?.addEventListener('click', () => {
      if (confirm('まちがいノートをリセットしますか？')) {
        storage.clearMistakes();
        state.mistakesTab = 'list';
        renderMistakes(el);
      }
    });
  } else {
    const pool = getReviewPool();
    html += '<div style="font-size:12px;color:#888;margin-bottom:12px">苦手度の高い単語を優先出題！正解3回で卒業します。</div>';
    html += '<div style="background:#EBF4FF;border-radius:10px;padding:12px;margin-bottom:14px;font-size:12px;color:var(--primary)">';
    html += `📌 出題対象：<strong>${pool.length}語</strong>（苦手度上位から選出）</div>`;
    html += '<button class="next-btn" id="start-review-btn" style="margin-bottom:0">復習クイズをはじめる ▶</button>';
    el.innerHTML = html;
    bindTabs();
    $('start-review-btn').addEventListener('click', () => renderReviewQuestion(el, pool));
  }
}

// ---- 単語一覧タブ ------------------------------------------------------

function renderListTab(mistakes) {
  const sorted = mistakes.slice().sort((a, b) => (b.weak || 1) - (a.weak || 1));
  let html = `<div style="font-size:12px;color:#888;margin-bottom:10px">苦手度の高い順　全${mistakes.length}語<br><span style="color:#3B6D11">✓ ${MISTAKES.GRADUATE_CORRECT}回正解で卒業</span></div>`;
  html += '<div class="word-list-scroll">';
  sorted.forEach((m) => {
    const weak = m.weak || 1;
    const corr = m.correct || 0;
    const stars = '<span style="color:#A32D2D;font-size:12px">★</span>'.repeat(Math.min(weak, 5));
    const barColor = corr === 0 ? '#ddd' : corr === 1 ? '#e85d00' : corr === 2 ? '#BA7517' : '#3B6D11';
    html += '<div class="mistake-item">';
    html += '<div style="flex:1"><div style="display:flex;align-items:center;gap:6px">';
    html += `<span class="word-list-en">${esc(m.word)}</span>`;
    html += `<span class="grade-badge" style="font-size:10px">${GRADE_NAMES[m.grade] || esc(m.grade)}</span>`;
    html += '</div>';
    html += `<div style="color:#888;font-size:12px;margin-top:2px">${esc(m.meaning)}</div>`;
    html += '</div>';
    html += '<div style="text-align:right;min-width:64px">';
    html += `<div style="font-size:11px">${stars}</div>`;
    html += '<div style="margin-top:3px;display:flex;gap:2px;justify-content:flex-end">';
    for (let c = 0; c < MISTAKES.GRADUATE_CORRECT; c++) {
      html += `<div style="width:14px;height:6px;border-radius:3px;background:${c < corr ? barColor : '#eee'}"></div>`;
    }
    html += `</div><div style="font-size:10px;color:#aaa;margin-top:1px">${corr}/${MISTAKES.GRADUATE_CORRECT}回</div>`;
    html += '</div>';
    html += '</div>';
  });
  html += '</div>';
  html += '<button class="next-btn" style="background:#A32D2D;margin-top:12px" id="clear-mistakes">リセット</button>';
  return html;
}

// ---- 復習クイズタブ ----------------------------------------------------

function renderReviewQuestion(el, pool) {
  if (pool.length === 0) {
    state.mistakesTab = 'list';
    renderMistakes(el);
    return;
  }

  const item = pickWeighted(pool);
  const correct = item.meaning;
  const g = item.grade;
  const choices = buildMistakeChoices(item);
  const weak = item.weak || 1;
  const corr = item.correct || 0;
  const stars = '<span style="font-size:13px">★</span>'.repeat(Math.min(weak, 5));
  const pos = item.pos || item[2] || '';

  let html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">';
  html += `<span style="font-size:12px;color:#888">苦手単語復習 | 残り${pool.length}語</span>`;
  html += '<button id="review-exit-btn" style="font-size:12px;padding:4px 12px;border:1px solid var(--border);border-radius:20px;background:var(--app-bg);color:var(--text2);cursor:pointer">一覧に戻る</button>';
  html += '</div>';

  // 苦手度バッジ
  html += '<div style="background:#FFF5F5;border:1px solid #FCEBEB;border-radius:8px;padding:8px 12px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between">';
  html += `<div><div style="font-size:11px;color:#A32D2D;font-weight:600">苦手度</div><div style="color:#A32D2D">${stars}<span style="font-size:11px;color:#aaa;margin-left:4px">×${weak}</span></div></div>`;
  html += '<div style="text-align:right"><div style="font-size:11px;color:#888">正解回数</div>';
  html += '<div style="display:flex;gap:3px;margin-top:2px;justify-content:flex-end">';
  for (let c = 0; c < MISTAKES.GRADUATE_CORRECT; c++) {
    const col = c < corr ? (corr === 1 ? '#e85d00' : corr === 2 ? '#BA7517' : '#3B6D11') : '#ddd';
    html += `<div style="width:18px;height:8px;border-radius:4px;background:${col}"></div>`;
  }
  html += `</div><div style="font-size:10px;color:#aaa;margin-top:2px">あと${MISTAKES.GRADUATE_CORRECT - corr}回正解で卒業</div>`;
  html += '</div></div>';

  html += '<div class="word-display" style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:4px">'
    + (pos ? `${posBadgeHtml(pos, 'font-size:12px;vertical-align:middle')} ` : '')
    + esc(item.word)
    + '<button id="review-speak" style="background:none;border:none;cursor:pointer;font-size:20px;opacity:.65;padding:0">🔊</button>'
    + '</div>';
  html += `<div style="font-size:11px;color:#aaa;text-align:center;margin-bottom:14px">${GRADE_NAMES[g] || esc(g)}</div>`;
  html += '<div id="rvfb" class="feedback" style="display:none"></div>';
  html += '<div class="choices" id="rvchoices">';
  choices.forEach((c) => {
    html += `<button class="choice-btn" data-c="${esc(c)}">${esc(c)}</button>`;
  });
  html += '</div>';
  html += '<button id="rv-dontknow" style="margin-top:4px;width:100%;padding:12px;border:1px solid #e0e0e0;border-radius:12px;background:#f5f5f5;color:#999;font-size:13px;cursor:pointer;font-weight:600">分からない</button>';
  html += '<button class="next-btn" id="rv-next" style="display:none">次の苦手単語へ →</button>';

  el.innerHTML = html;
  $('review-speak').addEventListener('click', () => speakWord(item.word));

  let answered = false;

  const revealChoices = (wrongBtn) => {
    el.querySelectorAll('.choice-btn').forEach((b) => {
      b.classList.add('disabled');
      if (b.dataset.c === correct) b.classList.add('correct');
      else if (b === wrongBtn) b.classList.add('wrong');
    });
  };

  const showWrong = () => {
    const fb = $('rvfb');
    fb.style.display = 'block';
    fb.className = 'feedback wrong';
    fb.textContent = `不正解… 正解は「${correct}」`;
    playWrong();
    addMistake(item.word, correct, g);
    state.score.total++;
    updateScoreDisplay();
    $('rv-next').style.display = 'block';
  };

  const nextQuestion = () => {
    const latest = storage.loadMistakes();
    if (latest.length === 0) {
      state.mistakesTab = 'list';
      renderMistakes(el);
      return;
    }
    renderReviewQuestion(el, getReviewPool());
  };

  el.querySelectorAll('.choice-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      const ok = btn.dataset.c === correct;
      revealChoices(ok ? null : btn);
      if (ok) {
        // 卒業（3回目の正解）かどうかを、記録更新前の状態で判定する
        const before = storage.loadMistakes()
          .find((m) => m.word === item.word && m.grade === g);
        const isGraduation = before && (before.correct || 0) >= MISTAKES.GRADUATE_CORRECT - 1;
        const fb = $('rvfb');
        fb.style.display = 'block';
        fb.className = 'feedback correct';
        if (isGraduation) {
          fb.textContent = '🎉 卒業！3回正解達成！';
          playGraduation();
        } else {
          fb.textContent = '正解！';
          playCorrect();
        }
        recordMistakeCorrect(item.word, g);
        state.score.correct++;
        state.score.total++;
        updateScoreDisplay();
        setTimeout(nextQuestion, isGraduation ? 1400 : 900);
      } else {
        showWrong();
      }
    });
  });

  $('rv-dontknow').addEventListener('click', function onDontKnow() {
    if (answered) return;
    answered = true;
    revealChoices(null);
    this.disabled = true;
    this.style.opacity = '0.4';
    showWrong();
  });

  $('rv-next').addEventListener('click', nextQuestion);
  $('review-exit-btn').addEventListener('click', () => {
    state.mistakesTab = 'list';
    renderMistakes(el);
  });
}
