import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const workspaceRoot = resolve(fileURLToPath(new URL('.', import.meta.url)));
const allowedRoots = ['notebooks', 'research'];

function workspacePath(value) {
  const relative = String(value || '').replace(/^\/+/, '');
  const target = resolve(workspaceRoot, relative);
  if (!allowedRoots.some((root) => target.startsWith(join(workspaceRoot, root) + sep))) throw new Error('Path must be inside notebooks/ or research/');
  return target;
}

async function fetchJson(url, timeout = 15000) {
  const response = await fetch(url, { headers: { 'user-agent': 'Terputer research workspace (https://github.com/Terpedia/terputer)' }, signal: AbortSignal.timeout(timeout) });
  if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
  return response.json();
}

export const toolDefinitions = [
  { name: 'search_geo_series', description: 'Search NCBI GEO DataSets for candidate expression studies. Returns accession-level metadata only, not treatment validation or analysis results.', parameters: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 10 } }, required: ['query'] } },
  { name: 'search_pubmed', description: 'Search PubMed for primary research articles and return titles, authors, DOI when present, and PMID links.', parameters: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 10 } }, required: ['query'] } },
  { name: 'search_terpedia_bigquery', description: 'Search Terpedia provenance records through its BigQuery-backed Knowledge API. Returns source rows, not inferred conclusions.', parameters: { type: 'object', properties: { query: { type: 'string' }, source: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 20 } }, required: ['query'] } },
  { name: 'search_transcriptomic_studies', description: 'Search curated transcriptomic study records in Terpedia BigQuery. Returns provenance and evidence class.', parameters: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 30 } }, required: ['query'] } },
  { name: 'get_transcriptomic_samples', description: 'List curated sample metadata for a study accession from Terpedia BigQuery.', parameters: { type: 'object', properties: { accession: { type: 'string' } }, required: ['accession'] } },
  { name: 'get_transcriptomic_contrasts', description: 'List curated treatment/control contrast definitions and evidence limits for a study accession.', parameters: { type: 'object', properties: { accession: { type: 'string' } }, required: ['accession'] } },
  { name: 'get_ena_runs', description: 'Get public ENA run and sample metadata for a study accession (PRJNA, ERP, SRP). Does not download reads.', parameters: { type: 'object', properties: { accession: { type: 'string' } }, required: ['accession'] } },
  { name: 'list_notebooks', description: 'List Jupyter notebooks in the Terputer workspace.', parameters: { type: 'object', properties: {} } },
  { name: 'read_workspace_file', description: 'Read a small text file or notebook under research/ or notebooks/. Use for manifests, results, methods, and manuscript drafts.', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } },
  { name: 'write_workspace_file', description: 'Write a text artifact under research/ or a Jupyter notebook under notebooks/. Cite sources and mark unexecuted analysis.', parameters: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] } },
  { name: 'execute_python_cell', description: 'Execute Python in the current Terputer Codespace Jupyter kernel. Use only code needed for the requested research; inspect returned errors and outputs.', parameters: { type: 'object', properties: { code: { type: 'string' }, timeout_seconds: { type: 'integer', minimum: 1, maximum: 30 } }, required: ['code'] } }
];

export async function callResearchTool(name, args = {}) {
  if (['search_geo_series', 'search_pubmed', 'get_ena_runs', 'search_terpedia_bigquery', 'search_transcriptomic_studies', 'get_transcriptomic_samples', 'get_transcriptomic_contrasts'].includes(name)
      && process.env.TERPUTER_WORKER_URL && process.env.TERPUTER_WORKER_TOKEN) {
    const response = await fetch(`${process.env.TERPUTER_WORKER_URL.replace(/\/$/, '')}/v1/tools/call`, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.TERPUTER_WORKER_TOKEN}` },
      body: JSON.stringify({ name, arguments: args }), signal: AbortSignal.timeout(30000)
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || `Research Worker returned HTTP ${response.status}`);
    return payload.result;
  }
  if (name === 'search_transcriptomic_studies' || name === 'get_transcriptomic_samples' || name === 'get_transcriptomic_contrasts') {
    const base = (process.env.TERPUTER_BIGQUERY_API_URL || '').replace(/\/$/, '');
    const key = process.env.TERPUTER_BIGQUERY_TOOL_KEY;
    if (!base || !key) throw new Error('Terputer BigQuery adapter is not configured');
    let url;
    let options = { headers: { 'x-terputer-tool-key': key }, signal: AbortSignal.timeout(30000) };
    if (name === 'search_transcriptomic_studies') {
      const query = String(args.query || '').trim().slice(0, 200);
      if (query.length < 2) throw new Error('query must contain at least two characters');
      url = `${base}/v1/studies/search`;
      options = { ...options, method: 'POST', headers: { ...options.headers, 'content-type': 'application/json' }, body: JSON.stringify({ query, limit: Math.min(30, Math.max(1, Number(args.limit) || 10)) }) };
    } else {
      const accession = String(args.accession || '').trim().toUpperCase();
      if (!/^[A-Z0-9_-]{4,30}$/.test(accession)) throw new Error('Invalid accession');
      url = `${base}/v1/studies/${encodeURIComponent(accession)}/${name === 'get_transcriptomic_contrasts' ? 'contrasts' : 'samples'}`;
    }
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`BigQuery adapter returned HTTP ${response.status}`);
    return response.json();
  }
  if (name === 'search_terpedia_bigquery') {
    const key = process.env.TERPEDIA_KNOWLEDGE_API_KEY;
    if (!key) throw new Error('TERPEDIA_KNOWLEDGE_API_KEY is not configured in this Codespace');
    const query = String(args.query || '').trim().slice(0, 500);
    const source = String(args.source || 'all').trim();
    if (!query || !/^[a-z0-9_-]+$/i.test(source)) throw new Error('Provide a query and valid source key');
    const base = (process.env.TERPEDIA_KB_API_URL || 'https://terpedia-knowledge-nanrsdlaoa-uc.a.run.app').replace(/\/$/, '');
    const response = await fetch(`${base}/v1/tabular/search`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-knowledge-key': key }, body: JSON.stringify({ query, source, limit: Math.min(20, Math.max(1, Number(args.limit) || 8)) }), signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Terpedia Knowledge API returned HTTP ${response.status}`);
    return response.json();
  }
  if (name === 'search_pubmed') {
    const query = String(args.query || '').trim().slice(0, 300);
    if (!query) throw new Error('query is required');
    const limit = Math.min(10, Math.max(1, Number(args.limit) || 5));
    const base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
    const search = await fetchJson(`${base}/esearch.fcgi?${new URLSearchParams({ db: 'pubmed', term: query, retmode: 'json', retmax: String(limit) })}`);
    const ids = search.esearchresult?.idlist || [];
    if (!ids.length) return { query, total: Number(search.esearchresult?.count || 0), records: [] };
    const summary = await fetchJson(`${base}/esummary.fcgi?${new URLSearchParams({ db: 'pubmed', id: ids.join(','), retmode: 'json' })}`);
    return { query, total: Number(search.esearchresult?.count || 0), records: ids.map((id) => summary.result?.[id]).filter(Boolean).map((item) => ({ pmid: String(item.uid), title: item.title, publicationDate: item.pubdate, authors: (item.authors || []).map((author) => author.name).slice(0, 8), doi: (item.articleids || []).find((entry) => entry.idtype === 'doi')?.value || null, url: `https://pubmed.ncbi.nlm.nih.gov/${item.uid}/` })) };
  }
  if (name === 'search_geo_series') {
    const query = String(args.query || '').trim().slice(0, 300);
    if (!query) throw new Error('query is required');
    const limit = Math.min(10, Math.max(1, Number(args.limit) || 5));
    const base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
    const search = await fetchJson(`${base}/esearch.fcgi?${new URLSearchParams({ db: 'gds', term: query, retmode: 'json', retmax: String(limit) })}`);
    const ids = search.esearchresult?.idlist || [];
    if (!ids.length) return { query, total: Number(search.esearchresult?.count || 0), records: [] };
    const summary = await fetchJson(`${base}/esummary.fcgi?${new URLSearchParams({ db: 'gds', id: ids.join(','), retmode: 'json' })}`);
    const records = ids.map((id) => summary.result?.[id]).filter(Boolean).map((item) => ({ accession: item.accession, title: item.title, organism: item.taxon, summary: String(item.summary || '').slice(0, 900), sampleCount: item.n_samples, url: item.accession ? `https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${encodeURIComponent(item.accession)}` : null }));
    return { query, total: Number(search.esearchresult?.count || 0), records };
  }
  if (name === 'get_ena_runs') {
    const accession = String(args.accession || '').trim().toUpperCase();
    if (!/^(PRJ[EDN][A-Z]?\d+|[ESD]RP\d+)$/.test(accession)) throw new Error('Provide a study accession such as PRJNA913446');
    const fields = 'run_accession,experiment_accession,sample_accession,study_accession,experiment_title,library_strategy,library_layout,fastq_bytes,fastq_md5';
    const url = `https://www.ebi.ac.uk/ena/portal/api/filereport?${new URLSearchParams({ accession, result: 'read_run', fields, format: 'tsv' })}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`ENA returned HTTP ${response.status}`);
    const lines = (await response.text()).trim().split(/\r?\n/);
    if (lines.length < 2) return { accession, runs: [], source: url };
    const headers = lines[0].split('\t');
    const runs = lines.slice(1, 101).map((line) => Object.fromEntries(line.split('\t').map((value, index) => [headers[index], value])));
    return { accession, runCountReturned: runs.length, truncated: lines.length - 1 > 100, runs, source: url };
  }
  if (name === 'list_notebooks') {
    const files = await readdir(join(workspaceRoot, 'notebooks')).catch(() => []);
    return { notebooks: files.filter((file) => file.endsWith('.ipynb')).sort() };
  }
  if (name === 'read_workspace_file') {
    const path = workspacePath(args.path);
    const content = await readFile(path, 'utf8');
    if (content.length > 120000) throw new Error('File exceeds 120 KB; use Python to summarize it.');
    return { path: String(args.path), content };
  }
  if (name === 'write_workspace_file') {
    const path = workspacePath(args.path);
    const content = String(args.content || '');
    if (content.length > 2_000_000) throw new Error('File exceeds 2 MB.');
    if (!/\.(md|txt|csv|tsv|json|py|ipynb)$/i.test(path)) throw new Error('Unsupported research file type.');
    if (path.endsWith('.ipynb')) {
      const notebook = JSON.parse(content);
      if (notebook.nbformat !== 4 || !Array.isArray(notebook.cells)) throw new Error('Invalid Jupyter notebook.');
    }
    await mkdir(resolve(path, '..'), { recursive: true });
    await writeFile(path, content, { mode: 0o600 });
    return { path: String(args.path), bytes: Buffer.byteLength(content), saved: true };
  }
  if (name === 'execute_python_cell') {
    const code = String(args.code || '');
    if (!code.trim() || code.length > 200000) throw new Error('code is required and must be under 200 KB.');
    const timeout = Math.min(30, Math.max(1, Number(args.timeout_seconds) || 20));
    const response = await fetch('http://127.0.0.1:8765/api/kernel/execute', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code, timeout_seconds: timeout }), signal: AbortSignal.timeout((timeout + 5) * 1000) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || `Kernel returned HTTP ${response.status}`);
    return result;
  }
  throw new Error(`Unknown tool: ${name}`);
}
