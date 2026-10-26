# Terpene transcriptomics: a bounded evidence brief

> Generated evidence brief. Each statement is linked to a claim record; scientific interpretation still requires review.

**Research question:** Which metabolic and signaling responses to terpene exposure are reproducible, and which depend on cellular context or a specific target?

**Notebook:** `notebooks/terputer-transcriptomics.ipynb` · SHA-256 `75cbc8ddbcc81b8f3709149f11aa83b9394fef2bfb1bc4b297ead54abad1ff22` · 5 executed code cells

## Abstract

No analyzed result yet identifies a replicated metabolic or signaling pathway, a terpene-by-context interaction, or a specific target dependency. (claim C05; [4](https://github.com/Terpedia/terputer/blob/main/research/terpene-transcriptomics/manuscript/critical-review.md))

In the processed GSE138291 matrix, 1,8-cineole and terpinen-4-ol contrasts have Spearman correlation 0.433 and 64.8% sign agreement across 9,000 control-expressed features. (claim C03; [2](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE138291), [3](https://github.com/Terpedia/terpedia-transcriptomics-demo/blob/2681004/notebooks/terputer-transcriptomics.ipynb))

## Background

The selected public exposure studies differ in organism, compound, duration, and control design; comparable exact-compound replication has not yet been established in this project. (claim C01; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE136998), [2](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE138291), [4](https://github.com/Terpedia/terputer/blob/main/research/terpene-transcriptomics/manuscript/critical-review.md))

## Methods

The notebook computes treatment-to-control mean FPKM log2 ratios with a 0.1 pseudocount for the processed exposure matrices. (claim C02; [3](https://github.com/Terpedia/terpedia-transcriptomics-demo/blob/2681004/notebooks/terputer-transcriptomics.ipynb))

## Results

In the processed GSE138291 matrix, 1,8-cineole and terpinen-4-ol contrasts have Spearman correlation 0.433 and 64.8% sign agreement across 9,000 control-expressed features. (claim C03; [2](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE138291), [3](https://github.com/Terpedia/terpedia-transcriptomics-demo/blob/2681004/notebooks/terputer-transcriptomics.ipynb)) Artifacts: [research/transcriptomics/results/gse138291_arm_similarity.tsv](../results/gse138291_arm_similarity.tsv). **Limitation:** Both contrasts share untreated controls; the numbers are not independent replication or a pathway result.

The GSE136998 processed matrix contains 2,976 analyzed feature rows, with 1,955 positive, 1,011 negative, and 10 zero descriptive treatment-to-control ratios. (claim C04; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE136998), [3](https://github.com/Terpedia/terpedia-transcriptomics-demo/blob/2681004/notebooks/terputer-transcriptomics.ipynb)) Artifacts: [research/transcriptomics/results/gse136998_descriptive_effects.tsv](../results/gse136998_descriptive_effects.tsv). **Limitation:** Direction counts are not statistically significant gene calls; feature annotation remains incomplete.

## Interpretation

No analyzed result yet identifies a replicated metabolic or signaling pathway, a terpene-by-context interaction, or a specific target dependency. (claim C05; [4](https://github.com/Terpedia/terputer/blob/main/research/terpene-transcriptomics/manuscript/critical-review.md)) **Limitation:** This is a status assessment of the analyzed evidence, not proof that such effects do not exist.

## Limitations

**Claim C06:** The fungal arm similarity shares an untreated denominator, and processed FPKM lacks the replicate-level uncertainty required for inferential comparison. **Limitation:** The current sensitivity calculations do not remove shared-control covariance. ([2](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE138291), [3](https://github.com/Terpedia/terpedia-transcriptomics-demo/blob/2681004/notebooks/terputer-transcriptomics.ipynb), [4](https://github.com/Terpedia/terputer/blob/main/research/terpene-transcriptomics/manuscript/critical-review.md))

## Next research steps

**Proposed:** Reanalyze GSE138291 from raw counts with explicit shared-control covariance and compare the pure-compound arms directly. (claim C07; [2](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE138291), [4](https://github.com/Terpedia/terputer/blob/main/research/terpene-transcriptomics/manuscript/critical-review.md))

**Proposed:** Seek a compatible same-compound exposure experiment before testing cross-study replication; treat the bacterial and fungal linalool comparison as exploratory transfer. (claim C08; [1](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE136998), [4](https://github.com/Terpedia/terputer/blob/main/research/terpene-transcriptomics/manuscript/critical-review.md))

## Data and code availability

The source specification is `research/transcriptomics/report-spec.json` (SHA-256 `d773422f80ed8ebde6fb8f3317409d250d40f9d4a9806b0cb48f226d40fefe3d`). The claim ledger and generation receipt accompany this report. File hashes identify the report files and cited result artifacts; external data inputs require their own pinned URLs and checksums. The [notebook execution receipt](../../execution-receipts/terputer-transcriptomics.json) matches the saved notebook and records hashes for result files written during its fresh-kernel run. It also pins 5 declared local input files by SHA-256. It records the Python version and installed package versions. Notebook execution does not independently validate scientific interpretation.

## References

[1] GEO GSE136998 linalool exposure series. https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE136998
[2] GEO GSE138291 Botrytis cinerea terpene-component exposure series. https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE138291
[3] Executed Terputer transcriptomics notebook at pinned example commit 2681004. https://github.com/Terpedia/terpedia-transcriptomics-demo/blob/2681004/notebooks/terputer-transcriptomics.ipynb
[4] Terpedia transcriptomics paper v0.6 critical review snapshot. https://github.com/Terpedia/terputer/blob/main/research/terpene-transcriptomics/manuscript/critical-review.md
