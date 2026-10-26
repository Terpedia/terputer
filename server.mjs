import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { runResearchAgent } from './research-agent.mjs';
import { listResearchProjects } from './research-projects.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4173);
const kbBase = (process.env.TERPEDIA_KB_API_URL || 'https://terpedia-knowledge-nanrsdlaoa-uc.a.run.app').replace(/\/$/, '');
const chatBase = (process.env.TERPEDIA_CHAT_API_URL || 'https://api.terpedia.com').replace(/\/$/, '');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8' };

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const setJson = (status, data) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(data)); };
  if (url.pathname === '/api/agent/chat' && req.method === 'POST') {
    try {
      let body = '';
      for await (const chunk of req) { body += chunk; if (body.length > 150_000) { setJson(413, { error: 'Agent request is too large.' }); return; } }
      const input = JSON.parse(body);
      const bearer = req.headers.authorization || '';
      input.githubSession = /^Bearer [A-Za-z0-9._-]+$/.test(bearer) ? bearer.slice(7) : null;
      setJson(200, await runResearchAgent(input));
    } catch (error) { setJson(error?.status || 500, { error: error instanceof Error ? error.message : 'Research agent failed.' }); }
    return;
  }
  if (url.pathname === '/api/terpedia/chat' && req.method === 'POST') {
    const bearer = req.headers.authorization;
    if (!/^Bearer [A-Za-z0-9._-]+$/.test(bearer || '')) { setJson(401, { error: 'Connect GitHub first.' }); return; }
    try {
      let body = '';
      for await (const chunk of req) { body += chunk; if (body.length > 100_000) { setJson(413, { error: 'Chat request is too large.' }); return; } }
      const input = JSON.parse(body);
      const query = String(input.query || '').trim();
      if (!query || query.length > 20_000) { setJson(400, { error: 'A research question is required.' }); return; }
      const upstream = await fetch(`${chatBase}/api/v1/query`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: bearer }, body: JSON.stringify({ query, task: input.task || undefined, study_id: input.study_id || undefined }), signal: AbortSignal.timeout(120_000) });
      const result = await upstream.json();
      setJson(upstream.status, result);
    } catch (error) { setJson(502, { error: error instanceof Error ? error.message : 'Research chat failed.' }); }
    return;
  }
  if (url.pathname === '/api/terpedia/github/status' && req.method === 'GET') {
    try { const upstream = await fetch(`${chatBase}/api/github/status`, { headers: { authorization: req.headers.authorization || '' }, signal: AbortSignal.timeout(10_000) }); setJson(upstream.status, await upstream.json()); }
    catch (error) { setJson(502, { error: error instanceof Error ? error.message : 'GitHub status failed.' }); }
    return;
  }
  if (url.pathname === '/api/terpedia/github/config' && req.method === 'GET') {
    try {
      const upstream = await fetch(`${chatBase}/api/github/config`, { signal: AbortSignal.timeout(10_000) });
      const data = await upstream.json();
      setJson(upstream.status, { ...data, connectUrl: `${chatBase}/api/github/connect` });
    } catch (error) { setJson(502, { enabled: false, error: error instanceof Error ? error.message : 'GitHub configuration is unavailable.' }); }
    return;
  }
  if (url.pathname === '/api/projects' && req.method === 'GET') {
    try { setJson(200, await listResearchProjects()); }
    catch (error) { setJson(500, { error: error instanceof Error ? error.message : 'Could not list projects.' }); }
    return;
  }
  if (url.pathname === '/api/kernel/status' && req.method === 'GET') { try { const upstream = await fetch('http://127.0.0.1:8765/api/kernel/status', { signal: AbortSignal.timeout(1500) }); const data = await upstream.json(); setJson(upstream.status, data); } catch { setJson(503, { connected: false, message: 'Python kernel service is unavailable.' }); } return; }
  if (url.pathname === '/api/kernel/execute' && req.method === 'POST') { try { let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 256_000) { setJson(413, { error: 'Cell exceeds 256 KB.' }); return; } } const upstream = await fetch('http://127.0.0.1:8765/api/kernel/execute', { method: 'POST', headers: { 'content-type': 'application/json' }, body, signal: AbortSignal.timeout(35_000) }); setJson(upstream.status, await upstream.json()); } catch (error) { setJson(502, { error: error instanceof Error ? error.message : 'Python kernel request failed.' }); } return; }
  if (url.pathname === '/api/notebooks' && req.method === 'GET') { try { const dir = join(root, 'notebooks'); const { readdir } = await import('node:fs/promises'); const files = await readdir(dir).catch(() => []); setJson(200, { notebooks: files.filter(name => /^[a-z0-9][a-z0-9-]{0,79}\.ipynb$/.test(name)) }); } catch { setJson(200, { notebooks: [] }); } return; }
  if (url.pathname === '/api/notebook/load' && req.method === 'GET') { try { const slug = url.searchParams.get('slug') || ''; if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(slug)) { setJson(400, { error: 'Invalid notebook name.' }); return; } const content = await readFile(join(root, 'notebooks', `${slug}.ipynb`), 'utf8'); const notebook = JSON.parse(content); if (notebook.nbformat !== 4 || !Array.isArray(notebook.cells)) { setJson(400, { error: 'File is not a supported Jupyter notebook.' }); return; } setJson(200, { notebook }); } catch { setJson(404, { error: 'Notebook was not found in this Codespace repository.' }); } return; }
  if (url.pathname === '/api/notebook/save' && req.method === 'PUT') { try { let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 5_000_000) { setJson(413, { error: 'Notebook exceeds 5 MB.' }); return; } } const input = JSON.parse(body); const slug = String(input.slug || 'research-notebook'); const valid = /^[a-z0-9][a-z0-9-]{0,79}$/.test(slug); const notebook = input.notebook; if (!valid || notebook?.nbformat !== 4 || !Array.isArray(notebook.cells)) { setJson(400, { error: 'Provide a valid notebook and lowercase notebook slug.' }); return; } const dir = join(root, 'notebooks'); await mkdir(dir, { recursive: true }); const path = join(dir, `${slug}.ipynb`); await writeFile(path, JSON.stringify(notebook, null, 2), { mode: 0o600 }); setJson(200, { path: `notebooks/${slug}.ipynb`, saved: true }); } catch (error) { setJson(400, { error: error instanceof Error ? error.message : 'Notebook save failed.' }); } return; }
  if (url.pathname === '/api/kb/search' && req.method === 'POST') {
    const key = process.env.TERPEDIA_KNOWLEDGE_API_KEY;
    if (!key) { res.writeHead(503, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: 'Set TERPEDIA_KNOWLEDGE_API_KEY in the server environment.' })); return; }
    try {
      let body = '';
      for await (const chunk of req) { body += chunk; if (body.length > 16_384) throw new Error('Request too large'); }
      const parsed = JSON.parse(body);
      const query = typeof parsed.query === 'string' ? parsed.query.trim() : '';
      const source = typeof parsed.source === 'string' ? parsed.source : 'all';
      const limit = Math.min(50, Math.max(1, Number(parsed.limit) || 10));
      if (!query) { res.writeHead(400, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: 'query is required' })); return; }
      if (!/^[a-z0-9_-]+$/i.test(source)) { res.writeHead(400, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: 'invalid source' })); return; }
      const upstream = await fetch(`${kbBase}/v1/tabular/search`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-knowledge-key': key }, body: JSON.stringify({ source, query, limit }), signal: AbortSignal.timeout(45_000) });
      const text = await upstream.text();
      res.writeHead(upstream.status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(text);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Knowledge API request failed';
      res.writeHead(502, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: message }));
    }
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
  const rawPath = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const file = normalize(join(root, 'dist', rawPath));
  if (!file.startsWith(join(root, 'dist'))) { res.writeHead(403); res.end(); return; }
  try {
    await stat(file);
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream' }); res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(port, () => console.log(`Terputer listening on http://localhost:${port}`));
