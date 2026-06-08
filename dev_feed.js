// ============================================================
//  dev-feed : MIROIR TELEGRAM du journal de dev (live sur iPhone)
//  Process SEPARE — n'importe JAMAIS telegram_bot.js. API Telegram directe.
//  Tail du dev_journal.txt (iCloud) -> chaque NOUVELLE ligne -> chat Etoile.
//  - disable_notification:true (pas de spam de notifs)
//  - prefixe 🛠 (distinguer du flux bot normal)
//  - regroupe les lignes arrivant en rafale (<5s) en un seul message
// ============================================================
require('dotenv').config();
const fs = require('fs');
const https = require('https');

const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = String(process.env.TELEGRAM_CHAT_ID || '');
const FILE = '/Users/fayrouzn/Library/Mobile Documents/com~apple~CloudDocs/podcast-outputs/dev_journal.txt';

if (!TOKEN || !CHAT_ID) { console.error('[dev-feed] TELEGRAM_TOKEN/CHAT_ID manquants dans .env'); process.exit(1); }

const POLL_MS = 1000;     // frequence de lecture du fichier
const BATCH_MS = 4000;    // fenetre de regroupement (<5s)

let lastPos = 0;          // octet jusqu'ou on a deja lu
const buffer = [];        // lignes en attente d'envoi
let flushTimer = null;

// Telegram sendMessage (API directe, silencieux)
function tgSend(text) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ chat_id: CHAT_ID, text, disable_notification: true, disable_web_page_preview: true });
    const req = https.request({
      hostname: 'api.telegram.org', path: '/bot' + TOKEN + '/sendMessage', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => { let d = ''; res.on('data', c => d += c); res.on('end', () => {
      if (res.statusCode !== 200) console.error('[dev-feed] Telegram ' + res.statusCode + ': ' + d.slice(0, 200));
      resolve();
    }); });
    req.on('error', e => { console.error('[dev-feed] erreur reseau: ' + e.message); resolve(); });
    req.write(body); req.end();
  });
}

function scheduleFlush() {
  if (flushTimer) return;            // une seule fenetre a la fois
  flushTimer = setTimeout(flush, BATCH_MS);
}

async function flush() {
  flushTimer = null;
  if (!buffer.length) return;
  const lines = buffer.splice(0, buffer.length);
  // prefixe 🛠 sur chaque ligne ; Telegram limite ~4096 chars -> on tronconne
  let chunk = '';
  for (const ln of lines) {
    const piece = '🛠 ' + ln + '\n';
    if ((chunk + piece).length > 3800) { await tgSend(chunk.trimEnd()); chunk = ''; }
    chunk += piece;
  }
  if (chunk) await tgSend(chunk.trimEnd());
}

function poll() {
  fs.stat(FILE, (err, st) => {
    if (err) return; // fichier pas encore la / iCloud : on reessaiera
    if (st.size < lastPos) lastPos = 0;          // fichier tronque/recree -> repart du debut
    if (st.size === lastPos) return;              // rien de neuf
    const stream = fs.createReadStream(FILE, { start: lastPos, end: st.size - 1, encoding: 'utf8' });
    let acc = '';
    stream.on('data', c => acc += c);
    stream.on('end', () => {
      lastPos = st.size;
      acc.split(/\r?\n/).map(s => s.trim()).filter(Boolean).forEach(l => buffer.push(l));
      if (buffer.length) scheduleFlush();
    });
    stream.on('error', () => {});
  });
}

// Demarrage : on part de la FIN du fichier (on n'envoie que les lignes FUTURES)
try { lastPos = fs.statSync(FILE).size; } catch (e) { lastPos = 0; }
console.log('[dev-feed] actif. Tail de ' + FILE + ' depuis offset ' + lastPos);
setInterval(poll, POLL_MS);
