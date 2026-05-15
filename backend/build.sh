#!/usr/bin/env bash
# build.sh — Render build script for KeyMart Global backend
# Selenium/Chromium is NOT installed on Render.
# WhatsApp automation runs on client machines via Docker Agent.
set -e

echo "==> Installing Python dependencies..."
pip install -r requirements.txt

echo "==> Build complete."
