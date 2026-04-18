# OTA Pipeline Specification

## 1. OTA Command — MQTT Payload (`sdv/ota/command`)

Published by the backend, consumed by all ESP32 nodes:

```json
{
  "campaign_id":   "cmp-1745572740000",
  "version":       "2.4.1",
  "firmware_url":  "https://minio.local/ota/guardian-esp32-v2.4.1.bin",
  "firmware_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "signature_b64": "MEUCIQDexample...base64DERencoded==",
  "targets":       ["AA:BB:CC:DD:EE:01", "AA:BB:CC:DD:EE:07"],
  "nonce":         "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "issued_at":     "2026-04-18T08:39:00Z",
  "ttl_seconds":   300
}
```

| Field          | Type     | Description |
|----------------|----------|-------------|
| `campaign_id`  | string   | Unique ID matching the backend campaign record |
| `version`      | string   | SemVer. Logged on device for audit. |
| `firmware_url` | string   | HTTPS URL to the firmware binary on MinIO |
| `firmware_hash`| string   | Lowercase hex SHA-256 of the binary |
| `signature_b64`| string   | Base64(DER(ECDSA-P256 signature over the SHA-256 hash)) |
| `targets`      | string[] | List of eFuse MAC addresses. If absent: broadcast to all. |
| `nonce`        | UUIDv4   | Unique per-campaign ID. Devices reject replays. |
| `issued_at`    | RFC3339  | Command creation timestamp (UTC) |
| `ttl_seconds`  | int      | Validity window. Commands older than TTL are rejected. |

---

## 2. Device Status — MQTT Publish (`sdv/ota/status/<device_mac>`)

Published by each ESP32 at each stage, consumed by the backend:

```json
{
  "device_id":   "AA:BB:CC:DD:EE:01",
  "campaign_id": "cmp-1745572740000",
  "status":      "success",
  "error":       ""
}
```

| Status value  | Meaning |
|---------------|---------|
| `online`      | Device connected to broker |
| `ack`         | Command received and queued |
| `downloading` | HTTPS OTA in progress |
| `verifying`   | SHA-256 + ECC check in progress |
| `success`     | Partition flashed and valid; rebooting |
| `rollback`    | Health check failed; rolled back to prior partition |
| `error`       | Fatal failure; `error` field contains reason code |

---

## 3. Firmware Manifest — MinIO Object (`ota/<version>/manifest.json`)

Stored alongside the binary. Verified by CI before promotion to production bucket:

```json
{
  "version":     "2.4.1",
  "sha256":      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "signature_b64": "MEUCIQDexample...==",
  "build_ts":    "2026-04-17T22:00:00Z",
  "target":      "ESP32-WROOM-32",
  "size_bytes":  1048576,
  "changelog":   "Fix brake ECU timeout; add HTTPS retry logic"
}
```

---

## 4. Signing Workflow

```bash
# 1. Generate key pair (one-time, store private key offline)
openssl ecparam -name prime256v1 -genkey -noout -out ota-key.pem
openssl ec -in ota-key.pem -pubout -out ota-pubkey.pem

# 2. Build firmware
idf.py build

# 3. Compute SHA-256 of the binary
sha256sum build/guardian-ota.bin | awk '{print $1}' > firmware.sha256
HASH=$(cat firmware.sha256)

# 4. Sign the binary hash with your private key (DER output → base64)
printf "%s" "$HASH" | xxd -r -p | \
  openssl dgst -sha256 -sign ota-key.pem | \
  base64 -w 0 > firmware.sig.b64
SIG=$(cat firmware.sig.b64)

# 5. Upload binary + manifest to MinIO
mc cp build/guardian-ota.bin minio/ota/2.4.1/guardian-esp32-v2.4.1.bin
mc cp manifest.json           minio/ota/2.4.1/manifest.json
```

---

## 5. End-to-End Flow

```
Dashboard             Backend (Go)                MQTT Broker       ESP32 Nodes
────────────────────  ──────────────────────────  ──────────────    ────────────────────
POST /api/ota/deploy
  { version, url,
    hash, sig, 10% }
                    → campaign.Create()
                      → select 2/20 devices
                      → mqtt.Publish(
                          "sdv/ota/command",
                           {cmd payload} )
                                           →→→→→  deliver to all     [all nodes receive]
                                                                      [non-targets: skip]
                                                                      [target node:]
                                                                        safety gate ✓
                                                                        nonce fresh ✓
                                                                        download fw
                    ←←←←←←←←←←←←←←←←←←←←←←←  publish status:ack
                    ←←←←←←←←←←←←←←←←←←←←←←←  publish: downloading
                                                                        sha256 verify ✓
                                                                        ecc verify ✓
                    ←←←←←←←←←←←←←←←←←←←←←←←  publish: success
                    → campaign.UpdateDeviceStatus()
                    → hub.Broadcast("device_status")
WebSocket stream ←←
campaign progress ←←
```
