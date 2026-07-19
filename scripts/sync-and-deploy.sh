#!/usr/bin/env bash
# sync-and-deploy.sh — daily job: refresh the model catalogue from models.dev,
# rebuild the app with the fresh data bundled in, and redeploy to zipgo.
#
# Installed as a user crontab entry (see README "Daily model sync"):
#   30 4 * * * /home/gabrielvidal/homelab/projects/appe/scripts/sync-and-deploy.sh >> ~/.cache/appe-sync.log 2>&1
#
# Runs against the live checkout (not a worktree). Cron has a bare environment,
# so make PATH explicit for node / zipgo / tailscale.
set -euo pipefail

export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "=== appe model sync $(date -Is) ==="

# Optional: an Artificial Analysis API key enables *measured* model speeds
# (output tokens/sec, TTFT) for the duration estimator. Drop a line
# `AA_API_KEY=...` into projects/appe/.env or .env.local (both gitignored) and
# it's picked up here; without it the sync uses tier-estimated speeds. Get a free
# key at https://artificialanalysis.ai/ (Insights Platform → API keys).
for envfile in "$PROJECT_DIR/.env" "$PROJECT_DIR/.env.local"; do
  if [[ -f "$envfile" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$envfile"
    set +a
  fi
done

# 1. Refresh src/data/models.json + provider_data.json from models.dev.
node scripts/sync-models.mjs

# 2. Rebuild with the fresh data bundled in and 3. redeploy to zipgo.
npm run deploy

echo "=== done $(date -Is) ==="
