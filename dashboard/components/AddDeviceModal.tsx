"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { P } from "./theme";
import I from "./Icon";
import { useFleet } from "./FleetContext";

export default function AddDeviceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addDevice, detectDeviceInfo, getModelColor } = useFleet();
  const [deviceId, setDeviceId] = useState("");

  // Auto-detect vehicle info
  const detectedInfo = useMemo(() => {
    if (!deviceId.trim()) return null;
    return detectDeviceInfo(deviceId.trim());
  }, [deviceId, detectDeviceInfo]);

  const modelColor = detectedInfo ? getModelColor(detectedInfo.model) : null;

  const handleSubmit = () => {
    if (!deviceId.trim()) return;
    addDevice(deviceId.trim());
    setDeviceId("");
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
              borderRadius: 6, padding: "28px 32px", width: 460,
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
                }}>AUTO-DETECTS VEHICLE MODEL & ASSIGNS NAME</p>
              </div>
            </div>

            {/* Device ID Input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: "block", fontFamily: "'JetBrains Mono',monospace",
                fontSize: "0.56rem", color: P.whisper, letterSpacing: "0.12em",
                textTransform: "uppercase", marginBottom: 8,
              }}>DEVICE ID</label>
              <input
                value={deviceId}
                onChange={e => setDeviceId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && detectedInfo && handleSubmit()}
                placeholder="e.g. VEH-004"
                autoFocus
                style={{
                  width: "100%", background: P.cockpit,
                  border: `1px solid ${P.bMid}`, borderRadius: 4,
                  color: P.ivory, padding: "11px 14px",
                  fontFamily: "'JetBrains Mono',monospace", fontSize: "0.9rem",
                  outline: "none", transition: "all 0.2s",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = P.bHi; }}
                onBlur={e => { e.currentTarget.style.borderColor = P.bMid; }}
              />
            </div>

            {/* Auto-Detected Vehicle Info */}
            {detectedInfo && modelColor && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  background: `${modelColor.glow}`, border: `1px solid ${modelColor.primary}44`,
                  borderRadius: 6, padding: "16px", marginBottom: 20,
                }}
              >
                <div style={{ display: "flex", gap: 12 }}>
                  {/* Color Badge */}
                  <div style={{
                    width: 60, height: 60, borderRadius: 4,
                    background: `${modelColor.primary}22`, border: `2px solid ${modelColor.primary}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: modelColor.primary, opacity: 0.8,
                      boxShadow: `0 0 12px ${modelColor.primary}`,
                    }} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: "'Cormorant Garamond',serif", fontWeight: 700,
                      fontSize: "1.05rem", color: modelColor.primary, marginBottom: 6,
                    }}>{detectedInfo.name}</div>
                    <div style={{
                      display: "flex", gap: 12, marginBottom: 6,
                    }}>
                      <div>
                        <span style={{
                          fontFamily: "'JetBrains Mono',monospace", fontSize: "0.55rem",
                          color: P.whisper, letterSpacing: "0.1em", textTransform: "uppercase",
                        }}>Model</span>
                        <div style={{
                          fontFamily: "'JetBrains Mono',monospace", fontSize: "0.8rem",
                          color: modelColor.primary, fontWeight: 600,
                        }}>{detectedInfo.model}</div>
                      </div>
                      <div>
                        <span style={{
                          fontFamily: "'JetBrains Mono',monospace", fontSize: "0.55rem",
                          color: P.whisper, letterSpacing: "0.1em", textTransform: "uppercase",
                        }}>Variant</span>
                        <div style={{
                          fontFamily: "'JetBrains Mono',monospace", fontSize: "0.8rem",
                          color: P.parchment, fontWeight: 500,
                        }}>{detectedInfo.variant}</div>
                      </div>
                    </div>
                    <p style={{
                      fontFamily: "'JetBrains Mono',monospace", fontSize: "0.62rem",
                      color: P.whisper, margin: 0,
                    }}>
                      ✓ Auto-detected based on device ID
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Status Message */}
            {!detectedInfo && deviceId.trim() && (
              <div style={{
                background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)",
                borderRadius: 4, padding: "10px 12px", marginBottom: 20,
                fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem",
                color: "#FF9999",
              }}>
                ⚠ Type a device ID to see auto-detected vehicle model
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={onClose}
                style={{
                  padding: "9px 20px", background: "transparent",
                  border: `1px solid ${P.bMid}`, color: P.parchment,
                  fontSize: "0.76rem", fontWeight: 600, borderRadius: 3,
                  cursor: "pointer", fontFamily: "'JetBrains Mono',monospace",
                  transition: "all 0.2s", letterSpacing: "0.06em",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = P.bHi; e.currentTarget.style.color = P.ivory; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = P.bMid; e.currentTarget.style.color = P.parchment; }}
              >CANCEL</button>
              <button
                onClick={handleSubmit}
                disabled={!detectedInfo}
                style={{
                  padding: "9px 24px", background: modelColor ? modelColor.primary : P.cgnDim,
                  color: detectedInfo ? P.wall : P.cognac,
                  fontSize: "0.76rem", fontWeight: 700, borderRadius: 3,
                  cursor: detectedInfo ? "pointer" : "not-allowed",
                  opacity: detectedInfo ? 1 : 0.3,
                  border: `1px solid ${detectedInfo ? modelColor?.primary : P.bHi}`,
                  fontFamily: "'JetBrains Mono',monospace",
                  transition: "all 0.2s", letterSpacing: "0.06em",
                  display: "flex", alignItems: "center", gap: 6,
                  boxShadow: detectedInfo && modelColor ? `0 0 12px ${modelColor.glow}` : "none",
                }}
                onMouseEnter={e => {
                  if (detectedInfo && modelColor) {
                    e.currentTarget.style.boxShadow = `0 0 20px ${modelColor.primary}`;
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={e => {
                  if (detectedInfo && modelColor) {
                    e.currentTarget.style.boxShadow = `0 0 12px ${modelColor.glow}`;
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                <I n="check_circle" sz={14} col="inherit" /> ADD TO FLEET
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
