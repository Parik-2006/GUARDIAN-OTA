"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { deployFirmware, fetchFleet } from "@/lib/api";
import { DeviceState } from "@/types";

type LogLine = { id: number; level: "info" | "warn" | "error"; text: string; ts: string };

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
          { label: "Firmware Integrity", ok: device.integrityOk },
          { label: "Rollback Guard", ok: device.rollbackArmed },
        ].map(({ label, ok }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-xs opacity-60">{label}</span>
            <span className="mono text-xs" style={{ color: ok ? "#00ff88" : "#ff3366" }}>
              {ok ? "✓ ACTIVE" : "✗ FAIL"}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function LogStream({ logs }: { logs: LogLine[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = 0; }, [logs.length]);
  return (
    <div className="glass rounded-2xl p-6">
      <div className="section-label mb-4">LIVE EVENT STREAM</div>
      <div ref={ref} className="log-scroll space-y-1.5">
        <AnimatePresence initial={false}>
          {logs.map((l) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex gap-2 items-start"
            >
              <span className="mono text-xs opacity-30 shrink-0">{l.ts}</span>
              <span className="mono text-xs shrink-0" style={{
                color: l.level === "error" ? "#ff3366" : l.level === "warn" ? "#ffb800" : "#00f5ff"
              }}>[{l.level.toUpperCase()}]</span>
              <span className="mono text-xs opacity-70 break-all">{l.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {logs.length === 0 && <p className="mono text-xs opacity-20">Waiting for events…</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
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

  function appendLog(level: LogLine["level"], text: string) {
    setLogs((prev) => [{ id: Date.now() + Math.random(), level, text, ts: now() }, ...prev].slice(0, 120));
  }

  useEffect(() => {
    fetchFleet()
      .then((d) => { setFleet(d); appendLog("info", `Loaded ${d.length} devices from fleet API`); })
      .catch(() => appendLog("warn", "Backend offline — running demo simulation"));

    const wsBase = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080").replace(/^http/, "ws");
    let ws: WebSocket;
    try {
      ws = new WebSocket(`${wsBase}/ws/events`);
      ws.onopen = () => { setConnected(true); appendLog("info", "WebSocket connected to backend"); };
      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data) as { type: string; payload: DeviceState[] | Record<string, unknown> };
        if (msg.type === "fleet_tick" && Array.isArray(msg.payload)) setFleet(msg.payload);
        appendLog("info", `← ${msg.type}`);
      };
      ws.onerror = () => appendLog("error", "WebSocket error");
      ws.onclose = () => { setConnected(false); appendLog("warn", "WebSocket closed"); };
    } catch { appendLog("warn", "WebSocket unavailable"); }

    const sim = setInterval(() => {
      setFleet((prev) => {
        if (prev.length === 0) return prev;
        return prev.map((d) => {
          const r = Math.random();
          return {
            ...d,
            lastSeen: new Date().toISOString(),
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
      try { ws?.close(); } catch { }
    };
  }, []);

  useEffect(() => {
    if (tick === 0) return;
    if (tick % 3 === 0) appendLog("info", `fleet_tick · ${fleet.length} vehicles polled`);
    const unsafe = fleet.filter((d) => d.safetyState === "UNSAFE");
    if (unsafe.length > 0) appendLog("warn", `Safety alert: ${unsafe.map((d) => d.deviceId).join(", ")}`);
  }, [tick, fleet]);

  async function onDeploy() {
    if (deploying) return;
    setDeploying(true);
    appendLog("info", `▶ OTA deploy v${version} → ${canaryPct}% canary rollout`);
    try {
      await deployFirmware({ version, firmwareUrl, firmwareHash, signatureB64: sigB64, canaryPercent: canaryPct });
      appendLog("info", "✓ Deploy accepted by orchestration layer");
    } catch {
      appendLog("warn", `Backend offline — deploy simulated locally`);
      setFleet((prev) => prev.map((d, i) => i % Math.round(100 / canaryPct) === 0
        ? { ...d, otaProgress: 1, otaVersion: version } : d));
      let prog = 1;
      const iv = setInterval(() => {
        prog += Math.floor(Math.random() * 8) + 4;
        if (prog >= 100) { prog = 100; clearInterval(iv); setDeploying(false); appendLog("info", "✓ OTA campaign complete"); }
        setFleet((prev) => prev.map((d) => d.otaVersion === version ? { ...d, otaProgress: prog } : d));
      }, 600);
      return;
    }
    setDeploying(false);
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
      <ScanLine />
      <div className="dashboard-root">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <div className="mono text-xs tracking-widest opacity-40 mb-1">MAHE MOBILITY CHALLENGE · SDV PLATFORM</div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-glow-cyan cursor-blink">
              Autonomous Vehicle Command Center
            </h1>
            <p className="text-sm opacity-40 mt-1 mono">Secure OTA · Fleet Telemetry · Threat Intelligence</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 glass rounded-lg px-4 py-2">
              <div className="relative">
                <div className="w-2 h-2 rounded-full" style={{ background: connected ? "#00ff88" : "#ffb800" }} />
                <div className="w-2 h-2 rounded-full absolute inset-0 pulse-ring" style={{ background: connected ? "#00ff88" : "#ffb800" }} />
              </div>
              <span className="mono text-xs" style={{ color: connected ? "#00ff88" : "#ffb800" }}>
                {connected ? "LIVE" : "DEMO MODE"}
              </span>
            </div>
            <div className="glass rounded-lg px-4 py-2 mono text-xs opacity-50">{now()}</div>
          </div>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <StatCard label="Fleet Size" value={stats.total} sub="active vehicles" color="#00f5ff" />
          <StatCard label="Vehicles Safe" value={stats.safe} sub={`${stats.total > 0 ? Math.round((stats.safe/stats.total)*100) : 0}% healthy`} color="#00ff88" />
          <StatCard label="Threat Warnings" value={stats.warn} sub="medium alerts" color="#ffb800" />
          <StatCard label="Critical Alerts" value={stats.high} sub="immediate action" color="#ff3366" />
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="glass rounded-2xl p-6 lg:col-span-1 border-glow-anim"
          >
            <div className="section-label mb-5">OTA DEPLOYMENT CONTROL</div>
            <div className="space-y-3">
              <div>
                <label className="mono text-xs opacity-50 block mb-1">FIRMWARE VERSION</label>
                <input className="input-cyber" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="e.g. 1.1.0" />
              </div>
              <div>
                <label className="mono text-xs opacity-50 block mb-1">FIRMWARE URL</label>
                <input className="input-cyber" value={firmwareUrl} onChange={(e) => setFirmwareUrl(e.target.value)} />
              </div>
              <div>
                <label className="mono text-xs opacity-50 block mb-1">SHA-256 HASH</label>
                <input className="input-cyber" value={firmwareHash} onChange={(e) => setFirmwareHash(e.target.value)} />
              </div>
              <div>
                <label className="mono text-xs opacity-50 block mb-1">ECC SIGNATURE (BASE64)</label>
                <input className="input-cyber" value={sigB64} onChange={(e) => setSigB64(e.target.value)} />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="mono text-xs opacity-50">CANARY ROLLOUT</label>
                  <span className="mono text-xs text-glow-cyan">{canaryPct}%</span>
                </div>
                <input
                  type="range" min={1} max={100} value={canaryPct}
                  onChange={(e) => setCanaryPct(Number(e.target.value))}
                  className="slider-cyber"
                  style={{ "--val": `${canaryPct}%` } as React.CSSProperties}
                />
                <div className="flex justify-between mono text-xs opacity-30 mt-1">
                  <span>1 vehicle</span><span>{Math.round(stats.total * canaryPct / 100)} of {stats.total}</span><span>Full fleet</span>
                </div>
              </div>

              <div className="glass rounded-xl p-4 space-y-2">
                <div className="section-label mb-2">SECURITY GATES</div>
                {[
                  ["TLS Tunnel", true, "#00ff88"],
                  ["ECC Signature Gate", true, "#00ff88"],
                  ["SHA-256 Integrity", true, "#00ff88"],
                  ["Rollback Guard", true, "#00ff88"],
                  ["Safety-Gate Check", stats.high === 0, stats.high === 0 ? "#00ff88" : "#ff3366"],
                ].map(([label, ok, col]) => (
                  <div key={String(label)} className="flex items-center justify-between">
                    <span className="text-xs opacity-50">{String(label)}</span>
                    <span className="mono text-xs" style={{ color: String(col) }}>{ok ? "✓" : "✗ BLOCKED"}</span>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onDeploy}
                disabled={deploying}
                className="btn-deploy"
                style={{ opacity: deploying ? 0.7 : 1 }}
              >
                {deploying ? "⟳  DEPLOYING…" : "▶  LAUNCH OTA CAMPAIGN"}
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="glass rounded-2xl p-6 lg:col-span-2"
          >
            <div className="section-label mb-5">LIVE FLEET — {fleet.length} VEHICLES</div>
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 max-h-[520px] overflow-y-auto pr-1 log-scroll">
              <AnimatePresence>
                {fleet.map((d) => (
                  <DeviceCard
                    key={d.deviceId}
                    d={d}
                    selected={selectedId === d.deviceId}
                    onClick={() => setSelectedId(selectedId === d.deviceId ? null : d.deviceId)}
                  />
                ))}
              </AnimatePresence>
              {fleet.length === 0 && (
                <div className="col-span-3 flex items-center justify-center h-40">
                  <p className="mono text-xs opacity-30">Loading fleet data…</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
          >
            <ECUDetailPanel device={selected} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <LogStream logs={logs} />
          </motion.div>
        </div>

        <div className="mt-8 text-center mono text-xs opacity-20">
          SDV SECURE OTA PLATFORM · MAHE MOBILITY CHALLENGE · {new Date().getFullYear()}
        </div>
      </div>
    </>
  );
}
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { deployFirmware, fetchFleet } from "@/lib/api";
import { DeviceState } from "@/types";

type LogLine = { id: number; level: "info" | "warn" | "error"; text: string; ts: string };

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
          { label: "Firmware Integrity", ok: device.integrityOk },
          { label: "Rollback Guard", ok: device.rollbackArmed },
        ].map(({ label, ok }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-xs opacity-60">{label}</span>
            <span className="mono text-xs" style={{ color: ok ? "#00ff88" : "#ff3366" }}>
              {ok ? "✓ ACTIVE" : "✗ FAIL"}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function LogStream({ logs }: { logs: LogLine[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = 0; }, [logs.length]);
  return (
    <div className="glass rounded-2xl p-6">
      <div className="section-label mb-4">LIVE EVENT STREAM</div>
      <div ref={ref} className="log-scroll space-y-1.5">
        <AnimatePresence initial={false}>
          {logs.map((l) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex gap-2 items-start"
            >
              <span className="mono text-xs opacity-30 shrink-0">{l.ts}</span>
              <span className="mono text-xs shrink-0" style={{
                color: l.level === "error" ? "#ff3366" : l.level === "warn" ? "#ffb800" : "#00f5ff"
              }}>[{l.level.toUpperCase()}]</span>
              <span className="mono text-xs opacity-70 break-all">{l.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {logs.length === 0 && <p className="mono text-xs opacity-20">Waiting for events…</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
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

  function appendLog(level: LogLine["level"], text: string) {
    setLogs((prev) => [{ id: Date.now() + Math.random(), level, text, ts: now() }, ...prev].slice(0, 120));
  }

  useEffect(() => {
    fetchFleet()
      .then((d) => { setFleet(d); appendLog("info", `Loaded ${d.length} devices from fleet API`); })
      .catch(() => appendLog("warn", "Backend offline — running demo simulation"));

    const wsBase = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080").replace(/^http/, "ws");
    let ws: WebSocket;
    try {
      ws = new WebSocket(`${wsBase}/ws/events`);
      ws.onopen = () => { setConnected(true); appendLog("info", "WebSocket connected to backend"); };
      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data) as { type: string; payload: DeviceState[] | Record<string, unknown> };
        if (msg.type === "fleet_tick" && Array.isArray(msg.payload)) setFleet(msg.payload);
        appendLog("info", `← ${msg.type}`);
      };
      ws.onerror = () => appendLog("error", "WebSocket error");
      ws.onclose = () => { setConnected(false); appendLog("warn", "WebSocket closed"); };
    } catch { appendLog("warn", "WebSocket unavailable"); }

    const sim = setInterval(() => {
      setFleet((prev) => {
        if (prev.length === 0) return prev;
        return prev.map((d) => {
          const r = Math.random();
          return {
            ...d,
            lastSeen: new Date().toISOString(),
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
      try { ws?.close(); } catch { }
    };
  }, []);

  useEffect(() => {
    if (tick === 0) return;
    if (tick % 3 === 0) appendLog("info", `fleet_tick · ${fleet.length} vehicles polled`);
    const unsafe = fleet.filter((d) => d.safetyState === "UNSAFE");
    if (unsafe.length > 0) appendLog("warn", `Safety alert: ${unsafe.map((d) => d.deviceId).join(", ")}`);
  }, [tick, fleet]);

  async function onDeploy() {
    if (deploying) return;
    setDeploying(true);
    appendLog("info", `▶ OTA deploy v${version} → ${canaryPct}% canary rollout`);
    try {
      await deployFirmware({ version, firmwareUrl, firmwareHash, signatureB64: sigB64, canaryPercent: canaryPct });
      appendLog("info", "✓ Deploy accepted by orchestration layer");
    } catch {
      appendLog("warn", `Backend offline — deploy simulated locally`);
      setFleet((prev) => prev.map((d, i) => i % Math.round(100 / canaryPct) === 0
        ? { ...d, otaProgress: 1, otaVersion: version } : d));
      let prog = 1;
      const iv = setInterval(() => {
        prog += Math.floor(Math.random() * 8) + 4;
        if (prog >= 100) { prog = 100; clearInterval(iv); setDeploying(false); appendLog("info", "✓ OTA campaign complete"); }
        setFleet((prev) => prev.map((d) => d.otaVersion === version ? { ...d, otaProgress: prog } : d));
      }, 600);
      return;
    }
    setDeploying(false);
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
      <ScanLine />
      <div className="dashboard-root">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <div className="mono text-xs tracking-widest opacity-40 mb-1">MAHE MOBILITY CHALLENGE · SDV PLATFORM</div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-glow-cyan cursor-blink">
              Autonomous Vehicle Command Center
            </h1>
            <p className="text-sm opacity-40 mt-1 mono">Secure OTA · Fleet Telemetry · Threat Intelligence</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 glass rounded-lg px-4 py-2">
              <div className="relative">
                <div className="w-2 h-2 rounded-full" style={{ background: connected ? "#00ff88" : "#ffb800" }} />
                <div className="w-2 h-2 rounded-full absolute inset-0 pulse-ring" style={{ background: connected ? "#00ff88" : "#ffb800" }} />
              </div>
              <span className="mono text-xs" style={{ color: connected ? "#00ff88" : "#ffb800" }}>
                {connected ? "LIVE" : "DEMO MODE"}
              </span>
            </div>
            <div className="glass rounded-lg px-4 py-2 mono text-xs opacity-50">{now()}</div>
          </div>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <StatCard label="Fleet Size" value={stats.total} sub="active vehicles" color="#00f5ff" />
          <StatCard label="Vehicles Safe" value={stats.safe} sub={`${stats.total > 0 ? Math.round((stats.safe/stats.total)*100) : 0}% healthy`} color="#00ff88" />
          <StatCard label="Threat Warnings" value={stats.warn} sub="medium alerts" color="#ffb800" />
          <StatCard label="Critical Alerts" value={stats.high} sub="immediate action" color="#ff3366" />
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="glass rounded-2xl p-6 lg:col-span-1 border-glow-anim"
          >
            <div className="section-label mb-5">OTA DEPLOYMENT CONTROL</div>
            <div className="space-y-3">
              <div>
                <label className="mono text-xs opacity-50 block mb-1">FIRMWARE VERSION</label>
                <input className="input-cyber" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="e.g. 1.1.0" />
              </div>
              <div>
                <label className="mono text-xs opacity-50 block mb-1">FIRMWARE URL</label>
                <input className="input-cyber" value={firmwareUrl} onChange={(e) => setFirmwareUrl(e.target.value)} />
              </div>
              <div>
                <label className="mono text-xs opacity-50 block mb-1">SHA-256 HASH</label>
                <input className="input-cyber" value={firmwareHash} onChange={(e) => setFirmwareHash(e.target.value)} />
              </div>
              <div>
                <label className="mono text-xs opacity-50 block mb-1">ECC SIGNATURE (BASE64)</label>
                <input className="input-cyber" value={sigB64} onChange={(e) => setSigB64(e.target.value)} />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="mono text-xs opacity-50">CANARY ROLLOUT</label>
                  <span className="mono text-xs text-glow-cyan">{canaryPct}%</span>
                </div>
                <input
                  type="range" min={1} max={100} value={canaryPct}
                  onChange={(e) => setCanaryPct(Number(e.target.value))}
                  className="slider-cyber"
                  style={{ "--val": `${canaryPct}%` } as React.CSSProperties}
                />
                <div className="flex justify-between mono text-xs opacity-30 mt-1">
                  <span>1 vehicle</span><span>{Math.round(stats.total * canaryPct / 100)} of {stats.total}</span><span>Full fleet</span>
                </div>
              </div>

              <div className="glass rounded-xl p-4 space-y-2">
                <div className="section-label mb-2">SECURITY GATES</div>
                {[
                  ["TLS Tunnel", true, "#00ff88"],
                  ["ECC Signature Gate", true, "#00ff88"],
                  ["SHA-256 Integrity", true, "#00ff88"],
                  ["Rollback Guard", true, "#00ff88"],
                  ["Safety-Gate Check", stats.high === 0, stats.high === 0 ? "#00ff88" : "#ff3366"],
                ].map(([label, ok, col]) => (
                  <div key={String(label)} className="flex items-center justify-between">
                    <span className="text-xs opacity-50">{String(label)}</span>
                    <span className="mono text-xs" style={{ color: String(col) }}>{ok ? "✓" : "✗ BLOCKED"}</span>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onDeploy}
                disabled={deploying}
                className="btn-deploy"
                style={{ opacity: deploying ? 0.7 : 1 }}
              >
                {deploying ? "⟳  DEPLOYING…" : "▶  LAUNCH OTA CAMPAIGN"}
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="glass rounded-2xl p-6 lg:col-span-2"
          >
            <div className="section-label mb-5">LIVE FLEET — {fleet.length} VEHICLES</div>
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 max-h-[520px] overflow-y-auto pr-1 log-scroll">
              <AnimatePresence>
                {fleet.map((d) => (
                  <DeviceCard
                    key={d.deviceId}
                    d={d}
                    selected={selectedId === d.deviceId}
                    onClick={() => setSelectedId(selectedId === d.deviceId ? null : d.deviceId)}
                  />
                ))}
              </AnimatePresence>
              {fleet.length === 0 && (
                <div className="col-span-3 flex items-center justify-center h-40">
                  <p className="mono text-xs opacity-30">Loading fleet data…</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
          >
            <ECUDetailPanel device={selected} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <LogStream logs={logs} />
          </motion.div>
        </div>

        <div className="mt-8 text-center mono text-xs opacity-20">
          SDV SECURE OTA PLATFORM · MAHE MOBILITY CHALLENGE · {new Date().getFullYear()}
        </div>
      </div>
    </>
  );
}
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
