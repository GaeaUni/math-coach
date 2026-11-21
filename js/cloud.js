// 云端同步：把进度存成家长自己 GitHub 私有仓库里的一个 JSON 文件（GitHub 内容接口，浏览器直连）。
// 令牌只存在这台设备的 localStorage 里，不进进度、不进导出。浏览器和 Node（测试）都能用。
const KEY = 'mc:cloud';
export const DEFAULT_REPO = 'GaeaUni/math-coach-data';

export function cfg() {
  try { const c = JSON.parse(localStorage.getItem(KEY)); return c && c.repo && c.token ? c : null; } catch { return null; }
}
export function setCfg(c) {
  try { c ? localStorage.setItem(KEY, JSON.stringify(c)) : localStorage.removeItem(KEY); } catch {}
}

const b64e = (s) => { const b = new TextEncoder().encode(s); let x = ''; for (let i = 0; i < b.length; i += 0x8000) x += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(x); };
const b64d = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g, '')), (ch) => ch.charCodeAt(0)));

async function gh(c, path, init = {}) {
  let r;
  try {
    r = await fetch(`https://api.github.com/repos/${c.repo}${path}`, {
      ...init, cache: 'no-store',
      headers: { Authorization: `Bearer ${c.token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
      signal: AbortSignal.timeout ? AbortSignal.timeout(20000) : undefined,
    });
  } catch (e) {
    throw new Error(e.name === 'TimeoutError' ? '连 GitHub 超时了（网络慢或不通）' : '连不上 GitHub（网络不通）');
  }
  return r;
}
async function fail(c, r) {
  let msg = ''; try { msg = (await r.json()).message || ''; } catch {}
  if (r.status === 401) return new Error('令牌不对或已经过期，请重新生成');
  if (r.status === 403 && /rate limit/i.test(msg)) return new Error('同步太频繁，GitHub 暂时限流，过一会儿会自动再试');
  if (r.status === 403) return new Error('令牌没有这个仓库的读写权限（生成令牌时 Contents 要选 Read and write）');
  if (r.status === 404) return new Error(`找不到仓库 ${c.repo}（名字不对，或生成令牌时没选这个仓库）`);
  return new Error(`GitHub 返回 ${r.status}${msg ? '：' + msg : ''}`);
}

/** 读云端进度：{ data, sha }；文件还没有时 data、sha 都是 null */
export async function pull(c, file) {
  const r = await gh(c, `/contents/${file}`);
  if (r.status === 404) {
    const repo = await gh(c, '');
    if (!repo.ok) throw await fail(c, repo);
    return { data: null, sha: null };
  }
  if (!r.ok) throw await fail(c, r);
  const j = await r.json();
  return { data: JSON.parse(b64d(j.content)), sha: j.sha };
}
/** 写云端进度：sha 是读到的版本（文件还没有时传 null）。别的设备抢先写过时返回 { conflict: true } */
export async function push(c, file, data, sha) {
  const body = { message: `同步进度 ${new Date().toLocaleString('zh-CN', { hour12: false })}`, content: b64e(JSON.stringify(data)) };
  if (sha) body.sha = sha;
  const r = await gh(c, `/contents/${file}`, { method: 'PUT', body: JSON.stringify(body) });
  if (r.status === 409 || r.status === 422) return { conflict: true };
  if (!r.ok) throw await fail(c, r);
  return { sha: (await r.json()).content.sha };
}
