// 词语积累：量词填空、词语搭配、词语的形式（ABB / AABB / ABAB / ABAC …）、词语归类。
import { BOOKS } from './data/zibiao.js';
import { PY } from './data/ci-dp-py.js';
import { LIANG, L1, L2, L3 } from './data/ci-dp-liang.js';
import { D1, D2, D3, D4 } from './data/ci-dp-dapei.js';
import { XING, TO_AABB, TO_ABAB_ADJ, TO_ABAB_VERB } from './data/ci-dp-xing.js';
import { G1A, G1B, G2A, G3A, G4A, G5A } from './data/ci-dp-gui.js';

const UNIT = '词语积累';
const q = (arr) => arr.map((x) => `「${x}」`).join('');

// ---------- 注音：一二年级把这一册还没学会写的字注上拼音 ----------
const ORDER = ['1a', '1b', '2a', '2b'];
const KNOWN = {};
for (let i = 0; i < ORDER.length; i++) {
  const s = new Set(i ? KNOWN[ORDER[i - 1]] : []);
  for (const l of BOOKS[ORDER[i]]) for (const c of l.chars) s.add(c);
  KNOWN[ORDER[i]] = s;
}
/** 给词语里没学过的字注音（book 为空时不注音） */
function zhu(w, book) {
  if (!book) return w;
  const known = KNOWN[book];
  const cs = [...w];
  if (cs.every((c) => known.has(c) || !/\p{Script=Han}/u.test(c))) return w;
  const py = PY[w];
  if (!py) throw new Error(`缺拼音：${w}`);
  const ps = py.split(' ');
  if (ps.length !== cs.length) throw new Error(`拼音音节数不对：${w} ${py}`);
  let out = '', run = '', rp = [];
  const flush = () => { if (run) out += `[[${run}|${rp.join(' ')}]]`; run = ''; rp = []; };
  cs.forEach((c, i) => { if (known.has(c)) { flush(); out += c; } else { run += c; rp.push(ps[i]); } });
  flush();
  return out;
}

// ---------- 量词 ----------
const lu = (m) => {
  const x = LIANG[m];
  if (!x) throw new Error(`LIANG 缺：${m}`);
  return x;
};
function liangSkill(id, grade, term, name, level, list, book) {
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level,
    tip: '量词跟着事物的样子走：长条的用条，有把手的用把，平平的用张',
    gen(r) {
      const [n, a, ds, why] = r.pick(list);
      const all = [...ds], d = all[0];
      const others = r.sample(all.slice(1), Math.min(2, all.length - 1));
      const opts = r.shuffle([a, d, ...others]);
      return {
        q: `填上合适的量词：\n一{0}${zhu(n, book)}`,
        answer: [{ kind: 'choice', options: opts.map((x) => zhu(x, book)), value: zhu(a, book) }],
        steps: [
          `量词跟着事物的样子走：先想想「${n}」是什么样的，平时怎么说`,
          `「${a}」用来数${lu(a)[0]}${why ? `，「${n}」${why}` : ''}：一${a}${n}`,
          `「${d}」用来数${lu(d)[0]}，比如${lu(d)[1]}；不说「一${d}${n}」`,
          ...(others.length ? [`${q(others)}也不对：没有${others.map((x) => `「一${x}${n}」`).join('')}的说法`] : []),
          `所以填「${a}」：一${a}${n}`,
        ],
        hint: `想一想：「${n}」是什么样子的？平时我们说「一什么${n}」？`,
      };
    },
  };
}

/** 量词用错的一项：三个对的 + 一个用错的 */
function liangCuoSkill(id, grade, term, name, level, list, book) {
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level,
    tip: '量词跟着事物的样子走：一个一个读，想想平时是不是这样说',
    gen(r) {
      const picks = r.sample(list, 4);
      const [bad, ...good] = picks;
      const [n, a, ds] = bad;
      const d = r.pick([...ds]);
      const wrong = `一${d}${n}`;
      const show = (m, x) => `一${zhu(m, book)}${zhu(x, book)}`;
      const W = show(d, n);
      return {
        q: '下面量词用得不对的一项是：',
        answer: [{ kind: 'choice', options: r.shuffle([W, ...good.map(([gn, ga]) => show(ga, gn))]), value: W }],
        steps: [
          '量词跟着事物的样子走：一个一个读，想想事物是什么样的',
          `「${n}」应该用「${a}」：一${a}${n}。「${d}」用来数${lu(d)[0]}，比如${lu(d)[1]}`,
          `其他三个都对：${good.map(([gn, ga]) => `一${ga}${gn}`).join('、')}`,
          `所以用错的是「${wrong}」`,
        ],
        hint: '每个都读一读：这个东西是长长的、平平的，还是有把手的？',
      };
    },
  };
}

// ---------- 词语搭配 ----------
const ph = (t, w) => t.replace('{0}', w);
/** 每个词常见的搭配（讲干扰项用）：取它在题库里第一次做答案的短语 */
const EX = {};
for (const [t, a] of [...D1, ...D2, ...D3, ...D4]) if (!EX[a]) EX[a] = ph(t, a);
const ex = (w) => {
  if (!EX[w]) throw new Error(`EX 缺：${w}`);
  return EX[w];
};
/** 题干里的短语：事物部分注音 */
function tplShow(t, book) {
  const m = t.match(/^\{0\}(的?)(.+)$/);
  return `{0}${m[1]}${zhu(m[2], book)}`;
}
const dedupT = (list) => list.filter((x, i, a) => a.findIndex((y) => y[0] === x[0]) === i);
function dapeiSkill(id, grade, term, name, level, tip, method, list, book) {
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level, tip,
    gen(r) {
      const [t, a, ds] = r.pick(list);
      const d = ds[0], others = r.sample(ds.slice(1), 2);
      const opts = r.shuffle([a, d, ...others]);
      return {
        q: `选词填空：\n${tplShow(t, book)}`,
        answer: [{ kind: 'choice', options: opts.map((x) => zhu(x, book)), value: zhu(a, book) }],
        steps: [
          method,
          `把「${a}」放进去：「${ph(t, a)}」，读起来通顺，是常说的搭配`,
          `「${d}」常说「${ex(d)}」，「${ph(t, d)}」说不通`,
          `${q(others)}也不行：要说${others.map((x) => `「${ex(x)}」`).join('')}`,
          `所以填「${a}」：${ph(t, a)}`,
        ],
        hint: '把每个词放进去读一读，哪个是平时常说的？',
      };
    },
  };
}
function dapeiCuoSkill(id, grade, term, name, level, list) {
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level,
    tip: '一个一个读：动词配动作对象，形容词配合适的事物，读着别扭的就是搭配不当',
    gen(r) {
      const [bad, ...good] = r.sample(list, 4);
      const [t, a, ds] = bad;
      const d = r.pick(ds);
      const W = ph(t, d);
      return {
        q: '下面词语搭配不当的一项是：',
        answer: [{ kind: 'choice', options: r.shuffle([W, ...good.map(([gt, ga]) => ph(gt, ga))]), value: W }],
        steps: [
          '一个一个读，想想平时是不是这样说',
          `「${W}」不对：「${d}」常说「${ex(d)}」，这里应该说「${ph(t, a)}」`,
          `其他三个都对：${good.map(([gt, ga]) => ph(gt, ga)).join('、')}`,
          `所以搭配不当的是「${W}」`,
        ],
        hint: '每个都读一读，哪个读起来别扭、平时不这样说？',
      };
    },
  };
}
const DP_VERB = '动词要配得上后面的东西：把每个词放进去读一读，听听平时是不是这样说';
const DP_ADJ = '形容词要配合适的事物：放在一起读一读，想想这个事物是不是这样的';

// ---------- 词语的形式 ----------
/** 按字算词的样子 */
function shape(w) {
  const c = [...w];
  if (c.length === 3) {
    const [a, b, x] = c;
    if (b === '一' && a === x) return 'AXA';
    if (a === b && b !== x) return 'AAB';
    if (a !== b && b === x) return 'ABB';
  }
  if (c.length === 4) {
    const [a, b, x, y] = c;
    if (new Set(c).size === 2 && a === b && x === y) return 'AABB';
    if (new Set(c).size === 2 && a === x && b === y) return 'ABAB';
    if (new Set(c).size === 3) {
      if (a === x) return 'ABAC';
      if (a === b) return 'AABC';
      if (x === y) return 'ABCC';
      if (a === y) return 'ABCA';
      if (b === y) return 'ABCB';
    }
  }
  return null;
}
for (const [g, grp] of Object.entries(XING)) for (const [t, ws] of Object.entries(grp)) for (const w of ws) if (shape(w) !== t) throw new Error(`词形放错组：${g} ${t} ${w}（算出来是 ${shape(w)}）`);
const LABEL = { AXA: 'A一A' };
const lab = (t) => `${LABEL[t] || t} 式`;
const DESC = {
  ABB: (w) => `后两个字一样（${w[1]}${w[2]}）`,
  AAB: (w) => `前两个字一样（${w[0]}${w[1]}）`,
  AXA: (w) => `中间是「一」，两头是同一个字（${w[0]}…${w[2]}）`,
  AABB: (w) => `两个字两个字地重叠（${w[0]}${w[1]}、${w[2]}${w[3]}）`,
  ABAB: (w) => `前两个字整个又说了一遍（${w.slice(0, 2)}、${w.slice(2)}）`,
  ABAC: (w) => `第一个字和第三个字一样（${w[0]}…${w[2]}…），第二个字和第四个字不一样`,
  AABC: (w) => `前两个字一样（${w[0]}${w[1]}），后两个字不一样`,
  ABCC: (w) => `后两个字一样（${w[2]}${w[3]}），前两个字不一样`,
  ABCA: (w) => `第一个字和最后一个字一样（${w[0]}…${w[3]}）`,
  ABCB: (w) => `第二个字和第四个字一样（…${w[1]}…${w[3]}）`,
};
const RULE = {
  ABB: '后两个字一样', AAB: '前两个字一样', AXA: '中间是「一」，两头是同一个字', AABB: '两个字两个字地重叠', ABAB: '前两个字整个重复一遍',
  ABAC: '第一个字和第三个字一样', AABC: '前两个字一样，后两个字不一样', ABCC: '后两个字一样，前两个字不一样', ABCA: '第一个字和最后一个字一样', ABCB: '第二个字和第四个字一样',
};
/** 最容易混的样子 */
const NEAR = { ABB: ['AAB'], AAB: ['ABB'], AXA: ['ABB', 'AAB'], AABB: ['ABAB'], ABAB: ['AABB', 'ABAC'], ABAC: ['ABAB', 'ABCA'], AABC: ['ABCC', 'AABB'], ABCC: ['AABC'], ABCA: ['ABAC', 'ABCB'], ABCB: ['ABCA', 'ABAB'] };
function xingPool(grades, types) {
  const W = {};
  for (const t of types) W[t] = [...new Set(grades.flatMap((g) => XING[g][t] || []))];
  return W;
}
/** 三个干扰词：和答案一样长、样子不同；第一个是最容易混的样子 */
function xingDistract(r, W, T, len) {
  const others = Object.keys(W).filter((t) => t !== T && W[t].length && [...W[t][0]].length === len);
  const near = (NEAR[T] || []).filter((t) => others.includes(t));
  const t0 = near.length ? r.pick(near) : r.pick(others);
  const d0 = r.pick(W[t0]);
  const rest = r.sample(others.flatMap((t) => W[t]).filter((w) => w !== d0), 2);
  return [d0, ...rest];
}
function xingSameSkill(id, grade, term, name, level, grades, types, targets, book) {
  const W = xingPool(grades, types);
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level,
    tip: '先看词的样子：哪几个字是一样的、在什么位置，再找同样子的',
    gen(r) {
      const T = r.pick(targets);
      const [ex, a] = r.sample(W[T], 2);
      const ds = xingDistract(r, W, T, [...a].length);
      const d0 = ds[0], t0 = shape(d0);
      return {
        q: `选出和「${zhu(ex, book)}」样子相同的词：`,
        answer: [{ kind: 'choice', options: r.shuffle([a, ...ds]).map((x) => zhu(x, book)), value: zhu(a, book) }],
        steps: [
          '先看词的样子：哪几个字是一样的、在什么位置',
          `「${ex}」${DESC[T](ex)}，是 ${lab(T)}`,
          `「${a}」也是${DESC[T](a)}，样子相同`,
          `「${d0}」${DESC[t0](d0)}，是 ${lab(t0)}，样子不一样`,
          `所以选「${a}」`,
        ],
        hint: `看看「${ex}」里哪几个字是一样的？`,
      };
    },
  };
}
function xingNameSkill(id, grade, term, name, level, grades, types) {
  const W = xingPool(grades, types);
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level,
    tip: '先想清楚这种样子是哪几个字一样，再一个一个对照',
    gen(r) {
      const T = r.pick(types);
      const [ex, a] = r.sample(W[T], 2);
      const ds = xingDistract(r, W, T, 4);
      const d0 = ds[0], t0 = shape(d0);
      return {
        q: `下面哪个词语是 ${lab(T)}？`,
        answer: [{ kind: 'choice', options: r.shuffle([a, ...ds]), value: a }],
        steps: [
          `${lab(T)}：${RULE[T]}，比如「${ex}」`,
          `「${a}」${DESC[T](a)}，是 ${lab(T)}`,
          `「${d0}」${DESC[t0](d0)}，是 ${lab(t0)}，容易看混`,
          `所以选「${a}」`,
        ],
        hint: `${lab(T)}是哪几个字一样？一个一个对照着看`,
      };
    },
  };
}
/** 照样子变一变：AABB / ABAB */
function xingBianSkill(id, grade, term, name, level) {
  const A2 = (w) => w[0] + w[0] + w[1] + w[1], AB = (w) => w + w;
  const kinds = [[TO_AABB, A2, AB, 'AABB', '两个字各说两遍'], [TO_ABAB_ADJ, AB, A2, 'ABAB', '两个字连在一起再说一遍'], [TO_ABAB_VERB, AB, A2, 'ABAB', '两个字连在一起再说一遍']];
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level,
    tip: '照样子变：先看例子是怎么变的，再照着同样的办法变',
    gen(r) {
      const [list, f, g, T, how] = r.pick(kinds);
      const [e, b] = r.sample(list, 2);
      const opts = [f(b), g(b), b[0] + b[0] + b[1], b[0] + b[1] + b[1]];
      return {
        q: `照样子变一变：\n${e} → ${f(e)}\n${b} → {0}`,
        answer: [{ kind: 'choice', options: r.shuffle(opts), value: f(b) }],
        steps: [
          '照样子变：先看例子是怎么变的',
          `「${e}」变成「${f(e)}」：${how}，是 ${T} 式`,
          `「${b}」也这样变：${how}，变成「${f(b)}」`,
          `「${g(b)}」是 ${T === 'AABB' ? 'ABAB' : 'AABB'} 式，和例子变的样子不一样`,
          `所以选「${f(b)}」`,
        ],
        hint: `例子里的「${e}」是怎么变的？一个字一个字地对照`,
      };
    },
  };
}

// ---------- 词语归类 ----------
function guiSkill(id, grade, term, name, level, cats, book, unitWord = '词') {
  const by = Object.fromEntries(cats.map((c) => [c.id, c]));
  const NOTE = Object.assign({}, ...cats.map((c) => c.note || {}));
  const seen = {};
  for (const c of cats) for (const w of c.w) {
    if (seen[w]) throw new Error(`归类：「${w}」同时在 ${seen[w]} 和 ${c.id}`);
    seen[w] = c.id;
  }
  const As = cats.filter((c) => c.w.length >= 3 && c.vs.length);
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level,
    tip: `先想每个${unitWord}属于哪一类，再找出不同的那个`,
    gen(r) {
      const A = r.pick(As), B = by[r.pick(A.vs)];
      const three = r.sample(A.w, 3), b = r.pick(B.w);
      const trap = NOTE[b] ? null : three.find((w) => NOTE[w]);
      return {
        q: `下面哪个${unitWord}和其他三个不是一类？`,
        answer: [{ kind: 'choice', options: r.shuffle([...three, b]).map((x) => zhu(x, book)), value: zhu(b, book) }],
        steps: [
          `先想每个${unitWord}属于哪一类，再找出不同的那个`,
          `${q(three)}都是${A.name}`,
          `「${b}」是${B.name}，不是${A.name}${NOTE[b] ? `。${NOTE[b]}` : ''}`,
          ...(trap ? [NOTE[trap]] : []),
          `所以不同的是「${b}」`,
        ],
        hint: `想一想：这几个${unitWord}里，哪三个是一类的？`,
      };
    },
  };
}

export default [
  liangSkill('y1b-ci-liang', 1, 2, '量词填一填', 1, L1, '1b'),
  liangSkill('y2a-ci-liang', 2, 1, '量词选一选', 1, L2, '2a'),
  liangCuoSkill('y2b-ci-liang-cuo', 2, 2, '量词用错的一项', 2, [...L1, ...L2].filter((x, i, a) => a.findIndex((y) => y[0] === x[0]) === i), '2b'),
  liangSkill('y3a-ci-liang', 3, 1, '量词辨一辨', 2, L3, null),
  liangCuoSkill('y4a-ci-liang-cuo', 4, 1, '量词用错（提高）', 2, [...L2, ...L3].filter((x, i, a) => a.findIndex((y) => y[0] === x[0]) === i), null),

  dapeiSkill('y1b-ci-dapei', 1, 2, '动作配一配', 1, '动作要配得上后面的东西：放在一起读一读，听听平时是不是这样说', DP_VERB, D1, '1b'),
  dapeiSkill('y2a-ci-dapei', 2, 1, '（ ）的什么', 1, DP_ADJ, DP_ADJ, D2, '2a'),
  dapeiSkill('y2b-ci-dapei', 2, 2, '动词搭配', 1, DP_VERB, DP_VERB, D3, '2b'),
  dapeiCuoSkill('y3a-ci-dapei-cuo', 3, 1, '搭配不当找一找', 2, dedupT([...D2, ...D3])),
  dapeiSkill('y4a-ci-dapei', 4, 1, '词语搭配（提高）', 2, '动词配动作对象，形容词配合适的事物：放在一起读一读', '动词配动作对象，形容词配合适的事物：把每个词放进去读一读', D4, null),
  dapeiCuoSkill('y4b-ci-dapei-cuo', 4, 2, '搭配不当（提高）', 3, D4),

  xingSameSkill('y1b-ci-xing', 1, 2, '找样子相同的词', 1, [1], ['ABB', 'AAB', 'AXA'], ['ABB', 'AAB', 'AXA'], '1b'),
  xingSameSkill('y2a-ci-xing', 2, 1, '词语的样子', 1, [1, 2], ['ABB', 'AAB', 'AXA', 'AABB', 'ABAB', 'ABAC'], ['ABB', 'AABB', 'ABAB', 'ABAC'], '2a'),
  xingBianSkill('y2b-ci-xing', 2, 2, '照样子变一变', 1),
  xingSameSkill('y3a-ci-xing', 3, 1, '四字词语的样子', 2, [3], ['AABB', 'ABAB', 'ABAC', 'AABC', 'ABCC'], ['AABB', 'ABAB', 'ABAC', 'AABC', 'ABCC'], null),
  xingNameSkill('y5a-ci-xing', 5, 1, '词语样子（提高）', 3, [5], ['AABB', 'ABAC', 'AABC', 'ABCC', 'ABCA', 'ABCB']),

  guiSkill('y1a-ci-gui', 1, 1, '找出不同的字', 1, G1A, null, '字'),
  guiSkill('y1b-ci-gui', 1, 2, '找出不同类的词', 1, G1B, '1b'),
  guiSkill('y2a-ci-gui', 2, 1, '词语分一分', 1, G2A, '2a'),
  guiSkill('y3a-ci-gui', 3, 1, '词语归类', 2, G3A, null),
  guiSkill('y4a-ci-gui', 4, 1, '词语归类（四年级）', 2, G4A, null),
  guiSkill('y5a-ci-gui', 5, 1, '词语归类（提高）', 3, G5A, null),
];
