#!/usr/bin/env bash
#
# start-dev.sh — react-unicorn Dev-Server starten (über Tailscale erreichbar)
#
# Benutzung:  einfach ausführen  ->  ./start-dev.sh
# Stoppen:    Strg + C
#
set -euo pipefail

PORT=5173
BASE="/react-unicorn/"   # diese App liegt unter einem Unterpfad (vite base)
cd "$(dirname "$0")"      # immer aus dem Projektordner heraus

# Tailscale-IP für die Anzeige (Vite erlaubt Zugriff per IP zuverlässig,
# der MagicDNS-Name würde von Vites Host-Schutz geblockt)
TS_IP="$(tailscale ip -4 2>/dev/null | head -n1 || true)"
[ -z "$TS_IP" ] && TS_IP="localhost"

# Pakete installieren, falls noch nicht vorhanden (nur beim ersten Mal)
if [ ! -d node_modules ]; then
    echo "node_modules fehlt – installiere einmalig (npm install)…"
    npm install
fi

echo "────────────────────────────────────────────────"
echo "  react-unicorn Dev-Server 🚀"
echo ""
echo "  Im Tailnet:  http://$TS_IP:$PORT$BASE"
echo "  Auf odin:    http://localhost:$PORT$BASE"
echo ""
echo "  Stoppen mit:  Strg + C"
echo "────────────────────────────────────────────────"

# --host -> auch über Tailscale erreichbar (nicht nur localhost)
exec npm run dev -- --host --port "$PORT"
