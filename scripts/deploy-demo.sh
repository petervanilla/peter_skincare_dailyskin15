#!/usr/bin/env bash
# Builds the static demo and pushes it to the public Pages repo.
#
#   scripts/deploy-demo.sh                      # → https://dada-95.github.io/dailyskin15-demo/
#   DEMO_REPO=you/your-demo-repo DEMO_BASE=/your-demo-repo scripts/deploy-demo.sh
#
# Source stays in the private team repo; only the built `out/` is published.
set -euo pipefail
cd "$(dirname "$0")/.."

DEMO_REPO="${DEMO_REPO:-dada-95/dailyskin15-demo}"
DEMO_BASE="${DEMO_BASE:-/dailyskin15-demo}"
WORK="$(mktemp -d)"

echo "▶ building static export (base path $DEMO_BASE)"
rm -rf out
STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH="$DEMO_BASE" npx next build

echo "▶ pushing out/ to $DEMO_REPO (main)"
git clone -q --depth 1 "https://github.com/$DEMO_REPO.git" "$WORK" || {
  git init -q -b main "$WORK"
  git -C "$WORK" remote add origin "https://github.com/$DEMO_REPO.git"
}
find "$WORK" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R out/. "$WORK"/
touch "$WORK/.nojekyll"
git -C "$WORK" add -A
git -C "$WORK" commit -q -m "Deploy static demo $(date +%Y-%m-%d\ %H:%M) from $(git rev-parse --short HEAD)" || echo "nothing to deploy"
git -C "$WORK" push -q -u origin main
rm -rf "$WORK"
echo "✓ https://${DEMO_REPO%%/*}.github.io${DEMO_BASE}/"
