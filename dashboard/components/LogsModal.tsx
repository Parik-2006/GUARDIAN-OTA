"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { P } from "./theme";
import I from "./Icon";

// Shape returned by GET /api/events
interface BackendEvent {
  id: string;
  eventType: string; // CamelCase from Go
  payload: Record<string, any>;
  createdAt: string; // CamelCase from Go
}

type FilterKey = "all" | "ota" | "device" | "blockchain";

function eventToRow(e: BackendEvent) {
  const ts = new Date(e.createdAt);
  const isOta     = e.eventType === "ota_deploy_requested";
  const isDevice  = e.eventType === "device_status";
  const isChain   = !!e.payload?.tx;

  // Derive a human-readable message
  let message = "";
  let icon = "info";
  let color = P.whisper;
  let tag: string | null = null;

  if (isDevice) {
    const dev    = e.payload?.device_id ?? e.payload?.DeviceID ?? "";
    const status = e.payload?.status    ?? e.payload?.Status   ?? "";
    message = `Device ${dev} → ${status.toUpperCase()}`;
    icon  = status === "success" ? "check_circle"  :
            status === "error"   ? "cancel"         :
            status === "ack"     ? "wifi"            :
            status === "downloading" ? "download"   :
            status === "verifying"   ? "verified_user" :
            status === "online"      ? "cloud_done"  : "sensors";
    color = status === "success" ? P.sage  :
            status === "error"   ? P.burg  :
            status === "online"  ? P.sage  : P.cognac;
    tag   = dev;
  } else if (isOta) {
    const camp = e.payload?.campaign?.id ?? e.payload?.campaignId ?? "";
    const ver  = e.payload?.campaign?.version ?? e.payload?.version ?? "";
    const tgts = e.payload?.campaign?.targets?.length ?? e.payload?.count ?? 0;
    message = `OTA campaign ${camp.slice(-8)} dispatched · v${ver} → ${tgts} device(s)`;
    icon  = "cloud_upload";
    color = P.cognac;
    tag   = camp;
  } else if (isChain) {
    message = `Blockchain hash logged → ${String(e.payload.tx).slice(0, 18)}...`;
    icon  = "link";
    color = P.copper;
    tag   = e.payload.tx;
  } else {
    message = e.eventType.replace(/_/g, " ");
    icon    = "receipt_long";
  }

  return { id: e.id, ts, message, icon, color, tag, filter: (isOta || isChain) ? "ota" : isDevice ? "device" : "all" as FilterKey };
}

export default function LogsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [events, setEvents]   = useState<ReturnType<typeof eventToRow>[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter]   = useState<FilterKey>("all");
  const [limit, setLimit]     = useState(100);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/events?limit=${limit}`)
      .then(r => r.json())
      .then(d => {
        const rows: BackendEvent[] = d.events ?? [];
        setEvents(rows.map(eventToRow)); // Go returns newest first via SQL ORDER BY created_at DESC
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [limit]);

  // Load on open
  useEffect(() => { if (open) load(); }, [open, load]);

  const filtered = filter === "all" ? events : events.filter(e => e.filter === filter);

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all",        label: "All" },
    { key: "device",     label: "Devices" },
    { key: "ota",        label: "OTA / Chain" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "fixed", inset: 0, zIndex: 999,
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            style={{
              background: P.wall, border: `1px solid ${P.bHi}`,
              borderRadius: 6, padding: "28px 32px",
              width: "min(860px, 92vw)", height: "min(620px, 92vh)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(200,145,74,0.12)",
              display: "flex", flexDirection: "column",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, background: P.cgnDim, borderRadius: 4,
                  border: `1px solid ${P.bHi}`, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <I n="history" f sz={20} col={P.cognac} />
                </div>
                <div>
                  <h2 style={{
                    fontFamily: "'Cormorant Garamond',serif", fontWeight: 700,
                    fontSize: "1.1rem", color: P.ivory, letterSpacing: "0.04em",
                  }}>Activity Logs</h2>
                  <p style={{
                    fontFamily: "'JetBrains Mono',monospace", fontSize: "0.52rem",
                    color: P.whisper, letterSpacing: "0.14em",
                  }}>LIVE · DATABASE-BACKED · BLOCKCHAIN ANCHORED</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* Refresh */}
                <button
                  onClick={load}
                  style={{
                    background: P.cockpit, border: `1px solid ${P.bMid}`, borderRadius: 3,
                    color: P.whisper, cursor: "pointer", padding: "5px 10px",
                    fontFamily: "'JetBrains Mono',monospace", fontSize: "0.58rem",
                    display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  <I n="refresh" sz={13} col={loading ? P.cognac : P.whisper} />
                  {loading ? "Loading..." : "Refresh"}
                </button>
                <button
                  onClick={onClose}
                  style={{ background: "transparent", border: "none", color: P.whisper, cursor: "pointer", fontSize: "1.3rem" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = P.cognac; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = P.whisper; }}
                >✕</button>
              </div>
            </div>

            {/* Filter + limit row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, borderBottom: `1px solid ${P.bDim}`, paddingBottom: 10 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    style={{
                      padding: "5px 12px",
                      background: filter === f.key ? P.cgnDim : "transparent",
                      color: filter === f.key ? P.cognac : P.whisper,
                      border: `1px solid ${filter === f.key ? P.bHi : P.bDim}`,
                      borderRadius: 3,
                      fontFamily: "'JetBrains Mono',monospace", fontSize: "0.58rem",
                      textTransform: "uppercase", cursor: "pointer", transition: "all 0.18s",
                    }}
                  >{f.label}</button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.55rem", color: P.whisper }}>
                <span>Show</span>
                {[50, 100, 250].map(n => (
                  <button
                    key={n}
                    onClick={() => { setLimit(n); load(); }}
                    style={{
                      background: limit === n ? P.cgnDim : "transparent",
                      border: `1px solid ${limit === n ? P.bHi : P.bDim}`,
                      color: limit === n ? P.cognac : P.whisper,
                      borderRadius: 3, padding: "3px 8px", cursor: "pointer",
                      fontFamily: "'JetBrains Mono',monospace", fontSize: "0.55rem",
                    }}
                  >{n}</button>
                ))}
              </div>
            </div>

            {/* Log list */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {loading && events.length === 0 ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: P.whisper, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem" }}>
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4 }}>
                    Loading events from database...
                  </motion.div>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: P.whisper, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem" }}>
                  No events found
                </div>
              ) : filtered.map((row, i) => (
                <motion.div
                  key={row.id + i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.015, 0.3), duration: 0.25 }}
                  style={{
                    display: "flex", gap: 12, padding: "10px 14px",
                    background: "rgba(240,235,224,0.02)", border: `1px solid rgba(240,235,224,0.06)`,
                    borderRadius: 4, transition: "all 0.18s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(240,235,224,0.05)";
                    e.currentTarget.style.borderColor = "rgba(240,235,224,0.12)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(240,235,224,0.02)";
                    e.currentTarget.style.borderColor = "rgba(240,235,224,0.06)";
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 30, height: 30, borderRadius: 3, background: P.cockpit,
                    border: `1px solid ${P.bMid}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <I n={row.icon} sz={15} col={row.color} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8 }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono',monospace", fontSize: "0.67rem",
                        color: P.ivory, lineHeight: 1.4,
                      }}>{row.message}</span>
                      <span style={{
                        fontFamily: "'JetBrains Mono',monospace", fontSize: "0.52rem",
                        color: P.whisper, whiteSpace: "nowrap", flexShrink: 0,
                      }}>
                        {row.ts.toLocaleString("en-GB", { hour12: false, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
                    {row.tag && (
                      <span style={{
                        display: "inline-block", marginTop: 4,
                        fontFamily: "'JetBrains Mono',monospace", fontSize: "0.5rem",
                        color: row.color, background: `${row.color}18`,
                        border: `1px solid ${row.color}30`,
                        padding: "2px 7px", borderRadius: 3,
                        maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{row.tag}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              borderTop: `1px solid ${P.bDim}`, paddingTop: 10, marginTop: 10,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              fontFamily: "'JetBrains Mono',monospace", fontSize: "0.55rem", color: P.whisper,
            }}>
              <span>{filtered.length} entries shown</span>
              <span>{events.length} total events retrieved from database</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
