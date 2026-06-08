#!/usr/bin/env python3
"""live_publish_mac.py — PUBLIEUR (a lancer SUR LE MAC, pres du bot).

Pourquoi : la session Claude distante (cloud) ne peut PAS voir les logs locaux
du bot, et son reseau bloque ntfy.sh. Le seul pont disponible est GitHub. Ce
script lit en direct les logs du bot et POUSSE leur activite sur la branche
`live-feed` (fichier live/mac.jsonl), pour que `live_recap.py` puisse l'afficher
fusionnee, en direct, dans la session cloud.

Il lit (lecture seule cote bot) :
  - <base>/logs/ui_journal.jsonl  (chaque ecran/action du bot Telegram)
  - <base>/bot_journal.log        (le miroir texte du bot)

Il ecrit UNIQUEMENT dans un worktree dedie (branche live-feed) ; il ne touche
jamais votre branche de travail ni le code du bot.

Usage typique :
    python3 -u live_publish_mac.py --base ~/podcast-workflow --repo ~/podcast-workflow

Options :
    --base DIR      racine du bot (defaut ~/podcast-workflow) — ou sont les logs
    --repo DIR      un checkout git du depot etoile-bee/test (defaut: depot
                    contenant ce script). C'est de la que part le push.
    --branch NAME   branche de feed (defaut live-feed)
    --interval SEC  periode de push (defaut 5)
    --max-lines N   taille max conservee dans live/mac.jsonl (defaut 2000)
"""
import argparse, json, os, queue, re, shutil, subprocess, sys, threading, time

Q = queue.Queue()


# ---------- evenements ----------

def oneline(s, n):
    s = " ".join(str(s).split())
    return s if len(s) <= n else s[: n - 1] + "…"


def fmt_ui(line):
    """Resume lisible d'une entree JSONL du journal UI du bot."""
    try:
        e = json.loads(line)
    except Exception:
        return oneline(line, 300)
    d = e.get("dir", "?")
    arrow = "->" if d == "out" else "<-"
    parts = [f"{arrow} {e.get('type', '')}".strip()]
    if e.get("screen"):
        parts.append(f'"{e["screen"]}"')
    if e.get("user_action"):
        parts.append(f"action={e['user_action']}")
    btns = e.get("buttons") or []
    if btns:
        parts.append("[" + " | ".join(str(b) for b in btns) + "]")
    return oneline(" ".join(parts), 300)


def emit(kind, text):
    Q.put({
        "ts": time.time(),
        "iso": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "src": "MAC",
        "kind": kind,
        "text": text,
    })


# ---------- tail -f robuste ----------

def follow(path, kind, fmt=None):
    fh = None
    inode = None
    while True:
        try:
            if fh is None:
                if not os.path.exists(path):
                    time.sleep(1.0)
                    continue
                fh = open(path, "r", errors="replace")
                inode = os.fstat(fh.fileno()).st_ino
                fh.seek(0, os.SEEK_END)
            line = fh.readline()
            if line:
                line = line.rstrip("\n")
                if line.strip():
                    emit(kind, fmt(line) if fmt else oneline(line, 300))
                continue
            time.sleep(0.4)
            try:
                st = os.stat(path)
                if st.st_ino != inode or st.st_size < fh.tell():
                    fh.close(); fh = None
            except FileNotFoundError:
                fh.close(); fh = None
        except Exception as e:
            emit("sys", f"erreur {kind}: {e}")
            try:
                if fh:
                    fh.close()
            except Exception:
                pass
            fh = None
            time.sleep(1.0)


# ---------- worktree de feed ----------

def git(args, cwd, check=False):
    r = subprocess.run(["git", "-C", cwd] + args, capture_output=True, text=True)
    if check and r.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} -> {r.stderr.strip()}")
    return r


def ensure_worktree(repo, branch):
    root = git(["rev-parse", "--show-toplevel"], repo, check=True).stdout.strip()
    wt = os.path.join(os.path.dirname(root), os.path.basename(root) + "-livefeed")
    if os.path.exists(os.path.join(wt, ".git")):
        return wt
    git(["fetch", "origin", branch], root)
    has_remote = git(["rev-parse", "--verify", "--quiet", f"origin/{branch}"], root).returncode == 0
    if has_remote:
        git(["worktree", "add", "-B", branch, wt, f"origin/{branch}"], root, check=True)
    else:
        git(["worktree", "add", "--detach", wt], root, check=True)
        git(["checkout", "--orphan", branch], wt, check=True)
        git(["rm", "-rf", "--cached", "."], wt)
        for f in os.listdir(wt):
            if f == ".git":
                continue
            full = os.path.join(wt, f)
            shutil.rmtree(full) if os.path.isdir(full) else os.remove(full)
    print(f"[SYS] worktree feed: {wt} (branche {branch})", flush=True)
    return wt


def push_with_retry(wt, branch):
    delay = 2
    for attempt in range(4):
        if git(["push", "origin", branch], wt).returncode == 0:
            return True
        time.sleep(delay)
        delay *= 2
    return False


def flusher(wt, branch, interval, max_lines):
    feed = os.path.join(wt, "live", "mac.jsonl")
    os.makedirs(os.path.dirname(feed), exist_ok=True)
    while True:
        time.sleep(interval)
        batch = []
        try:
            while True:
                batch.append(Q.get_nowait())
        except queue.Empty:
            pass
        if not batch:
            continue
        # fenetre glissante pour borner la taille du fichier en historique git
        lines = []
        if os.path.exists(feed):
            with open(feed, "r", encoding="utf-8", errors="replace") as f:
                lines = f.read().splitlines()
        lines += [json.dumps(e, ensure_ascii=False) for e in batch]
        lines = lines[-max_lines:]
        with open(feed, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")

        git(["add", "live/mac.jsonl"], wt)
        if git(["commit", "-m", f"live: activite bot (mac) +{len(batch)}"], wt).returncode != 0:
            continue
        git(["pull", "--rebase", "origin", branch], wt)
        ok = push_with_retry(wt, branch)
        print(f"[SYS] +{len(batch)} ev publies ({'ok' if ok else 'push KO'})", flush=True)


def main():
    ap = argparse.ArgumentParser(description="Publieur live du bot -> GitHub")
    ap.add_argument("--base", default=os.path.expanduser("~/podcast-workflow"))
    ap.add_argument("--repo", default=os.path.dirname(os.path.abspath(__file__)))
    ap.add_argument("--branch", default="live-feed")
    ap.add_argument("--interval", type=float, default=5.0)
    ap.add_argument("--max-lines", type=int, default=2000)
    args = ap.parse_args()

    wt = ensure_worktree(args.repo, args.branch)

    ui = os.path.join(args.base, "logs", "ui_journal.jsonl")
    botlog = os.path.join(args.base, "bot_journal.log")
    print(f"[SYS] publieur demarre — base={args.base} -> branche {args.branch}", flush=True)
    emit("sys", "publieur Mac demarre")

    threads = [
        threading.Thread(target=follow, args=(ui, "bot-ui", fmt_ui), daemon=True),
        threading.Thread(target=follow, args=(botlog, "bot-log", None), daemon=True),
        threading.Thread(target=flusher, args=(wt, args.branch, args.interval, args.max_lines), daemon=True),
    ]
    for t in threads:
        t.start()

    try:
        while True:
            time.sleep(1.0)
    except KeyboardInterrupt:
        print("\n[SYS] arret du publieur.", flush=True)


if __name__ == "__main__":
    main()
