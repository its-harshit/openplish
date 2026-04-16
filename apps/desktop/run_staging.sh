#!/bin/bash
# Run desktop app with STAGING UI + STAGING API
# UI: lite-staging.somehow.ai | API: lite-staging.somehow.ai
# This builds an unpacked app and runs it (no hot reload)

set -e

echo "Building unpacked app for staging..."
pnpm -F @somehow/desktop build:unpack

echo "Launching app with staging configuration..."
SOMEHOW_UI_URL=https://lite-staging.somehow.ai \
SOMEHOW_API_URL=https://lite-staging.somehow.ai \
open apps/desktop/release/mac-arm64/SomeHow.app
