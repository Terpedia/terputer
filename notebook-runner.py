"""Execute a saved notebook in a fresh kernel and replace it after success."""

from __future__ import annotations

import hashlib
import json
import os
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import nbformat
from nbclient import NotebookClient


def main() -> None:
    if len(sys.argv) not in (4, 5):
        raise SystemExit("Usage: notebook-runner.py NOTEBOOK WORKSPACE CELL_TIMEOUT_SECONDS [ARTIFACT_PATHS_JSON]")
    notebook_path = Path(sys.argv[1]).resolve()
    workspace = Path(sys.argv[2]).resolve()
    cell_timeout = int(sys.argv[3])
    if workspace not in notebook_path.parents or notebook_path.parent != workspace / "notebooks":
        raise ValueError("Notebook must be directly under notebooks/")
    if notebook_path.suffix != ".ipynb" or not 1 <= cell_timeout <= 600:
        raise ValueError("Expected an .ipynb notebook and a 1–600 second cell timeout")

    artifact_names = json.loads(sys.argv[4]) if len(sys.argv) == 5 else []
    if not isinstance(artifact_names, list) or len(artifact_names) > 50 or any(not isinstance(name, str) for name in artifact_names) or len(set(artifact_names)) != len(artifact_names):
        raise ValueError("Expected up to 50 distinct artifact paths")
    artifact_paths = {}
    artifact_before = {}
    for name in artifact_names:
        if not isinstance(name, str) or not name.startswith("research/"):
            raise ValueError("Artifact paths must be relative to research/")
        path = (workspace / name).resolve()
        if workspace / "research" not in path.parents or not path.is_relative_to(workspace):
            raise ValueError("Artifact path leaves the research workspace")
        if path.relative_to(workspace).as_posix() != name:
            raise ValueError("Artifact paths must use normalized workspace-relative names")
        artifact_paths[name] = path
        artifact_before[name] = path.stat() if path.exists() else None

    source_sha256 = hashlib.sha256(notebook_path.read_bytes()).hexdigest()
    notebook = nbformat.read(notebook_path, as_version=4)
    with tempfile.TemporaryDirectory(prefix="terputer-kernel-") as kernel_root:
        kernel_path = Path(kernel_root) / "kernels" / "terputer-runner"
        kernel_path.mkdir(parents=True)
        (kernel_path / "kernel.json").write_text(json.dumps({
            "argv": [sys.executable, "-m", "ipykernel_launcher", "-f", "{connection_file}"],
            "display_name": "Terputer Python", "language": "python",
        }))
        previous_jupyter_path = os.environ.get("JUPYTER_PATH")
        os.environ["JUPYTER_PATH"] = os.pathsep.join(filter(None, [kernel_root, previous_jupyter_path]))
        try:
            notebook = NotebookClient(
                notebook,
                timeout=cell_timeout,
                kernel_name="terputer-runner",
                resources={"metadata": {"path": str(workspace)}},
                allow_errors=False,
            ).execute()
        finally:
            if previous_jupyter_path is None:
                os.environ.pop("JUPYTER_PATH", None)
            else:
                os.environ["JUPYTER_PATH"] = previous_jupyter_path
    executed = sum(cell.cell_type == "code" and cell.execution_count is not None for cell in notebook.cells)
    if not executed:
        raise ValueError("Notebook contains no executed code cells")
    artifact_hashes = {}
    for name, path in artifact_paths.items():
        if not path.is_file():
            raise ValueError(f"Declared output was not created: {name}")
        before = artifact_before[name]
        after = path.stat()
        if before is not None and (before.st_mtime_ns, before.st_ctime_ns, before.st_ino, before.st_size) == (after.st_mtime_ns, after.st_ctime_ns, after.st_ino, after.st_size):
            raise ValueError(f"Declared output was not written during this run: {name}")
        digest = hashlib.sha256()
        with path.open("rb") as stream:
            while chunk := stream.read(1 << 20):
                digest.update(chunk)
        artifact_hashes[name] = digest.hexdigest()
    notebook.metadata["terputer_execution"] = {"runner": "terputer-notebook-runner-v1",
                                               "python_version": sys.version.split()[0],
                                               "executed_code_cells": executed}
    output_summaries = []
    for index, cell in enumerate(notebook.cells):
        if cell.cell_type != "code":
            continue
        snippets = []
        for item in cell.get("outputs", []):
            value = item.get("text", item.get("data", {}).get("text/plain", ""))
            if isinstance(value, list):
                value = "".join(value)
            if value:
                snippets.append(str(value)[:1500])
        if snippets:
            output_summaries.append({"cell_index": index, "text": "\n".join(snippets)[:2000]})
    with tempfile.NamedTemporaryFile(mode="w", suffix=".ipynb", prefix=".terputer-", dir=notebook_path.parent, delete=False) as output:
        temporary_path = Path(output.name)
        nbformat.write(notebook, output)
    try:
        os.replace(temporary_path, notebook_path)
    finally:
        temporary_path.unlink(missing_ok=True)
    content = notebook_path.read_bytes()
    notebook_sha256 = hashlib.sha256(content).hexdigest()
    receipt_path = workspace / "research" / "execution-receipts" / f"{notebook_path.stem}.json"
    receipt_path.parent.mkdir(parents=True, exist_ok=True)
    receipt = {
        "schema_version": 2,
        "runner": "terputer-notebook-runner-v1",
        "notebook": str(notebook_path.relative_to(workspace)),
        "source_notebook_sha256": source_sha256,
        "notebook_sha256": notebook_sha256,
        "executed_code_cells": executed,
        "artifacts_written": artifact_hashes,
        "python_version": sys.version.split()[0],
        "completed_at_utc": datetime.now(timezone.utc).isoformat(),
    }
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", prefix=".terputer-", dir=receipt_path.parent, delete=False) as output:
        receipt_temporary_path = Path(output.name)
        json.dump(receipt, output, indent=2)
        output.write("\n")
    try:
        os.replace(receipt_temporary_path, receipt_path)
    finally:
        receipt_temporary_path.unlink(missing_ok=True)
    print(json.dumps({"path": str(notebook_path.relative_to(workspace)), "executed_code_cells": executed,
                      "sha256": notebook_sha256, "execution_receipt": str(receipt_path.relative_to(workspace)),
                      "artifacts_written": artifact_hashes, "saved": True,
                      "text_outputs": output_summaries[:10]}))


if __name__ == "__main__":
    main()
