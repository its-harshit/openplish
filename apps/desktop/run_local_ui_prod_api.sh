#!/bin/bash
# Run desktop app with LOCAL UI (Vite hot reload) + PRODUCTION API
# UI: localhost:5173 | API: lite.somehow.ai
SOMEHOW_UI_URL=http://localhost:3000 SOMEHOW_API_URL=https://lite.somehow.ai pnpm dev
