// ===================================================================
// 設定・お知らせ・テーマ
// ヘッダーの ⚙️ / 🔔 から開くパネルと、テーマの適用処理。
// ===================================================================

import { THEMES, NOTIFICATIONS } from './constants.js';
import { state } from './state.js';
import { $, esc, createOverlay, showToast } from './dom.js';
import * as storage from './storage.js';
import { playTestBeep } from './audio.js';
import { saveNickname } from './cloud.js';

// ---- テーマ -----------------------------------------------------------

/** テーマを DOM に適用して永続化する */
export function applyTheme(theme) {
  if (!theme || theme === 'light') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
  storage.saveTheme(theme);
}

/** 起動時の初期化: テーマ適用と音量の読み込み（旧 darkMode 設定の移行込み） */
export function initSettings() {
  const s = storage.loadSettings();
  const theme = s.theme
    || storage.loadTheme()
    || ((s.darkMode || storage.loadLegacyDarkMode()) ? 'dark' : 'light');
  applyTheme(theme);
  state.volume = s.volume !== undefined ? s.volume / 100 : 0.8;
}

// ---- お知らせ -----------------------------------------------------------

/** 未読のお知らせがあればヘッダーのバッジを表示する */
export function checkUnreadNotif() {
  const read = storage.loadReadNotifs();
  const hasUnread = NOTIFICATIONS.some((n) => !read.includes(n.id));
  const badge = $('notif-badge');
  if (badge) badge.style.display = hasUnread ? 'block' : 'none';
}

/** お知らせパネルを開く（開いた時点で全件既読になる） */
export function openNotif() {
  const read = storage.loadReadNotifs();
  let html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">'
    + '<div style="font-size:16px;font-weight:700;color:var(--text)">🔔 お知らせ</div>'
    + '<button id="notif-close" style="border:none;background:transparent;font-size:20px;cursor:pointer;color:var(--text2)">✕</button></div>';
  NOTIFICATIONS.forEach((n) => {
    const isRead = read.includes(n.id);
    storage.markNotifRead(n.id);
    html += `<div style="background:var(--bg);border-radius:10px;padding:12px 14px;margin-bottom:10px;border-left:3px solid ${isRead ? 'var(--border)' : 'var(--primary)'}">`
      + `<div style="font-size:11px;color:var(--text3);margin-bottom:3px">${n.date}</div>`
      + `<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:5px">${n.title}</div>`
      + `<div style="font-size:12px;color:var(--text2);line-height:1.5">${n.body}</div></div>`;
  });

  const { overlay, close } = createOverlay(html, { topAligned: true });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) checkUnreadNotif(); });
  $('notif-close').addEventListener('click', () => {
    close();
    checkUnreadNotif();
  });
  checkUnreadNotif();
}

// ---- 設定 --------------------------------------------------------------

/** 設定パネルを開く */
export function openSettings() {
  const s = storage.loadSettings();
  const vol = s.volume !== undefined ? s.volume : 80;
  const nick = s.nickname || state.currentUser?.name || '';
  const curTheme = s.theme || storage.loadTheme() || (s.darkMode ? 'dark' : 'light');

  const themeSwatches = THEMES.map((t) => {
    const sel = t.id === curTheme;
    return `<button class="theme-swatch" data-tid="${t.id}" style="flex:1;min-width:52px;padding:8px 4px;border:2px solid ${sel ? t.pri : '#ccc'};border-radius:10px;background:${t.bg};cursor:pointer;transition:all 0.15s;outline:none">`
      + `<div style="width:24px;height:24px;border-radius:50%;background:${t.pri};margin:0 auto 4px"></div>`
      + `<div style="font-size:10px;color:${t.txt};font-weight:${sel ? '700' : '500'};line-height:1.2;font-family:'DM Sans',sans-serif">${t.label}</div>`
      + `<div style="font-size:10px;margin-top:2px;${sel ? '' : 'opacity:0'}">${sel ? '✓' : ' '}</div>`
      + '</button>';
  }).join('');

  const html =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">'
    + '<div style="font-size:16px;font-weight:700;color:var(--text)">⚙️ 設定</div>'
    + '<button id="settings-close" style="border:none;background:transparent;font-size:20px;cursor:pointer;color:var(--text2)">✕</button></div>'

    + '<div style="margin-bottom:18px">'
    + '<div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:6px">✏️ ランキング表示名（ニックネーム）</div>'
    + '<div style="font-size:11px;color:var(--text3);margin-bottom:8px">ランキングやスコア画面に表示される名前を変更できます</div>'
    + `<input id="settings-nick" value="${esc(nick)}" placeholder="ニックネームを入力" maxlength="20" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;outline:none;font-family:'DM Sans',sans-serif;background:var(--app-bg);color:var(--text);box-sizing:border-box">`
    + '</div>'

    + '<div style="margin-bottom:18px">'
    + '<div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:6px">🔊 効果音の音量</div>'
    + '<div style="display:flex;align-items:center;gap:10px">'
    + '<span style="font-size:14px">🔇</span>'
    + `<input id="settings-vol" type="range" min="0" max="100" value="${vol}" style="flex:1;accent-color:var(--primary)">`
    + '<span style="font-size:14px">🔊</span>'
    + `<span id="settings-vol-val" style="font-size:12px;font-weight:700;color:var(--primary);min-width:32px">${vol}%</span>`
    + '</div>'
    + '<button id="settings-vol-test" style="margin-top:8px;padding:5px 14px;border:1.5px solid var(--primary);border-radius:20px;font-size:12px;background:var(--primary-light);color:var(--primary);cursor:pointer;font-family:\'DM Sans\',sans-serif">🎵 テスト再生</button>'
    + '</div>'

    + '<div style="margin-bottom:20px">'
    + '<div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:8px">🎨 テーマ（背景色）</div>'
    + `<div id="theme-swatches" style="display:flex;gap:6px;flex-wrap:wrap">${themeSwatches}</div>`
    + '</div>'

    + '<button id="settings-save" style="width:100%;padding:12px;background:var(--primary);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">💾 保存する</button>';

  const { box, close } = createOverlay(html, { topAligned: true });

  // 音量スライダー
  $('settings-vol').addEventListener('input', function onInput() {
    $('settings-vol-val').textContent = `${this.value}%`;
  });
  $('settings-vol-test').addEventListener('click', () => {
    playTestBeep(parseInt($('settings-vol').value, 10) / 100);
  });

  // テーマ選択（プレビュー即反映）
  let selectedTheme = curTheme;
  box.querySelectorAll('.theme-swatch').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedTheme = btn.dataset.tid;
      applyTheme(selectedTheme);
      box.querySelectorAll('.theme-swatch').forEach((b) => {
        const theme = THEMES.find((t) => t.id === b.dataset.tid);
        const isSel = b.dataset.tid === selectedTheme;
        b.style.borderColor = isSel ? theme.pri : '#ccc';
        const check = b.querySelector('div:last-child');
        check.textContent = isSel ? '✓' : ' ';
        check.style.opacity = isSel ? '1' : '0';
        b.querySelector('div:nth-child(2)').style.fontWeight = isSel ? '700' : '500';
      });
    });
  });

  $('settings-close').addEventListener('click', close);

  // 保存
  $('settings-save').addEventListener('click', () => {
    const newNick = $('settings-nick').value.trim();
    const newVol = parseInt($('settings-vol').value, 10);
    const ns = storage.loadSettings();
    ns.volume = newVol;
    ns.theme = selectedTheme;
    if (newNick) ns.nickname = newNick;
    delete ns.darkMode; // 旧フラグは廃止
    storage.saveSettings(ns);
    if (newNick && state.currentUser) saveNickname(newNick);
    applyTheme(selectedTheme);
    state.volume = newVol / 100;
    close();
    showToast('✅ 設定を保存しました');
  });
}
