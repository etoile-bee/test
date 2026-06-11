#!/bin/sh
# ============================================================
#  flux.sh — bouton de secours du FLUX TELEGRAM continu (dev-feed)
#  NB : ceci pilote UNIQUEMENT le miroir Telegram, PAS la session Code de l'app.
#  Par defaut le flux Telegram est OFF (Etoile : Telegram = backup a la demande
#  via tools/send_journal.sh). Ce script sert a le rallumer/eteindre au cas ou.
#
#  Usage :
#    tools/flux.sh on       -> pm2 start dev-feed  + pm2 save
#    tools/flux.sh off      -> pm2 stop  dev-feed  + pm2 save
#    tools/flux.sh status   -> etat du process dev-feed
# ============================================================
case "$1" in
  on)
    pm2 start dev-feed && pm2 save
    echo "✅ flux Telegram ON (dev-feed demarre en fin de fichier, pas de flood)."
    ;;
  off)
    pm2 stop dev-feed && pm2 save
    echo "✅ flux Telegram OFF (Telegram = backup a la demande : tools/send_journal.sh)."
    ;;
  status)
    pm2 status dev-feed 2>/dev/null | grep -E "dev-feed|status" || pm2 status | grep dev-feed
    ;;
  *)
    echo "Usage: tools/flux.sh {on|off|status}"
    exit 1
    ;;
esac
