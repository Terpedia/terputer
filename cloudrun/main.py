"""Scale-to-zero, read-only BigQuery adapter for Terputer transcriptomics."""
from __future__ import annotations

import os
import re
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from google.cloud import bigquery

PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT", "terpedia-489015")
DATASET = os.getenv("TERPUTER_BIGQUERY_DATASET", "terpedia_research")
if not re.fullmatch(r"[A-Za-z0-9_-]+", PROJECT) or not re.fullmatch(r"[A-Za-z0-9_]+", DATASET):
    raise RuntimeError("Invalid BigQuery project or dataset")

app = FastAPI(title="Terputer transcriptomics BigQuery adapter")
client = None


def authorized(token: str | None):
    from hmac import compare_digest
    expected = os.getenv("TERPUTER_TOOL_SHARED_KEY", "")
    if not expected or not token or not compare_digest(token, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")


def query(sql: str, params: list[bigquery.ScalarQueryParameter]):
    global client
    if client is None:
        client = bigquery.Client(project=PROJECT)
    job = client.query(sql, job_config=bigquery.QueryJobConfig(query_parameters=params, maximum_bytes_billed=1_000_000_000))
    return [dict(row.items()) for row in job.result(max_results=100)]


class Search(BaseModel):
    query: str = Field(min_length=2, max_length=200)
    limit: int = Field(default=10, ge=1, le=30)


@app.get("/health")
def health():
    return {"status": "ok", "service": "terputer-transcriptomics", "dataset": DATASET}


@app.post("/v1/studies/search")
def search_studies(request: Search, x_terputer_tool_key: str | None = Header(default=None)):
    authorized(x_terputer_tool_key)
    table = f"`{PROJECT}.{DATASET}.transcriptomic_studies`"
    rows = query(f"SELECT study_id, accession, title, organism, assay, source_url, evidence_class, source_sha256 FROM {table} WHERE LOWER(CONCAT(accession, ' ', title, ' ', organism, ' ', assay)) LIKE CONCAT('%', LOWER(@term), '%') ORDER BY accession LIMIT @limit", [bigquery.ScalarQueryParameter("term", "STRING", request.query), bigquery.ScalarQueryParameter("limit", "INT64", request.limit)])
    return {"records": rows, "source": f"bigquery://{PROJECT}.{DATASET}.transcriptomic_studies"}


@app.get("/v1/studies/{accession}/samples")
def study_samples(accession: str, x_terputer_tool_key: str | None = Header(default=None)):
    authorized(x_terputer_tool_key)
    if not re.fullmatch(r"[A-Za-z0-9_-]{4,30}", accession):
        raise HTTPException(status_code=400, detail="Invalid accession")
    table = f"`{PROJECT}.{DATASET}.transcriptomic_samples`"
    rows = query(f"SELECT study_id, accession, sample_id, archive_accession, organism, condition, time_label, dose, source_url FROM {table} WHERE accession = @accession ORDER BY sample_id LIMIT 100", [bigquery.ScalarQueryParameter("accession", "STRING", accession)])
    return {"accession": accession, "samples": rows, "source": f"bigquery://{PROJECT}.{DATASET}.transcriptomic_samples"}


@app.get("/v1/studies/{accession}/contrasts")
def study_contrasts(accession: str, x_terputer_tool_key: str | None = Header(default=None)):
    authorized(x_terputer_tool_key)
    if not re.fullmatch(r"[A-Za-z0-9_-]{4,30}", accession):
        raise HTTPException(status_code=400, detail="Invalid accession")
    table = f"`{PROJECT}.{DATASET}.transcriptomic_contrasts`"
    rows = query(f"SELECT contrast_id, study_id, chemical_identity, condition, control, assay, feature_universe, effect_class, analysis_version, artifact_url, source_sha256, limitations FROM {table} WHERE study_id = @accession ORDER BY contrast_id LIMIT 100", [bigquery.ScalarQueryParameter("accession", "STRING", accession)])
    return {"accession": accession, "contrasts": rows, "source": f"bigquery://{PROJECT}.{DATASET}.transcriptomic_contrasts", "interpretation": "Contrast metadata and descriptive effects are not differential-expression or pathway evidence."}
