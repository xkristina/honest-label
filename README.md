# Honest Label

A SPECS Lens that looks at a product's packaging and tells you what the label isn't saying.

## Setup

_TODO: setup steps (Lens Studio version, opening the project, running the scan bridge, testing on Specs)._

## Pre-existing code

`tools/scan-bridge/` was not written during this hackathon. It is adapted from the webcam bridge in our earlier project, **GHOST**
(`tools/webcam-bridge`). We kept the local WebSocket server, the threaded webcam grabber, and the stdlib Gemini REST call. We removed
GHOST's hand tracking, lesson planner, rooms, and course storage, and added image input to the Gemini call. It is a preview-only dev tool
that lets the Lens Studio preview use a real webcam frame. Everything else in this repo was written for Honest Label.
