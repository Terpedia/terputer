# Paclitaxel exposure in HCC1143: a compact single-cell evidence brief

> Generated evidence brief. Each statement is linked to a claim record; scientific interpretation still requires review.

**Research question:** Which cellular responses to a terpene-derived compound appear at 24 and 72 hours in one public single-cell experiment?

**Notebook:** `notebooks/terputer-paclitaxel-single-cell.ipynb` · SHA-256 `7b6590dd43ca693c6fdca65165e2e8df9da07c83835de8f0647750f0d8a9f9ed` · 4 executed code cells

## Abstract

Paclitaxel is a taxane diterpenoid, and GSE266934 includes HCC1143 single-cell libraries exposed to 1 nM paclitaxel or 0.1% DMSO for 24 or 72 hours. (claim P01; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE266934), [2](https://doi.org/10.1038/s41598-024-82218-9), [3](https://pubchem.ncbi.nlm.nih.gov/compound/Paclitaxel))

The treated-minus-control median interferon marker score was +0.218 at 24 hours and +0.510 at 72 hours; the selected cell-cycle score was -0.251 and -0.049, respectively. (claim P03; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE266934))

This four-library design has one library per treatment and time point, so it cannot establish biological reproducibility, cross-context transfer, or target dependence. (claim P05; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE266934), [2](https://doi.org/10.1038/s41598-024-82218-9))

## Background

Paclitaxel is a taxane diterpenoid, and GSE266934 includes HCC1143 single-cell libraries exposed to 1 nM paclitaxel or 0.1% DMSO for 24 or 72 hours. (claim P01; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE266934), [2](https://doi.org/10.1038/s41598-024-82218-9), [3](https://pubchem.ncbi.nlm.nih.gov/compound/Paclitaxel))

## Methods

After the prespecified cell QC, 1,106 and 788 cells remained in the 24-hour DMSO and paclitaxel libraries; 787 and 513 remained at 72 hours. (claim P02; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE266934)) Artifacts: [research/transcriptomics/gse266934/results/library_qc.tsv](../../transcriptomics/gse266934/results/library_qc.tsv).

## Results

The treated-minus-control median interferon marker score was +0.218 at 24 hours and +0.510 at 72 hours; the selected cell-cycle score was -0.251 and -0.049, respectively. (claim P03; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE266934)) Artifacts: [research/transcriptomics/gse266934/results/module_contrasts.tsv](../../transcriptomics/gse266934/results/module_contrasts.tsv).

Marker-level CPM ratios are heterogeneous: at both time points CCNB1 and UBE2C are higher in the paclitaxel library, whereas MKI67, TOP2A, and CENPF are lower. (claim P04; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE266934)) Artifacts: [research/transcriptomics/gse266934/results/marker_cpm_ratios.tsv](../../transcriptomics/gse266934/results/marker_cpm_ratios.tsv).

## Interpretation

The treated-minus-control median interferon marker score was +0.218 at 24 hours and +0.510 at 72 hours; the selected cell-cycle score was -0.251 and -0.049, respectively. (claim P03; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE266934)) Artifacts: [research/transcriptomics/gse266934/results/module_contrasts.tsv](../../transcriptomics/gse266934/results/module_contrasts.tsv).

## Limitations

This four-library design has one library per treatment and time point, so it cannot establish biological reproducibility, cross-context transfer, or target dependence. (claim P05; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE266934), [2](https://doi.org/10.1038/s41598-024-82218-9))

## Next research steps

**Proposed:** Repeat the time-matched comparison across independent culture preparations, include a second dose and another terpenoid, and add a replicated target perturbation before testing target dependence. (claim P06; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE266934), [2](https://doi.org/10.1038/s41598-024-82218-9))

## Data and code availability

The source specification is `research/transcriptomics/gse266934/report-spec.json` (SHA-256 `4188643ffdbeb46522a11dfad348a017f9219d054589002a4f22954efba1173c`). The claim ledger and generation receipt accompany this report. File hashes identify the exact local inputs used. The [notebook execution receipt](../../execution-receipts/terputer-paclitaxel-single-cell.json) matches the saved notebook SHA-256 and records the fresh-kernel run. Notebook execution does not independently validate scientific interpretation.

## References

[1] GEO GSE266934. https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE266934
[2] Primary study article. https://doi.org/10.1038/s41598-024-82218-9
[3] PubChem paclitaxel. https://pubchem.ncbi.nlm.nih.gov/compound/Paclitaxel
