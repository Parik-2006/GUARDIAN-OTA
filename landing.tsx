"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

/* ══════════════════════════════════════════
   PARTICLE FIELD — floating hex nodes
══════════════════════════════════════════ */
function ParticleField() {
  const [nodes] = useState(() =>
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 6,
      dur: 5 + Math.random() * 8,
    }))
  );
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
   ORBITAL RING — animated 3D ring graphic
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
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* outer ring */}
        <ellipse cx="200" cy="200" rx="180" ry="60" fill="none"
          stroke="rgba(212,169,106,0.15)" strokeWidth="1.5" />
        <ellipse cx="200" cy="200" rx="180" ry="60" fill="none"
          stroke="url(#orbGlow)" strokeWidth="0.5"
          style={{ animation: "spin-cw 12s linear infinite" }} />

        {/* inner ring */}
        <ellipse cx="200" cy="200" rx="120" ry="40" fill="none"
          stroke="rgba(106,157,184,0.12)" strokeWidth="1"
          style={{ animation: "spin-ccw 9s linear infinite" }} />

        {/* vertical ring */}
        <ellipse cx="200" cy="200" rx="60" ry="180" fill="none"
          stroke="rgba(212,169,106,0.1)" strokeWidth="1"
          style={{ animation: "spin-cw 15s linear infinite" }} />

        {/* core sphere */}
        <circle cx="200" cy="200" r="38" fill="rgba(212,169,106,0.06)"
          stroke="rgba(212,169,106,0.35)" strokeWidth="1.5" filter="url(#glow)" />
        <circle cx="200" cy="200" r="22" fill="rgba(212,169,106,0.1)"
          stroke="rgba(212,169,106,0.5)" strokeWidth="1" />
        <circle cx="200" cy="200" r="9" fill="rgba(212,169,106,0.6)" filter="url(#glow)" />

        {/* orbiting dots */}
        {[0, 120, 240].map((deg, i) => (
          <g key={i} style={{ animation: `spin-cw ${8 + i * 2}s linear infinite`, transformOrigin: "200px 200px" }}>
            <circle
              cx={200 + 180 * Math.cos((deg * Math.PI) / 180)}
              cy={200 + 60 * Math.sin((deg * Math.PI) / 180)}
              r="5" fill="#D4A96A" opacity="0.7" filter="url(#glow)"
            />
          </g>
        ))}

        {/* grid lines */}
        {[-80, 0, 80].map((y, i) => (
          <line key={i} x1="30" y1={200 + y * 0.33} x2="370" y2={200 + y * 0.33}
            stroke="rgba(240,235,224,0.04)" strokeWidth="0.5" />
        ))}
        {[60, 120, 180, 240, 300].map((x, i) => (
          <line key={i} x1={x} y1="40" x2={x} y2="360"
            stroke="rgba(240,235,224,0.03)" strokeWidth="0.5" />
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
function FeatureRow({ items }: {
  items: { icon: string; title: string; desc: string }[];
}) {
  return (
    <div className="lp-feature-row">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08, duration: 0.55 }}
          className="lp-feature-card"
        >
          <div className="lp-feature-shine" />
          <div className="lp-feature-icon">{item.icon}</div>
          <h3 className="lp-feature-title">{item.title}</h3>
          <p className="lp-feature-desc">{item.desc}</p>
        </motion.div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   SECURITY BADGE ROW
══════════════════════════════════════════ */
function SecurityBadges() {
  const badges = [
    { label: "ECC P-256", color: "#7AB88A" },
    { label: "SHA-256", color: "#D4A96A" },
    { label: "TLS 1.3", color: "#6A9DB8" },
    { label: "MQTT/S", color: "#D4956A" },
    { label: "eFuse MAC", color: "#7AB88A" },
    { label: "OTA Rollback", color: "#D4A96A" },
  ];
  return (
    <div className="lp-badge-row">
      {badges.map((b, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.06 }}
          className="lp-badge"
          style={{ borderColor: `${b.color}44`, color: b.color, background: `${b.color}12` }}
        >
          {b.label}
        </motion.span>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   STACK ITEM
══════════════════════════════════════════ */
function StackRow() {
  const stack = [
    { layer: "Edge", name: "ESP32 + FreeRTOS", detail: "mbedTLS · ESP-IDF OTA", color: "#D4A96A" },
    { layer: "Messaging", name: "Mosquitto MQTT", detail: "TLS · MQTTS:8883", color: "#6A9DB8" },
    { layer: "Storage", name: "MinIO S3", detail: "Firmware Artifacts · Signed Manifest", color: "#D4956A" },
    { layer: "Backend", name: "Go + Gin", detail: "WebSocket · PostgreSQL · MQTT", color: "#7AB88A" },
    { layer: "Frontend", name: "Next.js 14", detail: "App Router · Framer Motion · TailwindCSS", color: "#D4A96A" },
  ];
  return (
    <div className="lp-stack-col">
      {stack.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.09 }}
          className="lp-stack-row"
        >
          <div className="lp-stack-shine" />
          <span className="lp-stack-layer" style={{ color: s.color }}>{s.layer}</span>
          <span className="lp-stack-name">{s.name}</span>
          <span className="lp-stack-detail">{s.detail}</span>
          <div className="lp-stack-bar" style={{ background: `${s.color}22`, borderColor: `${s.color}33` }}>
            <motion.div
              className="lp-stack-fill"
              style={{ background: s.color }}
              initial={{ width: 0 }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
            />
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
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`lp-nav ${scrolled ? "lp-nav--scrolled" : ""}`}
    >
      <div className="lp-nav-inner">
        <div className="lp-nav-brand">
          <span className="lp-nav-glyph">◈</span>
          <span className="lp-nav-name">SDV<span style={{ color: "var(--lp-gold)" }}>·OTA</span></span>
        </div>
        <div className="lp-nav-links">
          <a href="#architecture" className="lp-nav-link">Architecture</a>
          <a href="#security" className="lp-nav-link">Security</a>
          <a href="#stack" className="lp-nav-link">Stack</a>
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
══════════════════════════════════════════ */
export default function Landing({ onEnterDashboard }: { onEnterDashboard: () => void }) {
  return (
    <>
      <style>{`
        :root {
          --lp-bg: #09080A;
          --lp-cream: #F0EBE0;
          --lp-cream-dim: rgba(240,235,224,0.55);
          --lp-cream-faint: rgba(240,235,224,0.15);
          --lp-gold: #D4A96A;
          --lp-gold-dim: rgba(212,169,106,0.15);
          --lp-gold-glow: rgba(212,169,106,0.3);
          --lp-slate: #6A9DB8;
          --lp-safe: #7AB88A;
          --lp-surface: rgba(240,235,224,0.035);
          --lp-border: rgba(240,235,224,0.07);
          --lp-gold-border: rgba(212,169,106,0.25);
        }

        .lp-root {
          min-height: 100vh;
          background: var(--lp-bg);
          color: var(--lp-cream);
          font-family: 'DM Sans', sans-serif;
          overflow-x: hidden;
          position: relative;
        }

        /* Atmospheric bg */
        .lp-root::before {
          content:'';
          position:fixed; inset:0;
          background:
            radial-gradient(ellipse 70% 55% at 15% 8%, rgba(212,169,106,0.055) 0%, transparent 58%),
            radial-gradient(ellipse 55% 45% at 85% 10%, rgba(106,157,184,0.04) 0%, transparent 55%),
            radial-gradient(ellipse 45% 38% at 50% 100%, rgba(122,184,138,0.03) 0%, transparent 52%);
          pointer-events:none; z-index:0;
        }

        .lp-grid-bg {
          position:fixed; inset:0;
          background-image:
            linear-gradient(rgba(240,235,224,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(240,235,224,0.022) 1px, transparent 1px);
          background-size:56px 56px;
          pointer-events:none; z-index:0;
        }

        /* NAV */
        .lp-nav {
          position: fixed; top:0; left:0; right:0; z-index:100;
          transition: background 0.3s, border-color 0.3s, backdrop-filter 0.3s;
        }
        .lp-nav--scrolled {
          background: rgba(9,8,10,0.78);
          border-bottom: 1px solid rgba(212,169,106,0.15);
          backdrop-filter: blur(20px);
        }
        .lp-nav-inner {
          max-width:1400px; margin:0 auto;
          padding:18px 32px;
          display:flex; align-items:center; justify-content:space-between;
        }
        .lp-nav-brand { display:flex; align-items:center; gap:10px; }
        .lp-nav-glyph { font-size:1.3rem; color:var(--lp-gold); filter:drop-shadow(0 0 8px rgba(212,169,106,0.5)); }
        .lp-nav-name {
          font-family:'Rajdhani',sans-serif; font-weight:700;
          font-size:1.15rem; letter-spacing:0.08em; color:var(--lp-cream);
        }
        .lp-nav-links { display:flex; align-items:center; gap:32px; }
        .lp-nav-link {
          font-family:'JetBrains Mono',monospace; font-size:0.62rem;
          letter-spacing:0.15em; text-transform:uppercase;
          color:rgba(240,235,224,0.35); text-decoration:none;
          transition:color 0.2s;
        }
        .lp-nav-link:hover { color:var(--lp-gold); }
        .lp-nav-cta {
          background:rgba(212,169,106,0.1);
          border:1px solid rgba(212,169,106,0.38);
          color:var(--lp-gold);
          font-family:'Rajdhani',sans-serif; font-weight:600;
          font-size:0.78rem; letter-spacing:0.12em; text-transform:uppercase;
          padding:9px 20px; border-radius:4px; cursor:pointer;
          display:flex; align-items:center; gap:8px;
          transition:all 0.22s;
        }
        .lp-nav-cta:hover {
          background:rgba(212,169,106,0.18);
          border-color:rgba(212,169,106,0.7);
          box-shadow:0 0 24px rgba(212,169,106,0.2);
          color:#F0EBE0;
        }
        .lp-nav-cta-arrow { transition:transform 0.2s; }
        .lp-nav-cta:hover .lp-nav-cta-arrow { transform:translateX(4px); }

        /* HERO */
        .lp-hero {
          position:relative; z-index:1;
          min-height:100vh;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          text-align:center;
          padding:120px 24px 80px;
        }
        .lp-hero-eyebrow {
          font-family:'JetBrains Mono',monospace; font-size:0.62rem;
          letter-spacing:0.25em; text-transform:uppercase;
          color:rgba(212,169,106,0.6); margin-bottom:24px;
          display:flex; align-items:center; gap:10px;
        }
        .lp-hero-eyebrow::before, .lp-hero-eyebrow::after {
          content:''; flex:1; max-width:60px; height:1px;
          background:linear-gradient(90deg, transparent, rgba(212,169,106,0.4), transparent);
        }
        .lp-hero-title {
          font-family:'Rajdhani',sans-serif; font-weight:700;
          font-size:clamp(2.8rem, 7vw, 5.5rem);
          line-height:1.05; letter-spacing:0.04em;
          color:var(--lp-cream); margin-bottom:12px;
        }
        .lp-hero-title em {
          font-style:normal; color:var(--lp-gold);
          text-shadow:0 0 60px rgba(212,169,106,0.3);
        }
        .lp-hero-sub {
          font-size:clamp(0.9rem,1.8vw,1.15rem);
          color:rgba(240,235,224,0.35); max-width:620px;
          line-height:1.7; margin-bottom:48px;
        }
        .lp-hero-cta-row { display:flex; gap:16px; justify-content:center; flex-wrap:wrap; margin-bottom:64px; }
        .lp-cta-primary {
          background:rgba(212,169,106,0.12);
          border:1px solid rgba(212,169,106,0.5);
          color:var(--lp-gold);
          font-family:'Rajdhani',sans-serif; font-weight:600;
          font-size:0.9rem; letter-spacing:0.1em; text-transform:uppercase;
          padding:14px 36px; border-radius:4px; cursor:pointer;
          transition:all 0.25s;
          position:relative; overflow:hidden;
        }
        .lp-cta-primary::before {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg, rgba(212,169,106,0.08) 0%, transparent 60%);
          opacity:0; transition:opacity 0.25s;
        }
        .lp-cta-primary:hover { box-shadow:0 0 32px rgba(212,169,106,0.22); color:#F0EBE0; border-color:rgba(212,169,106,0.8); }
        .lp-cta-primary:hover::before { opacity:1; }
        .lp-cta-secondary {
          background:transparent;
          border:1px solid rgba(240,235,224,0.1);
          color:rgba(240,235,224,0.45);
          font-family:'JetBrains Mono',monospace;
          font-size:0.65rem; letter-spacing:0.12em; text-transform:uppercase;
          padding:14px 28px; border-radius:4px; cursor:pointer;
          transition:all 0.22s;
        }
        .lp-cta-secondary:hover { border-color:rgba(240,235,224,0.25); color:rgba(240,235,224,0.65); }

        /* STATS */
        .lp-stat-row {
          display:grid; grid-template-columns:repeat(4,1fr);
          gap:16px; width:100%; max-width:900px; position:relative; z-index:1;
        }
        @media(max-width:768px){ .lp-stat-row{grid-template-columns:repeat(2,1fr);} }

        /* GLASS CARD */
        .lp-glass-card {
          background:rgba(240,235,224,0.033);
          border:1px solid rgba(240,235,224,0.07);
          border-radius:8px;
          padding:22px 18px;
          text-align:center;
          position:relative; overflow:hidden;
          cursor:default;
          transition:border-color 0.3s, box-shadow 0.3s, transform 0.3s;
          backdrop-filter:blur(16px);
        }
        .lp-glass-card::before {
          content:'';
          position:absolute; top:0; left:-60%;
          width:60%; height:100%;
          background:linear-gradient(90deg, transparent, rgba(212,169,106,0.06), transparent);
          transform:skewX(-20deg);
          transition:left 0.5s ease;
        }
        .lp-glass-card:hover { border-color:rgba(212,169,106,0.35); box-shadow:0 0 28px rgba(212,169,106,0.1), 0 8px 32px rgba(0,0,0,0.4); transform:translateY(-3px); }
        .lp-glass-card:hover::before { left:140%; }
        .lp-card-shine {
          position:absolute; inset:0; border-radius:inherit;
          background:linear-gradient(145deg, rgba(240,235,224,0.04) 0%, transparent 50%);
          pointer-events:none;
        }
        .lp-card-icon { font-size:1.6rem; display:block; margin-bottom:10px; }
        .lp-card-val {
          font-family:'Rajdhani',sans-serif; font-weight:700;
          font-size:1.9rem; color:var(--lp-gold); line-height:1; margin-bottom:4px;
        }
        .lp-card-label {
          font-family:'JetBrains Mono',monospace; font-size:0.58rem;
          letter-spacing:0.15em; text-transform:uppercase; color:rgba(240,235,224,0.3);
        }
        .lp-card-sub { font-size:0.62rem; color:rgba(240,235,224,0.2); margin-top:4px; }

        /* SECTION */
        .lp-section {
          position:relative; z-index:1;
          max-width:1300px; margin:0 auto; padding:80px 32px;
        }
        .lp-section-label {
          font-family:'JetBrains Mono',monospace; font-size:0.58rem;
          letter-spacing:0.25em; text-transform:uppercase; color:rgba(212,169,106,0.5);
          margin-bottom:14px; display:flex; align-items:center; gap:12px;
        }
        .lp-section-label::after { content:''; flex:1; height:1px; background:rgba(212,169,106,0.12); }
        .lp-section-h2 {
          font-family:'Rajdhani',sans-serif; font-weight:700;
          font-size:clamp(1.7rem,3.5vw,2.7rem); color:var(--lp-cream);
          letter-spacing:0.04em; margin-bottom:14px;
        }
        .lp-section-h2 em { font-style:normal; color:var(--lp-gold); }
        .lp-section-body {
          color:rgba(240,235,224,0.38); font-size:0.95rem; line-height:1.75;
          max-width:580px; margin-bottom:48px;
        }

        /* FEATURE CARDS */
        .lp-feature-row { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        @media(max-width:900px){ .lp-feature-row{grid-template-columns:1fr 1fr;} }
        @media(max-width:580px){ .lp-feature-row{grid-template-columns:1fr;} }

        .lp-feature-card {
          background:rgba(240,235,224,0.028);
          border:1px solid rgba(240,235,224,0.065);
          border-radius:8px; padding:28px 22px;
          position:relative; overflow:hidden;
          transition:border-color 0.3s, box-shadow 0.3s, transform 0.3s;
          cursor:default;
        }
        .lp-feature-shine {
          position:absolute; inset:0; border-radius:inherit;
          background:linear-gradient(135deg, rgba(240,235,224,0.03) 0%, transparent 55%);
          pointer-events:none;
        }
        .lp-feature-card::before {
          content:''; position:absolute; top:0; left:-100%;
          width:80%; height:2px;
          background:linear-gradient(90deg, transparent, rgba(212,169,106,0.6), transparent);
          transition:left 0.5s ease;
        }
        .lp-feature-card:hover { border-color:rgba(212,169,106,0.28); box-shadow:0 0 32px rgba(212,169,106,0.08), 0 12px 40px rgba(0,0,0,0.35); transform:translateY(-4px) scale(1.008); }
        .lp-feature-card:hover::before { left:120%; }
        .lp-feature-icon { font-size:1.8rem; margin-bottom:16px; }
        .lp-feature-title {
          font-family:'Rajdhani',sans-serif; font-weight:600;
          font-size:1rem; letter-spacing:0.06em; text-transform:uppercase;
          color:var(--lp-cream); margin-bottom:10px;
        }
        .lp-feature-desc { font-size:0.82rem; color:rgba(240,235,224,0.32); line-height:1.65; }

        /* SECURITY BADGES */
        .lp-badge-row { display:flex; flex-wrap:wrap; gap:10px; margin-bottom:48px; }
        .lp-badge {
          font-family:'JetBrains Mono',monospace; font-size:0.6rem;
          letter-spacing:0.1em; text-transform:uppercase;
          padding:5px 12px; border-radius:3px; border:1px solid;
          transition:transform 0.2s, box-shadow 0.2s;
          cursor:default;
        }
        .lp-badge:hover { transform:translateY(-2px); box-shadow:0 4px 16px rgba(0,0,0,0.3); }

        /* STACK */
        .lp-stack-col { display:flex; flex-direction:column; gap:10px; }
        .lp-stack-row {
          background:rgba(240,235,224,0.025);
          border:1px solid rgba(240,235,224,0.06);
          border-radius:6px; padding:16px 20px;
          display:grid; grid-template-columns:80px 1fr 1fr auto;
          align-items:center; gap:16px;
          position:relative; overflow:hidden;
          transition:border-color 0.28s, transform 0.28s, box-shadow 0.28s;
          cursor:default;
        }
        .lp-stack-shine {
          position:absolute; inset:0;
          background:linear-gradient(90deg, transparent 0%, rgba(240,235,224,0.02) 50%, transparent 100%);
          opacity:0; transition:opacity 0.3s;
        }
        .lp-stack-row:hover { border-color:rgba(212,169,106,0.2); transform:translateX(4px); box-shadow:0 0 20px rgba(212,169,106,0.06); }
        .lp-stack-row:hover .lp-stack-shine { opacity:1; }
        .lp-stack-layer {
          font-family:'JetBrains Mono',monospace; font-size:0.6rem;
          letter-spacing:0.12em; text-transform:uppercase; font-weight:500;
        }
        .lp-stack-name {
          font-family:'Rajdhani',sans-serif; font-weight:600;
          font-size:0.9rem; color:var(--lp-cream); letter-spacing:0.04em;
        }
        .lp-stack-detail {
          font-family:'JetBrains Mono',monospace; font-size:0.58rem;
          color:rgba(240,235,224,0.25); letter-spacing:0.06em;
        }
        .lp-stack-bar { flex:1; height:2px; border-radius:1px; overflow:hidden; border:1px solid; }
        .lp-stack-fill { height:100%; border-radius:1px; }

        /* PARTICLES */
        .lp-particle-field { position:fixed; inset:0; pointer-events:none; z-index:0; }
        .lp-node {
          position:absolute; border-radius:50%;
          background:rgba(212,169,106,0.35);
          box-shadow:0 0 6px rgba(212,169,106,0.3);
          animation:float-node linear infinite;
        }
        @keyframes float-node {
          0%,100%{transform:translateY(0) scale(1);opacity:0.4;}
          50%{transform:translateY(-18px) scale(1.3);opacity:0.7;}
        }

        /* ORBITAL */
        .lp-orbital-wrap {
          position:relative; z-index:1;
          width:clamp(280px,45vw,480px);
          aspect-ratio:1;
          flex-shrink:0;
        }
        .lp-orbital-svg { width:100%; height:100%; }
        @keyframes spin-cw { from{transform:rotate(0deg);}to{transform:rotate(360deg);} }
        @keyframes spin-ccw { from{transform:rotate(0deg);}to{transform:rotate(-360deg);} }

        /* HERO layout */
        .lp-hero-top {
          display:flex; align-items:center; justify-content:center;
          gap:64px; flex-wrap:wrap; width:100%; max-width:1200px;
          margin-bottom:64px;
        }
        .lp-hero-left { flex:1; min-width:280px; text-align:left; }
        @media(max-width:768px){ .lp-hero-left{text-align:center;} }

        /* FOOTER */
        .lp-footer {
          position:relative; z-index:1;
          padding:32px; text-align:center;
          border-top:1px solid rgba(240,235,224,0.05);
        }
        .lp-footer-text {
          font-family:'JetBrains Mono',monospace; font-size:0.58rem;
          letter-spacing:0.15em; text-transform:uppercase;
          color:rgba(240,235,224,0.15);
        }

        /* HUD divider */
        .lp-divider {
          position:relative; height:1px;
          background:rgba(240,235,224,0.05);
          margin:0; overflow:visible;
        }
        .lp-divider::after {
          content:''; position:absolute; top:0; left:0; right:0; height:1px;
          background:linear-gradient(90deg, transparent 0%, rgba(212,169,106,0.7) 48%, rgba(240,235,224,0.9) 50%, rgba(212,169,106,0.7) 52%, transparent 100%);
          background-size:36% 100%; background-repeat:no-repeat;
          animation:hud-sweep 5s ease-in-out infinite;
        }
        @keyframes hud-sweep {
          0%{background-position:-36% 0%;}
          60%,100%{background-position:136% 0%;}
        }
      `}</style>

      <div className="lp-root">
        <ParticleField />
        <div className="lp-grid-bg" aria-hidden />

        <Nav onNav={onEnterDashboard} />

        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-hero-top">
            <div className="lp-hero-left">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="lp-hero-eyebrow"
              >
                MAHE Mobility Challenge · Secure Embedded Systems
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="lp-hero-title"
              >
                SECURE <em>OTA</em><br />ORCHESTRATION
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.65 }}
                className="lp-hero-sub"
              >
                Production-style autonomous vehicle update stack — ESP32 edge gateway,
                cryptographically signed firmware delivery, real-time fleet telemetry
                and canary rollout orchestration.
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="lp-hero-cta-row"
              >
                <button className="lp-cta-primary" onClick={onEnterDashboard}>
                  ▶ &nbsp; Open Command Center
                </button>
                <button className="lp-cta-secondary">
                  View Architecture ↓
                </button>
              </motion.div>
            </div>
            <OrbitalRing />
          </div>

          {/* STAT CARDS */}
          <div className="lp-stat-row">
            <GlassStatCard icon="◈" value="20" label="Fleet Vehicles" sub="Simulated ECUs" delay={0.45} />
            <GlassStatCard icon="⬡" value="6" label="Security Gates" sub="Cryptographic" delay={0.52} />
            <GlassStatCard icon="◎" value="P-256" label="ECC Signature" sub="mbedTLS" delay={0.58} />
            <GlassStatCard icon="▣" value="∞" label="Live Events" sub="WebSocket stream" delay={0.65} />
          </div>
        </section>

        <div className="lp-divider" />

        {/* ARCHITECTURE */}
        <section className="lp-section" id="architecture">
          <p className="lp-section-label">01 · Architecture</p>
          <h2 className="lp-section-h2">End-to-End <em>Secure</em> Pipeline</h2>
          <p className="lp-section-body">
            A single ESP32 hosts the complete edge gateway runtime — brake, powertrain, sensor, and infotainment ECU tasks with simulated CAN bus queue transport. The Go backend orchestrates canary OTA campaigns, persists events to PostgreSQL, and broadcasts live fleet state to the dashboard via WebSocket bridge.
          </p>
          <FeatureRow items={[
            { icon: "◈", title: "ESP32 Edge Gateway", desc: "FreeRTOS task architecture with virtual CAN queue transport. Four concurrent ECUs (brake, powertrain, sensor, infotainment) with OTA safety-gated by brake ECU state." },
            { icon: "⬡", title: "Mosquitto MQTT Broker", desc: "TLS-encrypted command plane on port 8883. Commands published to sdv/ota/command with device MAC filtering and QoS 1 delivery guarantee." },
            { icon: "◎", title: "MinIO S3 Artifact Store", desc: "Firmware binary and signed manifest hosting. ECC signature verification and SHA-256 integrity checksums embedded in OTA payloads." },
            { icon: "▣", title: "Go Backend Service", desc: "Canary deployment orchestration, event audit log persistence, WebSocket broadcast to connected dashboards. CORS-enabled REST API at :8080." },
            { icon: "⬥", title: "PostgreSQL Event Log", desc: "Immutable ota_events table with full JSONB payloads. Deployment history, fleet snapshots, and security events indexed for compliance audits." },
            { icon: "◇", title: "Next.js Dashboard", desc: "Real-time fleet visualization with live WebSocket feed, Framer Motion cinematic interactions, and 3D SVG orbital car model rendering." },
          ]} />
        </section>

        <div className="lp-divider" />

        {/* SECURITY */}
        <section className="lp-section" id="security">
          <p className="lp-section-label">02 Security Controls</p>
          <h2 className="lp-section-h2">Cryptographic <em>Defense</em> Chain</h2>
          <p className="lp-section-body">
            Multi-layer hardening across the entire update pipeline from eFuse hardware identity pinning and TLS transport encryption, through ECC payload authentication and SHA-256 integrity verification, to pre-update safety validation and automatic dual-partition rollback on failure.
          </p>
          <SecurityBadges />
          <FeatureRow items={[
            { icon: "", title: "ECC P-256 Signature Verification", desc: "mbedTLS verifies firmware payload against embedded public key before any OTA acceptance. Blocks forged and supply-chain backdoor attacks." },
            { icon: "", title: "SHA-256 Binary Integrity", desc: "Firmware hash verified against signed manifest before installation. Detects corruption, replay, and altered binary attacks at reception." },
            { icon: "", title: "Pre-Update Safety Gate", desc: "OTA execution blocked when brake ECU reports UNSAFE state. Prevents firmware updates during active safety-critical vehicle operation." },
            { icon: "", title: "Dual-Partition Rollback", desc: "ESP-IDF dual OTA slot with automatic revert on health-check failure. Prevents bricking and ensures safe recovery to verified firmware." },
            { icon: "", title: "TLS MQTT Transport", desc: "All OTA commands encrypted over MQTT 8883 with certificate validation. Blocks MITM interception, command injection, and replay attacks." },
            { icon: "", title: "eFuse MAC Device Identity", desc: "Immutable hardware MAC-based device identifier stored in ESP32 eFuse. Eliminates logical node spoofing and supports fine-grained access control." },
          ]} />
        </section>

        <div className="lp-divider" />

        {/* STACK */}
        <section className="lp-section" id="stack">
          <p className="lp-section-label">03 Technology Stack</p>
          <h2 className="lp-section-h2">Full-Stack <em>Production</em> Platform</h2>
          <p className="lp-section-body">
            Battle-tested technologies across every layer from bare-metal FreeRTOS task runtime and mbedTLS cryptography on ESP32, through Go microservices with PostgreSQL persistence, to a production-grade Next.js dashboard with real-time WebSocket telemetry and cinematic motion graphics.
          </p>
          <StackRow />
        </section>

        <div className="lp-divider" />

        {/* FOOTER CTA */}
        <section style={{ position: "relative", zIndex: 1, padding: "80px 32px", textAlign: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="lp-section-label" style={{ justifyContent: "center" }}>Ready</p>
            <h2 className="lp-section-h2">Enter the <em>Command Center</em></h2>
            <p className="lp-section-body" style={{ margin: "0 auto 36px" }}>
              Live fleet telemetry, OTA deployment controls, 3D visualisations
              and real-time security event stream.
            </p>
            <button className="lp-cta-primary" onClick={onEnterDashboard}
              style={{ fontSize: "1rem", padding: "16px 48px" }}>
              ▶ &nbsp; Open Dashboard
            </button>
          </motion.div>
        </section>

        <footer className="lp-footer">
          <p className="lp-footer-text">SDV Secure OTA · MAHE Mobility Challenge · {new Date().getFullYear()}</p>
        </footer>
      </div>
    </>
  );
}
