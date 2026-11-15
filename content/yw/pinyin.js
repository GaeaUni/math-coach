// 语文 · 拼音 与 识字写字（汉字知识）
// 拼音：一年级上册（统编版 2024：识字单元之后学拼音）认声母韵母、四声、拼读、整体认读、标调、ü 的规则；一年级下册字母表、音序。
// 汉字知识：笔画名称、笔画数、笔顺和笔顺规则、偏旁和偏旁表示的意思、结构、加偏旁 / 换偏旁、查字典（二年级上册起）。
// 数据在 ./data/pinyin-*.js，读音、笔顺都用 tools/yw 的查字工具核对过，笔画名称按课本叫法。
import { ZI } from './data/pinyin-zi.js';
import { SYL } from './data/pinyin-syl.js';
import { BH, BH_HARD_EARLY, RULES, RULE_ZI, PARTS, PARTS_ZOU, PANG, PANG_ZI, BUSHOU, JIEGOU, FAM } from './data/pinyin-hz.js';

// ================= 通用 =================
const choice = (options, value) => ({ kind: 'choice', options, value });
/** 正确答案 + 依次从 prefer、fill 里补够 k 个不重复的选项，打乱 */
function opts(r, value, prefer = [], fill = [], k = 4) {
  const out = [value];
  for (const x of [...prefer, ...r.shuffle(fill)]) { if (out.length >= k) break; if (x && !out.includes(x)) out.push(x); }
  return r.shuffle(out);
}
const bold = (word, ch) => word.replace(ch, `**${ch}**`);
const uniq = (arr) => [...new Set(arr)];

// ================= 拼音工具 =================
const TONE = { a: 'āáǎà', o: 'ōóǒò', e: 'ēéěè', i: 'īíǐì', u: 'ūúǔù', ü: 'ǖǘǚǜ' };
const DE = {};
for (const [v, s] of Object.entries(TONE)) [...s].forEach((c, i) => { DE[c] = [v, i + 1]; });
const strip = (s) => [...s].map((c) => (DE[c] ? DE[c][0] : c)).join('');
const toneOf = (s) => { for (const c of s) if (DE[c]) return DE[c][1]; return 0; };
/** 标调口诀：有 a 不放过，没 a 找 o e，i u 并列标在后 */
function tonePos(b) {
  for (const v of ['a', 'o', 'e']) if (b.includes(v)) return b.indexOf(v);
  if (b.includes('iu')) return b.indexOf('iu') + 1;
  if (b.includes('ui')) return b.indexOf('ui') + 1;
  for (let k = 0; k < b.length; k++) if ('iuü'.includes(b[k])) return k;
  return -1;
}
const markAt = (b, k, t) => b.slice(0, k) + TONE[b[k]][t - 1] + b.slice(k + 1);
const mark = (b, t) => markAt(b, tonePos(b), t);
const TN = ['', '第一声', '第二声', '第三声', '第四声'];
const TSYM = ['', 'ˉ', 'ˊ', 'ˇ', 'ˋ'];
const INI = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w'];
const SHENG = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's', 'y', 'w'];
const DAN = ['a', 'o', 'e', 'i', 'u', 'ü'];
const FU = ['ai', 'ei', 'ui', 'ao', 'ou', 'iu', 'ie', 'üe'];
const QB = ['an', 'en', 'in', 'un', 'ün'];
const HB = ['ang', 'eng', 'ing', 'ong'];
const YUN = [...DAN, ...FU, 'er', ...QB, ...HB];
const ZHENGTI = ['zhi', 'chi', 'shi', 'ri', 'zi', 'ci', 'si', 'yi', 'wu', 'yu', 'ye', 'yue', 'yuan', 'yin', 'yun', 'ying'];
const ZT = new Set(ZHENGTI);
const PAIR_BI = { an: 'ang', ang: 'an', en: 'eng', eng: 'en', in: 'ing', ing: 'in', un: 'ong', ong: 'un', ün: 'un' };
/** 拆成 [声母, 写出来的韵母部分] */
function split(b) { for (const s of INI) if (b.startsWith(s) && b.length > s.length) return [s, b.slice(s.length)]; return ['', b]; }
/** 真正的韵母：j q x y 后面的 u 是 ü */
const trueYun = (sm, ym) => (sm && 'jqxy'.includes(sm) && ym[0] === 'u' ? 'ü' + ym.slice(1) : ym);
/** 两拼 / 三拼 / 整体认读；零声母音节和不出题的（juan、xiong 这类）返回 '' */
function kindOf(b) {
  if (ZT.has(b)) return '整体认读音节';
  const [sm, ym] = split(b);
  if (!sm) return '';
  if (sm === 'y' || sm === 'w') return '两拼音节';
  if (ym === 'iong') return '';
  if (/^(ia|iao|ian|iang|ua|uo|uai|uan|uang)$/.test(ym)) return 'jqx'.includes(sm) && ym[0] === 'u' ? '' : '三拼音节';
  return '两拼音节';
}
function yunLabel(y) {
  if (DAN.includes(y)) return '单韵母';
  if (FU.includes(y)) return '复韵母';
  if (y === 'er') return '特殊韵母';
  if (QB.includes(y)) return '前鼻韵母';
  if (HB.includes(y)) return '后鼻韵母';
  if (SHENG.includes(y)) return '声母';
  if (ZT.has(y)) return '整体认读音节';
  return '';
}

// 字表加上拆好的信息
const Z = ZI.map((z) => {
  const b = strip(z.py), [sm, ym] = split(b);
  return { ...z, b, t: toneOf(z.py), sm, ym, yun: trueYun(sm, ym), kind: kindOf(b) };
});
const Z_OK = Z.filter((z) => !z.poly);

// 容易混的声母、韵母（生成干扰项用，生成后用音节表过滤）
const SM_CONF = { b: ['p', 'd'], p: ['b', 'q'], m: ['n'], f: ['h'], d: ['t', 'b'], t: ['d'], n: ['l', 'm'], l: ['n', 'r'], g: ['k'], k: ['g', 'h'], h: ['f', 'k'], j: ['q', 'x'], q: ['j', 'x'], x: ['q', 'j'], zh: ['z', 'ch'], ch: ['c', 'zh'], sh: ['s'], r: ['l'], z: ['zh', 'c'], c: ['ch', 'z'], s: ['sh'], y: [], w: [] };
const YM_CONF = { a: ['o', 'e'], o: ['e', 'uo'], e: ['o'], ai: ['ei', 'ao'], ei: ['ai', 'ui'], ui: ['iu', 'ei'], ao: ['ou', 'iao'], ou: ['ao', 'iu'], iu: ['ui', 'ou'], ie: ['ue', 'ei'], ue: ['ie'], an: ['ang', 'en'], en: ['eng', 'an'], in: ['ing', 'en'], un: ['ong', 'en'], ang: ['an', 'eng'], eng: ['en', 'ang'], ing: ['in', 'eng'], ong: ['un', 'eng'], i: ['ü', 'e'], u: ['ü', 'o'], ü: ['u', 'i'], ia: ['ua', 'a'], ua: ['ia', 'a'], uo: ['o', 'ou'], iao: ['ao', 'iu'], ian: ['iang', 'an'], iang: ['ian', 'ang'], uan: ['uang', 'an'], uang: ['uan', 'ang'], uai: ['ai', 'ui'] };
/** 给一个带调音节找 k 个像的干扰项：换一个容易混的声母、换一个容易混的韵母、换声调。
 *  avoid：这个字在字典里的其他读音，不能拿来当错误选项 */
function confusers(r, py, k = 3, avoid = []) {
  const b = strip(py), t = toneOf(py) || 1, [sm, ym] = split(b);
  const ok = (x) => x && !avoid.includes(x);
  const re = (x) => (SYL.has(x) && x !== b ? mark(x, t) : null);
  const smv = uniq((SM_CONF[sm] || []).map((c) => re(c + ym)).filter(ok));
  const ymv = uniq((sm ? YM_CONF[ym] || [] : []).map((c) => re(sm + c)).filter(ok));
  const tv = [1, 2, 3, 4].filter((x) => x !== t).map((x) => mark(b, x)).filter(ok);
  const out = [];
  for (const p of [r.shuffle(smv), r.shuffle(ymv), r.shuffle(tv)]) if (p.length && out.length < k && !out.includes(p[0])) out.push(p[0]);
  for (const x of r.shuffle([...smv, ...ymv, ...tv])) { if (out.length >= k) break; if (!out.includes(x)) out.push(x); }
  return out;
}
/** 说清两个音节哪里不一样 */
function diffNote(a, d) {
  const [s1, y1] = split(strip(a)), [s2, y2] = split(strip(d));
  if (s1 !== s2) return `${d} 的声母是 ${s2 || '（没有）'}，不对`;
  if (y1 !== y2) return `${d} 的韵母是 ${trueYun(s2, y2)}，不对`;
  return `${d} 是${TN[toneOf(d)]}，声调不对`;
}
// 两拼音节「声母—韵母」演示时，韵母单独标调要是合法音节（ǐ、ū 这类单独写不成音节，不出）
const LP_YUN = ['a', 'o', 'e', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng'];
const ymT = (z) => mark(z.ym, z.t);

// ================= 汉字工具 =================
const BASIC = new Set(['横', '竖', '撇', '捺', '点', '提']);
const SIM = {
  横: ['提', '竖', '横钩'], 竖: ['竖钩', '横', '撇'], 撇: ['捺', '点', '竖'], 捺: ['撇', '点', '提'], 点: ['撇', '捺', '提'], 提: ['横', '撇', '点'],
  横折: ['横折钩', '竖折', '横撇'], 横撇: ['横折', '横钩', '撇点'], 横钩: ['横撇', '横折钩', '竖钩'], 竖钩: ['竖', '弯钩', '竖弯钩'],
  竖弯: ['竖弯钩', '竖折', '竖提'], 竖折: ['竖弯', '横折', '竖提'], 竖提: ['竖钩', '竖折', '提'], 撇点: ['撇折', '横撇', '撇'],
  撇折: ['撇点', '竖折', '竖提'], 横折钩: ['横折', '横钩', '横折弯钩'], 竖弯钩: ['竖弯', '竖钩', '卧钩'], 卧钩: ['斜钩', '竖弯钩', '弯钩'],
  斜钩: ['卧钩', '弯钩', '竖钩'], 弯钩: ['竖钩', '斜钩', '卧钩'], 横折弯钩: ['横折钩', '竖弯钩', '横折弯'], 竖折折钩: ['横折钩', '横折弯钩', '竖弯钩'],
  横折折撇: ['横撇弯钩', '横折弯钩', '横撇'], 横撇弯钩: ['横折折撇', '横折弯钩', '横折折折钩'], 横折折折钩: ['横撇弯钩', '竖折折钩', '横折弯钩'],
  横折提: ['横折', '竖提', '横折钩'], 横折弯: ['横折弯钩', '横折', '竖弯'], 竖折撇: ['竖折', '撇折', '竖折折钩'], 横折折: ['横折', '横折折撇', '竖折'],
  横折折折: ['横折折', '横折折折钩', '竖折'],
};
const DESC = {
  横: '从左往右写平', 竖: '从上往下写直', 撇: '从右上往左下撇出去', 捺: '从左上往右下写，捺脚拖出来', 点: '短短的一点', 提: '从左下往右上提起来',
  横折: '先写横，到头折下来写竖', 横撇: '先写横，到头折过来往左下撇', 横钩: '写完横，最后往左下钩', 竖钩: '写完竖，最后往左上钩',
  竖弯: '先写竖，再圆圆地弯过来往右写', 竖折: '先写竖，到底折过来往右写横', 竖提: '先写竖，到底往右上提', 撇点: '先写撇，再接着往右下写点',
  撇折: '先写撇，再折过来往右上写提', 横折钩: '先写横，折下来写竖，最后钩', 竖弯钩: '先写竖，弯过来往右写，最后往上钩', 卧钩: '像躺着的弯钩，最后往左上钩',
  斜钩: '从左上斜着往右下写，最后往上钩', 弯钩: '弯弯地往下写，最后往左上钩', 横折弯钩: '先写横，折下来写竖弯，最后往上钩',
  竖折折钩: '先竖，再折、再折，最后钩，一笔写成', 横折折撇: '先横，再折、再折，最后撇出去，一笔写成', 横撇弯钩: '先写横撇，再弯下来钩，一笔写成',
  横折折折钩: '横、折、折、折，最后钩，一笔写成', 横折提: '先写横，折下来写竖，最后往右上提', 横折弯: '先写横，折下来写竖弯，最后不带钩',
  竖折撇: '先竖，再折过来写横，最后撇出去', 横折折: '先横，折下来，再折过去', 横折折折: '横、折、折、再折，一笔写成',
};
// 左偏旁变形的提醒
const NOTE = {
  好: '「女」做左边偏旁时，最后一笔横变成提', 姓: '「女」做左边偏旁时，最后一笔横变成提', 奶: '「女」做左边偏旁时，最后一笔横变成提',
  地: '「土」做左边偏旁时，最后一笔横变成提', 场: '「土」做左边偏旁时，最后一笔横变成提', 耳: '「耳」的最后一笔是提，不是横', 虫: '「虫」的第五笔是提，不是横',
  红: '绞丝旁的第三笔是提', 给: '绞丝旁的第三笔是提', 级: '绞丝旁的第三笔是提', 绿: '绞丝旁的第三笔是提',
  江: '三点水的第三笔是提', 清: '三点水的第三笔是提', 没: '三点水的第三笔是提', 海: '三点水的第三笔是提', 活: '三点水的第三笔是提', 汤: '三点水的第三笔是提',
  转: '「车」做左边偏旁时，最后一笔是提，笔顺也变成：横、撇折、竖、提', 北: '「北」左边第三笔是提', 投: '提手旁的第三笔是提', 到: '「至」的最后一笔是提',
};
const BH_ALL = new Map();
for (const t of ['1a', '1b', '2a']) for (const e of BH[t]) if (!BH_ALL.has(e.ch)) BH_ALL.set(e.ch, e);
const namePool = (list) => uniq(list.flatMap((e) => e.names.filter((_, i) => !e.unsure[i])));
const seqText = (names) => names.join('、');
const numbered = (names) => names.map((n, i) => `${i + 1}${n}`).join(' ');

// 偏旁
const PG = new Map(PANG.map(([g, name, mean, n, lv]) => [g, { g, name, mean, n, lv }]));
const SIDE_ONLY = ['氵', '冫', '讠', '扌', '礻', '衤', '犭', '亻', '艹', '宀', '饣', '钅', '纟', '灬', '刂', '忄'];
const LOOK = [['氵', '冫', '讠'], ['扌', '礻', '衤', '犭'], ['衤', '礻'], ['饣', '钅', '纟'], ['亻', '彳'], ['忄', '亻'], ['艹', '宀'], ['刂', '亻'], ['灬', '氵'],
  ['日', '目'], ['木', '禾'], ['火', '米']];
// 字里别的部分已经含有这个偏旁的形状，不能拿来当干扰项
const HAS = { 花: ['亻'], 猫: ['艹'], 热: ['扌'], 捉: ['足'], 们: ['门'], 休: ['木'], 体: ['木'], 林: ['木'] };
const looksLike = (g) => uniq(LOOK.filter((x) => x.includes(g)).flat()).filter((x) => x !== g);
/** 偏旁干扰项：先挑长得像的，再从只做偏旁的形状里补 */
function radDistractors(r, g, ch) {
  const bad = new Set([g, ...(HAS[ch] || [])]);
  return [...r.shuffle(looksLike(g)), ...r.shuffle(SIDE_ONLY)].filter((x) => !bad.has(x) && PG.has(x));
}
// 意思相近、会让选项都说得通的偏旁组
const MEAN_GROUP = [['口', '讠'], ['口', '饣'], ['亻', '女'], ['犭', '鸟', '虫', '马'], ['木', '艹', '竹'], ['禾', '米', '饣'], ['日', '雨', '冫'],
  ['火', '灬'], ['心', '忄'], ['石', '王', '土'], ['钅', '刂', '贝'], ['月', '口', '目', '足', '扌'], ['衤', '纟']];
const meanClash = (a, b) => a === b || MEAN_GROUP.some((g) => g.includes(a) && g.includes(b)) || (PG.has(a) && PG.has(b) && PG.get(a).mean === PG.get(b).mean);
// 字族里意思和偏旁关系不明显的字（吗、号码、注意……），不拿来考「哪个字和某某有关」
const NOT_MEAN = new Set('吗 吧 叮 码 注 校 份 纷 样 等 完 玩 零 红'.split(' '));
const PZ = Object.fromEntries(Object.entries(PANG_ZI).map(([g, s]) => [g, s.split(' ')]));
// 偏旁 → 带这个偏旁的字（意思表、部首表、字族合起来）
const RAD_ZI = new Map();
const addRZ = (g, ch) => { if (!RAD_ZI.has(g)) RAD_ZI.set(g, []); if (!RAD_ZI.get(g).includes(ch)) RAD_ZI.get(g).push(ch); };
for (const [g, zs] of Object.entries(PZ)) zs.forEach((c) => addRZ(g, c));
for (const b of BUSHOU) addRZ(b.bs, b.ch);
for (const f of FAM) for (const [c, g] of f.items) addRZ(g, c);
const TOP = new Set(['艹', '雨', '竹', '父', '宀', '穴']);
const POS = { 辶: '左下', 爪: '左下', 疒: '左上', 广: '左上', 门: '外面', 囗: '外面', 鸟: '右边', 刂: '右边', 灬: '下面', 心: '下面' };
const posOf = (g) => (TOP.has(g) ? '上面' : POS[g] || '左边');

// 结构
const JG = Object.entries(JIEGOU).flatMap(([k, s]) => s.split(' ').map((ch) => ({ ch, k })));
const JG_WHY = {
  独体结构: '不能再分成两部分，是独体字', 左右结构: '能分成左、右两部分', 上下结构: '能分成上、下两部分',
  左中右结构: '能分成左、中、右三部分', 上中下结构: '能分成上、中、下三部分', 半包围结构: '一部分从两面或三面包住另一部分', 全包围结构: '外面的框把里面四面都包住了',
};
const JG_CONF = { 独体结构: ['左右结构', '上下结构'], 左右结构: ['左中右结构', '上下结构'], 上下结构: ['上中下结构', '左右结构'], 左中右结构: ['左右结构', '上中下结构'],
  上中下结构: ['上下结构', '左中右结构'], 半包围结构: ['全包围结构', '左右结构'], 全包围结构: ['半包围结构', '独体结构'] };

// ================= 题型生成器（汉字，按册复用） =================
/** 笔画名称：「木」的第 2 笔是什么？hard：多大比例问复合笔画 */
function genBihua(list, hard) {
  const pool = namePool(list);
  const items = list.filter((e) => e.unsure.some((u) => !u));
  return (r) => {
    const e = r.pick(items);
    let ks = e.names.map((_, i) => i).filter((i) => !e.unsure[i]);
    const hk = ks.filter((i) => !BASIC.has(e.names[i]));
    if (hk.length && r.chance(hard)) ks = hk;
    const k = r.pick(ks), name = e.names[k];
    const steps = [];
    if (e.sure) steps.push(`按笔顺数：${numbered(e.names.slice(0, k + 1))}`);
    steps.push(`第 ${k + 1} 笔${DESC[name]}，叫「${name}」`);
    if (NOTE[e.ch] && /提/.test(name)) steps.push(NOTE[e.ch]);
    const options = opts(r, name, r.shuffle(SIM[name] || []), pool);
    const d = options.find((x) => x !== name && (SIM[name] || []).includes(x));
    if (d && DESC[d]) steps.push(`不是「${d}」：${d}是${DESC[d]}`);
    return {
      q: `「${e.ch}」的第 ${k + 1} 笔是什么笔画？`,
      answer: [choice(options, name)],
      steps,
      hint: '先按笔顺从第一笔数起，数到这一笔，再想想它的样子',
    };
  };
}
/** 笔画数 */
function genBihuashu(list) {
  return (r) => {
    const e = r.pick(list), n = e.names.length;
    const cand = r.sample([n - 2, n - 1, n + 1, n + 2].filter((x) => x >= 1), 3);
    const options = [n, ...cand].sort((a, b) => a - b).map((x) => `${x} 画`);
    const comp = e.names.filter((x, i) => !BASIC.has(x) && !e.unsure[i]).sort((a, b) => b.length - a.length)[0];
    const steps = [e.sure ? `按笔顺一笔一笔数：${numbered(e.names)}` : `按笔顺一笔一笔地数，边写边数`];
    if (comp) steps.push(`「${comp}」${/钩/.test(comp) && !/折|弯/.test(comp) ? '带钩' : '拐了弯'}，也是一笔写成的，只算一画`);
    steps.push(`「${e.ch}」一共 ${n} 画`);
    return { q: `「${e.ch}」一共有几画？`, answer: [choice(options, `${n} 画`)], steps, hint: '拐弯的笔画（像横折、竖弯钩）是一笔写成的，只算一画' };
  };
}
/** 选出正确的笔顺 */
function wrongSeqs(r, names) {
  const key = seqText(names), out = [];
  const add = (a, note) => { const s = seqText(a); if (s !== key && !out.some((o) => o.s === s)) out.push({ s, note }); };
  for (const i of r.shuffle([...Array(names.length - 1).keys()])) {
    if (names[i] === names[i + 1]) continue;
    const a = names.slice(); [a[i], a[i + 1]] = [a[i + 1], a[i]];
    add(a, `第 ${i + 1}、${i + 2} 笔不能颠倒：先写${names[i]}，再写${names[i + 1]}`);
  }
  for (const i of r.shuffle([...names.keys()])) {
    const a = names.slice(); const [x] = a.splice(i, 1);
    add([...a, x], `「${x}」是第 ${i + 1} 笔，不是最后一笔`);
    add([x, ...a], `「${x}」是第 ${i + 1} 笔，不是第一笔`);
  }
  return out;
}
function genBishunSeq(r, e) {
  const key = seqText(e.names);
  const ws = wrongSeqs(r, e.names).slice(0, 3);
  const steps = [`「${e.ch}」的笔顺：${key}`];
  if (ws[0]) steps.push(ws[0].note);
  if (NOTE[e.ch]) steps.push(NOTE[e.ch]);
  return { q: `「${e.ch}」的笔顺，哪一个是对的？`, answer: [choice(r.shuffle([key, ...ws.map((w) => w.s)]), key)], steps, hint: '在心里一笔一笔地写一遍，对照每一笔的顺序' };
}
function genDijibi(r, e) {
  const n = e.names.length;
  const ks = e.names.map((_, i) => i).filter((i) => !e.unsure[i] && e.names.filter((x) => x === e.names[i]).length === 1);
  const k = r.pick(ks), name = e.names[k];
  const all = [...Array(n).keys()].map((i) => i + 1);
  const near = all.filter((x) => x !== k + 1).sort((a, b) => Math.abs(a - k - 1) - Math.abs(b - k - 1));
  const options = [k + 1, ...near.slice(0, 3)].sort((a, b) => a - b).map((x) => `第 ${x} 笔`);
  return {
    q: `「${e.ch}」的「${name}」是第几笔？`,
    answer: [choice(options, `第 ${k + 1} 笔`)],
    steps: [`按笔顺数：${numbered(e.names)}`, `「${name}」是第 ${k + 1} 笔`],
    hint: '从第一笔开始，一边写一边数',
  };
}
const dijibiOK = (e) => e.sure && e.names.length >= 3 && e.names.some((x, i) => !e.unsure[i] && e.names.filter((y) => y === x).length === 1);
const seqOK = (max) => (e) => e.sure && e.names.length >= 3 && e.names.length <= max && new Set(e.names).size >= 2;

/** 汉字结构 */
function genJiegou(kinds) {
  const items = JG.filter((x) => kinds.includes(x.k));
  return (r) => {
    const it = r.pick(items);
    const prefer = (JG_CONF[it.k] || []).filter((x) => kinds.includes(x));
    return {
      q: `「${it.ch}」是什么结构的字？`,
      answer: [choice(opts(r, it.k, prefer, kinds, Math.min(4, kinds.length)), it.k)],
      steps: [kinds.length <= 3 ? '看这个字能不能分开：能左右分开、能上下分开，还是不能分' : '看这个字能分成几部分、怎么分：左右分、上下分，还是一部分包住另一部分', `「${it.ch}」${JG_WHY[it.k]}`, `所以是${it.k}`],
    };
  };
}

/** 偏旁表示的意思 */
function genPangyi(level) {
  const rads = [...PG.values()].filter((p) => p.lv === level && p.mean && PZ[p.g]);
  const allMean = [...PG.values()].filter((p) => p.mean && PZ[p.g]);
  const fams = FAM.filter((f) => f.items.length >= 3 && f.items.some(([c, g]) => PG.has(g) && PG.get(g).mean && PG.get(g).lv <= level && !NOT_MEAN.has(c)));
  const meanOpts = (r, p) => opts(r, p.mean, [], allMean.filter((q) => !meanClash(p.g, q.g)).map((q) => q.mean));
  const lead = (p) => `「${p.g}」${p.name ? `是${p.name}，` : ''}${p.name || '这个偏旁'}的字，意思大多和${p.mean}有关`;
  return (r) => {
    const mode = r.int(0, 2);
    if (mode === 2) {
      const f = r.pick(fams);
      const cand = f.items.filter(([c, g]) => PG.has(g) && PG.get(g).mean && PG.get(g).lv <= level && !NOT_MEAN.has(c));
      const [ch, g, , word] = r.pick(cand);
      const p = PG.get(g);
      const others = f.items.filter(([c, g2]) => c !== ch && !meanClash(g, g2)).map(([c]) => c);
      if (others.length >= 2) {
        const options = r.shuffle([ch, ...r.sample(others, Math.min(3, others.length))]);
        return {
          q: `下面哪个字的意思和「${p.mean}」有关？`,
          answer: [choice(options, ch)],
          steps: ['这几个字右边一样，看偏旁就能猜出意思', lead(p), `所以是「${ch}」：${word}`],
        };
      }
    }
    const p = r.pick(rads);
    if (mode === 0) {
      return {
        q: `${p.name ? `「${p.g}」（${p.name}）` : `「${p.g}」`}的字，意思大多和什么有关？`,
        answer: [choice(meanOpts(r, p), p.mean)],
        steps: [lead(p), `比如：${PZ[p.g].slice(0, 4).join('、')}`],
      };
    }
    const ch = r.pick(PZ[p.g]);
    return {
      q: `看偏旁猜一猜：「${ch}」的意思最可能和什么有关？`,
      answer: [choice(meanOpts(r, p), p.mean)],
      steps: [`「${ch}」的偏旁是「${p.g}」${p.name ? `（${p.name}）` : ''}`, lead(p), `所以「${ch}」和${p.mean}有关`],
      hint: '先找出这个字的偏旁，再想想这个偏旁表示什么',
    };
  };
}

/** 换偏旁 / 加偏旁 */
const famWordOK = (f, ch, word) => [...word].filter((c) => c === ch).length === 1 && !f.items.some(([c]) => c !== ch && word.includes(c)) && !word.includes(f.base);
const radName = (g) => (PG.get(g) && PG.get(g).name) || ({ 爪: '爪字旁', 父: '父字头' })[g] || '';
const radText = (g) => (radName(g) ? `「${g}」（${radName(g)}）` : `「${g}」`);
const meanOf = (g) => (PG.get(g) && PG.get(g).mean) || '';

// ================= 题型 =================
export default [
  // ---------------- 拼音 · 一年级上册 ----------------
  {
    id: 'y1a-py-danyunmu', subject: 'yw', grade: 1, term: 1, unit: '拼音', name: '单韵母认一认',
    tip: '单韵母只有 6 个：a o e i u ü；音节去掉开头的声母，剩下的就是韵母', level: 1,
    gen(r) {
      if (r.chance(0.25)) {
        const d = r.pick(DAN);
        const look = YUN.concat(SHENG).filter((x) => x !== d && x[0] === d[0]);
        const others = opts(r, d, r.shuffle(look).slice(0, 2), [...FU, ...QB, ...HB, ...SHENG].filter((x) => x !== d)).filter((x) => x !== d);
        return {
          q: '下面哪个是单韵母？', answer: [choice(r.shuffle([d, ...others]), d)],
          steps: ['单韵母只有 6 个：a o e i u ü', `「${d}」是单韵母`, others.map((x) => `「${x}」是${yunLabel(x)}`).join('，')],
        };
      }
      const z = r.pick(Z.filter((x) => x.kind === '两拼音节' && DAN.includes(x.yun) && !'jqxyw'.includes(x.sm)));
      return {
        q: `「${z.ch}」的音节是 ${z.py}，它的韵母是哪个单韵母？`,
        answer: [choice(opts(r, z.yun, z.yun === 'ü' ? ['u'] : z.yun === 'u' ? ['ü'] : [], DAN), z.yun)],
        steps: [`先找声母：${z.py} 开头的 ${z.sm} 是声母`, `去掉声母，剩下的 ${z.yun} 就是韵母`, `${z.yun} 是单韵母`],
      };
    },
  },
  {
    id: 'y1a-py-shengmu', subject: 'yw', grade: 1, term: 1, unit: '拼音', name: '声母认一认',
    tip: '音节开头的那部分是声母；zh ch sh 是两个字母组成的一个声母', level: 1,
    gen(r) {
      if (r.chance(0.25)) {
        const s = r.pick(SHENG);
        const zt = ZHENGTI.filter((x) => x.startsWith(s) && split(x)[0] === s);
        const others = opts(r, s, zt.slice(0, 1), YUN.filter((x) => x !== 'er')).filter((x) => x !== s);
        return {
          q: '下面哪个是声母？', answer: [choice(r.shuffle([s, ...others]), s)],
          steps: ['声母有 23 个：b p m f d t n l g k h j q x zh ch sh r z c s y w', `「${s}」是声母`, others.map((x) => `「${x}」是${yunLabel(x)}`).join('，')],
        };
      }
      const z = r.pick(Z.filter((x) => (x.kind === '两拼音节' || x.kind === '三拼音节') && !'yw'.includes(x.sm)));
      const steps = ['音节开头的那部分是声母', `${z.py} 开头是 ${z.sm}`];
      if (z.sm.length === 2) steps.push(`${z.sm} 是两个字母组成的一个声母，不能只看第一个字母`);
      steps.push(`所以「${z.ch}」的声母是 ${z.sm}`);
      return {
        q: `「${z.ch}」的音节是 ${z.py}，它的声母是？`,
        answer: [choice(opts(r, z.sm, SM_CONF[z.sm], SHENG.filter((x) => x !== 'y' && x !== 'w')), z.sm)],
        steps,
      };
    },
  },
  {
    id: 'y1a-py-shengyun', subject: 'yw', grade: 1, term: 1, unit: '拼音', name: '声母韵母分一分',
    tip: '声母 23 个、韵母 24 个、整体认读音节 16 个，分清楚再拼', level: 1,
    gen(r) {
      const items = [...SHENG.map((x) => [x, '声母']), ...YUN.map((x) => [x, '韵母']), ...ZHENGTI.map((x) => [x, '整体认读音节'])];
      const [x, k] = r.pick(items);
      const steps = [];
      const ZTOF = { zh: 'zhi', ch: 'chi', sh: 'shi', r: 'ri', z: 'zi', c: 'ci', s: 'si', y: 'yi', w: 'wu' };
      if (k === '声母') {
        steps.push('声母有 23 个：b p m f d t n l g k h j q x zh ch sh r z c s y w', `「${x}」是声母`);
        if (ZTOF[x]) steps.push(`别和整体认读音节「${ZTOF[x]}」弄混：${ZTOF[x]} 后面还有字母`);
      } else if (k === '韵母') {
        steps.push('韵母有 24 个：单韵母 a o e i u ü，复韵母 ai ei ui ao ou iu ie üe，特殊韵母 er，鼻韵母 an en in un ün ang eng ing ong', `「${x}」是${yunLabel(x)}，属于韵母`);
      } else {
        steps.push('整体认读音节有 16 个：zhi chi shi ri zi ci si yi wu yu ye yue yuan yin yun ying', `「${x}」是整体认读音节，直接读，不用拼`);
      }
      return { q: `「${x}」是声母、韵母，还是整体认读音节？`, answer: [choice(['声母', '韵母', '整体认读音节'], k)], steps };
    },
  },
  {
    id: 'y1a-py-fuyunmu', subject: 'yw', grade: 1, term: 1, unit: '拼音', name: '复韵母认一认',
    tip: '复韵母 8 个：ai ei ui ao ou iu ie üe；音节去掉声母，剩下的就是韵母', level: 1,
    gen(r) {
      const CONF = { ai: ['ei', 'ao'], ei: ['ai', 'ui'], ui: ['iu', 'ei'], ao: ['ou', 'ai'], ou: ['ao', 'iu'], iu: ['ui', 'ou'], ie: ['üe', 'ei'], üe: ['ie', 'ue'] };
      if (r.chance(0.25)) {
        const d = r.pick(FU);
        const look = [...DAN, 'er', ...QB, ...HB].filter((x) => x[0] === d[0]);
        const others = opts(r, d, r.shuffle(look).slice(0, 2), [...DAN, 'er', ...QB, ...HB, ...SHENG]).filter((x) => x !== d);
        return {
          q: '下面哪个是复韵母？', answer: [choice(r.shuffle([d, ...others]), d)],
          steps: ['复韵母有 8 个：ai ei ui ao ou iu ie üe', `「${d}」是复韵母`, others.map((x) => `「${x}」是${yunLabel(x)}`).join('，')],
        };
      }
      const z = r.pick(Z.filter((x) => x.kind === '两拼音节' && FU.includes(x.yun) && x.yun !== 'üe' && !'yw'.includes(x.sm)));
      return {
        q: `「${z.ch}」的音节是 ${z.py}，它的韵母是？`,
        answer: [choice(opts(r, z.yun, CONF[z.yun], FU.filter((x) => x !== 'üe')), z.yun)],
        steps: [`先找声母：${z.py} 开头的 ${z.sm} 是声母`, `去掉声母，剩下的 ${z.yun} 是韵母`, `${z.yun} 是复韵母`],
      };
    },
  },
  {
    id: 'y1a-py-biyunmu', subject: 'yw', grade: 1, term: 1, unit: '拼音', name: '鼻韵母认一认',
    tip: '前鼻韵母 an en in un ün 带 n；后鼻韵母 ang eng ing ong 带 ng', level: 1,
    gen(r) {
      if (r.chance(0.3)) {
        const y = r.pick([...QB, ...HB]);
        const k = QB.includes(y) ? '前鼻韵母' : '后鼻韵母';
        return {
          q: `「${y}」是前鼻韵母还是后鼻韵母？`, answer: [choice(['前鼻韵母', '后鼻韵母'], k)],
          steps: ['看韵母后面：带 n 的是前鼻韵母，带 ng 的是后鼻韵母', `「${y}」后面是 ${y.endsWith('ng') ? 'ng' : 'n'}，是${k}`],
        };
      }
      const z = r.pick(Z.filter((x) => x.kind === '两拼音节' && [...QB, ...HB].includes(x.yun) && x.yun !== 'ün' && !'jqxyw'.includes(x.sm)));
      return {
        q: `「${z.ch}」的音节是 ${z.py}，它的韵母是？`,
        answer: [choice(opts(r, z.yun, [PAIR_BI[z.yun]], [...QB, ...HB].filter((x) => x !== 'ün')), z.yun)],
        steps: [`去掉声母 ${z.sm}，剩下的 ${z.yun} 是韵母`, `${z.yun} 后面是 ${z.yun.endsWith('ng') ? 'ng，是后鼻韵母' : 'n，是前鼻韵母'}`, `别看成 ${PAIR_BI[z.yun]}`],
      };
    },
  },
  {
    id: 'y1a-py-qianhou', subject: 'yw', grade: 1, term: 1, unit: '拼音', name: '前鼻音后鼻音',
    tip: '前鼻音收尾舌尖抵住上牙床（n），后鼻音收尾舌根往后缩（ng）', level: 2,
    gen(r) {
      const SW = { an: 'ang', ang: 'an', en: 'eng', eng: 'en', in: 'ing', ing: 'in', ian: 'iang', iang: 'ian', uan: 'uang', uang: 'uan' };
      const items = Z.filter((z) => SW[z.ym] && SYL.has(z.sm + SW[z.ym]) && !(z.sm === 'y' || z.sm === 'w'));
      const z = r.pick(items);
      const other = mark(z.sm + SW[z.ym], z.t), back = z.ym.endsWith('ng');
      return {
        q: `给加点的字选正确的音节：\n${bold(z.word, z.ch)}`,
        answer: [choice(r.shuffle([z.py, other]), z.py)],
        steps: ['分前后鼻音：前鼻音韵尾是 n，读完舌尖抵住上牙床；后鼻音韵尾是 ng，读完舌根往后缩', `「${z.ch}」读 ${z.py}，是${back ? '后' : '前'}鼻音`, `${other} 是${back ? '前' : '后'}鼻音，不对`],
        hint: `读一读「${z.word}」，最后舌头是抵着上牙床，还是往后缩？`,
      };
    },
  },
  {
    id: 'y1a-py-pingqiao', subject: 'yw', grade: 1, term: 1, unit: '拼音', name: '平舌音翘舌音',
    tip: 'z c s 是平舌音，舌尖平伸；zh ch sh 是翘舌音，舌尖翘起来', level: 2,
    gen(r) {
      const SW = { z: 'zh', zh: 'z', c: 'ch', ch: 'c', s: 'sh', sh: 's' };
      const z = r.pick(Z.filter((x) => SW[x.sm] && SYL.has(SW[x.sm] + x.ym)));
      const other = mark(SW[z.sm] + z.ym, z.t), qiao = z.sm.length === 2;
      return {
        q: `给加点的字选正确的音节：\n${bold(z.word, z.ch)}`,
        answer: [choice(r.shuffle([z.py, other]), z.py)],
        steps: ['分平翘舌：z c s 是平舌音，zh ch sh 是翘舌音，读的时候舌尖要翘起来', `「${z.ch}」读 ${z.py}，开头是 ${z.sm}，是${qiao ? '翘' : '平'}舌音`, `${other} 是${qiao ? '平' : '翘'}舌音，不对`],
        hint: `读一读「${z.word}」，舌尖有没有翘起来？`,
      };
    },
  },
  {
    id: 'y1a-py-sisheng', subject: 'yw', grade: 1, term: 1, unit: '拼音', name: '选对声调',
    tip: '一声平，二声扬，三声拐弯，四声降；先读准字音再找声调', level: 1,
    gen(r) {
      const z = r.pick(Z.filter((x) => x.t));
      const four = [1, 2, 3, 4].map((t) => mark(z.b, t));
      return {
        q: `选出带正确声调的音节：\n${bold(z.word, z.ch)}`,
        answer: [choice(four, z.py)],
        steps: ['四声口诀：一声平，二声扬，三声拐弯，四声降', `读一读「${z.word}」，「${z.ch}」读${TN[z.t]}`, `${TN[z.t]}的符号是「${TSYM[z.t]}」，所以是 ${z.py}`],
        hint: '把这个字拖长了读一读，声音是平的、往上扬的、拐弯的，还是往下降的？',
      };
    },
  },
  {
    id: 'y1a-py-diji', subject: 'yw', grade: 1, term: 1, unit: '拼音', name: '认声调符号',
    tip: '看声调符号：ˉ 第一声，ˊ 第二声，ˇ 第三声，ˋ 第四声', level: 1,
    gen(r) {
      const z = r.pick(Z.filter((x) => x.t));
      return {
        q: `音节 ${z.py} 是第几声？`,
        answer: [choice(['第一声', '第二声', '第三声', '第四声'], TN[z.t])],
        steps: ['看声调符号：ˉ 一声平，ˊ 二声往上扬，ˇ 三声拐个弯，ˋ 四声往下降', `${z.py} 上面的符号是「${TSYM[z.t]}」`, `所以是${TN[z.t]}`],
      };
    },
  },
  {
    id: 'y1a-py-liangpin', subject: 'yw', grade: 1, term: 1, unit: '拼音', name: '两拼音节拼一拼',
    tip: '前音轻短后音重，两音相连猛一碰', level: 1,
    gen(r) {
      const z = r.pick(Z.filter((x) => x.kind === '两拼音节' && !'yw'.includes(x.sm) && LP_YUN.includes(x.ym)));
      const ds = confusers(r, z.py);
      return {
        q: `拼一拼，选出正确的音节：\n${z.sm} — ${ymT(z)}`,
        answer: [choice(r.shuffle([z.py, ...ds]), z.py)],
        steps: ['两拼音节：声母读得轻短，韵母读得响亮，两音相连猛一碰', `${z.sm} — ${ymT(z)} → ${z.py}，是「${z.ch}」的音`, diffNote(z.py, ds[0])],
      };
    },
  },
  {
    id: 'y1a-py-sanpin', subject: 'yw', grade: 1, term: 1, unit: '拼音', name: '三拼音节拼一拼',
    tip: '声轻介快韵母响，三音连读很顺当', level: 2,
    gen(r) {
      const z = r.pick(Z.filter((x) => x.kind === '三拼音节'));
      const med = z.ym[0], rest = z.ym.slice(1), restT = mark(rest, z.t);
      const special = [z.sm + rest, z.sm + (med === 'i' ? 'u' : 'i') + rest].filter((x) => SYL.has(x) && x !== z.b).map((x) => mark(x, z.t));
      const ds = uniq([...r.shuffle(special).slice(0, 1), ...confusers(r, z.py)]).filter((x) => x !== z.py).slice(0, 3);
      const steps = ['三拼音节：声母轻、介母快、韵母响，三个音连起来读', `${z.sm} — ${med} — ${restT} → ${z.py}，是「${z.ch}」的音`];
      if (ds.includes(mark(z.sm + rest, z.t))) steps.push(`${mark(z.sm + rest, z.t)} 漏掉了中间的介母 ${med}`);
      else steps.push(diffNote(z.py, ds[0]));
      return { q: `拼一拼，选出正确的音节：\n${z.sm} — ${med} — ${restT}`, answer: [choice(r.shuffle([z.py, ...ds]), z.py)], steps };
    },
  },
  {
    id: 'y1a-py-fenlei', subject: 'yw', grade: 1, term: 1, unit: '拼音', name: '两拼三拼整体认读',
    tip: '声母 + 韵母是两拼；声母 + 介母 i u ü + 韵母是三拼；16 个整体认读音节直接读', level: 2,
    gen(r) {
      const z = r.pick(Z.filter((x) => x.kind));
      const steps = [];
      if (z.kind === '整体认读音节') steps.push(`${z.py} 是 16 个整体认读音节之一，直接读，不用拼`);
      else if (z.kind === '三拼音节') steps.push(`${z.py} 分成 ${z.sm} + ${z.ym[0]} + ${z.ym.slice(1)}：声母 + 介母 + 韵母`, '有介母 i、u、ü 夹在中间的是三拼音节');
      else {
        steps.push(`${z.py} 分成 ${z.sm} + ${z.yun}：声母 + 韵母`);
        if (['iu', 'ui', 'ie', 'üe', 'un', 'in', 'ing'].includes(z.yun)) steps.push(`${z.yun} 本身就是一个韵母，中间没有介母，所以不是三拼`);
        else if (z.sm === 'y' || z.sm === 'w') steps.push(`${z.py} 不在 16 个整体认读音节里，是 ${z.sm} 和 ${z.yun} 拼成的`);
      }
      steps.push(`所以是${z.kind}`);
      return { q: `音节 ${z.py} 是什么音节？`, answer: [choice(['两拼音节', '三拼音节', '整体认读音节'], z.kind)], steps };
    },
  },
  {
    id: 'y1a-py-zhengti', subject: 'yw', grade: 1, term: 1, unit: '拼音', name: '整体认读音节',
    tip: '整体认读音节 16 个：zhi chi shi ri zi ci si yi wu yu ye yue yuan yin yun ying', level: 2,
    gen(r) {
      const LIST = '整体认读音节有 16 个：zhi chi shi ri zi ci si yi wu yu ye yue yuan yin yun ying';
      const zt = Z.filter((x) => x.kind === '整体认读音节');
      const near = (z) => Z.filter((x) => x.kind === '两拼音节' && x.b[0] === z.b[0] && (z.b.length < 2 || x.sm === z.sm || 'yw'.includes(z.b[0])));
      if (r.chance(0.6)) {
        const z = r.pick(zt);
        const ds = r.sample(uniq(near(z).map((x) => x.py)), 3);
        if (ds.length === 3) {
          return {
            q: '下面哪个是整体认读音节？', answer: [choice(r.shuffle([z.py, ...ds]), z.py)],
            steps: [LIST, `${z.py} 是整体认读音节`, `${ds[0]} 是 ${split(strip(ds[0]))[0]} 和 ${trueYun(...split(strip(ds[0])))} 拼成的两拼音节`],
          };
        }
      }
      const pool = r.chance(0.5) ? zt : Z.filter((x) => x.kind === '两拼音节' && ['zh', 'ch', 'sh', 'r', 'z', 'c', 's', 'y', 'w'].includes(x.sm));
      const z = r.pick(pool), yes = z.kind === '整体认读音节';
      return {
        q: `${z.py} 是整体认读音节吗？`, answer: [choice(['√', '×'], yes ? '√' : '×')],
        steps: [LIST, yes ? `${z.py} 在里面，是整体认读音节，直接读` : `${z.py} 不在里面，是 ${z.sm} 和 ${z.yun} 拼成的两拼音节`],
      };
    },
  },
  {
    id: 'y1a-py-ugui', subject: 'yw', grade: 1, term: 1, unit: '拼音', name: 'ü 去两点',
    tip: '小 ü 有礼貌，见了 j q x y，就把帽子（两点）摘掉；和 n、l 拼时两点不能去', level: 2,
    gen(r) {
      const mode = r.int(0, 3);
      if (mode === 0) {
        const sm = r.pick(['j', 'q', 'x', 'y', 'n', 'l']);
        const y = r.pick('nl'.includes(sm) ? ['ü', 'üe'] : ['ü', 'üe', 'ün']);
        const drop = !'nl'.includes(sm);
        const right = sm + (drop ? y.replace('ü', 'u') : y), wrong = sm + (drop ? y : y.replace('ü', 'u'));
        return {
          q: `${sm} 和 ${y} 相拼，音节写对的是？`, answer: [choice(r.shuffle([right, wrong]), right)],
          steps: drop
            ? ['小 ü 见了 j q x y，就把两点去掉，读音还是 ü', `${sm} 和 ${y} 相拼写成 ${right}`]
            : [`n、l 既能和 u 拼，也能和 ü 拼，所以 ü 的两点不能去`, `去掉两点就成了 ${wrong}，读音变了`, `写成 ${right}`],
        };
      }
      if (mode === 3) {
        const NL = [['女', 'nǚ', 'nǔ', '女儿'], ['绿', 'lǜ', 'lù', '绿色'], ['路', 'lù', 'lǜ', '马路'], ['鹿', 'lù', 'lǜ', '小鹿'], ['驴', 'lǘ', 'lú', '小毛驴'], ['旅', 'lǚ', 'lǔ', '旅行'], ['炉', 'lú', 'lǘ', '火炉'], ['努', 'nǔ', 'nǚ', '努力']];
        const [ch, right, wrong, word] = r.pick(NL);
        const isU = right.includes('ü') || /[ǖǘǚǜ]/.test(right);
        return {
          q: `给加点的字选正确的音节：\n${bold(word, ch)}`, answer: [choice(r.shuffle([right, wrong]), right)],
          steps: ['n、l 后面的 ü 不去两点：nü 和 nu、lü 和 lu 是不一样的音', `读一读「${word}」，「${ch}」的韵母是 ${isU ? 'ü' : 'u'}`, `所以写 ${right}`],
        };
      }
      // u 本来是 u 还是 ü
      const items = Z.filter((x) => x.sm && x.ym[0] === 'u' && x.kind);
      const z = r.pick(items);
      const isU = 'jqxy'.includes(z.sm);
      return {
        q: `「${z.ch}」的音节是 ${z.py}，里面的 u 本来是 u 还是 ü？`,
        answer: [choice(['u', 'ü'], isU ? 'ü' : 'u')],
        steps: isU
          ? ['j q x y 从来不和 u 相拼，它们后面的 u 都是 ü 去掉了两点', `${z.py} 的声母是 ${z.sm}，所以这个 u 本来是 ü`]
          : [`只有 j q x y 后面的 u 才是 ü 变的`, `${z.py} 的声母是 ${z.sm}，这个 u 就是 u`],
      };
    },
  },
  {
    id: 'y1a-py-biaodiao', subject: 'yw', grade: 1, term: 1, unit: '拼音', name: '声调标在哪',
    tip: '有 a 不放过，没 a 找 o e，i u 并列标在后', level: 2,
    gen(r) {
      const items = Z.filter((x) => x.t && [...x.b].filter((c) => 'aoeiuü'.includes(c)).length >= 2 && x.b !== 'er');
      const z = r.pick(items), k = tonePos(z.b), v = z.b[k];
      const why = z.b.includes('a') ? `${z.b} 里有 a，声调标在 a 上`
        : z.b.includes('o') ? `${z.b} 里没有 a，有 o，标在 o 上`
          : z.b.includes('e') ? `${z.b} 里没有 a，有 e，标在 e 上`
            : `${z.b} 里 i 和 u 并列，标在后面的 ${v} 上`;
      const steps = ['标调口诀：有 a 不放过，没 a 找 o e，i u 并列标在后', why];
      if (v === 'i') steps.push('给 i 标调时，i 上面的点要去掉');
      steps.push(`所以写成 ${z.py}`);
      if (r.chance(0.5)) {
        const vs = [...z.b].map((c, i) => [c, i]).filter(([c]) => 'aoeiuü'.includes(c));
        const options = uniq(vs.map(([, i]) => markAt(z.b, i, z.t)));
        return { q: `给「${z.ch}」的音节 ${z.b} 标上${TN[z.t]}，标对的是？`, answer: [choice(r.shuffle(options), z.py)], steps };
      }
      const letters = uniq([...z.b].filter((c) => 'aoeiuü'.includes(c)));
      return { q: `「${z.ch}」的音节 ${z.b} 要标${TN[z.t]}，声调符号标在哪个字母上？`, answer: [choice(r.shuffle(letters), v)], steps };
    },
  },
  {
    id: 'y1a-py-buquan', subject: 'yw', grade: 1, term: 1, unit: '拼音', name: '音节补一补',
    tip: '先读准字音，再想缺的是开头的声母还是后面的韵母', level: 2,
    gen(r) {
      const z = r.pick(Z.filter((x) => x.kind === '两拼音节' && !'yw'.includes(x.sm) && LP_YUN.includes(x.ym)));
      if (r.bool()) {
        const options = opts(r, z.sm, SM_CONF[z.sm], SHENG.filter((x) => x !== 'y' && x !== 'w'));
        const d = options.find((x) => x !== z.sm);
        return {
          q: `「${z.ch}」（${z.word}）的音节缺了声母，补一补：\n{0}${ymT(z)}`,
          answer: [choice(options, z.sm)],
          steps: [`读一读「${z.ch}」：${z.py}`, `开头的声母是 ${z.sm}`, SYL.has(d + z.ym) ? `换成 ${d} 就读成 ${mark(d + z.ym, z.t)} 了` : `不是 ${d}`],
        };
      }
      const G = { a: ['o', 'e', 'ai', 'ao'], o: ['e', 'a', 'ou'], e: ['o', 'a', 'ei', 'en'], ai: ['ei', 'ao', 'an'], ei: ['ai', 'en', 'e'], ao: ['ou', 'ai', 'an'], ou: ['ao', 'o', 'e'], an: ['ang', 'en', 'ai'], en: ['eng', 'an', 'ei'], ang: ['an', 'eng', 'ao'], eng: ['en', 'ang', 'ei'] };
      const options = opts(r, ymT(z), G[z.ym].map((y) => mark(y, z.t)), []);
      return {
        q: `「${z.ch}」（${z.word}）的音节缺了韵母，补一补：\n${z.sm}{0}`,
        answer: [choice(options, ymT(z))],
        steps: [`读一读「${z.ch}」：${z.py}`, `去掉声母 ${z.sm}，剩下的韵母是 ${z.ym}，读${TN[z.t]}`, `所以填 ${ymT(z)}`],
      };
    },
  },
  {
    id: 'y1a-py-tingyin', subject: 'yw', grade: 1, term: 1, unit: '拼音', name: '听音选音节',
    tip: '先听声母，再听韵母，最后听声调', level: 2,
    gen(r) {
      const z = r.pick(Z_OK.filter((x) => x.t));
      const ds = confusers(r, z.py, 3, z.alt);
      const parts = z.kind === '整体认读音节' ? '整体认读音节' : z.sm ? `声母 ${z.sm}，韵母 ${z.yun}` : `没有声母，韵母 ${z.yun}`;
      return {
        q: '听一听，选出你听到的音节：',
        say: z.ch,
        answer: [choice(r.shuffle([z.py, ...ds]), z.py)],
        steps: ['先听声母，再听韵母，最后听声调', `听到的是「${z.ch}」，读 ${z.py}：${parts}，${TN[z.t]}`, diffNote(z.py, ds[0])],
      };
    },
  },

  // ---------------- 拼音 · 一年级下册 ----------------
  {
    id: 'y1b-py-daxiaoxie', subject: 'yw', grade: 1, term: 2, unit: '拼音', name: '大写小写配对',
    tip: '大写字母和小写字母一对一对记；b d p q 方向不同，别弄混', level: 1,
    gen(r) {
      const L = 'abcdefghijklmnopqrstuvwxyz';
      const LO = { b: 'dpq', d: 'bpq', p: 'qbd', q: 'pgd', g: 'qjy', m: 'nwh', n: 'mhu', h: 'nkb', u: 'nvy', v: 'uwy', w: 'mvu', i: 'jlt', j: 'igl', l: 'ijt', t: 'flj', f: 'tjl', a: 'odg', o: 'ace', c: 'eoa', e: 'cao', k: 'hxr', x: 'kyz', y: 'vgj', r: 'nkt', s: 'zcx', z: 'sxn' };
      const UP = { B: 'DPR', D: 'BOP', P: 'RBF', R: 'PBK', E: 'FBL', F: 'EPT', M: 'NWH', N: 'MHZ', W: 'MVN', U: 'VOJ', V: 'UYW', O: 'QDC', Q: 'OGD', C: 'GOQ', G: 'CQO', I: 'LJT', J: 'ILU', L: 'IJT', K: 'XRH', X: 'KYZ', Y: 'VXT', T: 'IFY', H: 'NKA', A: 'VHR', S: 'ZCG', Z: 'SNX' };
      const l = r.pick([...L]), U = l.toUpperCase();
      if (r.bool()) {
        const options = opts(r, l, [...LO[l]], [...L]);
        const d = options.find((x) => x !== l);
        return {
          q: `大写字母「${U}」的小写是？`, answer: [choice(options, l)],
          steps: [`「${U}」和「${l}」是一对：大写 ${U}，小写 ${l}`, `「${d}」的大写是「${d.toUpperCase()}」，别弄混`],
        };
      }
      const options = opts(r, U, [...UP[U]], [...L.toUpperCase()]);
      const d = options.find((x) => x !== U);
      return {
        q: `小写字母「${l}」的大写是？`, answer: [choice(options, U)],
        steps: [`「${l}」和「${U}」是一对：小写 ${l}，大写 ${U}`, `「${d}」的小写是「${d.toLowerCase()}」，别弄混`],
      };
    },
  },
  {
    id: 'y1b-py-zimubiao', subject: 'yw', grade: 1, term: 2, unit: '拼音', name: '字母表排排队',
    tip: '唱字母歌找位置：A B C D E F G，H I J K L M N，O P Q，R S T，U V W，X Y Z', level: 1,
    gen(r) {
      const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const n = r.int(4, 6);
      let idx;
      if (r.bool()) { const s = r.int(0, 26 - n); idx = [...Array(n).keys()].map((i) => s + i); }
      else { const span = n + r.int(2, 5), s = r.int(0, 26 - span); idx = r.sample([...Array(span).keys()].map((i) => s + i), n).sort((a, b) => a - b); }
      const low = r.bool();
      const v = idx.map((i) => (low ? L[i].toLowerCase() : L[i]));
      return {
        q: '按字母表的顺序排一排：',
        answer: [{ kind: 'order', value: v, sep: ' ' }],
        steps: ['唱字母歌找位置：A B C D E F G，H I J K L M N，O P Q，R S T，U V W，X Y Z', `排好是：${v.join(' ')}`],
      };
    },
  },
  {
    id: 'y1b-py-zimulin', subject: 'yw', grade: 1, term: 2, unit: '拼音', name: '字母的前后邻居',
    tip: '在字母表里找到这个字母，看它前面、后面挨着谁', level: 1,
    gen(r) {
      const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const after = r.bool();
      const i = after ? r.int(0, 24) : r.int(1, 25);
      const ans = L[after ? i + 1 : i - 1];
      const low = r.bool(), f = (c) => (low ? c.toLowerCase() : c);
      const near = [i - 2, i - 1, i + 1, i + 2].filter((j) => j >= 0 && j < 26 && j !== i).map((j) => f(L[j]));
      const seg = L.slice(Math.max(0, i - 2), Math.min(26, i + 3)).split('').map(f).join(' ');
      return {
        q: `字母表里，紧挨在「${f(L[i])}」${after ? '后面' : '前面'}的是哪个字母？`,
        answer: [choice(opts(r, f(ans), near, [...L].filter((c) => c !== L[i]).map(f)), f(ans))],
        steps: ['按字母歌的顺序找：A B C D E F G，H I J K L M N，O P Q，R S T，U V W，X Y Z', `「${f(L[i])}」附近是：${seg}`, `${after ? '后面' : '前面'}紧挨着的是「${f(ans)}」`],
      };
    },
  },
  {
    id: 'y1b-py-yinxu', subject: 'yw', grade: 1, term: 2, unit: '拼音', name: '音序是哪个字母',
    tip: '音序就是音节的第一个字母，要写大写；zh ch sh 开头的只写 Z C S', level: 1,
    gen(r) {
      const z = r.pick(Z_OK.filter((x) => x.t));
      const f = z.b[0], F = f.toUpperCase();
      const prefer = [];
      if (['zh', 'ch', 'sh'].includes(z.sm)) prefer.push(z.sm.toUpperCase());
      prefer.push(f);
      (SM_CONF[z.sm] || []).forEach((s) => prefer.push(s[0].toUpperCase()));
      const altF = z.alt.map((x) => strip(x)[0].toUpperCase());
      const options = opts(r, F, prefer.filter((x) => x !== F && !altF.includes(x)), [...'BCDFGHJKLMNPQRSTWXYZ'].filter((x) => !altF.includes(x)));
      const steps = ['音序就是这个字音节的第一个字母，要写成大写', `「${z.ch}」读 ${z.py}，第一个字母是 ${f}`];
      if (z.sm.length === 2) steps.push(`${z.sm} 开头的字，音序只写第一个字母 ${F}，不写 ${z.sm.toUpperCase()}`);
      steps.push(`所以音序是大写的 ${F}`);
      return { q: `「${z.ch}」的音序是？`, answer: [choice(options, F)], steps };
    },
  },
  {
    id: 'y1b-py-yinxupai', subject: 'yw', grade: 1, term: 2, unit: '拼音', name: '按音序排一排',
    tip: '先找出每个字的音序（音节第一个字母），再按字母表的顺序排', level: 2,
    gen(r) {
      const n = r.int(3, 5);
      const by = new Map();
      for (const z of r.shuffle(Z_OK)) if (!by.has(z.b[0])) by.set(z.b[0], z);
      const pick = r.sample([...by.values()], n).sort((a, b) => (a.b[0] < b.b[0] ? -1 : 1));
      return {
        q: '按音序给这些字排排队，音序在字母表里靠前的排前面：',
        answer: [{ kind: 'order', value: pick.map((z) => z.ch), sep: ' ' }],
        steps: [`先找音序：${pick.map((z) => `${z.ch} ${z.py}，音序 ${z.b[0].toUpperCase()}`).join('；')}`, `按字母表顺序 ${pick.map((z) => z.b[0].toUpperCase()).join(' ')} 排：${pick.map((z) => z.ch).join(' ')}`],
      };
    },
  },

  // ---------------- 识字写字 · 一年级上册 ----------------
  {
    id: 'y1a-hz-bihua', subject: 'yw', grade: 1, term: 1, unit: '识字写字', name: '笔画名称',
    tip: '按笔顺一笔一笔数，看这一笔的样子：拐弯的笔画先说横或竖，再说怎么拐', level: 1,
    gen: genBihua(BH['1a'], 0.5),
  },
  {
    id: 'y1a-hz-bihuashu', subject: 'yw', grade: 1, term: 1, unit: '识字写字', name: '数笔画',
    tip: '按笔顺一边写一边数，拐弯的笔画是一笔写成的，只算一画', level: 1,
    gen: genBihuashu(BH['1a']),
  },
  {
    id: 'y1a-hz-bishun', subject: 'yw', grade: 1, term: 1, unit: '识字写字', name: '选对笔顺',
    tip: '按笔顺规则在心里写一遍：先横后竖、先撇后捺、从上到下、从左到右……', level: 2,
    gen(r) { return genBishunSeq(r, r.pick(BH['1a'].filter(seqOK(7)))); },
  },
  {
    id: 'y1a-hz-dijibi', subject: 'yw', grade: 1, term: 1, unit: '识字写字', name: '这一笔是第几笔',
    tip: '从第一笔开始按笔顺数，数到这一笔就知道是第几笔', level: 1,
    gen(r) { return genDijibi(r, r.pick(BH['1a'].filter(dijibiOK))); },
  },
  {
    id: 'y1a-hz-guize', subject: 'yw', grade: 1, term: 1, unit: '识字写字', name: '笔顺规则',
    tip: '先横后竖，先撇后捺，从上到下，从左到右，从外到内，从外到内后封口，先中间后两边', level: 2,
    gen(r) {
      const DO = { 先横后竖: '先写横，再写竖', 先撇后捺: '先写撇，再写捺', 从上到下: '先写上面，再写下面', 从左到右: '先写左边，再写右边', 从外到内: '先写外面，再写里面', 从外到内后封口: '先写外框，再写里面，最后一笔封口', 先中间后两边: '先写中间，再写两边' };
      const seqLine = (ch) => { const e = BH_ALL.get(ch); return e && e.sure ? `「${ch}」的笔顺：${seqText(e.names)}` : null; };
      const mode = r.int(0, 2);
      if (mode === 0) {
        const [ch, tags] = r.pick(RULE_ZI);
        const rule = tags[0];
        return {
          q: `写「${ch}」，用的是哪一条笔顺规则？`,
          answer: [choice(opts(r, rule, [], RULES.filter((x) => !tags.includes(x))), rule)],
          steps: [seqLine(ch), `${DO[rule]}，这是「${rule}」`].filter(Boolean),
        };
      }
      if (mode === 1) {
        const rule = r.pick(RULES);
        const [ch] = r.pick(RULE_ZI.filter((z) => z[1][0] === rule));
        const others = r.sample(RULE_ZI.filter((z) => !z[1].includes(rule)), 3);
        return {
          q: `下面哪个字的笔顺是「${rule}」？`,
          answer: [choice(r.shuffle([ch, ...others.map((z) => z[0])]), ch)],
          steps: [`「${rule}」：${DO[rule]}`, seqLine(ch) || `「${ch}」：${DO[rule]}`, `「${others[0][0]}」是${others[0][1][0]}`].filter(Boolean),
        };
      }
      const [ch, a, b, rule] = r.pick(PARTS);
      return {
        q: `写「${ch}」，先写哪一部分？`,
        answer: [choice(r.shuffle([a, b]), a)],
        steps: [`笔顺规则「${rule}」：${DO[rule]}`, `「${ch}」先写「${a}」，再写「${b}」`],
      };
    },
  },

  // ---------------- 识字写字 · 一年级下册 ----------------
  {
    id: 'y1b-hz-bihua', subject: 'yw', grade: 1, term: 2, unit: '识字写字', name: '笔画名称',
    tip: '拐弯的笔画按写的顺序叫：先写的在前，像横折钩就是横、折、钩', level: 2,
    gen: genBihua(BH['1b'], 0.7),
  },
  {
    id: 'y1b-hz-bihuashu', subject: 'yw', grade: 1, term: 2, unit: '识字写字', name: '数笔画',
    tip: '按笔顺一边写一边数，横折钩、竖弯钩这样的笔画只算一画', level: 1,
    gen: genBihuashu(BH['1b']),
  },
  {
    id: 'y1b-hz-bishun', subject: 'yw', grade: 1, term: 2, unit: '识字写字', name: '笔顺写一写',
    tip: '按笔顺规则在心里写一遍，再数清这一笔是第几笔', level: 2,
    gen(r) {
      if (r.bool()) return genBishunSeq(r, r.pick(BH['1b'].filter(seqOK(8))));
      return genDijibi(r, r.pick(BH['1b'].filter(dijibiOK)));
    },
  },
  {
    id: 'y1b-hz-pianpang', subject: 'yw', grade: 1, term: 2, unit: '识字写字', name: '认偏旁',
    tip: '先找出字的偏旁（多在左边或上面），再说出它的名字', level: 1,
    gen(r) {
      const rads = [...PG.values()].filter((p) => p.lv === '1b' && p.name && RAD_ZI.get(p.g));
      const TB = ['氵', '扌', '亻', '艹', '讠', '犭'];
      if (r.chance(0.35)) {
        const g = r.pick(TB), p = PG.get(g);
        const ch = r.pick(RAD_ZI.get(g));
        const otherZi = rads.filter((q) => q.g !== g).flatMap((q) => RAD_ZI.get(q.g)).filter((c) => !(HAS[c] || []).includes(g) && !RAD_ZI.get(g).includes(c));
        const ds = r.sample(otherZi, 3);
        return {
          q: `下面哪个字的偏旁是${p.name}？`, answer: [choice(r.shuffle([ch, ...ds]), ch)],
          steps: [`${p.name}是「${g}」`, `「${ch}」的${posOf(g)}是「${g}」`, `「${ds[0]}」的偏旁不是「${g}」`],
        };
      }
      const p = r.pick(rads);
      const ch = r.pick(RAD_ZI.get(p.g));
      const names = radDistractors(r, p.g, ch).map((g) => PG.get(g).name).filter(Boolean);
      return {
        q: `「${ch}」的偏旁是什么？`,
        answer: [choice(opts(r, p.name, names.slice(0, 3), names), p.name)],
        steps: [`「${ch}」的${posOf(p.g)}是「${p.g}」`, `「${p.g}」叫${p.name}${p.mean ? `，${p.name}的字多和${p.mean}有关` : ''}`],
      };
    },
  },
  {
    id: 'y1b-hz-pangyi', subject: 'yw', grade: 1, term: 2, unit: '识字写字', name: '偏旁猜意思',
    tip: '偏旁常常表示字的意思：三点水和水有关，提手旁和手的动作有关', level: 2,
    gen: genPangyi('1b'),
  },
  {
    id: 'y1b-hz-jiapang', subject: 'yw', grade: 1, term: 2, unit: '识字写字', name: '加偏旁变新字',
    tip: '给熟字加上偏旁变成新字，偏旁告诉你新字的意思', level: 2,
    gen(r) {
      const fams = FAM.filter((f) => f.g === '1b' && f.items.length >= 2);
      const f = r.pick(fams);
      const [ch, g, , word] = r.pick(f.items);
      const others = f.items.filter(([c]) => c !== ch).map(([c]) => c);
      const options = r.shuffle([ch, ...r.sample(others, Math.min(3, others.length))]);
      const m = meanOf(g);
      if (r.bool() && famWordOK(f, ch, word)) {
        return {
          q: `给「${f.base}」加上偏旁，填进词语：\n${word.replace(ch, '{0}')}`,
          answer: [choice(options, ch)],
          steps: [`这几个字都由「${f.base}」加偏旁变成，看偏旁想意思`, m && !NOT_MEAN.has(ch) ? `「${word}」和${m}有关，要加${radName(g) || `「${g}」`}` : `「${word}」的「${ch}」是${radName(g) || `「${g}」`}`, `所以填「${ch}」`],
        };
      }
      return {
        q: `「${f.base}」加上${radText(g)}，变成哪个字？`,
        answer: [choice(options, ch)],
        steps: [`把${radText(g)}加在「${f.base}」的${posOf(g)}，就是「${ch}」`, m && !NOT_MEAN.has(ch) ? `${word}的「${ch}」，${radName(g)}和${m}有关` : `${word}的「${ch}」`],
      };
    },
  },
  {
    id: 'y1b-hz-jiegou', subject: 'yw', grade: 1, term: 2, unit: '识字写字', name: '汉字结构',
    tip: '看字能不能分开：不能分的是独体字，左右分开是左右结构，上下分开是上下结构', level: 1,
    gen: genJiegou(['独体结构', '左右结构', '上下结构']),
  },

  // ---------------- 识字写字 · 二年级上册 ----------------
  {
    id: 'y2a-hz-bihua', subject: 'yw', grade: 2, term: 1, unit: '识字写字', name: '难写的笔画',
    tip: '复杂笔画按写的顺序叫名字：横折折撇、横撇弯钩、竖折折钩……一笔写成', level: 2,
    gen: genBihua(BH['2a'], 0.85),
  },
  {
    id: 'y2a-hz-bihuashu', subject: 'yw', grade: 2, term: 1, unit: '识字写字', name: '易错笔画数',
    tip: '马、弓、及、那这类字里有一笔写成的复杂笔画，只算一画，别多数', level: 2,
    gen: genBihuashu([...BH['2a'], ...BH_HARD_EARLY.map((c) => BH_ALL.get(c))]),
  },
  {
    id: 'y2a-hz-bishun', subject: 'yw', grade: 2, term: 1, unit: '识字写字', name: '易错笔顺',
    tip: '火先写点、万先写横再写横折钩；走之的字先写里面，走字旁的字先写「走」', level: 3,
    gen(r) {
      const mode = r.int(0, 2);
      if (mode === 0) {
        const [ch, a, b, why] = r.pick(PARTS_ZOU);
        return {
          q: `写「${ch}」，先写哪一部分？`, answer: [choice(r.shuffle([a, b]), a)],
          steps: [why, `「${ch}」先写「${a}」，再写「${b}」`],
        };
      }
      const pool = [...BH['2a'], ...BH_HARD_EARLY.map((c) => BH_ALL.get(c))].filter(seqOK(8));
      if (mode === 1) return genBishunSeq(r, r.pick(pool));
      const e = r.pick(pool), first = r.bool(), k = first ? 0 : e.names.length - 1, name = e.names[k];
      return {
        q: `「${e.ch}」的${first ? '第一笔' : '最后一笔'}是什么？`,
        answer: [choice(opts(r, name, uniq([...(SIM[name] || []), ...e.names]).filter((x) => x !== name), namePool(pool)), name)],
        steps: [`「${e.ch}」的笔顺：${seqText(e.names)}`, `${first ? '第一笔' : '最后一笔'}是「${name}」`, NOTE[e.ch] || `写的时候先在心里过一遍笔顺`],
      };
    },
  },
  {
    id: 'y2a-hz-bushou', subject: 'yw', grade: 2, term: 1, unit: '识字写字', name: '找部首',
    tip: '部首多是表示意思的偏旁：左右结构多在左边，上下结构多在上面，包围结构在外面', level: 2,
    gen(r) {
      const b = r.pick(BUSHOU);
      const ds = radDistractors(r, b.bs, b.ch);
      const p = PG.get(b.bs);
      return {
        q: `「${b.ch}」的部首是？`,
        answer: [choice(opts(r, b.bs, ds.slice(0, 3), ds), b.bs)],
        steps: [`「${b.ch}」的${posOf(b.bs)}是「${b.bs}」${p.name ? `（${p.name}）` : ''}`, p.mean ? `「${b.bs}」表示意思，和${p.mean}有关，就是部首` : `查字典时，「${b.ch}」在「${b.bs}」部`],
      };
    },
  },
  {
    id: 'y2a-hz-yinxucha', subject: 'yw', grade: 2, term: 1, unit: '识字写字', name: '音序查字法',
    tip: '知道读音用音序查字法：先查音序（音节第一个字母的大写），再查音节', level: 2,
    gen(r) {
      const z = r.pick(Z_OK.filter((x) => x.t && x.kind));
      const F = z.b[0].toUpperCase();
      const altF = z.alt.map((x) => strip(x)[0].toUpperCase());
      const fo = opts(r, F, [z.sm.length === 2 ? z.sm.toUpperCase() : null, z.b[0], ...(SM_CONF[z.sm] || []).map((s) => s[0].toUpperCase())].filter((x) => x && x !== F && !altF.includes(x)), [...'BCDFGHJKLMNPQRSTWXYZ'].filter((x) => !altF.includes(x)));
      const ds = confusers(r, z.py, 3, z.alt);
      return {
        q: `用音序查字法查「${z.ch}」：\n先查音序 {0}，再查音节 {1}`,
        answer: [choice(fo, F), choice(r.shuffle([z.py, ...ds]), z.py)],
        steps: ['音序查字法：先查音序，就是音节的第一个字母，要用大写；再在这个字母下面找音节', `「${z.ch}」读 ${z.py}，音序是 ${F}${z.sm.length === 2 ? `（只写第一个字母，不写 ${z.sm.toUpperCase()}）` : ''}`, `再找音节 ${z.py}`],
      };
    },
  },
  {
    id: 'y2a-hz-bushoucha', subject: 'yw', grade: 2, term: 1, unit: '识字写字', name: '部首查字法',
    tip: '不知道读音用部首查字法：先查部首，再数除部首外还有几画（总画数 − 部首画数）', level: 3,
    gen(r) {
      const b = r.pick(BUSHOU), p = PG.get(b.bs), rest = b.n - p.n;
      const ds = radDistractors(r, b.bs, b.ch);
      const near = r.shuffle([rest - 2, rest - 1, rest + 1, rest + 2].filter((x) => x >= 0 && x !== b.n));
      const no = uniq([rest, ...(r.bool() ? [b.n] : []), ...near]).slice(0, 4).sort((x, y) => x - y).map((x) => `${x} 画`);
      return {
        q: `用部首查字法查「${b.ch}」：\n先查部首 {0}，再查除部首外有几画 {1}`,
        answer: [choice(opts(r, b.bs, ds.slice(0, 3), ds), b.bs), choice(no, `${rest} 画`)],
        steps: [`「${b.ch}」的部首是「${b.bs}」${p.name ? `（${p.name}）` : ''}，部首有 ${p.n} 画`, `「${b.ch}」一共 ${b.n} 画`, `除部首外：${b.n} − ${p.n} = ${rest} 画`],
        hint: '先数整个字有几画，再减去部首的画数',
      };
    },
  },
  {
    id: 'y2a-hz-jiegou', subject: 'yw', grade: 2, term: 1, unit: '识字写字', name: '汉字结构分一分',
    tip: '看字分成几部分、怎么排：左中右、上中下是分成三部分；包围结构看外框包了几面', level: 2,
    gen: genJiegou(Object.keys(JIEGOU)),
  },
  {
    id: 'y2a-hz-huanpang', subject: 'yw', grade: 2, term: 1, unit: '识字写字', name: '换偏旁变新字',
    tip: '换一个偏旁，字的意思跟着变：看新偏旁表示什么', level: 2,
    gen(r) {
      const f = r.pick(FAM.filter((x) => x.items.length >= 2));
      const [a, b] = r.sample(f.items, 2);
      if (r.bool() && radName(a[1]) && radName(b[1])) {
        const others = f.items.filter(([c]) => c !== b[0] && c !== a[0]).map(([c]) => c);
        const options = r.shuffle([b[0], a[0], ...r.sample(others, Math.min(2, others.length))]);
        return {
          q: `把「${a[0]}」的${radName(a[1])}换成${radName(b[1])}，变成哪个字？`,
          answer: [choice(options, b[0])],
          steps: [`「${a[0]}」去掉${radName(a[1])}剩下「${f.base}」`, `「${f.base}」加上${radText(b[1])}是「${b[0]}」：${b[3]}`, meanOf(b[1]) && !NOT_MEAN.has(b[0]) ? `${radName(b[1])}和${meanOf(b[1])}有关` : `记住这个字：${b[3]}`],
        };
      }
      const right = radName(b[1]) || `「${b[1]}」`;
      const pool = [...PG.values()].filter((p) => p.name).map((p) => p.name);
      const prefer = f.items.filter(([c]) => c !== b[0]).map(([, g]) => radName(g)).filter(Boolean);
      return {
        q: `「${a[0]}」换一个偏旁，就成了「${b[3]}」的「${b[0]}」。换上的是什么偏旁？`,
        answer: [choice(opts(r, right, r.shuffle(prefer).slice(0, 2), pool), right)],
        steps: [`「${a[0]}」和「${b[0]}」都有「${f.base}」，只是偏旁不同`, `「${b[0]}」的偏旁是「${b[1]}」，叫${right}`, meanOf(b[1]) && !NOT_MEAN.has(b[0]) ? `${b[3]}和${meanOf(b[1])}有关，所以用${right}` : `记住：${b[3]}的「${b[0]}」用${right}`],
      };
    },
  },

  // ---------------- 识字写字 · 二年级下册 ----------------
  {
    id: 'y2b-hz-pangyi', subject: 'yw', grade: 2, term: 2, unit: '识字写字', name: '偏旁表意思',
    tip: '偏旁表示意思：衣字旁和衣服有关，示字旁和祝福有关，贝字旁和钱有关……', level: 2,
    gen: genPangyi('2a'),
  },
];
