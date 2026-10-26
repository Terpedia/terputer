# Terpinen-4-ol exposure in MRSA: an executed processed-expression audit

> Generated evidence brief. Each statement is linked to a claim record; scientific interpretation still requires review.

**Research question:** Which metabolic and signaling responses to terpene exposure are reproducible, and which depend on cellular context or a specific target?

**Notebook:** `notebooks/terputer-mrsa-terpinen4ol-fpkm.ipynb` · SHA-256 `2547c772e605495a6ad4c01127d0c2e3c13d72d17d8ada8a808ca15d9f004618` · 1 executed code cells

## Abstract

The pinned GEO FPKM matrix contains 2,925 unique nonnegative feature rows; 2,456 have mean control FPKM at least 1 and enter the descriptive ratio analysis. (claim C02; [2](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/suppl/GSE157638_fpkm.txt.gz), [3](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/matrix/GSE157638_series_matrix.txt.gz))

Across all 2,925 features, median pairwise Pearson correlations of log1p(FPKM) are 0.963 within controls, 0.953 within treated samples, and 0.936 between arms. (claim C03; [2](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/suppl/GSE157638_fpkm.txt.gz), [3](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/matrix/GSE157638_series_matrix.txt.gz))

Among the 2,456 control-expressed features, group-mean FPKM ratios with a 0.1 pseudocount place 248 at least twofold higher and 518 at least twofold lower after exposure. With a 1.0 pseudocount, the corresponding counts are 243 and 480. (claim C04; [2](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/suppl/GSE157638_fpkm.txt.gz), [3](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/matrix/GSE157638_series_matrix.txt.gz))

## Background

GSE157638 samples MRSA ATCC43300 in three untreated and three terpinen-4-ol RNA-seq libraries. The source article reports a 0.08% v/v, two-hour exposure at half the minimum inhibitory concentration. (claim C01; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE157638), [3](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/matrix/GSE157638_series_matrix.txt.gz), [4](https://link.springer.com/article/10.1186/s12866-021-02348-2))

The article reports 304 differentially expressed genes and interprets purine and pyrimidine metabolism as affected by terpinen-4-ol in MRSA. (claim C05; [4](https://link.springer.com/article/10.1186/s12866-021-02348-2), [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE157638))

## Methods

The pinned GEO FPKM matrix contains 2,925 unique nonnegative feature rows; 2,456 have mean control FPKM at least 1 and enter the descriptive ratio analysis. (claim C02; [2](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/suppl/GSE157638_fpkm.txt.gz), [3](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/matrix/GSE157638_series_matrix.txt.gz)) Artifacts: [research/mrsa-terpinen4ol-fpkm/results/analysis_summary.json](../results/analysis_summary.json), [research/mrsa-terpinen4ol-fpkm/results/sample_qc.tsv](../results/sample_qc.tsv).

Across all 2,925 features, median pairwise Pearson correlations of log1p(FPKM) are 0.963 within controls, 0.953 within treated samples, and 0.936 between arms. (claim C03; [2](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/suppl/GSE157638_fpkm.txt.gz), [3](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/matrix/GSE157638_series_matrix.txt.gz)) Artifacts: [research/mrsa-terpinen4ol-fpkm/results/analysis_summary.json](../results/analysis_summary.json), [research/mrsa-terpinen4ol-fpkm/results/sample_correlations.tsv](../results/sample_correlations.tsv).

Among the 2,456 control-expressed features, group-mean FPKM ratios with a 0.1 pseudocount place 248 at least twofold higher and 518 at least twofold lower after exposure. With a 1.0 pseudocount, the corresponding counts are 243 and 480. (claim C04; [2](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/suppl/GSE157638_fpkm.txt.gz), [3](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/matrix/GSE157638_series_matrix.txt.gz)) Artifacts: [research/mrsa-terpinen4ol-fpkm/results/analysis_summary.json](../results/analysis_summary.json), [research/mrsa-terpinen4ol-fpkm/results/descriptive_effects.tsv](../results/descriptive_effects.tsv).

## Results

The pinned GEO FPKM matrix contains 2,925 unique nonnegative feature rows; 2,456 have mean control FPKM at least 1 and enter the descriptive ratio analysis. (claim C02; [2](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/suppl/GSE157638_fpkm.txt.gz), [3](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/matrix/GSE157638_series_matrix.txt.gz)) Artifacts: [research/mrsa-terpinen4ol-fpkm/results/analysis_summary.json](../results/analysis_summary.json), [research/mrsa-terpinen4ol-fpkm/results/sample_qc.tsv](../results/sample_qc.tsv). **Limitation:** Processed FPKM does not supply the integer counts needed for new differential-expression inference.

Across all 2,925 features, median pairwise Pearson correlations of log1p(FPKM) are 0.963 within controls, 0.953 within treated samples, and 0.936 between arms. (claim C03; [2](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/suppl/GSE157638_fpkm.txt.gz), [3](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/matrix/GSE157638_series_matrix.txt.gz)) Artifacts: [research/mrsa-terpinen4ol-fpkm/results/analysis_summary.json](../results/analysis_summary.json), [research/mrsa-terpinen4ol-fpkm/results/sample_correlations.tsv](../results/sample_correlations.tsv). **Limitation:** High correlations can coexist with treatment effects and technical variation; these are sample descriptions, not significance tests.

Among the 2,456 control-expressed features, group-mean FPKM ratios with a 0.1 pseudocount place 248 at least twofold higher and 518 at least twofold lower after exposure. With a 1.0 pseudocount, the corresponding counts are 243 and 480. (claim C04; [2](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/suppl/GSE157638_fpkm.txt.gz), [3](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/matrix/GSE157638_series_matrix.txt.gz)) Artifacts: [research/mrsa-terpinen4ol-fpkm/results/analysis_summary.json](../results/analysis_summary.json), [research/mrsa-terpinen4ol-fpkm/results/descriptive_effects.tsv](../results/descriptive_effects.tsv). **Limitation:** These pseudocount-sensitive thresholds are not DEG counts, adjusted-p-value calls, or pathway estimates.

## Interpretation

Among the 2,456 control-expressed features, group-mean FPKM ratios with a 0.1 pseudocount place 248 at least twofold higher and 518 at least twofold lower after exposure. With a 1.0 pseudocount, the corresponding counts are 243 and 480. (claim C04; [2](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/suppl/GSE157638_fpkm.txt.gz), [3](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/matrix/GSE157638_series_matrix.txt.gz)) Artifacts: [research/mrsa-terpinen4ol-fpkm/results/analysis_summary.json](../results/analysis_summary.json), [research/mrsa-terpinen4ol-fpkm/results/descriptive_effects.tsv](../results/descriptive_effects.tsv). **Limitation:** These pseudocount-sensitive thresholds are not DEG counts, adjusted-p-value calls, or pathway estimates.

The article reports 304 differentially expressed genes and interprets purine and pyrimidine metabolism as affected by terpinen-4-ol in MRSA. (claim C05; [4](https://link.springer.com/article/10.1186/s12866-021-02348-2), [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE157638)) **Limitation:** This notebook does not reproduce the author's count model, gene annotations, pathway test, or metabolomics analysis.

## Limitations

**Claim C02:** The pinned GEO FPKM matrix contains 2,925 unique nonnegative feature rows; 2,456 have mean control FPKM at least 1 and enter the descriptive ratio analysis. **Limitation:** Processed FPKM does not supply the integer counts needed for new differential-expression inference. ([2](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/suppl/GSE157638_fpkm.txt.gz), [3](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/matrix/GSE157638_series_matrix.txt.gz))

**Claim C04:** Among the 2,456 control-expressed features, group-mean FPKM ratios with a 0.1 pseudocount place 248 at least twofold higher and 518 at least twofold lower after exposure. With a 1.0 pseudocount, the corresponding counts are 243 and 480. **Limitation:** These pseudocount-sensitive thresholds are not DEG counts, adjusted-p-value calls, or pathway estimates. ([2](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/suppl/GSE157638_fpkm.txt.gz), [3](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/matrix/GSE157638_series_matrix.txt.gz))

## Next research steps

**Proposed:** Reprocess the GSE157638 raw reads against a pinned MRSA reference to obtain integer counts, model the three biological replicates per arm, and audit pathway mappings with adjusted uncertainty. (claim C06; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE157638), [4](https://link.springer.com/article/10.1186/s12866-021-02348-2))

**Proposed:** Compare the MRSA terpinen-4-ol contrast with the GSE138291 Botrytis terpinen-4-ol arm only after independent count-based analyses, versioned orthology or pathway mapping, and explicit tests of between-study heterogeneity. (claim C07; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE157638), [5](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE138291))

## Data and code availability

The source specification is `research/mrsa-terpinen4ol-fpkm/report-spec.json` (SHA-256 `aa8cce2923304cbda0dc3debe43bcaa4d8cc70642133afe138077592e187be7f`). The claim ledger and generation receipt accompany this report. File hashes identify the report files and cited result artifacts. 2 externally sourced input files have a source URL and hash listed below. The [notebook execution receipt](../../execution-receipts/terputer-mrsa-terpinen4ol-fpkm.json) matches the saved notebook and records hashes for result files written during its fresh-kernel run. It also pins 3 declared local input files by SHA-256. It records the Python version and installed package versions. Notebook execution does not independently validate scientific interpretation.

### External data files

The following download locations and file hashes match inputs pinned by the notebook execution receipt. The generator does not download these files or verify that the URLs remain live.

| Input | Download | SHA-256 |
| --- | --- | --- |
| `research/mrsa-terpinen4ol-fpkm/data/GSE157638_fpkm.txt.gz` | [Source file](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/suppl/GSE157638_fpkm.txt.gz) | `e5a14d372c14398cf10d6831f6b8145157375c19cae1864004f39634e7d589fa` |
| `research/mrsa-terpinen4ol-fpkm/data/GSE157638_series_matrix.txt.gz` | [Source file](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/matrix/GSE157638_series_matrix.txt.gz) | `b711a75f71d429452c2f1bc7afd5b22eaaffacf2ac077b92f81f620c40275473` |

## References

[1] GEO GSE157638 sample metadata and processed FPKM. https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE157638
[2] GEO GSE157638 FPKM supplementary matrix. https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/suppl/GSE157638_fpkm.txt.gz
[3] GEO GSE157638 series matrix sample mapping. https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/matrix/GSE157638_series_matrix.txt.gz
[4] Cheng et al., MRSA exposed to terpinen-4-ol (2021). https://link.springer.com/article/10.1186/s12866-021-02348-2
[5] GEO GSE138291 fungal terpinen-4-ol and 1,8-cineole study. https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE138291
