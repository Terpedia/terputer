import { authorizeRequest, handleTool } from '../worker.mjs';

const query = { type: 'string', minLength: 2, maxLength: 300 };
const count = (maximum, fallback) => ({ type: 'integer', minimum: 1, maximum, default: fallback });
const tool = (name, description, properties, required) => ({
  name,
  description,
  inputSchema: { type: 'object', properties, required, additionalProperties: false },
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
});

const publicTools = [
  tool('search_geo_series', 'Search public NCBI GEO study metadata. Results are candidate studies, not validated exposure contrasts.', { query, limit: count(10, 5) }, ['query']),
  tool('search_pubmed', 'Search public PubMed article metadata with PMID and DOI links.', { query, limit: count(10, 5) }, ['query']),
  tool('get_ena_runs', 'List public ENA sequencing run metadata and checksums for a study accession.', { accession: { type: 'string', minLength: 5, maxLength: 30 } }, ['accession']),
];
const privateTools = [
  tool('search_terpedia_bigquery', 'Search Terpedia BigQuery-backed knowledge records with source provenance.', { query: { type: 'string', minLength: 2, maxLength: 500 }, source: { type: 'string', default: 'all' }, limit: count(20, 8) }, ['query']),
  tool('search_transcriptomic_studies', 'Search curated transcriptomic studies in Terpedia BigQuery.', { query: { type: 'string', minLength: 2, maxLength: 200 }, limit: count(30, 10) }, ['query']),
  tool('get_transcriptomic_samples', 'List curated sample metadata for a study accession from Terpedia BigQuery.', { accession: { type: 'string', minLength: 4, maxLength: 30 } }, ['accession']),
];

export const allTools = [...publicTools, ...privateTools];
const publicNames = new Set(publicTools.map((entry) => entry.name));
const privateNames = new Set(privateTools.map((entry) => entry.name));
const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const reply = (id, result, status = 200) => new Response(JSON.stringify({ jsonrpc: '2.0', id, result }), { status, headers });
const rpcError = (id, code, message, status = 200) => new Response(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }), { status, headers });

export async function handleMcp(request, env) {
  const origin = request.headers.get('origin');
  if (origin && !['https://terputer.terpedia.com', 'https://chat.terpedia.com'].includes(origin)) return rpcError(null, -32000, 'Forbidden origin', 403);
  if (request.method === 'GET' || request.method === 'DELETE') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return rpcError(null, -32600, 'Expected application/json', 415);
  let input;
  try {
    const body = await request.text();
    if (body.length > 16000) return rpcError(null, -32600, 'Request too large', 413);
    input = JSON.parse(body);
  } catch { return rpcError(null, -32700, 'Parse error', 400); }
  if (!input || input.jsonrpc !== '2.0' || typeof input.method !== 'string' || Array.isArray(input)) return rpcError(input?.id ?? null, -32600, 'Invalid request', 400);
  if (!Object.hasOwn(input, 'id')) {
    if (input.method === 'notifications/initialized' || input.method === 'notifications/cancelled') return new Response(null, { status: 202 });
    return rpcError(null, -32600, 'Unknown notification', 400);
  }
  const { id, method } = input;
  if (method === 'initialize') {
    const requested = input.params?.protocolVersion;
    const protocolVersion = ['2025-11-25', '2025-06-18', '2025-03-26'].includes(requested) ? requested : '2025-11-25';
    return reply(id, { protocolVersion, capabilities: { tools: {} }, serverInfo: { name: 'terputer-research', title: 'Terputer Research MCP', version: '0.1.0', websiteUrl: 'https://terputer.terpedia.com/about' }, instructions: 'Provide your Terpedia API key in the X-API-Key header to list or call research tools. Verify study design and provenance before interpreting results.' });
  }
  if (method === 'ping') return reply(id, {});
  if (method === 'tools/list') {
    if (!(await authorizeRequest(request, env))) return rpcError(id, -32001, 'A valid Terpedia API key is required', 401);
    return reply(id, { tools: allTools });
  }
  if (method !== 'tools/call') return rpcError(id, -32601, 'Method not found');
  const name = input.params?.name;
  const args = input.params?.arguments ?? {};
  if (typeof name !== 'string' || !args || typeof args !== 'object' || Array.isArray(args)) return rpcError(id, -32602, 'Invalid tool arguments');
  if (!publicNames.has(name) && !privateNames.has(name)) return rpcError(id, -32602, 'Unknown tool');
  if (!(await authorizeRequest(request, env))) return rpcError(id, -32001, 'A valid Terpedia API key is required', 401);
  try {
    const result = await handleTool(name, args, env);
    return reply(id, { content: [{ type: 'text', text: JSON.stringify(result) }], structuredContent: result, isError: false });
  } catch (error) {
    return reply(id, { content: [{ type: 'text', text: error instanceof Error ? error.message : 'Tool failed' }], isError: true });
  }
}
