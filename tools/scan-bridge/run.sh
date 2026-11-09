#!/bin/bash
# Start the scan bridge. First run creates a small venv (opencv-python, websockets).
# Load your key first:  set -a; source tools/scan-bridge/credentials.env; set +a
cd "$(dirname "$0")"
PY=python3; command -v $PY >/dev/null || PY=python
if [ ! -d .venv ]; then
  $PY -m venv .venv
  VPY=.venv/bin/python; [ -f .venv/Scripts/python.exe ] && VPY=.venv/Scripts/python.exe
  $VPY -m pip install -q --upgrade pip && $VPY -m pip install -q opencv-python websockets
fi
VPY=.venv/bin/python; [ -f .venv/Scripts/python.exe ] && VPY=.venv/Scripts/python.exe
$VPY bridge.py "$@"
