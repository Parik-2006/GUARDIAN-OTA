"use client";

import { motion } from "framer-motion";
import { P } from "./theme";
import I from "./Icon";

export default function Documentation() {
  const sections = [
    {
      title: "Project Overview",
      icon: "info",
      items: [
        "GUARDIAN OTA is a production-grade Over-The-Air (OTA) firmware update platform designed for autonomous vehicles",
        "Provides secure, canary-based deployment with cryptographic verification and real-time fleet management",
        "Implements multi-layer security with ECC signatures, SHA-256 integrity checks, and TLS encryption",
      ],
    },
    {
      title: "Core Features",
      icon: "star",
      items: [
        "Live Fleet Telemetry: Real-time vehicle status, threat levels, and safety states",
        "Secure OTA Deployment: Signed firmware with automatic rollback capabilities",
        "Virtual ECU Simulation: Brake, Powertrain, Sensor, and Infotainment modules running concurrently",
        "Canary Rollout: Gradual deployment with automatic halt on anomalies",
      ],
    },
    {
      title: "Security Architecture",
      icon: "shield",
      items: [
        "ECC P-256 Signature Verification: Prevents forged firmware and supply-chain attacks",
        "Hardware Identity: Device-specific MAC address stored in ESP32 eFuse",
        "Pre-Update Safety Gate: Blocks OTA when brake ECU reports UNSAFE state",
        "Dual-Partition Rollback: Automatic revert if health-check fails",
      ],
    },
    {
      title: "Technology Stack",
      icon: "engineering",
      items: [
        "Edge: ESP32 + FreeRTOS with mbedTLS cryptography",
        "Messaging: Mosquitto MQTT broker on TLS 8883",
        "Backend: Go + Gin framework with PostgreSQL persistence",
        "Frontend: Next.js 14 with Framer Motion animations",
      ],
    },
    {
      title: "Project Objectives",
      icon: "target",
      items: [
        "Demonstrate secure firmware delivery in constrained embedded systems",
        "Implement production-grade authentication and integrity verification",
        "Enable fleet-wide coordinated updates with safety guarantees",
        "Provide cinematic real-time visualization of OTA operations",
      ],
    },
    {
      title: "Use Cases",
      icon: "directions_car",
      items: [
        "Emergency Security Patch Distribution: Deploy critical fixes within minutes",
        "Feature Rollout: Gradual introduction of new capabilities via canary testing",
        "Compliance Updates: Ensure all vehicles meet regulatory requirements",
        "Performance Optimization: Update FPGA or ECU parameters remotely",
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
