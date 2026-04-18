"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ══════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════ */
type View = "dashboard" | "terminal" | "updates" | "verification";

interface DeviceState {
  deviceId: string; primary: boolean; otaVersion: string;
  safetyState: string; ecuStates: Record<string, string>;
  lastSeen: string; threatLevel: "LOW" | "MEDIUM" | "HIGH";
  otaProgress: number; signatureOk: boolean; integrityOk: boolean;
  tlsHealthy: boolean; rollbackArmed: boolean;
}
interface NodeVerification {
  id: string; ip: string;
  status: "verifying" | "complete" | "decrypting" | "error" | "downloading";
  progress: number; label: string;
}

function nowStr() { return new Date().toLocaleTimeString("en-US", { hour12: false }); }

/* ══════════════════════════════════════════════════════════════════
   ICON — Material Symbols rendered via CSS font
══════════════════════════════════════════════════════════════════ */
function I({ n, f = false, sz = 20, col }: { n: string; f?: boolean; sz?: number; col?: string }) {
  return (
    <span style={{
      fontFamily: "'Material Symbols Outlined'", fontWeight: 400, fontStyle: "normal",
      fontSize: sz, lineHeight: 1, letterSpacing: "normal", textTransform: "none",
      display: "inline-block", whiteSpace: "nowrap", direction: "ltr",
      WebkitFontSmoothing: "antialiased", fontVariationSettings: f ? "'FILL' 1" : "'FILL' 0",
      color: col, verticalAlign: "middle",
    }}>{n}</span>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SIDE NAVIGATION
══════════════════════════════════════════════════════════════════ */
function SideNav({ view, setView, onBack }: { view: View; setView: (v: View) => void; onBack?: () => void }) {
  const tabs: { id: View; icon: string; label: string }[] = [
    { id: "dashboard", icon: "dashboard", label: "Dashboard" },
    { id: "terminal", icon: "terminal", label: "Terminal" },
    { id: "updates", icon: "system_update_alt", label: "Updates" },
    { id: "verification", icon: "verified_user", label: "Verification" },
  ];
  return (
    <aside style={{ width: 256, flexShrink: 0, background: "#091328", borderRight: "1px solid #141f38", display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* Brand header */}
      <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid rgba(20,31,56,0.7)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 38, height: 38, background: "#141f38", borderRadius: 4, border: "1px solid rgba(105,246,184,0.25)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(105,246,184,0.1)" }}>
            <I n="shield" f sz={20} col="#69f6b8" />
          </div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#dee5ff", letterSpacing: "0.06em" }}>NODE_01</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.58rem", color: "#69f6b8", letterSpacing: "0.22em", marginTop: 2 }}>CONNECTED / SECURE</div>
          </div>
        </div>
        <button style={{ width: "100%", padding: "9px 0", background: "linear-gradient(135deg,#a1faff,#00e5ee)", color: "#004346", fontWeight: 700, fontSize: "0.8rem", borderRadius: 2, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, letterSpacing: "0.04em" }}>
          <I n="add" sz={16} /> New Fleet Group
        </button>
      </div>
      {/* Nav links */}
      <div style={{ flex: 1, padding: "12px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        {tabs.map((t) => {
          const active = view === t.id;
          return (
            <div key={t.id} onClick={() => setView(t.id)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 2, cursor: "pointer", transition: "all 0.18s", color: active ? "#a1faff" : "#dee5ff", opacity: active ? 1 : 0.55, background: active ? "#141f38" : "transparent", borderLeft: `3px solid ${active ? "#a1faff" : "transparent"}`, fontWeight: 500, fontSize: "0.875rem" }}>
              <I n={t.icon} f={active} sz={18} col={active ? "#a1faff" : undefined} />
              <span>{t.label}</span>
            </div>
          );
        })}
        {[{ icon: "analytics", label: "Device Logs" }].map(t => (
          <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 2, cursor: "pointer", color: "#dee5ff", opacity: 0.45, fontSize: "0.875rem", fontWeight: 500 }}>
            <I n={t.icon} sz={18} /><span>{t.label}</span>
          </div>
        ))}
      </div>
      {/* Footer */}
      <div style={{ padding: "8px 12px", borderTop: "1px solid rgba(20,31,56,0.6)", display: "flex", flexDirection: "column", gap: 2 }}>
        {[{ icon: "monitor_heart", label: "System Health" }, { icon: "menu_book", label: "Documentation" }].map(t => (
          <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 2, cursor: "pointer", color: "#dee5ff", opacity: 0.45, fontSize: "0.78rem" }}>
            <I n={t.icon} sz={16} /><span>{t.label}</span>
          </div>
        ))}
        {onBack && (
          <div onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 2, cursor: "pointer", color: "#dee5ff", opacity: 0.5, fontSize: "0.78rem", marginTop: 4, borderTop: "1px solid rgba(64,72,93,0.2)" }}>
            <I n="arrow_back" sz={16} /><span>Landing Page</span>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TOP BAR
══════════════════════════════════════════════════════════════════ */
function TopBar({ connected }: { connected: boolean }) {
  const [clock, setClock] = useState("");
  useEffect(() => { setClock(nowStr()); const id = setInterval(() => setClock(nowStr()), 1000); return () => clearInterval(id); }, []);
  return (
    <header style={{ height: 56, background: "#060e20", borderBottom: "1px solid #141f38", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0, zIndex: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.18em", color: "#00F5FF", textShadow: "0 0 14px rgba(0,245,255,0.35)" }}>SENTINEL COMMAND</span>
        <nav style={{ display: "flex", height: 56 }}>
          {["Fleet Metrics", "Firmware Repo", "Crypto Audit"].map((l, i) => (
            <a key={l} href="#" style={{ height: "100%", display: "flex", alignItems: "center", padding: "0 14px", fontSize: "0.72rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none", color: i === 0 ? "#00F5FF" : "rgba(222,229,255,0.55)", borderBottom: `2px solid ${i === 0 ? "#00F5FF" : "transparent"}`, transition: "all 0.18s" }}>{l}</a>
          ))}
        </nav>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "#091328", borderRadius: 2, border: "1px solid rgba(64,72,93,0.35)" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: connected ? "#69f6b8" : "#D4A96A", boxShadow: connected ? "0 0 6px rgba(105,246,184,0.7)" : "none" }} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.58rem", color: connected ? "#69f6b8" : "#D4A96A" }}>{connected ? "LIVE" : "DEMO"}</span>
        </div>
        {clock && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.62rem", color: "#a3aac4" }}>{clock}</span>}
        <button style={{ padding: "5px 12px", border: "1px solid rgba(64,72,93,0.4)", background: "transparent", color: "#dee5ff", fontSize: "0.7rem", fontWeight: 600, borderRadius: 2, cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase" }}>Emergency Stop</button>
        <button style={{ padding: "5px 16px", background: "linear-gradient(135deg,#a1faff,#00e5ee)", color: "#004346", fontSize: "0.7rem", fontWeight: 700, borderRadius: 2, cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase", border: "none", boxShadow: "0 0 14px rgba(161,250,255,0.2)" }}>Deploy Update</button>
        {["rss_feed", "settings_input_component", "notifications"].map(ic => (
          <button key={ic} style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(222,229,255,0.5)", padding: 4 }}><I n={ic} sz={19} /></button>
        ))}
        <div style={{ width: 28, height: 28, borderRadius: 2, background: "#141f38", border: "1px solid rgba(64,72,93,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <I n="person" sz={16} col="#a3aac4" />
        </div>
      </div>
    </header>
  );
}

/* ══════════════════════════════════════════════════════════════════
   VIEW 1 — DASHBOARD
══════════════════════════════════════════════════════════════════ */
function DashboardView({ fleet }: { fleet: DeviceState[] }) {
  const high = fleet.filter(d => d.threatLevel === "HIGH").length;
  const safe = fleet.filter(d => d.safetyState === "SAFE").length;
  const feed = [
    { type: "FW_PUSH_SUCCESS", col: "#a1faff", msg: "Payload v2.4.1 delivered to NODE_77.", sub: "HASH: a8f4...9c2e", time: "JUST NOW" },
    { type: "CRYPTO_VERIFIED", col: "#69f6b8", msg: "Bootloader signature valid on Cluster Beta.", sub: "ID: CLSTR-B-09", time: "2M AGO" },
    { type: "SYS_PING", col: "#a3aac4", msg: "Routine health check completed globally.", sub: "LATENCY: 42ms avg", time: "15M AGO" },
    { type: "FW_PUSH_SUCCESS", col: "#a1faff", msg: "Payload v2.4.0 delivered to NODE_12.", sub: "HASH: f3b1...8d4a", time: "1H AGO" },
    { type: "ROLLBACK_EVENT", col: "#ff716c", msg: "NODE_44 auto-rolled back to v1.8.5.", sub: "HEALTH_CHECK_FAIL", time: "3H AGO" },
  ];
  const kpis = [
    { label: "Update Success Rate", val: "98.2%", sub: "+1.4% Δ", icon: "check_circle", subCol: "#69f6b8", grad: true },
    { label: "Total Devices", val: fleet.length || 412, sub: `ONLINE: ${safe || 409}  |  OFFLINE: ${Math.max(0,(fleet.length||412)-safe)||3}`, icon: "router", subCol: "#a3aac4" },
    { label: "Active Deployments", val: 3, sub: "V2.4.1 (STAGED)", icon: "rocket_launch", subCol: "#a3aac4", iconCol: "#a1faff" },
    { label: "Fleet Health", val: high > 2 ? "DEGRADED" : "Secure", sub: "No critical vulnerabilities detected.", icon: "shield", iconCol: "#69f6b8", subCol: "#a3aac4", highlight: true },
  ];
  const geoPoints = [
    { x: 31, y: 37, label: "US-EAST", count: 142, delay: 0 },
    { x: 17, y: 46, label: "US-WEST", count: 98, delay: 0.8 },
    { x: 51, y: 29, label: "EU-CENTRAL", count: 88, delay: 1.4 },
    { x: 66, y: 51, label: "APAC", count: 84, delay: 0.4 },
  ];
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
      {/* Page title */}
      <div style={{ marginBottom: 26 }}>
        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "2.5rem", fontWeight: 300, letterSpacing: "-0.02em", color: "#dee5ff", lineHeight: 1 }}>Fleet Overview</h2>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", color: "#a3aac4", marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#69f6b8", display: "inline-block", boxShadow: "0 0 8px rgba(105,246,184,0.6)" }} />
          SYSTEM.STATE = NOMINAL_OPERATION
        </p>
      </div>
      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {kpis.map((k, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            style={{ background: "#091328", borderRadius: 2, border: k.highlight ? "1px solid rgba(105,246,184,0.1)" : "1px solid rgba(64,72,93,0.2)", borderLeft: k.highlight ? "3px solid #69f6b8" : undefined, padding: "18px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 130, cursor: "default", position: "relative", overflow: "hidden", transition: "background 0.18s" }}>
            {i === 0 && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(161,250,255,0.05) 0%, transparent 60%)", pointerEvents: "none" }} />}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <span style={{ fontSize: "0.62rem", color: "#a3aac4", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>{k.label}</span>
              <I n={k.icon} f={k.highlight} sz={20} col={k.iconCol || (k.highlight ? "#69f6b8" : "#a3aac4")} />
            </div>
            <div>
              {k.grad
                ? <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "2.5rem", fontWeight: 300, background: "linear-gradient(90deg,#a1faff,#00e5ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.02em" }}>{k.val}</span>
                : <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: k.highlight ? "1.7rem" : "2.5rem", fontWeight: k.highlight ? 700 : 300, color: k.highlight ? "#69f6b8" : "#dee5ff", letterSpacing: k.highlight ? "0.04em" : "-0.02em", textTransform: k.highlight ? "uppercase" : undefined }}>{k.val}</span>}
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", color: k.subCol, marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                {i === 0 && <I n="trending_up" sz={13} col="#69f6b8" />}{k.sub}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {/* Map + Feed */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 12, marginBottom: 18 }}>
        {/* Geo map */}
        <div style={{ background: "#091328", borderRadius: 2, border: "1px solid rgba(64,72,93,0.2)", display: "flex", flexDirection: "column", overflow: "hidden", height: 400 }}>
          <div style={{ height: 38, background: "#091328", borderBottom: "1px solid rgba(64,72,93,0.25)", display: "flex", alignItems: "center", padding: "0 16px", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 24 }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", color: "#a1faff", borderBottom: "1px solid #a1faff", paddingBottom: 2 }}>GEO_DISTRIBUTION.MAP</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", color: "#a3aac4", cursor: "pointer" }}>NETWORK_TOPOLOGY</span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(64,72,93,0.5)" }} />)}</div>
          </div>
          <div style={{ flex: 1, background: "#040812", position: "relative", overflow: "hidden" }}>
            {/* Grid */}
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(161,250,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(161,250,255,0.03) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
            {/* Gradient overlay */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #040812 0%, transparent 40%)" }} />
            {/* SVG outlines */}
            <svg viewBox="0 0 800 380" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.1 }}>
              <ellipse cx="400" cy="190" rx="360" ry="160" fill="none" stroke="#a1faff" strokeWidth="0.5" />
              <path d="M60,190 Q200,80 340,160 Q440,60 560,140 Q660,80 750,170" fill="none" stroke="#a1faff" strokeWidth="0.6" />
              <path d="M40,260 Q200,210 360,245 Q500,210 640,255 Q720,240 780,260" fill="none" stroke="#a1faff" strokeWidth="0.4" />
              <line x1="400" y1="30" x2="400" y2="360" stroke="#a1faff" strokeWidth="0.3" strokeDasharray="6 6" />
              <line x1="40" y1="190" x2="760" y2="190" stroke="#a1faff" strokeWidth="0.3" strokeDasharray="6 6" />
            </svg>
            {/* Connection lines between nodes */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
              <line x1="31%" y1="37%" x2="51%" y2="29%" stroke="rgba(161,250,255,0.12)" strokeWidth="0.8" strokeDasharray="5 5" />
              <line x1="31%" y1="37%" x2="17%" y2="46%" stroke="rgba(161,250,255,0.12)" strokeWidth="0.8" strokeDasharray="5 5" />
              <line x1="51%" y1="29%" x2="66%" y2="51%" stroke="rgba(161,250,255,0.12)" strokeWidth="0.8" strokeDasharray="5 5" />
              <line x1="17%" y1="46%" x2="31%" y2="37%" stroke="rgba(161,250,255,0.08)" strokeWidth="0.5" strokeDasharray="4 6" />
            </svg>
            {/* Geo points */}
            {geoPoints.map(g => (
              <div key={g.label} style={{ position: "absolute", left: `${g.x}%`, top: `${g.y}%`, transform: "translate(-50%,-50%)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#a1faff", boxShadow: "0 0 12px rgba(161,250,255,0.7)", animationDelay: `${g.delay}s`, animation: "gpulse 2.5s ease-in-out infinite" }} />
                <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", background: "rgba(25,37,64,0.8)", backdropFilter: "blur(12px)", border: "1px solid rgba(64,72,93,0.35)", borderRadius: 2, padding: "7px 11px", width: 130, whiteSpace: "nowrap" }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.55rem", color: "#a3aac4", marginBottom: 4 }}>{g.label}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
                    <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.4rem", fontWeight: 600, color: "#dee5ff", lineHeight: 1 }}>{g.count}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.55rem", color: "#69f6b8" }}>● 100% UP</span>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ position: "absolute", bottom: 14, right: 18, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.58rem", color: "#a3aac4", textAlign: "right", lineHeight: 1.7 }}>
              LAT: 37.7749 N<br />LNG: 122.4194 W<br />
              <span style={{ color: "#a1faff", animation: "scanBlink 1.2s step-end infinite" }}>SCANNING...</span>
            </div>
          </div>
        </div>
        {/* Activity feed */}
        <div style={{ background: "#091328", borderRadius: 2, border: "1px solid rgba(64,72,93,0.2)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "13px 18px", borderBottom: "1px solid #141f38", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.07em", color: "#dee5ff" }}>Recent Activity</h3>
            <button style={{ fontSize: "0.6rem", fontFamily: "'JetBrains Mono',monospace", color: "#a1faff", background: "transparent", border: "none", cursor: "pointer" }}>VIEW_ALL</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
            {feed.map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                style={{ padding: "10px 12px", background: "rgba(25,37,64,0.5)", borderRadius: 2, borderLeft: `2px solid ${a.col}`, cursor: "pointer", transition: "background 0.15s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", background: `${a.col}14`, color: a.col, padding: "2px 7px", borderRadius: 2, border: `1px solid ${a.col}28` }}>{a.type}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.58rem", color: "#a3aac4" }}>{a.time}</span>
                </div>
                <p style={{ fontSize: "0.78rem", color: "#dee5ff", marginBottom: 3 }}>{a.msg}</p>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.58rem", color: "#a3aac4", opacity: 0.6 }}>{a.sub}</div>
              </motion.div>
            ))}
          </div>
          <div style={{ position: "sticky", bottom: 0, height: 36, background: "linear-gradient(to top, #091328, transparent)", pointerEvents: "none" }} />
        </div>
      </div>
      {/* Bottom stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[
          { label: "Avg OTA Duration", val: "4.2s", sub: "Down 0.8s from last epoch", icon: "timer", col: "#a1faff" },
          { label: "Signature Failures", val: String(high || 0), sub: "Last 24 hours", icon: "gpp_bad", col: high > 0 ? "#ff716c" : "#69f6b8" },
          { label: "Rollback Events", val: "1", sub: "NODE_44 · 3h ago", icon: "undo", col: "#D4A96A" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#091328", borderRadius: 2, border: "1px solid rgba(64,72,93,0.2)", padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 4, background: `${s.col}14`, border: `1px solid ${s.col}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <I n={s.icon} sz={18} col={s.col} />
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.4rem", fontWeight: 600, color: s.col }}>{s.val}</div>
              <div style={{ fontSize: "0.72rem", color: "#a3aac4" }}>{s.label}</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.58rem", color: "#a3aac4", opacity: 0.6 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes gpulse{0%,100%{transform:scale(1);opacity:.8;}50%{transform:scale(1.8);opacity:.3;}}
        @keyframes scanBlink{0%,100%{opacity:1;}50%{opacity:0.15;}}
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   VIEW 2 — TERMINAL
══════════════════════════════════════════════════════════════════ */
function TerminalView() {
  type Line = { type: "cmd"|"out"|"ok"|"err"|"info"; text: string };
  const [lines, setLines] = useState<Line[]>([
    { type: "info", text: "GUARDIAN-OTA Command Interface v4.1.0 — Initialized" },
    { type: "info", text: "Cryptographic modules loaded... OK" },
    { type: "info", text: "Establishing secure channel to Fleet Registry... OK" },
    { type: "ok",   text: "Authentication token verified. Access granted." },
    { type: "cmd",  text: "guard-ota --sign firmware.bin" },
    { type: "info", text: "[INFO] Reading target binary 'firmware.bin' (4.2 MB)" },
    { type: "info", text: "[INFO] Computing SHA-256 hash..." },
    { type: "ok",   text: "Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" },
    { type: "info", text: "[INFO] Applying ECDSA-P384 signature using key alias 'fleet-prod-01'" },
    { type: "ok",   text: "[SUCCESS] Payload signed. Created 'firmware.signed.bin'" },
    { type: "cmd",  text: "guard-ota --deploy --target NODE_01 --payload firmware.signed.bin" },
    { type: "info", text: "[INFO] Initiating deployment for target: NODE_01" },
    { type: "info", text: "[INFO] Handshake initiated (TLS 1.3)..." },
    { type: "ok",   text: "[OK] Mutual authentication verified." },
    { type: "info", text: "[INFO] Transferring payload chunks [======>     ] 60%" },
    { type: "info", text: "[INFO] Transferring payload chunks [==========] 100%" },
    { type: "info", text: "[INFO] Verifying checksum on remote device..." },
    { type: "ok",   text: "[SUCCESS] Deployment committed. NODE_01 rebooting." },
  ]);
  const [input, setInput] = useState("");
  const [tv, setTv] = useState(true);
  const [ad, setAd] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const history = [
    { cmd: "guard-ota --deploy --target...", time: "Just now" },
    { cmd: "guard-ota --sign firmware.bin", time: "2m ago" },
    { cmd: "ping fleet-registry.internal", time: "15m ago" },
    { cmd: "sysctl restart netd", time: "1h ago", err: true },
    { cmd: "tail -f /var/log/auth.log", time: "2h ago" },
    { cmd: "cat /etc/guardian/config.yaml", time: "Yesterday" },
  ];
  const col = (t: string) => ({ ok: "#69f6b8", err: "#ff716c", info: "#a3aac4" }[t] || "#dee5ff");
  const submit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !input.trim()) return;
    setLines(p => [...p, { type: "cmd", text: input }, { type: "ok", text: `[OK] Command processed: ${input}` }]);
    setInput("");
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };
  useEffect(() => { endRef.current?.scrollIntoView(); }, [lines]);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: 12, padding: 18, flex: 1, overflow: "hidden" }}>
      {/* Terminal */}
      <div style={{ background: "#000", borderRadius: 2, border: "1px solid rgba(64,72,93,0.2)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Titlebar */}
        <div style={{ height: 36, background: "#1a1a1a", borderBottom: "1px solid #333", display: "flex", alignItems: "center", padding: "0 14px", justifyContent: "space-between", flexShrink: 0, position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: "#a1faff" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 8 }}>
            <I n="terminal" sz={14} col="#a1faff" />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.12em", color: "#dee5ff" }}>GUARDIAN-OTA TERMINAL v4.1</span>
          </div>
          <div style={{ display: "flex", gap: 5 }}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#192540",border:"1px solid rgba(64,72,93,0.5)"}}/>)}</div>
        </div>
        {/* Body */}
        <div style={{ flex: 1, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, lineHeight: 1.75, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column" }}>
          {lines.map((l, i) => (
            <div key={i} style={{ marginBottom: 2 }}>
              {l.type === "cmd"
                ? <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ color: "#a1faff", fontWeight: 500, flexShrink: 0 }}>root@guardian-core:/opt/ota$</span>
                    <span style={{ color: "#dee5ff" }}>{l.text}</span>
                  </div>
                : <div style={{ paddingLeft: l.type === "info" ? 16 : 0, color: col(l.type), borderLeft: l.type === "info" ? "1px solid rgba(64,72,93,0.2)" : "none" }}>{l.text}</div>}
            </div>
          ))}
          {/* Glass notice */}
          <div style={{ margin: "16px 0", background: "rgba(25,37,64,0.6)", backdropFilter: "blur(20px)", padding: 14, borderRadius: 2, borderLeft: "2px solid #a1faff", boxShadow: "0 10px 40px rgba(0,0,0,0.5)", display: "flex", gap: 12, alignItems: "start", maxWidth: 500 }}>
            <I n="info" sz={18} col="#a1faff" />
            <div>
              <h4 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, color: "#a1faff", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>System Notice</h4>
              <p style={{ fontSize: "0.72rem", color: "#a3aac4", lineHeight: 1.6 }}>Network protocol upgrade scheduled for 03:00 UTC. Expect a brief disruption in remote terminal connectivity.</p>
            </div>
          </div>
          {/* Prompt */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <span style={{ color: "#a1faff", fontWeight: 500, flexShrink: 0 }}>root@guardian-core:/opt/ota$</span>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={submit}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#dee5ff", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, caretColor: "#a1faff" }} autoFocus />
            <span style={{ display: "inline-block", width: 8, height: "1em", background: "#a1faff", animation: "tblink 1s step-end infinite", boxShadow: "0 0 8px rgba(161,250,255,0.8)", verticalAlign: "middle" }} />
          </div>
          <div ref={endRef} />
        </div>
      </div>
      {/* Right panels */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, overflow: "hidden" }}>
        {/* Command history */}
        <div style={{ background: "#091328", borderRadius: 2, border: "1px solid rgba(64,72,93,0.2)", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "13px 18px", borderBottom: "1px solid #141f38", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 6, color: "#dee5ff" }}>
              <I n="history" sz={16} col="#a1faff" /> COMMAND HISTORY
            </h3>
            <button style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#a3aac4", background: "transparent", border: "none", cursor: "pointer" }}>Clear</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
            {history.map((h, i) => (
              <div key={i} style={{ padding: "9px 12px", borderRadius: 2, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#141f38")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem", color: h.err ? "#ff716c" : "#dee5ff" }}>{h.cmd}</code>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.58rem", color: "#a3aac4", opacity: 0, transition: "opacity 0.15s" }}>{h.time}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Session config */}
        <div style={{ background: "#091328", borderRadius: 2, border: "1px solid rgba(64,72,93,0.2)", flexShrink: 0 }}>
          <div style={{ padding: "13px 18px", borderBottom: "1px solid #141f38" }}>
            <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 6, color: "#dee5ff" }}>
              <I n="tune" sz={16} col="#a3aac4" /> SESSION CONFIG
            </h3>
          </div>
          <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
            {[["Verbose Logging","DEBUG level outputs",tv,setTv],["Auto-Deploy Signatures","Skip manual confirmation",ad,setAd]].map(([label,sub,val,setter]:any) => (
              <div key={String(label)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div><p style={{ fontSize: "0.85rem", fontWeight: 500, color: "#dee5ff" }}>{label}</p><p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.58rem", color: "#a3aac4", marginTop: 2 }}>{sub}</p></div>
                <div onClick={() => setter(!val)} style={{ width: 40, height: 20, borderRadius: 12, background: val ? "rgba(161,250,255,0.15)" : "#192540", border: `1px solid ${val ? "rgba(161,250,255,0.4)" : "rgba(64,72,93,0.3)"}`, position: "relative", cursor: "pointer", transition: "all 0.25s", padding: "0 2px", display: "flex", alignItems: "center" }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: val ? "#a1faff" : "#a3aac4", transform: val ? "translateX(20px)" : "translateX(0)", transition: "transform 0.25s", boxShadow: val ? "0 0 8px rgba(161,250,255,0.6)" : "none" }} />
                </div>
              </div>
            ))}
            <div>
              <label style={{ display: "block", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", color: "#a3aac4", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.12em" }}>Baud Rate / Uplink Limit</label>
              <div style={{ position: "relative" }}>
                <select style={{ width: "100%", appearance: "none", background: "#141f38", border: "none", outline: "none", borderBottom: "2px solid rgba(64,72,93,0.5)", color: "#dee5ff", fontSize: "0.85rem", padding: "9px 32px 9px 12px", borderRadius: "2px 2px 0 0", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace" }}>
                  <option>115200 bps (Standard)</option><option>9600 bps (Failsafe)</option><option selected>Unlimited (LAN)</option>
                </select>
                <I n="expand_more" sz={18} col="#a3aac4" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes tblink{0%,100%{opacity:1;}50%{opacity:0;}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   VIEW 3 — UPDATE MANAGER
══════════════════════════════════════════════════════════════════ */
function UpdatesView() {
  const [strategy, setStrategy] = useState<"phased"|"immediate">("phased");
  const [canary, setCanary] = useState(10);
  const rows = [
    { ver: "v2.4.1-stable", target: "ESP32-WROOM", hash: "e3b0c442...b855", date: "Oct 24, 2023", status: "VERIFIED" },
    { ver: "v2.4.0-rc2", target: "ESP32-WROOM", hash: "8d969eef...6c92", date: "Oct 18, 2023", status: "ARCHIVED" },
    { ver: "v1.8.5-patch", target: "nRF52840", hash: "f2ca1bb6...0a22", date: "Sep 12, 2023", status: "VERIFIED" },
    { ver: "v2.5.0-beta (Untrusted)", target: "ESP32-S3", hash: "Mismatch", date: "Just now", status: "FAILED" },
    { ver: "v1.7.2-lts", target: "STM32F4", hash: "a3f1c88d...1d02", date: "Aug 5, 2023", status: "ARCHIVED" },
  ];
  const sc = (s: string) => ({ VERIFIED: "#69f6b8", ARCHIVED: "#a3aac4", FAILED: "#ff716c" }[s] || "#a3aac4");
  const si = (s: string) => ({ VERIFIED: "verified", ARCHIVED: "archive", FAILED: "warning" }[s] || "help");
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 12, padding: 18, flex: 1, overflow: "hidden" }}>
      {/* Firmware table */}
      <div style={{ background: "#091328", borderRadius: 2, border: "1px solid rgba(64,72,93,0.2)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #141f38", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
            <I n="inventory_2" sz={20} col="#a1faff" />
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: "1.05rem", color: "#dee5ff" }}>Firmware Repository</h2>
          </div>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", color: "#a3aac4" }}>Signed artifacts · ESP32 Fleet Alpha · nRF52840 Cluster Beta</p>
        </div>
        <div style={{ padding: "8px 16px", display: "flex", gap: 6, borderBottom: "1px solid rgba(64,72,93,0.15)", flexShrink: 0 }}>
          {["ALL","VERIFIED","FAILED","ARCHIVED"].map((f,i) => (
            <button key={f} style={{ padding: "3px 10px", borderRadius: 2, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.58rem", letterSpacing: "0.08em", cursor: "pointer", background: i===0 ? "rgba(161,250,255,0.1)" : "transparent", color: i===0 ? "#a1faff" : "#a3aac4", border: i===0 ? "1px solid rgba(161,250,255,0.28)" : "1px solid transparent", transition: "all 0.18s" }}>{f}</button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#091328" }}>
                {["VERSION","TARGET","CHECKSUM (SHA-256)","DATE","STATUS"].map((h,i) => (
                  <th key={h} style={{ padding: "10px 22px", textAlign: i===4?"right":"left", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", fontWeight: 400, color: "#a3aac4", letterSpacing: "0.1em", textTransform: "uppercase", position: "sticky", top: 0, background: "#091328" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={e => { Array.from(e.currentTarget.children).forEach((td: any) => td.style.background = "rgba(15,25,48,0.8)"); }}
                  onMouseLeave={e => { Array.from(e.currentTarget.children).forEach((td: any) => td.style.background = ""); }}>
                  <td style={{ padding: "13px 22px", fontWeight: 500, color: r.status==="FAILED" ? "#ff716c" : "#dee5ff", fontSize: "0.875rem", borderBottom: "1px solid rgba(64,72,93,0.1)" }}>{r.ver}</td>
                  <td style={{ padding: "13px 22px", borderBottom: "1px solid rgba(64,72,93,0.1)" }}>
                    <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 2, background: "#192540", color: "#c7d5ee", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem" }}>{r.target}</span>
                  </td>
                  <td style={{ padding: "13px 22px", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem", color: r.status==="FAILED"?"#d7383b":"#a3aac4", borderBottom: "1px solid rgba(64,72,93,0.1)" }}>{r.hash}</td>
                  <td style={{ padding: "13px 22px", color: "#a3aac4", fontSize: "0.875rem", borderBottom: "1px solid rgba(64,72,93,0.1)" }}>{r.date}</td>
                  <td style={{ padding: "13px 22px", textAlign: "right", borderBottom: "1px solid rgba(64,72,93,0.1)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: sc(r.status), fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem", fontWeight: 500 }}>
                      <I n={si(r.status)} sz={14} col={sc(r.status)} />{r.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Deployment config */}
      <div style={{ background: "#141f38", borderRadius: 4, border: "1px solid rgba(64,72,93,0.15)", padding: 22, display: "flex", flexDirection: "column", overflowY: "auto", boxShadow: "0 4px 24px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <I n="rocket_launch" sz={26} col="#a1faff" />
          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: "1.05rem", color: "#dee5ff" }}>Deployment Config</h3>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
          {/* Selects */}
          {[["TARGET PAYLOAD",["v2.4.1-stable (ESP32)","v1.8.5-patch (nRF52840)"]],["TARGET FLEET / CHIPSET",["Production — ESP32-WROOM","Staging — ESP32-WROOM","Alpha Testers — All Chipsets"]]].map(([label,opts]:any) => (
            <div key={label}>
              <label style={{ display: "block", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", color: "#a3aac4", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>{label}</label>
              <div style={{ position: "relative" }}>
                <select style={{ width: "100%", appearance: "none", background: "#000", border: "none", borderBottom: "2px solid rgba(64,72,93,0.5)", color: "#dee5ff", fontSize: "0.875rem", padding: "10px 32px 10px 12px", borderRadius: "2px 2px 0 0", cursor: "pointer", fontWeight: 500, fontFamily: "'Inter',sans-serif", outline: "none" }}>
                  {opts.map((o: string) => <option key={o}>{o}</option>)}
                </select>
                <I n="expand_more" sz={18} col="#a3aac4" />
              </div>
              {String(label).includes("FLEET") && (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                  <span style={{ fontSize: "0.72rem", color: "#a3aac4" }}>Estimated scope:</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", color: "#a1faff" }}>12,450 devices</span>
                </div>
              )}
            </div>
          ))}
          {/* Strategy */}
          <div>
            <label style={{ display: "block", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", color: "#a3aac4", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>ROLLOUT STRATEGY</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["phased","Phased (10%)","primary"],["immediate","Immediate (100%)","error"]].map(([val,label,t]) => (
                <label key={val} style={{ cursor: "pointer" }}>
                  <input type="radio" name="strat" style={{ display: "none" }} checked={strategy === val} onChange={() => { setStrategy(val as any); setCanary(val==="phased"?10:100); }} />
                  <div style={{ padding: "9px 12px", borderRadius: 2, textAlign: "center", fontSize: "0.875rem", cursor: "pointer", transition: "all 0.18s", border: `1px solid ${strategy===val ? (t==="primary"?"#a1faff":"#ff716c") : "rgba(64,72,93,0.3)"}`, color: strategy===val ? (t==="primary"?"#a1faff":"#ff716c") : "#a3aac4", background: strategy===val ? "#000" : "var(--g-low,#091328)" }}>{label}</div>
                </label>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", color: "#a3aac4" }}>Canary %</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", color: "#a1faff" }}>{canary}%</span>
              </div>
              <input type="range" min={1} max={100} value={canary} onChange={e => setCanary(Number(e.target.value))} style={{ width: "100%", accentColor: "#a1faff", cursor: "pointer" }} />
            </div>
          </div>
          {/* Warning */}
          <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(64,72,93,0.2)", padding: "10px 14px", borderRadius: 2, display: "flex", gap: 10, alignItems: "start" }}>
            <I n="info" sz={16} col="#c7d5ee" />
            <p style={{ fontSize: "0.72rem", color: "#a3aac4", lineHeight: 1.6 }}>Ensure firmware signatures match the root CA deployed on the selected chipset. Unsigned binaries will be rejected by the bootloader.</p>
          </div>
          {/* Button */}
          <button style={{ width: "100%", background: "linear-gradient(135deg,#a1faff,#00e5ee)", color: "#004346", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "1rem", padding: "13px 0", borderRadius: 2, border: "none", cursor: "pointer", letterSpacing: "0.06em", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.22s", boxShadow: "0 0 0 rgba(161,250,255,0)" }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 20px rgba(161,250,255,0.3)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 0 0 rgba(161,250,255,0)")}>
            INITIALIZE OTA PUSH <I n="send" sz={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   VIEW 4 — VERIFICATION PANEL
══════════════════════════════════════════════════════════════════ */
function VerificationView() {
  const [nodes, setNodes] = useState<NodeVerification[]>([
    { id: "ESP32-A142", ip: "192.168.1.42", status: "verifying",   progress: 85,  label: "VERIFYING HASH..." },
    { id: "ESP32-B091", ip: "192.168.1.91", status: "complete",    progress: 100, label: "SECURE REBOOT" },
    { id: "ESP32-C330", ip: "192.168.2.30", status: "decrypting",  progress: 42,  label: "AES DECRYPTION" },
    { id: "ESP32-D005", ip: "192.168.1.05", status: "error",       progress: 100, label: "HASH MISMATCH ERROR" },
    { id: "ESP32-E112", ip: "192.168.3.12", status: "downloading", progress: 12,  label: "DOWNLOADING PAYLOAD" },
  ]);

  useEffect(() => {
    const iv = setInterval(() => {
      setNodes(p => p.map(n => {
        if (n.status === "verifying" && n.progress < 99) return { ...n, progress: Math.min(99, n.progress + 0.8) };
        if (n.status === "downloading" && n.progress < 94) return { ...n, progress: Math.min(94, n.progress + 1.5) };
        if (n.status === "decrypting" && n.progress < 88) return { ...n, progress: Math.min(88, n.progress + 0.4) };
        return n;
      }));
    }, 350);
    return () => clearInterval(iv);
  }, []);

  const nc = (s: string) => ({ complete: "#69f6b8", verifying: "#a1faff", decrypting: "#c7d5ee", error: "#ff716c", downloading: "#a3aac4" }[s] || "#a3aac4");
  const bg = (s: string) => ({ complete: "#69f6b8", verifying: "linear-gradient(90deg,#a1faff,#00e5ee)", decrypting: "#c7d5ee", error: "#ff716c", downloading: "#192540" }[s] || "#192540");
  const cryptoLog = [
    { ts: "14:02:41.002", node: "SYS", text: "Initiating OTA Payload verification...", col: "#a1faff" },
    { ts: "14:02:41.045", node: "KEY", text: "Fetching public key from secure enclave... OK", col: "#c7d5ee" },
    { ts: "14:02:42.110", node: "NODE [ESP32-B091]", text: "Decryption complete. Generating SHA-256...", col: "#a1faff" },
    { ts: "", node: "", text: "Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", col: "#555", indent: true },
    { ts: "14:02:42.301", node: "NODE [ESP32-B091]", text: "Signature verification... MATCH (SECURE)", col: "#69f6b8" },
    { ts: "14:02:43.055", node: "NODE [ESP32-A142]", text: "Payload received (1.2MB).", col: "#a1faff" },
    { ts: "14:02:43.102", node: "NODE [ESP32-A142]", text: "Initializing AES-GCM engine... OK", col: "#a1faff" },
    { ts: "14:02:43.882", node: "NODE [ESP32-A142]", text: "Decrypting block [0x00 - 0xFF]...", col: "#a1faff" },
    { ts: "14:02:44.201", node: "NODE [ESP32-D005]", text: "FATAL_ERROR — Hash mismatch detected.", col: "#ff716c" },
    { ts: "", node: "", text: "Action: Aborting OTA. Locking bootloader.", col: "#d7383b", indent: true },
    { ts: "14:02:45.001", node: "NODE [ESP32-C330]", text: "Beginning decryption stream...", col: "#a1faff" },
  ];
  const aes = ["B0","B1","B2","B3","B4","B5","B6","B7"];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 12, padding: 18, flex: 1, overflow: "hidden" }}>
      {/* Left column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.45rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 10, color: "#dee5ff", marginBottom: 4 }}>
              <I n="satellite_alt" f sz={24} col="#a1faff" /> OTA Verification Panel
            </h1>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", color: "#a3aac4", letterSpacing: "0.14em", textTransform: "uppercase" }}>Target: ESP32_Fleet_Alpha // Mission Control View</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#0f1930", padding: "7px 14px", borderRadius: 2, border: "1px solid rgba(64,72,93,0.18)" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#69f6b8", animation: "gpulse 2.5s ease-in-out infinite" }} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", color: "#69f6b8", letterSpacing: "0.14em", textTransform: "uppercase" }}>Live Telemetry Active</span>
          </div>
        </div>
        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, flexShrink: 0 }}>
          {[
            { label: "Nodes in Flight", val: "1,204", sub: "/ 1,250", pct: 96, icon: "router", col: "#a1faff" },
            { label: "Hash Integrity", val: "99.8%", sub: "SHA-256 Passed", pct: 99.8, icon: "verified", col: "#69f6b8" },
            { label: "Decryption Rate", val: "45", sub: "AES-256-GCM nodes/sec", pct: 72, icon: "key", col: "#c7d5ee" },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(25,37,64,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(64,72,93,0.2)", borderRadius: 2, padding: 16, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${s.col}, transparent)`, opacity: 0.45 }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 10 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.58rem", color: "#a3aac4", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600 }}>{s.label}</span>
                <I n={s.icon} sz={18} col={s.col} />
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 8 }}>
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.8rem", fontWeight: 700, color: s.col }}>{s.val}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.62rem", color: "#a3aac4" }}>{s.sub}</span>
              </div>
              <div style={{ background: "#000", borderRadius: 2, height: 3, overflow: "hidden" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ duration: 1, delay: 0.3 }}
                  style={{ height: "100%", background: s.col, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
        {/* Node list */}
        <div style={{ background: "#091328", borderRadius: 2, border: "1px solid rgba(64,72,93,0.2)", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "13px 18px", borderBottom: "1px solid #141f38", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, background: "rgba(20,31,56,0.5)" }}>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "0.88rem", display: "flex", alignItems: "center", gap: 6, color: "#dee5ff" }}>
              <I n="data_table" sz={18} col="#a1faff" /> Deployment Telemetry
            </h2>
            <div style={{ display: "flex", gap: 6 }}>
              {["Filter: Active","Sort: Status"].map(t => (
                <span key={t} style={{ padding: "3px 8px", background: "#0f1930", border: "1px solid rgba(64,72,93,0.3)", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.56rem", color: "#a3aac4", borderRadius: 2, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {nodes.map(n => (
                <motion.div key={n.id} layout
                  style={{ padding: "13px 14px", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "space-between", background: n.status==="error" ? "rgba(159,5,25,0.08)" : "#0f1930", border: n.status==="error" ? "1px solid rgba(255,113,108,0.15)" : "1px solid transparent", borderLeft: n.status==="error" ? "3px solid #ff716c" : "3px solid transparent", transition: "background 0.15s", cursor: "default" }}>
                  {/* ID */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, width: "30%" }}>
                    <div style={{ width: 32, height: 32, background: "#000", border: `1px solid ${nc(n.status)}30`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <I n="memory" sz={16} col={nc(n.status)} />
                    </div>
                    <div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.8rem", fontWeight: 600, color: nc(n.status) }}>{n.id}</div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.56rem", color: "#a3aac4", letterSpacing: "0.1em", marginTop: 2 }}>IP: {n.ip}</div>
                    </div>
                  </div>
                  {/* Progress */}
                  <div style={{ flex: 1, padding: "0 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", marginBottom: 5 }}>
                      <span style={{ fontWeight: 600, color: nc(n.status) }}>{n.label}</span>
                      <span style={{ color: "#a3aac4" }}>{n.status==="error" ? "FAIL" : `${Math.round(n.progress)}%`}</span>
                    </div>
                    <div style={{ background: "#000", borderRadius: 2, height: 6, overflow: "hidden", border: "1px solid rgba(64,72,93,0.1)" }}>
                      <motion.div animate={{ width: `${n.progress}%` }} transition={{ duration: 0.5 }}
                        style={{ height: "100%", background: bg(n.status), borderRadius: 2, position: "relative", overflow: n.status==="verifying"?"hidden":undefined }}>
                        {n.status === "verifying" && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(45deg,transparent 25%,rgba(255,255,255,0.2) 50%,transparent 75%,transparent 100%)", backgroundSize: "20px 20px", animation: "stripSlide 1s linear infinite" }} />}
                      </motion.div>
                    </div>
                  </div>
                  {/* Status */}
                  <div style={{ width: 80, textAlign: "right", flexShrink: 0 }}>
                    {n.status === "complete" && <I n="gpp_good" f sz={22} col="#69f6b8" />}
                    {n.status === "error" && <I n="warning" sz={22} col="#ff716c" />}
                    {n.status === "verifying" && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.62rem", color: "#a1faff", animation: "scanBlink 1.5s step-end infinite" }}>Processing</span>}
                    {n.status === "decrypting" && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.62rem", color: "#c7d5ee" }}>Active</span>}
                    {n.status === "downloading" && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.62rem", color: "#a3aac4" }}>Transfer</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        {/* AES Engine */}
        <div style={{ background: "#091328", border: "1px solid #141f38", borderRadius: 2, padding: "14px 18px", display: "flex", alignItems: "center", gap: 24, flexShrink: 0 }}>
          <div style={{ flexShrink: 0 }}>
            <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: "#dee5ff", marginBottom: 3 }}>AES-256 Engine</h3>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.62rem", color: "#69f6b8" }}>STATUS: OPTIMAL</p>
          </div>
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 5 }}>
            {aes.map((b, i) => (
              <div key={b} style={{ height: 32, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", ...(i < 3 ? { border: "1px solid rgba(105,246,184,0.5)", background: "rgba(105,246,184,0.12)" } : i === 3 ? { border: "1px solid rgba(161,250,255,0.4)", background: "rgba(161,250,255,0.08)" } : { border: "1px solid rgba(64,72,93,0.3)", background: "rgba(15,25,48,0.5)" }) }}>
                {i < 3 && <div style={{ position: "absolute", inset: 0, background: "rgba(105,246,184,0.1)", animation: "pulse 2s ease-in-out infinite", animationDelay: `${i * 0.3}s` }} />}
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: i < 3 ? "#69f6b8" : i === 3 ? "#a1faff" : "#a3aac4", position: "relative", zIndex: 1 }}>{b}</span>
              </div>
            ))}
          </div>
          <div style={{ flexShrink: 0, textAlign: "right" }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.58rem", color: "#a3aac4", textTransform: "uppercase" }}>Key Slot: <span style={{ color: "#a1faff" }}>0x4F</span></div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.58rem", color: "#a3aac4", textTransform: "uppercase", marginTop: 4 }}>IV: <span style={{ color: "#dee5ff" }}>GENERATED</span></div>
          </div>
        </div>
      </div>
      {/* Right: Crypto log */}
      <div style={{ background: "#000", border: "1px solid rgba(64,72,93,0.2)", borderRadius: 2, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "inset 0 0 40px rgba(0,0,0,0.5)" }}>
        <div style={{ height: 36, background: "#1a1a1a", borderBottom: "1px solid #333", display: "flex", alignItems: "center", padding: "0 14px", justifyContent: "space-between", flexShrink: 0, position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: "#a1faff" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 8 }}>
            <I n="terminal" sz={13} col="#a1faff" />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.66rem", fontWeight: 600, letterSpacing: "0.14em", color: "#dee5ff" }}>CRYPTOGRAPHIC LOG</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:"#192540",border:"1px solid rgba(64,72,93,0.5)"}}/>)}</div>
        </div>
        <div style={{ flex: 1, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, lineHeight: 1.75, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          {cryptoLog.map((l, i) => (
            <div key={i} style={{ marginBottom: 3, paddingLeft: l.indent ? 16 : 0, wordBreak: "break-all" }}>
              {!l.indent && l.ts && <span style={{ color: "#555" }}>[{l.ts}]</span>}
              {l.node && <> <span style={{ color: l.col, fontWeight: l.col === "#ff716c" ? 700 : 500 }}>{l.node}:</span></>}
              {" "}<span style={{ color: l.indent ? l.col : "#a3aac4" }}>{l.text}</span>
            </div>
          ))}
          <div style={{ marginTop: 6 }}>
            <span style={{ color: "#a1faff", animation: "tblink 1s step-end infinite" }}>_</span>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes gpulse{0%,100%{transform:scale(1);opacity:.8;}50%{transform:scale(1.8);opacity:.3;}}
        @keyframes scanBlink{0%,100%{opacity:1;}50%{opacity:0.15;}}
        @keyframes stripSlide{0%{background-position:0 0;}100%{background-position:20px 0;}}
        @keyframes tblink{0%,100%{opacity:1;}50%{opacity:0;}}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ROOT EXPORT
══════════════════════════════════════════════════════════════════ */
export default function Dashboard({ onBackToLanding }: { onBackToLanding?: () => void }) {
  const [view, setView] = useState<View>("dashboard");
  const [fleet, setFleet] = useState<DeviceState[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const sim = Array.from({ length: 20 }, (_, i) => ({
      deviceId: `sim-${1001 + i}`, primary: i === 0,
      otaVersion: i < 3 ? "1.1.0" : "1.0.0",
      safetyState: "SAFE", ecuStates: { brake: "green", powertrain: "green", sensor: "green", infotainment: "green" },
      lastSeen: new Date().toISOString(), threatLevel: "LOW" as const,
      otaProgress: 0, signatureOk: true, integrityOk: true, tlsHealthy: true, rollbackArmed: true,
    }));
    setFleet(sim);
    const iv = setInterval(() => {
      setFleet(p => p.map(d => {
        const r = Math.random();
        return { ...d, lastSeen: new Date().toISOString(), safetyState: r < 0.03 ? "UNSAFE" : "SAFE", threatLevel: (r < 0.03 ? "HIGH" : r < 0.08 ? "MEDIUM" : "LOW") as "LOW"|"MEDIUM"|"HIGH" };
      }));
    }, 2200);
    // Try WS
    try {
      const ws = new WebSocket("ws://localhost:8080/ws/events");
      ws.onopen = () => setConnected(true);
      ws.onclose = () => setConnected(false);
      return () => { clearInterval(iv); ws.close(); };
    } catch { return () => clearInterval(iv); }
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", background: "#060e20", color: "#dee5ff", fontFamily: "'Inter',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* Ambient glow */}
      <div style={{ position: "fixed", top: "-20%", left: "12%", width: 700, height: 550, background: "radial-gradient(ellipse, rgba(161,250,255,0.04), transparent 70%)", pointerEvents: "none", zIndex: 0, borderRadius: "50%" }} />

      <SideNav view={view} setView={setView} onBack={onBackToLanding} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 }}>
        <TopBar connected={connected} />
        <AnimatePresence mode="wait">
          <motion.div key={view}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
            style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {view === "dashboard" && <DashboardView fleet={fleet} />}
            {view === "terminal" && <TerminalView />}
            {view === "updates" && <UpdatesView />}
            {view === "verification" && <VerificationView />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
