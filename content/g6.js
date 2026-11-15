// 六年级题库（人教版单元顺序；北京版、北师大版和北京小升初常考题型也覆盖；上册 term 1，下册 term 2）
// 本文件里的局部工具：分数四则运算与讲解文字、百分数挑选、中文折扣 / 成数读法，
// 以及配图：方向图、半圆、圆环、扇形、外方内圆 / 外圆内方、跑道、扇形统计图、阴影图形、小棒图。
import { fig, fmt, fix, frac, mixed, gcd, lcm, simplify } from '../js/lib.js';

const S = [];
export default S;

// ================= 数与答案 =================
const PI = 3.14;
const C = fig.colors;
const T = fig.text;
const num = (value, extra = {}) => ({ kind: 'num', value: fix(value), ...extra });
const choice = (options, value, extra = {}) => ({ kind: 'choice', options, value, ...extra });
const ratioAns = (a, b, extra = {}) => { const [x, y] = simplify(a, b); return { kind: 'ratio', value: [x, y], ...extra }; };
/** 最简分数标记：整数写整数，负数写 -{{3/4}}，asMixed 时假分数写带分数 */
function fs(n, d, asMixed = false) {
  [n, d] = simplify(n, d);
  const neg = n < 0; n = Math.abs(n);
  let s;
  if (d === 1) s = String(n);
  else if (asMixed && n > d) s = mixed(Math.floor(n / d), n % d, d);
  else s = frac(n, d);
  return (neg ? '-' : '') + s;
}
const F = (x, asMixed = false) => fs(x[0], x[1], asMixed);
/** 分数答案：自动约分；整数用 num；mixed 为真且是假分数时出带分数格子 */
function fa(n, d, extra = {}, asMixed = false) {
  [n, d] = simplify(n, d);
  if (d === 1) return num(n, extra);
  return { kind: 'frac', value: [n, d], ...(asMixed && n > d ? { mixed: true } : {}), ...extra };
}
const faX = (x, extra, asMixed) => fa(x[0], x[1], extra, asMixed);
/** 分数运算，x = [分子, 分母] */
const Fr = {
  mul: (a, b) => simplify(a[0] * b[0], a[1] * b[1]),
  div: (a, b) => simplify(a[0] * b[1], a[1] * b[0]),
  add: (a, b) => simplify(a[0] * b[1] + b[0] * a[1], a[1] * b[1]),
  sub: (a, b) => simplify(a[0] * b[1] - b[0] * a[1], a[1] * b[1]),
  val: (a) => a[0] / a[1],
  inv: (a) => simplify(a[1], a[0]),
};
/** 随机最简真分数，分母在 [dmin, dmax] */
function rfrac(r, dmin = 2, dmax = 12) {
  const d = r.int(dmin, dmax);
  const n = r.until(() => r.int(1, d - 1), (n) => gcd(n, d) === 1);
  return [n, d];
}
/** 随机最简分数：improper 的概率出假分数 */
function rfracAny(r, dmin, dmax, improper = 0.25) {
  if (!r.chance(improper)) return rfrac(r, dmin, dmax);
  const d = r.int(Math.max(dmin, 2), dmax);
  const n = r.until(() => r.int(d + 1, 2 * d - 1), (n) => gcd(n, d) === 1);
  return [n, d];
}
/** 两个分数相乘的约分过程（整数写成 [k, 1]） */
function mulExplain(a, b) {
  const g1 = gcd(a[0], b[1]), g2 = gcd(b[0], a[1]);
  const notes = [];
  if (g1 > 1) notes.push(`${a[0]} 和 ${b[1]} 约分（同时除以 ${g1}）`);
  if (g2 > 1) notes.push(`${b[0]} 和 ${a[1]} 约分（同时除以 ${g2}）`);
  const A = [a[0] / g1, a[1] / g2], B = [b[0] / g2, b[1] / g1];
  return { notes, N: A[0] * B[0], D: A[1] * B[1], A, B };
}
/** 「a × b = 结果」一行讲解（含约分说明） */
function mulLine(a, b) {
  const m = mulExplain(a, b);
  const res = fs(m.N, m.D);
  return (m.notes.length ? `先约分：${m.notes.join('，')}；` : '') + `${F(a)} × ${F(b)} = ${res}`;
}
/** 「a ÷ b = a × b的倒数 = 结果」一行讲解 */
function divLine(a, b) {
  const inv = Fr.inv(b), m = mulExplain(a, inv);
  return `${F(a)} ÷ ${F(b)} = ${F(a)} × ${F(inv)} = ${fs(m.N, m.D)}`;
}
/** 「a ± b」通分计算的一行讲解 */
function addLine(a, b, op = '+') {
  const res = op === '+' ? Fr.add(a, b) : Fr.sub(a, b);
  const L = lcm(a[1], b[1]);
  const x = a[0] * (L / a[1]), y = b[0] * (L / b[1]), z = op === '+' ? x + y : x - y;
  let s = `${F(a)} ${op} ${F(b)}`;
  if (L === 1) return `${s} = ${z}`;
  if (a[1] !== L || b[1] !== L) s += ` = ${frac(x, L)} ${op} ${frac(y, L)}`;
  s += ` = ${frac(z, L)}`;
  if (res[1] !== L) s += ` = ${F(res)}`;
  return s;
}
/** 假分数补一句「也就是带分数」 */
const mixNote = (x) => (x[1] > 1 && x[0] > x[1] ? `（${F(x)} = ${F(x, true)}）` : '');

// ---------- 百分数 ----------
const PCTS = [5, 10, 12.5, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 80, 85, 90, 92, 95, 96, 98];
/** 挑一个百分数，返回 {p, n, d}：p% = n/d */
function pickPct(r, lo = 5, hi = 60) {
  const p = r.pick(PCTS.filter((x) => x >= lo && x <= hi));
  const [n, d] = simplify(Math.round(p * 10), 1000);
  return { p, n, d };
}
const pc = (p) => `${fmt(p)}%`;

// ---------- 中文读法 ----------
const CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
/** 折扣：8 → 八折，8.5 → 八五折 */
const zhe = (z) => (Number.isInteger(z) ? `${CN[z]}折` : `${CN[Math.floor(z)]}${CN[Math.round((z % 1) * 10)]}折`);
/** 成数：2 → 二成，1.5 → 一成五 */
const cheng = (c) => (Number.isInteger(c) ? `${CN[c]}成` : `${CN[Math.floor(c)]}成${CN[Math.round((c % 1) * 10)]}`);

// ================= 配图 =================
const svgLine = (x1, y1, x2, y2, { color = C.line, w = 2.5, dash = '' } = {}) =>
  `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;

/** 方向图：dir 如「北偏东」，deg 度数；A 点在 O 点的这个方向 */
function dirFig(dir, deg, label = 'A') {
  const W = 290, H = 290, cx = 145, cy = 145, R = 112;
  let s = svgLine(cx, cy - R, cx, cy + R, { color: C.dash, w: 1.5, dash: '5 4' }) + svgLine(cx - R, cy, cx + R, cy, { color: C.dash, w: 1.5, dash: '5 4' });
  s += `<path d="M${cx},${cy - R - 4} l-7,14 l14,0 z" fill="${C.line}"/>`;
  s += T(cx, cy - R - 16, '北', { size: 15, weight: 'bold' }) + T(cx, cy + R + 12, '南', { size: 15 }) + T(cx + R + 14, cy, '东', { size: 15 }) + T(cx - R - 14, cy, '西', { size: 15 });
  const ns = dir[0] === '北' ? -1 : 1, ew = dir[2] === '东' ? 1 : -1;
  const a = (deg * Math.PI) / 180, L = 92;
  const px = cx + ew * L * Math.sin(a), py = cy + ns * L * Math.cos(a);
  s += svgLine(cx, cy, px, py, { w: 3 }) + `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5" fill="${C.acc}"/>` + `<circle cx="${cx}" cy="${cy}" r="4" fill="${C.line}"/>`;
  s += T(px + ew * 14, py + ns * 10, label, { size: 17, weight: 'bold', color: C.acc });
  s += T(cx - ew * 14, cy - ns * 14, 'O', { size: 16, weight: 'bold' });
  const r0 = 36, sweep = (ns === -1) === (ew === 1) ? 1 : 0;
  s += `<path d="M${cx},${cy + ns * r0} A${r0},${r0} 0 0,${sweep} ${(cx + ew * r0 * Math.sin(a)).toFixed(1)},${(cy + ns * r0 * Math.cos(a)).toFixed(1)}" fill="none" stroke="${C.acc}" stroke-width="2.5"/>`;
  s += T(cx + ew * 60 * Math.sin(a / 2) + ew * 6, cy + ns * 60 * Math.cos(a / 2), `${deg}°`, { size: 14, weight: 'bold', color: C.acc });
  return fig.raw(W, H, s);
}

/** 半圆：label 以 r= 开头时画半径并标在半径上方，否则把整条直径标出来 */
function semiFig(label) {
  const cx = 150, cy = 150, R = 120, isR = label.startsWith('r');
  let s = `<path d="M${cx - R},${cy} A${R},${R} 0 0,1 ${cx + R},${cy} Z" fill="${C.fill}" stroke="${C.line}" stroke-width="3"/>`;
  s += isR ? svgLine(cx, cy, cx + R, cy, { color: C.acc, w: 3 }) + T(cx + R / 2, cy - 16, label, { size: 16, weight: 'bold' }) : svgLine(cx - R, cy, cx + R, cy, { color: C.acc, w: 3 }) + T(cx, cy + 18, label, { size: 16, weight: 'bold' });
  s += `<circle cx="${cx}" cy="${cy}" r="3.5" fill="${C.line}"/>`;
  return fig.raw(300, 175, s);
}

/** 圆环：外圆、内圆两条半径标注 */
function ringFig(outer, inner) {
  const c = 120, R = 105, r = 55;
  let s = `<circle cx="${c}" cy="${c}" r="${R}" fill="${C.fill}" stroke="${C.line}" stroke-width="3"/><circle cx="${c}" cy="${c}" r="${r}" fill="#fff" stroke="${C.line}" stroke-width="3"/>`;
  s += `<circle cx="${c}" cy="${c}" r="3" fill="${C.line}"/>`;
  s += svgLine(c, c, c + R * 0.866, c - R * 0.5, { color: C.acc }) + svgLine(c, c, c - r, c, { color: C.acc });
  s += T(c + R * 0.62, c - R * 0.5 + 2, outer, { size: 15, weight: 'bold' }) + T(c - r / 2, c + 14, inner, { size: 14, weight: 'bold' });
  return fig.raw(240, 240, s);
}

/** 扇形：圆心角 deg，半径标注 */
function sectorFig(deg, rLabel) {
  const W = 260, H = 240;
  const a = (deg * Math.PI) / 180, R = 95;
  // 让扇形大致居中：以平分线朝上
  const start = Math.PI / 2 + a / 2, end = Math.PI / 2 - a / 2;
  const cx = 130, cy = deg > 180 ? 125 : 165;
  const P = (t, rr = R) => [cx + rr * Math.cos(t), cy - rr * Math.sin(t)];
  const [x1, y1] = P(start), [x2, y2] = P(end);
  let s = `<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R} 0 ${deg > 180 ? 1 : 0},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${C.fill2}" stroke="${C.line}" stroke-width="3"/>`;
  const ar = 24, [ax1, ay1] = P(start, ar), [ax2, ay2] = P(end, ar);
  s += `<path d="M${ax1.toFixed(1)},${ay1.toFixed(1)} A${ar},${ar} 0 ${deg > 180 ? 1 : 0},1 ${ax2.toFixed(1)},${ay2.toFixed(1)}" fill="none" stroke="${C.acc}" stroke-width="2"/>`;
  const [lx, ly] = deg > 180 ? [cx, cy + 40] : P(Math.PI / 2, 42);
  s += T(lx, ly, `${deg}°`, { size: 14, weight: 'bold', color: C.acc });
  const [mx, my] = P(end, R / 2);
  s += T(mx + 14 * Math.cos(end - Math.PI / 2), my - 14 * Math.sin(end - Math.PI / 2), rLabel, { size: 15, weight: 'bold' });
  return fig.raw(W, H, s);
}

/** 外方内圆（kind='sq-out'）或外圆内方（kind='circle-out'），阴影部分着色 */
function squareCircleFig(kind, label) {
  const c = 120;
  let s = '';
  if (kind === 'sq-out') {
    const a = 180, R = a / 2;
    s += `<rect x="${c - R}" y="${c - R}" width="${a}" height="${a}" fill="${C.fill2}" stroke="${C.line}" stroke-width="3"/>`;
    s += `<circle cx="${c}" cy="${c}" r="${R}" fill="#fff" stroke="${C.line}" stroke-width="3"/>`;
    s += `<circle cx="${c}" cy="${c}" r="3" fill="${C.line}"/>` + svgLine(c, c, c + R, c, { color: C.acc });
    s += T(c + R / 2, c - 14, label, { size: 15, weight: 'bold' });
  } else {
    const R = 95, h = R / Math.SQRT2;
    s += `<circle cx="${c}" cy="${c}" r="${R}" fill="${C.fill2}" stroke="${C.line}" stroke-width="3"/>`;
    s += `<polygon points="${c},${c - R} ${c + R},${c} ${c},${c + R} ${c - R},${c}" fill="#fff" stroke="${C.line}" stroke-width="3"/>`;
    s += svgLine(c - R, c, c + R, c, { color: C.dash, w: 1.5, dash: '5 4' }) + svgLine(c, c - R, c, c + R, { color: C.dash, w: 1.5, dash: '5 4' });
    s += svgLine(c, c, c + R, c, { color: C.acc }) + `<circle cx="${c}" cy="${c}" r="3" fill="${C.line}"/>`;
    s += T(c + R / 2, c - 12, label, { size: 15, weight: 'bold' });
    void h;
  }
  return fig.raw(240, 240, s);
}

/** 跑道：中间长方形 + 两端半圆 */
function trackFig(lLabel, dLabel) {
  const L = 200, R = 60, x0 = 80, y0 = 30;
  let s = `<path d="M${x0},${y0} L${x0 + L},${y0} A${R},${R} 0 0,1 ${x0 + L},${y0 + 2 * R} L${x0},${y0 + 2 * R} A${R},${R} 0 0,1 ${x0},${y0} Z" fill="${C.fill}" stroke="${C.line}" stroke-width="3"/>`;
  s += svgLine(x0, y0, x0, y0 + 2 * R, { color: C.dash, w: 1.5, dash: '5 4' }) + svgLine(x0 + L, y0, x0 + L, y0 + 2 * R, { color: C.acc, w: 2.5 });
  s += svgLine(x0, y0 + 2 * R + 1, x0 + L, y0 + 2 * R + 1, { color: C.acc, w: 3 });
  s += T(x0 + L / 2, y0 + 2 * R + 18, lLabel, { size: 15, weight: 'bold' }) + T(x0 + L - 10, y0 + R, dLabel, { size: 15, weight: 'bold', anchor: 'end' });
  return fig.raw(360, 200, s);
}

/** 扇形统计图：items = [[名称, 百分数], ...] */
function pieFig(items, title = '') {
  const cx = 200, cy = 160, R = 108;
  const cols = ['#cfe0ff', '#ffe2b8', '#d5f2d0', '#f8d0d8', '#e5d8ff', '#fff3a8'];
  let s = '', t = 0;
  items.forEach(([name, p], i) => {
    const a0 = (t / 100) * 2 * Math.PI - Math.PI / 2, a1 = ((t + p) / 100) * 2 * Math.PI - Math.PI / 2;
    const [x0, y0] = [cx + R * Math.cos(a0), cy + R * Math.sin(a0)], [x1, y1] = [cx + R * Math.cos(a1), cy + R * Math.sin(a1)];
    s += `<path d="M${cx},${cy} L${x0.toFixed(1)},${y0.toFixed(1)} A${R},${R} 0 ${p > 50 ? 1 : 0},1 ${x1.toFixed(1)},${y1.toFixed(1)} Z" fill="${cols[i % cols.length]}" stroke="${C.line}" stroke-width="2"/>`;
    const am = (a0 + a1) / 2, rr = R * 0.62;
    if (p <= 10) {
      // 小扇形放不下字：标在圆外，加一条引线
      const ca = Math.cos(am), sa = Math.sin(am);
      s += svgLine(cx + (R - 6) * ca, cy + (R - 6) * sa, cx + (R + 10) * ca, cy + (R + 10) * sa, { color: C.dash, w: 1.2 });
      s += T(cx + (R + 14) * ca, cy + (R + 14) * sa, `${name} ${pc(p)}`, { size: 13, anchor: ca >= 0 ? 'start' : 'end' });
    } else s += T(cx + rr * Math.cos(am), cy + rr * Math.sin(am) - 9, name, { size: 13 }) + T(cx + rr * Math.cos(am), cy + rr * Math.sin(am) + 9, pc(p), { size: 13, weight: 'bold' });
    t += p;
  });
  if (title) s += T(cx, 320 - 4, title, { size: 13, color: C.dash });
  return fig.raw(400, title ? 330 : 320, s);
}

// ================= 题型 =================
// ---------------- 上册 1 分数乘法 ----------------
S.push(
  {
    id: 'g6a-fmul-int', grade: 6, term: 1, unit: '分数乘法', name: '分数乘整数',
    tip: '分子和整数相乘的积作分子，分母不变；能约分的先约分', level: 1, speed: 20,
    gen(r) {
      const red = r.chance(0.65);
      const [n, d] = red ? r.until(() => rfrac(r, 4, 15), ([, d]) => [4, 6, 8, 9, 10, 12, 14, 15].includes(d) || r.chance(0.2)) : rfrac(r, 3, 15);
      const k = red ? r.until(() => r.int(2, 30), (k) => gcd(k, d) > 1 && k !== d) : r.until(() => r.int(2, 12), (k) => gcd(k, d) === 1);
      const expr = r.bool() ? `${frac(n, d)} × ${k}` : `${k} × ${frac(n, d)}`;
      const m = mulExplain([n, d], [k, 1]), g = gcd(k, d), res = [m.N, m.D];
      const steps = ['分数乘整数：用分子和整数相乘的积作分子，分母不变'];
      if (g > 1) steps.push(`先约分：整数 ${k} 和分母 ${d} 同时除以 ${g}，变成 ${k / g} 和 ${d / g}`);
      steps.push(`分子 ${n} × ${k / g} = ${m.N}，分母是 ${m.D}`);
      steps.push(`${expr} = ${F(res)}${mixNote(res)}`);
      if (g === 1) steps.push('整数和分母没有公因数，不用约分，结果已经是最简分数');
      return { q: `${expr} = {0}`, answer: [faX(res)], steps, hint: '先看整数和分母能不能约分' };
    },
  },
  {
    id: 'g6a-fmul-frac', grade: 6, term: 1, unit: '分数乘法', name: '分数乘分数',
    tip: '分子乘分子，分母乘分母；先交叉约分再乘更简单', level: 1, speed: 25,
    gen(r) {
      const cross = r.chance(0.7);
      const [a, b] = r.until(() => [rfracAny(r, 2, 12), rfrac(r, 2, 12)], ([a, b]) => (gcd(a[0], b[1]) > 1 || gcd(b[0], a[1]) > 1) === cross && a[1] !== b[1]);
      const [x, y] = r.bool() ? [a, b] : [b, a];
      const m = mulExplain(x, y), res = [m.N, m.D];
      const steps = ['分数乘分数：分子乘分子作分子，分母乘分母作分母'];
      if (m.notes.length) steps.push(`先交叉约分：${m.notes.join('，')}`);
      else steps.push('分子和分母之间没有公因数可以约，直接乘');
      steps.push(`分子 ${m.A[0]} × ${m.B[0]} = ${m.N}，分母 ${m.A[1]} × ${m.B[1]} = ${m.D}`);
      steps.push(`${F(x)} × ${F(y)} = ${F(res)}${mixNote(res)}`);
      return { q: `${F(x)} × ${F(y)} = {0}`, answer: [faX(res)], steps, hint: '左边的分子能和右边的分母约分吗？' };
    },
  },
  {
    id: 'g6a-fmul-mixed', grade: 6, term: 1, unit: '分数乘法', name: '带分数乘法',
    tip: '先把带分数化成假分数，再按分数乘法计算', level: 2,
    gen(r) {
      const mk = () => { const [n, d] = rfrac(r, 2, 9); const w = r.int(1, 4); return { w, n, d, imp: [w * d + n, d] }; };
      const A = mk();
      const kind = r.pick(['int', 'frac', 'mixed']);
      let B, bText, bImp;
      if (kind === 'int') {
        const k = r.chance(0.7) ? r.until(() => r.int(2, 24), (k) => gcd(k, A.d) > 1) : r.int(2, 9);
        B = null; bText = String(k); bImp = [k, 1];
      } else if (kind === 'frac') {
        bImp = r.until(() => rfrac(r, 2, 12), (f) => gcd(f[0], A.d) > 1 || gcd(A.imp[0], f[1]) > 1);
        bText = F(bImp);
      } else {
        B = r.until(mk, (b) => gcd(b.imp[0], A.d) > 1 || gcd(A.imp[0], b.d) > 1);
        bText = mixed(B.w, B.n, B.d); bImp = B.imp;
      }
      const aText = mixed(A.w, A.n, A.d);
      const expr = kind === 'int' && r.bool() ? `${bText} × ${aText}` : `${aText} × ${bText}`;
      const res = Fr.mul(A.imp, bImp);
      const conv = [`${aText} = ${frac(A.imp[0], A.d)}`];
      if (kind === 'mixed') conv.push(`${bText} = ${frac(B.imp[0], B.d)}`);
      const m = mulExplain(A.imp, bImp);
      const steps = [`先把带分数化成假分数：${conv.join('，')}（整数 × 分母 + 分子）`];
      steps.push(m.notes.length ? `再约分：${m.notes.join('，')}` : '没有可以约分的，直接乘');
      steps.push(`${frac(A.imp[0], A.d)} × ${F(bImp)} = ${F(res)}${mixNote(res)}`);
      if (kind === 'mixed') steps.push('易错：不能整数部分乘整数部分、分数部分乘分数部分');
      else if (kind === 'int') steps.push(`也可以用分配律：${A.w} × ${bText} + ${frac(A.n, A.d)} × ${bText}`);
      return { q: `${expr} = {0}`, answer: [faX(res, {}, true)], steps, hint: '带分数要先化成假分数' };
    },
  },
  {
    id: 'g6a-fmul-ops', grade: 6, term: 1, unit: '分数乘法', name: '分数乘加、乘减混合运算',
    tip: '运算顺序和整数一样：先乘除后加减，有括号先算括号里的', level: 2,
    gen(r) {
      const t = r.int(1, 5);
      let q, res, steps;
      if (t === 1 || t === 2) {
        const [a, b, c] = r.until(() => [rfrac(r, 2, 10), rfracAny(r, 2, 10), rfrac(r, 2, 10)], ([a, b, c]) => {
          const ab = Fr.mul(a, b); return ab[1] <= 30 && (gcd(a[0], b[1]) > 1 || gcd(b[0], a[1]) > 1) && (t === 1 || Fr.val(ab) > Fr.val(c)) && ab[1] !== c[1];
        });
        const ab = Fr.mul(a, b), op = t === 1 ? '+' : '-';
        q = `${F(a)} × ${F(b)} ${op} ${F(c)}`;
        res = t === 1 ? Fr.add(ab, c) : Fr.sub(ab, c);
        steps = ['先算乘法，再算' + (t === 1 ? '加法' : '减法'), mulLine(a, b), addLine(ab, c, op)];
      } else if (t === 3) {
        const [a, b, c] = r.until(() => [rfrac(r, 2, 10), rfrac(r, 2, 10), rfrac(r, 2, 10)], ([a, b, c]) => {
          const bc = Fr.mul(b, c); return Fr.val(a) > Fr.val(bc) && (gcd(b[0], c[1]) > 1 || gcd(c[0], b[1]) > 1) && bc[1] !== a[1];
        });
        const bc = Fr.mul(b, c);
        q = `${F(a)} - ${F(b)} × ${F(c)}`;
        res = Fr.sub(a, bc);
        steps = ['先算乘法，再算减法（不能先算 ' + `${F(a)} - ${F(b)}）`, mulLine(b, c), addLine(a, bc, '-')];
      } else if (t === 4) {
        const [a, b, c] = r.until(() => [rfrac(r, 2, 9), rfrac(r, 2, 9), rfracAny(r, 2, 12)], ([a, b, c]) => a[1] !== b[1] && Fr.val(a) > Fr.val(b) && gcd(Fr.sub(a, b)[0], c[1]) * gcd(c[0], Fr.sub(a, b)[1]) > 1);
        const ab = Fr.sub(a, b);
        q = `(${F(a)} - ${F(b)}) × ${F(c)}`;
        res = Fr.mul(ab, c);
        steps = ['有括号，先算括号里的减法', addLine(a, b, '-'), mulLine(ab, c)];
      } else {
        const [a, b, c] = r.until(() => [rfrac(r, 2, 12), rfracAny(r, 2, 12), rfrac(r, 2, 12)], ([a, b, c]) => {
          const p = Fr.mul(Fr.mul(a, b), c); return p[1] <= 40 && p[1] < a[1] * b[1] * c[1] / 4;
        });
        q = `${F(a)} × ${F(b)} × ${F(c)}`;
        res = Fr.mul(Fr.mul(a, b), c);
        steps = ['连乘可以把三个分数写在一起，分子和分母能约分的都先约分', `分子 ${a[0]} × ${b[0]} × ${c[0]}，分母 ${a[1]} × ${b[1]} × ${c[1]}，约分后得 ${F(res)}`];
      }
      if (res[1] > 48 || res[0] <= 0) return this.gen(r);
      steps.push(`结果：${F(res)}${mixNote(res)}`);
      return { q: `${q} = {0}`, answer: [faX(res)], steps, hint: '先想好运算顺序' };
    },
  },
  {
    id: 'g6a-fmul-simple', grade: 6, term: 1, unit: '分数乘法', name: '分数乘法简便计算',
    tip: '整数的运算律对分数同样适用：乘法分配律最常用', level: 2,
    gen(r) {
      const t = r.int(1, 4);
      let q, res, steps;
      if (t === 1) {
        // (x/a ± y/b) × N
        const [a, b] = r.until(() => r.sample([2, 3, 4, 5, 6, 8, 9, 10, 12], 2), ([a, b]) => lcm(a, b) <= 36);
        const L = lcm(a, b);
        const N = L * r.int(1, Math.max(1, Math.floor(72 / L)));
        const x = r.until(() => r.int(1, a - 1), (x) => gcd(x, a) === 1), y = r.until(() => r.int(1, b - 1), (y) => gcd(y, b) === 1);
        const op = x / a > y / b && r.bool() ? '-' : '+';
        const p = (x * N) / a, s2 = (y * N) / b, ans = op === '+' ? p + s2 : p - s2;
        const left = r.bool();
        q = left ? `(${frac(x, a)} ${op} ${frac(y, b)}) × ${N}` : `${N} × (${frac(x, a)} ${op} ${frac(y, b)})`;
        res = [ans, 1];
        steps = [`${N} 是分母 ${a} 和 ${b} 的公倍数，用乘法分配律：(a ${op} b) × c = a × c ${op} b × c`, `= ${frac(x, a)} × ${N} ${op} ${frac(y, b)} × ${N}`, `= ${p} ${op} ${s2} = ${ans}`, '括号里通分再乘也能算，但用分配律能直接约分，又快又不容易错'];
      } else if (t === 2) {
        // a/b × c + a/b × e，c + e 是 b 的倍数
        const f = rfrac(r, 3, 12), m = f[1] < 5 ? r.int(2, 3) : r.int(1, 2), tot = f[1] * m;
        const c = r.int(2, tot - 2), e = tot - c;
        q = r.bool() ? `${F(f)} × ${c} + ${F(f)} × ${e}` : `${c} × ${F(f)} + ${e} × ${F(f)}`;
        res = [f[0] * m, 1];
        steps = [`两个乘法里都有 ${F(f)}，用乘法分配律把它提出来`, `= ${F(f)} × (${c} + ${e})`, `= ${F(f)} × ${tot} = ${f[0] * m}`];
      } else if (t === 3) {
        // a/b × c/d + a/b × (d-c)/d  或  a/b × 99 + a/b
        if (r.bool()) {
          const f = rfrac(r, 3, 12), d = r.int(3, 11), c = r.until(() => r.int(1, d - 1), (c) => gcd(c, d) === 1);
          q = `${F(f)} × ${frac(c, d)} + ${F(f)} × ${frac(d - c, d)}`;
          res = f;
          steps = [`两个乘法里都有 ${F(f)}，把它提出来`, `= ${F(f)} × (${frac(c, d)} + ${frac(d - c, d)})`, `= ${F(f)} × 1 = ${F(f)}`];
        } else {
          const f = rfrac(r, 3, 12), [k, sign] = r.pick([[99, '+'], [9, '+'], [101, '-'], [11, '-'], [999, '+']]);
          const tot = sign === '+' ? k + 1 : k - 1;
          q = `${F(f)} × ${k} ${sign} ${F(f)}`;
          res = Fr.mul(f, [tot, 1]);
          steps = [`把单独的 ${F(f)} 看成 ${F(f)} × 1`, `= ${F(f)} × (${k} ${sign} 1)`, `= ${F(f)} × ${tot} = ${F(res)}${mixNote(res)}`];
        }
      } else {
        // (b ± 1) × a/b
        const b = r.int(8, 40), a = r.until(() => r.int(1, b - 1), (a) => gcd(a, b) === 1);
        const plus = r.bool(), k = plus ? b + 1 : b - 1;
        q = r.bool() ? `${k} × ${frac(a, b)}` : `${frac(a, b)} × ${k}`;
        res = simplify(a * k, b);
        steps = [`${k} 接近分母 ${b}，把它拆成 ${b} ${plus ? '+' : '-'} 1`, `= ${b} × ${frac(a, b)} ${plus ? '+' : '-'} 1 × ${frac(a, b)}`, `= ${a} ${plus ? '+' : '-'} ${frac(a, b)} = ${F(res, true)}`];
      }
      return { q: `${q} = {0}`, answer: [faX(res, {}, true)], steps, hint: '找一找：能用乘法分配律凑整吗？' };
    },
  },
);

// ---------- 分数 / 百分数应用题共用的情境 ----------
/** 「A 的 f 是 X」：fwd 已知 A 求 X；rev 已知 X 求 A */
const PART_CTX = [
  { one: '全校学生人数', unit: '人', lo: 300, hi: 1200, minF: 0.4, maxF: 0.6,
    fwd: (W, f) => `某校有学生 ${W} 人，其中男生占 ${f}。男生有多少人？`, fa: (x) => `男生有 ${x} 人`,
    rev: (X, f) => `某校有男生 ${X} 人，占全校学生人数的 ${f}。全校有学生多少人？`, ra: (x) => `全校有学生 ${x} 人` },
  { one: '全书的页数', unit: '页', lo: 120, hi: 400,
    fwd: (W, f, nm) => `一本故事书有 ${W} 页，${nm}已经看了全书的 ${f}。${nm}看了多少页？`, fa: (x) => `看了 ${x} 页`,
    rev: (X, f, nm) => `${nm}看一本故事书，已经看了 ${X} 页，正好是全书的 ${f}。这本书有多少页？`, ra: (x) => `这本书有 ${x} 页` },
  { one: '公路的全长', unit: '米', lo: 600, hi: 3000, st: 10,
    fwd: (W, f) => `一条公路长 ${W} 米，已经修了全长的 ${f}。已经修了多少米？`, fa: (x) => `已经修了 ${x} 米`,
    rev: (X, f) => `修一条公路，已经修了 ${X} 米，占全长的 ${f}。这条公路全长多少米？`, ra: (x) => `这条公路全长 ${x} 米` },
  { one: '苹果树的棵数', unit: '棵', lo: 60, hi: 400, minF: 0.25,
    fwd: (W, f) => `果园里有苹果树 ${W} 棵，梨树的棵数是苹果树的 ${f}。梨树有多少棵？`, fa: (x) => `梨树有 ${x} 棵`,
    rev: (X, f) => `果园里有梨树 ${X} 棵，是苹果树棵数的 ${f}。苹果树有多少棵？`, ra: (x) => `苹果树有 ${x} 棵` },
  { one: '原价', unit: '元', lo: 60, hi: 800, st: 10, minF: 0.5,
    fwd: (W, f) => `一件衣服原价 ${W} 元，现价是原价的 ${f}。现价多少元？`, fa: (x) => `现价 ${x} 元`,
    rev: (X, f) => `一件衣服现价 ${X} 元，是原价的 ${f}。原价多少元？`, ra: (x) => `原价 ${x} 元` },
  { one: '上个月的用电量', unit: '度', lo: 100, hi: 400, minF: 0.6,
    fwd: (W, f, nm) => `${nm}家上个月用电 ${W} 度，这个月的用电量是上个月的 ${f}。这个月用电多少度？`, fa: (x) => `这个月用电 ${x} 度`,
    rev: (X, f, nm) => `${nm}家这个月用电 ${X} 度，是上个月用电量的 ${f}。上个月用电多少度？`, ra: (x) => `上个月用电 ${x} 度` },
  { one: '体重', unit: '千克', lo: 30, hi: 54, fixF: [2, 3], fracOnly: true,
    fwd: (W, f, nm) => `人体内的水分约占体重的 ${f}。${nm}的体重是 ${W} 千克，${nm}体内的水分约有多少千克？`, fa: (x) => `水分约有 ${x} 千克`,
    rev: (X, f, nm) => `人体内的水分约占体重的 ${f}。${nm}体内约有水分 ${X} 千克，${nm}的体重约是多少千克？`, ra: (x) => `体重约是 ${x} 千克` },
  { one: '六年级学生人数', unit: '人', lo: 150, hi: 500, pctOnly: true, pHi: 60,
    fwd: (W, f) => `某校六年级有 ${W} 名学生，近视的占 ${f}。近视的有多少人？`, fa: (x) => `近视的有 ${x} 人`,
    rev: (X, f) => `某校六年级近视的学生有 ${X} 人，占六年级学生人数的 ${f}。六年级有多少名学生？`, ra: (x) => `六年级有 ${x} 名学生` },
  { one: '种子的总粒数', unit: '粒', lo: 200, hi: 1000, pctOnly: true, pLo: 80, pHi: 98,
    fwd: (W, f) => `一批种子共 ${W} 粒，发芽率是 ${f}。发芽了多少粒？`, fa: (x) => `发芽了 ${x} 粒`,
    rev: (X, f) => `一批种子发芽了 ${X} 粒，发芽率是 ${f}。这批种子共有多少粒？`, ra: (x) => `这批种子共有 ${x} 粒` },
  { one: '零件的总数', unit: '个', lo: 200, hi: 2000, pctOnly: true, pLo: 85, pHi: 98,
    fwd: (W, f) => `工厂生产了 ${W} 个零件，合格率是 ${f}。合格的零件有多少个？`, fa: (x) => `合格的有 ${x} 个`,
    rev: (X, f) => `工厂生产的零件中合格的有 ${X} 个，合格率是 ${f}。一共生产了多少个零件？`, ra: (x) => `一共生产了 ${x} 个零件` },
];

/** 「A 的 f 是 X」出题：pct 为真时用百分数 */
function partGen(r, { rev, pct }) {
  const ctxs = PART_CTX.filter((c) => (pct ? !c.fracOnly : !c.pctOnly));
  const c = r.pick(ctxs), nm = r.name();
  const { W, n, d, ft } = r.until(() => {
    let n, d, ft;
    if (pct) { const p = pickPct(r, c.pLo || Math.max(5, (c.minF || 0) * 100), c.pHi || (c.maxF || 0.8) * 100); [n, d] = [p.n, p.d]; ft = pc(p.p); }
    else { [n, d] = c.fixF || r.until(() => rfrac(r, 3, 12), ([n, d]) => n / d >= (c.minF || 0) && n / d <= (c.maxF || 1)); ft = frac(n, d); }
    const st = lcm(d, c.st || 1);
    if (Math.floor(c.hi / st) < Math.ceil(c.lo / st)) return {};
    return { W: r.step(c.lo, c.hi, st), n, d, ft };
  }, (o) => o.W);
  const X = (W * n) / d;
  const fv = pct ? ft : frac(n, d);
  const unit1 = `把${c.one}看作单位“1”`;
  if (!rev) {
    return {
      q: c.fwd(W, ft, nm),
      answer: [num(X, { unit: c.unit })],
      steps: [`${unit1}，单位“1”是已知的：${W} ${c.unit}`, `求 ${W} 的 ${fv} 是多少，用乘法`, `${W} × ${fv} = ${X}（${c.unit}）`, `答：${c.fa(X)}。`],
      hint: '“占”“是”谁的几分之几，谁就是单位“1”',
    };
  }
  const solve = pct ? `x = ${X} ÷ ${ft} = ${X} ÷ ${fmt(n / d)} = ${W}` : `x = ${X} ÷ ${frac(n, d)} = ${X} × ${frac(d, n)} = ${W}`;
  return {
    q: c.rev(X, ft, nm),
    answer: [num(W, { unit: c.unit })],
    steps: [`${unit1}，单位“1”是未知的`, `等量关系：${c.one} × ${fv} = ${X}`, `设${c.one}为 x，列方程：${pct ? 'x × ' + ft : frac(n, d) + 'x'} = ${X}`, solve, `也可以直接用除法：${X} ÷ ${fv} = ${W}`, `答：${c.ra(W)}。`],
    hint: '单位“1”知道吗？不知道就设它为 x，或者用除法',
  };
}

/** 「B 比 A 多（少）f」：fwd 已知 A 求 B；rev 已知 B 求 A */
const MORE_CTX = [
  { one: '去年的产量', two: '今年的产量', rel: '今年比去年增产', unit: '吨', lo: 200, hi: 900,
    fwd: (A, f) => `某村去年产粮 ${A} 吨，今年比去年增产 ${f}。今年产粮多少吨？`, fa: (x) => `今年产粮 ${x} 吨`,
    rev: (B, f) => `某村今年产粮 ${B} 吨，比去年增产 ${f}。去年产粮多少吨？`, ra: (x) => `去年产粮 ${x} 吨` },
  { one: '小明的体重', two: '爸爸的体重', rel: '爸爸比小明重', unit: '千克', lo: 28, hi: 42, okB: (B) => B >= 55 && B <= 85, maxF: 1,
    fwd: (A, f) => `小明的体重是 ${A} 千克，爸爸比小明重 ${f}。爸爸的体重是多少千克？`, fa: (x) => `爸爸的体重是 ${x} 千克`,
    rev: (B, f) => `爸爸的体重是 ${B} 千克，比小明重 ${f}。小明的体重是多少千克？`, ra: (x) => `小明的体重是 ${x} 千克` },
  { one: '原价', two: '现价', rel: '现在涨价', unit: '元', lo: 40, hi: 800,
    fwd: (A, f) => `一种商品原价 ${A} 元，现在涨价 ${f}。现价是多少元？`, fa: (x) => `现价是 ${x} 元`,
    rev: (B, f) => `一种商品涨价 ${f} 后，售价是 ${B} 元。原价是多少元？`, ra: (x) => `原价是 ${x} 元` },
  { one: '第一周修的长度', two: '第二周修的长度', rel: '第二周比第一周多修', unit: '米', lo: 300, hi: 1500, st: 10,
    fwd: (A, f) => `修一条路，第一周修了 ${A} 米，第二周比第一周多修了 ${f}。第二周修了多少米？`, fa: (x) => `第二周修了 ${x} 米`,
    rev: (B, f) => `修一条路，第二周修了 ${B} 米，比第一周多修了 ${f}。第一周修了多少米？`, ra: (x) => `第一周修了 ${x} 米` },
  { one: '五年级的人数', two: '六年级的人数', rel: '六年级比五年级多', unit: '人', lo: 100, hi: 320,
    fwd: (A, f) => `某校五年级有 ${A} 人，六年级的人数比五年级多 ${f}。六年级有多少人？`, fa: (x) => `六年级有 ${x} 人`,
    rev: (B, f) => `某校六年级有 ${B} 人，比五年级多 ${f}。五年级有多少人？`, ra: (x) => `五年级有 ${x} 人` },
  { one: '上月的用水量', two: '本月的用水量', rel: '本月比上月多用了', unit: '吨', lo: 10, hi: 60,
    fwd: (A, f, nm) => `${nm}家上月用水 ${A} 吨，本月比上月多用了 ${f}。本月用水多少吨？`, fa: (x) => `本月用水 ${x} 吨`,
    rev: (B, f, nm) => `${nm}家本月用水 ${B} 吨，比上月多用了 ${f}。上月用水多少吨？`, ra: (x) => `上月用水 ${x} 吨` },
];
const LESS_CTX = [
  { one: '原价', two: '现价', rel: '现在降价', unit: '元', lo: 800, hi: 5000, st: 10,
    fwd: (A, f) => `一台电视机原价 ${A} 元，现在降价 ${f}。现价是多少元？`, fa: (x) => `现价是 ${x} 元`,
    rev: (B, f) => `一台电视机降价 ${f} 后，售价是 ${B} 元。原价是多少元？`, ra: (x) => `原价是 ${x} 元` },
  { one: '计划的用电量', two: '实际的用电量', rel: '实际比计划节约了', unit: '度', lo: 100, hi: 400,
    fwd: (A, f, nm) => `${nm}家计划每月用电 ${A} 度，实际比计划节约了 ${f}。实际每月用电多少度？`, fa: (x) => `实际每月用电 ${x} 度`,
    rev: (B, f, nm) => `${nm}家实际每月用电 ${B} 度，比计划节约了 ${f}。计划每月用电多少度？`, ra: (x) => `计划每月用电 ${x} 度` },
  { one: '爸爸的体重', two: '小明的体重', rel: '小明比爸爸轻', unit: '千克', lo: 60, hi: 80, okB: (B) => B >= 28 && B <= 45, maxF: 0.6,
    fwd: (A, f) => `爸爸的体重是 ${A} 千克，小明比爸爸轻 ${f}。小明的体重是多少千克？`, fa: (x) => `小明的体重是 ${x} 千克`,
    rev: (B, f) => `小明的体重是 ${B} 千克，比爸爸轻 ${f}。爸爸的体重是多少千克？`, ra: (x) => `爸爸的体重是 ${x} 千克` },
  { one: '第一天看的页数', two: '第二天看的页数', rel: '第二天比第一天少看了', unit: '页', lo: 20, hi: 90,
    fwd: (A, f, nm) => `${nm}看一本书，第一天看了 ${A} 页，第二天比第一天少看了 ${f}。第二天看了多少页？`, fa: (x) => `第二天看了 ${x} 页`,
    rev: (B, f, nm) => `${nm}看一本书，第二天看了 ${B} 页，比第一天少看了 ${f}。第一天看了多少页？`, ra: (x) => `第一天看了 ${x} 页` },
  { one: '去年植树的棵数', two: '今年植树的棵数', rel: '今年比去年少植', unit: '棵', lo: 200, hi: 800,
    fwd: (A, f) => `学校去年植树 ${A} 棵，今年比去年少植了 ${f}。今年植树多少棵？`, fa: (x) => `今年植树 ${x} 棵`,
    rev: (B, f) => `学校今年植树 ${B} 棵，比去年少植了 ${f}。去年植树多少棵？`, ra: (x) => `去年植树 ${x} 棵` },
  { one: '这桶油原来的质量', two: '剩下的油', rel: '用去了', unit: '千克', lo: 20, hi: 100,
    fwd: (A, f) => `一桶油重 ${A} 千克，用去了 ${f}。还剩多少千克？`, fa: (x) => `还剩 ${x} 千克`,
    rev: (B, f) => `一桶油用去了 ${f}，还剩 ${B} 千克。这桶油原来重多少千克？`, ra: (x) => `这桶油原来重 ${x} 千克` },
];

/** 比一个数多（少）几分之几 / 百分之几：sign 1 多，-1 少 */
function cmpGen(r, { sign, rev, pct }) {
  const c = r.pick(sign > 0 ? MORE_CTX : LESS_CTX), nm = r.name();
  const o = r.until(() => {
    let n, d, ft;
    if (pct) { const p = pickPct(r, 5, Math.round((c.maxF || 0.5) * 100)); [n, d] = [p.n, p.d]; ft = pc(p.p); }
    else { [n, d] = r.until(() => rfrac(r, 3, 10), ([n, d]) => n / d <= (c.maxF || 0.5)); ft = frac(n, d); }
    const st = lcm(d, c.st || 1);
    if (Math.floor(c.hi / st) < Math.ceil(c.lo / st)) return {};
    const A = r.step(c.lo, c.hi, st), B = (A * (d + sign * n)) / d;
    return { A, B, n, d, ft };
  }, (o) => o.A && (!c.okB || c.okB(o.B)));
  const { A, B, n, d, ft } = o;
  const op = sign > 0 ? '+' : '-';
  const kText = pct ? `1 ${op} ${ft} = ${pc(fix(100 + sign * (n / d) * 100))}` : `1 ${op} ${frac(n, d)} = ${frac(d + sign * n, d)}`;
  const kv = pct ? pc(fix(100 + sign * (n / d) * 100)) : frac(d + sign * n, d);
  const unit1 = `把${c.one}看作单位“1”`;
  if (!rev) {
    return {
      q: c.fwd(A, ft, nm),
      answer: [num(B, { unit: c.unit })],
      steps: [`${unit1}（已知：${A} ${c.unit}）`, `${c.rel} ${ft}，${c.two}就是${c.one}的 ${kText}`, `${A} × ${kv} = ${B}（${c.unit}）`, `也可以先求${sign > 0 ? '多' : '少'}的部分：${A} × ${ft} = ${fmt((A * n) / d)}，${A} ${op} ${fmt((A * n) / d)} = ${B}`, `答：${c.fa(B)}。`],
      hint: `${c.two}是单位“1”的几分之几？`,
    };
  }
  return {
    q: c.rev(B, ft, nm),
    answer: [num(A, { unit: c.unit })],
    steps: [`${unit1}，单位“1”是未知的`, `${c.rel} ${ft}，${c.two}就是${c.one}的 ${kText}`, `等量关系：${c.one} × ${kv} = ${c.two}`, `设${c.one}为 x：${pct ? `(1 ${op} ${ft})x` : `(1 ${op} ${frac(n, d)})x`} = ${B}`, pct ? `x = ${B} ÷ ${kv} = ${B} ÷ ${fmt(1 + (sign * n) / d)} = ${A}` : `x = ${B} ÷ ${kv} = ${B} × ${frac(d, d + sign * n)} = ${A}`, `答：${c.ra(A)}。`],
    hint: '单位“1”不知道，设它为 x 列方程',
  };
}

S.push(
  {
    id: 'g6a-fmul-part', grade: 6, term: 1, unit: '分数乘法', name: '求一个数的几分之几是多少', process: true,
    tip: '找单位“1”，求单位“1”的几分之几是多少，用乘法', level: 1,
    gen(r) {
      if (r.chance(0.25)) {
        // 分数量的几分之几
        const [q, f] = r.until(() => [rfrac(r, 2, 9), rfrac(r, 2, 9)], ([q, f]) => gcd(q[0], f[1]) > 1 || gcd(f[0], q[1]) > 1);
        const res = Fr.mul(q, f);
        const t = r.pick([
          { s: `一桶油重 ${F(q)} 吨，用去了它的 ${F(f)}。用去了多少吨？`, u: '吨', one: '这桶油的质量', a: '用去了' },
          { s: `一块地有 ${F(q)} 公顷，其中 ${F(f)} 种玉米。种玉米的地有多少公顷？`, u: '公顷', one: '这块地的面积', a: '种玉米的地有' },
          { s: `一根绳子长 ${F(q)} 米，剪下它的 ${F(f)} 做跳绳。剪下了多少米？`, u: '米', one: '绳子的全长', a: '剪下了' },
          { s: `一瓶果汁有 ${F(q)} 升，${r.name()}喝了这瓶果汁的 ${F(f)}。喝了多少升？`, u: '升', one: '这瓶果汁', a: '喝了' },
        ]);
        return {
          q: t.s, answer: [faX(res, { unit: t.u })],
          steps: [`把${t.one}看作单位“1”`, `求 ${F(q)} 的 ${F(f)} 是多少，用乘法`, mulLine(q, f) + `（${t.u}）`, `答：${t.a} ${F(res)} ${t.u}。`],
          hint: '求一个数的几分之几是多少，用乘法',
        };
      }
      return partGen(r, { rev: false, pct: false });
    },
  },
  {
    id: 'g6a-fmul-chain', grade: 6, term: 1, unit: '分数乘法', name: '连续求一个数的几分之几', process: true,
    tip: '两个分率的单位“1”不同：先求出第一个量，它又是下一个分率的单位“1”', level: 2,
    gen(r) {
      const nm = r.name();
      const ctxs = [
        { lo: 120, hi: 480, gMin: 0.5, u: '页', q: (T, f, g) => `${nm}看一本 ${T} 页的书，第一天看了全书的 ${f}，第二天看的页数是第一天的 ${g}。第二天看了多少页？`, s1: '全书的页数', x1: '第一天看的页数', a: (x) => `第二天看了 ${x} 页` },
        { lo: 400, hi: 1600, fMin: 0.4, fMax: 0.6, u: '人', q: (T, f, g) => `某校有学生 ${T} 人，男生占 ${f}，男生中有 ${g} 参加了足球兴趣小组。参加足球兴趣小组的男生有多少人？`, s1: '全校学生人数', x1: '男生人数', a: (x) => `参加的男生有 ${x} 人` },
        { lo: 300, hi: 1500, fMin: 0.5, u: '只', q: (T, f, g) => `养鸡场养鸡 ${T} 只，其中母鸡占 ${f}，母鸡中有 ${g} 是芦花鸡。芦花母鸡有多少只？`, s1: '鸡的总只数', x1: '母鸡的只数', a: (x) => `芦花母鸡有 ${x} 只` },
        { lo: 120, hi: 600, u: '元', q: (T, f, g) => `${nm}有 ${T} 元零花钱，用其中的 ${f} 买书，买文具用的钱是买书的 ${g}。买文具用了多少元？`, s1: '零花钱总数', x1: '买书用的钱', a: (x) => `买文具用了 ${x} 元` },
        { lo: 600, hi: 3000, fMax: 0.5, gMin: 0.5, u: '米', q: (T, f, g) => `一条路长 ${T} 米，第一周修了全长的 ${f}，第二周修的是第一周的 ${g}。第二周修了多少米？`, s1: '路的全长', x1: '第一周修的长度', a: (x) => `第二周修了 ${x} 米` },
      ];
      const c = r.pick(ctxs);
      const { f, g, T: tot } = r.until(() => {
        const f = rfrac(r, 2, 8), g = rfrac(r, 2, 8), st = f[1] * g[1];
        if (Math.floor(c.hi / st) < Math.ceil(c.lo / st)) return {};
        if (Fr.val(f) < (c.fMin || 0) || Fr.val(f) > (c.fMax || 1) || Fr.val(g) < (c.gMin || 0)) return {};
        return { f, g, T: r.step(c.lo, c.hi, st) };
      }, (o) => o.T);
      const x1 = (tot * f[0]) / f[1], x2 = (x1 * g[0]) / g[1];
      return {
        q: c.q(tot, F(f), F(g)), answer: [num(x2, { unit: c.u })],
        steps: [`第一个分率 ${F(f)} 的单位“1”是${c.s1}：${tot} × ${F(f)} = ${x1}（${c.u}），这是${c.x1}`, `第二个分率 ${F(g)} 的单位“1”是${c.x1}：${x1} × ${F(g)} = ${x2}（${c.u}）`, `综合算式：${tot} × ${F(f)} × ${F(g)} = ${x2}`, `答：${c.a(x2)}。`],
        hint: '两个分率分别是谁的几分之几？',
      };
    },
  },
  {
    id: 'g6a-fmul-more', grade: 6, term: 1, unit: '分数乘法', name: '比一个数多几分之几的数', process: true,
    tip: '比单位“1”多几分之几，就是单位“1”的（1 + 几分之几）', level: 2,
    gen(r) { return cmpGen(r, { sign: 1, rev: false, pct: false }); },
  },
  {
    id: 'g6a-fmul-less', grade: 6, term: 1, unit: '分数乘法', name: '比一个数少几分之几的数', process: true,
    tip: '比单位“1”少几分之几，就是单位“1”的（1 - 几分之几）', level: 2,
    gen(r) { return cmpGen(r, { sign: -1, rev: false, pct: false }); },
  },
);

// ---------------- 上册 2 位置与方向（二） ----------------
const DIRS = ['北偏东', '北偏西', '南偏东', '南偏西'];
const oppDir = (d) => ({ 北偏东: '南偏西', 北偏西: '南偏东', 南偏东: '北偏西', 南偏西: '北偏东' }[d]);
S.push(
  {
    id: 'g6a-dir-read', grade: 6, term: 1, unit: '位置与方向（二）', name: '看图说方向和距离',
    tip: '先看离南北哪条线近：从正北（或正南）开始，向东（或西）偏了多少度', level: 1,
    gen(r) {
      const dir = r.pick(DIRS), deg = r.step(20, 70, 5), cm = r.int(2, 6), per = r.pick([50, 100, 200, 300, 500]);
      return {
        q: `看图：A 点在 O 点的 {0} {1}° 方向上，距离 O 点 {2} 米。（图上 OA 长 ${cm} 厘米，图上 1 厘米表示实际 ${per} 米）`,
        fig: dirFig(dir, deg),
        answer: [choice(DIRS, dir, { label: '方向' }), num(deg, { label: '度数' }), num(cm * per, { label: '距离' })],
        steps: [`OA 和${dir[0]}方向的线夹着 ${deg}° 的角，是从正${dir[0]}方向向${dir[2]}偏了 ${deg}°`, `所以方向是${dir} ${deg}°`, `实际距离：${cm} × ${per} = ${cm * per}（米）`, `答：A 点在 O 点的${dir} ${deg}° 方向上，距离 O 点 ${cm * per} 米。`],
        hint: '先说靠近的“北”或“南”，再说偏向“东”还是“西”',
      };
    },
  },
  {
    id: 'g6a-dir-relative', grade: 6, term: 1, unit: '位置与方向（二）', name: '相对位置（反过来说方向）',
    tip: '两地的位置是相对的：方向正好相反（北↔南、东↔西），度数和距离不变', level: 2,
    gen(r) {
      const dir = r.pick(DIRS), deg = r.step(10, 80, 5), dist = r.step(200, 3000, 100);
      const [A, B] = r.pick([['学校', '小明家'], ['图书馆', '体育馆'], ['灯塔', '轮船'], ['少年宫', '电影院'], ['医院', '公园'], ['超市', '邮局']]);
      const ans = `${oppDir(dir)} ${deg}°`;
      const opts = r.shuffle([ans, `${dir} ${deg}°`, `${dir[0] === '北' ? '南' : '北'}偏${dir[2]} ${deg}°`, `${oppDir(dir)} ${90 - deg}°`]);
      if (deg === 45) opts.splice(opts.indexOf(`${oppDir(dir)} ${90 - deg}°`), 1, `${dir[0]}偏${dir[2] === '东' ? '西' : '东'} ${deg}°`);
      return {
        q: `${A}在${B}的${dir} ${deg}° 方向 ${dist} 米处。那么${B}在${A}的什么方向 ${dist} 米处？`,
        answer: [choice(opts, ans)],
        steps: [`换成站在${A}看${B}，观察点变了，方向要反过来`, `${dir[0]}变${dir[0] === '北' ? '南' : '北'}，${dir[2]}变${dir[2] === '东' ? '西' : '东'}：${dir} → ${oppDir(dir)}`, `偏的度数 ${deg}° 和距离 ${dist} 米都不变`, `答：${B}在${A}的${ans}方向 ${dist} 米处。`],
        hint: '站到另一个地方去看，方向会怎样变？',
      };
    },
  },
);

// ---------------- 上册 3 分数除法 ----------------
S.push(
  {
    id: 'g6a-fdiv-recip', grade: 6, term: 1, unit: '分数除法', name: '求倒数',
    tip: '乘积是 1 的两个数互为倒数；分数交换分子和分母的位置', level: 1, speed: 8,
    gen(r) {
      const t = r.pick(['frac', 'frac', 'int', 'mixed', 'dec', 'imp']);
      let x, xs, steps;
      if (t === 'frac') { x = rfrac(r, 2, 15); xs = F(x); steps = ['真分数求倒数：把分子和分母交换位置']; }
      else if (t === 'imp') { x = rfracAny(r, 2, 12, 1); xs = F(x); steps = ['假分数求倒数：把分子和分母交换位置']; }
      else if (t === 'int') { const k = r.int(2, 30); x = [k, 1]; xs = String(k); steps = [`整数 ${k} 可以看成 ${frac(k, 1)}，交换分子分母得 ${frac(1, k)}`]; }
      else if (t === 'mixed') { const [n, d] = rfrac(r, 2, 9), w = r.int(1, 4); x = [w * d + n, d]; xs = mixed(w, n, d); steps = [`带分数先化成假分数：${xs} = ${frac(x[0], d)}`, '再交换分子和分母']; }
      else {
        const [dv, fx] = r.pick([[0.25, [1, 4]], [0.5, [1, 2]], [0.2, [1, 5]], [0.125, [1, 8]], [1.25, [5, 4]], [2.5, [5, 2]], [0.75, [3, 4]], [0.4, [2, 5]], [0.1, [1, 10]], [1.5, [3, 2]], [0.6, [3, 5]], [0.8, [4, 5]]]);
        x = fx; xs = fmt(dv); steps = [`小数先化成分数：${xs} = ${F(fx)}`, '再交换分子和分母'];
      }
      const inv = Fr.inv(x);
      steps.push(`${xs} 的倒数是 ${F(inv)}`, `检验：${xs} × ${F(inv)} = 1 ✓`);
      return { q: `${xs} 的倒数是 {0}`, answer: [faX(inv)], steps, hint: '想：它乘几等于 1？' };
    },
  },
  {
    id: 'g6a-fdiv-int', grade: 6, term: 1, unit: '分数除法', name: '分数除以整数',
    tip: '除以一个数（0 除外）等于乘这个数的倒数', level: 1, speed: 20,
    gen(r) {
      const k = r.int(2, 9);
      const x = r.chance(0.55) ? r.until(() => rfracAny(r, 2, 12, 0.35), (x) => gcd(x[0], k) > 1) : r.until(() => rfracAny(r, 2, 12, 0.2), (x) => gcd(x[0], k) === 1);
      const res = Fr.div(x, [k, 1]);
      const steps = ['除以一个数（0 除外），等于乘这个数的倒数', `${F(x)} ÷ ${k} = ${F(x)} × ${frac(1, k)}`];
      steps.push(gcd(x[0], k) > 1 ? `分子 ${x[0]} 和 ${k} 先约分（同时除以 ${gcd(x[0], k)}），得 ${F(res)}${mixNote(res)}` : `分子不变，分母 ${x[1]} × ${k} = ${x[1] * k}，得 ${F(res)}${mixNote(res)}`);
      return { q: `${F(x)} ÷ ${k} = {0}`, answer: [faX(res)], steps, hint: `除以 ${k} 就是乘 ${k} 的倒数` };
    },
  },
  {
    id: 'g6a-fdiv-frac', grade: 6, term: 1, unit: '分数除法', name: '一个数除以分数',
    tip: '被除数不变，除号变乘号，除数变成它的倒数', level: 1, speed: 25,
    gen(r) {
      const b = rfracAny(r, 2, 12, 0.2);
      const a = r.chance(0.3) ? [r.until(() => r.int(2, 30), (k) => b[0] === 1 || gcd(k, b[0]) > 1), 1] : r.until(() => rfracAny(r, 2, 12, 0.3), (a) => a[1] !== b[1] || a[0] !== b[0]);
      const res = Fr.div(a, b), inv = Fr.inv(b), m = mulExplain(a, inv);
      const steps = ['除以一个分数，等于乘这个分数的倒数', `${F(a)} ÷ ${F(b)} = ${F(a)} × ${F(inv)}`];
      if (m.notes.length) steps.push(`先约分：${m.notes.join('，')}`);
      steps.push(`= ${F(res)}${mixNote(res)}`);
      steps.push('易错：只把除数变成倒数，被除数不变');
      return { q: `${F(a)} ÷ ${F(b)} = {0}`, answer: [faX(res)], steps, hint: '先把除法变成乘法' };
    },
  },
  {
    id: 'g6a-fdiv-ops', grade: 6, term: 1, unit: '分数除法', name: '分数四则混合运算',
    tip: '先乘除后加减，同级运算从左往右，有括号先算括号里的', level: 2,
    gen(r) {
      const t = r.int(1, 5);
      let q, res, steps;
      const nice = (x) => x[1] <= 36 && x[0] <= 120;
      if (t === 1) {
        const [a, b, c] = r.until(() => [rfrac(r, 2, 10), rfracAny(r, 2, 10), rfrac(r, 2, 10)], ([a, b, c]) => { const ab = Fr.div(a, b); return nice(ab) && Fr.val(ab) > Fr.val(c) && ab[1] !== c[1] && ab[1] > 1; });
        const ab = Fr.div(a, b); q = `${F(a)} ÷ ${F(b)} - ${F(c)}`; res = Fr.sub(ab, c);
        steps = ['先算除法，再算减法', divLine(a, b), addLine(ab, c, '-')];
      } else if (t === 2) {
        const [a, b, c] = r.until(() => [rfrac(r, 2, 9), rfrac(r, 2, 9), rfrac(r, 2, 10)], ([a, b, c]) => a[1] !== b[1] && nice(Fr.div(Fr.add(a, b), c)));
        const ab = Fr.add(a, b); q = `(${F(a)} + ${F(b)}) ÷ ${F(c)}`; res = Fr.div(ab, c);
        steps = ['先算括号里的加法，再算除法', addLine(a, b, '+'), divLine(ab, c)];
      } else if (t === 3) {
        const [a, b, c] = r.until(() => [rfrac(r, 2, 10), rfrac(r, 2, 10), rfracAny(r, 2, 10)], ([a, b, c]) => nice(Fr.div(a, b)) && nice(Fr.mul(Fr.div(a, b), c)));
        const ab = Fr.div(a, b); q = `${F(a)} ÷ ${F(b)} × ${F(c)}`; res = Fr.mul(ab, c);
        steps = ['只有乘除，按从左往右的顺序算（不能先算后面的乘法）', divLine(a, b), mulLine(ab, c)];
      } else if (t === 4) {
        const [a, b, c] = r.until(() => [rfracAny(r, 2, 10, 0.4), rfrac(r, 2, 10), rfracAny(r, 2, 10, 0.4)], ([a, b, c]) => { const bc = Fr.div(b, c); return nice(bc) && Fr.val(a) > Fr.val(bc) && a[1] !== bc[1]; });
        const bc = Fr.div(b, c); q = `${F(a)} - ${F(b)} ÷ ${F(c)}`; res = Fr.sub(a, bc);
        steps = ['先算除法，再算减法', divLine(b, c), addLine(a, bc, '-')];
      } else {
        const [a, b, c] = r.until(() => [rfrac(r, 2, 10), rfrac(r, 2, 10), rfrac(r, 2, 10)], ([a, b, c]) => a[1] !== b[1] && Fr.val(a) > Fr.val(b) && nice(Fr.div(c, Fr.sub(a, b))));
        const ab = Fr.sub(a, b); q = `${F(c)} ÷ (${F(a)} - ${F(b)})`; res = Fr.div(c, ab);
        steps = ['先算括号里的减法，再算除法', addLine(a, b, '-'), divLine(c, ab)];
      }
      steps.push(`结果：${F(res)}${mixNote(res)}`);
      return { q: `${q} = {0}`, answer: [faX(res)], steps, hint: '先想好运算顺序，除法要变成乘倒数' };
    },
  },
  {
    id: 'g6a-fdiv-whole', grade: 6, term: 1, unit: '分数除法', name: '已知一个数的几分之几，求这个数', process: true,
    tip: '单位“1”未知：设它为 x 列方程，或用 已知量 ÷ 对应分率', level: 2,
    gen(r) { return partGen(r, { rev: true, pct: false }); },
  },
  {
    id: 'g6a-fdiv-more', grade: 6, term: 1, unit: '分数除法', name: '已知比一个数多几分之几，求这个数', process: true,
    tip: '已知量对应的分率是（1 + 几分之几），单位“1” = 已知量 ÷（1 + 几分之几）', level: 2,
    gen(r) { return cmpGen(r, { sign: 1, rev: true, pct: false }); },
  },
  {
    id: 'g6a-fdiv-less', grade: 6, term: 1, unit: '分数除法', name: '已知比一个数少几分之几，求这个数', process: true,
    tip: '已知量对应的分率是（1 - 几分之几），单位“1” = 已知量 ÷（1 - 几分之几）', level: 2,
    gen(r) { return cmpGen(r, { sign: -1, rev: true, pct: false }); },
  },
  {
    id: 'g6a-fdiv-equation', grade: 6, term: 1, unit: '分数除法', name: '解方程（含分数）',
    tip: '根据等式的性质：两边同时乘或除以同一个数（0 除外）；x 的系数是分数时，两边同时除以这个分数', level: 2,
    gen(r) {
      const t = r.int(1, 5);
      let q, x, steps;
      if (t === 1) {
        const a = rfracAny(r, 2, 9, 0.3); x = r.chance(0.4) ? [r.int(2, 20), 1] : rfrac(r, 2, 9);
        const c = Fr.mul(a, x);
        q = `${F(a)}x = ${F(c)}`;
        steps = [`方程两边同时除以 ${F(a)}`, `x = ${F(c)} ÷ ${F(a)}`, `x = ${F(c)} × ${F(Fr.inv(a))} = ${F(x)}`];
      } else if (t === 2) {
        const a = rfrac(r, 2, 9); x = r.until(() => rfracAny(r, 2, 12, 0.3), (x) => true);
        const c = Fr.div(x, a);
        q = `x ÷ ${F(a)} = ${F(c)}`;
        steps = [`方程两边同时乘 ${F(a)}`, `x = ${F(c)} × ${F(a)}`, `x = ${F(x)}`];
      } else if (t === 3 || t === 4) {
        const [n, d] = rfrac(r, 2, 9), sign = t === 3 ? 1 : -1;
        const xv = d * r.int(2, 12), M = (xv * (d + sign * n)) / d; x = [xv, 1];
        const op = sign > 0 ? '+' : '-';
        q = `x ${op} ${frac(n, d)}x = ${M}`;
        steps = [`先合并左边：x ${op} ${frac(n, d)}x = (1 ${op} ${frac(n, d)})x = ${frac(d + sign * n, d)}x`, `${frac(d + sign * n, d)}x = ${M}`, `x = ${M} ÷ ${frac(d + sign * n, d)} = ${M} × ${frac(d, d + sign * n)} = ${xv}`];
      } else {
        const [n, d] = rfrac(r, 2, 9), xv = d * r.int(1, 10), k = r.int(1, 20), M = (xv * n) / d + k; x = [xv, 1];
        q = `${frac(n, d)}x + ${k} = ${M}`;
        steps = [`先把 ${frac(n, d)}x 看成一个整体：两边同时减去 ${k}`, `${frac(n, d)}x = ${M - k}`, `x = ${M - k} ÷ ${frac(n, d)} = ${M - k} × ${frac(d, n)} = ${xv}`];
      }
      steps.push(`检验：把 x = ${F(x)} 代回原方程，左右两边相等 ✓`);
      return { q: `解方程：${q}，x = {0}`, answer: [faX(x)], steps, hint: '想一想：x 被怎样运算了？反过来算回去' };
    },
  },
  {
    id: 'g6a-fdiv-sum', grade: 6, term: 1, unit: '分数除法', name: '已知两个数的和及分率求两个数', process: true,
    tip: '设单位“1”的量为 x，另一个量用分率表示，根据“和”列方程', level: 2,
    gen(r) {
      const [a, b] = r.names(2);
      const f = rfrac(r, 2, 9);
      const c = r.pick([
        { u: '棵', lo: 40, hi: 300, s: (S) => `果园里桃树和杏树一共有 ${S} 棵，杏树的棵数是桃树的 ${F(f)}。桃树和杏树各有多少棵？`, x: '桃树', y: '杏树' },
        { u: '张', lo: 20, hi: 200, s: (S) => `${a}和${b}一共有邮票 ${S} 张，${b}的张数是${a}的 ${F(f)}。两人各有多少张？`, x: a, y: b },
        { u: '棵', lo: 30, hi: 200, s: (S) => `六年级一班和二班一共植树 ${S} 棵，二班植树的棵数是一班的 ${F(f)}。两个班各植树多少棵？`, x: '一班', y: '二班' },
        { u: '本', lo: 100, hi: 900, s: (S) => `图书角有故事书和科技书一共 ${S} 本，科技书的本数是故事书的 ${F(f)}。故事书和科技书各有多少本？`, x: '故事书', y: '科技书' },
        { u: '厘米', lo: 20, hi: 120, peri: true, s: (S) => `一个长方形的周长是 ${2 * S} 厘米，宽是长的 ${F(f)}。这个长方形的长和宽各是多少厘米？`, x: '长', y: '宽' },
      ]);
      const st = f[0] + f[1];
      const X = f[1] * r.int(Math.max(1, Math.ceil(c.lo / st)), Math.max(1, Math.floor(c.hi / st))), Y = (X * f[0]) / f[1], Sm = X + Y;
      const steps = [];
      if (c.peri) steps.push(`长方形的周长是 ${2 * Sm} 厘米，长 + 宽 = ${2 * Sm} ÷ 2 = ${Sm}（厘米）`);
      steps.push(`把${c.x}看作单位“1”，设${c.x}是 x ${c.u}，${c.y}就是 ${F(f)}x ${c.u}`);
      steps.push(`列方程：x + ${F(f)}x = ${Sm}`, `${frac(f[1] + f[0], f[1])}x = ${Sm}，x = ${Sm} ÷ ${frac(f[1] + f[0], f[1])} = ${X}`, `${c.y}：${X} × ${F(f)} = ${Y}（${c.u}）`, `答：${c.x}是 ${X} ${c.u}，${c.y}是 ${Y} ${c.u}。`);
      return {
        q: c.s(Sm), answer: [num(X, { label: c.x, unit: c.u }), num(Y, { label: c.y, unit: c.u })], steps,
        fig: fig.bars([{ label: c.x, units: f[1], text: '' }, { label: c.y, units: f[0], text: '' }], { unitW: Math.min(40, Math.floor(320 / f[1])) }),
        hint: '谁是单位“1”？把它设为 x',
      };
    },
  },
  {
    id: 'g6a-fdiv-diff', grade: 6, term: 1, unit: '分数除法', name: '已知两个数的差及分率求两个数', process: true,
    tip: '设单位“1”的量为 x，根据“相差多少”列方程：x - 几分之几x = 差', level: 2,
    gen(r) {
      const [a, b] = r.names(2);
      const f = rfrac(r, 2, 9);
      const c = r.pick([
        { u: '张', s: (D) => `${a}的邮票比${b}多 ${D} 张，${b}的张数是${a}的 ${F(f)}。两人各有多少张邮票？`, x: a, y: b },
        { u: '棵', s: (D) => `果园里苹果树比梨树多 ${D} 棵，梨树的棵数是苹果树的 ${F(f)}。苹果树和梨树各有多少棵？`, x: '苹果树', y: '梨树' },
        { u: '厘米', s: (D) => `一个长方形的长比宽多 ${D} 厘米，宽是长的 ${F(f)}。这个长方形的长和宽各是多少厘米？`, x: '长', y: '宽' },
        { u: '人', s: (D) => `某校参加合唱队的女生比男生多 ${D} 人，男生人数是女生的 ${F(f)}。合唱队男生、女生各有多少人？`, x: '女生', y: '男生' },
        { u: '千克', s: (D) => `商店运来的苹果比香蕉多 ${D} 千克，香蕉的质量是苹果的 ${F(f)}。苹果和香蕉各运来多少千克？`, x: '苹果', y: '香蕉' },
      ]);
      const diffParts = f[1] - f[0];
      const k = r.int(2, Math.max(2, Math.floor(60 / diffParts))), X = f[1] * k, Y = f[0] * k, D = X - Y;
      return {
        q: c.s(D), answer: [num(X, { label: c.x, unit: c.u }), num(Y, { label: c.y, unit: c.u })],
        fig: fig.bars([{ label: c.x, units: f[1], text: '' }, { label: c.y, units: f[0], text: `少 ${D}${c.u}` }], { unitW: Math.min(40, Math.floor(320 / f[1])) }),
        steps: [`把${c.x}看作单位“1”，设${c.x}是 x ${c.u}，${c.y}就是 ${F(f)}x ${c.u}`, `${c.x}比${c.y}多 ${D} ${c.u}：x - ${F(f)}x = ${D}`, `${frac(diffParts, f[1])}x = ${D}，x = ${D} ÷ ${frac(diffParts, f[1])} = ${X}`, `${c.y}：${X} × ${F(f)} = ${Y}（${c.u}）`, `答：${c.x}是 ${X} ${c.u}，${c.y}是 ${Y} ${c.u}。`],
        hint: '相差的数量对应单位“1”的几分之几？',
      };
    },
  },
);

// ---------------- 上册 4 比 ----------------
/** 有限小数的位数 */
const dp = (x) => { const s = fmt(x); const i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1; };
S.push(
  {
    id: 'g6a-ratio-relation', grade: 6, term: 1, unit: '比', name: '比与分数、除法的关系',
    tip: '比的前项 ↔ 分子 ↔ 被除数，后项 ↔ 分母 ↔ 除数；比的后项不能是 0', level: 1,
    gen(r) {
      const [a, b] = r.until(() => rfracAny(r, 2, 12, 0.3), ([a, b]) => b > 1);
      const [k1, k2] = r.sample([2, 3, 4, 5, 6, 7, 8], 2);
      const dec = [2, 4, 5, 8, 10, 20, 25].includes(b) && r.chance(0.5);
      const q = `${frac(a, b)} = ${a * k1} : {0} = {1} ÷ ${b * k2}` + (dec ? ' = {2}（填小数）' : '');
      const answer = [num(b * k1), num(a * k2)];
      if (dec) answer.push(num(a / b));
      const steps = [`${frac(a, b)} = ${a} : ${b} = ${a} ÷ ${b}`, `比的前项 ${a} 变成 ${a * k1}，乘了 ${k1}，后项也乘 ${k1}：${b} × ${k1} = ${b * k1}`, `除数 ${b} 变成 ${b * k2}，乘了 ${k2}，被除数也乘 ${k2}：${a} × ${k2} = ${a * k2}`];
      if (dec) steps.push(`化成小数：${a} ÷ ${b} = ${fmt(a / b)}`);
      steps.push('依据：比的基本性质、商不变的规律、分数的基本性质，道理是一样的');
      return { q, answer, steps, hint: '看前项（或除数）乘了几，另一个数也乘几' };
    },
  },
  {
    id: 'g6a-ratio-property', grade: 6, term: 1, unit: '比', name: '比的基本性质填空',
    tip: '比的前项和后项同时乘或除以相同的数（0 除外），比值不变', level: 1,
    gen(r) {
      const [a, b] = r.until(() => [r.int(1, 12), r.int(1, 12)], ([a, b]) => a !== b && gcd(a, b) === 1);
      const g = r.int(2, 9), [k1, k2] = r.sample([2, 3, 4, 5, 6, 8, 10].filter((k) => k !== g), 2);
      const t = r.int(1, 3);
      let left, note;
      if (t === 1) { left = `${a * g} : ${b * g}`; note = `${a * g} : ${b * g} 的前项和后项同时除以 ${g}，等于 ${a} : ${b}`; }
      else if (t === 2) { left = `${fmt((a * g) / 10)} : ${fmt((b * g) / 10)}`; note = `前项和后项同时乘 10 再同时除以 ${g}，${left} = ${a} : ${b}`; }
      else { left = `${a} : ${b}`; note = `${a} : ${b} 已经是最简整数比`; }
      return {
        q: `${left} = {0} : ${b * k1} = ${a * k2} : {1}`,
        answer: [num(a * k1), num(b * k2)],
        steps: [note, `后项 ${b} → ${b * k1}，乘了 ${k1}，前项也乘 ${k1}：${a} × ${k1} = ${a * k1}`, `前项 ${a} → ${a * k2}，乘了 ${k2}，后项也乘 ${k2}：${b} × ${k2} = ${b * k2}`, '比的前项和后项要同时乘或除以同一个数，比值才不变'],
        hint: '先把左边的比化简，再看乘了几',
      };
    },
  },
  {
    id: 'g6a-ratio-value', grade: 6, term: 1, unit: '比', name: '求比值',
    tip: '比值 = 前项 ÷ 后项，结果是一个数（整数、小数或分数）', level: 1, speed: 25,
    gen(r) {
      const t = r.pick(['int', 'int', 'dec', 'frac']);
      let q, val, steps;
      if (t === 'int') {
        const [a, b] = r.until(() => [r.int(1, 15), r.int(1, 15)], ([a, b]) => a !== b && gcd(a, b) === 1);
        const g = r.int(2, 20); q = `${a * g} : ${b * g}`; val = [a, b];
        steps = [`比值 = 前项 ÷ 后项：${a * g} ÷ ${b * g} = ${F(val)}`];
      } else if (t === 'dec') {
        const [a, b] = r.until(() => [r.int(1, 12), r.int(1, 12)], ([a, b]) => a !== b && gcd(a, b) === 1);
        const g = r.int(2, 15), k = r.pick([10, 100]);
        const A = (a * g) / k, B = (b * g) / k;
        q = `${fmt(A)} : ${fmt(B)}`; val = [a, b];
        steps = [`比值 = 前项 ÷ 后项：${fmt(A)} ÷ ${fmt(B)}`, `被除数和除数同时扩大 ${k} 倍：${a * g} ÷ ${b * g} = ${F(val)}`];
      } else {
        const x = rfracAny(r, 2, 10, 0.2), y = r.until(() => rfrac(r, 2, 10), (y) => y[1] !== x[1]);
        q = `${F(x)} : ${F(y)}`; val = Fr.div(x, y);
        steps = [`比值 = 前项 ÷ 后项：${divLine(x, y)}`];
      }
      if (val[1] > 1 && [2, 4, 5, 8, 10].includes(val[1])) steps.push(`比值也可以写成小数 ${fmt(val[0] / val[1])}`);
      steps.push('注意：求比值得到的是一个数，化简比得到的是一个比');
      return { q: `${q} 的比值是 {0}`, answer: [faX(val)], steps, hint: '比值 = 前项 ÷ 后项' };
    },
  },
  {
    id: 'g6a-ratio-simp-int', grade: 6, term: 1, unit: '比', name: '化简整数比',
    tip: '前项和后项同时除以它们的最大公因数，化成最简整数比', level: 1, speed: 25,
    gen(r) {
      const [a, b] = r.until(() => [r.int(1, 15), r.int(1, 15)], ([a, b]) => a !== b && gcd(a, b) === 1);
      const g = r.until(() => r.int(2, 40), (g) => a * g <= 600 && b * g <= 600);
      return {
        q: `化简比：${a * g} : ${b * g} = {0}`,
        answer: [ratioAns(a, b)],
        steps: [`${a * g} 和 ${b * g} 的最大公因数是 ${g}`, `前项、后项同时除以 ${g}：${a * g} ÷ ${g} = ${a}，${b * g} ÷ ${g} = ${b}`, `${a * g} : ${b * g} = ${a} : ${b}`, `检查：${a} 和 ${b} 只有公因数 1，已经是最简整数比`],
        hint: '找前项和后项的最大公因数（不确定就一次次地同时除以公因数）',
      };
    },
  },
  {
    id: 'g6a-ratio-simp-dec', grade: 6, term: 1, unit: '比', name: '化简小数比',
    tip: '先把前项和后项同时乘 10、100……化成整数比，再约简', level: 1,
    gen(r) {
      const { A, B, a, b } = r.until(() => {
        const [a, b] = [r.int(1, 12), r.int(1, 12)];
        const g = r.int(1, 25), k = r.pick([10, 100]);
        return { a, b, A: (a * g) / k, B: (b * g) / k };
      }, (o) => o.a !== o.b && gcd(o.a, o.b) === 1 && (dp(o.A) > 0 || dp(o.B) > 0) && o.A > 0 && o.B > 0);
      const m = 10 ** Math.max(dp(A), dp(B)), IA = Math.round(A * m), IB = Math.round(B * m), g = gcd(IA, IB);
      const steps = [`${fmt(A)} 和 ${fmt(B)} 中小数位数最多的是 ${Math.max(dp(A), dp(B))} 位，前项、后项同时乘 ${m}`, `${fmt(A)} : ${fmt(B)} = ${IA} : ${IB}`];
      if (g > 1) steps.push(`再同时除以最大公因数 ${g}：${IA} : ${IB} = ${a} : ${b}`);
      steps.push(`结果：${a} : ${b}（最简整数比的前项、后项都是整数，而且只有公因数 1）`);
      return { q: `化简比：${fmt(A)} : ${fmt(B)} = {0}`, answer: [ratioAns(a, b)], steps, hint: '先去掉小数点：同时乘 10 还是 100？' };
    },
  },
  {
    id: 'g6a-ratio-simp-frac', grade: 6, term: 1, unit: '比', name: '化简分数比',
    tip: '前项和后项同时乘分母的最小公倍数，化成整数比再约简', level: 1,
    gen(r) {
      const t = r.pick(['ff', 'ff', 'if']);
      let x, y;
      if (t === 'ff') { x = rfracAny(r, 2, 12, 0.2); y = r.until(() => rfracAny(r, 2, 12, 0.2), (y) => y[1] !== x[1] && Fr.val(y) !== Fr.val(x)); }
      else { const f = rfrac(r, 2, 9), k = r.int(1, 9); [x, y] = r.bool() ? [[k, 1], f] : [f, [k, 1]]; }
      const L = lcm(x[1], y[1]), IA = (x[0] * L) / x[1], IB = (y[0] * L) / y[1], g = gcd(IA, IB);
      const steps = [`分母 ${x[1]} 和 ${y[1]} 的最小公倍数是 ${L}，前项、后项同时乘 ${L}`, `${F(x)} : ${F(y)} = ${IA} : ${IB}`];
      if (g > 1) steps.push(`再同时除以 ${g}：${IA} : ${IB} = ${IA / g} : ${IB / g}`);
      steps.push(`也可以先求比值：${divLine(x, y)}，再写成比 ${IA / g} : ${IB / g}`);
      return { q: `化简比：${F(x)} : ${F(y)} = {0}`, answer: [ratioAns(IA, IB)], steps, hint: '同时乘几能把两个分母都去掉？' };
    },
  },
  {
    id: 'g6a-ratio-simp-unit', grade: 6, term: 1, unit: '比', name: '化简单位不同的比',
    tip: '先把两个量化成相同的单位，再化简；化简后的比不带单位', level: 2,
    gen(r) {
      const U = r.pick([
        { big: '千克', small: '克', k: 1000, B: () => r.step(50, 900, 50) },
        { big: '米', small: '厘米', k: 100, B: () => r.step(5, 90, 5) },
        { big: '千米', small: '米', k: 1000, B: () => r.step(50, 900, 50) },
        { big: '时', small: '分', k: 60, B: () => r.step(5, 55, 5) },
        { big: '升', small: '毫升', k: 1000, B: () => r.step(50, 900, 50) },
        { big: '吨', small: '千克', k: 1000, B: () => r.step(50, 900, 50) },
        { big: '平方米', small: '平方分米', k: 100, B: () => r.step(5, 90, 5) },
      ]);
      const { A, Bv, x, y } = r.until(() => {
        const A = r.pick(U.k === 60 ? [0.5, 1, 1.5, 2, 2.5, 3, 0.25, 0.75] : [0.2, 0.25, 0.4, 0.5, 0.6, 0.75, 0.8, 1, 1.2, 1.5, 2, 2.5, 3, 4]), Bv = U.B();
        const [x, y] = simplify(Math.round(A * U.k), Bv);
        return { A, Bv, x, y };
      }, (o) => o.x <= 60 && o.y <= 60 && o.x !== o.y);
      const big = Math.round(A * U.k), bigFirst = r.bool();
      const q = bigFirst ? `${fmt(A)} ${U.big} : ${Bv} ${U.small}` : `${Bv} ${U.small} : ${fmt(A)} ${U.big}`;
      const [p1, p2] = bigFirst ? [big, Bv] : [Bv, big];
      const g = gcd(p1, p2);
      return {
        q: `化简比：${q} = {0}`,
        answer: [ratioAns(p1, p2)],
        steps: [`单位不同，先统一成${U.small}：1 ${U.big} = ${U.k} ${U.small}，${fmt(A)} ${U.big} = ${big} ${U.small}`, `${p1} : ${p2}，同时除以最大公因数 ${g}`, `= ${p1 / g} : ${p2 / g}`, '易错：不统一单位就直接化简是错的；化简后的比不写单位'],
        hint: `先把${U.big}化成${U.small}`,
      };
    },
  },
);

/** 按比分配 / 已知比求量的情境 */
S.push(
  {
    id: 'g6a-ratio-share', grade: 6, term: 1, unit: '比', name: '按比分配（两个量）', process: true,
    tip: '先求总份数，再求每个量占总数的几分之几（或先求一份是多少）', level: 1,
    gen(r) {
      const [n1, n2] = r.names(2);
      const c = r.pick([
        { lo: 60, hi: 600, u: '本', x: '五年级', y: '六年级', s: (T, a, b) => `学校把 ${T} 本图书按 ${a} : ${b} 分给五年级和六年级。两个年级各分到多少本？` },
        { lo: 100, hi: 1000, u: '克', x: '糖', y: '水', small: true, s: (T, a, b) => `配制一种糖水，糖和水的质量比是 ${a} : ${b}。要配制 ${T} 克这种糖水，需要糖和水各多少克？` },
        { lo: 32, hi: 50, u: '人', x: '男生', y: '女生', near: true, s: (T, a, b) => `六（1）班有 ${T} 人，男生和女生人数的比是 ${a} : ${b}。男生、女生各有多少人？` },
        { lo: 300, hi: 3000, st: 10, u: '米', x: '甲队', y: '乙队', s: (T, a, b) => `甲、乙两个工程队合修一条长 ${T} 米的路，甲队和乙队修的长度比是 ${a} : ${b}。两队各修了多少米？` },
        { lo: 30, hi: 300, u: '张', x: n1, y: n2, s: (T, a, b) => `${n1}和${n2}一共有邮票 ${T} 张，${n1}和${n2}邮票张数的比是 ${a} : ${b}。两人各有多少张？` },
        { lo: 20, hi: 200, u: '千克', x: '铜', y: '锌', s: (T, a, b) => `一种合金是用铜和锌按 ${a} : ${b} 的质量比熔炼成的。现有这种合金 ${T} 千克，其中铜和锌各有多少千克？` },
      ]);
      const { a, b, T: tot } = r.until(() => {
        const a = r.int(1, c.small ? 3 : 9), b = r.int(c.small ? 5 : 1, c.small ? 19 : 9), st = (a + b) * (c.st || 1);
        if (gcd(a, b) !== 1 || a === b || Math.floor(c.hi / st) < Math.ceil(c.lo / st)) return {};
        if (c.near && (a / b < 0.6 || a / b > 1.6)) return {};
        return { a, b, T: r.step(c.lo, c.hi, st) };
      }, (o) => o.T);
      const m = tot / (a + b), A = m * a, B = m * b;
      return {
        q: c.s(tot, a, b),
        answer: [num(A, { label: c.x, unit: c.u }), num(B, { label: c.y, unit: c.u })],
        steps: [`总份数：${a} + ${b} = ${a + b}`, `${c.x}占总数的 ${frac(a, a + b)}：${tot} × ${frac(a, a + b)} = ${A}（${c.u}）`, `${c.y}占总数的 ${frac(b, a + b)}：${tot} × ${frac(b, a + b)} = ${B}（${c.u}）`, `也可以先求一份：${tot} ÷ ${a + b} = ${fmt(m)}，再分别乘 ${a} 和 ${b}`, `检验：${A} + ${B} = ${tot}，${A} : ${B} = ${a} : ${b} ✓`],
        hint: '一共分成了几份？',
      };
    },
  },
  {
    id: 'g6a-ratio-share3', grade: 6, term: 1, unit: '比', name: '按比分配（三个量或总量藏起来）', process: true,
    tip: '先找到真正要分的总量（三角形内角和 180°、长方形周长的一半、长方体棱长和的四分之一），再按比分配', level: 2,
    gen(r) {
      const t = r.int(1, 4);
      if (t === 1) {
        const [a, b, c] = r.until(() => [r.int(1, 9), r.int(1, 9), r.int(1, 9)], ([a, b, c]) => 180 % (a + b + c) === 0 && gcd(gcd(a, b), c) === 1 && new Set([a, b, c]).size > 1);
        const m = 180 / (a + b + c);
        return {
          q: `一个三角形三个内角度数的比是 ${a} : ${b} : ${c}。这三个角各是多少度？`,
          answer: [num(a * m, { label: '第一个角', unit: '°' }), num(b * m, { label: '第二个角', unit: '°' }), num(c * m, { label: '第三个角', unit: '°' })],
          steps: ['三角形的内角和是 180°，这就是要分配的总量', `总份数：${a} + ${b} + ${c} = ${a + b + c}，一份是 180 ÷ ${a + b + c} = ${m}（度）`, `三个角：${m} × ${a} = ${a * m}，${m} × ${b} = ${b * m}，${m} × ${c} = ${c * m}`, `检验：${a * m} + ${b * m} + ${c * m} = 180 ✓`],
          hint: '三角形三个角加起来是多少度？',
        };
      }
      if (t === 2) {
        const [a, b] = r.until(() => [r.int(2, 9), r.int(1, 8)], ([a, b]) => a > b && gcd(a, b) === 1);
        const m = r.int(1, 8), Cc = 2 * (a + b) * m, L = a * m, W = b * m;
        return {
          q: `一个长方形的周长是 ${Cc} 厘米，长和宽的比是 ${a} : ${b}。这个长方形的面积是多少平方厘米？`,
          answer: [num(L * W, { unit: '平方厘米' })],
          steps: [`周长包括两条长、两条宽，长 + 宽 = ${Cc} ÷ 2 = ${Cc / 2}（厘米）`, `把 ${Cc / 2} 厘米按 ${a} : ${b} 分配：总份数 ${a + b}`, `长：${Cc / 2} × ${frac(a, a + b)} = ${L}（厘米），宽：${Cc / 2} × ${frac(b, a + b)} = ${W}（厘米）`, `面积：${L} × ${W} = ${L * W}（平方厘米）`, '易错：直接把周长按比分配，就把长和宽都算成了两倍'],
          hint: '周长按比分，分到的是长和宽吗？',
        };
      }
      if (t === 3) {
        const [a, b, c] = r.pick([[2, 3, 5], [1, 2, 3], [2, 3, 4], [1, 3, 4], [2, 5, 3], [1, 2, 4], [3, 4, 5]]);
        const m = r.int(2, 30), T0 = (a + b + c) * m;
        return {
          q: `配制一种混凝土，水泥、沙子、石子的质量比是 ${a} : ${b} : ${c}。要配制 ${T0} 吨这种混凝土，需要水泥、沙子、石子各多少吨？`,
          answer: [num(a * m, { label: '水泥', unit: '吨' }), num(b * m, { label: '沙子', unit: '吨' }), num(c * m, { label: '石子', unit: '吨' })],
          steps: [`总份数：${a} + ${b} + ${c} = ${a + b + c}`, `水泥：${T0} × ${frac(a, a + b + c)} = ${a * m}（吨）`, `沙子：${T0} × ${fs(b, a + b + c)} = ${b * m}（吨）`, `石子：${T0} × ${fs(c, a + b + c)} = ${c * m}（吨）`, `检验：${a * m} + ${b * m} + ${c * m} = ${T0} ✓`],
          hint: '三个量一共几份？',
        };
      }
      const [a, b, c] = r.until(() => [r.int(1, 6), r.int(1, 6), r.int(1, 6)], ([a, b, c]) => gcd(gcd(a, b), c) === 1 && new Set([a, b, c]).size === 3);
      const m = r.int(1, 4), L4 = 4 * (a + b + c) * m;
      const [l, w, h] = [a * m, b * m, c * m];
      return {
        q: `一个长方体的棱长总和是 ${L4} 厘米，长、宽、高的比是 ${a} : ${b} : ${c}。这个长方体的体积是多少立方厘米？`,
        answer: [num(l * w * h, { unit: '立方厘米' })],
        steps: [`长方体有 4 条长、4 条宽、4 条高，长 + 宽 + 高 = ${L4} ÷ 4 = ${L4 / 4}（厘米）`, `总份数 ${a + b + c}，一份是 ${L4 / 4} ÷ ${a + b + c} = ${m}（厘米）`, `长 ${l} 厘米，宽 ${w} 厘米，高 ${h} 厘米`, `体积：${l} × ${w} × ${h} = ${l * w * h}（立方厘米）`],
        hint: '棱长总和里，长、宽、高各有几条？',
      };
    },
  },
  {
    id: 'g6a-ratio-known', grade: 6, term: 1, unit: '比', name: '已知比和其中一个量，求另一个量', process: true,
    tip: '已知量对应几份，先求一份是多少，再求要求的量（或把比化成分率）', level: 2,
    gen(r) {
      const [n1, n2] = r.names(2);
      const ctxs = [
        { x: '男生', y: '女生', u: '人', s: (a, b, A) => `六（2）班男生和女生人数的比是 ${a} : ${b}，男生有 ${A} 人。女生有多少人？`, ans: (B) => `女生有 ${B} 人`, ok: (a, b, m) => (a + b) * m <= 54 && (a + b) * m >= 30 },
        { x: '男生', y: '全班', u: '人', all: true, s: (a, b, A) => `六（2）班男生和女生人数的比是 ${a} : ${b}，男生有 ${A} 人。全班有多少人？`, ans: (B) => `全班有 ${B} 人`, ok: (a, b, m) => (a + b) * m <= 54 && (a + b) * m >= 30 },
        { x: n1, y: n2, u: '张', s: (a, b, A) => `${n1}和${n2}邮票张数的比是 ${a} : ${b}，${n1}有 ${A} 张。${n2}有多少张？`, ans: (B) => `${n2}有 ${B} 张`, ok: () => true },
        { x: '长', y: '宽', u: '厘米', s: (a, b, A) => `一个长方形长与宽的比是 ${a} : ${b}，长是 ${A} 厘米。宽是多少厘米？`, ans: (B) => `宽是 ${B} 厘米`, ok: (a, b) => a > b },
        { x: '甲车', y: '乙车', u: '千米', s: (a, b, A) => `甲、乙两车速度的比是 ${a} : ${b}，甲车每小时行 ${A} 千米。乙车每小时行多少千米？`, ans: (B) => `乙车每小时行 ${B} 千米`, ok: (a, b, m) => a * m >= 30 && b * m >= 30 && a * m <= 120 && b * m <= 120 },
        { x: '果汁', y: '水', u: '毫升', k: 10, s: (a, b, A) => `调一种饮料，果汁和水的比是 ${a} : ${b}。现有果汁 ${A} 毫升，要加水多少毫升？`, ans: (B) => `要加水 ${B} 毫升`, ok: (a, b) => a < b },
      ];
      const { a, b, m, c } = r.until(() => {
        const [a, b] = [r.int(1, 9), r.int(1, 9)], m = r.int(2, 12);
        return { a, b, m, c: r.pick(ctxs) };
      }, ({ a, b, m, c }) => a !== b && gcd(a, b) === 1 && c.ok(a, b, m));
      const k = c.k || 1, one = m * k, A = a * one, B = (c.all ? a + b : b) * one;
      const rel = b % a === 0 ? `${b / a} 倍` : `${fs(b, a)}`;
      return {
        q: c.s(a, b, A), answer: [num(B, { unit: c.u })],
        steps: [`${c.x}占 ${a} 份，一份是 ${A} ÷ ${a} = ${one}（${c.u}）`, c.all ? `全班是 ${a} + ${b} = ${a + b} 份：${one} × ${a + b} = ${B}（${c.u}）` : `${c.y}占 ${b} 份：${one} × ${b} = ${B}（${c.u}）`, c.all ? `也可以：男生占全班的 ${frac(a, a + b)}，${A} ÷ ${frac(a, a + b)} = ${B}` : `也可以：${c.y}是${c.x}的 ${rel}，${A} × ${b % a === 0 ? b / a : fs(b, a)} = ${B}`, `答：${c.ans(B)}。`],
        hint: '已知的量是几份？一份是多少？',
      };
    },
  },
);

// ---------------- 上册 5 圆 ----------------
const UL = { 厘米: 'cm', 米: 'm', 分米: 'dm' };
const sq = (u) => `平方${u}`;
S.push(
  {
    id: 'g6a-circle-c-r', grade: 6, term: 1, unit: '圆', name: '已知半径求周长',
    tip: 'C = 2πr，π 取 3.14；先算 2 × r 再乘 3.14 更快', level: 1,
    gen(r) {
      const u = r.pick(['厘米', '米', '分米']), k = r.int(1, 4);
      const R = k === 3 ? r.int(2, 10) : k === 4 ? r.int(5, 15) : r.int(1, 20);
      const C2 = fix(2 * PI * R);
      const t = [
        { q: `一个圆的半径是 ${R} ${u}，它的周长是多少${u}？`, fig: true },
        { q: `一个圆的半径是 ${R} ${u}，它的周长是多少${u}？`, fig: true },
        { q: `一个圆形花坛的半径是 ${R} 米，绕花坛走一圈是多少米？`, u: '米' },
        { q: `钟面上的分针长 ${R} 厘米，分针的尖端转一圈走过的路程是多少厘米？`, u: '厘米' },
      ][k - 1];
      const uu = t.u || u;
      return {
        q: t.q, fig: t.fig ? fig.circle({ label: `r=${R}${UL[uu]}` }) : undefined,
        answer: [num(C2, { unit: uu })],
        steps: ['圆的周长 C = 2πr', `C = 2 × 3.14 × ${R} = 3.14 × ${2 * R} = ${fmt(C2)}（${uu}）`, '易错：周长是 2πr，面积才是 πr²'],
        hint: '周长公式里有几个 r？',
      };
    },
  },
  {
    id: 'g6a-circle-c-d', grade: 6, term: 1, unit: '圆', name: '已知直径求周长',
    tip: 'C = πd，直径直接乘 3.14', level: 1,
    gen(r) {
      const u = r.pick(['厘米', '米', '分米']), k = r.int(1, 4);
      const D = k === 3 ? r.pick([0.8, 1, 1.2, 1.4, 1.5, 1.6, 1.8, 2]) : k === 4 ? r.int(4, 30) : r.chance(0.8) ? r.int(2, 30) : fix(r.int(5, 40) / 10);
      const C2 = fix(PI * D);
      const t = [
        { q: `一个圆的直径是 ${fmt(D)} ${u}，它的周长是多少${u}？`, fig: true },
        { q: `一个圆的直径是 ${fmt(D)} ${u}，它的周长是多少${u}？`, fig: true },
        { q: `一张圆桌桌面的直径是 ${fmt(D)} 米，桌面的周长是多少米？`, u: '米' },
        { q: `一个圆形水池的直径是 ${fmt(D)} 米，沿水池边走一圈是多少米？`, u: '米' },
      ][k - 1];
      const uu = t.u || u;
      return {
        q: t.q, fig: t.fig ? fig.circle({ label: `d=${fmt(D)}${UL[uu]}`, diameter: true }) : undefined,
        answer: [num(C2, { unit: uu })],
        steps: ['已知直径，用 C = πd', `C = 3.14 × ${fmt(D)} = ${fmt(C2)}（${uu}）`, '易错：已经是直径了，不用再乘 2'],
        hint: '直径和周长是什么关系？',
      };
    },
  },
  {
    id: 'g6a-circle-r-from-c', grade: 6, term: 1, unit: '圆', name: '已知周长求半径或直径',
    tip: 'd = C ÷ π，r = C ÷ π ÷ 2', level: 2,
    gen(r) {
      const R = r.int(1, 25), u = r.pick(['厘米', '米', '分米']), C2 = fix(2 * PI * R), askD = r.bool();
      const ctx = r.pick([`一个圆的周长是 ${fmt(C2)} ${u}`, `一个圆形花坛的周长是 ${fmt(C2)} ${u}`, `用一根 ${fmt(C2)} ${u}长的铁丝正好围成一个圆`]);
      return {
        q: `${ctx}，它的${askD ? '直径' : '半径'}是多少${u}？`,
        answer: [num(askD ? 2 * R : R, { unit: u })],
        steps: ['C = πd，所以 d = C ÷ π', `d = ${fmt(C2)} ÷ 3.14 = ${2 * R}（${u}）`, askD ? `答：直径是 ${2 * R} ${u}。` : `r = d ÷ 2 = ${2 * R} ÷ 2 = ${R}（${u}）`, '检验：3.14 × ' + 2 * R + ' = ' + fmt(C2) + ' ✓'],
        hint: '周长 ÷ 3.14 得到的是半径还是直径？',
      };
    },
  },
  {
    id: 'g6a-circle-s-r', grade: 6, term: 1, unit: '圆', name: '已知半径求面积',
    tip: 'S = πr²，r² 是 r × r，不是 r × 2', level: 1,
    gen(r) {
      const u = r.pick(['厘米', '米', '分米']), k = r.int(1, 4);
      const R = k >= 3 ? r.int(2, 12) : r.int(1, 20), S0 = fix(PI * R * R);
      const t = [
        { q: `一个圆的半径是 ${R} ${u}，它的面积是多少${sq(u)}？`, fig: true },
        { q: `一个圆的半径是 ${R} ${u}，它的面积是多少${sq(u)}？`, fig: true },
        { q: `一个圆形花坛的半径是 ${R} 米，这个花坛的占地面积是多少平方米？`, u: '米' },
        { q: `一只羊被拴在草地上的木桩上，绳子长 ${R} 米。这只羊最多能吃到多少平方米的草？`, u: '米' },
      ][k - 1];
      const uu = t.u || u;
      return {
        q: t.q, fig: t.fig ? fig.circle({ label: `r=${R}${UL[uu]}` }) : undefined,
        answer: [num(S0, { unit: sq(uu) })],
        steps: ['圆的面积 S = πr²', `r² = ${R} × ${R} = ${R * R}`, `S = 3.14 × ${R * R} = ${fmt(S0)}（${sq(uu)}）`, '易错：r² 是 r × r，不是 r × 2'],
        hint: '先算 r × r',
      };
    },
  },
  {
    id: 'g6a-circle-s-d', grade: 6, term: 1, unit: '圆', name: '已知直径求面积',
    tip: '先求半径 r = d ÷ 2，再用 S = πr²', level: 1,
    gen(r) {
      const u = r.pick(['厘米', '米', '分米']), k = r.int(1, 4);
      const R = k === 3 ? r.int(4, 10) : k === 4 ? r.int(2, 15) : r.int(1, 20), D = 2 * R, S0 = fix(PI * R * R);
      const t = [
        { q: `一个圆的直径是 ${D} ${u}，它的面积是多少${sq(u)}？`, fig: true },
        { q: `一个圆的直径是 ${D} ${u}，它的面积是多少${sq(u)}？`, fig: true },
        { q: `一张圆桌桌面的直径是 ${D} 分米，桌面的面积是多少平方分米？`, u: '分米' },
        { q: `一个圆形水池的直径是 ${D} 米，这个水池的占地面积是多少平方米？`, u: '米' },
      ][k - 1];
      const uu = t.u || u;
      return {
        q: t.q, fig: t.fig ? fig.circle({ label: `d=${D}${UL[uu]}`, diameter: true }) : undefined,
        answer: [num(S0, { unit: sq(uu) })],
        steps: [`先求半径：r = ${D} ÷ 2 = ${R}（${uu}）`, `S = πr² = 3.14 × ${R} × ${R} = 3.14 × ${R * R} = ${fmt(S0)}（${sq(uu)}）`, '易错：不能直接用直径乘直径'],
        hint: '面积公式要用半径',
      };
    },
  },
  {
    id: 'g6a-circle-s-c', grade: 6, term: 1, unit: '圆', name: '已知周长求面积',
    tip: '先用周长求半径：r = C ÷ 3.14 ÷ 2，再算面积', level: 2,
    gen(r) {
      const R = r.int(1, 15), u = r.pick(['厘米', '米', '分米']), C2 = fix(2 * PI * R), S0 = fix(PI * R * R);
      const ctx = r.pick([`一个圆的周长是 ${fmt(C2)} ${u}`, `一个圆形花坛的周长是 ${fmt(C2)} ${u}`, `一根长 ${fmt(C2)} ${u}的绳子正好围成一个圆`]);
      return {
        q: `${ctx}，这个圆的面积是多少${sq(u)}？`,
        answer: [num(S0, { unit: sq(u) })],
        steps: ['面积要用半径，先求半径', `r = ${fmt(C2)} ÷ 3.14 ÷ 2 = ${R}（${u}）`, `S = 3.14 × ${R} × ${R} = ${fmt(S0)}（${sq(u)}）`],
        hint: '周长 → 直径 → 半径 → 面积',
      };
    },
  },
  {
    id: 'g6a-circle-r-from-s', grade: 6, term: 1, unit: '圆', name: '已知面积求半径',
    tip: 'r² = S ÷ 3.14，再想几的平方是这个数', level: 2,
    gen(r) {
      const R = r.int(2, 15), u = r.pick(['厘米', '米', '分米']), S0 = fix(PI * R * R), askC = r.chance(0.4);
      return {
        q: `一个圆的面积是 ${fmt(S0)} ${sq(u)}，它的${askC ? '周长' : '半径'}是多少${u}？`,
        answer: [num(askC ? 2 * PI * R : R, { unit: u })],
        steps: [`S = 3.14 × r²，所以 r² = ${fmt(S0)} ÷ 3.14 = ${R * R}`, `${R} × ${R} = ${R * R}，所以 r = ${R}（${u}）`, ...(askC ? [`C = 2 × 3.14 × ${R} = ${fmt(2 * PI * R)}（${u}）`] : []), '常用的平方数要熟：11² = 121，12² = 144，13² = 169，14² = 196，15² = 225'],
        hint: '先求 r × r 等于多少',
      };
    },
  },
  {
    id: 'g6a-circle-semi', grade: 6, term: 1, unit: '圆', name: '半圆的周长和面积',
    tip: '半圆周长 = 圆周长的一半 + 直径（别漏了直径）；半圆面积 = 圆面积 ÷ 2', level: 2,
    gen(r) {
      const R = r.int(1, 15), useD = r.bool(), u = r.pick(['厘米', '米', '分米']);
      const P = fix(PI * R + 2 * R), A = fix((PI * R * R) / 2);
      return {
        q: `一个半圆的${useD ? '直径' : '半径'}是 ${useD ? 2 * R : R} ${u}，它的周长和面积各是多少？`,
        fig: semiFig(useD ? `d=${2 * R}${UL[u]}` : `r=${R}${UL[u]}`),
        answer: [num(P, { label: '周长', unit: u }), num(A, { label: '面积', unit: sq(u) })],
        steps: [...(useD ? [`半径 r = ${2 * R} ÷ 2 = ${R}（${u}）`] : []), `弧长 = 3.14 × ${2 * R} ÷ 2 = ${fmt(PI * R)}（${u}）`, `周长 = 弧长 + 直径 = ${fmt(PI * R)} + ${2 * R} = ${fmt(P)}（${u}）`, `面积 = 3.14 × ${R} × ${R} ÷ 2 = ${fmt(A)}（${sq(u)}）`, '易错：半圆的周长不是圆周长的一半，还要加上一条直径'],
        hint: '半圆的周长由哪几部分组成？',
      };
    },
  },
  {
    id: 'g6a-circle-ring', grade: 6, term: 1, unit: '圆', name: '圆环的面积',
    tip: '圆环面积 = 外圆面积 - 内圆面积 = π(R² - r²)', level: 2,
    gen(r) {
      const t = r.int(1, 3), Rr = r.int(3, 15), rr = t === 3 ? r.until(() => r.int(Math.max(1, Rr - 3), Rr - 1), (x) => x >= Rr / 2) : r.int(1, Rr - 1), u = r.pick(['厘米', '米', '分米']);
      const A = fix(PI * (Rr * Rr - rr * rr));
      let q, pre = [], lab;
      if (t === 1) { q = `一个圆环的外圆半径是 ${Rr} ${u}，内圆半径是 ${rr} ${u}。这个圆环的面积是多少${sq(u)}？`; lab = [`R=${Rr}${UL[u]}`, `r=${rr}${UL[u]}`]; }
      else if (t === 2) { q = `一个圆环的外圆直径是 ${2 * Rr} ${u}，内圆直径是 ${2 * rr} ${u}。这个圆环的面积是多少${sq(u)}？`; pre = [`先求半径：R = ${2 * Rr} ÷ 2 = ${Rr}，r = ${2 * rr} ÷ 2 = ${rr}`]; lab = ['R', 'r']; }
      else { q = `一个圆形花坛的半径是 ${rr} 米，在它的周围修一条宽 ${Rr - rr} 米的环形小路。小路的面积是多少平方米？`; pre = [`外圆半径 = 花坛半径 + 路宽 = ${rr} + ${Rr - rr} = ${Rr}（米）`]; lab = ['R', `r=${rr}m`]; }
      const uu = t === 3 ? '米' : u;
      return {
        q, fig: ringFig(...lab),
        answer: [num(A, { unit: sq(uu) })],
        steps: [...pre, `外圆面积：3.14 × ${Rr * Rr} = ${fmt(PI * Rr * Rr)}，内圆面积：3.14 × ${rr * rr} = ${fmt(PI * rr * rr)}`, `圆环面积：${fmt(PI * Rr * Rr)} - ${fmt(PI * rr * rr)} = ${fmt(A)}（${sq(uu)}）`, `简便算法：3.14 × (${Rr * Rr} - ${rr * rr}) = 3.14 × ${Rr * Rr - rr * rr} = ${fmt(A)}`, '易错：不能用 (R - r)² 来算'],
        hint: '大圆面积减去小圆面积',
      };
    },
  },
  {
    id: 'g6a-circle-sector', grade: 6, term: 1, unit: '圆', name: '扇形的面积',
    tip: '扇形面积 = 圆面积 × 圆心角/360，圆心角是 360° 的几分之几，面积就是圆面积的几分之几', level: 2,
    gen(r) {
      const n = r.pick([30, 45, 60, 72, 90, 120, 135, 150, 180, 240, 270]), R = r.until(() => r.int(1, 12), (R) => dp(fix((PI * R * R * n) / 360)) <= 2);
      const u = r.pick(['厘米', '米', '分米']), A = fix((PI * R * R * n) / 360), f = simplify(n, 360);
      return {
        q: `一个扇形的半径是 ${R} ${u}，圆心角是 ${n}°。这个扇形的面积是多少${sq(u)}？`,
        fig: sectorFig(n, `${R}${UL[u]}`),
        answer: [num(A, { unit: sq(u) })],
        steps: [`圆心角 ${n}° 占周角 360° 的 ${frac(f[0], f[1])}，扇形面积就是整个圆面积的 ${frac(f[0], f[1])}`, `圆面积：3.14 × ${R} × ${R} = ${fmt(PI * R * R)}（${sq(u)}）`, `扇形面积：${fmt(PI * R * R)} × ${frac(f[0], f[1])} = ${fmt(A)}（${sq(u)}）`],
        hint: `${n}° 是 360° 的几分之几？`,
      };
    },
  },
  {
    id: 'g6a-circle-sector-perim', grade: 6, term: 1, unit: '圆', name: '扇形的周长',
    tip: '扇形周长 = 弧长 + 2 条半径；弧长 = 圆周长 × 圆心角/360', level: 3,
    gen(r) {
      const n = r.pick([30, 45, 60, 72, 90, 120, 150, 180, 240, 270]), R = r.until(() => r.int(2, 18), (R) => dp(fix((2 * PI * R * n) / 360)) <= 2);
      const u = r.pick(['厘米', '米', '分米']), arc = fix((2 * PI * R * n) / 360), f = simplify(n, 360), P = fix(arc + 2 * R);
      return {
        q: `一个扇形的半径是 ${R} ${u}，圆心角是 ${n}°。这个扇形的周长是多少${u}？`,
        fig: sectorFig(n, `${R}${UL[u]}`),
        answer: [num(P, { unit: u })],
        steps: [`弧长是整个圆周长的 ${frac(f[0], f[1])}：2 × 3.14 × ${R} × ${frac(f[0], f[1])} = ${fmt(arc)}（${u}）`, `扇形周长 = 弧长 + 2 条半径 = ${fmt(arc)} + ${R} × 2 = ${fmt(P)}（${u}）`, '易错：只算弧长，忘了两条半径'],
        hint: '扇形的周长由哪几条线围成？',
      };
    },
  },
  {
    id: 'g6a-circle-sq-out', grade: 6, term: 1, unit: '圆', name: '外方内圆的面积',
    tip: '正方形里最大的圆：直径 = 正方形边长；阴影 = 正方形面积 - 圆面积 = 0.86r²', level: 2,
    gen(r) {
      const R = r.int(1, 12), u = r.pick(['厘米', '米', '分米']), t = r.int(1, 3);
      const sqA = 4 * R * R, cA = fix(PI * R * R), sh = fix(sqA - cA);
      if (t === 3) {
        return {
          q: `在一个正方形里画一个最大的圆，正方形的面积是 ${sqA} ${sq(u)}。这个圆的面积是多少${sq(u)}？`,
          fig: squareCircleFig('sq-out', 'r'),
          answer: [num(cA, { unit: sq(u) })],
          steps: ['圆的直径等于正方形的边长，所以正方形边长 = 2r', `正方形面积 = 2r × 2r = 4r²，r² = ${sqA} ÷ 4 = ${R * R}`, `圆面积 = 3.14 × r² = 3.14 × ${R * R} = ${fmt(cA)}（${sq(u)}）`, '不用求出 r，直接用 r² 整体代入就行'],
          hint: '正方形面积是 r² 的几倍？',
        };
      }
      const giveA = t === 1;
      return {
        q: giveA ? `在边长 ${2 * R} ${u}的正方形里画一个最大的圆（如图），阴影部分的面积是多少${sq(u)}？` : `一个圆的半径是 ${R} ${u}，在它外面画一个正好把它围住的正方形（如图）。阴影部分的面积是多少${sq(u)}？`,
        fig: squareCircleFig('sq-out', giveA ? 'r' : `r=${R}${UL[u]}`),
        answer: [num(sh, { unit: sq(u) })],
        steps: [giveA ? `最大的圆直径 = 边长 ${2 * R} ${u}，半径 r = ${R} ${u}` : `正方形边长 = 圆的直径 = ${2 * R} ${u}`, `正方形面积：${2 * R} × ${2 * R} = ${sqA}（${sq(u)}）`, `圆面积：3.14 × ${R} × ${R} = ${fmt(cA)}（${sq(u)}）`, `阴影：${sqA} - ${fmt(cA)} = ${fmt(sh)}（${sq(u)}）`, `记住结论：阴影 = (4 - 3.14) × r² = 0.86 × ${R * R} = ${fmt(sh)}`],
        hint: '正方形边长和圆的直径有什么关系？',
      };
    },
  },
  {
    id: 'g6a-circle-sq-in', grade: 6, term: 1, unit: '圆', name: '外圆内方的面积',
    tip: '圆里最大的正方形：对角线 = 直径，正方形面积 = 2r²；阴影 = 3.14r² - 2r² = 1.14r²', level: 2,
    gen(r) {
      const R = r.int(1, 12), u = r.pick(['厘米', '米', '分米']), t = r.int(1, 3);
      const sqA = 2 * R * R, cA = fix(PI * R * R), sh = fix(cA - sqA);
      if (t === 3) {
        return {
          q: `在一个圆里画一个最大的正方形，正方形的面积是 ${sqA} ${sq(u)}。这个圆的面积是多少${sq(u)}？`,
          fig: squareCircleFig('circle-out', 'r'),
          answer: [num(cA, { unit: sq(u) })],
          steps: ['正方形的两条对角线都是圆的直径，把正方形分成 4 个直角边都是 r 的小三角形', `正方形面积 = 4 × r × r ÷ 2 = 2r²，r² = ${sqA} ÷ 2 = ${R * R}`, `圆面积 = 3.14 × ${R * R} = ${fmt(cA)}（${sq(u)}）`],
          hint: '正方形面积是 r² 的几倍？',
        };
      }
      return {
        q: `在半径是 ${R} ${u}的圆里画一个最大的正方形（如图），阴影部分的面积是多少${sq(u)}？`,
        fig: squareCircleFig('circle-out', `r=${R}${UL[u]}`),
        answer: [num(sh, { unit: sq(u) })],
        steps: [`正方形的对角线就是圆的直径 ${2 * R} ${u}，把正方形看成 2 个底是 ${2 * R}、高是 ${R} 的三角形`, `正方形面积：${2 * R} × ${R} ÷ 2 × 2 = ${sqA}（${sq(u)}）`, `圆面积：3.14 × ${R} × ${R} = ${fmt(cA)}（${sq(u)}）`, `阴影：${fmt(cA)} - ${sqA} = ${fmt(sh)}（${sq(u)}）`, `记住结论：阴影 = (3.14 - 2) × r² = 1.14 × ${R * R} = ${fmt(sh)}`],
        hint: '正方形不知道边长，用对角线把它分成三角形',
      };
    },
  },
  {
    id: 'g6a-circle-wheel', grade: 6, term: 1, unit: '圆', name: '车轮滚动和钟面问题', process: true,
    tip: '车轮转一周前进的距离 = 车轮的周长；转的周数 = 总路程 ÷ 周长', level: 2,
    gen(r) {
      const t = r.int(1, 4);
      if (t === 1) {
        const d = r.pick([50, 60, 70, 80]), n = r.step(50, 1000, 50), dist = fix((PI * d * n) / 100);
        return {
          q: `一辆自行车车轮的直径是 ${d} 厘米。如果车轮每分钟转 ${n} 周，这辆自行车每分钟前进多少米？`,
          answer: [num(dist, { unit: '米' })],
          steps: [`车轮转一周，自行车前进的距离就是车轮的周长：3.14 × ${d} = ${fmt(PI * d)}（厘米）`, `转 ${n} 周：${fmt(PI * d)} × ${n} = ${fmt(PI * d * n)}（厘米）`, `${fmt(PI * d * n)} 厘米 = ${fmt(dist)} 米`, `答：每分钟前进 ${fmt(dist)} 米。`],
          hint: '车轮转一周走多远？注意单位',
        };
      }
      if (t === 2) {
        const d = r.pick([0.5, 0.6, 0.8, 1, 1.2, 1.5, 2]), n = r.step(100, 2000, 50), L = fix(PI * d * n);
        return {
          q: `一个车轮的直径是 ${fmt(d)} 米，通过一座长 ${fmt(L)} 米的大桥，车轮要转多少周？`,
          answer: [num(n, { unit: '周' })],
          steps: [`车轮的周长：3.14 × ${fmt(d)} = ${fmt(PI * d)}（米），转一周走这么远`, `周数 = 总路程 ÷ 周长：${fmt(L)} ÷ ${fmt(PI * d)} = ${n}（周）`, `答：车轮要转 ${n} 周。`],
          hint: '一周走多远？桥长里有几个这样的长度？',
        };
      }
      if (t === 3) {
        const len = r.int(5, 15), h = r.int(2, 12), dist = fix(2 * PI * len * h);
        return {
          q: `钟面上的分针长 ${len} 厘米。经过 ${h} 小时，分针的尖端走过了多少厘米？`,
          answer: [num(dist, { unit: '厘米' })],
          steps: [`分针每小时转 1 圈，尖端走过一个半径 ${len} 厘米的圆的周长`, `一圈：2 × 3.14 × ${len} = ${fmt(2 * PI * len)}（厘米）`, `${h} 小时转 ${h} 圈：${fmt(2 * PI * len)} × ${h} = ${fmt(dist)}（厘米）`, `答：分针尖端走过了 ${fmt(dist)} 厘米。`],
          hint: '分针 1 小时转几圈？',
        };
      }
      const R = r.int(20, 60), w = r.pick([1, 1.2, 1.5, 2, 2.5]), nm = r.names(2);
      const C1 = fix(2 * PI * R), C2 = fix(2 * PI * (R + w)), dlt = fix(C2 - C1);
      return {
        q: `圆形跑道的内圈半径是 ${R} 米，${nm[0]}沿内圈跑，${nm[1]}沿外圈跑，内外两圈相距 ${fmt(w)} 米。两人各跑一圈，${nm[1]}比${nm[0]}多跑多少米？`,
        answer: [num(dlt, { unit: '米' })],
        steps: [`外圈半径：${R} + ${fmt(w)} = ${fmt(R + w)}（米）`, `内圈一圈：2 × 3.14 × ${R} = ${fmt(C1)}（米），外圈一圈：2 × 3.14 × ${fmt(R + w)} = ${fmt(C2)}（米）`, `多跑：${fmt(C2)} - ${fmt(C1)} = ${fmt(dlt)}（米）`, `巧算：多跑的就是 2 × 3.14 × ${fmt(w)} = ${fmt(dlt)}（米），和跑道半径无关`],
        hint: '外圈半径比内圈大多少？',
      };
    },
  },
);

S.push(
  {
    id: 'g6a-circle-track', grade: 6, term: 1, unit: '圆', name: '跑道形组合图形', process: true,
    tip: '两端两个半圆合起来正好是一个整圆：周长 = 2 条直道 + 圆周长，面积 = 长方形 + 圆', level: 2,
    gen(r) {
      const L = r.step(40, 120, 5), d = r.step(20, 70, 2), R = d / 2, askP = r.bool();
      const P = fix(2 * L + PI * d), A = fix(L * d + PI * R * R);
      const nm = r.pick(['学校操场', '一个跑道形花坛', '一个运动场']);
      return {
        q: `${nm}的形状如图：中间是长方形，两端是半圆。长方形的长是 ${L} 米，两端半圆的直径是 ${d} 米。它的${askP ? '周长' : '面积'}是多少${askP ? '米' : '平方米'}？`,
        fig: trackFig(`${L}m`, `${d}m`),
        answer: [num(askP ? P : A, { unit: askP ? '米' : '平方米' })],
        steps: askP
          ? ['周长由两条直道和两个半圆弧组成，两个半圆弧合起来是一个圆的周长', `两条直道：${L} × 2 = ${2 * L}（米）`, `圆周长：3.14 × ${d} = ${fmt(PI * d)}（米）`, `周长：${2 * L} + ${fmt(PI * d)} = ${fmt(P)}（米）`, '易错：中间长方形的两条宽（虚线）不算在周长里']
          : ['面积 = 中间长方形面积 + 两个半圆（合起来一个圆）的面积', `长方形：${L} × ${d} = ${L * d}（平方米）`, `圆：半径 ${d} ÷ 2 = ${R}，3.14 × ${R} × ${R} = ${fmt(PI * R * R)}（平方米）`, `面积：${L * d} + ${fmt(PI * R * R)} = ${fmt(A)}（平方米）`],
        hint: '两端的两个半圆能拼成什么？',
      };
    },
  },
  {
    id: 'g6a-circle-change', grade: 6, term: 1, unit: '圆', name: '半径变化与周长、面积的变化',
    tip: '半径扩大到原来的 k 倍，周长扩大到 k 倍，面积扩大到 k × k 倍；半径比 a : b，周长比 a : b，面积比 a² : b²', level: 2,
    gen(r) {
      if (r.chance(0.4)) {
        const k = r.int(2, 6), w = r.pick(['半径', '直径']);
        return {
          q: `一个圆的${w}扩大到原来的 ${k} 倍，它的周长扩大到原来的 {0} 倍，面积扩大到原来的 {1} 倍。`,
          answer: [num(k), num(k * k)],
          steps: [`${w}扩大到 ${k} 倍，半径也扩大到 ${k} 倍`, `周长 C = 2πr，只和 r 的一次方有关：周长扩大到 ${k} 倍`, `面积 S = πr² = π × r × r，两个 r 都扩大到 ${k} 倍：面积扩大到 ${k} × ${k} = ${k * k} 倍`, '可以举例验证：r = 1 时面积是 3.14，r = ' + k + ' 时面积是 ' + fmt(PI * k * k)],
          hint: '面积公式里 r 出现了几次？',
        };
      }
      const [a, b] = r.until(() => [r.int(2, 9), r.int(1, 8)], ([a, b]) => a > b && gcd(a, b) === 1), m = r.int(1, 4), u = r.pick(['厘米', '米', '分米']);
      const byD = r.bool();
      return {
        q: `大圆的${byD ? '直径' : '半径'}是 ${a * m * (byD ? 2 : 1)} ${u}，小圆的${byD ? '直径' : '半径'}是 ${b * m * (byD ? 2 : 1)} ${u}。大圆与小圆周长的比是 {0}，面积的比是 {1}。`,
        answer: [ratioAns(a, b), ratioAns(a * a, b * b)],
        steps: [`半径的比：${a * m} : ${b * m} = ${a} : ${b}`, `周长 = 2π × 半径，周长的比等于半径的比：${a} : ${b}`, `面积 = π × 半径 × 半径，面积的比等于半径平方的比：${a * a} : ${b * b}`, '不用真的算出周长和面积'],
        hint: '先求半径的比',
      };
    },
  },
);

// ---------------- 上册 6 百分数（一） ----------------
S.push(
  {
    id: 'g6a-pct-dec', grade: 6, term: 1, unit: '百分数（一）', name: '百分数和小数互化',
    tip: '小数化百分数：小数点右移两位加 %；百分数化小数：去掉 % 小数点左移两位', level: 1, speed: 10,
    gen(r) {
      if (r.bool()) {
        const pd = r.pick([1, 2, 2, 3]);
        const x = r.until(() => fix(r.int(1, pd === 3 ? 1500 : pd === 2 ? 300 : 30) / 10 ** pd), (x) => dp(x) === pd);
        return {
          q: `${fmt(x)} = {0}%`, answer: [num(x * 100)],
          steps: ['小数化成百分数：把小数点向右移动两位，再添上百分号', `${fmt(x)} = ${fmt(x * 100)}%`, ...(pd === 1 ? ['小数点后只有一位，右移两位时要在末尾补一个 0'] : [])],
          hint: '小数点向哪边移动几位？',
        };
      }
      const p = r.pick([r.int(1, 99), r.int(1, 99), r.int(101, 350), fix(r.int(1, 199) / 10)]);
      return {
        q: `${fmt(p)}% = {0}`, answer: [num(p / 100)],
        steps: ['百分数化成小数：去掉百分号，把小数点向左移动两位', `${fmt(p)}% = ${fmt(p / 100)}`, ...(p < 10 ? ['位数不够时，在前面用 0 补足'] : [])],
        hint: '百分号就是“除以 100”',
      };
    },
  },
  {
    id: 'g6a-pct-frac', grade: 6, term: 1, unit: '百分数（一）', name: '百分数和分数互化',
    tip: '分数化百分数：先化成小数再化成百分数；百分数化分数：写成分母是 100 的分数再约分', level: 1, speed: 20,
    gen(r) {
      const t = r.pick(['f2p', 'f2p', 'p2f', 'p2f', 'round']);
      if (t === 'f2p') {
        const d = r.pick([2, 4, 5, 8, 10, 20, 25, 40, 50]), n = r.until(() => r.int(1, d + Math.floor(d / 2)), (n) => gcd(n, d) === 1);
        const p = fix((n / d) * 100);
        return {
          q: `${frac(n, d)} = {0}%`, answer: [num(p)],
          steps: [`先把分数化成小数：${n} ÷ ${d} = ${fmt(n / d)}`, `再化成百分数：${fmt(n / d)} = ${fmt(p)}%`, ...(100 % d === 0 ? [`也可以把分母化成 100：${frac(n, d)} = ${frac(n * (100 / d), 100)} = ${fmt(p)}%`] : [])],
          hint: '分子 ÷ 分母',
        };
      }
      if (t === 'round') {
        const d = r.pick([3, 6, 7, 9, 11, 12, 13]), n = r.until(() => r.int(1, d - 1), (n) => gcd(n, d) === 1 && (100 * n) % d !== 0);
        const v4 = Math.round((n / d) * 10000) / 10000, p = fix(Math.round((n / d) * 1000) / 10);
        return {
          q: `${frac(n, d)} ≈ {0}%（百分号前保留一位小数）`, answer: [num(p)],
          steps: [`${n} ÷ ${d} ≈ ${fmt(v4)}（除到小数第四位，好看第四位四舍五入）`, `${fmt(v4)} ≈ ${fmt(p / 100)} = ${fmt(p)}%`, '百分号前保留一位小数，就是小数保留三位'],
          hint: '先除，多除一位再四舍五入',
        };
      }
      const p = r.pick([4, 5, 8, 10, 12, 12.5, 15, 16, 20, 24, 25, 30, 35, 36, 37.5, 40, 45, 48, 50, 55, 60, 62.5, 64, 65, 70, 75, 80, 85, 87.5, 90, 95, 120, 125, 140, 150, 175]);
      const [n, d] = simplify(Math.round(p * 10), 1000);
      const s1 = Number.isInteger(p) ? `${p}% = ${frac(p, 100)}` : `${fmt(p)}% = ${fmt(p / 100)} = ${frac(Math.round(p * 10), 1000)}`;
      return {
        q: `${fmt(p)}% = {0}（填最简分数）`, answer: [fa(n, d)],
        steps: ['百分数化成分数：先写成分母是 100 的分数，再约分', s1, `约分：= ${fs(n, d)}`],
        hint: '先写成分母是 100 的分数',
      };
    },
  },
  {
    id: 'g6a-pct-rate', grade: 6, term: 1, unit: '百分数（一）', name: '求百分率', process: true,
    tip: '百分率 = 部分量 ÷ 总量 × 100%（出勤率、合格率、发芽率……）', level: 1,
    gen(r) {
      const nm = r.name();
      const c = r.pick([
        { name: '出勤率', part: '出勤人数', whole: '总人数', u: '人', lo: 36, hi: 52, pLo: 90, miss: '缺勤', s: (T, P, M) => M != null ? `六（1）班有 ${T} 人，今天缺勤 ${M} 人。今天的出勤率是多少？` : `六（1）班有 ${T} 人，今天出勤 ${P} 人。今天的出勤率是多少？` },
        { name: '合格率', part: '合格零件个数', whole: '零件总数', u: '个', lo: 100, hi: 2000, pLo: 85, miss: '不合格', s: (T, P, M) => M != null ? `工厂生产了 ${T} 个零件，经检验有 ${M} 个不合格。这批零件的合格率是多少？` : `工厂生产了 ${T} 个零件，经检验有 ${P} 个合格。这批零件的合格率是多少？` },
        { name: '发芽率', part: '发芽的粒数', whole: '种子总数', u: '粒', lo: 20, hi: 500, pLo: 75, miss: '没有发芽', s: (T, P, M) => M != null ? `${nm}做发芽试验，种了 ${T} 粒种子，有 ${M} 粒没有发芽。发芽率是多少？` : `${nm}做发芽试验，种了 ${T} 粒种子，发芽了 ${P} 粒。发芽率是多少？` },
        { name: '成活率', part: '成活的棵数', whole: '植树总数', u: '棵', lo: 50, hi: 800, pLo: 85, miss: '没有成活', s: (T, P, M) => M != null ? `学校植树 ${T} 棵，有 ${M} 棵没有成活。成活率是多少？` : `学校植树 ${T} 棵，成活了 ${P} 棵。成活率是多少？` },
        { name: '正确率', part: '做对的题数', whole: '总题数', u: '道', lo: 20, hi: 100, pLo: 70, miss: '做错', s: (T, P, M) => M != null ? `${nm}做了 ${T} 道口算题，做错了 ${M} 道。正确率是多少？` : `${nm}做了 ${T} 道口算题，做对了 ${P} 道。正确率是多少？` },
        { name: '命中率', part: '投中的次数', whole: '投篮总次数', u: '次', lo: 10, hi: 60, pLo: 30, pHi: 85, s: (T, P) => `${nm}练习投篮，投了 ${T} 次，投中 ${P} 次。命中率是多少？` },
        { name: '达标率', part: '达标人数', whole: '测试总人数', u: '人', lo: 100, hi: 400, pLo: 80, miss: '没有达标', s: (T, P, M) => M != null ? `六年级有 ${T} 人参加体育测试，其中 ${M} 人没有达标。达标率是多少？` : `六年级有 ${T} 人参加体育测试，其中 ${P} 人达标。达标率是多少？` },
      ]);
      const { T: tot, P } = r.until(() => {
        const T = r.int(c.lo, c.hi), cands = [];
        for (let P = Math.ceil((T * c.pLo) / 100); P < T && P <= (T * (c.pHi || 100)) / 100; P++) if (dp(fix((P / T) * 100)) <= 1) cands.push(P);
        return { T, P: cands.length ? r.pick(cands) : 0 };
      }, ({ P }) => P > 0);
      const p = fix((P / tot) * 100), useMiss = c.miss && r.chance(0.4), M = tot - P;
      const steps = [`${c.name} = ${c.part} ÷ ${c.whole} × 100%`];
      if (useMiss) steps.push(`先求${c.part}：${tot} - ${M} = ${P}（${c.u}）`);
      steps.push(`${P} ÷ ${tot} × 100% = ${fmt(p)}%`, `答：${c.name}是 ${fmt(p)}%。`);
      return { q: c.s(tot, P, useMiss ? M : null), answer: [num(p, { unit: '%' })], steps, hint: `${c.name}是谁占谁的百分之几？` };
    },
  },
  {
    id: 'g6a-pct-of', grade: 6, term: 1, unit: '百分数（一）', name: '求一个数的百分之几是多少', process: true,
    tip: '单位“1”已知，用乘法：单位“1”的量 × 百分率', level: 1,
    gen(r) { return partGen(r, { rev: false, pct: true }); },
  },
  {
    id: 'g6a-pct-cmp', grade: 6, term: 1, unit: '百分数（一）', name: '求甲比乙多（少）百分之几', process: true,
    tip: '比谁，谁就是单位“1”：相差的量 ÷ 单位“1”的量 × 100%', level: 2,
    gen(r) {
      const [n1, n2] = r.names(2);
      const c = r.pick([
        { lo: 200, hi: 2000, st: 10, u: '台', s: (A, B) => `某工厂计划生产 ${A} 台机器，实际生产了 ${B} 台。实际产量比计划${B > A ? '多' : '少'}百分之几？`, one: '计划产量' },
        { lo: 100, hi: 900, u: '吨', s: (A, B) => `某村去年产粮 ${A} 吨，今年产粮 ${B} 吨。今年比去年${B > A ? '增产' : '减产'}百分之几？`, one: '去年的产量' },
        { lo: 50, hi: 900, st: 10, u: '元', down: true, s: (A, B) => `一件商品原价 ${A} 元，现价 ${B} 元。现价比原价降低了百分之几？`, one: '原价' },
        { lo: 20, hi: 120, u: '吨', down: true, s: (A, B) => `${n1}家计划每月用水 ${A} 吨，实际每月用水 ${B} 吨。实际比计划节约了百分之几？`, one: '计划用水量' },
        { lo: 20, hi: 50, u: '人', swap: true, s: (A, B) => `某班有男生 ${B} 人，女生 ${A} 人。男生比女生${B > A ? '多' : '少'}百分之几？`, one: '女生人数' },
        { lo: 20, hi: 200, u: '张', swap: true, s: (A, B) => `${n1}有邮票 ${A} 张，${n2}有邮票 ${B} 张。${n2}的邮票比${n1}${B > A ? '多' : '少'}百分之几？`, one: `${n1}的张数` },
      ]);
      const { A, B, p } = r.until(() => {
        const { p, d } = pickPct(r, 5, 60), sign = c.down ? -1 : r.pick([1, -1]);
        const st = lcm(d, c.st || 1);
        if (Math.floor(c.hi / st) < Math.ceil(c.lo / st)) return {};
        const A = r.step(c.lo, c.hi, st);
        return { A, B: fix(A * (1 + (sign * p) / 100)), p };
      }, (o) => o.A && Number.isInteger(o.B) && o.B > 0);
      const D = Math.abs(B - A), word = c.down ? (c.u === '元' ? '降低了' : '节约了') : B > A ? (c.u === '吨' ? '增产' : '多') : c.u === '吨' ? '减产' : '少';
      return {
        q: c.s(A, B), answer: [num(p, { unit: '%' })],
        steps: [`和${c.one}比，把${c.one}看作单位“1”（作除数）`, `相差：${Math.max(A, B)} - ${Math.min(A, B)} = ${D}（${c.u}）`, `${D} ÷ ${A} × 100% = ${fmt(p)}%`, `另一种算法：${B} ÷ ${A} = ${fmt((B / A) * 100)}%，${B > A ? `${fmt((B / A) * 100)}% - 100%` : `100% - ${fmt((B / A) * 100)}%`} = ${fmt(p)}%`, `答：${word} ${fmt(p)}%。`],
        hint: '“比”字后面的量是单位“1”',
      };
    },
  },
  {
    id: 'g6a-pct-more', grade: 6, term: 1, unit: '百分数（一）', name: '比一个数多（少）百分之几的数', process: true,
    tip: '多百分之几：单位“1” × (1 + 百分之几)；少百分之几：单位“1” × (1 - 百分之几)', level: 2,
    gen(r) { return cmpGen(r, { sign: r.pick([1, -1]), rev: false, pct: true }); },
  },
  {
    id: 'g6a-pct-whole', grade: 6, term: 1, unit: '百分数（一）', name: '已知百分之几是多少，求单位“1”', process: true,
    tip: '单位“1”未知：设它为 x 列方程，或用 已知量 ÷ 对应的百分率', level: 2,
    gen(r) { return partGen(r, { rev: true, pct: true }); },
  },
  {
    id: 'g6a-pct-whole-more', grade: 6, term: 1, unit: '百分数（一）', name: '已知多（少）百分之几求单位“1”', process: true,
    tip: '已知量对应（1 ± 百分之几），单位“1” = 已知量 ÷（1 ± 百分之几）', level: 2,
    gen(r) { return cmpGen(r, { sign: r.pick([1, -1]), rev: true, pct: true }); },
  },
);

// ---------------- 上册 7 扇形统计图 ----------------
const PIE_SETS = [
  { title: '六年级同学最喜欢的运动', who: '六年级同学', u: '人', names: ['足球', '篮球', '跳绳', '乒乓球', '其他'] },
  { title: '同学们最喜欢的课外读物', who: '参加调查的同学', u: '人', names: ['故事书', '科技书', '漫画', '名著', '其他'] },
  { title: '某家庭一个月的支出', who: '这个家庭一个月的总支出', u: '元', names: ['食品', '教育', '交通', '服装', '其他'], money: true },
  { title: '某农场各种作物的种植面积', who: '农场的总种植面积', u: '公顷', names: ['小麦', '玉米', '大豆', '蔬菜', '其他'] },
];
function piePcts(r, k) {
  return r.until(() => { const a = []; let left = 100; for (let i = 0; i < k - 1; i++) { const p = r.step(5, Math.min(45, left - 5 * (k - 1 - i)), 5); a.push(p); left -= p; } a.push(left); return a; }, (a) => a.every((p) => p >= 5) && new Set(a).size === a.length);
}
S.push(
  {
    id: 'g6a-pie-amount', grade: 6, term: 1, unit: '扇形统计图', name: '从扇形统计图求数量', process: true,
    tip: '扇形统计图表示各部分占总数的百分之几：部分数量 = 总数 × 百分比', level: 1,
    gen(r) {
      const set = r.pick(PIE_SETS), k = r.int(4, 5), ps = piePcts(r, k);
      const items = set.names.slice(0, k - 1).map((n, i) => [n, ps[i]]).concat([[set.names[4], ps[k - 1]]]);
      const tot = set.money ? r.step(4000, 12000, 100) : r.step(set.u === '公顷' ? 100 : 120, set.u === '公顷' ? 2000 : 600, 20);
      const [i1, i2] = r.sample([...Array(k - 1).keys()], 2);
      const [a, b] = [items[i1], items[i2]];
      const diff = r.chance(0.4);
      const va = fix((tot * a[1]) / 100), vb = fix((tot * b[1]) / 100);
      const intro = set.money ? `${set.who}是 ${tot} 元` : set.u === '公顷' ? `${set.who}是 ${tot} 公顷` : `${set.who}一共有 ${tot} 人`;
      const ask = diff ? `${a[0]}比${b[0]}${a[1] > b[1] ? '多' : '少'}多少${set.u}？` : `${a[0]}有多少${set.u}？`;
      const fix0 = set.money ? '' : '';
      return {
        q: `下图是${set.title}情况。${intro}，${ask}${fix0}`,
        fig: pieFig(items),
        answer: [num(diff ? Math.abs(va - vb) : va, { unit: set.u })],
        steps: diff
          ? [`${a[0]}占 ${a[1]}%，${b[0]}占 ${b[1]}%，相差 ${Math.abs(a[1] - b[1])}%`, `${tot} × ${Math.abs(a[1] - b[1])}% = ${fmt(Math.abs(va - vb))}（${set.u}）`, `也可以分别算出 ${fmt(va)} 和 ${fmt(vb)} 再相减`, `答：${a[1] > b[1] ? '多' : '少'} ${fmt(Math.abs(va - vb))} ${set.u}。`]
          : [`从图上看，${a[0]}占总数的 ${a[1]}%`, `${tot} × ${a[1]}% = ${fmt(va)}（${set.u}）`, `答：${a[0]}有 ${fmt(va)} ${set.u}。`],
        hint: '先从图上找到这一部分占百分之几',
      };
    },
  },
  {
    id: 'g6a-pie-angle', grade: 6, term: 1, unit: '扇形统计图', name: '扇形的圆心角与百分比',
    tip: '整个圆表示 100%，对应 360°：圆心角 = 360° × 百分比', level: 2,
    gen(r) {
      const set = r.pick(PIE_SETS), name = r.pick(set.names.slice(0, 4));
      if (r.chance(0.55)) {
        const p = r.pick([5, 10, 12.5, 15, 20, 25, 30, 35, 37.5, 40, 45, 50, 55, 60, 70, 75]);
        return {
          q: `在“${set.title}”扇形统计图中，${name}占 ${fmt(p)}%。表示${name}的扇形，圆心角是多少度？`,
          answer: [num(3.6 * p, { unit: '°' })],
          steps: ['整个圆是 360°，表示总数的 100%', `${name}的扇形圆心角 = 360° × ${fmt(p)}% = ${fmt(3.6 * p)}°`],
          hint: '整个圆是多少度？',
        };
      }
      const deg = r.pick([18, 36, 45, 54, 72, 90, 108, 126, 135, 144, 162, 180, 216]);
      return {
        q: `在“${set.title}”扇形统计图中，表示${name}的扇形圆心角是 ${deg}°。${name}占总数的百分之几？`,
        answer: [num((deg / 360) * 100, { unit: '%' })],
        steps: ['整个圆 360° 表示 100%', `${deg}° ÷ 360° = ${fs(deg, 360)} = ${fmt((deg / 360) * 100)}%`],
        hint: `${deg}° 占 360° 的几分之几？`,
      };
    },
  },
);

// ---------------- 上册 8 数学广角——数与形 ----------------
/** 小棒摆图：kind 'sq' 一排正方形 / 'tri' 一排三角形，画出前 3 个图 */
function sticksFig(kind) {
  let s = '', x0 = 10;
  const u = 34;
  for (let n = 1; n <= 3; n++) {
    if (kind === 'sq') {
      for (let i = 0; i < n; i++) s += `<rect x="${x0 + i * u}" y="30" width="${u}" height="${u}" fill="none" stroke="${C.line}" stroke-width="3"/>`;
      s += T(x0 + (n * u) / 2, 88, `${n} 个`, { size: 13, color: C.dash });
      x0 += n * u + 28;
    } else {
      const pts = [];
      for (let i = 0; i < n; i++) {
        const bx = x0 + Math.floor(i / 2) * u + (i % 2 ? u / 2 : 0);
        if (i % 2 === 0) pts.push(`<polygon points="${bx},64 ${bx + u},64 ${bx + u / 2},34" fill="none" stroke="${C.line}" stroke-width="3"/>`);
        else pts.push(`<polygon points="${bx},34 ${bx + u},34 ${bx + u / 2},64" fill="none" stroke="${C.line}" stroke-width="3"/>`);
      }
      s += pts.join('');
      const w = Math.ceil(n / 2) * u + (n % 2 === 0 ? u / 2 : 0);
      s += T(x0 + w / 2, 88, `${n} 个`, { size: 13, color: C.dash });
      x0 += w + 28;
    }
  }
  return fig.raw(x0, 100, s);
}
S.push(
  {
    id: 'g6a-shape-odd', grade: 6, term: 1, unit: '数学广角——数与形', name: '连续奇数的和',
    tip: '从 1 开始连续 n 个奇数相加，和是 n × n；最后一个奇数是 2n - 1', level: 2,
    gen(r) {
      const n = r.int(5, 30), last = 2 * n - 1, t = r.int(1, 3);
      if (t === 1) return {
        q: `1 + 3 + 5 + … + ${last} = {0}`, answer: [num(n * n)],
        steps: ['画正方形点阵：1 个点、再添 3 个成 2 × 2、再添 5 个成 3 × 3……', `从 1 到 ${last} 一共有 (${last} + 1) ÷ 2 = ${n} 个奇数`, `和 = ${n} × ${n} = ${n * n}`],
        hint: '先数一数有几个奇数',
      };
      if (t === 2) return {
        q: `1 + 3 + 5 + … + {0} = ${n * n}`, answer: [num(last)],
        steps: [`连续奇数的和是 n × n，${n * n} = ${n} × ${n}，所以一共 ${n} 个奇数`, `第 ${n} 个奇数是 2 × ${n} - 1 = ${last}`],
        hint: `${n * n} 是几乘几？`,
      };
      return {
        q: `1 + 2 + 3 + … + ${n - 1} + ${n} + ${n - 1} + … + 3 + 2 + 1 = {0}`, answer: [num(n * n)],
        steps: ['这样“先加上去再加下来”的和，正好是中间那个数乘它自己', `把正方形点阵沿对角线一斜行一斜行地数：1、2、…、${n}、…、2、1`, `和 = ${n} × ${n} = ${n * n}`],
        hint: '中间最大的数是几？',
      };
    },
  },
  {
    id: 'g6a-shape-half', grade: 6, term: 1, unit: '数学广角——数与形', name: '二分之一加四分之一……的和',
    tip: '用正方形表示 1：每次涂剩下的一半，加到最后剩下的空白正好是最后一个数', level: 3, pool: 24,
    gen(r) {
      const n = r.int(3, 10), D = 2 ** n, t = r.int(1, 3);
      const terms = n <= 4 ? [...Array(n).keys()].map((i) => frac(1, 2 ** (i + 1))).join(' + ') : `${frac(1, 2)} + ${frac(1, 4)} + ${frac(1, 8)} + … + ${frac(1, D)}`;
      if (t === 1) return {
        q: `${terms} = {0}`, answer: [fa(D - 1, D)],
        steps: ['把一个正方形看作 1：先涂一半，再涂剩下的一半，再涂剩下的一半……', `涂到 ${frac(1, D)} 时，空白部分正好也是 ${frac(1, D)}`, `所以和 = 1 - ${frac(1, D)} = ${frac(D - 1, D)}`],
        hint: '还差多少就是 1？',
      };
      if (t === 2) return {
        q: `1 - ${terms.replace(/ \+ /g, ' - ')} = {0}`, answer: [fa(1, D)],
        steps: [`减去的这些数的和是 1 - ${frac(1, D)}`, `所以结果就是最后一个数 ${frac(1, D)}`],
        hint: '从 1 里一次次减去剩下的一半',
      };
      return {
        q: `${terms} + ${frac(1, D)} = {0}`, answer: [num(1)],
        steps: [`${terms} = 1 - ${frac(1, D)}`, `再加上 ${frac(1, D)}，正好补成 1`, `也可以从后往前合并：${frac(1, D)} + ${frac(1, D)} = ${frac(1, D / 2)}，再和前一个数合并……最后得 1`],
        hint: '最后两个数相加是多少？',
      };
    },
  },
  {
    id: 'g6a-shape-sticks', grade: 6, term: 1, unit: '数学广角——数与形', name: '摆小棒找规律',
    tip: '第 1 个图形用的根数 + 每多 1 个图形多用的根数 ×（个数 - 1）', level: 2,
    gen(r) {
      const kind = r.pick(['sq', 'tri']), first = kind === 'sq' ? 4 : 3, add = kind === 'sq' ? 3 : 2, shape = kind === 'sq' ? '正方形' : '三角形';
      const n = r.int(6, 60), sticks = first + add * (n - 1), rev = r.chance(0.4);
      return {
        q: rev ? `用小棒像下图这样一排摆${shape}。用 ${sticks} 根小棒，可以摆多少个${shape}？` : `用小棒像下图这样一排摆${shape}。摆 ${n} 个${shape}需要多少根小棒？`,
        fig: sticksFig(kind),
        answer: [num(rev ? n : sticks, { unit: rev ? '个' : '根' })],
        steps: [`摆 1 个用 ${first} 根，以后每多摆 1 个只多用 ${add} 根（有一根和前面的共用）`, `摆 n 个：${first} + ${add} × (n - 1) = ${add}n + ${first - add}`, rev ? `${add}n + ${first - add} = ${sticks}，n = (${sticks} - ${first - add}) ÷ ${add} = ${n}` : `n = ${n}：${add} × ${n} + ${first - add} = ${sticks}（根）`],
        hint: '每多摆 1 个，多用几根？',
      };
    },
  },
);

// ---------------- 上册 拓展：工程问题、分数应用综合、浓度 ----------------
const WORK_PAIRS = [];
for (let a = 3; a <= 40; a++) for (let b = a + 1; b <= 60; b++) if ((a * b) % (a + b) === 0) WORK_PAIRS.push([a, b]);
function workCtx(r) {
  const [n1, n2] = r.names(2);
  return r.pick([
    { u: '天', s: (a, b) => `修一条路，甲队单独修 ${a} 天修完，乙队单独修 ${b} 天修完。`, x: '甲队', y: '乙队', act: '合修' },
    { u: '小时', s: (a, b) => `一份稿件，${n1}单独打要 ${a} 小时打完，${n2}单独打要 ${b} 小时打完。`, x: n1, y: n2, act: '合打' },
    { u: '小时', s: (a, b) => `一个水池，单开甲管 ${a} 小时可以注满，单开乙管 ${b} 小时可以注满。`, x: '甲管', y: '乙管', act: '两管同时开' },
    { u: '天', s: (a, b) => `加工一批零件，师傅单独做 ${a} 天完成，徒弟单独做 ${b} 天完成。`, x: '师傅', y: '徒弟', act: '师徒合作' },
    { u: '天', s: (a, b) => `粉刷一栋教学楼，甲工程队单独刷要 ${a} 天，乙工程队单独刷要 ${b} 天。`, x: '甲队', y: '乙队', act: '两队合刷' },
  ]);
}
S.push(
  {
    id: 'g6a-work-together', grade: 6, term: 1, unit: '分数除法', name: '工程问题：合作完成要多久', process: true,
    tip: '把工作总量看作单位“1”，工作效率 = 1 ÷ 单独完成的时间；合作时间 = 1 ÷ 效率和', level: 3,
    gen(r) {
      const [a, b] = r.pick(WORK_PAIRS.filter(([a, b]) => b <= 45)), c = workCtx(r), t = (a * b) / (a + b);
      const eff = Fr.add([1, a], [1, b]);
      return {
        q: c.s(a, b) + `${c.act}，多少${c.u}能完成？`,
        answer: [num(t, { unit: c.u })],
        steps: ['工作总量不知道，把它看作单位“1”', `${c.x}每${c.u}完成 ${frac(1, a)}，${c.y}每${c.u}完成 ${frac(1, b)}`, `合作每${c.u}完成：${addLine([1, a], [1, b])}`, `合作时间 = 工作总量 ÷ 工作效率和：1 ÷ ${F(eff)} = ${t}（${c.u}）`, `答：${c.act} ${t} ${c.u}能完成。`],
        hint: '每个人一天（一小时）能完成几分之几？',
      };
    },
  },
  {
    id: 'g6a-work-part', grade: 6, term: 1, unit: '分数除法', name: '工程问题：合作几天后完成几分之几', process: true,
    tip: '已完成的分率 = 效率和 × 合作时间；还剩 = 1 - 已完成', level: 3,
    gen(r) {
      const NICE = [4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30];
      const { a, b, t } = r.until(() => { const [a, b] = r.sample(NICE, 2).sort((x, y) => x - y); return { a, b, t: r.int(2, 6) }; }, ({ a, b, t }) => {
        const done = Fr.mul(Fr.add([1, a], [1, b]), [t, 1]); return lcm(a, b) <= 60 && done[0] < done[1] && done[1] <= 30;
      });
      const c = workCtx(r), eff = Fr.add([1, a], [1, b]), done = Fr.mul(eff, [t, 1]), left = Fr.sub([1, 1], done), askLeft = r.bool();
      return {
        q: c.s(a, b) + `${c.act} ${t} ${c.u}后，${askLeft ? '还剩这项工作的几分之几' : '完成了这项工作的几分之几'}？`,
        answer: [faX(askLeft ? left : done)],
        steps: ['把工作总量看作单位“1”', `效率和：${addLine([1, a], [1, b])}`, `${t} ${c.u}完成：${F(eff)} × ${t} = ${F(done)}`, ...(askLeft ? [`还剩：1 - ${F(done)} = ${F(left)}`] : []), `答：${askLeft ? '还剩' : '完成了'}这项工作的 ${F(askLeft ? left : done)}。`],
        hint: '合作一天完成几分之几？',
      };
    },
  },
  {
    id: 'g6a-frac-remain', grade: 6, term: 1, unit: '分数除法', name: '分数应用：分率的单位“1”变了', process: true,
    tip: '“余下的几分之几”是以余下的量为单位“1”；“全书的几分之几”是以全书为单位“1”；先求剩下的量占全部的几分之几', level: 3,
    gen(r) {
      const nm = r.name();
      const c = r.pick([
        { u: '页', lo: 60, hi: 600, s: (a, b, R, rest) => `${nm}看一本书，第一天看了全书的 ${a}，第二天看了${rest ? '余下的' : '全书的'} ${b}，还剩 ${R} 页没看。这本书一共有多少页？`, all: '全书', a: '这本书一共有' },
        { u: '米', lo: 200, hi: 3000, s: (a, b, R, rest) => `修一条路，第一周修了全长的 ${a}，第二周修了${rest ? '余下的' : '全长的'} ${b}，还剩 ${R} 米没修。这条路全长多少米？`, all: '全长', a: '这条路全长' },
        { u: '千克', lo: 60, hi: 600, s: (a, b, R, rest) => `水果店运来一批苹果，上午卖出了 ${a}，下午卖出了${rest ? '余下的' : '这批苹果的'} ${b}，还剩 ${R} 千克。这批苹果一共有多少千克？`, all: '这批苹果', a: '这批苹果一共有' },
        { u: '元', lo: 60, hi: 600, s: (a, b, R, rest) => `${nm}有一些钱，买书用去了 ${a}，买文具用去了${rest ? '余下的' : '总钱数的'} ${b}，还剩 ${R} 元。${nm}原来有多少元？`, all: '总钱数', a: `${nm}原来有` },
      ]);
      const rest = r.chance(0.65);
      const o = r.until(() => {
        const f = rfrac(r, 2, 8), g = rfrac(r, 2, 8);
        const remainF = rest ? Fr.mul(Fr.sub([1, 1], f), Fr.sub([1, 1], g)) : Fr.sub(Fr.sub([1, 1], f), g);
        if (remainF[0] <= 0) return {};
        const st = lcm(lcm(f[1], g[1]), remainF[1]);
        if (Math.floor(c.hi / st) < Math.ceil(c.lo / st)) return {};
        const tot = r.step(c.lo, c.hi, st);
        return { f, g, remainF, tot, R: (tot * remainF[0]) / remainF[1] };
      }, (o) => o.tot && Fr.val(o.f) <= 0.6 && Fr.val(o.g) <= 0.6 && o.f[1] !== o.g[1]);
      const { f, g, remainF, tot, R } = o;
      const steps = rest
        ? [`第一个分率 ${F(f)} 的单位“1”是${c.all}；“余下的 ${F(g)}”的单位“1”是第一次后余下的量`, `第一次后余下${c.all}的 1 - ${F(f)} = ${F(Fr.sub([1, 1], f))}`, `第二次后又剩下“余下的” 1 - ${F(g)} = ${F(Fr.sub([1, 1], g))}，所以还剩${c.all}的 ${F(Fr.sub([1, 1], f))} × ${F(Fr.sub([1, 1], g))} = ${F(remainF)}`]
        : [`两个分率的单位“1”都是${c.all}`, `还剩${c.all}的 1 - ${F(f)} - ${F(g)} = ${F(remainF)}`];
      steps.push(`${R} ${c.u}对应 ${F(remainF)}，${c.all}：${R} ÷ ${F(remainF)} = ${tot}（${c.u}）`, `答：${c.a} ${tot} ${c.u}。`);
      return { q: c.s(F(f), F(g), R, rest), answer: [num(tot, { unit: c.u })], steps, hint: '第二个分率是谁的几分之几？' };
    },
  },
  {
    id: 'g6a-frac-swap', grade: 6, term: 1, unit: '分数除法', name: '多几分之几与少几分之几互换', process: true,
    tip: '比的对象变了，单位“1”就变了：把两个量画成份数来比', level: 3,
    gen(r) {
      const [n1, n2] = r.names(2);
      const c = r.pick([
        { x: '苹果树', y: '梨树', w: '的棵数' }, { x: '男生', y: '女生', w: '人数' }, { x: '甲数', y: '乙数', w: '' },
        { x: n1, y: n2, w: '的邮票张数' }, { x: '今年', y: '去年', w: '的产量' }, { x: '大桶', y: '小桶', w: '的容量' },
      ]);
      const t = r.int(1, 3);
      const [n, d] = r.until(() => rfrac(r, 2, 12), ([n, d]) => (t === 2 ? n / d < 0.5 : t === 3 ? n / d > 0.5 : true));
      const X = c.x + c.w, Y = c.y + c.w;
      let q, ans, steps;
      if (t === 1) {
        q = `${X}比${c.y}多 ${frac(n, d)}，${c.y}比${c.x}少几分之几？`; ans = [n, d + n];
        steps = [`把${Y}看作 ${d} 份，${X}比它多 ${n} 份，${X}是 ${d + n} 份`, `现在和${X}比，${X}是单位“1”（${d + n} 份）`, `${Y}比${X}少 ${n} 份：${n} ÷ ${d + n} = ${fs(n, d + n)}`];
      } else if (t === 2) {
        q = `${X}比${c.y}少 ${frac(n, d)}，${c.y}比${c.x}多几分之几？`; ans = [n, d - n];
        steps = [`把${Y}看作 ${d} 份，${X}比它少 ${n} 份，${X}是 ${d - n} 份`, `现在和${X}比，${X}是单位“1”（${d - n} 份）`, `${Y}比${X}多 ${n} 份：${n} ÷ ${d - n} = ${fs(n, d - n)}`];
      } else {
        q = `${X}是${c.y}的 ${frac(n, d)}，${c.y}比${c.x}多几分之几？`; ans = [d - n, n];
        steps = [`把${Y}看作 ${d} 份，${X}就是 ${n} 份`, `和${X}比，${X}是单位“1”（${n} 份）`, `${Y}比${X}多 ${d - n} 份：${d - n} ÷ ${n} = ${fs(d - n, n)}`];
      }
      steps.push('易错：两个“几分之几”的单位“1”不同，答案不是同一个分数');
      return { q, answer: [faX(simplify(...ans))], steps, hint: '把两个量都写成几份' };
    },
  },
  {
    id: 'g6a-conc-basic', grade: 6, term: 1, unit: '百分数（一）', name: '浓度问题：含盐率和含糖率', process: true,
    tip: '含盐率 = 盐的质量 ÷ 盐水的质量 × 100%；盐水 = 盐 + 水', level: 3,
    gen(r) {
      const [sol, solv, rate] = r.pick([['盐', '盐水', '含盐率'], ['糖', '糖水', '含糖率']]);
      const { p, T: tot } = r.until(() => { const p = r.pick([4, 5, 8, 10, 12, 12.5, 15, 16, 20, 25, 30]); return { p, T: r.step(50, 1000, 10) }; }, ({ p, T }) => Number.isInteger(fix((T * p) / 100)));
      const s = fix((tot * p) / 100), w = tot - s, t = r.int(1, 3);
      if (t === 1) return {
        q: `把 ${s} 克${sol}放入 ${w} 克水中，完全溶解后，${solv}的${rate}是多少？`,
        answer: [num(p, { unit: '%' })],
        steps: [`${solv}的质量 = ${sol} + 水 = ${s} + ${w} = ${tot}（克）`, `${rate} = ${sol} ÷ ${solv} × 100% = ${s} ÷ ${tot} × 100% = ${fmt(p)}%`, `易错：不能用 ${s} ÷ ${w}，要除以${solv}的质量`],
        hint: `${rate}是${sol}占谁的百分之几？`,
      };
      if (t === 2) return {
        q: `有${rate}为 ${fmt(p)}% 的${solv} ${tot} 克，其中含${sol}多少克？含水多少克？`,
        answer: [num(s, { label: sol, unit: '克' }), num(w, { label: '水', unit: '克' })],
        steps: [`${sol}：${tot} × ${fmt(p)}% = ${s}（克）`, `水：${tot} - ${s} = ${w}（克）`],
        hint: '求一个数的百分之几是多少，用乘法',
      };
      return {
        q: `一种${solv}的${rate}是 ${fmt(p)}%，其中含${sol} ${s} 克。这种${solv}有多少克？需要水多少克？`,
        answer: [num(tot, { label: solv, unit: '克' }), num(w, { label: '水', unit: '克' })],
        steps: [`${solv} × ${fmt(p)}% = ${s}，${solv}：${s} ÷ ${fmt(p)}% = ${tot}（克）`, `水：${tot} - ${s} = ${w}（克）`],
        hint: `${s} 克是${solv}的百分之几？`,
      };
    },
  },
  {
    id: 'g6a-conc-dilute', grade: 6, term: 1, unit: '百分数（一）', name: '浓度问题：加水稀释', process: true,
    tip: '加水时盐（溶质）的质量不变：先求盐，再用 盐 ÷ 新的含盐率 求新盐水', level: 3,
    gen(r) {
      const [sol, solv, rate] = r.pick([['盐', '盐水', '含盐率'], ['糖', '糖水', '含糖率'], ['药', '药水', '含药率']]);
      const { M, p1, p2 } = r.until(() => ({ M: r.step(100, 1000, 50), p1: r.pick([10, 15, 20, 25, 30, 40]), p2: r.pick([4, 5, 8, 10, 12, 15, 20, 25]) }), ({ M, p1, p2 }) => p2 < p1 && Number.isInteger(fix((M * p1) / 100)) && Number.isInteger(fix((M * p1) / p2)));
      const s = fix((M * p1) / 100), N = fix((s * 100) / p2), W = N - M;
      if (r.bool()) return {
        q: `有${rate}为 ${p1}% 的${solv} ${M} 克，要把它稀释成${rate}为 ${p2}% 的${solv}，需要加水多少克？`,
        answer: [num(W, { unit: '克' })],
        steps: [`加水前后，${sol}的质量不变：${M} × ${p1}% = ${s}（克）`, `稀释后的${solv}：${s} ÷ ${p2}% = ${N}（克）`, `加水：${N} - ${M} = ${W}（克）`, `答：需要加水 ${W} 克。`],
        hint: '加水时什么没有变？',
      };
      return {
        q: `有${rate}为 ${p1}% 的${solv} ${M} 克，加入 ${W} 克水后，${rate}是多少？`,
        answer: [num(p2, { unit: '%' })],
        steps: [`${sol}的质量不变：${M} × ${p1}% = ${s}（克）`, `加水后${solv}：${M} + ${W} = ${N}（克）`, `${rate}：${s} ÷ ${N} × 100% = ${p2}%`],
        hint: `加水后${solv}变多了，${sol}变了吗？`,
      };
    },
  },
);

// ================= 下册 =================
// ---------------- 下册 1 负数 ----------------
/** 带符号的数：正数写 +，负数写 -（分数用 -{{3/4}}） */
const sgn = (x, plus = true) => (x > 0 && plus ? '+' : '') + fmt(x);
S.push(
  {
    id: 'g6b-neg-identify', grade: 6, term: 2, unit: '负数', name: '认识正数和负数',
    tip: '带“-”号的是负数，比 0 大的是正数（“+”可以省略）；0 既不是正数也不是负数', level: 1,
    gen(r) {
      const pool = r.shuffle([
        ...r.sample([1, 2, 3, 5, 6, 8, 12, 15, 20, 36, 100], 2).map((v) => ({ s: r.bool() ? `+${v}` : `${v}`, v })),
        ...r.sample([-1, -2, -3, -4, -6, -9, -15, -30], 2).map((v) => ({ s: fmt(v), v })),
        { s: '0', v: 0 },
        ...(() => { const f = rfrac(r, 2, 9); return r.bool() ? [{ s: `-${frac(f[0], f[1])}`, v: -1 }] : [{ s: frac(f[0], f[1]), v: 1 }]; })(),
        ...(() => { const d = fix(r.int(1, 99) / 10); return r.bool() ? [{ s: `-${fmt(d)}`, v: -d }] : [{ s: `+${fmt(d)}`, v: d }]; })(),
        ...(r.bool() ? [{ s: `-${fmt(r.int(101, 999))}`, v: -2 }] : []),
      ]);
      const askNeg = r.bool();
      const pick = pool.filter((x) => (askNeg ? x.v < 0 : x.v > 0));
      return {
        q: `下面各数中，${askNeg ? '负数' : '正数'}有 {0} 个。\n${pool.map((x) => x.s).join('，  ')}`,
        answer: [num(pick.length, { unit: '个' })],
        steps: [`${askNeg ? '负数' : '正数'}是：${pick.map((x) => x.s).join('，')}`, `一共 ${pick.length} 个`, '注意：0 既不是正数也不是负数；“+”号可以省略，不带符号的非 0 数是正数'],
        hint: '0 算不算？',
      };
    },
  },
  {
    id: 'g6b-neg-meaning', grade: 6, term: 2, unit: '负数', name: '用正负数表示相反意义的量',
    tip: '先规定一种意义为正，和它相反的意义就记作负', level: 1,
    gen(r) {
      const c = r.pick([
        { p: '收入', n: '支出', u: '元', lo: 50, hi: 3000, st: 10 },
        { p: '零上', n: '零下', u: '℃', lo: 1, hi: 30, temp: true },
        { p: '高于海平面', n: '低于海平面', u: '米', lo: 10, hi: 5000 },
        { p: '向东走', n: '向西走', u: '米', lo: 10, hi: 900, st: 10 },
        { p: '体重增加', n: '体重减少', u: '千克', lo: 1, hi: 5 },
        { p: '存入', n: '取出', u: '元', lo: 100, hi: 5000, st: 100 },
        { p: '盈利', n: '亏损', u: '万元', lo: 1, hi: 80 },
        { p: '水位上升', n: '水位下降', u: '厘米', lo: 2, hi: 60 },
      ]);
      const a = r.step(c.lo, c.hi, c.st || 1), b = r.until(() => r.step(c.lo, c.hi, c.st || 1), (b) => b !== a);
      const swap = r.chance(0.3);
      const [P, N] = swap ? [c.n, c.p] : [c.p, c.n];
      const sp = c.temp ? '' : ' ', say = (w, x) => `${w} ${x}${sp}${c.u}`;
      if (r.chance(0.3)) {
        const opt = [say(P, b), say(N, b)];
        return {
          q: `如果${say(P, a)}记作 +${a}${sp}${c.u}，那么 -${b}${sp}${c.u}表示什么？`,
          answer: [choice(opt, say(N, b))],
          steps: [`规定“${P}”为正`, `负数表示和它相反的意义：“${N}”`, `-${b}${sp}${c.u}表示${say(N, b)}`],
          hint: '“-”表示和正方向相反的意义',
        };
      }
      return {
        q: `如果${say(P, a)}记作 +${a}${sp}${c.u}，那么${say(N, b)}记作 {0}${sp}${c.u}。`,
        answer: [num(-b)],
        steps: [`题目规定“${P}”记作正数`, `“${N}”和“${P}”意义相反，要记作负数`, `${say(N, b)}记作 -${b}${sp}${c.u}`],
        hint: '意义相反，符号也相反',
      };
    },
  },
  {
    id: 'g6b-neg-compare', grade: 6, term: 2, unit: '负数', name: '正负数比大小',
    tip: '正数 > 0 > 负数；两个负数比较，负号后面的数越大，这个负数反而越小', level: 1, speed: 8,
    gen(r) {
      const t = r.int(1, 5);
      let a, b, sa, sb;
      if (t === 1) { a = -r.int(1, 30); b = r.until(() => -r.int(1, 30), (x) => x !== a); }
      else if (t === 2) { a = -r.int(1, 20); b = r.pick([0, r.int(1, 20)]); }
      else if (t === 3) { a = -fix(r.int(1, 99) / 10); b = r.until(() => -fix(r.int(1, 99) / 10), (x) => x !== a && Math.abs(Math.trunc(x) - Math.trunc(a)) <= 1); }
      else if (t === 4) { const f = rfrac(r, 2, 9), g = r.until(() => rfrac(r, 2, 9), (g) => Fr.val(g) !== Fr.val(f)); a = -Fr.val(f); b = -Fr.val(g); sa = `-${F(f)}`; sb = `-${F(g)}`; }
      else { a = -r.int(1, 9); b = a; if (r.bool()) { b = -a; } }
      sa = sa || fmt(a); sb = sb || fmt(b);
      if (r.bool()) { [a, b] = [b, a]; [sa, sb] = [sb, sa]; }
      const ans = a > b ? '>' : a < b ? '<' : '=';
      const steps = [];
      if (a < 0 && b < 0) steps.push(`两个负数比较：看负号后面的数，${sa.slice(1)} 和 ${sb.slice(1)}，大的那个负数反而小`, `在数轴上，${ans === '<' ? sa : sb} 在 ${ans === '<' ? sb : sa} 的左边`);
      else if (a === b) steps.push('两个数相同');
      else steps.push('正数都大于 0，负数都小于 0，所以负数比 0 和正数都小');
      steps.push(`${sa} ${ans} ${sb}`);
      return { q: `${sa} {0} ${sb}`, answer: [choice(['>', '<', '='], ans)], steps, hint: '想想它们在数轴上谁在左边' };
    },
  },
  {
    id: 'g6b-neg-numberline', grade: 6, term: 2, unit: '负数', name: '数轴上的点表示的数',
    tip: '0 右边是正数，左边是负数；先看一格表示多少，再从 0 开始数格', level: 1,
    gen(r) {
      const half = r.chance(0.4);
      if (!half) {
        const min = r.int(-8, -4), max = min + 10;
        const [va, vb] = r.until(() => [r.int(min + 1, -1), r.int(1, max - 1)], ([x, y]) => (x - min) % 2 === 1 && (y - min) % 2 === 1);
        const [A, B] = r.bool() ? [va, vb] : [vb, va];
        return {
          q: '数轴上 A 点表示的数是 {0}，B 点表示的数是 {1}。',
          fig: fig.numberLine({ min, max, step: 1, labelEvery: 2, marks: [{ v: A, label: 'A' }, { v: B, label: 'B' }] }),
          answer: [num(A, { label: 'A' }), num(B, { label: 'B' })],
          steps: ['数轴上每一小格表示 1', `A 点在 ${A < 0 ? '0 的左边' : '0 的右边'}，离 0 有 ${Math.abs(A)} 格，表示 ${A}`, `B 点在 ${B < 0 ? '0 的左边' : '0 的右边'}，离 0 有 ${Math.abs(B)} 格，表示 ${B}`],
          hint: '先找到 0，再看在 0 的哪一边、离 0 几格',
        };
      }
      const min = r.int(-4, -2), max = min + 6;
      const [va, vb] = [fix(r.int(min * 2 + 1, -1) / 2), fix(r.int(1, max * 2 - 1) / 2)];
      const A = Number.isInteger(va) ? fix(va - 0.5) : va, B = Number.isInteger(vb) ? fix(vb + 0.5) : vb;
      return {
        q: '数轴上 A 点表示的数是 {0}，B 点表示的数是 {1}。（填小数）',
        fig: fig.numberLine({ min, max, step: 0.5, labelEvery: 2, marks: [{ v: A, label: 'A' }, { v: B, label: 'B' }] }),
        answer: [num(A, { label: 'A' }), num(B, { label: 'B' })],
        steps: ['相邻两个整数之间平均分成 2 格，每格表示 0.5', `A 点在 0 的左边，在 ${Math.ceil(A)} 和 ${Math.floor(A)} 的正中间，表示 ${fmt(A)}`, `B 点在 0 的右边，在 ${Math.floor(B)} 和 ${Math.ceil(B)} 的正中间，表示 ${fmt(B)}`],
        hint: '一小格表示多少？',
      };
    },
  },
  {
    id: 'g6b-neg-move', grade: 6, term: 2, unit: '负数', name: '在数轴上移动',
    tip: '向右移动数变大，向左移动数变小；跨过 0 时分两段数', level: 2,
    gen(r) {
      const A = r.int(-6, 6), k = r.int(2, 8), right = r.bool(), B = right ? A + k : A - k;
      if (Math.abs(B) > 9) return this.gen(r);
      return {
        q: `数轴上 A 点表示 ${A}。从 A 点向${right ? '右' : '左'}移动 ${k} 个单位长度到达 B 点，B 点表示的数是 {0}。`,
        fig: fig.numberLine({ min: -10, max: 10, step: 1, labelEvery: 2, marks: [{ v: A, label: 'A' }] }),
        answer: [num(B)],
        steps: [`向${right ? '右' : '左'}移动，数会变${right ? '大' : '小'}`, ...(A * B < 0 ? [`先从 ${A} 移到 0 用 ${Math.abs(A)} 格，再移 ${k - Math.abs(A)} 格到 ${B}`] : [`从 ${A} 数 ${k} 格到 ${B}`]), `B 点表示 ${B}`],
        hint: '在数轴上一格一格地数',
      };
    },
  },
  {
    id: 'g6b-neg-diff', grade: 6, term: 2, unit: '负数', name: '温差和海拔差',
    tip: '一正一负：两个数离 0 的距离相加；都是负数：离 0 的距离相减', level: 2,
    gen(r) {
      const t = r.int(1, 3);
      if (t === 1) {
        const hi = r.int(1, 15), lo = -r.int(1, 15), place = r.pick(['北京', '哈尔滨', '沈阳', '呼和浩特', '张家口']);
        return {
          q: `${place}某天的最高气温是 ${hi}℃，最低气温是 ${lo}℃。这天的温差是多少摄氏度？`,
          fig: fig.numberLine({ min: -16, max: 16, step: 2, labelEvery: 2, marks: [{ v: lo, label: '最低' }, { v: hi, label: '最高' }] }),
          answer: [num(hi - lo, { unit: '℃' })],
          steps: [`最高 ${hi}℃ 比 0℃ 高 ${hi}℃，最低 ${lo}℃ 比 0℃ 低 ${-lo}℃`, `温差：${hi} + ${-lo} = ${hi - lo}（℃）`, '易错：不能算成 ' + hi + ' - ' + -lo],
          hint: '从最低温度到 0℃，再从 0℃ 到最高温度',
        };
      }
      if (t === 2) {
        const a = -r.int(1, 12), b = r.until(() => -r.int(5, 25), (b) => b < a);
        return {
          q: `某地冬季一天的最高气温是 ${a}℃，最低气温是 ${b}℃。这天的温差是多少摄氏度？`,
          answer: [num(a - b, { unit: '℃' })],
          steps: [`两个温度都在 0℃ 以下：${b}℃ 离 0℃ ${-b}℃，${a}℃ 离 0℃ ${-a}℃`, `温差：${-b} - ${-a} = ${a - b}（℃）`],
          hint: '在数轴上它们相距几格？',
        };
      }
      const up = r.int(100, 3000), down = r.int(10, 400);
      const [A, B] = r.pick([['山顶', '盆地最低处'], ['山峰', '湖底'], ['观景台', '矿井底部']]);
      return {
        q: `${A}的海拔是 +${up} 米，${B}的海拔是 -${down} 米。${A}比${B}高多少米？`,
        answer: [num(up + down, { unit: '米' })],
        steps: [`${A}比海平面高 ${up} 米，${B}比海平面低 ${down} 米`, `相差：${up} + ${down} = ${up + down}（米）`],
        hint: '以海平面为 0，一个在上一个在下',
      };
    },
  },
  {
    id: 'g6b-neg-standard', grade: 6, term: 2, unit: '负数', name: '以标准量记正负数', process: true,
    tip: '超过标准记正、不足标准记负；实际 = 标准 + 超出的（或 - 不足的）', level: 2,
    gen(r) {
      const c = r.pick([
        { std: 500, u: '克', name: '每袋大米', item: '大米', unit0: '袋', ask: (i) => `第 ${i} 袋大米实际重多少克？` },
        { std: 90, u: '分', name: '', item: '同学', unit0: '名', score: true, ask: (i) => `第 ${i} 名同学实际得了多少分？` },
        { std: 40, u: '千克', name: '每筐苹果', item: '苹果', unit0: '筐', ask: (i) => `第 ${i} 筐苹果实际重多少千克？` },
        { std: 100, u: '个', name: '每天生产零件', item: '零件', unit0: '天', days: true, ask: (i) => `第 ${i} 天实际生产零件多少个？` },
      ]);
      const std = c.std;
      const k = 5;
      const recs = r.until(() => Array.from({ length: k }, () => r.int(-6, c.score ? 8 : 6)), (a) => a.some((x) => x < 0) && a.some((x) => x > 0) && new Set(a).size >= 4 && (!c.score || a.every((x) => std + x <= 100)));
      const show = recs.map((x) => (x > 0 ? `+${x}` : `${x}`)).join('，');
      const t = r.int(1, 3);
      const intro = c.score ? `数学测验以 90 分为标准，高出的分数记作正数，不足的记作负数。5 名同学的成绩记录如下：${show}。` : c.days ? `工厂以每天生产零件 ${std} 个为标准，多生产的记作正数，少生产的记作负数。5 天的记录如下：${show}（单位：个）。` : `以${c.name} ${std} ${c.u}为标准，超过的记作正数，不足的记作负数。${k} ${c.unit0}${c.item}的记录如下：${show}（单位：${c.u}）。`;
      const pos = recs.filter((x) => x > 0), neg = recs.filter((x) => x < 0), net = recs.reduce((a, b) => a + b, 0);
      if (t === 1) {
        const tot = std * k + net;
        return {
          q: intro + (c.score ? '这 5 名同学一共得了多少分？' : c.days ? '这 5 天一共生产零件多少个？' : `这 ${k} ${c.unit0}${c.item}一共多少${c.u}？`),
          answer: [num(tot, { unit: c.u })],
          steps: [`标准总量：${std} × ${k} = ${std * k}（${c.u}）`, `超出的：${pos.join(' + ')} = ${pos.reduce((a, b) => a + b, 0)}，不足的：${neg.map((x) => -x).join(' + ')} = ${-neg.reduce((a, b) => a + b, 0)}`, `合起来比标准${net >= 0 ? '多' : '少'} ${Math.abs(net)} ${c.u}`, `实际：${std * k} ${net >= 0 ? '+' : '-'} ${Math.abs(net)} = ${tot}（${c.u}）`],
          hint: '先算标准总量，再算一共多了还是少了',
        };
      }
      if (t === 2) {
        const mx = Math.max(...recs), mn = Math.min(...recs);
        return {
          q: intro + (c.score ? '最高分比最低分高多少分？' : c.days ? '生产最多的一天比最少的一天多生产多少个？' : `最重的一${c.unit0}比最轻的一${c.unit0}重多少${c.u}？`),
          answer: [num(mx - mn, { unit: c.u })],
          steps: [`最大的记录是 ${mx > 0 ? '+' : ''}${mx}，实际 ${std + mx} ${c.u}；最小的记录是 ${mn}，实际 ${std + mn} ${c.u}`, `相差：${std + mx} - ${std + mn} = ${mx - mn}（${c.u}）`, `也可以直接用记录算：${mx} 和 ${mn} 在数轴上相距 ${mx - mn}`],
          hint: '先找出最大和最小的记录',
        };
      }
      const i = r.int(0, k - 1), x = recs[i];
      return {
        q: intro + c.ask(i + 1),
        answer: [num(std + x, { unit: c.u })],
        steps: [`第 ${i + 1} 个记录是 ${x > 0 ? '+' + x : x}，表示比标准${x > 0 ? '多' : x < 0 ? '少' : '不多也不少'}${x ? ' ' + Math.abs(x) + ' ' + c.u : ''}`, `实际：${std} ${x >= 0 ? '+' : '-'} ${Math.abs(x)} = ${std + x}（${c.u}）`],
        hint: '正数表示比标准多，负数表示比标准少',
      };
    },
  },
);

// ---------------- 下册 2 百分数（二） ----------------
const GOODS = [['书包', 80, 300], ['运动鞋', 200, 800], ['台灯', 60, 300], ['自行车', 300, 1500], ['羽绒服', 400, 1600], ['电饭煲', 200, 800], ['足球', 60, 200], ['词典', 40, 120], ['电话手表', 300, 1200]];
const ZHE = [5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5];
S.push(
  {
    id: 'g6b-disc-price', grade: 6, term: 2, unit: '百分数（二）', name: '打折：求现价', process: true,
    tip: '几折就是十分之几（百分之几十）：八五折 = 85%；现价 = 原价 × 折扣', level: 1,
    gen(r) {
      const [g, lo, hi] = r.pick(GOODS), P = r.step(lo, hi, 10), z = r.pick(ZHE), X = fix((P * z) / 10), askSave = r.chance(0.35);
      const pz = fix(z * 10);
      return {
        q: `一种${g}原价 ${P} 元，现在打${zhe(z)}出售。${askSave ? '买一个比原价便宜多少元？' : '现价是多少元？'}`,
        answer: [num(askSave ? P - X : X, { unit: '元' })],
        steps: [`打${zhe(z)}，就是按原价的 ${pz}% 出售`, `现价：${P} × ${pz}% = ${fmt(X)}（元）`, ...(askSave ? [`便宜：${P} - ${fmt(X)} = ${fmt(P - X)}（元）`, `也可以：${P} × (1 - ${pz}%) = ${fmt(P - X)}（元）`] : []), `答：${askSave ? `便宜 ${fmt(P - X)} 元` : `现价是 ${fmt(X)} 元`}。`],
        hint: `${zhe(z)}是原价的百分之几？`,
      };
    },
  },
  {
    id: 'g6b-disc-orig', grade: 6, term: 2, unit: '百分数（二）', name: '打折：已知现价求原价', process: true,
    tip: '原价是单位“1”：原价 × 折扣 = 现价，所以 原价 = 现价 ÷ 折扣', level: 2,
    gen(r) {
      const [g, lo, hi] = r.pick(GOODS), P = r.step(lo, hi, 10), z = r.pick(ZHE), X = fix((P * z) / 10), pz = fix(z * 10);
      return {
        q: `一种${g}打${zhe(z)}后是 ${fmt(X)} 元。这种${g}原价是多少元？`,
        answer: [num(P, { unit: '元' })],
        steps: [`打${zhe(z)}，现价是原价的 ${pz}%`, `设原价是 x 元：x × ${pz}% = ${fmt(X)}`, `x = ${fmt(X)} ÷ ${pz}% = ${fmt(X)} ÷ ${fmt(z / 10)} = ${P}`, `答：原价是 ${P} 元。`],
        hint: '原价不知道，设它为 x',
      };
    },
  },
  {
    id: 'g6b-disc-rate', grade: 6, term: 2, unit: '百分数（二）', name: '打折：求打了几折', process: true,
    tip: '现价 ÷ 原价 = 百分之几十，就是几折', level: 2,
    gen(r) {
      const [g, lo, hi] = r.pick(GOODS), P = r.step(lo, hi, 10), z = r.pick(ZHE), X = fix((P * z) / 10), pz = fix(z * 10);
      return {
        q: `一种${g}原价 ${P} 元，现价 ${fmt(X)} 元。这种${g}打了几折？`,
        answer: [num(z, { unit: '折' })],
        steps: [`现价是原价的：${fmt(X)} ÷ ${P} = ${fmt(z / 10)} = ${pz}%`, `${pz}% 就是${zhe(z)}`, `答：打了${zhe(z)}（填 ${fmt(z)}）。`],
        hint: '现价是原价的百分之几？',
      };
    },
  },
  {
    id: 'g6b-chengshu', grade: 6, term: 2, unit: '百分数（二）', name: '成数：求现在的数量', process: true,
    tip: '几成就是十分之几（百分之几十）：二成 = 20%，一成五 = 15%', level: 1,
    gen(r) {
      const c = r.pick(CHENG_CTX), k = r.pick(c.ks), A = r.step(c.lo, c.hi, c.st), pk = fix(k * 10), B = fix((A * (100 + c.sg * pk)) / 100);
      return {
        q: c.fwd(A, cheng(k)), answer: [num(B, { unit: c.u })],
        steps: [`${cheng(k)}就是 ${pk}%，把${c.one}看作单位“1”`, `${c.two}是${c.one}的 1 ${c.sg > 0 ? '+' : '-'} ${pk}% = ${100 + c.sg * pk}%`, `${A} × ${100 + c.sg * pk}% = ${fmt(B)}（${c.u}）`, `答：${c.two}是 ${fmt(B)} ${c.u}。`],
        hint: `${cheng(k)}是百分之几？`,
      };
    },
  },
  {
    id: 'g6b-chengshu-rev', grade: 6, term: 2, unit: '百分数（二）', name: '成数：求原来的数量', process: true,
    tip: '原来的量是单位“1”且未知：原来的量 = 现在的量 ÷（1 ± 几成）', level: 2,
    gen(r) {
      const c = r.pick(CHENG_CTX), k = r.pick(c.ks), A = r.step(c.lo, c.hi, c.st), pk = fix(k * 10), B = fix((A * (100 + c.sg * pk)) / 100);
      return {
        q: c.rev(B, cheng(k)), answer: [num(A, { unit: c.u })],
        steps: [`${cheng(k)}就是 ${pk}%，${c.one}是单位“1”，不知道`, `${c.two}是${c.one}的 1 ${c.sg > 0 ? '+' : '-'} ${pk}% = ${100 + c.sg * pk}%`, `设${c.one}为 x：${100 + c.sg * pk}%x = ${fmt(B)}`, `x = ${fmt(B)} ÷ ${fmt((100 + c.sg * pk) / 100)} = ${A}`, `答：${c.one}是 ${A} ${c.u}。`],
        hint: '单位“1”是谁？知道吗？',
      };
    },
  },
);
const CHENG_CTX = [
  { one: '去年的产量', two: '今年的产量', u: '吨', sg: 1, ks: [1, 1.5, 2, 2.5, 3], lo: 100, hi: 2000, st: 20, fwd: (A, k) => `某县去年小麦产量是 ${A} 吨，今年比去年增产${k}。今年小麦产量是多少吨？`, rev: (B, k) => `某县今年小麦产量是 ${fmt(B)} 吨，比去年增产${k}。去年小麦产量是多少吨？` },
  { one: '去年的产量', two: '今年的产量', u: '吨', sg: -1, ks: [1, 1.5, 2], lo: 100, hi: 2000, st: 20, fwd: (A, k) => `由于干旱，某地今年油菜籽产量比去年减产${k}。去年产量是 ${A} 吨，今年产量是多少吨？`, rev: (B, k) => `由于干旱，某地今年油菜籽产量比去年减产${k}，今年产量是 ${fmt(B)} 吨。去年产量是多少吨？` },
  { one: '去年接待的游客', two: '今年接待的游客', u: '万人次', sg: 1, ks: [1, 2, 3, 3.5, 4], lo: 20, hi: 400, st: 10, fwd: (A, k) => `某景区去年国庆期间接待游客 ${A} 万人次，今年同期比去年增长了${k}。今年同期接待游客多少万人次？`, rev: (B, k) => `某景区今年国庆期间接待游客 ${fmt(B)} 万人次，比去年同期增长了${k}。去年同期接待游客多少万人次？` },
  { one: '去年的用电量', two: '今年的用电量', u: '度', sg: -1, ks: [1, 1.5, 2], lo: 1000, hi: 4000, st: 20, fwd: (A, k) => `小明家去年用电 ${A} 度，今年比去年节约了${k}。今年用电多少度？`, rev: (B, k) => `小明家今年用电 ${fmt(B)} 度，比去年节约了${k}。去年用电多少度？` },
  { one: '上月的销售额', two: '本月的销售额', u: '万元', sg: 1, ks: [1, 1.5, 2, 2.5, 3], lo: 20, hi: 200, st: 10, fwd: (A, k) => `某书店上月的销售额是 ${A} 万元，本月比上月增长了${k}。本月的销售额是多少万元？`, rev: (B, k) => `某书店本月的销售额是 ${fmt(B)} 万元，比上月增长了${k}。上月的销售额是多少万元？` },
];
S.push(
  {
    id: 'g6b-tax', grade: 6, term: 2, unit: '百分数（二）', name: '税率：求应纳税额', process: true,
    tip: '应纳税额 = 收入（营业额）× 税率', level: 1,
    gen(r) {
      const t = r.int(1, 4);
      if (t === 1) {
        const X = r.int(10, 200), p = r.pick([3, 5, 6]), tax = fix((X * p) / 100);
        return { q: `某饭店十月份的营业额是 ${X} 万元。如果按营业额的 ${p}% 缴纳增值税，十月份应缴纳增值税多少万元？`, answer: [num(tax, { unit: '万元' })], steps: [`应纳税额 = 营业额 × 税率`, `${X} × ${p}% = ${fmt(tax)}（万元）`, `答：应缴纳增值税 ${fmt(tax)} 万元。`], hint: '求营业额的百分之几是多少' };
      }
      if (t === 2) {
        const X = r.step(80000, 300000, 1000), tax = fix(X * 0.1);
        return { q: `王叔叔买了一辆价格是 ${X} 元的汽车（不含增值税）。按规定，买车要按车价的 10% 缴纳车辆购置税。王叔叔应缴纳车辆购置税多少元？`, answer: [num(tax, { unit: '元' })], steps: ['车辆购置税 = 车价 × 10%', `${X} × 10% = ${fmt(tax)}（元）`, `答：应缴纳 ${fmt(tax)} 元。`], hint: '求车价的 10% 是多少' };
      }
      if (t === 3) {
        const X = r.int(20, 300), p = r.pick([3, 5]), left = fix((X * (100 - p)) / 100);
        return { q: `一家公司上个月的营业额是 ${X} 万元，按营业额的 ${p}% 缴纳增值税。缴税后还剩多少万元？`, answer: [num(left, { unit: '万元' })], steps: [`缴税后剩下营业额的 1 - ${p}% = ${100 - p}%`, `${X} × ${100 - p}% = ${fmt(left)}（万元）`, `也可以先算税款 ${X} × ${p}% = ${fmt((X * p) / 100)}，再用 ${X} 去减`, `答：还剩 ${fmt(left)} 万元。`], hint: '剩下的是营业额的百分之几？' };
      }
      const X = r.step(2000, 50000, 100), p = r.pick([3, 5, 13]), tax = fix((X * p) / 100);
      return { q: `某商店销售一批商品，销售额是 ${X} 元，按销售额的 ${p}% 缴纳增值税。应缴纳增值税多少元？`, answer: [num(tax, { unit: '元' })], steps: ['应纳税额 = 销售额 × 税率', `${X} × ${p}% = ${fmt(tax)}（元）`, `答：应缴纳 ${fmt(tax)} 元。`], hint: '求一个数的百分之几是多少' };
    },
  },
  {
    id: 'g6b-tax-more', grade: 6, term: 2, unit: '百分数（二）', name: '税率：起征点和反求收入', process: true,
    tip: '有起征点时只对超过的部分纳税；已知税额求收入：税额 ÷ 税率', level: 2,
    gen(r) {
      const t = r.int(1, 3);
      if (t === 1) {
        const X = r.step(5200, 8000, 100), tax = fix((X - 5000) * 0.03);
        return { q: `按规定，个人每月工资超过 5000 元的部分，要按 3% 缴纳个人所得税。李阿姨这个月工资是 ${X} 元，她应缴纳个人所得税多少元？`, answer: [num(tax, { unit: '元' })], steps: [`只有超过 5000 元的部分要纳税：${X} - 5000 = ${X - 5000}（元）`, `${X - 5000} × 3% = ${fmt(tax)}（元）`, `答：应缴纳 ${fmt(tax)} 元。`, '易错：不能用全部工资乘 3%'], hint: '哪一部分才要纳税？' };
      }
      if (t === 2) {
        const X = r.step(1000, 5000, 100), tax = fix((X - 800) * 0.14);
        return { q: `一位作家获得稿费 ${X} 元。按规定，稿费超过 800 元的部分要按 14% 缴纳个人所得税。他应缴纳个人所得税多少元？`, answer: [num(tax, { unit: '元' })], steps: [`要纳税的部分：${X} - 800 = ${X - 800}（元）`, `${X - 800} × 14% = ${fmt(tax)}（元）`, `答：应缴纳 ${fmt(tax)} 元。`], hint: '先减去不用纳税的 800 元' };
      }
      const p = r.pick([3, 5]), X = r.step(10000, 200000, p === 3 ? 100 : 20), tax = fix((X * p) / 100);
      return { q: `某商店上个月按营业额的 ${p}% 缴纳了增值税 ${fmt(tax)} 元。这个商店上个月的营业额是多少元？`, answer: [num(X, { unit: '元' })], steps: ['营业额 × 税率 = 应纳税额，营业额是单位“1”且未知', `设营业额为 x 元：x × ${p}% = ${fmt(tax)}`, `x = ${fmt(tax)} ÷ ${p}% = ${X}`, `答：营业额是 ${X} 元。`], hint: '税额对应营业额的百分之几？' };
    },
  },
);
const RATES = { 1: 1.75, 2: 2.25, 3: 2.75, 5: 2.75 };
S.push(
  {
    id: 'g6b-interest', grade: 6, term: 2, unit: '百分数（二）', name: '利率：求利息和本息', process: true,
    tip: '利息 = 本金 × 利率 × 存期；取回的钱 = 本金 + 利息', level: 1,
    gen(r) {
      const yrs = r.pick([1, 2, 3, 5]), rate = RATES[yrs], P = r.step(1000, 50000, 1000), I = fix((P * rate * yrs) / 100), nm = r.name(), askAll = r.chance(0.45);
      return {
        q: `${nm}的妈妈把 ${P} 元存入银行，存期为 ${yrs} 年，年利率是 ${fmt(rate)}%。到期时${askAll ? '一共可以取回多少元' : '可以得到利息多少元'}？`,
        answer: [num(askAll ? P + I : I, { unit: '元' })],
        steps: ['利息 = 本金 × 利率 × 存期', `${P} × ${fmt(rate)}% × ${yrs} = ${fmt(I)}（元）`, ...(askAll ? [`取回：本金 + 利息 = ${P} + ${fmt(I)} = ${fmt(P + I)}（元）`] : []), '易错：年利率是一年的，存几年就要乘几'],
        hint: '存了几年？',
      };
    },
  },
  {
    id: 'g6b-interest-rev', grade: 6, term: 2, unit: '百分数（二）', name: '利率：反求本金或利率', process: true,
    tip: '从 利息 = 本金 × 利率 × 存期 出发，设未知数列方程', level: 2,
    gen(r) {
      const yrs = r.pick([1, 2, 3, 5]), rate = RATES[yrs], P = r.step(1000, 50000, 1000), I = fix((P * rate * yrs) / 100);
      if (r.bool()) return {
        q: `张叔叔把一笔钱存入银行，存期 ${yrs} 年，年利率 ${fmt(rate)}%，到期得到利息 ${fmt(I)} 元。张叔叔存入的本金是多少元？`,
        answer: [num(P, { unit: '元' })],
        steps: [`设本金为 x 元：x × ${fmt(rate)}% × ${yrs} = ${fmt(I)}`, `${fmt((rate * yrs) / 100)}x = ${fmt(I)}`, `x = ${fmt(I)} ÷ ${fmt((rate * yrs) / 100)} = ${P}`, `答：本金是 ${P} 元。`],
        hint: '本金不知道，设它为 x',
      };
      return {
        q: `王阿姨把 ${P} 元存入银行，存期 ${yrs} 年，到期时一共取回 ${fmt(P + I)} 元。年利率是百分之几？`,
        answer: [num(rate, { unit: '%' })],
        steps: [`利息：${fmt(P + I)} - ${P} = ${fmt(I)}（元）`, ...(yrs > 1 ? [`${yrs} 年的利息是 ${fmt(I)} 元，一年的利息：${fmt(I)} ÷ ${yrs} = ${fmt(I / yrs)}（元）`] : []), `年利率：${fmt(I / yrs)} ÷ ${P} × 100% = ${fmt(rate)}%`],
        hint: '先求利息，再求一年的利息占本金的百分之几',
      };
    },
  },
  {
    id: 'g6b-shop-compare', grade: 6, term: 2, unit: '百分数（二）', name: '选择购物方案（打折和满减）', process: true,
    tip: '分别算出每个方案实际付多少钱再比较；“每满 100 减 m”要看有几个整 100', level: 2,
    gen(r) {
      const [g, lo, hi] = r.pick(GOODS.filter((x) => x[2] >= 300)), X = r.step(Math.max(lo, 150), hi, 10), z = r.pick([7, 7.5, 8, 8.5, 9]), m = r.pick([20, 25, 30, 40, 50]);
      const A = fix((X * z) / 10), k = Math.floor(X / 100), B = X - k * m;
      const ans = A < B ? '甲商场' : A > B ? '乙商场' : '一样';
      return {
        q: `一种${g}标价 ${X} 元。甲商场打${zhe(z)}出售；乙商场“每满 100 元减 ${m} 元”。在哪个商场买更省钱？实际要付多少元？`,
        answer: [choice(['甲商场', '乙商场', '一样'], ans, { label: '商场' }), num(Math.min(A, B), { label: '付', unit: '元' })],
        steps: [`甲商场：${X} × ${fix(z * 10)}% = ${fmt(A)}（元）`, `乙商场：${X} 元里有 ${k} 个整 100 元，减 ${m} × ${k} = ${m * k}（元），付 ${X} - ${m * k} = ${B}（元）`, `比较：${fmt(A)} ${A < B ? '<' : A > B ? '>' : '='} ${B}`, ans === '一样' ? `两个商场一样，都付 ${B} 元。` : `在${ans}买更省钱，付 ${fmt(Math.min(A, B))} 元。`],
        hint: '两边各要付多少钱？',
      };
    },
  },
);

// ---------------- 下册 3 圆柱与圆锥 ----------------
const cylFig = (rl, hl, cone = false) => fig.cylinder({ rLabel: rl, hLabel: hl, cone, diameter: /^d\s*=/.test(rl || '') });
const cu = (u) => `立方${u}`;
/** 给圆柱 / 圆锥出 r 或 d 的条件 */
function rdPick(r, R, u) {
  const byD = r.bool();
  return { byD, text: byD ? `底面直径是 ${2 * R} ${u}` : `底面半径是 ${R} ${u}`, lab: byD ? `d=${2 * R}${UL[u]}` : `r=${R}${UL[u]}`, pre: byD ? [`底面半径：${2 * R} ÷ 2 = ${R}（${u}）`] : [] };
}
S.push(
  {
    id: 'g6b-cyl-side', grade: 6, term: 2, unit: '圆柱与圆锥', name: '圆柱的侧面积',
    tip: '侧面展开是长方形：长 = 底面周长，宽 = 高；侧面积 = 底面周长 × 高', level: 1,
    gen(r) {
      const R = r.int(1, 10), H = r.int(2, 20), u = r.pick(['厘米', '分米', '米']), p = rdPick(r, R, u);
      const C2 = fix(2 * PI * R), S0 = fix(C2 * H);
      return {
        q: `一个圆柱的${p.text}，高是 ${H} ${u}。它的侧面积是多少${sq(u)}？`,
        fig: cylFig(p.lab, `h=${H}${UL[u]}`),
        answer: [num(S0, { unit: sq(u) })],
        steps: [p.byD ? `底面周长：3.14 × ${2 * R} = ${fmt(C2)}（${u}）` : `底面周长：2 × 3.14 × ${R} = ${fmt(C2)}（${u}）`, `侧面积 = 底面周长 × 高 = ${fmt(C2)} × ${H} = ${fmt(S0)}（${sq(u)}）`, '把侧面沿高剪开，展开就是一个长方形'],
        hint: '侧面展开是什么形状？长和宽是多少？',
      };
    },
  },
  {
    id: 'g6b-cyl-unfold', grade: 6, term: 2, unit: '圆柱与圆锥', name: '圆柱的侧面展开图',
    tip: '展开的长方形：一条边是底面周长，另一条边是高；底面周长 ÷ 3.14 = 直径', level: 2,
    gen(r) {
      const t = r.int(1, 2), u = r.pick(['厘米', '分米']);
      if (t === 1) {
        const R = r.int(1, 10), H = r.int(3, 30), L = fix(2 * PI * R), askD = r.bool();
        return {
          q: `一个圆柱的侧面沿高展开后是一个长方形，长方形的长是 ${fmt(L)} ${u}，宽是 ${H} ${u}。这个圆柱的底面${askD ? '直径' : '半径'}是多少${u}？高是多少${u}？`,
          answer: [num(askD ? 2 * R : R, { label: askD ? '直径' : '半径', unit: u }), num(H, { label: '高', unit: u })],
          steps: [`展开后长方形的长 = 圆柱的底面周长 = ${fmt(L)} ${u}，宽 = 圆柱的高 = ${H} ${u}`, `底面直径：${fmt(L)} ÷ 3.14 = ${2 * R}（${u}）`, ...(askD ? [] : [`底面半径：${2 * R} ÷ 2 = ${R}（${u}）`])],
          hint: '展开图的长相当于圆柱的什么？',
        };
      }
      const D = r.int(2, 12), H = fix(PI * D);
      return {
        q: `一个圆柱的底面直径是 ${D} ${u}，它的侧面沿高展开后正好是一个正方形。这个圆柱的高是多少${u}？`,
        answer: [num(H, { unit: u })],
        steps: ['侧面展开是正方形，说明底面周长和高相等', `底面周长：3.14 × ${D} = ${fmt(H)}（${u}）`, `高 = 底面周长 = ${fmt(H)} ${u}`],
        hint: '正方形的四条边都相等',
      };
    },
  },
  {
    id: 'g6b-cyl-surface', grade: 6, term: 2, unit: '圆柱与圆锥', name: '圆柱的表面积',
    tip: '表面积 = 侧面积 + 2 个底面积', level: 1,
    gen(r) {
      const R = r.int(1, 10), H = r.int(2, 20), u = r.pick(['厘米', '分米', '米']), p = rdPick(r, R, u);
      const side = fix(2 * PI * R * H), base = fix(PI * R * R), tot = fix(side + 2 * base);
      return {
        q: `一个圆柱的${p.text}，高是 ${H} ${u}。它的表面积是多少${sq(u)}？`,
        fig: cylFig(p.lab, `h=${H}${UL[u]}`),
        answer: [num(tot, { unit: sq(u) })],
        steps: [...p.pre, `侧面积：2 × 3.14 × ${R} × ${H} = ${fmt(side)}（${sq(u)}）`, `一个底面积：3.14 × ${R} × ${R} = ${fmt(base)}（${sq(u)}）`, `表面积：${fmt(side)} + ${fmt(base)} × 2 = ${fmt(tot)}（${sq(u)}）`, '易错：别忘了有上下两个底面'],
        hint: '表面积由哪几部分组成？',
      };
    },
  },
  {
    id: 'g6b-cyl-surface-real', grade: 6, term: 2, unit: '圆柱与圆锥', name: '圆柱表面积的实际问题', process: true,
    tip: '先想清楚要算哪几个面：通风管、商标纸只算侧面；无盖水桶算侧面 + 1 个底', level: 2,
    gen(r) {
      const t = r.int(1, 5);
      if (t === 1 || t === 2) {
        const R = r.int(1, 5) * (t === 1 ? 1 : 1), H = r.int(3, 10), obj = t === 1 ? '无盖的圆柱形铁皮水桶' : '没有盖的圆柱形笔筒';
        const u = t === 1 ? '分米' : '厘米', Hh = t === 1 ? H : H + 5, Rr = t === 1 ? R : R + 2;
        const side = fix(2 * PI * Rr * Hh), base = fix(PI * Rr * Rr), tot = fix(side + base);
        return {
          q: `做一个${obj}，底面直径是 ${2 * Rr} ${u}，高是 ${Hh} ${u}。至少需要多少${sq(u)}的材料？`,
          fig: cylFig(`d=${2 * Rr}${UL[u]}`, `h=${Hh}${UL[u]}`),
          answer: [num(tot, { unit: sq(u) })],
          steps: ['没有盖：要算侧面和 1 个底面', `侧面：3.14 × ${2 * Rr} × ${Hh} = ${fmt(side)}（${sq(u)}）`, `底面：3.14 × ${Rr} × ${Rr} = ${fmt(base)}（${sq(u)}）`, `一共：${fmt(side)} + ${fmt(base)} = ${fmt(tot)}（${sq(u)}）`],
          hint: '没有盖，要算几个底面？',
        };
      }
      if (t === 3) {
        const D = r.pick([1, 2, 3, 4]), L = r.pick([1, 1.5, 2, 2.5, 3]), n = r.int(5, 20);
        const one = fix(PI * D * L * 10), tot = fix((one * n) / 100);
        return {
          q: `做一节底面直径是 ${D} 分米、长是 ${fmt(L)} 米的圆柱形通风管。做这样的通风管 ${n} 节，至少需要多少平方米的铁皮？`,
          answer: [num(tot, { unit: '平方米' })],
          steps: ['通风管两头是空的，只算侧面', `先统一单位：${fmt(L)} 米 = ${fmt(L * 10)} 分米`, `一节：3.14 × ${D} × ${fmt(L * 10)} = ${fmt(one)}（平方分米）`, `${n} 节：${fmt(one)} × ${n} = ${fmt(one * n)}（平方分米）= ${fmt(tot)} 平方米`],
          hint: '通风管有底面吗？注意单位',
        };
      }
      if (t === 4) {
        const D = r.int(6, 12), H = r.int(8, 15), side = fix(PI * D * H);
        return {
          q: `一个圆柱形罐头盒的底面直径是 ${D} 厘米，高是 ${H} 厘米。它的侧面贴有一圈商标纸（接头处不计），这张商标纸的面积是多少平方厘米？`,
          fig: cylFig(`d=${D}cm`, `h=${H}cm`),
          answer: [num(side, { unit: '平方厘米' })],
          steps: ['商标纸贴在侧面，求侧面积', `3.14 × ${D} × ${H} = ${fmt(side)}（平方厘米）`],
          hint: '商标纸贴在哪个面？',
        };
      }
      const D = r.pick([1, 1.2, 1.5, 2]), W = r.pick([1.5, 2, 2.5, 3]), n = r.int(10, 60), one = fix(PI * D * W), tot = fix(one * n);
      return {
        q: `一台压路机的前轮是圆柱形，轮宽 ${fmt(W)} 米，直径 ${fmt(D)} 米。前轮滚动 ${n} 周，压过的路面是多少平方米？`,
        answer: [num(tot, { unit: '平方米' })],
        steps: ['前轮滚动一周，压过的面积就是前轮的侧面积', `一周：3.14 × ${fmt(D)} × ${fmt(W)} = ${fmt(one)}（平方米）`, `${n} 周：${fmt(one)} × ${n} = ${fmt(tot)}（平方米）`],
        hint: '滚一周压过的是圆柱的哪个面？',
      };
    },
  },
  {
    id: 'g6b-cyl-volume', grade: 6, term: 2, unit: '圆柱与圆锥', name: '圆柱的体积',
    tip: 'V = 底面积 × 高 = πr²h', level: 1,
    gen(r) {
      const R = r.int(1, 10), H = r.int(2, 20), u = r.pick(['厘米', '分米', '米']), p = rdPick(r, R, u);
      const base = fix(PI * R * R), V = fix(base * H);
      return {
        q: `一个圆柱的${p.text}，高是 ${H} ${u}。它的体积是多少${cu(u)}？`,
        fig: cylFig(p.lab, `h=${H}${UL[u]}`),
        answer: [num(V, { unit: cu(u) })],
        steps: [...p.pre, `底面积：3.14 × ${R} × ${R} = ${fmt(base)}（${sq(u)}）`, `体积：${fmt(base)} × ${H} = ${fmt(V)}（${cu(u)}）`],
        hint: '先求底面积',
      };
    },
  },
  {
    id: 'g6b-cyl-volume-c', grade: 6, term: 2, unit: '圆柱与圆锥', name: '圆柱的体积（已知底面周长、容积）', process: true,
    tip: '已知底面周长先求半径；容积单位换算：1 立方分米 = 1 升，1 立方厘米 = 1 毫升', level: 2,
    gen(r) {
      if (r.bool()) {
        const R = r.int(1, 8), H = r.int(2, 15), u = r.pick(['厘米', '分米', '米']), C2 = fix(2 * PI * R), V = fix(PI * R * R * H);
        return {
          q: `一个圆柱的底面周长是 ${fmt(C2)} ${u}，高是 ${H} ${u}。它的体积是多少${cu(u)}？`,
          answer: [num(V, { unit: cu(u) })],
          steps: [`底面半径：${fmt(C2)} ÷ 3.14 ÷ 2 = ${R}（${u}）`, `底面积：3.14 × ${R} × ${R} = ${fmt(PI * R * R)}（${sq(u)}）`, `体积：${fmt(PI * R * R)} × ${H} = ${fmt(V)}（${cu(u)}）`],
          hint: '先用周长求半径',
        };
      }
      const D = r.pick([2, 4, 6, 8]), H = r.int(3, 12), R = D / 2, V = fix(PI * R * R * H);
      const obj = r.pick(['圆柱形水桶', '圆柱形油桶', '圆柱形保温桶']);
      return {
        q: `一个${obj}，从里面量底面直径是 ${D} 分米，高是 ${H} 分米。这个桶能装多少升？`,
        fig: cylFig(`d=${D}dm`, `h=${H}dm`),
        answer: [num(V, { unit: '升' })],
        steps: [`底面半径：${D} ÷ 2 = ${R}（分米）`, `容积：3.14 × ${R} × ${R} × ${H} = ${fmt(V)}（立方分米）`, `1 立方分米 = 1 升，所以能装 ${fmt(V)} 升`],
        hint: '容积用从里面量的数据算，立方分米和升是什么关系？',
      };
    },
  },
  {
    id: 'g6b-cone-volume', grade: 6, term: 2, unit: '圆柱与圆锥', name: '圆锥的体积',
    tip: 'V = ⅓ × 底面积 × 高，千万别忘了乘 ⅓', level: 1,
    gen(r) {
      const { R, H } = r.until(() => ({ R: r.int(1, 10), H: r.int(2, 24) }), ({ R, H }) => (R * R * H) % 3 === 0), u = r.pick(['厘米', '分米', '米']), p = rdPick(r, R, u);
      const base = fix(PI * R * R), V = fix((base * H) / 3);
      return {
        q: `一个圆锥的${p.text}，高是 ${H} ${u}。它的体积是多少${cu(u)}？`,
        fig: cylFig(p.lab, `h=${H}${UL[u]}`, true),
        answer: [num(V, { unit: cu(u) })],
        steps: [...p.pre, `底面积：3.14 × ${R} × ${R} = ${fmt(base)}（${sq(u)}）`, `体积：${frac(1, 3)} × ${fmt(base)} × ${H} = ${fmt(V)}（${cu(u)}）`, '圆锥的体积是和它等底等高的圆柱体积的三分之一'],
        hint: '圆锥体积公式比圆柱多了什么？',
      };
    },
  },
  {
    id: 'g6b-cone-cyl', grade: 6, term: 2, unit: '圆柱与圆锥', name: '等底等高的圆柱和圆锥',
    tip: '等底等高：圆锥体积是圆柱的 ⅓，相差的是圆柱的 ⅔；等底等体积：圆锥的高是圆柱的 3 倍', level: 2,
    gen(r) {
      const k = r.int(2, 30), u = r.pick(['立方厘米', '立方分米', '立方米']), t = r.int(1, 6);
      const Vc = 3 * k, Vz = k;
      const map = {
        1: { q: `一个圆柱的体积是 ${Vc} ${u}，与它等底等高的圆锥的体积是多少${u}？`, a: Vz, s: [`等底等高时，圆锥体积是圆柱的 ${frac(1, 3)}`, `${Vc} × ${frac(1, 3)} = ${Vz}（${u}）`] },
        2: { q: `一个圆锥的体积是 ${Vz} ${u}，与它等底等高的圆柱的体积是多少${u}？`, a: Vc, s: [`等底等高时，圆柱体积是圆锥的 3 倍`, `${Vz} × 3 = ${Vc}（${u}）`] },
        3: { q: `等底等高的圆柱和圆锥，体积相差 ${2 * k} ${u}。圆柱的体积是多少${u}？`, a: Vc, s: ['把圆锥体积看作 1 份，圆柱就是 3 份，相差 2 份', `一份：${2 * k} ÷ 2 = ${k}（${u}）`, `圆柱：${k} × 3 = ${Vc}（${u}）`] },
        4: { q: `等底等高的圆柱和圆锥，体积之和是 ${4 * k} ${u}。圆锥的体积是多少${u}？`, a: Vz, s: ['圆锥 1 份，圆柱 3 份，一共 4 份', `圆锥：${4 * k} ÷ 4 = ${k}（${u}）`] },
        5: { q: `把一个体积是 ${Vc} ${u}的圆柱削成一个最大的圆锥，要削去多少${u}？`, a: 2 * k, s: ['削成的最大圆锥和圆柱等底等高，圆锥体积是圆柱的 ' + frac(1, 3), `削去的部分是圆柱的 1 - ${frac(1, 3)} = ${frac(2, 3)}`, `${Vc} × ${frac(2, 3)} = ${2 * k}（${u}）`] },
      };
      if (t === 6) {
        const h = r.int(2, 20), sameBase = r.bool();
        return sameBase
          ? { q: `一个圆柱和一个圆锥的底面积相等，体积也相等。圆柱的高是 ${h} 厘米，圆锥的高是多少厘米？`, answer: [num(3 * h, { unit: '厘米' })], steps: ['底面积相等、体积相等时：圆柱体积 = 底面积 × 高，圆锥体积 = ⅓ × 底面积 × 高', '圆锥的高要是圆柱的 3 倍，体积才相等', `${h} × 3 = ${3 * h}（厘米）`], hint: '圆锥要“补”回那个 ⅓' }
          : { q: `一个圆柱和一个圆锥的体积相等，底面积也相等。圆锥的高是 ${3 * h} 厘米，圆柱的高是多少厘米？`, answer: [num(h, { unit: '厘米' })], steps: ['等底等体积时，圆锥的高是圆柱的 3 倍', `圆柱的高：${3 * h} ÷ 3 = ${h}（厘米）`], hint: '谁的高更高？' };
      }
      const o = map[t];
      return { q: o.q, answer: [num(o.a, { unit: u })], steps: o.s, hint: '等底等高的圆柱体积是圆锥的几倍？' };
    },
  },
  {
    id: 'g6b-cyl-melt', grade: 6, term: 2, unit: '圆柱与圆锥', name: '等体积变形（熔铸、倒水）', process: true,
    tip: '形状变了，体积不变：先算原来的体积，再用新形状的体积公式反求', level: 2,
    gen(r) {
      const t = r.int(1, 3);
      if (t === 1) {
        const { r1, h1, r2 } = r.until(() => ({ r1: r.int(2, 6), h1: r.int(2, 12), r2: r.int(2, 8) }), ({ r1, h1, r2 }) => (3 * r1 * r1 * h1) % (r2 * r2) === 0 && r1 !== r2 && (3 * r1 * r1 * h1) / (r2 * r2) <= 60);
        const h2 = (3 * r1 * r1 * h1) / (r2 * r2);
        return {
          q: `把一个底面半径 ${r1} 厘米、高 ${h1} 厘米的圆柱形钢坯，熔铸成一个底面半径 ${r2} 厘米的圆锥形零件。这个圆锥的高是多少厘米？`,
          answer: [num(h2, { unit: '厘米' })],
          steps: ['熔铸前后体积不变', `圆柱体积：3.14 × ${r1} × ${r1} × ${h1} = ${fmt(PI * r1 * r1 * h1)}（立方厘米）`, `圆锥的高 = 体积 × 3 ÷ 底面积：${fmt(PI * r1 * r1 * h1)} × 3 ÷ (3.14 × ${r2} × ${r2}) = ${h2}（厘米）`, `简便：3.14 可以约掉，${r1 * r1} × ${h1} × 3 ÷ ${r2 * r2} = ${h2}`],
          hint: '变形前后什么不变？',
        };
      }
      if (t === 2) {
        const { a, S0 } = r.until(() => ({ a: r.int(2, 12), S0: r.pick([4, 6, 8, 9, 12, 16, 18, 24, 27, 36, 48]) }), ({ a, S0 }) => (3 * a * a * a) % S0 === 0 && (3 * a * a * a) / S0 <= 80), h = (3 * a * a * a) / S0;
        return {
          q: `把一个棱长 ${a} 厘米的正方体铁块熔铸成一个底面积是 ${S0} 平方厘米的圆锥。这个圆锥的高是多少厘米？`,
          answer: [num(h, { unit: '厘米' })],
          steps: ['熔铸前后体积不变', `正方体体积：${a} × ${a} × ${a} = ${a * a * a}（立方厘米）`, `圆锥：${frac(1, 3)} × ${S0} × 高 = ${a * a * a}`, `高 = ${a * a * a} × 3 ÷ ${S0} = ${h}（厘米）`, '易错：求圆锥的高要先乘 3 再除以底面积'],
          hint: '圆锥的高 = 体积 × 3 ÷ 底面积',
        };
      }
      const { ra, ha, rb } = r.until(() => ({ ra: r.int(2, 10), ha: r.int(2, 20), rb: r.int(2, 10) }), ({ ra, ha, rb }) => ra !== rb && (ra * ra * ha) % (rb * rb) === 0 && (ra * ra * ha) / (rb * rb) <= 40);
      const hb = (ra * ra * ha) / (rb * rb);
      return {
        q: `甲圆柱形容器的底面半径是 ${ra} 厘米，里面有 ${ha} 厘米深的水。把这些水全部倒进底面半径是 ${rb} 厘米的乙圆柱形容器（水没有溢出），乙容器里的水深多少厘米？`,
        answer: [num(hb, { unit: '厘米' })],
        steps: ['水的体积不变', `水的体积：3.14 × ${ra} × ${ra} × ${ha} = ${fmt(PI * ra * ra * ha)}（立方厘米）`, `乙容器水深：${fmt(PI * ra * ra * ha)} ÷ (3.14 × ${rb} × ${rb}) = ${hb}（厘米）`, `简便：${ra * ra} × ${ha} ÷ ${rb * rb} = ${hb}`],
        hint: '倒来倒去，什么没变？',
      };
    },
  },
  {
    id: 'g6b-cyl-water', grade: 6, term: 2, unit: '圆柱与圆锥', name: '放入物体，水面上升', process: true,
    tip: '物体完全浸没时：物体体积 = 容器底面积 × 水面上升（下降）的高度', level: 2,
    gen(r) {
      const t = r.int(1, 3), R = r.int(3, 12);
      if (t === 1) {
        const h = r.pick([0.5, 1, 1.5, 2, 2.5, 3, 4, 5]), V = fix(PI * R * R * h), obj = r.pick(['一块石头', '一个铁球', '一个不规则的零件']);
        return {
          q: `一个圆柱形玻璃缸，从里面量底面半径是 ${R} 厘米。把${obj}完全浸没在水中后（水没有溢出），水面上升了 ${fmt(h)} 厘米。${obj.slice(2)}的体积是多少立方厘米？`,
          answer: [num(V, { unit: '立方厘米' })],
          steps: [`上升的那部分水，体积等于${obj.slice(2)}的体积，它是一个底面半径 ${R} 厘米、高 ${fmt(h)} 厘米的圆柱`, `3.14 × ${R} × ${R} × ${fmt(h)} = ${fmt(V)}（立方厘米）`, `答：${obj.slice(2)}的体积是 ${fmt(V)} 立方厘米。`],
          hint: '上升的水是什么形状？',
        };
      }
      if (t === 2) {
        const { R, r2, h2 } = r.until(() => { const R = r.int(3, 10); return { R, r2: r.int(2, R - 1), h2: r.int(3, 24) }; }, ({ R, r2, h2 }) => { const x = fix((r2 * r2 * h2) / (3 * R * R)); return dp(x) <= 2 && x >= 0.2; });
        const rise = fix((r2 * r2 * h2) / (3 * R * R));
        return {
          q: `一个圆柱形水桶，从里面量底面半径是 ${R} 分米。把一个底面半径 ${r2} 分米、高 ${h2} 分米的圆锥形铁块完全浸没在水中（水没有溢出），水面会上升多少分米？`,
          answer: [num(rise, { unit: '分米' })],
          steps: [`铁块体积：${frac(1, 3)} × 3.14 × ${r2} × ${r2} × ${h2} = ${fmt((PI * r2 * r2 * h2) / 3)}（立方分米）`, `水桶底面积：3.14 × ${R} × ${R} = ${fmt(PI * R * R)}（平方分米）`, `上升：${fmt((PI * r2 * r2 * h2) / 3)} ÷ ${fmt(PI * R * R)} = ${fmt(rise)}（分米）`],
          hint: '上升的水的体积 = 铁块的体积',
        };
      }
      const { R: R3, r2, h2 } = r.until(() => { const R = r.int(3, 12); return { R, r2: r.int(1, R - 1), h2: r.int(3, 20) }; }, ({ R, r2, h2 }) => [0, 1].includes(dp(fix((r2 * r2 * h2) / (R * R)))) && (r2 * r2 * h2) / (R * R) >= 0.5);
      return this.out(R3, r2, h2);
    },
    out(R, r2, h2) {
      const fall = fix((r2 * r2 * h2) / (R * R));
      return {
        q: `一个圆柱形容器，从里面量底面半径是 ${R} 厘米，里面的水中浸没着一个底面半径 ${r2} 厘米、高 ${h2} 厘米的圆柱形铁块。把铁块取出后，水面下降多少厘米？`,
        answer: [num(fall, { unit: '厘米' })],
        steps: ['取出铁块，水面下降部分的体积就是铁块的体积', `铁块体积：3.14 × ${r2} × ${r2} × ${h2} = ${fmt(PI * r2 * r2 * h2)}（立方厘米）`, `下降：${fmt(PI * r2 * r2 * h2)} ÷ (3.14 × ${R} × ${R}) = ${fmt(fall)}（厘米）`, `简便：${r2 * r2} × ${h2} ÷ ${R * R} = ${fmt(fall)}`],
        hint: '下降的那部分水的体积等于什么？',
      };
    },
  },
  {
    id: 'g6b-cone-pile', grade: 6, term: 2, unit: '圆柱与圆锥', name: '圆锥形沙堆、麦堆', process: true,
    tip: '先用圆锥体积公式求出体积，再算重量或铺路的长度', level: 2,
    gen(r) {
      const R = r.int(1, 5), H = r.pick([0.6, 0.9, 1.2, 1.5, 1.8, 2.1]), V = fix((PI * R * R * H) / 3), byC = r.bool();
      const cond = byC ? `底面周长是 ${fmt(2 * PI * R)} 米` : `底面直径是 ${2 * R} 米`;
      const pre = byC ? [`底面半径：${fmt(2 * PI * R)} ÷ 3.14 ÷ 2 = ${R}（米）`] : [`底面半径：${2 * R} ÷ 2 = ${R}（米）`];
      if (r.bool()) {
        const [obj, mat, w] = r.pick([['沙堆', '沙子', 1.5], ['沙堆', '沙子', 1.6], ['麦堆', '小麦', 0.75], ['煤堆', '煤', 1.4]]), W = fix(V * w);
        const rd = dp(W) > 1, Wr = rd ? Math.round(W * 10) / 10 : W;
        return {
          q: `一个圆锥形${obj}，${cond}，高 ${fmt(H)} 米。每立方米${mat}约重 ${fmt(w)} 吨，这堆${mat}约重多少吨？${rd ? '（得数保留一位小数）' : ''}`,
          answer: [num(Wr, { unit: '吨' })],
          steps: [...pre, `体积：${frac(1, 3)} × 3.14 × ${R} × ${R} × ${fmt(H)} = ${fmt(V)}（立方米）`, `重量：${fmt(V)} × ${fmt(w)} = ${fmt(W)}${rd ? ` ≈ ${fmt(Wr)}` : ''}（吨）`],
          hint: '先求体积，再求重量',
        };
      }
      const o = r.until(() => {
        const R2 = r.int(2, 5), H2 = r.pick([0.6, 0.9, 1.2, 1.5, 1.8]), Wd = r.pick([2, 3, 4, 5, 6, 8, 10]), th = r.pick([2, 3, 4, 5]);
        const V2 = fix((PI * R2 * R2 * H2) / 3);
        return { R2, H2, Wd, th, V2, L: fix(V2 / ((Wd * th) / 100)) };
      }, (o) => dp(o.L) <= 1 && o.L <= 600);
      const { Wd, th, L } = o;
      return this.road(o, byC, L, Wd, th);
    },
    road({ R2: R, H2: H, V2: V }, byC, L, Wd, th) {
      const cond = byC ? `底面周长是 ${fmt(2 * PI * R)} 米` : `底面直径是 ${2 * R} 米`;
      const pre = byC ? [`底面半径：${fmt(2 * PI * R)} ÷ 3.14 ÷ 2 = ${R}（米）`] : [`底面半径：${2 * R} ÷ 2 = ${R}（米）`];
      return {
        q: `一个圆锥形沙堆，${cond}，高 ${fmt(H)} 米。用这堆沙在 ${Wd} 米宽的公路上铺 ${th} 厘米厚的路面，能铺多少米长？`,
        answer: [num(L, { unit: '米' })],
        steps: [...pre, `沙的体积：${frac(1, 3)} × 3.14 × ${R} × ${R} × ${fmt(H)} = ${fmt(V)}（立方米）`, `铺成的路面是长方体：${th} 厘米 = ${fmt(th / 100)} 米`, `长 = 体积 ÷ (宽 × 厚)：${fmt(V)} ÷ (${Wd} × ${fmt(th / 100)}) = ${fmt(L)}（米）`],
        hint: '沙堆变成路面，体积变了吗？注意厘米和米',
      };
    },
  },
  {
    id: 'g6b-cyl-cut', grade: 6, term: 2, unit: '圆柱与圆锥', name: '圆柱的切拼与表面积变化', level: 2,
    tip: '横着切一刀多 2 个底面；沿直径竖切多 2 个“直径 × 高”的长方形；切拼成长方体多 2 个“半径 × 高”的长方形', process: true,
    gen(r) {
      const t = r.int(1, 4), R = r.int(1, 10), H = r.int(3, 20), u = r.pick(['厘米', '分米']);
      if (t === 1) {
        const n = r.int(2, 5), add = fix(2 * (n - 1) * PI * R * R);
        return {
          q: `把一根底面半径 ${R} ${u}、长 ${H} ${u}的圆柱形木料，横着截成 ${n} 段（截面和底面平行）。表面积一共增加了多少${sq(u)}？`,
          answer: [num(add, { unit: sq(u) })],
          steps: [`截成 ${n} 段要截 ${n - 1} 次，每截一次多出 2 个底面`, `一共多出 ${2 * (n - 1)} 个底面`, `3.14 × ${R} × ${R} × ${2 * (n - 1)} = ${fmt(add)}（${sq(u)}）`],
          hint: '截一次多出几个面？',
        };
      }
      if (t === 2) {
        const add = 2 * 2 * R * H;
        return {
          q: `把一个底面半径 ${R} ${u}、高 ${H} ${u}的圆柱，沿底面直径竖着切成两个半圆柱。表面积增加了多少${sq(u)}？`,
          answer: [num(add, { unit: sq(u) })],
          steps: ['沿直径竖切，多出 2 个长方形切面', `每个长方形：长是直径 ${2 * R} ${u}，宽是高 ${H} ${u}，面积 ${2 * R * H} ${sq(u)}`, `增加：${2 * R * H} × 2 = ${add}（${sq(u)}）`],
          hint: '切面是什么形状？长和宽各是多少？',
        };
      }
      if (t === 3) {
        const add = 2 * R * H;
        return {
          q: `把一个底面半径 ${R} ${u}、高 ${H} ${u}的圆柱切开，拼成一个近似的长方体（体积不变）。长方体的表面积比圆柱增加了多少${sq(u)}？`,
          answer: [num(add, { unit: sq(u) })],
          steps: ['拼成长方体后，上下底和曲面变成了长方体的面，多出了左右 2 个长方形面', `每个长方形：长是半径 ${R} ${u}，宽是高 ${H} ${u}`, `增加：${R} × ${H} × 2 = ${add}（${sq(u)}）`],
          hint: '多出来的两个面在哪里？',
        };
      }
      const n = r.int(2, 4), base = fix(PI * R * R), add = fix(2 * (n - 1) * base), Lm = r.pick([1, 1.5, 2, 3]), V = fix((base * Lm * 100) / 1000);
      return {
        q: `一根长 ${fmt(Lm)} 米的圆柱形木料，截成 ${n} 段后，表面积增加了 ${fmt(add)} 平方分米。这根木料原来的体积是多少立方分米？`,
        answer: [num(fix(base * Lm * 10), { unit: '立方分米' })],
        steps: [`截成 ${n} 段增加 ${2 * (n - 1)} 个底面`, `一个底面积：${fmt(add)} ÷ ${2 * (n - 1)} = ${fmt(base)}（平方分米）`, `${fmt(Lm)} 米 = ${fmt(Lm * 10)} 分米，体积：${fmt(base)} × ${fmt(Lm * 10)} = ${fmt(base * Lm * 10)}（立方分米）`],
        hint: '增加的表面积是几个底面？',
      };
    },
  },
);

// ---------------- 下册 4 比例 ----------------
S.push(
  {
    id: 'g6b-prop-meaning', grade: 6, term: 2, unit: '比例', name: '判断两个比能否组成比例',
    tip: '两个比的比值相等，就能组成比例（也可以看两外项之积是否等于两内项之积）', level: 1,
    gen(r) {
      const mk = () => {
        const [a, b] = r.until(() => [r.int(1, 9), r.int(1, 9)], ([a, b]) => a !== b && gcd(a, b) === 1);
        const k1 = r.int(1, 6), k2 = r.until(() => r.int(1, 8), (k) => k !== k1);
        const ok = r.bool();
        let c = a * k2, d = b * k2;
        if (!ok) { if (r.bool()) [c, d] = [d, c]; else d += r.pick([1, -1]) * (d > 1 ? 1 : -1); }
        const dec = r.chance(0.25);
        const sh = (x) => (dec ? fmt(x / 10) : String(x));
        return { s1: `${sh(a * k1)} : ${sh(b * k1)}`, s2: `${sh(c)} : ${sh(d)}`, v1: [a * k1, b * k1], v2: [c, d], ok: (a * k1) * d === (b * k1) * c };
      };
      if (r.chance(0.6)) {
        const o = mk();
        return {
          q: `${o.s1} 和 ${o.s2} 能组成比例吗？`,
          answer: [choice(['能', '不能'], o.ok ? '能' : '不能')],
          steps: [`${o.s1} 的比值是 ${fs(o.v1[0], o.v1[1])}，${o.s2} 的比值是 ${fs(o.v2[0], o.v2[1])}`, o.ok ? `比值相等，能组成比例：${o.s1} = ${o.s2}` : '比值不相等，不能组成比例', `也可以检验：外项之积 ${o.v1[0]} × ${o.v2[1]} = ${o.v1[0] * o.v2[1]}，内项之积 ${o.v1[1]} × ${o.v2[0]} = ${o.v1[1] * o.v2[0]}${o.v1[0] * o.v2[1] === o.v1[1] * o.v2[0] ? '，相等' : '，不相等'}`],
          hint: '分别求出两个比的比值',
        };
      }
      const good = r.until(mk, (o) => o.ok), bads = [];
      while (bads.length < 3) { const o = mk(); if (!o.ok && !bads.some((b) => b.s2 === o.s2)) bads.push(o); }
      const opts = r.shuffle([good, ...bads]).map((o) => `${o.s1} 和 ${o.s2}`);
      return {
        q: '下面哪一组中的两个比可以组成比例？',
        answer: [choice(opts, `${good.s1} 和 ${good.s2}`)],
        steps: ['分别求出每组两个比的比值，比值相等的才能组成比例', `${good.s1} 和 ${good.s2} 的比值都是 ${fs(good.v1[0], good.v1[1])}`, `所以 ${good.s1} = ${good.s2}`],
        hint: '求比值，或者算外项积和内项积',
      };
    },
  },
  {
    id: 'g6b-prop-property', grade: 6, term: 2, unit: '比例', name: '比例的基本性质',
    tip: '在比例里，两个外项的积等于两个内项的积', level: 1,
    gen(r) {
      const t = r.int(1, 3);
      if (t === 1) {
        const [a, b] = r.until(() => [r.int(2, 15), r.int(2, 15)], ([a, b]) => a !== b);
        const P = a * b, outer = r.bool();
        return {
          q: `在一个比例中，两个${outer ? '外' : '内'}项的积是 ${P}，其中一个内项是 ${a}，另一个内项是 {0}。`,
          answer: [num(b)],
          steps: ['比例的基本性质：两个外项的积 = 两个内项的积', `所以两个内项的积也是 ${P}`, `另一个内项：${P} ÷ ${a} = ${b}`],
          hint: '外项积和内项积有什么关系？',
        };
      }
      if (t === 2) {
        const [m, n] = r.until(() => [r.int(2, 12), r.int(2, 12)], ([m, n]) => m !== n && gcd(m, n) === 1);
        const L = r.pick(['x', 'a']), R2 = L === 'x' ? 'y' : 'b';
        return {
          q: `如果 ${m}${L} = ${n}${R2}（${L}、${R2} 都不为 0），那么 ${L} : ${R2} = {0}。`,
          answer: [ratioAns(n, m)],
          steps: [`把 ${m}${L} = ${n}${R2} 看成“两外项之积 = 两内项之积”`, `${L} 和 ${m} 在一起相乘，它们要么都是外项、要么都是内项`, `所以 ${L} : ${R2} = ${n} : ${m}`, `检验：${L} × ${m} = ${R2} × ${n} ✓`],
          hint: `${L} 要和 ${m} 一个当外项一个当内项吗？想想交叉相乘`,
        };
      }
      const [a, b, c, d] = r.until(() => { const a = r.int(2, 9), d = r.until(() => r.int(2, 12), (d) => d !== a), P = a * d; const fs2 = []; for (let x = 2; x < P; x++) if (P % x === 0 && x !== a && x !== d && P / x !== a && P / x !== d && P / x !== x) fs2.push(x); if (!fs2.length) return [0]; const b = r.pick(fs2); return [a, b, P / b, d]; }, (x) => x[0] > 0);
      const valid = (x, y, z, w) => x * w === y * z;
      const all = [];
      const nums = [a, b, c, d];
      for (const p of [[0, 1, 2, 3], [0, 2, 1, 3], [1, 0, 3, 2], [0, 1, 3, 2], [0, 3, 1, 2], [1, 3, 0, 2], [2, 0, 3, 1], [0, 2, 3, 1]]) {
        const [x, y, z, w] = p.map((i) => nums[i]);
        all.push({ s: `${x} : ${y} = ${z} : ${w}`, ok: valid(x, y, z, w) });
      }
      const good = r.pick(all.filter((o) => o.ok)), bad = r.sample(all.filter((o) => !o.ok), 3);
      if (bad.length < 3) return this.gen(r);
      return {
        q: `根据 ${a} × ${d} = ${b} × ${c}，下面写出的比例中正确的是：`,
        answer: [choice(r.shuffle([good.s, ...bad.map((o) => o.s)]), good.s)],
        steps: [`${a} × ${d} 的两个数要同时做外项（或同时做内项），${b} × ${c} 的两个数做另一组`, `${good.s}：外项 ${good.s.split(' ')[0]} 和 ${good.s.split(' ')[6]}，内项 ${good.s.split(' ')[2]} 和 ${good.s.split(' ')[4]}`, '再用“外项之积 = 内项之积”检验一下'],
        hint: '同一个乘法里的两个数，要么都当外项，要么都当内项',
      };
    },
  },
  {
    id: 'g6b-prop-solve', grade: 6, term: 2, unit: '比例', name: '解比例（整数）',
    tip: '根据比例的基本性质把比例写成方程：外项之积 = 内项之积，再解方程', level: 1,
    gen(r) {
      const [p, q] = r.until(() => [r.int(1, 9), r.int(1, 9)], ([p, q]) => p !== q && gcd(p, q) === 1);
      const [k1, k2] = r.sample([2, 3, 4, 5, 6, 7, 8, 9, 10, 12], 2);
      const v = [p * k1, q * k1, p * k2, q * k2], pos = r.int(0, 3), x = v[pos];
      const sh = v.map((n, i) => (i === pos ? 'x' : String(n)));
      const outer = pos === 0 || pos === 3, other = outer ? (pos === 0 ? v[3] : v[0]) : pos === 1 ? v[2] : v[1];
      const prod = outer ? v[1] * v[2] : v[0] * v[3];
      return {
        q: `解比例：${sh[0]} : ${sh[1]} = ${sh[2]} : ${sh[3]}，x = {0}`,
        answer: [num(x)],
        steps: [`x 是${outer ? '外' : '内'}项，根据比例的基本性质：${other}x = ${outer ? `${v[1]} × ${v[2]}` : `${v[0]} × ${v[3]}`}`, `${other}x = ${prod}`, `x = ${prod} ÷ ${other} = ${x}`, `检验：${v[0]} : ${v[1]} 和 ${v[2]} : ${v[3]} 的比值都是 ${fs(p, q)} ✓`],
        hint: '外项积 = 内项积',
      };
    },
  },
  {
    id: 'g6b-prop-solve-dec', grade: 6, term: 2, unit: '比例', name: '解比例（小数、分数）',
    tip: '同样用 外项之积 = 内项之积；分数比例也可以先化简比再解', level: 2,
    gen(r) {
      if (r.bool()) {
        const [p, q] = r.until(() => [r.int(1, 9), r.int(1, 9)], ([p, q]) => p !== q && gcd(p, q) === 1);
        const [k1, k2] = r.sample([1, 2, 3, 4, 5, 6, 8], 2), dv = r.pick([10, 10, 100]);
        const v = [p * k1, q * k1, p * k2, q * k2].map((n, i) => (i < 2 ? n / dv : n)), pos = r.int(0, 3), x = fix(v[pos]);
        const sh = v.map((n, i) => (i === pos ? 'x' : fmt(n)));
        const outer = pos === 0 || pos === 3, other = outer ? (pos === 0 ? v[3] : v[0]) : pos === 1 ? v[2] : v[1];
        const prod = fix(outer ? v[1] * v[2] : v[0] * v[3]);
        return {
          q: `解比例：${sh[0]} : ${sh[1]} = ${sh[2]} : ${sh[3]}，x = {0}`,
          answer: [num(x)],
          steps: [`根据比例的基本性质：${fmt(other)}x = ${outer ? `${fmt(v[1])} × ${fmt(v[2])}` : `${fmt(v[0])} × ${fmt(v[3])}`}`, `${fmt(other)}x = ${fmt(prod)}`, `x = ${fmt(prod)} ÷ ${fmt(other)} = ${fmt(x)}`],
          hint: '外项积 = 内项积，小数乘法小心小数点',
        };
      }
      const v = r.until(() => { const a = rfrac(r, 2, 9), b = rfrac(r, 2, 9), c = r.chance(0.5) ? [r.int(2, 12), 1] : rfrac(r, 2, 9); return [a, b, c, Fr.div(Fr.mul(b, c), a)]; }, (v) => v[3][1] <= 12 && v[3][0] <= 40 && v[0][1] !== v[1][1]);
      const pos = r.int(0, 3), x = v[pos];
      const sh = v.map((f, i) => (i === pos ? 'x' : F(f)));
      const outer = pos === 0 || pos === 3, other = outer ? (pos === 0 ? v[3] : v[0]) : pos === 1 ? v[2] : v[1];
      const prod = outer ? Fr.mul(v[1], v[2]) : Fr.mul(v[0], v[3]);
      return {
        q: `解比例：${sh[0]} : ${sh[1]} = ${sh[2]} : ${sh[3]}，x = {0}`,
        answer: [faX(x)],
        steps: [`根据比例的基本性质：${F(other)}x = ${outer ? `${F(v[1])} × ${F(v[2])}` : `${F(v[0])} × ${F(v[3])}`} = ${F(prod)}`, `x = ${divLine(prod, other)}`],
        hint: '外项积 = 内项积',
      };
    },
  },
);
const PROP_STMTS = [
  ['速度一定，路程和时间', '正'], ['路程一定，速度和时间', '反'], ['单价一定，总价和数量', '正'], ['总价一定，单价和数量', '反'],
  ['长方形的面积一定，它的长和宽', '反'], ['长方形的宽一定，它的面积和长', '正'], ['长方形的周长一定，它的长和宽', '不'],
  ['正方形的边长和周长', '正'], ['正方形的边长和面积', '不'], ['圆的半径和周长', '正'], ['圆的半径和面积', '不'], ['圆的直径和周长', '正'],
  ['人的年龄和身高', '不'], ['圆柱的体积一定，它的底面积和高', '反'], ['圆柱的底面积一定，它的体积和高', '正'],
  ['工作效率一定，工作总量和工作时间', '正'], ['工作总量一定，工作效率和工作时间', '反'], ['被减数一定，减数和差', '不'], ['两个数的和一定，这两个数', '不'],
  ['购买同一种练习本，买的本数和总价', '正'], ['每行人数一定，行数和总人数', '正'], ['总人数一定，每行人数和行数', '反'],
  ['一本书的总页数一定，已经读的页数和没有读的页数', '不'], ['一本书的总页数一定，每天读的页数和读完需要的天数', '反'],
  ['三角形的面积一定，它的底和高', '反'], ['平行四边形的底一定，它的面积和高', '正'], ['车轮的直径一定，车轮转动的周数和行驶的路程', '正'],
  ['生产零件的总数一定，每小时生产的个数和需要的时间', '反'], ['小明的身高和体重', '不'], ['订阅同一种杂志，订阅的份数和钱数', '正'],
  ['图上距离一定，实际距离和比例尺', '反'], ['比例尺一定，图上距离和实际距离', '正'], ['一个人的体重和他的年龄', '不'],
  ['用同样的砖铺地，铺地的面积和用砖的块数', '正'], ['铺地面积一定，每块砖的面积和用砖的块数', '反'],
];
const PJ = { 正: '成正比例', 反: '成反比例', 不: '不成比例' };
S.push(
  {
    id: 'g6b-prop-judge', grade: 6, term: 2, unit: '比例', name: '判断正比例、反比例',
    tip: '比值（商）一定成正比例，乘积一定成反比例，和、差一定或没有固定关系都不成比例', level: 2,
    gen(r) {
      const opts = ['成正比例', '成反比例', '不成比例'];
      if (r.chance(0.6)) {
        const [s0, k] = r.pick(PROP_STMTS);
        const why = { 正: '这两个量的比值（商）一定', 反: '这两个量的乘积一定', 不: '这两个量的比值和乘积都不一定' }[k];
        return {
          q: `判断：${s0} {0}`,
          answer: [choice(opts, PJ[k])],
          steps: [`看两个量之间的关系式：${why}`, `所以${s0}${PJ[k]}`],
          hint: '写出它们的关系式：是商一定、积一定，还是都不一定？',
        };
      }
      const k = r.pick(['正', '反', '不']), c = r.int(2, 9);
      const base = c * 12, xs = r.sample([1, 2, 3, 4, 5, 6, 8, 10, 12].filter((x) => k !== '反' || base % x === 0), 4).sort((a, b) => a - b);
      const ys = xs.map((x) => (k === '正' ? c * x : k === '反' ? base / x : x + c));
      const [X, Y] = r.pick({ 正: [['x', 'y'], ['时间（时）', '路程（千米）'], ['数量（个）', '总价（元）']], 反: [['x', 'y'], ['速度（千米/时）', '时间（时）'], ['每天做的个数', '天数']], 不: [['x', 'y'], ['x', 'y']] }[k]);
      const rel = k === '正' ? `${ys[0]} ÷ ${xs[0]} = ${ys[1]} ÷ ${xs[1]} = … = ${c}，比值一定` : k === '反' ? `${xs[0]} × ${ys[0]} = ${xs[1]} × ${ys[1]} = … = ${base}，乘积一定` : `比值 ${fs(ys[0], xs[0])}、${fs(ys[1], xs[1])} 不相等，乘积 ${xs[0] * ys[0]}、${xs[1] * ys[1]} 也不相等`;
      return {
        q: `下表中的两种量 {0}\n${X}：${xs.join('，')}\n${Y}：${ys.map(fmt).join('，')}`,
        answer: [choice(opts, PJ[k])],
        steps: ['分别算一算对应两个数的比值和乘积', rel, `所以${PJ[k]}`],
        hint: '对应的两个数，是商不变还是积不变？',
      };
    },
  },
  {
    id: 'g6b-scale-map', grade: 6, term: 2, unit: '比例', name: '比例尺：求图上距离',
    tip: '图上距离 = 实际距离 × 比例尺；先把实际距离化成厘米', level: 1,
    gen(r) {
      if (r.chance(0.65)) {
        const N = r.pick([100000, 200000, 500000, 1000000, 2000000, 4000000, 5000000, 6000000, 8000000]), m = r.pick([1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10, 12, 15]);
        const D = fix((m * N) / 100000);
        const pl = r.pick(['甲、乙两地', '两座城市之间', '学校到海边度假村', '两个火车站之间']);
        return {
          q: `在比例尺是 1 : ${N} 的地图上，${pl}的实际距离是 ${fmt(D)} 千米，图上距离是多少厘米？`,
          answer: [num(m, { unit: '厘米' })],
          steps: [`先统一单位：${fmt(D)} 千米 = ${fmt(D * 100000)} 厘米（1 千米 = 100000 厘米）`, `图上距离 = 实际距离 × 比例尺：${fmt(D * 100000)} × ${frac(1, N)} = ${fmt(m)}（厘米）`, '也可以用比例解：设图上距离为 x 厘米，x : ' + fmt(D * 100000) + ' = 1 : ' + N],
          hint: '先把千米化成厘米',
        };
      }
      const N = r.pick([100, 200, 500, 1000, 2000]), m = r.pick([2, 2.5, 3, 4, 5, 6, 7.5, 8, 10, 12]), D = fix((m * N) / 100);
      return {
        q: `学校要画一幅比例尺是 1 : ${N} 的平面图。操场的长是 ${fmt(D)} 米，在平面图上应画多少厘米？`,
        answer: [num(m, { unit: '厘米' })],
        steps: [`${fmt(D)} 米 = ${fmt(D * 100)} 厘米`, `${fmt(D * 100)} × ${frac(1, N)} = ${fmt(m)}（厘米）`],
        hint: '先把米化成厘米',
      };
    },
  },
  {
    id: 'g6b-scale-real', grade: 6, term: 2, unit: '比例', name: '比例尺：求实际距离',
    tip: '实际距离 = 图上距离 ÷ 比例尺（图上距离 × 比例尺的后项），再换算单位', level: 1,
    gen(r) {
      const big = r.chance(0.7);
      const N = big ? r.pick([100000, 200000, 500000, 1000000, 2000000, 3000000, 4000000, 5000000, 6000000, 8000000]) : r.pick([100, 200, 500, 1000, 2000]);
      const m = r.pick([1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10, 12]);
      const cm = fix(m * N), real = big ? fix(cm / 100000) : fix(cm / 100), u = big ? '千米' : '米';
      return {
        q: big ? `在一幅比例尺是 1 : ${N} 的地图上，量得甲、乙两地的距离是 ${fmt(m)} 厘米。甲、乙两地的实际距离是多少千米？` : `在比例尺是 1 : ${N} 的学校平面图上，量得教学楼的长是 ${fmt(m)} 厘米。教学楼的实际长度是多少米？`,
        answer: [num(real, { unit: u })],
        steps: [`实际距离 = 图上距离 ÷ 比例尺：${fmt(m)} ÷ ${frac(1, N)} = ${fmt(m)} × ${N} = ${fmt(cm)}（厘米）`, `换算单位：${fmt(cm)} 厘米 = ${fmt(real)} ${u}`, big ? '1 千米 = 100000 厘米，去掉 5 个 0' : '1 米 = 100 厘米'],
        hint: '图上 1 厘米表示实际多少？',
      };
    },
  },
  {
    id: 'g6b-scale-find', grade: 6, term: 2, unit: '比例', name: '比例尺：求比例尺',
    tip: '比例尺 = 图上距离 : 实际距离，先统一单位再化简成 1 : n（放大的写成 n : 1）', level: 2,
    gen(r) {
      if (r.chance(0.7)) {
        const N = r.pick([200000, 500000, 1000000, 2000000, 3000000, 4000000, 5000000, 6000000]), m = r.pick([2, 3, 4, 5, 6, 8, 10, 12, 15]), D = fix((m * N) / 100000);
        return {
          q: `甲、乙两地的实际距离是 ${fmt(D)} 千米，在一幅地图上量得两地的距离是 ${m} 厘米。这幅地图的比例尺是多少？`,
          answer: [ratioAns(1, N)],
          steps: [`统一单位：${fmt(D)} 千米 = ${fmt(D * 100000)} 厘米`, `比例尺 = 图上距离 : 实际距离 = ${m} : ${fmt(D * 100000)}`, `前项、后项同时除以 ${m}：= 1 : ${N}`],
          hint: '先把千米化成厘米',
        };
      }
      const k = r.pick([2, 4, 5, 10, 20, 50]), real = r.pick([1, 2, 3, 4, 5, 6, 8]), map = real * k;
      const [ru, mu, cf] = k >= 10 ? ['毫米', '厘米', 10] : ['毫米', '毫米', 1];
      const mapShow = fix(map / cf);
      return {
        q: `一个精密零件长 ${real} 毫米，在图纸上画了 ${fmt(mapShow)} ${mu}。这幅图纸的比例尺是多少？`,
        answer: [ratioAns(k, 1)],
        steps: [`统一单位：图上 ${fmt(mapShow)} ${mu} = ${map} ${ru}`, real === 1 ? `比例尺 = ${map} : 1` : `比例尺 = ${map} : ${real} = ${k} : 1`, '图上距离比实际距离大，这是放大比例尺'],
        hint: '图上距离 : 实际距离',
      };
    },
  },
  {
    id: 'g6b-scale-line', grade: 6, term: 2, unit: '比例', name: '线段比例尺和数值比例尺互化',
    tip: '“图上 1 厘米表示实际 k 千米”就是 1 : (k × 100000)；先把实际距离化成厘米', level: 2,
    gen(r) {
      const km = r.chance(0.65), c = r.pick([1, 1, 1, 2, 4, 5]);
      const k = km ? r.pick([5, 10, 20, 30, 40, 50, 60, 80, 100, 200, 300]) : r.pick([5, 10, 20, 30, 40, 50, 100, 200, 500]);
      const u = km ? '千米' : '米', cf = km ? 100000 : 100, N = k * cf, Dk = c * k;
      const zero = km ? '1 千米 = 100000 厘米' : '1 米 = 100 厘米';
      if (r.bool()) return {
        q: `一幅图的线段比例尺表示“图上 ${c} 厘米表示实际距离 ${Dk} ${u}”。把它改写成数值比例尺是多少？`,
        answer: [ratioAns(1, N)],
        steps: [`${Dk} ${u} = ${fmt(Dk * cf)} 厘米（${zero}）`, `比例尺 = ${c} 厘米 : ${fmt(Dk * cf)} 厘米${c > 1 ? ` = 1 : ${N}（前后项同时除以 ${c}）` : ` = 1 : ${N}`}`],
        hint: `${u}化成厘米要添几个 0？`,
      };
      return {
        q: `比例尺 1 : ${N} 表示图上 ${c} 厘米代表实际距离 {0} ${u}。`,
        answer: [num(Dk)],
        steps: [`图上 1 厘米表示实际 ${N} 厘米 = ${k} ${u}（${zero}）`, ...(c > 1 ? [`图上 ${c} 厘米表示：${k} × ${c} = ${Dk}（${u}）`] : [])],
        hint: km ? '去掉 5 个 0 就是千米' : '去掉 2 个 0 就是米',
      };
    },
  },
  {
    id: 'g6b-scale-area', grade: 6, term: 2, unit: '比例', name: '比例尺：求实际面积', process: true,
    tip: '先用比例尺求出实际的长和宽，再算面积；不能直接用图上面积乘比例尺的后项', level: 2,
    gen(r) {
      const N = r.pick([500, 1000, 2000, 5000]), a = r.int(2, 8), b = r.until(() => r.int(2, 6), (b) => b !== a);
      const A = fix((a * N) / 100), B = fix((b * N) / 100), S0 = fix(A * B), ha = r.chance(0.35) && S0 >= 10000;
      return {
        q: `在比例尺是 1 : ${N} 的平面图上，一块长方形菜地长 ${a} 厘米、宽 ${b} 厘米。这块菜地的实际面积是多少${ha ? '公顷' : '平方米'}？`,
        answer: [num(ha ? S0 / 10000 : S0, { unit: ha ? '公顷' : '平方米' })],
        steps: [`实际长：${a} × ${N} = ${a * N}（厘米）= ${fmt(A)} 米`, `实际宽：${b} × ${N} = ${b * N}（厘米）= ${fmt(B)} 米`, `实际面积：${fmt(A)} × ${fmt(B)} = ${fmt(S0)}（平方米）`, ...(ha ? [`${fmt(S0)} 平方米 = ${fmt(S0 / 10000)} 公顷`] : []), '易错：面积不能直接用图上面积 × ' + N],
        hint: '先求实际的长和宽',
      };
    },
  },
  {
    id: 'g6b-prop-app-direct', grade: 6, term: 2, unit: '比例', name: '用正比例解决问题', process: true,
    tip: '找出一定的量（商一定），设未知数，列比例：两次的比值相等', level: 2,
    gen(r) {
      const nm = r.name();
      const c = r.pick([
        () => { const v = r.int(40, 90), t1 = r.int(2, 5), t2 = r.until(() => r.int(3, 9), (x) => x !== t1); return { q: `一辆汽车 ${t1} 小时行驶 ${v * t1} 千米。照这样的速度，${t2} 小时行驶多少千米？`, k: '速度', a: '路程', b: '时间', A1: v * t1, B1: t1, B2: t2, ans: v * t2, u: '千米' }; },
        () => { const p = r.pick([1.5, 2, 2.5, 3, 3.5, 4, 5]), n1 = r.int(3, 8), n2 = r.until(() => r.int(5, 20), (x) => x !== n1); return { q: `${nm}买 ${n1} 本练习本用了 ${fmt(p * n1)} 元。照这样计算，买 ${n2} 本同样的练习本要用多少元？`, k: '单价', a: '总价', b: '数量', A1: fix(p * n1), B1: n1, B2: n2, ans: fix(p * n2), u: '元' }; },
        () => { const v = r.pick([40, 50, 60, 80, 90]), t1 = r.int(3, 8), w2 = v * r.int(9, 30); return { q: `${nm}打字，${t1} 分钟打了 ${v * t1} 个字。照这样的速度，打 ${w2} 个字需要多少分钟？`, k: '打字速度', a: '字数', b: '时间', A1: v * t1, B1: t1, A2: w2, ans: w2 / v, u: '分钟', inv: true }; },
        () => { const d = r.pick([0.5, 0.6, 0.8, 1.2, 1.5]), t1 = r.int(2, 6), t2 = r.pick([10, 15, 20, 30]); return { q: `${nm}家 ${t1} 天用水 ${fmt(d * t1)} 吨。照这样计算，${t2} 天用水多少吨？`, k: '每天用水量', a: '用水量', b: '天数', A1: fix(d * t1), B1: t1, B2: t2, ans: fix(d * t2), u: '吨' }; },
        () => { const pole = r.pick([1, 1.2, 1.5, 2]), k = r.pick([0.8, 1.2, 1.5, 2]), tree = r.int(3, 12); return { q: `同一时间、同一地点，一根长 ${fmt(pole)} 米的竹竿直立时影长 ${fmt(pole * k)} 米。这时测得一棵树的影长是 ${fmt(fix(tree * k))} 米，这棵树高多少米？`, k: '影长和物高的比', a: '影长', b: '物高', A1: fix(pole * k), B1: pole, A2: fix(tree * k), ans: tree, u: '米', inv: true }; },
        () => { const v = r.pick([60, 80, 120, 150, 200]), t1 = r.int(2, 5), L2 = v * r.int(6, 20); return { q: `修一条路，${t1} 天修了 ${v * t1} 米。照这样计算，修 ${L2} 米需要多少天？`, k: '每天修的长度', a: '修的长度', b: '天数', A1: v * t1, B1: t1, A2: L2, ans: L2 / v, u: '天', inv: true }; },
      ])();
      const eq = c.inv ? `${fmt(c.A1)} : ${fmt(c.B1)} = ${fmt(c.A2)} : x` : `${fmt(c.A1)} : ${fmt(c.B1)} = x : ${fmt(c.B2)}`;
      const solve = c.inv ? `${fmt(c.A1)}x = ${fmt(c.B1)} × ${fmt(c.A2)}，x = ${fmt(c.B1 * c.A2)} ÷ ${fmt(c.A1)} = ${fmt(c.ans)}` : `${fmt(c.B1)}x = ${fmt(c.A1)} × ${fmt(c.B2)}，x = ${fmt(c.A1 * c.B2)} ÷ ${fmt(c.B1)} = ${fmt(c.ans)}`;
      return {
        q: c.q, answer: [num(c.ans, { unit: c.u })],
        steps: [`${c.k}一定，${c.a}和${c.b}的比值一定，${c.a}和${c.b}成正比例`, `设所求为 x ${c.u}，列比例：${eq}`, solve, `答：是 ${fmt(c.ans)} ${c.u}。`],
        hint: '什么是一定的？两次的比值相等',
      };
    },
  },
  {
    id: 'g6b-prop-app-inverse', grade: 6, term: 2, unit: '比例', name: '用反比例解决问题', process: true,
    tip: '找出一定的量（积一定），设未知数，列方程：两次的乘积相等', level: 2,
    gen(r) {
      const nm = r.name();
      const c = r.pick([
        () => { const [a, b] = r.sample([20, 24, 25, 30, 40, 45, 50, 60], 2), T0 = lcm(a, b) * r.int(1, 2); return { q: `一批货物，每天运 ${a} 吨，${T0 / a} 天可以运完。如果每天运 ${b} 吨，几天可以运完？`, k: '货物总量', a: '每天运的吨数', b: '天数', x1: a, y1: T0 / a, x2: b, ans: T0 / b, u: '天' }; },
        () => { const [v1, v2] = r.sample([40, 45, 50, 60, 75, 80, 90, 100], 2), S0 = lcm(v1, v2) * r.int(1, 2); return { q: `一辆汽车从甲地开往乙地，每小时行 ${v1} 千米，${S0 / v1} 小时到达。如果每小时行 ${v2} 千米，几小时到达？`, k: '路程', a: '速度', b: '时间', x1: v1, y1: S0 / v1, x2: v2, ans: S0 / v2, u: '小时', ok: S0 / v2 <= 20 }; },
        () => { const [p1, p2] = r.sample([10, 12, 15, 18, 20, 24, 25, 30], 2), Pg = lcm(p1, p2) * r.int(1, 3); return { q: `${nm}看一本书，每天看 ${p1} 页，${Pg / p1} 天看完。如果每天看 ${p2} 页，几天看完？`, k: '这本书的页数', a: '每天看的页数', b: '天数', x1: p1, y1: Pg / p1, x2: p2, ans: Pg / p2, u: '天', ok: Pg <= 400 && Pg >= 120 }; },
        () => { const [a, b] = r.pick([[2, 3], [3, 4], [2, 4], [4, 5], [3, 5], [4, 6], [5, 6], [3, 6], [6, 8]]), n2 = r.int(2, 30) * (b * b / gcd(a * a, b * b)) / (b * b / gcd(a * a, b * b)) * a * a, n1 = (n2 * b * b) / (a * a); return { q: `一间教室的地面，用边长 ${b} 分米的方砖铺需要 ${n2} 块。如果改用边长 ${a} 分米的方砖铺，需要多少块？`, k: '地面面积', a: '每块砖的面积', b: '块数', x1: b * b, y1: n2, x2: a * a, ans: n1, u: '块', tile: [b, a], ok: n1 <= 2000 && n2 >= 50 }; },
        () => { const [a, b] = r.sample([4, 5, 6, 8, 10, 12], 2), T0 = lcm(a, b) * r.int(3, 10); return { q: `把一批图书装进纸箱，每箱装 ${a} 本，正好装 ${T0 / a} 箱。如果每箱装 ${b} 本，要装多少箱？`, k: '图书总数', a: '每箱的本数', b: '箱数', x1: a, y1: T0 / a, x2: b, ans: T0 / b, u: '箱' }; },
      ].map((f) => () => r.until(f, (o) => o.ok !== false)))();
      const pre = c.tile ? [`每块砖的面积：${c.tile[0]} × ${c.tile[0]} = ${c.tile[0] ** 2}，${c.tile[1]} × ${c.tile[1]} = ${c.tile[1] ** 2}（平方分米）`] : [];
      return {
        q: c.q, answer: [num(c.ans, { unit: c.u })],
        steps: [...pre, `${c.k}一定，${c.a}和${c.b}的乘积一定，它们成反比例`, `设所求为 x ${c.u}：${c.x2}x = ${c.x1} × ${c.y1}`, `x = ${c.x1 * c.y1} ÷ ${c.x2} = ${c.ans}`, `答：是 ${c.ans} ${c.u}。`],
        hint: '什么是一定的？两次的乘积相等',
      };
    },
  },
  {
    id: 'g6b-zoom', grade: 6, term: 2, unit: '比例', name: '图形的放大与缩小',
    tip: '按 n : 1 放大，每条边都乘 n，面积扩大到 n × n 倍；按 1 : n 缩小，每条边都除以 n', level: 2,
    gen(r) {
      const k = r.int(2, 4), big = r.bool(), shape = r.pick(['长方形', '正方形']);
      const L = big ? r.int(3, 9) : k * r.int(3, 8), W = shape === '正方形' ? L : big ? r.int(2, L - 1) : k * r.int(2, L / k - 1);
      const nl = big ? L * k : L / k, nw = big ? W * k : W / k;
      if (r.chance(0.4)) return {
        q: `把一个${shape}按 ${big ? `${k} : 1 放大` : `1 : ${k} 缩小`}，${big ? '放大' : '缩小'}后的面积是原来的 {0}${big ? ' 倍' : ''}。`,
        answer: [big ? num(k * k) : fa(1, k * k)],
        steps: [`每条边都变成原来的 ${big ? k + ' 倍' : frac(1, k)}`, `面积 = 长 × 宽，两条边都变了：${big ? `${k} × ${k} = ${k * k}` : `${frac(1, k)} × ${frac(1, k)} = ${frac(1, k * k)}`}`, `面积是原来的 ${big ? k * k + ' 倍' : frac(1, k * k)}`],
        hint: '长变了几倍？宽变了几倍？',
      };
      return {
        q: `一个${shape}${shape === '正方形' ? `边长 ${L} 厘米` : `长 ${L} 厘米、宽 ${W} 厘米`}。按 ${big ? `${k} : 1 放大` : `1 : ${k} 缩小`}后，${shape === '正方形' ? '边长是 {0} 厘米，' : '长是 {0} 厘米，宽是 {1} 厘米，'}面积是 {${shape === '正方形' ? 1 : 2}} 平方厘米。`,
        answer: shape === '正方形' ? [num(nl), num(nl * nl)] : [num(nl), num(nw), num(nl * nw)],
        steps: [`按 ${big ? `${k} : 1 放大` : `1 : ${k} 缩小`}，每条边都${big ? '乘' : '除以'} ${k}`, shape === '正方形' ? `边长：${L} ${big ? '×' : '÷'} ${k} = ${nl}（厘米）` : `长：${L} ${big ? '×' : '÷'} ${k} = ${nl}（厘米），宽：${W} ${big ? '×' : '÷'} ${k} = ${nw}（厘米）`, `面积：${nl} × ${nw} = ${nl * nw}（平方厘米），是原来的 ${big ? k * k + ' 倍' : frac(1, k * k)}`],
        hint: '每条边都要按同样的比变化',
      };
    },
  },
);

// ---------------- 下册 5 数学广角——鸽巢问题 ----------------
S.push(
  {
    id: 'g6b-pigeon-least', grade: 6, term: 2, unit: '数学广角——鸽巢问题', name: '至少有几个放进同一个抽屉',
    tip: '物体数 ÷ 抽屉数 = 商 …… 余数，至少有（商 + 1）个；没有余数时至少有商个', level: 1,
    gen(r) {
      const c = r.pick([
        () => { const k = r.int(3, 9), n = r.int(k + 1, 5 * k); return { k, n, q: `把 ${n} 个苹果放进 ${k} 个抽屉里，总有一个抽屉里至少放进了几个苹果？`, obj: '苹果', box: '抽屉' }; },
        () => { const k = r.int(3, 8), n = r.int(k + 1, 4 * k); return { k, n, q: `${n} 只鸽子飞回 ${k} 个鸽舍，至少有一个鸽舍飞进了几只鸽子？`, obj: '鸽子', box: '鸽舍' }; },
        () => { const n = r.int(13, 50); return { k: 12, n, q: `六年级一个班有 ${n} 名同学，至少有几名同学的生日在同一个月？`, obj: '同学', box: '月份（12 个）' }; },
        () => { const n = r.int(5, 20); return { k: 4, n, q: `从一副扑克牌中（去掉大小王）任意抽出 ${n} 张，至少有几张是同一种花色？`, obj: '扑克牌', box: '花色（4 种）' }; },
        () => { const k = r.int(3, 6), n = r.int(k + 1, 6 * k); return { k, n, q: `把 ${n} 本书放进 ${k} 个书架，总有一个书架至少放了几本书？`, obj: '书', box: '书架' }; },
        () => { const n = r.int(13, 40); return { k: 12, n, q: `${n} 个小朋友中，至少有几个人的生肖相同？`, obj: '小朋友', box: '生肖（12 种）' }; },
      ])();
      const qq = Math.floor(c.n / c.k), rem = c.n % c.k, ans = rem ? qq + 1 : qq;
      return {
        q: c.q, answer: [num(ans)],
        steps: [`把${c.box}看作抽屉，一共 ${c.k} 个；${c.obj}看作要放的东西，${c.n} 个`, `先平均分：${c.n} ÷ ${c.k} = ${qq}${rem ? ` …… ${rem}` : ''}`, rem ? `每个抽屉放 ${qq} 个后还剩 ${rem} 个，不管放进哪个抽屉，总有一个抽屉至少有 ${qq} + 1 = ${ans} 个` : `正好平均分完，至少有一个抽屉有 ${qq} 个`, '易错：不是“商 + 余数”，而是“商 + 1”'],
        hint: '先尽量平均地放',
      };
    },
  },
  {
    id: 'g6b-pigeon-draw', grade: 6, term: 2, unit: '数学广角——鸽巢问题', name: '至少摸几个保证同色', process: true,
    tip: '考虑最倒霉的情况：每种颜色都先摸到（m - 1）个，再摸 1 个就一定有 m 个同色：种数 ×（m - 1）+ 1', level: 2,
    gen(r) {
      const c = r.pick([
        () => { const cols = r.sample(['红', '黄', '蓝', '绿', '白'], r.int(2, 4)), m = r.int(2, 4); return { k: cols.length, m, q: `一个盒子里有${cols.map((x) => x + '球').join('、')}各 10 个。至少要摸出几个球，才能保证有 ${m} 个球颜色相同？`, kinds: `${cols.length} 种颜色` }; },
        () => { const m = r.int(2, 5); return { k: 4, m, q: `一副扑克牌去掉大小王后还有 52 张。至少要抽出几张，才能保证有 ${m} 张是同一种花色？`, kinds: '4 种花色' }; },
        () => { const k = r.int(2, 4), m = 2, col = r.sample(['黑', '白', '灰', '蓝'], k); return { k, m, q: `抽屉里有${col.join('、')}${CN[k] === '二' ? '两' : CN[k]}种颜色的袜子各 8 只，黑暗中至少要拿出几只，才能保证有 2 只颜色相同（能配成一双）？`, kinds: `${k} 种颜色` }; },
        () => { const k = r.int(5, 8), m = r.int(2, 3); return { k, m, q: `一盒彩笔有 ${k} 种颜色，每种颜色各 6 支。至少要拿出几支，才能保证有 ${m} 支颜色相同？`, kinds: `${k} 种颜色` }; },
      ])();
      const ans = c.k * (c.m - 1) + 1;
      return {
        q: c.q, answer: [num(ans)],
        steps: [`有 ${c.kinds}，把每种看作一个抽屉`, `最倒霉的情况：每种都先拿到 ${c.m - 1} 个，一共 ${c.k} × ${c.m - 1} = ${c.k * (c.m - 1)} 个，还没有 ${c.m} 个同色`, `再拿 1 个，不管是什么颜色，都能凑成 ${c.m} 个同色`, `${c.k * (c.m - 1)} + 1 = ${ans}`],
        hint: '先想最“倒霉”的拿法',
      };
    },
  },
  {
    id: 'g6b-pigeon-rev', grade: 6, term: 2, unit: '数学广角——鸽巢问题', name: '至少要有多少个才能保证', process: true,
    tip: '要保证一个抽屉里至少有 m 个：先每个抽屉放（m - 1）个，再多 1 个：抽屉数 ×（m - 1）+ 1', level: 2,
    gen(r) {
      const c = r.pick([
        () => { const m = r.int(2, 5); return { k: 12, m, q: `至少要有多少人，才能保证一定有 ${m} 个人的生肖相同？`, box: '生肖' }; },
        () => { const m = r.int(2, 4); return { k: 12, m, q: `至少要有多少名同学，才能保证一定有 ${m} 名同学的生日在同一个月？`, box: '月份' }; },
        () => { const k = r.int(3, 9), m = r.int(2, 6); return { k, m, q: `把一些苹果放进 ${k} 个抽屉，要保证总有一个抽屉里至少有 ${m} 个苹果，至少要放多少个苹果？`, box: '抽屉' }; },
        () => { const m = r.int(2, 4); return { k: 7, m, q: `至少要有多少人，才能保证一定有 ${m} 个人在星期几出生是相同的？`, box: '星期一到星期日' }; },
      ])();
      const ans = c.k * (c.m - 1) + 1;
      return {
        q: c.q, answer: [num(ans)],
        steps: [c.box === '抽屉' ? `一共 ${c.k} 个抽屉` : `把${c.box}看作抽屉，一共 ${c.k} 个`, `最不利的情况：每个抽屉都只有 ${c.m - 1} 个，${c.k} × ${c.m - 1} = ${c.k * (c.m - 1)} 个，还不能保证`, `再多 1 个，就一定有一个抽屉达到 ${c.m} 个`, `至少：${c.k * (c.m - 1)} + 1 = ${ans}`],
        hint: '每个抽屉先放几个“还不够”？',
      };
    },
  },
  {
    id: 'g6b-pigeon-worst', grade: 6, term: 2, unit: '数学广角——鸽巢问题', name: '颜色数量不同的摸球问题', process: true,
    tip: '最坏情况：先把“不想要的”都摸完，再摸 1 个（或几个）才能保证', level: 3,
    gen(r) {
      const cols = r.sample(['红', '黄', '蓝', '白'], 3), cnt = r.until(() => [r.int(2, 12), r.int(2, 12), r.int(2, 12)], (a) => new Set(a).size === 3);
      const desc = cols.map((c, i) => `${c}球 ${cnt[i]} 个`).join('、');
      const t = r.int(1, 3);
      if (t === 1) {
        const sorted = [...cnt].sort((a, b) => b - a), ans = sorted[0] + sorted[1] + 1;
        return {
          q: `袋子里有${desc}，这些球除颜色外完全相同。至少要摸出几个球，才能保证三种颜色的球都有？`,
          answer: [num(ans)],
          steps: ['最倒霉的情况：先把最多的两种颜色全部摸完', `最多的两种一共 ${sorted[0]} + ${sorted[1]} = ${sorted[0] + sorted[1]} 个，这时还只有两种颜色`, `再摸 1 个一定是第三种颜色：${sorted[0] + sorted[1]} + 1 = ${ans}`],
          hint: '先把哪些颜色摸完最“倒霉”？',
        };
      }
      if (t === 2) {
        const mx = Math.max(...cnt), ans = mx + 1;
        return {
          q: `袋子里有${desc}，这些球除颜色外完全相同。至少要摸出几个球，才能保证有两种不同颜色的球？`,
          answer: [num(ans)],
          steps: ['最倒霉的情况：先一直摸到同一种颜色，而且是最多的那种', `最多的一种有 ${mx} 个，摸完它们还只有一种颜色`, `再摸 1 个一定是另一种颜色：${mx} + 1 = ${ans}`],
          hint: '哪种颜色最多？',
        };
      }
      const i = r.int(0, 2), m = r.int(2, Math.min(4, cnt[i])), others = cnt.reduce((a, b) => a + b, 0) - cnt[i], ans = others + m;
      return {
        q: `袋子里有${desc}，这些球除颜色外完全相同。至少要摸出几个球，才能保证至少有 ${m} 个${cols[i]}球？`,
        answer: [num(ans)],
        steps: [`最倒霉的情况：先把其他颜色的球全部摸完：${others} 个`, `再摸 ${m} 个，一定都是${cols[i]}球`, `${others} + ${m} = ${ans}`],
        hint: '先把不是' + cols[i] + '色的都摸完',
      };
    },
  },
);

// ---------------- 下册 6 整理和复习（小升初计算） ----------------
const DECF = [[0.25, [1, 4]], [0.5, [1, 2]], [0.75, [3, 4]], [0.2, [1, 5]], [0.4, [2, 5]], [0.6, [3, 5]], [0.8, [4, 5]], [1.25, [5, 4]], [1.5, [3, 2]], [0.125, [1, 8]], [0.375, [3, 8]], [2.5, [5, 2]], [1.2, [6, 5]], [3.6, [18, 5]]];
S.push(
  {
    id: 'g6b-calc-mix', grade: 6, term: 2, unit: '整理和复习', name: '分数、小数四则混合运算',
    tip: '分数和小数混在一起：能化成有限小数的可以化小数，否则把小数化成分数再算', level: 2,
    gen(r) {
      const t = r.int(1, 4);
      const [d1, f1] = r.pick(DECF);
      let q, res, steps;
      if (t === 1) {
        const [a, b] = r.until(() => [rfrac(r, 2, 9), rfrac(r, 2, 12)], ([a, b]) => { const p = Fr.mul(f1, a); return p[1] !== b[1] && Fr.add(p, b)[1] <= 40; });
        const p = Fr.mul(f1, a); q = `${fmt(d1)} × ${F(a)} + ${F(b)}`; res = Fr.add(p, b);
        steps = [`把 ${fmt(d1)} 化成分数 ${F(f1)}`, mulLine(f1, a), addLine(p, b, '+')];
      } else if (t === 2) {
        const [a, b] = r.until(() => [rfrac(r, 2, 9), rfrac(r, 2, 9)], ([a, b]) => { const s1 = Fr.add(a, f1); return Fr.div(s1, b)[1] <= 30 && a[1] !== f1[1]; });
        const s1 = Fr.add(a, f1); q = `(${F(a)} + ${fmt(d1)}) ÷ ${F(b)}`; res = Fr.div(s1, b);
        steps = [`把 ${fmt(d1)} 化成分数 ${F(f1)}`, `先算括号里：${addLine(a, f1, '+')}`, divLine(s1, b)];
      } else if (t === 3) {
        const [a, b] = r.until(() => [rfrac(r, 2, 9), rfrac(r, 2, 9)], ([a, b]) => { const qt = Fr.div(f1, a); return Fr.val(qt) > Fr.val(b) && qt[1] !== b[1] && Fr.sub(qt, b)[1] <= 40; });
        const qt = Fr.div(f1, a); q = `${fmt(d1)} ÷ ${F(a)} - ${F(b)}`; res = Fr.sub(qt, b);
        steps = [`把 ${fmt(d1)} 化成分数 ${F(f1)}`, divLine(f1, a), addLine(qt, b, '-')];
      } else {
        const k = r.int(2, 9), a = r.until(() => rfrac(r, 2, 9), (a) => Fr.val(Fr.mul(f1, a)) < k && Fr.mul(f1, a)[1] <= 20);
        const p = Fr.mul(f1, a); q = `${k} - ${fmt(d1)} × ${F(a)}`; res = Fr.sub([k, 1], p);
        steps = [`把 ${fmt(d1)} 化成分数 ${F(f1)}`, '先算乘法：' + mulLine(f1, a), addLine([k, 1], p, '-')];
      }
      steps.push(`结果：${F(res)}${mixNote(res)}`);
      return { q: `${q} = {0}`, answer: [faX(res)], steps, hint: '小数先化成分数' };
    },
  },
  {
    id: 'g6b-calc-split', grade: 6, term: 2, unit: '整理和复习', name: '分数裂项求和',
    tip: '分母是两个数的积，而且两数相差 1（或 2）：{{1/6}} = {{1/2}} - {{1/3}}，拆开后中间的数前后抵消', level: 3,
    gen(r) {
      const t = r.int(1, 3);
      if (t === 1) {
        const n = r.int(4, 20);
        return {
          q: `${frac(1, 2)} + ${frac(1, 6)} + ${frac(1, 12)} + … + ${frac(1, n * (n + 1))} = {0}`,
          answer: [fa(n, n + 1)],
          steps: [`每个分母都是两个相邻数的积：2 = 1 × 2，6 = 2 × 3，12 = 3 × 4，…，${n * (n + 1)} = ${n} × ${n + 1}`, `拆项：${frac(1, 2)} = 1 - ${frac(1, 2)}，${frac(1, 6)} = ${frac(1, 2)} - ${frac(1, 3)}，…，${frac(1, n * (n + 1))} = ${frac(1, n)} - ${frac(1, n + 1)}`, `相加时中间的都抵消了，只剩 1 - ${frac(1, n + 1)} = ${frac(n, n + 1)}`],
          hint: '6 = 2 × 3，12 = 3 × 4，最后一个分母是哪两个数的积？',
        };
      }
      if (t === 2) {
        const m = r.int(2, 6), n = r.int(m + 3, 15), res = Fr.sub([1, m], [1, n + 1]);
        return {
          q: `${frac(1, m * (m + 1))} + ${frac(1, (m + 1) * (m + 2))} + ${frac(1, (m + 2) * (m + 3))} + … + ${frac(1, n * (n + 1))} = {0}`,
          answer: [faX(res)],
          steps: [`${m * (m + 1)} = ${m} × ${m + 1}，${(m + 1) * (m + 2)} = ${m + 1} × ${m + 2}，…，${n * (n + 1)} = ${n} × ${n + 1}`, `每一项拆成两个分数的差：${frac(1, m * (m + 1))} = ${frac(1, m)} - ${frac(1, m + 1)}……`, `抵消后剩下 ${frac(1, m)} - ${frac(1, n + 1)} = ${F(res)}`],
          hint: '每个分母是哪两个相邻数的积？',
        };
      }
      const n = r.int(3, 12);
      return {
        q: `${frac(1, 3)} + ${frac(1, 15)} + ${frac(1, 35)} + … + ${frac(1, (2 * n - 1) * (2 * n + 1))} = {0}`,
        answer: [fa(n, 2 * n + 1)],
        steps: [`分母是两个相差 2 的奇数的积：3 = 1 × 3，15 = 3 × 5，35 = 5 × 7，…，${(2 * n - 1) * (2 * n + 1)} = ${2 * n - 1} × ${2 * n + 1}`, `相差 2 时：${frac(1, 15)} = (${frac(1, 3)} - ${frac(1, 5)}) × ${frac(1, 2)}，每一项都要乘 ${frac(1, 2)}`, `抵消后：(1 - ${frac(1, 2 * n + 1)}) × ${frac(1, 2)} = ${frac(2 * n, 2 * n + 1)} × ${frac(1, 2)} = ${fs(n, 2 * n + 1)}`],
        hint: '15 = 3 × 5，两个因数相差几？',
      };
    },
  },
);

// ---------------- 下册 拓展：浓度、利润、比的变化 ----------------
const CONC = [['盐', '盐水', '含盐率'], ['糖', '糖水', '含糖率']];
const PGOODS = [['书包', '个', 60, 300], ['运动鞋', '双', 100, 600], ['台灯', '个', 60, 300], ['自行车', '辆', 200, 1000], ['羽绒服', '件', 200, 1000], ['电饭煲', '个', 100, 600], ['足球', '个', 40, 200], ['词典', '本', 20, 100], ['电话手表', '块', 200, 1000]];
S.push(
  {
    id: 'g6b-conc-mix', grade: 6, term: 2, unit: '百分数（二）', name: '浓度问题：两种溶液混合', process: true,
    tip: '混合后盐的总量 = 两份盐相加，盐水总量 = 两份盐水相加；不能把两个含盐率直接相加或求平均', level: 3,
    gen(r) {
      const [sol, solv, rate] = r.pick(CONC);
      if (r.bool()) {
        const o = r.until(() => {
          const M1 = r.step(100, 600, 50), M2 = r.step(100, 600, 50), [p1, p2] = r.sample([5, 8, 10, 12, 15, 20, 25, 30, 40], 2);
          const s1 = fix((M1 * p1) / 100), s2 = fix((M2 * p2) / 100);
          return { M1, M2, p1, p2, s1, s2, p: fix(((s1 + s2) * 100) / (M1 + M2)) };
        }, (o) => Number.isInteger(o.s1) && Number.isInteger(o.s2) && dp(o.p) <= 1 && o.M1 !== o.M2);
        return {
          q: `把${rate}为 ${o.p1}% 的${solv} ${o.M1} 克和${rate}为 ${o.p2}% 的${solv} ${o.M2} 克混合，混合后${solv}的${rate}是多少？`,
          answer: [num(o.p, { unit: '%' })],
          steps: [`第一份含${sol}：${o.M1} × ${o.p1}% = ${o.s1}（克）`, `第二份含${sol}：${o.M2} × ${o.p2}% = ${o.s2}（克）`, `混合后${sol}：${o.s1} + ${o.s2} = ${o.s1 + o.s2}（克），${solv}：${o.M1} + ${o.M2} = ${o.M1 + o.M2}（克）`, `${rate}：${o.s1 + o.s2} ÷ ${o.M1 + o.M2} × 100% = ${fmt(o.p)}%`, `易错：不能把 ${o.p1}% 和 ${o.p2}% 直接相加或求平均数`],
          hint: `先分别求两份${solv}里各有多少${sol}`,
        };
      }
      const o = r.until(() => {
        const [a, b] = r.sample([5, 10, 15, 20, 25, 30, 40, 50], 2).sort((x, y) => y - x);
        const c = r.int(b + 1, a - 1), T = r.step(100, 1000, 50);
        return { a, b, c, T, x: (T * (c - b)) / (a - b) };
      }, (o) => Number.isInteger(o.x) && o.x % 10 === 0 && o.x > 0 && o.x < o.T);
      const { a, b, c, T, x } = o;
      return {
        q: `用${rate}为 ${a}% 和 ${b}% 的两种${solv}，配制${rate}为 ${c}% 的${solv} ${T} 克。两种${solv}各需要多少克？`,
        answer: [num(x, { label: `${a}% 的`, unit: '克' }), num(T - x, { label: `${b}% 的`, unit: '克' })],
        steps: [`设需要 ${a}% 的${solv} x 克，那么 ${b}% 的${solv}要（${T} - x）克`, `混合前后${sol}的总量相等：${a}% × x + ${b}% × (${T} - x) = ${T} × ${c}%`, `${fmt(a / 100)}x + ${fmt(fix((T * b) / 100))} - ${fmt(b / 100)}x = ${fmt(fix((T * c) / 100))}`, `${fmt(fix((a - b) / 100))}x = ${fmt(fix((T * (c - b)) / 100))}，x = ${x}`, `${b}% 的${solv}：${T} - ${x} = ${T - x}（克）`],
        hint: `混合前后，什么的总量相等？`,
      };
    },
  },
  {
    id: 'g6b-conc-salt', grade: 6, term: 2, unit: '百分数（二）', name: '浓度问题：蒸发水分和加盐', process: true,
    tip: '蒸发水分时盐不变；加盐时水不变。先抓住不变的量，再求新的盐水', level: 3,
    gen(r) {
      const [sol, solv, rate] = r.pick(CONC), t = r.int(1, 3);
      if (t === 1) {
        const { M, p1, p2 } = r.until(() => ({ M: r.step(100, 1000, 50), p1: r.pick([2, 4, 5, 6, 8, 10, 12, 15, 20]), p2: r.pick([5, 8, 10, 12, 15, 16, 20, 25, 30, 40]) }), ({ M, p1, p2 }) => p2 > p1 && Number.isInteger((M * p1) / 100) && Number.isInteger((M * p1) / p2));
        const s = (M * p1) / 100, N = (s * 100) / p2;
        return {
          q: `有${rate}为 ${p1}% 的${solv} ${M} 克，要使${rate}提高到 ${p2}%，需要蒸发掉多少克水？`,
          answer: [num(M - N, { unit: '克' })],
          steps: [`蒸发水分时${sol}的质量不变：${M} × ${p1}% = ${s}（克）`, `蒸发后的${solv}：${s} ÷ ${p2}% = ${N}（克）`, `蒸发掉的水：${M} - ${N} = ${M - N}（克）`, `答：需要蒸发掉 ${M - N} 克水。`],
          hint: '蒸发水分时，什么没有变？',
        };
      }
      if (t === 2) {
        const { M, p1, p2 } = r.until(() => ({ M: r.step(100, 1000, 50), p1: r.pick([4, 5, 8, 10, 12, 15, 20]), p2: r.pick([10, 12, 15, 20, 25, 28, 30, 40]) }), ({ M, p1, p2 }) => p2 > p1 && Number.isInteger((M * (100 - p1)) / 100) && Number.isInteger((M * (100 - p1)) / (100 - p2)));
        const w = (M * (100 - p1)) / 100, N = (w * 100) / (100 - p2);
        return {
          q: `有${rate}为 ${p1}% 的${solv} ${M} 克，要使${rate}提高到 ${p2}%，需要再加入多少克${sol}？`,
          answer: [num(N - M, { unit: '克' })],
          steps: [`加${sol}时，水的质量不变：${M} × (1 - ${p1}%) = ${w}（克）`, `新${solv}里水占 1 - ${p2}% = ${100 - p2}%，新${solv}：${w} ÷ ${100 - p2}% = ${N}（克）`, `加入的${sol}：${N} - ${M} = ${N - M}（克）`, `易错：加${sol}后${sol}变多了，不变的是水`],
          hint: `加${sol}时，什么没有变？`,
        };
      }
      const { M, p1, g, p } = r.until(() => { const M = r.step(100, 500, 20), p1 = r.pick([5, 8, 10, 12, 15, 20]), g = r.step(10, 100, 10); return { M, p1, g, p: fix((((M * p1) / 100 + g) * 100) / (M + g)) }; }, ({ M, p1, p }) => Number.isInteger((M * p1) / 100) && dp(p) <= 1);
      const s = (M * p1) / 100;
      return {
        q: `有${rate}为 ${p1}% 的${solv} ${M} 克，再加入 ${g} 克${sol}，完全溶解后，${rate}是多少？`,
        answer: [num(p, { unit: '%' })],
        steps: [`原来的${sol}：${M} × ${p1}% = ${s}（克）`, `现在${sol}：${s} + ${g} = ${s + g}（克），${solv}：${M} + ${g} = ${M + g}（克）`, `${rate}：${s + g} ÷ ${M + g} × 100% = ${fmt(p)}%`, `易错：加了${sol}，${solv}也变重了`],
        hint: `加${sol}后，${sol}和${solv}都变了`,
      };
    },
  },
  {
    id: 'g6b-profit-basic', grade: 6, term: 2, unit: '百分数（二）', name: '利润和利润率', process: true,
    tip: '利润 = 售价 - 进价；利润率 = 利润 ÷ 进价 × 100%；售价 = 进价 ×（1 + 利润率）', level: 3,
    gen(r) {
      const [gd, m, lo, hi] = r.pick(PGOODS), t = r.int(1, 4);
      if (t === 4) {
        const { c, p } = r.until(() => ({ c: r.step(lo, hi, 10), p: r.pick([10, 20, 25, 30, 40]) }), ({ c, p }) => Number.isInteger((c * (100 - p)) / 100));
        const S0 = (c * (100 - p)) / 100;
        return {
          q: `换季清仓，一${m}${gd}卖了 ${S0} 元，比进价亏了 ${p}%。这${m}${gd}的进价是多少元？`,
          answer: [num(c, { unit: '元' })],
          steps: [`亏了 ${p}%，是以进价为单位“1”：售价是进价的 1 - ${p}% = ${100 - p}%`, `进价：${S0} ÷ ${100 - p}% = ${c}（元）`, `检验：${c} - ${S0} = ${c - S0}，${c - S0} ÷ ${c} = ${p}% ✓`],
          hint: '亏的百分之几是谁的百分之几？',
        };
      }
      const { c, p } = r.until(() => ({ c: r.step(lo, hi, 10), p: r.pick([10, 15, 20, 25, 30, 40, 50, 60]) }), ({ c, p }) => Number.isInteger((c * p) / 100));
      const P = (c * p) / 100, S0 = c + P;
      if (t === 1) return {
        q: `商店购进一批${gd}，每${m}进价 ${c} 元，按 ${p}% 的利润率定价。每${m}${gd}的售价是多少元？`,
        answer: [num(S0, { unit: '元' })],
        steps: [`每${m}的利润：${c} × ${p}% = ${P}（元）`, `售价 = 进价 + 利润：${c} + ${P} = ${S0}（元）`, `也可以一步算：${c} × (1 + ${p}%) = ${S0}（元）`],
        hint: '利润率是利润占进价的百分之几',
      };
      if (t === 2) return {
        q: `一种${gd}每${m}售价 ${S0} 元，利润率是 ${p}%。每${m}${gd}的进价是多少元？`,
        answer: [num(c, { unit: '元' })],
        steps: [`利润率是以进价为单位“1”的：售价是进价的 1 + ${p}% = ${100 + p}%`, `进价：${S0} ÷ ${100 + p}% = ${c}（元）`, `易错：不能用 ${S0} × (1 - ${p}%)，${p}% 是进价的百分之几，不是售价的`],
        hint: '售价是进价的百分之几？',
      };
      return {
        q: `商店以每${m} ${c} 元的价格购进一批${gd}，每${m}卖 ${S0} 元。这批${gd}的利润率是多少？`,
        answer: [num(p, { unit: '%' })],
        steps: [`每${m}的利润：${S0} - ${c} = ${P}（元）`, `利润率 = 利润 ÷ 进价 × 100%：${P} ÷ ${c} × 100% = ${p}%`, `易错：要除以进价 ${c}，不是售价 ${S0}`],
        hint: '利润率 = 利润 ÷ 进价',
      };
    },
  },
  {
    id: 'g6b-profit-markup', grade: 6, term: 2, unit: '百分数（二）', name: '先提价再打折的利润问题', process: true,
    tip: '提价是以进价为单位“1”，打折是以定价为单位“1”；设进价为 x，按“售价 - 进价 = 利润”列方程', level: 3,
    gen(r) {
      const [gd, m, lo, hi] = r.pick(PGOODS), t = r.int(1, 3);
      if (t === 3) {
        const { S0, p } = r.until(() => ({ S0: r.step(Math.max(60, lo), hi, 12), p: r.pick([20, 25, 50]) }), ({ S0, p }) => Number.isInteger((S0 * 100) / (100 + p)) && Number.isInteger((S0 * 100) / (100 - p)));
        const c1 = (S0 * 100) / (100 + p), c2 = (S0 * 100) / (100 - p), diff = c1 + c2 - 2 * S0;
        return {
          q: `商店把两${m}${gd}都按 ${S0} 元卖出，其中一${m}赚了 ${p}%，另一${m}亏了 ${p}%（都是和进价比）。商店卖这两${m}${gd}是赚了还是亏了？{0} 了 {1} 元`,
          answer: [choice(['赚', '亏'], '亏'), num(diff, { unit: '元' })],
          steps: [`赚的那${m}：进价 ${S0} ÷ (1 + ${p}%) = ${c1}（元）`, `亏的那${m}：进价 ${S0} ÷ (1 - ${p}%) = ${c2}（元）`, `进价一共 ${c1} + ${c2} = ${c1 + c2}（元），卖了 ${S0} × 2 = ${2 * S0}（元）`, `${c1 + c2} - ${2 * S0} = ${diff}，亏了 ${diff} 元`, '易错：赚和亏的百分数一样，但两件的进价不一样，所以不是不赚不亏'],
          hint: '先分别求两件的进价',
        };
      }
      const o = r.until(() => {
        const c = r.step(lo, hi, 10), p = r.pick([20, 25, 30, 40, 50, 60]), z = r.pick([7, 7.5, 8, 8.5, 9, 9.5]);
        const price = fix((c * (100 + p)) / 100), sale = fix((price * z) / 10);
        return { c, p, z, price, sale, X: fix(sale - c) };
      }, (o) => Number.isInteger(o.price) && Number.isInteger(o.sale) && o.X > 0);
      const { c, p, z, price, sale, X } = o, f = fix(((100 + p) * z) / 1000);
      if (t === 1) return {
        q: `一${m}${gd}进价 ${c} 元。商店先按进价提高 ${p}% 定价，再打${zhe(z)}出售。卖出这${m}${gd}赚了多少元？`,
        answer: [num(X, { unit: '元' })],
        steps: [`定价（以进价为单位“1”）：${c} × (1 + ${p}%) = ${price}（元）`, `售价（以定价为单位“1”）：${price} × ${fmt(z * 10)}% = ${sale}（元）`, `赚了：${sale} - ${c} = ${X}（元）`],
        hint: '先求定价，再求打折后的售价',
      };
      return {
        q: `一种${gd}按进价提高 ${p}% 定价，再打${zhe(z)}出售，每${m}仍能赚 ${X} 元。每${m}${gd}的进价是多少元？`,
        answer: [num(c, { unit: '元' })],
        steps: [`设每${m}进价 x 元，定价是 (1 + ${p}%)x，售价是 (1 + ${p}%)x × ${fmt(z * 10)}% = ${fmt(f)}x`, `售价 - 进价 = 利润：${fmt(f)}x - x = ${X}`, `${fmt(fix(f - 1))}x = ${X}，x = ${X} ÷ ${fmt(fix(f - 1))} = ${c}`, `答：每${m}进价 ${c} 元。`],
        hint: '设进价为 x，先用 x 表示售价',
      };
    },
  },
);
S.push(
  {
    id: 'g6b-ratio-change', grade: 6, term: 2, unit: '比例', name: '比的变化：一个量不变或总量不变', process: true,
    tip: '找不变的量作单位“1”：一个量没变就以它为标准，总量没变就以总量为标准；变化的数量对应分率的差', level: 3,
    gen(r) {
      const rr = () => r.until(() => [r.int(1, 7), r.int(1, 7)], ([a, b]) => a !== b && gcd(a, b) === 1);
      if (r.bool()) {
        const nm = r.pick(['六（1）班', '六（2）班', '六（3）班']);
        const c = r.pick([
          { s: (a, b, x, cc, d) => `${nm}原来男生和女生人数的比是 ${a} : ${b}，后来又转来 ${x} 名男生，这时男生和女生人数的比是 ${cc} : ${d}。原来有男生多少名？`, A: '男生', B: '女生', u: '名', max: 30 },
          { s: (a, b, x, cc, d) => `图书角里故事书和科技书的本数比是 ${a} : ${b}，又买来 ${x} 本故事书后，故事书和科技书的本数比是 ${cc} : ${d}。原来有故事书多少本？`, A: '故事书', B: '科技书', u: '本', max: 120 },
          { s: (a, b, x, cc, d) => `甲、乙两个粮仓存粮的吨数比是 ${a} : ${b}，甲仓又运进 ${x} 吨后，甲、乙两仓存粮的比是 ${cc} : ${d}。甲仓原来存粮多少吨？`, A: '甲仓', B: '乙仓', u: '吨', max: 200 },
        ]);
        const o = r.until(() => { const [a, b] = rr(), [cc, d] = rr(), L = lcm(b, d), Bv = L * r.int(1, 6); return { a, b, cc, d, Bv, Av: (Bv * a) / b, x: (Bv * cc) / d - (Bv * a) / b }; },
          (o) => o.Bv <= c.max && o.Bv >= 8 && Number.isInteger(o.Av) && o.Av >= 4 && o.x > 0 && o.x <= o.Av);
        const { a, b, cc, d, Bv, Av, x } = o, df = Fr.sub([cc, d], [a, b]);
        return {
          q: c.s(a, b, x, cc, d), answer: [num(Av, { unit: c.u })],
          steps: [`${c.B}没有变，以${c.B}为单位“1”`, `原来${c.A}是${c.B}的 ${fs(a, b)}，后来是${c.B}的 ${fs(cc, d)}`, `增加的 ${x} ${c.u}对应${c.B}的：${addLine([cc, d], [a, b], '-')}`, `${c.B}：${x} ÷ ${F(df)} = ${Bv}（${c.u}）`, `原来${c.A}：${Bv} × ${fs(a, b)} = ${Av}（${c.u}）`],
          hint: `哪个量没有变？`,
        };
      }
      const c = r.pick([
        { s: (a, b, x, cc, d) => `甲、乙两个书架上的书的本数比是 ${a} : ${b}，从甲架拿 ${x} 本放到乙架后，甲、乙两架的本数比是 ${cc} : ${d}。两个书架一共有多少本书？`, A: '甲架', u: '本', max: 400 },
        { s: (a, b, x, cc, d) => `六（1）班和六（2）班参加合唱队的人数比是 ${a} : ${b}，从六（1）班调 ${x} 人到六（2）班后，两班人数比是 ${cc} : ${d}。两班一共有多少人参加合唱队？`, A: '六（1）班', u: '人', max: 80 },
        { s: (a, b, x, cc, d) => `两筐苹果的质量比是 ${a} : ${b}，从第一筐取出 ${x} 千克放入第二筐后，两筐苹果的质量比是 ${cc} : ${d}。两筐苹果一共有多少千克？`, A: '第一筐', u: '千克', max: 200 },
      ]);
      const o = r.until(() => { const [a, b] = rr(), [cc, d] = rr(), L = lcm(a + b, cc + d); return { a, b, cc, d, T: L * r.int(1, 4) }; }, (o) => o.a * (o.cc + o.d) > o.cc * (o.a + o.b) && o.T <= c.max && o.T >= 20);
      const { a, b, cc, d, T } = o, f1 = [a, a + b], f2 = [cc, cc + d], df = Fr.sub(f1, f2), x = (T * df[0]) / df[1];
      return {
        q: c.s(a, b, x, cc, d), answer: [num(T, { unit: c.u })],
        steps: [`调动前后总数没有变，以总数为单位“1”`, `原来${c.A}占总数的 ${fs(a, a + b)}，后来占总数的 ${fs(cc, cc + d)}`, `拿走的 ${x} ${c.u}对应总数的：${addLine(simplify(...f1), simplify(...f2), '-')}`, `总数：${x} ÷ ${F(df)} = ${T}（${c.u}）`],
        hint: '什么没有变？',
      };
    },
  },
  {
    id: 'g6b-ratio-diff', grade: 6, term: 2, unit: '比例', name: '已知差和比、年龄问题', process: true,
    tip: '两个量的差对应比的份数差；年龄问题里两人的年龄差永远不变', level: 3,
    gen(r) {
      if (r.bool()) {
        const c = r.pick([
          { X: '男生', Y: '女生', u: '名', s: (a, b, d) => `合唱队里男生和女生人数的比是 ${a} : ${b}，男生比女生多 ${d} 名。男生、女生各有多少名？` },
          { X: '篮球', Y: '足球', u: '个', s: (a, b, d) => `体育室里篮球和足球个数的比是 ${a} : ${b}，篮球比足球多 ${d} 个。篮球、足球各有多少个？` },
          { X: '长绳', Y: '短绳', u: '米', s: (a, b, d) => `两根绳子长度的比是 ${a} : ${b}，长绳比短绳长 ${d} 米。两根绳子各长多少米？` },
          { X: '甲数', Y: '乙数', u: '', s: (a, b, d) => `甲数和乙数的比是 ${a} : ${b}，甲数比乙数大 ${d}。甲数、乙数各是多少？` },
          { X: '大米', Y: '面粉', u: '千克', s: (a, b, d) => `食堂运来大米和面粉的质量比是 ${a} : ${b}，大米比面粉多 ${d} 千克。大米、面粉各运来多少千克？` },
        ]);
        const [a, b] = r.until(() => [r.int(2, 9), r.int(1, 8)], ([a, b]) => a > b && gcd(a, b) === 1), k = r.int(2, 15), d = (a - b) * k;
        const { X, Y, u } = c, uu = u ? ' ' + u : '';
        return {
          q: c.s(a, b, d),
          answer: [num(a * k, { label: X, unit: u }), num(b * k, { label: Y, unit: u })],
          steps: [`把${X}看作 ${a} 份，${Y}看作 ${b} 份，${X}比${Y}多 ${a} - ${b} = ${a - b} 份`, a - b === 1 ? `多的 1 份就是 ${d}${uu}` : `${a - b} 份对应 ${d}${uu}，1 份：${d} ÷ ${a - b} = ${k}${uu}`, `${X}：${k} × ${a} = ${a * k}${uu}，${Y}：${k} × ${b} = ${b * k}${uu}`],
          hint: '多出来的数量对应几份？',
        };
      }
      const nm = r.name();
      const o = r.until(() => {
        const s0 = r.int(6, 14), f0 = r.int(28, 45), n = r.int(2, 12);
        const [a, b] = simplify(f0, s0), [cc, d] = simplify(f0 + n, s0 + n), L = lcm(a - b, cc - d);
        const b2 = (b * L) / (a - b), d2 = (d * L) / (cc - d);
        return { s0, f0, n, a, b, cc, d, L, b2, d2, u: n / (d2 - b2) };
      }, (o) => o.a + o.b <= 14 && o.cc + o.d <= 14 && Number.isInteger(o.u) && o.a !== o.cc);
      const { s0, f0, n, a, b, cc, d, L, b2, d2, u } = o, a2 = (a * L) / (a - b), c2 = (cc * L) / (cc - d);
      return {
        q: `今年爸爸和${nm}的年龄比是 ${a} : ${b}，${n} 年后爸爸和${nm}的年龄比是 ${cc} : ${d}。今年爸爸和${nm}各多少岁？`,
        answer: [num(f0, { label: '爸爸', unit: '岁' }), num(s0, { label: nm, unit: '岁' })],
        steps: ['两人的年龄差永远不变，先把两个比里的“差”统一成同样的份数', `今年差 ${a - b} 份，${n} 年后差 ${cc - d} 份，统一成 ${L} 份：今年 ${a2} : ${b2}，${n} 年后 ${c2} : ${d2}`, `${nm}从 ${b2} 份变成 ${d2} 份，多了 ${d2 - b2} 份，正好是 ${n} 岁，1 份是 ${n} ÷ ${d2 - b2} = ${u}（岁）`, `今年爸爸：${a2} × ${u} = ${f0}（岁），${nm}：${b2} × ${u} = ${s0}（岁）`],
        hint: '什么永远不变？',
      };
    },
  },
  {
    id: 'g6b-ratio-chain', grade: 6, term: 2, unit: '比例', name: '连比和分率化比', process: true,
    tip: '连比：把两个比里共有的量统一成同样的份数；“甲的几分之几等于乙的几分之几”可以用比例的基本性质写成比', level: 3,
    gen(r) {
      const t = r.int(1, 3);
      if (t === 3) {
        const [p, q] = r.until(() => [rfrac(r, 2, 9), rfrac(r, 2, 9)], ([p, q]) => p[0] * q[1] !== q[0] * p[1] && p[1] !== q[1]);
        const [x, y] = simplify(q[0] * p[1], q[1] * p[0]);
        return {
          q: `甲数的 ${F(p)} 等于乙数的 ${F(q)}（甲、乙都不为 0），甲数和乙数的最简整数比是多少？`,
          answer: [ratioAns(x, y)],
          steps: [`甲 × ${F(p)} = 乙 × ${F(q)}，看成“外项之积 = 内项之积”`, `甲 : 乙 = ${F(q)} : ${F(p)}`, `化简：前后项同时乘 ${lcm(q[1], p[1])}，得 ${(q[0] * lcm(q[1], p[1])) / q[1]} : ${(p[0] * lcm(q[1], p[1])) / p[1]}${gcd((q[0] * lcm(q[1], p[1])) / q[1], (p[0] * lcm(q[1], p[1])) / p[1]) > 1 ? ` = ${x} : ${y}` : ''}`],
          hint: '甲和谁一起当外项？',
        };
      }
      const [a, b] = r.until(() => [r.int(1, 9), r.int(1, 9)], ([a, b]) => a !== b && gcd(a, b) === 1);
      const [c, d] = r.until(() => [r.int(1, 9), r.int(1, 9)], ([c, d]) => c !== d && gcd(c, d) === 1 && c !== b);
      const L = lcm(b, c), A = (a * L) / b, B = L, Cc = (d * L) / c, g = gcd(gcd(A, B), Cc), abc = [A / g, B / g, Cc / g];
      if (abc[0] + abc[1] + abc[2] > 40) return this.gen(r);
      const [X, Y, Z, u, who, w] = t === 1 ? ['甲', '乙', '丙', '', '', ''] : r.pick([['甲', '乙', '丙', '', '有甲、乙、丙三个数', ''], ['一班', '二班', '三班', '人', '三个班参加植树', '人数'], ['红花', '黄花', '紫花', '盆', '花坛里摆了三种花', '盆数']]);
      const pre = [`${Y}是两个比共有的量，${X} : ${Y} = ${a} : ${b}，${Y} : ${Z} = ${c} : ${d}`, `把${Y}的份数统一成 ${b} 和 ${c} 的最小公倍数 ${L}：${X} : ${Y} = ${A} : ${L}，${Y} : ${Z} = ${L} : ${Cc}`, `${X} : ${Y} : ${Z} = ${A} : ${B} : ${Cc}${g > 1 ? ` = ${abc.join(' : ')}` : ''}`];
      if (t === 1) return {
        q: `${X} : ${Y} = ${a} : ${b}，${Y} : ${Z} = ${c} : ${d}，那么 ${X} : ${Y} : ${Z} = {0} : {1} : {2}（填最简整数比）`,
        answer: abc.map((v) => num(v)),
        steps: pre,
        hint: `${Y}在两个比里的份数不一样，先统一`,
      };
      const sum = abc[0] + abc[1] + abc[2], k = r.int(2, Math.max(2, Math.floor(200 / sum))), T0 = sum * k, ask = r.int(0, 2);
      return {
        q: `${who}，${X}和${Y}${w}的比是 ${a} : ${b}，${Y}和${Z}${w}的比是 ${c} : ${d}。${u ? `一共 ${T0} ${u}` : `三个数的和是 ${T0}`}，${[X, Y, Z][ask]}${u ? '有' : '是'}多少${u}？`,
        answer: [num(abc[ask] * k, { unit: u })],
        steps: [...pre, `一共 ${sum} 份，1 份是 ${T0} ÷ ${sum} = ${k}`, `${[X, Y, Z][ask]}：${k} × ${abc[ask]} = ${abc[ask] * k}${u ? '（' + u + '）' : ''}`],
        hint: '先把两个比连成一个连比',
      };
    },
  },
);

// ---------------- 下册 整理和复习（小升初拓展：工程、行程、新运算、阴影面积） ----------------
const NICE_T = [4, 5, 6, 8, 9, 10, 12, 15, 16, 18, 20, 24, 30, 36];
function relayCtx(r) {
  const [n1, n2] = r.names(2);
  return r.pick([
    { u: '天', s: (a, b) => `修一条路，甲队单独修 ${a} 天修完，乙队单独修 ${b} 天修完。`, x: '甲队', y: '乙队', first: (t) => `甲队先修了 ${t} 天`, both: (t) => `两队合修 ${t} 天后，甲队被调走`, rest: '剩下的由乙队修完', ask: '乙队还要修多少天' },
    { u: '小时', s: (a, b) => `一份稿件，${n1}单独打要 ${a} 小时，${n2}单独打要 ${b} 小时。`, x: n1, y: n2, first: (t) => `${n1}先打了 ${t} 小时`, both: (t) => `两人合打 ${t} 小时后，${n1}有事离开`, rest: `剩下的由${n2}打完`, ask: `${n2}还要打多少小时` },
    { u: '天', s: (a, b) => `加工一批零件，师傅单独做 ${a} 天完成，徒弟单独做 ${b} 天完成。`, x: '师傅', y: '徒弟', first: (t) => `师傅先做了 ${t} 天`, both: (t) => `师徒合作 ${t} 天后，师傅去做别的工作`, rest: '剩下的由徒弟做完', ask: '徒弟还要做多少天' },
    { u: '天', s: (a, b) => `一项工程，甲工程队单独做 ${a} 天完成，乙工程队单独做 ${b} 天完成。`, x: '甲队', y: '乙队', first: (t) => `甲队先做了 ${t} 天`, both: (t) => `两队合作 ${t} 天后，甲队撤出`, rest: '剩下的由乙队做完', ask: '乙队还要做多少天' },
  ]);
}
S.push(
  {
    id: 'g6b-work-relay', grade: 6, term: 2, unit: '整理和复习', name: '工程问题：先做几天再接着做', process: true,
    tip: '把工作总量看作单位“1”：先算已经完成的分率，剩下的 = 1 - 已完成，再除以接着做的人的工作效率', level: 3,
    gen(r) {
      const c = relayCtx(r);
      if (r.bool()) {
        const { a, b, t } = r.until(() => ({ a: r.pick(NICE_T), b: r.pick(NICE_T), t: r.int(1, 8) }), ({ a, b, t }) => a !== b && t < a && (b * (a - t)) % a === 0 && t * 4 >= a / 2);
        const done = simplify(t, a), left = simplify(a - t, a), days = (b * (a - t)) / a;
        return {
          q: `${c.s(a, b)}${c.first(t)}，${c.rest}，${c.ask}？`,
          answer: [num(days, { unit: c.u })],
          steps: ['把工作总量看作单位“1”', `${c.x}每${c.u}完成 ${frac(1, a)}，${t} ${c.u}完成 ${frac(1, a)} × ${t} = ${F(done)}`, `还剩：1 - ${F(done)} = ${F(left)}`, `${c.y}每${c.u}完成 ${frac(1, b)}，还要：${F(left)} ÷ ${frac(1, b)} = ${days}（${c.u}）`],
          hint: `${c.x}已经完成了几分之几？`,
        };
      }
      const { a, b, t } = r.until(() => ({ a: r.pick(NICE_T), b: r.pick(NICE_T), t: r.int(1, 6) }), ({ a, b, t }) => a !== b && (b * t) % a === 0 && b - t - (b * t) / a > 0 && lcm(a, b) <= 72);
      const eff = Fr.add([1, a], [1, b]), done = Fr.mul(eff, [t, 1]), left = Fr.sub([1, 1], done), days = b - t - (b * t) / a;
      return {
        q: `${c.s(a, b)}${c.both(t)}，${c.rest}，${c.ask}？`,
        answer: [num(days, { unit: c.u })],
        steps: ['把工作总量看作单位“1”', `合作的工作效率：${addLine([1, a], [1, b])}`, `合作 ${t} ${c.u}完成：${F(eff)} × ${t} = ${F(done)}，还剩 1 - ${F(done)} = ${F(left)}`, `${c.y}单独做：${F(left)} ÷ ${frac(1, b)} = ${days}（${c.u}）`],
        hint: '先算合作完成了几分之几',
      };
    },
  },
);
const PIPES = [];
for (let a = 2; a <= 20; a++) for (let b = a + 1; b <= 60; b++) if ((a * b) % (b - a) === 0 && (a * b) / (b - a) <= 30) PIPES.push([a, b]);
S.push(
  {
    id: 'g6b-work-pipe', grade: 6, term: 2, unit: '整理和复习', name: '工程问题：进水管和排水管', process: true,
    tip: '进水管的效率是“加”，排水管的效率是“减”：同时开时每小时注入 进水效率 - 排水效率', level: 3,
    gen(r) {
      const t = r.int(1, 3);
      const ok3 = ([a, b]) => { const T0 = (a * b) / (b - a); for (let h = 1; h < a; h++) if ((T0 * (a - h)) % a === 0) return true; return false; };
      const [a, b] = r.pick(t === 3 ? PIPES.filter(ok3) : PIPES), T0 = (a * b) / (b - a), eff = Fr.sub([1, a], [1, b]);
      const pre = `一个水池装有一根进水管和一根排水管。单开进水管 ${a} 小时可以把空池注满，单开排水管 ${b} 小时可以把满池水放完。`;
      if (t === 1) return {
        q: `${pre}如果两管同时打开，几小时可以把空池注满？`,
        answer: [num(T0, { unit: '小时' })],
        steps: ['把一池水看作单位“1”', `进水管每小时注入 ${frac(1, a)}，排水管每小时放出 ${frac(1, b)}`, `同时开，每小时实际注入：${addLine([1, a], [1, b], '-')}`, `注满：1 ÷ ${F(eff)} = ${T0}（小时）`],
        hint: '同时开时，一小时实际进了多少？',
      };
      if (t === 2) {
        const h = r.until(() => r.int(1, T0 - 1), (h) => h * 3 >= T0 || T0 <= 3);
        const got = Fr.mul(eff, [h, 1]);
        return {
          q: `${pre}两管同时打开 ${h} 小时后，水池里的水占水池容量的几分之几？`,
          answer: [faX(got)],
          steps: ['把一池水看作单位“1”', `同时开，每小时实际注入：${addLine([1, a], [1, b], '-')}`, `${h} 小时：${F(eff)} × ${h} = ${F(got)}`],
          hint: '每小时实际注入几分之几？',
        };
      }
      const h = r.until(() => r.int(1, a - 1), (h) => (T0 * (a - h)) % a === 0);
      const left = simplify(a - h, a), more = (T0 * (a - h)) / a;
      return {
        q: `${pre}先单开进水管 ${h} 小时，再把排水管也打开，还要几小时才能把水池注满？`,
        answer: [num(more, { unit: '小时' })],
        steps: ['把一池水看作单位“1”', `单开进水管 ${h} 小时注入 ${frac(1, a)} × ${h} = ${F(simplify(h, a))}，还差 ${F(left)}`, `两管同开每小时实际注入：${addLine([1, a], [1, b], '-')}`, `还要：${F(left)} ÷ ${F(eff)} = ${more}（小时）`],
        hint: '先算还差几分之几',
      };
    },
  },
);
function travelCtx(r) {
  const [n1, n2] = r.names(2);
  return r.pick([
    { u: '千米', tu: '小时', vu: '千米/时', vs: [40, 45, 50, 55, 60, 65, 70, 75, 80, 90], A: '客车', B: '货车', pl: ['甲、乙两地', '两城'], go: '开出', who: '两车' },
    { u: '米', tu: '分钟', vu: '米/分', vs: [50, 55, 60, 65, 70, 75, 80, 85, 90], A: n1, B: n2, pl: ['两家', '学校和公园'], go: '出发', who: '两人' },
    { u: '千米', tu: '小时', vu: '千米/时', vs: [12, 13, 14, 15, 16, 18, 20], A: '甲', B: '乙', pl: ['东、西两村'], go: '骑车出发', who: '两人' },
  ]);
}
S.push(
  {
    id: 'g6b-travel-meet', grade: 6, term: 2, unit: '整理和复习', name: '行程问题：相遇', process: true,
    tip: '相向而行：速度和 × 相遇时间 = 路程（两地距离）', level: 3,
    gen(r) {
      const c = travelCtx(r), pl = r.pick(c.pl), t = r.int(1, 4);
      const [v1, v2] = r.sample(c.vs, 2).sort((x, y) => y - x), h = r.int(2, 6), S0 = (v1 + v2) * h;
      const speeds = `${c.A}的速度是 ${v1} ${c.vu}，${c.B}的速度是 ${v2} ${c.vu}`;
      if (t === 1) return {
        q: `${c.A}、${c.B}同时从${pl}相对${c.go}，${speeds}。${pl}相距 ${S0} ${c.u}，经过多少${c.tu}${c.who}相遇？`,
        answer: [num(h, { unit: c.tu })],
        steps: [`相向而行，每${c.tu}一共走：${v1} + ${v2} = ${v1 + v2}（${c.u}）`, `相遇时间 = 路程 ÷ 速度和：${S0} ÷ ${v1 + v2} = ${h}（${c.tu}）`],
        hint: '两人每分钟（每小时）一共走多少？',
      };
      if (t === 2) {
        const d = (v1 - v2) * h;
        return {
          q: `${c.A}、${c.B}同时从${pl}相对${c.go}，${speeds}，相遇时${c.A}比${c.B}多走了 ${d} ${c.u}。${pl}相距多少${c.u}？`,
          answer: [num(S0, { unit: c.u })],
          steps: [`每${c.tu}${c.A}比${c.B}多走 ${v1} - ${v2} = ${v1 - v2}（${c.u}）`, `多走 ${d} ${c.u}，说明走了 ${d} ÷ ${v1 - v2} = ${h}（${c.tu}）才相遇`, `${pl}相距：(${v1} + ${v2}) × ${h} = ${S0}（${c.u}）`],
          hint: '多走的路程是怎么来的？',
        };
      }
      if (t === 3) return {
        q: `${c.A}、${c.B}同时从${pl}相对${c.go}，经过 ${h} ${c.tu}相遇。${pl}相距 ${S0} ${c.u}，${c.A}的速度是 ${v1} ${c.vu}，${c.B}的速度是多少？`,
        answer: [num(v2, { unit: c.vu })],
        steps: [`速度和：${S0} ÷ ${h} = ${v1 + v2}（${c.vu}）`, `${c.B}的速度：${v1 + v2} - ${v1} = ${v2}（${c.vu}）`, `也可以列方程：(${v1} + x) × ${h} = ${S0}`],
        hint: '先求速度和',
      };
      const h2 = r.int(1, h - 1), rest = (v1 + v2) * (h - h2);
      return {
        q: `${c.A}、${c.B}同时从${pl}相对${c.go}，${speeds}。${h2} ${c.tu}后${c.who}还相距 ${rest} ${c.u}。${pl}相距多少${c.u}？`,
        answer: [num(S0, { unit: c.u })],
        steps: [`${h2} ${c.tu}一共走了：(${v1} + ${v2}) × ${h2} = ${(v1 + v2) * h2}（${c.u}）`, `再加上还相距的：${(v1 + v2) * h2} + ${rest} = ${S0}（${c.u}）`],
        hint: '全程 = 已经走的 + 还没走的',
      };
    },
  },
  {
    id: 'g6b-travel-meet-ratio', grade: 6, term: 2, unit: '整理和复习', name: '行程中的比和分数', process: true,
    tip: '时间相同时，路程比 = 速度比；相遇时两人走的路程合起来是全程', level: 3,
    gen(r) {
      const t = r.int(1, 4), [A, B] = r.pick([['客车', '货车'], ['快车', '慢车']]);
      if (t <= 2) {
        const [m, n] = r.until(() => [r.int(2, 9), r.int(1, 8)], ([m, n]) => m > n && gcd(m, n) === 1), k = r.int(4, 30), S0 = (m + n) * k;
        const diff = (m - n) * k;
        const q = t === 1
          ? `${A}和${B}同时从甲、乙两地相对开出，${A}和${B}的速度比是 ${m} : ${n}，相遇时${A}比${B}多行了 ${diff} 千米。甲、乙两地相距多少千米？`
          : `${A}和${B}同时从甲、乙两地相对开出，速度比是 ${m} : ${n}，相遇地点离两地中点 ${diff / 2} 千米。甲、乙两地相距多少千米？`;
        if (t === 2 && diff % 2) return this.gen(r);
        return {
          q, answer: [num(S0, { unit: '千米' })],
          steps: [`时间相同，路程比 = 速度比 = ${m} : ${n}，把全程看作 ${m + n} 份`, ...(t === 2 ? [`相遇点离中点 ${diff / 2} 千米，${A}比${B}多行 ${diff / 2} × 2 = ${diff}（千米）`] : []), `${A}比${B}多行 ${m} - ${n} = ${m - n} 份，对应 ${diff} 千米`, `全程：${diff} ÷ ${fs(m - n, m + n)} = ${S0}（千米）`],
          hint: t === 2 ? '离中点的距离和“多行的路程”是什么关系？' : '多行的路程占全程的几分之几？',
        };
      }
      const [a, b] = r.pick(WORK_PAIRS.filter(([a, b]) => b <= 30)), h = (a * b) / (a + b);
      if (t === 3) return {
        q: `${A}从甲地开往乙地要 ${a} 小时，${B}从乙地开往甲地要 ${b} 小时。两车同时从两地相对开出，几小时后相遇？`,
        answer: [num(h, { unit: '小时' })],
        steps: ['路程不知道，把全程看作单位“1”', `${A}每小时行全程的 ${frac(1, a)}，${B}每小时行全程的 ${frac(1, b)}`, `速度和：${addLine([1, a], [1, b])}`, `相遇时间：1 ÷ ${F(Fr.add([1, a], [1, b]))} = ${h}（小时）`],
        hint: '每小时各行全程的几分之几？',
      };
      return {
        q: `${A}从甲地开往乙地要 ${a} 小时，${B}从乙地开往甲地要 ${b} 小时。两车同时从两地相对开出，相遇时${A}行了全程的几分之几？`,
        answer: [fa(b, a + b)],
        steps: [`同样的路程，时间比是 ${a} : ${b}，速度比就是 ${b} : ${a}`, `同时出发到相遇，时间相同，路程比 = 速度比 = ${b} : ${a}`, `${A}行了全程的 ${b} ÷ (${b} + ${a}) = ${fs(b, a + b)}`],
        hint: '行完全程用的时间越少，速度越快',
      };
    },
  },
  {
    id: 'g6b-travel-chase', grade: 6, term: 2, unit: '整理和复习', name: '行程问题：追及', process: true,
    tip: '同向而行：追及时间 = 相差的路程 ÷ 速度差', level: 3,
    gen(r) {
      const [n1, n2] = r.names(2), t = r.int(1, 3);
      const c = r.pick([
        { A: n1, B: n2, u: '米', tu: '分钟', vu: '米/分', vs: [50, 55, 60, 65, 70, 75, 80, 90, 100, 120, 150] },
        { A: '货车', B: '客车', u: '千米', tu: '小时', vu: '千米/时', vs: [40, 45, 50, 60, 70, 75, 80, 90, 100] },
      ]);
      const { v1, v2, t0, h } = r.until(() => { const [v1, v2] = r.sample(c.vs, 2).sort((x, y) => x - y); const t0 = r.int(1, 10); return { v1, v2, t0, h: (v1 * t0) / (v2 - v1) }; }, (o) => Number.isInteger(o.h) && o.h >= 2 && o.h <= 15);
      const d = v1 * t0;
      if (t === 1) return {
        q: `${c.A}从家出发去博物馆，速度是 ${v1} ${c.vu}。${t0} ${c.tu}后，${c.B}从同一地点出发沿同一条路去追，速度是 ${v2} ${c.vu}。${c.B}出发后几${c.tu}能追上${c.A}？`.replace(c.A === '货车' ? '从家出发去博物馆' : '@@', '从甲地开往乙地').replace(c.B === '客车' ? '从同一地点出发沿同一条路去追' : '@@', '也从甲地开出去追'),
        answer: [num(h, { unit: c.tu })],
        steps: [`${c.B}出发时，${c.A}已经走了：${v1} × ${t0} = ${d}（${c.u}）`, `每${c.tu}${c.B}比${c.A}多走：${v2} - ${v1} = ${v2 - v1}（${c.u}）`, `追及时间 = 路程差 ÷ 速度差：${d} ÷ ${v2 - v1} = ${h}（${c.tu}）`],
        hint: '先求两者一开始相差多远',
      };
      if (t === 2) return {
        q: `${c.A}在${c.B}前面 ${d} ${c.u}处，两${c.u === '米' ? '人' : '车'}同时同向出发，${c.A}的速度是 ${v1} ${c.vu}，${c.B}的速度是 ${v2} ${c.vu}。几${c.tu}后${c.B}追上${c.A}？`,
        answer: [num(h, { unit: c.tu })],
        steps: [`速度差：${v2} - ${v1} = ${v2 - v1}（${c.vu}）`, `追及时间：${d} ÷ ${v2 - v1} = ${h}（${c.tu}）`],
        hint: '每过一个单位时间，距离缩短多少？',
      };
      return {
        q: `${c.A}先出发，速度是 ${v1} ${c.vu}。${t0} ${c.tu}后${c.B}从同一地点出发同向追赶，速度是 ${v2} ${c.vu}。追上时离出发点多少${c.u}？`,
        answer: [num(v2 * h, { unit: c.u })],
        steps: [`${c.A}先走了：${v1} × ${t0} = ${d}（${c.u}）`, `追及时间：${d} ÷ (${v2} - ${v1}) = ${h}（${c.tu}）`, `离出发点：${v2} × ${h} = ${v2 * h}（${c.u}）`, `检验：${c.A}一共走了 ${v1} × (${t0} + ${h}) = ${v1 * (t0 + h)}（${c.u}）✓`],
        hint: '先求追了多久',
      };
    },
  },
  {
    id: 'g6b-travel-circle', grade: 6, term: 2, unit: '整理和复习', name: '行程问题：环形跑道', process: true,
    tip: '同地反向：每相遇一次，两人合走一圈；同地同向：快的每追上一次，比慢的多跑一圈', level: 3,
    gen(r) {
      const [n1, n2] = r.names(2), t = r.int(1, 3);
      const c = r.pick([
        { Ls: [300, 400], vs: [150, 160, 180, 200, 220, 240, 250], s: (L) => `学校环形跑道一圈长 ${L} 米。`, act: '跑', back: '背向而跑', same: '同向而跑' },
        { Ls: [1200, 1500, 1800, 2000, 2400, 3000], vs: [60, 65, 70, 75, 80, 90, 100, 120], s: (L) => `公园里环湖小路一圈长 ${L} 米。`, act: '走', back: '沿相反方向走', same: '沿同一方向走' },
        { Ls: [3000, 3600, 4000, 4800, 6000], vs: [150, 180, 200, 240, 250, 300], s: (L) => `一条环形自行车道一圈长 ${L} 米。`, act: '骑', back: '沿相反方向骑', same: '沿同一方向骑' },
      ]);
      const { L, vf, vs, n, h } = r.until(() => {
        const L = r.pick(c.Ls), [vs, vf] = r.sample(c.vs, 2).sort((x, y) => x - y), n = t === 3 ? r.int(2, 4) : 1;
        return { L, vf, vs, n, h: fix(t === 2 ? L / (vf - vs) : (n * L) / (vf + vs)) };
      }, (o) => dp(o.h) <= 1 && o.h >= 1 && o.h <= 40);
      const pre = `${c.s(L)}${n1}和${n2}同时从同一地点出发，${n1}每分钟${c.act} ${vf} 米，${n2}每分钟${c.act} ${vs} 米。`;
      if (t === 1) return {
        q: `${pre}两人${c.back}，几分钟后第一次相遇？`,
        answer: [num(h, { unit: '分钟' })],
        steps: [`${c.back}，第一次相遇时两人合起来正好${c.act}了一圈`, `${L} ÷ (${vf} + ${vs}) = ${L} ÷ ${vf + vs} = ${fmt(h)}（分钟）`],
        hint: '第一次相遇时，两人一共走了多少米？',
      };
      if (t === 2) return {
        q: `${pre}两人${c.same}，几分钟后${n1}第一次追上${n2}？`,
        answer: [num(h, { unit: '分钟' })],
        steps: [`${c.same}，${n1}第一次追上${n2}时，正好比${n2}多${c.act}了一圈`, `每分钟多${c.act}：${vf} - ${vs} = ${vf - vs}（米）`, `${L} ÷ ${vf - vs} = ${fmt(h)}（分钟）`],
        hint: '追上时，快的比慢的多走了多少？',
      };
      return {
        q: `${pre}两人${c.back}，到第 ${n} 次相遇时，一共用了多少分钟？`,
        answer: [num(h, { unit: '分钟' })],
        steps: [`每相遇一次，两人合起来${c.act}一圈；第 ${n} 次相遇时合起来${c.act}了 ${n} 圈：${L} × ${n} = ${n * L}（米）`, `${n * L} ÷ (${vf} + ${vs}) = ${fmt(h)}（分钟）`],
        hint: `相遇 ${n} 次，两人合起来走了几圈？`,
      };
    },
  },
);
// 定义新运算：每种运算给出定义文字、计算函数和代入后的算式
function newOps(r) {
  const k1 = r.int(2, 5), k2 = r.until(() => r.int(2, 5), (k) => k !== k1);
  return [
    { sym: '☆', def: `a ☆ b = ${k1} × a + ${k2} × b`, f: (a, b) => k1 * a + k2 * b, sub: (a, b) => `${k1} × ${a} + ${k2} × ${b}`, ok: () => true },
    { sym: '※', def: 'a ※ b = a × b - a - b', f: (a, b) => a * b - a - b, sub: (a, b) => `${a} × ${b} - ${a} - ${b}`, ok: (a, b) => a >= 2 && b >= 2 },
    { sym: '⊙', def: 'a ⊙ b = (a + b) × (a - b)', f: (a, b) => (a + b) * (a - b), sub: (a, b) => `(${a} + ${b}) × (${a} - ${b})`, ok: (a, b) => a > b },
    { sym: '◇', def: 'a ◇ b 表示从 a 开始的 b 个连续自然数相加，例如 2 ◇ 3 = 2 + 3 + 4 = 9', f: (a, b) => b * a + (b * (b - 1)) / 2, sub: (a, b) => Array.from({ length: b }, (_, i) => a + i).join(' + '), ok: (a, b) => b >= 2 && b <= 6 && !(a === 2 && b === 3) },
    { sym: '△', def: 'a △ b = a × b ÷ (a + b)', f: (a, b) => (a * b) / (a + b), sub: (a, b) => `${a} × ${b} ÷ (${a} + ${b})`, ok: (a, b) => a !== b, frac: true },
    { sym: '▲', def: `a ▲ b = a × a - ${k2} × b`, f: (a, b) => a * a - k2 * b, sub: (a, b) => `${a} × ${a} - ${k2} × ${b}`, ok: (a, b) => a * a > k2 * b },
  ];
}
S.push(
  {
    id: 'g6b-newop-eval', grade: 6, term: 2, unit: '整理和复习', name: '定义新运算：按规定计算', process: true,
    tip: '新运算的符号只是一个“规定”：把数字按位置代入 a 和 b，再按普通的运算顺序计算', level: 3,
    gen(r) {
      const ops = newOps(r), op = r.pick(ops);
      const nest = !op.frac && op.sym !== '◇' && r.chance(0.35);
      if (!nest) {
        const [a, b] = r.until(() => [r.int(2, 12), r.int(1, 9)], ([a, b]) => op.ok(a, b));
        const v = op.f(a, b), ans = op.frac ? fa(a * b, a + b) : num(v);
        return {
          q: `规定：${op.def}。\n那么 ${a} ${op.sym} ${b} = {0}`,
          answer: [ans],
          steps: [`把 a 换成 ${a}，b 换成 ${b}`, `${a} ${op.sym} ${b} = ${op.sub(a, b)} = ${op.frac ? fs(a * b, a + b) : v}`, '易错：a、b 的位置不能交换'],
          hint: '照着规定，把数字代进去',
        };
      }
      const o = r.until(() => { const a = r.int(2, 9), b = r.int(1, 6), c = r.int(1, 6); return { a, b, c, m: op.f(a, b) }; }, (o) => op.ok(o.a, o.b) && op.ok(o.m, o.c) && op.f(o.m, o.c) <= 999 && op.f(o.m, o.c) > 0);
      const { a, b, c, m } = o, v = op.f(m, c);
      return {
        q: `规定：${op.def}。\n那么 (${a} ${op.sym} ${b}) ${op.sym} ${c} = {0}`,
        answer: [num(v)],
        steps: ['先算括号里的', `${a} ${op.sym} ${b} = ${op.sub(a, b)} = ${m}`, `再算 ${m} ${op.sym} ${c} = ${op.sub(m, c)} = ${v}`],
        hint: '先算括号里的，得数再当作新的 a',
      };
    },
  },
  {
    id: 'g6b-newop-solve', grade: 6, term: 2, unit: '整理和复习', name: '定义新运算：求未知数', process: true,
    tip: '先按规定把式子写成含 x 的普通算式，再解方程', level: 3,
    gen(r) {
      const t = r.int(1, 3);
      if (t === 1) {
        const k1 = r.int(2, 6), k2 = r.until(() => r.int(2, 6), (k) => k !== k1), minus = r.bool(), x = r.int(2, 15), B = r.int(1, 9), left = r.bool();
        const sg = minus ? '-' : '+', f = (a, b) => (minus ? k1 * a - k2 * b : k1 * a + k2 * b);
        const R0 = left ? f(x, B) : f(B, x);
        if (R0 <= 0) return this.gen(r);
        const eq = left ? `${k1}x ${sg} ${k2 * B} = ${R0}` : `${k1 * B} ${sg} ${k2}x = ${R0}`;
        const sol = left ? `${k1}x = ${minus ? R0 + k2 * B : R0 - k2 * B}，x = ${x}` : minus ? `${k2}x = ${k1 * B - R0}，x = ${x}` : `${k2}x = ${R0 - k1 * B}，x = ${x}`;
        return {
          q: `规定：a ☆ b = ${k1} × a ${sg} ${k2} × b。如果 ${left ? `x ☆ ${B}` : `${B} ☆ x`} = ${R0}，那么 x = {0}`,
          answer: [num(x)],
          steps: [`按规定写出来：${left ? `${k1} × x ${sg} ${k2} × ${B}` : `${k1} × ${B} ${sg} ${k2} × x`} = ${R0}`, eq, sol],
          hint: 'x 在 a 的位置还是 b 的位置？',
        };
      }
      if (t === 2) {
        const n = r.int(3, 6), x = r.int(2, 20), add = (n * (n - 1)) / 2, R0 = n * x + add;
        return {
          q: `规定：a ◇ b 表示从 a 开始的 b 个连续自然数相加，例如 2 ◇ 3 = 2 + 3 + 4 = 9。如果 x ◇ ${n} = ${R0}，那么 x = {0}`,
          answer: [num(x)],
          steps: [`x ◇ ${n} = ${Array.from({ length: n }, (_, i) => (i ? `(x + ${i})` : 'x')).join(' + ')}`, `= ${n}x + ${add}`, `${n}x + ${add} = ${R0}，${n}x = ${R0 - add}，x = ${x}`, `也可以想：${n} 个连续自然数的平均数是中间的数，${R0} ÷ ${n} = ${fmt(fix(R0 / n))}`],
          hint: '把 b 个数都用 x 表示出来',
        };
      }
      const A = r.int(2, 9), x = r.int(2, 12), R0 = A * x + A;
      return {
        q: `规定：a ※ b = a × b + a。如果 ${A} ※ x = ${R0}，那么 x = {0}`,
        answer: [num(x)],
        steps: [`按规定：${A} ※ x = ${A} × x + ${A}`, `${A}x + ${A} = ${R0}`, `${A}x = ${R0 - A}，x = ${x}`],
        hint: '先写成方程',
      };
    },
  },
);

// ---------- 阴影面积配图 ----------
/** 正方形 + 以左下角为圆心、边长为半径的四分之一圆；kind：'out' 正方形去掉四分之一圆，'bow' 弓形 */
function quarterFig(kind, label) {
  const x0 = 45, y0 = 15, s = 170;
  const BL = [x0, y0 + s], TL = [x0, y0], BR = [x0 + s, y0 + s];
  const sector = `M${BL[0]},${BL[1]} L${TL[0]},${TL[1]} A${s},${s} 0 0,1 ${BR[0]},${BR[1]} Z`;
  let g = '';
  if (kind === 'out') {
    g += `<rect x="${x0}" y="${y0}" width="${s}" height="${s}" fill="${C.fill2}"/>` + `<path d="${sector}" fill="#fff"/>`;
  } else {
    g += `<path d="${sector}" fill="${C.fill2}"/>` + `<polygon points="${BL.join(',')} ${TL.join(',')} ${BR.join(',')}" fill="#fff" stroke="${C.line}" stroke-width="2"/>`;
  }
  g += `<path d="M${TL[0]},${TL[1]} A${s},${s} 0 0,1 ${BR[0]},${BR[1]}" fill="none" stroke="${C.line}" stroke-width="2.5"/>`;
  g += `<rect x="${x0}" y="${y0}" width="${s}" height="${s}" fill="none" stroke="${C.line}" stroke-width="3"/>`;
  g += `<circle cx="${BL[0]}" cy="${BL[1]}" r="3" fill="${C.line}"/>` + T(x0 + s / 2, y0 + s + 18, label, { size: 15, weight: 'bold' });
  return fig.raw(260, 215, g);
}
/** 正方形里两个四分之一圆相交成的“叶子” */
function leafFig(label) {
  const x0 = 45, y0 = 15, s = 170, TL = [x0, y0], BR = [x0 + s, y0 + s];
  let g = `<path d="M${TL.join(',')} A${s},${s} 0 0,1 ${BR.join(',')} A${s},${s} 0 0,1 ${TL.join(',')} Z" fill="${C.fill2}" stroke="${C.line}" stroke-width="2.5"/>`;
  g += `<rect x="${x0}" y="${y0}" width="${s}" height="${s}" fill="none" stroke="${C.line}" stroke-width="3"/>`;
  g += `<circle cx="${x0}" cy="${y0 + s}" r="3" fill="${C.line}"/><circle cx="${x0 + s}" cy="${y0}" r="3" fill="${C.line}"/>`;
  g += T(x0 + s / 2, y0 + s + 18, label, { size: 15, weight: 'bold' });
  return fig.raw(260, 215, g);
}
/** 两个正方形并排（大左小右），tri 为阴影三角形三个顶点的字母 */
function twoSquaresFig(a, b, tri) {
  const u = Math.min(16, 230 / (a + b)), x0 = 30, y0 = 25 + a * u;
  const P = { A: [x0, y0 - a * u], B: [x0, y0], C: [x0 + a * u, y0], D: [x0 + a * u, y0 - a * u], E: [x0 + (a + b) * u, y0], F: [x0 + (a + b) * u, y0 - b * u], G: [x0 + a * u, y0 - b * u] };
  const pt = (k) => P[k].map((v) => v.toFixed(1)).join(',');
  let g = `<polygon points="${tri.map(pt).join(' ')}" fill="${C.fill2}" stroke="${C.acc}" stroke-width="2.5"/>`;
  g += `<rect x="${x0}" y="${(y0 - a * u).toFixed(1)}" width="${(a * u).toFixed(1)}" height="${(a * u).toFixed(1)}" fill="none" stroke="${C.line}" stroke-width="2.5"/>`;
  g += `<rect x="${(x0 + a * u).toFixed(1)}" y="${(y0 - b * u).toFixed(1)}" width="${(b * u).toFixed(1)}" height="${(b * u).toFixed(1)}" fill="none" stroke="${C.line}" stroke-width="2.5"/>`;
  const off = { A: [-10, -8], B: [-10, 10], C: [0, 14], D: [4, -10], E: [10, 10], F: [10, -6], G: [-10, -8] };
  for (const k of Object.keys(P)) g += T(P[k][0] + off[k][0], P[k][1] + off[k][1], k, { size: 13, weight: 'bold', color: C.dash });
  g += T(x0 + (a * u) / 2, y0 + 30, `${a} 厘米`, { size: 14, weight: 'bold' }) + T(x0 + (a + b / 2) * u, y0 + 30, `${b} 厘米`, { size: 14, weight: 'bold' });
  return fig.raw(Math.ceil(x0 + (a + b) * u + 30), Math.ceil(y0 + 45), g);
}
const SIDES = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 30];
const LEN_U = ['厘米', '厘米', '分米', '米'];
S.push(
  {
    id: 'g6b-shade-quarter', grade: 6, term: 2, unit: '整理和复习', name: '阴影面积：正方形和四分之一圆', process: true,
    tip: '阴影部分不是基本图形时，用“大图形 - 小图形”：正方形、四分之一圆、三角形的面积组合着减', level: 3,
    gen(r) {
      const a = r.pick(SIDES), kind = r.pick(['out', 'out', 'bow', 'perim']), u = r.pick(LEN_U);
      const sq = a * a, q4 = fix(0.785 * sq), tri = fix(sq / 2);
      if (kind === 'out') return {
        q: '如图，正方形的边长是 ' + a + ' ' + u + '，以它的一个顶点为圆心、边长为半径画了四分之一圆。阴影部分的面积是多少平方' + u + '？',
        fig: quarterFig('out', `${a} ${u}`),
        answer: [num(fix(sq - q4), { unit: '平方' + u })],
        steps: ['阴影 = 正方形面积 - 四分之一圆面积', `正方形：${a} × ${a} = ${sq}（平方${u}）`, `四分之一圆：3.14 × ${a} × ${a} ÷ 4 = ${fmt(q4)}（平方${u}）`, `阴影：${sq} - ${fmt(q4)} = ${fmt(fix(sq - q4))}（平方${u}）`],
        hint: '阴影 = 正方形 - 四分之一圆',
      };
      if (kind === 'bow') return {
        q: '如图，正方形的边长是 ' + a + ' ' + u + '，以它的一个顶点为圆心、边长为半径画了四分之一圆。阴影部分（弓形）的面积是多少平方' + u + '？',
        fig: quarterFig('bow', `${a} ${u}`),
        answer: [num(fix(q4 - tri), { unit: '平方' + u })],
        steps: ['阴影 = 四分之一圆面积 - 三角形面积', `四分之一圆：3.14 × ${a} × ${a} ÷ 4 = ${fmt(q4)}（平方${u}）`, `三角形：${a} × ${a} ÷ 2 = ${fmt(tri)}（平方${u}）`, `阴影：${fmt(q4)} - ${fmt(tri)} = ${fmt(fix(q4 - tri))}（平方${u}）`],
        hint: '弓形 = 扇形 - 三角形',
      };
      const arc = fix((2 * PI * a) / 4), per = fix(2 * a + arc);
      return {
        q: '如图，正方形的边长是 ' + a + ' ' + u + '，以它的一个顶点为圆心、边长为半径画了四分之一圆。阴影部分的周长是多少' + u + '？',
        fig: quarterFig('out', `${a} ${u}`),
        answer: [num(per, { unit: u })],
        steps: ['阴影的边：正方形的两条边 + 一段四分之一圆弧', `弧长：2 × 3.14 × ${a} ÷ 4 = ${fmt(arc)}（${u}）`, `周长：${a} × 2 + ${fmt(arc)} = ${fmt(per)}（${u}）`, '易错：靠圆心的两条边不是阴影的边，不要算进去'],
        hint: '沿着阴影的边描一圈',
      };
    },
  },
  {
    id: 'g6b-shade-leaf', grade: 6, term: 2, unit: '整理和复习', name: '阴影面积：正方形里的“叶子”', process: true,
    tip: '两个四分之一圆重叠的部分 = 两个四分之一圆的面积和 - 正方形面积', level: 3,
    gen(r) {
      const a = r.pick(SIDES), sq = a * a, q4 = fix(0.785 * sq), leaf = fix(2 * q4 - sq), u = r.pick(LEN_U), t = r.int(1, 3);
      if (t === 3) return {
        q: `如图，正方形的边长是 ${a} ${u}，分别以两个相对的顶点为圆心、边长为半径画了两个四分之一圆。正方形里空白部分的面积是多少平方${u}？`,
        fig: leafFig(`${a} ${u}`),
        answer: [num(fix(sq - leaf), { unit: '平方' + u })],
        steps: ['空白部分是两个角上的部分，每一块 = 正方形 - 一个四分之一圆', `一个四分之一圆：3.14 × ${a} × ${a} ÷ 4 = ${fmt(q4)}（平方${u}），一块空白：${sq} - ${fmt(q4)} = ${fmt(fix(sq - q4))}（平方${u}）`, `两块空白：${fmt(fix(sq - q4))} × 2 = ${fmt(fix(sq - leaf))}（平方${u}）`],
        hint: '空白部分是哪两块？',
      };
      if (t === 1) return {
        q: `如图，正方形的边长是 ${a} ${u}，分别以两个相对的顶点为圆心、边长为半径画了两个四分之一圆。阴影部分的面积是多少平方${u}？`,
        fig: leafFig(`${a} ${u}`),
        answer: [num(leaf, { unit: '平方' + u })],
        steps: ['两个四分之一圆合起来，比正方形多出来的正好是重叠的阴影（阴影被算了两次）', `一个四分之一圆：3.14 × ${a} × ${a} ÷ 4 = ${fmt(q4)}（平方${u}）`, `阴影：${fmt(q4)} × 2 - ${a} × ${a} = ${fmt(fix(2 * q4))} - ${sq} = ${fmt(leaf)}（平方${u}）`, `也可以：阴影 = 2 个弓形，每个弓形 ${fmt(q4)} - ${fmt(sq / 2)} = ${fmt(fix(q4 - sq / 2))}`],
        hint: '两个四分之一圆面积加起来，和正方形比多了什么？',
      };
      const arc = fix((2 * PI * a) / 4);
      return {
        q: `如图，正方形的边长是 ${a} ${u}，分别以两个相对的顶点为圆心、边长为半径画了两个四分之一圆。阴影部分的周长是多少${u}？`,
        fig: leafFig(`${a} ${u}`),
        answer: [num(fix(2 * arc), { unit: u })],
        steps: ['阴影的周长是两段四分之一圆弧', `一段弧：2 × 3.14 × ${a} ÷ 4 = ${fmt(arc)}（${u}）`, `周长：${fmt(arc)} × 2 = ${fmt(fix(2 * arc))}（${u}），也就是半径 ${a} ${u}的圆周长的一半`],
        hint: '阴影由哪几段线围成？',
      };
    },
  },
  {
    id: 'g6b-shade-squares', grade: 6, term: 2, unit: '整理和复习', name: '阴影面积：两个正方形拼在一起', process: true,
    tip: '把阴影三角形放进大图形里：阴影 = 整个图形 - 周围的空白三角形；算完会发现结果只和一个正方形有关', level: 3,
    gen(r) {
      const a = r.int(6, 12), b = r.int(3, a - 2), big = r.bool();
      if (big) {
        const S1 = a * a + b * b + ((a - b) * b) / 2, ABD = (a * a) / 2, BEF = ((a + b) * b) / 2, ans = fix((a * a) / 2);
        return {
          q: `如图，大正方形 ABCD 的边长是 ${a} 厘米，小正方形 CEFG 的边长是 ${b} 厘米，两个正方形并排放在一起。三角形 BDF（阴影部分）的面积是多少平方厘米？`,
          fig: twoSquaresFig(a, b, ['B', 'D', 'F']),
          answer: [num(ans, { unit: '平方厘米' })],
          steps: [`把右上角的三角形 DGF 补上，整个图形 ABEFD 的面积：${a} × ${a} + ${b} × ${b} + (${a} - ${b}) × ${b} ÷ 2 = ${fmt(S1)}（平方厘米）`, `减去空白的三角形 ABD：${a} × ${a} ÷ 2 = ${fmt(ABD)}，三角形 BEF：(${a} + ${b}) × ${b} ÷ 2 = ${fmt(BEF)}`, `阴影：${fmt(S1)} - ${fmt(ABD)} - ${fmt(BEF)} = ${fmt(ans)}（平方厘米）`, `巧解：BD 和 CF 都是正方形的对角线，互相平行，所以三角形 BDF 和三角形 BDC 同底等高，面积就是大正方形的一半：${a} × ${a} ÷ 2 = ${fmt(ans)}`],
          hint: '整个图形减去空白的部分',
        };
      }
      const ABE = (a * (a + b)) / 2, ADG = (a * (a - b)) / 2, GFE = (b * b) / 2, ans = fix((b * b) / 2);
      return {
        q: `如图，大正方形 ABCD 的边长是 ${a} 厘米，小正方形 CEFG 的边长是 ${b} 厘米，两个正方形并排放在一起。三角形 AGE（阴影部分）的面积是多少平方厘米？`,
        fig: twoSquaresFig(a, b, ['A', 'G', 'E']),
        answer: [num(ans, { unit: '平方厘米' })],
        steps: [`两个正方形的面积和：${a} × ${a} + ${b} × ${b} = ${a * a + b * b}（平方厘米）`, `减去三块空白三角形：ABE：${a} × (${a} + ${b}) ÷ 2 = ${fmt(ABE)}，ADG：${a} × (${a} - ${b}) ÷ 2 = ${fmt(ADG)}，GFE：${b} × ${b} ÷ 2 = ${fmt(GFE)}`, `阴影：${a * a + b * b} - ${fmt(ABE)} - ${fmt(ADG)} - ${fmt(GFE)} = ${fmt(ans)}（平方厘米）`, `巧解：AC 和 GE 都是对角线，互相平行，三角形 AGE 和三角形 CGE 同底等高，面积是小正方形的一半：${b} × ${b} ÷ 2 = ${fmt(ans)}`],
        hint: '整个图形减去空白的部分',
      };
    },
  },
);
