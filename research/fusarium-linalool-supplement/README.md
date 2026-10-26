# Fusarium linalool supplement audit

This [executed Jupyter notebook](../../notebooks/terputer-fusarium-linalool-supplement.ipynb) audits the publisher's [supplementary tables](https://mdpi-res.com/d_attachment/ijms/ijms-24-00458/article_deploy/ijms-24-00458-s001.zip) for the [three-versus-three linalool study](https://pmc.ncbi.nlm.nih.gov/articles/PMC9820380/) (PRJNA913446). It reads author-supplied gene, protein, and KEGG tables; it does not refit raw sequencing reads.

The [generated brief](generated/white-paper.md), [claim ledger](generated/claim-ledger.tsv), and [generation receipt](generated/generation-receipt.json) link each result to the executed notebook and source archive. The source ZIP is omitted from Git; its URL and SHA-256 are in [report-spec.json](report-spec.json). The notebook pins the ZIP and its internal workbook by SHA-256.

The audit confirms 1,568 unique published DEG rows (979 up, 589 down). Amino sugar and nucleotide sugar metabolism is the only KEGG term significant in both the RNA and protein enrichment tables at adjusted p < 0.05. The two term member lists share one exact gene/protein identifier, FOXG_03194, reported down in both. This is within-study cross-omics agreement, not independent study replication or evidence of a direct linalool target.

## Reproduce

From the Terputer repository root:

```sh
python -m pip install -r requirements.txt
python restore-inputs.py research/fusarium-linalool-supplement/report-spec.json
python notebook-runner.py notebooks/terputer-fusarium-linalool-supplement.ipynb . 300 '["research/fusarium-linalool-supplement/results/pathway_crossomics.tsv","research/fusarium-linalool-supplement/results/gene_protein_overlap.tsv","research/fusarium-linalool-supplement/results/analysis_summary.json"]' '["research/fusarium-linalool-supplement/data/ijms-24-00458-s001.zip"]'
node report-generator.mjs research/fusarium-linalool-supplement/report-spec.json
```

The next inferential step is a pinned-reference raw-read reanalysis of PRJNA913446, followed by a compatible independent linalool exposure cohort. A chemical-genetic or direct binding assay would be needed to assess target dependency.
