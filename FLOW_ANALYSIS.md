## 🏗️ GUARDIAN-OTA: Frontend → Backend → Hardware Flow Analysis

Complete breakdown of how UI clicks trigger backend processes and hardware execution.

---

## 📊 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       USER INTERFACE                            │
│                    (Next.js Dashboard)                          │
│  - Fleet Overview    - Vehicle Details    - Deployment Control │
└─────────────────────────────────────────────────────────────────┘
                              ▼
                    [HTTP REST API]
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND ORCHESTRATION                         │
│                    (Go + Gin + PostgreSQL)                      │
│  - API Handlers      - Campaign Manager   - Event Storage       │
└─────────────────────────────────────────────────────────────────┘
                              ▼
                      [MQTT Broker]
                   (Mosquitto on 1883)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     HARDWARE DEVICES                             │
│                   (ESP32 + FreeRTOS)                            │
│  - MQTT Client       - Security Verification - OTA Handler     │
└─────────────────────────────────────────────────────────────────┘
```

---

# ⚙️ FEATURE BREAKDOWN: Frontend → Backend → Hardware

## 1️⃣ **FEATURE: Fleet Overview (View Connected Devices)**

### 📱 FRONTEND TRIGGER
**File**: `dashboard/components/FleetDashboard.tsx` (Lines 1-50)

**What the user clicks**:
- Lands on dashboard
- Sees grid of vehicle cards
- Cards auto-load from API

**Code Flow**:
```tsx
// FleetDashboard.tsx
const { fleet, selectVehicle } = useFleet();
// fleet = array of FleetVehicle objects

// Display each vehicle in a clickable grid
fleet.map((v) => (
  <div onClick={() => selectVehicle(v.deviceId)}>
    {v.name}  {/* e.g., "Audi A8 e-tron" */}
    {v.safetyState}  {/* "SAFE" or "UNSAFE" */}
    {v.threatLevel}  {/* "LOW", "MEDIUM", "HIGH" */}
  </div>
))
```

### 🌐 API CALL (Frontend → Backend)
**Endpoint**: `GET /api/fleet`

**Frontend Code**: `dashboard/lib/api.ts` (Lines 6-10)
```tsx
export async function fetchFleet(): Promise<DeviceState[]> {
  const res = await fetch(`${backend}/api/fleet`, { cache: "no-store" });
  const data = await res.json();
  return data.devices as DeviceState[];
}
```

**When called**: On component mount + polling every 2-3 seconds

---

### 🔙 BACKEND HANDLER
**File**: `backend/api/handlers.go` (Lines 48-50)

```go
func (d *Deps) handleFleet(c *gin.Context) {
  devices := d.Registry.Snapshot()  // Get all devices from twin registry
  c.JSON(http.StatusOK, gin.H{"devices": devices, "count": len(devices)})
}
```

**What happens**:
1. Handler reads device twin registry (in-memory store)
2. Returns all `DeviceState` objects
3. Registry is updated when MQTT status messages arrive from hardware

---

### 🔌 HARDWARE CONNECTION
**File**: `firmware/main/mqtt_transport.c` (Lines 115-130)

```c
// When ESP32 boot completes, it sends status update:
mqtt_publish_status(NULL, "online", NULL);

// Topic: sdv/ota/status/<device_mac>
// Payload:
{
  "device_id": "AA:BB:CC:DD:EE:FF",
  "campaign_id": "",
  "status": "online"
}
```

**What happens**:
1. ESP32 publishes "online" status on boot
2. Backend MQTT consumer receives it
3. Backend updates device twin registry
4. Frontend fetches `/api/fleet` and displays updated device list

---

## 2️⃣ **FEATURE: Click Vehicle Card → View Details**

### 📱 FRONTEND TRIGGER
**File**: `dashboard/components/FleetDashboard.tsx` (Line 50)

```tsx
onClick={() => selectVehicle(v.deviceId)}
```

**What happens**:
- User clicks a vehicle card (e.g., "Audi A8 e-tron")
- Context state changes from "fleet" to "insight" view

**Code**:
```tsx
// FleetContext.tsx
const selectVehicle = useCallback((id: string) => {
  setSelectedVehicleId(id);     // Mark this vehicle as selected
  setActiveEcu(null);           // Reset ECU selection
  setCurrentView("insight");    // Switch to detail view
}, []);
```

---

## 3️⃣ **FEATURE: OTA Deployment Control (MAIN FEATURE - Firmware Update)**

### 📱 FRONTEND TRIGGER
**File**: `dashboard/components/dashboard.tsx` (Old monolithic version)

**What the user clicks**:
```
┌─────────────────────────────────────────────┐
│  OTA DEPLOYMENT CONTROL PANEL               │
├─────────────────────────────────────────────┤
│  FIRMWARE VERSION: [1.1.0]                  │
│  FIRMWARE URL: [http://localhost:9000/...]  │
│  SHA-256 HASH: [sha256-abc123...]           │
│  ECC SIGNATURE (BASE64): [MEUCIQ...]        │
│  CANARY ROLLOUT: [●●●●●●○○○○] 60%          │
│  SECURITY GATES:                            │
│    ✓ TLS Tunnel                             │
│    ✓ ECC Signature                          │
│    ✓ SHA-256 Integrity                      │
│    ✓ Rollback Guard                         │
│    ✓ Safety-Gate (No HIGH threats)          │
├─────────────────────────────────────────────┤
│  [▶ LAUNCH OTA CAMPAIGN]  ← USER CLICKS    │
└─────────────────────────────────────────────┘
```

**Frontend Code**:
```tsx
async function onDeploy() {
  if (deploying) return;
  setDeploying(true);
  appendLog("info", `▶ OTA deploy v${version} → ${canaryPct}% canary rollout`);
  
  try {
    await deployFirmware({
      version: "1.1.0",
      firmwareUrl: "http://localhost:9000/firmware/esp32.bin",
      firmwareHash: "sha256-abc123",
      signatureB64: "MEUCIQ…",
      canaryPercent: 60  // Only deploy to 60% of fleet
    });
    appendLog("info", "✓ Deploy accepted by orchestration layer");
  } catch {
    appendLog("warn", "Backend offline — deploy simulated locally");
  }
}
```

---

### 🌐 API CALL (Frontend → Backend)
**Endpoint**: `POST /api/ota/deploy`

**Frontend Code**: `dashboard/lib/api.ts` (Lines 23-32)
```tsx
export async function deployFirmware(payload: OTADeployPayload): Promise<DeployResult> {
  const res = await fetch(`${backend}/api/ota/deploy`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),  // Send all deployment parameters
  });
  return res.json();
}
```

---

### 🔙 BACKEND HANDLER (THE ORCHESTRATOR)
**File**: `backend/api/handlers.go` (Lines 52-105)

```go
func (d *Deps) handleDeploy(c *gin.Context) {
  // 1️⃣ PARSE REQUEST
  var req OTADeployRequest
  if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
    return
  }

  // 2️⃣ VALIDATE CANARY
  if req.CanaryPercent < 1 || req.CanaryPercent > 100 {
    req.CanaryPercent = 10  // Default to 10% if invalid
  }

  // 3️⃣ CREATE CAMPAIGN (with canary target selection)
  cmp, err := d.Campaigns.Create(
    req.Version,
    req.FirmwareURL,
    req.FirmwareHash,
    req.SignatureB64,
    req.CanaryPercent  // ← Only targets 60% of devices
  )
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
    return
  }

  // 4️⃣ BUILD MQTT COMMAND
  cmd := mqttclient.OTACommand{
    CampaignID:   cmp.ID,
    Version:      req.Version,
    FirmwareURL:  req.FirmwareURL,
    FirmwareHash: req.FirmwareHash,
    SignatureB64: req.SignatureB64,
    Targets:      cmp.Targets,  // Array of selected device IDs
    Nonce:        uuid.NewString(),
    IssuedAt:     time.Now().UTC().Format(time.RFC3339),
    TTLSeconds:   300,  // Command valid for 5 minutes
  }

  // 5️⃣ PUBLISH TO MQTT BROKER
  if d.Publisher != nil {
    if err := d.Publisher.PublishOTACommand(cmd); err != nil {
      slog.Warn("api: MQTT publish failed", "err", err)
    }
  }

  // 6️⃣ BROADCAST EVENT (WebSocket to all clients)
  d.Hub.Broadcast(ws.Event{
    Type: "ota_deploy_requested",
    Payload: gin.H{"campaign": cmp, "command": cmd},
  })

  // 7️⃣ RETURN SUCCESS
  c.JSON(http.StatusOK, gin.H{
    "queued": true,
    "campaignId": cmp.ID,
    "targets": cmp.Targets,
    "count": len(cmp.Targets),
  })
}
```

---

### 🎯 CAMPAIGN CREATION (Canary Selection Logic)
**File**: `backend/campaign/campaign.go` (Lines 50-80)

```go
func (m *Manager) Create(version, fwURL, hash, sig string, canaryPercent int) (*Campaign, error) {
  cmp := &Campaign{
    ID:            uuid.NewString(),
    Version:       version,
    FirmwareURL:   fwURL,
    FirmwareHash:  hash,
    SignatureB64:  sig,
    CanaryPercent: canaryPercent,
    Status:        StatusQueued,
    CreatedAt:     time.Now(),
    UpdatedAt:     time.Now(),
    Progress:      make(map[string]*DeviceProgress),
  }

  // 🎲 SELECT CANARY TARGETS (e.g., 60% of fleet)
  allDevices := m.registry.IDs()  // Get all device IDs
  numTargets := (len(allDevices) * canaryPercent) / 100
  if numTargets == 0 {
    numTargets = 1  // At least target 1 device
  }

  // Randomly shuffle and select top numTargets devices
  shuffled := make([]string, len(allDevices))
  copy(shuffled, allDevices)
  shuffleStrings(shuffled)
  cmp.Targets = shuffled[:numTargets]

  // Initialize progress tracking
  for _, deviceID := range cmp.Targets {
    cmp.Progress[deviceID] = &DeviceProgress{
      DeviceID: deviceID,
      Status:   "pending",
      UpdatedAt: time.Now(),
    }
  }

  m.mu.Lock()
  m.campaigns[cmp.ID] = cmp
  m.mu.Unlock()

  return cmp, nil
}
```

---

### 📡 MQTT PUBLISH (Backend → Devices)
**File**: `backend/mqtt/mqtt.go` (Lines 55-70)

```go
func (p *Publisher) PublishOTACommand(cmd OTACommand) error {
  // 1️⃣ MARSHAL command to JSON
  b, err := json.Marshal(cmd)
  if err != nil {
    return fmt.Errorf("mqtt publish: marshal: %w", err)
  }

  // 2️⃣ PUBLISH to MQTT topic "sdv/ota/command" at QoS-1
  token := p.client.Publish("sdv/ota/command", 1, false, b)
  token.Wait()

  if err := token.Error(); err != nil {
    return fmt.Errorf("mqtt publish: %w", err)
  }

  slog.Info("mqtt: published OTA command",
    "campaign", cmd.CampaignID,
    "targets", len(cmd.Targets))

  return nil
}
```

**MQTT Topic**: `sdv/ota/command`

**MQTT Message Payload** (JSON):
```json
{
  "campaign_id": "550e8400-e29b-41d4-a716-446655440000",
  "version": "1.1.0",
  "firmware_url": "http://localhost:9000/firmware/esp32.bin",
  "firmware_hash": "abc123...",
  "signature_b64": "MEUCIQ...",
  "targets": [
    "AA:BB:CC:DD:EE:FF",
    "11:22:33:44:55:66",
    "AA:BB:CC:DD:EE:77"
  ],
  "nonce": "uuid-string",
  "issued_at": "2026-04-18T10:30:00Z",
  "ttl_seconds": 300
}
```

---

## 🔌 HARDWARE EXECUTION (ESP32 Side)

### 📡 MQTT SUBSCRIPTION
**File**: `firmware/main/mqtt_transport.c` (Lines 90-110)

```c
void mqtt_event_handler(void *arg, esp_event_base_t base, int32_t event_id, void *event_data) {
  esp_mqtt_event_handle_t event = event_data;
  
  switch (event_id) {
    case MQTT_EVENT_CONNECTED:
      ESP_LOGI(TAG, "connected to broker");
      
      // 1️⃣ SUBSCRIBE to OTA command topic
      esp_mqtt_client_subscribe(s_client, "sdv/ota/command", 1);
      
      // 2️⃣ PUBLISH online status
      mqtt_publish_status(NULL, "online", NULL);
      break;

    case MQTT_EVENT_DATA:
      // 3️⃣ MESSAGE RECEIVED on "sdv/ota/command"
      if (strncmp(event->topic, "sdv/ota/command", event->topic_len) == 0) {
        ota_cmd_t cmd = {0};
        
        // 4️⃣ PARSE JSON payload
        if (parse_ota_command(event->data, event->data_len, &cmd)) {
          // 5️⃣ ENQUEUE command to OTA task
          xQueueSend(g_ota_queue, &cmd, portMAX_DELAY);
          mqtt_publish_status(cmd.campaign_id, "ack", NULL);
        }
      }
      break;
  }
}
```

---

### ⚙️ OTA TASK (Main Processing Loop)
**File**: `firmware/main/ota_handler.c`

```c
void ota_task(void *arg) {
  ota_cmd_t cmd = {0};

  while (1) {
    // 1️⃣ WAIT for command from MQTT
    if (xQueueReceive(g_ota_queue, &cmd, portMAX_DELAY) != pdTRUE) {
      continue;
    }

    ESP_LOGI(TAG, "OTA command received: v%s", cmd.version);
    mqtt_publish_status(cmd.campaign_id, "downloading", NULL);

    // 2️⃣ SAFETY GATE CHECK
    if (!check_brake_ecu_safe()) {
      ESP_LOGE(TAG, "SAFETY GATE FAILED: Brake ECU not safe");
      mqtt_publish_status(cmd.campaign_id, "error", "Brake ECU not SAFE");
      continue;
    }
    ESP_LOGI(TAG, "✓ Safety gate passed");

    // 3️⃣ VERIFY SIGNATURE (ECC P-256)
    if (!verify_ecc_signature(cmd.firmware_hash, cmd.signature_b64)) {
      ESP_LOGE(TAG, "SIGNATURE VERIFICATION FAILED");
      mqtt_publish_status(cmd.campaign_id, "error", "Signature invalid");
      continue;
    }
    ESP_LOGI(TAG, "✓ ECC signature verified");

    // 4️⃣ VERIFY INTEGRITY (SHA-256)
    if (!verify_firmware_integrity(cmd.firmware_url, cmd.firmware_hash)) {
      ESP_LOGE(TAG, "INTEGRITY CHECK FAILED");
      mqtt_publish_status(cmd.campaign_id, "error", "Integrity check failed");
      continue;
    }
    ESP_LOGI(TAG, "✓ Firmware integrity verified");

    // 5️⃣ DOWNLOAD & FLASH
    mqtt_publish_status(cmd.campaign_id, "verifying", NULL);
    if (esp_ota_download_and_flash(cmd.firmware_url)) {
      mqtt_publish_status(cmd.campaign_id, "success", NULL);
      esp_restart();  // ← REBOOT with new firmware
    } else {
      mqtt_publish_status(cmd.campaign_id, "rollback", "Flash failed");
      // Rollback to previous partition
      esp_ota_set_boot_partition(esp_ota_get_last_boot_partition());
      esp_restart();
    }
  }
}
```

---

### 📊 Status Reports (Hardware → Backend)
**File**: `firmware/main/mqtt_transport.c` (Lines 115-130)

```c
void mqtt_publish_status(const char *campaign_id, const char *status, const char *error) {
  char topic[80];
  snprintf(topic, sizeof(topic), "sdv/ota/status/%s", s_device_id);

  char payload[256];
  snprintf(payload, sizeof(payload),
    "{\"device_id\":\"%s\",\"campaign_id\":\"%s\",\"status\":\"%s\"%s%s}",
    s_device_id,
    campaign_id ? campaign_id : "",
    status,
    error ? ",\"error\":\"" : "",
    error ? error : ""
  );

  esp_mqtt_client_publish(s_client, topic, payload, 0, 1, 0);
}
```

**Published on**: `sdv/ota/status/<device_mac>`

**Example payload**:
```json
{
  "device_id": "AA:BB:CC:DD:EE:FF",
  "campaign_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "downloading"
}
```

**Status values**:
- `"ack"` - Device received command
- `"downloading"` - Fetching firmware
- `"verifying"` - Checking signature/hash
- `"success"` - Update complete
- `"rollback"` - Rolled back to previous version
- `"error"` - Update failed

---

### 🔄 Backend Receives Status
**File**: `backend/mqtt/mqtt.go` (Lines 75-90)

```go
func NewConsumer(c pahomqtt.Client, handler StatusHandler) *Consumer {
  consumer := &Consumer{client: c, handler: handler}

  c.Subscribe("sdv/ota/status/+", 1, func(client pahomqtt.Client, msg pahomqtt.Message) {
    // 1️⃣ PARSE status message
    var update StatusUpdate
    if err := json.Unmarshal(msg.Payload(), &update); err != nil {
      slog.Error("mqtt: status parse failed", "err", err)
      return
    }

    // 2️⃣ DISPATCH to handler
    handler(update)
  })

  return consumer
}
```

---

## 🎬 Complete Flow Sequence Diagram

```
USER (Frontend)              BACKEND (Go)                 HARDWARE (ESP32)
    │                           │                              │
    │ 1. Click "▶ LAUNCH"       │                              │
    ├──────────────────────────>│                              │
    │  POST /api/ota/deploy     │                              │
    │                           │ 2. Create Campaign           │
    │                           │ (select canary 60%)          │
    │                           │                              │
    │                           │ 3. Publish MQTT             │
    │                           ├─────────────────────────────>│
    │                           │  sdv/ota/command             │
    │                           │                              │ 4. Parse JSON
    │                           │<─────────────────────────────┤
    │<──────────────────────────┤  sdv/ota/status (ack)       │
    │  200 OK {campaignId}      │                              │
    │                           │                              │ 5. Check Safety Gate
    │ 5. WebSocket update       │                              │    (Brake ECU = SAFE)
    │  "ota_deploy_requested"   │                              │
    │                           │                              │ 6. Verify ECC Signature
    │                           │<─────────────────────────────┤
    │                           │  sdv/ota/status (downloading)│
    │                           │                              │
    │ 6. Poll /api/fleet        │ 7. Update campaign progress  │ 7. Download firmware
    │────────────────────────────>                             │    (HTTPS from URL)
    │<────────────────────────────  (shows progress %)        │
    │                           │                              │ 8. Verify SHA-256
    │                           │<─────────────────────────────┤
    │ 7. Live event broadcast   │  sdv/ota/status (verifying)│
    │  (WebSocket)              │                              │
    │                           │ 8. Update progress to 95%   │ 9. Flash to new partition
    │                           │    Store in campaign        │    (esp_ota_write_flash)
    │                           │                              │
    │                           │<─────────────────────────────┤
    │ 8. Dashboard shows 95%    │  sdv/ota/status (success)   │
    │    progress bar           │                              │ 10. Reboot
    │                           │ 9. Mark campaign success    │     (esp_restart)
    │                           │    Store in DB              │
    │                           │                              │ 11. Boot new firmware
    │ 9. Pod-cast "complete"    │<─────────────────────────────┤
    │                           │  sdv/ota/status (online)    │
    │                           │                              │
    │ 10. Refresh fleet         │ 10. Update twin registry    │
    │────────────────────────────>  otaVersion="1.1.0"       │
    │<────────────────────────────  
    │  Returns v1.1.0           │
```

---

## 🎯 Key Features & Their Implementations

| Feature | Frontend | Backend | Hardware |
|---------|----------|---------|----------|
| View Fleet | FleetDashboard.tsx | GET /api/fleet | MQTT publish status |
| Select Vehicle | FleetContext.tsx | N/A | N/A |
| Create OTA Campaign | Input form | POST /api/deploy → campaign.Create() | N/A |
| Canary Selection | Slider input | campaign.Manager (shuffle) | N/A |
| MQTT Command Pub | Dashboard logs | mqtt.Publisher | N/A |
| Command Reception | N/A (logs only) | N/A | mqtt_transport.c |
| Safety Gate Check | N/A | N/A | ota_handler.c (brake_ecu) |
| Signature Verify | N/A | N/A | security.c (ECC P-256) |
| Integrity Check | N/A | N/A | security.c (SHA-256) |
| Download Firmware | N/A | N/A | ota_handler.c (HTTPS) |
| Flash Device | N/A | N/A | esp_ota_write_flash() |
| Status Report | Polls /api/fleet | mqtt.Consumer → campaign.Update() | mqtt_publish_status() |
| Progress Broadcast | WebSocket | ws.Hub.Broadcast() | N/A |

---

## 🔐 Security Gates (Hardware Layer)

```c
// ota_handler.c safety verification chain
if (!check_brake_ecu_safe()) {
  ❌ REJECT UPDATE
}

if (!verify_ecc_signature(hash, sig_b64)) {
  ❌ REJECT UPDATE  (mbedTLS P-256)
}

if (!verify_firmware_integrity(url, hash)) {
  ❌ REJECT UPDATE  (SHA-256 on downloaded content)
}

// All gates passed ✓
✓ PROCEED TO FLASH
```

---

## 📊 Data Models

### DeviceState (Twin Registry)
```go
type DeviceState struct {
  DeviceID      string    `json:"deviceId"`
  OTAVersion    string    `json:"otaVersion"`
  SafetyState   string    `json:"safetyState"`
  ECUStates     map[string]string  // brake, powertrain, sensor, infotainment
  ThreatLevel   string    // LOW, MEDIUM, HIGH
  OTAProgress   int       // 0-100 %
  CampaignID    string    // Current campaign
}
```

### Campaign
```go
type Campaign struct {
  ID            string                        // UUID
  Version       string                        // "1.1.0"
  FirmwareURL   string                        // HTTPS or S3
  FirmwareHash  string                        // SHA-256
  SignatureB64  string                        // ECC signature
  CanaryPercent int                           // 1-100
  Targets       []string                      // Selected device IDs
  Progress      map[string]*DeviceProgress   // Per-device status
  Status        Status                        // queued|running|done|failed
}
```

### OTA Command (MQTT)
```json
{
  "campaign_id": "uuid",
  "version": "1.1.0",
  "firmware_url": "https://...",
  "firmware_hash": "sha256:...",
  "signature_b64": "MEU...",
  "targets": ["AA:BB:CC:DD:EE:FF"],
  "nonce": "uuid",
  "issued_at": "2026-04-18T10:30:00Z",
  "ttl_seconds": 300
}
```

---

## 🚀 Cold Start Example

**Scenario**: Deploy v1.1.0 to 60% of 3 devices (Audi, Mercedes, BMW)

**Timeline**:

```
T=00s | User inputs:
      | - Firmware v1.1.0
      | - URL: http://localhost:9000/esp32.bin
      | - Hash: abc123...
      | - Sig: MEUCIQ...
      | - Canary: 60% (2 out of 3 devices)
      | - Clicks "▶ LAUNCH OTA CAMPAIGN"

T=00s | Frontend calls: POST /api/ota/deploy
      | Body: { version, firmwareUrl, canaryPercent: 60, ... }

T=01s | Backend handleDeploy:
      | 1. Creates Campaign with ID=X
      | 2. Selects canary targets: [Audi, BMW] (60% = 2/3)
      | 3. Publishes MQTT on "sdv/ota/command"
      |    Targets: ["AA:BB:CC:DD:EE:FF", "AA:BB:CC:DD:EE:77"]

T=02s | Audi (AA:BB:CC:DD:EE:FF) receives MQTT:
      | 1. Parses JSON command
      | 2. Checks: Is "AA:BB:CC:DD:EE:FF" in targets? YES
      | 3. Enqueues to ota_task
      | 4. Publishes "ack" status

T=03s | Audi ota_task executes:
      | 1. Check: Brake ECU status = SAFE? YES ✓
      | 2. Verify: ECC signature matches? YES ✓
      | 3. Download: HTTPS from localhost:9000/esp32.bin
      | 4. Verify: SHA-256 hash matches? YES ✓
      | 5. Flash: Write to OTA partition
      | 6. Reboot: esp_restart()

T=04s | Audi boots with new firmware
      | 1. Boot partition set to new image
      | 2. Publishes "online" status
      | 3. Backend updates twin: otaVersion="1.1.0"

T=05s | Frontend /api/fleet shows:
      | Audi: v1.1.0 ← UPDATED ✓
      | BMW: v1.0.0 (still updating)
      | Mercedes: v1.0.0 (not targeted)

T=10s | All canary targets complete
      | Campaign status: "done"
      | Success count: 2/2
      | Can now deploy to remaining fleet if desired
```

---

## 💡 Key Takeaways

1. **Frontend is a visualization layer**: It shows state and triggers API calls
2. **Backend is the orchestrator**: It creates campaigns, selects canary targets, publishes MQTT
3. **MQTT is the command channel**: Backend→Hardware real-time messaging
4. **Hardware is autonomous**: ESP32 doesn't need polling; it subscribes to commands
5. **Safety is hardware-enforced**: Brake ECU, signature, and integrity checks happen on device
6. **Rollback is automatic**: If anything fails, device reverts to last-known-good firmware
7. **State is twin-mirrored**: Backend maintains device state; frontend queries it via REST

