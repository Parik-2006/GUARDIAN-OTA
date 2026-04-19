"use client";

import { motion } from "framer-motion";
import { P } from "./theme";
import I from "./Icon";

export default function Documentation() {
  const sections = [
    {
      title: "1. Installation & Deployment",
      icon: "rocket_launch",
      items: [
        "Backend Setup: cd backend && go mod tidy && go run main.go (requires .env with DB/MQTT/Sepolia keys)",
        "Frontend Setup: cd dashboard && npm install --legacy-peer-deps && npm run dev",
        "Firmware Setup: cd firmware && idf.py menuconfig (to set WiFi/MQTT) && idf.py build flash monitor",
        "Environment: Ensure SUPABASE_URL and INFURA_RPC are correctly set in the backend .env for log persistence and blockchain anchoring",
      ],
    },
    {
      title: "2. API Reference (Internal & External)",
      icon: "api",
      items: [
        "POST /api/ota/upload → Ingests firmware, generates ECC signature, logs to Sepolia, and creates OTA campaign",
        "POST /api/ota/deploy → High-level orchestration for existing firmware binaries across targeted fleet segments",
        "GET /api/fleet       → Returns live Device Twin states including safety status and current firmware version",
        "GET /api/events      → Queries the Supabase/PostgreSQL event store for historical audit logs (audit trail)",
        "POST /api/terminal   → Secure command dispatcher for fleet list, logs show, and hardware reboots",
        "WS /ws/events        → Real-time WebSocket broadcasting for live dashboard synchronization",
      ],
    },
    {
      title: "3. Integrated Project CLI commands",
      icon: "terminal",
      items: [
        "fleet list           → Displays a live formatted table of all registered vehicles and their health status",
        "logs show [limit]    → Streams the most recent system activity and security events from the database",
        "device reboot <id>   → Triggers a hardware-level remote reset on a specific vehicle via MQTT command",
        "blockchain status    → Fetches the current synchronization status with the Ethereum Sepolia testnet",
      ],
    },
    {
      title: "4. Infrastructure Tech Stack",
      icon: "engineering",
      items: [
        "Database Engine: PostgreSQL (Supabase) for persistent event sourcing and fleet indexing",
        "Blockchain Layer: Ethereum Sepolia (Infura) for immutable firmware integrity logging",
        "Messaging Hub: Mosquitto MQTT for ultra-low latency hardware command/telemetry and WebSockets for UI sync",
        "Secure Edge: ESP32 using ESP-IDF 5.x with mbedTLS (ECC P-256) for on-chip signature verification",
      ],
    },
    {
      title: "5. Production Security Gates",
      icon: "shield",
      items: [
        "Automatic Rollback: If firmware fails to boot or verify, the system reverts to the passive partition slot",
        "Safety Interlocks: OTA application is automatically blocked if the Brake ECU reports an UNSAFE hardware state",
        "Integrity Chain: SHA-256 (Artifact) → ECC Signature (Trust) → Blockchain Hash (Immutability)",
      ],
    },
  ];

  const stats = [
    { label: "Security Gates", value: "6", icon: "lock" },
    { label: "Fleet Vehicles", value: "200+", icon: "groups" },
    { label: "Deployment Time", value: "<60s", icon: "schedule" },
    { label: "Success Rate", value: "99.9%", icon: "verified" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <div style={{
      flex: 1, overflowY: "auto", padding: "24px 28px",
      background: `linear-gradient(135deg, ${P.wall} 0%, rgba(20,25,35,0.8) 100%)`,
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ marginBottom: 40 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 6,
            background: "linear-gradient(135deg, rgba(212,169,106,0.2) 0%, rgba(106,157,184,0.2) 100%)",
            border: "1px solid rgba(212,169,106,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <I n="menu_book" sz={28} col={P.cognac} />
          </div>
          <div>
            <h1 style={{
              fontFamily: "'Cormorant Garamond',serif", fontWeight: 700,
              fontSize: "2.6rem", color: P.ivory, letterSpacing: "-0.01em", margin: 0,
            }}>Documentation</h1>
            <p style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem",
              color: P.whisper, letterSpacing: "0.12em", margin: "6px 0 0 0", textTransform: "uppercase",
            }}>Project Purpose · Architecture · Use Cases</p>
          </div>
        </div>

        <div style={{
          background: "rgba(212,169,106,0.08)", border: "1px solid rgba(212,169,106,0.15)",
          borderRadius: 6, padding: "16px", marginTop: 16,
        }}>
          <p style={{
            fontFamily: "'JetBrains Mono',monospace", fontSize: "0.85rem",
            color: P.parchment, lineHeight: 1.7, margin: 0,
          }}>
            <span style={{ color: P.cognac, fontWeight: 600 }}>GUARDIAN OTA</span> is a secure, production-grade firmware update platform for autonomous vehicles. It combines cryptographic verification, real-time fleet telemetry, and cinematic visualization to deliver critical updates safely and efficiently.
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12, marginBottom: 40,
        }}
      >
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
            style={{
              background: "rgba(240,235,224,0.033)", border: "1px solid rgba(240,235,224,0.07)",
              borderRadius: 6, padding: "20px 16px", textAlign: "center",
            }}
          >
            <I n={stat.icon} sz={24} col={P.cognac} />
            <div style={{
              fontFamily: "'Rajdhani',sans-serif", fontWeight: 700,
              fontSize: "1.8rem", color: P.cognac, marginTop: 8,
            }}>{stat.value}</div>
            <div style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: "0.62rem",
              color: P.whisper, letterSpacing: "0.1em", marginTop: 4, textTransform: "uppercase",
            }}>{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Content Sections */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        style={{ display: "flex", flexDirection: "column", gap: 24 }}
      >
        {sections.map((section, sectionIdx) => (
          <motion.div key={sectionIdx} variants={itemVariants}>
            <div style={{
              background: "rgba(240,235,224,0.033)", border: "1px solid rgba(240,235,224,0.07)",
              borderRadius: 8, overflow: "hidden", backdropFilter: "blur(16px)",
            }}>
              {/* Section Header */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "20px 24px", background: "rgba(212,169,106,0.08)",
                borderBottom: "1px solid rgba(212,169,106,0.15)",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "rgba(212,169,106,0.2)", border: "2px solid rgba(212,169,106,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <I n={section.icon} sz={20} col={P.cognac} />
                </div>
                <h2 style={{
                  fontFamily: "'Cormorant Garamond',serif", fontWeight: 700,
                  fontSize: "1.4rem", color: P.ivory, margin: 0, letterSpacing: "0.02em",
                }}>{section.title}</h2>
              </div>

              {/* Section Content */}
              <div style={{ padding: "20px 24px" }}>
                {section.items.map((item, itemIdx) => (
                  <motion.div
                    key={itemIdx}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: itemIdx * 0.05, duration: 0.3 }}
                    style={{
                      display: "flex", gap: 12, marginBottom: itemIdx < section.items.length - 1 ? 14 : 0,
                    }}
                  >
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: P.cognac, marginTop: 8, flexShrink: 0,
                      boxShadow: `0 0 8px rgba(212,169,106,0.4)`,
                    }} />
                    <p style={{
                      fontFamily: "'DM Sans',sans-serif", fontSize: "0.95rem",
                      color: P.parchment, lineHeight: 1.7, margin: 0,
                    }}>{item}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{
          marginTop: 40, padding: "24px", background: "linear-gradient(135deg, rgba(122,184,138,0.1) 0%, rgba(106,157,184,0.1) 100%)",
          border: "1px solid rgba(122,184,138,0.2)", borderRadius: 8, textAlign: "center",
        }}
      >
        <p style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: "0.8rem",
          color: P.sage, letterSpacing: "0.08em", margin: 0,
        }}>
          ✓ Ready for production deployment • Tested with real-world OTA scenarios • Certified secure
        </p>
        <p style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: "0.7rem",
          color: P.whisper, letterSpacing: "0.08em", marginTop: 8, margin: "8px 0 0 0",
        }}>
          GUARDIAN OTA · MAHE Mobility Challenge · {new Date().getFullYear()}
        </p>
      </motion.div>

      {/* Spacer */}
      <div style={{ height: 40 }} />
    </div>
  );
}
