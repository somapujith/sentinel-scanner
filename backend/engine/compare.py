from __future__ import annotations

from typing import Any


def finding_key(f: dict[str, Any]) -> str:
    return f"{f.get('type', '')}|{f.get('title', '')}|{f.get('affected_component', '')}"


def compare_findings(left: list[dict[str, Any]], right: list[dict[str, Any]]) -> dict[str, Any]:
    kl = {finding_key(f): f for f in left}
    kr = {finding_key(f): f for f in right}
    keys_l = set(kl)
    keys_r = set(kr)
    only_left = [kl[k] for k in sorted(keys_l - keys_r)]
    only_right = [kr[k] for k in sorted(keys_r - keys_l)]
    both = [kl[k] for k in sorted(keys_l & keys_r)]
    return {
        "only_left": only_left,
        "only_right": only_right,
        "unchanged": both,
        "counts": {
            "left_total": len(left),
            "right_total": len(right),
            "only_left": len(only_left),
            "only_right": len(only_right),
            "unchanged": len(both),
        },
    }
