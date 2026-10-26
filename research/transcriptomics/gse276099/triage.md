# GSE276099: β-caryophyllene exposure in HepG2

**Archive inspection and processed-matrix audit: 26 October 2026.** The [executed standalone project](https://github.com/Terpedia/terpedia-hepg2-bcp-rsem) provides a notebook, claim-linked report, result tables, and hash receipts. This is bulk RNA-seq from a human hepatocellular carcinoma cell line, not single-cell or genetic Perturb-seq. It adds a mammalian signaling context to the microbial terpene studies without implying cross-organism pathway replication.

## Design and provenance

The [GEO series](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE276099) lists three vehicle libraries, GSM8491080–GSM8491082 (C1–C3), and three β-caryophyllene libraries, GSM8491083–GSM8491085 (T1–T3), all HepG2. Each [sample record](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSM8491080) states a 24-hour exposure protocol of 150 µM β-caryophyllene or ethanol. The individual `treatment` fields vary as 150, 151, and 152 µM in replicate order for both arms. That discrepancy needs author or archive clarification before reporting an exact per-replicate dose. The matrix column names map C1–C3 and T1–T3 to those six sample descriptions.

The [source article](https://doi.org/10.3389/fphar.2024.1492670) reports 433 protein-coding differentially expressed genes and a PGF/MAPK-related response, plus a PGF overexpression experiment. Those are **author-reported findings**, not results reproduced by this triage. A change in PGF expression or rescue after overexpression does not establish direct β-caryophyllene binding to PGF.

## Downloaded matrix audit

The archived [GSE276099_readCounts.csv.gz](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE276nnn/GSE276099/suppl/GSE276099_readCounts.csv.gz) is saved alongside this record with SHA-256 `0b9c79088d962c49b0bbd3832a98646daba23985c51f4153cc4f938151c98aeb`. The six numeric columns are `read_count_C1`, `read_count_C2`, `read_count_C3`, `read_count_T1`, `read_count_T2`, and `read_count_T3`.

CSV inspection found 17,054 rows. Of these, 17,034 have numeric `gene_id` values and complete six-column nonnegative data; the remaining 20 have long gene-set-like text identifiers and blank values in all six sample columns (120 blank cells). Across the six columns, 75,830 numeric entries are fractional. The GEO sample processing record says RSEM v1.3.1 calculated expression levels, consistent with expected-count style estimates, even though the supplementary description calls the file “raw counts.” Treat the deposited values as **processed, fractional counts** pending confirmation; do not silently coerce them to integer sequencing counts or claim a raw-count differential-expression replication.

## Executed descriptive audit

The notebook retains 17,034 numeric-gene rows and reports 75,830 fractional entries. Median pairwise Pearson correlations of log1p(CPM) are 0.994 within controls, 0.998 within treated libraries, and 0.994 between arms. Among 12,321 rows with mean CPM at least 1 in either arm, 74 have a group-mean ratio at least twofold higher and 146 at least twofold lower with a 0.1 CPM pseudocount; the counts fall to 34 and 79 with a 1.0 pseudocount. PGF mean CPM is 1.924 in vehicle and 0.760 after exposure (descriptive log2 ratio −1.235 with pseudocount 0.1). These are **not** DEG, pathway-activity, or binding estimates. See the [report](https://github.com/Terpedia/terpedia-hepg2-bcp-rsem/blob/main/research/hepg2-bcp-rsem/generated/white-paper.md) and [execution receipt](https://github.com/Terpedia/terpedia-hepg2-bcp-rsem/blob/main/research/execution-receipts/terputer-hepg2-bcp-rsem.json).

## Next analysis gate

1. Resolve the 150/151/152 µM sample-field discrepancy and determine whether RSEM expected counts and the original read files support a defensible inferential model. Keep any modeled results separate from the source article's 433-DEG claim.
2. Compare signaling at the **within-study** level before any cross-study synthesis. A HepG2 β-caryophyllene response cannot validate a microbial terpinen-4-ol mechanism, and this bulk assay cannot answer a single-cell context question.
