// 三年级题库：上册 term 1、下册 term 2。单元名用人教版叫法，题型覆盖人教版 / 北京版 / 北师大版三年级常考内容。
import { fig, fmt, fix, frac, decimals, vAdd, vSub, vMul, vDiv, readNum, readInt } from '../js/lib.js';
import * as PZ from './puzzle.js';

// ================= 局部工具 =================
const num = (value, o = {}) => ({ kind: 'num', value: fix(value), ...o });
const pick = (options, value, o = {}) => ({ kind: 'choice', options, value, ...o });
// 三年级还没学约分，分数答案不要求最简
const fr = (n, d, o = {}) => ({ kind: 'frac', value: [n, d], simplest: false, ...o });
const CMP = ['>', '<', '='];
const sign = (a, b) => (a > b ? '>' : a < b ? '<' : '=');
const digits = (n) => String(n).split('').reverse().map(Number); // 个位在前
const PLACE = ['个位', '十位', '百位', '千位', '万位'];
const CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
const hm = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
const sp = (s) => s.split('').join(' ');
const C = fig.colors;
const SHADE = '#ffc861';

/** 加法逐位讲解：个位：8 + 5 = 13，写 3，向十位进 1 */
function addCols(a, b) {
  const A = digits(a), B = digits(b), n = Math.max(A.length, B.length), out = [];
  let c = 0;
  for (let i = 0; i < n; i++) {
    const parts = [];
    if (i < A.length) parts.push(A[i]);
    if (i < B.length) parts.push(B[i]);
    const s = (A[i] || 0) + (B[i] || 0) + c;
    let t;
    if (parts.length === 1 && !c) t = `${PLACE[i]}：直接落下 ${s}`;
    else {
      t = `${PLACE[i]}：${parts.join(' + ')}${c ? ' + 进上来的 1' : ''} = ${s}`;
      if (s >= 10) t += i === n - 1 ? `，直接写 ${s}` : `，写 ${s - 10}，向${PLACE[i + 1]}进 1`;
    }
    c = s >= 10 ? 1 : 0;
    out.push(t);
  }
  return out;
}

/** 减法逐位讲解（含连续退位、中间有 0 的退位） */
function subCols(a, b) {
  const A = digits(a), B = digits(b), n = A.length, cur = A.slice(), out = [];
  const res = digits(a - b);
  for (let i = 0; i < n; i++) {
    const has = i < B.length, y = B[i] || 0;
    let t = `${PLACE[i]}：`;
    if (cur[i] !== A[i]) t += A[i] === 0 ? '退位后还剩 9，' : `被退走 1，还剩 ${cur[i]}，`;
    if (cur[i] < y) {
      let j = i + 1;
      while (cur[j] === 0) j++;
      if (j === i + 1) t += `${cur[i]} 减 ${y} 不够减，从${PLACE[j]}退 1，${cur[i] + 10} − ${y} = ${cur[i] + 10 - y}`;
      else if (j === i + 2) t += `${cur[i]} 减 ${y} 不够减，${PLACE[i + 1]}是 0 没法退，先从${PLACE[j]}退 1 到${PLACE[i + 1]}，${PLACE[i + 1]}再退 1 给${PLACE[i]}：${cur[i] + 10} − ${y} = ${cur[i] + 10 - y}`;
      else t += `${cur[i]} 减 ${y} 不够减，${PLACE.slice(i + 1, j).join('、')}都是 0，要从${PLACE[j]}退 1，一位一位往下退：${cur[i] + 10} − ${y} = ${cur[i] + 10 - y}`;
      cur[j]--;
      for (let k = i + 1; k < j; k++) cur[k] = 9;
      cur[i] += 10;
    } else if (!has) {
      t += i === n - 1 && cur[i] === 0 ? '最高位是 0，不用写' : `直接落下 ${cur[i]}`;
    } else {
      t += `${cur[i]} − ${y} = ${cur[i] - y}`;
      if (i === n - 1 && cur[i] - y === 0 && i >= res.length) t += '，最高位的 0 不写';
    }
    out.push(t);
  }
  return out;
}

/** 多位数乘一位数逐位讲解 */
function mulCols(a, d) {
  const A = digits(a), out = [];
  let c = 0;
  A.forEach((x, i) => {
    const p = x * d, s = p + c, last = i === A.length - 1;
    let t = `${PLACE[i]}：${x} × ${d} = ${p}`;
    if (c) t += `，加上进上来的 ${c} 是 ${s}`;
    if (!last && s >= 10) t += `，写 ${s % 10}，向${PLACE[i + 1]}进 ${Math.floor(s / 10)}`;
    else t += `，写 ${s}`;
    c = last ? 0 : Math.floor(s / 10);
    out.push(t);
  });
  return out;
}

/** 一位数除法逐位讲解（长除法，配合 vDiv） */
function divCols(n, d) {
  const D = String(n).split('').map(Number), L = D.length, out = [];
  const P = (i) => PLACE[L - 1 - i];
  let cur = 0, started = false;
  for (let i = 0; i < L; i++) {
    const prev = cur;
    cur = cur * 10 + D[i];
    if (!started && cur < d && i < L - 1) {
      out.push(`${P(i)}上的 ${cur} 比 ${d} 小，不够商 1，要看前两位：${cur * 10 + D[i + 1]}`);
      continue;
    }
    const q = Math.floor(cur / d), rem = cur - q * d;
    if (!started) out.push(`${cur} ÷ ${d}，商 ${q} 写在${P(i)}上${rem ? `，余 ${rem}` : ''}`);
    else if (q === 0) out.push(D[i] === 0 ? `${P(i)}上是 0，0 ÷ ${d} 商 0，在${P(i)}上写 0` : `落下${P(i)}上的 ${D[i]}，${D[i]} 比 ${d} 小，不够商 1，在${P(i)}上商 0${i === L - 1 ? `，余 ${D[i]}` : ''}`);
    else out.push(`${prev ? `余下的 ${prev} 和${P(i)}上的 ${D[i]} 合成 ${cur}` : `落下${P(i)}上的 ${D[i]}`}，${cur} ÷ ${d} 商 ${q}，写在${P(i)}上${rem ? `，余 ${rem}` : ''}`);
    started = true;
    cur = rem;
  }
  return out;
}

/** 小数加减竖式：按小数点对齐，整数补 .0（课本写法），得数先保留末尾的 0 */
function vDec(a, b, op) {
  const dp = Math.max(decimals(a), decimals(b), 1);
  const res = op === '+' ? fix(a + b) : fix(a - b);
  const s = [a, b, res].map((x) => x.toFixed(dp));
  const w = Math.max(...s.map((x) => x.length));
  const L = (str, sg = ' ') => sg + ' ' + sp(str.padStart(w, ' '));
  return { pre: [L(s[0]), L(s[1], op), '  ' + '─'.repeat(w * 2 - 1), L(s[2])].join('\n') };
}

/** 因数末尾有 0 的乘法竖式（课本简便写法：一位数和 0 前面的数对齐） */
function vMulZ(a, d) {
  const sa = String(a), z = sa.length - sa.replace(/0+$/, '').length, sr = String(a * d);
  const w = Math.max(sa.length, sr.length);
  const L = (str, sg = ' ') => sg + ' ' + sp(str.padStart(w, ' '));
  return { pre: [L(sa), L(String(d) + ' '.repeat(z), '×'), '  ' + '─'.repeat(w * 2 - 1), L(sr)].join('\n') };
}

/** 两个钟面并排 */
function clock2([h1, m1], [h2, m2], la = '开始', lb = '结束') {
  const c1 = fig.clock(h1, m1, { size: 170 }).replace('<svg ', '<svg x="10" y="0" ');
  const c2 = fig.clock(h2, m2, { size: 170 }).replace('<svg ', '<svg x="220" y="0" ');
  return fig.raw(400, 205, c1 + c2 + fig.text(95, 190, la) + fig.text(305, 190, lb));
}

/** 分数配图：rect 长条 / circle 圆 / grid 方格，shaded 为涂色份的下标 */
function fracFig(shape, n, shaded) {
  const on = new Set(shaded);
  const fill = (i) => (on.has(i) ? SHADE : '#fff');
  let s = '';
  if (shape === 'circle') {
    const c = 110, R = 90;
    if (n === 1) s += `<circle cx="${c}" cy="${c}" r="${R}" fill="${fill(0)}" stroke="${C.line}" stroke-width="3"/>`;
    for (let i = 0; i < n && n > 1; i++) {
      const a0 = (i / n) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
      const p = (a) => `${(c + R * Math.cos(a)).toFixed(1)},${(c + R * Math.sin(a)).toFixed(1)}`;
      s += `<path d="M${c},${c} L${p(a0)} A${R},${R} 0 ${n === 2 ? 0 : 0},1 ${p(a1)} Z" fill="${fill(i)}" stroke="${C.line}" stroke-width="2.5"/>`;
    }
    return fig.raw(220, 220, s);
  }
  if (shape === 'grid') {
    const [rows, cols] = { 4: [2, 2], 6: [2, 3], 8: [2, 4], 9: [3, 3], 10: [2, 5], 12: [3, 4], 16: [4, 4] }[n];
    const cw = 56, ch = 56;
    for (let i = 0; i < n; i++) {
      const x = 10 + (i % cols) * cw, y = 10 + Math.floor(i / cols) * ch;
      s += `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" fill="${fill(i)}" stroke="${C.line}" stroke-width="2.5"/>`;
    }
    return fig.raw(cols * cw + 20, rows * ch + 20, s);
  }
  const W = 360, H = 70, w = W / n;
  for (let i = 0; i < n; i++) s += `<rect x="${(10 + i * w).toFixed(1)}" y="10" width="${w.toFixed(1)}" height="${H}" fill="${fill(i)}" stroke="${C.line}" stroke-width="2.5"/>`;
  return fig.raw(W + 20, H + 20, s);
}

/** 几行物品（看图求倍数）：rows = [[名称, emoji, 个数], ...] */
function rowsFig(rows, { size = 30, perLine = 10 } = {}) {
  let s = '', y = 8;
  for (const [label, emoji, n] of rows) {
    const lines = Math.ceil(n / perLine);
    s += fig.text(52, y + (lines * (size + 4)) / 2, label, { anchor: 'end', size: 16 });
    for (let i = 0; i < n; i++) s += fig.text(70 + (i % perLine) * (size + 4) + size / 2, y + Math.floor(i / perLine) * (size + 4) + size / 2 + 2, emoji, { size: size * 0.85 });
    y += lines * (size + 4) + 12;
  }
  const maxN = Math.min(perLine, Math.max(...rows.map((x) => x[2])));
  return fig.raw(80 + maxN * (size + 4), y, s);
}

/** 韦恩图：a、b 是两个圈的说明，both 是重叠部分的文字，all 是外框说明（可选） */
function venn(a, b, both, all = '') {
  const top = all ? 30 : 0;
  let s = '';
  if (all) s += `<rect x="6" y="6" width="408" height="${226 + top - 12}" rx="14" fill="#fafbff" stroke="${C.dash}" stroke-width="2"/>` + fig.text(20, 24, all, { anchor: 'start', size: 15 });
  s += `<circle cx="160" cy="${130 + top}" r="88" fill="#7fb2ff" fill-opacity="0.35" stroke="${C.line}" stroke-width="2.5"/>`;
  s += `<circle cx="260" cy="${130 + top}" r="88" fill="${SHADE}" fill-opacity="0.45" stroke="${C.line}" stroke-width="2.5"/>`;
  s += fig.text(120, 26 + top, a, { size: 15 }) + fig.text(300, 26 + top, b, { size: 15 });
  s += fig.text(210, 130 + top, both, { size: 15, weight: 'bold' });
  return fig.raw(420, 226 + top, s);
}

/** 方向地图：places = {北:'图书馆', 东南:'超市', ...}，中间是 center */
const DIR_POS = { 西北: [0, 0], 北: [1, 0], 东北: [2, 0], 西: [0, 1], 东: [2, 1], 西南: [0, 2], 南: [1, 2], 东南: [2, 2] };
function mapFig(center, places) {
  const cw = 112, ch = 64, ox = 12, oy = 40;
  let s = `<line x1="${ox + 3 * cw + 30}" y1="70" x2="${ox + 3 * cw + 30}" y2="30" stroke="${C.acc}" stroke-width="3"/><path d="M${ox + 3 * cw + 30},22 l-7,12 l14,0 z" fill="${C.acc}"/>` + fig.text(ox + 3 * cw + 30, 84, '北', { size: 16, weight: 'bold', color: C.acc });
  const box = (col, row, label, main) => {
    const x = ox + col * cw + 8, y = oy + row * ch + 8;
    return `<rect x="${x}" y="${y}" width="${cw - 16}" height="${ch - 16}" rx="10" fill="${main ? SHADE : C.fill}" stroke="${C.line}" stroke-width="2"/>` + fig.text(x + (cw - 16) / 2, y + (ch - 16) / 2 + 1, label, { size: 16, weight: main ? 'bold' : 'normal' });
  };
  s += box(1, 1, center, true);
  for (const [d, label] of Object.entries(places)) s += box(...DIR_POS[d], label, false);
  return fig.raw(ox + 3 * cw + 60, oy + 3 * ch + 10, s);
}

/** 统计表：head 第一行（含左上角），rows 每行 [名称, 数...] */
function tableFig(title, head, rows) {
  const w0 = 120, w = 90, h = 40, cols = head.length, W = w0 + (cols - 1) * w + 20, top = 40;
  let s = fig.text(W / 2, 20, title, { size: 17, weight: 'bold' });
  const all = [head, ...rows];
  all.forEach((row, i) => {
    row.forEach((cell, j) => {
      const x = 10 + (j ? w0 + (j - 1) * w : 0), y = top + i * h, cw = j ? w : w0;
      s += `<rect x="${x}" y="${y}" width="${cw}" height="${h}" fill="${i === 0 || j === 0 ? C.fill : '#fff'}" stroke="${C.line}" stroke-width="1.5"/>`;
      s += fig.text(x + cw / 2, y + h / 2 + 1, String(cell), { size: 16, weight: i === 0 ? 'bold' : 'normal' });
    });
  });
  return fig.raw(W, top + all.length * h + 10, s);
}

/** 方格图：cells = [[行, 列], ...]，每格代表 1 平方厘米 */
function gridFig(rows, cols, cells) {
  const u = 34, on = new Set(cells.map(([r, c]) => r * 100 + c));
  let s = '';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) s += `<rect x="${10 + c * u}" y="${10 + r * u}" width="${u}" height="${u}" fill="${on.has(r * 100 + c) ? SHADE : '#fff'}" stroke="${on.has(r * 100 + c) ? C.line : '#c5cede'}" stroke-width="${on.has(r * 100 + c) ? 2 : 1}"/>`;
  return fig.raw(cols * u + 20, rows * u + 20, s);
}

/**
 * 多边形（真实单位坐标，y 向上）。和 lib 的 fig.poly 用法一样，区别是边上的文字按边的朝向对齐：
 * 竖边的文字左对齐 / 右对齐贴在边外侧，不会压到线上；凹多边形也按顶点顺序判断外侧。
 */
function shape(pts, { edgeLabels = [], dashed = [], W = 420, H = 260, padX = 76, padY = 34, fill = C.fill } = {}) {
  const all = [...pts, ...dashed.flat()];
  const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const k = Math.min((W - 2 * padX) / (maxX - minX || 1), (H - 2 * padY) / (maxY - minY || 1));
  const ox = (W - (maxX - minX) * k) / 2, oy = (H - (maxY - minY) * k) / 2;
  const f = ([x, y]) => [ox + (x - minX) * k, H - (oy + (y - minY) * k)];
  let area = 0;
  pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; area += p[0] * q[1] - q[0] * p[1]; });
  let s = `<polygon points="${pts.map(f).map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')}" fill="${fill}" stroke="${C.line}" stroke-width="3" stroke-linejoin="round"/>`;
  for (const [a, b] of dashed) { const [x1, y1] = f(a), [x2, y2] = f(b); s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${C.dash}" stroke-width="2" stroke-dasharray="6 5"/>`; }
  pts.forEach((p, i) => {
    const lab = edgeLabels[i];
    if (!lab) return;
    const q = pts[(i + 1) % pts.length];
    let nx = q[1] - p[1], ny = p[0] - q[0];
    if (area < 0) { nx = -nx; ny = -ny; }
    const len = Math.hypot(nx, ny) || 1;
    nx /= len; ny /= len;
    const [mx, my] = f([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]);
    s += Math.abs(nx) > Math.abs(ny) ? fig.text(mx + nx * 8, my, lab, { anchor: nx > 0 ? 'start' : 'end' }) : fig.text(mx, my - ny * 16, lab);
  });
  return fig.raw(W, H, s);
}

/** 长方形，边上的文字自己定（可以写 ?） */
const rectFig = (w, h, labW, labH) => {
  const ratio = Math.max(0.4, Math.min(2.6, w / h));
  return shape([[0, 0], [ratio, 0], [ratio, 1], [0, 1]], { edgeLabels: [labW, labH] });
};

// ================= 上册 =================
const TERM1_A = [
  // ---------- 时、分、秒 ----------
  {
    id: 'g3a-time-convert', grade: 3, term: 1, unit: '时、分、秒', name: '时、分、秒的换算',
    tip: '1 时 = 60 分，1 分 = 60 秒：大单位化小单位乘 60，小单位化大单位想里面有几个 60', level: 1, speed: 8,
    gen(r) {
      const k = r.int(2, 9);
      const t = r.pick([
        { q: `${k} 时 = {0} 分`, a: k * 60, s: [`1 时 = 60 分，${k} 时就是 ${k} 个 60 分`, `60 × ${k} = ${k * 60}，所以 ${k} 时 = ${k * 60} 分`] },
        { q: `${k} 分 = {0} 秒`, a: k * 60, s: [`1 分 = 60 秒，${k} 分就是 ${k} 个 60 秒`, `60 × ${k} = ${k * 60}，所以 ${k} 分 = ${k * 60} 秒`] },
        { q: `${k * 60} 分 = {0} 时`, a: k, s: [`60 分 = 1 时，想：${k * 60} 里面有几个 60？`, `60 × ${k} = ${k * 60}，所以 ${k * 60} 分 = ${k} 时`] },
        { q: `${k * 60} 秒 = {0} 分`, a: k, s: [`60 秒 = 1 分，想：${k * 60} 里面有几个 60？`, `60 × ${k} = ${k * 60}，所以 ${k * 60} 秒 = ${k} 分`] },
      ]);
      return { q: t.q, answer: [num(t.a)], steps: t.s, hint: '先想：1 时等于多少分？1 分等于多少秒？' };
    },
  },
  {
    id: 'g3a-time-compound', grade: 3, term: 1, unit: '时、分、秒', name: '几时几分化成分（复名数）',
    tip: '先把“时”化成“分”（× 60），再加上后面的分；反过来就看里面有几个 60', level: 2,
    gen(r) {
      const [B, S] = r.bool() ? ['时', '分'] : ['分', '秒'];
      const a = r.int(1, 3), b = r.int(1, 59), t = a * 60 + b;
      if (r.bool()) {
        return {
          q: `${a} ${B} ${b} ${S} = {0} ${S}`,
          answer: [num(t)],
          steps: [`先把 ${a} ${B}化成${S}：${a} ${B} = ${a * 60} ${S}`, `再加上 ${b} ${S}：${a * 60} + ${b} = ${t}`, `所以 ${a} ${B} ${b} ${S} = ${t} ${S}`],
          hint: `1 ${B} = 60 ${S}`,
        };
      }
      return {
        q: `${t} ${S} = {0} ${B} {1} ${S}`,
        answer: [num(a), num(b)],
        steps: [`60 ${S} = 1 ${B}，想 ${t} 里面最多有几个 60`, `60 × ${a} = ${a * 60}，${t} − ${a * 60} = ${b}`, `${t} ${S}就是 ${a} 个 60 ${S}再多 ${b} ${S}，也就是 ${a} ${B} ${b} ${S}`],
        hint: `60 ${S} = 1 ${B}，${t} 里面有几个 60？`,
      };
    },
  },
  {
    id: 'g3a-time-compare', grade: 3, term: 1, unit: '时、分、秒', name: '时间的大小比较',
    tip: '单位不同不能直接比，先化成同一个单位再比', level: 1, speed: 10,
    gen(r) {
      const [B, S] = r.bool() ? ['时', '分'] : ['分', '秒'];
      const a = r.int(1, 4), b = r.chance(0.5) ? r.step(5, 55, 5) : 0, left = a * 60 + b;
      const right = r.chance(0.3) ? left : left + r.pick([-20, -10, -5, -1, 1, 5, 10, 20]);
      const L = b ? `${a} ${B} ${b} ${S}` : `${a} ${B}`;
      const swap = r.bool();
      const v = swap ? sign(right, left) : sign(left, right);
      return {
        q: swap ? `${right} ${S} {0} ${L}` : `${L} {0} ${right} ${S}`,
        answer: [pick(CMP, v)],
        steps: [`单位不同，先都化成${S}：${L} = ${b ? `${a * 60} + ${b} = ` : ''}${left} ${S}`, `再比 ${left} ${S}和 ${right} ${S}：${left} ${sign(left, right)} ${right}`, `所以填“${v}”`],
        hint: `1 ${B} = 60 ${S}`,
      };
    },
  },
  {
    id: 'g3a-time-unit-choice', grade: 3, term: 1, unit: '时、分、秒', name: '填合适的时间单位',
    tip: '1 秒很短，眨一下眼；1 分是 60 秒；1 时是 60 分，比一节课还长', level: 1, pool: 22,
    gen(r) {
      const n = r.name();
      const items = [
        [`${n}跑 50 米用了 9`, '秒'], ['眨一下眼睛大约用 1', '秒'], ['一节课是 40', '分'], ['看一场电影大约要 2', '时'],
        ['做一遍眼保健操大约要 5', '分'], ['小学生每天睡觉大约 10', '时'], [`${n}刷一次牙大约用 3`, '分'], ['系好红领巾大约用 20', '秒'],
        ['一场足球比赛的上下半场共 90', '分'], ['课间休息 10', '分'], ['从 1 数到 10 大约用 5', '秒'], ['一天有 24', '时'],
        ['坐飞机从北京到广州大约要 3', '时'], [`${n}吃一顿午饭大约用 20`, '分'], ['拍一下手大约用 1', '秒'], ['学校每天上午上课大约 4', '时'],
        ['写一个字大约用 4', '秒'], [`${n}读一篇短课文大约用 3`, '分'], ['唱一遍国歌大约用 46', '秒'], ['坐高铁从北京到天津大约要 30', '分'],
        [`${n}做 20 道口算题用了 2`, '分'], ['一集动画片大约播 20', '分'],
      ];
      const [q, a] = r.pick(items);
      const why = { 秒: '这件事一眨眼、一会儿就做完，用“秒”', 分: '比几秒长得多、又不到 1 时，用“分”', 时: '这件事要很长时间，用“时”' }[a];
      return {
        q: `${q}（　）。`,
        answer: [pick(['时', '分', '秒'], a)],
        steps: [`想一想 1 秒、1 分、1 时各有多长：1 秒眨一下眼，1 分是 60 秒，1 时是 60 分`, why, `所以填“${a}”`],
      };
    },
  },
  {
    id: 'g3a-time-elapsed', grade: 3, term: 1, unit: '时、分、秒', name: '求经过了多少分', process: true,
    tip: '经过时间 = 结束时刻 − 开始时刻；跨过整时的，先算到整时，再算整时以后的', level: 1,
    gen(r) {
      const n = r.name(), h = r.int(7, 10), m = r.step(0, 55, 5), d = r.step(10, 55, 5);
      const t = h * 60 + m + d, eh = Math.floor(t / 60), em = t % 60;
      const s = hm(h, m), e = hm(eh, em);
      const useFig = r.chance(0.35);
      const tpl = useFig
        ? { q: `看钟面，${n}从左边的时刻开始做手工，到右边的时刻做完。做手工用了多少分？`, ans: `${n}做手工用了 ${d} 分` }
        : r.pick([
          { q: `${n}从 ${s} 开始写作业，${e} 写完。写作业用了多少分？`, ans: `写作业用了 ${d} 分` },
          { q: `动画片 ${s} 开始，${e} 结束。这集动画片播了多少分？`, ans: `这集动画片播了 ${d} 分` },
          { q: `${n} ${s} 从家出发，${e} 到达公园。路上用了多少分？`, ans: `路上用了 ${d} 分` },
          { q: `${n}从 ${s} 开始练琴，练到 ${e}。练了多少分？`, ans: `练了 ${d} 分` },
          { q: `图书馆 ${s} 开门，${n} ${e} 才到。${n}比开门晚到了多少分？`, ans: `晚到了 ${d} 分` },
        ]);
      const steps = [`经过时间 = 结束时刻 − 开始时刻，从 ${s} 到 ${e}`];
      if (eh === h) steps.push(`都在 ${h} 时多，分针从 ${m} 分走到 ${em} 分`, `${em} − ${m} = ${d}（分）`);
      else if (em === 0) steps.push(`从 ${s} 到 ${e} 正好走到整时，60 − ${m} = ${d}（分）`);
      else steps.push(`先算从 ${s} 到 ${hm(eh, 0)}：60 − ${m} = ${60 - m}（分）`, `再算从 ${hm(eh, 0)} 到 ${e}：${em} 分`, `合起来：${60 - m} + ${em} = ${d}（分）`);
      steps.push(`答：${tpl.ans}。`);
      return { q: tpl.q, fig: useFig ? clock2([h, m], [eh, em]) : undefined, answer: [num(d, { unit: '分' })], steps, hint: '跨过整时了吗？可以先算到整时。' };
    },
  },
  {
    id: 'g3a-time-elapsed-long', grade: 3, term: 1, unit: '时、分、秒', name: '求经过了几时几分', process: true,
    tip: '时减时、分减分；分不够减，就从时里借 1 时当 60 分', level: 2,
    gen(r) {
      const n = r.name();
      const [h, m, d] = r.until(() => [r.int(7, 9), r.step(0, 55, 5), r.step(65, 170, 5)], ([h0, m0, d0]) => h0 * 60 + m0 + d0 < 12 * 60 && d0 % 60 !== 0);
      const t = h * 60 + m + d, eh = Math.floor(t / 60), em = t % 60, dh = Math.floor(d / 60), dm = d % 60;
      const s = hm(h, m), e = hm(eh, em);
      const tpl = r.pick([
        `电影上午 ${s} 开始，${e} 结束。这场电影放映了多长时间？`,
        `${n}上午 ${s} 进入动物园，${e} 出来。在动物园玩了多长时间？`,
        `运动会上午 ${s} 开幕，${e} 结束。运动会进行了多长时间？`,
        `一列火车上午 ${s} 从北京开出，${e} 到达天津。火车行驶了多长时间？`,
        `${n}上午 ${s} 开始爬山，${e} 爬到山顶。爬山用了多长时间？`,
      ]);
      const steps = [`经过时间 = 结束时刻 − 开始时刻：${eh} 时 ${em} 分 − ${h} 时 ${m} 分`];
      if (em >= m) steps.push(`分减分：${em} − ${m} = ${dm}（分）`, `时减时：${eh} − ${h} = ${dh}（时）`);
      else steps.push(`分减分：${em} 分减 ${m} 分不够减，从 ${eh} 时里借 1 时，就是 60 分：${em} + 60 − ${m} = ${dm}（分）`, `时减时：${eh} 时借走 1 时还剩 ${eh - 1} 时，${eh - 1} − ${h} = ${dh}（时）`);
      steps.push(`答：用了 ${dh} 时 ${dm} 分。`);
      return { q: tpl, answer: [num(dh, { unit: '时' }), num(dm, { unit: '分' })], steps, hint: '分不够减怎么办？1 时 = 60 分。' };
    },
  },
  {
    id: 'g3a-time-end', grade: 3, term: 1, unit: '时、分、秒', name: '求结束时刻', process: true,
    tip: '开始时刻 + 经过时间 = 结束时刻；分加起来满 60 就进 1 时', level: 2,
    gen(r) {
      const n = r.name();
      const pm = r.bool();
      const [h, m, d] = r.until(() => [pm ? r.int(1, 4) : r.int(7, 10), r.step(0, 55, 5), r.step(15, 100, 5)], ([h0, m0, d0]) => h0 * 60 + m0 + d0 < (pm ? 6 : 12) * 60 && (m0 + d0) % 60 !== 0);
      const t = h * 60 + m + d, eh = Math.floor(t / 60), em = t % 60;
      const dText = d < 60 || r.bool() ? `${d} 分` : d === 60 ? '1 时' : `1 时 ${d - 60} 分`;
      const ap = pm ? '下午' : '上午';
      const tpl = r.pick([
        `一场电影${ap} ${hm(h, m)} 开始，放映了 ${dText}。电影几时几分结束？`,
        `${n}${ap} ${hm(h, m)} 开始做作业，做了 ${dText}。${n}几时几分做完？`,
        `一场篮球比赛${ap} ${hm(h, m)} 开始，比了 ${dText}。比赛几时几分结束？`,
        `${n}${ap} ${hm(h, m)} 从家出发去姥姥家，路上走了 ${dText}。几时几分到姥姥家？`,
        `面包店${ap} ${hm(h, m)} 把面包放进烤箱，要烤 ${dText}。几时几分能烤好？`,
      ]);
      const steps = ['开始时刻 + 经过时间 = 结束时刻'];
      if (dText !== `${d} 分`) steps.push(`${dText} = ${d} 分`);
      steps.push(`分加分：${m} + ${d} = ${m + d}（分）`);
      if (m + d >= 60) steps.push(`${m + d} 分 = ${Math.floor((m + d) / 60)} 时 ${(m + d) % 60} 分，向“时”进 ${Math.floor((m + d) / 60)}：${h} + ${Math.floor((m + d) / 60)} = ${eh}（时）`);
      steps.push(`答：${ap} ${hm(eh, em)}，也就是 ${eh} 时 ${em} 分。`);
      return { q: tpl, answer: [num(eh, { unit: '时' }), num(em, { unit: '分' })], steps, hint: '分加起来满 60 了吗？' };
    },
  },
  {
    id: 'g3a-time-start', grade: 3, term: 1, unit: '时、分、秒', name: '求开始时刻', process: true,
    tip: '开始时刻 = 结束时刻 − 经过时间，可以先往前推到整时', level: 2,
    gen(r) {
      const n = r.name();
      const pm = r.bool();
      const [eh, em, d] = r.until(() => [pm ? r.int(2, 5) : r.int(8, 11), r.step(0, 55, 5), r.step(15, 100, 5)], ([h0, m0, d0]) => h0 * 60 + m0 - d0 >= (pm ? 1 : 7) * 60 && (m0 - d0) % 60 !== 0);
      const t = eh * 60 + em - d, h = Math.floor(t / 60), m = t % 60;
      const ap = pm ? '下午' : '上午';
      const tpl = r.pick([
        `一节美术课上了 ${d} 分，${ap} ${hm(eh, em)} 下课。这节课几时几分开始？`,
        `${n}从家走到学校用了 ${d} 分，${ap} ${hm(eh, em)} 到学校。${n}几时几分从家出发？`,
        `一场电影放了 ${d} 分，${ap} ${hm(eh, em)} 结束。电影几时几分开始？`,
        `${n}看书看了 ${d} 分，${ap} ${hm(eh, em)} 合上了书。${n}几时几分开始看书？`,
        `妈妈炖汤用了 ${d} 分，${ap} ${hm(eh, em)} 炖好。几时几分开始炖的？`,
      ]);
      const steps = ['开始时刻 = 结束时刻 − 经过时间', `从 ${hm(eh, em)} 往前推 ${d} 分`];
      if (d <= em) steps.push(`${em} − ${d} = ${em - d}，还在 ${eh} 时多：${hm(h, m)}`);
      else {
        const rest = d - em;
        if (em) steps.push(`先往前推 ${em} 分，到 ${hm(eh, 0)}，还要再推 ${d} − ${em} = ${rest} 分`);
        else steps.push(`${hm(eh, 0)} 是整时，往前推 ${rest} 分`);
        if (rest < 60) steps.push(`${hm(eh, 0)} 往前 ${rest} 分：60 − ${rest} = ${60 - rest}，是 ${hm(h, m)}`);
        else steps.push(`${rest} 分 = 1 时 ${rest - 60} 分，往前 1 时到 ${hm(eh - 1, 0)}，再往前 ${rest - 60} 分是 ${hm(h, m)}`);
      }
      steps.push(`答：${ap} ${hm(h, m)}，也就是 ${h} 时 ${m} 分。`);
      return { q: tpl, answer: [num(h, { unit: '时' }), num(m, { unit: '分' })], steps, hint: '先往前推到整时，再继续推。' };
    },
  },

  // ---------- 万以内的加法和减法（一） ----------
  {
    id: 'g3a-oral-add-2d', grade: 3, term: 1, unit: '万以内的加法和减法（一）', name: '两位数加两位数（口算进位）',
    tip: '把第二个数拆成整十数和一位数，先加整十，再加一位数', level: 1, speed: 8,
    gen(r) {
      const [a, b] = r.until(() => [r.int(11, 89), r.int(11, 89)], ([x, y]) => (x % 10) + (y % 10) >= 10 && x + y <= 140);
      const tb = b - (b % 10), ob = b % 10;
      return {
        q: `${a} + ${b} = {0}`,
        answer: [num(a + b)],
        steps: [`把 ${b} 分成 ${tb} 和 ${ob}`, `先算 ${a} + ${tb} = ${a + tb}`, `再算 ${a + tb} + ${ob} = ${a + b}`, `个位 ${a % 10} + ${ob} 满十了，别忘了向十位进 1`],
        hint: `先加 ${tb}，再加 ${ob}`,
      };
    },
  },
  {
    id: 'g3a-oral-sub-2d', grade: 3, term: 1, unit: '万以内的加法和减法（一）', name: '两位数减两位数（口算退位）',
    tip: '先减整十数，再减一位数；个位不够减要退位', level: 1, speed: 8,
    gen(r) {
      const [a, b] = r.until(() => [r.int(31, 99), r.int(12, 89)], ([x, y]) => x > y + 5 && x % 10 < y % 10);
      const tb = b - (b % 10), ob = b % 10;
      return {
        q: `${a} − ${b} = {0}`,
        answer: [num(a - b)],
        steps: [`把 ${b} 分成 ${tb} 和 ${ob}`, `先减整十：${a} − ${tb} = ${a - tb}`, `再减 ${ob}：${a - tb} − ${ob} = ${a - b}`],
        hint: `先算 ${a} − ${tb}`,
      };
    },
  },
  {
    id: 'g3a-oral-hund-simple', grade: 3, term: 1, unit: '万以内的加法和减法（一）', name: '几百几十加减几百几十',
    tip: '把几百几十看成几十个十来算：340 + 250 → 34 个十 + 25 个十', level: 1, speed: 6,
    gen(r) {
      const add = r.bool();
      const [a, b] = r.until(() => [r.int(11, 98) * 10, r.int(11, 98) * 10], ([x, y]) => x % 100 && y % 100 && (add ? (x % 100) + (y % 100) < 100 && x + y < 1000 : x > y && x % 100 >= y % 100));
      const res = add ? a + b : a - b, op = add ? '+' : '−';
      return {
        q: `${a} ${op} ${b} = {0}`,
        answer: [num(res)],
        steps: [`${a} 是 ${a / 10} 个十，${b} 是 ${b / 10} 个十`, `${a / 10} ${op} ${b / 10} = ${res / 10}，${res / 10} 个十就是 ${res}`, `也可以百位和百位${add ? '加' : '减'}、十位和十位${add ? '加' : '减'}`],
        hint: '想成几十个十来算',
      };
    },
  },
  {
    id: 'g3a-oral-hund-add', grade: 3, term: 1, unit: '万以内的加法和减法（一）', name: '几百几十加几百几十（进位）',
    tip: '十位相加满十，要向百位进 1：380 + 450 → 38 个十 + 45 个十 = 83 个十', level: 1, speed: 8,
    gen(r) {
      const [a, b] = r.until(() => [r.int(11, 98) * 10, r.int(11, 98) * 10], ([x, y]) => x % 100 && y % 100 && (x % 100) + (y % 100) >= 100 && x + y <= 1500);
      const ha = a - (a % 100), hb = b - (b % 100), ta = a % 100, tb = b % 100;
      return {
        q: `${a} + ${b} = {0}`,
        answer: [num(a + b)],
        steps: [`分开算：${ha} + ${hb} = ${ha + hb}，${ta} + ${tb} = ${ta + tb}`, `再合起来：${ha + hb} + ${ta + tb} = ${a + b}`, `十位 ${ta / 10} + ${tb / 10} 满十，要向百位进 1`],
        hint: '先把整百的加一加，再把整十的加一加',
      };
    },
  },
  {
    id: 'g3a-oral-hund-sub', grade: 3, term: 1, unit: '万以内的加法和减法（一）', name: '几百几十减几百几十（退位）',
    tip: '先减整百数，再减整十数：830 − 450 → 830 − 400 − 50', level: 1, speed: 8,
    gen(r) {
      const [a, b] = r.until(() => [r.int(21, 99) * 10, r.int(11, 89) * 10], ([x, y]) => x % 100 && y % 100 && x > y + 50 && x % 100 < y % 100);
      const hb = b - (b % 100), tb = b % 100;
      return {
        q: `${a} − ${b} = {0}`,
        answer: [num(a - b)],
        steps: [`先减整百：${a} − ${hb} = ${a - hb}`, `再减整十：${a - hb} − ${tb} = ${a - b}`, `十位 ${(a % 100) / 10} 减 ${tb / 10} 不够减，要从百位退 1`],
        hint: `先算 ${a} − ${hb}`,
      };
    },
  },

  // ---------- 测量 ----------
  {
    id: 'g3a-len-convert', grade: 3, term: 1, unit: '测量', name: '长度单位换算',
    tip: '1 厘米 = 10 毫米，1 分米 = 10 厘米，1 米 = 10 分米 = 100 厘米，1 千米 = 1000 米', level: 1, speed: 8,
    gen(r) {
      const [B, S, k] = r.pick([['厘米', '毫米', 10], ['分米', '厘米', 10], ['米', '分米', 10], ['米', '厘米', 100], ['千米', '米', 1000], ['分米', '毫米', 100]]);
      const a = r.int(2, 9);
      if (r.bool()) {
        return { q: `${a} ${B} = {0} ${S}`, answer: [num(a * k)], steps: [`1 ${B} = ${k} ${S}`, `${a} ${B}就是 ${a} 个 ${k} ${S}：${k} × ${a} = ${a * k}`, `大单位化小单位，数变大`], hint: `1 ${B}等于多少${S}？` };
      }
      return { q: `${a * k} ${S} = {0} ${B}`, answer: [num(a)], steps: [`${k} ${S} = 1 ${B}`, `${a * k} 里面有 ${a} 个 ${k}，所以是 ${a} ${B}`, `小单位化大单位，数变小`], hint: `几${S}是 1 ${B}？` };
    },
  },
  {
    id: 'g3a-mass-convert', grade: 3, term: 1, unit: '测量', name: '吨和千克的换算',
    tip: '1 吨 = 1000 千克，1 千克 = 1000 克', level: 1, speed: 8,
    gen(r) {
      const [B, S] = r.chance(0.7) ? ['吨', '千克'] : ['千克', '克'];
      const a = r.int(2, 9);
      if (r.bool()) return { q: `${a} ${B} = {0} ${S}`, answer: [num(a * 1000)], steps: [`1 ${B} = 1000 ${S}`, `${a} ${B}就是 ${a} 个 1000 ${S}，是 ${a * 1000} ${S}`], hint: `1 ${B}等于多少${S}？` };
      return { q: `${a * 1000} ${S} = {0} ${B}`, answer: [num(a)], steps: [`1000 ${S} = 1 ${B}`, `${a * 1000} 里面有 ${a} 个 1000，所以是 ${a} ${B}`], hint: `几${S}是 1 ${B}？` };
    },
  },
  {
    id: 'g3a-unit-choice', grade: 3, term: 1, unit: '测量', name: '填合适的长度、质量单位',
    tip: '先想是量长短还是称轻重，再拿身边熟悉的东西比一比', level: 1, pool: 30,
    gen(r) {
      const L = ['毫米', '厘米', '分米', '米', '千米'], M = ['克', '千克', '吨'];
      const items = [
        ['一枚 1 元硬币厚约 2', '毫米', '硬币很薄，比 1 厘米小得多'], ['一只蚂蚁长约 4', '毫米', '蚂蚁很小，不到 1 厘米'], ['一张银行卡厚约 1', '毫米', '银行卡很薄，大约 1 毫米'],
        ['一支新铅笔长约 18', '厘米', '铅笔比手掌长一些，用厘米'], ['一块橡皮长约 4', '厘米', '橡皮大约 4 个指甲宽'], ['数学书长约 26', '厘米', '比一把尺子还长一点，用厘米'], ['一枚回形针长约 3', '厘米', '回形针比手指还短'],
        ['课桌高约 7', '分米', '7 厘米太矮、7 米太高，7 分米正好到大腿'], ['小明身高约 13', '分米', '13 分米 = 130 厘米，是三年级同学的身高'], ['一张单人床宽约 9', '分米', '9 分米 = 90 厘米，不到 1 米'],
        ['教室门高约 2', '米', '门比大人还高，用米'], ['黑板长约 4', '米', '黑板很长，用米'], ['一根跳绳长约 2', '米', '跳绳要比身高长一些'], ['一栋 10 层楼高约 30', '米', '一层楼大约 3 米'],
        ['北京到天津的路程约 120', '千米', '两个城市之间很远，用千米'], ['长江全长约 6300', '千米', '河流非常长，用千米'], ['高铁每小时约行 300', '千米', '火车一小时走很远，用千米'], ['爸爸每天开车上班大约行 15', '千米', '开车上班的路很长，用千米'],
        ['一个鸡蛋重约 50', '克', '鸡蛋很轻，用克'], ['一个苹果重约 200', '克', '一个苹果不到 1 千克'], ['一枚 1 元硬币重约 6', '克', '硬币很轻'], ['一块橡皮重约 10', '克', '橡皮很轻'],
        ['一个西瓜重约 4', '千克', '西瓜要两只手抱，用千克'], ['一袋大米重 10', '千克', '大米按千克卖'], ['三年级同学的体重约 30', '千克', '人的体重用千克'], ['一只鸡重约 2', '千克', '一只鸡比一袋盐重得多'], ['一桶食用油重约 5', '千克', '一桶油要用千克'],
        ['一头大象重约 5', '吨', '大象非常重，用吨'], ['一辆大卡车能装货物 8', '吨', '卡车装的货很重，用吨'], ['一头蓝鲸重约 150', '吨', '蓝鲸是最重的动物，用吨'],
      ];
      const [q, a, why] = r.pick(items);
      const opts = L.includes(a) ? L : M;
      return { q: `${q}（　）。`, answer: [pick(opts, a)], steps: [L.includes(a) ? '这是量长短，用长度单位' : '这是称轻重，用质量单位', why, `所以填“${a}”`] };
    },
  },
  {
    id: 'g3a-measure-to-single', grade: 3, term: 1, unit: '测量', name: '复名数化成单名数',
    tip: '先把大单位化成小单位，再加上后面的数：3 千米 50 米 = 3000 米 + 50 米', level: 2,
    gen(r) {
      const [B, S, k] = r.pick([['千米', '米', 1000], ['吨', '千克', 1000], ['米', '厘米', 100], ['分米', '厘米', 10], ['厘米', '毫米', 10], ['米', '分米', 10]]);
      const a = r.int(1, 9), b = k === 1000 ? r.pick([r.int(1, 99), r.step(100, 900, 10), r.step(100, 900, 100)]) : r.int(1, k - 1);
      const t = a * k + b;
      const steps = [`先把 ${a} ${B}化成${S}：${a} ${B} = ${a * k} ${S}`, `再加上 ${b} ${S}：${a * k} + ${b} = ${t}（${S}）`];
      if (k === 1000 && b < 100) steps.push(`注意 ${b} 不满一百，空着的数位要写 0 占位，不能写成 ${a}${b}`);
      return { q: `${a} ${B} ${b} ${S} = {0} ${S}`, answer: [num(t)], steps, hint: `1 ${B} = ${k} ${S}` };
    },
  },
  {
    id: 'g3a-measure-to-compound', grade: 3, term: 1, unit: '测量', name: '单名数化成复名数',
    tip: '看里面有几个进率（1000、100 或 10），就是几个大单位，剩下的是小单位', level: 2,
    gen(r) {
      const [B, S, k] = r.pick([['千米', '米', 1000], ['吨', '千克', 1000], ['米', '厘米', 100], ['分米', '厘米', 10], ['厘米', '毫米', 10]]);
      const a = r.int(1, 9), b = k === 1000 ? r.pick([r.int(1, 99), r.step(100, 900, 10)]) : r.int(1, k - 1), t = a * k + b;
      return {
        q: `${t} ${S} = {0} ${B} {1} ${S}`,
        answer: [num(a), num(b)],
        steps: [`${k} ${S} = 1 ${B}`, `${t} 里面有 ${a} 个 ${k}，是 ${a} ${B}`, `还剩 ${t} − ${a * k} = ${b}（${S}）`, `所以 ${t} ${S} = ${a} ${B} ${b} ${S}`],
        hint: `${t} 里面有几个 ${k}？`,
      };
    },
  },
  {
    id: 'g3a-measure-compare', grade: 3, term: 1, unit: '测量', name: '带单位的数比大小',
    tip: '先把单位统一（一般化成小单位），再比数的大小', level: 1, speed: 10,
    gen(r) {
      const [B, S, k] = r.pick([['千米', '米', 1000], ['吨', '千克', 1000], ['千克', '克', 1000], ['米', '厘米', 100], ['分米', '厘米', 10], ['厘米', '毫米', 10], ['米', '分米', 10]]);
      const a = r.int(2, 9), big = a * k;
      const delta = r.chance(0.3) ? 0 : r.pick(k === 1000 ? [-100, -10, -1, 1, 10, 100] : k === 100 ? [-10, -1, 1, 10] : [-2, -1, 1, 2]);
      const small = big + delta, swap = r.bool();
      const v = swap ? sign(small, big) : sign(big, small);
      return {
        q: swap ? `${small} ${S} {0} ${a} ${B}` : `${a} ${B} {0} ${small} ${S}`,
        answer: [pick(CMP, v)],
        steps: [`单位不同，先统一成${S}：${a} ${B} = ${big} ${S}`, swap ? `${small} ${S}和 ${big} ${S}比：${small} ${v} ${big}` : `${big} ${S}和 ${small} ${S}比：${big} ${v} ${small}`, `所以填“${v}”`],
        hint: `1 ${B} = ${k} ${S}`,
      };
    },
  },
  {
    id: 'g3a-measure-calc', grade: 3, term: 1, unit: '测量', name: '带单位的加减计算',
    tip: '单位不同先化成相同单位再算，最后看清要用什么单位写得数', level: 2,
    gen(r) {
      const t = r.int(0, 5);
      if (t === 0) { const a = r.step(100, 900, 100), b = r.int(1, 4) * 1000 - a; return { q: `${a} 千克 + ${b} 千克 = {0} 吨`, answer: [num((a + b) / 1000)], steps: [`先算 ${a} + ${b} = ${a + b}（千克）`, `${a + b} 千克 = ${(a + b) / 1000} 吨`], hint: '1000 千克 = 1 吨' }; }
      if (t === 1) { const a = r.int(1, 5), b = r.step(100, 900, 50); return { q: `${a} 千米 − ${b} 米 = {0} 米`, answer: [num(a * 1000 - b)], steps: [`单位不同，先化成米：${a} 千米 = ${a * 1000} 米`, `${a * 1000} − ${b} = ${a * 1000 - b}（米）`], hint: '1 千米 = 1000 米' }; }
      if (t === 2) { const a = r.int(2, 8), b = r.int(11, 49); return { q: `${a} 分米 + ${b} 厘米 = {0} 厘米`, answer: [num(a * 10 + b)], steps: [`先化成厘米：${a} 分米 = ${a * 10} 厘米`, `${a * 10} + ${b} = ${a * 10 + b}（厘米）`], hint: '1 分米 = 10 厘米' }; }
      if (t === 3) { const a = r.int(2, 9), b = r.step(100, 900, 100); return { q: `${a} 吨 − ${b} 千克 = {0} 千克`, answer: [num(a * 1000 - b)], steps: [`先化成千克：${a} 吨 = ${a * 1000} 千克`, `${a * 1000} − ${b} = ${a * 1000 - b}（千克）`], hint: '1 吨 = 1000 千克' }; }
      if (t === 4) { const a = r.int(11, 89), b = (Math.floor(a / 10) + 1) * 10 - a + 10 * r.int(0, 3); return { q: `${a} 毫米 + ${b} 毫米 = {0} 厘米`, answer: [num((a + b) / 10)], steps: [`先算 ${a} + ${b} = ${a + b}（毫米）`, `${a + b} 毫米 = ${(a + b) / 10} 厘米`], hint: '10 毫米 = 1 厘米' }; }
      const a = r.step(10, 90, 10), b = 10 - a / 10;
      return { q: `${a} 厘米 + ${b} 分米 = {0} 米`, answer: [num(1)], steps: [`先都化成厘米：${b} 分米 = ${b * 10} 厘米`, `${a} + ${b * 10} = 100（厘米）`, '100 厘米 = 1 米'], hint: '1 米 = 100 厘米' };
    },
  },
  {
    id: 'g3a-measure-word', grade: 3, term: 1, unit: '测量', name: '测量解决问题', process: true,
    tip: '先看单位是否相同，不同就先换算，再按数量关系列式', level: 2,
    gen(r) {
      const n = r.name(), t = r.int(0, 5);
      if (t === 0) { const k = r.int(1, 7); return { q: `${n}要跑 3 千米，操场跑道一圈 400 米，已经跑了 ${k} 圈。还要跑多少米？`, answer: [num(3000 - 400 * k, { unit: '米' })], steps: [`单位不同，3 千米 = 3000 米`, `已经跑了：400 × ${k} = ${400 * k}（米）`, `还要跑：3000 − ${400 * k} = ${3000 - 400 * k}（米）`, `答：还要跑 ${3000 - 400 * k} 米。`] }; }
      if (t === 1) { const a = r.int(2, 8), b = r.step(300, a * 1000 - 100, 100); return { q: `一辆货车最多能装 ${a} 吨货物，现在已经装了 ${b} 千克。还能再装多少千克？`, answer: [num(a * 1000 - b, { unit: '千克' })], steps: [`单位不同，${a} 吨 = ${a * 1000} 千克`, `还能装的 = 最多能装的 − 已经装的`, `${a * 1000} − ${b} = ${a * 1000 - b}（千克）`, `答：还能再装 ${a * 1000 - b} 千克。`] }; }
      if (t === 2) { const a = r.int(3, 6), b = r.step(400, 900, 50); return { q: `一头大象重 ${a} 吨，一头牛重 ${b} 千克。大象比牛重多少千克？`, answer: [num(a * 1000 - b, { unit: '千克' })], steps: [`单位不同，${a} 吨 = ${a * 1000} 千克`, `求大象比牛重多少，用减法`, `${a * 1000} − ${b} = ${a * 1000 - b}（千克）`, `答：大象比牛重 ${a * 1000 - b} 千克。`] }; }
      if (t === 3) { const a = r.int(2, 5), b = r.int(3, a * 10 - 3); return { q: `一根彩带长 ${a} 米，${n}剪下 ${b} 分米做花。还剩多少分米？`, answer: [num(a * 10 - b, { unit: '分米' })], steps: [`单位不同，${a} 米 = ${a * 10} 分米`, `还剩 = 原来的长度 − 剪下的长度`, `${a * 10} − ${b} = ${a * 10 - b}（分米）`, `答：还剩 ${a * 10 - b} 分米。`] }; }
      if (t === 4) { const [a, b] = r.until(() => [r.step(400, 900, 10), r.step(300, 900, 10)], ([x, y]) => x + y > 1000), s = a + b; return { q: `${n}家到学校 ${a} 米，学校到图书馆 ${b} 米。${n}从家经过学校去图书馆，一共要走多少米？合几千米几米？`, answer: [num(s, { unit: '米' }), num(Math.floor(s / 1000), { unit: '千米' }), num(s % 1000, { unit: '米' })], steps: [`一共走的路 = 家到学校 + 学校到图书馆`, `${a} + ${b} = ${s}（米）`, `1000 米 = 1 千米，${s} 米 = ${Math.floor(s / 1000)} 千米 ${s % 1000} 米`, `答：一共要走 ${s} 米，合 ${Math.floor(s / 1000)} 千米 ${s % 1000} 米。`] }; }
      const a = r.int(2, 4), k = r.int(2, Math.floor(9 / a));
      return { q: `一辆卡车每次运 ${a} 吨沙子，运了 ${k} 次。一共运了多少千克沙子？`, answer: [num(a * k * 1000, { unit: '千克' })], steps: [`先算一共运了几吨：${a} × ${k} = ${a * k}（吨）`, `再化成千克：${a * k} 吨 = ${a * k * 1000} 千克`, `答：一共运了 ${a * k * 1000} 千克沙子。`] };
    },
  },
];

// 进位 / 退位检测：返回每一位是否进位（退位）
const carryCols = (a, b) => { const A = digits(a), B = digits(b), out = []; let c = 0; for (let i = 0; i < Math.max(A.length, B.length); i++) { c = (A[i] || 0) + (B[i] || 0) + c >= 10 ? 1 : 0; out.push(c); } return out; };
const borrowCols = (a, b) => { const A = digits(a), B = digits(b), out = []; let br = 0; for (let i = 0; i < A.length; i++) { br = A[i] - br < (B[i] || 0) ? 1 : 0; out.push(br); } return out; };
const mulCarryCols = (a, d) => { const A = digits(a), out = []; let c = 0; for (let i = 0; i < A.length; i++) { c = Math.floor((A[i] * d + c) / 10); out.push(c); } return out; };
const sum = (arr) => arr.reduce((x, y) => x + y, 0);
const tailZeros = (n) => { let z = 0; while (n && n % 10 === 0) { z++; n /= 10; } return z; };

const TERM1_B = [
  // ---------- 万以内的加法和减法（二） ----------
  {
    id: 'g3a-add-3d-once', grade: 3, term: 1, unit: '万以内的加法和减法（二）', name: '三位数加三位数（一次进位）',
    tip: '相同数位对齐，从个位加起，哪一位满十就向前一位进 1', level: 1,
    gen(r) {
      const [a, b] = r.until(() => [r.int(101, 799), r.int(101, 799)], ([x, y]) => sum(carryCols(x, y)) === 1 && x + y < 1000);
      return { q: `${a} + ${b} = {0}`, answer: [num(a + b)], steps: ['列竖式，相同数位对齐，从个位加起', ...addCols(a, b), vAdd(a, b), `验算：${a + b} − ${b} = ${a} ✓`], hint: '哪一位相加满十了？' };
    },
  },
  {
    id: 'g3a-add-3d-carry2', grade: 3, term: 1, unit: '万以内的加法和减法（二）', name: '三位数加法（连续进位）',
    tip: '个位满十向十位进 1，十位加的时候别忘了加上进上来的 1，再满十继续进', level: 1,
    gen(r) {
      const [a, b] = r.until(() => [r.int(105, 899), r.int(105, 899)], ([x, y]) => { const c = carryCols(x, y); return c[0] && c[1] && x + y < 2000; });
      return { q: `${a} + ${b} = {0}`, answer: [num(a + b)], steps: ['列竖式，相同数位对齐，从个位加起', ...addCols(a, b), vAdd(a, b), `验算：${a + b} − ${b} = ${a} ✓`], hint: '个位、十位都满十，进上来的 1 要记在心里' };
    },
  },
  {
    id: 'g3a-sub-3d-once', grade: 3, term: 1, unit: '万以内的加法和减法（二）', name: '三位数减三位数（一次退位）',
    tip: '哪一位不够减，就从前一位退 1 当 10，前一位别忘了减去 1', level: 1,
    gen(r) {
      const [a, b] = r.until(() => [r.int(311, 999), r.int(102, 899)], ([x, y]) => x > y + 20 && Math.floor(x / 10) % 10 > 0 && sum(borrowCols(x, y)) === 1);
      return { q: `${a} − ${b} = {0}`, answer: [num(a - b)], steps: ['列竖式，相同数位对齐，从个位减起', ...subCols(a, b), vSub(a, b), `验算：${a - b} + ${b} = ${a} ✓`], hint: '哪一位不够减？' };
    },
  },
  {
    id: 'g3a-sub-3d-borrow2', grade: 3, term: 1, unit: '万以内的加法和减法（二）', name: '三位数减法（连续退位）',
    tip: '个位不够减向十位退 1，十位被退走 1 后再不够减，继续向百位退 1', level: 1,
    gen(r) {
      const [a, b] = r.until(() => [r.int(311, 999), r.int(102, 899)], ([x, y]) => { const br = borrowCols(x, y); return x > y + 20 && Math.floor(x / 10) % 10 > 0 && br[0] && br[1]; });
      return { q: `${a} − ${b} = {0}`, answer: [num(a - b)], steps: ['列竖式，相同数位对齐，从个位减起', ...subCols(a, b), vSub(a, b), `验算：${a - b} + ${b} = ${a} ✓`], hint: '十位被个位退走 1 以后还剩几？' };
    },
  },
  {
    id: 'g3a-sub-zero-mid', grade: 3, term: 1, unit: '万以内的加法和减法（二）', name: '被减数中间有 0 的减法',
    tip: '十位是 0 不能直接退，先从百位退 1 到十位当 10，十位再退 1 给个位，十位就剩 9', level: 2,
    gen(r) {
      const [a, b] = r.until(() => [r.int(2, 9) * 100 + r.int(1, 8), r.chance(0.25) ? r.int(12, 98) : r.int(102, 899)], ([x, y]) => x > y + 20 && x % 10 < y % 10);
      return { q: `${a} − ${b} = {0}`, answer: [num(a - b)], steps: ['列竖式，从个位减起', ...subCols(a, b), vSub(a, b), `验算：${a - b} + ${b} = ${a} ✓`], hint: '个位不够减，十位却是 0，怎么办？' };
    },
  },
  {
    id: 'g3a-sub-hundreds', grade: 3, term: 1, unit: '万以内的加法和减法（二）', name: '整百数减三位数',
    tip: '被减数末尾两个 0：从百位退 1，十位当 10 再退 1 给个位，十位剩 9，个位得 10', level: 2,
    gen(r) {
      const a = r.chance(0.2) ? 1000 : r.int(2, 9) * 100;
      const b = r.until(() => r.int(101, a - 11), (y) => y % 10 !== 0 && Math.floor(y / 10) % 10 !== 0);
      return { q: `${a} − ${b} = {0}`, answer: [num(a - b)], steps: ['列竖式，从个位减起', ...subCols(a, b), vSub(a, b), `验算：${a - b} + ${b} = ${a} ✓`], hint: '个位是 0，前面也是 0，要从哪一位退？' };
    },
  },
  {
    id: 'g3a-estimate', grade: 3, term: 1, unit: '万以内的加法和减法（二）', name: '加减法估算',
    tip: '把每个数看成和它接近的整百（整十）数，再口算', level: 1, speed: 10,
    gen(r) {
      const hund = r.chance(0.7), U = hund ? 100 : 10, off = () => (r.bool() ? 1 : -1) * r.int(1, hund ? 30 : 3);
      const add = r.bool();
      const [a, b] = r.until(() => [r.int(2, 9) * U + off(), r.int(1, 8) * U + off()], ([x, y]) => Math.round(x / U) !== Math.round(y / U) && (add || x > y) && x < 10 * U && y > 0);
      const ra = Math.round(a / U) * U, rb = Math.round(b / U) * U, est = add ? ra + rb : ra - rb, op = add ? '+' : '−';
      return {
        q: `把每个数看成和它接近的整${hund ? '百' : '十'}数，估一估：\n${a} ${op} ${b} ≈ {0}`,
        answer: [num(est)],
        steps: [`${a} 接近 ${ra}，${b} 接近 ${rb}`, `${ra} ${op} ${rb} = ${est}`, `所以 ${a} ${op} ${b} ≈ ${est}（准确得数是 ${add ? a + b : a - b}，和估的差不多）`],
        hint: `${a} 离哪个整${hund ? '百' : '十'}数最近？`,
      };
    },
  },
  {
    id: 'g3a-estimate-enough', grade: 3, term: 1, unit: '万以内的加法和减法（二）', name: '估算解决问题（够不够）', process: true,
    tip: '判断够不够：往大估还不超过就够；往小估都超过了就不够', level: 2,
    gen(r) {
      const n = r.name(), ok = r.bool();
      const Hx = r.int(1, 5), Hy = r.int(1, 4), budget = (Hx + Hy) * 100;
      const x = ok ? Hx * 100 - r.int(2, 35) : Hx * 100 + r.int(2, 35), y = ok ? Hy * 100 - r.int(2, 35) : Hy * 100 + r.int(2, 35);
      const t = r.pick([
        { q: `${n}妈妈带了 ${budget} 元，想买一件 ${x} 元的上衣和一条 ${y} 元的裤子。带的钱够吗？`, o: ['够', '不够'] },
        { q: `学校礼堂有 ${budget} 个座位。三年级有 ${x} 人，四年级有 ${y} 人，两个年级一起去礼堂看演出，座位够吗？`, o: ['够', '不够'] },
        { q: `一辆货车最多能装 ${budget} 千克货物，现在有 ${x} 千克大米和 ${y} 千克面粉。能一次装完吗？`, o: ['能', '不能'] },
        { q: `图书角的书架最多能放 ${budget} 本书，已经放了 ${x} 本，又买来 ${y} 本。能放得下吗？`, o: ['能', '不能'] },
        { q: `科技馆一场最多能进 ${budget} 人。一所学校有 ${x} 名男生和 ${y} 名女生，一场能全部进去吗？`, o: ['能', '不能'] },
      ]);
      const v = ok ? t.o[0] : t.o[1];
      const steps = ok
        ? [`往大了估：${x} < ${Hx * 100}，${y} < ${Hy * 100}`, `${Hx * 100} + ${Hy * 100} = ${budget}，实际的和比 ${budget} 还小`, `所以${v}（实际 ${x} + ${y} = ${x + y}）`]
        : [`往小了估：${x} > ${Hx * 100}，${y} > ${Hy * 100}`, `${Hx * 100} + ${Hy * 100} = ${budget}，实际的和比 ${budget} 还大`, `所以${v}（实际 ${x} + ${y} = ${x + y}）`];
      return { q: t.q, answer: [pick(t.o, v)], steps: ['把两个数分别看成接近的整百数，加起来和限量比', ...steps, `答：${v}。`] };
    },
  },
  {
    id: 'g3a-check-addsub', grade: 3, term: 1, unit: '万以内的加法和减法（二）', name: '用验算判断对错',
    tip: '加法验算：和 − 一个加数 = 另一个加数；减法验算：差 + 减数 = 被减数', level: 2,
    gen(r) {
      const add = r.bool(), wrong = r.bool();
      let a, b, c, shown, why = '';
      if (add) {
        [a, b] = r.until(() => [r.int(105, 899), r.int(105, 899)], ([x, y]) => sum(carryCols(x, y)) >= 1 && x + y < 1000);
        c = a + b;
        const A = digits(a), B = digits(b);
        const noCarry = A.reduce((s, x, i) => s + (i === A.length - 1 ? x + B[i] : (x + B[i]) % 10) * 10 ** i, 0);
        shown = !wrong ? c : noCarry !== c && r.bool() ? noCarry : c + r.pick([10, -10, 100]);
        why = shown === noCarry ? '满十没有向前一位进 1' : '计算时某一位算错了';
      } else {
        [a, b] = r.until(() => [r.int(311, 999), r.int(102, 899)], ([x, y]) => x > y + 50 && sum(borrowCols(x, y)) >= 1 && Math.floor(x / 10) % 10 > 0);
        c = a - b;
        const br = borrowCols(a, b);
        shown = !wrong ? c : c + (br[0] ? 10 : 100) * (r.bool() ? 1 : -1);
        why = shown > c ? '退位后前一位忘了减 1' : '退位时多减了';
      }
      const op = add ? '+' : '−';
      const ok = shown === c;
      const steps = add
        ? [`用减法验算：${shown} − ${b} = ${shown - b}`, `${shown - b} ${ok ? '=' : '≠'} ${a}，所以${ok ? '算对了' : '算错了'}`]
        : [`用加法验算：${shown} + ${b} = ${shown + b}`, `${shown + b} ${ok ? '=' : '≠'} ${a}，所以${ok ? '算对了' : '算错了'}`];
      if (!ok) steps.push(`错在${why}，重新算：`);
      steps.push(add ? vAdd(a, b) : vSub(a, b), `正确的得数是 ${c}`);
      return { q: `${a} ${op} ${b} = ${shown}\n这道题算得对吗？{0}　正确的得数是 {1}`, answer: [pick(['√', '×'], ok ? '√' : '×'), num(c)], steps, hint: add ? '用减法验算' : '用加法验算' };
    },
  },
  {
    id: 'g3a-unknown-addsub', grade: 3, term: 1, unit: '万以内的加法和减法（二）', name: '求括号里的数（加减法关系）',
    tip: '加数 = 和 − 另一个加数；被减数 = 差 + 减数；减数 = 被减数 − 差', level: 2,
    gen(r) {
      const t = r.int(0, 3);
      const [x, y] = r.until(() => [r.int(105, 599), r.int(105, 399)], ([p, q]) => sum(carryCols(p, q)) >= 1);
      const s = x + y;
      const F = [
        { q: `{0} + ${y} = ${s}`, a: x, rule: '求加数：和 − 另一个加数', calc: [s, y, '−'] },
        { q: `${x} + {0} = ${s}`, a: y, rule: '求加数：和 − 另一个加数', calc: [s, x, '−'] },
        { q: `{0} − ${x} = ${y}`, a: s, rule: '求被减数：差 + 减数', calc: [y, x, '+'] },
        { q: `${s} − {0} = ${y}`, a: x, rule: '求减数：被减数 − 差', calc: [s, y, '−'] },
      ][t];
      const [p, q, op] = F.calc;
      return { q: F.q, answer: [num(F.a)], steps: [F.rule, `${p} ${op} ${q} = ${F.a}`, op === '+' ? vAdd(p, q) : vSub(p, q), `把 ${F.a} 放回去算一算，等式成立 ✓`], hint: '想一想加法和减法各部分之间的关系' };
    },
  },
  {
    id: 'g3a-addsub-word', grade: 3, term: 1, unit: '万以内的加法和减法（二）', name: '三位数加减法解决问题', process: true,
    tip: '求“一共”“比谁多几”的数用加法；求“还剩”“相差”“比谁少几”的数用减法', level: 1,
    gen(r) {
      const [A, B] = r.names(2);
      const [x, y] = r.until(() => [r.int(215, 680), r.int(108, 390)], ([p, q]) => p > q + 30 && sum(carryCols(p, q)) >= 1 && sum(borrowCols(p, q)) >= 1);
      const t = r.pick([
        { q: `学校图书室有科技书 ${x} 本，故事书比科技书多 ${y} 本。故事书有多少本？`, add: true, rel: '故事书 = 科技书 + 多的部分', u: '本', ans: '故事书有' },
        { q: `三年级有男生 ${x} 人，女生 ${y} 人。三年级一共有多少人？`, add: true, rel: '一共的人数 = 男生 + 女生', u: '人', ans: '三年级一共有' },
        { q: `一本故事书有 ${x} 页，${A}已经看了 ${y} 页。还剩多少页没看？`, add: false, rel: '还剩的页数 = 总页数 − 看了的页数', u: '页', ans: '还剩' },
        { q: `${A}家离学校 ${x} 米，${B}家离学校 ${y} 米。${A}家比${B}家离学校远多少米？`, add: false, rel: '远的米数 = 远的路程 − 近的路程', u: '米', ans: `${A}家比${B}家远` },
        { q: `一台电风扇 ${y} 元，一台电视机比电风扇贵 ${x} 元。电视机多少元？`, add: true, rel: '电视机的价钱 = 电风扇的价钱 + 贵的部分', u: '元', ans: '电视机', a2: [y, x] },
        { q: `果园里有苹果树 ${x} 棵，梨树比苹果树少 ${y} 棵。梨树有多少棵？`, add: false, rel: '梨树 = 苹果树 − 少的部分', u: '棵', ans: '梨树有' },
      ]);
      const [p, q] = t.a2 || [x, y];
      const res = t.add ? p + q : p - q, op = t.add ? '+' : '−';
      return { q: t.q, answer: [num(res, { unit: t.u })], steps: [`找数量关系：${t.rel}`, `列式：${p} ${op} ${q} = ${res}（${t.u}）`, t.add ? vAdd(p, q) : vSub(p, q), `答：${t.ans} ${res} ${t.u}。`] };
    },
  },
  {
    id: 'g3a-smart-round', grade: 3, term: 1, unit: '万以内的加法和减法（二）', name: '加减接近整百数的巧算',
    tip: '加 298 看成加 300 再减 2；减 199 看成减 200 再加 1（多减的要加回来）', level: 3,
    gen(r) {
      const near = r.bool(), add = r.bool();
      const [a, H, k] = r.until(() => [r.int(321, 899), r.int(1, 3), r.int(1, 4)], ([x, h]) => add || x > h * 100 + 50);
      const b = near ? H * 100 - k : H * 100 + k;
      const res = add ? a + b : a - b, op = add ? '+' : '−';
      let steps;
      if (add && near) steps = [`${b} 接近 ${H * 100}，${b} = ${H * 100} − ${k}`, `先加 ${H * 100}：${a} + ${H * 100} = ${a + H * 100}`, `多加了 ${k}，再减去 ${k}：${a + H * 100} − ${k} = ${res}`];
      else if (add) steps = [`${b} = ${H * 100} + ${k}`, `先加 ${H * 100}：${a} + ${H * 100} = ${a + H * 100}`, `再加 ${k}：${a + H * 100} + ${k} = ${res}`];
      else if (near) steps = [`${b} 接近 ${H * 100}，${b} = ${H * 100} − ${k}`, `先减 ${H * 100}：${a} − ${H * 100} = ${a - H * 100}`, `多减了 ${k}，要加回 ${k}：${a - H * 100} + ${k} = ${res}`];
      else steps = [`${b} = ${H * 100} + ${k}`, `先减 ${H * 100}：${a} − ${H * 100} = ${a - H * 100}`, `再减 ${k}：${a - H * 100} − ${k} = ${res}`];
      return { q: `用简便方法算：${a} ${op} ${b} = {0}`, answer: [num(res)], steps, hint: `${b} 和哪个整百数接近？` };
    },
  },

  // ---------- 倍的认识 ----------
  {
    id: 'g3a-times-picture', grade: 3, term: 1, unit: '倍的认识', name: '看图求倍数',
    tip: '把少的那种看作 1 份，数一数多的有这样的几份，就是几倍', level: 1,
    gen(r) {
      const items = [['🐔', '鸡', '只'], ['🦆', '鸭', '只'], ['🐰', '兔子', '只'], ['🐟', '鱼', '条'], ['⭐', '星星', '颗'], ['🍎', '苹果', '个'], ['🍐', '梨', '个'], ['🌸', '花', '朵'], ['🚗', '小汽车', '辆'], ['🎈', '气球', '个']];
      const [[e1, n1, u1], [e2, n2, u2]] = r.sample(items, 2);
      const a = r.int(2, 5), k = r.until(() => r.int(2, 6), (x) => a * x <= 20), b = a * k;
      return {
        q: `${n2}的数量是${n1}的几倍？`,
        fig: rowsFig([[n1, e1, a], [n2, e2, b]]),
        answer: [num(k, { unit: '倍' })],
        steps: [`数一数：${n1}有 ${a} ${u1}，${n2}有 ${b} ${u2}`, `把 ${a} ${u1}${n1}看作 1 份，${n2} ${a} ${u2} ${a} ${u2}地圈，能圈出 ${k} 份`, `${b} ÷ ${a} = ${k}，所以${n2}的数量是${n1}的 ${k} 倍`],
        hint: `${a} ${u1}${n1}算 1 份，${n2}有这样的几份？`,
      };
    },
  },
  {
    id: 'g3a-times-calc', grade: 3, term: 1, unit: '倍的认识', name: '倍的计算（填空）',
    tip: '求几倍用除法；求一个数的几倍是多少用乘法；已知几倍求这个数用除法', level: 1, speed: 8,
    gen(r) {
      const b = r.int(2, 9), k = r.int(2, 9), a = b * k;
      return r.pick([
        { q: `${a} 是 ${b} 的 {0} 倍`, answer: [num(k)], steps: [`求 ${a} 是 ${b} 的几倍，就是求 ${a} 里面有几个 ${b}`, `${a} ÷ ${b} = ${k}`] },
        { q: `${b} 的 ${k} 倍是 {0}`, answer: [num(a)], steps: [`求 ${b} 的 ${k} 倍，就是求 ${k} 个 ${b} 是多少`, `${b} × ${k} = ${a}`] },
        { q: `{0} 的 ${k} 倍是 ${a}`, answer: [num(b)], steps: [`一个数的 ${k} 倍是 ${a}，就是 ${k} 个这个数是 ${a}`, `${a} ÷ ${k} = ${b}`] },
      ]);
    },
  },
  {
    id: 'g3a-times-howmany', grade: 3, term: 1, unit: '倍的认识', name: '求一个数是另一个数的几倍', process: true,
    tip: '求 a 是 b 的几倍，就是求 a 里面有几个 b，用除法：a ÷ b', level: 1,
    gen(r) {
      const [A, B] = r.names(2), s = r.int(2, 9), k = r.int(2, 9), big = s * k;
      const t = r.pick([
        { q: `${A}有 ${s} 本故事书，${B}有 ${big} 本。${B}的本数是${A}的几倍？`, x: `${B}的本数`, y: `${A}的` },
        { q: `草地上有 ${s} 只白兔，${big} 只灰兔。灰兔的只数是白兔的几倍？`, x: '灰兔的只数', y: '白兔的' },
        { q: `果园里有 ${s} 棵梨树，${big} 棵苹果树。苹果树的棵数是梨树的几倍？`, x: '苹果树的棵数', y: '梨树的' },
        { q: `${A}跳绳跳了 ${big} 下，${B}跳了 ${s} 下。${A}跳的下数是${B}的几倍？`, x: `${A}跳的下数`, y: `${B}的` },
        { q: `一支铅笔 ${s} 元，一个文具盒 ${big} 元。文具盒的价钱是铅笔的几倍？`, x: '文具盒的价钱', y: '铅笔的' },
        { q: `${A}折了 ${big} 只纸鹤，${B}折了 ${s} 只。${A}折的只数是${B}的几倍？`, x: `${A}折的只数`, y: `${B}的` },
      ]);
      return { q: t.q, answer: [num(k, { unit: '倍' })], steps: [`把 ${s} 看作 1 份，求 ${big} 里面有几个 ${s}`, `求一个数是另一个数的几倍，用除法`, `${big} ÷ ${s} = ${k}`, `答：${t.x}是${t.y} ${k} 倍。`] };
    },
  },
  {
    id: 'g3a-times-product', grade: 3, term: 1, unit: '倍的认识', name: '求一个数的几倍是多少', process: true,
    tip: '求一个数的几倍是多少，就是求几个这个数是多少，用乘法', level: 1,
    gen(r) {
      const [a, b] = r.names(2), base = r.int(3, 12), k = r.int(2, 6);
      const t = r.pick([
        { q: `${a}有 ${base} 本书，${b}的书是${a}的 ${k} 倍。${b}有多少本书？`, unit: '本', who: `${b}有` },
        { q: `${a}摘了 ${base} 朵花，${b}摘的是${a}的 ${k} 倍。${b}摘了多少朵？`, unit: '朵', who: `${b}摘了` },
        { q: `${a}跳了 ${base} 下，${b}跳的下数是${a}的 ${k} 倍。${b}跳了多少下？`, unit: '下', who: `${b}跳了` },
        { q: `${a}画了 ${base} 张画，${b}画的是${a}的 ${k} 倍。${b}画了多少张？`, unit: '张', who: `${b}画了` },
        { q: `一个足球 ${base} 元，一辆滑板车的价钱是足球的 ${k} 倍。滑板车多少元？`, unit: '元', who: '滑板车', A: '足球', B: '滑板车' },
        { q: `花园里有 ${base} 盆红花，黄花的盆数是红花的 ${k} 倍。黄花有多少盆？`, unit: '盆', who: '黄花有', A: '红花', B: '黄花' },
      ]);
      const A = t.A || a, B = t.B || b;
      return {
        q: t.q,
        fig: fig.bars([{ label: A, units: 1, text: `${base}${t.unit}` }, { label: B, units: k, text: '?' }]),
        answer: [num(base * k, { unit: t.unit })],
        steps: [`${B}是${A}的 ${k} 倍，就是 ${k} 个 ${base}`, `求 ${k} 个 ${base} 是多少，用乘法`, `${base} × ${k} = ${base * k}（${t.unit}）`, `答：${t.who} ${base * k} ${t.unit}。`],
      };
    },
  },
  {
    id: 'g3a-times-base', grade: 3, term: 1, unit: '倍的认识', name: '已知几倍求一个数', process: true,
    tip: '已知一个数的几倍是多少，求这个数：把它看作 1 份，用除法', level: 2,
    gen(r) {
      const [a, b] = r.names(2), base = r.int(2, 9), k = r.int(2, 9), big = base * k;
      const t = r.pick([
        { q: `${a}有 ${big} 张邮票，是${b}的 ${k} 倍。${b}有多少张邮票？`, unit: '张', A: a, B: b, ans: `${b}有` },
        { q: `一个书包 ${big} 元，是一个笔袋价钱的 ${k} 倍。一个笔袋多少元？`, unit: '元', A: '书包', B: '笔袋', ans: '一个笔袋' },
        { q: `池塘里有 ${big} 只鸭，鸭的只数是鹅的 ${k} 倍。鹅有多少只？`, unit: '只', A: '鸭', B: '鹅', ans: '鹅有' },
        { q: `鱼缸里有 ${big} 条金鱼，金鱼的条数是热带鱼的 ${k} 倍。热带鱼有多少条？`, unit: '条', A: '金鱼', B: '热带鱼', ans: '热带鱼有' },
        { q: `${a}收集了 ${big} 片树叶，是${b}收集的 ${k} 倍。${b}收集了多少片？`, unit: '片', A: a, B: b, ans: `${b}收集了` },
      ]);
      return {
        q: t.q,
        fig: fig.bars([{ label: t.B, units: 1, text: '?' }, { label: t.A, units: k, text: `${big}${t.unit}` }]),
        answer: [num(base, { unit: t.unit })],
        steps: [`把${t.B}看作 1 份，${t.A}有这样的 ${k} 份`, `${k} 份是 ${big}，求 1 份是多少，用除法`, `${big} ÷ ${k} = ${base}（${t.unit}）`, `答：${t.ans} ${base} ${t.unit}。`],
        hint: '谁是 1 份？',
      };
    },
  },

  // ---------- 多位数乘一位数 ----------
  {
    id: 'g3a-mul-oral-round', grade: 3, term: 1, unit: '多位数乘一位数', name: '整十、整百、整千数乘一位数',
    tip: '先用 0 前面的数乘，再看因数末尾有几个 0，就在积的末尾添几个 0', level: 1, speed: 5,
    gen(r) {
      const [c, p, d] = r.until(() => [r.int(1, 9), r.pick([1, 1, 2, 2, 3]), r.int(2, 9)], ([x, y, z]) => x * 10 ** y * z < 10000);
      const a = c * 10 ** p, res = a * d;
      const steps = [`先算 ${c} × ${d} = ${c * d}`, `${a} 末尾有 ${p} 个 0，就在 ${c * d} 后面添 ${p} 个 0：${res}`];
      if ((c * d) % 10 === 0) steps.push(`注意：${c * d} 本身末尾有 0，所以积的末尾一共有 ${tailZeros(res)} 个 0`);
      return { q: r.bool() ? `${a} × ${d} = {0}` : `${d} × ${a} = {0}`, answer: [num(res)], steps };
    },
  },
  {
    id: 'g3a-mul-oral-2d', grade: 3, term: 1, unit: '多位数乘一位数', name: '两位数乘一位数（口算）',
    tip: '把两位数拆成整十数和一位数，分别乘，再加起来：23 × 4 = 20 × 4 + 3 × 4', level: 1, speed: 10,
    gen(r) {
      const [a, d] = r.until(() => [r.int(11, 49), r.int(2, 9)], ([x, y]) => x % 10 && x * y <= 200);
      const t = a - (a % 10), o = a % 10;
      return { q: `${a} × ${d} = {0}`, answer: [num(a * d)], steps: [`把 ${a} 拆成 ${t} 和 ${o}`, `${t} × ${d} = ${t * d}，${o} × ${d} = ${o * d}`, `${t * d} + ${o * d} = ${a * d}`], hint: `先算 ${t} × ${d}` };
    },
  },
  {
    id: 'g3a-mul-nocarry', grade: 3, term: 1, unit: '多位数乘一位数', name: '多位数乘一位数（不进位）',
    tip: '用一位数依次去乘个位、十位、百位，乘到哪一位，积就写在哪一位下面', level: 1,
    gen(r) {
      const d = r.pick([2, 2, 3, 3, 4]), len = r.pick([2, 3, 3]), top = Math.floor(9 / d);
      const a = Number(Array.from({ length: len }, () => r.int(1, top)).join(''));
      return { q: `${a} × ${d} = {0}`, answer: [num(a * d)], steps: [`列竖式，用 ${d} 从个位乘起`, ...mulCols(a, d), vMul(a, d)] };
    },
  },
  {
    id: 'g3a-mul-carry', grade: 3, term: 1, unit: '多位数乘一位数', name: '两位数乘一位数（进位笔算）',
    tip: '哪一位乘得满几十，就向前一位进几，前一位乘完要加上进上来的数', level: 1,
    gen(r) {
      const [a, d] = r.until(() => [r.int(12, 98), r.int(2, 9)], ([x, y]) => x % 10 && mulCarryCols(x, y)[0] > 0);
      return { q: `${a} × ${d} = {0}`, answer: [num(a * d)], steps: [`列竖式，用 ${d} 从个位乘起`, ...mulCols(a, d), vMul(a, d), `易错：十位乘完别忘了加上个位进上来的 ${mulCarryCols(a, d)[0]}`] };
    },
  },
  {
    id: 'g3a-mul-carry-3d', grade: 3, term: 1, unit: '多位数乘一位数', name: '三位数乘一位数（连续进位）',
    tip: '个位、十位都要进位：每一位先乘，再加上进上来的数，满几十进几', level: 1,
    gen(r) {
      const [a, d] = r.until(() => [r.int(112, 989), r.int(2, 9)], ([x, y]) => { const c = mulCarryCols(x, y); return digits(x).every((g) => g > 0) && c[0] > 0 && c[1] > 0; });
      return { q: `${a} × ${d} = {0}`, answer: [num(a * d)], steps: [`列竖式，用 ${d} 从个位乘起`, ...mulCols(a, d), vMul(a, d)], hint: '进上来的数先记在心里（或写小一点）' };
    },
  },
  {
    id: 'g3a-mul-zero-mid', grade: 3, term: 1, unit: '多位数乘一位数', name: '因数中间有 0 的乘法',
    tip: '0 乘任何数都得 0，但个位进上来的数要加到十位上', level: 2,
    gen(r) {
      const [a, d] = r.until(() => [r.int(1, 9) * 100 + r.int(1, 9), r.int(2, 9)], ([x, y]) => (x % 10) * y >= 10 || r.chance(0.25));
      const c = mulCarryCols(a, d)[0];
      return { q: `${a} × ${d} = {0}`, answer: [num(a * d)], steps: [`列竖式，用 ${d} 从个位乘起`, ...mulCols(a, d), vMul(a, d), c ? `易错：十位 0 × ${d} = 0，但要加上进上来的 ${c}，十位写 ${c}，不能写 0` : `十位 0 × ${d} = 0，十位上写 0 占位`] };
    },
  },
  {
    id: 'g3a-mul-zero-end', grade: 3, term: 1, unit: '多位数乘一位数', name: '因数末尾有 0 的乘法',
    tip: '先用 0 前面的数和一位数相乘，再看因数末尾有几个 0，就在积的末尾添几个 0', level: 2,
    gen(r) {
      const [c, z, d] = r.until(() => [r.int(12, 99), r.chance(0.75) ? 1 : 2, r.int(2, 9)], ([x, y, w]) => x % 10 && x * 10 ** y * w < 10000);
      const a = c * 10 ** z, core = c * d;
      const steps = [`竖式简便写法：${d} 和 0 前面的 ${c % 10} 对齐`, `先算 ${c} × ${d} = ${core}`, `${a} 末尾有 ${z} 个 0，在 ${core} 后面添 ${z} 个 0，得 ${a * d}`, vMulZ(a, d)];
      if (core % 10 === 0) steps.push(`注意：${core} 本身末尾也有 0，积的末尾一共有 ${tailZeros(a * d)} 个 0`);
      return { q: `${a} × ${d} = {0}`, answer: [num(a * d)], steps };
    },
  },
  {
    id: 'g3a-mul-tail-zeros', grade: 3, term: 1, unit: '多位数乘一位数', name: '积的末尾有几个 0',
    tip: '不能只数因数末尾的 0，要先算出积：5 × 4、5 × 6、5 × 8 的积本身就有 0', level: 2,
    gen(r) {
      const [c, p, d] = r.until(() => [r.pick([r.int(1, 9), r.pick([5, 15, 25, 35, 45, 12, 24, 125]), r.int(11, 99)]), r.int(0, 2), r.pick([2, 4, 5, 6, 8, r.int(2, 9)])], ([x, y, z]) => x * 10 ** y >= 10 && x * 10 ** y * z < 10000);
      const a = c * 10 ** p;
      const res = a * d, z = tailZeros(res), zc = tailZeros(c * d);
      const steps = [`先算出积：${a} × ${d} = ${res}`, `${res} 的末尾有 ${z} 个 0`];
      if (zc > 0 && p > 0) steps.push(`因数 ${a} 末尾有 ${p} 个 0，而 ${c} × ${d} = ${c * d} 又带出 ${zc} 个 0，所以一共 ${z} 个`);
      else if (zc > 0) steps.push(`${a} 末尾没有 0，但 ${a} × ${d} 乘出来的积末尾有 0，所以要先算再数`);
      else if (p > 0) steps.push(`${c} × ${d} = ${c * d} 末尾没有 0，积末尾的 ${p} 个 0 都是因数 ${a} 末尾带来的`);
      else steps.push('因数末尾没有 0，乘出来的积末尾也没有 0，填 0');
      return { q: `${a} × ${d} 的积末尾有 {0} 个 0`, answer: [num(z)], steps, hint: '先把积算出来再数' };
    },
  },
  {
    id: 'g3a-mul-estimate', grade: 3, term: 1, unit: '多位数乘一位数', name: '乘法估算',
    tip: '把多位数看成和它接近的整十、整百数，再口算', level: 2, speed: 10,
    gen(r) {
      const hund = r.chance(0.65), U = hund ? 100 : 10;
      const a = r.int(hund ? 2 : 2, 9) * U + (r.bool() ? 1 : -1) * r.int(1, hund ? 20 : 3), d = r.int(2, 9);
      const ra = Math.round(a / U) * U;
      return {
        q: `把多位数看成和它接近的整${hund ? '百' : '十'}数，估一估：\n${a} × ${d} ≈ {0}`,
        answer: [num(ra * d)],
        steps: [`${a} 接近 ${ra}`, `${ra} × ${d} = ${ra * d}`, `所以 ${a} × ${d} ≈ ${ra * d}（准确得数是 ${a * d}）`],
        hint: `${a} 接近哪个整${hund ? '百' : '十'}数？`,
      };
    },
  },
  {
    id: 'g3a-mul-word', grade: 3, term: 1, unit: '多位数乘一位数', name: '乘法解决问题（单价×数量）', process: true,
    tip: '单价 × 数量 = 总价；每份数 × 份数 = 总数', level: 1,
    gen(r) {
      const n = r.name(), d = r.int(3, 9);
      const t = r.pick([
        { a: r.int(12, 48), q: (a) => `一本故事书 ${a} 元，学校买了 ${d} 本。一共要花多少元？`, rel: '单价 × 数量 = 总价', u: '元', ans: '一共要花' },
        { a: r.int(26, 68), q: (a) => `一张动物园门票 ${a} 元，${n}家买了 ${d} 张。一共多少元？`, rel: '单价 × 数量 = 总价', u: '元', ans: '一共' },
        { a: r.int(24, 56), q: (a) => `礼堂每排有 ${a} 个座位，一共有 ${d} 排。礼堂一共有多少个座位？`, rel: '每排的座位数 × 排数 = 总座位数', u: '个', ans: '一共有' },
        { a: r.int(25, 48), q: (a) => `${n}每天看书 ${a} 页，${d} 天一共看多少页？`, rel: '每天看的页数 × 天数 = 一共看的页数', u: '页', ans: '一共看' },
        { a: r.int(115, 230), q: (a) => `一台电饭锅 ${a} 元，学校食堂买了 ${d} 台。一共要多少元？`, rel: '单价 × 数量 = 总价', u: '元', ans: '一共要' },
        { a: r.int(36, 85), q: (a) => `一箱牛奶有 ${a} 盒，商店运来 ${d} 箱。一共有多少盒牛奶？`, rel: '每箱的盒数 × 箱数 = 总盒数', u: '盒', ans: '一共有' },
      ]);
      const a = t.a;
      return { q: t.q(a), answer: [num(a * d, { unit: t.u })], steps: [`找数量关系：${t.rel}`, `列式：${a} × ${d} = ${a * d}（${t.u}）`, vMul(a, d), `答：${t.ans} ${a * d} ${t.u}。`] };
    },
  },
];

/** 一边靠墙的长方形：top 是靠墙的边，depth 是另一条边 */
function wallFig(top, depth, unit) {
  const k = Math.min(260 / top, 120 / depth), w = top * k, h = depth * k, x0 = (380 - w) / 2, y0 = 52;
  let s = `<line x1="${x0 - 24}" y1="${y0}" x2="${x0 + w + 24}" y2="${y0}" stroke="${C.line}" stroke-width="7"/>`;
  for (let x = x0 - 20; x < x0 + w + 20; x += 14) s += `<line x1="${x}" y1="${y0 - 4}" x2="${x + 10}" y2="${y0 - 16}" stroke="${C.dash}" stroke-width="2"/>`;
  s += fig.text(x0 + w + 40, y0 - 10, '墙', { size: 16, weight: 'bold' });
  s += `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="${C.fill}" stroke="${C.acc}" stroke-width="3" stroke-dasharray="8 5"/>`;
  s += fig.text(x0 + w / 2, y0 + h + 18, `${top}${unit}`) + fig.text(x0 + w + 12, y0 + h / 2, `${depth}${unit}`, { anchor: 'start' });
  return fig.raw(400, y0 + h + 34, s);
}
const cnFrac = (n, d) => `${CN[d]}分之${CN[n]}`;

const TERM1_C = [
  // ---------- 长方形和正方形 ----------
  {
    id: 'g3a-perim-rect', grade: 3, term: 1, unit: '长方形和正方形', name: '长方形的周长',
    tip: '长方形的周长 = (长 + 宽) × 2', level: 1,
    gen(r) {
      const u = r.pick(['厘米', '分米', '米']), w = r.int(4, 25), h = r.int(2, w - 1), P = 2 * (w + h), useFig = r.chance(0.6);
      return {
        q: useFig ? '求这个长方形的周长。' : `一个长方形长 ${w} ${u}，宽 ${h} ${u}，它的周长是多少？`,
        fig: useFig ? rectFig(w, h, `${w}${u}`, `${h}${u}`) : undefined,
        answer: [num(P, { unit: u })],
        steps: ['长方形有两条长、两条宽，周长 = (长 + 宽) × 2', `(${w} + ${h}) × 2 = ${w + h} × 2 = ${P}（${u}）`, `也可以：${w} + ${h} + ${w} + ${h} = ${P}`, '易错：只算了一条长加一条宽，忘了乘 2'],
      };
    },
  },
  {
    id: 'g3a-perim-square', grade: 3, term: 1, unit: '长方形和正方形', name: '正方形的周长',
    tip: '正方形的 4 条边都相等，周长 = 边长 × 4', level: 1, speed: 10,
    gen(r) {
      const u = r.pick(['厘米', '分米', '米']), a = r.int(2, 25), useFig = r.chance(0.6);
      return {
        q: useFig ? '求这个正方形的周长。' : `一个正方形的边长是 ${a} ${u}，它的周长是多少？`,
        fig: useFig ? rectFig(1, 1, `${a}${u}`, '') : undefined,
        answer: [num(4 * a, { unit: u })],
        steps: ['正方形 4 条边一样长，周长 = 边长 × 4', `${a} × 4 = ${4 * a}（${u}）`],
      };
    },
  },
  {
    id: 'g3a-perim-square-side', grade: 3, term: 1, unit: '长方形和正方形', name: '已知周长求正方形边长', process: true,
    tip: '正方形边长 = 周长 ÷ 4', level: 1,
    gen(r) {
      const n = r.name(), a = r.pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 20]), P = 4 * a;
      const t = r.pick([
        { q: `一个正方形的周长是 ${P} 厘米，它的边长是多少厘米？`, u: '厘米' },
        { q: `${n}用一根 ${P} 厘米长的铁丝正好围成一个正方形，这个正方形的边长是多少厘米？`, u: '厘米' },
        { q: `一个正方形花坛的周长是 ${P} 米，花坛的边长是多少米？`, u: '米' },
        { q: `一块正方形手帕四周缝了 ${P} 分米长的花边，手帕的边长是多少分米？`, u: '分米' },
      ]);
      return { q: t.q, answer: [num(a, { unit: t.u })], steps: ['正方形的周长 = 边长 × 4', '所以 边长 = 周长 ÷ 4', `${P} ÷ 4 = ${a}（${t.u}）`, `答：边长是 ${a} ${t.u}。`], hint: '正方形有几条一样长的边？' };
    },
  },
  {
    id: 'g3a-perim-rect-side', grade: 3, term: 1, unit: '长方形和正方形', name: '已知周长求长方形的长或宽', process: true,
    tip: '周长 ÷ 2 = 长 + 宽，再减去已知的一条边', level: 2,
    gen(r) {
      const u = r.pick(['厘米', '分米', '米']), [l, w] = r.until(() => [r.int(5, 20), r.int(2, 15)], ([x, y]) => x > y && x + y <= 30), P = 2 * (l + w);
      const askW = r.bool(), known = askW ? l : w, ans = askW ? w : l;
      return {
        q: `一个长方形的周长是 ${P} ${u}，${askW ? `长是 ${l} ${u}，宽` : `宽是 ${w} ${u}，长`}是多少？`,
        fig: rectFig(l, w, askW ? `${l}${u}` : '?', askW ? '?' : `${w}${u}`),
        answer: [num(ans, { unit: u })],
        steps: ['周长 = (长 + 宽) × 2，所以 长 + 宽 = 周长 ÷ 2', `${P} ÷ 2 = ${l + w}（${u}）`, `${askW ? '宽' : '长'} = ${l + w} − ${known} = ${ans}（${u}）`, `检查：(${l} + ${w}) × 2 = ${P} ✓`],
        hint: '先求一条长和一条宽的和',
      };
    },
  },
  {
    id: 'g3a-perim-join', grade: 3, term: 1, unit: '长方形和正方形', name: '拼接后的周长', process: true,
    tip: '拼在一起时，中间重合的边不再是周长，只算外面一圈', level: 2,
    gen(r) {
      const t = r.int(0, 2);
      if (t === 0) {
        const n = r.int(2, 5), a = r.int(2, 9);
        const dashed = []; for (let i = 1; i < n; i++) dashed.push([[i * a, 0], [i * a, a]]);
        return {
          q: `用 ${n} 个边长是 ${a} 厘米的正方形拼成一个长方形（如图）。拼成的长方形周长是多少厘米？`,
          fig: shape([[0, 0], [n * a, 0], [n * a, a], [0, a]], { dashed }),
          answer: [num(2 * (n * a + a), { unit: '厘米' })],
          steps: [`拼成的长方形：长 = ${a} × ${n} = ${n * a}（厘米），宽 = ${a} 厘米`, `周长 = (${n * a} + ${a}) × 2 = ${2 * (n * a + a)}（厘米）`, `也可以数外圈的边：一共有 ${2 * n + 2} 条 ${a} 厘米，${a} × ${2 * n + 2} = ${2 * (n * a + a)}`, '中间虚线处的边被拼在里面了，不算周长'],
        };
      }
      const [l, w] = r.until(() => [r.int(4, 12), r.int(2, 8)], ([x, y]) => x > y);
      const longSide = r.bool();
      const [L, W] = longSide ? [l, 2 * w] : [2 * l, w];
      const pts = [[0, 0], [L, 0], [L, W], [0, W]], dashed = longSide ? [[[0, w], [l, w]]] : [[[l, 0], [l, w]]];
      if (t === 1) {
        return {
          q: `把两个长 ${l} 厘米、宽 ${w} 厘米的长方形，${longSide ? '长边' : '宽边'}和${longSide ? '长边' : '宽边'}拼在一起（如图）。拼成的大长方形周长是多少厘米？`,
          fig: shape(pts, { dashed }),
          answer: [num(2 * (L + W), { unit: '厘米' })],
          steps: [`${longSide ? '长边' : '宽边'}拼在一起，大长方形的${longSide ? `长还是 ${l} 厘米，宽变成 ${w} × 2 = ${2 * w}` : `长变成 ${l} × 2 = ${2 * l}，宽还是 ${w}`}（厘米）`, `周长 = (${L} + ${W}) × 2 = ${2 * (L + W)}（厘米）`, '中间拼在一起的边不算周长'],
        };
      }
      const side = longSide ? l : w;
      return {
        q: `把两个长 ${l} 厘米、宽 ${w} 厘米的长方形，${longSide ? '长边' : '宽边'}和${longSide ? '长边' : '宽边'}拼成一个大长方形（如图）。大长方形的周长比原来两个长方形的周长和少了多少厘米？`,
        fig: shape(pts, { dashed }),
        answer: [num(2 * side, { unit: '厘米' })],
        steps: [`拼的时候，两个长方形各有一条 ${side} 厘米的边贴在一起，到了图形里面`, `这两条边不再算周长，所以少了 2 条 ${side} 厘米`, `${side} × 2 = ${2 * side}（厘米）`, `验证：原来周长和 (${l} + ${w}) × 2 × 2 = ${4 * (l + w)}，现在 (${L} + ${W}) × 2 = ${2 * (L + W)}，少了 ${4 * (l + w) - 2 * (L + W)}`],
      };
    },
  },
  {
    id: 'g3a-perim-cut-square', grade: 3, term: 1, unit: '长方形和正方形', name: '剪下最大正方形', process: true,
    tip: '从长方形里剪最大的正方形，正方形的边长等于长方形的宽', level: 2,
    gen(r) {
      const [l, w] = r.until(() => [r.int(5, 20), r.int(3, 12)], ([x, y]) => x > y && x - y !== y);
      return {
        q: `一张长方形纸长 ${l} 厘米、宽 ${w} 厘米，从中剪下一个最大的正方形（如图）。剪下的正方形周长是多少厘米？剩下的长方形周长是多少厘米？`,
        fig: shape([[0, 0], [l, 0], [l, w], [0, w]], { edgeLabels: [`${l}厘米`, `${w}厘米`], dashed: [[[w, 0], [w, w]]] }),
        answer: [num(4 * w, { unit: '厘米', label: '正方形' }), num(2 * l, { unit: '厘米', label: '剩下的' })],
        steps: [`最大的正方形边长等于长方形的宽：${w} 厘米`, `正方形周长：${w} × 4 = ${4 * w}（厘米）`, `剩下的长方形：长 ${l} − ${w} = ${l - w}（厘米），宽 ${w} 厘米`, `剩下的周长：(${l - w} + ${w}) × 2 = ${2 * l}（厘米）`],
        hint: '最大的正方形，边长能比宽还长吗？',
      };
    },
  },
  {
    id: 'g3a-perim-translate', grade: 3, term: 1, unit: '长方形和正方形', name: '用平移法求周长',
    tip: '把凹进去的边向外平移，补成一个长方形，周长不变', level: 2,
    gen(r) {
      const L = r.int(8, 20), W = r.int(6, 14);
      let pts;
      if (r.bool()) { const a = r.int(2, L - 3), h = r.int(2, W - 2); pts = [[0, 0], [L, 0], [L, h], [a, h], [a, W], [0, W]]; }
      else { const x2 = r.int(Math.ceil(L / 2), L - 2), x3 = r.int(2, x2 - 2 > 2 ? x2 - 2 : 2), y1 = r.int(2, Math.floor(W / 2)), y2 = r.int(y1 + 1, W - 1); pts = [[0, 0], [L, 0], [L, y1], [x2, y1], [x2, y2], [x3, y2], [x3, W], [0, W]]; }
      const c = r.pick(SHAPE_CTX), u = c.u;
      const labels = []; labels[0] = `${L}${u}`; labels[pts.length - 1] = `${W}${u}`;
      return {
        q: `${c.w}的形状如下图（图中的角都是直角）。${c.ask}`,
        fig: shape(pts, { edgeLabels: labels }),
        answer: [num(2 * (L + W), { unit: u })],
        steps: ['把右上方凹进去的横线向上平移、竖线向右平移', `正好补成一个长 ${L} ${u}、宽 ${W} ${u}的长方形，周长没有变`, `周长 = (${L} + ${W}) × 2 = ${2 * (L + W)}（${u}）`],
        hint: '缺的那些短边，平移后能拼成什么形状的边框？',
      };
    },
  },
  {
    id: 'g3a-perim-notch', grade: 3, term: 1, unit: '长方形和正方形', name: '凹进去的图形求周长',
    tip: '横线平移后和长方形一样，但中间凹进去的两条竖线平移不出去，要另外加上', level: 3,
    gen(r) {
      const L = r.int(10, 20), W = r.int(6, 12), x1 = r.int(2, Math.floor(L / 3)), x2 = r.int(x1 + Math.ceil(L / 3), L - 2), e = r.int(2, W - 3);
      const pts = [[0, 0], [L, 0], [L, W], [x2, W], [x2, W - e], [x1, W - e], [x1, W], [0, W]];
      const c = r.pick(SHAPE_CTX), u = c.u;
      const labels = []; labels[0] = `${L}${u}`; labels[7] = `${W}${u}`; labels[3] = `${e}${u}`;
      const P = 2 * (L + W) + 2 * e;
      return {
        q: `${c.w}的形状如下图（图中的角都是直角）。${c.ask}`,
        fig: shape(pts, { edgeLabels: labels }),
        answer: [num(P, { unit: u })],
        steps: [`上面的三段横线平移到一起，正好和下面的长一样长：横线一共 ${L} × 2 = ${2 * L}（${u}）`, `竖线：左右两边各 ${W} ${u}，凹进去的地方还有两条 ${e} ${u}`, `周长 = ${L} × 2 + ${W} × 2 + ${e} × 2 = ${2 * L} + ${2 * W} + ${2 * e} = ${P}（${u}）`, '易错：只算 (长 + 宽) × 2，漏了凹进去的两条边'],
        hint: '凹进去的两条竖边能平移出去吗？',
      };
    },
  },
  {
    id: 'g3a-perim-word', grade: 3, term: 1, unit: '长方形和正方形', name: '周长解决问题', process: true,
    tip: '“围一圈”“走一圈”“镶花边”都是求周长', level: 1,
    gen(r) {
      const n = r.name(), t = r.int(0, 5);
      const T = [
        () => { const l = r.step(60, 100, 10), w = r.step(30, 50, 10), k = r.int(1, 3); return { q: `学校长方形操场长 ${l} 米，宽 ${w} 米。${n}沿着操场跑了 ${k} 圈，跑了多少米？`, a: 2 * (l + w) * k, u: '米', s: [`跑一圈就是操场的周长：(${l} + ${w}) × 2 = ${2 * (l + w)}（米）`, ...(k > 1 ? [`跑 ${k} 圈：${2 * (l + w)} × ${k} = ${2 * (l + w) * k}（米）`] : [])], ans: `跑了 ${2 * (l + w) * k} 米` }; },
        () => { const l = r.int(5, 12), w = r.int(3, l - 1); return { q: `一个长方形相框长 ${l} 分米，宽 ${w} 分米。给相框四周镶一圈金边，金边长多少分米？`, a: 2 * (l + w), u: '分米', s: [`镶一圈金边，就是求长方形的周长`, `(${l} + ${w}) × 2 = ${2 * (l + w)}（分米）`], ans: `金边长 ${2 * (l + w)} 分米` }; },
        () => { const a = r.int(5, 25); return { q: `一个正方形花坛的边长是 ${a} 米，在花坛四周围一圈栅栏，栅栏长多少米？`, a: 4 * a, u: '米', s: ['围一圈栅栏，就是求正方形的周长', `${a} × 4 = ${4 * a}（米）`], ans: `栅栏长 ${4 * a} 米` }; },
        () => { const l = r.int(6, 15), w = r.int(2, l - 1); return { q: `${n}用铁丝围一个长 ${l} 厘米、宽 ${w} 厘米的长方形框，至少需要多长的铁丝？`, a: 2 * (l + w), u: '厘米', s: [`铁丝的长度就是长方形的周长`, `(${l} + ${w}) × 2 = ${2 * (l + w)}（厘米）`], ans: `至少需要 ${2 * (l + w)} 厘米` }; },
        () => { const a = r.int(2, 9); return { q: `妈妈给一块边长 ${a} 分米的正方形手帕四周缝花边，需要多长的花边？`, a: 4 * a, u: '分米', s: ['缝一圈花边，就是求正方形的周长', `${a} × 4 = ${4 * a}（分米）`], ans: `需要 ${4 * a} 分米` }; },
        () => { const l = r.step(20, 60, 5), w = r.step(10, 30, 5); if (w >= l) return { q: `一块正方形菜地边长 ${l} 米，沿着菜地走一圈是多少米？`, a: 4 * l, u: '米', s: ['走一圈就是正方形的周长', `${l} × 4 = ${4 * l}（米）`], ans: `走一圈是 ${4 * l} 米` }; return { q: `一块长方形菜地长 ${l} 米，宽 ${w} 米。沿着菜地走一圈是多少米？`, a: 2 * (l + w), u: '米', s: ['走一圈就是长方形的周长', `(${l} + ${w}) × 2 = ${2 * (l + w)}（米）`], ans: `走一圈是 ${2 * (l + w)} 米` }; },
      ];
      const x = T[t]();
      return { q: x.q, answer: [num(x.a, { unit: x.u })], steps: [...x.s, `答：${x.ans}。`] };
    },
  },
  {
    id: 'g3a-perim-wall', grade: 3, term: 1, unit: '长方形和正方形', name: '一面靠墙围篱笆', process: true,
    tip: '靠墙的那条边不用围，篱笆长 = 周长 − 靠墙的边', level: 3,
    gen(r) {
      const [l, w] = r.until(() => [r.int(6, 20), r.int(3, 12)], ([x, y]) => x > y);
      const longWall = r.bool(), top = longWall ? l : w, depth = longWall ? w : l;
      const what = r.pick(['养鸡场', '菜地', '花圃', '小羊圈']);
      const fence = top + 2 * depth;
      return {
        q: `靠墙围一个长方形${what}（如图），长 ${l} 米，宽 ${w} 米，${longWall ? '长' : '宽'}的一边靠墙。篱笆至少长多少米？`,
        fig: wallFig(top, depth, '米'),
        answer: [num(fence, { unit: '米' })],
        steps: [`靠墙的一边是${longWall ? '长' : '宽'} ${top} 米，这一边有墙挡着，不用围篱笆`, `要围的是：1 条${longWall ? '长' : '宽'}和 2 条${longWall ? '宽' : '长'}`, `${top} + ${depth} × 2 = ${top} + ${2 * depth} = ${fence}（米）`, `答：篱笆至少长 ${fence} 米。`],
        hint: '哪一条边不用围？',
      };
    },
  },

  // ---------- 分数的初步认识 ----------
  {
    id: 'g3a-frac-picture', grade: 3, term: 1, unit: '分数的初步认识', name: '看图写分数',
    tip: '先看整个图形平均分成了几份（分母），再数涂色的有几份（分子）', level: 1,
    gen(r) {
      const shape = r.pick(['rect', 'circle', 'grid']);
      const n = shape === 'grid' ? r.pick([4, 6, 8, 9, 10, 12]) : shape === 'circle' ? r.int(3, 8) : r.int(2, 10);
      const k = r.int(1, n - 1);
      const shaded = shape === 'circle' ? Array.from({ length: k }, (_, i) => i) : r.sample([...Array(n).keys()], k);
      const blank = r.chance(0.3), x = blank ? n - k : k, what = blank ? '没涂色' : '涂色';
      return {
        q: `用分数表示图中${what}的部分。`,
        fig: fracFig(shape, n, shaded),
        answer: [fr(x, n)],
        steps: [`整个图形平均分成了 ${n} 份，每份是它的 ${frac(1, n)}`, `${what}的有 ${x} 份，就是 ${x} 个 ${frac(1, n)}`, `写作 ${frac(x, n)}，读作${cnFrac(x, n)}`],
        hint: '一共平均分成几份？',
      };
    },
  },
  {
    id: 'g3a-frac-read', grade: 3, term: 1, unit: '分数的初步认识', name: '分数的读法、写法和各部分',
    tip: '读分数先读分母再读分子：{{3/5}} 读作五分之三；横线下面是分母，上面是分子', level: 1,
    gen(r) {
      const d = r.int(2, 12), n = r.int(1, d - 1), t = r.int(0, 2);
      if (t === 0) {
        const wrong = [cnFrac(d, n), cnFrac(n === d - 1 ? n - 1 || 1 : n + 1, d), cnFrac(d - n, d), cnFrac(n, d + 1)].filter((s) => s !== cnFrac(n, d) && !s.includes('undefined'));
        const options = r.shuffle([cnFrac(n, d), ...r.sample([...new Set(wrong)], 3)]);
        return { q: `${frac(n, d)} 读作 {0}`, answer: [pick(options, cnFrac(n, d))], steps: ['读分数时，先读分母，再读“分之”，最后读分子', `分母是 ${d}，分子是 ${n}，读作${cnFrac(n, d)}`] };
      }
      if (t === 1) return { q: `${cnFrac(n, d)}写作 {0}`, answer: [fr(n, d)], steps: [`“${CN[d]}分之”说明分母是 ${d}，写在横线下面`, `分子是 ${n}，写在横线上面：${frac(n, d)}`] };
      return r.bool()
        ? { q: `${frac(n, d)} 的分母是 {0}，分子是 {1}`, answer: [num(d), num(n)], steps: ['分数线下面的是分母，上面的是分子', `${frac(n, d)} 的分母是 ${d}，分子是 ${n}`] }
        : { q: `${frac(n, d)} 表示把一个物体平均分成 {0} 份，取其中的 {1} 份`, answer: [num(d), num(n)], steps: ['分母表示平均分成几份，分子表示取了几份', `${frac(n, d)}：平均分成 ${d} 份，取 ${n} 份`] };
    },
  },
  {
    id: 'g3a-frac-units', grade: 3, term: 1, unit: '分数的初步认识', name: '几个几分之一',
    tip: '{{3/7}} 就是 3 个 {{1/7}}；7 个 {{1/7}} 合起来就是 1', level: 1, speed: 8,
    gen(r) {
      const d = r.int(2, 12), k = r.chance(0.15) ? d : r.int(1, d - 1);
      if (k < d && r.bool()) return { q: `${frac(k, d)} 里面有 {0} 个 ${frac(1, d)}`, answer: [num(k)], steps: [`${frac(k, d)} 的分子是 ${k}，就是 ${k} 个 ${frac(1, d)}`] };
      if (k === d) return { q: `${d} 个 ${frac(1, d)} 是 {0}`, answer: [num(1)], steps: [`${d} 个 ${frac(1, d)} 是 ${frac(d, d)}`, `把一个整体平均分成 ${d} 份，${d} 份全取了，就是整个，${frac(d, d)} = 1`] };
      return { q: `${k} 个 ${frac(1, d)} 是 {0}`, answer: [fr(k, d)], steps: [`${k} 个 ${frac(1, d)}：分母还是 ${d}，分子是 ${k}`, `就是 ${frac(k, d)}`] };
    },
  },
  {
    id: 'g3a-frac-cmp-den', grade: 3, term: 1, unit: '分数的初步认识', name: '同分母分数比大小',
    tip: '分母相同，每份一样大，分子大的分数就大', level: 1, speed: 6,
    gen(r) {
      const d = r.int(3, 12);
      if (r.chance(0.15)) { const a = r.int(1, d - 1), sw = r.bool(); const v = sw ? '>' : '<'; return { q: sw ? `1 {0} ${frac(a, d)}` : `${frac(a, d)} {0} 1`, answer: [pick(CMP, v)], steps: [`1 可以看成 ${frac(d, d)}`, `${frac(a, d)} 只取了 ${a} 份，不到 ${d} 份，比 1 小`, `所以填“${v}”`] }; }
      const [a, b] = r.sample([...Array(d - 1).keys()].map((x) => x + 1), 2), v = sign(a, b);
      return { q: `${frac(a, d)} {0} ${frac(b, d)}`, answer: [pick(CMP, v)], steps: [`分母都是 ${d}，都是平均分成 ${d} 份，每份一样大`, `比分子：${a} ${v} ${b}`, `所以 ${frac(a, d)} ${v} ${frac(b, d)}`] };
    },
  },
  {
    id: 'g3a-frac-cmp-num', grade: 3, term: 1, unit: '分数的初步认识', name: '同分子分数比大小',
    tip: '分子相同，分母越大，平均分的份数越多，每份就越小，分数就越小', level: 1, speed: 6,
    gen(r) {
      const n = r.chance(0.5) ? 1 : r.int(2, 5);
      const [d1, d2] = r.sample([...Array(12 - n).keys()].map((x) => x + n + 1), 2), v = sign(d2, d1);
      return {
        q: `${frac(n, d1)} {0} ${frac(n, d2)}`,
        answer: [pick(CMP, v)],
        steps: [`分子都是 ${n}，都取 ${n} 份`, `分母 ${d1} 和 ${d2}：分母越大，每份越小`, `${d1} ${sign(d1, d2)} ${d2}，所以 ${frac(n, d1)} ${v} ${frac(n, d2)}`, '易错：不能看分母大就说分数大'],
        hint: '同一块蛋糕，分给的人越多，每人分到的越多还是越少？',
      };
    },
  },
  {
    id: 'g3a-frac-add', grade: 3, term: 1, unit: '分数的初步认识', name: '同分母分数加法',
    tip: '分母不变，分子相加：{{2/7}} + {{3/7}} 就是 2 个 {{1/7}} 加 3 个 {{1/7}}', level: 1, speed: 8,
    gen(r) {
      const d = r.int(3, 12), whole = r.chance(0.12);
      const [a, b] = whole ? (() => { const x = r.int(1, d - 1); return [x, d - x]; })() : r.until(() => [r.int(1, d - 2), r.int(1, d - 2)], ([x, y]) => x + y < d);
      const steps = ['分母相同的分数相加，分母不变，分子相加', `${a} 个 ${frac(1, d)} 加 ${b} 个 ${frac(1, d)} 是 ${a + b} 个 ${frac(1, d)}`];
      if (whole) steps.push(`${frac(d, d)} 就是 1`);
      else steps.push(`${frac(a, d)} + ${frac(b, d)} = ${frac(a + b, d)}`);
      return { q: `${frac(a, d)} + ${frac(b, d)} = {0}`, answer: [whole ? num(1) : fr(a + b, d)], steps, hint: '分母要不要相加？' };
    },
  },
  {
    id: 'g3a-frac-sub', grade: 3, term: 1, unit: '分数的初步认识', name: '同分母分数减法',
    tip: '分母不变，分子相减', level: 1, speed: 8,
    gen(r) {
      const d = r.int(3, 12), [a, b] = r.until(() => [r.int(2, d), r.int(1, d - 1)], ([x, y]) => x > y);
      return {
        q: `${frac(a, d)} − ${frac(b, d)} = {0}`,
        answer: [fr(a - b, d)],
        steps: ['分母相同的分数相减，分母不变，分子相减', `${a} 个 ${frac(1, d)} 减去 ${b} 个 ${frac(1, d)}，还剩 ${a - b} 个 ${frac(1, d)}`, `${frac(a, d)} − ${frac(b, d)} = ${frac(a - b, d)}`],
      };
    },
  },
  {
    id: 'g3a-frac-one-minus', grade: 3, term: 1, unit: '分数的初步认识', name: '1 减几分之几',
    tip: '把 1 看成分子分母相同的分数，再按同分母分数相减', level: 1, speed: 8,
    gen(r) {
      const d = r.int(2, 12), a = r.int(1, d - 1);
      return {
        q: `1 − ${frac(a, d)} = {0}`,
        answer: [fr(d - a, d)],
        steps: [`减去的分数分母是 ${d}，把 1 看成 ${frac(d, d)}`, `${frac(d, d)} − ${frac(a, d)} = ${frac(d - a, d)}`, '易错：不能直接写成 1 − 分子'],
        hint: `1 等于几个 ${frac(1, d)}？`,
      };
    },
  },
  {
    id: 'g3a-frac-group', grade: 3, term: 1, unit: '分数的初步认识', name: '一些物体的几分之几',
    tip: '把一些物体看作一个整体，平均分成几份，每份就是它的几分之一', level: 1,
    gen(r) {
      const [e, obj, u] = r.pick([['🍎', '苹果', '个'], ['🍓', '草莓', '个'], ['🍬', '糖', '颗'], ['⚽', '足球', '个'], ['🌸', '花', '朵'], ['🎈', '气球', '个'], ['🐟', '鱼', '条']]);
      const d = r.int(2, 6), per = r.int(2, 6), T = d * per, k = r.int(1, d - 1);
      const kw = k === 1 ? '每份' : `${k} 份`;
      return {
        q: `把 ${T} ${u}${obj}平均分成 ${d} 份（如图）。${kw}是这些${obj}的 {0}，${kw}有 {1} ${u}。`,
        fig: fig.groups(Array.from({ length: d }, () => [e, per]), { size: 28, perRow: 3 }),
        answer: [fr(k, d), num(k * per, { unit: u })],
        steps: [`把 ${T} ${u}${obj}看作一个整体，平均分成 ${d} 份，每份是它的 ${frac(1, d)}`, ...(k > 1 ? [`${k} 份就是 ${k} 个 ${frac(1, d)}，是它的 ${frac(k, d)}`] : []), `每份有 ${T} ÷ ${d} = ${per}（${u}）${k > 1 ? `，${k} 份有 ${per} × ${k} = ${k * per}（${u}）` : ''}`, `注意：分数说的是“占几份”，不是有几${u}`],
      };
    },
  },
  {
    id: 'g3a-frac-of-one', grade: 3, term: 1, unit: '分数的初步认识', name: '求一个数的几分之一', process: true,
    tip: '求一个数的几分之一，就是把这个数平均分成几份，求 1 份：用除法', level: 2,
    gen(r) {
      const n = r.name(), d = r.int(2, 9), per = r.int(2, 9), T = d * per;
      const t = r.pick([
        { q: `${n}有 ${T} 颗糖，把其中的 ${frac(1, d)} 分给了弟弟。分给弟弟多少颗？`, u: '颗', ans: '分给弟弟' },
        { q: `一根绳子长 ${T} 米，用去了它的 ${frac(1, d)}。用去了多少米？`, u: '米', ans: '用去了' },
        { q: `三年级一班有 ${T} 名同学，其中 ${frac(1, d)} 参加了合唱队。参加合唱队的有多少人？`, u: '人', ans: '参加合唱队的有' },
        { q: `一本书有 ${T} 页，${n}第一天看了全书的 ${frac(1, d)}。第一天看了多少页？`, u: '页', ans: '第一天看了' },
        { q: `果园里有 ${T} 棵果树，其中桃树占 ${frac(1, d)}。桃树有多少棵？`, u: '棵', ans: '桃树有' },
      ]);
      return { q: t.q, answer: [num(per, { unit: t.u })], steps: [`求 ${T} 的 ${frac(1, d)} 是多少，就是把 ${T} 平均分成 ${d} 份，求其中的 1 份`, `用除法：${T} ÷ ${d} = ${per}（${t.u}）`, `答：${t.ans} ${per} ${t.u}。`], hint: `${frac(1, d)} 是把整体平均分成几份？` };
    },
  },
  {
    id: 'g3a-frac-of-some', grade: 3, term: 1, unit: '分数的初步认识', name: '求一个数的几分之几', process: true,
    tip: '先求 1 份是多少（除以分母），再求几份是多少（乘分子）', level: 2,
    gen(r) {
      const n = r.name(), d = r.int(3, 9), per = r.int(2, 9), T = d * per, k = r.int(2, d - 1);
      const t = r.pick([
        { q: `${n}有 ${T} 张邮票，送给同学 ${frac(k, d)}。送给同学多少张？`, u: '张', w: '邮票', p: '送出', ans: '送给同学' },
        { q: `花园里有 ${T} 朵花，其中 ${frac(k, d)} 是红花。红花有多少朵？`, u: '朵', w: '花', p: '红花', ans: '红花有' },
        { q: `一条路长 ${T} 米，已经修了全长的 ${frac(k, d)}。已经修了多少米？`, u: '米', w: '全长', p: '修了', ans: '已经修了' },
        { q: `三年级有 ${T} 人参加运动会，其中 ${frac(k, d)} 参加跑步比赛。参加跑步比赛的有多少人？`, u: '人', w: '全部', p: '跑步', ans: '参加跑步比赛的有' },
        { q: `一筐苹果有 ${T} 个，卖出了 ${frac(k, d)}。卖出了多少个？`, u: '个', w: '一筐', p: '卖出', ans: '卖出了' },
      ]);
      return {
        q: t.q,
        fig: fig.bars([{ label: t.w, units: d, text: `${T}${t.u}` }, { label: t.p, units: k, text: '?' }], { unitW: 44 }),
        answer: [num(per * k, { unit: t.u })],
        steps: [`${frac(k, d)} 是把 ${T} 平均分成 ${d} 份，取其中的 ${k} 份`, `先求 1 份：${T} ÷ ${d} = ${per}（${t.u}）`, `再求 ${k} 份：${per} × ${k} = ${per * k}（${t.u}）`, `答：${t.ans} ${per * k} ${t.u}。`],
      };
    },
  },
  {
    id: 'g3a-frac-word', grade: 3, term: 1, unit: '分数的初步认识', name: '分数加减解决问题', process: true,
    tip: '求“一共”用加法，求“还剩”“多几分之几”用减法；“还剩”要把整体看作 1', level: 2,
    gen(r) {
      const [A, B] = r.names(2), d = r.int(4, 12);
      const [a, b] = r.until(() => [r.int(1, d - 2), r.int(1, d - 2)], ([x, y]) => x !== y && x + y < d);
      const big = Math.max(a, b), sm = Math.min(a, b);
      const t = r.int(0, 4);
      const T = [
        { q: `一块蛋糕，${A}吃了 ${frac(a, d)}，${B}吃了 ${frac(b, d)}。两人一共吃了这块蛋糕的几分之几？`, v: a + b, s: ['求一共吃了几分之几，用加法', `${frac(a, d)} + ${frac(b, d)} = ${frac(a + b, d)}`], ans: `一共吃了 ${frac(a + b, d)}` },
        { q: `一张彩纸，${A}用了 ${frac(big, d)} 折小花，${B}用了 ${frac(sm, d)} 折小船。${A}比${B}多用了这张纸的几分之几？`, v: big - sm, s: ['求多用了几分之几，用减法', `${frac(big, d)} − ${frac(sm, d)} = ${frac(big - sm, d)}`], ans: `${A}多用了 ${frac(big - sm, d)}` },
        { q: `一个西瓜，爸爸吃了 ${frac(a, d)}。还剩这个西瓜的几分之几？`, v: d - a, s: [`把整个西瓜看作 1，也就是 ${frac(d, d)}`, `${frac(d, d)} − ${frac(a, d)} = ${frac(d - a, d)}`], ans: `还剩 ${frac(d - a, d)}` },
        { q: `修一条路，第一天修了全长的 ${frac(a, d)}，第二天修了全长的 ${frac(b, d)}。还剩全长的几分之几没修？`, v: d - a - b, s: [`先求两天一共修了：${frac(a, d)} + ${frac(b, d)} = ${frac(a + b, d)}`, `把全长看作 1，也就是 ${frac(d, d)}`, `还剩：${frac(d, d)} − ${frac(a + b, d)} = ${frac(d - a - b, d)}`], ans: `还剩 ${frac(d - a - b, d)} 没修` },
        { q: `一本故事书，${A}第一天读了 ${frac(a, d)}，第二天读了 ${frac(b, d)}。两天一共读了这本书的几分之几？`, v: a + b, s: ['求一共读了几分之几，用加法', `${frac(a, d)} + ${frac(b, d)} = ${frac(a + b, d)}`], ans: `两天一共读了 ${frac(a + b, d)}` },
      ][t];
      return { q: T.q, answer: [fr(T.v, d)], steps: [...T.s, `答：${T.ans}。`] };
    },
  },

  // ---------- 数学广角——集合 ----------
  {
    id: 'g3a-set-total', grade: 3, term: 1, unit: '数学广角——集合', name: '重叠问题：求总人数', process: true,
    tip: '两项都参加的人被算了两次，总人数 = 第一项 + 第二项 − 两项都参加的', level: 1,
    gen(r) {
      const p = r.pick(SET_PAIRS), a = r.int(8, 25), b = r.int(8, 25), c = r.int(2, Math.min(a, b) - 2), T = a + b - c;
      return {
        q: `三年级一班${p.x}的有 ${a} 人，${p.y}的有 ${b} 人，${p.both}的有 ${c} 人。${p.any}一共有多少人？`,
        fig: venn(`${p.xs} ${a}人`, `${p.ys} ${b}人`, `${c}人`),
        answer: [num(T, { unit: '人' })],
        steps: [`${p.both}的 ${c} 人，在 ${a} 人里算了一次，在 ${b} 人里又算了一次，多算了一次`, `总人数 = ${a} + ${b} − ${c}`, `${a} + ${b} − ${c} = ${T}（人）`, `答：一共有 ${T} 人。`],
        hint: '中间重叠的部分算了几次？',
      };
    },
  },
  {
    id: 'g3a-set-both', grade: 3, term: 1, unit: '数学广角——集合', name: '重叠问题：求两项都参加的', process: true,
    tip: '两项人数加起来比总人数多出来的，就是两项都参加的人数', level: 2,
    gen(r) {
      const p = r.pick(SET_PAIRS), a = r.int(10, 25), b = r.int(10, 25), c = r.int(2, Math.min(a, b) - 3), T = a + b - c;
      return {
        q: `三年级一班有 ${T} 人${p.any.replace('的', '')}，其中${p.x}的有 ${a} 人，${p.y}的有 ${b} 人。${p.both}的有多少人？`,
        fig: venn(`${p.xs} ${a}人`, `${p.ys} ${b}人`, '?人', `一共 ${T} 人`),
        answer: [num(c, { unit: '人' })],
        steps: [`把两项人数加起来：${a} + ${b} = ${a + b}（人）`, `${a + b} 比总人数 ${T} 多，多出来的是被算了两次的人`, `${a + b} − ${T} = ${c}（人）`, `答：${p.both}的有 ${c} 人。`],
      };
    },
  },
  {
    id: 'g3a-set-neither', grade: 3, term: 1, unit: '数学广角——集合', name: '重叠问题：求都不参加的', process: true,
    tip: '先求至少参加一项的人数（加起来减去重复的），再用全班人数去减', level: 2,
    gen(r) {
      const p = r.pick(SET_PAIRS), a = r.int(10, 22), b = r.int(10, 22), c = r.int(2, Math.min(a, b) - 3), U = a + b - c, N = U + r.int(2, 9);
      return {
        q: `三年级一班有 ${N} 人，${p.x}的有 ${a} 人，${p.y}的有 ${b} 人，${p.both}的有 ${c} 人。${p.none}的有多少人？`,
        fig: venn(`${p.xs} ${a}人`, `${p.ys} ${b}人`, `${c}人`, `全班 ${N} 人`),
        answer: [num(N - U, { unit: '人' })],
        steps: [`先求${p.any}：${a} + ${b} − ${c} = ${U}（人）`, `全班减去这些人，剩下的就是${p.none}的`, `${N} − ${U} = ${N - U}（人）`, `答：${p.none}的有 ${N - U} 人。`],
      };
    },
  },

  // ---------- 拓展（上册） ----------
  {
    id: 'g3a-ext-sum-diff', grade: 3, term: 1, unit: '拓展：和差问题', name: '和差问题', process: true,
    tip: '去掉多的部分，两个数就一样多：小数 = (和 − 差) ÷ 2，大数 = 小数 + 差', level: 3,
    gen(r) {
      const [A, B] = r.names(2), S = r.int(8, 45), D = r.int(2, 24), Bg = S + D, total = Bg + S;
      const t = r.pick([
        { q: `两筐苹果一共重 ${total} 千克，第一筐比第二筐多 ${D} 千克。两筐各重多少千克？`, x: '第一筐', y: '第二筐', u: '千克' },
        { q: `${A}和${B}一共有 ${total} 张邮票，${A}比${B}多 ${D} 张。两人各有多少张？`, x: A, y: B, u: '张' },
        { q: `三年级一班和二班一共有 ${total} 人，一班比二班多 ${D} 人。两个班各有多少人？`, x: '一班', y: '二班', u: '人' },
        { q: `一个长方形的长和宽加起来是 ${total} 厘米，长比宽多 ${D} 厘米。长和宽各是多少厘米？`, x: '长', y: '宽', u: '厘米' },
        { q: `图书角有故事书和科技书一共 ${total} 本，故事书比科技书多 ${D} 本。两种书各有多少本？`, x: '故事书', y: '科技书', u: '本' },
      ]);
      return {
        q: t.q,
        fig: fig.bars([{ label: t.x, units: 1, extra: 0.5, extraText: `多${D}${t.u}`, text: '?' }, { label: t.y, units: 1, text: '?' }], { unitW: 150 }),
        answer: [num(Bg, { unit: t.u, label: t.x }), num(S, { unit: t.u, label: t.y })],
        steps: [`看线段图：把${t.x}多的 ${D} ${t.u}去掉，两个就一样多`, `${total} − ${D} = ${2 * S}，这是 2 个${t.y}`, `${t.y}：${2 * S} ÷ 2 = ${S}（${t.u}）`, `${t.x}：${S} + ${D} = ${Bg}（${t.u}）`, `检查：${Bg} + ${S} = ${total}，${Bg} − ${S} = ${D} ✓`],
        hint: '如果多的那部分拿走，两个数会怎样？',
      };
    },
  },
  {
    id: 'g3a-ext-sum-times', grade: 3, term: 1, unit: '拓展：和倍问题', name: '和倍问题', process: true,
    tip: '把小的看作 1 份，大的是几份，合起来是（倍数 + 1）份：1 份 = 和 ÷ (倍数 + 1)', level: 3,
    gen(r) {
      const [A, B] = r.names(2), s = r.int(3, 9), k = r.int(2, 8), total = s * (k + 1);
      const t = r.pick([
        { q: `${A}和${B}一共有 ${total} 本书，${A}的本数是${B}的 ${k} 倍。两人各有多少本？`, x: A, y: B, u: '本' },
        { q: `鸡和鸭一共有 ${total} 只，鸭的只数是鸡的 ${k} 倍。鸡和鸭各有多少只？`, x: '鸭', y: '鸡', u: '只' },
        { q: `一个书包和一个文具盒一共 ${total} 元，书包的价钱是文具盒的 ${k} 倍。书包和文具盒各多少元？`, x: '书包', y: '文具盒', u: '元' },
        { q: `果园里梨树和桃树一共 ${total} 棵，梨树的棵数是桃树的 ${k} 倍。梨树和桃树各有多少棵？`, x: '梨树', y: '桃树', u: '棵' },
        { q: `${A}和${B}一共折了 ${total} 颗星星，${A}折的是${B}的 ${k} 倍。两人各折了多少颗？`, x: A, y: B, u: '颗' },
      ]);
      return {
        q: t.q,
        fig: fig.bars([{ label: t.x, units: k, text: '?' }, { label: t.y, units: 1, text: '?' }]),
        answer: [num(s * k, { unit: t.u, label: t.x }), num(s, { unit: t.u, label: t.y })],
        steps: [`把${t.y}看作 1 份，${t.x}是这样的 ${k} 份，合起来是 ${k} + 1 = ${k + 1}（份）`, `1 份：${total} ÷ ${k + 1} = ${s}（${t.u}），就是${t.y}的`, `${t.x}：${s} × ${k} = ${s * k}（${t.u}）`, `检查：${s * k} + ${s} = ${total} ✓`],
        hint: '一共有几份？',
      };
    },
  },
  {
    id: 'g3a-ext-unitary', grade: 3, term: 1, unit: '拓展：归一问题', name: '归一问题', process: true,
    tip: '先求“1 份”是多少（单价、每天、每小时……），再求要求的', level: 3,
    gen(r) {
      const n = r.name(), fwd = r.bool();
      const t = r.pick([
        { p: r.int(3, 9), one: '1 支钢笔多少元', u1: '元', u2: '支', f: (a, b, T) => `${a} 支同样的钢笔 ${T} 元，照这样，买 ${b} 支要多少元？`, g: (a, B, T) => `${a} 支同样的钢笔 ${T} 元，照这样，${B} 元能买几支？`, fa: (b, x) => `买 ${b} 支要 ${x} 元`, ga: (x) => `能买 ${x} 支` },
        { p: r.pick([20, 30, 40, 50]), one: '1 分钟打几个字', u1: '个', u2: '分钟', f: (a, b, T) => `${n} ${a} 分钟打了 ${T} 个字，照这样，${b} 分钟能打多少个字？`, g: (a, B, T) => `${n} ${a} 分钟打了 ${T} 个字，照这样，打 ${B} 个字要几分钟？`, fa: (b, x) => `${b} 分钟能打 ${x} 个字`, ga: (x) => `要 ${x} 分钟` },
        { p: r.int(5, 9), one: '1 箱重多少千克', u1: '千克', u2: '箱', f: (a, b, T) => `${a} 箱苹果重 ${T} 千克，照这样，${b} 箱苹果重多少千克？`, g: (a, B, T) => `${a} 箱苹果重 ${T} 千克，照这样，${B} 千克苹果能装几箱？`, fa: (b, x) => `${b} 箱重 ${x} 千克`, ga: (x) => `能装 ${x} 箱` },
        { p: r.int(6, 9), one: '1 天看几页', u1: '页', u2: '天', f: (a, b, T) => `${n} ${a} 天看了 ${T} 页书，照这样，${b} 天能看多少页？`, g: (a, B, T) => `${n} ${a} 天看了 ${T} 页书，照这样，看 ${B} 页要几天？`, fa: (b, x) => `${b} 天能看 ${x} 页`, ga: (x) => `要 ${x} 天` },
        { p: r.pick([30, 40, 50, 60, 70, 80, 90]), one: '1 个足球多少元', u1: '元', u2: '个', f: (a, b, T) => `${a} 个同样的足球 ${T} 元，照这样，买 ${b} 个要多少元？`, g: (a, B, T) => `${a} 个同样的足球 ${T} 元，照这样，${B} 元能买几个？`, fa: (b, x) => `买 ${b} 个要 ${x} 元`, ga: (x) => `能买 ${x} 个` },
      ]);
      const P = t.p, a = r.int(2, P >= 20 ? 4 : 9), b = r.until(() => r.int(2, 9), (x) => x !== a);
      const ans = fwd ? P * b : b;
      return {
        q: fwd ? t.f(a, b, a * P) : t.g(a, b * P, a * P),
        answer: [num(ans, { unit: fwd ? t.u1 : t.u2 })],
        steps: ['“照这样”说明每一份的量不变，先求 1 份', `先求${t.one}：${a * P} ÷ ${a} = ${P}（${t.u1}）`, fwd ? `再求 ${b} ${t.u2}的：${P} × ${b} = ${P * b}（${t.u1}）` : `再看 ${b * P} 里面有几个 ${P}：${b * P} ÷ ${P} = ${b}（${t.u2}）`, `答：${fwd ? t.fa(b, ans) : t.ga(ans)}。`],
        hint: `先算${t.one}`,
      };
    },
  },
  {
    id: 'g3a-ext-total', grade: 3, term: 1, unit: '拓展：归总问题', name: '归总问题', process: true,
    tip: '先求总量（每份数 × 份数），总量不变，再用总量除以新的每份数', level: 3,
    gen(r) {
      const [a, b, c] = r.until(() => { const x = r.int(2, 9), y = r.int(2, 9); return [x, y, r.int(2, 9)]; }, ([x, y, z]) => z !== x && z !== y && (x * y) % z === 0 && (x * y) / z <= 9 && (x * y) / z !== y);
      const T = a * b, ans = T / c, n = r.name();
      const t = r.pick([
        { q: `一批货物，每天运 ${a} 吨，${b} 天运完。如果每天运 ${c} 吨，几天能运完？`, tot: '这批货物', u0: '吨', u: '天', ans: '能运完' },
        { q: `同学们做操，每行站 ${a} 人，正好站 ${b} 行。如果每行站 ${c} 人，能站几行？`, tot: '总人数', u0: '人', u: '行', ans: '能站', pre: true },
        { q: `${n}看一本书，每天看 ${a * 2} 页，${b} 天看完。如果每天看 ${c * 2} 页，几天能看完？`, tot: '这本书', u0: '页', u: '天', two: true, ans: '能看完' },
        { q: `一筐梨装成小袋，每袋 ${a} 千克，正好装 ${b} 袋。如果每袋装 ${c} 千克，能装几袋？`, tot: '这筐梨', u0: '千克', u: '袋', ans: '能装', pre: true },
        { q: `修一条小路，每天修 ${a * 10} 米，${b} 天修完。如果每天修 ${c * 10} 米，几天能修完？`, tot: '这条路', u0: '米', u: '天', ten: true, ans: '能修完' },
      ]);
      const m = t.two ? 2 : t.ten ? 10 : 1;
      return {
        q: t.q,
        answer: [num(ans, { unit: t.u })],
        steps: [`先求${t.tot}一共多少：${a * m} × ${b} = ${T * m}（${t.u0}）`, '总量不变，再看里面有几个新的每份数', `${T * m} ÷ ${c * m} = ${ans}（${t.u}）`, `答：${t.pre ? `${t.ans} ${ans} ${t.u}` : `${ans} ${t.u}${t.ans}`}。`],
        hint: '先求一共有多少',
      };
    },
  },
];

const SHAPE_CTX = [
  { w: '一张纸片', u: '厘米', ask: '它的周长是多少厘米？' },
  { w: '一块木板', u: '分米', ask: '它的周长是多少分米？' },
  { w: '一块菜地', u: '米', ask: '沿着菜地走一圈是多少米？' },
  { w: '一个花坛', u: '米', ask: '花坛的周长是多少米？' },
  { w: '一块草坪', u: '米', ask: '在草坪四周围一圈栏杆，栏杆长多少米？' },
];
const SET_PAIRS = [
  { x: '参加语文小组', y: '参加数学小组', both: '两个小组都参加', any: '参加这两个小组的', none: '两个小组都没参加', xs: '语文小组', ys: '数学小组' },
  { x: '会跳绳', y: '会踢毽子', both: '两样都会', any: '至少会一样的', none: '两样都不会', xs: '跳绳', ys: '踢毽子' },
  { x: '喜欢吃苹果', y: '喜欢吃香蕉', both: '两种都喜欢', any: '至少喜欢一种的', none: '两种都不喜欢', xs: '苹果', ys: '香蕉' },
  { x: '订了《少年报》', y: '订了《童话报》', both: '两种报都订了', any: '至少订了一种报的', none: '两种报都没订', xs: '少年报', ys: '童话报' },
  { x: '参加合唱队', y: '参加舞蹈队', both: '两个队都参加', any: '参加这两个队的', none: '两个队都没参加', xs: '合唱队', ys: '舞蹈队' },
  { x: '会游泳', y: '会滑冰', both: '两样都会', any: '至少会一样的', none: '两样都不会', xs: '游泳', ys: '滑冰' },
];


// ================= 下册 =================
const D4 = ['北', '东', '南', '西']; // 顺时针
const D8 = ['东', '南', '西', '北', '东北', '西北', '东南', '西南'];
const OPP = { 东: '西', 西: '东', 南: '北', 北: '南', 东北: '西南', 西南: '东北', 西北: '东南', 东南: '西北' };
const POS_WORD = { 北: '正上方', 南: '正下方', 东: '右边', 西: '左边', 东北: '右上方', 西北: '左上方', 东南: '右下方', 西南: '左下方' };
const PLACES = ['图书馆', '医院', '超市', '体育馆', '邮局', '电影院', '书店', '银行', '动物园', '科技馆', '游乐场', '花店', '餐馆', '博物馆'];

const TERM2_A = [
  // ---------- 位置与方向（一） ----------
  {
    id: 'g3b-dir-face', grade: 3, term: 2, unit: '位置与方向（一）', name: '辨认东、南、西、北',
    tip: '东和西相对，南和北相对；面向北时，右边是东、左边是西、后面是南', level: 1,
    gen(r) {
      const n = r.name(), kind = r.int(0, 3);
      let f, head;
      if (kind === 0) { f = r.int(0, 3); head = `${n}面向${D4[f]}站立`; }
      else if (kind === 1) { f = 1; head = `早上，${n}面向太阳站立`; }
      else if (kind === 2) { f = 3; head = `傍晚，${n}面向太阳站立`; }
      else { f = r.int(0, 3); head = `${n}背对着${D4[(f + 2) % 4]}站立`; }
      const [askName, off] = kind === 3 ? r.pick([['前面', 0], ['左边', 3], ['右边', 1]]) : r.pick([['后面', 2], ['左边', 3], ['右边', 1]]);
      const v = D4[(f + off) % 4];
      const steps = [];
      if (kind === 1) steps.push('太阳从东方升起，早上面向太阳就是面向东');
      if (kind === 2) steps.push('太阳从西方落下，傍晚面向太阳就是面向西');
      if (kind === 3) steps.push(`背对着${D4[(f + 2) % 4]}，前面就是和它相对的${D4[f]}`);
      steps.push(`面向${D4[f]}：后面是${D4[(f + 2) % 4]}，右边是${D4[(f + 1) % 4]}，左边是${D4[(f + 3) % 4]}`, `所以${askName}是${v}`);
      return { q: `${head}，${askName}是 {0} 面。`, answer: [pick(['东', '南', '西', '北'], v)], steps, hint: '按“北→东→南→西”顺时针转一转' };
    },
  },
  {
    id: 'g3b-dir-map', grade: 3, term: 2, unit: '位置与方向（一）', name: '看地图辨认八个方向',
    tip: '地图上北下南、左西右东；右上方是东北，左上方是西北，右下方是东南，左下方是西南', level: 1,
    gen(r) {
      const center = r.pick(['学校', '广场', '少年宫', '公园']);
      const names = r.sample(PLACES, 8), places = {};
      Object.keys(DIR_POS).forEach((d, i) => { places[d] = names[i]; });
      const t = r.pick(Object.keys(DIR_POS));
      return {
        q: `看图回答：${places[t]}在${center}的 {0} 面。`,
        fig: mapFig(center, places),
        answer: [pick(D8, t)],
        steps: ['地图通常是“上北下南，左西右东”', `${places[t]}在${center}的${POS_WORD[t]}`, `${POS_WORD[t]}是${t}，所以${places[t]}在${center}的${t}面`],
        hint: '先找到中间的地点，再看要找的地点在它哪一边',
      };
    },
  },
  {
    id: 'g3b-dir-reverse', grade: 3, term: 2, unit: '位置与方向（一）', name: '相对方向（反过来说）',
    tip: '两个地方互相看，方向正好相反：东↔西，南↔北，东北↔西南，西北↔东南', level: 2,
    gen(r) {
      const [A, B] = r.sample(['学校', '公园', '小明家', '医院', '超市', '图书馆', '电影院', '少年宫', '体育馆', '邮局'], 2), d = r.pick(D8);
      return {
        q: `${A}在${B}的${d}面，那么${B}在${A}的 {0} 面。`,
        answer: [pick(D8, OPP[d])],
        steps: [`以${B}为中心看，${A}在${d}面`, `反过来以${A}为中心看${B}，方向正好相反`, `${d}的相反方向是${OPP[d]}，所以${B}在${A}的${OPP[d]}面`],
        hint: '换一个中心，方向会怎样变？',
      };
    },
  },
  {
    id: 'g3b-dir-route', grade: 3, term: 2, unit: '位置与方向（一）', name: '按路线找地点', 
    tip: '在地图上一步一步走：向东往右，向西往左，向北往上，向南往下', level: 2,
    gen(r) {
      const center = r.pick(['学校', '广场', '少年宫', '公园']);
      const names = r.sample(PLACES, 8), places = {};
      Object.keys(DIR_POS).forEach((d, i) => { places[d] = names[i]; });
      const first = r.pick(['东', '西', '南', '北']);
      const second = ['东', '西'].includes(first) ? r.pick(['南', '北']) : r.pick(['东', '西']);
      const H = ['东', '西'].includes(first) ? first : second, V = H === first ? second : first;
      const corner = H + V === '东北' ? '东北' : H + V === '西北' ? '西北' : H + V === '东南' ? '东南' : '西南';
      const opts = ['东北', '西北', '东南', '西南'].map((d) => places[d]);
      return {
        q: `看图：从${center}出发，先向${first}走到${places[first]}，再向${second}走，就到了 {0}。`,
        fig: mapFig(center, places),
        answer: [pick(opts, places[corner])],
        steps: [`从${center}向${first}走一格，到${places[first]}`, `再向${second}走一格（地图上是往${{ 东: '右', 西: '左', 南: '下', 北: '上' }[second]}），到了${center}的${corner}方向`, `那里是${places[corner]}`],
      };
    },
  },

  // ---------- 除数是一位数的除法 ----------
  {
    id: 'g3b-div-oral-round', grade: 3, term: 2, unit: '除数是一位数的除法', name: '整十、整百数除以一位数（口算）',
    tip: '把整十、整百数看成几个十、几个百，用乘法口诀想商：240 ÷ 6 → 24 个十 ÷ 6 = 4 个十', level: 1, speed: 6,
    gen(r) {
      const [d, q0, p] = r.until(() => [r.int(2, 9), r.int(1, 9), r.pick([1, 1, 2, 2, 3])], ([x, y, z]) => x * y * 10 ** z < 10000);
      const core = d * q0, n = core * 10 ** p, u = ['', '十', '百', '千'][p];
      return { q: `${n} ÷ ${d} = {0}`, answer: [num(n / d)], steps: [`${n} 是 ${core} 个${u}`, `想口诀：${core} ÷ ${d} = ${q0}`, `${core} 个${u} ÷ ${d} = ${q0} 个${u}，就是 ${n / d}`], hint: `${n} 里面有几个${u}？` };
    },
  },
  {
    id: 'g3b-div-oral-each', grade: 3, term: 2, unit: '除数是一位数的除法', name: '每一位都能除尽的口算除法',
    tip: '从高位起，每一位分别除以除数：69 ÷ 3 → 6 个十 ÷ 3 = 2 个十，9 ÷ 3 = 3', level: 1, speed: 8,
    gen(r) {
      const d = r.pick([2, 2, 3, 3, 4, r.int(2, 9)]), top = Math.floor(9 / d), three = r.chance(0.3);
      const ds = Array.from({ length: three ? 3 : 2 }, (_, i) => (i < (three ? 2 : 1) ? r.int(1, top) : r.int(0, top)) * d);
      if (three && ds[1] === 0 && r.bool()) ds[1] = d;
      const n = Number(ds.join('')), names = three ? ['百', '十', ''] : ['十', ''];
      const parts = ds.map((x, i) => `${x}${names[i] ? ` 个${names[i]}` : ''} ÷ ${d} = ${x / d}${names[i] ? ` 个${names[i]}` : ''}`);
      return { q: `${n} ÷ ${d} = {0}`, answer: [num(n / d)], steps: ['从高位除起，每一位都能直接除', ...parts, `合起来是 ${n / d}`] };
    },
  },
  {
    id: 'g3b-div-2d', grade: 3, term: 2, unit: '除数是一位数的除法', name: '两位数除以一位数（笔算）',
    tip: '从十位除起：十位上有余数，要和个位上的数合起来再除', level: 1,
    gen(r) {
      const [q, d] = r.until(() => [r.int(11, 49), r.int(2, 9)], ([x, y]) => x % 10 && x * y < 100 && Math.floor((x * y) / 10) >= y && Math.floor((x * y) / 10) % y !== 0);
      const n = q * d;
      return { q: `${n} ÷ ${d} = {0}`, answer: [num(q)], steps: ['列竖式，从十位除起', ...divCols(n, d), vDiv(n, d), `验算：${q} × ${d} = ${n} ✓`], hint: '十位上除完还剩几？要和个位合起来' };
    },
  },
  {
    id: 'g3b-div-3d-head', grade: 3, term: 2, unit: '除数是一位数的除法', name: '三位数除以一位数（首位够除）',
    tip: '百位够除，商就是三位数；除到哪一位，商就写在哪一位上面', level: 1,
    gen(r) {
      const [q, d] = r.until(() => [r.int(111, 499), r.int(2, 9)], ([x, y]) => digits(x).every((g) => g > 0) && x * y < 1000);
      const n = q * d;
      return { q: `${n} ÷ ${d} = {0}`, answer: [num(q)], steps: ['列竖式，从百位除起', ...divCols(n, d), vDiv(n, d), `验算：${q} × ${d} = ${n} ✓`] };
    },
  },
  {
    id: 'g3b-div-3d-nohead', grade: 3, term: 2, unit: '除数是一位数的除法', name: '三位数除以一位数（首位不够除）',
    tip: '百位不够除，就看前两位，商写在十位上，商是两位数', level: 1,
    gen(r) {
      const [q, d] = r.until(() => [r.int(12, 99), r.int(2, 9)], ([x, y]) => x % 10 && x * y >= 100 && x * y < 1000 && Math.floor((x * y) / 100) < y);
      const n = q * d;
      return { q: `${n} ÷ ${d} = {0}`, answer: [num(q)], steps: ['列竖式', ...divCols(n, d), vDiv(n, d), `验算：${q} × ${d} = ${n} ✓`], hint: '百位上的数比除数小，怎么办？' };
    },
  },
  {
    id: 'g3b-div-zero-mid', grade: 3, term: 2, unit: '除数是一位数的除法', name: '商中间有 0 的除法',
    tip: '哪一位不够商 1，就在那一位上商 0 占位，再把下一位落下来', level: 2,
    gen(r) {
      const [q, d] = r.until(() => [r.int(1, 4) * 100 + r.int(1, 9), r.int(2, 9)], ([x, y]) => x * y < 1000);
      const n = q * d;
      return { q: `${n} ÷ ${d} = {0}`, answer: [num(q)], steps: ['列竖式，从百位除起', ...divCols(n, d), vDiv(n, d), '易错：十位不够商 1 时要商 0，不能空着不写', `验算：${q} × ${d} = ${n} ✓`] };
    },
  },
  {
    id: 'g3b-div-zero-end', grade: 3, term: 2, unit: '除数是一位数的除法', name: '商末尾有 0 的除法',
    tip: '除到个位不够商 1 时，个位上要商 0，余下的数就是余数', level: 2,
    gen(r) {
      const [q, d, rem] = r.until(() => { const y = r.int(2, 9); return [r.pick([r.int(1, 9) * 10, r.int(11, 49) * 10]), y, r.chance(0.5) ? r.int(1, y - 1) : 0]; }, ([x, y, z]) => { const n = x * y + z; return n >= 100 && n < 1000 && (x % 100 !== 0) && digits(x / 10).every((g) => g > 0) && n % 10 < y; });
      const n = q * d + rem;
      const answer = rem ? [num(q, { label: '商' }), num(rem, { label: '余数' })] : [num(q)];
      return {
        q: rem ? `${n} ÷ ${d} = {0} …… {1}` : `${n} ÷ ${d} = {0}`,
        answer,
        steps: ['列竖式', ...divCols(n, d), vDiv(n, d), `易错：个位不够商 1，要在个位上商 0，商是 ${q}，不是 ${q / 10}`, `验算：${q} × ${d}${rem ? ` + ${rem}` : ''} = ${n} ✓`],
      };
    },
  },
  {
    id: 'g3b-div-rem', grade: 3, term: 2, unit: '除数是一位数的除法', name: '有余数的除法（笔算）',
    tip: '每一步的余数都要比除数小；最后的余数也一定比除数小', level: 1,
    gen(r) {
      const [q, d, rem] = r.until(() => { const y = r.int(3, 9); return [r.chance(0.4) ? r.int(11, 33) : r.int(23, 199), y, r.int(1, y - 1)]; }, ([x, y, z]) => digits(x).every((g) => g > 0) && x * y + z < 1000 && x * y + z >= 20);
      const n = q * d + rem;
      return {
        q: `${n} ÷ ${d} = {0} …… {1}`,
        answer: [num(q, { label: '商' }), num(rem, { label: '余数' })],
        steps: ['列竖式，从最高位除起', ...divCols(n, d), vDiv(n, d), `余数 ${rem} 比除数 ${d} 小 ✓`, `验算：${q} × ${d} + ${rem} = ${n} ✓`],
      };
    },
  },
  {
    id: 'g3b-div-digits', grade: 3, term: 2, unit: '除数是一位数的除法', name: '判断商是几位数',
    tip: '看被除数的最高位：比除数大或相等，商的位数和被除数一样多；比除数小，商就少一位', level: 2,
    gen(r) {
      const d = r.int(2, 9), len = r.chance(0.3) ? 4 : 3;
      const head = r.chance(0.5) ? r.int(1, d - 1) : r.int(d, 9);
      const n = Number(String(head) + Array.from({ length: len - 1 }, () => r.int(0, 9)).join(''));
      const enough = head >= d, ql = enough ? len : len - 1;
      const LEN = ['', '一位数', '两位数', '三位数', '四位数'], PL = ['', '个位', '十位', '百位', '千位'];
      const askTop = r.bool();
      const steps = [`被除数 ${n} 的最高位是 ${head}，${head} ${enough ? '≥' : '<'} ${d}`, enough ? `最高位够除，商的最高位在${PL[len]}上` : `最高位不够除，要看前两位，商的最高位在${PL[len - 1]}上`, `所以商是${LEN[ql]}`];
      return askTop
        ? { q: `${n} ÷ ${d} 的商的最高位在 {0} 上。`, answer: [pick(PL.slice(1, len + 1), PL[ql])], steps }
        : { q: `${n} ÷ ${d} 的商是 {0}。`, answer: [pick(LEN.slice(len - 1, len + 1), LEN[ql])], steps };
    },
  },
  {
    id: 'g3b-div-box', grade: 3, term: 2, unit: '除数是一位数的除法', name: '□里最大（最小）填几',
    tip: '商的位数看被除数最高位够不够除：要商少一位，□ 就要比除数小', level: 2,
    gen(r) {
      const d = r.int(3, 9), len = r.chance(0.25) ? 4 : 3, rest = Array.from({ length: len - 1 }, () => r.int(0, 9)).join('');
      const LEN = ['', '', '两位数', '三位数', '四位数'];
      if (r.bool()) {
        return { q: `□${rest} ÷ ${d}，要使商是${LEN[len]}，□ 里最小填 {0}。`, answer: [num(d)], steps: [`商是${LEN[len]}，和被除数位数一样多，说明最高位要够除`, `□ ≥ ${d}，最小填 ${d}`], hint: '最高位要不要够除？' };
      }
      return { q: `□${rest} ÷ ${d}，要使商是${LEN[len - 1]}，□ 里最大填 {0}。`, answer: [num(d - 1)], steps: [`商是${LEN[len - 1]}，比被除数少一位，说明最高位不够除`, `□ < ${d}，最大填 ${d - 1}`], hint: '最高位要不要够除？' };
    },
  },
  {
    id: 'g3b-div-estimate', grade: 3, term: 2, unit: '除数是一位数的除法', name: '除法估算',
    tip: '把被除数看成和它接近、又能用口诀直接除的整十（整百）数', level: 2, speed: 12,
    gen(r) {
      const [d, q0, p] = r.until(() => [r.int(3, 9), r.int(2, 9), r.pick([1, 1, 2])], ([x, y, z]) => x * y * 10 ** z < 1000 && x * y * 10 ** z >= 100);
      const m = d * q0 * 10 ** p, n = m + (r.bool() ? 1 : -1) * r.int(1, 4);
      return {
        q: `把被除数看成和它接近的整十（整百）数，估一估：\n${n} ÷ ${d} ≈ {0}`,
        answer: [num(m / d)],
        steps: [`${n} 接近 ${m}，${m} 正好能用口诀除以 ${d}`, `${m} ÷ ${d} = ${m / d}`, `所以 ${n} ÷ ${d} ≈ ${m / d}`],
        hint: `${n} 接近哪个能被 ${d} 整除的整十（整百）数？`,
      };
    },
  },
  {
    id: 'g3b-div-check', grade: 3, term: 2, unit: '除数是一位数的除法', name: '除法的验算（判断对错）',
    tip: '验算：商 × 除数 + 余数 = 被除数；还要看余数是不是比除数小', level: 2,
    gen(r) {
      const [q, d, rem] = r.until(() => { const y = r.int(3, 9); return [r.int(12, 199), y, r.int(1, y - 1)]; }, ([x, y, z]) => x * y + z < 1000 && x * y + z + y < 1000);
      const n = q * d + rem, kind = r.pick(['ok', 'bigrem', 'calc']);
      const [sq, sr] = kind === 'ok' ? [q, rem] : kind === 'bigrem' ? [q - 1, rem + d] : [q + r.pick([-1, 1]) * r.pick([1, 10]), rem];
      const back = sq * d + sr, ok = kind === 'ok';
      const steps = [`验算：${sq} × ${d} + ${sr} = ${back}`];
      if (back !== n) steps.push(`${back} ≠ ${n}，算错了`);
      else if (sr >= d) steps.push(`虽然 ${back} = ${n}，但余数 ${sr} 比除数 ${d} 还大，说明商小了，算错了`);
      else steps.push(`${back} = ${n}，余数 ${sr} 也比除数 ${d} 小，算对了`);
      steps.push(vDiv(n, d), `正确的是：${n} ÷ ${d} = ${q} …… ${rem}`);
      return {
        q: `${n} ÷ ${d} = ${sq} …… ${sr}\n算得对吗？{0}　正确结果：{1} …… {2}`,
        answer: [pick(['√', '×'], ok ? '√' : '×'), num(q, { label: '商' }), num(rem, { label: '余数' })],
        steps,
        hint: '用乘法验算，再看看余数',
      };
    },
  },
  {
    id: 'g3b-div-dividend', grade: 3, term: 2, unit: '除数是一位数的除法', name: '求被除数、最大余数',
    tip: '被除数 = 商 × 除数 + 余数；余数最大是除数 − 1', level: 2,
    gen(r) {
      const d = r.int(3, 9), q = r.int(12, 99);
      if (r.bool()) {
        const rem = r.int(1, d - 1);
        return { q: `{0} ÷ ${d} = ${q} …… ${rem}`, answer: [num(q * d + rem)], steps: ['被除数 = 商 × 除数 + 余数', `${q} × ${d} + ${rem} = ${q * d} + ${rem} = ${q * d + rem}`] };
      }
      return {
        q: `□ ÷ ${d} = ${q} …… △，△ 最大是 {0}，这时 □ 是 {1}。`,
        answer: [num(d - 1, { label: '△' }), num(q * d + d - 1, { label: '□' })],
        steps: [`余数一定比除数小，除数是 ${d}，余数最大是 ${d} − 1 = ${d - 1}`, `被除数 = 商 × 除数 + 余数：${q} × ${d} + ${d - 1} = ${q * d + d - 1}`],
        hint: '余数和除数比，谁大谁小？',
      };
    },
  },
  {
    id: 'g3b-div-word', grade: 3, term: 2, unit: '除数是一位数的除法', name: '除法解决问题（平均分）', process: true,
    tip: '把总数平均分成几份求每份，或者看总数里有几个每份数，都用除法', level: 1,
    gen(r) {
      const n = r.name();
      const t = r.pick([
        { lo: 12, hi: 120, q: (T, d) => `学校买来 ${T} 本练习本，平均分给 ${d} 个班。每个班分到多少本？`, rel: '每班分到的本数 = 总本数 ÷ 班数', u: '本', ans: (q) => `每个班分到 ${q} 本` },
        { lo: 12, hi: 45, q: (T, d) => `${n}看一本 ${T} 页的书，计划 ${d} 天看完。平均每天要看多少页？`, rel: '每天看的页数 = 总页数 ÷ 天数', u: '页', ans: (q) => `平均每天要看 ${q} 页` },
        { lo: 45, hi: 95, q: (T, d) => `一辆汽车 ${d} 小时行驶了 ${T} 千米，平均每小时行驶多少千米？`, rel: '每小时行的路程 = 总路程 ÷ 时间', u: '千米', ans: (q) => `平均每小时行驶 ${q} 千米` },
        { lo: 12, hi: 50, q: (T, d) => `果园摘了 ${T} 千克苹果，平均装在 ${d} 个筐里，每筐装多少千克？`, rel: '每筐的重量 = 总重量 ÷ 筐数', u: '千克', ans: (q) => `每筐装 ${q} 千克` },
        { lo: 12, hi: 150, q: (T, d) => `一根绳子长 ${T} 厘米，平均剪成 ${d} 段，每段长多少厘米？`, rel: '每段长 = 总长 ÷ 段数', u: '厘米', ans: (q) => `每段长 ${q} 厘米` },
        { lo: 12, hi: 40, q: (T, d) => `运动会有 ${T} 名同学参加团体操，每 ${d} 人站一排，可以站多少排？`, rel: '排数 = 总人数 ÷ 每排人数', u: '排', ans: (q) => `可以站 ${q} 排` },
      ]);
      const [d, q] = r.until(() => [r.int(2, 9), r.int(t.lo, t.hi)], ([x, y]) => x * y < 1000 && x * y >= 40);
      const T = q * d;
      return { q: t.q(T, d), answer: [num(q, { unit: t.u })], steps: [`找数量关系：${t.rel}`, `列式：${T} ÷ ${d} = ${q}（${t.u}）`, vDiv(T, d), `答：${t.ans(q)}。`] };
    },
  },
  {
    id: 'g3b-div-word-rem', grade: 3, term: 2, unit: '除数是一位数的除法', name: '有余数的解决问题（进一、去尾）', process: true,
    tip: '“至少需要几个”：余下的也要装（坐），商 + 1；“最多能买（做）几个”：余下的不够一个，直接舍去', level: 2,
    gen(r) {
      const n = r.name(), d = r.int(3, 9), q = r.int(5, 60), rem = r.int(1, d - 1), T = q * d + rem;
      const up = r.bool();
      const t = up
        ? r.pick([
          { q: `三年级有 ${T} 名同学去划船，每条船最多坐 ${d} 人。至少要租多少条船？`, u: '条', why: `还剩 ${rem} 人也要坐船，需要再租 1 条` },
          { q: `有 ${T} 千克大米，每袋装 ${d} 千克。至少需要多少个袋子才能装完？`, u: '个', why: `剩下的 ${rem} 千克也要装，需要再用 1 个袋子` },
          { q: `${T} 名同学去春游，每辆面包车最多坐 ${d} 人。至少需要多少辆面包车？`, u: '辆', why: `还剩 ${rem} 人也要坐车，需要再加 1 辆` },
          { q: `图书室要把 ${T} 本书装进箱子，每箱装 ${d} 本。至少需要多少个箱子？`, u: '个', why: `剩下的 ${rem} 本也要装，需要再加 1 个箱子` },
        ])
        : r.pick([
          { q: `${n}有 ${T} 元，一个文具盒 ${d} 元。最多能买多少个文具盒？`, u: '个', why: `剩下的 ${rem} 元不够再买 1 个，舍去` },
          { q: `有 ${T} 米布，做一套衣服用 ${d} 米。最多能做多少套？`, u: '套', why: `剩下的 ${rem} 米不够做 1 套，舍去` },
          { q: `有 ${T} 个鸡蛋，每盒装 ${d} 个，能装满多少盒？`, u: '盒', why: `剩下的 ${rem} 个装不满 1 盒，舍去` },
          { q: `${n}有 ${T} 张贴画，每 ${d} 张贴满一页，能贴满多少页？`, u: '页', why: `剩下的 ${rem} 张贴不满 1 页，舍去` },
        ]);
      const ans = up ? q + 1 : q;
      return { q: t.q, answer: [num(ans, { unit: t.u })], steps: [`${T} ÷ ${d} = ${q} …… ${rem}`, t.why, up ? `${q} + 1 = ${ans}（${t.u}）` : `所以是 ${q} ${t.u}`, `答：${up ? '至少需要' : '最多'} ${ans} ${t.u}。`], hint: '余下的部分要不要算上？' };
    },
  },
  {
    id: 'g3b-div-two-step', grade: 3, term: 2, unit: '除数是一位数的除法', name: '连除解决问题', process: true,
    tip: '一步一步平均分：先求每一大份，再求每一小份；也可以先求一共有几小份', level: 2,
    gen(r) {
      const n = r.name(), a = r.int(2, 4), b = r.int(2, 5), x = r.until(() => r.int(3, 40), (v) => v * a * b < 1000 && v * a * b >= 60), T = a * b * x;
      const t = r.pick([
        { q: `学校买来 ${T} 本书，平均分给 ${a} 个年级，每个年级又平均分给 ${b} 个班。每个班分到多少本？`, s1: `每个年级分到：${T} ÷ ${a} = ${T / a}（本）`, s2: `每个班分到：${T / a} ÷ ${b} = ${x}（本）`, alt: `一共有 ${a} × ${b} = ${a * b} 个班`, u: '本', ans: '每个班分到' },
        { q: `${a} 个同学 ${b} 天一共折了 ${T} 只纸鹤。平均每人每天折多少只？`, s1: `平均每人折：${T} ÷ ${a} = ${T / a}（只）`, s2: `每人每天折：${T / a} ÷ ${b} = ${x}（只）`, alt: `一共是 ${a} × ${b} = ${a * b} 个“一人一天”`, u: '只', ans: '平均每人每天折' },
        { q: `妈妈买了 ${a} 套同样的书，每套 ${b} 本，一共花了 ${T} 元。平均每本书多少元？`, s1: `每套：${T} ÷ ${a} = ${T / a}（元）`, s2: `每本：${T / a} ÷ ${b} = ${x}（元）`, alt: `一共买了 ${a} × ${b} = ${a * b} 本`, u: '元', ans: '平均每本' },
        { q: `${a} 辆同样的卡车 ${b} 次一共运了 ${T} 吨沙子。平均每辆车每次运多少吨？`, s1: `每辆车运了：${T} ÷ ${a} = ${T / a}（吨）`, s2: `每辆每次运：${T / a} ÷ ${b} = ${x}（吨）`, alt: `一共运了 ${a} × ${b} = ${a * b} 车次`, u: '吨', ans: '平均每辆车每次运' },
      ]);
      return { q: t.q, answer: [num(x, { unit: t.u })], steps: [t.s1, t.s2, ...(a * b <= 9 ? [`也可以：${t.alt}，${T} ÷ ${a * b} = ${x}（${t.u}）`] : []), `答：${t.ans} ${x} ${t.u}。`] };
    },
  },

  // ---------- 复式统计表 ----------
  {
    id: 'g3b-stat-table', grade: 3, term: 2, unit: '复式统计表', name: '读复式统计表',
    tip: '先看清表头：横着一行是同一项，竖着一列是同一组；再按问题找数、计算', level: 1, process: true,
    gen(r) {
      const t = r.pick([
        { title: '三年级各班男、女生人数', rowW: '班', u: '人', rows: ['三（1）班', '三（2）班', '三（3）班', '三（4）班'], cols: ['男生', '女生'], lo: 15, hi: 25 },
        { title: '三（1）班同学最喜欢的运动', rowW: '项运动', u: '人', rows: ['跳绳', '踢毽子', '篮球', '足球'], cols: ['男生', '女生'], lo: 2, hi: 12 },
        { title: '两家水果店一天卖出的水果（千克）', rowW: '种水果', u: '千克', rows: ['苹果', '香蕉', '梨', '橘子'], cols: ['东店', '西店'], lo: 25, hi: 90 },
        { title: '两个小组收集的废电池（节）', rowW: '周', u: '节', rows: ['第一周', '第二周', '第三周'], cols: ['一组', '二组'], lo: 12, hi: 40 },
        { title: '一、二年级借书情况（本）', rowW: '类书', u: '本', rows: ['故事书', '科技书', '连环画'], cols: ['一年级', '二年级'], lo: 20, hi: 75 },
      ]);
      const data = r.until(() => t.rows.map(() => t.cols.map(() => r.int(t.lo, t.hi))), (D) => t.cols.every((_, j) => { const col = D.map((row) => row[j]); return col.filter((v) => v === Math.max(...col)).length === 1; }) && D.every((row) => row[0] !== row[1]));
      const fig2 = tableFig(t.title, ['', ...t.cols], t.rows.map((name, i) => [name, ...data[i]]));
      const Q = [];
      const i = r.int(0, t.rows.length - 1), j = r.int(0, 1);
      Q.push({ q: `${t.rows[i]}一共有多少${t.u}？`, a: num(data[i][0] + data[i][1], { unit: t.u }), s: `${t.rows[i]}：${data[i][0]} + ${data[i][1]} = ${data[i][0] + data[i][1]}（${t.u}）` });
      const col = data.map((row) => row[j]), mx = col.indexOf(Math.max(...col));
      Q.push(r.bool()
        ? { q: `${t.cols[j]}里，哪一${t.rowW}最多？`, a: pick(t.rows, t.rows[mx]), s: `看${t.cols[j]}这一列：${col.join('、')}，最大的是 ${col[mx]}，是${t.rows[mx]}` }
        : { q: `${t.cols[j]}一共有多少${t.u}？`, a: num(col.reduce((x, y) => x + y, 0), { unit: t.u }), s: `${t.cols[j]}这一列加起来：${col.join(' + ')} = ${col.reduce((x, y) => x + y, 0)}（${t.u}）` });
      const k = r.until(() => r.int(0, t.rows.length - 1), (x) => x !== i), [b1, b2] = data[k][0] > data[k][1] ? [0, 1] : [1, 0];
      Q.push({ q: `${t.rows[k]}${t.cols[b1]}比${t.cols[b2]}多多少${t.u}？`, a: num(data[k][b1] - data[k][b2], { unit: t.u }), s: `${t.rows[k]}这一行：${data[k][b1]} − ${data[k][b2]} = ${data[k][b1] - data[k][b2]}（${t.u}）` });
      const use = r.sample([0, 1, 2], 2).sort();
      return {
        q: `看统计表回答：\n① ${Q[use[0]].q}{0}\n② ${Q[use[1]].q}{1}`,
        fig: fig2,
        answer: [Q[use[0]].a, Q[use[1]].a],
        steps: ['先看表头：每一行是一' + t.rowW + '，每一列是' + t.cols.join('或'), `① ${Q[use[0]].s}`, `② ${Q[use[1]].s}`],
      };
    },
  },

  // ---------- 两位数乘两位数 ----------
  {
    id: 'g3b-mul-oral-tens', grade: 3, term: 2, unit: '两位数乘两位数', name: '整十数乘整十数（口算）',
    tip: '先把 0 前面的数相乘，再看两个因数末尾一共有几个 0，就在积的末尾添几个 0', level: 1, speed: 5,
    gen(r) {
      const x = r.int(1, 9), y = r.int(2, 9), a = x * 10, b = y * 10, z = tailZeros(a * b);
      const steps = [`先算 ${x} × ${y} = ${x * y}`, `两个因数末尾一共有 2 个 0，在 ${x * y} 后面添 2 个 0：${a * b}`];
      if ((x * y) % 10 === 0) steps.push(`注意：${x * y} 本身末尾有 0，所以积的末尾一共有 ${z} 个 0`);
      return { q: r.bool() ? `${a} × ${b} = {0}` : `${b} × ${a} = {0}`, answer: [num(a * b)], steps };
    },
  },
  {
    id: 'g3b-mul-oral-2dx10', grade: 3, term: 2, unit: '两位数乘两位数', name: '两位数乘整十数（口算）',
    tip: '先算两位数乘 0 前面的一位数，再在积的末尾添一个 0：14 × 20 → 14 × 2 = 28 → 280', level: 1, speed: 8,
    gen(r) {
      const [a, y] = r.until(() => [r.int(11, 49), r.int(2, 9)], ([p, q]) => p % 10 && p * q <= 200);
      const b = y * 10, t = a - (a % 10), o = a % 10;
      return { q: r.bool() ? `${a} × ${b} = {0}` : `${b} × ${a} = {0}`, answer: [num(a * b)], steps: [`先算 ${a} × ${y}：${t} × ${y} = ${t * y}，${o} × ${y} = ${o * y}，合起来 ${a * y}`, `${b} 末尾有 1 个 0，在 ${a * y} 后面添 1 个 0：${a * b}`] };
    },
  },
  {
    id: 'g3b-mul-2d-nocarry', grade: 3, term: 2, unit: '两位数乘两位数', name: '两位数乘两位数（不进位）',
    tip: '先用个位去乘，再用十位去乘（积的末位和十位对齐），最后把两次的积加起来', level: 1,
    gen(r) {
      const [a, b] = r.until(() => [r.int(11, 44), r.int(11, 44)], ([x, y]) => digits(x).every((g) => g > 0) && digits(y).every((g) => g > 0) && digits(y).every((m) => digits(x).every((g) => g * m < 10)));
      const b1 = b % 10, b10 = Math.floor(b / 10);
      return { q: `${a} × ${b} = {0}`, answer: [num(a * b)], steps: [`先用个位上的 ${b1} 去乘 ${a}：${a} × ${b1} = ${a * b1}`, `再用十位上的 ${b10} 去乘 ${a}：${a} × ${b10} = ${a * b10}，表示 ${a * b10} 个十，末位写在十位上`, `最后把两次的积相加：${a * b1} + ${a * b10 * 10} = ${a * b}`, vMul(a, b)] };
    },
  },
  {
    id: 'g3b-mul-2d-carry', grade: 3, term: 2, unit: '两位数乘两位数', name: '两位数乘两位数（进位）',
    tip: '每次乘的时候满几十就向前一位进几；用十位乘得的积，末位要和十位对齐', level: 1,
    gen(r) {
      const [a, b] = r.until(() => [r.int(12, 98), r.int(12, 98)], ([x, y]) => x % 10 && y % 10 && y >= 13 && (mulCarryCols(x, y % 10).some((c) => c) || mulCarryCols(x, Math.floor(y / 10)).some((c) => c)) && x * y < 10000);
      const b1 = b % 10, b10 = Math.floor(b / 10);
      return { q: `${a} × ${b} = {0}`, answer: [num(a * b)], steps: [`先用个位上的 ${b1} 去乘 ${a}：${a} × ${b1} = ${a * b1}`, `再用十位上的 ${b10} 去乘 ${a}：${a} × ${b10} = ${a * b10}，表示 ${a * b10} 个十，末位写在十位上`, `最后把两次的积相加：${a * b1} + ${a * b10 * 10} = ${a * b}`, vMul(a, b), '易错：第二次乘得的积要从十位写起，不能和个位对齐'] };
    },
  },
  {
    id: 'g3b-mul-2d-estimate', grade: 3, term: 2, unit: '两位数乘两位数', name: '两位数乘两位数的估算',
    tip: '把两个因数都看成和它接近的整十数，再口算', level: 2, speed: 10,
    gen(r) {
      const near = () => r.until(() => r.int(12, 98), (x) => x % 10 !== 5 && x % 10 !== 0);
      const a = near(), b = near(), ra = Math.round(a / 10) * 10, rb = Math.round(b / 10) * 10;
      return {
        q: `把两个因数都看成接近的整十数，估一估：\n${a} × ${b} ≈ {0}`,
        answer: [num(ra * rb)],
        steps: [`${a} 接近 ${ra}，${b} 接近 ${rb}`, `${ra} × ${rb} = ${ra * rb}`, `所以 ${a} × ${b} ≈ ${ra * rb}（准确得数是 ${a * b}）`],
        hint: '两个因数各接近哪个整十数？',
      };
    },
  },
  {
    id: 'g3b-mul-2d-word', grade: 3, term: 2, unit: '两位数乘两位数', name: '两位数乘两位数解决问题', process: true,
    tip: '每份数 × 份数 = 总数；单价 × 数量 = 总价', level: 1,
    gen(r) {
      const n = r.name();
      const t = r.pick([
        { a: r.int(12, 36), b: r.int(12, 30), q: (a, b) => `一箱牛奶有 ${a} 盒，学校食堂买了 ${b} 箱。一共有多少盒？`, rel: '每箱盒数 × 箱数 = 总盒数', u: '盒', ans: '一共有' },
        { a: r.int(18, 45), b: r.int(12, 28), q: (a, b) => `电影院每排有 ${a} 个座位，一共有 ${b} 排。电影院一共有多少个座位？`, rel: '每排座位数 × 排数 = 总座位数', u: '个', ans: '一共有' },
        { a: r.int(12, 48), b: r.int(11, 35), q: (a, b) => `一本字典 ${a} 元，学校买了 ${b} 本。一共要花多少元？`, rel: '单价 × 数量 = 总价', u: '元', ans: '一共要花' },
        { a: r.int(25, 60), b: r.int(11, 20), q: (a, b) => `${n}每分钟能打 ${a} 个字，${b} 分钟能打多少个字？`, rel: '每分钟打的字数 × 分钟数 = 总字数', u: '个', ans: '能打' },
        { a: r.int(15, 45), b: 12, q: (a) => `${n}每个月存 ${a} 元零花钱，一年能存多少元？`, rel: '每月存的钱 × 月数 = 一年存的钱（一年有 12 个月）', u: '元', ans: '一年能存' },
        { a: r.int(35, 55), b: r.int(11, 25), q: (a, b) => `一辆大客车能坐 ${a} 人，学校租了 ${b} 辆。一共能坐多少人？`, rel: '每辆坐的人数 × 辆数 = 总人数', u: '人', ans: '一共能坐' },
      ]);
      if (t.b % 10 === 0) t.b += 1;
      return { q: t.q(t.a, t.b), answer: [num(t.a * t.b, { unit: t.u })], steps: [`找数量关系：${t.rel}`, `列式：${t.a} × ${t.b} = ${t.a * t.b}（${t.u}）`, vMul(t.a, t.b), `答：${t.ans} ${t.a * t.b} ${t.u}。`] };
    },
  },
  {
    id: 'g3b-mul-chain', grade: 3, term: 2, unit: '两位数乘两位数', name: '连乘解决问题', process: true,
    tip: '先求一个中间量（每一大份有多少），再乘大份数；也可以先求一共有几小份', level: 2,
    gen(r) {
      const t = r.pick([
        { a: r.int(6, 12), b: r.int(6, 12), c: r.int(2, 6), q: (a, b, c) => `运动会上，每个方队有 ${b} 行，每行 ${a} 人。${c} 个方队一共有多少人？`, m: (a, b) => `每个方队：${a} × ${b} = ${a * b}（人）`, alt: (b, c) => `${c} 个方队一共有 ${b} × ${c} = ${b * c} 行`, u: '人' },
        { a: r.int(6, 12), b: r.int(8, 20), c: r.int(2, 8), q: (a, b, c) => `一盒饼干有 ${a} 块，一箱装 ${b} 盒。${c} 箱一共有多少块饼干？`, m: (a, b) => `一箱有：${a} × ${b} = ${a * b}（块）`, alt: (b, c) => `${c} 箱一共有 ${b} × ${c} = ${b * c} 盒`, u: '块' },
        { a: r.int(3, 9), b: r.int(10, 24), c: r.int(2, 9), q: (a, b, c) => `学校有 ${c} 层教学楼，每层有 ${b} 间教室，每间教室装 ${a} 盏灯。一共装了多少盏灯？`, m: (a, b) => `每层有：${a} × ${b} = ${a * b}（盏）`, alt: (b, c) => `一共有 ${b} × ${c} = ${b * c} 间教室`, u: '盏' },
        { a: r.int(12, 25), b: r.int(3, 6), c: r.int(2, 9), q: (a, b, c) => `一本故事书 ${a} 元，一套有 ${b} 本。买 ${c} 套一共要多少元？`, m: (a, b) => `一套：${a} × ${b} = ${a * b}（元）`, alt: (b, c) => `${c} 套一共有 ${b} × ${c} = ${b * c} 本`, u: '元' },
      ]);
      const { a, b, c } = t, T = a * b * c;
      return { q: t.q(a, b, c), answer: [num(T, { unit: t.u })], steps: [`先求一份：${t.m(a, b)}`, `再求 ${c} 份：${a * b} × ${c} = ${T}（${t.u}）`, `也可以：${t.alt(b, c)}，${a} × ${b * c} = ${T}（${t.u}）`, `答：一共 ${T} ${t.u}。`] };
    },
  },
];


const MONTH_DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const mdays = (y, m) => (m === 2 && isLeap(y) ? 29 : MONTH_DAYS[m]);
const WEEK = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
/** 一位小数加减的逐位讲解 */
function decCols(a, b, op) {
  const A = Math.round(a * 10), B = Math.round(b * 10), ia = Math.floor(A / 10), ta = A % 10, ib = Math.floor(B / 10), tb = B % 10;
  if (op === '+') {
    const s1 = ta + tb, c = s1 >= 10 ? 1 : 0;
    return [`十分位：${ta} + ${tb} = ${s1}${c ? `，写 ${s1 - 10}，向个位进 1` : ''}`, `整数部分：${ia} + ${ib}${c ? ' + 进上来的 1' : ''} = ${ia + ib + c}`];
  }
  const br = ta < tb ? 1 : 0;
  return [br ? `十分位：${ta} 减 ${tb} 不够减，从个位退 1，${ta + 10} − ${tb} = ${ta + 10 - tb}` : `十分位：${ta} − ${tb} = ${ta - tb}`, `整数部分：${br ? `${ia} 被退走 1 剩 ${ia - 1}，` : ''}${ia - br} − ${ib} = ${ia - br - ib}`];
}

const TERM2_B = [
  // ---------- 面积 ----------
  {
    id: 'g3b-area-count', grade: 3, term: 2, unit: '面积', name: '数方格求面积',
    tip: '每个小方格是 1 个面积单位，图形占了几个小方格，面积就是多少', level: 1,
    gen(r) {
      const rows = 5, cols = 7, size = r.int(5, 14), u = r.pick(['厘米', '分米', '米']);
      const cells = [[r.int(1, 3), r.int(2, 4)]], has = (rc) => cells.some(([a, b]) => a === rc[0] && b === rc[1]);
      while (cells.length < size) {
        const [a, b] = r.pick(cells), [da, db] = r.pick([[0, 1], [1, 0], [0, -1], [-1, 0]]), nc = [a + da, b + db];
        if (nc[0] >= 0 && nc[0] < rows && nc[1] >= 0 && nc[1] < cols && !has(nc)) cells.push(nc);
      }
      const byRow = [];
      for (let i = 0; i < rows; i++) { const k = cells.filter(([a]) => a === i).length; if (k) byRow.push(k); }
      return {
        q: `每个小方格的边长是 1 ${u}，涂色图形的面积是多少平方${u}？`,
        fig: gridFig(rows, cols, cells),
        answer: [num(size, { unit: `平方${u}` })],
        steps: [`边长 1 ${u}的小方格，面积是 1 平方${u}`, `一行一行地数：${byRow.join(' + ')} = ${size}（个）`, `图形占了 ${size} 个小方格，面积是 ${size} 平方${u}`],
        hint: '一行一行地数，不重复也不漏',
      };
    },
  },
  {
    id: 'g3b-area-unit-choice', grade: 3, term: 2, unit: '面积', name: '填合适的长度或面积单位',
    tip: '量线的长短用长度单位，量面的大小用面积单位；再用指甲盖（1 平方厘米）、手掌（约 1 平方分米）比一比', level: 1, pool: 22,
    gen(r) {
      const items = [
        ['一张邮票的面积约 6', '平方厘米', '邮票比几个指甲盖大一点'], ['指甲盖的面积约 1', '平方厘米', '1 平方厘米大约就是一个指甲盖'], ['一枚 1 元硬币的面积约 5', '平方厘米', '硬币面大约 5 个指甲盖那么大'], ['一张银行卡的面积约 46', '平方厘米', '银行卡比手掌小，用平方厘米'],
        ['课桌面的面积约 24', '平方分米', '课桌面大约有 24 个手掌那么大'], ['数学书封面的面积约 5', '平方分米', '书的封面大约 5 个手掌大'], ['一块手帕的面积约 4', '平方分米', '手帕大约 4 个手掌大'], ['一块正方形地砖的面积约 36', '平方分米', '地砖边长 6 分米，面积用平方分米'], ['电脑屏幕的面积约 15', '平方分米', '屏幕比手掌大得多，又不到 1 平方米'],
        ['教室地面的面积约 60', '平方米', '教室地面很大，用平方米'], ['篮球场的面积约 420', '平方米', '篮球场很大，用平方米'], ['小明家客厅的面积约 30', '平方米', '客厅地面很大，用平方米'], ['黑板面的面积约 4', '平方米', '黑板面比 1 平方米大好几倍'], ['一间卧室的面积约 15', '平方米', '卧室地面用平方米'],
        ['课桌高约 7', '分米', '高矮是长度，不是面积'], ['黑板长约 4', '米', '长是长度，用长度单位'], ['一块橡皮长约 4', '厘米', '长是长度，用长度单位'], ['教室门高约 2', '米', '高是长度，用长度单位'], ['数学书封面的周长约 9', '分米', '周长是长度，用长度单位'],
        ['一张床的面积约 2', '平方米', '床面大约 2 平方米'], ['操场的周长约 400', '米', '周长是长度，用长度单位'], ['手掌的面积约 1', '平方分米', '1 平方分米大约就是一个手掌'],
      ];
      const [q, a, why] = r.pick(items);
      return { q: `${q}（　）。`, answer: [pick(['厘米', '分米', '米', '平方厘米', '平方分米', '平方米'], a)], steps: [a.startsWith('平方') ? '问的是面的大小，用面积单位' : '问的是长度（长、高、周长），用长度单位', why, `所以填“${a}”`] };
    },
  },
  {
    id: 'g3b-area-rect', grade: 3, term: 2, unit: '面积', name: '长方形的面积',
    tip: '长方形的面积 = 长 × 宽，面积单位要写“平方”', level: 1,
    gen(r) {
      const u = r.pick(['厘米', '分米', '米']), [l, w] = r.until(() => [r.int(3, 30), r.int(2, 20)], ([x, y]) => x > y && x * y <= 600), useFig = r.chance(0.6);
      return {
        q: useFig ? '求这个长方形的面积。' : `一个长方形长 ${l} ${u}，宽 ${w} ${u}，它的面积是多少？`,
        fig: useFig ? rectFig(l, w, `${l}${u}`, `${w}${u}`) : undefined,
        answer: [num(l * w, { unit: `平方${u}` })],
        steps: ['长方形的面积 = 长 × 宽', `${l} × ${w} = ${l * w}（平方${u}）`, `易错：面积单位是“平方${u}”，不是“${u}”`],
      };
    },
  },
  {
    id: 'g3b-area-square', grade: 3, term: 2, unit: '面积', name: '正方形的面积',
    tip: '正方形的面积 = 边长 × 边长', level: 1, speed: 10,
    gen(r) {
      const u = r.pick(['厘米', '分米', '米']), a = r.int(2, 20), useFig = r.chance(0.6);
      return {
        q: useFig ? '求这个正方形的面积。' : `一个正方形的边长是 ${a} ${u}，它的面积是多少？`,
        fig: useFig ? rectFig(1, 1, `${a}${u}`, '') : undefined,
        answer: [num(a * a, { unit: `平方${u}` })],
        steps: ['正方形的面积 = 边长 × 边长', `${a} × ${a} = ${a * a}（平方${u}）`, `易错：不要和周长（边长 × 4 = ${4 * a}）弄混`],
      };
    },
  },
  {
    id: 'g3b-area-to-side', grade: 3, term: 2, unit: '面积', name: '已知面积求边长', process: true,
    tip: '长方形：宽 = 面积 ÷ 长；正方形：想几乘几等于面积', level: 2,
    gen(r) {
      const u = r.pick(['厘米', '分米', '米']);
      if (r.chance(0.65)) {
        const k = r.int(2, 9), x = r.int(3, 30), A = k * x, knowLong = x < k, askW = r.bool();
        const [l, w] = knowLong ? [k, x] : [x, k];
        const known = askW ? l : w;
        if (known !== k) return { q: `一个长方形的面积是 ${A} 平方${u}，${askW ? '宽' : '长'}是 ${k} ${u}，${askW ? '长' : '宽'}是多少${u}？`, fig: rectFig(l, w, askW ? '?' : `${l}${u}`, askW ? `${w}${u}` : '?'), answer: [num(x, { unit: u })], steps: ['长方形的面积 = 长 × 宽', `所以 ${askW ? '长' : '宽'} = 面积 ÷ ${askW ? '宽' : '长'}`, `${A} ÷ ${k} = ${x}（${u}）`, `检查：${l} × ${w} = ${A} ✓`] };
        return { q: `一个长方形的面积是 ${A} 平方${u}，${askW ? '长' : '宽'}是 ${k} ${u}，${askW ? '宽' : '长'}是多少${u}？`, fig: rectFig(l, w, askW ? `${l}${u}` : '?', askW ? '?' : `${w}${u}`), answer: [num(x, { unit: u })], steps: ['长方形的面积 = 长 × 宽', `所以 ${askW ? '宽' : '长'} = 面积 ÷ ${askW ? '长' : '宽'}`, `${A} ÷ ${k} = ${x}（${u}）`, `检查：${l} × ${w} = ${A} ✓`] };
      }
      const a = r.int(2, 10);
      return { q: `一个正方形的面积是 ${a * a} 平方${u}，它的边长是多少${u}？`, answer: [num(a, { unit: u })], steps: ['正方形的面积 = 边长 × 边长', `想：几乘几等于 ${a * a}？${a} × ${a} = ${a * a}`, `所以边长是 ${a} ${u}`], hint: '两个相同的数相乘' };
    },
  },
  {
    id: 'g3b-area-vs-perim', grade: 3, term: 2, unit: '面积', name: '周长和面积对比',
    tip: '周长是一圈边线的长度（用长度单位），面积是面的大小（用面积单位），算法也不同', level: 2,
    gen(r) {
      const u = r.pick(['厘米', '分米', '米']);
      if (r.chance(0.65)) {
        const [l, w] = r.until(() => [r.int(3, 20), r.int(2, 15)], ([x, y]) => x > y);
        return { q: '求这个长方形的周长和面积。', fig: rectFig(l, w, `${l}${u}`, `${w}${u}`), answer: [num(2 * (l + w), { unit: u, label: '周长' }), num(l * w, { unit: `平方${u}`, label: '面积' })], steps: [`周长 = (长 + 宽) × 2 = (${l} + ${w}) × 2 = ${2 * (l + w)}（${u}）`, `面积 = 长 × 宽 = ${l} × ${w} = ${l * w}（平方${u}）`, `周长的单位是${u}，面积的单位是平方${u}，不能混`] };
      }
      const a = r.int(2, 15);
      return { q: '求这个正方形的周长和面积。', fig: rectFig(1, 1, `${a}${u}`, ''), answer: [num(4 * a, { unit: u, label: '周长' }), num(a * a, { unit: `平方${u}`, label: '面积' })], steps: [`周长 = 边长 × 4 = ${a} × 4 = ${4 * a}（${u}）`, `面积 = 边长 × 边长 = ${a} × ${a} = ${a * a}（平方${u}）`, `周长的单位是${u}，面积的单位是平方${u}，不能混`] };
    },
  },
  {
    id: 'g3b-area-convert', grade: 3, term: 2, unit: '面积', name: '面积单位换算',
    tip: '相邻两个面积单位的进率是 100：1 平方米 = 100 平方分米，1 平方分米 = 100 平方厘米', level: 1, speed: 8,
    gen(r) {
      const k = r.int(2, 9);
      const t = r.pick([
        { q: `${k} 平方米 = {0} 平方分米`, a: k * 100, s: ['1 平方米 = 100 平方分米', `${k} 平方米 = ${k} 个 100 平方分米 = ${k * 100} 平方分米`] },
        { q: `${k} 平方分米 = {0} 平方厘米`, a: k * 100, s: ['1 平方分米 = 100 平方厘米', `${k} 平方分米 = ${k * 100} 平方厘米`] },
        { q: `${k * 100} 平方分米 = {0} 平方米`, a: k, s: ['100 平方分米 = 1 平方米', `${k * 100} 里面有 ${k} 个 100，是 ${k} 平方米`] },
        { q: `${k * 100} 平方厘米 = {0} 平方分米`, a: k, s: ['100 平方厘米 = 1 平方分米', `${k * 100} 里面有 ${k} 个 100，是 ${k} 平方分米`] },
        { q: `${k} 平方米 = {0} 平方厘米`, a: k * 10000, s: ['1 平方米 = 100 平方分米 = 10000 平方厘米', `${k} 平方米 = ${k * 10000} 平方厘米`] },
      ]);
      return { q: t.q, answer: [num(t.a)], steps: [...t.s, '想一想：边长 1 米的正方形，边长也是 10 分米，面积 10 × 10 = 100 平方分米，所以进率是 100，不是 10'], hint: '面积单位之间的进率是多少？' };
    },
  },
  {
    id: 'g3b-area-l-shape', grade: 3, term: 2, unit: '面积', name: '组合图形的面积（L 形）', process: true,
    tip: '把图形分成两个长方形分别算再相加，或者补成大长方形再减去缺的部分', level: 2,
    gen(r) {
      const u = r.pick(['厘米', '米']), L = r.int(6, 16), H = r.int(5, 12), a = r.int(2, L - 2), h = r.int(2, H - 2);
      const pts = [[0, 0], [L, 0], [L, h], [a, h], [a, H], [0, H]];
      const labels = [`${L}${u}`, `${h}${u}`, '', '', `${a}${u}`, `${H}${u}`];
      const A1 = L * h, A2 = a * (H - h), area = A1 + A2;
      return {
        q: `求下面图形的面积（图中的角都是直角）。`,
        fig: shape(pts, { edgeLabels: labels }),
        answer: [num(area, { unit: `平方${u}` })],
        steps: [`方法一：横着切成上下两个长方形`, `下面的长方形：${L} × ${h} = ${A1}（平方${u}）`, `上面的长方形：宽 ${a}，高 ${H} − ${h} = ${H - h}，面积 ${a} × ${H - h} = ${A2}（平方${u}）`, `合起来：${A1} + ${A2} = ${area}（平方${u}）`, `方法二：补成 ${L} × ${H} = ${L * H} 的大长方形，减去缺的 ${L - a} × ${H - h} = ${(L - a) * (H - h)}，${L * H} − ${(L - a) * (H - h)} = ${area}`],
        hint: '能分成两个长方形吗？每个长方形的长和宽是多少？',
      };
    },
  },
  {
    id: 'g3b-area-tiles', grade: 3, term: 2, unit: '面积', name: '铺地砖问题', process: true,
    tip: '先统一单位，再算每行铺几块、能铺几行，块数 = 每行块数 × 行数', level: 2,
    gen(r) {
      const [what, l1, l2, w1, w2] = r.pick([['客厅', 5, 8, 3, 5], ['教室', 8, 10, 6, 8], ['会议室', 6, 10, 4, 7], ['走廊', 10, 18, 2, 3], ['书房', 3, 5, 2, 4], ['厨房', 3, 5, 2, 3]]);
      const [Lm, Wm, sd] = r.until(() => [r.int(l1, l2), r.int(w1, w2), r.pick([2, 4, 5, 6])], ([x, y, z]) => x > y && (x * 10) % z === 0 && (y * 10) % z === 0 && (x * 10) / z < 100);
      const per = (Lm * 10) / sd, rows = (Wm * 10) / sd, total = per * rows;
      return {
        q: `一间${what}长 ${Lm} 米、宽 ${Wm} 米，用边长 ${sd} 分米的正方形地砖铺地。一共需要多少块地砖？`,
        answer: [num(total, { unit: '块' })],
        steps: [`单位不同，先化成分米：长 ${Lm} 米 = ${Lm * 10} 分米，宽 ${Wm} 米 = ${Wm * 10} 分米`, `沿着长铺，每行能铺：${Lm * 10} ÷ ${sd} = ${per}（块）`, `沿着宽铺，能铺：${Wm * 10} ÷ ${sd} = ${rows}（行）`, `一共需要：${per} × ${rows} = ${total}（块）`, `答：一共需要 ${total} 块地砖。`],
        hint: '先把米化成分米',
      };
    },
  },
  {
    id: 'g3b-area-word', grade: 3, term: 2, unit: '面积', name: '面积解决问题', process: true,
    tip: '先求面积（长 × 宽或边长 × 边长），再按题目求总量或剩下的部分', level: 2,
    gen(r) {
      const t = r.int(0, 4);
      if (t === 0) { const [l, w] = r.until(() => [r.int(6, 15), r.int(4, 9)], ([x, y]) => x > y), k = r.int(3, 9), A = l * w; return { q: `一块长方形菜地长 ${l} 米，宽 ${w} 米。每平方米收西红柿 ${k} 千克，这块地一共收西红柿多少千克？`, answer: [num(A * k, { unit: '千克' })], steps: [`先求面积：${l} × ${w} = ${A}（平方米）`, `再求总产量：${A} × ${k} = ${A * k}（千克）`, `答：一共收西红柿 ${A * k} 千克。`] }; }
      if (t === 1) { const [l, h] = [r.int(5, 12), r.int(3, 4)], k = r.int(5, 9), A = l * h; return { q: `粉刷一面长 ${l} 米、高 ${h} 米的墙，每平方米要用涂料 ${k} 元。粉刷这面墙要花多少元？`, answer: [num(A * k, { unit: '元' })], steps: [`先求墙的面积：${l} × ${h} = ${A}（平方米）`, `再求钱数：${A} × ${k} = ${A * k}（元）`, `答：要花 ${A * k} 元。`] }; }
      if (t === 2) { const a = r.int(4, 10), k = r.int(6, 9); return { q: `一块正方形草坪边长 ${a} 米。铺 1 平方米草皮要 ${k} 元，铺满这块草坪要多少元？`, answer: [num(a * a * k, { unit: '元' })], steps: [`先求草坪面积：${a} × ${a} = ${a * a}（平方米）`, `再求钱数：${a * a} × ${k} = ${a * a * k}（元）`, `答：要 ${a * a * k} 元。`] }; }
      if (t === 3) { const [l, w] = r.until(() => [r.int(8, 20), r.int(3, 9)], ([x, y]) => x > y); return { q: `一张长方形纸长 ${l} 厘米，宽 ${w} 厘米，从中剪下一个最大的正方形。剩下部分的面积是多少平方厘米？`, fig: shape([[0, 0], [l, 0], [l, w], [0, w]], { edgeLabels: [`${l}厘米`, `${w}厘米`], dashed: [[[w, 0], [w, w]]] }), answer: [num((l - w) * w, { unit: '平方厘米' })], steps: [`最大的正方形边长等于宽 ${w} 厘米`, `剩下的长方形：长 ${l} − ${w} = ${l - w}（厘米），宽 ${w} 厘米`, `面积：${l - w} × ${w} = ${(l - w) * w}（平方厘米）`, `也可以：${l} × ${w} − ${w} × ${w} = ${l * w} − ${w * w} = ${(l - w) * w}`] }; }
      const a = r.int(3, 12);
      return { q: `一个正方形的周长是 ${4 * a} 厘米，它的面积是多少平方厘米？`, answer: [num(a * a, { unit: '平方厘米' })], steps: [`先求边长：${4 * a} ÷ 4 = ${a}（厘米）`, `再求面积：${a} × ${a} = ${a * a}（平方厘米）`, '易错：不能直接用周长去乘'] };
    },
  },

  // ---------- 年、月、日 ----------
  {
    id: 'g3b-ymd-month', grade: 3, term: 2, unit: '年、月、日', name: '大月、小月和每月天数',
    tip: '1、3、5、7、8、10、12 月是大月，有 31 天；4、6、9、11 月是小月，有 30 天；2 月平年 28 天、闰年 29 天', level: 1, speed: 6,
    gen(r) {
      const m = r.int(1, 12), y = r.int(2015, 2030);
      const rule = '拳头记忆：凸起的是大月（31 天），凹下去的是小月（30 天）；7 月、8 月连着两个大月';
      if (m !== 2 && r.bool()) { const big = MONTH_DAYS[m] === 31; return { q: `${m} 月是 {0}。`, answer: [pick(['大月', '小月'], big ? '大月' : '小月')], steps: [rule, `${m} 月有 ${MONTH_DAYS[m]} 天，是${big ? '大月' : '小月'}`] }; }
      if (m === 2) return { q: `${y} 年 2 月有 {0} 天。`, answer: [num(mdays(y, 2), { unit: '天' })], steps: ['2 月既不是大月也不是小月：平年 28 天，闰年 29 天', `${y} ÷ 4 ${y % 4 ? `= ${Math.floor(y / 4)} …… ${y % 4}，有余数，是平年` : `= ${y / 4}，没有余数，是闰年`}`, `所以 ${y} 年 2 月有 ${mdays(y, 2)} 天`] };
      return { q: `${m} 月有 {0} 天。`, answer: [num(MONTH_DAYS[m], { unit: '天' })], steps: [rule, `${m} 月是${MONTH_DAYS[m] === 31 ? '大月，有 31 天' : '小月，有 30 天'}`] };
    },
  },
  {
    id: 'g3b-ymd-leap', grade: 3, term: 2, unit: '年、月、日', name: '判断平年和闰年',
    tip: '年份是 4 的倍数的一般是闰年；整百的年份要是 400 的倍数才是闰年', level: 1,
    gen(r) {
      const y = r.chance(0.15) ? r.pick([1800, 1900, 2000, 2100, 2200, 2400]) : r.chance(0.4) ? r.int(490, 524) * 4 : r.int(1960, 2099);
      const leap = isLeap(y), cent = y % 100 === 0;
      const steps = cent
        ? ['整百的年份，要看是不是 400 的倍数', `${y} ÷ 400 ${y % 400 ? '有余数' : `= ${y / 400}，没有余数`}，所以 ${y} 年是${leap ? '闰年' : '平年'}`]
        : ['不是整百的年份，看是不是 4 的倍数', `${y} ÷ 4 ${y % 4 ? `= ${Math.floor(y / 4)} …… ${y % 4}，有余数` : `= ${y / 4}，没有余数`}，所以 ${y} 年是${leap ? '闰年' : '平年'}`];
      steps.push(`${leap ? '闰年 2 月有 29 天，全年 366 天' : '平年 2 月有 28 天，全年 365 天'}`);
      return { q: `${y} 年是 {0}，这一年有 {1} 天。`, answer: [pick(['平年', '闰年'], leap ? '闰年' : '平年'), num(leap ? 366 : 365, { unit: '天' })], steps };
    },
  },
  {
    id: 'g3b-ymd-days-sum', grade: 3, term: 2, unit: '年、月、日', name: '几个月一共有多少天',
    tip: '先判断每个月是大月、小月还是 2 月，再把天数加起来', level: 2,
    gen(r) {
      const y = r.int(2016, 2030), kind = r.int(0, 2);
      let s, e, label;
      if (kind === 0) { const qn = r.int(1, 4); s = qn * 3 - 2; e = qn * 3; label = `${y} 年第${CN[qn]}季度`; }
      else if (kind === 1) { const first = r.bool(); s = first ? 1 : 7; e = first ? 6 : 12; label = `${y} 年${first ? '上' : '下'}半年`; }
      else { s = r.int(1, 10); e = r.int(s + 1, Math.min(12, s + 3)); label = `${y} 年 ${s} 月到 ${e} 月`; }
      const ds = []; for (let m = s; m <= e; m++) ds.push(mdays(y, m));
      const total = ds.reduce((a, b) => a + b, 0);
      const steps = [];
      if (kind < 2) steps.push(`${label}是 ${s} 月到 ${e} 月`);
      if (s <= 2 && e >= 2) steps.push(`${y} 年是${isLeap(y) ? '闰年，2 月有 29 天' : '平年，2 月有 28 天'}`);
      steps.push(`${ds.map((d, i) => `${s + i} 月 ${d} 天`).join('，')}`, `${ds.join(' + ')} = ${total}（天）`);
      return { q: `${label}一共有多少天？`, answer: [num(total, { unit: '天' })], steps };
    },
  },
  {
    id: 'g3b-ymd-units', grade: 3, term: 2, unit: '年、月、日', name: '年、月、日、时的换算',
    tip: '1 年 = 12 个月，1 季度 = 3 个月，1 星期 = 7 天，1 日 = 24 时', level: 1, speed: 8,
    gen(r) {
      const k = r.int(2, 9);
      const t = r.pick([
        { q: `${k} 年 = {0} 个月`, a: 12 * k, s: `1 年 = 12 个月，12 × ${k} = ${12 * k}` },
        { q: `${12 * k} 个月 = {0} 年`, a: k, s: `12 个月 = 1 年，${12 * k} ÷ 12 = ${k}（想 12 × ${k} = ${12 * k}）` },
        { q: `${k} 个星期 = {0} 天`, a: 7 * k, s: `1 个星期 = 7 天，7 × ${k} = ${7 * k}` },
        { q: `${7 * k} 天 = {0} 个星期`, a: k, s: `7 天 = 1 个星期，${7 * k} ÷ 7 = ${k}` },
        { q: `${k} 日 = {0} 时`, a: 24 * k, s: `1 日 = 24 时，24 × ${k} = ${24 * k}` },
        { q: `${24 * k} 时 = {0} 日`, a: k, s: `24 时 = 1 日，${24 * k} ÷ 24 = ${k}（想 24 × ${k} = ${24 * k}）` },
        { q: `${Math.min(k, 4)} 个季度 = {0} 个月`, a: 3 * Math.min(k, 4), s: `1 个季度 = 3 个月，3 × ${Math.min(k, 4)} = ${3 * Math.min(k, 4)}` },
      ]);
      return { q: t.q, answer: [num(t.a)], steps: [t.s] };
    },
  },
  {
    id: 'g3b-ymd-24-to-12', grade: 3, term: 2, unit: '年、月、日', name: '24 时计时法改写成普通计时法',
    tip: '超过 12 时的，减去 12 就是下午或晚上几时；不超过 12 时的，前面加上“凌晨”“上午”“中午”', level: 1,
    gen(r) {
      const h = r.pick([1, 2, 3, 4, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 20, 21, 22, 23]), m = r.step(0, 55, 5);
      const period = h <= 4 ? '凌晨' : h <= 11 ? '上午' : h === 12 ? '中午' : h <= 17 ? '下午' : '晚上', hh = h > 12 ? h - 12 : h;
      return {
        q: `${hm(h, m)} 用普通计时法表示是：{0} {1}:{2}`,
        answer: [pick(['凌晨', '上午', '中午', '下午', '晚上'], period), num(hh, { label: '时' }), num(m, { label: '分' })],
        steps: h > 12 ? [`${h} 时超过 12 时，减去 12：${h} − 12 = ${hh}`, `${h} 时在${period}，所以是${period} ${hm(hh, m)}`] : [`${h} 时不超过 12 时，时数不变`, `${h} 时在${period}，所以是${period} ${hm(hh, m)}`],
        hint: '超过 12 的时数要怎么变？',
      };
    },
  },
  {
    id: 'g3b-ymd-12-to-24', grade: 3, term: 2, unit: '年、月、日', name: '普通计时法改写成 24 时计时法',
    tip: '下午、晚上的时刻，时数加上 12；凌晨、上午、中午的时数不变', level: 1,
    gen(r) {
      const h = r.pick([1, 2, 3, 4, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 20, 21, 22, 23]), m = r.step(0, 55, 5);
      const period = h <= 4 ? '凌晨' : h <= 11 ? '上午' : h === 12 ? '中午' : h <= 17 ? '下午' : '晚上', hh = h > 12 ? h - 12 : h;
      return {
        q: `${period} ${hm(hh, m)} 用 24 时计时法表示是 {0}:{1}`,
        answer: [num(h, { label: '时' }), num(m, { label: '分' })],
        steps: h > 12 ? [`${period}的时刻，时数要加上 12`, `${hh} + 12 = ${h}，所以是 ${hm(h, m)}`] : [`${period}的时刻，时数不变`, `所以是 ${hm(h, m)}`],
      };
    },
  },
  {
    id: 'g3b-ymd-elapsed-hours', grade: 3, term: 2, unit: '年、月、日', name: '求经过的时间（24 时计时法）', process: true,
    tip: '先把时刻都写成 24 时计时法，再用结束时刻减开始时刻', level: 1,
    gen(r) {
      const whole = r.bool(), n = r.name();
      const [sh, sm, eh, em] = r.until(() => [r.int(6, 10), whole ? 0 : r.step(0, 50, 10), r.int(15, 22), whole ? 0 : r.step(0, 50, 10)], ([, b, , d]) => whole || b !== d);
      const total = eh * 60 + em - (sh * 60 + sm), dh = Math.floor(total / 60), dm = total % 60;
      const plain = r.bool();
      const S = plain ? `上午 ${hm(sh, sm)}` : hm(sh, sm), E = plain ? `${eh <= 17 ? '下午' : '晚上'} ${hm(eh - 12, em)}` : hm(eh, em);
      const a = plain ? S : ` ${S}`, b = plain ? E : ` ${E}`;
      const q = r.pick([
        `超市的营业时间是${a}—${E}。超市每天营业多长时间？`,
        `图书馆周末${a} 开门，${E} 关门。图书馆周末每天开放多长时间？`,
        `一列火车${a} 从北京出发，当天${b} 到达终点站。火车行驶了多长时间？`,
        `游泳馆每天${a} 开放，${E} 关闭。游泳馆每天开放多长时间？`,
        `${n}爸爸${a} 开始开车，当天${b} 到达目的地。路上一共用了多长时间？`,
      ]);
      const steps = [];
      if (plain) steps.push(`先改写成 24 时计时法：${S} 是 ${hm(sh, sm)}，${E} 是 ${hm(eh, em)}`);
      if (whole) steps.push(`经过时间 = 结束时刻 − 开始时刻：${eh} − ${sh} = ${dh}（小时）`);
      else if (em >= sm) steps.push(`经过时间 = 结束时刻 − 开始时刻`, `分减分：${em} − ${sm} = ${dm}（分），时减时：${eh} − ${sh} = ${dh}（小时）`);
      else steps.push(`经过时间 = 结束时刻 − 开始时刻`, `${em} 分减 ${sm} 分不够减，从 ${eh} 时借 1 小时（60 分）：${em} + 60 − ${sm} = ${dm}（分）`, `${eh} − 1 − ${sh} = ${dh}（小时）`);
      steps.push(`答：${whole ? `${dh} 小时` : `${dh} 小时 ${dm} 分`}。`);
      return { q, answer: whole ? [num(dh, { unit: '小时' })] : [num(dh, { unit: '小时' }), num(dm, { unit: '分' })], steps, hint: plain ? '先把下午、晚上的时刻改成 24 时计时法' : '结束时刻减开始时刻' };
    },
  },
  {
    id: 'g3b-ymd-elapsed-days', grade: 3, term: 2, unit: '年、月、日', name: '求经过的天数', process: true,
    tip: '“从某日到某日”头尾两天都算：天数 = 结束日 − 开始日 + 1；跨月就分段算', level: 2,
    gen(r) {
      const y = r.int(2018, 2030), n = r.name(), cross = r.chance(0.6);
      let m1, d1, m2, d2;
      if (cross) { m1 = r.int(1, 11); m2 = m1 + 1; d1 = r.int(10, mdays(y, m1)); d2 = r.int(3, 25); }
      else { m1 = m2 = r.int(1, 12); d1 = r.int(1, 15); d2 = r.int(d1 + 5, mdays(y, m1)); }
      const first = cross ? mdays(y, m1) - d1 + 1 : 0, total = cross ? first + d2 : d2 - d1 + 1;
      const q = r.pick([
        `${y} 年的一个画展从 ${m1} 月 ${d1} 日开始，到 ${m2} 月 ${d2} 日结束。一共展出多少天？`,
        `图书馆读书节从 ${y} 年 ${m1} 月 ${d1} 日开始，到 ${m2} 月 ${d2} 日结束。读书节一共举办多少天？`,
        `${n}爸爸 ${y} 年 ${m1} 月 ${d1} 日去外地出差，${m2} 月 ${d2} 日回来（去和回来的两天都算）。一共出差多少天？`,
        `${n}从 ${y} 年 ${m1} 月 ${d1} 日起每天跳绳，一直坚持到 ${m2} 月 ${d2} 日（这两天都算）。一共跳了多少天？`,
      ]);
      const steps = cross
        ? [`分两段算，开始和结束的两天都要算上`, `${m1} 月有 ${mdays(y, m1)} 天${m1 === 2 ? `（${y} 年是${isLeap(y) ? '闰年' : '平年'}）` : ''}，${m1} 月 ${d1} 日到 ${m1} 月 ${mdays(y, m1)} 日：${mdays(y, m1)} − ${d1} + 1 = ${first}（天）`, `${m2} 月 1 日到 ${m2} 月 ${d2} 日：${d2} 天`, `${first} + ${d2} = ${total}（天）`]
        : [`开始和结束的两天都要算上`, `${d2} − ${d1} + 1 = ${total}（天）`, `易错：只算 ${d2} − ${d1} = ${d2 - d1}，少算了 1 天`];
      return { q, answer: [num(total, { unit: '天' })], steps: [...steps, `答：一共 ${total} 天。`], hint: '头尾两天都算吗？' };
    },
  },
  {
    id: 'g3b-ymd-weekday', grade: 3, term: 2, unit: '年、月、日', name: '推算星期几',
    tip: '先算过了几天，再看里面有几个 7 天（整星期），余下几天就从原来的星期往后数几天', level: 2,
    gen(r) {
      const y = r.int(2020, 2030), m = r.int(1, 12), d1 = r.int(1, 8), d2 = r.until(() => r.int(d1 + 3, mdays(y, m)), (x) => x - d1 >= 3);
      const w = (d) => (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
      const w1 = w(d1), w2 = w(d2), diff = d2 - d1, k = Math.floor(diff / 7), rem = diff % 7;
      return {
        q: `${y} 年 ${m} 月 ${d1} 日是${WEEK[w1]}，这个月的 ${d2} 日是 {0}。`,
        answer: [pick(WEEK, WEEK[w2])],
        steps: [`从 ${d1} 日到 ${d2} 日，过了 ${d2} − ${d1} = ${diff}（天）`, `一个星期 7 天：${diff} ÷ 7 = ${k}${rem ? ` …… ${rem}` : ''}`, rem ? `${k ? `${k} 个整星期后还是${WEEK[w1]}，` : ''}再往后数 ${rem} 天是${WEEK[w2]}` : `正好 ${k} 个整星期，还是${WEEK[w1]}`],
        hint: '过了几天？里面有几个星期？',
      };
    },
  },

  // ---------- 小数的初步认识 ----------
  {
    id: 'g3b-dec-read', grade: 3, term: 2, unit: '小数的初步认识', name: '小数的读法',
    tip: '整数部分按整数读，小数点读作“点”，小数部分从左往右一个一个数字读', level: 1,
    gen(r) {
      const two = r.chance(0.35);
      const x = two ? fix(r.int(0, 20) + r.int(1, 99) / 100) : fix(r.int(0, 60) + r.int(1, 9) / 10);
      const [ip, dp] = fmt(x).split('.');
      const right = readNum(x), cand = new Set();
      if (dp.length === 2 && dp[0] !== '0') cand.add(`${readInt(+ip)}点${readInt(+dp)}`);
      if (dp.length === 2 && dp[0] === '0') cand.add(readNum(fix(+ip + +dp[1] / 10)));
      if (dp.length === 1) cand.add(readNum(fix(+ip + +dp / 100)));
      cand.add(readInt(+(ip + dp)));
      cand.add(readNum(fix(x * 10)));
      if (+ip > 0 && +ip < 10 && dp.length === 1) cand.add(readNum(fix(+dp + +ip / 10)));
      cand.add(readNum(fix(x + 1)));
      cand.delete(right);
      const options = r.shuffle([right, ...r.sample([...cand], 3)]);
      return {
        q: `${fmt(x)} 读作 {0}`,
        answer: [pick(options, right)],
        steps: [`整数部分 ${ip} 读作“${readInt(+ip)}”，小数点读作“点”`, `小数部分 ${dp} 要一个数字一个数字地读：${dp.split('').map((c) => CN[+c]).join('')}`, `所以读作${right}`, ...(dp.length === 2 && dp[0] !== '0' ? [`易错：小数部分不能读成“${readInt(+dp)}”`] : dp.includes('0') ? ['小数部分的 0 也要读出来'] : [])],
      };
    },
  },
  {
    id: 'g3b-dec-write', grade: 3, term: 2, unit: '小数的初步认识', name: '小数的写法',
    tip: '“点”前面写整数部分（没有整数就写 0），写上小数点，再把“点”后面的数字依次写出来', level: 1,
    gen(r) {
      const two = r.chance(0.35);
      const x = two ? fix(r.int(0, 20) + r.int(1, 99) / 100) : fix(r.int(0, 60) + r.int(1, 9) / 10);
      const [ip, dp] = fmt(x).split('.');
      return { q: `${readNum(x)}写作 {0}`, answer: [num(x)], steps: [`“点”前面是${readInt(+ip)}，整数部分写 ${ip}`, dp.length > 1 ? `“点”后面依次是 ${dp.split('').join('、')}，小数部分写 ${dp}` : `“点”后面是 ${dp}，小数部分写 ${dp}`, `合起来写作 ${fmt(x)}`] };
    },
  },
  {
    id: 'g3b-dec-money', grade: 3, term: 2, unit: '小数的初步认识', name: '用元作单位的小数',
    tip: '1 角 = 0.1 元，1 分 = 0.01 元：几元写整数部分，角写在十分位，分写在百分位', level: 1, speed: 10,
    gen(r) {
      const a = r.int(1, 30), b = r.int(1, 9), c = r.int(1, 9);
      const t = r.pick([
        { q: `${a} 元 ${b} 角 = {0} 元`, v: a + b / 10, s: [`${b} 角 = 0.${b} 元`, `${a} 元 ${b} 角 = ${a}.${b} 元`] },
        { q: `${b} 角 = {0} 元`, v: b / 10, s: ['1 角是 1 元的 {{1/10}}，写成 0.1 元', `${b} 角 = 0.${b} 元`] },
        { q: `${a} 元 ${b} 角 ${c} 分 = {0} 元`, v: a + b / 10 + c / 100, s: ['角写在十分位，分写在百分位', `${a} 元 ${b} 角 ${c} 分 = ${a}.${b}${c} 元`] },
        { q: `${a} 元 ${c} 分 = {0} 元`, v: a + c / 100, s: ['没有角，十分位要写 0 占位', `${a} 元 ${c} 分 = ${a}.0${c} 元`, `易错：不能写成 ${a}.${c} 元（那是 ${a} 元 ${c} 角）`] },
        { q: `${b} 角 ${c} 分 = {0} 元`, v: b / 10 + c / 100, s: ['不满 1 元，整数部分写 0', `${b} 角 ${c} 分 = 0.${b}${c} 元`] },
      ]);
      return { q: t.q, answer: [num(t.v)], steps: t.s };
    },
  },
  {
    id: 'g3b-dec-money-back', grade: 3, term: 2, unit: '小数的初步认识', name: '小数表示的钱数改写成元角分',
    tip: '整数部分是几元，十分位是几角，百分位是几分', level: 1, speed: 10,
    gen(r) {
      const a = r.int(1, 30), b = r.int(1, 9), c = r.int(1, 9);
      return r.pick([
        { q: `${a}.${b} 元 = {0} 元 {1} 角`, answer: [num(a), num(b)], steps: [`整数部分 ${a} 表示 ${a} 元，十分位上的 ${b} 表示 ${b} 角`, `${a}.${b} 元 = ${a} 元 ${b} 角`] },
        { q: `${a}.${b}${c} 元 = {0} 元 {1} 角 {2} 分`, answer: [num(a), num(b), num(c)], steps: ['整数部分是元，十分位是角，百分位是分', `${a}.${b}${c} 元 = ${a} 元 ${b} 角 ${c} 分`] },
        { q: `0.${b} 元 = {0} 角`, answer: [num(b)], steps: [`十分位上的 ${b} 表示 ${b} 角`, `0.${b} 元 = ${b} 角`] },
        { q: `${a}.0${c} 元 = {0} 元 {1} 分`, answer: [num(a), num(c)], steps: [`十分位是 0，表示没有角；百分位上的 ${c} 表示 ${c} 分`, `${a}.0${c} 元 = ${a} 元 ${c} 分`] },
      ]);
    },
  },
  {
    id: 'g3b-dec-length', grade: 3, term: 2, unit: '小数的初步认识', name: '用米作单位的小数',
    tip: '1 分米是 1 米的 {{1/10}}，写成 0.1 米；1 厘米是 1 米的 {{1/100}}，写成 0.01 米', level: 1, speed: 10,
    gen(r) {
      const a = r.int(1, 9), b = r.int(1, 9), c = r.int(1, 9), m = r.int(1, 3);
      return r.pick([
        { q: `${b} 分米 = {0} 米`, answer: [num(b / 10)], steps: ['1 米 = 10 分米，1 分米是 1 米的 {{1/10}}，写成 0.1 米', `${b} 分米是 ${frac(b, 10)} 米，写成 0.${b} 米`] },
        { q: `${m} 米 ${b} 分米 = {0} 米`, answer: [num(m + b / 10)], steps: [`${b} 分米 = 0.${b} 米`, `${m} 米 ${b} 分米 = ${m}.${b} 米`] },
        { q: `${c} 厘米 = {0} 米`, answer: [num(c / 100)], steps: ['1 米 = 100 厘米，1 厘米是 1 米的 {{1/100}}，写成 0.01 米', `${c} 厘米 = 0.0${c} 米`, `易错：不能写成 0.${c} 米（那是 ${c} 分米）`] },
        { q: `${a}${c} 厘米 = {0} 米`, answer: [num(+`0.${a}${c}`)], steps: [`${a}${c} 厘米是 1 米的 ${frac(+`${a}${c}`, 100)}`, `写成 0.${a}${c} 米`] },
        { q: `0.${b} 米 = {0} 分米`, answer: [num(b)], steps: [`0.${b} 米就是 ${frac(b, 10)} 米`, `1 米 = 10 分米，${frac(b, 10)} 米是 ${b} 分米`] },
      ]);
    },
  },
  {
    id: 'g3b-dec-frac', grade: 3, term: 2, unit: '小数的初步认识', name: '十分之几和一位小数',
    tip: '十分之几可以写成零点几：{{3/10}} = 0.3', level: 1,
    gen(r) {
      const k = r.int(1, 9), t = r.int(0, 2);
      if (t === 0) {
        const shaded = r.sample([...Array(10).keys()], k);
        return { q: '把一个长方形平均分成 10 份（如图）。涂色部分用分数表示是 {0}，用小数表示是 {1}。', fig: fracFig('rect', 10, shaded), answer: [fr(k, 10), num(k / 10)], steps: [`平均分成 10 份，涂色的有 ${k} 份，是 ${frac(k, 10)}`, `十分之几写成小数是零点几：${frac(k, 10)} = 0.${k}`] };
      }
      if (t === 1) return { q: `${frac(k, 10)} = {0}（填小数）`, answer: [num(k / 10)], steps: [`${frac(k, 10)} 是十分之${CN[k]}`, `十分之几写成零点几：0.${k}`] };
      return { q: `0.${k} = {0}（填分数）`, answer: [fr(k, 10)], steps: [`0.${k} 表示十分之${CN[k]}`, `写成分数是 ${frac(k, 10)}`] };
    },
  },
  {
    id: 'g3b-dec-cmp', grade: 3, term: 2, unit: '小数的初步认识', name: '小数的大小比较',
    tip: '先比整数部分，整数部分大的那个数就大；整数部分相同，再比十分位', level: 1, speed: 8,
    gen(r) {
      const kind = r.int(0, 3);
      let a, b;
      if (kind === 0) { const i = r.int(0, 20); [a, b] = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 2).map((t) => fix(i + t / 10)); }
      else if (kind === 1) { a = fix(r.int(0, 15) + r.int(1, 9) / 10); b = fix(r.until(() => r.int(0, 15), (x) => x !== Math.floor(a)) + r.int(1, 9) / 10); }
      else if (kind === 2) { const i = r.int(0, 9), t = r.int(1, 9); a = fix(i + t / 10); b = fix(i + r.until(() => r.int(1, 99), (x) => x !== t * 10) / 100); }
      else { a = r.int(1, 9); b = fix(a + (r.bool() ? -1 : 0) + r.int(1, 9) / 10); }
      if (r.bool()) [a, b] = [b, a];
      const v = sign(a, b), [ia, ib] = [Math.floor(a), Math.floor(b)];
      const steps = ia !== ib
        ? [`先比整数部分：${ia} ${sign(ia, ib)} ${ib}`, `所以 ${fmt(a)} ${v} ${fmt(b)}`]
        : [`整数部分都是 ${ia}，再比十分位${decimals(a) === 2 || decimals(b) === 2 ? '，十分位相同再比百分位' : ''}`, `${fmt(a)} ${v} ${fmt(b)}`];
      if (kind === 2) steps.push('易错：不能看小数部分的位数多就说大');
      return { q: `${fmt(a)} {0} ${fmt(b)}`, answer: [pick(CMP, v)], steps };
    },
  },
  {
    id: 'g3b-dec-add', grade: 3, term: 2, unit: '小数的初步认识', name: '一位小数加法',
    tip: '小数点对齐（相同数位对齐），从十分位加起，满十向个位进 1，得数的小数点对齐写下来', level: 1,
    gen(r) {
      const a = fix(r.int(0, 12) + r.int(1, 9) / 10), b = fix(r.int(0, 9) + r.int(1, 9) / 10), s = fix(a + b);
      const steps = ['列竖式，小数点对齐', ...decCols(a, b, '+'), vDec(a, b, '+')];
      steps.push(Number.isInteger(s) ? `得数 ${s.toFixed(1)} 末尾的 0 可以去掉，写成 ${s}` : `得数的小数点和上面的小数点对齐：${fmt(s)}`);
      return { q: `${fmt(a)} + ${fmt(b)} = {0}`, answer: [num(s)], steps };
    },
  },
  {
    id: 'g3b-dec-sub', grade: 3, term: 2, unit: '小数的初步认识', name: '一位小数减法',
    tip: '小数点对齐，从十分位减起，不够减就从个位退 1 当 10', level: 1,
    gen(r) {
      const [a, b] = r.until(() => [fix(r.int(1, 15) + r.int(0, 9) / 10), fix(r.int(0, 9) + r.int(1, 9) / 10)], ([x, y]) => x > y + 0.2 && !Number.isInteger(x));
      const d = fix(a - b);
      return { q: `${fmt(a)} − ${fmt(b)} = {0}`, answer: [num(d)], steps: ['列竖式，小数点对齐', ...decCols(a, b, '−'), vDec(a, b, '-'), Number.isInteger(d) ? `得数 ${d.toFixed(1)} 末尾的 0 可以去掉，写成 ${d}` : `验算：${fmt(d)} + ${fmt(b)} = ${fmt(a)} ✓`] };
    },
  },
  {
    id: 'g3b-dec-sub-int', grade: 3, term: 2, unit: '小数的初步认识', name: '整数减一位小数',
    tip: '把整数看成“几点零”（5 = 5.0），再小数点对齐，从十分位减起', level: 2,
    gen(r) {
      const a = r.int(2, 20), b = fix(r.int(0, a - 1) + r.int(1, 9) / 10), d = fix(a - b);
      return { q: `${a} − ${fmt(b)} = {0}`, answer: [num(d)], steps: [`把 ${a} 看成 ${a}.0，小数点对齐`, ...decCols(a, b, '−'), vDec(a, b, '-'), `易错：不能把 ${a} 和 ${fmt(b)} 末尾的 ${fmt(b).slice(-1)} 对齐，要小数点对齐`] };
    },
  },
  {
    id: 'g3b-dec-word', grade: 3, term: 2, unit: '小数的初步认识', name: '小数加减解决问题', process: true,
    tip: '和整数加减一样找数量关系；列竖式时小数点对齐', level: 2,
    gen(r) {
      const [A, B] = r.names(2), t = r.int(0, 5);
      const d1 = () => r.int(1, 9) / 10;
      const T = [
        () => { const x = fix(r.int(2, 9) + d1()), y = fix(r.int(1, 6) + d1()); return { q: `一支钢笔 ${fmt(x)} 元，一个笔记本 ${fmt(y)} 元。买这两样一共要多少元？`, a: fix(x + y), op: '+', p: [x, y], rel: '一共的钱 = 钢笔 + 笔记本', u: '元', ans: '一共要' }; },
        () => { const x = fix(r.int(3, 9) + d1()), pay = r.pick([10, 20]); return { q: `${A}买一个文具盒用了 ${fmt(x)} 元，付了 ${pay} 元。应找回多少元？`, a: fix(pay - x), op: '−', p: [pay, x], rel: '找回的钱 = 付的钱 − 用的钱', u: '元', ans: '应找回' }; },
        () => { const x = fix(1 + r.int(2, 4) / 10), y = fix(r.int(2, 5) / 10); return { q: `${A}身高 ${fmt(x)} 米，爸爸比${A}高 ${fmt(y)} 米。爸爸身高多少米？`, a: fix(x + y), op: '+', p: [x, y], rel: '爸爸的身高 = ' + A + '的身高 + 高出的部分', u: '米', ans: '爸爸身高' }; },
        () => { const x = fix(2 + d1()), y = fix(x - r.int(1, 6) / 10); return { q: `跳远比赛，${A}跳了 ${fmt(x)} 米，${B}跳了 ${fmt(y)} 米。${A}比${B}多跳了多少米？`, a: fix(x - y), op: '−', p: [x, y], rel: `多跳的 = ${A}跳的 − ${B}跳的`, u: '米', ans: `${A}多跳了` }; },
        () => { const x = fix(r.int(1, 3) + d1()), y = fix(r.int(1, 3) + d1()); return { q: `${A}第一天跑了 ${fmt(x)} 千米，第二天跑了 ${fmt(y)} 千米。两天一共跑了多少千米？`, a: fix(x + y), op: '+', p: [x, y], rel: '一共跑的 = 第一天 + 第二天', u: '千米', ans: '两天一共跑了' }; },
        () => { const L = r.int(3, 9), y = fix(r.int(1, L - 1) + d1()); return { q: `一根绳子长 ${L} 米，用去了 ${fmt(y)} 米。还剩多少米？`, a: fix(L - y), op: '−', p: [L, y], rel: '还剩的 = 原来的长度 − 用去的', u: '米', ans: '还剩' }; },
      ][t]();
      return { q: T.q, answer: [num(T.a, { unit: T.u })], steps: [`找数量关系：${T.rel}`, `列式：${fmt(T.p[0])} ${T.op} ${fmt(T.p[1])} = ${fmt(T.a)}（${T.u}）`, vDec(T.p[0], T.p[1], T.op === '+' ? '+' : '-'), `答：${T.ans} ${fmt(T.a)} ${T.u}。`] };
    },
  },

  // ---------- 数学广角——搭配（二） ----------
  {
    id: 'g3b-comb-digits', grade: 3, term: 2, unit: '数学广角——搭配（二）', name: '用数字卡片组两位数',
    tip: '按顺序排：先固定十位，再换个位，不重复不遗漏；0 不能放在十位', level: 1,
    gen(r) {
      const zero = r.chance(0.35);
      const ds = zero ? [0, ...r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 2)] : r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 3);
      const sorted = ds.slice().sort((x, y) => x - y), list = [];
      for (const t of sorted) if (t) for (const o of sorted) if (o !== t) list.push(t * 10 + o);
      const show = r.shuffle(ds);
      return {
        q: `用 ${show.join('、')} 三张数字卡片，能组成多少个不同的两位数（每个两位数的两个数字不同）？最大的是多少？最小的是多少？`,
        answer: [num(list.length, { unit: '个', label: '个数' }), num(Math.max(...list), { label: '最大' }), num(Math.min(...list), { label: '最小' })],
        steps: ['先固定十位，再换个位，按顺序一个一个写', ...sorted.filter((t) => t).map((t) => `十位是 ${t}：${list.filter((x) => Math.floor(x / 10) === t).join('、')}`), zero ? '0 不能放在十位上，所以比没有 0 时少' : '每个数字都可以当十位，每次个位有 2 种选法：3 × 2 = 6', `一共 ${list.length} 个，最大 ${Math.max(...list)}，最小 ${Math.min(...list)}`],
      };
    },
  },
  {
    id: 'g3b-comb-match', grade: 3, term: 2, unit: '数学广角——搭配（二）', name: '搭配问题（几种穿法、几条路）',
    tip: '每一个第一种都能和所有的第二种搭配：搭配数 = 第一种的个数 × 第二种的个数', level: 1,
    gen(r) {
      const n = r.name(), a = r.int(2, 5), b = r.int(2, 5);
      const t = r.pick([
        { q: `${n}有 ${a} 件上衣、${b} 条裤子，一件上衣配一条裤子，一共有多少种不同的穿法？`, x: '上衣', y: '裤子', u: '种' },
        { q: `早餐有 ${a} 种饮料、${b} 种点心，选一种饮料和一种点心，一共有多少种不同的搭配？`, x: '饮料', y: '点心', u: '种' },
        { q: `从家到公园有 ${a} 条路，从公园到学校有 ${b} 条路。从家经过公园到学校，一共有多少种走法？`, x: '家到公园的路', y: '公园到学校的路', u: '种' },
        { q: `${a} 名男生、${b} 名女生，选 1 名男生和 1 名女生搭档跳舞，一共有多少种不同的选法？`, x: '男生', y: '女生', u: '种' },
        { q: `文具店有 ${a} 种笔记本、${b} 种铅笔，买一个笔记本和一支铅笔，一共有多少种不同的买法？`, x: '笔记本', y: '铅笔', u: '种' },
      ]);
      return { q: t.q, answer: [num(a * b, { unit: t.u })], steps: [`每一种${t.x}都可以和 ${b} 种${t.y}搭配，有 ${b} 种`, `${a} 种${t.x}就有 ${a} 个 ${b} 种`, `${a} × ${b} = ${a * b}（${t.u}）`, '也可以用连线法，一条一条数，不重复不遗漏'] };
    },
  },
  {
    id: 'g3b-comb-handshake', grade: 3, term: 2, unit: '数学广角——搭配（二）', name: '握手、比赛场次（组合）', process: true,
    tip: '每两个之间只算一次（握手、比赛），按顺序连线：第 1 个连后面所有的，第 2 个连后面的……再加起来', level: 2, pool: 16,
    gen(r) {
      const k = r.int(3, 6), total = (k * (k - 1)) / 2;
      const names = r.names(k);
      const t = r.pick([
        { q: `${names.join('、')} ${k} 个好朋友见面，每两人握一次手，一共握了多少次手？`, u: '次', what: '握一次手' },
        { q: `${k} 支足球队进行比赛，每两支队之间都要比赛一场，一共要比赛多少场？`, u: '场', what: '比一场' },
        { q: `${names.join('、')} ${k} 人每两人通一次电话，一共要通多少次电话？`, u: '次', what: '通一次电话' },
        { q: `平面上有 ${k} 个点（任意三点不在一条直线上），每两点连一条线段，一共能连多少条线段？`, u: '条', what: '连一条线' },
      ]);
      const parts = []; for (let i = k - 1; i >= 1; i--) parts.push(i);
      return { q: t.q, answer: [num(total, { unit: t.u })], steps: [`第 1 个和后面 ${k - 1} 个各${t.what}，有 ${k - 1} ${t.u}`, `第 2 个和后面的 ${k - 2} 个各${t.what}（和第 1 个的已经算过了）……`, `${parts.join(' + ')} = ${total}（${t.u}）`, `答：一共 ${total} ${t.u}。`], hint: '“A 和 B”与“B 和 A”是同一次吗？' };
    },
  },
  {
    id: 'g3b-comb-arrange', grade: 3, term: 2, unit: '数学广角——搭配（二）', name: '排列（排队、选正副）', process: true,
    tip: '和顺序有关：先排第一个位置有几种，再排第二个位置有几种，相乘', level: 2, pool: 16,
    gen(r) {
      const t = r.int(0, 3);
      if (t === 0) { const ns = r.names(3); return { q: `${ns.join('、')} 3 个人站成一排照相，一共有多少种不同的站法？`, answer: [num(6, { unit: '种' })], steps: [`先排最左边：3 个人都可以，有 3 种`, '再排中间：剩下 2 个人，有 2 种；最右边就只剩 1 人', '3 × 2 × 1 = 6（种）', `比如${ns[0]}站最左边时：${ns[0]}${ns[1]}${ns[2]}、${ns[0]}${ns[2]}${ns[1]}，有 2 种`] }; }
      if (t === 1) { const k = r.int(3, 5); return { q: `${k} 名同学竞选班长和副班长（每人只能当一个），一共有多少种不同的选法？`, answer: [num(k * (k - 1), { unit: '种' })], steps: [`班长有 ${k} 种选法`, `选好班长后，副班长从剩下的 ${k - 1} 人里选，有 ${k - 1} 种`, `${k} × ${k - 1} = ${k * (k - 1)}（种）`, '班长、副班长换一换是不同的选法，所以和顺序有关'] }; }
      if (t === 2) { const k = r.int(3, 5); return { q: `${k} 个好朋友互相寄一张贺卡（每人给其他每个人都寄一张），一共要寄多少张贺卡？`, answer: [num(k * (k - 1), { unit: '张' })], steps: [`每人要寄给其他 ${k - 1} 个人，寄 ${k - 1} 张`, `${k} 个人一共寄：${k} × ${k - 1} = ${k * (k - 1)}（张）`, 'A 寄给 B 和 B 寄给 A 是两张不同的贺卡，和握手不一样'] }; }
      const colors = r.sample(['红', '黄', '蓝', '绿', '紫'], 3);
      return { q: `用${colors.join('、')}三种颜色给一排 3 个格子涂色，每格涂一种，颜色各不相同，一共有多少种涂法？`, answer: [num(6, { unit: '种' })], steps: ['第 1 格有 3 种颜色可选', '第 2 格只能从剩下的 2 种里选', '第 3 格只剩 1 种：3 × 2 × 1 = 6（种）'] };
    },
  },
];

const TERM2_C = [
  // ---------- 拓展（下册） ----------
  {
    id: 'g3b-ext-diff-times', grade: 3, term: 2, unit: '拓展：差倍问题', name: '差倍问题', process: true,
    tip: '把小数看作 1 份，大数是几份，多出来的（倍数 − 1）份就是相差的数：1 份 = 差 ÷ (倍数 − 1)', level: 3,
    gen(r) {
      const [A, B] = r.names(2), k = r.int(3, 7), s = r.int(3, 20), D = s * (k - 1);
      const t = r.pick([
        { q: `${A}的邮票张数是${B}的 ${k} 倍，${A}比${B}多 ${D} 张。两人各有多少张？`, x: A, y: B, u: '张' },
        { q: `果园里桃树的棵数是梨树的 ${k} 倍，桃树比梨树多 ${D} 棵。桃树、梨树各有多少棵？`, x: '桃树', y: '梨树', u: '棵' },
        { q: `一个书包的价钱是一个笔袋的 ${k} 倍，书包比笔袋贵 ${D} 元。书包和笔袋各多少元？`, x: '书包', y: '笔袋', u: '元' },
        { q: `鸭的只数是鸡的 ${k} 倍，鸭比鸡多 ${D} 只。鸭和鸡各有多少只？`, x: '鸭', y: '鸡', u: '只' },
      ]);
      return {
        q: t.q,
        fig: fig.bars([{ label: t.x, units: k, text: '?' }, { label: t.y, units: 1, text: '?' }]),
        answer: [num(s * k, { unit: t.u, label: t.x }), num(s, { unit: t.u, label: t.y })],
        steps: [`把${t.y}看作 1 份，${t.x}是 ${k} 份，${t.x}比${t.y}多 ${k} − 1 = ${k - 1}（份）`, `${k - 1} 份是 ${D}，1 份：${D} ÷ ${k - 1} = ${s}（${t.u}），就是${t.y}的`, `${t.x}：${s} × ${k} = ${s * k}（${t.u}）`, `检查：${s * k} − ${s} = ${D} ✓`],
        hint: '多出来的是几份？',
      };
    },
  },
  {
    id: 'g3b-ext-age-diff', grade: 3, term: 2, unit: '拓展：年龄问题', name: '年龄问题（年龄差不变）', process: true,
    tip: '两个人的年龄差永远不变：每过一年，两人都长 1 岁', level: 3,
    gen(r) {
      const n = r.name(), c = r.int(6, 12), gap = r.int(24, 34), p = r.pick(['妈妈', '爸爸']), P = c + gap;
      const t = r.int(0, 2);
      if (t === 0) { const future = r.int(c + 3, 20); return { q: `今年${n} ${c} 岁，${p} ${P} 岁。当${n} ${future} 岁时，${p}多少岁？`, answer: [num(future + gap, { unit: '岁' })], steps: [`年龄差：${P} − ${c} = ${gap}（岁），永远不变`, `${n} ${future} 岁时，${p}还是比${n}大 ${gap} 岁`, `${future} + ${gap} = ${future + gap}（岁）`] }; }
      if (t === 1) { const past = r.int(1, c - 2); return { q: `今年${p} ${P} 岁，${n} ${c} 岁。${p} ${P - past} 岁时，${n}几岁？`, answer: [num(c - past, { unit: '岁' })], steps: [`年龄差：${P} − ${c} = ${gap}（岁），永远不变`, `${p} ${P - past} 岁时，${n}比${p}小 ${gap} 岁`, `${P - past} − ${gap} = ${c - past}（岁）`] }; }
      const sumNow = P + c, yrs = r.int(2, 8);
      return { q: `今年${p}和${n}的年龄加起来是 ${sumNow} 岁。${yrs} 年后，两人的年龄加起来是多少岁？`, answer: [num(sumNow + 2 * yrs, { unit: '岁' })], steps: [`每过 1 年，两个人各长 1 岁，年龄和增加 2 岁`, `${yrs} 年后年龄和增加：${yrs} × 2 = ${2 * yrs}（岁）`, `${sumNow} + ${2 * yrs} = ${sumNow + 2 * yrs}（岁）`, '易错：只加了一个人的 ' + yrs + ' 岁'] };
    },
  },
  {
    id: 'g3b-ext-age-times', grade: 3, term: 2, unit: '拓展：年龄问题', name: '年龄问题（倍数关系的变化）', process: true,
    tip: '年龄差不变，倍数会变：先用差倍问题求出那一年孩子的年龄，再算差几年', level: 3,
    gen(r) {
      const n = r.name(), p = r.pick(['妈妈', '爸爸']);
      const [gap, k, c] = r.until(() => [r.int(24, 35), r.int(2, 5), r.int(5, 12)], ([g, kk, cc]) => g % (kk - 1) === 0 && g / (kk - 1) !== cc && Math.abs(g / (kk - 1) - cc) <= 10 && g / (kk - 1) >= 3 && (g / (kk - 1)) * kk >= 26);
      const then = gap / (k - 1), yrs = then - c, later = yrs > 0;
      return {
        q: `今年${p} ${c + gap} 岁，${n} ${c} 岁。${later ? '几年后' : '几年前'}，${p}的年龄正好是${n}的 ${k} 倍？`,
        answer: [num(Math.abs(yrs), { unit: '年' })],
        steps: [`年龄差：${c + gap} − ${c} = ${gap}（岁），永远不变`, `${p}是${n}的 ${k} 倍时，相差 ${k} − 1 = ${k - 1} 倍，就是 ${gap} 岁`, `那时${n}：${gap} ÷ ${k - 1} = ${then}（岁）`, later ? `${then} − ${c} = ${yrs}，是 ${yrs} 年后` : `${c} − ${then} = ${-yrs}，是 ${-yrs} 年前`, `检查：那时${p} ${then * k} 岁，${then * k} ÷ ${then} = ${k} ✓`],
      };
    },
  },
  {
    id: 'g3b-ext-tree-both', grade: 3, term: 2, unit: '拓展：植树问题', name: '植树问题（两端都种）', process: true,
    tip: '先求间隔数（全长 ÷ 间隔长），两端都种：棵数 = 间隔数 + 1', level: 3,
    gen(r) {
      const s = r.pick([2, 3, 4, 5, 6, 8, 10]), g = r.int(4, 30), L = s * g, two = r.chance(0.3);
      const t = r.pick([
        { q: `在一条长 ${L} 米的小路${two ? '两边' : '一边'}种树，每隔 ${s} 米种一棵，两端都要种。一共要种多少棵树？`, u: '棵' },
        { q: `在一条长 ${L} 米的马路${two ? '两边' : '一边'}安装路灯，每隔 ${s} 米装一盏，两端都要装。一共要装多少盏路灯？`, u: '盏' },
        { q: `学校在一条长 ${L} 米的跑道${two ? '两边' : '一边'}插彩旗，每隔 ${s} 米插一面，两端都插。一共要插多少面彩旗？`, u: '面' },
      ]);
      const one = g + 1;
      return {
        q: t.q,
        answer: [num(two ? one * 2 : one, { unit: t.u })],
        steps: [`先求间隔数：${L} ÷ ${s} = ${g}（个）`, `两端都种，棵数比间隔数多 1：${g} + 1 = ${one}（${t.u}）`, ...(two ? [`两边都种：${one} × 2 = ${one * 2}（${t.u}）`] : []), '画一画：3 个间隔，两头都种，要种 4 棵'],
        hint: '画一条短的路试一试：2 个间隔两头都种要几棵？',
      };
    },
  },
  {
    id: 'g3b-ext-tree-none', grade: 3, term: 2, unit: '拓展：植树问题', name: '植树问题（两端都不种）', process: true,
    tip: '两端都不种：棵数 = 间隔数 − 1；锯木头时，锯的次数 = 段数 − 1', level: 3,
    gen(r) {
      const n = r.name(), s = r.pick([2, 3, 4, 5, 6, 8, 10]), g = r.int(4, 25), L = s * g, kind = r.int(0, 2);
      if (kind === 2) {
        const seg = r.int(3, 9), len = r.int(2, 9), min = r.int(2, 6);
        return { q: `${n}把一根 ${seg * len} 米长的木头锯成每段 ${len} 米的小段，每锯一次要 ${min} 分钟。一共要锯多少分钟？`, answer: [num((seg - 1) * min, { unit: '分钟' })], steps: [`先求能锯成几段：${seg * len} ÷ ${len} = ${seg}（段）`, `锯的次数比段数少 1：${seg} − 1 = ${seg - 1}（次）`, `一共用时：${seg - 1} × ${min} = ${(seg - 1) * min}（分钟）`, '画一画：锯 1 次是 2 段，锯 2 次是 3 段'], hint: '锯成 2 段要锯几次？' };
      }
      const t = kind === 0
        ? { q: `两栋楼之间相距 ${L} 米，在中间每隔 ${s} 米种一棵树（两端靠楼的地方不种）。一共要种多少棵树？`, u: '棵' }
        : { q: `两根电线杆相距 ${L} 米，在它们之间每隔 ${s} 米插一面小旗（电线杆处不插）。一共要插多少面小旗？`, u: '面' };
      return { q: t.q, answer: [num(g - 1, { unit: t.u })], steps: [`先求间隔数：${L} ÷ ${s} = ${g}（个）`, `两端都不种，棵数比间隔数少 1：${g} − 1 = ${g - 1}（${t.u}）`, '画一画：3 个间隔，两头不种，只种中间 2 棵'], hint: '两头不种，中间能种几棵？' };
    },
  },
  {
    id: 'g3b-ext-substitute', grade: 3, term: 2, unit: '拓展：等量代换', name: '等量代换', process: true,
    tip: '用相等的东西去替换：1 个西瓜 = 2 个菠萝，1 个菠萝 = 3 个苹果，那么 1 个西瓜 = 2 × 3 个苹果', level: 3,
    gen(r) {
      const SIZE = ['西瓜', '菠萝', '梨', '苹果', '橘子', '桃子', '草莓'];
      const [A, B, C2] = r.until(() => r.sample([0, 1, 2, 3, 4, 6], 3).sort((x, y) => x - y), ([x, y, z]) => !(y === 2 && z === 3) && !(y === 3 && z === 4) && !(y === 2 && z === 4)).map((i) => SIZE[i]);
      const k1 = r.int(2, 5), k2 = r.int(2, 5), m = r.int(1, 3), kind = r.int(0, 2);
      if (kind === 0) {
        return {
          q: `天平称得：1 个${A}和 ${k1} 个${B}一样重，1 个${B}和 ${k2} 个${C2}一样重。${m} 个${A}和多少个${C2}一样重？`,
          answer: [num(m * k1 * k2, { unit: '个' })],
          steps: [`1 个${A} = ${k1} 个${B}，把每个${B}换成 ${k2} 个${C2}`, `1 个${A} = ${k1} × ${k2} = ${k1 * k2}（个）${C2}`, ...(m > 1 ? [`${m} 个${A} = ${k1 * k2} × ${m} = ${m * k1 * k2}（个）${C2}`] : []), `答：${m * k1 * k2} 个${C2}。`],
          hint: `先想 1 个${A}能换成几个${C2}`,
        };
      }
      if (kind === 1) {
        const p = r.int(2, 9);
        return {
          q: `1 个${A}的价钱和 ${k1} 个${B}一样，1 个${B} ${p} 元。买 ${m + 1} 个${A}要多少元？`,
          answer: [num((m + 1) * k1 * p, { unit: '元' })],
          steps: [`1 个${A}的价钱等于 ${k1} 个${B}：${p} × ${k1} = ${p * k1}（元）`, `${m + 1} 个${A}：${p * k1} × ${m + 1} = ${(m + 1) * k1 * p}（元）`, `答：要 ${(m + 1) * k1 * p} 元。`],
        };
      }
      const [a, b] = r.until(() => [r.int(2, 4), r.int(3, 9)], ([x, y]) => y > x && y % x !== 0), t = r.int(2, 4);
      return {
        q: `天平称得：${a} 个${B}和 ${b} 个${C2}一样重。${a * t} 个${B}和多少个${C2}一样重？`,
        answer: [num(b * t, { unit: '个' })],
        steps: [`${a * t} 个${B}里面有 ${a * t} ÷ ${a} = ${t} 个“${a} 个${B}”`, `每 ${a} 个${B}换成 ${b} 个${C2}，${t} 份就是 ${b} × ${t} = ${b * t}（个）`, `答：${b * t} 个${C2}。`],
        hint: `${a * t} 个${B}是几个“${a} 个${B}”？`,
      };
    },
  },
];

// 简便运算（凑整）和补全算式（竖式数字谜），出题器在 puzzle.js；同名单元会归到原单元里
const PUZZLE = [
  { id: 'g3a-simp-add', grade: 3, term: 1, unit: '万以内的加法和减法（二）', name: '连加凑整巧算', tip: '先找能凑成整百的两个数（个位相加是 10），换到一起先加', level: 1, gen: (r) => PZ.genAddPair(r) },
  { id: 'g3a-puzzle-vadd', grade: 3, term: 1, unit: '万以内的加法和减法（二）', name: '竖式谜：加法', tip: '从个位一列一列推：这一列缺的数 = 得数这一位 - 另一个数（得数小就先借 10），再看有没有进位', level: 2, gen: (r) => PZ.genVAddSub(r, { hide: r.int(2, 3) }) },
  { id: 'g3a-puzzle-vsub', grade: 3, term: 1, unit: '万以内的加法和减法（二）', name: '竖式谜：减法', tip: '从个位一列一列推：缺被减数就用「差 + 减数」，缺减数就用「被减数 - 差」；注意这一位有没有被借走 1', level: 2, gen: (r) => PZ.genVAddSub(r, { sub: true, hide: r.int(2, 3) }) },
  { id: 'g3a-puzzle-vmul', grade: 3, term: 1, unit: '多位数乘一位数', name: '竖式谜：乘一位数', tip: '从个位推起：几乘这个数，积的个位才对？推出来以后，记着把进位带到下一位', level: 2, gen: PZ.genVMul1 },
];
export default [...TERM1_A, ...TERM1_B, ...TERM1_C, ...PUZZLE, ...TERM2_A, ...TERM2_B, ...TERM2_C];
