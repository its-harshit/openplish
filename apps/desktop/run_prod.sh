#!/bin/bash
# Run desktop app with PRODUCTION UI + PRODUCTION API
# UI: lite.somehow.ai | API: lite.somehow.ai
# This builds an unpacked app and runs it (no hot reload)

set -e

echo "Building unpacked app for production..."
pnpm -F @somehow/desktop build:unpack

echo "Launching app with production configuration..."
SOMEHOW_UI_URL=https://lite.somehow.ai \
SOMEHOW_API_URL=https://lite.somehow.ai \
open apps/desktop/release/mac-arm64/SomeHow.app
