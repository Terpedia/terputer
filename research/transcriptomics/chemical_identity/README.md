# Chemical identity and replication triage

The [executed notebook](../../../notebooks/terputer-chemical-identity-replication-audit.ipynb)
compares the exact exposure labels in the 14 curated transcriptomics contrasts.
It produces `identity_audit.tsv` and `replication_triage.tsv` with a Terputer
fresh-kernel [execution receipt](../../execution-receipts/terputer-chemical-identity-replication-audit.json).

`chebi_candidates.tsv` is the result of `chebi_candidates.sql` against
`terpedia-489015.terpedia_core.chebi_terpene_ontology_239_20260904` on
26 October 2026. It contains 12 **candidate label** records from a selected
Terpedia ChEBI descendant extract. An absent label in this extract does not
mean the compound is absent from ChEBI. A matching label does not establish
the structure, stereochemistry, purity, or dose of the exposed material.

The triage finds two curated studies each under the broad linalool, limonene,
terpinen-4-ol, and β-caryophyllene labels. None of these pairs is graded as
a replicated metabolic or signaling response. The label families are only
leads for study-design and raw-count review. `GSE263903` is a commercial
MentholMint nicotine-containing aerosol, not isolated menthol exposure.

To refresh the candidate extract with appropriate BigQuery access, run the
saved SQL and preserve its output and query date before rebuilding the
notebook. The notebook itself reads only pinned local TSV and JSONL inputs;
it does not need a live warehouse connection.
