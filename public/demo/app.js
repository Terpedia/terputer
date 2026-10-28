const form = document.querySelector('#search-form');
const source = document.querySelector('#source');
const query = document.querySelector('#query');
const button = document.querySelector('#search-button');
const enaForm = document.querySelector('#ena-form');
const accession = document.querySelector('#accession');
const enaButton = document.querySelector('#ena-button');
const results = document.querySelector('#results');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function showStatus(message, error = false) {
  results.innerHTML = `<p class="status${error ? ' error' : ''}" role="status">${escapeHtml(message)}</p>`;
}

function unwrap(payload) {
  const result = payload?.result;
  if (result?.isError) throw new Error(result.content?.[0]?.text || 'The public source search failed.');
  if (result?.structuredContent) return result.structuredContent;
  const text = result?.content?.find(item => item.type === 'text')?.text;
  if (text) return JSON.parse(text);
  throw new Error('The research service returned an unexpected response.');
}

async function searchPublicSource(toolName, searchText) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch('/mcp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: crypto.randomUUID(),
          method: 'tools/call',
          params: { name: toolName, arguments: { query: searchText, limit: 5 } },
        }),
      });
      if (!response.ok) throw new Error(`Research service returned HTTP ${response.status}.`);
      return unwrap(await response.json());
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 700 * (attempt + 1)));
    }
  }
  throw lastError || new Error('The public source search failed.');
}

async function lookupEnaRuns(studyAccession) {
  const response = await fetch('/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method: 'tools/call',
      params: { name: 'get_ena_runs', arguments: { accession: studyAccession } },
    }),
  });
  if (!response.ok) throw new Error(`Research service returned HTTP ${response.status}.`);
  return unwrap(await response.json());
}

function renderRecords(data, toolName) {
  const records = Array.isArray(data.records) ? data.records : [];
  if (!records.length) {
    showStatus(`No ${toolName === 'search_geo_series' ? 'GEO study' : 'PubMed article'} records matched “${data.query || ''}”.`);
    return;
  }
  const sourceLabel = toolName === 'search_geo_series' ? 'NCBI GEO' : 'PubMed';
  const cards = records.map(record => {
    const identifier = toolName === 'search_geo_series' ? record.accession : `PMID ${record.pmid}`;
    const detail = toolName === 'search_geo_series'
      ? [record.organism, record.sampleCount ? `${record.sampleCount} samples` : null].filter(Boolean).join(' · ')
      : [record.publicationDate, record.doi ? `DOI ${record.doi}` : null].filter(Boolean).join(' · ');
    return `<article class="record"><div class="meta"><span>${escapeHtml(sourceLabel)}</span><span>${escapeHtml(identifier)}</span>${detail ? `<span>${escapeHtml(detail)}</span>` : ''}</div><h3>${escapeHtml(record.title || 'Untitled record')}</h3>${record.summary ? `<p>${escapeHtml(record.summary)}</p>` : ''}<a href="${escapeHtml(record.url)}" target="_blank" rel="noopener noreferrer">Open source record ↗</a></article>`;
  }).join('');
  results.innerHTML = `<p class="status">Showing ${records.length} of ${Number(data.total || records.length).toLocaleString()} matching public records for “${escapeHtml(data.query || '')}”. Check study design and source details before interpreting.</p>${cards}`;
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const searchText = query.value.trim();
  if (searchText.length < 2) return;
  button.disabled = true;
  results.setAttribute('aria-busy', 'true');
  showStatus('Searching public records…');
  try {
    const toolName = source.value;
    const data = await searchPublicSource(toolName, searchText);
    renderRecords(data, toolName);
  } catch (error) {
    showStatus(`${error instanceof Error ? error.message : 'Search failed.'} Wait a moment and try again.`, true);
  } finally {
    button.disabled = false;
    results.setAttribute('aria-busy', 'false');
  }
});

enaForm.addEventListener('submit', async event => {
  event.preventDefault();
  const studyAccession = accession.value.trim().toUpperCase();
  if (!/^(PRJ[EDN][A-Z]?\d+|[ESD]RP\d+)$/.test(studyAccession)) {
    showStatus('Enter a valid ENA study accession, such as PRJEB12345.', true);
    accession.focus();
    return;
  }
  enaButton.disabled = true;
  results.setAttribute('aria-busy', 'true');
  showStatus(`Looking up public ENA run metadata for ${studyAccession}…`);
  try {
    const data = await lookupEnaRuns(studyAccession);
    renderEnaRuns(data);
  } catch (error) {
    showStatus(`${error instanceof Error ? error.message : 'ENA lookup failed.'} Wait a moment and try again.`, true);
  } finally {
    enaButton.disabled = false;
    results.setAttribute('aria-busy', 'false');
  }
});

function renderEnaRuns(data) {
  const runs = Array.isArray(data.runs) ? data.runs : [];
  if (!runs.length) {
    showStatus(`No public run records were returned for ${data.accession}. Check the accession or try another study.`);
    return;
  }
  const rows = runs.map(run => `<tr><td><a href="https://www.ebi.ac.uk/ena/browser/view/${encodeURIComponent(run.run_accession || '')}" target="_blank" rel="noopener noreferrer">${escapeHtml(run.run_accession || '—')} ↗</a></td><td>${escapeHtml(run.library_strategy || '—')}</td><td>${escapeHtml(run.library_layout || '—')}</td><td>${formatBytes(run.fastq_bytes)}</td><td><code>${escapeHtml(run.fastq_md5 || '—')}</code></td></tr>`).join('');
  results.innerHTML = `<p class="status">Showing ${runs.length}${data.truncated ? ' of more than 100' : ''} public ENA sequencing runs for ${escapeHtml(data.accession)}. This is run metadata only; Terputer does not download sequence files in this demo.</p><div class="table-wrap"><table><thead><tr><th>Run</th><th>Library strategy</th><th>Layout</th><th>FASTQ bytes</th><th>MD5</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function formatBytes(value) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let size = bytes / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) { size /= 1024; unit += 1; }
  return `${size.toFixed(1)} ${units[unit]}`;
}
