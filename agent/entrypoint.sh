#!/bin/bash
# entrypoint.sh — Starts Xvfb virtual display, waits until ready, then runs the agent

set -e

# Clean any leftover Xvfb lock files from previous runs
rm -rf /tmp/.X*

# Start Xvfb on display :99
Xvfb :99 -screen 0 1366x768x24 -nolisten tcp &
XVFB_PID=$!

# Wait for Xvfb to be ready (up to 5 seconds)
for i in $(seq 1 50); do
    if [ -e /tmp/.X99-lock ]; then
        break
    fi
    sleep 0.1
done

export DISPLAY=:99
echo "Xvfb started on display :99 (pid $XVFB_PID)"

# Start the Python worker
exec python -u worker.py
