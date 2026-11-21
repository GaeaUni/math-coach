import { makeRng, fmt } from './lib.js';
import * as C from './core.js';
import { Pad } from './pad.js';
import * as R from './rewards.js';
import { mascot, speak, stopSpeak, ring, unitStyle } from './ui.js';
import { callDirect, PRESETS } from './ai.js';
import * as YW from './yw.js';
import * as CL from './cloud.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const app = $('#app');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const seed = () => (Date.now() ^ (Math.random() * 1e9)) >>> 0;

let SK = [], BY = {}, P;
const PROFILE = 'default';
const HAS_SERVER = !window.MC_STATIC; // 静态部署时没有 Mac 服务，进度只存在这台 iPad 上
const GRADES_LOADED = [];

// ---------------- 载入 ----------------
async function loadContent() {
  for (let g = 1; g <= 6; g++) {
    try {
      const m = await import(`../content/g${g}.js`);
      for (const sk of m.default) { SK.push(sk); BY[sk.id] = sk; }
      GRADES_LOADED.push(g);
    } catch (e) { console.warn('年级', g, '题库没加载：', e.message); }
  }
  try {
    const { FILES } = await import('../content/yw/index.js');
    const mods = await Promise.all(FILES.map((f) => import(`../content/yw/${f}.js`).catch((e) => { console.warn('语文', f, '没加载：', e.message); return null; })));
    for (const m of mods) for (const sk of m?.default || []) { if (BY[sk.id]) continue; SK.push(sk); BY[sk.id] = sk; }
  } catch (e) { console.warn('语文题库没加载：', e.message); }
}
const subj = (sk) => sk.subject || 'math';
const SUBJECTS = { math: { name: '数学', icon: '🔢' }, yw: { name: '语文', icon: '📖' } };
const curSubject = () => homeView?.subject || P.subject || 'math';
const subjSK = (sub = curSubject()) => SK.filter((s) => subj(s) === sub);
// 语文板块的固定顺序
const YW_UNITS = ['拼音', '识字写字', '字音字形', '词语积累', '句子', '标点与修辞', '古诗文', '积累运用', '阅读方法'];
async function loadProgress() {
  let local = null, remote = null;
  try { local = JSON.parse(localStorage.getItem('mc:' + PROFILE)); } catch {}
  if (HAS_SERVER) try { remote = await (await fetch('/api/progress?p=' + PROFILE)).json(); } catch {}
  const [got = {}, ...rest] = [local, remote].filter((x) => x && typeof x === 'object' && x.skills).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const d = C.newProgress();
  P = { ...d, ...got, settings: { ...d.settings, ...(got.settings || {}) } };
  for (const x of rest) C.mergeInto(P, x); // Mac 上的和这台设备上的合起来
  for (const k of ['skills', 'wrong', 'days']) P[k] ||= d[k];
  R.stats(P);
}
// iPad 直连 AI 的接口配置（密钥只存在这台设备上，不进进度、不进导出）
let AIC = null;
try { AIC = JSON.parse(localStorage.getItem('mc:ai')); } catch {}
const saveAIC = () => { try { AIC ? localStorage.setItem('mc:ai', JSON.stringify(AIC)) : localStorage.removeItem('mc:ai'); } catch {} };
async function aiRequest(body) {
  if (AIC?.apiKey) return callDirect(AIC, body);
  if (!HAS_SERVER) throw new Error('还没设置 AI 接口，请家长到「家长」页填写');
  let r;
  try { r = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); } catch { r = null; }
  if (!r || !(r.headers.get('content-type') || '').includes('json')) throw new Error('还没设置 AI 接口，请家长到「家长」页填写');
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || r.status);
  return j.text;
}
async function aiStatus() {
  if (AIC?.apiKey) return `iPad 直连 · ${PRESETS[AIC.preset]?.label || '自定义'} · ${AIC.model}`;
  if (HAS_SERVER) try { const r = await fetch('/api/ai/status'); if ((r.headers.get('content-type') || '').includes('json')) { const j = await r.json(); return `家里的 Mac · ${j.provider} ${j.model}（只在家里 Wi-Fi 下能用）`; } } catch {}
  return '还没设置';
}

let saveTimer;
function save() {
  P.updatedAt = Date.now();
  saveLocal();
  cloudLater();
  if (!HAS_SERVER) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => fetch('/api/progress?p=' + PROFILE, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(P) }).catch(() => {}), 600);
}
function saveLocal() { try { localStorage.setItem('mc:' + PROFILE, JSON.stringify(P)); } catch {} }

// ---------------- 云端同步（家长 GitHub 私有仓库，见 cloud.js） ----------------
// 做题时攒 20 秒传一次，切到后台时马上传；打开 App、从后台回来时先拉云端的合进来（别的设备做的题也会出现）。
const CLOUD_FILE = `progress-${PROFILE}.json`;
const CL_ = { sha: null, known: false, busy: null, again: false, timer: 0, at: 0, err: '', pulledAt: 0 };
function cloudLater(ms = 20000) {
  if (!CL.cfg()) return;
  clearTimeout(CL_.timer); CL_.timer = setTimeout(() => cloudSync(), ms);
}
/** 和云端对一次：没读过就先读、合并，再把合并后的写回去；别的设备抢先写了就重读重合 */
function cloudSync() {
  const c = CL.cfg();
  if (!c) return Promise.resolve();
  clearTimeout(CL_.timer); CL_.timer = 0;
  if (CL_.busy) { CL_.again = true; return CL_.busy; }
  CL_.busy = (async () => {
    try {
      for (let i = 0; ; i++) {
        if (i >= 4) throw new Error('几台设备同时在写，这次没同步上，稍后会再试');
        if (!CL_.known) {
          const { data, sha } = await CL.pull(c, CLOUD_FILE);
          CL_.sha = sha; CL_.known = true; CL_.pulledAt = Date.now();
          if (data && C.mergeInto(P, data)) { R.stats(P); saveLocal(); cloudMerged(); }
          if (data && JSON.stringify(data) === JSON.stringify(P)) break; // 云端已经是最新的
        }
        const res = await CL.push(c, CLOUD_FILE, P, CL_.sha);
        if (res.conflict) { CL_.known = false; continue; }
        CL_.sha = res.sha; break;
      }
      CL_.at = Date.now(); CL_.err = '';
    } catch (e) { CL_.err = e.message; CL_.known = false; }
    finally {
      CL_.busy = null;
      if (CL_.again) { CL_.again = false; cloudLater(3000); }
      if ($('#clState')) $('#clState').innerHTML = cloudStateText();
    }
  })();
  return CL_.busy;
}
/** 云端合进来了新东西：停在首页就刷新一下（做题时不打断） */
function cloudMerged() { if (!S && $('.page.home')) showHome(); }
function cloudStateText() {
  if (!CL.cfg()) return '没开';
  if (CL_.busy) return '正在同步…';
  if (CL_.err) return `<b style="color:var(--bad)">同步失败：${esc(CL_.err)}</b>`;
  return CL_.at ? `已同步（${new Date(CL_.at).toLocaleTimeString('zh-CN', { hour12: false })}）` : '还没同步';
}
document.addEventListener('visibilitychange', () => {
  if (!CL.cfg() || !P) return;
  if (document.hidden) { if (CL_.timer || CL_.again) cloudSync(); }
  else if (Date.now() - CL_.pulledAt > 60000) { CL_.known = false; cloudSync(); }
});

// ---------------- 小工具 ----------------
function toast(msg, ms = 2200) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), ms);
}
let actx;
function sound(kind) {
  if (!P.settings.sound) return;
  try {
    actx ||= new (window.AudioContext || window.webkitAudioContext)();
    const seq = {
      ok: [[660, 0], [990, 0.09]], bad: [[220, 0], [180, 0.12]], win: [[523, 0], [659, 0.1], [784, 0.2], [1046, 0.3]],
      star: [[1046, 0], [1568, 0.07]], combo: [[523, 0], [784, 0.07], [1046, 0.14], [1318, 0.21]], tick: [[880, 0]], go: [[784, 0], [1175, 0.12]],
    }[kind];
    for (const [f, t] of seq) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = kind === 'bad' ? 'triangle' : 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, actx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(kind === 'tick' ? 0.12 : 0.22, actx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + t + 0.22);
      o.connect(g).connect(actx.destination); o.start(actx.currentTime + t); o.stop(actx.currentTime + t + 0.25);
    }
  } catch {}
}
function confetti() {
  const c = document.createElement('canvas'); c.className = 'confetti'; document.body.append(c);
  const W = (c.width = innerWidth), H = (c.height = innerHeight), ctx = c.getContext('2d');
  const cols = ['#3b6cf6', '#ff9f1c', '#1f9d63', '#e4572e', '#7c5cff', '#ffd23f', '#e64980'];
  const ps = Array.from({ length: 160 }, () => ({ x: Math.random() * W, y: -20 - Math.random() * H * 0.5, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4, r: Math.random() * 6.3, s: 6 + Math.random() * 8, c: cols[(Math.random() * cols.length) | 0] }));
  const t0 = performance.now();
  (function f(t) {
    ctx.clearRect(0, 0, W, H);
    for (const p of ps) { p.x += p.vx; p.y += p.vy; p.r += 0.1; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); }
    if (t - t0 < 2600) requestAnimationFrame(f); else c.remove();
  })(t0);
}
function modal(html, onMount, cls = '') {
  const o = document.createElement('div'); o.className = 'overlay'; o.innerHTML = `<div class="modal pop ${cls}">${html}</div>`;
  document.body.append(o);
  const close = () => o.remove();
  onMount?.(o, close);
  return close;
}
// 顶部飘出的奖励横幅（排队，不挡操作）
const bannerQ = [];
function banner(icon, title, sub = '', big = false) { bannerQ.push({ icon, title, sub, big }); if (bannerQ.length === 1) showBanner(); }
function showBanner() {
  const b = bannerQ[0]; if (!b) return;
  const el = document.createElement('div'); el.className = 'banner' + (b.big ? ' big' : '');
  el.innerHTML = `<span class="bi">${b.icon}</span><div><b>${esc(b.title)}</b>${b.sub ? `<span>${esc(b.sub)}</span>` : ''}</div>`;
  document.body.append(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => { el.remove(); bannerQ.shift(); showBanner(); }, 350); }, b.big ? 3400 : 2600);
}
function flyStar(n, from) {
  const r = from?.getBoundingClientRect?.() || { left: innerWidth / 2 - 30, top: innerHeight / 2, width: 60, height: 0 };
  const el = document.createElement('div'); el.className = 'flystar'; el.textContent = `+${n} ⭐`;
  el.style.left = r.left + r.width / 2 + 'px'; el.style.top = r.top + 'px';
  document.body.append(el); setTimeout(() => el.remove(), 1300);
}
function combo(n, host) {
  const el = document.createElement('div'); el.className = 'combo';
  el.innerHTML = `<b>连对 ${n}</b><span>${n >= 20 ? '🚀' : n >= 10 ? '💥' : '🔥'}</span>`;
  (host || document.body).append(el); setTimeout(() => el.remove(), 1300);
  sound('combo');
}
const streakDays = () => R.dayStreak(P);
const skillsOf = (g, t, sub = curSubject()) => { const l = SK.filter((s) => s.grade === g && s.term === t && subj(s) === sub); return sub === 'yw' ? l.sort((a, b) => YW_UNITS.indexOf(a.unit) - YW_UNITS.indexOf(b.unit)) : l; };
const statusLabel = { new: '', learning: '练习中', mastered: '已掌握', due: '该复习' };
const stepsHTML = (steps) => steps.map((s) => (typeof s === 'string' ? `<li>${C.renderMarkup(s)}</li>` : `<li class="pre"><pre>${esc(s.pre)}</pre></li>`)).join('');

// ---------------- 星星 / 徽章 / 等级 ----------------
function gain(n, from) {
  if (!n) return;
  const { levelUp } = R.addStars(P, n);
  if (S) S.stars = (S.stars || 0) + n;
  if (from) flyStar(n, from);
  sound('star');
  $$('.js-stars').forEach((e) => { e.textContent = R.stats(P).stars; const c = e.closest('.chip'); if (c) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); } });
  if (levelUp) {
    setTimeout(() => { sound('win'); confetti(); }, 300);
    banner(levelUp.icon, `升级啦！Lv${levelUp.i} ${levelUp.name}`, levelUp.next ? `再攒 ${levelUp.next - R.stats(P).stars} 颗星升下一级` : '已经是最高等级了！', true);
  }
}
function checkRewards() {
  const d = P.days[C.today()];
  if (d && !d.goal && d.n >= P.settings.dailyGoal) { d.goal = 1; banner('🎯', '今日目标完成！', `今天已经做了 ${d.n} 题，奖励 5 颗星`, true); gain(5); }
  for (const b of R.checkBadges(P)) banner(b.icon, '新徽章：' + b.name, b.desc);
  save();
}
const shouldRead = (sk) => P.settings.readAloud === 'on' || (P.settings.readAloud === 'auto' && sk.grade <= 2 && !sk.speed);
const readProblem = (p) => (p.say ? speak(`${p.say}。${p.say}。`) : speak(p.q));
function greet() { const h = new Date().getHours(); return h < 5 ? '夜深了' : h < 11 ? '早上好' : h < 13 ? '中午好' : h < 18 ? '下午好' : '晚上好'; }

// ---------------- 首页 ----------------
let homeView = null;
function leave() { S = null; stopTimer(); stopChallenge(); stopSpeak(); }
function showHome() {
  leave();
  homeView ||= { grade: P.grade, term: P.term, subject: P.subject || 'math' };
  const g = homeView.grade, t = homeView.term, sub = homeView.subject, isYW = sub === 'yw';
  const st = R.stats(P), lv = R.levelOf(st.stars), goal = P.settings.dailyGoal;
  const plan = C.todayPlan(P, subjSK(sub));
  const d = P.days[C.today()] || { n: 0, c: 0 };
  const due = plan.filter((p) => p.target === 'review').length;
  const all = skillsOf(g, t), mastered = all.filter((s) => P.skills[s.id]?.mastered).length;
  const units = [];
  for (const sk of all) { let u = units.find((x) => x.name === sk.unit); if (!u) units.push((u = { name: sk.unit, list: [] })); u.list.push(sk); }
  const msg = d.goal ? '今天的目标完成啦！还想练就挑个题型闯关吧 🎉'
    : due ? `有 ${due} 个学过的题型该复习了，先把它们拿下！`
    : d.n ? `今天做了 ${d.n} 题，离目标还差 ${Math.max(0, goal - d.n)} 题，加油！`
    : pick([`今天的目标是 ${goal} 题，一起开始吧！`, isYW ? '每天练一点，字写得越来越漂亮！' : '每天练一点，数学越来越厉害！', '准备好了吗？点「今日任务」出发！']);
  let dict = isYW ? all.filter((s) => /听写/.test(s.name)) : [];
  if (isYW && !dict.length) dict = all.filter((s) => s.name === '看拼音写字'); // 一上还没有词语听写，先写单字
  const tag = (p) => p.target === 'review' ? '<span class="tag rv">复习</span>' : P.skills[p.skill.id]?.n ? '<span class="tag go">接着练</span>' : '<span class="tag nw">新学</span>';
  app.innerHTML = `<div class="page home">
    <header class="hello">
      <div class="mbox">${mascot(d.goal ? 'cheer' : 'normal', 84)}</div>
      <div class="bubble"><b>${greet()}，${esc(P.name)}！</b><span>${msg}</span></div>
      <div class="hstats">
      <button class="lvchip" id="goMe"><span class="lvi">${lv.icon}</span><span class="lvt"><b>Lv${lv.i} ${lv.name}</b><span class="lvbar"><i style="width:${Math.round(lv.pct * 100)}%"></i></span></span></button>
      <span class="chip gold">⭐ <b class="js-stars">${st.stars}</b></span>
      <span class="chip fire">🔥 ${streakDays()} 天</span>
      <button class="iconbtn" id="goParent" title="家长">⚙️</button>
      </div>
    </header>
    <div class="tiles">
      <button class="tile t-today" id="goToday">
        <div class="ringbox">${ring(d.n / goal, { size: 116, stroke: 12 })}<div class="ringlab"><b>${d.n}</b><span>/ ${goal} 题</span></div></div>
        <div class="tt"><div class="big">今日任务 ▶</div><div class="list">${plan.length ? plan.map((p) => `<div>${tag(p)}${esc(p.skill.name)}</div>`).join('') : '<div>任务都完成了！挑一个题型自由练吧</div>'}</div></div>
      </button>
      ${isYW ? `<button class="tile t-ch t-dict" id="goDict"><span class="ti">✍️</span><b>听写</b><span>${dict.length ? '听一听，写一写，本册词语' : '这一册还没有听写'}</span></button>`
        : `<button class="tile t-ch" id="goChallenge"><span class="ti">⚡</span><b>口算挑战</b><span>60 秒能答对几题？${st.challengeBest ? `<br>最好 ${st.challengeBest} 题` : ''}</span></button>`}
      <button class="tile t-wrong" id="goWrong"><span class="ti">📕</span><b>错题本</b><span>${P.wrong.length ? `${P.wrong.length} 道等你订正` : '空空的，真棒'}</span></button>
      <button class="tile t-test" id="goTest"><span class="ti">📝</span><b>综合测验</b><span>随机出题考考自己</span></button>
      <button class="tile t-me" id="goMe2"><span class="ti">🏅</span><b>我的成就</b><span>徽章 ${Object.keys(st.badges).length} / ${R.BADGES.length}</span></button>
    </div>
    <div class="termbar">
      <div class="seg subj" id="subjSeg">${Object.entries(SUBJECTS).map(([k, v]) => `<button data-s="${k}" class="${k === sub ? 'on' : ''}">${v.icon} ${v.name}</button>`).join('')}</div>
      <div class="seg" id="gradeSeg">${[1, 2, 3, 4, 5, 6].map((x) => `<button data-g="${x}" class="${x === g ? 'on' : ''}">${C.GRADE_CN[x]}年级</button>`).join('')}</div>
      <div class="seg" id="termSeg"><button data-t="1" class="${t === 1 ? 'on' : ''}">上册</button><button data-t="2" class="${t === 2 ? 'on' : ''}">下册</button></div>
      <div class="grow"></div>
      <div class="termprog"><span>${C.termName(g, t)} · 已掌握 <b>${mastered}</b> / ${all.length}</span><span class="pbar"><i style="width:${all.length ? (mastered / all.length) * 100 : 0}%"></i></span></div>
    </div>
    ${units.length ? units.map((u, i) => {
      const us = unitStyle(u.name, i), m = u.list.filter((s) => P.skills[s.id]?.mastered).length;
      return `<section class="unitsec" style="--uc:${us.c};--ubg:${us.bg}"><div class="unithead"><span class="uicon">${us.icon}</span><span class="uname">${esc(u.name)}</span><span class="ucount">${m} / ${u.list.length}</span><span class="ubar"><i style="width:${(m / u.list.length) * 100}%"></i></span></div><div class="skills">${u.list.map(skillCard).join('')}</div></section>`;
    }).join('') : `<div class="empty">${GRADES_LOADED.includes(g) ? '这一册还没有题型' : '这个年级的题库还在准备中'}</div>`}
  </div>`;
  const setView = () => { P.grade = homeView.grade; P.term = homeView.term; P.subject = homeView.subject; save(); showHome(); };
  $$('#subjSeg button').forEach((b) => (b.onclick = () => { homeView.subject = b.dataset.s; setView(); }));
  $$('#gradeSeg button').forEach((b) => (b.onclick = () => { homeView.grade = +b.dataset.g; setView(); }));
  $$('#termSeg button').forEach((b) => (b.onclick = () => { homeView.term = +b.dataset.t; setView(); }));
  $$('.sk').forEach((b) => (b.onclick = () => { const sk = BY[b.dataset.id]; const s = C.status(P, sk); startDrill([{ skill: sk, target: s === 'due' ? 'review' : s === 'mastered' ? 'free' : 'master' }], 'drill'); }));
  $('#goToday').onclick = () => plan.length ? startDrill(plan, 'today') : toast('今天的任务都完成了，挑一个题型自由练吧');
  if ($('#goChallenge')) $('#goChallenge').onclick = showChallenge;
  if ($('#goDict')) $('#goDict').onclick = () => { if (!dict.length) return toast('这一册还没有听写题'); const sk = dict.find((s) => !P.skills[s.id]?.mastered) || dict[0]; const s0 = C.status(P, sk); startDrill([{ skill: sk, target: s0 === 'due' ? 'review' : s0 === 'mastered' ? 'free' : 'master' }], 'drill'); };
  $('#goWrong').onclick = showWrongBook;
  $('#goTest').onclick = chooseTest;
  $('#goMe').onclick = $('#goMe2').onclick = () => showMe();
  $('#goParent').onclick = showParent;
}
function skillCard(sk) {
  const st = C.status(P, sk), s = P.skills[sk.id], acc = C.accuracy(s), need = P.settings.streak;
  const pct = st === 'new' ? 0 : s.mastered ? 100 : Math.min(99, (s.streak / need) * 100);
  const stars = st === 'new' ? 0 : s.mastered ? 3 : s.streak >= Math.ceil(need * 0.6) ? 2 : 1;
  return `<button class="sk ${st}" data-id="${sk.id}">
    <div class="skt"><span class="stars">${[0, 1, 2].map((i) => `<i class="${i < stars ? 'on' : ''}">★</i>`).join('')}</span>${statusLabel[st] ? `<span class="st">${statusLabel[st]}</span>` : '<span class="st nw">新</span>'}</div>
    <div class="nm">${esc(sk.name)}</div>
    <div class="prog"><i style="width:${pct}%"></i></div>
    <div class="meta"><span class="lv l${sk.level}">${C.LEVEL[sk.level]}</span>${sk.speed ? '<span>⚡ 口算</span>' : ''}${sk.process ? '<span>✎ 列式</span>' : ''}<span style="margin-left:auto">${s?.n ? `${s.n} 题 · ${Math.round(acc * 100)}%` : ''}</span></div>
  </button>`;
}

// ---------------- 练习会话 ----------------
// S = { mode, tasks:[{skill,target,problem?,wrong?}], ti, problem, skill, target, tries, t0, chat, results, count, sessionStreak, stars }
let S = null, pad = null, timerId = null;
const stopTimer = () => { clearInterval(timerId); timerId = null; };

function startDrill(tasks, mode) {
  stopChallenge();
  S = { mode, tasks, ti: 0, results: [], count: 0, sessionStreak: 0, stars: 0, okN: 0 };
  beginTask();
}
function beginTask() {
  const task = S.tasks[S.ti];
  S.skill = task.skill; S.target = task.target; S.taskCount = 0;
  if (task.target === 'review') { C.ss(P, task.skill.id).streak = 0; }
  // 新题型先看一道例题（口算题不用）
  if (task.target === 'master' && !task.problem && !task.skill.speed && !P.skills[task.skill.id]?.n && (S.mode === 'drill' || S.mode === 'today')) return showExample(task.skill);
  nextProblem();
}
function genProblem(sk) {
  for (let i = 0; i < 5; i++) {
    try {
      const p = sk.gen(makeRng(seed()));
      if ((S?.lastQ !== p.q) || i === 4) { if (S) S.lastQ = p.q; return p; }
    } catch (e) { console.error(sk.id, e); }
  }
  throw new Error('这个题型出题出错了');
}
function nextProblem() {
  const task = S.tasks[S.ti];
  S.problem = task.problem && S.taskCount === 0 ? task.problem : genProblem(S.skill);
  S.tries = 0; S.firstOk = null; S.chat = []; S.revealed = false; S.t0 = Date.now(); S.answered = false;
  S.taskCount++; S.count++;
  renderPractice();
}

/** 题干里的答题空（含标签、单位）和题干外的答题空 */
function layoutQ(p, cell, slotChoice = false) {
  // slotChoice（语文）：题干里的选择空只留「（　）」，选项放到题干下面，选了填进括号
  const slot = (k) => slotChoice && p.answer[k]?.kind === 'choice';
  const inline = new Set([...String(p.q).replace(/<svg[\s\S]*?<\/svg>/g, '').matchAll(/\{(\d+)\}/g)].map((m) => +m[1]).filter((k) => !slot(k)));
  const q = C.renderMarkup(p.q, (k) => {
    const a = p.answer[k]; if (!a) return '';
    if (slot(k)) return `<span class="chbr">（<span class="chslot" data-k="${k}"></span>）</span>`;
    const pos = p.q.indexOf(`{${k}}`), before = p.q.slice(Math.max(0, pos - 6), pos), after = p.q.slice(pos + 3, pos + 9);
    const lab = a.label && !before.includes(a.label) ? `<span class="lbl">${esc(a.label)}</span>` : '';
    const unit = a.unit && !after.trimStart().startsWith(a.unit) ? `<span class="unitx">${esc(a.unit)}</span>` : '';
    return lab + cell(a, k) + unit;
  });
  const after = p.answer.map((a, k) => (inline.has(k) ? '' : `<span class="blk">${a.label ? `<span class="lbl">${esc(a.label)}</span>` : ''}${cell(a, k)}${a.unit ? `<span class="unitx">${esc(a.unit)}</span>` : ''}</span>`)).join('');
  return { q, after };
}
const figFirst = (p) => { if (!p.fig) return false; const t = C.plainText(p.q); return /看图|如图|下图|上图|图中|统计图|统计表|下面是/.test(t) || t.length > 45; };
const filled = (a) => `<span class="filled">${C.answerHTML({ ...a, unit: '' })}</span>`;

function ensureShell() {
  if (pad && document.contains(pad.c)) { pad.clear(); return; }
  app.innerHTML = `<div class="practice">
    <div class="left" id="left"></div>
    <div class="right">
      <div class="padhead"><span class="t">✏️ 草稿纸</span>
        <button class="tool on" data-tool="pen" data-color="#1d2433"><span class="dot" style="background:#1d2433"></span></button>
        <button class="tool" data-tool="pen" data-color="#2f5bd8"><span class="dot" style="background:#2f5bd8"></span></button>
        <button class="tool" data-tool="pen" data-color="#e4572e"><span class="dot" style="background:#e4572e"></span></button>
        <button class="tool" data-tool="eraser">🧽</button>
        <button class="tool" data-act="undo">↶</button>
        <button class="tool" data-act="clear">🗑</button>
      </div>
      <div class="padwrap"><div class="padtip" id="padtip">在这里打草稿、列竖式（用 Apple Pencil 写）</div><canvas id="pad"></canvas></div>
      <div class="wbox" id="wbox"></div>
    </div></div>`;
  pad = new Pad($('#pad'));
  pad.onChange = () => { $('#padtip').style.display = pad.strokes.length ? 'none' : ''; };
  $$('.tool[data-tool]').forEach((b) => (b.onclick = () => { $$('.tool[data-tool]').forEach((x) => x.classList.remove('on')); b.classList.add('on'); pad.tool = b.dataset.tool; if (b.dataset.color) pad.color = b.dataset.color; }));
  $('.tool[data-act=undo]').onclick = () => pad.undo();
  $('.tool[data-act=clear]').onclick = () => pad.clear();
}
let HP = null; // 当前题的写字格
const dropHP = () => { HP?.destroy(); HP = null; };
function exitPractice() { dropHP(); pad = null; showHome(); }

// ---- 例题 ----
function exampleBody(sk, p) {
  const { q, after } = layoutQ(p, (a) => filled(a));
  return `${figFirst(p) ? `<div class="fig">${p.fig}</div>` : ''}<div class="q">${q}</div>
    ${p.fig && !figFirst(p) ? `<div class="fig">${p.fig}</div>` : ''}
    ${after ? `<div class="after q">${after}</div>` : ''}
    <div class="exsteps"><div class="h">解题步骤</div><ol class="steps">${stepsHTML(p.steps)}</ol></div>
    ${sk.tip ? `<div class="hintbox">💡 ${C.renderMarkup(sk.tip)}</div>` : ''}`;
}
function showExample(sk) {
  stopTimer(); ensureShell();
  let p = genProblem(sk);
  R.stats(P).examples++;
  const draw = () => {
    $('#left').innerHTML = `
      <div class="ph"><button class="btn ghost" id="back" style="padding:8px 10px">‹ 返回</button>
        <div class="title"><div class="nm">📖 例题 · ${esc(sk.name)}</div><div class="sub">${C.termName(sk.grade, sk.term)} · ${esc(sk.unit)} · 先看懂，再动手</div></div>
        <button class="iconbtn" id="readQ" title="读给我听">🔊</button></div>
      <div class="qcard example" id="qcard">
        <div class="exhead">${mascot('think', 62)}<div class="bubble sm"><b>新题型！</b><span>先看数数老师做一道，弄懂每一步，再自己练。</span></div></div>
        ${exampleBody(sk, p)}
      </div>
      <div class="ops"><button class="btn" id="exMore">换一道例题</button><button class="btn pri submit" id="exGo">我看懂了，开始练 →</button></div>`;
    $('#back').onclick = exitPractice;
    $('#readQ').onclick = () => speak((p.say ? p.say + '。' : '') + p.q + '。' + p.steps.filter((s) => typeof s === 'string').join('。'));
    $('#exMore').onclick = () => { p = genProblem(sk); draw(); };
    $('#exGo').onclick = () => { stopSpeak(); nextProblem(); };
    setPane(sk, p, true);
    if (shouldRead(sk)) speak(p.q);
  };
  draw();
}
function exampleModal(sk) {
  const p = sk.gen(makeRng(seed()));
  R.stats(P).examples++;
  modal(`<div class="exhead">${mascot('think', 54)}<div class="bubble sm"><b>例题</b><span>${esc(sk.name)}：看看这一道是怎么做的</span></div></div>
    <div class="exbody">${exampleBody(sk, p)}</div>
    <div class="row"><button class="btn" data-a="read">🔊 读一读</button><button class="btn pri" data-a="ok">看懂了，回去做题</button></div>`,
  (o, close) => {
    $('[data-a=read]', o).onclick = () => speak(p.q + '。' + p.steps.filter((s) => typeof s === 'string').join('。'));
    $('[data-a=ok]', o).onclick = () => { stopSpeak(); close(); };
  }, 'wide');
}

/** 阅读题：题干 = 标题\n各段\n\n问题。拆成短文（横屏放左栏）和问题 */
function splitPassage(sk, p) {
  const i = p.q.indexOf('\n\n');
  if (!(p.passage || sk.unit === '阅读方法') || i < 0) return null;
  const [title, ...paras] = p.q.slice(0, i).split('\n');
  return { ask: p.q.slice(i + 2), html: `<div class="ptitle">${C.renderMarkup(title)}</div>${paras.map((t) => `<p>${C.renderMarkup(t)}</p>`).join('')}` };
}

// ---- 做题 ----
function renderPractice() {
  const sk = S.skill, p = S.problem, st = C.ss(P, sk.id);
  const kbd = P.settings.input === 'kbd';
  const modeName = { drill: '', today: `今日任务 ${S.ti + 1}/${S.tasks.length} · `, wrong: `错题重做 ${S.ti + 1}/${S.tasks.length} · `, test: `测验 ${S.ti + 1}/${S.tasks.length} · ` }[S.mode];
  const targetName = { master: `连对 ${S.target === 'review' ? 3 : P.settings.streak} 题就掌握`, review: '复习：连对 3 题', free: '巩固练习', test: '' }[S.target] || '';
  ensureShell();

  const need = S.target === 'review' ? 3 : P.settings.streak;
  const dots = S.target === 'test' ? '' : S.target === 'free' ? `<span class="chip fire sm" id="streakChip">🔥 连对 ${st.streak}</span>` : `<div class="dots ${need > 6 ? 'small' : ''}" title="连对 ${st.streak}/${need}">${Array.from({ length: need }, (_, i) => `<i class="${i < st.streak ? 'on' : ''}"></i>`).join('')}</div>`;
  const isYW = subj(sk) === 'yw';
  const rd = isYW ? splitPassage(sk, p) : null;
  const { q, after } = layoutQ(rd ? { ...p, q: rd.ask } : p, (a, k) => blankHTML(a, k, kbd), isYW || !!p.slots);
  const needKeys = p.answer.some((a) => ['num', 'frac', 'ratio'].includes(a.kind));
  const tools = `<div class="qtools"><button class="iconbtn" id="readQ" title="读题">🔊</button>${S.mode !== 'test' ? '<button class="iconbtn" id="exBtn" title="看例题">📖</button>' : ''}</div>`;

  $('#left').innerHTML = `
    <div class="ph">
      <button class="btn ghost" id="back" style="padding:8px 10px">‹ 返回</button>
      <div class="title"><div class="nm">${esc(sk.name)}</div><div class="sub">${modeName}${C.termName(sk.grade, sk.term)} · ${esc(sk.unit)}${targetName ? ' · ' + targetName : ''}${sk.speed && S.target !== 'test' ? ` · ⚡ 目标 ${sk.speed} 秒` : ''}</div></div>
      ${dots}
      <span class="chip gold sm">⭐ <b class="js-stars">${R.stats(P).stars}</b></span>
      <div class="timer" id="timer">0s</div>
    </div>
    <div class="qcard ${rd ? 'reading' : ''}" id="qcard">
      ${rd ? `<div class="passage">${tools}${rd.html}</div><div class="askcol">` : tools}
      ${figFirst(p) ? `<div class="fig">${p.fig}</div>` : ''}<div class="q" id="q">${q}</div>
      ${p.fig && !figFirst(p) ? `<div class="fig">${p.fig}</div>` : ''}
      ${after ? `<div class="after q">${after}</div>` : ''}
      ${sk.process && S.target !== 'test' ? '<div class="muted" style="font-size:16px;margin-top:8px">✎ 在草稿纸上写出列式和计算过程，答对后可以请 AI 老师检查过程</div>' : ''}
      <div id="feedback"></div>
      ${rd ? '</div>' : ''}
    </div>
    <div class="ops" id="ops"></div>
    ${kbd || !needKeys ? '' : `<div class="keypad" id="keypad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', '-', '⌫', '→'].map((k) => `<button class="${k === '⌫' || k === '→' ? 'fn' : ''}" data-k="${k}">${k === '→' ? '下一格' : k}</button>`).join('')}</div>`}`;
  renderOps();
  $('#back').onclick = () => { if (S.mode === 'test' && S.results.length) { if (!confirm('测验还没做完，确定退出吗？')) return; } exitPractice(); };
  $('#readQ').onclick = () => readProblem(p);
  if ($('#exBtn')) $('#exBtn').onclick = () => exampleModal(sk);
  $('#qcard').classList.toggle('long', isYW && C.plainText(p.q).length > 90);
  $('#qcard').classList.toggle('yw', isYW);
  setPane(sk, p);
  bindInputs();
  stopTimer();
  timerId = setInterval(() => { const el = $('#timer'); if (el && !S.answered) el.textContent = Math.round((Date.now() - S.t0) / 1000) + 's'; }, 500);
  if (p.say) setTimeout(() => { if (S && S.problem === p) readProblem(p); }, 300); // 听写一定要读
  else if (S.mode !== 'test' && shouldRead(sk)) speak(p.q); else stopSpeak();
}
/** 右栏：有写字题 → 写字格；语文其他题 → 收起；数学 → 草稿纸 */
function setPane(sk, p, example = false) {
  dropHP();
  const hz = example ? [] : p.answer.map((a, k) => ({ a, k })).filter((x) => x.a.kind === 'hanzi');
  const pr = $('.practice');
  pr.classList.toggle('writing', hz.length > 0);
  pr.classList.toggle('nopad', subj(sk) === 'yw' && !hz.length);
  if (!hz.length) { $('#wbox').innerHTML = ''; return; }
  HP = new YW.HanziPad($('#wbox'), hz.map((x) => ({ k: x.k, value: x.a.value })), {
    onPaint: (slots, cur) => slots.forEach((s, j) => { const el = $(`#left .hzb[data-k="${s.k}"] i[data-i="${s.i}"]`); if (el) { el.textContent = s.done ? s.text : ''; el.className = `${j === cur ? 'cur' : ''} ${s.done ? (s.fail ? 'fail' : 'ok') : ''}`; } }),
    onDone: () => { if (!S || S.answered || S.problem !== p) return; const v = collect(); if (p.answer.every((a, k) => a.kind === 'hanzi' || !C.gradeBlank(a, v[k]).empty)) setTimeout(submit, 200); },
  });
}

function blankHTML(a, k, kbd) {
  const im = kbd ? 'decimal' : 'none';
  const inp = (sub, ph = '') => `<input class="blank" data-k="${k}" data-sub="${sub}" inputmode="${im}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="${ph}">`;
  switch (a.kind) {
    case 'frac': return `<span class="mixin">${a.mixed ? inp('w') : ''}<span class="fracin">${inp('n')}<span class="ln"></span>${inp('d')}</span></span>`;
    case 'ratio': return `${inp('a')}<b>:</b>${inp('b')}`;
    case 'choice': { const long = a.options.some((o) => C.stripMarks(o).length > 3); return `<span class="choice ${long && a.options.length > 2 ? 'col' : ''}" data-k="${k}">${a.options.map((o) => `<button class="${long ? 'long' : ''}" data-v="${esc(o)}">${C.renderMarkup(String(o))}</button>`).join('')}</span>`; }
    case 'text': return `<input class="blank" data-k="${k}" data-sub="v" style="width:6em" autocomplete="off">`;
    case 'hanzi': return `<span class="hzb" data-k="${k}">${[...a.value].map((_, i) => `<i data-i="${i}"></i>`).join('')}</span>`;
    case 'order': return YW.orderHTML(a, k);
    default: return inp('v');
  }
}

let activeInput = null;
function bindInputs() {
  const inputs = $$('#left input.blank');
  const fit = (el) => { el.style.width = Math.max(el.closest('.fracin') ? 2.2 : 2.6, el.value.length * 0.62 + 1.1) + 'em'; };
  inputs.forEach((el) => {
    el.addEventListener('focus', () => { activeInput = el; inputs.forEach((x) => x.classList.toggle('active', x === el)); });
    el.addEventListener('input', () => { fit(el); el.classList.remove('wrong', 'right'); });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
  });
  activeInput = inputs[0] || null;
  if (activeInput) activeInput.classList.add('active');
  $$('#left .choice button').forEach((b) => (b.onclick = () => {
    if (S.answered) return;
    const grp = b.parentElement; $$('button', grp).forEach((x) => x.classList.remove('sel', 'wrong', 'right')); b.classList.add('sel');
    const sl = $(`#left .chslot[data-k="${grp.dataset.k}"]`); if (sl) { sl.innerHTML = C.renderMarkup(b.dataset.v); sl.classList.remove('r-ok', 'r-bad'); }
    const groups = $$('#left .choice');
    if (!inputs.length && groups.every((g) => $('button.sel', g)) && S.problem.answer.every((a) => a.kind === 'choice')) setTimeout(submit, 150);
  }));
  YW.bindOrder($('#left'), (o, full) => { if (full && !inputs.length && S.problem.answer.every((a, k) => a.kind !== 'choice' || $(`#left .choice[data-k="${k}"] button.sel`)) && !S.problem.answer.some((a) => a.kind === 'hanzi')) setTimeout(submit, 250); });
  $$('#left .hzb').forEach((b) => (b.onclick = () => { if (HP && !S.answered) HP.go(HP.slots.findIndex((s) => s.k === +b.dataset.k)); }));
  $$('#keypad button').forEach((b) => (b.onclick = () => {
    if (S.answered && S.revealed) return;
    const k = b.dataset.k;
    if (!activeInput) activeInput = inputs.find((x) => !x.value) || inputs[0];
    if (!activeInput) return;
    if (k === '→') { const i = inputs.indexOf(activeInput); activeInput = inputs[(i + 1) % inputs.length]; inputs.forEach((x) => x.classList.toggle('active', x === activeInput)); return; }
    if (k === '⌫') activeInput.value = activeInput.value.slice(0, -1); else activeInput.value += k;
    activeInput.dispatchEvent(new Event('input'));
  }));
}

function collect() {
  const p = S.problem;
  return p.answer.map((a, k) => {
    if (a.kind === 'choice') return $(`#left .choice[data-k="${k}"] button.sel`)?.dataset.v ?? null;
    if (a.kind === 'hanzi') return HP ? HP.value(k) : { text: '', fails: 0 };
    if (a.kind === 'order') return YW.orderValue($('#left'), k, a);
    const els = $$(`#left input.blank[data-k="${k}"]`);
    if (a.kind === 'num' || a.kind === 'text') return els[0]?.value ?? '';
    const o = {}; els.forEach((e) => (o[e.dataset.sub] = e.value)); return o;
  });
}
function givenText(vals) {
  return S.problem.answer.map((a, k) => {
    const v = vals[k];
    if (a.kind === 'frac') return v.w ? `${v.w}又${v.n}/${v.d}` : `${v.n || '?'}/${v.d || '?'}`;
    if (a.kind === 'ratio') return `${v.a || '?'}:${v.b || '?'}`;
    if (a.kind === 'hanzi') return (a.label ? a.label + '：' : '') + (v.text || '（没写完）') + (v.fails ? '（看了提示）' : '');
    if (a.kind === 'order') return (a.label ? a.label + '：' : '') + (v.length ? v.map(C.stripMarks).join(a.sep ?? '') : '（没排）');
    return (a.label ? a.label + '：' : '') + (v == null ? '（没选）' : C.stripMarks(v));
  }).join('；');
}
function markBlanks(res) {
  S.problem.answer.forEach((a, k) => {
    if (a.kind === 'choice') {
      const sel = $(`#left .choice[data-k="${k}"] button.sel`);
      if (sel) sel.classList.add(res[k].ok ? 'right' : 'wrong');
      const sl = $(`#left .chslot[data-k="${k}"]`); if (sl) { sl.classList.remove('r-ok', 'r-bad'); sl.classList.add(res[k].ok ? 'r-ok' : 'r-bad'); }
    } else if (a.kind === 'hanzi' || a.kind === 'order') {
      const el = $(`#left .${a.kind === 'hanzi' ? 'hzb' : 'ord'}[data-k="${k}"]`); if (el) { el.classList.remove('r-ok', 'r-bad'); el.classList.add(res[k].ok ? 'r-ok' : 'r-bad'); }
    } else $$(`#left input.blank[data-k="${k}"]`).forEach((e) => { e.classList.remove('right', 'wrong'); e.classList.add(res[k].ok ? 'right' : 'wrong'); });
  });
}

function renderOps(state = 'ask') {
  const ops = $('#ops'); if (!ops) return;
  const sk = S.skill;
  if (state === 'ask') {
    ops.innerHTML = S.mode === 'test'
      ? `<button class="btn pri submit" id="submit">提交 ✓</button>`
      : `<button class="btn" id="hint">💡 提示</button><button class="btn purple" id="dunno">🦉 问老师</button><button class="btn pri submit" id="submit">提交 ✓</button>`;
    $('#submit').onclick = submit;
    if ($('#hint')) $('#hint').onclick = () => {
      const fb = $('#feedback'); if ($('.hintbox', fb)) return;
      fb.insertAdjacentHTML('afterbegin', `<div class="hintbox">💡 ${C.renderMarkup(S.problem.hint || sk.tip)}</div>`);
      S.usedHint = true;
    };
    if ($('#dunno')) $('#dunno').onclick = () => askAI('hint');
  } else if (state === 'retry') {
    ops.innerHTML = `<button class="btn" id="reveal">看答案和讲解</button><button class="btn purple" id="dunno">🦉 问老师</button><button class="btn pri submit" id="submit">改好了，再提交</button>`;
    $('#submit').onclick = submit; $('#reveal').onclick = () => reveal([]); $('#dunno').onclick = () => askAI('hint');
  } else if (state === 'next') {
    const canReview = sk.process && pad.hasInk() && S.firstOk;
    ops.innerHTML = `${S.firstOk === false ? '<button class="btn purple" id="explain">🦉 还是不懂</button>' : ''}${canReview ? '<button class="btn purple" id="review">✎ 请老师看过程</button>' : ''}<button class="btn ok submit" id="next">${S.firstOk === false ? '我懂了，再来一道 →' : '下一题 →'}</button>`;
    $('#next').onclick = advance;
    if ($('#explain')) $('#explain').onclick = () => askAI('explain');
    if ($('#review')) $('#review').onclick = () => askAI('review');
  }
}

const resultBox = (cls, mood, head, body = '') => `<div class="result ${cls} pop"><div class="mm">${mascot(mood, 52)}</div><div class="rbody"><div class="head">${head}</div>${body}</div></div>`;

function submit() {
  if (S.answered) return;
  const p = S.problem, vals = collect();
  const res = p.answer.map((a, k) => C.gradeBlank(a, vals[k], { grade: S.skill.grade }));
  if (res.every((r) => r.empty)) { toast('还没填答案哦'); return; }
  const ok = res.every((r) => r.ok);
  const ms = Date.now() - S.t0;
  const sk = S.skill;
  const btn = $('#submit');
  S.lastGiven = givenText(vals);
  markBlanks(res);

  if (S.mode === 'test') {
    S.answered = true;
    C.record(P, sk, { ok, ms, target: 'master' });
    if (!ok) C.addWrong(P, sk, p, S.lastGiven);
    S.results.push({ skill: sk, problem: p, ok, given: S.lastGiven, ms });
    if (ok) gain(1, btn);
    checkRewards();
    setTimeout(advance, 350);
    return;
  }

  let firstTry = false;
  if (S.tries === 0) {
    firstTry = true;
    S.firstOk = ok;
    const ev = C.record(P, sk, { ok, ms, target: S.target === 'free' ? 'master' : S.target });
    if (S.mode === 'wrong') { const w = P.wrong.find((x) => x.id === S.tasks[S.ti].wrong?.id); if (w) { if (ok) { w.fixed = (w.fixed || 0) + 1; } else w.fixed = 0; } }
    if (!ok) C.addWrong(P, sk, p, S.lastGiven);
    S.events = ev;
    S.sessionStreak = ok ? S.sessionStreak + 1 : 0;
    const stt = R.stats(P); if (S.sessionStreak > stt.bestStreak) stt.bestStreak = S.sessionStreak;
    save();
  }
  S.tries++;
  const msgs = res.map((r) => r.msg).filter(Boolean);
  const fb = $('#feedback');
  if (ok) {
    S.answered = true; S.revealed = true;
    $$('#left .ord').forEach((o) => o.classList.add('locked'));
    sound('ok');
    const sec = Math.round(ms / 100) / 10;
    const ev = S.events || {};
    const fast = sk.speed && sec <= sk.speed;
    let add = 0;
    if (firstTry) {
      S.okN++;
      add = S.mode === 'wrong' ? 2 : 1;
      if (fast) add++;
      if (S.sessionStreak >= 5 && S.sessionStreak % 5 === 0) { add += 2; combo(S.sessionStreak, $('#left')); }
      else if (S.sessionStreak === 3) combo(3, $('#left'));
      if (ev.justMastered) add += 10;
      if (ev.reviewPassed) add += 5;
    }
    const head = (S.tries > 1 ? '✓ 改对了！' : pick(['✓ 答对了！', '✓ 真棒！', '✓ 完全正确！', '✓ 漂亮！', '✓ 太厉害了！'])) + ` <span class="sec">${fast ? '⚡ ' : ''}用时 ${sec} 秒</span>`;
    fb.insertAdjacentHTML('beforeend', resultBox('good', S.sessionStreak >= 5 ? 'cheer' : 'happy', head, S.tries > 1 ? `<ol class="steps">${stepsHTML(p.steps)}</ol>` : ''));
    gain(add, btn);
    renderOps('next');
    refreshDots();
    checkRewards();
    if (ev.needSpeed) toast(`全对了！再快一点：目标每题 ${ev.needSpeed.target} 秒（现在约 ${ev.needSpeed.median} 秒）`, 3500);
    if (S.tries === 1 && P.settings.autoNext && !sk.process && !ev.justMastered && !ev.reviewPassed && !taskDone()) setTimeout(() => { if (S && S.problem === p && !S.chat.length) advance(); }, 900);
    else if (ev.justMastered || ev.reviewPassed || taskDone()) setTimeout(() => { if (S && S.problem === p) celebrate(ev); }, 500); // 半秒内已经离开这道题就不弹
  } else if (S.tries === 1) {
    sound('bad');
    $('#qcard').classList.remove('shake'); void $('#qcard').offsetWidth; $('#qcard').classList.add('shake');
    const hzWrong = p.answer.some((a, k) => a.kind === 'hanzi' && !res[k].ok);
    fb.insertAdjacentHTML('beforeend', resultBox('try', 'oops', '✗ 不对哦，再检查一下', msgs.length ? msgs.join('；') : hzWrong ? '看着浅色的字，按笔顺再写一遍错了的字。' : subj(sk) === 'yw' ? pick(['再读一遍题目，想想方法，改好再提交。', '标红的地方不对，改一改再提交。']) : pick(['红色的空填错了，改一改再提交。', '别着急，看看草稿哪一步算错了。', '再读一遍题目，改好再提交。'])));
    renderOps('retry');
    if (hzWrong && HP) HP.retry();
    refreshDots();
    checkRewards();
  } else {
    sound('bad');
    reveal(res);
  }
}

function reveal(res) {
  const p = S.problem;
  S.answered = true; S.revealed = true;
  if (S.firstOk === null) { // 没提交就看答案：算错一次
    S.firstOk = false; S.sessionStreak = 0;
    C.record(P, S.skill, { ok: false, ms: Date.now() - S.t0, target: S.target === 'free' ? 'master' : S.target }); C.addWrong(P, S.skill, p, '（直接看了答案）'); save();
  }
  $$('#feedback .result.try').forEach((x) => x.remove());
  const fb = $('#feedback');
  fb.insertAdjacentHTML('beforeend', resultBox('bad', 'think', `正确答案：${p.answer.map((a) => `<span class="ans">${a.label ? esc(a.label) + ' ' : ''}${C.answerHTML(a)}</span>`).join('　')}`, `<div class="muted" style="font-size:16px">看懂下面每一步，下一道一定行！</div><ol class="steps">${stepsHTML(p.steps)}</ol>`));
  p.answer.forEach((a, k) => { if (a.kind === 'choice') { $$(`#left .choice[data-k="${k}"] button`).forEach((b) => { if (b.dataset.v === a.value) b.classList.add('answer'); }); const sl = $(`#left .chslot[data-k="${k}"]`); if (sl) { sl.innerHTML = C.renderMarkup(a.value); sl.classList.remove('r-bad'); sl.classList.add('r-ok'); } } });
  $$('#left .ord').forEach((o) => o.classList.add('locked'));
  if (HP) HP.reveal();
  renderOps('next');
  refreshDots();
  if (P.settings.aiAuto && pad.hasInk() && subj(S.skill) !== 'yw') askAI('diagnose');
  setTimeout(() => $('#feedback .result.bad')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
}
function refreshDots() {
  const st = C.ss(P, S.skill.id), need = S.target === 'review' ? 3 : P.settings.streak;
  const d = $('.ph .dots'); if (d) d.innerHTML = Array.from({ length: need }, (_, i) => `<i class="${i < st.streak ? 'on' : ''}"></i>`).join('');
  const c = $('#streakChip'); if (c) c.textContent = `🔥 连对 ${st.streak}`;
}

function taskDone() {
  const st = C.ss(P, S.skill.id);
  if (S.mode === 'wrong' || S.mode === 'test') return false;
  if (S.target === 'master') return !!st.mastered;
  if (S.target === 'review') return st.streak >= 3 && st.due > Date.now();
  return false;
}
function celebrate(ev) {
  if (!S) return;
  const sk = S.skill;
  const hasNextTask = S.ti < S.tasks.length - 1;
  if (ev.justMastered) {
    sound('win'); confetti();
    const nextSk = skillsOf(sk.grade, sk.term).find((s) => s !== sk && !P.skills[s.id]?.mastered);
    modal(`<div class="mbig">${mascot('cheer', 120)}</div><h2>🏆 掌握了「${esc(sk.name)}」！</h2><p>连续答对 ${P.settings.streak} 题${sk.speed ? '，速度也达标了' : ''}，奖励 <b class="gold">10 颗星</b>。<br>过几天数数会提醒你复习，记得牢牢的。</p>
      <div class="row">${hasNextTask ? '<button class="btn pri" data-a="task">继续今日任务 →</button>' : nextSk && S.mode === 'drill' ? `<button class="btn pri" data-a="next">下一个：${esc(nextSk.name)} →</button>` : ''}<button class="btn" data-a="more">再巩固几道</button><button class="btn ghost" data-a="home">回首页</button></div>`,
    (o, close) => {
      o.querySelectorAll('button').forEach((b) => (b.onclick = () => {
        close();
        const a = b.dataset.a;
        if (a === 'task') { S.ti++; beginTask(); }
        else if (a === 'next') { startDrill([{ skill: nextSk, target: 'master' }], 'drill'); }
        else if (a === 'more') { S.target = 'free'; nextProblem(); }
        else exitPractice();
      }));
    });
  } else if (ev.reviewPassed || taskDone()) {
    sound('win');
    banner('✅', `复习通过「${sk.name}」`, '奖励 5 颗星，下次复习会隔得更久');
    if (hasNextTask) setTimeout(() => { S.ti++; beginTask(); }, 900);
    else finishSession();
  }
}
function advance() {
  if (!S) return;
  if (S.mode === 'test' || S.mode === 'wrong') {
    const task = S.tasks[S.ti];
    if (S.mode === 'wrong' && S.firstOk && S.taskCount === 1) { // 原题做对了，再做一道同类新题
      S.problem = genProblem(S.skill); S.tries = 0; S.firstOk = null; S.chat = []; S.revealed = false; S.answered = false; S.t0 = Date.now(); S.taskCount++;
      toast('原题做对了！再来一道同类的新题'); renderPractice(); return;
    }
    if (S.mode === 'wrong') {
      const w = P.wrong.find((x) => x.id === task.wrong.id);
      if (w && w.fixed >= 2) { C.dropWrong(P, (x) => x === w); R.stats(P).fixed++; save(); banner('🩹', '这道错题改正了！', '已移出错题本'); checkRewards(); }
    }
    if (S.ti < S.tasks.length - 1) { S.ti++; beginTask(); } else finishSession();
    return;
  }
  // 练习模式：任务完成就进下一个任务；单次最多 30 题，避免卡死在一个题型上
  if (taskDone()) { if (S.ti < S.tasks.length - 1) { S.ti++; beginTask(); } else finishSession(); return; }
  if (S.target !== 'free' && S.taskCount >= 30) {
    toast(`「${S.skill.name}」今天先练到这，明天接着练`, 3000);
    if (S.ti < S.tasks.length - 1) { S.ti++; beginTask(); return; }
    return finishSession();
  }
  nextProblem();
}
function finishSession() {
  stopTimer(); stopSpeak();
  if (S.mode === 'test') {
    const n = S.results.length, c = S.results.filter((r) => r.ok).length, sec = Math.round(S.results.reduce((a, r) => a + r.ms, 0) / 1000);
    if (c === n && n >= 10) gain(5);
    checkRewards();
    sound(c === n ? 'win' : 'ok'); if (c === n) confetti();
    modal(`<div class="mbig">${mascot(c === n ? 'cheer' : c / n >= 0.8 ? 'happy' : 'normal', 110)}</div><h2>${c} / ${n} 题正确 ${c === n ? '💯' : ''}</h2><p>用时 ${Math.floor(sec / 60)} 分 ${sec % 60} 秒 · 获得 <b class="gold">${S.stars || 0} ⭐</b>${c < n ? '<br>错的题已放进错题本：' : '<br>全对！太厉害了！'}</p>
      <div style="text-align:left;max-height:40vh;overflow:auto">${S.results.filter((r) => !r.ok).map((r) => `<div class="wrongitem"><div class="q">${C.renderMarkup(r.problem.q, () => '（ ）')}<div class="muted" style="font-size:16px">你的答案：${esc(r.given)} · 正确：${r.problem.answer.map((a) => esc(C.answerText(a))).join('；')}</div></div></div>`).join('')}</div>
      <div class="row">${c < n ? '<button class="btn pri" data-a="wrong">去订正错题</button>' : ''}<button class="btn" data-a="home">回首页</button></div>`,
    (o, close) => o.querySelectorAll('button').forEach((b) => (b.onclick = () => { close(); pad = null; b.dataset.a === 'wrong' ? showWrongBook() : showHome(); })));
    return;
  }
  sound('win');
  const msg = S.mode === 'today' ? '今日任务完成！' : S.mode === 'wrong' ? '错题都重做完了！' : '这一组练完了！';
  modal(`<div class="mbig">${mascot('cheer', 110)}</div><h2>🎉 ${msg}</h2>
    <div class="sumrow"><div><b>${S.count}</b><span>做题</span></div><div><b>${S.okN}</b><span>一次做对</span></div><div><b class="gold">${S.stars || 0}</b><span>获得 ⭐</span></div></div>
    <div class="row"><button class="btn pri" data-a="home">回首页</button></div>`,
  (o, close) => o.querySelector('button').onclick = () => { close(); exitPractice(); });
}

// ---------------- AI 老师 ----------------
async function askAI(mode, question) {
  const p = S.problem, sk = S.skill;
  const fb = $('#feedback');
  let box = $('#aibox');
  if (mode !== 'diagnose') { R.stats(P).aiAsks++; checkRewards(); }
  if (!box) {
    fb.insertAdjacentHTML('beforeend', `<div class="ai" id="aibox"><div class="who">${mascot('think', 40)} 数数老师</div><div id="aimsgs"></div><div class="askrow"><input id="askin" placeholder="还有哪里不懂？写下来问老师" autocomplete="off"><button class="btn purple" id="asksend">问</button></div></div>`);
    box = $('#aibox');
    const send = () => { const v = $('#askin').value.trim(); if (!v) return; $('#askin').value = ''; askAI('chat', v); };
    $('#asksend').onclick = send;
    $('#askin').addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  }
  const msgs = $('#aimsgs');
  if (question) msgs.insertAdjacentHTML('beforeend', `<div class="kidmsg">我：${esc(question)}</div>`);
  const holder = document.createElement('div'); holder.className = 'tmsg'; holder.textContent = { hint: '老师在想怎么提示你…', diagnose: '老师在看你的草稿…', review: '老师在检查你的过程…', explain: '老师换个方法讲…', chat: '老师在想…' }[mode];
  msgs.append(holder); box.classList.add('loading');
  holder.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  const image = pad.hasInk() && subj(sk) !== 'yw' ? pad.toDataURL() : null;
  const body = {
    mode, question,
    problem: {
      subject: subj(sk), grade: sk.grade, skillName: sk.name, tip: sk.tip,
      text: (p.say ? `（听写，读给孩子听的是：${p.say}）` : '') + C.plainText(p.q) + (p.fig ? '（题目有配图）' : '') + (p.answer.some((a, k) => !p.q.includes(`{${k}}`)) ? ' 要填：' + p.answer.map((a) => (a.label || '') + (a.unit ? `（${a.unit}）` : '')).join('、') : ''),
      answerText: p.answer.map(C.answerText).join('；'),
      steps: p.steps.map((s) => (typeof s === 'string' ? C.plainText(s) : s.pre)),
    },
    kid: { answerText: S.lastGiven, correct: S.firstOk === null ? undefined : S.firstOk, wrongCount: (C.ss(P, sk.id).recent || []).slice(-10).filter((x) => !x).length },
    history: S.chat.slice(-6), image,
  };
  if (mode === 'hint') delete body.kid.answerText;
  const prob = S.problem;
  try {
    const text = await aiRequest(body);
    if (!S || S.problem !== prob) return;
    holder.textContent = text;
    holder.insertAdjacentHTML('beforeend', ' <button class="say" title="读给我听">🔊</button>');
    $('.say', holder).onclick = () => speak(text, 1);
    if (question) S.chat.push({ role: 'kid', text: question });
    S.chat.push({ role: 'teacher', text });
  } catch (e) {
    holder.textContent = 'AI 老师暂时连不上：' + e.message;
  } finally { box.classList.remove('loading'); }
}

// ---------------- 口算挑战 ----------------
let CH = null;
const CH_SEC = 60;
function stopChallenge() { if (CH) { clearInterval(CH.timer); clearTimeout(CH.cd); CH = null; } }
const fitsCh = (p) => p.answer.length === 1 && p.answer[0].kind === 'num' && !p.fig && /\{0\}/.test(p.q) && !/<svg/.test(p.q);
const chOK = new Map();
function challengeable(sk) {
  if (!chOK.has(sk.id)) { let good = 0; for (let i = 0; i < 6; i++) { try { if (fitsCh(sk.gen(makeRng(i * 131 + 7)))) good++; } catch {} } chOK.set(sk.id, good >= 4); }
  return chOK.get(sk.id);
}
function challengePool() {
  const g = P.grade, t = P.term;
  let pool = SK.filter((s) => s.speed && (s.grade < g || (s.grade === g && s.term <= t)) && s.grade >= g - 2 && challengeable(s));
  if (!pool.length) pool = SK.filter((s) => s.speed && s.grade <= Math.max(g, 1) && challengeable(s));
  const cur = pool.filter((s) => s.grade === g && s.term === t);
  return { pool, cur };
}
function showChallenge() {
  leave();
  const st = R.stats(P), { pool } = challengePool();
  app.innerHTML = `<div class="page chpage">
    <div class="topbar"><button class="btn ghost" id="back">‹ 返回</button><h1>⚡ 口算挑战</h1></div>
    <div class="chstart">
      <div class="mbig">${mascot('cheer', 140)}</div>
      <h2>${CH_SEC} 秒，能答对几题？</h2>
      <p>题目从 ${pool.length} 个口算题型里随机出（${C.termName(P.grade, P.term)}及以前）。<br>写完自动判，对了马上下一题；连对有特效！</p>
      <div class="chbest"><div><b>${st.challengeBest || 0}</b><span>最好成绩</span></div><div><b>${st.challenges || 0}</b><span>挑战次数</span></div><div><b>${st.chLast ?? '-'}</b><span>上一次</span></div></div>
      <button class="btn warm bigbtn" id="chGo">开始挑战 ▶</button>
    </div></div>`;
  $('#back').onclick = showHome;
  $('#chGo').onclick = () => (pool.length ? countdown() : toast('这个年级还没有口算题型'));
}
function countdown() {
  const o = document.createElement('div'); o.className = 'overlay cd'; document.body.append(o);
  let n = 3;
  const tick = () => {
    if (n === 0) { o.remove(); sound('go'); return runChallenge(); }
    o.innerHTML = `<div class="cdn">${n}</div>`; sound('tick'); n--;
    countdown.t = setTimeout(tick, 750);
  };
  tick();
}
function runChallenge() {
  const { pool, cur } = challengePool();
  const kbd = P.settings.input === 'kbd', best = R.stats(P).challengeBest || 0;
  CH = { pool, cur, score: 0, combo: 0, n: 0, miss: [], end: Date.now() + CH_SEC * 1000, lock: false, lastQ: '' };
  app.innerHTML = `<div class="chrun">
    <div class="chtop">
      <button class="btn ghost" id="back">‹ 退出</button>
      <div class="chstat"><span>答对</span><b id="chScore">0</b></div>
      <div class="chtime" id="chTime"></div>
      <div class="chstat"><span>连对</span><b id="chCombo">0</b></div>
      <div class="chstat best"><span>最好</span><b>${best}</b></div>
    </div>
    <div class="chcard" id="chcard"><div class="chq" id="chq"></div><div class="chfb" id="chfb"></div></div>
    <div class="keypad big" id="keypad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', '⌫', '跳过'].map((k) => `<button class="${k.length > 1 || k === '⌫' ? 'fn' : ''}" data-k="${k}">${k}</button>`).join('')}</div>
  </div>`;
  $('#back').onclick = () => { stopChallenge(); showHome(); };
  $$('#keypad button').forEach((b) => (b.onclick = () => {
    const el = $('#chq input'); if (!el || CH?.lock) return;
    const k = b.dataset.k;
    if (k === '跳过') return chJudge(false);
    el.value = k === '⌫' ? el.value.slice(0, -1) : el.value + k;
    chInput();
  }));
  const draw = () => {
    if (!CH) return;
    const left = Math.max(0, CH.end - Date.now()) / 1000;
    const hot = left <= 10;
    $('#chTime').innerHTML = ring(left / CH_SEC, { size: 96, stroke: 10, color: hot ? '#e4572e' : '#ff7a45', track: hot ? '#fde0d8' : '#ffe6d6', label: String(Math.ceil(left)) });
    $('#chTime').classList.toggle('hot', hot);
    if (left <= 0) endChallenge();
  };
  CH.timer = setInterval(draw, 200); draw();
  chNext();
  void kbd;
}
function chNext() {
  if (!CH) return;
  let p = null, sk = null;
  for (let i = 0; i < 12 && !p; i++) {
    sk = CH.cur.length && Math.random() < 0.5 ? pick(CH.cur) : pick(CH.pool);
    try { const x = sk.gen(makeRng(seed())); if (fitsCh(x) && x.q !== CH.lastQ) p = x; } catch {}
  }
  if (!p) return endChallenge();
  CH.p = p; CH.sk = sk; CH.lastQ = p.q; CH.t0 = Date.now(); CH.lock = false;
  const im = P.settings.input === 'kbd' ? 'decimal' : 'none';
  $('#chq').innerHTML = C.renderMarkup(p.q, () => `<input class="blank chin" inputmode="${im}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">`);
  $('#chfb').innerHTML = '';
  const el = $('#chq input');
  el.addEventListener('input', chInput);
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); chJudge(C.gradeBlank(CH.p.answer[0], el.value, { grade: CH.sk.grade }).ok); } });
  if (im === 'decimal' || !matchMedia('(pointer: coarse)').matches) el.focus();
}
function chInput() {
  if (!CH || CH.lock) return;
  const el = $('#chq input'), v = el.value.replace(/\s/g, '');
  el.style.width = Math.max(2.6, v.length * 0.62 + 1.1) + 'em';
  if (!v) return;
  const a = CH.p.answer[0];
  if (C.gradeBlank(a, v, { grade: CH.sk.grade }).ok) chJudge(true);
  else if (v.length >= fmt(a.value).length) chJudge(false, v);
}
function chJudge(ok, given = '') {
  if (!CH || CH.lock) return;
  CH.lock = true; CH.n++;
  const ms = Date.now() - CH.t0, el = $('#chq input');
  const d = (P.days[C.today()] ||= { n: 0, c: 0, sec: 0, skills: {} });
  d.n++; if (ok) d.c++; d.sec += Math.min(ms, 60000) / 1000; d.ch = (d.ch || 0) + 1;
  if (ok) {
    CH.score++; CH.combo++;
    el.classList.add('right'); sound('ok');
    $('#chScore').textContent = CH.score; $('#chCombo').textContent = CH.combo;
    const sc = $('#chScore').parentElement; sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump');
    if (CH.combo % 5 === 0) combo(CH.combo, $('#chcard'));
    setTimeout(chNext, 160);
  } else {
    CH.combo = 0; $('#chCombo').textContent = 0;
    CH.miss.push({ q: CH.p.q, ans: C.answerText(CH.p.answer[0]), given: given || '跳过' });
    el.classList.add('wrong'); sound('bad');
    $('#chcard').classList.remove('shake'); void $('#chcard').offsetWidth; $('#chcard').classList.add('shake');
    $('#chfb').innerHTML = `正确答案是 <b>${esc(C.answerText(CH.p.answer[0]))}</b>`;
    setTimeout(chNext, 900);
  }
}
function endChallenge() {
  if (!CH) return;
  const { score, n, miss } = CH;
  stopChallenge();
  const st = R.stats(P), record = score > (st.challengeBest || 0);
  st.challenges = (st.challenges || 0) + 1; st.chLast = score;
  if (record) st.challengeBest = score;
  st.chHist = [...(st.chHist || []), { at: Date.now(), score, n }].slice(-30);
  const add = Math.ceil(score / 3) + (record && score >= 5 ? 5 : 0);
  S = { stars: 0 }; gain(add); const got = S.stars; S = null;
  checkRewards();
  sound('win'); if (record && score >= 5) confetti();
  modal(`<div class="mbig">${mascot(record ? 'cheer' : score >= 10 ? 'happy' : 'normal', 110)}</div>
    <h2>${record && st.challenges > 1 ? '🏆 新纪录！' : '时间到！'}答对 ${score} 题</h2>
    <p>一共 ${n} 题，正确率 ${n ? Math.round((score / n) * 100) : 0}% · 获得 <b class="gold">${got} ⭐</b>${!record ? `<br>最好成绩 ${st.challengeBest} 题，下次冲一冲！` : ''}</p>
    ${miss.length ? `<div class="chmiss">${miss.slice(0, 8).map((m) => `<div>${C.renderMarkup(m.q, () => `<b class="ok">${esc(m.ans)}</b>`)} <span class="muted">（写的 ${esc(m.given)}）</span></div>`).join('')}</div>` : ''}
    <div class="row"><button class="btn warm" data-a="again">再来一次</button><button class="btn" data-a="home">回首页</button></div>`,
  (o, close) => o.querySelectorAll('button').forEach((b) => (b.onclick = () => { close(); b.dataset.a === 'again' ? countdown() : showHome(); })));
}

// ---------------- 我的成就 ----------------
let calMonth = null;
function showMe() {
  leave();
  const st = R.stats(P), lv = R.levelOf(st.stars);
  const tot = Object.values(P.skills).reduce((a, s) => ({ n: a.n + s.n, c: a.c + s.c }), { n: 0, c: 0 });
  const mastered = Object.values(P.skills).filter((s) => s.mastered).length;
  const now = new Date(); calMonth ||= [now.getFullYear(), now.getMonth()];
  const tiles = [['📚', tot.n, '累计做题'], ['🎯', tot.n ? Math.round((tot.c / tot.n) * 100) + '%' : '-', '正确率'], ['🏅', mastered, '掌握题型'], ['🔥', streakDays(), '连续天数'], ['💥', st.bestStreak, '最长连对'], ['⚡', st.challengeBest || 0, '口算最佳']];
  app.innerHTML = `<div class="page me">
    <div class="topbar"><button class="btn ghost" id="back">‹ 返回</button><h1>🏅 我的成就</h1></div>
    <div class="mehero">
      <div class="mbig">${mascot('cheer', 110)}</div>
      <div class="mel">
        <div class="lvname"><span>${lv.icon}</span> Lv${lv.i} ${lv.name}</div>
        <div class="lvbig"><i style="width:${Math.round(lv.pct * 100)}%"></i></div>
        <div class="lvsub">⭐ <b>${st.stars}</b> 颗星${lv.next ? ` · 再攒 ${lv.next - st.stars} 颗升到「${R.LEVELS[lv.i][1]}」` : ' · 最高等级！'}</div>
      </div>
    </div>
    <div class="statgrid">${tiles.map(([i, v, l]) => `<div class="stat"><span>${i}</span><b>${v}</b><em>${l}</em></div>`).join('')}</div>
    <div class="panel"><h3>徽章墙 <span class="muted">${Object.keys(st.badges).length} / ${R.BADGES.length}</span></h3>
      <div class="badges">${R.BADGES.map((b) => { const at = st.badges[b.id]; return `<div class="badge ${at ? 'got' : ''}"><span class="bi">${b.icon}</span><b>${b.name}</b><em>${at ? new Date(at).toLocaleDateString('zh-CN') : b.desc}</em></div>`; }).join('')}</div></div>
    <div class="panel"><h3>打卡日历</h3><div id="cal"></div></div>
    <div class="panel"><h3>等级之路</h3><div class="ladder">${R.LEVELS.map(([s, n, ic], i) => `<div class="lstep ${i + 1 < lv.i ? 'done' : i + 1 === lv.i ? 'cur' : ''}"><span>${ic}</span><b>Lv${i + 1} ${n}</b><em>${s} ⭐</em></div>`).join('')}</div></div>
  </div>`;
  $('#back').onclick = showHome;
  drawCal();
}
function drawCal() {
  const [y, m] = calMonth, goal = P.settings.dailyGoal;
  const first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate(), pre = (first.getDay() + 6) % 7;
  const cells = Array.from({ length: pre }, () => '<div class="cd empty"></div>');
  let act = 0, hit = 0;
  for (let d = 1; d <= days; d++) {
    const k = C.today(new Date(y, m, d).getTime()), x = P.days[k];
    const lvl = !x?.n ? 0 : x.n >= goal ? 3 : x.n >= goal / 2 ? 2 : 1;
    if (x?.n) act++; if (lvl === 3) hit++;
    cells.push(`<div class="cd l${lvl} ${k === C.today() ? 'today' : ''}"><span>${d}</span>${x?.n ? `<em>${x.n} 题</em>` : ''}${lvl === 3 ? '<i>⭐</i>' : ''}</div>`);
  }
  $('#cal').innerHTML = `<div class="calhead"><button class="iconbtn" id="calPrev">‹</button><b>${y} 年 ${m + 1} 月</b><button class="iconbtn" id="calNext">›</button><span class="muted">本月练了 ${act} 天，完成目标 ${hit} 天</span></div>
    <div class="calgrid">${'一二三四五六日'.split('').map((w) => `<div class="cw">${w}</div>`).join('')}${cells.join('')}</div>`;
  $('#calPrev').onclick = () => { calMonth = m ? [y, m - 1] : [y - 1, 11]; drawCal(); };
  $('#calNext').onclick = () => { calMonth = m === 11 ? [y + 1, 0] : [y, m + 1]; drawCal(); };
}

// ---------------- 错题本 ----------------
function showWrongBook() {
  leave();
  const items = P.wrong.filter((w) => BY[w.skillId]);
  const groups = {};
  for (const w of items) (groups[w.skillId] ||= []).push(w);
  app.innerHTML = `<div class="page">
    <div class="topbar"><button class="btn ghost" id="back">‹ 返回</button><h1>📕 错题本</h1><div class="grow"></div>${items.length ? '<button class="btn pri" id="redoAll">全部重做（最多 15 道）</button>' : ''}</div>
    <p class="muted" style="font-size:17px;margin-top:-6px">重做时原题做对后还要再做对一道同类新题；连续两次做对就移出错题本。订正一道得 2 颗星。</p>
    ${items.length ? Object.entries(groups).map(([id, ws]) => `<div class="panel"><h3>${esc(BY[id].name)} <span class="muted" style="font-size:15px;font-weight:500">${C.termName(BY[id].grade, BY[id].term)} · ${ws.length} 道</span></h3>
      ${ws.map((w) => `<div class="wrongitem"><div class="q">${C.renderMarkup(w.problem.q, () => '（ ）')}<div class="muted" style="font-size:15px">当时答：${esc(w.given)} · ${new Date(w.at).toLocaleDateString('zh-CN')}${w.fixed ? ` · 已做对 ${w.fixed} 次` : ''}</div></div><button class="btn" data-redo="${w.id}">重做</button><button class="btn ghost" data-del="${w.id}">移出</button></div>`).join('')}</div>`).join('') : `<div class="empty">${mascot('happy', 110)}<div>错题本是空的，太棒了！</div></div>`}
  </div>`;
  $('#back').onclick = showHome;
  const start = (ws) => startDrill(ws.map((w) => ({ skill: BY[w.skillId], target: 'master', problem: w.problem, wrong: w })), 'wrong');
  if ($('#redoAll')) $('#redoAll').onclick = () => start(items.slice(0, 15));
  $$('[data-redo]').forEach((b) => (b.onclick = () => start([P.wrong.find((w) => w.id === b.dataset.redo)])));
  $$('[data-del]').forEach((b) => (b.onclick = () => { C.dropWrong(P, (w) => w.id === b.dataset.del); save(); showWrongBook(); }));
}

// ---------------- 综合测验 ----------------
function chooseTest() {
  const g = P.grade, t = P.term;
  const term = skillsOf(g, t), practiced = term.filter((s) => P.skills[s.id]?.n);
  const before = subjSK().filter((s) => (s.grade < g || (s.grade === g && s.term < t)) && P.skills[s.id]?.n);
  modal(`<div class="mbig">${mascot('normal', 90)}</div><h2>📝 ${SUBJECTS[curSubject()].name}综合测验</h2><p>从题型里随机出题，做完统一看对错，错题自动进错题本。全对再奖 5 颗星！</p>
    <div class="row"><div class="seg" id="tscope"><button data-s="practiced" class="on">练过的（${practiced.length} 个题型）</button><button data-s="term">本册全部（${term.length}）</button>${before.length ? `<button data-s="review">以前学的（${before.length}）</button>` : ''}</div></div>
    <div class="row"><div class="seg" id="tcount"><button data-n="10" class="on">10 题</button><button data-n="20">20 题</button><button data-n="30">30 题</button></div></div>
    <div class="row"><button class="btn pri" id="tgo">开始</button><button class="btn ghost" id="tx">取消</button></div>`,
  (o, close) => {
    let scope = 'practiced', n = 10;
    $$('#tscope button', o).forEach((b) => (b.onclick = () => { $$('#tscope button', o).forEach((x) => x.classList.remove('on')); b.classList.add('on'); scope = b.dataset.s; }));
    $$('#tcount button', o).forEach((b) => (b.onclick = () => { $$('#tcount button', o).forEach((x) => x.classList.remove('on')); b.classList.add('on'); n = +b.dataset.n; }));
    $('#tx', o).onclick = close;
    $('#tgo', o).onclick = () => {
      let pool = scope === 'term' ? term : scope === 'review' ? before : practiced;
      if (!pool.length) pool = term;
      if (!pool.length) return toast('这一册还没有题型');
      close();
      const tasks = Array.from({ length: n }, (_, i) => ({ skill: pool[(i + Math.floor(Math.random() * pool.length)) % pool.length], target: 'test' }));
      tasks.sort(() => Math.random() - 0.5);
      startDrill(tasks, 'test');
    };
  });
}

// ---------------- 家长 ----------------
async function showParent() {
  leave();
  const st = P.settings;
  const days = Array.from({ length: 14 }, (_, i) => { const t = Date.now() - (13 - i) * C.DAY; return { k: C.today(t), d: P.days[C.today(t)] || { n: 0, c: 0, sec: 0 } }; });
  const maxN = Math.max(1, ...days.map((x) => x.d.n));
  const tot = Object.values(P.skills).reduce((a, s) => ({ n: a.n + s.n, c: a.c + s.c }), { n: 0, c: 0 });
  const practiced = SK.filter((s) => P.skills[s.id]?.n).sort((a, b) => (P.skills[b.id].last || 0) - (P.skills[a.id].last || 0));
  const weak = practiced.filter((s) => P.skills[s.id].n >= 5 && C.accuracy(P.skills[s.id], 10) < 0.7);
  const avg = (s) => { const t = P.skills[s.id].times; return t.length ? (t.reduce((a, b) => a + b, 0) / t.length).toFixed(1) + ' 秒' : '-'; };
  const aiNow = await aiStatus();
  const ac = AIC || { preset: 'ark', ...PRESETS.ark, apiKey: '', vision: true };
  const segBtns = (name, opts, cur) => `<div class="seg" data-set="${name}">${opts.map(([v, l]) => `<button data-v="${v}" class="${String(cur) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const mins = Math.round(days.reduce((a, x) => a + (x.d.sec || 0), 0) / 60);
  app.innerHTML = `<div class="page">
    <div class="topbar"><button class="btn ghost" id="back">‹ 返回</button><h1>⚙️ 家长</h1></div>
    <div class="panel"><h3>最近 14 天</h3>
      <div class="muted">累计做题 ${tot.n} 道，正确率 ${tot.n ? Math.round((tot.c / tot.n) * 100) : 0}%；已掌握 ${Object.values(P.skills).filter((s) => s.mastered).length} 个题型；错题本 ${P.wrong.length} 道；近 14 天练了约 ${mins} 分钟；星星 ${R.stats(P).stars} 颗。</div>
      <div class="bars" style="margin:14px 0 26px">${days.map((x) => `<div class="${x.d.goal ? 'goal' : ''}" style="height:${(x.d.n / maxN) * 100}%;opacity:${x.d.n ? 1 : 0.25}" title="${x.k}">${x.d.n ? `<b>${x.d.n}</b>` : ''}<span>${x.k.slice(5)}</span></div>`).join('')}</div>
    </div>
    ${weak.length ? `<div class="panel"><h3>需要关注（最近 10 题正确率低于 70%）</h3>${weak.map((s) => `<span class="chip" style="margin:4px">${esc(s.name)} · ${Math.round(C.accuracy(P.skills[s.id], 10) * 100)}%</span>`).join('')}</div>` : ''}
    <div class="panel"><h3>设置</h3>
      <div class="set"><div class="k">孩子的名字</div><input type="text" id="kidname" value="${esc(P.name)}"></div>
      <div class="set"><div class="k">每日目标<div>首页圆环和打卡日历按这个算，完成奖励 5 颗星</div></div>${segBtns('dailyGoal', [[10, '10 题'], [20, '20 题'], [30, '30 题'], [50, '50 题']], st.dailyGoal)}</div>
      <div class="set"><div class="k">掌握标准<div>连续答对几题算掌握（口算题还要达到目标速度）</div></div>${segBtns('streak', [[3, '3 题'], [5, '5 题'], [8, '8 题'], [10, '10 题']], st.streak)}</div>
      <div class="set"><div class="k">自动读题<div>用 iPad 的中文语音读题；自动模式只给一二年级的非口算题读</div></div>${segBtns('readAloud', [['auto', '一二年级自动'], ['on', '总是读'], ['off', '不读']], st.readAloud)}</div>
      <div class="set"><div class="k">答对后自动下一题<div>应用题不会自动跳，留时间看过程</div></div>${segBtns('autoNext', [[true, '开'], [false, '关']], st.autoNext)}</div>
      <div class="set"><div class="k">答错时 AI 老师自动看草稿<div>草稿纸上有字时，自动把草稿发给 AI 找错因</div></div>${segBtns('aiAuto', [[true, '开'], [false, '关']], st.aiAuto)}</div>
      <div class="set"><div class="k">输入方式<div>手写：用 Apple Pencil 直接在格子里写数字（需打开 iPad 设置 → Apple Pencil → 随手写），也可点屏幕上的数字键</div></div>${segBtns('input', [['pad', '手写 + 数字键'], ['kbd', '系统键盘']], st.input)}</div>
      <div class="set"><div class="k">声音</div>${segBtns('sound', [[true, '开'], [false, '关']], st.sound)}</div>
    </div>
    <div class="panel"><h3>AI 老师</h3>
      <div class="muted" style="font-size:16px">现在用的：<b>${esc(aiNow)}</b><br>填上买的模型接口后，iPad 直接连模型，不需要 Mac。密钥只存在这台 iPad 上，不会出现在导出的进度里。看草稿要选能看图的模型。</div>
      <div class="set"><div class="k">接口</div><div class="seg" id="aiPreset">${Object.entries(PRESETS).map(([k, v]) => `<button data-p="${k}" class="${ac.preset === k ? 'on' : ''}">${v.label}</button>`).join('')}</div></div>
      <div class="set"><div class="k">接口地址</div><input type="text" class="wide" id="aiBase" value="${esc(ac.baseURL)}" placeholder="https://…" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
      <div class="set"><div class="k">API Key</div><input type="password" class="wide" id="aiKey" value="${esc(ac.apiKey)}" placeholder="粘贴买到的 Key" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
      <div class="set"><div class="k">模型<div id="aiTip">${esc(PRESETS[ac.preset]?.modelTip || '')}</div></div><input type="text" class="wide" id="aiModel" value="${esc(ac.model)}" placeholder="模型名" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
      <div class="set"><div class="k">能看图<div>不能看图的模型选「不能」，就只发文字</div></div><div class="seg" id="aiVision"><button data-v="1" class="${ac.vision !== false ? 'on' : ''}">能</button><button data-v="0" class="${ac.vision === false ? 'on' : ''}">不能</button></div></div>
      <div class="set"><button class="btn pri" id="aiSave">保存</button><button class="btn" id="aitest">测试一下</button>${AIC ? '<button class="btn ghost" id="aiClear" style="color:var(--bad)">清除</button>' : ''}</div>
      <div id="aitestout" class="muted" style="font-size:16px;white-space:pre-wrap"></div>
    </div>
    <div class="panel"><h3>云端同步</h3>
      <div class="muted" style="font-size:16px">进度、错题本、星星自动存到你的 GitHub 私有仓库：换 iPad、清了 Safari 数据也不会丢，几台设备共用一份进度。令牌只存在这台设备上，不会出现在导出的进度里。</div>
      <div class="set"><div class="k">状态</div><div id="clState">${cloudStateText()}</div></div>
      <div class="set"><div class="k">仓库</div><input type="text" class="wide" id="clRepo" value="${esc(CL.cfg()?.repo || CL.DEFAULT_REPO)}" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
      <div class="set"><div class="k">令牌<div>GitHub 上生成的 fine-grained token：只选这个仓库，Contents 给 Read and write</div></div><input type="password" class="wide" id="clToken" value="${esc(CL.cfg()?.token || '')}" placeholder="github_pat_…" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
      <div class="set"><button class="btn pri" id="clSave">保存并同步</button>${CL.cfg() ? '<button class="btn" id="clNow">立即同步</button><button class="btn ghost" id="clOff" style="color:var(--bad)">关闭同步</button>' : ''}</div>
    </div>
    <div class="panel"><h3>练过的题型（${practiced.length}）</h3>
      <table><tr><th>题型</th><th>科目</th><th>年级</th><th>状态</th><th>做题</th><th>近 20 题正确率</th><th>平均用时</th><th>最近</th></tr>
      ${practiced.map((s) => { const x = P.skills[s.id]; return `<tr><td>${esc(s.name)}</td><td>${SUBJECTS[subj(s)].name}</td><td>${C.termName(s.grade, s.term)}</td><td>${statusLabel[C.status(P, s)] || ''}</td><td>${x.n}</td><td>${Math.round(C.accuracy(x) * 100)}%</td><td>${avg(s)}</td><td>${new Date(x.last).toLocaleDateString('zh-CN')}</td></tr>`; }).join('')}
      </table>${practiced.length ? '' : '<p class="muted">还没开始练</p>'}
    </div>
    <div class="panel"><h3>题库</h3><p class="muted">数学：${GRADES_LOADED.map((g) => C.GRADE_CN[g] + '年级').join('、') || '无'}，共 ${subjSK('math').length} 个题型；语文：${subjSK('yw').length} 个题型（${[...new Set(subjSK('yw').map((s) => s.unit))].sort((a, b) => YW_UNITS.indexOf(a) - YW_UNITS.indexOf(b)).join('、') || '还没有'}）。</p>
      <p class="muted" style="font-size:15px">${CL.cfg() ? '进度存在这台 iPad 上，并同步到云端。导入备份、清空进度也会同步到其他设备。' : '进度存在这台 iPad 上。没开云端同步时，隔一阵导出一份备份；换 iPad 或清了 Safari 数据后用「导入备份」恢复。'}</p>
      <button class="btn" id="export">导出备份</button> <button class="btn" id="import">导入备份</button><input type="file" id="importFile" accept=".json,application/json" hidden> <button class="btn ghost" id="reset" style="color:var(--bad)">清空所有进度</button></div>
  </div>`;
  $('#back').onclick = showHome;
  $('#kidname').onchange = (e) => { P.name = e.target.value.trim() || '小朋友'; save(); };
  $$('[data-set]').forEach((seg) => $$('button', seg).forEach((b) => (b.onclick = () => {
    let v = b.dataset.v; v = v === 'true' ? true : v === 'false' ? false : /^\d+$/.test(v) ? +v : v;
    P.settings[seg.dataset.set] = v; save(); showParent();
  })));
  let preset = ac.preset, vision = ac.vision !== false;
  $$('#aiPreset button').forEach((b) => (b.onclick = () => {
    preset = b.dataset.p; const pr = PRESETS[preset];
    $$('#aiPreset button').forEach((x) => x.classList.toggle('on', x === b));
    $('#aiBase').value = pr.baseURL; if (pr.model || !$('#aiModel').value) $('#aiModel').value = pr.model; $('#aiTip').textContent = pr.modelTip || '';
  }));
  $$('#aiVision button').forEach((b) => (b.onclick = () => { vision = b.dataset.v === '1'; $$('#aiVision button').forEach((x) => x.classList.toggle('on', x === b)); }));
  const formAIC = () => ({ preset, kind: PRESETS[preset].kind, baseURL: $('#aiBase').value.trim(), apiKey: $('#aiKey').value.trim(), model: $('#aiModel').value.trim(), vision });
  $('#aiSave').onclick = () => { const c = formAIC(); if (!c.apiKey || !c.model || !c.baseURL) return toast('接口地址、Key、模型都要填'); AIC = c; saveAIC(); toast('已保存'); showParent(); };
  if ($('#aiClear')) $('#aiClear').onclick = () => { if (confirm('清除这台 iPad 上保存的 AI 接口？')) { AIC = null; saveAIC(); showParent(); } };
  $('#aitest').onclick = async () => {
    const out = $('#aitestout'); out.textContent = '正在问 AI 老师…'; const t0 = Date.now();
    const c = formAIC(), keep = AIC;
    if (c.apiKey) AIC = c; // 用表单里的值试，不用先保存
    try {
      const text = await aiRequest({ mode: 'chat', question: '老师好，用一句话鼓励我好好学习。', problem: { grade: P.grade, skillName: '测试' } });
      out.textContent = text + `\n（${((Date.now() - t0) / 1000).toFixed(1)} 秒）`;
    } catch (e) { out.textContent = '没连上：' + e.message + (/Failed to fetch|Load failed|NetworkError/.test(e.message) ? '\n（这个接口可能不允许浏览器直连，或者网络不通）' : ''); }
    finally { AIC = keep; }
  };
  $('#clSave').onclick = async () => {
    const c = { repo: $('#clRepo').value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$|\/$/g, ''), token: $('#clToken').value.trim() };
    if (!/^[\w.-]+\/[\w.-]+$/.test(c.repo) || !c.token) return toast('仓库（用户名/仓库名）和令牌都要填');
    const keep = CL.cfg(); CL.setCfg(c); CL_.known = false; CL_.err = ''; $('#clState').textContent = '正在同步…';
    await cloudSync();
    if (CL_.err) { CL.setCfg(keep); $('#clState').innerHTML = `<b style="color:var(--bad)">没连上：${esc(CL_.err)}</b>`; return; }
    toast('已开启云端同步'); showParent();
  };
  if ($('#clNow')) $('#clNow').onclick = async () => { CL_.known = false; $('#clState').textContent = '正在同步…'; await cloudSync(); showParent(); };
  if ($('#clOff')) $('#clOff').onclick = () => { if (confirm('关闭云端同步？这台设备上的令牌会删掉，云端已经存的进度不动。')) { CL.setCfg(null); CL_.err = ''; CL_.at = 0; showParent(); } };
  $('#import').onclick = () => $('#importFile').click();
  $('#importFile').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!d || typeof d !== 'object' || !d.skills || !d.days) throw new Error('不是数学小教练的备份文件');
      if (!confirm(`用备份覆盖现在的进度？\n备份里做过 ${Object.values(d.skills).reduce((a, x) => a + (x.n || 0), 0)} 题、⭐ ${d.stats?.stars || 0}`)) return;
      const n = C.newProgress(); P = { ...n, ...d, settings: { ...n.settings, ...(d.settings || {}) }, epoch: Date.now() }; R.stats(P); homeView = null; save(); toast('已恢复'); showParent();
    } catch (err) { toast('导入失败：' + err.message, 3500); }
  };
  $('#export').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(P, null, 1)], { type: 'application/json' })); a.download = `数学小教练备份-${C.today()}.json`; a.click(); };
  $('#reset').onclick = () => { if (confirm('确定清空所有做题记录、星星、徽章和错题本吗？不能恢复。')) { const keep = { name: P.name, grade: P.grade, term: P.term, settings: P.settings }; P = { ...C.newProgress(), ...keep, epoch: Date.now() }; R.stats(P); save(); showParent(); } };
}

// ---------------- 启动 ----------------
window.__mc = { get S() { return S; }, get SK() { return SK; }, get P() { return P; }, get CH() { return CH; }, get HP() { return HP; }, get homeView() { return homeView; }, get CL_() { return CL_; }, startDrill, showHome, showMe, showParent, showChallenge, runChallenge, endChallenge, cloudSync }; // 自动化测试用

(async () => {
  try { navigator.storage?.persist?.(); } catch {}
  if (window.MC_STATIC && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch((e) => console.warn('离线缓存没注册上：', e.message));
  await Promise.all([loadContent(), loadProgress()]);
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  showHome();
  if (CL.cfg()) cloudSync();
})();
