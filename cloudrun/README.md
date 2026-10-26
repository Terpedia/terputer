# Terputer transcriptomics BigQuery adapter

The Cloud Run adapter in `main.py` reads curated evidence from
`terpedia-489015.terpedia_research`. The four JSONL manifests in
`research/transcriptomics/bigquery-ready/` are the reviewed source for the
warehouse tables; a successful `/health` response does **not** establish that
the tables contain the latest records.

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
 WHERE study_id = 'GSE263903';
```

The current manifests contain 9 studies, 70 samples, 14 contrasts, and 42
observations. Warehouse counts may be larger because the upsert retains
unrelated existing rows. Confirm the GSE263903 record and its related rows,
then check the authenticated adapter endpoints before claiming BigQuery is
current. The Worker snapshot must not be presented as a successful warehouse
load.
