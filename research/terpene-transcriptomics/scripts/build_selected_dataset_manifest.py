#!/usr/bin/env python3
"""Freeze sample-level metadata for selected terpene exposure studies.

Reads public GEO SOFT and ENA metadata; it does not download sequencing reads.
"""

import csv
import gzip
import io
import json
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "selected_studies"
GEO_SOFT = "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE138nnn/GSE138291/soft/GSE138291_family.soft.gz"
ENA_REPORT = "https://www.ebi.ac.uk/ena/portal/api/filereport?accession={accession}&result=read_run&fields=run_accession,experiment_accession,sample_accession,sample_alias,study_accession,experiment_title,library_strategy,library_layout,fastq_bytes&format=tsv"


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": "Terpedia transcriptomics research/0.2"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    rows = []
    soft = gzip.decompress(fetch(GEO_SOFT)).decode("utf-8", "replace")
    for block in soft.split("^SAMPLE = ")[1:]:
        lines = block.splitlines()
        acc = lines[0].strip()
        get = lambda prefix: next((x.split(" = ", 1)[1] for x in lines if x.startswith(prefix)), "")
        agent = get("!Sample_characteristics_ch1 = agent: ").removeprefix("agent: ")
        title = get("!Sample_title = ")
        sra_url = get("!Sample_relation = SRA: ")
        rows.append({"study": "GSE138291", "organism": "Botrytis cinerea B05.10", "sample": acc,
                     "archive_accession": sra_url.rsplit("=", 1)[-1] if sra_url else "", "archive_level": "SRA experiment", "label": title,
                     "arm": "untreated" if agent == "none" else agent, "time": "2 h", "dose": "0" if agent == "none" else "0.5 uL/mL",
                     "source": f"https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc={acc}"})

    for project, organism, time, dose in [
        ("PRJNA608617", "Penicillium digitatum DSM 62840", "0 or 12 h", "840 mg/L"),
        ("PRJNA913446", "Fusarium oxysporum f. sp. radicis-lycopersici", "6 d", "0.8 mL/L"),
    ]:
        report_url = ENA_REPORT.format(accession=project)
        report = list(csv.DictReader(io.StringIO(fetch(report_url).decode()), delimiter="\t"))
        for run in report:
            sample = run["sample_accession"]
            if project == "PRJNA608617":
                xml = ET.fromstring(fetch(f"https://www.ebi.ac.uk/ena/browser/api/xml/{sample}").decode())
                label = xml.findtext(".//SAMPLE/TITLE") or ""
                arm = "R-(+)-limonene" if label.startswith("P_L_12h") else "untreated"
                sample_time = "0 h" if label.startswith("P_0h") else "12 h"
            else:
                label = run["sample_alias"]
                arm = "linalool" if label.startswith("L800") else "vehicle control"
                sample_time = time
            rows.append({"study": project, "organism": organism, "sample": sample,
                         "archive_accession": run["run_accession"], "archive_level": "SRA run", "label": label, "arm": arm,
                         "time": sample_time, "dose": dose if arm not in ("untreated", "vehicle control") else "0",
                         "source": f"https://www.ebi.ac.uk/ena/browser/view/{sample}"})

    rows.sort(key=lambda row: (row["study"], row["label"]))
    path = OUT / "sample_manifest.tsv"
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]), delimiter="\t", lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    (OUT / "sources.json").write_text(json.dumps({
        "geo_family_soft": GEO_SOFT,
        "ena_report_template": ENA_REPORT,
        "ena_biosample_xml_template": "https://www.ebi.ac.uk/ena/browser/api/xml/{sample_accession}",
        "records": len(rows),
        "scope": "metadata only; treatment identity and dose additionally checked against source articles",
    }, indent=2) + "\n")
    print(f"Wrote {len(rows)} sample records to {path}")


if __name__ == "__main__":
    build()
