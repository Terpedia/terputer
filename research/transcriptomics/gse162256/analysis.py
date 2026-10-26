"""Descriptive marker analysis of GEO GSE162256 processed single-cell values.

Cells are not independent biological replicates. No p-values are calculated.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from urllib.request import urlretrieve

import pandas as pd


SOURCE_URL = "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE162nnn/GSE162256/suppl/GSE162256_Evalues.txt.gz"
SOURCE_SHA256 = "c998a6d6034486a19fde2619a271f67de807cfc2e9d9af6b2007b8c5c0ea70ae"
PANELS = {
    "cell_cycle": ("MKI67", "TOP2A", "CCNB1", "UBE2C", "CDK1", "CENPF"),
    "interferon": ("ISG15", "IFI6", "IFIT1", "IFIT3", "MX1", "OAS1", "STAT1"),
}
GROUPS = {"Controls": "control", "Pac_16h": "paclitaxel_16h", "Pac_48h": "paclitaxel_48h"}


def run(root: Path = Path(".")) -> dict:
    cache = root / "research/transcriptomics/gse162256/data"
    output = root / "research/transcriptomics/gse162256/results"
    cache.mkdir(parents=True, exist_ok=True)
    output.mkdir(parents=True, exist_ok=True)
    source = cache / "GSE162256_Evalues.txt.gz"
    if not source.exists():
        urlretrieve(SOURCE_URL, source)
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    if digest != SOURCE_SHA256:
        raise ValueError(f"Unexpected source SHA-256: {digest}")

    matrix = pd.read_csv(source, sep="\t", index_col=0, compression="gzip", low_memory=False)
    states = matrix.loc["States"]
    matrix = matrix.drop(index="States")
    matrix = matrix.apply(pd.to_numeric, errors="raise")
    counts = pd.Series([column.split(".", 1)[0] for column in matrix.columns]).value_counts().to_dict()
    symbols = matrix.index.to_series().str.rsplit("_", n=1).str[-1]
    control_columns = matrix.columns.str.startswith("Controls.")
    controls = matrix.loc[:, control_columns]
    eligible = (controls > 0).mean(axis=1) >= 0.20
    background = {}
    background_rows = []
    for prefix, label in list(GROUPS.items())[1:]:
        exposed = matrix.loc[:, matrix.columns.str.startswith(prefix + ".")]
        differences = exposed.median(axis=1) - controls.median(axis=1)
        reference = differences[eligible]
        background[label] = reference
        background_rows.append({
            "contrast": label + "_vs_control",
            "baseline_detection_threshold": 0.20,
            "eligible_features": len(reference),
            "fraction_lower_median": float((reference < 0).mean()),
            "fraction_equal_median": float((reference == 0).mean()),
            "median_feature_difference_reported_units": float(reference.median()),
        })
    pd.DataFrame(background_rows).to_csv(output / "background_descriptive.tsv", sep="\t", index=False)
    results = []
    for panel, genes in PANELS.items():
        for gene in genes:
            matches = matrix.index[symbols == gene]
            if len(matches) != 1:
                results.append({"panel": panel, "gene": gene, "status": f"{len(matches)} matches"})
                continue
            row = matrix.loc[matches[0]]
            control = row[[c.startswith("Controls.") for c in row.index]]
            for prefix, label in list(GROUPS.items())[1:]:
                exposed = row[[c.startswith(prefix + ".") for c in row.index]]
                results.append({
                    "panel": panel,
                    "gene": gene,
                    "contrast": label + "_vs_control",
                    "status": "descriptive",
                    "n_control_cells": len(control),
                    "n_exposed_cells": len(exposed),
                    "median_control": float(control.median()),
                    "median_exposed": float(exposed.median()),
                    "median_difference_reported_units": float(exposed.median() - control.median()),
                    "background_lower_tail_fraction": float((background[label] <= exposed.median() - control.median()).mean()) if eligible.loc[matches[0]] else None,
                    "detection_control": float((control > 0).mean()),
                    "detection_exposed": float((exposed > 0).mean()),
                })
    table = pd.DataFrame(results)
    table.to_csv(output / "marker_descriptive.tsv", sep="\t", index=False)
    summary = {
        "accession": "GSE162256",
        "source_url": SOURCE_URL,
        "source_sha256": digest,
        "matrix_shape_genes_by_cells": list(matrix.shape),
        "group_cell_counts": counts,
        "state_labels": states.value_counts().to_dict(),
        "missing_numeric_values": int(matrix.isna().sum().sum()),
        "interpretation": "Single-cell descriptive contrasts in reported E-value units; no biological replicate inference or cross-study scale comparison.",
    }
    (output / "analysis_summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    return summary


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
