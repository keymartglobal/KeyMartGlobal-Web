#!/usr/bin/env bash
# build.sh — Render build script for KeyMart Global backend
# Uses chromium + chromium-driver (reliable on Render free tier)
set -e

echo "==> Installing Python dependencies..."
pip install -r requirements.txt

echo "==> Installing Chromium and ChromeDriver..."
apt-get update -qq
apt-get install -y -qq chromium chromium-driver

# Symlink so both binary paths work
if [ -f /usr/bin/chromium ] && [ ! -f /usr/bin/google-chrome ]; then
    ln -sf /usr/bin/chromium /usr/bin/google-chrome
    echo "    Symlinked chromium → google-chrome"
fi

echo "==> Chromium version: $(chromium --version 2>/dev/null || chromium-browser --version 2>/dev/null || echo 'unknown')"
echo "==> ChromeDriver version: $(chromedriver --version 2>/dev/null || echo 'unknown')"
echo "==> Build complete."
