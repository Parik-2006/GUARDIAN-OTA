"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { P } from "./theme";
import I from "./Icon";

interface Stage {
  label: string;
  icon: string;
  duration: number; // ms
}

const STAGES: Stage[] = [
  { label: "Key Exchange (ECDH P-256)", icon: "key", duration: 1200 },
  { label: "AES-256 Decryption",        icon: "lock_open", duration: 1800 },
  { label: "SHA-256 Hash Check",        icon: "tag", duration: 1400 },
  { label: "ECC Signature Verify",      icon: "verified_user", duration: 1000 },
  { label: "Secure Boot Validation",    icon: "security", duration: 800 },
];

export default function VerificationSim() {
  const [running, setRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState(-1);
  const [stageProgress, setStageProgress] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const reset = useCallback(() => {
    setRunning(false);
    setCurrentStage(-1);
    setStageProgress(0);
    setCompleted([]);
    setDone(false);
  }, []);

  const runVerification = useCallback(() => {
    reset();
    setRunning(true);
    setCurrentStage(0);
  }, [reset]);

  // Drive the simulation
  useEffect(() => {
    if (!running || currentStage < 0 || currentStage >= STAGES.length) return;

    const stage = STAGES[currentStage];
    const interval = 50;
    const increment = (interval / stage.duration) * 100;

    const timer = setInterval(() => {
      setStageProgress(prev => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setCompleted(p => [...p, currentStage]);
          if (currentStage < STAGES.length - 1) {
            setTimeout(() => {
              setCurrentStage(s => s + 1);
              setStageProgress(0);
            }, 300);
          } else {
            setDone(true);
            setRunning(false);
          }
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [running, currentStage]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <I n="verified" f sz={18} col={P.cognac} />
          <h3 style={{
            fontFamily: "'Cormorant Garamond',serif", fontWeight: 600,
            fontSize: "1rem", color: P.ivory,
          }}>Verification</h3>
        </div>
        {done && (
          <span
            onClick={reset}
            style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: "0.52rem",
              color: P.cognac, cursor: "pointer",
              textTransform: "uppercase", letterSpacing: "0.1em",
            }}
          >Reset</span>
        )}
      </div>

      {/* Stages */}
      <div style={{
        background: P.cockpit, border: `1px solid ${P.bDim}`,
        borderRadius: 4, padding: "14px 16px",
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {STAGES.map((stage, idx) => {
          const isCompleted = completed.includes(idx);
          const isCurrent = currentStage === idx && !isCompleted;
          const isPending = idx > currentStage;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: isPending && running ? 0.35 : 1 }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 10px", borderRadius: 3,
                background: isCurrent ? P.cgnDim : isCompleted ? P.sageDim : "transparent",
                border: `1px solid ${isCurrent ? P.bHi : isCompleted ? "rgba(122,158,114,0.18)" : "transparent"}`,
                transition: "all 0.3s",
              }}
            >
              {/* Icon */}
              <div style={{
                width: 28, height: 28, borderRadius: 3, flexShrink: 0,
                background: isCompleted ? P.sageDim : isCurrent ? P.cgnDim : P.dash,
                border: `1px solid ${isCompleted ? "rgba(122,158,114,0.3)" : isCurrent ? P.bHi : P.bDim}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <I
                  n={isCompleted ? "check_circle" : stage.icon}
                  f={isCompleted}
                  sz={14}
                  col={isCompleted ? P.sage : isCurrent ? P.cognac : P.whisper}
                />
              </div>

              {/* Label + progress */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: "0.62rem",
                  color: isCompleted ? P.sage : isCurrent ? P.cognac : P.whisper,
                  fontWeight: isCurrent ? 600 : 400, marginBottom: isCurrent ? 5 : 0,
                }}>{stage.label}</div>

                {isCurrent && (
                  <div style={{
                    background: P.dash, borderRadius: 2, height: 3, overflow: "hidden",
                  }}>
                    <motion.div
                      animate={{ width: `${stageProgress}%` }}
                      transition={{ duration: 0.1 }}
                      style={{
                        height: "100%", background: P.cognac, borderRadius: 2,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Status */}
              <span style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: "0.5rem",
                color: isCompleted ? P.sage : isCurrent ? P.cognac : P.whisper,
                flexShrink: 0,
              }}>
                {isCompleted ? "PASS" : isCurrent ? `${Math.round(stageProgress)}%` : "—"}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Run button */}
      {!running && !done && (
        <button
          onClick={runVerification}
          style={{
            width: "100%", padding: "10px 0",
            background: P.cgnDim, color: P.cognac,
            fontFamily: "'Cormorant Garamond',serif", fontWeight: 700,
            fontSize: "0.9rem", letterSpacing: "0.08em",
            borderRadius: 3, border: `1px solid ${P.bHi}`,
            cursor: "pointer", transition: "all 0.22s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = P.cgnGlow; e.currentTarget.style.color = P.ivory; }}
          onMouseLeave={e => { e.currentTarget.style.background = P.cgnDim; e.currentTarget.style.color = P.cognac; }}
        >
          <I n="play_arrow" sz={18} col="inherit" /> Run Verification
        </button>
      )}

      {/* Done banner */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              background: P.sageDim, border: `1px solid rgba(122,158,114,0.3)`,
              borderRadius: 3, padding: "10px 14px",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <I n="check_circle" f sz={18} col={P.sage} />
            <div>
              <div style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem",
                color: P.sage, fontWeight: 600,
              }}>VERIFICATION COMPLETE</div>
              <div style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: "0.5rem",
                color: P.whisper, marginTop: 2,
              }}>All {STAGES.length} cryptographic gates passed</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
