#!/usr/bin/env python3
"""Create a reproducible exploratory summary from GEO's GSE136998 FPKM matrix.

This is a descriptive screen only. GEO supplies FPKM values rather than raw
counts here, so this script intentionally does not report inferential p-values.
For formal differential expression, use raw reads/counts and a count-aware model.
"""

from __future__ import annotations

import argparse
import csv
import gzip
import hashlib
import json
import math
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


URL = (
    "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE136nnn/GSE136998/suppl/"
    "GSE136998_rsem.genes.fpkm.table.txt.gz"
)
SAMPLES = {
    "LM-DZ1": "control",
    "LM-DZ2": "control",
    "LM-DZ3": "control",
    "LM-FZC1": "linalool_8h_1xMIC",
    "LM-FZC2": "linalool_8h_1xMIC",
    "LM-FZC3": "linalool_8h_1xMIC",
}


def download(path: Path) -> tuple[str, str]:
    path.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(URL, headers={"User-Agent": "TerpediaResearch/0.1"})
    with urllib.request.urlopen(request, timeout=60) as response:
        raw = response.read()
        last_modified = response.headers.get("Last-Modified", "")
    path.write_bytes(raw)
    return hashlib.sha256(raw).hexdigest(), last_modified


def read_matrix(path: Path) -> tuple[list[str], dict[str, list[float]]]:
    opener = gzip.open if path.suffix == ".gz" else open
    with opener(path, "rt", encoding="utf-8", newline="") as handle:
        reader = csv.reader(handle, delimiter="\t")
        header = next(reader)
        sample_cols = header[1:]
        if set(sample_cols) != set(SAMPLES):
            raise ValueError(f"Unexpected GEO sample columns: {sample_cols}")
        matrix: dict[str, list[float]] = {}
        for row in reader:
            if not row or len(row) != len(header):
                continue
            values = [float(value) for value in row[1:]]
            matrix[row[0]] = values
    return sample_cols, matrix


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, default=Path("results/gse136998"))
    parser.add_argument("--matrix", type=Path, help="Use an existing GEO matrix instead of downloading")
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    matrix_path = args.matrix or args.output_dir / "GSE136998_rsem.genes.fpkm.table.txt.gz"
    source_sha256 = ""
    last_modified = ""
    if not args.matrix:
        source_sha256, last_modified = download(matrix_path)
    else:
        source_sha256 = hashlib.sha256(matrix_path.read_bytes()).hexdigest()

    samples, matrix = read_matrix(matrix_path)
    groups = {group: [i for i, sample in enumerate(samples) if SAMPLES[sample] == group]
              for group in sorted(set(SAMPLES.values()))}
    control_ix = groups["control"]
    treated_ix = groups["linalool_8h_1xMIC"]

    output_path = args.output_dir / "descriptive_gene_effects.tsv"
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, delimiter="\t")
        writer.writerow([
            "gene_id", "control_mean_fpkm", "treated_mean_fpkm",
            "log2_ratio_pseudocount_0.1", "direction", "control_values_fpkm",
            "treated_values_fpkm", "inference_status",
        ])
        for gene, values in matrix.items():
            control = [values[i] for i in control_ix]
            treated = [values[i] for i in treated_ix]
            control_mean = sum(control) / len(control)
            treated_mean = sum(treated) / len(treated)
            log_ratio = math.log2((treated_mean + 0.1) / (control_mean + 0.1))
            direction = "up" if log_ratio > 0 else "down" if log_ratio < 0 else "unchanged"
            writer.writerow([
                gene, f"{control_mean:.6g}", f"{treated_mean:.6g}",
                f"{log_ratio:.6g}", direction,
                ",".join(map(str, control)), ",".join(map(str, treated)),
                "descriptive_only_no_inferential_test",
            ])

    metadata = {
        "accession": "GSE136998",
        "source_url": URL,
        "source_sha256": source_sha256,
        "source_last_modified": last_modified,
        "retrieved_at_utc": datetime.now(timezone.utc).isoformat(),
        "expression_measure": "RSEM FPKM, GEO supplementary matrix",
        "samples": SAMPLES,
        "contrast": "linalool 8 h at 1x MIC vs untreated control",
        "method": "arithmetic mean FPKM by group and log2 ratio with 0.1 pseudocount",
        "limitations": [
            "Descriptive screen only; no p-values or false-discovery estimates.",
            "FPKM is not an appropriate input for count-based DE inference.",
            "Gene IDs are GEO geneN identifiers; annotation crosswalk is required.",
            "Three replicates per group; exposure is at the reported MIC.",
        ],
        "gene_rows": len(matrix),
        "output": output_path.name,
    }
    (args.output_dir / "run_manifest.json").write_text(
        json.dumps(metadata, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps({"genes": len(matrix), "effects": str(output_path), "manifest": str(args.output_dir / 'run_manifest.json')}))


if __name__ == "__main__":
    main()
