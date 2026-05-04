#!/usr/bin/env bash
# Build for Cloudflare Workers with production env vars
# Temporarily renames .env.local so .env.production takes precedence during build

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Save .env.local temporarily
if [ -f .env.local ]; then
  echo "🔧 Temporarily moving .env.local to .env.local.bak for production build..."
  mv .env.local .env.local.bak
fi

# Run the Cloudflare build (loads .env.production)
echo "🚀 Building for Cloudflare..."
npx @opennextjs/cloudflare build --dangerouslyUseUnsupportedNextVersion && node scripts/patch-cf-handler.mjs

# Restore .env.local
if [ -f .env.local.bak ]; then
  echo "🔧 Restoring .env.local..."
  mv .env.local.bak .env.local
fi

echo "✅ Build complete! Deploy with: npx wrangler deploy"
