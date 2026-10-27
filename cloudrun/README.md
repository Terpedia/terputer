# Terputer transcriptomics BigQuery adapter

The Cloud Run adapter in `main.py` reads curated evidence from
`terpedia-489015.terpedia_research`. The four existing JSONL manifests in
`research/transcriptomics/bigquery-ready/` are the reviewed source for the
warehouse tables; a successful `/health` response does **not** establish that
the tables contain the latest records.

`schema.sql` also defines `transcriptomic_gene_effects` for future raw-count
analyses. `POST /v1/gene-effects/search` returns a named gene's loaded model
estimates with the exact contrast, result hash, processing and notebook
execution receipt hashes, source link, and limitations. It does not infer
pathway activity, target binding, or cross-study replication. An empty result
means only that no matching curated row has been loaded.

After a raw-count notebook completes, use `prepare_gene_effects.py` to create
reviewable JSONL from its saved result tables. Its manifest must name the GEO
study ID, assay, HTTPS source URL, project-relative processing and execution receipts,
and each contrast's ID, project-relative result TSV, stable HTTPS artifact URL,
and limitations. The execution receipt must pin the processing receipt as an
input, every count-processing output as an input, and each result TSV as an output. The exporter verifies those hashes and
rejects invalid or duplicate gene rows. This exporter does not load BigQuery;
the existing four-manifest loader also does not load gene effects. Curate the
study and contrast records first, then review and load the exported JSONL with:

```sh
python cloudrun/load_gene_effects.py --input /path/to/gene-effects.jsonl
python cloudrun/load_gene_effects.py --input /path/to/gene-effects.jsonl --apply
```

The first command is local and read only. The second requires BigQuery write
access, checks the destination schema and curated study/contrast rows, stages
the reviewed JSONL, then atomically replaces the complete affected contrasts.
It does not leave stale gene rows from an earlier version of those contrasts.
Check the destination row counts and authenticated lookup after loading before
claiming Terpedia chat can retrieve the new effects.
The tool is hidden on both local and Worker MCP surfaces until
`TERPUTER_GENE_EFFECTS_ENABLED=true` is set after that verification.

## Current deployment gate

The available `cannabis-metabolome@terpedia-489015.iam.gserviceaccount.com`
credential can list `terpedia_core`, but BigQuery denies it
`bigquery.datasets.get` and `bigquery.tables.list` on `terpedia_research`.
The interactive `dan@terpedia.com` gcloud credential requires reauthentication.
As of 26 October 2026, the expanded manifests have **not** been applied to
BigQuery. The Cloudflare Worker serves the commit-pinned public snapshot when
the adapter is unavailable or incomplete; that fallback is labeled as such.

## Load after access is restored

Use a credential with permission to create query jobs and to read, create,
update, and delete tables in `terpedia_research`. From the repository root:

```sh
bq --project_id=terpedia-489015 query --use_legacy_sql=false < cloudrun/schema.sql
python cloudrun/load_records.py
python cloudrun/load_records.py --apply
```

The loader reviews all four manifests, checks the destination schemas and
duplicate keys, stages all rows, then commits the four upserts in one
transaction. Existing rows outside the manifests are retained. If schema
creation is already complete, the first command is safe to rerun.

After the load, query all four table counts and the newest study directly:

```sql
SELECT 'studies' AS table_name, COUNT(*) AS row_count
  FROM `terpedia-489015.terpedia_research.transcriptomic_studies`
UNION ALL SELECT 'samples', COUNT(*)
  FROM `terpedia-489015.terpedia_research.transcriptomic_samples`
UNION ALL SELECT 'contrasts', COUNT(*)
  FROM `terpedia-489015.terpedia_research.transcriptomic_contrasts`
UNION ALL SELECT 'observations', COUNT(*)
  FROM `terpedia-489015.terpedia_research.transcriptomic_observations`;

SELECT study_id, accession, title
  FROM `terpedia-489015.terpedia_research.transcriptomic_studies`
 WHERE study_id IN ('GSE263903', 'GSE242559');
```

The current manifests contain 10 studies, 82 samples, 16 contrasts, and 52
observations. Warehouse counts may be larger because the upsert retains
unrelated existing rows. Confirm both new GEO records and their related rows,
then check the authenticated adapter endpoints before claiming BigQuery is
current. The Worker snapshot must not be presented as a successful warehouse
load.
