"use client";

import { useState, useRef } from "react";
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

  // Draggable state
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return; // Don't drag if clicking button
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetPosition = () => {
    setPosition({ x: 16, y: 16 });
  };

  return (
    <div
      ref={panelRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        position: "absolute", 
        top: position.y, 
        left: position.x, 
        zIndex: 10,
        width: 200,
        background: "rgba(22,18,16,0.88)",
        border: `1px solid ${P.bMid}`,
        borderRadius: 6,
        backdropFilter: "blur(16px)",
        overflow: "hidden",
        userSelect: isDragging ? "none" : "auto",
        cursor: isDragging ? "grabbing" : "grab",
        boxShadow: isDragging ? "0 8px 32px rgba(0,0,0,0.5)" : "none",
      }}
    >
      {/* Header - Draggable */}
      <div 
        onMouseDown={handleMouseDown}
        style={{
          padding: "10px 14px",
          borderBottom: `1px solid ${P.bDim}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "grab",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = `${P.cockpit}50`; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <I n="memory" f sz={14} col={P.cognac} />
          <span style={{
            fontFamily: "'JetBrains Mono',monospace", fontSize: "0.58rem",
            fontWeight: 600, letterSpacing: "0.12em", color: P.ivory,
            textTransform: "uppercase",
          }}>ECU Components</span>
        </div>
        <button
          onClick={resetPosition}
          style={{
            background: "transparent", border: "none", padding: "2px 6px",
            cursor: "pointer", borderRadius: 2, transition: "all 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          title="Reset to original position"
          onMouseEnter={e => { e.currentTarget.style.background = P.cgnDim; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          <I n="restart_alt" sz={12} col={P.cognac} />
        </button>
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
