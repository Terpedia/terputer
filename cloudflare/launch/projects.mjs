import catalog from '../../public/projects/catalog.json';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

export function projectsPage() {
  const categories = [...new Set(catalog.map((project) => project.category))];
  const cards = catalog.map((project) => {
    const searchable = `${project.title} ${project.summary} ${project.category} ${project.status} ${project.slug}`.toLowerCase();
    return `<article class="card" data-category="${escapeHtml(project.category)}" data-search="${escapeHtml(searchable)}"><p class="status">${escapeHtml(project.status)} · ${escapeHtml(project.category)}</p><h2>${escapeHtml(project.title)}</h2><p>${escapeHtml(project.summary)}</p><nav><a href="${escapeHtml(project.repository)}">Repository</a><a href="${escapeHtml(project.notebook)}">Notebook</a><a href="${escapeHtml(project.paper)}">White paper</a></nav></article>`;
  }).join('');
  const options = categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Browse Terpedia's public research notebooks and white papers."><title>Terputer research library</title><style>
body{margin:0;background:#f5f8f5;color:#183025;font:16px/1.55 system-ui,sans-serif}header,main,footer{max-width:1160px;margin:auto;padding:24px}header{display:flex;justify-content:space-between;gap:16px}a{color:#096b49}h1{font-size:clamp(2rem,5vw,3.4rem);line-height:1.1;margin:.4em 0}.intro{max-width:760px}.controls{display:flex;flex-wrap:wrap;gap:14px;margin:28px 0}label{display:grid;gap:5px;font-weight:600}input,select{font:inherit;padding:10px 12px;border:1px solid #9db8a7;border-radius:8px;background:#fff;min-width:240px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:16px}.card{background:#fff;border:1px solid #d5e3d8;border-radius:12px;padding:20px}.card h2{font-size:1.25rem;margin:.35em 0}.status{font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;color:#4c755f}.card nav{display:flex;flex-wrap:wrap;gap:12px;margin-top:18px}.card[hidden]{display:none}footer{color:#51705b}
  </style><header><a href="/about">TERPUTER</a><a href="/api">Research API</a></header><main><div class="intro"><p class="status">Terpedia research</p><h1>Research library</h1><p>Browse ${catalog.length} public studies. Each entry links to its source repository, notebook, and white paper. A member's report fork can separately attach that member's own research projects under <code>projects/</code>.</p></div><div class="controls"><label>Search<input id="search" type="search" placeholder="Compound, organism, method…"></label><label>Category<select id="category"><option value="">All categories</option>${options}</select></label></div><p id="count" aria-live="polite">${catalog.length} studies</p><section class="grid" aria-label="Research studies">${cards}</section></main><footer>Terpedia · Terputer</footer><script>
const search=document.querySelector('#search'),category=document.querySelector('#category'),cards=[...document.querySelectorAll('.card')],count=document.querySelector('#count');function filter(){const q=search.value.trim().toLowerCase(),c=category.value;let n=0;for(const card of cards){card.hidden=!!((c&&card.dataset.category!==c)||(q&&!card.dataset.search.includes(q)));if(!card.hidden)n++}count.textContent=n+' of '+cards.length+' studies'}search.addEventListener('input',filter);category.addEventListener('change',filter);
  </script></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}
