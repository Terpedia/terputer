# Terputer

Terputer is a repo-backed, Codespaces-native bioinformatics workspace. It combines Terpedia research chat with editable Jupyter notebook cells and a Python kernel inside the user's own GitHub Codespace.

## User workflow

1. Push this repository to GitHub.
2. Create a Codespace from the repository using the included `.devcontainer` configuration.
3. The Codespace installs Node, Python, Jupyter, and the app. Its private forwarded port opens Terputer.
4. Ask Terpedia to draft a research report. Terputer adds its methods, candidate sources, and editable Python code to the notebook.
5. Review and run notebook cells in the user's own Codespace. Save the `.ipynb` into the repository, then use Git to commit and push it.

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

The browser calls the Node server. The server proxies BigQuery-backed searches to the Terpedia Knowledge API and kernel execution to the local Python kernel service. Copilot in the Codespace receives the `terpedia` MCP tools from the root `.mcp.json`; those tools call the same local search route, so the Knowledge API key stays server-side. Configure `TERPEDIA_KNOWLEDGE_API_KEY` as a Codespaces secret and `VITE_TERPEDIA_CHAT_URL` before the Vite production build. Never prefix server secrets with `VITE_`.

The MCP server exposes `search_terpedia_knowledge` and `lookup_terpedia_identifier`. In VS Code/Codespaces, accept the workspace MCP server trust prompt, then enable these tools in Copilot Chat if they are not active. Check MCP Servers in the Chat customizations UI to confirm the server starts. The workspace config does not grant Copilot access to other Terpedia services or to arbitrary BigQuery SQL. The API key is not in `.mcp.json`; it must be present in the Codespace environment before the Node server starts.

Generated Python is a draft. The app does not run generated cells automatically; a user must inspect and run each cell. Code runs with the current user's Codespace permissions and filesystem access. Do not run untrusted notebooks in a Codespace containing secrets you do not want that code to access.

## Current scope

The app supports chat-to-report drafting, editable Markdown/Python cells, per-cell execution in the Codespace kernel, saving/opening `.ipynb` files in the repo checkout, and downloading a notebook. Project collaboration, autosave, kernel restart controls, richer Jupyter outputs, and persistent chat history remain future work.
