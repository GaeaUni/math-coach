// 星星、等级、徽章、每日目标
import { today, DAY } from './core.js';

export const LEVELS = [
  [0, '学习新手', '🌱'], [60, '勤学小兵', '✏️'], [180, '练习能手', '⚡'], [400, '解题小将', '🛡️'], [750, '思维达人', '🧠'],
  [1200, '学习明星', '🌟'], [1900, '智慧学霸', '🎓'], [2800, '小博士', '🦉'], [4000, '学习大师', '👑'], [6000, '学习传奇', '🚀'],
];
export function levelOf(stars) {
  let i = 0; while (i + 1 < LEVELS.length && stars >= LEVELS[i + 1][0]) i++;
  const [base, name, icon] = LEVELS[i], next = LEVELS[i + 1];
  return { i: i + 1, name, icon, base, next: next ? next[0] : null, pct: next ? (stars - base) / (next[0] - base) : 1 };
}

export function stats(P) {
  return (P.stats ||= { stars: 0, bestStreak: 0, fixed: 0, aiAsks: 0, challengeBest: 0, challenges: 0, examples: 0, badges: {} });
}

const totalN = (P) => Object.values(P.skills).reduce((a, s) => a + s.n, 0);
const masteredN = (P) => Object.values(P.skills).filter((s) => s.mastered).length;
/** 连续练习天数：今天还没练也不断（从昨天往前数） */
export const dayStreak = (P) => { let n = 0, t = Date.now(); if (!P.days[today(t)]?.n) t -= DAY; for (; P.days[today(t)]?.n; t -= DAY) n++; return n; };
const maxDay = (P) => Math.max(0, ...Object.values(P.days).map((d) => d.n));

export const BADGES = [
  { id: 'first', icon: '🎯', name: '开门红', desc: '第一次答对', ok: (P) => totalN(P) > 0 && Object.values(P.skills).some((s) => s.c > 0) },
  { id: 'streak10', icon: '🔥', name: '十连对', desc: '连续答对 10 题', ok: (P) => stats(P).bestStreak >= 10 },
  { id: 'streak20', icon: '💥', name: '二十连对', desc: '连续答对 20 题', ok: (P) => stats(P).bestStreak >= 20 },
  { id: 'streak50', icon: '☄️', name: '五十连对', desc: '连续答对 50 题', ok: (P) => stats(P).bestStreak >= 50 },
  { id: 'master1', icon: '🏅', name: '第一个掌握', desc: '掌握 1 个题型', ok: (P) => masteredN(P) >= 1 },
  { id: 'master5', icon: '🥉', name: '五项全能', desc: '掌握 5 个题型', ok: (P) => masteredN(P) >= 5 },
  { id: 'master20', icon: '🥈', name: '题型收集家', desc: '掌握 20 个题型', ok: (P) => masteredN(P) >= 20 },
  { id: 'master50', icon: '🥇', name: '题型大王', desc: '掌握 50 个题型', ok: (P) => masteredN(P) >= 50 },
  { id: 'day50', icon: '💪', name: '勤奋的一天', desc: '一天做 50 题', ok: (P) => maxDay(P) >= 50 },
  { id: 'day100', icon: '🏋️', name: '百题日', desc: '一天做 100 题', ok: (P) => maxDay(P) >= 100 },
  { id: 'days3', icon: '📅', name: '坚持三天', desc: '连续 3 天练习', ok: (P) => dayStreak(P) >= 3 },
  { id: 'days7', icon: '🗓️', name: '一周不断', desc: '连续 7 天练习', ok: (P) => dayStreak(P) >= 7 },
  { id: 'days30', icon: '🏆', name: '月度坚持王', desc: '连续 30 天练习', ok: (P) => dayStreak(P) >= 30 },
  { id: 'total500', icon: '📚', name: '五百题', desc: '累计做 500 题', ok: (P) => totalN(P) >= 500 },
  { id: 'total2000', icon: '🌊', name: '题海遨游', desc: '累计做 2000 题', ok: (P) => totalN(P) >= 2000 },
  { id: 'fixed10', icon: '🩹', name: '知错就改', desc: '订正 10 道错题', ok: (P) => stats(P).fixed >= 10 },
  { id: 'challenge20', icon: '⏱️', name: '闪电手', desc: '口算挑战 60 秒答对 20 题', ok: (P) => stats(P).challengeBest >= 20 },
  { id: 'challenge35', icon: '⚡', name: '快如闪电', desc: '口算挑战 60 秒答对 35 题', ok: (P) => stats(P).challengeBest >= 35 },
  { id: 'ask5', icon: '🙋', name: '爱问问题', desc: '向 AI 老师提问 5 次', ok: (P) => stats(P).aiAsks >= 5 },
  { id: 'star1000', icon: '✨', name: '千星', desc: '攒到 1000 颗星', ok: (P) => stats(P).stars >= 1000 },
];

/** 检查新徽章，返回新得到的 */
export function checkBadges(P) {
  const st = stats(P), got = [];
  for (const b of BADGES) if (!st.badges[b.id] && b.ok(P)) { st.badges[b.id] = Date.now(); got.push(b); }
  return got;
}

/** 加星，返回 { add, levelUp } */
export function addStars(P, n) {
  const st = stats(P), before = levelOf(st.stars).i;
  st.stars += n;
  return { add: n, levelUp: levelOf(st.stars).i > before ? levelOf(st.stars) : null };
}
