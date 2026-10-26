import { mkdir, readFile, readdir, writeFile, realpath, stat } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { generateResearchReport } from './report-generator.mjs';
import { forkReportWorkspace, listResearchProjects, addResearchProjectSubmodule, updateResearchProjectSubmodule, resolveResearchWorkspace } from './research-projects.mjs';
import { getTranscriptomicFeatureEffect } from './transcriptomic-feature-effect.mjs';

export const workspaceRoot = resolve(fileURLToPath(new URL('.', import.meta.url)));
const allowedRoots = ['notebooks', 'research'];
const execFileAsync = promisify(execFile);

function workspacePath(value, rootDir = workspaceRoot) {
  const relative = String(value || '').replace(/^\/+/, '');
  const target = resolve(rootDir, relative);
  if (!allowedRoots.some((root) => target.startsWith(join(rootDir, root) + sep))) throw new Error('Path must be inside notebooks/ or research/');
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
  { name: 'get_transcriptomic_evidence', description: 'Get curated exposure contrasts and evidence-graded numeric observations for a study accession from Terpedia BigQuery. Returns provenance and limitations, not raw gene-level effects.', parameters: { type: 'object', properties: { accession: { type: 'string' } }, required: ['accession'] } },
  { name: 'get_transcriptomic_feature_effect', description: 'Look up one source feature in the checksum-pinned GSE242559 processed-FPKM table. Returns descriptive menthol and Wnt3a effects, not differential-expression or target evidence.', parameters: { type: 'object', properties: { accession: { type: 'string' }, feature: { type: 'string' } }, required: ['accession', 'feature'] } },
  { name: 'get_ena_runs', description: 'Get public ENA run and sample metadata for a study accession (PRJNA, ERP, SRP). Does not download reads.', parameters: { type: 'object', properties: { accession: { type: 'string' } }, required: ['accession'] } },
  { name: 'generate_research_report', description: 'Generate a source-linked Markdown white paper, claim ledger, and hash receipt from an executed notebook. Set project_slug to work inside an attached project submodule.', parameters: { type: 'object', properties: { manifest_path: { type: 'string' }, project_slug: { type: 'string' } }, required: ['manifest_path'] } },
  { name: 'publish_research_report', description: 'Publish a validated version 2 report bundle to a private terpedia-* GitHub repository owned by the connected user. Set project_slug for a submodule; include extra_paths for scripts or pinned inputs. In a terpedia-report fork, stage the project submodule and report its status.', parameters: { type: 'object', properties: { manifest_path: { type: 'string' }, project_slug: { type: 'string' }, extra_paths: { type: 'array', items: { type: 'string' }, maxItems: 20 } }, required: ['manifest_path'] } },
  { name: 'fork_report_workspace', description: 'Fork public Terpedia/terputer to the connected GitHub user as terpedia-report and return its Codespace URL. The Terpedia GitHub session is used in chat; standalone local MCP use can authenticate with gh.', parameters: { type: 'object', properties: {} } },
  { name: 'list_research_projects', description: 'List the research project submodules and pinned commits in this user-owned terpedia-report checkout.', parameters: { type: 'object', properties: {} } },
  { name: 'add_research_project_submodule', description: 'Attach a user-owned terpedia-<slug> repository under projects/<slug>. A connected GitHub session commits the pointer to the report fork; standalone local MCP use stages it in the checkout.', parameters: { type: 'object', properties: { slug: { type: 'string' }, repository: { type: 'string' }, commit: { type: 'string' } }, required: ['slug'] } },
  { name: 'update_research_project_submodule', description: 'Advance a project submodule pointer to the project’s latest default-branch commit. A connected GitHub session commits remotely; standalone local MCP use stages it locally.', parameters: { type: 'object', properties: { slug: { type: 'string' } }, required: ['slug'] } },
  { name: 'execute_notebook', description: 'Execute a saved Jupyter notebook in a fresh Python kernel and save its outputs. Set project_slug for an attached project; declare research/ outputs and local input files so the execution receipt hashes both.', parameters: { type: 'object', properties: { path: { type: 'string' }, project_slug: { type: 'string' }, cell_timeout_seconds: { type: 'integer', minimum: 1, maximum: 600 }, artifact_paths: { type: 'array', items: { type: 'string' }, maxItems: 50 }, input_paths: { type: 'array', items: { type: 'string' }, maxItems: 50 } }, required: ['path'] } },
  { name: 'list_notebooks', description: 'List Jupyter notebooks in the report workspace or an attached project submodule.', parameters: { type: 'object', properties: { project_slug: { type: 'string' } } } },
  { name: 'read_workspace_file', description: 'Read a small text file or notebook under research/ or notebooks/ in the report workspace or an attached project.', parameters: { type: 'object', properties: { path: { type: 'string' }, project_slug: { type: 'string' } }, required: ['path'] } },
  { name: 'write_workspace_file', description: 'Write a text artifact under research/ or a Jupyter notebook under notebooks/ in the report workspace or an attached project.', parameters: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' }, project_slug: { type: 'string' } }, required: ['path', 'content'] } },
  { name: 'execute_python_cell', description: 'Execute Python in the current Terputer Codespace Jupyter kernel. Use only code needed for the requested research; inspect returned errors and outputs.', parameters: { type: 'object', properties: { code: { type: 'string' }, timeout_seconds: { type: 'integer', minimum: 1, maximum: 30 } }, required: ['code'] } }
];

export async function callResearchTool(name, args = {}, context = {}) {
  if (name === 'get_transcriptomic_feature_effect' && !(process.env.TERPUTER_WORKER_URL && process.env.TERPUTER_WORKER_TOKEN)) return getTranscriptomicFeatureEffect(args);
  if (name === 'fork_report_workspace') return forkReportWorkspace(context.githubSession);
  if (name === 'list_research_projects') return listResearchProjects();
  if (name === 'add_research_project_submodule') return addResearchProjectSubmodule(args, context.githubSession);
  if (name === 'update_research_project_submodule') return updateResearchProjectSubmodule(args, context.githubSession);
  const localTools = ['generate_research_report', 'publish_research_report', 'execute_notebook', 'list_notebooks', 'read_workspace_file', 'write_workspace_file'];
  const activeRoot = localTools.includes(name) ? await resolveResearchWorkspace(args.project_slug) : workspaceRoot;
  if (['search_geo_series', 'search_pubmed', 'get_ena_runs', 'search_terpedia_bigquery', 'search_transcriptomic_studies', 'get_transcriptomic_samples', 'get_transcriptomic_evidence', 'get_transcriptomic_feature_effect'].includes(name)
      && process.env.TERPUTER_WORKER_URL && process.env.TERPUTER_WORKER_TOKEN) {
    const response = await fetch(`${process.env.TERPUTER_WORKER_URL.replace(/\/$/, '')}/v1/tools/call`, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.TERPUTER_WORKER_TOKEN}` },
      body: JSON.stringify({ name, arguments: args }), signal: AbortSignal.timeout(30000)
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || `Research Worker returned HTTP ${response.status}`);
    return payload.result;
  }
  if (name === 'search_transcriptomic_studies' || name === 'get_transcriptomic_samples' || name === 'get_transcriptomic_evidence') {
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
      url = `${base}/v1/studies/${encodeURIComponent(accession)}/${name === 'get_transcriptomic_evidence' ? 'evidence' : 'samples'}`;
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
  if (name === 'generate_research_report') {
    return generateResearchReport(args.manifest_path, activeRoot);
  }
  if (name === 'publish_research_report') {
    if (context.publicationAuthorized === false) throw new Error('The user must request GitHub publication before the research agent can publish a report.');
    const session = context.githubSession || process.env.TERPUTER_GITHUB_SESSION;
    if (!session) throw new Error('Connect GitHub in Terputer before publishing a research report.');
    const generated = await generateResearchReport(args.manifest_path, activeRoot);
    if (generated.specification_schema_version !== 2) throw new Error('Only version 2 reports with execution provenance can be published.');
    const spec = JSON.parse(await readFile(workspacePath(args.manifest_path, activeRoot), 'utf8'));
    if (args.project_slug && spec.slug !== args.project_slug) throw new Error('Report slug must match the selected project submodule.');
    const externalInputs = new Set((generated.external_data_inputs || []).map((item) => item.path));
    const required = [args.manifest_path, spec.notebook, spec.execution_receipt,
      generated.report, generated.ledger, generated.receipt, ...Object.keys(generated.artifact_sha256),
      ...Object.keys(generated.input_sha256 || {}).filter((path) => !externalInputs.has(path))];
    const extras = Array.isArray(args.extra_paths) ? args.extra_paths : [];
    if (extras.length > 20) throw new Error('At most 20 extra paths are allowed.');
    const runtimeFiles = new Set(['requirements.txt', 'notebook-runner.py', 'report-generator.mjs', 'restore-inputs.py',
      'terputer_bio/__init__.py', 'terputer_bio/transcriptomics.py']);
    const paths = [...new Set([...required, ...extras, ...runtimeFiles])];
    if (paths.length > 49) throw new Error('Report bundle has too many files.');
    const files = [];
    let bytesTotal = 0;
    const realWorkspaceRoot = await realpath(workspaceRoot);
    const realActiveRoot = await realpath(activeRoot);
    for (const path of paths) {
      if (typeof path !== 'string' || path.includes('..') || path.split('/').some((part) => part.startsWith('.'))
          || !(/^(?:research|notebooks)\/[A-Za-z0-9._/-]+$/.test(path) || runtimeFiles.has(path))) {
        throw new Error(`Invalid report publication path: ${path}`);
      }
      // The reproducibility tools belong to Terputer, not the attached user project.
      const runtime = runtimeFiles.has(path);
      const absolute = runtime ? join(workspaceRoot, path) : workspacePath(path, activeRoot);
      const expected = join(runtime ? realWorkspaceRoot : realActiveRoot, path);
      if (await realpath(absolute) !== expected || !(await stat(absolute)).isFile()) {
        throw new Error(`Report publication requires a regular file inside the selected workspace: ${path}`);
      }
      const bytes = await readFile(absolute);
      if (bytes.length > 2_000_000) throw new Error(`Report file exceeds 2 MB: ${path}`);
      bytesTotal += bytes.length;
      files.push({ path, content_base64: bytes.toString('base64') });
    }
    const artifactPaths = Object.keys(generated.artifact_sha256);
    const inputPaths = Object.keys(generated.input_sha256 || {});
    const readme = `# ${spec.title}\n\n${spec.question}\n\n[Executed notebook](${spec.notebook}) · [Evidence brief](${generated.report}) · [Generation receipt](${generated.receipt})\n\nThe runner, input restorer, report generator, requirements file, and Terputer bioinformatics helpers were copied from the Terputer workspace into this project at publication time. Locally derived inputs and any helper code pinned by the execution receipt are included in this repository. Externally sourced inputs are listed with HTTPS download URLs and SHA-256 hashes in the report specification; restore them before rerunning the notebook. Review code and data sources, then reproduce with:\n\n\`\`\`sh\npython -m pip install -r requirements.txt\npython restore-inputs.py ${args.manifest_path}\npython notebook-runner.py ${spec.notebook} . 300 '${JSON.stringify(artifactPaths)}' '${JSON.stringify(inputPaths)}'\nnode report-generator.mjs ${args.manifest_path}\n\`\`\`\n`;
    bytesTotal += Buffer.byteLength(readme);
    if (bytesTotal > 7_000_000) throw new Error('Report bundle exceeds 7 MB.');
    files.push({ path: 'README.md', content_base64: Buffer.from(readme).toString('base64') });
    const response = await fetch(`${(process.env.TERPEDIA_CHAT_API_URL || 'https://api.terpedia.com').replace(/\/$/, '')}/api/github/research/report-bundle`, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${session}` },
      body: JSON.stringify({ slug: spec.slug, files }), signal: AbortSignal.timeout(120_000)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `GitHub report publication failed (${response.status})`);
    let projectSubmodule;
    try {
      const attached = await addResearchProjectSubmodule({
        slug: spec.slug, repository: `https://github.com/${result.repository}`, commit: result.commit
      }, session);
      projectSubmodule = { attached: true, ...attached, publishedCommit: result.commit,
        needsSync: Boolean(attached.localSyncRequired || attached.commit !== result.commit) };
      if (projectSubmodule.needsSync && !attached.next) projectSubmodule.next = 'The project repository advanced on GitHub. Reconcile local project changes with the published commit, then stage and push the report fork submodule pointer.';
    } catch (error) {
      projectSubmodule = { attached: false, reason: error instanceof Error ? error.message : String(error) };
    }
    return { ...result, projectSubmodule };
  }
  if (name === 'execute_notebook') {
    const path = workspacePath(args.path, activeRoot);
    if (!path.startsWith(join(activeRoot, 'notebooks') + sep) || !path.endsWith('.ipynb')) throw new Error('Expected a notebook under notebooks/');
    const timeout = Math.min(600, Math.max(1, Number(args.cell_timeout_seconds) || 120));
    try {
      const artifactPaths = Array.isArray(args.artifact_paths) ? args.artifact_paths : [];
      const inputPaths = Array.isArray(args.input_paths) ? args.input_paths : [];
      const { stdout } = await execFileAsync(process.env.TERPUTER_PYTHON || 'python3',
        [join(workspaceRoot, 'notebook-runner.py'), path, activeRoot, String(timeout), JSON.stringify(artifactPaths), JSON.stringify(inputPaths)],
        { cwd: activeRoot, timeout: 30 * 60 * 1000, maxBuffer: 1024 * 1024 });
      return JSON.parse(stdout.trim());
    } catch (error) {
      throw new Error(`Notebook execution failed: ${String(error.stderr || error.message || error).slice(0, 2000)}`);
    }
  }
  if (name === 'list_notebooks') {
    const files = await readdir(join(activeRoot, 'notebooks')).catch(() => []);
    return { project_slug: args.project_slug || null, notebooks: files.filter((file) => file.endsWith('.ipynb')).sort() };
  }
  if (name === 'read_workspace_file') {
    const path = workspacePath(args.path, activeRoot);
    const content = await readFile(path, 'utf8');
    if (content.length > 120000) throw new Error('File exceeds 120 KB; use Python to summarize it.');
    return { path: String(args.path), content };
  }
  if (name === 'write_workspace_file') {
    const path = workspacePath(args.path, activeRoot);
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
