"""Descriptive single-cell paclitaxel analysis of GEO GSE266934 experiment 1.

One library per condition: cells are observational subsamples, so this module
does not produce p-values or claim replicate-level differential expression.
"""

from __future__ import annotations

import hashlib
import json
import tarfile
from pathlib import Path
from urllib.request import urlopen

import h5py
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import scipy
from scipy.sparse import csc_matrix

ACCESSION = "GSE266934"
SOURCE_URL = "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE266nnn/GSE266934/suppl/GSE266934_RAW.tar"
SOURCE_SHA256 = "547370866041ae6048eed81a0d6486a5261ecc628d89956bdcca788a6c308ccc"
SAMPLES = [
    ("GSM8257022", "LH2400", "DMSO", 24),
    ("GSM8257023", "LH2401", "paclitaxel", 24),
    ("GSM8257024", "LH7200", "DMSO", 72),
    ("GSM8257025", "LH7201", "paclitaxel", 72),
]
PANELS = {
    "cell_cycle": ("MKI67", "TOP2A", "CCNB1", "UBE2C", "CDK1", "CENPF"),
    "interferon": ("ISG15", "IFI6", "IFIT1", "IFIT3", "MX1", "OAS1", "STAT1"),
}
MIN_GENES = 3000
MAX_MITO_FRACTION = 0.25


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(1 << 20):
            value.update(chunk)
    return value.hexdigest()


def ensure_inputs(cache: Path) -> dict[str, Path]:
    cache.mkdir(parents=True, exist_ok=True)
    archive_path = cache / "GSE266934_RAW.tar"
    if not archive_path.exists():
        with urlopen(SOURCE_URL, timeout=90) as response, archive_path.open("wb") as target:
            while chunk := response.read(1 << 20):
                target.write(chunk)
    if digest(archive_path) != SOURCE_SHA256:
        raise ValueError("GSE266934 archive SHA-256 does not match the frozen source")
    expected = {f"{gsm}_{label}_filtered_feature_bc_matrix.h5": gsm for gsm, label, _, _ in SAMPLES}
    paths = {}
    with tarfile.open(archive_path) as archive:
        for member in archive:
            if member.name not in expected or not member.isfile():
                continue
            target = cache / member.name
            with archive.extractfile(member) as source, target.open("wb") as output:
                while chunk := source.read(1 << 20):
                    output.write(chunk)
            paths[expected[member.name]] = target
    if set(paths) != {sample[0] for sample in SAMPLES}:
        raise ValueError("The archive lacks one or more expected filtered count matrices")
    return paths


def read_10x_h5(path: Path):
    with h5py.File(path) as source:
        matrix = source["matrix"]
        shape = tuple(int(value) for value in matrix["shape"][:])
        counts = csc_matrix((matrix["data"][:], matrix["indices"][:], matrix["indptr"][:]), shape=shape).T.tocsr()
        names = np.asarray([value.decode() for value in matrix["features/name"][:]])
        ids = np.asarray([value.decode() for value in matrix["features/id"][:]])
        kinds = np.asarray([value.decode() for value in matrix["features/feature_type"][:]])
        barcodes = np.asarray([value.decode() for value in matrix["barcodes"][:]])
    genes = kinds == "Gene Expression"
    if genes.sum() < 10000:
        raise ValueError(f"Too few gene-expression features in {path}")
    return counts[:, genes].tocsr(), names[genes], ids[genes], barcodes


def module_score(counts, totals, names, markers):
    selected = [marker for marker in markers if np.any(names == marker)]
    if len(selected) < len(markers) // 2 + 1:
        raise ValueError(f"Marker panel is incompletely mapped: {selected}")
    values = []
    for marker in selected:
        raw = np.asarray(counts[:, names == marker].sum(axis=1)).ravel()
        values.append(np.log1p(raw / np.maximum(totals, 1) * 10000))
    return np.mean(values, axis=0), selected


def analyze(cache: Path, output: Path) -> dict:
    paths = ensure_inputs(cache)
    output.mkdir(parents=True, exist_ok=True)
    frames = []
    qc_rows = []
    abundance = {}
    reference_ids = None
    reference_names = None
    marker_mapping = {}
    for gsm, _, treatment, hours in SAMPLES:
        counts, names, ids, barcodes = read_10x_h5(paths[gsm])
        if reference_ids is None:
            reference_ids, reference_names = ids, names
        elif not np.array_equal(reference_ids, ids):
            raise ValueError("Gene identifiers differ across libraries; align features before comparison")
        totals = np.asarray(counts.sum(axis=1)).ravel()
        detected = counts.getnnz(axis=1)
        mito_idx = np.char.startswith(names.astype(str), "MT-")
        mito = np.asarray(counts[:, mito_idx].sum(axis=1)).ravel() / np.maximum(totals, 1)
        keep = (detected >= MIN_GENES) & (mito <= MAX_MITO_FRACTION) & (totals > 0)
        if keep.sum() < 50:
            raise ValueError(f"Only {keep.sum()} cells pass QC for {gsm}; inspect thresholds and source")
        counts = counts[keep]
        totals = totals[keep]
        detected = detected[keep]
        mito = mito[keep]
        frame = pd.DataFrame({
            "sample": gsm, "treatment": treatment, "hours": hours,
            "barcode": barcodes[keep], "umis": totals, "genes_detected": detected,
            "mitochondrial_fraction": mito,
        })
        for panel, markers in PANELS.items():
            frame[f"{panel}_score"], present = module_score(counts, totals, names, markers)
            marker_mapping[panel] = present
        frames.append(frame)
        total_counts = np.asarray(counts.sum(axis=0)).ravel()
        abundance[gsm] = total_counts / total_counts.sum() * 1_000_000
        qc_rows.append({
            "sample": gsm, "treatment": treatment, "hours": hours,
            "filtered_matrix_cells": len(keep), "cells_after_qc": int(keep.sum()),
            "median_umis_after_qc": float(np.median(totals)),
            "median_genes_after_qc": float(np.median(detected)),
            "median_mito_fraction_after_qc": float(np.median(mito)),
        })
    cells = pd.concat(frames, ignore_index=True)
    qc = pd.DataFrame(qc_rows)
    module_rows = []
    for (hours, treatment), group in cells.groupby(["hours", "treatment"], sort=True):
        for panel in PANELS:
            values = group[f"{panel}_score"].to_numpy()
            module_rows.append({"hours": hours, "treatment": treatment, "panel": panel, "cells": len(values),
                                "median": float(np.median(values)), "q25": float(np.quantile(values, .25)),
                                "q75": float(np.quantile(values, .75))})
    module_summary = pd.DataFrame(module_rows)
    contrasts = []
    marker_rows = []
    for hours in (24, 72):
        for panel in PANELS:
            treated = module_summary.query("hours == @hours and treatment == 'paclitaxel' and panel == @panel").iloc[0]
            control = module_summary.query("hours == @hours and treatment == 'DMSO' and panel == @panel").iloc[0]
            contrasts.append({"hours": hours, "panel": panel, "paclitaxel_minus_DMSO_median": float(treated["median"] - control["median"]),
                              "paclitaxel_median": treated["median"], "DMSO_median": control["median"],
                              "interpretation": "descriptive; one library per condition"})
        control_gsm = next(gsm for gsm, _, condition, h in SAMPLES if h == hours and condition == "DMSO")
        treated_gsm = next(gsm for gsm, _, condition, h in SAMPLES if h == hours and condition == "paclitaxel")
        for panel, markers in PANELS.items():
            for marker in markers:
                matches = np.flatnonzero(reference_names == marker)
                if len(matches) == 0:
                    continue
                control_cpm = float(abundance[control_gsm][matches].sum())
                treated_cpm = float(abundance[treated_gsm][matches].sum())
                marker_rows.append({"hours": hours, "panel": panel, "gene": marker,
                                    "DMSO_CPM": control_cpm, "paclitaxel_CPM": treated_cpm,
                                    "descriptive_log2_CPM_ratio": float(np.log2((treated_cpm + 1) / (control_cpm + 1)))})
    cells.to_csv(output / "cell_qc_module_scores.tsv", sep="\t", index=False)
    qc.to_csv(output / "library_qc.tsv", sep="\t", index=False)
    module_summary.to_csv(output / "module_summary.tsv", sep="\t", index=False)
    pd.DataFrame(contrasts).to_csv(output / "module_contrasts.tsv", sep="\t", index=False)
    pd.DataFrame(marker_rows).to_csv(output / "marker_cpm_ratios.tsv", sep="\t", index=False)
    fig, axes = plt.subplots(1, 2, figsize=(11, 4), layout="constrained")
    order = [(24, "DMSO"), (24, "paclitaxel"), (72, "DMSO"), (72, "paclitaxel")]
    for axis, (panel, markers) in zip(axes, PANELS.items()):
        groups = [cells.loc[(cells.hours == h) & (cells.treatment == t), f"{panel}_score"].to_numpy() for h, t in order]
        axis.boxplot(groups, tick_labels=[f"{h}h {t}" for h, t in order], showfliers=False)
        axis.set_title(f"{panel.replace('_', ' ').title()} marker score")
        axis.set_ylabel("Mean log1p(10k-normalized counts)")
        axis.tick_params(axis="x", rotation=20)
    fig.suptitle("GSE266934 HCC1143: descriptive cell distributions")
    fig.savefig(output / "marker_scores.png", dpi=160)
    plt.close(fig)
    summary = {
        "accession": ACCESSION, "source_url": SOURCE_URL, "source_sha256": SOURCE_SHA256,
        "source_article": "https://doi.org/10.1038/s41598-024-82218-9",
        "chemical": "paclitaxel", "chemical_class": "taxane diterpenoid",
        "dose": "1 nM", "control": "0.1% DMSO", "cell_model": "HCC1143",
        "independent_libraries_per_condition": 1,
        "analysis_scope": "descriptive single-cell chemical exposure; no genetic Perturb-seq, replicate-level inference, or target dependency",
        "qc": {"min_detected_genes": MIN_GENES, "max_mitochondrial_fraction": MAX_MITO_FRACTION},
        "marker_panels": {key: list(value) for key, value in PANELS.items()},
        "mapped_markers": marker_mapping,
        "inputs": {gsm: {"sha256": digest(path), "file": path.name} for gsm, path in paths.items()},
        "software": {"numpy": np.__version__, "pandas": pd.__version__, "scipy": scipy.__version__, "h5py": h5py.__version__, "matplotlib": plt.matplotlib.__version__},
        "library_qc": qc_rows, "module_contrasts": contrasts,
    }
    (output / "analysis_summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    return summary


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", type=Path, default=Path("/tmp/terputer-gse266934"))
    parser.add_argument("--output", type=Path, default=Path(__file__).with_name("results"))
    args = parser.parse_args()
    print(json.dumps(analyze(args.cache, args.output), indent=2))
