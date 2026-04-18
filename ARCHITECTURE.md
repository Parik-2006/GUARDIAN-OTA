## 🎯 Quick Reference: Frontend Features → Hardware Commands

### 1. FLEET VIEW
```
┌─ FRONTEND ────────────────────────┐
│ dashboard/components/FleetDashboard.tsx  │
│                                   │
│ ┌─────────────────────────────┐   │
│ │ FLEET OVERVIEW              │   │
│ ├─────────────────────────────┤   │
│ │ [Audi A8 e-tron]            │   │
│ │  Status: ONLINE             │   │
│ │  Threat: LOW ✓              │ ◄─┼─ Shows data from
│ │  Safety: SAFE ✓             │   │  /api/fleet
│ ├─────────────────────────────┤   │
│ │ [Mercedes-AMG S63]          │   │
│ │  Status: OFFLINE            │   │
│ │  Threat: MEDIUM             │   │
│ └─────────────────────────────┘   │
└───────────────────────────────────┘
         ▼ (Fetches continuously)
┌─ BACKEND ──────────────────────────┐
│ api/handlers.go - handleFleet()    │
│                                    │
│ devices := registry.Snapshot()     │
│ return []DeviceState              │
└────────────────────────────────────┘
         ▼ (From in-memory store)
┌─ HARDWARE ─────────────────────────┐
│ firmware/main/mqtt_transport.c    │
│                                    │
│ mqtt_publish_status("online")      │
│ Topic: sdv/ota/status/AA:BB:...   │
└────────────────────────────────────┘
```

**RESTful**: `GET /api/fleet`
**Trigger**: Component mount + polling

---

### 2. VEHICLE DETAIL VIEW
```
┌─ FRONTEND ────────────────────────┐
│ Click vehicle card               │
│ → selectVehicle(vehicleId)       │
│ → setCurrentView("insight")      │
│                                  │
│ Shows:                          │
│ - 3D car model                  │
│ - ECU status (brake, sensor...)  │
│ - Security chain (TLS, ECC...)   │
│ - Rollback armed status         │
└──────────────────────────────────┘
         ▼ (No new API call)
┌─ BACKEND ──────────────────────────┐
│ (No action)                       │
│ State already in frontend context  │
└────────────────────────────────────┘
         ▼
┌─ HARDWARE ─────────────────────────┐
│ (No action)                       │
└────────────────────────────────────┘
```

**Trigger**: Click on vehicle card
**Action**: State change only (no API)

---

### 3. OTA DEPLOYMENT (MAIN ACTION)
```
┌─────────────────────────────────────────────┐
│            FRONTEND DEPLOYMENT PANEL       │
├─────────────────────────────────────────────┤
│                                             │
│  Firmware Version: [1.1.0_________]        │
│  Firmware URL:     [http://localhost:9000..]
│  SHA-256 Hash:     [abc123...____]        │
│  ECC Signature:    [MEUCIQ...____]        │
│  Canary Rollout:   [●●●●●○○○○○] 50%     │
│                                             │
│  Security Gates:                            │
│   ✓ TLS Tunnel     ✓ ECC Signature        │
│   ✓ Integrity      ✓ Rollback Guard       │
│   ✓ Safety-Gate (No HIGH threats)          │
│                                             │
│     [▶ LAUNCH OTA CAMPAIGN]                │
│                                             │
│  Event Log:                                 │
│  [INFO] ▶ OTA deploy v1.1.0 → 50% canary │
│  [INFO] Deploy accepted by backend        │
│  [INFO] Campaign ID: 550e8400...          │
│  [INFO] Targets: 2 of 3 vehicles          │
└─────────────────────────────────────────────┘
```

**Action**: User fills form → Clicks "▶ LAUNCH"

**Frontend Code**:
```tsx
onClick={onDeploy}
  ↓
POST /api/ota/deploy
  ↓
{
  version: "1.1.0",
  firmwareUrl: "http://localhost:9000/esp32.bin",
  firmwareHash: "sha256:abc123",
  signatureB64: "MEUCIQ...",
  canaryPercent: 50
}
```

---

### 4. BACKEND CAMPAIGN CREATION
```
┌─ BACKEND API HANDLER ──────────────────┐
│ api/handlers.go - handleDeploy()      │
│                                        │
│ 1. Parse request JSON                 │
│ 2. Validate canaryPercent (1-100)     │
│ 3. Call Campaigns.Create(...)         │
│                                        │
└────────────────────────────────────────┘
         ▼
┌─ CAMPAIGN MANAGER ──────────────────────┐
│ campaign/campaign.go - Create()        │
│                                        │
│ 1. Get all device IDs from registry    │
│    devices = [A, B, C]                │
│                                        │
│ 2. Calculate canary count             │
│    50% of 3 = 1.5 → 1 device          │
│    targets = [shuffle(devices)[:1]]   │
│                                        │
│ 3. Create Campaign object with ID     │
│    targets = [A] (randomized)        │
│                                        │
└────────────────────────────────────────┘
         ▼
┌─ MQTT PUBLISHER ────────────────────────┐
│ mqtt/mqtt.go - PublishOTACommand()    │
│                                        │
│ 1. Marshal campaign to JSON            │
│ 2. Publish to Mosquitto on:            │
│    Topic: "sdv/ota/command"           │
│    QoS: 1 (At least once delivery)    │
│                                        │
└────────────────────────────────────────┘
         ▼
      MQTT BROKER
    (Mosquitto on 1883)
```

---

### 5. MQTT COMMAND PUBLISHED
```
Topic: sdv/ota/command
QoS: 1

Payload:
┌────────────────────────────────────────────┐
│ {                                          │
│   "campaign_id": "550e8400-e29b-41d4...",│
│   "version": "1.1.0",                     │
│   "firmware_url": "http://localhost:9000/esp32.bin", │
│   "firmware_hash": "abc123456...",       │
│   "signature_b64": "MEUCIQ...",          │
│   "targets": [                            │
│     "AA:BB:CC:DD:EE:FF"                  │
│   ],                                      │
│   "nonce": "uuid-123",                   │
│   "issued_at": "2026-04-18T10:30:00Z",  │
│   "ttl_seconds": 300                     │
│ }                                        │
└────────────────────────────────────────────┘
         ▼
   (Broadcast to ALL subscribers)
```

---

### 6. HARDWARE RECEIVES & PROCESSES
```
┌─ ESP32 MQTT SUBSCRIPTION ────────────┐
│ firmware/main/mqtt_transport.c      │
│                                      │
│ 1. Subscribe to "sdv/ota/command"   │
│ 2. Receive MQTT message             │
│ 3. Parse JSON payload               │
│ 4. Check: Is this device targeted?  │
│    "AA:BB:CC:DD:EE:FF" in targets?  │
│    YES ✓                            │
│ 5. Enqueue ota_cmd_t to ota_task   │
│ 6. Publish ACK status               │
│                                      │
└──────────────────────────────────────┘
         ▼
┌─ OTA TASK (Main OTA Handler) ────────┐
│ firmware/main/ota_handler.c         │
│                                      │
│ ┌─ SAFETY GATE ──────────────────┐  │
│ │ Check brake ECU status = SAFE? │  │
│ │ if NO → REJECT & rollback      │  │
│ │ if YES ✓ → continue            │  │
│ └────────────────────────────────┘  │
│                                      │
│ ┌─ ECC SIGNATURE VERIFY ─────────┐  │
│ │ mbedTLS P-256 signature check  │  │
│ │ if INVALID → REJECT            │  │
│ │ if VALID ✓ → continue          │  │
│ └────────────────────────────────┘  │
│                                      │
│ ┌─ DOWNLOAD FIRMWARE ────────────┐  │
│ │ HTTPS from firmware_url        │  │
│ │ Stream to OTA partition        │  │
│ └────────────────────────────────┘  │
│                                      │
│ ┌─ SHA-256 INTEGRITY CHECK ──────┐  │
│ │ Verify downloaded == hash      │  │
│ │ if MISMATCH → REJECT           │  │
│ │ if MATCH ✓ → continue          │  │
│ └────────────────────────────────┘  │
│                                      │
│ ┌─ FLASH & REBOOT ───────────────┐  │
│ │ esp_ota_set_boot_partition()   │  │
│ │ esp_restart()                  │  │
│ └────────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
         ▼
    DEVICE REBOOTS
    with NEW firmware
         ▼
    Boot complete
    Publish "online" status
```

---

### 7. STATUS UPDATES (Hardware → Backend)
```
┌─ HARDWARE PUBLISHES STATUS ────────┐
│ Topic: sdv/ota/status/<device_id>  │
│                                    │
│ Status sequence:                   │
│ 1. "ack"       - Got command       │
│ 2. "downloading" - Fetching file   │
│ 3. "verifying"   - Checking sig    │
│ 4. "success"     - Complete!       │
│ (or "error"/"rollback" on failure) │
└────────────────────────────────────┘
         ▼
      MQTT BROKER
         ▼
┌─ BACKEND MQTT CONSUMER ───────────┐
│ mqtt/mqtt.go - Consumer.Subscribe()│
│                                    │
│ 1. Receive status update           │
│ 2. Parse JSON                      │
│ 3. Call handler(StatusUpdate)      │
│ 4. Update campaign progress        │
│ 5. Update device twin registry     │
│ 6. Persist to database             │
└────────────────────────────────────┘
         ▼
┌─ FRONTEND (WebSocket) ────────────┐
│ Receives broadcast event:         │
│ "device_updated"                 │
│ Shows progress to user            │
│                                   │
│ Progress bar:                     │
│ [█████████░░░░░░░░░] 50%        │
└───────────────────────────────────┘
```

---

### 8. FRONTEND POLLING (Final State)
```
┌─ FRONTEND polls /api/fleet ────────┐
│ Once update completes             │
│                                   │
│ GET /api/fleet                   │
│   ↓                              │
│ Backend returns updated twins    │
│   ↓                              │
│ Frontend shows:                  │
│                                  │
│ Audi (v1.0.0 → v1.1.0) ✓ UPDATED│
│ Mercedes (v1.0.0) not targeted    │
│ BMW (v1.0.0 → v1.1.0) ✓ UPDATING │
│                                  │
└───────────────────────────────────┘
```

---

## 🎬 Timeline

```
User Action          Docker  Backend    MQTT      Hardware      Device
     │                 │        │         │          │            │
     ├─ Click "LAUNCH"─┤        │         │          │            │
     │                 │ ┌─────>│         │          │            │
     │                 │ │      │ ┌──────>│ COMMAND  │            │
     │                 │ │      │ │       ├─────────>│            │
     │                 │ │      │ │       │          ├─ Parse    │
     │                 │ │      │ │       │          ├─ Verify   │
     │                 │ │      │ │       │          ├─ Download │
     │                 │ │      │ │       │<─ ACK ───┤           │
     │<─────┐          │ │      │ │       │          │           │
     │      └─ 200 OK  │ │      │ │       │          ├─ Flash   │
     │                 │ │      │ │       │          │           │
     │ (Poll fleet)    │ │      │ │       │          │           │
     ├────────────────>│ │      │ │       │          │<─ ONLINE ─┤
     │                 │ │      │<────┬──┬──────────┘           │
     │<─ v1.1.0 ✓      │ │      │     │  └─ SUCCESS            │
     │                 │ │      │     │                         │
     └─ Dashboard OK   │ │      │     └─ DB UPDATE             │
                       │ │      │                               │
           2s    5s   10s  15s  30s     30s       35s           60s
```

---

## 🔑 Key API Endpoints

| Method | Endpoint | Purpose | Frontend Caller |
|--------|----------|---------|-----------------|
| `GET` | `/api/fleet` | Get all devices | FleetDashboard, polling |
| `GET` | `/health` | Health check | (optional) |
| `POST` | `/api/ota/deploy` | Create & deploy OTA campaign | Deploy button |
| `GET` | `/api/campaigns` | List all campaigns | (optional dashboard) |
| `GET` | `/api/campaigns/:id` | Get campaign details | (optional) |
| `WS` | `/ws/events` | WebSocket events | FleetContext, real-time |

---

## 🔌 MQTT Topics

| Topic | Direction | Purpose |
|-------|-----------|---------|
| `sdv/ota/command` | Backend → Device | OTA command with firmware details |
| `sdv/ota/status/<mac>` | Device → Backend | Status updates (ack, downloading, success, etc.) |

---

## 💾 Database Schema (PostgreSQL)

```sql
-- Campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  version VARCHAR(32),
  firmware_url TEXT,
  firmware_hash VARCHAR(65),
  signature_b64 TEXT,
  canary_percent INT,
  status VARCHAR(32),  -- queued, running, done, failed
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Campaign progress (device-level)
CREATE TABLE campaign_progress (
  campaign_id UUID,
  device_id VARCHAR(18),
  status VARCHAR(32),  -- pending, ack, downloading, verifying, success, error
  updated_at TIMESTAMP,
  error_msg TEXT,
  PRIMARY KEY (campaign_id, device_id)
);

-- Events (audit trail)
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  type VARCHAR(64),
  payload JSONB,
  created_at TIMESTAMP
);
```

---

## 🎯 Implementation Order

**If adding a new feature, follow this order**:

1. **Frontend UI** → User-facing button/input
2. **Frontend API call** → `dashboard/lib/api.ts`
3. **Backend endpoint** → `backend/api/handlers.go`
4. **Business logic** → `backend/campaign/` or `backend/twin/`
5. **MQTT publish** → `backend/mqtt/mqtt.go`
6. **Hardware subscription** → `firmware/main/mqtt_transport.c`
7. **Hardware execution** → `firmware/main/ota_handler.c` or related
8. **Status report** → `firmware/main/` publishes status
9. **Backend consumer** → `backend/mqtt/` handles status
10. **Frontend display** → Poll or WebSocket update

