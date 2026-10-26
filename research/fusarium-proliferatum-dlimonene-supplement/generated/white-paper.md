# D-limonene response in Fusarium proliferatum: a published-table audit

> Generated evidence brief. Each statement is linked to a claim record; scientific interpretation still requires review.

**Research question:** Which metabolic and signaling responses to terpene exposure are reproducible, and which depend on cellular context or a specific target?

**Notebook:** `notebooks/terputer-fusarium-proliferatum-dlimonene-supplement.ipynb` · SHA-256 `f6d6a0d963ac6dff57ea464ec860c3fa8f3a1acd70e2be5f55a0a4da7789bc9c` · 3 executed code cells

## Abstract

Publisher Table S4 contains 2,375 unique feature rows: 1,240 down and 1,135 up. All printed rows have adjusted p < 0.05 and absolute log2 fold change at least 1. (claim C03; [2](https://static-content.springer.com/esm/art%3A10.1186%2Fs12864-025-12389-w/MediaObjects/12864_2025_12389_MOESM2_ESM.xlsx))

The article reports 1,134 upregulated genes, while Table S4 has 1,135 upregulated features. The extra up entry is rrna13; 1,134 up entries have FPRO_ identifiers, but four down entries also have rrna identifiers, so a uniform exclusion rule is not documented. (claim C04; [1](https://link.springer.com/article/10.1186/s12864-025-12389-w), [2](https://static-content.springer.com/esm/art%3A10.1186%2Fs12864-025-12389-w/MediaObjects/12864_2025_12389_MOESM2_ESM.xlsx))

At adjusted p < 0.05, Table S5 has one H3K9ac-associated KEGG term, ribosome (ko03010), and no H3K27ac-associated KEGG terms. (claim C05; [2](https://static-content.springer.com/esm/art%3A10.1186%2Fs12864-025-12389-w/MediaObjects/12864_2025_12389_MOESM2_ESM.xlsx))

## Background

The source study compares three Fusarium proliferatum hyphal cultures exposed to 200 mM D-limonene for 24 hours with three untreated controls. The article reports substantial growth inhibition at this dose. (claim C01; [1](https://link.springer.com/article/10.1186/s12864-025-12389-w), [3](https://www.ncbi.nlm.nih.gov/bioproject/PRJNA1234870))

The article reports reduced H3K9ac and H3K27ac after D-limonene exposure and interprets transcriptome and ChIP-seq results as affecting translation and metabolism. (claim C06; [1](https://link.springer.com/article/10.1186/s12864-025-12389-w))

## Methods

Publisher Table S3 lists three untreated and three D-limonene RNA-seq libraries; its reported mapped fractions range from 0.9013 to 0.9422. (claim C02; [2](https://static-content.springer.com/esm/art%3A10.1186%2Fs12864-025-12389-w/MediaObjects/12864_2025_12389_MOESM2_ESM.xlsx)) Artifacts: [research/fusarium-proliferatum-dlimonene-supplement/results/analysis_summary.json](../results/analysis_summary.json), [research/fusarium-proliferatum-dlimonene-supplement/results/sample_qc.tsv](../results/sample_qc.tsv).

Publisher Table S4 contains 2,375 unique feature rows: 1,240 down and 1,135 up. All printed rows have adjusted p < 0.05 and absolute log2 fold change at least 1. (claim C03; [2](https://static-content.springer.com/esm/art%3A10.1186%2Fs12864-025-12389-w/MediaObjects/12864_2025_12389_MOESM2_ESM.xlsx)) Artifacts: [research/fusarium-proliferatum-dlimonene-supplement/results/analysis_summary.json](../results/analysis_summary.json), [research/fusarium-proliferatum-dlimonene-supplement/results/published_degs.tsv](../results/published_degs.tsv).

## Results

Publisher Table S4 contains 2,375 unique feature rows: 1,240 down and 1,135 up. All printed rows have adjusted p < 0.05 and absolute log2 fold change at least 1. (claim C03; [2](https://static-content.springer.com/esm/art%3A10.1186%2Fs12864-025-12389-w/MediaObjects/12864_2025_12389_MOESM2_ESM.xlsx)) Artifacts: [research/fusarium-proliferatum-dlimonene-supplement/results/analysis_summary.json](../results/analysis_summary.json), [research/fusarium-proliferatum-dlimonene-supplement/results/published_degs.tsv](../results/published_degs.tsv). **Limitation:** These are author-computed statistics; the notebook does not re-estimate a count model or verify the stated feature universe.

The article reports 1,134 upregulated genes, while Table S4 has 1,135 upregulated features. The extra up entry is rrna13; 1,134 up entries have FPRO_ identifiers, but four down entries also have rrna identifiers, so a uniform exclusion rule is not documented. (claim C04; [1](https://link.springer.com/article/10.1186/s12864-025-12389-w), [2](https://static-content.springer.com/esm/art%3A10.1186%2Fs12864-025-12389-w/MediaObjects/12864_2025_12389_MOESM2_ESM.xlsx)) Artifacts: [research/fusarium-proliferatum-dlimonene-supplement/results/analysis_summary.json](../results/analysis_summary.json), [research/fusarium-proliferatum-dlimonene-supplement/results/published_degs.tsv](../results/published_degs.tsv). **Limitation:** The reason for the one-row mismatch remains unresolved; it should not be silently corrected.

At adjusted p < 0.05, Table S5 has one H3K9ac-associated KEGG term, ribosome (ko03010), and no H3K27ac-associated KEGG terms. (claim C05; [2](https://static-content.springer.com/esm/art%3A10.1186%2Fs12864-025-12389-w/MediaObjects/12864_2025_12389_MOESM2_ESM.xlsx)) Artifacts: [research/fusarium-proliferatum-dlimonene-supplement/results/analysis_summary.json](../results/analysis_summary.json), [research/fusarium-proliferatum-dlimonene-supplement/results/acetylation_pathways.tsv](../results/acetylation_pathways.tsv). **Limitation:** This is a within-study pathway-list audit, not a mediation analysis or proof that histone acetylation causes the RNA response.

## Interpretation

At adjusted p < 0.05, Table S5 has one H3K9ac-associated KEGG term, ribosome (ko03010), and no H3K27ac-associated KEGG terms. (claim C05; [2](https://static-content.springer.com/esm/art%3A10.1186%2Fs12864-025-12389-w/MediaObjects/12864_2025_12389_MOESM2_ESM.xlsx)) Artifacts: [research/fusarium-proliferatum-dlimonene-supplement/results/analysis_summary.json](../results/analysis_summary.json), [research/fusarium-proliferatum-dlimonene-supplement/results/acetylation_pathways.tsv](../results/acetylation_pathways.tsv). **Limitation:** This is a within-study pathway-list audit, not a mediation analysis or proof that histone acetylation causes the RNA response.

The article reports reduced H3K9ac and H3K27ac after D-limonene exposure and interprets transcriptome and ChIP-seq results as affecting translation and metabolism. (claim C06; [1](https://link.springer.com/article/10.1186/s12864-025-12389-w)) **Limitation:** Observed chromatin changes and expression associations do not establish direct limonene binding to a histone regulator.

## Limitations

**Claim C02:** Publisher Table S3 lists three untreated and three D-limonene RNA-seq libraries; its reported mapped fractions range from 0.9013 to 0.9422. **Limitation:** This checks the published QC summary, not reads, alignments, contamination, or batch structure. ([2](https://static-content.springer.com/esm/art%3A10.1186%2Fs12864-025-12389-w/MediaObjects/12864_2025_12389_MOESM2_ESM.xlsx))

**Claim C04:** The article reports 1,134 upregulated genes, while Table S4 has 1,135 upregulated features. The extra up entry is rrna13; 1,134 up entries have FPRO_ identifiers, but four down entries also have rrna identifiers, so a uniform exclusion rule is not documented. **Limitation:** The reason for the one-row mismatch remains unresolved; it should not be silently corrected. ([1](https://link.springer.com/article/10.1186/s12864-025-12389-w), [2](https://static-content.springer.com/esm/art%3A10.1186%2Fs12864-025-12389-w/MediaObjects/12864_2025_12389_MOESM2_ESM.xlsx))

## Next research steps

**Proposed:** Reprocess the six PRJNA1234870 RNA-seq libraries against a pinned F. proliferatum reference, audit sample assignment and count-model assumptions, and check whether the one-row feature discrepancy persists. (claim C07; [3](https://www.ncbi.nlm.nih.gov/bioproject/PRJNA1234870), [1](https://link.springer.com/article/10.1186/s12864-025-12389-w))

**Proposed:** Compare D-limonene responses with the independent R-(+)-limonene Penicillium cohort only after confirming chemical stereochemistry, viability, dose, time, growth medium, and orthology mappings; test any nominated target with direct biochemical or chemical-genetic evidence. (claim C08; [1](https://link.springer.com/article/10.1186/s12864-025-12389-w), [3](https://www.ncbi.nlm.nih.gov/bioproject/PRJNA1234870))

## Data and code availability

The source specification is `research/fusarium-proliferatum-dlimonene-supplement/report-spec.json` (SHA-256 `27111111eaea59085daf0b97b8ba74ff8adef5cad49c42b5b1773448c3c43a6d`). The claim ledger and generation receipt accompany this report. File hashes identify the report files and cited result artifacts. 1 externally sourced input file has a source URL and hash listed below. The [notebook execution receipt](../../execution-receipts/terputer-fusarium-proliferatum-dlimonene-supplement.json) matches the saved notebook and records hashes for result files written during its fresh-kernel run. It also pins 1 declared local input file by SHA-256. It records the Python version and installed package versions. Notebook execution does not independently validate scientific interpretation.

### External data files

The following download locations and file hashes match inputs pinned by the notebook execution receipt. The generator does not download these files or verify that the URLs remain live.

| Input | Download | SHA-256 |
| --- | --- | --- |
| `research/fusarium-proliferatum-dlimonene-supplement/data/12864_2025_12389_MOESM2_ESM.xlsx` | [Source file](https://static-content.springer.com/esm/art%3A10.1186%2Fs12864-025-12389-w/MediaObjects/12864_2025_12389_MOESM2_ESM.xlsx) | `bfedef70fb595d62d0c8080b3dfe67f9d8b8291fcb43af2b5642ce6d89489212` |

## References

[1] Zhou et al., D-limonene and histone acetylation in Fusarium proliferatum (2025). https://link.springer.com/article/10.1186/s12864-025-12389-w
[2] Publisher Supplementary Material 2, Tables S3–S5. https://static-content.springer.com/esm/art%3A10.1186%2Fs12864-025-12389-w/MediaObjects/12864_2025_12389_MOESM2_ESM.xlsx
[3] SRA BioProject PRJNA1234870 RNA-seq reads. https://www.ncbi.nlm.nih.gov/bioproject/PRJNA1234870
