const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

async function sourceJson(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'Terputer research tools (https://github.com/Terpedia/terputer)' } });
  if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
  return response.json();
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

async function handleTool(name, args, env) {
  if (name === 'search_transcriptomic_studies' || name === 'get_transcriptomic_samples') {
    if (!env.TERPUTER_BIGQUERY_API_URL || !env.TERPUTER_BIGQUERY_TOOL_KEY) throw new Error('BigQuery adapter is not configured');
    const base = env.TERPUTER_BIGQUERY_API_URL.replace(/\/$/, '');
    let path, options = { headers: { 'x-terputer-tool-key': env.TERPUTER_BIGQUERY_TOOL_KEY } };
    if (name === 'search_transcriptomic_studies') {
      const query = String(args.query || '').trim().slice(0, 200);
      if (query.length < 2) throw new Error('query must contain at least two characters');
      path = '/v1/studies/search';
      options = { ...options, method: 'POST', headers: { ...options.headers, 'content-type': 'application/json' }, body: JSON.stringify({ query, limit: Math.min(30, Math.max(1, Number(args.limit) || 10)) }) };
    } else {
      const accession = String(args.accession || '').trim().toUpperCase();
      if (!/^[A-Z0-9_-]{4,30}$/.test(accession)) throw new Error('Invalid accession');
      path = `/v1/studies/${encodeURIComponent(accession)}/samples`;
    }
    const response = await fetch(`${base}${path}`, options);
    if (!response.ok) throw new Error(`BigQuery adapter returned HTTP ${response.status}`);
    return response.json();
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
    if (!env.TERPUTER_TOOL_TOKEN || request.headers.get('authorization') !== `Bearer ${env.TERPUTER_TOOL_TOKEN}`) return json({ error: 'Unauthorized' }, 401);
    try {
      const body = await request.text();
      if (body.length > 16000) return json({ error: 'Request too large' }, 413);
      const input = JSON.parse(body);
      const result = await handleTool(String(input.name || ''), input.arguments || {}, env);
      return json({ result });
    } catch (error) { return json({ error: error instanceof Error ? error.message : 'Tool failed' }, 400); }
  }
};
