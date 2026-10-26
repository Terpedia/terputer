# Terputer

Terputer is a repo-backed, Codespaces-native bioinformatics workspace. It combines Terpedia research chat with editable Jupyter notebook cells and a Python kernel inside the user's own GitHub Codespace.

The public [Terputer Codespace example](https://terputer.terpedia.com) opens a ready-to-run transcriptomics workspace. Its [example repository](https://github.com/Terpedia/terpedia-transcriptomics-demo) includes the executed notebook, white paper, critical review, and pinned data. The [example overview](https://terputer.terpedia.com/about) links to each artifact.

## Remote research MCP

Connect an MCP client over Streamable HTTP at `https://terputer.terpedia.com/mcp`. The [API index](https://terputer.terpedia.com/api) lists the tools. Public access includes read-only GEO, PubMed, and ENA metadata discovery. Curated Terpedia BigQuery study and sample search, plus Terpedia Knowledge search, require a Terputer bearer token supplied as the `Authorization` header. The direct `POST /v1/tools/call` adapter uses the same token. The root URL continues to open the Codespace example.

The remote MCP has no access to a user's Codespace files or Python kernel. Those tools remain available through the workspace's local stdio MCP server. The BigQuery adapter runs on Cloud Run with a dedicated service account that can read the `terpedia_research` dataset; its shared key is stored in Secret Manager and Cloudflare Worker secrets.

## User workflow

1. Push this repository to GitHub.
2. Create a Codespace from the repository using the included `.devcontainer` configuration.
3. The Codespace installs Node, Python, Jupyter, and the app. Its private forwarded port opens Terputer.
4. Connect GitHub in Terputer, then ask for a white paper or research paper. Terpedia creates a private `terpedia-*` project repository with a Jupyter notebook and a Markdown manuscript draft.
5. Open the project repository in Codespaces to review and run the notebook. Colab remains available as an optional notebook viewer/runtime.

Notebooks are stored under `notebooks/` in the current Codespace checkout. The notebook itself is standard Jupyter `nbformat` 4 and can also be opened in Jupyter or VS Code. The app does not create, start, commit, or push Codespaces on behalf of the user; GitHub remains the owner of repository and Codespace lifecycle.

## Local development

```sh
npm ci
npm run dev
```

The full runtime requires the Python dependencies in `requirements.txt`. The devcontainer starts both the app and the Python kernel service. For local development, start them with:

```sh
python -m pip install -r requirements.txt
python -m ipykernel install --user --name python3 --display-name "Python 3 (Terputer)"
bash .devcontainer/start.sh
```

## Terpedia integration

The browser calls the Node server. The server proxies BigQuery-backed searches to the Terpedia Knowledge API, research requests to the Terpedia chat backend, and kernel execution to the local Python kernel service. GitHub OAuth uses the chat backend and returns a signed session to Terputer. The chat proxy forwards that session to the research endpoint; it never receives a GitHub access token. Configure `TERPEDIA_KNOWLEDGE_API_KEY` as a Codespaces secret. `TERPEDIA_CHAT_API_URL` can override the default `https://api.terpedia.com` for local development. Never prefix server secrets with `VITE_`.

The MCP server exposes `search_terpedia_knowledge` and `lookup_terpedia_identifier`. In VS Code/Codespaces, accept the workspace MCP server trust prompt, then enable these tools in Copilot Chat if they are not active. Check MCP Servers in the Chat customizations UI to confirm the server starts. The workspace config does not grant Copilot access to other Terpedia services or to arbitrary BigQuery SQL. The API key is not in `.mcp.json`; it must be present in the Codespace environment before the Node server starts.

Generated Python is a draft. The app does not run generated cells automatically; a user must inspect and run each cell. Code runs with the current user's Codespace permissions and filesystem access. Do not run untrusted notebooks in a Codespace containing secrets you do not want that code to access.

## Current scope

The app supports chat-to-report drafting, editable Markdown/Python cells, per-cell execution in the Codespace kernel, saving/opening `.ipynb` files in the repo checkout, and downloading a notebook. Project collaboration, autosave, kernel restart controls, richer Jupyter outputs, and persistent chat history remain future work.

## Transcriptomics research workspace

The [executed notebook](notebooks/terputer-transcriptomics.ipynb), [white paper](research/transcriptomics/white-paper.md), and [critical review](research/transcriptomics/critical-review.md) cover linalool bulk RNA-seq, a second fungal terpene exposure study, and an A549 Perturb-seq context demonstration. Derived tables are under `research/transcriptomics/results/`; pinned source inputs and manifests are under `research/transcriptomics/data/`.

The public [paclitaxel single-cell example](https://github.com/Terpedia/terpedia-paclitaxel-single-cell) and its [executed notebook](https://github.com/Terpedia/terpedia-paclitaxel-single-cell/blob/main/notebooks/terputer-paclitaxel-single-cell.ipynb) demonstrate a time-matched chemical exposure analysis and claim-linked report. A copy of its script, result artifacts, and generated brief also lives in this workspace. It has one library per condition, so the response patterns are descriptive rather than biologically replicated.

## Report generation pipeline

The local `generate_research_report` tool turns a structured report specification and an executed Jupyter notebook into `white-paper.md`, `claim-ledger.tsv`, and `generation-receipt.json` under `research/<slug>/generated/`. It checks source URLs, claim evidence classes, referenced local artifacts, notebook execution metadata, and input hashes. Observed claims require a result artifact and at least one executed code cell; proposed claims are labeled in the report. It does not judge whether a scientific claim is true, so the generated paper still needs expert review.

The checked-in [transcriptomics report specification](research/transcriptomics/report-spec.json) illustrates the format. Regenerate its report locally with:

```sh
node report-generator.mjs research/transcriptomics/report-spec.json
```

The research agent can create a new specification and invoke the same tool in a Codespace. This pipeline writes workspace files only; publication to GitHub or `research/` remains a separate reviewable action.

The in-app research agent uses `TERPUTER_OPENROUTER_API_KEY` and exposes GEO, PubMed, ENA, Terpedia Knowledge API, Jupyter execution, and workspace file tools. The MCP server exposes the same research tools to a compatible MCP client. Configure `TERPUTER_WORKER_URL` and `TERPUTER_WORKER_TOKEN` to route public discovery and BigQuery-backed queries through `cloudflare/worker.mjs`; otherwise the app uses local adapters. `search_terpedia_bigquery` uses the existing Knowledge API. The typed `search_transcriptomic_studies` and `get_transcriptomic_samples` tools use `cloudrun/main.py` when `TERPUTER_BIGQUERY_API_URL` and `TERPUTER_BIGQUERY_TOOL_KEY` are configured.

`cloudrun/schema.sql` defines the proposed Terpedia BigQuery dataset. `python cloudrun/prepare_records.py` regenerates reviewable JSONL files from the pinned local manifests; it does not write to BigQuery. A curator should review these before loading them. Deployment requires a Google Cloud principal with BigQuery dataset and Cloud Run permissions, a dedicated service account with read access to the research dataset, and secrets set outside the repository. The Worker handles lightweight metadata calls; count matrices and notebooks execute in the Codespace or a job environment, not in the Worker.
