#!/usr/bin/env bash
# build.sh — Render build script for KeyMart Global backend
# CRITICAL: failures in chromium install must NOT fail the build.
# The app must start even if Chrome is unavailable (Selenium disabled gracefully).
set -e

echo "==> Installing Python dependencies..."
pip install -r requirements.txt

echo "==> Attempting Chromium install (non-fatal if unavailable)..."
# Use || true so a failed chromium install NEVER breaks the deployment
(
  apt-get update -qq && \
  apt-get install -y -qq chromium chromium-driver && \
  echo "    ✅ Chromium installed: $(chromium --version 2>/dev/null || chromium-browser --version 2>/dev/null)" && \
  echo "    ✅ ChromeDriver: $(chromedriver --version 2>/dev/null)"
) || echo "    ⚠️  Chromium install skipped — Selenium will be unavailable. META API engine will be used."

echo "==> Build complete."
