const codespace = 'https://codespaces.new/Terpedia/terpedia-transcriptomics-demo?quickstart=1';
const repository = 'https://github.com/Terpedia/terpedia-transcriptomics-demo';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', target: codespace }, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    if (url.pathname === '/about') {
      const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Terputer Codespace example</title><style>body{font:18px/1.6 system-ui,sans-serif;max-width:760px;margin:8vh auto;padding:0 22px;color:#153022}a{color:#08744f}h1{font-size:2.5rem;line-height:1.1}.button{display:inline-block;background:#08744f;color:white;padding:.7em 1.1em;border-radius:8px;text-decoration:none}li{margin:.5em 0}</style><h1>Explore Terputer in a Codespace</h1><p>Open a ready-to-run bioinformatics workspace with a Jupyter notebook, Python kernel, transcriptomics data, and a source-cited white paper.</p><p><a class="button" href="${codespace}">Open example Codespace</a></p><ul><li><a href="${repository}/blob/main/notebooks/terputer-transcriptomics.ipynb">Executed notebook</a></li><li><a href="${repository}/blob/main/research/transcriptomics/white-paper.md">White paper</a></li><li><a href="${repository}/blob/main/research/transcriptomics/critical-review.md">Critical review</a></li></ul><p>A GitHub account is needed to create a Codespace. Notebook execution needs no API key; the in-app research agent uses your own OpenRouter key.</p></html>`;
      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
    }
    if (url.pathname === '/' || url.pathname === '') {
      return new Response(null, { status: 302, headers: { Location: codespace, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
    }
    return new Response('Not found', { status: 404 });
  },
};
