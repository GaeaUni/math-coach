// 句子、标点与修辞：连词成句、句子排序、句式转换、扩句缩句、病句、关联词、标点、修辞。
// 数据都在 ./data/ju-*.js（原创例句），这里只负责抽题、配干扰项、按方法写讲解。
import { LIANCI1, LIANCI2, PAIXU2, PAIXU3, BABEI, GAIFAN, GAICHEN, SHUANGFOU, YINYU, KUOSUO, YINHAO } from './data/ju-juzi.js';
import { BING, BD_OK, BD_BAD } from './data/ju-bing.js';
import { GL2, GL4, GL5, GX } from './data/ju-guanlian.js';
import { JUMO, DUNHAO, SHENGLUE, POZHE } from './data/ju-biaodian.js';
import { BIYU, FEIBIYU, NIREN, KUAZHANG, PAIBI, SHEWEN, FANWEN, DUIOU, ZUOYONG } from './data/ju-xiuci.js';

const Q = (s) => `「${s}」`;
const base = { subject: 'yw' };

/** 选择题：right 正确项，wrongs [{s, why}]，最多取 k 个不重复的干扰项；返回 answer 和实际用上的干扰项 */
function mc(r, right, wrongs, k = 3) {
  const seen = new Set([right]), ws = [];
  for (const w of r.shuffle(wrongs)) {
    if (!w || !w.s || seen.has(w.s)) continue;
    seen.add(w.s); ws.push(w);
    if (ws.length === k) break;
  }
  return { answer: { kind: 'choice', options: r.shuffle([right, ...ws.map((w) => w.s)]), value: right }, ws };
}

// ---------- 连词成句 ----------
/** 二年级连词成句的所有通顺顺序：「什么时候」可以放在最前面或「谁」后面；「在哪里」「怎么样地」可以互换；
 *  没有「什么时候」时，「在……」也可以放到最前面 */
function lianciOrders(c) {
  const mid = [c.P, c.A].filter(Boolean);
  const mids = mid.length === 2 ? [mid, [mid[1], mid[0]]] : [mid];
  const tail = [c.V, c.O].filter(Boolean);
  const out = [];
  for (const m of mids) {
    if (c.T) out.push([c.T, c.S, ...m, ...tail], [c.S, c.T, ...m, ...tail]);
    else out.push([c.S, ...m, ...tail]);
  }
  if (!c.T && c.P && c.P.startsWith('在')) out.push([c.P, c.S, ...(c.A ? [c.A] : []), ...tail]);
  const seen = new Set();
  return out.filter((o) => { const k = o.join('|'); if (seen.has(k)) return false; seen.add(k); return true; });
}
const parseRoles = (str) => Object.fromEntries(str.split('|').map((x) => x.split(':')));

// ---------- 句子排序：找顺序词 ----------
const CUES = ['第一步', '第二步', '第三步', '紧接着', '接着', '然后', '最后', '后来', '终于', '不久', '不一会儿', '过了一会儿', '过了几天', '过了一个星期', '过了一些日子', '又过了', '几年过去了', '从此', '从那以后', '一开始', '刚开始', '刚搬回来时', '早上', '中午', '傍晚', '晚上', '春天', '夏天', '秋天', '冬天', '星期一', '星期三', '星期五', '比赛前', '比赛那天', '上台前', '生日那天', '第二天', '一个月后', '半岁时', '一岁多', '雨停后', '写完后', '写好后', '洗好后', '刷完后', '吃过饭', '吃完早饭', '一进门', '一进大厅', '原来', '突然', '回来一看', '这时', '放学了', '下课了', '先', '再'];
function cueOf(sen) {
  let best = null, at = Infinity;
  for (const c of CUES) { const i = sen.indexOf(c); if (i >= 0 && (i < at || (i === at && c.length > best.length))) { best = c; at = i; } }
  return best;
}
function paixuSkill(def, pool) {
  return {
    ...base, unit: '句子', ...def,
    gen(r) {
      const v = r.pick(pool);
      const cues = v.map(cueOf).filter(Boolean);
      return {
        q: '把句子排成一段通顺的话：',
        answer: [{ kind: 'order', value: v, alts: [], sep: '' }],
        steps: [
          '排句子：先找开头那句（交代谁、什么事），再按事情发生的先后排，顺序词是最好的线索',
          cues.length >= 2 ? `这几句里的顺序词：${cues.map(Q).join('')}` : '这几句按事情发生的先后来想：先发生什么，接着怎样，结果怎样',
          `排好是：${v.join('')}`,
        ],
        hint: '先找哪一句是开头，再找「先、接着、然后、最后」这样的词',
      };
    },
  };
}

// ---------- 扩句 / 缩句 ----------
const ksJoin = (x) => [x.a, x.s, x.d, x.n, x.v, x.b, x.o].map((v) => v || '').join('');
const ksStem = (x) => [x.s, x.n, x.v, x.o].map((v) => v || '').join('');
const ksTarget = (x, k) => (k === 'd' ? x.v : k === 'a' ? x.s : x.o);

// ---------- 病句 ----------
const BING_TYPES3 = ['成分残缺', '搭配不当', '用词重复', '语序不当'];
const BING_TYPES5 = [...BING_TYPES3, '前后矛盾', '不合逻辑'];
const BING_DEF = {
  成分残缺: '句子缺了「谁」或者缺了「干什么 / 怎么样」，意思说不完整',
  搭配不当: '两个词放在一起配不上，比如「戴鞋」应该是「穿鞋」',
  用词重复: '意思相同的词用了两遍，显得啰嗦',
  语序不当: '词语的先后顺序放错了',
  前后矛盾: '一句话里前面和后面的说法互相打架',
  不合逻辑: '不符合道理：比如把大类和它里面的小类并列，或者原因和结果对不上',
};
function bingyinSkill(def, g, types) {
  const pool = BING.filter((x) => x.g === g);
  return {
    ...base, unit: '句子', ...def,
    gen(r) {
      const it = r.pick(pool);
      const ban = new Set([it.t, ...(it.x || [])]);
      if (it.t === '前后矛盾') ban.add('不合逻辑');
      if (it.t === '不合逻辑') ban.add('前后矛盾');
      const others = r.sample(types.filter((t) => !ban.has(t)), 3);
      return {
        q: `这句话有语病，病因是什么？\n${it.bad}`,
        answer: [{ kind: 'choice', options: r.shuffle([it.t, ...others]), value: it.t }],
        steps: [
          g === 3 ? '找病因：先看缺不缺「谁」「干什么」，再看词语搭配得上吗，有没有重复的意思，词语顺序对不对'
            : '找病因：先找句子的主干看缺不缺成分，再看搭配、重复、语序，最后想想前后说法打不打架、合不合道理',
          `${it.why}`,
          `这是「${it.t}」：${BING_DEF[it.t]}`,
          `可以改成：${it.fix}`,
        ],
        hint: '先把句子读一遍，哪里读着别扭？',
      };
    },
  };
}
function wubingSkill(def, g) {
  const pool = BING.filter((x) => x.g === g);
  return {
    ...base, unit: '句子', ...def,
    gen(r) {
      const [ok, ...bad] = r.sample(pool, 4);
      return {
        q: '下面哪一句没有语病？',
        answer: [{ kind: 'choice', options: r.shuffle([ok.fix, ...bad.map((b) => b.bad)]), value: ok.fix }],
        steps: [
          '逐句用找病因的办法查：缺不缺成分、搭配对不对、有没有重复、顺序对不对' + (g === 5 ? '、前后矛不矛盾、合不合道理' : ''),
          ...bad.map((b) => `「${b.bad}」${b.why.replace(new RegExp('，?' + b.t + '$'), '')}（${b.t}）`),
          `只有「${ok.fix}」没有语病`,
        ],
      };
    },
  };
}

// ---------- 关联词 ----------
const glShow = (a) => (a.includes('|') ? a.split('|').map((w) => w + '……').join('') : a);
const glBlank = (s) => s.replace(/__/g, '（　　）');
function glFill(s, a) { const ws = a.split('|'); let i = 0; return s.replace(/__/g, () => ws[i++]); }
const GL_REL = {};
for (const it of [...GL2, ...GL4, ...GL5]) if (!GL_REL[it.a]) GL_REL[it.a] = it.t;
function guanlianSkill(def, pool) {
  return {
    ...base, unit: '句子', ...def,
    gen(r) {
      const it = r.pick(pool);
      const single = !it.a.includes('|');
      const opts = r.shuffle([it.a, ...it.d]);
      const d0 = it.d.find((d) => GL_REL[d] && GL_REL[d] !== it.t);
      return {
        q: `选关联词填空：\n${glBlank(it.s)}`,
        answer: [{ kind: 'choice', options: opts.map(glShow), value: glShow(it.a) }],
        steps: [
          single ? '关联词要成对使用：先看句子里已经有的那个关联词，再找和它配对的' : '选关联词：先读懂前后两部分是什么关系，再选表示这种关系的关联词',
          `${it.why.replace(new RegExp('，?是' + it.t + '(关系)?$'), '')}，是${it.t}关系`,
          ...(d0 ? [`「${glShow(d0)}」表示${GL_REL[d0]}关系，填进去意思不对`] : []),
          `填好：${glFill(it.s, it.a)}`,
        ],
        hint: '把每个选项填进去读一读，哪个读着最顺、意思最对？',
      };
    },
  };
}
const REL_DEF = {
  并列: '几件事或几个方面并排放在一起，不分主次',
  递进: '后一部分比前一部分意思更进一层',
  转折: '后一部分的意思和前一部分相反或不一致',
  因果: '一部分说原因，另一部分说结果',
  假设: '先假设一种情况，再说在这种情况下会怎样',
  条件: '一部分是条件，另一部分是满足这个条件后的结果',
  选择: '从几种情况里选一种',
};
const REL_CONF = { 假设: '条件', 条件: '假设', 转折: '递进', 递进: '并列', 并列: '递进', 因果: '假设', 选择: '并列' };

// ---------- 标点 ----------
const JUMO_EXCL = [[/真.*[啊呀]/, '真……啊'], [/太.*了/, '太……了'], [/多.*[啊呀]/, '多……啊'], [/好.*[啊呀]/, '好……啊'], [/[啊呀]/, '啊']];
const JUMO_Q = ['为什么', '什么', '怎么', '哪里', '哪儿', '是不是', '好不好', '对不对', '能不能', '会不会', '要不要', '有没有', '还是', '谁', '哪', '几', '吗', '呢'];
const SL_F = { 1: '表示列举的省略', 2: '表示说话断断续续', 3: '表示声音的延续', 4: '表示话没说完，意思没有说尽' };
const SL_WHY = {
  1: '省略号前面列了几样，后面还有很多没有一一列出来',
  2: '说话的人因为紧张、害怕、难过或累，话说得一截一截的',
  3: '省略号跟在表示声音的词后面，表示声音一直在响',
  4: '话说到这里停住了，后面的意思没说出来，留给人去想',
};
const PZ_F = { 1: '表示解释说明', 2: '表示声音的延长', 3: '表示话题的转换' };
const PZ_WHY = {
  1: '破折号后面的话是在解释前面说的东西',
  2: '破折号跟在声音后面，表示声音拉得很长',
  3: '破折号前后说的是两件不同的事，话题换了',
};
const bold = (s, mark) => s.split(mark).join(`**${mark}**`);

// ---------- 修辞 ----------
const XC = {
  比喻: BIYU.map((x) => ({ ...x, r: '比喻' })),
  拟人: NIREN.map((x) => ({ ...x, r: '拟人' })),
  夸张: KUAZHANG.map((x) => ({ ...x, r: '夸张' })),
  排比: PAIBI.map((x) => ({ ...x, r: '排比' })),
  设问: SHEWEN.map((x) => ({ ...x, r: '设问' })),
  反问: FANWEN.map((x) => ({ ...x, r: '反问' })),
  对偶: DUIOU.map((x) => ({ ...x, r: '对偶' })),
};
function xcWhy(it) {
  switch (it.r) {
    case '比喻': return `把「${it.ben}」比作「${it.yu}」，两种不同的事物有相似的地方，是比喻`;
    case '拟人': return `「${it.act}」是人才有的动作或样子，这里把「${it.w}」当作人来写，是拟人`;
    case '夸张': return `故意把「${it.w}」说得远远超过实际，是夸张`;
    case '排比': return '三个或三个以上结构相同、语气一致的部分连在一起，是排比';
    case '设问': return '先提出一个问题，紧接着自己回答，是设问';
    case '反问': return '用问句说出确定的意思，不需要回答，答案就在问句里，是反问';
    case '对偶': return '两句字数相等、结构相同、意思相关，是对偶';
  }
  return '';
}
const XC_TIP = {
  比喻: '比喻：把一种事物比作另一种不同的事物（常有「像、好像、仿佛」）',
  拟人: '拟人：把事物当作人来写，让它有人的动作、语言、心情',
  夸张: '夸张：故意把事物往大里说或往小里说',
  排比: '排比：三个或以上结构相同、语气一致的句子连在一起',
  设问: '设问：自问自答',
  反问: '反问：用问句表达确定的意思，只问不答',
  对偶: '对偶：两句字数相等、结构相同、意思相关',
};
const XC_CONF = { 比喻: '拟人', 拟人: '比喻', 夸张: '比喻', 排比: '对偶', 设问: '反问', 反问: '设问', 对偶: '排比' };
function xiuciSkill(def, kinds, { newKinds = null, n = 4 } = {}) {
  return {
    ...base, unit: '标点与修辞', ...def,
    gen(r) {
      const from = newKinds && r.bool() ? newKinds : kinds;
      const it = r.pick(XC[r.pick(from)]);
      let opts;
      if (kinds.length <= n) opts = r.shuffle(kinds);
      else {
        const conf = XC_CONF[it.r];
        opts = r.shuffle([it.r, conf, ...r.sample(kinds.filter((k) => k !== it.r && k !== conf), n - 2)]);
      }
      const conf = opts.includes(XC_CONF[it.r]) ? XC_CONF[it.r] : null;
      return {
        q: `这句话用了什么修辞手法？\n${it.s}`,
        answer: [{ kind: 'choice', options: opts, value: it.r }],
        steps: [
          '判断修辞：先找句子的特点，再对照每种修辞的样子',
          XC_TIP[it.r],
          xcWhy(it),
          ...(conf ? [`别和${conf}弄混：${XC_TIP[conf]}`] : []),
        ],
      };
    },
  };
}

// ======================================================================
export default [
  // ---------------- 句子 ----------------
  {
    ...base, id: 'y1b-ju-lianci', grade: 1, term: 2, unit: '句子', name: '连词成句',
    tip: '先找「谁」，再找「在哪里」，最后是「干什么」', level: 1,
    gen(r) {
      const [s, p, v] = r.pick(LIANCI1).split('|');
      return {
        q: '把词语排成一句通顺的话（句末加句号）：',
        answer: [{ kind: 'order', value: [s, p, v], alts: [[p, s, v]], sep: '' }],
        steps: [`先找「谁」：${s}`, `再找「在哪里」：${p}；「干什么」：${v}`, `按「谁 + 在哪里 + 干什么」连起来：${s}${p}${v}。`],
        hint: '这句话说的是谁？',
      };
    },
  },
  {
    ...base, id: 'y2a-ju-lianci', grade: 2, term: 1, unit: '句子', name: '连词成句（长句子）',
    tip: '谁 + 什么时候 + 在哪里 + 怎么样地 + 干什么', level: 1,
    gen(r) {
      const c = parseRoles(r.pick(LIANCI2));
      const [value, ...alts] = lianciOrders(c);
      return {
        q: '把词语排成一句通顺的话（句末加句号）：',
        answer: [{ kind: 'order', value, alts, sep: '' }],
        steps: [
          `谁：${c.S}${c.T ? `；什么时候：${c.T}` : ''}`,
          `${c.P ? `在哪里：${c.P}` : ''}${c.A ? `；怎么样地：${c.A}` : ''}`,
          `干什么：${c.V}${c.O || ''}`,
          `连起来：${value.join('')}。` + (c.T ? `「${c.T}」放在最前面也可以` : ''),
        ],
        hint: '先找「谁」，再想他什么时候、在哪里、干什么',
      };
    },
  },
  paixuSkill({ id: 'y2b-ju-paixu', grade: 2, term: 2, name: '句子排序', tip: '找顺序词：先、接着、然后、最后，或者早上、中午、晚上，按事情的先后排', level: 1 }, PAIXU2),
  guanlianSkill({ id: 'y2b-ju-guanlian', grade: 2, term: 2, name: '选关联词', tip: '先想前后两部分是什么关系，再选关联词；关联词常常成对出现', level: 1 }, GL2),
  {
    ...base, id: 'y3a-ju-babei', grade: 3, term: 1, unit: '句子', name: '把字句和被字句',
    tip: '把字句、被字句互换：做事的人和被处置的东西换位置，意思不能变', level: 1,
    gen(r) {
      const x = r.pick(BABEI), pre = x.pre || '';
      const ba = `${x.a}${pre}把${x.b}${x.vp}。`, bei = `${x.b}被${x.a}${pre}${x.vp}。`;
      const baSwap = `${x.b}${pre}把${x.a}${x.vp}。`, beiSwap = `${x.a}被${x.b}${pre}${x.vp}。`;
      const toBei = r.bool();
      const [src, ok, w1, w2] = toBei ? [ba, bei, beiSwap, baSwap] : [bei, ba, baSwap, beiSwap];
      return {
        q: `把下面的句子改成「${toBei ? '被' : '把'}」字句，哪一句改得对？\n${src}`,
        answer: [{ kind: 'choice', options: r.shuffle([ok, w1, w2]), value: ok }],
        steps: [
          toBei ? '把字句改被字句：把「把」后面的东西提到最前面，接着写「被」和做事的人，意思不变'
            : '被字句改把字句：把「被」后面做事的人提到最前面，接着写「把」和被处置的东西，意思不变',
          `做事的是「${x.a}」，被处置的是「${x.b}」`,
          `「${w1}」把谁对谁做事弄反了，意思变了`,
          `所以是「${ok}」`,
        ],
        hint: '想一想：谁是做事的人？什么是被处置的东西？',
      };
    },
  },
  bingyinSkill({ id: 'y3a-ju-bingyin', grade: 3, term: 1, name: '病句：找病因', tip: '找病因：缺不缺成分、搭配对不对、有没有重复、顺序对不对', level: 1 }, 3, BING_TYPES3),
  paixuSkill({ id: 'y3b-ju-paixu', grade: 3, term: 2, name: '一段话排顺序', tip: '先找开头的总起句，再按时间、做事的步骤或事情发展的先后排', level: 2 }, PAIXU3),
  {
    ...base, id: 'y3b-ju-kuoju', grade: 3, term: 2, unit: '句子', name: '扩句',
    tip: '扩句：在主干前加「什么样的」「在哪里」「怎么样地」，主干不变、搭配得上、顺序要对', level: 1,
    gen(r) {
      const x = r.pick(KUOSUO);
      const ok = ksJoin(x) + '。', stem = ksStem(x);
      const altX = { ...x, ...x.alt }, altS = ksJoin(altX) + '。';
      const bk = Object.keys(x.bad)[0], badS = ksJoin({ ...x, ...x.bad }) + '。';
      const luan = [x.s, x.a, x.d, x.n, x.v, x.b, x.o].map((v) => v || '').join('') + '。';
      return {
        q: `给「${stem}」扩句（加上修饰的词语，主干不变），哪一句扩得最好？`,
        answer: [{ kind: 'choice', options: r.shuffle([ok, altS, badS, luan]), value: ok }],
        steps: [
          '扩句：主干不能变，加上去的词要搭配得上，放的位置要对',
          `「${altS}」主干变成了「${ksStem(altX)}」，意思变了`,
          `「${badS}」里「${x.bad[bk]}」和「${ksTarget(x, bk)}」搭配不上`,
          `「${luan}」「${x.a}」应该放在「${x.s}」前面`,
          `所以选「${ok}」`,
        ],
      };
    },
  },
  {
    ...base, id: 'y3b-ju-fanwen', grade: 3, term: 2, unit: '句子', name: '改成反问句',
    tip: '改反问句：加「难道……吗」或「怎么能……呢」，肯定变否定、否定变肯定，句末用问号', level: 2,
    gen(r) {
      const it = r.pick(GAIFAN);
      const neg = /不|没/.test(it.c);
      const w2 = it.w2 || it.c.replace(/。$/, '吗？');
      return {
        q: `把下面的句子改成反问句，意思不变：\n${it.c}`,
        answer: [{ kind: 'choice', options: r.shuffle([it.r, it.w, w2]), value: it.r }],
        steps: [
          '陈述句改反问句：加上「难道……吗」或「怎么能……呢」，肯定的意思用否定说法问，否定的意思用肯定说法问，句末用问号',
          neg ? '原句里有否定词（不、没），改成反问句要去掉它' : '原句是肯定的说法，改成反问句要加上「不」或「没」',
          `「${it.w}」的意思和原句正好相反`,
          `「${w2}」只是普通地提问，没有反问的语气`,
          `所以选「${it.r}」`,
        ],
      };
    },
  },
  wubingSkill({ id: 'y3b-ju-wubing', grade: 3, term: 2, name: '选没有语病的句子', tip: '一句一句查：缺不缺成分、搭配对不对、有没有重复、顺序对不对', level: 2 }, 3),
  {
    ...base, id: 'y4a-ju-suoju', grade: 4, term: 1, unit: '句子', name: '缩句',
    tip: '缩句：去掉「的」「地」前面修饰的词和时间、地点，留下谁 + 干什么（+ 什么），否定词要留下', level: 1,
    gen(r) {
      const x = r.pick(KUOSUO);
      const S = (o) => [o.s, o.n, o.v, o.o].map((v) => v || '').join('') + '。';
      const full = ksJoin(x) + '。', ok = S(x);
      const cand = [];
      if (x.d) cand.push({ s: [x.s, x.d, x.n, x.v, x.o].map((v) => v || '').join('') + '。', why: `「${x.d}」是修饰的词，还要去掉` });
      if (x.a) cand.push({ s: [x.a, x.s, x.n, x.v, x.o].map((v) => v || '').join('') + '。', why: `「${x.a}」是修饰「${x.s}」的，还要去掉` });
      if (x.b) cand.push({ s: [x.s, x.n, x.v, x.b, x.o].map((v) => v || '').join('') + '。', why: `「${x.b}」是修饰「${x.o}」的，还要去掉` });
      if (x.o) cand.push({ s: [x.s, x.n, x.v].map((v) => v || '').join('') + '。', why: `去掉了「${x.o}」，意思不完整` });
      cand.push({ s: [x.n, x.v, x.o].map((v) => v || '').join('') + '。', why: `缺了「谁」：${x.s}` });
      const uniq = cand.filter((c, i) => c.s !== ok && cand.findIndex((d) => d.s === c.s) === i);
      let ws;
      if (x.n) {
        const dropN = { s: [x.s, x.v, x.o].map((v) => v || '').join('') + '。', why: `丢了「${x.n}」，意思反了` };
        ws = [dropN, ...r.sample(uniq, 2)];
      } else ws = r.sample(uniq, 3);
      const cut = [x.a, x.d, x.b].filter(Boolean).map(Q).join('');
      return {
        q: `缩句（缩成最简单的一句话）：\n${full}`,
        answer: [{ kind: 'choice', options: r.shuffle([ok, ...ws.map((w) => w.s)]), value: ok }],
        steps: [
          '缩句：去掉修饰的词（「的」「地」前面的词、表示时间地点的词），留下谁 + 干什么（+ 什么）；「不」「没」这样的否定词要留下',
          `去掉${cut}，留下「${ok}」`,
          `「${ws[0].s}」${ws[0].why}`,
          `所以选「${ok}」`,
        ],
      };
    },
  },
  {
    ...base, id: 'y4a-ju-chenshu', grade: 4, term: 1, unit: '句子', name: '反问句改陈述句',
    tip: '去掉「难道」「怎么」「吗」「呢」，否定改肯定、肯定改否定，句末改句号', level: 2,
    gen(r) {
      const it = r.pick(GAICHEN);
      const w2 = it.r.replace(/。$/, '吗？');
      return {
        q: `把下面的反问句改成陈述句，意思不变：\n${it.f}`,
        answer: [{ kind: 'choice', options: r.shuffle([it.r, it.w, w2]), value: it.r }],
        steps: [
          '反问句改陈述句：先想清楚反问句真正要说的意思，再去掉反问的词，否定说法改肯定、肯定说法改否定，句末用句号',
          `「${it.f}」真正的意思是：${it.r}`,
          `「${it.w}」意思正好反了`,
          `「${w2}」还是问句，不是陈述句`,
          `所以选「${it.r}」`,
        ],
      };
    },
  },
  guanlianSkill({ id: 'y4a-ju-guanlian', grade: 4, term: 1, name: '选关联词（七种关系）', tip: '并列、递进、转折、因果、假设、条件、选择：先判断关系，再选关联词', level: 2 }, GL4),
  {
    ...base, id: 'y4b-ju-jianjie', grade: 4, term: 2, unit: '句子', name: '直接引语改间接引语',
    tip: '冒号改逗号、去掉引号，「我」改成说话的人，「你」改成听话的人', level: 2,
    gen(r) {
      const x = r.pick(YINYU);
      const dir = `${x.sp}：“${x.q}${x.e}”`, ok = `${x.sp}，${x.jq}。`;
      const ws = [
        { s: `${x.sp}，${x.q}。`, why: '引号去掉了，可人称没有改' },
        { s: `${x.sp}：“${x.jq}${x.e}”`, why: '人称改了，可冒号和引号还留着' },
        { s: `${x.sp}，${x.wq}。`, why: '人称改错了' },
      ];
      return {
        q: `把下面的直接引语改成间接引语：\n${dir}`,
        answer: [{ kind: 'choice', options: r.shuffle([ok, ...ws.map((w) => w.s)]), value: ok }],
        steps: [
          '直接引语改间接引语：①冒号改成逗号，去掉引号；②引号里的「我」改成说话的人，「你」改成听话的人；③句末用句号',
          `${x.sp}，引号里的「${x.q}」要改成「${x.jq}」`,
          `「${ws[0].s}」${ws[0].why}`,
          `所以选「${ok}」`,
        ],
      };
    },
  },
  {
    ...base, id: 'y5a-ju-shuangfou', grade: 5, term: 1, unit: '句子', name: '双重否定句',
    tip: '双重否定等于肯定：不能不 = 必须，没有……不 = 都，不得不 = 只好，非……不可 = 一定要', level: 2,
    gen(r) {
      const x = r.pick(SHUANGFOU);
      if (r.bool()) {
        return {
          q: `把下面的句子改成双重否定句，意思不变：\n${x.k}`,
          answer: [{ kind: 'choice', options: r.shuffle([x.s, x.n, x.f]), value: x.s }],
          steps: [
            '双重否定句：用两个否定词表示肯定，常用「不能不」「不得不」「没有……不」「非……不可」「无不」，意思不变，语气更强',
            `「${x.s}」有两个否定，意思还是「${x.k.replace(/。$/, '')}」`,
            `「${x.n}」只有一个否定，意思反了`,
            `「${x.f}」是反问句，不是双重否定句`,
            `所以选「${x.s}」`,
          ],
        };
      }
      return {
        q: `把下面的双重否定句改成肯定句，意思不变：\n${x.s}`,
        answer: [{ kind: 'choice', options: r.shuffle([x.k, x.n, x.f]), value: x.k }],
        steps: [
          '双重否定等于肯定：把两个否定一起换成肯定的说法（不能不 → 必须，没有……不 → 都，不得不 → 只好，非……不可 → 一定要）',
          `「${x.s}」的意思就是「${x.k}」`,
          `「${x.n}」意思反了`,
          `「${x.f}」是反问句，不是肯定的陈述句`,
          `所以选「${x.k}」`,
        ],
      };
    },
  },
  {
    ...base, id: 'y5a-ju-zhijie', grade: 5, term: 1, unit: '句子', name: '间接引语改直接引语',
    tip: '逗号改冒号、加上引号，转述的人称改回说话人自己的口气：说话的人自称「我」，对听话的人称「你」', level: 2,
    gen(r) {
      const x = r.pick(YINYU);
      const ind = `${x.sp}，${x.jq}。`, ok = `${x.sp}：“${x.q}${x.e}”`;
      const ws = [
        { s: `${x.sp}：“${x.jq}${x.e}”`, why: '加了引号，可人称没有改回说话人的口气' },
        { s: `${x.sp}：“${x.wq}${x.e}”`, why: '人称改错了' },
        { s: `${x.sp}：${x.q}${x.e}`, why: '说的话没有加引号' },
      ];
      return {
        q: `把下面的间接引语改成直接引语：\n${ind}`,
        answer: [{ kind: 'choice', options: r.shuffle([ok, ...ws.map((w) => w.s)]), value: ok }],
        steps: [
          '间接引语改直接引语：①逗号改成冒号，加上引号；②站在说话人的角度：说话人自己称「我」，对听话的人称「你」；③句末标点放在引号里面',
          `${x.sp}，转述的「${x.jq}」用说话人自己的口气说是「${x.q}」`,
          `「${ws[0].s}」${ws[0].why}`,
          `所以选「${ok}」`,
        ],
      };
    },
  },
  bingyinSkill({ id: 'y5a-ju-bingyin', grade: 5, term: 1, name: '病句：找病因（提高）', tip: '先抓主干看缺不缺成分，再查搭配、重复、语序，最后看前后矛不矛盾、合不合道理', level: 2 }, 5, BING_TYPES5),
  {
    ...base, id: 'y5a-ju-guanxi', grade: 5, term: 1, unit: '句子', name: '关联词表示的关系',
    tip: '看成对的关联词，也想前后两部分的意思：并列、递进、转折、因果、假设、条件、选择', level: 2,
    gen(r) {
      const it = r.pick(GX);
      const conf = REL_CONF[it.t];
      const rest = Object.keys(REL_DEF).filter((t) => t !== it.t && t !== conf);
      return {
        q: `句子中的关联词表示什么关系？\n${it.s}`,
        answer: [{ kind: 'choice', options: r.shuffle([it.t, conf, ...r.sample(rest, 2)]), value: it.t }],
        steps: [
          '判断关系：先找句子里成对的关联词，再想前后两部分的意思',
          `「${it.k}」表示${it.t}关系：${REL_DEF[it.t]}`,
          `别看成${conf}关系：${REL_DEF[conf]}`,
          `所以选「${it.t}」`,
        ],
      };
    },
  },
  wubingSkill({ id: 'y5b-ju-wubing', grade: 5, term: 2, name: '选没有语病的句子（提高）', tip: '一句一句查：成分、搭配、重复、语序，再看前后矛不矛盾、合不合道理', level: 2 }, 5),
  guanlianSkill({ id: 'y5b-ju-guanlian', grade: 5, term: 2, name: '选成对的关联词', tip: '成对的关联词不能乱搭：只有……才、只要……就、即使……也、无论……都，看前后的意思选', level: 2 }, GL5),

  // ---------------- 标点与修辞 ----------------
  {
    ...base, id: 'y1b-bd-jumo', grade: 1, term: 2, unit: '标点与修辞', name: '句末标点',
    tip: '说一件事用句号；问问题用问号；感情很强烈或大声喊用感叹号', level: 1,
    gen(r) {
      const it = r.pick(JUMO);
      let why = '这句话是平平常常地告诉别人一件事';
      if (it.p === '？') { const c = JUMO_Q.find((w) => it.s.includes(w)); why = c ? `句子里有「${c}」，是在问别人问题` : '这句话是在问别人问题'; }
      if (it.p === '！') { const m = JUMO_EXCL.find(([re]) => re.test(it.s)); why = m ? `句子里有「${m[1]}」，表达了很强烈的感情` : '这句话是在大声地喊，感情很强烈'; }
      return {
        q: `句子末尾该用什么标点？\n${it.s}{0}`,
        answer: [{ kind: 'choice', options: r.shuffle(['。', '？', '！']), value: it.p }],
        steps: ['平常地说一件事用句号「。」；问别人问题用问号「？」；表达很强烈的感情或大声地喊用感叹号「！」', why, `所以用「${it.p}」：${it.s}${it.p}`],
      };
    },
  },
  {
    ...base, id: 'y2a-bd-dunhao', grade: 2, term: 1, unit: '标点与修辞', name: '逗号还是顿号',
    tip: '并列的词语中间用顿号「、」；一句话中间停顿用逗号「，」', level: 1,
    gen(r) {
      const it = r.pick(DUNHAO);
      const why = it.p === '、' ? '这里前后是并列的词语，一样一样地列出来，中间用顿号' : '这里不是在列举并列的词语，是一句话中间的停顿，用逗号';
      return {
        q: `（　）里填逗号还是顿号？\n${it.s.replace('__', '{0}')}`,
        answer: [{ kind: 'choice', options: r.shuffle(['，', '、']), value: it.p }],
        steps: ['顿号「、」用在句子里并列的词语中间；逗号「，」用在一句话中间需要停顿的地方', why, `填好：${it.s.replace('__', it.p)}`],
      };
    },
  },
  {
    ...base, id: 'y3a-bd-yinhao', grade: 3, term: 1, unit: '标点与修辞', name: '冒号和引号',
    tip: '提示语在前用冒号；在后，提示语后用句号；在中间，说的话分两半都加引号', level: 1,
    gen(r) {
      const { p, a, b, e } = r.pick(YINHAO);
      const e2 = e === '。' ? '，' : e;
      const pos = r.pick(['前', '后', '中']);
      let ok, ws, rule;
      if (pos === '前') {
        ok = `${p}：“${a}，${b}${e}”`;
        rule = '提示语在前：提示语后面用冒号，说的话用引号引起来，句末标点放在引号里面';
        ws = [
          { s: `${p}，“${a}，${b}${e}”`, why: '提示语后面要用冒号，不是逗号' },
          { s: `${p}：“${a}，${b}”${e}`, why: '句末标点要放在引号里面' },
          { s: `${p}“${a}，${b}${e}”`, why: '提示语后面少了冒号' },
          { s: `${p}：${a}，${b}${e}`, why: '说的话没有加引号' },
        ];
      } else if (pos === '后') {
        ok = `“${a}，${b}${e2}”${p}。`;
        rule = '提示语在后：引号里句末的句号要改成逗号（问号、感叹号不变），提示语后面用句号';
        ws = [
          { s: `“${a}，${b}${e2}”${p}：`, why: '提示语在后面，末尾用句号，不用冒号' },
          e === '。' ? { s: `“${a}，${b}。”${p}。`, why: '提示语在后面，引号里的句号要改成逗号' } : { s: `“${a}，${b}”${e}${p}。`, why: `「${e}」要放在引号里面` },
          { s: `“${a}，${b}${e2}”，${p}。`, why: '引号后面不能再加逗号' },
          { s: `“${a}，${b}${e2}”${p}`, why: '句子末尾少了句号' },
        ];
      } else {
        ok = `“${a}，”${p}，“${b}${e}”`;
        rule = '提示语在中间：说的话分成两半，两半都要加引号，提示语不放进引号里；前一半末尾的逗号放在引号里面';
        ws = [
          { s: `“${a}，${p}，${b}${e}”`, why: '提示语不能放进引号里' },
          { s: `“${a}，”${p}，${b}${e}`, why: '后一半说的话也要加引号' },
          { s: `“${a}”，${p}，“${b}${e}”`, why: '前一半末尾的逗号要放在引号里面' },
          { s: `${a}，${p}，“${b}${e}”`, why: '前一半说的话也要加引号' },
        ];
      }
      const m = mc(r, ok, ws);
      return {
        q: `选出标点用得正确的一句（提示语在${pos === '中' ? '中间' : pos + '面'}）：`,
        answer: [m.answer],
        steps: [rule, ...m.ws.map((w) => `「${w.s}」${w.why}`), `所以选「${ok}」`],
      };
    },
  },
  {
    ...base, id: 'y3a-bd-shibushi', grade: 3, term: 1, unit: '标点与修辞', name: '是不是比喻句',
    tip: '比喻要把一种事物比作另一种不同的事物；有「像」不一定是比喻（比较、猜测、想象、举例都不是）', level: 1,
    gen(r) {
      const yes = r.bool();
      const it = yes ? r.pick(BIYU) : r.pick(FEIBIYU);
      return {
        q: `判断：这句话是比喻句吗？\n${it.s}`,
        answer: [{ kind: 'choice', options: ['√', '×'], value: yes ? '√' : '×' }],
        steps: [
          '比喻句要有两种不同的事物，一种比作另一种，它们有相似的地方；句子里有「像」不一定是比喻',
          yes ? `把「${it.ben}」比作「${it.yu}」，两种不同的事物有相似的地方` : it.why,
          yes ? '所以是比喻句，打 √' : '所以不是比喻句，打 ×',
        ],
        hint: '找一找：是不是拿一种东西去比另一种不一样的东西？',
      };
    },
  },
  {
    ...base, id: 'y3a-bd-bentiyuti', grade: 3, term: 1, unit: '标点与修辞', name: '找本体和喻体',
    tip: '被比的事物是本体，拿来打比方的事物是喻体', level: 1,
    gen(r) {
      const it = r.pick(BIYU);
      const askBen = r.bool();
      const ans = askBen ? it.ben : it.yu;
      return {
        q: `这个比喻句的${askBen ? '本体' : '喻体'}是什么？\n${it.s}`,
        answer: [{ kind: 'choice', options: r.shuffle([it.ben, it.yu, it.o]), value: ans }],
        steps: [
          '比喻句里，被比的事物叫本体，拿来打比方的事物叫喻体',
          `这句话把「${it.ben}」比作「${it.yu}」`,
          `本体是「${it.ben}」，喻体是「${it.yu}」；「${it.o}」既不是本体也不是喻体`,
          `所以选「${ans}」`,
        ],
        hint: '先想：这句话把什么比作了什么？',
      };
    },
  },
  xiuciSkill({ id: 'y3b-bd-xiuci', grade: 3, term: 2, name: '判断修辞手法', tip: '比喻：把甲比作乙；拟人：把物当作人写；夸张：故意往大或往小里说', level: 1 }, ['比喻', '拟人', '夸张']),
  {
    ...base, id: 'y4a-bd-shenglue', grade: 4, term: 1, unit: '标点与修辞', name: '省略号的作用',
    tip: '省略号：列举的省略、说话断断续续、声音的延续、话没说完', level: 2,
    gen(r) {
      const it = r.pick(SHENGLUE);
      const others = [1, 2, 3, 4].filter((f) => f !== it.f && !(it.x || []).includes(f));
      return {
        q: `句子中省略号的作用是什么？\n${bold(it.s, '……')}`,
        answer: [{ kind: 'choice', options: r.shuffle([it.f, ...others]).map((f) => SL_F[f]), value: SL_F[it.f] }],
        steps: [
          '省略号常见的作用：①列举的省略 ②说话断断续续 ③声音的延续 ④话没说完、意思没有说尽；看省略号前后写的是什么',
          SL_WHY[it.f],
          ...(it.f === 4 && (it.x || []).includes(2) ? ['说话的人并不慌张，是有意不往下说'] : []),
          ...(it.f === 2 ? ['话被省略号断成了好几截，这是说话断断续续'] : []),
          `所以选「${SL_F[it.f]}」`,
        ],
      };
    },
  },
  xiuciSkill({ id: 'y4a-bd-xiuci', grade: 4, term: 1, name: '判断修辞（加排比）', tip: '比喻、拟人、夸张、排比：排比是三个或以上结构相同的句子连在一起', level: 2 }, ['比喻', '拟人', '夸张', '排比']),
  {
    ...base, id: 'y4b-bd-pozhe', grade: 4, term: 2, unit: '标点与修辞', name: '破折号的作用',
    tip: '破折号：解释说明、声音的延长、话题的转换', level: 2,
    gen(r) {
      const it = r.pick(POZHE);
      return {
        q: `句子中破折号的作用是什么？\n${bold(it.s, '——')}`,
        answer: [{ kind: 'choice', options: r.shuffle([1, 2, 3]).map((f) => PZ_F[f]), value: PZ_F[it.f] }],
        steps: [
          '破折号常见的作用：①解释说明 ②声音的延长 ③话题的转换；看破折号后面接的是什么',
          PZ_WHY[it.f],
          `所以选「${PZ_F[it.f]}」`,
        ],
      };
    },
  },
  {
    ...base, id: 'y5a-bd-zuoyong', grade: 5, term: 1, unit: '标点与修辞', name: '修辞的作用',
    tip: '先认出修辞手法，再说把什么写成了什么、写出了事物的什么特点', level: 2,
    gen(r) {
      const it = r.pick(ZUOYONG);
      const pair = (s) => { const m = s.match(/把(.+?)比作(.+?)，/); return m ? [m[1], m[2]] : null; };
      const okPair = pair(it.ok);
      const whyNo = (s) => {
        const name = (s.match(/^运用(.+?)，/) || [])[1];
        if (name && name !== it.r) return `「${s}」修辞手法认错了，这句用的是${it.r}`;
        const p = pair(s);
        if (okPair && p && p[0] === okPair[1] && p[1] === okPair[0]) return `「${s}」把本体和喻体说反了`;
        const nm = s.match(/把(.+?)当作(.+?)来写/), om = it.ok.match(/把(.+?)当作人来写/);
        if (nm && nm[2] !== '人') return `「${s}」说反了，拟人是把事物当作人来写`;
        if (nm && om && nm[1] !== om[1]) return `「${s}」说错了，这句是把「${om[1]}」当作人来写`;
        if (/减弱/.test(s)) return `「${s}」说错了，排比是加强语气`;
        return `「${s}」写出的特点和句子里写的不一样`;
      };
      const no2 = r.sample(it.no, 2);
      return {
        q: `下面这句话用了什么修辞，有什么作用？选最恰当的说法。\n${it.s}`,
        answer: [{ kind: 'choice', options: r.shuffle([it.ok, ...it.no]), value: it.ok }],
        steps: [
          '说修辞的作用：先认出修辞手法，再说清楚把什么写成了什么，写出了事物的什么特点',
          ...no2.map(whyNo),
          `所以选「${it.ok}」`,
        ],
      };
    },
  },
  {
    ...base, id: 'y5b-bd-zhengque', grade: 5, term: 2, unit: '标点与修辞', name: '选标点正确的句子',
    tip: '逐句查：句末标点合不合语气、并列词语用顿号、引号冒号的位置、省略号后不加「等」', level: 2,
    gen(r) {
      const ok = r.pick(BD_OK);
      const bad = r.sample(BD_BAD, 3);
      return {
        q: '下面哪一句标点符号用得完全正确？',
        answer: [{ kind: 'choice', options: r.shuffle([ok, ...bad.map((b) => b.s)]), value: ok }],
        steps: [
          '逐句检查：句末标点和语气合不合，并列的词语用顿号，引号、冒号放的位置对不对',
          ...bad.map((b) => `「${b.s}」${b.why}`),
          `只有「${ok}」标点全对`,
        ],
      };
    },
  },
  xiuciSkill({ id: 'y6a-bd-xiuci', grade: 6, term: 1, name: '判断修辞（七种）', tip: '比喻、拟人、夸张、排比、设问（自问自答）、反问（只问不答）、对偶（两句对称）', level: 3 },
    ['比喻', '拟人', '夸张', '排比', '设问', '反问', '对偶'], { newKinds: ['设问', '反问', '对偶'], n: 4 }),
];
