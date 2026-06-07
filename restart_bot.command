#!/bin/bash
# Redemarrage securise du bot podcast — cree par Claude (Cowork)
cd "$(dirname "$0")"
echo "=== Redemarrage securise du bot podcast ==="
if pgrep -f "workflow.js" >/dev/null; then
  echo "⛔ Une video est en cours de generation — redemarrage ANNULE."
  echo "   Relancez ce fichier quand la generation est finie."
else
  pm2 restart podcast-bot && echo "" && echo "✅ Bot redemarre ! Actifs : /test, /stop partout, durees 25/40/65s, looks nouveautes d'abord."
  pm2 status podcast-bot
fi
echo ""
read -p "Appuyez sur Entree pour fermer..."
