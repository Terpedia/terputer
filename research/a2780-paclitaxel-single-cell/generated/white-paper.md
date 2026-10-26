# Paclitaxel exposure in A2780: a single-cell descriptive evidence brief

> Generated evidence brief. Each statement is linked to a claim record; scientific interpretation still requires review.

**Research question:** Which predeclared response markers change after paclitaxel exposure in A2780 cells, and what can be compared with HCC1143?

**Notebook:** `notebooks/terputer-gse162256-single-cell.ipynb` · SHA-256 `9dad041e6ae95b51fd1ff26f5aca8004fb35c5ae5459714b3be96a408fa52d1f` · 2 executed code cells

## Abstract

GSE162256 profiles A2780 cells after paclitaxel, celecoxib, their combination, or control; the paclitaxel arms used here are 5 nM at 16 and 48 hours. (claim A01; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE162256), [2](https://pmc.ncbi.nlm.nih.gov/articles/PMC8210883/))

All six predeclared cell-cycle markers have lower median reported values at both paclitaxel times than in control cells. (claim A03; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE162256))

The A2780 and HCC1143 single-cell examples differ in cell line, paclitaxel dose, exposure time, assay, and processing; marker-direction disagreement does not isolate a cell-context effect. (claim A05; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE162256), [3](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE266934), [4](https://github.com/Terpedia/terputer/blob/e7a775db7c4354db4466e885a3aa97de8ba180cd/research/transcriptomics/white-paper.md))

## Background

GSE162256 profiles A2780 cells after paclitaxel, celecoxib, their combination, or control; the paclitaxel arms used here are 5 nM at 16 and 48 hours. (claim A01; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE162256), [2](https://pmc.ncbi.nlm.nih.gov/articles/PMC8210883/))

## Methods

The quality-filtered processed matrix has 9,664 feature rows and 338 cell columns, including 46 control, 56 paclitaxel 16-hour, and 53 paclitaxel 48-hour cells. (claim A02; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE162256)) Artifacts: [research/transcriptomics/gse162256/results/analysis_summary.json](../../transcriptomics/gse162256/results/analysis_summary.json).

## Results

All six predeclared cell-cycle markers have lower median reported values at both paclitaxel times than in control cells. (claim A03; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE162256)) Artifacts: [research/transcriptomics/gse162256/results/marker_descriptive.tsv](../../transcriptomics/gse162256/results/marker_descriptive.tsv).

Three of seven predeclared interferon markers (IFIT3, MX1, OAS1) are absent from the processed A2780 matrix, and the available markers do not show a uniformly higher median after paclitaxel. (claim A04; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE162256)) Artifacts: [research/transcriptomics/gse162256/results/marker_descriptive.tsv](../../transcriptomics/gse162256/results/marker_descriptive.tsv).

## Interpretation

The A2780 and HCC1143 single-cell examples differ in cell line, paclitaxel dose, exposure time, assay, and processing; marker-direction disagreement does not isolate a cell-context effect. (claim A05; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE162256), [3](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE266934), [4](https://github.com/Terpedia/terputer/blob/e7a775db7c4354db4466e885a3aa97de8ba180cd/research/transcriptomics/white-paper.md))

## Limitations

The quality-filtered processed matrix has 9,664 feature rows and 338 cell columns, including 46 control, 56 paclitaxel 16-hour, and 53 paclitaxel 48-hour cells. (claim A02; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE162256)) Artifacts: [research/transcriptomics/gse162256/results/analysis_summary.json](../../transcriptomics/gse162256/results/analysis_summary.json).

The A2780 and HCC1143 single-cell examples differ in cell line, paclitaxel dose, exposure time, assay, and processing; marker-direction disagreement does not isolate a cell-context effect. (claim A05; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE162256), [3](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE266934), [4](https://github.com/Terpedia/terputer/blob/e7a775db7c4354db4466e885a3aa97de8ba180cd/research/transcriptomics/white-paper.md))

## Next research steps

**Proposed:** Repeat vehicle-matched paclitaxel exposure at shared dose and time points across independent A2780 and HCC1143 cultures, then compare replicate-aware marker or pathway effects. (claim A06; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE162256), [3](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE266934))

## Data and code availability

The source specification is `research/transcriptomics/gse162256/report-spec.json` (SHA-256 `2fe5f6cd7093a2853412b2376ccc40e4a5886fea148fe8cfd57c5a7aa9ef2562`). The claim ledger and generation receipt accompany this report. File hashes identify the exact local inputs used. The [notebook execution receipt](../../execution-receipts/terputer-gse162256-single-cell.json) matches the saved notebook and records hashes for result files written during its fresh-kernel run. Notebook execution does not independently validate scientific interpretation.

## References

[1] GEO GSE162256. https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE162256
[2] Primary GSE162256 study article. https://pmc.ncbi.nlm.nih.gov/articles/PMC8210883/
[3] GEO GSE266934 HCC1143 comparison. https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE266934
[4] Terputer transcriptomics white paper cross-context assessment. https://github.com/Terpedia/terputer/blob/e7a775db7c4354db4466e885a3aa97de8ba180cd/research/transcriptomics/white-paper.md
