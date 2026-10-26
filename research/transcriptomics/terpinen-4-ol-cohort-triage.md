# Terpinen-4-ol cohort triage

**Source check: 26 October 2026.** This is a selection record, not a new expression analysis. Exact compound identity, organism, exposure, controls, and assay are kept separate.

| Priority | Accession | Design established from source | Data available | Decision |
| --- | --- | --- | --- | --- |
| Processed audit complete; raw counts next | [GSE157638](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE157638) / PRJNA662311 | *Staphylococcus aureus* ATCC43300, three control and three terpinen-4-ol RNA-seq libraries. The [paper](https://link.springer.com/article/10.1186/s12866-021-02348-2) states 0.08% v/v (half MIC), two-hour exposure. | [Publisher FPKM matrix](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/suppl/GSE157638_fpkm.txt.gz) and archived sequencing reads. The [GEO series matrix](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE157nnn/GSE157638/matrix/GSE157638_series_matrix.txt.gz) maps S_1–S_3 to control and S_4–S_6 to exposure. | The [executed processed-expression project](https://github.com/Terpedia/terpedia-mrsa-terpinen4ol-fpkm) checks the six-library matrix and reports descriptive patterns. A separate raw-count model remains necessary for adjusted-p-value or pathway-replication claims. |
| Hold for control provenance | [PRJNA729806](https://www.ncbi.nlm.nih.gov/bioproject/PRJNA729806) | *Tribolium castaneum* terpinen-4-ol exposure. The [SRA study record](https://www.ncbi.nlm.nih.gov/sra/SRX10876919) describes RNA-seq and reports that RNAi of CYP9Z6/GSTs7 increased mortality under exposure. | The [ENA run listing](https://www.ebi.ac.uk/ena/browser/view/PRJNA729806) currently exposes three RNA-seq runs, all titled terpinen-4-ol exposure. | Do not construct a treated-versus-control RNA-seq contrast until the controls and their source accessions are identified. The reported RNAi result is a phenotype from the authors, not proof of direct binding or a Terputer-reanalyzed target interaction. |

## Why these cohorts matter

GSE157638 adds another exact terpinen-4-ol exposure to compare with the existing *Botrytis cinerea* GSE138291 arm. Their organisms, time points, media, dose scales, and transcript annotations differ. A cross-species comparison requires independently estimated within-study effects and a versioned orthology or pathway mapping; similar named pathways in two papers would remain insufficient.

PRJNA729806 is relevant to the target-dependence question because its archived abstract describes an RNAi susceptibility result. The three currently exposed sequence runs alone do not permit a new exposure contrast, and the phenotype does not distinguish detoxification, tolerance, and a direct molecular target. The next source task is to locate the matched control reads and the original phenotype tables, then check dose, stage, and RNAi controls before including it in a target-interaction analysis.

## Planned Terputer work

1. Pin the GSE157638 FPKM file and GEO sample manifest by SHA-256, record source URLs and retrieval time, and create an executed Jupyter notebook with sample-level QC and descriptive treated/control ratios.
2. Retrieve the raw GSE157638 runs and reference annotation, estimate integer gene counts, and fit a model with biological replicates. Keep this inference separate from the FPKM audit.
3. Revisit GSE138291 with raw counts and compare the terpinen-4-ol arm against its own untreated controls. Report context heterogeneity only after mapping comparable features and checking uncertainty.
4. Trace PRJNA729806 control accessions and the RNAi phenotype design. If controls cannot be linked, retain it as a publisher-claim lead rather than a reanalyzed cohort.
