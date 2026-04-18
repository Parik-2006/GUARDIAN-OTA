"use client";

import { P } from "./theme";
import I from "./Icon";
import { useFleet, FleetVehicle } from "./FleetContext";

export default function SecurityPanel({ vehicle }: { vehicle: FleetVehicle }) {
  const { toggleEncryption } = useFleet();
  const enc = vehicle.encryptionEnabled;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <I n="security" f sz={18} col={P.cognac} />
        <h3 style={{
          fontFamily: "'Cormorant Garamond',serif", fontWeight: 600,
          fontSize: "1rem", color: P.ivory,
        }}>Security Settings</h3>
      </div>

      {/* Encryption Toggle */}
      <div style={{
        background: P.cockpit, border: `1px solid ${P.bDim}`,
        borderRadius: 4, padding: "16px 18px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: "0.85rem", fontWeight: 500, color: P.champagne }}>
              Payload Encryption
            </p>
            <p style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: "0.55rem",
              color: P.whisper, marginTop: 3,
            }}>AES-256-GCM · End-to-end OTA protection</p>
          </div>
          <div
            onClick={() => toggleEncryption(vehicle.deviceId)}
            style={{
              width: 42, height: 22, borderRadius: 11,
              background: enc ? P.cgnDim : P.dash,
              border: `1px solid ${enc ? P.bHi : P.bDim}`,
              position: "relative", cursor: "pointer",
              transition: "all 0.25s", padding: "0 2px",
              display: "flex", alignItems: "center",
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              background: enc ? P.cognac : P.parchment,
              transform: enc ? "translateX(19px)" : "translateX(0)",
              transition: "transform 0.25s, background 0.25s",
              boxShadow: enc ? `0 0 8px ${P.cognac}` : "none",
            }} />
          </div>
        </div>

        {/* Status display */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
        }}>
          {[
            { label: "Algorithm", val: enc ? "AES-256-GCM" : "DISABLED", col: enc ? P.sage : P.burg },
            { label: "Key Slot", val: enc ? "0x4F" : "—", col: enc ? P.cognac : P.whisper },
            { label: "IV Status", val: enc ? "GENERATED" : "N/A", col: enc ? P.ivory : P.whisper },
            { label: "Key Length", val: enc ? "256-bit" : "—", col: enc ? P.champagne : P.whisper },
          ].map(s => (
            <div key={s.label} style={{
              background: P.dash, borderRadius: 2, padding: "8px 10px",
              border: `1px solid ${P.bDim}`,
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: "0.48rem",
                color: P.whisper, letterSpacing: "0.14em",
                textTransform: "uppercase", marginBottom: 3,
              }}>{s.label}</div>
              <div style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem",
                color: s.col, fontWeight: 500,
              }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Badges */}
      <div style={{
        background: P.cockpit, border: `1px solid ${P.bDim}`,
        borderRadius: 4, padding: "12px 14px",
        display: "flex", gap: 8, flexWrap: "wrap",
      }}>
        {[
          { label: "SIG", ok: vehicle.signatureOk, icon: "verified" },
          { label: "TLS", ok: vehicle.tlsHealthy, icon: "lock" },
          { label: "INT", ok: vehicle.integrityOk, icon: "shield" },
          { label: "ROLLBACK", ok: vehicle.rollbackArmed, icon: "undo" },
        ].map(b => (
          <span key={b.label} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 8px", borderRadius: 2,
            background: b.ok ? P.sageDim : P.burgDim,
            border: `1px solid ${b.ok ? "rgba(122,158,114,0.22)" : "rgba(158,90,90,0.22)"}`,
            fontFamily: "'JetBrains Mono',monospace", fontSize: "0.52rem",
            color: b.ok ? P.sage : P.burg,
          }}>
            <I n={b.icon} sz={10} col={b.ok ? P.sage : P.burg} /> {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
