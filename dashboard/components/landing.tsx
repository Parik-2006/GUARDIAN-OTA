"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";


/* ══════════════════════════════════════════
   PARTICLE FIELD
══════════════════════════════════════════ */
function ParticleField() {
  // FIX: generate nodes only on client to avoid SSR/hydration mismatch
  // (Math.random() produces different values server vs client)
  const [nodes, setNodes] = useState<Array<{
    id: number; x: number; y: number; size: number; delay: number; dur: number;
  }>>([]);

  useEffect(() => {
    setNodes(
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 6,
        dur: 5 + Math.random() * 8,
      }))
    );
  }, []);

  return (
    <div className="lp-particle-field" aria-hidden>
      {nodes.map((n) => (
        <div
          key={n.id}
          className="lp-node"
          style={{
            left: `${n.x}%`,
            top: `${n.y}%`,
            width: n.size,
            height: n.size,
            animationDelay: `${n.delay}s`,
            animationDuration: `${n.dur}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   ORBITAL RING
══════════════════════════════════════════ */
function OrbitalRing() {
  return (
    <div className="lp-orbital-wrap">
      <svg viewBox="0 0 400 400" className="lp-orbital-svg">
        <defs>
          <radialGradient id="orbGlow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#D4A96A" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#D4A96A" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ellipse cx="200" cy="200" rx="180" ry="60" fill="none" stroke="rgba(212,169,106,0.15)" strokeWidth="1.5" />
        <ellipse cx="200" cy="200" rx="180" ry="60" fill="none" stroke="url(#orbGlow)" strokeWidth="0.5" style={{ animation: "spin-cw 12s linear infinite" }} />
        <ellipse cx="200" cy="200" rx="120" ry="40" fill="none" stroke="rgba(106,157,184,0.12)" strokeWidth="1" style={{ animation: "spin-ccw 9s linear infinite" }} />
        <ellipse cx="200" cy="200" rx="60" ry="180" fill="none" stroke="rgba(212,169,106,0.1)" strokeWidth="1" style={{ animation: "spin-cw 15s linear infinite" }} />
        <circle cx="200" cy="200" r="38" fill="rgba(212,169,106,0.06)" stroke="rgba(212,169,106,0.35)" strokeWidth="1.5" filter="url(#glow)" />
        <circle cx="200" cy="200" r="22" fill="rgba(212,169,106,0.1)" stroke="rgba(212,169,106,0.5)" strokeWidth="1" />
        <circle cx="200" cy="200" r="9" fill="rgba(212,169,106,0.6)" filter="url(#glow)" />

        {[0, 120, 240].map((deg, i) => (
          <g key={i} style={{ animation: `spin-cw ${8 + i * 2}s linear infinite`, transformOrigin: "200px 200px" }}>
            <circle cx={200 + 180 * Math.cos((deg * Math.PI) / 180)} cy={200 + 60 * Math.sin((deg * Math.PI) / 180)} r="5" fill="#D4A96A" opacity="0.7" filter="url(#glow)" />
          </g>
        ))}
        {[-80, 0, 80].map((y, i) => (
          <line key={i} x1="30" y1={200 + y * 0.33} x2="370" y2={200 + y * 0.33} stroke="rgba(240,235,224,0.04)" strokeWidth="0.5" />
        ))}
        {[60, 120, 180, 240, 300].map((x, i) => (
          <line key={i} x1={x} y1="40" x2={x} y2="360" stroke="rgba(240,235,224,0.03)" strokeWidth="0.5" />
        ))}
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════
   GLASS STAT CARD
══════════════════════════════════════════ */
function GlassStatCard({ icon, value, label, sub, delay = 0 }: {
  icon: string; value: string; label: string; sub?: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="lp-glass-card"
    >
      <div className="lp-card-shine" />
      <span className="lp-card-icon">{icon}</span>
      <p className="lp-card-val">{value}</p>
      <p className="lp-card-label">{label}</p>
      {sub && <p className="lp-card-sub">{sub}</p>}
    </motion.div>
  );
}



/* ══════════════════════════════════════════
   FEATURE ROW
══════════════════════════════════════════ */
function FeatureRow({ items }: { items: { icon: string; title: string; desc: string }[] }) {
  return (
    <div className="lp-feature-row">
      {items.map((item, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.55 }} className="lp-feature-card">
          <div className="lp-feature-shine" />
          <h3 className="lp-feature-title">{item.title}</h3>
          <p className="lp-feature-desc">{item.desc}</p>
        </motion.div>
      ))
    </div>
  );
}

/* ══════════════════════════════════════════
   SECURITY BADGES
══════════════════════════════════════════ */
function SecurityBadges() {
  const badges = [
    { label: "ECC P-256", color: "#7AB88A" },
    { label: "SHA-256",   color: "#D4A96A" },
    { label: "TLS 1.3",  color: "#6A9DB8" },
    { label: "MQTT/S",   color: "#D4956A" },
    { label: "eFuse MAC", color: "#7AB88A" },
    { label: "OTA Rollback", color: "#D4A96A" },
  ];
  return (
    <div className="lp-badge-row">
      {badges.map((b, i) => (
        <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="lp-badge" style={{ borderColor: `${b.color}44`, color: b.color, background: `${b.color}12` }}>
          {b.label}
        </motion.span>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   STACK ROW
══════════════════════════════════════════ */
function StackRow() {
  const stack = [
    { layer: "Edge",      name: "ESP32 + FreeRTOS",  detail: "mbedTLS · ESP-IDF OTA",                 color: "#D4A96A" },
    { layer: "Messaging", name: "Mosquitto MQTT",     detail: "TLS · MQTTS:8883",                       color: "#6A9DB8" },
    { layer: "Storage",   name: "MinIO S3",           detail: "Firmware Artifacts · Signed Manifest",   color: "#D4956A" },
    { layer: "Backend",   name: "Go + Gin",           detail: "WebSocket · PostgreSQL · MQTT",          color: "#7AB88A" },
    { layer: "Frontend",  name: "Next.js 14",         detail: "App Router · Framer Motion · TailwindCSS", color: "#D4A96A" },
  ];
  return (
    <div className="lp-stack-col">
      {stack.map((s, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.09 }} className="lp-stack-row">
          <div className="lp-stack-shine" />
          <span className="lp-stack-layer" style={{ color: s.color }}>{s.layer}</span>
          <span className="lp-stack-name">{s.name}</span>
          <span className="lp-stack-detail">{s.detail}</span>
          <div className="lp-stack-bar" style={{ background: `${s.color}22`, borderColor: `${s.color}33` }}>
            <motion.div className="lp-stack-fill" style={{ background: s.color }} initial={{ width: 0 }} whileInView={{ width: "100%" }} viewport={{ once: true }} transition={{ delay: i * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   NAV
══════════════════════════════════════════ */
function Nav({ onNav }: { onNav: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <motion.nav initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className={`lp-nav ${scrolled ? "lp-nav--scrolled" : ""}`}>
      <div className="lp-nav-inner">
        <div className="lp-nav-brand">
          <span className="lp-nav-name">GUARDIAN<span style={{ color: "var(--lp-gold)" }}>·OTA</span></span>
        </div>
        <div className="lp-nav-links">
          <a href="#architecture" className="lp-nav-link">Architecture</a>
          <a href="#security"     className="lp-nav-link">Security</a>
          <a href="#stack"        className="lp-nav-link">Stack</a>
          <button onClick={onNav} className="lp-nav-cta">
            <span>Open Dashboard</span>
            <span className="lp-nav-cta-arrow">→</span>
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

/* ══════════════════════════════════════════
   MAIN LANDING
   FIX: removed inline <style> tag entirely — all CSS is now in globals.css.
   This eliminates the Next.js hydration error caused by the server HTML-encoding
   single quotes (') as &#x27; while the client renders them as literal quotes.
══════════════════════════════════════════ */
export default function Landing({ onEnterDashboard }: { onEnterDashboard: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ background: "#060606", height: "100vh", width: "100vw" }} />;
  
  return (
    <div className="lp-root">
      <ParticleField />
      <div className="lp-grid-bg" aria-hidden />
      <Nav onNav={onEnterDashboard} />

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-top">
          <div className="lp-hero-left">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="lp-hero-eyebrow">
              MAHE Mobility Challenge · Secure Embedded Systems
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="lp-hero-title">
              SECURE <em>OTA</em><br />ORCHESTRATION
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.65 }} className="lp-hero-sub">
              Production-style autonomous vehicle update stack — ESP32 edge gateway,
              cryptographically signed firmware delivery, real-time fleet telemetry
              and canary rollout orchestration.
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.5 }} className="lp-hero-cta-row">
              <button className="lp-cta-primary" onClick={onEnterDashboard}>
                ▶ &nbsp; Open Command Center
              </button>
              <button className="lp-cta-secondary" onClick={() => document.getElementById("architecture")?.scrollIntoView({ behavior: "smooth" })}>
                View Architecture ↓
              </button>
            </motion.div>
          </div>
          <OrbitalRing />
        </div>

        <div className="lp-stat-row">
          <GlassStatCard icon="◈" value="20"   label="Fleet Vehicles"  sub="Simulated ECUs"     delay={0.45} />
          <GlassStatCard icon="⬡" value="6"    label="Security Gates"  sub="Cryptographic"      delay={0.52} />
          <GlassStatCard icon="◎" value="P-256" label="ECC Signature"  sub="mbedTLS"            delay={0.58} />
          <GlassStatCard icon="▣" value="∞"    label="Live Events"     sub="WebSocket stream"   delay={0.65} />
        </div>
      </section>

      <div className="lp-divider" />

      {/* ARCHITECTURE */}
      <section className="lp-section" id="architecture">
        <p className="lp-section-label">01 · Architecture</p>
        <h2 className="lp-section-h2">End-to-End <em>Secure</em> Pipeline</h2>
        <p className="lp-section-body">
          A single ESP32 hosts the full edge runtime — four virtual ECUs communicating over a simulated CAN bus, with the OTA task safety-gated by the brake ECU. The Go backend orchestrates canary campaigns, persists events to PostgreSQL, and streams state to the dashboard over WebSockets.
        </p>
        <FeatureRow items={[
          { icon: "◈", title: "ESP32 Edge Gateway",     desc: "FreeRTOS task mesh with simulated CAN queue transport. Brake, powertrain, sensor and infotainment ECUs running concurrently." },
          { icon: "⬡", title: "Mosquitto MQTT Broker",  desc: "TLS-encrypted command channel on port 8883. OTA commands published to sdv/ota/command topic with QoS 1." },
          { icon: "◎", title: "MinIO Firmware Store",   desc: "S3-compatible artifact hosting for signed firmware binaries and ECC manifests. Separate from broker plane." },
          { icon: "▣", title: "Go Control Plane",       desc: "Canary target selection, event persistence, WebSocket broadcast hub. CORS-enabled REST API at :8080." },
          { icon: "⬥", title: "PostgreSQL Audit Log",   desc: "Immutable ota_events table with JSONB payloads. Every deployment and fleet tick recorded for compliance." },
          { icon: "◇", title: "Next.js Dashboard",      desc: "App Router cockpit with live WebSocket feed, Framer Motion animations, and 3D SVG fleet visualisations." },
        ]} />
      </section>

      <div className="lp-divider" />

      {/* SECURITY */}
      <section className="lp-section" id="security">
        <p className="lp-section-label">02 · Security Controls</p>
        <h2 className="lp-section-h2">Cryptographic <em>Defense</em> Chain</h2>
        <p className="lp-section-body">
          Every layer of the update pipeline is hardened — from hardware identity pinning on the ESP32 eFuse MAC, through TLS transport and ECC payload verification, to automatic rollback on health-check failure.
        </p>
        <SecurityBadges />
        <FeatureRow items={[
          { icon: "", title: "ECC P-256 Signature",  desc: "mbedTLS verifies OTA payload against embedded public key. Prevents forged firmware and supply-chain tampering." },
          { icon: "", title: "SHA-256 Integrity",    desc: "Firmware binary hash compared to signed manifest. Prevents corruption replay and altered binary attacks." },
          { icon: "",  title: "Safety Gate",          desc: "OTA blocked when brake ECU reports UNSAFE state. No updates during active safety-critical conditions." },
          { icon: "",  title: "Automatic Rollback",   desc: "ESP-IDF dual-partition scheme — failed health-check triggers esp_ota_mark_app_invalid_rollback_and_reboot." },
          { icon: "", title: "TLS MQTT Transport",   desc: "Encrypted command channel prevents MITM sniffing and injection on OTA command topics." },
          { icon: "", title: "eFuse MAC Identity",   desc: "Device-specific identity derived from immutable hardware MAC. Prevents logical node spoofing." },
        ]} />
      </section>

      <div className="lp-divider" />

      {/* STACK */}
      <section className="lp-section" id="stack">
        <p className="lp-section-label">03 · Technology Stack</p>
        <h2 className="lp-section-h2">Full-Stack <em>Embedded</em> Platform</h2>
        <p className="lp-section-body">
          From bare-metal C on ESP-IDF through Go microservices to a cinematic Next.js dashboard — every layer chosen for production readiness and security posture.
        </p>
        <StackRow />
      </section>

      <div className="lp-divider" />

      {/* FOOTER CTA */}
      <section style={{ position: "relative", zIndex: 1, padding: "80px 32px", textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="lp-section-label" style={{ justifyContent: "center" }}>Ready</p>
          <h2 className="lp-section-h2">Enter the <em>Command Center</em></h2>
          <p className="lp-section-body" style={{ margin: "0 auto 36px" }}>
            Live fleet telemetry, OTA deployment controls, 3D visualisations and real-time security event stream.
          </p>
          <button className="lp-cta-primary" onClick={onEnterDashboard} style={{ fontSize: "1rem", padding: "16px 48px" }}>
            ▶ &nbsp; Open Dashboard
          </button>
        </motion.div>
      </section>

      <footer className="lp-footer">
        {/* FIX: new Date().getFullYear() produces different output server vs client
            if the year rolls over mid-request. Suppress hydration warning here. */}
        <p className="lp-footer-text" suppressHydrationWarning>
          SDV Secure OTA · MAHE Mobility Challenge · {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
