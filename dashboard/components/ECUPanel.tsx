"use client";

import { P } from "./theme";
import I from "./Icon";
import { useFleet } from "./FleetContext";
import { getECUDefs } from "./CarModel3D";

export default function ECUPanel() {
  const { activeEcu, setActiveEcu, fleet, selectedVehicleId } = useFleet();
  
  // Get the selected vehicle to find its carVariant
  const selectedVehicle = fleet.find(v => v.deviceId === selectedVehicleId);
  const carVariant = selectedVehicle?.carVariant || "bmw-m5";
  const ecuDefs = getECUDefs(carVariant);

  return (
    <div style={{
      position: "absolute", top: 16, left: 16, zIndex: 10,
      width: 200,
      background: "rgba(22,18,16,0.88)",
      border: `1px solid ${P.bMid}`,
      borderRadius: 6,
      backdropFilter: "blur(16px)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "10px 14px",
        borderBottom: `1px solid ${P.bDim}`,
        display: "flex", alignItems: "center", gap: 7,
      }}>
        <I n="memory" f sz={14} col={P.cognac} />
        <span style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: "0.58rem",
          fontWeight: 600, letterSpacing: "0.12em", color: P.ivory,
          textTransform: "uppercase",
        }}>ECU Components</span>
      </div>

      {/* List */}
      <div style={{ padding: "6px 6px" }}>
        {ecuDefs.map(ecu => {
          const isActive = activeEcu === ecu.name;
          return (
            <div
              key={ecu.name}
              onClick={() => setActiveEcu(isActive ? null : ecu.name)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "7px 10px", borderRadius: 3, cursor: "pointer",
                transition: "all 0.2s",
                background: isActive ? `${ecu.color}15` : "transparent",
                borderLeft: `2px solid ${isActive ? ecu.color : "transparent"}`,
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = P.cockpit;
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {/* Status dot */}
              <div style={{
                width: 7, height: 7, borderRadius: "50%",
                background: ecu.color,
                boxShadow: isActive ? `0 0 8px ${ecu.color}` : "none",
                transition: "all 0.3s",
                flexShrink: 0,
              }} />
              {/* Name */}
              <span style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: "0.62rem",
                color: isActive ? ecu.color : P.champagne,
                fontWeight: isActive ? 600 : 400,
                transition: "color 0.3s",
              }}>{ecu.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
