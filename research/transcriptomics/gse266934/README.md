# Paclitaxel single-cell exposure analysis

This compact, descriptive analysis uses the four public filtered 10x matrices from [GEO GSE266934](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE266934). The [primary article](https://doi.org/10.1038/s41598-024-82218-9) describes 1 nM paclitaxel versus 0.1% DMSO exposure in HCC1143 cells at 24 and 72 hours. Paclitaxel is a taxane diterpenoid. This is single-cell chemical exposure, not genetic Perturb-seq.

The [executed notebook](../../../notebooks/terputer-paclitaxel-single-cell.ipynb) records methods, results, and interpretation. `analysis.py` downloads the GEO supplementary archive, verifies SHA-256, applies the stated cell filters, scores prespecified marker panels, and writes the tables and figure in `results/`. The raw archive is cached under `/tmp/terputer-gse266934` and is not committed.

```sh
python -m pip install -r requirements.txt
python research/transcriptomics/gse266934/analysis.py
node report-generator.mjs research/transcriptomics/gse266934/report-spec.json
```

The generated [evidence brief](../../paclitaxel-single-cell/generated/white-paper.md) links each claim to sources and result artifacts. There is one library per condition. Cells are subsamples, so these results do not establish biological replication, cross-context transfer, differential-expression significance, or target dependence.
