# Critical review of the Terputer transcriptomics white paper

**26 October 2026 · Author-side review of the published working methods note**

## Overall judgment

The draft is a credible **methods demonstration** with unusually clear caveats. It does not answer the stated biological question or yet demonstrate that Terputer chat can complete the workflow end to end. I would not publish the current results as a finding about reproducible terpene pathways or target-specific responses.

## Findings, in priority order

1. **Resolved high-severity defect — The summary artifact had mislabeled results.** The review found that `rows` was reused for PIE target comparisons and GSE138291 arm pairs, causing fungal records to appear under `perturbseq.records`. The notebook has since been corrected and rerun: the summary now contains two PIE target records and six separate fungal arm comparisons. Earlier copies of the summary should be discarded.
2. **High — The central question remains unanswered.** There is one analyzed bacterial linalool study and one analyzed fungal multi-arm study. They differ in organism, compound, time, and processed assay format; no ortholog or pathway mapping was performed. The two PRJNA cohorts are sample metadata only. There is no independent comparable contrast from which to estimate cross-study reproducibility or heterogeneity.
3. **High — The GSE138291 correlation can be inflated by the shared control.** The two reported log2 ratios subtract the same untreated mean feature by feature. This creates covariance even if treatment-specific effects differ. The leave-one-control-out exercise retains a shared control and does not remove this dependency. The 0.433 correlation and 64.8% sign agreement should be described only as properties of these derived vectors. A direct treated-arm comparison, replicate-level model, or independent-control analysis is needed.
4. **High — The notebook workflow and agent workflow remain distinct.** The notebook was executed with `nbclient` in the local Python environment, not through an observed Terputer chat tool call. The in-app research agent requires an OpenRouter key. The remote MCP and read-only BigQuery adapter have since been deployed and verified for metadata lookup; that operational fact does not demonstrate an end-to-end chat-driven analysis. The paper must distinguish implemented interfaces, executed notebook analysis, and live metadata services.
5. **Medium — The A549 comparison is weak evidence for context dependence.** Only BATF2 and PARP12 overlap in the selected published summaries. Low correlations across feature-level effect estimates can reflect noise, near-zero effects, gene filtering, or differences in uncertainty. No biological-replicate effect model or significance of context interaction was assessed. This example is useful for workflow design, but the results table should avoid the unqualified phrase “effects differ across these contexts.”
6. **Medium — The linalool interpretation is too broad.** Direction counts across nearly all FPKM features and the much higher treated sample medians may indicate a global measurement or normalization issue. Those counts are not a differential-expression result, and the unresolved `geneN` identifiers preclude metabolic or signaling interpretation. The source culture independence and metadata should be verified.
7. **Medium — Source and version tracking are incomplete.** The notebook verifies three input-file hashes, but its opening text says there are only two frozen inputs, while it later analyzes GSE138291 as a third. Its study-selection text says “three additional” cohorts although only two remain metadata-only. The GSE138291 SHA is embedded in a cell rather than a separate retrieval manifest. Package versions are not pinned for a clean rerun.
8. **Medium — BigQuery records need curation before load.** The prepared JSONL records have hand-written titles, plain-text chemical identities, no source revision for the GEO files, no immutable artifact URL, and three contrasts despite four analyzed GSE138291 arms. Four study records, 33 sample records, and two explicitly descriptive observations have been loaded; the contrast table remains empty pending this review. Loading the current contrast records would imply coverage and precision they do not yet have. The proposed schema also lacks feature-level evidence, biological replicate linkage, and analysis-run lineage.

## Claim assessment

| Claim | Current status |
| --- | --- |
| Terputer can preserve source provenance and run a notebook | Demonstrated locally; the summary-artifact defect was corrected and rerun. |
| Two pure compounds have partly aligned fungal response vectors | Descriptive within-study observation; shared-control dependency limits interpretation. |
| Linalool induces a specific metabolic or signaling program | Unsupported by the processed matrix analysis. |
| Terpene responses reproduce across contexts | Not tested. |
| Any response depends on a specific chemical target | Not tested; PIE genetic perturbations are not terpene exposure or binding data. |
| Terpedia BigQuery serves curated transcriptomics evidence | Study/sample metadata and two descriptive observations are loaded in BigQuery. The read adapter is deployed and verified for study/sample lookup; contrasts remain staged locally. |

## Publication recommendation

The notebook summary has been fixed and rerun. The [full biological white paper](https://terpedia.github.io/research/terpene-transcriptomics/) now includes a [claim-to-artifact ledger](https://terpedia.github.io/research/terpene-transcriptomics/claim-ledger.html) and the Codebreaker role mapping. This Terputer note can be published as a technical methods demonstration. A biological result about reproducible pathways still requires raw-count analysis of independent exposure cohorts with stable gene/pathway mappings and explicit uncertainty. A target-specific paper would additionally need chemical-genetic interaction or direct target-engagement evidence.
