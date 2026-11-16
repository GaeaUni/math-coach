// 词语积累 · 成语：补全成语、成语的意思、选用成语、成语里的错别字、近义 / 反义成语、按类别积累成语；六年级加谦辞敬辞。
// 三年级上册到六年级下册（统编版）。成语故事（积累运用）、听写成语（识字写字）、歇后语、谚语、名言在别的板块。
import { CY34 } from './data/ci-cy-dict34.js';
import { CY56 } from './data/ci-cy-dict56.js';
import { GLOSS } from './data/ci-cy-gloss.js';
import { USE4, USE6 } from './data/ci-cy-use.js';
import { JIN, FAN, NUM, NUM_AMBIG, ANIMAL, ANIMAL_AMBIG, ANT, ANT_AMBIG, LEI3, LEI5 } from './data/ci-cy-pair.js';
import { CUO } from './data/ci-cy-cuo.js';
import { QJ, QJ_USE, QJ_NEAR } from './data/ci-cy-qianjing.js';
import { zixing } from './data/zibiao.js';

const UNIT = '词语积累';
const quote = (arr) => arr.map((x) => `「${x}」`).join('');
const slot = (s) => s.replace('（ ）', '{0}');
const fillIn = (s, w) => s.replace('（ ）', `**${w}**`);

// ---------- 词条 ----------
const DICT = [...CY34, ...CY56].map(([w, g, m, p, b, k, t]) => ({
  w, g, m, p, t,
  b: b ? b.split(' ').map((s) => ({ c: [...s][0], ds: [...s].slice(1) })) : [],
  k: k.split(' '),
}));
const BY = new Map(DICT.map((x) => [x.w, x]));
const sameKind = (x, y) => x.k.some((k) => y.k.includes(k));
const segs = (x) => x.p.split('；').map((s) => s.split('：'));
const readP = (x) => segs(x).map(([a, b]) => `「${a}」是${b}`).join('，');
const meanOf = (w) => (BY.get(w) ? BY.get(w).m : '');
const gloss = (d) => (GLOSS[d] ? `「${d}」是「${GLOSS[d]}」的${d}` : `「${d}」`);
// 讲某个字：拆字里含这个字的那一段
function charNote(x, c) {
  const s = segs(x).find(([a]) => a.includes(c));
  return s ? `「${s[0]}」是${s[1]}` : '';
}

// ---------- 补全成语（选字） ----------
function buSkill(id, grade, term, name, level, filter) {
  const pool = DICT.filter(filter).flatMap((x) => x.b.map((bl) => ({ x, bl })));
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level,
    tip: '补全成语：先想成语的意思，再想缺的是哪个字',
    gen(r) {
      const { x, bl } = r.pick(pool);
      const ds = r.sample(bl.ds, 3);
      const d = ds.includes(bl.ds[0]) ? bl.ds[0] : ds[0];
      const note = charNote(x, bl.c);
      return {
        q: `补全成语：\n${x.w.replace(bl.c, '{0}')}`,
        answer: [{ kind: 'choice', options: r.shuffle([bl.c, ...ds]), value: bl.c }],
        steps: [
          `先想意思：「${x.w}」，${x.m}`,
          note ? `再想缺的字：${note}，所以是「${bl.c}」` : `拆开看：${readP(x)}，缺的是「${bl.c}」`,
          `写成「${x.w.replace(bl.c, d)}」不对：${gloss(d)}，和意思对不上`,
          `所以填「${bl.c}」：${x.w}`,
        ],
        hint: x.m.includes(bl.c) ? '先想一想这个成语是什么意思' : `这个成语的意思是：${x.m}`,
      };
    },
  };
}

// ---------- 补全成语（写字） ----------
function xieSkill(id, grade, term, name, level, filter) {
  // 缺的字不能出现在题干别处（意思里、「补全成语」「意思」这几个字里）
  const okc = (x, bl) => !(x.m + '补全成语写出缺的字意思').includes(bl.c);
  const pool = DICT.filter(filter).flatMap((x) => {
    const bs = x.b.filter((bl) => okc(x, bl));
    const two = bs.slice(0, 2).sort((u, v) => x.w.indexOf(u.c) - x.w.indexOf(v.c));
    return [...bs.map((bl) => [bl]), ...(bs.length >= 2 ? [two] : [])].map((bls) => ({ x, bls }));
  });
  const shape = (c) => {
    const z = zixing(c);
    return z ? `「${c}」${z.n} 画${z.st ? `，${z.st}结构` : ''}${z.order ? `：${z.order}` : ''}` : '';
  };
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level,
    tip: '补全成语：先想成语的意思，再想缺的字，按意思写，别写成同音字',
    gen(r) {
      const { x, bls } = r.pick(pool);
      let q = x.w;
      bls.forEach((bl, i) => { q = q.replace(bl.c, `{${i}}`); });
      const cs = bls.map((bl) => bl.c);
      const notes = [...new Set(bls.map((bl) => charNote(x, bl.c)).filter(Boolean))];
      const shapes = cs.map(shape).filter(Boolean);
      return {
        q: `补全成语，写出缺的字：\n${q}\n意思：${x.m}`,
        answer: bls.map((bl) => ({ kind: 'hanzi', value: bl.c })),
        steps: [
          `先想意思：${x.m}`,
          notes.length ? `${notes.join('，')}，所以缺的是${quote(cs)}` : `拆开看：${readP(x)}，缺的是${quote(cs)}`,
          `别写成同音字或形近字：${bls.map((bl) => gloss(bl.ds[0])).join('，')}`,
          ...(shapes.length ? [shapes.join('；')] : []),
          `写完读一读：${x.w}`,
        ],
        hint: '读一读这个成语，想想缺的字是什么意思',
      };
    },
  };
}

// ---------- 成语的意思 ----------
// 干扰项：望文生义的错误理解 + 意思类别不同的成语的意思（优先和本题有相同字的成语，看起来更像）
function otherIdioms(r, x, n, pool) {
  const cands = pool.filter((y) => y.w !== x.w && !sameKind(x, y) && y.m !== x.m);
  const share = r.shuffle(cands.filter((y) => [...y.w].some((c) => x.w.includes(c))));
  const rest = r.shuffle(cands.filter((y) => !share.includes(y)));
  return [...share.slice(0, 1), ...rest].slice(0, n);
}
function yisiSkill(id, grade, term, name, level, filter) {
  const pool = DICT.filter(filter);
  const near = DICT.filter((y) => y.g <= grade);
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level,
    tip: '理解成语：拆开每个字的意思，再连起来想整个成语说的是什么',
    gen(r) {
      const x = r.pick(pool);
      if (r.bool()) {
        const others = otherIdioms(r, x, x.t ? 2 : 3, near);
        const o = others[0];
        return {
          q: `「${x.w}」是什么意思？`,
          answer: [{ kind: 'choice', options: r.shuffle([x.m, ...(x.t ? [x.t] : []), ...others.map((y) => y.m)]), value: x.m }],
          steps: [
            `拆开每个字：${readP(x)}`,
            `连起来：${x.m}`,
            x.t ? `「${x.t}」是只看字面瞎猜的，不对` : `「${o.m}」说的是「${o.w}」`,
            `所以「${x.w}」的意思是：${x.m}`,
          ],
          hint: '先说说成语里几个关键字的意思',
        };
      }
      const others = otherIdioms(r, x, 3, near);
      const o = others[0];
      return {
        q: `哪个成语的意思是：\n${x.m}`,
        answer: [{ kind: 'choice', options: r.shuffle([x.w, ...others.map((y) => y.w)]), value: x.w }],
        steps: [
          `拆开「${x.w}」：${readP(x)}`,
          `连起来正是：${x.m}`,
          `「${o.w}」的意思是${o.m}，对不上`,
          `所以选「${x.w}」`,
        ],
        hint: '把每个成语的字拆开想一想，哪个和这个意思对得上？',
      };
    },
  };
}

// ---------- 选用成语 ----------
function yongSkill(id, grade, term, name, level, list) {
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level,
    tip: '选用成语：先看句子说的是什么情况，成语的意思、感情色彩、说的对象都要对得上',
    gen(r) {
      const [s, a, ds, sit, why] = r.pick(list);
      return {
        q: `选出最恰当的成语填空：\n${slot(s)}`,
        answer: [{ kind: 'choice', options: r.shuffle([a, ...ds.split(' ')]), value: a }],
        steps: [`先看句子：说的是${sit}`, `「${a}」${meanOf(a)}，放进去正合适`, why, `所以填「${a}」`],
        hint: '先说说这句话写的是什么情况，再看哪个成语的意思对得上',
      };
    },
  };
}

// ---------- 近义 / 反义成语 ----------
const antiK = new Map();
for (const [a, b] of FAN) for (const ka of BY.get(a).k) for (const kb of BY.get(b).k) {
  if (!antiK.has(ka)) antiK.set(ka, new Set());
  if (!antiK.has(kb)) antiK.set(kb, new Set());
  antiK.get(ka).add(kb); antiK.get(kb).add(ka);
}
const near = (w) => JIN.filter((g) => g.includes(w)).flat().filter((y) => y !== w);
const anti = (w) => FAN.filter((p) => p.includes(w)).map((p) => (p[0] === w ? p[1] : p[0]));
// 近反义题的其余干扰项要和题目「不在一个大类」：意思类别再细也难免漏掉沾边的（如「一丝不苟」和「三心二意」），
// 所以按大类整个避开，只从别的大类里挑。没列出的类别自成一类。
const FAMILY = {
  心情: '吃惊 生气 没精神 低落 高兴 无忧 不安 担心 从容 害怕 慌 发愁 失望 急躁 激动 得意 满意 尴尬 痛苦 舒畅 有精神 累 急 平和 和气 胆小 骄傲 怀疑 相信 明白 不明白 难以理解 想 笑 跃跃欲试 控制不住 尊敬 赞美',
  做事: '严肃 专心 分心 认真 粗心 谨慎 坚持 奋发 继续努力 放弃 白费 完成 果断 不干脆 抓紧 紧急 按顺序 新颖 守旧 死板 尽职 尽心 讲理 得体 实际 有紧有松 恰当 无顾忌 不上进 自受 理直 理亏 认输 想办法 谋略 没办法 绝境 不得不 敏捷 有兴趣 没兴趣 透彻 不透彻 清楚 说中要害 弄巧成拙 两得 高明 出众 比不上 牺牲 奋勇 偷偷摸摸 坦荡 无私 自私 享福 一致 团结 互相依靠 家和 更严重 收获大 没收获 空 自由 辛苦 警醒',
  说话: '好话 小声说 自语 人多嘴杂 吵闹 话少 安静 不说话 小声念 凄切',
  数量: '多 少 极少 极大 人多 不断 成群 多样 家家 美多 一样 不同 差不多 奇怪',
  景物: '秋天 春天 色彩 晴好 大雨 寒冷 平静 汹涌 山 气势 声势 生机 无生机 耀眼 华丽 美景 雪景 荒凉 辽阔 无尽 新气象 建筑 美好地方 光明 交通',
  名声: '有名 人人知道 受关注 没名气 少人知 传得快',
};
const FAM = new Map(Object.entries(FAMILY).flatMap(([f, ks]) => ks.split(' ').map((k) => [k, f])));
const famOf = (k) => FAM.get(k) || k;
function farIdioms(r, ws, n, pool) {
  const bad = new Set();
  for (const w of ws) for (const k of BY.get(w).k) { bad.add(k); bad.add(famOf(k)); for (const k2 of antiK.get(k) || []) { bad.add(k2); bad.add(famOf(k2)); } }
  const cands = pool.filter((y) => !ws.includes(y.w) && !y.k.some((k) => bad.has(k) || bad.has(famOf(k))));
  const share = r.shuffle(cands.filter((y) => [...y.w].some((c) => ws[0].includes(c))));
  const rest = r.shuffle(cands.filter((y) => !share.includes(y)));
  return [...share.slice(0, 1), ...rest].slice(0, n).map((y) => y.w);
}
function jinfanSkill(id, grade, term, name, level, ok) {
  const gOf = (w) => BY.get(w).g;
  const jin = JIN.filter((g) => ok(g.map(gOf))).flatMap((g) => g.flatMap((x) => g.filter((y) => y !== x).map((y) => [x, y])));
  const fan = FAN.filter((p) => ok(p.map(gOf))).flatMap(([a, b]) => [[a, b], [b, a]]);
  const pool = DICT.filter((y) => y.g <= grade);
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level,
    tip: '近义成语意思相近，反义成语意思相反：先说出这个成语的意思，再一个一个比',
    gen(r) {
      const isJin = r.bool();
      const [x, y] = r.pick(isJin ? jin : fan);
      const traps = (isJin ? anti(x) : near(x)).filter((t) => t !== y && BY.get(t).g <= grade);
      const trap = traps.length ? r.pick(traps) : null;
      const others = farIdioms(r, [x, y, ...(trap ? [trap] : [])], trap ? 2 : 3, pool);
      const rel = isJin ? '近义' : '反义';
      const o = trap || others[0];
      return {
        q: `「${x}」的${rel}成语是哪一个？`,
        answer: [{ kind: 'choice', options: r.shuffle([y, ...(trap ? [trap] : []), ...others]), value: y }],
        steps: [
          `先说「${x}」的意思：${meanOf(x)}`,
          `「${y}」${meanOf(y)}，意思${isJin ? '相近' : '正好相反'}`,
          trap ? `「${trap}」${meanOf(trap)}，意思${isJin ? '正好相反，是反义成语' : '相近，是近义成语'}，别选反了`
            : `「${o}」${meanOf(o)}，和「${x}」说的不是一回事`,
          `所以「${x}」的${rel}成语是「${y}」`,
        ],
        hint: `先说说「${x}」是什么意思`,
      };
    },
  };
}

// ---------- 按类别积累：看字分类（三年级） ----------
const has = (w, chars) => [...w].some((c) => chars.includes(c));
const pairsIn = (w, list) => list.filter((p) => w.includes(p[0]) && w.includes(p[1]));
const isABAC = (w) => w[0] === w[2] && w[1] !== w[3] && w[0] !== w[1];
const CAT3 = [
  { ask: '下面哪个成语里有表示数字的字？', yes: (w) => has(w, NUM), no: (w) => !has(w, NUM + NUM_AMBIG),
    why: (w) => `「${w}」里有数字${quote([...w].filter((c) => NUM.includes(c)))}`, not: '别的成语里都没有数字' },
  { ask: '下面哪个成语里有动物？', yes: (w) => has(w, ANIMAL), no: (w) => !has(w, ANIMAL + ANIMAL_AMBIG),
    why: (w) => `「${w}」里有动物${quote([...w].filter((c) => ANIMAL.includes(c)))}`, not: '别的成语里都没有动物' },
  { ask: '下面哪个成语里有一对意思相反（或相对）的字？', yes: (w) => pairsIn(w, ANT).length > 0, no: (w) => !pairsIn(w, [...ANT, ...ANT_AMBIG]).length,
    why: (w) => `「${w}」里${pairsIn(w, ANT).map((p) => `「${p[0]}」和「${p[1]}」`).join('、')}意思相反`, not: '别的成语里找不到意思相反的一对字' },
  { ask: '下面哪个成语和「自言自语」一样，第一个字和第三个字相同？', yes: (w) => isABAC(w) && w !== '自言自语', no: (w) => !isABAC(w),
    why: (w) => `「${w}」第一个字和第三个字都是「${w[0]}」`, not: '别的成语第一个字和第三个字都不一样' },
].map((c) => ({ ...c, pos: LEI3.filter(c.yes), neg: LEI3.filter(c.no) }));
function lei3Skill(id, grade, term, name, level) {
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level,
    tip: '按类别积累成语：一个字一个字地找，看有没有数字、动物、一对相反的字',
    gen(r) {
      const c = r.pick(CAT3);
      const w = r.pick(c.pos);
      const ds = r.sample(c.neg, 3);
      return {
        q: c.ask,
        answer: [{ kind: 'choice', options: r.shuffle([w, ...ds]), value: w }],
        steps: ['一个字一个字地看，按要求找', c.why(w), c.not, `所以选「${w}」`],
        hint: '把每个成语的四个字都看一遍',
      };
    },
  };
}

// ---------- 按类别积累：按意思分类（五年级） ----------
const LEI5_ALL = LEI5.flatMap((c) => c.items.map(([w, note]) => ({ c, w, note })));
function lei5Skill(id, grade, term, name, level) {
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level,
    tip: '按意思积累成语：抓住成语里的关键字，想想它写的是什么',
    gen(r) {
      const x = r.pick(LEI5_ALL);
      const ds = r.sample(LEI5_ALL.filter((y) => y.c !== x.c), 3);
      const d = ds[0];
      return {
        q: `下面哪个成语是${x.c.ask}？`,
        answer: [{ kind: 'choice', options: r.shuffle([x.w, ...ds.map((y) => y.w)]), value: x.w }],
        steps: ['抓住关键字，想想每个成语写的是什么', `「${x.w}」：${x.note}，是${x.c.ask}`, `「${d.w}」：${d.note}，是${d.c.ask}`, `所以选「${x.w}」`],
        hint: '每个成语说的是什么？找找关键字',
      };
    },
  };
}

// ---------- 成语里的错别字 ----------
function cuoziSkill(id, grade, term, name, level) {
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level,
    tip: '找错别字：按意思想字，成语里每个字都要和意思对得上',
    gen(r) {
      const [x, ...rest] = r.sample(CUO, 4);
      const [w, c, d, note] = x;
      const wrong = w.replace(c, d);
      return {
        q: '下面哪个成语里有错别字？',
        answer: [{ kind: 'choice', options: r.shuffle([wrong, ...rest.map((y) => y[0])]), value: wrong }],
        steps: [
          '按意思想字：看每个字和成语的意思对不对得上',
          `「${wrong}」写错了：${note}`,
          `正确的写法是「${w}」：${meanOf(w)}`,
          `别的三个都写对了，所以选「${wrong}」`,
        ],
        hint: '读一读，想想每个字在成语里是什么意思',
      };
    },
  };
}

// ---------- 谦辞敬辞 ----------
const QJM = new Map(QJ.map(([w, t, m, g, note, mirror]) => [w, { w, t, m, g, note, mirror }]));
const QJS = [...QJM.values()];
const kindWord = (x) => (x.t === '谦' ? '是谦辞，' : x.t === '敬' ? '是敬辞，' : '：');
function qjOthers(r, x, key) {
  const isNear = (y) => QJ_NEAR.some((p) => p.includes(x.w) && p.includes(y.w));
  const same = QJS.filter((y) => y.g === x.g && y.w !== x.w && y.m !== x.m && y[key] !== x[key] && !isNear(y));
  const mirror = x.mirror && QJM.get(x.mirror);
  const out = [];
  for (const y of [...(mirror ? [mirror] : []), ...r.shuffle(same.filter((z) => z !== mirror))]) if (!out.some((z) => z.m === y.m)) out.push(y);
  return out.slice(0, 3);
}
function qianjingSkill(id, grade, term, name, level) {
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level,
    tip: '谦辞说自己一方，把自己放低；敬辞说对方，表示尊敬。先看关键字，再看说的是谁',
    gen(r) {
      const kind = r.int(0, 2);
      if (kind === 2) {
        const t = r.pick(['谦', '敬']);
        const a = r.pick(QJS.filter((y) => y.t === t));
        const ds = r.sample(QJS.filter((y) => y.t === (t === '谦' ? '敬' : '谦')), 3);
        const d = ds[0];
        return {
          q: `下面哪个词是${t}辞？`,
          answer: [{ kind: 'choice', options: r.shuffle([a.w, ...ds.map((y) => y.w)]), value: a.w }],
          steps: [
            '谦辞说自己一方，把自己放低；敬辞说对方，表示尊敬',
            `「${a.w}」指${a.m}，${a.note}，是${t}辞`,
            `「${d.w}」指${d.m}，是${d.t}辞`,
            `所以选「${a.w}」`,
          ],
          hint: '看看每个词说的是自己，还是对方',
        };
      }
      const x = r.pick(QJS);
      const os = qjOthers(r, x, 'm');
      const o = os[0];
      if (kind === 0) {
        return {
          q: `「${x.w}」是什么意思？`,
          answer: [{ kind: 'choice', options: r.shuffle([x.m, ...os.map((y) => y.m)]), value: x.m }],
          steps: [x.note, `「${x.w}」${kindWord(x)}指${x.m}`, `比一比：「${o.w}」才是指${o.m}`, `所以选「${x.m}」`],
          hint: '先看第一个字：它是在说自己，还是在说对方？',
        };
      }
      return {
        q: `下面哪个词的意思是「${x.m}」？`,
        answer: [{ kind: 'choice', options: r.shuffle([x.w, ...os.map((y) => y.w)]), value: x.w }],
        steps: [`先想说的是谁、是什么事：${x.m}`, `「${x.w}」${kindWord(x)}${x.note}`, `「${o.w}」指的是${o.m}，不对`, `所以用「${x.w}」`],
        hint: '说的是自己一方，还是对方？',
      };
    },
  };
}
function qjYongSkill(id, grade, term, name, level) {
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level,
    tip: '用谦辞敬辞：先看是谁对谁说话、说的是谁，说自己用谦辞，说对方用敬辞',
    gen(r) {
      const [s, a, ds, why] = r.pick(QJ_USE);
      const d = ds.split(' ')[0];
      const am = QJM.get(a).m;
      if (r.bool()) {
        return {
          q: `选出最恰当的词填空：\n${slot(s)}`,
          answer: [{ kind: 'choice', options: r.shuffle([a, ...ds.split(' ')]), value: a }],
          steps: ['先看是谁对谁说话、说的是谁', `「${a}」指${am}，用在这里正合适`, why, `所以填「${a}」`],
          hint: '这句话说的是自己一方，还是对方？',
        };
      }
      const right = r.bool();
      return {
        q: `这句话里加点的词用得恰当吗？\n${fillIn(s, right ? a : d)}`,
        answer: [{ kind: 'choice', options: ['√', '×'], value: right ? '√' : '×' }],
        steps: right
          ? ['先看是谁对谁说话、说的是谁', `「${a}」指${am}，用在这里正合适`, `如果换成「${d}」就错了：${why}`, '所以用得恰当，选 √']
          : ['先看是谁对谁说话、说的是谁', why, `应该用「${a}」：${am}`, '所以用得不恰当，选 ×'],
        hint: '这个词说的是自己，还是对方？和句子对得上吗？',
      };
    },
  };
}

// ---------- 题型清单 ----------
export default [
  // 三年级
  buSkill('y3a-ci-cy-bu', 3, 1, '补全成语', 1, (x) => x.g === 3),
  yisiSkill('y3a-ci-cy-yisi', 3, 1, '成语的意思', 1, (x) => x.g === 3),
  lei3Skill('y3b-ci-cy-lei', 3, 2, '成语分分类', 1),
  xieSkill('y3b-ci-cy-xie', 3, 2, '写出成语缺的字', 2, (x) => x.g === 3),
  // 四年级
  buSkill('y4a-ci-cy-bu', 4, 1, '补全成语（四年级）', 2, (x) => x.g === 4),
  yisiSkill('y4a-ci-cy-yisi', 4, 1, '成语的意思（四年级）', 2, (x) => x.g === 4),
  yongSkill('y4b-ci-cy-xuanyong', 4, 2, '选用成语', 2, USE4),
  jinfanSkill('y4b-ci-cy-jinfan', 4, 2, '近义反义成语', 2, (gs) => Math.max(...gs) <= 4),
  // 五年级
  buSkill('y5a-ci-cy-bu', 5, 1, '补全成语（五年级）', 2, (x) => x.g === 5),
  yisiSkill('y5a-ci-cy-yisi', 5, 1, '成语的意思（五年级）', 2, (x) => x.g === 5),
  cuoziSkill('y5b-ci-cy-cuozi', 5, 2, '成语里的错别字', 2),
  lei5Skill('y5b-ci-cy-lei', 5, 2, '按意思积累成语', 2),
  // 六年级
  yisiSkill('y6a-ci-cy-yisi', 6, 1, '成语的意思（六年级）', 3, (x) => x.g === 6),
  yongSkill('y6a-ci-cy-xuanyong', 6, 1, '选用成语（高年级）', 3, USE6),
  qianjingSkill('y6a-ci-qianjing', 6, 1, '认识谦辞敬辞', 2),
  buSkill('y6b-ci-cy-bu', 6, 2, '补全成语（六年级）', 3, (x) => x.g === 6),
  jinfanSkill('y6b-ci-cy-jinfan', 6, 2, '近义反义成语（高年级）', 3, (gs) => Math.max(...gs) >= 5),
  qjYongSkill('y6b-ci-qianjing-yong', 6, 2, '用对谦辞敬辞', 3),
];
