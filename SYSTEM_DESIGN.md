# 1) System Architecture (End-to-End)

- **ESP32 (single physical node)** hosts:
  - Edge gateway (MQTT over TLS, OTA HTTPS client)
  - Virtual ECU runtime (Brake, Powertrain, Sensor, Infotainment tasks)
  - Simulated CAN bus (FreeRTOS queue transport)
- **Go backend** provides:
  - OTA campaign API
  - Canary target selection across virtual fleet
  - Event persistence in PostgreSQL
  - WebSocket broadcast to dashboard
- **Mosquitto** acts as command/telemetry broker
- **MinIO** hosts signed firmware binary + manifest
- **Next.js dashboard** is control cockpit with cinematic visual language and live status/event streaming

# 2) Hardware Wiring (Exact Pin Connections)

## ESP32 + I2C OLED (SSD1306)

- `ESP32 3V3` -> `OLED VCC`
- `ESP32 GND` -> `OLED GND`
- `ESP32 GPIO21` -> `OLED SDA`
- `ESP32 GPIO22` -> `OLED SCL`

## Optional Arduino UNO as Auxiliary Node

- `ESP32 GPIO17 (TX2)` -> `UNO RX (D0)` (use level-safe divider)
- `ESP32 GPIO16 (RX2)` -> `UNO TX (D1)` (3.3V-safe path)
- `ESP32 GND` -> `UNO GND`

# 3) ESP32 Firmware Design

- **Tasks**
  - `brake_ecu_task`: safety gate source, toggles SAFE/UNSAFE
  - `powertrain_ecu_task`: emits torque signals
  - `sensor_ecu_task`: consumes simulated CAN queue
  - `infotainment_ecu_task`: UI heartbeat bus activity
  - `ota_task`: executes signed OTA only when safe
- **Queues**
  - `can_queue`: inter-ECU message transport (simulated CAN)
  - `ota_queue`: update command dispatch
- **OTA Flow**
  1. Receive OTA command over MQTT topic
  2. Check safety gate from brake ECU
  3. Verify SHA-256 + ECC signature
  4. Execute `esp_https_ota`
  5. Reboot into new slot
  6. If health-check fails, call rollback API and reboot

# 4) Backend Design (Go + MQTT + WebSocket Bridge)

- `POST /api/ota/deploy`
  - accepts version/url/hash/signature/canary %
  - computes target virtual devices
  - publishes command to `sdv/ota/command`
- `GET /api/fleet`
  - returns full fleet state model for dashboard bootstrap
- `GET /ws/events`
  - pushes `fleet_tick`, deployment, and security events
- PostgreSQL `ota_events`
  - immutable event record for deployment auditability

# 5) Frontend Dashboard (Next.js)

- **Page structure**
  - Hero control panel
  - Firmware deployment panel
  - Live ECU status
  - Real-time log stream
  - Security panel
  - Fleet simulation (device cards + state)
- **Animation implementation**
  - Framer Motion for spring interactions and staged reveals
  - Hover neon glows on actionable elements
  - Staggered log entry transitions
  - Floating stat cards for live depth effect

# 6) Security Implementation (Detailed + Attack Prevention)

- **ECC signature verification**
  - mbedTLS verifies OTA payload signature against embedded public key.
  - Prevents forged firmware acceptance and supply-chain payload tampering.
- **SHA-256 integrity verification**
  - Firmware binary hash compared to signed manifest hash.
  - Prevents corruption/replay with altered binary bits.
- **TLS MQTT**
  - Encrypted command channel to broker.
  - Prevents MITM sniffing/injection on OTA command topics.
- **Device identity with eFuse MAC**
  - Device-specific identity derived from immutable hardware MAC.
  - Prevents spoofing of logical node identity.
- **Pre-update safety validation**
  - OTA blocked when brake ECU marks UNSAFE.
  - Prevents updates during unsafe operating conditions.
- **Rollback**
  - ESP-IDF dual-partition rollback after failed self-test.
  - Prevents bricking and bad-firmware persistence.

# 7) OTA Implementation (ESP-IDF Steps)

1. Build firmware: `idf.py build`
2. Generate SHA-256 hash from `.bin`.
3. Sign hash with ECC private key offline.
4. Upload binary + signed manifest to MinIO.
5. Dashboard deploy action posts campaign to backend.
6. Backend publishes OTA command with canary targets.
7. ESP32 downloads via `esp_https_ota`.
8. Boot new image; run health-check.
9. Mark valid (`esp_ota_mark_app_valid_cancel_rollback`) or rollback.

# 8) Fleet Simulation Logic

- Single physical ESP32 + 20 virtual fleet IDs in backend.
- Canary rollout uses percentage selection.
- Anomaly engine injects:
  - timing jitter
  - ECU warning/failure states
  - malicious deploy attempt markers
- Dashboard visualizes risk spread and rollout progression.

# 9) Demo Flow

1. Start infra + backend + dashboard.
2. Open dashboard hero panel and confirm live device count.
3. Set firmware metadata and canary percentage.
4. Press deploy and observe animated confirmation.
5. Watch real-time logs and ECU status cards transition.
6. Trigger unsafe state simulation and confirm deployment block.
7. Simulate failure and show rollback event.

# 10) Failure Scenarios + Handling

- **Unsafe driving state:** update rejected before download.
- **Signature mismatch:** cryptographic gate denies install.
- **Hash mismatch:** integrity gate denies install.
- **Network/TLS failure:** retry with exponential backoff.
- **Boot health-check failure:** auto rollback to previous slot.
- **Fleet anomaly spike:** backend flags HIGH threat and pauses rollout.

# 11) Critical Code Snippets (References)

- ESP32 virtual ECUs + queue bus + OTA task: `firmware/main/main.c`
- Backend canary deploy + WebSocket broadcast: `backend/main.go`
- Dashboard motion UI + deploy controls: `dashboard/components/dashboard.tsx`

