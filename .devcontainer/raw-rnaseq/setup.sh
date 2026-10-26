#!/usr/bin/env bash
set -euo pipefail
sudo apt-get update -qq
sudo apt-get install -y --no-install-recommends rna-star sra-toolkit pigz
if [[ "$(STAR --version)" != "2.7.11b" ]]; then
  echo "Raw RNA-seq projects require STAR 2.7.11b" >&2
  exit 1
fi
bash .devcontainer/setup.sh
