import researchWorker from '../worker.mjs';
import { allTools, handleMcp } from './mcp.mjs';

const codespace = 'https://codespaces.new/Terpedia/terpedia-transcriptomics-demo?quickstart=1';
const repository = 'https://github.com/Terpedia/terpedia-transcriptomics-demo';
const singleCellRepository = 'https://github.com/Terpedia/terpedia-paclitaxel-single-cell';
const forkableRepository = 'https://github.com/Terpedia/terputer';
const forkableCodespace = 'https://codespaces.new/Terpedia/terputer?quickstart=1';
const a2780Repository = 'https://github.com/Terpedia/terpedia-a2780-paclitaxel-single-cell';
const drgRepository = 'https://github.com/Terpedia/terpedia-paclitaxel-drg-label-audit';
const mystRepository = 'https://github.com/Terpedia/terpedia-pfmyst-dha-single-cell';
const linaloolRepository = 'https://github.com/Terpedia/terpedia-fusarium-linalool-supplement';
const penicilliumRepository = 'https://github.com/Terpedia/terpedia-penicillium-limonene-supplement';
const fusariumLimoneneRepository = 'https://github.com/Terpedia/terpedia-fusarium-proliferatum-dlimonene-supplement';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/mcp') return handleMcp(request, env);
    if (url.pathname === '/v1/tools/call') return researchWorker.fetch(request, env);
    if (url.pathname === '/api' && request.method === 'GET') {
      return Response.json({ service: 'Terputer Research MCP', mcp: 'https://terputer.terpedia.com/mcp', protocol: 'Streamable HTTP', tools: allTools.map(({ name, description }) => ({ name, description })), authentication: 'Supply your personal Terpedia API key in X-API-Key to list or call MCP and direct research tools.' }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', target: codespace, mcp: '/mcp' }, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    if (url.pathname === '/about') {
      const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Terputer transcriptomics research</title><style>body{font:18px/1.6 system-ui,sans-serif;max-width:760px;margin:8vh auto;padding:0 22px;color:#153022}a{color:#08744f}h1{font-size:2.5rem;line-height:1.1}.button{display:inline-block;background:#08744f;color:white;padding:.7em 1.1em;border-radius:8px;text-decoration:none}li{margin:.5em 0}</style><h1>Terputer transcriptomics research</h1><p>Explore executed Jupyter analyses, source-cited reports, and a forkable Codespaces workspace for terpene exposure research.</p><p><a class="button" href="${codespace}">Open example Codespace</a></p><ul><li><a href="${repository}/blob/main/notebooks/terputer-transcriptomics.ipynb">Example notebook</a></li><li><a href="${repository}/blob/main/research/transcriptomics/white-paper.md">Example white paper</a></li><li><a href="${repository}/blob/main/research/transcriptomics/critical-review.md">Critical review</a></li></ul><h2>Terpene exposure evidence audits</h2><p>Each project has an executed notebook and claim-linked report. These audits summarize different organisms, compounds, doses, and source tables; they do not establish a replicated pathway or a target-dependent response.</p><ul><li><strong>Fusarium oxysporum + linalool:</strong> <a href="${linaloolRepository}/blob/main/notebooks/terputer-fusarium-linalool-supplement.ipynb">notebook</a> · <a href="${linaloolRepository}/blob/main/research/fusarium-linalool-supplement/generated/white-paper.md">report</a> · <a href="${linaloolRepository}">repository</a></li><li><strong>Penicillium digitatum + R-(+)-limonene:</strong> <a href="${penicilliumRepository}/blob/main/notebooks/terputer-penicillium-limonene-supplement.ipynb">notebook</a> · <a href="${penicilliumRepository}/blob/main/research/penicillium-limonene-supplement/generated/white-paper.md">report</a> · <a href="${penicilliumRepository}">repository</a></li><li><strong>Fusarium proliferatum + D-limonene:</strong> <a href="${fusariumLimoneneRepository}/blob/main/notebooks/terputer-fusarium-proliferatum-dlimonene-supplement.ipynb">notebook</a> · <a href="${fusariumLimoneneRepository}/blob/main/research/fusarium-proliferatum-dlimonene-supplement/generated/white-paper.md">report</a> · <a href="${fusariumLimoneneRepository}">repository</a></li></ul><h2>Forkable report workspace</h2><p><a href="${forkableRepository}">Fork Terputer</a> as <code>terpedia-report</code> and create a Codespace from your fork. The workspace supports Jupyter execution, report generation, and project submodules. <a href="${forkableCodespace}">Preview the Terputer Codespace</a>. Linked GitHub publication depends on Terpedia GitHub OAuth; standalone repository tools can use local <code>gh auth login</code>.</p><h2>Other chemical perturbation examples</h2><p>These single-cell examples are methodological references, not terpene replication evidence.</p><ul><li><a href="${singleCellRepository}">HCC1143 paclitaxel</a></li><li><a href="${a2780Repository}">A2780 paclitaxel</a></li><li><a href="${drgRepository}">Mouse DRG label audit</a></li><li><a href="${mystRepository}">PfMYST × DHA</a></li></ul><h2>Research API</h2><p><a href="/api">View the MCP tool index</a> for <code>https://terputer.terpedia.com/mcp</code>. Member key issuance and the chat integration are still being connected to the live backend. A GitHub account is needed to create a Codespace; notebook execution runs in that Codespace.</p></html>`;
      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
    }
    if (url.pathname === '/' || url.pathname === '') {
      return new Response(null, { status: 302, headers: { Location: codespace, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
    }
    return new Response('Not found', { status: 404 });
  },
};
