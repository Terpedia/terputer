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
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    account = runtime_identity(args.project, args.region, args.service)
    # Reuse the gcloud login used to inspect Cloud Run and project IAM. This
    # avoids requiring a second, independent ADC login for one repair task.
    token = run("gcloud", "auth", "print-access-token")
    client = bigquery.Client(project=args.project, credentials=Credentials(token=token))
    dataset = client.get_dataset(f"{args.project}.{args.dataset}")
    reader_present = any(
        entry.entity_type == "userByEmail"
        and entry.entity_id == account
        and entry.role in ("READER", "roles/bigquery.dataViewer", "OWNER", "WRITER")
        for entry in dataset.access_entries
    )
    policy = json.loads(run("gcloud", "projects", "get-iam-policy", args.project, "--format=json"))
    member = f"serviceAccount:{account}"
    job_user_present = any(
        binding.get("role") == "roles/bigquery.jobUser"
        and member in binding.get("members", [])
        and "condition" not in binding
        for binding in policy.get("bindings", [])
    )
    print(json.dumps({
        "project": args.project, "dataset": args.dataset, "service": args.service,
        "runtime_service_account": account,
        "dataset_reader_present": reader_present,
        "project_job_user_present": job_user_present,
        "apply": args.apply,
    }, indent=2))
    if not args.apply:
        return

    if not reader_present:
        dataset.access_entries = [
            *dataset.access_entries,
            bigquery.AccessEntry(role="READER", entity_type="userByEmail", entity_id=account),
        ]
        client.update_dataset(dataset, ["access_entries"])
    if not job_user_present:
        subprocess.run([
            "gcloud", "projects", "add-iam-policy-binding", args.project,
            f"--member={member}", "--role=roles/bigquery.jobUser",
            "--condition=None", "--quiet",
        ], check=True, stdout=subprocess.DEVNULL)

    updated = client.get_dataset(f"{args.project}.{args.dataset}")
    if not any(
        entry.entity_type == "userByEmail" and entry.entity_id == account
        and entry.role in ("READER", "roles/bigquery.dataViewer", "OWNER", "WRITER")
        for entry in updated.access_entries
    ):
        raise RuntimeError("Dataset reader grant was not visible after update")
    updated_policy = json.loads(run("gcloud", "projects", "get-iam-policy", args.project, "--format=json"))
    if not any(
        binding.get("role") == "roles/bigquery.jobUser"
        and member in binding.get("members", []) and "condition" not in binding
        for binding in updated_policy.get("bindings", [])
    ):
        raise RuntimeError("Project jobUser grant was not visible after update")
    print("Dataset reader and project jobUser grants are visible; verify a live adapter query after IAM propagation.")


if __name__ == "__main__":
    main()
