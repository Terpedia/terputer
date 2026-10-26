"""Build the source-pinned chemical identity and replication triage notebook."""

from pathlib import Path

import nbformat


ROOT = Path(__file__).resolve().parents[3]
OUTPUT = ROOT / "notebooks/terputer-chemical-identity-replication-audit.ipynb"

cells = [
    nbformat.v4.new_markdown_cell("""# Terpene exposure identity and replication triage

**Question.** Which curated transcriptomics exposures name the same terpene, and what prevents an exact-compound replication claim?

This notebook audits labels and provenance. It does not reanalyze expression, establish a structural assignment from a name, or estimate replicated biological effects. Inputs are the commit-pinned Terputer contrast manifest and a saved candidate-label query from Terpedia BigQuery's ChEBI extract. The ChEBI rows are **candidate structures**, not assignments to experimental material."""),
    nbformat.v4.new_code_cell("""import csv
import hashlib
import json
from collections import defaultdict
from pathlib import Path

root = Path.cwd()
contrasts_path = root / 'research/transcriptomics/bigquery-ready/contrasts.jsonl'
candidates_path = root / 'research/transcriptomics/chemical_identity/chebi_candidates.tsv'
output_dir = root / 'research/transcriptomics/chemical_identity'

contrasts = [json.loads(line) for line in contrasts_path.read_text().splitlines() if line.strip()]
with candidates_path.open(newline='') as source:
    candidates = list(csv.DictReader(source, delimiter='\\t'))
for path in (contrasts_path, candidates_path):
    print(path.relative_to(root), hashlib.sha256(path.read_bytes()).hexdigest())
print(f'{len(contrasts)} curated contrasts; {len(candidates)} ChEBI candidate labels')"""),
    nbformat.v4.new_markdown_cell("""## Method

Deduplicate repeated dose or comparison rows within a study. Group only by a broad label family to locate studies worth comparing. Keep the source's exact exposure label and stereochemical qualifiers. An exact ChEBI label match is reported as a candidate lookup, never as proof of the administered chemical. A same-family count is not a replication count: organism, formulation, dose, time, controls, and independent biological replication still need harmonization."""),
    nbformat.v4.new_code_cell("""def family(label):
    value = label.lower()
    if 'mentholmint' in value:
        return 'MentholMint formulation'
    if 'menthol' in value:
        return 'menthol; stereochemistry unverified'
    if 'caryophyllene' in value or 'bcp' in value:
        return 'beta-caryophyllene'
    if 'terpinen-4-ol' in value:
        return 'terpinen-4-ol'
    if 'cineole' in value:
        return '1,8-cineole'
    if 'linalool' in value:
        return 'linalool'
    if 'limonene' in value:
        return 'limonene'
    return 'unclassified'

def identity_note(label):
    value = label.lower()
    if 'mentholmint' in value:
        return 'commercial mixture; isolated menthol dose and stereochemistry unknown'
    if any(term in value for term in ('unconfirmed', 'unverified', 'to verify')):
        return 'source audit explicitly leaves stereochemistry unresolved'
    if 'r-(+)-' in value:
        return 'stereochemistry reported; structural crosswalk needs source confirmation'
    return 'name only; lot-level structural identity not verified here'

by_label = {}
for row in contrasts:
    by_label[(row['study_id'], row['chemical_identity'])] = row

lookup = defaultdict(list)
for row in candidates:
    lookup[row['label'].casefold()].append(row['chebi_id'])

identity_rows = []
for (study_id, label), row in sorted(by_label.items()):
    identity_rows.append({
        'study_id': study_id,
        'source_exposure_label': label,
        'label_family_for_triage': family(label),
        'exact_label_chebi_candidates': ';'.join(lookup[label.casefold()]),
        'identity_note': identity_note(label),
        'source_contrast_id': row['contrast_id'],
    })

identity_path = output_dir / 'identity_audit.tsv'
with identity_path.open('w', newline='') as output:
    writer = csv.DictWriter(output, fieldnames=list(identity_rows[0]), delimiter='\\t')
    writer.writeheader(); writer.writerows(identity_rows)
for row in identity_rows:
    print(row['study_id'], '|', row['label_family_for_triage'], '|', row['source_exposure_label'], '| candidates:', row['exact_label_chebi_candidates'] or 'none')"""),
    nbformat.v4.new_code_cell("""grouped = defaultdict(set)
for row in identity_rows:
    grouped[row['label_family_for_triage']].add(row['study_id'])

matrix = []
for label_family, studies in sorted(grouped.items()):
    matrix.append({
        'label_family_for_triage': label_family,
        'study_count': len(studies),
        'study_ids': ';'.join(sorted(studies)),
        'replication_status': 'not established',
        'reason': 'same family label is insufficient to align structure, formulation, design, and independent effects' if len(studies) > 1 else 'only one curated study context',
    })

matrix_path = output_dir / 'replication_triage.tsv'
with matrix_path.open('w', newline='') as output:
    writer = csv.DictWriter(output, fieldnames=list(matrix[0]), delimiter='\\t')
    writer.writeheader(); writer.writerows(matrix)
for row in matrix:
    print(row['label_family_for_triage'], row['study_count'], row['study_ids'], row['replication_status'])"""),
    nbformat.v4.new_markdown_cell("""## Interpretation

The curated manifests contain multiple studies under the broad linalool, limonene, terpinen-4-ol, and β-caryophyllene labels. These are **candidate comparisons**, not replicated metabolic or signaling responses. Some labels expressly leave stereochemistry unresolved. GSE242559 directly applies menthol in an ND7/23 cell-line factorial design, but its stereochemistry is unverified in this audit. GSE263903 instead uses a nicotine-containing commercial MentholMint aerosol in pooled mouse lung libraries. They cannot establish cross-study replication of isolated menthol. The Terpedia ChEBI extract includes distinct stereochemical candidate records for several labels, underscoring why a name-only join is insufficient. A future synthesis needs source-confirmed chemical identity, matched controls and doses, raw count-based within-study effects, replicate-level uncertainty, and a declared orthology or pathway mapping before grading reproducibility or target dependence."""),
]

notebook = nbformat.v4.new_notebook(cells=cells, metadata={"kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"}})
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
nbformat.write(notebook, OUTPUT)
print(OUTPUT.relative_to(ROOT))
