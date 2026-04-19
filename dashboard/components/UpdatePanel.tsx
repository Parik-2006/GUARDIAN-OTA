"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { P } from "./theme";
import I from "./Icon";
import { FleetVehicle } from "./FleetContext";

// Maps MQTT status strings to ordered step indices
const STATUS_STEP: Record<string, number> = { ack: 1, downloading: 2, verifying: 3, success: 4 };

const STEPS = [
  { label: "Queued at Orchestrator" },
  { label: "Acknowledged by Edge Node" },
  { label: "Downloading Encrypted Binary" },
  { label: "Validating SHA-256 / ECC Keys" },
  { label: "Flashing & Soft Rebooting" },
];

export default function UpdatePanel({ specificDeviceId, vehicle }: { specificDeviceId?: string, vehicle?: FleetVehicle }) {
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState("2.0.0");
  const [pushing, setPushing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeStep, setActiveStep] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const [errorDetail, setErrorDetail] = useState("");
  const [errorStep, setErrorStep] = useState(-1);

  // Drive steps from the exact MQTT otaStatus string returned via the backend twin.
  // The dep on vehicle?.otaStatus ensures we re-run immediately on each MQTT tick.
  useEffect(() => {
    if (!deploying || !vehicle) return;
    const st = vehicle.otaStatus ?? "";

    // Ignore stale status from a previous campaign
    if (st === "online" || st === "") return;

    const stepIdx = STATUS_STEP[st];
    if (stepIdx !== undefined) setActiveStep(stepIdx);
    setProgress(vehicle.otaProgress ?? 0);

    if (st === "success") {
      setDone(true);
      setDeploying(false);
      setActiveStep(4);
    }
    if (st === "error" || st === "rollback") {
      // Show the error inline at the last reached step — don't clear the list
      const failedAt = STATUS_STEP[vehicle.otaStatus ?? ""] ?? activeStep;
      setErrorStep(failedAt >= 0 ? failedAt : activeStep);
      setErrorDetail(vehicle.otaStatus === "error" ? "finalize failed" : "rollback triggered");
      setErrorMsg(`OTA aborted at edge — see step above`);
      setDeploying(false);
    }
  }, [vehicle?.otaStatus, vehicle?.otaProgress, deploying]);


  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setDone(false);
      setProgress(0);
    }
  }, []);

  const handlePush = useCallback(async () => {
    if (!file || pushing || !version) return;
    setPushing(true);
    setProgress(0);
    setDone(false);
    setErrorMsg("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("version", version);
      if (specificDeviceId) {
        fd.append("targetDevice", specificDeviceId);
      }

      const res = await fetch("http://localhost:8080/api/ota/upload", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        throw new Error(`Failed: ${await res.text()}`);
      }
      
      setDeploying(true);
      setActiveStep(0);
    } catch (err: any) {
      setErrorMsg(err.message || "Upload failed");
    } finally {
      setPushing(false);
    }
  }, [file, pushing, version]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <I n="system_update_alt" f sz={18} col={P.cognac} />
        <h3 style={{
          fontFamily: "'Cormorant Garamond',serif", fontWeight: 600,
          fontSize: "1rem", color: P.ivory,
        }}>Firmware Update</h3>
      </div>

      {/* File picker */}
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          background: P.cockpit, border: `1px dashed ${P.bMid}`,
          borderRadius: 4, padding: "22px 18px",
          textAlign: "center", cursor: "pointer",
          transition: "all 0.22s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = P.bHi;
          e.currentTarget.style.background = P.dash;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = P.bMid;
          e.currentTarget.style.background = P.cockpit;
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".bin"
          onChange={handleSelect}
          style={{ display: "none" }}
        />
        <I n="upload_file" sz={28} col={P.cognac} />
        <p style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem",
          color: P.champagne, marginTop: 8,
        }}>
          {file ? file.name : "Browse for firmware binary (.bin)"}
        </p>
        <p style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: "0.5rem",
          color: P.whisper, marginTop: 4,
        }}>
          {file
            ? `${formatSize(file.size)} · ${new Date(file.lastModified).toLocaleDateString()}`
            : "Click to select or drag & drop"}
        </p>
      </div>

      {/* Version Input */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem", color: P.parchment }}>
          Target Version:
        </span>
        <input 
          value={version} 
          onChange={e => setVersion(e.target.value)} 
          placeholder="e.g. 2.0.0"
          disabled={pushing || done}
          style={{
            background: P.cockpit, border: `1px solid ${P.bMid}`,
            color: P.ivory, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem",
            padding: "6px 10px", borderRadius: 3, flex: 1, outline: "none",
          }}
        />
      </div>

      {/* File details */}
      {file && !pushing && !done && (
        <div style={{
          background: P.cockpit, border: `1px solid ${P.bDim}`,
          borderRadius: 4, padding: "10px 14px",
          display: "flex", gap: 8, alignItems: "start",
        }}>
          <I n="info" sz={14} col={P.platinum} />
          <p style={{
            fontSize: "0.68rem", color: P.whisper, lineHeight: 1.6,
          }}>
            Ensure this firmware binary is correctly signed with the matching ECC key pair.
            Unsigned binaries will be rejected by the device bootloader.
          </p>
        </div>
      )}

      {/* Error display */}
      {errorMsg && (
        <div style={{
          background: "rgba(196,107,107,0.08)", border: `1px solid rgba(196,107,107,0.2)`,
          borderRadius: 4, padding: "10px 14px",
          display: "flex", gap: 8, alignItems: "center",
        }}>
          <I n="error_outline" sz={14} col={P.burg} />
          <p style={{
            fontFamily: "'JetBrains Mono',monospace", fontSize: "0.58rem", color: P.burg,
          }}>{errorMsg}</p>
        </div>
      )}

      {/* Push progress */}
      {(pushing || deploying || done) && (
        <div style={{
          background: P.cockpit, border: `1px solid ${P.bDim}`,
          borderRadius: 4, padding: "14px 16px",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            marginBottom: 8,
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: "0.58rem",
              color: done ? P.sage : P.cognac, fontWeight: 600,
            }}>{done ? "OTA COMPLETE" : pushing ? "UPLOADING TO BACKEND..." : "DEPLOYING TO HARDWARE..."}</span>
            <span style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: "0.58rem",
              color: P.whisper,
            }}>{Math.round(progress)}%</span>
          </div>
          <div style={{
            background: P.dash, borderRadius: 2, height: 4, overflow: "hidden",
          }}>
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                height: "100%",
                background: done ? P.sage : P.cognac,
                borderRadius: 2,
              }}
            />
          </div>
          
          {/* Checklist — each step appears only when backend confirms that MQTT phase */}
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6, paddingLeft: 2 }}>
            {STEPS.map((step, idx) => {
              const isFailedHere = errorStep === idx && !done;
              const isDone = (activeStep > idx || done) && !isFailedHere;
              const isCurrent = activeStep === idx && !done && !isFailedHere;
              const isVisible = activeStep >= idx || done || isFailedHere;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: isVisible ? 1 : 0.22, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.05 }}
                  style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}
                >
                  <I
                    n={isFailedHere ? "cancel" : isDone ? "check_circle" : isCurrent ? "radio_button_checked" : "radio_button_unchecked"}
                    f={isDone || isFailedHere}
                    sz={13}
                    col={isFailedHere ? P.burg : isDone ? P.sage : isCurrent ? P.cognac : P.whisper}
                  />
                  <span style={{
                    fontFamily: "'JetBrains Mono',monospace", fontSize: "0.54rem",
                    color: isFailedHere ? P.burg : isDone ? P.sage : isCurrent ? P.cognac : P.whisper,
                    fontWeight: isCurrent || isFailedHere ? 600 : 400,
                  }}>{step.label}</span>
                  {isFailedHere && errorDetail && (
                    <span style={{
                      fontFamily: "'JetBrains Mono',monospace", fontSize: "0.48rem",
                      color: P.burg, opacity: 0.8,
                      background: "rgba(196,107,107,0.1)", padding: "1px 5px", borderRadius: 2,
                    }}>✗ {errorDetail}</span>
                  )}
                  {isCurrent && (
                    <motion.span
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      style={{ fontSize: "0.5rem", color: P.cognac, marginLeft: 4 }}
                    >▶</motion.span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Push button */}
      <button
        onClick={handlePush}
        disabled={!file || pushing}
        style={{
          width: "100%", padding: "10px 0",
          background: file && !pushing ? P.cgnDim : P.dash,
          color: file && !pushing ? P.cognac : P.whisper,
          fontFamily: "'Cormorant Garamond',serif", fontWeight: 700,
          fontSize: "0.9rem", letterSpacing: "0.08em",
          borderRadius: 3,
          border: `1px solid ${file && !pushing ? P.bHi : P.bDim}`,
          cursor: file && !pushing ? "pointer" : "not-allowed",
          opacity: file && !pushing ? 1 : 0.5,
          transition: "all 0.22s",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
        }}
        onMouseEnter={e => {
          if (file && !pushing) {
            e.currentTarget.style.background = P.cgnGlow;
            e.currentTarget.style.color = P.ivory;
          }
        }}
        onMouseLeave={e => {
          if (file && !pushing) {
            e.currentTarget.style.background = P.cgnDim;
            e.currentTarget.style.color = P.cognac;
          }
        }}
      >
        <I n="send" sz={16} col="inherit" /> Push Update
      </button>
    </div>
  );
}
