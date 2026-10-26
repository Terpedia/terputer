"""Prepare reviewable BigQuery JSONL from pinned local research manifests.

This script does not mutate BigQuery. Load only after curatorial review.
"""
from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'research/transcriptomics/data'
OUT = ROOT / 'research/transcriptomics/bigquery-ready'
OUT.mkdir(parents=True, exist_ok=True)


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def write(name: str, rows: list[dict]):
    with (OUT / name).open('w') as stream:
        for row in rows:
            stream.write(json.dumps(row, ensure_ascii=False) + '\n')

bulk = json.loads((DATA / 'run_manifest.json').read_text())
selected = list(csv.DictReader((DATA / 'selected_sample_manifest.tsv').open(), delimiter='\t'))
studies = [
    dict(study_id='GSE136998', accession='GSE136998', title='Linalool exposure in Listeria monocytogenes', organism='Listeria monocytogenes', assay='bulk RNA-seq; processed RSEM FPKM', source_url='https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE136998', evidence_class='processed expression matrix; descriptive comparison', source_sha256=bulk['source_sha256'], source_revision=None, retrieved_at=bulk['retrieved_at_utc'], limitations='Three samples per arm; FPKM is not count-based differential expression; gene annotation crosswalk needed'),
    dict(study_id='GSE138291', accession='GSE138291', title='Tea tree oil and component exposure in Botrytis cinerea', organism='Botrytis cinerea B05.10', assay='bulk RNA-seq; processed FPKM', source_url='https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE138291', evidence_class='processed expression matrix; descriptive comparison', source_sha256=digest(DATA / 'GSE138291_All_gene_fpkm.list.txt.txt.gz'), source_revision=None, retrieved_at=None, limitations='Shared untreated control can inflate pairwise arm similarity; FPKM is not count-based differential expression'),
    dict(study_id='PRJNA608617', accession='PRJNA608617', title='R-(+)-limonene exposure candidate cohort', organism=next(x['organism'] for x in selected if x['study']=='PRJNA608617'), assay='RNA-seq metadata', source_url='https://www.ebi.ac.uk/ena/browser/view/PRJNA608617', evidence_class='metadata only; unanalysed', source_sha256=None, source_revision=None, retrieved_at=None, limitations='No expression or differential expression computed in Terputer'),
    dict(study_id='PRJNA913446', accession='PRJNA913446', title='Linalool exposure candidate cohort', organism=next(x['organism'] for x in selected if x['study']=='PRJNA913446'), assay='RNA-seq metadata', source_url='https://www.ebi.ac.uk/ena/browser/view/PRJNA913446', evidence_class='metadata only; unanalysed', source_sha256=None, source_revision=None, retrieved_at=None, limitations='No expression or differential expression computed in Terputer'),
]
samples = [dict(study_id=r['study'], accession=r['study'], sample_id=r['sample'], archive_accession=r['archive_accession'], organism=r['organism'], condition=r['arm'], time_label=r['time'], dose=r['dose'], source_url=r['source'], source_revision=None) for r in selected]
samples += [dict(study_id='GSE136998', accession='GSE136998', sample_id=sample, archive_accession=None, organism='Listeria monocytogenes', condition=condition, time_label='8 h', dose='1x MIC' if condition != 'control' else '0', source_url=bulk['source_url'], source_revision=None) for sample, condition in bulk['samples'].items()]
contrasts = [
    dict(contrast_id='GSE136998:linalool-vs-control', study_id='GSE136998', chemical_identity='linalool', condition='8 h, 1x MIC', control='untreated', assay='processed RSEM FPKM', feature_universe=2976, effect_class='descriptive log2 FPKM ratio', analysis_version='terputer-transcriptomics-2026-10-26', artifact_url='research/transcriptomics/results/gse136998_descriptive_effects.tsv', source_sha256=bulk['source_sha256'], limitations='No p-values/FDR; not independent evidence of reproducibility'),
    dict(contrast_id='GSE138291:cineole-vs-control', study_id='GSE138291', chemical_identity='1,8-cineole', condition='2 h', control='untreated', assay='processed FPKM', feature_universe=11456, effect_class='descriptive log2 FPKM ratio', analysis_version='terputer-transcriptomics-2026-10-26', artifact_url='research/transcriptomics/results/gse138291_descriptive_ratios.tsv', source_sha256=studies[1]['source_sha256'], limitations='Shared control among treatment arms; no formal DE'),
    dict(contrast_id='GSE138291:terpinen-4-ol-vs-control', study_id='GSE138291', chemical_identity='terpinen-4-ol', condition='2 h', control='untreated', assay='processed FPKM', feature_universe=11456, effect_class='descriptive log2 FPKM ratio', analysis_version='terputer-transcriptomics-2026-10-26', artifact_url='research/transcriptomics/results/gse138291_descriptive_ratios.tsv', source_sha256=studies[1]['source_sha256'], limitations='Shared control among treatment arms; no formal DE'),
]
write('studies.jsonl', studies)
write('samples.jsonl', samples)
write('contrasts.jsonl', contrasts)
summary = json.loads((ROOT / 'research/transcriptomics/results/analysis_summary.json').read_text())
observations = [
    dict(observation_id='GSE138291:pure:spearman', study_id='GSE138291', comparison='1,8-cineole vs terpinen-4-ol; each vs shared untreated control', metric='spearman_descriptive_log2_fpkm_ratio', value=summary['botrytis_arm_comparisons'][0]['spearman'], feature_universe=summary['botrytis_arm_comparisons'][0]['features_control_fpkm_at_least_1'], evidence_class='processed FPKM descriptive', method='Mean FPKM log2 ratio with 0.1 pseudocount; control mean FPKM >= 1; Spearman across features', source_url=studies[1]['source_url'], source_sha256=studies[1]['source_sha256'], analysis_version='terputer-transcriptomics-2026-10-26', limitations='Shared untreated denominator can inflate correlation; no replicate-level uncertainty or cross-study replication'),
    dict(observation_id='GSE138291:pure:sign_agreement', study_id='GSE138291', comparison='1,8-cineole vs terpinen-4-ol; each vs shared untreated control', metric='sign_agreement_descriptive_log2_fpkm_ratio', value=summary['botrytis_arm_comparisons'][0]['sign_agreement'], feature_universe=summary['botrytis_arm_comparisons'][0]['features_control_fpkm_at_least_1'], evidence_class='processed FPKM descriptive', method='Mean FPKM log2 ratio with 0.1 pseudocount; control mean FPKM >= 1; matching signs across features', source_url=studies[1]['source_url'], source_sha256=studies[1]['source_sha256'], analysis_version='terputer-transcriptomics-2026-10-26', limitations='Shared untreated denominator and near-zero effects limit interpretation; no formal significance'),
]
write('observations.jsonl', observations)
print(json.dumps({'studies': len(studies), 'samples': len(samples), 'contrasts': len(contrasts), 'observations': len(observations), 'directory': str(OUT)}))
