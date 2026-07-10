#!/usr/bin/env python3
"""
Adapt the logical Houston intensive dashboard to the actual normalized
HyperPBI field keys reported by the visual.

Usage:
    python adapt_hyperpbi_dashboard_fields.py \
      --dashboard hyperpbi_houston_intensive_dashboard_LOGICAL.json \
      --inventory field_inventory.json \
      --out hyperpbi_houston_intensive_dashboard_CURRENT_FIELDS.json

The inventory must be the JSON object whose keys are HyperPBI normalized field
keys and whose values contain displayName/queryName/type metadata.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

CALCULATED_FIELDS = {
    "cost_variance_calc",
    "budget_utilization_calc",
    "sla_margin_calc",
    "risk_cost_index_calc",
    "risk_status_calc",
}
CALCULATED_METRICS = {
    "total_cases",
    "total_budget",
    "total_actual",
    "open_cases",
    "sla_rate",
    "critical_cases",
    "avg_progress",
    "avg_satisfaction",
}
FIELD_PROPERTIES = {
    "field", "category", "measure", "x", "y", "size", "pointSize",
    "dateField", "titleField", "categoryField", "statusField",
    "descriptionField", "splitField", "primaryField", "secondaryField",
    "badgeField", "valueField", "distinctBy", "sortBy", "powerBiField",
    "aggregateField", "valueFromRow",
}
TOKEN_PATTERN = re.compile(r"\{\{\s*([^{}]+?)\s*\}\}")
PREFIX_PATTERN = re.compile(
    r"^(?:sum|average|avg|count|countnonnull|min|max|first|last|distinctcount)[ _-]+",
    re.IGNORECASE,
)

def canonical(text: str) -> str:
    text = PREFIX_PATTERN.sub("", text.strip())
    return re.sub(r"[^a-z0-9]+", "", text.lower())

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dashboard", required=True)
    parser.add_argument("--inventory", required=True)
    parser.add_argument("--out", required=True)
    return parser.parse_args()

def build_mapping(inventory: dict[str, Any]) -> dict[str, str]:
    candidates: dict[str, list[str]] = {}
    for key, info in inventory.items():
        values = [key]
        if isinstance(info, dict):
            values.extend([
                str(info.get("displayName", "")),
                str(info.get("queryName", "")),
            ])
        for value in values:
            if not value:
                continue
            simple = value.split(".")[-1].strip("[]'")
            for candidate in {canonical(value), canonical(simple)}:
                if candidate:
                    candidates.setdefault(candidate, []).append(key)

    logical_names = [
        "RecordID", "CaseNumber", "ReportDate", "MonthLabel", "MonthIndex",
        "Quarter", "FiscalYear", "Weekday", "Department", "Program",
        "ServiceType", "Category", "Status", "Stage", "Priority", "RiskBand",
        "Region", "CouncilDistrict", "Neighborhood", "Owner", "Team", "Vendor",
        "Channel", "AssetType", "AssetID", "Description", "Latitude", "Longitude",
        "Budget", "ActualCost", "Variance", "ProgressPct", "RiskScore",
        "ResponseHours", "TargetHours", "DurationDays", "SatisfactionScore",
        "WithinSLA", "Overdue", "OpenFlag", "IncidentCount", "WorkOrderCount",
        "Quantity", "AssetAge", "Severity", "TargetPct",
    ]

    mapping: dict[str, str] = {}
    missing: list[str] = []
    for logical in logical_names:
        matches = candidates.get(canonical(logical), [])
        if not matches:
            # Suffix fallback for fully qualified query names.
            suffix = canonical(logical)
            matches = [
                key for key in inventory
                if canonical(key).endswith(suffix)
            ]
        if not matches:
            missing.append(logical)
            continue

        # Prefer raw dimension keys, then sum keys, then any other match.
        matches = sorted(
            set(matches),
            key=lambda key: (
                key.lower().startswith("count"),
                not key.lower().startswith("sum_"),
                len(key),
            ),
        )
        mapping[logical] = matches[0]

    if missing:
        raise RuntimeError(
            "Unable to map these logical fields: " + ", ".join(missing)
        )
    return mapping

def replace_tokens(value: str, mapping: dict[str, str]) -> str:
    def repl(match: re.Match[str]) -> str:
        token = match.group(1).strip()
        return "{{" + mapping.get(token, token) + "}}"
    return TOKEN_PATTERN.sub(repl, value)

def transform(value: Any, mapping: dict[str, str]) -> Any:
    if isinstance(value, list):
        return [transform(item, mapping) for item in value]
    if not isinstance(value, dict):
        return replace_tokens(value, mapping) if isinstance(value, str) else value

    source = value.get("fieldSource")
    result: dict[str, Any] = {}
    for key, item in value.items():
        if key == "bindings" and isinstance(item, dict):
            result[key] = {
                name: mapping.get(field, field) if isinstance(field, str) else field
                for name, field in item.items()
            }
            continue

        if key in {"rows", "columns"} and isinstance(item, list):
            result[key] = [
                mapping.get(field, field) if isinstance(field, str) else transform(field, mapping)
                for field in item
            ]
            continue

        if (
            key in FIELD_PROPERTIES
            and isinstance(item, str)
            and source not in {"service", "joined"}
            and item not in CALCULATED_FIELDS
            and item not in CALCULATED_METRICS
        ):
            result[key] = mapping.get(item, item)
            continue

        result[key] = transform(item, mapping)
    return result

def main() -> int:
    args = parse_args()
    dashboard = json.loads(Path(args.dashboard).read_text(encoding="utf-8"))
    inventory = json.loads(Path(args.inventory).read_text(encoding="utf-8"))
    mapping = build_mapping(inventory)
    adapted = transform(dashboard, mapping)
    Path(args.out).write_text(json.dumps(adapted, indent=2), encoding="utf-8")

    print(f"Written: {Path(args.out).resolve()}")
    print("Field mapping:")
    for logical, actual in mapping.items():
        print(f"  {logical} -> {actual}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
