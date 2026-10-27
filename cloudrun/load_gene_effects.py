"""Review or atomically load complete gene-effect contrasts into BigQuery.

Dry run by default. --apply requires BigQuery write access and requires the
referenced study and contrast records to have been curated first.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import uuid
from pathlib import Path


PROJECT = "terpedia-489015"
DATASET = "terpedia_research"
TABLE = "transcriptomic_gene_effects"
FIELDS = {
    "study_id", "contrast_id", "gene_id", "gene_name", "base_mean",
    "log2_fold_change", "standard_error", "test_statistic", "p_value",
    "adjusted_p_value", "assay", "evidence_class", "analysis_version",
    "result_sha256", "processing_receipt_sha256", "execution_receipt_sha256",
    "source_url", "artifact_url", "limitations",
}


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            value.update(chunk)
    return value.hexdigest()


def inspect(path: Path) -> dict:
    digest = hashlib.sha256()
    keys = set()
    contrasts = set()
    contrast_counts = {}
    adjusted_counts = {}
    contrast_metadata = {}
    study_ids = set()
    count = 0
    with path.open("rb") as stream:
        for line in stream:
            digest.update(line)
            if not line.strip():
                continue
            row = json.loads(line)
            if set(row) != FIELDS:
                raise ValueError(f"Gene-effect fields differ from the expected schema on row {count + 1}")
            key = (row["study_id"], row["contrast_id"], row["gene_id"])
            if any(not isinstance(value, str) or not value for value in key) or key in keys:
                raise ValueError(f"Missing or duplicated gene-effect key: {key}")
            if not row["contrast_id"].startswith(row["study_id"] + ":"):
                raise ValueError(f"Contrast does not belong to its study: {key}")
            for field in ("result_sha256", "processing_receipt_sha256", "execution_receipt_sha256", "analysis_version"):
                if not re.fullmatch(r"[a-f0-9]{64}", row[field]):
                    raise ValueError(f"Invalid {field} on row {count + 1}")
            if not row["assay"] or not row["evidence_class"] or not row["limitations"]:
                raise ValueError(f"Missing assay, evidence class, or limitations on row {count + 1}")
            if not row["source_url"].startswith("https://") or not row["artifact_url"].startswith("https://"):
                raise ValueError(f"Missing HTTPS provenance URL on row {count + 1}")
            for field in ("base_mean", "log2_fold_change", "standard_error", "test_statistic", "p_value", "adjusted_p_value"):
                value = row[field]
                if value is not None and (isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value)):
                    raise ValueError(f"Invalid {field} on row {count + 1}")
                if value is not None and field in ("base_mean", "standard_error") and value < 0:
                    raise ValueError(f"Negative {field} on row {count + 1}")
                if value is not None and field in ("p_value", "adjusted_p_value") and not 0 <= value <= 1:
                    raise ValueError(f"Invalid {field} on row {count + 1}")
            if row["gene_name"] is not None and not isinstance(row["gene_name"], str):
                raise ValueError(f"Invalid gene_name on row {count + 1}")
            metadata = tuple(row[field] for field in (
                "result_sha256", "processing_receipt_sha256", "execution_receipt_sha256",
                "assay", "evidence_class", "analysis_version", "source_url",
                "artifact_url", "limitations",
            ))
            if key[:2] in contrast_metadata and contrast_metadata[key[:2]] != metadata:
                raise ValueError(f"Contradictory provenance within contrast: {key[:2]}")
            contrast_metadata[key[:2]] = metadata
            keys.add(key)
            contrasts.add((row["study_id"], row["contrast_id"]))
            contrast_counts[key[:2]] = contrast_counts.get(key[:2], 0) + 1
            if row["adjusted_p_value"] is not None:
                adjusted_counts[key[:2]] = adjusted_counts.get(key[:2], 0) + 1
            study_ids.add(row["study_id"])
            count += 1
    if not count or any(value < 1000 for value in contrast_counts.values()):
        raise ValueError("Each contrast must include at least 1000 tested genes")
    if any(adjusted_counts.get(contrast, 0) == 0 for contrast in contrasts):
        raise ValueError("Each contrast must include at least one adjusted p-value")
    return {"rows": count, "studies": sorted(study_ids),
            "contrasts": sorted(contrast for _, contrast in contrasts),
            "sha256": digest.hexdigest(), "path": str(path)}


def apply(path: Path, summary: dict, project: str, dataset: str) -> None:
    from google.cloud import bigquery

    if not re.fullmatch(r"[A-Za-z0-9_-]+", project) or not re.fullmatch(r"[A-Za-z0-9_]+", dataset):
        raise ValueError("Invalid BigQuery project or dataset")
    client = bigquery.Client(project=project)
    destination_id = f"{project}.{dataset}.{TABLE}"
    destination = client.get_table(destination_id)
    if {field.name for field in destination.schema} != FIELDS:
        raise ValueError("Destination gene-effect schema differs from the reviewed JSONL")
    stage_id = f"{project}.{dataset}._stage_gene_effects_{uuid.uuid4().hex[:12]}"
    try:
        client.create_table(bigquery.Table(stage_id, schema=destination.schema))
        with path.open("rb") as stream:
            client.load_table_from_file(
                stream, stage_id,
                job_config=bigquery.LoadJobConfig(
                    source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
                    schema=destination.schema,
                    write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
                ),
            ).result()
        if digest(path) != summary["sha256"]:
            raise ValueError("Input JSONL changed during staging")
        staged = next(iter(client.query(f"SELECT COUNT(*) AS n FROM `{stage_id}`").result())).n
        if staged != summary["rows"]:
            raise ValueError(f"Staged row count {staged} differs from reviewed {summary['rows']}")
        missing = list(client.query(
            f"SELECT S.study_id, S.contrast_id FROM (SELECT DISTINCT study_id, contrast_id FROM `{stage_id}`) S "
            f"LEFT JOIN `{project}.{dataset}.transcriptomic_studies` T ON S.study_id = T.study_id "
            f"LEFT JOIN `{project}.{dataset}.transcriptomic_contrasts` C "
            "ON S.contrast_id = C.contrast_id AND S.study_id = C.study_id "
            "WHERE T.study_id IS NULL OR C.contrast_id IS NULL LIMIT 1"
        ).result())
        if missing:
            raise ValueError(f"Curate study and contrast records before gene effects: {dict(missing[0].items())}")
        client.query(
            "BEGIN TRANSACTION;\n"
            f"DELETE FROM `{destination_id}` T WHERE EXISTS (SELECT 1 FROM `{stage_id}` S "
            "WHERE T.study_id = S.study_id AND T.contrast_id = S.contrast_id);\n"
            f"INSERT INTO `{destination_id}` SELECT * FROM `{stage_id}`;\n"
            "COMMIT TRANSACTION;"
        ).result()
        print(json.dumps({"status": "applied", **summary}))
    finally:
        client.delete_table(stage_id, not_found_ok=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--project", default=PROJECT)
    parser.add_argument("--dataset", default=DATASET)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    path = args.input.resolve(strict=True)
    summary = inspect(path)
    print(json.dumps({"status": "reviewed", **summary}))
    if args.apply:
        apply(path, summary, args.project, args.dataset)


if __name__ == "__main__":
    main()
