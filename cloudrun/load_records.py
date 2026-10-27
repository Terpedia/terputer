"""Review and idempotently upsert curated transcriptomics JSONL into BigQuery.

The default invocation is local and read-only. --apply needs BigQuery permissions
and stages all four files before one multi-table transaction. Existing records
outside these manifests are retained.
"""
from __future__ import annotations

import argparse
import json
import re
import uuid
from pathlib import Path

PROJECT = "terpedia-489015"
DATASET = "terpedia_research"
ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "research/transcriptomics/bigquery-ready"
TABLES = (
    ("studies", "transcriptomic_studies", ("study_id",)),
    ("samples", "transcriptomic_samples", ("study_id", "sample_id")),
    ("contrasts", "transcriptomic_contrasts", ("contrast_id",)),
    ("observations", "transcriptomic_observations", ("observation_id",)),
)


def read_records(directory: Path) -> dict[str, list[dict]]:
    records = {}
    for filename, _, key_fields in TABLES:
        path = directory / f"{filename}.jsonl"
        rows = [json.loads(line) for line in path.read_text().splitlines() if line.strip()]
        if not rows:
            raise ValueError(f"{path} has no records")
        keys = [tuple(row.get(field) for field in key_fields) for row in rows]
        if any(not isinstance(value, str) or not value for key in keys for value in key):
            raise ValueError(f"{path} has an empty or invalid key field: {key_fields}")
        if len(keys) != len(set(keys)):
            raise ValueError(f"{path} has duplicate keys: {key_fields}")
        fields = set(rows[0])
        if any(set(row) != fields for row in rows):
            raise ValueError(f"{path} has inconsistent fields")
        records[filename] = rows
    studies = {row["study_id"]: row for row in records["studies"]}
    study_ids = set(studies)
    accessions = [row["accession"] for row in records["studies"]]
    if any(not isinstance(value, str) or not value for value in accessions) or len(set(accessions)) != len(accessions):
        raise ValueError("studies have empty or duplicate accessions")
    for filename in ("samples", "contrasts", "observations"):
        unknown = {row["study_id"] for row in records[filename]} - study_ids
        if unknown:
            raise ValueError(f"{filename} references unlisted studies: {sorted(unknown)}")
    for sample in records["samples"]:
        if sample["accession"] != studies[sample["study_id"]]["accession"]:
            raise ValueError(f"Sample {sample['sample_id']} accession differs from its study")
    for filename in ("studies", "contrasts", "observations"):
        for row in records[filename]:
            if not re.fullmatch(r"[a-f0-9]{64}", str(row.get("source_sha256") or "")):
                raise ValueError(f"{filename} has an invalid source SHA-256")
    return records


def apply_records(records: dict[str, list[dict]], project: str, dataset: str) -> None:
    from google.cloud import bigquery

    if not re.fullmatch(r"[A-Za-z0-9_-]+", project):
        raise ValueError("Invalid project")
    if not re.fullmatch(r"[A-Za-z0-9_]+", dataset):
        raise ValueError("Invalid dataset")
    client = bigquery.Client(project=project)
    staged = []
    try:
        # Validate every destination schema before writing any staging table.
        destinations = {}
        for filename, table, key_fields in TABLES:
            destination = client.get_table(f"{project}.{dataset}.{table}")
            expected = {field.name for field in destination.schema}
            actual = set(records[filename][0])
            if actual != expected:
                raise ValueError(f"{table} schema mismatch: missing={sorted(expected-actual)}, extra={sorted(actual-expected)}")
            key_sql = ", ".join(key_fields)
            duplicate = list(client.query(
                f"SELECT {key_sql}, COUNT(*) AS n FROM `{project}.{dataset}.{table}` "
                f"GROUP BY {key_sql} HAVING n > 1 LIMIT 1",
                job_config=bigquery.QueryJobConfig(maximum_bytes_billed=1_000_000_000),
            ).result())
            if duplicate:
                raise ValueError(f"{table} has duplicate destination keys; resolve before upsert")
            destinations[filename] = destination

        for filename, table, _ in TABLES:
            destination = destinations[filename]
            stage_id = f"{project}.{dataset}._stage_{table}_{uuid.uuid4().hex[:12]}"
            client.create_table(bigquery.Table(stage_id, schema=destination.schema))
            staged.append(stage_id)
            job = client.load_table_from_json(
                records[filename], stage_id,
                job_config=bigquery.LoadJobConfig(
                    schema=destination.schema,
                    write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
                ),
            )
            job.result()
            count = next(iter(client.query(f"SELECT COUNT(*) AS n FROM `{stage_id}`").result())).n
            if count != len(records[filename]):
                raise RuntimeError(f"Staging row count mismatch for {filename}: {count}")

        statements = ["BEGIN TRANSACTION;"]
        for (filename, table, key_fields), stage_id in zip(TABLES, staged):
            columns = list(records[filename][0])
            updates = ", ".join(f"T.{column} = S.{column}" for column in columns if column not in key_fields)
            inserts = ", ".join(columns)
            values = ", ".join(f"S.{column}" for column in columns)
            predicate = " AND ".join(f"T.{field} = S.{field}" for field in key_fields)
            statements.append(
                f"MERGE `{project}.{dataset}.{table}` T USING `{stage_id}` S "
                f"ON {predicate} "
                f"WHEN MATCHED THEN UPDATE SET {updates} "
                f"WHEN NOT MATCHED THEN INSERT ({inserts}) VALUES ({values});"
            )
        statements.append("COMMIT TRANSACTION;")
        client.query("\n".join(statements)).result()
        print(json.dumps({"status": "applied", "counts": {name: len(rows) for name, rows in records.items()}}))
    finally:
        for stage_id in staged:
            client.delete_table(stage_id, not_found_ok=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--project", default=PROJECT)
    parser.add_argument("--dataset", default=DATASET)
    parser.add_argument("--apply", action="store_true", help="Stage and upsert into BigQuery")
    args = parser.parse_args()
    records = read_records(args.input)
    print(json.dumps({"status": "reviewed", "counts": {name: len(rows) for name, rows in records.items()}, "input": str(args.input)}))
    if args.apply:
        apply_records(records, args.project, args.dataset)


if __name__ == "__main__":
    main()
