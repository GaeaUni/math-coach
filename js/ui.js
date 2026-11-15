// 吉祥物「数数」（原创猫头鹰）和读题
export function mascot(mood = 'normal', size = 120) {
  const eyes = {
    normal: '<circle cx="38" cy="50" r="13" fill="#fff"/><circle cx="72" cy="50" r="13" fill="#fff"/><circle cx="40" cy="52" r="6.5" fill="#1d2433"/><circle cx="70" cy="52" r="6.5" fill="#1d2433"/><circle cx="42" cy="49" r="2.2" fill="#fff"/><circle cx="72" cy="49" r="2.2" fill="#fff"/>',
    happy: '<path d="M27 52 Q38 40 49 52" stroke="#1d2433" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M61 52 Q72 40 83 52" stroke="#1d2433" stroke-width="5" fill="none" stroke-linecap="round"/>',
    think: '<circle cx="38" cy="50" r="13" fill="#fff"/><circle cx="72" cy="50" r="13" fill="#fff"/><circle cx="42" cy="45" r="6" fill="#1d2433"/><circle cx="76" cy="45" r="6" fill="#1d2433"/>',
    cheer: '<circle cx="38" cy="50" r="13" fill="#fff"/><circle cx="72" cy="50" r="13" fill="#fff"/><path d="M33 52 l5 -6 l5 6" stroke="#1d2433" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M67 52 l5 -6 l5 6" stroke="#1d2433" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    oops: '<circle cx="38" cy="51" r="12" fill="#fff"/><circle cx="72" cy="51" r="12" fill="#fff"/><circle cx="38" cy="54" r="6" fill="#1d2433"/><circle cx="72" cy="54" r="6" fill="#1d2433"/><path d="M26 36 L46 40" stroke="#3a3f7a" stroke-width="4" stroke-linecap="round"/><path d="M84 36 L64 40" stroke="#3a3f7a" stroke-width="4" stroke-linecap="round"/>',
  }[mood] || '';
  const wings = mood === 'cheer'
    ? '<path d="M14 66 Q2 40 12 30 Q22 48 26 70Z" fill="#5468e8"/><path d="M96 66 Q108 40 98 30 Q88 48 84 70Z" fill="#5468e8"/>'
    : '<path d="M16 64 Q8 84 22 98 Q26 80 26 66Z" fill="#5468e8"/><path d="M94 64 Q102 84 88 98 Q84 80 84 66Z" fill="#5468e8"/>';
  return `<svg class="mascot ${mood}" viewBox="0 0 110 120" width="${size}" height="${size * 120 / 110}" aria-hidden="true">
    <ellipse cx="55" cy="114" rx="30" ry="5" fill="rgba(0,0,0,.08)"/>
    ${wings}
    <path d="M24 30 L18 8 L40 22Z" fill="#6c7cf5"/><path d="M86 30 L92 8 L70 22Z" fill="#6c7cf5"/>
    <ellipse cx="55" cy="66" rx="36" ry="44" fill="#6c7cf5"/>
    <ellipse cx="55" cy="82" rx="23" ry="25" fill="#e3e8ff"/>
    <path d="M44 78 q4 4 8 0 M52 88 q4 4 8 0 M60 78 q4 4 8 0" stroke="#b9c3f7" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    ${eyes}
    <path d="M50 60 L60 60 L55 70Z" fill="#ff9f1c"/>
    <ellipse cx="28" cy="66" rx="6" ry="4" fill="#ff9db0" opacity=".7"/><ellipse cx="82" cy="66" rx="6" ry="4" fill="#ff9db0" opacity=".7"/>
    <path d="M30 22 L55 10 L80 22 L55 32Z" fill="#2b2f55"/><rect x="47" y="24" width="16" height="7" rx="2" fill="#2b2f55"/>
    <path d="M80 22 L80 36" stroke="#ffd23f" stroke-width="2.5"/><circle cx="80" cy="38" r="3.5" fill="#ffd23f"/>
    <path d="M44 108 l-4 6 M48 109 l0 6 M66 108 l4 6 M62 109 l0 6" stroke="#ff9f1c" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}

// ---------- 读题 ----------
const CN = '零一二三四五六七八九';
function spokenNum(s) { // 3/4 → 四分之三；保留阿拉伯数字给语音引擎读
  return s;
}
export function speakable(text) {
  return String(text)
    .replace(/<svg[\s\S]*?<\/svg>/g, '')
    .replace(/\[\[([^|\]]+)\|[^\]]+\]\]/g, '$1')
    .replace(/[a-zü]*[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ][a-zü]*/g, '') // 拼音读不好，不读
    .replace(/\{\{\s*(-?\d+)\s+(\d+)\/(\d+)\s*\}\}/g, '$1又$3分之$2')
    .replace(/\{\{\s*(-?\d+)\/(\d+)\s*\}\}/g, '$2分之$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\{\d+\}/g, '括号')
    .replace(/(?<=\d\s*)……/g, '余')
    .replace(/\+/g, '加').replace(/[－−]|(?<=\d\s*)-(?=\s*\d)/g, '减').replace(/×/g, '乘').replace(/÷/g, '除以').replace(/=/g, '等于')
    .replace(/>/g, '大于').replace(/</g, '小于').replace(/□/g, '方框').replace(/[（(]\s*[）)]/g, '括号')
    .replace(/\n/g, '，');
}
let voice = null;
export function speak(text, rate = 0.92) {
  if (!('speechSynthesis' in window)) return false;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(speakable(text));
    u.lang = 'zh-CN'; u.rate = rate;
    voice ||= speechSynthesis.getVoices().find((v) => /zh[-_]CN/i.test(v.lang) && /Tingting|婷婷|Lili|Yu-shu/i.test(v.name)) || speechSynthesis.getVoices().find((v) => /zh[-_]CN/i.test(v.lang));
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
    return true;
  } catch { return false; }
}
export const stopSpeak = () => { try { speechSynthesis.cancel(); } catch {} };

/** 圆环进度 SVG */
export function ring(pct, { size = 64, stroke = 8, color = '#fff', track = 'rgba(255,255,255,.3)', label = '' } = {}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, pct));
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>${label ? `<text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" font-size="${size / 4}" font-weight="800" fill="${color}">${label}</text>` : ''}</svg>`;
}

/** 单元配色：按单元名哈希到一组好看的颜色 */
const UNIT_COLORS = [
  ['#3b6cf6', '#e8efff', '🔢'], ['#ff7a45', '#fff0e8', '🧮'], ['#12b886', '#e3f9f1', '📐'], ['#ae3ec9', '#f8e8fc', '🧩'],
  ['#f59f00', '#fff6dd', '⏰'], ['#e64980', '#ffe8f1', '📏'], ['#1c7ed6', '#e5f2ff', '📊'], ['#2f9e44', '#e6f7e9', '🌳'],
  ['#7048e8', '#eee8ff', '💡'], ['#d9480f', '#ffece3', '🍎'],
];
const ICONS = [[/^拼音$/, '🔤'], [/^识字写字$/, '✍️'], [/^字音字形$/, '🔍'], [/^词语积累$/, '📚'], [/^句子$/, '💬'], [/^标点与修辞$/, '❗'], [/^古诗文$/, '📜'], [/^积累运用$/, '🌟'], [/^阅读方法$/, '📖'], [/时|钟|年|月|日/, '⏰'], [/人民币|元|钱|百分数（二）/, '💰'], [/图形|角|三角|四边|圆|面积|周长|长方体|正方体|圆柱|圆锥|多边形|平行|对称|运动|观察/, '📐'], [/长度|测量|千克|克|吨|公顷|单位/, '📏'], [/分数/, '🍕'], [/小数/, '🔹'], [/统计|数据|平均/, '📊'], [/方程|字母/, '🔤'], [/比例|比/, '⚖️'], [/广角|推理|规律|搭配|优化|鸽巢|集合|找次品|植树|拓展|思维|数与形|鸡兔/, '💡'], [/位置|方向/, '🧭'], [/乘|除/, '✖️'], [/加|减|数的认识|认识/, '➕'], [/负数/, '🌡️'], [/因数|倍数/, '🔢']];
export function unitStyle(name, idx) {
  const [c, bg] = UNIT_COLORS[idx % UNIT_COLORS.length];
  const icon = (ICONS.find(([re]) => re.test(name)) || [, '📘'])[1];
  return { c, bg, icon };
}
