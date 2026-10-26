# Mouse DRG paclitaxel label audit and descriptive TPM contrast

[GSE230454](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230454) provides four control female SW mouse dorsal-root-ganglion RNA-seq columns. [GSE230459](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE230459) provides four columns titled paclitaxel (`Pax`). The processed female TPM workbooks have 48,431 aligned feature rows. The [study article](https://pmc.ncbi.nlm.nih.gov/articles/PMC12353069/) describes paclitaxel dosing, but each GSE230459 sample treatment-protocol field says saline. The exposure assignment is therefore **provisional** until the submitter or raw metadata resolves that conflict.

## Reproduce

Install `requirements.txt`, then execute [the notebook](../../../notebooks/terputer-paclitaxel-drg.ipynb) or run `python research/transcriptomics/gse230454-459/analysis.py` from the repository root. The script downloads and checks the source workbook SHA-256 values, aligns gene identifiers, and writes the tables in `results/`. The input workbooks are ignored by Git.

| Source workbook | SHA-256 |
| --- | --- |
| `GSE230454_CON_RNASEQ_TPM.xlsx` | `f982c3e9066d2608e62e0527f1d6386fd76767ce446f677fa3012c05c4dd5f47` |
| `GSE230459_PAC_RNA_TPM.xlsx` | `f89bbdd95fda8eccd9d735bac7217e2acc6b83808b840af87f0e7dbeb8a1cbdb` |

## Result and scope

The [sample QC](results/sample_qc.tsv) confirms four TPM columns in each arm, each summing to one million. Among 14,119 features with control mean TPM at least one, 53.7% have positive and 46.3% negative log2(TPM + 1) ratios; the median ratio is +0.020. The [predeclared marker table](results/marker_descriptive.tsv) shows mixed directions in cell-cycle, interferon, cholesterol-synthesis, and injury-signaling panels. These summaries do not identify a coherent pathway, a drug target, or a reproducible response.

TPM is compositional and is not raw count data. This analysis makes no differential-expression p-values, pathway-enrichment calls, or animal-level causal claims. The four columns per arm are sample columns; independent biological replication is not established here. The [sample manifest](sample_manifest.tsv) preserves the conflicting protocol text.
