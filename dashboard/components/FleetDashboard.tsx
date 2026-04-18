"use client";

import { motion } from "framer-motion";
import { P } from "./theme";
import I from "./Icon";
import BrandLogo from "./BrandLogo";
import { useFleet } from "./FleetContext";
import { COMPANY_LOGOS } from "./companyLogos";

export default function FleetDashboard() {
  const { fleet, selectVehicle, deleteDevice } = useFleet();

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

              {/* Top row: brand logo + model name */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 6,
                    background: P.cgnDim, border: `1px solid ${P.bHi}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                  }}>
<<<<<<< HEAD
                    <BrandLogo vehicleName={v.name} size={44} />
=======
                    <svg 
                      width="28" 
                      height="28" 
                      viewBox="0 0 100 100" 
                      xmlns="http://www.w3.org/2000/svg"
                      dangerouslySetInnerHTML={{ 
                        __html: Object.values(COMPANY_LOGOS)[v.companyLogoIndex % Object.values(COMPANY_LOGOS).length].svg 
                      }}
                    />
>>>>>>> a31d7df (Fix Terminal icon styling - wrap Icon in div for proper style props)
                  </div>
                  <div>
                    <h3 style={{
                      fontFamily: "'Cormorant Garamond',serif", fontWeight: 700,
                      fontSize: "1.15rem", color: P.ivory, letterSpacing: "0.02em",
                    }}>{v.name}</h3>
                    <span style={{
                      fontFamily: "'JetBrains Mono',monospace", fontSize: "0.52rem",
                      color: P.whisper, letterSpacing: "0.12em",
                    }}>{Object.values(COMPANY_LOGOS)[v.companyLogoIndex % Object.values(COMPANY_LOGOS).length].name} · {v.deviceId}</span>
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
    </div>
  );
}
