#!/usr/bin/env bash
# Validates all GitHub Actions workflow YAML files and checks project config consistency.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Change to root so all node paths are relative (works on Windows too)
cd "$ROOT"

WORKFLOWS_DIR=".github/workflows"
PASS=0
FAIL=0

red()   { printf "\033[31m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
yellow(){ printf "\033[33m%s\033[0m\n" "$*"; }
bold()  { printf "\033[1m%s\033[0m\n" "$*"; }

check() {
  local label="$1"
  local result="$2"   # "ok" | "fail" | "warn"
  local detail="${3:-}"
  if [ "$result" = "ok" ]; then
    green "  ✓ $label"
    PASS=$((PASS+1))
  elif [ "$result" = "warn" ]; then
    yellow "  ⚠ $label${detail:+: $detail}"
  else
    red "  ✗ $label${detail:+: $detail}"
    FAIL=$((FAIL+1))
  fi
}

bold "==> Checking workflow directory..."
if [ -d "$WORKFLOWS_DIR" ]; then
  check ".github/workflows/ exists" "ok"
else
  check ".github/workflows/ exists" "fail" "directory missing"
  exit 1
fi

bold ""
bold "==> Validating YAML syntax..."

EXPECTED_WORKFLOWS=(
  "backend-ci.yml"
  "backend-cd.yml"
  "frontend-ci.yml"
  "frontend-cd.yml"
  "pr-checks.yml"
)

for wf in "${EXPECTED_WORKFLOWS[@]}"; do
  relpath="$WORKFLOWS_DIR/$wf"
  if [ ! -f "$relpath" ]; then
    check "$wf" "fail" "file missing"
    continue
  fi

  # Validate using Node.js with relative path (cwd = ROOT)
  if node -e "
    const fs = require('fs');
    const content = fs.readFileSync('$relpath', 'utf8');
    if (!content.includes('jobs:')) throw new Error('missing jobs:');
    if (!content.match(/^on:/m) && !content.match(/^[\"']on[\"']:/m)) throw new Error('missing on:');
    console.log('ok');
  " 2>/dev/null | grep -q "ok"; then
    check "$wf" "ok"
  else
    check "$wf" "fail" "invalid YAML or missing required keys (jobs:, on:)"
  fi
done

bold ""
bold "==> Checking .github support files..."

for f in "PULL_REQUEST_TEMPLATE.md" "CODEOWNERS" "SECRETS.md"; do
  if [ -f ".github/$f" ]; then
    check ".github/$f" "ok"
  else
    check ".github/$f" "fail" "missing"
  fi
done

bold ""
bold "==> Checking backend config..."

for f in ".eslintrc.js" ".prettierrc" "jest.config.js" "tests/setup.js" "src/scripts/setupLocalTables.js"; do
  if [ -f "backend/$f" ]; then
    check "backend/$f" "ok"
  else
    check "backend/$f" "fail" "missing"
  fi
done

# Check backend package.json has required scripts
if node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  const required = ['lint', 'format:check', 'test:ci'];
  const missing = required.filter(s => !pkg.scripts[s]);
  if (missing.length) throw new Error('missing scripts: ' + missing.join(', '));
  console.log('ok');
" 2>/dev/null | grep -q "ok"; then
  check "backend/package.json scripts (lint, format:check, test:ci)" "ok"
else
  check "backend/package.json scripts" "fail" "missing lint, format:check, or test:ci"
fi

bold ""
bold "==> Checking frontend config..."

for f in ".prettierrc" "vercel.json"; do
  if [ -f "frontend/$f" ]; then
    check "frontend/$f" "ok"
  else
    check "frontend/$f" "fail" "missing"
  fi
done

# Check frontend package.json has required scripts
if node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
  const required = ['lint', 'format:check', 'test:ci'];
  const missing = required.filter(s => !pkg.scripts[s]);
  if (missing.length) throw new Error('missing: ' + missing.join(', '));
  console.log('ok');
" 2>/dev/null | grep -q "ok"; then
  check "frontend/package.json scripts (lint, format:check, test:ci)" "ok"
else
  check "frontend/package.json scripts" "fail" "missing lint, format:check, or test:ci"
fi

# Check vite.config.js has coverage thresholds
if grep -q "thresholds" "frontend/vite.config.js" 2>/dev/null; then
  check "frontend/vite.config.js coverage thresholds" "ok"
else
  check "frontend/vite.config.js coverage thresholds" "fail" "add coverage.thresholds to vite.config.js"
fi

bold ""
bold "==> Checking root files..."

for f in "README.md" "scripts/validate-pipelines.sh" "package.json"; do
  if [ -f "$f" ]; then
    check "$f" "ok"
  else
    check "$f" "fail" "missing"
  fi
done

# Check README has CI badges
if grep -q "badge.svg" "README.md" 2>/dev/null; then
  check "README.md has CI badges" "ok"
else
  check "README.md has CI badges" "warn" "add status badge links"
fi

bold ""
bold "==> Summary"
echo "  Passed: $PASS"
if [ "$FAIL" -gt 0 ]; then
  red "  Failed: $FAIL"
  echo ""
  red "Pipeline validation FAILED. Fix the issues above and re-run."
  exit 1
else
  green "  Failed: 0"
  echo ""
  green "All pipeline checks passed!"
fi
