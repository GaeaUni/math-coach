// 词语积累（一）：近义词、反义词、近义词辨析（选词填空）、词语的褒贬色彩。
// 词对按册放在 data/ci-jf-pairs-*.js，同一册的近义词题和反义词题共用一组词条。
import { PAIRS_LOW, CLASH_LOW } from './data/ci-jf-pairs-low.js';
import { PAIRS_MID, CLASH_MID } from './data/ci-jf-pairs-mid.js';
import { PAIRS_HIGH, CLASH_HIGH } from './data/ci-jf-pairs-high.js';
import { XUANCI } from './data/ci-jf-xuanci.js';
import { BAOBIAN } from './data/ci-jf-baobian.js';

const UNIT = '词语积累';
const Q = (w) => `「${w}」`;
const len = (w) => [...w].length;
const shares = (a, b) => [...a].find((c) => b.includes(c));

// ---------- 词对 ----------
// 一条：'词性|近义词组|反义词组|前一组的意思|后一组的意思|形似干扰词:意思;…'
// 同一组里的词互为近义词，两组之间互为反义词。词性 c 表示一年级的简单字词：意思一栏写例子，不写解释。
function parseEntry(line, book) {
  const [pos, s, f, ms, mf, x] = line.split('|').map((t) => (t || '').trim());
  const words = (t) => (t ? t.split(/\s+/) : []);
  return {
    book, pos,
    sides: [{ w: words(s), m: ms }, { w: words(f), m: mf }],
    x: x ? x.split(';').map((t) => { const [w, m] = t.split(':'); return { w: w.trim(), m: m.trim() }; }) : [],
  };
}
const PAIRS = { ...PAIRS_LOW, ...PAIRS_MID, ...PAIRS_HIGH };
const BOOK = {};
for (const [b, lines] of Object.entries(PAIRS)) BOOK[b] = lines.map((l) => parseEntry(l, b));
const ENTRIES = Object.values(BOOK).flat();

// 全库的近义、反义关系：随机干扰词不能和题目词、答案有任何一种关系
const up = new Map();
const find = (w) => { let p = w; while (up.has(p) && up.get(p) !== p) p = up.get(p); return p; };
for (const e of ENTRIES) for (const sd of e.sides) for (const w of sd.w) {
  if (!up.has(w)) up.set(w, w);
  const a = find(sd.w[0]), b = find(w);
  if (a !== b) up.set(b, a);
}
const ANT = new Set();
for (const e of ENTRIES) if (e.sides[0].w.length && e.sides[1].w.length) {
  const a = find(e.sides[0].w[0]), b = find(e.sides[1].w[0]);
  ANT.add(`${a}|${b}`); ANT.add(`${b}|${a}`);
}
// 意思沾边、却不算标准近反义词的词：也不能一个当题目、一个当随机干扰项
for (const t of [...CLASH_LOW, ...CLASH_MID, ...CLASH_HIGH]) {
  const [a, b] = t.split(/\s+/).map(find);
  ANT.add(`${a}|${b}`); ANT.add(`${b}|${a}`);
}
const related = (a, b) => find(a) === find(b) || ANT.has(`${find(a)}|${find(b)}`);

function jinItems(pool) {
  const out = [];
  for (const e of pool) e.sides.forEach((sd, si) => {
    if (sd.w.length >= 2) for (const x of sd.w) for (const y of sd.w) if (x !== y) out.push({ e, si, x, y });
  });
  return out;
}
function fanItems(pool) {
  const out = [];
  for (const e of pool) if (e.sides[0].w.length && e.sides[1].w.length) {
    for (const si of [0, 1]) for (const x of e.sides[si].w) for (const y of e.sides[1 - si].w) out.push({ e, si, x, y });
  }
  return out;
}

// 别的词条里的词当干扰项：和题目词、答案都没有近反义关系，不共用字（共用字的词常常意思也近），优先同词性、同字数
function randomOthers(r, pool, it, k, used) {
  const seen = new Set(used);
  const cand = [];
  for (const o of pool) if (o !== it.e) for (const sd of o.sides) for (const w of sd.w) {
    if (seen.has(w) || related(w, it.x) || related(w, it.y)) continue;
    if (it.e.pos !== 'c' && (shares(w, it.x) || shares(w, it.y))) continue;
    seen.add(w);
    cand.push({ w, m: sd.m, e: o });
  }
  // 每个词条最多取一个词，免得两个干扰项互为近义词、一眼就能排除
  const out = [], usedE = new Set();
  const tiers = [cand.filter((c) => c.e.pos === it.e.pos && len(c.w) === len(it.y)), cand.filter((c) => len(c.w) === len(it.y)), cand];
  // 干扰项之间也不共用字（「贫困」「贫乏」并排出现，像在提示答案不是它们）
  const taken = used.filter((w) => w !== it.x && w !== it.y);
  for (const tier of tiers) for (const c of r.shuffle(tier)) {
    if (out.length >= k) return out;
    if (usedE.has(c.e) || taken.some((w) => shares(c.w, w))) continue;
    usedE.add(c.e); out.push(c); taken.push(c.w);
  }
  return out;
}
// 形似干扰词：和题目词或答案有一个字相同、意思却不一样
function lookAlikes(it) {
  return it.e.x.filter((l) => l.w !== it.x && l.w !== it.y && !related(l.w, it.x) && (shares(l.w, it.x) || shares(l.w, it.y)));
}
function lookLine(l, it) {
  const c = shares(l.w, it.x);
  if (c) return `${Q(l.w)}虽然也有「${c}」字，但它表示${l.m}，意思不一样`;
  return `${Q(l.w)}和${Q(it.y)}有一个字相同，可${Q(l.w)}表示${l.m}，意思不对`;
}
const eg = (e) => e.pos === 'c';

function wordQuestion(r, pool, it, kind, nOpt) {
  const e = it.e, me = e.sides[it.si], other = e.sides[1 - it.si];
  const opts = [it.y];
  const steps = [eg(e) ? `先想${Q(it.x)}，比如：${me.m}` : `先想${Q(it.x)}的意思：${me.m}`];
  if (kind === 'jin') steps.push(eg(e) ? `${Q(it.y)}也是这个意思，比如：${me.m}` : `${Q(it.y)}也表示${me.m}，意思相近，是近义词`);
  else steps.push(eg(e) ? `反过来说：${other.m}，就是${Q(it.y)}` : `意思反过来是：${other.m}，就是${Q(it.y)}`);
  // 最容易选错的一项：近义词题放一个反义词，反义词题放一个近义词
  let trap = null;
  const opp = kind === 'jin' ? other.w : me.w.filter((w) => w !== it.x);
  if (opp.length) {
    const t = r.pick(opp);
    opts.push(t);
    trap = kind === 'jin'
      ? `${Q(t)}表示${other.m}，和${Q(it.x)}意思相反，是反义词，不能选`
      : `${Q(t)}${eg(e) ? '' : `也表示${me.m}，`}和${Q(it.x)}意思相近，是近义词，不是反义词`;
  }
  const looks = lookAlikes(it);
  if (looks.length && opts.length < nOpt) {
    const l = r.pick(looks);
    opts.push(l.w);
    if (!trap) trap = lookLine(l, it);
  }
  const rest = randomOthers(r, pool, it, nOpt - opts.length, opts.concat(it.x));
  for (const d of rest) opts.push(d.w);
  if (!trap) {
    const d = rest[0];
    trap = eg(e) || eg(d.e)
      ? `${Q(d.w)}和${Q(it.x)}${kind === 'jin' ? '意思不一样' : '不是意思相反的一对'}`
      : `${Q(d.w)}表示${d.m}，${kind === 'jin' ? '意思不一样' : `和${Q(it.x)}说的不是一回事`}`;
  }
  steps.push(trap, `所以选${Q(it.y)}`);
  return {
    q: `${Q(it.x)}的${kind === 'jin' ? '近义词' : '反义词'}是哪一个？`,
    answer: [{ kind: 'choice', options: r.shuffle(opts), value: it.y }],
    steps,
    hint: kind === 'jin' ? `${Q(it.x)}是什么意思？哪个词也是这个意思？` : `${Q(it.x)}是什么意思？意思反过来是哪个词？`,
  };
}

// 「下面哪一组是近义词 / 反义词」：干扰组都取自词条本身的关系，不会碰巧也对
function pairQuestion(r, pool, it, kind) {
  const e = it.e, me = e.sides[it.si], other = e.sides[1 - it.si];
  const right = `${it.x}—${it.y}`;
  const opts = [right];
  const notes = [];
  const opp = kind === 'jin' ? other.w : me.w.filter((w) => w !== it.x);
  if (opp.length) {
    const t = r.pick(opp);
    opts.push(`${it.x}—${t}`);
    notes.push(kind === 'jin' ? `${Q(it.x)}和${Q(t)}意思相反，是反义词` : `${Q(it.x)}和${Q(t)}意思相近，是近义词，不是反义词`);
  }
  const looks = lookAlikes(it).filter((l) => shares(l.w, it.x));
  if (looks.length) {
    const l = r.pick(looks);
    opts.push(`${it.x}—${l.w}`);
    if (!notes.length) notes.push(`${Q(it.x)}和${Q(l.w)}只是有一个字相同，${Q(l.w)}表示${l.m}，意思不一样`);
  }
  const src = r.shuffle(pool.filter((o) => o !== e));
  for (const o of src) {
    if (opts.length >= 4) break;
    const p = kind === 'jin'
      ? (o.sides[0].w.length && o.sides[1].w.length ? [r.pick(o.sides[0].w), r.pick(o.sides[1].w)] : null)
      : (o.sides.find((sd) => sd.w.length >= 2) ? r.sample(o.sides.find((sd) => sd.w.length >= 2).w, 2) : null);
    if (!p || p.some((w) => opts.some((s) => s.split('—').includes(w)))) continue;
    if (r.bool()) p.reverse();
    opts.push(p.join('—'));
    if (!notes.length) notes.push(kind === 'jin' ? `${Q(p[0])}和${Q(p[1])}意思相反，是反义词` : `${Q(p[0])}和${Q(p[1])}意思相近，是近义词`);
  }
  const head = kind === 'jin' ? '近义词是意思相同或相近的两个词，一组一组比一比意思' : '反义词是意思相反的两个词，一组一组比一比意思';
  const mid = kind === 'jin'
    ? (eg(e) ? `${Q(it.x)}和${Q(it.y)}意思相近，比如：${me.m}` : `${Q(it.x)}和${Q(it.y)}都表示${me.m}，是近义词`)
    : (eg(e) ? `${Q(it.x)}和${Q(it.y)}意思相反：${me.m}—${other.m}` : `${Q(it.x)}表示${me.m}，${Q(it.y)}表示${other.m}，意思相反`);
  return {
    q: `下面哪一组词是${kind === 'jin' ? '近义词' : '反义词'}？`,
    answer: [{ kind: 'choice', options: r.shuffle(opts), value: right }],
    steps: [head, mid, ...notes, `所以选「${right}」`],
    hint: kind === 'jin' ? '每组的两个词意思一样吗？' : '每组的两个词意思是不是正好相反？',
  };
}

function jfSkill(kind, book, name, level, opt = {}) {
  const grade = +book[0], term = book[1] === 'a' ? 1 : 2;
  const pool = BOOK[book];
  const items = kind === 'jin' ? jinItems(pool) : fanItems(pool);
  const nOpt = opt.nOpt || 4;
  const pairP = opt.pair ?? 0.25;
  return {
    id: `y${book}-ci-${kind}`, subject: 'yw', grade, term, unit: UNIT, name, level,
    tip: kind === 'jin' ? '近义词：先想这个词的意思，再找意思相同或相近的词' : '反义词：先想这个词的意思，再找意思正好相反的词',
    ...(opt.pool ? { pool: opt.pool } : {}),
    gen(r) {
      const it = r.pick(items);
      if (pairP && r.chance(pairP)) return pairQuestion(r, pool, it, kind);
      return wordQuestion(r, pool, it, kind, nOpt);
    },
  };
}

// ---------- 近义词辨析：选词填空 ----------
const XK = {
  意思: '意思相近，但说的不完全一样，要比一比区别',
  搭配: '意思相近，要比一比它们常和哪些词搭配',
  轻重: '意思相近，要比一比意思的轻重',
  范围: '意思相近，要比一比说的范围大小',
  用法: '意思相近，要看它们在句子里的用法',
  对象: '意思相近，要看说的是对谁',
  形近: '字形相近，要看清意思和用法',
};
const blank = (text) => text.replace(/\{.+?\}/, '{0}');
const filled = (text) => text.match(/\{(.+?)\}/)[1];
function xuanciSkill(book, name, level) {
  const items = XUANCI.filter((x) => x.b === book).flatMap((set) => set.s.map(([text, why]) => ({ set, text, why, a: filled(text) })));
  for (const it of items) if (!it.set.w.includes(it.a)) throw new Error(`选词填空答案不在选项里：${it.text}`);
  return {
    id: `y${book}-ci-xuanci`, subject: 'yw', grade: +book[0], term: book[1] === 'a' ? 1 : 2, unit: UNIT, name, level,
    tip: '选词填空：近义词比一比轻重、范围、搭配，再放回句子读一读',
    gen(r) {
      const it = r.pick(items);
      const { w, m, k } = it.set;
      return {
        q: `选词填空：\n${blank(it.text)}`,
        answer: [{ kind: 'choice', options: r.shuffle(w), value: it.a }],
        steps: [`${w.map(Q).join('')}${XK[k]}`, ...w.map((x, i) => `${Q(x)}：${m[i]}`), `放回句子读一读：${it.why}，所以填${Q(it.a)}`],
        hint: '把每个词放进句子里读一读，哪个最合适？',
      };
    },
  };
}

// ---------- 词语的褒贬色彩 ----------
const BB_METHOD = '看词带的感情：带着称赞、喜爱的是褒义词，带着批评、讨厌的是贬义词';
const feel = (x) => (x.bao ? '带着称赞、喜爱的感情，是褒义词' : '带着批评、讨厌的感情，是贬义词');
function baobianSkill(book, name, level) {
  const d = BAOBIAN[book];
  const words = [...d.bao.map(([w, m]) => ({ w, m, bao: true })), ...d.bian.map(([w, m]) => ({ w, m, bao: false }))];
  const pairItems = d.pairs.flatMap((p) => p.s.map(([text, why]) => ({ p, text, why, a: filled(text) })));
  for (const it of pairItems) if (!it.p.w.includes(it.a)) throw new Error(`褒贬填空答案不在选项里：${it.text}`);
  return {
    id: `y${book}-ci-baobian`, subject: 'yw', grade: +book[0], term: book[1] === 'a' ? 1 : 2, unit: UNIT, name, level,
    tip: '褒贬看感情：带着称赞、喜爱的是褒义词，带着批评、讨厌的是贬义词',
    gen(r) {
      const t = r.next();
      if (t < 0.35) {
        const x = r.pick(words);
        return {
          q: `${Q(x.w)}是褒义词还是贬义词？`,
          answer: [{ kind: 'choice', options: ['褒义词', '贬义词'], value: x.bao ? '褒义词' : '贬义词' }],
          steps: [BB_METHOD, `${Q(x.w)}：${x.m}`, `这个词${feel(x)}`],
          hint: `${Q(x.w)}是在夸人、说好事，还是在批评人、说坏事？`,
        };
      }
      if (t < 0.7) {
        const bao = r.bool();
        const x = r.pick(words.filter((y) => y.bao === bao));
        const others = r.sample(words.filter((y) => y.bao !== bao), 3);
        return {
          q: `下面哪个词是${bao ? '褒义词' : '贬义词'}？`,
          answer: [{ kind: 'choice', options: r.shuffle([x.w, ...others.map((y) => y.w)]), value: x.w }],
          steps: [BB_METHOD, `${Q(x.w)}：${x.m}，${feel(x)}`, `${Q(others[0].w)}：${others[0].m}，${feel(others[0])}`, `所以选${Q(x.w)}`],
          hint: '一个一个想：这个词是在夸，还是在批评？',
        };
      }
      const it = r.pick(pairItems);
      const [b, p] = it.p.w;
      return {
        q: `根据句子的感情选词填空：\n${blank(it.text)}`,
        answer: [{ kind: 'choice', options: r.shuffle(it.p.w), value: it.a }],
        steps: [`${Q(b)}和${Q(p)}意思相近，感情色彩不同`, `${Q(b)}：${it.p.m[0]}，是褒义词`, `${Q(p)}：${it.p.m[1]}，是贬义词`, `看句子的感情：${it.why}，所以填${Q(it.a)}`],
        hint: '这句话是在夸，还是在批评？',
      };
    },
  };
}

export default [
  // 一年级
  jfSkill('fan', '1a', '反义词对一对', 1, { nOpt: 3, pair: 0, pool: 36 }),
  jfSkill('fan', '1b', '反义词找一找', 1, { nOpt: 3, pair: 0.15 }),
  jfSkill('jin', '1b', '近义词找朋友', 1, { nOpt: 3, pair: 0.15 }),
  // 二年级
  jfSkill('jin', '2a', '近义词（二上）', 1),
  jfSkill('fan', '2a', '反义词（二上）', 1),
  jfSkill('jin', '2b', '近义词（二下）', 1),
  jfSkill('fan', '2b', '反义词（二下）', 1),
  // 三年级
  jfSkill('jin', '3a', '近义词（三上）', 2),
  jfSkill('fan', '3a', '反义词（三上）', 2),
  xuanciSkill('3a', '近义词选词填空', 2),
  jfSkill('jin', '3b', '近义词（三下）', 2),
  jfSkill('fan', '3b', '反义词（三下）', 2),
  // 四年级
  jfSkill('jin', '4a', '近义词（四上）', 2),
  jfSkill('fan', '4a', '反义词（四上）', 2),
  xuanciSkill('4a', '选词填空（四上）', 2),
  jfSkill('jin', '4b', '近义词（四下）', 2),
  jfSkill('fan', '4b', '反义词（四下）', 2),
  baobianSkill('4b', '褒义词和贬义词', 2),
  // 五年级
  jfSkill('jin', '5a', '近义词（五上）', 2),
  jfSkill('fan', '5a', '反义词（五上）', 2),
  xuanciSkill('5a', '选词填空（五上）', 3),
  jfSkill('jin', '5b', '近义词（五下）', 3),
  jfSkill('fan', '5b', '反义词（五下）', 3),
  baobianSkill('5b', '褒贬色彩（五下）', 3),
  // 六年级
  jfSkill('jin', '6a', '近义词（六上）', 3),
  jfSkill('fan', '6a', '反义词（六上）', 3),
  xuanciSkill('6a', '选词填空（六上）', 3),
  jfSkill('jin', '6b', '近义词（六下）', 3),
  jfSkill('fan', '6b', '反义词（六下）', 3),
  baobianSkill('6b', '褒贬色彩（六下）', 3),
];
