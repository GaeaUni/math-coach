// 字音字形：多音字、形近字、同音字、平翘舌 / 前后鼻 / 边鼻音、错别字、易读错的字、一字多义。
import { DUOYIN, duoyinWords } from './data/ziyin-duoyin.js';
import { XINGJIN, xingjinWords } from './data/ziyin-xingjin.js';
import { TONGYIN, tongyinItems } from './data/ziyin-tongyin.js';
import { PINGQIAO, QIANHOU, BIANNIE, YIDU4, YIDU6 } from './data/ziyin-yin.js';
import { ZIYI } from './data/ziyin-ziyi.js';

const UNIT = '字音字形';
const LETTERS = ['A', 'B', 'C', 'D'];
const mark = (w, c) => w.replace(c, `**${c}**`);
const slot = (w, c) => w.replace(c, '{0}');
const quote = (arr) => arr.map((x) => `「${x}」`).join('');

// ---------- 多音字 ----------
const DY = duoyinWords(DUOYIN);
function duoyinOptions(x, grade) {
  const all = Object.keys(x.d.w);
  let opts = all.filter((py) => py === x.py || DY.some((y) => y.c === x.c && y.py === py && y.g <= grade));
  if (opts.length < 2) opts = all;
  return opts;
}
function duoyinSkill(id, grade, term, name, level, filter) {
  const pool = DY.filter(filter);
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level,
    tip: '多音字按意思读：先想这个字在词里是什么意思，再定读音',
    gen(r) {
      const x = r.pick(pool);
      const opts = duoyinOptions(x, grade);
      const ex = (py) => {
        const ws = DY.filter((y) => y.c === x.c && y.py === py && y.word !== x.word && y.g <= Math.max(grade, x.g)).map((y) => y.word);
        return ws.length ? `，如${quote(ws.slice(0, 2))}` : '';
      };
      return {
        q: `给加点的字选正确的读音：\n${mark(x.word, x.c)}`,
        answer: [{ kind: 'choice', options: r.shuffle(opts), value: x.py }],
        steps: [
          `「${x.c}」是多音字，意思不同，读音不同`,
          ...opts.map((py) => `读 ${py}：${x.d.why[py]}${ex(py)}`),
          `对照意思，「${x.word}」里的「${x.c}」读 ${x.py}`,
        ],
        hint: `想一想：「${x.word}」里的「${x.c}」是什么意思？`,
      };
    },
  };
}

// ---------- 形近字 ----------
const XJ = xingjinWords(XINGJIN);
function xingjinSkill(id, grade, term, name, level, tip, first, filter) {
  const pool = XJ.filter(filter);
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level, tip,
    gen(r) {
      const x = r.pick(pool);
      const others = r.sample([...x.grp.a].filter((ch) => ch !== x.c), 3);
      const d = others[0];
      const dw = x.grp.w[d] ? x.grp.w[d].split(/\s+/)[0] : '';
      return {
        q: `选字填空：\n${slot(x.word, x.c)}`,
        answer: [{ kind: 'choice', options: r.shuffle([x.c, ...others]), value: x.c }],
        steps: [
          `${quote([x.c, ...others])}${first}`,
          `「${x.c}」${x.grp.why[x.c]}：${x.word}`,
          `「${d}」${x.grp.why[d]}${dw ? `，如「${dw}」` : ''}，放在这里意思不对`,
          `所以填「${x.c}」：${x.word}`,
        ],
        hint: '想一想：这个词的意思和哪个偏旁、哪个部件对得上？',
      };
    },
  };
}

// ---------- 同音字 ----------
const TY = tongyinItems(TONGYIN);
const fill = (text, ch) => text.replace(/\{(.)\}/, ch);
function tongyinSkill(id, grade, term, name, level, filter) {
  const pool = TY.filter(filter);
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level,
    tip: '同音字看意思：读音一样，想想这里要表达的是什么意思',
    gen(r) {
      const x = r.pick(pool);
      const others = r.sample([...x.grp.a].filter((ch) => ch !== x.c), 3);
      const d = others[0];
      return {
        q: `选字填空：\n${x.text.replace(/\{(.)\}/, '{0}')}`,
        answer: [{ kind: 'choice', options: r.shuffle([x.c, ...others]), value: x.c }],
        steps: [
          `${quote([x.c, ...others])}都读 ${x.grp.py}，读音一样，要看意思`,
          `「${x.c}」${x.grp.why[x.c]}`,
          `「${d}」${x.grp.why[d]}，放在这里意思不对`,
          `所以填「${x.c}」：${fill(x.text, x.c)}`,
        ],
        hint: '读一读，想想这里要表达的是什么意思',
      };
    },
  };
}

// ---------- 平翘舌 / 前后鼻 / 边鼻音 ----------
function pairSkill(id, grade, term, name, tip, pairs, kind, method, hint) {
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level: 1, tip,
    gen(r) {
      const p = r.pick(pairs), i = r.int(0, 1);
      const [c, w, py] = p[i], [c2, w2, py2] = p[1 - i];
      return {
        q: `给加点的字选正确的读音：\n${mark(w, c)}`,
        answer: [{ kind: 'choice', options: r.shuffle([py, py2]), value: py }],
        steps: [method, `「${c}」读${kind(py)} ${py}：${w}`, `比一比：「${c2}」读${kind(py2)} ${py2}：${w2}`, `所以「${c}」选 ${py}`],
        hint,
      };
    },
  };
}
const qiao = (py) => (/^(zh|ch|sh)/.test(py) ? '翘舌音' : '平舌音');
const houbi = (py) => (/ng$/.test(py) ? '后鼻音' : '前鼻音');
const biannie = (py) => (/^n/.test(py) ? '鼻音 n' : '边音 l');

// ---------- 易读错的字 ----------
function yiduSkill(id, grade, term, name, level, list) {
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level,
    tip: '易读错的字：别按半边或习惯去读，按字典读音记牢',
    gen(r) {
      const [w, c, py, wr] = r.pick(list);
      return {
        q: `给加点的字选正确的读音：\n${mark(w, c)}`,
        answer: [{ kind: 'choice', options: r.shuffle([py, ...wr]), value: py }],
        steps: [
          '这是容易读错的字，要按字典的读音记',
          `「${w}」里的「${c}」读 ${py}`,
          `很多人读成 ${wr.join(' 或 ')}，这是错的`,
          `记住：${w}，「${c}」读 ${py}`,
        ],
        hint: '小心：别只看半边，也别跟着习惯读',
      };
    },
  };
}

// ---------- 读音全对的一项 ----------
function readingItems(dyFilter, yidu) {
  const items = DY.filter(dyFilter).map((x) => ({ word: x.word, c: x.c, py: x.py, wrong: Object.keys(x.d.w).filter((p) => p !== x.py) }));
  for (const [word, c, py, wrong] of yidu) items.push({ word, c, py, wrong });
  return items.filter((x) => x.wrong.length);
}
function quanduiReadSkill(id, grade, term, name, items) {
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level: grade >= 6 ? 3 : 2,
    tip: '逐项核对：多音字按词义定读音，易错字按字典读音，错一个就排除',
    gen(r) {
      const pick = r.until(() => r.sample(items, 12), (xs) => new Set(xs.map((x) => x.word)).size === 12);
      const k = r.int(0, 3);
      const lines = [], notes = [];
      for (let i = 0; i < 4; i++) {
        const group = pick.slice(i * 3, i * 3 + 3);
        const bad = i === k ? -1 : r.int(0, 2);
        const shown = group.map((x, j) => {
          if (j !== bad) return `${mark(x.word, x.c)}（${x.py}）`;
          const wp = r.pick(x.wrong);
          notes.push(`${LETTERS[i]} 项：「${x.word}」的「${x.c}」应读 ${x.py}，不读 ${wp}`);
          return `${mark(x.word, x.c)}（${wp}）`;
        });
        lines.push(`${LETTERS[i]}. ${shown.join('　')}`);
      }
      return {
        q: `下面加点字的读音完全正确的一项是（ ）\n${lines.join('\n')}`,
        answer: [{ kind: 'choice', options: LETTERS, value: LETTERS[k] }],
        steps: ['逐项核对：多音字按词义定读音，易错字按字典读音', ...notes, `只有 ${LETTERS[k]} 项全对`],
        hint: '每个词都读一读，有一个读错，这一项就不对',
      };
    },
  };
}

// ---------- 错别字（词语） ----------
// 词语来源：形近字的例词 + 同音字里本身就是词的条目（2~4 个字、不带标点）
const WORDS = [
  ...XJ.map((x) => ({ c: x.c, word: x.word, g: x.grp.g, grp: x.grp })),
  ...TY.filter((x) => /^[^，。]{2,4}$/.test(x.text.replace(/[{}]/g, ''))).map((x) => ({ c: x.c, word: fill(x.text, x.c), g: x.grp.g, grp: x.grp })),
];
const ALL_WORDS = new Set(WORDS.map((x) => x.word));
function miswrite(r, x) {
  const d = r.pick([...x.grp.a].filter((ch) => ch !== x.c));
  return { d, wrong: x.word.replace(x.c, d) };
}
function zhaocuoSkill(id, grade, term, name, filter) {
  const pool = WORDS.filter(filter);
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level: 2,
    tip: '找错别字：形近字看偏旁，同音字想意思，每个字都要和词义对得上',
    gen(r) {
      return r.until(() => {
        const xs = r.sample(pool, 4);
        const x = xs[0], { d, wrong } = miswrite(r, x);
        const opts = [wrong, ...xs.slice(1).map((y) => y.word)];
        if (new Set(opts).size < 4 || ALL_WORDS.has(wrong) || opts.slice(1).includes(x.word)) return null;
        return {
          q: '下面哪个词语里有错别字？',
          answer: [{ kind: 'choice', options: r.shuffle(opts), value: wrong }],
          steps: [
            '逐个看词语：形近字看偏旁，同音字想意思',
            `「${wrong}」写错了，应该是「${x.word}」`,
            `「${x.c}」${x.grp.why[x.c]}；「${d}」${x.grp.why[d]}`,
            `所以选「${wrong}」`,
          ],
          hint: '每个字的偏旁和意思，跟这个词对得上吗？',
        };
      }, (v) => v);
    },
  };
}

// ---------- 书写全对的一项 ----------
function zixingQuanduiSkill(id, grade, term, name, filter) {
  const pool = WORDS.filter(filter);
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level: 3,
    tip: '逐项检查字形：形近字看偏旁，同音字想意思，错一个字就排除',
    gen(r) {
      return r.until(() => {
        const xs = r.sample(pool, 12);
        if (new Set(xs.map((x) => x.word)).size < 12) return null;
        const k = r.int(0, 3);
        const lines = [], notes = [];
        for (let i = 0; i < 4; i++) {
          const group = xs.slice(i * 3, i * 3 + 3);
          const bad = i === k ? -1 : r.int(0, 2);
          const shown = group.map((x, j) => {
            if (j !== bad) return x.word;
            const { wrong } = miswrite(r, x);
            if (ALL_WORDS.has(wrong)) return null;
            notes.push(`${LETTERS[i]} 项：「${wrong}」应写作「${x.word}」`);
            return wrong;
          });
          if (shown.includes(null)) return null;
          lines.push(`${LETTERS[i]}. ${shown.join('　')}`);
        }
        return {
          q: `下面词语书写全部正确的一项是（ ）\n${lines.join('\n')}`,
          answer: [{ kind: 'choice', options: LETTERS, value: LETTERS[k] }],
          steps: ['逐项检查：形近字看偏旁，同音字想意思', ...notes, `只有 ${LETTERS[k]} 项全对`],
          hint: '每个词都看一看：偏旁和意思对得上吗？',
        };
      }, (v) => v);
    },
  };
}

// ---------- 句子里的错别字 ----------
const SUSPECT = new Set([...XINGJIN, ...TONGYIN].flatMap((g) => [...g.a]));
function gaicuoSkill(id, grade, term, name, filter) {
  const pool = TY.filter((x) => filter(x) && x.text.replace(/[{}，]/g, '').length >= 5);
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level: 2,
    tip: '先读懂句子，再看每个同音字、形近字放在这里意思对不对',
    gen(r) {
      return r.until(() => {
        const x = r.pick(pool);
        const plain = fill(x.text, x.c);
        const d = r.pick([...x.grp.a].filter((ch) => ch !== x.c && !plain.includes(ch)));
        if (!d) return null;
        const sent = fill(x.text, d);
        const chars = [...new Set([...sent].filter((ch) => /\p{Script=Han}/u.test(ch) && ch !== d && [...sent].filter((y) => y === ch).length === 1))];
        if (chars.length < 3) return null;
        const sus = r.shuffle(chars.filter((ch) => SUSPECT.has(ch)));
        const rest = r.shuffle(chars.filter((ch) => !SUSPECT.has(ch)));
        const others = [...sus, ...rest].slice(0, 3);
        return {
          q: `下面这句话里有一个错别字，是哪一个？\n${sent}。`,
          answer: [{ kind: 'choice', options: r.shuffle([d, ...others]), value: d }],
          steps: [
            '先读懂句子的意思，再逐个检查读音相同、字形相近的字',
            `「${d}」${x.grp.why[d]}，放在这里意思不对`,
            `这里要用「${x.c}」：${x.grp.why[x.c]}`,
            `改正：${plain}。`,
          ],
          hint: '哪个字的意思和句子对不上？',
        };
      }, (v) => v);
    },
  };
}

// ---------- 一字多义 ----------
const ZY = ZIYI.flatMap((e) => e.s.flatMap((s, si) => s.w.map((w) => ({ e, s, si, w }))));
function ziyiSkill(id, grade, term, name) {
  const pool = ZY.filter((x) => x.e.g === grade);
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level: 2,
    tip: '一个字有好几个意思，放回词语里想：这个词说的是什么',
    gen(r) {
      const x = r.pick(pool);
      const other = r.sample(x.e.s.filter((s) => s !== x.s), 3);
      const o = other[0];
      return {
        q: `加点的字在这里是什么意思？\n${mark(x.w, x.e.c)}`,
        answer: [{ kind: 'choice', options: r.shuffle([x.s.m, ...other.map((s) => s.m)]), value: x.s.m }],
        steps: [
          `「${x.e.c}」有好几个意思，要放回词语里想`,
          `「${x.w}」里的「${x.e.c}」是「${x.s.m}」的意思`,
          `比一比：「${o.w[0]}」里的「${x.e.c}」才是「${o.m}」`,
          `所以选「${x.s.m}」`,
        ],
        hint: `把「${x.w}」的意思说一说，「${x.e.c}」在里面指什么？`,
      };
    },
  };
}
function ziyiSameSkill(id, grade, term, name) {
  const pool = ZY.filter((x) => x.e.g === grade && x.s.w.length >= 2);
  return {
    id, subject: 'yw', grade, term, unit: UNIT, name, level: 3,
    tip: '先说出题目词里这个字的意思，再逐个对照选项里的词',
    gen(r) {
      const x = r.pick(pool);
      const ans = r.pick(x.s.w.filter((w) => w !== x.w));
      const other = r.sample(x.e.s.filter((s) => s !== x.s), 3).map((s) => ({ s, w: r.pick(s.w) }));
      const o = other[0];
      return {
        q: `下面哪个词里的「${x.e.c}」，和「${mark(x.w, x.e.c)}」里的「${x.e.c}」意思相同？`,
        answer: [{ kind: 'choice', options: r.shuffle([ans, ...other.map((y) => y.w)]), value: ans }],
        steps: [
          `先想「${x.w}」里的「${x.e.c}」：${x.s.m}`,
          `「${ans}」里的「${x.e.c}」也是「${x.s.m}」`,
          `「${o.w}」里的「${x.e.c}」是「${o.s.m}」，意思不同`,
          `所以选「${ans}」`,
        ],
        hint: `「${x.w}」里的「${x.e.c}」是什么意思？换个说法试试`,
      };
    },
  };
}

// ---------- 题型清单 ----------
const XJ_TIP_LOW = '形近字看偏旁：偏旁表示意思，和水有关用三点水';
const XJ_TIP_HIGH = '形近字先找不同的地方，再想意思：偏旁、笔画差一点都不行';

export default [
  // 一年级下
  duoyinSkill('y1b-zy-duoyin', 1, 2, '多音字读一读', 1, (x) => x.g === 1),
  xingjinSkill('y1b-zy-xingjin', 1, 2, '形近字看偏旁', 1, XJ_TIP_LOW, '这几个字有一部分一样，看偏旁分辨', (x) => x.grp.g === 1),
  tongyinSkill('y1b-zy-tongyin', 1, 2, '同音字选一选', 1, (x) => x.g === 1),
  // 二年级
  duoyinSkill('y2a-zy-duoyin', 2, 1, '多音字选读音', 1, (x) => x.g === 2),
  xingjinSkill('y2a-zy-xingjin', 2, 1, '形近字选一选', 1, XJ_TIP_LOW, '这几个字有一部分一样，看偏旁分辨', (x) => x.grp.g === 2),
  tongyinSkill('y2a-zy-tongyin', 2, 1, '同音字填一填', 1, (x) => x.g === 2),
  pairSkill('y2a-zy-pingqiao', 2, 1, '平舌音还是翘舌音', 'z c s 是平舌音，zh ch sh 是翘舌音，读时舌尖翘起来', PINGQIAO, qiao,
    'z c s 是平舌音，舌尖平伸；zh ch sh 是翘舌音，舌尖翘起来', '读一读：舌尖是平伸还是翘起来？'),
  pairSkill('y2a-zy-qianhou', 2, 1, '前鼻音还是后鼻音', 'an en in 是前鼻音；ang eng ing 后面多个 g，是后鼻音', QIANHOU, houbi,
    'an en in 是前鼻音，舌尖抵住上牙床；ang eng ing 是后鼻音，舌根往后缩，多一个 g', '读一读：最后舌头是顶在前面，还是往后缩？'),
  pairSkill('y2b-zy-biannie', 2, 2, '边音 l 还是鼻音 n', 'n 是鼻音，气从鼻子出来；l 是边音，气从舌头两边出来', BIANNIE, biannie,
    'n 是鼻音，捏住鼻子就发不出来；l 是边音，气从舌头两边出来', '读一读：捏住鼻子还能发出这个音吗？'),
  // 三年级
  duoyinSkill('y3a-zy-duoyin', 3, 1, '多音字辨读音', 2, (x) => x.g === 3),
  xingjinSkill('y3a-zy-xingjin', 3, 1, '形近字辨一辨', 2, XJ_TIP_HIGH, '这几个字长得像，先找出不同的地方', (x) => x.grp.g === 3),
  tongyinSkill('y3a-zy-tongyin', 3, 1, '同音字辨一辨', 2, (x) => x.g === 3),
  zhaocuoSkill('y3b-zy-zhaocuo', 3, 2, '找出错别字', (x) => x.g === 2 || x.g === 3),
  ziyiSkill('y3b-zy-ziyi', 3, 2, '一字多义'),
  // 四年级
  yiduSkill('y4a-zy-yidu', 4, 1, '易读错的字', 2, YIDU4),
  quanduiReadSkill('y4a-zy-quandui', 4, 1, '读音全对的一项', readingItems((x) => x.g >= 2, YIDU4)),
  gaicuoSkill('y4b-zy-gaicuo', 4, 2, '句子里的错别字', (x) => x.g <= 3),
  // 五年级
  xingjinSkill('y5a-zy-xingjin', 5, 1, '形近字（高年级）', 3, XJ_TIP_HIGH, '这几个字长得像，先找出不同的地方', (x) => x.grp.g === 5),
  tongyinSkill('y5a-zy-tongyin', 5, 1, '同音字（高年级）', 3, (x) => x.g === 5),
  ziyiSameSkill('y5a-zy-ziyi', 5, 1, '字义相同选一选'),
  zixingQuanduiSkill('y5b-zy-zixing', 5, 2, '书写全对的一项', (x) => x.g >= 3),
  // 六年级
  yiduSkill('y6a-zy-yidu', 6, 1, '易读错的字（六年级）', 3, YIDU6),
  quanduiReadSkill('y6a-zy-quandui', 6, 1, '读音全对（六年级）', readingItems((x) => x.g === 3, [...YIDU4, ...YIDU6])),
];
