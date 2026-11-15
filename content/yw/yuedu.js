// 阅读方法：每个题型只练一种阅读方法，孩子在很多篇原创短文上反复用同一个方法。
// 短文和题目在 ./data/yuedu-*.js（每篇：年级段 band、体裁 genre、标题 title、自然段 p、题目 qs）。
// 题目 { m: 方法, q: 问题, a: [正确, 干扰…], s: [依据, 易错…], mk?: 文中要加粗的原文片段 }，a[0] 是正确答案。
// 「认识自然段」由低年级短文的自然段和段意 ds 自动出题；其余题型都是手写题。
import LOW1 from './data/yuedu-low-1.js';
import LOW2 from './data/yuedu-low-2.js';
import MID1 from './data/yuedu-mid-1.js';
import MID3 from './data/yuedu-mid-3.js';
import HIGH1 from './data/yuedu-high-1.js';
import HIGH2 from './data/yuedu-high-2.js';

const PASSAGES = [...LOW1, ...LOW2, ...MID1, ...MID3, ...HIGH1, ...HIGH2];
const NUM = '①②③④⑤⑥⑦⑧⑨⑩';
const INDENT = '　　';

/** 短文：标题 + 各段（默认段首标 ①②③；indent 时段首空两格、不标序号）；mk 是要加粗的原文片段 */
function passageText(ps, { indent = false, mk } = {}) {
  let body = ps.p.map((t, i) => (indent ? INDENT : NUM[i]) + t).join('\n');
  if (mk) {
    const i = body.indexOf(mk);
    if (i >= 0) body = `${body.slice(0, i)}**${mk}**${body.slice(i + mk.length)}`;
  }
  return `${ps.title}\n${body}`;
}

/** 手写题题型：从某个年级段里取标了这个方法的题 */
function handSkill({ band, m, how, hint, ...def }) {
  const pool = PASSAGES.filter((ps) => ps.band === band).flatMap((ps) => ps.qs.filter((it) => it.m === m).map((it) => [ps, it]));
  return {
    ...def, subject: 'yw', unit: '阅读方法',
    gen(r) {
      const [ps, it] = r.pick(pool);
      const ans = it.a[0];
      return {
        q: `${passageText(ps, { mk: it.mk })}\n\n${it.q}`,
        answer: [{ kind: 'choice', options: r.shuffle(it.a), value: ans }],
        steps: [it.h || how, ...it.s, `所以选「${ans}」`],
        hint,
      };
    },
  };
}

// ---------- 认识自然段（低年级，自动出题）----------
const ZRD_HOW = '认识自然段：每个自然段开头都空两格，一段可以有好几行；从第一个空两格的地方往下数，题目不算自然段';
const ZRD = PASSAGES.filter((ps) => ps.band === '低' && ps.ds).flatMap((ps) => [
  { ps, kind: 'count' },
  ...ps.ds.map((_, i) => ({ ps, kind: 'which', i })),
  ...ps.ds.map((_, i) => ({ ps, kind: 'what', i })),
]);
const head = (t) => ([...t].length > 8 ? [...t].slice(0, 8).join('') + '……' : t);

function genZiranduan(r) {
  const { ps, kind, i } = r.pick(ZRD);
  const n = ps.p.length, text = passageText(ps, { indent: true });
  if (kind === 'count') {
    const others = r.sample([n - 2, n - 1, n + 1, n + 2].filter((x) => x >= 1), 3);
    const ans = `${n}个`;
    return {
      q: `${text}\n\n这篇短文有几个自然段？`,
      answer: [{ kind: 'choice', options: r.shuffle([n, ...others].map((x) => `${x}个`)), value: ans }],
      steps: [ZRD_HOW, `一个一个数开头空两格的地方：一共有 ${n} 处，就是 ${n} 个自然段`, `题目「${ps.title}」单独占一行，但它不是自然段，数进去就会多数一个`, `所以选「${ans}」`],
      hint: '用手指着每个开头空两格的地方，一个一个数',
    };
  }
  const others = [...ps.ds.keys()].filter((j) => j !== i);
  const j = r.pick(others.filter((x) => Math.abs(x - i) === 1));
  if (kind === 'which') {
    const ks = [i, ...r.sample(others, Math.min(3, others.length))].sort((a, b) => a - b);
    const ans = `第${i + 1}自然段`;
    return {
      q: `${text}\n\n哪一个自然段写了下面的内容？\n${ps.ds[i]}`,
      answer: [{ kind: 'choice', options: ks.map((k) => `第${k + 1}自然段`), value: ans }],
      steps: [ZRD_HOW, `数到第${i + 1}自然段：「${head(ps.p[i])}」，写的就是${ps.ds[i]}`, `旁边的第${j + 1}自然段写的是${ps.ds[j]}，不是这个内容`, `所以选「${ans}」`],
      hint: '先找到写这个内容的那段话，再数一数它是第几段',
    };
  }
  const ks = r.sample(others, Math.min(3, others.length));
  if (!ks.includes(j)) ks[0] = j;
  const ans = ps.ds[i];
  return {
    q: `${text}\n\n第${i + 1}自然段主要写了什么？`,
    answer: [{ kind: 'choice', options: r.shuffle([i, ...ks].map((k) => ps.ds[k])), value: ans }],
    steps: [ZRD_HOW, `数到第${i + 1}自然段：「${head(ps.p[i])}」，这一段写的是${ans}`, `「${ps.ds[j]}」是第${j + 1}自然段写的，数错一段就会选它`, `所以选「${ans}」`],
    hint: `先数到第${i + 1}个开头空两格的地方，再读这一段`,
  };
}

export default [
  // ===== 一年级下、二年级（短文 80~180 字）=====
  {
    id: 'y1b-yd-ziranduan', subject: 'yw', grade: 1, term: 2, unit: '阅读方法', name: '认识自然段',
    tip: '自然段开头空两格；一段一段数，题目不算自然段', level: 1, gen: genZiranduan,
  },
  handSkill({
    id: 'y1b-yd-zhaoxinxi', grade: 1, term: 2, name: '找信息', level: 1, band: '低', m: '找信息',
    tip: '看清问的是谁、几个、什么时候、在哪里，再回到文中找原句',
    how: '找信息：先看清题目问的是「谁」「几个」「什么时候」还是「在哪里」，再回到短文里找到写这件事的那句话',
    hint: '回到短文里，找到写这件事的那一句，读一读',
  }),
  handSkill({
    id: 'y2a-yd-ciyu', grade: 2, term: 1, name: '理解词语', level: 1, band: '低', m: '理解词语',
    tip: '把选项换进句子里读一读，意思不变的就是意思相近的词',
    how: '理解词语：把每个选项放回原来的句子里读一读，意思没变、读得通的，就是意思相近的词',
    hint: '把选项一个一个换进句子里读一读',
  }),
  handSkill({
    id: 'y2a-yd-juzi', grade: 2, term: 1, name: '读懂句子', level: 2, band: '低', m: '读懂句子',
    tip: '先找这句话说的是谁，再看它怎么样、干什么',
    how: '读懂句子：先找这句话说的是谁（什么），再看说它怎么样、干什么，然后和选项一个一个对',
    hint: '这句话说的是谁？它怎么了？',
  }),
  handSkill({
    id: 'y2b-yd-shunxu', grade: 2, term: 2, name: '理清顺序', level: 2, band: '低', m: '理清顺序',
    tip: '圈出先、再、接着、然后、最后和表示时间的词，按它们排',
    how: '理清顺序：圈出「先、再、接着、然后、最后」和「早上、中午、晚上」这样表示先后的词，按它们来排',
    hint: '找一找文中的「先」「然后」「最后」这类词',
  }),

  // ===== 三、四年级（短文 200~380 字）=====
  handSkill({
    id: 'y3a-yd-shangxiawen', grade: 3, term: 1, name: '联系上下文理解词语', level: 2, band: '中', m: '联系上下文理解词语',
    tip: '读词语前后的句子，用上下文的意思来解释词语',
    how: '联系上下文理解词语：读一读这个词前面和后面的句子，看上下文是怎么说的，再把选项放回句子里检验',
    hint: '读读这个词前面和后面的句子，找找线索',
  }),
  handSkill({
    id: 'y3a-yd-zhongxinju', grade: 3, term: 1, name: '找中心句', level: 2, band: '中', m: '找中心句',
    tip: '先看段首和段尾，找能概括整段意思的那句话',
    how: '找中心句：先看段落（文章）的开头和结尾，哪句话能把整段（整篇）的意思都概括进去，哪句就是中心句，其他句子都围绕它来写',
    hint: '先读开头一句和最后一句，看哪句能管住全段',
  }),
  handSkill({
    id: 'y3b-yd-duanyi', grade: 3, term: 2, name: '概括段意', level: 2, band: '中', m: '概括段意',
    tip: '有中心句就抓中心句；没有就说清这段写了谁（什么）、怎么样',
    how: '概括段意：先看这段有没有中心句；没有的话，想一想这段写了谁（什么）、怎么样，把几层意思合起来说，不能只说其中一句',
    hint: '这段话写了谁（什么）？主要说了它怎么样？',
  }),
  handSkill({
    id: 'y3b-yd-xiuci', grade: 3, term: 2, name: '修辞句的作用', level: 2, band: '中', m: '修辞句的作用',
    tip: '先认出比喻、拟人、排比、夸张，再想把什么写得怎么样',
    how: '修辞句：先认修辞——把甲说成像乙是比喻，把东西当人来写是拟人，三个及以上结构相同的句子连着用是排比，故意说得特别大或特别小是夸张；再想这样写突出了什么',
    hint: '这句话把什么写成了什么？',
  }),
  handSkill({
    id: 'y3b-yd-tedian', grade: 3, term: 2, name: '事物特点', level: 2, band: '中', m: '事物特点',
    tip: '找写样子、颜色、本领、习性、用处的句子，抓关键词',
    how: '找事物特点：找出写它的样子、颜色、本领、习性或用处的句子，抓住里面的关键词，选项要和原文说的一致',
    hint: '文中用了哪些词来写它？',
  }),
  handSkill({
    id: 'y4a-yd-zhuyao', grade: 4, term: 1, name: '概括主要内容', level: 2, band: '中', m: '概括主要内容',
    tip: '写事的：谁、因为什么、做了什么、结果怎样；写物的：写了什么、有什么特点',
    how: '概括主要内容：写事的文章说清「什么时候、在哪里、谁，因为什么，做了什么，结果怎样」；写景状物的文章说清写了什么、有什么特点。要概括全文，不能只说一部分',
    hint: '把每段的意思连起来想一想',
  }),
  handSkill({
    id: 'y4a-yd-renwu', grade: 4, term: 1, name: '人物品质和心情', level: 2, band: '中', m: '人物品质和心情',
    tip: '心情看当时的神态和动作，品质看他在事情里怎么说、怎么做',
    how: '体会人物：心情看他当时的表情、动作和说的话；品质看他在这件事里怎么说、怎么做、怎么选择',
    hint: '找到写他说话、动作、表情的句子',
  }),
  handSkill({
    id: 'y4b-yd-juzi', grade: 4, term: 2, name: '体会句子含义', level: 3, band: '中', m: '体会句子含义',
    tip: '联系上下文，想想这句话表面说什么、实际想说什么',
    how: '体会句子含义：先看这句话字面上说了什么，再联系前后发生的事，想一想作者真正想表达什么',
    hint: '这句话前后发生了什么事？',
  }),

  // ===== 五、六年级（短文 300~500 字）=====
  handSkill({
    id: 'y5a-yd-shuoming', grade: 5, term: 1, name: '说明方法', level: 2, band: '高', m: '说明方法',
    tip: '举例子、列数字、作比较、打比方、分类别、下定义，再说它说明了什么',
    how: '说明方法：用具体数字是列数字；拿两样东西比是作比较；举出具体事物是举例子；用「像」把它比成熟悉的东西是打比方；按种类分开说是分类别；用「……是……」准确说出它是什么是下定义',
    hint: '句子里有数字吗？有「像」吗？有两样东西在比吗？',
  }),
  handSkill({
    id: 'y5a-yd-duanluo', grade: 5, term: 1, name: '段落的作用', level: 2, band: '高', m: '段落作用',
    tip: '开头总起、引出下文；中间承上启下；结尾总结全文、照应开头',
    how: '段落作用：先看段落在哪儿、说了什么——开头的段落常总起全文、引出下文；中间的段落常承上启下；结尾的段落常总结全文、照应开头、点明中心',
    hint: '这段在文章的什么位置？它和前后的段落有什么关系？',
  }),
  handSkill({
    id: 'y5b-yd-miaoxie', grade: 5, term: 2, name: '人物描写方法', level: 2, band: '高', m: '人物描写方法',
    tip: '说的话是语言，做的事是动作，表情是神态，想的是心理，长相穿着是外貌',
    how: '人物描写方法：写人说的话是语言描写，写他怎么做是动作描写，写脸上的表情是神态描写，写他心里想什么是心理描写，写长相、穿着是外貌描写',
    hint: '这句写的是他说的、做的、想的，还是他的表情、长相？',
  }),
  handSkill({
    id: 'y6a-yd-shoufa', grade: 6, term: 1, name: '写作手法', level: 3, band: '高', m: '写作手法',
    tip: '首尾呼应、对比、以小见大、借物喻人、托物言志、细节描写',
    how: '写作手法：开头结尾说到同一件事是首尾呼应；把两种人或事物放在一起比是对比；通过小事写出大道理是以小见大；借物来比喻某一类人是借物喻人；借物表达作者自己的志向是托物言志；把小动作、小物件写得很细是细节描写',
    hint: '整篇文章是怎么安排的？作者借什么来写？',
  }),
  handSkill({
    id: 'y6a-yd-zhongxin', grade: 6, term: 1, name: '文章中心', level: 3, band: '高', m: '文章中心',
    tip: '看题目、开头结尾和抒情议论的句子，想作者要表达什么',
    how: '找文章中心：看题目、开头结尾和作者直接抒情、讲道理的句子，想想全文写这些是为了表达什么感情、说明什么道理；只说了一部分或只复述事情的都不是中心',
    hint: '读读最后一段，作者想告诉我们什么？',
  }),
  handSkill({
    id: 'y6b-yd-biaoti', grade: 6, term: 2, name: '标题的含义', level: 3, band: '高', m: '标题含义',
    tip: '题目有字面意思和深层意思，还可能是全文的线索',
    how: '理解标题：先说题目字面上指什么，再联系全文想它还比喻、象征着什么，以及它在文中起什么作用（线索、点明中心、引起兴趣）',
    hint: '题目里的这个东西在文中出现了几次？每次和谁有关？',
  }),
  handSkill({
    id: 'y6b-yd-shenyi', grade: 6, term: 2, name: '句子的深层含义', level: 3, band: '高', m: '句子深层含义',
    tip: '联系上下文和文章中心，读出字面背后的意思',
    how: '体会句子的深层含义：先说字面意思，再联系上下文和文章中心，想想句子背后说的道理或感情；关键词常常有比喻的意思',
    hint: '这句话里哪个词不能只看字面？',
  }),
];
