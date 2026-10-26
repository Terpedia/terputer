CREATE SCHEMA IF NOT EXISTS `terpedia-489015.terpedia_research` OPTIONS(location="us-central1");

CREATE TABLE IF NOT EXISTS `terpedia-489015.terpedia_research.transcriptomic_studies` (
  study_id STRING NOT NULL,
  accession STRING NOT NULL,
  title STRING,
  organism STRING,
  assay STRING,
  source_url STRING,
  evidence_class STRING,
  source_sha256 STRING,
  source_revision STRING,
  retrieved_at TIMESTAMP,
  limitations STRING
)
CLUSTER BY accession, organism;

CREATE TABLE IF NOT EXISTS `terpedia-489015.terpedia_research.transcriptomic_samples` (
  study_id STRING NOT NULL,
  accession STRING NOT NULL,
  sample_id STRING NOT NULL,
  archive_accession STRING,
  organism STRING,
  condition STRING,
  time_label STRING,
  dose STRING,
  source_url STRING,
  source_revision STRING
)
CLUSTER BY accession, condition;

CREATE TABLE IF NOT EXISTS `terpedia-489015.terpedia_research.transcriptomic_contrasts` (
  contrast_id STRING NOT NULL,
  study_id STRING NOT NULL,
  chemical_identity STRING,
  condition STRING,
  control STRING,
  assay STRING,
  feature_universe INT64,
  effect_class STRING,
  analysis_version STRING,
  artifact_url STRING,
  source_sha256 STRING,
  limitations STRING
)
CLUSTER BY study_id, chemical_identity;

CREATE TABLE IF NOT EXISTS `terpedia-489015.terpedia_research.transcriptomic_observations` (
  observation_id STRING NOT NULL,
  study_id STRING NOT NULL,
  comparison STRING,
  metric STRING,
  value FLOAT64,
  feature_universe INT64,
  evidence_class STRING,
  method STRING,
  source_url STRING,
  source_sha256 STRING,
  analysis_version STRING,
  limitations STRING
)
CLUSTER BY study_id, metric;
