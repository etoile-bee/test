#!/bin/sh
# ============================================================
#  send_journal.sh — envoie les N dernieres lignes du dev_journal
#  sur Telegram, A LA DEMANDE (le flux continu dev-feed est arrete).
#  Usage : tools/send_journal.sh [N]      (N = nb de lignes, defaut 15)
#  Lit TELEGRAM_TOKEN / TELEGRAM_CHAT_ID depuis .env du projet.
# ============================================================
set -e
N="${1:-15}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
JOURNAL="/Users/fayrouzn/Library/Mobile Documents/com~apple~CloudDocs/podcast-outputs/dev_journal.txt"

# Extraire SEULEMENT les 2 cles du .env (sans sourcer => robuste, n'execute rien)
getenv() { grep -E "^$1=" "$ROOT/.env" | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"; }
TELEGRAM_TOKEN="$(getenv TELEGRAM_TOKEN)"
TELEGRAM_CHAT_ID="$(getenv TELEGRAM_CHAT_ID)"
[ -n "$TELEGRAM_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ] || { echo "TELEGRAM_TOKEN/CHAT_ID manquants dans $ROOT/.env"; exit 1; }
[ -f "$JOURNAL" ] || { echo "Journal introuvable: $JOURNAL"; exit 1; }

BODY="$(tail -n "$N" "$JOURNAL")"
TEXT="📓 Journal dev — $N dernieres lignes (a la demande) :
$BODY"

RESP="$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage" \
  -d "chat_id=${TELEGRAM_CHAT_ID}" \
  -d "disable_notification=false" \
  --data-urlencode "text=${TEXT}")"

echo "$RESP" | grep -q '"ok":true' && echo "✅ envoye ($N lignes) -> chat …${TELEGRAM_CHAT_ID#${TELEGRAM_CHAT_ID%????}}" \
  || { echo "❌ echec:"; echo "$RESP" | head -c 300; echo; exit 1; }
