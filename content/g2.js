// 二年级题库：上册 term 1、下册 term 2。单元名用人教版叫法，题型覆盖人教版 / 北京版 / 北师大版二年级常考内容。
import { fig, fmt, fix, vAdd, vSub, vDiv, readInt } from '../js/lib.js';
import * as PZ from './puzzle.js';

// ================= 局部工具 =================
const num = (value, o = {}) => ({ kind: 'num', value: fix(value), ...o });
const pick = (options, value, o = {}) => ({ kind: 'choice', options, value, ...o });
const CMP = ['>', '<', '='];
const TF = ['√', '×'];
const sign = (a, b) => (a > b ? '>' : a < b ? '<' : '=');
const C = fig.colors, T = fig.text;
const CN = '零一二三四五六七八九';
/** 口诀里的积：10 → 一十，18 → 十八，36 → 三十六 */
const cnP = (p) => (p < 10 ? CN[p] : p === 10 ? '一十' : p < 20 ? '十' + CN[p % 10] : CN[Math.floor(p / 10)] + '十' + (p % 10 ? CN[p % 10] : ''));
/** 乘法口诀：kj(6, 3) → 三六十八（小数在前） */
const kj = (a, b) => { const [x, y] = a <= b ? [a, b] : [b, a]; const p = x * y; return CN[x] + CN[y] + (p < 10 ? '得' + CN[p] : cnP(p)); };
const t10 = (n) => Math.floor(n / 10), o1 = (n) => n % 10;
const hm = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
const EMO = ['🍎', '🍐', '🍊', '🍓', '🍌', '🌸', '⭐', '🎈', '🐟', '🍬', '🚗', '🐥'];

/** 两位数（或一位数）加法逐位讲解 */
function addCols(a, b) {
  const s1 = o1(a) + o1(b), c = s1 >= 10 ? 1 : 0, s10 = t10(a) + t10(b) + c;
  const parts = [t10(a), t10(b)].filter((x) => x > 0).map(String);
  const one = c ? `个位：${o1(a)} + ${o1(b)} = ${s1}，满十了，写 ${s1 - 10}，向十位进 1` : `个位：${o1(a)} + ${o1(b)} = ${s1}，写 ${s1}`;
  let ten;
  if (!c && parts.length === 1) ten = `十位：直接落下 ${s10}`;
  else if (!parts.length) ten = '十位：写上进上来的 1';
  else ten = `十位：${[...parts, ...(c ? ['进上来的 1'] : [])].join(' + ')} = ${s10}，写 ${s10}`;
  return [one, ten];
}
/** 两位数减法逐位讲解（a ≥ b） */
function subCols(a, b) {
  const A1 = o1(a), B1 = o1(b), A10 = t10(a), B10 = t10(b);
  if (A1 >= B1) {
    const d = A10 - B10;
    return [`个位：${A1} − ${B1} = ${A1 - B1}`, !B10 ? `十位：直接落下 ${A10}` : d ? `十位：${A10} − ${B10} = ${d}` : `十位：${A10} − ${B10} = 0，十位上的 0 不用写`];
  }
  const d = A10 - 1 - B10;
  return [`个位：${A1} 减 ${B1} 不够减，从十位退 1 当 10，${A1 + 10} − ${B1} = ${A1 + 10 - B1}`, !B10 ? `十位：退走 1，还剩 ${A10 - 1}` : `十位：被退走 1，还剩 ${A10 - 1}，${A10 - 1} − ${B10} = ${d}${d ? '' : '，0 不用写'}`];
}
const vOp = (a, b, op) => (op === '+' ? vAdd(a, b) : vSub(a, b));
/** 递等式：chain('36 ÷ 4 × 7', '9 × 7', '63') */
const chain = (...lines) => ({ pre: lines.map((l, i) => (i ? '= ' : '  ') + l).join('\n') });
/** 小棒摆图形：几根摆一个什么 */
const STICK = { 3: '三角形', 4: '正方形', 5: '五边形', 6: '六边形' };
const calc = (a, b, op) => (op === '+' ? a + b : a - b);

// ---------- 配图 ----------
/** 直尺：线段从 from 厘米量到 to 厘米，尺子 0~max 厘米 */
function rulerFig(from, to, max) {
  const u = 38, x0 = 26, W = x0 * 2 + max * u, ry = 56, H = ry + 58, X = (v) => x0 + v * u;
  let s = `<rect x="${x0 - 16}" y="${ry}" width="${max * u + 32}" height="52" rx="5" fill="${C.fill2}" stroke="${C.line}" stroke-width="2"/>`;
  for (let i = 0; i <= max * 2; i++) {
    const x = X(i / 2), big = i % 2 === 0;
    s += `<line x1="${x}" y1="${ry}" x2="${x}" y2="${ry + (big ? 16 : 9)}" stroke="${C.line}" stroke-width="${big ? 2 : 1.2}"/>`;
    if (big) s += T(x, ry + 30, String(i / 2), { size: 14 });
  }
  s += T(X(max) + 12, ry + 44, '厘米', { size: 11, anchor: 'end' });
  s += `<line x1="${X(from)}" y1="${ry - 22}" x2="${X(to)}" y2="${ry - 22}" stroke="${C.acc}" stroke-width="5" stroke-linecap="round"/>`;
  for (const v of [from, to]) s += `<line x1="${X(v)}" y1="${ry - 32}" x2="${X(v)}" y2="${ry}" stroke="${C.acc}" stroke-width="2" stroke-dasharray="3 3"/>`;
  return fig.raw(W, H, s);
}
/** 一条直线上的 n 个点 A、B、C… */
function pointsLineFig(n) {
  const gap = 90, W = 80 + (n - 1) * gap, y = 30;
  let s = `<line x1="40" y1="${y}" x2="${40 + (n - 1) * gap}" y2="${y}" stroke="${C.line}" stroke-width="3"/>`;
  for (let i = 0; i < n; i++) { const x = 40 + i * gap; s += `<circle cx="${x}" cy="${y}" r="5" fill="${C.line}"/>` + T(x, y + 22, 'ABCDEF'[i], { size: 15, weight: 'bold' }); }
  return fig.raw(W, 66, s);
}
/** k 边形（稍微不规则，免得只认正多边形） */
function polyFig(r, k) {
  const pts = [];
  for (let i = 0; i < k; i++) { const a = (2 * Math.PI * i) / k + 0.3 + r.int(-8, 8) / 100, rad = 1 + r.int(-12, 12) / 100; pts.push([rad * Math.cos(a), rad * Math.sin(a)]); }
  return fig.poly(pts, { W: 260, H: 200 });
}

/** 口诀填空：大的因数在 lo~hi 之间 */
function kjFill(r, lo, hi) {
  const y = r.int(lo, hi), x = r.chance(0.1) ? 1 : r.int(2, y), p = x * y, t = r.int(0, 4), full = kj(x, y);
  const mid = p < 10 ? '得' : '';
  let q, v;
  if (t <= 2) { q = `${CN[x]}${CN[y]}${mid}{0}`; v = p; }
  else if (t === 3) { q = `{0}${CN[y]}${mid}${p < 10 ? CN[p] : cnP(p)}`; v = x; }
  else { q = `${CN[x]}{0}${mid}${p < 10 ? CN[p] : cnP(p)}`; v = y; }
  return { q: `补全口诀（空里写数字）：${q}`, answer: [num(v)], steps: [`${full}：${x} × ${y} = ${p}`, `所以空里填 ${v}`], hint: '把这句口诀从头背一背' };
}
/** 表内乘法口算：一个因数在 lo~hi；hi ≤ 6 时另一个也不超过 6 */
function mulOral(r, lo, hi) {
  const a = r.int(lo, hi), b = hi <= 6 ? (r.chance(0.08) ? 1 : r.int(2, 6)) : r.int(2, 9), [x, y] = r.bool() ? [a, b] : [b, a];
  return { q: `${x} × ${y} = {0}`, answer: [num(x * y)], steps: [`想口诀：${kj(x, y)}`, `${x} × ${y} = ${x * y}`], hint: '用哪句口诀？' };
}

/** 表内除法口算：big 为真时用 7~9 的口诀，否则用 2~6 的口诀 */
function divOral(r, big) {
  const [d, q] = big ? r.until(() => [r.int(2, 9), r.int(1, 9)], ([x, y]) => Math.max(x, y) >= 7) : [r.int(2, 6), r.chance(0.08) ? 1 : r.int(2, 6)];
  const p = d * q;
  return { q: `${p} ÷ ${d} = {0}`, answer: [num(q)], steps: [`想：${d} 乘几等于 ${p}？`, `口诀「${kj(d, q)}」，所以 ${p} ÷ ${d} = ${q}`], hint: `${d} × ? = ${p}` };
}

/** 两行物品比倍数：第一行 a 个 e1，第二行 b 个 e2，第二行每 a 个圈一圈 */
function twoRowsFig(e1, a, e2, b, { group = true } = {}) {
  const sz = 28, gap = 4, gg = group ? 14 : 0, groups = Math.ceil(b / a);
  const W = 70 + b * (sz + gap) + groups * gg + 10, H = 2 * (sz + 20) + 20;
  let s = T(30, 24 + sz / 2, '第一行', { size: 13 }) + T(30, 44 + sz * 1.5 + 12, '第二行', { size: 13 });
  for (let i = 0; i < a; i++) s += T(70 + i * (sz + gap) + sz / 2, 24 + sz / 2, e1, { size: sz * 0.85 });
  for (let i = 0; i < b; i++) s += T(70 + i * (sz + gap) + Math.floor(i / a) * gg + sz / 2, 44 + sz * 1.5 + 12, e2, { size: sz * 0.85 });
  if (group) for (let g = 0; g < groups; g++) { const x = 66 + g * (a * (sz + gap) + gg); s += `<rect x="${x}" y="${44 + sz + 8}" width="${a * (sz + gap)}" height="${sz + 10}" rx="10" fill="none" stroke="${C.dash}" stroke-dasharray="5 4" stroke-width="1.6"/>`; }
  return fig.raw(Math.round(W), H, s);
}
/** 统计表：标题 + 两行（项目 / 数量） */
function tableFig(title, head, items, counts, unit) {
  const cw = 76, hw = 84, n = items.length, W = hw + cw * n + 2, rh = 40, top = 34, H = top + rh * 2 + 4;
  let s = T(W / 2, 16, title, { size: 15, weight: 'bold' });
  s += `<rect x="1" y="${top}" width="${W - 2}" height="${rh * 2}" fill="#fff" stroke="${C.line}" stroke-width="2"/>`;
  s += `<rect x="1" y="${top}" width="${W - 2}" height="${rh}" fill="${C.fill}" stroke="${C.line}" stroke-width="2"/>`;
  s += `<line x1="1" y1="${top + rh}" x2="${W - 1}" y2="${top + rh}" stroke="${C.line}" stroke-width="1.5"/>`;
  for (let i = 0; i <= n; i++) { const x = hw + i * cw; if (i < n) s += `<line x1="${x}" y1="${top}" x2="${x}" y2="${top + rh * 2}" stroke="${C.line}" stroke-width="1.5"/>`; }
  s += T(hw / 2, top + rh / 2, head, { size: 14 }) + T(hw / 2, top + rh * 1.5, `${unit}数`, { size: 14 });
  items.forEach((it, i) => { s += T(hw + i * cw + cw / 2, top + rh / 2, it, { size: 14 }) + T(hw + i * cw + cw / 2, top + rh * 1.5, String(counts[i]), { size: 16, weight: 'bold' }); });
  return fig.raw(W, H, s);
}

/** 随机几位数，低位常带 0（读数、写数的难点在 0） */
function numZ(r, len) {
  const ds = [r.int(1, 9)];
  for (let i = 1; i < len; i++) ds.push(r.chance(0.35) ? 0 : r.int(1, 9));
  return Number(ds.join(''));
}
const PL = ['个', '十', '百', '千', '万'];

/** 四宫数独：grid 4×4，hole 为要填的格 [行, 列]，blank 为空着的格 */
function sudokuFig(grid, hole, blank) {
  const c = 52, o = 10, W = c * 4 + o * 2;
  let s = `<rect x="${o}" y="${o}" width="${c * 4}" height="${c * 4}" fill="#fff" stroke="${C.line}" stroke-width="3"/>`;
  for (let i = 1; i < 4; i++) {
    const w = i === 2 ? 3 : 1.2;
    s += `<line x1="${o + i * c}" y1="${o}" x2="${o + i * c}" y2="${o + 4 * c}" stroke="${C.line}" stroke-width="${w}"/><line x1="${o}" y1="${o + i * c}" x2="${o + 4 * c}" y2="${o + i * c}" stroke="${C.line}" stroke-width="${w}"/>`;
  }
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const x = o + j * c + c / 2, y = o + i * c + c / 2 + 1;
    if (i === hole[0] && j === hole[1]) s += `<rect x="${o + j * c + 4}" y="${o + i * c + 4}" width="${c - 8}" height="${c - 8}" rx="6" fill="${C.fill2}"/>` + T(x, y, '?', { size: 24, weight: 'bold', color: C.acc });
    else if (!blank.has(i * 4 + j)) s += T(x, y, String(grid[i][j]), { size: 22, weight: 'bold' });
  }
  return fig.raw(W, W, s);
}

/** 计数器：digits 从千位到个位的珠子数 */
function abacusFig(digits) {
  const n = digits.length, gap = 64, W = n * gap + 30, base = 190, top = 30;
  const names = ['个位', '十位', '百位', '千位'].slice(0, n).reverse();
  let s = `<rect x="6" y="${base}" width="${W - 12}" height="14" rx="4" fill="${C.line}"/>`;
  digits.forEach((d, i) => {
    const x = 15 + gap / 2 + i * gap;
    s += `<line x1="${x}" y1="${top}" x2="${x}" y2="${base}" stroke="${C.dash}" stroke-width="4" stroke-linecap="round"/>`;
    for (let k = 0; k < d; k++) s += `<ellipse cx="${x}" cy="${base - 9 - k * 16}" rx="20" ry="7.5" fill="${C.acc}" stroke="${C.line}" stroke-width="1.2"/>`;
    s += T(x, base + 30, names[i], { size: 14 });
  });
  return fig.raw(W, base + 44, s);
}

/** 从同一个顶点出发的几条边（dirs 为各边方向的度数，逆时针）；arc:[起, 止] 画角的弧线 */
function raysFig(dirs, { arc = null, L = 150 } = {}) {
  const rad = (d) => (d * Math.PI) / 180, ends = dirs.map((d) => [L * Math.cos(rad(d)), L * Math.sin(rad(d))]);
  const all = [[0, 0], ...ends], pad = 28;
  const minX = Math.min(...all.map((p) => p[0])) - pad, maxX = Math.max(...all.map((p) => p[0])) + pad;
  const minY = Math.min(...all.map((p) => p[1])) - pad, maxY = Math.max(...all.map((p) => p[1])) + pad;
  const P = ([x, y]) => [(x - minX).toFixed(1), (maxY - y).toFixed(1)];
  const [ox, oy] = P([0, 0]);
  let s = '';
  if (arc) {
    const [a0, a1] = arc, rr = 30, [x1, y1] = P([rr * Math.cos(rad(a0)), rr * Math.sin(rad(a0))]), [x2, y2] = P([rr * Math.cos(rad(a1)), rr * Math.sin(rad(a1))]);
    s += `<path d="M${x1},${y1} A${rr},${rr} 0 ${a1 - a0 > 180 ? 1 : 0},0 ${x2},${y2}" fill="none" stroke="${C.acc}" stroke-width="2.5"/>`;
  }
  for (const e of ends) { const [x, y] = P(e); s += `<line x1="${ox}" y1="${oy}" x2="${x}" y2="${y}" stroke="${C.line}" stroke-width="3" stroke-linecap="round"/>`; }
  s += `<circle cx="${ox}" cy="${oy}" r="4" fill="${C.line}"/>`;
  return fig.raw(Math.round(maxX - minX), Math.round(maxY - minY), s);
}

const SKILLS = [
  // ======================= 二年级上册 =======================
  // ---------- 长度单位 ----------
  {
    id: 'g2a-len-convert', grade: 2, term: 1, unit: '长度单位', name: '米和厘米的换算',
    tip: '1 米 = 100 厘米；单位不一样，先换成一样的再算', level: 1, speed: 10,
    gen(r) {
      const t = r.int(0, 3);
      if (t === 0) { const m = r.int(1, 9); return { q: `${m} 米 = {0} 厘米`, answer: [num(m * 100)], steps: ['1 米 = 100 厘米', `${m} 米就是 ${m} 个 100 厘米，是 ${m * 100} 厘米`], hint: '1 米等于多少厘米？' }; }
      if (t === 1) { const m = r.int(1, 9); return { q: `${m * 100} 厘米 = {0} 米`, answer: [num(m)], steps: ['100 厘米 = 1 米', `${m * 100} 厘米里有 ${m} 个 100 厘米，就是 ${m} 米`], hint: '数一数有几个 100 厘米' }; }
      const c = r.step(5, 95, 5);
      if (t === 2) return { q: `1 米 − ${c} 厘米 = {0} 厘米`, answer: [num(100 - c)], steps: ['单位不一样，不能直接减，先把 1 米换成 100 厘米', `100 − ${c} = ${100 - c}`, `所以是 ${100 - c} 厘米`], hint: '先把 1 米换成厘米' };
      return { q: `${c} 厘米 + {0} 厘米 = 1 米`, answer: [num(100 - c)], steps: ['1 米 = 100 厘米', `${c} 再加几是 100？100 − ${c} = ${100 - c}`, `所以填 ${100 - c}`], hint: '1 米 = 100 厘米，想一想几和它凑成 100' };
    },
  },
  {
    id: 'g2a-len-compare', grade: 2, term: 1, unit: '长度单位', name: '长度比大小',
    tip: '先把米换成厘米，单位一样了再比', level: 1,
    gen(r) {
      const t = r.int(0, 2);
      if (t === 2) {
        const a = r.step(10, 90, 5), b = r.pick([100 - a, 100 - a, r.step(10, 95, 5)]), s = a + b;
        return { q: `${a} 厘米 + ${b} 厘米 ○ 1 米`, answer: [pick(CMP, sign(s, 100))], steps: [`先算左边：${a} + ${b} = ${s}（厘米）`, '1 米 = 100 厘米', `${s} 厘米 ${sign(s, 100)} 100 厘米`], hint: '先算出左边一共多少厘米' };
      }
      const m = r.int(1, 3), c = m * 100 + r.pick([0, -1, -10, -20, -50, 10, 20, 50, 1]);
      const [L, R, l, rr] = t === 0 ? [`${m} 米`, `${c} 厘米`, m * 100, c] : [`${c} 厘米`, `${m} 米`, c, m * 100];
      return { q: `${L} ○ ${R}`, answer: [pick(CMP, sign(l, rr))], steps: [`单位不一样，先换：${m} 米 = ${m * 100} 厘米`, `${l} 厘米 ${sign(l, rr)} ${rr} 厘米`, `所以 ${L} ${sign(l, rr)} ${R}`], hint: `${m} 米是多少厘米？` };
    },
  },
  {
    id: 'g2a-len-unit', grade: 2, term: 1, unit: '长度单位', name: '填合适的长度单位',
    tip: '1 厘米大约是指甲盖那么宽，1 米大约是张开双臂那么长', level: 1,
    gen(r) {
      const items = [
        ['一支铅笔长约', [15, 19], '厘米'], ['一块橡皮长约', [3, 5], '厘米'], ['数学书长约', [24, 26], '厘米'], ['课桌高约', [65, 80], '厘米'], ['一拃长约', [12, 15], '厘米'],
        ['一根筷子长约', [20, 25], '厘米'], ['一把牙刷长约', [16, 19], '厘米'], ['小狗高约', [30, 50], '厘米'], ['一个文具盒长约', [20, 22], '厘米'], ['一枚回形针长约', [3, 4], '厘米'], ['一张课桌长约', [60, 90], '厘米'],
        ['黑板长约', [3, 4], '米'], ['教室长约', [8, 10], '米'], ['一棵大树高约', [8, 15], '米'], ['床长约', [2, 2], '米'], ['门高约', [2, 2], '米'], ['旗杆高约', [10, 15], '米'],
        ['篮球场长约', [28, 28], '米'], ['一座楼高约', [20, 45], '米'], ['公共汽车长约', [10, 12], '米'], ['一根跳绳长约', [2, 3], '米'], ['操场跑道一圈长约', [200, 400], '米'],
      ];
      const [what, [lo, hi], u] = r.pick(items);
      const v = what.startsWith('操场') ? r.pick([200, 300, 400]) : r.int(lo, hi), other = u === '厘米' ? '米' : '厘米';
      return {
        q: `${what} ${v}（ ）`,
        answer: [pick(['厘米', '米'], u)],
        steps: [`想一想：${what.replace(/约$/, '')}大概有多长？`, u === '厘米' ? `如果是 ${v} 米，就有 ${v} 个大人张开双臂那么长，太长了` : `如果是 ${v} 厘米，才 ${v} 个指甲盖那么宽，太短了`, `所以填「${u}」：${what} ${v} ${u}`],
        hint: '把两个单位都放进去读一读，哪个合理？',
      };
    },
  },
  {
    id: 'g2a-len-ruler', grade: 2, term: 1, unit: '长度单位', name: '用尺子量线段',
    tip: '线段从刻度几量到刻度几，就用大数减小数；从 0 开始就直接读', level: 1,
    pool: 100, // 题干相同，题目差别在配图（起点、终点各不相同）
    gen(r) {
      const max = r.pick([10, 12]), len = r.int(2, 9), from = r.chance(0.3) ? 0 : r.int(1, max - len), to = from + len;
      return {
        q: '这条红色线段长几厘米？',
        fig: rulerFig(from, to, max),
        answer: [num(len, { unit: '厘米' })],
        steps: from === 0 ? [`线段的左端对着 0，右端对着 ${to}`, `从 0 开始量，右端对着几就是几厘米：${len} 厘米`] : [`线段的左端对着 ${from}，右端对着 ${to}，不是从 0 开始的`, `数一数中间有几个 1 厘米，或者用 ${to} − ${from} = ${len}`, `所以线段长 ${len} 厘米（不是 ${to} 厘米哦）`],
        hint: '看两头分别对着尺子上的几',
      };
    },
  },
  {
    id: 'g2a-len-segment-count', grade: 2, term: 1, unit: '长度单位', name: '数线段',
    tip: '线段有两个端点；一条线上的点，按顺序两两连着数，不重复不遗漏', level: 2, pool: 8,
    gen(r) {
      if (r.bool()) {
        const k = r.int(3, 6);
        return { q: '这个图形是由几条线段围成的？', fig: polyFig(r, k), answer: [num(k, { unit: '条' })], steps: [`沿着图形的边一条一条数，每条边都是一条线段`, `一共 ${k} 条边，所以由 ${k} 条线段围成`], hint: '数一数有几条边' };
      }
      const n = r.int(3, 6), P = 'ABCDEF'.slice(0, n), tot = (n * (n - 1)) / 2;
      const rows = []; for (let i = 0; i < n - 1; i++) rows.push(`从 ${P[i]} 出发往右：${P.slice(i + 1).split('').map((c) => P[i] + c).join('、')}，${n - 1 - i} 条`);
      return { q: `一条线上有 ${n} 个点，图中一共有几条线段？`, fig: pointsLineFig(n), answer: [num(tot, { unit: '条' })], steps: ['每两个点之间就是一条线段，按顺序数', ...rows, `${Array.from({ length: n - 1 }, (_, i) => n - 1 - i).join(' + ')} = ${tot}（条）`], hint: '从最左边的点开始，往右连一连' };
    },
  },
  {
    id: 'g2a-len-word', grade: 2, term: 1, unit: '长度单位', name: '长度的解决问题', process: true,
    tip: '先看单位一样不一样，不一样先换成厘米；再想用加法还是减法', level: 2,
    gen(r) {
      const [A, B] = r.names(2), t = r.int(0, 4);
      if (t === 0) { const c = r.step(15, 85, 5); return { q: `一根绳子长 1 米，剪去 ${c} 厘米，还剩多少厘米？`, answer: [num(100 - c, { unit: '厘米' })], steps: ['单位不一样，先换：1 米 = 100 厘米', '还剩的 = 原来的 − 剪去的', `100 − ${c} = ${100 - c}（厘米）`, `答：还剩 ${100 - c} 厘米。`] }; }
      if (t === 1) { const a = r.int(25, 60), b = r.int(15, 99 - a); return { q: `一根木条长 ${a} 厘米，另一根长 ${b} 厘米。把两根接起来（接头处不重叠），一共长多少厘米？`, answer: [num(a + b, { unit: '厘米' })], steps: ['接起来的长度 = 两根的长度合起来', `${a} + ${b} = ${a + b}（厘米）`, `答：一共长 ${a + b} 厘米。`] }; }
      if (t === 2) { const a = r.int(16, 19), b = r.int(4, 11); return { q: `${A}的铅笔原来长 ${a} 厘米，用了一段时间后还剩 ${b} 厘米。用去了多少厘米？`, answer: [num(a - b, { unit: '厘米' })], steps: ['用去的 = 原来的 − 还剩的', `${a} − ${b} = ${a - b}（厘米）`, `答：用去了 ${a - b} 厘米。`] }; }
      if (t === 3) { const a = r.int(30, 70), b = r.int(8, 99 - a > 30 ? 30 : 99 - a); return { q: `红丝带长 ${a} 厘米，比蓝丝带短 ${b} 厘米。蓝丝带长多少厘米？`, answer: [num(a + b, { unit: '厘米' })], steps: [`红丝带比蓝丝带短，反过来说，蓝丝带比红丝带长 ${b} 厘米`, `求比 ${a} 多 ${b} 的数，用加法`, `${a} + ${b} = ${a + b}（厘米）`, `答：蓝丝带长 ${a + b} 厘米。`], hint: '「红比蓝短」，那蓝比红长还是短？' }; }
      const a = r.int(70, 99), b = r.int(15, 35), c = r.int(10, Math.min(35, a - b - 5));
      return { q: `一条彩带长 ${a} 厘米，${A}做花用去 ${b} 厘米，${B}又用去 ${c} 厘米。还剩多少厘米？`, answer: [num(a - b - c, { unit: '厘米' })], steps: ['从原来的长度里，先减去第一次用的，再减去第二次用的', `${a} − ${b} − ${c} = ${a - b - c}（厘米）`, `答：还剩 ${a - b - c} 厘米。`] };
    },
  },

  // ---------- 100以内的加法和减法（二） ----------
  {
    id: 'g2a-add-nocarry', grade: 2, term: 1, unit: '100以内的加法和减法（二）', name: '两位数加两位数（不进位）',
    tip: '相同数位对齐，从个位加起', level: 1,
    gen(r) {
      const [a, b] = r.until(() => [r.int(10, 88), r.int(10, 88)], ([a, b]) => o1(a) + o1(b) <= 9 && a + b <= 99);
      return { q: `${a} + ${b} = {0}`, answer: [num(a + b)], steps: ['列竖式：相同数位对齐，从个位加起', ...addCols(a, b), vAdd(a, b)], hint: '个位对个位，十位对十位' };
    },
  },
  {
    id: 'g2a-add-carry', grade: 2, term: 1, unit: '100以内的加法和减法（二）', name: '两位数加两位数（进位）',
    tip: '个位满十，向十位进 1，十位相加时别忘了加上进的 1', level: 1,
    gen(r) {
      const [a, b] = r.until(() => [r.int(11, 79), r.int(11, 79)], ([a, b]) => o1(a) + o1(b) >= 10 && a + b <= 99);
      return { q: `${a} + ${b} = {0}`, answer: [num(a + b)], steps: ['列竖式：相同数位对齐，从个位加起', ...addCols(a, b), vAdd(a, b), '易错：十位上一定要加上进上来的 1'], hint: '个位相加满十了吗？' };
    },
  },
  {
    id: 'g2a-sub-noborrow', grade: 2, term: 1, unit: '100以内的加法和减法（二）', name: '两位数减两位数（不退位）',
    tip: '相同数位对齐，从个位减起', level: 1,
    gen(r) {
      const [a, b] = r.until(() => [r.int(25, 99), r.int(10, 88)], ([a, b]) => a > b && o1(a) >= o1(b));
      return { q: `${a} − ${b} = {0}`, answer: [num(a - b)], steps: ['列竖式：相同数位对齐，从个位减起', ...subCols(a, b), vSub(a, b)], hint: '个位对个位，十位对十位' };
    },
  },
  {
    id: 'g2a-sub-borrow', grade: 2, term: 1, unit: '100以内的加法和减法（二）', name: '两位数减两位数（退位）',
    tip: '个位不够减，从十位退 1 当 10；十位算的时候记得先减去退走的 1', level: 1,
    gen(r) {
      const [a, b] = r.until(() => [r.int(30, 99), r.int(11, 89)], ([a, b]) => a > b && o1(a) < o1(b));
      return { q: `${a} − ${b} = {0}`, answer: [num(a - b)], steps: ['列竖式：相同数位对齐，从个位减起', ...subCols(a, b), vSub(a, b), '易错：十位被退走了 1，要先减 1 再算'], hint: '个位够不够减？' };
    },
  },
  {
    id: 'g2a-add-chain', grade: 2, term: 1, unit: '100以内的加法和减法（二）', name: '连加',
    tip: '从左往右，先算前两个数，再加第三个数', level: 1,
    gen(r) {
      const [a, b, c] = r.until(() => [r.int(10, 45), r.int(8, 40), r.int(8, 40)], ([a, b, c]) => a + b + c <= 99 && a + b + c >= 50);
      const s1 = a + b, s2 = s1 + c;
      return { q: `${a} + ${b} + ${c} = {0}`, answer: [num(s2)], steps: ['从左往右算，先算前两个数', `${a} + ${b} = ${s1}`, vAdd(a, b), `再用 ${s1} 加 ${c}：${s1} + ${c} = ${s2}`, vAdd(s1, c)], hint: '先算哪两个数？' };
    },
  },
  {
    id: 'g2a-sub-chain', grade: 2, term: 1, unit: '100以内的加法和减法（二）', name: '连减',
    tip: '从左往右，先减去第一个数，再用结果减第二个数', level: 1,
    gen(r) {
      const [a, b, c] = r.until(() => [r.int(60, 99), r.int(10, 40), r.int(10, 40)], ([a, b, c]) => a - b - c >= 3);
      const s1 = a - b, s2 = s1 - c;
      return { q: `${a} − ${b} − ${c} = {0}`, answer: [num(s2)], steps: ['从左往右算，先算前两个数', `${a} − ${b} = ${s1}`, vSub(a, b), `再用 ${s1} 减 ${c}：${s1} − ${c} = ${s2}`, vSub(s1, c)], hint: '先算哪两个数？' };
    },
  },
  {
    id: 'g2a-add-sub-mix', grade: 2, term: 1, unit: '100以内的加法和减法（二）', name: '加减混合',
    tip: '只有加减法，从左往右一步一步算', level: 1,
    gen(r) {
      const ops = r.pick([['+', '−'], ['−', '+']]);
      const [a, b, c] = r.until(() => [r.int(20, 80), r.int(10, 50), r.int(10, 50)], ([a, b, c]) => {
        const s1 = ops[0] === '+' ? a + b : a - b; const s2 = ops[1] === '+' ? s1 + c : s1 - c;
        return s1 >= 5 && s1 <= 99 && s2 >= 3 && s2 <= 99;
      });
      const o = (x) => (x === '+' ? '+' : '-'), s1 = calc(a, b, o(ops[0])), s2 = calc(s1, c, o(ops[1]));
      return { q: `${a} ${ops[0]} ${b} ${ops[1]} ${c} = {0}`, answer: [num(s2)], steps: ['从左往右算，先算前两个数', `${a} ${ops[0]} ${b} = ${s1}`, vOp(a, b, o(ops[0])), `再算 ${s1} ${ops[1]} ${c} = ${s2}`, vOp(s1, c, o(ops[1]))], hint: '从左往右，第一步算什么？' };
    },
  },
  {
    id: 'g2a-add-missing', grade: 2, term: 1, unit: '100以内的加法和减法（二）', name: '算式里填几',
    tip: '求加数：和 − 另一个加数；求被减数：差 + 减数；求减数：被减数 − 差', level: 2,
    gen(r) {
      const t = r.int(0, 3);
      const [a, b] = r.until(() => [r.int(12, 60), r.int(12, 60)], ([a, b]) => a + b <= 99 && a + b >= 40);
      const s = a + b;
      if (t === 0) return { q: `{0} + ${b} = ${s}`, answer: [num(a)], steps: ['要求的是一个加数', `加数 = 和 − 另一个加数：${s} − ${b} = ${a}`, vSub(s, b), `验算：${a} + ${b} = ${s} ✓`], hint: '和减去另一个加数' };
      if (t === 1) return { q: `${a} + {0} = ${s}`, answer: [num(b)], steps: ['要求的是一个加数', `加数 = 和 − 另一个加数：${s} − ${a} = ${b}`, vSub(s, a), `验算：${a} + ${b} = ${s} ✓`], hint: '和减去另一个加数' };
      if (t === 2) return { q: `{0} − ${b} = ${a}`, answer: [num(s)], steps: ['要求的是被减数', `被减数 = 差 + 减数：${a} + ${b} = ${s}`, vAdd(a, b), `验算：${s} − ${b} = ${a} ✓`], hint: '被减数减掉一些后剩下差，那原来有多少？' };
      return { q: `${s} − {0} = ${a}`, answer: [num(b)], steps: ['要求的是减数', `减数 = 被减数 − 差：${s} − ${a} = ${b}`, vSub(s, a), `验算：${s} − ${b} = ${a} ✓`], hint: '从被减数里去掉多少才剩下差？' };
    },
  },
  {
    id: 'g2a-word-chain', grade: 2, term: 1, unit: '100以内的加法和减法（二）', name: '连加连减解决问题', process: true,
    tip: '按事情发生的顺序一步一步算：上来、买来用加；下去、借走用减', level: 1,
    gen(r) {
      const A = r.name();
      const T = [
        { ops: '−+', q: (a, b, c) => `公交车上原有 ${a} 人，到站后下去 ${b} 人，又上来 ${c} 人。现在车上有多少人？`, u: '人', s1: '下去后还有', ans: (v) => `现在车上有 ${v} 人。` },
        { ops: '−−', q: (a, b, c) => `图书角有 ${a} 本书，上午借走 ${b} 本，下午又借走 ${c} 本。还剩多少本？`, u: '本', s1: '上午借走后还剩', ans: (v) => `还剩 ${v} 本。` },
        { ops: '++', q: (a, b, c) => `果园第一天摘了 ${a} 筐苹果，第二天摘了 ${b} 筐，第三天摘了 ${c} 筐。三天一共摘了多少筐？`, u: '筐', s1: '前两天一共摘了', ans: (v) => `三天一共摘了 ${v} 筐。` },
        { ops: '−+', q: (a, b, c) => `${A}有 ${a} 元，买书用去 ${b} 元，妈妈又给了${A} ${c} 元。现在${A}有多少元？`, u: '元', s1: '买书后还剩', ans: (v) => `现在${A}有 ${v} 元。` },
        { ops: '+−', q: (a, b, c) => `停车场有 ${a} 辆车，又开来 ${b} 辆，后来开走了 ${c} 辆。现在有多少辆车？`, u: '辆', s1: '开来后有', ans: (v) => `现在有 ${v} 辆车。` },
        { ops: '−−', q: (a, b, c) => `${A}的储蓄罐里有 ${a} 元，第一次取出 ${b} 元，第二次取出 ${c} 元。还剩多少元？`, u: '元', s1: '第一次取出后还剩', ans: (v) => `还剩 ${v} 元。` },
      ];
      const t = r.pick(T), o = [...t.ops].map((x) => (x === '+' ? '+' : '-'));
      const [a, b, c] = r.until(() => [r.int(20, 80), r.int(10, 40), r.int(10, 40)], ([a, b, c]) => { const s1 = calc(a, b, o[0]), s2 = calc(s1, c, o[1]); return s1 >= 5 && s1 <= 99 && s2 >= 3 && s2 <= 99; });
      const s1 = calc(a, b, o[0]), s2 = calc(s1, c, o[1]), sy = (x) => (x === '+' ? '+' : '−');
      return {
        q: t.q(a, b, c), answer: [num(s2, { unit: t.u })],
        steps: [`先算${t.s1}多少：${a} ${sy(t.ops[0])} ${b} = ${s1}（${t.u}）`, `再算现在的：${s1} ${sy(t.ops[1])} ${c} = ${s2}（${t.u}）`, `也可以列成一个算式：${a} ${sy(t.ops[0])} ${b} ${sy(t.ops[1])} ${c} = ${s2}（${t.u}）`, `答：${t.ans(s2)}`],
        hint: '先发生了什么，后发生了什么？',
      };
    },
  },
  {
    id: 'g2a-word-more-less', grade: 2, term: 1, unit: '100以内的加法和减法（二）', name: '求比一个数多（少）几的数', process: true,
    tip: '比它多几，就在它上面加几；比它少几，就从它里面减几', level: 1,
    gen(r) {
      const [A, B] = r.names(2), more = r.bool(), w = more ? '多' : '少';
      const a = more ? r.int(20, 70) : r.int(35, 90), b = more ? r.int(6, Math.min(30, 99 - a)) : r.int(6, Math.min(30, a - 5)), v = more ? a + b : a - b;
      const T = [
        [`${A}有 ${a} 张邮票，${B}比${A}${w} ${b} 张。${B}有多少张邮票？`, '张', `${B}有 ${v} 张邮票。`],
        [`${A}跳绳跳了 ${a} 下，${B}比${A}${w}跳 ${b} 下。${B}跳了多少下？`, '下', `${B}跳了 ${v} 下。`],
        [`学校种了 ${a} 棵杨树，柳树比杨树${w} ${b} 棵。柳树有多少棵？`, '棵', `柳树有 ${v} 棵。`],
        [`${A}读了 ${a} 页书，${B}比${A}${w}读 ${b} 页。${B}读了多少页？`, '页', `${B}读了 ${v} 页。`],
        [`养鸡场有 ${a} 只鸡，鸭比鸡${w} ${b} 只。鸭有多少只？`, '只', `鸭有 ${v} 只。`],
        [`二（1）班收集了 ${a} 个塑料瓶，二（2）班比二（1）班${w}收集 ${b} 个。二（2）班收集了多少个？`, '个', `二（2）班收集了 ${v} 个。`],
      ];
      const [q, u, ans] = r.pick(T);
      return { q, answer: [num(v, { unit: u })], steps: [`求比 ${a} ${w} ${b} 的数，用${more ? '加法' : '减法'}`, `${a} ${more ? '+' : '−'} ${b} = ${v}（${u}）`, `答：${ans}`], hint: `是比 ${a} 多还是比 ${a} 少？` };
    },
  },
  {
    id: 'g2a-word-compare-2', grade: 2, term: 1, unit: '100以内的加法和减法（二）', name: '比多少的两步问题', process: true,
    tip: '先算出不知道的那个数，再算一共有多少', level: 2,
    gen(r) {
      const [A, B] = r.names(2), t = r.int(0, 4);
      if (t === 3) {
        const a = r.int(30, 40), b = r.int(2, 6), c = r.int(2, 9);
        return { q: `二（1）班有 ${a} 人，二（2）班比二（1）班多 ${b} 人，二（3）班比二（2）班少 ${c} 人。二（3）班有多少人？`, answer: [num(a + b - c, { unit: '人' })], steps: [`先求二（2）班：${a} + ${b} = ${a + b}（人）`, `二（3）班比二（2）班少 ${c} 人：${a + b} − ${c} = ${a + b - c}（人）`, `答：二（3）班有 ${a + b - c} 人。`], hint: '二（3）班是和谁比的？' };
      }
      const more = r.bool(), w = more ? '多' : '少';
      const a = more ? r.int(15, 40) : r.int(20, 49), b = more ? r.int(3, Math.min(20, 99 - 2 * a)) : r.int(3, Math.min(20, a - 5)), x = more ? a + b : a - b, tot = a + x;
      const T = [
        [`${A}有 ${a} 个玻璃球，${B}比${A}${w} ${b} 个。两人一共有多少个？`, '个', `${B}有多少个`, `两人一共有 ${tot} 个。`],
        [`果园有苹果树 ${a} 棵，梨树比苹果树${w} ${b} 棵。苹果树和梨树一共有多少棵？`, '棵', '梨树有多少棵', `苹果树和梨树一共有 ${tot} 棵。`],
        [`${A}第一天读了 ${a} 页书，第二天比第一天${w}读 ${b} 页。两天一共读了多少页？`, '页', '第二天读了多少页', `两天一共读了 ${tot} 页。`],
        [`商店上午卖出 ${a} 箱牛奶，下午比上午${w}卖 ${b} 箱。这一天一共卖出多少箱？`, '箱', '下午卖了多少箱', `这一天一共卖出 ${tot} 箱。`],
      ];
      const [q, u, first, ans] = T[t === 4 ? 3 : t];
      return { q, answer: [num(tot, { unit: u })], steps: ['要求一共有多少，得先知道两个数', `先求${first}：${a} ${more ? '+' : '−'} ${b} = ${x}（${u}）`, `再求一共：${a} + ${x} = ${tot}（${u}）`, `答：${ans}`], hint: '题目里有一个数没直接告诉你，先算它' };
    },
  },
  {
    id: 'g2a-word-reverse', grade: 2, term: 1, unit: '100以内的加法和减法（二）', name: '求原来有多少（倒着想）', process: true,
    tip: '从现在往回推：后来加上的要减回去，后来拿走的要加回来', level: 2,
    gen(r) {
      const A = r.name();
      const T = [
        { q: (a, b, c) => `停车场先开走了 ${a} 辆车，又开来 ${b} 辆，现在有 ${c} 辆。停车场原来有多少辆车？`, u: '辆', s1: `开来 `, s0: '开走', ans: '停车场原来有' },
        { q: (a, b, c) => `${A}送给同学 ${a} 张卡片，又买来 ${b} 张，现在有 ${c} 张。${A}原来有多少张卡片？`, u: '张', s1: '买来 ', s0: '送出', ans: `${A}原来有` },
        { q: (a, b, c) => `图书角借出 ${a} 本书，又还回 ${b} 本，现在有 ${c} 本。图书角原来有多少本书？`, u: '本', s1: '还回 ', s0: '借出', ans: '图书角原来有' },
        { q: (a, b, c) => `公交车到站后下去 ${a} 人，又上来 ${b} 人，现在车上有 ${c} 人。车上原来有多少人？`, u: '人', s1: '上来 ', s0: '下去', ans: '车上原来有' },
      ];
      const t = r.pick(T);
      const [x, a, b] = r.until(() => [r.int(30, 90), r.int(10, 40), r.int(8, 40)], ([x, a, b]) => x - a >= 5 && x - a + b <= 99 && a !== b);
      const m = x - a, c = m + b;
      return {
        q: t.q(a, b, c), answer: [num(x, { unit: t.u })],
        steps: [`倒着想：现在的 ${c} ${t.u}，是${t.s1}${b} ${t.u}以后的`, `${t.s1.trim()}之前有：${c} − ${b} = ${m}（${t.u}）`, `${t.s0}之前，也就是原来有：${m} + ${a} = ${x}（${t.u}）`, `答：${t.ans} ${x} ${t.u}。`],
        hint: '从「现在」开始，一步一步往回推',
      };
    },
  },

  // ---------- 角的初步认识 ----------
  {
    id: 'g2a-angle-kind', grade: 2, term: 1, unit: '角的初步认识', name: '锐角、直角还是钝角',
    tip: '用三角板的直角比：一样大是直角，比直角小是锐角，比直角大是钝角', level: 1,
    pool: 6, // 题干只有两种说法，题目差别在配图（角的大小和方向）
    gen(r) {
      const kind = r.pick(['锐角', '直角', '钝角']);
      const deg = kind === '锐角' ? r.int(25, 70) : kind === '直角' ? 90 : r.int(110, 160), rot = r.chance(0.5) ? 0 : r.int(0, 359);
      const cmp = { 锐角: '另一条边落在直角的里面，比直角小', 直角: '另一条边正好和直角的边重合，和直角一样大', 钝角: '另一条边落在直角的外面，比直角大' }[kind];
      return {
        q: r.pick(['这个角是什么角？', '用三角板上的直角比一比，这个角是什么角？']),
        fig: raysFig([rot, rot + deg], { arc: [rot, rot + deg] }),
        answer: [pick(['锐角', '直角', '钝角'], kind)],
        steps: ['拿三角板的直角来比：直角的顶点对准角的顶点，一条边对齐角的一条边', `看角的另一条边：${cmp}`, `所以这是${kind}`],
        hint: '和三角板上的直角比一比',
      };
    },
  },
  {
    id: 'g2a-angle-judge', grade: 2, term: 1, unit: '角的初步认识', name: '角的认识（判断对错）',
    tip: '角的大小看两条边张开得大小，和边画得长短没有关系', level: 1, pool: 19,
    gen(r) {
      const L = [
        ['一个角有一个顶点和两条边。', 1, '角是由一个顶点和从顶点出发的两条边组成的'],
        ['角的两条边越长，角就越大。', 0, '角的大小看两条边张开得大不大，和边的长短没有关系'],
        ['把角的两条边画长一些，角就变大了。', 0, '边变长了，可是两条边张开的大小没变，角的大小不变'],
        ['用放大镜看一个角，角的大小不变。', 1, '放大镜把边放大了，但两条边张开的大小没有变'],
        ['所有的直角都一样大。', 1, '直角都和三角板上的直角一样大'],
        ['比直角小的角是锐角。', 1, '锐角比直角小，钝角比直角大'],
        ['钝角比直角大。', 1, '钝角比直角大，锐角比直角小'],
        ['直角比锐角小。', 0, '锐角比直角小，所以直角比锐角大'],
        ['钝角一定比锐角大。', 1, '钝角比直角大，锐角比直角小，所以钝角一定比锐角大'],
        ['两个锐角拼在一起，一定是钝角。', 0, '两个很小的锐角拼起来，可能还是锐角，也可能正好是直角'],
        ['每块三角板上都有一个直角。', 1, '两种三角板上都各有一个直角'],
        ['长方形的 4 个角都是直角。', 1, '用三角板的直角去比，长方形的每个角都和它一样大'],
        ['正方形有 4 个直角。', 1, '正方形的 4 个角都是直角'],
        ['3 时整，钟面上时针和分针组成的角是直角。', 1, '3 时整，分针指 12，时针指 3，隔 3 个大格，正好是直角'],
        ['6 时整，钟面上时针和分针组成的角是直角。', 0, '6 时整，时针和分针连成一条直线，不是直角'],
        ['黑板面上有 4 个直角。', 1, '黑板面是长方形的，4 个角都是直角'],
        ['一个三角形有 3 个角。', 1, '三角形有 3 个顶点，就有 3 个角'],
        ['角的两条边可以是弯的。', 0, '角的两条边都是直直的'],
        ['画角时，从一个点起，用尺子画两条直直的线。', 1, '先点一个点做顶点，再从这个点起画两条直线做边'],
      ];
      const [s, ok, why] = r.pick(L);
      return { q: `判断对错：${s}`, answer: [pick(TF, ok ? '√' : '×')], steps: [why, ok ? '所以这句话是对的，选 √' : '所以这句话是错的，选 ×'], hint: '想一想角的大小和什么有关' };
    },
  },
  {
    id: 'g2a-angle-count', grade: 2, term: 1, unit: '角的初步认识', name: '数一数有几个角',
    tip: '从一个顶点出发的几条边：先数单个的角，再数两个合成的、三个合成的', level: 2, pool: 7,
    gen(r) {
      if (r.chance(0.35)) {
        const k = r.int(3, 6);
        return { q: '这个图形有几个角？', fig: polyFig(r, k), answer: [num(k, { unit: '个' })], steps: ['图形的每个顶点那里都有一个角', `数一数有 ${k} 个顶点，所以有 ${k} 个角`], hint: '一个顶点一个角' };
      }
      const n = r.int(3, 5), st = r.int(22, 32), rot = r.int(0, 40), dirs = Array.from({ length: n }, (_, i) => rot + i * st), tot = (n * (n - 1)) / 2;
      const parts = Array.from({ length: n - 1 }, (_, i) => n - 1 - i);
      return {
        q: '图中一共有几个角？', fig: raysFig(dirs), answer: [num(tot, { unit: '个' })],
        steps: [`从顶点出发有 ${n} 条边，每两条边组成一个角`, ...parts.map((c, i) => (i === 0 ? `单个的小角：${c} 个` : `${i + 1} 个小角合成的大角：${c} 个`)), `${parts.join(' + ')} = ${tot}（个）`],
        hint: '先数最小的角，再数合起来的大角',
      };
    },
  },
  {
    id: 'g2a-angle-cut', grade: 2, term: 1, unit: '角的初步认识', name: '剪去一个角还剩几个角',
    tip: '剪的线不经过顶点，多出 1 个角；经过一个顶点，角数不变；经过两个顶点，少 1 个角', level: 3, pool: 14,
    gen(r) {
      const shape = r.pick(['长方形', '正方形', '三角形']), n = shape === '三角形' ? 3 : 4;
      if (r.chance(0.35)) {
        const most = r.bool(), v = most ? n + 1 : 3;
        const steps = most
          ? ['剪的线不经过任何顶点时，剩下的角最多', `剪掉了 1 个角，却多出了 2 个新角：${n} − 1 + 2 = ${n + 1}（个）`, `所以最多有 ${n + 1} 个角`]
          : n === 4 ? ['剪的线经过两个相对的顶点（沿对角剪）时，剩下的角最少', '剩下的是一个三角形，有 3 个角', '所以最少有 3 个角'] : ['三角形剪去一个角，剪的线最多只能经过 1 个顶点', '经过一个顶点剪，剩下的还是三角形，有 3 个角', '所以最少有 3 个角'];
        return { q: `一张${shape}纸，沿一条直线剪去一个角，剩下的部分${most ? '最多' : '最少'}有几个角？`, answer: [num(v, { unit: '个' })], steps, hint: '画一画：剪的线经不经过顶点，结果不一样' };
      }
      let remain, dashed, v, why;
      if (n === 4) {
        const w = shape === '长方形' ? 1.6 : 1, h = 1, c = r.int(0, 2);
        if (c === 0) { const P1 = [w * 0.62, h], P2 = [w, h * 0.5]; remain = [[0, 0], [w, 0], P2, P1, [0, h]]; dashed = [[P1, [w, h]], [[w, h], P2]]; v = 5; why = '剪的线不经过顶点：剪掉 1 个角，多出 2 个新角，4 − 1 + 2 = 5'; }
        else if (c === 1) { const P2 = [w, h * 0.4]; remain = [[0, 0], [w, 0], P2, [0, h]]; dashed = [[[0, h], [w, h]], [[w, h], P2]]; v = 4; why = '剪的线经过一个顶点：剪掉 1 个角，只多出 1 个新角，角数不变，还是 4 个'; }
        else { remain = [[0, 0], [w, 0], [0, h]]; dashed = [[[0, h], [w, h]], [[w, h], [w, 0]]]; v = 3; why = '剪的线经过两个顶点：剩下一个三角形，只有 3 个角'; }
      } else {
        const A = [0, 0], B = [1.6, 0], Cc = [0.5, 1.2], c = r.int(0, 1);
        if (c === 0) { const P1 = [0.3, 0.72], P2 = [0.94, 0.72]; remain = [A, B, P2, P1]; dashed = [[P1, Cc], [Cc, P2]]; v = 4; why = '剪的线不经过顶点：剪掉 1 个角，多出 2 个新角，3 − 1 + 2 = 4'; }
        else { const M = [1.05, 0]; remain = [A, M, Cc]; dashed = [[M, B], [B, Cc]]; v = 3; why = '剪的线经过一个顶点：剩下的还是三角形，有 3 个角'; }
      }
      return { q: `一张${shape}纸沿虚线剪去一个角（虚线那块剪掉了），剩下的图形有几个角？`, fig: fig.poly(remain, { dashed, W: 300, H: 220 }), answer: [num(v, { unit: '个' })], steps: ['看剪的那条线经过了几个顶点', why, `剩下的图形有 ${v} 个角`], hint: '数一数剩下图形的顶点' };
    },
  },
  {
    id: 'g2a-angle-clock', grade: 2, term: 1, unit: '角的初步认识', name: '钟面上的角',
    tip: '整时：时针和分针隔 3 个大格是直角，少于 3 格是锐角，多于 3 格（不到 6 格）是钝角', level: 2, pool: 12,
    gen(r) {
      if (r.chance(0.25)) {
        const right = r.pick([3, 9]), opts = r.shuffle([right, ...r.sample([1, 2, 4, 5, 6, 7, 8, 10, 11, 12], 3)]).map((h) => `${h} 时`);
        return { q: '下面哪个时刻，钟面上时针和分针组成的角是直角？', answer: [pick(opts, `${right} 时`)], steps: ['整时的时候，分针都指着 12', '时针和分针隔 3 个大格，组成的角正好是直角', `${right} 时整，时针指着 ${right}，和 12 隔 3 个大格，是直角`], hint: '想象钟面：分针指 12，时针指几时和它隔 3 格？' };
      }
      const h = r.pick([1, 2, 3, 4, 5, 7, 8, 9, 10, 11]), gap = Math.min(h, 12 - h), kind = gap < 3 ? '锐角' : gap === 3 ? '直角' : '钝角';
      return {
        q: `${h} 时整，钟面上时针和分针组成的角是什么角？`, answer: [pick(['锐角', '直角', '钝角'], kind)],
        steps: ['整时的时候，分针指着 12', `时针指着 ${h}，和 12 之间隔了 ${gap} 个大格`, '隔 3 个大格正好是直角', gap < 3 ? `${gap} 格比 3 格少，角比直角小，是锐角` : gap === 3 ? '所以是直角' : `${gap} 格比 3 格多，角比直角大，是钝角`],
        hint: '想象钟面：时针和分针之间隔了几个大格？',
      };
    },
  },

  // ---------- 表内乘法（一） ----------
  {
    id: 'g2a-mul-meaning', grade: 2, term: 1, unit: '表内乘法（一）', name: '看图数几个几',
    tip: '每份个数一样，就是「几个几」：先看每份几个，再看有几份', level: 1,
    gen(r) {
      const k = r.int(2, 5), n = r.int(2, 6), E = r.pick(EMO);
      return {
        q: `数一数${E}：一共有 {0} 个 {1}，合起来是 {2} 个。`,
        fig: fig.groups(Array.from({ length: k }, () => [E, n]), { size: 30, perRow: 3 }),
        answer: [num(k), num(n), num(k * n)],
        steps: [`每个圈里有 ${n} 个，有 ${k} 个圈，就是 ${k} 个 ${n}`, `${k} 个 ${n} 相加：${Array(k).fill(n).join(' + ')} = ${k * n}`, `用乘法算更简单：${n} × ${k} = ${k * n}（也可以写成 ${k} × ${n}）`],
        hint: '先看每个圈里有几个，再看有几个圈',
      };
    },
  },
  {
    id: 'g2a-mul-from-add', grade: 2, term: 1, unit: '表内乘法（一）', name: '加法改写成乘法',
    tip: '相同的数连加才能改写成乘法：几个几相加 = 几 × 几', level: 1,
    gen(r) {
      const n = r.int(2, 6), k = r.int(2, 6), t = r.int(0, 4), add = Array(k).fill(n).join(' + ');
      if (t === 4) {
        const same = r.bool(), arr = Array(k).fill(n);
        if (!same) arr[r.int(0, k - 1)] = n + r.pick([-1, 1, 2]);
        return { q: `${arr.join(' + ')} 能直接改写成一道乘法算式吗？`, answer: [pick(['能', '不能'], same ? '能' : '不能')], steps: same ? [`每个加数都是 ${n}，是 ${k} 个 ${n} 相加`, `能改写成 ${n} × ${k} = ${n * k}`] : ['仔细看，加数不全一样', '只有相同的数连加，才能直接改写成乘法算式', '所以不能'], hint: '每个加数都一样吗？' };
      }
      if (t === 3) return { q: `${n} × ${k} 可以表示 {0} 个 ${n} 相加。`, answer: [num(k)], steps: [`${n} × ${k} 就是 ${k} 个 ${n} 相加`, `${add} = ${n * k}`], hint: `${n} × ${k} 里，${n} 是相同的加数，另一个数表示什么？` };
      return { q: `${add} = ${n} × {0} = {1}`, answer: [num(k), num(n * k)], steps: [`相同的加数是 ${n}，数一数有 ${k} 个`, `${k} 个 ${n} 相加，写成乘法：${n} × ${k}`, `${n} × ${k} = ${n * k}`], hint: '数一数有几个相同的加数' };
    },
  },
  {
    id: 'g2a-mul-parts', grade: 2, term: 1, unit: '表内乘法（一）', name: '乘法算式各部分的名称',
    tip: '因数 × 因数 = 积；× 读作「乘」', level: 1,
    gen(r) {
      const a = r.int(2, 6), b = r.int(2, 6), p = a * b, t = r.int(0, 3);
      if (t === 0) return { q: `在 ${a} × ${b} = ${p} 中，${p} 叫做什么？`, answer: [pick(['因数', '积', '和', '差'], '积')], steps: ['乘法算式里，乘号前后的两个数都叫因数，等号后面的得数叫积', `所以 ${p} 是积`], hint: '乘法的得数叫什么？' };
      if (t === 1) return { q: `在 ${a} × ${b} = ${p} 中，${a} 和 ${b} 都叫做什么？`, answer: [pick(['因数', '积', '加数', '和'], '因数')], steps: ['乘号前后的两个数都叫因数', `所以 ${a} 和 ${b} 都是因数`], hint: '乘号两边的数叫什么？' };
      if (t === 2) return { q: `两个因数分别是 ${a} 和 ${b}，积是 {0}。`, answer: [num(p)], steps: ['求积，就是把两个因数相乘', `${a} × ${b} = ${p}，口诀：${kj(a, b)}`], hint: '积是相乘的结果' };
      return { q: `${a} × ${b} 读作什么？`, answer: [pick(r.shuffle([`${a} 乘 ${b}`, `${a} 加 ${b}`, `${a} 叉 ${b}`]), `${a} 乘 ${b}`)], steps: ['× 读作「乘」', `${a} × ${b} 读作「${a} 乘 ${b}」`], hint: '× 这个符号怎么读？' };
    },
  },
  {
    id: 'g2a-mul-kj-2to6', grade: 2, term: 1, unit: '表内乘法（一）', name: '2~6 的乘法口诀填空',
    tip: '口诀小数在前、大数在后；积小于 10 的口诀中间有个「得」字', level: 1, speed: 6,
    gen(r) { return kjFill(r, 2, 6); },
  },
  {
    id: 'g2a-mul-oral-2to6', grade: 2, term: 1, unit: '表内乘法（一）', name: '2~6 的乘法口算',
    tip: '想口诀：小数在前，比如 4 × 3 想「三四十二」', level: 1, speed: 5,
    gen(r) { return mulOral(r, 2, 6); },
  },

  // ---------- 表内乘法（二） ----------
  {
    id: 'g2a-mul-kj-7to9', grade: 2, term: 1, unit: '表内乘法（二）', name: '7~9 的乘法口诀填空',
    tip: '7~9 的口诀最容易混：七八五十六、六九五十四、八九七十二多背几遍', level: 1, speed: 6,
    gen(r) { return kjFill(r, 7, 9); },
  },
  {
    id: 'g2a-mul-oral-7to9', grade: 2, term: 1, unit: '表内乘法（二）', name: '7~9 的乘法口算',
    tip: '想口诀：小数在前，比如 9 × 7 想「七九六十三」', level: 1, speed: 5,
    gen(r) { return mulOral(r, 7, 9); },
  },
  {
    id: 'g2a-mul-add-sub', grade: 2, term: 1, unit: '表内乘法（二）', name: '乘加、乘减',
    tip: '先算乘法，再算加法或减法', level: 1, speed: 10,
    gen(r) {
      const add = r.bool();
      const [a, b, c] = r.until(() => [r.int(2, 9), r.int(2, 9), r.int(2, 30)], ([a, b, c]) => (add ? a * b + c <= 99 : a * b - c >= 1));
      const p = a * b, v = add ? p + c : p - c;
      return { q: `${a} × ${b} ${add ? '+' : '−'} ${c} = {0}`, answer: [num(v)], steps: [`先算乘法：${a} × ${b} = ${p}（${kj(a, b)}）`, `再算${add ? '加法' : '减法'}：${p} ${add ? '+' : '−'} ${c} = ${v}`], hint: '先算哪一步？' };
    },
  },
  {
    id: 'g2a-mul-compare', grade: 2, term: 1, unit: '表内乘法（二）', name: '乘法算式比大小',
    tip: '先用口诀算出得数，再比大小', level: 1,
    gen(r) {
      const t = r.int(0, 2), a = r.int(2, 9), b = r.int(2, 9), p = a * b;
      if (t === 0) { const n = p + r.pick([0, -1, 1, -2, 2, -5, 5, -3, 3]); return { q: `${a} × ${b} ○ ${n}`, answer: [pick(CMP, sign(p, n))], steps: [`先算 ${a} × ${b} = ${p}（${kj(a, b)}）`, `${p} ${sign(p, n)} ${n}`], hint: '先算出左边' }; }
      if (t === 1) {
        const pairs = []; for (let x = 2; x <= 9; x++) for (let y = 2; y <= 9; y++) if (x * y === p && x !== a) pairs.push([x, y]);
        const [c, d] = pairs.length && r.chance(0.4) ? r.pick(pairs) : [r.int(2, 9), r.int(2, 9)], q2 = c * d;
        return { q: `${a} × ${b} ○ ${c} × ${d}`, answer: [pick(CMP, sign(p, q2))], steps: [`左边：${a} × ${b} = ${p}`, `右边：${c} × ${d} = ${q2}`, `${p} ${sign(p, q2)} ${q2}，所以 ${a} × ${b} ${sign(p, q2)} ${c} × ${d}`], hint: '两边都先算出来' };
      }
      const x = r.int(1, 5), y = r.int(1, 5), s = x + y, m = x * y;
      return { q: `${x} × ${y} ○ ${x} + ${y}`, answer: [pick(CMP, sign(m, s))], steps: [`左边：${x} × ${y} = ${m}`, `右边：${x} + ${y} = ${s}`, `${m} ${sign(m, s)} ${s}`, '乘法和加法不一样，要分别算出来再比'], hint: '× 和 + 可不一样哦' };
    },
  },
  {
    id: 'g2a-mul-maxfill', grade: 2, term: 1, unit: '表内乘法（二）', name: '□ 里最大（最小）能填几',
    tip: '想口诀找最接近的积，再看能不能等于', level: 2,
    gen(r) {
      const b = r.int(2, 9), m = r.int(2, 8), big = r.bool(), front = r.bool();
      const left = front ? `□ × ${b}` : `${b} × □`;
      if (big) {
        const n = r.int(b * m + 1, b * (m + 1)); // 满足 b·m < n ≤ b·(m+1)
        return { q: `${left} < ${n}，□ 里最大能填几？`, answer: [num(m)], steps: [`想 ${b} 的口诀，找积比 ${n} 小、又最接近 ${n} 的`, `${b} × ${m} = ${m * b}，${m * b} < ${n} ✓`, `${b} × ${m + 1} = ${b * (m + 1)}，${b * (m + 1)} ${b * (m + 1) === n ? '=' : '>'} ${n}，不行`, `所以 □ 里最大填 ${m}`], hint: `${b} 乘几最接近 ${n}？` };
      }
      const n = r.int(b * (m - 1), b * m - 1); // 满足 b·(m−1) ≤ n < b·m
      return { q: `${left} > ${n}，□ 里最小能填几？`, answer: [num(m)], steps: [`想 ${b} 的口诀，找积比 ${n} 大、又最接近 ${n} 的`, `${b} × ${m - 1} = ${b * (m - 1)}，${b * (m - 1)} ${b * (m - 1) === n ? '=' : '<'} ${n}，不行`, `${b} × ${m} = ${b * m}，${b * m} > ${n} ✓`, `所以 □ 里最小填 ${m}`], hint: `${b} 乘几比 ${n} 大一点？` };
    },
  },
  {
    id: 'g2a-mul-word', grade: 2, term: 1, unit: '表内乘法（二）', name: '用乘法解决问题', process: true,
    tip: '求几个几是多少，用乘法', level: 1,
    gen(r) {
      const A = r.name(), n = r.int(2, 9), k = r.int(2, 9), p = n * k;
      const T = [
        [`每盒有 ${n} 个月饼，${k} 盒一共有多少个？`, '个', `${k} 盒一共有 ${p} 个。`],
        [`同学们排队做操，每排 ${n} 人，排了 ${k} 排。一共有多少人？`, '人', `一共有 ${p} 人。`],
        [`${A}每天看 ${n} 页书，${k} 天一共看多少页？`, '页', `${k} 天一共看 ${p} 页。`],
        [`一条小船能坐 ${n} 人，${k} 条小船一共能坐多少人？`, '人', `${k} 条小船一共能坐 ${p} 人。`],
        [`每个花瓶插 ${n} 朵花，${k} 个花瓶一共插多少朵？`, '朵', `一共插 ${p} 朵。`],
        [`一支铅笔 ${n} 元，${A}买了 ${k} 支，一共要多少元？`, '元', `一共要 ${p} 元。`],
      ];
      const [q, u, ans] = r.pick(T);
      return { q, answer: [num(p, { unit: u })], steps: [`有 ${k} 个 ${n}，求 ${k} 个 ${n} 是多少，用乘法`, `${n} × ${k} = ${p}（${u}）`, `答：${ans}`], hint: '题目里是「几个几」吗？' };
    },
  },
  {
    id: 'g2a-mul-word-add-sub', grade: 2, term: 1, unit: '表内乘法（二）', name: '乘加乘减解决问题', process: true,
    tip: '先用乘法算出几个几，再加上多的或减去用掉的', level: 2,
    gen(r) {
      const A = r.name(), t = r.int(0, 4), n = r.int(3, 9), k = r.int(2, 9), p = n * k;
      if (t === 1) {
        const pay = p < 20 ? 20 : p < 50 ? 50 : 100;
        return { q: `${A}买了 ${k} 本笔记本，每本 ${n} 元，付了 ${pay} 元，应找回多少元？`, answer: [num(pay - p, { unit: '元' })], steps: [`先算一共花多少：${n} × ${k} = ${p}（元）`, `再算找回多少：${pay} − ${p} = ${pay - p}（元）`, `答：应找回 ${pay - p} 元。`], hint: '先算笔记本一共多少钱' };
      }
      const add = t === 0 || t === 2, c = add ? r.int(1, Math.min(n - 1, 99 - p)) : r.int(2, Math.min(20, p - 1));
      const T = [
        [`同学们做操，每排 ${n} 人，站了 ${k} 排，还多出 ${c} 人。一共有多少人？`, '人', '一共有'],
        null,
        [`一盒彩笔有 ${n} 支，${A}有 ${k} 盒，又买来 ${c} 支。${A}一共有多少支彩笔？`, '支', `${A}一共有`],
        [`有 ${k} 个花篮，每个花篮里有 ${n} 朵花，送给老师 ${c} 朵。还剩多少朵？`, '朵', '还剩'],
        [`小兔家有 ${k} 筐萝卜，每筐 ${n} 根，吃了 ${c} 根。还剩多少根？`, '根', '还剩'],
      ];
      const [q, u, ans] = T[t], v = add ? p + c : p - c;
      return { q, answer: [num(v, { unit: u })], steps: [`先算 ${k} 个 ${n} 是多少：${n} × ${k} = ${p}（${u}）`, `再${add ? `加上 ${c}` : `减去 ${c}`}：${p} ${add ? '+' : '−'} ${c} = ${v}（${u}）`, `也可以列成一个算式：${n} × ${k} ${add ? '+' : '−'} ${c} = ${v}（${u}）`, `答：${ans} ${v} ${u}。`], hint: '先算几个几，再想加还是减' };
    },
  },

  // ---------- 认识时间 ----------
  {
    id: 'g2a-time-read', grade: 2, term: 1, unit: '认识时间', name: '认读几时几分',
    tip: '先看时针：走过几就是几时多；再看分针：从 12 起，走 1 大格是 5 分', level: 1,
    gen(r) {
      const h = r.int(1, 12), m = r.chance(0.15) ? 0 : r.step(5, 55, 5), nx = (h % 12) + 1;
      return {
        q: '钟面上是 {0} 时 {1} 分。', fig: fig.clock(h, m),
        answer: [num(h, { label: '时' }), num(m, { label: '分' })],
        steps: [m === 0 ? `时针正好指着 ${h}，分针指着 12，是整时` : `先看时针：时针走过了 ${h}，还没到 ${nx}，是 ${h} 时多`, m === 0 ? `所以是 ${h} 时整，也就是 ${h} 时 0 分，写成 ${hm(h, 0)}` : `再看分针：分针指着 ${m / 5}，从 12 走了 ${m / 5} 个大格，${m / 5} 个 5 分是 ${m} 分`, ...(m ? [`所以是 ${h} 时 ${m} 分，写成 ${hm(h, m)}`] : [])],
        hint: '短的是时针，长的是分针',
      };
    },
  },
  {
    id: 'g2a-time-read-min', grade: 2, term: 1, unit: '认识时间', name: '认读几时几分（几分不是整 5 分）',
    tip: '分针先数大格（每格 5 分），再数多出来的小格（每格 1 分）', level: 2,
    gen(r) {
      const h = r.int(1, 12), m = r.until(() => r.int(1, 59), (x) => x % 5 !== 0), big = Math.floor(m / 5), small = m % 5, nx = (h % 12) + 1;
      return {
        q: '钟面上是 {0} 时 {1} 分。', fig: fig.clock(h, m),
        answer: [num(h, { label: '时' }), num(m, { label: '分' })],
        steps: [`看时针：走过了 ${h}，还没到 ${nx}，是 ${h} 时多${m >= 45 ? `（时针已经很靠近 ${nx}，但还没到，不能读成 ${nx} 时）` : ''}`, `看分针：从 12 起走了 ${big} 个大格又 ${small} 个小格`, `${big} 个大格是 ${big * 5} 分，再加 ${small} 分：${big * 5} + ${small} = ${m}（分）`, `所以是 ${h} 时 ${m} 分，写成 ${hm(h, m)}`],
        hint: '先数分针走过几个大格',
      };
    },
  },
  {
    id: 'g2a-time-convert', grade: 2, term: 1, unit: '认识时间', name: '时和分',
    tip: '1 时 = 60 分；分针走 1 小格是 1 分，走 1 大格是 5 分，走 1 圈是 60 分', level: 1,
    gen(r) {
      const t = r.int(0, 5);
      if (t <= 1) {
        const k = r.pick([30, 40, 45, 50, 55, 59, 60, 60, 61, 65, 70, 80, 90, 100]), [L, R, l, rr] = t === 0 ? ['1 时', `${k} 分`, 60, k] : [`${k} 分`, '1 时', k, 60];
        return { q: `${L} ○ ${R}`, answer: [pick(CMP, sign(l, rr))], steps: ['1 时 = 60 分', `${l} 分 ${sign(l, rr)} ${rr} 分`, `所以 ${L} ${sign(l, rr)} ${R}`], hint: '1 时等于多少分？' };
      }
      if (t === 2) { const x = r.int(1, 11); return { q: `分针从 12 走到 ${x}，走了 {0} 分。`, answer: [num(x * 5)], steps: ['分针走 1 个大格是 5 分', `从 12 走到 ${x} 是 ${x} 个大格，${x} 个 5 分是 ${x * 5} 分`], hint: '1 大格是几分？' }; }
      if (t === 3) { const a = r.int(1, 11), b = r.int(a + 1, 12), d = b - a; return { q: `分针从 ${a} 走到 ${b}，走了 {0} 分。`, answer: [num(d * 5)], steps: [`从 ${a} 到 ${b} 走了 ${d} 个大格`, `${d} 个 5 分是 ${d * 5} 分`], hint: '先数走了几个大格' }; }
      const L = [['1 时 = {0} 分', 60, '分针走一圈是 60 分，这时时针走 1 大格，就是 1 时'], ['分针走 1 大格是 {0} 分', 5, '1 大格里有 5 小格，每小格 1 分'], ['分针走一圈是 {0} 分', 60, '钟面上一共 60 小格，分针走一圈就是 60 分'], ['时针走 1 大格是 {0} 时', 1, '时针从一个数走到下一个数，就是 1 时'], ['分针走一圈，时针走 {0} 大格', 1, '分针走一圈是 60 分 = 1 时，时针正好走 1 大格'], ['钟面上一共有 {0} 个大格', 12, '钟面上有 12 个数，分成 12 个大格'], ['钟面上一共有 {0} 个小格', 60, '每个大格有 5 小格，12 个大格是 60 小格']];
      const [q, v, why] = r.pick(L);
      return { q, answer: [num(v)], steps: [why, `所以填 ${v}`], hint: '想一想钟面的样子' };
    },
  },
  {
    id: 'g2a-time-unit', grade: 2, term: 1, unit: '认识时间', name: '填合适的时间单位',
    tip: '1 时很长，可以上一节课还多；1 分很短，只够拍几十下手', level: 1,
    gen(r) {
      const L = [['看一场电影大约要', [2, 2], '时'], ['小学生每天在学校大约', [6, 8], '时'], ['晚上睡觉大约', [9, 10], '时'], ['上一节课是', [40, 40], '分'], ['刷一次牙大约要', [3, 3], '分'], ['唱一首歌大约要', [3, 4], '分'], ['课间休息', [10, 10], '分'], ['吃一顿午饭大约要', [20, 30], '分'], ['跑 50 米大约要', [1, 1], '分'], ['做一节广播操大约要', [5, 8], '分'], ['坐火车从北京到上海大约要', [5, 6], '时'], ['看一集动画片大约要', [15, 25], '分'], ['写一页生字大约要', [10, 15], '分'], ['一天上午在学校大约', [4, 4], '时']];
      const [what, [lo, hi], u] = r.pick(L), v = r.int(lo, hi);
      return { q: `${what} ${v}（ ）`, answer: [pick(['时', '分'], u)], steps: [u === '时' ? `${v} 分太短了，这件事要很长时间` : `${v} 时太长了，这件事一会儿就做完`, `所以填「${u}」：${what} ${v} ${u}`], hint: '把两个单位都放进去读一读，哪个合理？' };
    },
  },
  {
    id: 'g2a-time-hands', grade: 2, term: 1, unit: '认识时间', name: '时针分针的位置',
    tip: '时针在 3 和 4 之间是 3 时多；分针指着几，就是几个 5 分', level: 2,
    gen(r) {
      const h = r.int(1, 12), nx = (h % 12) + 1, t = r.int(0, 2);
      if (t === 0) { const k = r.int(1, 11); return { q: `时针在 ${h} 和 ${nx} 之间，分针指着 ${k}。这时是 {0} 时 {1} 分。`, answer: [num(h, { label: '时' }), num(k * 5, { label: '分' })], steps: [`时针在 ${h} 和 ${nx} 之间，是 ${h} 时多（不是 ${nx} 时）`, `分针指着 ${k}，${k} 个 5 分是 ${k * 5} 分`, `所以是 ${h} 时 ${k * 5} 分`], hint: '时针过了几，就是几时多' }; }
      if (t === 1) { const m = r.step(5, 55, 5); return { q: `${h} 时 ${m} 分时，分针指着数字 {0}。`, answer: [num(m / 5)], steps: ['分针指着几，就是几个 5 分', `${m} 分里有 ${m / 5} 个 5 分，所以分针指着 ${m / 5}`], hint: `${m} 里面有几个 5？` }; }
      return { q: `${h} 时 30 分时，分针指着 {0}，时针在 {1} 和 {2} 之间。`, answer: [num(6), num(h), num(nx)], steps: ['30 分是 6 个 5 分，分针指着 6', `${h} 时多，时针走过了 ${h}、还没到 ${nx}，在 ${h} 和 ${nx} 的正中间`], hint: '半时的时候，分针指着几？' };
    },
  },
  {
    id: 'g2a-time-elapsed', grade: 2, term: 1, unit: '认识时间', name: '经过了多少分', process: true,
    tip: '同一个时里，只看分：结束的分 − 开始的分', level: 2,
    gen(r) {
      const A = r.name(), f = r.bool() ? hm : (h, m) => `${h}时${m}分`;
      const T = [
        { q: (h, a, b) => `一节课 ${f(h, a)} 开始，${f(h, b)} 下课。这节课上了多少分？`, hs: [8, 9, 10], d: [40, 40, 35] },
        { q: (h, a, b) => `${A} ${f(h, a)} 开始写作业，${f(h, b)} 写完。写作业用了多少分？`, hs: [4, 5, 7], d: [20, 25, 30, 35, 40, 45] },
        { q: (h, a, b) => `${A}早上 ${f(h, a)} 从家出发，${f(h, b)} 到学校。路上用了多少分？`, hs: [7], d: [10, 15, 20, 25] },
        { q: (h, a, b) => `大课间活动 ${f(h, a)} 开始，${f(h, b)} 结束。活动了多少分？`, hs: [9, 10], d: [20, 25, 30] },
        { q: (h, a, b) => `${A} ${f(h, a)} 开始看动画片，${f(h, b)} 看完。看了多少分？`, hs: [6, 7], d: [15, 20, 25, 30] },
      ];
      const t = r.pick(T), h = r.pick(t.hs), d = r.pick(t.d), a = r.step(0, 55 - d, 5), b = a + d;
      return { q: t.q(h, a, b), answer: [num(d, { unit: '分' })], steps: [`开始和结束都是 ${h} 时多，只要看分`, `${b} − ${a} = ${d}（分）`, `也可以数分针：从 ${a / 5 || 12} 走到 ${b / 5}，走了 ${d / 5} 个大格，${d / 5} 个 5 分是 ${d} 分`, `答：用了 ${d} 分。`], hint: '开始时是几分？结束时是几分？' };
    },
  },

  // ---------- 倍的初步认识（北师大版、北京版二年级上册） ----------
  {
    id: 'g2a-times-see', grade: 2, term: 1, unit: '倍的初步认识', name: '看图说几倍',
    tip: '把第一行的个数看作 1 份，第二行有这样的几份，就是它的几倍', level: 1,
    gen(r) {
      const a = r.int(2, 4), k = r.int(2, 5), [e1, e2] = r.sample(EMO, 2), group = r.chance(0.6);
      return {
        q: `第二行${e2}的个数是第一行${e1}的几倍？`, fig: twoRowsFig(e1, a, e2, a * k, { group }),
        answer: [num(k, { unit: '倍' })],
        steps: [`第一行有 ${a} 个，把 ${a} 个看作 1 份`, `第二行${group ? '' : '一共 ' + a * k + ' 个，'}每 ${a} 个圈一圈，能圈出 ${k} 份`, `第二行有 ${k} 个 ${a}，就是第一行的 ${k} 倍`],
        hint: `第二行里，能圈出几个 ${a}？`,
      };
    },
  },
  {
    id: 'g2a-times-mul', grade: 2, term: 1, unit: '倍的初步认识', name: '求一个数的几倍是多少', process: true,
    tip: '求一个数的几倍是多少，就是求几个这个数，用乘法', level: 1,
    gen(r) {
      const [A, B] = r.names(2), base = r.int(2, 9), k = r.int(2, 9), v = base * k;
      const T = [
        [`${A}有 ${base} 本故事书，${B}的故事书是${A}的 ${k} 倍。${B}有多少本？`, '本', A, B, `${B}有 ${v} 本。`],
        [`白兔有 ${base} 只，灰兔的只数是白兔的 ${k} 倍。灰兔有多少只？`, '只', '白兔', '灰兔', `灰兔有 ${v} 只。`],
        [`${A}跳了 ${base} 下，${B}跳的下数是${A}的 ${k} 倍。${B}跳了多少下？`, '下', A, B, `${B}跳了 ${v} 下。`],
        [`一块橡皮 ${base} 元，一个文具盒的价钱是橡皮的 ${k} 倍。文具盒多少元？`, '元', '橡皮', '文具盒', `文具盒 ${v} 元。`],
        [`红花有 ${base} 朵，黄花的朵数是红花的 ${k} 倍。黄花有多少朵？`, '朵', '红花', '黄花', `黄花有 ${v} 朵。`],
      ];
      const [q, u, x, y, ans] = r.pick(T);
      return {
        q, fig: fig.bars([{ label: x, units: 1, text: `${base}${u}` }, { label: y, units: k, text: '?' }], { unitW: k > 6 ? 40 : 52 }),
        answer: [num(v, { unit: u })],
        steps: [`${y}是${x}的 ${k} 倍，就是 ${k} 个 ${base}`, `求 ${k} 个 ${base} 是多少，用乘法`, `${base} × ${k} = ${v}（${u}）`, `答：${ans}`],
        hint: `几倍就是几个 ${base}`,
      };
    },
  },
  {
    id: 'g2a-times-which', grade: 2, term: 1, unit: '倍的初步认识', name: '求一个数是另一个数的几倍', process: true,
    tip: '求 a 是 b 的几倍，就是看 a 里面有几个 b：想 b 乘几等于 a', level: 2,
    gen(r) {
      const [A, B] = r.names(2), a = r.int(2, 9), k = r.int(2, 9), p = a * k;
      const T = [
        [`${A}有 ${a} 本故事书，${B}有 ${p} 本。${B}的故事书是${A}的几倍？`, A, B],
        [`白兔有 ${a} 只，灰兔有 ${p} 只。灰兔的只数是白兔的几倍？`, '白兔', '灰兔'],
        [`红花有 ${a} 朵，黄花有 ${p} 朵。黄花的朵数是红花的几倍？`, '红花', '黄花'],
        [`${A}跳了 ${a} 下，${B}跳了 ${p} 下。${B}跳的下数是${A}的几倍？`, A, B],
        [`一块橡皮 ${a} 元，一个文具盒 ${p} 元。文具盒的价钱是橡皮的几倍？`, '橡皮', '文具盒'],
      ];
      const [q] = r.pick(T);
      return {
        q, answer: [num(k, { unit: '倍' })],
        steps: [`求 ${p} 是 ${a} 的几倍，就是看 ${p} 里面有几个 ${a}`, `想口诀：${a} × ${k} = ${p}（${kj(a, k)}）`, `${p} 里面有 ${k} 个 ${a}，所以是 ${k} 倍（学了除法以后，可以列式 ${p} ÷ ${a} = ${k}）`, `答：${q.split('。').slice(-1)[0].replace('几倍？', ` ${k} 倍。`)}`],
        hint: `${a} 乘几等于 ${p}？`,
      };
    },
  },

  // ---------- 数学广角——搭配（一） ----------
  {
    id: 'g2a-combo-digits', grade: 2, term: 1, unit: '数学广角——搭配（一）', name: '用数字卡片组两位数',
    tip: '按顺序固定十位，再换个位，不重复不遗漏；0 不能放在十位上', level: 3,
    gen(r) {
      const zero = r.chance(0.35), ds = (zero ? [0, ...r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 2)] : r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 3)).sort((x, y) => x - y);
      const all = [], rows = [];
      for (const x of ds) { if (!x) continue; const row = ds.filter((y) => y !== x).map((y) => x * 10 + y); all.push(...row); rows.push(`十位是 ${x}：${row.join('、')}`); }
      const cards = r.shuffle(ds).join('、'), t = r.int(0, 3), pre = `用 ${cards} 三张数字卡片，每次选两张组成两位数`;
      if (t <= 1) return { q: `${pre}，一共能组成几个不同的两位数？`, answer: [num(all.length, { unit: '个' })], steps: [...(zero ? ['0 不能放在十位上，十位只能放另外两个数'] : ['按顺序，先固定十位，再换个位']), ...rows, `一共 ${rows.map(() => 2).join(' + ')} = ${all.length}（个）`], hint: '先定十位，再看个位能放几个数' };
      const big = t === 2, v = big ? Math.max(...all) : Math.min(...all), nz = ds.filter((x) => x);
      const steps = big ? [`要最大，十位放最大的数 ${Math.floor(v / 10)}`, `个位放剩下的数里最大的 ${v % 10}`, `最大的两位数是 ${v}`] : zero ? [`要最小，十位要放最小的数，但 0 不能放十位，所以十位放 ${nz[0]}`, '个位放 0', `最小的两位数是 ${v}`] : [`要最小，十位放最小的数 ${Math.floor(v / 10)}`, `个位放剩下的数里最小的 ${v % 10}`, `最小的两位数是 ${v}`];
      return { q: `${pre}，组成的${big ? '最大' : '最小'}的两位数是多少？`, answer: [num(v)], steps, hint: big ? '最大的数放在哪一位？' : '十位放什么最小？' };
    },
  },
  {
    id: 'g2a-combo-handshake', grade: 2, term: 1, unit: '数学广角——搭配（一）', name: '握手、比赛问题',
    tip: '每两人一次：一个一个往后数，不重复；互相送就要算两次', level: 3,
    gen(r) {
      const n = r.int(3, 6), ppl = n <= 4 ? `${r.names(n).join('、')} ${n} 人` : `${n} 个好朋友`;
      const T = [
        [`${ppl}见面，每两人握一次手，一共要握几次手？`, '次', '握手', false],
        [`${ppl}，每两人通一次电话，一共要通几次电话？`, '次', '通电话', false],
        [`${n} 支足球队进行比赛，每两队之间都要比赛一场，一共要比赛几场？`, '场', '比赛', false],
        [`${ppl}，每两人合拍一张照片，一共要拍几张？`, '张', '合拍', false],
        [`新年到了，${ppl}，每两人互相送一张贺卡，一共要送几张贺卡？`, '张', '送贺卡', true],
      ];
      const [q, u, verb, mutual] = r.pick(T);
      if (mutual) { const v = n * (n - 1); return { q, answer: [num(v, { unit: u })], steps: ['互相送：甲送给乙一张，乙也要送给甲一张，算 2 张', `每人要送给另外 ${n - 1} 人，送 ${n - 1} 张`, `${n} 个人就是 ${n} 个 ${n - 1}：${n - 1} × ${n} = ${v}（张）`, `答：一共要送 ${v} 张贺卡。`], hint: '每个人要送出几张？' }; }
      const seq = Array.from({ length: n - 1 }, (_, i) => n - 1 - i), v = seq.reduce((x, y) => x + y, 0);
      return { q, answer: [num(v, { unit: u })], steps: [`排好顺序，第 1 个和后面 ${n - 1} 个各${verb}一次：${n - 1} ${u}`, `第 2 个已经和第 1 个${verb}过了，再和后面 ${n - 2} 个各一次：${n - 2} ${u}`, '这样往后数，最后一个不用再数', `${seq.join(' + ')} = ${v}（${u}）`, `答：一共 ${v} ${u}。`], hint: '画一画、连一连，别重复数' };
    },
  },
  {
    id: 'g2a-combo-outfit', grade: 2, term: 1, unit: '数学广角——搭配（一）', name: '穿衣、路线搭配', process: true,
    tip: '每一个第一种都能和所有第二种搭配：几个几，用乘法', level: 3,
    gen(r) {
      const A = r.name(), a = r.int(2, 4), b = r.int(2, 4), v = a * b;
      const T = [
        [`${A}有 ${a} 件上衣、${b} 条裤子，一件上衣配一条裤子，一共有几种不同的穿法？`, `每件上衣都能配 ${b} 条裤子，有 ${b} 种穿法`, `${a} 件上衣`],
        [`从${A}家到学校有 ${a} 条路，从学校到图书馆有 ${b} 条路。从${A}家经过学校去图书馆，一共有几种不同的走法？`, `走家到学校的每一条路，到了学校都还有 ${b} 条路可选`, `家到学校的 ${a} 条路`],
        [`早餐有 ${a} 种饮料、${b} 种点心，选一种饮料配一种点心，一共有几种不同的搭配？`, `每种饮料都能配 ${b} 种点心`, `${a} 种饮料`],
        [`有 ${a} 顶帽子、${b} 条围巾，一顶帽子配一条围巾，一共有几种不同的戴法？`, `每顶帽子都能配 ${b} 条围巾`, `${a} 顶帽子`],
        [`有 ${a} 种不同的信封、${b} 种不同的邮票，一个信封贴一张邮票，一共有几种不同的贴法？`, `每种信封都能贴 ${b} 种邮票`, `${a} 种信封`],
      ];
      const [q, s1, s2] = r.pick(T);
      return { q, answer: [num(v, { unit: '种' })], steps: [s1, `${s2}，就是 ${a} 个 ${b}`, `${b} × ${a} = ${v}（种）`, `答：一共有 ${v} 种。`], hint: '先固定一样，看另一样有几种选法' };
    },
  },

  // ---------- 找规律（拓展） ----------
  {
    id: 'g2a-pattern-nth', grade: 2, term: 1, unit: '找规律', name: '按规律排列，第几个是什么',
    tip: '先找出几个一组，再用乘法口诀算出第几个落在哪一组的第几个', level: 3,
    gen(r) {
      let unit, show, opts, what;
      if (r.bool()) {
        const SH = ['○', '△', '□', '☆', '◇'], k = r.int(2, 4), [x, y] = r.sample(SH, 2);
        unit = k === 3 && r.chance(0.35) ? r.pick([[x, x, y], [x, y, y]]) : r.sample(SH, k);
        show = `按规律排列：${unit.join('').repeat(3)}…… 第 {n} 个是什么图形？`; what = '图形';
      } else {
        const CO = ['红', '黄', '蓝', '绿', '紫'], k = r.int(2, 4), [x, y] = r.sample(CO, 2);
        unit = k === 3 && r.chance(0.35) ? r.pick([[x, x, y], [x, y, y]]) : r.sample(CO, k);
        show = `一串珠子按「${unit.join('、')}」的顺序一直重复往下穿，第 {n} 颗是什么颜色？`; what = '颜色';
      }
      opts = [...new Set(unit)];
      const k = unit.length, n = r.int(k * 3 + 1, 30), g = Math.floor(n / k), rem = n % k, ans = unit[(n - 1) % k], cl = what === '颜色' ? '颗' : '个';
      return {
        q: show.replace('{n}', n), answer: [pick(opts, ans)],
        steps: [`${k} ${cl}一组：${unit.join(what === '颜色' ? '、' : '')} 重复出现`, `${k} × ${g} = ${k * g}，前 ${g} 组正好 ${k * g} ${cl}`, rem ? `第 ${n} ${cl}是第 ${g + 1} 组的第 ${rem} ${cl}，和每组第 ${rem} ${cl}一样，是「${ans}」` : `第 ${n} ${cl}正好是第 ${g} 组的最后一${cl}，是「${ans}」`],
        hint: '几个一组重复？',
      };
    },
  },

  // ======================= 二年级下册 =======================
  // ---------- 数据收集整理 ----------
  {
    id: 'g2b-data-tally', grade: 2, term: 2, unit: '数据收集整理', name: '画「正」字记数',
    tip: '一个「正」字 5 笔，表示 5；数的时候 5 个 5 个地数', level: 1,
    gen(r) {
      const TAL = ['', '一', '丅', '下', '止'], n = r.int(6, 28), k = Math.floor(n / 5), rem = n % 5, s = '正'.repeat(k) + TAL[rem];
      if (r.bool()) return { q: `用画「正」字的方法记录，「${s}」表示 {0}。`, answer: [num(n)], steps: ['一个「正」字有 5 笔，表示 5', `${k} 个「正」字表示 ${k} 个 5，是 ${5 * k}`, rem ? `后面的「${TAL[rem]}」有 ${rem} 笔，表示 ${rem}：${5 * k} + ${rem} = ${n}` : `正好是 ${n}`], hint: '一个「正」字表示几？' };
      return { q: `用画「正」字的方法记录 ${n}，要写 {0} 个完整的「正」字，再多写 {1} 笔。`, answer: [num(k), num(rem)], steps: ['一个「正」字有 5 笔，表示 5', `${n} 里面有 ${k} 个 5（5 × ${k} = ${5 * k}），写 ${k} 个「正」`, rem ? `还多 ${n} − ${5 * k} = ${rem}，再写 ${rem} 笔，记作「${s}」` : `正好写完，不用多写，记作「${s}」`], hint: '5 个 5 个地数' };
    },
  },
  {
    id: 'g2b-data-table', grade: 2, term: 2, unit: '数据收集整理', name: '看统计表回答问题',
    tip: '先看清表里每一项对应的数，再想用加法还是减法', level: 1,
    gen(r) {
      const CT = [
        { title: '二（1）班同学最喜欢的水果', head: '水果', items: ['苹果', '香蕉', '橘子', '葡萄', '西瓜', '草莓'], who: (x) => `喜欢${x}的`, most: '喜欢哪种水果的人最多？', least: '喜欢哪种水果的人最少？' },
        { title: '二（2）班同学最喜欢的运动', head: '运动', items: ['跳绳', '踢毽子', '拍球', '跑步', '游泳'], who: (x) => `喜欢${x}的`, most: '喜欢哪项运动的人最多？', least: '喜欢哪项运动的人最少？' },
        { title: '同学们最喜欢的动物', head: '动物', items: ['小狗', '小猫', '兔子', '熊猫', '金鱼'], who: (x) => `喜欢${x}的`, most: '喜欢哪种动物的人最多？', least: '喜欢哪种动物的人最少？' },
        { title: '同学们上学的方式', head: '方式', items: ['走路', '坐公交', '坐地铁', '骑车'], who: (x) => `${x}上学的`, most: '哪种上学方式的人最多？', least: '哪种上学方式的人最少？' },
        { title: '二（3）班同学最喜欢的颜色', head: '颜色', items: ['红色', '黄色', '蓝色', '绿色', '紫色'], who: (x) => `喜欢${x}的`, most: '喜欢哪种颜色的人最多？', least: '喜欢哪种颜色的人最少？' },
      ];
      const c = r.pick(CT), items = r.sample(c.items, 4), counts = r.sample([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 4), F = tableFig(c.title, c.head, items, counts, '人'), t = r.int(0, 3);
      if (t === 0) { const i = r.int(0, 3); return { q: `${c.who(items[i])}有多少人？`, fig: F, answer: [num(counts[i], { unit: '人' })], steps: [`在表里找到「${items[i]}」，看它下面的人数`, `${c.who(items[i])}有 ${counts[i]} 人`], hint: `先在表里找到「${items[i]}」` }; }
      if (t === 1) { const most = r.bool(), v = most ? Math.max(...counts) : Math.min(...counts), it = items[counts.indexOf(v)]; return { q: most ? c.most : c.least, fig: F, answer: [pick(items, it)], steps: [`比一比四个数：${counts.join('、')}`, `${most ? '最大' : '最小'}的是 ${v}，对应「${it}」`, `所以${most ? '最多' : '最少'}的是${it}`], hint: `找表里${most ? '最大' : '最小'}的数` }; }
      if (t === 2) { const [i, j] = r.sample([0, 1, 2, 3], 2), [hi, lo] = counts[i] > counts[j] ? [i, j] : [j, i], d = counts[hi] - counts[lo]; return { q: `${c.who(items[hi])}比${c.who(items[lo])}多多少人？`, fig: F, answer: [num(d, { unit: '人' })], steps: [`${c.who(items[hi])}有 ${counts[hi]} 人，${c.who(items[lo])}有 ${counts[lo]} 人`, `求多多少，用减法：${counts[hi]} − ${counts[lo]} = ${d}（人）`], hint: '求「多多少」用什么方法？' }; }
      const s = counts.reduce((x, y) => x + y, 0);
      return { q: '表里一共统计了多少人？', fig: F, answer: [num(s, { unit: '人' })], steps: ['把每一项的人数都加起来', `${counts.join(' + ')} = ${s}（人）`], hint: '把表里的数都加起来' };
    },
  },

  // ---------- 表内除法（一） ----------
  {
    id: 'g2b-share-each', grade: 2, term: 2, unit: '表内除法（一）', name: '平均分：每份有几个',
    tip: '平均分就是每份分得同样多；想「份数 × 几 = 总数」', level: 1,
    gen(r) {
      const k = r.int(2, 5), n = r.int(2, 6), tot = k * n, E = r.pick(EMO);
      const q = r.pick([`把 ${tot} 个${E}平均分给 ${k} 个小朋友，每人分 {0} 个。`, `把 ${tot} 个${E}平均放进 ${k} 个盘子里，每盘放 {0} 个。`, `把 ${tot} 个${E}平均分成 ${k} 份，每份 {0} 个。`]);
      return { q, fig: fig.items(E, tot, { perRow: 6, size: 34 }), answer: [num(n)], steps: [`平均分：${k} 份要分得同样多`, `可以一轮一轮地分，每轮每份放 1 个，${tot} 个正好分 ${n} 轮`, `也可以想口诀：${k} × ${n} = ${tot}（${kj(k, n)}）`, `所以每份 ${n} 个`], hint: `${k} 乘几等于 ${tot}？` };
    },
  },
  {
    id: 'g2b-share-groups', grade: 2, term: 2, unit: '表内除法（一）', name: '平均分：能分成几份',
    tip: '几个一份地分，看总数里有几个这样的「几」', level: 1,
    gen(r) {
      const k = r.int(2, 6), n = r.int(2, 5), tot = k * n, E = r.pick(EMO);
      const q = r.pick([`${tot} 个${E}，每 ${n} 个装一盘，可以装 {0} 盘。`, `${tot} 个${E}，每 ${n} 个分给一个小朋友，可以分给 {0} 个小朋友。`, `${tot} 个${E}，每 ${n} 个一份，可以分成 {0} 份。`]);
      return { q, fig: fig.items(E, tot, { perRow: 6, size: 34 }), answer: [num(k)], steps: [`每 ${n} 个圈一圈，看能圈几圈`, `想口诀：${n} × ${k} = ${tot}（${kj(n, k)}）`, `${tot} 里面有 ${k} 个 ${n}，所以能分 ${k} 份`], hint: `${tot} 里面有几个 ${n}？` };
    },
  },
  {
    id: 'g2b-share-judge', grade: 2, term: 2, unit: '表内除法（一）', name: '是不是平均分',
    tip: '每份分得同样多，才叫平均分', level: 1,
    gen(r) {
      const k = r.int(2, 4), n = r.int(2, 5), E = r.pick(EMO), even = r.bool(), cnt = Array(k).fill(n);
      if (!even) { const i = r.int(0, k - 1); cnt[i] += r.pick(n > 2 ? [-1, 1] : [1, 2]); }
      return {
        q: `${E}被分成了 ${k} 份，是平均分吗？`, fig: fig.groups(cnt.map((c) => [E, c]), { size: 30, perRow: 3 }),
        answer: [pick(['是', '不是'], even ? '是' : '不是')],
        steps: [`数一数每份：${cnt.join('、')} 个`, even ? '每份都同样多' : '每份不是同样多', even ? '所以是平均分' : '所以不是平均分'], hint: '每份一样多吗？',
      };
    },
  },
  {
    id: 'g2b-div-picture', grade: 2, term: 2, unit: '表内除法（一）', name: '看图写除法算式',
    tip: '总数 ÷ 份数 = 每份数；总数 ÷ 每份数 = 份数', level: 1,
    gen(r) {
      const k = r.int(2, 5), n = r.int(2, 6), tot = k * n, E = r.pick(EMO), F = fig.groups(Array.from({ length: k }, () => [E, n]), { size: 30, perRow: 3 });
      if (r.bool()) return { q: `把这些${E}平均分成 ${k} 份，每份几个？列式：{0} ÷ {1} = {2}`, fig: F, answer: [num(tot, { label: '被除数' }), num(k, { label: '除数' }), num(n, { label: '商' })], steps: [`一共有 ${tot} 个，平均分成 ${k} 份`, `求每份几个，用总数除以份数：${tot} ÷ ${k} = ${n}`, `想口诀：${kj(k, n)}`], hint: '先数一共有几个' };
      return { q: `这些${E}，每 ${n} 个一份，可以分成几份？列式：{0} ÷ {1} = {2}`, fig: F, answer: [num(tot, { label: '被除数' }), num(n, { label: '除数' }), num(k, { label: '商' })], steps: [`一共有 ${tot} 个，每 ${n} 个一份`, `求能分几份，就是求 ${tot} 里面有几个 ${n}：${tot} ÷ ${n} = ${k}`, `想口诀：${kj(n, k)}`], hint: '先数一共有几个' };
    },
  },
  {
    id: 'g2b-div-parts', grade: 2, term: 2, unit: '表内除法（一）', name: '除法算式的读法和名称',
    tip: '被除数 ÷ 除数 = 商；÷ 读作「除以」', level: 1,
    gen(r) {
      const d = r.int(2, 9), q = r.int(2, 9), p = d * q, t = r.int(0, 4), NM = ['被除数', '除数', '商', '积'];
      if (t <= 2) { const [x, v] = [[p, '被除数'], [d, '除数'], [q, '商']][t]; return { q: `在 ${p} ÷ ${d} = ${q} 中，${x} 叫做什么？`, answer: [pick(NM, v)], steps: ['除号前面的数叫被除数，除号后面的数叫除数，等号后面的得数叫商', `所以 ${x} 是${v}`], hint: '想一想它在除号的前面、后面，还是等号后面' }; }
      if (t === 3) return { q: `${p} ÷ ${d} 读作什么？`, answer: [pick(r.shuffle([`${p} 除以 ${d}`, `${d} 除以 ${p}`, `${p} 减 ${d}`]), `${p} 除以 ${d}`)], steps: ['÷ 读作「除以」，从左往右读', `${p} ÷ ${d} 读作「${p} 除以 ${d}」`], hint: '从左往右读' };
      return { q: `被除数是 ${p}，除数是 ${d}，商是 {0}。`, answer: [num(q)], steps: [`列式：${p} ÷ ${d}`, `想口诀「${kj(d, q)}」，商是 ${q}`], hint: '商是被除数除以除数的结果' };
    },
  },
  {
    id: 'g2b-div-from-mul', grade: 2, term: 2, unit: '表内除法（一）', name: '用乘法口诀求商',
    tip: '一句口诀可以算一道乘法和两道除法', level: 1,
    gen(r) {
      const [a, b] = r.until(() => [r.int(2, 9), r.int(2, 9)], ([x, y]) => x !== y), p = a * b;
      if (r.bool()) return { q: `根据 ${a} × ${b} = ${p}，写出两道除法：${p} ÷ ${a} = {0}，${p} ÷ ${b} = {1}`, answer: [num(b), num(a)], steps: [`${a} × ${b} = ${p}，${p} 平均分成 ${a} 份，每份是 ${b}`, `同样，${p} 平均分成 ${b} 份，每份是 ${a}`, `所以 ${p} ÷ ${a} = ${b}，${p} ÷ ${b} = ${a}`], hint: '用的是同一句口诀' };
      return { q: `用口诀「${kj(a, b)}」可以算出：${p} ÷ ${a} = {0}`, answer: [num(b)], steps: [`${kj(a, b)} 说的是 ${a} × ${b} = ${p}`, `所以 ${p} ÷ ${a} = ${b}`], hint: `${a} 乘几等于 ${p}？` };
    },
  },
  {
    id: 'g2b-div-oral-2to6', grade: 2, term: 2, unit: '表内除法（一）', name: '用 2~6 的口诀求商',
    tip: '求商想乘法：除数乘几等于被除数，商就是几', level: 1, speed: 5,
    gen(r) { return divOral(r, false); },
  },
  {
    id: 'g2b-div-word-each', grade: 2, term: 2, unit: '表内除法（一）', name: '平均分成几份，求每份是多少', process: true,
    tip: '把总数平均分成几份，求每份是多少，用除法：总数 ÷ 份数', level: 1,
    gen(r) {
      const A = r.name(), k = r.int(2, 9), n = r.int(2, 9), tot = k * n;
      const T = [
        [`${tot} 个苹果平均分给 ${k} 个小朋友，每人分几个？`, '个', `每人分 ${n} 个。`],
        [`${tot} 本书平均放在 ${k} 层书架上，每层放几本？`, '本', `每层放 ${n} 本。`],
        [`${A}用 ${tot} 元买了 ${k} 个同样的笔记本，每个笔记本多少元？`, '元', `每个笔记本 ${n} 元。`],
        [`${tot} 名同学平均分成 ${k} 组，每组几人？`, '人', `每组 ${n} 人。`],
        [`${tot} 朵花平均插在 ${k} 个花瓶里，每个花瓶插几朵？`, '朵', `每个花瓶插 ${n} 朵。`],
      ];
      const [q, u, ans] = r.pick(T);
      return { q, answer: [num(n, { unit: u })], steps: [`把 ${tot} 平均分成 ${k} 份，求每份是多少，用除法`, `${tot} ÷ ${k} = ${n}（${u}）`, `想口诀：${kj(k, n)}`, `答：${ans}`], hint: '是「平均分」吗？分成了几份？' };
    },
  },
  {
    id: 'g2b-div-word-groups', grade: 2, term: 2, unit: '表内除法（一）', name: '每几个一份，求能分几份', process: true,
    tip: '求总数里有几个「每份数」，用除法：总数 ÷ 每份数', level: 1,
    gen(r) {
      const A = r.name(), k = r.int(2, 9), n = r.int(2, 9), tot = k * n;
      const T = [
        [`有 ${tot} 个苹果，每 ${n} 个装一袋，可以装几袋？`, '袋', `可以装 ${k} 袋。`],
        [`${tot} 名同学去划船，每条船坐 ${n} 人，正好坐满。一共要几条船？`, '条', `一共要 ${k} 条船。`],
        [`有 ${tot} 朵花，每 ${n} 朵扎成一束，可以扎几束？`, '束', `可以扎 ${k} 束。`],
        [`一本故事书有 ${tot} 页，${A}每天看 ${n} 页，几天能看完？`, '天', `${k} 天能看完。`],
        [`${A}有 ${tot} 元，一支钢笔 ${n} 元，可以买几支？`, '支', `可以买 ${k} 支。`],
      ];
      const [q, u, ans] = r.pick(T);
      return { q, answer: [num(k, { unit: u })], steps: [`每 ${n} 个一份，求 ${tot} 里面有几个 ${n}，用除法`, `${tot} ÷ ${n} = ${k}（${u}）`, `想口诀：${kj(n, k)}`, `答：${ans}`], hint: '每份是几？要求的是份数还是每份数？' };
    },
  },

  // ---------- 表内除法（二） ----------
  {
    id: 'g2b-div-oral-7to9', grade: 2, term: 2, unit: '表内除法（二）', name: '用 7~9 的口诀求商',
    tip: '求商想乘法：除数乘几等于被除数，商就是几', level: 1, speed: 5,
    gen(r) { return divOral(r, true); },
  },
  {
    id: 'g2b-div-missing', grade: 2, term: 2, unit: '表内除法（二）', name: '乘除法算式里填几',
    tip: '被除数 = 商 × 除数；除数 = 被除数 ÷ 商；求因数用积 ÷ 另一个因数', level: 2,
    gen(r) {
      const d = r.int(2, 9), q = r.int(2, 9), p = d * q, t = r.int(0, 3);
      if (t === 0) return { q: `{0} ÷ ${d} = ${q}`, answer: [num(p)], steps: ['要求的是被除数', `被除数 = 商 × 除数：${q} × ${d} = ${p}`, `验算：${p} ÷ ${d} = ${q} ✓`], hint: '什么数平均分成几份，每份是商？' };
      if (t === 1) return { q: `${p} ÷ {0} = ${q}`, answer: [num(d)], steps: ['要求的是除数', `除数 = 被除数 ÷ 商：${p} ÷ ${q} = ${d}`, `想口诀：${kj(q, d)}`], hint: `${q} 乘几等于 ${p}？` };
      if (t === 2) return { q: `{0} × ${d} = ${p}`, answer: [num(q)], steps: ['要求的是一个因数', `因数 = 积 ÷ 另一个因数：${p} ÷ ${d} = ${q}`, `想口诀：${kj(q, d)}`], hint: `几乘 ${d} 等于 ${p}？` };
      return { q: `${d} × {0} = ${p}`, answer: [num(q)], steps: ['要求的是一个因数', `因数 = 积 ÷ 另一个因数：${p} ÷ ${d} = ${q}`, `想口诀：${kj(d, q)}`], hint: `${d} 乘几等于 ${p}？` };
    },
  },
  {
    id: 'g2b-mul-or-div-word', grade: 2, term: 2, unit: '表内除法（二）', name: '用乘法还是除法', process: true,
    tip: '求几个几用乘法；平均分求每份、求有几个几用除法', level: 2,
    gen(r) {
      const n = r.int(2, 9), k = r.int(2, 9), p = n * k;
      const A = r.name(), CX = r.pick([
        { u: '个', g: '盒', mul: `每盒装 ${n} 个球，${k} 盒一共有多少个球？`, each: `${p} 个球平均装进 ${k} 个盒子里，每盒装几个？`, grp: `${p} 个球，每 ${n} 个装一盒，要装几盒？`, ans: [`一共有 ${p} 个球。`, `每盒装 ${n} 个。`, `要装 ${k} 盒。`] },
        { u: '人', g: '组', mul: `同学们分组做游戏，每组 ${n} 人，有 ${k} 组，一共有多少人？`, each: `${p} 名同学平均分成 ${k} 组，每组几人？`, grp: `${p} 名同学，每 ${n} 人一组，可以分成几组？`, ans: [`一共有 ${p} 人。`, `每组 ${n} 人。`, `可以分成 ${k} 组。`] },
        { u: '本', g: '层', mul: `书架每层放 ${n} 本书，放了 ${k} 层，一共放了多少本？`, each: `${p} 本书平均放在 ${k} 层书架上，每层放几本？`, grp: `${p} 本书，每层书架放 ${n} 本，要放几层？`, ans: [`一共放了 ${p} 本。`, `每层放 ${n} 本。`, `要放 ${k} 层。`] },
        { u: '元', g: '个', mul: `一个笔记本 ${n} 元，${A}买了 ${k} 个，一共要多少元？`, each: `${A}用 ${p} 元买了 ${k} 个同样的笔记本，每个多少元？`, grp: `一个笔记本 ${n} 元，${A}有 ${p} 元，正好能买几个？`, ans: [`一共要 ${p} 元。`, `每个 ${n} 元。`, `正好能买 ${k} 个。`] },
      ]);
      const t = r.int(0, 2);
      if (t === 0) return { q: CX.mul, answer: [num(p, { unit: CX.u })], steps: [`求 ${k} 个 ${n} 是多少，用乘法`, `${n} × ${k} = ${p}（${CX.u}）`, `答：${CX.ans[0]}`], hint: '是求几个几，还是平均分？' };
      if (t === 1) return { q: CX.each, answer: [num(n, { unit: CX.u })], steps: [`把 ${p} 平均分成 ${k} 份，求每份是多少，用除法`, `${p} ÷ ${k} = ${n}（${CX.u}）`, `答：${CX.ans[1]}`], hint: '是求几个几，还是平均分？' };
      return { q: CX.grp, answer: [num(k, { unit: CX.g })], steps: [`求 ${p} 里面有几个 ${n}，用除法`, `${p} ÷ ${n} = ${k}（${CX.g}）`, `答：${CX.ans[2]}`], hint: '是求几个几，还是平均分？' };
    },
  },

  // ---------- 混合运算 ----------
  {
    id: 'g2b-mix-same', grade: 2, term: 2, unit: '混合运算', name: '同级运算（从左往右）',
    tip: '只有乘除（或只有加减）时，从左往右依次算', level: 1,
    gen(r) {
      const t = r.int(0, 2);
      let e, mid, v, s1, s2;
      if (t === 0) {
        const [a, b, c] = r.until(() => [r.int(2, 9), r.int(2, 9), r.int(2, 9)], ([x, y, z]) => (x * y) % z === 0 && (x * y) / z <= 9 && z !== x && z !== y);
        const p = a * b; v = p / c; e = `${a} × ${b} ÷ ${c}`; mid = `${p} ÷ ${c}`; s1 = `${a} × ${b} = ${p}`; s2 = `${p} ÷ ${c} = ${v}`;
      } else if (t === 1) {
        const b = r.int(2, 9), m = r.int(2, 9), c = r.int(2, 9), a = b * m; v = m * c; e = `${a} ÷ ${b} × ${c}`; mid = `${m} × ${c}`; s1 = `${a} ÷ ${b} = ${m}`; s2 = `${m} × ${c} = ${v}`;
      } else {
        const c = r.int(2, 4), k = r.int(1, Math.floor(9 / c)), m = c * k, b = r.until(() => r.int(2, 9), (x) => x * m <= 81 && x * m >= 10), a = b * m; v = k; e = `${a} ÷ ${b} ÷ ${c}`; mid = `${m} ÷ ${c}`; s1 = `${a} ÷ ${b} = ${m}`; s2 = `${m} ÷ ${c} = ${v}`;
      }
      return { q: `${e} = {0}`, answer: [num(v)], steps: ['只有乘法和除法，从左往右算', `先算 ${s1}`, `再算 ${s2}`, chain(e, mid, String(v))], hint: '从左往右，先算哪一步？' };
    },
  },
  {
    id: 'g2b-mix-two', grade: 2, term: 2, unit: '混合运算', name: '先乘除后加减',
    tip: '既有乘除又有加减，先算乘除，再算加减', level: 1,
    gen(r) {
      const t = r.int(0, 7), b = r.int(2, 9), c = r.int(2, 9), p = b * c, x = r.int(2, 9), y = r.int(2, 9), d = x * y; // 乘：b × c = p；除：d ÷ x = y
      let e, first, fv, rest, v;
      if (t <= 3) {
        const a = t === 1 ? r.int(p + 1, Math.min(99, p + 40)) : t === 3 ? r.int(1, p - 1) : r.int(5, 100 - p);
        [e, rest, v] = [[`${a} + ${b} × ${c}`, `${a} + ${p}`, a + p], [`${a} − ${b} × ${c}`, `${a} − ${p}`, a - p], [`${b} × ${c} + ${a}`, `${p} + ${a}`, p + a], [`${b} × ${c} − ${a}`, `${p} − ${a}`, p - a]][t];
        first = `${b} × ${c} = ${p}`; fv = '乘法';
      } else {
        const a = t === 5 ? r.int(y + 1, 99) : t === 7 ? r.int(1, y - 1) : r.int(5, 90);
        [e, rest, v] = [[`${a} + ${d} ÷ ${x}`, `${a} + ${y}`, a + y], [`${a} − ${d} ÷ ${x}`, `${a} − ${y}`, a - y], [`${d} ÷ ${x} + ${a}`, `${y} + ${a}`, y + a], [`${d} ÷ ${x} − ${a}`, `${y} − ${a}`, y - a]][t - 4];
        first = `${d} ÷ ${x} = ${y}`; fv = '除法';
      }
      return { q: `${e} = {0}`, answer: [num(v)], steps: [`有${fv}又有${/\+/.test(e) ? '加法' : '减法'}，先算${fv}`, `先算 ${first}`, `再算 ${rest} = ${v}`, chain(e, rest, String(v)), '易错：不能从左往右直接算'], hint: '先算哪一步？' };
    },
  },
  {
    id: 'g2b-mix-paren', grade: 2, term: 2, unit: '混合运算', name: '带小括号的混合运算',
    tip: '有小括号，先算小括号里面的', level: 1,
    gen(r) {
      const t = r.int(0, 5);
      let e, inner, iv, rest, v;
      if (t === 0) { const c = r.int(2, 9), q = r.int(2, 9), s = c * q, a = r.int(Math.max(1, s - 40), s - 1), b = s - a; e = `(${a} + ${b}) ÷ ${c}`; inner = `${a} + ${b}`; iv = s; rest = `${s} ÷ ${c}`; v = q; }
      else if (t === 1) { const c = r.int(2, 9), q = r.int(2, 9), s = c * q, b = r.int(3, 99 - s), a = s + b; e = `(${a} − ${b}) ÷ ${c}`; inner = `${a} − ${b}`; iv = s; rest = `${s} ÷ ${c}`; v = q; }
      else if (t === 2) { const c = r.int(2, 9), m = r.int(2, 9), b = r.int(5, 60), a = b + m; e = `${c} × (${a} − ${b})`; inner = `${a} − ${b}`; iv = m; rest = `${c} × ${m}`; v = c * m; }
      else if (t === 3) { const c = r.int(2, 9), m = r.int(3, 9), a = r.int(1, m - 1), b = m - a; e = `(${a} + ${b}) × ${c}`; inner = `${a} + ${b}`; iv = m; rest = `${m} × ${c}`; v = m * c; }
      else if (t === 4) { const a = r.int(50, 99), b = r.int(10, 30), c = r.int(5, a - b - 5); e = `${a} − (${b} + ${c})`; inner = `${b} + ${c}`; iv = b + c; rest = `${a} − ${b + c}`; v = a - b - c; }
      else { const m = r.int(3, 9), q = r.int(2, 9), b = r.int(1, m - 1), c = m - b, a = m * q; e = `${a} ÷ (${b} + ${c})`; inner = `${b} + ${c}`; iv = m; rest = `${a} ÷ ${m}`; v = q; }
      return { q: `${e} = {0}`, answer: [num(v)], steps: ['有小括号，先算小括号里面的', `先算 ${inner} = ${iv}`, `再算 ${rest} = ${v}`, chain(e, rest, String(v))], hint: '先算哪里？' };
    },
  },
  {
    id: 'g2b-mix-word', grade: 2, term: 2, unit: '混合运算', name: '两步解决问题（列综合算式）', process: true,
    tip: '先想第一步求什么，再想第二步；列成一个算式时，先算的要不要加小括号', level: 2,
    gen(r) {
      const A = r.name(), t = r.int(0, 4);
      if (t === 0) { const c = r.int(3, 9), q = r.int(3, 9), s = c * q, a = r.int(Math.ceil(s / 3), s - 3), b = s - a; return { q: `参加跳绳比赛的女生有 ${a} 人，男生有 ${b} 人。每 ${c} 人分一组，可以分成几组？`, answer: [num(q, { unit: '组' })], steps: [`先求一共有多少人：${a} + ${b} = ${s}（人）`, `再求能分几组：${s} ÷ ${c} = ${q}（组）`, `列成一个算式：(${a} + ${b}) ÷ ${c} = ${q}（组），先算的加法要加小括号`, `答：可以分成 ${q} 组。`], hint: '先算一共有多少人' }; }
      if (t === 1) { const n = r.int(2, 9), k = r.int(2, 9), a = r.pick([20, 50, 100].filter((x) => x > n * k)), v = a - n * k; return { q: `${A}有 ${a} 元，买了 ${k} 个本子，每个 ${n} 元。还剩多少元？`, answer: [num(v, { unit: '元' })], steps: [`先求买本子花了多少：${n} × ${k} = ${n * k}（元）`, `再求还剩多少：${a} − ${n * k} = ${v}（元）`, `列成一个算式：${a} − ${n} × ${k} = ${v}（元），先算乘法，不用加括号`, `答：还剩 ${v} 元。`], hint: '先算花了多少钱' }; }
      if (t === 2) { const c = r.int(2, 9), q = r.int(2, 9), s = c * q, b = r.int(2, Math.min(30, 99 - s)), a = s + b; return { q: `有 ${a} 个苹果，吃了 ${b} 个，剩下的平均分给 ${c} 个小朋友，每人分几个？`, answer: [num(q, { unit: '个' })], steps: [`先求剩下多少：${a} − ${b} = ${s}（个）`, `再平均分：${s} ÷ ${c} = ${q}（个）`, `列成一个算式：(${a} − ${b}) ÷ ${c} = ${q}（个），先算的减法要加小括号`, `答：每人分 ${q} 个。`], hint: '先算剩下多少个' }; }
      if (t === 3) { const n = r.int(2, 9), k = r.int(2, 9), c = r.int(1, 9), v = n * k + c; return { q: `${A}买了 ${k} 支铅笔，每支 ${n} 元，又买了一块 ${c} 元的橡皮。一共花了多少元？`, answer: [num(v, { unit: '元' })], steps: [`先求铅笔花了多少：${n} × ${k} = ${n * k}（元）`, `再加上橡皮：${n * k} + ${c} = ${v}（元）`, `列成一个算式：${n} × ${k} + ${c} = ${v}（元）`, `答：一共花了 ${v} 元。`], hint: '先算铅笔一共多少钱' }; }
      const n = r.int(2, 9), k = r.int(2, 9), a = r.int(n * k + 2, Math.min(99, n * k + 30)), v = a - n * k;
      return { q: `有 ${a} 个气球，${k} 个小朋友每人拿走 ${n} 个，还剩几个？`, answer: [num(v, { unit: '个' })], steps: [`先求一共拿走多少：${n} × ${k} = ${n * k}（个）`, `再求还剩多少：${a} − ${n * k} = ${v}（个）`, `列成一个算式：${a} − ${n} × ${k} = ${v}（个）`, `答：还剩 ${v} 个。`], hint: '先算一共拿走了多少' };
    },
  },

  // ---------- 有余数的除法 ----------
  {
    id: 'g2b-rem-meaning', grade: 2, term: 2, unit: '有余数的除法', name: '分一分，有剩余',
    tip: '平均分后还剩下的、不够再分一份的数，就是余数', level: 1,
    gen(r) {
      const d = r.int(2, 6), q = r.int(2, 5), rem = r.int(1, d - 1), n = d * q + rem, E = r.pick(EMO), each = r.bool();
      const q1 = each ? `${n} 个${E}，每 ${d} 个装一盘，可以装 {0} 盘，还剩 {1} 个。` : `${n} 个${E}平均分给 ${d} 个小朋友，每人分 {0} 个，还剩 {1} 个。`;
      return {
        q: q1, fig: fig.items(E, n, { perRow: 6, size: 34 }),
        answer: [num(q), num(rem)],
        steps: [each ? `每 ${d} 个圈一圈，圈了 ${q} 圈，还剩 ${rem} 个` : `一轮一轮地分，每轮每人 1 个，分了 ${q} 轮，还剩 ${rem} 个`, `列式：${n} ÷ ${d} = ${q} …… ${rem}`, `剩下的 ${rem} 个比 ${d} 少，不够再分了，${rem} 就是余数`],
        hint: '分完以后还剩几个？',
      };
    },
  },
  {
    id: 'g2b-rem-oral', grade: 2, term: 2, unit: '有余数的除法', name: '有余数的除法（口算）',
    tip: '想除数的几倍最接近被除数又不超过它，余数一定比除数小', level: 1, speed: 10,
    gen(r) {
      const d = r.int(2, 9), q = r.int(1, 9), rem = r.int(1, d - 1), n = d * q + rem;
      return { q: `${n} ÷ ${d} = {0} …… {1}`, answer: [num(q, { label: '商' }), num(rem, { label: '余数' })], steps: [`想：${d} 乘几最接近 ${n}，又不超过 ${n}？`, `${d} × ${q} = ${d * q}，${d} × ${q + 1} = ${d * (q + 1)} 就超过了`, `商 ${q}，余数 ${n} − ${d * q} = ${rem}`, `检查：余数 ${rem} < 除数 ${d} ✓`], hint: `${d} 的口诀里，哪个积最接近 ${n}？` };
    },
  },
  {
    id: 'g2b-rem-vertical', grade: 2, term: 2, unit: '有余数的除法', name: '有余数的除法（竖式）',
    tip: '试商：想除数的几倍最接近被除数；商写在被除数个位上面，余数一定要比除数小', level: 1,
    gen(r) {
      const d = r.int(2, 9), q = r.int(2, 9), rem = r.int(1, d - 1), n = d * q + rem;
      return { q: `用竖式计算：${n} ÷ ${d} = {0} …… {1}`, answer: [num(q, { label: '商' }), num(rem, { label: '余数' })], steps: [`试商：${d} × ${q} = ${d * q}，最接近 ${n} 又不超过它，商 ${q}`, `商 ${q} 写在被除数个位的上面，${d * q} 写在 ${n} 的下面`, `相减：${n} − ${d * q} = ${rem}，余数是 ${rem}`, vDiv(n, d), `检查：余数 ${rem} 比除数 ${d} 小 ✓`], hint: `想 ${d} 的口诀` };
    },
  },
  {
    id: 'g2b-rem-check', grade: 2, term: 2, unit: '有余数的除法', name: '余数要比除数小（判断对错）',
    tip: '余数比除数大或相等，说明商小了，还能再分', level: 1,
    gen(r) {
      const d = r.int(3, 9), q = r.int(2, 8), rem = r.int(1, d - 1), n = d * q + rem, t = r.int(0, 2);
      if (t === 0) return { q: `判断对错：${n} ÷ ${d} = ${q} …… ${rem}`, answer: [pick(TF, '√')], steps: [`验算：${q} × ${d} + ${rem} = ${n} ✓`, `余数 ${rem} 比除数 ${d} 小 ✓`, '所以是对的'], hint: '余数比除数小吗？' };
      if (t === 1) return { q: `判断对错：${n} ÷ ${d} = ${q - 1} …… ${rem + d}`, answer: [pick(TF, '×')], steps: [`余数 ${rem + d} 比除数 ${d} 还大，说明还能再分一份，商小了`, `正确的是：${n} ÷ ${d} = ${q} …… ${rem}`, '所以是错的'], hint: '余数比除数小吗？' };
      const wr = rem === d - 1 ? rem - 1 : rem + 1;
      return { q: `判断对错：${n} ÷ ${d} = ${q} …… ${wr}`, answer: [pick(TF, '×')], steps: [`验算：${q} × ${d} + ${wr} = ${d * q + wr}，不等于 ${n}`, `${n} − ${d * q} = ${rem}，余数应该是 ${rem}`, '所以是错的'], hint: '用「商 × 除数 + 余数」验算一下' };
    },
  },
  {
    id: 'g2b-rem-max', grade: 2, term: 2, unit: '有余数的除法', name: '余数最大是几',
    tip: '余数最大比除数小 1；反过来，除数最小比余数大 1', level: 2,
    gen(r) {
      const d = r.int(3, 9), q = r.int(2, 9), t = r.int(0, 2);
      if (t === 0) return { q: `□ ÷ ${d} = ${q} …… △，△ 最大是几？`, answer: [num(d - 1)], steps: ['余数一定要比除数小', `除数是 ${d}，比 ${d} 小的数里最大的是 ${d - 1}`, `所以 △ 最大是 ${d - 1}`], hint: '余数和除数比，谁大？' };
      if (t === 1) { const rem = r.int(2, 8); return { q: `□ ÷ △ = ${q} …… ${rem}，△ 最小是几？`, answer: [num(rem + 1)], steps: ['除数一定要比余数大', `余数是 ${rem}，比 ${rem} 大的数里最小的是 ${rem + 1}`, `所以 △ 最小是 ${rem + 1}`], hint: '除数一定比余数大' }; }
      const ok = r.sample(Array.from({ length: d - 1 }, (_, i) => i + 1), 3), bad = r.int(d, 9), opts = r.shuffle([...ok, bad]).map(String);
      return { q: `一个数除以 ${d}，余数不可能是下面哪个数？`, answer: [pick(opts, String(bad))], steps: [`除以 ${d}，余数只能比 ${d} 小，可能是 1 到 ${d - 1}`, `${bad} 不比 ${d} 小，不可能是余数`], hint: '余数要比除数小' };
    },
  },
  {
    id: 'g2b-rem-dividend', grade: 2, term: 2, unit: '有余数的除法', name: '被除数最大（最小）是几',
    tip: '被除数 = 商 × 除数 + 余数；余数最大取除数减 1，最小取 1', level: 2,
    gen(r) {
      const d = r.int(3, 9), q = r.int(2, 9), big = r.bool(), rem = big ? d - 1 : 1, v = d * q + rem;
      return { q: `□ ÷ ${d} = ${q} …… △（△ 不是 0），□ ${big ? '最大' : '最小'}是几？`, answer: [num(v)], steps: [big ? `余数最大是 ${d} − 1 = ${d - 1}` : '有余数，余数最小是 1', '被除数 = 商 × 除数 + 余数', `${q} × ${d} + ${rem} = ${v}`, `所以 □ ${big ? '最大' : '最小'}是 ${v}`], hint: big ? '余数最大能是几？' : '余数最小能是几？' };
    },
  },
  {
    id: 'g2b-rem-word', grade: 2, term: 2, unit: '有余数的除法', name: '有余数除法解决问题', process: true,
    tip: '用除法列式：商是分了几份（每份几个），余数是还剩几个', level: 1,
    gen(r) {
      const A = r.name(), t = r.int(0, 4), d = t === 1 ? r.int(3, 6) : r.int(3, 9), q = r.int(2, 9), rem = r.int(1, d - 1), n = d * q + rem;
      const T = [
        [`有 ${n} 个桃，每 ${d} 个装一盘，可以装几盘？还剩几个？`, '盘', '个', `可以装 ${q} 盘，还剩 ${rem} 个。`],
        [`用 ${n} 根小棒，每 ${d} 根摆一个${STICK[d]}，可以摆几个？还剩几根？`, '个', '根', `可以摆 ${q} 个，还剩 ${rem} 根。`],
        [`${n} 个同学做游戏，每 ${d} 人一组，可以分成几组？还剩几人？`, '组', '人', `可以分成 ${q} 组，还剩 ${rem} 人。`],
        [`${n} 块糖平均分给 ${d} 个小朋友，每人分几块？还剩几块？`, '块', '块', `每人分 ${q} 块，还剩 ${rem} 块。`],
        [`${A}有 ${n} 元，一本笔记本 ${d} 元，可以买几本？还剩几元？`, '本', '元', `可以买 ${q} 本，还剩 ${rem} 元。`],
      ];
      const [q1, u1, u2, ans] = T[t];
      return { q: q1, answer: [num(q, { unit: u1 }), num(rem, { unit: u2 })], steps: [`求 ${n} 里面有几个 ${d}，用除法`, `${n} ÷ ${d} = ${q}（${u1}）…… ${rem}（${u2}）`, `余数 ${rem} 比 ${d} 小 ✓`, `答：${ans}`], hint: '列除法算式，商和余数分别表示什么？' };
    },
  },
  {
    id: 'g2b-rem-ceil', grade: 2, term: 2, unit: '有余数的除法', name: '至少要几个（进一法）', process: true,
    tip: '剩下的也要安排，所以商要再加 1', level: 2,
    gen(r) {
      const A = r.name(), d = r.int(3, 9), q = r.int(2, 9), rem = r.int(1, d - 1), n = d * q + rem;
      const T = [
        [`${n} 名同学去划船，每条船最多坐 ${d} 人，至少需要几条船？`, '条', `剩下的 ${rem} 人也要坐船`, `至少需要 ${q + 1} 条船。`],
        [`有 ${n} 个苹果，每个袋子最多装 ${d} 个，至少需要几个袋子？`, '个', `剩下的 ${rem} 个苹果也要装`, `至少需要 ${q + 1} 个袋子。`],
        [`一本故事书有 ${n} 页，${A}每天看 ${d} 页，至少要几天才能看完？`, '天', `剩下的 ${rem} 页还要再看一天`, `至少要 ${q + 1} 天才能看完。`],
        [`有 ${n} 箱货物，一辆小货车每次最多运 ${d} 箱，至少要运几次？`, '次', `剩下的 ${rem} 箱还要再运一次`, `至少要运 ${q + 1} 次。`],
        [`${n} 名游客坐缆车，每个缆车厢最多坐 ${d} 人，至少需要几个车厢？`, '个', `剩下的 ${rem} 人也要坐`, `至少需要 ${q + 1} 个车厢。`],
      ];
      const [q1, u, why, ans] = r.pick(T);
      return { q: q1, answer: [num(q + 1, { unit: u })], steps: [`${n} ÷ ${d} = ${q}（${u}）…… ${rem}`, `${why}，所以要再加 1`, `${q} + 1 = ${q + 1}（${u}）`, `答：${ans}`], hint: '剩下的怎么办？' };
    },
  },
  {
    id: 'g2b-rem-floor', grade: 2, term: 2, unit: '有余数的除法', name: '最多能几个（去尾法）', process: true,
    tip: '剩下的不够再做一个，就不算，商就是答案', level: 2,
    gen(r) {
      const A = r.name(), t = r.int(0, 4), d = t === 4 ? r.int(3, 6) : r.int(3, 9), q = r.int(2, 9), rem = r.int(1, d - 1), n = d * q + rem;
      const T = [
        [`${A}有 ${n} 元，一本笔记本 ${d} 元，最多能买几本？`, '本', `剩下的 ${rem} 元不够再买一本`, `最多能买 ${q} 本。`],
        [`有 ${n} 米布，做一套衣服用 ${d} 米，最多能做几套？`, '套', `剩下的 ${rem} 米不够再做一套`, `最多能做 ${q} 套。`],
        [`有 ${n} 个鸡蛋，每 ${d} 个装一盒，最多能装满几盒？`, '盒', `剩下的 ${rem} 个装不满一盒`, `最多能装满 ${q} 盒。`],
        [`有 ${n} 朵花，每 ${d} 朵扎成一束，最多能扎几束？`, '束', `剩下的 ${rem} 朵不够再扎一束`, `最多能扎 ${q} 束。`],
        [`用 ${n} 根小棒，每 ${d} 根摆一个${STICK[d]}，最多能摆几个？`, '个', `剩下的 ${rem} 根不够再摆一个`, `最多能摆 ${q} 个。`],
      ];
      const [q1, u, why, ans] = T[t];
      return { q: q1, answer: [num(q, { unit: u })], steps: [`${n} ÷ ${d} = ${q}（${u}）…… ${rem}`, `${why}，不算`, `答：${ans}`], hint: '剩下的还够不够再来一个？' };
    },
  },
  {
    id: 'g2b-rem-period', grade: 2, term: 2, unit: '有余数的除法', name: '周期问题', process: true,
    tip: '先找几个一组，用「第几个 ÷ 每组个数」：余几就是一组里的第几个，没有余数就是一组的最后一个', level: 3,
    gen(r) {
      const t = r.int(0, 2);
      if (t === 0) {
        const W = ['一', '二', '三', '四', '五', '六', '日'], x = r.int(0, 6), days = r.int(8, 69), q = Math.floor(days / 7), rem = days % 7, v = W[(x + rem) % 7];
        const opts = r.shuffle([...new Set([v, W[(x + rem + 1) % 7], W[(x + rem + 6) % 7], W[x]])]).map((w) => `星期${w}`);
        return { q: `今天是星期${W[x]}，再过 ${days} 天是星期几？`, answer: [pick(opts, `星期${v}`)], steps: ['一个星期 7 天，每过 7 天，又是星期' + W[x], `${days} ÷ 7 = ${q} …… ${rem}`, rem ? `过了 ${q} 个星期还是星期${W[x]}，再往后数 ${rem} 天是星期${v}` : `正好 ${q} 个星期，还是星期${v}`], hint: '一个星期有几天？' };
      }
      const CO = ['红', '黄', '蓝', '绿', '紫'], k = r.int(3, 4), unit = r.chance(0.4) ? (() => { const [p1, p2, p3] = r.sample(CO, 3); return k === 3 ? [p1, p1, p2] : [p1, p1, p2, p3]; })() : r.sample(CO, k), n = r.int(k * 4 + 1, k * 10 - 1), q = Math.floor(n / k), rem = n % k; // 商不超过 9，用表内除法就能算
      if (t === 1) {
        const v = unit[(n - 1) % k];
        return { q: `一排彩灯按「${unit.join('、')}」的顺序重复排列，第 ${n} 盏是什么颜色？`, answer: [pick([...new Set(unit)], v)], steps: [`${k} 盏一组：${unit.join('、')}`, `${n} ÷ ${k} = ${q} …… ${rem}`, rem ? `余 ${rem}，第 ${n} 盏是第 ${q + 1} 组的第 ${rem} 盏，是${v}色` : `没有余数，第 ${n} 盏是第 ${q} 组的最后一盏，是${v}色`], hint: '几盏一组？' };
      }
      const c0 = unit[0], per = unit.filter((c) => c === c0).length, extra = unit.slice(0, rem).filter((c) => c === c0).length, v = q * per + extra;
      return { q: `一排彩灯按「${unit.join('、')}」的顺序重复排列，前 ${n} 盏里有几盏${c0}灯？`, answer: [num(v, { unit: '盏' })], steps: [`${k} 盏一组，每组有 ${per} 盏${c0}灯`, `${n} ÷ ${k} = ${q} …… ${rem}，有 ${q} 个整组${rem ? `，还多 ${rem} 盏` : ''}`, `整组里的${c0}灯：${per} × ${q} = ${q * per}（盏）`, rem ? `多出来的 ${rem} 盏是「${unit.slice(0, rem).join('、')}」，里面有 ${extra} 盏${c0}灯：${q * per} + ${extra} = ${v}（盏）` : `正好整组，一共 ${v} 盏`], hint: '先算有几个整组' };
    },
  },

  // ---------- 万以内数的认识 ----------
  {
    id: 'g2b-num-read', grade: 2, term: 2, unit: '万以内数的认识', name: '万以内数的读法',
    tip: '从高位读起；中间有一个 0 或连着几个 0，只读一个「零」；末尾的 0 都不读', level: 1,
    gen(r) {
      const n = numZ(r, r.chance(0.8) ? 4 : 3), right = readInt(n), str = String(n), cands = new Set();
      if (right.includes('零')) cands.add(right.replace(/零/g, ''));
      if (n % 10 === 0) cands.add(right + '零');
      for (let i = 0; i < 8 && cands.size < 6; i++) { const a = r.shuffle(str.split('')); if (a[0] !== '0') cands.add(readInt(Number(a.join('')))); }
      for (const dd of [1, 10, 100, -1, -10]) cands.add(readInt(n + dd));
      cands.delete(right);
      const opts = r.shuffle([right, ...r.sample([...cands], 3)]), mid = /0/.test(str.replace(/0+$/, '')), tail = /0$/.test(str);
      return {
        q: `${n} 读作什么？`, answer: [pick(opts, right)],
        steps: ['从最高位读起，千位上是几就读几千，百位上是几就读几百……', ...(mid ? ['中间的 0 要读，连着几个 0 也只读一个「零」'] : []), ...(tail ? ['末尾的 0 都不读'] : []), `所以 ${n} 读作：${right}`],
        hint: '中间的 0 和末尾的 0 怎么读？',
      };
    },
  },
  {
    id: 'g2b-num-write', grade: 2, term: 2, unit: '万以内数的认识', name: '万以内数的写法',
    tip: '从高位写起，几千就在千位写几；哪一位一个也没有，就写 0 占位', level: 1,
    gen(r) {
      const n = numZ(r, r.chance(0.8) ? 4 : 3), ds = String(n).split('').map(Number), len = ds.length;
      const holes = ds.map((d, i) => (d === 0 ? PL[len - 1 - i] + '位' : null)).filter(Boolean);
      return { q: `${readInt(n)} 写作 {0}`, answer: [num(n)], steps: ['从高位写起，读到几千就在千位写几，读到几百就在百位写几……', holes.length ? `${holes.join('、')}一个单位也没有，写 0 占位` : '每一位上都有数，照着写', `写作：${n}`], hint: '先想一想它是几位数' };
    },
  },
  {
    id: 'g2b-num-compose', grade: 2, term: 2, unit: '万以内数的认识', name: '数的组成',
    tip: '千位上是几就是几个千，百位上是几就是几个百；10 个一百是一千，10 个一千是一万', level: 1,
    gen(r) {
      const t = r.int(0, 4);
      if (t === 4) {
        const L = [['10 个一百是 {0}', 1000, '一百一百地数，数 10 个是一千'], ['10 个一千是 {0}', 10000, '一千一千地数，数 10 个是一万'], ['10 个十是 {0}', 100, '十个十个地数，数 10 个是一百'], ['1000 里面有 {0} 个百', 10, '10 个一百是一千'], ['10000 里面有 {0} 个千', 10, '10 个一千是一万']];
        const k = r.int(2, 9), u = r.pick([['百', 100], ['千', 1000]]);
        const [q, v, why] = r.chance(0.5) ? r.pick(L) : [`${k} 个${u[0]}是 {0}`, k * u[1], `${k} 个${u[0]}就是在${u[0]}位上写 ${k}，后面的位写 0`];
        return { q, answer: [num(v)], steps: [why, `所以填 ${v}`], hint: '一个一个计数单位地数一数' };
      }
      const n = numZ(r, 4), ds = String(n).split('').map(Number), U = ['千', '百', '十', '一'];
      if (t <= 1) return { q: `${n} 里面有 {0} 个千、{1} 个百、{2} 个十和 {3} 个一。`, answer: ds.map((d) => num(d)), steps: [`千位上是 ${ds[0]}，百位上是 ${ds[1]}，十位上是 ${ds[2]}，个位上是 ${ds[3]}`, `所以是 ${ds[0]} 个千、${ds[1]} 个百、${ds[2]} 个十和 ${ds[3]} 个一`], hint: '每一位上是几？' };
      let parts = ds.map((d, i) => (d ? `${d} 个${U[i]}` : null)).filter(Boolean);
      const shuffled = parts.length > 1 && r.chance(0.3);
      if (shuffled) parts = r.shuffle(parts);
      const txt = parts.length > 1 ? parts.slice(0, -1).join('、') + '和 ' + parts[parts.length - 1] : parts[0];
      const holes = ds.map((d, i) => (d === 0 ? `${U[i] === '一' ? '个' : U[i]}位` : null)).filter(Boolean);
      return { q: `由 ${txt}组成的数是 {0}。`, answer: [num(n)], steps: [shuffled ? '注意顺序被打乱了，先按千、百、十、一的顺序排好' : '按千、百、十、一的顺序，几个千就在千位写几……', holes.length ? `${holes.join('、')}一个也没有，写 0 占位` : '每一位都有数', `组成的数是 ${n}`], hint: '最高位是什么位？' };
    },
  },
  {
    id: 'g2b-num-place', grade: 2, term: 2, unit: '万以内数的认识', name: '数位和每一位上的数',
    tip: '从右边起：个位、十位、百位、千位、万位；数字在哪一位，就表示几个那一位的单位', level: 1,
    gen(r) {
      const t = r.int(0, 4);
      if (t === 4) { const k = r.int(1, 5); return { q: `从右边起，第 ${k} 位是什么位？`, answer: [pick(['个位', '十位', '百位', '千位', '万位'], PL[k - 1] + '位')], steps: ['从右边起，依次是个位、十位、百位、千位、万位', `第 ${k} 位是${PL[k - 1]}位`], hint: '从右往左数' }; }
      const n = r.until(() => numZ(r, 4), (x) => new Set(String(x).replace(/0/g, '').split('')).size === String(x).replace(/0/g, '').length);
      const ds = String(n).split(''), idx = r.pick(ds.map((d, i) => (d !== '0' ? i : -1)).filter((i) => i >= 0)), dg = ds[idx], pl = PL[3 - idx];
      if (t <= 1) return { q: `${n} 中的「${dg}」在什么位上？`, answer: [pick(['千位', '百位', '十位', '个位'], pl + '位')], steps: [`从右边数起，${dg} 是第 ${4 - idx} 位`, `第 ${4 - idx} 位是${pl}位`], hint: '从右边起数一数' };
      const u = pl === '个' ? '一' : pl;
      return { q: `${n} 中的「${dg}」表示 ${dg} 个什么？`, answer: [pick(['千', '百', '十', '一'], u)], steps: [`${dg} 在${pl}位上`, `${pl}位上是几，就表示几个${u}`, `所以表示 ${dg} 个${u}`], hint: '先看它在哪一位' };
    },
  },
  {
    id: 'g2b-num-compare', grade: 2, term: 2, unit: '万以内数的认识', name: '万以内数比大小',
    tip: '位数不同，位数多的大；位数相同，从最高位比起，相同就比下一位', level: 1,
    gen(r) {
      let a = numZ(r, 4), b;
      const t = r.int(0, 9);
      if (t < 5) { const ds = String(a).split(''), p = r.int(1, 3); let nd; do { nd = String(r.int(0, 9)); } while (nd === ds[p]); ds[p] = nd; b = Number(ds.join('')); }
      else if (t < 7) b = numZ(r, 3);
      else if (t < 8) b = a;
      else b = numZ(r, 4);
      if (r.bool()) [a, b] = [b, a];
      const sa = String(a), sb = String(b), sg = sign(a, b);
      let why;
      if (sa.length !== sb.length) why = [`${a} 是${sa.length === 4 ? '四' : '三'}位数，${b} 是${sb.length === 4 ? '四' : '三'}位数`, '位数多的数大'];
      else if (a === b) why = ['两个数每一位都一样', '所以相等'];
      else { let i = 0; while (sa[i] === sb[i]) i++; const pl = PL[sa.length - 1 - i]; why = [`位数相同，从最高位比起${i ? `，前面${i === 1 ? '' : '几位'}都一样` : ''}`, `${pl}位上 ${sa[i]} ${sa[i] > sb[i] ? '>' : '<'} ${sb[i]}`]; }
      return { q: `${a} ○ ${b}`, answer: [pick(CMP, sg)], steps: [...why, `所以 ${a} ${sg} ${b}`], hint: '先看位数，再从最高位比' };
    },
  },
  {
    id: 'g2b-num-order', grade: 2, term: 2, unit: '万以内数的认识', name: '数的顺序',
    tip: '后一个数多 1，前一个数少 1；注意 999、1000 这种要进位、退位的地方', level: 1,
    gen(r) {
      const t = r.int(0, 3);
      if (t === 3) {
        const L = [['最大的三位数是 {0}', 999, '三位数每一位都是 9 时最大'], ['最小的四位数是 {0}', 1000, '四位数千位最小是 1，其他位是 0'], ['最大的四位数是 {0}', 9999, '四位数每一位都是 9 时最大'], ['最小的三位数是 {0}', 100, '三位数百位最小是 1，其他位是 0'], ['最大的三位数比最小的四位数少 {0}', 1, '999 再加 1 就是 1000'], ['最大的四位数再加 1 是 {0}', 10000, '9999 + 1 = 10000，读作一万'], ['最小的四位数比最大的三位数多 {0}', 1, '1000 − 999 = 1']];
        const [q, v, why] = r.pick(L);
        return { q, answer: [num(v)], steps: [why, `所以填 ${v}`], hint: '想一想几位数最大、最小是什么样' };
      }
      if (t === 2) {
        const [st, nm] = r.pick([[10, '十个十个'], [100, '一百一百'], [1000, '一千一千']]), a = st === 1000 ? r.int(1, 8) * 1000 : st === 100 ? r.int(1, 98) * 100 : r.int(10, 998) * 10;
        return { q: `${nm}地数，${a} 后面的一个数是 {0}。`, answer: [num(a + st)], steps: [`${nm}地数，每次多 ${st}`, `${a} + ${st} = ${a + st}`], hint: `每次多几？` };
      }
      const n = r.pick([r.int(1, 9) * 1000 + 999, r.int(1, 9) * 1000, r.int(11, 99) * 100, r.int(10, 99) * 100 + 99, numZ(r, 4)].filter((x) => x > 100 && x < 9999)), before = r.bool();
      if (t === 1) return { q: `与 ${n} 相邻的两个数是 {0} 和 {1}。`, answer: [num(n - 1), num(n + 1)], steps: ['相邻的两个数：一个比它少 1，一个比它多 1', `${n} − 1 = ${n - 1}，${n} + 1 = ${n + 1}`], hint: '比它少 1 和多 1 的数' };
      return { q: `${n} ${before ? '前面' : '后面'}的一个数是 {0}。`, answer: [num(before ? n - 1 : n + 1)], steps: [`${before ? '前面的数比它少 1' : '后面的数比它多 1'}`, `${n} ${before ? '−' : '+'} 1 = ${before ? n - 1 : n + 1}`], hint: before ? '少 1 是多少？' : '多 1 是多少？' };
    },
  },
  {
    id: 'g2b-num-approx', grade: 2, term: 2, unit: '万以内数的认识', name: '近似数',
    tip: '看这个数在哪两个整百（整千）数之间，离哪个近就接近哪个', level: 2,
    gen(r) {
      const th = r.bool(), st = th ? 1000 : 100, h = r.int(1, 8), off = r.until(() => r.int(1, st - 1), (x) => x !== st / 2 && (th ? x % 10 !== 0 || r.bool() : true)), n = h * st + off;
      const lo = h * st, hi = lo + st, v = off < st / 2 ? lo : hi, nm = th ? '整千数' : '整百数';
      return { q: `${n} 接近哪个${nm}？${n} ≈ {0}`, answer: [num(v)], steps: [`${n} 在 ${lo} 和 ${hi} 之间`, `离 ${lo} 差 ${n - lo}，离 ${hi} 差 ${hi - n}`, `离 ${v} 更近，所以 ${n} ≈ ${v}`], hint: `${n} 在哪两个${nm}之间？` };
    },
  },
  {
    id: 'g2b-num-maxmin', grade: 2, term: 2, unit: '万以内数的认识', name: '用数字卡片组成最大、最小的数',
    tip: '最大：大的数放高位；最小：小的数放高位，但 0 不能放在最高位', level: 2,
    gen(r) {
      const zero = r.chance(0.5), ds = zero ? [0, ...r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 3)] : r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 4);
      const desc = [...ds].sort((x, y) => y - x), asc = [...ds].sort((x, y) => x - y);
      if (asc[0] === 0) [asc[0], asc[1]] = [asc[1], asc[0]];
      const mx = Number(desc.join('')), mn = Number(asc.join(''));
      return { q: `用 ${r.shuffle(ds).join('、')} 四张数字卡片组成四位数，最大的是 {0}，最小的是 {1}。`, answer: [num(mx, { label: '最大' }), num(mn, { label: '最小' })], steps: ['最大：从大到小依次放在千位、百位、十位、个位', `最大的是 ${mx}`, zero ? `最小：0 不能放在千位，千位放最小的非 0 数 ${asc[0]}，后面再从小到大放：${mn}` : `最小：从小到大依次放，最小的是 ${mn}`], hint: '最高位放什么？' };
    },
  },
  {
    id: 'g2b-num-abacus', grade: 2, term: 2, unit: '万以内数的认识', name: '看计数器写数',
    tip: '每一位有几颗珠子就写几，没有珠子的位写 0', level: 1,
    gen(r) {
      const n = numZ(r, r.chance(0.8) ? 4 : 3), ds = String(n).split('').map(Number), len = ds.length;
      const desc = ds.map((d, i) => `${PL[len - 1 - i]}位 ${d} 颗`).join('，');
      return { q: '计数器上表示的数是 {0}。', fig: abacusFig(ds), answer: [num(n)], steps: [`从高位看起：${desc}`, ds.includes(0) ? '没有珠子的位写 0' : '每一位都有珠子', `写作 ${n}，读作${readInt(n)}`], hint: '每一位上有几颗珠子？' };
    },
  },
  {
    id: 'g2b-num-round-add', grade: 2, term: 2, unit: '万以内数的认识', name: '整百、整千数加减法',
    tip: '把整百数看成几个百、整千数看成几个千来算', level: 1, speed: 6,
    gen(r) {
      const t = r.int(0, 3);
      let a, b, op, u, ua, ub;
      if (t === 0) { u = 100; [ua, ub] = [r.int(1, 9), r.int(1, 9)]; op = r.bool() ? '+' : '−'; }
      else if (t === 1) { u = 1000; [ua, ub] = [r.int(1, 9), r.int(1, 9)]; op = r.bool() || ua + ub > 10 ? '−' : '+'; if (op === '+' && ua + ub > 10) op = '−'; }
      else if (t === 2) { const k = r.int(1, 3); a = k * 1000; b = r.int(1, 9) * 100; return { q: `${a} − ${b} = {0}`, answer: [num(a - b)], steps: [`${a} 是 ${k * 10} 个百，${b} 是 ${b / 100} 个百`, `${k * 10} 个百 − ${b / 100} 个百 = ${k * 10 - b / 100} 个百`, `${k * 10 - b / 100} 个百是 ${a - b}`], hint: `${a} 里面有几个百？` }; }
      else { a = r.int(1, 9) * 1000; b = r.int(1, 9) * 100; return { q: `${a} + ${b} = {0}`, answer: [num(a + b)], steps: [`${a / 1000} 个千和 ${b / 100} 个百合起来`, `千位写 ${a / 1000}，百位写 ${b / 100}，是 ${a + b}`], hint: '几个千和几个百' }; }
      if (op === '−' && ua < ub) [ua, ub] = [ub, ua];
      if (op === '−' && ua === ub) ua += 1;
      a = ua * u; b = ub * u;
      const rv = op === '+' ? ua + ub : ua - ub, v = rv * u, nm = u === 100 ? '百' : '千';
      return { q: `${a} ${op} ${b} = {0}`, answer: [num(v)], steps: [`把 ${a} 看成 ${ua} 个${nm}，${b} 看成 ${ub} 个${nm}`, `${ua} 个${nm} ${op} ${ub} 个${nm} = ${rv} 个${nm}`, `${rv} 个${nm}是 ${v}`], hint: `想一想几个${nm}` };
    },
  },
  {
    id: 'g2b-num-estimate', grade: 2, term: 2, unit: '万以内数的认识', name: '加减法估算',
    tip: '先把每个数看成和它接近的整百数，再算', level: 2,
    gen(r) {
      const op = r.bool() ? '+' : '−', A0 = r.name();
      const near = () => { const h = r.int(1, 8) * 100; return [h + r.pick([-1, 1]) * r.int(1, 15), h]; };
      const [[a, A], [b, B]] = r.until(() => [near(), near()], ([[x, X], [y, Y]]) => (op === '+' ? X + Y <= 1000 : X > Y));
      const v = op === '+' ? A + B : A - B;
      const ctx = op === '+'
        ? r.pick([[`学校有男生 ${a} 人，女生 ${b} 人，大约一共有多少人？`, '人'], [`${A0}家买电视花了 ${a} 元，买电风扇花了 ${b} 元，大约一共花了多少元？`, '元'], [`估一估：${a} + ${b} 大约是多少？`]])
        : r.pick([[`一本书有 ${a} 页，${A0}已经看了 ${b} 页，大约还剩多少页？`, '页'], [`图书馆有 ${a} 本故事书，借出 ${b} 本，大约还剩多少本？`, '本'], [`估一估：${a} − ${b} 大约是多少？`]]);
      return { q: ctx[0], answer: [num(v, ctx[1] ? { unit: ctx[1] } : {})], steps: [`${a} 接近 ${A}，${b} 接近 ${B}`, `${A} ${op} ${B} = ${v}`, `所以大约是 ${v}`], hint: '每个数接近哪个整百数？' };
    },
  },

  // ---------- 克和千克 ----------
  {
    id: 'g2b-mass-unit', grade: 2, term: 2, unit: '克和千克', name: '填合适的质量单位',
    tip: '1 克很轻，大约一枚回形针那么重；1 千克大约是两袋 500 克的盐那么重', level: 1,
    gen(r) {
      const L = [
        ['一个鸡蛋约重', [50, 60], '克'], ['一个苹果约重', [200, 250], '克'], ['一枚 1 元硬币约重', [6, 6], '克'], ['一袋盐重', [500, 500], '克'], ['一支铅笔约重', [5, 10], '克'], ['一块橡皮约重', [10, 20], '克'],
        ['一个梨约重', [200, 300], '克'], ['一盒牛奶约重', [250, 250], '克'], ['一颗草莓约重', [15, 25], '克'], ['一本数学书约重', [200, 300], '克'], ['一个乒乓球约重', [3, 3], '克'],
        ['一袋大米重', [10, 25], '千克'], [`${r.name()}的体重约`, [25, 35], '千克'], ['一个西瓜约重', [3, 6], '千克'], ['一只小狗约重', [5, 10], '千克'], ['一头猪约重', [100, 150], '千克'],
        ['一桶油重', [5, 5], '千克'], ['一个书包约重', [2, 3], '千克'], ['一只鸡约重', [2, 3], '千克'], ['一台电视机约重', [15, 30], '千克'], ['一个南瓜约重', [3, 8], '千克'],
      ];
      const [what, [lo, hi], u] = r.pick(L), v = hi >= 100 ? r.step(lo, hi, 10) : r.int(lo, hi);
      return { q: `${what} ${v}（ ）`, answer: [pick(['克', '千克'], u)], steps: [u === '克' ? `${v} 千克比好几袋大米还重，太重了` : `${v} 克才几个回形针那么重，太轻了`, `所以填「${u}」：${what} ${v} ${u}`], hint: '把两个单位都放进去读一读，哪个合理？' };
    },
  },
  {
    id: 'g2b-mass-convert', grade: 2, term: 2, unit: '克和千克', name: '克和千克的换算',
    tip: '1 千克 = 1000 克', level: 1, speed: 10,
    gen(r) {
      const t = r.int(0, 4), k = r.int(1, 9);
      if (t === 0) return { q: `${k} 千克 = {0} 克`, answer: [num(k * 1000)], steps: ['1 千克 = 1000 克', `${k} 千克就是 ${k} 个 1000 克，是 ${k * 1000} 克`], hint: '1 千克是多少克？' };
      if (t === 1) return { q: `${k * 1000} 克 = {0} 千克`, answer: [num(k)], steps: ['1000 克 = 1 千克', `${k * 1000} 克里有 ${k} 个 1000 克，是 ${k} 千克`], hint: '有几个 1000 克？' };
      const g = r.int(1, 9) * 100;
      if (t === 2) return { q: `1 千克 − ${g} 克 = {0} 克`, answer: [num(1000 - g)], steps: ['单位不一样，先把 1 千克换成 1000 克', `1000 − ${g} = ${1000 - g}`, `所以是 ${1000 - g} 克`], hint: '先把 1 千克换成克' };
      if (t === 3) return { q: `${g} 克 + {0} 克 = 1 千克`, answer: [num(1000 - g)], steps: ['1 千克 = 1000 克', `${g} 再加几是 1000？1000 − ${g} = ${1000 - g}`], hint: '1 千克 = 1000 克' };
      const [w, n, bag, thing] = r.pick([[500, 2, '袋', '盐'], [250, 4, '盒', '牛奶'], [200, 5, '袋', '饼干'], [100, 10, '袋', '糖']]);
      return { q: `{0} ${bag} ${w} 克的${thing}合起来重 1 千克。`, answer: [num(n)], steps: ['1 千克 = 1000 克', `${w} 克一${bag}，${n} ${bag}是 ${w * n} 克，正好 1 千克`], hint: `几个 ${w} 是 1000？` };
    },
  },
  {
    id: 'g2b-mass-compare', grade: 2, term: 2, unit: '克和千克', name: '质量比大小',
    tip: '先把千克换成克，单位一样了再比', level: 1,
    gen(r) {
      const t = r.int(0, 5);
      if (t === 5) { const [x, y] = r.pick([['棉花', '铁'], ['羽毛', '石头'], ['纸', '铁']]); return { q: `1 千克${x} ○ 1 千克${y}`, answer: [pick(CMP, '=')], steps: [`都是 1 千克，一样重`, `别被${y}「看起来重」骗了，比的是千克数`], hint: '看数和单位，不看是什么东西' }; }
      if (t === 4) { const a = r.int(1, 9) * 100, b = r.pick([1000 - a, 1000 - a, r.int(1, 9) * 100]), s = a + b; return { q: `${a} 克 + ${b} 克 ○ 1 千克`, answer: [pick(CMP, sign(s, 1000))], steps: [`先算左边：${a} + ${b} = ${s}（克）`, '1 千克 = 1000 克', `${s} 克 ${sign(s, 1000)} 1000 克`], hint: '先算左边一共多少克' }; }
      const k = r.int(1, 5), g = k * 1000 + r.pick([0, -1, -10, -100, -200, 1, 10, 100, 200]);
      const [L, R, l, rr] = t <= 1 ? [`${k} 千克`, `${g} 克`, k * 1000, g] : [`${g} 克`, `${k} 千克`, g, k * 1000];
      return { q: `${L} ○ ${R}`, answer: [pick(CMP, sign(l, rr))], steps: [`先换：${k} 千克 = ${k * 1000} 克`, `${l} 克 ${sign(l, rr)} ${rr} 克`, `所以 ${L} ${sign(l, rr)} ${R}`], hint: `${k} 千克是多少克？` };
    },
  },
  {
    id: 'g2b-mass-word', grade: 2, term: 2, unit: '克和千克', name: '克和千克解决问题', process: true,
    tip: '单位不一样时，先把千克换成克再算', level: 2,
    gen(r) {
      const A = r.name(), t = r.int(0, 4), k = r.int(1, 3), g = r.int(2, 8) * 100;
      if (t === 0) { const n = r.int(2, 9); return { q: `妈妈买了 ${n} 袋盐，每袋 500 克。一共重多少克？`, answer: [num(500 * n, { unit: '克' })], steps: [`求 ${n} 个 500 克是多少，用乘法`, `500 × ${n}：5 个百 × ${n} = ${5 * n} 个百，是 ${500 * n}`, `答：一共重 ${500 * n} 克。`], hint: '500 是几个百？' }; }
      if (t === 1) return { q: `一个书包重 ${k} 千克，一个文具盒重 ${g} 克。书包比文具盒重多少克？`, answer: [num(k * 1000 - g, { unit: '克' })], steps: [`单位不一样，先换：${k} 千克 = ${k * 1000} 克`, `求重多少，用减法：${k * 1000} − ${g} = ${k * 1000 - g}（克）`, `答：书包比文具盒重 ${k * 1000 - g} 克。`], hint: '先把千克换成克' };
      if (t === 2) return { q: `${A}买了 ${k} 千克苹果和 ${g} 克葡萄。一共买了多少克水果？`, answer: [num(k * 1000 + g, { unit: '克' })], steps: [`单位不一样，先换：${k} 千克 = ${k * 1000} 克`, `${k * 1000} + ${g} = ${k * 1000 + g}（克）`, `答：一共买了 ${k * 1000 + g} 克水果。`], hint: '先把千克换成克' };
      if (t === 3) { const n = r.int(2, 4), each = r.int(1, Math.min(3, Math.floor(9 / n))) * 100; return { q: `${n} 个同样的苹果一共重 ${n * each} 克，平均每个苹果重多少克？`, answer: [num(each, { unit: '克' })], steps: [`把 ${n * each} 克平均分成 ${n} 份，用除法`, `${n * each} 是 ${n * each / 100} 个百，${n * each / 100} 个百 ÷ ${n} = ${each / 100} 个百`, `${n * each} ÷ ${n} = ${each}（克）`, `答：平均每个重 ${each} 克。`], hint: '平均分，用什么方法？' }; }
      return { q: `一个西瓜重 ${k + 2} 千克，一个哈密瓜比它轻 ${g} 克。哈密瓜重多少克？`, answer: [num((k + 2) * 1000 - g, { unit: '克' })], steps: [`单位不一样，先换：${k + 2} 千克 = ${(k + 2) * 1000} 克`, `哈密瓜比西瓜轻，用减法：${(k + 2) * 1000} − ${g} = ${(k + 2) * 1000 - g}（克）`, `答：哈密瓜重 ${(k + 2) * 1000 - g} 克。`], hint: '先把千克换成克' };
    },
  },
  {
    id: 'g2b-mass-swap', grade: 2, term: 2, unit: '克和千克', name: '等量代换（天平）',
    tip: '一样重的可以互相换：先换成中间那种东西，再换成要求的那种', level: 3,
    gen(r) {
      const F = ['西瓜', '菠萝', '梨', '橘子', '草莓'], [i, j, k] = r.sample([0, 1, 2, 3, 4], 3).sort((x, y) => x - y), [X, Y, Z] = [F[i], F[j], F[k]];
      const a = r.int(2, 4), b = r.int(2, 4), m = r.chance(0.4) ? r.int(2, 3) : 1;
      const s2 = m === 1 ? `1 个${Y}和 ${b} 个${Z}一样重` : `${m} 个${Y}和 ${m * b} 个${Z}一样重`;
      return {
        q: `天平上，1 个${X}和 ${a} 个${Y}一样重，${s2}。1 个${X}和 {0} 个${Z}一样重。`, answer: [num(a * b)],
        steps: [...(m > 1 ? [`${m} 个${Y}和 ${m * b} 个${Z}一样重，那么 1 个${Y}和 ${b} 个${Z}一样重`] : []), `1 个${X}换成 ${a} 个${Y}`, `每个${Y}再换成 ${b} 个${Z}，${a} 个${Y}就是 ${a} 个 ${b}`, `${b} × ${a} = ${a * b}，所以 1 个${X}和 ${a * b} 个${Z}一样重`],
        hint: `先把${X}换成${Y}`,
      };
    },
  },

  // ---------- 数学广角——推理 ----------
  {
    id: 'g2b-logic', grade: 2, term: 2, unit: '数学广角——推理', name: '简单推理',
    tip: '先找能直接确定的，再用「排除法」：不是这个、也不是那个，就是剩下的', level: 2,
    gen(r) {
      const CT = [
        { items: ['语文书', '数学书', '英语书'], intro: '分别拿了语文书、数学书、英语书中的一本', pos: '拿的是', neg: '拿的不是', ask: '拿的是什么书？' },
        { items: ['跑步', '跳绳', '踢毽子'], intro: '分别参加了跑步、跳绳、踢毽子中的一项比赛', pos: '参加的是', neg: '参加的不是', ask: '参加的是哪项比赛？' },
        { items: ['苹果', '梨', '桃'], intro: '分别吃了苹果、梨、桃中的一种', pos: '吃的是', neg: '吃的不是', ask: '吃的是什么？' },
        { items: ['红衣服', '黄衣服', '蓝衣服'], intro: '分别穿着红衣服、黄衣服、蓝衣服中的一件', pos: '穿的是', neg: '穿的不是', ask: '穿的是什么颜色的衣服？' },
        { items: ['画画班', '唱歌班', '跳舞班'], intro: '分别报了画画班、唱歌班、跳舞班中的一个', pos: '报的是', neg: '报的不是', ask: '报的是哪个班？' },
      ];
      const PERMS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
      return r.until(() => {
        const c = r.pick(CT), P = r.names(3), perm = r.pick(PERMS);
        const truths = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) truths.push([i, j, perm[i] === j]);
        const clues = r.sample(truths.filter((t) => !t[2] || r.chance(0.4)), r.pick([2, 2, 3]));
        const fit = PERMS.filter((pp) => clues.every(([i, j, y]) => (pp[i] === j) === y));
        const askable = [0, 1, 2].filter((i) => !clues.some(([p, , y]) => p === i && y));
        if (fit.length !== 1 || !askable.length) return null;
        if ([0, 1, 2].some((i) => clues.some(([p, , y]) => p === i && y) && clues.filter(([p]) => p === i).length > 1)) return null; // 说了「是」就不再说「不是」
        const ask = r.pick(askable), known = [-1, -1, -1], excl = [new Set(), new Set(), new Set()], steps = [];
        for (const [i, j, y] of clues) if (y) known[i] = j; else excl[i].add(j);
        for (let i = 0; i < 3; i++) if (known[i] >= 0) steps.push(`${P[i]}自己说了：${P[i]}${c.pos}${c.items[known[i]]}`);
        for (let g = 0; g < 6 && known[ask] < 0; g++) {
          let done = false;
          for (let i = 0; i < 3 && !done; i++) {
            if (known[i] >= 0) continue;
            const taken = known.map((j, kk) => [j, kk]).filter(([j, kk]) => j >= 0 && kk !== i), left = [0, 1, 2].filter((j) => !excl[i].has(j) && !taken.some(([t]) => t === j));
            if (left.length !== 1) continue;
            const why = [...[...excl[i]].map((j) => `${c.items[j]}（${P[i]}自己说的）`), ...taken.filter(([t]) => !excl[i].has(t)).map(([t, kk]) => `${c.items[t]}（${c.items[t]}是${P[kk]}的）`)];
            steps.push(`${P[i]}${c.neg}${why.join('，也不是')}，所以${P[i]}${c.pos}${c.items[left[0]]}`);
            known[i] = left[0]; done = true;
          }
          for (let j = 0; j < 3 && !done; j++) {
            if (known.includes(j)) continue;
            const can = [0, 1, 2].filter((i) => known[i] < 0 && !excl[i].has(j));
            if (can.length === 1) { steps.push(`${c.items[j]}不是另外两人的，只能是${P[can[0]]}的：${P[can[0]]}${c.pos}${c.items[j]}`); known[can[0]] = j; done = true; }
          }
          if (!done) return null;
        }
        if (known[ask] !== perm[ask] || steps.length < 2) return null; // 只靠被问的人自己一句话就能答出的太简单，不要
        const said = [...new Set(clues.map(([i]) => i))].map((i) => `${P[i]}说：「我${clues.filter(([p]) => p === i).map(([, j, y], n) => (n ? '，也不是' : y ? c.pos : c.neg) + c.items[j]).join('')}。」`).join('');
        return { q: `${P.join('、')}三人${c.intro}。${said}${P[ask]}${c.ask}`, answer: [pick(c.items, c.items[perm[ask]])], steps: [...steps, `答：${P[ask]}${c.pos}${c.items[perm[ask]]}。`], hint: '先看谁的能直接确定' };
      }, (x) => x);
    },
  },
  {
    id: 'g2b-sudoku', grade: 2, term: 2, unit: '数学广角——推理', name: '填数游戏（四宫格）',
    tip: '每行、每列、每个粗线框里 1~4 各出现一次：看「?」所在的行、列、框里已经有哪些数', level: 2,
    gen(r) {
      const lab = r.shuffle([1, 2, 3, 4]), base = [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]].map((row) => row.map((v) => lab[v - 1]));
      const ord = () => { const out = []; for (const band of r.shuffle([0, 1])) for (const x of r.shuffle([0, 1])) out.push(band * 2 + x); return out; };
      const ro = ord(), co = ord();
      let g = ro.map((i) => co.map((j) => base[i][j]));
      if (r.bool()) g = g[0].map((_, j) => g.map((row) => row[j]));
      const hr = r.int(0, 3), hc = r.int(0, 3), hi = hr * 4 + hc, others = [...Array(16).keys()].filter((x) => x !== hi);
      const box = (k) => Math.floor(Math.floor(k / 4) / 2) * 2 + Math.floor((k % 4) / 2);
      const blank = r.until(() => new Set([hi, ...r.sample(others, r.int(6, 9))]), (bl) => {
        const seen = new Set(); for (let k = 0; k < 16; k++) if (!bl.has(k) && (Math.floor(k / 4) === hr || k % 4 === hc || box(k) === box(hi))) seen.add(g[Math.floor(k / 4)][k % 4]);
        return seen.size === 3;
      });
      const vals = (f) => [...Array(16).keys()].filter((k) => k !== hi && !blank.has(k) && f(k)).map((k) => g[Math.floor(k / 4)][k % 4]);
      const rowV = vals((k) => Math.floor(k / 4) === hr), colV = vals((k) => k % 4 === hc), boxV = vals((k) => box(k) === box(hi)), v = g[hr][hc];
      const show = (a) => (a.length ? a.join('、') : '还没有数');
      return { q: `每行、每列、每个粗线框里都要有 1、2、3、4，而且不能重复。第 ${hr + 1} 行第 ${hc + 1} 列的「?」里填几？`, fig: sudokuFig(g, [hr, hc], blank), answer: [num(v)], steps: [`「?」所在的这一行有：${show(rowV)}`, `所在的这一列有：${show(colV)}`, `所在的粗线框里有：${show(boxV)}`, `1、2、3、4 里只有 ${v} 没出现，所以「?」填 ${v}`], hint: '把「?」所在的行、列、框里的数都找出来' };
    },
  },

  // ---------- 图形的运动（一） ----------
  {
    id: 'g2b-motion', grade: 2, term: 2, unit: '图形的运动（一）', name: '平移还是旋转',
    tip: '沿直线移动、方向不变是平移；绕着一个点或一条轴转动是旋转', level: 1, pool: 20,
    gen(r) {
      const L = [['电梯上下运动', '平移'], ['推拉窗户', '平移'], ['拉抽屉', '平移'], ['升国旗', '平移'], ['火车在笔直的铁轨上行驶', '平移'], ['推着箱子在地上滑动', '平移'], ['从笔直的滑梯上滑下来', '平移'], ['汽车在笔直的公路上行驶', '平移'], ['拉开推拉门', '平移'],
        ['电风扇的扇叶转动', '旋转'], ['风车转动', '旋转'], ['钟面上指针的转动', '旋转'], ['汽车方向盘的转动', '旋转'], ['拧水龙头', '旋转'], ['打开教室的门', '旋转'], ['荡秋千', '旋转'], ['旋转木马转动', '旋转'], ['自行车车轮转动', '旋转'], ['陀螺转动', '旋转'], ['钟摆摆动', '旋转']];
      const [x, v] = r.pick(L);
      return { q: `「${x}」是平移还是旋转？`, answer: [pick(['平移', '旋转'], v)], steps: [v === '平移' ? '它沿着直线移动，移动时方向没有改变' : '它绕着一个点或一条轴在转', `所以是${v}`], hint: '是沿直线走，还是绕着一个地方转？' };
    },
  },
  {
    id: 'g2b-axis', grade: 2, term: 2, unit: '图形的运动（一）', name: '是不是轴对称图形',
    tip: '沿一条直线对折，两边能完全重合的就是轴对称图形', level: 1, pool: 30,
    gen(r) {
      const L = [['中', 1], ['王', 1], ['田', 1], ['日', 1], ['工', 1], ['土', 1], ['口', 1], ['山', 1], ['品', 1], ['目', 1], ['甲', 1], ['由', 1], ['干', 1], ['回', 1], ['吕', 1],
        ['我', 0], ['你', 0], ['的', 0], ['牛', 0], ['北', 0], ['飞', 0], ['马', 0], ['子', 0], ['学', 0], ['乐', 0], ['好', 0],
        ['长方形', 1], ['正方形', 1], ['圆', 1], ['平行四边形', 0, '平行四边形不管沿哪条直线对折，两边都不能完全重合'], ['五角星', 1]];
      const [x, ok, why] = r.pick(L);
      return { q: `「${x}」是轴对称图形吗？`, answer: [pick(['是', '不是'], ok ? '是' : '不是')], steps: [why || (ok ? `沿着「${x}」中间的一条直线对折，两边能完全重合` : `找不到一条直线，能让「${x}」对折后两边完全重合`), ok ? '所以是轴对称图形' : '所以不是轴对称图形'], hint: '想象沿中间对折，两边能完全重合吗？' };
    },
  },

  // ---------- 拓展：年龄、植树、间隔 ----------
  {
    id: 'g2b-age', grade: 2, term: 2, unit: '解决问题（拓展）', name: '年龄问题', process: true,
    tip: '两个人的年龄差永远不变：过几年大家都长几岁', level: 3,
    gen(r) {
      const A = r.name(), t = r.int(0, 4), a = r.int(6, 10);
      if (t === 0) { const d = r.int(24, 35), n = r.int(3, 10); return { q: `今年${A} ${a} 岁，妈妈 ${a + d} 岁。${n} 年后，妈妈比${A}大几岁？`, answer: [num(d, { unit: '岁' })], steps: [`今年妈妈比${A}大：${a + d} − ${a} = ${d}（岁）`, `过了 ${n} 年，两人都长了 ${n} 岁，相差的岁数不变`, `答：${n} 年后妈妈还是比${A}大 ${d} 岁。`], hint: '过了几年，两个人都长几岁？' }; }
      if (t === 1) { const d = r.int(24, 35), x = r.int(12, 30); return { q: `妈妈比${A}大 ${d} 岁。当${A} ${x} 岁时，妈妈多少岁？`, answer: [num(x + d, { unit: '岁' })], steps: ['年龄差不变，妈妈永远比' + A + `大 ${d} 岁`, `${x} + ${d} = ${x + d}（岁）`, `答：妈妈 ${x + d} 岁。`], hint: `妈妈永远比${A}大几岁？` }; }
      if (t === 2) { const d = r.int(26, 38), c = r.int(a + d + 2, Math.min(70, a + d + 20)); return { q: `今年${A} ${a} 岁，爸爸 ${a + d} 岁。当爸爸 ${c} 岁时，${A}多少岁？`, answer: [num(c - d, { unit: '岁' })], steps: [`爸爸比${A}大：${a + d} − ${a} = ${d}（岁），这个差不会变`, `爸爸 ${c} 岁时，${A}：${c} − ${d} = ${c - d}（岁）`, `答：${A} ${c - d} 岁。`], hint: '先算爸爸比他大几岁' }; }
      if (t === 3) { const d = r.int(26, 38), n = r.int(2, 5); return { q: `${A}今年 ${a} 岁，${n} 年前爸爸比${A}大 ${d} 岁。今年爸爸多少岁？`, answer: [num(a + d, { unit: '岁' })], steps: [`${n} 年前爸爸比${A}大 ${d} 岁，今年还是大 ${d} 岁`, `${a} + ${d} = ${a + d}（岁）`, `答：今年爸爸 ${a + d} 岁。`], hint: '年龄差会变吗？' }; }
      const d = r.int(52, 62);
      return { q: `${A}今年 ${a} 岁，奶奶今年 ${a + d} 岁。${A}出生那年，奶奶多少岁？`, answer: [num(d, { unit: '岁' })], steps: [`${A}出生那年是 0 岁`, `奶奶比${A}大：${a + d} − ${a} = ${d}（岁），这个差不变`, `所以${A}出生时奶奶 0 + ${d} = ${d}（岁）`, `答：奶奶 ${d} 岁。`], hint: `${A}出生那年几岁？` };
    },
  },
  {
    id: 'g2b-tree', grade: 2, term: 2, unit: '解决问题（拓展）', name: '植树问题（两端都种）', process: true,
    tip: '先算有几段（间隔数）；两端都种，棵数 = 段数 + 1', level: 3,
    gen(r) {
      const d = r.int(2, 9), k = r.int(2, 9), L = d * k, t = r.int(0, 3);
      const C = r.pick([['种树', '棵', '种一棵树', '树'], ['装路灯', '盏', '装一盏路灯', '路灯'], ['插彩旗', '面', '插一面彩旗', '彩旗'], ['摆花盆', '盆', '摆一盆花', '花']]);
      if (t === 3) { const n = k + 1; return { q: `路边一排${C[3]}，每两${C[1]}之间相隔 ${d} 米。从第 1 ${C[1]}到第 ${n} ${C[1]}相距多少米？`, answer: [num(L, { unit: '米' })], steps: [`第 1 ${C[1]}到第 ${n} ${C[1]}之间有 ${n} − 1 = ${k} 个间隔`, `每个间隔 ${d} 米：${d} × ${k} = ${L}（米）`, `答：相距 ${L} 米。`], hint: `${n} ${C[1]}之间有几个间隔？画一画` }; }
      const both = t === 2, v = (k + 1) * (both ? 2 : 1);
      return { q: `一条小路长 ${L} 米，在${both ? '路的两边' : '路的一边'}${C[0]}，每隔 ${d} 米${C[2]}，两端都要${C[0].slice(0, 1)}。一共要${C[0].slice(0, 1)}多少${C[1]}？`, answer: [num(v, { unit: C[1] })], steps: [`先算有几段：${L} ÷ ${d} = ${k}（段）`, `两端都${C[0].slice(0, 1)}，${C[1]}数比段数多 1：${k} + 1 = ${k + 1}（${C[1]}）`, ...(both ? [`两边都要${C[0].slice(0, 1)}：${k + 1} × 2 = ${v}（${C[1]}）`] : []), `答：一共要${C[0].slice(0, 1)} ${v} ${C[1]}。`], hint: `画一画：路分成 3 段，两端都${C[0].slice(0, 1)}，要几${C[1]}？` };
    },
  },
  {
    id: 'g2b-interval', grade: 2, term: 2, unit: '解决问题（拓展）', name: '锯木头、爬楼梯', process: true,
    tip: '锯成几段，锯的次数比段数少 1；从 1 楼到几楼，走的层数比楼层数少 1', level: 3,
    gen(r) {
      const A = r.name(), t = r.int(0, 4), n = r.int(3, 9);
      if (t === 0) return { q: `把一根木头锯成 ${n} 段，要锯几次？`, answer: [num(n - 1, { unit: '次' })], steps: ['锯 1 次变成 2 段，锯 2 次变成 3 段……', `次数比段数少 1：${n} − 1 = ${n - 1}（次）`, `答：要锯 ${n - 1} 次。`], hint: '锯 1 次是几段？' };
      if (t === 1) { const m = r.int(2, 9); return { q: `把一根木头锯成 ${n} 段，每锯一次要 ${m} 分。一共要多少分？`, answer: [num((n - 1) * m, { unit: '分' })], steps: [`锯成 ${n} 段要锯 ${n} − 1 = ${n - 1}（次）`, `每次 ${m} 分：${m} × ${n - 1} = ${(n - 1) * m}（分）`, `答：一共要 ${(n - 1) * m} 分。`], hint: `锯成 ${n} 段要锯几次？` }; }
      if (t === 2) return { q: `${A}家住 ${n} 楼，从 1 楼走到 ${n} 楼，要走几层楼梯？`, answer: [num(n - 1, { unit: '层' })], steps: ['从 1 楼到 2 楼走 1 层，到 3 楼走 2 层……', `走的层数比楼层数少 1：${n} − 1 = ${n - 1}（层）`, `答：要走 ${n - 1} 层楼梯。`], hint: '从 1 楼到 2 楼走了几层？' };
      if (t === 3) { const s = r.int(8, 9); return { q: `${A}从 1 楼走到 ${n} 楼，每层楼梯有 ${s} 级台阶。一共要走多少级台阶？`, answer: [num((n - 1) * s, { unit: '级' })], steps: [`从 1 楼到 ${n} 楼要走 ${n} − 1 = ${n - 1}（层）`, `每层 ${s} 级：${s} × ${n - 1} = ${(n - 1) * s}（级）`, `答：一共要走 ${(n - 1) * s} 级台阶。`], hint: `从 1 楼到 ${n} 楼走几层？` }; }
      const c = r.int(2, 8);
      return { q: `把一根绳子剪 ${c} 次（每次剪断一处），能剪成几段？`, answer: [num(c + 1, { unit: '段' })], steps: ['剪 1 次变成 2 段，剪 2 次变成 3 段……', `段数比次数多 1：${c} + 1 = ${c + 1}（段）`, `答：能剪成 ${c + 1} 段。`], hint: '剪 1 次是几段？' };
    },
  },
];

// 补全算式（数字谜、填运算符号），出题器在 puzzle.js
const PUZZLE = [
  { id: 'g2a-puzzle-addsub', grade: 2, term: 1, unit: '100以内的加法和减法（二）', name: '算式谜：两位数加减法', tip: '从个位推起：缺加数就用「和 - 另一个加数」，缺减数就用「被减数 - 差」；别忘了进位和退位', level: 2, gen: PZ.genHAddSub },
  { id: 'g2b-fill-op', grade: 2, term: 2, unit: '混合运算', name: '填运算符号', tip: '先估一估：结果比这几个数大很多，多半有 ×；填好后按「先乘除，后加减」算一遍', level: 2, gen: (r) => PZ.genFillOp(r, { n: 3, lo: 1, hi: 9, max: 81 }) },
];
export default [...SKILLS, ...PUZZLE];

