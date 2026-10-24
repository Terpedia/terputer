#!/usr/bin/env bash
set -euo pipefail
npm ci
python -m pip install --user -r requirements.txt
python -m ipykernel install --user --name python3 --display-name "Python 3 (Terputer)"
