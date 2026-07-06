/* ===================================================================
   Z-eiken スタイルシート
   テーマは :root のCSS変数と [data-theme="…"] の上書きで切り替える。
   =================================================================== */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
:root{
  --bg:#F2F0EB;
  --app-bg:#FFFFFF;
  --primary:#1A4FBF;
  --primary-light:#E8EFFE;
  --accent:#FF6B35;
  --accent2:#00B69B;
  --text:#1A1A2E;
  --text2:#5A5A72;
  --text3:#9898AA;
  --border:#E4E2DC;
  --border2:#D0CECC;
  --correct:#00B69B;
  --correct-bg:#E6F9F5;
  --wrong:#E53935;
  --wrong-bg:#FEE8E8;
  --card-shadow:0 1px 4px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04);
  --card-shadow-hover:0 4px 16px rgba(0,0,0,0.1),0 8px 32px rgba(0,0,0,0.06);
  --radius:14px;
  --radius-sm:8px;
}
*{box-sizing:border-box;margin:0;padding:0}

/* ===== THEMES ===== */
/* 🌙 Dark */
[data-theme="dark"]{
  --bg:#111318;--app-bg:#1C1F26;--primary:#5B8CFF;--primary-light:#1A2340;
  --text:#E8EAFE;--text2:#9A9DB8;--text3:#5A5D78;
  --border:#2C2F3E;--border2:#363A50;
  --correct:#26C6A0;--correct-bg:#0D2420;--wrong:#FF5252;--wrong-bg:#2A1010;
  --card-shadow:0 1px 6px rgba(0,0,0,0.4);--card-shadow-hover:0 4px 20px rgba(0,0,0,0.5);
}
/* 🌊 Blue (Ocean) */
[data-theme="blue"]{
  --bg:#E8F4FD;--app-bg:#FFFFFF;--primary:#0077B6;--primary-light:#CCEEFF;
  --text:#003559;--text2:#4A7599;--text3:#8EB8D5;
  --border:#B3D9F5;--border2:#90C8EE;
  --correct:#00B686;--correct-bg:#D6F5EC;--wrong:#E53935;--wrong-bg:#FEE8E8;
  --card-shadow:0 1px 4px rgba(0,119,182,0.08);--card-shadow-hover:0 4px 16px rgba(0,119,182,0.15);
}
/* 🌿 Green (Forest) */
[data-theme="green"]{
  --bg:#EAF5EE;--app-bg:#FFFFFF;--primary:#2D7D46;--primary-light:#D4EDDA;
  --text:#1A3A24;--text2:#4A7A58;--text3:#8AB898;
  --border:#B8DFBF;--border2:#96CFA0;
  --correct:#1E8C3C;--correct-bg:#D4EDDA;--wrong:#D32F2F;--wrong-bg:#FFEBEE;
  --card-shadow:0 1px 4px rgba(45,125,70,0.08);--card-shadow-hover:0 4px 16px rgba(45,125,70,0.15);
}
/* 💜 Purple (Grape) */
[data-theme="purple"]{
  --bg:#F3EEF9;--app-bg:#FFFFFF;--primary:#7B2FBE;--primary-light:#EDE0FF;
  --text:#2A1050;--text2:#6A5085;--text3:#A890C0;
  --border:#DCCAEE;--border2:#C8B0E0;
  --correct:#00897B;--correct-bg:#E0F2F1;--wrong:#C62828;--wrong-bg:#FFEBEE;
  --card-shadow:0 1px 4px rgba(123,47,190,0.08);--card-shadow-hover:0 4px 16px rgba(123,47,190,0.15);
}
body{font-family:'DM Sans',system-ui,sans-serif;background:var(--bg);min-height:100vh;display:flex;justify-content:center;padding:12px;color:var(--text)}
.app{width:100%;max-width:480px;background:var(--app-bg);border-radius:20px;padding:18px;box-shadow:var(--card-shadow)}
.header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--border);flex-wrap:wrap;min-width:0}
.header h1{font-size:19px;font-weight:700;color:var(--text);letter-spacing:-0.3px;white-space:nowrap}
.header-brand{display:flex;align-items:center;gap:8px;min-width:0;flex:0 1 auto}
.header-brand img{height:30px;width:auto;object-fit:contain;flex-shrink:0}
.header h1 .accent{color:var(--primary)}
.header-actions{display:flex;align-items:center;gap:6px;flex-shrink:0}
#session-score{font-size:11px;color:var(--text2);font-weight:500;background:var(--bg);padding:4px 10px;border-radius:20px;border:1px solid var(--border);white-space:nowrap;max-width:170px;overflow:hidden;text-overflow:ellipsis}
.header .icon-btn{font-size:17px;padding:4px 7px;border:none;background:transparent;cursor:pointer;color:var(--text2);position:relative;line-height:1;border-radius:8px}
.header .icon-btn:hover{background:var(--bg)}
#logout-btn{font-size:11px;padding:4px 10px;border:1px solid var(--border2);border-radius:20px;background:var(--app-bg);color:var(--text2);cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap}
#notif-badge{position:absolute;top:1px;right:2px;width:8px;height:8px;background:#E53935;border-radius:50%}
@media (max-width:430px){.header-brand{order:1;flex:1 1 auto}.header-actions{order:2}#session-score{order:3;flex-basis:100%;max-width:100%;text-align:center;margin-top:2px}.header h1{font-size:18px}}
.grade-selector{display:none;gap:6px;flex-wrap:wrap;margin-bottom:16px}
.grade-btn{padding:5px 12px;border:1.5px solid var(--border2);border-radius:20px;font-size:12px;cursor:pointer;background:var(--app-bg);color:var(--text2);transition:all 0.18s;font-weight:600;font-family:'DM Sans',sans-serif}
.grade-btn:hover{border-color:var(--primary);color:var(--primary)}
.grade-btn.active{background:var(--primary);color:#fff;border-color:var(--primary);box-shadow:0 2px 8px rgba(26,79,191,0.25)}
.mode-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
.mode-card{padding:14px;border:1.5px solid var(--border);border-radius:var(--radius);background:var(--app-bg);cursor:pointer;transition:all 0.18s}
.mode-card:hover{transform:translateY(-1px);box-shadow:var(--card-shadow-hover);border-color:var(--primary)}
.mode-card.active{border:1.5px solid var(--primary);background:var(--primary-light)}
.mode-icon{font-size:22px;margin-bottom:6px}
.mode-title{font-size:13px;font-weight:700;color:var(--text)}
.mode-desc{font-size:11px;color:var(--text3);margin-top:2px;font-weight:500}
.content-area{background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:18px;min-height:300px}
.word-display{font-size:32px;font-weight:700;color:var(--text);margin-bottom:6px;text-align:center;letter-spacing:-0.5px;font-family:'DM Mono',monospace}
.word-counter{font-size:11px;color:var(--text3);text-align:center;margin-bottom:18px;font-weight:500}
.choices{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:14px}
.choice-btn{padding:13px 10px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:13px;cursor:pointer;background:var(--app-bg);color:var(--text);transition:all 0.14s;text-align:center;line-height:1.4;font-weight:600;font-family:'DM Sans',sans-serif}
.choice-btn:hover:not(.disabled){background:var(--primary-light);border-color:var(--primary);transform:translateY(-1px)}
.choice-btn.correct{background:var(--correct-bg);border-color:var(--correct);color:var(--correct);font-weight:700}
.choice-btn.wrong{background:var(--wrong-bg);border-color:var(--wrong);color:var(--wrong)}
.choice-btn.disabled{cursor:default;opacity:0.85}
.feedback{font-size:13px;padding:10px;border-radius:var(--radius-sm);margin-bottom:10px;text-align:center;font-weight:700}
.feedback.correct{background:var(--correct-bg);color:var(--correct)}
.feedback.wrong{background:var(--wrong-bg);color:var(--wrong)}
.question-text{font-size:14px;line-height:1.7;color:var(--text);margin-bottom:18px}
.question-num{font-size:11px;color:var(--text3);margin-bottom:8px}
.fill-blank{background:var(--primary-light);border-radius:4px;padding:2px 8px;font-weight:600;color:var(--primary)}
.qchoices{display:flex;flex-direction:column;gap:7px}
.qchoice-btn{padding:11px 12px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:13px;cursor:pointer;background:var(--app-bg);color:var(--text);text-align:left;transition:all 0.14s;font-weight:600;font-family:'DM Sans',sans-serif}
.qchoice-btn:hover:not(.disabled){background:var(--primary-light);border-color:var(--primary)}
.qchoice-btn.correct{background:var(--correct-bg);border-color:var(--correct);color:var(--correct)}
.qchoice-btn.wrong{background:var(--wrong-bg);border-color:var(--wrong);color:var(--wrong)}
.qchoice-btn.disabled{cursor:default}
.expl-box{font-size:12px;line-height:1.6;padding:10px;background:var(--bg);border-radius:var(--radius-sm);margin-top:8px;color:var(--text2);display:none;border:1px solid var(--border)}
.writing-topic{font-size:14px;font-weight:600;color:var(--text);margin-bottom:8px;padding:12px;background:var(--bg);border-radius:var(--radius-sm);line-height:1.6;border:1px solid var(--border)}
.writing-hint{font-size:12px;color:var(--text3);margin-bottom:10px}
.writing-area{width:100%;border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:12px;font-size:13px;font-family:'DM Sans',sans-serif;color:var(--text);background:var(--app-bg);resize:none;height:140px;line-height:1.6;transition:border-color 0.15s}
.writing-area:focus{outline:none;border-color:var(--primary)}
.word-count{font-size:11px;color:var(--text3);text-align:right;margin-top:4px;margin-bottom:10px}
.ai-feedback{margin-top:10px;padding:12px;background:var(--bg);border-radius:var(--radius-sm);font-size:12px;line-height:1.8;color:var(--text);display:none;white-space:pre-wrap;border:1px solid var(--border)}
.next-btn{width:100%;padding:13px;background:var(--primary);color:#fff;border:none;border-radius:var(--radius-sm);font-size:13px;cursor:pointer;font-weight:700;margin-top:10px;transition:all 0.18s;font-family:'DM Sans',sans-serif;letter-spacing:0.2px}
.next-btn:hover{background:#163DA0;transform:translateY(-1px);box-shadow:0 4px 14px rgba(26,79,191,0.3)}
.ai-btn{width:100%;padding:9px;background:var(--app-bg);color:var(--primary);border:1.5px solid var(--primary);border-radius:var(--radius-sm);font-size:12px;cursor:pointer;margin-top:7px;font-weight:600;font-family:'DM Sans',sans-serif;transition:all 0.15s}
.ai-btn:hover{background:var(--primary-light)}
.ai-btn:disabled{opacity:0.5;cursor:default}
.progress-bar-wrap{background:var(--border);border-radius:20px;height:5px;margin-bottom:4px}
.progress-bar{height:5px;border-radius:20px;background:var(--primary);transition:width 0.4s ease}
.stats-row{display:flex;gap:8px;margin-bottom:18px}
.stat-card{flex:1;background:var(--bg);border-radius:var(--radius-sm);padding:12px;text-align:center;border:1px solid var(--border)}
.stat-num{font-size:22px;font-weight:700;color:var(--text)}
.stat-label{font-size:10px;color:var(--text3);margin-top:2px;font-weight:600;letter-spacing:0.3px}
.cat-row{margin-bottom:12px}
.test-grade-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:14px 0}
.tg-btn{padding:11px 8px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:13px;cursor:pointer;background:var(--app-bg);color:var(--text);font-weight:700;transition:all 0.18s;font-family:'DM Sans',sans-serif}
.tg-btn:hover{background:var(--primary-light);border-color:var(--primary);color:var(--primary);transform:translateY(-1px)}
.timer-bar{display:flex;align-items:center;justify-content:space-between;background:var(--bg);border-radius:var(--radius-sm);padding:11px 16px;margin-bottom:14px;border:1px solid var(--border)}
.timer-num{font-size:22px;font-weight:700;color:var(--text);font-family:'DM Mono',monospace;font-variant-numeric:tabular-nums}
.timer-num.danger{color:var(--wrong)}
.test-progress{font-size:12px;color:var(--text2);font-weight:600}
.test-prog-bar-wrap{background:var(--border);border-radius:20px;height:4px;margin-bottom:14px}
.test-prog-bar{height:4px;border-radius:20px;background:var(--accent);transition:width 0.3s}
.test-word{font-size:28px;font-weight:700;color:var(--text);text-align:center;margin-bottom:18px;letter-spacing:-0.5px;font-family:'DM Mono',monospace}
.test-choices{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:7px}
.test-choice{padding:12px 8px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:12px;cursor:pointer;background:var(--app-bg);color:var(--text);text-align:center;line-height:1.4;transition:all 0.12s;font-weight:600;font-family:'DM Sans',sans-serif}
.test-choice:hover:not(.disabled){background:var(--primary-light);border-color:var(--primary)}
.test-choice.correct{background:var(--correct-bg);border-color:var(--correct);color:var(--correct);font-weight:700}
.test-choice.wrong{background:var(--wrong-bg);border-color:var(--wrong);color:var(--wrong)}
.test-choice.disabled{cursor:default}
.result-score-big{font-size:52px;font-weight:700;text-align:center;color:var(--primary);font-family:'DM Mono',monospace}
.result-label{font-size:12px;color:var(--text3);text-align:center;margin-bottom:18px;font-weight:500}
.result-stats{display:flex;gap:7px;margin-bottom:18px}
.result-stat{flex:1;background:var(--bg);border-radius:var(--radius-sm);padding:11px;text-align:center;border:1px solid var(--border)}
.result-stat-num{font-size:18px;font-weight:700;color:var(--text)}
.result-stat-label{font-size:10px;color:var(--text3);margin-top:2px;font-weight:600}
.wrong-list{background:var(--bg);border-radius:var(--radius-sm);padding:10px;max-height:280px;overflow-y:auto;border:1px solid var(--border)}
.wrong-item{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);font-size:12px}
.wrong-item:last-child{border-bottom:none}
.wrong-word{font-weight:700;color:var(--text)}
.wrong-meaning{color:var(--text2);font-weight:500}
.word-list-scroll{max-height:420px;overflow-y:auto;padding:0 4px}
.pos-badge{display:inline-block;font-size:10px;padding:2px 6px;border-radius:4px;font-weight:700;margin-right:4px;vertical-align:middle}
.pos-動{background:#FFF3E0;color:#E65100}.pos-名{background:#E3F2FD;color:#0D47A1}.pos-形{background:#F3E5F5;color:#6A1B9A}
.pos-副{background:#E8F5E9;color:#1B5E20}.pos-前{background:#FCE4EC;color:#880E4F}.pos-接{background:#E0F7FA;color:#006064}
.pos-代{background:#FFF8E1;color:#F57F17}.pos-間{background:#EFEBE9;color:#3E2723}.pos-他{background:#F5F5F5;color:#424242}
.pos-助動{background:#FFF3E0;color:#E65100}.pos-冠{background:#E8EAF6;color:#283593}.pos-疑{background:#E0F2F1;color:#004D40}
.pos-熟語{background:#FCE4EC;color:#880E4F}
.word-list-item{display:flex;align-items:center;padding:8px 4px;border-bottom:1px solid var(--border);gap:0}
.word-list-num{font-size:11px;color:var(--text3);width:40px;flex-shrink:0;text-align:right;padding-right:8px;font-weight:500}
.word-list-en{font-weight:700;color:var(--text);width:140px;flex-shrink:0}
.word-list-pos{width:42px;flex-shrink:0}
.word-list-ja{color:var(--text2);flex:1;font-size:12px;font-weight:500}
.word-list-speak{background:none;border:none;cursor:pointer;font-size:16px;padding:0 4px;opacity:.4;flex-shrink:0;transition:opacity 0.15s}
.word-list-speak:hover{opacity:1}
.mistake-item{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--border);font-size:13px;font-weight:600}
.mistake-item:last-child{border-bottom:none}
.tab-row{display:flex;gap:0;margin-bottom:14px;border-bottom:1.5px solid var(--border)}
.tab-btn{padding:7px 12px;font-size:12px;cursor:pointer;background:none;border:none;color:var(--text3);border-bottom:2px solid transparent;margin-bottom:-2px;font-weight:700;transition:color 0.15s;font-family:'DM Sans',sans-serif}
.tab-btn.active{color:var(--primary);border-bottom-color:var(--primary)}
.grade-badge{display:inline-block;font-size:10px;padding:2px 8px;border-radius:20px;font-weight:600;background:var(--primary-light);color:var(--primary)}
.search-input{width:100%;border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:9px 12px;font-size:13px;margin-bottom:10px;outline:none;font-weight:500;transition:border 0.15s;font-family:'DM Sans',sans-serif;background:var(--app-bg);color:var(--text)}
.search-input:focus{border-color:var(--primary)}
.overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,15,30,0.75);backdrop-filter:blur(10px);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px}
.login-card{background:#fff;border-radius:20px;padding:28px 22px;width:100%;max-width:360px;box-shadow:0 16px 48px rgba(0,0,0,0.18)}

@keyframes cdbounce{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.2)}100%{transform:scale(1);opacity:1}}
@keyframes fbpop{0%{transform:translate(-50%,-60%) scale(0.5);opacity:0}60%{transform:translate(-50%,-60%) scale(1.15)}100%{transform:translate(-50%,-60%) scale(1);opacity:1}}
@keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.mode-card{animation:fadeInUp 0.35s cubic-bezier(0.22,1,0.36,1) both}
.mode-card:nth-child(1){animation-delay:0s}.mode-card:nth-child(2){animation-delay:0.05s}
.mode-card:nth-child(3){animation-delay:0.1s}.mode-card:nth-child(4){animation-delay:0.15s}
.mode-card:nth-child(5){animation-delay:0.2s}.mode-card:nth-child(6){animation-delay:0.25s}
/* Battle Mode CSS */
.battle-player-row{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--bg);border-radius:var(--radius-sm);margin-bottom:6px;border:1px solid var(--border);transition:all 0.2s}
.battle-player-row.me{border-color:var(--primary);background:var(--primary-light)}
.battle-player-row.answered-correct{border-color:var(--correct);background:var(--correct-bg)}
.battle-player-row.answered-wrong{border-color:var(--wrong);background:var(--wrong-bg)}
.battle-score-badge{font-size:18px;font-weight:700;color:var(--primary);min-width:32px;text-align:right}
.battle-word{font-size:36px;font-weight:700;font-family:'DM Mono',monospace;text-align:center;margin:14px 0 8px;letter-spacing:-1px;color:var(--text)}
.battle-choices{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
.battle-choice{padding:14px 8px;border:2px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-weight:600;cursor:pointer;background:var(--app-bg);color:var(--text);text-align:center;transition:all 0.12s;font-family:'DM Sans',sans-serif;line-height:1.3}
.battle-choice:hover:not(.disabled){background:var(--primary-light);border-color:var(--primary);transform:scale(1.02)}
.battle-choice.correct{background:var(--correct-bg);border-color:var(--correct);color:var(--correct)}
.battle-choice.wrong{background:var(--wrong-bg);border-color:var(--wrong);color:var(--wrong)}
.battle-choice.disabled{cursor:default;opacity:0.7}
.battle-timer{font-size:28px;font-weight:700;font-family:'DM Mono',monospace;color:var(--text)}
.battle-timer.danger{color:var(--wrong)}
@keyframes buzzIn{0%{transform:scale(1.15);opacity:0}100%{transform:scale(1);opacity:1}}
.battle-buzz{animation:buzzIn 0.2s ease-out}
/* Battle Mode: 級選択・主要ボタン */
.battle-grade-btn{padding:6px 14px;border:1.5px solid var(--border2);border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;background:var(--app-bg);color:var(--text2);transition:all 0.15s;font-family:'DM Sans',sans-serif}
.battle-grade-btn.selected{background:#9C27B0;color:#fff;border-color:#9C27B0}
.battle-primary-btn{width:100%;padding:13px;background:#9C27B0;color:#fff;border:none;border-radius:var(--radius-sm);font-size:14px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;margin-bottom:10px}
