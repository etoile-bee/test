#!/usr/bin/env python3
"""hook_log.py — journalise l'activite de CETTE session Claude Code.

Appele par les hooks declares dans .claude/settings.json (PreToolUse,
UserPromptSubmit). Lit le payload du hook en JSON sur stdin et ajoute UNE
ligne d'evenement unifie a live/cloud.jsonl :

    {"ts": <epoch>, "iso": "...", "src": "CLOUD", "kind": "...", "text": "..."}

Capture :
  - PreToolUse      -> "ce que Claude demande au systeme" (chaque appel d'outil)
  - UserPromptSubmit-> "la discussion" (chaque message de l'utilisateur)

Ne bloque jamais un outil : quoi qu'il arrive, sortie 0.
"""
import sys, os, json, time


def oneline(s, n):
    s = " ".join(str(s).split())
    return s if len(s) <= n else s[: n - 1] + "…"


def tool_detail(ti):
    if not isinstance(ti, dict):
        return oneline(str(ti), 300)
    for key in ("command", "file_path", "pattern", "path", "url", "query",
                "prompt", "description", "old_string"):
        if ti.get(key):
            return oneline(str(ti[key]), 300)
    return oneline(json.dumps(ti, ensure_ascii=False), 200)


def summarize(kind, data):
    if kind == "UserPromptSubmit":
        return "USER: " + oneline(data.get("prompt", ""), 400)
    if kind in ("PreToolUse", "PostToolUse"):
        tool = data.get("tool_name", "?")
        detail = tool_detail(data.get("tool_input", {}))
        return f"{tool}: {detail}" if detail else tool
    return oneline(json.dumps(data, ensure_ascii=False), 300)


def main():
    kind = sys.argv[1] if len(sys.argv) > 1 else "event"
    raw = ""
    try:
        if not sys.stdin.isatty():
            raw = sys.stdin.read()
    except Exception:
        raw = ""
    try:
        data = json.loads(raw) if raw.strip() else {}
    except Exception:
        data = {}

    ev = {
        "ts": time.time(),
        "iso": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "src": "CLOUD",
        "kind": kind,
        "text": summarize(kind, data),
    }

    base = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    path = os.path.join(base, "live", "cloud.jsonl")
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(ev, ensure_ascii=False) + "\n")
    except Exception:
        pass
    sys.exit(0)


if __name__ == "__main__":
    main()
