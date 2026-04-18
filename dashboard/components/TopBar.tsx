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
        <nav style={{ display: "flex", height: 52 }}>
          {["Fleet Metrics", "Firmware Repo", "Crypto Audit"].map((l, i) => (
            <a key={l} href="#" style={{
              height: "100%", display: "flex", alignItems: "center", padding: "0 13px",
              fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.09em",
              textTransform: "uppercase", textDecoration: "none",
              color: i === 0 ? P.cognac : P.whisper,
              borderBottom: `2px solid ${i === 0 ? P.cognac : "transparent"}`,
              transition: "all 0.2s", fontFamily: "'JetBrains Mono',monospace",
            }}
              onMouseEnter={e => { if (i !== 0) (e.currentTarget as HTMLAnchorElement).style.color = P.parchment; }}
              onMouseLeave={e => { if (i !== 0) (e.currentTarget as HTMLAnchorElement).style.color = P.whisper; }}
            >{l}</a>
          ))}
        </nav>
      </div>

      {/* RIGHT */}
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        {/* Add Device Button */}
        <button
          onClick={onAddDevice}
          style={{
            padding: "4px 14px", background: P.cgnDim, color: P.cognac,
            fontSize: "0.64rem", fontWeight: 700, borderRadius: 2, cursor: "pointer",
            letterSpacing: "0.06em", textTransform: "uppercase",
            border: `1px solid ${P.bHi}`, fontFamily: "'JetBrains Mono',monospace",
            transition: "all 0.2s", display: "flex", alignItems: "center", gap: 5,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = P.cgnGlow; e.currentTarget.style.color = P.ivory; }}
          onMouseLeave={e => { e.currentTarget.style.background = P.cgnDim; e.currentTarget.style.color = P.cognac; }}
        >
          <I n="add" sz={13} col="inherit" /> Add Device
        </button>

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
