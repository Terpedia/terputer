# Terputer

Terputer is a repo-backed, Codespaces-native bioinformatics workspace. It combines Terpedia research chat with editable Jupyter notebook cells and a Python kernel inside the user's own GitHub Codespace.

The public [Terputer Codespace example](https://terputer.terpedia.com) opens a ready-to-run transcriptomics workspace. Its [example repository](https://github.com/Terpedia/terpedia-transcriptomics-demo) includes the executed notebook, white paper, critical review, and pinned data. The [example overview](https://terputer.terpedia.com/about) links to each artifact.

## Remote research MCP

Connect an MCP client over Streamable HTTP at `https://terputer.terpedia.com/mcp`. The [API index](https://terputer.terpedia.com/api) lists the tools. Supply your personal Terpedia API key in the `X-API-Key` header to list or call tools, including GEO, PubMed, ENA, and curated BigQuery searches. The direct `POST /v1/tools/call` adapter uses the same key. The root URL continues to open the Codespace example. The internal Worker token is reserved for trusted service-to-service calls; it is not a user API key.

The current backend accepts a verified Terpedia Supabase Auth account session for key issuance. Call `POST https://api.terpedia.com/api/terputer/keys` with that session bearer token and a JSON body such as `{"name":"My report Codespace"}`. The public chat site's visible GitHub sign-in does not yet provide this session or issue a Terpedia key. The member-program sign-in and account key-management UI still need to be connected before this is a usable public onboarding flow. The response shows the `tpd_` key once. Save it as the `TERPEDIA_API_KEY` Codespaces secret for your report fork. `GET /api/terputer/keys` lists key metadata; `DELETE /api/terputer/keys/:id` revokes one. Keep the key out of notebooks and repository files. GitHub linking is a separate connection used for repository actions.

The remote MCP has no access to a user's Codespace files or Python kernel. Those tools remain available through the workspace's local stdio MCP server. The BigQuery adapter runs on Cloud Run with a dedicated service account that can read the `terpedia_research` dataset; its shared key is stored in Secret Manager and Cloudflare Worker secrets.

## User workflow

1. Fork `Terpedia/terputer` to your GitHub account with the name `terpedia-report`. After connecting GitHub in Terputer chat, the `fork_report_workspace` tool can create or find the fork using that connection. Standalone local MCP use can authenticate with `gh auth login`, or use GitHub's Fork button and set the fork name.
2. Create a Codespace from your `terpedia-report` fork using the included `.devcontainer` configuration.
3. The Codespace installs Node, Python, Jupyter, and the app. Its private forwarded port opens Terputer.
4. Add your personal Terpedia API key as a Codespaces secret named `TERPEDIA_API_KEY`, then connect GitHub separately for repository actions. Ask for a white paper or research paper. Terpedia creates a private `terpedia-*` project repository with a Jupyter notebook and a Markdown manuscript draft.
5. Use `add_research_project_submodule` with the project slug to attach that repository at `projects/<slug>`. With a linked GitHub session, Terpedia commits the `.gitmodules` entry and pinned pointer to your report fork; pull that commit and initialize the submodule in Codespaces. Standalone local MCP use stages these changes for your review and push. Colab remains available as an optional notebook viewer/runtime.

The `list_research_projects` tool shows locally checked out project commits. `update_research_project_submodule` advances a project pointer to the latest project commit through the linked GitHub session; standalone local MCP use stages the update. When cloning or pulling a report fork, run `git submodule update --init --recursive`. Private project access in Codespaces requires the same GitHub account or explicit collaborator access. Each project remains its own repository. The public report fork stores its URL and pinned commit, so the project repository name is visible even when its contents are private.

When publishing a report from an attached project, Terputer packages that project's notebook and evidence artifacts with the reusable `requirements.txt`, `notebook-runner.py`, and `report-generator.mjs` from the Terputer workspace. The project repository does not need to carry those runtime files before publication.

To work inside an attached project, pass its `project_slug` to `list_notebooks`, `read_workspace_file`, `write_workspace_file`, `execute_notebook`, `generate_research_report`, and `publish_research_report`. Paths such as `notebooks/analysis.ipynb` and `research/study/report-spec.json` are relative to that project. Terputer checks that the selected directory is an initialized Git submodule registered in `.gitmodules`. Without `project_slug`, these tools continue to use the report fork's top-level workspace. Notebook execution and report generation write into the selected project checkout; commit and push project changes separately before updating the report fork's submodule pointer.

The Terputer chat panel lists submodules from the local checkout and lets the user select one for research chat. The selected project is enforced for local file, notebook, and report tools; switching projects starts a fresh chat so context from another project is not carried over. The notebook editor pane remains tied to the report fork root, while full notebook execution in a selected project runs through the research chat tool. Listing projects does not require a second GitHub CLI login.

GitHub publication can advance both the private project repository and the report fork while a Codespace checkout remains at older commits. The publication result includes `projectSubmodule.needsSync` and pinned commit hashes. Reconcile local changes, pull the report fork, and initialize or update the submodule before continuing local work.

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

The browser calls the Node server. The server uses the Codespaces `TERPEDIA_API_KEY` secret for research chat requests through the Terpedia backend; the model provider key stays in Terpedia infrastructure. It proxies BigQuery-backed searches to the Terpedia Knowledge API and kernel execution to the local Python kernel service. GitHub OAuth uses the chat backend and returns a signed session to Terputer. The GitHub session is separate from the Terpedia API key and never exposes a GitHub access token to the browser. Configure `TERPEDIA_KNOWLEDGE_API_KEY` as a Codespaces secret for direct Knowledge API searches. `TERPEDIA_CHAT_API_URL` can override the default `https://api.terpedia.com` for local development. Never prefix server secrets with `VITE_`.

The MCP server exposes `search_terpedia_knowledge` and `lookup_terpedia_identifier`. In VS Code/Codespaces, accept the workspace MCP server trust prompt, then enable these tools in Copilot Chat if they are not active. Check MCP Servers in the Chat customizations UI to confirm the server starts. The workspace config does not grant Copilot access to other Terpedia services or to arbitrary BigQuery SQL. The API key is not in `.mcp.json`; it must be present in the Codespace environment before the Node server starts.

Generated Python is a draft. The app does not run generated cells automatically; a user must inspect and run each cell. Code runs with the current user's Codespace permissions and filesystem access. Do not run untrusted notebooks in a Codespace containing secrets you do not want that code to access.

## Current scope

The app supports chat-to-report drafting, editable Markdown/Python cells, per-cell execution in the Codespace kernel, saving/opening `.ipynb` files in the repo checkout, and downloading a notebook. Project collaboration, autosave, kernel restart controls, richer Jupyter outputs, and persistent chat history remain future work.

## Transcriptomics research workspace

The [executed notebook](notebooks/terputer-transcriptomics.ipynb), [white paper](research/transcriptomics/white-paper.md), and [critical review](research/transcriptomics/critical-review.md) cover linalool bulk RNA-seq, a second fungal terpene exposure study, and an A549 Perturb-seq context demonstration. Derived tables are under `research/transcriptomics/results/`; pinned source inputs and manifests are under `research/transcriptomics/data/`.

The [full biological white paper](research/terpene-transcriptomics/manuscript/white-paper.md), [claim-to-source ledger](research/terpene-transcriptomics/manuscript/claim-ledger.md), and [source evidence snapshot](research/terpene-transcriptomics/README.md) are also available in this public repository while the `research.terpedia.com` custom domain is unavailable.

The public [paclitaxel single-cell example](https://github.com/Terpedia/terpedia-paclitaxel-single-cell) and its [executed notebook](https://github.com/Terpedia/terpedia-paclitaxel-single-cell/blob/main/notebooks/terputer-paclitaxel-single-cell.ipynb) demonstrate a time-matched chemical exposure analysis and claim-linked report. A copy of its script, result artifacts, and generated brief also lives in this workspace. It has one library per condition, so the response patterns are descriptive rather than biologically replicated.

The separate [A2780 paclitaxel report project](https://github.com/Terpedia/terpedia-a2780-paclitaxel-single-cell) contains an executed notebook, checksum-pinned GEO input, result tables, a generated white paper, claim ledger, and execution and generation receipts. To use it as a project in your `terpedia-report` fork, first fork that repository into your own GitHub account under the same name, `terpedia-a2780-paclitaxel-single-cell`, then attach it with slug `a2780-paclitaxel-single-cell`. The submodule path will be `projects/a2780-paclitaxel-single-cell`. The attachment tools require the project repository to belong to your linked GitHub account. Its single cells are not independent biological replicates; the cross-cell-line comparison remains descriptive.

The [mouse DRG paclitaxel label-audit project](https://github.com/Terpedia/terpedia-paclitaxel-drg-label-audit) is another standalone example. It includes an [executed notebook](https://github.com/Terpedia/terpedia-paclitaxel-drg-label-audit/blob/main/notebooks/terputer-paclitaxel-drg.ipynb) and [claim-linked evidence brief](https://github.com/Terpedia/terpedia-paclitaxel-drg-label-audit/blob/main/research/paclitaxel-drg-label-audit/generated/white-paper.md). Fork it into your account under the same repository name, then attach slug `paclitaxel-drg-label-audit` at `projects/paclitaxel-drg-label-audit`. The GEO treatment-protocol fields conflict with the paclitaxel sample titles, so its TPM results are descriptive and the exposure assignment remains provisional.

The [PfMYST × dihydroartemisinin single-cell project](https://github.com/Terpedia/terpedia-pfmyst-dha-single-cell) adds a terpene-derived drug exposure with a genetic-perturbation context. Its [executed notebook](https://github.com/Terpedia/terpedia-pfmyst-dha-single-cell/blob/main/notebooks/terputer-pfmyst-dha-single-cell.ipynb) and [claim-linked brief](https://github.com/Terpedia/terpedia-pfmyst-dha-single-cell/blob/main/research/pfmyst-dha-single-cell/generated/white-paper.md) compare time-matched DHA and control groups within glucosamine strata. Fork it under the same name and attach slug `pfmyst-dha-single-cell` at `projects/pfmyst-dha-single-cell`. Each condition is one GEO library, so gene-rank agreement is descriptive and does not establish independent reproduction or a causal PfMYST interaction.

## Report generation pipeline

The local `generate_research_report` tool turns a structured report specification and an executed Jupyter notebook into `white-paper.md`, `claim-ledger.tsv`, and `generation-receipt.json` under `research/<slug>/generated/`. It checks source URL syntax, claim evidence classes, referenced local artifacts, complete notebook execution counts, absence of error outputs, and input hashes. Observed claims require a result artifact; proposed claims are labeled in the report. It does not check live URL reachability or judge whether a scientific claim is true, so the generated paper still needs expert review.

The local `execute_notebook` MCP tool runs a saved `notebooks/*.ipynb` in a fresh Python kernel, writes cell outputs only after the full run succeeds, and returns a SHA-256 digest plus bounded text output summaries. Pass expected `research/` result files in `artifact_paths`; the run must write each one, and their hashes are recorded in `research/execution-receipts/`. Use `schema_version: 2` and the receipt path in `execution_receipt` to make report generation reject a notebook or observed-claim result edited after execution. Existing version 1 specifications remain readable. Execution happens with the Codespace user's permissions; review generated code and its data sources before running it.

The checked-in [transcriptomics report specification](research/transcriptomics/report-spec.json) illustrates the format. Regenerate its report locally with:

```sh
node report-generator.mjs research/transcriptomics/report-spec.json
```

The research agent can create a new specification and invoke the same tool in a Codespace. This pipeline writes workspace files only; publication to GitHub or `research/` remains a separate reviewable action.

After connecting GitHub, ask Terputer to publish a completed report. The local `publish_research_report` tool revalidates the version 2 specification and sends the notebook, execution receipt, cited result artifacts, report, claim ledger, and generation receipt to the Terpedia GitHub service. It can include additional scripts or pinned inputs through `extra_paths`. The service checks the hashes and writes one commit to a private `terpedia-<slug>` repository in the connected user's account, then returns links pinned to that commit. The GitHub connection token remains in the Terpedia backend; the Codespace receives only the signed session.

New notebook execution receipts include the Python version, operating-system family, machine architecture, and installed package versions at run completion. The generation receipt hashes the full execution receipt. These records help reproduce analyses; they do not replace pinned input data, source checksums, or independent biological replicates.

The report generator prints each claim's declared limitation beside results and interpretation and preserves the claim context in the limitations section. The claim ledger remains the structured source of every claim, evidence class, artifact, and caveat.

When publication runs with a linked GitHub session, Terpedia also commits the project as `projects/<slug>` in the user's report fork. The result reports whether that attachment succeeded and supplies the pinned report fork commit. Pull and initialize the submodule before continuing in Codespaces. Without a linked session, standalone local MCP use stages the pointer for review and push.

When GitHub OAuth returns to a Codespace address, Terpedia displays that destination before transferring the signed session. Confirm that it is your Codespace before continuing.

The in-app research agent requires `TERPEDIA_API_KEY` and exposes GEO, PubMed, ENA, Terpedia Knowledge API, Jupyter execution, and workspace file tools. The MCP server exposes the same research tools to a compatible MCP client. Configure `TERPUTER_WORKER_URL` and the internal `TERPUTER_WORKER_TOKEN` to route source discovery and BigQuery-backed queries through `cloudflare/worker.mjs`; otherwise the app uses local adapters. Users should not receive the internal Worker token. `search_terpedia_bigquery` uses the existing Knowledge API. The typed `search_transcriptomic_studies` and `get_transcriptomic_samples` tools use `cloudrun/main.py` when `TERPUTER_BIGQUERY_API_URL` and `TERPUTER_BIGQUERY_TOOL_KEY` are configured.

`cloudrun/schema.sql` defines the proposed Terpedia BigQuery dataset. `python cloudrun/prepare_records.py` regenerates reviewable JSONL files from the pinned local manifests; it does not write to BigQuery. A curator should review these before loading them. Deployment requires a Google Cloud principal with BigQuery dataset and Cloud Run permissions, a dedicated service account with read access to the research dataset, and secrets set outside the repository. The Worker handles lightweight metadata calls; count matrices and notebooks execute in the Codespace or a job environment, not in the Worker.
