"""Grant the deployed Terputer adapter only the BigQuery access it needs.

By default, print the discovered runtime identity and proposed changes. Use
--apply with a Google Cloud account allowed to update the dataset and project
IAM policies. The dataset must already exist.
"""

from __future__ import annotations

import argparse
import json
import subprocess

from google.cloud import bigquery
from google.oauth2.credentials import Credentials


def run(*command: str) -> str:
    return subprocess.check_output(command, text=True).strip()


def runtime_identity(project: str, region: str, service: str) -> str:
    account = run(
        "gcloud", "run", "services", "describe", service,
        f"--project={project}", f"--region={region}",
        "--format=value(spec.template.spec.serviceAccountName)",
    )
    if not account or not account.endswith(".iam.gserviceaccount.com"):
        raise RuntimeError(f"Cloud Run service has no dedicated service account: {service}")
    return account


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", default="terpedia-489015")
    parser.add_argument("--dataset", default="terpedia_research")
    parser.add_argument("--region", default="us-central1")
    parser.add_argument("--service", default="terputer-transcriptomics-api")
    parser.add_argument(
        "--reader-service-account", action="append", default=[], metavar="EMAIL",
        help="Additional named service account needing read-only dataset access (repeatable)",
    )
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    account = runtime_identity(args.project, args.region, args.service)
    accounts = list(dict.fromkeys([account, *args.reader_service_account]))
    if any(not value.endswith(".iam.gserviceaccount.com") or "@" not in value for value in accounts):
        raise ValueError("Every reader identity must be a service-account email")
    # Reuse the gcloud login used to inspect Cloud Run and project IAM. This
    # avoids requiring a second, independent ADC login for one repair task.
    token = run("gcloud", "auth", "print-access-token")
    client = bigquery.Client(project=args.project, credentials=Credentials(token=token))
    dataset = client.get_dataset(f"{args.project}.{args.dataset}")
    reader_present = {
        identity: any(
            entry.entity_type == "userByEmail"
            and entry.entity_id == identity
            and entry.role in ("READER", "roles/bigquery.dataViewer", "OWNER", "WRITER")
            for entry in dataset.access_entries
        ) for identity in accounts
    }
    policy = json.loads(run("gcloud", "projects", "get-iam-policy", args.project, "--format=json"))
    job_user_present = {
        identity: any(
            binding.get("role") == "roles/bigquery.jobUser"
            and f"serviceAccount:{identity}" in binding.get("members", [])
            and "condition" not in binding
            for binding in policy.get("bindings", [])
        ) for identity in accounts
    }
    print(json.dumps({
        "project": args.project, "dataset": args.dataset, "service": args.service,
        "runtime_service_account": account,
        "reader_service_accounts": accounts,
        "dataset_reader_present": reader_present,
        "project_job_user_present": job_user_present,
        "apply": args.apply,
    }, indent=2))
    if not args.apply:
        return

    if not all(reader_present.values()):
        dataset.access_entries = [
            *dataset.access_entries,
            *(
                bigquery.AccessEntry(role="READER", entity_type="userByEmail", entity_id=identity)
                for identity in accounts if not reader_present[identity]
            ),
        ]
        client.update_dataset(dataset, ["access_entries"])
    for identity in accounts:
        if not job_user_present[identity]:
            subprocess.run([
                "gcloud", "projects", "add-iam-policy-binding", args.project,
                f"--member=serviceAccount:{identity}", "--role=roles/bigquery.jobUser",
                "--condition=None", "--quiet",
            ], check=True, stdout=subprocess.DEVNULL)

    updated = client.get_dataset(f"{args.project}.{args.dataset}")
    for identity in accounts:
        if not any(
            entry.entity_type == "userByEmail" and entry.entity_id == identity
            and entry.role in ("READER", "roles/bigquery.dataViewer", "OWNER", "WRITER")
            for entry in updated.access_entries
        ):
            raise RuntimeError(f"Dataset reader grant was not visible for {identity} after update")
    updated_policy = json.loads(run("gcloud", "projects", "get-iam-policy", args.project, "--format=json"))
    for identity in accounts:
        if not any(
            binding.get("role") == "roles/bigquery.jobUser"
            and f"serviceAccount:{identity}" in binding.get("members", [])
            and "condition" not in binding
            for binding in updated_policy.get("bindings", [])
        ):
            raise RuntimeError(f"Project jobUser grant was not visible for {identity} after update")
    print("Dataset reader and project jobUser grants are visible; verify live queries after IAM propagation.")


if __name__ == "__main__":
    main()
