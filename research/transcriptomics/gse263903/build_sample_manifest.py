"""Capture GSE263903 sample arms, sex, and dates from the GEO SOFT record."""

import csv
import urllib.request
from pathlib import Path


SOURCE = "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE263903&targ=gsm&view=brief&form=text"
OUTPUT = Path(__file__).with_name("study_sample_manifest.tsv")

with urllib.request.urlopen(SOURCE, timeout=30) as response:
    lines = response.read().decode("utf-8").splitlines()

samples = []
current = None
for line in lines:
    if line.startswith("^SAMPLE = "):
        current = {"gsm": line.removeprefix("^SAMPLE = ").strip()}
        samples.append(current)
    elif current is not None:
        if line.startswith("!Sample_title = "):
            current["library"] = line.removeprefix("!Sample_title = ").strip()
        elif line.startswith("!Sample_characteristics_ch1 = "):
            value = line.removeprefix("!Sample_characteristics_ch1 = ").strip()
            if ": " in value:
                key, detail = value.split(": ", 1)
                if key.lower() in {"treatment", "sex", "sac date"}:
                    current[{"treatment": "condition", "sex": "sex", "sac date": "sac_date"}[key.lower()]] = detail

if len(samples) != 10 or any(set(sample) != {"gsm", "library", "condition", "sex", "sac_date"} for sample in samples):
    raise RuntimeError("GEO sample record structure changed; review it before updating the manifest")

with OUTPUT.open("w", newline="") as stream:
    writer = csv.DictWriter(stream, fieldnames=["gsm", "library", "condition", "sex", "sac_date", "source_url"], delimiter="\t")
    writer.writeheader()
    for sample in samples:
        writer.writerow({**sample, "source_url": f"https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc={sample['gsm']}"})
print(OUTPUT)
