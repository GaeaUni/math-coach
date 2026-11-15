// 四年级题库（上册 term:1、下册 term:2）。题型按人教版单元顺序排列。
import { fig, fmt, fix, frac, readInt, readNum, vAdd, vSub, vMul, vDiv, round, decimals, gcd } from '../js/lib.js';

// ===== 共用工具 =====
const uniq = (a) => [...new Set(a)];
/** 选择题：答案 + 干扰项（自动去重、去掉与答案相同的），取 n 个打乱 */
function choice(r, value, wrongs, n = 4) {
  value = String(value);
  const ws = uniq(wrongs.map(String)).filter((w) => w !== value);
  return { kind: 'choice', options: r.shuffle([value, ...r.sample(ws, n - 1)]), value };
}
/** 判断题 */
const judge = (ok) => ({ kind: 'choice', options: ['√', '×'], value: ok ? '√' : '×' });
/** 数字答案（自动 fix） */
function num(value, unit, label) {
  const a = { kind: 'num', value: fix(value) };
  if (unit) a.unit = unit;
  if (label) a.label = label;
  return a;
}
const cmp = (a, b) => (a > b ? '>' : a < b ? '<' : '=');
const cmpAns = (a, b) => ({ kind: 'choice', options: ['>', '<', '='], value: cmp(a, b) });
/** 大数分级显示：305000000 → 3|0500|0000（讲解里用） */
function seg4(n) {
  const s = String(n), parts = [];
  for (let i = s.length; i > 0; i -= 4) parts.unshift(s.slice(Math.max(0, i - 4), i));
  return parts.join('|');
}
/** 整数数位名、计数单位（下标 = 从右往左第几位，0 是个位） */
const PLACE = ['个', '十', '百', '千', '万', '十万', '百万', '千万', '亿', '十亿', '百亿', '千亿'];
const UNIT = ['一', '十', '百', '千', '万', '十万', '百万', '千万', '亿', '十亿', '百亿', '千亿'];
/** 小数按固定位数显示（保留末尾 0）：dstr(3, 2) → '3.00'。x 本身位数不超过 d 时才用 */
const dstr = (x, d) => (d ? fix(x).toFixed(d) : String(Math.round(x)));
/** 竖式：小数加减（课本写法：小数点对齐，位数不够用 0 补足；得数也写满位数） */
function vDec(a, b, op) {
  const res = op === '+' ? fix(a + b) : fix(a - b);
  const d = Math.max(decimals(a), decimals(b));
  const sa = dstr(a, d), sb = dstr(b, d), sr = dstr(res, d);
  const w = Math.max(sa.length, sb.length, sr.length);
  const L = (s, sign = ' ') => sign + ' ' + s.padStart(w, ' ').split('').join(' ');
  return { pre: [L(sa), L(sb, op), '  ' + '─'.repeat(w * 2 - 1), L(sr)].join('\n') };
}
/** 竖式：因数末尾有 0 的乘法（课本写法：0 前面的数末位对齐，0 写在右边，最后在积的末尾添 0） */
function vMulZ(a, b) {
  const tz = (s) => s.length - s.replace(/0+$/, '').length;
  const sa = String(a), sb = String(b), za = tz(sa), zb = tz(sb);
  const A = sa.slice(0, sa.length - za), B = sb.slice(0, sb.length - zb), z = za + zb;
  const p = String(+A * +B);
  const bd = B.split('').reverse();
  const parts = bd.length > 1 ? bd.map((d, i) => String(+A * +d) + ' '.repeat(i)) : [];
  const W = Math.max(A.length, B.length + 1, p.length, ...parts.map((s) => s.length));
  const row = (s, zeros, sign = ' ') => sign + ' ' + (s.padStart(W, ' ') + zeros.padEnd(z, ' ')).split('').join(' ').replace(/\s+$/, '');
  const line = '  ' + '─'.repeat((W + z) * 2 - 1);
  const rows = [row(A, '0'.repeat(za)), row(B, '0'.repeat(zb), '×'), line];
  if (parts.length) { parts.forEach((s) => rows.push(row(s, ''))); rows.push(line); }
  rows.push(row(p, '0'.repeat(z)));
  return { pre: rows.join('\n') };
}
// ===== 共用工具结束 =====

// ===== 上册工具 =====
const CNd = '零一二三四五六七八九';
/** 随机 len 位数：带若干个 0，有时个级全是 0 */
function upBig(r, len, tailZero = 0.25) {
  const s = r.until(() => {
    const d = [r.int(1, 9)];
    const zp = r.pick([0.3, 0.45, 0.6]);
    for (let i = 1; i < len; i++) d.push(r.chance(zp) ? 0 : r.int(1, 9));
    if (len >= 6 && r.chance(tailZero)) for (let i = len - 4; i < len; i++) d[i] = 0;
    return d.join('');
  }, (t) => t.includes('0') && /[1-9]/.test(t.slice(1)));
  return Number(s);
}
/** 常见的错误读法：每个 0 都读出来 */
function upNaiveRead(n) {
  const s = String(n), groups = [];
  for (let i = s.length; i > 0; i -= 4) groups.unshift(s.slice(Math.max(0, i - 4), i));
  const lv = ['', '万', '亿'], units = ['千', '百', '十', ''];
  let out = '';
  groups.forEach((g, gi) => {
    const ds = g.padStart(4, '0').split('').map(Number);
    if (ds.every((x) => x === 0)) return;
    let last = 3; while (ds[last] === 0) last--;
    let part = '', started = gi > 0;
    for (let i = 0; i <= last; i++) {
      if (ds[i] === 0) { if (started) part += '零'; continue; }
      started = true; part += CNd[ds[i]] + units[i];
    }
    if (gi === 0 && part.startsWith('一十')) part = part.slice(1);
    out += part + lv[groups.length - 1 - gi];
  });
  return out;
}
/** 读法的干扰项 */
function upWrongReads(n) {
  const right = readInt(n), s = String(n), w = [upNaiveRead(n), right.replace(/零/g, '')];
  for (let i = 0; i < right.length; i++) if (right[i] === '零') w.push(right.slice(0, i) + right.slice(i + 1));
  for (let i = 1; i < s.length; i++) {
    if (s[i] === s[i - 1] || (s[i] !== '0' && s[i - 1] !== '0') || (i === 1 && s[1] === '0')) continue;
    const t = s.split(''); [t[i - 1], t[i]] = [t[i], t[i - 1]]; w.push(readInt(Number(t.join(''))));
  }
  for (let k = 0; k < s.length; k++) if (s[k] !== '0' && s[k] !== '9') { const t = s.split(''); t[k] = String(+t[k] + 1); w.push(readInt(Number(t.join('')))); }
  return uniq(w).filter((x) => x && x !== right);
}
/** 写法的干扰项（少写 / 多写一个 0、相邻两位写反） */
function upWrongWrites(n) {
  const s = String(n), w = [];
  for (let i = 1; i < s.length; i++) if (s[i] === '0') w.push(s.slice(0, i) + s.slice(i + 1));
  for (let i = 1; i < s.length; i++) w.push(s.slice(0, i) + '0' + s.slice(i));
  for (let i = 1; i < s.length; i++) if (s[i] !== s[i - 1] && !(i === 1 && s[1] === '0')) { const t = s.split(''); [t[i - 1], t[i]] = [t[i], t[i - 1]]; w.push(t.join('')); }
  return uniq(w).filter((x) => x !== s);
}
/** 按级拆开：[{name:'亿级', g:'3', level:'亿'}, ...] */
function upGroups(n) {
  const s = String(n), gs = [];
  for (let i = s.length; i > 0; i -= 4) gs.unshift(s.slice(Math.max(0, i - 4), i));
  const names = [['个级', ''], ['万级', '万'], ['亿级', '亿']];
  return gs.map((g, i) => ({ g, name: names[gs.length - 1 - i][0], level: names[gs.length - 1 - i][1], head: i === 0 }));
}
function upReadSteps(n) {
  const gs = upGroups(n);
  const st = [`先分级：${seg4(n)}（从右往左每四位一级：${gs.map((x) => x.name).reverse().join('、')}）`];
  gs.forEach((x) => {
    if (/^0+$/.test(x.g)) { st.push(`${x.name}是 ${x.g}，一个单位也没有，不读`); return; }
    const lead = !x.head && x.g.startsWith('0') ? '，这一级前面有 0，要读一个「零」' : '';
    const tail = /0$/.test(x.g) ? '，末尾的 0 不读' : '';
    st.push(`${x.name} ${x.g} 读作「${readInt(+x.g)}${x.level}」${lead}${tail}`);
  });
  st.push(`合起来读作：${readInt(n)}`);
  return st;
}
function upWriteSteps(n) {
  const gs = upGroups(n);
  const st = [`先按级来写：${gs.map((x) => x.name).join('、')}`];
  gs.forEach((x) => {
    const pad = !x.head && x.g.startsWith('0') ? '（不满四位，前面用 0 补足）' : '';
    st.push(/^0+$/.test(x.g) ? `${x.name}什么也没读到，写 0000` : `${x.name}读的是「${readInt(+x.g)}${x.level}」，写 ${x.g}${pad}`);
  });
  st.push(`哪一位上一个单位也没有，就写 0。写作：${n}`);
  return st;
}

// ---------- 上册配图 ----------
const upP = (cx, cy, ang, rad) => [cx + rad * Math.cos((ang * Math.PI) / 180), cy - rad * Math.sin((ang * Math.PI) / 180)];
const upLine = (a, b, { color = fig.colors.line, w = 3, dash = '' } = {}) => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
/** 从 (cx,cy) 出发、极角 a1 到 a2（逆时针）的小圆弧 */
function upArc(cx, cy, a1, a2, rad, color = fig.colors.acc) {
  const [x1, y1] = upP(cx, cy, a1, rad), [x2, y2] = upP(cx, cy, a2, rad);
  return `<path d="M${x1.toFixed(1)},${y1.toFixed(1)} A${rad},${rad} 0 ${a2 - a1 > 180 ? 1 : 0},0 ${x2.toFixed(1)},${y2.toFixed(1)}" fill="none" stroke="${color}" stroke-width="2"/>`;
}
/** 量角器：角的一边沿底边（fromLeft 时在左边），另一边张开 deg 度；外圈刻度 0 在左，内圈刻度 0 在右 */
function upProtractor(deg, fromLeft) {
  const cx = 200, cy = 200, R = 170, C = fig.colors;
  let s = `<path d="M${cx - R},${cy} A${R},${R} 0 0,1 ${cx + R},${cy} Z" fill="#fffbea" stroke="${C.line}" stroke-width="2"/>`;
  s += `<path d="M${cx - 108},${cy} A108,108 0 0,1 ${cx + 108},${cy}" fill="none" stroke="${C.dash}" stroke-width="1"/>`;
  for (let a = 0; a <= 180; a += 5) {
    s += upLine(upP(cx, cy, a, R), upP(cx, cy, a, R - (a % 10 ? 7 : 13)), { w: 1.2 });
    if (a % 10 === 0) {
      const nudge = a === 0 || a === 180 ? -9 : 0;
      const [ox, oy] = upP(cx, cy, a, R - 25), [ix, iy] = upP(cx, cy, a, R - 47);
      s += fig.text(ox, oy + nudge, 180 - a, { size: 11 }) + fig.text(ix, iy + nudge, a, { size: 10, color: '#2a6fdb' });
    }
  }
  const base = fromLeft ? 180 : 0, other = fromLeft ? 180 - deg : deg;
  s += upLine([cx, cy], upP(cx, cy, base, R + 18), { color: C.acc, w: 3.5 }) + upLine([cx, cy], upP(cx, cy, other, R + 18), { color: C.acc, w: 3.5 });
  s += `<circle cx="${cx}" cy="${cy}" r="4" fill="${C.acc}"/>`;
  return fig.raw(400, 220, s);
}
/** 平角（直线上一点引出一条射线）或直角被一条射线分成 ∠1、∠2 */
function upFigSplit(a, right) {
  const C = fig.colors;
  if (!right) {
    const cx = 170, cy = 150;
    let s = upLine([cx - 150, cy], [cx + 150, cy]) + upLine([cx, cy], upP(cx, cy, a, 130));
    s += upArc(cx, cy, 0, a, 30) + upArc(cx, cy, a, 180, 38, '#2a6fdb');
    s += fig.text(...upP(cx, cy, a / 2, a < 40 ? 66 : 56), '∠1', { size: 16, weight: 'bold', color: C.acc });
    s += fig.text(...upP(cx, cy, (a + 180) / 2, a > 140 ? 66 : 58), '∠2', { size: 16, weight: 'bold', color: '#2a6fdb' });
    s += `<circle cx="${cx}" cy="${cy}" r="3.5" fill="${C.line}"/>` + fig.text(cx, cy + 16, 'O', { size: 14 });
    return fig.raw(340, 175, s);
  }
  const cx = 40, cy = 190;
  let s = upLine([cx, cy], [cx + 190, cy]) + upLine([cx, cy], [cx, cy - 170]) + upLine([cx, cy], upP(cx, cy, a, 180));
  s += `<rect x="${cx}" y="${cy - 14}" width="14" height="14" fill="none" stroke="${C.line}" stroke-width="1.5"/>`;
  s += upArc(cx, cy, 0, a, 44) + upArc(cx, cy, a, 90, 52, '#2a6fdb');
  s += fig.text(...upP(cx, cy, a / 2, 80), '∠1', { size: 16, weight: 'bold', color: C.acc });
  s += fig.text(...upP(cx, cy, (a + 90) / 2, 84), '∠2', { size: 16, weight: 'bold', color: '#2a6fdb' });
  return fig.raw(250, 210, s);
}
/** 从一点引出三条射线，把周角分成 ∠1、∠2、∠3 */
function upFigAround(a1, a2) {
  const cx = 130, cy = 115, C = fig.colors, t0 = 90 - a1 / 2 + 15;
  const rays = [t0, t0 + a1, t0 + a1 + a2];
  let s = rays.map((t) => upLine([cx, cy], upP(cx, cy, t, 100))).join('');
  const mids = [t0 + a1 / 2, t0 + a1 + a2 / 2, t0 + a1 + a2 + (360 - a1 - a2) / 2];
  mids.forEach((m, i) => { s += fig.text(...upP(cx, cy, m, 48), `∠${i + 1}`, { size: 16, weight: 'bold', color: C.acc }); });
  s += `<circle cx="${cx}" cy="${cy}" r="4" fill="${C.line}"/>`;
  return fig.raw(260, 230, s);
}
/** 两条直线相交，四个角按逆时针编号，从 start 号扇形开始标 ∠1、∠2、∠3 */
function upFigCross(a, start) {
  const cx = 160, cy = 110, C = fig.colors;
  let s = upLine(upP(cx, cy, 180, 150), upP(cx, cy, 0, 150)) + upLine(upP(cx, cy, a + 180, 105), upP(cx, cy, a, 105));
  const bounds = [0, a, 180, 180 + a, 360];
  for (let k = 0; k < 3; k++) {
    const i = (start + k) % 4, m = (bounds[i] + bounds[i + 1]) / 2, span = bounds[i + 1] - bounds[i];
    s += fig.text(...upP(cx, cy, m, span < 50 ? 62 : 40), String(k + 1), { size: 17, weight: 'bold', color: C.acc });
  }
  s += `<circle cx="${cx}" cy="${cy}" r="3.5" fill="${C.line}"/>`;
  return fig.raw(320, 220, s);
}
/** 从 O 点引出 n 条射线（数角） */
function upFigFan(n) {
  const cx = 30, cy = 205, C = fig.colors, L = 'ABCDEFG';
  let s = '';
  for (let i = 0; i < n; i++) {
    const t = (i * 80) / (n - 1);
    s += upLine([cx, cy], upP(cx, cy, t, 170));
    s += fig.text(...upP(cx, cy, t, 186), L[i], { size: 15, weight: 'bold' });
  }
  s += `<circle cx="${cx}" cy="${cy}" r="3.5" fill="${C.line}"/>` + fig.text(cx - 12, cy + 8, 'O', { size: 15, weight: 'bold' });
  return fig.raw(250, 225, s);
}
/** 一条线段上有 n 个点（数线段） */
function upFigPoints(n, gaps) {
  const L = 'ABCDEFGH', tot = gaps.reduce((a, b) => a + b, 0);
  let s = '', x = 24;
  const xs = [x];
  gaps.forEach((g) => { x += (g / tot) * 312; xs.push(x); });
  s += upLine([xs[0], 40], [xs[n - 1], 40]);
  xs.forEach((px, i) => { s += `<circle cx="${px.toFixed(1)}" cy="40" r="4" fill="${fig.colors.line}"/>` + fig.text(px, 64, L[i], { size: 15, weight: 'bold' }); });
  return fig.raw(360, 80, s);
}

/** 条形统计图（纵向直条），纵轴每格 step */
function upBarChart(cats, vals, step, unit) {
  const C = fig.colors, G = Math.ceil(Math.max(...vals) / step) + 1;
  const x0 = 58, y0 = 215, ch = 180, gh = ch / G, W = x0 + 30 + cats.length * 72;
  let s = '';
  for (let i = 0; i <= G; i++) {
    const y = y0 - i * gh;
    s += `<line x1="${x0}" y1="${y.toFixed(1)}" x2="${W - 12}" y2="${y.toFixed(1)}" stroke="#d5dbe5" stroke-width="1"/>` + fig.text(x0 - 8, y, i * step, { size: 12, anchor: 'end' });
  }
  s += upLine([x0, y0], [W - 8, y0], { w: 2 }) + upLine([x0, y0], [x0, y0 - ch - 18], { w: 2 }) + fig.text(x0 - 4, 12, `（${unit}）`, { size: 12, anchor: 'end' });
  cats.forEach((c, i) => {
    const x = x0 + 22 + i * 72, h = (vals[i] / step) * gh;
    s += `<rect x="${x}" y="${(y0 - h).toFixed(1)}" width="36" height="${h.toFixed(1)}" fill="${C.fill}" stroke="${C.line}" stroke-width="1.5"/>` + fig.text(x + 18, y0 + 16, c, { size: 13 });
  });
  return fig.raw(W, 240, s);
}

// ---------- 上册：除法讲解 ----------
/** 两位数除数的试商（一位商）：把除数四舍五入看成整十数，商大了改小，商小了改大 */
function upTrial(part, d) {
  const o = d % 10, D = o < 5 ? d - o : d + 10 - o;
  const q0 = Math.max(1, Math.min(9, Math.floor(part / D)));
  const lines = [`把 ${d} 看作 ${D} 来试商（${o < 5 ? '四舍' : '五入'}）：想 ${D} 乘几接近 ${part}，试商 ${q0}`];
  let q = q0;
  while (q * d > part) { lines.push(`${d} × ${q} = ${q * d}，比 ${part} 大，商大了，改商 ${q - 1}`); q--; }
  while (part - q * d >= d) { lines.push(`${d} × ${q} = ${q * d}，${part} - ${q * d} = ${part - q * d}，不比 ${d} 小，商小了，改商 ${q + 1}`); q++; }
  lines.push(`${d} × ${q} = ${q * d}，${part} - ${q * d} = ${part - q * d}，比 ${d} 小，商 ${q} 合适`);
  return { D, q0, q, lines, adjusted: q !== q0 };
}
/** 多位数除以两位数：每一位商怎么来的（一行一位） */
function upDivSteps(n, d) {
  const ds = String(n).split('').map(Number), len = ds.length, st = [];
  const f2 = Number(String(n).slice(0, String(d).length));
  if (f2 >= d) st.push(`先用被除数的前 ${String(d).length} 位 ${f2} 除以 ${d}，够除，商写在${PLACE[len - String(d).length]}位上`);
  else st.push(`被除数的前 ${String(d).length} 位 ${f2} 比 ${d} 小，要看前 ${String(d).length + 1} 位 ${Number(String(n).slice(0, String(d).length + 1))}，商写在${PLACE[len - String(d).length - 1]}位上`);
  let cur = 0, started = false;
  for (let i = 0; i < len; i++) {
    cur = cur * 10 + ds[i];
    if (!started && cur < d && i < len - 1) continue;
    started = true;
    const q = Math.floor(cur / d);
    st.push(q === 0 ? `落下 ${ds[i]}，${cur} 比 ${d} 小，不够商 1，在${PLACE[len - 1 - i]}位上商 0` : `${cur} ÷ ${d}，商 ${q}：${d} × ${q} = ${q * d}，余 ${cur - q * d}`);
    cur -= q * d;
  }
  return st;
}
const upDivAns = (n, d) => { const q = Math.floor(n / d), m = n % d; return m ? [num(q, '', '商'), num(m, '', '余数')] : [num(q)]; };
const upDivQ = (n, d) => (n % d ? `${n} ÷ ${d} = {0} …… {1}` : `${n} ÷ ${d} = {0}`);
const upCheck = (n, d) => { const q = Math.floor(n / d), m = n % d; return `验算：${q} × ${d}${m ? ` + ${m}` : ''} = ${n} ✓`; };

// ===== 上册题型 =====
const UPPER = [
  // ---------- 大数的认识 ----------
  {
    id: 'g4a-bignum-read-wan', grade: 4, term: 1, unit: '大数的认识', name: '亿以内数的读法',
    tip: '先分级，从高位读起；读完万级加「万」；每级末尾的 0 不读，中间连续几个 0 只读一个零', level: 1,
    gen(r) {
      const n = upBig(r, r.int(5, 8));
      return { q: `${n} 读作：{0}`, answer: [choice(r, readInt(n), upWrongReads(n))], steps: upReadSteps(n), hint: '从个位起，每四位分一级' };
    },
  },
  {
    id: 'g4a-bignum-write-wan', grade: 4, term: 1, unit: '大数的认识', name: '亿以内数的写法',
    tip: '先写万级再写个级，哪一位一个单位也没有就写 0', level: 1,
    gen(r) {
      const n = upBig(r, r.int(5, 8));
      return { q: `${readInt(n)}\n写作：{0}`, answer: [choice(r, n, upWrongWrites(n))], steps: upWriteSteps(n), hint: '个级一定要写满四位' };
    },
  },
  {
    id: 'g4a-bignum-read-yi', grade: 4, term: 1, unit: '大数的认识', name: '亿以上数的读法',
    tip: '先读亿级加「亿」，再读万级加「万」，最后读个级', level: 1,
    gen(r) {
      const n = upBig(r, r.int(9, 12));
      return { q: `${n} 读作：{0}`, answer: [choice(r, readInt(n), upWrongReads(n))], steps: upReadSteps(n), hint: '先分级：个级、万级、亿级' };
    },
  },
  {
    id: 'g4a-bignum-write-yi', grade: 4, term: 1, unit: '大数的认识', name: '亿以上数的写法',
    tip: '按亿级、万级、个级依次写，万级和个级都要写满四位', level: 1,
    gen(r) {
      const n = upBig(r, r.int(9, 12));
      return { q: `${readInt(n)}\n写作：{0}`, answer: [choice(r, n, upWrongWrites(n))], steps: upWriteSteps(n), hint: '「亿」后面还有八位' };
    },
  },
  {
    id: 'g4a-place-value', grade: 4, term: 1, unit: '大数的认识', name: '数位和计数单位',
    tip: '从右往左数：个、十、百、千、万、十万、百万、千万、亿……数位后面不带「位」字就是计数单位', level: 1,
    gen(r) {
      const len = r.int(6, 11);
      const { n, p, d } = r.until(() => {
        const n = upBig(r, len, 0); const s = String(n); const p = r.int(Math.max(3, len - 5), len - 1);
        return { n, p, d: s[len - 1 - p] };
      }, (o) => o.d !== '0' && String(o.n).split('').filter((c) => c === o.d).length === 1);
      const near = [p - 2, p - 1, p + 1, p + 2].filter((k) => k >= 0 && k < PLACE.length);
      return {
        q: `${n} 中的数字 ${d} 在 {0} 上，表示 ${d} 个 {1}`,
        answer: [choice(r, PLACE[p] + '位', near.map((k) => PLACE[k] + '位')), choice(r, UNIT[p], near.map((k) => UNIT[k]))],
        steps: [`先分级：${seg4(n)}`, `从右往左数，${d} 在第 ${p + 1} 位`, `第 ${p + 1} 位是${PLACE[p]}位，计数单位是「${UNIT[p]}」`, `所以 ${d} 在${PLACE[p]}位上，表示 ${d} 个${UNIT[p]}`],
        hint: '个位是第 1 位，从右往左数',
      };
    },
  },
  {
    id: 'g4a-bignum-compose', grade: 4, term: 1, unit: '大数的认识', name: '大数的组成',
    tip: '几个「万」就看万级，几个「一」就看个级；哪一位没有就写 0', level: 1,
    gen(r) {
      if (r.bool()) {
        const k = r.int(2, 4);
        const ps = r.sample([3, 4, 5, 6, 7, 8, 9, 10].filter((x) => x < 11), k).sort((a, b) => b - a);
        const ds = ps.map(() => r.int(1, 9));
        const n = ps.reduce((s, p, i) => s + ds[i] * 10 ** p, 0);
        const desc = ps.map((p, i) => `${ds[i]} 个${UNIT[p]}`).join('、');
        return {
          q: `由 ${desc}组成的数是 {0}`, answer: [num(n)],
          steps: [`最高的计数单位是${UNIT[ps[0]]}，所以最高位是${PLACE[ps[0]]}位，这是一个 ${ps[0] + 1} 位数`, ...ps.map((p, i) => `${PLACE[p]}位上写 ${ds[i]}`), `其余数位上一个单位也没有，都写 0`, `这个数是 ${n}（分级看：${seg4(n)}）`],
          hint: '先确定最高位是哪一位',
        };
      }
      const yi = r.chance(0.35);
      const n = upBig(r, yi ? r.int(9, 11) : r.int(6, 8), 0);
      if (!yi) {
        const hi = Math.floor(n / 10000), lo = n % 10000;
        return {
          q: `${n} 是由 {0} 个万和 {1} 个一组成的`, answer: [num(hi), num(lo)],
          steps: [`分级：${seg4(n)}`, `万级上是 ${hi}，表示 ${hi} 个万`, `个级上是 ${String(lo).padStart(4, '0')}，表示 ${lo} 个一`],
          hint: '先分级',
        };
      }
      const a = Math.floor(n / 1e8), b = Math.floor(n / 1e4) % 1e4, c = n % 1e4;
      return {
        q: `${n} 是由 {0} 个亿、{1} 个万和 {2} 个一组成的`, answer: [num(a), num(b), num(c)],
        steps: [`分级：${seg4(n)}`, `亿级上是 ${a}，表示 ${a} 个亿`, `万级上是 ${String(b).padStart(4, '0')}，表示 ${b} 个万`, `个级上是 ${String(c).padStart(4, '0')}，表示 ${c} 个一`],
        hint: '先分级',
      };
    },
  },
  {
    id: 'g4a-unit-relation', grade: 4, term: 1, unit: '大数的认识', name: '计数单位之间的进率',
    tip: '相邻两个计数单位之间的进率都是十：10 个一万是十万，10 个一千万是一亿', level: 1,
    gen(r) {
      if (r.bool()) {
        const i = r.int(4, 9), j = r.int(Math.max(1, i - 4), i - 1);
        const v = 10 ** (i - j);
        return {
          q: `1 ${UNIT[i]}里面有 {0} 个${UNIT[j]}`, answer: [num(v)],
          steps: [`相邻两个计数单位之间的进率是十`, `从${UNIT[j]}到${UNIT[i]}相隔 ${i - j} 个数位，要乘 ${i - j} 个 10`, `所以 1 ${UNIT[i]}里面有 ${v} 个${UNIT[j]}`],
          hint: '数一数相隔几个数位',
        };
      }
      const j = r.int(3, 8), k = r.chance(0.3) ? r.pick([10, 100]) : r.int(2, 99), v = k * 10 ** j;
      return {
        q: `${k} 个${UNIT[j]}是 {0}`, answer: [num(v)],
        steps: [`${UNIT[j]}是${PLACE[j]}位上的计数单位`, `${k} 个${UNIT[j]}：把 ${k} 的个位写在${PLACE[j]}位上，后面的 ${j} 个数位都写 0`, `是 ${v}（分级看：${seg4(v)}）`],
        hint: `${UNIT[j]}后面有几个 0？`,
      };
    },
  },
  {
    id: 'g4a-rewrite-wan', grade: 4, term: 1, unit: '大数的认识', name: '改写成用「万」作单位',
    tip: '整万数去掉个级的四个 0，再写上「万」字', level: 1,
    gen(r) {
      const k = r.chance(0.3) ? r.int(2, 999) * 10 : r.int(2, 9999), n = k * 10000;
      return {
        q: `把 ${n} 改写成用「万」作单位的数：${n} = {0}`, answer: [num(k, '万')],
        steps: [`分级：${seg4(n)}，个级是 0000`, `去掉个级的四个 0，在后面写上「万」字`, `${n} = ${k}万`, `注意：改写用「=」，大小没有变`],
        hint: '个级上的 0 有几个？',
      };
    },
  },
  {
    id: 'g4a-rewrite-yi', grade: 4, term: 1, unit: '大数的认识', name: '改写成用「亿」作单位',
    tip: '整亿数去掉末尾的八个 0（万级、个级），再写上「亿」字', level: 1,
    gen(r) {
      const k = r.chance(0.3) ? r.int(2, 99) * 10 : r.int(2, 999), n = k * 1e8;
      return {
        q: `把 ${n} 改写成用「亿」作单位的数：${n} = {0}`, answer: [num(k, '亿')],
        steps: [`分级：${seg4(n)}，万级和个级都是 0000`, `去掉末尾的八个 0，在后面写上「亿」字`, `${n} = ${k}亿`],
        hint: '「亿」后面有几个 0？',
      };
    },
  },
  {
    id: 'g4a-approx-wan', grade: 4, term: 1, unit: '大数的认识', name: '省略万位后面的尾数',
    tip: '看千位：小于 5 就舍去，大于或等于 5 就向万位进 1，再写上「万」', level: 1,
    gen(r) {
      const n = r.until(() => {
        const len = r.int(6, 9);
        let n = upBig(r, len, 0);
        if (r.chance(0.2)) n = Math.floor(n / 1e5) * 1e5 + 99000 + r.int(1, 999) + (r.bool() ? 500 : -4000); // 进位后连着进
        return n;
      }, (n) => n % 10000 !== 0 && n >= 100000 && String(n).length <= 9);
      const t = Math.floor(n / 1000) % 10, k = Math.round(n / 10000);
      return {
        q: `把 ${n} 省略万位后面的尾数：${n} ≈ {0}`, answer: [num(k, '万')],
        steps: [`分级：${seg4(n)}，万位后面的尾数是 ${String(n % 10000).padStart(4, '0')}`, `看千位上的数：${t}`, t >= 5 ? `${t} ≥ 5，要向万位进 1（五入）` : `${t} < 5，尾数全部舍去（四舍）`, `${n} ≈ ${k}万`, '求近似数用「≈」，别忘了写「万」'],
        hint: '省略万位后面的尾数，要看哪一位？',
      };
    },
  },
  {
    id: 'g4a-approx-yi', grade: 4, term: 1, unit: '大数的认识', name: '省略亿位后面的尾数',
    tip: '看千万位：小于 5 就舍去，大于或等于 5 就向亿位进 1，再写上「亿」', level: 1,
    gen(r) {
      const n = r.until(() => {
        let n = upBig(r, r.int(9, 12), 0);
        if (r.chance(0.2)) n = Math.floor(n / 1e9) * 1e9 + 9.5e8 + r.int(1, 4e7);
        return n;
      }, (n) => n % 1e8 !== 0 && String(n).length >= 9 && String(n).length <= 12);
      const t = Math.floor(n / 1e7) % 10, k = Math.round(n / 1e8);
      return {
        q: `把 ${n} 省略亿位后面的尾数：${n} ≈ {0}`, answer: [num(k, '亿')],
        steps: [`分级：${seg4(n)}，亿位后面有万级和个级八位`, `看千万位上的数：${t}`, t >= 5 ? `${t} ≥ 5，要向亿位进 1（五入）` : `${t} < 5，尾数全部舍去（四舍）`, `${n} ≈ ${k}亿`],
        hint: '省略亿位后面的尾数，要看哪一位？',
      };
    },
  },
  {
    id: 'g4a-compare-big', grade: 4, term: 1, unit: '大数的认识', name: '大数比大小',
    tip: '先比位数，位数多的大；位数相同，从最高位比起，第一个不同的数位上谁大谁就大', level: 1,
    gen(r) {
      const len = r.int(6, 11);
      const a = upBig(r, len, 0.1);
      let b, why;
      if (r.chance(0.3)) {
        b = upBig(r, len + r.pick([-1, 1]), 0.1);
        why = [`${a} 是 ${len} 位数，${b} 是 ${String(b).length} 位数`, `位数多的数大`];
      } else {
        const s = String(a), k = r.int(0, Math.min(len - 1, 5));
        b = r.until(() => {
          const t = s.split('');
          t[k] = String(r.int(k === 0 ? 1 : 0, 9));
          for (let i = k + 1; i < len; i++) if (r.chance(0.6)) t[i] = String(r.int(0, 9));
          return Number(t.join(''));
        }, (x) => x !== a && String(x).length === len && String(x)[k] !== s[k]);
        const pl = PLACE[len - 1 - k];
        why = [`两个数都是 ${len} 位数，从最高位比起`, k === 0 ? `最高位（${pl}位）上：${s[0]} 和 ${String(b)[0]}` : `前面的数位都相同，比到${pl}位：${s[k]} 和 ${String(b)[k]}`];
      }
      const [x, y] = r.bool() ? [a, b] : [b, a];
      return {
        q: `${x} {0} ${y}`, answer: [cmpAns(x, y)],
        steps: [`分级看：${seg4(x)} 和 ${seg4(y)}`, ...why, `所以 ${x} ${cmp(x, y)} ${y}`],
        hint: '先数一数各是几位数',
      };
    },
  },
  {
    id: 'g4a-compare-unit', grade: 4, term: 1, unit: '大数的认识', name: '带万、亿的数比大小',
    tip: '先把单位统一（都化成用「万」作单位，或都写成数），再比', level: 2,
    gen(r) {
      const f = r.int(0, 2);
      if (f === 0) {
        const k = r.int(12, 9999), m = r.pick([k * 10000, k * 10000 + r.pick([1, -1]) * r.pick([1, 10, 100, 1000, 5000]), k * 1000, k * 100000]);
        const [l, rt, lv, rv] = r.bool() ? [`${k}万`, `${m}`, k * 10000, m] : [`${m}`, `${k}万`, m, k * 10000];
        return { q: `${l} {0} ${rt}`, answer: [cmpAns(lv, rv)], steps: [`${k}万 = ${k * 10000}`, `比较 ${lv} 和 ${rv}：${seg4(lv)} 和 ${seg4(rv)}`, `所以 ${l} ${cmp(lv, rv)} ${rt}`], hint: `${k}万后面添几个 0？` };
      }
      if (f === 1) {
        const k = r.int(2, 99), w = r.pick([k * 10000, k * 10000 - r.pick([1, 10, 100, 1000]), k * 10000 + r.pick([1, 10, 100]), k * 1000]);
        const [l, rt, lv, rv] = r.bool() ? [`${k}亿`, `${w}万`, k * 10000, w] : [`${w}万`, `${k}亿`, w, k * 10000];
        return { q: `${l} {0} ${rt}`, answer: [cmpAns(lv, rv)], steps: [`1 亿 = 10000 万，所以 ${k}亿 = ${k * 10000}万`, `比较 ${lv}万 和 ${rv}万`, `所以 ${l} ${cmp(lv, rv)} ${rt}`], hint: '1 亿是多少万？' };
      }
      const k = r.int(2, 99), m = r.pick([k * 1e8, k * 1e8 + r.pick([1, -1]) * r.pick([1, 1000, 1e6]), k * 1e7]);
      const [l, rt, lv, rv] = r.bool() ? [`${k}亿`, `${m}`, k * 1e8, m] : [`${m}`, `${k}亿`, m, k * 1e8];
      return { q: `${l} {0} ${rt}`, answer: [cmpAns(lv, rv)], steps: [`${k}亿 = ${k * 1e8}（后面有八个 0）`, `比较 ${seg4(lv)} 和 ${seg4(rv)}`, `所以 ${l} ${cmp(lv, rv)} ${rt}`], hint: '先把单位统一' };
    },
  },
  {
    id: 'g4a-box-approx', grade: 4, term: 1, unit: '大数的认识', name: '近似数里 □ 能填几',
    tip: '找到决定四舍五入的那一位：舍去说明它是 0~4，进 1 说明它是 5~9', level: 2,
    gen(r) {
      const yi = r.chance(0.25), U = yi ? '亿' : '万', base = yi ? 1e8 : 1e4, dp = yi ? '千万位' : '千位', up = yi ? '亿位' : '万位';
      if (r.chance(0.65)) {
        const P = r.int(yi ? 2 : 12, yi ? 99 : 999), restLen = yi ? 7 : 3;
        const rest = String(r.int(0, 10 ** restLen - 1)).padStart(restLen, '0');
        const down = r.bool(), wantMax = down ? r.chance(0.75) : r.chance(0.25);
        const k = down ? P : P + 1, ans = down ? (wantMax ? 4 : 0) : (wantMax ? 9 : 5);
        return {
          q: `${P}□${rest} ≈ ${k}${U}，□ 里${wantMax ? '最大' : '最小'}能填几？{0}`, answer: [num(ans)],
          steps: [`省略${up}后面的尾数，要看${dp}，□ 正好在${dp}上`, down ? `近似数是 ${k}${U}，${up}上的数没变，说明尾数被舍去了（四舍）` : `近似数是 ${k}${U}，比 ${P}${U} 多 1，说明向${up}进了 1（五入）`, down ? '所以 □ 里只能填 0、1、2、3、4' : '所以 □ 里只能填 5、6、7、8、9', `${wantMax ? '最大' : '最小'}能填 ${ans}`],
          hint: `□ 在哪一位？${U}位上的数变了没有？`,
        };
      }
      const P1 = r.int(1, yi ? 9 : 99), t = r.int(0, 9), x = t >= 5 && r.bool() ? 9 : r.int(0, 9);
      const restLen = yi ? 7 : 3, rest = String(r.int(0, 10 ** restLen - 1)).padStart(restLen, '0');
      const N = P1 * 10 + x, k = t >= 5 ? N + 1 : N;
      return {
        q: `${P1}□${t}${rest} ≈ ${k}${U}，□ 里填 {0}`, answer: [num(x)],
        steps: [`省略${up}后面的尾数，要看${dp}上的数：${t}`, t >= 5 ? `${t} ≥ 5，要向${up}进 1` : `${t} < 5，尾数舍去，${up}上的数不变`, t >= 5 ? `所以 ${P1}□ 加 1 得 ${k}，${P1}□ = ${N}` : `所以 ${P1}□ 就是 ${k}`, `□ 里填 ${x}`],
        hint: `先看${dp}上的数，是四舍还是五入？`,
      };
    },
  },
  {
    id: 'g4a-box-compare', grade: 4, term: 1, unit: '大数的认识', name: '比大小时 □ 能填几',
    tip: '前面数位相同就比 □ 那一位；□ 填和对方一样的数时，还要接着比后面的数位', level: 2,
    gen(r) {
      const len = r.int(6, 9);
      const o = r.until(() => {
        const B = String(upBig(r, len, 0)), k = r.int(1, len - 2);
        const A = B.slice(0, k) + '□' + Array.from({ length: len - k - 1 }, () => r.int(0, 9)).join('');
        const big = r.bool(), wantMax = !big;
        const ok = [];
        for (let d = 0; d <= 9; d++) { const v = Number(A.replace('□', d)); if (big ? v > +B : v < +B) ok.push(d); }
        return { A, B, k, big, wantMax, ok };
      }, (o) => o.ok.length >= 1 && o.ok.length <= 9 && o.B[o.k] !== '0' && o.B[o.k] !== '9');
      const { A, B, k, big, wantMax, ok } = o;
      const ans = wantMax ? Math.max(...ok) : Math.min(...ok);
      const bd = +B[k], restA = A.slice(k + 1), restB = B.slice(k + 1);
      const eqOk = big ? +restA > +restB : +restA < +restB;
      const sym = big ? '>' : '<';
      return {
        q: `${A} ${sym} ${B}，□ 里${wantMax ? '最大' : '最小'}能填几？{0}`, answer: [num(ans)],
        steps: [`两个数位数相同，前面的数位都一样，要比 □ 所在的${PLACE[len - 1 - k]}位`, `${B} 的${PLACE[len - 1 - k]}位上是 ${bd}`, `如果 □ 填 ${bd}，再比后面：${restA} ${cmp(+restA, +restB)} ${restB}，${eqOk ? `左边${big ? '大' : '小'}，可以填 ${bd}` : `不满足「${sym}」，不能填 ${bd}`}`, `所以 □ 里能填 ${ok.join('、')}`, `${wantMax ? '最大' : '最小'}能填 ${ans}`],
        hint: `先试试 □ 里填 ${bd} 行不行`,
      };
    },
  },
  {
    id: 'g4a-approx-reverse', grade: 4, term: 1, unit: '大数的认识', name: '由近似数求原数最大最小',
    tip: '最大：四舍，舍去的尾数最大是 4999…；最小：五入，前一位少 1、尾数最小是 5000…', level: 2,
    gen(r) {
      const yi = r.chance(0.25);
      const c = yi ? { len: 9, k: r.int(2, 9), base: 1e8, U: '亿', up: '亿位', dp: '千万位' } : (() => { const len = r.int(5, 7); const k = len === 5 ? r.int(2, 9) : len === 6 ? r.int(11, 99) : r.int(101, 999); return { len, k, base: 1e4, U: '万', up: '万位', dp: '千位' }; })();
      const half = c.base / 2, max = c.k * c.base + half - 1, min = (c.k - 1) * c.base + half;
      const cn = '零一二三四五六七八九十'[c.len] || c.len;
      return {
        q: `一个${cn}位数，省略${c.up}后面的尾数约是 ${c.k}${c.U}。这个数最大是 {0}，最小是 {1}`,
        answer: [num(max, '', '最大'), num(min, '', '最小')],
        steps: [`最大：用「四舍」得到 ${c.k}${c.U}，${c.up}及以上就是 ${c.k}，${c.dp}最大是 4，后面都是 9`, `最大是 ${max}`, `最小：用「五入」得到 ${c.k}${c.U}，原来${c.up}及以上是 ${c.k - 1}，${c.dp}最小是 5，后面都是 0`, `最小是 ${min}`],
        hint: '分别想「四舍」和「五入」两种情况',
      };
    },
  },
  {
    id: 'g4a-digits-arrange', grade: 4, term: 1, unit: '大数的认识', name: '用数字卡片组成最大最小数',
    tip: '最大：从大到小排；最小：最高位放最小的非 0 数字，其余从小到大排', level: 2,
    gen(r) {
      const n = r.int(6, 8), zeros = r.int(1, 3);
      const ds = [...Array(zeros).fill(0), ...Array.from({ length: n - zeros }, () => r.int(1, 9))];
      const cards = r.shuffle(ds), wantMax = r.bool();
      const desc = ds.slice().sort((a, b) => b - a), asc = ds.slice().sort((a, b) => a - b);
      const firstNZ = asc.find((x) => x > 0);
      const minArr = [firstNZ, ...asc.filter((_, i) => i !== asc.indexOf(firstNZ))];
      const v = Number((wantMax ? desc : minArr).join(''));
      const cn = '零一二三四五六七八九'[n];
      return {
        q: `用 ${cards.join('、')} 这 ${n} 张数字卡片，组成${wantMax ? '最大' : '最小'}的${cn}位数是 {0}`, answer: [num(v)],
        steps: wantMax
          ? ['要最大，大的数字放在高位', `从大到小排：${desc.join('、')}`, `0 都放在最后面`, `最大的${cn}位数是 ${v}`]
          : ['要最小，小的数字放在高位', '但 0 不能放在最高位，否则就不是' + cn + '位数了', `最高位放最小的非 0 数字 ${firstNZ}，其余从小到大排：${minArr.slice(1).join('、')}`, `最小的${cn}位数是 ${v}`],
        hint: wantMax ? '大数字放高位' : '0 能放在最高位吗？',
      };
    },
  },

  {
    id: 'g4a-calc-pattern', grade: 4, term: 1, unit: '大数的认识', name: '用计算器找规律',
    tip: '先用计算器算出前几个，看看因数怎么变、积（结果）跟着怎么变，再照规律直接写', level: 2,
    gen(r) {
      const f = r.int(0, 6);
      const rep = (c, k) => String(c).repeat(k);
      let rows, ask, ans, rule;
      if (f === 0) {
        const n = r.int(4, 7), row = (k) => `${'987654321'.slice(0, k)} × 9 + ${8 - k} = ${rep(8, k + 1)}`;
        rows = [1, 2, 3].map(row); ask = `${'987654321'.slice(0, n)} × 9 + ${8 - n}`; ans = Number(rep(8, n + 1));
        rule = `第一个数每次多写一位（9、98、987……），加的数每次少 1，得数是一串 8，8 的个数比第一个数的位数多 1`;
      } else if (f === 1) {
        const n = r.int(4, 8), row = (k) => `${'123456789'.slice(0, k)} × 9 + ${k + 1} = ${rep(1, k + 1)}`;
        rows = [1, 2, 3].map(row); ask = `${'123456789'.slice(0, n)} × 9 + ${n + 1}`; ans = Number(rep(1, n + 1));
        rule = '第一个数是 1、12、123……，加的数比它的位数多 1，得数是一串 1，1 的个数也比位数多 1';
      } else if (f === 2) {
        const n = r.int(4, 8), row = (k) => `${rep(1, k)} × ${rep(1, k)} = ${Number(rep(1, k)) ** 2}`;
        rows = [1, 2, 3].map(row); ask = `${rep(1, n)} × ${rep(1, n)}`; ans = Number(rep(1, n)) ** 2;
        rule = `几个 1 乘几个 1，得数从 1 写到这个个数再倒回 1：${n} 个 1 就是 ${ans}`;
      } else if (f === 3) {
        const k = r.int(4, 9);
        rows = [1, 2, 3].map((j) => `37 × ${3 * j} = ${rep(j, 3)}`); ask = `37 × ${3 * k}`; ans = Number(rep(k, 3));
        rule = `第二个因数是 3 的几倍，得数就是三个几：${3 * k} = 3 × ${k}，得数是 ${ans}`;
      } else if (f === 4) {
        const k = r.int(4, 9);
        rows = [1, 2, 3].map((j) => `15873 × ${7 * j} = ${rep(j, 6)}`); ask = `15873 × ${7 * k}`; ans = Number(rep(k, 6));
        rule = `第二个因数是 7 的几倍，得数就是六个几：${7 * k} = 7 × ${k}，得数是 ${ans}`;
      } else if (f === 5) {
        const k = r.int(4, 9);
        rows = [1, 2, 3].map((j) => `12345679 × ${9 * j} = ${rep(j, 9)}`); ask = `12345679 × ${9 * k}`; ans = Number(rep(k, 9));
        rule = `第二个因数是 9 的几倍，得数就是九个几：${9 * k} = 9 × ${k}，得数是 ${ans}`;
      } else {
        const xs = r.sample(Array.from({ length: 89 }, (_, i) => i + 11).filter((x) => x % 10 !== 0), 4);
        const big = r.chance(0.4), m = big ? 1001 : 101;
        const ys = big ? xs.map((x) => x * 10 + r.int(1, 9)) : xs;
        rows = ys.slice(0, 3).map((y) => `${y} × ${m} = ${y * m}`); ask = `${ys[3]} × ${m}`; ans = ys[3] * m;
        rule = `一个${big ? '三' : '两'}位数乘 ${m}，得数就是把这个数连着写两遍：${ys[3]}${ys[3]}`;
      }
      return {
        q: `先用计算器算一算，找出规律：\n${rows.join('\n')}\n照这样的规律，${ask} = {0}`, answer: [num(ans)],
        steps: ['看前几个算式，对比因数和得数的变化', rule, `所以 ${ask} = ${ans}`],
        hint: '每一行和上一行比，哪里变了？',
      };
    },
  },

  // ---------- 公顷和平方千米 ----------
  {
    id: 'g4a-area-convert', grade: 4, term: 1, unit: '公顷和平方千米', name: '公顷、平方千米换算',
    tip: '1 公顷 = 10000 平方米，1 平方千米 = 100 公顷 = 1000000 平方米；大化小乘进率，小化大除以进率', level: 1,
    gen(r) {
      const f = r.int(0, 5);
      const k = f >= 4 ? r.int(2, 30) : r.chance(0.2) ? r.int(1, 9) * 10 : r.int(2, 99);
      const T = [
        [`${k} 公顷 = {0}`, k * 10000, '平方米', '1 公顷 = 10000 平方米', `公顷化成平方米，是大单位化小单位，乘进率 10000`, `${k} × 10000 = ${k * 10000}`],
        [`${k * 10000} 平方米 = {0}`, k, '公顷', '1 公顷 = 10000 平方米', `平方米化成公顷，是小单位化大单位，除以进率 10000`, `${k * 10000} ÷ 10000 = ${k}`],
        [`${k} 平方千米 = {0}`, k * 100, '公顷', '1 平方千米 = 100 公顷', `平方千米化成公顷，乘进率 100`, `${k} × 100 = ${k * 100}`],
        [`${k * 100} 公顷 = {0}`, k, '平方千米', '1 平方千米 = 100 公顷', `公顷化成平方千米，除以进率 100`, `${k * 100} ÷ 100 = ${k}`],
        [`${k} 平方千米 = {0}`, k * 1e6, '平方米', '1 平方千米 = 1000000 平方米（边长 1000 米的正方形，1000 × 1000）', `平方千米化成平方米，乘进率 1000000`, `${k} × 1000000 = ${k * 1e6}`],
        [`${k * 1e6} 平方米 = {0}`, k, '平方千米', '1 平方千米 = 1000000 平方米', `平方米化成平方千米，除以进率 1000000`, `${k * 1e6} ÷ 1000000 = ${k}`],
      ][f];
      return { q: T[0], answer: [num(T[1], T[2])], steps: [T[3], T[4], T[5]], hint: '先想这两个单位之间的进率是多少' };
    },
  },
  {
    id: 'g4a-area-compound', grade: 4, term: 1, unit: '公顷和平方千米', name: '面积单位的复名数换算',
    tip: '拆成两部分：大单位那部分先化好，再和小单位那部分合起来', level: 2,
    gen(r) {
      const f = r.int(0, 3), a = r.int(1, 9);
      if (f === 0 || f === 2) {
        const b = r.pick([r.int(1, 9) * 1000, r.int(1, 99) * 100, r.int(10, 9999)]), N = a * 10000 + b;
        if (f === 0) return { q: `${a} 公顷 ${b} 平方米 = {0}`, answer: [num(N, '平方米')], steps: ['1 公顷 = 10000 平方米', `${a} 公顷 = ${a * 10000} 平方米`, `${a * 10000} + ${b} = ${N}（平方米）`], hint: '先把公顷化成平方米' };
        return { q: `${N} 平方米 = {0} 公顷 {1} 平方米`, answer: [num(a), num(b)], steps: ['1 公顷 = 10000 平方米', `${N} 里面有 ${a} 个 10000，就是 ${a} 公顷`, `还剩 ${N} - ${a * 10000} = ${b}（平方米）`, `${N} 平方米 = ${a} 公顷 ${b} 平方米`], hint: '看看里面有几个 10000' };
      }
      const b = r.int(1, 99), N = a * 100 + b;
      if (f === 1) return { q: `${a} 平方千米 ${b} 公顷 = {0}`, answer: [num(N, '公顷')], steps: ['1 平方千米 = 100 公顷', `${a} 平方千米 = ${a * 100} 公顷`, `${a * 100} + ${b} = ${N}（公顷）`], hint: '先把平方千米化成公顷' };
      return { q: `${N} 公顷 = {0} 平方千米 {1} 公顷`, answer: [num(a), num(b)], steps: ['1 平方千米 = 100 公顷', `${N} 里面有 ${a} 个 100，就是 ${a} 平方千米`, `还剩 ${N} - ${a * 100} = ${b}（公顷）`], hint: '看看里面有几个 100' };
    },
  },
  {
    id: 'g4a-area-unit-choose', grade: 4, term: 1, unit: '公顷和平方千米', name: '填合适的面积单位',
    tip: '想一想实物有多大：课桌面用平方分米，教室用平方米，校园、公园用公顷，城市用平方千米', level: 1, pool: 18,
    gen(r) {
      const items = [
        ['一枚邮票的面积约是 6', '平方厘米', '邮票很小，比手掌还小'],
        ['一块橡皮最大的面约是 8', '平方厘米', '比 1 平方分米小得多'],
        ['课桌桌面的面积约是 24', '平方分米', '长约 6 分米、宽约 4 分米'],
        ['数学课本封面的面积约是 5', '平方分米', '一本书的封面比 1 平方米小得多，比 1 平方厘米大得多'],
        ['一间教室地面的面积约是 60', '平方米', '长约 9 米、宽约 7 米'],
        ['一块黑板的面积约是 4', '平方米', '长约 4 米、宽约 1 米'],
        ['一间卧室的面积约是 15', '平方米', '房间用平方米'],
        ['一个标准足球场的面积约是 7000', '平方米', '长约 105 米、宽约 68 米；数比较大，用平方米'],
        ['一所小学的占地面积约是 3', '公顷', '校园比教室大得多，边长 100 米的正方形是 1 公顷'],
        ['天安门广场的面积约是 44', '公顷', '广场、公园这样大的地方用公顷'],
        ['故宫的占地面积约是 72', '公顷', '故宫比一个学校大很多，用公顷'],
        ['颐和园的占地面积约是 290', '公顷', '公园用公顷'],
        ['国家体育场「鸟巢」的占地面积约是 21', '公顷', '比足球场大得多'],
        ['奥林匹克森林公园的面积约是 680', '公顷', '公园用公顷'],
        ['北京市的面积约是 16410', '平方千米', '一个城市的面积用平方千米'],
        ['北京市朝阳区的面积约是 470', '平方千米', '一个区的面积也很大，用平方千米'],
        ['我国的陆地面积约是 960 万', '平方千米', '国土面积用平方千米'],
        ['一个农场的面积约是 200', '公顷', '农田、果园、农场常用公顷'],
      ];
      const [q, u, why] = r.pick(items);
      return {
        q: `${q} {0}`, answer: [choice(r, u, ['平方厘米', '平方分米', '平方米', '公顷', '平方千米'])],
        steps: [why, `所以填「${u}」`, '记住：边长 100 米的正方形面积是 1 公顷，边长 1000 米的正方形面积是 1 平方千米'],
        hint: '想一想它实际有多大',
      };
    },
  },
  {
    id: 'g4a-area-word', grade: 4, term: 1, unit: '公顷和平方千米', name: '土地面积应用题', process: true,
    tip: '先用长 × 宽求出平方米数，再换算成公顷或平方千米', level: 2,
    gen(r) {
      const place = r.pick(['果园', '农场', '公园', '麦田', '林场', '苗圃']);
      const f = r.int(0, 3);
      if (f === 0) {
        const [l, w] = r.until(() => [r.step(150, 900, 50), r.step(100, 600, 50)], ([l, w]) => l > w && (l * w) % 10000 === 0);
        const S = l * w, h = S / 10000;
        return {
          q: `一块长方形${place}，长 ${l} 米，宽 ${w} 米。它的面积是多少公顷？`, answer: [num(h, '公顷')],
          steps: ['长方形的面积 = 长 × 宽', `${l} × ${w} = ${S}（平方米）`, `1 公顷 = 10000 平方米，${S} ÷ 10000 = ${h}（公顷）`, `答：这块${place}的面积是 ${h} 公顷。`],
        };
      }
      if (f === 1) {
        const a = r.int(2, 9) * 100, S = a * a, h = S / 10000;
        return {
          q: `一块正方形${place}，边长 ${a} 米。它的面积是多少公顷？`, answer: [num(h, '公顷')],
          steps: ['正方形的面积 = 边长 × 边长', `${a} × ${a} = ${S}（平方米）`, `${S} ÷ 10000 = ${h}（公顷）`, `答：这块${place}的面积是 ${h} 公顷。`],
        };
      }
      if (f === 2) {
        const [l, w] = r.until(() => [r.step(1000, 6000, 500), r.step(500, 4000, 500)], ([l, w]) => l > w && (l * w) % 1e6 === 0);
        const S = l * w, k = S / 1e6;
        const big = r.pick(['自然保护区', '湿地公园', '森林公园', '新建的开发区']);
        return {
          q: `一个长方形${big}，长 ${l} 米，宽 ${w} 米。它的面积是多少平方千米？`, answer: [num(k, '平方千米')],
          steps: [`长 × 宽：${l} × ${w} = ${S}（平方米）`, '1 平方千米 = 1000000 平方米', `${S} ÷ 1000000 = ${k}（平方千米）`, `答：它的面积是 ${k} 平方千米。`],
          hint: '也可以先把长和宽化成千米再算',
        };
      }
      const h = r.int(2, 12), y = r.pick([6000, 7000, 7500, 8000, 9000]), crop = r.pick([['麦田', '小麦'], ['稻田', '水稻'], ['玉米地', '玉米']]);
      return {
        q: `一块${crop[0]}的面积是 ${h} 公顷，平均每公顷收${crop[1]} ${y} 千克。这块地一共收${crop[1]}多少千克？`, answer: [num(h * y, '千克')],
        steps: ['每公顷的产量 × 公顷数 = 总产量', `${y} × ${h} = ${h * y}（千克）`, `答：一共收${crop[1]} ${h * y} 千克。`],
      };
    },
  },

  // ---------- 角的度量 ----------
  {
    id: 'g4a-line-angle-judge', grade: 4, term: 1, unit: '角的度量', name: '线和角的判断',
    tip: '直线没有端点、射线一个端点、线段两个端点；角的大小只看两边张开的程度', level: 1, pool: 25,
    gen(r) {
      const items = [
        ['直线没有端点，可以向两端无限延伸。', true, '直线没有端点，两端都可以无限延伸。'],
        ['射线有一个端点，可以向一端无限延伸。', true, '这正是射线的特点。'],
        ['线段有两个端点，可以量出长度。', true, '线段有两个端点，长度是有限的，可以量。'],
        ['射线比直线短。', false, '射线和直线都可以无限延伸，都无法量出长度，不能比较长短。'],
        ['一条射线长 8 厘米。', false, '射线可以向一端无限延伸，不能量出长度。'],
        ['过一点可以画无数条直线。', true, '经过一个点，可以朝各个方向画直线，有无数条。'],
        ['过两点只能画一条直线。', true, '两点确定一条直线。'],
        ['角的两条边画得越长，角就越大。', false, '角的大小与边的长短无关，只与两边张开的程度有关。'],
        ['角的大小与两边张开的程度有关。', true, '两边张开得越大，角就越大。'],
        ['平角就是一条直线。', false, '平角是一个角，有顶点和两条边，只是两条边在一条直线上，不能说它就是直线。'],
        ['周角就是一条射线。', false, '周角是一个角，两条边重合在一起，不能说它就是射线。'],
        ['大于 90° 的角叫做钝角。', false, '钝角要大于 90° 而且小于 180°，比如平角 180° 就不是钝角。'],
        ['1 个周角 = 2 个平角 = 4 个直角。', true, '360° = 2 × 180° = 4 × 90°。'],
        ['用放大 5 倍的放大镜看一个 20° 的角，看到的角是 100°。', false, '放大镜只能把边看长，不能改变两边张开的程度，看到的还是 20°。'],
        ['把一个平角分成两个角，如果一个是锐角，另一个一定是钝角。', true, '两个角加起来是 180°，一个小于 90°，另一个就大于 90° 又小于 180°。'],
        ['两个锐角的和一定是钝角。', false, '比如 30° + 40° = 70°，还是锐角。'],
        ['钝角的一半一定是锐角。', true, '钝角在 90° 和 180° 之间，一半在 45° 和 90° 之间，是锐角。'],
        ['直角的一半是锐角。', true, '90° 的一半是 45°，是锐角。'],
        ['线段是直线的一部分。', true, '在直线上取两个点，两点之间的部分就是线段。'],
        ['射线是直线的一部分。', true, '在直线上取一个点，这个点一侧的部分就是射线。'],
        ['从一点出发可以画无数条射线。', true, '从一个点可以朝任意方向画射线。'],
        ['小于 180° 的角都是钝角。', false, '锐角、直角也都小于 180°，钝角要大于 90°。'],
        ['角的两条边都是射线。', true, '从一点引出两条射线，就组成了一个角。'],
        ['两个锐角的和一定比直角大。', false, '比如 20° + 30° = 50°，比直角小。'],
        ['平角的两条边在同一条直线上。', true, '平角的两条边成一条直线，方向相反。'],
      ];
      const [s, ok, why] = r.pick(items);
      return { q: `判断：${s}`, answer: [judge(ok)], steps: [why, ok ? '这句话是对的（√）' : '这句话是错的（×）'] };
    },
  },
  {
    id: 'g4a-angle-classify', grade: 4, term: 1, unit: '角的度量', name: '锐角直角钝角平角周角',
    tip: '锐角 < 90° = 直角 < 钝角 < 180° = 平角，360° 是周角', level: 1,
    gen(r) {
      const t = r.pick(['锐角', '锐角', '钝角', '钝角', '直角', '平角', '周角']);
      const d = { 锐角: r.int(1, 89), 钝角: r.int(91, 179), 直角: 90, 平角: 180, 周角: 360 }[t];
      const rule = { 锐角: `${d}° 比 90° 小`, 钝角: `${d}° 比 90° 大、比 180° 小`, 直角: '等于 90°', 平角: '等于 180°', 周角: '等于 360°' }[t];
      return {
        q: `${d}° 的角是 {0}`, answer: [choice(r, t, ['锐角', '直角', '钝角', '平角', '周角'])],
        steps: ['锐角 < 90°，直角 = 90°，90° < 钝角 < 180°，平角 = 180°，周角 = 360°', `${rule}，是${t}`],
        hint: '和 90°、180° 比一比',
      };
    },
  },
  {
    id: 'g4a-angle-protractor', grade: 4, term: 1, unit: '角的度量', name: '用量角器读角的度数',
    tip: '角的一条边对着哪一圈的 0°，就读哪一圈的刻度', level: 1,
    gen(r) {
      const deg = r.step(10, 170, 5), left = r.bool(), ring = left ? '外圈' : '内圈';
      return {
        q: '量角器的中心已经对准角的顶点。这个角是 {0}', fig: upProtractor(deg, left), answer: [num(deg, '°')],
        steps: [`角的一条边在${left ? '左' : '右'}边，对着${ring}的 0°`, `所以要读${ring}的刻度`, `另一条边对着${ring}的 ${deg}°`, `这个角是 ${deg}°${deg !== 90 ? `（读成另一圈就会错成 ${180 - deg}°）` : ''}`],
        hint: '先看角的哪条边对着 0° 刻度线',
      };
    },
  },
  {
    id: 'g4a-angle-line-split', grade: 4, term: 1, unit: '角的度量', name: '平角、直角里求未知角',
    tip: '直线上的两个角合起来是平角 180°；直角里的两个角合起来是 90°', level: 1,
    gen(r) {
      const right = r.chance(0.4);
      const a = right ? r.int(15, 75) : r.int(25, 155), tot = right ? 90 : 180;
      const knowFirst = r.bool(), known = knowFirst ? a : tot - a, ask = tot - known;
      const [kn, an] = knowFirst ? ['∠1', '∠2'] : ['∠2', '∠1'];
      return {
        q: `如图，${kn} = ${known}°，${an} = {0}`, fig: upFigSplit(a, right), answer: [num(ask, '°')],
        steps: [right ? '图中有直角标记，∠1 和 ∠2 合起来是一个直角，90°' : '∠1 和 ∠2 合起来是一个平角（两条边在一条直线上），180°', `${an} = ${tot}° - ${known}° = ${ask}°`],
        hint: right ? '直角是多少度？' : '∠1 和 ∠2 合起来是什么角？',
      };
    },
  },
  {
    id: 'g4a-angle-around', grade: 4, term: 1, unit: '角的度量', name: '周角里求未知角',
    tip: '围着一个点的几个角合起来是一个周角 360°', level: 2,
    gen(r) {
      const [a1, a2] = r.until(() => [r.step(60, 160, 5), r.step(60, 160, 5)], ([x, y]) => 360 - x - y >= 60 && 360 - x - y <= 170);
      const a3 = 360 - a1 - a2, ang = [a1, a2, a3], ask = r.int(0, 2);
      const kn = [0, 1, 2].filter((i) => i !== ask);
      return {
        q: `如图，${kn.map((i) => `∠${i + 1} = ${ang[i]}°`).join('，')}，∠${ask + 1} = {0}`, fig: upFigAround(a1, a2), answer: [num(ang[ask], '°')],
        steps: ['三个角围着一点转了一整圈，合起来是一个周角 360°', `∠${ask + 1} = 360° - ${ang[kn[0]]}° - ${ang[kn[1]]}° = ${ang[ask]}°`],
        hint: '周角是多少度？',
      };
    },
  },
  {
    id: 'g4a-angle-cross', grade: 4, term: 1, unit: '角的度量', name: '两条直线相交求角',
    tip: '相邻的两个角合起来是平角 180°；相对的两个角都和同一个角拼成平角，所以相等', level: 2,
    gen(r) {
      const a = r.int(25, 155), start = r.int(0, 3);
      const sec = [a, 180 - a, a, 180 - a];
      const v1 = sec[start], v2 = sec[(start + 1) % 4], v3 = sec[(start + 2) % 4];
      return {
        q: `如图，两条直线相交，∠1 = ${v1}°。∠2 = {0}，∠3 = {1}`, fig: upFigCross(a, start), answer: [num(v2, '°', '∠2'), num(v3, '°', '∠3')],
        steps: ['∠1 和 ∠2 的两条边合起来在一条直线上，拼成一个平角', `∠2 = 180° - ${v1}° = ${v2}°`, '∠2 和 ∠3 也拼成一个平角', `∠3 = 180° - ${v2}° = ${v3}°（和 ∠1 相等）`],
        hint: '哪两个角拼成一个平角？',
      };
    },
  },
  {
    id: 'g4a-angle-set-square', grade: 4, term: 1, unit: '角的度量', name: '用三角板拼角',
    tip: '一副三角板有 30°、45°、60°、90° 的角，拼起来是相加，重叠后剩下的是相减', level: 1,
    gen(r) {
      const A = [30, 60, 90], B = [45, 90];
      const f = r.int(0, 2);
      if (f === 0) {
        const x = r.pick(A), y = r.pick(B);
        return { q: `用一副三角板中的 ${x}° 角和 ${y}° 角拼成一个角（边靠边，不重叠），这个角是 {0}`, answer: [num(x + y, '°')], steps: ['两个角拼在一起，度数相加', `${x}° + ${y}° = ${x + y}°`], hint: '拼起来是加还是减？' };
      }
      if (f === 1) {
        const pairs = [[45, 30], [60, 45], [90, 45], [90, 30], [90, 60], [90, 45]].filter(([p, q]) => p !== q);
        const [x, y] = r.pick(pairs);
        return { q: `把一副三角板中的 ${y}° 角放在 ${x}° 角里面（顶点和一条边重合），剩下的角是 {0}`, answer: [num(x - y, '°')], steps: ['小角放在大角里面，剩下的部分用减法', `${x}° - ${y}° = ${x - y}°`], hint: '重叠后剩下的部分用减法' };
      }
      const can = { 15: '45° - 30°', 75: '30° + 45°', 105: '60° + 45°', 120: '30° + 90°', 135: '45° + 90°', 150: '60° + 90°' };
      const cannot = [20, 25, 35, 40, 50, 55, 65, 70, 80, 85, 95, 100, 110, 115, 125, 130, 140, 145, 155, 160, 170];
      const bad = r.pick(cannot), goods = r.sample(Object.keys(can).map(Number), 3);
      return {
        q: '用一副三角板不能直接拼出的角是 {0}', answer: [choice(r, `${bad}°`, goods.map((g) => `${g}°`))],
        steps: ['一副三角板的角：30°、45°、60°、90°，能拼出的角是它们的和或差', ...goods.map((g) => `${g}° = ${can[g]}`), `${bad}° 用这几个角加减都得不到`],
        hint: '能拼出的角都是 15° 的倍数',
      };
    },
  },
  {
    id: 'g4a-clock-rotate', grade: 4, term: 1, unit: '角的度量', name: '钟面上指针转过的角度',
    tip: '钟面一周 360°，分成 12 个大格，每个大格 30°；分成 60 个小格，每个小格 6°', level: 1,
    gen(r) {
      const f = r.int(0, 3);
      if (f === 0) {
        const a = r.int(0, 10), b = r.int(a + 1, 11), from = a || 12;
        const k = b - a;
        return { q: `分针从 ${from} 走到 ${b}，按顺时针方向转了 {0}`, answer: [num(k * 30, '°')], steps: ['钟面上每相邻两个数之间是一个大格，360° ÷ 12 = 30°', `从 ${from} 到 ${b} 走了 ${k} 个大格`, `${k} × 30° = ${k * 30}°`], hint: '每个大格是多少度？' };
      }
      if (f === 1) {
        const a = r.int(1, 10), b = r.int(a + 1, 12), k = b - a;
        return { q: `从 ${a} 时到 ${b} 时，时针转了 {0}`, answer: [num(k * 30, '°')], steps: ['时针每走 1 小时，走 1 个大格，转 30°', `从 ${a} 时到 ${b} 时经过了 ${k} 小时`, `${k} × 30° = ${k * 30}°`], hint: '时针 1 小时转多少度？' };
      }
      if (f === 2) {
        const m = r.chance(0.6) ? r.step(5, 55, 5) : r.int(1, 59);
        return { q: `分针走了 ${m} 分钟，转了 {0}`, answer: [num(m * 6, '°')], steps: ['分针 60 分钟转一圈 360°，每分钟走 1 小格，360° ÷ 60 = 6°', `${m} × 6° = ${m * 6}°`], hint: '分针 1 分钟转多少度？' };
      }
      const m = r.step(5, 55, 5);
      return { q: `分针按顺时针方向转了 ${m * 6}°，经过了 {0}`, answer: [num(m, '分钟')], steps: ['分针每分钟转 6°', `${m * 6} ÷ 6 = ${m}（分钟）`], hint: '分针 1 分钟转多少度？' };
    },
  },
  {
    id: 'g4a-clock-angle-hour', grade: 4, term: 1, unit: '角的度量', name: '整时时针分针的夹角',
    tip: '整时分针指着 12，数时针和分针之间隔了几个大格，每格 30°', level: 1, pool: 11,
    gen(r) {
      const h = r.int(1, 11), k = Math.min(h, 12 - h), d = k * 30;
      const kind = d < 90 ? '锐角' : d === 90 ? '直角' : d < 180 ? '钝角' : '平角';
      return {
        q: `${h} 时整，时针和分针所成的较小的角是 {0}`, fig: fig.clock(h, 0), answer: [num(d, '°')],
        steps: [`${h} 时整，分针指着 12，时针指着 ${h}`, `从 12 到 ${h}（取较少的一边）隔了 ${k} 个大格`, `${k} × 30° = ${d}°，是${kind}`],
        hint: '两根针之间隔了几个大格？',
      };
    },
  },
  {
    id: 'g4a-clock-angle-min', grade: 4, term: 1, unit: '角的度量', name: '几时几十分指针的夹角',
    tip: '时针不是正好指着整点：每过 10 分钟，时针多走 5°', level: 2,
    gen(r) {
      const h = r.int(1, 11), m = r.step(10, 50, 10);
      const ma = m * 6, ha = h * 30 + m / 2, diff = Math.abs(ha - ma), d = Math.min(diff, 360 - diff);
      return {
        q: `${h} 时 ${m} 分，时针和分针所成的较小的角是 {0}`, fig: fig.clock(h, m), answer: [num(d, '°')],
        steps: [`分针指着 ${m / 5}，从 12 起转了 ${m / 5} × 30° = ${ma}°`, `时针从 12 起先转到 ${h}：${h} × 30° = ${h * 30}°；再过 ${m} 分钟，又走了 ${m / 10} × 5° = ${m / 2}°，一共 ${ha}°`, `两针相差 ${Math.max(ha, ma)}° - ${Math.min(ha, ma)}° = ${diff}°`, diff > 180 ? `比 180° 大，较小的角是 360° - ${diff}° = ${d}°` : `较小的角是 ${d}°`],
        hint: '时针 1 小时走 30°，10 分钟走多少度？',
      };
    },
  },
  {
    id: 'g4a-count-angles', grade: 4, term: 1, unit: '角的度量', name: '数角和数线段', pool: 9,
    tip: '按顺序数，不重复不遗漏：从第一条边（第一个点）出发数，再从第二条数……', level: 3,
    gen(r) {
      if (r.bool()) {
        const n = r.int(3, 6), c = (n * (n - 1)) / 2;
        const L = 'ABCDEF'.slice(0, n).split('');
        return {
          q: '图中一共有几个角（小于平角）？{0}', fig: upFigFan(n), answer: [num(c, '个')],
          steps: [`从 O 点引出 ${n} 条射线：${L.map((x) => 'O' + x).join('、')}`, ...L.slice(0, -1).map((x, i) => `以 O${x} 为一条边的角（不往回数）有 ${n - 1 - i} 个`), `一共 ${Array.from({ length: n - 1 }, (_, i) => n - 1 - i).join(' + ')} = ${c}（个）`],
          hint: '先数以 OA 为边的角',
        };
      }
      const n = r.int(3, 7), c = (n * (n - 1)) / 2, L = 'ABCDEFG'.slice(0, n).split('');
      const gaps = Array.from({ length: n - 1 }, () => r.int(2, 5));
      return {
        q: '图中一共有几条线段？{0}', fig: upFigPoints(n, gaps), answer: [num(c, '条')],
        steps: [`线段上一共有 ${n} 个点`, ...L.slice(0, -1).map((x, i) => `以 ${x} 为左端点的线段有 ${n - 1 - i} 条`), `一共 ${Array.from({ length: n - 1 }, (_, i) => n - 1 - i).join(' + ')} = ${c}（条）`],
        hint: '先数以 A 为端点的线段',
      };
    },
  },

  // ---------- 三位数乘两位数 ----------
  {
    id: 'g4a-mul-oral', grade: 4, term: 1, unit: '三位数乘两位数', name: '口算乘法（末尾有 0）',
    tip: '先把 0 前面的数相乘，再看因数末尾一共有几个 0，就在积的末尾添几个 0', level: 1, speed: 8,
    gen(r) {
      const f = r.int(0, 3);
      let a, b;
      if (f === 0) [a, b] = r.until(() => [r.int(11, 49), r.int(2, 9) * 10], ([x, y]) => x % 10 !== 0 && x * (y / 10) <= 200);
      else if (f === 1) [a, b] = [r.int(2, 9) * 10, r.int(2, 9) * 10];
      else if (f === 2) [a, b] = r.until(() => [r.int(11, 25) * 10, r.int(2, 9)], ([x, y]) => (x / 10) % 10 !== 0 && (x / 10) * y <= 150);
      else [a, b] = [r.int(2, 9) * 100, r.int(2, 9) * 10];
      if (r.bool()) [a, b] = [b, a];
      const tz = (n) => String(n).length - String(n).replace(/0+$/, '').length;
      const A = +String(a).replace(/0+$/, ''), B = +String(b).replace(/0+$/, ''), z = tz(a) + tz(b);
      return {
        q: `${a} × ${b} = {0}`, answer: [num(a * b)],
        steps: [`先算 ${A} × ${B} = ${A * B}`, `两个因数末尾一共有 ${z} 个 0，在 ${A * B} 末尾添上 ${z} 个 0`, `${a} × ${b} = ${a * b}`],
        hint: '先不看末尾的 0',
      };
    },
  },
  {
    id: 'g4a-mul-estimate', grade: 4, term: 1, unit: '三位数乘两位数', name: '乘法估算',
    tip: '三位数看成接近的整百数，两位数看成接近的整十数，再口算', level: 1,
    gen(r) {
      const t = r.int(1, 9), u = r.int(2, 9);
      const a = r.until(() => t * 100 + r.pick([-1, 1]) * r.int(1, 25), (x) => x >= 101 && x <= 999 && x % 10 !== 0);
      const b = u * 10 + r.pick([-2, -1, 1, 2]);
      const [x, y] = r.bool() ? [a, b] : [b, a];
      return {
        q: `估算：${x} × ${y} ≈ {0}`, answer: [num(t * 100 * u * 10)],
        steps: [`${a} 接近 ${t * 100}，看成 ${t * 100}`, `${b} 接近 ${u * 10}，看成 ${u * 10}`, `${t * 100} × ${u * 10} = ${t * u * 1000}`, `所以 ${x} × ${y} ≈ ${t * u * 1000}`],
        hint: '把两个数分别看成整百数、整十数',
      };
    },
  },
  {
    id: 'g4a-mul-3x2', grade: 4, term: 1, unit: '三位数乘两位数', name: '三位数乘两位数笔算',
    tip: '用十位上的数去乘时，积的末位要和十位对齐；最后把两次的积加起来', level: 1,
    gen(r) {
      const nz = () => r.int(1, 9);
      const a = nz() * 100 + nz() * 10 + nz(), b = nz() * 10 + nz(), g = b % 10, t = Math.floor(b / 10);
      return {
        q: `${a} × ${b} = {0}`, answer: [num(a * b)],
        steps: [`先用个位上的 ${g} 去乘 ${a}：${a} × ${g} = ${a * g}，末位和个位对齐`, `再用十位上的 ${t} 去乘 ${a}：${a} × ${t} = ${a * t}，表示 ${a * t} 个十，末位和十位对齐`, `把两次乘得的积加起来：${a * g} + ${a * t * 10} = ${a * b}`, vMul(a, b)],
        hint: '先算 ' + a + ' × ' + g,
      };
    },
  },
  {
    id: 'g4a-mul-midzero', grade: 4, term: 1, unit: '三位数乘两位数', name: '因数中间有 0 的乘法',
    tip: '0 乘任何数都得 0，但别忘了加上后面进上来的数', level: 1,
    gen(r) {
      const a = r.int(1, 9) * 100 + r.int(1, 9), b = r.int(1, 9) * 10 + r.int(2, 9), g = b % 10, t = Math.floor(b / 10);
      return {
        q: `${a} × ${b} = {0}`, answer: [num(a * b)],
        steps: [`${a} 的十位上是 0：用 ${g} 乘 0 得 0，要加上个位进上来的 ${Math.floor(((a % 10) * g) / 10)}`, `${a} × ${g} = ${a * g}`, `${a} × ${t} = ${a * t}，末位和十位对齐`, `${a * g} + ${a * t * 10} = ${a * b}`, vMul(a, b)],
        hint: '十位上的 0 乘任何数都得 0，进上来的数要加上',
      };
    },
  },
  {
    id: 'g4a-mul-tailzero', grade: 4, term: 1, unit: '三位数乘两位数', name: '因数末尾有 0 的乘法',
    tip: '把 0 前面的数对齐相乘，因数末尾一共有几个 0，就在积的末尾添几个 0', level: 1,
    gen(r) {
      const f = r.int(0, 3);
      let a, b;
      if (f === 0) [a, b] = [r.until(() => r.int(11, 99), (x) => x % 10 !== 0) * 10, r.until(() => r.int(12, 99), (x) => x % 10 !== 0)];
      else if (f === 1) [a, b] = [r.until(() => r.int(101, 999), (x) => x % 10 !== 0), r.int(2, 9) * 10];
      else if (f === 2) [a, b] = [r.until(() => r.int(11, 99), (x) => x % 10 !== 0) * 10, r.int(2, 9) * 10];
      else [a, b] = [r.int(1, 9) * 100, r.until(() => r.int(12, 99), (x) => x % 10 !== 0)];
      const tz = (n) => String(n).length - String(n).replace(/0+$/, '').length;
      const A = +String(a).replace(/0+$/, ''), B = +String(b).replace(/0+$/, ''), z = tz(a) + tz(b), p = A * B;
      const more = tz(p) > 0 ? `（${p} 末尾本身就有 0，积末尾的 0 比因数末尾的 0 多）` : '';
      return {
        q: `${a} × ${b} = {0}`, answer: [num(a * b)],
        steps: ['笔算时把 0 前面的数末位对齐，0 写在右边', `先算 ${A} × ${B} = ${p}`, `两个因数末尾一共有 ${z} 个 0，在 ${p} 后面添上 ${z} 个 0，得 ${a * b}${more}`, vMulZ(a, b)],
        hint: '先算 0 前面的数相乘',
      };
    },
  },
  {
    id: 'g4a-mul-zero-count', grade: 4, term: 1, unit: '三位数乘两位数', name: '积的末尾有几个 0',
    tip: '不能只数因数末尾的 0：5 和双数相乘，积的末尾还会多出 0', level: 2,
    gen(r) {
      const tz = (n) => String(n).length - String(n).replace(/0+$/, '').length;
      const [a, b] = r.until(() => {
        const fam = r.chance(0.65);
        const A = fam ? r.pick([25, 125, 15, 35, 45, 75, 5, 55, 65]) : r.int(11, 99);
        const B = fam ? r.pick([4, 8, 2, 6, 12, 16, 24, 36, 44, 48]) : r.int(2, 9);
        return [A * 10 ** r.int(0, 2), B * 10 ** r.int(0, 1)];
      }, ([x, y]) => x >= 20 && x <= 990 && y >= 2 && y <= 90 && String(x).length + String(y).length >= 4 && tz(x * y) >= 1);
      const [x, y] = r.bool() ? [a, b] : [b, a];
      const p = x * y, z = tz(x) + tz(y), Z = tz(p);
      const A = +String(x).replace(/0+$/, ''), B = +String(y).replace(/0+$/, '');
      return {
        q: `${x} × ${y} 的积的末尾有几个 0？{0}`, answer: [num(Z, '个')],
        steps: [`先算 0 前面的数：${A} × ${B} = ${A * B}${tz(A * B) ? `，末尾已经有 ${tz(A * B)} 个 0` : ''}`, `再添上因数末尾的 ${z} 个 0：${x} × ${y} = ${p}`, `积的末尾一共有 ${Z} 个 0`],
        hint: '算出积再数，别只数因数末尾的 0',
      };
    },
  },
  {
    id: 'g4a-product-rule', grade: 4, term: 1, unit: '三位数乘两位数', name: '积的变化规律',
    tip: '一个因数不变，另一个因数乘（或除以）几，积也乘（或除以）几', level: 1,
    gen(r) {
      const f = r.int(0, 2);
      if (f === 2) {
        const C = r.int(12, 99) * r.pick([6, 8, 12, 24]), k = r.pick([2, 3, 4, 5, 6, 10]), mul = r.bool();
        const c = mul ? C : C * k;
        return {
          q: `两个数相乘，积是 ${c}。如果一个因数${mul ? '乘' : '除以'} ${k}，另一个因数不变，积是 {0}`, answer: [num(mul ? c * k : c / k)],
          steps: [`一个因数不变，另一个因数${mul ? '乘' : '除以'} ${k}，积也${mul ? '乘' : '除以'} ${k}`, `${c} ${mul ? '×' : '÷'} ${k} = ${mul ? c * k : c / k}`],
          hint: '另一个因数没变，积怎么变？',
        };
      }
      let a = r.int(12, 48), b = r.int(11, 35), k, x, y, mul;
      if (f === 0) { k = r.pick([2, 3, 4, 5, 10, 20, 100]); mul = true; [x, y] = r.bool() ? [a * k, b] : [a, b * k]; }
      else { k = r.pick([2, 3, 4, 6]); a = k * r.int(Math.ceil(12 / k) + 1, Math.floor(96 / k)); mul = false; [x, y] = r.bool() ? [a / k, b] : [b, a / k]; if (x === b) [a, b] = [b, a]; }
      const C = a * b;
      const changed = x !== a ? [a, x] : [b, y];
      return {
        q: `已知 ${a} × ${b} = ${C}，那么 ${x} × ${y} = {0}`, answer: [num(x * y)],
        steps: [`对比两个算式：${changed[0]} 变成了 ${changed[1]}，${mul ? `乘了 ${k}` : `除以了 ${k}`}；另一个因数不变`, `积也要${mul ? '乘' : '除以'} ${k}`, `${C} ${mul ? '×' : '÷'} ${k} = ${x * y}`],
        hint: '找一找哪个因数变了，变了几倍',
      };
    },
  },
  {
    id: 'g4a-product-rule2', grade: 4, term: 1, unit: '三位数乘两位数', name: '两个因数都变，积怎么变',
    tip: '分两步看：先看第一个因数让积怎么变，再看第二个因数让积怎么变', level: 2,
    gen(r) {
      const o = r.until(() => {
        const a = r.int(12, 96), b = r.int(12, 96), k = r.pick([2, 3, 4, 5]), m = r.pick([2, 3, 4, 5]);
        const f = r.int(0, 3);
        const [x, y] = [[a * k, b * m], [a * k, b / m], [a * k, b / k], [a / k, b / m]][f];
        return { a, b, k, m: f === 2 ? k : m, f, x, y };
      }, (o) => Number.isInteger(o.x) && Number.isInteger(o.y) && o.x <= 400 && o.y <= 400 && o.x >= 2 && o.y >= 2);
      const { a, b, k, m, f, x, y } = o, C = a * b, P = x * y;
      const d1 = f === 3 ? `除以 ${k}` : `乘 ${k}`, d2 = f === 0 ? `乘 ${m}` : `除以 ${m}`;
      const calc = [`${C} × ${k} × ${m}`, `${C} × ${k} ÷ ${m}`, `${C} × ${k} ÷ ${k}`, `${C} ÷ ${k} ÷ ${m}`][f];
      return {
        q: `已知 ${a} × ${b} = ${C}，那么 ${x} × ${y} = {0}`, answer: [num(P)],
        steps: [`第一个因数 ${a} → ${x}，${d1}，积也${d1}`, `第二个因数 ${b} → ${y}，${d2}，积也${d2}`, `${calc} = ${P}${f === 2 ? '（一个乘 ' + k + '、一个除以 ' + k + '，积不变）' : ''}`],
        hint: '两个因数各变了多少？',
      };
    },
  },
  {
    id: 'g4a-price-total', grade: 4, term: 1, unit: '三位数乘两位数', name: '单价 × 数量 = 总价', process: true,
    tip: '每件的价钱叫单价，买了几件叫数量，一共花的钱叫总价：单价 × 数量 = 总价', level: 1,
    gen(r) {
      const T = r.pick([
        { o: '电风扇', u: '台', p: [128, 398], q: [12, 36], who: '学校' },
        { o: '课桌椅', u: '套', p: [158, 320], q: [24, 48], who: '学校' },
        { o: '足球', u: '个', p: [85, 168], q: [12, 30], who: '体育用品店' },
        { o: '词典', u: '本', p: [36, 128], q: [15, 45], who: '书店' },
        { o: '牛奶', u: '箱', p: [48, 89], q: [15, 60], who: '超市' },
        { o: '自行车', u: '辆', p: [268, 699], q: [12, 25], who: '车行' },
      ]);
      const p = r.int(...T.p), q = r.int(...T.q), tot = p * q;
      const q1 = r.bool() ? `${T.o}每${T.u} ${p} 元，${T.who}买了 ${q} ${T.u}，一共要付多少元？` : `${T.who}买了 ${q} ${T.u}${T.o}，单价是每${T.u} ${p} 元。一共要付多少元？`;
      return {
        q: q1, answer: [num(tot, '元')],
        steps: [`已知单价 ${p} 元、数量 ${q} ${T.u}，求总价`, '单价 × 数量 = 总价', `${p} × ${q} = ${tot}（元）`, vMul(p, q), `答：一共要付 ${tot} 元。`],
      };
    },
  },
  {
    id: 'g4a-price-inverse', grade: 4, term: 1, unit: '三位数乘两位数', name: '求单价或数量', process: true,
    tip: '总价 ÷ 数量 = 单价，总价 ÷ 单价 = 数量', level: 1,
    gen(r) {
      const T = r.pick([
        { o: '篮球', u: '个', who: '学校' }, { o: '故事书', u: '本', who: '图书馆' }, { o: '台灯', u: '盏', who: '学校' },
        { o: '运动服', u: '套', who: '体育队' }, { o: '门票', u: '张', who: '旅行团' }, { o: '跳绳', u: '根', who: '体育组' },
      ]);
      const p = r.int(12, 98), q = r.int(12, 48), tot = p * q, askP = r.bool();
      if (askP) return {
        q: `${T.who}买了 ${q} ${T.u}${T.o}，一共花了 ${tot} 元。每${T.u}${T.o}多少元？`, answer: [num(p, '元')],
        steps: ['已知总价和数量，求单价', '总价 ÷ 数量 = 单价', `${tot} ÷ ${q} = ${p}（元）`, vDiv(tot, q), `答：每${T.u}${T.o} ${p} 元。`],
      };
      return {
        q: `每${T.u}${T.o} ${p} 元，${T.who}用 ${tot} 元正好买了多少${T.u}？`, answer: [num(q, T.u)],
        steps: ['已知总价和单价，求数量', '总价 ÷ 单价 = 数量', `${tot} ÷ ${p} = ${q}（${T.u}）`, vDiv(tot, p), `答：正好买了 ${q} ${T.u}。`],
      };
    },
  },
  {
    id: 'g4a-speed-dist', grade: 4, term: 1, unit: '三位数乘两位数', name: '速度 × 时间 = 路程', process: true,
    tip: '每小时（每分钟）行的路程叫速度，写作「千米/时」「米/分」：速度 × 时间 = 路程', level: 1,
    gen(r) {
      const T = r.pick([
        { s: '一辆汽车', v: [55, 95], vu: '千米/时', per: '每小时', t: [3, 9], tu: '小时', du: '千米' },
        { s: '一列火车', v: [120, 180], vu: '千米/时', per: '每小时', t: [5, 12], tu: '小时', du: '千米' },
        { s: '一艘轮船', v: [24, 38], vu: '千米/时', per: '每小时', t: [12, 30], tu: '小时', du: '千米' },
        { s: 'NAME步行上学', v: [60, 85], vu: '米/分', per: '每分钟', t: [12, 25], tu: '分钟', du: '米' },
        { s: 'NAME骑自行车', v: [180, 260], vu: '米/分', per: '每分钟', t: [12, 25], tu: '分钟', du: '米' },
        { s: '一架飞机', v: [780, 900], vu: '千米/时', per: '每小时', t: [2, 5], tu: '小时', du: '千米' },
      ]);
      const v = T.s.includes('飞机') ? r.step(...T.v, 10) : r.int(...T.v), t = r.int(...T.t), d = v * t, s = T.s.replace('NAME', r.name());
      return {
        q: r.bool() ? `${s}，${T.per}行 ${v} ${T.du}，${t} ${T.tu}行了多少${T.du}？` : `${s}的速度是 ${v} ${T.vu}，${t} ${T.tu}行了多少${T.du}？`,
        answer: [num(d, T.du)],
        steps: [`速度是 ${v} ${T.vu}，就是${T.per}行 ${v} ${T.du}`, '速度 × 时间 = 路程', `${v} × ${t} = ${d}（${T.du}）`, ...(String(t).length > 1 && String(v).length > 1 ? [vMul(v, t)] : []), `答：${t} ${T.tu}行了 ${d} ${T.du}。`],
      };
    },
  },
  {
    id: 'g4a-speed-inverse', grade: 4, term: 1, unit: '三位数乘两位数', name: '求速度或时间', process: true,
    tip: '路程 ÷ 时间 = 速度，路程 ÷ 速度 = 时间', level: 1,
    gen(r) {
      const T = r.pick([
        { s: '一辆汽车', v: [55, 95], vu: '千米/时', per: '每小时', t: [3, 9], tu: '小时', du: '千米' },
        { s: '一列火车', v: [120, 180], vu: '千米/时', per: '每小时', t: [5, 12], tu: '小时', du: '千米' },
        { s: '一艘轮船', v: [24, 38], vu: '千米/时', per: '每小时', t: [12, 30], tu: '小时', du: '千米' },
        { s: 'NAME步行', v: [60, 85], vu: '米/分', per: '每分钟', t: [12, 25], tu: '分钟', du: '米' },
        { s: 'NAME骑自行车', v: [180, 260], vu: '米/分', per: '每分钟', t: [12, 25], tu: '分钟', du: '米' },
        { s: 'NAME爸爸骑电动车', v: [18, 25], vu: '千米/时', per: '每小时', t: [2, 4], tu: '小时', du: '千米' },
      ]);
      const v = r.int(...T.v), t = r.int(...T.t), d = v * t, s = T.s.replace('NAME', r.name());
      if (r.bool()) return {
        q: `${s} ${t} ${T.tu}行了 ${d} ${T.du}，它的速度是多少？`, answer: [num(v, T.vu)],
        steps: ['已知路程和时间，求速度', '路程 ÷ 时间 = 速度', `${d} ÷ ${t} = ${v}（${T.vu}）`, vDiv(d, t), `答：速度是 ${v} ${T.vu}。`],
      };
      return {
        q: `${s}${T.per}行 ${v} ${T.du}，行 ${d} ${T.du}要多少${T.tu}？`, answer: [num(t, T.tu)],
        steps: ['已知路程和速度，求时间', '路程 ÷ 速度 = 时间', `${d} ÷ ${v} = ${t}（${T.tu}）`, vDiv(d, v), `答：要 ${t} ${T.tu}。`],
      };
    },
  },
  {
    id: 'g4a-ext-meet', grade: 4, term: 1, unit: '三位数乘两位数', name: '相遇问题', process: true,
    tip: '两人相对而行，每过 1 小时（1 分钟）一共走「速度和」；速度和 × 相遇时间 = 总路程', level: 3,
    gen(r) {
      const T = r.pick([
        { who: (a, b) => `${a}和${b}同时从自己家出发，相对而行，${a}每分钟走 V1 米，${b}每分钟走 V2 米`, place: '两家', v: [55, 85], t: [5, 15], du: '米', tu: '分钟', per: '每分钟' },
        { who: () => '两辆汽车同时从甲、乙两城相对开出，一辆每小时行 V1 千米，另一辆每小时行 V2 千米', place: '甲、乙两城', v: [55, 95], t: [2, 6], du: '千米', tu: '小时', per: '每小时' },
        { who: () => '两艘轮船同时从两个码头相对开出，一艘每小时行 V1 千米，另一艘每小时行 V2 千米', place: '两个码头', v: [22, 40], t: [3, 8], du: '千米', tu: '小时', per: '每小时' },
        { who: (a, b) => `${a}和${b}同时从公园步道的两头出发，相向骑车，${a}每分钟骑 V1 米，${b}每分钟骑 V2 米`, place: '步道两头', v: [150, 250], t: [3, 8], du: '米', tu: '分钟', per: '每分钟' },
        { who: () => '两列火车同时从两个车站相对开出，一列每小时行 V1 千米，另一列每小时行 V2 千米', place: '两个车站', v: [100, 160], t: [2, 5], du: '千米', tu: '小时', per: '每小时' },
      ]);
      const [a, b] = r.names(2), v1 = r.int(...T.v), v2 = r.int(...T.v), t = r.int(...T.t), sum = v1 + v2, D = sum * t;
      const who = T.who(a, b).replace('V1', v1).replace('V2', v2);
      if (r.bool()) return {
        q: `${who}，${t} ${T.tu}后相遇。${T.place}相距多少${T.du}？`, answer: [num(D, T.du)],
        steps: [`${T.per}两边一共行 ${v1} + ${v2} = ${sum}（${T.du}），这叫速度和`, '速度和 × 相遇时间 = 总路程', `${sum} × ${t} = ${D}（${T.du}）`, `答：${T.place}相距 ${D} ${T.du}。`],
      };
      return {
        q: `${T.place}相距 ${D} ${T.du}。${who}，经过多少${T.tu}相遇？`, answer: [num(t, T.tu)],
        steps: [`${T.per}两边一共行 ${v1} + ${v2} = ${sum}（${T.du}），这叫速度和`, '总路程 ÷ 速度和 = 相遇时间', `${D} ÷ ${sum} = ${t}（${T.tu}）`, `答：经过 ${t} ${T.tu}相遇。`],
      };
    },
  },

  // ---------- 平行四边形和梯形 ----------
  {
    id: 'g4a-parallel-perp-judge', grade: 4, term: 1, unit: '平行四边形和梯形', name: '平行与垂直的判断',
    tip: '同一平面内不相交的两条直线互相平行；相交成直角的两条直线互相垂直；垂直线段最短', level: 1, pool: 18,
    gen(r) {
      const items = [
        ['在同一平面内，不相交的两条直线叫做平行线。', true, '这是平行线的定义，「在同一平面内」不能少。'],
        ['不相交的两条直线叫做平行线。', false, '少了「在同一平面内」。不在同一个平面内的两条直线，也可能既不相交也不平行。'],
        ['两条直线相交成直角时，就说这两条直线互相垂直。', true, '这是垂直的定义。'],
        ['在同一平面内，两条直线不是平行就是相交。', true, '同一平面内两条直线的位置关系只有平行和相交两种，垂直是相交的特殊情况。'],
        ['过直线外一点，可以画无数条已知直线的平行线。', false, '过直线外一点，只能画一条已知直线的平行线。'],
        ['过直线外一点，只能画一条已知直线的垂线。', true, '过一点画已知直线的垂线，只能画一条。'],
        ['从直线外一点到这条直线所画的线段中，垂直线段最短。', true, '垂直线段最短，它的长度叫做点到直线的距离。'],
        ['两条平行线之间的垂直线段长度都相等。', true, '平行线之间的距离处处相等。'],
        ['在同一平面内，垂直于同一条直线的两条直线互相平行。', true, '两条直线都和同一条直线成直角，它们不会相交，互相平行。'],
        ['在同一平面内，如果 a⊥b，b⊥c，那么 a⊥c。', false, 'a 和 c 都垂直于 b，所以 a 和 c 互相平行，不是垂直。'],
        ['在同一平面内，如果 a∥b，b∥c，那么 a∥c。', true, '平行于同一条直线的两条直线互相平行。'],
        ['长方形相邻的两条边互相垂直。', true, '长方形四个角都是直角，相邻的两条边互相垂直。'],
        ['点到直线的距离就是从这点画的这条直线的垂线。', false, '点到直线的距离是垂直线段的长度。垂线是直线，没有长度。'],
        ['两条直线相交成的四个角中，有一个是直角，这两条直线就互相垂直。', true, '一个角是直角，另外三个角也都是直角。'],
        ['不相交的两条线段一定互相平行。', false, '线段很短，不相交的两条线段延长以后也可能相交。'],
        ['从小明家走到马路边，沿着和马路垂直的方向走最近。', true, '垂直线段最短。'],
        ['两条直线互相垂直，其中一条叫做另一条的垂线，交点叫做垂足。', true, '这是垂线和垂足的说法。'],
        ['在同一平面内，两条直线都和第三条直线相交，这两条直线也一定相交。', false, '比如两条平行线都和第三条直线相交，它们自己不相交。'],
      ];
      const [t, ok, why] = r.pick(items);
      return { q: `判断：${t}`, answer: [judge(ok)], steps: [why, ok ? '这句话是对的（√）' : '这句话是错的（×）'] };
    },
  },
  {
    id: 'g4a-perp-distance', grade: 4, term: 1, unit: '平行四边形和梯形', name: '点到直线的距离', pool: 10,
    tip: '从直线外一点到直线的所有线段中，垂直线段最短，它的长度就是点到直线的距离', level: 1,
    gen(r) {
      const h = r.int(3, 12), others = r.sample([2, 3, 4, 5, 6], 2).map((k) => h + k);
      const sc = Math.min(20, 150 / h), cx = 200, ly = 40 + h * sc, C = fig.colors;
      let s = upLine([10, ly], [390, ly]);
      [-1, 1].forEach((side, i) => {
        const ex = cx + Math.sqrt(others[i] ** 2 - h * h) * sc * side;
        s += upLine([cx, 40], [ex, ly], { w: 2 }) + fig.text((cx + ex) / 2 + 22 * side, (40 + ly) / 2, `${others[i]}cm`, { size: 14 });
      });
      s += upLine([cx, 40], [cx, ly], { w: 2.5, color: C.acc }) + `<rect x="${cx}" y="${ly - 12}" width="12" height="12" fill="none" stroke="${C.acc}" stroke-width="1.5"/>`;
      s += fig.text(cx - 22, 40 + (ly - 40) * 0.72, `${h}cm`, { size: 14, color: C.acc }) + `<circle cx="${cx}" cy="40" r="4" fill="${C.line}"/>` + fig.text(cx, 24, 'P', { size: 15, weight: 'bold' });
      return {
        q: '从 P 点向直线画了几条线段。P 点到这条直线的距离是 {0}', fig: fig.raw(400, ly + 20, s), answer: [num(h, '厘米')],
        steps: ['从直线外一点到这条直线所画的线段中，垂直线段最短', '这条垂直线段的长度叫做点到直线的距离', `图中标着直角的那条线段是 ${h} 厘米，它也是最短的`, `所以距离是 ${h} 厘米`],
        hint: '找一找哪条线段和直线垂直',
      };
    },
  },
  {
    id: 'g4a-quad-judge', grade: 4, term: 1, unit: '平行四边形和梯形', name: '平行四边形和梯形的判断',
    tip: '两组对边分别平行是平行四边形，只有一组对边平行是梯形；长方形、正方形是特殊的平行四边形', level: 1, pool: 17,
    gen(r) {
      const items = [
        ['两组对边分别平行的四边形叫做平行四边形。', true, '这是平行四边形的定义。'],
        ['只有一组对边平行的四边形叫做梯形。', true, '这是梯形的定义，关键是「只有」一组。'],
        ['长方形和正方形都是特殊的平行四边形。', true, '它们的两组对边都分别平行，四个角又都是直角。'],
        ['平行四边形有无数条高。', true, '从一条边上的任意一点都能向对边画垂直线段，所以有无数条高。'],
        ['梯形有无数条高。', true, '上底和下底之间的垂直线段都是梯形的高，有无数条。'],
        ['平行四边形容易变形。', true, '平行四边形不稳定，容易变形，伸缩门就是利用了这一点。'],
        ['有一组对边平行的四边形一定是梯形。', false, '平行四边形也有一组对边平行。梯形要求「只有」一组对边平行。'],
        ['正方形是特殊的长方形。', true, '正方形四个角都是直角，四条边都相等，是特殊的长方形。'],
        ['两条腰相等的梯形叫做等腰梯形。', true, '这是等腰梯形的定义。'],
        ['有一个角是直角的梯形叫做直角梯形。', true, '这是直角梯形的定义。'],
        ['平行四边形的两组对边分别相等。', true, '平行四边形的对边相等。'],
        ['梯形的两条腰一定相等。', false, '只有等腰梯形的两条腰才相等。'],
        ['平行四边形是特殊的梯形。', false, '梯形只有一组对边平行，平行四边形有两组，平行四边形不是梯形。'],
        ['把一个长方形框架拉成平行四边形，周长不变。', true, '四条边的长度都没有变，所以周长不变。'],
        ['一个梯形最多有两个直角。', true, '直角梯形有两个直角，梯形不可能有三个或四个直角。'],
        ['四个角都是直角的平行四边形是长方形。', true, '有直角的平行四边形就是长方形。'],
        ['平行四边形的高只能画一条。', false, '平行四边形每组对边之间都可以画无数条高。'],
      ];
      const [t, ok, why] = r.pick(items);
      return { q: `判断：${t}`, answer: [judge(ok)], steps: [why, ok ? '这句话是对的（√）' : '这句话是错的（×）'] };
    },
  },

  // ---------- 除数是两位数的除法 ----------
  {
    id: 'g4a-div-oral', grade: 4, term: 1, unit: '除数是两位数的除法', name: '口算除法',
    tip: '想乘法：除数乘几等于被除数；整十数相除可以先去掉相同个数的 0', level: 1, speed: 8,
    gen(r) {
      const f = r.int(0, 3);
      let d, q;
      if (f === 0) { d = r.int(2, 4) * 10; q = r.int(2, Math.floor(90 / d)); }
      else if (f === 1) { d = r.int(2, 9) * 10; q = r.int(2, 9); }
      else if (f === 2) { d = r.until(() => r.int(11, 48), (x) => x % 10 !== 0); q = r.int(2, Math.floor(99 / d)); }
      else { d = r.int(2, 9) * 10; q = r.int(2, 9) * 10; }
      if (f === 2 && q < 2) q = 2;
      const n = d * q;
      return {
        q: `${n} ÷ ${d} = {0}`, answer: [num(q)],
        steps: [`想：${d} 乘几等于 ${n}？`, `${d} × ${q} = ${n}`, `所以 ${n} ÷ ${d} = ${q}`],
        hint: `${d} 乘几等于 ${n}？`,
      };
    },
  },
  {
    id: 'g4a-div-estimate', grade: 4, term: 1, unit: '除数是两位数的除法', name: '除法估算',
    tip: '把除数看成接近的整十数，被除数看成和它接近、又能被这个整十数整除的数', level: 1,
    gen(r) {
      const k = r.int(2, 9), q = r.int(2, 9), D = k * 10, N = D * q;
      const d = D + r.pick([-2, -1, 1, 2]), n = N + r.pick([-1, 1]) * r.int(1, Math.min(9, Math.floor(D / 4)));
      return {
        q: `估算：${n} ÷ ${d} ≈ {0}`, answer: [num(q)],
        steps: [`把 ${d} 看成 ${D}`, `${n} 接近 ${N}，${N} 正好能被 ${D} 整除`, `${N} ÷ ${D} = ${q}`, `所以 ${n} ÷ ${d} ≈ ${q}`],
        hint: `先把 ${d} 看成整十数`,
      };
    },
  },
  {
    id: 'g4a-div-by-tens', grade: 4, term: 1, unit: '除数是两位数的除法', name: '除数是整十数的笔算',
    tip: '先看被除数的前两位，不够除就看前三位；用除数的几十去想乘法口诀试商', level: 1,
    gen(r) {
      const { d, n } = r.until(() => {
        const d = r.int(2, 9) * 10, q = r.chance(0.6) ? r.int(2, 9) : r.int(11, 40), m = r.chance(0.25) ? 0 : r.int(1, d - 1);
        return { d, n: d * q + m };
      }, (o) => o.n >= 100 && o.n <= 999);
      return {
        q: upDivQ(n, d), answer: upDivAns(n, d),
        steps: [...upDivSteps(n, d), vDiv(n, d), upCheck(n, d)],
        hint: `想 ${d / 10} 的乘法口诀`,
      };
    },
  },
  {
    id: 'g4a-div-round-down', grade: 4, term: 1, unit: '除数是两位数的除法', name: '「四舍」法试商',
    tip: '除数个位是 1~4，用「四舍」把它看作整十数试商；看小了除数，商可能偏大，要改小', level: 1,
    gen(r) {
      const { d, n } = r.until(() => {
        const d = r.int(2, 9) * 10 + r.int(1, 4), q = r.int(2, 9), m = r.int(0, d - 1);
        return { d, n: d * q + m };
      }, (o) => o.n >= 100);
      const t = upTrial(n, d);
      return {
        q: upDivQ(n, d), answer: upDivAns(n, d),
        steps: [`${n} 的前两位 ${Math.floor(n / 10)} 比 ${d} 小，商是一位数，写在个位上`, ...t.lines, vDiv(n, d), upCheck(n, d)],
        hint: `把 ${d} 看作 ${t.D}`,
      };
    },
  },
  {
    id: 'g4a-div-round-up', grade: 4, term: 1, unit: '除数是两位数的除法', name: '「五入」法试商',
    tip: '除数个位是 5~9，用「五入」把它看作整十数试商；看大了除数，商可能偏小，要改大', level: 1,
    gen(r) {
      const { d, n } = r.until(() => {
        const d = r.int(1, 8) * 10 + r.int(5, 9), q = r.int(2, 9), m = r.int(0, d - 1);
        return { d, n: d * q + m };
      }, (o) => o.n >= 100);
      const t = upTrial(n, d);
      return {
        q: upDivQ(n, d), answer: upDivAns(n, d),
        steps: [`${n} 的前两位 ${Math.floor(n / 10)} 比 ${d} 小，商是一位数，写在个位上`, ...t.lines, vDiv(n, d), upCheck(n, d)],
        hint: `把 ${d} 看作 ${t.D}`,
      };
    },
  },
  {
    id: 'g4a-div-adjust', grade: 4, term: 1, unit: '除数是两位数的除法', name: '试商后要调商',
    tip: '乘出来比被除数大，商大了要改小；余数不比除数小，商小了要改大', level: 2,
    gen(r) {
      const o = r.until(() => {
        const d = r.int(1, 9) * 10 + r.pick([1, 2, 3, 4, 5, 6, 7, 8, 9]), q = r.int(2, 9), m = r.int(0, d - 1), n = d * q + m;
        return { d, n, t: upTrial(n, d) };
      }, (o) => o.n >= 100 && o.n < o.d * 10 && o.t.adjusted && o.d >= 12);
      const { d, n, t } = o;
      return {
        q: upDivQ(n, d), answer: upDivAns(n, d),
        steps: [...t.lines, vDiv(n, d), upCheck(n, d)],
        hint: '试商以后乘一乘，再看余数',
      };
    },
  },
  {
    id: 'g4a-div-2digit-quot', grade: 4, term: 1, unit: '除数是两位数的除法', name: '商是两位数的除法',
    tip: '前两位够除，商就写在十位上；每求出一位商，余下的数要比除数小', level: 1,
    gen(r) {
      const d = r.until(() => r.int(12, 89), (x) => x % 10 !== 0), q = r.int(1, 9) * 10 + r.int(1, 9), m = r.chance(0.4) ? 0 : r.int(1, d - 1);
      const n = d * q + m;
      return {
        q: upDivQ(n, d), answer: upDivAns(n, d),
        steps: [...upDivSteps(n, d), vDiv(n, d), upCheck(n, d)],
        hint: '先看被除数前两位够不够除',
      };
    },
  },
  {
    id: 'g4a-div-quot-zero', grade: 4, term: 1, unit: '除数是两位数的除法', name: '商中间或末尾有 0',
    tip: '哪一位不够商 1，就在那一位上商 0 占位，不能空着', level: 2,
    gen(r) {
      const { d, n } = r.until(() => {
        const d = r.until(() => r.int(12, 89), (x) => x % 10 !== 0);
        const q = r.pick([r.int(1, 9) * 10, r.int(1, 9) * 100 + r.int(1, 9), r.int(1, 9) * 100 + r.int(1, 9) * 10]);
        return { d, n: d * q + (r.chance(0.4) ? 0 : r.int(1, d - 1)) };
      }, (o) => o.n <= 9999);
      return {
        q: upDivQ(n, d), answer: upDivAns(n, d),
        steps: [...upDivSteps(n, d), vDiv(n, d), upCheck(n, d)],
        hint: '落下一位后不够商 1，商几？',
      };
    },
  },
  {
    id: 'g4a-quot-rule', grade: 4, term: 1, unit: '除数是两位数的除法', name: '商的变化规律',
    tip: '被除数和除数同时乘或除以同一个数（0 除外），商不变；只变被除数，商跟着同样变；只变除数，商反着变', level: 1,
    gen(r) {
      const f = r.int(0, 5), k = r.pick([2, 3, 4, 5]);
      const c = r.int(2, 30) * (f === 3 || f === 4 ? k : 1), b = r.int(3, 30) * (f === 1 || f === 5 ? k : 1), a = b * c;
      const [x, y, ans, why] = [
        [a * k, b * k, c, `被除数和除数同时乘 ${k}，商不变`],
        [a / k, b / k, c, `被除数和除数同时除以 ${k}，商不变`],
        [a * k, b, c * k, `除数不变，被除数乘 ${k}，商也乘 ${k}`],
        [a / k, b, c / k, `除数不变，被除数除以 ${k}，商也除以 ${k}`],
        [a, b * k, c / k, `被除数不变，除数乘 ${k}，商反而要除以 ${k}`],
        [a, b / k, c * k, `被除数不变，除数除以 ${k}，商反而要乘 ${k}`],
      ][f];
      return {
        q: `已知 ${a} ÷ ${b} = ${c}，那么 ${x} ÷ ${y} = {0}`, answer: [num(ans)],
        steps: [`对比：被除数 ${a} → ${x}，除数 ${b} → ${y}`, why, `所以 ${x} ÷ ${y} = ${ans}`],
        hint: '被除数和除数分别怎么变了？',
      };
    },
  },
  {
    id: 'g4a-div-zero-rem', grade: 4, term: 1, unit: '除数是两位数的除法', name: '去掉末尾 0 后的余数',
    tip: '被除数和除数同时去掉末尾相同个数的 0 来算，商不变，但余数要添上去掉的 0', level: 2,
    gen(r) {
      const z = r.chance(0.6) ? 1 : 2, D = z === 1 && r.bool() ? r.until(() => r.int(12, 45), (x) => x % 10 !== 0) : r.int(2, 9);
      const d = D * 10 ** z, q = r.int(2, D < 10 ? 9 : 30), R = r.int(1, D - 1), m = R * 10 ** z, n = d * q + m;
            return {
        q: `${n} ÷ ${d} = {0} …… {1}`, answer: [num(q, '', '商'), num(m, '', '余数')],
        steps: [`被除数和除数末尾同时去掉 ${z} 个 0：${n / 10 ** z} ÷ ${D} = ${q} …… ${R}，商不变`, `但这个余数 ${R} 其实是 ${R} 个${z === 1 ? '十' : '百'}，要添上去掉的 ${z} 个 0`, `余数是 ${R} 后面添上 ${z} 个 0，就是 ${m}`, `验算：${d} × ${q} + ${m} = ${n} ✓（余数 ${m} 比除数 ${d} 小）`],
        hint: '余数是不是被缩小了？',
      };
    },
  },
  {
    id: 'g4a-div-rem-max', grade: 4, term: 1, unit: '除数是两位数的除法', name: '余数最大时被除数是几',
    tip: '余数一定比除数小，最大是除数 - 1；被除数 = 商 × 除数 + 余数', level: 2,
    gen(r) {
      const d = r.int(12, 45), q = r.int(2, 30), mx = d - 1;
      if (r.chance(0.7)) return {
        q: `□ ÷ ${d} = ${q} …… △，△ 最大是 {0}，这时 □ 是 {1}`, answer: [num(mx, '', '△'), num(d * q + mx, '', '□')],
        steps: [`余数一定比除数小，除数是 ${d}，余数最大是 ${d} - 1 = ${mx}`, '被除数 = 商 × 除数 + 余数', `□ = ${q} × ${d} + ${mx} = ${d * q + mx}`],
        hint: '余数和除数比，谁大？',
      };
      return {
        q: `□ ÷ ${d} = ${q} …… △（△ 不是 0），□ 最小是 {0}，最大是 {1}`, answer: [num(d * q + 1, '', '最小'), num(d * q + mx, '', '最大')],
        steps: ['余数最小是 1（不是 0），最大是除数 - 1', `□ 最小：${q} × ${d} + 1 = ${d * q + 1}`, `□ 最大：${q} × ${d} + ${mx} = ${d * q + mx}`],
        hint: '余数可以是哪些数？',
      };
    },
  },
  {
    id: 'g4a-div-rem-word', grade: 4, term: 1, unit: '除数是两位数的除法', name: '进一法和去尾法', process: true,
    tip: '剩下的也要安排（坐车、装箱）就「进一」，剩下的不够再做一份（买东西、做衣服）就「去尾」', level: 2,
    gen(r) {
      const T = r.pick([
        { up: true, c: () => r.pick([35, 40, 45, 50, 55]), n: (c) => r.int(c * 4, c * 12), q: (c, n) => `学校组织 ${n} 名同学去春游，每辆大巴车最多坐 ${c} 人。至少要租多少辆大巴车？`, u: '辆', left: (m) => `剩下的 ${m} 人也要坐车，还要再租 1 辆` },
        { up: true, c: () => r.int(12, 30), n: (c) => r.int(c * 5, c * 20), q: (c, n) => `图书室有 ${n} 本书，每个纸箱最多装 ${c} 本。把这些书都装好，至少需要多少个纸箱？`, u: '个', left: (m) => `剩下的 ${m} 本书也要装，还需要 1 个纸箱` },
        { up: true, c: () => r.int(12, 24), n: (c) => r.int(c * 3, c * 10), q: (c, n) => `${n} 名游客坐船游湖，每条船最多坐 ${c} 人。至少需要多少条船？`, u: '条', left: (m) => `剩下的 ${m} 人也要坐船，还要 1 条船` },
        { up: false, c: () => r.int(12, 48), n: (c) => r.int(c * 4, c * 20), q: (c, n) => `${r.name()}有 ${n} 元，每本故事书 ${c} 元，最多能买多少本？`, u: '本', left: (m) => `剩下 ${m} 元不够再买一本，舍去` },
        { up: false, c: () => r.int(24, 36), n: (c) => r.int(c * 10, c * 30), q: (c, n) => `${n} 个鸡蛋，每 ${c} 个装一盒，最多能装满多少盒？`, u: '盒', left: (m) => `剩下 ${m} 个装不满一盒，舍去` },
        { up: false, c: () => r.int(65, 95), n: (c) => r.int(c * 5, c * 12), q: (c, n) => `包一个礼盒要用 ${c} 厘米彩带，${n} 厘米彩带最多能包多少个礼盒？`, u: '个', left: (m) => `剩下 ${m} 厘米不够再包一个，舍去` },
      ]);
      const { c, n } = r.until(() => { const c = T.c(); return { c, n: T.n(c) }; }, (o) => o.n % o.c !== 0);
      const q = Math.floor(n / c), m = n % c, ans = T.up ? q + 1 : q;
      return {
        q: T.q(c, n), answer: [num(ans, T.u)],
        steps: [`求 ${n} 里面有几个 ${c}，用除法`, `${n} ÷ ${c} = ${q} …… ${m}`, T.left(m), T.up ? `${q} + 1 = ${ans}（${T.u}）` : `最多 ${q} ${T.u}`, `答：${T.up ? '至少' : '最多'} ${ans} ${T.u}。`],
      };
    },
  },
  {
    id: 'g4a-ext-sum-diff', grade: 4, term: 1, unit: '除数是两位数的除法', name: '和差问题', process: true,
    tip: '（和 + 差）÷ 2 = 大数，（和 - 差）÷ 2 = 小数', level: 3,
    gen(r) {
      const small = r.int(12, 60), d = r.int(2, 30), big = small + d, sum = big + small;
      const T = r.pick([
        { q: `四（1）班和四（2）班一共有 ${sum} 人，一班比二班多 ${d} 人。两个班各有多少人？`, A: '一班', B: '二班', u: '人' },
        { q: `两筐苹果一共重 ${sum} 千克，第一筐比第二筐重 ${d} 千克。两筐各重多少千克？`, A: '第一筐', B: '第二筐', u: '千克' },
        { q: `NAMEA和NAMEB一共有 ${sum} 张邮票，NAMEA比NAMEB多 ${d} 张。两人各有多少张？`, A: 'NAMEA', B: 'NAMEB', u: '张' },
        { q: `图书角有故事书和科技书一共 ${sum} 本，故事书比科技书多 ${d} 本。两种书各有多少本？`, A: '故事书', B: '科技书', u: '本' },
        { q: `一根绳子长 ${sum} 米，剪成两段，一段比另一段长 ${d} 米。两段各长多少米？`, A: '长的一段', B: '短的一段', u: '米' },
      ]);
      const [na, nb] = r.names(2), sub = (x) => x.replace(/NAMEA/g, na).replace(/NAMEB/g, nb);
      return {
        q: sub(T.q), fig: fig.bars([{ label: sub(T.A), units: 2, extra: 0.6, extraText: `多${d}` }, { label: sub(T.B), units: 2 }]),
        answer: [num(big, T.u, sub(T.A)), num(small, T.u, sub(T.B))],
        steps: [`看线段图：把多的 ${d} ${T.u}去掉，两个数就一样多，和变成 ${sum} - ${d} = ${sum - d}`, `${sub(T.B)}：${sum - d} ÷ 2 = ${small}（${T.u}）`, `${sub(T.A)}：${small} + ${d} = ${big}（${T.u}）`, `检验：${big} + ${small} = ${sum}，${big} - ${small} = ${d} ✓`],
        hint: '先把多出来的部分去掉，两个就一样多了',
      };
    },
  },
  {
    id: 'g4a-ext-sum-times', grade: 4, term: 1, unit: '除数是两位数的除法', name: '和倍问题', process: true,
    tip: '把小数看作 1 份，大数是几份，和就是（倍数 + 1）份：和 ÷（倍数 + 1）= 小数', level: 3,
    gen(r) {
      const k = r.int(2, 6), small = r.int(8, 60), big = small * k, sum = small + big;
      const T = r.pick([
        { q: `鸡和鸭一共有 ${sum} 只，鸡的只数是鸭的 ${k} 倍。鸡和鸭各有多少只？`, A: '鸡', B: '鸭', u: '只' },
        { q: `学校买来足球和篮球一共 ${sum} 个，足球的个数是篮球的 ${k} 倍。足球、篮球各买了多少个？`, A: '足球', B: '篮球', u: '个' },
        { q: `NAMEA和NAMEB一共收集了 ${sum} 个瓶子，NAMEA收集的是NAMEB的 ${k} 倍。两人各收集了多少个？`, A: 'NAMEA', B: 'NAMEB', u: '个' },
        { q: `果园里桃树和梨树一共 ${sum} 棵，桃树的棵数是梨树的 ${k} 倍。桃树、梨树各有多少棵？`, A: '桃树', B: '梨树', u: '棵' },
        { q: `两个仓库一共存粮 ${sum} 吨，甲仓库存粮是乙仓库的 ${k} 倍。两个仓库各存粮多少吨？`, A: '甲仓库', B: '乙仓库', u: '吨' },
      ]);
      const [na, nb] = r.names(2), sub = (x) => x.replace(/NAMEA/g, na).replace(/NAMEB/g, nb);
      return {
        q: sub(T.q), fig: fig.bars([{ label: sub(T.A), units: k }, { label: sub(T.B), units: 1 }]),
        answer: [num(big, T.u, sub(T.A)), num(small, T.u, sub(T.B))],
        steps: [`把${sub(T.B)}看作 1 份，${sub(T.A)}就是 ${k} 份，一共 ${k} + 1 = ${k + 1}（份）`, `1 份：${sum} ÷ ${k + 1} = ${small}（${T.u}），就是${sub(T.B)}`, `${sub(T.A)}：${small} × ${k} = ${big}（${T.u}）`, `检验：${big} + ${small} = ${sum} ✓`],
        hint: '和里面一共有几份？',
      };
    },
  },

  // ---------- 条形统计图 ----------
  {
    id: 'g4a-bar-chart', grade: 4, term: 1, unit: '条形统计图', name: '看条形统计图回答问题',
    tip: '先看纵轴一格表示多少，再数直条有几格；不满一格的看半格', level: 1,
    gen(r) {
      const T = r.pick([
        { t: '四（1）班同学最喜欢的运动', cats: ['跳绳', '足球', '篮球', '乒乓球'], unit: '人', steps: [2], max: 9 },
        { t: '学校各兴趣小组的人数', cats: ['美术', '书法', '科技', '合唱'], unit: '人', steps: [5, 10], max: 8 },
        { t: '各年级回收的废纸', cats: ['三年级', '四年级', '五年级', '六年级'], unit: '千克', steps: [5, 10, 20], max: 9 },
        { t: '商店上半年卖出的空调', cats: ['一月', '二月', '三月', '四月', '五月'], unit: '台', steps: [20, 50], max: 9 },
        { t: '小明家四个季度的用电量', cats: ['一季度', '二季度', '三季度', '四季度'], unit: '千瓦时', steps: [50, 100], max: 8 },
        { t: '同学们最喜欢的水果', cats: ['苹果', '香蕉', '葡萄', '西瓜'], unit: '人', steps: [2, 4], max: 9 },
      ]);
      const step = r.pick(T.steps), half = step % 2 === 0 && r.chance(0.4);
      const vals = r.until(() => T.cats.map(() => (r.int(1, T.max) + (half && r.chance(0.3) ? 0.5 : 0)) * step), (v) => new Set(v).size === v.length);
      const f = r.int(0, 2), i = r.int(0, T.cats.length - 1);
      const grid = (v) => `${T.cats[vals.indexOf(v)]}的直条有 ${v / step} 格，${v / step} × ${step} = ${v}`;
      const head = `纵轴上每格表示 ${step} ${T.unit}`;
      if (f === 0) return { q: `${T.t}如图。${T.cats[i]}是多少${T.unit}？`, fig: upBarChart(T.cats, vals, step, T.unit), answer: [num(vals[i], T.unit)], steps: [head, grid(vals[i]), `${T.cats[i]}是 ${vals[i]} ${T.unit}`] };
      if (f === 1) {
        const [a, b] = r.sample([...vals.keys()], 2).sort((x, y) => vals[y] - vals[x]);
        return { q: `${T.t}如图。${T.cats[a]}比${T.cats[b]}多多少${T.unit}？`, fig: upBarChart(T.cats, vals, step, T.unit), answer: [num(vals[a] - vals[b], T.unit)], steps: [head, grid(vals[a]), grid(vals[b]), `${vals[a]} - ${vals[b]} = ${vals[a] - vals[b]}（${T.unit}）`] };
      }
      const tot = vals.reduce((x, y) => x + y, 0);
      return { q: `${T.t}如图。一共是多少${T.unit}？`, fig: upBarChart(T.cats, vals, step, T.unit), answer: [num(tot, T.unit)], steps: [head, `读出每个直条：${T.cats.map((c, k) => `${c} ${vals[k]}`).join('，')}`, `${vals.join(' + ')} = ${tot}（${T.unit}）`] };
    },
  },

  // ---------- 数学广角——优化 ----------
  {
    id: 'g4a-opt-tea', grade: 4, term: 1, unit: '数学广角——优化', name: '合理安排时间（沏茶问题）', process: true,
    tip: '找出等待时间最长的那件事，其他能同时做的事都放在等待的时候做', level: 1,
    gen(r) {
      const T = r.pick([
        { pre: ['洗水壶', '接水'], long: '烧水', par: ['洗茶杯', '找茶叶'], post: '沏茶', who: '妈妈要沏茶招待客人' },
        { pre: ['洗锅', '接水'], long: '烧水', par: ['拿饺子', '准备碗筷'], post: '煮饺子', who: '爸爸要煮饺子' },
        { pre: ['收脏衣服', '放洗衣液'], long: '洗衣机洗衣服', par: ['扫地', '擦桌子'], post: '晾衣服', who: 'NAME周末帮妈妈做家务' },
        { pre: ['淘米', '加水'], long: '电饭煲煮粥', par: ['刷牙洗脸', '整理书包'], post: '吃早饭', who: 'NAME早上起床后' },
        { pre: ['打鸡蛋', '和面'], long: '烤箱烤蛋糕', par: ['洗碗', '切水果'], post: '装饰蛋糕', who: 'NAME和妈妈做蛋糕' },
      ]);
      const L = r.int(8, 15), pre = T.pre.map(() => r.int(1, 3)), post = r.int(1, 3);
      const par = r.until(() => T.par.map(() => r.int(1, 5)), (v) => v.reduce((a, b) => a + b, 0) <= L);
      const all = [...T.pre.map((n, i) => `${n} ${pre[i]} 分钟`), `${T.long} ${L} 分钟`, ...T.par.map((n, i) => `${n} ${par[i]} 分钟`), `${T.post} ${post} 分钟`];
      const tot = pre[0] + pre[1] + L + post, parSum = par[0] + par[1];
      return {
        q: `${T.who.replace('NAME', r.name())}，要做这些事：${r.shuffle(all).join('，')}。最少要多少分钟？`, answer: [num(tot, '分钟')],
        steps: [`${T.pre.join('、')}要在${T.long}之前做，${T.post}要等${T.long}完才能做`, `${T.long}的 ${L} 分钟里，可以同时${T.par.join('、')}（${par.join(' + ')} = ${parSum} 分钟，不超过 ${L} 分钟）`, `最少时间 = ${pre.join(' + ')} + ${L} + ${post} = ${tot}（分钟）`, `答：最少要 ${tot} 分钟。`],
        hint: '哪些事可以在等待的时候同时做？',
      };
    },
  },
  {
    id: 'g4a-opt-pancake', grade: 4, term: 1, unit: '数学广角——优化', name: '烙饼问题（每次 2 张）', process: true,
    tip: '每张饼要烙两面，每次烙 2 个面；饼数是 2 张以上时，最少次数 = 饼数，别让锅空着', level: 1,
    gen(r) {
      const T = r.pick([['烙饼', '张', '饼', '锅'], ['煎鸡蛋', '个', '鸡蛋', '平底锅'], ['烤面包片', '片', '面包片', '烤盘'], ['煎牛排', '块', '牛排', '锅']]);
      const n = r.int(1, 12), t = r.int(2, 5), times = n === 1 ? 2 : n, tot = times * t;
      return {
        q: `${T[0]}时，${T[3]}里每次最多放 2 ${T[1]}，两面都要${T[0].slice(0, 1)}，每面要 ${t} 分钟。${T[0].slice(0, 1)} ${n} ${T[1]}${T[2]}最少要多少分钟？`, answer: [num(tot, '分钟')],
        steps: n === 1
          ? [`只有 1 ${T[1]}，正面、反面要分两次`, `2 × ${t} = ${tot}（分钟）`, `答：最少要 ${tot} 分钟。`]
          : [`${n} ${T[1]}一共有 ${n} × 2 = ${2 * n} 个面`, `每次能${T[0].slice(0, 1)} 2 个面，最少要 ${2 * n} ÷ 2 = ${n} 次${n % 2 ? `（单数${T[1]}时，最后 3 ${T[1]}轮流着${T[0].slice(0, 1)}，每次都放满 2 ${T[1]}）` : ''}`, `${n} × ${t} = ${tot}（分钟）`, `答：最少要 ${tot} 分钟。`],
        hint: '一共有几个面？每次能烙几个面？',
      };
    },
  },
  {
    id: 'g4a-opt-pancake3', grade: 4, term: 1, unit: '数学广角——优化', name: '烙饼问题（每次 3 张）', process: true,
    tip: '先算一共有几个面，再算每次烙 3 个面要几次；饼比 3 张少时也至少要 2 次', level: 2,
    gen(r) {
      const n = r.int(2, 10), t = r.int(2, 5), faces = 2 * n, times = Math.max(2, Math.ceil(faces / 3)), tot = times * t;
      return {
        q: `一口大锅每次最多能烙 3 张饼，每张饼要烙正反两面，每面 ${t} 分钟。烙 ${n} 张饼最少要多少分钟？`, answer: [num(tot, '分钟')],
        steps: n < 3
          ? [`只有 ${n} 张饼，每张饼的两面不能同时烙，至少要 2 次`, `2 × ${t} = ${tot}（分钟）`, `答：最少要 ${tot} 分钟。`]
          : [`${n} 张饼一共有 ${n} × 2 = ${faces} 个面`, `每次最多烙 3 个面，${faces} ÷ 3 = ${Math.floor(faces / 3)}${faces % 3 ? ` …… ${faces % 3}，余下的面还要再烙 1 次` : ''}，最少 ${times} 次`, `${times} × ${t} = ${tot}（分钟）`, `答：最少要 ${tot} 分钟。`],
        hint: '一共有几个面？每次能烙几个面？',
      };
    },
  },
  {
    id: 'g4a-opt-tianji', grade: 4, term: 1, unit: '数学广角——优化', name: '田忌赛马（怎样出能赢）',
    tip: '三局两胜：用自己最弱的去对对方最强的，另外两个各赢对方一局', level: 2,
    gen(r) {
      const T = r.pick([
        { lo: 2, hi: 13, ctx: (n) => `${n}和小林玩扑克牌比大小（A 算 1，J、Q、K 算 11、12、13），每人 3 张，每次各出一张，点数大的赢，三局两胜。`, mineL: (n) => `${n}的牌`, oppL: '小林的牌', act: '出牌' },
        { lo: 95, hi: 185, ctx: (n) => `${n}的小组和二组比赛一分钟跳绳，每组 3 人，一对一比，跳得多的赢，三局两胜。`, mineL: (n) => `${n}小组三人的成绩（下）`, oppL: '二组三人的成绩（下）', act: '出场' },
        { lo: 1, hi: 9, ctx: (n) => `${n}和同桌玩数字卡片比大小，每人 3 张，每次各出一张，数大的赢，三局两胜。`, mineL: (n) => `${n}的卡片`, oppL: '同桌的卡片', act: '出卡片' },
      ]);
      const v = r.sample(Array.from({ length: T.hi - T.lo + 1 }, (_, i) => i + T.lo), 6).sort((a, b) => a - b);
      const [a1, b1, a2, b2, a3, b3] = v; // a1 < b1 < a2 < b2 < a3 < b3
      const mine = [a1, a2, a3], opp = r.shuffle([b1, b2, b3]), nm = r.name();
      const win = opp.map((o) => (o === b3 ? a1 : o === b1 ? a2 : a3));
      const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].map((p) => p.map((i) => mine[i]));
      const fmtP = (p) => p.join('、');
      return {
        q: `${T.ctx(nm)}${T.mineL(nm)}：${mine.join('、')}；${T.oppL}：${b1}、${b2}、${b3}。对方按 ${opp.join('、')} 的顺序${T.act}，${nm}应该按什么顺序${T.act}才能赢？{0}`,
        answer: [choice(r, fmtP(win), perms.map(fmtP).filter((x) => x !== fmtP(win)))],
        steps: [`对方最大的 ${b3} 谁都赢不了，就用最小的 ${a1} 去对它（输一局）`, `用 ${a2} 对 ${b1}，${a2} > ${b1}，赢`, `用 ${a3} 对 ${b2}，${a3} > ${b2}，赢`, `对方按 ${opp.join('、')} 的顺序，${nm}就按 ${fmtP(win)} 的顺序，赢两局`],
        hint: '对方最大的那个，我们谁去对它？',
      };
    },
  },
  {
    id: 'g4a-opt-queue', grade: 4, term: 1, unit: '数学广角——优化', name: '排队等候时间最少', process: true,
    tip: '用时少的人先来，后面的人等的时间就少；每个人等候的时间包括自己用的时间', level: 2,
    gen(r) {
      const T = r.pick([['打水', '个水龙头', '同学'], ['打印资料', '台打印机', '老师'], ['看病', '位医生', '病人'], ['理发', '位理发师', '顾客']]);
      const n = r.int(3, 4), ts = r.until(() => Array.from({ length: n }, () => r.int(1, 8)), (v) => new Set(v).size === n);
      const names = r.names(n), sorted = ts.map((t, i) => [t, names[i]]).sort((a, b) => a[0] - b[0]);
      let acc = 0; const waits = sorted.map(([t]) => (acc += t));
      const tot = waits.reduce((a, b) => a + b, 0);
      return {
        q: `${n} 位${T[2]}${T[0]}，只有 1 ${T[1]}。${names.map((x, i) => `${x}要 ${ts[i]} 分钟`).join('，')}。怎样安排，他们等候时间的总和最少？最少是多少分钟？（每人等候时间包括自己${T[0]}的时间）`,
        answer: [num(tot, '分钟')],
        steps: [`用时少的先来：${sorted.map(([, x]) => x).join(' → ')}`, ...sorted.map(([t, x], i) => `${x}等 ${i ? `${waits[i - 1]} + ${t} = ` : ''}${waits[i]} 分钟`), `总和：${waits.join(' + ')} = ${tot}（分钟）`, `答：最少是 ${tot} 分钟。`],
        hint: '谁先来，后面的人等得少？',
      };
    },
  },

  {
    id: 'g4a-ext-chicken-rabbit', grade: 4, term: 1, unit: '数学广角——优化', name: '鸡兔同笼入门', process: true,
    tip: '列表试一试：从全是鸡开始，每把 1 只鸡换成 1 只兔，脚就多 2 只', level: 3,
    gen(r) {
      const H = r.int(5, 12), rab = r.int(1, H - 1), ch = H - rab, L = ch * 2 + rab * 4;
      const rows = [0, 1, 2].map((k) => `鸡 ${H - k} 只、兔 ${k} 只 → ${2 * (H - k) + 4 * k} 只脚`);
      return {
        q: `笼子里有鸡和兔，从上面数有 ${H} 个头，从下面数有 ${L} 只脚。鸡和兔各有几只？`, answer: [num(ch, '只', '鸡'), num(rab, '只', '兔')],
        steps: [`列表从全是鸡开始试：${rows.join('；')}……`, `每把 1 只鸡换成 1 只兔，脚多 2 只`, `全是鸡时 ${2 * H} 只脚，比 ${L} 少 ${L - 2 * H} 只，要换 ${L - 2 * H} ÷ 2 = ${rab}（次），兔就是 ${rab} 只`, `鸡：${H} - ${rab} = ${ch}（只）`, `检验：${ch} × 2 + ${rab} × 4 = ${L} ✓`],
        hint: '先假设全是鸡，有几只脚？',
      };
    },
  },
];

// ===== 下册工具 =====
/** 脱式计算（等号对齐）：loTuo('120 + 35 × 4', ['120 + 140', '260']) */
const loTuo = (first, rest) => ({ pre: ['  ' + first, ...rest.map((s) => '= ' + s)].join('\n') });
/** 不是整十数的随机数 */
const loNz = (r, a, b) => r.until(() => r.int(a, b), (v) => v % 10 !== 0);
const loWord = (v) => (v >= 1000 ? '整千数' : v >= 100 ? '整百数' : '整十数');

// ---- 运算定律 / 简便计算的出题函数（单独题型和「综合简算」共用） ----
function loGenAdd(r) {
  const T = r.pick([100, 100, 200, 300, 500, 1000]);
  const a = loNz(r, 11, T - 11), c = T - a, b = loNz(r, 23, 489), k = r.int(0, 2);
  if (k === 0) {
    return {
      q: `${a} + ${b} + ${c} = {0}`, answer: [num(a + b + c)],
      steps: [`${a} 和 ${c} 能凑成${loWord(T)}：${a} + ${c} = ${T}`, `用加法交换律交换 ${b} 和 ${c} 的位置，再用加法结合律先算 ${a} + ${c}`, loTuo(`${a} + ${b} + ${c}`, [`${a} + ${c} + ${b}`, `${T} + ${b}`, `${a + b + c}`])],
      hint: '哪两个数相加能凑成整百、整千？',
    };
  }
  if (k === 1) {
    return {
      q: `${b} + ${a} + ${c} = {0}`, answer: [num(a + b + c)],
      steps: [`后两个数 ${a} 和 ${c} 能凑成${loWord(T)} ${T}`, `用加法结合律，先算 ${a} + ${c}`, loTuo(`${b} + ${a} + ${c}`, [`${b} + (${a} + ${c})`, `${b} + ${T}`, `${a + b + c}`])],
      hint: '哪两个数相加能凑成整百、整千？',
    };
  }
  const T2 = r.pick([100, 200, 300]);
  const d = r.until(() => loNz(r, 11, T2 - 11), (v) => v !== a && v !== c), e = T2 - d;
  return {
    q: `${a} + ${d} + ${c} + ${e} = {0}`, answer: [num(T + T2)],
    steps: [`${a} + ${c} = ${T}，${d} + ${e} = ${T2}，都能凑整`, '用加法交换律和结合律，把能凑整的两个数放在一起先加', loTuo(`${a} + ${d} + ${c} + ${e}`, [`(${a} + ${c}) + (${d} + ${e})`, `${T} + ${T2}`, `${T + T2}`])],
    hint: '把能凑成整百的两个数放在一起',
  };
}

function loGenMul(r) {
  const [p, q] = r.pick([[25, 4], [125, 8], [5, 2], [25, 8], [125, 4], [50, 2], [5, 20], [25, 40], [4, 25], [8, 125], [2, 50], [20, 5]]);
  const x = loNz(r, 11, 99), pq = p * q, res = pq * x, k = r.int(0, 2);
  const say = `${p} × ${q} = ${pq}，是${loWord(pq)}`;
  if (k === 0) return { q: `${p} × ${x} × ${q} = {0}`, answer: [num(res)], steps: [say, `用乘法交换律交换 ${x} 和 ${q} 的位置，再用乘法结合律先算 ${p} × ${q}`, loTuo(`${p} × ${x} × ${q}`, [`${p} × ${q} × ${x}`, `${pq} × ${x}`, `${res}`])], hint: `${p} 和哪个数相乘能得到整十、整百？` };
  if (k === 1) return { q: `${x} × ${p} × ${q} = {0}`, answer: [num(res)], steps: [say, `用乘法结合律，先算后两个数 ${p} × ${q}`, loTuo(`${x} × ${p} × ${q}`, [`${x} × (${p} × ${q})`, `${x} × ${pq}`, `${res}`])], hint: `${p} 和哪个数相乘能得到整十、整百？` };
  return { q: `${p} × (${x} × ${q}) = {0}`, answer: [num(res)], steps: [say, `用乘法交换律和结合律，把 ${p} 和 ${q} 放在一起先乘`, loTuo(`${p} × (${x} × ${q})`, [`(${p} × ${q}) × ${x}`, `${pq} × ${x}`, `${res}`])], hint: `${p} 和哪个数相乘能得到整十、整百？` };
}

function loGenDistrib(r) {
  let a, b, c;
  if (r.bool()) {
    if (r.bool()) { c = 25; a = r.pick([40, 80, 100, 200, 400]); b = r.pick([2, 4, 6, 8]); }
    else { c = 125; a = r.pick([40, 80, 160, 800]); b = r.pick([2, 4, 8]); }
  } else { a = r.pick([100, 100, 200]); b = r.int(1, 9); c = loNz(r, 12, 99); }
  const minus = r.chance(0.3), op = minus ? '-' : '+', s = minus ? a - b : a + b, res = s * c;
  const front = r.bool();
  const left = front ? `(${a} ${op} ${b}) × ${c}` : `${c} × (${a} ${op} ${b})`;
  const exp = front ? `${a} × ${c} ${op} ${b} × ${c}` : `${c} × ${a} ${op} ${c} × ${b}`;
  return {
    q: `${left} = {0}`, answer: [num(res)],
    steps: [`用乘法分配律：两个数的${minus ? '差' : '和'}乘一个数，可以先把它们分别和这个数相乘，再${minus ? '相减' : '相加'}`, loTuo(left, [exp, `${a * c} ${op} ${b * c}`, `${res}`]), `注意：${b} 也要乘 ${c}，不能漏乘`],
    hint: `把 ${a} 和 ${b} 分别乘 ${c}`,
  };
}

function loGenDistribRev(r) {
  const c = loNz(r, 12, 99), minus = r.chance(0.3);
  let a, b, T;
  if (!minus) { T = r.pick([10, 100, 100, 100, 200, 1000]); a = T === 10 ? r.int(1, 9) : loNz(r, 11, T - 11); b = T - a; }
  else { T = r.pick([10, 100]); b = loNz(r, 11, 89); a = b + T; }
  const op = minus ? '-' : '+', f = r.int(0, 2);
  const left = f === 0 ? `${c} × ${a} ${op} ${c} × ${b}` : f === 1 ? `${a} × ${c} ${op} ${b} × ${c}` : `${c} × ${a} ${op} ${b} × ${c}`;
  const merged = f === 1 ? `(${a} ${op} ${b}) × ${c}` : `${c} × (${a} ${op} ${b})`;
  const last = f === 1 ? `${T} × ${c}` : `${c} × ${T}`;
  return {
    q: `${left} = {0}`, answer: [num(c * T)],
    steps: [`两个乘法算式里都有相同的因数 ${c}`, `用乘法分配律（反过来用），把 ${c} 提出来，先算 ${a} ${op} ${b} = ${T}`, loTuo(left, [merged, last, `${c * T}`])],
    hint: '两个积里有没有相同的因数？',
  };
}

function loGenHidden(r) {
  const m = r.pick([99, 999, 49, 19, 9, 101, 1001, 51, 21, 11]);
  const plus = [99, 999, 49, 19, 9].includes(m), M = plus ? m + 1 : m - 1, op = plus ? '+' : '-';
  const a = loNz(r, 12, 99), res = a * M, f = r.int(0, 2);
  let left, t1, t2, t3;
  if (f === 0) { left = `${a} × ${m} ${op} ${a}`; t1 = `${a} × ${m} ${op} ${a} × 1`; t2 = `${a} × (${m} ${op} 1)`; t3 = `${a} × ${M}`; }
  else if (f === 1) { left = `${m} × ${a} ${op} ${a}`; t1 = `${m} × ${a} ${op} 1 × ${a}`; t2 = `(${m} ${op} 1) × ${a}`; t3 = `${M} × ${a}`; }
  else if (plus) { left = `${a} + ${a} × ${m}`; t1 = `${a} × 1 + ${a} × ${m}`; t2 = `${a} × (1 + ${m})`; t3 = `${a} × ${M}`; }
  else { left = `${a} × ${m} - ${a}`; t1 = `${a} × ${m} - ${a} × 1`; t2 = `${a} × (${m} - 1)`; t3 = `${a} × ${M}`; }
  return {
    q: `${left} = {0}`, answer: [num(res)],
    steps: [`单独的 ${a} 可以看成 ${a} × 1`, `这样两部分都有因数 ${a}，用乘法分配律把 ${a} 提出来`, loTuo(left, [t1, t2, t3, `${res}`]), `易错：括号里是 ${m} ${op} 1，不是 ${m} ${op} ${a}`],
    hint: `把单独的 ${a} 看成 ${a} × 1`,
  };
}

function loGenSub(r) {
  const k = r.int(0, 2);
  if (k === 0) {
    const T = r.pick([100, 100, 200, 300, 1000]), b = loNz(r, 11, T - 11), c = T - b, a = loNz(r, T + 23, T + 877);
    return {
      q: `${a} - ${b} - ${c} = {0}`, answer: [num(a - T)],
      steps: [`${b} + ${c} = ${T}，正好凑成${loWord(T)}`, '用减法的性质：一个数连续减去两个数，等于减去这两个数的和', loTuo(`${a} - ${b} - ${c}`, [`${a} - (${b} + ${c})`, `${a} - ${T}`, `${a - T}`])],
      hint: '两个减数加起来是多少？',
    };
  }
  if (k === 1) {
    const H = 100 * r.int(2, 8), b = loNz(r, 12, 499), a = b + H, c = loNz(r, 12, H - 12);
    return {
      q: `${a} - (${b} + ${c}) = {0}`, answer: [num(a - b - c)],
      steps: [`${a} - ${b} = ${H}，正好是${loWord(H)}`, '用减法的性质：一个数减去两个数的和，等于连续减去这两个数', loTuo(`${a} - (${b} + ${c})`, [`${a} - ${b} - ${c}`, `${H} - ${c}`, `${H - c}`])],
      hint: `${a} 先减哪个数能得到整百数？`,
    };
  }
  const H = 100 * r.int(2, 8), c = loNz(r, 12, 499), a = c + H, b = loNz(r, 12, H - 12);
  return {
    q: `${a} - ${b} - ${c} = {0}`, answer: [num(a - b - c)],
    steps: [`${a} - ${c} = ${H}，正好是${loWord(H)}`, '连续减去两个数，可以交换两个减数的位置（减法的性质）', loTuo(`${a} - ${b} - ${c}`, [`${a} - ${c} - ${b}`, `${H} - ${b}`, `${H - b}`])],
    hint: `${a} 先减哪个数能得到整百数？`,
  };
}

function loGenDiv(r) {
  if (r.bool()) {
    const [b, c] = r.pick([[25, 4], [4, 25], [125, 8], [8, 125], [5, 2], [2, 5], [5, 20], [25, 8], [50, 2]]);
    const P = b * c, k = P >= 1000 ? r.int(2, 30) : loNz(r, 12, 99), a = P * k;
    return {
      q: `${a} ÷ ${b} ÷ ${c} = {0}`, answer: [num(k)],
      steps: [`${b} × ${c} = ${P}，是${loWord(P)}`, '用除法的性质：一个数连续除以两个数，等于除以这两个数的积', loTuo(`${a} ÷ ${b} ÷ ${c}`, [`${a} ÷ (${b} × ${c})`, `${a} ÷ ${P}`, `${k}`])],
      hint: '两个除数相乘是多少？',
    };
  }
  const b = loNz(r, 12, 99), M = r.pick([100, 200, 300, 400, 1000]);
  const c = r.pick([2, 4, 5, 10, 20, 25, 50].filter((v) => M % v === 0 && v < M)), a = b * M;
  return {
    q: `${a} ÷ (${b} × ${c}) = {0}`, answer: [num(M / c)],
    steps: [`${a} ÷ ${b} = ${M}，很好算`, '用除法的性质：一个数除以两个数的积，等于连续除以这两个数', loTuo(`${a} ÷ (${b} × ${c})`, [`${a} ÷ ${b} ÷ ${c}`, `${M} ÷ ${c}`, `${M / c}`])],
    hint: `${a} 先除以哪个数好算？`,
  };
}

function loGenNear(r) {
  const n = r.pick([99, 98, 97, 199, 198, 299, 101, 102, 103, 201, 202, 301]);
  const N = Math.round(n / 100) * 100, e = n - N, add = r.bool();
  const a = r.until(() => loNz(r, 123, 899), (v) => add || v > n + 30);
  const res = add ? a + n : a - n, E = Math.abs(e);
  let say, line, mid;
  if (add) {
    say = e < 0 ? `把 ${n} 看成 ${N}，多加了 ${E}，要再减去 ${E}` : `把 ${n} 看成 ${N}，少加了 ${E}，要再加上 ${E}`;
    line = `${a} + ${N} ${e < 0 ? '-' : '+'} ${E}`; mid = `${a + N} ${e < 0 ? '-' : '+'} ${E}`;
  } else {
    say = e < 0 ? `把 ${n} 看成 ${N}，多减了 ${E}，要再加上 ${E}` : `把 ${n} 看成 ${N}，少减了 ${E}，要再减去 ${E}`;
    line = `${a} - ${N} ${e < 0 ? '+' : '-'} ${E}`; mid = `${a - N} ${e < 0 ? '+' : '-'} ${E}`;
  }
  return {
    q: `${a} ${add ? '+' : '-'} ${n} = {0}`, answer: [num(res)],
    steps: [`${n} 接近整百数 ${N}`, say, loTuo(`${a} ${add ? '+' : '-'} ${n}`, [line, mid, `${res}`]), add ? '口诀：多加了要减去，少加了要加上' : '口诀：多减了要加上，少减了要减去'],
    hint: `${n} 接近哪个整百数？`,
  };
}

function loGen25(r) {
  const k = r.chance(0.8) ? r.until(() => r.int(3, 24), (v) => v % 5 !== 0) : r.until(() => r.int(26, 49), (v) => v % 5 !== 0);
  const n = 4 * k, left = r.bool() ? `25 × ${n}` : `${n} × 25`;
  return {
    q: `${left} = {0}`, answer: [num(100 * k)],
    steps: [`${n} = 4 × ${k}，25 × 4 = 100`, `把 ${n} 拆成 4 × ${k}，再用乘法结合律先算 25 × 4`, loTuo(left, [`25 × 4 × ${k}`, `100 × ${k}`, `${100 * k}`])],
    hint: `${n} 里面有几个 4？`,
  };
}

function loGen125(r) {
  if (r.chance(0.25)) {
    const [m, w] = r.pick([[32, '8 × 4'], [16, '8 × 2'], [64, '8 × 8'], [24, '8 × 3']]);
    const other = m === 32 ? 25 : m === 16 ? 5 : m === 64 ? 25 : 5;
    const part = m === 32 ? '4 × 25' : m === 16 ? '2 × 5' : m === 64 ? '8 × 25' : '3 × 5';
    const pv = (m / 8) * other, res = 1000 * pv;
    return {
      q: `125 × ${m} × ${other} = {0}`, answer: [num(res)],
      steps: [`把 ${m} 拆成 ${w}`, `用乘法结合律，先算 125 × 8 = 1000，再算 ${part} = ${pv}`, loTuo(`125 × ${m} × ${other}`, [`125 × ${w} × ${other}`, `(125 × 8) × (${part})`, `1000 × ${pv}`, `${res}`])],
      hint: `${m} 能拆成 8 乘几？`,
    };
  }
  const k = r.pick([2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14]), n = 8 * k, left = r.bool() ? `125 × ${n}` : `${n} × 125`;
  return {
    q: `${left} = {0}`, answer: [num(1000 * k)],
    steps: [`${n} = 8 × ${k}，125 × 8 = 1000`, `把 ${n} 拆成 8 × ${k}，再用乘法结合律先算 125 × 8`, loTuo(left, [`125 × 8 × ${k}`, `1000 × ${k}`, `${1000 * k}`])],
    hint: `${n} 里面有几个 8？`,
  };
}

function loGen101(r) {
  const a = r.chance(0.7) ? loNz(r, 12, 99) : loNz(r, 102, 389), front = r.bool();
  const left = front ? `101 × ${a}` : `${a} × 101`;
  return {
    q: `${left} = {0}`, answer: [num(101 * a)],
    steps: ['把 101 看成 100 + 1', '用乘法分配律：100 个和 1 个分别乘，再相加', loTuo(left, [front ? `(100 + 1) × ${a}` : `${a} × (100 + 1)`, front ? `100 × ${a} + 1 × ${a}` : `${a} × 100 + ${a} × 1`, `${100 * a} + ${a}`, `${101 * a}`]), `易错：别写成 ${100 * a} + 1`],
    hint: '101 = 100 + 1',
  };
}

function loGen99(r) {
  const a = r.chance(0.7) ? loNz(r, 12, 99) : loNz(r, 102, 389), front = r.bool();
  const left = front ? `99 × ${a}` : `${a} × 99`;
  return {
    q: `${left} = {0}`, answer: [num(99 * a)],
    steps: ['把 99 看成 100 - 1', '用乘法分配律：先算 100 个，再减去 1 个', loTuo(left, [front ? `(100 - 1) × ${a}` : `${a} × (100 - 1)`, front ? `100 × ${a} - 1 × ${a}` : `${a} × 100 - ${a} × 1`, `${100 * a} - ${a}`, `${99 * a}`]), `易错：别写成 ${100 * a} - 1`],
    hint: '99 = 100 - 1',
  };
}

function loGenSplit(r) {
  const m = r.pick([102, 103, 104, 98, 97, 96, 201, 202, 198, 199, 302, 298]);
  const N = Math.round(m / 100) * 100, e = m - N, E = Math.abs(e), op = e > 0 ? '+' : '-';
  const a = loNz(r, 12, 99), front = r.bool(), left = front ? `${m} × ${a}` : `${a} × ${m}`;
  return {
    q: `${left} = {0}`, answer: [num(m * a)],
    steps: [`把 ${m} 拆成 ${N} ${op} ${E}`, `用乘法分配律：${N} × ${a} 和 ${E} × ${a} 分别算，再${e > 0 ? '相加' : '相减'}`, loTuo(left, [front ? `(${N} ${op} ${E}) × ${a}` : `${a} × (${N} ${op} ${E})`, front ? `${N} × ${a} ${op} ${E} × ${a}` : `${a} × ${N} ${op} ${a} × ${E}`, `${N * a} ${op} ${E * a}`, `${m * a}`])],
    hint: `${m} 接近哪个整百数？`,
  };
}

const LO_SIMP = [loGenAdd, loGenMul, loGenDistrib, loGenDistribRev, loGenHidden, loGenSub, loGenDiv, loGenNear, loGen25, loGen125, loGen101, loGen99, loGenSplit];
/** 简算题干统一加上「简便计算：」 */
const loSimp = (g) => (r) => { const p = g(r); return { ...p, q: '简便计算：' + p.q }; };

const LO_LAWS = ['加法交换律', '加法结合律', '乘法交换律', '乘法结合律', '乘法分配律', '减法的性质', '除法的性质'];
const LO_LAW_SAY = {
  加法交换律: '两个数相加，交换加数的位置，和不变：a + b = b + a',
  加法结合律: '三个数相加，先把前两个数相加，或者先把后两个数相加，和不变：(a + b) + c = a + (b + c)',
  乘法交换律: '两个数相乘，交换因数的位置，积不变：a × b = b × a',
  乘法结合律: '三个数相乘，先把前两个数相乘，或者先把后两个数相乘，积不变：(a × b) × c = a × (b × c)',
  乘法分配律: '两个数的和与一个数相乘，可以先把它们分别与这个数相乘，再相加：(a + b) × c = a × c + b × c',
  减法的性质: '一个数连续减去两个数，等于减去这两个数的和：a - b - c = a - (b + c)',
  除法的性质: '一个数连续除以两个数，等于除以这两个数的积：a ÷ b ÷ c = a ÷ (b × c)',
};

// ---- 平均数、三角形等用到的小工具 ----
/** 三角形配图：angs = [左下, 右下, 上] 三个角的度数（按真实角度画），labels 写在角里；right = 直角的下标 */
function loTriFig(angs, labels, { right = -1 } = {}) {
  const rad = (d) => (d * Math.PI) / 180;
  const [A, B] = angs, side = Math.sin(rad(B)) / Math.sin(rad(A + B));
  const P = [[0, 0], [1, 0], [side * Math.cos(rad(A)), side * Math.sin(rad(A))]];
  const W = 360, H = 230, pad = 36;
  const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const k = Math.min((W - 2 * pad) / (maxX - minX), (H - 2 * pad) / (maxY - minY));
  const ox = (W - (maxX - minX) * k) / 2, oy = (H - (maxY - minY) * k) / 2;
  const S = P.map(([x, y]) => [ox + (x - minX) * k, H - (oy + (y - minY) * k)]);
  const C = fig.colors;
  let s = `<polygon points="${S.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')}" fill="${C.fill}" stroke="${C.line}" stroke-width="3" stroke-linejoin="round"/>`;
  S.forEach((p, i) => {
    const q1 = S[(i + 1) % 3], q2 = S[(i + 2) % 3];
    const u = (q) => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
    const u1 = u(q1), u2 = u(q2);
    let bx = u1[0] + u2[0], by = u1[1] + u2[1]; const bl = Math.hypot(bx, by) || 1; bx /= bl; by /= bl;
    if (i === right) {
      const z = 14, a1 = [p[0] + u1[0] * z, p[1] + u1[1] * z], a2 = [p[0] + u2[0] * z, p[1] + u2[1] * z], m = [a1[0] + u2[0] * z, a1[1] + u2[1] * z];
      s += `<polyline points="${[a1, m, a2].map((v) => v.map((t) => t.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="${C.acc}" stroke-width="2"/>`;
    } else if (labels[i]) {
      const rr = 20, sweep = u1[0] * u2[1] - u1[1] * u2[0] > 0 ? 1 : 0;
      s += `<path d="M${(p[0] + u1[0] * rr).toFixed(1)},${(p[1] + u1[1] * rr).toFixed(1)} A${rr},${rr} 0 0,${sweep} ${(p[0] + u2[0] * rr).toFixed(1)},${(p[1] + u2[1] * rr).toFixed(1)}" fill="none" stroke="${C.acc}" stroke-width="2"/>`;
    }
    if (labels[i]) {
      const ang = angs[i], dist = ang < 35 ? 58 : ang < 60 ? 44 : ang < 100 ? 36 : 30;
      s += fig.text(p[0] + bx * dist, p[1] + by * dist, labels[i], { size: 15, weight: 'bold', color: labels[i] === '?' ? C.acc : C.text });
    }
  });
  return fig.raw(W, H, s);
}

// ---- 小数用到的小工具 ----
const LO_DIG = '零一二三四五六七八九';
/** 小数读法（按字符串读，末尾的 0 也读出来）：'3.50' → 三点五零 */
const loReadDec = (s) => { const [i, d] = s.split('.'); return readInt(+i) + (d ? '点' + d.split('').map((c) => LO_DIG[+c]).join('') : ''); };
/** 随机 n 位数字串（不以 0 结尾） */
function loDigits(r, n) {
  let s = '';
  for (let i = 0; i < n; i++) s += r.chance(0.25) ? 0 : r.int(1, 9);
  return s.endsWith('0') ? s.slice(0, -1) + r.int(1, 9) : s;
}
/** 随机小数字符串；tz：末尾多带一个 0 的概率；zero：数里一定有 0（整数部分或小数部分中间） */
function loDecStr(r, tz = 0, zero = false) {
  return r.until(() => {
    const I = r.pick([0, 0, r.int(1, 9), r.int(1, 9), r.int(10, 99), r.int(100, 999)]);
    return `${I}.${loDigits(r, r.int(1, 3))}${r.chance(tz) ? '0' : ''}`;
  }, (s) => !zero || /0/.test(s.replace(/^0\./, '')));
}
/** 小数比大小的讲解 */
function loCmpSteps(sa, sb) {
  const a = +sa, b = +sb, [ia, da = ''] = sa.split('.'), [ib, db = ''] = sb.split('.');
  if (+ia !== +ib) return [`先比整数部分：${ia} ${cmp(+ia, +ib)} ${ib}`, `整数部分大的数就大，所以 ${sa} ${cmp(a, b)} ${sb}`, '整数部分不同时，不用看小数部分'];
  const L = Math.max(da.length, db.length), pa = da.padEnd(L, '0'), pb = db.padEnd(L, '0');
  const names = ['十分位', '百分位', '千分位', '万分位'];
  for (let i = 0; i < L; i++) {
    if (pa[i] === pb[i]) continue;
    const st = [`整数部分都是 ${ia}，从十分位起一位一位比`, i === 0 ? `十分位：${pa[0]} ${cmp(+pa[0], +pb[0])} ${pb[0]}` : `${names.slice(0, i).join('、')}都相同，比${names[i]}：${pa[i]} ${cmp(+pa[i], +pb[i])} ${pb[i]}`, `所以 ${sa} ${cmp(a, b)} ${sb}`];
    if ((da.length > db.length && a < b) || (db.length > da.length && b < a)) st.push('注意：不是小数位数多的就大');
    return st;
  }
  return [`整数部分相同；小数部分末尾添 0 补齐后一样，都是 ${ia}.${pa}`, '小数的末尾添上 0 或去掉 0，大小不变', `所以 ${sa} = ${sb}`];
}
/** 单位和进率：[大单位, 小单位, 进率] */
const LO_UNITS = [['米', '厘米', 100], ['米', '分米', 10], ['分米', '厘米', 10], ['千米', '米', 1000], ['千克', '克', 1000], ['吨', '千克', 1000], ['元', '角', 10], ['元', '分', 100], ['平方米', '平方分米', 100], ['厘米', '毫米', 10]];

const LOWER = [
  // ================= 四则运算 =================
  {
    id: 'g4b-relations', grade: 4, term: 2, unit: '四则运算', name: '求 □ 里的数（各部分关系）',
    tip: '加数 = 和 - 另一个加数；被减数 = 差 + 减数；减数 = 被减数 - 差；因数 = 积 ÷ 另一个因数；被除数 = 商 × 除数；除数 = 被除数 ÷ 商', level: 1,
    gen(r) {
      const k = r.int(0, 6);
      let q, x, rule, calc;
      if (k <= 1) {
        const a = r.int(105, 899); x = r.int(105, 899); const s = a + x;
        q = k === 0 ? `□ + ${a} = ${s}` : `${a} + □ = ${s}`; rule = '加数 = 和 - 另一个加数'; calc = [`□ = ${s} - ${a} = ${x}`, vSub(s, a)];
      } else if (k === 2) {
        const a = r.int(105, 899), d = r.int(105, 899); x = a + d;
        q = `□ - ${a} = ${d}`; rule = '被减数 = 差 + 减数'; calc = [`□ = ${d} + ${a} = ${x}`, vAdd(d, a)];
      } else if (k === 3) {
        x = r.int(105, 899); const d = r.int(105, 899), a = x + d;
        q = `${a} - □ = ${d}`; rule = '减数 = 被减数 - 差'; calc = [`□ = ${a} - ${d} = ${x}`, vSub(a, d)];
      } else if (k === 4) {
        const a = r.int(12, 49); x = r.int(12, 49); const p = a * x;
        q = r.bool() ? `□ × ${a} = ${p}` : `${a} × □ = ${p}`; rule = '一个因数 = 积 ÷ 另一个因数'; calc = [`□ = ${p} ÷ ${a} = ${x}`, vDiv(p, a)];
      } else if (k === 5) {
        const a = r.int(12, 49), qq = r.int(12, 49); x = a * qq;
        q = `□ ÷ ${a} = ${qq}`; rule = '被除数 = 商 × 除数'; calc = [`□ = ${qq} × ${a} = ${x}`, vMul(qq, a)];
      } else {
        x = r.int(12, 49); const qq = r.int(12, 49), a = x * qq;
        q = `${a} ÷ □ = ${qq}`; rule = '除数 = 被除数 ÷ 商'; calc = [`□ = ${a} ÷ ${qq} = ${x}`, vDiv(a, qq)];
      }
      return { q: `${q}\n□ = {0}`, answer: [num(x)], steps: [`□ 是算式里的哪一部分？想：${rule}`, ...calc, `检验：把 ${x} 放回原式，等式成立 ✓`], hint: '□ 在算式里是哪一部分？' };
    },
  },
  {
    id: 'g4b-order-two', grade: 4, term: 2, unit: '四则运算', name: '两步混合运算（无括号）',
    tip: '有乘除又有加减，先算乘除；只有加减或只有乘除，从左往右算', level: 1,
    gen(r) {
      const k = r.int(0, 8);
      let e, lines, say;
      if (k === 0) { const b = r.int(12, 45), c = r.int(2, 9), a = r.int(30, 500); e = `${a} + ${b} × ${c}`; lines = [`${a} + ${b * c}`, `${a + b * c}`]; say = '有加法又有乘法，先算乘法，再算加法'; }
      else if (k === 1) { const b = r.int(12, 45), c = r.int(2, 9), a = b * c + r.int(20, 400); e = `${a} - ${b} × ${c}`; lines = [`${a} - ${b * c}`, `${a - b * c}`]; say = '有减法又有乘法，先算乘法，再算减法'; }
      else if (k === 2) { const a = r.int(12, 45), b = r.int(2, 9), c = r.int(20, a * b - 5); e = `${a} × ${b} - ${c}`; lines = [`${a * b} - ${c}`, `${a * b - c}`]; say = '先算乘法，再算减法'; }
      else if (k === 3) { const c = r.int(2, 9), q = r.int(12, 60), b = c * q, a = r.int(30, 500); e = `${a} + ${b} ÷ ${c}`; lines = [`${a} + ${q}`, `${a + q}`]; say = '有加法又有除法，先算除法，再算加法'; }
      else if (k === 4) { const c = r.int(2, 9), q = r.int(12, 60), b = c * q, a = q + r.int(20, 400); e = `${a} - ${b} ÷ ${c}`; lines = [`${a} - ${q}`, `${a - q}`]; say = '有减法又有除法，先算除法，再算减法'; }
      else if (k === 5) { const b = r.int(2, 9), q = r.int(12, 80), a = b * q, c = r.int(10, 300); const plus = r.bool(); const cc = plus ? c : r.int(1, q - 1); e = `${a} ÷ ${b} ${plus ? '+' : '-'} ${cc}`; lines = [`${q} ${plus ? '+' : '-'} ${cc}`, `${plus ? q + cc : q - cc}`]; say = '先算除法，再算' + (plus ? '加法' : '减法'); }
      else if (k <= 7) { const a = r.int(150, 600), b = r.int(20, a - 30), c = r.int(20, 200); e = `${a} - ${b} + ${c}`; lines = [`${a - b} + ${c}`, `${a - b + c}`]; say = `只有加减法，从左往右算：先算 ${a} - ${b}，不能先算 ${b} + ${c}`; }
      else { const b = r.int(2, 9), q = r.int(6, 30), a = b * q, c = r.int(2, 9); e = `${a} ÷ ${b} × ${c}`; lines = [`${q} × ${c}`, `${q * c}`]; say = `只有乘除法，从左往右算：先算 ${a} ÷ ${b}，不能先算 ${b} × ${c}`; }
      const ans = +lines[lines.length - 1];
      return { q: `${e} = {0}`, answer: [num(ans)], steps: [say, loTuo(e, lines)], hint: '先看有哪几种运算，再定先算哪一步' };
    },
  },
  {
    id: 'g4b-order-three', grade: 4, term: 2, unit: '四则运算', name: '三步混合运算（无括号）',
    tip: '先算乘除，再算加减；同一级运算从左往右', level: 2,
    gen(r) {
      const k = r.int(0, 5);
      let e, lines, say = '先算乘除，再算加减';
      if (k === 0) { const [a, b, c, d] = r.until(() => [r.int(12, 45), r.int(3, 9), r.int(11, 30), r.int(2, 9)], (v) => v[0] * v[1] > v[2] * v[3]); const p1 = a * b, p2 = c * d; e = `${a} × ${b} - ${c} × ${d}`; lines = [`${p1} - ${p2}`, `${p1 - p2}`]; say = '两个乘法可以同时算，再算减法'; }
      else if (k === 1) { const a = r.int(50, 400), b = r.int(12, 45), c = r.int(2, 9), d = r.int(10, a); e = `${a} + ${b} × ${c} - ${d}`; lines = [`${a} + ${b * c} - ${d}`, `${a + b * c} - ${d}`, `${a + b * c - d}`]; say = '先算乘法，再从左往右算加减'; }
      else if (k === 2) { const b = r.int(2, 9), q = r.int(12, 60), a = b * q, c = r.int(12, 40), d = r.int(2, 9); e = `${a} ÷ ${b} + ${c} × ${d}`; lines = [`${q} + ${c * d}`, `${q + c * d}`]; say = '除法和乘法可以同时算，最后算加法'; }
      else if (k === 3) { const a = r.int(12, 40), b = r.int(2, 9), d = r.int(2, 9), q = r.int(12, 60), c = d * q; e = `${a} × ${b} + ${c} ÷ ${d}`; lines = [`${a * b} + ${q}`, `${a * b + q}`]; say = '乘法和除法可以同时算，最后算加法'; }
      else if (k === 4) {
        // a - b × c ÷ d：乘除同级从左往右
        const [b, c, d] = r.until(() => [r.int(12, 45), r.int(2, 9), r.int(2, 9)], (v) => (v[0] * v[1]) % v[2] === 0 && v[1] !== v[2]);
        const prod = b * c, quo = prod / d, a = quo + r.int(20, 300);
        e = `${a} - ${b} × ${c} ÷ ${d}`; lines = [`${a} - ${prod} ÷ ${d}`, `${a} - ${quo}`, `${a - quo}`]; say = `乘除是同一级，从左往右：先算 ${b} × ${c}，再除以 ${d}，最后算减法`; }
      else { const c = r.int(2, 9), q = r.int(12, 60), b = c * q, a = r.int(20, 400), d = r.int(5, a + q - 5); e = `${a} + ${b} ÷ ${c} - ${d}`; lines = [`${a} + ${q} - ${d}`, `${a + q} - ${d}`, `${a + q - d}`]; say = '先算除法，再从左往右算加减'; }
      const ans = +lines[lines.length - 1];
      return { q: `${e} = {0}`, answer: [num(ans)], steps: [say, loTuo(e, lines), '脱式计算：每算一步写一行，没算的部分照抄下来'], hint: '先圈出要先算的乘除' };
    },
  },
  {
    id: 'g4b-order-paren', grade: 4, term: 2, unit: '四则运算', name: '带小括号的混合运算',
    tip: '有小括号，先算小括号里面的', level: 1,
    gen(r) {
      const k = r.int(0, 7);
      let e, lines;
      if (k === 0) { const a = r.int(12, 120), b = r.int(12, 120), c = r.int(2, 9); e = `(${a} + ${b}) × ${c}`; lines = [`${a + b} × ${c}`, `${(a + b) * c}`]; }
      else if (k === 1) { const b = r.int(12, 200), s = r.int(12, 99), a = b + s, c = r.int(2, 9); e = `(${a} - ${b}) × ${c}`; lines = [`${s} × ${c}`, `${s * c}`]; }
      else if (k === 2) { const a = r.int(12, 45), b = r.int(12, 60), c = r.int(2, 39), minus = r.bool(); const s = minus ? b + c : b; const t = minus ? b : c; if (minus) { e = `${a} × (${s} - ${t})`; lines = [`${a} × ${c}`, `${a * c}`]; } else { e = `${a} × (${b} + ${c})`; lines = [`${a} × ${b + c}`, `${a * (b + c)}`]; } }
      else if (k === 3) { const c = r.int(2, 9), q = r.int(12, 60), s = c * q, a = r.int(5, s - 5), b = s - a; e = `(${a} + ${b}) ÷ ${c}`; lines = [`${s} ÷ ${c}`, `${q}`]; }
      else if (k === 4) { const c = r.int(2, 9), q = r.int(12, 60), s = c * q, b = r.int(12, 300), a = b + s; e = `(${a} - ${b}) ÷ ${c}`; lines = [`${s} ÷ ${c}`, `${q}`]; }
      else if (k === 5) { const s = r.int(12, 40), q = r.int(3, 25), a = s * q, b = r.int(2, s - 2), c = s - b; e = `${a} ÷ (${b} + ${c})`; lines = [`${a} ÷ ${s}`, `${q}`]; }
      else if (k === 6) { const s = r.int(4, 30), q = r.int(3, 25), a = s * q, c = r.int(5, 60), b = s + c; e = `${a} ÷ (${b} - ${c})`; lines = [`${a} ÷ ${s}`, `${q}`]; }
      else { const b = r.int(25, 300), c = r.int(25, 300), a = b + c + r.int(10, 400); if (r.bool()) { e = `${a} - (${b} + ${c})`; lines = [`${a} - ${b + c}`, `${a - b - c}`]; } else { const bb = b + c; e = `${a} - (${bb} - ${c})`; lines = [`${a} - ${b}`, `${a - b}`]; } }
      const ans = +lines[lines.length - 1];
      return { q: `${e} = {0}`, answer: [num(ans)], steps: ['有小括号，先算小括号里面的，再算括号外面的', loTuo(e, lines)], hint: '先算哪一部分？' };
    },
  },
  {
    id: 'g4b-order-bracket', grade: 4, term: 2, unit: '四则运算', name: '带中括号的混合运算',
    tip: '先算小括号里的，再算中括号里的，最后算中括号外的', level: 2,
    gen(r) {
      const k = r.int(0, 4);
      let e, lines;
      if (k === 0) { const b = r.int(12, 99), c = r.int(12, 99), m = r.int(5, 60), a = b + c + m, d = r.int(2, 9); e = `[${a} - (${b} + ${c})] × ${d}`; lines = [`[${a} - ${b + c}] × ${d}`, `${m} × ${d}`, `${m * d}`]; }
      else if (k === 1) { const d = r.int(2, 9), s = r.int(2, 12), q = r.int(3, 30), a = s * d * q, c = r.int(10, 90), b = c + s; e = `${a} ÷ [(${b} - ${c}) × ${d}]`; lines = [`${a} ÷ [${s} × ${d}]`, `${a} ÷ ${s * d}`, `${q}`]; }
      else if (k === 2) { const d = r.int(2, 9), q = r.int(4, 30), s = d * q, b = r.int(3, s - 3), c = s - b, a = r.int(12, 45); e = `${a} × [(${b} + ${c}) ÷ ${d}]`; lines = [`${a} × [${s} ÷ ${d}]`, `${a} × ${q}`, `${a * q}`]; }
      else if (k === 3) { const d = r.int(2, 9), q = r.int(12, 60), s = d * q, m = r.int(10, s - 10), a = s - m, c = r.int(10, 200), b = c + m; e = `[${a} + (${b} - ${c})] ÷ ${d}`; lines = [`[${a} + ${m}] ÷ ${d}`, `${s} ÷ ${d}`, `${q}`]; }
      else { const b = r.int(12, 60), c = r.int(12, 60), d = r.int(2, 9), p = (b + c) * d, a = p + r.int(20, 500); e = `${a} - [(${b} + ${c}) × ${d}]`; lines = [`${a} - [${b + c} × ${d}]`, `${a} - ${p}`, `${a - p}`]; }
      const ans = +lines[lines.length - 1];
      return { q: `${e} = {0}`, answer: [num(ans)], steps: ['先算小括号里面的，再算中括号里面的，最后算中括号外面的', loTuo(e, lines)], hint: '由里往外：小括号 → 中括号 → 外面' };
    },
  },
  {
    id: 'g4b-zero', grade: 4, term: 2, unit: '四则运算', name: '有关 0 的运算',
    tip: '加减 0 还得原数；0 乘任何数得 0；0 除以非 0 的数得 0；0 不能作除数', level: 1, speed: 6,
    gen(r) {
      if (r.chance(0.25)) {
        const a = r.int(2, 99);
        const [s, ok, why] = r.pick([
          ['0 除以任何数都得 0。', false, '0 不能作除数，应该说「0 除以任何不是 0 的数都得 0」'],
          ['0 除以任何不是 0 的数都得 0。', true, '0 里面有 0 个这个数'],
          ['任何数乘 0 都得 0。', true, '几个 0 相加还是 0'],
          ['一个数加上 0，还得原数。', true, '加 0 等于没加'],
          ['一个数减去 0，还得原数。', true, '减 0 等于没减'],
          ['被减数和减数相等时，差是 0。', true, '同样多的数相减，差是 0'],
          ['0 可以作除数。', false, '0 不能作除数'],
          [`${a} ÷ 0 = 0`, false, '0 不能作除数，这个算式没有意义'],
          [`0 ÷ ${a} = ${a}`, false, `0 ÷ ${a} = 0`],
          ['一个数和 0 相乘，还得原数。', false, '任何数和 0 相乘都得 0'],
          ['0 加任何数都得 0。', false, `0 加几还得几，比如 0 + ${a} = ${a}`],
          [`${a} × 0 = ${a} + 0`, false, `${a} × 0 = 0，${a} + 0 = ${a}，不相等`],
        ]);
        return { q: `判断：${s}`, answer: [judge(ok)], steps: [ok ? '这句话是对的 √' : '这句话是错的 ×', why] };
      }
      const a = r.int(12, 999), b = r.int(2, 99), k = r.int(0, 9);
      const T = [
        [`${a} + 0`, a, '一个数加 0，还得原数'],
        [`${a} - 0`, a, '一个数减 0，还得原数'],
        [`${a} - ${a}`, 0, '相同的两个数相减，差是 0'],
        [r.bool() ? `0 × ${a}` : `${a} × 0`, 0, '0 和任何数相乘都得 0'],
        [`0 ÷ ${a}`, 0, '0 除以任何不是 0 的数都得 0'],
        [`(${a} - ${a}) × ${b}`, 0, `先算括号里 ${a} - ${a} = 0，0 × ${b} = 0`],
        [`0 ÷ ${a} + ${b}`, b, `先算 0 ÷ ${a} = 0，再算 0 + ${b} = ${b}`],
        [`${a} × 0 + ${b}`, b, `先算 ${a} × 0 = 0，再算 0 + ${b} = ${b}`],
        [`${a} + 0 × ${b}`, a, `先算乘法 0 × ${b} = 0，再算 ${a} + 0 = ${a}（不能先算 ${a} + 0）`],
        [`${a} - 0 ÷ ${b}`, a, `先算除法 0 ÷ ${b} = 0，再算 ${a} - 0 = ${a}`],
      ][k];
      return { q: `${T[0]} = {0}`, answer: [num(T[1])], steps: [T[2]], hint: '想一想 0 在加、减、乘、除里的规律' };
    },
  },
  {
    id: 'g4b-mixed-word', grade: 4, term: 2, unit: '四则运算', name: '列综合算式解决问题', process: true,
    tip: '先想先求什么、再求什么，再把两步合成一个综合算式，需要先算加减时加小括号', level: 2,
    gen(r) {
      const name = r.name(), k = r.int(0, 5);
      let q, unit, s1, s2, expr, lines, ans, say, at;
      if (k === 0) {
        const [u, item, lo, hi] = r.pick([['本', '故事书', 15, 35], ['个', '书包', 45, 89], ['盒', '彩笔', 12, 28], ['副', '羽毛球拍', 35, 68], ['个', '足球', 55, 99]]);
        const n = r.int(2, 5), p = r.int(lo, hi), cost = p * n, M = Math.ceil((cost + 1) / 100) * 100;
        q = `一${u}${item} ${p} 元，${name}买了 ${n} ${u}，付给售货员 ${M} 元，应找回多少元？`; unit = '元';
        s1 = `先求买 ${n} ${u}一共多少元：${p} × ${n} = ${cost}（元）`; s2 = `再求应找回多少元：${M} - ${cost} = ${M - cost}（元）`;
        expr = `${M} - ${p} × ${n}`; lines = [`${M} - ${cost}`, `${M - cost}`]; ans = M - cost; say = '付的钱 - 花的钱 = 找回的钱'; at = `应找回 ${ans} 元`;
      } else if (k === 1) {
        const kk = r.int(3, 8), per = r.int(30, 90), a = r.int(50, 300), T = a + kk * per;
        q = `图书室有 ${T} 本书，借出 ${a} 本后，剩下的平均放在 ${kk} 个书架上，每个书架放多少本？`; unit = '本';
        s1 = `先求剩下多少本：${T} - ${a} = ${T - a}（本）`; s2 = `再求每个书架放多少本：${T - a} ÷ ${kk} = ${per}（本）`;
        expr = `(${T} - ${a}) ÷ ${kk}`; lines = [`${T - a} ÷ ${kk}`, `${per}`]; ans = per; say = '剩下的本数 ÷ 书架个数 = 每个书架的本数'; at = `每个书架放 ${per} 本`;
      } else if (k === 2) {
        const x = r.int(40, 150), d = r.int(3, 9), rest = r.int(50, 800), L = x * d + rest;
        q = `一条路长 ${L} 米，修路队已经修了 ${d} 天，每天修 ${x} 米，还剩多少米没修？`; unit = '米';
        s1 = `先求已经修了多少米：${x} × ${d} = ${x * d}（米）`; s2 = `再求还剩多少米：${L} - ${x * d} = ${rest}（米）`;
        expr = `${L} - ${x} × ${d}`; lines = [`${L} - ${x * d}`, `${rest}`]; ans = rest; say = '全长 - 已修的 = 还剩的'; at = `还剩 ${rest} 米没修`;
      } else if (k === 3) {
        const a = r.int(80, 200), b = r.int(30, 90), n = r.int(12, 40);
        q = `一张桌子 ${a} 元，一把椅子 ${b} 元。学校买了 ${n} 套桌椅（一张桌子配一把椅子），一共要付多少元？`; unit = '元';
        s1 = `先求一套桌椅多少元：${a} + ${b} = ${a + b}（元）`; s2 = `再求 ${n} 套多少元：${a + b} × ${n} = ${(a + b) * n}（元）`;
        expr = `(${a} + ${b}) × ${n}`; lines = [`${a + b} × ${n}`, `${(a + b) * n}`]; ans = (a + b) * n; say = '一套的价钱 × 套数 = 总价'; at = `一共要付 ${ans} 元`;
      } else if (k === 4) {
        const b = r.int(12, 30), days = r.int(3, 9), a = r.int(30, 120), N = a + b * days;
        q = `一本书有 ${N} 页，${name}已经看了 ${a} 页，剩下的每天看 ${b} 页，还要几天看完？`; unit = '天';
        s1 = `先求还剩多少页：${N} - ${a} = ${N - a}（页）`; s2 = `再求要几天：${N - a} ÷ ${b} = ${days}（天）`;
        expr = `(${N} - ${a}) ÷ ${b}`; lines = [`${N - a} ÷ ${b}`, `${days}`]; ans = days; say = '剩下的页数 ÷ 每天看的页数 = 天数'; at = `还要 ${days} 天看完`;
      } else {
        const per = r.int(5, 12), boxes = r.int(12, 35), extra = r.int(3, per - 1);
        q = `果园摘了一批苹果，装了 ${boxes} 箱，每箱 ${per} 千克，还剩 ${extra} 千克没装箱。一共摘了多少千克苹果？`; unit = '千克';
        s1 = `先求装箱的有多少千克：${per} × ${boxes} = ${per * boxes}（千克）`; s2 = `再加上没装箱的：${per * boxes} + ${extra} = ${per * boxes + extra}（千克）`;
        expr = `${per} × ${boxes} + ${extra}`; lines = [`${per * boxes} + ${extra}`, `${per * boxes + extra}`]; ans = per * boxes + extra; say = '装箱的 + 没装箱的 = 一共的'; at = `一共摘了 ${ans} 千克苹果`;
      }
      return {
        q, answer: [num(ans, unit)],
        steps: [`找数量关系：${say}`, s1, s2, '列综合算式：', loTuo(expr, lines), `答：${at}。`],
        hint: '先求什么？再求什么？',
      };
    },
  },
  {
    id: 'g4b-mixed-combine', grade: 4, term: 2, unit: '四则运算', name: '分步算式改写成综合算式',
    tip: '用第一步的算式代替第二步里的那个数；要先算加减时，记得加小括号', level: 2,
    gen(r) {
      const k = r.int(0, 5);
      let s1, s2, right, wrongs, why;
      if (k === 0) {
        const o = r.pick(['+', '-']), y = r.int(12, 99), x = o === '+' ? r.int(12, 199) : y + r.int(5, 120), z = r.int(2, 9), r1 = o === '+' ? x + y : x - y;
        s1 = `${x} ${o} ${y} = ${r1}`; s2 = `${r1} × ${z} = ${r1 * z}`;
        right = `(${x} ${o} ${y}) × ${z}`; wrongs = [`${x} ${o} ${y} × ${z}`, `${x} ${o} (${y} × ${z})`, `${z} × ${x} ${o} ${y}`]; why = `要先算 ${x} ${o} ${y}，再乘 ${z}，所以加小括号`;
      } else if (k === 1) {
        const o = r.pick(['+', '-']), z = r.int(2, 9), q = r.int(12, 60), r1 = z * q, y = r.int(5, r1 - 5), x = o === '+' ? r1 - y : r1 + y;
        s1 = `${x} ${o} ${y} = ${r1}`; s2 = `${r1} ÷ ${z} = ${q}`;
        right = `(${x} ${o} ${y}) ÷ ${z}`; wrongs = [`${x} ${o} ${y} ÷ ${z}`, `${x} ${o} (${y} ÷ ${z})`, `${z} ÷ (${x} ${o} ${y})`]; why = `要先算 ${x} ${o} ${y}，再除以 ${z}，所以加小括号`;
      } else if (k === 2) {
        const o = r.pick(['+', '-']), r1 = r.int(4, 30), q = r.int(3, 25), z = r1 * q, y = r.int(2, r1 - 1), x = o === '+' ? r1 - y : r1 + y;
        s1 = `${x} ${o} ${y} = ${r1}`; s2 = `${z} ÷ ${r1} = ${q}`;
        right = `${z} ÷ (${x} ${o} ${y})`; wrongs = [`${z} ÷ ${x} ${o} ${y}`, `(${x} ${o} ${y}) ÷ ${z}`, `${z} ÷ ${y} ${o} ${x}`]; why = `${z} 要除以 ${x} ${o} ${y} 的结果，所以给 ${x} ${o} ${y} 加小括号`;
      } else if (k === 3) {
        const x = r.int(12, 199), y = r.int(12, 199), r1 = x + y, z = r1 + r.int(10, 500);
        s1 = `${x} + ${y} = ${r1}`; s2 = `${z} - ${r1} = ${z - r1}`;
        right = `${z} - (${x} + ${y})`; wrongs = [`${z} - ${x} + ${y}`, `${x} + ${y} - ${z}`, `${z} + ${x} - ${y}`]; why = `${z} 要减去 ${x} 与 ${y} 的和，所以加小括号`;
      } else if (k === 4) {
        const o = r.pick(['+', '-']), x = r.int(12, 45), y = r.int(2, 9), r1 = x * y, z = o === '+' ? r.int(20, 500) : r1 + r.int(20, 500);
        s1 = `${x} × ${y} = ${r1}`; s2 = o === '+' ? `${z} + ${r1} = ${z + r1}` : `${z} - ${r1} = ${z - r1}`;
        right = `${z} ${o} ${x} × ${y}`; wrongs = o === '+' ? [`(${z} + ${x}) × ${y}`, `${z} + ${x} + ${y}`, `${z} × ${x} + ${y}`] : [`(${z} - ${x}) × ${y}`, `${x} × ${y} - ${z}`, `${z} - ${x} - ${y}`]; why = '本来就先算乘法，再算加减，不用加括号';
      } else {
        const o = r.pick(['+', '-']), y = r.int(2, 9), r1 = r.int(12, 60), x = y * r1, z = o === '+' ? r.int(20, 500) : r1 + r.int(20, 500);
        s1 = `${x} ÷ ${y} = ${r1}`; s2 = o === '+' ? `${z} + ${r1} = ${z + r1}` : `${z} - ${r1} = ${z - r1}`;
        right = `${z} ${o} ${x} ÷ ${y}`; wrongs = o === '+' ? [`(${z} + ${x}) ÷ ${y}`, `${z} + ${y} ÷ ${x}`, `${z} ÷ ${y} + ${x}`] : [`(${z} - ${x}) ÷ ${y}`, `${x} ÷ ${y} - ${z}`, `${z} ÷ ${y} - ${x}`]; why = '本来就先算除法，再算加减，不用加括号';
      }
      const r1 = s1.split(' = ')[1];
      return {
        q: `把下面两个分步算式改写成一个综合算式：\n${s1}\n${s2}`,
        answer: [choice(r, right, wrongs)],
        steps: [`第二步里的 ${r1} 是第一步算出来的，用 ${s1.split(' = ')[0]} 代替它`, why, `综合算式：${right}`],
        hint: '第二步里哪个数是第一步的结果？',
      };
    },
  },

  // ================= 运算定律 =================
  {
    id: 'g4b-law-name', grade: 4, term: 2, unit: '运算定律', name: '用了哪条运算定律',
    tip: '看等号两边：是换了位置、换了运算顺序，还是拆开分别乘', level: 1,
    gen(r) {
      const a = r.int(12, 99), b = r.int(12, 99), c = r.int(12, 99), k = r.int(0, 10);
      const T = [
        [`${a} + ${b} = ${b} + ${a}`, '加法交换律', '只是交换了两个加数的位置'],
        [`(${a} + ${b}) + ${c} = ${a} + (${b} + ${c})`, '加法结合律', '加数的位置没变，变的是先加哪两个'],
        [`${a} × ${b} = ${b} × ${a}`, '乘法交换律', '只是交换了两个因数的位置'],
        [`(${a} × ${b}) × ${c} = ${a} × (${b} × ${c})`, '乘法结合律', '因数的位置没变，变的是先乘哪两个'],
        [`(${a} + ${b}) × ${c} = ${a} × ${c} + ${b} × ${c}`, '乘法分配律', `把 ${a} 与 ${b} 的和乘 ${c}，拆成分别乘 ${c} 再相加`],
        [`${a} × ${c} + ${b} × ${c} = (${a} + ${b}) × ${c}`, '乘法分配律', `两个积里都有 ${c}，把 ${c} 提出来（乘法分配律反过来用）`],
        [`${a + b + c + 100} - ${a} - ${b} = ${a + b + c + 100} - (${a} + ${b})`, '减法的性质', '连续减去两个数，变成减去它们的和'],
        [`${a * b * 4} ÷ ${a} ÷ ${b} = ${a * b * 4} ÷ (${a} × ${b})`, '除法的性质', '连续除以两个数，变成除以它们的积'],
        [`${a} + ${b} + ${c} = ${a} + ${c} + ${b}`, '加法交换律', `交换了 ${b} 和 ${c} 的位置`],
        [`${a} × ${b} × ${c} = ${a} × ${c} × ${b}`, '乘法交换律', `交换了 ${b} 和 ${c} 的位置`],
        [r.pick(['a × (b + c) = a × b + a × c', '(a + b) + c = a + (b + c)', 'a × b = b × a', 'a - b - c = a - (b + c)', '(a × b) × c = a × (b × c)', 'a + b = b + a', 'a ÷ b ÷ c = a ÷ (b × c)']), null, '用字母表示的运算定律'],
      ][k];
      let [eq, law, see] = T;
      if (!law) law = { 'a × (b + c) = a × b + a × c': '乘法分配律', '(a + b) + c = a + (b + c)': '加法结合律', 'a × b = b × a': '乘法交换律', 'a - b - c = a - (b + c)': '减法的性质', '(a × b) × c = a × (b × c)': '乘法结合律', 'a + b = b + a': '加法交换律', 'a ÷ b ÷ c = a ÷ (b × c)': '除法的性质' }[eq];
      return {
        q: `${eq}\n运用了 {0}`,
        answer: [choice(r, law, LO_LAWS)],
        steps: [`看等号两边：${see}`, `这是${law}：${LO_LAW_SAY[law]}`],
        hint: '等号两边的数一样吗？变的是位置，还是先算的顺序？',
      };
    },
  },
  {
    id: 'g4b-law-judge', grade: 4, term: 2, unit: '运算定律', name: '运算定律用对了吗',
    tip: '拿不准时，把等号两边都算一算，看相不相等', level: 2,
    gen(r) {
      const build = (k, ok) => {
        if (k === 0) { const c = r.pick([25, 125, 15, 36, 48]), a = r.pick([4, 8, 10, 20, 40, 100]), b = r.int(2, 9); return { L: `${c} × (${a} + ${b})`, R: ok ? `${c} × ${a} + ${c} × ${b}` : `${c} × ${a} + ${b}`, lv: c * (a + b), rv: ok ? c * a + c * b : c * a + b, rule: `乘法分配律：${b} 也要乘 ${c}` }; }
        if (k === 1) { const a = r.int(300, 900), b = r.int(12, 99), c = r.int(12, 99); return { L: ok ? `${a} - ${b} - ${c}` : `${a} - ${b} + ${c}`, R: `${a} - (${b} + ${c})`, lv: ok ? a - b - c : a - b + c, rv: a - b - c, rule: '减法的性质：连续减去两个数，才等于减去它们的和' }; }
        if (k === 2) { const b = r.int(2, 9), c = r.int(2, 9), kk = r.int(3, 30), a = b * c * kk; return { L: `${a} ÷ (${b} × ${c})`, R: ok ? `${a} ÷ ${b} ÷ ${c}` : `${a} ÷ ${b} × ${c}`, lv: kk, rv: ok ? kk : (a / b) * c, rule: '除法的性质：除以两个数的积，等于连续除以这两个数' }; }
        if (k === 3) { const a = loNz(r, 12, 99); return { L: `99 × ${a}`, R: ok ? `100 × ${a} - ${a}` : `100 × ${a} - 1`, lv: 99 * a, rv: ok ? 99 * a : 100 * a - 1, rule: `99 个 ${a} 等于 100 个 ${a} 减去 1 个 ${a}` }; }
        if (k === 4) { const a = loNz(r, 12, 99); return { L: `101 × ${a}`, R: ok ? `100 × ${a} + ${a}` : `100 × ${a} + 1`, lv: 101 * a, rv: ok ? 101 * a : 100 * a + 1, rule: `101 个 ${a} 等于 100 个 ${a} 加上 1 个 ${a}` }; }
        if (k === 5) {
          const c = r.pick([25, 125]), g = c === 25 ? 4 : 8, n = r.pick(c === 25 ? [44, 48, 36, 84, 88, 64] : [88, 96, 72, 64, 56]), t = Math.floor(n / 10) * 10, u = n - t;
          const R = ok ? r.pick([`${c} × ${t} + ${c} × ${u}`, `${c} × ${g} × ${n / g}`]) : `${c} × ${t} × ${u}`;
          return { L: `${c} × ${n}`, R, lv: c * n, rv: ok ? c * n : c * t * u, rule: `${n} = ${t} + ${u}（用分配律，分别乘再相加），或 ${n} = ${g} × ${n / g}（用结合律）；${t} × ${u} 不等于 ${n}` };
        }
        if (k === 6) { const a = r.int(12, 99), b = r.int(12, 99), c = r.int(2, 9); return { L: `(${a} + ${b}) × ${c}`, R: ok ? `${a} × ${c} + ${b} × ${c}` : `${a} + ${b} × ${c}`, lv: (a + b) * c, rv: ok ? (a + b) * c : a + b * c, rule: `乘法分配律：${a} 和 ${b} 都要乘 ${c}` }; }
        const a = r.int(200, 600), b = r.int(12, 99), c = r.until(() => r.int(12, 99), (v) => v !== b);
        return { L: `${a} - ${b} + ${c}`, R: ok ? `${a} + ${c} - ${b}` : `${a} - ${c} + ${b}`, lv: a - b + c, rv: ok ? a + c - b : a - c + b, rule: '数可以连同它前面的运算符号一起搬家：减 ' + b + ' 还是减，加 ' + c + ' 还是加' };
      };
      const k = r.int(0, 7), ok = r.bool();
      const t = r.until(() => build(k, ok), (v) => (v.lv === v.rv) === ok);
      return {
        q: `判断：${t.L} = ${t.R}`, answer: [judge(ok)],
        steps: [`算一算：左边 = ${t.lv}，右边 = ${t.rv}`, ok ? '两边相等，这个等式成立 √' : '两边不相等，这个等式不成立 ×', t.rule],
        hint: '把两边都算一算',
      };
    },
  },
  { id: 'g4b-law-add', grade: 4, term: 2, unit: '运算定律', name: '加法交换律和结合律', tip: '先找能凑成整十、整百、整千的两个数，交换位置后先加', level: 1, gen: loSimp(loGenAdd) },
  { id: 'g4b-law-mul', grade: 4, term: 2, unit: '运算定律', name: '乘法交换律和结合律', tip: '记住好朋友：25 × 4 = 100，125 × 8 = 1000，5 × 2 = 10，先把它们乘起来', level: 1, gen: loSimp(loGenMul) },
  { id: 'g4b-law-dist', grade: 4, term: 2, unit: '运算定律', name: '乘法分配律（正用）', tip: '(a + b) × c = a × c + b × c，括号里的两个数都要乘', level: 1, gen: loSimp(loGenDistrib) },
  { id: 'g4b-law-dist-rev', grade: 4, term: 2, unit: '运算定律', name: '乘法分配律（逆用）', tip: 'a × c + b × c = (a + b) × c，找相同的因数提出来', level: 1, gen: loSimp(loGenDistribRev) },
  { id: 'g4b-law-dist-hidden', grade: 4, term: 2, unit: '运算定律', name: '分配律：a × 99 + a 型', tip: '单独的 a 看成 a × 1，再用乘法分配律', level: 2, gen: loSimp(loGenHidden) },
  { id: 'g4b-law-sub', grade: 4, term: 2, unit: '运算定律', name: '减法的性质', tip: 'a - b - c = a - (b + c)，两个减数能凑整就先加起来', level: 1, gen: loSimp(loGenSub) },
  { id: 'g4b-law-div', grade: 4, term: 2, unit: '运算定律', name: '除法的性质', tip: 'a ÷ b ÷ c = a ÷ (b × c)，两个除数能凑整就先乘起来', level: 1, gen: loSimp(loGenDiv) },

  // ================= 简便计算 =================
  { id: 'g4b-simp-near', grade: 4, term: 2, unit: '运算定律', name: '加减接近整百数的简算', tip: '把 99、102 看成整百数：多加了要减去，少加了要加上；多减了要加上，少减了要减去', level: 1, gen: loSimp(loGenNear) },
  { id: 'g4b-simp-25x4', grade: 4, term: 2, unit: '运算定律', name: '简算：25 × 4 拆数', tip: '把另一个数拆成 4 × 几，先算 25 × 4 = 100', level: 1, gen: loSimp(loGen25) },
  { id: 'g4b-simp-125x8', grade: 4, term: 2, unit: '运算定律', name: '简算：125 × 8 拆数', tip: '把另一个数拆成 8 × 几，先算 125 × 8 = 1000', level: 1, gen: loSimp(loGen125) },
  { id: 'g4b-simp-101', grade: 4, term: 2, unit: '运算定律', name: '简算：101 × a', tip: '101 × a = 100 × a + a，别忘了加上 1 个 a', level: 1, gen: loSimp(loGen101) },
  { id: 'g4b-simp-99', grade: 4, term: 2, unit: '运算定律', name: '简算：99 × a', tip: '99 × a = 100 × a - a，减去的是 1 个 a，不是 1', level: 1, gen: loSimp(loGen99) },
  { id: 'g4b-simp-split', grade: 4, term: 2, unit: '运算定律', name: '简算：102 × a、98 × a', tip: '把接近整百的数拆成整百数加几或减几，再用乘法分配律', level: 1, gen: loSimp(loGenSplit) },
  {
    id: 'g4b-simp-mixed', grade: 4, term: 2, unit: '运算定律', name: '综合简便计算', tip: '先观察数的特点：能凑整吗？有相同因数吗？接近整百吗？再选定律', level: 2,
    gen(r) { const p = loSimp(r.pick(LO_SIMP))(r); return { ...p, hint: '先观察：哪些数能凑整？有没有相同的因数？' }; },
  },

  // ================= 小数的意义和性质 =================
  {
    id: 'g4b-dec-meaning', grade: 4, term: 2, unit: '小数的意义和性质', name: '小数的意义（分数和小数）',
    tip: '分母是 10、100、1000 的分数可以写成一位、两位、三位小数', level: 1,
    gen(r) {
      const p = r.int(1, 3), D = 10 ** p, CNp = ['', '一', '两', '三'][p], k = r.int(0, 2);
      if (k === 2) {
        const [hi, lo, rate] = r.pick([['米', '分米', 10], ['米', '厘米', 100], ['米', '毫米', 1000], ['元', '角', 10], ['元', '分', 100], ['千克', '克', 1000], ['千米', '米', 1000]]);
        const n = r.until(() => r.int(1, rate - 1), (v) => v % 10 !== 0 || rate === 10);
        const x = fix(n / rate);
        return {
          q: `${n} ${lo} = ${frac(n, rate)} ${hi} = {0} ${hi}`, answer: [num(x)],
          steps: [`1 ${hi} = ${rate} ${lo}，1 ${lo} 是 ${frac(1, rate)} ${hi}`, `${n} ${lo} 就是 ${frac(n, rate)} ${hi}`, `分母是 ${rate} 的分数写成${['', '一', '两', '三'][String(rate).length - 1]}位小数：${frac(n, rate)} = ${fmt(x)}`],
          hint: `${frac(n, rate)} 写成小数有几位小数？`,
        };
      }
      const n = r.until(() => r.int(1, D - 1), (v) => v % 10 !== 0 || p === 1), x = fix(n / D);
      if (k === 0) {
        return {
          q: `${frac(n, D)} 写成小数是 {0}`, answer: [num(x)],
          steps: [`分母是 ${D}，写成${CNp}位小数`, `${frac(n, D)} 表示 ${n} 个 ${frac(1, D)}，也就是 ${n} 个 ${fmt(1 / D)}`, `${frac(n, D)} = ${fmt(x)}`, p >= 2 && n < D / 10 ? `位数不够，在小数点后面用 0 占位` : '小数点后面的位数和分母里 0 的个数一样多'],
          hint: `分母 ${D} 有几个 0？就写成几位小数`,
        };
      }
      return {
        q: `${fmt(x)} 写成分母是 ${D} 的分数是 {0}`, answer: [{ kind: 'frac', value: [n, D], simplest: false }],
        steps: [`${fmt(x)} 是${CNp}位小数，表示 ${n} 个 ${fmt(1 / D)}`, `${fmt(1 / D)} = ${frac(1, D)}`, `所以 ${fmt(x)} = ${frac(n, D)}`],
        hint: '几位小数，分母就是 1 后面几个 0',
      };
    },
  },
  {
    id: 'g4b-dec-units', grade: 4, term: 2, unit: '小数的意义和性质', name: '小数的计数单位和组成',
    tip: '一位小数的计数单位是 0.1，两位小数是 0.01，三位小数是 0.001；相邻两个计数单位的进率是 10', level: 1,
    gen(r) {
      const k = r.int(0, 4), U = ['1', '0.1', '0.01', '0.001'];
      if (k === 0) {
        const dl = r.int(1, 3), I = r.pick([0, 0, r.int(1, 9)]), m = r.until(() => r.int(1, 10 ** dl - 1), (v) => v % 10 !== 0), x = fix(I + m / 10 ** dl), cnt = Math.round(x * 10 ** dl);
        return { q: `${fmt(x)} 里有 {0} 个 ${U[dl]}`, answer: [num(cnt)], steps: [`${fmt(x)} 是${['', '一', '两', '三'][dl]}位小数，计数单位是 ${U[dl]}`, `去掉小数点看有多少个：${fmt(x)} 里有 ${cnt} 个 ${U[dl]}`], hint: `${fmt(x)} 的最后一位是什么位？` };
      }
      if (k === 1) {
        const parts = [r.int(0, 9), r.int(0, 9), r.int(0, 9), r.int(1, 9)];
        if (parts[0] === 0) parts[0] = r.int(1, 9);
        const keep = r.sample([1, 2], r.int(1, 2)); // 有的数位不给，要用 0 占位
        const used = [0, ...keep, 3].filter((i) => parts[i] > 0);
        const x = fix(used.reduce((s, i) => s + parts[i] * [1, 0.1, 0.01, 0.001][i], 0));
        const text = used.map((i) => `${parts[i]} 个 ${U[i]}`);
        const say = text.length > 1 ? text.slice(0, -1).join('、') + ' 和 ' + text[text.length - 1] : text[0];
        return { q: `由 ${say} 组成的数是 {0}`, answer: [num(x)], steps: [`个位写 ${parts[0]}，${used.includes(1) ? `十分位写 ${parts[1]}` : '十分位没有，写 0'}，${used.includes(2) ? `百分位写 ${parts[2]}` : '百分位没有，写 0'}，千分位写 ${parts[3]}`, `组成的数是 ${dstr(x, 3)}`, '哪一位一个也没有，就用 0 占位'], hint: '先想每个数写在哪一位' };
      }
      if (k === 2) {
        const I = r.int(1, 9), pos = r.int(1, 3), d = r.int(1, 9), x = fix(I + d / 10 ** pos);
        return { q: `${fmt(x)} 是由 {0} 个一和 {1} 个 ${U[pos]} 组成的`, answer: [num(I), num(d)], steps: [`整数部分 ${I}，表示 ${I} 个一`, `小数部分的 ${d} 在${['', '十分位', '百分位', '千分位'][pos]}上，表示 ${d} 个 ${U[pos]}`], hint: '看每个数字在哪一位' };
      }
      if (k === 3) {
        const dl = r.int(1, 3), I = r.pick([0, r.int(1, 20)]), m = r.until(() => r.int(1, 10 ** dl - 1), (v) => v % 10 !== 0), x = fix(I + m / 10 ** dl);
        return { q: `${fmt(x)} 的计数单位是 {0}`, answer: [choice(r, U[dl], U)], steps: [`${fmt(x)} 是${['', '一', '两', '三'][dl]}位小数`, `${['', '一', '两', '三'][dl]}位小数的计数单位是 ${U[dl]}`], hint: '看小数点后面有几位' };
      }
      const [m, u, v] = r.pick([[10, '0.1', 1], [10, '0.01', 0.1], [10, '0.001', 0.01], [100, '0.01', 1], [100, '0.001', 0.1], [1000, '0.001', 1]]);
      if (r.bool()) return { q: `${m} 个 ${u} 是 {0}`, answer: [num(v)], steps: ['相邻两个计数单位之间的进率是 10', `${m} 个 ${u} 是 ${fmt(v)}`], hint: '10 个 0.01 是多少？' };
      return { q: `${fmt(v)} 里有 {0} 个 ${u}`, answer: [num(m)], steps: ['相邻两个计数单位之间的进率是 10', `${fmt(v)} 里有 ${m} 个 ${u}`], hint: '1 里有几个 0.1？' };
    },
  },
  {
    id: 'g4b-dec-place', grade: 4, term: 2, unit: '小数的意义和性质', name: '小数的数位',
    tip: '小数点右边依次是十分位、百分位、千分位，计数单位是 0.1、0.01、0.001', level: 1,
    gen(r) {
      const PL = ['十位', '个位', '十分位', '百分位', '千分位'], UN = ['十', '一', '0.1', '0.01', '0.001'];
      const [s, cand] = r.until(() => {
        const I = r.chance(0.5) ? r.int(10, 99) : r.int(1, 9), dl = r.int(2, 3);
        let D = ''; for (let i = 0; i < dl; i++) D += r.int(0, 9);
        if (D.endsWith('0')) D = D.slice(0, -1) + r.int(1, 9);
        const Is = String(I), digits = [];
        if (Is.length === 2) digits.push([Is[0], 0]);
        digits.push([Is[Is.length - 1], 1]);
        D.split('').forEach((c, i) => digits.push([c, 2 + i]));
        // 只问在这个数里只出现一次的非 0 数字，避免歧义
        return [`${I}.${D}`, digits.filter(([c]) => c !== '0' && digits.filter(([c2]) => c2 === c).length === 1)];
      }, ([, c]) => c.some(([, p]) => p >= 2));
      const dec = cand.filter(([, p]) => p >= 2);
      const [d, p] = r.pick(r.chance(0.8) ? dec : cand);
      return {
        q: `${s} 中的 ${d} 在 {0} 上，表示 ${d} 个 {1}`,
        answer: [choice(r, PL[p], PL), choice(r, UN[p], UN)],
        steps: [p >= 2 ? '从小数点往右数：第一位是十分位，第二位是百分位，第三位是千分位' : '从小数点往左数：第一位是个位，第二位是十位', `${d} 在${PL[p]}上，${PL[p]}的计数单位是${p >= 2 ? ' ' + UN[p] : '「' + UN[p] + '」'}`, `所以表示 ${d} 个${p >= 2 ? ' ' + UN[p] : UN[p]}`],
        hint: '先找小数点，再往左、往右数',
      };
    },
  },
  {
    id: 'g4b-dec-read', grade: 4, term: 2, unit: '小数的意义和性质', name: '小数的读法',
    tip: '整数部分按整数读，小数点读「点」，小数部分依次读出每个数字', level: 1,
    gen(r) {
      const s = loDecStr(r, 0.15), right = loReadDec(s), [I, D] = s.split('.');
      const w = [];
      if (D.length >= 2 && +D > 0) w.push(readInt(+I) + '点' + readInt(+D));
      if (D.includes('0')) w.push(loReadDec(`${I}.${D.replace('0', '')}`));
      w.push(loReadDec(`${I}.0${D}`));
      if (D.length >= 2) w.push(loReadDec(`${+I * 10 + +D[0]}.${D.slice(1)}`));
      if (+I >= 10) w.push(loReadDec(`${+I * 10}.${D}`));
      if (+I > 0) w.push(loReadDec(`${Math.floor(+I / 10)}.${I.slice(-1)}${D}`));
      if (/0/.test(I) && +I >= 100) w.push(readInt(+I).replace('零', '') + '点' + D.split('').map((c) => '零一二三四五六七八九'[+c]).join(''));
      while (uniq(w).filter((x) => x !== right).length < 3) w.push(loReadDec(loDecStr(r, 0)));
      return {
        q: `${s} 读作：`, answer: [choice(r, right, w)],
        steps: [`整数部分 ${I} 读作「${readInt(+I)}」`, '小数点读作「点」', `小数部分依次读出每一个数字：${D.split('').join('、')} 读作「${D.split('').map((c) => '零一二三四五六七八九'[+c]).join('')}」`, `所以 ${s} 读作：${right}`],
        hint: '小数部分不读「十」「百」，一个一个读出来',
      };
    },
  },
  {
    id: 'g4b-dec-write', grade: 4, term: 2, unit: '小数的意义和性质', name: '小数的写法',
    tip: '整数部分按整数写，「点」写成小数点，小数部分依次写出每个数字', level: 1,
    gen(r) {
      const s = loDecStr(r, 0.15), reading = loReadDec(s), [I, D] = s.split('.');
      const w = [];
      if (D.length >= 2) w.push(`${+I * 10 + +D[0]}.${D.slice(1)}`);
      if (D.includes('0')) w.push(`${I}.${D.replace('0', '')}`);
      w.push(`${I}.0${D}`);
      if (+I > 0) w.push(`${Math.floor(+I / 10)}.${I.slice(-1)}${D}`);
      if (+I >= 10) w.push(`${+I * 10}.${D}`);
      if (I !== '0') w.push(`${I}${D[0]}.${D.slice(1) || '0'}`);
      const wrongs = uniq(w).filter((x) => loReadDec(x) !== reading && x !== s);
      while (wrongs.length < 3) { const x = loDecStr(r, 0); if (x !== s && !wrongs.includes(x)) wrongs.push(x); }
      return {
        q: `${reading} 写作：`, answer: [choice(r, s, wrongs)],
        steps: [`「点」前面是整数部分：${readInt(+I)} 写作 ${I}`, '「点」写成小数点', `「点」后面依次写出每一个数字：${D}`, `所以写作：${s}`],
        hint: '先写整数部分，再点小数点',
      };
    },
  },
  {
    id: 'g4b-dec-property', grade: 4, term: 2, unit: '小数的意义和性质', name: '小数的性质（化简和改写）',
    tip: '小数的末尾添上 0 或去掉 0，大小不变；小数中间的 0 不能去掉', level: 1,
    gen(r) {
      const k = r.int(0, 2);
      if (k === 0) {
        const s = loDecStr(r, 0, true), [I, D] = s.split('.'), pad = s + '0'.repeat(r.int(1, 3));
        const w = [`${I}.${D.replace(/0/g, '') || '0'}`, pad.slice(0, -1), `${+(I + D)}`, `${I.replace(/0/g, '') || '0'}.${D}`, `0.${I}${D}`];
        return {
          q: `利用小数的性质，把 ${pad} 化简是 {0}`, answer: [choice(r, s, w.filter((x) => x !== s && x !== pad))],
          steps: ['小数的性质：小数的末尾添上 0 或去掉 0，小数的大小不变', `只去掉末尾的 0：${pad} = ${s}`, D.includes('0') || I.includes('0') ? '中间的 0 是占位的，不能去掉' : '化简就是去掉小数末尾所有的 0'],
          hint: '只能去掉哪里的 0？',
        };
      }
      if (k === 1) {
        const d = r.int(2, 3), dx = r.chance(0.3) ? 0 : r.int(1, d - 1), isInt = dx === 0;
        const x = isInt ? r.int(1, 30) : fix(loNz(r, 1, 999) / 10 ** dx);
        const right = dstr(x, d), [I, D = ''] = fmt(x).split('.');
        const w = [`${I}.${'0'.repeat(d - D.length)}${D}`, dstr(x, d - 1 > dx ? d - 1 : d + 1), dstr(fix(x / 10), d), `${I}${D}${'0'.repeat(Math.max(0, d - D.length))}`, `${I}.${D}${'0'.repeat(d - D.length + 1)}`];
        return {
          q: `不改变数的大小，把 ${fmt(x)} 改写成${['', '一', '两', '三'][d]}位小数是 {0}`, answer: [choice(r, right, w.filter((v) => v !== right))],
          steps: [isInt ? `${x} 是整数，先在个位右下角点上小数点` : `${fmt(x)} 现在是${['', '一', '两', '三'][dx]}位小数`, `在小数末尾添上 0，补够${['', '一', '两', '三'][d]}位：${right}`, '小数末尾添上 0，大小不变'],
          hint: '0 要添在哪里大小才不变？',
        };
      }
      const s = loDecStr(r, 0), [I, D] = s.split('.'), eq = s + '0';
      const w = [`${I}.0${D}`, fmt(fix(+s * 10)), `${I}.00${D}`, D.length > 1 ? `${I}.${D[0]}0${D.slice(1)}` : (I === '0' ? `${D}.0` : `${I}0.${D}`), `0.${I}${D}`];
      return {
        q: `与 ${s} 大小相等的数是 {0}`, answer: [choice(r, eq, w.filter((v, i) => +v !== +s && w.findIndex((x) => +x === +v) === i))],
        steps: ['小数的末尾添上 0，大小不变', `${s} 末尾添一个 0 是 ${eq}，大小相等`, '在小数中间添 0 或移动小数点，大小就变了'],
        hint: '0 添在末尾和添在中间一样吗？',
      };
    },
  },
  {
    id: 'g4b-dec-compare', grade: 4, term: 2, unit: '小数的意义和性质', name: '小数比大小',
    tip: '先比整数部分；整数部分相同，从十分位起一位一位比；不是位数多的就大', level: 1,
    gen(r) {
      const k = r.int(0, 5);
      let sa, sb;
      if (k <= 2) {
        const I = r.pick([0, 0, r.int(1, 20)]);
        [sa, sb] = r.until(() => [`${I}.${loDigits(r, r.int(1, 3))}`, `${I}.${loDigits(r, r.int(1, 3))}`], ([a, b]) => +a !== +b && a.split('.')[1][0] === b.split('.')[1][0] === (k !== 0));
      } else if (k === 3) {
        const s = loDecStr(r, 0); sa = s; sb = s + '0'.repeat(r.int(1, 2));
        if (r.bool()) [sa, sb] = [sb, sa];
      } else {
        const I = r.int(0, 30);
        [sa, sb] = r.until(() => [`${I}.${loDigits(r, r.int(1, 2))}`, `${I + r.pick([-1, 1])}.${loDigits(r, r.int(2, 3))}`], ([, b]) => +b >= 0 && !b.startsWith('-'));
        if (r.bool()) [sa, sb] = [sb, sa];
      }
      return { q: `${sa} {0} ${sb}`, answer: [cmpAns(+sa, +sb)], steps: loCmpSteps(sa, sb), hint: '先比整数部分，再从十分位比起' };
    },
  },
  {
    id: 'g4b-dec-order', grade: 4, term: 2, unit: '小数的意义和性质', name: '小数排序',
    tip: '先把小数末尾添 0 补成一样多的位数，再按大小排；别被位数多少骗了', level: 2,
    gen(r) {
      const I = r.pick([0, r.int(1, 9)]), [p, q] = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 2);
      const pool = [`${p}${q}`, `${p}0${q}`, `${q}${p}`, `${q}0${p}`, `${p}${q}${p}`, `${p}`, `0${p}${q}`, `${q}`, `${p}${p}`].map((d) => `${I}.${d}`);
      const list = r.sample(pool, 4), asc = list.slice().sort((a, b) => +a - +b);
      const right = asc.join(' < ');
      const byLen = list.slice().sort((a, b) => a.length - b.length || +a - +b).join(' < ');
      const desc = asc.slice().reverse().join(' < ');
      const sw = asc.slice(); [sw[1], sw[2]] = [sw[2], sw[1]];
      const sw2 = asc.slice(); [sw2[0], sw2[1]] = [sw2[1], sw2[0]];
      const sw3 = asc.slice(); [sw3[2], sw3[3]] = [sw3[3], sw3[2]];
      const L = Math.max(...list.map((s) => s.split('.')[1].length));
      return {
        q: `把下面的数按从小到大的顺序排列：\n${list.join('　')}`,
        answer: [choice(r, right, [byLen, desc, sw.join(' < '), sw2.join(' < '), sw3.join(' < ')])],
        steps: [`把它们都补成${['', '一', '两', '三'][L]}位小数再比：${list.map((s) => dstr(+s, L)).join('、')}`, `整数部分都是 ${I}，从十分位开始一位一位比`, `从小到大：${right}`],
        hint: '末尾添 0 补齐位数再比',
      };
    },
  },
  {
    id: 'g4b-dec-shift', grade: 4, term: 2, unit: '小数的意义和性质', name: '小数点移动引起大小变化',
    tip: '乘 10、100、1000，小数点向右移一、二、三位；除以 10、100、1000，向左移；位数不够用 0 补', level: 1, speed: 10,
    gen(r) {
      const s = r.int(1, 3), right = r.bool(), T = 10 ** s, CNs = ['', '一', '两', '三'][s];
      const x = r.until(() => fix(r.int(1, 9999) / 10 ** (r.chance(0.15) ? 0 : r.int(1, 3))), (v) => v < 1000 && decimals(fix(right ? v * T : v / T)) <= 4 && !(Number.isInteger(v) && v % 10 === 0));
      const res = fix(right ? x * T : x / T);
      const f = r.int(0, 2);
      const q = right ? [`${fmt(x)} × ${T} = {0}`, `把 ${fmt(x)} 扩大到原来的 ${T} 倍是 {0}`, `把 ${fmt(x)} 的小数点向右移动${CNs}位是 {0}`][f]
        : [`${fmt(x)} ÷ ${T} = {0}`, `把 ${fmt(x)} 缩小到原来的 ${frac(1, T)} 是 {0}`, `把 ${fmt(x)} 的小数点向左移动${CNs}位是 {0}`][f];
      const need = right ? decimals(x) < s : String(Math.floor(x)).length <= s || Math.floor(x) === 0;
      return {
        q, answer: [num(res)],
        steps: [right ? `乘 ${T}（扩大到原来的 ${T} 倍），小数点向右移动${CNs}位` : `除以 ${T}（缩小到原来的 ${frac(1, T)}），小数点向左移动${CNs}位`, need ? (right ? '位数不够，在末尾用 0 补足' : '位数不够，在前面用 0 补足，整数部分写 0') : `直接移动小数点`, `${fmt(x)} → ${fmt(res)}`],
        hint: right ? '小数点往哪边移？移几位？' : '小数点往左移几位？',
      };
    },
  },
  {
    id: 'g4b-dec-shift-back', grade: 4, term: 2, unit: '小数的意义和性质', name: '小数点移动后求原数',
    tip: '倒过来想：向右移了几位，原数就向左移回几位', level: 2,
    gen(r) {
      const k = r.int(0, 4), CN = ['', '一', '两', '三'];
      if (k === 4) {
        const [x, s1, s2, y] = r.until(() => { const x = fix(loNz(r, 1, 999) / 10 ** r.int(1, 3)), s1 = r.int(1, 3), s2 = r.int(1, 3); return [x, s1, s2, fix(x * 10 ** (s2 - s1))]; }, (v) => v[1] !== v[2] && decimals(v[3]) <= 4 && v[3] < 10000);
        const net = s2 - s1;
        return {
          q: `把一个数的小数点先向左移动${CN[s1]}位，再向右移动${CN[s2]}位，得到 ${fmt(y)}。这个数是 {0}`, answer: [num(x)],
          steps: [`先左移${CN[s1]}位、再右移${CN[s2]}位，合起来相当于向${net > 0 ? '右' : '左'}移动了${CN[Math.abs(net)]}位`, `倒过来想：把 ${fmt(y)} 的小数点向${net > 0 ? '左' : '右'}移动${CN[Math.abs(net)]}位`, `原数是 ${fmt(x)}`],
          hint: '先算一共向哪边移了几位',
        };
      }
      const toRight = k % 2 === 0;
      const [x, s, y] = r.until(() => { const x = fix(loNz(r, 1, 999) / 10 ** r.int(1, 3)), s = r.int(1, 3); return [x, s, fix(toRight ? x * 10 ** s : x / 10 ** s)]; }, (v) => decimals(v[2]) <= 4 && v[2] < 10000);
      const T = 10 ** s;
      const q = [
        `一个数的小数点向右移动${CN[s]}位后是 ${fmt(y)}，原数是 {0}`,
        `一个数的小数点向左移动${CN[s]}位后是 ${fmt(y)}，原数是 {0}`,
        `一个数扩大到原来的 ${T} 倍后是 ${fmt(y)}，这个数是 {0}`,
        `一个数缩小到原来的 ${frac(1, T)} 后是 ${fmt(y)}，这个数是 {0}`,
      ][k];
      return {
        q, answer: [num(x)],
        steps: [`原数${toRight ? `向右移动${CN[s]}位（乘 ${T}）` : `向左移动${CN[s]}位（除以 ${T}）`}得到 ${fmt(y)}`, `倒过来想：把 ${fmt(y)} 的小数点向${toRight ? '左' : '右'}移动${CN[s]}位`, `原数是 ${fmt(x)}`],
        hint: '倒过来想',
      };
    },
  },
  {
    id: 'g4b-dec-shift-diff', grade: 4, term: 2, unit: '小数的意义和性质', name: '小数点移动后比原数大多少',
    tip: '小数点右移一位，新数是原数的 10 倍，比原数多 9 个原数', level: 3, process: true,
    gen(r) {
      const k = r.int(0, 2), m = loNz(r, 11, 99);
      if (k === 0) {
        const x = fix(m / 10), D = fix(9 * x);
        return {
          q: `一个小数的小数点向右移动一位后，比原数大 ${fmt(D)}。原来的小数是多少？`, answer: [num(x)],
          steps: ['小数点向右移动一位，新数是原数的 10 倍', '新数比原数多 10 - 1 = 9 个原数', `9 个原数是 ${fmt(D)}，原数 = ${fmt(D)} ÷ 9`, `${fmt(D)} 里有 ${9 * m} 个 0.1，${9 * m} ÷ 9 = ${m}，就是 ${m} 个 0.1`, `答：原来的小数是 ${fmt(x)}。检验：${fmt(fix(x * 10))} - ${fmt(x)} = ${fmt(D)} ✓`],
          hint: '新数是原数的几倍？比原数多几个原数？',
        };
      }
      if (k === 1) {
        const x = fix(m / 100), D = fix(99 * x);
        return {
          q: `一个小数的小数点向右移动两位后，比原数大 ${fmt(D)}。原来的小数是多少？`, answer: [num(x)],
          steps: ['小数点向右移动两位，新数是原数的 100 倍', '新数比原数多 100 - 1 = 99 个原数', `99 个原数是 ${fmt(D)}，原数 = ${fmt(D)} ÷ 99`, `${fmt(D)} 里有 ${99 * m} 个 0.01，${99 * m} ÷ 99 = ${m}，就是 ${m} 个 0.01`, `答：原来的小数是 ${fmt(x)}。检验：${fmt(fix(x * 100))} - ${fmt(x)} = ${fmt(D)} ✓`],
          hint: '新数是原数的几倍？比原数多几个原数？',
        };
      }
      const x = fix(m / 10), y = fix(x / 10), D = fix(x - y);
      return {
        q: `一个小数的小数点向左移动一位后，比原数小 ${fmt(D)}。原来的小数是多少？`, answer: [num(x)],
        steps: ['小数点向左移动一位，新数是原数的 ' + frac(1, 10) + '，也就是原数是新数的 10 倍', '原数比新数多 9 个新数', `9 个新数是 ${fmt(D)}：${fmt(D)} 里有 ${9 * m} 个 0.01，÷ 9 得 ${m} 个 0.01，新数是 ${fmt(y)}`, `原数 = ${fmt(y)} × 10 = ${fmt(x)}`, `答：原来的小数是 ${fmt(x)}。检验：${fmt(x)} - ${fmt(y)} = ${fmt(D)} ✓`],
        hint: '原数是新数的几倍？',
      };
    },
  },
  {
    id: 'g4b-dec-unit-down', grade: 4, term: 2, unit: '小数的意义和性质', name: '单位换算（大单位化小单位）',
    tip: '大单位化小单位，乘进率：小数点向右移', level: 1,
    gen(r) {
      const [hi, lo, rate] = r.pick(LO_UNITS), n = r.until(() => r.int(1, rate * 10 - 1), (v) => v % rate !== 0 && (rate === 10 || v % 10 !== 0 || r.chance(0.3))), x = fix(n / rate);
      const s = String(rate).length - 1;
      return {
        q: `${fmt(x)} ${hi} = {0} ${lo}`, answer: [num(n)],
        steps: [`1 ${hi} = ${rate} ${lo}`, `大单位化小单位，乘进率 ${rate}`, `${fmt(x)} × ${rate} = ${n}（小数点向右移动${['', '一', '两', '三'][s]}位${decimals(x) < s ? '，位数不够补 0' : ''}）`],
        hint: `1 ${hi}等于多少${lo}？`,
      };
    },
  },
  {
    id: 'g4b-dec-unit-up', grade: 4, term: 2, unit: '小数的意义和性质', name: '单位换算（小单位化大单位）',
    tip: '小单位化大单位，除以进率：小数点向左移', level: 1,
    gen(r) {
      const [hi, lo, rate] = r.pick(LO_UNITS), n = r.until(() => r.int(1, rate * 10 - 1), (v) => v % rate !== 0), x = fix(n / rate);
      const s = String(rate).length - 1;
      return {
        q: `${n} ${lo} = {0} ${hi}`, answer: [num(x)],
        steps: [`1 ${hi} = ${rate} ${lo}`, `小单位化大单位，除以进率 ${rate}`, `${n} ÷ ${rate} = ${fmt(x)}（小数点向左移动${['', '一', '两', '三'][s]}位${String(n).length <= s ? '，位数不够用 0 补足' : ''}）`],
        hint: `1 ${hi}等于多少${lo}？`,
      };
    },
  },
  {
    id: 'g4b-dec-unit-mix', grade: 4, term: 2, unit: '小数的意义和性质', name: '复名数和小数互化',
    tip: '把小单位的部分化成大单位的小数，再和整数部分合起来；注意用 0 占位', level: 2,
    gen(r) {
      const k = r.int(0, 2);
      if (k === 2) {
        const A = r.int(1, 30), j = r.int(0, 9), f = r.int(1, 9), x = fix(A + j / 10 + f / 100);
        return { q: `${A} 元 ${j ? j + ' 角 ' : ''}${f} 分 = {0}`, answer: [num(x, '元')], steps: [j ? `${j} 角 = ${fmt(j / 10)} 元，${f} 分 = ${fmt(f / 100)} 元` : `${f} 分 = ${fmt(f / 100)} 元`, j ? `${A} + ${fmt(j / 10)} + ${fmt(f / 100)} = ${fmt(x)}（元）` : `${A} + ${fmt(f / 100)} = ${fmt(x)}（元）`, j === 0 ? '没有角，十分位要写 0 占位' : '元是整数部分，角在十分位，分在百分位'], hint: '1 角 = 0.1 元，1 分 = 0.01 元' };
      }
      const [hi, lo, rate] = r.pick([['米', '厘米', 100], ['千克', '克', 1000], ['吨', '千克', 1000], ['千米', '米', 1000], ['米', '分米', 10], ['元', '角', 10]]);
      const A = r.int(1, 20), B = r.until(() => r.int(1, rate - 1), (v) => rate === 10 || v % 10 !== 0 || r.chance(0.3)), x = fix(A + B / rate);
      if (k === 0) {
        return { q: `${A} ${hi} ${B} ${lo} = {0}`, answer: [num(x, hi)], steps: [`先把 ${B} ${lo} 化成${hi}：${B} ÷ ${rate} = ${fmt(B / rate)}（${hi}）`, `再和 ${A} ${hi} 合起来：${A} + ${fmt(B / rate)} = ${fmt(x)}（${hi}）`, B * 10 < rate ? `注意：${B} ${lo} 是 ${fmt(B / rate)} ${hi}，要用 0 占位` : `${A} ${hi} ${B} ${lo} = ${fmt(x)} ${hi}`], hint: `${B} ${lo} 是多少${hi}？` };
      }
      return { q: `${fmt(x)} ${hi} = {0} ${hi} {1} ${lo}`, answer: [num(A), num(B)], steps: [`整数部分 ${A} 就是 ${A} ${hi}`, `小数部分 ${fmt(fix(x - A))} ${hi} 化成${lo}：${fmt(fix(x - A))} × ${rate} = ${B}（${lo}）`, `所以 ${fmt(x)} ${hi} = ${A} ${hi} ${B} ${lo}`], hint: '整数部分和小数部分分开换' };
    },
  },
  {
    id: 'g4b-dec-rewrite', grade: 4, term: 2, unit: '小数的意义和性质', name: '改写成用万、亿作单位',
    tip: '在万位（亿位）右边点上小数点，去掉末尾的 0，再写上「万」（「亿」）字', level: 1,
    gen(r) {
      const yi = r.chance(0.4), u = yi ? '亿' : '万', E = yi ? 8 : 4, p = r.int(1, 2);
      const k = loNz(r, 11, p === 1 ? 9999 : 99999), W = fix(k / 10 ** p), n = k * 10 ** (E - p);
      if (r.chance(0.3)) {
        return { q: `${fmt(W)} ${u} = {0}`, answer: [num(n)], steps: [`1 ${u} = ${10 ** E}`, `${fmt(W)} ${u}就是 ${fmt(W)} × ${10 ** E}：小数点向右移动${E === 4 ? '四' : '八'}位`, `${fmt(W)} ${u} = ${n}`], hint: `1 ${u}后面有几个 0？` };
      }
      return {
        q: `把 ${n} 改写成用「${u}」作单位的数`, answer: [num(W, u)],
        steps: [`先分级：${seg4(n)}`, yi ? `亿位是从右往左数第 9 位，在亿位的右边点上小数点，后面是 8 位小数` : `在万位的右边点上小数点：${String(n).slice(0, -4)}.${String(n).slice(-4)}`, `去掉小数末尾的 0，写上「${u}」字：${n} = ${fmt(W)} ${u}`, '改写是「=」，数的大小没变'],
        hint: `${u}位在哪里？`,
      };
    },
  },
  {
    id: 'g4b-dec-approx', grade: 4, term: 2, unit: '小数的意义和性质', name: '求小数的近似数',
    tip: '保留几位小数，就看它的下一位，用四舍五入法', level: 1,
    gen(r) {
      const [x, d] = r.until(() => { const dl = r.int(2, 3), d = r.int(0, dl - 1); return [fix(r.int(0, 99) + loNz(r, 1, 10 ** dl - 1) / 10 ** dl), d]; }, ([x, d]) => decimals(x) > d && (d === 0 ? round(x, 0) > 0 : Math.round(round(x, d) * 10 ** d) % 10 !== 0));
      const R = round(x, d), nd = String(fix(x * 10 ** (d + 1))).split('.')[0].slice(-1);
      const say = d === 0 ? r.pick(['保留整数', '精确到个位']) : r.pick([`保留${['', '一', '两'][d]}位小数`, `精确到${['', '十分位', '百分位'][d]}`]);
      const next = ['十分位', '百分位', '千分位'][d];
      return {
        q: `${fmt(x)} ${say}约是 {0}`, answer: [num(R)],
        steps: [`${say}，要看${next}上的数`, `${next}上是 ${nd}，${+nd >= 5 ? '大于或等于 5，向前一位进 1（五入）' : '小于 5，直接舍去（四舍）'}`, `${fmt(x)} ≈ ${dstr(R, d)}`],
        hint: `看${next}上的数`,
      };
    },
  },
  {
    id: 'g4b-dec-approx-zero', grade: 4, term: 2, unit: '小数的意义和性质', name: '近似数末尾的 0 不能去',
    tip: '近似数末尾的 0 表示精确到哪一位，不能去掉', level: 2,
    gen(r) {
      const d = r.int(1, 2), m = 10 * r.int(1, 99), e = r.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4]);
      const x = fix((10 * m + e) / 10 ** (d + 1)), R = round(x, d);
      const right = dstr(R, d);
      const trunc = dstr(fix(Math.floor(fix(x * 10 ** d)) / 10 ** d), d);
      const w = [fmt(R), trunc, dstr(R, d + 1), dstr(fix(R + 10 ** -d), d), dstr(fix(R - 10 ** -d), d)];
      const nd = String(fix(x * 10 ** (d + 1))).split('.')[0].slice(-1);
      const next = ['', '百分位', '千分位'][d];
      return {
        q: `${fmt(x)} 保留${['', '一', '两'][d]}位小数约是 {0}`, answer: [choice(r, right, w.filter((v) => v !== right))],
        steps: [`看${next}上的 ${nd}，${+nd >= 5 ? '五入，向前一位进 1' : '四舍，直接舍去'}`, `得到 ${right}`, `保留${['', '一', '两'][d]}位小数，就要写出${['', '一', '两'][d]}位，末尾的 0 不能去掉；写成 ${fmt(R)} 就不对了`],
        hint: '保留几位小数，结果就要有几位小数',
      };
    },
  },
  {
    id: 'g4b-dec-approx-unit', grade: 4, term: 2, unit: '小数的意义和性质', name: '改写成万、亿作单位并取近似',
    tip: '先改写成用万（亿）作单位的小数，再按要求四舍五入，用「≈」', level: 2,
    gen(r) {
      const yi = r.chance(0.4), u = yi ? '亿' : '万', E = yi ? 8 : 4, d = r.int(1, 2);
      const n = r.until(() => { const z = E - 3 + r.int(0, 1); return r.int(10 ** (E + 1 - z), 10 ** (E + 3 - z) - 1) * 10 ** z; }, (v) => { const W = fix(v / 10 ** E); return decimals(W) > d && Math.round(round(W, d) * 10 ** d) % 10 !== 0; });
      const W = fix(n / 10 ** E), R = round(W, d), nd = String(n).slice(-E)[d];
      return {
        q: `把 ${n} 改写成用「${u}」作单位的数，并保留${['', '一', '两'][d]}位小数：${n} ≈ {0}`, answer: [num(R, u)],
        steps: [`先改写：在${u}位右边点上小数点，${n} = ${fmt(W)} ${u}`, `再保留${['', '一', '两'][d]}位小数：看${['', '百分位', '千分位'][d]}上的 ${nd}，${+nd >= 5 ? '五入' : '四舍'}`, `${n} ≈ ${dstr(R, d)} ${u}（取近似数要用「≈」）`],
        hint: `先改写成用「${u}」作单位的小数`,
      };
    },
  },
  {
    id: 'g4b-dec-approx-range', grade: 4, term: 2, unit: '小数的意义和性质', name: '近似数反推原数的最大最小',
    tip: '最大：后一位「四舍」最大是 4；最小：后一位「五入」最小是 5，前一位要少 1', level: 2,
    gen(r) {
      const two = r.chance(0.7), d = two ? 1 : 2, k = r.int(1, two ? 99 : 999), A = fix(k / 10 ** d), As = dstr(A, d);
      const mx = fix(A + 4 / 10 ** (d + 1)), mn = fix(A - 5 / 10 ** (d + 1));
      const kind = two ? '两' : '三', keep = two ? '一' : '两', last = two ? '百分位' : '千分位';
      return {
        q: `一个${kind}位小数保留${keep}位小数后是 ${As}，这个${kind}位小数最大是 {0}，最小是 {1}`,
        answer: [num(mx), num(mn)],
        steps: [`最大：是「四舍」得到的，前面不变，${last}上最大是 4，所以是 ${dstr(mx, d + 1)}`, `最小：是「五入」得到的，${last}上最小是 5，进 1 之前前一位要少 1，所以是 ${dstr(mn, d + 1)}`, `检验：${dstr(mx, d + 1)} 和 ${dstr(mn, d + 1)} 保留${keep}位小数都是 ${As} ✓`],
        hint: '哪些数四舍五入后会得到它？',
      };
    },
  },

  // ================= 小数的加法和减法 =================
  {
    id: 'g4b-dec-add', grade: 4, term: 2, unit: '小数的加法和减法', name: '小数加法（笔算）',
    tip: '小数点对齐（相同数位对齐），从末位加起，满十进一', level: 1,
    gen(r) {
      const p1 = r.int(1, 2), a = fix(loNz(r, 11, p1 === 1 ? 999 : 9999) / 10 ** p1);
      let b;
      if (r.chance(0.3)) { const tgt = fix(Math.ceil(a + 1) + r.int(0, 20) + (r.bool() ? 0.5 : 0)); b = fix(tgt - a); }
      else { const p2 = r.int(1, 2); b = fix(loNz(r, 11, p2 === 1 ? 999 : 9999) / 10 ** p2); }
      const s = fix(a + b), D = Math.max(decimals(a), decimals(b));
      const st = ['把小数点对齐，也就是相同数位对齐', vDec(a, b, '+'), '从最低位加起，满十进一，得数的小数点和上面对齐'];
      if (decimals(s) < D) st.push(`得数末尾的 0 可以去掉：${dstr(s, D)} = ${fmt(s)}`);
      return { q: `${fmt(a)} + ${fmt(b)} = {0}`, answer: [num(s)], steps: st, hint: '小数点对齐了吗？' };
    },
  },
  {
    id: 'g4b-dec-sub', grade: 4, term: 2, unit: '小数的加法和减法', name: '小数减法（笔算）',
    tip: '小数点对齐；被减数位数不够，在末尾添 0 再减；哪一位不够减，向前一位退 1', level: 1,
    gen(r) {
      const k = r.int(0, 2);
      let a, b;
      if (k === 0) { a = fix(r.int(2, 30) + r.int(1, 9) / 10); b = r.until(() => fix(r.int(0, Math.floor(a) - 1) + loNz(r, 1, 99) / 100), (v) => v > 0 && v < a); }
      else if (k === 1) { a = r.pick([1, 2, 5, 10, 10, 20, 30, 50, 100]); b = r.until(() => fix(loNz(r, 1, a * 100 - 1) / 100), (v) => v > 0.1 && decimals(v) === 2); }
      else { a = fix(loNz(r, 101, 9999) / 100); b = r.until(() => fix(loNz(r, 1, 999) / 10 ** r.int(1, 2)), (v) => v < a); }
      const d = fix(a - b), pad = decimals(a) < decimals(b);
      return {
        q: `${fmt(a)} - ${fmt(b)} = {0}`, answer: [num(d)],
        steps: ['把小数点对齐，也就是相同数位对齐', pad ? (Number.isInteger(a) ? `${a} 是整数，在个位右下角点上小数点，再添 0 补足位数` : `被减数位数不够，在末尾添 0：${fmt(a)} = ${dstr(a, decimals(b))}`) : '从最低位减起', vDec(a, b, '-'), '哪一位不够减，从前一位退 1，在本位加 10 再减'],
        hint: '被减数的小数位数够吗？',
      };
    },
  },
  {
    id: 'g4b-dec-mix', grade: 4, term: 2, unit: '小数的加法和减法', name: '小数加减混合运算',
    tip: '运算顺序和整数一样：从左往右算，有括号先算括号里的', level: 1,
    gen(r) {
      const nums3 = () => [0, 0, 0].map(() => fix(loNz(r, 11, 999) / 10 ** r.int(1, 2)));
      const k = r.int(0, 3);
      const [a, b, c] = r.until(() => nums3(), ([a, b, c]) => (k === 0 ? a + b > c : k === 1 ? a > b : k === 2 ? a > b + c : b > c && a > b - c));
      let e, s1, s2, lines;
      if (k === 0) { const m = fix(a + b); e = `${fmt(a)} + ${fmt(b)} - ${fmt(c)}`; s1 = vDec(a, b, '+'); s2 = vDec(m, c, '-'); lines = [`${fmt(m)} - ${fmt(c)}`, fmt(fix(m - c))]; }
      else if (k === 1) { const m = fix(a - b); e = `${fmt(a)} - ${fmt(b)} + ${fmt(c)}`; s1 = vDec(a, b, '-'); s2 = vDec(m, c, '+'); lines = [`${fmt(m)} + ${fmt(c)}`, fmt(fix(m + c))]; }
      else if (k === 2) { const m = fix(a - b); e = `${fmt(a)} - ${fmt(b)} - ${fmt(c)}`; s1 = vDec(a, b, '-'); s2 = vDec(m, c, '-'); lines = [`${fmt(m)} - ${fmt(c)}`, fmt(fix(m - c))]; }
      else { const m = fix(b - c); e = `${fmt(a)} - (${fmt(b)} - ${fmt(c)})`; s1 = vDec(b, c, '-'); s2 = vDec(a, m, '-'); lines = [`${fmt(a)} - ${fmt(m)}`, fmt(fix(a - m))]; }
      return { q: `${e} = {0}`, answer: [num(+lines[1])], steps: [k === 3 ? '先算小括号里的减法' : '只有加减法，从左往右算', loTuo(e, lines), '每一步都用竖式算，小数点对齐：', s1, s2], hint: '先算哪一步？' };
    },
  },
  {
    id: 'g4b-dec-simp', grade: 4, term: 2, unit: '小数的加法和减法', name: '小数加减简便计算',
    tip: '整数的运算定律对小数同样适用：先找能凑成整数的两个数', level: 2,
    gen(r) {
      const k = r.int(0, 4), N = r.int(2, 15);
      const dpart = () => fix(loNz(r, 11, 99) / 100);
      const one = () => fix(loNz(r, 11, 99) / 10);
      const pair = () => { const a = fix(r.int(0, N - 1) + dpart()); return [a, fix(N - a)]; };
      let e, lines, say;
      if (k === 0) { const [a, c] = pair(), b = one(); e = `${fmt(a)} + ${fmt(b)} + ${fmt(c)}`; lines = [`${fmt(a)} + ${fmt(c)} + ${fmt(b)}`, `${N} + ${fmt(b)}`, fmt(fix(N + b))]; say = `${fmt(a)} + ${fmt(c)} = ${N}，用加法交换律和结合律先把它们相加`; }
      else if (k === 1) { const [b, c] = pair(), a = fix(N + r.int(1, 20) + r.pick([0, 0.5, 0.8, 0.25])); e = `${fmt(a)} - ${fmt(b)} - ${fmt(c)}`; lines = [`${fmt(a)} - (${fmt(b)} + ${fmt(c)})`, `${fmt(a)} - ${N}`, fmt(fix(a - N))]; say = `${fmt(b)} + ${fmt(c)} = ${N}，用减法的性质：连续减去两个数等于减去它们的和`; }
      else if (k === 2) { const H = r.int(2, 15), b = fix(r.int(0, 9) + dpart()), a = fix(H + b), c = r.until(() => fix(r.int(0, H - 1) + one()), (v) => v < H && v > 0); e = `${fmt(a)} - (${fmt(b)} + ${fmt(c)})`; lines = [`${fmt(a)} - ${fmt(b)} - ${fmt(c)}`, `${H} - ${fmt(c)}`, fmt(fix(H - c))]; say = `${fmt(a)} - ${fmt(b)} = ${H}，用减法的性质：减去两个数的和等于连续减去这两个数`; }
      else if (k === 3) { const H = r.int(2, 15), c = fix(r.int(0, 5) + dpart()), a = fix(H + c), b = one(); e = `${fmt(a)} + ${fmt(b)} - ${fmt(c)}`; lines = [`${fmt(a)} - ${fmt(c)} + ${fmt(b)}`, `${H} + ${fmt(b)}`, fmt(fix(H + b))]; say = `${fmt(a)} - ${fmt(c)} = ${H}，${fmt(c)} 带着它前面的减号一起搬家，先算减法`; }
      else { const H = r.int(5, 20), c = fix(r.int(0, 9) + one()), a = fix(H + c), b = r.until(() => fix(r.int(0, H - 1) + dpart()), (v) => v < H); e = `${fmt(a)} - ${fmt(b)} - ${fmt(c)}`; lines = [`${fmt(a)} - ${fmt(c)} - ${fmt(b)}`, `${H} - ${fmt(b)}`, fmt(fix(H - b))]; say = `${fmt(a)} - ${fmt(c)} = ${H}，连续减两个数可以交换减数的位置`; }
      return { q: `简便计算：${e} = {0}`, answer: [num(+lines[lines.length - 1])], steps: [say, loTuo(e, lines)], hint: '哪两个数能凑成整数？' };
    },
  },
  {
    id: 'g4b-dec-word', grade: 4, term: 2, unit: '小数的加法和减法', name: '小数加减法解决问题', process: true,
    tip: '先找数量关系，再列式；小数点对齐再算', level: 1,
    gen(r) {
      const [n1, n2, n3] = r.names(3), k = r.int(0, 5);
      let q, unit, rel, e, lines, at;
      if (k === 0) {
        const a = fix(r.int(3, 15) + r.pick([0.5, 0.8, 0.2, 0.6, 0.9])), b = fix(r.int(5, 25) + r.pick([0.5, 0.4, 0.7, 0.3])), M = a + b < 20 ? 20 : a + b < 50 ? 50 : 100;
        q = `${n1}买了一本笔记本 ${fmt(a)} 元和一支钢笔 ${fmt(b)} 元，付了 ${M} 元，应找回多少元？`; unit = '元'; rel = '付的钱 - 花的钱 = 找回的钱';
        e = `${M} - ${fmt(a)} - ${fmt(b)}`; lines = [`${fmt(fix(M - a))} - ${fmt(b)}`, fmt(fix(M - a - b))];
      } else if (k === 1) {
        const h = fix(r.int(125, 150) / 100), d = fix(r.int(2, 15) / 100), e2 = fix(r.int(2, 15) / 100);
        q = `${n1}身高 ${fmt(h)} 米，${n2}比${n1}高 ${fmt(d)} 米，${n3}比${n2}矮 ${fmt(e2)} 米。${n3}身高多少米？`; unit = '米'; rel = `${n2}的身高 = ${n1}的身高 + ${fmt(d)}，${n3}的身高 = ${n2}的身高 - ${fmt(e2)}`;
        e = `${fmt(h)} + ${fmt(d)} - ${fmt(e2)}`; lines = [`${fmt(fix(h + d))} - ${fmt(e2)}`, fmt(fix(h + d - e2))];
      } else if (k === 2) {
        const x = fix(r.int(30, 80) + r.int(1, 9) / 10), a = fix(r.int(10, 25) + r.int(1, 9) / 10), b = fix(r.int(10, 30) + r.int(0, 9) / 10);
        q = `水果店有苹果 ${fmt(x)} 千克，上午卖出 ${fmt(a)} 千克，下午又运来 ${fmt(b)} 千克。现在有苹果多少千克？`; unit = '千克'; rel = '原有的 - 卖出的 + 运来的 = 现在的';
        e = `${fmt(x)} - ${fmt(a)} + ${fmt(b)}`; lines = [`${fmt(fix(x - a))} + ${fmt(b)}`, fmt(fix(x - a + b))];
      } else if (k === 3) {
        const x = fix(r.int(205, 320) / 100), d = fix(r.int(5, 30) / 100);
        q = `${n1}第一次跳远跳了 ${fmt(x)} 米，第二次比第一次远 ${fmt(d)} 米。两次一共跳了多少米？`; unit = '米'; rel = `第二次 = 第一次 + ${fmt(d)}，两次一共 = 第一次 + 第二次`;
        e = `${fmt(x)} + (${fmt(x)} + ${fmt(d)})`; lines = [`${fmt(x)} + ${fmt(fix(x + d))}`, fmt(fix(2 * x + d))];
      } else if (k === 4) {
        const L = r.int(10, 20), a = fix(loNz(r, 105, 450) / 100), b = fix(r.int(10, 45) / 10);
        q = `一根绳子长 ${L} 米，第一次用去 ${fmt(a)} 米，第二次用去 ${fmt(b)} 米。还剩多少米？`; unit = '米'; rel = '全长 - 第一次用的 - 第二次用的 = 剩下的';
        e = `${L} - ${fmt(a)} - ${fmt(b)}`; lines = [`${fmt(fix(L - a))} - ${fmt(b)}`, fmt(fix(L - a - b))];
      } else {
        const a = fix(r.int(12, 30) + r.pick([0.5, 0.8, 0.6])), d = fix(r.int(3, 15) + r.pick([0.5, 0.4, 0.7, 0.2]));
        q = `一本故事书 ${fmt(a)} 元，比一本字典便宜 ${fmt(d)} 元。买这两本书一共要多少元？`; unit = '元'; rel = `字典的价钱 = 故事书的价钱 + ${fmt(d)}，一共 = 故事书 + 字典`;
        e = `${fmt(a)} + (${fmt(a)} + ${fmt(d)})`; lines = [`${fmt(a)} + ${fmt(fix(a + d))}`, fmt(fix(2 * a + d))];
      }
      const ans = +lines[1];
      at = [`应找回 ${fmt(ans)} 元`, `${n3}身高 ${fmt(ans)} 米`, `现在有苹果 ${fmt(ans)} 千克`, `两次一共跳了 ${fmt(ans)} 米`, `还剩 ${fmt(ans)} 米`, `一共要 ${fmt(ans)} 元`][k];
      return { q, answer: [num(ans, unit)], steps: [`找数量关系：${rel}`, '列式计算：', loTuo(e, lines), `答：${at}。`], hint: '先想先算什么' };
    },
  },

  // ================= 三角形 =================
  {
    id: 'g4b-tri-angle', grade: 4, term: 2, unit: '三角形', name: '三角形内角和求角',
    tip: '三角形的内角和是 180°，用 180° 减去另外两个角', level: 1,
    gen(r) {
      const raw = r.until(() => { const A = r.int(20, 130), B = r.int(20, 140); return [A, B, 180 - A - B]; }, (v) => v[2] >= 20 && !v.includes(90));
      const mx = raw.indexOf(Math.max(...raw)), rest = r.shuffle(raw.filter((_, i) => i !== mx));
      const angs = [rest[0], rest[1], raw[mx]]; // 最大的角放在顶上，底边最长，图不挤
      const u = r.int(0, 2), known = angs.filter((_, i) => i !== u);
      return {
        q: `如图，三角形的两个内角分别是 ${known[0]}° 和 ${known[1]}°，「?」处的角是多少度？`,
        fig: loTriFig(angs, angs.map((v, i) => (i === u ? '?' : `${v}°`))),
        answer: [num(angs[u], '°')],
        steps: ['三角形的内角和是 180°', `180° - ${known[0]}° - ${known[1]}° = ${angs[u]}°`, `也可以先把两个角加起来：${known[0]}° + ${known[1]}° = ${known[0] + known[1]}°，180° - ${known[0] + known[1]}° = ${angs[u]}°`],
        hint: '三个角加起来是多少度？',
      };
    },
  },
  {
    id: 'g4b-tri-right', grade: 4, term: 2, unit: '三角形', name: '直角三角形求锐角',
    tip: '直角三角形的两个锐角加起来是 90°', level: 1,
    gen(r) {
      const a = r.int(15, 75), b = 90 - a, pos = r.int(0, 1), other = 1 - pos;
      const angs = [0, 0, b]; angs[pos] = 90; angs[other] = a;
      const labels = ['', '', '']; let known, ans;
      if (r.bool()) { labels[2] = `${b}°`; labels[other] = '?'; known = b; ans = a; } else { labels[other] = `${a}°`; labels[2] = '?'; known = a; ans = b; }
      return {
        q: `如图，直角三角形中一个锐角是 ${known}°，另一个锐角是多少度？`,
        fig: loTriFig(angs, labels, { right: pos }),
        answer: [num(ans, '°')],
        steps: ['直角是 90°，三个角一共 180°', '所以两个锐角加起来是 180° - 90° = 90°', `另一个锐角：90° - ${known}° = ${ans}°`],
        hint: '两个锐角加起来是多少度？',
      };
    },
  },
  {
    id: 'g4b-tri-iso', grade: 4, term: 2, unit: '三角形', name: '等腰三角形求角',
    tip: '等腰三角形的两个底角相等；顶角 = 180° - 底角 × 2，底角 = (180° - 顶角) ÷ 2', level: 2,
    gen(r) {
      if (r.bool()) {
        const T = 2 * r.int(10, 80), B = (180 - T) / 2;
        return {
          q: `如图，等腰三角形的顶角是 ${T}°，它的一个底角是多少度？`, fig: loTriFig([B, B, T], ['?', '', `${T}°`]), answer: [num(B, '°')],
          steps: ['等腰三角形的两个底角相等', `两个底角一共：180° - ${T}° = ${180 - T}°`, `一个底角：${180 - T}° ÷ 2 = ${B}°`],
          hint: '两个底角一样大',
        };
      }
      const B = r.int(20, 80), T = 180 - 2 * B;
      return {
        q: `如图，等腰三角形的一个底角是 ${B}°，它的顶角是多少度？`, fig: loTriFig([B, B, T], [`${B}°`, '', '?']), answer: [num(T, '°')],
        steps: [`两个底角相等，另一个底角也是 ${B}°`, `顶角：180° - ${B}° - ${B}° = ${T}°`, `也可以写成 180° - ${B}° × 2 = ${T}°`],
        hint: '另一个底角是多少度？',
      };
    },
  },
  {
    id: 'g4b-tri-classify', grade: 4, term: 2, unit: '三角形', name: '三角形按角分类',
    tip: '先求出第三个角，再看最大的角：小于 90° 是锐角三角形，等于 90° 是直角三角形，大于 90° 是钝角三角形', level: 1,
    gen(r) {
      const kind = r.int(0, 2);
      let A, B;
      if (kind === 0) [A, B] = r.until(() => [r.int(35, 85), r.int(35, 85)], ([a, b]) => a + b > 90);
      else if (kind === 1) { if (r.chance(0.7)) { A = r.int(15, 75); B = 90 - A; } else { A = 90; B = r.int(15, 75); } }
      else if (r.bool()) { A = r.int(95, 150); B = r.int(10, 170 - A); }
      else { A = r.int(10, 60); B = r.int(10, 85 - A); }
      if (r.bool()) [A, B] = [B, A];
      const C = 180 - A - B, mx = Math.max(A, B, C), kindName = mx < 90 ? '锐角' : mx === 90 ? '直角' : '钝角';
      return {
        q: `一个三角形的两个内角分别是 ${A}° 和 ${B}°，这个三角形是 {0}`,
        answer: [{ kind: 'choice', options: ['锐角三角形', '直角三角形', '钝角三角形'], value: kindName + '三角形' }],
        steps: [`先求第三个角：180° - ${A}° - ${B}° = ${C}°`, `三个角里最大的是 ${mx}°，是${kindName}`, `所以是${kindName}三角形`, mx < 90 ? '三个角都是锐角，才是锐角三角形' : '只看最大的那个角来分类'],
        hint: '先求第三个角',
      };
    },
  },
  {
    id: 'g4b-tri-sides', grade: 4, term: 2, unit: '三角形', name: '三根小棒能围成三角形吗',
    tip: '两根较短的长度之和大于最长的一根，才能围成三角形', level: 1,
    gen(r) {
      const k = r.int(0, 2);
      const [a, b, c] = r.until(() => { const a = r.int(2, 12), b = r.int(a, 15); return [a, b, k === 0 ? r.int(b, a + b - 1) : k === 1 ? r.int(a + b + 1, a + b + 8) : a + b]; }, (v) => v[2] >= v[1]);
      const show = r.shuffle([a, b, c]), ok = k === 0;
      return {
        q: `用长 ${show[0]} 厘米、${show[1]} 厘米、${show[2]} 厘米的三根小棒，能围成一个三角形吗？`,
        answer: [{ kind: 'choice', options: ['能', '不能'], value: ok ? '能' : '不能' }],
        steps: [`两根较短的：${a} + ${b} = ${a + b}（厘米）`, `和最长的比：${a + b} ${cmp(a + b, c)} ${c}`, ok ? '两根较短的长度之和大于最长的，能围成三角形' : k === 1 ? '两根较短的接起来还没有最长的长，围不成' : '正好相等，两根短的会和长的贴成一条线，围不成三角形'],
        hint: '拿两根较短的加起来，和最长的比',
      };
    },
  },
  {
    id: 'g4b-tri-third', grade: 4, term: 2, unit: '三角形', name: '第三条边的取值',
    tip: '第三边小于另两边的和，大于另两边的差', level: 2,
    gen(r) {
      const a = r.int(2, 12), b = r.int(a, a + 15), mx = a + b - 1, mn = b - a + 1;
      const base = `一个三角形的两条边分别是 ${a} 厘米和 ${b} 厘米，第三条边的长是整厘米数`;
      const st = [`第三边要小于两边之和：${a} + ${b} = ${a + b}，最长是 ${mx} 厘米`, `第三边加上 ${a} 要大于 ${b}，所以第三边要大于 ${b} - ${a} = ${b - a}，最短是 ${mn} 厘米`];
      if (r.chance(0.3)) {
        const cnt = mx - mn + 1;
        return { q: `${base}。第三条边可能有几种不同的长度？`, answer: [num(cnt, '种')], steps: [...st, `从 ${mn} 到 ${mx}，一共 ${mx} - ${mn} + 1 = ${cnt}（种）`], hint: '先找最长和最短' };
      }
      return { q: `${base}，最长是 {0} 厘米，最短是 {1} 厘米`, answer: [num(mx), num(mn)], steps: st, hint: '第三边要比两边的和小，比两边的差大' };
    },
  },
  {
    id: 'g4b-tri-judge', grade: 4, term: 2, unit: '三角形', name: '三角形判断题', pool: 22,
    tip: '想清楚三角形的特性、内角和、分类和三边关系', level: 1,
    gen(r) {
      const [s, ok, why] = r.pick([
        ['三角形具有稳定性。', true, '三角形三条边的长度确定了，形状和大小就不会变'],
        ['三角形任意两边的和大于第三边。', true, '这是三角形的三边关系'],
        ['等边三角形也是等腰三角形。', true, '等边三角形至少有两条边相等，是特殊的等腰三角形'],
        ['等腰三角形一定是等边三角形。', false, '等腰三角形只要求两条边相等，第三条边可以不同'],
        ['一个三角形中最多有一个直角。', true, '如果有两个直角，就已经 180° 了，第三个角没有了'],
        ['一个三角形中至少有两个锐角。', true, '最多只能有一个直角或一个钝角，另外两个一定是锐角'],
        ['有一个角是锐角的三角形是锐角三角形。', false, '三个角都是锐角才是锐角三角形'],
        ['直角三角形中，两个锐角的和是 90°。', true, '180° - 90° = 90°'],
        ['钝角三角形中，两个锐角的和小于 90°。', true, '钝角大于 90°，剩下的两个角加起来小于 90°'],
        ['把一个三角形剪成两个小三角形，每个小三角形的内角和是 90°。', false, '任何三角形的内角和都是 180°'],
        ['大三角形的内角和比小三角形的内角和大。', false, '三角形的内角和都是 180°，和大小无关'],
        ['三角形有三条高。', true, '从每个顶点向对边都能画一条高'],
        ['等边三角形的每个内角都是 60°。', true, '180° ÷ 3 = 60°'],
        ['用 3 厘米、4 厘米、7 厘米的三根小棒能围成三角形。', false, '3 + 4 = 7，没有大于 7，围不成'],
        ['等腰三角形的两个底角相等。', true, '这是等腰三角形的特点'],
        ['等腰三角形的顶角一定是锐角。', false, '顶角也可以是直角或钝角，比如 120°'],
        ['三个角都是锐角的三角形是锐角三角形。', true, '这就是锐角三角形的定义'],
        ['一个三角形的两个内角分别是 30° 和 60°，它是直角三角形。', true, '第三个角是 180° - 30° - 60° = 90°'],
        ['两个锐角的和一定大于第三个角。', false, '在钝角三角形里，两个锐角的和小于钝角'],
        ['四边形的内角和是 360°。', true, '四边形可以分成两个三角形，180° × 2 = 360°'],
        ['三角形的高一定在三角形里面。', false, '钝角三角形有两条高在三角形外面'],
        ['自行车的三角架利用了三角形的稳定性。', true, '三角形不容易变形'],
      ]);
      return { q: `判断：${s}`, answer: [judge(ok)], steps: [ok ? '这句话是对的 √' : '这句话是错的 ×', why] };
    },
  },
  {
    id: 'g4b-poly-angle', grade: 4, term: 2, unit: '三角形', name: '四边形和多边形的内角和',
    tip: '四边形内角和 360°；n 边形可以分成 (n - 2) 个三角形，内角和 = (n - 2) × 180°', level: 2,
    gen(r) {
      const k = r.int(0, 3), CNn = ['', '', '', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
      if (k === 0) {
        const [a, b, c, d] = r.until(() => { const a = r.int(45, 150), b = r.int(45, 150), c = r.int(45, 150); return [a, b, c, 360 - a - b - c]; }, (v) => v[3] >= 40 && v[3] <= 170);
        return { q: `一个四边形的三个内角分别是 ${a}°、${b}° 和 ${c}°，第四个角是多少度？`, answer: [num(d, '°')], steps: ['四边形可以分成两个三角形，内角和是 180° × 2 = 360°', `360° - ${a}° - ${b}° - ${c}° = ${d}°`], hint: '四边形的内角和是多少？' };
      }
      if (k === 1) {
        const x = r.until(() => r.int(40, 140), (v) => v !== 90);
        return { q: `一个直角梯形中，除了两个直角，还有一个角是 ${x}°，另一个角是多少度？`, answer: [num(180 - x, '°')], steps: ['梯形是四边形，内角和是 360°', `两个直角是 90° × 2 = 180°`, `另一个角：360° - 180° - ${x}° = ${180 - x}°`], hint: '直角梯形有两个直角' };
      }
      if (k === 2) {
        const n = r.int(5, 10), s = (n - 2) * 180;
        return { q: `${CNn[n]}边形的内角和是多少度？`, answer: [num(s, '°')], steps: [`从${CNn[n]}边形的一个顶点出发画对角线，可以把它分成 ${n} - 2 = ${n - 2} 个三角形`, `每个三角形内角和是 180°`, `${n - 2} × 180° = ${s}°`], hint: '能分成几个三角形？' };
      }
      const n = r.pick([5, 6, 8, 9, 10, 12]), s = (n - 2) * 180;
      return { q: `正${CNn[n]}边形的每个内角都相等，每个内角是多少度？`, answer: [num(s / n, '°')], steps: [`正${CNn[n]}边形可以分成 ${n - 2} 个三角形，内角和是 ${n - 2} × 180° = ${s}°`, `${n} 个角一样大：${s}° ÷ ${n} = ${s / n}°`], hint: '先求内角和' };
    },
  },

  // ================= 图形的运动（二） =================
  {
    id: 'g4b-sym-axis', grade: 4, term: 2, unit: '图形的运动（二）', name: '轴对称图形和对称轴', pool: 17,
    tip: '沿一条直线对折，两边能完全重合，就是轴对称图形，这条直线是对称轴', level: 1,
    gen(r) {
      const OPT = ['1 条', '2 条', '3 条', '4 条', '5 条', '6 条', '无数条'];
      const items = [
        ['长方形', '2 条', '沿两组对边中点的连线对折都能重合（对角线不行）'],
        ['正方形', '4 条', '两条对边中点连线 + 两条对角线'],
        ['等边三角形', '3 条', '每个顶点和对边中点的连线都是'],
        ['等腰三角形（不是等边三角形）', '1 条', '只有顶点和底边中点的连线'],
        ['圆', '无数条', '每一条经过圆心的直线都是'],
        ['半圆', '1 条', '只有和直径垂直、过圆心的那条线'],
        ['等腰梯形', '1 条', '只有上下底中点的连线'],
        ['正五边形', '5 条', '正几边形就有几条对称轴'],
        ['正六边形', '6 条', '正几边形就有几条对称轴'],
        ['角', '1 条', '角的平分线所在的直线'],
        ['圆环', '无数条', '每一条经过圆心的直线都是'],
        ['扇形', '1 条', '经过圆心、把扇形平分的那条线'],
      ];
      const jd = [
        ['平行四边形（不是长方形、正方形）', false, '沿哪条线对折都不能完全重合'],
        ['直角梯形', false, '沿哪条线对折都不能完全重合'],
        ['三条边都不相等的三角形', false, '沿哪条线对折都不能完全重合'],
        ['等腰梯形', true, '沿上下底中点的连线对折能完全重合'],
        ['半圆', true, '沿和直径垂直、过圆心的线对折能完全重合'],
      ];
      if (r.chance(0.3)) {
        const [s, ok, why] = r.pick(jd);
        return { q: `判断：${s}是轴对称图形。`, answer: [judge(ok)], steps: [why, ok ? '所以是轴对称图形 √' : '所以不是轴对称图形 ×'] };
      }
      const [s, n, why] = r.pick(items);
      return { q: `${s}有几条对称轴？`, answer: [choice(r, n, OPT)], steps: [why, `所以${s}有${/^\d/.test(n) ? ' ' : ''}${n}对称轴`], hint: '想一想沿哪些线对折能完全重合' };
    },
  },

  // ================= 平均数与条形统计图 =================
  {
    id: 'g4b-avg-basic', grade: 4, term: 2, unit: '平均数与条形统计图', name: '求平均数', process: true,
    tip: '平均数 = 总数 ÷ 份数：先求总数，再除以份数', level: 1,
    gen(r) {
      const n = r.int(3, 6), name = r.name(), CNn = ['', '', '', '三', '四', '五', '六'][n];
      const ctx = r.pick([
        { lo: 100, hi: 170, sp: 15, u: '个', q: (v) => `${name}${CNn}次一分钟跳绳的成绩分别是 ${v} 个。平均每次跳多少个？`, a: '平均每次跳' },
        { lo: 20, hi: 50, sp: 8, u: '页', q: (v) => `${name}${CNn}天读书的页数分别是 ${v} 页。平均每天读多少页？`, a: '平均每天读' },
        { lo: 6, hi: 12, sp: 4, u: '个', q: (v) => `${CNn}名同学投篮，投中的个数分别是 ${v} 个。平均每人投中多少个？`, a: '平均每人投中' },
        { lo: 132, hi: 148, sp: 6, u: '厘米', q: (v) => `${CNn}名同学的身高分别是 ${v} 厘米。他们的平均身高是多少厘米？`, a: '平均身高是' },
        { lo: 20, hi: 45, sp: 8, u: '个', q: (v) => `${CNn}个小组收集矿泉水瓶，分别收集了 ${v} 个。平均每组收集多少个？`, a: '平均每组收集' },
        { lo: 15, hi: 28, sp: 4, u: '°C', q: (v) => `某地连续${CNn}天的最高气温分别是 ${v}°C。这几天的平均最高气温是多少摄氏度？`, a: '平均最高气温是' },
      ]);
      const m = r.int(ctx.lo, ctx.hi);
      const vals = r.until(() => { const v = Array.from({ length: n - 1 }, () => m + r.int(-ctx.sp, ctx.sp)); return [...v, m * n - v.reduce((s, x) => s + x, 0)]; }, (v) => Math.abs(v[n - 1] - m) <= ctx.sp && v.some((x) => x !== m));
      const sum = m * n;
      return {
        q: ctx.q(vals.join('、').replace(/、/g, ctx.u === '°C' ? '°C、' : '、')), answer: [num(m, ctx.u)],
        steps: ['找数量关系：平均数 = 总数 ÷ 份数', `先求总数：${vals.join(' + ')} = ${sum}（${ctx.u}）`, `再除以份数 ${n}：${sum} ÷ ${n} = ${m}（${ctx.u}）`, `答：${ctx.a} ${m}${ctx.u === '°C' ? '' : ' '}${ctx.u}。`],
        hint: '先求一共有多少，再看平均分成几份',
      };
    },
  },
  {
    id: 'g4b-avg-move', grade: 4, term: 2, unit: '平均数与条形统计图', name: '移多补少',
    tip: '两堆相差多少，从多的那堆拿出相差数的一半给少的', level: 1,
    gen(r) {
      const [c, u] = r.pick([['摞书', '本'], ['盒铅笔', '支'], ['堆苹果', '个'], ['筐梨', '个'], ['袋糖', '颗']]), mw = c[0];
      if (r.chance(0.6)) {
        const b = r.int(8, 40), t = r.int(2, 12), a = b + 2 * t;
        return {
          q: `第一${c}有 ${a} ${u}，第二${c}有 ${b} ${u}。从第一${mw}拿几${u}放到第二${mw}，两${mw}就同样多？`, answer: [num(t, u)],
          steps: [`两${mw}相差：${a} - ${b} = ${2 * t}（${u}）`, `拿出相差数的一半：${2 * t} ÷ 2 = ${t}（${u}）`, `检验：${a} - ${t} = ${a - t}，${b} + ${t} = ${b + t}，同样多 ✓`, `注意：不是拿 ${2 * t} ${u}，拿走 ${t} ${u}，这边少 ${t}，那边多 ${t}，正好补平`],
          hint: '拿走的同时，那一边也多了',
        };
      }
      const m = r.int(8, 40), t = r.int(1, Math.min(9, m - 2)), order = r.shuffle([m + t, m, m - t]);
      const hi = order.indexOf(m + t) + 1, lo = order.indexOf(m - t) + 1, CN = ['', '一', '二', '三'];
      return {
        q: `三${c}分别有 ${order.join(' ' + u + '、')} ${u}。要使三${mw}同样多，应该从第${CN[hi]}${mw}拿几${u}放到第${CN[lo]}${mw}？`, answer: [num(t, u)],
        steps: [`同样多的时候，每${mw}是平均数：(${order.join(' + ')}) ÷ 3 = ${m}（${u}）`, `第${CN[hi]}${mw}比 ${m} 多 ${t} ${u}，第${CN[lo]}${mw}比 ${m} 少 ${t} ${u}`, `从第${CN[hi]}${mw}拿 ${t} ${u}放到第${CN[lo]}${mw}`],
        hint: '先想同样多时每份是多少',
      };
    },
  },
  {
    id: 'g4b-avg-total', grade: 4, term: 2, unit: '平均数与条形统计图', name: '已知平均数求总数', process: true,
    tip: '总数 = 平均数 × 份数', level: 1,
    gen(r) {
      const name = r.name(), k = r.int(0, 4);
      const [n, m, q, u] = [
        () => { const n = r.int(3, 8), m = r.int(132, 148); return [n, m, `${n} 名同学的平均身高是 ${m} 厘米，他们的身高一共是多少厘米？`, '厘米']; },
        () => { const n = r.int(3, 6), m = r.int(85, 98); return [n, m, `${name}最近 ${n} 次数学测验的平均成绩是 ${m} 分，${n} 次一共得了多少分？`, '分']; },
        () => { const n = r.int(5, 7), m = r.int(105, 180); return [n, m, `一个小区 ${n} 天里平均每天用水 ${m} 吨，这 ${n} 天一共用水多少吨？`, '吨']; },
        () => { const n = r.int(4, 9), m = r.int(25, 68); return [n, m, `四年级 ${n} 个班平均每班捐书 ${m} 本，一共捐书多少本？`, '本']; },
        () => { const n = r.int(12, 35), m = r.int(15, 28); return [n, m, `${n} 箱苹果平均每箱重 ${m} 千克，这些苹果一共重多少千克？`, '千克']; },
      ][k]();
      return { q, answer: [num(n * m, u)], steps: ['找数量关系：平均数 × 份数 = 总数', `列式：${m} × ${n} = ${m * n}（${u}）`, `答：一共 ${m * n} ${u}。`], hint: '平均数和总数是什么关系？' };
    },
  },
  {
    id: 'g4b-avg-missing', grade: 4, term: 2, unit: '平均数与条形统计图', name: '已知平均数求某个数', process: true,
    tip: '先用平均数 × 份数求出总数，再减去已知的部分', level: 2,
    gen(r) {
      const name = r.name(), k = r.int(0, 3);
      if (k === 0) {
        const [n, a, b, x] = r.until(() => { const n = r.int(2, 4), a = r.int(80, 92), b = a + r.int(1, 4); return [n, a, b, b * (n + 1) - a * n]; }, (v) => v[3] <= 100);
        return { q: `${name}前 ${n} 次测验的平均成绩是 ${a} 分，第 ${n + 1} 次要考多少分，${n + 1} 次的平均成绩才能达到 ${b} 分？`, answer: [num(x, '分')], steps: [`${n + 1} 次一共要得：${b} × ${n + 1} = ${b * (n + 1)}（分）`, `前 ${n} 次已经得了：${a} × ${n} = ${a * n}（分）`, `第 ${n + 1} 次要考：${b * (n + 1)} - ${a * n} = ${x}（分）`, `答：第 ${n + 1} 次要考 ${x} 分。`], hint: '先求两个总分' };
      }
      if (k === 1) {
        const c = r.int(3, 5), m = r.int(20, 80), vals = r.until(() => Array.from({ length: c - 1 }, () => m + r.int(-15, 15)), (v) => { const x = m * c - v.reduce((s, y) => s + y, 0); return x > 0 && x !== m; });
        const x = m * c - vals.reduce((s, y) => s + y, 0);
        return { q: `${c} 个数的平均数是 ${m}，其中 ${c - 1} 个数分别是 ${vals.join('、')}，另一个数是多少？`, answer: [num(x)], steps: [`${c} 个数的和：${m} × ${c} = ${m * c}`, `已知的 ${c - 1} 个数的和：${vals.join(' + ')} = ${vals.reduce((s, y) => s + y, 0)}`, `另一个数：${m * c} - ${vals.reduce((s, y) => s + y, 0)} = ${x}`], hint: '先求这几个数的和' };
      }
      if (k === 2) {
        const [n, m, m2, x] = r.until(() => { const n = r.int(3, 6), m = r.int(30, 40), m2 = m + r.pick([-1, 1, 2]); return [n, m, m2, m2 * (n + 1) - m * n]; }, (v) => v[3] >= 25 && v[3] <= 50);
        return { q: `一个小组有 ${n} 名同学，平均体重 ${m} 千克。新来一名同学后，平均体重变成 ${m2} 千克。新来的同学体重多少千克？`, answer: [num(x, '千克')], steps: [`原来 ${n} 人的总体重：${m} × ${n} = ${m * n}（千克）`, `现在 ${n + 1} 人的总体重：${m2} × ${n + 1} = ${m2 * (n + 1)}（千克）`, `新同学：${m2 * (n + 1)} - ${m * n} = ${x}（千克）`, `答：新来的同学体重 ${x} 千克。`], hint: '人数变了，总体重也变了' };
      }
      const [n, m, m2, x] = r.until(() => { const n = r.int(5, 8), m = r.int(85, 93), m2 = m - r.int(1, 2); return [n, m, m2, m * n - m2 * (n - 1)]; }, (v) => v[3] <= 100 && v[3] > v[1]);
      return { q: `${n} 位评委给一名选手打分，平均分是 ${m} 分；去掉一个最高分后，平均分是 ${m2} 分。最高分是多少分？`, answer: [num(x, '分')], steps: [`${n} 位评委的总分：${m} × ${n} = ${m * n}（分）`, `去掉最高分后 ${n - 1} 位的总分：${m2} × ${n - 1} = ${m2 * (n - 1)}（分）`, `最高分：${m * n} - ${m2 * (n - 1)} = ${x}（分）`, `答：最高分是 ${x} 分。`], hint: '先求两个总分' };
    },
  },
  {
    id: 'g4b-avg-judge', grade: 4, term: 2, unit: '平均数与条形统计图', name: '平均数的意义', pool: 13,
    tip: '平均数表示一组数据的整体水平，不代表每一个数', level: 2,
    gen(r) {
      const [s, ok, why] = r.pick([
        ['一条小河的平均水深是 110 厘米，身高 140 厘米的小明下河游泳一定没有危险。', false, '平均水深 110 厘米，有的地方可能比 140 厘米深得多'],
        ['四年级一班同学的平均身高是 140 厘米，班里一定有身高 140 厘米的同学。', false, '平均数是算出来的，不一定有人正好是这个身高'],
        ['小明所在的小组平均身高 138 厘米，小明的身高一定是 138 厘米。', false, '平均数不代表每个人'],
        ['一组数据中，有一个数变大了，其他数不变，平均数也会变大。', true, '总数变大，份数不变，平均数变大'],
        ['平均数能反映一组数据的整体水平。', true, '这就是平均数的作用'],
        ['甲队的平均身高比乙队高，甲队每个人都比乙队的人高。', false, '只说明甲队整体偏高，有的人可能比乙队的人矮'],
        ['篮球队员的平均身高是 175 厘米，队里可能有人身高 165 厘米。', true, '有人高于平均数，也有人低于平均数'],
        ['5 个数的平均数是 20，这 5 个数的和是 100。', true, '总数 = 20 × 5 = 100'],
        ['一组数据的平均数一定是整数。', false, '平均数可能是小数，比如 1、2 的平均数是 1.5'],
        ['一组数据的平均数，不会比这组数据里最大的数还大。', true, '平均数在最大数和最小数之间'],
        ['一组数据的平均数可能和其中某个数相等。', true, '比如 2、3、4 的平均数是 3'],
        ['小红 5 次跳绳的平均成绩是 120 个，小红每次都跳了 120 个。', false, '平均成绩 120 个，各次可能有多有少'],
        ['求平均数时，用总数除以份数。', true, '平均数 = 总数 ÷ 份数'],
      ]);
      return { q: `判断：${s}`, answer: [judge(ok)], steps: [ok ? '这句话是对的 √' : '这句话是错的 ×', why] };
    },
  },
  {
    id: 'g4b-avg-combine', grade: 4, term: 2, unit: '平均数与条形统计图', name: '两部分合起来的平均数', process: true,
    tip: '先求两部分的总数和总份数，再相除；份数不同时不能直接把两个平均数相加除以 2', level: 2,
    gen(r) {
      const name = r.name(), k = r.int(0, 3);
      const R = [[4, 40, 75, 98, '分'], [2, 5, 20, 60, '页'], [3, 12, 130, 150, '厘米'], [2, 6, 45, 80, '千米']][k];
      // 先定合起来的平均数 A，再让两部分「多出来的」和「少的」正好抵消：m1 × d1 = m2 × d2
      const [m1, m2, a1, a2] = r.until(() => {
        const m1 = r.int(R[0], R[1]), m2 = r.int(R[0], R[1]), g = gcd(m1, m2), t = r.int(1, 3), A = r.int(R[2], R[3]);
        const d1 = (m2 / g) * t, d2 = (m1 / g) * t;
        return r.bool() ? [m1, m2, A + d1, A - d2] : [m1, m2, A - d1, A + d2];
      }, ([m1, m2, a1, a2]) => m1 !== m2 && a1 >= R[2] && a1 <= R[3] && a2 >= R[2] && a2 <= R[3]);
      const T = m1 * a1 + m2 * a2, N = m1 + m2, avg = T / N, u = R[4];
      const q = [
        `四（1）班有 ${m1} 人，数学平均分是 ${a1} 分；四（2）班有 ${m2} 人，平均分是 ${a2} 分。两个班合起来的平均分是多少分？`,
        `${name}前 ${m1} 天平均每天读 ${a1} 页书，后 ${m2} 天平均每天读 ${a2} 页。这 ${N} 天平均每天读多少页？`,
        `一个小组有男生 ${m1} 人，平均身高 ${a1} 厘米；女生 ${m2} 人，平均身高 ${a2} 厘米。全组的平均身高是多少厘米？`,
        `一辆货车前 ${m1} 小时平均每小时行 ${a1} 千米，后 ${m2} 小时平均每小时行 ${a2} 千米。这辆车平均每小时行多少千米？`,
      ][k];
      return {
        q, answer: [num(avg, u)],
        steps: [`两部分的份数不一样（${m1} 和 ${m2}），不能直接算 (${a1} + ${a2}) ÷ 2`, `先求总数：${a1} × ${m1} + ${a2} × ${m2} = ${m1 * a1} + ${m2 * a2} = ${T}（${u}）`, `总份数：${m1} + ${m2} = ${N}`, `平均数：${T} ÷ ${N} = ${avg}（${u}）`, `答：${['两个班的平均分是', '这几天平均每天读', '全组的平均身高是', '平均每小时行'][k]} ${avg} ${u}。`],
        hint: '平均数 = 总数 ÷ 总份数',
      };
    },
  },

  // ================= 数学广角——鸡兔同笼 =================
  {
    id: 'g4b-chick-rabbit', grade: 4, term: 2, unit: '数学广角——鸡兔同笼', name: '鸡兔同笼（假设法）', process: true,
    tip: '假设全是鸡，算出少了多少条腿；每把一只鸡换成兔，多 2 条腿', level: 1,
    gen(r) {
      const [place, s, g, us, ug] = r.pick([['笼子里', '鸡', '兔', '只', '只'], ['农场里', '鸭', '羊', '只', '只'], ['院子里', '鹅', '猪', '只', '头'], ['动物园里', '鸵鸟', '长颈鹿', '只', '只'], ['院子里', '鸡', '狗', '只', '只']]);
      const H = r.int(8, 40), t = r.int(1, H - 1), c = H - t, L = 2 * c + 4 * t;
      const allSmall = r.chance(0.65);
      const st = allSmall
        ? [`假设 ${H} 只全是${s}，一共有腿：${H} × 2 = ${2 * H}（条）`, `比实际少了：${L} - ${2 * H} = ${L - 2 * H}（条）`, `把 1 只${s}换成 1 只${g}，腿就多 4 - 2 = 2（条）`, `${g}：${L - 2 * H} ÷ 2 = ${t}（${ug}）`, `${s}：${H} - ${t} = ${c}（${us}）`, `检验：${c} × 2 + ${t} × 4 = ${L}（条）✓`]
        : [`假设 ${H} 只全是${g}，一共有腿：${H} × 4 = ${4 * H}（条）`, `比实际多了：${4 * H} - ${L} = ${4 * H - L}（条）`, `把 1 只${g}换成 1 只${s}，腿就少 4 - 2 = 2（条）`, `${s}：${4 * H - L} ÷ 2 = ${c}（${us}）`, `${g}：${H} - ${c} = ${t}（${ug}）`, `检验：${c} × 2 + ${t} × 4 = ${L}（条）✓`];
      return {
        q: `${place}有${s}和${g}，一共有 ${H} 个头，${L} 条腿。${s}和${g}各有多少${us === ug ? us : '只（头）'}？`,
        answer: [num(c, us, s), num(t, ug, g)],
        steps: st,
        hint: allSmall ? `假设全是${s}，会有多少条腿？` : `假设全是${g}，会有多少条腿？`,
      };
    },
  },
  {
    id: 'g4b-chick-rabbit-var', grade: 4, term: 2, unit: '数学广角——鸡兔同笼', name: '鸡兔同笼变式', process: true,
    tip: '找出谁相当于「鸡」、谁相当于「兔」，再用假设法', level: 2,
    gen(r) {
      const name = r.name(), k = r.int(0, 5);
      const C = [
        () => { const [g, s] = r.pick([[6, 4], [5, 3]]); return { g, s, nb: '大船', ns: '小船', u: '条', what: '人', make: (n, T) => `${n} 条船正好坐满 ${T} 人，大船每条坐 ${g} 人，小船每条坐 ${s} 人。大船和小船各有多少条？`, one: (x) => `每条大船比小船多坐 ${x} 人` }; },
        () => { const [s, g] = r.pick([[2, 5], [5, 10], [10, 20]]); return { g, s, nb: `${g}元`, ns: `${s}元`, u: '张', what: '元', make: (n, T) => `${name}有 ${s} 元和 ${g} 元的纸币共 ${n} 张，一共 ${T} 元。${g} 元和 ${s} 元的纸币各有多少张？`, one: (x) => `每张 ${g} 元比 ${s} 元多 ${x} 元` }; },
        () => ({ g: 3, s: 2, nb: '三轮车', ns: '自行车', u: '辆', what: '个轮子', make: (n, T) => `车棚里有三轮车和自行车共 ${n} 辆，一共有 ${T} 个轮子。三轮车和自行车各有多少辆？`, one: (x) => `每辆三轮车比自行车多 ${x} 个轮子` }),
        () => ({ g: 4, s: 2, nb: '双打', ns: '单打', u: '张', what: '人', make: (n, T) => `乒乓球室的 ${n} 张球桌上都有人在比赛，单打每桌 2 人，双打每桌 4 人，一共有 ${T} 人。双打和单打各有几张球桌？`, one: (x) => `每张双打桌比单打桌多 ${x} 人` }),
        () => { const [g, s] = r.pick([[10, 5], [20, 10], [30, 15], [40, 25]]); return { g, s, nb: '成人', ns: '儿童', u: '人', what: '元', make: (n, T) => `${n} 人去公园，成人票每张 ${g} 元，儿童票每张 ${s} 元，一共花了 ${T} 元。成人和儿童各有多少人？`, one: (x) => `每张成人票比儿童票贵 ${x} 元` }; },
        () => ({ g: 8, s: 6, nb: '蜘蛛', ns: '蜻蜓', u: '只', what: '条腿', make: (n, T) => `蜘蛛有 8 条腿，蜻蜓有 6 条腿。现在有蜘蛛和蜻蜓共 ${n} 只，一共有 ${T} 条腿。蜘蛛和蜻蜓各有多少只？`, one: (x) => `每只蜘蛛比蜻蜓多 ${x} 条腿` }),
      ][k]();
      const n = r.int(8, 30), b = r.int(2, n - 2), sm = n - b, T = C.g * b + C.s * sm, short = T - C.s * n, dx = C.g - C.s;
      return {
        q: C.make(n, T), answer: [num(b, C.u, C.nb), num(sm, C.u, C.ns)],
        steps: [`这和鸡兔同笼一样：${C.ns}相当于「鸡」，${C.nb}相当于「兔」`, `假设全是${C.ns}：${C.s} × ${n} = ${C.s * n}（${C.what}），比实际少 ${T} - ${C.s * n} = ${short}（${C.what}）`, `${C.one(dx)}`, `${C.nb}：${short} ÷ ${dx} = ${b}（${C.u}），${C.ns}：${n} - ${b} = ${sm}（${C.u}）`, `检验：${C.g} × ${b} + ${C.s} × ${sm} = ${T} ✓`],
        hint: `假设全是${C.ns}`,
      };
    },
  },
  {
    id: 'g4b-chick-rabbit-score', grade: 4, term: 2, unit: '数学广角——鸡兔同笼', name: '得分扣分问题', process: true,
    tip: '假设全对；每错一题，不但得不到分，还要扣分，一共少「得分 + 扣分」', level: 3,
    gen(r) {
      const name = r.name(), k = r.int(0, 3);
      const [n, a, b, w] = r.until(() => { const n = r.int(10, 30), a = r.int(3, 10), b = r.int(1, 5), w = r.int(1, Math.floor(n / 2)); return [n, a, b, w]; }, ([n, a, b, w]) => a * (n - w) - b * w > 0);
      const S = a * (n - w) - b * w, rt = n - w;
      const T = [
        { q: `知识竞赛共 ${n} 道题，答对一题得 ${a} 分，答错或不答一题扣 ${b} 分。${name}得了 ${S} 分，答对了几道题？`, ask: 'right', u: '道', ok: '答对', bad: '答错', pu: '分', lose: '扣' },
        { q: `运输队运 ${n} 箱玻璃杯，每运到一箱得运费 ${a} 元，打碎一箱不但不给运费，还要赔 ${b} 元。最后得到运费 ${S} 元，打碎了几箱？`, ask: 'wrong', u: '箱', ok: '运好', bad: '打碎', pu: '元', lose: '赔' },
        { q: `投篮游戏中，投中一次得 ${a} 分，投不中一次扣 ${b} 分。${name}投了 ${n} 次，得了 ${S} 分，投中了几次？`, ask: 'right', u: '次', ok: '投中', bad: '投不中', pu: '分', lose: '扣' },
        { q: `套圈游戏中，套中一次得 ${a} 分，没套中一次扣 ${b} 分。${name}套了 ${n} 次，得了 ${S} 分，没套中几次？`, ask: 'wrong', u: '次', ok: '套中', bad: '没套中', pu: '分', lose: '扣' },
      ][k];
      return {
        q: T.q, answer: [num(T.ask === 'right' ? rt : w, T.u)],
        steps: [`假设全部${T.ok}：${a} × ${n} = ${a * n}（${T.pu}）`, `实际少了：${a * n} - ${S} = ${a * n - S}（${T.pu}）`, `每${T.bad}一${T.u}，不但得不到 ${a} ${T.pu}，还要${T.lose} ${b} ${T.pu}，一共少 ${a} + ${b} = ${a + b}（${T.pu}）`, `${T.bad}：${a * n - S} ÷ ${a + b} = ${w}（${T.u}）`, T.ask === 'right' ? `${T.ok}：${n} - ${w} = ${rt}（${T.u}）` : `检验：${a} × ${rt} - ${b} × ${w} = ${S} ✓`, T.ask === 'right' ? `检验：${a} × ${rt} - ${b} × ${w} = ${S} ✓` : `答：${T.bad} ${w} ${T.u}。`],
        hint: `假设全部${T.ok}，能得多少${T.pu}？`,
      };
    },
  },

  // ================= 拓展 =================
  {
    id: 'g4b-ext-tree', grade: 4, term: 2, unit: '拓展：常见应用题', name: '植树问题', process: true,
    tip: '先求段数 = 全长 ÷ 间隔；两端都种：棵数 = 段数 + 1；两端都不种：段数 - 1；一端种：棵数 = 段数', level: 3,
    gen(r) {
      const d = r.pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25]), seg = r.int(5, 40), L = d * seg, k = r.int(0, 2);
      const [txt, u, verb] = r.pick([[`在一条长 ${L} 米的小路一边种树，每隔 ${d} 米种一棵`, '棵', '种'], [`在一条长 ${L} 米的街道一侧装路灯，每隔 ${d} 米装一盏`, '盏', '装'], [`在长 ${L} 米的跑道一边插彩旗，每隔 ${d} 米插一面`, '面', '插'], [`在长 ${L} 米的走廊一侧摆花盆，每隔 ${d} 米摆一盆`, '盆', '摆'], [`沿一段长 ${L} 米的公路一旁栽电线杆，每隔 ${d} 米栽一根`, '根', '栽']]);
      const both = k === 0 && r.chance(0.25);
      const end = ['（两端都要' + verb + '）', '（两端都不' + verb + '）', '（只在一端' + verb + '）'][k];
      const one = [seg + 1, seg - 1, seg][k], ans = both ? one * 2 : one;
      const rule = ['两端都' + verb + '：数量 = 段数 + 1', '两端都不' + verb + '：数量 = 段数 - 1', '只' + verb + '一端：数量 = 段数'][k];
      const q = (both ? txt.replace('一边', '两边').replace('一侧', '两侧').replace('一旁', '两旁') : txt) + end + `，一共要${verb}多少${u}？`;
      const st = [`先求段数：${L} ÷ ${d} = ${seg}（段）`, `${rule}`, k === 2 ? `数量就是段数：${one} ${u}` : `${[`${seg} + 1`, `${seg} - 1`][k]} = ${one}（${u}）`];
      if (both) st.push(`两边都${verb}：${one} × 2 = ${ans}（${u}）`);
      st.push(`答：一共要${verb} ${ans} ${u}。`);
      return { q, answer: [num(ans, u)], steps: st, hint: `先画一画：分成几段？两头要不要${verb}？` };
    },
  },
  {
    id: 'g4b-ext-tree2', grade: 4, term: 2, unit: '拓展：常见应用题', name: '植树问题变式', process: true,
    tip: '围成一圈：棵数 = 段数；锯木头：次数 = 段数 - 1；爬楼梯：层数 = 楼层 - 1；敲钟：间隔数 = 下数 - 1', level: 3,
    gen(r) {
      const name = r.name(), k = r.int(0, 3);
      if (k === 0) {
        const d = r.pick([2, 3, 4, 5, 6, 8, 10]), n = r.int(12, 60), L = d * n;
        return { q: `一个圆形池塘的周长是 ${L} 米，沿着池塘一周每隔 ${d} 米栽一棵柳树，一共要栽多少棵？`, answer: [num(n, '棵')], steps: [`段数：${L} ÷ ${d} = ${n}（段）`, '围成一圈，起点和终点是同一个地方，棵数 = 段数', `答：一共要栽 ${n} 棵。`], hint: '围成一圈时，头和尾重合了' };
      }
      if (k === 1) {
        const n = r.int(3, 12), t = r.int(2, 9);
        return { q: `把一根木头锯成 ${n} 段，每锯一次要 ${t} 分钟。一共要锯多少分钟？`, answer: [num((n - 1) * t, '分钟')], steps: [`锯成 ${n} 段，只要锯 ${n} - 1 = ${n - 1}（次）`, `${t} × ${n - 1} = ${(n - 1) * t}（分钟）`, `答：一共要 ${(n - 1) * t} 分钟。`, `易错：不是 ${t} × ${n}，锯 1 次就有 2 段了`], hint: '锯 1 次变成几段？' };
      }
      if (k === 2) {
        const a = r.int(3, 6), per = r.int(8, 20), T = (a - 1) * per, b = r.int(a + 1, 12);
        return { q: `${name}从 1 楼走到 ${a} 楼用了 ${T} 秒。照这样的速度，从 1 楼走到 ${b} 楼要用多少秒？`, answer: [num((b - 1) * per, '秒')], steps: [`从 1 楼到 ${a} 楼，走了 ${a} - 1 = ${a - 1}（层）`, `走一层：${T} ÷ ${a - 1} = ${per}（秒）`, `从 1 楼到 ${b} 楼走 ${b - 1} 层：${per} × ${b - 1} = ${(b - 1) * per}（秒）`, `答：要用 ${(b - 1) * per} 秒。`], hint: '从 1 楼到 3 楼走了几层？' };
      }
      const a = r.int(3, 6), gap = r.int(2, 5), T = (a - 1) * gap, b = r.int(a + 1, 12);
      return { q: `时钟 ${a} 点钟敲 ${a} 下，${T} 秒敲完。照这样，${b} 点钟敲 ${b} 下，要多少秒敲完？`, answer: [num((b - 1) * gap, '秒')], steps: [`敲 ${a} 下，中间有 ${a} - 1 = ${a - 1} 个间隔`, `每个间隔：${T} ÷ ${a - 1} = ${gap}（秒）`, `敲 ${b} 下有 ${b - 1} 个间隔：${gap} × ${b - 1} = ${(b - 1) * gap}（秒）`, `答：要 ${(b - 1) * gap} 秒。`], hint: '敲 3 下中间有几个间隔？' };
    },
  },
  {
    id: 'g4b-ext-age', grade: 4, term: 2, unit: '拓展：常见应用题', name: '年龄问题', process: true,
    tip: '两个人的年龄差永远不变；每过一年，两人都长 1 岁', level: 3,
    gen(r) {
      const name = r.name(), k = r.int(0, 3);
      if (k <= 1) {
        const [D, kk] = r.until(() => [r.int(24, 36), r.int(3, 5)], ([D, kk]) => D % (kk - 1) === 0);
        const ct = D / (kk - 1), later = k === 0;
        const S = later ? r.int(Math.max(1, ct - 9), ct - 1) : r.int(ct + 1, ct + 8), F = S + D, y = Math.abs(ct - S);
        return {
          q: `今年爸爸 ${F} 岁，${name} ${S} 岁。${later ? '几年后' : '几年前'}爸爸的年龄是${name}的 ${kk} 倍？`, answer: [num(y, '年')],
          steps: [`年龄差不变：爸爸永远比${name}大 ${F} - ${S} = ${D}（岁）`, `爸爸是${name}的 ${kk} 倍时，爸爸比${name}多 ${kk} - 1 = ${kk - 1} 倍，这 ${kk - 1} 倍就是 ${D} 岁`, `那时${name}：${D} ÷ ${kk - 1} = ${ct}（岁）`, later ? `${ct} - ${S} = ${y}（年），是 ${y} 年后` : `${S} - ${ct} = ${y}（年），是 ${y} 年前`, `检验：那时爸爸 ${ct * kk} 岁，${ct * kk} ÷ ${ct} = ${kk} ✓`],
          hint: '年龄差会变吗？',
        };
      }
      if (k === 2) {
        const X = r.int(30, 60), n = r.int(2, 9);
        return { q: `今年妈妈和${name}的年龄和是 ${X} 岁，${n} 年后两人的年龄和是多少岁？`, answer: [num(X + 2 * n, '岁')], steps: [`过 ${n} 年，妈妈长 ${n} 岁，${name}也长 ${n} 岁`, `年龄和增加：${n} × 2 = ${2 * n}（岁）`, `${X} + ${2 * n} = ${X + 2 * n}（岁）`, `易错：不是 ${X} + ${n}，两个人都长了`], hint: '两个人都长了几岁？' };
      }
      const C = r.int(6, 12), D = r.int(24, 35), M = C + D, C2 = C + r.int(3, 20);
      return { q: `妈妈今年 ${M} 岁，${name}今年 ${C} 岁。当${name} ${C2} 岁时，妈妈多少岁？`, answer: [num(C2 + D, '岁')], steps: [`妈妈比${name}大：${M} - ${C} = ${D}（岁），年龄差不变`, `${name} ${C2} 岁时，妈妈：${C2} + ${D} = ${C2 + D}（岁）`, `答：妈妈 ${C2 + D} 岁。`], hint: '妈妈比孩子大几岁？会变吗？' };
    },
  },
  {
    id: 'g4b-ext-diff-times', grade: 4, term: 2, unit: '拓展：常见应用题', name: '差倍问题', process: true,
    tip: '把小数看作 1 份，大数比小数多（倍数 - 1）份；1 份 = 差 ÷ (倍数 - 1)', level: 3,
    gen(r) {
      const [n1, n2] = r.names(2), k = r.int(0, 4), kk = r.int(2, 6), s = r.int(5, 60), D = s * (kk - 1), bg = s * kk;
      const T = [
        { q: `果园里苹果树的棵数是梨树的 ${kk} 倍，苹果树比梨树多 ${D} 棵。苹果树和梨树各有多少棵？`, B: '苹果树', S: '梨树', u: '棵' },
        { q: `${n1}的邮票张数是${n2}的 ${kk} 倍，${n1}比${n2}多 ${D} 张。两人各有多少张邮票？`, B: n1, S: n2, u: '张' },
        { q: `一根长绳子的长度是短绳子的 ${kk} 倍，长绳子比短绳子长 ${D} 米。两根绳子各长多少米？`, B: '长绳', S: '短绳', u: '米' },
        { q: `农场里鸭的只数是鸡的 ${kk} 倍，鸭比鸡多 ${D} 只。鸭和鸡各有多少只？`, B: '鸭', S: '鸡', u: '只' },
        { q: `大数是小数的 ${kk} 倍，大数比小数大 ${D}。大数和小数各是多少？`, B: '大数', S: '小数', u: '' },
      ][k];
      const U = T.u ? `（${T.u}）` : '';
      return {
        q: T.q,
        fig: fig.bars([{ label: T.B, units: 1, extra: kk - 1, extraText: `多 ${D} ${T.u}`, text: '?' }, { label: T.S, units: 1, text: '?' }]),
        answer: [num(bg, T.u, T.B), num(s, T.u, T.S)],
        steps: [`把${T.S}看作 1 份，${T.B}就是 ${kk} 份`, `${T.B}比${T.S}多 ${kk} - 1 = ${kk - 1}（份），正好是 ${D}${T.u ? ' ' + T.u : ''}`, `1 份（${T.S}）：${D} ÷ ${kk - 1} = ${s}${U}`, `${T.B}：${s} × ${kk} = ${bg}${U}`, `检验：${bg} - ${s} = ${D}，${bg} ÷ ${s} = ${kk} ✓`],
        hint: '看线段图：多出来的是几份？',
      };
    },
  },
  {
    id: 'g4b-ext-chase', grade: 4, term: 2, unit: '拓展：常见应用题', name: '追及问题', process: true,
    tip: '追及时间 = 路程差 ÷ 速度差', level: 3,
    gen(r) {
      const [n1, n2] = r.names(2), k = r.int(0, 3);
      if (k === 0) {
        const v2 = r.int(50, 70), v1 = v2 + r.int(5, 30), t = r.int(4, 20), d = (v1 - v2) * t;
        return { q: `${n2}在${n1}前面 ${d} 米，两人同时同向出发。${n1}每分钟走 ${v1} 米，${n2}每分钟走 ${v2} 米，${n1}几分钟能追上${n2}？`, answer: [num(t, '分钟')], steps: ['追上时，快的要比慢的多走开始相差的那段路', `每分钟追近（速度差）：${v1} - ${v2} = ${v1 - v2}（米）`, `追及时间 = 路程差 ÷ 速度差：${d} ÷ ${v1 - v2} = ${t}（分钟）`, `答：${t} 分钟能追上。`], hint: '每分钟能追近多少米？' };
      }
      if (k === 1) {
        const [v2, t0, t] = r.until(() => [r.int(50, 70), r.int(2, 10), r.int(3, 30)], ([v2, t0, t]) => (v2 * t0) % t === 0 && (v2 * t0) / t >= 5 && (v2 * t0) / t <= 30);
        const d = v2 * t0, dv = d / t, v1 = v2 + dv;
        return { q: `${n2}先出发 ${t0} 分钟，每分钟走 ${v2} 米；${n1}随后从同一地点出发去追，每分钟走 ${v1} 米。${n1}出发后几分钟能追上${n2}？`, answer: [num(t, '分钟')], steps: [`${n2}先走的路程（路程差）：${v2} × ${t0} = ${d}（米）`, `速度差：${v1} - ${v2} = ${dv}（米/分）`, `追及时间：${d} ÷ ${dv} = ${t}（分钟）`, `答：${t} 分钟能追上。`], hint: '先求开始追时两人相距多远' };
      }
      if (k === 2) {
        const [v2, t0, t] = r.until(() => [r.int(12, 18), r.int(1, 4), r.int(1, 3)], ([v2, t0, t]) => (v2 * t0) % t === 0 && (v2 * t0) / t >= 25 && (v2 * t0) / t <= 60);
        const d = v2 * t0, dv = d / t, v1 = v2 + dv;
        return { q: `一辆自行车每小时行 ${v2} 千米，先出发 ${t0} 小时后，一辆汽车从同一地点出发去追，每小时行 ${v1} 千米。汽车几小时能追上自行车？`, answer: [num(t, '小时')], steps: [`自行车先行的路程：${v2} × ${t0} = ${d}（千米）`, `速度差：${v1} - ${v2} = ${dv}（千米/时）`, `追及时间：${d} ÷ ${dv} = ${t}（小时）`, `答：${t} 小时能追上。`], hint: '先求路程差' };
      }
      const v2 = r.int(3, 6), v1 = v2 + r.int(1, 4), t = r.int(5, 20), d = (v1 - v2) * t;
      return { q: `小狗发现前面 ${d} 米处有一只小猫，马上去追。小猫每秒跑 ${v2} 米，小狗每秒跑 ${v1} 米，小狗几秒能追上小猫？`, answer: [num(t, '秒')], steps: [`速度差：${v1} - ${v2} = ${v1 - v2}（米/秒）`, `追及时间 = 路程差 ÷ 速度差：${d} ÷ ${v1 - v2} = ${t}（秒）`, `答：${t} 秒能追上。`], hint: '每秒能追近多少米？' };
    },
  },
];

export default [...UPPER, ...LOWER];
