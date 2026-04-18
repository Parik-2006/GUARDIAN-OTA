#!/usr/bin/env python3
"""
deploy_ota.py — Locally serve the built firmware binary, sign it, and POST
the OTA campaign payload to the GUARDIAN-OTA Go backend.

Fixes applied:
  • TCPServer subclass sets allow_reuse_address = True  →  no "Address already
    in use" error when the script is restarted quickly after Ctrl-C.
  • firmwareUrl now uses the machine's LAN IP and the correct PORT (8001).
"""

import os
import socket
import subprocess
import hashlib
import json
import threading
import urllib.error
import urllib.request
import time
import http.server
import socketserver

# ── 1. Configuration ──────────────────────────────────────────────────────────

PORT     = 8001
BIN_PATH = "build/sdv_secure_ota.bin"
BACKEND  = "http://localhost:8080"

# ── 2. Reusable TCP server (avoids "Address already in use" on restart) ───────

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

handler = http.server.SimpleHTTPRequestHandler
# Silence the default per-request logging so output stays clean
handler.log_message = lambda *args: None  # type: ignore[assignment]

httpd = ReusableTCPServer(("", PORT), handler)

# Resolve the machine's LAN IP so the ESP32 can reach this server
def local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

HOST_IP = local_ip()
print(f"Starting local HTTP server for OTA binaries on port {PORT} (http://{HOST_IP}:{PORT}/)")

server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
server_thread.start()

# ── 3. Verify binary exists ───────────────────────────────────────────────────

if not os.path.exists(BIN_PATH):
    print(f"Error: {BIN_PATH} not found. Run 'idf.py build' first.")
    httpd.shutdown()
    exit(1)

# ── 4. Compute SHA-256 ────────────────────────────────────────────────────────

print("Computing SHA-256...")
with open(BIN_PATH, "rb") as f:
    sha256_hash = hashlib.sha256(f.read()).hexdigest()
print(f"Hash: {sha256_hash}")

# ── 5. Sign the binary hash with ECC P-256 ───────────────────────────────────

print("Signing binary hash via ECC P-256...")
subprocess.run(
    f"openssl dgst -sha256 -sign ota-key.pem {BIN_PATH} | base64 -w 0 > firmware.sig.b64",
    shell=True, check=True,
)

with open("firmware.sig.b64", "r") as f:
    sig_b64 = f.read().strip()

print(f"Signature: {sig_b64[:20]}...")

# ── 6. Prompt for version ────────────────────────────────────────────────────

version = input("Enter new version (e.g. 2.0.0): ").strip()
if not version:
    print("Error: version cannot be empty.")
    httpd.shutdown()
    exit(1)

# ── 7. Build & POST payload ──────────────────────────────────────────────────

firmware_url = f"http://{HOST_IP}:{PORT}/{BIN_PATH}"

payload = {
    "version":       version,
    "firmwareUrl":   firmware_url,
    "firmwareHash":  sha256_hash,
    "signatureB64":  sig_b64,
    "canaryPercent": 100,
}

print(f"\nPOSTing OTA payload to Go backend ({BACKEND}/api/ota/deploy)...")
print(f"  version:     {version}")
print(f"  firmwareUrl: {firmware_url}")
print(f"  hash:        {sha256_hash[:16]}...")

req = urllib.request.Request(
    f"{BACKEND}/api/ota/deploy",
    data=json.dumps(payload).encode(),
    headers={"Content-Type": "application/json"},
    method="POST",
)
campaign_id = None
targets     = []

try:
    with urllib.request.urlopen(req, timeout=10) as response:
        result      = json.loads(response.read().decode())
        campaign_id = result.get("campaignId", "n/a")
        targets     = result.get("targets", [])
        print(f"\n\033[92m✓ OTA campaign queued successfully!\033[0m")
        print(f"  Campaign ID : {campaign_id}")
        print(f"  Targets     : {targets}")
        print(f"  Count       : {result.get('count', 0)} device(s)")
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"\n\033[91m✗ Backend returned HTTP {e.code}: {body}\033[0m")
except Exception as e:
    print(f"\n\033[91m✗ Error deploying OTA: {e}\033[0m")

# ── 8. Live progress monitoring ───────────────────────────────────────────────

GRN, YEL, RED, CYN, DIM, RST = \
    "\033[92m", "\033[93m", "\033[91m", "\033[96m", "\033[2m", "\033[0m"

STATUS_ICON = {
    "pending":     f"{DIM}⏳ pending{RST}",
    "ack":         f"{CYN}📡 ack{RST}",
    "downloading": f"{CYN}⬇  downloading{RST}",
    "verifying":   f"{YEL}🔍 verifying{RST}",
    "success":     f"{GRN}✓  success{RST}",
    "error":       f"{RED}✗  error{RST}",
    "rollback":    f"{RED}↩  rollback{RST}",
}
TERMINAL = {"done", "failed"}

def fetch_campaign_status(cid):
    url = f"{BACKEND}/api/campaigns/{cid}"
    with urllib.request.urlopen(urllib.request.Request(url), timeout=5) as r:
        return json.loads(r.read().decode())

print(f"\nHTTP server still running at  http://{HOST_IP}:{PORT}/")

if campaign_id and campaign_id != "n/a":
    print(f"{CYN}Monitoring campaign {campaign_id}...{RST}  (Ctrl-C to stop early)\n")
    prev_lines = 0
    try:
        while True:
            try:
                cmp = fetch_campaign_status(campaign_id)
            except Exception as fe:
                print(f"{YEL}[monitor] {fe}{RST}")
                time.sleep(2)
                continue

            progress    = cmp.get("progress", {})
            cmp_status  = cmp.get("status", "?")
            success_cnt = cmp.get("successCount", 0)
            fail_cnt    = cmp.get("failureCount", 0)

            # Erase previous lines
            if prev_lines:
                print(f"\033[{prev_lines}A\033[J", end="")

            out_lines = []
            for dev_id, dp in progress.items():
                st  = dp.get("status", "pending")
                err = dp.get("error", "")
                row = f"  {CYN}{dev_id}{RST}  {STATUS_ICON.get(st, st)}"
                if err:
                    row += f"  {DIM}[{err}]{RST}"
                out_lines.append(row)

            camp_col = GRN if cmp_status == "done" else (RED if cmp_status == "failed" else YEL)
            out_lines.append(f"\n  Campaign: {camp_col}{cmp_status.upper()}{RST}"
                             f"  {GRN}✓{success_cnt}{RST}  {RED}✗{fail_cnt}{RST}")

            print("\n".join(out_lines))
            prev_lines = len(out_lines)

            if cmp_status in TERMINAL:
                print(f"\n{GRN}Campaign finished.{RST} "
                      "Leave this script running until the ESP32 finishes flashing.")
                break
            time.sleep(2)
    except KeyboardInterrupt:
        print(f"\n{YEL}Stopped early.{RST}")
else:
    print("Leave this script running until the ESP32 finishes downloading the firmware...")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("Shutting down deploy script.")
    httpd.shutdown()

