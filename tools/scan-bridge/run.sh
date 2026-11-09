#!/bin/bash
# Start the scan bridge (macOS / Linux). First run creates a small venv (opencv-python, websockets).
# Usage: tools/scan-bridge/run.sh            webcam, press S to scan
#        tools/scan-bridge/run.sh --image p   scan a saved photo
# Loads GEMINI_API_KEY from credentials.env (gitignored) if present.
cd "$(dirname "$0")"
PY=python3; command -v $PY >/dev/null || PY=python
if [ ! -d .venv ]; then
  $PY -m venv .venv
  VPY=.venv/bin/python; [ -f .venv/Scripts/python.exe ] && VPY=.venv/Scripts/python.exe
  $VPY -m pip install -q --upgrade pip && $VPY -m pip install -q opencv-python websockets
fi
if [ -f credentials.env ]; then set -a; . ./credentials.env; set +a; fi
VPY=.venv/bin/python; [ -f .venv/Scripts/python.exe ] && VPY=.venv/Scripts/python.exe
$VPY bridge.py "$@"
