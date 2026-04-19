"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FleetProvider, useFleet, FleetVehicle, randomCarVariant, randomModel, createDefaultVehicle } from "./FleetContext";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import DeviceBar from "./DeviceBar";
import AddDeviceModal from "./AddDeviceModal";
import LogsModal from "./LogsModal";
import FleetDashboard from "./FleetDashboard";
import VehicleInsight from "./VehicleInsight";
import Terminal from "./Terminal";
import Documentation from "./Documentation";

/* ═══════════════════════════════════════════════════════════════
   INNER DASHBOARD — needs FleetProvider context
═══════════════════════════════════════════════════════════════ */
function DashboardInner({ onBackToLanding }: { onBackToLanding?: () => void }) {
  const { currentView, fleet, setFleet } = useFleet();
  const [connected, setConnected] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);

  /* ── Fetch Initial Fleet + WebSocket ── */
  useEffect(() => {
    let isSubscribed = true;

    // 1. Hydrate Initial State
    fetch("http://localhost:8080/api/fleet")
      .then(res => res.json())
      .then(data => {
        if (!isSubscribed) return;
        if (data.devices) {
          setFleet(prev => {
            const newMap = new Map(prev.map(v => [v.deviceId, v]));
            Object.values(data.devices).forEach((state: any) => {
              if (!newMap.has(state.deviceId)) {
                newMap.set(state.deviceId, {
                  ...createDefaultVehicle(state.deviceId, `Simulated Car (${state.deviceId.split("-").pop()})`, randomCarVariant()),
                  ...state,
                  model: randomModel(),
                });
              }
            });
            return Array.from(newMap.values());
          });
        }
      })
      .catch(err => console.error("Initial fleet fetch failed", err));

    // 2. Open WebSocket for live metrics over twin mesh
    const ws = new WebSocket("ws://localhost:8080/ws/events");
    ws.onopen = () => setConnected(true);
    
    ws.onmessage = (e) => {
      try {
        const evt = JSON.parse(e.data);
        if (evt.type === "fleet_tick" && evt.payload) {
          setFleet(prev => {
            const current = new Map(prev.map(v => [v.deviceId, v]));
            Object.values(evt.payload).forEach((state: any) => {
              const existing = current.get(state.deviceId);
              if (existing) {
                current.set(state.deviceId, { ...existing, ...state });
              } else {
                current.set(state.deviceId, {
                  ...createDefaultVehicle(state.deviceId, `Simulated Car (${state.deviceId.slice(-4)})`, randomCarVariant()),
                  ...state,
                  model: randomModel(),
                });
              }
            });
            return Array.from(current.values());
          });
        }
      } catch (err) {
        // Drop bad frames silently
      }
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    return () => {
      isSubscribed = false;
      ws.close();
    };
  }, [setFleet]); // Removed unstable 'fleet', 'activeEcu', 'addDevice' dependencies.

  const P_bg = "#0D0B08";
  const P_ivory = "#EEE6D3";
  const P_bDim = "rgba(238,230,211,0.055)";

  return (
    <div style={{
      display: "flex", height: "100vh", width: "100vw",
      overflow: "hidden", background: P_bg, color: P_ivory,
      fontFamily: "'DM Sans',sans-serif",
    }}>
      {/* Font Links */}
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* Ambient glow */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse 55% 45% at 18% 0%, rgba(200,145,74,0.03) 0%, transparent 52%), radial-gradient(ellipse 38% 30% at 82% 100%, rgba(184,124,58,0.02) 0%, transparent 48%)",
      }} />

      <Sidebar onBack={onBackToLanding} onLogs={() => setLogsOpen(true)} />

      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        overflow: "hidden", position: "relative", zIndex: 1,
      }}>
        <TopBar connected={connected} onAddDevice={() => setModalOpen(true)} />
        <DeviceBar />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.17 }}
            style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            {currentView === "fleet" && <FleetDashboard />}
            {currentView === "insight" && <VehicleInsight />}
            {currentView === "terminal" && <Terminal />}
            {currentView === "documentation" && <Documentation />}
          </motion.div>
        </AnimatePresence>
      </div>

      <AddDeviceModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <LogsModal open={logsOpen} onClose={() => setLogsOpen(false)} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD — wraps inner in FleetProvider
═══════════════════════════════════════════════════════════════ */
export default function Dashboard({ onBackToLanding }: { onBackToLanding?: () => void }) {
  return (
    <FleetProvider>
      <DashboardInner onBackToLanding={onBackToLanding} />
    </FleetProvider>
  );
}
