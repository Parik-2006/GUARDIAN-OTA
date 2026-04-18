"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { P } from "./theme";
import I from "./Icon";
import { useFleet, FleetVehicle } from "./FleetContext";
import ECUPanel from "./ECUPanel";
import SecurityPanel from "./SecurityPanel";
import VerificationSim from "./VerificationSim";
import UpdatePanel from "./UpdatePanel";
import dynamic from "next/dynamic";
import { CarVariant } from "./CarModel3D";

// Dynamically import the 3D component with SSR disabled (Three.js requires browser APIs)
const CarModel3D = dynamic(() => import("./CarModel3D"), {
  ssr: false,
  loading: () => (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(13,11,8,0.5)",
    }}>
      <span style={{
        fontFamily: "'JetBrains Mono',monospace", fontSize: "0.7rem",
        color: P.whisper, animation: "scanBlink 1.5s step-end infinite",
      }}>INITIALIZING 3D ENGINE...</span>
    </div>
  ),
});

type Tab = "security" | "verification" | "updates";

export default function VehicleInsight() {
  const { fleet, selectedVehicleId, goToDashboard } = useFleet();
  const [activeTab, setActiveTab] = useState<Tab>("security");

  const vehicle = fleet.find(v => v.deviceId === selectedVehicleId);
  if (!vehicle) return null;

  const threatCol = vehicle.threatLevel === "HIGH" ? P.burg : vehicle.threatLevel === "MEDIUM" ? P.copper : P.sage;
  const statusCol = vehicle.status === "online" ? P.sage : vehicle.status === "updating" ? P.cognac : P.burg;

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: "security", icon: "security", label: "Security" },
    { id: "verification", icon: "verified_user", label: "Verify" },
    { id: "updates", icon: "system_update_alt", label: "Update" },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Vehicle header bar */}
      <div style={{
        padding: "14px 24px", borderBottom: `1px solid ${P.bDim}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={goToDashboard}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "transparent", border: `1px solid ${P.bMid}`,
              color: P.parchment, padding: "5px 12px", borderRadius: 3,
              cursor: "pointer", fontFamily: "'JetBrains Mono',monospace",
              fontSize: "0.64rem", transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = P.bHi; e.currentTarget.style.color = P.ivory; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = P.bMid; e.currentTarget.style.color = P.parchment; }}
          >
            <I n="arrow_back" sz={14} col="inherit" /> Fleet
          </button>

          <div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond',serif", fontWeight: 700,
              fontSize: "1.3rem", color: P.ivory, letterSpacing: "0.02em",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              {vehicle.name}
              <span style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: "0.52rem",
                color: P.whisper, fontWeight: 400,
              }}>({vehicle.deviceId})</span>
            </h2>
          </div>
        </div>

        {/* Status badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 9px", borderRadius: 2,
            background: `${statusCol}15`, border: `1px solid ${statusCol}28`,
            fontFamily: "'JetBrains Mono',monospace", fontSize: "0.52rem",
            color: statusCol, textTransform: "uppercase",
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: statusCol, boxShadow: `0 0 4px ${statusCol}` }} />
            {vehicle.status}
          </span>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 9px", borderRadius: 2,
            background: `${threatCol}15`, border: `1px solid ${threatCol}28`,
            fontFamily: "'JetBrains Mono',monospace", fontSize: "0.52rem",
            color: threatCol,
          }}>THREAT: {vehicle.threatLevel}</span>
          <span style={{
            padding: "3px 9px", borderRadius: 2,
            background: P.cgnDim, border: `1px solid ${P.bHi}`,
            fontFamily: "'JetBrains Mono',monospace", fontSize: "0.52rem",
            color: P.cognac,
          }}>{vehicle.model.toUpperCase()}</span>
        </div>
      </div>

      {/* Main content: 3D + Panel */}
      <div style={{
        flex: 1, display: "grid",
        gridTemplateColumns: "1fr 380px",
        overflow: "hidden",
      }}>
        {/* 3D Viewport */}
        <div style={{
          position: "relative", background: P.bg,
          borderRight: `1px solid ${P.bDim}`,
          overflow: "hidden",
        }}>
          {/* Radial glow */}
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(200,145,74,0.03) 0%, transparent 60%)",
            pointerEvents: "none", zIndex: 1,
          }} />

          <Suspense fallback={
            <div style={{
              width: "100%", height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: "0.7rem",
                color: P.whisper,
              }}>Loading 3D Model...</span>
            </div>
          }>
            <CarModel3D variant={vehicle.carVariant} />
          </Suspense>

          {/* ECU Panel overlay */}
          <ECUPanel />

          {/* Corner HUD */}
          <div style={{
            position: "absolute", bottom: 16, right: 18, zIndex: 10,
            fontFamily: "'JetBrains Mono',monospace", fontSize: "0.52rem",
            color: P.whisper, textAlign: "right", lineHeight: 1.8,
          }}>
            MODEL: {vehicle.model.toUpperCase()}<br />
            OTA: {vehicle.otaVersion}<br />
            <span style={{ color: P.cognac }}>● LIVE TELEMETRY</span>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{
          display: "flex", flexDirection: "column",
          overflow: "hidden", background: P.wall,
        }}>
          {/* Tab bar */}
          <div style={{
            display: "flex", borderBottom: `1px solid ${P.bDim}`,
            flexShrink: 0,
          }}>
            {tabs.map(t => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    flex: 1, display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 6,
                    padding: "11px 0", cursor: "pointer",
                    background: active ? P.cockpit : "transparent",
                    borderLeft: "none", borderRight: "none", borderTop: "none",
                    borderBottom: `2px solid ${active ? P.cognac : "transparent"}`,
                    color: active ? P.cognac : P.whisper,
                    fontFamily: "'JetBrains Mono',monospace", fontSize: "0.58rem",
                    fontWeight: active ? 600 : 400,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    transition: "all 0.18s",
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.color = P.parchment;
                      e.currentTarget.style.background = P.cockpit;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.color = P.whisper;
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <I n={t.icon} sz={14} col={active ? P.cognac : P.whisper} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "security" && <SecurityPanel vehicle={vehicle} />}
              {activeTab === "verification" && <VerificationSim />}
              {activeTab === "updates" && <UpdatePanel />}
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scanBlink { 0%,100% { opacity:1; } 50% { opacity:0.1; } }
      `}</style>
    </div>
  );
}
