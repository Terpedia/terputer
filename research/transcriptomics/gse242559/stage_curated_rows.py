"""Stage source-linked GSE242559 processed-expression metadata and observations."""

import csv
import hashlib
import json
from pathlib import Path


root = Path(__file__).resolve().parents[3]
here = Path(__file__).resolve().parent
output = root / "research/transcriptomics/bigquery-ready"
revision = "ef29dc4c796e360c2e7330d22c0f3948d7abae3b"
repo = f"https://github.com/Terpedia/terpedia-menthol-wnt3a-rnaseq/blob/{revision}"
geo = "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE242559"
version = "terpedia-menthol-wnt3a-rnaseq-2026-10-26"
expected_sha256 = {
    "source_manifest.tsv": "b171232c6d7bc7e63f58e64af9dad38b6e9f9174dff1982398105c296742a14a",
    "sample_manifest.tsv": "eebeecc3a0cc2aa56bab90ddff2c0b1cd8d034ae77755f0bfa75168fcc4e527a",
    "analysis_summary.json": "8bd9d6049e885ebd6bfbec709865d0972e55c444747a0c2ded65146e40247896",
    "target_markers.tsv": "cd65567e4ba3fed9ec67293af99bed8f455bf8e97de0dd435c0cc26c9d9d1821",
}
for filename, expected in expected_sha256.items():
    if hashlib.sha256((here / filename).read_bytes()).hexdigest() != expected:
        raise ValueError(f"GSE242559 source artifact differs from pinned revision: {filename}")
with (here / "source_manifest.tsv").open() as stream:
    source = next(csv.DictReader(stream, delimiter="\t"))
with (here / "sample_manifest.tsv").open() as stream:
    samples = list(csv.DictReader(stream, delimiter="\t"))
with (here / "target_markers.tsv").open() as stream:
    markers = list(csv.DictReader(stream, delimiter="\t"))
summary = json.loads((here / "analysis_summary.json").read_text())
if (len(samples) != summary["libraries"] or len({row["gsm"] for row in samples}) != len(samples)
        or summary["source_sha256"] != source["sha256"]
        or summary["features"] != 21556 or summary["expressed_features"] != 10783):
    raise ValueError("GSE242559 source and analysis manifests disagree")

limits = ("Deposited FPKM, not integer counts; three library labels per arm without independently verified culture pairing, "
          "randomization, or batch; menthol stereochemistry and intracellular exposure unverified; no formal DE, "
          "pathway significance, or TRPM8 dependency from this audit")
effect_url = f"{repo}/research/menthol-wnt3a-rnaseq/results/feature_effects.tsv.gz"
summary_url = f"{repo}/research/menthol-wnt3a-rnaseq/results/analysis_summary.json"
marker_url = f"{repo}/research/menthol-wnt3a-rnaseq/results/target_markers.tsv"
study_rows = [{
    "study_id": "GSE242559", "accession": "GSE242559",
    "title": "Menthol by Wnt3a in ND7/23 cells; processed bulk RNA-seq audit",
    "organism": "Rattus norvegicus (GEO annotation); ND7/23 cell line",
    "assay": "bulk RNA-seq; deposited processed FPKM",
    "source_url": geo, "evidence_class": "12-library checksum-pinned processed-expression factorial audit",
    "source_sha256": source["sha256"], "source_revision": revision, "retrieved_at": "2026-10-26",
    "limitations": limits,
}]
sample_rows = [{
    "study_id": "GSE242559", "accession": "GSE242559", "sample_id": row["matrix_column"],
    "archive_accession": row["gsm"], "organism": "Rattus norvegicus (GEO annotation); ND7/23 cell line",
    "condition": f"{row['condition']}; replicate label {row['replicate']}", "time_label": "6 hours",
    "dose": f"menthol {row['menthol_uM']} µM; Wnt3a {row['wnt3a_ng_mL']} ng/mL",
    "source_url": row["source_url"], "source_revision": revision,
} for row in samples]
contrast_rows = []
for condition, control in (("Menthol", "Control"), ("Menthol+Wnt3a", "Wnt3a")):
    contrast_rows.append({
        "contrast_id": f"GSE242559:{condition}-vs-{control}:processed-fpkm",
        "study_id": "GSE242559", "chemical_identity": "menthol; stereochemistry unverified",
        "condition": f"{condition}; ND7/23; 6 hours; three library labels",
        "control": f"{control}; ND7/23; 6 hours; three library labels",
        "assay": "processed bulk RNA-seq FPKM",
        "feature_universe": summary["expressed_features"],
        "effect_class": "descriptive mean log2(FPKM + 0.1) difference; no p-values",
        "analysis_version": version, "artifact_url": effect_url,
        "source_sha256": source["sha256"], "limitations": limits,
    })

numerical = (
    ("matrix_feature_rows", summary["features"], summary["features"]),
    ("features_max_arm_mean_fpkm_ge_1", summary["expressed_features"], summary["features"]),
    ("features_abs_interaction_ge_1_pc_0_1", summary["interaction_abs_ge_1_pc_0_1"], summary["expressed_features"]),
    ("features_abs_interaction_ge_1_pc_1_0", summary["interaction_abs_ge_1_pc_1_0"], summary["expressed_features"]),
    ("minimum_within_arm_spearman", summary["minimum_within_arm_spearman"], summary["features"]),
)
observation_rows = [{
    "observation_id": f"GSE242559:{metric}", "study_id": "GSE242559",
    "comparison": "Menthol by Wnt3a in ND7/23; processed FPKM; three library labels per arm",
    "metric": metric, "value": value, "feature_universe": universe,
    "evidence_class": "executed processed-expression audit",
    "method": "log2(FPKM + pseudocount) arm means; interaction is (menthol+Wnt3a − Wnt3a) − (menthol − control); descriptive only",
    "source_url": summary_url, "source_sha256": expected_sha256["analysis_summary.json"],
    "analysis_version": version, "limitations": limits,
} for metric, value, universe in numerical]
for row in markers:
    if row["present_in_matrix"] != "True":
        continue
    observation_rows.append({
        "observation_id": f"GSE242559:{row['marker']}:interaction_difference", "study_id": "GSE242559",
        "comparison": "Menthol effect with Wnt3a minus menthol effect without Wnt3a; ND7/23; processed FPKM",
        "metric": f"{row['marker']}_descriptive_interaction_log2_fpkm_pc_0_1",
        "value": float(row["interaction_difference"]), "feature_universe": summary["features"],
        "evidence_class": "executed descriptive marker-panel audit",
        "method": "Difference of arm-mean log2(FPKM + 0.1) contrasts; no uncertainty or target attribution",
        "source_url": marker_url, "source_sha256": expected_sha256["target_markers.tsv"],
        "analysis_version": version, "limitations": limits,
    })

for name, new_rows in (("studies", study_rows), ("samples", sample_rows),
                       ("contrasts", contrast_rows), ("observations", observation_rows)):
    path = output / f"{name}.jsonl"
    old_rows = [json.loads(line) for line in path.read_text().splitlines() if line]
    rows = [row for row in old_rows if row.get("study_id") != "GSE242559"] + new_rows
    path.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows))
    print(name, len(rows), "+", len(new_rows))
