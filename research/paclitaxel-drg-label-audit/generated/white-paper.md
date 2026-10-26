# Mouse DRG paclitaxel candidate: a metadata audit and descriptive TPM brief

> Generated evidence brief. Each statement is linked to a claim record; scientific interpretation still requires review.

**Research question:** Can public mouse DRG transcriptomics support an interpretable paclitaxel-response contrast?

**Notebook:** `notebooks/terputer-paclitaxel-drg.ipynb` · SHA-256 `05a492a24448308326d229464b1e485dd3513bf229bc806060be07b76c26b6dd` · 2 executed code cells

## Abstract

GSE230454 and GSE230459 provide female SW mouse dorsal-root-ganglion RNA-seq control and Pax-titled sample groups, respectively. (claim D01; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230454), [2](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230459))

Every GSE230459 sample treatment-protocol field says saline although the sample titles say Pax and the study article describes paclitaxel dosing. (claim D02; [2](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230459), [3](https://pmc.ncbi.nlm.nih.gov/articles/PMC12353069/))

Among 14,119 features with control mean TPM at least one, 53.7% have positive and 46.3% negative descriptive log2(TPM + 1) ratios; the median ratio is +0.020. (claim D04; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230454), [2](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230459))

## Background

GSE230454 and GSE230459 provide female SW mouse dorsal-root-ganglion RNA-seq control and Pax-titled sample groups, respectively. (claim D01; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230454), [2](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230459))

Every GSE230459 sample treatment-protocol field says saline although the sample titles say Pax and the study article describes paclitaxel dosing. (claim D02; [2](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230459), [3](https://pmc.ncbi.nlm.nih.gov/articles/PMC12353069/))

## Methods

The processed workbooks contain 48,431 aligned feature rows and four TPM sample columns per arm. (claim D03; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230454), [2](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230459)) Artifacts: [research/transcriptomics/gse230454-459/results/analysis_summary.json](../../transcriptomics/gse230454-459/results/analysis_summary.json), [research/transcriptomics/gse230454-459/results/sample_qc.tsv](../../transcriptomics/gse230454-459/results/sample_qc.tsv).

## Results

Among 14,119 features with control mean TPM at least one, 53.7% have positive and 46.3% negative descriptive log2(TPM + 1) ratios; the median ratio is +0.020. (claim D04; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230454), [2](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230459)) Artifacts: [research/transcriptomics/gse230454-459/results/background_summary.json](../../transcriptomics/gse230454-459/results/background_summary.json).

The predeclared cell-cycle, interferon, cholesterol-synthesis, and injury-signaling marker panels have mixed descriptive directions. (claim D05; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230454), [2](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230459)) Artifacts: [research/transcriptomics/gse230454-459/results/marker_descriptive.tsv](../../transcriptomics/gse230454-459/results/marker_descriptive.tsv).

## Interpretation

Every GSE230459 sample treatment-protocol field says saline although the sample titles say Pax and the study article describes paclitaxel dosing. (claim D02; [2](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230459), [3](https://pmc.ncbi.nlm.nih.gov/articles/PMC12353069/))

The predeclared cell-cycle, interferon, cholesterol-synthesis, and injury-signaling marker panels have mixed descriptive directions. (claim D05; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230454), [2](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230459)) Artifacts: [research/transcriptomics/gse230454-459/results/marker_descriptive.tsv](../../transcriptomics/gse230454-459/results/marker_descriptive.tsv).

## Limitations

Every GSE230459 sample treatment-protocol field says saline although the sample titles say Pax and the study article describes paclitaxel dosing. (claim D02; [2](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230459), [3](https://pmc.ncbi.nlm.nih.gov/articles/PMC12353069/))

The processed workbooks contain 48,431 aligned feature rows and four TPM sample columns per arm. (claim D03; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230454), [2](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230459)) Artifacts: [research/transcriptomics/gse230454-459/results/analysis_summary.json](../../transcriptomics/gse230454-459/results/analysis_summary.json), [research/transcriptomics/gse230454-459/results/sample_qc.tsv](../../transcriptomics/gse230454-459/results/sample_qc.tsv).

Among 14,119 features with control mean TPM at least one, 53.7% have positive and 46.3% negative descriptive log2(TPM + 1) ratios; the median ratio is +0.020. (claim D04; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230454), [2](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230459)) Artifacts: [research/transcriptomics/gse230454-459/results/background_summary.json](../../transcriptomics/gse230454-459/results/background_summary.json).

## Next research steps

**Proposed:** Reconcile the eight GSM treatment records with the submitter and raw-data metadata before a replicate-aware count-based comparison. (claim D06; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230454), [2](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230459))

## Data and code availability

The source specification is `research/transcriptomics/gse230454-459/report-spec.json` (SHA-256 `88d3edd6a3fdc754850cb1c0d798923bb0af7d1a2d4bb6bb5cd1f5067b999229`). The claim ledger and generation receipt accompany this report. File hashes identify the exact local inputs used. The [notebook execution receipt](../../execution-receipts/terputer-paclitaxel-drg.json) matches the saved notebook and records hashes for result files written during its fresh-kernel run. Notebook execution does not independently validate scientific interpretation.

## References

[1] GEO GSE230454. https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230454
[2] GEO GSE230459. https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230459
[3] Primary study article. https://pmc.ncbi.nlm.nih.gov/articles/PMC12353069/
