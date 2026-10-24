# Terpedia research guidance

- For Terpedia compound, organism, target, assay, pathway, or source-record questions, use the `terpedia` MCP tools when available. Use `search_terpedia_knowledge` for broad questions and `lookup_terpedia_identifier` for stable IDs.
- Preserve returned source identifiers and provenance in research notes and generated notebooks. Do not convert a graph edge, co-occurrence, target prediction, or source label into proof of biological activity or causation.
- Separate retrieved records, literature synthesis, and hypotheses. State when the knowledge API returns no records or is unavailable; do not imply a search succeeded when it did not.
- Treat code from chat as a draft. Never run generated notebook code automatically; review inputs, network access, and filesystem effects first.
