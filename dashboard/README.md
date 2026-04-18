# GUARDIAN-OTA Dashboard

A modern web dashboard for managing Software Defined Vehicles (SDV) and Over-The-Air (OTA) updates, featuring real-time 3D car models, ECU management, and secure device operations.

---

## Features

- **Fleet Overview:** Visualize and manage a fleet of vehicles with unique 3D models for Audi, Mercedes, and BMW.
- **3D Car Models:** Interactive, brand-specific 3D models rendered with Three.js and @react-three/fiber.
- **ECU Management:** View and interact with Electronic Control Units (ECUs) for each vehicle.
- **OTA Updates:** Initiate and monitor OTA updates for devices and ECUs.
- **Security Panel:** Manage and verify device security and update status.
- **Real-Time Updates:** WebSocket integration for live status and notifications.
- **Responsive UI:** Built with React 18, Next.js, and Tailwind CSS for a fast, modern experience.

---

## Frameworks & Libraries

| Layer         | Framework/Library         | Example Files/Usage                |
|---------------|--------------------------|------------------------------------|
| HTML          | Next.js                  | app/layout.tsx, app/page.tsx       |
| CSS           | Tailwind CSS, CSS-in-JS  | styles/globals.css, inline styles  |
| JS/TS         | React, TypeScript        | components/*.tsx, types/index.ts   |
| 3D Graphics   | Three.js, @react-three/fiber | components/CarModel3D.tsx     |
| Animation     | Framer Motion            | components/dashboard.tsx           |
| Icons         | Material Symbols         | components/Icon.tsx                |
| State         | React Context API        | components/FleetContext.tsx        |
| Real-time     | WebSocket (custom hook)  | lib/ws.ts                          |
| API           | Fetch API, Next.js API   | lib/api.ts, app/api/               |

---

## Project Structure

- `app/` - Next.js app directory (routing, layout, pages)
- `components/` - All React UI components (3D models, panels, dashboard, etc.)
- `lib/` - API and WebSocket utilities
- `styles/` - Global and Tailwind CSS
- `types/` - TypeScript types and interfaces

---

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Run the development server:**
   ```bash
   npm run dev
   ```
3. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

---

## Example Frontend Files & Their Frameworks

- **app/layout.tsx, app/page.tsx** — Next.js (HTML, routing, SSR)
- **components/CarModel3D.tsx** — React, TypeScript, Three.js, @react-three/fiber, @react-three/drei
- **components/FleetContext.tsx** — React Context API, TypeScript
- **components/VehicleInsight.tsx** — React, TypeScript, Framer Motion
- **components/ECUPanel.tsx** — React, TypeScript
- **components/dashboard.tsx** — React, TypeScript, Framer Motion
- **components/theme.ts** — TypeScript (theme/colors)
- **lib/api.ts** — TypeScript, Fetch API
- **lib/ws.ts** — TypeScript, WebSocket
- **styles/globals.css** — Tailwind CSS
- **types/index.ts** — TypeScript

---

## License

MIT License
