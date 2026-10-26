"""Exploratory female mouse DRG TPM comparison from GEO GSE230454/459.

The paclitaxel GEO sample protocol contradicts its title; no formal DE calls.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from urllib.request import urlretrieve

import numpy as np
import pandas as pd

SOURCES = {
    "control": ("https://ftp.ncbi.nlm.nih.gov/geo/series/GSE230nnn/GSE230454/suppl/GSE230454_CON_RNASEQ_TPM.xlsx", "f982c3e9066d2608e62e0527f1d6386fd76767ce446f677fa3012c05c4dd5f47"),
    "paclitaxel": ("https://ftp.ncbi.nlm.nih.gov/geo/series/GSE230nnn/GSE230459/suppl/GSE230459_PAC_RNA_TPM.xlsx", "f89bbdd95fda8eccd9d735bac7217e2acc6b83808b840af87f0e7dbeb8a1cbdb"),
}
PANELS = {
    "cell_cycle": ("Mki67", "Top2a", "Ccnb1", "Ube2c", "Cdk1", "Cenpf"),
    "interferon": ("Isg15", "Ifit1", "Stat1"),
    "cholesterol_synthesis": ("Hmgcr", "Sqle", "Hmgcs1", "Idi1", "Srebf2"),
    "injury_signaling": ("Atf3", "Jun", "Ddit3"),
}


def run(root: Path = Path(".")) -> dict:
    cache = root / "research/transcriptomics/gse230454-459/data"
    results = root / "research/transcriptomics/gse230454-459/results"
    cache.mkdir(parents=True, exist_ok=True)
    results.mkdir(parents=True, exist_ok=True)
    files = {}
    for group, (url, expected) in SOURCES.items():
        path = cache / url.rsplit("/", 1)[-1]
        if not path.exists():
            urlretrieve(url, path)
        actual = hashlib.sha256(path.read_bytes()).hexdigest()
        if actual != expected:
            raise ValueError(f"Checksum mismatch for {group}: {actual}")
        files[group] = path
    control = pd.read_excel(files["control"], sheet_name="female")
    exposed = pd.read_excel(files["paclitaxel"], sheet_name="Sheet1")
    if list(control.columns) != ["gene_id", "gene_short_name", "ConF_1", "ConF_2", "ConF_3", "ConF_4"]:
        raise ValueError("Unexpected control workbook columns")
    if list(exposed.columns) != ["gene_id", "gene_short_name", "PacF_1", "PacF_2", "PacF_3", "PacF_4"]:
        raise ValueError("Unexpected paclitaxel workbook columns")
    if not control["gene_id"].equals(exposed["gene_id"]) or not control["gene_short_name"].equals(exposed["gene_short_name"]):
        raise ValueError("Gene rows do not align across workbooks")
    c = control.iloc[:, 2:].astype(float)
    t = exposed.iloc[:, 2:].astype(float)
    if not np.isfinite(c.to_numpy()).all() or not np.isfinite(t.to_numpy()).all() or (c.to_numpy() < 0).any() or (t.to_numpy() < 0).any():
        raise ValueError("TPM matrix has missing, nonfinite, or negative values")

    qc = []
    for group, data in (("control", c), ("paclitaxel", t)):
        for name in data.columns:
            qc.append({"sample": name, "group": group, "total_tpm": float(data[name].sum()), "detected_features": int((data[name] > 0).sum())})
    pd.DataFrame(qc).to_csv(results / "sample_qc.tsv", sep="\t", index=False)

    cmean = c.mean(axis=1)
    tmean = t.mean(axis=1)
    effect = np.log2(tmean + 1) - np.log2(cmean + 1)
    eligible = cmean >= 1
    background = {"eligible_features_control_mean_tpm_at_least_1": int(eligible.sum()),
                  "fraction_positive": float((effect[eligible] > 0).mean()),
                  "fraction_negative": float((effect[eligible] < 0).mean()),
                  "median_log2_tpm_plus_1_ratio": float(effect[eligible].median())}
    (results / "background_summary.json").write_text(json.dumps(background, indent=2) + "\n")

    rows = []
    for panel, genes in PANELS.items():
        for gene in genes:
            matches = control.index[control["gene_short_name"] == gene]
            if len(matches) != 1:
                rows.append({"panel": panel, "gene": gene, "status": f"{len(matches)} matches"})
                continue
            i = matches[0]
            rows.append({"panel": panel, "gene": gene, "status": "descriptive",
                         "control_mean_tpm": float(cmean.iloc[i]), "paclitaxel_mean_tpm": float(tmean.iloc[i]),
                         "log2_tpm_plus_1_ratio": float(effect.iloc[i]),
                         "control_min_tpm": float(c.iloc[i].min()), "control_max_tpm": float(c.iloc[i].max()),
                         "paclitaxel_min_tpm": float(t.iloc[i].min()), "paclitaxel_max_tpm": float(t.iloc[i].max())})
    pd.DataFrame(rows).to_csv(results / "marker_descriptive.tsv", sep="\t", index=False)
    summary = {"study": "GSE230454 control versus GSE230459 paclitaxel", "organism": "Mus musculus",
               "tissue": "female SW mouse dorsal root ganglia", "samples_per_arm": 4,
               "feature_rows": len(control), "source_sha256": {group: digest for group, (_, digest) in SOURCES.items()},
               "metadata_conflict": "GSE230459 sample titles say Pax; their treatment_protocol fields say saline. Source paper describes paclitaxel dosing. Treat exposure labels as provisional until reconciled with submitter/raw metadata.",
               "interpretation": "Processed TPM descriptive contrast; no count-aware differential expression, pathway enrichment, or target inference."}
    (results / "analysis_summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    return summary


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
