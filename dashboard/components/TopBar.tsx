"use client";

import { useEffect, useState } from "react";
import { P } from "./theme";
import I from "./Icon";

function nowStr() { return new Date().toLocaleTimeString("en-US", { hour12: false }); }

export default function TopBar({
  connected,
  onAddDevice,
}: {
  connected: boolean;
  onAddDevice: () => void;
}) {
  const [clock, setClock] = useState("");

  useEffect(() => {
    setClock(nowStr());
    const id = setInterval(() => setClock(nowStr()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header style={{
      height: 52, background: P.bg,
        borderBottom: `1px solid ${P.bDim}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", flexShrink: 0, zIndex: 20,
      }}>
        {/* LEFT */}
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <span style={{
            fontFamily: "'Cormorant Garamond',serif", fontWeight: 700,
            fontSize: "1rem", letterSpacing: "0.16em", color: P.ivory,
          }}>SENTINEL COMMAND</span>
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          {/* Live indicator */}
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "3px 9px", background: P.cockpit, borderRadius: 2,
            border: `1px solid ${P.bDim}`,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: connected ? P.sage : P.copper }} />
            <span style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: "0.54rem",
              color: connected ? P.sage : P.copper,
            }}>{connected ? "LIVE" : "DEMO"}</span>
          </div>

          {clock && <span style={{
            fontFamily: "'JetBrains Mono',monospace", fontSize: "0.58rem", color: P.whisper,
          }}>{clock}</span>}

          <div style={{
            width: 26, height: 26, borderRadius: 3, background: P.cockpit,
            border: `1px solid ${P.bMid}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 0.18s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = P.bHi; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = P.bMid; }}
          >
            <I n="person" sz={14} col={P.parchment} />
          </div>
        </div>
      </header>
  );
}
