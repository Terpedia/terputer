const categoryDescriptions = {
  'Genomics': 'Genome-level evidence, biosynthetic capacity, and evolution.',
  'Transcriptomics': 'RNA abundance, cellular state, and perturbation response.',
  'Proteomics': 'Protein abundance, function, interaction, and target evidence.',
  'Metabolomics': 'Chemical identity, abundance, profiles, and pathways.',
  'Translational & clinical': 'Evidence synthesis, protocols, and translational research.',
  'Research infrastructure': 'Shared tooling for literature, curation, and computation.',
  'Unclassified': 'New public terputer-* repositories discovered on GitHub; add catalog metadata to assign their research category and artifact links.'
};
const search = document.querySelector('#search');
const categoryFilter = document.querySelector('#category');
const catalog = document.querySelector('#catalog');
const count = document.querySelector('#count');
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let projects = [];
let discoveryMessage = '';
const githubSearchUrl = 'https://api.github.com/search/repositories?q=org%3ATerpedia+terputer-+in%3Aname&per_page=100&sort=updated';
const repoName = url => String(url || '').match(/github\.com\/([^/]+\/[^/]+)/i)?.[1]?.replace(/\.git$/, '').toLowerCase();
function projectLinks(project) {
  const links = [`<a href="${esc(project.repository)}" target="_blank" rel="noreferrer">Repository ↗</a>`];
  if (project.paper) links.push(`<a href="${esc(project.paper)}" target="_blank" rel="noreferrer">White paper ↗</a>`);
  if (project.notebook) links.push(`<a href="${esc(project.notebook)}" target="_blank" rel="noreferrer">Notebook ↗</a>`);
  return links.join('');
}
function render() {
  const q = search.value.trim().toLowerCase();
  const selected = categoryFilter.value;
  const matches = projects.filter(project => (!selected || project.category === selected) && (!q || `${project.title} ${project.summary} ${project.category} ${project.status} ${project.slug}`.toLowerCase().includes(q)));
  count.textContent = `${matches.length} of ${projects.length} repositories`;
  const categories = [...new Set(matches.map(project => project.category))];
  catalog.innerHTML = `${discoveryMessage ? `<p class="empty" role="status">${esc(discoveryMessage)}</p>` : ''}${categories.map((name, index) => {
    const entries = matches.filter(project => project.category === name);
    return `<section class="category"><div class="category-head"><span>${String(index + 1).padStart(2,'0')}</span><h2>${esc(name)}</h2><p>${esc(categoryDescriptions[name] || 'Public Terpedia repositories found on GitHub.')}</p></div><div class="cards">${entries.map(project => `<article class="card"><div class="meta"><span class="status">${esc(project.status)}</span><span>${esc(project.slug)}</span></div><h3>${esc(project.title)}</h3><p>${esc(project.summary)}</p><div class="links">${projectLinks(project)}</div></article>`).join('')}</div></section>`;
  }).join('') || '<p class="empty">No projects match this search.</p>'}`;
}
async function loadProjects() {
  const catalogResponse = await fetch('/projects/catalog.json');
  if (!catalogResponse.ok) throw new Error('Catalog request failed');
  const catalogProjects = await catalogResponse.json();
  const known = new Map(catalogProjects.map(project => [repoName(project.repository), project]));
  let repositories = [];
  try {
    const saved = JSON.parse(localStorage.getItem('terputer-github-projects') || 'null');
    if (saved && Date.now() - saved.savedAt < 10 * 60 * 1000 && Array.isArray(saved.items)) repositories = saved.items;
  } catch {}
  if (!repositories.length) {
    const response = await fetch(githubSearchUrl, { headers: { Accept: 'application/vnd.github+json' } });
    if (!response.ok) throw new Error(`GitHub search returned ${response.status}. Showing the saved research catalog.`);
    const result = await response.json();
    repositories = (result.items || []).filter(repo => repo.owner?.login?.toLowerCase() === 'terpedia' && /^terputer-[a-z0-9][a-z0-9-]*$/i.test(repo.name || ''));
    try { localStorage.setItem('terputer-github-projects', JSON.stringify({ savedAt: Date.now(), items: repositories })); } catch {}
  }
  const discovered = repositories.map(repo => {
    const existing = known.get(repo.full_name.toLowerCase());
    if (existing) return { ...existing, updated_at: repo.updated_at, discovery: 'catalog+github' };
    const slug = repo.name.slice('terputer-'.length).toLowerCase();
    return { slug, title: slug.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' '), category: 'Unclassified', status: repo.archived ? 'Archived' : 'GitHub project', summary: repo.description || 'Public Terpedia repository discovered on GitHub.', repository: repo.html_url, paper: null, notebook: null, updated_at: repo.updated_at, discovery: 'github' };
  });
  const discoveredNames = new Set(discovered.map(project => repoName(project.repository)));
  projects = [...catalogProjects.map(project => discoveredNames.has(repoName(project.repository)) ? discovered.find(found => repoName(found.repository) === repoName(project.repository)) : project), ...discovered.filter(project => project.discovery === 'github')];
  discoveryMessage = 'Project list synced from public Terpedia GitHub repositories. New repositories without catalog metadata appear as Unclassified.';
  [...new Set(projects.map(project => project.category))].forEach(name => categoryFilter.add(new Option(name, name)));
  render();
}
loadProjects().catch(error => {
  fetch('/projects/catalog.json').then(response => response.json()).then(data => {
    projects = data;
    discoveryMessage = error instanceof Error ? `${error.message} Public GitHub discovery can be retried later.` : 'GitHub discovery failed. Showing the saved research catalog.';
    [...new Set(projects.map(project => project.category))].forEach(name => categoryFilter.add(new Option(name, name)));
    render();
  }).catch(() => { catalog.innerHTML = '<p class="empty">The research catalog is unavailable. Please return to the workspace and try again.</p>'; });
});
search.addEventListener('input', render);
categoryFilter.addEventListener('change', render);
