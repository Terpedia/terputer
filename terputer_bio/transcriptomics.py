"""Small, explicit RNA-seq and Perturb-seq preparation helpers.

Processed abundance summaries are descriptive. Formal differential expression
requires raw counts and an identified biological-replicate design.
"""

from __future__ import annotations

import numpy as np
import pandas as pd


def validate_bulk_design(counts: pd.DataFrame, samples: pd.DataFrame, *, minimum_replicates: int = 2) -> None:
    """Reject misaligned, non-count, or unreplicated bulk designs before DE."""
    required = {"sample_id", "condition", "biological_replicate"}
    missing = required - set(samples.columns)
    if missing:
        raise ValueError(f"Sample design is missing {sorted(missing)}")
    if not samples.sample_id.is_unique or not counts.columns.is_unique:
        raise ValueError("Sample IDs must be unique")
    if set(counts.columns) != set(samples.sample_id):
        raise ValueError("Count columns and sample design IDs do not match")
    if counts.empty or counts.index.has_duplicates:
        raise ValueError("Count matrix must have unique feature IDs")
    values = counts.to_numpy()
    if not np.isfinite(values).all() or (values < 0).any() or not np.equal(values, np.floor(values)).all():
        raise ValueError("Formal DE requires finite nonnegative integer counts, not FPKM or TPM")
    if samples.groupby("condition").biological_replicate.nunique().min() < minimum_replicates:
        raise ValueError("Each condition needs independent biological replicates")
    if "batch" in samples and samples.groupby("condition").batch.nunique().eq(1).all() and samples.batch.nunique() == samples.condition.nunique():
        if samples.groupby("condition").batch.first().is_unique:
            raise ValueError("Treatment and batch are perfectly confounded")


def descriptive_fpkm_ratio(expression: pd.DataFrame, sample_groups: dict[str, str], *, control: str, treated: str, pseudocount: float = 0.1) -> pd.DataFrame:
    """Calculate a labeled descriptive ratio from a processed abundance matrix."""
    if pseudocount <= 0 or not np.isfinite(pseudocount):
        raise ValueError("pseudocount must be finite and positive")
    if set(expression.columns) != set(sample_groups):
        raise ValueError("Every expression column must have exactly one sample-group assignment")
    if expression.index.has_duplicates or not expression.columns.is_unique:
        raise ValueError("Feature and sample IDs must be unique")
    values = expression.to_numpy(dtype=float)
    if not np.isfinite(values).all() or (values < 0).any():
        raise ValueError("Processed abundance must be finite and nonnegative")
    left = [sample for sample in expression if sample_groups[sample] == control]
    right = [sample for sample in expression if sample_groups[sample] == treated]
    if not left or not right:
        raise ValueError("Both named groups must have samples")
    control_mean = expression[left].mean(axis=1)
    treated_mean = expression[right].mean(axis=1)
    ratio = np.log2((treated_mean + pseudocount) / (control_mean + pseudocount))
    return pd.DataFrame({"feature": expression.index, "control_mean_fpkm": control_mean.to_numpy(), "treated_mean_fpkm": treated_mean.to_numpy(), "descriptive_log2_ratio": ratio.to_numpy(), "analysis_class": "descriptive_processed_abundance"})


def guide_assignment_qc(assignments: pd.DataFrame) -> pd.DataFrame:
    """Summarize guide assignment without assuming a guide proves an installed edit."""
    required = {"cell_id", "sample_id", "perturbation", "guide_count"}
    if required - set(assignments):
        raise ValueError(f"Assignments need {sorted(required)}")
    if not assignments.cell_id.is_unique:
        raise ValueError("Each cell must have one assignment record")
    if (assignments.guide_count < 0).any():
        raise ValueError("guide_count cannot be negative")
    frame = assignments.copy()
    frame["assignment_class"] = np.select([frame.guide_count.eq(0), frame.guide_count.eq(1)], ["unassigned", "single_guide"], default="multiple_guides")
    return frame.groupby(["sample_id", "assignment_class"], dropna=False).size().rename("cells").reset_index()


def pseudobulk_counts(cell_counts: pd.DataFrame, cells: pd.DataFrame, *, grouping: tuple[str, ...] = ("sample_id", "cell_type", "perturbation")) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Aggregate raw cell-by-feature counts at an independent sample unit."""
    if not cell_counts.index.is_unique or not cells.cell_id.is_unique:
        raise ValueError("Cell IDs must be unique")
    if set(cell_counts.index) != set(cells.cell_id):
        raise ValueError("Count cells and cell metadata do not match")
    if set(grouping) - set(cells):
        raise ValueError("Cell metadata lacks a grouping field")
    values = cell_counts.to_numpy()
    if not np.isfinite(values).all() or (values < 0).any() or not np.equal(values, np.floor(values)).all():
        raise ValueError("Pseudobulk requires raw nonnegative integer counts")
    metadata = cells.set_index("cell_id").loc[cell_counts.index, list(grouping)]
    grouped = cell_counts.groupby([metadata[key] for key in grouping], dropna=False, sort=True)
    matrix = grouped.sum().astype("int64")
    sample_counts = grouped.size().rename("cell_count").reset_index()
    return matrix, sample_counts
