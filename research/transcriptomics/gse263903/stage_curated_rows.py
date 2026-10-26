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
source_sha = hashlib.sha256((here / "source_manifest.tsv").read_bytes()).hexdigest()
contrast_sha = hashlib.sha256((here / "contrast_summary.tsv").read_bytes()).hexdigest()
qc_sha = hashlib.sha256((here / "sample_qc.tsv").read_bytes()).hexdigest()
contrast_url = f"{repo}/research/menthol-aerosol-single-cell/results/contrast_summary.tsv"
qc_url = f"{repo}/research/menthol-aerosol-single-cell/results/sample_qc.tsv"
limits = "Commercial MentholMint aerosol contains nicotine and other constituents; one sex-pooled library per arm and sex; collection date is confounded with condition; no mouse-level DE, pure-menthol effect, or target attribution"

with (here / "study_sample_manifest.tsv").open() as stream:
    samples = list(csv.DictReader(stream, delimiter="\t"))
with (here / "contrast_summary.tsv").open() as stream:
    effects = list(csv.DictReader(stream, delimiter="\t"))

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
    "metric": "cells_after_notebook_qc", "value": 74117, "feature_universe": 76229,
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
