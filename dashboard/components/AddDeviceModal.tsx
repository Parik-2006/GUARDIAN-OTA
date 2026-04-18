"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { P } from "./theme";
import I from "./Icon";
import { useFleet } from "./FleetContext";

export default function AddDeviceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addDevice } = useFleet();
  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState("");

  const handleSubmit = () => {
    if (!deviceId.trim() || !deviceName.trim()) return;
    addDevice(deviceId.trim(), deviceName.trim());
    setDeviceId("");
    setDeviceName("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "fixed", inset: 0, zIndex: 999,
            background: "rgba(0,0,0,0.65)",
            display: "flex", alignItems: "center", justifyContent: "center",
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
              background: P.wall, border: `1px solid ${P.bHi}`,
              borderRadius: 6, padding: "28px 32px", width: 420,
              boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(200,145,74,0.12)",
            }}
          >
            {/* Title */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <div style={{
                width: 36, height: 36, background: P.cgnDim, borderRadius: 4,
                border: `1px solid ${P.bHi}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <I n="add_circle" f sz={20} col={P.cognac} />
              </div>
              <div>
                <h2 style={{
                  fontFamily: "'Cormorant Garamond',serif", fontWeight: 700,
                  fontSize: "1.1rem", color: P.ivory, letterSpacing: "0.04em",
                }}>Add New Device</h2>
                <p style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: "0.52rem",
                  color: P.whisper, letterSpacing: "0.14em",
                }}>A RANDOM CAR MODEL WILL BE ASSIGNED</p>
              </div>
            </div>

            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{
                  display: "block", fontFamily: "'JetBrains Mono',monospace",
                  fontSize: "0.56rem", color: P.whisper, letterSpacing: "0.12em",
                  textTransform: "uppercase", marginBottom: 6,
                }}>DEVICE ID</label>
                <input
                  value={deviceId}
                  onChange={e => setDeviceId(e.target.value)}
                  placeholder="e.g. VEH-004"
                  style={{
                    width: "100%", background: P.cockpit,
                    border: `1px solid ${P.bMid}`, borderRadius: 3,
                    color: P.ivory, padding: "9px 12px",
                    fontFamily: "'JetBrains Mono',monospace", fontSize: "0.8rem",
                    outline: "none", transition: "border-color 0.2s",
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = P.bHi; }}
                  onBlur={e => { e.currentTarget.style.borderColor = P.bMid; }}
                />
              </div>
              <div>
                <label style={{
                  display: "block", fontFamily: "'JetBrains Mono',monospace",
                  fontSize: "0.56rem", color: P.whisper, letterSpacing: "0.12em",
                  textTransform: "uppercase", marginBottom: 6,
                }}>DEVICE NAME</label>
                <input
                  value={deviceName}
                  onChange={e => setDeviceName(e.target.value)}
                  placeholder="e.g. Phantom Bravo"
                  style={{
                    width: "100%", background: P.cockpit,
                    border: `1px solid ${P.bMid}`, borderRadius: 3,
                    color: P.ivory, padding: "9px 12px",
                    fontFamily: "'JetBrains Mono',monospace", fontSize: "0.8rem",
                    outline: "none", transition: "border-color 0.2s",
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = P.bHi; }}
                  onBlur={e => { e.currentTarget.style.borderColor = P.bMid; }}
                />
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={onClose}
                style={{
                  padding: "8px 18px", background: "transparent",
                  border: `1px solid ${P.bMid}`, color: P.parchment,
                  fontSize: "0.76rem", fontWeight: 500, borderRadius: 3,
                  cursor: "pointer", fontFamily: "'JetBrains Mono',monospace",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = P.bHi; e.currentTarget.style.color = P.ivory; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = P.bMid; e.currentTarget.style.color = P.parchment; }}
              >Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={!deviceId.trim() || !deviceName.trim()}
                style={{
                  padding: "8px 22px", background: P.cgnDim, color: P.cognac,
                  fontSize: "0.76rem", fontWeight: 700, borderRadius: 3,
                  cursor: deviceId.trim() && deviceName.trim() ? "pointer" : "not-allowed",
                  opacity: deviceId.trim() && deviceName.trim() ? 1 : 0.4,
                  border: `1px solid ${P.bHi}`,
                  fontFamily: "'JetBrains Mono',monospace",
                  transition: "all 0.2s", letterSpacing: "0.06em",
                  display: "flex", alignItems: "center", gap: 5,
                }}
                onMouseEnter={e => {
                  if (deviceId.trim() && deviceName.trim()) {
                    e.currentTarget.style.background = P.cgnGlow;
                    e.currentTarget.style.color = P.ivory;
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = P.cgnDim;
                  e.currentTarget.style.color = P.cognac;
                }}
              >
                <I n="add" sz={14} col="inherit" /> Add to Fleet
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
