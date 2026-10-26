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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/mcp') return handleMcp(request, env);
    if (url.pathname === '/v1/tools/call') return researchWorker.fetch(request, env);
    if (url.pathname === '/api' && request.method === 'GET') {
      return Response.json({ service: 'Terputer Research MCP', mcp: 'https://terputer.terpedia.com/mcp', protocol: 'Streamable HTTP', tools: allTools.map(({ name, description }) => ({ name, description })), authentication: 'Public source discovery tools are open. Terpedia BigQuery tools and /v1/tools/call require a Terputer bearer token.' }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', target: codespace, mcp: '/mcp' }, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    if (url.pathname === '/about') {
      const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Terputer Codespace example</title><style>body{font:18px/1.6 system-ui,sans-serif;max-width:760px;margin:8vh auto;padding:0 22px;color:#153022}a{color:#08744f}h1{font-size:2.5rem;line-height:1.1}.button{display:inline-block;background:#08744f;color:white;padding:.7em 1.1em;border-radius:8px;text-decoration:none}li{margin:.5em 0}</style><h1>Explore Terputer in a Codespace</h1><p>Open a ready-to-run bioinformatics workspace with a Jupyter notebook, Python kernel, transcriptomics data, and a source-cited white paper.</p><p><a class="button" href="${codespace}">Open example Codespace</a></p><ul><li><a href="${repository}/blob/main/notebooks/terputer-transcriptomics.ipynb">Executed notebook</a></li><li><a href="${repository}/blob/main/research/transcriptomics/white-paper.md">White paper</a></li><li><a href="${repository}/blob/main/research/transcriptomics/critical-review.md">Critical review</a></li></ul><h2>Forkable report workspace</h2><p><a href="${forkableRepository}">Fork Terputer</a> into your account as <code>terpedia-report</code>, then create a Codespace from your fork. The workspace supports Jupyter execution, claim-linked report generation, research chat, and project submodules. You can also <a href="${forkableCodespace}">preview the current Terputer workspace</a> before forking. Linked GitHub publication requires Terpedia GitHub OAuth to be enabled; local <code>gh auth login</code> supports the standalone repository tools.</p><h2>Single-cell chemical perturbation examples</h2><p>These chemical-exposure analyses distinguish descriptive cell-level patterns from biological replication and target dependence.</p><ul><li><a href="${singleCellRepository}/blob/main/notebooks/terputer-paclitaxel-single-cell.ipynb">HCC1143 executed notebook</a></li><li><a href="${singleCellRepository}/blob/main/research/paclitaxel-single-cell/generated/white-paper.md">HCC1143 claim-linked brief</a></li><li><a href="${a2780Repository}/blob/main/notebooks/terputer-gse162256-single-cell.ipynb">A2780 executed notebook</a></li><li><a href="${a2780Repository}/blob/main/research/a2780-paclitaxel-single-cell/generated/white-paper.md">A2780 claim-linked brief</a></li><li><a href="${a2780Repository}">A2780 project repository to fork before submodule attachment</a></li><li><a href="${drgRepository}/blob/main/notebooks/terputer-paclitaxel-drg.ipynb">Mouse DRG label-audit notebook</a></li><li><a href="${drgRepository}/blob/main/research/paclitaxel-drg-label-audit/generated/white-paper.md">Mouse DRG evidence brief</a> (exposure metadata conflict; descriptive only)</li><li><a href="${drgRepository}">Mouse DRG project repository to fork</a></li><li><a href="${mystRepository}/blob/main/notebooks/terputer-pfmyst-dha-single-cell.ipynb">PfMYST × DHA executed notebook</a></li><li><a href="${mystRepository}/blob/main/research/pfmyst-dha-single-cell/generated/white-paper.md">PfMYST × DHA evidence brief</a> (one library per condition; descriptive only)</li><li><a href="${mystRepository}">PfMYST × DHA project repository to fork</a></li></ul><h2>Research API</h2><p>Connect an MCP client to <code>https://terputer.terpedia.com/mcp</code>. <a href="/api">View the available tools</a>. Public tools search GEO, PubMed, and ENA metadata; curated Terpedia BigQuery tools require a bearer token.</p><p>A GitHub account is needed to create a Codespace. Notebook execution needs no API key; the in-app research agent uses your own OpenRouter key.</p></html>`;
      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
    }
    if (url.pathname === '/' || url.pathname === '') {
      return new Response(null, { status: 302, headers: { Location: codespace, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
    }
    return new Response('Not found', { status: 404 });
  },
};
