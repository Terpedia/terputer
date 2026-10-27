"""BigQuery client using ADC or an explicitly selected gcloud login."""

from __future__ import annotations

import subprocess


def bigquery_client(project: str, gcloud_account: str | None = None):
    from google.cloud import bigquery

    if not gcloud_account:
        return bigquery.Client(project=project)
    from google.oauth2.credentials import Credentials

    token = subprocess.check_output(
        ["gcloud", "auth", "print-access-token", f"--account={gcloud_account}"],
        text=True,
    ).strip()
    if not token:
        raise RuntimeError("gcloud did not return an access token")
    return bigquery.Client(project=project, credentials=Credentials(token=token))
