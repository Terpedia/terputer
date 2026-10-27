import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { callResearchTool } from './research-tools.mjs';

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

const researchTools = [
  ['search_geo_series', z.object({ query: z.string().trim().min(2).max(300), limit: z.number().int().min(1).max(10).default(5) })],
  ['search_pubmed', z.object({ query: z.string().trim().min(2).max(300), limit: z.number().int().min(1).max(10).default(5) })],
  ['search_terpedia_bigquery', z.object({ query: z.string().trim().min(2).max(500), source: z.string().trim().regex(/^[a-z0-9_-]+$/i).default('all'), limit: z.number().int().min(1).max(20).default(8) })],
  ['search_transcriptomic_studies', z.object({ query: z.string().trim().min(2).max(200), limit: z.number().int().min(1).max(30).default(10) })],
  ['get_transcriptomic_samples', z.object({ accession: z.string().trim().regex(/^[A-Za-z0-9_-]{4,30}$/) })],
  ['get_transcriptomic_evidence', z.object({ accession: z.string().trim().regex(/^[A-Za-z0-9_-]{4,30}$/) })],
  ['get_transcriptomic_feature_effect', z.object({ accession: z.string().trim().regex(/^[A-Za-z0-9_-]{4,30}$/), feature: z.string().trim().regex(/^[A-Za-z0-9_.:-]{1,60}$/) })],
  ['get_hepg2_bcp_gene_effect', z.object({ gene: z.string().trim().regex(/^[A-Za-z0-9_.:-]{1,60}$/) })],
  ['search_transcriptomic_gene_effects', z.object({ gene: z.string().trim().regex(/^[A-Za-z0-9_.:-]{1,60}$/), study_id: z.string().trim().regex(/^[A-Za-z0-9_-]{4,30}$/).optional(), limit: z.number().int().min(1).max(50).default(20) })],
  ['get_ena_runs', z.object({ accession: z.string().trim().min(5).max(30) })],
  ['generate_research_report', z.object({ manifest_path: z.string().trim().min(1).max(300), project_slug: z.string().trim().regex(/^[a-z0-9][a-z0-9-]{0,79}$/).optional() })],
  ['publish_research_report', z.object({ manifest_path: z.string().trim().min(1).max(300), project_slug: z.string().trim().regex(/^[a-z0-9][a-z0-9-]{0,79}$/).optional(), extra_paths: z.array(z.string().trim().min(1).max(300)).max(20).default([]) })],
  ['fork_report_workspace', z.object({})],
  ['list_research_projects', z.object({})],
  ['add_research_project_submodule', z.object({ slug: z.string().trim().regex(/^[a-z0-9][a-z0-9-]{0,79}$/), repository: z.string().url().optional(), commit: z.string().regex(/^[a-f0-9]{40}$/).optional() })],
  ['update_research_project_submodule', z.object({ slug: z.string().trim().regex(/^[a-z0-9][a-z0-9-]{0,79}$/) })],
  ['execute_notebook', z.object({ path: z.string().trim().min(1).max(300), project_slug: z.string().trim().regex(/^[a-z0-9][a-z0-9-]{0,79}$/).optional(), cell_timeout_seconds: z.number().int().min(1).max(600).default(120), artifact_paths: z.array(z.string().trim().min(1).max(300)).max(50).default([]), input_paths: z.array(z.string().trim().min(1).max(300)).max(50).default([]) })],
  ['start_research_job', z.object({ script_path: z.string().trim().min(1).max(300), project_slug: z.string().trim().regex(/^[a-z0-9][a-z0-9-]{0,79}$/).optional(), arguments: z.array(z.string().max(300)).max(20).default([]), max_runtime_minutes: z.number().int().min(1).max(720).default(360) })],
  ['get_research_job', z.object({ job_id: z.string().uuid(), project_slug: z.string().trim().regex(/^[a-z0-9][a-z0-9-]{0,79}$/).optional() })],
  ['list_notebooks', z.object({ project_slug: z.string().trim().regex(/^[a-z0-9][a-z0-9-]{0,79}$/).optional() })],
  ['read_workspace_file', z.object({ path: z.string().min(1).max(300), project_slug: z.string().trim().regex(/^[a-z0-9][a-z0-9-]{0,79}$/).optional() })],
  ['write_workspace_file', z.object({ path: z.string().min(1).max(300), content: z.string().max(2_000_000), project_slug: z.string().trim().regex(/^[a-z0-9][a-z0-9-]{0,79}$/).optional() })],
  ['execute_python_cell', z.object({ code: z.string().min(1).max(200_000), timeout_seconds: z.number().int().min(1).max(30).default(20) })]
];
for (const [name, schema] of researchTools) {
  if (name === 'search_transcriptomic_gene_effects' && process.env.TERPUTER_GENE_EFFECTS_ENABLED !== 'true') continue;
  server.registerTool(name, {
    title: name.replaceAll('_', ' '),
    description: {
      search_geo_series: 'Search public NCBI GEO expression study metadata.',
      search_pubmed: 'Search PubMed for primary research article metadata.',
      search_terpedia_bigquery: 'Search Terpedia BigQuery-backed knowledge records with provenance.',
      search_transcriptomic_studies: 'Search curated transcriptomic study records in Terpedia BigQuery.',
      get_transcriptomic_samples: 'List curated sample records for a transcriptomic study.',
      get_transcriptomic_evidence: 'Get evidence-graded exposure contrasts and observations for a transcriptomic study, with sources and limitations.',
      get_transcriptomic_feature_effect: 'Look up one source feature in the checksum-pinned GSE242559 processed-FPKM table; descriptive effect only, with limitations.',
      get_hepg2_bcp_gene_effect: 'Look up one gene in the checksum-pinned GSE276099 HepG2 raw-count model; return its estimate, adjusted p value, provenance, and limitations.',
      search_transcriptomic_gene_effects: 'Look up curated count-model gene effects with contrast, source hashes, and limitations.',
      get_ena_runs: 'Inspect public ENA sequencing runs and checksums.',
      generate_research_report: 'Generate a source-linked report, claim ledger, and provenance receipt from an executed notebook and report specification, optionally in a project submodule.',
      publish_research_report: 'Publish a validated report bundle to the connected user’s private terpedia-* GitHub repository, optionally from a project submodule.',
      fork_report_workspace: 'Create or find your terpedia-report fork of the public Terputer repository using a connected GitHub session or local GitHub CLI authentication.',
      list_research_projects: 'List project submodules and pinned commits in this terpedia-report checkout.',
      add_research_project_submodule: 'Attach a user-owned terpedia-* project as a Git submodule in projects/ using the linked GitHub session or local Git.',
      update_research_project_submodule: 'Advance a project submodule pointer to its latest project commit using the linked GitHub session or local Git.',
      execute_notebook: 'Execute and save a notebook in this workspace or an attached project using a fresh Python kernel; declare result artifacts and local inputs for hash provenance.',
      start_research_job: 'Launch a long-running Python research script under research/ in this Codespace or an attached project; receive a job ID for polling.',
      get_research_job: 'Read research job status, source hash, and recent logs for this Codespace or an attached project.',
      list_notebooks: 'List Jupyter notebooks in this workspace or an attached project.',
      read_workspace_file: 'Read a small research file or notebook in this workspace or an attached project.',
      write_workspace_file: 'Save a research file or notebook in this workspace or an attached project.',
      execute_python_cell: 'Run Python in this Codespace Jupyter kernel.'
    }[name],
    inputSchema: schema,
    annotations: { readOnlyHint: !['write_workspace_file', 'execute_python_cell', 'execute_notebook', 'start_research_job', 'generate_research_report', 'publish_research_report', 'fork_report_workspace', 'add_research_project_submodule', 'update_research_project_submodule'].includes(name), destructiveHint: false, openWorldHint: ['search_geo_series', 'search_pubmed', 'search_terpedia_bigquery', 'get_ena_runs', 'execute_python_cell', 'execute_notebook', 'start_research_job', 'publish_research_report', 'fork_report_workspace', 'add_research_project_submodule', 'update_research_project_submodule'].includes(name) }
  }, async (args) => ({ content: [{ type: 'text', text: JSON.stringify(await callResearchTool(name, args)) }] }));
}

const transport = new StdioServerTransport();
await server.connect(transport);
