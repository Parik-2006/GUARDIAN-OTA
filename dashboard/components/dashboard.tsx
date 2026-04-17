"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { deployFirmware, fetchFleet } from "@/lib/api";
import { DeviceState } from "@/types";

type LogLine = { id: number; level: "info" | "warn" | "error"; text: string; ts: string };

/* ─────────── helpers ─────────── */
function now() { return new Date().toLocaleTimeString("en-US", { hour12: false }); }

const ECU_KEYS = ["brake", "powertrain", "sensor", "infotainment"] as const;
const ECU_ICONS: Record<string, string> = { brake: "⬡", powertrain: "⚙", sensor: "◎", infotainment: "▣" };

function statusColor(s: string) {
  if (s === "green") return "#00ff88";
  if (s === "warning") return "#ffb800";
  return "#ff3366";
}

function threatBadge(t: string) {
  if (t === "LOW") return "badge-low";
  if (t === "MEDIUM") return "badge-med";
  return "badge-high";
}

/* ─────────── Sub-components ─────────── */

function ScanLine() {
  return <div className="scan-line" aria-hidden />;
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 280, damping: 20 }}
      className="glass rounded-xl p-5 glow-cyan relative overflow-hidden"
      style={{ borderColor: `${color}22` }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5"
        style={{ background: color, filter: "blur(30px)", transform: "translate(30%, -30%)" }} />
      <p className="mono text-xs tracking-widest uppercase mb-2" style={{ color: `${color}99` }}>{label}</p>
      <p className="text-4xl font-bold tracking-tight" style={{ color, textShadow: `0 0 20px ${color}88` }}>{value}</p>
      {sub && <p className="mono text-xs mt-1 opacity-40">{sub}</p>}
    </motion.div>
  );
}

function ECUBadge({ name, state }: { name: string; state: string }) {
  const col = statusColor(state);
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="w-5 h-5 flex items-center justify-center text-xs" style={{ color: col }}>{ECU_ICONS[name] ?? "◆"}</span>
      <span className="mono text-xs capitalize opacity-70 w-20">{name}</span>
      <div className="flex-1 h-1 rounded-full" style={{ background: `${col}22` }}>
        <motion.div
          className="h-1 rounded-full"
          style={{ background: col, boxShadow: `0 0 6px ${col}` }}
          initial={{ width: "0%" }}
          animate={{ width: state === "green" ? "100%" : state === "warning" ? "55%" : "20%" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className="mono text-xs w-14 text-right capitalize" style={{ color: col }}>{state}</span>
    </div>
  );
}

function DeviceCard({ d, selected, onClick }: { d: DeviceState; selected: boolean; onClick: () => void }) {
  const threat = d.threatLevel;
  const safeColor = d.safetyState === "SAFE" ? "#00ff88" : "#ff3366";
  return (
    <motion.button
      layout
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`glass device-card rounded-xl p-4 text-left w-full cursor-pointer ${selected ? "border-glow-anim" : ""}`}
      style={{
        borderColor: selected ? "#00f5ff44" : `${safeColor}18`,
        boxShadow: selected ? `0 0 24px rgba(0,245,255,0.15)` : "none",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="mono text-xs font-semibold" style={{ color: "#00f5ff" }}>{d.deviceId}</p>
          {d.primary && <span className="mono text-xs px-1.5 py-0.5 rounded mt-0.5 inline-block"
            style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", color: "#c084fc", fontSize: "0.6rem" }}>PRIMARY</span>}
        </div>
        <span className={`badge ${threatBadge(threat)}`}>{threat}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="relative">
          <div className="w-2 h-2 rounded-full" style={{ background: safeColor }} />
          {d.safetyState === "SAFE" && <div className="w-2 h-2 rounded-full absolute inset-0 pulse-ring" style={{ background: safeColor }} />}
        </div>
        <span className={`badge ${d.safetyState === "SAFE" ? "badge-safe" : "badge-unsafe"}`}>{d.safetyState}</span>
        <span className="mono text-xs opacity-40 ml-auto">v{d.otaVersion}</span>
      </div>
      {d.otaProgress > 0 && d.otaProgress < 100 && (
        <div className="mt-2">
          <p className="mono text-xs opacity-40 mb-1">OTA {d.otaProgress}%</p>
          <div className="progress-track">
            <motion.div className="progress-fill" animate={{ width: `${d.otaProgress}%` }} transition={{ duration: 0.5 }} />
          </div>
        </div>
      )}
    </motion.button>
  );
}

function ECUDetailPanel({ device }: { device: DeviceState | null }) {
  if (!device) return (
    <div className="glass rounded-2xl p-6 h-full flex items-center justify-center">
      <p className="mono text-xs opacity-30 text-center">SELECT A DEVICE<br />TO VIEW ECU STATUS</p>
    </div>
  );
  return (
    <motion.div key={device.deviceId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 h-full">
      <div className="section-label mb-4">ECU STATUS · {device.deviceId}</div>
      <div className="space-y-1 mb-5">
        {ECU_KEYS.map((k) => (
          <ECUBadge key={k} name={k} state={device.ecuStates?.[k] ?? "green"} />
        ))}
      </div>
      <div className="section-label mb-4">SECURITY CHAIN</div>
      <div className="space-y-2">
        {[
          { label: "TLS Tunnel", ok: device.tlsHealthy },
          { label: "ECC Signature", ok: device.signatureOk },
          // ...new UI/UX code from p:\JJK OTA\dashboard.tsx...
          { label: "Rollback Guard", ok: device.rollbackArmed },
