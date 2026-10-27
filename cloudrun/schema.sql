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

-- Only count-model results with a saved analysis and provenance receipt belong
-- here. Processed FPKM ratios remain in transcriptomic_observations.
CREATE TABLE IF NOT EXISTS `terpedia-489015.terpedia_research.transcriptomic_gene_effects` (
  study_id STRING NOT NULL,
  contrast_id STRING NOT NULL,
  gene_id STRING NOT NULL,
  gene_name STRING,
  base_mean FLOAT64,
  log2_fold_change FLOAT64,
  standard_error FLOAT64,
  test_statistic FLOAT64,
  p_value FLOAT64,
  adjusted_p_value FLOAT64,
  assay STRING,
  evidence_class STRING,
  analysis_version STRING,
  result_sha256 STRING,
  processing_receipt_sha256 STRING,
  execution_receipt_sha256 STRING,
  source_url STRING,
  artifact_url STRING,
  limitations STRING
)
CLUSTER BY study_id, gene_name, contrast_id;
