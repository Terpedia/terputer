# Linalool response in Fusarium: a published-table audit

> Generated evidence brief. Each statement is linked to a claim record; scientific interpretation still requires review.

**Research question:** Which metabolic and signaling responses to terpene exposure are reproducible, and which depend on cellular context or a specific target?

**Notebook:** `notebooks/terputer-fusarium-linalool-supplement.ipynb` · SHA-256 `9e0f86b769e73ce037a76958b6dc18d09786645300fc5819b1eb2f04bdff1060` · 4 executed code cells

## Abstract

The publisher's Table S4 contains 1,568 unique reported differential-expression genes, with 979 labeled up and 589 down; every row has adjusted p < 0.05 and absolute log2 fold change at least 1. (claim C02; [2](https://mdpi-res.com/d_attachment/ijms/ijms-24-00458/article_deploy/ijms-24-00458-s001.zip), [1](https://pmc.ncbi.nlm.nih.gov/articles/PMC9820380/))

At adjusted p < 0.05, three KEGG terms in the published RNA table and one in the protein table are significant; amino sugar and nucleotide sugar metabolism (00520) is the only term shared by both lists. (claim C03; [2](https://mdpi-res.com/d_attachment/ijms/ijms-24-00458/article_deploy/ijms-24-00458-s001.zip))

The supplement provides published DEG, protein, and enrichment tables, while PRJNA913446 holds the raw reads needed to repeat gene quantification and the count model. (claim C06; [2](https://mdpi-res.com/d_attachment/ijms/ijms-24-00458/article_deploy/ijms-24-00458-s001.zip), [3](https://www.ebi.ac.uk/ena/browser/view/PRJNA913446))

## Background

The source study compares three biological replicates of Fusarium oxysporum grown for six days with 0.8 mL/L linalool against three 0.1% Tween80 vehicle controls. (claim C01; [1](https://pmc.ncbi.nlm.nih.gov/articles/PMC9820380/), [3](https://www.ebi.ac.uk/ena/browser/view/PRJNA913446))

## Methods

The notebook checks the pinned supplement checksum, reads Tables S3, S4, S6, S8, and S10, audits S4 gene IDs and reported thresholds, joins significant KEGG terms by five-digit pathway ID at adjusted p < 0.05, and compares exact RNA/protein member identifiers. (claim C09; [2](https://mdpi-res.com/d_attachment/ijms/ijms-24-00458/article_deploy/ijms-24-00458-s001.zip)) Artifacts: [research/fusarium-linalool-supplement/results/analysis_summary.json](../results/analysis_summary.json).

## Results

The publisher's Table S4 contains 1,568 unique reported differential-expression genes, with 979 labeled up and 589 down; every row has adjusted p < 0.05 and absolute log2 fold change at least 1. (claim C02; [2](https://mdpi-res.com/d_attachment/ijms/ijms-24-00458/article_deploy/ijms-24-00458-s001.zip), [1](https://pmc.ncbi.nlm.nih.gov/articles/PMC9820380/)) Artifacts: [research/fusarium-linalool-supplement/results/analysis_summary.json](../results/analysis_summary.json). **Limitation:** This audits the authors' processed table; it does not independently re-estimate differential expression from raw counts.

At adjusted p < 0.05, three KEGG terms in the published RNA table and one in the protein table are significant; amino sugar and nucleotide sugar metabolism (00520) is the only term shared by both lists. (claim C03; [2](https://mdpi-res.com/d_attachment/ijms/ijms-24-00458/article_deploy/ijms-24-00458-s001.zip)) Artifacts: [research/fusarium-linalool-supplement/results/pathway_crossomics.tsv](../results/pathway_crossomics.tsv). **Limitation:** Both omics layers come from one study; pathway overlap is within-study support, not independent replication or direct target evidence.

The shared pathway member lists intersect at one exact gene/protein identifier, FOXG_03194 (hexokinase-1), reported down in both tables (RNA log2FC -1.57; protein log2FC -1.04). (claim C04; [2](https://mdpi-res.com/d_attachment/ijms/ijms-24-00458/article_deploy/ijms-24-00458-s001.zip)) Artifacts: [research/fusarium-linalool-supplement/results/gene_protein_overlap.tsv](../results/gene_protein_overlap.tsv). **Limitation:** One mapped molecule is too little to infer broad transcript-protein concordance or a causal target.

## Interpretation

At adjusted p < 0.05, three KEGG terms in the published RNA table and one in the protein table are significant; amino sugar and nucleotide sugar metabolism (00520) is the only term shared by both lists. (claim C03; [2](https://mdpi-res.com/d_attachment/ijms/ijms-24-00458/article_deploy/ijms-24-00458-s001.zip)) Artifacts: [research/fusarium-linalool-supplement/results/pathway_crossomics.tsv](../results/pathway_crossomics.tsv). **Limitation:** Both omics layers come from one study; pathway overlap is within-study support, not independent replication or direct target evidence.

The source paper separately reports fungal membrane damage and oxidative stress, and tomato salicylic-acid and jasmonic-acid response markers after linalool exposure. (claim C05; [1](https://pmc.ncbi.nlm.nih.gov/articles/PMC9820380/)) **Limitation:** These phenotype and host-marker assays are outside the audited fungal supplement tables and must not be conflated with fungal pathway enrichment.

## Limitations

**Claim C06:** The supplement provides published DEG, protein, and enrichment tables, while PRJNA913446 holds the raw reads needed to repeat gene quantification and the count model. **Limitation:** This notebook cannot assess alignment, sample-level count uncertainty, batch effects, or the original enrichment universe from the processed tables alone. ([2](https://mdpi-res.com/d_attachment/ijms/ijms-24-00458/article_deploy/ijms-24-00458-s001.zip), [3](https://www.ebi.ac.uk/ena/browser/view/PRJNA913446))

## Next research steps

**Proposed:** Reprocess the six PRJNA913446 libraries against a pinned Fusarium reference, quantify integer counts, audit sample assignment and batch, and re-fit a biological-replicate count model before using these gene calls for cross-study comparison. (claim C07; [3](https://www.ebi.ac.uk/ena/browser/view/PRJNA913446), [1](https://pmc.ncbi.nlm.nih.gov/articles/PMC9820380/))

**Proposed:** Compare linalool responses with another compatible exposure cohort at the pathway level only after chemical form, organism, time, dose, viability, controls, and orthology have been resolved; test a specific target with separate binding or chemical-genetic evidence. (claim C08; [1](https://pmc.ncbi.nlm.nih.gov/articles/PMC9820380/), [3](https://www.ebi.ac.uk/ena/browser/view/PRJNA913446))

## Data and code availability

The source specification is `research/fusarium-linalool-supplement/report-spec.json` (SHA-256 `4dd22c76b496538c73416038c45a0e386a7eefd3db4bc0ae1059aa3c9ef8d93e`). The claim ledger and generation receipt accompany this report. File hashes identify the report files and cited result artifacts. 1 externally sourced input file has a source URL and hash listed below. The [notebook execution receipt](../../execution-receipts/terputer-fusarium-linalool-supplement.json) matches the saved notebook and records hashes for result files written during its fresh-kernel run. It also pins 1 declared local input file by SHA-256. It records the Python version and installed package versions. Notebook execution does not independently validate scientific interpretation.

### External data files

The following download locations and file hashes match inputs pinned by the notebook execution receipt. The generator does not download these files or verify that the URLs remain live.

| Input | Download | SHA-256 |
| --- | --- | --- |
| `research/fusarium-linalool-supplement/data/ijms-24-00458-s001.zip` | [Source file](https://mdpi-res.com/d_attachment/ijms/ijms-24-00458/article_deploy/ijms-24-00458-s001.zip) | `64eb1c7cf6aeea6e54fab89ad9133914db6a0afdd28f1696242fa8fb5139b653` |

## References

[1] Li et al., linalool antifungal response in Fusarium oxysporum (2023). https://pmc.ncbi.nlm.nih.gov/articles/PMC9820380/
[2] Publisher supplementary data archive for the Fusarium linalool study. https://mdpi-res.com/d_attachment/ijms/ijms-24-00458/article_deploy/ijms-24-00458-s001.zip
[3] ENA PRJNA913446 raw-read study. https://www.ebi.ac.uk/ena/browser/view/PRJNA913446
