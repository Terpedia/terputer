# Terputer

Terputer is a repo-backed, Codespaces-native bioinformatics workspace. It combines Terpedia research chat with editable Jupyter notebook cells and a Python kernel inside the user's own GitHub Codespace.

The public [Terputer home page](https://terputer.terpedia.com) describes the platform and links to its [research library](https://terputer.terpedia.com/projects/) and [Codespace example](https://codespaces.new/Terpedia/terpedia-transcriptomics-demo?quickstart=1). The example repository includes an executed notebook, white paper, critical review, and pinned data. `/about` remains an alias for the platform overview.

## Remote research MCP

Connect an MCP client over Streamable HTTP at `https://terputer.terpedia.com/mcp`. The [API index](https://terputer.terpedia.com/api) lists the tools. Public access includes read-only GEO, PubMed, and ENA metadata discovery. Curated Terpedia BigQuery study and sample search, plus Terpedia Knowledge search, require a Terputer bearer token supplied as the `Authorization` header. The direct `POST /v1/tools/call` adapter uses the same token. The home page links to the Codespace example.

The remote MCP has no access to a user's Codespace files or Python kernel. Those tools remain available through the workspace's local stdio MCP server. The BigQuery adapter runs on Cloud Run with a dedicated service account that can read the `terpedia_research` dataset; its shared key is stored in Secret Manager and Cloudflare Worker secrets.

## User workflow

1. Fork `Terpedia/terputer` to your GitHub account with the name `terpedia-report`. The local `fork_report_workspace` MCP tool can do this after `gh auth login`, or use GitHub's Fork button and set the fork name.
2. Create a Codespace from your `terpedia-report` fork using the included `.devcontainer` configuration.
3. The Codespace installs Node, Python, Jupyter, and the app. Its private forwarded port opens Terputer.
4. Connect GitHub in Terputer, then ask for a white paper or research paper. Terpedia creates a private `terpedia-*` project repository with a Jupyter notebook and a Markdown manuscript draft.
5. Use `add_research_project_submodule` with the project slug to attach that repository at `projects/<slug>`. Review and commit the staged `.gitmodules` and project pointer, then push your report fork. Open the project submodule in Codespaces to review and run its notebook. Colab remains available as an optional notebook viewer/runtime.

The `list_research_projects` tool shows each pinned project commit. `update_research_project_submodule` fetches the latest project revision and stages a new pointer for review. When cloning a report fork elsewhere, run `git submodule update --init --recursive`. Access to private project repositories requires the same GitHub account or explicit collaborator access. Each project remains its own repository; the report fork stores only its URL and pinned commit. These tools require an authenticated GitHub CLI in the Codespace and a checkout whose `origin` is the authenticated user's `terpedia-report` fork. They do not commit or push changes.

## Curated study submodules and browser

The `projects/` directory contains the curated Terpedia research portfolio as Git submodules. Each study is versioned in its own `Terpedia/terputer-*` repository and includes its notebook and white paper. Browse and search at [`/projects/`](https://terputer.terpedia.com/projects/) or in the Codespace sidebar. Both project browsers combine the curated `public/projects/catalog.json` metadata with public GitHub discovery for repositories named `Terpedia/terputer-*`; new repositories appear as Unclassified until their category and artifact links are added to the catalog.

The Codespaces setup initializes the curated submodules automatically. For a local clone, run `git submodule update --init --recursive`. The parent repository pins each study to a commit; to advance one study, run `git submodule update --remote projects/<slug>`, inspect the study checkout, then commit the changed submodule pointer in `terputer`. The Codespace can open and run notebooks from initialized project submodules using each project directory as the notebook working directory. GitHub-discovered repositories that are not local submodules remain browsable through their public repository links until added to the checkout.

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

The local `generate_research_report` tool turns a structured report specification and an executed Jupyter notebook into `white-paper.md`, `claim-ledger.tsv`, and `generation-receipt.json` under `research/<slug>/generated/`. It checks source URL syntax, claim evidence classes, referenced local artifacts, complete notebook execution counts, absence of error outputs, and input hashes. Observed claims require a result artifact; proposed claims are labeled in the report. It does not check live URL reachability or judge whether a scientific claim is true, so the generated paper still needs expert review.

The local `execute_notebook` MCP tool runs a saved `notebooks/*.ipynb` in a fresh Python kernel, writes cell outputs only after the full run succeeds, and returns a SHA-256 digest plus bounded text output summaries. Pass expected `research/` result files in `artifact_paths`; the run must write each one, and their hashes are recorded in `research/execution-receipts/`. Use `schema_version: 2` and the receipt path in `execution_receipt` to make report generation reject a notebook or observed-claim result edited after execution. Existing version 1 specifications remain readable. Execution happens with the Codespace user's permissions; review generated code and its data sources before running it.

The checked-in [transcriptomics report specification](research/transcriptomics/report-spec.json) illustrates the format. Regenerate its report locally with:

```sh
node report-generator.mjs research/transcriptomics/report-spec.json
```

The research agent can create a new specification and invoke the same tool in a Codespace. This pipeline writes workspace files only; publication to GitHub or `research/` remains a separate reviewable action.

After connecting GitHub, ask Terputer to publish a completed report. The local `publish_research_report` tool revalidates the version 2 specification and sends the notebook, execution receipt, cited result artifacts, report, claim ledger, and generation receipt to the Terpedia GitHub service. It can include additional scripts or pinned inputs through `extra_paths`. The service checks the hashes and writes one commit to a private `terpedia-<slug>` repository in the connected user's account, then returns links pinned to that commit. The GitHub connection token remains in the Terpedia backend; the Codespace receives only the signed session.

When GitHub OAuth returns to a Codespace address, Terpedia displays that destination before transferring the signed session. Confirm that it is your Codespace before continuing.

The in-app research agent uses `TERPUTER_OPENROUTER_API_KEY` and exposes GEO, PubMed, ENA, Terpedia Knowledge API, Jupyter execution, and workspace file tools. The MCP server exposes the same research tools to a compatible MCP client. Configure `TERPUTER_WORKER_URL` and `TERPUTER_WORKER_TOKEN` to route public discovery and BigQuery-backed queries through `cloudflare/worker.mjs`; otherwise the app uses local adapters. `search_terpedia_bigquery` uses the existing Knowledge API. The typed `search_transcriptomic_studies` and `get_transcriptomic_samples` tools use `cloudrun/main.py` when `TERPUTER_BIGQUERY_API_URL` and `TERPUTER_BIGQUERY_TOOL_KEY` are configured.

`cloudrun/schema.sql` defines the proposed Terpedia BigQuery dataset. `python cloudrun/prepare_records.py` regenerates reviewable JSONL files from the pinned local manifests; it does not write to BigQuery. A curator should review these before loading them. Deployment requires a Google Cloud principal with BigQuery dataset and Cloud Run permissions, a dedicated service account with read access to the research dataset, and secrets set outside the repository. The Worker handles lightweight metadata calls; count matrices and notebooks execute in the Codespace or a job environment, not in the Worker.
