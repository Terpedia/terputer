import { createServer } from 'node:http';
import { access, readFile, readdir, realpath, stat } from 'node:fs/promises';
import { extname, isAbsolute, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { runResearchAgent } from './research-agent.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4173);
const kbBase = (process.env.TERPEDIA_KB_API_URL || 'https://terpedia-knowledge-nanrsdlaoa-uc.a.run.app').replace(/\/$/, '');
const chatBase = (process.env.TERPEDIA_CHAT_API_URL || 'https://api.terpedia.com').replace(/\/$/, '');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8' };
const githubResearchSearch = 'https://api.github.com/search/repositories?q=org%3ATerpedia+terputer-+in%3Aname&per_page=100&sort=updated';
let githubResearchCache = { expiresAt: 0, repositories: [] };

async function discoverGithubResearchRepositories() {
  if (githubResearchCache.expiresAt > Date.now()) return githubResearchCache.repositories;
  const response = await fetch(githubResearchSearch, {
    headers: { accept: 'application/vnd.github+json', 'user-agent': 'Terputer-Research-Library' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`GitHub repository search returned ${response.status}.`);
  const result = await response.json();
  const repositories = (result.items || []).filter((repo) =>
    repo.owner?.login?.toLowerCase() === 'terpedia' && /^terputer-[a-z0-9][a-z0-9-]*$/i.test(repo.name || '')
  );
  githubResearchCache = { expiresAt: Date.now() + 10 * 60_000, repositories };
  return repositories;
}

async function researchProjectListing() {
  const catalog = JSON.parse(await readFile(join(root, 'public/projects/catalog.json'), 'utf8'));
  let repositories = [];
  let warning = null;
  try { repositories = await discoverGithubResearchRepositories(); }
  catch (error) { warning = error instanceof Error ? error.message : 'GitHub discovery is unavailable.'; }
  const repositoryByName = new Map(repositories.map((repo) => [repo.full_name.toLowerCase(), repo]));
  const catalogNames = new Set();
  const projects = catalog.map((project) => {
    const match = String(project.repository || '').match(/github\.com\/([^/]+\/[^/]+)/i);
    const fullName = match?.[1]?.replace(/\.git$/, '').toLowerCase();
    if (fullName) catalogNames.add(fullName);
    const github = fullName ? repositoryByName.get(fullName) : null;
    return { ...project, discovery: github ? 'catalog+github' : 'catalog', updated_at: github?.updated_at || null, archived: github?.archived || false };
  });
  for (const repo of repositories) {
    if (catalogNames.has(repo.full_name.toLowerCase())) continue;
    const slug = repo.name.slice('terputer-'.length).toLowerCase();
    projects.push({
      slug,
      title: slug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
      category: 'Unclassified',
      status: repo.archived ? 'Archived' : 'GitHub project',
      summary: repo.description || 'Public Terpedia repository discovered on GitHub.',
      repository: repo.html_url,
      paper: null,
      notebook: null,
      local_path: null,
      discovery: 'github',
      updated_at: repo.updated_at,
      archived: !!repo.archived,
    });
  }
  return { projects, source: warning ? 'catalog' : 'github', warning, discovered_at: new Date().toISOString() };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const setJson = (status, data) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(data)); };
  if (url.pathname === '/api/research/projects' && req.method === 'GET') {
    try {
      const listing = await researchProjectListing();
      const projects = await Promise.all(listing.projects.map(async (project) => {
        const initialized = !!project.local_path && /^projects\/[a-z0-9][a-z0-9-]*$/.test(project.local_path)
          ? await access(join(root, project.local_path, '.git')).then(() => true).catch(() => false)
          : false;
        return { ...project, initialized };
      }));
      setJson(200, { ...listing, projects });
    } catch (error) { setJson(500, { error: error instanceof Error ? error.message : 'Could not load the research catalog.' }); }
    return;
  }
  if (url.pathname === '/api/research/project/notebooks' && req.method === 'GET') {
    const slug = url.searchParams.get('slug') || '';
    if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(slug)) { setJson(400, { error: 'Invalid research project slug.' }); return; }
    try {
      const listing = await researchProjectListing();
      const project = listing.projects.find((candidate) => candidate.slug === slug);
      if (!project) { setJson(404, { error: 'Research project was not found.' }); return; }
      if (!project.local_path || !/^projects\/[a-z0-9][a-z0-9-]*$/.test(project.local_path)) {
        setJson(200, { slug, title: project.title, notebooks: [], initialized: false, repository: project.repository }); return;
      }
      const projectRoot = await realpath(join(root, project.local_path)).catch(() => null);
      if (!projectRoot) { setJson(200, { slug, title: project.title, notebooks: [], initialized: false, repository: project.repository }); return; }
      const projectsRoot = await realpath(join(root, 'projects'));
      const projectRelative = relative(projectsRoot, projectRoot);
      if (isAbsolute(projectRelative) || projectRelative === '..' || projectRelative.startsWith('../')) { setJson(403, { error: 'Research project path is outside the submodule directory.' }); return; }
      const initialized = await access(join(projectRoot, '.git')).then(() => true).catch(() => false);
      if (!initialized) { setJson(200, { slug, title: project.title, notebooks: [], initialized: false, repository: project.repository }); return; }
      const notebookDirectory = await realpath(join(projectRoot, 'notebooks')).catch(() => null);
      if (!notebookDirectory) {
        setJson(200, { slug, title: project.title, notebooks: [], initialized: true, repository: project.repository }); return;
      }
      if (isAbsolute(relative(projectRoot, notebookDirectory)) || relative(projectRoot, notebookDirectory).startsWith('..')) {
        setJson(403, { error: 'Notebook directory is outside the research project.' }); return;
      }
      const entries = await readdir(notebookDirectory, { withFileTypes: true }).catch(() => []);
      const notebooks = entries.filter((entry) => entry.isFile() && /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}\.ipynb$/.test(entry.name)).map((entry) => entry.name).sort();
      setJson(200, { slug, title: project.title, notebooks, initialized: true, repository: project.repository });
    } catch (error) { setJson(500, { error: error instanceof Error ? error.message : 'Could not list project notebooks.' }); }
    return;
  }
  if (url.pathname === '/api/research/project/notebook' && req.method === 'GET') {
    const slug = url.searchParams.get('slug') || '';
    const filename = url.searchParams.get('file') || '';
    if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(slug) || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}\.ipynb$/.test(filename)) {
      setJson(400, { error: 'Provide a valid research project and notebook filename.' }); return;
    }
    try {
      const listing = await researchProjectListing();
      const project = listing.projects.find((candidate) => candidate.slug === slug);
      if (!project?.local_path || !/^projects\/[a-z0-9][a-z0-9-]*$/.test(project.local_path)) { setJson(404, { error: 'This project is not checked out as a local submodule.' }); return; }
      const projectRoot = await realpath(join(root, project.local_path));
      const projectsRoot = await realpath(join(root, 'projects'));
      const projectRelative = relative(projectsRoot, projectRoot);
      if (isAbsolute(projectRelative) || projectRelative === '..' || projectRelative.startsWith('../')) { setJson(403, { error: 'Research project path is outside the submodule directory.' }); return; }
      const initialized = await access(join(projectRoot, '.git')).then(() => true).catch(() => false);
      if (!initialized) { setJson(404, { error: 'This project submodule is not initialized in the Codespace.' }); return; }
      const notebookDirectory = await realpath(join(projectRoot, 'notebooks'));
      const notebookPath = await realpath(join(notebookDirectory, filename));
      const pathFromNotebookDirectory = relative(notebookDirectory, notebookPath);
      if (isAbsolute(pathFromNotebookDirectory) || pathFromNotebookDirectory.startsWith('..')) { setJson(403, { error: 'Notebook path is outside the project.' }); return; }
      const details = await stat(notebookPath);
      if (!details.isFile() || details.size > 20_000_000) { setJson(413, { error: 'Notebook is missing or exceeds the 20 MB limit.' }); return; }
      const notebook = JSON.parse(await readFile(notebookPath, 'utf8'));
      if (notebook.nbformat !== 4 || !Array.isArray(notebook.cells)) { setJson(400, { error: 'File is not a supported Jupyter notebook.' }); return; }
      setJson(200, { notebook, project: { slug, title: project.title, repository: project.repository } });
    } catch (error) { setJson(404, { error: error instanceof Error ? error.message : 'Project notebook was not found.' }); }
    return;
  }
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
