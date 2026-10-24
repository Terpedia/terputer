import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const apiBase = (process.env.TERPUTER_API_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const server = new McpServer({ name: 'terpedia-knowledge', version: '0.1.0' });

async function search(query, source, limit) {
  const response = await fetch(`${apiBase}/api/kb/search`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, source, limit }),
    signal: AbortSignal.timeout(45_000),
  });
  const text = await response.text();
  if (!response.ok) {
    let message = `Terpedia Knowledge API returned ${response.status}`;
    try { message = JSON.parse(text).error || message; } catch {}
    throw new Error(message);
  }
  return text;
}

server.registerTool('search_terpedia_knowledge', {
  title: 'Search Terpedia knowledge base',
  description: 'Search Terpedia’s BigQuery-backed knowledge API. Returns source records and provenance; treat findings as evidence to inspect, not generated conclusions.',
  inputSchema: z.object({
    query: z.string().trim().min(2).max(500).describe('Compound, organism, target, assay, source identifier, or research phrase.'),
    source: z.string().trim().min(1).max(80).default('all').describe('Terpedia source key; use all for cross-source search.'),
    limit: z.number().int().min(1).max(20).default(10).describe('Maximum records to return.'),
  }),
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
}, async ({ query, source, limit }) => ({
  content: [{ type: 'text', text: await search(query, source, limit) }],
}));

server.registerTool('lookup_terpedia_identifier', {
  title: 'Look up a Terpedia identifier',
  description: 'Look up a stable database identifier or source record ID in Terpedia. Returns the underlying records and provenance without interpreting them.',
  inputSchema: z.object({
    identifier: z.string().trim().min(2).max(200).describe('Identifier such as a Terpedia record ID, PubChem CID, ChEBI ID, or UniProt accession.'),
    source: z.string().trim().min(1).max(80).default('all').describe('Terpedia source key; use all for cross-source lookup.'),
  }),
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
}, async ({ identifier, source }) => ({
  content: [{ type: 'text', text: await search(identifier, source, 10) }],
}));

const transport = new StdioServerTransport();
await server.connect(transport);
