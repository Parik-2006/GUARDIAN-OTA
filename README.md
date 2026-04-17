# SDV Secure OTA Prototype

Production-style prototype of a secure OTA orchestration stack for a simulated autonomous vehicle environment using a **single ESP32** and software-defined fleet simulation.

## Stack

- **Vehicle/Edge**: ESP32, ESP-IDF (C), FreeRTOS, ESP-IDF OTA APIs, mbedTLS ECC + SHA-256
- **Backend**: Go + Gin, PostgreSQL, MQTT broker integration, WebSocket streaming
- **Messaging**: Mosquitto (TLS enabled)
- **Storage**: MinIO for firmware artifact hosting
- **Dashboard**: Next.js App Router, TailwindCSS, Framer Motion

## Monorepo Layout

- `firmware/` ESP-IDF project for edge gateway + virtual ECUs
- `backend/` OTA control plane + telemetry ingestion + fleet simulator
- `dashboard/` cinematic SDV web cockpit
- `deploy/` docker-compose for PostgreSQL, Mosquitto, MinIO

## Quick Start

1. Start infra:
   - `cd deploy`
   - `docker compose up -d`
2. Run backend:
   - `cd ../backend`
   - `go mod tidy`
   - `go run .`
3. Run dashboard:
   - `cd ../dashboard`
   - `npm install`
   - `npm run dev`
4. Build/flash ESP32 firmware:
   - `cd ../firmware`
   - `idf.py set-target esp32`
   - `idf.py build flash monitor`

## Security Controls in This Prototype

- Device identity pinned to eFuse MAC address
- OTA manifest signature verification (ECC P-256, mbedTLS)
- Firmware digest verification (SHA-256)
- TLS MQTT transport
- Safety-gated updates (no OTA in unsafe ECU state)
- Rollback on health-check failure via ESP-IDF `esp_ota_mark_app_invalid_rollback_and_reboot`

## Demo Paths

- Dashboard: `http://localhost:3000`
- Backend health: `http://localhost:8080/health`
- MinIO console: `http://localhost:9001`

