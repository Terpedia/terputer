# R-(+)-limonene response in Penicillium: a publisher-table audit

> Generated evidence brief. Each statement is linked to a claim record; scientific interpretation still requires review.

**Research question:** Which metabolic and signaling responses to terpene exposure are reproducible, and which depend on cellular context or a specific target?

**Notebook:** `notebooks/terputer-penicillium-limonene-supplement.ipynb` · SHA-256 `bebb6b16c994c6604a255cf20145b756fa2c95e971a7c1f50770d30e99cc641c` · 3 executed code cells

## Abstract

The publisher workbook Table S7 has 58 unique nonblank gene rows. In the time-matched expression columns, 31 are higher and 27 lower after limonene exposure. (claim C02; [2](https://public-pages-files-2025.frontiersin.org/articles/527643/file/Data_Sheet_1.xlsx/527643_supplementary-materials_datasheets_1_xlsx/1))

Only 10 of the 58 rows have an explicit P450 or CYP label in either the supplied NR or KEGG annotation text (8 in NR, 6 in KEGG, with overlap). (claim C03; [2](https://public-pages-files-2025.frontiersin.org/articles/527643/file/Data_Sheet_1.xlsx/527643_supplementary-materials_datasheets_1_xlsx/1))

Table S7 does not include per-gene adjusted p values or replicate-level measurements, so its reported candidate significance cannot be independently audited from this workbook. (claim C04; [2](https://public-pages-files-2025.frontiersin.org/articles/527643/file/Data_Sheet_1.xlsx/527643_supplementary-materials_datasheets_1_xlsx/1))

## Background

The source study sampled Penicillium digitatum DSM 62840 after 12 hours with 840 mg/L R-(+)-limonene and compared it with an untreated 12-hour arm; it also sampled an untreated zero-hour arm. (claim C01; [1](https://www.frontiersin.org/journals/microbiology/articles/10.3389/fmicb.2020.00744/full), [3](https://www.ebi.ac.uk/ena/browser/view/PRJNA608617))

The article reports 4,148 DEGs for the limonene-treated versus untreated 12-hour comparison and discusses candidate P450 involvement in limonene biotransformation. (claim C05; [1](https://www.frontiersin.org/journals/microbiology/articles/10.3389/fmicb.2020.00744/full))

## Methods

The publisher workbook Table S7 has 58 unique nonblank gene rows. In the time-matched expression columns, 31 are higher and 27 lower after limonene exposure. (claim C02; [2](https://public-pages-files-2025.frontiersin.org/articles/527643/file/Data_Sheet_1.xlsx/527643_supplementary-materials_datasheets_1_xlsx/1)) Artifacts: [research/penicillium-limonene-supplement/results/analysis_summary.json](../results/analysis_summary.json), [research/penicillium-limonene-supplement/results/table_s7_audit.tsv](../results/table_s7_audit.tsv).

Table S7 does not include per-gene adjusted p values or replicate-level measurements, so its reported candidate significance cannot be independently audited from this workbook. (claim C04; [2](https://public-pages-files-2025.frontiersin.org/articles/527643/file/Data_Sheet_1.xlsx/527643_supplementary-materials_datasheets_1_xlsx/1)) Artifacts: [research/penicillium-limonene-supplement/results/analysis_summary.json](../results/analysis_summary.json).

## Results

The publisher workbook Table S7 has 58 unique nonblank gene rows. In the time-matched expression columns, 31 are higher and 27 lower after limonene exposure. (claim C02; [2](https://public-pages-files-2025.frontiersin.org/articles/527643/file/Data_Sheet_1.xlsx/527643_supplementary-materials_datasheets_1_xlsx/1)) Artifacts: [research/penicillium-limonene-supplement/results/analysis_summary.json](../results/analysis_summary.json), [research/penicillium-limonene-supplement/results/table_s7_audit.tsv](../results/table_s7_audit.tsv). **Limitation:** These are directions in author-provided expression values, not independently estimated differential-expression calls.

Only 10 of the 58 rows have an explicit P450 or CYP label in either the supplied NR or KEGG annotation text (8 in NR, 6 in KEGG, with overlap). (claim C03; [2](https://public-pages-files-2025.frontiersin.org/articles/527643/file/Data_Sheet_1.xlsx/527643_supplementary-materials_datasheets_1_xlsx/1)) Artifacts: [research/penicillium-limonene-supplement/results/analysis_summary.json](../results/analysis_summary.json), [research/penicillium-limonene-supplement/results/table_s7_audit.tsv](../results/table_s7_audit.tsv). **Limitation:** A text match neither proves P450 function for labeled genes nor excludes it for unlabeled genes; the table cannot identify a binding target.

Table S7 does not include per-gene adjusted p values or replicate-level measurements, so its reported candidate significance cannot be independently audited from this workbook. (claim C04; [2](https://public-pages-files-2025.frontiersin.org/articles/527643/file/Data_Sheet_1.xlsx/527643_supplementary-materials_datasheets_1_xlsx/1)) Artifacts: [research/penicillium-limonene-supplement/results/analysis_summary.json](../results/analysis_summary.json). **Limitation:** The paper describes a count-based differential-expression method, but the necessary per-gene statistics are absent from this supplementary table.

## Interpretation

Only 10 of the 58 rows have an explicit P450 or CYP label in either the supplied NR or KEGG annotation text (8 in NR, 6 in KEGG, with overlap). (claim C03; [2](https://public-pages-files-2025.frontiersin.org/articles/527643/file/Data_Sheet_1.xlsx/527643_supplementary-materials_datasheets_1_xlsx/1)) Artifacts: [research/penicillium-limonene-supplement/results/analysis_summary.json](../results/analysis_summary.json), [research/penicillium-limonene-supplement/results/table_s7_audit.tsv](../results/table_s7_audit.tsv). **Limitation:** A text match neither proves P450 function for labeled genes nor excludes it for unlabeled genes; the table cannot identify a binding target.

The article reports 4,148 DEGs for the limonene-treated versus untreated 12-hour comparison and discusses candidate P450 involvement in limonene biotransformation. (claim C05; [1](https://www.frontiersin.org/journals/microbiology/articles/10.3389/fmicb.2020.00744/full)) **Limitation:** The count is author reported; this notebook does not reproduce it from raw reads or establish a causal enzyme.

## Limitations

**Claim C04:** Table S7 does not include per-gene adjusted p values or replicate-level measurements, so its reported candidate significance cannot be independently audited from this workbook. **Limitation:** The paper describes a count-based differential-expression method, but the necessary per-gene statistics are absent from this supplementary table. ([2](https://public-pages-files-2025.frontiersin.org/articles/527643/file/Data_Sheet_1.xlsx/527643_supplementary-materials_datasheets_1_xlsx/1))

## Next research steps

**Proposed:** Reprocess PRJNA608617 raw reads with pinned reference and gene annotation, inspect biological replicates and batch, and fit a count-based model for the time-matched contrast. (claim C06; [3](https://www.ebi.ac.uk/ena/browser/view/PRJNA608617), [1](https://www.frontiersin.org/journals/microbiology/articles/10.3389/fmicb.2020.00744/full))

**Proposed:** Investigate candidate enzymes through sequence/domain annotation and chemical-genetic or biochemical assays, then compare compatible pathway responses across independently processed terpene cohorts with explicit organism, dose, time, and chemical identity. (claim C07; [1](https://www.frontiersin.org/journals/microbiology/articles/10.3389/fmicb.2020.00744/full), [3](https://www.ebi.ac.uk/ena/browser/view/PRJNA608617))

## Data and code availability

The source specification is `research/penicillium-limonene-supplement/report-spec.json` (SHA-256 `5ed1a1d16832dd325fd25b88d47b7861254f0dd1825f2fab32b5603dcdfc5d3c`). The claim ledger and generation receipt accompany this report. File hashes identify the report files and cited result artifacts. 1 externally sourced input file has a source URL and hash listed below. The [notebook execution receipt](../../execution-receipts/terputer-penicillium-limonene-supplement.json) matches the saved notebook and records hashes for result files written during its fresh-kernel run. It also pins 1 declared local input file by SHA-256. It records the Python version and installed package versions. Notebook execution does not independently validate scientific interpretation.

### External data files

The following download locations and file hashes match inputs pinned by the notebook execution receipt. The generator does not download these files or verify that the URLs remain live.

| Input | Download | SHA-256 |
| --- | --- | --- |
| `research/penicillium-limonene-supplement/data/Data_Sheet_1.xlsx` | [Source file](https://public-pages-files-2025.frontiersin.org/articles/527643/file/Data_Sheet_1.xlsx/527643_supplementary-materials_datasheets_1_xlsx/1) | `85fac5c96d733d35402a67f1f3af7ac364f4528c8ed37cd1292bc21da0639700` |

## References

[1] Zhang et al., R-(+)-limonene biotransformation by Penicillium digitatum (2020). https://www.frontiersin.org/journals/microbiology/articles/10.3389/fmicb.2020.00744/full
[2] Publisher Data Sheet 1, including Table S7. https://public-pages-files-2025.frontiersin.org/articles/527643/file/Data_Sheet_1.xlsx/527643_supplementary-materials_datasheets_1_xlsx/1
[3] ENA PRJNA608617 raw-read study. https://www.ebi.ac.uk/ena/browser/view/PRJNA608617
