# Methods and interpretation

**Question.** What does a six-library terpinen-4-ol MRSA processed-expression matrix show, and what remains untested about reproducibility or target dependence?

**Source and design.** GEO [GSE157638](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE157638) supplies sample metadata, a six-column FPKM matrix, and raw-read accessions. The [paper](https://link.springer.com/article/10.1186/s12866-021-02348-2) states 0.08% v/v terpinen-4-ol for two hours. The notebook reads the archived GEO series matrix to map S_1–S_3 to untreated control and S_4–S_6 to exposed samples. Both downloads are pinned in `report-spec.json` and the execution receipt.

**Analysis.** `analysis.py` checks unique feature IDs and finite nonnegative FPKM values. It writes per-sample nonzero feature counts, median and sum FPKM; all 15 pairwise Pearson correlations on log1p(FPKM); and treated/control group-mean log2 ratios for features with mean control FPKM at least 1. Ratios are calculated with 0.1 and 1.0 FPKM pseudocounts to show sensitivity. No p values, false-discovery estimates, gene ontology, or pathway enrichment are computed.

**Result.** The matrix has 2,925 unique features; 2,456 pass the control-expression filter. Median within-control, within-treated, and between-arm correlations are 0.963, 0.953, and 0.936. With pseudocount 0.1, 248 filtered features have ratios at least +1 log2 and 518 at most −1 log2; with pseudocount 1.0, those counts are 243 and 480. These thresholds describe the processed matrix and should not be called DEGs.

**Evidence boundary.** The article's 304 DEG result and metabolic interpretation are author reported. This notebook has no raw-count model, reference-gene crosswalk, orthology map, or target-engagement measurement. GSE138291 includes a *Botrytis cinerea* terpinen-4-ol arm, but a comparison of named pathways across these organisms would require independent count models and a versioned mapping with uncertainty. The [claim-linked report](generated/white-paper.md) and [ledger](generated/claim-ledger.tsv) preserve those distinctions.
