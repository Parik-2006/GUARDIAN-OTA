"use client";

import { P } from "./theme";
import I from "./Icon";
import { useFleet } from "./FleetContext";

export default function Sidebar({ onBack }: { onBack?: () => void }) {
  const { currentView, goToDashboard, goToTerminal, goToDocumentation } = useFleet();
  const isDashboard = currentView === "fleet";
  const isTerminal = currentView === "terminal";
  const isDocumentation = currentView === "documentation";

  return (
    <aside style={{
      width: 248, flexShrink: 0, background: P.wall,
      borderRight: `1px solid ${P.bDim}`,
      display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden",
    }}>
      {/* ── HEADER ── */}
      <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${P.bDim}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 15 }}>
          <div style={{
            width: 36, height: 36, background: P.cockpit, borderRadius: 4,
            border: `1px solid ${P.bHi}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <I n="shield" f sz={19} col={P.cognac} />
          </div>
          <div>
            <div style={{
              fontFamily: "'Cormorant Garamond',serif", fontWeight: 700,
              fontSize: "0.95rem", color: P.ivory, letterSpacing: "0.08em",
            }}>GUARDIAN</div>
            <div style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: "0.54rem",
              color: P.cognac, letterSpacing: "0.22em", marginTop: 2,
            }}>FLEET · OTA</div>
          </div>
        </div>
      </div>

      {/* ── NAVIGATION ── */}
      <div style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 1 }}>
        <div
          onClick={goToDashboard}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 14px", borderRadius: 3, cursor: "pointer",
            transition: "all 0.18s",
            color: isDashboard ? P.ivory : P.cashmere,
            background: isDashboard ? P.cockpit : "transparent",
            borderLeft: `2px solid ${isDashboard ? P.cognac : "transparent"}`,
            fontWeight: 600, fontSize: "0.88rem",
          }}
          onMouseEnter={e => {
            if (!isDashboard) {
              e.currentTarget.style.background = P.cockpit;
              e.currentTarget.style.color = P.champagne;
              e.currentTarget.style.borderLeftColor = P.bHi;
            }
          }}
          onMouseLeave={e => {
            if (!isDashboard) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = P.cashmere;
              e.currentTarget.style.borderLeftColor = "transparent";
            }
          }}
        >
          <I n="dashboard" f={isDashboard} sz={18} col={isDashboard ? P.cognac : undefined} />
          <span>Dashboard</span>
        </div>

        <div
          onClick={goToTerminal}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 14px", borderRadius: 3, cursor: "pointer",
            transition: "all 0.18s",
            color: isTerminal ? P.ivory : P.cashmere,
            background: isTerminal ? P.cockpit : "transparent",
            borderLeft: `2px solid ${isTerminal ? P.cognac : "transparent"}`,
            fontWeight: 600, fontSize: "0.88rem",
          }}
          onMouseEnter={e => {
            if (!isTerminal) {
              e.currentTarget.style.background = P.cockpit;
              e.currentTarget.style.color = P.champagne;
              e.currentTarget.style.borderLeftColor = P.bHi;
            }
          }}
          onMouseLeave={e => {
            if (!isTerminal) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = P.cashmere;
              e.currentTarget.style.borderLeftColor = "transparent";
            }
          }}
        >
          <I n="terminal" f={isTerminal} sz={18} col={isTerminal ? P.cognac : undefined} />
          <span>Terminal</span>
        </div>

        <div
          onClick={goToDocumentation}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 14px", borderRadius: 3, cursor: "pointer",
            transition: "all 0.18s",
            color: isDocumentation ? P.ivory : P.cashmere,
            background: isDocumentation ? P.cockpit : "transparent",
            borderLeft: `2px solid ${isDocumentation ? P.cognac : "transparent"}`,
            fontWeight: 600, fontSize: "0.88rem",
          }}
          onMouseEnter={e => {
            if (!isDocumentation) {
              e.currentTarget.style.background = P.cockpit;
              e.currentTarget.style.color = P.champagne;
              e.currentTarget.style.borderLeftColor = P.bHi;
            }
          }}
          onMouseLeave={e => {
            if (!isDocumentation) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = P.cashmere;
              e.currentTarget.style.borderLeftColor = "transparent";
            }
          }}
        >
          <I n="description" f={isDocumentation} sz={18} col={isDocumentation ? P.cognac : undefined} />
          <span>Documentation</span>
        </div>
      </div>

      {/* ── BOTTOM ── */}
      <div style={{ padding: "8px 8px", borderTop: `1px solid ${P.bDim}`, display: "flex", flexDirection: "column", gap: 1 }}>
        {onBack && (
          <div
            onClick={onBack}
            style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "7px 12px", borderRadius: 3, cursor: "pointer",
              color: P.whisper, fontSize: "0.74rem",
              marginTop: 4, borderTop: `1px solid ${P.bDim}`,
              transition: "all 0.18s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = P.cockpit; e.currentTarget.style.color = P.parchment; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = P.whisper; }}
          >
            <I n="arrow_back" sz={14} /><span>Landing Page</span>
          </div>
        )}
      </div>
    </aside>
  );
}
