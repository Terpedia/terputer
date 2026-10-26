---
pretty_name: PIE Jiang et al. signaling Perturb-seq (6 cell lines x 5 stimulations)
tags:
  - biology
  - single-cell
  - perturb-seq
  - crispr
  - differential-expression
size_categories:
  - 1M<n<10M
configs:
  - config_name: a549_ifnb
    data_files: de/a549_ifnb.parquet
  - config_name: a549_ifng
    data_files: de/a549_ifng.parquet
  - config_name: a549_ins
    data_files: de/a549_ins.parquet
  - config_name: a549_tgfb
    data_files: de/a549_tgfb.parquet
  - config_name: a549_tnfa
    data_files: de/a549_tnfa.parquet
  - config_name: bxpc3_ifnb
    data_files: de/bxpc3_ifnb.parquet
  - config_name: bxpc3_ifng
    data_files: de/bxpc3_ifng.parquet
  - config_name: bxpc3_ins
    data_files: de/bxpc3_ins.parquet
  - config_name: bxpc3_tgfb
    data_files: de/bxpc3_tgfb.parquet
  - config_name: bxpc3_tnfa
    data_files: de/bxpc3_tnfa.parquet
  - config_name: hap1_ifnb
    data_files: de/hap1_ifnb.parquet
  - config_name: hap1_ifng
    data_files: de/hap1_ifng.parquet
  - config_name: hap1_ins
    data_files: de/hap1_ins.parquet
  - config_name: hap1_tgfb
    data_files: de/hap1_tgfb.parquet
  - config_name: hap1_tnfa
    data_files: de/hap1_tnfa.parquet
  - config_name: ht29_ifnb
    data_files: de/ht29_ifnb.parquet
  - config_name: ht29_ifng
    data_files: de/ht29_ifng.parquet
  - config_name: ht29_ins
    data_files: de/ht29_ins.parquet
  - config_name: ht29_tgfb
    data_files: de/ht29_tgfb.parquet
  - config_name: ht29_tnfa
    data_files: de/ht29_tnfa.parquet
  - config_name: k562_ifnb
    data_files: de/k562_ifnb.parquet
  - config_name: k562_ifng
    data_files: de/k562_ifng.parquet
  - config_name: k562_ins
    data_files: de/k562_ins.parquet
  - config_name: k562_tgfb
    data_files: de/k562_tgfb.parquet
  - config_name: k562_tnfa
    data_files: de/k562_tnfa.parquet
  - config_name: mcf7_ifnb
    data_files: de/mcf7_ifnb.parquet
  - config_name: mcf7_ifng
    data_files: de/mcf7_ifng.parquet
  - config_name: mcf7_ins
    data_files: de/mcf7_ins.parquet
  - config_name: mcf7_tgfb
    data_files: de/mcf7_tgfb.parquet
  - config_name: mcf7_tnfa
    data_files: de/mcf7_tnfa.parquet
---

# PIE: Jiang et al. signaling Perturb-seq

Differential-expression (DE) tables and the preprocessed dir for
[PIE](https://github.com/ArcInstitute/pie), built from the Perturb-seq screens of signaling
regulators by Jiang et al. (2025) in 6 cell lines, each stimulated with 5 ligands. This dataset is a
training dataset of the PIE `replogle_xdataset` experiment.

Datasets and knowledge sources: [PIE collection](https://huggingface.co/collections/arcinstitute/pie-6abc354d475081a4a7cb4492)

## Contents

```
de/<cell_line>_<stimulation>.parquet   per-context DE, one row per (perturbation, gene)
preprocessed/                          PIE preprocessed dir, with the context map contexts.yaml
```

Each PIE context is a (cell line, stimulation) pair: 30 contexts, 516,897 cells and 5,562,223 DE
rows in total. Controls are the `non-targeting` cells of each context.

| Context | Cell line | Cellosaurus | Stimulation | Cells | Control cells | Perturbed genes | DE rows |
|---------|-----------|-------------|-------------|-------|---------------|-----------------|---------|
| `a549_ifnb` | A549 | CVCL_0023 | IFN-beta | 8,134 | 1,379 | 15 | 185,185 |
| `a549_ifng` | A549 | CVCL_0023 | IFN-gamma | 6,620 | 1,018 | 14 | 173,859 |
| `a549_ins` | A549 | CVCL_0023 | Insulin | 2,393 | 2,172 | 1 | 12,261 |
| `a549_tgfb` | A549 | CVCL_0023 | TGF-beta | 15,855 | 2,564 | 11 | 132,006 |
| `a549_tnfa` | A549 | CVCL_0023 | TNF-alpha | 18,857 | 2,501 | 17 | 204,370 |
| `bxpc3_ifnb` | BxPC-3 | CVCL_0186 | IFN-beta | 35,050 | 3,228 | 27 | 333,749 |
| `bxpc3_ifng` | BxPC-3 | CVCL_0186 | IFN-gamma | 24,595 | 4,748 | 20 | 248,630 |
| `bxpc3_ins` | BxPC-3 | CVCL_0186 | Insulin | 28,195 | 5,972 | 11 | 132,585 |
| `bxpc3_tgfb` | BxPC-3 | CVCL_0186 | TGF-beta | 5,485 | 702 | 16 | 196,082 |
| `bxpc3_tnfa` | BxPC-3 | CVCL_0186 | TNF-alpha | 21,771 | 3,442 | 22 | 260,986 |
| `hap1_ifnb` | HAP-1 | CVCL_Y019 | IFN-beta | 42,000 | 3,172 | 39 | 480,138 |
| `hap1_ifng` | HAP-1 | CVCL_Y019 | IFN-gamma | 10,414 | 1,061 | 28 | 348,940 |
| `hap1_ins` | HAP-1 | CVCL_Y019 | Insulin | 27,099 | 5,886 | 11 | 132,503 |
| `hap1_tgfb` | HAP-1 | CVCL_Y019 | TGF-beta | 16,749 | 2,450 | 10 | 125,106 |
| `hap1_tnfa` | HAP-1 | CVCL_Y019 | TNF-alpha | 35,699 | 3,215 | 31 | 381,325 |
| `ht29_ifnb` | HT-29 | CVCL_0320 | IFN-beta | 24,913 | 2,736 | 26 | 299,000 |
| `ht29_ifng` | HT-29 | CVCL_0320 | IFN-gamma | 12,888 | 3,023 | 16 | 182,098 |
| `ht29_ins` | HT-29 | CVCL_0320 | Insulin | 30,024 | 6,348 | 7 | 79,716 |
| `ht29_tgfb` | HT-29 | CVCL_0320 | TGF-beta | 9,112 | 2,620 | 9 | 106,201 |
| `ht29_tnfa` | HT-29 | CVCL_0320 | TNF-alpha | 34,675 | 5,296 | 17 | 193,468 |
| `k562_ifnb` | K-562 | CVCL_0004 | IFN-beta | 12,975 | 1,398 | 27 | 329,926 |
| `k562_ifng` | K-562 | CVCL_0004 | IFN-gamma | 11,097 | 1,345 | 22 | 258,417 |
| `k562_ins` | K-562 | CVCL_0004 | Insulin | 22,055 | 2,972 | 10 | 119,326 |
| `k562_tgfb` | K-562 | CVCL_0004 | TGF-beta | 4,814 | 910 | 10 | 122,244 |
| `k562_tnfa` | K-562 | CVCL_0004 | TNF-alpha | 22,842 | 3,292 | 17 | 200,631 |
| `mcf7_ifnb` | MCF-7 | CVCL_0031 | IFN-beta | 8,372 | 2,669 | 8 | 94,945 |
| `mcf7_ifng` | MCF-7 | CVCL_0031 | IFN-gamma | 3,022 | 1,585 | 4 | 48,154 |
| `mcf7_ins` | MCF-7 | CVCL_0031 | Insulin | 3,334 | 2,651 | 2 | 23,748 |
| `mcf7_tgfb` | MCF-7 | CVCL_0031 | TGF-beta | 1,988 | 563 | 4 | 48,534 |
| `mcf7_tnfa` | MCF-7 | CVCL_0031 | TNF-alpha | 15,870 | 3,351 | 9 | 108,090 |

### `de/`

One parquet per context, from the `pie process` `de` stage (gpudge 0.7.0 on raw counts, grouped by
`gene` against `non-targeting`, CP10k normalization, genes kept at ≥ 5 CPM).

| Column             | Description                                        |
|--------------------|----------------------------------------------------|
| `target`           | perturbed gene                                     |
| `feature`          | measured gene                                      |
| `target_mean`      | mean expression in perturbed cells                 |
| `ref_mean`         | mean expression in control cells                   |
| `target_ncells`    | number of perturbed cells                          |
| `ref_ncells`       | number of control cells                            |
| `log2_fold_change` | log2 fold change, perturbed vs. control            |
| `p_value`          | Mann-Whitney U test p-value                        |
| `Ueffect`          | U-statistic effect size                            |
| `p_adj`            | Benjamini-Hochberg adjusted p-value                |

### `preprocessed/`

The PIE preprocessed dir (`pie prep` output, format version 1) that `pie sources`, `pie train`,
`pie eval` and `pie infer` read: N = 461 rows, one per (context, perturbation) pair, over
G = 22,454 genes and C = 30 contexts.

| File               | Shape, dtype      | Description                                                    |
|--------------------|-------------------|----------------------------------------------------------------|
| `meta.json`        |                   | gene axis, context and perturbation vocabularies, checksums |
| `contexts.yaml`    |                   | context -> Cellosaurus accession map and the stimulations; `pie sources` reads it for `context_text` |
| `fold_changes.npy` | (N, G) float32    | linear fold change, 0 where untested                           |
| `fdr.npy`          | (N, G) float32    | adjusted p-value, 1 where untested                             |
| `tested.npy`       | (N, G) bool       | whether the gene was tested for the pair                       |
| `lfc_true.npy`     | (N, G) float64    | log2 fold change, NaN where untested                           |
| `delta_p.npy`      | (N, G) float32    | pseudobulk log1p expression of perturbed cells minus control mean |
| `ctrl_means.npy`   | (C, G) float32    | mean log1p expression of control cells per context             |
| `ctx_ids.npy`      | (N,) int32        | context of each row, index into `context_to_id`                |
| `pert_ids.npy`     | (N,) int32        | perturbation of each row, index into `pert_to_id`              |

## Usage

The `replogle_xdataset` experiment config pins this repo by commit, so `pie train` and `pie eval`
download `preprocessed/` automatically. In your own config, use
`hf://datasets/arcinstitute/PIE_jiang@<commit>/preprocessed` in `data.preprocessed_dirs`, or
download a copy:

```bash
hf download arcinstitute/PIE_jiang --repo-type dataset \
  --local-dir "$PIE_DATA_ROOT/jiang"
```
