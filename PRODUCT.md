# Terputer product brief

## Goal

Make Terpedia's terpene and natural-product knowledge usable through a conversational research environment that can answer questions, trace evidence, and analyze researcher-provided data.

## Reference review: CATO

CATO presents a workflow of upload → ask → inspect dataset → execute analysis → check assumptions → export. It emphasizes real Python/R execution, visible code, statistical assumptions, literature context, cited systematic reviews, and exportable figures/reports.

Terputer should preserve the transparent, evidence-first workflow while specializing it for Terpedia: structured chemical and biological entities, relationships, curated knowledge, and source-linked literature. It should not imply equivalent breadth of supported file formats, tools, or validated statistical functionality until those are implemented.

## MVP scope

- Conversational research question interface.
- Search Terpedia records and linked literature.
- Claim-level citations with source title, identifier, and relevant excerpt.
- Evidence panel showing entity relationships and provenance.
- Explicit labels for sourced facts, synthesis, and hypotheses.
- Basic CSV/XLSX profiling and mapping to Terpedia entities, with user review before analysis.
- Reproducible analysis artifact containing code, assumptions, inputs, and outputs.

## Out of scope for the first release

- Autonomous clinical recommendations.
- Unreviewed causal or efficacy conclusions.
- Broad claims of systematic-review completeness.
- Arbitrary code execution without isolation and resource limits.

## Success criteria

A researcher can ask a terpene-related question, inspect the supporting Terpedia records and literature, identify uncertainty or missing evidence, and export a result whose sources and methods can be independently checked.
