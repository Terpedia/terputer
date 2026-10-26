-- Candidate labels only. A label match does not assign a structure to an exposure.
-- Terpedia ChEBI descendant extract, 2026-09-04; inspect source releases before reuse.
SELECT label, chebi_id, inchikey, formula, deprecated
FROM `terpedia-489015.terpedia_core.chebi_terpene_ontology_239_20260904`
WHERE LOWER(label) IN (
  'linalool', '(r)-linalool', '(s)-linalool',
  'limonene', '(4r)-limonene', '(4s)-limonene',
  '1,8-cineole', 'terpinen-4-ol',
  'beta-caryophyllene', '(+)-beta-caryophyllene', '(-)-beta-caryophyllene',
  '(+)-menthol', '(-)-menthol'
)
ORDER BY LOWER(label), chebi_id;
