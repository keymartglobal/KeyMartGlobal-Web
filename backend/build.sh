#!/usr/bin/env bash
# build.sh — Render build script for KeyMart Global backend
# Installs Google Chrome stable and Python dependencies.
set -e

echo "==> Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq wget gnupg curl unzip ca-certificates fonts-liberation \
    libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 \
    libdbus-1-3 libgdk-pixbuf2.0-0 libnspr4 libnss3 libx11-xcb1 \
    libxcomposite1 libxdamage1 libxrandr2 xdg-utils libgbm1

echo "==> Adding Google Chrome repository..."
wget -q -O /tmp/google-key.pub https://dl-ssl.google.com/linux/linux_signing_key.pub
apt-key add /tmp/google-key.pub
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" \
    > /etc/apt/sources.list.d/google-chrome.list

echo "==> Installing Google Chrome stable..."
apt-get update -qq
apt-get install -y -qq google-chrome-stable

echo "==> Chrome version: $(google-chrome-stable --version)"

echo "==> Installing Python dependencies..."
pip install -r requirements.txt

echo "==> Build complete."
