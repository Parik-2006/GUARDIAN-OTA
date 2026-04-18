# 🛡️ GUARDIAN-OTA: Secure SDV Over-The-Air Firmware Update Platform

> **Enterprise-Grade OTA Orchestration for Software-Defined Vehicles**

A production-grade, security-hardened **Over-The-Air (OTA) firmware update system** for Software-Defined Vehicles (SDVs). This platform demonstrates end-to-end orchestration with secure canary rollouts, cryptographic signature verification, real-time telemetry, and automated rollback protection.

[![Status](https://img.shields.io/badge/status-production--ready-green)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)]()
[![Go](https://img.shields.io/badge/Go-1.21-cyan)]()
[![ESP-IDF](https://img.shields.io/badge/ESP--IDF-5.1-orange)]()

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Go 1.21+
- Docker & Docker Compose
- ESP32 (for hardware integration)

### Run Everything with One Click

```bash
# Press F5 in VSCode or run:
node run.js

# Or use the shell script:
bash start.sh
```

**Dashboard opens**: http://localhost:3000  
**Backend API**: http://localhost:8080  
**MQTT Broker**: localhost:1883

---

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [MQTT Protocol](#mqtt-protocol)
- [Security](#security)
- [Development](#development)
- [Contributing](#contributing)

---

## ✨ Features

### 🎯 Core Capabilities

- **End-to-End Security**: ECC P-256 signature verification + SHA-256 integrity checks via mbedTLS
- **Operational Safety Gates**: Real-time vehicle state validation (e.g., Brake ECU check) before update application
- **Cinematic Monitoring**: High-performance Next.js dashboard with live WebSocket telemetry and Framer Motion animations
- **Canary Rollouts**: Deployment campaigns with configurable fleet percentage targets (1-100%)
- **Anti-Brick Resilience**: Dual-slot partition scheme with automatic rollback on boot failure
- **Multi-Vehicle Support**: Manages diverse fleet (Audi A8, Mercedes-AMG S63, BMW M5 with different ECU configs)
- **Real-Time Event Streaming**: Live campaign progress, device status, and security alerts via WebSocket
- **Persistent Campaign History**: PostgreSQL-backed campaign tracking and audit trail

### 🏗️ Architecture Features

- **Modular Microservices**: Clean separation of concerns (API, Campaign Manager, Twin Registry, MQTT)
- **Device Twin Pattern**: In-memory mirror of device state synchronized via MQTT
- **RESTful API**: Type-safe HTTP endpoints with Gin framework
- **MQTT Pub/Sub**: Asynchronous command delivery and status reporting
- **WebSocket Broadcasting**: Real-time frontend updates without polling

---

## 🏛️ Architecture

### System Diagram

```
┌─────────────────────────────────────────────┐
│       Next.js Dashboard (3000)              │
│   - Fleet Overview                          │
│   - Vehicle Details                         │
│   - OTA Deployment Control                  │
└─────────────────────────────────────────────┘
              ↓ HTTP REST API ↓
┌─────────────────────────────────────────────┐
│     Go Backend (8080)                       │
│   - API Handlers                            │
│   - Campaign Manager                        │
│   - Device Twin Registry                    │
│   - Event Store                             │
└─────────────────────────────────────────────┘
              ↓ MQTT Broker ↓
          (Mosquitto:1883)
         ↙           ↘
┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │  ESP32 Nodes │
│  (Events)    │  │  (Firmware)  │
└──────────────┘  └──────────────┘
```

### Component Responsibilities

| Component | Purpose | Tech |
|-----------|---------|------|
| **Dashboard** | User interface & visualization | Next.js, React, Three.js, Framer Motion |
| **Backend API** | Business logic & orchestration | Go, Gin, PostgreSQL |
| **Campaign Manager** | Canary selection & state tracking | Go |
| **Device Twin** | Device state mirror | In-memory store + MQTT sync |
| **MQTT Broker** | Command delivery & status reporting | Mosquitto |
| **Hardware** | Firmware update execution | ESP32, ESP-IDF, C/FreeRTOS |
| **Security** | Crypto verification | mbedTLS, ECC P-256, SHA-256 |

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14.2 (App Router)
- **UI Library**: React 18.3
- **3D Visualization**: Three.js + React Three Fiber
- **Animations**: Framer Motion
- **Styling**: TailwindCSS
- **Types**: TypeScript 5.5

### Backend
- **Language**: Go 1.21
- **Web Framework**: Gin
- **Database**: PostgreSQL 16
- **Real-time**: WebSocket (via Gin)
- **Task Queue**: Channels

### Hardware
- **Platform**: ESP32 (ESP-IDF 5.1)
- **Runtime**: FreeRTOS
- **Security**: mbedTLS
- **MQTT Client**: Paho MQTT

### Infrastructure
- **Container**: Docker & Docker Compose
- **MQTT**: Mosquitto 2
- **Storage**: MinIO (S3-compatible)
- **Database**: PostgreSQL

---

## 📁 Project Structure

```
GUARDIAN-OTA/
├── 📂 dashboard/                 # Next.js frontend application
│   ├── app/                     # App router pages
│   ├── components/              # React components
│   │   ├── FleetDashboard.tsx  # Fleet overview
│   │   ├── VehicleInsight.tsx  # Vehicle details
│   │   ├── CarModel3D.tsx      # 3D car visualization
│   │   └── ...                 # Other UI components
│   ├── lib/
│   │   ├── api.ts              # HTTP client (REST endpoints)
│   │   └── ws.ts               # WebSocket client
│   ├── styles/                 # Global CSS
│   ├── types/                  # TypeScript definitions
│   └── package.json
│
├── 📂 backend/                  # Go backend application
│   ├── main.go                 # Entry point
│   ├── api/                    # HTTP route handlers
│   │   └── handlers.go
│   ├── campaign/               # Campaign orchestration
│   │   └── campaign.go
│   ├── twin/                   # Device twin registry
│   │   └── twin.go
│   ├── mqtt/                   # MQTT pub/sub
│   │   └── mqtt.go
│   ├── events/                 # Event storage
│   │   └── events.go
│   ├── ws/                     # WebSocket hub
│   │   └── hub.go
│   └── go.mod
│
├── 📂 firmware/                # ESP32 firmware project
│   ├── CMakeLists.txt
│   ├── main/                   # FreeRTOS task implementations
│   │   ├── main.c              # App entry point
│   │   ├── mqtt_transport.c    # MQTT client & subscription
│   │   ├── ota_handler.c       # OTA task: safety gates → flash
│   │   ├── ota_handler.h
│   │   ├── security.c          # ECC + SHA-256 verification
│   │   ├── security.h
│   │   ├── lcd.c               # Display output
│   │   ├── wifi_connect.c      # WiFi & network setup
│   │   └── ecu_tasks.c         # Virtual ECU simulation
│   └── partitions.csv          # Dual-partition OTA scheme
│
├── 📂 deploy/                  # Infrastructure as Code
│   ├── docker-compose.yml      # Services: PostgreSQL, Mosquitto, MinIO
│   └── mosquitto/
│       └── mosquitto.conf
│
├── 📂 .vscode/                 # VSCode configuration
│   ├── launch.json             # "F5" debug config
│   └── tasks.json              # Build/run tasks
│
├── 🔨 run.js                   # One-click launcher (Node.js)
├── 📜 start.sh                 # One-click launcher (Bash)
├── 📖 README.md                # This file
├── 📋 FLOW_ANALYSIS.md         # Detailed feature breakdown
├── 📋 ARCHITECTURE.md          # Quick reference guide
├── 📋 RUN.md                   # Quick start guide
└── 📋 OTA_SPEC.md              # OTA protocol specification
```

---

## 🔧 Installation

### 1. Clone Repository

```bash
git clone https://github.com/Parik-2006/GUARDIAN-OTA.git
cd GUARDIAN-OTA
```

### 2. Install Dependencies

**Frontend**:
```bash
cd dashboard
npm install --legacy-peer-deps
```

**Backend**:
```bash
cd backend
go mod download
```

**Hardware** (Optional):
```bash
cd firmware
# Requires ESP-IDF installed: https://docs.espressif.com/projects/esp-idf/
```

### 3. Environment Setup

**Frontend** (`dashboard/.env.local`):
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

**Backend** - uses environment defaults:
```bash
MQTT_BROKER=tcp://localhost:1883
DATABASE_URL=postgres://ota:ota@localhost:5432/ota_control?sslmode=disable
PORT=8080
GIN_MODE=debug  # or "release"
```

**Docker Services** - auto-configured via compose:
```bash
cd deploy
docker compose up -d
```

---

## 🚀 Usage

### Launch Full Stack (One Command)

**Option 1: VSCode (Recommended)**
```
1. Press F5 or click ▶️ Run button
2. Select "🚀 Run Full Project"
3. Done! Dashboard opens at http://localhost:3000
```

**Option 2: Terminal**
```bash
# Option A: Node.js launcher
node run.js

# Option B: Shell script
bash start.sh
```

### What Starts Automatically

```
✓ Docker containers (PostgreSQL + Mosquitto + MinIO)
✓ Go backend server (API on :8080)
✓ Next.js dev server (Dashboard on :3000)
✓ MQTT broker ready (localhost:1883)
```

---

## 📡 API Reference

### Dashboard Access

**GET** `/` 
- **Description**: Main dashboard UI
- **Response**: HTML (Next.js app)

### Fleet Management

**GET** `/api/fleet`
- **Description**: Get all registered devices
- **Response**:
  ```json
  {
    "devices": [
      {
        "deviceId": "AA:BB:CC:DD:EE:FF",
        "otaVersion": "1.0.0",
        "safetyState": "SAFE",
        "threatLevel": "LOW",
        "ecuStates": {
          "brake": "green",
          "powertrain": "green",
          "sensor": "green",
          "infotainment": "green"
        }
      }
    ],
    "count": 3
  }
  ```

### OTA Deployment

**POST** `/api/ota/deploy`
- **Description**: Create and queue OTA campaign
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "version": "1.1.0",
    "firmwareUrl": "http://localhost:9000/esp32.bin",
    "firmwareHash": "sha256:abc123def456...",
    "signatureB64": "MEUCIQDx...",
    "canaryPercent": 50
  }
  ```
- **Response**:
  ```json
  {
    "queued": true,
    "campaignId": "550e8400-e29b-41d4-a716-446655440000",
    "targets": ["AA:BB:CC:DD:EE:FF", "11:22:33:44:55:66"],
    "count": 2
  }
  ```

**GET** `/api/campaigns`
- **Description**: List all OTA campaigns
- **Response**:
  ```json
  {
    "campaigns": [
      {
        "id": "550e8400...",
        "version": "1.1.0",
        "status": "running",
        "canaryPercent": 50,
        "targets": ["AA:BB:CC:DD:EE:FF"],
        "successCount": 1,
        "failureCount": 0
      }
    ]
  }
  ```

**GET** `/api/campaigns/:id`
- **Description**: Get campaign details with per-device progress
- **Response**: Full `Campaign` object with `Progress` map

### Events

**GET** `/api/events`
- **Description**: Get event history
- **Query**: `?limit=50&offset=0`
- **Response**: Array of events with timestamps

**WS** `/ws/events`
- **Description**: WebSocket for real-time events
- **Events**: 
  - `fleet_tick` - Device state snapshot
  - `ota_deploy_requested` - Campaign created
  - `device_updated` - Device state changed
  - `campaign_updated` - Campaign progress updated

### Health

**GET** `/health`
- **Description**: Health check
- **Response**: `{"ok": true, "ts": "2026-04-18T10:30:00Z"}`

---

## 📡 MQTT Protocol

### Topics & Messages

#### Command: `sdv/ota/command`
**Publisher**: Backend → All devices  
**QoS**: 1 (At least once)

**Payload**:
```json
{
  "campaign_id": "550e8400-e29b-41d4-a716-446655440000",
  "version": "1.1.0",
  "firmware_url": "http://localhost:9000/esp32.bin",
  "firmware_hash": "a1b2c3d4e5f6...",
  "signature_b64": "MEUCIQDx...",
  "targets": ["AA:BB:CC:DD:EE:FF", "11:22:33:44:55:66"],
  "nonce": "uuid-string",
  "issued_at": "2026-04-18T10:30:00Z",
  "ttl_seconds": 300
}
```

#### Status: `sdv/ota/status/<device_mac>`
**Publisher**: Device → Backend  
**QoS**: 1

**Payload**:
```json
{
  "device_id": "AA:BB:CC:DD:EE:FF",
  "campaign_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "downloading",
  "error": null
}
```

**Status Values**:
- `online` - Device connected
- `ack` - Command acknowledged
- `downloading` - Firmware download in progress
- `verifying` - Signature/hash verification
- `success` - Update complete, rebooted
- `rollback` - Reverted to previous version
- `error` - Update failed

---

## 🔐 Security

### Cryptographic Verification (Hardware Level)

```c
// Three-layer security gate on ESP32

1. Safety Gate
   ├─ Brake ECU status == "SAFE"?
   └─ ✓ PASS: Continue | ✗ FAIL: Reject

2. ECC P-256 Signature Verification
   ├─ Verify signature(firmware_hash)
   ├─ mbedTLS backend
   └─ ✓ PASS: Continue | ✗ FAIL: Reject

3. SHA-256 Integrity Check
   ├─ Hash downloaded firmware
   ├─ Compare: downloaded_hash == manifest_hash
   └─ ✓ PASS: Flash | ✗ FAIL: Reject
```

### Anti-Brick Protection

- **Dual-Partition Scheme**: Active + Fallback partitions
- **Boot Watchdog**: Detects boot failures
- **Automatic Rollback**: Reverts to last-known-good version
- **Command TTL**: Stale commands expire after 300s

### Network Security

- **TLS for Firmware Download**: HTTPS only
- **MQTT QoS 1**: Guaranteed message delivery
- **Nonce Tracking**: Replay attack prevention
- **Campaign Isolation**: Each campaign has unique ID

---

## 👨‍💻 Development

### Running Frontend Only

```bash
cd dashboard
npm run dev
# Localhost:3000 (with mock API responses)
```

### Running Backend Only

```bash
cd backend
go run .
# Localhost:8080 (requires PostgreSQL + MQTT)
```

### Running Hardware Simulator

```bash
cd firmware
idf.py build
idf.py -p /dev/ttyUSB0 flash monitor
```

### Type Checking

```bash
# Frontend
cd dashboard
npx tsc --noEmit

# Backend (implicit via go build)
cd backend
go build ./...
```

### Code Formatting

```bash
# Frontend
cd dashboard
npx prettier --write "**/*.{ts,tsx,json,css}"

# Backend
cd backend
gofmt -w .
go vet ./...
```

---

## 📊 Example Workflow

### Scenario: Deploy v1.1.0 to 50% of Fleet

```
1. User navigates to http://localhost:3000
   → See 3 vehicles (Audi, Mercedes, BMW)

2. Fills OTA form:
   - Version: 1.1.0
   - Firmware URL: http://localhost:9000/esp32.bin
   - Hash: abc123...
   - Signature: MEUCIQ...
   - Canary: 50% (2 out of 3)

3. Clicks "▶ LAUNCH OTA CAMPAIGN"
   → Backend creates campaign, selects random 2 devices

4. MQTT command published to sdv/ota/command
   → Targets: [Audi, BMW]
   → Targets NOT: [Mercedes]

5. Audi receives command:
   ✓ Parses JSON
   ✓ Is in targets? YES
   ✓ Enqueues to OTA task

6. Audi OTA task executes:
   ✓ Brake ECU = SAFE
   ✓ Signature valid (ECC P-256)
   ✓ Downloads firmware
   ✓ Hash matches (SHA-256)
   ✓ Flashes partition
   ✓ Reboots

7. Audi reboots with v1.1.0
   → Publishes "online" status
   → Backend updates twin: otaVersion=1.1.0

8. Dashboard shows:
   ✓ Audi: v1.1.0 (UPDATED)
   ↻ BMW: v1.1.0 (IN PROGRESS)
   - Mercedes: v1.0.0 (not targeted)

9. All canary devices complete
   → Campaign status: "done"
   → Can deploy to remaining 50% if desired
```

---

## 🐛 Troubleshooting

### Dashboard won't start

```bash
# Clear cache and reinstall
cd dashboard
rm -rf node_modules .next
npm install --legacy-peer-deps
npm run build
```

### Backend connection refused

```bash
# Check if services are running
docker compose -f deploy/docker-compose.yml ps

# Restart services
docker compose -f deploy/docker-compose.yml restart
```

### MQTT not connecting

```bash
# Check Mosquitto logs
docker logs $(docker ps -q -f "ancestor=eclipse-mosquitto:2")

# Verify broker is accessible
mosquitto_sub -h localhost -t "test"
# In another terminal:
mosquitto_pub -h localhost -t "test" -m "hello"
```

### Hardware not receiving commands

```bash
# Monitor MQTT traffic
mosquitto_sub -h localhost -t "sdv/#" -v

# Check device is subscribed
# (ESP32 logs should show "subscribed to sdv/ota/command")
```

---

## 📈 Deployment

### Production Checklist

- [ ] Set `GIN_MODE=release` in backend
- [ ] Using PostgreSQL 16+ (not SQLite)
- [ ] MQTT broker behind firewall
- [ ] CORS configured for your domain
- [ ] Firmware signed with production keys
- [ ] Hardware provisioned with correct MAC addresses
- [ ] SSL/TLS certificates for HTTPS firmware URLs
- [ ] Database backups configured
- [ ] Monitoring alerts set up

### Docker Deployment

```bash
# Build images
docker build -f Dockerfile.backend -t guardian-ota-backend:1.0 .
docker build -f Dockerfile.frontend -t guardian-ota-frontend:1.0 .

# Deploy with compose
docker compose -f deploy/docker-compose.prod.yml up -d
```

---

## 📚 Documentation

See also:
- [FLOW_ANALYSIS.md](FLOW_ANALYSIS.md) - Detailed feature breakdown & code walkthrough
- [ARCHITECTURE.md](ARCHITECTURE.md) - Quick reference & implementation guide
- [RUN.md](RUN.md) - Quick start guide
- [OTA_SPEC.md](OTA_SPEC.md) - OTA protocol specification

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- **Frontend**: Follow TypeScript + React best practices
- **Backend**: Use Go idioms, handle errors explicitly
- **Hardware**: Prioritize safety; test on real ESP32
- **Tests**: Add unit tests for new features
- **Documentation**: Update README + FLOW_ANALYSIS

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙋 Support

- **Issues**: [GitHub Issues](https://github.com/Parik-2006/GUARDIAN-OTA/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Parik-2006/GUARDIAN-OTA/discussions)
- **Documentation**: See `*.md` files in project root

---

## 👏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Gin](https://gin-gonic.com/) - Go web framework
- [ESP-IDF](https://docs.espressif.com/) - ESP32 development framework
- [Mosquitto](https://mosquitto.org/) - MQTT broker
- [PostgreSQL](https://www.postgresql.org/) - Database

---

## 📞 Contact

**Project Lead**: Parik-2006  
**Repository**: https://github.com/Parik-2006/GUARDIAN-OTA

---

<div align="center">

**Made with ❤️ for Software-Defined Vehicles**

[⬆ Back to Top](#-guadian-ota-secure-sdv-over-the-air-firmware-update-platform)

</div>

