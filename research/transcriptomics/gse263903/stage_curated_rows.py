"""Stage source-linked GSE263903 metadata and bounded notebook observations."""

import csv
import hashlib
import json
from pathlib import Path


root = Path(__file__).resolve().parents[3]
here = Path(__file__).resolve().parent
output = root / "research/transcriptomics/bigquery-ready"
revision = "7ca77dcc01687fbdb38169059f127480fc0b8082"
repo = f"https://github.com/Terpedia/terpedia-menthol-aerosol-single-cell/blob/{revision}"
geo = "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE263903"
version = "terpedia-menthol-aerosol-single-cell-2026-10-26"
expected_sha256 = {
    "source_manifest.tsv": "fb3d416ce5532fda24da88bd7cd83fbe25872775b3a59621e8f97fe974e78a60",
    "contrast_summary.tsv": "f7f3b135ebbf0247e92b26d2f59e9270f9d240437b14c701e212656fd9345717",
    "sample_qc.tsv": "f1b702c4dc545ebe59caf10c99c005dffb8c261d0e3db24af364c572f4632bd6",
    "analysis_summary.json": "a890b1c7384c55fb354418008e37fa2eea3bc609d6d2ff45d03b680e021497e2",
}
for filename, expected in expected_sha256.items():
    actual = hashlib.sha256((here / filename).read_bytes()).hexdigest()
    if actual != expected:
        raise ValueError(f"GSE263903 source artifact differs from pinned revision: {filename}")
source_sha = expected_sha256["source_manifest.tsv"]
contrast_sha = expected_sha256["contrast_summary.tsv"]
qc_sha = expected_sha256["sample_qc.tsv"]
contrast_url = f"{repo}/research/menthol-aerosol-single-cell/results/contrast_summary.tsv"
qc_url = f"{repo}/research/menthol-aerosol-single-cell/results/sample_qc.tsv"
limits = "Commercial MentholMint aerosol contains nicotine and other constituents; one sex-pooled library per arm and sex; collection date is confounded with condition; no mouse-level DE, pure-menthol effect, or target attribution"

with (here / "study_sample_manifest.tsv").open() as stream:
    samples = list(csv.DictReader(stream, delimiter="\t"))
with (here / "contrast_summary.tsv").open() as stream:
    effects = list(csv.DictReader(stream, delimiter="\t"))
with (here / "source_manifest.tsv").open() as stream:
    source_libraries = list(csv.DictReader(stream, delimiter="\t"))
with (here / "sample_qc.tsv").open() as stream:
    qc_rows = list(csv.DictReader(stream, delimiter="\t"))
summary = json.loads((here / "analysis_summary.json").read_text())
if (len(samples) != len(source_libraries) or len(qc_rows) != len(source_libraries)
        or summary["library_count"] != len(source_libraries)
        or {row["gsm"] for row in samples} != {row["gsm"] for row in source_libraries}
        or {row["gsm"] for row in qc_rows} != {row["gsm"] for row in source_libraries}
        or any(row["source_sha256"] != next(source["sha256"] for source in source_libraries if source["gsm"] == row["gsm"])
               for row in qc_rows)
        or sum(int(row["cells_qc"]) for row in qc_rows) != summary["qc_cells_total"]):
    raise ValueError("GSE263903 manifests, source checksums, and QC totals disagree")
raw_cells = sum(int(row["cells_raw"]) for row in qc_rows)
qc_cells = summary["qc_cells_total"]

study_rows = [{
    "study_id": "GSE263903", "accession": "GSE263903",
    "title": "Menthol-mint flavored e-cigarette aerosol mouse-lung single-cell study",
    "organism": "Mus musculus; C57BL/6J lung", "assay": "10x single-cell RNA-seq; primary UMI counts",
    "source_url": geo, "evidence_class": "Ten GEO libraries; all ten checksum-pinned matrices in executed descriptive audit",
    "source_sha256": source_sha, "source_revision": revision, "retrieved_at": "2026-10-26",
    "limitations": limits,
}]
sample_rows = []
for row in samples:
    flavoured = row["condition"] in {"Mango", "MentholMint", "Tobacco"}
    sample_rows.append({
        "study_id": "GSE263903", "accession": "GSE263903", "sample_id": row["library"],
        "archive_accession": row["gsm"], "organism": "Mus musculus; C57BL/6J lung",
        "condition": f"{row['condition']} aerosol; {row['sex']}; pooled mice; collection {row['sac_date']}",
        "time_label": "1 hour per day for 5 consecutive days",
        "dose": "50 mg/mL nicotine in e-liquid; flavor concentration unverified" if flavoured else "no nicotine in air or PG:VG control",
        "source_url": row["source_url"], "source_revision": revision,
    })

contrast_rows = []
for control in ("PGVG", "Air", "Mango", "Tobacco"):
    contrast_rows.append({
        "contrast_id": f"GSE263903:MentholMint-vs-{control}:myeloid-marker-targets",
        "study_id": "GSE263903",
        "chemical_identity": "MentholMint commercial aerosol; isolated menthol dose unknown; nicotine coexposure",
        "condition": "5-day nose-only MentholMint aerosol; male and female pooled libraries",
        "control": f"{control} aerosol; distinct collection date; no nicotine-only scRNA-seq arm",
        "assay": "primary single-cell UMI counts; exploratory myeloid-marker bin",
        "feature_universe": 11, "effect_class": "descriptive within-sex log2 CPM difference; no p-values",
        "analysis_version": version, "artifact_url": contrast_url,
        "source_sha256": source_sha, "limitations": limits,
    })

observation_rows = [{
    "observation_id": "GSE263903:ten-libraries:cells-qc", "study_id": "GSE263903",
    "comparison": "Ten analyzed libraries: air, PG:VG, Mango, MentholMint, and Tobacco, male and female pools",
    "metric": "cells_after_notebook_qc", "value": qc_cells, "feature_universe": raw_cells,
    "evidence_class": "executed primary single-cell count audit",
    "method": "10x filtered matrices; minimum 500 UMI, 200 detected genes, maximum 20% mitochondrial UMI",
    "source_url": qc_url, "source_sha256": qc_sha, "analysis_version": version,
    "limitations": "Already filtered 10x barcodes; cells are not independent biological replicates; not the publisher's exact QC",
}]
for row in effects:
    if row["marker_bin"] != "Myeloid-marker":
        continue
    selected = (row["treated"] == "MentholMint" and
                ((row["control"] == "PGVG" and row["gene"] in {"Il1b", "Cxcl2", "Hmgcr"}) or
                 (row["control"] == "Air" and row["sex"] == "Female" and row["gene"] in {"Il1b", "Cxcl2"}) or
                 (row["control"] in {"Mango", "Tobacco"} and row["gene"] in {"Il1b", "Cxcl2"})))
    if not selected:
        continue
    observation_rows.append({
        "observation_id": f"GSE263903:myeloid:{row['treated']}-vs-{row['control']}:{row['gene']}:{row['sex']}",
        "study_id": "GSE263903",
        "comparison": f"{row['treated']} versus {row['control']}; {row['sex']} sex-pooled library; myeloid-marker bin",
        "metric": f"{row['gene']}_delta_log2_cpm", "value": float(row["delta_log2_cpm"]),
        "feature_universe": 11, "evidence_class": "executed descriptive targeted pseudobulk",
        "method": "Highest five-gene marker-panel score assigns exploratory bin; aggregate UMIs within bin and library; log2 CPM with 0.5 count pseudocount; within-sex difference",
        "source_url": contrast_url, "source_sha256": contrast_sha,
        "analysis_version": version, "limitations": limits,
    })

for name, new_rows in (("studies", study_rows), ("samples", sample_rows),
                       ("contrasts", contrast_rows), ("observations", observation_rows)):
    path = output / f"{name}.jsonl"
    old_rows = [json.loads(line) for line in path.read_text().splitlines() if line]
    rows = [row for row in old_rows if row.get("study_id") != "GSE263903"] + new_rows
    path.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows))
    print(name, len(rows), "+", len(new_rows))
