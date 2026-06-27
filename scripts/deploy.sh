#!/usr/bin/env bash
# Deploy the production build to zipgo on raspy2 (internet HTTPS).
#
# Uses the `zipgo deploy` CLI: it maps the host to its folder and creates the
# domain/subdomain tree on the remote (zipgo's trailing-dot convention):
#   -d appe.dev.gabvdl.xyz
#   -> domains/gabvdl.xyz/dev./appe.  ->  https://appe.dev.gabvdl.xyz
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="appe.dev.gabvdl.xyz"
URL="https://$HOST"
SSH_DEST="gabrielvidal@100.74.118.12:/home/gabrielvidal/services/domains"
PORT="8080"

# Tailscale IP of this homelab host (for dev server access).
TS_IP="$(tailscale ip -4 2>/dev/null | head -1)"
: "${TS_IP:=100.104.50.115}"

if [ ! -d "$PROJECT_DIR/dist" ]; then
  echo "error: $PROJECT_DIR/dist not found — run 'npm run build' first." >&2
  exit 1
fi

# zipgo deploy mirrors dist/ to the remote subdomain folder (--delete by default).
zipgo deploy "$PROJECT_DIR/dist/" -d "$HOST" --ssh "$SSH_DEST"
echo "✓ Deployed to raspy2 (internet HTTPS): $HOST"

# og:image + social meta (best-effort). The page is now live, so screenshot it,
# write dist/og-image.png + patch the og:/twitter: <head> tags, then re-sync so
# the image and tags go live. A screenshot failure must not fail the deploy.
# Uses the `og-screenshot` skill alias (installed by install-skill-aliases.sh).
if command -v og-screenshot >/dev/null 2>&1; then
  if og-screenshot "$URL" --project "$PROJECT_DIR"; then
    zipgo deploy "$PROJECT_DIR/dist/" -d "$HOST" --ssh "$SSH_DEST"
    echo "✓ og:image + social meta updated and re-synced"
  else
    echo "  (og:image step skipped — screenshot failed)"
  fi
fi

echo ""
echo "  Deployed URL : $URL   (via raspy2, Let's Encrypt HTTPS)"
echo "  Dev URL      : http://$TS_IP:$PORT   (npm run dev; Tailscale-reachable)"
