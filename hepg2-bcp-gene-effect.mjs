const revision = '76bbc4748d6d0590bea4fa7fb3a3e32c80c74d33';
const sourceSha256 = 'af2559428959ff5b366bf3899d37da1cd1d87d9ddc8f0eb33a19077d685585ef';
const sourceUrl = `https://raw.githubusercontent.com/Terpedia/terpedia-hepg2-bcp-rsem/${revision}/research/hepg2-bcp-rsem/results/raw_counts/deseq2_results.tsv`;
const reportUrl = `https://github.com/Terpedia/terpedia-hepg2-bcp-rsem/blob/${revision}/research/hepg2-bcp-raw-counts/generated/white-paper.md`;
const header = 'gene_id\tbaseMean\tlog2FoldChange\tlfcSE\tstat\tpvalue\tpadj\tgene_name\tgene_type';
const limitations = 'One HepG2 cohort with three labeled libraries per arm; dose fields and biological replicate independence are uncertain. Expression differences do not establish pathway activity, metabolic flux, cross-context replication, or direct target binding.';

export async function getHepg2BcpGeneEffect({ gene }) {
  const query = String(gene || '').trim();
  if (!/^[A-Za-z0-9_.:-]{1,60}$/.test(query)) throw new Error('Provide one gene symbol or stable gene ID without spaces.');
  const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Pinned HepG2 result returned HTTP ${response.status}`);
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > 3_000_000) throw new Error('Pinned HepG2 result exceeds its size limit');
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
    .map((value) => value.toString(16).padStart(2, '0')).join('');
  if (digest !== sourceSha256) throw new Error('Pinned HepG2 result checksum changed');
  const lines = new TextDecoder().decode(bytes).trimEnd().split(/\r?\n/);
  if (lines.shift() !== header || lines.length !== 15078) throw new Error('Pinned HepG2 result schema or row count changed');
  const exact = [], folded = [];
  for (const line of lines) {
    const row = line.split('\t');
    if (row.length !== 9) throw new Error('Pinned HepG2 result contains a malformed row');
    if (row[0] === query || row[7] === query) exact.push(row);
    else if (row[0].toLowerCase() === query.toLowerCase() || row[7].toLowerCase() === query.toLowerCase()
      || row[0].split('.')[0].toLowerCase() === query.toLowerCase()) folded.push(row);
  }
  const matches = exact.length ? exact : folded;
  const provenance = {
    study_id: 'GSE276099', contrast_id: 'GSE276099:beta-caryophyllene-vs-vehicle-raw-counts',
    gene_query: query, source_mode: 'checksum-pinned-public-result', source_url: sourceUrl,
    source_revision: revision, source_sha256: sourceSha256, report_url: reportUrl,
    processing_receipt_sha256: '47d46f4bf172ca9bbe76194d02a815442005e3277e76bcebf949f4eccad81662',
    execution_receipt_sha256: 'dddee79aaac5e63546f716c7a77e79fb39c4f030e50d1bd65d2037a602e9dbd7',
    assay: 'STAR unstranded integer counts; PyDESeq2 0.5.4 negative-binomial model',
    comparison: 'β-caryophyllene versus ethanol vehicle in HepG2; six labeled libraries',
    evidence_class: 'receipt-pinned within-study count-model estimate', limitations,
  };
  if (!matches.length) return { ...provenance, match_status: 'not_found', interpretation: 'The gene is absent under this symbol or stable ID among the 15,078 tested genes; this is not evidence of biological absence.' };
  if (matches.length > 1) return { ...provenance, match_status: 'ambiguous', candidates: matches.map((row) => ({ gene_id: row[0], gene_name: row[7] })), interpretation: 'Multiple tested genes match. Specify the versioned gene ID.' };
  const row = matches[0];
  const numeric = (value) => value === '' ? null : Number(value);
  const [baseMean, log2FoldChange, lfcSE, stat, pvalue, padj] = row.slice(1, 7).map(numeric);
  if ([baseMean, log2FoldChange, lfcSE, stat, pvalue, padj].some((value) => value !== null && !Number.isFinite(value))) throw new Error('Pinned HepG2 result contains an invalid numeric value');
  return {
    ...provenance, match_status: exact.length ? 'exact' : 'case_insensitive_or_versionless',
    gene_id: row[0], gene_name: row[7], gene_type: row[8],
    base_mean: baseMean, log2_fold_change: log2FoldChange, standard_error: lfcSE,
    test_statistic: stat, p_value: pvalue, adjusted_p_value: padj,
    interpretation: 'This is a within-study expression estimate. The adjusted p value uses the tested gene universe in this model; it is not a cross-study or pathway-level result.',
  };
}
