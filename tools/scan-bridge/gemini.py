"""Minimal Gemini vision call for the Honest Label scan bridge.

Adapted from GHOST's lesson_llm.py (provider plumbing only; the lesson
planner, validators, other providers and cost tracking were removed).

Deliberately stdlib-only (urllib) so the bridge venv stays tiny.
The key is read from the environment ONLY and sent in a header, never in the
URL: query strings end up in proxy logs and shell history.
"""
import base64
import json
import os
import urllib.request

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-flash-latest")
TIMEOUT_S = 30


def has_key():
    return bool(os.environ.get("GEMINI_API_KEY", "").strip())


def _post(url, headers, payload):
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=TIMEOUT_S) as r:
        return json.loads(r.read().decode("utf-8"))


def ask(system, user, jpeg_bytes=None, json_mode=True, thinking_budget=0):
    """One Gemini call, optionally with a JPEG image. Returns the response text."""
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        raise RuntimeError("No GEMINI_API_KEY in the environment. See credentials.env.example.")
    cfg = {"temperature": 0.4}
    if thinking_budget is not None:
        # 0 disables thinking (fastest). Checked against None, not falsiness.
        cfg["thinkingConfig"] = {"thinkingBudget": int(thinking_budget)}
    if json_mode:
        cfg["responseMimeType"] = "application/json"
    parts = []
    if jpeg_bytes:
        parts.append({"inline_data": {"mime_type": "image/jpeg",
                                      "data": base64.b64encode(jpeg_bytes).decode("ascii")}})
    parts.append({"text": user})
    body = _post(
        "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent" % GEMINI_MODEL,
        {"content-type": "application/json", "x-goog-api-key": key},
        {"systemInstruction": {"parts": [{"text": system}]},
         "contents": [{"role": "user", "parts": parts}],
         "generationConfig": cfg},
    )
    cands = body.get("candidates") or []
    if not cands:
        fb = (body.get("promptFeedback") or {}).get("blockReason")
        raise RuntimeError("gemini returned no candidates%s" % (" (%s)" % fb if fb else ""))
    return "".join(p.get("text", "") for p in (cands[0].get("content") or {}).get("parts") or [])
