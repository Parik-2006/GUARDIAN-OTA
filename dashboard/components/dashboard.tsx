"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { deployFirmware, fetchFleet } from "@/lib/api";
import { DeviceState } from "@/types";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
type LogLevel = "info" | "warn" | "error";
type LogLine = { id: number; level: LogLevel; text: string; ts: string };

/* ─────────────────────────────────────────────
   UTILITY
───────────────────────────────────────────── */
function nowStr() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

const ECU_KEYS = ["brake", "powertrain", "sensor", "infotainment"] as const;
const ECU_GLYPHS: Record<string, string> = {
  brake: "◈", powertrain: "⬡", sensor: "◎", infotainment: "▣",
};

function ecuColor(s: string): string {
  if (s === "green")   return "#7AB88A";
  if (s === "warning") return "#D4956A";
  return "#C46B6B";
}
function threatClass(t: string): string {
  if (t === "LOW")    return "badge-low";
  if (t === "MEDIUM") return "badge-med";
  return "badge-high";
}

/* ─────────────────────────────────────────────
   BASE CARD
───────────────────────────────────────────── */
function Card({
  children, className = "", selected = false, onClick,
}: {
  children: React.ReactNode; className?: string;
  selected?: boolean; onClick?: () => void;
}) {
  return (
    <motion.div
      onClick={onClick}
      layout
      whileHover={onClick ? { y: -2, scale: 1.012 } : undefined}
      whileTap={onClick ? { scale: 0.988 } : undefined}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className={`c-card ${selected ? "c-card--sel" : ""} ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {selected && (
        <motion.div
          layoutId="sel-ring"
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ boxShadow: "0 0 0 1.5px rgba(212,169,106,0.65), 0 0 20px rgba(212,169,106,0.1)" }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
        />
      )}
      {children}
    </motion.div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <div className="c-section-label"><span>{children}</span></div>;
}

/* ─────────────────────────────────────────────
   STAT BOX
───────────────────────────────────────────── */
function StatBox({ label, value, sub, color, delay = 0 }: {
  label: string; value: string | number; sub?: string; color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="c-card p-5 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${color}20, transparent 70%)` }} />
      <p className="c-label mb-2.5">{label}</p>
      <p className="c-display text-[2.4rem] leading-none" style={{ color }}>{value}</p>
      {sub && <p className="c-mono text-[0.62rem] mt-1.5 opacity-25">{sub}</p>}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   STATUS DOT
───────────────────────────────────────────── */
function Dot({ color, pulse = false }: { color: string; pulse?: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-3 h-3 flex-shrink-0">
      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
      {pulse && (
        <motion.div className="absolute inset-0 rounded-full" style={{ background: color }}
          animate={{ scale: [1, 2.4], opacity: [0.5, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   3-D CHART — Fleet Health Isometric Bars
══════════════════════════════════════════════ */
function Chart3DFleetHealth({ safe, warn, high, total }: {
  safe: number; warn: number; high: number; total: number;
}) {
  const W = 300; const H = 175;
  const barW = 42; const gap = 30;
  const maxBarH = 108;
  const baseY = H - 28;
  const dx = 13; const dy = 6; // iso offsets

  const bars = [
    { label: "SAFE",     count: safe, front: "#7AB88A", top: "#A2D4A8", side: "#4D9060" },
    { label: "MED",      count: warn, front: "#D4956A", top: "#E8B48A", side: "#A06540" },
    { label: "CRITICAL", count: high, front: "#C46B6B", top: "#D88888", side: "#944545" },
  ];
  const totalW = bars.length * barW + (bars.length - 1) * gap;
  const sx = (W - totalW - dx) / 2;

  return (
    <div className="flex flex-col">
      <SectionLabel>Fleet Health — 3D</SectionLabel>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: "visible", marginTop: 8 }}>
        {/* horizontal guide lines */}
        {[0, 0.33, 0.66, 1].map((t) => (
          <line key={t}
            x1={sx} y1={baseY - t * maxBarH}
            x2={sx + totalW + dx} y2={baseY - t * maxBarH}
            stroke="rgba(240,235,224,0.06)" strokeWidth="1"
          />
        ))}
        {bars.map((b, i) => {
          const x = sx + i * (barW + gap);
          const h = total > 0 ? Math.max(5, (b.count / total) * maxBarH) : 5;
          const y = baseY - h;

          const front = `M${x},${baseY} L${x + barW},${baseY} L${x + barW},${y} L${x},${y}Z`;
          const top   = `M${x},${y} L${x + dx},${y - dy} L${x + barW + dx},${y - dy} L${x + barW},${y}Z`;
          const side  = `M${x + barW},${baseY} L${x + barW + dx},${baseY - dy} L${x + barW + dx},${y - dy} L${x + barW},${y}Z`;

          return (
            <motion.g key={b.label}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: i * 0.12, duration: 0.65, ease: "easeOut" }}
              style={{ transformOrigin: `${x + barW / 2}px ${baseY}px` }}
            >
              <path d={front} fill={b.front} />
              <path d={top}   fill={b.top} />
              <path d={side}  fill={b.side} />
              <text x={x + barW / 2 + dx / 2} y={y - dy - 5}
                textAnchor="middle" fill="rgba(240,235,224,0.7)"
                fontSize="10" fontFamily="JetBrains Mono,monospace">{b.count}</text>
              <text x={x + barW / 2} y={baseY + 14}
                textAnchor="middle" fill="rgba(240,235,224,0.3)"
                fontSize="7" fontFamily="JetBrains Mono,monospace" letterSpacing="0.1em">
                {b.label}
              </text>
            </motion.g>
          );
        })}
        <line x1={sx} y1={baseY} x2={sx + totalW + dx} y2={baseY}
          stroke="rgba(240,235,224,0.12)" strokeWidth="1" />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════
   3-D CHART — Threat Ring (perspective donut)
══════════════════════════════════════════════ */
function Chart3DThreatRing({ low, med, high }: { low: number; med: number; high: number }) {
  const total = low + med + high || 1;
  const cx = 105; const cy = 72;
  const rx = 68; const ry = 26;
  const thick = 20;

  const segs = [
    { label: "LOW",  val: low,  col: "#7AB88A", dark: "#4D9060" },
    { label: "MED",  val: med,  col: "#D4956A", dark: "#A06540" },
    { label: "HIGH", val: high, col: "#C46B6B", dark: "#944545" },
  ];

  const toRad = (d: number) => (d * Math.PI) / 180;
  function arc(startDeg: number, endDeg: number, eRx: number, eRy: number, eCx: number, eCy: number) {
    const sx = eCx + eRx * Math.cos(toRad(startDeg));
    const sy = eCy + eRy * Math.sin(toRad(startDeg));
    const ex = eCx + eRx * Math.cos(toRad(endDeg));
    const ey = eCy + eRy * Math.sin(toRad(endDeg));
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${sx},${sy} A ${eRx},${eRy} 0 ${large},1 ${ex},${ey}`;
  }

  let cur = -155;
  const built = segs.map((s) => {
    const sweep = (s.val / total) * 290;
    const start = cur;
    const end = cur + Math.max(sweep, s.val > 0 ? 8 : 0);
    cur = end + 5;
    return { ...s, start, end };
  });

  return (
    <div className="flex flex-col">
      <SectionLabel>Threat Distribution</SectionLabel>
      <svg viewBox="0 0 210 148" className="w-full" style={{ overflow: "visible", marginTop: 8 }}>
        {/* depth shadow */}
        <ellipse cx={cx} cy={cy + 5} rx={rx + 2} ry={ry + 1}
          fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={thick + 6} />

        {/* bottom face (depth) */}
        {built.map((s, i) => (
          <path key={`b${i}`} d={arc(s.start, s.end, rx, ry, cx, cy + thick * 0.38)}
            fill="none" stroke={s.dark} strokeWidth={thick - 2}
            strokeLinecap="butt" opacity={0.75} />
        ))}

        {/* top face */}
        {built.map((s, i) => (
          <motion.path key={`t${i}`} d={arc(s.start, s.end, rx, ry, cx, cy)}
            fill="none" stroke={s.col} strokeWidth={thick - 2}
            strokeLinecap="butt"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: i * 0.18 + 0.25, duration: 0.75, ease: "easeOut" }}
          />
        ))}

        {/* center */}
        <text x={cx} y={cy - 3} textAnchor="middle"
          fill="rgba(240,235,224,0.9)" fontSize="18"
          fontFamily="Rajdhani,sans-serif" fontWeight="600">{total}</text>
        <text x={cx} y={cy + 9} textAnchor="middle"
          fill="rgba(240,235,224,0.28)" fontSize="6.5"
          fontFamily="JetBrains Mono,monospace" letterSpacing="0.14em">VEHICLES</text>

        {/* legend */}
        {built.map((s, i) => (
          <g key={`lg${i}`} transform={`translate(158,${cy - 16 + i * 18})`}>
            <rect width="8" height="8" rx="1.5" fill={s.col} />
            <text x="12" y="7.5" fill="rgba(240,235,224,0.42)"
              fontSize="7.5" fontFamily="JetBrains Mono,monospace">
              {s.label} {Math.round((s.val / total) * 100)}%
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════
   3-D CHART — ECU Matrix (isometric grid)
══════════════════════════════════════════════ */
function Chart3DECUMatrix({ fleet }: { fleet: DeviceState[] }) {
  const cells = fleet.slice(0, 16);
  const cW = 18; const cH = 9;
  const gX = 4; const gY = 3;
  const dX = 7; const dY = 3;
  const cols = 4;
  const W = 280; const H = 160;
  const sx = 18; const sy = H - 34;

  function cellCol(d: DeviceState) {
    if (d.safetyState === "UNSAFE" || d.threatLevel === "HIGH") return { f: "#C46B6B", t: "#D88888", s: "#944545" };
    if (d.threatLevel === "MEDIUM") return { f: "#D4956A", t: "#E8B48A", s: "#A06540" };
    return { f: "#7AB88A", t: "#A2D4A8", s: "#4D9060" };
  }

  return (
    <div className="flex flex-col">
      <SectionLabel>ECU Matrix — 3D Grid</SectionLabel>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: "visible", marginTop: 8 }}>
        {cells.map((d, i) => {
          const col = Math.floor(i / cols);  // column group (left-right)
          const row = i % cols;              // row (front-back)
          const x = sx + col * (cW + gX) + row * dX;
          const y = sy - row * (cH + gY + dY);
          const c = cellCol(d);

          const front = `M${x},${y} L${x + cW},${y} L${x + cW},${y + cH} L${x},${y + cH}Z`;
          const top   = `M${x},${y} L${x + dX},${y - dY} L${x + cW + dX},${y - dY} L${x + cW},${y}Z`;
          const side  = `M${x + cW},${y} L${x + cW + dX},${y - dY} L${x + cW + dX},${y + cH - dY} L${x + cW},${y + cH}Z`;

          return (
            <motion.g key={d.deviceId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.035, duration: 0.35 }}
            >
              <path d={front} fill={c.f} />
              <path d={top}   fill={c.t} />
              <path d={side}  fill={c.s} />
            </motion.g>
          );
        })}
        <text x={sx} y={H - 10} fill="rgba(240,235,224,0.22)"
          fontSize="7" fontFamily="JetBrains Mono,monospace" letterSpacing="0.1em">
          {cells.length} VEHICLES · LIVE ECU STATUS
        </text>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HUD HEADER  — hydration-safe clock
───────────────────────────────────────────── */
function HUDHeader({ connected }: { connected: boolean }) {
  const [clock, setClock] = useState<string>(""); // empty on SSR, filled client-side

  useEffect(() => {
    setClock(nowStr());
    const id = setInterval(() => setClock(nowStr()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="mb-7"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="c-label opacity-35">SDV PLATFORM</span>
          <span className="c-label opacity-12">·</span>
          <span className="c-label opacity-20">MAHE MOBILITY CHALLENGE</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="c-pill flex items-center gap-2">
            <Dot color={connected ? "#7AB88A" : "#D4956A"} pulse={connected} />
            <span className="c-mono text-[0.62rem]"
              style={{ color: connected ? "#7AB88A" : "#D4956A" }}>
              {connected ? "LIVE" : "DEMO"}
            </span>
          </div>
          {clock && (
            <div className="c-pill">
              <span className="c-mono text-[0.62rem] opacity-30">{clock}</span>
            </div>
          )}
        </div>
      </div>

      <h1 className="c-display text-[1.9rem] md:text-[2.7rem] tracking-[0.05em] leading-tight"
        style={{ color: "var(--cream-100)" }}>
        AUTONOMOUS VEHICLE
        <span style={{ color: "var(--gold)" }}> COMMAND CENTER</span>
      </h1>
      <p className="c-label mt-1 opacity-25">
        Secure OTA Orchestration · Fleet Telemetry · Threat Intelligence
      </p>

      <div className="c-hud-line mt-5" />
    </motion.header>
  );
}

/* ─────────────────────────────────────────────
   ECU BAR
───────────────────────────────────────────── */
function ECUBar({ name, state }: { name: string; state: string }) {
  const col = ecuColor(state);
  const pct = state === "green" ? "100%" : state === "warning" ? "55%" : "18%";
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="w-4 text-xs text-center flex-shrink-0" style={{ color: col, opacity: 0.7 }}>
        {ECU_GLYPHS[name] ?? "◆"}
      </span>
      <span className="c-mono text-[0.62rem] capitalize opacity-35 w-24 flex-shrink-0">{name}</span>
      <div className="flex-1 h-[2px] rounded-sm" style={{ background: "rgba(240,235,224,0.07)" }}>
        <motion.div className="h-full rounded-sm" style={{ background: col }}
          initial={{ width: "0%" }} animate={{ width: pct }}
          transition={{ duration: 0.7, ease: "easeOut" }} />
      </div>
      <span className="c-mono text-[0.62rem] w-14 text-right capitalize flex-shrink-0" style={{ color: col }}>
        {state}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DEVICE CARD
───────────────────────────────────────────── */
function DeviceCard({ d, selected, onClick }: {
  d: DeviceState; selected: boolean; onClick: () => void;
}) {
  const sc = d.safetyState === "SAFE" ? "#7AB88A" : "#C46B6B";
  return (
    <Card selected={selected} onClick={onClick} className="p-3.5 w-full">
      <div className="flex items-start justify-between mb-2.5">
        <div className="min-w-0">
          <p className="c-mono text-[0.62rem] font-semibold truncate" style={{ color: "var(--gold)" }}>
            {d.deviceId}
          </p>
          {d.primary && <span className="badge badge-primary mt-0.5 inline-block">PRIMARY</span>}
        </div>
        <span className={`badge ${threatClass(d.threatLevel)} ml-1 flex-shrink-0`}>
          {d.threatLevel}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Dot color={sc} pulse={d.safetyState === "SAFE"} />
        <span className={`badge ${d.safetyState === "SAFE" ? "badge-safe" : "badge-unsafe"}`}>
          {d.safetyState}
        </span>
        <span className="c-mono text-[0.58rem] opacity-18 ml-auto">v{d.otaVersion}</span>
      </div>
      {d.otaProgress > 0 && d.otaProgress < 100 && (
        <div className="mt-2.5">
          <p className="c-label mb-1">OTA {d.otaProgress}%</p>
          <div className="h-[2px] rounded-sm" style={{ background: "rgba(240,235,224,0.07)" }}>
            <motion.div className="h-full rounded-sm" style={{ background: "var(--gold)" }}
              animate={{ width: `${d.otaProgress}%` }} transition={{ duration: 0.5 }} />
          </div>
        </div>
      )}
    </Card>
  );
}

/* ─────────────────────────────────────────────
   ECU DETAIL PANEL
───────────────────────────────────────────── */
function ECUDetailPanel({ device }: { device: DeviceState | null }) {
  if (!device) return (
    <Card className="p-6 h-full flex items-center justify-center">
      <p className="c-label opacity-18 text-center leading-relaxed">
        SELECT A DEVICE<br />TO INSPECT ECU STATUS
      </p>
    </Card>
  );
  return (
    <AnimatePresence mode="wait">
      <motion.div key={device.deviceId}
        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.22 }}
        className="h-full"
      >
        <Card className="p-6 h-full">
          <SectionLabel>{`ECU · ${device.deviceId}`}</SectionLabel>
          <div className="space-y-1 mb-5 mt-1">
            {ECU_KEYS.map((k) => (
              <ECUBar key={k} name={k} state={device.ecuStates?.[k] ?? "green"} />
            ))}
          </div>
          <SectionLabel>Security Chain</SectionLabel>
          <div className="space-y-2.5 mt-1">
            {[
              { label: "TLS Tunnel",         ok: device.tlsHealthy },
              { label: "ECC Signature",       ok: device.signatureOk },
              { label: "Firmware Integrity",  ok: device.integrityOk },
              { label: "Rollback Guard",      ok: device.rollbackArmed },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="c-body text-xs opacity-38">{label}</span>
                <span className="c-mono text-[0.62rem]"
                  style={{ color: ok ? "#7AB88A" : "#C46B6B" }}>
                  {ok ? "✓ ACTIVE" : "✗ FAIL"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────
   LOG STREAM
───────────────────────────────────────────── */
function LogStream({ logs }: { logs: LogLine[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = 0; }, [logs.length]);

  const levelColor: Record<LogLevel, string> = {
    info: "var(--slate)", warn: "#D4956A", error: "#C46B6B",
  };

  return (
    <Card className="p-6 h-full">
      <SectionLabel>Live Event Stream</SectionLabel>
      <div ref={ref} className="c-log-scroll space-y-1.5 mt-1 pr-1">
        <AnimatePresence initial={false}>
          {logs.map((l) => (
            <motion.div key={l.id}
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              className="flex gap-2.5 items-start c-log-entry"
            >
              <span className="c-mono text-[0.58rem] opacity-15 shrink-0 tabular-nums">{l.ts}</span>
              <span className="c-mono text-[0.6rem] shrink-0 font-medium"
                style={{ color: levelColor[l.level] }}>
                [{l.level.toUpperCase().padEnd(5)}]
              </span>
              <span className="c-mono text-[0.6rem] opacity-45 break-all leading-relaxed">{l.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {!logs.length && (
          <p className="c-mono text-[0.6rem] opacity-15 mt-3">Awaiting event stream…</p>
        )}
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────
   DEPLOYMENT COCKPIT
───────────────────────────────────────────── */
function DeploymentCockpit({
  version, setVersion, firmwareUrl, setFirmwareUrl,
  firmwareHash, setFirmwareHash, sigB64, setSigB64,
  canaryPct, setCanaryPct, fleetTotal, highCount,
  deploying, onDeploy,
}: {
  version: string; setVersion: (v: string) => void;
  firmwareUrl: string; setFirmwareUrl: (v: string) => void;
  firmwareHash: string; setFirmwareHash: (v: string) => void;
  sigB64: string; setSigB64: (v: string) => void;
  canaryPct: number; setCanaryPct: (v: number) => void;
  fleetTotal: number; highCount: number;
  deploying: boolean; onDeploy: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="c-cockpit p-6 h-full"
    >
      <SectionLabel>OTA Deployment</SectionLabel>
      <div className="space-y-3.5 mt-1">
        {[
          { label: "Firmware Version", val: version,      set: setVersion,      ph: "e.g. 1.1.0" },
          { label: "Firmware URL",     val: firmwareUrl,  set: setFirmwareUrl,  ph: "" },
          { label: "SHA-256 Hash",     val: firmwareHash, set: setFirmwareHash, ph: "" },
          { label: "ECC Signature",    val: sigB64,       set: setSigB64,       ph: "" },
        ].map(({ label, val, set, ph }) => (
          <div key={label}>
            <label className="c-label block mb-1.5">{label}</label>
            <input className="c-input" value={val}
              onChange={(e) => set(e.target.value)} placeholder={ph} />
          </div>
        ))}

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="c-label">Canary Rollout</label>
            <span className="c-mono text-[0.65rem]" style={{ color: "var(--gold)" }}>
              {canaryPct}%
            </span>
          </div>
          <input type="range" min={1} max={100} value={canaryPct}
            onChange={(e) => setCanaryPct(Number(e.target.value))}
            className="c-slider" style={{ "--val": `${canaryPct}%` } as React.CSSProperties} />
          <div className="flex justify-between mt-1.5">
            <span className="c-label opacity-22">1 vehicle</span>
            <span className="c-label opacity-35">
              {Math.round(fleetTotal * canaryPct / 100)} of {fleetTotal}
            </span>
            <span className="c-label opacity-22">Full fleet</span>
          </div>
        </div>

        {/* Security gates */}
        <div className="c-gate-box rounded p-3.5">
          <p className="c-label mb-2 opacity-40">Security Gates</p>
          {[
            ["TLS Tunnel",         true],
            ["ECC Signature Gate", true],
            ["SHA-256 Integrity",  true],
            ["Rollback Guard",     true],
            ["Safety-Gate Check",  highCount === 0],
          ].map(([lbl, ok]) => (
            <div key={String(lbl)}
              className="flex items-center justify-between py-1.5 border-b c-border-dim last:border-b-0">
              <span className="c-body text-xs opacity-32">{String(lbl)}</span>
              <span className="c-mono text-[0.62rem]"
                style={{ color: Boolean(ok) ? "#7AB88A" : "#C46B6B" }}>
                {Boolean(ok) ? "✓" : "✗ BLOCKED"}
              </span>
            </div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={onDeploy} disabled={deploying}
          className="c-btn-deploy"
        >
          {deploying ? "⟳  DEPLOYING…" : "▶  LAUNCH OTA CAMPAIGN"}
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   FLEET GRID
───────────────────────────────────────────── */
function FleetGrid({ fleet, selectedId, onSelect }: {
  fleet: DeviceState[]; selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.17, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="c-card p-6 lg:col-span-2"
    >
      <SectionLabel>{`Live Fleet — ${fleet.length} Vehicles`}</SectionLabel>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 max-h-[460px] overflow-y-auto c-scroll pr-1 mt-1">
        <AnimatePresence>
          {fleet.map((d) => (
            <DeviceCard key={d.deviceId} d={d}
              selected={selectedId === d.deviceId}
              onClick={() => onSelect(d.deviceId)} />
          ))}
        </AnimatePresence>
        {!fleet.length && (
          <div className="col-span-3 flex items-center justify-center h-36">
            <motion.p animate={{ opacity: [0.15, 0.45, 0.15] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="c-label opacity-20">Initializing fleet…</motion.p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */
export default function Dashboard() {
  const [fleet, setFleet]             = useState<DeviceState[]>([]);
  const [logs, setLogs]               = useState<LogLine[]>([]);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [canaryPct, setCanaryPct]     = useState(25);
  const [version, setVersion]         = useState("1.1.0");
  const [firmwareUrl, setFirmwareUrl] = useState("http://localhost:9000/firmware/esp32.bin");
  const [firmwareHash, setFirmwareHash] = useState("sha256-abc123");
  const [sigB64, setSigB64]           = useState("MEUCIQ…");
  const [deploying, setDeploying]     = useState(false);
  const [connected, setConnected]     = useState(false);
  const [tick, setTick]               = useState(0);

  function appendLog(level: LogLevel, text: string) {
    setLogs((p) =>
      [{ id: Date.now() + Math.random(), level, text, ts: nowStr() }, ...p].slice(0, 120)
    );
  }

  useEffect(() => {
    fetchFleet()
      .then((d) => { setFleet(d); appendLog("info", `Loaded ${d.length} devices`); })
      .catch(() => appendLog("warn", "Backend offline — demo simulation active"));

    const wsBase = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080").replace(/^http/, "ws");
    let ws: WebSocket;
    try {
      ws = new WebSocket(`${wsBase}/ws/events`);
      ws.onopen    = () => { setConnected(true);  appendLog("info", "WebSocket connected"); };
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data) as { type: string; payload: DeviceState[] | Record<string, unknown> };
        if (msg.type === "fleet_tick" && Array.isArray(msg.payload)) setFleet(msg.payload);
        appendLog("info", `← ${msg.type}`);
      };
      ws.onerror = () => appendLog("error", "WebSocket error");
      ws.onclose = () => { setConnected(false); appendLog("warn", "WebSocket closed"); };
    } catch { appendLog("warn", "WebSocket unavailable"); }

    const sim = setInterval(() => {
      setFleet((prev) => {
        if (!prev.length) return prev;
        return prev.map((d) => {
          const r = Math.random();
          return {
            ...d, lastSeen: new Date().toISOString(),
            safetyState: r < 0.03 ? "UNSAFE" : "SAFE",
            threatLevel: r < 0.03 ? "HIGH" : r < 0.08 ? "MEDIUM" : "LOW",
            ecuStates: {
              brake:        r < 0.03 ? "failure" : "green",
              powertrain:   r < 0.06 ? "warning" : "green",
              sensor:       r < 0.08 ? "warning" : "green",
              infotainment: "green",
            },
          };
        });
      });
      setTick((t) => t + 1);
    }, 1800);

    return () => {
      clearInterval(sim);
      try { ws?.close(); } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!tick) return;
    if (tick % 3 === 0) appendLog("info", `fleet_tick · ${fleet.length} vehicles polled`);
    const unsafe = fleet.filter((d) => d.safetyState === "UNSAFE");
    if (unsafe.length) appendLog("warn", `Safety alert: ${unsafe.map((d) => d.deviceId).join(", ")}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  async function onDeploy() {
    if (deploying) return;
    setDeploying(true);
    appendLog("info", `▶ OTA deploy v${version} → ${canaryPct}% canary`);
    try {
      await deployFirmware({ version, firmwareUrl, firmwareHash, signatureB64: sigB64, canaryPercent: canaryPct });
      appendLog("info", "✓ Deploy accepted by orchestration layer");
      setDeploying(false);
    } catch {
      appendLog("warn", "Backend offline — simulating locally");
      setFleet((prev) => prev.map((d, i) =>
        i % Math.round(100 / canaryPct) === 0 ? { ...d, otaProgress: 1, otaVersion: version } : d
      ));
      let prog = 1;
      const iv = setInterval(() => {
        prog += Math.floor(Math.random() * 8) + 4;
        if (prog >= 100) {
          prog = 100; clearInterval(iv); setDeploying(false);
          appendLog("info", "✓ OTA campaign complete");
        }
        setFleet((prev) => prev.map((d) =>
          d.otaVersion === version ? { ...d, otaProgress: prog } : d
        ));
      }, 600);
    }
  }

  const stats = useMemo(() => ({
    total: fleet.length,
    safe:  fleet.filter((d) => d.safetyState === "SAFE").length,
    warn:  fleet.filter((d) => d.threatLevel === "MEDIUM").length,
    high:  fleet.filter((d) => d.threatLevel === "HIGH").length,
  }), [fleet]);

  const selected = fleet.find((d) => d.deviceId === selectedId) ?? null;

  return (
    <>
      <div className="c-page-scan" aria-hidden />
      <div className="c-bg-grid" aria-hidden />

      <div className="c-root">
        <HUDHeader connected={connected} />

        {/* STAT ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatBox label="Fleet Size"      value={stats.total} sub="active vehicles" color="var(--gold)"  delay={0}    />
          <StatBox label="Vehicles Safe"   value={stats.safe}  sub={`${stats.total > 0 ? Math.round(stats.safe / stats.total * 100) : 0}% healthy`} color="#7AB88A" delay={0.05} />
          <StatBox label="Warnings"        value={stats.warn}  sub="medium threat"   color="#D4956A" delay={0.1}  />
          <StatBox label="Critical Alerts" value={stats.high}  sub="action required" color="#C46B6B" delay={0.15} />
        </div>

        {/* 3D CHARTS */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5"
        >
          <Card className="p-5">
            <Chart3DFleetHealth
              safe={stats.safe} warn={stats.warn}
              high={stats.high} total={stats.total} />
          </Card>
          <Card className="p-5">
            <Chart3DThreatRing
              low={Math.max(0, stats.total - stats.warn - stats.high)}
              med={stats.warn} high={stats.high} />
          </Card>
          <Card className="p-5">
            <Chart3DECUMatrix fleet={fleet} />
          </Card>
        </motion.div>

        {/* OPS ROW */}
        <div className="grid lg:grid-cols-3 gap-3 mb-3">
          <DeploymentCockpit
            version={version} setVersion={setVersion}
            firmwareUrl={firmwareUrl} setFirmwareUrl={setFirmwareUrl}
            firmwareHash={firmwareHash} setFirmwareHash={setFirmwareHash}
            sigB64={sigB64} setSigB64={setSigB64}
            canaryPct={canaryPct} setCanaryPct={setCanaryPct}
            fleetTotal={stats.total} highCount={stats.high}
            deploying={deploying} onDeploy={onDeploy}
          />
          <FleetGrid fleet={fleet} selectedId={selectedId}
            onSelect={(id) => setSelectedId(selectedId === id ? null : id)} />
        </div>

        {/* BOTTOM */}
        <div className="grid lg:grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}>
            <ECUDetailPanel device={selected} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}>
            <LogStream logs={logs} />
          </motion.div>
        </div>

        {/* FOOTER */}
        <div className="mt-7">
          <div className="c-hud-line mb-4" />
          <p className="c-label opacity-12 text-center">
            SDV SECURE OTA · MAHE MOBILITY CHALLENGE · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </>
  );
}
