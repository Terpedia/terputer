const categoryDescriptions = {
  'Genomics': 'Genome-level evidence, biosynthetic capacity, and evolution.',
  'Transcriptomics': 'RNA abundance, cellular state, and perturbation response.',
  'Proteomics': 'Protein abundance, function, interaction, and target evidence.',
  'Metabolomics': 'Chemical identity, abundance, profiles, and pathways.',
  'Translational & clinical': 'Evidence synthesis, protocols, and translational research.',
  'Research infrastructure': 'Shared tooling for literature, curation, and computation.'
};
const search = document.querySelector('#search');
const categoryFilter = document.querySelector('#category');
const catalog = document.querySelector('#catalog');
const count = document.querySelector('#count');
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let projects = [];
function render() {
  const q = search.value.trim().toLowerCase();
  const selected = categoryFilter.value;
  const matches = projects.filter(project => (!selected || project.category === selected) && (!q || `${project.title} ${project.summary} ${project.category} ${project.status}`.toLowerCase().includes(q)));
  count.textContent = `${matches.length} of ${projects.length} studies`;
  const categories = [...new Set(matches.map(project => project.category))];
  catalog.innerHTML = categories.map((name, index) => {
    const entries = matches.filter(project => project.category === name);
    return `<section class="category"><div class="category-head"><span>${String(index + 1).padStart(2,'0')}</span><h2>${esc(name)}</h2><p>${esc(categoryDescriptions[name] || '')}</p></div><div class="cards">${entries.map(project => `<article class="card"><div class="meta"><span class="status">${esc(project.status)}</span><span>${esc(project.slug)}</span></div><h3>${esc(project.title)}</h3><p>${esc(project.summary)}</p><div class="links"><a href="${esc(project.repository)}" target="_blank" rel="noreferrer">Repository ↗</a><a href="${esc(project.paper)}" target="_blank" rel="noreferrer">White paper ↗</a><a href="${esc(project.notebook)}" target="_blank" rel="noreferrer">Notebook ↗</a></div></article>`).join('')}</div></section>`;
  }).join('') || '<p class="empty">No projects match this search.</p>';
}
fetch('/projects/catalog.json').then(response => { if (!response.ok) throw new Error('Catalog request failed'); return response.json(); }).then(data => {
  projects = data;
  [...new Set(projects.map(project => project.category))].forEach(name => categoryFilter.add(new Option(name, name)));
  render();
}).catch(() => { catalog.innerHTML = '<p class="empty">The research catalog is unavailable. Please return to the workspace and try again.</p>'; });
search.addEventListener('input', render);
categoryFilter.addEventListener('change', render);
