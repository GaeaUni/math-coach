// 语文专用的答题组件：写字格（Hanzi Writer 逐笔判）和排序卡片
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------------- 笔顺数据 ----------------
// content/hanzi/index.json：{ 字: 分包名 }；content/hanzi/<分包>.json：{ 字: 数据 }。都会被离线缓存。
let hwReady = null, hzIndex = null;
const packs = {};
function loadWriter() {
  if (window.HanziWriter) return Promise.resolve();
  return (hwReady ||= new Promise((ok, bad) => {
    const s = document.createElement('script');
    s.src = new URL('./vendor/hanzi-writer.min.js', import.meta.url).href;
    s.onload = ok; s.onerror = () => { hwReady = null; bad(new Error('写字组件没加载上')); };
    document.head.append(s);
  }));
}
const contentURL = (p) => new URL(`../content/hanzi/${p}`, import.meta.url).href;
export async function charData(c) {
  hzIndex ||= fetch(contentURL('index.json')).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  const pack = (await hzIndex)[c];
  if (pack) {
    packs[pack] ||= fetch(contentURL(pack + '.json')).then((r) => r.json()).catch((e) => { delete packs[pack]; throw e; });
    const d = (await packs[pack])[c];
    if (d) return d;
  }
  // 题库外的字：联网时从 CDN 取
  const r = await fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${encodeURIComponent(c)}.json`);
  if (!r.ok) throw new Error('没有「' + c + '」的笔顺数据');
  return r.json();
}
/** 进入有写字题的页面前预热 */
export function preload(chars) { loadWriter().then(() => [...new Set(chars)].forEach((c) => charData(c).catch(() => {}))).catch(() => {}); }

// ---------------- 写字格 ----------------
// 题目里每个 hanzi 答案空的每个字是一个「格」，在右边的大田字格里一个一个写。
export class HanziPad {
  /** host：右栏容器；blanks：[{k, value}]；opts.onChange()：写完一个字；opts.onDone()：全部写完 */
  constructor(host, blanks, opts = {}) {
    this.host = host; this.opts = opts;
    this.slots = blanks.flatMap(({ k, value }) => [...value].map((ch, i) => ({ k, i, ch, done: false, fail: false, text: '' })));
    this.cur = 0; this.writer = null; this.outline = false;
    host.innerHTML = `<div class="wpane">
      <div class="whead"><span class="t">✍️ 写字格</span><span class="wprog"></span><div class="grow"></div>
        <button class="tool" data-w="anim" title="不会写：看一遍笔顺（这个字算错）">👀 看笔顺</button>
        <button class="tool" data-w="redo" title="重写这个字">↺ 重写</button></div>
      <div class="wgridbox"><div class="wgrid"></div></div>
      <div class="wcells">${this.slots.map((s, j) => `<button class="wcell" data-j="${j}"></button>`).join('')}</div>
      <div class="wtip">用 Apple Pencil 一笔一笔写，<b>笔顺要对</b>；一笔连错 3 次会提示，这个字就算错</div>
    </div>`;
    this.grid = host.querySelector('.wgrid');
    host.querySelector('[data-w=anim]').onclick = () => this.showStrokes();
    host.querySelector('[data-w=redo]').onclick = () => this.go(this.cur);
    host.querySelectorAll('.wcell').forEach((b) => (b.onclick = () => { if (!this.locked) this.go(+b.dataset.j); }));
    this.ro = new ResizeObserver(() => { const s = this.size(); if (this.writer && Math.abs(s - this.lastSize) > 24) this.go(this.cur, true); });
    this.ro.observe(this.grid.parentElement);
    loadWriter().then(() => this.go(0)).catch((e) => this.fallback(e));
  }
  size() { const b = this.grid.parentElement.getBoundingClientRect(); return Math.max(160, Math.min(b.width - 24, b.height - 24, 360)); }
  get done() { return this.slots.every((s) => s.done); }
  /** 某个答案空写出的结果（给判分用） */
  value(k) { const ss = this.slots.filter((s) => s.k === k); return { text: ss.every((s) => s.done) ? ss.map((s) => s.text).join('') : '', fails: ss.filter((s) => s.fail).length }; }
  paint() {
    const s = this.slots[this.cur];
    this.host.querySelector('.wprog').textContent = this.done ? '都写完了' : `第 ${this.cur + 1} / ${this.slots.length} 个字`;
    this.host.querySelectorAll('.wcell').forEach((b, j) => { const x = this.slots[j]; b.textContent = x.done ? x.text : ''; b.className = `wcell ${j === this.cur && !this.done ? 'cur' : ''} ${x.done ? (x.fail ? 'fail' : 'ok') : ''}`; });
    this.opts.onPaint?.(this.slots, this.done ? -1 : this.cur, s);
  }
  async go(j, keepFail = false) {
    if (this.locked && !keepFail) return;
    this.cur = Math.max(0, Math.min(j, this.slots.length - 1));
    const s = this.slots[this.cur];
    if (!keepFail && s.done) { s.done = false; s.text = ''; }
    this.busy = false;
    this.paint();
    this.writer?.cancelQuiz?.(); this.grid.innerHTML = '';
    const size = (this.lastSize = this.size());
    this.grid.style.width = this.grid.style.height = size + 'px';
    const token = (this.token = {});
    const w = window.HanziWriter.create(this.grid, s.ch, {
      width: size, height: size, padding: Math.round(size * 0.07), renderer: 'svg',
      showCharacter: false, showOutline: this.outline || s.fail,
      strokeColor: '#1d2433', outlineColor: '#d9deea', drawingColor: '#2f5bd8', drawingWidth: Math.max(14, size / 16),
      highlightColor: '#ff9f1c', highlightCompleteColor: '#22b07d', strokeAnimationSpeed: 1.3, delayBetweenStrokes: 200,
      leniency: 1.3, showHintAfterMisses: 3, markStrokeCorrectAfterMisses: 4,
      charDataLoader: (c, onLoad, onErr) => { charData(c).then(onLoad, onErr); },
      onLoadCharDataError: (e) => { if (this.token === token) this.fallback(e); },
    });
    this.writer = w;
    w.quiz({
      onMistake: (d) => { if (d.mistakesOnStroke >= 3) s.fail = true; this.opts.onMistake?.(); },
      onComplete: () => {
        if (this.token !== token) return;
        s.done = true; s.text = s.ch;
        this.paint(); this.opts.onChange?.();
        const next = this.slots.findIndex((x, i) => i > this.cur && !x.done) >= 0 ? this.slots.findIndex((x, i) => i > this.cur && !x.done) : this.slots.findIndex((x) => !x.done);
        if (next >= 0) setTimeout(() => { if (this.token === token) this.go(next); }, 450);
        else setTimeout(() => this.opts.onDone?.(), 250);
      },
    });
  }
  /** 不会写：动画演示一遍，这个字算错，然后描红再写 */
  showStrokes() {
    if (this.locked || !this.writer) return;
    const s = this.slots[this.cur]; s.fail = true; this.busy = true;
    const w = this.writer, token = (this.token = {});
    w.cancelQuiz(); w.showCharacter();
    w.animateCharacter({ onComplete: () => { if (this.token === token) setTimeout(() => { if (this.token === token) this.go(this.cur, true); }, 500); } });
  }
  /** 第一次写错后：错的字描红再写一遍 */
  retry() { this.locked = false; this.outline = true; this.slots.forEach((s) => { if (s.fail) { s.done = false; s.text = ''; } }); const j = this.slots.findIndex((s) => !s.done); if (j >= 0) this.go(j); }
  /** 看答案：把每个字的正确写法动画演示 */
  reveal() {
    this.locked = true; this.token = {};
    this.slots.forEach((s) => { if (!s.done) { s.text = s.ch; } });
    this.paint();
    const wrong = this.slots.findIndex((s) => s.fail || !s.done);
    this.cur = wrong >= 0 ? wrong : 0;
    const s = this.slots[this.cur];
    this.writer?.cancelQuiz?.(); this.grid.innerHTML = '';
    if (!window.HanziWriter) return;
    const size = this.size();
    const w = window.HanziWriter.create(this.grid, s.ch, { width: size, height: size, padding: Math.round(size * 0.07), showCharacter: false, showOutline: true, strokeColor: '#e4572e', outlineColor: '#d9deea', strokeAnimationSpeed: 1.2, delayBetweenStrokes: 250, charDataLoader: (c, ok, bad) => { charData(c).then(ok, bad); } });
    this.writer = w; w.loopCharacterAnimation?.();
    this.host.querySelector('.wprog').textContent = `「${s.ch}」的笔顺`;
  }
  /** 笔顺数据加载不上（离线又没缓存）：改成输入框 */
  fallback(e) {
    console.warn(e);
    this.host.querySelector('.wgridbox').innerHTML = `<div class="wfall">这台 iPad 现在拿不到笔顺数据（${esc(e.message || e)}）。<br>请用 Apple Pencil 在下面的框里写字：<br><input class="blank hzfall" autocomplete="off" autocorrect="off" spellcheck="false"></div>`;
    const inp = this.host.querySelector('.hzfall');
    inp.addEventListener('change', () => { let t = [...inp.value.replace(/\s/g, '')]; this.slots.forEach((s, j) => { s.text = t[j] || ''; s.done = !!s.text; }); this.paint(); if (this.done) this.opts.onDone?.(); });
  }
  /** 自动化测试：直接按正确答案写完 */
  solve(fails = 0) { this.token = {}; this.slots.forEach((s, j) => { s.done = true; s.text = s.ch; s.fail = j < fails; }); this.paint(); this.opts.onDone?.(); }
  destroy() { this.token = {}; this.ro?.disconnect(); this.writer?.cancelQuiz?.(); }
}

// ---------------- 排序卡片 ----------------
const sameOrder = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
/** 打乱成和所有正确顺序都不同的样子 */
export function shuffled(a) {
  const ok = [a.value, ...(a.alts || [])];
  const idx = a.value.map((_, i) => i);
  for (let t = 0; t < 30; t++) {
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    const cand = idx.map((i) => a.value[i]);
    if (!ok.some((o) => sameOrder(o, cand))) break;
  }
  return [...idx];
}
export function orderHTML(a, k) {
  const idx = shuffled(a);
  return `<span class="ord" data-k="${k}"><span class="oline" data-ph="点下面的卡片，按顺序排好"></span><span class="obank">${idx.map((i) => `<button class="ocard" data-i="${i}">${esc(a.value[i])}</button>`).join('')}</span></span>`;
}
/** 点卡片：下面 → 上面排到末尾；上面 → 退回下面 */
export function bindOrder(root, onChange) {
  root.querySelectorAll('.ord').forEach((o) => {
    const line = o.querySelector('.oline'), bank = o.querySelector('.obank');
    o.addEventListener('click', (e) => {
      const b = e.target.closest('.ocard'); if (!b || o.classList.contains('locked')) return;
      (b.parentElement === bank ? line : bank).append(b);
      o.classList.remove('r-ok', 'r-bad');
      onChange?.(o, !bank.querySelector('.ocard'));
    });
  });
}
export const orderValue = (root, k, a) => [...root.querySelectorAll(`.ord[data-k="${k}"] .oline .ocard`)].map((b) => a.value[+b.dataset.i]);
