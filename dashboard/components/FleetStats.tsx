"use client";

import { motion } from "framer-motion";
import { P } from "./theme";
import I from "./Icon";
import { useFleet } from "./FleetContext";

export default function FleetStats() {
  const { fleet } = useFleet();

  const totalDevices = fleet.length;
  const onlineDevices = fleet.filter(v => (Date.now() - new Date(v.lastSeen || 0).getTime()) < 35000).length;
  
  // Calculate average health from ECU states
  let totalEcus = 0;
  let healthyEcus = 0;
  fleet.forEach(v => {
    if (v.ecuStates) {
      Object.values(v.ecuStates).forEach(st => {
        totalEcus++;
        if (st === "green") healthyEcus++;
      });
    }
  });
  const healthPercent = totalEcus > 0 ? Math.round((healthyEcus / totalEcus) * 100) : 100;

  const STATS = [
    { label: "CONNECTED DEVICES", value: totalDevices, sub: `${onlineDevices} ACTIVE`, icon: "sensors", col: P.sage },
    { label: "FLEET HEALTH SCORE", value: `${healthPercent}%`, sub: "REAL-TIME CAN DIAG", icon: "security", col: healthPercent < 90 ? P.burg : P.sage },
    { label: "ACTIVE CAMPAIGNS", value: 1, sub: "V1.1 DEPLOYMENT", icon: "cloud_upload", col: P.cognac },
    { label: "THREAT RESPONSE", value: "AUTO", sub: "PLAID SECURED", icon: "offline_bolt", col: P.copper },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
      {STATS.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          style={{
            background: P.cockpit,
            border: `1px solid ${P.bHi}`,
            borderRadius: 6,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle background glow */}
          <div style={{
            position: "absolute", top: -20, right: -20, width: 60, height: 60,
            background: s.col, opacity: 0.03, filter: "blur(30px)", borderRadius: "50%"
          }} />

          <div style={{
            width: 40, height: 40, background: "rgba(255,255,255,0.02)",
            borderRadius: 5, border: `1px solid ${P.bMid}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <I n={s.icon} f sz={20} col={s.col} />
          </div>

          <div>
            <p style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: "0.52rem",
              color: P.whisper, letterSpacing: "0.14em", marginBottom: 2,
            }}>{s.label}</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{
                fontFamily: "'Cormorant Garamond',serif", fontSize: "1.4rem",
                fontWeight: 700, color: P.ivory,
              }}>{s.value}</span>
              <span style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: "0.48rem",
                color: s.col, opacity: 0.8, letterSpacing: "0.05em", fontWeight: 600,
              }}>{s.sub}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
