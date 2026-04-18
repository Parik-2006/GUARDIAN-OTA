"use client";

import { motion } from "framer-motion";
import { P } from "./theme";
import I from "./Icon";
import { useFleet } from "./FleetContext";

const MODEL_ICONS: Record<string, string> = {
  Interceptor: "speed",
  Sentinel: "shield",
  Voyager: "explore",
  Phantom: "visibility_off",
  Eclipse: "dark_mode",
};

export default function FleetDashboard() {
  const { fleet, selectVehicle, deleteDevice, goToTerminal } = useFleet();

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{
          fontFamily: "'Cormorant Garamond',serif", fontSize: "2.4rem",
          fontWeight: 400, letterSpacing: "-0.01em", color: P.ivory, lineHeight: 1,
        }}>Fleet Overview</h2>
        <p style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem",
          color: P.whisper, marginTop: 7,
          display: "flex", alignItems: "center", gap: 7,
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: "50%",
            background: P.sage, display: "inline-block",
          }} />
          {fleet.length} VEHICLES REGISTERED · SELECT TO INSPECT
        </p>
      </div>

      {/* Vehicle Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 16,
      }}>
        {fleet.map((v, i) => {
          const threatCol = v.threatLevel === "HIGH" ? P.burg : v.threatLevel === "MEDIUM" ? P.copper : P.sage;
          const statusCol = v.status === "online" ? P.sage : v.status === "updating" ? P.cognac : P.burg;

          return (
            <motion.div
              key={v.deviceId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => selectVehicle(v.deviceId)}
              style={{
                background: "rgba(240,235,224,0.033)",
                border: `1px solid rgba(240,235,224,0.07)`,
                borderRadius: 8, padding: "24px 22px",
                position: "relative", overflow: "hidden", cursor: "pointer",
                transition: "border-color 0.3s, box-shadow 0.3s, transform 0.3s",
                backdropFilter: "blur(16px)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(212,169,106,0.35)";
                e.currentTarget.style.boxShadow = "0 0 28px rgba(212,169,106,0.1), 0 8px 32px rgba(0,0,0,0.4)";
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "rgba(240,235,224,0.07)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Shine */}
              <div style={{
                position: "absolute", inset: 0, borderRadius: "inherit",
                background: "linear-gradient(145deg, rgba(240,235,224,0.04) 0%, transparent 50%)",
                pointerEvents: "none",
              }} />

              {/* Top row: icon + model name */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 6,
                    background: P.cgnDim, border: `1px solid ${P.bHi}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <I n={MODEL_ICONS[v.model] || "directions_car"} f sz={22} col={P.cognac} />
                  </div>
                  <div>
                    <h3 style={{
                      fontFamily: "'Cormorant Garamond',serif", fontWeight: 700,
                      fontSize: "1.15rem", color: P.ivory, letterSpacing: "0.02em",
                    }}>{v.name}</h3>
                    <span style={{
                      fontFamily: "'JetBrains Mono',monospace", fontSize: "0.52rem",
                      color: P.whisper, letterSpacing: "0.12em",
                    }}>{v.model.toUpperCase()} · {v.deviceId}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: statusCol,
                      boxShadow: `0 0 6px ${statusCol}`,
                    }} />
                    <span style={{
                      fontFamily: "'JetBrains Mono',monospace", fontSize: "0.52rem",
                      color: statusCol, textTransform: "uppercase", letterSpacing: "0.1em",
                    }}>{v.status}</span>
                  </div>
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDevice(v.deviceId);
                    }}
                    style={{
                      background: "transparent", border: "none", cursor: "pointer",
                      padding: "4px", borderRadius: 3, transition: "all 0.2s",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "rgba(196,107,107,0.2)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    title="Delete device"
                  >
                    <I n="delete" sz={16} col={P.burg} />
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8, marginBottom: 14,
              }}>
                {[
                  { label: "OTA VER", val: v.otaVersion, col: P.cognac },
                  { label: "THREAT", val: v.threatLevel, col: threatCol },
                  { label: "SAFETY", val: v.safetyState, col: v.safetyState === "SAFE" ? P.sage : P.burg },
                ].map(s => (
                  <div key={s.label} style={{
                    background: P.cockpit, borderRadius: 3, padding: "8px 10px",
                    border: `1px solid ${P.bDim}`,
                  }}>
                    <div style={{
                      fontFamily: "'JetBrains Mono',monospace", fontSize: "0.48rem",
                      color: P.whisper, letterSpacing: "0.14em",
                      textTransform: "uppercase", marginBottom: 3,
                    }}>{s.label}</div>
                    <div style={{
                      fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem",
                      color: s.col, fontWeight: 600,
                    }}>{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Footer: security badges */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {v.signatureOk && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 3,
                    padding: "2px 7px", borderRadius: 2,
                    background: P.sageDim, border: `1px solid rgba(122,158,114,0.22)`,
                    fontFamily: "'JetBrains Mono',monospace", fontSize: "0.5rem",
                    color: P.sage,
                  }}><I n="verified" sz={10} col={P.sage} /> SIG OK</span>
                )}
                {v.tlsHealthy && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 3,
                    padding: "2px 7px", borderRadius: 2,
                    background: P.cgnDim, border: `1px solid rgba(200,145,74,0.22)`,
                    fontFamily: "'JetBrains Mono',monospace", fontSize: "0.5rem",
                    color: P.cognac,
                  }}><I n="lock" sz={10} col={P.cognac} /> TLS</span>
                )}
                {v.encryptionEnabled && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 3,
                    padding: "2px 7px", borderRadius: 2,
                    background: P.sageDim, border: `1px solid rgba(122,158,114,0.22)`,
                    fontFamily: "'JetBrains Mono',monospace", fontSize: "0.5rem",
                    color: P.sage,
                  }}><I n="enhanced_encryption" sz={10} col={P.sage} /> AES</span>
                )}
              </div>

              {/* Arrow hint */}
              <div style={{
                position: "absolute", bottom: 16, right: 18, opacity: 0.3,
                transition: "opacity 0.2s",
              }}>
                <I n="arrow_forward" sz={18} col={P.cognac} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Terminal Button Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginTop: 32 }}
      >
        <button
          onClick={goToTerminal}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "20px 24px", width: "100%",
            background: "linear-gradient(135deg, rgba(200,145,74,0.15) 0%, rgba(212,169,106,0.08) 100%)",
            border: `1px solid rgba(200,145,74,0.25)`, borderRadius: 8,
            cursor: "pointer", transition: "all 0.3s", position: "relative", overflow: "hidden",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "linear-gradient(135deg, rgba(200,145,74,0.25) 0%, rgba(212,169,106,0.15) 100%)";
            e.currentTarget.style.borderColor = "rgba(200,145,74,0.5)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "linear-gradient(135deg, rgba(200,145,74,0.15) 0%, rgba(212,169,106,0.08) 100%)";
            e.currentTarget.style.borderColor = "rgba(200,145,74,0.25)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div style={{
            width: 50, height: 50, borderRadius: 6,
            background: P.cgnDim, border: `1px solid ${P.bHi}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <I n="terminal" f sz={24} col={P.cognac} />
          </div>
          <div style={{ textAlign: "left", flex: 1 }}>
            <div style={{
              fontFamily: "'Cormorant Garamond',serif", fontWeight: 700,
              fontSize: "1.1rem", color: P.ivory, letterSpacing: "0.02em",
            }}>Open Terminal</div>
            <div style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: "0.52rem",
              color: P.whisper, letterSpacing: "0.12em", marginTop: 4,
            }}>RUN COMMANDS · GIT PUSH · UPDATES</div>
          </div>
          <div style={{ opacity: 0.5, transition: "transform 0.3s" }}>
            <I n="arrow_forward" sz={20} col={P.cognac} />
          </div>
        </button>
      </motion.div>
