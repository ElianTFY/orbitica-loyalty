"""Fast pre-publication sanity checks. No network required."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []
warnings: list[str] = []

# Never publish real env files.
for p in ROOT.rglob(".env*"):
    if p.name != ".env.example":
        errors.append(f"Secret/environment file present: {p.relative_to(ROOT)}")

# Browser-exposed secret names are forbidden.
for p in ROOT.rglob("*"):
    if not p.is_file() or any(part in {".git", "node_modules", ".next", "__pycache__"} for part in p.parts):
        continue
    if p.suffix.lower() not in {".py", ".ts", ".tsx", ".js"}:
        continue
    try:
        text = p.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        continue
    if re.search(r"NEXT_PUBLIC_[A-Z0-9_]*(SECRET|KEY|TOKEN|PASSWORD)", text):
        errors.append(f"Possible browser-exposed secret in {p.relative_to(ROOT)}")

package = json.loads((ROOT / "frontend" / "package.json").read_text(encoding="utf-8"))
next_version = package.get("dependencies", {}).get("next", "")
react_version = package.get("dependencies", {}).get("react", "")
if not next_version.startswith("16."):
    warnings.append(f"Review Next.js version; pinned value is {next_version!r}")
if not react_version.startswith("19."):
    warnings.append(f"Review React version; pinned value is {react_version!r}")

required = [
    ROOT / "render.yaml",
    ROOT / "SECURITY.md",
    ROOT / "backend" / "migrations" / "versions" / "0002_security_hardening.py",
    ROOT / "backend" / "migrations" / "versions" / "0004_flexible_loyalty_rewards.py",
    ROOT / "frontend" / "app" / "api" / "backend" / "[...path]" / "route.ts",
]
for p in required:
    if not p.exists():
        errors.append(f"Required file missing: {p.relative_to(ROOT)}")

print("Orbítica Loyalty preflight")
for w in warnings:
    print(f"WARN: {w}")
for e in errors:
    print(f"ERROR: {e}")

if errors:
    sys.exit(1)
print("OK: repository sanity checks passed")
