// 补全算式（竖式 / 横式数字谜、填运算符号、添括号）和简便运算（按步骤填空）的出题器，g2～g4 共用。
// 每道补全算式题都穷举所有填法，确认只有一种填法成立才出。
import { vMul } from '../js/lib.js';

const POS = ['个位', '十位', '百位', '千位', '万位', '十万位'];
const num = (value, label) => (label ? { kind: 'num', value, label } : { kind: 'num', value });
const round10 = (n) => n % 10 === 0;

// ======================= 数字谜 =======================
/**
 * rows：[{ sign, n, shift }] 或 '-'（横线）。挖掉一些数字位，穷举确认只有一种填法。
 * check(vals)：vals[i] 是第 i 行填好后的数（横线行是 null）。
 * pick(r, cells)：挑要挖的位置（[行, 从左数第几位]）。
 */
export function digitPuzzle(r, rows, check, pick) {
  const strs = rows.map((x) => (x === '-' ? null : String(x.n)));
  const cells = [];
  strs.forEach((s, i) => s && [...s].forEach((_, j) => cells.push([i, j, s.length - 1 - j + (rows[i].shift || 0)])));
  for (let t = 0; t < 60; t++) {
    const hid = pick(r, cells).map(([i, j]) => [i, j]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (!hid.length) continue;
    const cur = strs.map((s) => s && [...s]);
    let count = 0;
    const rec = (h) => {
      if (count > 1) return;
      if (h === hid.length) { if (check(cur.map((c) => c && +c.join('')))) count++; return; }
      const [i, j] = hid[h];
      for (let d = j === 0 && cur[i].length > 1 ? 1 : 0; d <= 9; d++) { cur[i][j] = String(d); rec(h + 1); }
      cur[i][j] = strs[i][j];
    };
    rec(0);
    if (count !== 1) continue;
    const isHid = (i, j) => hid.some(([a, b]) => a === i && b === j);
    return {
      rows: rows.map((x, i) => (x === '-' ? '-' : { ...x, s: [...strs[i]].map((ch, j) => (isHid(i, j) ? '?' : ch)).join('') })),
      answers: hid.map(([i, j]) => num(+strs[i][j])),
      values: hid.map(([i, j]) => +strs[i][j]),
      isHid,
    };
  }
  return null;
}
/** 挑 n 个不同的数位（列），每列只挖一个格子（加减法用：一列只缺一个数才能直接推出来） */
export const pickByColumn = (n, rowsAllowed) => (r, cells) => {
  const ok = cells.filter(([i]) => !rowsAllowed || rowsAllowed.includes(i));
  const cols = r.sample([...new Set(ok.map((c) => c[2]))], n);
  return cols.map((c) => r.pick(ok.filter((x) => x[2] === c)));
};
export const pickAny = (n) => (r, cells) => r.sample(cells, n);
/** 挑 n 个格子，尽量分在不同的行、不同的数位（横式用：每个数都缺一点，要连起来推） */
export const pickSpread = (n) => (r, cells) => {
  for (let t = 0; t < 30; t++) {
    const s = r.sample(cells, n);
    if (new Set(s.map((c) => c[0])).size === n && new Set(s.map((c) => c[2])).size === n) return s;
  }
  return r.sample(cells, n);
};

/** 竖式标记 ⟪行/行⟫：格子用逗号分开，'-' 是横线，'?' 依次变成 {0} {1} … */
export function vgridMark(rows) {
  const W = Math.max(...rows.filter((x) => x !== '-').map((x) => x.s.length + (x.shift || 0))) + 1;
  let k = 0;
  return '⟪' + rows.map((x) => {
    if (x === '-') return '-';
    const cells = Array(W).fill('');
    if (x.sign) cells[0] = x.sign;
    const st = W - (x.shift || 0) - x.s.length;
    [...x.s].forEach((ch, i) => { cells[st + i] = ch === '?' ? `{${k++}}` : ch; });
    return cells.join(',');
  }).join('/') + '⟫';
}
/** 横式：'?' 依次变成 {0} {1} … */
export function inlineMark(strs, joiners) {
  let k = 0;
  const conv = (s) => [...s].map((ch) => (ch === '?' ? `{${k++}}` : ch)).join('');
  return strs.map((s, i) => conv(s) + (joiners[i] ?? '')).join('');
}

// ---------- 讲解：一列一列推 ----------
const dig = (s, i) => (i < s.length ? +s[s.length - 1 - i] : null); // 从右数第 i 位
/** 加法 a + b = c，按列讲（rows 是 a、b、c 所在行号） */
export function explainAdd(a, b, c, [ia, ib, ic], isHid) {
  const A = String(a), B = String(b), C = String(c), out = [];
  let carry = 0;
  for (let i = 0; i < C.length; i++) {
    const da = dig(A, i), db = dig(B, i), dc = dig(C, i), pos = POS[i];
    const ha = da !== null && isHid(ia, A.length - 1 - i), hb = db !== null && isHid(ib, B.length - 1 - i), hc = isHid(ic, C.length - 1 - i);
    const s = (da ?? 0) + (db ?? 0) + carry, cin = carry ? ' + 1' : '', cinT = carry ? '（加上进上来的 1）' : '';
    const go = s >= 10 ? '，向前一位进 1' : '';
    if (da === null && db === null) out.push(`${pos}：只有进上来的 1，得数这一位是 1${hc ? '，□ 填 1' : ''}`);
    else if (ha || hb) {
      const known = ha ? db : da, x = ha ? da : db;
      out.push(`${pos}：□${known === null ? '' : ' + ' + known}${cinT} 的个位要是 ${dc}，□ 填 ${x}（${x}${known === null ? '' : ' + ' + known}${cin} = ${s}${go}）`);
    } else {
      const expr = [da, db].filter((v) => v !== null).join(' + ') + cin;
      out.push(`${pos}：${expr} = ${s}，写 ${dc}${go}${hc ? `，□ 填 ${dc}` : ''}`);
    }
    carry = s >= 10 ? 1 : 0;
  }
  return out;
}
/** 减法 a - b = c，按列讲 */
export function explainSub(a, b, c, [ia, ib, ic], isHid) {
  const A = String(a), B = String(b), C = String(c), out = [];
  let borrow = 0;
  for (let i = 0; i < A.length; i++) {
    const da = dig(A, i), db = dig(B, i) ?? 0, dc = dig(C, i) ?? 0, pos = POS[i];
    const hasB = i < B.length, hasC = i < C.length;
    const ha = isHid(ia, A.length - 1 - i), hb = hasB && isHid(ib, B.length - 1 - i), hc = hasC && isHid(ic, C.length - 1 - i);
    const top = da - borrow, need = top < db, val = need ? top + 10 : top;
    const fillC = hc ? `，□ 填 ${dc}` : '';
    if (ha) {
      const sum = dc + db + borrow;
      if (!hasB) out.push(`${pos}：上面的 □${borrow ? ' 被借走 1 后' : ''}${hasC ? `是 ${dc}` : '正好是 0（得数这一位不写）'}，□ 填 ${da}`);
      else out.push(`${pos}：上面的 □${borrow ? ' 被借走 1 后' : ' '}减 ${db} 得 ${dc}，倒过来想：${dc} + ${db}${borrow ? ' + 1' : ''} = ${sum}，□ 填 ${da}${sum >= 10 ? '（满十了，说明这一位向前一位借了 1）' : ''}`);
    } else {
      // 先说上面这一位现在是几
      let st = `上面是 ${da}`;
      if (borrow && da === 0) st += '，被借走 1 不够，先向前一位借 1 当 10，借出 1 后剩 9';
      else if (borrow) st += `，被借走 1 剩 ${top}`;
      const lend = need && top >= 0;
      if (hb) out.push(`${pos}：${st}${lend ? `，比 ${dc} 小，要向前一位借 1，变成 ${val}` : ''}；${val} 减 □ 得 ${dc}，□ 填 ${val} - ${dc} = ${db}`);
      else if (!hasB) out.push(`${pos}：${st}，${hasC ? `直接写 ${dc}` : '这一位是 0，不用写'}${fillC}`);
      else out.push(`${pos}：${st}${lend ? `，不够减 ${db}，向前一位借 1，变成 ${val}` : ''}，${val} - ${db} = ${dc}${fillC}`);
    }
    borrow = need ? 1 : 0;
  }
  return out;
}
/** 乘法 a × d（一位数），从个位起一位一位推；ia、ic 是 a 和积所在的行。返回 { lines, ok }：ok=false 表示某一位光看这一位推不出唯一答案 */
export function explainMul1(a, d, c, [ia, ic], isHid) {
  const A = String(a), C = String(c), lines = [];
  let carry = 0, ok = true;
  for (let i = 0; i < A.length; i++) {
    const da = dig(A, i), p = da * d + carry, last = i === A.length - 1, pos = POS[i];
    const cin = carry ? ` + ${carry}（进上来的）` : '';
    // 这一位写进积里的数字：最后一位写整个 p，其余写个位
    const P = last ? String(p) : String(p % 10);
    const at = (j) => C.length - 1 - i - (P.length - 1 - j); // P 的第 j 位在 C 里的下标
    const hidC = [...P].map((_, j) => isHid(ic, at(j)));
    const pattern = [...P].map((ch, j) => (hidC[j] ? '□' : ch)).join('');
    const fillC = hidC.some(Boolean) ? `，□ 填 ${[...P].filter((_, j) => hidC[j]).join('、')}` : '';
    const carryTxt = !last && p >= 10 ? `，进 ${Math.floor(p / 10)}` : '';
    if (isHid(ia, A.length - 1 - i)) {
      const lo = last ? 1 : 0;
      const fits = (x) => { const q = x * d + carry, Q = last ? String(q) : String(q % 10); return Q.length === P.length && [...Q].every((ch, j) => hidC[j] || ch === P[j]); };
      const cands = [...Array(10).keys()].filter((x) => x >= lo && fits(x));
      if (cands.length !== 1) ok = false;
      lines.push(last
        ? `${pos}：□ × ${d}${cin} 要得到积最前面的「${pattern}」，只有 ${da} × ${d}${cin} = ${p} 对得上，□ 填 ${da}${fillC ? `；积最前面是 ${p}${fillC}` : ''}`
        : `${pos}：□ × ${d}${cin} 的个位要是 ${pattern}，只有 ${da} × ${d}${cin} = ${p}，□ 填 ${da}${carryTxt}${fillC}`);
    } else lines.push(`${pos}：${da} × ${d}${cin} = ${p}，写 ${P}${carryTxt}${fillC}`);
    carry = Math.floor(p / 10);
  }
  return { lines, ok };
}
const listAns = (vals) => `所以 □ 里从上到下、从左到右依次填：${vals.join('、')}`;

// ---------- 题型 ----------
/** 两位数加减法横式数字谜（二年级） */
export function genHAddSub(r) {
  for (let t = 0; t < 50; t++) {
    const sub = r.bool();
    let a, b, c;
    if (!sub) { a = r.int(12, 79); b = r.int(12, 98 - a); c = a + b; } else { a = r.int(31, 98); b = r.int(12, a - 11); c = a - b; }
    if (c < 10 || round10(a) || round10(b)) continue;
    const rows = [{ n: a }, { n: b }, { n: c }];
    const pz = digitPuzzle(r, rows, sub ? (v) => v[0] - v[1] === v[2] : (v) => v[0] + v[1] === v[2], pickSpread(2));
    if (!pz) continue;
    const [sa, sb, sc] = pz.rows.map((x) => x.s), op = sub ? ' - ' : ' + ';
    return {
      q: `在 □ 里填上合适的数字，使算式成立：\n${inlineMark([sa, sb, sc], [op, ' = ', ''])}`,
      answer: pz.answers,
      steps: [`从个位起一位一位推：哪一位只缺一个数，就用${sub ? '「被减数 = 差 + 减数」「减数 = 被减数 - 差」' : '「加数 = 和 - 另一个加数」'}求出来，别忘了${sub ? '退位' : '进位'}`,
        ...(sub ? explainSub(a, b, c, [0, 1, 2], pz.isHid) : explainAdd(a, b, c, [0, 1, 2], pz.isHid)),
        `验算：${a}${op}${b} = ${c} ✓`, listAns(pz.values)],
      hint: '先看个位：哪个数缺了？用和、差倒推一下',
    };
  }
  throw new Error('genHAddSub 没生成出来');
}
/** 三位数（四位数）加减法竖式填空（三年级） */
export function genVAddSub(r, { sub = false, hide = 3 } = {}) {
  for (let t = 0; t < 50; t++) {
    let a, b, c;
    if (!sub) { a = r.int(120, 899); b = r.int(110, 999 - a + r.int(0, 600)); c = a + b; } else { a = r.int(300, 1500); b = r.int(110, a - 100); c = a - b; }
    if (c < 100 || round10(a) || round10(b)) continue;
    const rows = [{ n: a }, { sign: sub ? '-' : '+', n: b }, '-', { n: c }];
    const pz = digitPuzzle(r, rows, sub ? (v) => v[0] - v[1] === v[3] : (v) => v[0] + v[1] === v[3], pickByColumn(hide));
    if (!pz) continue;
    return {
      q: `在 □ 里填上合适的数字：\n${vgridMark(pz.rows)}`,
      answer: pz.answers,
      steps: [`从个位起一列一列看：每一列只缺一个数，用${sub ? '「被减数 = 差 + 减数」「减数 = 被减数 - 差」' : '「加数 = 和 - 另一个加数」'}推出来；注意${sub ? '这一位有没有被借走 1' : '有没有进上来的 1'}`,
        ...(sub ? explainSub(a, b, c, [0, 1, 3], pz.isHid) : explainAdd(a, b, c, [0, 1, 3], pz.isHid)),
        listAns(pz.values)],
      hint: sub ? '从个位看起：哪一位不够减，要向前一位借 1？' : '从个位看起：这一位相加后，有没有进位？',
    };
  }
  throw new Error('genVAddSub 没生成出来');
}
/** 多位数乘一位数竖式填空（三年级） */
export function genVMul1(r) {
  for (let t = 0; t < 50; t++) {
    const a = r.int(r.chance(0.4) ? 23 : 112, r.chance(0.4) ? 98 : 489), d = r.int(3, 9), c = a * d;
    if (round10(a)) continue;
    const rows = [{ n: a }, { sign: '×', n: d }, '-', { n: c }];
    const pz = digitPuzzle(r, rows, (v) => v[0] * v[1] === v[3], (rr, cells) => {
      const n = rr.int(2, 3), inA = cells.filter(([i]) => i === 0), inC = cells.filter(([i]) => i === 3);
      return [...rr.sample(inA, rr.int(1, Math.min(2, n - 1))), ...rr.sample(inC, 1)];
    });
    if (!pz) continue;
    const ex = explainMul1(a, d, c, [0, 3], pz.isHid);
    if (!ex.ok) continue;
    return {
      q: `在 □ 里填上合适的数字：\n${vgridMark(pz.rows)}`,
      answer: pz.answers,
      steps: ['从个位乘起，一位一位推：缺上面的数，就想「几乘 ' + d + '（加上进位）个位才对得上」；缺积，就直接乘出来（别忘了进位）',
        ...ex.lines, vMul(a, d), listAns(pz.values)],
      hint: '先看个位：几乘这个数，积的个位才是这个数？',
    };
  }
  throw new Error('genVMul1 没生成出来');
}
/** 三位数乘两位数竖式填空（带两层部分积，四年级） */
export function genVMul2(r) {
  for (let t = 0; t < 80; t++) {
    const a = r.int(102, 489), b = r.int(12, 49), d1 = b % 10, d2 = Math.floor(b / 10);
    if (round10(a) || !d1 || !d2) continue;
    const p1 = a * d1, p2 = a * d2, c = a * b;
    const rows = [{ n: a }, { sign: '×', n: b }, '-', { n: p1 }, { n: p2, shift: 1 }, '-', { n: c }];
    const pz = digitPuzzle(r, rows, (v) => v[1] % 10 > 0 && v[0] * (v[1] % 10) === v[3] && v[0] * Math.floor(v[1] / 10) === v[4] && v[3] + v[4] * 10 === v[6], pickAny(r.int(3, 4)));
    if (!pz) continue;
    return {
      q: `在 □ 里填上合适的数字：\n${vgridMark(pz.rows)}`,
      answer: pz.answers,
      steps: ['竖式里每一行都是一个算式：第一层是用乘数的个位去乘，第二层是用乘数的十位去乘（末位对着十位），两层加起来是积。哪一行只缺一位，就先从那一行推',
        `用乘数个位上的 ${d1} 去乘：${a} × ${d1} = ${p1}`,
        `用乘数十位上的 ${d2} 去乘：${a} × ${d2} = ${p2}，末位写在十位上（表示 ${p2} 个十）`,
        `两层加起来：${p1} + ${p2}0 = ${c}`, vMul(a, b), listAns(pz.values)],
      hint: '先找只缺一个数字的那一行，想想它是哪两个数相乘得来的',
    };
  }
  throw new Error('genVMul2 没生成出来');
}

// ======================= 填运算符号、添括号 =======================
const OPS = ['+', '-', '×', '÷'];
const show = (t) => t.map(String).join(' ').replace(/\( /g, '(').replace(/ \)/g, ')');
function step(t) {
  const close = t.indexOf(')');
  let lo = 0, hi = t.length;
  if (close >= 0) { lo = t.lastIndexOf('(', close) + 1; hi = close; }
  const seg = t.slice(lo, hi);
  if (seg.length === 1) return [...t.slice(0, lo - 1), seg[0], ...t.slice(hi + 1)];
  let k = seg.findIndex((x) => x === '×' || x === '÷');
  if (k < 0) k = seg.findIndex((x) => x === '+' || x === '-');
  const a = seg[k - 1], b = seg[k + 1], op = seg[k];
  let v;
  if (op === '+') v = a + b;
  else if (op === '-') { v = a - b; if (v < 0) return null; } else if (op === '×') v = a * b;
  else { if (!b || a % b) return null; v = a / b; }
  const nseg = [...seg.slice(0, k - 1), v, ...seg.slice(k + 2)];
  if (close >= 0 && nseg.length === 1) return [...t.slice(0, lo - 1), v, ...t.slice(hi + 1)];
  return [...t.slice(0, lo), ...nseg, ...t.slice(hi)];
}
/** 按「先括号、再乘除、后加减」一步一步算，返回 { value, chain }；中途出现负数或除不尽返回 null */
export function evalChain(tokens) {
  let t = tokens.slice();
  const states = [show(t)];
  while (t.length > 1) {
    t = step(t);
    if (!t) return null;
    const s = show(t);
    if (s !== states[states.length - 1]) states.push(s);
  }
  return { value: t[0], chain: states.join(' = ') };
}
const weave = (nums, ops) => nums.flatMap((n, i) => (i < ops.length ? [n, ops[i]] : [n]));
function allOps(n) { let out = [[]]; for (let i = 0; i < n; i++) out = out.flatMap((o) => OPS.map((x) => [...o, x])); return out; }

/** 填运算符号使等式成立：n 个数，只有一种填法 */
export function genFillOp(r, { n = 3, lo = 1, hi = 9, max = 100 } = {}) {
  for (let t = 0; t < 200; t++) {
    const nums = Array.from({ length: n }, () => r.int(lo, hi));
    const res = allOps(n - 1).map((ops) => ({ ops, e: evalChain(weave(nums, ops)) })).filter((x) => x.e && x.e.value <= max);
    const good = res.filter((x) => x.ops.some((o) => o === '×' || o === '÷') && x.e.value > 0);
    if (!good.length) continue;
    const ans = r.pick(good), target = ans.e.value;
    if (res.filter((x) => x.e.value === target).length !== 1) continue;
    const others = res.filter((x) => x !== ans);
    if (!others.length) continue;
    const other = r.pick(others);
    return {
      q: `在 （ ） 里填上 +、-、×、÷，使等式成立：\n${weave(nums, nums.slice(1).map((_, i) => `{${i}}`)).join(' ')} = ${target}`,
      answer: ans.ops.map((o, i) => ({ kind: 'choice', options: OPS, value: o, label: `第 ${i + 1} 个` })),
      slots: true,
      steps: ['先估一估：要得到的数比这几个数大很多，多半要用 ×；小很多，可能要用 - 或 ÷', '填好后按「先乘除，后加减」算一遍，看等不等于右边', `${ans.e.chain} ✓`, `换一种试试：${other.e.chain}，不等于 ${target}`, `所以依次填 ${ans.ops.join('、')}`],
      hint: '先试试乘号：哪两个数相乘接近右边的数？',
    };
  }
  throw new Error('genFillOp 没生成出来');
}
/** 添括号使等式成立（四则运算） */
export function genParen(r) {
  for (let t = 0; t < 5000; t++) {
    const nums = [r.int(2, 60), r.int(2, 30), r.int(2, 12), r.int(2, 20)];
    const ops = [r.pick(OPS), r.pick(OPS), r.pick(OPS)];
    const base = weave(nums, ops), plain = evalChain(base);
    if (!plain) continue;
    const places = [[0, 3], [2, 5], [4, 7], [0, 5], [2, 7]].map(([i, j]) => { const tk = [...base.slice(0, i), '(', ...base.slice(i, j), ')', ...base.slice(j)]; return { tk, e: evalChain(tk) }; })
      .filter((x) => x.e && x.e.value !== plain.value && x.e.value <= 300);
    const vals = places.map((x) => x.e.value);
    const uniq = places.filter((x) => vals.filter((v) => v === x.e.value).length === 1);
    if (places.length < 3 || !uniq.length) continue;
    const ans = r.pick(uniq), opts = r.sample(places.filter((x) => x !== ans), Math.min(3, places.length - 1));
    if (opts.some((x) => x.e.value === ans.e.value)) continue;
    const wrong = opts[0];
    return {
      q: `添上一组小括号，使等式成立：\n${show(base)} = ${ans.e.value}`,
      answer: [{ kind: 'choice', options: r.shuffle([ans, ...opts].map((x) => show(x.tk))), value: show(ans.tk) }],
      steps: ['括号里的先算。把每种添法都按「先括号、再乘除、后加减」算一算，看哪个等于右边', `不添括号：${plain.chain}，不对`, `${wrong.e.chain}，也不对`, `${ans.e.chain} ✓`, `所以是 ${show(ans.tk)}`],
      hint: '想一想：要先算哪两个数，才能得到右边的数？',
    };
  }
  throw new Error('genParen 没生成出来');
}

// ======================= 简便运算：按步骤填空 =======================
const FRIENDS = [[25, 4], [125, 8], [5, 2], [50, 2], [25, 8], [125, 4], [20, 5], [250, 4]];
/** 两个数凑成整百（或整千）：x + y = T */
function pairTo(r, big) {
  const T = big ? r.pick([200, 300, 500, 1000]) : 100;
  const lo = T >= 500 ? 101 : 11;
  const x = r.until(() => r.int(lo, T - lo), (v) => !round10(v));
  return [x, T - x, T];
}
const other = (r, avoid, lo, hi) => r.until(() => r.int(lo, hi), (z) => !round10(z) && avoid.every((x) => !round10(x + z)));

/** 连加凑整（三个数） */
export function genAddPair(r, { big = false } = {}) {
  const [x, y, T] = pairTo(r, big), z = other(r, [x, y], big ? 101 : 12, big ? 899 : 98);
  if (r.bool()) {
    return {
      q: `用简便方法计算，在 （ ） 里填数：\n${x} + ${z} + ${y} = ${x} + {0} + ${z} = {1} + ${z} = {2}`,
      answer: [num(y), num(T), num(T + z)],
      steps: [`${x} 和 ${y} 能凑成整百：${x} + ${y} = ${T}`, `用加法交换律，把 ${y} 换到 ${z} 前面，先算 ${x} + ${y}`, `${x} + ${z} + ${y} = ${x} + ${y} + ${z} = ${T} + ${z} = ${T + z}`],
      hint: '哪两个数加起来正好是整百？',
    };
  }
  return {
    q: `用简便方法计算，在 （ ） 里填数：\n${z} + ${x} + ${y} = ${z} + (${x} + {0}) = ${z} + {1} = {2}`,
    answer: [num(y), num(T), num(z + T)],
    steps: [`${x} 和 ${y} 能凑成整百：${x} + ${y} = ${T}`, `用加法结合律，给 ${x} + ${y} 加上括号先算`, `${z} + ${x} + ${y} = ${z} + (${x} + ${y}) = ${z} + ${T} = ${z + T}`],
    hint: '后面两个数加起来是整百吗？',
  };
}
/** 四个数两两凑整 */
export function genAddPair4(r) {
  const [[a, c, T1], [b, d, T2]] = r.until(() => [pairTo(r, true), pairTo(r, r.bool())], ([[a, c], [b, d]]) => a !== b && a !== d && !round10(a + b) && !round10(a + d));
  return {
    q: `用简便方法计算，在 （ ） 里填数：\n${a} + ${b} + ${c} + ${d} = (${a} + {0}) + (${b} + {1}) = {2} + {3} = {4}`,
    answer: [num(c), num(d), num(T1), num(T2), num(T1 + T2)],
    steps: [`先找好朋友：${a} + ${c} = ${T1}，${b} + ${d} = ${T2}`, '用加法交换律和结合律，把能凑整的两个数放在一起先加', `${a} + ${b} + ${c} + ${d} = (${a} + ${c}) + (${b} + ${d}) = ${T1} + ${T2} = ${T1 + T2}`],
    hint: '四个数里，哪两个数的个位加起来是 10？',
  };
}
/** 乘法凑整 */
export function genMulPair(r) {
  const [f1, f2] = r.pick(FRIENDS), P = f1 * f2;
  const m = r.until(() => r.int(12, 99), (x) => !round10(x));
  const k = r.int(0, 2);
  if (k === 0) return {
    q: `用简便方法计算，在 （ ） 里填数：\n${f1} × ${m} × ${f2} = ${f1} × {0} × ${m} = {1} × ${m} = {2}`,
    answer: [num(f2), num(P), num(P * m)],
    steps: [`${f1} × ${f2} = ${P}，是好朋友`, `用乘法交换律，把 ${f2} 换到 ${m} 前面，先算 ${f1} × ${f2}`, `${f1} × ${m} × ${f2} = ${f1} × ${f2} × ${m} = ${P} × ${m} = ${P * m}`],
    hint: `${f1} 和谁相乘能得到整十、整百、整千？`,
  };
  if (k === 1) return {
    q: `用简便方法计算，在 （ ） 里填数：\n${m} × ${f1} × ${f2} = ${m} × (${f1} × {0}) = ${m} × {1} = {2}`,
    answer: [num(f2), num(P), num(P * m)],
    steps: [`${f1} × ${f2} = ${P}`, `用乘法结合律，给 ${f1} × ${f2} 加上括号先算`, `${m} × ${f1} × ${f2} = ${m} × (${f1} × ${f2}) = ${m} × ${P} = ${m * P}`],
    hint: '后面两个数相乘是整百、整千吗？',
  };
  return {
    q: `用简便方法计算，在 （ ） 里填数：\n${f2} × ${m} × ${f1} = ${m} × (${f2} × {0}) = ${m} × {1} = {2}`,
    answer: [num(f1), num(P), num(P * m)],
    steps: [`${f2} × ${f1} = ${P}`, `用乘法交换律和结合律：把 ${m} 换到前面，再给 ${f2} × ${f1} 加括号先算`, `${f2} × ${m} × ${f1} = ${m} × (${f2} × ${f1}) = ${m} × ${P} = ${m * P}`],
    hint: '第一个数和最后一个数相乘是多少？',
  };
}
/** 连减、加减混合凑整 */
export function genSubPair(r) {
  const k = r.int(0, 2);
  if (k === 0) {
    const [b, c, T] = pairTo(r, r.bool()), a = r.int(T + 11, T + 899);
    return {
      q: `用简便方法计算，在 （ ） 里填数：\n${a} - ${b} - ${c} = ${a} - (${b} + {0}) = ${a} - {1} = {2}`,
      answer: [num(c), num(T), num(a - T)],
      steps: [`连续减去两个数，等于减去这两个数的和：a - b - c = a - (b + c)`, `${b} + ${c} = ${T}，正好是整百`, `${a} - ${b} - ${c} = ${a} - (${b} + ${c}) = ${a} - ${T} = ${a - T}`],
      hint: '两个减数加起来是多少？',
    };
  }
  if (k === 1) {
    const [a, c, T] = pairTo(r, true), b = r.int(12, Math.min(a - 1, T - 1));
    if (round10(b) || round10(a - b) || round10(b + c)) return genSubPair(r);
    return {
      q: `用简便方法计算，在 （ ） 里填数：\n${a} - ${b} + ${c} = ${a} + {0} - ${b} = {1} - ${b} = {2}`,
      answer: [num(c), num(T), num(T - b)],
      steps: [`${a} 和 ${c} 能凑成 ${T}`, `数可以带着前面的符号「搬家」：+ ${c} 搬到 - ${b} 前面，变成 ${a} + ${c} - ${b}`, `${a} - ${b} + ${c} = ${a} + ${c} - ${b} = ${T} - ${b} = ${T - b}`],
      hint: '哪两个数能凑整？搬家时符号要跟着数走',
    };
  }
  const T = r.pick([100, 200, 300, 400, 500, 600]), b = r.int(T + 11, T + 400), a = b + T, c = r.int(12, T - 12);
  if (round10(c) || round10(b)) return genSubPair(r);
  return {
    q: `用简便方法计算，在 （ ） 里填数：\n${a} - (${b} + ${c}) = ${a} - ${b} - {0} = {1} - ${c} = {2}`,
    answer: [num(c), num(T), num(T - c)],
    steps: ['减去两个数的和，等于连续减去这两个数：a - (b + c) = a - b - c', `${a} - ${b} = ${T}，正好是整百，先算它`, `${a} - (${b} + ${c}) = ${a} - ${b} - ${c} = ${T} - ${c} = ${T - c}`],
    hint: '括号前面是减号：拆开括号后，两个数都要减',
  };
}

const LAWS = ['加法交换律', '加法结合律', '加法交换律和结合律', '乘法交换律', '乘法结合律', '乘法交换律和结合律'];
/** 认运算律 */
export function genLawName(r) {
  const x = r.int(12, 99), y = r.int(12, 99), z = r.int(12, 99), w = r.int(12, 99);
  const add = r.bool(), o = add ? '+' : '×', L = add ? '加法' : '乘法';
  const k = r.int(0, 3);
  const C = [
    [`${x} ${o} ${y} = ${y} ${o} ${x}`, `${L}交换律`, `两个数交换位置，${add ? '和' : '积'}不变`],
    [`(${x} ${o} ${y}) ${o} ${z} = ${x} ${o} (${y} ${o} ${z})`, `${L}结合律`, '数的位置没变，只是先算的两个数变了（括号挪了地方）'],
    [`${x} ${o} ${y} ${o} ${z} ${o} ${w} = (${x} ${o} ${z}) ${o} (${y} ${o} ${w})`, `${L}交换律和结合律`, `${z} 和 ${y} 换了位置（交换律），又加了括号先算（结合律）`],
    [`(${x} ${o} ${y}) ${o} ${z} = ${x} ${o} (${z} ${o} ${y})`, `${L}交换律和结合律`, `括号挪了位置（结合律），${y} 和 ${z} 又换了位置（交换律）`],
  ][k];
  const opts = r.shuffle([C[1], ...LAWS.filter((s) => s !== C[1] && s.startsWith(L)), r.pick(LAWS.filter((s) => !s.startsWith(L)))]);
  return {
    q: `下面的算式运用了什么运算律？\n${C[0]}`,
    answer: [{ kind: 'choice', options: opts, value: C[1] }],
    steps: [`先看是加法还是乘法：这里是${L}`, '再看变了什么：交换律是两个数换位置；结合律是数的位置不变，先算哪两个数变了（括号的位置变了）', C[2], `所以是${C[1]}`],
    hint: '比一比等号两边：是数的位置变了，还是括号的位置变了？',
  };
}
/** 按运算律填数 */
export function genLawFill(r) {
  const x = r.int(12, 99), y = r.int(12, 99), z = r.int(12, 99);
  const [f1, f2] = r.pick(FRIENDS);
  const C = [
    () => [`${x} + ${y} = ${y} + {0}`, [x], '加法交换律：两个数交换位置，和不变'],
    () => [`${x} × ${y} = {0} × ${x}`, [y], '乘法交换律：两个数交换位置，积不变'],
    () => [`(${x} + ${y}) + ${z} = ${x} + ({0} + {1})`, [y, z], '加法结合律：先把后两个数相加，和不变'],
    () => [`(${x} × ${y}) × ${z} = ${x} × ({0} × {1})`, [y, z], '乘法结合律：先把后两个数相乘，积不变'],
    () => [`${f1} × ${x} × ${f2} = ({0} × {1}) × ${x}`, [f1, f2], `乘法交换律和结合律：先把 ${f1} 和 ${f2} 乘起来`],
    () => [`${x} + ${y} + ${z} = ${x} + ({0} + {1})`, [y, z], '加法结合律：先算后两个数'],
  ];
  const [q, vals, why] = r.pick(C)();
  return {
    q: `根据运算律，在 （ ） 里填上合适的数：\n${q}`,
    answer: vals.map((v) => num(v)),
    steps: [why, `所以依次填 ${vals.join('、')}`],
    hint: '等号两边用的数是一样的，只是位置或先算的顺序变了',
  };
}
/** 综合：只写结果，讲解给出过程 */
export function genLawCalc(r) {
  const p = r.pick([() => genAddPair(r, { big: true }), () => genAddPair4(r), () => genMulPair(r), () => genSubPair(r)])();
  const expr = p.q.split('\n')[1].split(' = ')[0];
  const total = p.answer[p.answer.length - 1].value;
  return {
    q: `用简便方法计算：\n${expr} = {0}`,
    answer: [num(total)],
    steps: ['先观察：哪两个数能凑成整十、整百、整千？再选运算律，把它们放在一起先算', ...p.steps],
    hint: p.hint,
  };
}
