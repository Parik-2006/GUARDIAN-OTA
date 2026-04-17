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

function nowStr() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

const ECU_KEYS = ["brake", "powertrain", "sensor", "infotainment"] as const;
const ECU_GLYPHS: Record<string, string> = {
  brake: "◈", powertrain: "⬡", sensor: "◎", infotainment: "▣",
};

function ecuColor(s: string) {
  if (s === "green") return "#7AB88A";
  if (s === "warning") return "#D4956A";
  return "#C46B6B";
}
function threatClass(t: string) {
  if (t === "LOW") return "badge-low";
  if (t === "MEDIUM") return "badge-med";
  return "badge-high";
}

/* ─────────────────────────────────────────────
   GLASS CARD with shine-on-hover
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
      {/* Shine overlay — slides on hover via CSS */}
      <div className="c-card-shine-layer" />
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
      className="c-card p-5 relative overflow-hidden stat-card"
    >
      <div className="c-card-shine-layer" />
      <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${color}22, transparent 70%)` }} />
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
   3D CHART — Isometric Bar Chart (Enhanced)
══════════════════════════════════════════════ */
function Chart3DFleetHealth({ safe, warn, high, total }: {
  safe: number; warn: number; high: number; total: number;
}) {
  const W = 300; const H = 175;
  const barW = 42; const gap = 30;
  const maxBarH = 108;
  const baseY = H - 28;
  const dx = 13; const dy = 6;

  const bars = [
    { label: "SAFE", count: safe, front: "#7AB88A", top: "#A2D4A8", side: "#4D9060" },
    { label: "MED", count: warn, front: "#D4956A", top: "#E8B48A", side: "#A06540" },
    { label: "CRITICAL", count: high, front: "#C46B6B", top: "#D88888", side: "#944545" },
  ];
  const totalW = bars.length * barW + (bars.length - 1) * gap;
  const sx = (W - totalW - dx) / 2;

  return (
    <div className="flex flex-col">
      <SectionLabel>Fleet Health — 3D</SectionLabel>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: "visible", marginTop: 8 }}>
        {[0, 0.33, 0.66, 1].map((t) => (
          <line key={t} x1={sx} y1={baseY - t * maxBarH} x2={sx + totalW + dx} y2={baseY - t * maxBarH}
            stroke="rgba(240,235,224,0.06)" strokeWidth="1" />
        ))}
        {bars.map((b, i) => {
          const x = sx + i * (barW + gap);
          const h = total > 0 ? Math.max(5, (b.count / total) * maxBarH) : 5;
          const y = baseY - h;
          const front = `M${x},${baseY} L${x + barW},${baseY} L${x + barW},${y} L${x},${y}Z`;
          const top = `M${x},${y} L${x + dx},${y - dy} L${x + barW + dx},${y - dy} L${x + barW},${y}Z`;
          const side = `M${x + barW},${baseY} L${x + barW + dx},${baseY - dy} L${x + barW + dx},${y - dy} L${x + barW},${y}Z`;
          return (
            <motion.g key={b.label}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: i * 0.12, duration: 0.65, ease: "easeOut" }}
              style={{ transformOrigin: `${x + barW / 2}px ${baseY}px` }}
            >
              <path d={front} fill={b.front} />
              <path d={top} fill={b.top} />
              <path d={side} fill={b.side} />
              {/* shimmer strip */}
              <path d={`M${x + 4},${y} L${x + 4},${baseY}`} fill="none"
                stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
              <text x={x + barW / 2 + dx / 2} y={y - dy - 5}
                textAnchor="middle" fill="rgba(240,235,224,0.7)"
                fontSize="10" fontFamily="JetBrains Mono,monospace">{b.count}</text>
              <text x={x + barW / 2} y={baseY + 14}
                textAnchor="middle" fill="rgba(240,235,224,0.3)"
                fontSize="7" fontFamily="JetBrains Mono,monospace" letterSpacing="0.1em">{b.label}</text>
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
   3D CHART — Threat Ring (perspective donut)
══════════════════════════════════════════════ */
function Chart3DThreatRing({ low, med, high }: { low: number; med: number; high: number }) {
  const total = low + med + high || 1;
  const cx = 105; const cy = 72; const rx = 68; const ry = 26; const thick = 20;
  const segs = [
    { label: "LOW", val: low, col: "#7AB88A", dark: "#4D9060" },
    { label: "MED", val: med, col: "#D4956A", dark: "#A06540" },
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
        <ellipse cx={cx} cy={cy + 5} rx={rx + 2} ry={ry + 1}
          fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={thick + 6} />
        {built.map((s, i) => (
          <path key={`b${i}`} d={arc(s.start, s.end, rx, ry, cx, cy + thick * 0.38)}
            fill="none" stroke={s.dark} strokeWidth={thick - 2} strokeLinecap="butt" opacity={0.75} />
        ))}
        {built.map((s, i) => (
          <motion.path key={`t${i}`} d={arc(s.start, s.end, rx, ry, cx, cy)}
            fill="none" stroke={s.col} strokeWidth={thick - 2} strokeLinecap="butt"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: i * 0.18 + 0.25, duration: 0.75, ease: "easeOut" }}
          />
        ))}
        <text x={cx} y={cy - 3} textAnchor="middle" fill="rgba(240,235,224,0.9)"
          fontSize="18" fontFamily="Rajdhani,sans-serif" fontWeight="600">{total}</text>
        <text x={cx} y={cy + 9} textAnchor="middle" fill="rgba(240,235,224,0.28)"
          fontSize="6.5" fontFamily="JetBrains Mono,monospace" letterSpacing="0.14em">VEHICLES</text>
        {built.map((s, i) => (
          <g key={`lg${i}`} transform={`translate(158,${cy - 16 + i * 18})`}>
            <rect width="8" height="8" rx="1.5" fill={s.col} />
            <text x="12" y="7.5" fill="rgba(240,235,224,0.42)" fontSize="7.5" fontFamily="JetBrains Mono,monospace">
              {s.label} {Math.round((s.val / total) * 100)}%
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════
   3D CHART — ECU Matrix
══════════════════════════════════════════════ */
function Chart3DECUMatrix({ fleet }: { fleet: DeviceState[] }) {
  const cells = fleet.slice(0, 16);
  const cW = 18; const cH = 9; const gX = 4; const gY = 3;
  const dX = 7; const dY = 3; const cols = 4;
  const W = 280; const H = 160; const sx = 18; const sy = H - 34;

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
          const col = Math.floor(i / cols);
          const row = i % cols;
          const x = sx + col * (cW + gX) + row * dX;
          const y = sy - row * (cH + gY + dY);
          const c = cellCol(d);
          return (
            <motion.g key={d.deviceId}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.035, duration: 0.35 }}
            >
              <path d={`M${x},${y} L${x + cW},${y} L${x + cW},${y + cH} L${x},${y + cH}Z`} fill={c.f} />
              <path d={`M${x},${y} L${x + dX},${y - dY} L${x + cW + dX},${y - dY} L${x + cW},${y}Z`} fill={c.t} />
              <path d={`M${x + cW},${y} L${x + cW + dX},${y - dY} L${x + cW + dX},${y + cH - dY} L${x + cW},${y + cH}Z`} fill={c.s} />
            </motion.g>
          );
        })}
        <text x={sx} y={H - 10} fill="rgba(240,235,224,0.22)" fontSize="7"
          fontFamily="JetBrains Mono,monospace" letterSpacing="0.1em">
          {cells.length} VEHICLES · LIVE ECU STATUS
        </text>
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════
   NEW: 3D Canary Rollout Funnel
══════════════════════════════════════════════ */
function Chart3DRolloutFunnel({ total, canaryPct, deployed }: {
  total: number; canaryPct: number; deployed: number;
}) {
  const W = 280; const H = 170;
  const stages = [
    { label: "Fleet", val: total, color: "#D4A96A", dark: "#A06530" },
    { label: "Canary", val: Math.round(total * canaryPct / 100), color: "#6A9DB8", dark: "#3A6D88" },
    { label: "Updated", val: deployed, color: "#7AB88A", dark: "#4D9060" },
  ];
  const maxW = W - 40;
  const rowH = 36; const depthX = 16; const depthY = 7;

  return (
    <div className="flex flex-col">
      <SectionLabel>Rollout Funnel — 3D</SectionLabel>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: "visible", marginTop: 8 }}>
        {stages.map((s, i) => {
          const pct = total > 0 ? s.val / total : 0;
          const bW = Math.max(20, pct * maxW);
          const x = (maxW - bW) / 2 + 20;
          const y = 20 + i * (rowH + 12);
          const h = 22;

          return (
            <motion.g key={s.label}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: i * 0.15, duration: 0.7, ease: "easeOut" }}
              style={{ transformOrigin: "140px 50%" }}
            >
              {/* depth face top */}
              <path
                d={`M${x},${y} L${x + bW},${y} L${x + bW + depthX},${y - depthY} L${x + depthX},${y - depthY}Z`}
                fill={s.color} opacity="0.55"
              />
              {/* front face */}
              <path
                d={`M${x},${y} L${x + bW},${y} L${x + bW},${y + h} L${x},${y + h}Z`}
                fill={s.color}
              />
              {/* side face */}
              <path
                d={`M${x + bW},${y} L${x + bW + depthX},${y - depthY} L${x + bW + depthX},${y + h - depthY} L${x + bW},${y + h}Z`}
                fill={s.dark}
              />
              {/* shimmer */}
              <path d={`M${x + 4},${y} L${x + 4},${y + h}`} stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
              {/* label */}
              <text x={x + bW / 2} y={y + h / 2 + 4.5}
                textAnchor="middle" fill="rgba(9,8,10,0.7)"
                fontSize="8.5" fontFamily="JetBrains Mono,monospace" fontWeight="600">
                {s.label}: {s.val}
              </text>
              {/* pct */}
              <text x={x + bW + depthX + 6} y={y + 5}
                fill="rgba(240,235,224,0.35)" fontSize="7.5" fontFamily="JetBrains Mono,monospace">
                {Math.round(pct * 100)}%
              </text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════
   NEW: 3D Radar / Spider Chart
══════════════════════════════════════════════ */
function Chart3DRadar({ fleet }: { fleet: DeviceState[] }) {
  const cx = 110; const cy = 95; const r = 72;
  const axes = [
    { label: "TLS", key: "tlsHealthy" },
    { label: "SIG", key: "signatureOk" },
    { label: "HASH", key: "integrityOk" },
    { label: "SAFE", key: "safetyOk" },
    { label: "RBCK", key: "rollbackArmed" },
  ];
  const n = axes.length;
  const pct = (key: string) => {
    if (!fleet.length) return 0;
    return fleet.filter((d) =>
      key === "safetyOk" ? d.safetyState === "SAFE" : (d as any)[key]
    ).length / fleet.length;
  };
  function pt(i: number, frac: number) {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return {
      x: cx + r * frac * Math.cos(angle),
      y: cy + r * frac * Math.sin(angle),
    };
  }

  const webs = [0.25, 0.5, 0.75, 1];
  const vals = axes.map((a, i) => ({ ...pt(i, pct(a.key)), pct: pct(a.key) }));
  const polyPts = vals.map((v) => `${v.x},${v.y}`).join(" ");
  const labelPts = axes.map((a, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return {
      label: a.label,
      x: cx + (r + 16) * Math.cos(angle),
      y: cy + (r + 16) * Math.sin(angle),
    };
  });

  return (
    <div className="flex flex-col">
      <SectionLabel>Security Radar</SectionLabel>
      <svg viewBox="0 0 220 190" className="w-full" style={{ overflow: "visible", marginTop: 8 }}>
        {/* web rings */}
        {webs.map((w) => {
          const pts = axes.map((_, i) => {
            const p = pt(i, w);
            return `${p.x},${p.y}`;
          }).join(" ");
          return <polygon key={w} points={pts} fill="none"
            stroke="rgba(240,235,224,0.07)" strokeWidth="1" />;
        })}
        {/* spokes */}
        {axes.map((_, i) => {
          const outer = pt(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y}
            stroke="rgba(240,235,224,0.06)" strokeWidth="1" />;
        })}
        {/* data polygon */}
        <motion.polygon
          points={polyPts}
          fill="rgba(212,169,106,0.12)"
          stroke="#D4A96A" strokeWidth="1.5"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
        {/* dots */}
        {vals.map((v, i) => (
          <motion.circle key={i} cx={v.x} cy={v.y} r="3.5"
            fill="#D4A96A" opacity="0.85"
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: i * 0.08 + 0.5 }}
          />
        ))}
        {/* labels */}
        {labelPts.map((l) => (
          <text key={l.label} x={l.x} y={l.y} textAnchor="middle" dominantBaseline="middle"
            fill="rgba(240,235,224,0.4)" fontSize="7.5" fontFamily="JetBrains Mono,monospace"
            letterSpacing="0.08em">{l.label}</text>
        ))}
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════
   NEW: 3D OTA Progress Wave
══════════════════════════════════════════════ */
function Chart3DOTAWave({ fleet }: { fleet: DeviceState[] }) {
  const W = 280; const H = 120;
  const versions = ["1.0.0", "1.0.1", "1.1.0"];
  const counts = versions.map((v) => fleet.filter((d) => d.otaVersion === v).length);

  return (
    <div className="flex flex-col">
      <SectionLabel>Firmware Distribution</SectionLabel>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: "visible", marginTop: 8 }}>
        <defs>
          <linearGradient id="waveGrad0" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4A96A" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#D4A96A" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="waveGrad1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6A9DB8" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#6A9DB8" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="waveGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7AB88A" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#7AB88A" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {versions.map((v, i) => {
          const total = fleet.length || 1;
          const pct = counts[i] / total;
          const barW = (W - 60) / 3 - 10;
          const x = 20 + i * (barW + 10);
          const maxH = H - 36;
          const barH = Math.max(6, pct * maxH);
          const y = H - 22 - barH;
          const colors = ["#D4A96A", "#6A9DB8", "#7AB88A"];

          return (
            <g key={v}>
              {/* shadow */}
              <rect x={x + 3} y={y + 3} width={barW} height={barH}
                rx="2" fill="rgba(0,0,0,0.4)" />
              {/* bar */}
              <motion.rect
                x={x} y={H - 22} width={barW} height={0} rx="2"
                fill={`url(#waveGrad${i})`}
                stroke={colors[i]} strokeWidth="1" strokeOpacity="0.5"
                animate={{ y: y, height: barH }}
                transition={{ delay: i * 0.12, duration: 0.7, ease: "easeOut" }}
              />
              {/* value */}
              <text x={x + barW / 2} y={y - 5} textAnchor="middle"
                fill={colors[i]} fontSize="10" fontFamily="JetBrains Mono,monospace">{counts[i]}</text>
              {/* label */}
              <text x={x + barW / 2} y={H - 8} textAnchor="middle"
                fill="rgba(240,235,224,0.3)" fontSize="7" fontFamily="JetBrains Mono,monospace">{v}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HUD HEADER
───────────────────────────────────────────── */
function HUDHeader({ connected, onBack }: { connected: boolean; onBack?: () => void }) {
  const [clock, setClock] = useState<string>("");
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
          {onBack && (
            <motion.button
              whileHover={{ x: -2 }}
              onClick={onBack}
              className="c-pill flex items-center gap-2 cursor-pointer"
              style={{ borderColor: "rgba(212,169,106,0.25)", transition: "all 0.2s" }}
            >
              <span className="c-mono text-[0.6rem]" style={{ color: "rgba(212,169,106,0.6)" }}>← BACK</span>
            </motion.button>
          )}
          <span className="c-label opacity-35">SDV PLATFORM</span>
          <span className="c-label opacity-12">·</span>
          <span className="c-label opacity-20">MAHE MOBILITY CHALLENGE</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="c-pill flex items-center gap-2">
            <Dot color={connected ? "#7AB88A" : "#D4956A"} pulse={connected} />
            <span className="c-mono text-[0.62rem]" style={{ color: connected ? "#7AB88A" : "#D4956A" }}>
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
        exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.22 }} className="h-full"
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
              { label: "TLS Tunnel", ok: device.tlsHealthy },
              { label: "ECC Signature", ok: device.signatureOk },
              { label: "Firmware Integrity", ok: device.integrityOk },
              { label: "Rollback Guard", ok: device.rollbackArmed },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="c-body text-xs opacity-38">{label}</span>
                <span className="c-mono text-[0.62rem]" style={{ color: ok ? "#7AB88A" : "#C46B6B" }}>
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
  const levelColor: Record<LogLevel, string> = { info: "var(--slate)", warn: "#D4956A", error: "#C46B6B" };
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
              <span className="c-mono text-[0.6rem] shrink-0 font-medium" style={{ color: levelColor[l.level] }}>
                [{l.level.toUpperCase().padEnd(5)}]
              </span>
              <span className="c-mono text-[0.6rem] opacity-45 break-all leading-relaxed">{l.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {!logs.length && <p className="c-mono text-[0.6rem] opacity-15 mt-3">Awaiting event stream…</p>}
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
  canaryPct, setCanaryPct, fleetTotal, highCount, deploying, onDeploy,
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="c-cockpit p-6 h-full"
    >
      <SectionLabel>OTA Deployment</SectionLabel>
      <div className="space-y-3.5 mt-1">
        {[
          { label: "Firmware Version", val: version, set: setVersion, ph: "e.g. 1.1.0" },
          { label: "Firmware URL", val: firmwareUrl, set: setFirmwareUrl, ph: "" },
          { label: "SHA-256 Hash", val: firmwareHash, set: setFirmwareHash, ph: "" },
          { label: "ECC Signature", val: sigB64, set: setSigB64, ph: "" },
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
            <span className="c-mono text-[0.65rem]" style={{ color: "var(--gold)" }}>{canaryPct}%</span>
          </div>
          <input type="range" min={1} max={100} value={canaryPct}
            onChange={(e) => setCanaryPct(Number(e.target.value))}
            className="c-slider" style={{ "--val": `${canaryPct}%` } as React.CSSProperties} />
          <div className="flex justify-between mt-1.5">
            <span className="c-label opacity-22">1 vehicle</span>
            <span className="c-label opacity-35">{Math.round(fleetTotal * canaryPct / 100)} of {fleetTotal}</span>
            <span className="c-label opacity-22">Full fleet</span>
          </div>
        </div>

        <div className="c-gate-box rounded p-3.5">
          <p className="c-label mb-2 opacity-40">Security Gates</p>
          {[
            ["TLS Tunnel", true],
            ["ECC Signature Gate", true],
            ["SHA-256 Integrity", true],
            ["Rollback Guard", true],
            ["Safety-Gate Check", highCount === 0],
          ].map(([lbl, ok]) => (
            <div key={String(lbl)}
              className="flex items-center justify-between py-1.5 border-b c-border-dim last:border-b-0">
              <span className="c-body text-xs opacity-32">{String(lbl)}</span>
              <span className="c-mono text-[0.62rem]" style={{ color: Boolean(ok) ? "#7AB88A" : "#C46B6B" }}>
                {Boolean(ok) ? "✓" : "✗ BLOCKED"}
              </span>
            </div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={onDeploy} disabled={deploying} className="c-btn-deploy"
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
  fleet: DeviceState[]; selectedId: string | null; onSelect: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.17, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="c-card p-6 lg:col-span-2"
    >
      <div className="c-card-shine-layer" />
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
export default function Dashboard({ onBackToLanding }: { onBackToLanding?: () => void }) {
  const [fleet, setFleet] = useState<DeviceState[]>([]);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [canaryPct, setCanaryPct] = useState(25);
  const [version, setVersion] = useState("1.1.0");
  const [firmwareUrl, setFirmwareUrl] = useState("http://localhost:9000/firmware/esp32.bin");
  const [firmwareHash, setFirmwareHash] = useState("sha256-abc123");
  const [sigB64, setSigB64] = useState("MEUCIQ…");
  const [deploying, setDeploying] = useState(false);
  const [connected, setConnected] = useState(false);
  const [tick, setTick] = useState(0);
  const [deployedCount, setDeployedCount] = useState(0);

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
      ws.onopen = () => { setConnected(true); appendLog("info", "WebSocket connected"); };
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
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
              brake: r < 0.03 ? "failure" : "green",
              powertrain: r < 0.06 ? "warning" : "green",
              sensor: r < 0.08 ? "warning" : "green",
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
  }, []);

  useEffect(() => {
    if (!tick) return;
    if (tick % 3 === 0) appendLog("info", `fleet_tick · ${fleet.length} vehicles polled`);
    const unsafe = fleet.filter((d) => d.safetyState === "UNSAFE");
    if (unsafe.length) appendLog("warn", `Safety alert: ${unsafe.map((d) => d.deviceId).join(", ")}`);
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
      const targetCount = Math.round(fleet.length * canaryPct / 100);
      setFleet((prev) => prev.map((d, i) =>
        i < targetCount ? { ...d, otaProgress: 1, otaVersion: version } : d
      ));
      let prog = 1;
      const iv = setInterval(() => {
        prog += Math.floor(Math.random() * 8) + 4;
        if (prog >= 100) {
          prog = 100; clearInterval(iv); setDeploying(false);
          setDeployedCount(targetCount);
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
    safe: fleet.filter((d) => d.safetyState === "SAFE").length,
    warn: fleet.filter((d) => d.threatLevel === "MEDIUM").length,
    high: fleet.filter((d) => d.threatLevel === "HIGH").length,
  }), [fleet]);

  const selected = fleet.find((d) => d.deviceId === selectedId) ?? null;

  return (
    <>
      {/* Extra CSS for glassmorphism shine */}
      <style>{`
        .c-card-shine-layer {
          position: absolute;
          top: 0; left: -80%;
          width: 60%; height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(240,235,224,0.04) 40%,
            rgba(212,169,106,0.06) 50%,
            rgba(240,235,224,0.04) 60%,
            transparent 100%
          );
          transform: skewX(-18deg);
          pointer-events: none;
          transition: left 0.55s ease;
          z-index: 2;
          border-radius: inherit;
        }
        .c-card:hover .c-card-shine-layer { left: 140%; }
        .stat-card:hover { box-shadow: 0 0 32px rgba(212,169,106,0.1), 0 8px 28px rgba(0,0,0,0.5); }
        /* Nav pill hover */
        .c-pill { transition: border-color 0.2s, background 0.2s; }
        .c-pill:hover { border-color: rgba(212,169,106,0.35); background: rgba(212,169,106,0.05); }
      `}</style>

      <div className="c-page-scan" aria-hidden />
      <div className="c-bg-grid" aria-hidden />

      <div className="c-root">
        <HUDHeader connected={connected} onBack={onBackToLanding} />

        {/* STAT ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatBox label="Fleet Size" value={stats.total} sub="active vehicles" color="var(--gold)" delay={0} />
          <StatBox label="Vehicles Safe" value={stats.safe}
            sub={`${stats.total > 0 ? Math.round(stats.safe / stats.total * 100) : 0}% healthy`}
            color="#7AB88A" delay={0.05} />
          <StatBox label="Warnings" value={stats.warn} sub="medium threat" color="#D4956A" delay={0.1} />
          <StatBox label="Critical Alerts" value={stats.high} sub="action required" color="#C46B6B" delay={0.15} />
        </div>

        {/* 3D CHARTS ROW 1 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3"
        >
          <Card className="p-5">
            <Chart3DFleetHealth safe={stats.safe} warn={stats.warn} high={stats.high} total={stats.total} />
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

        {/* 3D CHARTS ROW 2 — NEW */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5"
        >
          <Card className="p-5">
            <Chart3DRolloutFunnel
              total={stats.total}
              canaryPct={canaryPct}
              deployed={deployedCount}
            />
          </Card>
          <Card className="p-5">
            <Chart3DRadar fleet={fleet} />
          </Card>
          <Card className="p-5">
            <Chart3DOTAWave fleet={fleet} />
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <ECUDetailPanel device={selected} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
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
