#!/usr/bin/env python3
"""live_recap.py — RECAP A LA DEMANDE (lecture seule), flux FUSIONNE.

Fusionne et affiche, trie par horodatage, l'activite des deux cotes du pont :

  - CLOUD : activite de la session Claude Code distante, captee par le hook
            live/hook_log.py dans live/cloud.jsonl (local au conteneur cloud).
            -> "ce que Claude demande au systeme" (appels d'outils) + "la
               discussion" (messages utilisateur).

  - MAC   : activite du bot podcast publiee par le Mac sur la branche `live-feed`
            (fichier live/mac.jsonl), recuperee via `git fetch` puis lue avec
            `git show` (aucun checkout, aucune ecriture).

Le pont est GitHub car, dans cette session cloud, le reseau est en liste
blanche : ntfy.sh est bloque, seul GitHub est joignable.

Usage :
    python3 live_recap.py                 # 40 derniers evenements fusionnes
    python3 live_recap.py --n 80          # 80 derniers
    python3 live_recap.py --src CLOUD     # un seul cote
    python3 live_recap.py --grep kling    # filtre texte (regex)
    python3 live_recap.py --no-fetch      # ne pas contacter GitHub
    python3 live_recap.py --branch live-feed
"""
import argparse, json, os, re, subprocess, sys, time

COLORS = {
    "CLOUD": "\033[36m",   # cyan  : cette session Claude
    "MAC":   "\033[32m",   # vert  : le bot sur le Mac
    "SYS":   "\033[90m",   # gris
}
KIND_COLORS = {
    "UserPromptSubmit": "\033[1m",   # gras : la discussion
}
RESET = "\033[0m"


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def fetch_branch(branch):
    """Recupere la branche de feed du Mac (best effort)."""
    r = run(["git", "fetch", "--quiet", "origin",
             f"{branch}:refs/remotes/origin/{branch}"])
    return r.returncode == 0


def read_mac(branch):
    """Lit live/mac.jsonl depuis origin/<branch> sans toucher au working tree."""
    r = run(["git", "show", f"origin/{branch}:live/mac.jsonl"])
    if r.returncode != 0:
        return []
    return parse_lines(r.stdout.splitlines())


def read_cloud(base):
    path = os.path.join(base, "live", "cloud.jsonl")
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            return parse_lines(f.read().splitlines())
    except Exception:
        return []


def parse_lines(lines):
    out = []
    for ln in lines:
        ln = ln.strip()
        if not ln:
            continue
        try:
            e = json.loads(ln)
        except Exception:
            continue
        if "ts" not in e:
            e["ts"] = 0
        out.append(e)
    return out


def fmt(e, color):
    ts = time.strftime("%H:%M:%S", time.localtime(e.get("ts", 0))) if e.get("ts") else "--:--:--"
    src = e.get("src", "?")
    tag = f"[{src}]"
    txt = e.get("text", "")
    if color:
        c = COLORS.get(src, "")
        tag = f"{c}{tag}{RESET}" if c else tag
        kc = KIND_COLORS.get(e.get("kind", ""))
        if kc:
            txt = f"{kc}{txt}{RESET}"
    return f"{ts} {tag} {txt}"


def main():
    ap = argparse.ArgumentParser(description="Recap live fusionne (lecture seule)")
    ap.add_argument("--n", type=int, default=40, help="nb d'evenements affiches")
    ap.add_argument("--src", choices=["CLOUD", "MAC"], help="ne montrer qu'un cote")
    ap.add_argument("--grep", help="filtre regex sur le texte")
    ap.add_argument("--branch", default="live-feed", help="branche de feed du Mac")
    ap.add_argument("--base", default=os.getcwd(), help="racine du depot")
    ap.add_argument("--no-fetch", action="store_true")
    ap.add_argument("--no-color", action="store_true")
    args = ap.parse_args()

    color = not args.no_color and sys.stdout.isatty()

    events = []
    if args.src in (None, "CLOUD"):
        events += read_cloud(args.base)
    if args.src in (None, "MAC"):
        ok = True if args.no_fetch else fetch_branch(args.branch)
        mac = read_mac(args.branch)
        events += mac
        if not args.no_fetch and not ok and color:
            print(f"{COLORS['SYS']}[SYS] fetch '{args.branch}' indisponible (Mac pas encore publie ?){RESET}")

    if args.grep:
        rx = re.compile(args.grep, re.I)
        events = [e for e in events if rx.search(e.get("text", ""))]

    events.sort(key=lambda e: e.get("ts", 0))
    shown = events[-args.n:]

    head = f"=== RECAP LIVE — {len(shown)}/{len(events)} evenements " \
           f"(CLOUD=cette session, MAC=bot podcast) ==="
    print(f"{COLORS['SYS']}{head}{RESET}" if color else head)
    if not shown:
        print("(aucun evenement — le hook cloud et/ou le publieur Mac n'ont rien ecrit encore)")
        return
    for e in shown:
        print(fmt(e, color))


if __name__ == "__main__":
    main()
