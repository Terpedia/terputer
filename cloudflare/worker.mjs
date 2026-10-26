const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const snapshotRevision = '442eb142c5d992cbdc0987ce05bf05a66d0e806d';
const snapshotBase = `https://raw.githubusercontent.com/Terpedia/terputer/${snapshotRevision}/research/transcriptomics/bigquery-ready`;

export async function authorizeRequest(request, env) {
  const bearer = request.headers.get('authorization') || '';
  if (env.TERPUTER_TOOL_TOKEN && bearer === `Bearer ${env.TERPUTER_TOOL_TOKEN}`) return true;
  const key = request.headers.get('x-api-key') || bearer.replace(/^Bearer /, '');
  if (!/^tpd_[A-Za-z0-9_-]{43}$/.test(key)) return false;
  const base = (env.TERPEDIA_CHAT_API_URL || 'https://api.terpedia.com').replace(/\/$/, '');
  try {
    const response = await fetch(`${base}/api/terputer/keys/introspect`, {
      method: 'POST', headers: { 'x-api-key': key }, signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result.valid === true && Array.isArray(result.scopes) && result.scopes.includes('terputer:mcp');
  } catch { return false; }
}

async function sourceJson(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'Terputer research tools (https://github.com/Terpedia/terputer)' } });
  if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
  return response.json();
}

async function snapshotRows(name) {
  const url = `${snapshotBase}/${name}.jsonl`;
  const response = await fetch(url, { headers: { 'user-agent': 'Terputer curated transcriptomics fallback' } });
  if (!response.ok) throw new Error(`Pinned transcriptomics snapshot returned HTTP ${response.status}`);
  return { rows: (await response.text()).trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line)), url };
}

async function publicSnapshotResult(name, args, adapterStatus) {
  const provenance = { source_mode: 'commit-pinned-public-snapshot', snapshot_revision: snapshotRevision, ...(adapterStatus ? { adapter_status: adapterStatus } : {}) };
  if (name === 'search_transcriptomic_studies') {
    const { rows, url } = await snapshotRows('studies');
    const query = String(args.query).toLowerCase();
    const limit = Math.min(30, Math.max(1, Number(args.limit) || 10));
    const records = rows.filter((row) => [row.accession, row.title, row.organism, row.assay].some((value) => String(value || '').toLowerCase().includes(query)))
      .sort((a, b) => a.accession.localeCompare(b.accession)).slice(0, limit);
    return { records, source: url, ...provenance };
  }
  if (name === 'get_transcriptomic_samples') {
    const { rows, url } = await snapshotRows('samples');
    const accession = String(args.accession).toUpperCase();
    return { accession, samples: rows.filter((row) => row.accession === accession).sort((a, b) => a.sample_id.localeCompare(b.sample_id)).slice(0, 100), source: url, ...provenance };
  }
  const accession = String(args.accession).toUpperCase();
  const [contrasts, observations] = await Promise.all([snapshotRows('contrasts'), snapshotRows('observations')]);
  return {
    accession,
    contrasts: contrasts.rows.filter((row) => row.study_id === accession).sort((a, b) => a.contrast_id.localeCompare(b.contrast_id)).slice(0, 50),
    observations: observations.rows.filter((row) => row.study_id === accession).sort((a, b) => a.observation_id.localeCompare(b.observation_id)).slice(0, 50),
    sources: [contrasts.url, observations.url],
    interpretation: 'Source evidence classes, methods, and limitations are required; processed cross-study directions do not establish replication, a context interaction, or a direct target.',
    ...provenance
  };
}

function adapterMissesSnapshot(name, live, snapshot) {
  if (name === 'search_transcriptomic_studies') {
    const byAccession = new Map((live.records || []).map((row) => [row.accession, row]));
    return snapshot.records.some((row) => !byAccession.has(row.accession)
      || (row.source_sha256 && !byAccession.get(row.accession).source_sha256));
  }
  if (name === 'get_transcriptomic_samples') {
    const ids = new Set((live.samples || []).map((row) => row.sample_id));
    return snapshot.samples.some((row) => !ids.has(row.sample_id));
  }
  const contrasts = new Set((live.contrasts || []).map((row) => row.contrast_id));
  const observations = new Set((live.observations || []).map((row) => row.observation_id));
  return snapshot.contrasts.some((row) => !contrasts.has(row.contrast_id))
    || snapshot.observations.some((row) => !observations.has(row.observation_id));
}

function mergeWithSnapshot(name, args, live, snapshot) {
  const mergeRows = (liveRows, snapshotRows, key, replaceWhen = () => false) => {
    const rows = new Map((liveRows || []).map((row) => [row[key], { ...row, record_source_mode: 'bigquery' }]));
    for (const row of snapshotRows) {
      if (!rows.has(row[key]) || replaceWhen(rows.get(row[key]), row)) {
        rows.set(row[key], { ...row, record_source_mode: 'commit-pinned-public-snapshot' });
      }
    }
    return [...rows.values()].sort((a, b) => String(a[key]).localeCompare(String(b[key])));
  };
  const provenance = {
    source_mode: 'bigquery-plus-commit-pinned-public-snapshot',
    snapshot_revision: snapshot.snapshot_revision,
    snapshot_record_ids: [],
    adapter_status: 'stale_or_incomplete',
  };
  if (name === 'search_transcriptomic_studies') {
    const limit = Math.min(30, Math.max(1, Number(args.limit) || 10));
    const records = mergeRows(live.records, snapshot.records, 'accession', (current, row) => row.source_sha256 && !current.source_sha256).slice(0, limit);
    provenance.snapshot_record_ids = records.filter((row) => row.record_source_mode === 'commit-pinned-public-snapshot').map((row) => row.accession);
    return { ...live, records, snapshot_source: snapshot.source, ...provenance };
  }
  if (name === 'get_transcriptomic_samples') {
    const samples = mergeRows(live.samples, snapshot.samples, 'sample_id').slice(0, 100);
    provenance.snapshot_record_ids = samples.filter((row) => row.record_source_mode === 'commit-pinned-public-snapshot').map((row) => row.sample_id);
    return { ...live, samples, snapshot_source: snapshot.source, ...provenance };
  }
  const contrasts = mergeRows(live.contrasts, snapshot.contrasts, 'contrast_id').slice(0, 50);
  const observations = mergeRows(live.observations, snapshot.observations, 'observation_id').slice(0, 50);
  provenance.snapshot_record_ids = [
    ...contrasts.filter((row) => row.record_source_mode === 'commit-pinned-public-snapshot').map((row) => row.contrast_id),
    ...observations.filter((row) => row.record_source_mode === 'commit-pinned-public-snapshot').map((row) => row.observation_id),
  ];
  return { ...live, contrasts, observations, sources: [...new Set([...(live.sources || []), ...(snapshot.sources || [])])], ...provenance };
}

async function searchEntrez(db, query, limit) {
  const base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  const found = await sourceJson(`${base}/esearch.fcgi?${new URLSearchParams({ db, term: query, retmode: 'json', retmax: String(limit) })}`);
  const ids = found.esearchresult?.idlist || [];
  if (!ids.length) return { query, total: Number(found.esearchresult?.count || 0), records: [] };
  const summary = await sourceJson(`${base}/esummary.fcgi?${new URLSearchParams({ db, id: ids.join(','), retmode: 'json' })}`);
  const records = ids.map((id) => summary.result?.[id]).filter(Boolean).map((item) => db === 'gds'
    ? { accession: item.accession, title: item.title, organism: item.taxon, summary: String(item.summary || '').slice(0, 900), sampleCount: item.n_samples, url: `https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${encodeURIComponent(item.accession || '')}` }
    : { pmid: String(item.uid), title: item.title, publicationDate: item.pubdate, doi: (item.articleids || []).find((entry) => entry.idtype === 'doi')?.value || null, url: `https://pubmed.ncbi.nlm.nih.gov/${item.uid}/` });
  return { query, total: Number(found.esearchresult?.count || 0), records };
}

export async function handleTool(name, args, env) {
  if (name === 'search_transcriptomic_studies' || name === 'get_transcriptomic_samples' || name === 'get_transcriptomic_evidence') {
    const base = (env.TERPUTER_BIGQUERY_API_URL || '').replace(/\/$/, '');
    let path, options = { headers: { 'x-terputer-tool-key': env.TERPUTER_BIGQUERY_TOOL_KEY } };
    if (name === 'search_transcriptomic_studies') {
      const query = String(args.query || '').trim().slice(0, 200);
      if (query.length < 2) throw new Error('query must contain at least two characters');
      path = '/v1/studies/search';
      options = { ...options, method: 'POST', headers: { ...options.headers, 'content-type': 'application/json' }, body: JSON.stringify({ query, limit: Math.min(30, Math.max(1, Number(args.limit) || 10)) }) };
    } else {
      const accession = String(args.accession || '').trim().toUpperCase();
      if (!/^[A-Z0-9_-]{4,30}$/.test(accession)) throw new Error('Invalid accession');
      path = `/v1/studies/${encodeURIComponent(accession)}/${name === 'get_transcriptomic_evidence' ? 'evidence' : 'samples'}`;
    }
    let response;
    if (base && env.TERPUTER_BIGQUERY_TOOL_KEY) {
      try { response = await fetch(`${base}${path}`, options); } catch { /* Use the pinned public snapshot when the adapter is unreachable. */ }
      if (response?.ok) {
        const live = await response.json();
        try {
          const snapshot = await publicSnapshotResult(name, args, 'stale_or_incomplete');
          if (adapterMissesSnapshot(name, live, snapshot)) return mergeWithSnapshot(name, args, live, snapshot);
        } catch { /* Keep the live BigQuery result when the public snapshot is unreachable. */ }
        return live;
      }
      if (response && response.status !== 404 && response.status < 500) throw new Error(`BigQuery adapter returned HTTP ${response.status}`);
    }
    return publicSnapshotResult(name, args, response?.status);
  }
  if (name === 'search_geo_series' || name === 'search_pubmed') {
    const query = String(args.query || '').trim().slice(0, 300);
    if (!query) throw new Error('query is required');
    return searchEntrez(name === 'search_geo_series' ? 'gds' : 'pubmed', query, Math.min(10, Math.max(1, Number(args.limit) || 5)));
  }
  if (name === 'get_ena_runs') {
    const accession = String(args.accession || '').trim().toUpperCase();
    if (!/^(PRJ[EDN][A-Z]?\d+|[ESD]RP\d+)$/.test(accession)) throw new Error('Provide a study accession');
    const fields = 'run_accession,experiment_accession,sample_accession,study_accession,experiment_title,library_strategy,library_layout,fastq_bytes,fastq_md5';
    const url = `https://www.ebi.ac.uk/ena/portal/api/filereport?${new URLSearchParams({ accession, result: 'read_run', fields, format: 'tsv' })}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`ENA returned HTTP ${response.status}`);
    const lines = (await response.text()).trim().split(/\r?\n/);
    if (lines.length < 2) return { accession, runs: [], source: url };
    const headers = lines[0].split('\t');
    return { accession, runCountReturned: Math.min(100, lines.length - 1), truncated: lines.length - 1 > 100, runs: lines.slice(1, 101).map((line) => Object.fromEntries(line.split('\t').map((value, index) => [headers[index], value]))), source: url };
  }
  if (name === 'search_terpedia_bigquery') {
    if (!env.TERPEDIA_KNOWLEDGE_API_KEY) throw new Error('Terpedia Knowledge API secret is not configured');
    const query = String(args.query || '').trim().slice(0, 500);
    const source = String(args.source || 'all').trim();
    if (!query || !/^[a-z0-9_-]+$/i.test(source)) throw new Error('Provide a query and valid source key');
    const base = (env.TERPEDIA_KB_API_URL || '').replace(/\/$/, '');
    const response = await fetch(`${base}/v1/tabular/search`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-knowledge-key': env.TERPEDIA_KNOWLEDGE_API_KEY }, body: JSON.stringify({ query, source, limit: Math.min(20, Math.max(1, Number(args.limit) || 8)) }) });
    if (!response.ok) throw new Error(`Terpedia Knowledge API returned HTTP ${response.status}`);
    return response.json();
  }
  throw new Error(`Unknown research tool: ${name}`);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health' && request.method === 'GET') return json({ status: 'ok', service: 'terputer-research-tools' });
    if (url.pathname !== '/v1/tools/call' || request.method !== 'POST') return json({ error: 'Not found' }, 404);
    if (!(await authorizeRequest(request, env))) return json({ error: 'A valid Terpedia API key is required.' }, 401);
    try {
      const body = await request.text();
      if (body.length > 16000) return json({ error: 'Request too large' }, 413);
      const input = JSON.parse(body);
      const result = await handleTool(String(input.name || ''), input.arguments || {}, env);
      return json({ result });
    } catch (error) { return json({ error: error instanceof Error ? error.message : 'Tool failed' }, 400); }
  }
};
