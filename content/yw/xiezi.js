// 语文 · 识字写字：看拼音写字、看拼音写词语、听写词语、易错字、听写成语（一~六年级，统编版）
// 字和词都来自课本的写字表、词语表（./data/zibiao.js，拼音按《现代汉语词典》核对过）。
// 讲解里的字形（结构、部件、部首、笔画数、笔顺）只用 zibiao.js 里核对过的；没把握的项不讲。
import { BOOKS, HINT, YICUO, CHENGYU, zixing, isErhua } from './data/zibiao.js';

const ORDER = ['1a', '1b', '2a', '2b', '3a', '3b', '4a', '4b', '5a', '5b', '6a', '6b'];
const TONED = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/;
// 这些字本来就读轻声，提示词里读轻声也可以出
const NEUTRAL_OK = new Set([...'们么了的着吗呢吧啊啦嘛']);
const len = (s) => [...s].length;

// ---------- 索引：每个字在哪些词里、读什么 ----------
const ALLW = [];
ORDER.forEach((k, bi) => BOOKS[k].forEach((L) => L.words.forEach(([w, py]) => ALLW.push({ w, py, bi }))));
const IDX = new Map();
for (const e of ALLW) {
  if (isErhua(e.w, e.py)) continue;
  const syl = e.py.split(' ');
  [...e.w].forEach((c, i) => {
    if (!TONED.test(syl[i]) && !NEUTRAL_OK.has(c)) return;
    if (!IDX.has(c)) IDX.set(c, []);
    const arr = IDX.get(c);
    if (!arr.some((x) => x.w === e.w)) arr.push({ w: e.w, py: e.py, i, bi: e.bi });
  });
}
// 同音（拼音、声调都一样）的词：看拼音、听写都分不清，不出
const PYW = new Map();
for (const e of ALLW) { if (!PYW.has(e.py)) PYW.set(e.py, new Set()); PYW.get(e.py).add(e.w); }
for (const arr of Object.values(HINT)) for (const [w, py] of arr) { if (!PYW.has(py)) PYW.set(py, new Set()); PYW.get(py).add(w); }
const unique = (w, py) => PYW.get(py).size === 1;

/** 给「看拼音写字」找提示词：先用本册词语，没有就用补的提示词，再没有就用离本册最近的其他册的词 */
// 「爸爸」「星星」这种只由要写的字组成的词提示不了什么，有别的词时不用
const selfOnly = (e, c) => [...e.w].every((x) => x === c);
function contexts(c, bi) {
  const all = IDX.get(c) || [];
  const h = (HINT[c] || []).map(([w, py]) => ({ w, py, i: [...w].indexOf(c) }));
  const own = all.filter((e) => e.bi === bi);
  const ownGood = own.filter((e) => !selfOnly(e, c));
  if (ownGood.length) return ownGood.slice(0, 4);
  if (h.length) return h;
  // 其他册的词：两个字的词优先，再先用以前学过的，最后才用后面册的
  const rest = all.filter((e) => e.bi !== bi && !selfOnly(e, c)).sort((a, b) =>
    (len(a.w) > 2) - (len(b.w) > 2) || (a.bi > bi) - (b.bi > bi) || Math.abs(a.bi - bi) - Math.abs(b.bi - bi));
  const short = rest.filter((e) => len(e.w) <= 2);
  // 离本册太远（四册以上）的词，读音、意思孩子多半没见过，近的有就只用近的
  const near = short.filter((e) => Math.abs(e.bi - bi) <= 4);
  if (near.length) return near.slice(0, 3);
  if (short.length) return short.slice(0, 3);
  // 只剩后面几册的长词（成语等）时，本册有「娃娃」这种词就用本册的
  if (own.length && rest.every((e) => e.bi > bi)) return own;
  return rest.slice(0, 3);
}

// ---------- 讲解用的字形描述 ----------
const SHOW = (p) => (p === '⺮' ? '竹字头' : `「${p}」`);
function partsText(st, parts) {
  const [a, b, c] = parts.map(SHOW);
  if (st === '左右') return `左边${a}，右边${b}`;
  if (st === '上下') return `上面${a}，下面${b}`;
  if (st === '左中右') return `左${a}、中${b}、右${c}`;
  if (st === '上中下') return `上${a}、中${b}、下${c}`;
  if (st === '全包围' || st === '半包围') return `外面${a}，里面${b}`;
  return '';
}
/** 「河」是左右结构：左边「氵」，右边「可」，部首是「氵」，共 8 画。一年级不讲结构、部首这些名称 */
function shape(c, g) {
  const z = zixing(c);
  if (!z) return '';
  const bits = [];
  if (g === 1) {
    if (z.parts && z.st !== '独体') bits.push(partsText(z.st, z.parts));
  } else {
    if (z.st === '独体') bits.push('是独体字');
    else if (z.st) bits.push(`是${z.st}结构${z.parts ? '：' + partsText(z.st, z.parts) : ''}`);
    if (z.bs) bits.push(`部首是${SHOW(z.bs)}`);
  }
  bits.push(`共 ${z.n} 画`);
  return `「${c}」${bits.join('，')}。`;
}
const orderLine = (c) => { const z = zixing(c); return z && z.order ? `笔顺：${z.order}。` : ''; };
// 易错提醒：本册和以前各册整理过的
function yicuoTip(c, bi) {
  for (let j = bi; j >= 0; j--) { const it = (YICUO[ORDER[j]] || []).find(([x]) => x === c); if (it) return it[1]; }
  return '';
}

/** 题干里的提示词：要写的字换成 ~；一二年级给其他字注音 */
function ctxText(e, c, g) {
  const syl = e.py.split(' ');
  return [...e.w].map((ch, j) => (ch === c ? '~' : g <= 2 ? `[[${ch}|${syl[j]}]]` : ch)).join('');
}
const plainCtx = (e, c) => [...e.w].map((ch) => (ch === c ? '~' : ch)).join('');

// ---------- 题型 ----------
const skills = [];
ORDER.forEach((k, bi) => {
  const g = +k[0], term = k[1] === 'a' ? 1 : 2;
  const pre = `y${k}-xie-`;
  const base = { subject: 'yw', grade: g, term, unit: '识字写字' };
  const chars = [...new Set(BOOKS[k].map((L) => L.chars).join(''))];

  // 看拼音写字
  const ZI = chars.map((c) => ({ c, ctx: contexts(c, bi) })).filter((x) => x.ctx.length);
  const nZi = ZI.reduce((a, x) => a + x.ctx.length, 0);
  skills.push({
    ...base, id: pre + 'zi', name: '看拼音写字', level: 1,
    tip: '先拼读音节，再看括号里的词想想是哪个字，最后按笔顺一笔一笔写',
    ...(nZi < 25 ? { pool: nZi } : {}),
    gen(r) {
      const { c, ctx } = r.pick(ZI);
      const e = r.pick(ctx);
      const syl = e.py.split(' ')[e.i];
      const steps = [`拼一拼：${syl}。「${plainCtx(e, c)}」是「${e.w}」，要写的是「${c}」。`];
      const s = shape(c, g); if (s) steps.push(s);
      const o = orderLine(c); if (o) steps.push(o);
      const t = yicuoTip(c, bi); if (t) steps.push(`注意：${t}`);
      if (steps.length < 2) steps.push('写完对照一遍，看看有没有多一笔、少一笔。');
      return { q: `**${syl}**（${ctxText(e, c, g)}）`, answer: [{ kind: 'hanzi', value: c }], steps };
    },
  });

  if (k === '1a') return; // 一年级上册只出看拼音写字

  // 词语：这一册的词，去掉儿化词（只听写）和同音词
  const WORDS = BOOKS[k].flatMap((L) => L.words).filter(([w, py]) => unique(w, py));
  const PYWORDS = WORDS.filter(([w, py]) => !isErhua(w, py));
  const own = new Set(chars);
  /** 词语题的讲解：拼音一行，再挑词里两个本册的生字讲字形（易错字优先） */
  function wordSteps(w, py, first) {
    const steps = [first];
    // 先讲本册的生字；词里没有本册生字（复习以前的词、成语）就讲以前学过的字
    let cs = [...new Set([...w])].filter((c) => own.has(c) && zixing(c));
    if (!cs.length) cs = [...new Set([...w])].filter((c) => zixing(c) && (yicuoTip(c, bi) || zixing(c).n >= 6));
    // 易错字先讲，再讲笔画多的
    cs.sort((a, b) => (yicuoTip(b, bi) ? 1 : 0) - (yicuoTip(a, bi) ? 1 : 0) || zixing(b).n - zixing(a).n);
    for (const c of cs.slice(0, 2)) {
      const t = yicuoTip(c, bi);
      steps.push(t ? `「${c}」${t}` : shape(c, g));
    }
    if (steps.length < 2) steps.push('一个字一个字按笔顺写，写完对照一遍有没有多笔、少笔。');
    return steps;
  }

  // 看拼音写词语
  skills.push({
    ...base, id: pre + 'ci', name: '看拼音写词语', level: 2,
    tip: '先拼读整个词，想想是哪个词，再一个字一个字按笔顺写',
    ...(PYWORDS.length < 25 ? { pool: PYWORDS.length } : {}),
    gen(r) {
      const [w, py] = r.pick(PYWORDS);
      return { q: `**${py}**`, answer: [{ kind: 'hanzi', value: w }], steps: wordSteps(w, py, `拼一拼：${py}，是「${w}」。`) };
    },
  });

  // 听写词语
  skills.push({
    ...base, id: pre + 'tingxie', name: '听写词语', level: 2,
    tip: '听清楚是哪个词，想想每个字的样子，再一笔一笔写',
    ...(WORDS.length < 25 ? { pool: WORDS.length } : {}),
    gen(r) {
      const [w, py] = r.pick(WORDS);
      const stems = [`听写：听一听，写出词语（${len(w)} 个字）`, `听写（${len(w)} 个字）`];
      const q = stems.find((s) => !s.includes(w)) || `（${len(w)} 个字）`;
      const first = isErhua(w, py) ? `听到的是「${w}」。` : `听到的是「${w}」（${py}）。`;
      return { q, say: w, answer: [{ kind: 'hanzi', value: w }], steps: wordSteps(w, py, first) };
    },
  });

  // 易错字（二年级起）
  if (g >= 2 && YICUO[k]) {
    const YC = YICUO[k].map(([c, tip]) => ({ c, tip, ctx: contexts(c, bi) })).filter((x) => x.ctx.length);
    const nYc = YC.reduce((a, x) => a + x.ctx.length, 0);
    skills.push({
      ...base, id: pre + 'yicuo', name: '易错字', level: 3,
      tip: '写之前先想想这个字容易错在哪：多一笔、少一笔，还是写成了长得像的字',
      ...(nYc < 25 ? { pool: nYc } : {}),
      gen(r) {
        const { c, tip, ctx } = r.pick(YC);
        const e = r.pick(ctx);
        const syl = e.py.split(' ')[e.i];
        const steps = [`拼一拼：${syl}。「${plainCtx(e, c)}」是「${e.w}」，要写的是「${c}」。`, `容易错的地方：${tip}`];
        const s = shape(c, g); if (s) steps.push(s);
        const o = orderLine(c); if (o) steps.push(o);
        const note = '这个字容易写错，写之前先想一想。';
        const q = `**${syl}**（${ctxText(e, c, g)}）` + (note.includes(c) ? '' : `\n${note}`);
        return { q, answer: [{ kind: 'hanzi', value: c }], steps };
      },
    });
  }

  // 听写成语（五、六年级）：本册的为主，也复习前面几册的
  if (CHENGYU[k]) {
    const mine = CHENGYU[k];
    const before = ORDER.slice(0, bi).flatMap((x) => CHENGYU[x] || []).filter((w) => !mine.includes(w));
    const PY = new Map(); for (const e of ALLW) if (!PY.has(e.w)) PY.set(e.w, e.py);
    const total = mine.length + before.length;
    skills.push({
      ...base, id: pre + 'chengyu', name: '听写成语', level: 3,
      tip: '成语是固定的四个字，想想它的意思，一个字也不能换、不能少',
      ...(total < 25 ? { pool: total } : {}),
      gen(r) {
        const w = before.length && r.chance(0.3) ? r.pick(before) : r.pick(mine);
        const py = PY.get(w);
        return { q: '听写成语：听一听，写出这个成语', say: w, answer: [{ kind: 'hanzi', value: w }], steps: wordSteps(w, py, `听到的是「${w}」（${py}）。`) };
      },
    });
  }
});

export default skills;
