#!/usr/bin/env python3
"""
live_journal.py — JOURNAL LIVE (lecture seule)

A lancer SUR LA MACHINE qui voit le bot (votre Mac) :

    python3 -u live_journal.py

Affiche en direct, dans une seule fenetre :
  - [BOT-UI]  ~/podcast-workflow/logs/ui_journal.jsonl  (chaque ecran/action du bot)
  - [BOT-LOG] ~/podcast-workflow/bot_journal.log         (le miroir texte du bot)
  - [NTFY]    un (ou plusieurs) topic ntfy.sh, si --ntfy est fourni
              -> c'est le canal par lequel vos AUTRES sessions Cowork peuvent
                 se signaler ici (chacune doit publier sur le meme topic).

Lecture seule : ce script n'ecrit jamais dans les logs. Ctrl+C pour quitter.

Options :
    --base DIR        racine du projet (defaut: ~/podcast-workflow)
    --ntfy TOPIC      topic ntfy.sh a suivre (repetable). Ex: --ntfy fayrouz-podcast
    --exclude REGEX   masque les lignes correspondantes (anti-echo). Repetable.
                      Ex: --exclude '\\[Cowork:abcd1234\\]'
    --no-color        desactive la couleur
"""
import argparse, os, re, sys, time, json, threading
from urllib.request import urlopen, Request

LOCK = threading.Lock()

COLORS = {
    "BOT-UI":  "\033[36m",   # cyan
    "BOT-LOG": "\033[33m",   # jaune
    "NTFY":    "\033[35m",   # magenta
    "SYS":     "\033[90m",   # gris
}
RESET = "\033[0m"


def emit(source, text, color=True):
    """Affiche une ligne d'evenement, horodatee et taguee, de facon atomique."""
    ts = time.strftime("%H:%M:%S")
    tag = f"[{source}]"
    if color and COLORS.get(source):
        tag = f"{COLORS[source]}{tag}{RESET}"
    with LOCK:
        print(f"{ts} {tag} {text}", flush=True)


def passes_filters(line, excludes):
    return not any(rx.search(line) for rx in excludes)


def follow_file(path, source, excludes, color, fmt=None):
    """tail -f robuste : attend la creation du fichier, suit la rotation (inode/troncature)."""
    emit("SYS", f"suivi de {path} ({source})", color)
    fh = None
    inode = None
    # on demarre a la FIN du fichier existant (equivalent tail -n 0)
    while True:
        try:
            if fh is None:
                if not os.path.exists(path):
                    time.sleep(1.0)
                    continue
                fh = open(path, "r", errors="replace")
                st = os.fstat(fh.fileno())
                inode = st.st_ino
                fh.seek(0, os.SEEK_END)
            line = fh.readline()
            if line:
                line = line.rstrip("\n")
                if not line.strip():
                    continue
                if not passes_filters(line, excludes):
                    continue
                emit(source, fmt(line) if fmt else line, color)
                continue
            # pas de nouvelle ligne : detecter rotation/troncature
            time.sleep(0.4)
            try:
                st = os.stat(path)
                if st.st_ino != inode or st.st_size < fh.tell():
                    # fichier remplace ou tronque -> reouverture depuis le debut
                    fh.close(); fh = None
                    emit("SYS", f"{path} a tourne, reprise", color)
            except FileNotFoundError:
                fh.close(); fh = None
        except Exception as e:
            emit("SYS", f"erreur {source}: {e}", color)
            try:
                if fh: fh.close()
            except Exception:
                pass
            fh = None
            time.sleep(1.0)


def fmt_ui(line):
    """Resume lisible d'une entree JSONL du journal UI du bot."""
    try:
        e = json.loads(line)
    except Exception:
        return line
    d = e.get("dir", "?")
    typ = e.get("type", "")
    screen = e.get("screen", "")
    act = e.get("user_action", "")
    btns = e.get("buttons", []) or []
    arrow = "->" if d == "out" else "<-"
    parts = [f"{arrow} {typ}"]
    if screen:
        parts.append(f'"{screen}"')
    if act:
        parts.append(f"action={act}")
    if btns:
        parts.append("[" + " | ".join(str(b) for b in btns) + "]")
    return " ".join(parts)


def follow_ntfy(topic, excludes, color):
    """Suit un topic ntfy.sh en streaming JSON (1 message JSON par ligne)."""
    url = f"https://ntfy.sh/{topic}/json"
    emit("SYS", f"abonnement ntfy: {topic}", color)
    while True:
        try:
            req = Request(url, headers={"User-Agent": "live_journal.py"})
            with urlopen(req, timeout=75) as r:
                for raw in r:
                    try:
                        m = json.loads(raw.decode("utf-8", "replace"))
                    except Exception:
                        continue
                    if m.get("event") != "message":
                        continue
                    txt = m.get("message", "")
                    title = m.get("title", "")
                    label = f"{topic}: " + (f"{title} — " if title else "") + txt
                    if passes_filters(label, excludes):
                        emit("NTFY", label, color)
        except Exception as e:
            emit("SYS", f"ntfy {topic} reconnexion ({e})", color)
            time.sleep(3.0)


def main():
    ap = argparse.ArgumentParser(description="Journal live (lecture seule)")
    ap.add_argument("--base", default=os.path.expanduser("~/podcast-workflow"))
    ap.add_argument("--ntfy", action="append", default=[])
    ap.add_argument("--exclude", action="append", default=[])
    ap.add_argument("--no-color", action="store_true")
    args = ap.parse_args()

    color = not args.no_color and sys.stdout.isatty()
    excludes = [re.compile(p) for p in args.exclude]

    ui = os.path.join(args.base, "logs", "ui_journal.jsonl")
    botlog = os.path.join(args.base, "bot_journal.log")

    emit("SYS", "JOURNAL LIVE demarre — Ctrl+C pour quitter", color)
    emit("SYS", f"base = {args.base}", color)

    threads = [
        threading.Thread(target=follow_file, args=(ui, "BOT-UI", excludes, color, fmt_ui), daemon=True),
        threading.Thread(target=follow_file, args=(botlog, "BOT-LOG", excludes, color, None), daemon=True),
    ]
    for t in args.ntfy:
        threads.append(threading.Thread(target=follow_ntfy, args=(t, excludes, color), daemon=True))

    for t in threads:
        t.start()

    try:
        while True:
            time.sleep(1.0)
    except KeyboardInterrupt:
        emit("SYS", "arret du journal.", color)


if __name__ == "__main__":
    main()
