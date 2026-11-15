// 古诗文与积累运用：古诗按统编版所在的册拆题型，每个题型只用这一册及以前学过的诗文。
// 诗文在 ./data/gushi-shi-*.js（全文、每句意思、字词、季节节日、感情），文言文在 ./data/gushi-wenyan.js，
// 名言谚语对子歇后语在 ./data/gushi-jilei.js，寓言神话名著等常识在 ./data/gushi-changshi.js。
// 默写只挖有笔顺数据的字（./data/gushi-bihua.js），低年级只挖笔画少的字。
import LOW from './data/gushi-shi-low.js';
import HIGH from './data/gushi-shi-high.js';
import WENYAN from './data/gushi-wenyan.js';
import BIHUA from './data/gushi-bihua.js';
import { DUIZI, YANYU, MINGYAN, XIEHOUYU } from './data/gushi-jilei.js';
import { YUYAN, SHENHUA, CHENGYU, MINGZHU, ZUOPIN } from './data/gushi-changshi.js';

const ORD = (g, s) => (g - 1) * 2 + (s - 1); // 一上 0 … 六下 11
const PUNCT = /[，、；：。？！]/;

/** '问题=正确/干扰1/干扰2' → { q, ans, opts } */
function qa(str) {
  const i = str.indexOf('=');
  const opts = str.slice(i + 1).split('/');
  return { q: str.slice(0, i), ans: opts[0], opts };
}

// ---------- 诗 ----------
const POEMS = [...LOW, ...HIGH].map((p) => {
  const ss = p.x.match(p.nq ? /[^。！]+[。！]/g : /[^。？！]+[。？！]/g);
  const sents = ss.map((s, i) => {
    const [yi, ...wr] = p.y[i].split('|');
    return { s, yi, wr, cl: s.match(/[^，、；：。？！]+[，、；：。？！]/g) };
  });
  const clauses = [];
  sents.forEach((st, si) => st.cl.forEach((raw) => clauses.push({ raw, t: raw.slice(0, -1), si })));
  const au = p.a ? (p.d ? `${p.d}·${p.a}` : p.a) : (p.src || '');
  const ci = (p.c || []).map((c) => {
    const { q: w, ans, opts } = qa(c);
    const cl = clauses.find((x) => x.t.includes(w));
    return { w, ans, opts, cl };
  });
  return { ...p, o: ORD(p.g, p.s), sents, clauses, au, head: au ? `《${p.t}》（${au}）` : `《${p.t}》`, ci };
});

/** 这一册及以前的诗；cur 有内容时 60% 出这一册的 */
function pickPoem(r, o, f = () => true) {
  const all = POEMS.filter((p) => p.o <= o && f(p));
  const cur = all.filter((p) => p.o === o);
  return cur.length && r.chance(0.6) ? r.pick(cur) : r.pick(all);
}
/** 从 cands 里取 k 个和 ans 不同、互不相同的干扰项 */
function distract(r, ans, cands, k = 3) {
  const out = [];
  for (const c of r.shuffle(cands)) if (c !== ans && !out.includes(c)) { out.push(c); if (out.length === k) break; }
  return out;
}
const choice = (r, ans, ds) => ({ kind: 'choice', options: r.shuffle([ans, ...ds]), value: ans });

/** 诗句的节奏单位：五言 2+3，七言 2+2+3，四字 2+2，六字 2+2+2 */
function units(n) {
  if (n <= 3) return [[0, n]];
  if (n === 4) return [[0, 2], [2, 4]];
  if (n === 5) return [[0, 2], [2, 5]];
  if (n === 6) return [[0, 2], [2, 4], [4, 6]];
  return [[0, 2], [2, 4], [4, n]];
}
/** 默写挖空的候选段：二年级挖一个节奏单位，三四年级可以挖半句，五六年级多挖整句 */
function blankSegs(n, g) {
  const u = units(n);
  if (g <= 2) return u;
  const merged = [];
  for (let i = 0; i + 1 < u.length; i++) merged.push([u[i][0], u[i + 1][1]]);
  if (g <= 4) return [...u.filter(([a, b]) => b - a >= 3), ...merged.filter(([a, b]) => b - a <= 5), ...(n <= 5 ? [[0, n]] : [])];
  return [...(n <= 7 ? [[0, n], [0, n]] : []), ...merged.filter(([a, b]) => b - a >= 4), ...u.filter(([a, b]) => b - a >= 3)];
}
const MAXBH = { 2: 12, 3: 15 };
const writable = (s, g) => [...s].every((c) => BIHUA[c] != null && BIHUA[c] <= (MAXBH[g] || 99));

/** 把句子里的某一段换成答题空 */
function holeSentence(st, clRaw, a, b) {
  const i = st.s.indexOf(clRaw);
  return st.s.slice(0, i) + clRaw.slice(0, a) + '{0}' + clRaw.slice(b) + st.s.slice(i + clRaw.length);
}

function moxieSkill(g, s) {
  const o = ORD(g, s);
  return {
    id: `y${g}${s === 1 ? 'a' : 'b'}-gs-moxie`, subject: 'yw', grade: g, term: s, unit: '古诗文', name: '古诗默写',
    tip: '先背出整首诗，找到这一句，再一笔一笔把字写对', level: 1,
    gen(r) {
      return r.until(() => {
        const p = pickPoem(r, o);
        const cls = p.clauses.filter((c) => c.t.length >= 3 && p.clauses.filter((x) => x.t === c.t).length === 1);
        const c = r.pick(cls);
        const [a, b] = r.pick(blankSegs(c.t.length, g));
        const ans = c.t.slice(a, b);
        const st = p.sents[c.si];
        const nb = p.sents[c.si - 1] || p.sents[c.si + 1];
        const lines = [holeSentence(st, c.raw, a, b)];
        if (nb && p.sents.length > 1) (p.sents[c.si - 1] ? lines.unshift(nb.s) : lines.push(nb.s));
        const q = `默写古诗：\n${p.head}\n${lines.join('\n')}`;
        const hard = [...ans].filter((ch) => BIHUA[ch] >= 13);
        return {
          // 一句只有一个分句时不整句挖掉，免得只剩一个空
          ok: writable(ans, g) && !q.replace('{0}', '').includes(ans) && (st.cl.length > 1 || b - a < c.t.length),
          v: {
            q,
            answer: [{ kind: 'hanzi', value: ans }],
            hint: st.yi.includes(ans) ? '先小声把整首诗背一遍，背到这一句就能想起来' : `这句的意思：${st.yi}`,
            steps: [
              '先把整首诗背一遍，背到这一句就想起来了',
              `全诗：${p.x}`,
              `这句的意思：${st.yi}`,
              `所以填「${ans}」${hard.length ? `；「${hard[0]}」有 ${BIHUA[hard[0]]} 画，按笔顺一笔一笔写` : ''}`,
            ],
          },
        };
      }, (x) => x.ok).v;
    },
  };
}

function buquanSkill(g, s) {
  const o = ORD(g, s);
  return {
    id: `y${g}${s === 1 ? 'a' : 'b'}-gs-buquan`, subject: 'yw', grade: g, term: s, unit: '古诗文', name: '补全诗句',
    tip: '先把整首诗背一遍，背到缺的地方就能想起来', level: 1,
    gen(r) {
      return r.until(() => {
        const p = pickPoem(r, o);
        const c = r.pick(p.clauses.filter((x) => x.t.length >= 4));
        const [a, b] = r.pick(c.t.length === 7 ? [[0, 4], [4, 7]] : units(c.t.length));
        const ans = c.t.slice(a, b);
        // 干扰项：别的诗句里同一位置、同样长的一段
        const st = p.sents[c.si];
        const pool = POEMS.filter((x) => x.o <= o).flatMap((x) => x.clauses).filter((x) => x.t.length === c.t.length)
          .map((x) => x.t.slice(a, b)).filter((x) => !st.s.includes(x));
        const ds = distract(r, ans, pool);
        return {
          ok: ds.length === 3 && st.s.split(ans).length === 2,
          v: {
            q: `把诗句补完整：\n${p.head}\n${holeSentence(st, c.raw, a, b)}`,
            answer: [choice(r, ans, ds)],
            hint: '小声背一背这首诗',
            steps: ['先把整首诗背一遍', `全诗：${p.x}`, `这句是「${st.s}」，所以选「${ans}」`],
          },
        };
      }, (x) => x.ok).v;
    },
  };
}

/** 相邻两句（上句, 下句），两句都至少三个字、在诗里只出现一次 */
function pairsOf(p) {
  const once = (t) => p.clauses.filter((x) => x.t === t).length === 1;
  const out = [];
  for (let i = 0; i + 1 < p.clauses.length; i++) {
    const a = p.clauses[i], b = p.clauses[i + 1];
    if (a.t.length >= 3 && b.t.length >= 3 && once(a.t) && once(b.t)) out.push([a, b]);
  }
  return out;
}

function jiexiaSkill(g, s, level = 1) {
  const o = ORD(g, s);
  return {
    id: `y${g}${s === 1 ? 'a' : 'b'}-gs-jiexia`, subject: 'yw', grade: g, term: s, unit: '古诗文', name: '上句接下句',
    tip: '想想这句在哪首诗里，从头背到这一句，下一句就出来了', level,
    gen(r) {
      return r.until(() => {
        const p = pickPoem(r, o, (x) => pairsOf(x).length);
        const [up, down] = r.pick(pairsOf(p));
        const next = r.bool();
        const ask = next ? up : down, ans = next ? down.t : up.t;
        const same = p.clauses.filter((x) => x.t.length === ans.length && x !== up && x !== down).map((x) => x.t);
        const other = POEMS.filter((x) => x.o <= o && x !== p).flatMap((x) => x.clauses).filter((x) => x.t.length === ans.length).map((x) => x.t);
        const ds = distract(r, ans, same, 2);
        ds.push(...distract(r, ans, other.filter((x) => !ds.includes(x)), 3 - ds.length));
        return {
          ok: ds.length === 3,
          v: {
            q: next ? `「${ask.t}」的下一句是：` : `「${ask.t}」的上一句是：`,
            answer: [choice(r, ans, ds)],
            hint: `这句出自${p.head}`,
            steps: [`这句出自${p.head}，从头背一背`, `全诗：${p.x}`, next ? `「${up.t}」后面接「${down.t}」` : `「${down.t}」前面是「${up.t}」`],
          },
        };
      }, (x) => x.ok).v;
    },
  };
}

function shimingSkill(g, s) {
  const o = ORD(g, s);
  return {
    id: `y${g}${s === 1 ? 'a' : 'b'}-gs-shiming`, subject: 'yw', grade: g, term: s, unit: '古诗文', name: '诗句出自哪首诗',
    tip: '记住每首诗里最有特点的景物或事情，看到诗句就能想起题目', level: 1,
    gen(r) {
      const p = pickPoem(r, o);
      const line = r.bool() ? r.pick(p.sents).s : r.pick(p.clauses.filter((c) => c.t.length >= 3)).t;
      const titles = [...new Set(POEMS.filter((x) => x.o <= o && x.t !== p.t).map((x) => `《${x.t}》`))];
      const ans = `《${p.t}》`;
      return {
        q: `「${line}」出自哪首诗？`,
        answer: [choice(r, ans, distract(r, ans, titles))],
        steps: ['想一想：这句诗写的是什么？在哪首诗里背过？', `全诗：${p.head} ${p.x}`, `所以选${ans}`],
      };
    },
  };
}

const DYN = ['唐', '宋', '明', '清'];
function zuozheSkill(g, s, withDyn) {
  const o = ORD(g, s);
  const label = (p) => (withDyn ? `${p.d}·${p.a}` : p.a);
  const ok = (p) => p.a && p.d && p.d !== '汉';
  return {
    id: `y${g}${s === 1 ? 'a' : 'b'}-gs-zuozhe`, subject: 'yw', grade: g, term: s, unit: '古诗文', name: withDyn ? '作者和朝代' : '诗是谁写的',
    tip: withDyn ? '背诗时连题目、朝代、作者一起背：李白、杜甫是唐朝，苏轼、杨万里是宋朝' : '背诗时连题目和作者一起背，看到诗句就想起是谁写的', level: 1,
    gen(r) {
      const p = pickPoem(r, o, ok);
      const ans = label(p);
      const sameTitle = POEMS.filter((x) => x.o <= o && x.t === p.t && x.a !== p.a).length;
      const byTitle = !sameTitle && r.chance(0.3);
      const pool = POEMS.filter((x) => x.o <= o && ok(x) && x.a !== p.a).map(label);
      let ds = distract(r, ans, pool);
      if (withDyn && r.chance(0.5)) ds = [`${r.pick(DYN.filter((d) => d !== p.d))}·${p.a}`, ...ds.slice(0, 2)];
      const line = r.pick(p.sents).s;
      return {
        q: byTitle ? `《${p.t}》的作者是谁？` : `「${line}」\n这句诗的作者是谁？`,
        answer: [choice(r, ans, ds)],
        steps: [
          '背诗的时候，把题目、朝代、作者连起来记',
          `这句出自${p.head}`,
          withDyn ? `${p.a}是${p.d}朝诗人，所以选「${ans}」` : `所以选「${ans}」`,
        ],
      };
    },
  };
}

function yisiSkill(g, s, level = 2) {
  const o = ORD(g, s);
  return {
    id: `y${g}${s === 1 ? 'a' : 'b'}-gs-yisi`, subject: 'yw', grade: g, term: s, unit: '古诗文', name: '诗句的意思',
    tip: '先弄懂关键字的意思，再把整句的意思连起来', level,
    gen(r) {
      const p = pickPoem(r, o);
      const si = r.int(0, p.sents.length - 1);
      const st = p.sents[si];
      const others = p.sents.filter((x) => x !== st).map((x) => x.yi);
      const far = POEMS.filter((x) => x.o <= o && x !== p).flatMap((x) => x.sents.map((y) => y.yi));
      const ds = distract(r, st.yi, st.wr, 2);
      ds.push(...distract(r, st.yi, others.filter((x) => !ds.includes(x)), 3 - ds.length));
      if (ds.length < 3) ds.push(...distract(r, st.yi, far.filter((x) => !ds.includes(x)), 3 - ds.length));
      const keys = p.ci.filter((c) => c.cl && c.cl.si === si).slice(0, 2).map((c) => `「${c.w}」是「${c.ans}」的意思`);
      return {
        q: `${p.head}\n「${st.s}」\n这句诗的意思是：`,
        answer: [choice(r, st.yi, ds)],
        steps: [
          '先弄懂句子里关键字的意思，再连起来想整句',
          ...(keys.length ? [keys.join('，')] : []),
          `这句的意思是：${st.yi}`,
          ...(st.wr.length ? [`「${st.wr[0]}」把意思理解错了`] : []),
        ],
      };
    },
  };
}

function ciyiSkill(g, s) {
  const o = ORD(g, s);
  return {
    id: `y${g}${s === 1 ? 'a' : 'b'}-gs-ciyi`, subject: 'yw', grade: g, term: s, unit: '古诗文', name: '诗中字词的意思',
    tip: '古诗里的字常和现在的意思不一样，要放回诗句里理解', level: 2,
    gen(r) {
      const p = pickPoem(r, o, (x) => x.ci.length);
      const c = r.pick(p.ci);
      const where = c.cl ? c.cl.t.replace(c.w, `**${c.w}**`) : `题目《${p.t.replace(c.w, `**${c.w}**`)}》`;
      const wrong = c.opts.find((x) => x !== c.ans);
      return {
        q: `${p.head}\n${where}\n加点的「${c.w}」是什么意思？`,
        answer: [choice(r, c.ans, c.opts.slice(1))],
        steps: [
          '把字放回诗句里，想想这句诗在说什么',
          c.cl ? `这句的意思：${p.sents[c.cl.si].yi}` : `题目《${p.t}》，全诗：${p.x}`,
          `所以「${c.w}」在这里是「${c.ans}」的意思`,
          `选「${wrong}」放进诗句里讲不通`,
        ],
      };
    },
  };
}

const SEASONS = ['春', '夏', '秋', '冬'];
const FESTS = ['春节', '元宵节', '清明节', '端午节', '七夕节', '中秋节', '重阳节', '寒食节'];
function seasonQ(r, p, o) {
  if (r.bool()) {
    return {
      q: `读一读，这首诗写的是哪个季节？\n${p.head}\n${p.x}`,
      answer: [choice(r, p.ji, SEASONS.filter((x) => x !== p.ji))],
      steps: ['找诗里表示季节的景物和词语', `这首诗写到了${p.jw}`, `所以写的是${p.ji}天`],
    };
  }
  const titles = [...new Set(POEMS.filter((x) => x.o <= o && x.ji && x.ji !== p.ji).map((x) => `《${x.t}》`))];
  const ans = `《${p.t}》`;
  return {
    q: `下面哪首诗写的是${p.ji}天的景色？`,
    answer: [choice(r, ans, distract(r, ans, titles))],
    steps: ['想想每首诗里写了哪些景物，这些景物在哪个季节出现', `${p.head}写到了${p.jw}，是${p.ji}天`, `所以选${ans}`],
  };
}
function festQ(r, p, o) {
  if (r.chance(0.7)) {
    const st = p.sents[r.pick(p.jjs)];
    return {
      q: `「${st.s}」\n这句诗写的是哪个节日？`,
      answer: [choice(r, p.jie, distract(r, p.jie, FESTS))],
      steps: ['找诗里写到的节日习俗', `这句出自${p.head}，意思是：${st.yi}`, `所以写的是${p.jie}`],
    };
  }
  const titles = [...new Set(POEMS.filter((x) => x.o <= o && x.jie !== p.jie).map((x) => `《${x.t}》`))];
  const ans = `《${p.t}》`;
  return {
    q: `下面哪首诗写的是${p.jie}？`,
    answer: [choice(r, ans, distract(r, ans, titles))],
    steps: ['想想每首诗写了什么节日习俗', `${p.head}：${p.x}`, `所以选${ans}`],
  };
}
function jijieSkill(g, s, withFest) {
  const o = ORD(g, s);
  return {
    id: `y${g}${s === 1 ? 'a' : 'b'}-gs-${withFest ? 'jieri' : 'jijie'}`, subject: 'yw', grade: g, term: s, unit: '古诗文',
    name: withFest ? '诗中的季节和节日' : '诗中的季节',
    tip: withFest ? '找诗里的景物和习俗：荷花、蝉是夏天，霜叶是秋天；爆竹、桃符是春节，登高、茱萸是重阳节' : '找诗里表示季节的景物：柳绿、莺飞是春天，荷花是夏天，梅花、雪是冬天',
    level: 1,
    gen(r) {
      if (withFest && r.chance(0.35)) return festQ(r, pickPoem(r, o, (x) => x.jjs), o);
      return seasonQ(r, pickPoem(r, o, (x) => x.ji), o);
    },
  };
}

function qingganSkill(g, s) {
  const o = ORD(g, s);
  return {
    id: `y${g}${s === 1 ? 'a' : 'b'}-gs-qinggan`, subject: 'yw', grade: g, term: s, unit: '古诗文', name: '诗人的感情',
    tip: '先读懂诗写了什么景物和事情，再想诗人借它们表达了什么感情', level: 2,
    gen(r) {
      const p = pickPoem(r, o, (x) => x.cat && x.zt);
      const pool = r.shuffle(POEMS.filter((x) => x.o <= o && x.cat && x.zt && x.cat !== p.cat));
      const ds = [], cats = [];
      for (const x of pool) if (!cats.includes(x.cat)) { cats.push(x.cat); ds.push(x.zt); if (ds.length === 3) break; }
      const last = p.sents[p.sents.length - 1];
      return {
        q: `${p.head}\n${p.x}\n这首诗主要表达了什么？`,
        answer: [choice(r, p.zt, ds)],
        steps: ['先读懂诗写了什么，再想诗人借这些景物和事情想说什么', `抓住最后一句「${last.s}」：${last.yi}`, `所以这首诗表达的是：${p.zt}`],
      };
    },
  };
}

// ---------- 文言文 ----------
/** 分句太短（如「何如」「谬矣」）时放宽到整句，整句里这个字只出现一次才用 */
function widen(x, ctx, word) {
  if (ctx.length >= 5) return ctx;
  const i = x.indexOf(ctx);
  let l = i;
  while (l > 0 && !'。？！”'.includes(x[l - 1])) l--;
  let rr = i + ctx.length;
  while (rr < x.length && !'。？！'.includes(x[rr])) rr++;
  const s = x.slice(l, rr + 1).replace(/[“”]/g, '');
  return s.split(word).length === 2 && s.length <= 30 ? s : ctx;
}
const WY = WENYAN.map((w) => {
  const clauses = w.x.split(/[，。？！；：“”]/).filter(Boolean);
  const items = [];
  for (const c of w.c) {
    const { q: lhs, ans, opts } = qa(c);
    const [ctx0, word] = lhs.includes('|') ? lhs.split('|') : [null, lhs];
    items.push({ k: 'c', word, ctx: widen(w.x, ctx0 || clauses.find((x) => x.includes(word)), word), ans, opts });
  }
  for (const j of w.ju) items.push({ k: 'ju', ...qa(j) });
  for (const j of w.qa) items.push({ k: 'qa', ...qa(j) });
  return { ...w, o: ORD(w.g, w.s), items };
});

function wenyanSkill(g, s) {
  const o = ORD(g, s);
  const all = WY.filter((w) => w.o <= o);
  const cur = all.filter((w) => w.o > o - 2); // 这一学年学的
  return {
    id: `y${g}${s === 1 ? 'a' : 'b'}-gs-wenyan`, subject: 'yw', grade: g, term: s, unit: '古诗文', name: '文言文',
    tip: '文言文先一个字一个字地解释，再连成通顺的话，最后想想故事讲的道理', level: 2,
    gen(r) {
      const w = cur.length && r.chance(0.7) ? r.pick(cur) : r.pick(all);
      const it = r.pick(w.items);
      const head = `《${w.t}》${w.src ? `（${w.src}）` : ''}`;
      const wrong = it.opts.find((x) => x !== it.ans);
      if (it.k === 'c') {
        return {
          q: `${head}\n${it.ctx.replace(it.word, `**${it.word}**`)}\n加点的「${it.word}」是什么意思？`,
          answer: [choice(r, it.ans, it.opts.slice(1))],
          steps: ['把字放回句子里，联系上下文来理解', `原文：${w.x}`, `「${it.word}」在这里是「${it.ans}」的意思`, `不能按「${wrong}」去理解，放进句子里讲不通`],
        };
      }
      if (it.k === 'ju') {
        const keys = w.items.filter((x) => x.k === 'c' && it.q.includes(x.ctx)).slice(0, 3).map((x) => `${x.word}：${x.ans}`);
        return {
          q: `${head}\n「${it.q}」\n这句话的意思是：`,
          answer: [choice(r, it.ans, it.opts.slice(1))],
          steps: ['先解释句子里的关键字，再把意思连起来', ...(keys.length ? [keys.join('；')] : []), `这句话的意思是：${it.ans}`, `「${wrong}」把字的意思理解错了`],
        };
      }
      return {
        q: `${head}\n${it.q}`,
        answer: [choice(r, it.ans, it.opts.slice(1))],
        steps: ['先读懂故事讲了什么，再回答问题', `故事大意：${w.yi}`, `所以选「${it.ans}」`],
      };
    },
  };
}

// ---------- 积累运用 ----------
const DZ = DUIZI.map(([a, b, k, note, dy]) => ({ a, b, k, note, dy }));
function duiziSkill(g, s, two) {
  const items = DZ.filter((d) => (two ? d.a.length === 2 || d.dy === 2 : d.a.length === 1 && d.dy !== 2));
  return {
    id: `y${g}${s === 1 ? 'a' : 'b'}-jl-duizi`, subject: 'yw', grade: g, term: s, unit: '积累运用', name: two ? '对对子（两个字）' : '对对子（一个字）',
    tip: two ? '两个字的对子，每个位置都要对上：山对水，清对秀' : '对子两边字数一样，意思同类或者相反：云对雨，大对小', level: 1,
    gen(r) {
      const d = r.pick(items);
      const left = r.chance(0.75); // 多数给上联对下联
      const ask = left ? d.a : d.b, ans = left ? d.b : d.a;
      const pool = DZ.filter((x) => x.a.length === ans.length && x.k !== d.k).flatMap((x) => [x.a, x.b]);
      const ds = distract(r, ans, pool);
      const dy = d.dy === 1 ? '《对韵歌》里就有：云对雨，雪对风。花对树，鸟对虫。山清对水秀，柳绿对桃红。'
        : d.dy === 2 ? '《古对今》里就有这一对。' : '';
      return {
        q: left ? `对对子：\n${ask} 对 {0}` : `对对子：\n{0} 对 ${ask}`,
        answer: [choice(r, ans, ds)],
        steps: [
          '对子两边字数一样，意思要是一类的，或者正好相反',
          `「${d.a}」和「${d.b}」：${d.note}${dy ? '。' + dy : ''}`,
          `「${ds[0]}」和「${ask}」不是一类，对不上`,
          left ? `所以是：${d.a}对${d.b}` : `所以是：${d.a}对${d.b}`,
        ],
      };
    },
  };
}

/** 谚语、名言补全（选一选） */
function buquanItems(list) {
  return list.flatMap((e) => e.b.map((bk) => ({ e, ans: bk[0], ds: bk.slice(1) })));
}
function fillSkill({ id, g, s, name, tip, items, kind, level = 1 }) {
  return {
    id, subject: 'yw', grade: g, term: s, unit: '积累运用', name, tip, level,
    ...(items.length < 30 ? { pool: items.length } : {}),
    gen(r) {
      const { e, ans, ds } = r.pick(items);
      return {
        q: `补全${kind}：\n${e.s.replace(ans, '{0}')}`,
        answer: [choice(r, ans, ds)],
        steps: [
          kind === '谚语' ? '谚语是老百姓总结的经验，先想它讲的道理' : '名言要连着意思一起记',
          `意思：${e.m}`,
          `完整的${kind}是：${e.s}${e.a ? `（${e.a}）` : ''}`,
        ],
      };
    },
  };
}

/** 名言默写：挖 2~6 个字，都要有笔顺数据 */
const MX = MINGYAN.filter((e) => e.g <= 4).flatMap((e) => e.b.map((bk) => ({ e, ans: bk[0] })))
  .filter(({ e, ans }) => !PUNCT.test(ans) && ans.length >= 2 && ans.length <= 6 && writable(ans, 4) && e.s.split(ans).length === 2);

/** 常识问答（选一选） */
function quizSkill({ id, g, s, name, tip, list, level = 2, how }) {
  const items = list.map((x) => {
    const it = { ...qa(x.q), j: x.j };
    if (!/[？：]$/.test(it.q)) it.q += '：'; // 「…的作者是」这类半句补个冒号
    return it;
  });
  return {
    id, subject: 'yw', grade: g, term: s, unit: '积累运用', name, tip, level,
    ...(items.length < 30 ? { pool: items.length } : {}),
    gen(r) {
      const it = r.pick(items);
      return {
        q: it.q,
        answer: [choice(r, it.ans, it.opts.slice(1))],
        steps: [how, it.j, `所以选「${it.ans}」`],
      };
    },
  };
}

// ---------- 题型清单 ----------

export default [
  // 一年级上册
  { ...buquanSkill(1, 1) },
  { ...jiexiaSkill(1, 1), pool: 28 },
  { ...shimingSkill(1, 1), pool: 29 },
  { ...duiziSkill(1, 1, false) },
  // 一年级下册
  buquanSkill(1, 2),
  jiexiaSkill(1, 2),
  zuozheSkill(1, 2, false),
  duiziSkill(1, 2, true),
  // 二年级
  moxieSkill(2, 1), jiexiaSkill(2, 1), zuozheSkill(2, 1, true),
  fillSkill({ id: 'y2a-jl-yanyu', g: 2, s: 1, name: '谚语补全', tip: '谚语是老百姓总结的经验，先想它讲的道理，再把它补完整', items: buquanItems(YANYU), kind: '谚语' }),
  moxieSkill(2, 2), yisiSkill(2, 2), { ...jijieSkill(2, 2, false), pool: 18 },
  fillSkill({ id: 'y2b-jl-mingyan', g: 2, s: 2, name: '名言补全', tip: '名言要连着意思一起记，理解了意思就不容易记错', items: buquanItems(MINGYAN.filter((e) => e.g <= 2)), kind: '名言' }),
  // 三年级
  moxieSkill(3, 1), ciyiSkill(3, 1), yisiSkill(3, 1),
  moxieSkill(3, 2), jijieSkill(3, 2, true), wenyanSkill(3, 2), ciyiSkill(3, 2),
  quizSkill({ id: 'y3b-jl-yuyan', g: 3, s: 2, name: '寓言的道理', tip: '寓言用一个小故事讲一个道理，先想故事里的人做错了什么', list: YUYAN, how: '先想故事讲了什么，故事里的人做对了还是做错了' }),
  // 四年级
  moxieSkill(4, 1), ciyiSkill(4, 1), qingganSkill(4, 1), wenyanSkill(4, 1),
  quizSkill({ id: 'y4a-jl-shenhua', g: 4, s: 1, name: '神话传说', tip: '神话人物各有本领，把人物和他做的事连起来记', list: SHENHUA, level: 1, how: '把神话人物和他做的事连起来想' }),
  moxieSkill(4, 2), yisiSkill(4, 2), zuozheSkill(4, 2, true), wenyanSkill(4, 2),
  {
    id: 'y4b-jl-mingyan', subject: 'yw', grade: 4, term: 2, unit: '积累运用', name: '名言默写',
    tip: '先背出整句，想清楚意思，再一笔一笔写', level: 1,
    gen(r) {
      const { e, ans } = r.pick(MX);
      return {
        q: `默写名言：\n${e.s.replace(ans, '{0}')}`,
        answer: [{ kind: 'hanzi', value: ans }],
        hint: `意思：${e.m}`.includes(ans) ? '先小声把整句背一遍' : `意思：${e.m}`,
        steps: ['先把整句名言背出来', `意思：${e.m}`, `完整的名言：${e.s}${e.a ? `（${e.a}）` : ''}`, `所以写「${ans}」`],
      };
    },
  },
  // 五年级
  moxieSkill(5, 1), ciyiSkill(5, 1), qingganSkill(5, 1),
  quizSkill({ id: 'y5a-jl-chengyu', g: 5, s: 1, name: '成语故事', tip: '成语故事要记住三样：人物、发生了什么、现在比喻什么', list: CHENGYU, how: '先想这个成语故事里是谁、发生了什么' }),
  moxieSkill(5, 2), yisiSkill(5, 2), wenyanSkill(5, 2),
  {
    id: 'y5b-jl-xiehouyu', subject: 'yw', grade: 5, term: 2, unit: '积累运用', name: '歇后语',
    tip: '歇后语前半截打比方，后半截说意思，有的后半截用了谐音', level: 2,
    gen(r) {
      const [a, b, m] = r.pick(XIEHOUYU);
      return {
        q: `补全歇后语：\n${a}——{0}`,
        answer: [choice(r, b, distract(r, b, XIEHOUYU.map((x) => x[1])))],
        steps: ['歇后语前半截打比方，后半截说出意思', m, `所以是：${a}——${b}`],
      };
    },
  },
  quizSkill({ id: 'y5b-jl-mingzhu', g: 5, s: 2, name: '四大名著', tip: '记住每部名著的作者、主要人物和他们最有名的故事', list: MINGZHU, how: '想想这个人物或故事出自哪部名著' }),
  // 六年级
  moxieSkill(6, 1), ciyiSkill(6, 1), wenyanSkill(6, 1),
  quizSkill({ id: 'y6a-jl-zuopin', g: 6, s: 1, name: '作品与作者', tip: '读过的书要记住书名、作者和国家', list: ZUOPIN, how: '想想这本书是谁写的、讲了什么' }),
  moxieSkill(6, 2), qingganSkill(6, 2), wenyanSkill(6, 2),
  fillSkill({ id: 'y6b-jl-mingyan', g: 6, s: 2, name: '名言警句', tip: '名言要连着意思一起记，理解了意思就不容易记错', items: buquanItems(MINGYAN), kind: '名言', level: 2 }),
];
