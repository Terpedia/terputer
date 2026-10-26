const revision = 'ef29dc4c796e360c2e7330d22c0f3948d7abae3b';
const sourceSha256 = '98971a080d3ba559fd5c1697f1df8df52f125d83bb5832f433ac7273c6d5d149';
const sourceUrl = `https://raw.githubusercontent.com/Terpedia/terpedia-menthol-wnt3a-rnaseq/${revision}/research/menthol-wnt3a-rnaseq/results/feature_effects.tsv.gz`;
const reportUrl = `https://github.com/Terpedia/terpedia-menthol-wnt3a-rnaseq/blob/${revision}/research/menthol-wnt3a-rnaseq/generated/white-paper.md`;
const columns = ['feature_id', 'max_group_mean_fpkm', 'menthol_without_wnt3a_log2_fpkm_delta',
  'menthol_with_wnt3a_log2_fpkm_delta', 'wnt3a_without_menthol_log2_fpkm_delta',
  'interaction_difference', 'expressed'];

export async function getTranscriptomicFeatureEffect({ accession, feature }) {
  const study = String(accession || '').trim().toUpperCase();
  const requested = String(feature || '').trim();
  if (!/^[A-Za-z0-9_.:-]{1,60}$/.test(requested)) throw new Error('Provide one source feature identifier without spaces.');
  if (study !== 'GSE242559') return {
    accession: study, feature_query: requested, match_status: 'not_curated',
    available_studies: ['GSE242559'],
    interpretation: 'Feature-level lookup is currently curated only for GSE242559. Study-level evidence is available through get_transcriptomic_evidence.',
  };

  const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Pinned feature artifact returned HTTP ${response.status}`);
  const compressed = await response.arrayBuffer();
  if (compressed.byteLength > 2_000_000) throw new Error('Pinned feature artifact exceeds its size limit.');
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', compressed))]
    .map((value) => value.toString(16).padStart(2, '0')).join('');
  if (digest !== sourceSha256) throw new Error('Pinned feature artifact checksum changed.');
  const stream = new Response(compressed).body.pipeThrough(new DecompressionStream('gzip'));
  const body = await new Response(stream).text();
  if (body.length > 5_000_000) throw new Error('Decompressed feature artifact exceeds its size limit.');
  const lines = body.trimEnd().split(/\r?\n/);
  if (lines.shift() !== columns.join('\t')) throw new Error('Pinned feature artifact schema changed.');
  const exact = [], folded = [];
  for (const line of lines) {
    const fields = line.split('\t');
    if (fields.length !== columns.length) throw new Error('Pinned feature artifact contains a malformed row.');
    if (fields[0] === requested) exact.push(fields);
    else if (fields[0].toLowerCase() === requested.toLowerCase()) folded.push(fields);
  }
  const matches = exact.length ? exact : folded;
  const provenance = {
    accession: study, feature_query: requested, source_url: sourceUrl,
    source_sha256: sourceSha256, source_revision: revision, report_url: reportUrl,
    assay: 'deposited processed bulk RNA-seq FPKM', biological_unit: 'library label; culture independence unverified',
    method: 'Mean within each arm of sample log2(FPKM + 0.1); interaction = (Menthol+Wnt3a - Wnt3a) - (Menthol - Control)',
    evidence_class: 'descriptive processed-expression effect, without p value or replicate-level uncertainty',
    limitations: 'No raw-count model, adjusted significance, pathway test, verified menthol stereochemistry, or TRPM8 dependency. The expressed filter is maximum arm-mean FPKM >= 1; low-abundance scores are especially pseudocount-sensitive.',
  };
  if (!matches.length) return { ...provenance, match_status: 'not_found', interpretation: 'The queried identifier is absent under this exact or case-insensitive label in the deposited feature table; this is not proof of biological absence.' };
  if (matches.length > 1) return { ...provenance, match_status: 'ambiguous', candidates: matches.map((row) => row[0]), interpretation: 'Multiple source identifiers match; specify the exact feature_id.' };
  const row = matches[0];
  const values = Object.fromEntries(columns.slice(1, 6).map((key, index) => [key, Number(row[index + 1])]));
  if (Object.values(values).some((value) => !Number.isFinite(value)) || !['True', 'False'].includes(row[6])) {
    throw new Error('Pinned feature artifact contains an invalid numeric value.');
  }
  return {
    ...provenance, match_status: exact.length ? 'exact' : 'case_insensitive', feature_id: row[0],
    ...values, expressed_filter_passed: row[6] === 'True',
    interpretation: 'These are descriptive transformed-FPKM differences, not differential-expression or target-dependency estimates.',
  };
}
