"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────
   DESIGN TOKENS — Obsidian Glass
───────────────────────────────────────────── */
const T = {
  /* Backgrounds */
  bg:        "#020617",
  surface:   "#060C1A",
  elevated:  "#0A1020",
  panel:     "#0F172A",
  card:      "#1A2338",
  /* Text */
  bone:      "#F8FAFC",
  boneDim:   "#E2E8F0",
  slate:     "#64748B",
  slateLt:   "#94A3B8",
  /* Accents */
  steel:     "#3B82F6",
  steelDim:  "rgba(59,130,246,0.15)",
  steelGlow: "rgba(59,130,246,0.35)",
  safe:      "#10B981",
  safeDim:   "rgba(16,185,129,0.15)",
  warn:      "#F59E0B",
  warnDim:   "rgba(245,158,11,0.15)",
  danger:    "#EF4444",
  dangerDim: "rgba(239,68,68,0.15)",
  /* Borders */
  border:    "rgba(248,250,252,0.06)",
  borderMid: "rgba(248,250,252,0.12)",
  borderHi:  "rgba(59,130,246,0.45)",
} as const;

/* ─────────────────────────────────────────────
   VIEW TYPES
───────────────────────────────────────────── */
type MainView = "home" | "carList" | "carDetail";

interface CarModel {
  id: string;
  name: string;
  subtitle: string;
  role: string;
  color: string;
  colorDim: string;
  specs: { label: string; value: string }[];
  software: { label: string; value: string }[];
}

const CARS: CarModel[] = [
  {
    id: "interceptor",
    name: "Interceptor",
    subtitle: "Performance Series",
    role: "High-velocity pursuit & rapid response with real-time OTA priority routing.",
    color: "#3B82F6",
    colorDim: "rgba(59,130,246,0.12)",
    specs: [
      { label: "Powertrain",   value: "Dual PMSM · 680 kW combined" },
      { label: "Platform",     value: "ESP32-S3 (Dual-core Xtensa LX7)" },
      { label: "CAN Bus",      value: "ISO 11898 · 1 Mbps" },
      { label: "OTA Channel",  value: "MQTTS:8883 · QoS 1" },
      { label: "ECU Nodes",    value: "Brake, Powertrain, Sensor, Infotainment" },
      { label: "Encryption",   value: "ECC P-256 + AES-256-GCM" },
    ],
    software: [
      { label: "Firmware",     value: "v2.4.1-stable" },
      { label: "Bootloader",   value: "v1.2.0" },
      { label: "mbedTLS",      value: "3.4.0" },
      { label: "FreeRTOS",     value: "10.5.1" },
    ],
  },
  {
    id: "sentinel",
    name: "Sentinel",
    subtitle: "Security Series",
    role: "Hardened perimeter protection with military-grade cryptographic stack and zero-trust update chain.",
    color: "#10B981",
    colorDim: "rgba(16,185,129,0.12)",
    specs: [
      { label: "Powertrain",   value: "Series-hybrid · 420 kW nominal" },
      { label: "Platform",     value: "ESP32-WROOM-32E + Secure Element" },
      { label: "CAN Bus",      value: "ISO 11898-2 · CAN-FD 5 Mbps" },
      { label: "OTA Channel",  value: "MQTTS:8883 · QoS 2 · mutual TLS" },
      { label: "ECU Nodes",    value: "Brake, Powertrain, Sensor, Infotainment, Arming" },
      { label: "Encryption",   value: "ECC P-384 + ChaCha20-Poly1305" },
    ],
    software: [
      { label: "Firmware",     value: "v2.4.1-stable" },
      { label: "Bootloader",   value: "v1.3.0-hardened" },
      { label: "mbedTLS",      value: "3.4.0" },
      { label: "FreeRTOS",     value: "10.5.1" },
    ],
  },
  {
    id: "voyager",
    name: "Voyager",
    subtitle: "Logistics Series",
    role: "Long-haul autonomous freight carrier optimised for fleet-wide canary rollout and telemetry density.",
    color: "#F59E0B",
    colorDim: "rgba(245,158,11,0.12)",
    specs: [
      { label: "Powertrain",   value: "Parallel-hybrid · 260 kW nominal" },
      { label: "Platform",     value: "ESP32-C6 (RISC-V + 802.11ax)" },
      { label: "CAN Bus",      value: "ISO 11898-3 · low-speed 125 kbps" },
      { label: "OTA Channel",  value: "MQTTS:8883 · QoS 1 · canary 10%" },
      { label: "ECU Nodes",    value: "Brake, Powertrain, Sensor, Cargo, Infotainment" },
      { label: "Encryption",   value: "ECC P-256 + SHA-256" },
    ],
    software: [
      { label: "Firmware",     value: "v2.3.9-stable" },
      { label: "Bootloader",   value: "v1.1.5" },
      { label: "mbedTLS",      value: "3.3.0" },
      { label: "FreeRTOS",     value: "10.4.6" },
    ],
  },
];

interface DeviceState {
  deviceId: string; primary: boolean; otaVersion: string;
  safetyState: string; ecuStates: Record<string, string>;
  lastSeen: string; threatLevel: "LOW"|"MEDIUM"|"HIGH";
  otaProgress: number; signatureOk: boolean; integrityOk: boolean;
  tlsHealthy: boolean; rollbackArmed: boolean;
}

/* ─────────────────────────────────────────────
   SHARED PRIMITIVES
───────────────────────────────────────────── */
function Mono({ children, size = "0.62rem", col = T.slateLt }: { children: React.ReactNode; size?: string; col?: string }) {
  return <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: size, color: col, letterSpacing: "0.05em" }}>{children}</span>;
}

function GlassCard({ children, style, onClick, accent }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void; accent?: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.surface,
        border: `1px solid ${hov ? (accent || T.borderHi) : T.border}`,
        borderRadius: 8,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: hov ? `0 0 0 1px ${accent || T.borderHi}, 0 8px 32px rgba(0,0,0,0.5)` : "0 1px 4px rgba(0,0,0,0.4)",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function StatusDot({ on }: { on: boolean }) {
  return <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: on ? T.safe : T.slate, marginRight: 6 }} />;
}

/* ─────────────────────────────────────────────
   3D CAR SVG MODELS
───────────────────────────────────────────── */
function InterceptorModel({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 280 140" style={{ width: "100%", maxHeight: 140 }}>
      <defs>
        <linearGradient id="i-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="i-roof" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.7" />
          <stop offset="100%" stopColor={color} stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="i-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#020617" stopOpacity="0" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {/* Ground shadow */}
      <ellipse cx="140" cy="128" rx="100" ry="8" fill="rgba(0,0,0,0.35)" />
      {/* Body — low, wide, aggressive */}
      <path d="M 28 95 L 40 68 L 70 58 L 100 52 L 140 50 L 175 52 L 210 60 L 240 72 L 252 95 Z" fill="url(#i-body)" />
      {/* Roof — sloped coupe */}
      <path d="M 80 68 L 95 42 L 155 36 L 195 42 L 215 58 L 80 68 Z" fill="url(#i-roof)" />
      <path d="M 80 68 L 95 42 L 155 36 L 195 42 L 215 58 L 80 68 Z" fill="url(#i-shadow)" />
      {/* Windshield */}
      <path d="M 88 66 L 100 43 L 150 37 L 155 65 Z" fill={`${color}30`} stroke={color} strokeWidth="1" strokeOpacity="0.5" />
      <path d="M 158 65 L 160 37 L 192 43 L 208 60 Z" fill={`${color}20`} stroke={color} strokeWidth="1" strokeOpacity="0.4" />
      {/* Wheels */}
      <circle cx="78" cy="97" r="22" fill={T.panel} stroke={T.border} strokeWidth="1.5" />
      <circle cx="78" cy="97" r="13" fill={T.elevated} stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx="78" cy="97" r="5" fill={color} fillOpacity="0.7" />
      <circle cx="202" cy="97" r="22" fill={T.panel} stroke={T.border} strokeWidth="1.5" />
      <circle cx="202" cy="97" r="13" fill={T.elevated} stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx="202" cy="97" r="5" fill={color} fillOpacity="0.7" />
      {/* LED strip */}
      <line x1="240" y1="72" x2="250" y2="82" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="246" y1="69" x2="254" y2="76" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
      {/* Door line */}
      <line x1="148" y1="52" x2="152" y2="95" stroke={color} strokeWidth="0.7" strokeOpacity="0.35" />
      {/* Splitter */}
      <path d="M 28 95 L 20 100 L 30 100 L 40 97" fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
      <path d="M 252 95 L 260 100 L 250 100 L 240 97" fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
    </svg>
  );
}

function SentinelModel({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 280 140" style={{ width: "100%", maxHeight: 140 }}>
      <defs>
        <linearGradient id="s-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.85" />
          <stop offset="100%" stopColor={color} stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="s-roof" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.65" />
          <stop offset="100%" stopColor={color} stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <ellipse cx="140" cy="128" rx="105" ry="7" fill="rgba(0,0,0,0.3)" />
      {/* Body — SUV profile */}
      <path d="M 22 92 L 30 62 L 55 50 L 90 46 L 190 46 L 225 50 L 250 62 L 258 92 Z" fill="url(#s-body)" />
      {/* Roof — tall, upright */}
      <path d="M 70 62 L 72 28 L 210 28 L 212 62 Z" fill="url(#s-roof)" />
      {/* Windshield */}
      <path d="M 78 60 L 82 30 L 135 28 L 135 60 Z" fill={`${color}28`} stroke={color} strokeWidth="1" strokeOpacity="0.45" />
      <path d="M 138 60 L 138 28 L 208 30 L 210 60 Z" fill={`${color}18`} stroke={color} strokeWidth="1" strokeOpacity="0.35" />
      {/* Wheels */}
      <circle cx="73" cy="95" r="24" fill={T.panel} stroke={T.border} strokeWidth="1.5" />
      <circle cx="73" cy="95" r="15" fill={T.elevated} stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx="73" cy="95" r="5" fill={color} fillOpacity="0.7" />
      <circle cx="207" cy="95" r="24" fill={T.panel} stroke={T.border} strokeWidth="1.5" />
      <circle cx="207" cy="95" r="15" fill={T.elevated} stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx="207" cy="95" r="5" fill={color} fillOpacity="0.7" />
      {/* Bull bar */}
      <rect x="248" y="58" width="12" height="26" rx="2" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
      <line x1="254" y1="62" x2="254" y2="80" stroke={color} strokeWidth="1.5" strokeOpacity="0.7" />
      {/* Armour panels */}
      <rect x="22" y="58" width="8" height="26" rx="1" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="0.8" strokeOpacity="0.4" />
      {/* Door */}
      <line x1="140" y1="46" x2="140" y2="92" stroke={color} strokeWidth="0.7" strokeOpacity="0.3" />
      {/* LED */}
      <rect x="250" y="56" width="6" height="4" rx="1" fill={color} fillOpacity="0.9" />
    </svg>
  );
}

function VoyagerModel({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 320 140" style={{ width: "100%", maxHeight: 140 }}>
      <defs>
        <linearGradient id="v-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <ellipse cx="160" cy="126" rx="125" ry="7" fill="rgba(0,0,0,0.3)" />
      {/* Cab */}
      <path d="M 20 90 L 28 52 L 60 40 L 100 38 L 110 40 L 112 90 Z" fill="url(#v-body)" />
      <path d="M 35 86 L 40 52 L 58 42 L 100 40 L 106 86 Z" fill={`${color}15`} stroke={color} strokeWidth="0.8" strokeOpacity="0.3" />
      {/* Windshield */}
      <path d="M 40 80 L 44 50 L 96 42 L 98 80 Z" fill={`${color}25`} stroke={color} strokeWidth="1" strokeOpacity="0.4" />
      {/* Cargo box */}
      <rect x="110" y="40" width="185" height="50" rx="3" fill={`${color}35`} stroke={color} strokeWidth="1" strokeOpacity="0.5" />
      <line x1="155" y1="40" x2="155" y2="90" stroke={color} strokeWidth="0.6" strokeOpacity="0.3" />
      <line x1="200" y1="40" x2="200" y2="90" stroke={color} strokeWidth="0.6" strokeOpacity="0.3" />
      <line x1="247" y1="40" x2="247" y2="90" stroke={color} strokeWidth="0.6" strokeOpacity="0.3" />
      {/* Cargo top stripe */}
      <rect x="110" y="40" width="185" height="6" rx="2" fill={color} fillOpacity="0.35" />
      {/* Wheels — 4 wheels for truck */}
      <circle cx="60" cy="94" r="20" fill={T.panel} stroke={T.border} strokeWidth="1.5" />
      <circle cx="60" cy="94" r="12" fill={T.elevated} stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx="60" cy="94" r="4" fill={color} fillOpacity="0.7" />
      <circle cx="168" cy="94" r="20" fill={T.panel} stroke={T.border} strokeWidth="1.5" />
      <circle cx="168" cy="94" r="12" fill={T.elevated} stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx="168" cy="94" r="4" fill={color} fillOpacity="0.7" />
      <circle cx="218" cy="94" r="20" fill={T.panel} stroke={T.border} strokeWidth="1.5" />
      <circle cx="218" cy="94" r="12" fill={T.elevated} stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx="218" cy="94" r="4" fill={color} fillOpacity="0.7" />
      {/* Exhaust */}
      <rect x="20" y="46" width="5" height="20" rx="2" fill={T.slate} />
      {/* LED bar */}
      <rect x="110" y="40" width="6" height="50" rx="1" fill={color} fillOpacity="0.5" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   TOP BAR
───────────────────────────────────────────── */
function TopBar({ connected, mainView }: { connected: boolean; mainView: string }) {
  const [clock, setClock] = useState("");
  useEffect(() => {
    setClock(new Date().toLocaleTimeString("en-US", { hour12: false }));
    const id = setInterval(() => setClock(new Date().toLocaleTimeString("en-US", { hour12: false })), 1000);
    return () => clearInterval(id);
  }, []);

  const breadcrumbs: Record<string, string> = {
    home:      "Fleet Overview",
    carList:   "Car Selection",
    carDetail: "System Integration Cockpit",
  };

  return (
    <header style={{ height: 52, background: T.bg, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0, zIndex: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: T.slate }}>GUARDIAN·OTA</span>
        <span style={{ color: T.border, margin: "0 4px" }}>›</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.15em", textTransform: "uppercase", color: T.slateLt }}>{breadcrumbs[mainView] || "—"}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", background: T.elevated, borderRadius: 2, border: `1px solid ${T.border}` }}>
          <StatusDot on={connected} />
          <Mono col={connected ? T.safe : T.slate}>{connected ? "LIVE" : "DEMO"}</Mono>
        </div>
        {clock && <Mono col={T.slate}>{clock}</Mono>}
        <button style={{ padding: "4px 12px", background: T.steelDim, color: T.steel, border: `1px solid ${T.steelGlow}`, borderRadius: 3, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>Emergency Stop</button>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────
   SIDEBAR NAV
───────────────────────────────────────────── */
function SideNav({ mainView, setMainView, onBack }: { mainView: MainView; setMainView: (v: MainView) => void; onBack?: () => void }) {
  const items = [
    { id: "home" as const,    icon: "⊞", label: "Dashboard" },
    { id: "carList" as const, icon: "⬡", label: "List Car Settings" },
  ];

  return (
    <aside style={{ width: 220, flexShrink: 0, background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* Logo */}
      <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 32, height: 32, background: T.steelDim, borderRadius: 4, border: `1px solid ${T.steelGlow}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 15, color: T.steel }}>◈</span>
          </div>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "0.82rem", color: T.bone, letterSpacing: "0.06em" }}>GUARDIAN</div>
            <Mono col={T.steel} size="0.52rem">OTA · PARIK-BSDK</Mono>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 8px", background: T.safeDim, borderRadius: 3, border: `1px solid rgba(16,185,129,0.2)` }}>
          <StatusDot on={true} />
          <Mono col={T.safe} size="0.55rem">SYSTEM · NOMINAL</Mono>
        </div>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ padding: "8px 8px 4px", marginBottom: 2 }}>
          <Mono col={T.slate} size="0.5rem">NAVIGATION</Mono>
        </div>
        {items.map(item => {
          const active = mainView === item.id || (mainView === "carDetail" && item.id === "carList");
          return (
            <div key={item.id} onClick={() => setMainView(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                borderRadius: 4, cursor: "pointer", transition: "all 0.15s",
                background: active ? T.elevated : "transparent",
                borderLeft: `2px solid ${active ? T.steel : "transparent"}`,
                color: active ? T.bone : T.slateLt,
                fontSize: "0.84rem",
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = T.elevated; e.currentTarget.style.color = T.boneDim; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.slateLt; } }}
            >
              <span style={{ fontSize: 14, color: active ? T.steel : T.slate }}>{item.icon}</span>
              <span>{item.label}</span>
              {active && <span style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: T.steel, flexShrink: 0 }} />}
            </div>
          );
        })}

        <div style={{ marginTop: 12, padding: "8px 8px 4px" }}>
          <Mono col={T.slate} size="0.5rem">SYSTEM</Mono>
        </div>
        {[{ icon: "◎", label: "Crypto Audit" }, { icon: "▣", label: "Fleet Telemetry" }].map(t => (
          <div key={t.label}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 4, cursor: "not-allowed", color: T.slate, fontSize: "0.84rem", opacity: 0.4 }}
          >
            <span style={{ fontSize: 14 }}>{t.icon}</span>
            <span>{t.label}</span>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div style={{ padding: "8px", borderTop: `1px solid ${T.border}` }}>
        {onBack && (
          <div onClick={onBack}
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", borderRadius: 4, cursor: "pointer", color: T.slate, fontSize: "0.78rem", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = T.elevated; e.currentTarget.style.color = T.slateLt; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.slate; }}
          >
            <span style={{ fontSize: 12 }}>←</span>
            <span>Landing Page</span>
          </div>
        )}
        <div style={{ padding: "8px 12px", marginTop: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.steelDim, border: `1px solid ${T.steelGlow}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 12, color: T.steel }}>◈</span>
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", color: T.boneDim }}>Admin</div>
              <Mono col={T.slate} size="0.52rem">FULL ACCESS</Mono>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────
   HOME / DASHBOARD VIEW
───────────────────────────────────────────── */
function HomeView({ fleet }: { fleet: DeviceState[] }) {
  const high = fleet.filter(d => d.threatLevel === "HIGH").length;
  const safe = fleet.filter(d => d.safetyState === "SAFE").length;

  const kpis = [
    { label: "Active Devices",     value: String(fleet.length || 20),    sub: `${safe || 19} ONLINE`,   icon: "◈", col: T.bone },
    { label: "Threat Level",       value: high > 2 ? "HIGH" : "LOW",     sub: `${high} FLAGGED`,        icon: "⬡", col: high > 2 ? T.danger : T.safe },
    { label: "Update Success",     value: "98.2%",                        sub: "+1.4% this epoch",       icon: "◎", col: T.steel },
    { label: "Firmware Version",   value: "v2.4.1",                       sub: "3 vehicles staged",      icon: "▣", col: T.warn },
  ];

  const events = [
    { type: "FW_PUSH",     col: T.steel,  msg: "Payload v2.4.1 delivered to NODE_77.",       time: "JUST NOW" },
    { type: "CRYPTO_OK",   col: T.safe,   msg: "Bootloader signature valid on Cluster Beta.", time: "2M AGO" },
    { type: "ROLLBACK",    col: T.danger, msg: "NODE_44 auto-rolled back to v1.8.5.",          time: "3H AGO" },
    { type: "HEALTH_CHECK",col: T.slateLt,msg: "Fleet-wide health check passed.",              time: "15M AGO" },
    { type: "KEY_ROTATE",  col: T.warn,   msg: "ECC key rotation scheduled for 03:00 UTC.",   time: "1H AGO" },
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.4rem", fontWeight: 600, color: T.bone, letterSpacing: "0.04em", margin: 0 }}>Fleet Overview</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          <StatusDot on={true} />
          <Mono col={T.slate}>SYSTEM.STATE = NOMINAL_OPERATION</Mono>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        {kpis.map((k, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <GlassCard accent={k.col} style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                <Mono col={T.slate} size="0.55rem">{k.label}</Mono>
                <span style={{ fontSize: 14, color: k.col }}>{k.icon}</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.6rem", fontWeight: 700, color: k.col, lineHeight: 1, marginBottom: 4 }}>{k.value}</div>
              <Mono col={T.slate} size="0.58rem">{k.sub}</Mono>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Fleet status + Recent activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 10, marginBottom: 16 }}>
        {/* Fleet grid */}
        <GlassCard style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Mono col={T.bone} size="0.72rem">LIVE FLEET NODES</Mono>
            <Mono col={T.slate} size="0.55rem">{fleet.length} DEVICES · AUTO-REFRESH 2.2s</Mono>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, maxHeight: 280, overflowY: "auto" }}>
            {fleet.slice(0, 20).map((d, i) => (
              <div key={d.deviceId} style={{ padding: "10px 12px", borderRight: i % 4 !== 3 ? `1px solid ${T.border}` : "none", borderBottom: `1px solid ${T.border}`, transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = T.elevated}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <Mono col={T.bone} size="0.6rem">{d.deviceId.replace("sim-", "N-")}</Mono>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: d.threatLevel === "HIGH" ? T.danger : d.threatLevel === "MEDIUM" ? T.warn : T.safe, flexShrink: 0, display: "inline-block" }} />
                </div>
                <Mono col={T.slate} size="0.52rem">{d.safetyState}</Mono>
                <div style={{ marginTop: 4, height: 2, background: T.border, borderRadius: 1 }}>
                  <div style={{ height: "100%", background: d.threatLevel === "HIGH" ? T.danger : T.steel, borderRadius: 1, width: d.threatLevel === "HIGH" ? "100%" : "30%" }} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Recent activity */}
        <GlassCard style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
            <Mono col={T.bone} size="0.72rem">RECENT ACTIVITY</Mono>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
            {events.map((e, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                <div style={{ padding: "8px 10px", background: T.elevated, borderRadius: 4, borderLeft: `2px solid ${e.col}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem", background: `${e.col}18`, color: e.col, padding: "1px 6px", borderRadius: 2 }}>{e.type}</span>
                    <Mono col={T.slate} size="0.5rem">{e.time}</Mono>
                  </div>
                  <p style={{ fontSize: "0.72rem", color: T.boneDim, margin: 0, lineHeight: 1.4 }}>{e.msg}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Bottom stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {[
          { label: "Avg OTA Duration", value: "4.2s",  sub: "−0.8s from last epoch",    col: T.steel },
          { label: "Signature Fails",  value: String(high), sub: "Last 24 hours",        col: high > 0 ? T.danger : T.safe },
          { label: "Rollback Events",  value: "1",      sub: "NODE_44 · 3h ago",         col: T.warn },
        ].map((s, i) => (
          <GlassCard key={i} accent={s.col} style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.5rem", fontWeight: 700, color: s.col, minWidth: 40 }}>{s.value}</div>
            <div>
              <div style={{ fontSize: "0.76rem", color: T.boneDim, marginBottom: 2 }}>{s.label}</div>
              <Mono col={T.slate} size="0.56rem">{s.sub}</Mono>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CAR LIST VIEW
───────────────────────────────────────────── */
function CarListView({ onSelectCar }: { onSelectCar: (car: CarModel) => void }) {
  const ModelComponents: Record<string, (p: { color: string }) => JSX.Element> = {
    interceptor: InterceptorModel,
    sentinel:    SentinelModel,
    voyager:     VoyagerModel,
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <Mono col={T.slate} size="0.58rem">03 · VEHICLE REGISTRY</Mono>
        <h2 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.4rem", fontWeight: 600, color: T.bone, letterSpacing: "0.04em", margin: "6px 0 8px" }}>Car Selection</h2>
        <p style={{ fontSize: "0.82rem", color: T.slate, margin: 0, maxWidth: 520 }}>
          Select a vehicle platform to access its system integration cockpit, security controls, and OTA deployment pipeline.
        </p>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        {CARS.map((car, i) => {
          const Model = ModelComponents[car.id];
          return (
            <motion.div key={car.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <GlassCard accent={car.color} style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {/* Color accent top */}
                <div style={{ height: 2, background: car.color, opacity: 0.6 }} />

                {/* Status bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: `1px solid ${T.border}` }}>
                  <Mono col={car.color} size="0.55rem">SER-{car.id.toUpperCase().slice(0, 3)}-001</Mono>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 7px", background: car.colorDim, borderRadius: 2, border: `1px solid ${car.color}30` }}>
                    <StatusDot on={true} />
                    <Mono col={car.color} size="0.5rem">ONLINE</Mono>
                  </div>
                </div>

                {/* 3D Model */}
                <div style={{ padding: "16px 12px 8px", background: T.elevated }}>
                  <Model color={car.color} />
                </div>

                {/* Car info */}
                <div style={{ padding: "14px 16px", flex: 1 }}>
                  <div style={{ marginBottom: 10 }}>
                    <h3 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.05rem", fontWeight: 700, color: T.bone, letterSpacing: "0.06em", margin: "0 0 3px" }}>{car.name.toUpperCase()}</h3>
                    <Mono col={car.color} size="0.6rem">{car.subtitle.toUpperCase()}</Mono>
                  </div>
                  <p style={{ fontSize: "0.76rem", color: T.slate, lineHeight: 1.6, margin: "0 0 14px" }}>{car.role}</p>

                  {/* Quick specs */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
                    {car.software.slice(0, 2).map((s, si) => (
                      <div key={si} style={{ padding: "6px 8px", background: T.elevated, borderRadius: 3, border: `1px solid ${T.border}` }}>
                        <Mono col={T.slate} size="0.5rem">{s.label}</Mono>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.62rem", color: T.bone, marginTop: 2 }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <button onClick={() => onSelectCar(car)}
                    style={{
                      width: "100%", padding: "10px 0", background: car.colorDim,
                      color: car.color, border: `1px solid ${car.color}50`,
                      borderRadius: 4, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em",
                      textTransform: "uppercase", transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${car.color}28`; e.currentTarget.style.borderColor = car.color; e.currentTarget.style.color = T.bone; }}
                    onMouseLeave={e => { e.currentTarget.style.background = car.colorDim; e.currentTarget.style.borderColor = `${car.color}50`; e.currentTarget.style.color = car.color; }}
                  >
                    {car.name} →
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   VERIFICATION SIMULATION OVERLAY
───────────────────────────────────────────── */
function VerificationOverlay({ onClose, car }: { onClose: () => void; car: CarModel }) {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);

  const phases = [
    { label: "INITIALIZING CRYPTO ENGINE", col: T.warn,   detail: "Loading ECC P-256 keypair from secure enclave..." },
    { label: "VERIFYING SIGNATURE CHAIN",  col: T.warn,   detail: "Validating ECDSA signature against embedded public key..." },
    { label: "SHA-256 HASH CHECK",         col: T.steel,  detail: "Computing firmware digest and comparing against manifest..." },
    { label: "TLS HANDSHAKE VALIDATION",   col: T.steel,  detail: "Verifying mutual TLS certificate chain to MQTTS broker..." },
    { label: "SAFETY GATE QUERY",          col: T.safe,   detail: "Polling brake ECU for SAFE/UNSAFE state — result: SAFE." },
    { label: "UPDATE CHAIN VERIFIED",      col: T.safe,   detail: "All cryptographic gates passed. Deployment approved." },
  ];

  useEffect(() => {
    const intervals: ReturnType<typeof setInterval>[] = [];
    let p = 0;
    const tick = setInterval(() => {
      p += 1.8;
      setProgress(Math.min(p, 100));
      const phaseIdx = Math.floor((p / 100) * phases.length);
      setPhase(Math.min(phaseIdx, phases.length - 1));
      if (p >= 100) clearInterval(tick);
    }, 80);
    intervals.push(tick);
    return () => intervals.forEach(clearInterval);
  }, []);

  const currentPhase = phases[phase];
  const done = progress >= 100;

  const streamNodes = Array.from({ length: 8 }, (_, i) => ({ id: i, done: i < Math.floor(phase + 1) }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.88)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
        style={{ width: 560, background: T.surface, borderRadius: 8, border: `1px solid ${done ? T.safe : T.steel}40`, overflow: "hidden", boxShadow: `0 0 60px ${done ? T.safeDim : T.steelDim}` }}
      >
        {/* Header */}
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.elevated }}>
          <div>
            <Mono col={done ? T.safe : T.steel} size="0.65rem">VERIFICATION SIMULATION · {car.name.toUpperCase()}</Mono>
          </div>
          {done && <button onClick={onClose} style={{ background: T.safeDim, color: T.safe, border: `1px solid ${T.safe}40`, borderRadius: 3, padding: "4px 12px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem" }}>CLOSE ✓</button>}
        </div>

        {/* Data stream visualization */}
        <div style={{ padding: "20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 16 }}>
            {streamNodes.map((n, i) => (
              <div key={n.id} style={{ display: "flex", alignItems: "center" }}>
                <motion.div
                  animate={{ background: n.done ? T.safe : T.danger, boxShadow: n.done ? `0 0 8px ${T.safe}` : `0 0 8px ${T.danger}` }}
                  transition={{ duration: 0.4 }}
                  style={{ width: 28, height: 28, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: T.bone, fontFamily: "monospace", border: `1px solid ${n.done ? T.safe : T.danger}60`, flexShrink: 0 }}
                >
                  {n.done ? "✓" : String(n.id).padStart(2, "0")}
                </motion.div>
                {i < streamNodes.length - 1 && (
                  <motion.div animate={{ background: n.done ? T.safe : T.border }} transition={{ duration: 0.3, delay: 0.1 }}
                    style={{ width: 32, height: 2, flexShrink: 0 }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
            <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.1 }}
              style={{ height: "100%", background: done ? T.safe : T.steel, borderRadius: 3 }}
            />
          </div>

          {/* Current phase */}
          <div style={{ padding: "10px 14px", background: T.elevated, borderRadius: 4, borderLeft: `3px solid ${currentPhase.col}` }}>
            <Mono col={currentPhase.col} size="0.62rem">{currentPhase.label}</Mono>
            <p style={{ fontSize: "0.73rem", color: T.slate, margin: "4px 0 0", lineHeight: 1.5 }}>{currentPhase.detail}</p>
          </div>
        </div>

        {/* Log stream */}
        <div style={{ padding: "12px 20px", maxHeight: 180, overflowY: "auto" }}>
          <AnimatePresence>
            {phases.slice(0, phase + 1).map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}
              >
                <span style={{ fontFamily: "monospace", fontSize: 11, color: p.col, flexShrink: 0 }}>[{String(i).padStart(2, "0")}]</span>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: T.slate }}>{p.detail}</span>
                <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: 11, color: p.col, flexShrink: 0 }}>OK</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer status */}
        <div style={{ padding: "10px 20px", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10, background: done ? T.safeDim : "transparent" }}>
          <StatusDot on={done} />
          <Mono col={done ? T.safe : T.slateLt} size="0.62rem">
            {done ? "ALL GATES PASSED · DEPLOYMENT APPROVED · ENCRYPTION CHAIN INTACT" : `${Math.round(progress)}% COMPLETE · SCANNING...`}
          </Mono>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CAR DETAIL VIEW
───────────────────────────────────────────── */
function CarDetailView({ car, onBack, fleet }: { car: CarModel; onBack: () => void; fleet: DeviceState[] }) {
  const [encEnabled, setEncEnabled] = useState(true);
  const [showEncMenu, setShowEncMenu] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [deployStatus, setDeployStatus] = useState<"idle" | "pushing" | "success" | "error">("idle");
  const [canary, setCanary] = useState(20);
  const [version, setVersion] = useState("v2.5.0-beta");
  const [firmwareUrl, setFirmwareUrl] = useState("https://firmware.example/esp32.bin");
  const [firmwareHash, setFirmwareHash] = useState("");
  const [pickedFile, setPickedFile] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const ModelComponents: Record<string, (p: { color: string }) => JSX.Element> = {
    interceptor: InterceptorModel,
    sentinel:    SentinelModel,
    voyager:     VoyagerModel,
  };
  const Model = ModelComponents[car.id];

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      setPickedFile(f.name);
      setVersion("v2.5.0-local");
      const hash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      setFirmwareHash(hash);
    }
  }

  async function handleDeploy() {
    if (!version || !firmwareUrl) return;
    setDeployStatus("pushing");
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ version, firmwareUrl, firmwareHash: firmwareHash || "placeholder", signatureB64: "SIM_SIG", canaryPercent: canary }),
      });
      setDeployStatus(res.ok ? "success" : "error");
    } catch {
      setDeployStatus("success"); // demo mode
    }
    setTimeout(() => setDeployStatus("idle"), 3500);
  }

  const btnColors: Record<typeof deployStatus, string> = { idle: T.steel, pushing: T.warn, success: T.safe, error: T.danger };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
      {showVerify && <VerificationOverlay car={car} onClose={() => setShowVerify(false)} />}

      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={onBack}
          style={{ padding: "6px 12px", background: T.elevated, color: T.slateLt, border: `1px solid ${T.border}`, borderRadius: 4, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderMid; e.currentTarget.style.color = T.bone; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.slateLt; }}
        >← BACK</button>
        <div style={{ height: 1, width: 20, background: T.border }} />
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.2rem", fontWeight: 700, color: car.color, letterSpacing: "0.06em" }}>{car.name.toUpperCase()}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.62rem", color: T.slate }}>·</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", color: T.bone, letterSpacing: "0.04em" }}>System Integration Cockpit</span>
          </div>
          <Mono col={T.slate} size="0.56rem">{car.subtitle.toUpperCase()} · {car.role.slice(0, 60)}...</Mono>
        </div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* 3D model + specs */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <GlassCard accent={car.color} style={{ overflow: "hidden" }}>
              <div style={{ height: 2, background: car.color, opacity: 0.5 }} />
              <div style={{ padding: "14px 12px 6px", background: T.elevated }}>
                <Model color={car.color} />
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Mono col={car.color} size="0.64rem">VEHICLE SPECIFICATIONS</Mono>
                  <span style={{ padding: "2px 8px", background: car.colorDim, color: car.color, borderRadius: 2, fontFamily: "monospace", fontSize: 10, border: `1px solid ${car.color}30` }}>§01</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {car.specs.map((s, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: "0.72rem", color: T.slate, fontWeight: 500 }}>{s.label}</span>
                      <Mono col={T.boneDim} size="0.67rem">{s.value}</Mono>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                  <Mono col={car.color} size="0.6rem">SOFTWARE VERSIONING</Mono>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
                    {car.software.map((s, i) => (
                      <div key={i} style={{ padding: "7px 10px", background: T.elevated, borderRadius: 3, border: `1px solid ${T.border}` }}>
                        <Mono col={T.slate} size="0.5rem">{s.label}</Mono>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem", color: T.bone, marginTop: 2 }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Security settings panel */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <GlassCard accent={T.safe} style={{ overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Mono col={T.safe} size="0.64rem">§02 · SECURITY SETTINGS PANEL</Mono>
                <span style={{ padding: "2px 8px", background: T.safeDim, color: T.safe, borderRadius: 2, fontFamily: "monospace", fontSize: 10, border: `1px solid rgba(16,185,129,0.2)` }}>ARMED</span>
              </div>
              <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Encryption Gate button */}
                <div>
                  <button onClick={() => setShowEncMenu(v => !v)}
                    style={{ width: "100%", padding: "10px 14px", background: showEncMenu ? T.steelDim : T.elevated, color: showEncMenu ? T.bone : T.slateLt, border: `1px solid ${showEncMenu ? T.borderHi : T.border}`, borderRadius: 4, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.66rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", transition: "all 0.2s", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    onMouseEnter={e => { if (!showEncMenu) { e.currentTarget.style.borderColor = T.borderMid; e.currentTarget.style.color = T.bone; } }}
                    onMouseLeave={e => { if (!showEncMenu) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.slateLt; } }}
                  >
                    <span>⬡ Encryption Gate</span>
                    <span style={{ color: T.steel, fontSize: "0.7rem" }}>{showEncMenu ? "▲" : "▼"}</span>
                  </button>
                  <AnimatePresence>
                    {showEncMenu && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{ padding: "12px 14px", background: T.elevated, borderRadius: "0 0 4px 4px", border: `1px solid ${T.border}`, borderTop: "none", marginTop: -1 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                            <div>
                              <div style={{ fontSize: "0.8rem", color: T.bone, fontWeight: 500, marginBottom: 2 }}>Payload Encryption</div>
                              <Mono col={T.slate} size="0.58rem">ECC P-256 + AES-256-GCM pipeline</Mono>
                            </div>
                            <div onClick={() => setEncEnabled(v => !v)}
                              style={{ width: 42, height: 22, borderRadius: 11, background: encEnabled ? T.safeDim : T.border, border: `1px solid ${encEnabled ? T.safe : T.borderMid}`, position: "relative", cursor: "pointer", transition: "all 0.25s", padding: "2px 3px", display: "flex", alignItems: "center" }}
                            >
                              <div style={{ width: 16, height: 16, borderRadius: "50%", background: encEnabled ? T.safe : T.slate, transform: encEnabled ? "translateX(20px)" : "translateX(0)", transition: "transform 0.25s, background 0.25s" }} />
                            </div>
                          </div>
                          {[
                            { label: "Key Algorithm",  value: "ECC P-256" },
                            { label: "Cipher Suite",   value: "AES-256-GCM" },
                            { label: "MAC",            value: "HMAC-SHA256" },
                            { label: "Key Rotation",   value: "Every 30 days" },
                          ].map((row, ri) => (
                            <div key={ri} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${T.border}` }}>
                              <Mono col={T.slate} size="0.58rem">{row.label}</Mono>
                              <Mono col={encEnabled ? T.boneDim : T.slate} size="0.58rem">{row.value}</Mono>
                            </div>
                          ))}
                          <div style={{ marginTop: 8, padding: "5px 8px", background: encEnabled ? T.safeDim : T.dangerDim, borderRadius: 3, border: `1px solid ${encEnabled ? T.safe : T.danger}30` }}>
                            <Mono col={encEnabled ? T.safe : T.danger} size="0.58rem">
                              {encEnabled ? "✓ Encryption ENABLED — all OTA payloads will be encrypted" : "⚠ Encryption DISABLED — transmitting plaintext (dev mode only)"}
                            </Mono>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Verification button */}
                <button onClick={() => setShowVerify(true)}
                  style={{ width: "100%", padding: "10px 14px", background: T.elevated, color: T.slateLt, border: `1px solid ${T.border}`, borderRadius: 4, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.66rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", transition: "all 0.2s", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.steelGlow; e.currentTarget.style.color = T.bone; e.currentTarget.style.background = T.steelDim; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.slateLt; e.currentTarget.style.background = T.elevated; }}
                >
                  <span>◎ Run Verification Simulation</span>
                  <span style={{ fontSize: "0.58rem", color: T.slate }}>DUMMY SIM ▶</span>
                </button>

                {/* Security indicators */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 4 }}>
                  {[
                    { label: "Signature OK",    on: true },
                    { label: "Integrity OK",    on: true },
                    { label: "TLS Healthy",     on: true },
                    { label: "Rollback Armed",  on: true },
                  ].map((ind, ii) => (
                    <div key={ii} style={{ padding: "6px 10px", background: T.elevated, borderRadius: 3, border: `1px solid ${ind.on ? "rgba(16,185,129,0.2)" : T.border}`, display: "flex", alignItems: "center", gap: 6 }}>
                      <StatusDot on={ind.on} />
                      <Mono col={ind.on ? T.safe : T.slate} size="0.57rem">{ind.label}</Mono>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* RIGHT COLUMN — OTA Deployment */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <GlassCard accent={T.steel} style={{ overflow: "hidden", height: "100%" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Mono col={T.steel} size="0.64rem">§03 · UPDATE & PUSH CONTROL</Mono>
              <span style={{ padding: "2px 8px", background: T.steelDim, color: T.steel, borderRadius: 2, fontFamily: "monospace", fontSize: 10, border: `1px solid ${T.steelGlow}30` }}>OTA ENGINE</span>
            </div>

            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
              {/* File picker / dropzone */}
              <div>
                <Mono col={T.slate} size="0.58rem">FIRMWARE BINARY</Mono>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{ marginTop: 6, padding: "16px", border: `1px dashed ${pickedFile ? T.safe : T.borderMid}`, borderRadius: 6, cursor: "pointer", textAlign: "center", background: pickedFile ? T.safeDim : "transparent", transition: "all 0.2s" }}
                  onMouseEnter={e => { if (!pickedFile) { e.currentTarget.style.borderColor = T.steel; e.currentTarget.style.background = T.steelDim; } }}
                  onMouseLeave={e => { if (!pickedFile) { e.currentTarget.style.borderColor = T.borderMid; e.currentTarget.style.background = "transparent"; } }}
                >
                  <input ref={fileRef} type="file" accept=".bin,.hex,.elf" style={{ display: "none" }} onChange={handleFilePick} />
                  {pickedFile ? (
                    <>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>✓</div>
                      <Mono col={T.safe} size="0.65rem">{pickedFile}</Mono>
                      <div style={{ marginTop: 3 }}><Mono col={T.slate} size="0.55rem">READY TO PUSH</Mono></div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 22, color: T.slate, marginBottom: 4 }}>⊕</div>
                      <div style={{ fontSize: "0.75rem", color: T.slate, marginBottom: 2 }}>Drop .bin / .hex / .elf here</div>
                      <Mono col={T.steel} size="0.58rem">or click to browse folders</Mono>
                    </>
                  )}
                </div>
              </div>

              {/* Version input */}
              <div>
                <Mono col={T.slate} size="0.58rem">FIRMWARE VERSION</Mono>
                <input value={version} onChange={e => setVersion(e.target.value)}
                  style={{ width: "100%", marginTop: 5, padding: "8px 10px", background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 4, color: T.bone, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                  onFocus={e => e.currentTarget.style.borderColor = T.borderHi}
                  onBlur={e => e.currentTarget.style.borderColor = T.border}
                  placeholder="e.g. v2.5.0-beta"
                />
              </div>

              {/* Firmware URL */}
              <div>
                <Mono col={T.slate} size="0.58rem">FIRMWARE URL (MINIO ENDPOINT)</Mono>
                <input value={firmwareUrl} onChange={e => setFirmwareUrl(e.target.value)}
                  style={{ width: "100%", marginTop: 5, padding: "8px 10px", background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 4, color: T.bone, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                  onFocus={e => e.currentTarget.style.borderColor = T.borderHi}
                  onBlur={e => e.currentTarget.style.borderColor = T.border}
                  placeholder="https://minio.local/firmware/esp32.bin"
                />
              </div>

              {/* Canary % */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <Mono col={T.slate} size="0.58rem">CANARY ROLLOUT</Mono>
                  <Mono col={T.steel} size="0.62rem">{canary}% of fleet</Mono>
                </div>
                <input type="range" min={1} max={100} value={canary} onChange={e => setCanary(Number(e.target.value))}
                  style={{ width: "100%", accentColor: T.steel, cursor: "pointer" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                  <Mono col={T.slate} size="0.52rem">1% (safest)</Mono>
                  <Mono col={T.slate} size="0.52rem">100% (full fleet)</Mono>
                </div>
              </div>

              {/* Targets preview */}
              <div style={{ padding: "10px 12px", background: T.elevated, borderRadius: 4, border: `1px solid ${T.border}` }}>
                <Mono col={T.slate} size="0.58rem">ESTIMATED TARGETS</Mono>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                  {fleet.slice(0, Math.max(1, Math.floor(fleet.length * canary / 100))).slice(0, 8).map(d => (
                    <span key={d.deviceId} style={{ padding: "2px 6px", background: T.steelDim, color: T.steel, borderRadius: 2, fontFamily: "monospace", fontSize: 10, border: `1px solid ${T.steel}20` }}>
                      {d.deviceId.replace("sim-", "N-")}
                    </span>
                  ))}
                  {fleet.length * canary / 100 > 8 && (
                    <span style={{ padding: "2px 6px", background: T.elevated, color: T.slate, borderRadius: 2, fontFamily: "monospace", fontSize: 10 }}>
                      +{Math.floor(fleet.length * canary / 100) - 8} more
                    </span>
                  )}
                </div>
              </div>

              {/* Safety gate notice */}
              <div style={{ padding: "8px 12px", background: T.safeDim, borderRadius: 4, border: `1px solid rgba(16,185,129,0.2)`, display: "flex", alignItems: "center", gap: 8 }}>
                <StatusDot on={true} />
                <Mono col={T.safe} size="0.6rem">BRAKE ECU SAFE · UPDATE GATE OPEN</Mono>
              </div>

              {/* Deploy button */}
              <button onClick={handleDeploy} disabled={deployStatus === "pushing" || !version || !firmwareUrl}
                style={{
                  width: "100%", padding: "12px 0",
                  background: `${btnColors[deployStatus]}18`,
                  color: btnColors[deployStatus],
                  border: `1px solid ${btnColors[deployStatus]}50`,
                  borderRadius: 5, cursor: deployStatus === "pushing" ? "wait" : "pointer",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem",
                  fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                  transition: "all 0.25s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
                onMouseEnter={e => { if (deployStatus === "idle") { e.currentTarget.style.background = `${T.steel}28`; e.currentTarget.style.borderColor = T.steel; e.currentTarget.style.color = T.bone; } }}
                onMouseLeave={e => { if (deployStatus === "idle") { e.currentTarget.style.background = `${T.steel}18`; e.currentTarget.style.borderColor = `${T.steel}50`; e.currentTarget.style.color = T.steel; } }}
              >
                {deployStatus === "idle"    && <><span>⊕</span><span>Push Update to {car.name}</span></>}
                {deployStatus === "pushing" && <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>◎</span><span>Pushing...</span></>}
                {deployStatus === "success" && <><span>✓</span><span>Deployment Queued</span></>}
                {deployStatus === "error"   && <><span>✕</span><span>Deployment Failed</span></>}
              </button>

              {/* Rollback note */}
              <Mono col={T.slate} size="0.55rem">
                Auto-rollback armed via esp_ota_mark_app_invalid_rollback_and_reboot on health-check failure.
              </Mono>
            </div>
          </GlassCard>
        </motion.div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT DASHBOARD COMPONENT
───────────────────────────────────────────── */
export default function Dashboard({ onBackToLanding }: { onBackToLanding?: () => void }) {
  const [mainView, setMainView]    = useState<MainView>("home");
  const [selectedCar, setSelectedCar] = useState<CarModel | null>(null);
  const [fleet, setFleet]          = useState<DeviceState[]>([]);
  const [connected, setConnected]  = useState(false);

  // Fleet simulation
  useEffect(() => {
    const sim = Array.from({ length: 20 }, (_, i) => ({
      deviceId: `sim-${1001 + i}`, primary: i === 0,
      otaVersion: i < 3 ? "1.1.0" : "1.0.0",
      safetyState: "SAFE",
      ecuStates: { brake: "green", powertrain: "green", sensor: "green", infotainment: "green" },
      lastSeen: new Date().toISOString(),
      threatLevel: "LOW" as const,
      otaProgress: 0, signatureOk: true, integrityOk: true, tlsHealthy: true, rollbackArmed: true,
    }));
    setFleet(sim);
    const iv = setInterval(() => {
      setFleet(p => p.map(d => {
        const r = Math.random();
        return { ...d, lastSeen: new Date().toISOString(), safetyState: r < 0.03 ? "UNSAFE" : "SAFE", threatLevel: (r < 0.03 ? "HIGH" : r < 0.08 ? "MEDIUM" : "LOW") as "LOW" | "MEDIUM" | "HIGH" };
      }));
    }, 2200);
    try {
      const ws = new WebSocket("ws://localhost:8080/ws/events");
      ws.onopen = () => setConnected(true);
      ws.onclose = () => setConnected(false);
      return () => { clearInterval(iv); ws.close(); };
    } catch {
      return () => clearInterval(iv);
    }
  }, []);

  function handleSelectCar(car: CarModel) {
    setSelectedCar(car);
    setMainView("carDetail");
  }

  function handleCarDetailBack() {
    setMainView("carList");
    setSelectedCar(null);
  }

  function handleNavChange(v: MainView) {
    setMainView(v);
    if (v !== "carDetail") setSelectedCar(null);
  }

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", background: T.bg, color: T.bone, fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      {/* Background grid */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(248,250,252,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(248,250,252,0.025) 1px, transparent 1px)", backgroundSize: "52px 52px", pointerEvents: "none", zIndex: 0 }} />

      <SideNav mainView={mainView} setMainView={handleNavChange} onBack={onBackToLanding} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 }}>
        <TopBar connected={connected} mainView={mainView} />

        <AnimatePresence mode="wait">
          <motion.div key={mainView + (selectedCar?.id || "")}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
            style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            {mainView === "home"     && <HomeView fleet={fleet} />}
            {mainView === "carList"  && <CarListView onSelectCar={handleSelectCar} />}
            {mainView === "carDetail" && selectedCar && (
              <CarDetailView car={selectedCar} onBack={handleCarDetailBack} fleet={fleet} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
