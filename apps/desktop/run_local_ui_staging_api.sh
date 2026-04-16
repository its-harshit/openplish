#!/bin/bash
# Run desktop app with LOCAL UI (Vite hot reload) + STAGING API
# UI: localhost:5173 | API: lite-staging.somehow.ai
SOMEHOW_UI_URL=http://localhost:3000 SOMEHOW_API_URL=https://lite-staging.somehow.ai pnpm dev
