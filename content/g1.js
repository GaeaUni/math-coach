// 一年级题库：上册 term 1、下册 term 2。
// 单元名用人教版（2012 版）叫法；题型兼顾北京版、北师大版一年级常考内容（数线、半时、□ 里最大填几、图形算式等）。
// 一年级孩子识字少：题干短、多配图，讲解用课堂上的说法（数的分与合、凑十法、破十法、想加算减）。
import { fig, readInt } from '../js/lib.js';

// ================= 局部工具 =================
const num = (value, o = {}) => ({ kind: 'num', value, ...o });
const pick = (options, value, o = {}) => ({ kind: 'choice', options, value, ...o });
const CMP = ['>', '<', '='];
const sign = (a, b) => (a > b ? '>' : a < b ? '<' : '=');
const C = fig.colors;
const T = fig.text;
const CN1 = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// 物品：[emoji, 量词, 名字]
const ITEMS = [
  ['🍎', '个', '苹果'], ['🍐', '个', '梨'], ['🍊', '个', '橘子'], ['🍓', '个', '草莓'], ['🍑', '个', '桃'],
  ['⭐', '颗', '星星'], ['🌸', '朵', '花'], ['🎈', '个', '气球'], ['⚽', '个', '足球'], ['🍬', '颗', '糖'],
  ['🍄', '个', '蘑菇'], ['🐟', '条', '鱼'], ['🐤', '只', '小鸡'], ['🦋', '只', '蝴蝶'], ['🚗', '辆', '小汽车'],
  ['🌳', '棵', '树'], ['🐞', '只', '瓢虫'], ['🦆', '只', '鸭子'],
];
// 小动物：[emoji, 名字]
const ANIMALS = [['🐶', '小狗'], ['🐱', '小猫'], ['🐰', '小兔'], ['🐼', '熊猫'], ['🐵', '小猴'], ['🐯', '老虎'], ['🦊', '狐狸'], ['🐻', '小熊'], ['🐷', '小猪'], ['🐸', '青蛙'], ['🐔', '公鸡'], ['🐮', '小牛']];
const EMO = ANIMALS.map((a) => a[0]);

/** 从 pool 里补够 k 个不重复的选项（first 一定在里面），打乱顺序 */
function opts(r, first, others, pool, k = 4) {
  const out = [first];
  for (const x of [...others, ...r.shuffle(pool)]) { if (out.length >= k) break; if (!out.includes(x)) out.push(x); }
  return r.shuffle(out);
}

/** 凑十法讲解：看大数分小数 */
function carrySteps(a, b) {
  const s = a + b, big = Math.max(a, b), small = Math.min(a, b), need = 10 - big, rest = small - need;
  return [`看大数分小数：${big} 和 ${need} 凑成 10`, `把 ${small} 分成 ${need} 和 ${rest}`, `${big} + ${need} = 10，10 + ${rest} = ${s}`];
}

/** 破十法、想加算减讲解（十几减几，退位） */
function borrowSteps(a, b) {
  const x = a - 10, c = a - b;
  const out = [`破十法：把 ${a} 分成 10 和 ${x}`, `10 - ${b} = ${10 - b}，${10 - b} + ${x} = ${c}`];
  if (b > x && x > 0 && b - x < 10) out.push(`也可以平十：先减 ${x} 得 10，再减 ${b - x}：10 - ${b - x} = ${c}`);
  out.push(`想加算减：${b} + ${c} = ${a}，所以 ${a} - ${b} = ${c}`);
  return out;
}

// ================= 局部配图 =================
/** 一排 emoji。ends：两端写「左」「右」；front：'left' | 'right'，在下面画箭头表示队伍往哪边走（前） */
function rowFig(list, { ends = false, front = null, size = 46 } = {}) {
  const gap = 6, side = ends ? 34 : 14, top = 8;
  const W = side * 2 + list.length * (size + gap) - gap, H = top + size + (front ? 50 : 12);
  let s = '';
  list.forEach((e, i) => { s += T(side + i * (size + gap) + size / 2, top + size / 2 + 2, e, { size: size * 0.85 }); });
  if (ends) {
    s += T(side / 2, top + size / 2, '左', { size: 17, color: C.dash, weight: 'bold' });
    s += T(W - side / 2, top + size / 2, '右', { size: 17, color: C.dash, weight: 'bold' });
  }
  if (front) {
    const y = top + size + 14, xa = side + 6, xb = W - side - 6;
    const [from, to] = front === 'left' ? [xb, xa] : [xa, xb];
    const d = to < from ? 1 : -1;
    s += `<line x1="${from}" y1="${y}" x2="${to + d * 6}" y2="${y}" stroke="${C.acc}" stroke-width="3"/><path d="M${to},${y} l${d * 13},-7 l0,14 z" fill="${C.acc}"/>`;
    s += T(to + d * 6, y + 20, '前', { size: 16, color: C.acc, weight: 'bold' }) + T(from, y + 20, '后', { size: 16, color: C.dash, weight: 'bold' });
  }
  return fig.raw(W, H, s);
}

/** 书架（几层几格），grid 是一行一行的 emoji */
function shelfFig(grid, { cell = 66 } = {}) {
  const rows = grid.length, cols = grid[0].length, o = 10;
  let s = `<rect x="${o}" y="${o}" width="${cols * cell}" height="${rows * cell}" fill="${C.fill2}" stroke="${C.line}" stroke-width="3" rx="4"/>`;
  for (let i = 1; i < rows; i++) s += `<line x1="${o}" y1="${o + i * cell}" x2="${o + cols * cell}" y2="${o + i * cell}" stroke="${C.line}" stroke-width="3"/>`;
  for (let j = 1; j < cols; j++) s += `<line x1="${o + j * cell}" y1="${o}" x2="${o + j * cell}" y2="${o + rows * cell}" stroke="${C.line}" stroke-width="1.5"/>`;
  grid.forEach((row, i) => row.forEach((e, j) => { if (e) s += T(o + j * cell + cell / 2, o + i * cell + cell / 2 + 2, e, { size: cell * 0.62 }); }));
  return fig.raw(cols * cell + 2 * o, rows * cell + 2 * o, s);
}

/** 几行物品左对齐、一个对一个（比多少）：rows = [[emoji, 个数], ...] */
function pairRows(rows, { size = 40 } = {}) {
  const gap = 8, n = Math.max(...rows.map((x) => x[1]));
  let s = '';
  rows.forEach(([e, k], i) => { for (let j = 0; j < k; j++) s += T(gap + j * (size + gap) + size / 2, gap + i * (size + gap) + size / 2 + 2, e, { size: size * 0.85 }); });
  return fig.raw(gap + n * (size + gap), gap + rows.length * (size + gap) + 4, s);
}

/** 数线：labels(v) 决定哪些刻度写数；marks: [{v, text}] 在刻度下方用红框标（如 ?）；hops: [起点, 终点] 一格一格地跳 */
function numLine(min, max, { labels = () => true, marks = [], hops = null } = {}) {
  const unit = max - min > 12 ? 32 : 44, x0 = 24;
  const X = (v) => x0 + (v - min) * unit;
  const W = X(max) + 40, y = hops ? 62 : 26, H = y + 46;
  let s = `<line x1="${x0 - 12}" y1="${y}" x2="${X(max) + 20}" y2="${y}" stroke="${C.line}" stroke-width="2.5"/><path d="M${X(max) + 26},${y} l-11,-6 l0,12 z" fill="${C.line}"/>`;
  for (let v = min; v <= max; v++) {
    s += `<line x1="${X(v)}" y1="${y - 8}" x2="${X(v)}" y2="${y + 8}" stroke="${C.line}" stroke-width="2"/>`;
    const m = marks.find((k) => k.v === v);
    if (m) s += `<rect x="${X(v) - 14}" y="${y + 12}" width="28" height="26" rx="6" fill="#fff" stroke="${C.acc}" stroke-width="2"/>` + T(X(v), y + 26, m.text, { size: 17, weight: 'bold', color: C.acc });
    else if (labels(v)) s += T(X(v), y + 25, v, { size: 16 });
  }
  if (hops) {
    const [a, b] = hops, d = b > a ? 1 : -1;
    s += `<circle cx="${X(a)}" cy="${y}" r="5" fill="${C.acc}"/>`;
    for (let v = a; v !== b; v += d) {
      const xa = X(v), xb = X(v + d), mid = (xa + xb) / 2;
      s += `<path d="M${xa},${y - 4} Q${mid},${y - 44} ${xb},${y - 4}" fill="none" stroke="${C.acc}" stroke-width="2.5"/>`;
    }
    s += `<path d="M${X(b)},${y - 4} l${-d * 4},-12 l${-d * 9},6 z" fill="${C.acc}"/>`;
  }
  return fig.raw(W, H, s);
}

/** 几堆物品并排（虚线圈）。部分写 {e, n, cross}，hide:true 画成写着 ? 的盒子；brace 在下面画大括号并写字（如「? 个」「9 个」） */
function sceneFig(parts, { brace = '', size = 36, perRow = 5 } = {}) {
  let x = 8, s = '', h = 0;
  for (const p of parts) {
    if (p.hide) {
      const w = 92, hh = 84;
      s += `<rect x="${x}" y="6" width="${w}" height="${hh}" rx="10" fill="${C.fill2}" stroke="${C.line}" stroke-width="2.5"/>` + T(x + w / 2, 6 + hh / 2 + 2, '?', { size: 38, weight: 'bold', color: C.acc });
      x += w + 14; h = Math.max(h, hh); continue;
    }
    const cols = Math.min(p.n, perRow), rows = Math.ceil(p.n / perRow) || 1, w = cols * (size + 4) + 12, hh = rows * (size + 4) + 12;
    s += `<rect x="${x}" y="6" width="${w}" height="${hh}" rx="16" fill="none" stroke="${C.dash}" stroke-dasharray="6 4" stroke-width="2"/>`;
    for (let i = 0; i < p.n; i++) {
      const cx = x + 6 + (i % cols) * (size + 4) + size / 2, cy = 12 + Math.floor(i / cols) * (size + 4) + size / 2;
      s += T(cx, cy + 2, p.e, { size: size * 0.85 });
      if (i >= p.n - (p.cross || 0)) s += `<line x1="${cx - size / 2.4}" y1="${cy + size / 2.4}" x2="${cx + size / 2.4}" y2="${cy - size / 2.4}" stroke="${C.acc}" stroke-width="3"/>`;
    }
    x += w + 14; h = Math.max(h, hh);
  }
  const W = Math.max(x - 6, 120);
  let H = h + 12;
  if (brace) {
    const y = h + 14, x1 = 10, x2 = W - 8, m = (x1 + x2) / 2;
    s += `<path d="M${x1},${y} Q${x1},${y + 12} ${x1 + 12},${y + 12} L${m - 10},${y + 12} Q${m},${y + 12} ${m},${y + 24} Q${m},${y + 12} ${m + 10},${y + 12} L${x2 - 12},${y + 12} Q${x2},${y + 12} ${x2},${y}" fill="none" stroke="${C.line}" stroke-width="2.5"/>`;
    s += T(m, y + 40, brace, { size: 18, weight: 'bold', color: brace.includes('?') ? C.acc : C.text });
    H = y + 56;
  }
  return fig.raw(W, H, s);
}

const PASTEL = ['#ffd6a5', '#caffbf', '#9bf6ff', '#bdb2ff', '#ffc6ff', '#fdffb6', '#ffadad'];
/** 立体图形小图标：kind = 'cuboid' | 'cube' | 'cylinder' | 'sphere'；(x, y) 是中心；tall：长方体竖着放 */
function solidIcon(kind, x, y, { s = 56, fill = C.fill, tall = false } = {}) {
  const st = `stroke="${C.line}" stroke-width="2" stroke-linejoin="round"`;
  if (kind === 'sphere') {
    const R = s * 0.4;
    return `<circle cx="${x}" cy="${y}" r="${R}" fill="${fill}" ${st}/><path d="M${x - R},${y} A${R},${R * 0.3} 0 0,0 ${x + R},${y}" fill="none" stroke="${C.line}" stroke-width="1.3"/><path d="M${x - R},${y} A${R},${R * 0.3} 0 0,1 ${x + R},${y}" fill="none" stroke="${C.dash}" stroke-width="1.2" stroke-dasharray="4 3"/><ellipse cx="${x - R * 0.38}" cy="${y - R * 0.45}" rx="${R * 0.18}" ry="${R * 0.12}" fill="#fff" opacity="0.85"/>`;
  }
  if (kind === 'cylinder') {
    const rx = s * 0.28, ry = s * 0.1, h = tall ? s * 0.66 : s * 0.5, top = y - h / 2, bot = y + h / 2;
    return `<path d="M${x - rx},${top} L${x - rx},${bot} A${rx},${ry} 0 0,0 ${x + rx},${bot} L${x + rx},${top}" fill="${fill}" ${st}/><ellipse cx="${x}" cy="${top}" rx="${rx}" ry="${ry}" fill="#fff" fill-opacity="0.55" ${st}/>`;
  }
  const d = s * 0.2;
  const [w, h] = kind === 'cube' ? [s * 0.5, s * 0.5] : tall ? [s * 0.34, s * 0.64] : [s * 0.7, s * 0.34];
  const x0 = x - (w + d) / 2, y0 = y + (h + d) / 2, p = (a, b) => `${a.toFixed(1)},${b.toFixed(1)}`;
  return `<polygon points="${p(x0, y0 - h)} ${p(x0 + d, y0 - h - d)} ${p(x0 + w + d, y0 - h - d)} ${p(x0 + w, y0 - h)}" fill="#fff" fill-opacity="0.6" ${st}/>`
    + `<polygon points="${p(x0, y0 - h)} ${p(x0 + d, y0 - h - d)} ${p(x0 + w + d, y0 - h - d)} ${p(x0 + w, y0 - h)}" fill="${fill}" fill-opacity="0.5" ${st}/>`
    + `<polygon points="${p(x0 + w, y0)} ${p(x0 + w + d, y0 - d)} ${p(x0 + w + d, y0 - h - d)} ${p(x0 + w, y0 - h)}" fill="${fill}" ${st}/>`
    + `<rect x="${x0.toFixed(1)}" y="${(y0 - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${fill}" ${st}/>`;
}
/** 一堆立体图形排成几行：list 是 [kind, tall] */
function solidsFig(r, list, { perRow = 6, cell = 72 } = {}) {
  let s = '';
  list.forEach(([k, tall], i) => { s += solidIcon(k, 10 + (i % perRow) * cell + cell / 2, 10 + Math.floor(i / perRow) * cell + cell / 2, { fill: r.pick(PASTEL), tall }); });
  return fig.raw(20 + Math.min(list.length, perRow) * cell, 20 + Math.ceil(list.length / perRow) * cell, s);
}
/** 小正方体堆：front[i] 是前排第 i 列的高度；back 是后排（只露出比前排高的部分） */
function cubesFig(front, back = null, s = 40) {
  const d = Math.round(s * 0.42), cols = front.length, maxH = Math.max(...front, ...(back || [0]));
  const depth = back ? 2 : 1, W = cols * s + d * depth + 24, H = maxH * s + d * depth + 24, ox = 12, oy = H - 12;
  const st = `stroke="${C.line}" stroke-width="1.8" stroke-linejoin="round"`;
  const cube = (cx, cy) => `<polygon points="${cx},${cy - s} ${cx + d},${cy - s - d} ${cx + s + d},${cy - s - d} ${cx + s},${cy - s}" fill="#fde7b0" ${st}/>`
    + `<polygon points="${cx + s},${cy} ${cx + s + d},${cy - d} ${cx + s + d},${cy - s - d} ${cx + s},${cy - s}" fill="#f2bf55" ${st}/>`
    + `<rect x="${cx}" y="${cy - s}" width="${s}" height="${s}" fill="#ffd77a" ${st}/>`;
  let out = '';
  if (back) for (let i = 0; i < cols; i++) for (let k = 0; k < back[i]; k++) out += cube(ox + i * s + d, oy - d - k * s);
  for (let i = 0; i < cols; i++) for (let k = 0; k < front[i]; k++) out += cube(ox + i * s, oy - k * s);
  return fig.raw(W, H, out);
}
/** 小棒：tens 捆（每捆 10 根）和 ones 根 */
function sticksFig(tens, ones) {
  const h = 84, top = 10;
  let x = 14, s = '';
  for (let b = 0; b < tens; b++) {
    for (let i = 0; i < 10; i++) s += `<line x1="${x + i * 4}" y1="${top}" x2="${x + i * 4}" y2="${top + h}" stroke="#c98a3a" stroke-width="3.2" stroke-linecap="round"/>`;
    s += `<rect x="${x - 5}" y="${top + h / 2 - 6}" width="46" height="12" rx="3" fill="${C.acc}"/>`;
    x += 62;
  }
  for (let i = 0; i < ones; i++) { s += `<line x1="${x}" y1="${top}" x2="${x}" y2="${top + h}" stroke="#c98a3a" stroke-width="3.2" stroke-linecap="round"/>`; x += 16; }
  return fig.raw(x + 8, h + 2 * top, s);
}
const SOLID = { cuboid: '长方体', cube: '正方体', cylinder: '圆柱', sphere: '球' };

/** 平面图形小图标：kind = 'tri' | 'square' | 'rect' | 'circle' | 'para'；v 是样子的变化 */
function planeIcon(kind, x, y, { s = 60, fill = C.fill, v = 0 } = {}) {
  const st = `fill="${fill}" stroke="${C.line}" stroke-width="2.2" stroke-linejoin="round"`, h = s * 0.4;
  const poly = (pts) => `<polygon points="${pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ')}" ${st}/>`;
  if (kind === 'circle') return `<circle cx="${x}" cy="${y}" r="${(s * (0.3 + 0.06 * (v % 2))).toFixed(1)}" ${st}/>`;
  if (kind === 'square') { const a = s * (0.5 + 0.12 * (v % 3)); return `<rect x="${(x - a / 2).toFixed(1)}" y="${(y - a / 2).toFixed(1)}" width="${a.toFixed(1)}" height="${a.toFixed(1)}" ${st}/>`; }
  if (kind === 'rect') { const [w, hh] = v % 2 ? [s * 0.42, s * 0.8] : [s * 0.84, s * 0.44]; return `<rect x="${(x - w / 2).toFixed(1)}" y="${(y - hh / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${hh.toFixed(1)}" ${st}/>`; }
  if (kind === 'para') return poly(v % 2 ? [[x - h, y + h * 0.5], [x + h * 0.45, y + h * 0.5], [x + h, y - h * 0.5], [x - h * 0.45, y - h * 0.5]] : [[x - h, y - h * 0.5], [x + h * 0.45, y - h * 0.5], [x + h, y + h * 0.5], [x - h * 0.45, y + h * 0.5]]);
  return poly([
    [[x, y - h], [x - h, y + h * 0.8], [x + h, y + h * 0.8]],
    [[x - h, y - h], [x - h, y + h], [x + h, y + h]],
    [[x - h, y - h * 0.8], [x + h, y - h * 0.8], [x, y + h]],
    [[x - h, y + h * 0.7], [x + h, y + h * 0.7], [x + h * 0.4, y - h]],
  ][v % 4]);
}
function planesFig(r, list, { perRow = 6, cell = 72 } = {}) {
  let s = '';
  list.forEach((k, i) => { s += planeIcon(k, 10 + (i % perRow) * cell + cell / 2, 10 + Math.floor(i / perRow) * cell + cell / 2, { fill: r.pick(PASTEL), v: r.int(0, 3) }); });
  return fig.raw(20 + Math.min(list.length, perRow) * cell, 20 + Math.ceil(list.length / perRow) * cell, s);
}
const PLANE = { tri: '三角形', square: '正方形', rect: '长方形', circle: '圆', para: '平行四边形' };
/** 数图形用的图：fan（三角形里从顶点画线）、strip（长方形分成几格）、grid2（2×2 的正方形格子） */
function countFig(kind, n) {
  const st = `stroke="${C.line}" stroke-width="2.5" stroke-linejoin="round"`;
  if (kind === 'fan') {
    const ax = 150, ay = 16, y = 190, xl = 20, xr = 300, cuts = [xl];
    for (let i = 1; i < n; i++) cuts.push(xl + ((xr - xl) * i) / n + (i % 2 ? 12 : -8));
    cuts.push(xr);
    let s = `<polygon points="${ax},${ay} ${xl},${y} ${xr},${y}" fill="${C.fill}" ${st}/>`;
    cuts.slice(1, -1).forEach((cx) => { s += `<line x1="${ax}" y1="${ay}" x2="${cx}" y2="${y}" ${st}/>`; });
    return fig.raw(320, 206, s);
  }
  if (kind === 'strip') {
    const x0 = 14, w = 340, y0 = 14, hh = 52, cuts = [];
    for (let i = 1; i < n; i++) cuts.push(x0 + (w * i) / n + (i % 2 ? 8 : -6));
    let s = `<rect x="${x0}" y="${y0}" width="${w}" height="${hh}" fill="${C.fill}" ${st}/>`;
    cuts.forEach((cx) => { s += `<line x1="${cx}" y1="${y0}" x2="${cx}" y2="${y0 + hh}" ${st}/>`; });
    return fig.raw(w + 28, hh + 28, s);
  }
  const a = 160, o = 14;
  return fig.raw(a + 28, a + 28, `<rect x="${o}" y="${o}" width="${a}" height="${a}" fill="${C.fill}" ${st}/><line x1="${o + a / 2}" y1="${o}" x2="${o + a / 2}" y2="${o + a}" ${st}/><line x1="${o}" y1="${o + a / 2}" x2="${o + a}" y2="${o + a / 2}" ${st}/>`);
}
/** 用小棒摆的一排正方形或三角形：画出摆 1 个、2 个、3 个的样子 */
function sticksRowFig(kind) {
  const L = 34, st = `stroke="#c98a3a" stroke-width="5" stroke-linecap="round"`;
  let s = '', x = 14;
  const line = (x1, y1, x2, y2) => `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" ${st}/>`;
  const y0 = 20, y1 = y0 + L;
  for (let n = 1; n <= 3; n++) {
    if (kind === 'square') {
      for (let i = 0; i < n; i++) s += line(x + i * L, y0, x + (i + 1) * L, y0) + line(x + i * L, y1, x + (i + 1) * L, y1);
      for (let i = 0; i <= n; i++) s += line(x + i * L, y0, x + i * L, y1);
      s += T(x + (n * L) / 2, y1 + 22, `${3 * n + 1} 根`, { size: 15 });
      x += n * L + 30;
    } else {
      const hh = L * 0.87;
      for (let i = 0; i < n; i++) {
        const bx = x + (i * L) / 2;
        if (i % 2 === 0) s += line(bx, y0 + hh, bx + L, y0 + hh) + line(bx, y0 + hh, bx + L / 2, y0) + line(bx + L / 2, y0, bx + L, y0 + hh);
        else s += line(bx, y0, bx + L, y0) + (i === n - 1 ? line(bx + L, y0, bx + L / 2, y0 + hh) : '');
      }
      s += T(x + ((n + 1) * L) / 4, y1 + 22, `${2 * n + 1} 根`, { size: 15 });
      x += ((n + 1) * L) / 2 + 30;
    }
  }
  return fig.raw(x, y1 + 36, s);
}

/** 一堆 emoji 混在一起摆成几行（分类用） */
function mixFig(list, { perRow = 6, size = 44 } = {}) {
  const gap = 8;
  let s = '';
  list.forEach((e, i) => { s += T(gap + (i % perRow) * (size + gap) + size / 2, gap + Math.floor(i / perRow) * (size + gap) + size / 2 + 2, e, { size: size * 0.85 }); });
  return fig.raw(gap + Math.min(list.length, perRow) * (size + gap), gap + Math.ceil(list.length / perRow) * (size + gap), s);
}
/** 数位表上摆圆片：十位 t 个，个位 o 个 */
function beadsFig(t, o) {
  const W = 260, cw = 110, x0 = 20, y0 = 10, hh = 150;
  let s = `<rect x="${x0}" y="${y0}" width="${cw * 2}" height="${hh}" fill="#fff" stroke="${C.line}" stroke-width="2.5"/><line x1="${x0 + cw}" y1="${y0}" x2="${x0 + cw}" y2="${y0 + hh}" stroke="${C.line}" stroke-width="2"/><line x1="${x0}" y1="${y0 + 34}" x2="${x0 + cw * 2}" y2="${y0 + 34}" stroke="${C.line}" stroke-width="2"/>`;
  s += T(x0 + cw / 2, y0 + 18, '十位', { size: 16, weight: 'bold' }) + T(x0 + cw * 1.5, y0 + 18, '个位', { size: 16, weight: 'bold' });
  const dots = (cx, n) => { let out = ''; for (let i = 0; i < n; i++) out += `<circle cx="${cx - 30 + (i % 3) * 30}" cy="${y0 + 56 + Math.floor(i / 3) * 30}" r="11" fill="${C.acc}"/>`; return out; };
  return fig.raw(W, hh + 20, s + dots(x0 + cw / 2, t) + dots(x0 + cw * 1.5, o));
}
/** 百数表的一块 3×3：show 里是要写出来的格子（用相对中心的偏移 'dr,dc'），labels 是写字母的格子 */
function chartFig(n, show, labels) {
  const cell = 58, o = 8;
  let s = '';
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    const x = o + (j + 1) * cell, y = o + (i + 1) * cell, key = `${i},${j}`, v = n + i * 10 + j;
    const lab = labels[key];
    s += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${key === '0,0' ? C.fill2 : lab ? '#fff' : C.fill}" stroke="${C.line}" stroke-width="2"/>`;
    if (show.includes(key)) s += T(x + cell / 2, y + cell / 2 + 1, v, { size: 20, weight: 'bold' });
    else if (lab) s += T(x + cell / 2, y + cell / 2 + 1, lab, { size: 20, weight: 'bold', color: C.acc });
  }
  return fig.raw(cell * 3 + 2 * o, cell * 3 + 2 * o, s);
}

/** 两个圈重叠（重叠问题）：左圈写 la，右圈写 lb，中间重叠部分写 mid */
function vennFig(la, lb, mid) {
  const st = `stroke="${C.line}" stroke-width="2.5"`;
  return fig.raw(340, 190, `<circle cx="120" cy="100" r="80" fill="${C.fill}" fill-opacity="0.8" ${st}/><circle cx="220" cy="100" r="80" fill="${C.fill2}" fill-opacity="0.7" ${st}/><circle cx="120" cy="100" r="80" fill="none" ${st}/>`
    + T(90, 100, la, { size: 16, weight: 'bold' }) + T(250, 100, lb, { size: 16, weight: 'bold' }) + T(170, 100, mid, { size: 15, weight: 'bold', color: C.acc }));
}

// ================= 100 以内口算生成器（下册几个题型共用）：返回 { e: 算式, v: 得数, steps } =================
const ORAL = {
  /** 整十数加减整十数 */
  tens(r) {
    if (r.bool()) {
      const a = r.int(1, 9), b = r.int(1, 10 - a);
      return { e: `${a * 10} + ${b * 10}`, v: (a + b) * 10, steps: [`${a} 个十加 ${b} 个十是 ${a + b} 个十`, `想 ${a} + ${b} = ${a + b}，所以 ${a * 10} + ${b * 10} = ${(a + b) * 10}`] };
    }
    const a = r.int(2, 10), b = r.int(1, a - 1);
    return { e: `${a * 10} - ${b * 10}`, v: (a - b) * 10, steps: [`${a} 个十减 ${b} 个十是 ${a - b} 个十`, `想 ${a} - ${b} = ${a - b}，所以 ${a * 10} - ${b * 10} = ${(a - b) * 10}`] };
  },
  /** 整十数加一位数及相应的减法 */
  tensOnes(r) {
    const t = r.int(2, 9), o = r.int(1, 9), n = t * 10 + o, form = r.int(0, 3);
    return [
      { e: `${t * 10} + ${o}`, v: n, steps: [`${t} 个十和 ${o} 个一合起来是 ${n}`] },
      { e: `${o} + ${t * 10}`, v: n, steps: [`${o} 个一和 ${t} 个十合起来是 ${n}`] },
      { e: `${n} - ${o}`, v: t * 10, steps: [`${n} 是 ${t} 个十和 ${o} 个一`, `去掉 ${o} 个一，剩 ${t} 个十，是 ${t * 10}`] },
      { e: `${n} - ${t * 10}`, v: o, steps: [`${n} 是 ${t} 个十和 ${o} 个一`, `去掉 ${t} 个十，剩 ${o} 个一，是 ${o}`] },
    ][form];
  },
  /** 两位数加一位数 */
  add21(r, carry) {
    const [a, b] = r.until(() => [r.int(11, 98), r.int(1, 9)], ([x, y]) => x % 10 !== 0 && (carry ? x % 10 + y >= 10 && x + y <= 100 : x % 10 + y <= 9));
    const t = a - (a % 10), o = a % 10, s = a + b, sw = r.chance(0.25);
    const steps = carry
      ? [`先算个位：${o} + ${b} = ${o + b}`, `再算 ${t} + ${o + b} = ${s}`, `也可以先凑整十：${a} + ${10 - o} = ${t + 10}，${t + 10} + ${b - (10 - o)} = ${s}`, '个位满十，要向十位进 1，别忘了']
      : [`先算个位：${o} + ${b} = ${o + b}`, `再算 ${t} + ${o + b} = ${s}`, '一位数和个位上的数相加'];
    return { e: sw ? `${b} + ${a}` : `${a} + ${b}`, v: s, steps };
  },
  /** 两位数加整十数 */
  add2t(r) {
    const [a, b] = r.until(() => [r.int(11, 89), r.int(1, 8) * 10], ([x, y]) => x % 10 !== 0 && x + y < 100);
    const t = a - (a % 10), o = a % 10, sw = r.chance(0.3);
    return { e: sw ? `${b} + ${a}` : `${a} + ${b}`, v: a + b, steps: [`${b} 是 ${b / 10} 个十，要和十位上的数相加`, `先算 ${t} + ${b} = ${t + b}`, `再加上个位的 ${o}：${t + b} + ${o} = ${a + b}`, `别把 ${b / 10} 加到个位上`] };
  },
  /** 两位数减一位数 */
  sub21(r, borrow) {
    const [a, b] = r.until(() => [r.int(21, 99), r.int(1, 9)], ([x, y]) => (borrow ? x % 10 < y : x % 10 >= y));
    const t = a - (a % 10), o = a % 10, c = a - b;
    const steps = borrow
      ? [`个位 ${o} 减 ${b} 不够减`, `把 ${a} 分成 ${t - 10} 和 ${o + 10}：${o + 10} - ${b} = ${o + 10 - b}`, `${t - 10} + ${o + 10 - b} = ${c}`, ...(o ? [`也可以先算 ${t} - ${b} = ${t - b}，再算 ${t - b} + ${o} = ${c}`] : [])]
      : [`先算个位：${o} - ${b} = ${o - b}`, `再算 ${t} + ${o - b} = ${c}`];
    return { e: `${a} - ${b}`, v: c, steps };
  },
  /** 两位数减整十数 */
  sub2t(r) {
    const [a, b] = r.until(() => [r.int(21, 99), r.int(1, 9) * 10], ([x, y]) => x % 10 !== 0 && y < x);
    const t = a - (a % 10), o = a % 10;
    return { e: `${a} - ${b}`, v: a - b, steps: [`${b} 是 ${b / 10} 个十，要从十位上减`, `先算 ${t} - ${b} = ${t - b}`, `再加上个位的 ${o}：${t - b} + ${o} = ${a - b}`] };
  },
};
const oralSkill = (make) => (r) => { const o = make(r); return { q: `${o.e} = {0}`, answer: [num(o.v)], steps: o.steps }; };

// ================= 题型 =================
export default [
  // ---------- 上册 · 准备课 ----------
  {
    id: 'g1a-count-items', grade: 1, term: 1, unit: '准备课', name: '数一数（10 以内）',
    tip: '用手指着一个一个地数，不漏数，也不重复数', level: 1,
    gen(r) {
      if (r.chance(0.6)) {
        const [e, u] = r.pick(ITEMS), n = r.int(1, 10);
        return {
          q: `数一数，有几${u}${e}？`,
          fig: fig.items(e, n, { perRow: 5 }),
          answer: [num(n, { unit: u })],
          steps: [`用手指着，一${u}一${u}地数：${range(1, n).join('、')}`, `最后数到 ${n}，就是有 ${n} ${u}`, `答：有 ${n} ${u}${e}。`],
          hint: '从第一行左边开始，一个一个往后数',
        };
      }
      const [[e1, u1], [e2, u2]] = r.sample(ITEMS, 2), n1 = r.int(1, 9), n2 = r.int(1, 9);
      return {
        q: `${e1}有 {0} ${u1}，${e2}有 {1} ${u2}。`,
        fig: fig.groups([[e1, n1], [e2, n2]]),
        answer: [num(n1), num(n2)],
        steps: [`先数左边圈里的${e1}：${range(1, n1).join('、')}，有 ${n1} ${u1}`, `再数右边圈里的${e2}：${range(1, n2).join('、')}，有 ${n2} ${u2}`, '一圈一圈地数，就不会数乱'],
      };
    },
  },
  {
    id: 'g1a-compare-more', grade: 1, term: 1, unit: '准备课', name: '比多少（看图）',
    tip: '一个对一个地比，有多出来的那一种就多', level: 1,
    gen(r) {
      const [a, b, ua, ub] = r.pick([['🐰', '🥕', '只', '根'], ['🐵', '🍌', '只', '根'], ['🐱', '🐟', '只', '条'], ['🐝', '🌸', '只', '朵'], ['🍵', '🥄', '个', '把'], ['🐔', '🥚', '只', '个'], ['🐶', '🦴', '只', '根'], ['🐼', '🎋', '只', '根']]);
      const n1 = r.int(2, 9), n2 = r.chance(0.2) ? n1 : r.until(() => r.int(2, 9), (x) => x !== n1);
      const less = r.bool(), w = less ? '少' : '多';
      const more = n1 > n2 ? a : b, fewer = n1 > n2 ? b : a;
      const ans = n1 === n2 ? '同样多' : `${less ? fewer : more}${w}`;
      return {
        q: `${a}和${b}比，谁${w}？`,
        fig: pairRows([[a, n1], [b, n2]]),
        answer: [pick([`${a}${w}`, `${b}${w}`, '同样多'], ans)],
        steps: [
          `一${ua}${a}对一${ub}${b}，一个对一个地比`,
          n1 === n2 ? '正好一个对一个，谁也没有多出来' : `${more}还有多出来的，没有对上`,
          n1 === n2 ? `${a}和${b}同样多` : `所以${more}多，${fewer}少`,
          `答：${ans}。`,
        ],
      };
    },
  },

  // ---------- 上册 · 位置 ----------
  {
    id: 'g1a-position-shelf', grade: 1, term: 1, unit: '位置', name: '上下左右',
    tip: '左右按看图的人来分：拿笔的右手那边是右边', level: 1,
    gen(r) {
      const an = r.sample(EMO, 9), grid = [an.slice(0, 3), an.slice(3, 6), an.slice(6, 9)];
      const ok = (i, j) => i >= 0 && i < 3 && j >= 0 && j < 3;
      const DIR = [['上面', -1, 0], ['下面', 1, 0], ['左边', 0, -1], ['右边', 0, 1]];
      const where = (i, j) => `${grid[i][j]}在从上往下数第 ${i + 1} 层，从左往右数第 ${j + 1} 格`;
      const kind = r.int(0, 2);
      if (kind === 2) {
        const i = r.int(0, 2), j = r.int(0, 2), left = r.bool(), x = grid[i][j], n = left ? j : 2 - j;
        return {
          q: `在同一层里，${x}的${left ? '左' : '右'}边有几只小动物？`,
          fig: shelfFig(grid),
          answer: [num(n, { unit: '只' })],
          steps: [where(i, j), `这一层从左往右是：${grid[i].join(' ')}`, n ? `${x}的${left ? '左' : '右'}边有 ${(left ? grid[i].slice(0, j) : grid[i].slice(j + 1)).join(' ')}，${n} 只` : `${x}已经在最${left ? '左' : '右'}边了，${left ? '左' : '右'}边没有小动物`],
        };
      }
      const [dn, di, dj] = r.pick(DIR);
      const [i, j] = r.until(() => [r.int(0, 2), r.int(0, 2)], ([p, q]) => ok(p + di, q + dj));
      const x = grid[i][j], y = grid[i + di][j + dj];
      const say = di ? `往${di < 0 ? '上' : '下'}看一层，同一个位置是 ${y}` : `看图时，${dj < 0 ? '左手' : '右手'}那边是${dn}，往${dj < 0 ? '左' : '右'}看一格是 ${y}`;
      if (kind === 0) {
        const nb = DIR.filter((d) => d[0] !== dn).map(([, a, b]) => [i + a, j + b]).filter(([p, q]) => ok(p, q)).map(([p, q]) => grid[p][q]);
        return {
          q: `${x}的${dn}是谁？`,
          fig: shelfFig(grid),
          answer: [pick(opts(r, y, nb, an.filter((e) => e !== x)), y)],
          steps: [where(i, j), say, `所以${x}的${dn}是 ${y}`],
        };
      }
      return {
        q: `${y}在${x}的哪一面？`,
        fig: shelfFig(grid),
        answer: [pick(['上面', '下面', '左边', '右边'], dn)],
        steps: [where(i, j), say, `所以${y}在${x}的${dn}`],
        hint: '先找到后面那只小动物，再看前面那只在它的哪一面',
      };
    },
  },
  {
    id: 'g1a-position-queue', grade: 1, term: 1, unit: '位置', name: '前后',
    tip: '先看队伍往哪边走：走在最前头的是第一个，它的身后是后面', level: 1,
    gen(r) {
      const n = r.int(4, 7), list = r.sample(EMO, n), front = r.pick(['left', 'right']);
      const order = front === 'left' ? list : [...list].reverse(); // order[0] 排在最前面
      const look = `箭头指向${front === 'left' ? '左' : '右'}边，队伍往${front === 'left' ? '左' : '右'}走，${front === 'left' ? '左' : '右'}边是前面`;
      const line = `从前往后：${order.join(' ')}`;
      const kind = r.int(0, 3);
      if (kind <= 1) {
        const back = kind === 1, k = back ? r.int(0, n - 2) : r.int(1, n - 1), x = order[k], y = order[back ? k + 1 : k - 1];
        const wrong = order[back ? k - 1 : k + 1];
        return {
          q: `${x}的${back ? '后' : '前'}面是谁？`,
          fig: rowFig(list, { front }),
          answer: [pick(opts(r, y, wrong ? [wrong] : [], list.filter((e) => e !== x)), y)],
          steps: [look, line, `${x}${back ? '后' : '前'}面紧挨着的是 ${y}`],
        };
      }
      if (kind === 2) {
        const k = r.int(0, n - 1), x = order[k], back = r.bool(), m = back ? n - 1 - k : k;
        return {
          q: `${x}的${back ? '后' : '前'}面有几只小动物？`,
          fig: rowFig(list, { front }),
          answer: [num(m, { unit: '只' })],
          steps: [look, line, m ? `${x}${back ? '后' : '前'}面有：${(back ? order.slice(k + 1) : order.slice(0, k)).join(' ')}，一共 ${m} 只` : `${x}排在最${back ? '后' : '前'}面，${back ? '后' : '前'}面没有小动物`],
        };
      }
      const last = r.bool(), y = last ? order[n - 1] : order[0];
      return {
        q: `排在最${last ? '后' : '前'}面的是谁？`,
        fig: rowFig(list, { front }),
        answer: [pick(opts(r, y, [last ? order[0] : order[n - 1]], list), y)],
        steps: [look, line, `最${last ? '后' : '前'}面的是 ${y}`],
        hint: '先看箭头，箭头指的那边是前面',
      };
    },
  },

  // ---------- 上册 · 1~5 的认识和加减法 / 6~10 的认识和加减法 ----------
  {
    id: 'g1a-compare-10', grade: 1, term: 1, unit: '10以内数的认识和加减法', name: '比大小（10 以内）',
    tip: '数越往后越大；开口朝着大数，尖尖指着小数', level: 1, speed: 4,
    gen(r) {
      const a = r.int(0, 10), b = r.chance(0.15) ? a : r.int(0, 10), s = sign(a, b);
      const pic = a >= 1 && b >= 1 && a <= 9 && b <= 9 && r.chance(0.4), e = r.pick(ITEMS)[0];
      const steps = [];
      if (pic) steps.push(`上下一个对一个：上面 ${a} 个，下面 ${b} 个`);
      if (s === '=') steps.push(`${a} 和 ${b} 一样多，用 =`);
      else steps.push(`按 0、1、2……10 的顺序，${Math.max(a, b)} 在 ${Math.min(a, b)} 的后面，${Math.max(a, b)} 大`, `${a} ${s} ${b}：开口朝着大数 ${Math.max(a, b)}`);
      return {
        q: pic ? `看图比一比：${a} {0} ${b}` : `${a} {0} ${b}`,
        fig: pic ? pairRows([[e, a], [e, b]]) : undefined,
        answer: [pick(CMP, s)],
        steps,
      };
    },
  },
  {
    id: 'g1a-ordinal', grade: 1, term: 1, unit: '10以内数的认识和加减法', name: '第几（从左数、从右数）',
    tip: '先看从哪边数，从那一边的第一个开始数 1、2、3……', level: 1,
    gen(r) {
      const n = r.int(6, 9), list = r.sample(EMO, n), kind = r.int(0, 2), left = r.bool(), side = left ? '左' : '右';
      const from = left ? list : [...list].reverse();
      const count = (k) => `从${side}边开始数：${from.slice(0, k).map((e, i) => `${e}${i + 1}`).join('，')}`;
      if (kind === 0) {
        const k = r.int(1, n), x = from[k - 1], mirror = from[n - k], near = [from[k - 2], from[k]].filter(Boolean);
        return {
          q: `从${side}数，第 ${k} 只是谁？`,
          fig: rowFig(list, { ends: true }),
          answer: [pick(opts(r, x, [mirror, ...near], list), x)],
          steps: [count(k), `数到 ${k} 的是 ${x}`, '注意看清楚是从哪一边开始数'],
        };
      }
      const i = r.int(0, n - 1), x = list[i];
      if (kind === 1) {
        const k = left ? i + 1 : n - i;
        return {
          q: `${x}从${side}数排第 {0}。`,
          fig: rowFig(list, { ends: true }),
          answer: [num(k)],
          steps: [count(k), `数到 ${x} 是 ${k}，${x}从${side}数排第 ${k}`],
        };
      }
      return {
        q: `${x}从左数排第 {0}，从右数排第 {1}。`,
        fig: rowFig(list, { ends: true }),
        answer: [num(i + 1), num(n - i)],
        steps: [`从左边数：${list.slice(0, i + 1).map((e, j) => `${e}${j + 1}`).join('，')}，排第 ${i + 1}`, `从右边数：${[...list].reverse().slice(0, n - i).map((e, j) => `${e}${j + 1}`).join('，')}，排第 ${n - i}`, `检查：${i + 1} + ${n - i} = ${n + 1}，比一共 ${n} 只多 1，因为${x}被数了两次 ✓`],
      };
    },
  },
  {
    id: 'g1a-ji-vs-diji', grade: 1, term: 1, unit: '10以内数的认识和加减法', name: '几和第几',
    tip: '「第几」只说一个的位置，「几个」说的是一共有多少', level: 1,
    gen(r) {
      const n = r.int(6, 10);
      if (r.chance(0.3)) {
        const k = r.int(2, n - 1), [e, nm] = r.pick(ANIMALS), left = r.bool();
        return {
          q: `${n} 只小动物排成一排，${e}从${left ? '左' : '右'}数排第 ${k}，从${left ? '右' : '左'}数排第几？`,
          answer: [num(n - k + 1, { label: '第' })],
          steps: [`${e}从${left ? '左' : '右'}数排第 ${k}，${left ? '左' : '右'}边还有 ${k - 1} 只`, `${left ? '右' : '左'}边有：${n} - ${k} = ${n - k}（只）`, `从${left ? '右' : '左'}边数，前面有 ${n - k} 只，${e}就排第 ${n - k + 1}`],
          hint: '画一画：用圆圈表示小动物，把它圈出来再数',
        };
      }
      const m = Math.min(n, 9), list = r.sample(EMO, m), i = r.int(1, m - 2), x = list[i];
      return {
        q: `从左数，${x}排第 {0}。\n${x}的左边有 {1} 只，右边有 {2} 只。`,
        fig: rowFig(list, { ends: true }),
        answer: [num(i + 1), num(i), num(m - 1 - i)],
        steps: [`从左边数：${list.slice(0, i + 1).map((e, j) => `${e}${j + 1}`).join('，')}，${x}排第 ${i + 1}`, `${x}左边的是：${list.slice(0, i).join(' ')}，有 ${i} 只（不算${x}自己）`, `${x}右边的是：${list.slice(i + 1).join(' ')}，有 ${m - 1 - i} 只`, '「第几」是位置，「有几只」是数量，别弄混'],
      };
    },
  },
  {
    id: 'g1a-split-10', grade: 1, term: 1, unit: '10以内数的认识和加减法', name: '10 以内数的分与合',
    tip: '想一想：几和几合起来是这个数', level: 1, speed: 5,
    gen(r) {
      const t = r.int(2, 10), a = r.int(1, t - 1), b = t - a, form = r.int(0, 3);
      const q = [`${t} 可以分成 ${a} 和 {0}`, `${t} 可以分成 {0} 和 ${b}`, `${a} 和 {0} 合成 ${t}`, `${a} 和 ${b} 合成 {0}`][form];
      const ans = [b, a, b, t][form];
      const steps = form === 3
        ? [`${a} 和 ${b} 合起来，${a} 再往后数 ${b} 个`, `${a} 和 ${b} 合成 ${t}`]
        : form === 1 ? [`想：几和 ${b} 合成 ${t}？`, `${a} 和 ${b} 合起来正好是 ${t}`, `所以 ${t} 可以分成 ${a} 和 ${b}`]
          : [`想：${a} 和几合成 ${t}？`, `${a} 再添上 ${b} 就是 ${t}`, `所以填 ${b}`];
      return { q, answer: [num(ans)], steps };
    },
  },
  {
    id: 'g1a-number-line', grade: 1, term: 1, unit: '10以内数的认识和加减法', name: '看数线',
    tip: '数线上一格是 1，往右越来越大，往左越来越小', level: 1,
    gen(r) {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const v = r.until(() => r.int(1, 9), (x) => x !== 5), ref = v > 5 ? 5 : 0;
        return {
          q: '数线上 ? 表示几？',
          fig: numLine(0, 10, { labels: (x) => x % 5 === 0, marks: [{ v, text: '?' }] }),
          answer: [num(v)],
          steps: [`从 ${ref} 开始往右数格子，每一格是 1`, `${ref} 往右数 ${v - ref} 格：${range(ref + 1, v).join('、')}`, `所以 ? 是 ${v}`],
        };
      }
      const add = kind === 1;
      const a = add ? r.int(0, 8) : r.int(2, 10), k = add ? r.int(1, 10 - a) : r.int(1, a), b = add ? a + k : a - k;
      return {
        q: `看数线，写算式：\n{0} ${add ? '+' : '-'} {1} = {2}`,
        fig: numLine(0, 10, { hops: [a, b] }),
        answer: [num(a), num(k), num(b)],
        steps: [`从红点 ${a} 出发`, `往${add ? '右' : '左'}跳了 ${k} 格（数一数弧线有 ${k} 个）`, `到了 ${b}`, `往${add ? '右跳用加法' : '左跳用减法'}：${a} ${add ? '+' : '-'} ${k} = ${b}`],
        hint: '先看从几出发，再数跳了几格',
      };
    },
  },
  {
    id: 'g1a-add-10', grade: 1, term: 1, unit: '10以内数的认识和加减法', name: '10 以内的加法',
    tip: '想数的分与合：几和几合成几', level: 1, speed: 4,
    gen(r) {
      const s = r.int(2, 10), a = r.int(1, s - 1), b = s - a, big = Math.max(a, b), small = Math.min(a, b);
      return {
        q: `${a} + ${b} = {0}`,
        answer: [num(s)],
        steps: [`想：${a} 和 ${b} 合成 ${s}`, `也可以从大数 ${big} 往后数 ${small} 个：${range(big + 1, s).join('、')}`, `${a} + ${b} = ${s}`],
      };
    },
  },
  {
    id: 'g1a-sub-10', grade: 1, term: 1, unit: '10以内数的认识和加减法', name: '10 以内的减法',
    tip: '想加算减：几加减数等于被减数', level: 1, speed: 4,
    gen(r) {
      const a = r.int(2, 10), b = r.int(1, a - 1), c = a - b;
      return {
        q: `${a} - ${b} = {0}`,
        answer: [num(c)],
        steps: [`想分与合：${a} 可以分成 ${b} 和 ${c}`, `也可以想加算减：${b} + ${c} = ${a}`, `所以 ${a} - ${b} = ${c}`],
      };
    },
  },
  {
    id: 'g1a-zero', grade: 1, term: 1, unit: '10以内数的认识和加减法', name: '0 的加减法',
    tip: '加 0、减 0 还是原来的数；两个一样的数相减得 0', level: 1, speed: 4,
    gen(r) {
      const a = r.int(1, 10), form = r.int(0, 6);
      const F = [
        [`${a} + 0 = {0}`, a, `一个数加 0，还是它自己：${a} + 0 = ${a}`],
        [`0 + ${a} = {0}`, a, `0 加一个数，还是那个数：0 + ${a} = ${a}`],
        [`${a} - 0 = {0}`, a, `一个数减 0，一个也没拿走，还是 ${a}`],
        [`${a} - ${a} = {0}`, 0, `${a} 个全拿走，一个也不剩：${a} - ${a} = 0`],
        [`${a} - {0} = 0`, a, `减完一个也不剩，就是全拿走了：${a} - ${a} = 0`],
        [`${a} + {0} = ${a}`, 0, `加完还是 ${a}，说明加的是 0：${a} + 0 = ${a}`],
        [`${a} - {0} = ${a}`, 0, `减完还是 ${a}，说明一个也没拿走：${a} - 0 = ${a}`],
      ][form];
      return { q: F[0], answer: [num(F[1])], steps: [F[2], '0 表示一个也没有'] };
    },
  },
  {
    id: 'g1a-chain-10', grade: 1, term: 1, unit: '10以内数的认识和加减法', name: '连加、连减（10 以内）',
    tip: '从左往右算，先算前两个数，再用得数接着算', level: 1, speed: 8,
    gen(r) {
      if (r.bool()) {
        const [a, b, c] = r.until(() => [r.int(1, 7), r.int(1, 7), r.int(1, 7)], ([x, y, z]) => x + y + z <= 10);
        const x = a + b;
        return { q: `${a} + ${b} + ${c} = {0}`, answer: [num(x + c)], steps: ['从左往右，一步一步算', `先算 ${a} + ${b} = ${x}`, `再算 ${x} + ${c} = ${x + c}`] };
      }
      const [a, b, c] = r.until(() => [r.int(3, 10), r.int(1, 8), r.int(1, 8)], ([x, y, z]) => x - y - z >= 0);
      const x = a - b;
      return { q: `${a} - ${b} - ${c} = {0}`, answer: [num(x - c)], steps: ['从左往右，一步一步算', `先算 ${a} - ${b} = ${x}`, `再算 ${x} - ${c} = ${x - c}`] };
    },
  },
  {
    id: 'g1a-mixed-10', grade: 1, term: 1, unit: '10以内数的认识和加减法', name: '加减混合（10 以内）',
    tip: '从左往右算，看清楚每一步是加还是减', level: 1, speed: 8,
    gen(r) {
      if (r.bool()) {
        const [a, b, c] = r.until(() => [r.int(1, 9), r.int(1, 9), r.int(1, 9)], ([x, y, z]) => x + y <= 10 && x + y - z >= 0);
        return { q: `${a} + ${b} - ${c} = {0}`, answer: [num(a + b - c)], steps: ['从左往右算', `先算 ${a} + ${b} = ${a + b}`, `再算 ${a + b} - ${c} = ${a + b - c}`] };
      }
      const [a, b, c] = r.until(() => [r.int(2, 10), r.int(1, 9), r.int(1, 9)], ([x, y, z]) => x - y >= 0 && x - y + z <= 10);
      return { q: `${a} - ${b} + ${c} = {0}`, answer: [num(a - b + c)], steps: ['从左往右算，不能先算后面的加法', `先算 ${a} - ${b} = ${a - b}`, `再算 ${a - b} + ${c} = ${a - b + c}`] };
    },
  },
  {
    id: 'g1a-box-10', grade: 1, term: 1, unit: '10以内数的认识和加减法', name: '□ 里填几（10 以内）',
    tip: '想一想：几加几得几，用数的分与合来找', level: 1, speed: 6,
    gen(r) {
      const t = r.int(3, 10), a = r.int(1, t - 1), b = t - a, form = r.int(0, 3);
      const F = [
        [`{0} + ${b} = ${t}`, a, [`想：几加 ${b} 等于 ${t}？`, `${t} 可以分成 ${a} 和 ${b}`, `${a} + ${b} = ${t}，所以填 ${a}`]],
        [`${a} + {0} = ${t}`, b, [`想：${a} 加几等于 ${t}？`, `${a} 和 ${b} 合成 ${t}`, `${a} + ${b} = ${t}，所以填 ${b}`]],
        [`${t} - {0} = ${a}`, b, [`想：${t} 减几还剩 ${a}？`, `${t} 可以分成 ${a} 和 ${b}，去掉 ${b} 还剩 ${a}`, `${t} - ${b} = ${a}，所以填 ${b}`]],
        [`{0} - ${b} = ${a}`, t, [`□ 里是原来的数：去掉 ${b} 还剩 ${a}`, `原来的 = 去掉的 + 剩下的：${b} + ${a} = ${t}`, `检查：${t} - ${b} = ${a} ✓`]],
      ][form];
      return { q: F[0], answer: [num(F[1])], steps: F[2] };
    },
  },
  {
    id: 'g1a-compare-expr-10', grade: 1, term: 1, unit: '10以内数的认识和加减法', name: '算式比大小（10 以内）',
    tip: '先算出得数，再比大小', level: 2, speed: 8,
    gen(r) {
      const ex = () => {
        if (r.bool()) { const s = r.int(2, 10), a = r.int(1, s - 1); return [`${a} + ${s - a}`, s]; }
        const a = r.int(2, 10), b = r.int(1, a - 1); return [`${a} - ${b}`, a - b];
      };
      const [L, x] = ex();
      let R, y;
      if (r.chance(0.4)) [R, y] = ex();
      else { y = r.chance(0.25) ? x : r.int(Math.max(0, x - 3), Math.min(10, x + 3)); R = String(y); }
      const [P, u, Q, v] = r.bool() ? [L, x, R, y] : [R, y, L, x], s = sign(u, v);
      const steps = [];
      if (P !== String(u)) steps.push(`先算左边：${P} = ${u}`);
      if (Q !== String(v)) steps.push(`${steps.length ? '再' : '先'}算右边：${Q} = ${v}`);
      steps.push(`比一比：${u} ${s} ${v}`, `所以 ${P} ${s} ${Q}`);
      return { q: `${P} {0} ${Q}`, answer: [pick(CMP, s)], steps };
    },
  },
  {
    id: 'g1a-box-max', grade: 1, term: 1, unit: '10以内数的认识和加减法', name: '□ 里最大（最小）能填几',
    tip: '先把 >、< 当成 = 算出来，再想要比它大一点还是小一点', level: 2,
    gen(r) {
      const form = r.int(0, 4);
      if (form <= 1) { // □ + b < c
        const b = r.int(1, 7), c = r.int(b + 2, 10), x = c - b - 1, e = form ? `${b} + {0}` : `{0} + ${b}`;
        const flip = r.bool();
        return {
          q: `□ 里最大能填几？\n${flip ? `${c} > ${e}` : `${e} < ${c}`}`,
          answer: [num(x)],
          steps: [`先当成等号：□ + ${b} = ${c}，□ = ${c - b}`, `${c - b} + ${b} = ${c}，和 ${c} 一样大，不行`, `□ 要比 ${c - b} 小，试 ${x}：${x} + ${b} = ${c - 1}，比 ${c} 小 ✓`, `所以 □ 里最大填 ${x}`],
        };
      }
      if (form === 2) { // a - □ > c
        const c = r.int(1, 7), a = r.int(c + 2, 10), x = a - c - 1;
        return {
          q: `□ 里最大能填几？\n${a} - {0} > ${c}`,
          answer: [num(x)],
          steps: [`先当成等号：${a} - □ = ${c}，□ = ${a - c}`, `减去的越多，剩下的越少；要剩得比 ${c} 多，□ 就要比 ${a - c} 小`, `试 ${x}：${a} - ${x} = ${c + 1}，比 ${c} 大 ✓`, `所以 □ 里最大填 ${x}`],
        };
      }
      if (form === 3) { // □ + b > c 最小
        const b = r.int(1, 7), c = r.int(b, 9), x = c - b + 1;
        return {
          q: `□ 里最小能填几？\n{0} + ${b} > ${c}`,
          answer: [num(x)],
          steps: [`先当成等号：□ + ${b} = ${c}，□ = ${c - b}`, `${c - b} + ${b} = ${c}，和 ${c} 一样大，不行`, `□ 要比 ${c - b} 大，试 ${x}：${x} + ${b} = ${c + 1}，比 ${c} 大 ✓`, `所以 □ 里最小填 ${x}`],
        };
      }
      const b = r.int(1, 6), c = r.int(2, 10 - b + 1), x = b + c - 1; // □ - b < c
      return {
        q: `□ 里最大能填几？\n{0} - ${b} < ${c}`,
        answer: [num(x)],
        steps: [`先当成等号：□ - ${b} = ${c}，□ = ${c} + ${b} = ${b + c}`, `□ 越大，减完剩得越多；要剩得比 ${c} 少，□ 要比 ${b + c} 小`, `试 ${x}：${x} - ${b} = ${c - 1}，比 ${c} 小 ✓`, `所以 □ 里最大填 ${x}`],
      };
    },
  },
  {
    id: 'g1a-fill-sign', grade: 1, term: 1, unit: '10以内数的认识和加减法', name: '填上 + 或 -',
    tip: '得数变大了用 +，变小了用 -；两个符号就一个一个地试', level: 2,
    gen(r) {
      const ok = (v) => v >= 0 && v <= 10;
      const calc = (a, op, b) => (op === '+' ? a + b : a - b);
      if (r.bool()) {
        const op = r.pick(['+', '-']), a = op === '+' ? r.int(1, 9) : r.int(2, 10), b = op === '+' ? r.int(1, 10 - a) : r.int(1, a);
        const c = calc(a, op, b);
        return {
          q: `${a} {0} ${b} = ${c}`,
          answer: [pick(['+', '-'], op)],
          steps: [`得数 ${c} 比 ${a} ${op === '+' ? '大，变大了，用 +' : '小，变小了，用 -'}`, `${a} ${op} ${b} = ${c} ✓`],
        };
      }
      const combos = [['+', '+'], ['+', '-'], ['-', '+'], ['-', '-']];
      const val = (a, b, c, [p, q]) => { const m = calc(a, p, b); return ok(m) ? calc(m, q, c) : -1; };
      const [a, b, c, ops, d] = r.until(() => {
        const a = r.int(1, 9), b = r.int(1, 9), c = r.int(1, 9), ops = r.pick(combos);
        return [a, b, c, ops, val(a, b, c, ops)];
      }, ([a, b, c, ops, d]) => ok(d) && combos.filter((k) => val(a, b, c, k) === d).length === 1);
      const tries = combos.map((k) => { const v = val(a, b, c, k); return `${a} ${k[0]} ${b} ${k[1]} ${c}${v >= 0 && v <= 10 ? ` = ${v}` : ' 不够减'}`; });
      return {
        q: `${a} {0} ${b} {1} ${c} = ${d}`,
        answer: [pick(['+', '-'], ops[0]), pick(['+', '-'], ops[1])],
        steps: ['一个一个地试，从左往右算：', ...tries, `只有 ${a} ${ops[0]} ${b} ${ops[1]} ${c} = ${d}`],
      };
    },
  },
  {
    id: 'g1a-picture-add', grade: 1, term: 1, unit: '10以内数的认识和加减法', name: '看图列式（加法）',
    tip: '把两部分合起来，求一共有几个，用加法', level: 1, process: true,
    gen(r) {
      const [e, u] = r.pick(ITEMS), s = r.int(3, 10), a = r.int(1, s - 1), b = s - a;
      return {
        q: `看图列式（先写左边的）：一共有几${u}？\n{0} + {1} = {2}`,
        fig: sceneFig([{ e, n: a }, { e, n: b }], { brace: `? ${u}` }),
        answer: [num(a), num(b), num(s, { unit: u })],
        steps: [`左边有 ${a} ${u}，右边有 ${b} ${u}`, `大括号下面是「? ${u}」，问的是合起来一共几${u}，用加法`, `${a} + ${b} = ${s}（${u}）`],
      };
    },
  },
  {
    id: 'g1a-picture-sub', grade: 1, term: 1, unit: '10以内数的认识和加减法', name: '看图列式（减法）',
    tip: '从一共的里面去掉一部分，求剩下的，用减法', level: 1, process: true,
    gen(r) {
      const [e, u] = r.pick(ITEMS), t = r.int(3, 10), k = r.int(1, t - 1);
      if (r.bool()) {
        return {
          q: `看图列式：还剩几${u}？\n{0} - {1} = {2}`,
          fig: fig.items(e, t, { perRow: 5, cross: k }),
          answer: [num(t), num(k), num(t - k, { unit: u })],
          steps: [`一共有 ${t} ${u}，划掉了 ${k} ${u}`, `从 ${t} 里去掉 ${k}，求还剩几${u}，用减法`, `${t} - ${k} = ${t - k}（${u}）`],
        };
      }
      return {
        q: `看图列式：一共 ${t} ${u}，盒子里有几${u}？\n{0} - {1} = {2}`,
        fig: sceneFig([{ e, n: t - k }, { hide: true }], { brace: `${t} ${u}` }),
        answer: [num(t), num(t - k), num(k, { unit: u })],
        steps: [`大括号下面是一共 ${t} ${u}，外面看得见的有 ${t - k} ${u}`, `求盒子里的，就是从一共的里面去掉看得见的，用减法`, `${t} - ${t - k} = ${k}（${u}）`],
        hint: '一共的 - 看得见的 = 盒子里的',
      };
    },
  },
  {
    id: 'g1a-one-pic-four', grade: 1, term: 1, unit: '10以内数的认识和加减法', name: '一图四式',
    tip: '一幅图能写两道加法、两道减法：部分 + 部分 = 整体，整体 - 部分 = 另一部分', level: 2,
    gen(r) {
      const [[e1, u1], [e2, u2]] = r.sample(ITEMS, 2), s = r.int(4, 10), a = r.int(1, s - 1), b = s - a;
      const eqs = [[a, '+', b, s], [b, '+', a, s], [s, '-', a, b], [s, '-', b, a]];
      const ans = [];
      const lines = eqs.map(([x, op, y, z]) => {
        const hole = r.int(0, 2), v = [x, y, z];
        ans.push(num(v[hole]));
        const show = v.map((n, i) => (i === hole ? `{${ans.length - 1}}` : n));
        return `${show[0]} ${op} ${show[1]} = ${show[2]}`;
      });
      return {
        q: `看图填一填：\n${lines.join('\n')}`,
        fig: fig.groups([[e1, a], [e2, b]]),
        answer: ans,
        steps: [`图上${e1}有 ${a} ${u1}，${e2}有 ${b} ${u2}，合起来一共 ${s} 个`, `合起来用加法：${a} + ${b} = ${s}，${b} + ${a} = ${s}`, `从一共的 ${s} 个里去掉${e1}，剩下${e2}：${s} - ${a} = ${b}`, `去掉${e2}，剩下${e1}：${s} - ${b} = ${a}`],
      };
    },
  },
  {
    id: 'g1a-word-10', grade: 1, term: 1, unit: '10以内数的认识和加减法', name: '解决问题（一共、还剩）',
    tip: '求一共用加法，求还剩用减法', level: 1, process: true,
    gen(r) {
      const [p, q] = r.names(2);
      if (r.bool()) {
        const s = r.int(3, 10), a = r.int(1, s - 1), b = s - a;
        const [t, u, ask] = r.pick([
          [`树上有 ${a} 只小鸟，又飞来 ${b} 只。现在一共有几只？`, '只', '一共有'],
          [`${p}有 ${a} 支铅笔，${q}有 ${b} 支。两人一共有几支？`, '支', '一共有'],
          [`停车场有 ${a} 辆车，又开来 ${b} 辆。现在有几辆车？`, '辆', '现在有'],
          [`盘子里有 ${a} 个苹果，妈妈又放进 ${b} 个。现在有几个？`, '个', '现在有'],
          [`${a} 个小朋友在跳绳，${b} 个小朋友在拍球。一共有几个小朋友？`, '个', '一共有'],
          [`河里有 ${a} 只鸭子，又游来 ${b} 只。现在河里有几只？`, '只', '现在有'],
        ]);
        return {
          q: t, answer: [num(s, { unit: u })],
          steps: [`已经有 ${a} ${u}，又来了 ${b} ${u}`, '把两部分合起来，求一共有几，用加法', `${a} + ${b} = ${s}（${u}）`, `答：${ask} ${s} ${u}。`],
        };
      }
      const t0 = r.int(3, 10), b = r.int(1, t0 - 1), c = t0 - b;
      const [t, u, gone] = r.pick([
        [`有 ${t0} 个气球，飞走了 ${b} 个。还剩几个？`, '个', '飞走'],
        [`${p}有 ${t0} 颗糖，吃了 ${b} 颗。还剩几颗？`, '颗', '吃了'],
        [`车上有 ${t0} 人，到站下去 ${b} 人。车上还有几人？`, '人', '下去'],
        [`书架上有 ${t0} 本书，借走了 ${b} 本。还剩几本？`, '本', '借走'],
        [`河里有 ${t0} 只小鸭，游走了 ${b} 只。还剩几只？`, '只', '游走'],
        [`树上有 ${t0} 个桃，摘下 ${b} 个。树上还有几个？`, '个', '摘下'],
      ]);
      return {
        q: t, answer: [num(c, { unit: u })],
        steps: [`原来有 ${t0} ${u}，${gone} ${b} ${u}`, `从 ${t0} 里去掉 ${b}，求还剩几，用减法`, `${t0} - ${b} = ${c}（${u}）`, `答：还剩 ${c} ${u}。`],
      };
    },
  },
  {
    id: 'g1a-word-original', grade: 1, term: 1, unit: '10以内数的认识和加减法', name: '解决问题（原来有、求一部分）',
    tip: '原来的 = 去掉的 + 剩下的；一部分 = 一共 - 另一部分', level: 2, process: true,
    gen(r) {
      const [p, q] = r.names(2), t0 = r.int(3, 10), b = r.int(1, t0 - 1), c = t0 - b;
      if (r.bool()) {
        const [t, u, gone] = r.pick([
          [`${p}吃了 ${b} 颗糖，还剩 ${c} 颗。原来有几颗？`, '颗', '吃了的'],
          [`树上飞走了 ${b} 只鸟，还剩 ${c} 只。原来有几只？`, '只', '飞走的'],
          [`车上下去 ${b} 人，还剩 ${c} 人。车上原来有几人？`, '人', '下去的'],
          [`借走 ${b} 本书后，书架上还有 ${c} 本。原来有几本？`, '本', '借走的'],
          [`卖出 ${b} 个西瓜，还剩 ${c} 个。原来有几个？`, '个', '卖出的'],
        ]);
        return {
          q: t, answer: [num(t0, { unit: u })],
          steps: [`${gone} ${b} ${u}和剩下的 ${c} ${u}合起来，就是原来的`, '求原来有几，用加法（别看到「走了」「吃了」就用减法）', `${b} + ${c} = ${t0}（${u}）`, `答：原来有 ${t0} ${u}。`],
          hint: '原来的分成了两部分：去掉的和剩下的',
        };
      }
      const [t, u, part, other] = r.pick([
        [`一共有 ${t0} 个苹果，盘子里有 ${b} 个，其余的在篮子里。篮子里有几个？`, '个', '盘子里', '篮子里'],
        [`${t0} 个小朋友在玩，其中男生有 ${b} 人。女生有几人？`, '人', '男生', '女生'],
        [`一共有 ${t0} 只鸡，鸡窝外有 ${b} 只。鸡窝里有几只？`, '只', '鸡窝外', '鸡窝里'],
        [`${p}和${q}一共折了 ${t0} 只纸鹤，${p}折了 ${b} 只。${q}折了几只？`, '只', p, q],
        [`一共 ${t0} 本书，${p}看完了 ${b} 本。还有几本没看？`, '本', '看完的', '没看的'],
      ]);
      return {
        q: t, answer: [num(c, { unit: u })],
        steps: [`一共 ${t0} ${u}，分成${part}和${other}两部分`, `知道一共和${part}，求${other}，用减法`, `${t0} - ${b} = ${c}（${u}）`, `答：${other}有 ${c} ${u}。`],
      };
    },
  },

  // ---------- 上册 · 认识图形（一） ----------
  {
    id: 'g1a-solid-count', grade: 1, term: 1, unit: '认识图形（一）', name: '数一数立体图形',
    tip: '方方正正的盒子是长方体，每个面都一样大是正方体，能立又能滚是圆柱，圆溜溜的是球', level: 1,
    gen(r) {
      const kinds = ['cuboid', 'cube', 'cylinder', 'sphere'], cnt = kinds.map(() => r.int(1, 4));
      const list = r.shuffle(kinds.flatMap((k, i) => Array.from({ length: cnt[i] }, () => [k, r.chance(0.35)])));
      return {
        q: '数一数，各有几个？\n长方体 {0} 个，正方体 {1} 个，圆柱 {2} 个，球 {3} 个',
        fig: solidsFig(r, list),
        answer: cnt.map((n) => num(n)),
        steps: ['长方体：长长方方的盒子，前面是长方形', '正方体：每个面都是一样大的正方形', '圆柱：上下两个面是一样大的圆，直直的', '球：圆溜溜的，没有平的面', `数的时候数一个划一个：长方体 ${cnt[0]} 个，正方体 ${cnt[1]} 个，圆柱 ${cnt[2]} 个，球 ${cnt[3]} 个`],
      };
    },
  },
  {
    id: 'g1a-solid-name', grade: 1, term: 1, unit: '认识图形（一）', name: '物体是什么形状',
    tip: '想想这个东西摸起来、看起来像哪种图形', level: 1,
    gen(r) {
      const OBJ = [
        ['牙膏盒', 'cuboid'], ['粉笔盒', 'cuboid'], ['字典', 'cuboid'], ['冰箱', 'cuboid'], ['砖头', 'cuboid'], ['牛奶盒🧃', 'cuboid'], ['文具盒', 'cuboid'], ['鞋盒', 'cuboid'], ['快递纸箱📦', 'cuboid'],
        ['魔方', 'cube'], ['骰子🎲', 'cube'], ['冰块🧊', 'cube'],
        ['易拉罐', 'cylinder'], ['薯片筒', 'cylinder'], ['茶叶罐', 'cylinder'], ['固体胶', 'cylinder'], ['电池🔋', 'cylinder'], ['罐头🥫', 'cylinder'], ['蜡烛🕯️', 'cylinder'],
        ['皮球', 'sphere'], ['乒乓球', 'sphere'], ['篮球🏀', 'sphere'], ['地球仪', 'sphere'], ['玻璃弹珠', 'sphere'], ['足球⚽', 'sphere'],
      ];
      const why = { cuboid: '方方的，长长的，有平平的面，是长方体', cube: '方方正正，每个面都一样大，是正方体', cylinder: '上下两个面是一样大的圆，直直的，能立住也能滚，是圆柱', sphere: '圆溜溜的，往哪边都能滚，是球' };
      if (r.chance(0.6)) {
        const [o, k] = r.pick(OBJ);
        return { q: `${o}是什么形状？`, answer: [pick(Object.values(SOLID), SOLID[k])], steps: [`${o}${why[k]}`, `所以${o}是${SOLID[k]}`] };
      }
      const ks = Object.keys(SOLID), k = r.pick(ks);
      const four = ks.map((kk) => r.pick(OBJ.filter((x) => x[1] === kk)));
      const ans = four[ks.indexOf(k)][0];
      return {
        q: `哪个的形状是${SOLID[k]}？`,
        answer: [pick(r.shuffle(four.map((x) => x[0])), ans)],
        steps: [...four.map(([o, kk]) => `${o}是${SOLID[kk]}`), `所以选${ans}`],
      };
    },
  },
  {
    id: 'g1a-solid-feature', grade: 1, term: 1, unit: '认识图形（一）', name: '立体图形的特点',
    tip: '球最容易滚；圆柱立着放稳、躺着放能滚；长方体、正方体放得最稳', level: 2, pool: 10,
    gen(r) {
      const S4 = Object.values(SOLID);
      const all = [
        ['哪种图形最容易滚动？', S4, '球', ['球圆溜溜的，没有平平的面', '放在哪里、往哪边都能滚']],
        ['哪种图形立着放能站稳，躺下来又能滚动？', S4, '圆柱', ['圆柱上下两个面是平平的圆，立着放能站稳', '躺下来，弯弯的侧面能滚']],
        ['哪种图形每个面都是一样大的正方形？', S4, '正方体', ['正方体方方正正，每个面都一样大']],
        ['哪种图形上下两个面是一样大的圆？', S4, '圆柱', ['圆柱的上面和下面是一样大的圆']],
        ['搭积木时，哪种积木上面不能再放别的积木？', S4, '球', ['球的上面是弯弯的，放什么都会滑下来']],
        ['哪种图形从哪边看都是圆的？', S4, '球', ['球圆溜溜的，从前、后、上、下看都是圆']],
        ['2 个一样大的正方体拼在一起，拼成的是什么形状？', ['长方体', '正方体', '圆柱'], '长方体', ['两个正方体并排放，变长了', '长长方方的，是长方体']],
        ['用一样大的小正方体，最少要几个才能拼成一个大正方体？', ['2 个', '4 个', '6 个', '8 个'], '8 个', ['下面一层要摆 2 行、每行 2 个，是 4 个', '上面再摆一层 4 个', '4 + 4 = 8，最少要 8 个']],
        ['下面哪种图形放在地上最不稳，一碰就滚？', ['长方体', '正方体', '球'], '球', ['长方体、正方体都有平平的面，放得稳', '球没有平的面，一碰就滚']],
        ['冰箱、字典、牙膏盒都是什么形状？', S4, '长方体', ['它们都是长长方方的盒子形状', '都是长方体']],
      ];
      const [q, o, a, steps] = r.pick(all);
      return { q, answer: [pick(o, a)], steps };
    },
  },
  {
    id: 'g1a-cube-count', grade: 1, term: 1, unit: '认识图形（一）', name: '数小正方体',
    tip: '一列一列地数，从下往上数，再合起来', level: 2,
    gen(r) {
      const cols = r.int(2, 5), front = Array.from({ length: cols }, () => r.int(1, 3));
      const total = front.reduce((a, b) => a + b, 0), count = [`从左往右一列一列数：${front.map((h, i) => `第 ${i + 1} 列 ${h} 个`).join('，')}`, `合起来：${front.join(' + ')} = ${total}（个）`];
      if (r.chance(0.35)) {
        let H = Math.max(...front) + r.int(0, 1);
        if (H * cols === total) H++;
        const need = H * cols - total;
        return {
          q: `要把每一列都搭成 ${H} 个高，还要再添几个小正方体？`,
          fig: cubesFig(front),
          answer: [num(need, { unit: '个' })],
          steps: [`一列一列看差几个：${front.map((h, i) => `第 ${i + 1} 列${H - h ? `差 ${H - h} 个` : '已经够高'}`).join('，')}`, `合起来：${front.map((h) => H - h).filter((x) => x).join(' + ')} = ${need}（个）`],
          hint: '每一列都要到同样高，看看每列还缺几个',
        };
      }
      return {
        q: '这堆积木是用几个小正方体搭成的？',
        fig: cubesFig(front),
        answer: [num(total, { unit: '个' })],
        steps: count,
      };
    },
  },
  {
    id: 'g1a-cube-hidden', grade: 1, term: 1, unit: '认识图形（一）', name: '数小正方体（有藏起来的）',
    tip: '后面一排露出来的正方体下面不能是空的，下面还藏着正方体', level: 3,
    gen(r) {
      const [front, back] = r.until(() => {
        const n = r.int(2, 4), f = Array.from({ length: n }, () => r.int(1, 2)), b = f.map((h) => (r.chance(0.6) ? r.int(h + 1, h + 2) : 0));
        return [f, b];
      }, ([f, b]) => b.some((x) => x > 0));
      const F = front.reduce((a, b) => a + b, 0), B = back.reduce((a, b) => a + b, 0);
      const seen = back.map((h, i) => (h ? h - front[i] : 0)), hid = back.map((h, i) => (h ? front[i] : 0));
      const S = seen.reduce((a, b) => a + b, 0), Hd = hid.reduce((a, b) => a + b, 0);
      if (r.chance(0.3)) {
        return {
          q: '这堆积木里，有几个小正方体被挡住、看不见？',
          fig: cubesFig(front, back),
          answer: [num(Hd, { unit: '个' })],
          steps: ['前面一排的正方体都看得见', `后面一排露出来 ${S} 个，它们不能悬在空中，下面一定还有正方体托着`, `托着的这些被前面一排挡住了：${hid.filter((x) => x).join(' + ')} = ${Hd}（个）`],
          hint: '后面高出来的正方体，下面是什么托着它？',
        };
      }
      return {
        q: '这堆积木一共用了几个小正方体？',
        fig: cubesFig(front, back),
        answer: [num(F + B, { unit: '个' })],
        steps: [`前面一排：${front.join(' + ')} = ${F}（个）`, `后面一排露出来 ${S} 个，它们不能悬在空中，下面还藏着 ${Hd} 个`, `后面一排：${S} + ${Hd} = ${B}（个）`, `一共：${F} + ${B} = ${F + B}（个）`],
        hint: '后面高出来的正方体，下面是什么托着它？',
      };
    },
  },

  // ---------- 上册 · 11~20各数的认识 ----------
  {
    id: 'g1a-teen-compose', grade: 1, term: 1, unit: '11~20各数的认识', name: '1 个十和几个一',
    tip: '10 个一是 1 个十；十几就是 1 个十和几个一', level: 1,
    gen(r) {
      const o = r.int(1, 9), n = 10 + o, form = r.int(0, 6);
      const base = `${n} 是 1 个十和 ${o} 个一`;
      if (form === 0) return { q: `1 个十和 ${o} 个一合起来是 {0}`, answer: [num(n)], steps: ['1 个十是 10', `10 和 ${o} 合起来是 ${n}`] };
      if (form === 1) return { q: `${n} 里面有 {0} 个十和 {1} 个一`, answer: [num(1), num(o)], steps: [`${n} 的十位上是 1，表示 1 个十`, `个位上是 ${o}，表示 ${o} 个一`] };
      if (form === 2) {
        const t = r.chance(0.15) ? 2 : 1, oo = t === 2 ? 0 : o;
        return { q: '看图写数：{0}', fig: sticksFig(t, oo), answer: [num(t * 10 + oo)], steps: [`一捆是 10 根，有 ${t} 捆，是 ${t} 个十`, oo ? `还有 ${oo} 根，是 ${oo} 个一` : '没有单根的', `合起来是 ${t * 10 + oo}`] };
      }
      if (form === 3) return { q: `${n} 的个位上是 {0}，十位上是 {1}`, answer: [num(o), num(1)], steps: ['从右边起，第一位是个位，第二位是十位', `${n}：个位是 ${o}，十位是 1`, base] };
      if (form === 4) return { q: `十位上是 1，个位上是 ${o}，这个数是 {0}`, answer: [num(n)], steps: ['十位上写 1，个位上写 ' + o, `这个数是 ${n}`] };
      if (form === 5) {
        const w = ['十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九'][o - 1];
        if (r.bool()) return { q: `「${w}」写作`, answer: [pick(opts(r, String(n), [`${o}1`, `10${o}`], [`1${o}0`, `${o}10`], 3), String(n))], steps: [`${w}是 1 个十和 ${o} 个一`, `十位写 1，个位写 ${o}：${n}`] };
        return { q: `${n} 读作`, answer: [pick(opts(r, w, [`一${CN1[o]}`, `${CN1[o]}十`], [`一十${CN1[o]}`], 3), w)], steps: [`${n} 是 1 个十和 ${o} 个一`, `读作「${w}」`] };
      }
      const k = r.int(1, 9);
      return r.bool()
        ? { q: `${n} 再添上 {0} 个一就是 20`, answer: [num(20 - n)], steps: [`${n} 还差几个一到 20？`, `${o} 和 ${10 - o} 凑成 10，${n} 添上 ${10 - o} 个一，正好又满一个十`, '2 个十就是 20'] }
        : { q: `10 个一是 {0} 个十，${k} 个一和 1 个十合起来是 {1}`, answer: [num(1), num(10 + k)], steps: ['10 个一合起来是 1 个十', `1 个十和 ${k} 个一合起来是 ${10 + k}`] };
    },
  },
  {
    id: 'g1a-teen-order', grade: 1, term: 1, unit: '11~20各数的认识', name: '数的顺序（20 以内）',
    tip: '前一个数少 1，后一个数多 1', level: 1,
    gen(r) {
      const n = r.int(11, 19), form = r.int(0, 4);
      if (form === 0) return { q: `${n} 前面的一个数是 {0}，后面的一个数是 {1}`, answer: [num(n - 1), num(n + 1)], steps: [`按顺序数：${n - 1}、${n}、${n + 1}`, `前面一个少 1：${n - 1}；后面一个多 1：${n + 1}`] };
      if (form === 1) {
        const big = r.bool();
        return { q: `比 ${n} ${big ? '大' : '小'} 1 的数是 {0}`, answer: [num(big ? n + 1 : n - 1)], steps: [`比 ${n} ${big ? '大 1，就是它后面' : '小 1，就是它前面'}的一个数`, `${n} ${big ? '+' : '-'} 1 = ${big ? n + 1 : n - 1}`] };
      }
      if (form === 2) return { q: `和 ${n} 相邻的两个数是 {0} 和 {1}`, answer: [num(n - 1), num(n + 1)], steps: ['相邻就是紧挨着的前一个和后一个', `${n - 1}、${n}、${n + 1}`] };
      if (form === 3) {
        const up = r.bool(), st = r.pick([1, 1, 2]), len = 5;
        const a = up ? r.int(0, 20 - st * (len - 1)) : r.int(st * (len - 1), 20);
        const seq = range(0, len - 1).map((i) => a + (up ? 1 : -1) * st * i);
        const holes = r.sample(range(1, len - 1), 2).sort((x, y) => x - y);
        const show = seq.map((v, i) => (holes.includes(i) ? `{${holes.indexOf(i)}}` : v));
        return { q: `按顺序填数：${show.join('，')}`, answer: holes.map((i) => num(seq[i])), steps: [`看规律：每次${up ? '多' : '少'} ${st}`, `填：${seq.join('，')}`] };
      }
      const v = r.int(11, 19);
      return {
        q: '数线上 ? 表示几？',
        fig: numLine(10, 20, { labels: (x) => x === 10 || x === 15 || x === 20, marks: [{ v, text: '?' }] }),
        answer: [num(v)],
        steps: [`从 ${v > 15 ? 15 : 10} 往右数，一格是 1`, `数 ${v - (v > 15 ? 15 : 10)} 格到 ?：${range((v > 15 ? 15 : 10) + 1, v).join('、')}`, `? 是 ${v}`],
      };
    },
  },
  {
    id: 'g1a-teen-compare', grade: 1, term: 1, unit: '11~20各数的认识', name: '比大小（20 以内）',
    tip: '十几都比一位数大；都是十几就比个位', level: 1, speed: 4,
    gen(r) {
      if (r.chance(0.3)) {
        const four = r.sample(range(1, 20), 4), big = r.bool(), ans = big ? Math.max(...four) : Math.min(...four);
        return { q: `哪个数最${big ? '大' : '小'}？`, answer: [pick(four.map(String), String(ans))], steps: ['一位数比两位数小；都是十几，就比个位', `按从小到大排：${[...four].sort((a, b) => a - b).join(' < ')}`, `最${big ? '大' : '小'}的是 ${ans}`] };
      }
      const a = r.int(10, 20), b = r.chance(0.12) ? a : r.chance(0.3) ? r.int(0, 9) : r.int(10, 20), [x, y] = r.bool() ? [a, b] : [b, a], s = sign(x, y);
      let why;
      if (x === y) why = '两个数一样，用 =';
      else if (x < 10 || y < 10) why = `${Math.min(x, y)} 是一位数，${Math.max(x, y)} 是两位数，两位数大`;
      else if (x === 20 || y === 20) why = '20 是 2 个十，比十几都大';
      else why = `十位都是 1，比个位：${x % 10} ${s} ${y % 10}`;
      return { q: `${x} {0} ${y}`, answer: [pick(CMP, s)], steps: [why, `${x} ${s} ${y}`] };
    },
  },
  {
    id: 'g1a-ten-plus', grade: 1, term: 1, unit: '11~20各数的认识', name: '十加几和相应的减法',
    tip: '10 + 5 就是 1 个十和 5 个一，是 15', level: 1, speed: 4,
    gen(r) {
      const o = r.int(1, 9), n = 10 + o, form = r.int(0, 3);
      const F = [
        [`10 + ${o} = {0}`, n, [`1 个十和 ${o} 个一合起来是 ${n}`]],
        [`${o} + 10 = {0}`, n, [`${o} 个一和 1 个十合起来是 ${n}`]],
        [`${n} - ${o} = {0}`, 10, [`${n} 是 1 个十和 ${o} 个一`, `去掉 ${o} 个一，剩下 1 个十，是 10`]],
        [`${n} - 10 = {0}`, o, [`${n} 是 1 个十和 ${o} 个一`, `去掉 1 个十，剩下 ${o} 个一，是 ${o}`]],
      ][form];
      return { q: F[0], answer: [num(F[1])], steps: F[2] };
    },
  },
  {
    id: 'g1a-teen-add-sub', grade: 1, term: 1, unit: '11~20各数的认识', name: '十几加减几（不进位不退位）',
    tip: '先算个位上的数，再和 10 合起来', level: 1, speed: 5,
    gen(r) {
      const add = r.bool();
      if (add) {
        const x = r.int(1, 8), y = r.int(1, 9 - x), n = 10 + x, s = n + y, swap = r.chance(0.25);
        return { q: swap ? `${y} + ${n} = {0}` : `${n} + ${y} = {0}`, answer: [num(s)], steps: [`把 ${n} 分成 10 和 ${x}`, `先算 ${x} + ${y} = ${x + y}`, `再算 10 + ${x + y} = ${s}`] };
      }
      const x = r.int(2, 9), y = r.int(1, x), n = 10 + x;
      return { q: `${n} - ${y} = {0}`, answer: [num(n - y)], steps: [`把 ${n} 分成 10 和 ${x}`, `先算 ${x} - ${y} = ${x - y}`, `再算 10 + ${x - y} = ${n - y}`] };
    },
  },

  // ---------- 上册 · 认识钟表 ----------
  {
    id: 'g1a-clock-hour', grade: 1, term: 1, unit: '认识钟表', name: '认识整时',
    tip: '分针（长针）指着 12，时针（短针）指着几，就是几时', level: 1,
    gen(r) {
      const h = r.int(1, 12), form = r.int(0, 3), why = ['分针（长针）指着 12，是整时', `时针（短针）指着 ${h}，就是 ${h} 时`, `写成电子表的样子是 ${h}:00`];
      if (form === 0) return { q: '钟面上是几时？\n{0} 时', fig: fig.clock(h, 0), answer: [num(h)], steps: why };
      if (form === 1) {
        const o = opts(r, `${h} 时`, ['12 时', `${h % 12 + 1} 时`], ['6 时', `${(h + 10) % 12 + 1} 时`], 3);
        return { q: '钟面上是几时？', fig: fig.clock(h, 0), answer: [pick(o, `${h} 时`)], steps: [...why.slice(0, 2), '别把长针指的 12 当成时'] };
      }
      if (form === 2) return { q: `分针指着 12，时针指着 ${h}，是 {0} 时`, answer: [num(h)], steps: why.slice(0, 2) };
      return { q: `${h} 时整，分针指着 {0}，时针指着 {1}`, answer: [num(12, { label: '分针' }), num(h, { label: '时针' })], steps: ['整时的时候，分针都指着 12', `${h} 时，时针指着 ${h}`] };
    },
  },
  {
    id: 'g1a-clock-half', grade: 1, term: 1, unit: '认识钟表', name: '认识半时',
    tip: '分针指着 6 是半时；时针刚走过几，就是几时半', level: 1,
    gen(r) {
      const h = r.int(1, 12), nx = h % 12 + 1, form = r.int(0, 3);
      const why = ['分针（长针）指着 6，是半时', `时针（短针）在 ${h} 和 ${nx} 中间，刚走过 ${h}`, `所以是 ${h} 时半，写作 ${h}:30（不是 ${nx} 时半）`];
      if (form === 0) return { q: '钟面上是几时半？\n{0} 时半', fig: fig.clock(h, 30), answer: [num(h)], steps: why };
      if (form === 1) return { q: '钟面上是什么时间？', fig: fig.clock(h, 30), answer: [pick(r.shuffle([`${h}:30`, `${nx}:30`, `${h}:00`]), `${h}:30`)], steps: why };
      if (form === 2) return { q: `分针指着 6，时针在 ${h} 和 ${nx} 中间，是 {0} 时半`, answer: [num(h)], steps: why.slice(1) };
      return { q: `${h} 时半，分针指着 {0}，时针在 {1} 和 {2} 中间`, answer: [num(6, { label: '分针' }), num(h), num(nx)], steps: ['半时的时候，分针都指着 6', `${h} 时半，时针走过了 ${h}，还没到 ${nx}`] };
    },
  },
  {
    id: 'g1a-clock-about', grade: 1, term: 1, unit: '认识钟表', name: '大约几时（快到、刚过）',
    tip: '分针快到 12 是「快几时了」，分针刚过 12 是「刚过几时」', level: 2, pool: 24,
    gen(r) {
      const H = r.int(1, 12), before = r.bool(), m = before ? r.int(50, 57) : r.int(2, 9), h = before ? (H + 10) % 12 + 1 : H;
      const ans = before ? `快 ${H} 时了` : `刚过 ${H} 时`;
      return {
        q: '钟面上大约是几时？',
        fig: fig.clock(h, m),
        answer: [pick([`快 ${H} 时了`, `刚过 ${H} 时`, `正好 ${H} 时`], ans)],
        steps: before
          ? ['分针快走到 12 了，还差一点点', `时针快指到 ${H} 了`, `所以快 ${H} 时了，大约是 ${H} 时`]
          : ['分针刚走过 12 一点点', `时针刚过 ${H}`, `所以刚过 ${H} 时，大约是 ${H} 时`],
      };
    },
  },
  {
    id: 'g1a-clock-later', grade: 1, term: 1, unit: '认识钟表', name: '过几小时是几时',
    tip: '时针走一大格是 1 小时，往后数几格就是过了几小时', level: 3,
    gen(r) {
      const [p] = r.names(1), h = r.int(1, 9), k = r.int(1, 3), e = h + k;
      if (r.bool()) {
        const t = r.pick([`现在是 ${h} 时，再过 ${k} 小时是几时？`, `${p} ${h} 时开始写作业，写了 ${k} 小时。几时写完？`, `电影 ${h} 时开始，演了 ${k} 小时。几时结束？`]);
        return { q: `${t}\n{0} 时`, fig: fig.clock(h, 0), answer: [num(e)], steps: [`时针从 ${h} 往后走 ${k} 大格`, `${range(h + 1, e).join('、')}`, `${h} 时过 ${k} 小时是 ${e} 时`] };
      }
      return {
        q: r.bool() ? `从 ${h} 时到 ${e} 时，经过了几小时？` : `${p}上午 ${h} 时出门，${e} 时回家。出去了几小时？`,
        answer: [num(k, { unit: '小时' })],
        steps: [`时针从 ${h} 走到 ${e}`, `走了 ${k} 大格：${range(h + 1, e).join('、')}`, `一大格是 1 小时，经过了 ${k} 小时`],
      };
    },
  },

  // ---------- 上册 · 20以内的进位加法 ----------
  {
    id: 'g1a-add-carry-9', grade: 1, term: 1, unit: '20以内的进位加法', name: '9 加几',
    tip: '凑十法：看大数分小数，9 和 1 凑成 10', level: 1, speed: 6, pool: 16,
    gen(r) {
      const b = r.int(2, 9), [x, y] = r.bool() ? [9, b] : [b, 9];
      return {
        q: `${x} + ${y} = {0}`,
        answer: [num(9 + b)],
        steps: [`9 和 1 凑成 10，把 ${b} 分成 1 和 ${b - 1}`, `9 + 1 = 10，10 + ${b - 1} = ${9 + b}`, '小窍门：9 加几，得数就是十几，个位比加的数少 1'],
        hint: '9 再要几个就是 10？',
      };
    },
  },
  {
    id: 'g1a-add-carry-876', grade: 1, term: 1, unit: '20以内的进位加法', name: '8、7、6 加几',
    tip: '凑十法：8 和 2、7 和 3、6 和 4 凑成 10', level: 1, speed: 6,
    gen(r) {
      const a = r.pick([8, 7, 6]), b = r.int(11 - a, 9), [x, y] = r.chance(0.7) ? [a, b] : [b, a];
      return { q: `${x} + ${y} = {0}`, answer: [num(a + b)], steps: carrySteps(x, y), hint: `${Math.max(x, y)} 再要几个就是 10？` };
    },
  },
  {
    id: 'g1a-add-carry-5432', grade: 1, term: 1, unit: '20以内的进位加法', name: '5、4、3、2 加几',
    tip: '小数加大数，可以交换加数，想大数加小数', level: 1, speed: 6, pool: 20,
    gen(r) {
      const a = r.pick([5, 4, 3, 2]), b = r.int(11 - a, 9), [x, y] = r.chance(0.7) ? [a, b] : [b, a];
      const steps = x < y ? [`交换加数，想 ${y} + ${x}`, ...carrySteps(x, y), `${x} + ${y} 和 ${y} + ${x} 得数一样，都是 ${a + b}`] : carrySteps(x, y);
      return { q: `${x} + ${y} = {0}`, answer: [num(a + b)], steps };
    },
  },
  {
    id: 'g1a-add-carry-mixed', grade: 1, term: 1, unit: '20以内的进位加法', name: '20 以内进位加法（综合）',
    tip: '凑十法：看大数分小数，先凑成 10，再加剩下的', level: 1, speed: 5,
    gen(r) {
      const [a, b] = r.until(() => [r.int(2, 9), r.int(2, 9)], ([x, y]) => x + y > 10);
      return { q: `${a} + ${b} = {0}`, answer: [num(a + b)], steps: carrySteps(a, b) };
    },
  },
  {
    id: 'g1a-add-carry-box', grade: 1, term: 1, unit: '20以内的进位加法', name: '□ 里填几（进位加法）',
    tip: '先想几加几凑成 10，再看还差几', level: 2, speed: 8,
    gen(r) {
      const [a, b] = r.until(() => [r.int(2, 9), r.int(2, 9)], ([x, y]) => x + y > 10), s = a + b, first = r.bool();
      return {
        q: first ? `${a} + {0} = ${s}` : `{0} + ${a} = ${s}`,
        answer: [num(b)],
        steps: [`${a} 先要 ${10 - a} 才凑成 10`, `10 到 ${s} 还要 ${s - 10}`, `${10 - a} 和 ${s - 10} 合起来是 ${b}`, `检查：${a} + ${b} = ${s} ✓`],
        hint: `${a} 加几是 10？10 再加几是 ${s}？`,
      };
    },
  },
  {
    id: 'g1a-add-carry-compare', grade: 1, term: 1, unit: '20以内的进位加法', name: '算式比大小（20 以内加法）',
    tip: '先算出得数再比；也可以不算：一个加数一样，另一个加数大的和就大', level: 2, speed: 8,
    gen(r) {
      const [a, b] = r.until(() => [r.int(2, 9), r.int(2, 9)], ([x, y]) => x + y > 10), s = a + b;
      if (r.chance(0.35)) {
        const c = r.until(() => r.int(2, 9), (x) => a + x > 10), t = a + c, sg = sign(s, t);
        return {
          q: `${a} + ${b} {0} ${a} + ${c}`,
          answer: [pick(CMP, sg)],
          steps: [`两边都有 ${a}`, b === c ? '另一个加数也一样，和相等' : `比另一个加数：${b} ${sg} ${c}，所以和也是 ${sg}`, `验证：${s} ${sg} ${t}`],
        };
      }
      const y = r.chance(0.2) ? s : r.int(Math.max(10, s - 3), Math.min(20, s + 3)), left = r.bool(), sg = left ? sign(s, y) : sign(y, s);
      return {
        q: left ? `${a} + ${b} {0} ${y}` : `${y} {0} ${a} + ${b}`,
        answer: [pick(CMP, sg)],
        steps: [`先算：${a} + ${b} = ${s}`, left ? `${s} ${sg} ${y}` : `${y} ${sg} ${s}`, left ? `所以 ${a} + ${b} ${sg} ${y}` : `所以 ${y} ${sg} ${a} + ${b}`],
      };
    },
  },
  {
    id: 'g1a-add-carry-chain', grade: 1, term: 1, unit: '20以内的进位加法', name: '连加、加减混合（20 以内）',
    tip: '从左往右一步一步算，每一步都写下得数', level: 2, speed: 12,
    gen(r) {
      const form = r.int(0, 2);
      if (form === 0) {
        const [a, b, c] = r.until(() => [r.int(1, 9), r.int(1, 9), r.int(1, 9)], ([x, y, z]) => x + y + z <= 20 && (x + y > 10 || x + y + z > 10) && x + y <= 18);
        const m = a + b;
        return { q: `${a} + ${b} + ${c} = {0}`, answer: [num(m + c)], steps: ['从左往右算', `先算 ${a} + ${b} = ${m}`, `再算 ${m} + ${c} = ${m + c}`, '也可以先找能凑成 10 的两个数'] };
      }
      if (form === 1) {
        const [a, b, c] = r.until(() => [r.int(2, 9), r.int(2, 9), r.int(1, 9)], ([x, y, z]) => x + y > 10 && z <= x + y - 10);
        const m = a + b;
        return { q: `${a} + ${b} - ${c} = {0}`, answer: [num(m - c)], steps: ['从左往右算', `先算 ${a} + ${b} = ${m}`, `再算 ${m} - ${c} = ${m - c}（个位 ${m - 10} 够减 ${c}）`] };
      }
      const a = r.int(5, 10), b = r.int(1, a - 2), m = a - b, d = r.int(11 - m, 9);
      return { q: `${a} - ${b} + ${d} = {0}`, answer: [num(m + d)], steps: ['从左往右算，先算减法', `先算 ${a} - ${b} = ${m}`, `再算 ${m} + ${d}：${carrySteps(m, d).at(-1)}`] };
    },
  },
  {
    id: 'g1a-word-20', grade: 1, term: 1, unit: '20以内的进位加法', name: '解决问题（20 以内加法）',
    tip: '求一共、求原来都用加法；先找出两个已知数', level: 1, process: true,
    gen(r) {
      const [p, q] = r.names(2), [a, b] = r.until(() => [r.int(2, 9), r.int(2, 9)], ([x, y]) => x + y > 10), s = a + b, form = r.int(0, 3);
      const ans = (u) => [num(s, { unit: u })];
      if (form === 0) {
        const [e, u] = r.pick(ITEMS);
        return {
          q: `一共有几${u}？`,
          fig: sceneFig([{ e, n: a }, { e, n: b }], { brace: `? ${u}` }),
          answer: ans(u),
          steps: [`左边 ${a} ${u}，右边 ${b} ${u}`, '把两部分合起来，用加法', `${a} + ${b} = ${s}（${u}）`, `答：一共有 ${s} ${u}。`],
        };
      }
      if (form === 1) {
        const [t, u] = r.pick([
          [`${p}有 ${a} 张贴画，${q}有 ${b} 张。两人一共有几张？`, '张'],
          [`一年级一班有 ${a} 人参加跳绳比赛，二班有 ${b} 人参加。一共有几人参加？`, '人'],
          [`妈妈买了 ${a} 个苹果和 ${b} 个梨。一共买了几个水果？`, '个'],
          [`${p}上午看了 ${a} 页书，下午看了 ${b} 页。一天一共看了几页？`, '页'],
          [`花坛里有 ${a} 朵红花，${b} 朵黄花。一共有几朵花？`, '朵'],
        ]);
        return { q: t, answer: ans(u), steps: ['求两部分一共有多少，用加法', `${a} + ${b} = ${s}（${u}）`, `答：一共 ${s} ${u}。`] };
      }
      if (form === 2) {
        const [t, u, gone] = r.pick([
          [`${p}送给同学 ${a} 张卡片，自己还剩 ${b} 张。${p}原来有几张卡片？`, '张', '送出的'],
          [`停车场开走了 ${a} 辆车，还剩 ${b} 辆。原来有几辆？`, '辆', '开走的'],
          [`一盒彩笔，用坏了 ${a} 支，还有 ${b} 支能用。这盒彩笔原来有几支？`, '支', '用坏的'],
          [`公交车到站下去 ${a} 人，车上还有 ${b} 人。原来车上有几人？`, '人', '下去的'],
        ]);
        return { q: t, answer: ans(u), steps: [`${gone} ${a} ${u}和剩下的 ${b} ${u}合起来，就是原来的`, '求原来有多少，用加法', `${a} + ${b} = ${s}（${u}）`, `答：原来有 ${s} ${u}。`] };
      }
      const c = r.int(2, Math.min(6, 20 - s));
      return {
        q: `学校门口第一天种了 ${a} 棵树，第二天种了 ${b} 棵，第三天种了 ${c} 棵。三天一共种了几棵？`,
        answer: [num(s + c, { unit: '棵' })],
        steps: ['三天的合起来，用连加', `${a} + ${b} + ${c} = ${s + c}（棵）`, `先算 ${a} + ${b} = ${s}，再算 ${s} + ${c} = ${s + c}`, `答：三天一共种了 ${s + c} 棵。`],
      };
    },
  },

  // ---------- 上册 · 找规律 ----------
  {
    id: 'g1a-seq-pattern', grade: 1, term: 1, unit: '找规律', name: '按规律填数（20 以内）',
    tip: '看相邻两个数：每次多几还是少几', level: 1,
    gen(r) {
      const up = r.bool(), st = r.pick([1, 2, 2, 3, 5]), len = st === 5 ? 5 : 6;
      const a = up ? r.int(0, 20 - st * (len - 1)) : r.int(st * (len - 1), 20);
      const seq = range(0, len - 1).map((i) => a + (up ? st : -st) * i);
      const holes = r.sample(range(2, len - 1), 2).sort((x, y) => x - y);
      return {
        q: `找规律填数：${seq.map((v, i) => (holes.includes(i) ? `{${holes.indexOf(i)}}` : v)).join('，')}`,
        answer: holes.map((i) => num(seq[i])),
        steps: [`看前面的数：${seq[0]} → ${seq[1]}，每次${up ? '多' : '少'} ${st}`, `一个一个往后${up ? '加' : '减'} ${st}：${seq.join('，')}`],
      };
    },
  },

  // ---------- 上册 · 拓展（思维题） ----------
  {
    id: 'g1a-queue', grade: 1, term: 1, unit: '20以内的进位加法', name: '排队问题',
    tip: '画圆圈表示人，自己用 ● 表示，别忘了把自己算进去', level: 3, process: true,
    gen(r) {
      const [p, q] = r.names(2), form = r.int(0, 3);
      const row = (n, k) => range(1, n).map((i) => (i === k ? '●' : '○')).join('');
      if (form === 0) {
        const a = r.int(2, 9), b = r.int(2, 9), n = a + b + 1;
        return { q: `同学们排队，${p}前面有 ${a} 人，后面有 ${b} 人。这一队一共有几人？`, answer: [num(n, { unit: '人' })], steps: [`画一画（● 是${p}）：${row(n, a + 1)}`, `前面 ${a} 人，后面 ${b} 人，还有${p}自己 1 人`, `${a} + ${b} + 1 = ${n}（人）`, `答：一共有 ${n} 人。`] };
      }
      if (form === 1) {
        const a = r.int(3, 10), b = r.int(3, 10), n = a + b - 1;
        return { q: `同学们排成一队，从前往后数，${p}排第 ${a}；从后往前数，${p}排第 ${b}。这一队一共有几人？`, answer: [num(n, { unit: '人' })], steps: [`画一画（● 是${p}）：${row(n, a)}`, `从前数到${p}是 ${a} 人，从后数到${p}是 ${b} 人`, `${p}被数了两次，要减去 1：${a} + ${b} - 1 = ${n}（人）`, `答：一共有 ${n} 人。`] };
      }
      if (form === 2) {
        const n = r.int(8, 18), a = r.int(2, n - 2);
        return { q: `${n} 个小朋友排成一队，${p}排第 ${a}。${p}后面有几人？`, answer: [num(n - a, { unit: '人' })], steps: [`画一画（● 是${p}）：${row(n, a)}`, `${p}排第 ${a}，从第 1 个到${p}一共 ${a} 人`, `后面的：${n} - ${a} = ${n - a}（人）`, `答：${p}后面有 ${n - a} 人。`] };
      }
      const a = r.int(2, 8), b = r.int(a + 2, 15);
      return { q: `小朋友排成一队，${p}排第 ${a}，${q}排第 ${b}。他们两人中间有几人？`, answer: [num(b - a - 1, { unit: '人' })], steps: [`画一画：${range(1, b).map((i) => (i === a || i === b ? '●' : '○')).join('')}`, `第 ${a} 个到第 ${b} 个之间，是第 ${a + 1} 个到第 ${b - 1} 个`, `${b} - ${a} - 1 = ${b - a - 1}（人）`, `答：中间有 ${b - a - 1} 人。`] };
    },
  },
  {
    id: 'g1a-shape-equation', grade: 1, term: 1, unit: '20以内的进位加法', name: '图形算式（△、○ 各是几）',
    tip: '先算只有一种图形的那一行，再把它的数代进另一行', level: 3,
    gen(r) {
      const form = r.int(0, 3);
      if (form === 0) {
        const k = r.int(2, 9), three = k <= 6 && r.bool();
        return three
          ? { q: `△ + △ + △ = ${3 * k}\n△ = {0}`, answer: [num(k)], steps: ['三个 △ 一样大', `试一试：${k} + ${k} + ${k} = ${3 * k} ✓`, `所以 △ = ${k}`] }
          : { q: `△ + △ = ${2 * k}\n△ = {0}`, answer: [num(k)], steps: ['两个 △ 一样大', `${2 * k} 分成两个一样的数：${k} 和 ${k}`, `△ = ${k}`] };
      }
      if (form === 1) {
        const k = r.int(2, 9), b = r.int(2, 9);
        return { q: `△ + △ = ${2 * k}\n△ + ○ = ${k + b}\n△ = {0}，○ = {1}`, answer: [num(k), num(b)], steps: [`第一行：两个 △ 一样大，${2 * k} = ${k} + ${k}，△ = ${k}`, `第二行：${k} + ○ = ${k + b}`, `${k} 加几等于 ${k + b}？○ = ${b}`] };
      }
      if (form === 2) {
        const k = r.int(2, 9), b = r.int(1, k - 1);
        return { q: `○ + ○ = ${2 * k}\n○ - △ = ${k - b}\n○ = {0}，△ = {1}`, answer: [num(k), num(b)], steps: [`第一行：○ + ○ = ${2 * k}，○ = ${k}`, `第二行：${k} - △ = ${k - b}`, `${k} 减几等于 ${k - b}？△ = ${b}`] };
      }
      const a = r.int(2, 9), b = r.int(2, 9), c = r.int(1, 9);
      return { q: `☆ + 3 = ${a + 3}\n☆ + △ = ${a + b}\n△ + ○ = ${b + c}\n○ = {0}`, answer: [num(c)], steps: [`第一行：☆ + 3 = ${a + 3}，☆ = ${a}`, `第二行：${a} + △ = ${a + b}，△ = ${b}`, `第三行：${b} + ○ = ${b + c}，○ = ${c}`] };
    },
  },
  {
    id: 'g1a-make-sum', grade: 1, term: 1, unit: '20以内的进位加法', name: '凑数（哪两个数合起来是几）',
    tip: '有顺序地找：先用最小的数去配，一个一个往上试，不重复不遗漏', level: 3,
    gen(r) {
      if (r.bool()) {
        const t = r.int(9, 15);
        const cards = r.until(() => r.sample(range(1, 9), 5), (cs) => {
          let k = 0;
          for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) if (cs[i] + cs[j] === t) k++;
          return k === 1;
        });
        const all = [];
        for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) all.push([Math.min(cards[i], cards[j]), Math.max(cards[i], cards[j])]);
        const [x, y] = all.find(([u, v]) => u + v === t), good = `${x} 和 ${y}`;
        const bad = r.sample(all.filter(([u, v]) => u + v !== t), 3).map(([u, v]) => `${u} 和 ${v}`);
        const tryLines = [];
        for (const c of [...cards].sort((u, v) => v - u)) {
          const need = t - c;
          if (need === c) tryLines.push(`${c} 要和 ${c} 合起来，可是 ${c} 只有一个，不行`);
          else if (cards.includes(need)) { tryLines.push(`${c} 要和 ${need} 合起来，有 ${need} ✓`); break; }
          else tryLines.push(`${c} 要和 ${need} 合起来，没有 ${need}`);
        }
        return {
          q: `从 ${cards.join('、')} 里选两个数，合起来是 ${t}。选哪两个？`,
          answer: [pick(r.shuffle([good, ...bad]), good)],
          steps: [`从最大的数开始，一个一个试：它要和几合起来是 ${t}？`, ...tryLines, `所以选 ${good}：${x} + ${y} = ${t}`],
        };
      }
      const t = r.int(5, 10), pairs = [];
      for (let x = 1; x < t - x; x++) pairs.push([x, t - x]);
      return {
        q: `从 1~9 里选两个不同的数，合起来是 ${t}，有几种选法？`,
        answer: [num(pairs.length, { unit: '种' })],
        steps: ['从最小的 1 开始，有顺序地找：', ...pairs.map(([x, y]) => `${x} + ${y} = ${t}`), t % 2 === 0 ? `${t / 2} + ${t / 2} 两个数一样，不算` : '再往后就重复了', `一共 ${pairs.length} 种`],
      };
    },
  },
  {
    id: 'g1a-sum-diff', grade: 1, term: 1, unit: '20以内的进位加法', name: '两个数的和与差',
    tip: '先列出合起来是这个数的几组，再看哪一组相差正好', level: 3,
    gen(r) {
      const [big, small] = r.until(() => [r.int(2, 12), r.int(1, 9)], ([x, y]) => x > y && x + y <= 18);
      const s = big + small, d = big - small, [p] = r.names(1);
      let tries = range(Math.ceil(s / 2), big).map((x) => `${x} 和 ${s - x}（相差 ${2 * x - s}）`);
      if (tries.length > 4) tries = [...tries.slice(0, 2), '……', tries.at(-1)];
      const story = r.bool();
      return {
        q: story ? `${p}和哥哥一共有 ${s} 颗弹珠，哥哥比${p}多 ${d} 颗。哥哥有几颗？${p}有几颗？\n哥哥 {0} 颗，${p} {1} 颗` : `两个数合起来是 ${s}，大数比小数多 ${d}。\n大数是 {0}，小数是 {1}`,
        answer: [num(big), num(small)],
        steps: [`从差不多一样大开始，把 ${s} 分一分：`, ...tries, `相差 ${d} 的是 ${big} 和 ${small}：${big} + ${small} = ${s}，${big} - ${small} = ${d} ✓`, story ? `答：哥哥有 ${big} 颗，${p}有 ${small} 颗。` : `大数是 ${big}，小数是 ${small}`],
      };
    },
  },
  {
    id: 'g1a-pattern-think', grade: 1, term: 1, unit: '找规律', name: '找规律（思维题）',
    tip: '看看相邻的数怎么变；变化不一样时，看看变化本身有没有规律', level: 3,
    gen(r) {
      const form = r.int(0, 3);
      if (form === 0) { // 差每次多 1
        const a = r.int(1, 5), seq = [a];
        for (let i = 1; i < 6; i++) seq.push(seq[i - 1] + i);
        if (seq[5] > 20) seq.splice(5);
        const last = seq.length - 1;
        return { q: `找规律填数：${seq.slice(0, last).join('，')}，{0}`, answer: [num(seq[last])], steps: [`看相邻两个数差几：${seq.slice(1).map((v, i) => `+${v - seq[i]}`).join('，')}`, '每次加的数比上一次多 1', `${seq[last - 1]} + ${last} = ${seq[last]}`] };
      }
      if (form === 1) { // 两组交替
        const a = r.int(1, 6), b = r.int(a + 3, 12), sa = r.int(1, 2), sb = r.int(1, 2);
        const seq = range(0, 6).map((i) => (i % 2 === 0 ? a + (i / 2) * sa : b - ((i - 1) / 2) * sb));
        return { q: `找规律填数：${seq.slice(0, 6).join('，')}，{0}`, answer: [num(seq[6])], steps: [`单数位置（第 1、3、5 个）：${a}，${a + sa}，${a + 2 * sa}，每次多 ${sa}`, `双数位置（第 2、4、6 个）：${b}，${b - sb}，${b - 2 * sb}，每次少 ${sb}`, `第 7 个是单数位置：${a + 2 * sa} + ${sa} = ${seq[6]}`] };
      }
      if (form === 2) { // 加法规律
        const t = r.int(9, 15), a = r.int(Math.max(1, t - 9) + 3, Math.min(9, t - 1));
        const rows = [0, 1, 2].map((i) => [a - i, t - a + i]);
        return { q: `找规律填数：\n${rows.map(([x, y]) => `${x} + ${y} = ${t}`).join('\n')}\n${a - 3} + {0} = ${t}`, answer: [num(t - a + 3)], steps: ['得数都不变', `前一个加数每次少 1，后一个加数就每次多 1`, `${a - 3} + ${t - a + 3} = ${t}`] };
      }
      const a = r.int(1, 6), k = r.int(2, 3), seq = [];
      for (let i = 0; seq.length < 9; i++) for (let j = 0; j < k && seq.length < 9; j++) seq.push(a + i);
      const n = r.int(7, 8);
      return { q: `找规律填数：${seq.slice(0, n).join('，')}，{0}`, answer: [num(seq[n])], steps: [`每个数都连着出现 ${k} 次，然后多 1`, `接下来是 ${seq[n]}`] };
    },
  },
  {
    id: 'g1a-compare-reason', grade: 1, term: 1, unit: '准备课', name: '比一比（谁最高、谁最重）',
    tip: '把三个人按顺序排一排：最高的在一头，最矮的在另一头', level: 3,
    gen(r) {
      const [a, b, c] = r.names(3); // a > b > c
      const [big, small, say, ask] = r.pick([
        ['高', '矮', (x, y, w) => `${x}比${y}${w}`, (w) => `谁最${w}？`],
        ['重', '轻', (x, y, w) => `${x}比${y}${w}`, (w) => `谁最${w}？`],
        ['快', '慢', (x, y, w) => `${x}比${y}跑得${w}`, (w) => `谁跑得最${w}？`],
        ['多', '少', (x, y, w) => `${x}的糖比${y}的${w}`, (w) => `谁的糖最${w}？`],
      ]);
      const fact = (x, y) => (r.bool() ? say(x, y, big) : say(y, x, small));
      const facts = r.shuffle([fact(a, b), fact(b, c)]), askBig = r.bool(), w = askBig ? big : small, ans = askBig ? a : c;
      return {
        q: `${facts.join('，')}。${ask(w)}`,
        answer: [pick(r.shuffle([a, b, c]), ans)],
        steps: [`「${say(a, b, big)}」也就是「${say(b, a, small)}」`, `「${say(b, c, big)}」也就是「${say(c, b, small)}」`, `按从${big}到${small}排一排：${a}、${b}、${c}`, `最${w}的是${ans}`],
      };
    },
  },

  // ---------- 下册 · 认识图形（二） ----------
  {
    id: 'g1b-plane-count', grade: 1, term: 2, unit: '认识图形（二）', name: '数一数平面图形',
    tip: '三角形有 3 条边；正方形 4 条边一样长；长方形是长长方方的；圆没有角', level: 1,
    gen(r) {
      const kinds = r.chance(0.4) ? ['tri', 'square', 'rect', 'circle', 'para'] : ['tri', 'square', 'rect', 'circle'];
      const cnt = kinds.map(() => r.int(1, 4)), list = r.shuffle(kinds.flatMap((k, i) => Array(cnt[i]).fill(k)));
      return {
        q: `数一数，各有几个？\n${kinds.map((k, i) => `${PLANE[k]} {${i}} 个`).join('，')}`,
        fig: planesFig(r, list),
        answer: cnt.map((n) => num(n)),
        steps: ['三角形：3 条直直的边、3 个角，尖朝哪边都是三角形', '正方形：4 条边一样长', '长方形：长长方方的，对着的两条边一样长', '圆：圆圆的，没有角', ...(kinds.length > 4 ? ['平行四边形：像被推歪了的长方形'] : []), `数一个划一个：${kinds.map((k, i) => `${PLANE[k]} ${cnt[i]} 个`).join('，')}`],
      };
    },
  },
  {
    id: 'g1b-plane-name', grade: 1, term: 2, unit: '认识图形（二）', name: '认识平面图形',
    tip: '从立体图形上描下一个面，就得到平面图形', level: 1,
    gen(r) {
      const OPT = ['长方形', '正方形', '三角形', '圆'];
      const all = [
        ['用魔方的一个面，能描出什么图形？', '正方形', '魔方每个面都是一样大的正方形'],
        ['用骰子的一个面，能描出什么图形？', '正方形', '骰子是正方体，每个面都是正方形'],
        ['用易拉罐的底面，能描出什么图形？', '圆', '易拉罐是圆柱，上下两个面是圆'],
        ['用固体胶的底面，能描出什么图形？', '圆', '固体胶是圆柱，底面是圆'],
        ['用字典的封面，能描出什么图形？', '长方形', '字典是长方体，封面长长方方的'],
        ['用牙膏盒最大的那个面，能描出什么图形？', '长方形', '牙膏盒是长方体，大的面是长方形'],
        ['用三角形积木（两头是三角形的那种）的一头，能描出什么图形？', '三角形', '它两头的面是三角形'],
        ['有 3 条直直的边、3 个角的图形是什么？', '三角形', '3 条边、3 个角，是三角形'],
        ['没有角、也没有直直的边的图形是什么？', '圆', '圆是弯弯的一圈，没有角'],
        ['4 条边都一样长、4 个角都是直角的图形是什么？', '正方形', '4 条边一样长，是正方形'],
        ['长长方方，对着的两条边一样长，但 4 条边不都一样长，是什么图形？', '长方形', '对边一样长、长和宽不一样，是长方形'],
        ['红领巾是什么形状？', '三角形', '红领巾有 3 条边、3 个角'],
        ['三角尺是什么形状？', '三角形', '三角尺有 3 条边、3 个角'],
        ['黑板面是什么形状？', '长方形', '黑板面长长方方的'],
        ['国旗是什么形状？', '长方形', '国旗长长方方的'],
        ['一元硬币的面是什么形状？', '圆', '硬币圆圆的'],
        ['光盘是什么形状？', '圆', '光盘圆圆的，没有角'],
        ['教室的门是什么形状？', '长方形', '门是长长方方的'],
        ['方方正正的手帕，4 条边一样长，是什么形状？', '正方形', '4 条边一样长，是正方形'],
        ['钟面一般是什么形状？', '圆', '常见的钟面是圆的'],
        ['把正方形纸沿对角（从一个角到对着的角）对折，折出的图形是什么？', '三角形', '对角折，折出来有 3 条边，是三角形'],
        ['把长方形纸对折（边对边），折出来是什么形状？', '长方形', '边对边对折，还是长长方方的'],
        ['用 4 根一样长的小棒，能围成什么图形？', '正方形', '4 条边一样长，是正方形'],
        ['用 3 根小棒能围成什么图形？', '三角形', '3 条边围起来是三角形'],
        ['冰箱门是什么形状？', '长方形', '冰箱门长长方方的'],
        ['饼干盒的盖子是圆的，用它能描出什么图形？', '圆', '盖子是圆的，描下来是圆'],
      ];
      const [q, a, why] = r.pick(all);
      return { q, answer: [pick(OPT, a)], steps: [why, `所以是${a}`] };
    },
  },
  {
    id: 'g1b-plane-compose', grade: 1, term: 2, unit: '认识图形（二）', name: '拼一拼、摆一摆',
    tip: '动手想一想：拼在一起是什么样子；摆的时候数一数用了几根', level: 2, pool: 12,
    gen(r) {
      const all = [
        ['2 个一样的正方形拼在一起，能拼成什么图形？', ['长方形', '三角形', '圆'], '长方形', ['两个正方形并排放', '变长了，是长方形']],
        ['拼成一个大正方形，最少要几个一样的小正方形？', ['2 个', '3 个', '4 个', '6 个'], '4 个', ['上面一行 2 个，下面一行 2 个', '2 + 2 = 4，最少 4 个']],
        ['一张长方形纸，从一个角剪到对着的角，剪成的 2 块是什么图形？', ['长方形', '三角形', '正方形'], '三角形', ['沿对角剪开，每块有 3 条边', '是 2 个三角形']],
        ['2 个一样的三角板，不能拼成下面哪个图形？', ['三角形', '长方形', '平行四边形', '圆'], '圆', ['三角板的边是直的，拼出来的图形边也都是直的', '圆是弯弯的，拼不出来']],
        ['七巧板一共有几块？', ['5 块', '6 块', '7 块', '8 块'], '7 块', ['七巧板，「七」就是 7 块']],
        ['七巧板里有几块三角形？', ['3 块', '4 块', '5 块', '7 块'], '5 块', ['七巧板 7 块：2 个大三角形、1 个中三角形、2 个小三角形，还有 1 个正方形、1 个平行四边形', '三角形 2 + 1 + 2 = 5 块']],
        ['七巧板里有几块正方形？', ['1 块', '2 块', '3 块', '4 块'], '1 块', ['七巧板里只有 1 块正方形']],
        ['摆一个三角形，最少要几根小棒？', ['2 根', '3 根', '4 根', '5 根'], '3 根', ['三角形有 3 条边', '最少要 3 根']],
        ['摆一个正方形要几根一样长的小棒？', ['3 根', '4 根', '5 根', '6 根'], '4 根', ['正方形 4 条边一样长', '要 4 根']],
        ['一张正方形纸剪去一个角（剪一刀），剩下的图形可能有几个角？', ['只能是 3 个', '只能是 4 个', '可能是 3 个、4 个或 5 个'], '可能是 3 个、4 个或 5 个', ['从两个角剪下去，剩 3 个角', '从一个角剪到对边，剩 4 个角', '两条边上各剪一点，剩 5 个角']],
        ['用 2 个一样的长方形拼成一个大长方形，能拼出几种样子？', ['1 种', '2 种', '3 种'], '2 种', ['长边对长边拼一种', '短边对短边拼一种', '一共 2 种']],
        ['4 个一样的小三角形可以拼成一个大三角形吗？', ['能', '不能'], '能', ['中间 1 个倒着放，周围 3 个正着放', '能拼成一个大三角形']],
      ];
      const [q, o, a, steps] = r.pick(all);
      return { q, answer: [pick(o, a)], steps };
    },
  },
  {
    id: 'g1b-count-figures', grade: 1, term: 2, unit: '认识图形（二）', name: '数图形（有几个三角形、长方形）',
    tip: '先数单个的，再数两个拼成的、三个拼成的……最后合起来', level: 3, pool: 7,
    gen(r) {
      const kind = r.pick(['fan', 'strip', 'grid2']);
      if (kind === 'grid2') return { q: '图中一共有几个正方形？', fig: countFig('grid2'), answer: [num(5, { unit: '个' })], steps: ['单个的小正方形：4 个', '4 个合起来的大正方形：1 个', '4 + 1 = 5（个）'] };
      const n = r.int(2, 4), what = kind === 'fan' ? '三角形' : '长方形';
      const parts = range(1, n).map((k) => [k, n - k + 1]);
      return {
        q: `图中一共有几个${what}？`,
        fig: countFig(kind, n),
        answer: [num((n * (n + 1)) / 2, { unit: '个' })],
        steps: [...parts.map(([k, c]) => `${k === 1 ? '单个' : `${k} 个拼成`}的：${c} 个`), `合起来：${parts.map(([, c]) => c).join(' + ')} = ${(n * (n + 1)) / 2}（个）`, '别忘了最大的那一个'],
      };
    },
  },
  {
    id: 'g1b-stick-pattern', grade: 1, term: 2, unit: '认识图形（二）', name: '摆小棒找规律',
    tip: '摆第 1 个用的根数多一些，后面每多摆 1 个，多用的根数一样', level: 3, process: true, pool: 8,
    gen(r) {
      const sq = r.bool(), n = r.int(4, 7), first = sq ? 4 : 3, add = sq ? 3 : 2, total = first + add * (n - 1), w = sq ? '正方形' : '三角形';
      return {
        q: `用小棒摆${w}（像图上这样连着摆），摆 1 个用 ${first} 根，摆 2 个用 ${first + add} 根，摆 3 个用 ${first + 2 * add} 根。摆 ${n} 个要用几根？`,
        fig: sticksRowFig(sq ? 'square' : 'tri'),
        answer: [num(total, { unit: '根' })],
        steps: [`每多摆 1 个${w}，多用 ${add} 根（有一条边和前一个共用）`, `接着往下数：${range(1, n).map((k) => first + add * (k - 1)).join('，')}`, `摆 ${n} 个要用 ${total} 根`],
      };
    },
  },

  // ---------- 下册 · 20以内的退位减法 ----------
  {
    id: 'g1b-sub-borrow-9', grade: 1, term: 2, unit: '20以内的退位减法', name: '十几减 9',
    tip: '破十法：10 - 9 = 1，再加上个位上的数', level: 1, speed: 6, pool: 8,
    gen(r) {
      const a = r.int(11, 18);
      return { q: `${a} - 9 = {0}`, answer: [num(a - 9)], steps: [...borrowSteps(a, 9), '小窍门：十几减 9，得数比个位上的数多 1'], hint: '10 减 9 剩几？' };
    },
  },
  {
    id: 'g1b-sub-borrow-876', grade: 1, term: 2, unit: '20以内的退位减法', name: '十几减 8、7、6',
    tip: '破十法：从 10 里减，再和个位合起来；或者想加算减', level: 1, speed: 6, pool: 18,
    gen(r) {
      const b = r.pick([8, 7, 6]), a = r.int(11, 9 + b);
      return { q: `${a} - ${b} = {0}`, answer: [num(a - b)], steps: borrowSteps(a, b) };
    },
  },
  {
    id: 'g1b-sub-borrow-5432', grade: 1, term: 2, unit: '20以内的退位减法', name: '十几减 5、4、3、2',
    tip: '想加算减：几加减数等于被减数', level: 1, speed: 6, pool: 10,
    gen(r) {
      const b = r.pick([5, 4, 3, 2]), a = r.int(11, 9 + b), c = a - b;
      return { q: `${a} - ${b} = {0}`, answer: [num(c)], steps: [`想加算减：${b} 加几等于 ${a}？`, `${b} + ${c} = ${a}`, `所以 ${a} - ${b} = ${c}`, `也可以破十：10 - ${b} = ${10 - b}，${10 - b} + ${a - 10} = ${c}`] };
    },
  },
  {
    id: 'g1b-sub-borrow-mixed', grade: 1, term: 2, unit: '20以内的退位减法', name: '20 以内退位减法（综合）',
    tip: '个位不够减就破十：先用 10 减，再加上个位', level: 1, speed: 5,
    gen(r) {
      const b = r.int(2, 9), a = r.int(11, 9 + b);
      return { q: `${a} - ${b} = {0}`, answer: [num(a - b)], steps: borrowSteps(a, b) };
    },
  },
  {
    id: 'g1b-sub-borrow-box', grade: 1, term: 2, unit: '20以内的退位减法', name: '□ 里填几（退位减法）',
    tip: '把减法想成加法：减数 + 差 = 被减数', level: 2, speed: 8,
    gen(r) {
      const b = r.int(2, 9), a = r.int(11, 9 + b), c = a - b, form = r.int(0, 3);
      const F = [
        [`${a} - {0} = ${c}`, b, [`想：${a} 减几等于 ${c}？`, `也就是 ${c} 加几等于 ${a}`, `${c} + ${b} = ${a}，所以填 ${b}`]],
        [`{0} - ${b} = ${c}`, a, ['□ 是被减数：减去的 + 剩下的 = 原来的', `${b} + ${c} = ${a}`, `检查：${a} - ${b} = ${c} ✓`]],
        [`${b} + {0} = ${a}`, c, [`想：${b} 加几等于 ${a}？`, `就是算 ${a} - ${b} = ${c}`, `所以填 ${c}`]],
        [`${a} - {0} = ${b}`, c, [`想：${b} 加几等于 ${a}？`, `${b} + ${c} = ${a}`, `所以 ${a} - ${c} = ${b}，填 ${c}`]],
      ][form];
      return { q: F[0], answer: [num(F[1])], steps: F[2] };
    },
  },
  {
    id: 'g1b-sub-borrow-compare', grade: 1, term: 2, unit: '20以内的退位减法', name: '算式比大小（退位减法）',
    tip: '先算出得数再比；被减数一样时，减得越多剩得越少', level: 2, speed: 8,
    gen(r) {
      const b = r.int(2, 9), a = r.int(11, 9 + b), c = a - b;
      if (r.chance(0.35)) {
        const d = r.until(() => r.int(2, 9), (x) => a - x < 10), e = a - d, sg = sign(c, e);
        return { q: `${a} - ${b} {0} ${a} - ${d}`, answer: [pick(CMP, sg)], steps: [`被减数都是 ${a}`, b === d ? '减数也一样，差相等' : `减数 ${b} ${b > d ? '大' : '小'}，减得${b > d ? '多，剩得少' : '少，剩得多'}`, `验证：${c} ${sg} ${e}`] };
      }
      const y = r.chance(0.2) ? c : r.int(Math.max(1, c - 3), c + 3), left = r.bool(), sg = left ? sign(c, y) : sign(y, c);
      return { q: left ? `${a} - ${b} {0} ${y}` : `${y} {0} ${a} - ${b}`, answer: [pick(CMP, sg)], steps: [`先算：${a} - ${b} = ${c}`, left ? `${c} ${sg} ${y}` : `${y} ${sg} ${c}`, left ? `所以 ${a} - ${b} ${sg} ${y}` : `所以 ${y} ${sg} ${a} - ${b}`] };
    },
  },
  {
    id: 'g1b-sub-borrow-chain', grade: 1, term: 2, unit: '20以内的退位减法', name: '连减、加减混合（20 以内）',
    tip: '从左往右一步一步算，每一步看清是加还是减', level: 2, speed: 12,
    gen(r) {
      const form = r.int(0, 2);
      if (form === 0) {
        const [a, b, c] = r.until(() => [r.int(11, 18), r.int(2, 9), r.int(1, 9)], ([x, y, z]) => x - y < 10 && x - y - z >= 0);
        return { q: `${a} - ${b} - ${c} = {0}`, answer: [num(a - b - c)], steps: ['从左往右算', `先算 ${a} - ${b} = ${a - b}`, `再算 ${a - b} - ${c} = ${a - b - c}`] };
      }
      if (form === 1) {
        const [a, b, c] = r.until(() => [r.int(11, 18), r.int(2, 9), r.int(1, 9)], ([x, y, z]) => x - y < 10 && x - y + z <= 20);
        return { q: `${a} - ${b} + ${c} = {0}`, answer: [num(a - b + c)], steps: ['从左往右算，先算减法', `先算 ${a} - ${b} = ${a - b}`, `再算 ${a - b} + ${c} = ${a - b + c}`] };
      }
      const [a, b, c] = r.until(() => [r.int(2, 9), r.int(2, 9), r.int(2, 9)], ([x, y, z]) => x + y > 10 && x + y - z < 10);
      return { q: `${a} + ${b} - ${c} = {0}`, answer: [num(a + b - c)], steps: ['从左往右算', `先算 ${a} + ${b} = ${a + b}`, `再算 ${a + b} - ${c} = ${a + b - c}（个位不够减，用破十法）`] };
    },
  },
  {
    id: 'g1b-word-sub-20', grade: 1, term: 2, unit: '20以内的退位减法', name: '解决问题（还剩、求一部分）',
    tip: '从一共里去掉一部分，求剩下的那部分，用减法', level: 1, process: true,
    gen(r) {
      const [p, q] = r.names(2), b = r.int(2, 9), a = r.int(11, 9 + b), c = a - b, form = r.int(0, 2);
      if (form === 0) {
        const [e, u] = r.pick(ITEMS);
        return {
          q: `一共 ${a} ${u}，盒子里有几${u}？`,
          fig: sceneFig([{ e, n: b }, { hide: true }], { brace: `${a} ${u}` }),
          answer: [num(c, { unit: u })],
          steps: [`一共 ${a} ${u}，外面看得见 ${b} ${u}`, '求盒子里的，用减法：一共 - 看得见的', `${a} - ${b} = ${c}（${u}）`, `答：盒子里有 ${c} ${u}。`],
        };
      }
      if (form === 1) {
        const [t, u, say] = r.pick([
          [`${p}有 ${a} 元钱，买书用了 ${b} 元。还剩几元？`, '元', '还剩'],
          [`停车场有 ${a} 辆车，开走了 ${b} 辆。还剩几辆？`, '辆', '还剩'],
          [`树上有 ${a} 只鸟，飞走了 ${b} 只。还剩几只？`, '只', '还剩'],
          [`${p}要折 ${a} 只纸鹤，已经折了 ${b} 只。还要折几只？`, '只', '还要折'],
          [`图书角有 ${a} 本书，借走了 ${b} 本。还剩几本？`, '本', '还剩'],
        ]);
        return { q: t, answer: [num(c, { unit: u })], steps: [`从 ${a} 里去掉 ${b}，求${say === '还剩' ? '还剩几' : '还差几'}，用减法`, `${a} - ${b} = ${c}（${u}）`, `答：${say} ${c} ${u}。`] };
      }
      const [t, u, pa, pb] = r.pick([
        [`${p}和${q}一共有 ${a} 张画片，${p}有 ${b} 张。${q}有几张？`, '张', p, q],
        [`一班有 ${a} 人去参观，其中女生 ${b} 人。男生有几人？`, '人', '女生', '男生'],
        [`篮子里有 ${a} 个水果，其中苹果 ${b} 个，其余是梨。梨有几个？`, '个', '苹果', '梨'],
        [`${a} 个气球，红气球有 ${b} 个，其余是黄气球。黄气球有几个？`, '个', '红气球', '黄气球'],
      ]);
      return { q: t, answer: [num(c, { unit: u })], steps: [`一共 ${a} ${u}，分成${pa}和${pb}两部分`, `求${pb}，用一共减${pa}`, `${a} - ${b} = ${c}（${u}）`, `答：${pb}有 ${c} ${u}。`] };
    },
  },
  {
    id: 'g1b-word-diff-20', grade: 1, term: 2, unit: '20以内的退位减法', name: '解决问题（求多几、少几）',
    tip: '求谁比谁多几、少几：从多的里面去掉和少的同样多的部分，用减法', level: 1, process: true,
    gen(r) {
      const [p, q] = r.names(2), x = r.int(8, 18), y = r.int(2, x - 1), d = x - y;
      if (r.chance(0.4) && x <= 10) {
        const [a, b, ua, ub] = r.pick([['🐰', '🥕', '只', '根'], ['🐵', '🍌', '只', '根'], ['🐱', '🐟', '只', '条'], ['🐔', '🥚', '只', '个']]);
        const [big, small, nb, ns, ub2, us2] = r.bool() ? [a, b, x, y, ua, ub] : [b, a, x, y, ub, ua];
        const more = r.bool();
        return {
          q: more ? `${big}比${small}多几${ub2}？` : `${small}比${big}少几${us2}？`,
          fig: pairRows([[big, nb], [small, ns]]),
          answer: [num(d, { unit: more ? ub2 : us2 })],
          steps: [`${big}有 ${nb} ${ub2}，${small}有 ${ns} ${us2}`, `一个对一个，${big}多出来 ${d} ${ub2}`, `列式：${nb} - ${ns} = ${d}（${more ? ub2 : us2}）`],
        };
      }
      const [t1, u, more] = r.pick([
        [`${p}有 ${x} 本故事书，${q}有 ${y} 本。${p}比${q}多几本？`, '本', true],
        [`${p}有 ${x} 本故事书，${q}有 ${y} 本。${q}比${p}少几本？`, '本', false],
        [`${p}跳绳跳了 ${x} 下，${q}跳了 ${y} 下。${p}比${q}多跳几下？`, '下', true],
        [`树上有 ${x} 只麻雀，${y} 只喜鹊。喜鹊比麻雀少几只？`, '只', false],
        [`红花有 ${x} 朵，黄花有 ${y} 朵。红花比黄花多几朵？`, '朵', true],
        [`${p}套圈套中了 ${y} 个，${q}套中了 ${x} 个。${p}比${q}少套中几个？`, '个', false],
      ]);
      return {
        q: t1,
        answer: [num(d, { unit: u })],
        steps: [`${x} 和 ${y} 比，多的是 ${x}，少的是 ${y}`, `${x} 里有和 ${y} 同样多的部分，去掉它，剩下的就是${more ? '多' : '少'}的`, `用减法（大数 - 小数）：${x} - ${y} = ${d}（${u}）`, `答：${more ? '多' : '少'} ${d} ${u}。`],
        hint: '求相差多少，用大数减小数',
      };
    },
  },

  // ---------- 下册 · 分类与整理 ----------
  {
    id: 'g1b-classify', grade: 1, term: 2, unit: '分类与整理', name: '分一分，数一数',
    tip: '先定好按什么分，同一类的放一起，数的时候数一个划一个', level: 1,
    gen(r) {
      if (r.chance(0.55)) {
        const kinds = r.sample(['🍎', '🍐', '🍊', '🍌', '🍓', '🍇', '🍑'], 3);
        const cnt = r.until(() => kinds.map(() => r.int(2, 7)), (c) => new Set(c).size === 3);
        const list = r.shuffle(kinds.flatMap((k, i) => Array(cnt[i]).fill(k)));
        const most = kinds[cnt.indexOf(Math.max(...cnt))], least = kinds[cnt.indexOf(Math.min(...cnt))], askMost = r.bool();
        const ans = askMost ? most : least;
        return {
          q: `${kinds.map((k, i) => `${k}有 {${i}} 个`).join('，')}。\n最${askMost ? '多' : '少'}的是 {3}`,
          fig: mixFig(list),
          answer: [...cnt.map((n) => num(n)), pick(kinds, ans)],
          steps: [`按种类分一分，一种一种地数（数一个划一个）`, kinds.map((k, i) => `${k} ${cnt[i]} 个`).join('，'), `比一比：${Math.max(...cnt)} 最大，${Math.min(...cnt)} 最小`, `最${askMost ? '多' : '少'}的是 ${ans}`],
        };
      }
      const G = r.sample([['水果', ['🍎', '🍐', '🍊', '🍌', '🍓']], ['动物', ['🐶', '🐱', '🐰', '🐼', '🐵']], ['交通工具', ['🚗', '🚌', '🚲', '🚂', '🚢']], ['文具', ['✏️', '📏', '📒', '✂️', '🖍️']]], 3);
      const cnt = G.map(() => r.int(2, 6));
      const list = r.shuffle(G.flatMap(([, es], i) => Array.from({ length: cnt[i] }, () => r.pick(es))));
      return {
        q: `按「${G.map((g) => g[0]).join('、')}」分一分：\n${G.map(([n], i) => `${n}有 {${i}} 个`).join('，')}`,
        fig: mixFig(list),
        answer: cnt.map((n) => num(n)),
        steps: [...G.map(([n, es], i) => `${n}：${list.filter((e) => es.includes(e)).join('')}，${cnt[i]} 个`), '东西不一样，但是同一类的就分在一起'],
      };
    },
  },

  // ---------- 下册 · 100以内数的认识 ----------
  {
    id: 'g1b-hundred-compose', grade: 1, term: 2, unit: '100以内数的认识', name: '几个十和几个一',
    tip: '十位上是几就是几个十，个位上是几就是几个一；10 个十是 100', level: 1,
    gen(r) {
      const t = r.int(2, 9), o = r.int(0, 9), n = t * 10 + o, form = r.int(0, 5);
      const why = `${n} 是 ${t} 个十${o ? `和 ${o} 个一` : ''}`;
      if (form === 0) return { q: `${t} 个十和 ${o} 个一合起来是 {0}`, answer: [num(n)], steps: [`${t} 个十是 ${t * 10}`, `${t * 10} 和 ${o} 合起来是 ${n}`] };
      if (form === 1) return { q: `${n} 里面有 {0} 个十和 {1} 个一`, answer: [num(t), num(o)], steps: [`${n} 的十位上是 ${t}，表示 ${t} 个十`, `个位上是 ${o}，表示 ${o} 个一`] };
      if (form === 2) {
        const tt = r.int(2, 6);
        return { q: '数一数，小棒一共有几根？\n{0} 根', fig: sticksFig(tt, o), answer: [num(tt * 10 + o)], steps: [`一捆是 10 根，${tt} 捆是 ${tt} 个十，${tt * 10} 根`, o ? `还有 ${o} 根单根的` : '没有单根的', `合起来是 ${tt * 10 + o} 根`] };
      }
      if (form === 3) {
        const tt = r.int(1, 6), oo = r.int(0, 6);
        return { q: '数位表上摆的数是 {0}', fig: beadsFig(tt, oo), answer: [num(tt * 10 + oo)], steps: [`十位上有 ${tt} 个圆片，表示 ${tt} 个十`, oo ? `个位上有 ${oo} 个圆片，表示 ${oo} 个一` : '个位上没有圆片，个位写 0', `这个数是 ${tt * 10 + oo}`] };
      }
      if (form === 4) {
        const k = r.int(0, 3);
        return [
          { q: `${t} 个十是 {0}`, answer: [num(t * 10)], steps: [`${t} 个十就是 ${t}0`, `10 个 10 个地数，数 ${t} 次：${range(1, t).map((i) => i * 10).join('、')}`] },
          { q: '10 个十是 {0}', answer: [num(100)], steps: ['10 个 10 个地数：10、20……90、100', '10 个十是 100'] },
          { q: '100 里面有 {0} 个十', answer: [num(10)], steps: ['10 个十是 100', '所以 100 里面有 10 个十'] },
          { q: '100 里面有 {0} 个一', answer: [num(100)], steps: ['一个一个地数到 100，有 100 个一'] },
        ][k];
      }
      const up = (t + 1) * 10;
      return { q: `${n} 再添上 {0} 个一就是 ${up}`, answer: [num(up - n)], steps: [why, o ? `个位 ${o} 再添 ${10 - o} 个一，满 10 个一就是 1 个十` : `${n} 再添 1 个十才是 ${up}，就是 10 个一`, `${n} + ${up - n} = ${up}`] };
    },
  },
  {
    id: 'g1b-place-value', grade: 1, term: 2, unit: '100以内数的认识', name: '数位：个位、十位、百位',
    tip: '从右边起，第一位是个位，第二位是十位，第三位是百位', level: 1,
    gen(r) {
      const t = r.int(1, 9), o = r.int(0, 9), n = t * 10 + o, form = r.int(0, 4);
      if (form === 0) {
        const rev = r.bool();
        return { q: rev ? `个位上是 ${o}，十位上是 ${t}，这个数是 {0}` : `十位上是 ${t}，个位上是 ${o}，这个数是 {0}`, answer: [num(n)], steps: ['十位写在左边，个位写在右边', `十位写 ${t}，个位写 ${o}：${n}`, ...(rev ? ['题目先说个位，别写反了'] : [])] };
      }
      if (form === 1) return { q: `${n} 的十位上是 {0}，表示 {1} 个十；个位上是 {2}，表示 {3} 个一`, answer: [num(t), num(t), num(o), num(o)], steps: ['从右边起，第一位是个位，第二位是十位', `${n}：十位是 ${t}，表示 ${t} 个十`, `个位是 ${o}，表示 ${o} 个一`] };
      if (form === 2) {
        const [tt, oo] = r.until(() => [r.int(1, 9), r.int(1, 9)], ([x, y]) => x !== y), m = tt * 10 + oo, d = r.bool() ? tt : oo;
        const ans = d === tt ? '十位' : '个位';
        return { q: `${m} 中的「${d}」在 {0} 上，表示 {1} 个${d === tt ? '十' : '一'}`, answer: [pick(['个位', '十位', '百位'], ans), num(d)], steps: [`${m}：从右边起，第一位 ${oo} 在个位，第二位 ${tt} 在十位`, `${d} 在${ans}上，表示 ${d} 个${d === tt ? '十' : '一'}`] };
      }
      if (form === 3) {
        const k = r.int(0, 2);
        return [
          { q: '100 是 {0} 位数，它的最高位是 {1}', answer: [num(3), pick(['个位', '十位', '百位'], '百位')], steps: ['100 有 3 个数字，是三位数', '从右边起第三位是百位，1 在百位上'] },
          { q: `${n} 是 {0} 位数`, answer: [num(n >= 10 ? 2 : 1)], steps: [`${n} 有 2 个数字，是两位数`] },
          { q: '从右边起，第二位是 {0}', answer: [pick(['个位', '十位', '百位'], '十位')], steps: ['从右边起：第一位个位，第二位十位，第三位百位'] },
        ][k];
      }
      const d = r.int(1, 9);
      return r.bool()
        ? { q: `一个两位数，十位和个位上都是 ${d}，这个数是 {0}`, answer: [num(d * 11)], steps: [`十位写 ${d}，个位也写 ${d}`, `这个数是 ${d * 11}`] }
        : { q: `一个两位数，十位上是 ${d}，个位上是 0，这个数是 {0}`, answer: [num(d * 10)], steps: [`十位写 ${d}，个位写 0`, `这个数是 ${d * 10}，就是 ${d} 个十`] };
    },
  },
  {
    id: 'g1b-read-write', grade: 1, term: 2, unit: '100以内数的认识', name: '读数和写数（100 以内）',
    tip: '读数、写数都从高位起：先十位，再个位；个位上是 0 不读', level: 1,
    gen(r) {
      const t = r.int(1, 9), o = r.chance(0.25) ? 0 : r.int(1, 9), n = r.chance(0.08) ? 100 : t * 10 + o, w = readInt(n);
      if (r.bool()) {
        const wrong = n === 100 ? ['1000', '10', '110'] : o ? [`${o}${t}`, `${t}0${o}`, `${t}${o}0`] : [`${t}00`, `${t}`, `1${t}`];
        return { q: `「${w}」写作`, answer: [pick(opts(r, String(n), wrong.filter((x) => x !== String(n)), [], 3), String(n))], steps: [n === 100 ? '一百就是 10 个十，写作 100' : `${w}：十位上是 ${t}，个位上是 ${o}`, `写作 ${n}${o === 0 && n !== 100 ? '（个位上一个也没有，要写 0 占位）' : ''}`] };
      }
      const wrong = n === 100 ? ['十十', '一零零', '一千'] : o ? [`${CN1[t]}${CN1[o]}`, readInt(o * 10 + t), `${CN1[t]}十零${CN1[o]}`] : [`${CN1[t]}零`, readInt(10 + t), `${CN1[t]}百`];
      return { q: `${n} 读作`, answer: [pick(opts(r, w, wrong.filter((x) => x !== w), [], 3), w)], steps: [n === 100 ? '100 读作一百' : `先读十位：${CN1[t]}十${o ? `，再读个位：${CN1[o]}` : '，个位上是 0，不读'}`, `${n} 读作「${w}」`] };
    },
  },
  {
    id: 'g1b-hundred-compare', grade: 1, term: 2, unit: '100以内数的认识', name: '比大小（100 以内）',
    tip: '位数多的数大；位数一样先比十位，十位一样再比个位', level: 1, speed: 4,
    gen(r) {
      const why = (x, y) => {
        const lx = String(x).length, ly = String(y).length, sg = sign(x, y);
        if (x === y) return '两个数一样';
        if (lx !== ly) return `${lx > ly ? x : y} 是${lx > ly ? (lx === 3 ? '三' : '两') : (ly === 3 ? '三' : '两')}位数，位数多的大`;
        if (Math.floor(x / 10) !== Math.floor(y / 10)) return `先比十位：${Math.floor(x / 10)} ${sg} ${Math.floor(y / 10)}`;
        return `十位一样，再比个位：${x % 10} ${sg} ${y % 10}`;
      };
      if (r.chance(0.3)) {
        const four = r.until(() => r.sample(range(10, 99), 4), (f) => r.chance(0.5) || new Set(f.map((v) => Math.floor(v / 10))).size < 4), big = r.bool(), ans = big ? Math.max(...four) : Math.min(...four);
        return { q: `哪个数最${big ? '大' : '小'}？`, answer: [pick(four.map(String), String(ans))], steps: ['先比十位，十位一样再比个位', `从小到大：${[...four].sort((a, b) => a - b).join(' < ')}`, `最${big ? '大' : '小'}的是 ${ans}`] };
      }
      const a = r.int(10, 99), kind = r.int(0, 4);
      const b = kind === 0 ? r.int(1, 9) : kind === 1 ? Math.floor(a / 10) * 10 + r.int(0, 9) : kind === 2 ? (a % 10) * 10 + Math.floor(a / 10) || 100 : kind === 3 ? (r.chance(0.5) ? 100 : a) : r.int(10, 99);
      const [x, y] = r.bool() ? [a, b] : [b, a], sg = sign(x, y);
      return { q: `${x} {0} ${y}`, answer: [pick(CMP, sg)], steps: [why(x, y), `${x} ${sg} ${y}`] };
    },
  },
  {
    id: 'g1b-hundred-order', grade: 1, term: 2, unit: '100以内数的认识', name: '数的顺序（100 以内）',
    tip: '后一个数多 1，前一个数少 1；几十九后面是下一个整十', level: 1,
    gen(r) {
      const form = r.int(0, 5);
      if (form === 0) {
        const n = r.chance(0.4) ? r.pick([r.int(2, 9) * 10, r.int(1, 8) * 10 + 9]) : r.int(21, 98);
        return { q: `${n} 前面一个数是 {0}，后面一个数是 {1}`, answer: [num(n - 1), num(n + 1)], steps: [`按顺序：${n - 1}、${n}、${n + 1}`, ...(n % 10 === 0 ? [`几十前面的一个数是几十九：${n} 前面是 ${n - 1}`] : n % 10 === 9 ? [`${n} 再添 1 个一，个位满 10，变成 ${n + 1}`] : [])] };
      }
      if (form === 1) {
        const n = r.int(11, 89), [w, v] = r.pick([['大 1', n + 1], ['小 1', n - 1], ['多 10', n + 10], ['少 10', n - 10]]);
        return { q: `比 ${n} ${w}的数是 {0}`, answer: [num(v)], steps: [w.includes('10') ? `${w}，就是十位上${w[0] === '多' ? '多' : '少'} 1，个位不变` : `${w}，就是它${w[0] === '大' ? '后面' : '前面'}的一个数`, `${n} ${w[0] === '多' || w[0] === '大' ? '+' : '-'} ${w.includes('10') ? 10 : 1} = ${v}`] };
      }
      if (form === 2) {
        const k = r.pick([2, 5, 10]), a = k === 10 ? r.int(1, 4) * 10 + r.int(0, 9) : k * r.int(1, 12), seq = range(0, 5).map((i) => a + i * k);
        return { q: `${k} 个 ${k} 个地数：${seq.slice(0, 4).join('，')}，{0}，{1}`, answer: [num(seq[4]), num(seq[5])], steps: [`每次多 ${k}`, `${seq[3]} + ${k} = ${seq[4]}，${seq[4]} + ${k} = ${seq[5]}`] };
      }
      if (form === 3) {
        const k = r.int(0, 2);
        return [
          { q: '最大的两位数是 {0}，最小的两位数是 {1}', answer: [num(99), num(10)], steps: ['两位数里，十位、个位都是 9 最大：99', '十位最小是 1，个位是 0：10'] },
          { q: '最大的一位数是 {0}，它再添 1 是 {1}', answer: [num(9), num(10)], steps: ['一位数是 0~9，最大是 9', '9 + 1 = 10'] },
          { q: '最大的两位数再添 1 是 {0}', answer: [num(100)], steps: ['最大的两位数是 99', '99 + 1 = 100'] },
        ][k];
      }
      if (form === 4) {
        const a = r.int(20, 90), b = a + r.int(3, 8);
        return { q: `比 ${a} 大、比 ${b} 小的数有 {0} 个`, answer: [num(b - a - 1)], steps: [`从 ${a} 后面数起，到 ${b} 前面停：${range(a + 1, b - 1).join('、')}`, `一共 ${b - a - 1} 个（${a} 和 ${b} 自己不算）`] };
      }
      const a = r.int(2, 9) * 10 + r.int(1, 3), seq = range(0, 5).map((i) => a - i);
      return { q: `倒着数：${seq[0]}，${seq[1]}，{0}，${seq[3]}，{1}`, answer: [num(seq[2]), num(seq[4])], steps: ['倒着数，每次少 1', `${seq.join('，')}`, '几十的前面是几十九，别数错'] };
    },
  },
  {
    id: 'g1b-hundred-chart', grade: 1, term: 2, unit: '100以内数的认识', name: '百数表找数',
    tip: '百数表里往右一格多 1，往左少 1；往下一格多 10，往上少 10', level: 2,
    gen(r) {
      const n = r.until(() => r.int(12, 89), (x) => x % 10 >= 2);
      const pos = { '-1,-1': '左上', '-1,0': '上面', '-1,1': '右上', '0,-1': '左边', '0,1': '右边', '1,-1': '左下', '1,0': '下面', '1,1': '右下' };
      const diag = r.chance(0.3), pool = Object.keys(pos).filter((k) => diag || !k.split(',').every((v) => v !== '0'));
      const [ka, kb] = r.sample(pool, 2), shown = r.sample(Object.keys(pos).filter((k) => k !== ka && k !== kb && !k.split(',').every((v) => v !== '0')), 1);
      const val = (k) => { const [i, j] = k.split(',').map(Number); return n + i * 10 + j; };
      const say = (k) => { const [i, j] = k.split(',').map(Number); const parts = []; if (i) parts.push(i > 0 ? '往下一格多 10' : '往上一格少 10'); if (j) parts.push(j > 0 ? '往右一格多 1' : '往左一格少 1'); return `${pos[k]}：${parts.join('，')}，是 ${val(k)}`; };
      return {
        q: '这是百数表的一部分。\nA = {0}，B = {1}',
        fig: chartFig(n, ['0,0', ...shown], { [ka]: 'A', [kb]: 'B' }),
        answer: [num(val(ka)), num(val(kb))],
        steps: [`中间的数是 ${n}`, `A 在 ${n} 的${say(ka)}`, `B 在 ${n} 的${say(kb)}`],
      };
    },
  },
  {
    id: 'g1b-more-less-words', grade: 1, term: 2, unit: '100以内数的认识', name: '多一些、少一些、多得多、少得多',
    tip: '相差几个用「一些」，相差几十用「得多」', level: 2,
    gen(r) {
      const W = ['多一些', '少一些', '多得多', '少得多'];
      if (r.bool()) {
        const a = r.int(10, 99), big = r.chance(0.5);
        const b = r.until(() => r.int(10, 99), (x) => { const d = Math.abs(x - a); return (big ? d >= 30 : d >= 1 && d <= 9); });
        const w = `${a > b ? '多' : '少'}${big ? '得多' : '一些'}`;
        return { q: `${a} 比 ${b} {0}`, answer: [pick(W, w)], steps: [`${a} ${a > b ? '>' : '<'} ${b}，是「${a > b ? '多' : '少'}」`, big ? `相差 ${Math.abs(a - b)}，差了几十，用「得多」` : `只相差 ${Math.abs(a - b)}，差得不多，用「一些」`, `${a} 比 ${b} ${w}`] };
      }
      const [p, q] = r.names(2), a = r.int(40, 60);
      const vals = { 多一些: a + r.int(2, 6), 少一些: a - r.int(2, 6), 多得多: a + r.int(30, 39), 少得多: a - r.int(30, 39) };
      const w = r.pick(W), others = r.sample(W.filter((x) => x !== w), 2);
      const o = r.shuffle([w, ...others]).map((k) => String(vals[k]));
      const [thing, u] = r.pick([['故事书', '本'], ['邮票', '张'], ['彩色铅笔', '支'], ['贴纸', '张']]);
      return {
        q: `${p}有 ${a} ${u}${thing}，${q}的比${p}${w}。${q}可能有几${u}？`,
        answer: [pick(o, String(vals[w]))],
        steps: [`「${w}」：${w.startsWith('多') ? '比' + a + '大' : '比' + a + '小'}，${w.endsWith('得多') ? '而且差几十' : '只差几个'}`, ...o.map((v) => `${v} 和 ${a} 比：${+v > a ? '多' : '少'}${Math.abs(+v - a) >= 30 ? '得多' : '一些'}`), `所以选 ${vals[w]}`],
      };
    },
  },
  {
    id: 'g1b-near-tens', grade: 1, term: 2, unit: '100以内数的认识', name: '估一估：接近几十',
    tip: '看个位：个位小，接近前面的整十数；个位大，接近后面的整十数', level: 2,
    gen(r) {
      const t = r.int(1, 9), o = r.pick([1, 2, 3, 4, 6, 7, 8, 9]), n = t * 10 + o, lo = t * 10, hi = lo + 10, ans = o < 5 ? lo : hi;
      const steps = [`${n} 在 ${lo} 和 ${hi} 中间`, `离 ${lo} 差 ${o}，离 ${hi} 差 ${10 - o}`, `差得少的更接近：${n} 接近 ${ans}`];
      if (r.bool()) return { q: `${n} 更接近 ${lo} 还是 ${hi}？`, answer: [pick([String(lo), String(hi)], String(ans))], steps };
      const [thing, u] = r.pick([['小朋友', '人'], ['苹果', '个'], ['小鸟', '只'], ['花', '朵']]);
      return { q: `数一数，一共有 ${n} ${u}${thing}，大约有几十${u}？\n大约 {0} ${u}`, answer: [num(ans)], steps };
    },
  },
  {
    id: 'g1b-digit-cards', grade: 1, term: 2, unit: '100以内数的认识', name: '用数字卡片组成两位数',
    tip: '0 不能放在十位上；要最大，把大的数字放十位', level: 2,
    gen(r) {
      const hasZero = r.chance(0.4), ds = hasZero ? [0, ...r.sample(range(1, 9), 2)] : r.sample(range(1, 9), 3);
      const all = [];
      for (const x of ds) for (const y of ds) if (x !== y && x !== 0) all.push(x * 10 + y);
      all.sort((a, b) => a - b);
      const cards = r.shuffle(ds).join('、');
      if (r.bool()) return {
        q: `用 ${cards} 三张卡片（每次选两张）组成两位数，最大的是 {0}，最小的是 {1}`,
        answer: [num(all.at(-1)), num(all[0])],
        steps: [`最大：十位放最大的 ${Math.max(...ds)}，个位放第二大的`, `最大是 ${all.at(-1)}`, hasZero ? `最小：0 不能放十位，十位放最小的非 0 数字，个位放 0：${all[0]}` : `最小：十位放最小的，个位放第二小的：${all[0]}`],
      };
      return {
        q: `用 ${cards} 三张卡片（每次选两张）能组成几个不同的两位数？`,
        answer: [num(all.length, { unit: '个' })],
        steps: ['按十位上的数，有顺序地写：', ...[...new Set(all.map((v) => Math.floor(v / 10)))].map((tt) => `十位是 ${tt}：${all.filter((v) => Math.floor(v / 10) === tt).join('、')}`), hasZero ? '0 不能放在十位上' : '三个数字都能放十位', `一共 ${all.length} 个`],
      };
    },
  },
  {
    id: 'g1b-beads', grade: 1, term: 2, unit: '100以内数的认识', name: '摆一摆，想一想（圆片摆数）',
    tip: '有顺序地摆：先全放十位，再一个一个挪到个位', level: 3,
    gen(r) {
      const n = r.int(2, 9), list = range(0, n).map((k) => (n - k) * 10 + k), form = r.int(0, 2);
      let lines = list.map((v, k) => `十位 ${n - k} 个、个位 ${k} 个：${v}`);
      if (lines.length > 5) lines = [...lines.slice(0, 3), '……', lines.at(-1)];
      if (form === 0) return { q: `用 ${n} 个圆片在数位表的十位和个位上摆数（可以都摆在一边），能摆出几个不同的数？`, answer: [num(n + 1, { unit: '个' })], steps: ['有顺序地摆，先全摆十位，再一个一个挪到个位：', ...lines, `一共 ${n + 1} 个，比圆片多 1 个`] };
      if (form === 1) return { q: `用 ${n} 个圆片在数位表上摆数，摆出的数最大是 {0}，最小是 {1}`, answer: [num(n * 10), num(n)], steps: [`全摆在十位上最大：${n} 个十是 ${n * 10}`, `全摆在个位上最小：${n} 个一是 ${n}`] };
      const t = r.int(1, 6), o = r.int(0, 6);
      return { q: `用圆片在数位表上摆出了 ${t * 10 + o}，一共用了几个圆片？`, answer: [num(t + o, { unit: '个' })], steps: [`${t * 10 + o}：十位上是 ${t}，要摆 ${t} 个圆片`, `个位上是 ${o}，要摆 ${o} 个`, `${t} + ${o} = ${t + o}（个）`] };
    },
  },

  // ---------- 下册 · 认识人民币 ----------
  {
    id: 'g1b-rmb-convert', grade: 1, term: 2, unit: '认识人民币', name: '元、角、分的换算',
    tip: '1 元 = 10 角，1 角 = 10 分', level: 1,
    gen(r) {
      const a = r.int(1, 9), b = r.int(1, 9), form = r.int(0, 5);
      if (form === 0) {
        const k = r.int(0, 2);
        return [
          { q: `${a} 元 = {0} 角`, answer: [num(a * 10)], steps: ['1 元 = 10 角', `${a} 元就是 ${a} 个 10 角，是 ${a * 10} 角`] },
          { q: `1 元 = {0} 角，1 角 = {1} 分`, answer: [num(10), num(10)], steps: ['1 元 = 10 角', '1 角 = 10 分'] },
          { q: `${a * 10} 角 = {0} 元`, answer: [num(a)], steps: ['10 角 = 1 元', `${a * 10} 角里有 ${a} 个 10 角，是 ${a} 元`] },
        ][k];
      }
      if (form === 1) return { q: `${a} 元 ${b} 角 = {0} 角`, answer: [num(a * 10 + b)], steps: [`${a} 元 = ${a * 10} 角`, `${a * 10} 角 + ${b} 角 = ${a * 10 + b} 角`] };
      if (form === 2) return { q: `${a * 10 + b} 角 = {0} 元 {1} 角`, answer: [num(a), num(b)], steps: [`${a * 10 + b} 角里有 ${a} 个 10 角和 ${b} 角`, `${a} 个 10 角是 ${a} 元`, `所以是 ${a} 元 ${b} 角`] };
      if (form === 3) return r.bool()
        ? { q: `${a} 角 = {0} 分`, answer: [num(a * 10)], steps: ['1 角 = 10 分', `${a} 角是 ${a} 个 10 分，是 ${a * 10} 分`] }
        : { q: `${a * 10} 分 = {0} 角`, answer: [num(a)], steps: ['10 分 = 1 角', `${a * 10} 分是 ${a} 角`] };
      if (form === 4) return { q: `${a} 元 ${b} 角 = {0} 元 + {1} 角`, answer: [num(a), num(b)], steps: [`${a} 元 ${b} 角就是 ${a} 元和 ${b} 角合起来`] };
      return { q: `1 元 ${b} 角 = {0} 角`, answer: [num(10 + b)], steps: ['1 元 = 10 角', `10 角 + ${b} 角 = ${10 + b} 角`] };
    },
  },
  {
    id: 'g1b-rmb-compare', grade: 1, term: 2, unit: '认识人民币', name: '人民币比大小',
    tip: '单位不一样先换成一样的单位（都换成角）再比', level: 2,
    gen(r) {
      const fen = r.chance(0.25);
      if (fen) { // 角和分
        const x = r.int(1, 10), y = r.chance(0.25) ? x * 10 : Math.max(1, Math.min(100, x * 10 + r.int(-9, 9)));
        const L = x === 10 ? '1 元' : `${x} 角`, R = `${y} 分`, sg = sign(x * 10, y), sw = r.bool();
        return { q: sw ? `${R} {0} ${L}` : `${L} {0} ${R}`, answer: [pick(CMP, sw ? sign(y, x * 10) : sg)], steps: [`都换成分：${L} = ${x * 10} 分`, sw ? `${y} 分 ${sign(y, x * 10)} ${x * 10} 分` : `${x * 10} 分 ${sg} ${y} 分`] };
      }
      const show = (v) => {
        const fs = [];
        if (v % 10 === 0) fs.push(`${v / 10} 元`);
        if (v >= 10 && v % 10) fs.push(`${Math.floor(v / 10)} 元 ${v % 10} 角`);
        if (v < 100) fs.push(`${v} 角`);
        return fs;
      };
      const a = r.int(10, 60), b = r.chance(0.2) ? a : Math.max(1, a + r.int(-6, 6));
      const [fa, fb] = r.until(() => [r.pick(show(a)), r.pick(show(b))], ([u, v]) => u.slice(-1) !== v.slice(-1) || u.includes('元 '));
      const sg = sign(a, b);
      return { q: `${fa} {0} ${fb}`, answer: [pick(CMP, sg)], steps: [`都换成角：${fa} = ${a} 角，${fb} = ${b} 角`, `${a} 角 ${sg} ${b} 角`, `所以 ${fa} ${sg} ${fb}`] };
    },
  },
  {
    id: 'g1b-rmb-exchange', grade: 1, term: 2, unit: '认识人民币', name: '换钱',
    tip: '换钱前后钱数不变：大面值能换几张小面值，就数一数几个小面值合起来是大面值', level: 1,
    gen(r) {
      const form = r.int(0, 2);
      if (form === 0) {
        const [B, S, u] = r.pick([[10, 5, '元'], [10, 2, '元'], [10, 1, '元'], [20, 10, '元'], [20, 5, '元'], [20, 2, '元'], [50, 10, '元'], [50, 5, '元'], [100, 50, '元'], [100, 20, '元'], [100, 10, '元'], [10, 5, '角'], [10, 2, '角'], [10, 1, '角'], [5, 1, '元'], [5, 1, '角']]);
        const big = B === 10 && u === '角' ? '1 元' : `${B} ${u}`, k = B / S;
        return { q: `1 张 ${big}可以换 {0} 张 ${S} ${u}`, answer: [num(k)], steps: [...(big === '1 元' ? ['1 元 = 10 角'] : []), `${S} 个 ${S} 个地数：${range(1, k).map((i) => i * S).join('、')}，数了 ${k} 次`, `所以能换 ${k} 张 ${S} ${u}`] };
      }
      if (form === 1) {
        const [S, k] = r.pick([[2, r.int(2, 9)], [5, r.int(2, 9)], [10, r.int(2, 9)], [20, r.int(2, 5)], [50, 2]]);
        return { q: `${k} 张 ${S} 元合起来是 {0} 元`, answer: [num(S * k)], steps: [`${S} 个 ${S} 个地数 ${k} 次：${range(1, k).map((i) => i * S).join('、')}`, `一共 ${S * k} 元`] };
      }
      const [B, parts, rest] = r.pick([[10, [5], 1], [10, [2, 2], 1], [10, [5, 2], 1], [20, [10], 5], [20, [10, 5], 1], [10, [2, 2, 2], 1], [20, [5, 5], 2]]);
      const used = parts.reduce((x, y) => x + y, 0), k = (B - used) / rest;
      const desc = [...new Set(parts)].map((v) => `${parts.filter((x) => x === v).length} 张 ${v} 元`).join('、');
      return { q: `1 张 ${B} 元可以换成 ${desc}和 {0} 张 ${rest} 元`, answer: [num(k)], steps: [parts.length > 1 ? `${desc}合起来是 ${parts.join(' + ')} = ${used}（元）` : `${desc}是 ${used} 元`, `还差 ${B} - ${used} = ${B - used}（元）`, `${B - used} 元是 ${k} 张 ${rest} 元`] };
    },
  },
  {
    id: 'g1b-rmb-calc', grade: 1, term: 2, unit: '认识人民币', name: '人民币的简单计算',
    tip: '元和元相加减，角和角相加减；满 10 角换成 1 元，不够减就把 1 元换成 10 角', level: 2,
    gen(r) {
      const form = r.int(0, 5);
      if (form === 0) {
        const [a, b] = r.until(() => [r.int(2, 15), r.int(2, 9)], ([x, y]) => x + y <= 20), add = r.bool();
        return add
          ? { q: `${a} 元 + ${b} 元 = {0} 元`, answer: [num(a + b)], steps: ['元和元相加', `${a} + ${b} = ${a + b}，是 ${a + b} 元`] }
          : { q: `${a + b} 元 - ${b} 元 = {0} 元`, answer: [num(a)], steps: ['元和元相减', `${a + b} - ${b} = ${a}，是 ${a} 元`] };
      }
      if (form === 1) {
        const [a, b] = r.until(() => [r.int(2, 9), r.int(2, 9)], ([x, y]) => x + y > 10);
        return { q: `${a} 角 + ${b} 角 = {0} 元 {1} 角`, answer: [num(1), num(a + b - 10)], steps: [`${a} + ${b} = ${a + b}，是 ${a + b} 角`, `${a + b} 角里有 10 角，换成 1 元`, `${a + b} 角 = 1 元 ${a + b - 10} 角`] };
      }
      if (form === 2) {
        const b = r.int(1, 9);
        return { q: `1 元 - ${b} 角 = {0} 角`, answer: [num(10 - b)], steps: ['1 元 = 10 角', `10 角 - ${b} 角 = ${10 - b} 角`] };
      }
      if (form === 3) {
        const a = r.int(1, 9), b = r.int(1, 9), c = r.int(1, 9);
        return { q: `${a} 元 ${b} 角 + ${c} 元 = {0} 元 {1} 角`, answer: [num(a + c), num(b)], steps: ['元加元，角不变', `${a} 元 + ${c} 元 = ${a + c} 元`, `结果是 ${a + c} 元 ${b} 角`] };
      }
      if (form === 4) {
        const a = r.int(1, 9), b = r.int(1, 8), c = r.int(1, 9), s = b + c, carry = s >= 10;
        return { q: `${a} 元 ${b} 角 + ${c} 角 = {0} 元 {1} 角`, answer: [num(a + (carry ? 1 : 0)), num(s % 10)], steps: [`角加角：${b} 角 + ${c} 角 = ${s} 角`, carry ? `${s} 角 = 1 元 ${s - 10} 角，满 10 角换成 1 元` : '没满 10 角，不用换', `${a} 元${carry ? ` + 1 元 = ${a + 1} 元` : ''}，结果是 ${a + (carry ? 1 : 0)} 元 ${s % 10} 角`] };
      }
      const a = r.int(2, 9), b = r.int(1, 9);
      return { q: `${a} 元 - ${b} 角 = {0} 元 {1} 角`, answer: [num(a - 1), num(10 - b)], steps: [`没有角可以减，把 1 元换成 10 角：${a} 元 = ${a - 1} 元 10 角`, `10 角 - ${b} 角 = ${10 - b} 角`, `结果是 ${a - 1} 元 ${10 - b} 角`] };
    },
  },
  {
    id: 'g1b-rmb-shopping', grade: 1, term: 2, unit: '认识人民币', name: '买东西和找零',
    tip: '买几样东西一共多少钱用加法；付的钱 - 要花的钱 = 找回的钱', level: 2, process: true,
    gen(r) {
      const [p] = r.names(1);
      const G = r.sample([['铅笔', '支'], ['本子', '本'], ['尺子', '把'], ['橡皮', '块'], ['卷笔刀', '个'], ['水彩笔', '盒'], ['皮球', '个'], ['跳绳', '根'], ['故事书', '本'], ['小汽车', '辆']], 2);
      const [a, b] = [r.int(2, 9), r.int(2, 9)], [[ga, ua], [gb, ub]] = G, form = r.int(0, 4);
      const tag = `${ga} ${a} 元一${ua}，${gb} ${b} 元一${ub}。`;
      if (form === 0) return { q: `${tag}买一${ua}${ga}和一${ub}${gb}，一共要几元？`, answer: [num(a + b, { unit: '元' })], steps: ['求一共要多少钱，把两样的钱合起来，用加法', `${a} + ${b} = ${a + b}（元）`, `答：一共要 ${a + b} 元。`] };
      if (form === 1) {
        const pay = a + b <= 10 ? 10 : 20;
        return { q: `${tag}${p}买一${ua}${ga}和一${ub}${gb}，付了 ${pay} 元，应找回几元？`, answer: [num(pay - a - b, { unit: '元' })], steps: [`先算一共要花：${a} + ${b} = ${a + b}（元）`, `再算找回：${pay} - ${a + b} = ${pay - a - b}（元）`, `答：应找回 ${pay - a - b} 元。`] };
      }
      if (form === 2) {
        const pay = r.pick([5, 10, 10, 20]), price = r.int(1, pay - 1);
        return { q: `${ga}每${ua} ${price} 元。${p}付了 ${pay} 元买一${ua}，应找回几元？`, answer: [num(pay - price, { unit: '元' })], steps: ['付的钱 - 要花的钱 = 找回的钱', `${pay} - ${price} = ${pay - price}（元）`, `答：应找回 ${pay - price} 元。`] };
      }
      if (form === 3) {
        const have = r.int(Math.max(a + b - 4, 5), a + b + 4), ok = have >= a + b;
        return { q: `${tag}${p}带了 ${have} 元，买一${ua}${ga}和一${ub}${gb}，钱够吗？`, answer: [pick(['够', '不够'], ok ? '够' : '不够')], steps: [`两样一共要：${a} + ${b} = ${a + b}（元）`, `${have} ${sign(have, a + b)} ${a + b}`, ok ? `带的钱${have === a + b ? '正好' : '比要花的多'}，够` : '带的钱比要花的少，不够'] };
      }
      const y = r.int(1, 9), j = r.int(1, 9), z = r.int(3, 9), s = j + z;
      return { q: `一${ua}${ga} ${y} 元 ${j} 角，一${ub}${gb} ${z} 角。买这两样一共要几元几角？\n{0} 元 {1} 角`, answer: [num(y + (s >= 10 ? 1 : 0)), num(s % 10)], steps: [`角加角：${j} + ${z} = ${s}（角）${s >= 10 ? `，满 10 角是 1 元，${s} 角 = 1 元 ${s - 10} 角` : ''}`, s >= 10 ? `元：${y} + 1 = ${y + 1}（元）` : `元不变，还是 ${y} 元`, `答：一共要 ${y + (s >= 10 ? 1 : 0)} 元 ${s % 10} 角。`] };
    },
  },
  {
    id: 'g1b-rmb-ways', grade: 1, term: 2, unit: '认识人民币', name: '付钱有几种方法',
    tip: '有顺序地想：先用面值大的，大的用得越来越少，不重复不遗漏', level: 3,
    gen(r) {
      const u = r.pick(['元', '角']);
      const limited = r.bool();
      const [N, ways, lim] = r.until(() => {
        const N = r.int(4, 8), ways = [], lim = limited ? { 5: r.int(0, 1), 2: r.int(1, 3), 1: r.int(2, 5) } : null;
        for (let f = Math.floor(N / 5); f >= 0; f--) for (let t = Math.floor((N - 5 * f) / 2); t >= 0; t--) {
          const o = N - 5 * f - 2 * t;
          if (lim && (f > lim[5] || t > lim[2] || o > lim[1])) continue;
          ways.push([f, t, o]);
        }
        return [N, ways, lim];
      }, ([, w]) => w.length >= 2 && w.length <= 7);
      const say = ([f, t, o]) => [...Array(f).fill(5), ...Array(t).fill(2), ...Array(o).fill(1)].map((v) => `${v} ${u}`).join(' + ');
      const have = lim ? `${lim[5] ? `${lim[5]} 张 5 ${u}、` : ''}${lim[2]} 张 2 ${u}、${lim[1]} 张 1 ${u}` : `足够多的 5 ${u}、2 ${u}、1 ${u}`;
      return {
        q: `有${have}，要正好付 ${N} ${u}，有几种付法？`,
        answer: [num(ways.length, { unit: '种' })],
        steps: ['先多用面值大的，再一个一个换成小的：', ...[...new Set(ways.map((w) => w[0]))].map((f) => `${f ? `用 ${f} 张 5 ${u}` : `不用 5 ${u}`}：${ways.filter((w) => w[0] === f).map(say).join('；')}`), `一共 ${ways.length} 种`],
        hint: '先想能用几张 5，再想能用几张 2，剩下的用 1',
      };
    },
  },

  // ---------- 下册 · 100以内的加法和减法（一） ----------
  {
    id: 'g1b-tens-add-sub', grade: 1, term: 2, unit: '100以内的加法和减法（一）', name: '整十数加、减整十数',
    tip: '几个十加减几个十：想 3 + 4 = 7，30 + 40 = 70', level: 1, speed: 4,
    gen: oralSkill((r) => ORAL.tens(r)),
  },
  {
    id: 'g1b-tens-plus-ones', grade: 1, term: 2, unit: '100以内的加法和减法（一）', name: '整十数加一位数及相应的减法',
    tip: '30 + 5 就是 3 个十和 5 个一，是 35', level: 1, speed: 4,
    gen: oralSkill((r) => ORAL.tensOnes(r)),
  },
  {
    id: 'g1b-add-2d1d', grade: 1, term: 2, unit: '100以内的加法和减法（一）', name: '两位数加一位数（不进位）',
    tip: '个位和个位相加，再加上整十数', level: 1, speed: 5,
    gen: oralSkill((r) => ORAL.add21(r, false)),
  },
  {
    id: 'g1b-add-2d1d-carry', grade: 1, term: 2, unit: '100以内的加法和减法（一）', name: '两位数加一位数（进位）',
    tip: '个位相加满十，向十位进 1：38 + 5，8 + 5 = 13，30 + 13 = 43', level: 1, speed: 6,
    gen: oralSkill((r) => ORAL.add21(r, true)),
  },
  {
    id: 'g1b-add-2d-tens', grade: 1, term: 2, unit: '100以内的加法和减法（一）', name: '两位数加整十数',
    tip: '整十数加在十位上，个位不变', level: 1, speed: 5,
    gen: oralSkill((r) => ORAL.add2t(r)),
  },
  {
    id: 'g1b-sub-2d1d', grade: 1, term: 2, unit: '100以内的加法和减法（一）', name: '两位数减一位数（不退位）',
    tip: '个位减个位，再加上整十数', level: 1, speed: 5,
    gen: oralSkill((r) => ORAL.sub21(r, false)),
  },
  {
    id: 'g1b-sub-2d1d-borrow', grade: 1, term: 2, unit: '100以内的加法和减法（一）', name: '两位数减一位数（退位）',
    tip: '个位不够减，从十位拿 1 个十：32 - 5，12 - 5 = 7，20 + 7 = 27', level: 1, speed: 6,
    gen: oralSkill((r) => ORAL.sub21(r, true)),
  },
  {
    id: 'g1b-sub-2d-tens', grade: 1, term: 2, unit: '100以内的加法和减法（一）', name: '两位数减整十数',
    tip: '整十数从十位上减，个位不变', level: 1, speed: 5,
    gen: oralSkill((r) => ORAL.sub2t(r)),
  },
  {
    id: 'g1b-oral-100-mixed', grade: 1, term: 2, unit: '100以内的加法和减法（一）', name: '100 以内口算（综合）',
    tip: '先看清是加还是减、加减的是一位数还是整十数，再看个位够不够', level: 2, speed: 6,
    gen: oralSkill((r) => r.pick([() => ORAL.tens(r), () => ORAL.tensOnes(r), () => ORAL.add21(r, false), () => ORAL.add21(r, true), () => ORAL.add2t(r), () => ORAL.sub21(r, false), () => ORAL.sub21(r, true), () => ORAL.sub2t(r)])()),
  },
  {
    id: 'g1b-compare-100', grade: 1, term: 2, unit: '100以内的加法和减法（一）', name: '算式比大小（100 以内）',
    tip: '先算出得数再比大小', level: 2, speed: 10,
    gen(r) {
      const mk = () => r.pick([() => ORAL.tens(r), () => ORAL.add21(r, r.bool()), () => ORAL.add2t(r), () => ORAL.sub21(r, r.bool()), () => ORAL.sub2t(r)])();
      const A = mk();
      let Bt, bv;
      if (r.chance(0.35)) { const B = mk(); Bt = B.e; bv = B.v; } else { bv = r.chance(0.25) ? A.v : Math.max(1, Math.min(100, A.v + r.pick([-10, -2, -1, 1, 2, 10]))); Bt = String(bv); }
      const [L, lv, R, rv] = r.bool() ? [A.e, A.v, Bt, bv] : [Bt, bv, A.e, A.v], sg = sign(lv, rv);
      const steps = [];
      if (L !== String(lv)) steps.push(`左边：${L} = ${lv}`);
      if (R !== String(rv)) steps.push(`右边：${R} = ${rv}`);
      steps.push(`${lv} ${sg} ${rv}，所以 ${L} ${sg} ${R}`);
      return { q: `${L} {0} ${R}`, answer: [pick(CMP, sg)], steps };
    },
  },
  {
    id: 'g1b-box-100', grade: 1, term: 2, unit: '100以内的加法和减法（一）', name: '□ 里填几（100 以内）',
    tip: '想一想：十位上差几个十，个位上差几个一', level: 2, speed: 10,
    gen(r) {
      const form = r.int(0, 4), t = r.int(2, 8), o = r.int(1, 9), n = t * 10 + o;
      if (form === 0) { const o2 = r.int(1, 8), b = r.int(1, 9 - o2), a = t * 10 + o2; return { q: `${a} + {0} = ${a + b}`, answer: [num(b)], steps: [`十位没变，看个位：${o2} 加几是 ${o2 + b}？`, `${o2} + ${b} = ${o2 + b}，填 ${b}`] }; }
      if (form === 1) { const k = r.int(1, 9 - t); return { q: `${n} + {0} = ${n + k * 10}`, answer: [num(k * 10)], steps: [`个位没变，十位从 ${t} 变成 ${t + k}，多了 ${k} 个十`, `填 ${k * 10}`] }; }
      if (form === 2) return { q: `${n} + {0} = ${(t + 1) * 10}`, answer: [num(10 - o)], steps: [`${n} 凑成 ${(t + 1) * 10}，个位 ${o} 还要 ${10 - o} 才满十`, `${n} + ${10 - o} = ${(t + 1) * 10}`] };
      if (form === 3) { const k = r.int(1, t - 1); return { q: `${n} - {0} = ${n - k * 10}`, answer: [num(k * 10)], steps: [`个位没变，十位从 ${t} 变成 ${t - k}，少了 ${k} 个十`, `填 ${k * 10}`] }; }
      return { q: `${(t + 1) * 10} - {0} = ${n}`, answer: [num(10 - o)], steps: [`想：${n} 加几是 ${(t + 1) * 10}？`, `${n} + ${10 - o} = ${(t + 1) * 10}`, `所以填 ${10 - o}`] };
    },
  },
  {
    id: 'g1b-paren', grade: 1, term: 2, unit: '100以内的加法和减法（一）', name: '带小括号的加减法',
    tip: '有小括号，先算小括号里面的', level: 2, speed: 15,
    gen(r) {
      const form = r.int(0, 2);
      const [a, inner, x, op] = r.until(() => {
        if (form === 0) { const b = r.int(1, 7), c = r.int(1, 9 - b), a = r.int(2, 9) * 10 + r.int(0, 9); return [a, `${b} + ${c}`, b + c, '-']; }
        if (form === 1) { const b = r.int(3, 9) * 10, c = r.int(1, b / 10 - 1) * 10, a = r.int(20, 99); return [a, `${b} - ${c}`, b - c, '-']; }
        const b = r.int(2, 9) * 10 + r.int(1, 9), c = r.int(1, b % 10), a = r.int(1, 7) * 10; return [a, `${b} - ${c}`, b - c, '+'];
      }, ([a, , x, op]) => (op === '-' ? a - x >= 0 : a + x <= 99));
      const v = op === '-' ? a - x : a + x, e = `${a} ${op} (${inner})`, outer = `${a} ${op} ${x}`;
      return { q: `${e} = {0}`, answer: [num(v)], steps: [`有小括号，先算小括号里面的：${inner} = ${x}`, `再算 ${outer} = ${v}`] };
    },
  },
  {
    id: 'g1b-chain-100', grade: 1, term: 2, unit: '100以内的加法和减法（一）', name: '两步加减（100 以内）',
    tip: '从左往右算，每一步想清楚是加减一位数还是整十数', level: 2, speed: 15,
    gen(r) {
      const step = (v) => r.pick([
        () => { const k = r.int(1, 5) * 10; return v + k <= 100 ? ['+', k] : null; },
        () => { const k = r.int(1, 5) * 10; return v - k >= 0 ? ['-', k] : null; },
        () => { const k = r.int(1, 9); return v + k <= 100 ? ['+', k] : null; },
        () => { const k = r.int(1, 9); return v - k >= 0 ? ['-', k] : null; },
      ])();
      const [a, s1, s2] = r.until(() => { const a = r.int(12, 89), s1 = step(a); if (!s1) return [a, null, null]; const m = s1[0] === '+' ? a + s1[1] : a - s1[1]; return [a, s1, step(m)]; }, ([, x, y]) => x && y);
      const m = s1[0] === '+' ? a + s1[1] : a - s1[1], v = s2[0] === '+' ? m + s2[1] : m - s2[1];
      return { q: `${a} ${s1[0]} ${s1[1]} ${s2[0]} ${s2[1]} = {0}`, answer: [num(v)], steps: ['从左往右算', `先算 ${a} ${s1[0]} ${s1[1]} = ${m}`, `再算 ${m} ${s2[0]} ${s2[1]} = ${v}`] };
    },
  },
  {
    id: 'g1b-word-100', grade: 1, term: 2, unit: '100以内的加法和减法（一）', name: '解决问题（100 以内加减）',
    tip: '求一共、求原来用加法；求还剩、求一部分用减法', level: 1, process: true,
    gen(r) {
      const [p, q] = r.names(2), form = r.int(0, 3);
      const two = () => r.pick([() => ORAL.add21(r, r.bool()), () => ORAL.add2t(r)])(); // 得到 a + b
      if (form === 0) {
        const [a, b] = r.until(() => [r.int(12, 60), r.pick([r.int(2, 9), r.int(1, 4) * 10])], ([x, y]) => x + y <= 100 && x % 10 !== 0);
        const [t, u] = r.pick([[`一年级一班有 ${a} 人，二班有 ${b} 人。两个班一共有几人？`, '人'], [`${p}家养了 ${a} 只鸡，${b} 只鸭。一共养了几只？`, '只'], [`图书角有 ${a} 本故事书，又买来 ${b} 本。现在有几本？`, '本'], [`果园里有 ${a} 棵桃树，${b} 棵梨树。一共有几棵？`, '棵']]);
        return { q: t, answer: [num(a + b, { unit: u })], steps: ['求一共有多少，把两部分合起来，用加法', `${a} + ${b} = ${a + b}（${u}）`, `答：一共 ${a + b} ${u}。`] };
      }
      if (form === 1) {
        const [a, b] = r.until(() => [r.int(25, 99), r.pick([r.int(2, 9), r.int(1, 5) * 10])], ([x, y]) => x - y > 0);
        const [t, u] = r.pick([[`${p}有 ${a} 张邮票，送给同学 ${b} 张。还剩几张？`, '张'], [`一本书有 ${a} 页，${p}已经看了 ${b} 页。还剩几页没看？`, '页'], [`超市有 ${a} 个西瓜，上午卖出 ${b} 个。还剩几个？`, '个'], [`操场上有 ${a} 人，走了 ${b} 人。还有几人？`, '人']]);
        return { q: t, answer: [num(a - b, { unit: u })], steps: ['从总数里去掉一部分，求还剩多少，用减法', `${a} - ${b} = ${a - b}（${u}）`, `答：还剩 ${a - b} ${u}。`] };
      }
      if (form === 2) {
        const [b, c] = r.until(() => [r.pick([r.int(2, 9), r.int(1, 4) * 10]), r.int(12, 60)], ([x, y]) => x + y <= 100 && y % 10 !== 0);
        const [t, u] = r.pick([[`${p}用掉 ${b} 元，还剩 ${c} 元。${p}原来有几元？`, '元'], [`停车场开走 ${b} 辆车，还剩 ${c} 辆。原来有几辆？`, '辆'], [`一筐苹果，卖了 ${b} 个，还剩 ${c} 个。原来有几个？`, '个']]);
        return { q: t, answer: [num(b + c, { unit: u })], steps: ['用掉（开走、卖了）的和剩下的合起来，就是原来的', '求原来有多少，用加法', `${b} + ${c} = ${b + c}（${u}）`, `答：原来有 ${b + c} ${u}。`] };
      }
      const [a, b] = r.until(() => [r.int(30, 99), r.pick([r.int(2, 9), r.int(1, 5) * 10])], ([x, y]) => x - y > 0);
      const [t, u, pa, pb] = r.pick([[`一年级一共有 ${a} 名同学去春游，其中女生 ${b} 名。男生有几名？`, '名', '女生', '男生'], [`${p}和${q}一共收集了 ${a} 片树叶，${p}收集了 ${b} 片。${q}收集了几片？`, '片', p, q], [`盒子里有 ${a} 颗糖，其中水果糖 ${b} 颗，其余是奶糖。奶糖有几颗？`, '颗', '水果糖', '奶糖']]);
      return { q: t, answer: [num(a - b, { unit: u })], steps: [`一共 ${a} ${u}，分成${pa}和${pb}两部分`, `求${pb}，用一共减${pa}`, `${a} - ${b} = ${a - b}（${u}）`, `答：${pb}有 ${a - b} ${u}。`] };
    },
  },
  {
    id: 'g1b-word-more-than', grade: 1, term: 2, unit: '100以内的加法和减法（一）', name: '求比一个数多几（少几）的数',
    tip: '求比一个数多几的数用加法，求比一个数少几的数用减法', level: 1, process: true,
    gen(r) {
      const [p, q] = r.names(2), more = r.bool(), a = r.int(20, 80), d = r.pick([r.int(2, 9), r.int(1, 2) * 10]), v = more ? a + d : a - d;
      const w = more ? '多' : '少';
      const [t, u, who, verb] = r.pick([
        [`${p}有 ${a} 张邮票，${q}比${p}${w} ${d} 张。${q}有几张？`, '张', q, '有'],
        [`${p}跳绳跳了 ${a} 下，${q}比${p}${w}跳 ${d} 下。${q}跳了几下？`, '下', q, '跳了'],
        [`一班种了 ${a} 棵树，二班比一班${w}种 ${d} 棵。二班种了几棵？`, '棵', '二班', '种了'],
        [`${p}折了 ${a} 颗星星，${q}比${p}${w}折 ${d} 颗。${q}折了几颗？`, '颗', q, '折了'],
        [`小兔采了 ${a} 个蘑菇，小松鼠比小兔${w}采 ${d} 个。小松鼠采了几个？`, '个', '小松鼠', '采了'],
      ]);
      return {
        q: t, answer: [num(v, { unit: u })],
        steps: [more ? `${who}比 ${a} 多 ${d}：和 ${a} 同样多，还要再多 ${d}` : `${who}比 ${a} 少 ${d}：从 ${a} 里去掉 ${d}`, `求比 ${a} ${w} ${d} 的数，用${more ? '加' : '减'}法`, `${a} ${more ? '+' : '-'} ${d} = ${v}（${u}）`, `答：${who}${verb} ${v} ${u}。`],
      };
    },
  },
  {
    id: 'g1b-word-more-than-rev', grade: 1, term: 2, unit: '100以内的加法和减法（一）', name: '换个说法：谁比谁多（少）',
    tip: '「甲比乙多 5」也就是「乙比甲少 5」；先想清楚要求的是多的还是少的', level: 2, process: true,
    gen(r) {
      const [p, q] = r.names(2), more = r.bool(), a = r.int(20, 80), d = r.pick([r.int(2, 9), r.int(1, 2) * 10]);
      const v = more ? a - d : a + d; // 「已知的比要求的多 d」，要求的就少 d
      const w = more ? '多' : '少', anti = more ? '少' : '多';
      const [t, u, known, who, verb, vw] = r.pick([
        [`${p}有 ${a} 张画片，${p}比${q}${w} ${d} 张。${q}有几张？`, '张', p, q, '有', ''],
        [`${p}拍球拍了 ${a} 下，${p}比${q}${w}拍 ${d} 下。${q}拍了几下？`, '下', p, q, '拍了', '拍'],
        [`红花有 ${a} 朵，红花比黄花${w} ${d} 朵。黄花有几朵？`, '朵', '红花', '黄花', '有', ''],
        [`一班有 ${a} 本书，一班比二班${w} ${d} 本。二班有几本？`, '本', '一班', '二班', '有', ''],
      ]);
      return {
        q: t, answer: [num(v, { unit: u })],
        steps: [`「${known}比${who}${w}${vw} ${d} ${u}」，换个说法就是「${who}比${known}${anti}${vw} ${d} ${u}」`, `所以求比 ${a} ${anti} ${d} 的数，用${more ? '减' : '加'}法`, `${a} ${more ? '-' : '+'} ${d} = ${v}（${u}）`, `答：${who}${verb} ${v} ${u}。`],
        hint: '先想：要求的那个是多的还是少的？',
      };
    },
  },
  {
    id: 'g1b-word-diff-100', grade: 1, term: 2, unit: '100以内的加法和减法（一）', name: '求两个数相差多少（100 以内）',
    tip: '求谁比谁多几、少几，都用大数减小数', level: 1, process: true,
    gen(r) {
      const [p, q] = r.names(2), x = r.int(31, 99), near = r.chance(0.4);
      const y = near ? x - r.int(2, 9) : r.int(1, Math.floor((x - 1) / 10)) * 10, d = x - y;
      const [t, u, said] = r.pick([
        [`${p}有 ${x} 个玻璃球，${q}有 ${y} 个。${p}比${q}多几个？`, '个', '多'],
        [`一班有 ${x} 本书，二班有 ${y} 本。二班比一班少几本？`, '本', '少'],
        [`${p}跳了 ${x} 下，${q}跳了 ${y} 下。${q}比${p}少跳几下？`, '下', '少跳'],
        [`苹果树有 ${x} 棵，梨树有 ${y} 棵。苹果树比梨树多几棵？`, '棵', '多'],
        [`${p}要写 ${x} 个字，已经写了 ${y} 个。还要写几个？`, '个', '还要写'],
      ]);
      return {
        q: t, answer: [num(d, { unit: u })],
        steps: [said === '还要写' ? '要写的里面去掉已经写的，就是还要写的' : `${x} 比 ${y} 大，求相差多少，用大数减小数`, `${x} - ${y} = ${d}（${u}）`, ...(near ? [`算的时候想：${y} 加几等于 ${x}？${y} + ${d} = ${x}`] : []), `答：${said} ${d} ${u}。`],
      };
    },
  },
  {
    id: 'g1b-word-same', grade: 1, term: 2, unit: '100以内的加法和减法（一）', name: '同样多（再添几个、拿走几个）',
    tip: '要同样多，少的要添上相差的数，或者多的拿走相差的数', level: 2, process: true,
    gen(r) {
      const [p, q] = r.names(2), a = r.int(12, 60), d = r.int(2, 9), b = a - d, add = r.bool();
      const [thing, u] = r.pick([['贴画', '张'], ['气球', '个'], ['小红旗', '面'], ['铅笔', '支'], ['苹果', '个']]);
      return {
        q: add ? `${p}有 ${a} ${u}${thing}，${q}有 ${b} ${u}。${q}再添上几${u}，就和${p}同样多？` : `${p}有 ${a} ${u}${thing}，${q}有 ${b} ${u}。${p}拿走几${u}，就和${q}同样多？`,
        answer: [num(d, { unit: u })],
        steps: [`${p}比${q}多：${a} - ${b} = ${d}（${u}）（想：${b} 加几等于 ${a}？）`, add ? `${q}添上这 ${d} ${u}，就和${p}同样多` : `${p}把多出来的 ${d} ${u}拿走，就和${q}同样多`, `答：${add ? '添上' : '拿走'} ${d} ${u}。`],
      };
    },
  },
  {
    id: 'g1b-word-give', grade: 1, term: 2, unit: '100以内的加法和减法（一）', name: '移多补少（给几个后同样多）',
    tip: '多出来的部分分成同样多的两份，给对方一份', level: 3, process: true,
    gen(r) {
      const [p, q] = r.names(2), k = r.int(1, 6), b = r.int(3, 12), a = b + 2 * k;
      const dots = (n) => '●'.repeat(n);
      if (r.chance(0.35)) return {
        q: `${p}给${q} ${k} 颗糖后，两人的糖同样多。原来${p}比${q}多几颗？`,
        answer: [num(2 * k, { unit: '颗' })],
        steps: [`${p}给出 ${k} 颗，自己少了 ${k} 颗`, `${q}得到 ${k} 颗，多了 ${k} 颗`, `这时一样多，说明原来相差 ${k} + ${k} = ${2 * k}（颗）`, `答：原来多 ${2 * k} 颗。`],
        hint: '给出去的人少了，得到的人多了，一来一回差了几？',
      };
      return {
        q: `${p}有 ${a} 颗糖，${q}有 ${b} 颗。${p}给${q}几颗后，两人的糖同样多？`,
        answer: [num(k, { unit: '颗' })],
        steps: [`画一画：\n${p}：${dots(a)}\n${q}：${dots(b)}`, `${p}比${q}多 ${a} - ${b} = ${2 * k}（颗）`, `多出来的 ${2 * k} 颗分成同样多的两份：${k} 和 ${k}`, `给${q} ${k} 颗，两人都是 ${a - k} 颗`, `答：给 ${k} 颗。`],
      };
    },
  },
  {
    id: 'g1b-word-queue', grade: 1, term: 2, unit: '100以内的加法和减法（一）', name: '排队问题（一共几人）',
    tip: '画圆圈：前面的、自己、后面的合起来；从前数第几，前面就有几减 1 人', level: 2, process: true,
    gen(r) {
      const [p] = r.names(1), form = r.int(0, 3);
      if (form === 0) {
        const a = r.int(5, 30), b = r.int(5, 30);
        return { q: `同学们排队做操，${p}前面有 ${a} 人，后面有 ${b} 人。这一队一共有几人？`, answer: [num(a + b + 1, { unit: '人' })], steps: [`前面 ${a} 人 + ${p}自己 1 人 + 后面 ${b} 人`, `${a} + ${b} + 1 = ${a + b + 1}（人）`, `别忘了把${p}自己算上`, `答：一共有 ${a + b + 1} 人。`] };
      }
      if (form === 1) {
        const a = r.int(5, 30), b = r.int(5, 30);
        return { q: `小朋友排队买票，从前往后数，${p}排第 ${a}，${p}后面还有 ${b} 人。这一队一共有几人？`, answer: [num(a + b, { unit: '人' })], steps: [`${p}排第 ${a}：从第 1 个到${p}一共 ${a} 人（包括${p}）`, `再加上后面的 ${b} 人`, `${a} + ${b} = ${a + b}（人）`, `答：一共有 ${a + b} 人。`] };
      }
      if (form === 2) {
        const n = r.int(12, 40), a = r.int(3, n - 3);
        return { q: `${n} 个小朋友排成一队，从前往后数，${p}排第 ${a}。从后往前数，${p}排第几？`, answer: [num(n - a + 1, { label: '第' })], steps: [`${p}后面有：${n} - ${a} = ${n - a}（人）`, `从后往前数，先数这 ${n - a} 人，再数到${p}`, `${n - a} + 1 = ${n - a + 1}，排第 ${n - a + 1}`] };
      }
      const n = r.int(12, 40), a = r.int(3, n - 3);
      return { q: `${n} 个小朋友排成一队，${p}前面有 ${a} 人。${p}后面有几人？`, answer: [num(n - a - 1, { unit: '人' })], steps: [`一共 ${n} 人，去掉前面的 ${a} 人，再去掉${p}自己 1 人`, `${n} - ${a} - 1 = ${n - a - 1}（人）`, `答：后面有 ${n - a - 1} 人。`] };
    },
  },
  {
    id: 'g1b-queue-hard', grade: 1, term: 2, unit: '100以内的加法和减法（一）', name: '排队问题（拓展）',
    tip: '画一画，用 ● 表示题目里说到的人，看清楚算不算他自己', level: 3, process: true,
    gen(r) {
      const [p, q] = r.names(2), form = r.int(0, 3);
      const row = (n, marks) => range(1, n).map((i) => (marks.includes(i) ? '●' : '○')).join('');
      if (form === 0) {
        const a = r.int(2, 8), b = r.int(2, 8), n = a + b + r.int(1, 6);
        return { q: `${n} 个小朋友排成一队，${p}从前往后数排第 ${a}，${q}从后往前数排第 ${b}。${p}和${q}中间有几人？`, answer: [num(n - a - b, { unit: '人' })], steps: [`画一画：${row(n, [a, n - b + 1])}`, `从前面到${p}有 ${a} 人，从后面到${q}有 ${b} 人`, `中间的：${n} - ${a} - ${b} = ${n - a - b}（人）`, `答：中间有 ${n - a - b} 人。`] };
      }
      if (form === 1) {
        const a = r.int(2, 8), k = r.int(1, 5), b = a + k;
        return { q: `同学们排成一队，${p}前面有 ${a} 人，${p}后面的人比前面多 ${k} 人。这一队一共有几人？`, answer: [num(a + b + 1, { unit: '人' })], steps: [`后面有：${a} + ${k} = ${b}（人）`, `一共：前面 ${a} 人 + ${p} 1 人 + 后面 ${b} 人`, `${a} + 1 + ${b} = ${a + b + 1}（人）`, `答：一共有 ${a + b + 1} 人。`] };
      }
      if (form === 2) {
        const a = r.int(3, 9), m = r.int(2, 6);
        return { q: `小朋友排成一队，${p}排第 ${a}，${q}排在${p}后面，他们中间隔着 ${m} 人。${q}排第几？`, answer: [num(a + m + 1, { label: '第' })], steps: [`画一画：${row(a + m + 1, [a, a + m + 1])}`, `${p}排第 ${a}，往后隔 ${m} 人，再下一个才是${q}`, `${a} + ${m} + 1 = ${a + m + 1}，${q}排第 ${a + m + 1}`] };
      }
      const a = r.int(2, 6), b = r.int(2, 6), c = r.int(2, 6), d = r.int(2, 6), askRow = r.bool();
      return {
        q: `同学们站成方阵做操，${p}站的这一行，左边有 ${a} 人，右边有 ${b} 人；${p}站的这一列，前面有 ${c} 人，后面有 ${d} 人。${p}这一${askRow ? '行' : '列'}有几人？`,
        answer: [num(askRow ? a + b + 1 : c + d + 1, { unit: '人' })],
        steps: [`问的是「这一${askRow ? '行' : '列'}」，只看${askRow ? '左边和右边' : '前面和后面'}`, askRow ? `${a} + ${b} + 1 = ${a + b + 1}（人）` : `${c} + ${d} + 1 = ${c + d + 1}（人）`, `${askRow ? '前后' : '左右'}的人数不用管；别忘了加上${p}自己`],
      };
    },
  },
  {
    id: 'g1b-overlap', grade: 1, term: 2, unit: '100以内的加法和减法（一）', name: '简单的重叠问题',
    tip: '两边都算到的人（东西）被数了两次，合起来时要减去一次', level: 3, process: true,
    gen(r) {
      const [p, q] = r.names(2), form = r.int(0, 2);
      if (form === 2) {
        const a = r.int(3, 12), b = r.int(3, 12);
        return { q: `一排树，${p}从左往右数，${q}从右往左数，两人都数到了同一棵树，${p}数到这棵是第 ${a} 棵，${q}数到这棵是第 ${b} 棵。这排树一共有几棵？`, answer: [num(a + b - 1, { unit: '棵' })], steps: [`画一画：${range(1, a + b - 1).map((i) => (i === a ? '●' : '○')).join('')}`, `两人数的合起来是 ${a} + ${b} = ${a + b}，中间那棵被数了两次`, `${a} + ${b} - 1 = ${a + b - 1}（棵）`, `答：一共有 ${a + b - 1} 棵。`] };
      }
      const [A, B, u] = r.pick([['唱歌', '跳舞', '人'], ['跳绳', '踢毽子', '人'], ['画画', '下棋', '人'], ['喜欢苹果', '喜欢梨', '人']]);
      const c = r.int(1, 4), a = r.int(c + 2, 12), b = r.int(c + 2, 12);
      if (form === 0) return {
        q: `一年级一班参加${A}的有 ${a} 人，参加${B}的有 ${b} 人，其中有 ${c} 人两项都参加。参加这两项的一共有几人？`,
        fig: vennFig(`${A} ${a} 人`, `${B} ${b} 人`, `${c} 人`),
        answer: [num(a + b - c, { unit: u })],
        steps: [`两项都参加的 ${c} 人，在${A}里数了一次，在${B}里又数了一次`, `${a} + ${b} = ${a + b}，多数了 ${c} 人`, `${a + b} - ${c} = ${a + b - c}（人）`, `答：一共有 ${a + b - c} 人。`],
      };
      return {
        q: `一年级一班参加${A}的有 ${a} 人，参加${B}的有 ${b} 人，其中有 ${c} 人两项都参加。只参加${A}的有几人？`,
        fig: vennFig(`${A} ${a} 人`, `${B} ${b} 人`, `${c} 人`),
        answer: [num(a - c, { unit: u })],
        steps: [`参加${A}的 ${a} 人里，有 ${c} 人还参加了${B}`, `只参加${A}的：${a} - ${c} = ${a - c}（人）`, `答：只参加${A}的有 ${a - c} 人。`],
      };
    },
  },
  {
    id: 'g1b-make-number', grade: 1, term: 2, unit: '100以内的加法和减法（一）', name: '凑数（套圈得分）',
    tip: '先试大的分数，剩下的再用小的去凑；每试一次都算一算对不对', level: 3,
    gen(r) {
      const vals = r.pick([[1, 2, 5], [2, 5, 10], [3, 5, 7], [1, 4, 6], [2, 3, 8], [1, 5, 10]]);
      const [p] = r.names(1), k = 3;
      const combos = [];
      for (let i = 0; i < 3; i++) for (let j = i; j < 3; j++) for (let l = j; l < 3; l++) combos.push([vals[l], vals[j], vals[i]]);
      const sums = combos.map((c) => c[0] + c[1] + c[2]);
      const okIdx = combos.map((c, i) => i).filter((i) => sums.filter((x) => x === sums[i]).length === 1 && new Set(combos[i]).size > 1);
      const ans = combos[r.pick(okIdx)], T = ans[0] + ans[1] + ans[2], show = (c) => c.join('、');
      const others = r.sample(combos.filter((c) => show(c) !== show(ans)), 3);
      const all4 = r.shuffle([ans, ...others]);
      return {
        q: `套圈游戏：套中🐱得 ${vals[0]} 分，套中🐶得 ${vals[1]} 分，套中🐼得 ${vals[2]} 分。${p}套了 ${k} 次，每次都套中了，一共得 ${T} 分。${p}三次各得几分？`,
        answer: [pick(all4.map(show), show(ans))],
        steps: ['把每个选项的三次得分加一加：', ...all4.map((c) => `${c.join(' + ')} = ${c[0] + c[1] + c[2]}${show(c) === show(ans) ? ' ✓' : ''}`), `正好是 ${T} 分的是 ${show(ans)}`],
        hint: '每个选项都加一加，看哪个正好是总分',
      };
    },
  },

  // ---------- 下册 · 找规律 ----------
  {
    id: 'g1b-pattern-shape', grade: 1, term: 2, unit: '找规律', name: '图形的规律',
    tip: '先找出重复的那一组，再一组一组往下排', level: 1,
    gen(r) {
      const unit = r.pick([[0, 1], [0, 1, 1], [0, 0, 1], [0, 1, 2], [0, 0, 1, 1], [0, 1, 1, 2]]);
      const set = r.sample(r.pick([['🍎', '🍌', '🍇', '🍓'], ['🔴', '🔵', '🟡', '🟢'], ['⭐', '🌙', '☀️', '☁️'], ['🐶', '🐱', '🐰', '🐼'], ['🔺', '🟦', '⚪', '🟩']]), 3);
      const k = unit.length, len = k * r.int(2, 3) + r.int(0, k - 1), seq = range(0, len).map((i) => set[unit[i % k]]);
      const hole = r.chance(0.6) ? len : r.int(k, len - 1); // ? 在最后或中间
      const shown = seq.slice(0, len + 1).map((e, i) => (i === hole ? '❓' : e)).slice(0, Math.max(hole + 1, len));
      const ans = seq[hole], used = [...new Set(unit.map((i) => set[i]))];
      const groups = [];
      for (let i = 0; i < 2; i++) groups.push(unit.map((u) => set[u]).join(''));
      return {
        q: `按规律，❓ 处应该是什么？\n${shown.join(' ')}`,
        answer: [pick(opts(r, ans, used.filter((e) => e !== ans), set, Math.min(3, Math.max(2, used.length + (used.length < 3 ? 1 : 0)))), ans)],
        steps: [`每 ${k} 个一组重复：${groups.join(' | ')} | ……`, `一组一组往下排，数到 ❓ 的位置`, `❓ 是 ${ans}`],
      };
    },
  },
  {
    id: 'g1b-pattern-nth', grade: 1, term: 2, unit: '找规律', name: '按规律排，第几个是什么',
    tip: '几个一组重复，就几个几个地数：数到最接近的整组，再往后数', level: 3,
    gen(r) {
      const unit = r.pick([[0, 1], [0, 1, 1], [0, 0, 1], [0, 1, 2], [0, 0, 1, 1]]);
      const set = r.sample(['🍎', '🍌', '🍇', '🔴', '🔵', '⭐', '🌙'], 3), k = unit.length, n = r.int(10, 20);
      const items = unit.map((u) => set[u]), m = Math.floor(n / k) * k, rest = n - m;
      const ans = items[(n - 1) % k], used = [...new Set(items)];
      const skip = range(1, Math.floor(n / k)).map((i) => i * k).join('、');
      if (r.chance(0.6)) return {
        q: `按「${items.join('')}」的顺序一直排下去，第 ${n} 个是什么？`,
        fig: rowFig([...items, ...items, '…'], { size: 40 }),
        answer: [pick(opts(r, ans, used.filter((e) => e !== ans), set, used.length < 3 ? 3 : used.length), ans)],
        steps: [`每 ${k} 个一组：${items.join('')}`, `${k} 个 ${k} 个地数：${skip}`, rest ? `第 ${m} 个是一组的最后一个，再往后数 ${rest} 个，是这一组的第 ${rest} 个：${ans}` : `第 ${n} 个正好是一组的最后一个：${ans}`],
      };
      const tgt = used[r.int(0, used.length - 1)], per = items.filter((e) => e === tgt).length, g = Math.floor(n / k), extra = items.slice(0, rest).filter((e) => e === tgt).length;
      return {
        q: `按「${items.join('')}」的顺序一直排下去，前 ${n} 个里有几个 ${tgt}？`,
        fig: rowFig([...items, ...items, '…'], { size: 40 }),
        answer: [num(g * per + extra, { unit: '个' })],
        steps: [`每 ${k} 个一组，每组有 ${per} 个 ${tgt}`, `${k} 个 ${k} 个地数到 ${m}，是 ${g} 组，有 ${range(1, g).map(() => per).join(' + ')} = ${g * per} 个`, rest ? `后面还有 ${rest} 个：${items.slice(0, rest).join('')}，${extra ? `里面有 ${extra} 个 ${tgt}` : `里面没有 ${tgt}`}` : '正好是整组，没有多出来的', `一共 ${g * per + extra} 个`],
      };
    },
  },
  {
    id: 'g1b-pattern-num', grade: 1, term: 2, unit: '找规律', name: '数的规律（100 以内）',
    tip: '看相邻两个数：每次多几还是少几；也可以看十位、个位怎么变', level: 1,
    gen(r) {
      const st = r.pick([2, 5, 10, 10, 3, 4, 11, 9]), up = r.bool(), len = 6;
      const a = up ? r.int(1, 99 - st * (len - 1)) : r.int(st * (len - 1) + 1, 99);
      const seq = range(0, len - 1).map((i) => a + (up ? st : -st) * i);
      const holes = r.sample(range(2, len - 1), 2).sort((x, y) => x - y);
      const why = st === 10 ? '十位每次' + (up ? '多' : '少') + ' 1，个位不变' : st === 11 ? '十位和个位都' + (up ? '多' : '少') + ' 1' : st === 9 ? '十位' + (up ? '多 1，个位少 1' : '少 1，个位多 1') : `每次${up ? '多' : '少'} ${st}`;
      return {
        q: `找规律填数：${seq.map((v, i) => (holes.includes(i) ? `{${holes.indexOf(i)}}` : v)).join('，')}`,
        answer: holes.map((i) => num(seq[i])),
        steps: [`看 ${seq[0]} → ${seq[1]}：${up ? '多' : '少'}了 ${st}`, `规律：${why}`, `填好：${seq.join('，')}`],
      };
    },
  },
];
