"use client";

import { P } from "./theme";
import { useFleet } from "./FleetContext";

export default function DeviceBar() {
  const { fleet, selectVehicle, selectedVehicleId } = useFleet();

  const statusColor = (s: string) =>
    s === "online" ? P.sage : s === "updating" ? P.cognac : P.burg;

  return (
    <div style={{
      height: 36, background: P.cockpit,
      borderBottom: `1px solid ${P.bDim}`,
      display: "flex", alignItems: "center",
      padding: "0 16px", gap: 6, flexShrink: 0,
      overflowX: "auto", overflowY: "hidden",
      scrollbarWidth: "none",
    }}>
      <span style={{
        fontFamily: "'JetBrains Mono',monospace", fontSize: "0.52rem",
        color: P.whisper, letterSpacing: "0.14em", textTransform: "uppercase",
        marginRight: 8, flexShrink: 0,
      }}>CONNECTED:</span>
      {fleet.map(v => {
        const active = v.deviceId === selectedVehicleId;
        return (
          <button
            key={v.deviceId}
            onClick={() => selectVehicle(v.deviceId)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "3px 10px", borderRadius: 2, cursor: "pointer",
              background: active ? P.cgnDim : "transparent",
              border: `1px solid ${active ? P.bHi : "transparent"}`,
              transition: "all 0.18s", flexShrink: 0,
            }}
            onMouseEnter={e => {
              if (!active) {
                e.currentTarget.style.background = P.dash;
                e.currentTarget.style.borderColor = P.bDim;
              }
            }}
            onMouseLeave={e => {
              if (!active) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "transparent";
              }
            }}
          >
            <div style={{
              width: 5, height: 5, borderRadius: "50%",
              background: statusColor(v.status),
              boxShadow: `0 0 4px ${statusColor(v.status)}`,
            }} />
            <span style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: "0.56rem",
              color: active ? P.cognac : P.champagne, fontWeight: active ? 600 : 400,
              letterSpacing: "0.04em",
            }}>{v.name}</span>
          </button>
        );
      })}
    </div>
  );
}
