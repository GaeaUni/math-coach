// 五年级题库（人教版单元顺序；上册 term 1，下册 term 2）
// 本文件里的局部工具：小数乘法竖式 vMulDec、小数除法竖式 longDiv（lib 的 vMul / vDiv 只支持整数）、
// 短除法、数对方格图、折线统计图、观察物体的视图；fitter 照抄 lib 里没导出的同名函数，
// 用来给 fig.poly 补标注（平行四边形、三角形按真实比例画，lib 的 parallelogram / triangle 会把高宽比夹住）。
import { fig, fmt, fix, frac, fracText, gcd, lcm, simplify, isPrime, factors, primeFactors, decimals, round } from '../js/lib.js';

const S = [];

// ---------- 数与答案 ----------
const P10 = (k) => 10 ** k;
const CNK = ['零', '一', '两', '三', '四', '五', '六', '七', '八', '九', '十'];
const cn = (k) => CNK[k] ?? String(k);
/** 随机小数：恰好 p 位小数（末位不是 0），在 [lo, hi] 内 */
const rdec = (r, lo, hi, p) => r.until(() => fix(r.int(Math.ceil(lo * P10(p)), Math.floor(hi * P10(p))) / P10(p)), (x) => decimals(x) === p);
/** 去掉小数点后的整数：2.35 → 235，0.06 → 6 */
const intOf = (x) => Math.round(fix(x * P10(decimals(x))));
/** 整数 n 点上 p 位小数（保留末尾 0，位数不够前面补 0）：placePoint(6, 3) → '0.006' */
function placePoint(n, p) {
  if (!p) return String(n);
  const s = String(n).padStart(p + 1, '0');
  return s.slice(0, -p) + '.' + s.slice(-p);
}
const num = (value, extra = {}) => ({ kind: 'num', value: fix(value), ...extra });
const choice = (options, value, extra = {}) => ({ kind: 'choice', options, value, ...extra });
const CMP = ['>', '<', '='];
const cmp = (a, b) => (fix(a) > fix(b) ? '>' : fix(a) < fix(b) ? '<' : '=');
/** 分数答案：自动约分，结果是整数时用 num */
function fans(n, d, extra = {}) {
  const [a, b] = simplify(n, d);
  return b === 1 ? num(a, extra) : { kind: 'frac', value: [a, b], ...extra };
}
/** 分数答案（假分数出带分数格子） */
function fansM(n, d, extra = {}) {
  const [a, b] = simplify(n, d);
  return b === 1 ? num(a, extra) : { kind: 'frac', value: [a, b], ...(a > b ? { mixed: true } : {}), ...extra };
}
const F = (n, d) => fracText(n, d); // 最简分数标记（整数就写整数）
const FM = (n, d) => fracText(n, d, { asMixed: true });
/** 带分数标记（w n/d），n 为 0 时写整数 */
const MX = (w, n, d) => (n ? `{{${w} ${n}/${d}}}` : String(w));
/** 四舍五入的说明：看第 p+1 位 */
function roundWhy(x, p) {
  const s = fmt(x);
  const [, dp = ''] = s.split('.');
  const nd = Number(dp[p] ?? 0);
  const place = p === 0 ? '十分位' : p === 1 ? '百分位' : p === 2 ? '千分位' : `第 ${p + 1} 位小数`;
  return `保留${p === 0 ? '整数' : cn(p) + '位小数'}，看${place}上的 ${nd}：${nd >= 5 ? '满 5，向前一位进 1' : '比 5 小，舍去'}`;
}

// ---------- 竖式 ----------
/** 把数字串放进 w 个数位格（右对齐，右边空 shift 格），小数点画在格与格的空隙里 */
function cellRow(s, w, shift = 0) {
  const [ip, dp = ''] = s.split('.');
  const ds = (ip + dp).split('');
  const cells = [...Array(Math.max(0, w - ds.length - shift)).fill(' '), ...ds, ...Array(shift).fill(' ')];
  return { cells, pointAfter: dp ? cells.length - 1 - shift - dp.length : -1 };
}
function cellText({ cells, pointAfter }) {
  let o = '';
  cells.forEach((c, i) => { o += c; if (i < cells.length - 1) o += i === pointAfter ? '.' : ' '; });
  return o;
}
const rowText = (s, w, sign = ' ', shift = 0) => (sign + ' ' + cellText(cellRow(s, w, shift))).replace(/\s+$/, '');
const ruleW = (w) => '  ' + '─'.repeat(w * 2 - 1);
const digitLen = (s) => s.replace('.', '').length;

/** 小数乘法竖式（末位对齐，积保留末尾 0，课本写法） */
function vMulDec(a, b) {
  let [x, y] = [a, b];
  if (digitLen(fmt(y)) > digitLen(fmt(x))) [x, y] = [y, x];
  const ix = intOf(x), iy = intOf(y), dec = decimals(x) + decimals(y);
  const prodS = placePoint(ix * iy, dec);
  const ys = String(iy).split('').reverse().map(Number);
  const parts = ys.length > 1 ? ys.map((d, i) => ({ s: String(ix * d), shift: i, d })).filter((p) => p.d) : [];
  const w = Math.max(digitLen(fmt(x)), digitLen(fmt(y)), digitLen(prodS), ...parts.map((p) => p.s.length + p.shift));
  const rows = [rowText(fmt(x), w), rowText(fmt(y), w, '×'), ruleW(w)];
  if (parts.length > 1) {
    parts.forEach((p) => rows.push(rowText(p.s, w, ' ', p.shift)));
    rows.push(ruleW(w));
  }
  rows.push(rowText(prodS, w));
  return { pre: rows.join('\n') };
}

/** 除数是整数的除法竖式；被除数可以是小数，不够除时在末尾添 0 继续除，最多除到 maxDec 位小数。
 *  返回 { q: 商（截到这一位）, exact: 是否除尽, pre: 竖式 } */
function longDiv(dividend, d, maxDec = 8) {
  const s = fmt(dividend);
  const [ip, dp = ''] = s.split('.');
  const D = (ip + dp).split('').map(Number);
  const ipLen = ip.length, origLen = D.length;
  const qd = [], steps = [];
  let cur = 0, started = false, i = 0;
  for (; ; i++) {
    if (i - ipLen >= maxDec) break;
    if (i >= D.length) { if (cur === 0) break; D.push(0); }
    cur = cur * 10 + D[i];
    if (!started && i < ipLen - 1 && cur < d) { qd.push(' '); continue; }
    started = true;
    const k = Math.floor(cur / d);
    qd.push(String(k));
    steps.push({ col: i, cur, prod: k * d, rem: cur - k * d });
    cur -= k * d;
  }
  D.length = Math.max(i, ipLen);
  const n = D.length;
  const intPart = qd.slice(0, ipLen).join('').trim() || '0', decPart = qd.slice(ipLen).join('');
  const q = Number(intPart + (decPart ? '.' + decPart : ''));
  const ds = String(d), pad = ' '.repeat(ds.length + 2);
  const colStr = (v, col) => {
    const t = String(v); const start = col - t.length + 1;
    let l = ''; for (let c = 0; c < n; c++) l += (c >= start && c <= col ? t[c - start] : ' ') + ' ';
    return (pad + ' ' + l).replace(/\s+$/, '');
  };
  const rule = (from, to) => { let l = ''; for (let c = 0; c < n; c++) l += c >= from && c <= to ? '──' : '  '; return (pad + l).replace(/\s+$/, ''); };
  const rows = [];
  rows.push((pad + ' ' + cellText({ cells: qd, pointAfter: decPart ? ipLen - 1 : -1 })).replace(/\s+$/, ''));
  rows.push(pad.slice(0, -1) + '┌' + '─'.repeat(n * 2));
  rows.push(ds + ' │ ' + cellText({ cells: D.map(String), pointAfter: n > ipLen ? ipLen - 1 : -1 }));
  let shown = steps.filter((st) => st.prod > 0);
  if (!shown.length) shown = [steps[steps.length - 1]];
  shown.forEach((st, k) => {
    if (k > 0) rows.push(colStr(st.cur, st.col));
    rows.push(colStr(st.prod, st.col));
    rows.push(rule(st.col - Math.max(String(st.cur).length, String(st.prod).length) + 1, st.col));
    if (k === shown.length - 1) { const last = steps[steps.length - 1]; rows.push(colStr(last.rem, last.col)); }
  });
  return { q, exact: cur === 0 && i >= origLen, pre: rows.join('\n') };
}

/** 一个数的短除法（分解质因数） */
function shortDivPF(n) {
  const pf = primeFactors(n);
  const w = String(n).length;
  const rows = [];
  let cur = n;
  pf.slice(0, -1).forEach((p) => {
    rows.push(`${String(p).padStart(2)} │ ${String(cur).padStart(w)}`);
    rows.push(`   └${'─'.repeat(w + 2)}`);
    cur /= p;
  });
  rows.push(`     ${String(cur).padStart(w)}`);
  return { pre: rows.join('\n') };
}
/** 两个数的短除法：用公有的质因数连续去除，直到两个商互质 */
function shortDiv2(a, b) {
  const rows = [], divs = [];
  let x = a, y = b;
  const w = Math.max(String(a).length, String(b).length);
  const line = (p, u, v) => `${p ? String(p).padStart(2) + ' │ ' : '     '}${String(u).padStart(w)}   ${String(v).padStart(w)}`;
  for (;;) {
    const p = primeFactors(gcd(x, y))[0];
    if (!p || gcd(x, y) === 1) break;
    rows.push(line(p, x, y));
    rows.push(`   └${'─'.repeat(2 * w + 5)}`);
    divs.push(p); x /= p; y /= p;
  }
  rows.push(line(0, x, y));
  return { divs, x, y, pre: { pre: rows.join('\n') } };
}

// ---------- 配图 ----------
const C = fig.colors;
const TX = fig.text;
/** 和 lib 的 fig.poly 一样的缩放（用来在 poly 的 extra 里补标注；pts 要连同 dashed 的端点一起传） */
function fitter(pts, W = 360, H = 240, pad = 52) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const k = Math.min((W - 2 * pad) / (maxX - minX || 1), (H - 2 * pad) / (maxY - minY || 1));
  const ox = (W - (maxX - minX) * k) / 2, oy = (H - (maxY - minY) * k) / 2;
  return ([x, y]) => [ox + (x - minX) * k, H - (oy + (y - minY) * k)];
}
/** 数对方格图：列从左往右、行从下往上，pts: [{c, r, label}] */
function gridFig(cols, rows, pts, { cell = 34, segs = [] } = {}) {
  const ox = 34, oy = 26, W = ox + cols * cell + 34, H = oy + rows * cell + 30;
  const X = (c) => ox + c * cell, Y = (k) => oy + (rows - k) * cell;
  let s = '';
  for (let c = 0; c <= cols; c++) s += `<line x1="${X(c)}" y1="${Y(0)}" x2="${X(c)}" y2="${Y(rows)}" stroke="${c ? '#c9d2e3' : C.line}" stroke-width="${c ? 1 : 2}"/>`;
  for (let k = 0; k <= rows; k++) s += `<line x1="${X(0)}" y1="${Y(k)}" x2="${X(cols)}" y2="${Y(k)}" stroke="${k ? '#c9d2e3' : C.line}" stroke-width="${k ? 1 : 2}"/>`;
  for (let c = 0; c <= cols; c++) s += TX(X(c), Y(0) + 15, String(c), { size: 13 });
  for (let k = 1; k <= rows; k++) s += TX(X(0) - 13, Y(k), String(k), { size: 13 });
  s += TX(X(cols) + 18, Y(0) + 15, '列', { size: 13, color: C.dash }) + TX(X(0) - 13, Y(rows) - 14, '行', { size: 13, color: C.dash });
  for (const [a, b] of segs) s += `<line x1="${X(a.c)}" y1="${Y(a.r)}" x2="${X(b.c)}" y2="${Y(b.r)}" stroke="${C.line}" stroke-width="3"/>`;
  for (const p of pts) s += `<circle cx="${X(p.c)}" cy="${Y(p.r)}" r="5" fill="${C.acc}"/>` + TX(X(p.c) + 11, Y(p.r) - 11, p.label, { size: 15, weight: 'bold' });
  return fig.raw(W, H, s);
}
/** 折线统计图：labels 横轴，series [{name, values}]（1~2 条），每个点标数值 */
function lineChart(labels, series, { unit = '', title = '' } = {}) {
  const W = 540, H = 300, ox = 56, oy = title ? 44 : 24, pw = W - ox - 24, ph = H - oy - 46;
  const maxV = Math.max(...series.flatMap((s) => s.values));
  const raw = maxV / 5, mag = 10 ** Math.floor(Math.log10(raw)), step = [1, 2, 5, 10].map((m) => m * mag).find((x) => x >= raw);
  const top = Math.ceil(maxV / step) * step;
  const X = (i) => ox + (labels.length === 1 ? pw / 2 : (i + 0.5) * (pw / labels.length));
  const Y = (v) => oy + ph - (v / top) * ph;
  let s = title ? TX(W / 2, 18, title, { size: 16, weight: 'bold' }) : '';
  for (let v = 0; v <= top + 1e-9; v = fix(v + step)) {
    s += `<line x1="${ox}" y1="${Y(v)}" x2="${ox + pw}" y2="${Y(v)}" stroke="${v ? '#dfe5ef' : C.line}" stroke-width="${v ? 1 : 2}"/>`;
    s += TX(ox - 8, Y(v), fmt(v), { size: 12, anchor: 'end' });
  }
  s += `<line x1="${ox}" y1="${Y(0)}" x2="${ox}" y2="${oy - 6}" stroke="${C.line}" stroke-width="2"/>`;
  if (unit) s += TX(ox - 8, oy - 14, unit, { size: 12, anchor: 'end', color: C.dash });
  labels.forEach((l, i) => { s += TX(X(i), Y(0) + 16, l, { size: 13 }); });
  const colors = [C.acc, '#2f6fde'];
  series.forEach((se, k) => {
    const pts = se.values.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
    s += `<polyline points="${pts}" fill="none" stroke="${colors[k]}" stroke-width="2.5" ${k ? 'stroke-dasharray="7 4"' : ''}/>`;
    se.values.forEach((v, i) => {
      s += `<circle cx="${X(i)}" cy="${Y(v)}" r="4" fill="${colors[k]}"/>`;
      const o = series[1 - k]?.values[i], above = o === undefined || v > o || (v === o && k === 0);
      s += TX(X(i), Y(v) + (above ? -13 : 15), fmt(v), { size: 12, color: colors[k] });
    });
  });
  if (series.length > 1) series.forEach((se, k) => {
    const lx = ox + pw - 150 + k * 80;
    s += `<line x1="${lx}" y1="${H - 10}" x2="${lx + 22}" y2="${H - 10}" stroke="${colors[k]}" stroke-width="2.5" ${k ? 'stroke-dasharray="7 4"' : ''}/>` + TX(lx + 26, H - 10, se.name, { size: 12, anchor: 'start' });
  });
  return fig.raw(W, H, s);
}
/** 观察物体：从正面看（每列的高度）和从上面看（rows[行][列]，第 0 行在最后面） */
function viewsFig(front, top) {
  const u = 26, gap = 60, cols = front.length, depth = top.length, hMax = Math.max(...front);
  const H = 40 + Math.max(hMax, depth) * u + 20, W = 30 + cols * u + gap + cols * u + 30;
  const sq = (x, y) => `<rect x="${x}" y="${y}" width="${u}" height="${u}" fill="${C.fill}" stroke="${C.line}" stroke-width="2"/>`;
  let s = '';
  const base = 30 + Math.max(hMax, depth) * u;
  front.forEach((h, c) => { for (let k = 0; k < h; k++) s += sq(30 + c * u, base - (k + 1) * u); });
  const x2 = 30 + cols * u + gap;
  top.forEach((row, rr) => row.forEach((on, c) => { if (on) s += sq(x2 + c * u, base - (depth - rr) * u); }));
  s += TX(30 + (cols * u) / 2, base + 18, '从正面看', { size: 14 }) + TX(x2 + (cols * u) / 2, base + 18, '从上面看', { size: 14 });
  return fig.raw(W, H, s);
}

// ---------- 情境里常用的 ----------
const pickN = (r, k) => r.names(k);

// ======================= 五年级上册 =======================
// ---------- 第 1 单元 小数乘法 ----------
const U11 = '小数乘法';

/** 小数乘法的算理（不含竖式）：按整数乘 → 数小数位数点小数点 → 去掉末尾 0 */
function mulExplain(a, b) {
  const da = decimals(a), db = decimals(b), dec = da + db;
  const ia = intOf(a), ib = intOf(b), pi = ia * ib;
  const raw = placePoint(pi, dec), res = fix(a * b);
  const st = [`先不看小数点，按整数乘法算：${ia} × ${ib} = ${pi}`];
  const who = da && db ? `两个因数一共有 ${da} + ${db} = ${dec} 位小数` : `因数 ${fmt(da ? a : b)} 有 ${dec} 位小数`;
  st.push(`${who}，积就有 ${dec} 位小数：从 ${pi} 的右边起数出 ${dec} 位点上小数点${String(pi).length < dec ? '，位数不够，在前面用 0 补足' : String(pi).length === dec ? '，整数部分写 0' : ''}，得 ${raw}`);
  if (raw !== fmt(res)) st.push(`小数末尾的 0 可以去掉：${raw} = ${fmt(res)}`);
  return { st, res, raw, dec, pi };
}

S.push(
  {
    id: 'g5a-dmul-int-oral', grade: 5, term: 1, unit: U11, name: '小数乘整数（口算）',
    tip: '先按整数乘，因数有几位小数，就从积的右边数出几位点上小数点', level: 1, speed: 8,
    gen(r) {
      const k = r.int(0, 4);
      let a, b;
      if (k === 0) { a = r.int(1, 9) / 10; b = r.int(2, 9); }
      else if (k === 1) { a = r.int(1, 9) / 100; b = r.int(2, 9); }
      else if (k === 2) { a = rdec(r, 1.1, 4.9, 1); b = r.int(2, 4); }
      else if (k === 3) { a = rdec(r, 0.11, 0.33, 2); b = r.int(2, 3); }
      else [a, b] = r.pick([[0.25, 4], [0.25, 8], [1.25, 8], [0.125, 8], [2.5, 4], [0.5, 6], [0.75, 4], [1.5, 4], [0.05, 20], [0.4, 25], [0.2, 50], [0.04, 25], [0.5, 18], [2.5, 8], [0.6, 15], [0.3, 30], [1.2, 50], [0.8, 5], [0.35, 2]]);
      a = fix(a);
      const { st, res } = mulExplain(a, b);
      const [x, y] = r.chance(0.3) ? [b, a] : [a, b];
      return {
        q: `${fmt(x)} × ${fmt(y)} = {0}`,
        answer: [num(res)],
        steps: [...st, `所以 ${fmt(x)} × ${fmt(y)} = ${fmt(res)}`],
        hint: `先算 ${intOf(a)} × ${b}，再看因数有几位小数`,
      };
    },
  },
  {
    id: 'g5a-dmul-int-vertical', grade: 5, term: 1, unit: U11, name: '小数乘整数（笔算）',
    tip: '末位对齐，按整数乘法算，再看因数有几位小数就点几位', level: 1,
    gen(r) {
      const a = r.bool() ? rdec(r, 1.1, 99.9, 1) : rdec(r, 0.11, 9.99, 2);
      const b = r.chance(0.7) ? r.until(() => r.int(12, 98), (x) => x % 10 !== 0) : r.int(3, 9);
      const { st, res } = mulExplain(a, b);
      return {
        q: `${fmt(a)} × ${b} = {0}`,
        answer: [num(res)],
        steps: ['笔算时把两个因数的末位对齐（不用对齐小数点）', st[0], vMulDec(a, b), ...st.slice(1), `${fmt(a)} × ${b} = ${fmt(res)}`],
        hint: '先把小数看成整数来乘',
      };
    },
  },
  {
    id: 'g5a-dmul-dec', grade: 5, term: 1, unit: U11, name: '小数乘小数（笔算）',
    tip: '两个因数一共有几位小数，积就有几位小数', level: 1,
    gen(r) {
      const { a, b } = r.until(() => {
        const a = r.bool() ? rdec(r, 1.1, 39.9, 1) : rdec(r, 0.11, 9.99, 2);
        const b = r.chance(0.7) ? rdec(r, 0.2, 9.9, 1) : rdec(r, 0.12, 2.99, 2);
        return { a, b };
      }, ({ a, b }) => {
        const pi = intOf(a) * intOf(b), dec = decimals(a) + decimals(b);
        return String(pi).length > dec && pi % 10 !== 0 && intOf(b) >= 2 && intOf(a) <= 999;
      });
      const { st, res } = mulExplain(a, b);
      return {
        q: `${fmt(a)} × ${fmt(b)} = {0}`,
        answer: [num(res)],
        steps: [st[0], vMulDec(a, b), ...st.slice(1), `${fmt(a)} × ${fmt(b)} = ${fmt(res)}`],
        hint: '数一数两个因数一共有几位小数',
      };
    },
  },
  {
    id: 'g5a-dmul-dec-zero', grade: 5, term: 1, unit: U11, name: '小数乘小数（补0和去0）',
    tip: '积的位数不够时在前面补 0 再点小数点；积末尾的 0 要先点小数点再去掉', level: 2,
    gen(r) {
      const pad = r.bool();
      const { a, b } = r.until(() => {
        if (pad) return { a: r.bool() ? rdec(r, 0.01, 0.49, 2) : rdec(r, 0.1, 0.9, 1), b: r.bool() ? rdec(r, 0.1, 0.9, 1) : rdec(r, 0.02, 0.35, 2) };
        const pairs = [[r.pick([0.5, 1.5, 2.5, 3.5, 4.5, 0.25, 0.75, 1.25, 0.15, 0.35, 0.45, 0.65]), r.pick([0.2, 0.4, 0.6, 0.8, 1.2, 1.4, 1.6, 2.4])]];
        const [a, b] = pairs[0];
        return { a, b };
      }, ({ a, b }) => {
        const pi = intOf(a) * intOf(b), dec = decimals(a) + decimals(b);
        return pad ? String(pi).length < dec : pi % 10 === 0;
      });
      const [x, y] = r.bool() ? [a, b] : [b, a];
      const { st, res } = mulExplain(x, y);
      return {
        q: `${fmt(x)} × ${fmt(y)} = {0}`,
        answer: [num(res)],
        steps: [st[0], vMulDec(x, y), ...st.slice(1), `${fmt(x)} × ${fmt(y)} = ${fmt(res)}`],
        hint: pad ? '积的位数不够时怎么办？' : '先点小数点，再看末尾的 0',
      };
    },
  },
  {
    id: 'g5a-dmul-places', grade: 5, term: 1, unit: U11, name: '积有几位小数', pool: 60,
    tip: '不用算完：两个因数的小数位数加起来，就是积的小数位数（积末尾不是 0 时）', level: 1, speed: 8,
    gen(r) {
      const { a, b } = r.until(() => {
        const a = r.chance(0.2) ? r.int(12, 99) : rdec(r, 0.11, 30, r.int(1, 3));
        const b = rdec(r, 0.12, 9.9, r.int(1, 2));
        return { a, b };
      }, ({ a, b }) => decimals(a) + decimals(b) <= 5 && ((intOf(a) % 10) * (intOf(b) % 10)) % 10 !== 0);
      const da = decimals(a), db = decimals(b), ea = intOf(a) % 10, eb = intOf(b) % 10;
      return {
        q: `不计算，${fmt(a)} × ${fmt(b)} 的积有 {0} 位小数`,
        answer: [num(da + db)],
        steps: [
          (da && db ? `${fmt(a)} 有 ${da} 位小数，${fmt(b)} 有 ${db} 位小数，一共 ${da} + ${db} = ${da + db} 位` : `${fmt(da ? b : a)} 是整数，没有小数；${fmt(da ? a : b)} 有 ${da + db} 位小数，一共 ${da + db} 位`),
          `再看末位：${ea} × ${eb} = ${ea * eb}，积的末尾不是 0，小数位数不会减少`,
          `所以积有 ${da + db} 位小数（${fmt(a)} × ${fmt(b)} = ${fmt(fix(a * b))}）`,
        ],
        hint: '数一数两个因数各有几位小数',
      };
    },
  },
  {
    id: 'g5a-dmul-from-int', grade: 5, term: 1, unit: U11, name: '根据整数乘法写积',
    tip: '数字不变，只看两个因数一共有几位小数，积就点几位', level: 1,
    gen(r) {
      const x = r.until(() => r.int(12, 999), (v) => v % 10 !== 0), y = r.until(() => r.int(12, 99), (v) => v % 10 !== 0);
      const p = x * y;
      const opts = [];
      for (let pa = 0; pa <= Math.min(3, String(x).length); pa++) for (let pb = 0; pb <= 2; pb++) if (pa + pb >= 1 && pa + pb <= 4) opts.push([pa, pb]);
      const two = r.sample(opts, 2).map(([pa, pb]) => {
        const A = fix(x / P10(pa)), B = fix(y / P10(pb));
        return { A, B, k: pa + pb, raw: placePoint(p, pa + pb), res: fix(A * B) };
      });
      const line = (t) => `${fmt(t.A)} × ${fmt(t.B)}：因数一共有 ${t.k} 位小数，从 ${p} 的右边数出 ${t.k} 位 → ${t.raw}${t.raw !== fmt(t.res) ? ` = ${fmt(t.res)}` : ''}`;
      return {
        q: `已知 ${x} × ${y} = ${p}，直接写出得数。\n${fmt(two[0].A)} × ${fmt(two[0].B)} = {0}\n${fmt(two[1].A)} × ${fmt(two[1].B)} = {1}`,
        answer: [num(two[0].res), num(two[1].res)],
        steps: ['因数里的数字和整数乘法一样，积里的数字也一样，只是小数点位置不同', line(two[0]), line(two[1])],
        hint: `积里的数字都是 ${p}，只要定小数点`,
      };
    },
  },
  {
    id: 'g5a-dmul-compare', grade: 5, term: 1, unit: U11, name: '积与因数比大小',
    tip: '一个数（0 除外）乘大于 1 的数，积比它大；乘小于 1 的数，积比它小', level: 1, speed: 8,
    gen(r) {
      const a = r.bool() ? rdec(r, 0.5, 30, r.int(1, 2)) : r.int(2, 60);
      const kind = r.chance(0.12) ? 'eq' : r.pick(['lt', 'gt']);
      const b = kind === 'lt' ? rdec(r, 0.01, 0.99, r.int(1, 2)) : kind === 'gt' ? rdec(r, 1.01, 3.6, r.int(1, 2)) : 1;
      const ans = kind === 'lt' ? '<' : kind === 'gt' ? '>' : '=';
      const left = r.bool() ? `${fmt(a)} × ${fmt(b)}` : `${fmt(b)} × ${fmt(a)}`;
      return {
        q: `${left} {0} ${fmt(a)}`,
        answer: [choice(CMP, ans)],
        steps: [
          `${fmt(a)} 乘的另一个因数是 ${fmt(b)}，它${b < 1 ? '比 1 小' : b > 1 ? '比 1 大' : '等于 1'}`,
          b < 1 ? `乘一个比 1 小的数，积比 ${fmt(a)} 小` : b > 1 ? `乘一个比 1 大的数，积比 ${fmt(a)} 大` : `乘 1 还得原数，积等于 ${fmt(a)}`,
          `所以 ${left} ${ans} ${fmt(a)}（积是 ${fmt(fix(a * b))}）`,
        ],
        hint: '不用算，看另一个因数比 1 大还是比 1 小',
      };
    },
  },
  {
    id: 'g5a-dmul-approx', grade: 5, term: 1, unit: U11, name: '积的近似数',
    tip: '先算出积，再看要保留的下一位：四舍五入', level: 1,
    gen(r) {
      const p = r.pick([0, 1, 2, 2]);
      const o = r.until(() => {
        const a = rdec(r, 0.5, 30, r.int(1, 2)), b = rdec(r, 0.3, 9, r.int(1, 2));
        const exact = fix(a * b);
        return { a, b, exact, approx: round(exact, p) };
      }, (o) => decimals(o.exact) > p && decimals(o.exact) <= 4 && o.approx > 0 && (p === 0 || decimals(o.approx) === p) && intOf(o.a) * intOf(o.b) < 100000);
      return {
        q: `${fmt(o.a)} × ${fmt(o.b)} ≈ {0}（得数保留${p ? cn(p) + '位小数' : '整数'}）`,
        answer: [num(o.approx)],
        steps: [`先算出积：${fmt(o.a)} × ${fmt(o.b)} = ${fmt(o.exact)}`, vMulDec(o.a, o.b), roundWhy(o.exact, p), `${fmt(o.exact)} ≈ ${fmt(o.approx)}`],
        hint: p ? `算到第 ${p + 1} 位小数就够了` : '看十分位',
      };
    },
  },
  {
    id: 'g5a-dmul-easy-assoc', grade: 5, term: 1, unit: U11, name: '小数乘法简便运算（凑整）',
    tip: '找能凑成整十、整百或 1 的一对：0.25×4=1，1.25×8=10，2.5×4=10', level: 2,
    gen(r) {
      const PAIRS = [[0.25, 4], [1.25, 8], [2.5, 4], [0.125, 8], [12.5, 8], [2.5, 0.4], [0.25, 40], [1.25, 0.8], [0.2, 5], [0.5, 20], [25, 0.4], [0.4, 2.5]];
      const [p, q] = r.pick(PAIRS), pq = fix(p * q);
      if (r.bool()) {
        const x = rdec(r, 1.1, 99.9, r.int(1, 2));
        const forms = [[`${fmt(p)} × ${fmt(x)} × ${fmt(q)}`, `${fmt(p)} × ${fmt(q)} × ${fmt(x)}`], [`${fmt(x)} × ${fmt(q)} × ${fmt(p)}`, `${fmt(x)} × (${fmt(q)} × ${fmt(p)})`]];
        const [expr, re] = r.pick(forms);
        const res = fix(pq * x);
        return {
          q: `用简便方法计算：${expr} = {0}`,
          answer: [num(res)],
          steps: [`${fmt(p)} × ${fmt(q)} = ${fmt(pq)}，先把它们放在一起算（乘法交换律、结合律）`, `${expr}\n= ${re}\n= ${fmt(pq)} × ${fmt(x)}\n= ${fmt(res)}`],
          hint: `哪两个数相乘能得到整数？`,
        };
      }
      const m = rdec(r, 0.2, 3.9, 1), y = fix(q * m), res = fix(pq * m);
      return {
        q: `用简便方法计算：${fmt(p)} × ${fmt(y)} = {0}`,
        answer: [num(res)],
        steps: [`${fmt(p)} 和 ${fmt(q)} 相乘得 ${fmt(pq)}，把 ${fmt(y)} 拆成 ${fmt(q)} × ${fmt(m)}`, `${fmt(p)} × ${fmt(y)}\n= ${fmt(p)} × ${fmt(q)} × ${fmt(m)}\n= ${fmt(pq)} × ${fmt(m)}\n= ${fmt(res)}`],
        hint: `${fmt(p)} 和谁相乘能凑整？试着把 ${fmt(y)} 拆开`,
      };
    },
  },
  {
    id: 'g5a-dmul-easy-dist', grade: 5, term: 1, unit: U11, name: '小数乘法简便运算（分配律）',
    tip: '乘法分配律：a×b+a×c=a×(b+c)；接近整数的数拆成整数加减一个数', level: 2,
    gen(r) {
      const k = r.int(0, 3);
      if (k === 0) {
        const a = rdec(r, 0.2, 9.9, r.int(1, 2)), Sm = r.pick([1, 10, 10, 100]);
        const b = Sm === 1 ? rdec(r, 0.11, 0.89, r.int(1, 2)) : Sm === 10 ? rdec(r, 1.1, 8.9, 1) : rdec(r, 11, 89, 1);
        const c = fix(Sm - b), res = fix(a * Sm);
        const expr = r.bool() ? `${fmt(a)} × ${fmt(b)} + ${fmt(a)} × ${fmt(c)}` : `${fmt(b)} × ${fmt(a)} + ${fmt(c)} × ${fmt(a)}`;
        return {
          q: `用简便方法计算：${expr} = {0}`, answer: [num(res)],
          steps: [`两个积里都有因数 ${fmt(a)}，${fmt(b)} + ${fmt(c)} = ${Sm} 正好凑整，用乘法分配律`, `${expr}\n= ${fmt(a)} × (${fmt(b)} + ${fmt(c)})\n= ${fmt(a)} × ${Sm}\n= ${fmt(res)}`],
          hint: '两个积里有没有相同的因数？',
        };
      }
      if (k === 1) {
        const a = rdec(r, 0.2, 9.9, r.int(1, 2)), D = r.pick([1, 10]);
        const c = D === 1 ? rdec(r, 0.1, 5.9, 1) : rdec(r, 0.1, 9.9, 1), b = fix(c + D), res = fix(a * D);
        const expr = `${fmt(a)} × ${fmt(b)} - ${fmt(a)} × ${fmt(c)}`;
        return {
          q: `用简便方法计算：${expr.replace(' - ', ' − ')} = {0}`, answer: [num(res)],
          steps: [`两个积里都有因数 ${fmt(a)}，${fmt(b)} − ${fmt(c)} = ${D}，用乘法分配律`, `${fmt(a)} × ${fmt(b)} − ${fmt(a)} × ${fmt(c)}\n= ${fmt(a)} × (${fmt(b)} − ${fmt(c)})\n= ${fmt(a)} × ${D}\n= ${fmt(res)}`],
          hint: '两个积里有没有相同的因数？',
        };
      }
      if (k === 2) {
        const [m, base, d] = r.pick([[101, 100, 1], [99, 100, -1], [102, 100, 2], [98, 100, -2], [1.01, 1, 0.01], [0.99, 1, -0.01], [10.1, 10, 0.1], [9.9, 10, -0.1], [1.02, 1, 0.02], [201, 200, 1]]);
        const a = rdec(r, 0.12, 9.9, r.int(1, 2));
        const p1 = fix(a * base), p2 = fix(a * Math.abs(d)), res = fix(a * m);
        const sg = d > 0 ? '+' : '−';
        return {
          q: `用简便方法计算：${fmt(a)} × ${fmt(m)} = {0}`, answer: [num(res)],
          steps: [`${fmt(m)} 接近 ${base}，把它写成 ${base} ${sg} ${fmt(Math.abs(d))}，再用乘法分配律`, `${fmt(a)} × ${fmt(m)}\n= ${fmt(a)} × (${base} ${sg} ${fmt(Math.abs(d))})\n= ${fmt(a)} × ${base} ${sg} ${fmt(a)} × ${fmt(Math.abs(d))}\n= ${fmt(p1)} ${sg} ${fmt(p2)}\n= ${fmt(res)}`],
          hint: `${fmt(m)} 接近哪个整数？`,
        };
      }
      const [m, Sm] = r.pick([[99, 100], [9.9, 10], [999, 1000], [0.9, 1], [1.9, 2]]);
      const a = rdec(r, 0.2, 9.9, r.int(1, 2)), extra = fix(Sm - m), res = fix(a * Sm);
      const tail = extra === 1 ? fmt(a) : `${fmt(a)} × ${fmt(extra)}`;
      return {
        q: `用简便方法计算：${fmt(a)} × ${fmt(m)} + ${tail} = {0}`, answer: [num(res)],
        steps: [extra === 1 ? `${fmt(a)} 可以看成 ${fmt(a)} × 1，两个积都有因数 ${fmt(a)}` : `两个积都有因数 ${fmt(a)}`, `${fmt(a)} × ${fmt(m)} + ${tail}\n= ${fmt(a)} × (${fmt(m)} + ${fmt(extra)})\n= ${fmt(a)} × ${Sm}\n= ${fmt(res)}`],
        hint: extra === 1 ? `${fmt(a)} 也可以看成 ${fmt(a)} × 1` : '两个积里有相同的因数',
      };
    },
  },
  {
    id: 'g5a-dmul-word', grade: 5, term: 1, unit: U11, name: '小数乘法解决问题', process: true,
    tip: '先找数量关系（单价×数量=总价、速度×时间=路程），再列乘法算式', level: 1,
    gen(r) {
      const nm = r.name();
      const t = r.pick([
        () => { const p = rdec(r, 3.5, 12.8, 1), q = rdec(r, 1.2, 5.8, 1); return { q: `苹果每千克 ${fmt(p)} 元，${nm}买了 ${fmt(q)} 千克，一共要付多少元？`, rel: '单价 × 数量 = 总价', ex: `${fmt(p)} × ${fmt(q)}`, v: fix(p * q), u: '元', a: '一共要付' }; },
        () => { const v = r.int(45, 95), t = rdec(r, 1.2, 4.8, 1); return { q: `一辆汽车平均每小时行 ${v} 千米，${fmt(t)} 小时行多少千米？`, rel: '速度 × 时间 = 路程', ex: `${v} × ${fmt(t)}`, v: fix(v * t), u: '千米', a: '行了' }; },
        () => { const a = rdec(r, 8, 25, 1), b = rdec(r, 3, Math.min(9.8, a - 2), 1); return { q: `一块长方形菜地长 ${fmt(a)} 米，宽 ${fmt(b)} 米，这块菜地的面积是多少平方米？`, rel: '长方形面积 = 长 × 宽', ex: `${fmt(a)} × ${fmt(b)}`, v: fix(a * b), u: '平方米', a: '面积是' }; },
        () => { const w = r.int(25, 38), k = rdec(r, 1.5, 2.4, 1); return { q: `${nm}的体重是 ${w} 千克，爸爸的体重是${nm}的 ${fmt(k)} 倍。爸爸的体重是多少千克？`, rel: `求一个数的几倍是多少，用乘法：${nm}的体重 × ${fmt(k)}`, ex: `${w} × ${fmt(k)}`, v: fix(w * k), u: '千克', a: '爸爸的体重是' }; },
        () => { const p = rdec(r, 7.1, 8.9, 1), q = r.int(20, 50); return { q: `每升汽油 ${fmt(p)} 元，${nm}爸爸给汽车加了 ${q} 升汽油，要付多少元？`, rel: '单价 × 数量 = 总价', ex: `${fmt(p)} × ${q}`, v: fix(p * q), u: '元', a: '要付' }; },
        () => { const x = rdec(r, 1.8, 3.6, r.int(1, 2)), n = r.int(12, 45); return { q: `做一套校服用布 ${fmt(x)} 米，做 ${n} 套这样的校服一共用布多少米？`, rel: '每套用布 × 套数 = 一共用布', ex: `${fmt(x)} × ${n}`, v: fix(x * n), u: '米', a: '一共用布' }; },
      ])();
      return {
        q: t.q,
        answer: [num(t.v, { unit: t.u })],
        steps: [`找数量关系：${t.rel}`, `列式：${t.ex}`, `计算：${t.ex} = ${fmt(t.v)}（${t.u}）`, `答：${t.a} ${fmt(t.v)} ${t.u}。`],
      };
    },
  },
  {
    id: 'g5a-dmul-tiered', grade: 5, term: 1, unit: U11, name: '分段计费', process: true,
    tip: '分成两段算：基本部分按固定价，超出的部分再按另一个单价算，最后加起来', level: 2,
    gen(r) {
      const nm = r.name();
      const t = r.pick([
        () => { const s = r.pick([8, 10, 13]), p = r.pick([1.6, 1.8, 2, 2.3, 2.4, 2.5]), n = r.int(5, 16); return { q: `某市出租车收费标准：3 千米以内（含 3 千米）收费 ${s} 元，超过 3 千米的部分每千米收费 ${fmt(p)} 元。${nm}乘出租车行驶了 ${n} 千米，应付车费多少元？`, base: `3 千米以内收 ${s} 元`, bv: s, over: n - 3, ou: '千米', p, u: '元', a: '应付车费' }; },
        () => { const a = r.pick([2.5, 3, 3.2, 3.5]), b = fix(a + r.pick([1, 1.5, 2])), n = r.int(12, 25); return { q: `某小区水费标准：每户每月用水 10 吨以内（含 10 吨）每吨 ${fmt(a)} 元，超出的部分每吨 ${fmt(b)} 元。${nm}家这个月用水 ${n} 吨，应交水费多少元？`, base: `前 10 吨：10 × ${fmt(a)} = ${fmt(fix(10 * a))}（元）`, bv: fix(10 * a), over: n - 10, ou: '吨', p: b, u: '元', a: '应交水费' }; },
        () => { const s = r.pick([5, 6, 8]), p = r.pick([2.5, 3, 3.5, 4.5]), n = r.int(3, 8); return { q: `停车场收费标准：停车 1 小时以内（含 1 小时）收费 ${s} 元，超过 1 小时的部分每小时收费 ${fmt(p)} 元。${nm}爸爸停车 ${n} 小时，应付停车费多少元？`, base: `1 小时以内收 ${s} 元`, bv: s, over: n - 1, ou: '小时', p, u: '元', a: '应付停车费' }; },
        () => { const s = r.pick([10, 12, 15]), p = r.pick([2, 2.5, 3.5, 4.5]), n = r.int(3, 9); return { q: `寄快递：首重 1 千克以内（含 1 千克）收费 ${s} 元，超过 1 千克的部分每千克收费 ${fmt(p)} 元。${nm}寄一个 ${n} 千克的包裹，要付多少元？`, base: `1 千克以内收 ${s} 元`, bv: s, over: n - 1, ou: '千克', p, u: '元', a: '要付' }; },
        () => { const B = r.pick([100, 150, 200]), a = r.pick([0.5, 0.6]), b = fix(a + r.pick([0.2, 0.3])), n = B + r.step(20, 120, 10); return { q: `某地电费标准：每户每月用电 ${B} 千瓦时以内（含 ${B} 千瓦时）每千瓦时 ${fmt(a)} 元，超出的部分每千瓦时 ${fmt(b)} 元。${nm}家上个月用电 ${n} 千瓦时，应交电费多少元？`, base: `前 ${B} 千瓦时：${B} × ${fmt(a)} = ${fmt(fix(B * a))}（元）`, bv: fix(B * a), over: n - B, ou: '千瓦时', p: b, u: '元', a: '应交电费' }; },
        () => { const s = r.pick([18, 28, 38]), p = r.pick([0.1, 0.15, 0.2]), n = 100 + r.step(10, 120, 10); return { q: `一种手机套餐每月 ${s} 元，含 100 分钟通话，超出的部分每分钟 ${fmt(p)} 元。${nm}妈妈这个月通话 ${n} 分钟，这个月话费是多少元？`, base: `套餐费 ${s} 元（含 100 分钟）`, bv: s, over: n - 100, ou: '分钟', p, u: '元', a: '这个月话费是' }; },
      ])();
      const ov = fix(t.over * t.p), tot = fix(t.bv + ov);
      return {
        q: t.q,
        answer: [num(tot, { unit: t.u })],
        steps: [
          `找数量关系：总费用 = 基本部分的费用 + 超出部分的费用`,
          `基本部分：${t.base}`,
          `超出部分：先算超出多少，再乘单价：${t.over} × ${fmt(t.p)} = ${fmt(ov)}（元）`,
          `合起来：${fmt(t.bv)} + ${fmt(ov)} = ${fmt(tot)}（元）`,
          `答：${t.a} ${fmt(tot)} 元。`,
        ],
        hint: '先算出超出了多少，只有超出的部分按第二个价钱算',
      };
    },
  },
);

// ---------- 第 2 单元 位置 ----------
const U12 = '位置';
const PT_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'M', 'N', 'P', 'Q'];
function randPoints(r, k, cols, rows) {
  const used = new Set(), pts = [];
  const labs = r.sample(PT_LABELS, k);
  while (pts.length < k) {
    const c = r.int(1, cols), rr = r.int(1, rows), key = c + ',' + rr;
    if (used.has(key)) continue;
    used.add(key); pts.push({ c, r: rr, label: labs[pts.length] });
  }
  return pts;
}

S.push(
  {
    id: 'g5a-pos-read', grade: 5, term: 1, unit: U12, name: '用数对表示位置',
    tip: '数对先写列、再写行：（列，行）。竖排叫列，横排叫行', level: 1,
    gen(r) {
      const cols = r.int(7, 9), rows = r.int(5, 7);
      const pts = randPoints(r, 3, cols, rows);
      const t = r.pick(pts);
      return {
        q: `点 ${t.label} 的位置用数对表示是（{0}，{1}）`,
        fig: gridFig(cols, rows, pts),
        answer: [num(t.c, { label: '列' }), num(t.r, { label: '行' })],
        steps: [`先找列：从点 ${t.label} 竖直往下看，对着第 ${t.c} 列`, `再找行：从点 ${t.label} 水平往左看，对着第 ${t.r} 行`, `数对先写列、再写行：点 ${t.label}（${t.c}，${t.r}）`],
        hint: '数对的第一个数表示第几列，第二个数表示第几行',
      };
    },
  },
  {
    id: 'g5a-pos-find', grade: 5, term: 1, unit: U12, name: '根据数对找点',
    tip: '（3，5）表示第 3 列第 5 行：先往右数列，再往上数行', level: 1,
    gen(r) {
      const cols = 8, rows = 7;
      const c = r.int(1, 7), rr = r.until(() => r.int(1, 7), (v) => v !== c);
      const labs = r.sample(PT_LABELS, 4);
      const pts = [{ c, r: rr, label: labs[0] }, { c: rr, r: c, label: labs[1] }];
      while (pts.length < 4) {
        const p = { c: r.int(1, cols), r: r.int(1, rows) };
        if (!pts.some((o) => o.c === p.c && o.r === p.r)) pts.push({ ...p, label: labs[pts.length] });
      }
      const opts = labs.slice().sort();
      return {
        q: `数对（${c}，${rr}）表示的是哪个点？{0}`,
        fig: gridFig(cols, rows, pts),
        answer: [choice(opts, labs[0])],
        steps: [`（${c}，${rr}）表示第 ${c} 列、第 ${rr} 行`, `从 0 往右数到第 ${c} 列，再往上数到第 ${rr} 行，是点 ${labs[0]}`, `注意：点 ${labs[1]} 在（${rr}，${c}），列和行不能弄反`],
        hint: '第一个数是列，第二个数是行',
      };
    },
  },
  {
    id: 'g5a-pos-seat', grade: 5, term: 1, unit: U12, name: '数对与座位',
    tip: '第几列一般从左往右数，第几行一般从前往后数；数对写成（列，行）', level: 1,
    gen(r) {
      const nm = r.name(), c = r.int(1, 8), rr = r.int(1, 7);
      const k = r.int(0, 3);
      if (k === 0) return {
        q: `${nm}坐在教室的第 ${c} 列第 ${rr} 行，用数对表示是（{0}，{1}）`,
        answer: [num(c, { label: '列' }), num(rr, { label: '行' })],
        steps: ['数对先写列，再写行', `第 ${c} 列第 ${rr} 行 →（${c}，${rr}）`],
      };
      if (k === 1) return {
        q: `${nm}的座位用数对表示是（${c}，${rr}），${nm}坐在第 {0} 列第 {1} 行`,
        answer: [num(c), num(rr)],
        steps: ['数对的第一个数表示列，第二个数表示行', `（${c}，${rr}）→ 第 ${c} 列第 ${rr} 行`],
      };
      if (k === 2) {
        const sameCol = r.bool();
        const r2 = r.until(() => r.int(1, 8), (v) => v !== (sameCol ? rr : c));
        const [p1, p2] = sameCol ? [`（${c}，${rr}）`, `（${c}，${r2}）`] : [`（${c}，${rr}）`, `（${r2}，${rr}）`];
        return {
          q: `数对${p1}和${p2}表示的两个位置在同一{0}`,
          answer: [choice(['行', '列'], sameCol ? '列' : '行')],
          steps: [sameCol ? `两个数对的第一个数都是 ${c}，第一个数表示列` : `两个数对的第二个数都是 ${rr}，第二个数表示行`, `所以它们在同一${sameCol ? '列' : '行'}`],
          hint: '哪个数相同？第一个数表示列，第二个数表示行',
        };
      }
      const back = rr === 1 ? true : rr >= 7 ? false : r.bool();
      const r2 = back ? rr + 1 : rr - 1;
      return {
        q: `${nm}的座位是（${c}，${rr}），坐在${nm}正${back ? '后' : '前'}面的同学的位置是（{0}，{1}）`,
        answer: [num(c, { label: '列' }), num(r2, { label: '行' })],
        steps: [`正${back ? '后' : '前'}面的同学和${nm}在同一列，列数还是 ${c}`, `行从前往后数，${back ? '往后一行，行数加 1' : '往前一行，行数减 1'}：${rr} ${back ? '+' : '−'} 1 = ${r2}`, `所以是（${c}，${r2}）`],
        hint: '前后移动时，变的是列还是行？',
      };
    },
  },
  {
    id: 'g5a-pos-move', grade: 5, term: 1, unit: U12, name: '平移后的数对',
    tip: '左右平移改变列（第一个数），上下平移改变行（第二个数）', level: 2,
    gen(r) {
      let c = r.int(1, 8), rr = r.int(1, 7);
      const c0 = c, r0 = rr;
      const moves = [], steps = [];
      const nMoves = r.int(1, 2);
      const usedAxis = new Set();
      for (let i = 0; i < nMoves; i++) {
        const axis = r.until(() => r.pick(['h', 'v']), (a) => !usedAxis.has(a));
        usedAxis.add(axis);
        if (axis === 'h') {
          const k = r.int(1, 5), right = c - k < 1 ? true : c + k > 12 ? false : r.bool();
          c = right ? c + k : c - k;
          moves.push(`向${right ? '右' : '左'}平移 ${k} 格`);
          steps.push(`向${right ? '右' : '左'}平移 ${k} 格：列数${right ? '加' : '减'} ${k}，行数不变 →（${c}，${rr}）`);
        } else {
          const k = r.int(1, 4), up = rr - k < 1 ? true : r.bool();
          rr = up ? rr + k : rr - k;
          moves.push(`向${up ? '上' : '下'}平移 ${k} 格`);
          steps.push(`向${up ? '上' : '下'}平移 ${k} 格：行数${up ? '加' : '减'} ${k}，列数不变 →（${c}，${rr}）`);
        }
      }
      return {
        q: `点 A 的位置是（${c0}，${r0}），把点 A ${moves.join('，再')}，到达的位置是（{0}，{1}）`,
        answer: [num(c, { label: '列' }), num(rr, { label: '行' })],
        steps: [...steps, `所以到达（${c}，${rr}）`],
        hint: '左右平移改第一个数，上下平移改第二个数',
      };
    },
  },
  {
    id: 'g5a-pos-vertex', grade: 5, term: 1, unit: U12, name: '用数对找第四个顶点',
    tip: '长方形、平行四边形的对边平行且相等：从 A 到 B 怎么走，从 D 到 C 就怎么走', level: 2,
    gen(r) {
      const kind = r.pick(['长方形', '平行四边形', '正方形']);
      let A, B, Cp;
      if (kind === '长方形') {
        const x1 = r.int(1, 3), x2 = r.int(x1 + 2, 8), y1 = r.int(1, 2), y2 = r.int(y1 + 2, 6);
        A = [x1, y1]; B = [x2, y1]; Cp = [x2, y2];
      } else if (kind === '正方形') {
        const s = r.int(2, 4), x1 = r.int(1, 8 - s), y1 = r.int(1, 6 - s);
        A = [x1, y1]; B = [x1 + s, y1]; Cp = [x1 + s, y1 + s];
      } else {
        const x1 = r.int(1, 3), w = r.int(2, 4), sh = r.int(1, 2), y1 = r.int(1, 2), y2 = r.int(y1 + 2, 6);
        A = [x1, y1]; B = [x1 + w, y1]; Cp = [x1 + w + sh, y2];
      }
      const D = [A[0] + Cp[0] - B[0], A[1] + Cp[1] - B[1]];
      const k = B[0] - A[0];
      const pts = [{ c: A[0], r: A[1], label: 'A' }, { c: B[0], r: B[1], label: 'B' }, { c: Cp[0], r: Cp[1], label: 'C' }];
      return {
        q: `${kind} ABCD 的三个顶点是 A（${A[0]}，${A[1]}）、B（${B[0]}，${B[1]}）、C（${Cp[0]}，${Cp[1]}），顶点 D 的位置是（{0}，{1}）`,
        fig: gridFig(9, 7, pts),
        answer: [num(D[0], { label: '列' }), num(D[1], { label: '行' })],
        steps: [
          `${kind}的对边平行且相等：DC 和 AB 一样长、方向一样`,
          `从 A 到 B 是向右 ${k} 格（行不变），所以从 D 到 C 也是向右 ${k} 格`,
          `D 和 C 在同一行，行是 ${Cp[1]}；列比 C 少 ${k}：${Cp[0]} − ${k} = ${D[0]}`,
          `所以 D（${D[0]}，${D[1]}）`,
        ],
        hint: '在方格图里把三个点连起来，想想第四个点在哪',
      };
    },
  },
);

// ---------- 第 3 单元 小数除法 ----------
const U13 = '小数除法';
const noZeroDigits = (x) => !fmt(x).replace('.', '').slice(1).includes('0');
/** 除数是小数时的转化说明：返回 { n2, d2, k, text } */
function shiftDivisor(n, d) {
  const k = decimals(d), n2 = fix(n * P10(k)), d2 = intOf(d);
  const lack = decimals(n) < k;
  const text = `除数 ${fmt(d)} 有 ${k} 位小数，把除数和被除数的小数点都向右移动 ${k} 位${lack ? `（被除数的位数不够，在末尾用 0 补足）` : ''}：${fmt(n)} ÷ ${fmt(d)} 变成 ${fmt(n2)} ÷ ${d2}，商不变`;
  return { n2, d2, k, text };
}
/** 小数展开：n ÷ d（正整数），返回 { int, pre: 不循环部分, cyc: 循环节 } */
function expand(n, d) {
  const int = Math.floor(n / d);
  let rem = n % d, digits = '';
  const seen = new Map();
  while (rem && !seen.has(rem)) { seen.set(rem, digits.length); rem *= 10; digits += Math.floor(rem / d); rem %= d; }
  if (!rem) return { int, pre: digits, cyc: '' };
  const k = seen.get(rem);
  return { int, pre: digits.slice(0, k), cyc: digits.slice(k) };
}
/** 循环小数写开：1.245454…（写够 6 位小数；校验规定小数不超过 6 位连写） */
function longForm(e) {
  let ds = e.pre;
  while (ds.length < 6) ds += e.cyc;
  return `${e.int}.${ds.slice(0, 6)}…`;
}
/** 简便写法：在循环节首尾数字上面点圆点（用组合点 U+0307） */
function dotForm(e) {
  const c = e.cyc, D = '̇';
  const cy = c.length === 1 ? c + D : c[0] + D + c.slice(1, -1) + c.slice(-1) + D;
  return `${e.int}.${e.pre}${cy}`;
}
/** 第 m 位小数上的数字（m 从 1 开始） */
const digitAt = (e, m) => (m <= e.pre.length ? e.pre[m - 1] : e.cyc[(m - e.pre.length - 1) % e.cyc.length]);

S.push(
  {
    id: 'g5a-ddiv-oral', grade: 5, term: 1, unit: U13, name: '小数除法（口算）',
    tip: '除数是整数：先按整数除，商的小数点对齐被除数的小数点；除数是小数：先把除数变成整数', level: 1, speed: 10,
    gen(r) {
      const { n, d, q } = r.until(() => {
        const qs = r.pick([0, 1, 1, 2, -1]), ds = r.pick([0, 0, 1, 2]);
        const q = fix(r.int(1, 9) / P10(qs)), d = fix(r.int(2, 9) / P10(ds));
        return { q, d, n: fix(q * d) };
      }, (o) => decimals(o.n) <= 3 && o.q <= 90 && (decimals(o.d) ? true : decimals(o.n) > 0 && decimals(o.q) > 0));
      return S_ddivOralOut(n, d, q);
    },
  },
);
function S_ddivOralOut(n, d, q) {
  const steps = [];
  if (decimals(d)) {
    const k = decimals(d), n2 = fix(n * P10(k)), d2 = intOf(d);
    steps.push(`除数 ${fmt(d)} 是小数，被除数和除数同时乘 ${P10(k)}：${fmt(n)} ÷ ${fmt(d)} = ${fmt(n2)} ÷ ${d2}`);
    steps.push(`${fmt(n2)} ÷ ${d2} = ${fmt(q)}`);
  } else {
    const ni = intOf(n), qi = ni / d;
    steps.push(`先按整数算：${ni} ÷ ${d} = ${qi}`);
    steps.push(`被除数 ${fmt(n)} 有 ${decimals(n)} 位小数，商的小数点和被除数的小数点对齐：${fmt(q)}`);
  }
  steps.push(`所以 ${fmt(n)} ÷ ${fmt(d)} = ${fmt(q)}`);
  return { q: `${fmt(n)} ÷ ${fmt(d)} = {0}`, answer: [num(q)], steps, hint: decimals(d) ? '先把除数变成整数' : '商的小数点要和被除数的小数点对齐' };
}

S.push(
  {
    id: 'g5a-ddiv-int', grade: 5, term: 1, unit: U13, name: '除数是整数的小数除法',
    tip: '按整数除法去除，商的小数点要和被除数的小数点对齐', level: 1,
    gen(r) {
      const { n, d, q } = r.until(() => {
        const q = rdec(r, 1.1, 39.9, r.pick([1, 1, 2])), d = r.chance(0.6) ? r.int(2, 9) : r.int(11, 28);
        return { q, d, n: fix(q * d) };
      }, (o) => decimals(o.n) === decimals(o.q) && o.n >= o.d && noZeroDigits(o.q) && o.n < 1000);
      const L = longDiv(n, d);
      return {
        q: `${fmt(n)} ÷ ${d} = {0}`,
        answer: [num(q)],
        steps: ['除数是整数，按整数除法的方法去除', '商的小数点要和被除数的小数点对齐', L, `所以 ${fmt(n)} ÷ ${d} = ${fmt(q)}`, `验算：${fmt(q)} × ${d} = ${fmt(n)} ✓`],
        hint: '除到被除数的小数点时，商也点上小数点',
      };
    },
  },
  {
    id: 'g5a-ddiv-int-zero', grade: 5, term: 1, unit: U13, name: '小数除法（商补0、添0）',
    tip: '整数部分不够商 1 写 0；哪一位不够商 1 就商 0；除到末尾有余数，添 0 继续除', level: 2,
    gen(r) {
      const kind = r.pick(['small', 'append', 'mid', 'int']);
      const { n, d, q } = r.until(() => {
        if (kind === 'int') { const d = r.pick([4, 8, 5, 12, 15, 16, 24, 25]); const n = r.int(3, 60); return { n, d, q: fix(n / d) }; }
        const q = kind === 'small' ? rdec(r, 0.05, 0.98, r.int(1, 3)) : kind === 'mid' ? rdec(r, 1.01, 9.09, 2) : rdec(r, 0.3, 9.9, r.int(1, 2));
        const d = r.chance(0.6) ? r.int(2, 9) : r.int(12, 25);
        return { q, d, n: fix(q * d) };
      }, (o) => {
        if (kind === 'int') return decimals(o.q) >= 1 && decimals(o.q) <= 3 && o.n % o.d !== 0;
        if (kind === 'small') return o.n < o.d && decimals(o.n) >= 1 && decimals(o.q) <= 3;
        if (kind === 'mid') return /\d\.0\d/.test(fmt(o.q)) && decimals(o.n) === 2;
        return decimals(o.n) < decimals(o.q) && decimals(o.n) >= 1 && o.n >= o.d;
      });
      const L = longDiv(n, d);
      const why = {
        small: `被除数 ${fmt(n)} 比除数 ${d} 小，整数部分不够商 1，在商的个位上写 0，点上小数点，再继续除`,
        append: `除到被除数的末尾还有余数，就在余数后面添 0 继续除`,
        mid: `除的过程中，哪一位不够商 1，就在那一位上商 0`,
        int: `${n} 除以 ${d} 有余数，在商的个位后面点上小数点，余数后面添 0 继续除`,
      }[kind];
      return {
        q: `${fmt(n)} ÷ ${d} = {0}`,
        answer: [num(q)],
        steps: [why, L, `所以 ${fmt(n)} ÷ ${d} = ${fmt(q)}`, `验算：${fmt(q)} × ${d} = ${fmt(n)} ✓`],
        hint: kind === 'small' ? '不够商 1 时，商的个位写几？' : '有余数时可以添 0 继续除',
      };
    },
  },
  {
    id: 'g5a-ddiv-dec', grade: 5, term: 1, unit: U13, name: '除数是小数的除法',
    tip: '先把除数变成整数：除数的小数点向右移几位，被除数的小数点也向右移几位', level: 1,
    gen(r) {
      const { n, d, q } = r.until(() => {
        const d = r.chance(0.7) ? rdec(r, 0.2, 9.9, 1) : rdec(r, 0.12, 2.99, 2);
        const q = r.chance(0.5) ? r.int(2, 60) : rdec(r, 1.1, 19.9, 1);
        return { d, q, n: fix(d * q) };
      }, (o) => decimals(o.n) >= decimals(o.d) && intOf(o.d) >= 2 && o.n < 500 && noZeroDigits(o.q));
      const sh = shiftDivisor(n, d);
      const L = longDiv(sh.n2, sh.d2);
      return {
        q: `${fmt(n)} ÷ ${fmt(d)} = {0}`,
        answer: [num(q)],
        steps: [sh.text, `再按除数是整数的除法计算`, L, `所以 ${fmt(n)} ÷ ${fmt(d)} = ${fmt(q)}`],
        hint: `除数 ${fmt(d)} 怎样变成整数？被除数也要跟着变`,
      };
    },
  },
  {
    id: 'g5a-ddiv-dec-zero', grade: 5, term: 1, unit: U13, name: '除数是小数（被除数补0）',
    tip: '被除数的小数位数不够移时，在末尾用 0 补足', level: 2,
    gen(r) {
      const { n, d, q } = r.until(() => {
        const d = r.chance(0.6) ? rdec(r, 0.12, 4.8, 2) : rdec(r, 0.2, 9.5, 1);
        const q = r.chance(0.7) ? r.int(2, 80) : rdec(r, 1.5, 30, 1);
        return { d, q, n: fix(d * q) };
      }, (o) => decimals(o.n) < decimals(o.d) && intOf(o.d) >= 2 && o.n < 300);
      const sh = shiftDivisor(n, d);
      const L = longDiv(sh.n2, sh.d2);
      return {
        q: `${fmt(n)} ÷ ${fmt(d)} = {0}`,
        answer: [num(q)],
        steps: [sh.text, L, `所以 ${fmt(n)} ÷ ${fmt(d)} = ${fmt(q)}`, `验算：${fmt(q)} × ${fmt(d)} = ${fmt(n)} ✓`],
        hint: '被除数的小数点向右移动时，位数不够怎么办？',
      };
    },
  },
  {
    id: 'g5a-ddiv-rule', grade: 5, term: 1, unit: U13, name: '商的变化规律',
    tip: '被除数和除数同时乘或除以相同的数（0 除外），商不变', level: 1,
    gen(r) {
      const { N, D, Q } = r.until(() => { const D = r.int(12, 48), Q = r.int(12, 95); return { D, Q, N: D * Q }; }, (o) => o.N % 10 !== 0 && o.D % 10 !== 0 && o.N < 4000);
      const opts = [];
      for (let a = 0; a <= 3; a++) for (let b = 0; b <= 2; b++) if (a + b >= 1 && a - b >= -1 && a - b <= 3) opts.push([a, b]);
      const two = r.sample(opts, 2).map(([a, b]) => ({ n: fix(N / P10(a)), d: fix(D / P10(b)), q: fix(Q / P10(a - b)), a, b }));
      const why = (t) => {
        const n2 = fix(t.n * P10(t.b)), e = t.a - t.b;
        const s1 = t.b ? `两个数同时乘 ${P10(t.b)}，变成 ${fmt(n2)} ÷ ${D}` : `除数还是 ${D}`;
        const s2 = e === 0 ? `被除数也和原来一样，商还是 ${Q}` : e > 0 ? `被除数 ${fmt(n2)} 是 ${N} 除以 ${P10(e)}，商也除以 ${P10(e)}：${Q} ÷ ${P10(e)} = ${fmt(t.q)}` : `被除数 ${fmt(n2)} 是 ${N} 乘 ${P10(-e)}，商也乘 ${P10(-e)}：${Q} × ${P10(-e)} = ${fmt(t.q)}`;
        return `${fmt(t.n)} ÷ ${fmt(t.d)}：${s1}；${s2}`;
      };
      return {
        q: `已知 ${N} ÷ ${D} = ${Q}，直接写出得数。\n${fmt(two[0].n)} ÷ ${fmt(two[0].d)} = {0}\n${fmt(two[1].n)} ÷ ${fmt(two[1].d)} = {1}`,
        answer: [num(two[0].q), num(two[1].q)],
        steps: ['先把除数变回原来的整数（商不变），再看被除数和原来比变了多少，商就跟着变多少', why(two[0]), why(two[1])],
        hint: '被除数和除数同时乘 10、100……，商不变',
      };
    },
  },
  {
    id: 'g5a-ddiv-approx', grade: 5, term: 1, unit: U13, name: '商的近似数',
    tip: '要保留几位小数，就除到下一位，再四舍五入', level: 1,
    gen(r) {
      const p = r.pick([0, 1, 2, 2]);
      const o = r.until(() => {
        const decDiv = r.chance(0.4);
        const d = decDiv ? rdec(r, 0.3, 9.6, 1) : r.int(3, 28);
        const n = rdec(r, 1.1, 99.9, r.int(1, 2));
        const sh = decDiv ? shiftDivisor(n, d) : { n2: n, d2: d, text: '' };
        const L = longDiv(sh.n2, sh.d2, p + 1);
        return { n, d, sh, L, approx: round(L.q, p) };
      }, (o) => !o.L.exact && o.approx > 0 && (p === 0 || decimals(o.approx) === p) && o.L.q < 1000 && (o.L.q >= 1 || p >= 1));
      return {
        q: `${fmt(o.n)} ÷ ${fmt(o.d)} ≈ {0}（得数保留${p ? cn(p) + '位小数' : '整数'}）`,
        answer: [num(o.approx)],
        steps: [
          ...(o.sh.text ? [o.sh.text] : []),
          `保留${p ? cn(p) + '位小数' : '整数'}，要除到第 ${p + 1} 位小数`,
          o.L,
          roundWhy(o.L.q, p),
          `${fmt(o.n)} ÷ ${fmt(o.d)} ≈ ${fmt(o.approx)}`,
        ],
        hint: `除到第 ${p + 1} 位小数就可以停了`,
      };
    },
  },
  {
    id: 'g5a-ddiv-repeat', grade: 5, term: 1, unit: U13, name: '循环小数',
    tip: '从小数部分某一位起，一个或几个数字依次不断重复出现，这几个数字叫循环节', level: 1,
    gen(r) {
      const { n, d, e } = r.until(() => {
        const d = r.pick([3, 6, 9, 11, 12, 15, 18, 22, 33, 30, 45, 55, 36, 66]);
        const n = r.int(1, 99);
        return { n, d, e: expand(n, d) };
      }, (o) => o.e.cyc && o.e.cyc[0] !== '0' && o.e.cyc.length <= 2 && o.e.pre.length <= 2 && o.e.int < 20);
      const p = r.pick([1, 2, 2, 3]);
      const L = longDiv(n, d, Math.max(e.pre.length + 2 * e.cyc.length, p + 1));
      let digs = e.pre; while (digs.length < p + 1) digs += e.cyc;
      const val = Number(`${e.int}.${digs.slice(0, p + 1)}`);
      const approx = round(val, p);
      const ok = decimals(approx) === p;
      const ask = ok ? `保留${cn(p)}位小数约是 {1}` : '';
      return {
        q: `${n} ÷ ${d} 的商是循环小数，它的循环节是 {0}${ask ? '，' + ask : ''}`,
        answer: [num(Number(e.cyc)), ...(ok ? [num(approx)] : [])],
        steps: [
          L,
          `余数重复出现，商的小数部分就不断重复：${n} ÷ ${d} = ${longForm(e)}`,
          `依次重复出现的数字是“${e.cyc}”，循环节是 ${e.cyc}；简便写法是 ${dotForm(e)}（在循环节${e.cyc.length === 1 ? '的数字' : '首位和末位的数字'}上面点圆点）`,
          ...(ok ? [`保留${cn(p)}位小数，看第 ${p + 1} 位小数 ${digs[p]}：${Number(digs[p]) >= 5 ? '满 5 进 1' : '比 5 小，舍去'}，约是 ${fmt(approx)}`] : []),
        ],
        hint: '多除几位，看哪几个数字在重复',
      };
    },
  },
  {
    id: 'g5a-ddiv-repeat-nth', grade: 5, term: 1, unit: U13, name: '循环小数的第几位',
    tip: '先去掉不循环的几位，再用剩下的位数除以循环节的位数，看余数', level: 2,
    gen(r) {
      const e = r.until(() => {
        const L = r.int(2, 6), pl = r.int(0, 2);
        const cyc = Array.from({ length: L }, () => r.int(0, 9)).join('');
        const pre = Array.from({ length: pl }, () => r.int(0, 9)).join('');
        return { int: r.int(0, 5), pre, cyc };
      }, (e) => new Set(e.cyc).size === e.cyc.length && e.cyc[0] !== '0' && (!e.pre || e.pre.slice(-1) !== e.cyc.slice(-1)));
      const m = r.int(e.pre.length + 10, 99);
      const k = e.pre.length, L = e.cyc.length, t = m - k, qq = Math.floor(t / L), rem = t % L;
      const ans = Number(digitAt(e, m));
      return {
        q: `循环小数 ${dotForm(e)}${k + 2 * L <= 6 ? `（${longForm(e)}）` : ''}小数点后面第 ${m} 位上的数字是 {0}`,
        answer: [num(ans)],
        steps: [
          `循环节是 ${e.cyc}，${L} 个数字一循环${k ? `；前面有 ${k} 位（${e.pre}）不循环` : ''}`,
          k ? `去掉不循环的 ${k} 位：${m} − ${k} = ${t}` : `从第 1 位就开始循环`,
          `${t} ÷ ${L} = ${qq}${rem ? ` …… ${rem}` : ''}`,
          rem ? `余 ${rem}，是循环节里的第 ${rem} 个数字：${ans}` : `没有余数，正好是一个完整的循环节，是循环节的最后一个数字：${ans}`,
        ],
        hint: '循环节有几个数字？看看余数',
      };
    },
  },
  {
    id: 'g5a-ddiv-compare', grade: 5, term: 1, unit: U13, name: '商与被除数比大小',
    tip: '一个数（0 除外）除以小于 1 的数，商比它大；除以大于 1 的数，商比它小', level: 1, speed: 8,
    gen(r) {
      const a = r.bool() ? rdec(r, 0.5, 30, r.int(1, 2)) : r.int(2, 60);
      const kind = r.chance(0.1) ? 'eq' : r.pick(['lt1', 'gt1']);
      const b = kind === 'lt1' ? rdec(r, 0.01, 0.99, r.int(1, 2)) : kind === 'gt1' ? rdec(r, 1.01, 9.9, r.int(1, 2)) : 1;
      const ans = kind === 'lt1' ? '>' : kind === 'gt1' ? '<' : '=';
      return {
        q: `${fmt(a)} ÷ ${fmt(b)} {0} ${fmt(a)}`,
        answer: [choice(CMP, ans)],
        steps: [
          `除数是 ${fmt(b)}，它${b < 1 ? '比 1 小' : b > 1 ? '比 1 大' : '等于 1'}`,
          b < 1 ? `除以一个比 1 小的数，商比被除数大` : b > 1 ? `除以一个比 1 大的数，商比被除数小` : '除以 1，商等于被除数',
          `所以 ${fmt(a)} ÷ ${fmt(b)} ${ans} ${fmt(a)}`,
        ],
        hint: '不用算，看除数比 1 大还是比 1 小',
      };
    },
  },
  {
    id: 'g5a-ddiv-mixed', grade: 5, term: 1, unit: U13, name: '小数四则混合运算',
    tip: '先乘除、后加减；有括号先算括号里面的', level: 2,
    gen(r) {
      const k = r.int(0, 4);
      let expr, steps, res;
      if (k === 0) { // a + b × c
        const b = rdec(r, 0.2, 9.9, 1), c = rdec(r, 0.2, 9.9, 1), a = rdec(r, 1, 50, r.int(1, 2)), m = fix(b * c); res = fix(a + m);
        expr = `${fmt(a)} + ${fmt(b)} × ${fmt(c)}`; steps = [`先算乘法：${fmt(b)} × ${fmt(c)} = ${fmt(m)}`, `再算加法：${fmt(a)} + ${fmt(m)} = ${fmt(res)}`];
      } else if (k === 1) { // a − b ÷ c
        const c = r.pick([0.2, 0.4, 0.5, 0.8, 1.2, 1.5, 2.5, 4, 5, 8]), qv = rdec(r, 0.5, 9.5, 1), b = fix(qv * c), a = fix(qv + rdec(r, 1, 30, r.int(1, 2))); res = fix(a - qv);
        expr = `${fmt(a)} − ${fmt(b)} ÷ ${fmt(c)}`; steps = [`先算除法：${fmt(b)} ÷ ${fmt(c)} = ${fmt(qv)}`, `再算减法：${fmt(a)} − ${fmt(qv)} = ${fmt(res)}`];
      } else if (k === 2) { // (a + b) × c
        const a = rdec(r, 1, 20, 1), b = rdec(r, 1, 20, r.int(1, 2)), c = rdec(r, 0.2, 4.5, 1), s = fix(a + b); res = fix(s * c);
        expr = `(${fmt(a)} + ${fmt(b)}) × ${fmt(c)}`; steps = [`先算括号里的加法：${fmt(a)} + ${fmt(b)} = ${fmt(s)}`, `再算乘法：${fmt(s)} × ${fmt(c)} = ${fmt(res)}`];
      } else if (k === 3) { // (a − b) ÷ c
        const c = r.pick([0.3, 0.4, 0.5, 0.6, 0.8, 1.2, 2.5, 3, 4, 6]), qv = rdec(r, 1.1, 20, 1), s = fix(qv * c), b = rdec(r, 1, 20, r.int(1, 2)), a = fix(s + b); res = qv;
        expr = `(${fmt(a)} − ${fmt(b)}) ÷ ${fmt(c)}`; steps = [`先算括号里的减法：${fmt(a)} − ${fmt(b)} = ${fmt(s)}`, `再算除法：${fmt(s)} ÷ ${fmt(c)} = ${fmt(qv)}`];
      } else { // a × b − c ÷ d
        const a = rdec(r, 1.1, 9.9, 1), b = r.int(2, 9), d = r.pick([0.2, 0.4, 0.5, 2, 4, 5]), q2 = rdec(r, 0.1, 2, 1), c = fix(q2 * d), m1 = fix(a * b); res = fix(m1 - q2);
        expr = `${fmt(a)} × ${b} − ${fmt(c)} ÷ ${fmt(d)}`; steps = [`先同时算乘法和除法：${fmt(a)} × ${b} = ${fmt(m1)}，${fmt(c)} ÷ ${fmt(d)} = ${fmt(q2)}`, `再算减法：${fmt(m1)} − ${fmt(q2)} = ${fmt(res)}`];
      }
      return { q: `${expr} = {0}`, answer: [num(res)], steps: ['看运算顺序：先乘除，后加减，有括号先算括号里的', ...steps], hint: '先看清运算顺序再算' };
    },
  },
  {
    id: 'g5a-ddiv-word', grade: 5, term: 1, unit: U13, name: '小数除法解决问题', process: true,
    tip: '求单价、速度、每份是多少或一个数是另一个数的几倍，都用除法', level: 1,
    gen(r) {
      const nm = r.name();
      const t = r.pick([
        () => { const p = rdec(r, 2.5, 12.8, 1), q = rdec(r, 1.5, 4.5, 1), tot = fix(p * q); return decimals(tot) > 2 ? null : { q: `${nm}买了 ${fmt(q)} 千克橘子，一共花了 ${fmt(tot)} 元。每千克橘子多少元？`, rel: '总价 ÷ 数量 = 单价', ex: `${fmt(tot)} ÷ ${fmt(q)}`, v: p, u: '元', a: '每千克橘子' }; },
        () => { const v = r.int(45, 90), t = rdec(r, 1.5, 4.5, 1), s = fix(v * t); return { q: `一辆汽车 ${fmt(t)} 小时行了 ${fmt(s)} 千米，平均每小时行多少千米？`, rel: '路程 ÷ 时间 = 速度', ex: `${fmt(s)} ÷ ${fmt(t)}`, v, u: '千米', a: '平均每小时行' }; },
        () => { const w = rdec(r, 3, 9.5, 1), l = rdec(r, 8, 20, 1), A = fix(w * l); return decimals(A) > 2 ? null : { q: `一块长方形地的面积是 ${fmt(A)} 平方米，长是 ${fmt(l)} 米，宽是多少米？`, rel: '面积 ÷ 长 = 宽', ex: `${fmt(A)} ÷ ${fmt(l)}`, v: w, u: '米', a: '宽是' }; },
        () => { const a = rdec(r, 1.2, 4.8, 1), k = rdec(r, 1.5, 4.5, 1), b = fix(a * k); return decimals(b) > 2 ? null : { q: `一只母鸡重 ${fmt(b)} 千克，一只小鸭重 ${fmt(a)} 千克。母鸡的体重是小鸭的多少倍？`, rel: '求一个数是另一个数的几倍，用除法：母鸡体重 ÷ 小鸭体重', ex: `${fmt(b)} ÷ ${fmt(a)}`, v: k, u: '倍', a: '母鸡的体重是小鸭的' }; },
        () => { const per = rdec(r, 0.15, 0.85, 2), n = r.int(12, 40), tot = fix(per * n); return { q: `${n} 个同样的鸡蛋重 ${fmt(tot)} 千克，平均每个鸡蛋重多少千克？`, rel: '总重量 ÷ 个数 = 每个的重量', ex: `${fmt(tot)} ÷ ${n}`, v: per, u: '千克', a: '平均每个鸡蛋重' }; },
        () => { const per = rdec(r, 1.2, 3.5, 1), n = r.int(6, 25), tot = fix(per * n); return { q: `${nm}妈妈用 ${fmt(tot)} 米布正好做了 ${n} 件同样的衬衫，平均每件用布多少米？`, rel: '一共用布 ÷ 件数 = 每件用布', ex: `${fmt(tot)} ÷ ${n}`, v: per, u: '米', a: '平均每件用布' }; },
      ]);
      const o = r.until(t, (x) => x);
      return {
        q: o.q,
        answer: [num(o.v, { unit: o.u })],
        steps: [`找数量关系：${o.rel}`, `列式：${o.ex}`, `计算：${o.ex} = ${fmt(o.v)}（${o.u}）`, `答：${o.a} ${fmt(o.v)} ${o.u}。`],
      };
    },
  },
  {
    id: 'g5a-ddiv-ceil', grade: 5, term: 1, unit: U13, name: '进一法解决问题', process: true,
    tip: '剩下的部分也要有地方装、要有人运，就要多算 1：进一法', level: 2,
    gen(r) {
      const o = r.until(() => r.pick([
        () => { const c = rdec(r, 2.5, 5.5, 1), T = r.step(20, 80, 5); return { q: `每个油桶最多装 ${fmt(c)} 千克油，要装 ${T} 千克油，至少需要多少个油桶？`, T, c, u: '个', why: '剩下的油也要装进一个油桶' }; },
        () => { const c = rdec(r, 0.4, 0.8, 2), T = r.int(5, 15); return { q: `把 ${T} 千克香油分装在瓶子里，每个瓶子最多装 ${fmt(c)} 千克，至少需要多少个瓶子？`, T, c, u: '个', why: '剩下的香油也要再用一个瓶子装' }; },
        () => { const c = rdec(r, 3.5, 8.5, 1), T = r.step(30, 120, 5); return { q: `一辆货车每次最多运 ${fmt(c)} 吨货物，要把 ${T} 吨货物运完，至少要运多少次？`, T, c, u: '次', why: '剩下的货物还要再运一次' }; },
        () => { const c = rdec(r, 1.5, 2.5, 1), T = r.int(20, 60); return { q: `每个纸箱最多装 ${fmt(c)} 千克苹果，${T} 千克苹果至少需要多少个纸箱？`, T, c, u: '个', why: '剩下的苹果也要装一个纸箱' }; },
        () => { const c = rdec(r, 0.6, 0.9, 2), T = r.int(8, 20); return { q: `一部电梯每次最多载重 ${fmt(c)} 吨，要把 ${T} 吨货物运上楼，至少要运多少次？`, T, c, u: '次', why: '剩下的货物还要再运一次' }; },
        () => { const c = rdec(r, 1.2, 2.8, 1), T = r.int(15, 50); return { q: `一种水桶每个能装水 ${fmt(c)} 升，要把 ${T} 升水全部装下，至少需要多少个这样的水桶？`, T, c, u: '个', why: '剩下的水也要再用一个桶装' }; },
      ])(), (o) => !Number.isInteger(fix(o.T / o.c)) && fix(o.T / o.c) < 100);
      const L = longDiv(...(decimals(o.c) ? [fix(o.T * P10(decimals(o.c))), intOf(o.c)] : [o.T, o.c]), 1);
      const ans = Math.floor(fix(o.T / o.c)) + 1;
      return {
        q: o.q,
        answer: [num(ans, { unit: o.u })],
        steps: [`找数量关系：总量 ÷ 每份的量 = 份数`, `列式：${o.T} ÷ ${fmt(o.c)} ${L.exact ? '=' : '≈'} ${fmt(L.q)}${L.exact ? '' : '…'}（${o.u}）`, `${Math.floor(fix(o.T / o.c))} ${o.u}不够，${o.why}，所以用进一法：${Math.floor(fix(o.T / o.c))} + 1 = ${ans}`, `答：至少需要 ${ans} ${o.u}。`],
        hint: '商不是整数时，剩下的部分怎么办？',
      };
    },
  },
  {
    id: 'g5a-ddiv-floor', grade: 5, term: 1, unit: U13, name: '去尾法解决问题', process: true,
    tip: '剩下的部分不够做成一份，就舍去不算：去尾法', level: 2,
    gen(r) {
      const o = r.until(() => r.pick([
        () => { const c = rdec(r, 2.1, 3.8, 1), T = r.int(20, 60); return { q: `做一套衣服用布 ${fmt(c)} 米，${T} 米布最多能做多少套这样的衣服？`, T, c, u: '套', why: '剩下的布不够做一套' }; },
        () => { const c = rdec(r, 1.1, 1.9, 1), T = r.int(10, 30); return { q: `包装一个礼盒要用 ${fmt(c)} 米丝带，${T} 米丝带最多能包装多少个礼盒？`, T, c, u: '个', why: '剩下的丝带不够包一个' }; },
        () => { const c = rdec(r, 2.5, 8.5, 1), T = r.step(20, 100, 10); return { q: `一本笔记本 ${fmt(c)} 元，${r.name()}有 ${T} 元，最多能买多少本？`, T, c, u: '本', why: '剩下的钱不够再买一本' }; },
        () => { const c = rdec(r, 0.35, 0.75, 2), T = r.int(5, 15); return { q: `每个瓶子装 ${fmt(c)} 千克果汁，${T} 千克果汁最多能装满多少瓶？`, T, c, u: '瓶', why: '剩下的果汁装不满一瓶' }; },
        () => { const c = rdec(r, 0.6, 1.8, 1), T = rdec(r, 8, 20, 1); return { q: `一根绳子长 ${fmt(T)} 米，每 ${fmt(c)} 米剪一段，最多能剪成多少段这样的绳子？`, T, c, u: '段', why: '剩下的一截不够一段' }; },
        () => { const c = rdec(r, 1.2, 2.5, 1), T = r.int(15, 40); return { q: `每个月饼盒装 ${fmt(c)} 千克月饼，${T} 千克月饼最多能装满多少盒？`, T, c, u: '盒', why: '剩下的月饼装不满一盒' }; },
      ])(), (o) => !Number.isInteger(fix(o.T / o.c)) && fix(o.T / o.c) < 100 && fix(o.T / o.c) >= 2);
      const L = longDiv(fix(o.T * P10(decimals(o.c))), intOf(o.c), 1);
      const ans = Math.floor(fix(o.T / o.c));
      return {
        q: o.q,
        answer: [num(ans, { unit: o.u })],
        steps: [`找数量关系：总量 ÷ 每份的量 = 份数`, `列式：${fmt(o.T)} ÷ ${fmt(o.c)} ${L.exact ? '=' : '≈'} ${fmt(L.q)}${L.exact ? '' : '…'}（${o.u}）`, `${o.why}，要舍去，所以用去尾法：取 ${ans}`, `答：最多 ${ans} ${o.u}。`],
        hint: '剩下的部分够不够再做一份？',
      };
    },
  },
);

// ---------- 第 4 单元 可能性 ----------
const U14 = '可能性';
const COLORS = ['红', '黄', '蓝', '绿', '白', '黑'];
S.push(
  {
    id: 'g5a-prob-sure', grade: 5, term: 1, unit: U14, name: '一定、可能、不可能',
    tip: '只有这种就“一定”，有这种也有别的就“可能”，根本没有就“不可能”', level: 1,
    gen(r) {
      const obj = r.pick([{ o: '球', box: '盒子' }, { o: '卡片', box: '袋子' }, { o: '棋子', box: '盒子' }, { o: '粉笔', box: '粉笔盒' }]);
      const kinds = r.int(1, 3);
      const cols = r.sample(COLORS, 4);
      const has = cols.slice(0, kinds).map((c) => ({ c, n: r.int(1, 9) }));
      const desc = has.map((h) => `${h.n} ${obj.o === '球' || obj.o === '棋子' ? '个' : obj.o === '卡片' ? '张' : '支'}${h.c}${obj.o}`).join('、');
      const pick = r.chance(0.3) ? cols[3] : r.pick(has).c;
      const inBox = has.some((h) => h.c === pick);
      const ans = !inBox ? '不可能' : kinds === 1 ? '一定' : '可能';
      return {
        q: `${obj.box}里有 ${desc}。任意摸出 1 ${obj.o === '球' || obj.o === '棋子' ? '个' : obj.o === '卡片' ? '张' : '支'}，{0}是${pick}${obj.o}。`,
        answer: [choice(['一定', '可能', '不可能'], ans)],
        steps: [
          `${obj.box}里${kinds === 1 ? `只有${has[0].c}${obj.o}` : `有${has.map((h) => h.c).join('、')} ${kinds} 种颜色的${obj.o}`}`,
          !inBox ? `${obj.box}里没有${pick}${obj.o}，所以不可能摸到` : kinds === 1 ? `全是${pick}${obj.o}，摸出来的一定是${pick}${obj.o}` : `有${pick}${obj.o}，也有别的颜色，所以可能摸到${pick}${obj.o}，也可能摸到别的`,
        ],
        hint: `${obj.box}里有没有${pick}${obj.o}？还有没有别的颜色？`,
      };
    },
  },
  {
    id: 'g5a-prob-more', grade: 5, term: 1, unit: U14, name: '可能性的大小',
    tip: '哪种颜色的数量多，摸到它的可能性就大；数量少，可能性就小', level: 1,
    gen(r) {
      const k = r.int(2, 4);
      const cols = r.sample(COLORS, k);
      const ns = r.until(() => cols.map(() => r.int(1, 12)), (a) => new Set(a).size === a.length);
      const most = r.bool();
      const target = most ? Math.max(...ns) : Math.min(...ns);
      const ans = cols[ns.indexOf(target)];
      const spin = r.chance(0.35);
      const total = ns.reduce((a, b) => a + b, 0);
      const desc = cols.map((c, i) => `${ns[i]} ${spin ? '份' : '个'}${spin ? '涂' + c + '色' : c + '球'}`).join('、');
      return {
        q: spin
          ? `一个转盘被平均分成 ${total} 份，其中 ${desc}。转动转盘，指针停在{0}色区域的可能性${most ? '最大' : '最小'}。`
          : `盒子里有 ${desc}，这些球除颜色外都相同。任意摸出一个球，摸到{0}球的可能性${most ? '最大' : '最小'}。`,
        answer: [choice(cols.slice().sort((a, b) => COLORS.indexOf(a) - COLORS.indexOf(b)), ans)],
        steps: [`比较数量：${cols.map((c, i) => `${c} ${ns[i]}`).join('，')}`, `${ans}色的${most ? '最多' : '最少'}，所以${spin ? '停在' : '摸到'}${ans}色的可能性${most ? '最大' : '最小'}`],
        hint: `哪种颜色${most ? '最多' : '最少'}？`,
      };
    },
  },
  {
    id: 'g5a-prob-adjust', grade: 5, term: 1, unit: U14, name: '让可能性变大（至少放几个）',
    tip: '要让摸到红球的可能性比黄球大，红球个数就要比黄球多', level: 2,
    gen(r) {
      const [c1, c2] = r.sample(COLORS.slice(0, 4), 2);
      const a = r.int(2, 8), b = r.int(a + 1, 14);
      const v = r.int(0, 2);
      if (v === 0) {
        const need = b - a + 1;
        return {
          q: `盒子里有 ${a} 个${c1}球和 ${b} 个${c2}球。至少再放入多少个${c1}球，摸到${c1}球的可能性才比摸到${c2}球的大？`,
          answer: [num(need, { unit: '个' })],
          steps: [`要让摸到${c1}球的可能性大，${c1}球要比${c2}球多`, `${c1}球至少要有 ${b} + 1 = ${b + 1} 个`, `还要再放：${b + 1} − ${a} = ${need}（个）`],
          hint: `${c1}球要比${c2}球多才行，至少要有几个？`,
        };
      }
      if (v === 1) {
        const need = b - a;
        return {
          q: `盒子里有 ${a} 个${c1}球和 ${b} 个${c2}球。再放入多少个${c1}球，摸到${c1}球和${c2}球的可能性相等？`,
          answer: [num(need, { unit: '个' })],
          steps: [`可能性相等，两种球的个数就要同样多`, `${c1}球要有 ${b} 个，再放 ${b} − ${a} = ${need}（个）`],
          hint: '可能性相等，个数要怎样？',
        };
      }
      const need = b - a + 1;
      return {
        q: `盒子里有 ${a} 个${c1}球和 ${b} 个${c2}球。至少拿走多少个${c2}球，摸到${c1}球的可能性才比摸到${c2}球的大？`,
        answer: [num(need, { unit: '个' })],
        steps: [`要让摸到${c1}球的可能性大，${c2}球要比${c1}球少`, `${c2}球最多只能留 ${a} − 1 = ${a - 1} 个`, `至少拿走：${b} − ${a - 1} = ${need}（个）`],
        hint: `${c2}球最多能留几个？`,
      };
    },
  },
  {
    id: 'g5a-prob-fair', grade: 5, term: 1, unit: U14, name: '游戏规则公平吗',
    tip: '双方赢的可能性相等，游戏才公平：比一比双方各占几种情况', level: 2,
    gen(r) {
      const [p1, p2] = r.names(2);
      const t = r.pick([
        () => { const cut = r.int(2, 5); const a = 6 - cut, b = cut; return { q: `${p1}和${p2}掷骰子（1~6 点），点数大于 ${cut}，${p1}赢；否则${p2}赢。这个游戏规则公平吗？`, a, b, da: `大于 ${cut} 的点数有 ${a} 种`, db: `不大于 ${cut} 的点数有 ${b} 种` }; },
        () => { const odd = r.bool(); return { q: `${p1}和${p2}掷骰子（1~6 点），掷出${odd ? '单数' : '双数'}${p1}赢，掷出${odd ? '双数' : '单数'}${p2}赢。这个游戏规则公平吗？`, a: 3, b: 3, da: '单数 1、3、5 有 3 种', db: '双数 2、4、6 有 3 种' }; },
        () => { const N = r.pick([8, 9, 10, 11, 12]); const odd = Math.ceil(N / 2), even = Math.floor(N / 2); const o1 = r.bool(); return { q: `把 1~${N} 的数字卡片打乱，任意抽一张，抽到单数${o1 ? p1 : p2}赢，抽到双数${o1 ? p2 : p1}赢。这个游戏规则公平吗？`, a: o1 ? odd : even, b: o1 ? even : odd, da: `${p1}赢的卡片有 ${o1 ? odd : even} 张`, db: `${p2}赢的卡片有 ${o1 ? even : odd} 张` }; },
        () => { const a = r.int(2, 8), b = r.chance(0.4) ? a : r.int(2, 8); const [c1, c2] = r.sample(COLORS.slice(0, 4), 2); return { q: `盒子里有 ${a} 个${c1}球和 ${b} 个${c2}球，任意摸一个，摸到${c1}球${p1}赢，摸到${c2}球${p2}赢。这个游戏规则公平吗？`, a, b, da: `${c1}球 ${a} 个`, db: `${c2}球 ${b} 个` }; },
        () => { const n = r.pick([4, 6, 8]); const a = r.chance(0.4) ? n / 2 : r.int(1, n - 1); return { q: `一个转盘被平均分成 ${n} 份，其中 ${a} 份是红色，其余是蓝色。转到红色${p1}赢，转到蓝色${p2}赢。这个游戏规则公平吗？`, a, b: n - a, da: `红色 ${a} 份`, db: `蓝色 ${n - a} 份` }; },
      ])();
      const fair = t.a === t.b;
      return {
        q: t.q,
        answer: [choice(['公平', '不公平'], fair ? '公平' : '不公平')],
        steps: [`${t.da}，${t.db}`, fair ? '两人赢的可能性相等，所以公平' : `${t.a > t.b ? p1 : p2}赢的可能性大，所以不公平`],
        hint: '数一数两个人各有几种赢的情况',
      };
    },
  },
);

// ---------- 第 5 单元 简易方程 ----------
const U15 = '简易方程';
const cx = (k) => (k === 1 ? 'x' : `${fmt(k)}x`); // 系数和 x
const check = (lhsExpr, lhsVal, rhs) => `检验：把 x 代入，左边 = ${lhsExpr} = ${fmt(lhsVal)}，右边 = ${fmt(rhs)}，左边 = 右边 ✓`;

S.push(
  {
    id: 'g5a-eq-letter', grade: 5, term: 1, unit: U15, name: '用字母表示数量',
    tip: '把字母当成一个数来列式；数和字母相乘，乘号可以省略，数写在字母前面', level: 1,
    gen(r) {
      const nm = r.name();
      const t = r.pick([
        () => { const n = r.int(3, 9), m = r.step(20, 100, 10); return { q: `每支钢笔 a 元，${nm}买了 ${n} 支，付了 ${m} 元，应找回多少元？`, ok: `${m} − ${n}a`, bad: [`${n}a − ${m}`, `${m} − ${n} + a`, `${m} − a`], why: `买 ${n} 支用了 ${n}a 元，找回的钱 = 付的钱 − 用的钱` }; },
        () => { const k = r.int(24, 35); return { q: `${nm}今年 a 岁，爸爸比${nm}大 ${k} 岁。爸爸今年多少岁？`, ok: `a + ${k}`, bad: [`a − ${k}`, `${k}a`, `${k} − a`], why: `比${nm}大 ${k} 岁，就是在 a 上加 ${k}` }; },
        () => { const sq = r.bool(); return sq ? { q: '正方形的边长是 a 厘米，它的周长是多少厘米？', ok: '4a', bad: ['a²', 'a + 4', '2a'], why: '正方形周长 = 边长 × 4，a × 4 写成 4a' } : { q: '正方形的边长是 a 厘米，它的面积是多少平方厘米？', ok: 'a²', bad: ['2a', '4a', 'a + a'], why: '正方形面积 = 边长 × 边长，a × a 写成 a²（读作 a 的平方）' }; },
        () => ({ q: '一辆汽车每小时行 v 千米，t 小时行多少千米？', ok: 'vt', bad: ['v + t', 'v ÷ t', 't ÷ v'], why: '路程 = 速度 × 时间，v × t 写成 vt' }),
        () => { const k = r.int(10, 30), m = r.int(5, 20); return { q: `书架上有 x 本书，借出 ${k} 本后，又放回 ${m} 本。现在书架上有多少本书？`, ok: `x − ${k} + ${m}`, bad: [`x + ${k} − ${m}`, `x − ${k} − ${m}`, `x + ${k} + ${m}`], why: `借出要减 ${k}，放回要加 ${m}` }; },
        () => { const k = r.int(2, 5), m = r.int(3, 15); return { q: `苹果有 x 千克，梨的重量比苹果的 ${k} 倍还多 ${m} 千克。梨有多少千克？`, ok: `${k}x + ${m}`, bad: [`${k}x − ${m}`, `${k}(x + ${m})`, `x + ${k} + ${m}`], why: `苹果的 ${k} 倍是 ${k}x，再多 ${m} 就加 ${m}` }; },
        () => ({ q: '长方形的长是 a 米，宽是 b 米，它的周长是多少米？', ok: '2(a + b)', bad: ['ab', '2a + b', 'a + b'], why: '长方形周长 = (长 + 宽) × 2，写成 2(a + b)' }),
        () => { const n = r.int(3, 6); return { q: `${nm}${n} 次数学测验的总分是 x 分，平均每次多少分？`, ok: `x ÷ ${n}`, bad: [`${n}x`, `${n} ÷ x`, `x − ${n}`], why: `平均分 = 总分 ÷ 次数` }; },
      ])();
      return {
        q: t.q + '{0}',
        answer: [choice(r.shuffle([t.ok, ...t.bad]), t.ok)],
        steps: [t.why, `所以是 ${t.ok}`],
        hint: '先用文字说出数量关系，再把字母放进去',
      };
    },
  },
  {
    id: 'g5a-eq-eval', grade: 5, term: 1, unit: U15, name: '含字母式子求值',
    tip: '把字母换成给的数，再按运算顺序算；4x 表示 4 × x，x² 表示 x × x', level: 1,
    gen(r) {
      const x = r.chance(0.5) ? r.int(2, 12) : rdec(r, 0.5, 9.5, 1);
      const k = r.int(0, 4);
      let ex, sub, steps, v;
      if (k === 0) { const a = r.int(2, 9), b = r.int(1, 30); v = fix(a * x + b); ex = `${a}x + ${b}`; sub = `${a} × ${fmt(x)} + ${b}`; steps = [`${fmt(fix(a * x))} + ${b} = ${fmt(v)}`]; }
      else if (k === 1) { const a = r.int(3, 9), b = r.int(1, Math.max(1, Math.floor(a * x) - 1)); v = fix(a * x - b); ex = `${a}x − ${b}`; sub = `${a} × ${fmt(x)} − ${b}`; steps = [`${fmt(fix(a * x))} − ${b} = ${fmt(v)}`]; }
      else if (k === 2) { const a = r.int(2, 6), b = r.int(1, 9); v = fix(a * (x + b)); ex = `${a}(x + ${b})`; sub = `${a} × (${fmt(x)} + ${b})`; steps = [`${a} × ${fmt(fix(x + b))} = ${fmt(v)}`]; }
      else if (k === 3) { const xi = r.int(2, 12), b = r.int(1, 20); v = xi * xi + b; return { q: `当 x = ${xi} 时，x² + ${b} 的值是 {0}`, answer: [num(v)], steps: [`x² 表示 x × x，不是 x × 2`, `把 x = ${xi} 代入：${xi} × ${xi} + ${b}`, `= ${xi * xi} + ${b} = ${v}`], hint: 'x² 表示两个 x 相乘' }; }
      else { const a = r.int(2, 9); const xi = r.int(2, 9); v = xi * xi - a * xi > 0 ? xi * xi - a * xi : a * xi + xi * xi; const plus = !(xi * xi - a * xi > 0); return { q: `当 x = ${xi} 时，x² ${plus ? '+' : '−'} ${a}x 的值是 {0}`, answer: [num(v)], steps: [`把 x = ${xi} 代入：${xi} × ${xi} ${plus ? '+' : '−'} ${a} × ${xi}`, `= ${xi * xi} ${plus ? '+' : '−'} ${a * xi} = ${v}`], hint: '先算乘法，再算加减' }; }
      return {
        q: `当 x = ${fmt(x)} 时，${ex} 的值是 {0}`,
        answer: [num(v)],
        steps: [`把 x = ${fmt(x)} 代入，${ex.includes('(') ? '' : '省略的乘号要写回来：'}${sub}`, `= ${steps[0]}`],
        hint: k === 2 ? '先算括号里的' : '数和 x 之间省略了乘号',
      };
    },
  },
  {
    id: 'g5a-eq-simplify', grade: 5, term: 1, unit: U15, name: '化简含有字母的式子',
    tip: '3x + 5x 就是 3 个 x 加 5 个 x，等于 8x；x 就是 1x', level: 1, speed: 12,
    gen(r) {
      const k = r.int(0, 6);
      if (k === 6) {
        const t = r.pick([
          { q: 'a × a 可以写成{0}', o: ['a²', '2a'], v: 'a²', w: 'a × a 表示两个 a 相乘，写成 a²；2a 表示 a + a' },
          { q: 'a + a 可以写成{0}', o: ['a²', '2a'], v: '2a', w: 'a + a 是 2 个 a，写成 2a；a² 表示 a × a' },
          { q: 'x × 4 可以写成{0}', o: ['4x', 'x4', 'x + 4'], v: '4x', w: '数和字母相乘，省略乘号，数写在字母前面：4x' },
          { q: 'b × b × 3 可以写成{0}', o: ['3b²', '6b', 'b³'], v: '3b²', w: 'b × b 写成 b²，再乘 3，数写在前面：3b²' },
          { q: '当 a = 2 时，a² 和 2a 的值{0}', o: ['相等', '不相等'], v: '相等', w: '2 × 2 = 4，2 × 2 = 4，正好相等（只有 a = 2 或 0 时才相等）' },
          { q: '当 a = 3 时，a² 和 2a 的值{0}', o: ['相等', '不相等'], v: '不相等', w: 'a² = 3 × 3 = 9，2a = 2 × 3 = 6，不相等' },
        ]);
        return { q: t.q, answer: [choice(t.o, t.v)], steps: [t.w], hint: 'a² 是 a × a，2a 是 a × 2' };
      }
      let q, v, why;
      if (k === 0) { const a = r.int(2, 15), b = r.int(2, 15); v = a + b; q = `${a}x + ${b}x`; why = `${a} 个 x 加 ${b} 个 x 是 ${v} 个 x：(${a} + ${b})x = ${v}x`; }
      else if (k === 1) { const a = r.int(6, 20), b = r.int(2, a - 2); v = a - b; q = `${a}x − ${b}x`; why = `${a} 个 x 减 ${b} 个 x 是 ${v} 个 x：(${a} − ${b})x = ${v}x`; }
      else if (k === 2) { const a = r.int(3, 12), b = r.int(2, 9), c = r.int(1, a + b - 1); v = a + b - c; q = `${a}x + ${b}x − ${c}x`; why = `(${a} + ${b} − ${c})x = ${v}x`; }
      else if (k === 3) { const a = r.int(2, 15); v = a + 1; q = r.bool() ? `x + ${a}x` : `${a}x + x`; why = `x 就是 1x：(1 + ${a})x = ${v}x，注意不是 ${a}x`; }
      else if (k === 4) { const a = r.int(3, 15); v = a - 1; q = `${a}x − x`; why = `x 就是 1x：(${a} − 1)x = ${v}x`; }
      else { const a = r.int(2, 9), b = r.int(2, 9); v = a * b; q = `${a} × x × ${b}`; why = `${a} × ${b} = ${v}，所以 ${a} × x × ${b} = ${v}x`; }
      return { q: `${q} = {0}x`, answer: [num(v)], steps: [why], hint: '把 x 前面的数加减' };
    },
  },
  {
    id: 'g5a-eq-is', grade: 5, term: 1, unit: U15, name: '认识方程', pool: 200,
    tip: '方程要同时满足两点：是等式（有等号），含有未知数', level: 1, speed: 8,
    gen(r) {
      const a = r.int(2, 9), b = r.int(2, 40), c = r.int(10, 90);
      const t = r.pick([
        { s: `${a}x + ${b} = ${c}`, ok: true, w: '有等号，也含有未知数 x' },
        { s: `x − ${b} = ${c}`, ok: true, w: '有等号，也含有未知数 x' },
        { s: `${a}x = ${c}`, ok: true, w: '有等号，也含有未知数 x' },
        { s: 'x = 0', ok: true, w: '有等号，也含有未知数 x，最简单的方程也是方程' },
        { s: `${a}x + ${b}`, ok: false, w: '没有等号，不是等式，只是一个含字母的式子' },
        { s: `${a}x > ${c}`, ok: false, w: '是不等式，不是等式' },
        { s: `x − ${b} < ${c}`, ok: false, w: '是不等式，不是等式' },
        { s: `${b} + ${c} = ${b + c}`, ok: false, w: '是等式，但没有未知数' },
        { s: `${a} × ${b} = ${a * b}`, ok: false, w: '是等式，但没有未知数' },
      ]);
      return {
        q: `${t.s}　这个式子是方程吗？{0}`,
        answer: [choice(['是', '不是'], t.ok ? '是' : '不是')],
        steps: ['方程要满足两点：①是等式；②含有未知数', `${t.s}：${t.w}，所以${t.ok ? '是' : '不是'}方程`],
        hint: '有没有等号？有没有未知数？',
      };
    },
  },
  {
    id: 'g5a-eq-1step', grade: 5, term: 1, unit: U15, name: '解方程（一步）',
    tip: '等式两边同时加、减、乘或除以同一个数（0 除外），等式仍然成立', level: 1,
    gen(r) {
      const x = r.chance(0.5) ? r.int(2, 60) : rdec(r, 0.5, 30, 1);
      const k = r.int(0, 4);
      let eq, steps, chk;
      if (k === 0) { const a = rdec(r, 1, 40, r.int(0, 1)), b = fix(x + a); eq = `x + ${fmt(a)} = ${fmt(b)}`; steps = [`两边同时减 ${fmt(a)}：x + ${fmt(a)} − ${fmt(a)} = ${fmt(b)} − ${fmt(a)}`, `x = ${fmt(x)}`]; chk = check(`${fmt(x)} + ${fmt(a)}`, b, b); }
      else if (k === 1) { const a = rdec(r, 1, 40, r.int(0, 1)), X = fix(x + a), b = x; eq = `x − ${fmt(a)} = ${fmt(b)}`; return { q: `解方程：${eq}　x = {0}`, answer: [num(X)], steps: [`两边同时加 ${fmt(a)}：x − ${fmt(a)} + ${fmt(a)} = ${fmt(b)} + ${fmt(a)}`, `x = ${fmt(X)}`, check(`${fmt(X)} − ${fmt(a)}`, b, b)], hint: '让 x 单独留在等号一边，两边要做同样的运算' }; }
      else if (k === 99) { const a = 0, b = 0; eq = `x − ${fmt(a)} = ${fmt(b)}`; steps = [`两边同时加 ${fmt(a)}：x − ${fmt(a)} + ${fmt(a)} = ${fmt(b)} + ${fmt(a)}`, `x = ${fmt(x)}`]; chk = check(`${fmt(x)} − ${fmt(a)}`, b, b); }
      else if (k === 2) { const a = r.int(2, 12), b = fix(a * x); eq = `${a}x = ${fmt(b)}`; steps = [`${a}x 表示 ${a} × x，两边同时除以 ${a}：${a}x ÷ ${a} = ${fmt(b)} ÷ ${a}`, `x = ${fmt(x)}`]; chk = check(`${a} × ${fmt(x)}`, b, b); }
      else if (k === 3) { const a = r.int(2, 9), b = x; const X = fix(a * b); eq = `x ÷ ${a} = ${fmt(b)}`; steps = [`两边同时乘 ${a}：x ÷ ${a} × ${a} = ${fmt(b)} × ${a}`, `x = ${fmt(X)}`]; return { q: `解方程：${eq}　x = {0}`, answer: [num(X)], steps: [...steps, check(`${fmt(X)} ÷ ${a}`, b, b)], hint: '要去掉“÷ ' + a + '”，两边同时做什么？' }; }
      else { const a = rdec(r, 1, 40, r.int(0, 1)), b = fix(x + a); eq = `${fmt(a)} + x = ${fmt(b)}`; steps = [`两边同时减 ${fmt(a)}：${fmt(a)} + x − ${fmt(a)} = ${fmt(b)} − ${fmt(a)}`, `x = ${fmt(x)}`]; chk = check(`${fmt(a)} + ${fmt(x)}`, b, b); }
      return { q: `解方程：${eq}　x = {0}`, answer: [num(x)], steps: [...steps, chk], hint: '让 x 单独留在等号一边，两边要做同样的运算' };
    },
  },
  {
    id: 'g5a-eq-2step', grade: 5, term: 1, unit: U15, name: '解方程 ax ± b = c',
    tip: '先把 ax 看成一个整体，两边同时减（加）b；再两边同时除以 a', level: 1,
    gen(r) {
      const x = r.chance(0.6) ? r.int(2, 30) : rdec(r, 0.5, 12, 1);
      const a = r.int(2, 9), b = r.chance(0.6) ? r.int(1, 40) : rdec(r, 0.5, 20, 1);
      const ax = fix(a * x);
      const k = ax > b ? r.int(0, 2) : r.pick([0, 2]);
      const c = k === 1 ? fix(ax - b) : fix(ax + b);
      const eq = k === 0 ? `${a}x + ${fmt(b)} = ${fmt(c)}` : k === 1 ? `${a}x − ${fmt(b)} = ${fmt(c)}` : `${fmt(b)} + ${a}x = ${fmt(c)}`;
      const s1 = k === 1 ? `把 ${a}x 看成一个整体，两边同时加 ${fmt(b)}：${a}x = ${fmt(c)} + ${fmt(b)}` : `把 ${a}x 看成一个整体，两边同时减 ${fmt(b)}：${a}x = ${fmt(c)} − ${fmt(b)}`;
      return {
        q: `解方程：${eq}　x = {0}`,
        answer: [num(x)],
        steps: [s1, `${a}x = ${fmt(ax)}`, `两边同时除以 ${a}：x = ${fmt(ax)} ÷ ${a}`, `x = ${fmt(x)}`, check(k === 1 ? `${a} × ${fmt(x)} − ${fmt(b)}` : k === 0 ? `${a} × ${fmt(x)} + ${fmt(b)}` : `${fmt(b)} + ${a} × ${fmt(x)}`, c, c)],
        hint: `先求出 ${a}x 是多少`,
      };
    },
  },
  {
    id: 'g5a-eq-paren', grade: 5, term: 1, unit: U15, name: '解方程 a(x ± b) = c',
    tip: '把括号里的看成一个整体：两边先同时除以 a，再求 x', level: 2,
    gen(r) {
      const a = r.int(2, 9), x = r.chance(0.6) ? r.int(2, 40) : rdec(r, 1.5, 20, 1);
      const minus = r.bool();
      const b = minus ? r.until(() => (r.chance(0.6) ? r.int(1, 30) : rdec(r, 0.5, 15, 1)), (v) => v < x) : r.chance(0.6) ? r.int(1, 30) : rdec(r, 0.5, 15, 1);
      const inner = minus ? fix(x - b) : fix(x + b), c = fix(a * inner);
      const div = r.chance(0.25);
      if (div) {
        const c2 = fix(inner / a);
        if (decimals(c2) > 2) return { q: `解方程：${a}(x ${minus ? '−' : '+'} ${fmt(b)}) = ${fmt(c)}　x = {0}`, answer: [num(x)], steps: [`把 (x ${minus ? '−' : '+'} ${fmt(b)}) 看成一个整体，两边同时除以 ${a}：x ${minus ? '−' : '+'} ${fmt(b)} = ${fmt(inner)}`, `两边同时${minus ? '加' : '减'} ${fmt(b)}：x = ${fmt(x)}`, check(`${a} × (${fmt(x)} ${minus ? '−' : '+'} ${fmt(b)})`, c, c)], hint: '先求出括号里的结果' };
        const eq = `(x ${minus ? '−' : '+'} ${fmt(b)}) ÷ ${a} = ${fmt(c2)}`;
        return {
          q: `解方程：${eq}　x = {0}`, answer: [num(x)],
          steps: [`把 (x ${minus ? '−' : '+'} ${fmt(b)}) 看成一个整体，两边同时乘 ${a}：x ${minus ? '−' : '+'} ${fmt(b)} = ${fmt(c2)} × ${a}`, `x ${minus ? '−' : '+'} ${fmt(b)} = ${fmt(inner)}`, `两边同时${minus ? '加' : '减'} ${fmt(b)}：x = ${fmt(inner)} ${minus ? '+' : '−'} ${fmt(b)}`, `x = ${fmt(x)}`],
          hint: '先求出括号里的结果',
        };
      }
      const eq = `${a}(x ${minus ? '−' : '+'} ${fmt(b)}) = ${fmt(c)}`;
      return {
        q: `解方程：${eq}　x = {0}`, answer: [num(x)],
        steps: [`把 (x ${minus ? '−' : '+'} ${fmt(b)}) 看成一个整体，两边同时除以 ${a}：x ${minus ? '−' : '+'} ${fmt(b)} = ${fmt(c)} ÷ ${a}`, `x ${minus ? '−' : '+'} ${fmt(b)} = ${fmt(inner)}`, `两边同时${minus ? '加' : '减'} ${fmt(b)}：x = ${fmt(inner)} ${minus ? '+' : '−'} ${fmt(b)}`, `x = ${fmt(x)}`, check(`${a} × (${fmt(x)} ${minus ? '−' : '+'} ${fmt(b)})`, c, c)],
        hint: '先求出括号里的结果',
      };
    },
  },
  {
    id: 'g5a-eq-xsub', grade: 5, term: 1, unit: U15, name: '解方程（x 是减数或除数）',
    tip: 'x 在减号或除号后面时，两边先同时加 x（或乘 x），把 x 移到另一边', level: 2,
    gen(r) {
      const k = r.int(0, 2);
      if (k === 0) {
        const x = r.chance(0.6) ? r.int(2, 50) : rdec(r, 0.5, 30, 1), b = r.chance(0.6) ? r.int(1, 50) : rdec(r, 0.5, 30, 1), a = fix(x + b);
        return {
          q: `解方程：${fmt(a)} − x = ${fmt(b)}　x = {0}`, answer: [num(x)],
          steps: [`两边同时加 x：${fmt(a)} = ${fmt(b)} + x`, `两边同时减 ${fmt(b)}：x = ${fmt(a)} − ${fmt(b)}`, `x = ${fmt(x)}`, check(`${fmt(a)} − ${fmt(x)}`, b, b)],
          hint: '想一想：被减数 − 减数 = 差，减数 = 被减数 − 差',
        };
      }
      if (k === 1) {
        const x = r.chance(0.6) ? r.int(2, 20) : rdec(r, 0.2, 9.5, 1), b = r.int(2, 25), a = fix(x * b);
        return {
          q: `解方程：${fmt(a)} ÷ x = ${b}　x = {0}`, answer: [num(x)],
          steps: [`两边同时乘 x：${fmt(a)} = ${b}x`, `两边同时除以 ${b}：x = ${fmt(a)} ÷ ${b}`, `x = ${fmt(x)}`, check(`${fmt(a)} ÷ ${fmt(x)}`, b, b)],
          hint: '想一想：除数 = 被除数 ÷ 商',
        };
      }
      const x = r.int(2, 15), a = r.int(2, 9), c = r.int(1, 40), s = fix(a * x + c);
      return {
        q: `解方程：${s} − ${a}x = ${c}　x = {0}`, answer: [num(x)],
        steps: [`两边同时加 ${a}x：${s} = ${c} + ${a}x`, `两边同时减 ${c}：${a}x = ${s} − ${c} = ${s - c}`, `两边同时除以 ${a}：x = ${s - c} ÷ ${a} = ${x}`, check(`${s} − ${a} × ${x}`, c, c)],
        hint: `先把 ${a}x 移到等号右边`,
      };
    },
  },
  {
    id: 'g5a-eq-combine', grade: 5, term: 1, unit: U15, name: '解方程（ax ± bx = c）',
    tip: '先把含 x 的项合并：3x + 5x = 8x，再两边同时除以 8', level: 2,
    gen(r) {
      const x = r.chance(0.6) ? r.int(2, 40) : rdec(r, 0.5, 12, 1);
      const minus = r.bool();
      const a = minus ? r.int(3, 12) : r.int(1, 9), b = minus ? r.int(1, a - 2) : r.int(1, 9);
      const co = minus ? a - b : a + b, c = fix(co * x);
      const L = minus ? `${cx(a)} − ${cx(b)}` : `${cx(a)} + ${cx(b)}`;
      return {
        q: `解方程：${L} = ${fmt(c)}　x = {0}`, answer: [num(x)],
        steps: [`先合并：${L} = ${minus ? `(${a} − ${b})x` : `(${a} + ${b})x`} = ${cx(co)}${a === 1 || b === 1 ? '（x 就是 1x）' : ''}`, `${cx(co)} = ${fmt(c)}`, co === 1 ? `x = ${fmt(x)}` : `两边同时除以 ${co}：x = ${fmt(c)} ÷ ${co} = ${fmt(x)}`, check(minus ? `${a} × ${fmt(x)} − ${b} × ${fmt(x)}` : `${a} × ${fmt(x)} + ${b} × ${fmt(x)}`, c, c)],
        hint: '先把左边含 x 的合并成一项',
      };
    },
  },
);

// 列方程解决问题：统一的讲解格式
function eqSteps({ rel, set, eq, solve, ans, say }) {
  return [`找等量关系：${rel}`, `设${set}`, `列方程：${eq}`, ...solve, `答：${say}。`];
}

S.push(
  {
    id: 'g5a-eqw-one', grade: 5, term: 1, unit: U15, name: '列方程解决问题（一步）', process: true,
    tip: '先找等量关系，设未知数为 x，按关系列方程', level: 1,
    gen(r) {
      const nm = r.name();
      const t = r.pick([
        () => { const x = r.int(20, 80), a = r.int(10, 40); return { q: `${nm}家原来有一些书，又买了 ${a} 本，现在有 ${x + a} 本。原来有多少本？`, x, u: '本', rel: '原来的本数 + 又买的本数 = 现在的本数', set: '原来有 x 本', eq: `x + ${a} = ${x + a}`, solve: [`x = ${x + a} − ${a}`, `x = ${x}`], say: `原来有 ${x} 本` }; },
        () => { const x = rdec(r, 20, 60, 1), a = rdec(r, 5, 18, 1), b = fix(x - a); return { q: `一桶油用去 ${fmt(a)} 千克后，还剩 ${fmt(b)} 千克。这桶油原来有多少千克？`, x, u: '千克', rel: '原有的 − 用去的 = 剩下的', set: '这桶油原来有 x 千克', eq: `x − ${fmt(a)} = ${fmt(b)}`, solve: [`x = ${fmt(b)} + ${fmt(a)}`, `x = ${fmt(x)}`], say: `原来有 ${fmt(x)} 千克` }; },
        () => { const x = rdec(r, 2.5, 9.5, 1), a = r.int(3, 12), b = fix(a * x); return { q: `${nm}买了 ${a} 本同样的笔记本，一共花了 ${fmt(b)} 元。每本笔记本多少元？`, x, u: '元', rel: '单价 × 数量 = 总价', set: '每本笔记本 x 元', eq: `${a}x = ${fmt(b)}`, solve: [`x = ${fmt(b)} ÷ ${a}`, `x = ${fmt(x)}`], say: `每本笔记本 ${fmt(x)} 元` }; },
        () => { const a = r.int(3, 9), b = rdec(r, 0.5, 4.5, 1), x = fix(a * b); return { q: `一根绳子平均剪成 ${a} 段，每段长 ${fmt(b)} 米。这根绳子原来长多少米？`, x, u: '米', rel: '绳子全长 ÷ 段数 = 每段长', set: '这根绳子原来长 x 米', eq: `x ÷ ${a} = ${fmt(b)}`, solve: [`x = ${fmt(b)} × ${a}`, `x = ${fmt(x)}`], say: `原来长 ${fmt(x)} 米` }; },
        () => { const l = r.int(8, 25), x = rdec(r, 3, 7.5, 1), S2 = fix(l * x); return { q: `一个长方形花坛的面积是 ${fmt(S2)} 平方米，长是 ${l} 米。宽是多少米？`, x, u: '米', rel: '长 × 宽 = 长方形面积', set: '宽是 x 米', eq: `${l}x = ${fmt(S2)}`, solve: [`x = ${fmt(S2)} ÷ ${l}`, `x = ${fmt(x)}`], say: `宽是 ${fmt(x)} 米` }; },
        () => { const x = rdec(r, 1.2, 8.5, 1), a = rdec(r, 0.5, 6.5, 1), b = fix(x + a); return { q: `一支钢笔比一支铅笔贵 ${fmt(a)} 元，钢笔的价钱是 ${fmt(b)} 元。铅笔多少元？`, x, u: '元', rel: '铅笔的价钱 + 贵的钱数 = 钢笔的价钱', set: '铅笔 x 元', eq: `x + ${fmt(a)} = ${fmt(b)}`, solve: [`x = ${fmt(b)} − ${fmt(a)}`, `x = ${fmt(x)}`], say: `铅笔 ${fmt(x)} 元` }; },
      ])();
      return { q: t.q, answer: [num(t.x, { unit: t.u })], steps: eqSteps(t) };
    },
  },
  {
    id: 'g5a-eqw-two', grade: 5, term: 1, unit: U15, name: '列方程解决问题（两步）', process: true,
    tip: '“比 x 的几倍多（少）几”：先写 x 的几倍，再加（减）几', level: 2,
    gen(r) {
      const nm = r.name();
      const t = r.pick([
        () => { const x = r.int(8, 14), a = r.int(3, 4), b = r.int(1, 6), c = a * x + b; return { q: `${nm}爸爸今年 ${c} 岁，比${nm}年龄的 ${a} 倍还多 ${b} 岁。${nm}今年多少岁？`, x, u: '岁', rel: `${nm}的年龄 × ${a} + ${b} = 爸爸的年龄`, set: `${nm}今年 x 岁`, eq: `${a}x + ${b} = ${c}`, solve: [`${a}x = ${c} − ${b} = ${c - b}`, `x = ${c - b} ÷ ${a} = ${x}`], say: `${nm}今年 ${x} 岁` }; },
        () => { const x = r.int(80, 300), a = r.int(2, 4), b = r.int(10, 60), c = a * x - b; return { q: `学校图书室有故事书 ${c} 本，比科技书的 ${a} 倍少 ${b} 本。科技书有多少本？`, x, u: '本', rel: `科技书的本数 × ${a} − ${b} = 故事书的本数`, set: '科技书有 x 本', eq: `${a}x − ${b} = ${c}`, solve: [`${a}x = ${c} + ${b} = ${c + b}`, `x = ${c + b} ÷ ${a} = ${x}`], say: `科技书有 ${x} 本` }; },
        () => { const x = rdec(r, 3.5, 12.5, 1), a = r.int(3, 6), b = rdec(r, 8, 25, 1), c = fix(a * x + b); return { q: `${nm}买了 ${a} 支同样的钢笔和一个 ${fmt(b)} 元的文具盒，一共付了 ${fmt(c)} 元。每支钢笔多少元？`, x, u: '元', rel: `钢笔的单价 × ${a} + 文具盒的价钱 = 一共付的钱`, set: '每支钢笔 x 元', eq: `${a}x + ${fmt(b)} = ${fmt(c)}`, solve: [`${a}x = ${fmt(c)} − ${fmt(b)} = ${fmt(fix(a * x))}`, `x = ${fmt(fix(a * x))} ÷ ${a} = ${fmt(x)}`], say: `每支钢笔 ${fmt(x)} 元` }; },
        () => { const x = rdec(r, 6.5, 18.5, 1), a = r.int(2, 5), b = rdec(r, 3, 20, 1), c = fix(a * x + b); return { q: `${nm}带了 ${fmt(c)} 元，买了 ${a} 本同样的故事书后还剩 ${fmt(b)} 元。每本故事书多少元？`, x, u: '元', rel: `带的钱 − 书的单价 × ${a} = 剩下的钱`, set: '每本故事书 x 元', eq: `${fmt(c)} − ${a}x = ${fmt(b)}`, solve: [`${a}x = ${fmt(c)} − ${fmt(b)} = ${fmt(fix(a * x))}`, `x = ${fmt(fix(a * x))} ÷ ${a} = ${fmt(x)}`], say: `每本故事书 ${fmt(x)} 元` }; },
        () => { const l = r.int(12, 30), x = r.int(5, l - 2), c = 2 * (l + x); return { q: `一块长方形菜地的周长是 ${c} 米，长是 ${l} 米。宽是多少米？`, x, u: '米', rel: '长 × 2 + 宽 × 2 = 周长', set: '宽是 x 米', eq: `2x + ${l} × 2 = ${c}`, solve: [`2x + ${2 * l} = ${c}`, `2x = ${c - 2 * l}`, `x = ${x}`], say: `宽是 ${x} 米` }; },
        () => { const x = r.int(25, 60), a = r.int(2, 3), b = r.int(3, 15), c = a * x - b; return { q: `一头大象重 ${c} 百千克，比一头河马体重的 ${a} 倍少 ${b} 百千克。这头河马重多少百千克？`, x, u: '百千克', rel: `河马的体重 × ${a} − ${b} = 大象的体重`, set: '河马重 x 百千克', eq: `${a}x − ${b} = ${c}`, solve: [`${a}x = ${c} + ${b} = ${c + b}`, `x = ${c + b} ÷ ${a} = ${x}`], say: `河马重 ${x} 百千克` }; },
      ])();
      return { q: t.q, answer: [num(t.x, { unit: t.u })], steps: eqSteps(t), hint: '先找出题目里的等量关系，把要求的量设为 x' };
    },
  },
  {
    id: 'g5a-eqw-sum-times', grade: 5, term: 1, unit: U15, name: '列方程解和倍问题', process: true,
    tip: '设小的数（1 倍数）为 x，大的就是几x，它们的和 = 总数', level: 2,
    gen(r) {
      const k = r.int(2, 6), x = r.int(8, 80), s = (k + 1) * x;
      const nm = r.name();
      const t = r.pick([
        { q: `果园里苹果树和梨树一共有 ${s} 棵，苹果树的棵数是梨树的 ${k} 倍。苹果树和梨树各有多少棵？`, A: '苹果树', B: '梨树', u: '棵' },
        { q: `五年级两个班一共植树 ${s} 棵，一班植树的棵数是二班的 ${k} 倍。一班和二班各植树多少棵？`, A: '一班', B: '二班', u: '棵' },
        { q: `${nm}和妈妈的年龄加起来是 ${s} 岁，妈妈的年龄是${nm}的 ${k} 倍。妈妈和${nm}各多少岁？`, A: '妈妈', B: nm, u: '岁', ok: x >= 6 && x <= 12 && k >= 3 && k <= 5 },
        { q: `养殖场有鸡和鸭共 ${s} 只，鸡的只数是鸭的 ${k} 倍。鸡和鸭各有多少只？`, A: '鸡', B: '鸭', u: '只' },
        { q: `甲、乙两个仓库共存粮 ${s} 吨，甲仓库存粮是乙仓库的 ${k} 倍。甲、乙两个仓库各存粮多少吨？`, A: '甲仓库', B: '乙仓库', u: '吨' },
        { q: `一根绳子长 ${s} 米，剪成两段，长的一段是短的一段的 ${k} 倍。长的一段和短的一段各长多少米？`, A: '长的一段', B: '短的一段', u: '米' },
      ].filter((o) => o.ok !== false));
      return {
        q: t.q,
        fig: fig.bars([{ label: t.A, units: k }, { label: t.B, units: 1, text: `共 ${s}${t.u}` }], { unitW: 40 }),
        answer: [num(k * x, { label: t.A, unit: t.u }), num(x, { label: t.B, unit: t.u })],
        steps: eqSteps({
          rel: `${t.B} + ${t.A} = ${s}，${t.A}是${t.B}的 ${k} 倍`,
          set: `${t.B}是 x ${t.u}，${t.A}就是 ${k}x ${t.u}`,
          eq: `x + ${k}x = ${s}`,
          solve: [`${k + 1}x = ${s}`, `x = ${s} ÷ ${k + 1} = ${x}`, `${t.A}：${k} × ${x} = ${k * x}（${t.u}）`],
          say: `${t.A} ${k * x} ${t.u}，${t.B} ${x} ${t.u}`,
        }),
        hint: '设 1 倍的那个量为 x',
      };
    },
  },
  {
    id: 'g5a-eqw-diff-times', grade: 5, term: 1, unit: U15, name: '列方程解差倍问题', process: true,
    tip: '设小的数（1 倍数）为 x，大的就是几x，它们的差 = 相差的数', level: 2,
    gen(r) {
      const k = r.int(2, 7), x = r.int(6, 60), d = (k - 1) * x;
      const nm = r.name();
      const t = r.pick([
        { q: `一个果园里苹果树的棵数是梨树的 ${k} 倍，苹果树比梨树多 ${d} 棵。苹果树和梨树各有多少棵？`, A: '苹果树', B: '梨树', u: '棵' },
        { q: `${nm}的邮票张数是弟弟的 ${k} 倍，比弟弟多 ${d} 张。${nm}和弟弟各有多少张邮票？`, A: nm, B: '弟弟', u: '张' },
        { q: `爸爸的年龄是儿子的 ${k} 倍，爸爸比儿子大 ${d} 岁。爸爸和儿子各多少岁？`, A: '爸爸', B: '儿子', u: '岁', ok: x >= 5 && x <= 15 && d >= 20 && d <= 35 },
        { q: `一筐苹果的重量是一筐梨的 ${k} 倍，苹果比梨重 ${d} 千克。苹果和梨各重多少千克？`, A: '苹果', B: '梨', u: '千克' },
        { q: `学校合唱队的人数是舞蹈队的 ${k} 倍，合唱队比舞蹈队多 ${d} 人。合唱队和舞蹈队各有多少人？`, A: '合唱队', B: '舞蹈队', u: '人' },
      ].filter((o) => o.ok !== false));
      return {
        q: t.q,
        fig: fig.bars([{ label: t.A, units: k }, { label: t.B, units: 1, text: `多 ${d}${t.u}` }], { unitW: 40 }),
        answer: [num(k * x, { label: t.A, unit: t.u }), num(x, { label: t.B, unit: t.u })],
        steps: eqSteps({
          rel: `${t.A} − ${t.B} = ${d}，${t.A}是${t.B}的 ${k} 倍`,
          set: `${t.B}是 x ${t.u}，${t.A}就是 ${k}x ${t.u}`,
          eq: `${k}x − x = ${d}`,
          solve: [...(k === 2 ? [`x = ${d}`] : [`${k - 1}x = ${d}`, `x = ${d} ÷ ${k - 1} = ${x}`]), `${t.A}：${k} × ${x} = ${k * x}（${t.u}）`],
          say: `${t.A} ${k * x} ${t.u}，${t.B} ${x} ${t.u}`,
        }),
        hint: '大的比小的多了几倍？',
      };
    },
  },
  {
    id: 'g5a-eqw-meet', grade: 5, term: 1, unit: U15, name: '列方程解相遇问题', process: true,
    tip: '相向而行：甲走的路程 + 乙走的路程 = 总路程，也就是 速度和 × 相遇时间 = 总路程', level: 2,
    gen(r) {
      const [p1, p2] = r.names(2);
      const c = r.pick([
        () => ({ A: p1, B: p2, v1: r.int(55, 75), v2: r.int(50, 80), x: r.int(4, 12), uS: '米', per: '每分钟', verb: '走', uT: '分钟', total: '两家的距离', end: '相遇', head: (S0) => `${p1}和${p2}两家相距 ${S0} 米，两人同时从家出发相向而行` }),
        () => ({ A: '客车', B: '货车', v1: r.int(60, 90), v2: r.int(50, 85), x: r.int(2, 5), uS: '千米', per: '每小时', verb: '行', uT: '小时', total: '两地的距离', end: '相遇', head: (S0) => `甲、乙两地相距 ${S0} 千米，一辆客车和一辆货车同时从两地出发相向而行` }),
        () => ({ A: '甲队', B: '乙队', v1: r.int(40, 80), v2: r.int(35, 75), x: r.int(3, 8), uS: '米', per: '每天', verb: '修', uT: '天', total: '公路全长', end: '修完', head: (S0) => `一条公路长 ${S0} 米，甲、乙两个工程队同时从两端开始相对而修` }),
        () => ({ A: p1, B: p2, v1: r.int(200, 300), v2: r.int(150, 260), x: r.int(2, 4), uS: '米', per: '每分钟', verb: '骑', uT: '分钟', total: '跑道一圈的长', end: '第一次相遇', head: (S0) => `${p1}和${p2}在一条长 ${S0} 米的环形跑道上骑车，两人从同一地点同时出发，反向而行` }),
      ])();
      const S0 = (c.v1 + c.v2) * c.x;
      if (r.bool()) {
        return {
          q: `${c.head(S0)}，${c.A}${c.per}${c.verb} ${c.v1} ${c.uS}，${c.B}${c.per}${c.verb} ${c.v2} ${c.uS}。经过多少${c.uT}${c.end}？`,
          answer: [num(c.x, { unit: c.uT })],
          steps: eqSteps({
            rel: `${c.A}${c.verb}的 + ${c.B}${c.verb}的 = ${c.total}`,
            set: `经过 x ${c.uT}${c.end}`,
            eq: `${c.v1}x + ${c.v2}x = ${S0}`,
            solve: [`${c.v1 + c.v2}x = ${S0}`, `x = ${S0} ÷ ${c.v1 + c.v2} = ${c.x}`],
            say: `经过 ${c.x} ${c.uT}${c.end}`,
          }),
          hint: `${c.per}两${c.A.endsWith('车') ? '车' : c.A.endsWith('队') ? '队' : '人'}合起来${c.verb}多少${c.uS}？`,
        };
      }
      return {
        q: `${c.head(S0)}，经过 ${c.x} ${c.uT}${c.end}。${c.A}${c.per}${c.verb} ${c.v1} ${c.uS}，${c.B}${c.per}${c.verb}多少${c.uS}？`,
        answer: [num(c.v2, { unit: c.uS })],
        steps: eqSteps({
          rel: `(${c.A}的速度 + ${c.B}的速度) × ${c.end === '修完' ? '修的天数' : '相遇时间'} = ${c.total}`,
          set: `${c.B}${c.per}${c.verb} x ${c.uS}`,
          eq: `(${c.v1} + x) × ${c.x} = ${S0}`,
          solve: [`${c.v1} + x = ${S0} ÷ ${c.x} = ${c.v1 + c.v2}`, `x = ${c.v1 + c.v2} − ${c.v1} = ${c.v2}`],
          say: `${c.B}${c.per}${c.verb} ${c.v2} ${c.uS}`,
        }),
        hint: '先求两个速度的和',
      };
    },
  },
  {
    id: 'g5a-eqw-chicken', grade: 5, term: 1, unit: U15, name: '列方程解鸡兔同笼', process: true,
    tip: '设其中一种为 x，另一种就是（总数 − x），按“脚（轮子、钱）的总数”列方程', level: 3,
    gen(r) {
      const t = r.pick([
        { A: '兔', B: '鸡', a: 4, b: 2, u: '只', thing: '腿数', total: '腿的总数', ctx: (H, L) => `笼子里有若干只鸡和兔，从上面数有 ${H} 个头，从下面数有 ${L} 条腿。鸡和兔各有多少只？` },
        { A: '乌龟', B: '仙鹤', a: 4, b: 2, u: '只', thing: '腿数', total: '腿的总数', ctx: (H, L) => `乌龟和仙鹤一共 ${H} 只，共有 ${L} 条腿。乌龟和仙鹤各有多少只？` },
        { A: '三轮车', B: '自行车', a: 3, b: 2, u: '辆', thing: '轮子数', total: '轮子总数', ctx: (H, L) => `车棚里有自行车和三轮车共 ${H} 辆，一共有 ${L} 个轮子。三轮车和自行车各有多少辆？` },
        { A: '大船', B: '小船', a: 6, b: 4, u: '条', thing: '坐的人数', total: '总人数', ctx: (H, L) => `${L} 名同学去划船，一共租了 ${H} 条船，正好坐满。每条大船坐 6 人，每条小船坐 4 人。大船和小船各租了多少条？` },
        { A: '三分球', B: '两分球', a: 3, b: 2, u: '个', thing: '得分', total: '总得分', ctx: (H, L) => `一场篮球赛中，${r.name()}一共投进 ${H} 个球（没有罚球），得了 ${L} 分。三分球和两分球各投进多少个？` },
        { A: '成人票', B: '儿童票', a: r.pick([30, 40, 50]), b: r.pick([15, 20, 25]), u: '张', thing: '钱数', total: '总钱数', ctx: null },
      ]);
      const H = r.int(t.A === '成人票' ? 8 : 10, 40), x = r.int(1, H - 1), y = H - x;
      const L = t.a * x + t.b * y;
      const q = t.ctx ? t.ctx(H, L) : `一个旅游团买了 ${H} 张门票，成人票每张 ${t.a} 元，儿童票每张 ${t.b} 元，一共花了 ${L} 元。成人票和儿童票各买了多少张？`;
      const d = t.a - t.b;
      return {
        q,
        answer: [num(x, { label: t.A, unit: t.u }), num(y, { label: t.B, unit: t.u })],
        steps: eqSteps({
          rel: `${t.A}的${t.thing} + ${t.B}的${t.thing} = ${t.total}`,
          set: `${t.A}有 x ${t.u}，${t.B}就有 (${H} − x) ${t.u}`,
          eq: `${t.a}x + ${t.b}(${H} − x) = ${L}`,
          solve: [`${t.a}x + ${t.b * H} − ${t.b}x = ${L}`, ...(d === 1 ? [`x = ${L} − ${t.b * H} = ${x}`] : [`${d}x = ${L} − ${t.b * H} = ${L - t.b * H}`, `x = ${L - t.b * H} ÷ ${d} = ${x}`]), `${t.B}：${H} − ${x} = ${y}（${t.u}）`],
          say: `${t.A} ${x} ${t.u}，${t.B} ${y} ${t.u}`,
        }),
        hint: `设${t.A}有 x ${t.u}，${t.B}有几${t.u}？`,
      };
    },
  },
  {
    id: 'g5a-eqw-chase', grade: 5, term: 1, unit: U15, name: '列方程解追及问题', process: true,
    tip: '同向追：速度差 × 追及时间 = 开始时相差的路程', level: 3,
    gen(r) {
      const [p1, p2] = r.names(2);
      const k = r.int(0, 3);
      if (k === 0) {
        const { v1, v2, t0 } = r.until(() => { const v2 = r.int(50, 70); return { v2, v1: v2 + r.pick([10, 15, 20, 25, 30, 40, 50]), t0: r.int(3, 10) }; }, (o) => (o.v2 * o.t0) % (o.v1 - o.v2) === 0 && (o.v2 * o.t0) / (o.v1 - o.v2) <= 30);
        const gap = v2 * t0, x = gap / (v1 - v2);
        return {
          q: `${p2}从家去学校，每分钟走 ${v2} 米。${p2}出发 ${t0} 分钟后，哥哥骑车从家出发去追，每分钟骑 ${v1} 米。哥哥出发后多少分钟能追上${p2}？`,
          answer: [num(x, { unit: '分钟' })],
          steps: eqSteps({ rel: `哥哥追上时，两人走的路程相等：哥哥走的路程 = ${p2}先走的路程 + ${p2}后来走的路程`, set: `哥哥出发后 x 分钟追上`, eq: `${v1}x = ${v2} × ${t0} + ${v2}x`, solve: [`${v1}x − ${v2}x = ${gap}`, `${v1 - v2}x = ${gap}`, `x = ${gap} ÷ ${v1 - v2} = ${x}`], say: `哥哥出发后 ${x} 分钟追上${p2}` }),
          hint: `${p2}先走了多少米？哥哥每分钟能追近多少米？`,
        };
      }
      if (k === 1) {
        const v2 = r.int(40, 60), dv = r.pick([15, 20, 25, 30]), v1 = v2 + dv, x = r.int(2, 6), d = dv * x;
        return {
          q: `一辆货车在前，一辆客车在后，两车相距 ${d} 千米，同时同向出发。客车每小时行 ${v1} 千米，货车每小时行 ${v2} 千米。客车几小时能追上货车？`,
          answer: [num(x, { unit: '小时' })],
          steps: eqSteps({ rel: '客车行的路程 − 货车行的路程 = 原来相距的路程', set: '客车 x 小时追上货车', eq: `${v1}x − ${v2}x = ${d}`, solve: [`${dv}x = ${d}`, `x = ${d} ÷ ${dv} = ${x}`], say: `客车 ${x} 小时能追上货车` }),
          hint: '每小时客车比货车多行多少千米？',
        };
      }
      if (k === 2) {
        const C = r.pick([300, 400, 400, 600]), dv = r.pick([20, 25, 50, 60, 100].filter((d) => C % d === 0)), v2 = r.int(150, 250);
        const v1 = v2 + dv, x = C / dv;
        return {
          q: `${p1}和${p2}在 ${C} 米长的环形跑道上，从同一地点同时同向出发骑车。${p1}每分钟骑 ${v1} 米，${p2}每分钟骑 ${v2} 米。经过多少分钟${p1}第一次追上${p2}？`,
          answer: [num(x, { unit: '分钟' })],
          steps: eqSteps({ rel: `第一次追上时，${p1}正好比${p2}多骑一圈：${p1}骑的 − ${p2}骑的 = ${C}`, set: `经过 x 分钟第一次追上`, eq: `${v1}x − ${v2}x = ${C}`, solve: [`${dv}x = ${C}`, `x = ${C} ÷ ${dv} = ${x}`], say: `经过 ${x} 分钟${p1}第一次追上${p2}` }),
          hint: '在环形跑道上同向出发，快的追上慢的时，快的多跑了多少？',
        };
      }
      const { dv, x, v2, t0 } = r.until(() => { const dv = r.pick([10, 15, 20, 30]), x = r.int(2, 6), v2 = r.step(40, 80, 5); return { dv, x, v2, t0: (dv * x) / v2 }; }, (o) => Number.isInteger(o.t0) && o.t0 >= 1);
      const v1 = v2 + dv;
      return {
        q: `一辆货车从甲地开出 ${t0} 小时后，一辆客车也从甲地出发，沿同一条路追货车，客车 ${x} 小时追上货车。货车每小时行 ${v2} 千米，客车每小时行多少千米？`,
        answer: [num(v1, { unit: '千米' })],
        steps: eqSteps({ rel: '追上时两车行的路程相等：客车行的路程 = 货车行的路程', set: '客车每小时行 x 千米', eq: `${x}x = ${v2} × (${t0} + ${x})`, solve: [`${x}x = ${v2 * (t0 + x)}`, `x = ${v2 * (t0 + x)} ÷ ${x} = ${v1}`], say: `客车每小时行 ${v1} 千米` }),
        hint: '追上时货车一共行了几小时？',
      };
    },
  },
  {
    id: 'g5a-eqw-travel', grade: 5, term: 1, unit: U15, name: '行程问题综合', process: true,
    tip: '画线段图，分清谁先走、走了多久；相遇时两人走的路程合起来是全程', level: 3,
    gen(r) {
      const [p1, p2] = r.names(2);
      const k = r.int(0, 3);
      if (k === 0) {
        const v2 = r.int(50, 70), dv = r.pick([5, 10, 15, 20]), v1 = v2 + dv, x = r.int(2, 6), D = dv * x, S0 = (v1 + v2) * x;
        return {
          q: `甲、乙两辆汽车同时从两地出发相向而行，甲车每小时行 ${v1} 千米，乙车每小时行 ${v2} 千米，相遇时甲车比乙车多行了 ${D} 千米。两地相距多少千米？`,
          answer: [num(S0, { unit: '千米' })],
          steps: eqSteps({ rel: '相遇时甲车行的 − 乙车行的 = 多行的路程', set: '经过 x 小时相遇', eq: `${v1}x − ${v2}x = ${D}`, solve: [`${dv}x = ${D}，x = ${x}`, `两地相距：(${v1} + ${v2}) × ${x} = ${S0}（千米）`], say: `两地相距 ${S0} 千米` }),
          hint: '先求相遇用了几小时：每小时甲车比乙车多行几千米？',
        };
      }
      if (k === 1) {
        const v1 = r.int(55, 80), v2 = r.int(45, 75), x = r.int(2, 5), rem = r.step(20, 100, 10), S0 = (v1 + v2) * x + rem;
        return {
          q: `甲、乙两地相距 ${S0} 千米，一辆客车和一辆货车同时从两地出发相向而行，${x} 小时后两车还相距 ${rem} 千米。客车每小时行 ${v1} 千米，货车每小时行多少千米？`,
          answer: [num(v2, { unit: '千米' })],
          steps: eqSteps({ rel: `客车行的 + 货车行的 + 还相距的 = 全程`, set: '货车每小时行 x 千米', eq: `${v1} × ${x} + ${x}x + ${rem} = ${S0}`, solve: [`${v1 * x} + ${x}x + ${rem} = ${S0}`, `${x}x = ${S0} − ${v1 * x} − ${rem} = ${v2 * x}`, `x = ${v2 * x} ÷ ${x} = ${v2}`], say: `货车每小时行 ${v2} 千米` }),
          hint: '画线段图：全程分成哪三段？',
        };
      }
      if (k === 2) {
        const v1 = r.int(50, 70), v2 = r.int(55, 80), t0 = r.int(1, 2), x = r.int(2, 5), S0 = v1 * t0 + (v1 + v2) * x;
        return {
          q: `A、B 两城相距 ${S0} 千米。一辆汽车从 A 城开往 B 城，每小时行 ${v1} 千米；${t0} 小时后，另一辆汽车从 B 城开往 A 城，每小时行 ${v2} 千米。第二辆车出发后几小时两车相遇？`,
          answer: [num(x, { unit: '小时' })],
          steps: eqSteps({ rel: `第一辆车先行的路程 + 两车同时行的路程 = 全程`, set: `第二辆车出发后 x 小时相遇`, eq: `${v1} × ${t0} + (${v1} + ${v2})x = ${S0}`, solve: [`${v1 * t0} + ${v1 + v2}x = ${S0}`, `${v1 + v2}x = ${S0 - v1 * t0}`, `x = ${S0 - v1 * t0} ÷ ${v1 + v2} = ${x}`], say: `第二辆车出发后 ${x} 小时两车相遇` }),
          hint: '第一辆车先走的那段路要先去掉',
        };
      }
      const { v1, v2, x, back } = r.until(() => { const x = r.int(2, 5), back = r.int(1, 3), v1 = r.step(40, 100, x); return { x, back, v1, v2: (v1 * back) / x }; }, (o) => o.v2 >= 30 && o.v2 <= 90 && Number.isInteger(o.v2) && o.back < o.x);
      const total = v1 * (x + back);
      return {
        q: `甲、乙两车同时从 A、B 两地相向开出，${x} 小时后相遇。相遇后甲车继续向前开，又开了 ${back} 小时到达 B 地。甲车每小时行 ${v1} 千米，乙车每小时行多少千米？`,
        answer: [num(v2, { unit: '千米' })],
        steps: eqSteps({
          rel: `甲车开完全程用了 ${x} + ${back} = ${x + back}（小时）；全程 = 两车速度和 × 相遇时间`,
          set: '乙车每小时行 x 千米',
          eq: `(${v1} + x) × ${x} = ${v1} × ${x + back}`,
          solve: [`全程：${v1} × ${x + back} = ${total}（千米）`, `${v1} + x = ${total} ÷ ${x} = ${total / x}`, `x = ${total / x} − ${v1} = ${v2}`],
          say: `乙车每小时行 ${v2} 千米`,
        }),
        hint: '甲车走完全程一共用了几小时？',
      };
    },
  },
);

// ---------- 第 6 单元 多边形的面积 ----------
const U16 = '多边形的面积';
const AREA_U = { cm: '平方厘米', dm: '平方分米', m: '平方米' };
const LEN_U = { cm: '厘米', dm: '分米', m: '米' };
const rlen = (r, lo, hi) => (r.chance(0.75) ? r.int(lo, hi) : rdec(r, lo, hi, 1));
/** 三角形（按真实比例）：顶点在底边上的投影位置 top（0～1），高的标注放在离斜边远的一侧 */
function triFig(b, h, top, u) {
  const tx = b * top, pts = [[0, 0], [b, 0], [tx, h]], f = fitter(pts);
  const [x1, y1] = f([tx, h]), [x2, y2] = f([tx, 0]), right = top < 0.45;
  const mark = `<rect x="${right ? x2 : x2 - 10}" y="${y2 - 10}" width="10" height="10" fill="none" stroke="${C.dash}"/>`;
  return fig.poly(pts, { edgeLabels: [`${fmt(b)}${u}`], dashed: top > 0 ? [[[tx, h], [tx, 0]]] : [], extra: mark + TX(right ? x1 + 8 : x1 - 8, (y1 + y2) / 2, `${fmt(h)}${u}`, { size: 16, anchor: right ? 'start' : 'end' }) });
}

/** 平行四边形两组底和高：两条边、两条高都是整数，斜边的水平偏移不太大（画出来不变形） */
const PARA2H = [];
for (let a = 8; a <= 30; a++) for (let b = 6; b <= 24; b++) for (let ha = 4; ha <= 20; ha++) {
  const hb = (a * ha) / b;
  if (a !== b && ha < b && Number.isInteger(hb) && hb < a && hb !== ha && Math.sqrt(b * b - ha * ha) < a * 0.8) PARA2H.push({ a, b, ha, hb });
}

S.push(
  {
    id: 'g5a-area-para', grade: 5, term: 1, unit: U16, name: '平行四边形的面积',
    tip: '平行四边形的面积 = 底 × 高，高要和底对应，斜边不是高', level: 1,
    gen(r) {
      const u = r.pick(['cm', 'dm', 'm']);
      const dec = r.int(0, 3);
      const withSide = r.chance(0.6);
      const { b, h, side } = r.until(() => {
        const b = dec === 1 ? rdec(r, 4, 30, 1) : r.int(4, 30), h = dec === 2 ? rdec(r, 3, 20, 1) : r.int(3, 20);
        return { b, h, side: withSide ? fix(h + r.int(1, 6)) : null };
      }, ({ b, h, side }) => h / b >= 0.3 && h / b <= 1 && (!side || (Math.sqrt(side * side - h * h) >= 0.15 * b && Math.sqrt(side * side - h * h) <= 0.6 * b)));
      const S0 = fix(b * h);
      // 按真实比例画：斜边的水平偏移由斜边长和高算出
      const k = side ? Math.sqrt(side * side - h * h) : 0.3 * b, pts = [[0, 0], [b, 0], [b + k, h], [k, h]];
      const f = fitter(pts), [x1, y1] = f([k, h]), [, y2] = f([k, 0]);
      return {
        q: `求平行四边形的面积。`,
        fig: fig.poly(pts, { edgeLabels: [`${fmt(b)}${u}`, side ? `${fmt(side)}${u}` : ''], dashed: [[[k, 0], [k, h]]], extra: TX(x1 + 8, (y1 + y2) / 2, `${fmt(h)}${u}`, { size: 16, anchor: 'start' }) }),
        answer: [num(S0, { unit: AREA_U[u] })],
        steps: ['平行四边形的面积 = 底 × 高', ...(side ? [`${fmt(side)}${u} 是斜边，不是这条底上的高，不用它`] : []), `${fmt(b)} × ${fmt(h)} = ${fmt(S0)}（${AREA_U[u]}）`],
        hint: '找到底和与它对应的高（虚线）',
      };
    },
  },
  {
    id: 'g5a-area-tri', grade: 5, term: 1, unit: U16, name: '三角形的面积',
    tip: '三角形的面积 = 底 × 高 ÷ 2，别忘了除以 2', level: 1,
    gen(r) {
      const u = r.pick(['cm', 'dm', 'm']);
      const dec = r.int(0, 3);
      const [b, h] = r.until(() => [dec === 1 ? rdec(r, 4, 30, 1) : r.int(4, 30), dec === 2 ? rdec(r, 3, 20, 1) : r.int(3, 20)], ([b, h]) => h / b >= 0.35 && h / b <= 0.85), S0 = fix((b * h) / 2);
      return {
        q: '求三角形的面积。',
        fig: triFig(b, h, r.pick([0, 0.3, 0.5, 0.7]), u),
        answer: [num(S0, { unit: AREA_U[u] })],
        steps: ['两个完全一样的三角形能拼成一个平行四边形，所以三角形的面积 = 底 × 高 ÷ 2', `${fmt(b)} × ${fmt(h)} ÷ 2 = ${fmt(fix(b * h))} ÷ 2 = ${fmt(S0)}（${AREA_U[u]}）`],
        hint: '三角形的面积是同底同高的平行四边形的一半',
      };
    },
  },
  {
    id: 'g5a-area-trap', grade: 5, term: 1, unit: U16, name: '梯形的面积',
    tip: '梯形的面积 =（上底 + 下底）× 高 ÷ 2', level: 1,
    gen(r) {
      const u = r.pick(['cm', 'dm', 'm']);
      const dec = r.int(0, 3);
      const [bot, top, h] = r.until(() => [dec === 1 ? rdec(r, 8, 30, 1) : r.int(8, 30), dec === 2 ? rdec(r, 3, 25, 1) : r.int(3, 25), r.int(3, 16)], ([bot, top, h]) => top < bot - 1 && top / bot >= 0.3 && top / bot <= 0.8 && h / bot >= 0.35 && h / bot <= 0.65);
      const sum = fix(top + bot), S0 = fix((sum * h) / 2);
      return {
        q: '求梯形的面积。',
        fig: fig.trapezoid(top, bot, h, { unit: u }),
        answer: [num(S0, { unit: AREA_U[u] })],
        steps: ['两个完全一样的梯形能拼成一个平行四边形，底是（上底 + 下底），所以梯形的面积 =（上底 + 下底）× 高 ÷ 2', `(${fmt(top)} + ${fmt(bot)}) × ${fmt(h)} ÷ 2`, `= ${fmt(sum)} × ${fmt(h)} ÷ 2`, `= ${fmt(S0)}（${AREA_U[u]}）`],
        hint: '先算上底加下底',
      };
    },
  },
  {
    id: 'g5a-area-reverse', grade: 5, term: 1, unit: U16, name: '已知面积求底或高',
    tip: '倒着用面积公式；三角形和梯形要先把面积 × 2', level: 2,
    gen(r) {
      const u = r.pick(['厘米', '分米', '米']), au = '平方' + u;
      const k = r.int(0, 4);
      if (k === 0) {
        const b = r.int(4, 30), h = r.int(3, 20), S0 = b * h;
        return { q: `一个平行四边形的面积是 ${S0} ${au}，底是 ${b} ${u}，这条底上的高是多少${u}？`, answer: [num(h, { unit: u })], steps: ['平行四边形的面积 = 底 × 高，所以 高 = 面积 ÷ 底', `${S0} ÷ ${b} = ${h}（${u}）`], hint: '面积 = 底 × 高，倒过来想' };
      }
      if (k === 1) {
        const b = r.int(4, 30), h = r.int(3, 20), S0 = fix((b * h) / 2);
        const askH = r.bool();
        return askH
          ? { q: `一个三角形的面积是 ${fmt(S0)} ${au}，底是 ${b} ${u}，这条底上的高是多少${u}？`, answer: [num(h, { unit: u })], steps: ['三角形的面积 = 底 × 高 ÷ 2，所以 底 × 高 = 面积 × 2', `高 = 面积 × 2 ÷ 底：${fmt(S0)} × 2 ÷ ${b} = ${h}（${u}）`, '易错：忘了乘 2'], hint: '三角形面积 × 2 就是“底 × 高”' }
          : { q: `一个三角形的面积是 ${fmt(S0)} ${au}，高是 ${h} ${u}，它的底是多少${u}？`, answer: [num(b, { unit: u })], steps: ['三角形的面积 = 底 × 高 ÷ 2，所以 底 × 高 = 面积 × 2', `底 = 面积 × 2 ÷ 高：${fmt(S0)} × 2 ÷ ${h} = ${b}（${u}）`, '易错：忘了乘 2'], hint: '三角形面积 × 2 就是“底 × 高”' };
      }
      if (k === 2 || k === 3) {
        const top = r.int(3, 15), bot = r.int(top + 2, 30), h = r.int(3, 16), S0 = fix(((top + bot) * h) / 2);
        if (k === 2) return { q: `一个梯形的面积是 ${fmt(S0)} ${au}，上底是 ${top} ${u}，下底是 ${bot} ${u}，高是多少${u}？`, answer: [num(h, { unit: u })], steps: ['梯形的面积 =（上底 + 下底）× 高 ÷ 2', `所以 高 = 面积 × 2 ÷（上底 + 下底）`, `${fmt(S0)} × 2 ÷ (${top} + ${bot}) = ${fmt(S0 * 2)} ÷ ${top + bot} = ${h}（${u}）`], hint: '先把面积乘 2' };
        return { q: `一个梯形的面积是 ${fmt(S0)} ${au}，高是 ${h} ${u}，上底是 ${top} ${u}，下底是多少${u}？`, answer: [num(bot, { unit: u })], steps: ['梯形的面积 =（上底 + 下底）× 高 ÷ 2', `上底 + 下底 = 面积 × 2 ÷ 高：${fmt(S0)} × 2 ÷ ${h} = ${top + bot}（${u}）`, `下底：${top + bot} − ${top} = ${bot}（${u}）`], hint: '先求上底和下底的和' };
      }
      const b = r.int(4, 25), h = r.int(4, 20), S0 = b * h;
      return { q: `一个平行四边形的面积是 ${S0} ${au}，高是 ${h} ${u}，这条高对应的底是多少${u}？`, answer: [num(b, { unit: u })], steps: ['底 = 平行四边形的面积 ÷ 高', `${S0} ÷ ${h} = ${b}（${u}）`], hint: '面积 = 底 × 高，倒过来想' };
    },
  },
  {
    id: 'g5a-area-para-2h', grade: 5, term: 1, unit: U16, name: '平行四边形的两组底和高',
    tip: '同一个平行四边形面积不变：先用一组底和高算面积，再除以另一条底', level: 2,
    gen(r) {
      const o = r.pick(PARA2H);
      const S0 = o.a * o.ha;
      const k = Math.sqrt(o.b * o.b - o.ha * o.ha), pts = [[0, 0], [o.a, 0], [o.a + k, o.ha], [k, o.ha]], hx = (k + o.a) / 2;
      const f = fitter([...pts, [hx, 0], [hx, o.ha]]), [x1, y1] = f([hx, o.ha]), [, y2] = f([hx, 0]);
      return {
        q: `平行四边形的一条边长 ${o.a} cm，这条边上的高是 ${o.ha} cm；另一条边长 ${o.b} cm。另一条边上的高是多少厘米？`,
        fig: fig.poly(pts, { edgeLabels: [`${o.a}cm`, `${o.b}cm`], dashed: [[[hx, 0], [hx, o.ha]]], extra: TX(x1 + 8, (y1 + y2) / 2, `${o.ha}cm`, { size: 16, anchor: 'start' }) }),
        answer: [num(o.hb, { unit: '厘米' })],
        steps: [`先用边 ${o.a} cm 和它上面的高 ${o.ha} cm 求面积：${o.a} × ${o.ha} = ${S0}（平方厘米）`, `面积不变，以 ${o.b} cm 的边为底：高 = 面积 ÷ 底`, `${S0} ÷ ${o.b} = ${o.hb}（厘米）`],
        hint: '先求出平行四边形的面积',
      };
    },
  },
  {
    id: 'g5a-area-equal', grade: 5, term: 1, unit: U16, name: '等底等高的图形',
    tip: '三角形的面积是和它等底等高的平行四边形面积的一半', level: 2,
    gen(r) {
      const k = r.int(0, 4);
      if (k === 0) { const S0 = r.step(20, 200, 2); return { q: `一个三角形和一个平行四边形等底等高，平行四边形的面积是 ${S0} 平方厘米，三角形的面积是多少平方厘米？`, answer: [num(S0 / 2, { unit: '平方厘米' })], steps: ['等底等高时，三角形的面积是平行四边形面积的一半', `${S0} ÷ 2 = ${S0 / 2}（平方厘米）`] }; }
      if (k === 1) { const T = rlen(r, 8, 90); return { q: `一个三角形和一个平行四边形等底等高，三角形的面积是 ${fmt(T)} 平方米，平行四边形的面积是多少平方米？`, answer: [num(fix(T * 2), { unit: '平方米' })], steps: ['等底等高时，平行四边形的面积是三角形面积的 2 倍', `${fmt(T)} × 2 = ${fmt(fix(T * 2))}（平方米）`] }; }
      if (k === 2) { const h = rlen(r, 3, 20); return { q: `一个三角形和一个平行四边形的面积相等，底也相等。平行四边形的高是 ${fmt(h)} 厘米，三角形的高是多少厘米？`, answer: [num(fix(h * 2), { unit: '厘米' })], steps: ['平行四边形面积 = 底 × 高，三角形面积 = 底 × 高 ÷ 2', '面积相等、底相等，三角形要除以 2，所以三角形的高要是平行四边形的 2 倍', `${fmt(h)} × 2 = ${fmt(fix(h * 2))}（厘米）`], hint: '三角形面积公式里多了“÷ 2”' }; }
      if (k === 3) { const b = r.step(4, 40, 2); return { q: `一个三角形和一个平行四边形的面积相等，高也相等。三角形的底是 ${b} 厘米，平行四边形的底是多少厘米？`, answer: [num(b / 2, { unit: '厘米' })], steps: ['面积相等、高相等，三角形要除以 2，所以三角形的底是平行四边形的 2 倍', `平行四边形的底：${b} ÷ 2 = ${b / 2}（厘米）`], hint: '谁的底更长？' }; }
      const top = r.int(3, 12), bot = r.int(top + 2, 25), h = r.int(3, 12);
      return { q: `用两个完全一样的梯形拼成一个平行四边形。梯形的上底是 ${top} 厘米，下底是 ${bot} 厘米，高是 ${h} 厘米。拼成的平行四边形面积是多少平方厘米？`, answer: [num((top + bot) * h, { unit: '平方厘米' })], steps: ['拼成的平行四边形，底 = 梯形的上底 + 下底，高 = 梯形的高', `(${top} + ${bot}) × ${h} = ${(top + bot) * h}（平方厘米）`, '它正好是一个梯形面积的 2 倍'], hint: '拼成的平行四边形的底是多少？' };
    },
  },
  {
    id: 'g5a-area-composite', grade: 5, term: 1, unit: U16, name: '组合图形的面积',
    tip: '把组合图形分割成学过的图形，或者补成大图形再减去多的部分', level: 2,
    gen(r) {
      const k = r.int(0, 3);
      const L = (v) => `${v}cm`;
      if (k === 0) { // L 形
        const W = r.int(8, 20), H = r.int(8, 20), w2 = r.int(3, W - 3), h1 = r.int(3, H - 3);
        const A1 = W * h1, A2 = w2 * (H - h1), S0 = A1 + A2;
        return {
          q: '求这个图形的面积（单位：cm）。',
          fig: fig.poly([[0, 0], [W, 0], [W, h1], [w2, h1], [w2, H], [0, H]], { edgeLabels: [L(W), L(h1), '', '', L(w2), L(H)], dashed: [[[0, h1], [w2, h1]]] }),
          answer: [num(S0, { unit: '平方厘米' })],
          steps: ['沿虚线分成上、下两个长方形', `下面的长方形：${W} × ${h1} = ${A1}（平方厘米）`, `上面的长方形：宽 ${w2}，高 ${H} − ${h1} = ${H - h1}，面积 ${w2} × ${H - h1} = ${A2}（平方厘米）`, `合起来：${A1} + ${A2} = ${S0}（平方厘米）`],
          hint: '沿虚线分开，上面那个长方形的高是多少？',
        };
      }
      if (k === 1) { // 房子形：长方形 + 三角形
        const W = r.step(6, 20, 2), h = r.int(4, 14), t = r.int(3, 10);
        const pts = [[0, 0], [W, 0], [W, h], [W / 2, h + t], [0, h]];
        const dash = [[[0, h], [W, h]], [[W / 2, h], [W / 2, h + t]]];
        const f = fitter([...pts, ...dash.flat()]);
        const [mx, my] = f([W / 2, h + t * 0.35]);
        const A1 = W * h, A2 = (W * t) / 2, S0 = A1 + A2;
        return {
          q: '求这个图形的面积（单位：cm）。',
          fig: fig.poly(pts, { edgeLabels: [L(W), L(h)], dashed: dash, extra: TX(mx + 6, my, L(t), { size: 14, anchor: 'start' }) }),
          answer: [num(S0, { unit: '平方厘米' })],
          steps: ['分成下面的长方形和上面的三角形', `长方形：${W} × ${h} = ${A1}（平方厘米）`, `三角形：底 ${W}，高 ${t}，面积 ${W} × ${t} ÷ 2 = ${A2}（平方厘米）`, `合起来：${A1} + ${A2} = ${S0}（平方厘米）`],
          hint: '三角形的底就是长方形的长',
        };
      }
      if (k === 2) { // 长方形切掉一个角
        const W = r.int(8, 20), H = r.int(6, 16), a = r.int(2, W - 3), b = r.int(2, H - 3);
        const x = W - a, y = H - b, A0 = W * H, cut = (x * y) / 2, S0 = A0 - cut;
        return {
          q: '一个长方形剪去一个角后，剩下的图形如下。求它的面积（单位：cm）。',
          fig: fig.poly([[0, 0], [W, 0], [W, b], [a, H], [0, H]], { edgeLabels: [L(W), L(b), '', L(a), L(H)], dashed: [[[W, b], [W, H]], [[a, H], [W, H]]] }),
          answer: [num(S0, { unit: '平方厘米' })],
          steps: [`补成一个长方形（虚线），长 ${W}，宽 ${H}：${W} × ${H} = ${A0}（平方厘米）`, `剪去的是直角三角形，两条直角边是 ${W} − ${a} = ${x} 和 ${H} − ${b} = ${y}`, `三角形面积：${x} × ${y} ÷ 2 = ${fmt(cut)}（平方厘米）`, `剩下：${A0} − ${fmt(cut)} = ${fmt(S0)}（平方厘米）`],
          hint: '先补成完整的长方形，再减去剪掉的三角形',
        };
      }
      // 凹字形
      const W = r.int(10, 22), H = r.int(7, 16), m = r.int(3, W - 6), n = r.int(2, H - 3), o = r.int(2, W - m - 2);
      const pts = [[0, 0], [W, 0], [W, H], [o + m, H], [o + m, H - n], [o, H - n], [o, H], [0, H]];
      const S0 = W * H - m * n;
      return {
        q: '求这个图形的面积（单位：cm）。',
        fig: (() => { const f = fitter(pts), [x1, y1] = f([o + m / 2, H]), [x2, y2] = f([o, H - n / 2]); return fig.poly(pts, { edgeLabels: [L(W), L(H)], dashed: [[[o, H], [o + m, H]]], extra: TX(x1, y1 - 14, L(m), { size: 16 }) + TX(x2 + 8, y2, L(n), { size: 16, anchor: 'start' }) }); })(),
        answer: [num(S0, { unit: '平方厘米' })],
        steps: [`把缺口补上（虚线），是一个 ${W} × ${H} 的长方形：${W * H}（平方厘米）`, `缺口是一个长 ${m}、宽 ${n} 的长方形：${m} × ${n} = ${m * n}（平方厘米）`, `${W * H} − ${m * n} = ${S0}（平方厘米）`],
        hint: '补成大长方形，再减去缺口',
      };
    },
  },
  {
    id: 'g5a-area-word', grade: 5, term: 1, unit: U16, name: '多边形面积的实际问题', process: true,
    tip: '先用公式求面积，再按题目要求乘单产、单价或换算单位', level: 2,
    gen(r) {
      const t = r.pick([
        () => { const a = r.int(20, 40), b = r.int(a + 5, 70), h = r.int(10, 30), k = r.int(3, 8), A = ((a + b) * h) / 2; return { q: `一块梯形菜地，上底 ${a} 米，下底 ${b} 米，高 ${h} 米。每平方米收白菜 ${k} 千克，这块地一共收白菜多少千克？`, v: A * k, u: '千克', st: [`菜地面积：(${a} + ${b}) × ${h} ÷ 2 = ${fmt(A)}（平方米）`, `收白菜：${fmt(A)} × ${k} = ${fmt(A * k)}（千克）`], say: `一共收白菜 ${fmt(A * k)} 千克` }; },
        () => { const b = r.step(200, 500, 50), h = r.step(100, 400, 20), A = b * h; if (A % 10000) return null; const ha = A / 10000, k = rdec(r, 6, 8.5, 1); return { q: `一块平行四边形麦田，底是 ${b} 米，高是 ${h} 米。它的面积是多少公顷？如果每公顷收小麦 ${fmt(k)} 吨，一共收小麦多少吨？`, two: true, v: ha, u: '公顷', v2: fix(ha * k), u2: '吨', st: [`面积：${b} × ${h} = ${A}（平方米）`, `1 公顷 = 10000 平方米：${A} ÷ 10000 = ${ha}（公顷）`, `收小麦：${ha} × ${fmt(k)} = ${fmt(fix(ha * k))}（吨）`], say: `面积是 ${ha} 公顷，一共收小麦 ${fmt(fix(ha * k))} 吨` }; },
        () => { const b = r.int(20, 60), h = r.int(10, 40), p = r.pick([5, 8, 12, 15]), A = (b * h) / 2; return { q: `一块三角形绿地，底 ${b} 米，高 ${h} 米。在上面铺草皮，每平方米 ${p} 元，一共需要多少元？`, v: fix(A * p), u: '元', st: [`绿地面积：${b} × ${h} ÷ 2 = ${fmt(A)}（平方米）`, `需要：${fmt(A)} × ${p} = ${fmt(fix(A * p))}（元）`], say: `一共需要 ${fmt(fix(A * p))} 元` }; },
        () => { const a = r.int(2, 8), n = r.int(5, 12), b = a + n - 1, tot = ((a + b) * n) / 2; return { q: `一堆圆木，最上层有 ${a} 根，下面每层都比上面一层多 1 根，最下层有 ${b} 根。这堆圆木一共有多少根？`, v: tot, u: '根', st: [`圆木堆的横截面近似梯形：上底 ${a}，下底 ${b}，层数 ${b} − ${a} + 1 = ${n}（相当于高）`, `(${a} + ${b}) × ${n} ÷ 2 = ${tot}（根）`], say: `一共有 ${tot} 根` }; },
        () => { const b = r.pick([90, 100, 110]), h = r.pick([30, 32, 33, 35]), n = r.int(10, 60), A = (b * h) / 2; return { q: `一条红领巾近似三角形，底是 ${b} 厘米，高是 ${h} 厘米。做 ${n} 条这样的红领巾至少需要多少平方厘米的布？`, v: A * n, u: '平方厘米', st: [`一条红领巾：${b} × ${h} ÷ 2 = ${fmt(A)}（平方厘米）`, `${n} 条：${fmt(A)} × ${n} = ${fmt(A * n)}（平方厘米）`], say: `至少需要 ${fmt(A * n)} 平方厘米的布` }; },
        () => { const b = rdec(r, 2.5, 6, 1), h = rdec(r, 1.2, 3.5, 1), k = r.pick([0.2, 0.3, 0.4, 0.5]), A = fix(b * h); return { q: `一块平行四边形的广告牌，底 ${fmt(b)} 米，高 ${fmt(h)} 米。在它的一面刷油漆，每平方米用油漆 ${fmt(k)} 千克，一共要用油漆多少千克？`, v: fix(A * k), u: '千克', st: [`广告牌面积：${fmt(b)} × ${fmt(h)} = ${fmt(A)}（平方米）`, `用油漆：${fmt(A)} × ${fmt(k)} = ${fmt(fix(A * k))}（千克）`], say: `一共要用油漆 ${fmt(fix(A * k))} 千克` }; },
      ]);
      const o = r.until(t, (x) => x);
      return {
        q: o.q,
        answer: o.two ? [num(o.v, { unit: o.u }), num(o.v2, { unit: o.u2 })] : [num(o.v, { unit: o.u })],
        steps: ['先求图形的面积，再算题目要求的量', ...o.st, `答：${o.say}。`],
      };
    },
  },
);

// ---------- 第 7 单元 数学广角——植树问题 ----------
const U17 = '植树问题';
const TREE_CTX = [
  { q: (L, d) => `在一条长 ${L} 米的小路一边种树，每隔 ${d} 米种一棵`, act: '种', u: '棵', what: '棵树' },
  { q: (L, d) => `在一条长 ${L} 米的公路一侧安装路灯，每隔 ${d} 米装一盏`, act: '装', u: '盏', what: '盏路灯' },
  { q: (L, d) => `在运动场一条长 ${L} 米的跑道一边插彩旗，每隔 ${d} 米插一面`, act: '插', u: '面', what: '面彩旗' },
  { q: (L, d) => `在一条长 ${L} 米的河岸一边栽柳树，每隔 ${d} 米栽一棵`, act: '栽', u: '棵', what: '棵柳树' },
  { q: (L, d) => `在一条长 ${L} 米的街道一边放垃圾桶，每隔 ${d} 米放一个`, act: '放', u: '个', what: '个垃圾桶' },
];

S.push(
  {
    id: 'g5a-tree-both', grade: 5, term: 1, unit: U17, name: '植树（两端都种）', process: true,
    tip: '两端都种：棵数 = 间隔数 + 1', level: 1,
    gen(r) {
      const c = r.pick(TREE_CTX), d = r.pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25]), n = r.int(5, 40), L = d * n;
      const two = r.chance(0.25) && c.u === '棵';
      const ans = two ? 2 * (n + 1) : n + 1;
      const q = two
        ? `一条小路长 ${L} 米，要在小路两旁种树，每隔 ${d} 米种一棵，两端都要种。一共要种多少棵树？`
        : `${c.q(L, d)}，两端都要${c.act}。一共要${c.act}多少${c.what}？`;
      return {
        q,
        answer: [num(ans, { unit: c.u })],
        steps: [`间隔数：${L} ÷ ${d} = ${n}（个）`, `两端都${c.act}，数量比间隔数多 1：${n} + 1 = ${n + 1}（${c.u}）`, ...(two ? [`两旁都种，要乘 2：${n + 1} × 2 = ${ans}（棵）`] : []), `答：一共要${c.act} ${ans} ${c.u}。`],
        hint: '先算有几个间隔，两端都种比间隔数多几？',
      };
    },
  },
  {
    id: 'g5a-tree-one', grade: 5, term: 1, unit: U17, name: '植树（只种一端）', process: true,
    tip: '只种一端：棵数 = 间隔数', level: 1,
    gen(r) {
      const d = r.pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 20]), n = r.int(5, 40), L = d * n;
      const t = r.pick([
        { q: `从学校门口到教学楼有一条长 ${L} 米的小路，要在路的一边种树，每隔 ${d} 米种一棵。学校门口要种，教学楼那头不种。一共要种多少棵？`, u: '棵', act: '种' },
        { q: `一条长 ${L} 米的小路，一端靠着围墙。在小路一边每隔 ${d} 米栽一棵树，靠墙的一端不栽，另一端要栽。一共要栽多少棵？`, u: '棵', act: '栽' },
        { q: `从公园大门到湖边有一条 ${L} 米长的路，在路的一侧每隔 ${d} 米放一个垃圾桶，大门口放，湖边不放。一共要放多少个？`, u: '个', act: '放' },
        { q: `${r.name()}家门前有一条 ${L} 米长的路，路的一端是一座房子。在这条路的一边每隔 ${d} 米安装一盏路灯，房子那一端不装。一共要装多少盏路灯？`, u: '盏', act: '装' },
      ]);
      return {
        q: t.q,
        answer: [num(n, { unit: t.u })],
        steps: [`间隔数：${L} ÷ ${d} = ${n}（个）`, `只${t.act}一端，每个间隔对应一${t.u}，数量 = 间隔数 = ${n}（${t.u}）`, `答：一共要${t.act} ${n} ${t.u}。`],
        hint: '只种一端时，数量和间隔数有什么关系？',
      };
    },
  },
  {
    id: 'g5a-tree-none', grade: 5, term: 1, unit: U17, name: '植树（两端都不种）', process: true,
    tip: '两端都不种：棵数 = 间隔数 − 1', level: 1,
    gen(r) {
      const d = r.pick([2, 3, 4, 5, 6, 8, 10, 12, 15]), n = r.int(5, 40), L = d * n;
      const t = r.pick([
        { q: `两座楼之间相距 ${L} 米，要在两楼之间的空地上种一行树，每隔 ${d} 米种一棵，两端靠楼的地方都不种。一共要种多少棵？`, u: '棵', act: '种' },
        { q: `两棵大树之间相距 ${L} 米，在它们中间每隔 ${d} 米栽一棵小树（两棵大树处不再栽）。一共要栽多少棵小树？`, u: '棵', act: '栽' },
        { q: `${r.name()}家和学校之间的路长 ${L} 米，在路的一边每隔 ${d} 米安装一盏路灯，两端都不装。一共要装多少盏路灯？`, u: '盏', act: '装' },
        { q: `两根电线杆之间相距 ${L} 米，在它们之间每隔 ${d} 米插一面小旗，两根电线杆处不插。一共要插多少面小旗？`, u: '面', act: '插' },
      ]);
      return {
        q: t.q,
        answer: [num(n - 1, { unit: t.u })],
        steps: [`间隔数：${L} ÷ ${d} = ${n}（个）`, `两端都不${t.act}，数量比间隔数少 1：${n} − 1 = ${n - 1}（${t.u}）`, `答：一共要${t.act} ${n - 1} ${t.u}。`],
        hint: '两端都不种，比间隔数多还是少？',
      };
    },
  },
  {
    id: 'g5a-tree-ring', grade: 5, term: 1, unit: U17, name: '植树（封闭图形）', process: true,
    tip: '围成一圈（封闭图形）：棵数 = 间隔数', level: 1,
    gen(r) {
      const d = r.pick([2, 3, 4, 5, 6, 8, 10]), n = r.int(8, 60), C = d * n;
      const t = r.pick([
        { q: `一个圆形花坛的周长是 ${C} 米，沿着花坛四周每隔 ${d} 米摆一盆花。一共要摆多少盆花？`, u: '盆', act: '摆' },
        { q: `一个人工湖的周长是 ${C} 米，沿着湖边每隔 ${d} 米栽一棵柳树。一共要栽多少棵？`, u: '棵', act: '栽' },
        { q: `一个圆形水池的周长是 ${C} 米，沿水池一周每隔 ${d} 米安装一盏彩灯。一共要装多少盏？`, u: '盏', act: '装' },
        { q: `学校环形跑道一圈长 ${C} 米，沿着跑道每隔 ${d} 米插一面彩旗。一共要插多少面？`, u: '面', act: '插', ok: C >= 200 },
      ].filter((o) => o.ok !== false));
      return {
        q: t.q,
        answer: [num(n, { unit: t.u })],
        steps: [`沿着一圈${t.act}，首尾连在一起，是封闭图形`, `间隔数：${C} ÷ ${d} = ${n}（个）`, `封闭图形里数量 = 间隔数：${n}（${t.u}）`, `答：一共要${t.act} ${n} ${t.u}。`],
        hint: '围成一圈时，起点和终点是不是同一个点？',
      };
    },
  },
  {
    id: 'g5a-tree-square', grade: 5, term: 1, unit: U17, name: '正方形四周（四角都放）', process: true,
    tip: '每边 k 个、四个角都放：一共 (k − 1) × 4 个，四个角不能重复数', level: 2,
    gen(r) {
      const k = r.int(4, 25), tot = (k - 1) * 4;
      const t = r.pick([
        { q: `在一个正方形花坛的四周摆花，四个角都要摆，每边摆 ${k} 盆。一共要摆多少盆？`, u: '盆' },
        { q: `同学们排成一个正方形队列（空心方阵），最外层每边有 ${k} 人。最外层一共有多少人？`, u: '人' },
        { q: `在正方形池塘的四周栽树，四个角都栽一棵，每边栽 ${k} 棵。一共栽了多少棵？`, u: '棵' },
      ]);
      const rev = r.chance(0.35);
      if (rev) return {
        q: `在一个正方形花坛的四周摆了 ${tot} 盆花，四个角都摆了，每边摆的盆数相同。每边摆了多少盆？`,
        answer: [num(k, { unit: '盆' })],
        steps: ['四个角上的花被两条边共用', `去掉四个角：${tot} ÷ 4 = ${k - 1}，这是每边不算一个角的盆数`, `每边：${k - 1} + 1 = ${k}（盆）`, `答：每边摆了 ${k} 盆。`],
        hint: '每个角上的那盆被两条边共用',
      };
      return {
        q: t.q,
        answer: [num(tot, { unit: t.u })],
        steps: [`如果直接算 ${k} × 4 = ${4 * k}，四个角都被数了两次`, `减去重复的 4 个角：${4 * k} − 4 = ${tot}（${t.u}）`, `也可以每边只算 ${k} − 1 = ${k - 1} 个：${k - 1} × 4 = ${tot}（${t.u}）`, `答：一共 ${tot} ${t.u}。`],
        hint: '四个角上的被数了几次？',
      };
    },
  },
  {
    id: 'g5a-tree-reverse', grade: 5, term: 1, unit: U17, name: '植树问题（求长度或间隔）', process: true,
    tip: '先由棵数求出间隔数，再求全长（间隔数 × 间距）或间距（全长 ÷ 间隔数）', level: 2,
    gen(r) {
      const d = r.pick([2, 3, 4, 5, 6, 8, 10, 12, 15]), n = r.int(5, 40), L = d * n;
      const mode = r.pick(['both', 'none', 'one']);
      const cnt = mode === 'both' ? n + 1 : mode === 'none' ? n - 1 : n;
      const how = mode === 'both' ? '两端都种' : mode === 'none' ? '两端都不种' : '只在一端种';
      const rel = mode === 'both' ? `间隔数 = 棵数 − 1 = ${cnt} − 1 = ${n}` : mode === 'none' ? `间隔数 = 棵数 + 1 = ${cnt} + 1 = ${n}` : `间隔数 = 棵数 = ${n}`;
      if (r.bool()) return {
        q: `在一条路的一边种树，${how}，每隔 ${d} 米种一棵，一共种了 ${cnt} 棵。这条路长多少米？`,
        answer: [num(L, { unit: '米' })],
        steps: [`${how}：${rel}`, `路长 = 间隔数 × 间距：${n} × ${d} = ${L}（米）`, `答：这条路长 ${L} 米。`],
        hint: '先求有几个间隔',
      };
      return {
        q: `一条路长 ${L} 米，在路的一边种了 ${cnt} 棵树，${how}，相邻两棵树之间的距离都相等。相邻两棵树相距多少米？`,
        answer: [num(d, { unit: '米' })],
        steps: [`${how}：${rel}`, `间距 = 全长 ÷ 间隔数：${L} ÷ ${n} = ${d}（米）`, `答：相邻两棵树相距 ${d} 米。`],
        hint: '先求有几个间隔',
      };
    },
  },
  {
    id: 'g5a-tree-saw', grade: 5, term: 1, unit: U17, name: '锯木头问题', process: true,
    tip: '锯的次数 = 段数 − 1；先求锯一次用的时间', level: 2,
    gen(r) {
      if (r.bool()) {
        const n = r.int(3, 12), t = r.int(2, 9), tot = (n - 1) * t;
        const thing = r.pick(['一根木头', '一根钢管', '一根竹竿']);
        return {
          q: `把${thing}锯成 ${n} 段，每锯一次要用 ${t} 分钟。一共要用多少分钟？`,
          answer: [num(tot, { unit: '分钟' })],
          steps: [`锯成 ${n} 段，只要锯 ${n} − 1 = ${n - 1}（次）`, `${n - 1} × ${t} = ${tot}（分钟）`, `答：一共要用 ${tot} 分钟。`],
          hint: '锯成 2 段要锯几次？',
        };
      }
      const t = r.int(2, 8), a = r.int(3, 8), b = r.until(() => r.int(3, 15), (v) => v !== a);
      return {
        q: `把一根木头锯成 ${a} 段要用 ${(a - 1) * t} 分钟。照这样计算，把同样的一根木头锯成 ${b} 段要用多少分钟？`,
        answer: [num((b - 1) * t, { unit: '分钟' })],
        steps: [`锯成 ${a} 段锯了 ${a - 1} 次，每次用 ${(a - 1) * t} ÷ ${a - 1} = ${t}（分钟）`, `锯成 ${b} 段要锯 ${b - 1} 次：${b - 1} × ${t} = ${(b - 1) * t}（分钟）`, `答：要用 ${(b - 1) * t} 分钟。`],
        hint: `易错：不能用 ${(a - 1) * t} ÷ ${a}，锯的次数比段数少 1`,
      };
    },
  },
  {
    id: 'g5a-tree-stairs', grade: 5, term: 1, unit: U17, name: '爬楼梯问题', process: true,
    tip: '从 1 楼到 n 楼，只爬了 (n − 1) 层楼梯', level: 2,
    gen(r) {
      const nm = r.name();
      if (r.bool()) {
        const k = r.int(12, 22), n = r.int(3, 12), tot = k * (n - 1);
        return {
          q: `${nm}家住在 ${n} 楼，每层楼梯有 ${k} 级台阶。${nm}从 1 楼走到家，一共要走多少级台阶？`,
          answer: [num(tot, { unit: '级' })],
          steps: [`从 1 楼到 ${n} 楼，要走 ${n} − 1 = ${n - 1}（层）楼梯`, `${k} × ${n - 1} = ${tot}（级）`, `答：一共要走 ${tot} 级台阶。`],
          hint: '从 1 楼走到 2 楼走了几层楼梯？',
        };
      }
      const t = r.int(8, 20), a = r.int(3, 6), b = r.until(() => r.int(4, 15), (v) => v > a);
      return {
        q: `${nm}从 1 楼走到 ${a} 楼用了 ${(a - 1) * t} 秒。照这样的速度，从 1 楼走到 ${b} 楼要用多少秒？`,
        answer: [num((b - 1) * t, { unit: '秒' })],
        steps: [`从 1 楼到 ${a} 楼走了 ${a - 1} 层，每层用 ${(a - 1) * t} ÷ ${a - 1} = ${t}（秒）`, `从 1 楼到 ${b} 楼要走 ${b - 1} 层：${b - 1} × ${t} = ${(b - 1) * t}（秒）`, `答：要用 ${(b - 1) * t} 秒。`],
        hint: `易错：不是 ${(a - 1) * t} ÷ ${a}`,
      };
    },
  },
  {
    id: 'g5a-tree-clock', grade: 5, term: 1, unit: U17, name: '敲钟问题', process: true,
    tip: '敲 n 下，中间只有 (n − 1) 个间隔，时间算的是间隔', level: 2,
    gen(r) {
      const t = r.int(2, 6), a = r.int(3, 8), b = r.until(() => r.int(4, 12), (v) => v !== a);
      return {
        q: `一座钟 ${a} 点时敲 ${a} 下，用了 ${(a - 1) * t} 秒。照这样，${b} 点时敲 ${b} 下要用多少秒？`,
        answer: [num((b - 1) * t, { unit: '秒' })],
        steps: [`敲 ${a} 下，中间有 ${a - 1} 个间隔，每个间隔 ${(a - 1) * t} ÷ ${a - 1} = ${t}（秒）`, `敲 ${b} 下有 ${b - 1} 个间隔：${b - 1} × ${t} = ${(b - 1) * t}（秒）`, `答：要用 ${(b - 1) * t} 秒。`],
        hint: '敲 2 下中间有几个间隔？',
      };
    },
  },
);

// ======================= 五年级下册 =======================
// ---------- 第 1 单元 观察物体（三） ----------
/** 从上面看的方格图，格子里写这个位置摆了几个（grid[行][列]，第 0 行在最后面） */
function topNumFig(grid) {
  const u = 40, rows = grid.length, cols = grid[0].length, ox = 30, oy = 16, W = ox * 2 + cols * u, H = oy + rows * u + 34;
  let s = '';
  grid.forEach((row, rr) => row.forEach((v, c) => {
    if (!v) return;
    s += `<rect x="${ox + c * u}" y="${oy + rr * u}" width="${u}" height="${u}" fill="${C.fill}" stroke="${C.line}" stroke-width="2"/>` + TX(ox + c * u + u / 2, oy + rr * u + u / 2, String(v), { size: 18, weight: 'bold' });
  }));
  s += TX(ox + (cols * u) / 2, oy + rows * u + 20, '↑ 正面', { size: 14, color: C.dash });
  return fig.raw(W, H, s);
}
/** 方格里有数的格子是否连成一片（上下左右相邻） */
function connected(g) {
  const cells = []; g.forEach((row, i) => row.forEach((v, j) => { if (v) cells.push(`${i},${j}`); }));
  const seen = new Set([cells[0]]), st = [cells[0]];
  while (st.length) { const [i, j] = st.pop().split(',').map(Number); for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) { const k = `${a},${b}`; if (g[a]?.[b] && !seen.has(k)) { seen.add(k); st.push(k); } } }
  return seen.size === cells.length;
}
S.push({
  id: 'g5b-view-num', grade: 5, term: 2, unit: '观察物体（三）', name: '从上面看的数字图',
  tip: '格子里的数是这个位置摆的个数：全部加起来是总数；从正面看每列取最大的数，从左面看每行取最大的数', level: 2,
  gen(r) {
    const g = r.until(() => { const rows = r.int(2, 3), cols = r.int(2, 4); return Array.from({ length: rows }, () => Array.from({ length: cols }, () => (r.chance(0.2) ? 0 : r.int(1, 3)))); },
      (g) => g.every((row) => row.some((v) => v)) && g[0].every((_, c) => g.some((row) => row[c])) && connected(g) && g.flat().reduce((a, b) => a + b, 0) <= 18 && new Set(g.flat()).size > 1);
    const total = g.flat().reduce((a, b) => a + b, 0);
    const colMax = g[0].map((_, c) => Math.max(...g.map((row) => row[c]))), rowMax = g.map((row) => Math.max(...row));
    const front = colMax.reduce((a, b) => a + b, 0), left = rowMax.reduce((a, b) => a + b, 0);
    return {
      q: '用同样大的小正方体搭一个立体图形，下面是从上面看到的图形，格子里的数表示这个位置摆了几个小正方体。一共用了 {0} 个小正方体；从正面看到的图形由 {1} 个小正方形组成；从左面看到的图形由 {2} 个小正方形组成。',
      fig: topNumFig(g),
      answer: [num(total), num(front), num(left)],
      steps: [
        `总数：把格子里的数都加起来，${g.flat().filter((v) => v).join(' + ')} = ${total}（个）`,
        `从正面看，从左往右每一列只看到最高的那一摞：${colMax.join('、')} 层，一共 ${colMax.join(' + ')} = ${front}（个）小正方形`,
        `从左面看，从前往后每一行也只看到最高的那一摞：${[...rowMax].reverse().join('、')} 层，一共 ${[...rowMax].reverse().join(' + ')} = ${left}（个）小正方形`,
      ],
      hint: '从正面看，每一列能看到几层？',
    };
  },
});
S.push({
  id: 'g5b-view-count', grade: 5, term: 2, unit: '观察物体（三）', name: '根据视图求正方体个数',
  tip: '从上面看定位置，从正面看定每列最高几层：最少 = 每列一个位置摆满、其余摆 1 个；最多 = 每个位置都摆满', level: 3,
  gen(r) {
    const o = r.until(() => {
      const cols = r.int(2, 4), depth = r.int(2, 3);
      const top = Array.from({ length: depth }, () => Array.from({ length: cols }, () => r.chance(0.55)));
      for (let c = 0; c < cols; c++) if (!top.some((row) => row[c])) top[r.int(0, depth - 1)][c] = true;
      const front = Array.from({ length: cols }, () => r.int(1, 3));
      const n = front.map((_, c) => top.filter((row) => row[c]).length);
      const mn = front.reduce((s, h, c) => s + h + n[c] - 1, 0), mx = front.reduce((s, h, c) => s + h * n[c], 0);
      return { cols, depth, top, front, n, mn, mx };
    }, (o) => o.mx > o.mn && o.front.some((h) => h > 1));
    const colDesc = o.front.map((h, c) => `第 ${c + 1} 列：${o.n[c]} 个位置，最高 ${h} 层`).join('；');
    return {
      q: '用同样大的小正方体搭一个立体图形，从正面看和从上面看到的形状如下图（从上面看的图里，下面一行在最前面）。搭这个立体图形，最少需要 {0} 个小正方体，最多需要 {1} 个。',
      fig: viewsFig(o.front, o.top),
      answer: [num(o.mn, { label: '最少' }), num(o.mx, { label: '最多' })],
      steps: [
        '从上面看，知道每一列（从左往右）有几个位置摆了正方体；从正面看，知道每一列最高有几层',
        colDesc,
        `最少：每列只要有一个位置摆到最高层，其余位置各摆 1 个：${o.front.map((h, c) => `(${h} + ${o.n[c] - 1})`).join(' + ')} = ${o.mn}（个）`,
        `最多：每列的每个位置都摆到最高层：${o.front.map((h, c) => `${o.n[c]} × ${h}`).join(' + ')} = ${o.mx}（个）`,
      ],
      hint: '先看从上面看的图，每一列有几个位置；再看从正面看，每一列最高几层',
    };
  },
});

// ---------- 第 2 单元 因数与倍数 ----------
const U22 = '因数与倍数';
const factorPairs = (n) => { const ps = []; for (let i = 1; i * i <= n; i++) if (n % i === 0) ps.push(i * i === n ? `${i} × ${i}` : `${i} × ${n / i}`); return ps; };
const PRIMES100 = Array.from({ length: 100 }, (_, i) => i).filter(isPrime);
const FAKE_PRIMES = [21, 27, 33, 39, 49, 51, 57, 63, 69, 77, 81, 87, 91, 93, 99, 111, 119];

S.push(
  {
    id: 'g5b-fm-factors', grade: 5, term: 2, unit: U22, name: '找一个数的因数',
    tip: '一对一对地找：1 × n、2 × …，找到两个因数相同或相邻就停', level: 1,
    gen(r) {
      const n = r.until(() => r.int(12, 100), (v) => factors(v).length >= 4);
      const fs = factors(n);
      const ask = r.pick(['count', 'count', 'sum']);
      return {
        q: ask === 'count' ? `${n} 的因数一共有 {0} 个` : `${n} 的所有因数的和是 {0}`,
        answer: [num(ask === 'count' ? fs.length : fs.reduce((a, b) => a + b, 0))],
        steps: [`一对一对地找乘积是 ${n} 的两个数：${factorPairs(n).join('，')}`, `${n} 的因数有：${fs.join('、')}`, ask === 'count' ? `一共 ${fs.length} 个` : `加起来：${fs.join(' + ')} = ${fs.reduce((a, b) => a + b, 0)}`],
        hint: `从 1 开始试，哪些数能整除 ${n}？`,
      };
    },
  },
  {
    id: 'g5b-fm-multiples', grade: 5, term: 2, unit: U22, name: '找一个数的倍数',
    tip: '一个数的倍数从它本身开始，一个一个地加上它：最小的倍数是它本身，没有最大的倍数', level: 1,
    gen(r) {
      const a = r.int(3, 19), k = r.int(0, 3);
      if (k === 0) { const N = r.step(30, 100, 10); const c = Math.floor(N / a); return { q: `在 1~${N} 中，${a} 的倍数有 {0} 个`, answer: [num(c)], steps: [`${a} 的倍数：${a}、${2 * a}、${3 * a}……`, `${N} ÷ ${a} = ${c}${N % a ? ` …… ${N % a}` : ''}，所以有 ${c} 个（最大的是 ${a} × ${c} = ${a * c}）`], hint: `${a} 的几倍不超过 ${N}？` }; }
      if (k === 1) { const v = Math.ceil(10 / a) * a; return { q: `${a} 的倍数中，最小的两位数是 {0}`, answer: [num(v)], steps: [`${a} 的倍数：${a}、${2 * a}、${3 * a}……`, `第一个不小于 10 的是 ${v}`] }; }
      if (k === 2) { const v = Math.floor(99 / a) * a; return { q: `${a} 的倍数中，最大的两位数是 {0}`, answer: [num(v)], steps: [`99 ÷ ${a} = ${Math.floor(99 / a)}${99 % a ? ` …… ${99 % a}` : ''}`, `${a} × ${Math.floor(99 / a)} = ${v}，这是不超过 99 的最大的 ${a} 的倍数`], hint: `99 除以 ${a} 看看` }; }
      const v = Math.ceil(100 / a) * a;
      return { q: `${a} 的倍数中，最小的三位数是 {0}`, answer: [num(v)], steps: [`100 ÷ ${a} = ${Math.floor(100 / a)}${100 % a ? ` …… ${100 % a}` : ''}`, `${100 % a ? `${a} × ${Math.floor(100 / a)} = ${Math.floor(100 / a) * a} 还不到 100，再加一个 ${a}：` : ''}${v}`], hint: `100 除以 ${a} 看看` };
    },
  },
  {
    id: 'g5b-fm-judge', grade: 5, term: 2, unit: U22, name: '因数倍数概念判断', pool: 24,
    tip: '因数和倍数是相互依存的；一个数的因数个数有限，倍数个数无限', level: 1,
    gen(r) {
      const t = r.pick([
        ['一个数的因数的个数是有限的。', '√', '最小的因数是 1，最大的因数是它本身，个数有限'],
        ['一个数的倍数的个数是有限的。', '×', '倍数可以一直乘下去，个数是无限的'],
        ['一个数的最大因数和它的最小倍数都是它本身。', '√', '最大因数是它本身，最小倍数也是它本身'],
        ['一个数的因数一定比它的倍数小。', '×', '例如 6 的因数 6 和倍数 6 相等'],
        ['所有的奇数都是质数。', '×', '例如 9 是奇数，但 9 = 3 × 3，是合数'],
        ['所有的偶数都是合数。', '×', '2 是偶数，但 2 是质数'],
        ['2 是唯一的一个既是偶数又是质数的数。', '√', '其他偶数都有因数 2，至少有 3 个因数'],
        ['1 既不是质数，也不是合数。', '√', '1 只有 1 个因数'],
        ['一个自然数不是质数就是合数。', '×', '还有 1，它既不是质数也不是合数（0 也不是）'],
        ['两个质数的积一定是合数。', '√', '积至少有 1、两个质数、积本身这几个因数'],
        ['两个质数的和一定是偶数。', '×', '例如 2 + 3 = 5 是奇数'],
        ['个位上是 3、6、9 的数，一定是 3 的倍数。', '×', '例如 13 不是 3 的倍数；判断 3 的倍数要看各位数字之和'],
        ['一个数各位上的数字之和是 3 的倍数，这个数就是 3 的倍数。', '√', '这是 3 的倍数的特征'],
        ['个位上是 0 的数，一定同时是 2 和 5 的倍数。', '√', '个位是 0，既符合 2 的倍数特征，也符合 5 的倍数特征'],
        ['同时是 2、3、5 的倍数的最小两位数是 30。', '√', '个位是 0，数字和是 3 的倍数，最小是 30'],
        ['奇数 + 奇数 = 奇数。', '×', '奇数 + 奇数 = 偶数，例如 3 + 5 = 8'],
        ['奇数 × 奇数 = 奇数。', '√', '例如 3 × 5 = 15，没有因数 2'],
        ['偶数 × 任何整数 = 偶数。', '√', '积里一定有因数 2'],
        ['因为 4 × 5 = 20，所以 20 是倍数，4 是因数。', '×', '因数和倍数相互依存，要说“20 是 4 的倍数，4 是 20 的因数”'],
        ['所有质数都是奇数。', '×', '2 是质数，但它是偶数'],
        ['最小的质数是 1。', '×', '1 不是质数，最小的质数是 2'],
        ['一个数的因数一定比它小。', '×', '一个数最大的因数是它本身'],
        ['9 的倍数一定是 3 的倍数。', '√', '9 是 3 的倍数，9 的倍数也一定有因数 3'],
        ['3 的倍数一定是 9 的倍数。', '×', '例如 6 是 3 的倍数，但不是 9 的倍数'],
      ]);
      return { q: `判断：${t[0]}{0}`, answer: [choice(['√', '×'], t[1])], steps: [t[2], `所以这句话是${t[1] === '√' ? '对的' : '错的'}`], hint: '想一个具体的数试一试' };
    },
  },
  {
    id: 'g5b-fm-235', grade: 5, term: 2, unit: U22, name: '2、5、3 的倍数特征',
    tip: '2 的倍数个位是 0、2、4、6、8；5 的倍数个位是 0 或 5；3 的倍数各位数字之和是 3 的倍数', level: 1,
    gen(r) {
      const cond = r.pick(['2', '5', '3', '25', '23', '35', '235']);
      const ok = (v) => [...cond].every((d) => v % Number(d) === 0);
      const name = { 2: '2', 5: '5', 3: '3', 25: '2 和 5', 23: '2 和 3', 35: '3 和 5', 235: '2、3、5' }[cond];
      const L = [...cond].map(Number).reduce((m, d) => lcm(m, d), 1), right = L * r.int(Math.ceil(100 / L), Math.floor(999 / L));
      const wrong = [];
      while (wrong.length < 3) {
        const v = r.int(100, 999);
        const near = [...cond].some((d) => v % Number(d) === 0); // 满足一部分条件的更有迷惑性
        if (!ok(v) && (near || r.chance(0.3)) && !wrong.includes(v)) wrong.push(v);
      }
      const ds = (v) => String(v).split('').map(Number);
      const why = (v) => {
        const parts = [];
        const d = v % 10, sum = ds(v).reduce((a, b) => a + b, 0);
        if (cond === '25') parts.push(d === 0 ? '个位是 0 ✓' : `个位是 ${d}，不是 0 ✗`);
        else {
          if (cond.includes('2')) parts.push(`个位 ${d} ${d % 2 ? '不是双数 ✗' : '是双数 ✓'}`);
          if (cond.includes('5')) parts.push(`个位 ${d} ${d % 5 ? '不是 0 或 5 ✗' : '✓'}`);
        }
        if (cond.includes('3')) parts.push(`数字和 ${ds(v).join(' + ')} = ${sum}，${sum % 3 ? '不是 3 的倍数 ✗' : '是 3 的倍数 ✓'}`);
        return `${v}：${parts.join('；')}`;
      };
      const opts = r.shuffle([right, ...wrong]).map(String);
      return {
        q: `下面的数中，${cond.length > 1 ? '同时' : ''}是 ${name} 的倍数的是{0}`,
        answer: [choice(opts, String(right))],
        steps: [cond === '235' ? '同时是 2、3、5 的倍数：个位是 0，并且各位数字之和是 3 的倍数' : `看特征：${name} 的倍数`, ...opts.map(Number).map(why), `所以选 ${right}`],
        hint: cond.includes('3') ? '3 的倍数要把各位数字加起来看' : '只看个位',
      };
    },
  },
  {
    id: 'g5b-fm-digit', grade: 5, term: 2, unit: U22, name: '□里填几是倍数',
    tip: '先用个位定 2、5 的条件，再用数字和定 3 的条件', level: 2,
    gen(r) {
      const o = r.until(() => {
        const len = r.int(3, 4), pos = r.int(0, len - 1);
        const cond = r.pick(['3', '23', '35', '235', '3', '25']);
        const digits = Array.from({ length: len }, (_, i) => (i === 0 ? r.int(1, 9) : r.int(0, 9)));
        const fill = [];
        for (let d = pos === 0 ? 1 : 0; d <= 9; d++) { const v = Number(digits.map((x, i) => (i === pos ? d : x)).join('')); if ([...cond].every((c) => v % Number(c) === 0)) fill.push(d); }
        return { len, pos, cond, digits, fill };
      }, (o) => o.fill.length >= 1 && o.fill.length <= 4 && !(o.cond === '25' && o.pos !== o.len - 1));
      const shown = o.digits.map((x, i) => (i === o.pos ? '□' : x)).join('');
      const name = { 3: '3', 23: '2 和 3', 35: '3 和 5', 235: '2、3、5', 25: '2 和 5' }[o.cond];
      const two = o.fill.length > 1;
      const known = o.digits.reduce((s, x, i) => (i === o.pos ? s : s + x), 0);
      const stp = [];
      if (o.cond.includes('5') || o.cond.includes('2')) stp.push(`看个位：${o.cond.includes('2') && o.cond.includes('5') ? '同时是 2 和 5 的倍数，个位只能是 0' : o.cond.includes('5') ? '5 的倍数个位是 0 或 5' : '2 的倍数个位是双数'}`);
      if (o.cond.includes('3')) stp.push(`看数字和：已知的数字加起来是 ${known}，□ 里的数加上 ${known} 要是 3 的倍数`);
      stp.push(`□ 里能填：${o.fill.join('、')}`);
      return {
        q: `${shown} 是 ${name} 的倍数，□ 里${two ? '最小填 {0}，最大填 {1}' : '只能填 {0}'}`,
        answer: two ? [num(o.fill[0], { label: '最小' }), num(o.fill[o.fill.length - 1], { label: '最大' })] : [num(o.fill[0])],
        steps: stp,
        hint: o.cond.includes('3') ? '先把已知的数字加起来' : '想一想个位能是几',
      };
    },
  },
  {
    id: 'g5b-fm-prime', grade: 5, term: 2, unit: U22, name: '质数和合数的判断',
    tip: '只有 1 和它本身两个因数的是质数；还有别的因数的是合数；1 既不是质数也不是合数', level: 1,
    gen(r) {
      if (r.bool()) {
        const n = r.chance(0.05) ? 1 : r.chance(0.45) ? r.pick(PRIMES100.filter((p) => p > 10)) : r.pick([...FAKE_PRIMES.filter((x) => x < 100), r.int(10, 99)]);
        const kind = n === 1 ? '既不是质数也不是合数' : isPrime(n) ? '质数' : '合数';
        const f = factors(n);
        return {
          q: `${n} 是{0}`,
          answer: [choice(['质数', '合数', '既不是质数也不是合数'], kind)],
          steps: [n === 1 ? '1 只有 1 个因数' : isPrime(n) ? `${n} 只有 1 和 ${n} 两个因数（用 2、3、5、7 试除都不能整除）` : `${n} = ${f[1]} × ${n / f[1]}，除了 1 和 ${n}，还有因数 ${f[1]}`, `所以 ${n} ${kind === '质数' || kind === '合数' ? '是' + kind : kind}`],
          hint: '用 2、3、5、7 试着去除',
        };
      }
      const p = r.pick(PRIMES100.filter((x) => x > 20));
      const others = r.sample(FAKE_PRIMES.filter((x) => x < 100), 3);
      const opts = r.shuffle([p, ...others]).map(String);
      return {
        q: `下面的数中，是质数的是{0}`,
        answer: [choice(opts, String(p))],
        steps: [...others.map((x) => `${x} = ${factors(x)[1]} × ${x / factors(x)[1]}，是合数`), `${p} 只有 1 和它本身两个因数，是质数`],
        hint: '个位是 1、3、7、9 的数不一定是质数，用 3、7 试除',
      };
    },
  },
  {
    id: 'g5b-fm-prime-reason', grade: 5, term: 2, unit: U22, name: '质数合数的推理',
    tip: '两个质数的和是奇数，其中一个一定是 2；记住最小的质数 2、最小的合数 4', level: 2,
    gen(r) {
      const k = r.int(0, 2);
      if (k === 0) {
        const q = r.pick(PRIMES100.filter((x) => x > 2 && x < 60));
        const s = q + 2, askProd = r.bool();
        return {
          q: `两个质数的和是 ${s}，这两个质数的${askProd ? '积' : '差'}是 {0}`,
          answer: [num(askProd ? 2 * q : q - 2)],
          steps: [`${s} 是奇数，奇数 = 奇数 + 偶数，所以两个质数里一定有一个是偶数`, '既是偶数又是质数的只有 2', `另一个是 ${s} − 2 = ${q}`, askProd ? `积：2 × ${q} = ${2 * q}` : `差：${q} − 2 = ${q - 2}`],
          hint: '两个数的和是奇数，说明一个奇数一个偶数',
        };
      }
      if (k === 1) {
        const N = r.int(10, 50), c = PRIMES100.filter((x) => x < N).length;
        return { q: `小于 ${N} 的质数有 {0} 个`, answer: [num(c)], steps: [`小于 ${N} 的质数：${PRIMES100.filter((x) => x < N).join('、')}`, `一共 ${c} 个`], hint: '从 2 开始一个一个找' };
      }
      const FACTS = [['最小的质数', 2], ['最小的合数', 4], ['最小的奇数', 1], ['最大的一位数质数', 7], ['最小的两位数质数', 11], ['最大的两位数质数', 97], ['最小的两位数合数', 10], ['最大的两位数合数', 99], ['最大的一位数合数', 9], ['最小的两位数奇数', 11]];
      const [[a, va], [b, vb]] = r.sample(FACTS, 2);
      const op = r.bool() ? '和' : '积';
      const v = op === '和' ? va + vb : va * vb;
      return { q: `${a}与${b}的${op}是 {0}`, answer: [num(v)], steps: [`${a}是 ${va}，${b}是 ${vb}`, `${op}：${va} ${op === '和' ? '+' : '×'} ${vb} = ${v}`], hint: '先分别想出这两个数' };
    },
  },
  {
    id: 'g5b-fm-parity', grade: 5, term: 2, unit: U22, name: '和、差、积的奇偶性',
    tip: '奇 ± 奇 = 偶，偶 ± 偶 = 偶，奇 ± 偶 = 奇；乘数里有偶数，积就是偶数', level: 1, speed: 10,
    gen(r) {
      const op = r.pick(['+', '−', '×']);
      let a = r.int(100, 999), b = r.int(10, 999);
      if (op === '−' && b > a) [a, b] = [b, a];
      const v = op === '+' ? a + b : op === '−' ? a - b : a * b;
      const pa = a % 2 ? '奇数' : '偶数', pb = b % 2 ? '奇数' : '偶数', pv = v % 2 ? '奇数' : '偶数';
      const rule = op === '×' ? (pv === '奇数' ? '奇数 × 奇数 = 奇数' : '乘数里有偶数，积是偶数') : `${pa} ${op} ${pb} = ${pv}`;
      return {
        q: `不计算，判断 ${a} ${op} ${b} 的结果是{0}`,
        answer: [choice(['奇数', '偶数'], pv)],
        steps: [`${a} 是${pa}，${b} 是${pb}（看个位）`, rule, `所以结果是${pv}`],
        hint: '只看两个数是奇数还是偶数',
      };
    },
  },
  {
    id: 'g5b-fm-parity-app', grade: 5, term: 2, unit: U22, name: '奇偶性的应用',
    tip: '翻杯子：翻奇数次和原来相反，翻偶数次和原来一样；连加看有几个奇数', level: 2,
    gen(r) {
      const k = r.int(0, 2);
      if (k === 0) {
        const n = r.int(7, 120), up = r.bool();
        const odd = n % 2 === 1, endUp = up !== odd;
        return {
          q: `一个杯子杯口${up ? '朝上' : '朝下'}放在桌上，翻动 ${n} 次后，杯口朝{0}`,
          answer: [choice(['上', '下'], endUp ? '上' : '下')],
          steps: ['翻 1 次和原来相反，翻 2 次又回到原来；翻奇数次和原来相反，翻偶数次和原来相同', `${n} 是${odd ? '奇数' : '偶数'}，所以杯口和原来${odd ? '相反' : '相同'}，朝${endUp ? '上' : '下'}`],
          hint: '翻 1 次、2 次、3 次分别朝哪？找规律',
        };
      }
      if (k === 1) {
        const n = r.int(7, 120), on = r.bool();
        const odd = n % 2 === 1, endOn = on !== odd;
        return {
          q: `一盏灯原来是${on ? '亮' : '灭'}的，按开关 ${n} 次后，灯是{0}的`,
          answer: [choice(['亮', '灭'], endOn ? '亮' : '灭')],
          steps: ['按 1 次状态改变，按 2 次又回到原来', `${n} 是${odd ? '奇数' : '偶数'}，所以和原来${odd ? '相反' : '相同'}：${endOn ? '亮' : '灭'}`],
          hint: '按奇数次和偶数次有什么不同？',
        };
      }
      const s = r.int(1, 2), n = r.int(10, 60);
      const terms = s === 1 ? n : n; // 连续自然数 s..s+n-1
      const last = s + terms - 1;
      let oddCount = 0; for (let i = s; i <= last; i++) if (i % 2) oddCount++;
      const sum = ((s + last) * terms) / 2, par = sum % 2 ? '奇数' : '偶数';
      return {
        q: `不计算，判断 ${s} + ${s + 1} + ${s + 2} + … + ${last} 的和是{0}`,
        answer: [choice(['奇数', '偶数'], par)],
        steps: [`和的奇偶只看里面有几个奇数：偶数个奇数相加得偶数，奇数个奇数相加得奇数`, `从 ${s} 到 ${last} 一共 ${terms} 个数，其中奇数有 ${oddCount} 个`, `${oddCount} 是${oddCount % 2 ? '奇数' : '偶数'}，所以和是${par}`],
        hint: '数一数里面有几个奇数',
      };
    },
  },
  {
    id: 'g5b-fm-pf', grade: 5, term: 2, unit: U22, name: '分解质因数',
    tip: '用短除法：从最小的质数 2 开始试除，一直除到商是质数为止', level: 1,
    gen(r) {
      const n = r.until(() => { const k = r.int(3, 4); return Array.from({ length: k }, () => r.pick([2, 2, 2, 3, 3, 5, 7, 11])).reduce((a, b) => a * b, 1); }, (v) => v >= 12 && v <= 300);
      const pf = primeFactors(n);
      return {
        q: `把 ${n} 分解质因数（从小到大写）：${n} = ${pf.map((_, i) => `{${i}}`).join(' × ')}`,
        answer: pf.map((p) => num(p)),
        steps: ['用短除法，从 2 开始用质数去除', shortDivPF(n), `${n} = ${pf.join(' × ')}`, '检查：每个因数都是质数，乘起来正好是 ' + n],
        hint: `先看 ${n} 能不能被 2 整除`,
      };
    },
  },
);

// ---------- 第 3 单元 长方体和正方体 ----------
const U23 = '长方体和正方体';
const cubFig = (l, w, h, u) => fig.cuboid(l, w, h, { labels: [`${fmt(l)}${u}`, `${fmt(w)}${u}`, `${fmt(h)}${u}`] });
const cubeFig = (a, u) => fig.cuboid(a, a, a, { labels: [`${fmt(a)}${u}`, '', ''] });

S.push(
  {
    id: 'g5b-cub-edges', grade: 5, term: 2, unit: U23, name: '棱长总和',
    tip: '长方体棱长总和 =（长 + 宽 + 高）× 4；正方体棱长总和 = 棱长 × 12', level: 1,
    gen(r) {
      const u = r.pick(['cm', 'dm', 'm']), U = LEN_U[u];
      if (r.chance(0.35)) {
        const a = r.chance(0.7) ? r.int(2, 30) : rdec(r, 1, 9.9, 1), v = fix(a * 12);
        if (u === 'm' && a > 12) return { q: '求这个正方体的棱长总和。', fig: cubeFig(a, 'cm'), answer: [num(v, { unit: '厘米' })], steps: ['正方体有 12 条棱，长度都相等', `${fmt(a)} × 12 = ${fmt(v)}（厘米）`], hint: '正方体有几条棱？' };
        return { q: '求这个正方体的棱长总和。', fig: cubeFig(a, u), answer: [num(v, { unit: U })], steps: ['正方体有 12 条棱，长度都相等', `${fmt(a)} × 12 = ${fmt(v)}（${U}）`], hint: '正方体有几条棱？' };
      }
      const l = r.int(5, 30), w = r.int(2, l - 1), h = r.int(2, 25), v = (l + w + h) * 4;
      const ctx = r.chance(0.4) && u !== 'm';
      return {
        q: ctx ? `用铁丝做一个长 ${l} ${U}、宽 ${w} ${U}、高 ${h} ${U}的长方体框架，至少需要铁丝多少${U}？` : '求这个长方体的棱长总和。',
        fig: cubFig(l, w, h, u),
        answer: [num(v, { unit: U })],
        steps: [ctx ? '做框架用的铁丝就是长方体的棱长总和' : '长方体的 12 条棱分成 3 组：4 条长、4 条宽、4 条高', `(${l} + ${w} + ${h}) × 4 = ${l + w + h} × 4 = ${v}（${U}）`],
        hint: '长、宽、高各有几条？',
      };
    },
  },
  {
    id: 'g5b-cub-edges-rev', grade: 5, term: 2, unit: U23, name: '已知棱长总和求棱长',
    tip: '长方体：棱长总和 ÷ 4 = 长 + 宽 + 高；正方体：棱长总和 ÷ 12 = 棱长', level: 2,
    gen(r) {
      if (r.chance(0.35)) {
        const a = r.int(2, 25), S0 = a * 12;
        const extra = r.bool();
        return extra
          ? { q: `一个正方体的棱长总和是 ${S0} 厘米，它的表面积是多少平方厘米？`, answer: [num(6 * a * a, { unit: '平方厘米' })], steps: [`棱长：${S0} ÷ 12 = ${a}（厘米）`, `表面积：${a} × ${a} × 6 = ${6 * a * a}（平方厘米）`], hint: '先求棱长' }
          : { q: `一个正方体的棱长总和是 ${S0} 厘米，它的棱长是多少厘米？`, answer: [num(a, { unit: '厘米' })], steps: ['正方体 12 条棱一样长', `${S0} ÷ 12 = ${a}（厘米）`] };
      }
      const l = r.int(6, 30), w = r.int(3, l - 1), h = r.int(2, 25), S0 = (l + w + h) * 4;
      return {
        q: `一个长方体的棱长总和是 ${S0} 厘米，长 ${l} 厘米，宽 ${w} 厘米，高是多少厘米？`,
        answer: [num(h, { unit: '厘米' })],
        steps: [`棱长总和 ÷ 4 = 长 + 宽 + 高：${S0} ÷ 4 = ${S0 / 4}（厘米）`, `高：${S0 / 4} − ${l} − ${w} = ${h}（厘米）`, `易错：不能直接用 ${S0} − ${l} − ${w}`],
        hint: '先求一组长、宽、高的和',
      };
    },
  },
  {
    id: 'g5b-cub-surface', grade: 5, term: 2, unit: U23, name: '表面积',
    tip: '长方体表面积 =（长×宽 + 长×高 + 宽×高）× 2；正方体表面积 = 棱长 × 棱长 × 6', level: 1,
    gen(r) {
      const u = r.pick(['cm', 'dm', 'm']), A = AREA_U[u];
      if (r.chance(0.3)) {
        const a = r.chance(0.75) ? r.int(2, 20) : rdec(r, 1.2, 5, 1), f1 = fix(a * a), v = fix(f1 * 6);
        return { q: '求这个正方体的表面积。', fig: cubeFig(a, u), answer: [num(v, { unit: A })], steps: ['正方体 6 个面都是一样的正方形', `一个面：${fmt(a)} × ${fmt(a)} = ${fmt(f1)}（${A}）`, `6 个面：${fmt(f1)} × 6 = ${fmt(v)}（${A}）`], hint: '先算一个面' };
      }
      const l = r.int(4, 20), w = r.int(2, l - 1), h = r.int(2, 18);
      const a1 = l * w, a2 = l * h, a3 = w * h, v = 2 * (a1 + a2 + a3);
      return {
        q: '求这个长方体的表面积。',
        fig: cubFig(l, w, h, u),
        answer: [num(v, { unit: A })],
        steps: ['长方体相对的面完全相同，6 个面分成 3 组', `上下面：${l} × ${w} = ${a1}；前后面：${l} × ${h} = ${a2}；左右面：${w} × ${h} = ${a3}`, `表面积：(${a1} + ${a2} + ${a3}) × 2 = ${v}（${A}）`],
        hint: '三组面各是多少？别忘了乘 2',
      };
    },
  },
  {
    id: 'g5b-cub-volume', grade: 5, term: 2, unit: U23, name: '体积',
    tip: '长方体体积 = 长 × 宽 × 高 = 底面积 × 高；正方体体积 = 棱长 × 棱长 × 棱长', level: 1,
    gen(r) {
      const u = r.pick(['cm', 'dm', 'm']), V = { cm: '立方厘米', dm: '立方分米', m: '立方米' }[u];
      const k = r.int(0, 3);
      if (k === 0) {
        const a = r.chance(0.75) ? r.int(2, 12) : rdec(r, 0.2, 2.5, 1), v = fix(a * a * a);
        return { q: '求这个正方体的体积。', fig: cubeFig(a, u), answer: [num(v, { unit: V })], steps: ['正方体体积 = 棱长 × 棱长 × 棱长', `${fmt(a)} × ${fmt(a)} × ${fmt(a)} = ${fmt(v)}（${V}）`], hint: '三个棱长相乘' };
      }
      if (k === 1) {
        const Sb = r.int(12, 120), h = r.int(3, 25), v = Sb * h;
        return { q: `一个长方体的底面积是 ${Sb} ${AREA_U[u]}，高是 ${h} ${LEN_U[u]}，它的体积是多少${V}？`, answer: [num(v, { unit: V })], steps: ['长方体体积 = 底面积 × 高', `${Sb} × ${h} = ${v}（${V}）`] };
      }
      const l = r.int(3, 20), w = r.int(2, 15), h = r.chance(0.7) ? r.int(2, 15) : rdec(r, 1.5, 9.5, 1), v = fix(l * w * h);
      return { q: '求这个长方体的体积。', fig: cubFig(l, w, h, u), answer: [num(v, { unit: V })], steps: ['长方体体积 = 长 × 宽 × 高', `${l} × ${w} × ${fmt(h)} = ${fmt(v)}（${V}）`], hint: '长、宽、高相乘' };
    },
  },
  {
    id: 'g5b-cub-units', grade: 5, term: 2, unit: U23, name: '体积和容积单位换算',
    tip: '相邻两个体积单位之间的进率是 1000；1 立方分米 = 1 升，1 立方厘米 = 1 毫升', level: 1,
    gen(r) {
      const PAIRS = [['立方米', '立方分米', 1000], ['立方分米', '立方厘米', 1000], ['升', '毫升', 1000], ['立方米', '升', 1000], ['立方分米', '毫升', 1000], ['升', '立方厘米', 1000]];
      const SAME = [['立方分米', '升'], ['立方厘米', '毫升'], ['升', '立方分米'], ['毫升', '立方厘米']];
      const k = r.int(0, 4);
      if (k === 3) {
        const [a, b] = r.pick(SAME), x = r.chance(0.5) ? r.int(2, 900) : rdec(r, 0.2, 50, r.int(1, 2));
        return { q: `${fmt(x)} ${a} = {0} ${b}`, answer: [num(x)], steps: [`1 ${a} = 1 ${b}，数不变`, `${fmt(x)} ${a} = ${fmt(x)} ${b}`] };
      }
      const [big, small, rate] = r.pick(PAIRS);
      if (k === 0) { // 高级 → 低级
        const x = r.chance(0.6) ? rdec(r, 0.01, 9.9, r.int(1, 3)) : r.int(2, 30), v = fix(x * rate);
        return { q: `${fmt(x)} ${big} = {0} ${small}`, answer: [num(v)], steps: [`1 ${big} = ${rate} ${small}，大单位化小单位，乘进率 ${rate}`, `${fmt(x)} × ${rate} = ${fmt(v)}，小数点向右移动三位`] };
      }
      if (k === 1) { // 低级 → 高级
        const v = r.chance(0.6) ? r.int(20, 9900) : r.step(1000, 30000, 100), x = fix(v / rate);
        return { q: `${v} ${small} = {0} ${big}`, answer: [num(x)], steps: [`1 ${big} = ${rate} ${small}，小单位化大单位，除以进率 ${rate}`, `${v} ÷ ${rate} = ${fmt(x)}，小数点向左移动三位`] };
      }
      if (k === 2) { // 复名数 → 单名数
        const a = r.int(1, 9), b = r.int(1, 999), x = fix(a + b / rate);
        return { q: `${a} ${big} ${b} ${small} = {0} ${big}`, answer: [num(x)], steps: [`先把 ${b} ${small} 化成 ${big}：${b} ÷ ${rate} = ${fmt(fix(b / rate))}`, `${a} + ${fmt(fix(b / rate))} = ${fmt(x)}（${big}）`, ...(b < 100 ? [`注意：${b} ${small}化成${big}时，小数点后要用 0 占位`] : [])] };
      }
      const a = r.int(1, 9), b = r.int(1, 999), x = fix(a + b / rate);
      return { q: `${fmt(x)} ${big} = {0} ${big} {1} ${small}`, answer: [num(a), num(b)], steps: [`整数部分是 ${a} ${big}`, `小数部分 ${fmt(fix(b / rate))} ${big} 化成 ${small}：${fmt(fix(b / rate))} × ${rate} = ${b}`, `所以是 ${a} ${big} ${b} ${small}`] };
    },
  },
  {
    id: 'g5b-cub-open', grade: 5, term: 2, unit: U23, name: '无盖、少面的表面积', process: true,
    tip: '先想清楚有哪几个面：无盖少一个上面，通风管没有上下两个面', level: 2,
    gen(r) {
      const t = r.pick([
        () => { const l = r.int(4, 10), w = r.int(2, l - 1), h = r.int(3, 8); const v = l * w + 2 * (l * h + w * h); return { q: `做一个长 ${l} 分米、宽 ${w} 分米、高 ${h} 分米的无盖玻璃鱼缸，至少需要玻璃多少平方分米？`, v, u: '平方分米', st: ['无盖鱼缸只有 5 个面：1 个底面 + 前后 2 个面 + 左右 2 个面', `底面：${l} × ${w} = ${l * w}`, `前后：${l} × ${h} × 2 = ${2 * l * h}，左右：${w} × ${h} × 2 = ${2 * w * h}`, `合计：${l * w} + ${2 * l * h} + ${2 * w * h} = ${v}（平方分米）`], say: `至少需要玻璃 ${v} 平方分米` }; },
        () => { const a = r.int(2, 6), L = r.step(60, 300, 20), aw = a * 10; const v = 4 * aw * L; return { q: `一根长方体通风管长 ${L} 厘米，横截面是边长 ${aw} 厘米的正方形。做这样一根通风管至少需要铁皮多少平方厘米？`, v, u: '平方厘米', st: ['通风管两头是空的，只有 4 个侧面，每个侧面是长 ' + L + ' 厘米、宽 ' + aw + ' 厘米的长方形', `${L} × ${aw} × 4 = ${v}（平方厘米）`], say: `至少需要铁皮 ${v} 平方厘米` }; },
        () => { const l = r.int(20, 50), w = r.int(10, 25), h = r.int(2, 3); const v = l * w + 2 * (l * h + w * h); return { q: `一个长方体游泳池长 ${l} 米，宽 ${w} 米，深 ${h} 米。在池底和四周贴瓷砖，贴瓷砖的面积是多少平方米？`, v, u: '平方米', st: ['游泳池没有上面，要贴池底和四周 5 个面', `池底：${l} × ${w} = ${l * w}`, `四周：(${l} × ${h} + ${w} × ${h}) × 2 = ${2 * (l * h + w * h)}`, `合计：${l * w} + ${2 * (l * h + w * h)} = ${v}（平方米）`], say: `贴瓷砖的面积是 ${v} 平方米` }; },
        () => { const l = r.int(7, 10), w = r.int(5, 7), h = r.int(3, 4), door = rdec(r, 3, 8, 1); const walls = l * w + 2 * (l * h + w * h), v = fix(walls - door); return { q: `一间教室长 ${l} 米，宽 ${w} 米，高 ${h} 米。要粉刷教室的四面墙壁和屋顶，扣除门窗面积 ${fmt(door)} 平方米，粉刷的面积是多少平方米？`, v, u: '平方米', st: ['地面不刷，要刷屋顶和四面墙：5 个面', `屋顶：${l} × ${w} = ${l * w}，四面墙：(${l} × ${h} + ${w} × ${h}) × 2 = ${2 * (l * h + w * h)}`, `5 个面合计 ${walls}，再减去门窗：${walls} − ${fmt(door)} = ${fmt(v)}（平方米）`], say: `粉刷的面积是 ${fmt(v)} 平方米` }; },
        () => { const a = r.int(2, 9); const v = 5 * a * a; return { q: `用铁皮做一个棱长 ${a} 分米的无盖正方体水箱，至少需要铁皮多少平方分米？`, v, u: '平方分米', st: ['无盖正方体水箱有 5 个面', `${a} × ${a} × 5 = ${v}（平方分米）`], say: `至少需要铁皮 ${v} 平方分米` }; },
      ])();
      return { q: t.q, answer: [num(t.v, { unit: t.u })], steps: [...t.st, `答：${t.say}。`], hint: '先数一数要算几个面，是哪几个面' };
    },
  },
  {
    id: 'g5b-cub-displace', grade: 5, term: 2, unit: U23, name: '排水法求体积', process: true,
    tip: '物体的体积 = 水面上升的那部分水的体积 = 容器底面积 × 水面上升的高度', level: 2,
    gen(r) {
      const t = r.pick(['stone', 'stone', 'rise', 'cube']);
      if (t === 'rise') {
        const l = r.int(10, 30), w = r.int(8, 20), rise = rdec(r, 0.5, 4, 1), V = fix(l * w * rise);
        return { q: `一个长方体玻璃缸，从里面量长 ${l} 厘米、宽 ${w} 厘米，缸里有水。把一个体积是 ${fmt(V)} 立方厘米的铁块完全浸入水中（水没有溢出），水面会上升多少厘米？`, answer: [num(rise, { unit: '厘米' })], steps: ['铁块的体积 = 上升的水的体积 = 底面积 × 上升的高度', `底面积：${l} × ${w} = ${l * w}（平方厘米）`, `上升：${fmt(V)} ÷ ${l * w} = ${fmt(rise)}（厘米）`, `答：水面上升 ${fmt(rise)} 厘米。`] };
      }
      if (t === 'cube') {
        const a = r.pick([10, 12, 15, 20]), h1 = r.int(4, 8), d = rdec(r, 0.5, 3, 1), V = fix(a * a * d);
        return { q: `一个正方体玻璃容器，从里面量棱长 ${a} 厘米，里面的水深 ${h1} 厘米。放入一块石头（完全浸没）后，水深变为 ${fmt(fix(h1 + d))} 厘米。这块石头的体积是多少立方厘米？`, answer: [num(V, { unit: '立方厘米' })], steps: ['石头的体积 = 上升的水的体积', `水面上升：${fmt(fix(h1 + d))} − ${h1} = ${fmt(d)}（厘米）`, `${a} × ${a} × ${fmt(d)} = ${fmt(V)}（立方厘米）`, `答：石头的体积是 ${fmt(V)} 立方厘米。`] };
      }
      const l = r.int(15, 40), w = r.int(10, 25), h1 = r.int(5, 15), d = r.chance(0.6) ? r.int(1, 5) : rdec(r, 0.5, 4.5, 1), V = fix(l * w * d);
      const ml = r.chance(0.3) && Number.isInteger(V) && V % 10 === 0;
      return {
        q: `一个长方体水槽，从里面量长 ${l} 厘米、宽 ${w} 厘米，水深 ${h1} 厘米。把一块石头放进去（完全浸没在水中），水面升到 ${fmt(fix(h1 + d))} 厘米。这块石头的体积是多少${ml ? '立方分米' : '立方厘米'}？`,
        answer: [num(ml ? fix(V / 1000) : V, { unit: ml ? '立方分米' : '立方厘米' })],
        steps: ['石头的体积 = 上升的水的体积 = 水槽底面积 × 水面上升的高度', `水面上升：${fmt(fix(h1 + d))} − ${h1} = ${fmt(d)}（厘米）`, `${l} × ${w} × ${fmt(d)} = ${fmt(V)}（立方厘米）`, ...(ml ? [`${fmt(V)} 立方厘米 = ${fmt(fix(V / 1000))} 立方分米`] : []), `答：石头的体积是 ${ml ? fmt(fix(V / 1000)) + ' 立方分米' : fmt(V) + ' 立方厘米'}。`],
        hint: '用的高是水面上升的高度，不是水深',
      };
    },
  },
  {
    id: 'g5b-cub-cutjoin', grade: 5, term: 2, unit: U23, name: '切拼后表面积的变化', process: true,
    tip: '拼起来：每接触一次少 2 个面；切开：每切一刀多 2 个面', level: 2,
    gen(r) {
      const k = r.int(0, 3);
      if (k === 0) {
        const a = r.int(2, 10), n = r.int(2, 5), whole = (4 * n + 2) * a * a, lost = 2 * (n - 1) * a * a;
        const ask = r.bool();
        return {
          q: `把 ${n} 个棱长是 ${a} 厘米的正方体拼成一个长方体，${ask ? '拼成的长方体的表面积是多少平方厘米' : '表面积比原来 ' + n + ' 个正方体的表面积之和减少了多少平方厘米'}？`,
          answer: [num(ask ? whole : lost, { unit: '平方厘米' })],
          steps: [`一个面的面积：${a} × ${a} = ${a * a}（平方厘米）`, `${n} 个正方体排成一排，有 ${n - 1} 个接触处，每处少 2 个面，一共少 ${2 * (n - 1)} 个面`, ask ? `原来共 ${6 * n} 个面，剩下 ${6 * n} − ${2 * (n - 1)} = ${4 * n + 2} 个面：${4 * n + 2} × ${a * a} = ${whole}（平方厘米）` : `减少：${2 * (n - 1)} × ${a * a} = ${lost}（平方厘米）`],
          hint: '拼在一起时，接触的面就看不到了',
        };
      }
      if (k === 1) {
        const l = r.int(6, 20), w = r.int(3, 10), h = r.int(3, 10);
        const dir = r.pick(['l', 'w', 'h']);
        const sec = dir === 'l' ? w * h : dir === 'w' ? l * h : l * w;
        const how = dir === 'l' ? '平行于左右两个面' : dir === 'w' ? '平行于前后两个面' : '平行于上下两个面';
        return {
          q: `一个长方体木块长 ${l} 厘米、宽 ${w} 厘米、高 ${h} 厘米，沿${how}的方向把它切成两个小长方体。表面积增加了多少平方厘米？`,
          answer: [num(2 * sec, { unit: '平方厘米' })],
          steps: [`切一刀多出 2 个截面，截面和${how.slice(3)}一样大`, `截面：${dir === 'l' ? `${w} × ${h}` : dir === 'w' ? `${l} × ${h}` : `${l} × ${w}`} = ${sec}（平方厘米）`, `增加：${sec} × 2 = ${2 * sec}（平方厘米）`],
          hint: '切一刀会多出几个面？',
        };
      }
      if (k === 2) {
        const a = r.pick([2, 4, 6, 8, 10]), half = a / 2, orig = 6 * a * a, after = 8 * 6 * half * half;
        return {
          q: `把一个棱长 ${a} 厘米的正方体切成 8 个同样大的小正方体，表面积增加了多少平方厘米？`,
          answer: [num(after - orig, { unit: '平方厘米' })],
          steps: [`切成 8 个小正方体要切 3 刀，每刀多 2 个大正方形面，一共多 6 个 ${a} × ${a} 的面`, `${a} × ${a} × 6 = ${6 * a * a}（平方厘米）`, `验算：小正方体棱长 ${half} 厘米，8 个的表面积 ${half} × ${half} × 6 × 8 = ${after}，比原来 ${orig} 多 ${after - orig}`],
          hint: '切成 8 个要切几刀？',
        };
      }
      const a = r.int(2, 12), dS = 2 * a * a;
      return {
        q: `两个棱长都是 ${a} 分米的正方体拼成一个长方体，拼成的长方体的表面积比两个正方体表面积之和减少了多少平方分米？`,
        answer: [num(dS, { unit: '平方分米' })],
        steps: ['两个正方体拼在一起，接触的 2 个面看不到了', `${a} × ${a} × 2 = ${dS}（平方分米）`],
        hint: '拼的时候有几个面被藏起来了？',
      };
    },
  },
  {
    id: 'g5b-cub-height', grade: 5, term: 2, unit: U23, name: '已知体积求高（等积变形）', process: true,
    tip: '高 = 体积 ÷ 底面积；把物体熔铸、把水倒进别的容器，体积不变', level: 2,
    gen(r) {
      const k = r.int(0, 2);
      if (k === 0) {
        const l = r.int(4, 20), w = r.int(3, 12), h = r.int(2, 15), V = l * w * h;
        return { q: `一个长方体的体积是 ${V} 立方厘米，长 ${l} 厘米，宽 ${w} 厘米，高是多少厘米？`, answer: [num(h, { unit: '厘米' })], steps: ['高 = 体积 ÷（长 × 宽）', `底面积：${l} × ${w} = ${l * w}（平方厘米）`, `高：${V} ÷ ${l * w} = ${h}（厘米）`] };
      }
      if (k === 1) {
        const a = r.pick([4, 6, 8, 10, 12]), V = a ** 3;
        const cands = [];
        for (let l = 8; l <= 40; l++) for (let w = 2; w < l; w++) if (V % (l * w) === 0 && V / (l * w) >= 1 && !(l === a && w === a)) cands.push({ l, w, h: V / (l * w) });
        const { l, w, h } = r.pick(cands);
        return { q: `把一块棱长 ${a} 厘米的正方体钢坯，锻造成一个长 ${l} 厘米、宽 ${w} 厘米的长方体钢材，钢材的高是多少厘米？`, answer: [num(h, { unit: '厘米' })], steps: ['锻造前后形状变了，体积不变', `钢坯的体积：${a} × ${a} × ${a} = ${V}（立方厘米）`, `高：${V} ÷ (${l} × ${w}) = ${V} ÷ ${l * w} = ${h}（厘米）`, `答：钢材的高是 ${h} 厘米。`] };
      }
      const cand = (V, base) => { const out = []; for (let a2 = 10; a2 <= 40; a2++) for (let b2 = 8; b2 <= 30 && b2 <= a2; b2++) { const h2 = fix(V / (a2 * b2)); if (decimals(h2) <= 1 && h2 >= 2 && h2 <= 60 && a2 * b2 !== base) out.push({ a2, b2, h2 }); } return out; };
      const { a1, b1, h1, V, list } = r.until(() => { const a1 = r.int(10, 30), b1 = r.int(8, 20), h1 = r.int(5, 20), V = a1 * b1 * h1; return { a1, b1, h1, V, list: cand(V, a1 * b1) }; }, (x) => x.list.length > 0);
      const o = r.pick(list);
      return { q: `甲水箱从里面量长 ${a1} 厘米、宽 ${b1} 厘米，水深 ${h1} 厘米。把这些水全部倒入从里面量长 ${o.a2} 厘米、宽 ${o.b2} 厘米的乙水箱（水不溢出），乙水箱里的水深是多少厘米？`, answer: [num(fix(o.h2), { unit: '厘米' })], steps: ['水从一个容器倒进另一个容器，体积不变', `水的体积：${a1} × ${b1} × ${h1} = ${V}（立方厘米）`, `乙水箱水深：${V} ÷ (${o.a2} × ${o.b2}) = ${V} ÷ ${o.a2 * o.b2} = ${fmt(fix(o.h2))}（厘米）`, `答：水深 ${fmt(fix(o.h2))} 厘米。`] };
    },
  },
  {
    id: 'g5b-cub-scale', grade: 5, term: 2, unit: U23, name: '棱长扩大后的变化', pool: 15,
    tip: '棱长扩大到原来的 n 倍：棱长总和扩大 n 倍，表面积扩大 n×n 倍，体积扩大 n×n×n 倍', level: 2,
    gen(r) {
      const n = r.int(2, 6), what = r.pick(['棱长总和', '表面积', '体积']);
      const v = what === '棱长总和' ? n : what === '表面积' ? n * n : n * n * n;
      return {
        q: `一个正方体的棱长扩大到原来的 ${n} 倍，它的${what}扩大到原来的 {0} 倍`,
        answer: [num(v)],
        steps: [`设原来棱长是 1，现在是 ${n}`, what === '棱长总和' ? `棱长总和：原来 12，现在 ${n} × 12，是原来的 ${n} 倍` : what === '表面积' ? `表面积：原来 1 × 1 × 6，现在 ${n} × ${n} × 6，是原来的 ${n} × ${n} = ${v} 倍` : `体积：原来 1 × 1 × 1，现在 ${n} × ${n} × ${n}，是原来的 ${v} 倍`],
        hint: '设原来的棱长是 1，算一算',
      };
    },
  },
  {
    id: 'g5b-cub-word', grade: 5, term: 2, unit: U23, name: '体积和容积的实际问题', process: true,
    tip: '先分清求的是表面积还是体积（容积），再注意单位：1 立方分米 = 1 升', level: 1,
    gen(r) {
      const t = r.pick([
        () => { const l = r.int(5, 12), w = r.int(3, 8), h = r.int(3, 10), V = l * w * h; return { q: `一个长方体水箱，从里面量长 ${l} 分米、宽 ${w} 分米、高 ${h} 分米。这个水箱最多能装水多少升？`, v: V, u: '升', st: ['求水箱能装多少水，就是求容积', `${l} × ${w} × ${h} = ${V}（立方分米）`, `${V} 立方分米 = ${V} 升`], say: `最多能装水 ${V} 升` }; },
        () => { const l = r.int(4, 8), w = r.int(2, 4), d = rdec(r, 0.2, 0.5, 1), V = fix(l * w * d); return { q: `学校要在一个长 ${l} 米、宽 ${w} 米的沙坑里铺 ${fmt(d)} 米厚的沙子，需要沙子多少立方米？`, v: V, u: '立方米', st: ['铺的沙子是一个长方体，厚度就是高', `${l} × ${w} × ${fmt(d)} = ${fmt(V)}（立方米）`], say: `需要沙子 ${fmt(V)} 立方米` }; },
        () => { const l = r.int(20, 60), w = r.int(10, 30), h = r.int(1, 3), V = l * w * h; return { q: `挖一个长 ${l} 米、宽 ${w} 米、深 ${h} 米的长方体水池，要挖出多少立方米的土？`, v: V, u: '立方米', st: ['挖出的土的体积就是水池的体积', `${l} × ${w} × ${h} = ${V}（立方米）`], say: `要挖出 ${V} 立方米的土` }; },
        () => { const a = r.int(3, 9), n = r.int(10, 40), V = a * a * a * n; return { q: `一盒正方体积木，每块的棱长是 ${a} 厘米，一共 ${n} 块。这盒积木的总体积是多少立方厘米？`, v: V, u: '立方厘米', st: [`每块：${a} × ${a} × ${a} = ${a * a * a}（立方厘米）`, `${n} 块：${a * a * a} × ${n} = ${V}（立方厘米）`], say: `总体积是 ${V} 立方厘米` }; },
        () => { const l = r.step(30, 60, 10), w = r.step(20, 35, 5), h = r.int(10, 30), V = l * w * h, L = fix(V / 1000); return { q: `一个长方体鱼缸，从里面量长 ${l} 厘米、宽 ${w} 厘米，向里面注入 ${h} 厘米深的水。注入了多少升水？`, v: L, u: '升', st: ['水的形状是长方体，高是水深', `${l} × ${w} × ${h} = ${V}（立方厘米）`, `${V} 立方厘米 = ${fmt(L)} 立方分米 = ${fmt(L)} 升`], say: `注入了 ${fmt(L)} 升水` }; },
      ])();
      return { q: t.q, answer: [num(t.v, { unit: t.u })], steps: [...t.st, `答：${t.say}。`] };
    },
  },
);

// ---------- 第 4 单元 分数的意义和性质 ----------
const U24 = '分数的意义和性质';
/** 生成最简分数 n/d（d 在 [dlo, dhi]，proper 时 n < d） */
function rfrac(r, dlo, dhi, { proper = true, maxN } = {}) {
  return r.until(() => { const d = r.int(dlo, dhi); const n = proper ? r.int(1, d - 1) : r.int(1, maxN || 3 * d); return [n, d]; }, ([n, d]) => gcd(n, d) === 1 && (proper || n !== d));
}
/** 约分说明：n/d → 最简（已经最简就返回空数组） */
function reduceSteps(n, d) {
  const g = gcd(n, d);
  if (g === 1) return [];
  const [a, b] = [n / g, d / g];
  return [`约分：分子、分母同时除以 ${g}，${frac(n, d)} = ${b === 1 ? a : frac(a, b)}`];
}

S.push(
  {
    id: 'g5b-fr-div', grade: 5, term: 2, unit: U24, name: '分数与除法的关系',
    tip: '被除数 ÷ 除数 = 被除数作分子、除数作分母的分数（除数不能是 0）', level: 1, speed: 10,
    gen(r) {
      const k = r.int(0, 2);
      if (k === 0) {
        const [a, b] = r.until(() => [r.int(1, 15), r.int(2, 20)], ([a, b]) => a !== b && a % b !== 0);
        return {
          q: `${a} ÷ ${b} = {0}（填分数）`,
          answer: [fansM(a, b)],
          steps: [`被除数作分子，除数作分母：${a} ÷ ${b} = ${frac(a, b)}`, ...reduceSteps(a, b), ...(simplify(a, b)[0] > simplify(a, b)[1] ? [`也可以写成带分数：${FM(a, b)}`] : [])],
          hint: '谁作分子？谁作分母？',
        };
      }
      const [n, d] = rfrac(r, 3, 12), m = r.int(1, 4);
      if (k === 1) return { q: `${frac(n, d)} = {0} ÷ ${d * m}`, answer: [num(n * m)], steps: [`${frac(n, d)} = ${n} ÷ ${d}`, ...(m > 1 ? [`除数 ${d} 乘 ${m} 变成 ${d * m}，被除数也要乘 ${m}（商不变）：${n} × ${m} = ${n * m}`] : [])], hint: '分子相当于被除数，分母相当于除数' };
      return { q: `${frac(n, d)} = ${n * m} ÷ {0}`, answer: [num(d * m)], steps: [`${frac(n, d)} = ${n} ÷ ${d}`, ...(m > 1 ? [`被除数 ${n} 乘 ${m} 变成 ${n * m}，除数也要乘 ${m}：${d} × ${m} = ${d * m}`] : [])], hint: '分子相当于被除数，分母相当于除数' };
    },
  },
  {
    id: 'g5b-fr-unitconv', grade: 5, term: 2, unit: U24, name: '用分数表示单位换算',
    tip: '小单位化大单位：小单位的数 ÷ 进率，写成分数再约分', level: 1,
    gen(r) {
      const [small, big, rate] = r.pick([['分', '时', 60], ['秒', '分', 60], ['时', '日', 24], ['克', '千克', 1000], ['千克', '吨', 1000], ['厘米', '米', 100], ['分米', '米', 10], ['毫米', '厘米', 10], ['平方分米', '平方米', 100], ['个月', '年', 12], ['毫升', '升', 1000], ['平方厘米', '平方分米', 100]]);
      const qs = factors(rate).filter((x) => x > 1 && x <= 50);
      const q = r.pick(qs), k = r.until(() => r.int(1, q - 1), (v) => gcd(v, q) === 1), x = (rate * k) / q;
      return {
        q: `${x} ${small} = {0} ${big}`,
        answer: [fans(x, rate)],
        steps: [`1 ${big} = ${rate} ${small}，${x} ${small}就是 ${x} ÷ ${rate} ${big}`, `${x} ÷ ${rate} = ${frac(x, rate)}${gcd(x, rate) > 1 ? ` = ${frac(k, q)}` : ''}（${big}）`],
        hint: `1 ${big}等于多少${small}？`,
      };
    },
  },
  {
    id: 'g5b-fr-partof', grade: 5, term: 2, unit: U24, name: '求一个数是另一个数的几分之几', process: true,
    tip: '求 A 是 B 的几分之几，用 A ÷ B，结果写成最简分数', level: 1,
    gen(r) {
      const nm = r.name();
      const t = r.pick([
        () => { const m = r.int(15, 28), f = r.int(15, 28); const askBoy = r.bool(); return { q: `五（1）班有男生 ${m} 人，女生 ${f} 人。${askBoy ? '男' : '女'}生人数占全班人数的几分之几？`, A: askBoy ? m : f, B: m + f, ex: `${askBoy ? m : f} ÷ (${m} + ${f})`, rel: `${askBoy ? '男' : '女'}生人数 ÷ 全班人数`, say: `${askBoy ? '男' : '女'}生人数占全班人数的` }; },
        () => { const m = r.int(16, 30), f = r.int(10, m - 1); return { q: `兴趣小组有男生 ${m} 人，女生 ${f} 人。女生人数是男生人数的几分之几？`, A: f, B: m, ex: `${f} ÷ ${m}`, rel: '女生人数 ÷ 男生人数', say: '女生人数是男生人数的' }; },
        () => { const h = r.int(7, 10); return { q: `${nm}每天睡眠 ${h} 小时，睡眠时间占一天的几分之几？`, A: h, B: 24, ex: `${h} ÷ 24`, rel: '睡眠时间 ÷ 一天的时间（24 小时）', say: '睡眠时间占一天的' }; },
        () => { const N = r.step(80, 240, 10), k = r.int(15, N - 10); return { q: `一本书有 ${N} 页，${nm}已经看了 ${k} 页。看了的页数占全书的几分之几？`, A: k, B: N, ex: `${k} ÷ ${N}`, rel: '看了的页数 ÷ 全书页数', say: '看了的页数占全书的' }; },
        () => { const a = r.int(3, 20), b = r.int(a + 1, 40); return { q: `一根绳子长 ${b} 米，剪下 ${a} 米。剪下的部分是全长的几分之几？`, A: a, B: b, ex: `${a} ÷ ${b}`, rel: '剪下的长度 ÷ 全长', say: '剪下的部分是全长的' }; },
        () => { const t = r.int(10, 30), w = r.int(t + 1, 50); return { q: `一个果园有桃树 ${t} 棵，苹果树 ${w} 棵。桃树的棵数是苹果树的几分之几？`, A: t, B: w, ex: `${t} ÷ ${w}`, rel: '桃树的棵数 ÷ 苹果树的棵数', say: '桃树的棵数是苹果树的' }; },
      ])();
      const [a, b] = simplify(t.A, t.B);
      return {
        q: t.q,
        answer: [fans(t.A, t.B)],
        steps: [`求一个数是另一个数的几分之几，用除法：${t.rel}`, `${t.ex} = ${frac(t.A, t.B)}`, ...reduceSteps(t.A, t.B), `答：${t.say} ${b === 1 ? a : frac(a, b)}。`],
        hint: '谁是“另一个数”（作分母）？',
      };
    },
  },
  {
    id: 'g5b-fr-meaning', grade: 5, term: 2, unit: U24, name: '分数的意义（量与分率）',
    tip: '“每段长几米”是具体的量，用总长 ÷ 段数；“每段是全长的几分之几”看平均分成几份，与总长无关', level: 2,
    gen(r) {
      const [a, b] = r.until(() => [r.int(1, 9), r.int(2, 12)], ([a, b]) => a !== b && a % b !== 0);
      const t = r.pick([
        { q: `把 ${a} 米长的绳子平均分成 ${b} 段，每段长 {0} 米，每段是全长的 {1}`, u: '米', who: '全长' },
        { q: `把 ${a} 块饼平均分给 ${b} 个人，每人分得 {0} 块，每人分得这些饼的 {1}`, u: '块', who: '这些饼' },
        { q: `把 ${a} 千克油平均装在 ${b} 个瓶子里，每瓶装 {0} 千克，每瓶装的是这些油的 {1}`, u: '千克', who: '这些油' },
        { q: `把 ${a} 吨货物平均分 ${b} 次运完，每次运 {0} 吨，每次运的是这批货物的 {1}`, u: '吨', who: '这批货物' },
      ]);
      return {
        q: t.q,
        answer: [fansM(a, b, { unit: t.u }), fans(1, b)],
        steps: [`求每份是多少${t.u}（具体的量）：${a} ÷ ${b} = ${FM(a, b)}（${t.u}）`, `求每份是${t.who}的几分之几：把${t.who}看作单位“1”，平均分成 ${b} 份，每份是 ${frac(1, b)}，不带单位`, `注意：第二个空和 ${a} 无关，只看平均分成几份`],
        hint: '一个带单位，一个不带单位',
      };
    },
  },
  {
    id: 'g5b-fr-unitfrac', grade: 5, term: 2, unit: U24, name: '分数单位',
    tip: '分母是几，分数单位就是几分之一；分子是几，就有几个这样的分数单位', level: 2,
    gen(r) {
      const [n, d] = rfrac(r, 3, 12, { proper: r.chance(0.7) });
      const target = r.pick([['1', 1], ['最小的质数', 2], ['最小的合数', 4], ['2', 2], ['3', 3]].filter(([, v]) => v * d > n));
      const add = target[1] * d - n, isNum = /^\d+$/.test(target[0]);
      const shown = n > d && r.bool() ? FM(n, d) : frac(n, d);
      return {
        q: `${shown} 的分数单位是 {0}，它有 {1} 个这样的分数单位，再添上 {2} 个这样的分数单位就是${isNum ? ' ' : ''}${target[0]}`,
        answer: [{ kind: 'frac', value: [1, d] }, num(n), num(add)],
        steps: [`分母是 ${d}，分数单位是 ${frac(1, d)}`, shown === frac(n, d) ? `${shown} 里有 ${n} 个 ${frac(1, d)}` : `${shown} = ${frac(n, d)}，有 ${n} 个 ${frac(1, d)}`, `${isNum ? '' : `${target[0]}是 ${target[1]}，`}${target[1]} = ${frac(target[1] * d, d)}，有 ${target[1] * d} 个 ${frac(1, d)}`, `还要添上：${target[1] * d} − ${n} = ${add}（个）`],
        hint: `${target[1]} 里有几个 ${frac(1, d)}？`,
      };
    },
  },
  {
    id: 'g5b-fr-proper', grade: 5, term: 2, unit: U24, name: '真分数和假分数',
    tip: '分子比分母小的是真分数（小于 1）；分子等于或大于分母的是假分数（大于或等于 1）', level: 1,
    gen(r) {
      const d = r.int(3, 15), k = r.int(0, 4);
      if (k === 0) return { q: `分数 □/${d} 是真分数，□ 里最大能填 {0}`, answer: [num(d - 1)], steps: ['真分数的分子比分母小', `分母是 ${d}，分子最大是 ${d - 1}`] };
      if (k === 1) return { q: `分数 □/${d} 是假分数，□ 里最小能填 {0}`, answer: [num(d)], steps: ['假分数的分子等于或大于分母', `分母是 ${d}，分子最小是 ${d}（这时分数等于 1）`] };
      if (k === 2) return { q: `分数 ${d}/□ 是假分数，□ 里最大能填 {0}`, answer: [num(d)], steps: ['假分数的分母等于或小于分子', `分子是 ${d}，分母最大是 ${d}`] };
      if (k === 3) return { q: `分数 ${d}/□ 是真分数，□ 里最小能填 {0}`, answer: [num(d + 1)], steps: ['真分数的分母比分子大', `分子是 ${d}，分母最小是 ${d + 1}`] };
      return { q: `分数单位是 ${frac(1, d)} 的最大真分数是 {0}`, answer: [{ kind: 'frac', value: [d - 1, d] }], steps: [`分数单位是 ${frac(1, d)}，分母是 ${d}`, `真分数的分子比分母小，最大是 ${d - 1}：${frac(d - 1, d)}`] };
    },
  },
  {
    id: 'g5b-fr-tomixed', grade: 5, term: 2, unit: U24, name: '假分数化成带分数或整数',
    tip: '用分子除以分母：商是整数部分，余数是分子，分母不变', level: 1,
    gen(r) {
      const d = r.int(2, 12);
      const n = r.chance(0.15) ? d * r.int(2, 9) : r.until(() => r.int(d + 1, d * 9), (v) => v % d !== 0 && gcd(v, d) === 1);
      const q = Math.floor(n / d), rem = n % d;
      return {
        q: rem ? `把 ${frac(n, d)} 化成带分数，整数部分是 {0}，分数部分是 {1}` : `把 ${frac(n, d)} 化成整数：${frac(n, d)} = {0}`,
        answer: rem ? [num(q), { kind: 'frac', value: [rem, d] }] : [num(q)],
        steps: [`${n} ÷ ${d} = ${q}${rem ? ` …… ${rem}` : ''}`, rem ? `商 ${q} 是整数部分，余数 ${rem} 是分子，分母 ${d} 不变：${MX(q, rem, d)}` : `正好除尽，${frac(n, d)} = ${q}`],
        hint: `${n} 里有几个 ${d}？`,
      };
    },
  },
  {
    id: 'g5b-fr-toimproper', grade: 5, term: 2, unit: U24, name: '带分数（整数）化成假分数',
    tip: '分母不变，分子 = 整数 × 分母 + 原分子', level: 1,
    gen(r) {
      const d = r.int(2, 12);
      if (r.chance(0.2)) {
        const w = r.int(2, 9);
        return { q: `把 ${w} 化成分母是 ${d} 的假分数，分子是 {0}`, answer: [num(w * d)], steps: [`1 = ${frac(d, d)}，${w} 里有 ${w} 个 ${frac(d, d)}`, `分子：${w} × ${d} = ${w * d}，${w} = ${frac(w * d, d)}`] };
      }
      const w = r.int(1, 9), n = r.until(() => r.int(1, d - 1), (v) => gcd(v, d) === 1), N = w * d + n;
      return {
        q: `把 ${MX(w, n, d)} 化成假分数：${MX(w, n, d)} = {0}`,
        answer: [{ kind: 'frac', value: [N, d] }],
        steps: [`分母 ${d} 不变`, `分子：整数 × 分母 + 原分子 = ${w} × ${d} + ${n} = ${N}`, `${MX(w, n, d)} = ${frac(N, d)}`],
        hint: `整数 ${w} 里有几个 ${frac(1, d)}？`,
      };
    },
  },
  {
    id: 'g5b-fr-basic', grade: 5, term: 2, unit: U24, name: '分数的基本性质',
    tip: '分子和分母同时乘或除以相同的数（0 除外），分数的大小不变', level: 1,
    gen(r) {
      const [n, d] = rfrac(r, 2, 12), m = r.int(2, 8), k = r.int(0, 2);
      if (k === 0) return { q: `把 ${frac(n, d)} 化成分母是 ${d * m} 的分数，分子是 {0}`, answer: [num(n * m)], steps: [`分母从 ${d} 变成 ${d * m}，乘了 ${m}`, `分子也要乘 ${m}：${n} × ${m} = ${n * m}`, `${frac(n, d)} = ${frac(n * m, d * m)}`], hint: '分母乘了几？' };
      if (k === 1) return { q: `把 ${frac(n * m, d * m)} 化成分母是 ${d} 的分数，分子是 {0}`, answer: [num(n)], steps: [`分母从 ${d * m} 变成 ${d}，除以了 ${m}`, `分子也要除以 ${m}：${n * m} ÷ ${m} = ${n}`, `${frac(n * m, d * m)} = ${frac(n, d)}`], hint: '分母除以了几？' };
      return { q: `把 ${frac(n, d)} 化成分子是 ${n * m} 的分数，分母是 {0}`, answer: [num(d * m)], steps: [`分子从 ${n} 变成 ${n * m}，乘了 ${m}`, `分母也要乘 ${m}：${d} × ${m} = ${d * m}`, `${frac(n, d)} = ${frac(n * m, d * m)}`], hint: '分子乘了几？' };
    },
  },
  {
    id: 'g5b-fr-basic-add', grade: 5, term: 2, unit: U24, name: '分子加几，分母加几',
    tip: '先算分子（分母）变成了原来的几倍，分母（分子）也变成原来的几倍，再求加了多少', level: 2,
    gen(r) {
      const [n, d] = rfrac(r, 3, 12), k = r.int(1, 4), v = r.int(0, 2);
      if (v === 0) {
        const x = n * k, y = d * k;
        return { q: `${frac(n, d)} 的分子加上 ${x}，要使分数的大小不变，分母应加上 {0}`, answer: [num(y)], steps: [`分子变成 ${n} + ${x} = ${n + x}，是原来的 ${n + x} ÷ ${n} = ${k + 1} 倍`, `分母也要变成原来的 ${k + 1} 倍：${d} × ${k + 1} = ${d * (k + 1)}`, `应加上：${d * (k + 1)} − ${d} = ${y}`, `易错：不是加上 ${x}`], hint: '分子变成了原来的几倍？' };
      }
      if (v === 1) {
        const y = d * k, x = n * k;
        return { q: `${frac(n, d)} 的分母加上 ${y}，要使分数的大小不变，分子应加上 {0}`, answer: [num(x)], steps: [`分母变成 ${d} + ${y} = ${d + y}，是原来的 ${k + 1} 倍`, `分子也要变成原来的 ${k + 1} 倍：${n} × ${k + 1} = ${n * (k + 1)}`, `应加上：${n * (k + 1)} − ${n} = ${x}`], hint: '分母变成了原来的几倍？' };
      }
      const m = r.int(2, 5);
      return { q: `${frac(n, d)} 的分子乘 ${m}，要使分数的大小不变，分母应加上 {0}`, answer: [num(d * (m - 1))], steps: [`分子乘 ${m}，分母也要乘 ${m}：${d} × ${m} = ${d * m}`, `分母从 ${d} 变成 ${d * m}，应加上 ${d * m} − ${d} = ${d * (m - 1)}`], hint: '分母应该变成多少？' };
    },
  },
  {
    id: 'g5b-fr-gcd', grade: 5, term: 2, unit: U24, name: '求最大公因数',
    tip: '列举两个数的因数找公有的最大的；有倍数关系时是较小数；只有公因数 1 时最大公因数是 1', level: 1,
    gen(r) {
      const kind = r.pick(['n', 'n', 'n', 'mul', 'co']);
      const [a, b] = r.until(() => {
        if (kind === 'mul') { const a = r.int(3, 20), k = r.int(2, 6); return [a, a * k]; }
        if (kind === 'co') return [r.int(4, 30), r.int(4, 30)];
        const g = r.int(2, 12), p = r.int(1, 8), q = r.int(2, 9); return [g * p, g * q];
      }, ([a, b]) => a !== b && a <= 100 && b <= 100 && (kind === 'co' ? gcd(a, b) === 1 : kind === 'mul' ? true : gcd(a, b) > 1 && b % a !== 0 && a % b !== 0));
      const g = gcd(a, b);
      let st;
      if (kind === 'mul') st = [`${b} ÷ ${a} = ${b / a}，${b} 是 ${a} 的倍数`, `两个数是倍数关系时，最大公因数是较小的数：${a}`];
      else if (kind === 'co') st = [`${a} 的因数：${factors(a).join('、')}；${b} 的因数：${factors(b).join('、')}`, '公因数只有 1，最大公因数是 1'];
      else { const sd = shortDiv2(a, b); st = [`${a} 的因数：${factors(a).join('、')}`, `${b} 的因数：${factors(b).join('、')}`, `公因数：${factors(g).join('、')}，最大的是 ${g}`, '也可以用短除法，把除数乘起来：', sd.pre, `${sd.divs.join(' × ')} = ${g}`]; }
      return { q: `${a} 和 ${b} 的最大公因数是 {0}`, answer: [num(g)], steps: st, hint: '先找出较小数的因数，再看哪些也是另一个数的因数' };
    },
  },
  {
    id: 'g5b-fr-reduce', grade: 5, term: 2, unit: U24, name: '约分',
    tip: '用分子和分母的公因数（最好是最大公因数）去除，直到分子分母只有公因数 1', level: 1,
    gen(r) {
      const [n0, d0] = rfrac(r, 2, 15, { proper: r.chance(0.8), maxN: 20 }), g = r.int(2, 12);
      const n = n0 * g, d = d0 * g;
      if (d0 === 1) return { q: `约分：${frac(n, d)} = {0}`, answer: [num(n0)], steps: [`${n} 和 ${d} 的最大公因数是 ${g}`, `${frac(n, d)} = ${n0}`] };
      return {
        q: `约分：${frac(n, d)} = {0}`,
        answer: [fansM(n, d)],
        steps: [`${n} 和 ${d} 的最大公因数是 ${g}`, `分子、分母同时除以 ${g}：${frac(n, d)} = ${frac(n0, d0)}`, `${n0} 和 ${d0} 只有公因数 1，是最简分数`],
        hint: `${n} 和 ${d} 有哪些公因数？`,
      };
    },
  },
  {
    id: 'g5b-fr-simplest', grade: 5, term: 2, unit: U24, name: '最简分数',
    tip: '分子和分母只有公因数 1 的分数是最简分数', level: 2,
    gen(r) {
      if (r.bool()) {
        const d = r.int(6, 24), ns = []; for (let i = 1; i < d; i++) if (gcd(i, d) === 1) ns.push(i);
        return { q: `分母是 ${d} 的最简真分数有 {0} 个`, answer: [num(ns.length)], steps: [`分子要比 ${d} 小，并且和 ${d} 只有公因数 1`, `分子可以是：${ns.join('、')}`, `一共 ${ns.length} 个`], hint: `${d} 的质因数有哪些？分子不能含有它们` };
      }
      const good = rfrac(r, 5, 30);
      const bad = [];
      while (bad.length < 3) { const [n, d] = rfrac(r, 3, 12), k = r.pick([2, 3, 3, 7, 5]); const f = [n * k, d * k]; if (!bad.some((b) => b[0] === f[0] && b[1] === f[1]) && f[1] <= 60) bad.push(f); }
      const opts = r.shuffle([good, ...bad]).map(([n, d]) => frac(n, d));
      return {
        q: '下面的分数中，最简分数是{0}',
        answer: [choice(opts, frac(...good))],
        steps: [...bad.map(([n, d]) => `${frac(n, d)}：分子、分母有公因数 ${gcd(n, d)}，不是最简分数`), `${frac(...good)}：分子、分母只有公因数 1，是最简分数`],
        hint: '看分子分母有没有 1 以外的公因数，特别注意 3 和 7',
      };
    },
  },
  {
    id: 'g5b-fr-lcm', grade: 5, term: 2, unit: U24, name: '求最小公倍数',
    tip: '用大数的倍数去找小数的倍数；有倍数关系时是较大数；只有公因数 1 时是两数的积', level: 1,
    gen(r) {
      const kind = r.pick(['n', 'n', 'n', 'mul', 'co']);
      const [a, b] = r.until(() => {
        if (kind === 'mul') { const a = r.int(2, 15), k = r.int(2, 5); return [a, a * k]; }
        if (kind === 'co') return [r.int(2, 12), r.int(2, 15)];
        const g = r.int(2, 8), p = r.int(1, 7), q = r.int(2, 8); return [g * p, g * q];
      }, ([a, b]) => a !== b && lcm(a, b) <= 180 && (kind === 'co' ? gcd(a, b) === 1 : kind === 'mul' ? true : gcd(a, b) > 1 && b % a !== 0 && a % b !== 0));
      const L = lcm(a, b), big = Math.max(a, b), small = Math.min(a, b);
      let st;
      if (kind === 'mul') st = [`${big} 是 ${small} 的倍数`, `两个数是倍数关系时，最小公倍数是较大的数：${big}`];
      else if (kind === 'co') st = [`${a} 和 ${b} 只有公因数 1`, `最小公倍数是它们的积：${a} × ${b} = ${L}`];
      else {
        const ms = []; for (let m = big; m <= L; m += big) ms.push(m);
        const sd = shortDiv2(a, b);
        st = [`从大数 ${big} 的倍数里找第一个也是 ${small} 的倍数的：${ms.join('、')}`, `${L} 是 ${small} 的倍数，最小公倍数是 ${L}`, '也可以用短除法，把除数和最后的商都乘起来：', sd.pre, `${[...sd.divs, sd.x, sd.y].join(' × ')} = ${L}`];
      }
      return { q: `${a} 和 ${b} 的最小公倍数是 {0}`, answer: [num(L)], steps: st, hint: '从较大数的倍数开始找' };
    },
  },
  {
    id: 'g5b-fr-common', grade: 5, term: 2, unit: U24, name: '通分',
    tip: '用两个分母的最小公倍数作公分母，再按分数的基本性质把分子跟着变', level: 1,
    gen(r) {
      const shared = r.chance(0.6);
      const o = r.until(() => { const [a, b] = rfrac(r, 2, 15), [c, d] = rfrac(r, 2, 15); return { a, b, c, d }; }, (o) => o.b !== o.d && lcm(o.b, o.d) <= 72 && (!shared || gcd(o.b, o.d) > 1));
      const L = lcm(o.b, o.d), m1 = L / o.b, m2 = L / o.d;
      return {
        q: `把 ${frac(o.a, o.b)} 和 ${frac(o.c, o.d)} 通分（用最小公倍数作公分母）：公分母是 {0}，通分后 ${frac(o.a, o.b)} 的分子是 {1}，${frac(o.c, o.d)} 的分子是 {2}`,
        answer: [num(L, { label: '公分母' }), num(o.a * m1), num(o.c * m2)],
        steps: [`${o.b} 和 ${o.d} 的最小公倍数是 ${L}`, m1 === 1 ? `${frac(o.a, o.b)} 的分母已经是 ${L}，不用变` : `${frac(o.a, o.b)} = ${frac(o.a * m1, L)}（分子分母同时乘 ${m1}）`, m2 === 1 ? `${frac(o.c, o.d)} 的分母已经是 ${L}，不用变` : `${frac(o.c, o.d)} = ${frac(o.c * m2, L)}（分子分母同时乘 ${m2}）`],
        hint: `先求 ${o.b} 和 ${o.d} 的最小公倍数`,
      };
    },
  },
  {
    id: 'g5b-fr-to-dec', grade: 5, term: 2, unit: U24, name: '分数化成小数',
    tip: '用分子除以分母；除不尽时按要求保留几位小数', level: 1,
    gen(r) {
      if (r.chance(0.3)) {
        const [n, d] = r.until(() => rfrac(r, 3, 12), ([n, d]) => [3, 6, 7, 9, 11, 12].includes(d));
        const L = longDiv(n, d, 3), v = round(L.q, 2);
        return { q: `${frac(n, d)} ≈ {0}（保留两位小数）`, answer: [num(v)], steps: [`用分子除以分母：${n} ÷ ${d}，除到第三位小数`, { pre: L.pre }, roundWhy(L.q, 2), `${frac(n, d)} ≈ ${fmt(v)}`], hint: `${n} ÷ ${d}` };
      }
      const d = r.pick([2, 4, 5, 8, 10, 20, 25, 40, 50]);
      const n = r.until(() => r.int(1, d * 2), (v) => gcd(v, d) === 1 && v !== d);
      const v = fix(n / d), mx = n > d && r.bool();
      const shown = mx ? FM(n, d) : frac(n, d);
      return {
        q: `${shown} = {0}（填小数）`,
        answer: [num(v)],
        steps: [mx ? `先看分数部分：${frac(n % d, d)} = ${n % d} ÷ ${d} = ${fmt(fix((n % d) / d))}，再加上整数部分 ${Math.floor(n / d)}` : `用分子除以分母：${n} ÷ ${d}`, `${shown} = ${fmt(v)}`],
        hint: d === 10 || d === 100 ? '分母是 10、100，直接写成小数' : `也可以先把分母变成 10、100 或 1000`,
      };
    },
  },
  {
    id: 'g5b-fr-from-dec', grade: 5, term: 2, unit: U24, name: '小数化成分数',
    tip: '一位小数写成分母是 10 的分数，两位小数写成分母是 100 的分数……再约分', level: 1,
    gen(r) {
      const p = r.pick([1, 2, 2, 3]);
      const x = r.until(() => rdec(r, 0.01, r.chance(0.25) ? 3.99 : 0.99, p), (v) => gcd(intOf(v), P10(p)) > 1 || r.chance(0.3));
      const N = intOf(x), D = P10(p);
      const [a, b] = simplify(N, D);
      return {
        q: `${fmt(x)} = {0}（填最简分数）`,
        answer: [fansM(N, D)],
        steps: [`${fmt(x)} 是${cn(p)}位小数，写成分母是 ${D} 的分数：${frac(N, D)}`, ...reduceSteps(N, D), ...(a > b ? [`也可以写成带分数：${FM(a, b)}`] : [])],
        hint: `${cn(p)}位小数，分母是几？`,
      };
    },
  },
  {
    id: 'g5b-fr-cmp-easy', grade: 5, term: 2, unit: U24, name: '分数比大小（同分母、同分子）',
    tip: '分母相同，分子大的分数大；分子相同，分母小的分数大', level: 1, speed: 8,
    gen(r) {
      const sameD = r.bool();
      let f1, f2;
      if (sameD) { const D = r.int(3, 16), [x, y] = r.sample([...Array(D).keys()].slice(1), 2); f1 = [x, D]; f2 = [y, D]; }
      else { const n = r.int(1, 8), [x, y] = r.sample([...Array(13).keys()].map((i) => n + 1 + i), 2); f1 = [n, x]; f2 = [n, y]; }
      const ans = cmp(f1[0] / f1[1], f2[0] / f2[1]);
      return {
        q: `${frac(...f1)} {0} ${frac(...f2)}`,
        answer: [choice(CMP, ans)],
        steps: [sameD ? `分母相同，比分子：${f1[0]} ${cmp(f1[0], f2[0])} ${f2[0]}` : `分子相同，比分母：${f1[1]} ${cmp(f1[1], f2[1])} ${f2[1]}，分母越大，平均分的份数越多，每一份越小`, `所以 ${frac(...f1)} ${ans} ${frac(...f2)}`],
        hint: sameD ? '分母一样，看分子' : '分子一样，分母大的反而小',
      };
    },
  },
  {
    id: 'g5b-fr-cmp', grade: 5, term: 2, unit: U24, name: '分数比大小（异分母）',
    tip: '先通分化成同分母再比；分数和小数比，可以把分数化成小数', level: 1,
    gen(r) {
      if (r.chance(0.3)) {
        const d = r.pick([4, 5, 8, 20, 25]), n = r.until(() => r.int(1, d - 1), (v) => gcd(v, d) === 1), fv = fix(n / d);
        const dv = r.chance(0.2) ? fv : r.until(() => rdec(r, Math.max(0.05, fv - 0.15), Math.min(0.99, fv + 0.15), r.int(1, 2)), (v) => v !== fv);
        const ans = cmp(fv, dv), left = r.bool();
        return { q: left ? `${frac(n, d)} {0} ${fmt(dv)}` : `${fmt(dv)} {0} ${frac(n, d)}`, answer: [choice(CMP, left ? ans : cmp(dv, fv))], steps: [`把分数化成小数：${frac(n, d)} = ${n} ÷ ${d} = ${fmt(fv)}`, `${fmt(fv)} ${ans} ${fmt(dv)}`, left ? `所以 ${frac(n, d)} ${ans} ${fmt(dv)}` : `所以 ${fmt(dv)} ${cmp(dv, fv)} ${frac(n, d)}`], hint: '把分数化成小数再比' };
      }
      const o = r.until(() => { const [a, b] = rfrac(r, 3, 15), [c, d] = rfrac(r, 3, 15); return { a, b, c, d }; }, (o) => o.b !== o.d && o.a !== o.c && lcm(o.b, o.d) <= 90 && o.a * o.d !== o.b * o.c);
      const L = lcm(o.b, o.d), x = o.a * (L / o.b), y = o.c * (L / o.d), ans = cmp(x, y);
      return {
        q: `${frac(o.a, o.b)} {0} ${frac(o.c, o.d)}`,
        answer: [choice(CMP, ans)],
        steps: [`通分，公分母是 ${L}：${[[o.a, o.b, x], [o.c, o.d, y]].filter((f) => f[1] !== L).map(([p, q, v]) => `${frac(p, q)} = ${frac(v, L)}`).join('，')}`, `${x} ${ans} ${y}，所以 ${frac(o.a, o.b)} ${ans} ${frac(o.c, o.d)}`],
        hint: '先通分',
      };
    },
  },
  {
    id: 'g5b-fr-finite', grade: 5, term: 2, unit: U24, name: '能否化成有限小数',
    tip: '先化成最简分数，分母只有质因数 2 和 5 的，才能化成有限小数', level: 2,
    gen(r) {
      const goodD = [2, 4, 5, 8, 10, 16, 20, 25, 40, 50];
      const okF = r.chance(0.4)
        ? (() => { const d = r.pick([4, 5, 8, 20]), k = r.pick([3, 7]); const n = r.until(() => r.int(1, d - 1), (v) => gcd(v, d) === 1); return [n * k, d * k]; })()
        : (() => { const d = r.pick(goodD), n = r.until(() => r.int(1, d - 1), (v) => gcd(v, d) === 1); return [n, d]; })();
      const bad = [];
      while (bad.length < 3) { const d = r.pick([3, 6, 7, 9, 12, 14, 15, 18, 21, 30]); const n = r.until(() => r.int(1, d - 1), (v) => gcd(v, d) === 1); if (!bad.some((b) => b[1] === d)) bad.push([n, d]); }
      const opts = r.shuffle([okF, ...bad]).map(([n, d]) => frac(n, d));
      const [sn, sd] = simplify(...okF);
      return {
        q: '下面的分数中，能化成有限小数的是{0}',
        answer: [choice(opts, frac(...okF))],
        steps: ['先看是不是最简分数，再把分母分解质因数', ...bad.map(([n, d]) => `${frac(n, d)}：最简分数，分母 ${d} ${isPrime(d) ? '本身是质数' : '= ' + primeFactors(d).join(' × ')}，含有 2、5 以外的质因数`), `${frac(...okF)}${sn !== okF[0] ? ` = ${frac(sn, sd)}` : ''}：分母 ${sd} = ${primeFactors(sd).join(' × ')}，只含 2 和 5，能化成有限小数（${fmt(fix(sn / sd))}）`],
        hint: '先约分！',
      };
    },
  },
);

// ---------- 第 5 单元 图形的运动（三） ----------
S.push({
  id: 'g5b-rot-clock', grade: 5, term: 2, unit: '图形的运动（三）', name: '钟面上的旋转',
  tip: '钟面一圈 360°，12 个大格，每个大格是 30°；说旋转要说清绕哪一点、什么方向、转了多少度', level: 1,
  gen(r) {
    const k = r.int(0, 3);
    if (k === 0) {
      const s = r.int(1, 12), m = r.int(1, 11), e = ((s + m - 1) % 12) + 1;
      return { q: `钟面上，指针从“${s}”绕中心点按顺时针方向旋转 ${m * 30}°，指向“{0}”`, answer: [num(e)], steps: ['每个大格是 30°', `${m * 30}° ÷ 30° = ${m}，顺时针转 ${m} 个大格`, `从 ${s} 往后数 ${m} 格，指向 ${e}`], hint: '先算转了几个大格' };
    }
    if (k === 1) {
      const s = r.int(1, 12), e = r.until(() => r.int(1, 12), (v) => v !== s), cw = r.bool();
      const g = cw ? (e - s + 12) % 12 : (s - e + 12) % 12;
      return { q: `钟面上，指针从“${s}”绕中心点按${cw ? '顺' : '逆'}时针方向旋转到“${e}”，旋转了 {0}°`, answer: [num(g * 30, { unit: '°' })], steps: [`按${cw ? '顺' : '逆'}时针方向从 ${s} 数到 ${e}，经过 ${g} 个大格`, `${g} × 30° = ${g * 30}°`], hint: `按${cw ? '顺' : '逆'}时针方向数一数经过几个大格` };
    }
    if (k === 2) {
      const h1 = r.int(1, 10), h2 = r.int(h1 + 1, Math.min(12, h1 + 6));
      return { q: `从 ${h1} 时到 ${h2} 时，时针绕中心点按顺时针方向旋转了 {0}°`, answer: [num((h2 - h1) * 30, { unit: '°' })], steps: [`时针从 ${h1} 走到 ${h2}，走了 ${h2 - h1} 个大格`, `${h2 - h1} × 30° = ${(h2 - h1) * 30}°`], hint: '时针每小时走 1 个大格' };
    }
    const mins = r.pick([5, 10, 15, 20, 25, 30, 35, 40, 45, 50]);
    return { q: `经过 ${mins} 分钟，分针绕中心点按顺时针方向旋转了 {0}°`, answer: [num(mins * 6, { unit: '°' })], steps: [`分针 5 分钟走 1 个大格，${mins} 分钟走 ${mins / 5} 个大格`, `${mins / 5} × 30° = ${mins * 6}°`], hint: '分针每 5 分钟走一个大格' };
  },
});

const DIRW = (d, pos, neg) => (d > 0 ? `${pos} ${d} 格` : `${neg} ${-d} 格`);
S.push({
  id: 'g5b-rot-grid', grade: 5, term: 2, unit: '图形的运动（三）', name: '方格纸上的旋转',
  tip: '绕点 O 旋转，线段的长度不变、和 O 的位置关系跟着转：顺时针 90° 时，向右变向下、向上变向右', level: 2,
  gen(r) {
    const kind = r.pick(['cw', 'ccw', 'half']);
    const o = r.until(() => ({ O: { c: r.int(2, 6), r: r.int(2, 4) }, dx: r.int(-3, 3), dy: r.int(-3, 3) }), ({ O, dx, dy }) => {
      if (!dx && !dy) return false;
      const [nx, ny] = kind === 'cw' ? [dy, -dx] : kind === 'ccw' ? [-dy, dx] : [-dx, -dy];
      const ok = (c, rr) => c >= 1 && c <= 8 && rr >= 1 && rr <= 6;
      return ok(O.c + dx, O.r + dy) && ok(O.c + nx, O.r + ny) && (dx && dy ? true : r.chance(0.3));
    });
    const { O, dx, dy } = o, [nx, ny] = kind === 'cw' ? [dy, -dx] : kind === 'ccw' ? [-dy, dx] : [-dx, -dy];
    const A = { c: O.c + dx, r: O.r + dy }, A2 = { c: O.c + nx, r: O.r + ny };
    const how = { cw: '顺时针旋转 90°', ccw: '逆时针旋转 90°', half: '旋转 180°' }[kind];
    const rule = { cw: '顺时针转 90°：向右变成向下，向下变成向左，向左变成向上，向上变成向右', ccw: '逆时针转 90°：向右变成向上，向上变成向左，向左变成向下，向下变成向右', half: '转 180°：方向都变成相反的，向右变向左，向上变向下' }[kind];
    const part = (x, y) => [x ? DIRW(x, '右边', '左边') : '', y ? DIRW(y, '上面', '下面') : ''].filter(Boolean).join('、');
    return {
      q: `把线段 OA 绕点 O ${how}，点 A 旋转后的位置用数对表示是（{0}，{1}）`,
      fig: gridFig(8, 6, [{ ...O, label: 'O' }, { ...A, label: 'A' }], { segs: [[O, A]] }),
      answer: [num(A2.c, { label: '列' }), num(A2.r, { label: '行' })],
      steps: [`先看点 A 在点 O 的哪儿：O（${O.c}，${O.r}），A（${A.c}，${A.r}），A 在 O 的${part(dx, dy)}`, rule, `旋转后，点 A 在 O 的${part(nx, ny)}`, `所以是（${O.c} ${nx >= 0 ? '+' : '−'} ${Math.abs(nx)}，${O.r} ${ny >= 0 ? '+' : '−'} ${Math.abs(ny)}）=（${A2.c}，${A2.r}）`],
      hint: '点 O 不动，先说清 A 在 O 的哪个方向、几格',
    };
  },
});

// ---------- 最大公因数、最小公倍数的应用（拓展） ----------
/** 求最大公因数 / 最小公倍数的过程（列举或短除） */
function gcdWork(a, b) {
  const g = gcd(a, b);
  if (Math.max(a, b) % Math.min(a, b) === 0) return [`${Math.max(a, b)} 是 ${Math.min(a, b)} 的倍数，最大公因数是 ${g}`];
  if (g === 1) return [`${a} 和 ${b} 只有公因数 1，最大公因数是 1`];
  const sd = shortDiv2(a, b);
  return ['用短除法求最大公因数：', sd.pre, `${a} 和 ${b} 的最大公因数${sd.divs.length > 1 ? `：${sd.divs.join(' × ')} = ${g}` : `是 ${g}`}`];
}
function lcmWork(a, b) {
  const L = lcm(a, b), big = Math.max(a, b), small = Math.min(a, b);
  if (big % small === 0) return [`${big} 是 ${small} 的倍数，最小公倍数是 ${L}`];
  if (gcd(a, b) === 1) return [`${a} 和 ${b} 只有公因数 1，最小公倍数是 ${a} × ${b} = ${L}`];
  const ms = []; for (let m = big; m <= L; m += big) ms.push(m);
  return [`${big} 的倍数：${ms.join('、')}……，其中 ${L} 也是 ${small} 的倍数`, `${a} 和 ${b} 的最小公倍数是 ${L}`];
}

S.push(
  {
    id: 'g5b-gcd-app', grade: 5, term: 2, unit: U24, name: '最大公因数的应用', process: true,
    tip: '“同样大小、没有剩余、最大（最多）”——要找的数必须同时是两个数的因数，取最大公因数', level: 3,
    gen(r) {
      const [a, b] = r.until(() => { const g = r.int(2, 12); return [g * r.int(2, 9), g * r.int(2, 9)]; }, ([a, b]) => a !== b && gcd(a, b) > 1 && Math.max(a, b) % Math.min(a, b) !== 0 && a <= 96 && b <= 96);
      const [A, B] = [Math.max(a, b), Math.min(a, b)], g = gcd(A, B);
      const t = r.pick([
        { q: `一张长方形纸长 ${A} 厘米，宽 ${B} 厘米。要把它剪成同样大小的正方形，没有剩余，正方形的边长最大是多少厘米？能剪多少个这样的正方形？`, rel: '正方形的边长既要能把长分完，也要能把宽分完，所以边长是长和宽的公因数，最大就是最大公因数', a1: ['边长', '厘米'], a2: ['个数', '个', (A / g) * (B / g), `长边剪 ${A} ÷ ${g} = ${A / g}（个），宽边剪 ${B} ÷ ${g} = ${B / g}（个），一共 ${A / g} × ${B / g} = ${(A / g) * (B / g)}（个）`], say: (n) => `正方形的边长最大是 ${g} 厘米，能剪 ${n} 个` },
        { q: `一个长方形房间长 ${A} 分米，宽 ${B} 分米。要用同样大小的正方形地砖把地面铺满，地砖都用整块，地砖的边长最大是多少分米？一共需要多少块？`, rel: '地砖的边长要能同时把长和宽分完，是长和宽的公因数，最大就是最大公因数', a1: ['边长', '分米'], a2: ['块数', '块', (A / g) * (B / g), `长边铺 ${A} ÷ ${g} = ${A / g}（块），宽边铺 ${B} ÷ ${g} = ${B / g}（块），一共 ${A / g} × ${B / g} = ${(A / g) * (B / g)}（块）`], say: (n) => `地砖的边长最大是 ${g} 分米，一共需要 ${n} 块` },
        { q: `有两根彩带，一根长 ${A} 分米，另一根长 ${B} 分米。要把它们剪成同样长的小段，没有剩余，每段最长是多少分米？一共能剪成多少段？`, rel: '每段的长度既要能把第一根分完，也要能把第二根分完，是两个长度的公因数，最长就是最大公因数', a1: ['每段', '分米'], a2: ['段数', '段', A / g + B / g, `${A} ÷ ${g} + ${B} ÷ ${g} = ${A / g} + ${B / g} = ${A / g + B / g}（段）`], say: (n) => `每段最长 ${g} 分米，一共能剪成 ${n} 段` },
        { q: `五年级参加合唱的有男生 ${A} 人、女生 ${B} 人。要把男生、女生分别分组，每组人数都相同，每组最多有多少人？这时男生、女生一共分成多少组？`, rel: '每组人数既要能把男生分完，也要能把女生分完，是两个人数的公因数，最多就是最大公因数', a1: ['每组', '人'], a2: ['组数', '组', A / g + B / g, `男生 ${A} ÷ ${g} = ${A / g}（组），女生 ${B} ÷ ${g} = ${B / g}（组），一共 ${A / g + B / g} 组`], say: (n) => `每组最多有 ${g} 人，一共分成 ${n} 组` },
        { q: `有 ${A} 个苹果和 ${B} 个橘子，平均装在若干个礼盒里，每盒的苹果个数相同、橘子个数也相同，都没有剩余。最多能装多少盒？每盒有几个苹果？`, rel: '盒数既要能把苹果分完，也要能把橘子分完，是两个数的公因数，最多就是最大公因数', a1: ['盒数', '盒'], a2: ['每盒苹果', '个', A / g, `${A} ÷ ${g} = ${A / g}（个）`], say: (n) => `最多能装 ${g} 盒，每盒有 ${n} 个苹果` },
      ]);
      return {
        q: t.q,
        answer: [num(g, { label: t.a1[0], unit: t.a1[1] }), num(t.a2[2], { label: t.a2[0], unit: t.a2[1] })],
        steps: [`找数量关系：${t.rel}`, ...gcdWork(A, B), `再求${t.a2[0]}：${t.a2[3]}`, `答：${t.say(t.a2[2])}。`],
        hint: `求 ${A} 和 ${B} 的最大公因数`,
      };
    },
  },
  {
    id: 'g5b-lcm-app', grade: 5, term: 2, unit: U24, name: '最小公倍数的应用', process: true,
    tip: '“同时……再一次同时”“拼成最小的正方形”“几个几个地数都正好”——要找的数同时是两个数的倍数，取最小公倍数', level: 3,
    gen(r) {
      const [a, b] = r.until(() => [r.int(3, 20), r.int(3, 20)], ([a, b]) => a < b && lcm(a, b) < a * b && b % a !== 0 && lcm(a, b) <= 120);
      const L = lcm(a, b);
      const t = r.pick([
        () => {
          const h0 = r.int(6, 8), tot = h0 * 60 + L, h = Math.floor(tot / 60), m = tot % 60;
          return { q: `公交车站有两路车，1 路车每 ${a} 分钟发一班，2 路车每 ${b} 分钟发一班。早上 ${h0}:00 两路车同时发车，下一次同时发车是几时几分？`, rel: '再次同时发车经过的时间，既是 ' + a + ' 的倍数，也是 ' + b + ' 的倍数，最少就是最小公倍数', ans: [num(h, { unit: '时' }), num(m, { unit: '分' })], more: `${h0}:00 再过 ${L} 分钟${L >= 60 ? `（${Math.floor(L / 60)} 时 ${L % 60} 分）` : ''}是 ${h}:${String(m).padStart(2, '0')}`, say: `下一次同时发车是 ${h} 时 ${m} 分` };
        },
        () => ({ q: `${r.names(2).join('和')}绕操场跑步，跑一圈分别要 ${a} 分钟和 ${b} 分钟。两人同时从起点出发、同向跑，至少多少分钟后两人在起点再次相遇？`, rel: `在起点再次相遇的时间，两人都要正好跑完整圈，既是 ${a} 的倍数也是 ${b} 的倍数，最少就是最小公倍数`, ans: [num(L, { unit: '分钟' })], more: '', say: `至少 ${L} 分钟后两人在起点再次相遇` }),
        () => {
          const [x, y] = [a, b];
          return { q: `用长 ${y} 厘米、宽 ${x} 厘米的长方形纸片拼成一个正方形（不重叠、没有空隙），正方形的边长最小是多少厘米？至少需要多少张这样的纸片？`, rel: '正方形的边长既要是纸片长的倍数，也要是纸片宽的倍数，最小就是最小公倍数', ans: [num(L, { label: '边长', unit: '厘米' }), num((L / x) * (L / y), { label: '张数', unit: '张' })], more: `每行放 ${L} ÷ ${y} = ${L / y}（张），放 ${L} ÷ ${x} = ${L / x}（行），一共 ${L / y} × ${L / x} = ${(L / x) * (L / y)}（张）`, say: `正方形的边长最小是 ${L} 厘米，至少需要 ${(L / x) * (L / y)} 张` };
        },
        () => ({ q: `一盒糖果，${a} 个 ${a} 个地数正好数完，${b} 个 ${b} 个地数也正好数完。这盒糖果最少有多少个？`, rel: `糖果的个数既是 ${a} 的倍数，也是 ${b} 的倍数，最少就是最小公倍数`, ans: [num(L, { unit: '个' })], more: '', say: `这盒糖果最少有 ${L} 个` }),
        () => ({ q: `妈妈每 ${a} 天去一次超市，爸爸每 ${b} 天去一次超市。这个月 1 日两人在超市相遇，至少再过多少天两人又在超市相遇？`, rel: `再次相遇经过的天数，既是 ${a} 的倍数，也是 ${b} 的倍数，最少就是最小公倍数`, ans: [num(L, { unit: '天' })], more: '', say: `至少再过 ${L} 天两人又在超市相遇` }),
      ].filter((f, i) => i !== 4 || L <= 60))();
      return { q: t.q, answer: t.ans, steps: [`找数量关系：${t.rel}`, ...lcmWork(a, b), ...(t.more ? [t.more] : []), `答：${t.say}。`], hint: `求 ${a} 和 ${b} 的最小公倍数` };
    },
  },
  {
    id: 'g5b-lcm-queue', grade: 5, term: 2, unit: U24, name: '排队问题（余数相同）', process: true,
    tip: '几个几个地分都多（少）同样的数，先把多的拿走（把少的补上），就成了它们的公倍数', level: 3,
    gen(r) {
      const [a, b] = r.until(() => [r.int(2, 9), r.int(3, 10)], ([a, b]) => a < b && lcm(a, b) >= 12 && lcm(a, b) <= 60);
      const L = lcm(a, b), more = r.bool(), k = more ? r.int(1, a - 1) : 1;
      const m = r.int(1, Math.max(1, Math.floor(100 / L))), N = L * m + (more ? k : -k);
      const lo = Math.floor(N / 10) * 10 === N ? N - 5 : Math.floor(N / 10) * 10, hi = lo + (L > 20 && lo + 20 < N + L ? 20 : 10);
      const ctx = r.pick([
        { who: '五年级同学排队做操', act: (x) => `每排 ${x} 人`, u: '人' },
        { who: '一批练习本', act: (x) => `每 ${x} 本捆一捆`, u: '本' },
        { who: '一筐鸡蛋', act: (x) => `${x} 个 ${x} 个地拿`, u: '个' },
        { who: '一批树苗', act: (x) => `每行种 ${x} 棵`, u: '棵' },
      ]);
      const tail = more ? `都多 ${k} ${ctx.u}` : `都少 ${k} ${ctx.u}`, or = `或${/^\d/.test(ctx.act(b)) ? ' ' : ''}`;
      return {
        q: `${ctx.who}，${ctx.act(a)}${or}${ctx.act(b)}，${tail}。已知总数在 ${lo}～${hi} 之间，一共有多少${ctx.u}？`,
        answer: [num(N, { unit: ctx.u })],
        steps: [
          `找数量关系：${more ? `去掉多的 ${k} ${ctx.u}` : `再补上 ${k} ${ctx.u}`}，${ctx.act(a)}${or}${ctx.act(b)}就都正好分完，这个数是 ${a} 和 ${b} 的公倍数`,
          ...lcmWork(a, b),
          `${a} 和 ${b} 的公倍数：${[...Array(m + 1).keys()].map((i) => L * (i + 1)).join('、')}……`,
          `${more ? '加上' : '减去'} ${k}，在 ${lo}～${hi} 之间的只有：${L * m} ${more ? '+' : '−'} ${k} = ${N}`,
          `答：一共有 ${N} ${ctx.u}。`,
        ],
        hint: more ? `先去掉多出来的 ${k}` : `先补上少的 ${k}`,
      };
    },
  },
);

// ---------- 第 6 单元 分数的加法和减法 ----------
const U26 = '分数的加法和减法';
const OPW = { '+': '加', '−': '减' };
const fop = (x, op, y) => (op === '+' ? x + y : x - y);
/** 结果是假分数（约分后仍大于 1、不是整数）时补一句带分数 */
function improperNote(n, d) {
  const [p, q] = simplify(n, d);
  return q > 1 && p > q ? [`结果是假分数，也可以写成带分数：${fracText(p, q, { asMixed: true })}`] : [];
}
/** a/b op c/d 的讲解（结果约分） */
function addSteps(a, b, c, d, op) {
  if (b === d) {
    const n = fop(a, op, c);
    return [`同分母分数相${OPW[op]}：分母不变，分子相${OPW[op]}`, `${frac(a, b)} ${op} ${frac(c, d)} = ${n === 0 ? 0 : frac(n, b)}`, ...(n ? reduceSteps(n, b) : []), ...improperNote(n, b)];
  }
  const L = lcm(b, d), x = a * (L / b), y = c * (L / d), n = fop(x, op, y);
  return [`分母不同，先通分：${b} 和 ${d} 的最小公倍数是 ${L}`, `${frac(a, b)} ${op} ${frac(c, d)} = ${frac(x, L)} ${op} ${frac(y, L)} = ${frac(n, L)}`, ...reduceSteps(n, L), ...improperNote(n, L)];
}

S.push(
  {
    id: 'g5b-fa-same', grade: 5, term: 2, unit: U26, name: '同分母分数加减法',
    tip: '分母不变，分子相加减；结果能约分的要约分', level: 1, speed: 10,
    gen(r) {
      const d = r.int(3, 16), op = r.pick(['+', '−']);
      if (op === '−' && r.chance(0.25)) {
        const n = r.int(1, d - 1);
        return { q: `1 − ${frac(n, d)} = {0}`, answer: [fans(d - n, d)], steps: [`把 1 看作 ${frac(d, d)}`, `${frac(d, d)} − ${frac(n, d)} = ${frac(d - n, d)}`, ...reduceSteps(d - n, d)], hint: `1 = ${frac(d, d)}` };
      }
      const [a, c] = r.until(() => [r.int(1, d - 1), r.int(1, d - 1)], ([a, c]) => (op === '+' ? a + c <= d + 2 : a > c) && gcd(a, d) === 1 && gcd(c, d) === 1 && (gcd(fop(a, op, c), d) > 1 || r.chance(0.4)));
      const n = fop(a, op, c);
      return { q: `${frac(a, d)} ${op} ${frac(c, d)} = {0}`, answer: [fansM(n, d)], steps: addSteps(a, d, c, d, op), hint: '分母不变，分子相加减' };
    },
  },
  {
    id: 'g5b-fa-diff', grade: 5, term: 2, unit: U26, name: '异分母分数加减法',
    tip: '先通分，化成同分母分数再加减；结果能约分的要约分', level: 1,
    gen(r) {
      const kind = r.pick(['mul', 'co', 'gen']), op = r.pick(['+', '−']);
      const o = r.until(() => { const [a, b] = rfrac(r, 2, 15), [c, d] = rfrac(r, 2, 15); return { a, b, c, d }; }, ({ a, b, c, d }) => {
        if (b === d || lcm(b, d) > 60) return false;
        const big = Math.max(b, d), small = Math.min(b, d);
        if (kind === 'mul' && big % small !== 0) return false;
        if (kind === 'co' && gcd(b, d) !== 1) return false;
        if (kind === 'gen' && (gcd(b, d) === 1 || big % small === 0)) return false;
        return op === '+' ? true : a * d > c * b;
      });
      const L = lcm(o.b, o.d), n = fop(o.a * (L / o.b), op, o.c * (L / o.d));
      return { q: `${frac(o.a, o.b)} ${op} ${frac(o.c, o.d)} = {0}`, answer: [fansM(n, L)], steps: addSteps(o.a, o.b, o.c, o.d, op), hint: `先通分，公分母用 ${o.b} 和 ${o.d} 的最小公倍数` };
    },
  },
  {
    id: 'g5b-fa-mixnum', grade: 5, term: 2, unit: U26, name: '带分数加减法',
    tip: '整数部分和分数部分分别相加减；分数部分满 1 向整数进 1，不够减就从整数部分借 1', level: 2,
    gen(r) {
      const op = r.pick(['+', '−']);
      const o = r.until(() => {
        const [n1, d1] = rfrac(r, 2, 12), [n2, d2] = rfrac(r, 2, 12);
        return { w1: r.int(1, 9), n1, d1, w2: r.int(1, 6), n2, d2 };
      }, (o) => lcm(o.d1, o.d2) <= 36 && (op === '+' || o.w1 * o.d1 * o.d2 + o.n1 * o.d2 > o.w2 * o.d1 * o.d2 + o.n2 * o.d1) && (op === '+' || o.w1 > o.w2));
      const L = lcm(o.d1, o.d2), x = o.n1 * (L / o.d1), y = o.n2 * (L / o.d2);
      const st = [];
      if (o.d1 !== o.d2) st.push(`分数部分先通分，公分母是 ${L}：${MX(o.w1, o.n1, o.d1)} ${op} ${MX(o.w2, o.n2, o.d2)} = ${MX(o.w1, x, L)} ${op} ${MX(o.w2, y, L)}`);
      let W, F;
      if (op === '+') {
        W = o.w1 + o.w2; F = x + y;
        st.push(`整数部分：${o.w1} + ${o.w2} = ${W}；分数部分：${frac(x, L)} + ${frac(y, L)} = ${frac(F, L)}`);
        if (F >= L) { st.push(`${frac(F, L)} = ${F === L ? 1 : MX(1, F - L, L)}，满 1 向整数部分进 1：${F === L ? W + 1 : MX(W + 1, F - L, L)}`); W += 1; F -= L; }
      } else {
        let w1 = o.w1, xx = x;
        if (x < y) { st.push(`${frac(x, L)} 不够减 ${frac(y, L)}，从整数部分借 1：${MX(o.w1, x, L)} = ${MX(o.w1 - 1, x + L, L)}`); w1 -= 1; xx += L; }
        W = w1 - o.w2; F = xx - y;
        st.push(`整数部分：${w1} − ${o.w2} = ${W}；分数部分：${frac(xx, L)} − ${frac(y, L)} = ${F ? frac(F, L) : 0}`);
      }
      const g = gcd(F, L);
      if (F && g > 1) st.push(`约分：${frac(F, L)} = ${frac(F / g, L / g)}`);
      const total = W * L + F;
      st.push(`结果：${fracText(total, L, { asMixed: true })}`);
      return { q: `${MX(o.w1, o.n1, o.d1)} ${op} ${MX(o.w2, o.n2, o.d2)} = {0}`, answer: [fansM(total, L)], steps: st, hint: '整数部分和分数部分分别算' };
    },
  },
  {
    id: 'g5b-fa-mix3', grade: 5, term: 2, unit: U26, name: '分数加减混合运算',
    tip: '运算顺序和整数一样：从左往右算，有括号先算括号里的；也可以三个分数一起通分', level: 2,
    gen(r) {
      const paren = r.chance(0.4);
      const o = r.until(() => {
        const fs = [rfrac(r, 2, 12), rfrac(r, 2, 12), rfrac(r, 2, 12)];
        const ops = paren ? ['−', r.pick(['+', '−'])] : [r.pick(['+', '−']), r.pick(['+', '−'])];
        return { fs, ops };
      }, ({ fs, ops }) => {
        const L = fs.reduce((m, [, d]) => lcm(m, d), 1);
        if (L > 36 || new Set(fs.map((f) => f[1])).size < 2) return false;
        const v = fs.map(([n, d]) => n * (L / d));
        if (paren) { const inner = fop(v[1], ops[1], v[2]); return inner > 0 && v[0] - inner > 0; }
        const s1 = fop(v[0], ops[0], v[1]); return s1 > 0 && fop(s1, ops[1], v[2]) > 0;
      });
      const { fs, ops } = o, L = fs.reduce((m, [, d]) => lcm(m, d), 1), v = fs.map(([n, d]) => n * (L / d));
      const F = fs.map(([n, d]) => frac(n, d)), FL = v.map((x) => frac(x, L));
      let q, st, res;
      if (paren) {
        const inner = fop(v[1], ops[1], v[2]); res = v[0] - inner;
        q = `${F[0]} − (${F[1]} ${ops[1]} ${F[2]}) = {0}`;
        st = [`三个分母的最小公倍数是 ${L}，一起通分`, `= ${FL[0]} − (${FL[1]} ${ops[1]} ${FL[2]})`, `先算括号里：${FL[1]} ${ops[1]} ${FL[2]} = ${frac(inner, L)}`, `再算：${FL[0]} − ${frac(inner, L)} = ${frac(res, L)}`];
      } else {
        const s1 = fop(v[0], ops[0], v[1]); res = fop(s1, ops[1], v[2]);
        q = `${F[0]} ${ops[0]} ${F[1]} ${ops[1]} ${F[2]} = {0}`;
        st = [`三个分母的最小公倍数是 ${L}，一起通分`, `= ${FL[0]} ${ops[0]} ${FL[1]} ${ops[1]} ${FL[2]}`, `分母不变，分子从左往右算：${v[0]} ${ops[0]} ${v[1]} ${ops[1]} ${v[2]} = ${res}，结果是 ${frac(res, L)}`];
      }
      st.push(...reduceSteps(res, L), ...improperNote(res, L));
      return { q, answer: [fansM(res, L)], steps: st, hint: paren ? '先算括号里的' : '可以三个分数一起通分' };
    },
  },
  {
    id: 'g5b-fa-easy', grade: 5, term: 2, unit: U26, name: '分数加减法简便计算',
    tip: '整数的运算定律对分数同样适用：把同分母的、能凑成整数的先算；连减可以减去两个数的和', level: 2,
    gen(r) {
      const k = r.int(0, 3);
      if (k === 0) {
        const d = r.int(3, 13), a = r.until(() => r.int(1, d - 1), (v) => gcd(v, d) === 1), [c, e] = r.until(() => rfrac(r, 2, 12), ([, e]) => e !== d);
        return { q: `${frac(a, d)} + ${frac(c, e)} + ${frac(d - a, d)} = {0}（用简便方法计算）`, answer: [fansM(e + c, e)], steps: [`${frac(a, d)} 和 ${frac(d - a, d)} 同分母，相加正好是 1，用加法交换律先把它们加起来`, `= (${frac(a, d)} + ${frac(d - a, d)}) + ${frac(c, e)}`, `= 1 + ${frac(c, e)}`, `= ${MX(1, c, e)}`], hint: '哪两个分数能凑成 1？' };
      }
      if (k === 1) {
        const W = r.int(2, 6), d = r.int(3, 13), a = r.until(() => r.int(1, d - 1), (v) => gcd(v, d) === 1);
        return { q: `${W} − ${frac(a, d)} − ${frac(d - a, d)} = {0}（用简便方法计算）`, answer: [num(W - 1)], steps: ['连续减去两个数，等于减去这两个数的和', `= ${W} − (${frac(a, d)} + ${frac(d - a, d)})`, `= ${W} − 1`, `= ${W - 1}`], hint: '后面两个分数的和是多少？' };
      }
      if (k === 2) {
        const [d, e] = r.until(() => [r.int(3, 11), r.int(3, 11)], ([d, e]) => d !== e);
        const a = r.until(() => r.int(1, d - 1), (v) => gcd(v, d) === 1), c = r.until(() => r.int(1, e - 1), (v) => gcd(v, e) === 1);
        return { q: `${frac(a, d)} + ${frac(c, e)} + ${frac(d - a, d)} + ${frac(e - c, e)} = {0}（用简便方法计算）`, answer: [num(2)], steps: ['用加法交换律和结合律，把同分母的放在一起', `= (${frac(a, d)} + ${frac(d - a, d)}) + (${frac(c, e)} + ${frac(e - c, e)})`, '= 1 + 1', '= 2'], hint: '把同分母的分数放在一起' };
      }
      const [x, y] = rfrac(r, 2, 12), d = r.until(() => r.int(3, 13), (v) => v !== y), a = r.until(() => r.int(1, d - 1), (v) => gcd(v, d) === 1);
      return { q: `${frac(a, d)} − ${frac(x, y)} + ${frac(d - a, d)} = {0}（用简便方法计算）`, answer: [fans(y - x, y)], steps: [`${frac(a, d)} 和 ${frac(d - a, d)} 相加正好是 1，先把它们加起来（${frac(x, y)} 带着前面的减号一起移动）`, `= ${frac(a, d)} + ${frac(d - a, d)} − ${frac(x, y)}`, `= 1 − ${frac(x, y)}`, `= ${frac(y - x, y)}`], hint: '哪两个分数能凑成 1？' };
    },
  },
  {
    id: 'g5b-fa-eq', grade: 5, term: 2, unit: U26, name: '解方程（分数加减）',
    tip: '用等式的性质：方程两边同时加上或减去同一个分数，左右仍然相等', level: 2,
    gen(r) {
      const k = r.int(0, 2);
      const o = r.until(() => { const [a, b] = rfrac(r, 2, 12), [c, d] = rfrac(r, 2, 12); return { a, b, c, d }; }, ({ a, b, c, d }) => b !== d && lcm(b, d) <= 36 && (k === 1 || a * d !== c * b) && (k === 0 ? c * b > a * d : k === 2 ? a * d > c * b : true));
      const { a, b, c, d } = o, L = lcm(b, d);
      const A = a * (L / b), Cc = c * (L / d);
      if (k === 0) { // x + a/b = c/d
        const n = Cc - A;
        return { q: `解方程：x + ${frac(a, b)} = ${frac(c, d)}，x = {0}`, answer: [fansM(n, L)], steps: [`方程两边同时减去 ${frac(a, b)}`, `x = ${frac(c, d)} − ${frac(a, b)}`, `x = ${frac(Cc, L)} − ${frac(A, L)} = ${frac(n, L)}`, ...reduceSteps(n, L), `检验：把 x 代入原方程，左边 = 右边`], hint: '两边同时减去同一个数' };
      }
      if (k === 1) { // x − a/b = c/d
        const n = Cc + A;
        return { q: `解方程：x − ${frac(a, b)} = ${frac(c, d)}，x = {0}`, answer: [fansM(n, L)], steps: [`方程两边同时加上 ${frac(a, b)}`, `x = ${frac(c, d)} + ${frac(a, b)}`, `x = ${frac(Cc, L)} + ${frac(A, L)} = ${frac(n, L)}`, ...reduceSteps(n, L), ...(n > L ? [`也就是 ${fracText(n, L, { asMixed: true })}`] : [])], hint: '两边同时加上同一个数' };
      }
      const n = A - Cc; // a/b − x = c/d
      return { q: `解方程：${frac(a, b)} − x = ${frac(c, d)}，x = {0}`, answer: [fansM(n, L)], steps: [`方程两边同时加上 x，变成 ${frac(c, d)} + x = ${frac(a, b)}`, `两边再同时减去 ${frac(c, d)}：x = ${frac(a, b)} − ${frac(c, d)}`, `x = ${frac(A, L)} − ${frac(Cc, L)} = ${frac(n, L)}`, ...reduceSteps(n, L)], hint: 'x 在减号后面，先让两边同时加上 x' };
    },
  },
  {
    id: 'g5b-fa-word', grade: 5, term: 2, unit: U26, name: '分数加减法解决问题', process: true,
    tip: '分清是求“一共”“还剩”还是“多（少）多少”，再决定用加法还是减法；“比……短（少）”求原来的数要用加法', level: 1,
    gen(r) {
      const two = () => r.until(() => { const [a, b] = rfrac(r, 2, 12), [c, d] = rfrac(r, 2, 12); return { a, b, c, d }; }, ({ a, b, c, d }) => b !== d && lcm(b, d) <= 36 && a * d !== c * b);
      const nm = r.name();
      const t = r.pick([
        () => { const o = r.until(two, ({ a, b, c, d }) => a * d + c * b < b * d); return { o, op: '+', q: `一条路，第一周修了全长的 ${frac(o.a, o.b)}，第二周修了全长的 ${frac(o.c, o.d)}。两周一共修了全长的几分之几？`, rel: '第一周修的 + 第二周修的 = 两周一共修的', say: (v) => `两周一共修了全长的 ${v}` }; },
        () => { const o = r.until(two, ({ a, b, c, d }) => c * b > a * d); return { o: { a: o.c, b: o.d, c: o.a, d: o.b }, op: '−', q: `${nm}读一本书，第一天读了全书的 ${frac(o.a, o.b)}，第二天读了全书的 ${frac(o.c, o.d)}。第二天比第一天多读了全书的几分之几？`, rel: '第二天读的 − 第一天读的 = 多读的', say: (v) => `第二天比第一天多读了全书的 ${v}` }; },
        () => { const o = two(); return { o, op: '+', q: `妈妈买了 ${frac(o.a, o.b)} 千克苹果和 ${frac(o.c, o.d)} 千克梨，一共买了多少千克水果？`, rel: '苹果的质量 + 梨的质量 = 一共的质量', u: '千克', say: (v) => `一共买了 ${v} 千克水果` }; },
        () => { const o = two(); return { o, op: '+', q: `一根红绳长 ${frac(o.a, o.b)} 米，比一根黄绳短 ${frac(o.c, o.d)} 米。黄绳长多少米？`, rel: '红绳比黄绳短，黄绳长 = 红绳长 + 短的部分', u: '米', say: (v) => `黄绳长 ${v} 米` }; },
        () => { const o = r.until(two, ({ a, b, c, d }) => a * d > c * b); return { o, op: '−', q: `${nm}做数学作业用了 ${frac(o.a, o.b)} 小时，做语文作业比数学作业少用 ${frac(o.c, o.d)} 小时。做语文作业用了多少小时？`, rel: '数学作业用的时间 − 少用的时间 = 语文作业用的时间', u: '小时', say: (v) => `做语文作业用了 ${v} 小时` }; },
        () => { const o = r.until(two, ({ a, b, c, d }) => a * d > c * b); return { o, op: '−', q: `一个水桶里有 ${frac(o.a, o.b)} 升水，用去 ${frac(o.c, o.d)} 升。桶里还剩多少升水？`, rel: '原有的水 − 用去的水 = 剩下的水', u: '升', say: (v) => `桶里还剩 ${v} 升水` }; },
      ])();
      const { a, b, c, d } = t.o, L = lcm(b, d), n = fop(a * (L / b), t.op, c * (L / d));
      const v = fracText(n, L, { asMixed: !!t.u });
      return {
        q: t.q,
        answer: [t.u ? fansM(n, L, { unit: t.u }) : fans(n, L)],
        steps: [`找数量关系：${t.rel}`, `列式：${frac(a, b)} ${t.op} ${frac(c, d)}`, `计算：${addSteps(a, b, c, d, t.op).slice(1).join('，')}${t.u ? `（${t.u}）` : ''}`, `答：${t.say(v)}。`],
        hint: t.op === '+' ? '是求和还是求差？' : '谁减谁？',
      };
    },
  },
  {
    id: 'g5b-fa-rest', grade: 5, term: 2, unit: U26, name: '求剩下的几分之几', process: true,
    tip: '把总量看作单位“1”，剩下的 = 1 − 用去（占去）的各部分', level: 2,
    gen(r) {
      const o = r.until(() => { const [a, b] = rfrac(r, 2, 12), [c, d] = rfrac(r, 2, 12); return { a, b, c, d }; }, ({ a, b, c, d }) => b !== d && lcm(b, d) <= 36 && a * d + c * b < b * d);
      const { a, b, c, d } = o, L = lcm(b, d), used = a * (L / b) + c * (L / d), rest = L - used;
      const t = r.pick([
        { q: `一块菜地，种黄瓜的面积占 ${frac(a, b)}，种西红柿的面积占 ${frac(c, d)}，其余种茄子。种茄子的面积占这块地的几分之几？`, rel: '把这块地看作单位“1”，茄子 = 1 − 黄瓜 − 西红柿', say: '种茄子的面积占这块地的' },
        { q: `一项工程，甲队完成了 ${frac(a, b)}，乙队完成了 ${frac(c, d)}。还剩这项工程的几分之几没有完成？`, rel: '把这项工程看作单位“1”，剩下的 = 1 − 甲队完成的 − 乙队完成的', say: '还剩这项工程的' },
        { q: `${r.name()}一天的零花钱，买文具用去 ${frac(a, b)}，买零食用去 ${frac(c, d)}。还剩这些钱的几分之几？`, rel: '把零花钱看作单位“1”，剩下的 = 1 − 买文具的 − 买零食的', say: '还剩这些钱的' },
        { q: `五（2）班同学参加兴趣小组，参加美术组的占全班的 ${frac(a, b)}，参加航模组的占 ${frac(c, d)}，其余参加合唱组（每人只参加一个组）。参加合唱组的占全班的几分之几？`, rel: '把全班人数看作单位“1”，合唱组 = 1 − 美术组 − 航模组', say: '参加合唱组的占全班的' },
      ]);
      return {
        q: t.q,
        answer: [fans(rest, L)],
        steps: [`找数量关系：${t.rel}`, `列式：1 − ${frac(a, b)} − ${frac(c, d)}，也可以写成 1 − (${frac(a, b)} + ${frac(c, d)})`, `计算：${frac(a, b)} + ${frac(c, d)} = ${frac(a * (L / b), L)} + ${frac(c * (L / d), L)} = ${frac(used, L)}，1 − ${frac(used, L)} = ${frac(rest, L)}${gcd(rest, L) > 1 ? ` = ${F(rest, L)}` : ''}`, `答：${t.say} ${F(rest, L)}。`],
        hint: '把总量看作 1',
      };
    },
  },
  {
    id: 'g5b-fa-apply', grade: 5, term: 2, unit: U26, name: '分数加减法综合应用', process: true,
    tip: '先找单位“1”，再一步一步求出每部分占几分之几；“比……多（少）几分之几”是在另一部分的基础上加（减）', level: 3,
    gen(r) {
      const o = r.until(() => { const [a, b] = rfrac(r, 2, 12), [c, d] = rfrac(r, 2, 12); return { a, b, c, d, more: r.bool() }; }, ({ a, b, c, d, more }) => {
        const L = lcm(b, d); if (b === d || L > 36) return false;
        const A = a * (L / b), Cc = c * (L / d), second = more ? A + Cc : A - Cc;
        return second > 0 && A + second < L;
      });
      const { a, b, c, d, more } = o, L = lcm(b, d), A = a * (L / b), Cc = c * (L / d), second = more ? A + Cc : A - Cc, rest = L - A - second;
      const mw = more ? '多' : '少', sg = more ? '+' : '−';
      const t = r.pick([
        { q: `${r.name()}看一本故事书，第一天看了全书的 ${frac(a, b)}，第二天看的比第一天${mw}全书的 ${frac(c, d)}。还剩全书的几分之几没看？`, one: '全书', p1: '第一天', p2: '第二天', left: '还剩全书的', tail: '没看' },
        { q: `修一条水渠，第一周修了全长的 ${frac(a, b)}，第二周修的比第一周${mw}全长的 ${frac(c, d)}。还剩全长的几分之几没修？`, one: '水渠全长', p1: '第一周', p2: '第二周', left: '还剩全长的', tail: '没修' },
        { q: `一块地，种玉米的占 ${frac(a, b)}，种大豆的比种玉米的${mw}这块地的 ${frac(c, d)}，其余种花生。种花生的占这块地的几分之几？`, one: '这块地', p1: '玉米', p2: '大豆', left: '种花生的占这块地的', tail: '' },
        { q: `一池水，第一天用去 ${frac(a, b)}，第二天用去的比第一天${mw}这池水的 ${frac(c, d)}。还剩这池水的几分之几？`, one: '这池水', p1: '第一天', p2: '第二天', left: '还剩这池水的', tail: '' },
      ]);
      return {
        q: t.q,
        answer: [fans(rest, L)],
        steps: [
          `找数量关系：把${t.one}看作单位“1”；${t.p2}的 = ${t.p1}的 ${sg} ${frac(c, d)}；剩下的 = 1 − ${t.p1}的 − ${t.p2}的`,
          `列式：1 − ${frac(a, b)} − (${frac(a, b)} ${sg} ${frac(c, d)})`,
          `先算${t.p2}的：${frac(a, b)} ${sg} ${frac(c, d)} = ${frac(A, L)} ${sg} ${frac(Cc, L)} = ${frac(second, L)}`,
          `再算剩下的：1 − ${frac(A, L)} − ${frac(second, L)} = ${frac(rest, L)}${gcd(rest, L) > 1 ? ` = ${F(rest, L)}` : ''}`,
          `答：${t.left} ${F(rest, L)}${t.tail}。`,
        ],
        hint: `先求出${t.p2}占几分之几`,
      };
    },
  },
  {
    id: 'g5b-fa-telescope', grade: 5, term: 2, unit: U26, name: '分数巧算（拆项相消）',
    tip: '分母是相邻两个数的积：{{1/6}} = {{1/2}} − {{1/3}}；一串分数每个是前一个的一半：和 = 1 − 最后一个', level: 3, pool: 20,
    gen(r) {
      const k = r.int(0, 2);
      if (k === 0) {
        const n = r.int(4, 7), terms = [...Array(n).keys()].map((i) => 2 ** (i + 1)), last = terms[n - 1];
        return { q: `${terms.map((t) => frac(1, t)).join(' + ')} = {0}`, answer: [fans(last - 1, last)], steps: ['把 1 看作一个正方形：先取一半，再取剩下的一半……', `每加一项，离 1 还差的部分就是最后加上的那个分数，加到 ${frac(1, last)} 时还差 ${frac(1, last)}`, `原式 = 1 − ${frac(1, last)} = ${frac(last - 1, last)}`], hint: `离 1 还差多少？` };
      }
      const s = k === 1 ? 1 : r.int(2, 4), n = r.int(4, 7), e = s + n;
      const terms = [...Array(n).keys()].map((i) => (s + i) * (s + i + 1));
      const [p, qd] = simplify(e - s, s * e);
      return {
        q: `${terms.map((t) => frac(1, t)).join(' + ')} = {0}`,
        answer: [fans(e - s, s * e)],
        steps: [
          `每个分母都是相邻两个数的积：${terms.slice(0, 2).map((t, i) => `${t} = ${s + i} × ${s + i + 1}`).join('，')}……`,
          `拆项：${frac(1, terms[0])} = ${s === 1 ? 1 : frac(1, s)} − ${frac(1, s + 1)}，${frac(1, terms[1])} = ${frac(1, s + 1)} − ${frac(1, s + 2)}……`,
          `原式 = ${s === 1 ? 1 : frac(1, s)} − ${frac(1, s + 1)} + ${frac(1, s + 1)} − ${frac(1, s + 2)} + … + ${frac(1, e - 1)} − ${frac(1, e)}`,
          `中间的项全部抵消，只剩 ${s === 1 ? 1 : frac(1, s)} − ${frac(1, e)} = ${qd === 1 ? p : frac(p, qd)}`,
        ],
        hint: `${frac(1, terms[0])} 可以写成哪两个分数的差？`,
      };
    },
  },
);

// ---------- 第 7 单元 折线统计图 ----------
const U27 = '折线统计图';
const LINE_CTX = [
  { title: '某商店上半年空调销售量', labels: ['1月', '2月', '3月', '4月', '5月', '6月'], unit: '台', u: '台', base: [30, 25, 40, 60, 90, 130], jit: 10, what: '销售量', hi: '最多' },
  { title: `某同学 7～12 岁的身高`, labels: ['7岁', '8岁', '9岁', '10岁', '11岁', '12岁'], unit: '厘米', u: '厘米', base: [122, 127, 132, 137, 143, 150], jit: 2, what: '身高', hi: '最高' },
  { title: '某校近六年的学生人数', labels: ['2021年', '2022年', '2023年', '2024年', '2025年', '2026年'], unit: '人', u: '人', base: [800, 860, 920, 950, 1010, 1080], jit: 30, what: '学生人数', hi: '最多' },
  { title: '一棵向日葵每周的高度', labels: ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周'], unit: '厘米', u: '厘米', base: [8, 20, 38, 60, 85, 100], jit: 5, what: '高度', hi: '最高' },
];
function lineData(r, ctx) {
  return r.until(() => ctx.base.map((v) => v + r.int(-ctx.jit, ctx.jit)), (vs) => {
    if (!vs.every((v) => v >= 0)) return false;
    const inc = vs.slice(1).map((v, i) => v - vs[i]), mx = Math.max(...inc);
    return inc.filter((x) => x === mx).length === 1 && new Set(vs).size === vs.length;
  });
}

S.push(
  {
    id: 'g5b-line-read', grade: 5, term: 2, unit: U27, name: '读单式折线统计图',
    tip: '点的高低看数量多少，线段的陡缓看变化快慢：线越陡，变化越大', level: 1,
    gen(r) {
      const ctx = r.pick(LINE_CTX), vs = lineData(r, ctx), L = ctx.labels;
      const inc = vs.slice(1).map((v, i) => v - vs[i]), mi = inc.indexOf(Math.max(...inc));
      const [i, j] = r.sample([0, 1, 2, 3, 4, 5], 2).sort((x, y) => vs[x] - vs[y]);
      const segs = inc.map((_, k) => `${L[k]}～${L[k + 1]}`);
      const vmax = Math.max(...vs), imax = vs.indexOf(vmax);
      const k = r.int(0, 2);
      const fg = lineChart(L, [{ name: ctx.what, values: vs }], { unit: ctx.unit, title: ctx.title });
      if (k === 0) return { q: `看图回答：${L[j]}的${ctx.what}比${L[i]}多 {0} ${ctx.u}`, fig: fg, answer: [num(vs[j] - vs[i])], steps: [`读图：${L[i]}是 ${vs[i]} ${ctx.u}，${L[j]}是 ${vs[j]} ${ctx.u}`, `${vs[j]} − ${vs[i]} = ${vs[j] - vs[i]}（${ctx.u}）`], hint: '先读出两个点的数据' };
      if (k === 1) return { q: `看图回答：${ctx.what}增长最快的是 {0}`, fig: fg, answer: [choice(segs, segs[mi])], steps: ['相邻两点之间的线段越陡，增长越快', ...inc.map((d, k2) => `${segs[k2]}：${vs[k2 + 1]} − ${vs[k2]} = ${d}`), `${segs[mi]} 增加了 ${inc[mi]} ${ctx.u}，最多，所以这一段增长最快`], hint: '找最陡的那一段' };
      return { q: `看图回答：${ctx.what}${ctx.hi}的是 {0}，是 {1} ${ctx.u}；从${L[0]}到${L[5]}一共增加了 {2} ${ctx.u}`, fig: fg, answer: [choice(L, L[imax]), num(vmax), num(vs[5] - vs[0])], steps: [`最高的点在${L[imax]}，数据是 ${vmax}`, `${L[5]}是 ${vs[5]}，${L[0]}是 ${vs[0]}：${vs[5]} − ${vs[0]} = ${vs[5] - vs[0]}（${ctx.u}）`], hint: '看最高的点' };
    },
  },
  {
    id: 'g5b-line-double', grade: 5, term: 2, unit: U27, name: '读复式折线统计图',
    tip: '复式折线统计图有两条线，先看图例分清哪条线表示什么；两条线离得越远，相差越多', level: 2,
    gen(r) {
      const ctx = r.pick([
        { title: '甲、乙两城市上半年降水量', labels: ['1月', '2月', '3月', '4月', '5月', '6月'], unit: '毫米', u: '毫米', names: ['甲城', '乙城'], A: [10, 25, 45, 70, 95, 110], B: [30, 35, 50, 60, 75, 120], jit: 6, what: '降水量' },
        { title: '两名同学 1 分钟跳绳成绩', labels: ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周'], unit: '下', u: '下', names: ['小明', '小红'], A: [100, 108, 118, 125, 135, 142], B: [120, 124, 126, 132, 135, 138], jit: 4, what: '跳绳成绩' },
        { title: '两个超市上半年营业额', labels: ['1月', '2月', '3月', '4月', '5月', '6月'], unit: '万元', u: '万元', names: ['一店', '二店'], A: [60, 75, 55, 65, 70, 85], B: [45, 50, 52, 60, 72, 90], jit: 5, what: '营业额' },
        { title: '某地两种产品的月产量', labels: ['1月', '2月', '3月', '4月', '5月', '6月'], unit: '千台', u: '千台', names: ['甲产品', '乙产品'], A: [20, 24, 30, 35, 42, 50], B: [26, 27, 29, 33, 36, 40], jit: 2, what: '产量' },
      ]);
      const [A, B] = r.until(() => [ctx.A.map((v) => v + r.int(-ctx.jit, ctx.jit)), ctx.B.map((v) => v + r.int(-ctx.jit, ctx.jit))], ([A, B]) => {
        const df = A.map((v, i) => Math.abs(v - B[i])), mx = Math.max(...df);
        return df.filter((x) => x === mx).length === 1 && A.every((v, i) => v !== B[i]) && A.every((v) => v > 0) && B.every((v) => v > 0);
      });
      const df = A.map((v, i) => Math.abs(v - B[i])), mi = df.indexOf(Math.max(...df));
      const L = ctx.labels, i = r.int(0, 5), aHigher = A.filter((v, k) => v > B[k]).length;
      const fg = lineChart(L, [{ name: ctx.names[0], values: A }, { name: ctx.names[1], values: B }], { unit: ctx.unit, title: ctx.title });
      return {
        q: `看图回答：${L[i]}${ctx.names[0]}的${ctx.what}是 {0} ${ctx.u}，${ctx.names[1]}是 {1} ${ctx.u}；两者相差最多的是 {2}，相差 {3} ${ctx.u}；${ctx.names[0]}比${ctx.names[1]}多的有 {4} ${L[0].includes('周') ? '周' : '个月'}`,
        fig: fg,
        answer: [num(A[i]), num(B[i]), choice(L, L[mi]), num(df[mi]), num(aHigher)],
        steps: [
          `实线是${ctx.names[0]}，虚线是${ctx.names[1]}`,
          `${L[i]}：${ctx.names[0]} ${A[i]}，${ctx.names[1]} ${B[i]}`,
          `两条线离得最远的是 ${L[mi]}：${Math.max(A[mi], B[mi])} − ${Math.min(A[mi], B[mi])} = ${df[mi]}（${ctx.u}）`,
          `实线在虚线上方的：${L.filter((_, k) => A[k] > B[k]).join('、') || '没有'}，共 ${aHigher} ${L[0].includes('周') ? '周' : '个月'}`,
        ],
        hint: '先看图例，分清两条线',
      };
    },
  },
  {
    id: 'g5b-line-choose', grade: 5, term: 2, unit: U27, name: '选择合适的统计图',
    tip: '要比较数量的多少用条形统计图；要看数量的增减变化用折线统计图', level: 1, pool: 16,
    gen(r) {
      const L = [['一位病人一天的体温变化情况', '折线'], ['某地近十年的人口变化情况', '折线'], ['一名同学 1～6 年级的身高变化', '折线'], ['某股票一周的价格涨跌情况', '折线'], ['一棵树苗每个月长高的情况', '折线'], ['某商店全年每月销售额的变化趋势', '折线'], ['一天中每小时气温的变化', '折线'], ['某城市一年中每月降水量的变化趋势', '折线'],
        ['五年级各班的人数', '条形'], ['同学们最喜欢的水果种类', '条形'], ['各个兴趣小组的人数', '条形'], ['几个城市去年的降水总量', '条形'], ['某次比赛中各队的得分', '条形'], ['学校图书室各类图书的本数', '条形'], ['五（1）班同学喜欢的运动项目', '条形'], ['各种动物的最高奔跑速度', '条形']];
      const [what, ans] = r.pick(L), opts = ['条形统计图', '折线统计图'];
      return { q: `要表示${what}，选用{0}比较合适`, answer: [choice(opts, ans + '统计图')], steps: [ans === '折线' ? '这里要看的是数量随时间的增减变化，用折线统计图' : '这里要比较的是不同类别数量的多少，用条形统计图'], hint: '是比多少，还是看变化？' };
    },
  },
);

// ---------- 第 8 单元 数学广角——找次品 ----------
const U28 = '数学广角——找次品';
const log3c = (n) => { let k = 0, p = 1; while (p < n) { p *= 3; k++; } return k; };
const ODD_CTX = [
  { what: '零件', odd: '一个次品', light: '轻一些', u: '个' },
  { what: '乒乓球', odd: '一个次品', light: '轻一些', u: '个' },
  { what: '钙片', odd: '一瓶少了 3 片', light: '轻一些', u: '瓶' },
  { what: '饼干', odd: '一盒少装了一块', light: '轻一些', u: '盒' },
  { what: '糖', odd: '一袋多装了几颗', light: '重一些', u: '袋' },
];
S.push(
  {
    id: 'g5b-odd-min', grade: 5, term: 2, unit: U28, name: '找次品：至少称几次',
    tip: '把物品尽量平均分成 3 份，称的次数最少；3 个以内称 1 次，9 个以内称 2 次，27 个以内称 3 次，81 个以内称 4 次', level: 2,
    gen(r) {
      const n = r.int(3, 100), k = log3c(n), c = r.pick(ODD_CTX);
      const qty = `${n} ${c.u}${c.what}`;
      const p = [];
      let m = n;
      while (m > 1) { const a = Math.round(m / 3), parts = [a, a, m - 2 * a].filter((x) => x > 0); p.push(`${m} ${c.u}分成 (${parts.join('，')})`); m = Math.max(...parts); }
      return {
        q: `${qty}里有${c.odd}（${c.light}），其余都一样。用天平称，至少称 {0} 次能保证找出它`,
        answer: [num(k)],
        steps: [`每次把它们尽量平均分成 3 份，天平两边放一样多，不管平不平都能知道次品在哪一份`, `每次都按次品在最多的那一份来算（保证找出）：${p.join('；')}`, `规律：${[1, 2, 3, 4, 5].map((i) => `${3 ** (i - 1) + 1}～${3 ** i} ${c.u}称 ${i} 次`).slice(0, Math.max(k, 2)).join('，')}`, `${n} 在 ${k === 1 ? 2 : 3 ** (k - 1) + 1}～${3 ** k} 之间，至少称 ${k} 次`],
        hint: '尽量平均分成 3 份',
      };
    },
  },
  {
    id: 'g5b-odd-max', grade: 5, term: 2, unit: U28, name: '找次品：称几次最多能找多少',
    tip: '称 1 次最多从 3 个里找出次品，每多称 1 次，个数就乘 3', level: 2, pool: 8,
    gen(r) {
      const k = r.int(2, 5), c = r.pick(ODD_CTX.slice(0, 2));
      return { q: `用天平找次品（次品${c.light}），称 ${k} 次最多能从 {0} 个${c.what}中保证找出次品`, answer: [num(3 ** k)], steps: ['称 1 次最多能从 3 个里找出次品（天平两边各放 1 个，留 1 个）', `每多称 1 次，能处理的个数乘 3：${[...Array(k).keys()].map((i) => `${i + 1} 次 → ${3 ** (i + 1)} 个`).join('，')}`], hint: '1 次能找 3 个，2 次呢？' };
    },
  },
  {
    id: 'g5b-odd-split', grade: 5, term: 2, unit: U28, name: '找次品：第一次怎么分',
    tip: '平均分成 3 份；不能平均分时，分成两份一样多、另一份多 1 或少 1', level: 2,
    gen(r) {
      const badOf = (n) => { const k = log3c(n), out = []; for (let h = 1; 2 * h <= n; h++) if (1 + log3c(Math.max(h, n - 2 * h)) > k) out.push(n - 2 * h ? `${h}，${h}，${n - 2 * h}` : `${h}，${h}`); return out; };
      const n = r.until(() => r.int(8, 60), (v) => (v % 3 !== 0 || r.chance(0.3)) && badOf(v).length >= 3);
      const a = Math.round(n / 3), best = [a, a, n - 2 * a], k = log3c(n), bs = best.join('，'), bad = badOf(n);
      const half = Math.floor(n / 2), halfS = n - 2 * half ? `${half}，${half}，${n - 2 * half}` : `${half}，${half}`;
      const pickBad = bad.includes(halfS) ? [halfS, ...r.sample(bad.filter((x) => x !== halfS), 2)] : r.sample(bad, 3);
      const opts = r.shuffle([bs, ...pickBad]).map((x) => `(${x})`);
      return {
        q: `有 ${n} 个零件，其中 1 个是次品（轻一些）。用天平称，为了保证用最少的次数找出次品，第一次应该把零件分成{0}`,
        answer: [choice(opts, `(${bs})`)],
        steps: [`尽量平均分成 3 份，天平两边各放一份（一样多），剩下一份不放`, `${n} ÷ 3 = ${Math.floor(n / 3)}${n % 3 ? ` …… ${n % 3}` : ''}，分成 (${bs})`, `这样不管次品在哪一份，剩下的最多 ${Math.max(...best)} 个，一共称 ${k} 次就能保证找出；其他几种分法，剩下的那份太多，要称 ${k + 1} 次或更多`],
        hint: '尽量平均分成 3 份',
      };
    },
  },
);

export default S;
