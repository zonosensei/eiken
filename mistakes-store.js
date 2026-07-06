// ===================================================================
// SVG グラフィック
// - 合格スタンプ（手書き風の赤ハンコ）
// - 野球アニメーション（テスト結果の点数帯で4パターン）
// - おじさん進捗イラスト（正解単語数に応じて頭に自然が育つ）
// 座標・色などの描画データは旧バージョンから忠実に移植している。
// ===================================================================

import { svgEl, esc } from './dom.js';
import { GRADES, GRADE_NAMES } from './constants.js';

// ---- 合格スタンプ ----------------------------------------------------

/**
 * 小さな合格スタンプの SVG 文字列を作る（スタンプカード用）。
 * @param {string} label - 'Lv.1' や '全レベル'
 * @param {number} score
 * @param {number} [tilt] - 傾き（度）。省略時はランダム。
 */
export function makePassStampSVG(label, score, tilt) {
  const t = tilt ?? (-8 + Math.random() * 16);
  return `<svg width="72" height="80" viewBox="0 0 72 80" style="display:inline-block;transform:rotate(${t}deg)">`
    + '<ellipse cx="36" cy="38" rx="32" ry="34" fill="none" stroke="#c00" stroke-width="3.5" stroke-dasharray="6 3" opacity="0.9"/>'
    + '<text x="36" y="34" text-anchor="middle" font-size="18" font-weight="900" fill="#c00" font-family="serif" letter-spacing="2">合格</text>'
    + `<text x="36" y="52" text-anchor="middle" font-size="9" font-weight="600" fill="#c00" font-family="sans-serif">${esc(label)}</text>`
    + `<text x="36" y="63" text-anchor="middle" font-size="9" font-weight="700" fill="#c00" font-family="sans-serif">${score}点</text>`
    + '</svg>';
}

/**
 * 合格スタンプカードの HTML を作る。
 * @param {Object<string, {score:number, label?:string}>} passes - 合格記録
 */
export function renderStampCard(passes) {
  if (Object.keys(passes).length === 0) {
    return '<div style="font-size:12px;color:#ccc;text-align:center;padding:16px 0">合格するとここにスタンプが押されます</div>';
  }
  let html = '<div style="margin-top:14px;border-top:1px solid #eee;padding-top:12px">';
  html += '<div style="font-size:12px;font-weight:600;color:#888;margin-bottom:10px">🏆 合格スタンプカード</div>';
  GRADES.forEach((g) => {
    const gradeKeys = Object.keys(passes).filter((k) => k.startsWith(`pass_${g}_`));
    if (gradeKeys.length === 0) return;
    html += '<div style="margin-bottom:12px">';
    html += `<div style="font-size:11px;color:#555;font-weight:600;margin-bottom:6px">${GRADE_NAMES[g]}</div>`;
    html += '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">';
    gradeKeys.forEach((k) => {
      const p = passes[k];
      const label = p.label || k.replace(`pass_${g}_`, '');
      const tilt = -10 + Math.floor(Math.random() * 20);
      html += makePassStampSVG(label, p.score, tilt);
    });
    html += '</div></div>';
  });
  html += '</div>';
  return html;
}

// ---- 野球アニメーション ----------------------------------------------

/**
 * テスト結果の野球アニメーションを描画する。
 * 95点以上=ホームラン / 80点以上=ヘッドスライディングでアウト /
 * 60点以上=フライアウト / それ未満=空振り三振
 * @param {HTMLElement} wrap - 描画先
 * @param {number} score - 100点満点換算のスコア
 */
export function renderBaseballAnim(wrap, score) {
  const W = 320;
  const H = 220;
  const svg = svgEl('svg', { width: '100%', viewBox: `0 0 ${W} ${H}` });
  svg.style.maxWidth = '360px';
  const el = svgEl;

  // 背景
  const bgColor = score >= 95 ? '#e8f5e9' : score >= 80 ? '#fff3e0' : score >= 60 ? '#fff8e1' : '#fce4ec';
  svg.appendChild(el('rect', { x: 0, y: 0, width: W, height: H, fill: bgColor, rx: 12 }));

  // グラウンド
  const gy = H - 40;
  svg.appendChild(el('ellipse', { cx: W / 2, cy: gy + 8, rx: 110, ry: 16, fill: '#8d6e63', opacity: '.35' }));
  svg.appendChild(el('rect', { x: W / 2 - 80, y: gy - 8, width: 160, height: 16, rx: 4, fill: '#a5d6a7', opacity: '.5' }));
  if (score >= 80 && score < 95) {
    svg.appendChild(el('line', { x1: W / 2 - 80, y1: gy, x2: W / 2 + 80, y2: gy, stroke: '#795548', 'stroke-width': 2, 'stroke-dasharray': '6 4', opacity: '.6' }));
    svg.appendChild(el('rect', { x: W / 2 + 55, y: gy - 14, width: 18, height: 12, rx: 2, fill: 'white', stroke: '#795548', 'stroke-width': 1.5 }));
  }

  /**
   * バッター（ハゲおやじ）を描く。
   * @param {SVGGElement} g
   * @param {number} bx - 体の中心 x
   * @param {number} by - 足元 y
   * @param {'homerun'|'slide'|'foul'|'strikeout'|'swing'} anim
   */
  function drawBatter(g, bx, by, anim) {
    // 影
    g.appendChild(el('ellipse', { cx: bx, cy: by + 2, rx: 18, ry: 6, fill: 'rgba(0,0,0,.18)' }));
    // 足
    const leg1 = el('path', { d: `M${bx - 8},${by - 10} L${bx - 12},${by}`, stroke: '#37474f', 'stroke-width': 5, 'stroke-linecap': 'round', fill: 'none' });
    const leg2 = el('path', { d: `M${bx + 8},${by - 10} L${bx + 12},${by}`, stroke: '#37474f', 'stroke-width': 5, 'stroke-linecap': 'round', fill: 'none' });
    if (anim === 'slide') {
      leg1.setAttribute('d', `M${bx - 20},${by - 5} L${bx - 30},${by}`);
      leg2.setAttribute('d', `M${bx},${by - 5} L${bx + 10},${by}`);
    }
    g.appendChild(leg1);
    g.appendChild(leg2);
    // 体
    const bodyColor = anim === 'slide' ? '#1565c0' : '#1A4FBF';
    if (anim === 'slide') {
      g.appendChild(el('ellipse', { cx: bx - 10, cy: by - 22, rx: 22, ry: 12, fill: bodyColor, transform: `rotate(-30,${bx - 10},${by - 22})` }));
    } else {
      g.appendChild(el('rect', { x: bx - 12, y: by - 38, width: 24, height: 28, rx: 6, fill: bodyColor }));
    }
    // バット
    if (['swing', 'homerun', 'foul', 'strikeout'].includes(anim)) {
      const batAngle = anim === 'homerun' ? -50 : anim === 'foul' ? -20 : anim === 'strikeout' ? 60 : 30;
      const batX = bx + 15;
      const batY = by - 32;
      const batLen = 45;
      const rad = (batAngle * Math.PI) / 180;
      const tx = batX + Math.cos(rad) * batLen;
      const ty = batY + Math.sin(rad) * batLen;
      g.appendChild(el('line', { x1: batX, y1: batY, x2: tx, y2: ty, stroke: '#4e342e', 'stroke-width': 5, 'stroke-linecap': 'round' }));
      g.appendChild(el('circle', { cx: tx, cy: ty, r: 6, fill: '#8d5524' }));
    }
    // 頭（ハゲ）
    const headY = anim === 'slide' ? by - 42 : by - 55;
    const headX = anim === 'slide' ? bx - 18 : bx;
    g.appendChild(el('ellipse', { cx: headX, cy: headY, rx: 16, ry: 18, fill: '#fce8c0', stroke: '#c89040', 'stroke-width': 1.5 }));
    g.appendChild(el('ellipse', { cx: headX - 4, cy: headY - 6, rx: 6, ry: 4, fill: 'white', opacity: '.4', transform: `rotate(-20,${headX - 4},${headY - 6})` }));
    // 目
    g.appendChild(el('circle', { cx: headX - 6, cy: headY - 2, r: 2.5, fill: '#212121' }));
    g.appendChild(el('circle', { cx: headX + 6, cy: headY - 2, r: 2.5, fill: '#212121' }));
    // 口
    if (anim === 'homerun' || anim === 'swing') {
      g.appendChild(el('path', { d: `M${headX - 7},${headY + 6} Q${headX},${headY + 14} ${headX + 7},${headY + 6}`, fill: '#5a1e08', stroke: 'none' }));
      g.appendChild(el('rect', { x: headX - 5, y: headY + 7, width: 10, height: 5, rx: 2, fill: 'white' }));
    } else if (anim === 'strikeout') {
      g.appendChild(el('path', { d: `M${headX - 6},${headY + 10} Q${headX},${headY + 5} ${headX + 6},${headY + 10}`, stroke: '#5a1e08', 'stroke-width': 2, fill: 'none' }));
    } else {
      g.appendChild(el('path', { d: `M${headX - 5},${headY + 8} Q${headX},${headY + 13} ${headX + 5},${headY + 8}`, stroke: '#5a1e08', 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' }));
    }
    // ヘルメット
    g.appendChild(el('path', { d: `M${headX - 16},${headY - 5} Q${headX - 10},${headY - 26} ${headX},${headY - 26} Q${headX + 16},${headY - 26} ${headX + 16},${headY - 5}`, fill: '#1a1a1a' }));
    if (anim !== 'slide') {
      g.appendChild(el('rect', { x: headX - 18, y: headY - 7, width: 6, height: 5, rx: 1, fill: '#1a1a1a' }));
    }
  }

  /** テキスト要素を追加する */
  function addText(g, x, y, size, fill, text, bold) {
    const t = el('text', { x, y, 'font-size': size, fill, 'text-anchor': 'middle', ...(bold ? { 'font-weight': 'bold' } : {}) });
    t.textContent = text;
    g.appendChild(t);
  }

  const g = el('g', {});

  if (score >= 95) {
    // ホームラン：ガッツポーズ、ボールが飛んでいく
    drawBatter(g, 110, gy, 'homerun');
    g.appendChild(el('circle', { cx: 220, cy: gy - 80, r: 10, fill: 'white', stroke: '#bdbdbd', 'stroke-width': 1.5 }));
    g.appendChild(el('path', { d: `M215,${gy - 83} Q220,${gy - 78} 225,${gy - 83}`, stroke: '#e53935', 'stroke-width': 1.5, fill: 'none' }));
    g.appendChild(el('path', { d: `M215,${gy - 77} Q220,${gy - 82} 225,${gy - 77}`, stroke: '#e53935', 'stroke-width': 1.5, fill: 'none' }));
    [[260, gy - 120], [240, gy - 100], [280, gy - 90]].forEach(([x, y]) => addText(g, x, y, 16, '#FFD700', '⭐'));
    g.appendChild(el('path', { d: `M130,${gy - 40} Q200,${gy - 130} 270,${gy - 90}`, stroke: '#FFD700', 'stroke-width': 2, 'stroke-dasharray': '6 4', fill: 'none', opacity: '.7' }));
    g.appendChild(el('line', { x1: 110, y1: gy - 42, x2: 90, y2: gy - 80, stroke: '#1A4FBF', 'stroke-width': 5, 'stroke-linecap': 'round' }));
    g.appendChild(el('line', { x1: 110, y1: gy - 42, x2: 130, y2: gy - 60, stroke: '#1A4FBF', 'stroke-width': 5, 'stroke-linecap': 'round' }));
    addText(g, W / 2 + 30, 30, 22, '#c00', 'ホームラン！', true);
  } else if (score >= 80) {
    // ヘッドスライディングするもアウト
    drawBatter(g, 140, gy, 'slide');
    g.appendChild(el('circle', { cx: 250, cy: gy - 60, r: 14, fill: '#263238' }));
    g.appendChild(el('ellipse', { cx: 250, cy: gy - 45, rx: 12, ry: 16, fill: '#263238' }));
    g.appendChild(el('line', { x1: 250, y1: gy - 52, x2: 225, y2: gy - 75, stroke: '#263238', 'stroke-width': 5, 'stroke-linecap': 'round' }));
    g.appendChild(el('line', { x1: 250, y1: gy - 52, x2: 275, y2: gy - 75, stroke: '#263238', 'stroke-width': 5, 'stroke-linecap': 'round' }));
    addText(g, 255, gy - 95, 20, '#c00', 'アウト！', true);
    addText(g, 255, gy - 78, 12, '#888', 'あと一歩…');
    g.appendChild(el('path', { d: `M${140 + 28},${gy - 10} L${140 + 55},${gy - 10}`, stroke: '#e53935', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: '.6', 'stroke-dasharray': '4 3' }));
  } else if (score >= 60) {
    // フライを打ち上げてアウト
    drawBatter(g, 90, gy, 'foul');
    g.appendChild(el('circle', { cx: 160, cy: gy - 120, r: 10, fill: 'white', stroke: '#bdbdbd', 'stroke-width': 1.5 }));
    g.appendChild(el('path', { d: `M156,${gy - 123} Q160,${gy - 118} 164,${gy - 123}`, stroke: '#e53935', 'stroke-width': 1.5, fill: 'none' }));
    g.appendChild(el('path', { d: `M110,${gy - 35} Q155,${gy - 140} 160,${gy - 120}`, stroke: '#888', 'stroke-width': 1.5, 'stroke-dasharray': '5 3', fill: 'none', opacity: '.6' }));
    g.appendChild(el('circle', { cx: 230, cy: gy - 55, r: 12, fill: '#fce8c0', stroke: '#c89040', 'stroke-width': 1.5 }));
    g.appendChild(el('ellipse', { cx: 230, cy: gy - 40, rx: 12, ry: 15, fill: '#1A4FBF' }));
    g.appendChild(el('line', { x1: 230, y1: gy - 45, x2: 215, y2: gy - 75, stroke: '#1A4FBF', 'stroke-width': 5, 'stroke-linecap': 'round' }));
    g.appendChild(el('circle', { cx: 213, cy: gy - 76, r: 9, fill: '#8d5524' }));
    addText(g, W / 2 + 30, 25, 16, '#e85d00', 'フライアウト！', true);
  } else {
    // 空振り三振
    drawBatter(g, 140, gy, 'strikeout');
    g.appendChild(el('circle', { cx: 240, cy: gy - 38, r: 10, fill: 'white', stroke: '#bdbdbd', 'stroke-width': 1.5 }));
    g.appendChild(el('path', { d: `M236,${gy - 41} Q240,${gy - 36} 244,${gy - 41}`, stroke: '#e53935', 'stroke-width': 1.5, fill: 'none' }));
    [gy - 50, gy - 38, gy - 26].forEach((y) => {
      g.appendChild(el('line', { x1: 200, y1: y, x2: 255, y2: y, stroke: '#888', 'stroke-width': 1.5, opacity: '.5' }));
    });
    g.appendChild(el('circle', { cx: 270, cy: gy - 52, r: 14, fill: '#263238' }));
    g.appendChild(el('ellipse', { cx: 270, cy: gy - 36, rx: 13, ry: 16, fill: '#263238' }));
    g.appendChild(el('line', { x1: 270, y1: gy - 45, x2: 260, y2: gy - 70, stroke: '#263238', 'stroke-width': 5, 'stroke-linecap': 'round' }));
    g.appendChild(el('circle', { cx: 258, cy: gy - 71, r: 9, fill: '#8d5524' }));
    addText(g, 85, 30, 28, '#c00', 'K', true);
    addText(g, 85, 52, 12, '#888', '三振…');
  }

  svg.appendChild(g);
  wrap.appendChild(svg);
}

// ---- おじさん進捗イラスト --------------------------------------------

/**
 * 進捗確認画面のおじさんイラストを描画する。
 * 進捗（%）が上がるほど頭に自然が育ち、表情も明るくなる。
 * @param {HTMLElement} container - 描画先
 * @param {number} pct - 進捗（10%刻みに丸め済み）
 */
export function renderOjisan(container, pct) {
  const HX = 180;
  const HY = 310;
  const HRX = 88;
  const HRY = 100;
  const el = svgEl;

  /** 頭の輪郭上の点と法線方向の先端座標を返す */
  function grow(deg, len) {
    const r = (deg * Math.PI) / 180;
    const bx = HX + HRX * Math.cos(r);
    const by = HY + HRY * Math.sin(r);
    let nx = Math.cos(r) / HRX;
    let ny = Math.sin(r) / HRY;
    const nl = Math.sqrt(nx * nx + ny * ny);
    nx /= nl;
    ny /= nl;
    return { bx, by, tx: bx + nx * len, ty: by + ny * len, nx, ny };
  }

  const s = Math.floor(pct / 10); // ステージ 0〜10

  const svg = el('svg', { width: '360', viewBox: '0 0 360 460', style: 'max-width:100%' });

  // 空背景
  const skyColors = ['', '#e8f5fc', '#d0ecf7', '#bce5f0', '#aadfe8', '#d0f0c0', '#a8d8f0', '#88c8e8', '#78b8e0', '#c8e8ff', '#ddf4ff'];
  svg.appendChild(el('rect', { x: 0, y: 0, width: 360, height: 460, fill: s >= 1 ? (skyColors[s] || '#e8f5fc') : '#f5f5f5' }));

  const nb = el('g', {}); // 自然（背面レイヤー）
  svg.appendChild(nb);

  // 首
  svg.appendChild(el('path', { d: 'M156,388 Q156,408 180,411 Q204,408 204,388 L198,379 Q185,387 180,388 Q175,387 162,379 Z', fill: '#f0b860' }));

  // グラデーション定義
  const head = el('ellipse', { cx: HX, cy: HY, rx: HRX, ry: HRY });
  head.setAttribute('fill', 'url(#faceGS)');
  const defs = el('defs', {});
  const faceGrad = el('radialGradient', { id: 'faceGS', cx: '38%', cy: '40%', r: '62%' });
  [['0%', '#fce8c0'], ['50%', '#f5c878'], ['100%', '#e0a040']].forEach(([offset, color]) => {
    faceGrad.appendChild(el('stop', { offset, 'stop-color': color }));
  });
  const shineGrad = el('radialGradient', { id: 'shineGS', cx: '50%', cy: '50%', r: '50%' });
  [['0%', 'rgba(255,255,255,0.6)'], ['100%', 'rgba(255,255,255,0)']].forEach(([offset, color]) => {
    shineGrad.appendChild(el('stop', { offset, 'stop-color': color }));
  });
  defs.appendChild(faceGrad);
  defs.appendChild(shineGrad);
  svg.insertBefore(defs, svg.firstChild);

  // 耳
  svg.appendChild(el('path', { d: 'M93,296 Q78,294 75,312 Q71,330 83,344 Q91,352 102,346 Q109,340 107,315 Z', fill: '#f5c060' }));
  svg.appendChild(el('path', { d: 'M95,303 Q86,306 83,318 Q80,331 88,339 Q92,342 95,333 Q94,317 97,305 Z', fill: '#c88020', opacity: '.4' }));
  svg.appendChild(el('path', { d: 'M267,296 Q282,294 285,312 Q289,330 277,344 Q269,352 258,346 Q251,340 253,315 Z', fill: '#f5c060' }));
  svg.appendChild(el('path', { d: 'M265,303 Q274,306 277,318 Q280,331 272,339 Q268,342 265,333 Q266,317 263,305 Z', fill: '#c88020', opacity: '.4' }));
  svg.appendChild(head);

  // 頭の光沢（進捗が上がる＝毛が生える＝光沢が減る）
  const shineG = el('g', { opacity: Math.max(0, 1 - s * 0.14) });
  shineG.appendChild(el('ellipse', { cx: 154, cy: 264, rx: 30, ry: 19, fill: 'url(#shineGS)', transform: 'rotate(-28,154,264)' }));
  shineG.appendChild(el('ellipse', { cx: 165, cy: 253, rx: 13, ry: 8, fill: 'white', opacity: '.26', transform: 'rotate(-22,165,253)' }));
  svg.appendChild(shineG);

  // ---- 自然（ステージごとに積み重ねて描く） ----
  // 0%: じょうろ
  if (s === 0) {
    const jx = 242;
    const jy = 158;
    nb.appendChild(el('rect', { x: jx, y: jy, width: 42, height: 30, rx: 5, fill: '#42a5f5', stroke: '#1976d2', 'stroke-width': 1 }));
    nb.appendChild(el('path', { d: `M${jx + 42},${jy + 6} Q${jx + 58},${jy + 2} ${jx + 60},${jy + 16} Q${jx + 60},${jy + 30} ${jx + 42},${jy + 28}`, stroke: '#1976d2', 'stroke-width': 2.8, fill: 'none', 'stroke-linecap': 'round' }));
    nb.appendChild(el('path', { d: `M${jx},${jy + 22} Q${jx - 18},${jy + 18} ${jx - 22},${jy + 26} L${jx - 17},${jy + 40}`, stroke: '#1976d2', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }));
    nb.appendChild(el('rect', { x: jx + 11, y: jy - 7, width: 10, height: 8, rx: 2, fill: '#1976d2' }));
    [{ x: 204, y: 202 }, { x: 200, y: 218 }, { x: 205, y: 236 }, { x: 199, y: 254 }, { x: 204, y: 272 }].forEach((d) => {
      nb.appendChild(el('ellipse', { cx: d.x, cy: d.y, rx: 2.2, ry: 3.6, fill: '#90caf9', opacity: 0.82 }));
    });
  }
  // 10%: うぶ毛
  if (s >= 1) {
    for (let d = -158; d <= -22; d += 8) {
      const v = grow(d, 6 + Math.sin(d * 0.3) * 2.5);
      const wave = Math.sin(d * 0.15) * 3;
      const mx = v.bx + v.nx * 4 + v.ny * wave;
      const my = v.by + v.ny * 4 + v.nx * wave;
      nb.appendChild(el('path', { d: `M${v.bx},${v.by} Q${mx},${my} ${v.tx},${v.ty}`, stroke: d % 16 === 0 ? '#81c784' : '#a5d6a7', 'stroke-width': 1.4, fill: 'none', 'stroke-linecap': 'round' }));
    }
  }
  // 20%: 芽
  if (s >= 2) {
    for (let d = -155; d <= -25; d += 12) {
      const len = 14 + Math.sin(d * 0.25) * 4;
      const v = grow(d, len);
      const mx = v.bx + v.nx * len * 0.55 + v.ny * Math.sin(d * 0.2) * 3;
      const my = v.by + v.ny * len * 0.55 + v.nx * Math.sin(d * 0.2) * 3;
      nb.appendChild(el('path', { d: `M${v.bx},${v.by} Q${mx},${my} ${v.tx},${v.ty}`, stroke: d % 24 === 0 ? '#388e3c' : '#43a047', 'stroke-width': 1.8, fill: 'none', 'stroke-linecap': 'round' }));
      const lx = v.tx - v.ny * 7;
      const ly = v.ty + v.nx * 7;
      const rx = v.tx + v.ny * 7;
      const ry = v.ty - v.nx * 7;
      nb.appendChild(el('path', { d: `M${v.tx},${v.ty} Q${lx},${ly - 4} ${lx - v.nx * 2},${ly + 3}`, fill: '#66bb6a', opacity: 0.9 }));
      nb.appendChild(el('path', { d: `M${v.tx},${v.ty} Q${rx},${ry - 4} ${rx - v.nx * 2},${ry + 3}`, fill: '#4caf50', opacity: 0.9 }));
    }
  }
  // 30%: 草原
  if (s >= 3) {
    for (let d = -165; d <= -15; d += 5) {
      const len = 10 + Math.sin(d * 0.4 + 1) * 4;
      const v = grow(d, len);
      const wave = Math.sin(d * 0.18) * 4;
      nb.appendChild(el('path', { d: `M${v.bx},${v.by} Q${v.bx + v.nx * len * 0.5 + v.ny * wave},${v.by + v.ny * len * 0.5 + v.nx * wave} ${v.tx},${v.ty}`, stroke: '#558b2f', 'stroke-width': 1.5, fill: 'none', 'stroke-linecap': 'round' }));
    }
    for (let d = -160; d <= -20; d += 9) {
      const len = 18 + Math.sin(d * 0.3) * 5;
      const v = grow(d, len);
      const wave = Math.sin(d * 0.22 + 2) * 5;
      nb.appendChild(el('path', { d: `M${v.bx},${v.by} Q${v.bx + v.nx * len * 0.5 + v.ny * wave},${v.by + v.ny * len * 0.5 + v.nx * wave} ${v.tx},${v.ty}`, stroke: d % 18 === 0 ? '#2e7d32' : '#388e3c', 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' }));
    }
    for (let d = -150; d <= -30; d += 18) {
      const len = 24 + Math.sin(d * 0.2) * 6;
      const v = grow(d, len);
      const mx = v.bx + v.nx * len * 0.5 + v.ny * Math.sin(d * 0.25) * 5;
      const my = v.by + v.ny * len * 0.5 + v.nx * Math.sin(d * 0.25) * 5;
      nb.appendChild(el('path', { d: `M${v.bx},${v.by} Q${mx},${my} ${v.tx},${v.ty}`, stroke: '#1b5e20', 'stroke-width': 2.2, fill: 'none', 'stroke-linecap': 'round' }));
      nb.appendChild(el('path', { d: `M${v.tx},${v.ty} Q${v.tx - v.ny * 9},${v.ty + v.nx * 9 - 3} ${v.tx - v.ny * 10},${v.ty + v.nx * 9 + 3}`, fill: '#66bb6a', opacity: 0.85 }));
      nb.appendChild(el('path', { d: `M${v.tx},${v.ty} Q${v.tx + v.ny * 9},${v.ty - v.nx * 9 - 3} ${v.tx + v.ny * 10},${v.ty - v.nx * 9 + 3}`, fill: '#4caf50', opacity: 0.85 }));
      nb.appendChild(el('ellipse', { cx: v.tx, cy: v.ty - 3, rx: 2.4, ry: 4.8, fill: '#8d6e63', opacity: 0.65, transform: `rotate(${d * 0.2},${v.tx},${v.ty})` }));
    }
  }
  // 40%: 低木
  if (s >= 4) {
    [{ d: -90, h: 26, r: 26 }, { d: -68, h: 20, r: 20 }, { d: -112, h: 20, r: 20 }, { d: -48, h: 16, r: 16 }, { d: -132, h: 16, r: 16 }, { d: -30, h: 13, r: 13 }, { d: -150, h: 13, r: 13 }].forEach((t) => {
      const v = grow(t.d, t.h);
      nb.appendChild(el('line', { x1: v.bx, y1: v.by, x2: v.tx, y2: v.ty, stroke: '#5d4037', 'stroke-width': 6, 'stroke-linecap': 'round' }));
      nb.appendChild(el('line', { x1: v.bx, y1: v.by, x2: v.tx, y2: v.ty, stroke: '#795548', 'stroke-width': 2.8, 'stroke-linecap': 'round', opacity: 0.5 }));
      nb.appendChild(el('line', { x1: v.tx, y1: v.ty, x2: v.bx + v.nx * t.h * 0.7 - v.ny * 14, y2: v.by + v.ny * t.h * 0.7 + v.nx * 14, stroke: '#5d4037', 'stroke-width': 3, 'stroke-linecap': 'round' }));
      nb.appendChild(el('line', { x1: v.tx, y1: v.ty, x2: v.bx + v.nx * t.h * 0.7 + v.ny * 14, y2: v.by + v.ny * t.h * 0.7 - v.nx * 14, stroke: '#5d4037', 'stroke-width': 3, 'stroke-linecap': 'round' }));
      const { r } = t;
      const cx = v.tx;
      const cy = v.ty;
      nb.appendChild(el('circle', { cx, cy, r, fill: '#1a4d10' }));
      nb.appendChild(el('circle', { cx: cx - r * 0.32, cy: cy - r * 0.32, r: r * 0.7, fill: '#2e7d32' }));
      nb.appendChild(el('circle', { cx: cx + r * 0.28, cy: cy - r * 0.25, r: r * 0.6, fill: '#388e3c' }));
      nb.appendChild(el('circle', { cx: cx - r * 0.1, cy: cy - r * 0.52, r: r * 0.42, fill: '#43a047' }));
      nb.appendChild(el('circle', { cx: cx - r * 0.18, cy: cy - r * 0.58, r: r * 0.16, fill: '#a5d6a7', opacity: 0.6 }));
    });
  }
  // 50%: 花＋ちょうちょ
  if (s >= 5) {
    [[-79, '#e91e63'], [-57, '#ffd600'], [-100, '#ff5722'], [-40, '#9c27b0'], [-121, '#00bcd4'], [-160, '#ff80ab'], [-20, '#ffee58'], [-170, '#ce93d8'], [-10, '#80deea']].forEach(([deg, color], i) => {
      const len = 20 + (i % 3) * 5;
      const v = grow(deg, len);
      nb.appendChild(el('path', { d: `M${v.bx},${v.by} Q${v.bx + v.nx * len * 0.5 + v.ny * 3},${v.by + v.ny * len * 0.5 + v.nx * 3} ${v.tx},${v.ty}`, stroke: '#2e7d32', 'stroke-width': 1.6, fill: 'none' }));
      for (let a = 0; a < 6; a++) {
        const ang = (a / 6) * Math.PI * 2;
        const petal = el('ellipse', { cx: v.tx + Math.cos(ang) * 8, cy: v.ty + Math.sin(ang) * 8, rx: 7, ry: 4, fill: color, opacity: 0.9 });
        petal.setAttribute('transform', `rotate(${a * 60},${v.tx},${v.ty})`);
        nb.appendChild(petal);
      }
      nb.appendChild(el('circle', { cx: v.tx, cy: v.ty, r: 4, fill: '#fff9c4' }));
    });
    [{ x: 134, y: 218, c: '#e91e63' }, { x: 232, y: 228, c: '#9c27b0' }, { x: 184, y: 200, c: '#ff9800' }].forEach((bt) => {
      const g2 = el('g', { transform: `translate(${bt.x},${bt.y}) scale(0.8)` });
      g2.appendChild(el('path', { d: 'M0,0 Q-20,-25 -11,3', fill: bt.c, opacity: 0.88 }));
      g2.appendChild(el('path', { d: 'M0,0 Q20,-25 11,3', fill: bt.c, opacity: 0.88 }));
      g2.appendChild(el('path', { d: 'M0,2 Q-15,17 -7,4', fill: bt.c, opacity: 0.72 }));
      g2.appendChild(el('path', { d: 'M0,2 Q15,17 7,4', fill: bt.c, opacity: 0.72 }));
      g2.appendChild(el('circle', { cx: -9, cy: -7, r: 3.5, fill: 'white', opacity: 0.4 }));
      g2.appendChild(el('circle', { cx: 9, cy: -7, r: 3.5, fill: 'white', opacity: 0.4 }));
      g2.appendChild(el('ellipse', { cx: 0, cy: 2, rx: 1.8, ry: 6, fill: '#4a148c' }));
      nb.appendChild(g2);
    });
  }
  // 60%: 高い木＋雲＋鳥
  if (s >= 6) {
    [{ cx: 60, cy: 80, rx: 35, ry: 16 }, { cx: 296, cy: 68, rx: 32, ry: 15 }, { cx: 180, cy: 58, rx: 38, ry: 18 }].forEach((c) => {
      const cg = el('g', {});
      cg.appendChild(el('ellipse', { cx: c.cx, cy: c.cy, rx: c.rx, ry: c.ry, fill: 'white' }));
      cg.appendChild(el('ellipse', { cx: c.cx - c.rx * 0.42, cy: c.cy + c.ry * 0.42, rx: c.rx * 0.66, ry: c.ry * 0.72, fill: 'white' }));
      cg.appendChild(el('ellipse', { cx: c.cx + c.rx * 0.42, cy: c.cy + c.ry * 0.42, rx: c.rx * 0.6, ry: c.ry * 0.68, fill: 'white' }));
      cg.appendChild(el('ellipse', { cx: c.cx + 2, cy: c.cy + c.ry * 0.5, rx: c.rx * 0.86, ry: c.ry * 0.38, fill: '#cce8f8', opacity: 0.4 }));
      nb.appendChild(cg);
    });
    [{ d: -90, h: 156, r: 42 }, { d: -55, h: 132, r: 34 }, { d: -125, h: 132, r: 34 }, { d: -32, h: 104, r: 26 }, { d: -148, h: 104, r: 26 }].forEach((t) => {
      const v = grow(t.d, t.h);
      nb.appendChild(el('path', { d: `M${v.bx},${v.by} Q${v.bx + v.nx * t.h * 0.5 + v.ny * 6},${v.by + v.ny * t.h * 0.5 + v.nx * 6} ${v.tx},${v.ty}`, stroke: '#4e342e', 'stroke-width': 10, fill: 'none', 'stroke-linecap': 'round' }));
      nb.appendChild(el('path', { d: `M${v.bx},${v.by} Q${v.bx + v.nx * t.h * 0.5 + v.ny * 6},${v.by + v.ny * t.h * 0.5 + v.nx * 6} ${v.tx},${v.ty}`, stroke: '#795548', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round', opacity: 0.4 }));
      nb.appendChild(el('line', { x1: v.tx, y1: v.ty, x2: v.tx - v.ny * 26 + v.nx * 8, y2: v.ty + v.nx * 26 + v.ny * 8, stroke: '#4e342e', 'stroke-width': 5, 'stroke-linecap': 'round' }));
      nb.appendChild(el('line', { x1: v.tx, y1: v.ty, x2: v.tx + v.ny * 20 + v.nx * 6, y2: v.ty - v.nx * 20 + v.ny * 6, stroke: '#4e342e', 'stroke-width': 4, 'stroke-linecap': 'round' }));
      const cx = v.tx;
      const cy = v.ty;
      const { r } = t;
      nb.appendChild(el('circle', { cx, cy, r, fill: '#1b4020' }));
      nb.appendChild(el('circle', { cx: cx - r * 0.3, cy: cy - r * 0.28, r: r * 0.74, fill: '#2e7d32' }));
      nb.appendChild(el('circle', { cx: cx + r * 0.25, cy: cy - r * 0.22, r: r * 0.64, fill: '#388e3c' }));
      nb.appendChild(el('circle', { cx: cx - r * 0.08, cy: cy - r * 0.52, r: r * 0.47, fill: '#43a047' }));
      nb.appendChild(el('circle', { cx: cx + r * 0.12, cy: cy - r * 0.58, r: r * 0.3, fill: '#66bb6a' }));
      nb.appendChild(el('circle', { cx: cx - r * 0.15, cy: cy - r * 0.63, r: r * 0.14, fill: '#a5d6a7', opacity: 0.65 }));
      [{ dx: -r * 0.2, dy: -r * 0.1 }, { dx: r * 0.24, dy: -r * 0.05 }, { dx: 0, dy: r * 0.14 }].forEach((b) => {
        nb.appendChild(el('circle', { cx: cx + b.dx, cy: cy + b.dy, r: 3.2, fill: '#e53935' }));
      });
    });
    [{ x: 82, y: 128, sc: 0.8 }, { x: 278, y: 118, sc: 0.72 }, { x: 136, y: 98, sc: 0.68 }, { x: 224, y: 106, sc: 0.7 }].forEach((b) => {
      const g2 = el('g', { transform: `translate(${b.x},${b.y}) scale(${b.sc})` });
      g2.appendChild(el('ellipse', { cx: 4, cy: 0, rx: 12, ry: 5, fill: 'white', transform: 'rotate(-18,4,0)' }));
      g2.appendChild(el('path', { d: 'M10,-3 Q16,-10 18,-5', stroke: 'white', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }));
      g2.appendChild(el('circle', { cx: 18, cy: -6, r: 4.5, fill: 'white' }));
      g2.appendChild(el('path', { d: 'M22,-6 L30,-5', stroke: '#ffb300', 'stroke-width': 2, 'stroke-linecap': 'round', fill: 'none' }));
      g2.appendChild(el('circle', { cx: 19, cy: -8, r: 1.2, fill: '#37474f' }));
      g2.appendChild(el('path', { d: 'M0,-2 Q-16,-20 -24,-10 Q-16,-7 0,-2', fill: 'white', stroke: '#e0e0e0', 'stroke-width': 0.7 }));
      g2.appendChild(el('path', { d: 'M0,-2 Q10,-16 20,-8 Q10,-5 0,-2', fill: '#f5f5f5', stroke: '#e0e0e0', 'stroke-width': 0.7 }));
      nb.appendChild(g2);
    });
  }
  // 70%: 家＋住人
  if (s >= 7) {
    [{ d: -22, rc: '#d32f2f' }, { d: -158, rc: '#1565c0' }].forEach((t) => {
      const v = grow(t.d, 10);
      const w = 44;
      const h = 30;
      const hx = v.tx - w / 2;
      const hy = v.ty - h;
      nb.appendChild(el('rect', { x: hx + w, y: hy + 3, width: 9, height: h, rx: 2, fill: '#37474f', opacity: 0.1 }));
      nb.appendChild(el('rect', { x: hx, y: hy, width: w, height: h, rx: 2, fill: '#fafafa', stroke: '#e0e0e0', 'stroke-width': 0.6 }));
      nb.appendChild(el('polygon', { points: `${hx + w},${hy} ${hx + w + 8},${hy + 5} ${hx + w + 8},${hy + h + 5} ${hx + w},${hy + h}`, fill: '#e0e0e0' }));
      nb.appendChild(el('polygon', { points: `${hx},${hy} ${hx + w / 2},${hy - 20} ${hx + w},${hy}`, fill: t.rc }));
      nb.appendChild(el('polygon', { points: `${hx + w},${hy} ${hx + w / 2},${hy - 20} ${hx + w / 2 + 7},${hy - 17} ${hx + w + 8},${hy + 5}`, fill: t.rc, opacity: 0.7 }));
      nb.appendChild(el('rect', { x: hx + w * 0.62, y: hy - 26, width: 6, height: 11, rx: 1, fill: '#78909c' }));
      [{ dy: -4, r: 5, op: 0.35 }, { dy: -12, r: 6, op: 0.2 }, { dy: -21, r: 8, op: 0.1 }].forEach((sm) => {
        nb.appendChild(el('circle', { cx: hx + w * 0.62 + 3, cy: hy - 26 + sm.dy, r: sm.r, fill: '#cfd8dc', opacity: sm.op }));
      });
      nb.appendChild(el('rect', { x: hx + w * 0.37, y: hy + h - 15, width: 9, height: 15, rx: 2, fill: '#8d6e63' }));
      nb.appendChild(el('rect', { x: hx + 5, y: hy + 6, width: 12, height: 10, rx: 1, fill: '#fff9c4', stroke: '#bdbdbd', 'stroke-width': 0.7 }));
      nb.appendChild(el('line', { x1: hx + 11, y1: hy + 6, x2: hx + 11, y2: hy + 16, stroke: '#bdbdbd', 'stroke-width': 0.6 }));
      nb.appendChild(el('line', { x1: hx + 5, y1: hy + 11, x2: hx + 17, y2: hy + 11, stroke: '#bdbdbd', 'stroke-width': 0.6 }));
      // 住人
      const px = hx + w * 0.76;
      const py = hy + h;
      nb.appendChild(el('circle', { cx: px, cy: py - 17, r: 5.5, fill: '#fce8c0', stroke: '#c8884a', 'stroke-width': 0.7 }));
      nb.appendChild(el('path', { d: `M${px - 5.5},${py - 20} Q${px},${py - 24} ${px + 5.5},${py - 20}`, fill: '#3e2723' }));
      nb.appendChild(el('circle', { cx: px - 2, cy: py - 18, r: 1.1, fill: '#212121' }));
      nb.appendChild(el('circle', { cx: px + 2, cy: py - 18, r: 1.1, fill: '#212121' }));
      nb.appendChild(el('circle', { cx: px - 1.5, cy: py - 18.5, r: 0.5, fill: 'white' }));
      nb.appendChild(el('circle', { cx: px + 2.5, cy: py - 18.5, r: 0.5, fill: 'white' }));
      nb.appendChild(el('path', { d: `M${px - 2.5},${py - 14.5} Q${px},${py - 12.5} ${px + 2.5},${py - 14.5}`, stroke: '#8d6e63', 'stroke-width': 1, fill: 'none', 'stroke-linecap': 'round' }));
      nb.appendChild(el('line', { x1: px, y1: py - 11, x2: px, y2: py - 2, stroke: '#1565c0', 'stroke-width': 3.2, 'stroke-linecap': 'round' }));
      nb.appendChild(el('line', { x1: px - 5.5, y1: py - 8.5, x2: px + 5.5, y2: py - 7, stroke: '#1565c0', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
      nb.appendChild(el('line', { x1: px, y1: py - 2, x2: px - 3.5, y2: py + 6, stroke: '#455a64', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
      nb.appendChild(el('line', { x1: px, y1: py - 2, x2: px + 3.5, y2: py + 6, stroke: '#455a64', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
    });
  }
  // 80%: 滝（両側）
  if (s >= 8) {
    const waterfall = (deg, flip) => {
      const v = grow(deg, 14);
      const wbx = v.tx + (flip ? 11 : -11);
      const wby = v.ty - 7;
      nb.appendChild(el('ellipse', { cx: wbx, cy: wby, rx: 16, ry: 8, fill: '#546e7a' }));
      nb.appendChild(el('ellipse', { cx: wbx + (flip ? -3 : 3), cy: wby - 3, rx: 10, ry: 5.5, fill: '#78909c' }));
      nb.appendChild(el('rect', { x: wbx - 8, y: wby, width: 16, height: 50, rx: 3, fill: '#546e7a' }));
      nb.appendChild(el('rect', { x: wbx + (flip ? 2 : -8), y: wby, width: 6, height: 50, rx: 3, fill: '#607d8b' }));
      for (let wi = 0; wi < 5; wi++) {
        nb.appendChild(el('line', { x1: wbx - 7 + wi * 2.8, y1: wby + 2, x2: wbx - 7.5 + wi * 2.8, y2: wby + 50, stroke: '#80d8ff', 'stroke-width': wi === 2 ? 2.5 : 1.6, 'stroke-linecap': 'round', opacity: 0.48 + wi * 0.06 }));
      }
      nb.appendChild(el('line', { x1: wbx - 4, y1: wby + 4, x2: wbx - 5, y2: wby + 46, stroke: 'white', 'stroke-width': 1.2, opacity: 0.3, 'stroke-linecap': 'round' }));
      for (let di = 0; di < 10; di++) {
        nb.appendChild(el('circle', { cx: wbx - 8 + di * 1.6, cy: wby + 50 + Math.sin(di * 0.8) * 2.5, r: 1.8, fill: '#80d8ff', opacity: 0.62 }));
      }
      nb.appendChild(el('ellipse', { cx: wbx, cy: wby + 53, rx: 19, ry: 6, fill: '#29b6f6', opacity: 0.65 }));
      nb.appendChild(el('ellipse', { cx: wbx + (flip ? -2 : 2), cy: wby + 50, rx: 11, ry: 3.5, fill: '#81d4fa', opacity: 0.5 }));
    };
    waterfall(-18, true);
    waterfall(-162, false);
  }
  // 90%: 虹＋太陽
  if (s >= 9) {
    nb.appendChild(el('circle', { cx: 316, cy: 80, r: 20, fill: '#FFD700', opacity: 0.92 }));
    nb.appendChild(el('circle', { cx: 314, cy: 78, r: 11, fill: '#FFF59D', opacity: 0.65 }));
    for (let ra = 0; ra < 12; ra++) {
      const ang = (ra / 12) * Math.PI * 2;
      nb.appendChild(el('line', { x1: 316 + Math.cos(ang) * 24, y1: 80 + Math.sin(ang) * 24, x2: 316 + Math.cos(ang) * 32, y2: 80 + Math.sin(ang) * 32, stroke: '#FFD700', 'stroke-width': 1.8, 'stroke-linecap': 'round', opacity: 0.7 }));
    }
    const rbCX = 180;
    const rbCY = 450;
    [[180, '#FF4040', 0.48], [168, '#FF8800', 0.45], [156, '#FFE000', 0.45], [144, '#40CC40', 0.42], [132, '#4488FF', 0.40], [120, '#8844BB', 0.38]].forEach(([r, color, op]) => {
      nb.appendChild(el('path', { d: `M ${rbCX - r},${rbCY} A ${r},${r} 0 0,1 ${rbCX + r},${rbCY}`, stroke: color, 'stroke-width': 4.5, fill: 'none', opacity: op, 'stroke-linecap': 'round' }));
    });
  }
  // 100%: オーロラ＋星
  if (s >= 10) {
    nb.appendChild(el('rect', { x: 0, y: 0, width: 360, height: 250, fill: '#f3e5f5', opacity: 0.5 }));
    [
      { c: '#69f0ae', op: 0.35, pts: [[0, 148], [58, 112], [124, 132], [192, 108], [260, 128], [360, 116]] },
      { c: '#b39ddb', op: 0.28, pts: [[0, 168], [68, 132], [144, 150], [220, 126], [296, 145], [360, 134]] },
      { c: '#80deea', op: 0.3, pts: [[0, 184], [80, 150], [160, 168], [240, 142], [320, 160], [360, 152]] },
      { c: '#f48fb1', op: 0.2, pts: [[0, 160], [72, 124], [148, 143], [224, 118], [300, 136], [360, 126]] },
    ].forEach((a) => {
      const pts = a.pts;
      let d = `M${pts[0][0]},${pts[0][1]}`;
      for (let pi = 1; pi < pts.length; pi++) {
        const p0 = pts[pi - 1];
        const p1 = pts[pi];
        d += ` Q${p0[0]},${p0[1]} ${(p0[0] + p1[0]) / 2},${(p0[1] + p1[1]) / 2}`;
      }
      d += ` L${pts[pts.length - 1][0]},${pts[pts.length - 1][1]}`;
      nb.appendChild(el('path', { d, stroke: a.c, 'stroke-width': 26, fill: 'none', opacity: a.op, 'stroke-linecap': 'round' }));
      nb.appendChild(el('path', { d, stroke: a.c, 'stroke-width': 7, fill: 'none', opacity: a.op * 1.7, 'stroke-linecap': 'round' }));
      nb.appendChild(el('path', { d, stroke: 'white', 'stroke-width': 1.8, fill: 'none', opacity: a.op * 0.8, 'stroke-linecap': 'round' }));
    });
    for (let ci = 0; ci < 14; ci++) {
      const cx2 = 12 + ci * 24;
      nb.appendChild(el('line', { x1: cx2, y1: 75, x2: cx2 + (ci % 2 ? 6 : -6), y2: 182, stroke: ['#69f0ae', '#b39ddb', '#80deea', '#f48fb1'][ci % 4], 'stroke-width': 1.8, opacity: 0.16 }));
    }
    [{ x: 28, y: 30 }, { x: 78, y: 18 }, { x: 136, y: 12 }, { x: 196, y: 22 }, { x: 254, y: 14 }, { x: 310, y: 28 }].forEach((st) => {
      nb.appendChild(el('circle', { cx: st.x, cy: st.y, r: 2.8, fill: 'white', opacity: 0.95 }));
      nb.appendChild(el('line', { x1: st.x - 5.5, y1: st.y, x2: st.x + 5.5, y2: st.y, stroke: 'white', 'stroke-width': 1, opacity: 0.5 }));
      nb.appendChild(el('line', { x1: st.x, y1: st.y - 5.5, x2: st.x, y2: st.y + 5.5, stroke: 'white', 'stroke-width': 1, opacity: 0.5 }));
    });
    [{ x: 40, y: 42, ex: 76, ey: 22 }, { x: 212, y: 36, ex: 246, ey: 18 }].forEach((st) => {
      nb.appendChild(el('line', { x1: st.x, y1: st.y, x2: st.ex, y2: st.ey, stroke: 'white', 'stroke-width': 2.2, opacity: 0.9 }));
      nb.appendChild(el('circle', { cx: st.x, cy: st.y, r: 3.2, fill: 'white', opacity: 0.95 }));
    });
  }

  // ---- 表情 ----
  // 眉毛（ステージが上がるほど明るい表情に）
  const browPaths = [
    ['M126,296 Q142,291 158,294', 'M202,294 Q218,291 234,296'],
    ['M126,289 Q142,282 158,287', 'M202,287 Q218,282 234,289'],
    ['M126,290 Q142,284 158,288', 'M202,288 Q218,284 234,290'],
    ['M126,288 Q142,282 158,287', 'M202,287 Q218,282 234,288'],
    ['M126,287 Q142,281 158,286', 'M202,286 Q218,281 234,287'],
    ['M126,287 Q142,281 158,286', 'M202,286 Q218,281 234,287'],
    ['M126,286 Q142,280 158,285', 'M202,285 Q218,280 234,286'],
  ];
  const bi = s <= 1 ? 0 : s <= 2 ? 1 : s <= 3 ? 2 : s <= 5 ? 3 : s <= 7 ? 4 : s <= 8 ? 5 : 6;
  svg.appendChild(el('path', { d: browPaths[bi][0], stroke: '#1e0e04', 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round' }));
  svg.appendChild(el('path', { d: browPaths[bi][1], stroke: '#1e0e04', 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round' }));

  // 目（白目・まぶた・瞳）
  const eyeY = s <= 1 ? 308 : 306;
  const lidY = s <= 1 ? 301 : 299;
  svg.appendChild(el('path', { d: `M124,${eyeY} Q142,${lidY} 160,${eyeY} Q142,${eyeY + 9} 124,${eyeY} Z`, fill: 'white' }));
  svg.appendChild(el('path', { d: `M200,${eyeY} Q218,${lidY} 236,${eyeY} Q218,${eyeY + 9} 200,${eyeY} Z`, fill: 'white' }));
  svg.appendChild(el('path', { d: `M124,${eyeY} Q142,${lidY + 2} 160,${eyeY}`, stroke: '#110805', 'stroke-width': 2, fill: 'none' }));
  svg.appendChild(el('path', { d: `M200,${eyeY} Q218,${lidY + 2} 236,${eyeY}`, stroke: '#110805', 'stroke-width': 2, fill: 'none' }));
  const pupilY = s <= 1 ? 310 : s <= 2 ? 303 : s <= 3 ? 307 : 306;
  const pupilRy = s >= 9 ? 3.5 : 5.5;
  svg.appendChild(el('ellipse', { cx: 142, cy: pupilY, rx: 7.2, ry: pupilRy, fill: '#1a0c04' }));
  svg.appendChild(el('ellipse', { cx: 218, cy: pupilY, rx: 7.2, ry: pupilRy, fill: '#1a0c04' }));
  svg.appendChild(el('circle', { cx: 145, cy: pupilY - 2, r: 2, fill: 'white' }));
  svg.appendChild(el('circle', { cx: 221, cy: pupilY - 2, r: 2, fill: 'white' }));

  // 涙（序盤: ぼろぼろ泣く / 終盤: うれし泣き）
  if (s <= 1) {
    svg.appendChild(el('ellipse', { cx: 128, cy: 320, rx: 3.2, ry: 4.8, fill: '#87ceeb', opacity: 0.9, transform: 'rotate(-10,128,320)' }));
    svg.appendChild(el('ellipse', { cx: 128, cy: 332, rx: 2.4, ry: 3.6, fill: '#64b5f6', opacity: 0.8, transform: 'rotate(-8,128,332)' }));
    svg.appendChild(el('ellipse', { cx: 232, cy: 320, rx: 3.2, ry: 4.8, fill: '#87ceeb', opacity: 0.9, transform: 'rotate(10,232,320)' }));
    svg.appendChild(el('ellipse', { cx: 232, cy: 332, rx: 2.4, ry: 3.6, fill: '#64b5f6', opacity: 0.8, transform: 'rotate(8,232,332)' }));
  }
  if (s >= 8) {
    svg.appendChild(el('ellipse', { cx: 128, cy: 322, rx: 3.2, ry: 4.8, fill: '#87ceeb', opacity: 0.88, transform: 'rotate(-10,128,322)' }));
    svg.appendChild(el('ellipse', { cx: 232, cy: 322, rx: 3.2, ry: 4.8, fill: '#87ceeb', opacity: 0.88, transform: 'rotate(10,232,322)' }));
  }
  if (s >= 6 && s <= 7) {
    svg.appendChild(el('ellipse', { cx: 132, cy: 312, rx: 4.8, ry: 3.2, fill: '#b3e5fc', opacity: 0.72 }));
    svg.appendChild(el('ellipse', { cx: 228, cy: 312, rx: 4.8, ry: 3.2, fill: '#b3e5fc', opacity: 0.72 }));
  }

  // 鼻
  svg.appendChild(el('ellipse', { cx: 167, cy: 332, rx: 8, ry: 6.4, fill: '#c07030' }));
  svg.appendChild(el('ellipse', { cx: 185, cy: 332, rx: 8, ry: 6.4, fill: '#c07030' }));
  svg.appendChild(el('ellipse', { cx: 167, cy: 333, rx: 4.4, ry: 3.6, fill: '#8b4820', opacity: 0.5 }));
  svg.appendChild(el('ellipse', { cx: 185, cy: 333, rx: 4.4, ry: 3.6, fill: '#8b4820', opacity: 0.5 }));

  // 口
  const mouthPaths = [
    'M158,352 Q180,346 202,352',
    'M160,350 Q180,354 200,350',
    'M156,348 Q180,358 204,348',
    'M152,346 Q180,362 208,346',
    'M152,346 Q180,362 208,346',
    'M152,346 Q180,362 208,346',
    'M150,344 Q180,364 210,344',
  ];
  const mi = s <= 1 ? 0 : s <= 2 ? 1 : s <= 3 ? 2 : s <= 5 ? 3 : s <= 7 ? 4 : s <= 8 ? 5 : 6;
  if (s >= 4) {
    svg.appendChild(el('path', { d: mouthPaths[mi], fill: '#5a1e08', stroke: 'none' }));
    svg.appendChild(el('rect', { x: 158, y: 347, width: 44, height: 7, rx: 3.2, fill: 'white' }));
  } else {
    svg.appendChild(el('path', { d: mouthPaths[mi], stroke: '#8b4820', 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round' }));
  }

  // ほっぺ（ステージが上がるほど赤らむ）
  const cheekOpacity = [0.1, 0.1, 0.18, 0.28, 0.38, 0.42, 0.42, 0.5, 0.56, 0.56, 0.56];
  svg.appendChild(el('ellipse', { cx: 108, cy: 322, rx: 19, ry: 13.6, fill: '#f0a060', opacity: cheekOpacity[s] || 0.1 }));
  svg.appendChild(el('ellipse', { cx: 252, cy: 322, rx: 19, ry: 13.6, fill: '#f0a060', opacity: cheekOpacity[s] || 0.1 }));

  // 頭の輪郭
  svg.appendChild(el('ellipse', { cx: HX, cy: HY, rx: HRX, ry: HRY, fill: 'none', stroke: '#c89040', 'stroke-width': 1.5 }));

  container.appendChild(svg);
}
