# GSE162256: independent single-cell paclitaxel candidate

## Why this dataset

[GSE162256](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE162256) profiles A2780 ovarian cancer cells exposed to paclitaxel, celecoxib, their combination, or control. It is an independent cell-line context for the existing HCC1143 paclitaxel example [GSE266934](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE266934). Paclitaxel is a taxane diterpenoid. This is chemical-exposure single-cell RNA-seq, **not** genetic Perturb-seq.

## Pinned public input

- GEO processed matrix: <https://ftp.ncbi.nlm.nih.gov/geo/series/GSE162nnn/GSE162256/suppl/GSE162256_Evalues.txt.gz>
- Compressed size observed 2026-10-26: 5,812,880 bytes.
- Compressed SHA-256: `c998a6d6034486a19fde2619a271f67de807cfc2e9d9af6b2007b8c5c0ea70ae`.
- GEO family metadata: <https://ftp.ncbi.nlm.nih.gov/geo/series/GSE162nnn/GSE162256/soft/GSE162256_family.soft.gz>.

The processed matrix has 338 cell columns and a second `States` row. Column-name groups in that matrix are: 46 control, 56 paclitaxel 16 h, 53 paclitaxel 48 h, 63 celecoxib 2 h, 61 celecoxib 16 h, and 59 combination cells. The GEO family metadata lists 372 submitted samples before quality filtering; the series record says the processed file retains 338 data columns. These are **cells**, not 338 biological replicates. The GEO sample record describes 5 nM paclitaxel and 75 µM celecoxib, with a 48-hour combination treatment; dose and timing should be checked per sample before any formal contrast.

## Analysis decision

Use the processed matrix for a *descriptive* within-study comparison of control versus paclitaxel 16 h and 48 h. Track cell counts, missing values, distributions, and genes passing a detection filter. Compare direction and rank of predeclared marker-gene effects with the HCC1143 example only after checking that its 24 h/72 h doses and processing yield a sensible common scale. The unequal times, cell lines, platforms, normalization, and lack of independent culture replicates prevent a pooled differential-expression p-value or a claim of a reproducible pathway. Avoid treating the single cells as biological replicates. Keep celecoxib and combination arms separate because they answer different drug questions.

The published study reports a metabolism/inflammation module in a paclitaxel-exposed subpopulation and emphasizes spike-in normalization of global RNA. Those are source-author findings, not yet independent Terputer results. The next notebook should preserve the spike-in/normalization distinction and state exactly whether `Evalues.txt.gz` supports absolute or only relative comparisons before computing any effect size.

## Candidate status

**Descriptive analysis complete.** The [executed notebook](../../../notebooks/terputer-gse162256-single-cell.ipynb), [analysis script](analysis.py), and [marker table](results/marker_descriptive.tsv) and [feature-wide background table](results/background_descriptive.tsv) show lower reported median values for all six predeclared cell-cycle markers at both paclitaxel times. Among 9,276 features detected in at least 20% of control cells, 69.8% and 64.3% also have lower medians at 16 and 48 hours. Marker direction alone is therefore not evidence of a specific cell-cycle program. The interferon panel is mixed or absent. These observations do not establish replicate-level differential expression or a shared pathway. The original processed matrix is downloaded on demand and verified by checksum; it is not committed to this repository.

Source: [GEO series](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE162256); [study article](https://pmc.ncbi.nlm.nih.gov/articles/PMC8210883/).
