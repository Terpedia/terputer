# Critical review of white paper v0.4

26 October 2026. This is an author-side scientific audit, not independent peer review. The [claim-to-source ledger](claim-ledger.md) identifies the source and calculation behind the paper's major quantitative claims.

## Editorial verdict

The revised paper is credible as **background on perturbational transcriptomics, experimental design, and evidence grading** for the [Codebreaker Labs computational biologist role](https://codebreakerlabs.io/careers/computational-biologist). It now includes two executed terpene-exposure analyses and a bounded processed Perturb-seq comparison. It still does not establish a reproducible terpene pathway, a terpene target, a donor-aware single-cell effect, or a variant-level HDR result. The role mapping in the paper makes that distinction explicit. It should be presented as a methods case study and research proposal, not as a completed mechanistic discovery or evidence of hands-on analysis of Codebreaker's principal assay.

## Major findings, ranked by consequence

| Priority | Finding | Consequence | Required next step |
|---|---|---|---|
| 1 | **The central cross-study reproducibility question remains untested.** GSE136998 and GSE138291 differ in organism and compound; PRJNA913446 and PRJNA608617 remain sample-metadata selections. | The paper can describe within-study patterns but cannot name a replicated metabolic or signaling program. | Quantify independent, exact-compound contrasts from counts or reads; map genes and pathways with versioned organism-specific annotation; estimate effect direction, uncertainty, and heterogeneity. |
| 2 | **The strongest fungal similarity statistic uses a shared control.** Both GSE138291 log2-ratio vectors subtract the same untreated mean. | Spearman 0.433 and 64.8% sign agreement may partly reflect denominator covariance. Pseudocount and leave-one-control-out screens do not remove it. | Fit a model for treatment-arm contrasts with their covariance, or use independent control replicates; report the contrast between the two treated arms directly. |
| 3 | **The exposure analysis uses processed FPKM and unresolved feature annotation.** The linalool matrix has opaque `geneN`/`rnaN` identifiers; the fungal matrix is also processed abundance. | Neither analysis supports formal differential-expression, FDR, or a named pathway. A large feature count does not substitute for biological replication. | Freeze references and raw-read/count provenance, verify sample independence, and use count-aware, replicate-aware inference before enrichment. |
| 4 | **The A549 Perturb-seq example has only two shared targets and small effects.** BATF2 and PARP12 correlations across selected features are 0.069 and 0.038. | Near-zero concordance can reflect measurement noise, filtering, or limited overlapping perturbations; it is not a formal context interaction. | Add broader common perturbations, signal-strength sensitivity, and independent replicate information; analyze raw cells and guide calls if available. |
| 5 | **The portfolio bridge to pooled HDR is conceptual.** No installed-variant data, donor-aware effects, raw-cell QC, guide assignment, or model evaluation are in the notebooks. | The paper supports scientific judgment and design literacy, but cannot be used as proof of hands-on variant Perturb-seq capability. | Add a public primary-cell or variant-resolved dataset and execute an end-to-end assay-matched analysis, keeping edit identity and uncertainty explicit. |
| 6 | **Publication sources are split across repositories.** The paper, original notebooks, and newer Terputer notebook have separate Git histories. | Citations can drift if a mutable branch is used. | Keep commit-pinned links, hashes, and a publication manifest; update the ledger whenever a result changes. |
| 7 | **Computational dependencies are not locked.** Source hashes and commit-pinned results are available, but `requirements.txt` does not fix package versions. | A fresh environment can render or calculate differently. | Save the versions used for the executed notebooks and provide a lockfile or container digest before promising exact reruns. |

## Changes made in v0.4

- The title now frames the work as testing rather than resolving reproducibility, and a status table answers each part of the research question using the available evidence.
- The fungal section names the missing sign-frequency baseline and direct treated-versus-treated contrast without reporting them as completed analyses.
- The replication section gives prospective study, effect, uncertainty, and interaction decision rules; numerical thresholds remain to be registered for the actual assay.
- The implementation plan prioritizes a linalool cross-study comparison and explicitly calls for a frozen software environment.

## Claim assessment

| Claim | Assessment |
|---|---|
| A processed bacterial linalool matrix contains 2,976 features and the reported direction counts | Supported as a reproducible descriptive calculation. Biological interpretation is blocked by FPKM and unresolved identifiers. |
| Two pure-compound fungal response vectors are partly aligned within GSE138291 | Supported as a descriptive calculation. Shared controls and lack of count-level uncertainty preclude a replication or mechanism claim. |
| A metabolic or signaling response reproduces across terpene exposures | Unsupported by the analyzed contrasts. |
| Terpene response depends on a specific molecular target | Untested. Genetic signatures can nominate experiments, but do not establish binding or dependency. |
| A549 IFN-β/IFN-γ genetic signatures have low concordance for BATF2 and PARP12 | Supported for the processed, filtered summaries only; it is not a replicate-aware interaction estimate. |
| The project demonstrates pooled HDR variant Perturb-seq analysis | Unsupported. The variant section is a design and evaluation proposal. |
| Terputer exposes curated transcriptomics metadata through remote MCP and BigQuery | The live service was verified for study/sample lookups. It serves curated metadata, not differential-expression results. |

## Publication decision

Publish v0.4 as a **working, critically audited white paper** with the executed notebooks and this review linked beside it. Before using it as a scientific result, complete raw-count reanalysis, annotation, independent cross-study comparison, and external scientific review. For a job application, describe the implemented notebooks and data infrastructure as demonstrated work; describe variant-level HDR analysis and predictive modeling as proposed extensions.
