"""Execute a saved notebook in a fresh kernel and replace it after success."""

from __future__ import annotations

import hashlib
import json
import os
import sys
import tempfile
from pathlib import Path

import nbformat
from nbclient import NotebookClient


def main() -> None:
    if len(sys.argv) != 4:
        raise SystemExit("Usage: notebook-runner.py NOTEBOOK WORKSPACE CELL_TIMEOUT_SECONDS")
    notebook_path = Path(sys.argv[1]).resolve()
    workspace = Path(sys.argv[2]).resolve()
    cell_timeout = int(sys.argv[3])
    if workspace not in notebook_path.parents or notebook_path.parent != workspace / "notebooks":
        raise ValueError("Notebook must be directly under notebooks/")
    if notebook_path.suffix != ".ipynb" or not 1 <= cell_timeout <= 600:
        raise ValueError("Expected an .ipynb notebook and a 1–600 second cell timeout")

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
    print(json.dumps({"path": str(notebook_path.relative_to(workspace)), "executed_code_cells": executed,
                      "sha256": hashlib.sha256(content).hexdigest(), "saved": True,
                      "text_outputs": output_summaries[:10]}))


if __name__ == "__main__":
    main()
