"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { P } from "./theme";
import I from "./Icon";
import { useFleet } from "./FleetContext";
import type { ActivityLog } from "./FleetContext";

function getLogIcon(type: ActivityLog["type"]): string {
  switch (type) {
    case "device_added": return "add_circle";
    case "device_deleted": return "delete";
    case "ota_started": return "cloud_upload";
    case "ota_completed": return "check_circle";
    case "device_connected": return "cloud_done";
    case "device_disconnected": return "cloud_off";
    case "encryption_toggled": return "lock";
    case "ecu_status_changed": return "settings";
    default: return "info";
  }
}

function getLogColor(type: ActivityLog["type"]): string {
  switch (type) {
    case "device_added": return P.sage;
    case "device_deleted": return P.burg;
    case "ota_started": return P.cognac;
    case "ota_completed": return P.sage;
    case "device_connected": return P.sage;
    case "device_disconnected": return P.copper;
    case "encryption_toggled": return P.cognac;
    case "ecu_status_changed": return P.parchment;
    default: return P.whisper;
  }
}

function formatTimestamp(date: Date): string {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function filterLogs(logs: ActivityLog[], filter: "all" | "device" | "ota" | "security"): ActivityLog[] {
  if (filter === "all") return logs;
  if (filter === "device") return logs.filter(l => l.type.includes("device") || l.type === "device_connected" || l.type === "device_disconnected");
  if (filter === "ota") return logs.filter(l => l.type === "ota_started" || l.type === "ota_completed");
  if (filter === "security") return logs.filter(l => l.type === "encryption_toggled" || l.type === "ecu_status_changed");
  return logs;
}

export default function LogsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { activityLogs } = useFleet();
  const [filter, setFilter] = useState<"all" | "device" | "ota" | "security">("all");

  const filteredLogs = filterLogs(activityLogs, filter);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(6px)",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            style={{
              background: P.wall,
              border: `1px solid ${P.bHi}`,
              borderRadius: 6,
              padding: "28px 32px",
              width: "min(800px, 90vw)",
              height: "min(600px, 90vh)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(200,145,74,0.12)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    background: P.cgnDim,
                    borderRadius: 4,
                    border: `1px solid ${P.bHi}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <I n="history" f sz={20} col={P.cognac} />
                </div>
                <div>
                  <h2
                    style={{
                      fontFamily: "'Cormorant Garamond',serif",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      color: P.ivory,
                      letterSpacing: "0.04em",
                    }}
                  >
                    Activity Logs
                  </h2>
                  <p
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: "0.52rem",
                      color: P.whisper,
                      letterSpacing: "0.14em",
                    }}
                  >
                    DEVICES · UPDATES · CONNECTIONS · ACTIVITY
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "none",
                  color: P.whisper,
                  cursor: "pointer",
                  fontSize: "1.3rem",
                  transition: "color 0.2s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.color = P.cognac;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.color = P.whisper;
                }}
              >
                ✕
              </button>
            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: `1px solid ${P.bDim}`, paddingBottom: 12 }}>
              {(["all", "device", "ota", "security"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "6px 14px",
                    background: filter === f ? P.cgnDim : "transparent",
                    color: filter === f ? P.cognac : P.whisper,
                    border: `1px solid ${filter === f ? P.bHi : P.bDim}`,
                    borderRadius: 3,
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: "0.6rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => {
                    if (filter !== f) {
                      (e.currentTarget as HTMLButtonElement).style.color = P.cognac;
                      (e.currentTarget as HTMLButtonElement).style.borderColor = P.bHi;
                    }
                  }}
                  onMouseLeave={e => {
                    if (filter !== f) {
                      (e.currentTarget as HTMLButtonElement).style.color = P.whisper;
                      (e.currentTarget as HTMLButtonElement).style.borderColor = P.bDim;
                    }
                  }}
                >
                  {f === "all" && "All Logs"}
                  {f === "device" && "Devices"}
                  {f === "ota" && "OTA Updates"}
                  {f === "security" && "Security"}
                </button>
              ))}
            </div>

            {/* Logs list */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
              {filteredLogs.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    color: P.whisper,
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: "0.8rem",
                  }}
                >
                  No logs found for this filter
                </div>
              ) : (
                filteredLogs.map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02, duration: 0.3 }}
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: "12px 14px",
                      background: "rgba(240,235,224,0.02)",
                      border: `1px solid rgba(240,235,224,0.06)`,
                      borderRadius: 4,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "rgba(240,235,224,0.05)";
                      e.currentTarget.style.borderColor = "rgba(240,235,224,0.12)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "rgba(240,235,224,0.02)";
                      e.currentTarget.style.borderColor = "rgba(240,235,224,0.06)";
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 3,
                        background: P.cockpit,
                        border: `1px solid ${P.bMid}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <I n={getLogIcon(log.type)} sz={16} col={getLogColor(log.type)} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 4 }}>
                        <p
                          style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: "0.7rem",
                            color: P.ivory,
                            letterSpacing: "0.04em",
                            margin: 0,
                          }}
                        >
                          {log.message}
                        </p>
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: "0.55rem",
                            color: P.whisper,
                            whiteSpace: "nowrap",
                            marginLeft: 12,
                          }}
                        >
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>

                      {/* Vehicle tag */}
                      {log.vehicleId && log.vehicleName && (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "3px 8px",
                            background: "rgba(212,169,106,0.1)",
                            border: `1px solid rgba(212,169,106,0.2)`,
                            borderRadius: 3,
                            marginTop: 4,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono',monospace",
                              fontSize: "0.52rem",
                              color: P.cognac,
                              letterSpacing: "0.08em",
                            }}
                          >
                            {log.vehicleId} • {log.vehicleName}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer stats */}
            <div
              style={{
                borderTop: `1px solid ${P.bDim}`,
                paddingTop: 12,
                marginTop: 12,
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.6rem",
                color: P.whisper,
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              <span>{filteredLogs.length} entries shown</span>
              <span>{activityLogs.length} total activities</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
