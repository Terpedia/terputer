# Terputer transcriptomics BigQuery adapter

The Cloud Run adapter in `main.py` reads curated evidence from
`terpedia-489015.terpedia_research`. The four existing JSONL manifests in
`research/transcriptomics/bigquery-ready/` are the reviewed source for the
warehouse tables; a successful `/health` response does **not** establish that
the tables contain the latest records.
Study sample and evidence responses report whether their bounded result lists
were truncated. The Cloudflare snapshot fallback preserves those flags so a
client does not treat a partial record list as the complete study.

`schema.sql` also defines `transcriptomic_gene_effects` for raw-count
analyses. `POST /v1/gene-effects/search` returns a named gene's loaded model
estimates with the exact contrast, result hash, processing and notebook
execution receipt hashes, source link, and limitations. It does not infer
pathway activity, target binding, or cross-study replication. An empty result
means only that no matching curated row has been loaded.

After a raw-count notebook completes, use `prepare_gene_effects.py` to create
reviewable JSONL from its saved result tables. The executed HepG2 source
manifest is in the [study repository](https://github.com/Terpedia/terpedia-hepg2-bcp-rsem/blob/main/research/hepg2-bcp-rsem/gene-effects-source.json); its reviewed local export has 15,078 rows and SHA-256 `33c609ad39811e9bfd9676b3dae821452c0139343ae3af0ecf6b3109320e4349`. Its manifest must name the GEO
study ID, assay, HTTPS source URL, project-relative processing and execution receipts,
and each contrast's ID, project-relative result TSV, stable HTTPS artifact URL,
and limitations. The execution receipt must pin the processing receipt as an
input, every count-processing output as an input, and each result TSV as an output. The exporter verifies those hashes and
rejects invalid or duplicate gene rows. This exporter does not load BigQuery;
the existing four-manifest loader also does not load gene effects. Curate the
study and contrast records first, then review and load the exported JSONL with:

```sh
python cloudrun/load_gene_effects.py --input /path/to/gene-effects.jsonl
python cloudrun/load_gene_effects.py --input /path/to/gene-effects.jsonl --apply --gcloud-account dan@terpedia.com
```

The first command is local and read only. The second requires BigQuery write
access, checks the destination schema and curated study/contrast rows, stages
the reviewed JSONL, then atomically replaces the complete affected contrasts.
It does not leave stale gene rows from an earlier version of those contrasts.
Check the destination row counts and authenticated lookup after loading before
claiming Terpedia chat can retrieve the new effects.
The Worker MCP tool is enabled after the deployed adapter returned a named
HMGCR row from the loaded table with its shared-key authentication.

## Reader access and deployed state

On 27 October 2026, the curated manifests were applied to BigQuery and the
Cloud Run adapter was deployed. Its authenticated `/ready` route returned 200;
the studies search returned GSE125511; and the gene-effect route returned an
HMGCR row from GSE276099. The named `cannabis-metabolome` account also queried
the curated tables after receiving dataset reader access. The Cloudflare Worker
keeps a commit-pinned public snapshot fallback, labeled when used.

To inspect or repair reader access in a different deployment, sign in with a
project administrator and run:

```sh
gcloud auth login
python cloudrun/grant_reader_access.py
python cloudrun/grant_reader_access.py \
  --reader-service-account cannabis-metabolome@terpedia-489015.iam.gserviceaccount.com
python cloudrun/grant_reader_access.py \
  --reader-service-account cannabis-metabolome@terpedia-489015.iam.gserviceaccount.com --apply
```

The script discovers the deployed service account rather than assuming that
the locally available `cannabis-metabolome` account runs the adapter. The
explicit additional reader flag grants the named local account the same
read-only query access; it does not grant table write or load permissions.
It adds dataset `READER` access (equivalent to BigQuery Data Viewer) and project
`roles/bigquery.jobUser` only when absent. It stops if the dataset does not
exist, the Cloud Run service has no dedicated service account, or either IAM
policy cannot be read. The administrator needs `run.services.get`,
`bigquery.datasets.get`, `bigquery.datasets.update`,
`resourcemanager.projects.getIamPolicy`, and
`resourcemanager.projects.setIamPolicy`. After IAM propagation, make an
authenticated `/v1/studies/search` call through the Worker to verify the
runtime can query; `/health` alone does not exercise BigQuery.

## Load after access is restored

Use a credential with permission to create query jobs and to read, create,
update, and delete tables in `terpedia_research`. From the repository root:

```sh
bq --project_id=terpedia-489015 query --use_legacy_sql=false < cloudrun/schema.sql
python cloudrun/load_records.py
python cloudrun/load_records.py --apply --gcloud-account dan@terpedia.com
```

The loader reviews all four manifests, checks study/sample accession consistency,
source SHA-256 syntax, timestamp format, destination schemas, and duplicate keys, stages all rows,
then commits the four upserts in one
transaction. Existing rows outside the manifests are retained. If schema
creation is already complete, the first command is safe to rerun.
Source manifests with retrieval-date precision are represented as midnight UTC
in BigQuery's existing `retrieved_at` timestamp column; that clock time is not
an observed retrieval time.

After deployment, call `GET /ready` with the same `X-Terputer-Tool-Key` used
for research queries. A 200 response proves that the deployed runtime can
start a BigQuery job and read the curated studies table. A 503 response means
the adapter is running but its dataset, table, or IAM access is unavailable.
`/health` checks only that the HTTP process is running.

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

The current manifests contain 11 studies, 88 samples, 18 contrasts, and 57
observations. Warehouse counts may be larger because the upsert retains
unrelated existing rows. Confirm both new GEO records and their related rows,
then check the authenticated adapter endpoints before claiming BigQuery is
current. The Worker snapshot must not be presented as a successful warehouse
load.

The additional GSE276099 contrast distinguishes the receipt-pinned STAR/PyDESeq2
raw-count estimate from the earlier processed fractional-matrix contrast.
Two observation rows summarize its FDR thresholds. Load these curated rows
before attempting `load_gene_effects.py` for the 15,078 per-gene effects;
the gene-effect loader requires its study and contrast keys to exist.
