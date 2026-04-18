"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FleetProvider, useFleet } from "./FleetContext";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import DeviceBar from "./DeviceBar";
import AddDeviceModal from "./AddDeviceModal";
import FleetDashboard from "./FleetDashboard";
import VehicleInsight from "./VehicleInsight";

/* ═══════════════════════════════════════════════════════════════
   INNER DASHBOARD — needs FleetProvider context
═══════════════════════════════════════════════════════════════ */
function DashboardInner({ onBackToLanding }: { onBackToLanding?: () => void }) {
  const { currentView, fleet, setFleet } = useFleet();
  const [connected, setConnected] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  /* ── WebSocket + simulation tick ── */
  useEffect(() => {
    // Simulate live fleet updates
    const iv = setInterval(() => {
      setFleet(prev =>
        prev.map(d => {
          const r = Math.random();
          return {
            ...d,
            lastSeen: new Date().toISOString(),
            safetyState: r < 0.03 ? "UNSAFE" : "SAFE",
            threatLevel: (r < 0.03 ? "HIGH" : r < 0.08 ? "MEDIUM" : "LOW") as "LOW" | "MEDIUM" | "HIGH",
          };
        })
      );
    }, 2200);

    // Attempt WebSocket connection
    try {
      const ws = new WebSocket("ws://localhost:8080/ws/events");
      ws.onopen = () => setConnected(true);
      ws.onclose = () => setConnected(false);
      return () => { clearInterval(iv); ws.close(); };
    } catch {
      return () => clearInterval(iv);
    }
  }, [setFleet]);

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

      <Sidebar onBack={onBackToLanding} />

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
          </motion.div>
        </AnimatePresence>
      </div>

      <AddDeviceModal open={modalOpen} onClose={() => setModalOpen(false)} />
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
