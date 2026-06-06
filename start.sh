#!/bin/bash
cd "$(dirname "$0")"

# 1. Tuer l'ancienne instance proprement
pkill -f telegram_bot.js 2>/dev/null
sleep 1
rm -f /tmp/telegram_bot.lock

# 2. Rotation du log : on garde le précédent, on repart propre
if [ -f /tmp/telegram.log ]; then
  mv /tmp/telegram.log /tmp/telegram.log.old
fi

# 3. Relancer en arrière-plan
nohup node telegram_bot.js > /tmp/telegram.log 2>&1 &

# 4. Vérifier que ça a démarré
sleep 2
echo "--- /tmp/telegram.log ---"
cat /tmp/telegram.log
