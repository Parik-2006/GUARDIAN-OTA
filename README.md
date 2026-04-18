# GUARDIAN-OTA: Secure SDV OTA Prototype

A production-grade, security-hardened orchestration stack for Over-The-Air (OTA) firmware updates in a Software-Defined Vehicle (SDV) environment. This prototype demonstrates end-to-end orchestration using a single physical ESP32 and a software-defined fleet simulator.

---

## 🚀 Key Features

- **End-to-End Security**: ECC P-256 signature verification and SHA-256 integrity checks via mbedTLS.
- **Operational Safety Gates**: Real-time validation of vehicle state (e.g., Brake ECU check) before update application.
- **Cinematic Monitoring**: High-performance Next.js dashboard with live WebSocket telemetry and Framer Motion animations.
- **Canary Rollouts**: Deployment campaigns with configurable fleet percentage targets.
- **Anti-Brick Resilience**: Dual-slot partition scheme with automatic rollback on boot failure.

---

## 🛠️ Tech Stack

- **Vehicle/Edge**: ESP32 (ESP-IDF / C), FreeRTOS, mbedTLS
- **Backend**: Go (Gin), PostgreSQL, MQTT (Mosquitto), WebSocket
- **Dashboard**: Next.js (App Router), TailwindCSS, Framer Motion
- **Infrastructure**: Docker Compose (MQTT, Postgres, MinIO)

---

## 📂 Project Structure

- `firmware/`: ESP-IDF project (Virtual ECUs, Secure OTA Handler, MQTT Transport).
- `backend/`: Go-based control plane, fleet registry, and campaign manager.
- `dashboard/`: React cockpit for fleet visualization and deployment control.
- `deploy/`: Infrastructure configuration (PostgreSQL, Mosquitto, MinIO).

---

## 🚦 Quick Start

### 1. Infrastructure
```bash
cd deploy
docker compose up -d
```

### 2. Backend
```bash
cd backend
go run .
```

### 3. Dashboard
```bash
cd dashboard
npm install && npm run dev
```

### 4. Firmware
```bash
cd firmware
idf.py build flash monitor
```

---

## 🔒 Security Implementation

1. **Manifest Signing**: Firmware binaries are paired with an ECC-signed manifest.
2. **Hardware Identity**: Device ID is derived from the immutable eFuse MAC address.
3. **Encrypted Transport**: All command and telemetry traffic utilizes MQTT over TLS.
4. **Health Check**: POST-OTA boot validation ensures the system recovers even if a faulty update is flashed.

For a deep dive into the architecture, see [project_overview.md](file:///home/vaibhav/.gemini/antigravity/brain/98c787db-6cd0-4e3b-9c0a-ec6cea45ef3b/project_overview.md).

