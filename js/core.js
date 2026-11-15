// 题目渲染、判分、掌握度和今日计划（无 DOM 依赖的部分）
import { fmt, fix, gcd } from './lib.js';

// ---------- 标记渲染 ----------
const escHTML = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fracHTML = (n, d) => `<span class="frac"><span class="fn">${n}</span><span class="fd">${d}</span></span>`;
/** [[春天|chūn tiān]] → 每个字上方注音 */
const rubyHTML = (hz, py) => { const cs = [...hz], ps = py.trim().split(/\s+/); return `<span class="py">${cs.map((c, i) => `<ruby>${c}<rt>${ps[i] ?? ''}</rt></ruby>`).join('')}</span>`; };
const RUBY = /\[\[([^|\]]+)\|([^\]]+)\]\]/g;

/** 题干 / 讲解标记 → HTML。blank(k) 返回第 k 个答题空的 HTML */
export function renderMarkup(text, blank) {
  const svgs = [];
  let s = String(text).replace(/<svg[\s\S]*?<\/svg>/g, (m) => { svgs.push(m); return `\u0000${svgs.length - 1}\u0000`; });
  s = escHTML(s)
    .replace(/\{\{\s*(-?\d+)\s+(\d+)\/(\d+)\s*\}\}/g, (_, w, n, d) => `<span class="mixed">${w}${fracHTML(n, d)}</span>`)
    .replace(/\{\{\s*(-?\d+)\/(\d+)\s*\}\}/g, (_, n, d) => fracHTML(n, d))
    .replace(RUBY, (_, hz, py) => rubyHTML(hz, py))
    .replace(/\*\*(.+?)\*\*/g, (_, x) => { const t = x.replace(/<rt>.*?<\/rt>/g, '').replace(/<[^>]+>/g, ''), n = (t.match(/\p{Script=Han}/gu) || []).length; return `<b class="${!n ? 'em-no' : n > 4 ? 'em-line' : 'em-dot'}">${x}</b>`; })
    .replace(/\n/g, '<br>');
  if (blank) s = s.replace(/\{(\d+)\}/g, (_, k) => blank(+k));
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => svgs[+i]);
}

/** 纯文字（给 AI 看）：分数写成 a/b，答题空写成（ ） */
export function plainText(text) {
  return String(text).replace(/<svg[\s\S]*?<\/svg>/g, '[图]')
    .replace(/\{\{\s*(-?\d+)\s+(\d+)\/(\d+)\s*\}\}/g, '$1又$2/$3')
    .replace(/\{\{\s*(-?\d+)\/(\d+)\s*\}\}/g, '$1/$2')
    .replace(RUBY, '$1（$2）')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\{(\d+)\}/g, '（ ）');
}

export function answerText(a) {
  const pre = a.label ? a.label + '：' : '';
  switch (a.kind) {
    case 'num': return pre + fmt(a.value) + (a.unit || '');
    case 'frac': { const [n, d] = a.value; if (a.mixed && n > d) return pre + `${Math.trunc(n / d)}又${n % d}/${d}`; return pre + `${n}/${d}`; }
    case 'ratio': return pre + a.value.join(':');
    case 'choice': return pre + a.value;
    case 'text': return pre + (Array.isArray(a.value) ? a.value[0] : a.value);
    case 'hanzi': return pre + a.value;
    case 'order': return pre + a.value.join(a.sep ?? '');
  }
  return '';
}
/** 答案的 HTML（用于展示正确答案） */
export function answerHTML(a) {
  switch (a.kind) {
    case 'frac': { const [n, d] = a.value; if (a.mixed && n > d) return `<span class="mixed">${Math.trunc(n / d)}${fracHTML(n % d, d)}</span>`; return fracHTML(n, d); }
    case 'num': return escHTML(fmt(a.value)) + (a.unit ? `<small>${escHTML(a.unit)}</small>` : '');
    default: return escHTML(answerText({ ...a, label: '' }));
  }
}

// ---------- 判分 ----------
export function normNum(s) {
  s = String(s ?? '').trim()
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[。．·]/g, '.').replace(/[－—–−]/g, '-').replace(/[,，\s]/g, '')
    .replace(/[oO〇]/g, '0').replace(/[lI|]/g, '1');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  return Number(s);
}
const toInt = (s) => { const n = normNum(s); return n !== null && Number.isInteger(n) ? n : null; };

/** a：答案定义；v：孩子填的（num/text/choice 是字符串，frac 是 {w,n,d}，ratio 是 {a,b}） */
export function gradeBlank(a, v, ctx = {}) {
  // 约分五年级下册才学；标准答案本身没约分时也不要求约分
  const needSimplest = a.simplest !== false && (ctx.grade || 6) >= 5 && (a.kind !== 'frac' || gcd(a.value[0], a.value[1]) === 1);
  switch (a.kind) {
    case 'num': { const n = normNum(v); if (n === null) return { ok: false, empty: !String(v ?? '').trim() }; return { ok: Math.abs(fix(n) - fix(a.value)) < 1e-9 }; }
    case 'choice': return { ok: v === a.value, empty: v == null };
    // 写字：v = { text: 写出的字, fails: 提示后才写出 / 放弃的字数 }
    case 'hanzi': { const t = v?.text || ''; if (!t) return { ok: false, empty: true }; return { ok: t === a.value && !v.fails, msg: t === a.value && v.fails ? '有的字是看了提示才写出来的，再写一遍记牢' : '' }; }
    // 排序：v = 卡片顺序（字符串数组）
    case 'order': { if (!Array.isArray(v) || !v.length) return { ok: false, empty: true }; if (v.length < a.value.length) return { ok: false, msg: '还有卡片没排进去' }; const sep = a.sep ?? '', got = v.join(sep); return { ok: [a.value, ...(a.alts || [])].some((x) => x.join(sep) === got) }; }
    case 'text': { const norm = (x) => String(x ?? '').replace(/\s/g, '').toLowerCase(); const vals = Array.isArray(a.value) ? a.value : [a.value]; return { ok: vals.some((x) => norm(x) === norm(v)), empty: !norm(v) }; }
    case 'frac': {
      const w = v?.w ? toInt(v.w) : 0, n = toInt(v?.n), d = toInt(v?.d);
      if (w === null || n === null || d === null || d <= 0) {
        // 只写了整数（答案是整数时）
        const whole = toInt(v?.w ?? v?.n);
        if (whole !== null && !v?.d && a.value[1] === 1) return { ok: whole === a.value[0] };
        return { ok: false, empty: !v?.n && !v?.d && !v?.w };
      }
      const num = (w < 0 ? -1 : 1) * (Math.abs(w) * d + n);
      if (num * a.value[1] !== a.value[0] * d) return { ok: false };
      if (needSimplest && (gcd(n, d) !== 1 || (w && n >= d))) return { ok: false, msg: '数值对了，但要化成最简分数' };
      return { ok: true };
    }
    case 'ratio': {
      const x = toInt(v?.a), y = toInt(v?.b);
      if (x === null || y === null || y === 0) return { ok: false, empty: !v?.a && !v?.b };
      if (x * a.value[1] !== y * a.value[0]) return { ok: false };
      if (gcd(x, y) !== 1) return { ok: false, msg: '比值对了，但要化成最简整数比' };
      return { ok: true };
    }
  }
  return { ok: false };
}

// ---------- 进度 / 掌握 ----------
export const DAY = 86400000;
export const today = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const REVIEW_GAPS = [1, 2, 4, 7, 15, 30]; // 掌握后第几天复习

export function newProgress() {
  return {
    version: 1, name: '小朋友', grade: 3, term: 1,
    settings: { streak: 5, autoNext: true, sound: true, aiAuto: true, input: 'pad', dailyGoal: 30, readAloud: 'auto' },
    skills: {}, wrong: [], days: {}, updatedAt: 0,
  };
}
export function ss(prog, id) {
  return (prog.skills[id] ||= { n: 0, c: 0, streak: 0, recent: [], times: [], mastered: 0, box: 0, due: 0, last: 0 });
}
export function status(prog, sk, now = Date.now()) {
  const s = prog.skills[sk.id];
  if (!s || !s.n) return 'new';
  if (!s.mastered) return 'learning';
  return s.due && s.due <= now ? 'due' : 'mastered';
}
const median = (a) => { if (!a.length) return 0; const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };

/** 记一次作答。target: 'master' | 'review'。返回 { justMastered, reviewPassed, needSpeed } */
export function record(prog, sk, { ok, ms, target = 'master' }) {
  const s = ss(prog, sk.id), now = Date.now();
  s.n++; if (ok) s.c++;
  s.streak = ok ? s.streak + 1 : 0;
  s.recent = [...s.recent, ok ? 1 : 0].slice(-20);
  if (ok) s.times = [...s.times, Math.round(ms / 100) / 10].slice(-20);
  s.last = now;
  const d = (prog.days[today()] ||= { n: 0, c: 0, sec: 0, skills: {} });
  d.n++; if (ok) d.c++; d.sec += Math.min(ms, 600000) / 1000; d.skills[sk.id] = (d.skills[sk.id] || 0) + 1;
  const res = {};
  const need = target === 'review' ? 3 : prog.settings.streak;
  if (target === 'review') {
    if (!ok) { s.box = 0; s.due = now; }
    else if (s.streak >= need && s.due <= now) { s.box = Math.min(s.box + 1, REVIEW_GAPS.length - 1); s.due = now + REVIEW_GAPS[s.box] * DAY; res.reviewPassed = true; }
  } else if (!s.mastered && s.streak >= need) {
    const t = median(s.times.slice(-need));
    if (sk.speed && t > sk.speed) res.needSpeed = { median: t, target: sk.speed };
    else { s.mastered = now; s.box = 0; s.due = now + REVIEW_GAPS[0] * DAY; res.justMastered = true; }
  }
  prog.updatedAt = now;
  return res;
}
export function accuracy(s, k = 20) { const r = (s?.recent || []).slice(-k); return r.length ? r.reduce((a, b) => a + b, 0) / r.length : null; }

/** 今日任务：该复习的 → 正在练的 → 下一个新题型 */
export function todayPlan(prog, skills) {
  const now = Date.now();
  const mine = skills.filter((s) => s.grade < prog.grade || (s.grade === prog.grade && s.term <= prog.term));
  const due = mine.filter((s) => status(prog, s, now) === 'due').sort((a, b) => prog.skills[a.id].due - prog.skills[b.id].due).slice(0, 3);
  const learning = mine.filter((s) => status(prog, s, now) === 'learning').sort((a, b) => (accuracy(prog.skills[a.id]) ?? 1) - (accuracy(prog.skills[b.id]) ?? 1)).slice(0, 2);
  const cur = skills.filter((s) => s.grade === prog.grade && s.term === prog.term);
  const fresh = cur.filter((s) => status(prog, s, now) === 'new').slice(0, learning.length ? 1 : 2);
  return [...due.map((s) => ({ skill: s, target: 'review' })), ...learning.map((s) => ({ skill: s, target: 'master' })), ...fresh.map((s) => ({ skill: s, target: 'master' }))];
}

/** 错题本：同一题型最多留 8 道，总共 300 道 */
export function addWrong(prog, sk, problem, given) {
  prog.wrong = prog.wrong.filter((w) => !(w.skillId === sk.id && w.problem.q === problem.q));
  prog.wrong.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), skillId: sk.id, problem, given, at: Date.now(), fixed: 0 });
  const per = {};
  prog.wrong = prog.wrong.filter((w) => (per[w.skillId] = (per[w.skillId] || 0) + 1) <= 8).slice(0, 300);
}

export const LEVEL = { 1: '基础', 2: '提高', 3: '拓展' };
export const GRADE_CN = ['', '一', '二', '三', '四', '五', '六'];
export const termName = (g, t) => `${GRADE_CN[g]}年级${t === 1 ? '上册' : '下册'}`;
