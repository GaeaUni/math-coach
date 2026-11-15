// 题型生成器共用的工具：随机数、数论、格式化、竖式、配图（SVG）。
// 浏览器和 Node（tools/validate.js）都会 import 这个文件，不能依赖 DOM。

// ---------- 随机数 ----------
export function makeRng(seed = Date.now()) {
  let s = (seed >>> 0) || 1;
  const next = () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = {
    next,
    /** [a, b] 闭区间整数 */
    int: (a, b) => a + Math.floor(next() * (b - a + 1)),
    /** [a, b] 内 step 的倍数 */
    step: (a, b, st) => st * r.int(Math.ceil(a / st), Math.floor(b / st)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    bool: () => next() < 0.5,
    chance: (p) => next() < p,
    shuffle: (arr) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    /** 不重复地取 k 个 */
    sample: (arr, k) => r.shuffle(arr).slice(0, k),
    /** 反复调用 fn 直到 ok(结果) 为真；最多 200 次，防死循环 */
    until: (fn, ok) => {
      for (let i = 0; i < 200; i++) { const v = fn(); if (ok(v)) return v; }
      throw new Error('r.until: 200 次都没生成出合格的数');
    },
    name: () => r.pick(NAMES),
    names: (k) => r.sample(NAMES, k),
  };
  return r;
}

export const NAMES = ['小明', '小红', '小军', '小丽', '乐乐', '丁丁', '冬冬', '笑笑', '淘气', '聪聪', '亮亮', '芳芳', '天天', '欢欢', '小宇', '朵朵'];

// ---------- 数论 ----------
export const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
export const lcm = (a, b) => (a / gcd(a, b)) * b;
export const simplify = (n, d) => { const g = gcd(n, d) || 1; return d < 0 ? [-n / g, -d / g] : [n / g, d / g]; };
export const isPrime = (n) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
export const factors = (n) => { const f = []; for (let i = 1; i <= n; i++) if (n % i === 0) f.push(i); return f; };
export const primeFactors = (n) => { const f = []; for (let p = 2; p * p <= n; p++) while (n % p === 0) { f.push(p); n /= p; } if (n > 1) f.push(n); return f; };

// ---------- 小数 / 格式 ----------
/** 消掉浮点误差：fix(0.1+0.2) === 0.3 */
export const fix = (x, d = 9) => { const v = Math.round(x * 10 ** d) / 10 ** d; return Object.is(v, -0) ? 0 : v; };
/** 数字转字符串，不出现 0.30000000000000004 和科学计数法 */
export function fmt(x) {
  x = fix(x);
  if (Number.isInteger(x)) return BigInt(x).toString();
  let s = x.toFixed(9).replace(/0+$/, '').replace(/\.$/, '');
  return s;
}
/** 小数位数 */
export const decimals = (x) => { const s = fmt(x); const i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1; };
/** 四舍五入到 d 位小数 */
export const round = (x, d = 0) => fix(Math.round(fix(x * 10 ** d)) / 10 ** d);
/** 分数标记：在题干 / 讲解里显示为上下结构的分数 */
export const frac = (n, d) => `{{${n}/${d}}}`;
/** 带分数标记 */
export const mixed = (w, n, d) => `{{${w} ${n}/${d}}}`;
/** 把 n/d 写成最简形式的标记（整数就写整数，假分数可选写成带分数） */
export function fracText(n, d, { asMixed = false } = {}) {
  [n, d] = simplify(n, d);
  if (d === 1) return String(n);
  if (asMixed && Math.abs(n) > d) { const w = Math.trunc(n / d); return mixed(w, Math.abs(n % d), d); }
  return frac(n, d);
}

// ---------- 中文读数 ----------
const CN = '零一二三四五六七八九';
function read4(n, isHead) {
  // n: 0..9999，isHead 表示是最高级（不需要补前导零）
  const units = ['千', '百', '十', ''];
  const ds = String(n).padStart(4, '0').split('').map(Number);
  let out = '', zero = false, started = isHead ? false : true;
  for (let i = 0; i < 4; i++) {
    const d = ds[i];
    if (d === 0) { if (started) zero = true; continue; }
    if (zero && out) out += '零';
    else if (zero && !out && !isHead) out += '零';
    zero = false; started = true;
    out += CN[d] + units[i];
  }
  if (isHead && out.startsWith('一十')) out = out.slice(1);
  return out;
}
/** 整数读法：305000 → 三十万五千 */
export function readInt(n) {
  if (n === 0) return '零';
  const neg = n < 0; n = Math.abs(n);
  const parts = [];
  const levels = ['', '万', '亿', '万亿'];
  let lv = 0; const groups = [];
  while (n > 0) { groups.push(n % 10000); n = Math.floor(n / 10000); }
  let out = '';
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    const isHead = i === groups.length - 1;
    if (g === 0) { if (!out.endsWith('零')) out += '零'; continue; }
    if (!isHead && g < 1000 && !out.endsWith('零')) out += '零';
    out += read4(g, isHead).replace(/^零/, '') + levels[i];
  }
  out = out.replace(/零+$/, '').replace(/零+/g, '零');
  return (neg ? '负' : '') + out;
}
/** 数的读法（含小数）：3.05 → 三点零五 */
export function readNum(x) {
  const s = fmt(x);
  const [i, d] = s.replace('-', '').split('.');
  let out = (s.startsWith('-') ? '负' : '') + readInt(Number(i));
  if (d) out += '点' + d.split('').map((c) => CN[+c]).join('');
  return out;
}

// ---------- 竖式（讲解里用 {pre: ...} 等宽显示） ----------
function alignDec(nums, zeroPad = []) {
  const strs = nums.map(fmt);
  const intLen = Math.max(...strs.map((s) => s.split('.')[0].replace('-', '').length));
  const decLen = Math.max(...strs.map((s) => (s.split('.')[1] || '').length));
  return strs.map((s, i) => {
    const [a, b = ''] = s.split('.');
    if (!decLen) return a.padStart(intLen, ' ');
    if (zeroPad[i]) return a.padStart(intLen, ' ') + '.' + b.padEnd(decLen, '0'); // 课本写法：被减数、结果补 0
    return a.padStart(intLen, ' ') + (b ? '.' : ' ') + b.padEnd(decLen, ' ');
  });
}
const spaced = (s) => s.split('').join(' ');
/** 加减法竖式（支持小数，按小数点对齐） */
function vAddSub(a, b, op) {
  const res = op === '+' ? fix(a + b) : fix(a - b);
  const [sa, sb, sr] = alignDec([a, b, res], op === '-' ? [true, false, true] : [false, false, true]);
  const w = Math.max(sa.length, sb.length, sr.length);
  const L = (s, sign = ' ') => sign + ' ' + spaced(s.padStart(w, ' '));
  const line = '  ' + '─'.repeat(w * 2 - 1);
  return { pre: [L(sa), L(sb, op), line, L(sr)].join('\n') };
}
export const vAdd = (a, b) => vAddSub(a, b, '+');
export const vSub = (a, b) => vAddSub(a, b, '-');
/** 整数乘法竖式（含部分积） */
export function vMul(a, b) {
  const res = a * b;
  const bs = String(b).split('').reverse().map(Number);
  const nz = bs.map((d, i) => [d, i]).filter(([d]) => d !== 0);
  const partials = nz.length > 1 ? nz : []; // 只有一个非 0 部分积时，它就是结果，不单写
  const w = Math.max(String(a).length, String(b).length + 1, String(res).length);
  const L = (s, sign = ' ') => sign + ' ' + spaced(String(s).padStart(w, ' '));
  const line = '  ' + '─'.repeat(w * 2 - 1);
  const rows = [L(a), L(b, '×'), line];
  if (partials.length) {
    // 部分积末尾的 0 不写，按所乘的那一位右对齐；乘数中间的 0 那一位跳过
    for (const [d, i] of partials) rows.push(L(String(a * d) + ' '.repeat(i)));
    rows.push(line);
  }
  rows.push(L(res));
  return { pre: rows.join('\n') };
}
/** 整数除法竖式（长除法，可带余数）：vDiv(726, 3) */
export function vDiv(dividend, divisor) {
  const D = String(dividend).split('').map(Number);
  const n = D.length;
  const steps = []; const q = Array(n).fill(' ');
  let cur = 0, started = false;
  for (let i = 0; i < n; i++) {
    cur = cur * 10 + D[i];
    if (!started && cur < divisor && i < n - 1) continue;
    started = true;
    const qd = Math.floor(cur / divisor);
    q[i] = String(qd);
    steps.push({ col: i, cur, prod: qd * divisor, rem: cur - qd * divisor });
    cur -= qd * divisor;
  }
  const ds = String(divisor);
  const pad = ' '.repeat(ds.length + 2);
  const colStr = (num, col) => { // 让 num 的个位落在第 col 列
    const s = String(num); const start = col - s.length + 1;
    let line = ''; for (let c = 0; c < n; c++) line += (c >= start && c <= col ? s[c - start] : ' ') + ' ';
    return pad + ' ' + line.replace(/\s+$/, '');
  };
  const rule = (from, to) => { let line = ''; for (let c = 0; c < n; c++) line += (c >= from && c <= to ? '──' : '  '); return pad + line.replace(/\s+$/, ''); };
  const rows = [];
  rows.push(pad + ' ' + q.join(' ').replace(/\s+$/, ''));
  rows.push(pad.slice(0, -1) + '┌' + '─'.repeat(n * 2));
  rows.push(ds + ' │ ' + D.join(' '));
  // 商是 0 的那一步不单独写（课本写法），直接把下一位落下来
  let shown = steps.filter((st) => st.prod > 0);
  if (!shown.length) shown = [steps[steps.length - 1]];
  shown.forEach((st, k) => {
    const w = String(st.cur).length;
    if (k > 0) rows.push(colStr(st.cur, st.col));
    rows.push(colStr(st.prod, st.col));
    rows.push(rule(st.col - Math.max(w, String(st.prod).length) + 1, st.col));
    if (k === shown.length - 1) {
      const lastStep = steps[steps.length - 1];
      rows.push(colStr(lastStep.rem, lastStep.col));
    }
  });
  return { pre: rows.join('\n') };
}

// ---------- 配图（SVG 字符串） ----------
const C = { line: '#2b3a55', fill: '#e8f0ff', fill2: '#fff3d6', acc: '#e4572e', dash: '#7a869a', text: '#1d2433' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const svg = (w, h, inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="-apple-system,PingFang SC,sans-serif">${inner}</svg>`;
const T = (x, y, s, { size = 16, anchor = 'middle', color = C.text, weight = 'normal' } = {}) =>
  `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size}" text-anchor="${anchor}" dominant-baseline="middle" fill="${color}" font-weight="${weight}">${esc(s)}</text>`;

/** 把一组点缩放到画布里；返回映射函数 */
function fitter(pts, W, H, pad = 36) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const k = Math.min((W - 2 * pad) / (maxX - minX || 1), (H - 2 * pad) / (maxY - minY || 1));
  const ox = (W - (maxX - minX) * k) / 2, oy = (H - (maxY - minY) * k) / 2;
  // y 轴向上
  return ([x, y]) => [ox + (x - minX) * k, H - (oy + (y - minY) * k)];
}

export const fig = {
  raw: svg,
  text: T,
  colors: C,

  /** 钟面：clock(3, 30)；opts.digital 时在下方写电子钟 */
  clock(h, m, { size = 220, numbers = true } = {}) {
    const c = size / 2, R = c - 10;
    let s = `<circle cx="${c}" cy="${c}" r="${R}" fill="#fff" stroke="${C.line}" stroke-width="4"/>`;
    for (let i = 0; i < 60; i++) {
      const a = (i * 6 * Math.PI) / 180, big = i % 5 === 0;
      const r1 = R - (big ? 14 : 7), r2 = R - 3;
      s += `<line x1="${c + r1 * Math.sin(a)}" y1="${c - r1 * Math.cos(a)}" x2="${c + r2 * Math.sin(a)}" y2="${c - r2 * Math.cos(a)}" stroke="${C.line}" stroke-width="${big ? 3 : 1.2}"/>`;
    }
    if (numbers) for (let i = 1; i <= 12; i++) { const a = (i * 30 * Math.PI) / 180, r = R - 30; s += T(c + r * Math.sin(a), c - r * Math.cos(a) + 1, i, { size: size / 11, weight: 'bold' }); }
    const ha = (((h % 12) + m / 60) * 30 * Math.PI) / 180, ma = (m * 6 * Math.PI) / 180;
    s += `<line x1="${c}" y1="${c}" x2="${c + R * 0.5 * Math.sin(ha)}" y2="${c - R * 0.5 * Math.cos(ha)}" stroke="${C.line}" stroke-width="7" stroke-linecap="round"/>`;
    s += `<line x1="${c}" y1="${c}" x2="${c + R * 0.78 * Math.sin(ma)}" y2="${c - R * 0.78 * Math.cos(ma)}" stroke="${C.acc}" stroke-width="4" stroke-linecap="round"/>`;
    s += `<circle cx="${c}" cy="${c}" r="6" fill="${C.line}"/>`;
    return svg(size, size, s);
  },

  /** 一排排的物品：items('🍎', 7, {perRow: 5})；可用 cross 划掉后 k 个（表示减法） */
  items(emoji, count, { perRow = 5, size = 40, cross = 0, gap = 8 } = {}) {
    const rows = Math.ceil(count / perRow) || 1;
    const W = Math.min(count, perRow) * (size + gap) + gap, H = rows * (size + gap) + gap;
    let s = '';
    for (let i = 0; i < count; i++) {
      const x = gap + (i % perRow) * (size + gap) + size / 2, y = gap + Math.floor(i / perRow) * (size + gap) + size / 2;
      s += T(x, y + 2, emoji, { size: size * 0.85 });
      if (i >= count - cross) s += `<line x1="${x - size / 2.4}" y1="${y + size / 2.4}" x2="${x + size / 2.4}" y2="${y - size / 2.4}" stroke="${C.acc}" stroke-width="3"/>`;
    }
    return svg(W, H, s);
  },

  /** 几组物品并排，组之间加分隔：groups([['🍎',3],['🍐',4]]) ；圈起来用 circle:true */
  groups(list, { size = 36, perRow = 5, circle = true } = {}) {
    let x = 8, s = '', H = 0;
    for (const [emoji, n] of list) {
      const cols = Math.min(n, perRow), rows = Math.ceil(n / perRow) || 1;
      const w = cols * (size + 4) + 12, h = rows * (size + 4) + 12;
      if (circle) s += `<rect x="${x}" y="6" width="${w}" height="${h}" rx="18" fill="none" stroke="${C.dash}" stroke-dasharray="6 4" stroke-width="2"/>`;
      for (let i = 0; i < n; i++) s += T(x + 6 + (i % cols) * (size + 4) + size / 2, 6 + 6 + Math.floor(i / cols) * (size + 4) + size / 2 + 2, emoji, { size: size * 0.85 });
      x += w + 14; H = Math.max(H, h + 12);
    }
    return svg(x, H, s);
  },

  /** 任意多边形：pts 用题目里的真实单位（y 轴向上），edgeLabels[i] 标在第 i 条边（pts[i]→pts[i+1]）外侧 */
  poly(pts, { edgeLabels = [], fill = C.fill, dashed = [], extra = '', W = 360, H = 240, labelSize = 16, pointLabels = [] } = {}) {
    const all = [...pts, ...dashed.flat()];
    const f = fitter(all, W, H, 52);
    const P = pts.map(f);
    const cx = P.reduce((a, p) => a + p[0], 0) / P.length, cy = P.reduce((a, p) => a + p[1], 0) / P.length;
    let area = 0; P.forEach((p, i) => { const q = P[(i + 1) % P.length]; area += p[0] * q[1] - q[0] * p[1]; });
    const sgn = area > 0 ? 1 : -1;
    let s = `<polygon points="${P.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')}" fill="${fill}" stroke="${C.line}" stroke-width="3" stroke-linejoin="round"/>`;
    for (const [a, b] of dashed) { const [x1, y1] = f(a), [x2, y2] = f(b); s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.dash}" stroke-width="2" stroke-dasharray="6 5"/>`; }
    P.forEach((p, i) => {
      const lab = edgeLabels[i]; if (!lab) return;
      const q = P[(i + 1) % P.length];
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      let nx = (q[1] - p[1]) * sgn, ny = -(q[0] - p[0]) * sgn; const len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len;
      const anchor = nx > 0.5 ? 'start' : nx < -0.5 ? 'end' : 'middle';
      s += T(mx + nx * 10, my + ny * 16, lab, { size: labelSize, color: C.text, anchor });
    });
    pointLabels.forEach((lab, i) => { if (!lab) return; const p = P[i]; const dx = p[0] - cx, dy = p[1] - cy, d = Math.hypot(dx, dy) || 1; s += T(p[0] + (dx / d) * 16, p[1] + (dy / d) * 16, lab, { size: 15, weight: 'bold' }); });
    return svg(W, H, s + extra);
  },

  /** 长方形（w×h，单位 unit）；square 时只标一条边 */
  rect(w, h, { unit = 'cm', labelW = true, labelH = true, fill } = {}) {
    const ratio = Math.max(0.35, Math.min(2.6, w / h)); // 极端比例时压一压，避免画成一条线
    const pw = ratio, ph = 1;
    return fig.poly([[0, 0], [pw, 0], [pw, ph], [0, ph]], { edgeLabels: [labelW ? `${fmt(w)}${unit}` : '', labelH ? `${fmt(h)}${unit}` : ''], fill });
  },
  square(a, { unit = 'cm' } = {}) { return fig.poly([[0, 0], [1, 0], [1, 1], [0, 1]], { edgeLabels: [`${fmt(a)}${unit}`] }); },

  /** 三角形：底 base、高 height（画虚线高）；top 为顶点在底边上的投影位置比例 0~1 */
  triangle(base, height, { unit = 'cm', top = 0.35, showBase = true, showHeight = true } = {}) {
    const b = 1.6, h = Math.max(0.5, Math.min(1.4, (height / base) * b)), tx = b * top;
    const pts = [[0, 0], [b, 0], [tx, h]];
    const hl = showHeight ? T(0, 0, '') : '';
    const f = fitter(pts, 360, 240, 52);
    const [x1, y1] = f([tx, h]), [x2, y2] = f([tx, 0]);
    const extra = showHeight ? `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.dash}" stroke-width="2" stroke-dasharray="6 5"/><rect x="${x2}" y="${y2 - 10}" width="10" height="10" fill="none" stroke="${C.dash}"/>` + T(x1 + 26, (y1 + y2) / 2, `${fmt(height)}${unit}`, { size: 16 }) : '';
    return fig.poly(pts, { edgeLabels: [showBase ? `${fmt(base)}${unit}` : ''], extra: extra + hl });
  },

  /** 平行四边形：底、高、斜边水平偏移比例 */
  parallelogram(base, height, { unit = 'cm', skew = 0.35, side } = {}) {
    const b = 1.6, h = Math.max(0.5, Math.min(1.2, (height / base) * b)), k = b * skew;
    const pts = [[0, 0], [b, 0], [b + k, h], [k, h]];
    const f = fitter(pts, 360, 240, 52);
    const [x1, y1] = f([k, h]), [x2, y2] = f([k, 0]);
    const extra = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.dash}" stroke-width="2" stroke-dasharray="6 5"/>` + T(x1 + 26, (y1 + y2) / 2, `${fmt(height)}${unit}`, { size: 16 });
    return fig.poly(pts, { edgeLabels: [`${fmt(base)}${unit}`, side ? `${fmt(side)}${unit}` : ''], extra });
  },

  /** 梯形：上底、下底、高 */
  trapezoid(top, bottom, height, { unit = 'cm' } = {}) {
    const b = 1.8, t = Math.max(0.5, Math.min(1.5, (top / bottom) * b)), h = Math.max(0.6, Math.min(1.2, (height / bottom) * b)), off = (b - t) * 0.35;
    const pts = [[0, 0], [b, 0], [off + t, h], [off, h]];
    const f = fitter(pts, 360, 240, 52);
    const [x1, y1] = f([off, h]), [x2, y2] = f([off, 0]);
    const extra = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.dash}" stroke-width="2" stroke-dasharray="6 5"/>` + T(x1 + 26, (y1 + y2) / 2, `${fmt(height)}${unit}`, { size: 16 });
    return fig.poly(pts, { edgeLabels: [`${fmt(bottom)}${unit}`, '', `${fmt(top)}${unit}`], extra });
  },

  /** 圆：label 写在半径 / 直径线上，如 'r=3cm' 或 'd=6cm' */
  circle({ label = '', diameter = false, sector = 0 } = {}) {
    const c = 110, R = 90;
    let s = `<circle cx="${c}" cy="${c}" r="${R}" fill="${C.fill}" stroke="${C.line}" stroke-width="3"/><circle cx="${c}" cy="${c}" r="3" fill="${C.line}"/>`;
    if (sector) { const a = (sector * Math.PI) / 180; s += `<path d="M${c},${c} L${c + R},${c} A${R},${R} 0 ${sector > 180 ? 1 : 0},0 ${c + R * Math.cos(a)},${c - R * Math.sin(a)} Z" fill="${C.fill2}" stroke="${C.line}" stroke-width="2"/>`; }
    if (diameter) s += `<line x1="${c - R}" y1="${c}" x2="${c + R}" y2="${c}" stroke="${C.acc}" stroke-width="2.5"/>`;
    else s += `<line x1="${c}" y1="${c}" x2="${c + R}" y2="${c}" stroke="${C.acc}" stroke-width="2.5"/>`;
    if (label) s += T(diameter ? c : c + R / 2, c - 14, label, { size: 17, weight: 'bold' });
    return svg(220, 220, s);
  },

  /** 长方体（斜二测）：cuboid(5, 3, 4, {labels: ['5cm','3cm','4cm']}) 依次为长、宽、高 */
  cuboid(l, w, h, { labels } = {}) {
    // 各边按比例画，但最短边不小于最长边的 0.3，避免画成一条线
    const m = Math.max(l, w, h), cl = (x) => Math.max(x, m * 0.3), k = 150 / m;
    const L = cl(l) * k * 1.3, Wd = cl(w) * k * 0.6, Hh = cl(h) * k * 1.3;
    const ox = 70, oy = 24 + Wd * 0.7 + Hh;
    const dx = Wd * 0.7, dy = -Wd * 0.7;
    const p = (x, y) => `${x.toFixed(1)},${y.toFixed(1)}`;
    const A = [ox, oy], B = [ox + L, oy], Cc = [ox + L, oy - Hh], D = [ox, oy - Hh];
    const A2 = [A[0] + dx, A[1] + dy], B2 = [B[0] + dx, B[1] + dy], C2 = [Cc[0] + dx, Cc[1] + dy], D2 = [D[0] + dx, D[1] + dy];
    let s = `<polygon points="${p(...A)} ${p(...B)} ${p(...Cc)} ${p(...D)}" fill="${C.fill}" stroke="${C.line}" stroke-width="2.5"/>`;
    s += `<polygon points="${p(...D)} ${p(...Cc)} ${p(...C2)} ${p(...D2)}" fill="#d8e5ff" stroke="${C.line}" stroke-width="2.5"/>`;
    s += `<polygon points="${p(...B)} ${p(...B2)} ${p(...C2)} ${p(...Cc)}" fill="#c9dbff" stroke="${C.line}" stroke-width="2.5"/>`;
    s += `<line x1="${A[0]}" y1="${A[1]}" x2="${A2[0]}" y2="${A2[1]}" stroke="${C.dash}" stroke-dasharray="5 4" stroke-width="1.5"/><line x1="${A2[0]}" y1="${A2[1]}" x2="${B2[0]}" y2="${B2[1]}" stroke="${C.dash}" stroke-dasharray="5 4" stroke-width="1.5"/><line x1="${A2[0]}" y1="${A2[1]}" x2="${D2[0]}" y2="${D2[1]}" stroke="${C.dash}" stroke-dasharray="5 4" stroke-width="1.5"/>`;
    const [ll, ww, hh] = labels || [`${fmt(l)}`, `${fmt(w)}`, `${fmt(h)}`];
    if (ll) s += T((A[0] + B[0]) / 2, A[1] + 16, ll);
    if (ww) s += T((B[0] + B2[0]) / 2 + 22, (B[1] + B2[1]) / 2 + 6, ww);
    if (hh) s += T(A[0] - 8, (A[1] + D[1]) / 2, hh, { anchor: 'end' });
    return svg(ox + L + dx + 80, oy + 34, s);
  },

  /** 圆柱：cylinder({r:'r=2cm', h:'h=5cm'}) 只画示意，标注随意 */
  cylinder({ rLabel = '', hLabel = '', cone = false, diameter = false } = {}) {
    const cx = 110, rx = 70, ry = 20, top = 30, bot = 200;
    let s = '';
    if (cone) {
      s += `<path d="M${cx - rx},${bot} L${cx},${top} L${cx + rx},${bot}" fill="${C.fill}" stroke="${C.line}" stroke-width="2.5"/><ellipse cx="${cx}" cy="${bot}" rx="${rx}" ry="${ry}" fill="#d8e5ff" stroke="${C.line}" stroke-width="2.5"/>`;
      s += `<line x1="${cx}" y1="${top}" x2="${cx}" y2="${bot}" stroke="${C.dash}" stroke-dasharray="5 4"/>`;
    } else {
      s += `<path d="M${cx - rx},${top} L${cx - rx},${bot} A${rx},${ry} 0 0,0 ${cx + rx},${bot} L${cx + rx},${top}" fill="${C.fill}" stroke="${C.line}" stroke-width="2.5"/><ellipse cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}" fill="#d8e5ff" stroke="${C.line}" stroke-width="2.5"/>`;
      s += `<path d="M${cx - rx},${bot} A${rx},${ry} 0 0,1 ${cx + rx},${bot}" fill="none" stroke="${C.dash}" stroke-dasharray="5 4"/>`;
    }
    s += `<line x1="${diameter ? cx - rx : cx}" y1="${bot}" x2="${cx + rx}" y2="${bot}" stroke="${C.acc}" stroke-width="2.5"/><circle cx="${cx}" cy="${bot}" r="3" fill="${C.line}"/>`;
    if (rLabel) s += T(diameter ? cx : cx + rx / 2, bot + ry + 14, rLabel, { size: 15, weight: 'bold' });
    if (hLabel) s += T(cx + rx + 12, (top + bot) / 2, hLabel, { size: 15, anchor: 'start', weight: 'bold' });
    return svg(260, 250, s);
  },

  /** 数轴：numberLine({min:0,max:10,step:1, marks:[{v:3,label:'A'}], labels:true}) */
  numberLine({ min = 0, max = 10, step = 1, marks = [], labels = true, labelEvery = 1 } = {}) {
    const W = 560, H = 90, x0 = 30, x1 = W - 30, y = 50;
    const X = (v) => x0 + ((v - min) / (max - min)) * (x1 - x0);
    let s = `<line x1="${x0 - 10}" y1="${y}" x2="${x1 + 14}" y2="${y}" stroke="${C.line}" stroke-width="2.5"/><path d="M${x1 + 14},${y} l-10,-6 l0,12 z" fill="${C.line}"/>`;
    let i = 0;
    for (let v = min; v <= max + 1e-9; v = fix(v + step), i++) {
      s += `<line x1="${X(v)}" y1="${y - 7}" x2="${X(v)}" y2="${y + 7}" stroke="${C.line}" stroke-width="2"/>`;
      if (labels && i % labelEvery === 0) s += T(X(v), y + 22, fmt(v), { size: 14 });
    }
    for (const m of marks) { s += `<circle cx="${X(m.v)}" cy="${y}" r="6" fill="${C.acc}"/>`; if (m.label) s += T(X(m.v), y - 22, m.label, { size: 16, weight: 'bold', color: C.acc }); }
    return svg(W, H, s);
  },

  /** 角：angle(60, {label:'?'})，画出两条边和弧 */
  angle(deg, { label = '', arc = true } = {}) {
    const W = 260, H = 200, ox = 50, oy = 160, L = 170;
    const a = (deg * Math.PI) / 180;
    let s = `<line x1="${ox}" y1="${oy}" x2="${ox + L}" y2="${oy}" stroke="${C.line}" stroke-width="3"/><line x1="${ox}" y1="${oy}" x2="${ox + L * Math.cos(a)}" y2="${oy - L * Math.sin(a)}" stroke="${C.line}" stroke-width="3"/>`;
    if (arc) { const r = 34; s += `<path d="M${ox + r},${oy} A${r},${r} 0 ${deg > 180 ? 1 : 0},0 ${ox + r * Math.cos(a)},${oy - r * Math.sin(a)}" fill="none" stroke="${C.acc}" stroke-width="2.5"/>`; }
    if (label) s += T(ox + 56 * Math.cos(a / 2), oy - 56 * Math.sin(a / 2), label, { size: 17, weight: 'bold', color: C.acc });
    const minX = Math.min(0, L * Math.cos(a));
    return svg(W - Math.min(0, minX), H, deg > 90 ? `<g transform="translate(${-minX},0)">${s}</g>` : s);
  },

  /** 线段图（应用题常用）：bars([{label:'小明', units:3, text:'24本'}, {label:'小红', units:1}], {unitLabel:'?'}) */
  bars(rows, { unitW = 60, brace = '' } = {}) {
    const W = 120 + Math.max(...rows.map((r) => r.units)) * unitW + 120, H = rows.length * 56 + 20;
    let s = '';
    rows.forEach((row, i) => {
      const y = 30 + i * 56; s += T(60, y, row.label, { anchor: 'end' });
      const x0 = 80;
      s += `<line x1="${x0}" y1="${y}" x2="${x0 + row.units * unitW}" y2="${y}" stroke="${C.line}" stroke-width="3"/>`;
      for (let k = 0; k <= Math.ceil(row.units); k++) { const x = x0 + Math.min(k, row.units) * unitW; s += `<line x1="${x}" y1="${y - 8}" x2="${x}" y2="${y + 8}" stroke="${C.line}" stroke-width="2"/>`; }
      if (row.extra) { s += `<line x1="${x0 + row.units * unitW}" y1="${y}" x2="${x0 + row.units * unitW + row.extra * unitW}" y2="${y}" stroke="${C.acc}" stroke-width="3"/><line x1="${x0 + (row.units + row.extra) * unitW}" y1="${y - 8}" x2="${x0 + (row.units + row.extra) * unitW}" y2="${y + 8}" stroke="${C.acc}" stroke-width="2"/>`; if (row.extraText) s += T(x0 + (row.units + row.extra / 2) * unitW, y - 16, row.extraText, { size: 14, color: C.acc }); }
      if (row.text) s += T(x0 + ((row.units + (row.extra || 0)) * unitW) + 12, y, row.text, { anchor: 'start', size: 15 });
    });
    return svg(W, H, s);
  },
};
