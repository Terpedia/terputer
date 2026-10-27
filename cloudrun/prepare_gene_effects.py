"""Export receipt-pinned, count-model gene effects to reviewable BigQuery JSONL.

Example:
  python cloudrun/prepare_gene_effects.py \
    --project-root /path/to/terpedia-study \
    --manifest /path/to/gene-effects-source.json \
    --out /path/to/gene-effects.jsonl

The manifest names a processing receipt, a notebook execution receipt, and
one or more result TSV files. This script does not load or mutate BigQuery.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import re
from pathlib import Path


REQUIRED_COLUMNS = {
    "gene_id", "gene_name", "baseMean", "log2FoldChange", "lfcSE",
    "stat", "pvalue", "padj",
}


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            value.update(chunk)
    return value.hexdigest()


def project_file(root: Path, name: str) -> Path:
    if not isinstance(name, str) or not name or Path(name).is_absolute():
        raise ValueError(f"Expected a project-relative file path: {name!r}")
    path = (root / name).resolve()
    if not path.is_relative_to(root) or not path.is_file():
        raise ValueError(f"Missing or external project file: {name}")
    return path


def numeric(value: str, field: str, *, probability: bool = False, nonnegative: bool = False) -> float | None:
    if value == "":
        return None
    result = float(value)
    if not math.isfinite(result) or (probability and not 0 <= result <= 1) or (nonnegative and result < 0):
        raise ValueError(f"Invalid {field}: {value}")
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project-root", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    root = args.project_root.resolve(strict=True)
    source = json.loads(args.manifest.read_text())
    study = source["study_id"]
    if not re.fullmatch(r"[A-Za-z0-9_-]{4,30}", study):
        raise ValueError("Invalid study_id")
    if not source["source_url"].startswith("https://"):
        raise ValueError("source_url must use HTTPS")
    processing_path = project_file(root, source["processing_receipt"])
    execution_path = project_file(root, source["execution_receipt"])
    processing = json.loads(processing_path.read_text())
    execution = json.loads(execution_path.read_text())
    processing_sha = digest(processing_path)
    execution_sha = digest(execution_path)
    if execution.get("inputs_pinned", {}).get(source["processing_receipt"]) != processing_sha:
        raise ValueError("Notebook execution did not pin the processing receipt")
    for name, expected in processing.get("output_sha256", {}).items():
        input_path = project_file(root, str(Path(source["processing_receipt"]).parent / name))
        relative = input_path.relative_to(root).as_posix()
        if digest(input_path) != expected or execution.get("inputs_pinned", {}).get(relative) != expected:
            raise ValueError(f"Notebook execution did not pin the count-processing output: {relative}")
    if not processing.get("output_sha256"):
        raise ValueError("Processing receipt has no hashed outputs")
    if processing.get("aligner") != "STAR" or processing.get("aligner_version") != "2.7.11b":
        raise ValueError("Expected the pinned STAR raw-count workflow")
    if not re.fullmatch(r"[a-f0-9]{64}", processing.get("aligner_binary_sha256", "")):
        raise ValueError("Processing receipt lacks the patched STAR binary identity")
    if execution.get("executed_code_cells", 0) < 1 or not re.fullmatch(r"[a-f0-9]{64}", execution.get("notebook_sha256", "")):
        raise ValueError("Notebook execution receipt is incomplete")
    contrasts = source["contrasts"]
    if not contrasts or len({item["contrast_id"] for item in contrasts}) != len(contrasts):
        raise ValueError("Expected distinct count-model contrasts")
    args.out.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.out.with_name(args.out.name + ".partial")
    total = 0
    with temporary.open("w") as output:
        for contrast in contrasts:
            contrast_id = contrast["contrast_id"]
            if not re.fullmatch(r"[A-Za-z0-9_.:-]{4,100}", contrast_id) or not contrast_id.startswith(study + ":"):
                raise ValueError(f"Invalid contrast ID: {contrast_id}")
            relative = contrast["results"]
            result_path = project_file(root, relative)
            result_sha = digest(result_path)
            if execution.get("artifacts_written", {}).get(relative) != result_sha:
                raise ValueError(f"Notebook execution did not record the result table: {relative}")
            if not contrast.get("limitations"):
                raise ValueError(f"Contrast lacks limitations: {contrast_id}")
            if not contrast.get("artifact_url", "").startswith("https://"):
                raise ValueError(f"Contrast lacks an HTTPS result artifact URL: {contrast_id}")
            seen = set()
            adjusted_values = 0
            with result_path.open(newline="") as stream:
                reader = csv.DictReader(stream, delimiter="\t")
                if not REQUIRED_COLUMNS.issubset(reader.fieldnames or ()):
                    raise ValueError(f"Result columns are incomplete: {relative}")
                for row in reader:
                    gene = row["gene_id"]
                    if not gene or gene in seen:
                        raise ValueError(f"Missing or repeated gene ID in {contrast_id}: {gene}")
                    seen.add(gene)
                    record = {
                        "study_id": study, "contrast_id": contrast_id,
                        "gene_id": gene, "gene_name": row["gene_name"] or None,
                        "base_mean": numeric(row["baseMean"], "baseMean", nonnegative=True),
                        "log2_fold_change": numeric(row["log2FoldChange"], "log2FoldChange"),
                        "standard_error": numeric(row["lfcSE"], "lfcSE", nonnegative=True),
                        "test_statistic": numeric(row["stat"], "stat"),
                        "p_value": numeric(row["pvalue"], "pvalue", probability=True),
                        "adjusted_p_value": numeric(row["padj"], "padj", probability=True),
                        "assay": "bulk RNA-seq; raw integer STAR gene counts",
                        "evidence_class": "replicate-aware count-model estimate",
                        "analysis_version": execution["notebook_sha256"],
                        "result_sha256": result_sha,
                        "processing_receipt_sha256": processing_sha,
                        "execution_receipt_sha256": execution_sha,
                        "source_url": source["source_url"],
                        "artifact_url": contrast["artifact_url"],
                        "limitations": contrast["limitations"],
                    }
                    if record["adjusted_p_value"] is not None:
                        adjusted_values += 1
                    output.write(json.dumps(record, ensure_ascii=False, allow_nan=False) + "\n")
                    total += 1
            if len(seen) < 1000 or adjusted_values == 0:
                raise ValueError(f"Too few tested genes or no adjusted p-values in {contrast_id}")
    temporary.replace(args.out)
    print(json.dumps({"study_id": study, "contrasts": len(contrasts), "rows": total,
                      "out": str(args.out), "sha256": digest(args.out)}))


if __name__ == "__main__":
    main()
