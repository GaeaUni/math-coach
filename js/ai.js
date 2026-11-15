// AI 老师：提示词（Mac 服务和 iPad 共用）+ iPad 直连模型接口
// 能在浏览器里直连的接口（2026-11-15 实测跨域预检）：火山方舟（豆包）、阿里百炼（通义）、Anthropic、OpenAI。
// Kimi、智谱、DeepSeek 不允许浏览器直连。

export const SYSTEM = `你是一位耐心、会鼓励人的北京小学数学老师，正在 iPad 上一对一辅导一个小学生。
说话对象是孩子：用简单、亲切的短句，像当面讲题；不要用 Markdown 标题、表格和 LaTeX，分数写成 3/4，乘除号用 × ÷。
回答控制在 250 字以内，分 2~5 小段或几个短行。
规则：
- 孩子还没答对时（提示模式），只引导思路、问一个关键问题，不要直接说出最后答案。
- 看草稿图时，先说清楚你在草稿上看到了什么（哪一步、哪个数），再指出具体错在哪里、为什么错；看不清就直说看不清，不要编。
- 讲方法时用孩子这个年级学过的方法（低年级用凑十、画图、数数；不要用方程，除非题目本来就是方程）。
- 最后用一句话鼓励，或者给一个马上能试的小练习。`;

export function buildPrompt(body) {
  const { mode, problem = {}, kid = {}, question, history = [] } = body;
  const lines = [];
  lines.push(`【年级】${problem.grade || '?'} 年级 ·【题型】${problem.skillName || ''}（${problem.tip || ''}）`);
  lines.push(`【题目】${problem.text || ''}`);
  if (problem.answerText) lines.push(`【标准答案】${problem.answerText}`);
  if (problem.steps?.length) lines.push(`【参考讲解】\n${problem.steps.join('\n')}`);
  if (kid.answerText) lines.push(`【孩子的答案】${kid.answerText}${kid.correct === true ? '（答对了）' : kid.correct === false ? '（答错了）' : ''}`);
  if (kid.wrongCount) lines.push(`【这个题型最近错了】${kid.wrongCount} 次`);
  if (history.length) lines.push('【刚才的对话】\n' + history.map((h) => `${h.role === 'kid' ? '孩子' : '老师'}：${h.text}`).join('\n'));
  const task = {
    hint: '孩子说「我不会」。请给提示：引导他想到关键的第一步，不要说出答案。',
    diagnose: '孩子答错了。附图是他的草稿（如果有）。请看草稿找出他具体错在哪一步、为什么，然后用最简单的方法讲一遍正确思路。',
    review: '孩子答对了，附图是他的解题过程。请检查过程是否规范完整（列式、单位、答句），指出可以改进的地方；过程没问题就具体地表扬他。',
    explain: '孩子看了讲解还是不太明白。请换一种更直观的讲法（举生活例子或画图的说法）把这道题讲清楚。',
    chat: `孩子问：「${question || ''}」。请回答他。`,
  }[mode] || `孩子问：「${question || ''}」。请回答他。`;
  lines.push(`【你要做的】${task}`);
  return lines.join('\n');
}

export function parseImage(dataUrl) {
  const m = /^data:(image\/(?:png|jpeg));base64,(.+)$/.exec(dataUrl || '');
  return m ? { mediaType: m[1], data: m[2] } : null;
}

/** 家长页里的接口预设。model 只是建议值，按买到的模型改 */
export const PRESETS = {
  ark: { label: '豆包（火山方舟）', kind: 'openai', baseURL: 'https://ark.cn-beijing.volces.com/api/v3', model: '', modelTip: '填方舟控制台里的模型 ID 或接入点 ID（ep-…），选带「vision」能看图的' },
  dashscope: { label: '通义（阿里百炼）', kind: 'openai', baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-vl-max', modelTip: '能看图的选 qwen-vl 系列' },
  anthropic: { label: 'Claude（Anthropic）', kind: 'anthropic', baseURL: 'https://api.anthropic.com', model: 'claude-sonnet-5-5', modelTip: '' },
  openai: { label: 'OpenAI', kind: 'openai', baseURL: 'https://api.openai.com/v1', model: '', modelTip: '' },
  custom: { label: '其他（OpenAI 兼容）', kind: 'openai', baseURL: '', model: '', modelTip: '接口要允许浏览器跨域访问' },
};

/** iPad 直连：cfg = { preset, kind, baseURL, apiKey, model, vision } */
export async function callDirect(cfg, body) {
  const text = buildPrompt(body);
  const image = cfg.vision === false ? null : parseImage(body.image);
  const base = String(cfg.baseURL || '').replace(/\/$/, '');
  if (!base || !cfg.apiKey || !cfg.model) throw new Error('家长页里 AI 接口没填完整');
  const signal = AbortSignal.timeout ? AbortSignal.timeout(90_000) : undefined;
  if (cfg.kind === 'anthropic') {
    const content = [];
    if (image) content.push({ type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.data } });
    content.push({ type: 'text', text });
    const official = /api\.anthropic\.com/.test(base);
    const r = await fetch(base + '/v1/messages', {
      method: 'POST', signal,
      headers: { 'Content-Type': 'application/json', 'x-api-key': cfg.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: cfg.model, max_tokens: 16000, ...(official ? { output_config: { effort: 'low' } } : {}), system: SYSTEM, messages: [{ role: 'user', content }] }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`接口返回 ${r.status}：${j.error?.message || JSON.stringify(j).slice(0, 200)}`);
    if (j.stop_reason === 'refusal') throw new Error('模型拒绝回答');
    return (j.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
  }
  const userContent = image ? [{ type: 'image_url', image_url: { url: `data:${image.mediaType};base64,${image.data}` } }, { type: 'text', text }] : text;
  const r = await fetch(base + '/chat/completions', {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({ model: cfg.model, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: userContent }] }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`接口返回 ${r.status}：${j.error?.message || JSON.stringify(j).slice(0, 200)}`);
  return String(j.choices?.[0]?.message?.content || '').trim();
}
