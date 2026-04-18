"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { P } from "./theme";
import I from "./Icon";

export default function UpdatePanel() {
  const [file, setFile] = useState<File | null>(null);
  const [pushing, setPushing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setDone(false);
      setProgress(0);
    }
  }, []);

  const handlePush = useCallback(() => {
    if (!file || pushing) return;
    setPushing(true);
    setProgress(0);
    setDone(false);
  }, [file, pushing]);

  // Simulate push progress
  useEffect(() => {
    if (!pushing) return;
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setPushing(false);
          setDone(true);
          return 100;
        }
        return prev + 2;
      });
    }, 60);
    return () => clearInterval(timer);
  }, [pushing]);

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

      {/* Push progress */}
      {(pushing || done) && (
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
            }}>{done ? "PUSH COMPLETE" : "UPLOADING FIRMWARE..."}</span>
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
              transition={{ duration: 0.1 }}
              style={{
                height: "100%",
                background: done ? P.sage : P.cognac,
                borderRadius: 2,
              }}
            />
          </div>
          {done && (
            <div style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: "0.5rem",
              color: P.whisper, marginTop: 8,
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <I n="check_circle" f sz={12} col={P.sage} />
              Firmware delivered. Device rebooting...
            </div>
          )}
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
