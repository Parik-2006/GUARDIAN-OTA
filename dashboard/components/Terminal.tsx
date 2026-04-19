"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { P } from "./theme";
import I from "./Icon";

interface CommandResult {
  command: string;
  timestamp: string;
  output: string[];
  status: "success" | "error" | "running";
}

export default function Terminal() {
  const [command, setCommand] = useState("");
  const [results, setResults] = useState<CommandResult[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Initialize terminal with welcome message on mount
  useEffect(() => {
    setResults([
      {
        command: "",
        timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
        output: [
          "╔═══════════════════════════════════════════════════════╗",
          "║        GUARDIAN OTA TERMINAL OVERRIDE v2.0           ║",
          "║     Secure Firmware Update & Fleet Management CLI     ║",
          "╚═══════════════════════════════════════════════════════╝",
          "",
          "Welcome to the Guardian OTA Command Center.",
          "Type 'help' for available commands or use quick buttons.",
          "Use ↑/↓ arrow keys to navigate history.",
          "",
        ],
        status: "success",
      }
    ]);
  }, []);

  // Auto-scroll to bottom of terminal
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [results]);

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim()) return;

    setIsRunning(true);
    
    // Handle built-in commands
    if (cmd.trim() === "help" || cmd.trim() === "help --all") {
      const helpResult: CommandResult = {
        command: cmd,
        timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
        output: [
          "╔═══════════════════════════════════════════════════════╗",
          "║           GUARDIAN PROJECT CLI DOCUMENTATION          ║",
          "╚═══════════════════════════════════════════════════════╝",
          "",
          "FLEET MANAGEMENT:",
          "  fleet list          - Show all registered devices and status",
          "  fleet insight <id>  - Get deep diagnostics for a vehicle",
          "",
          "HARDWARE COMMANDS:",
          "  device reboot <id>  - Trigger remote hardware reset via MQTT",
          "  device ping <id>    - Test heartbeat latency",
          "",
          "OBSERVABILITY:",
          "  logs show [limit]   - Inspect recent system and security events",
          "  blockchain status   - Check Sepolia synchronization health",
          "",
          "UTILITIES:",
          "  help                - Show this menu",
          "  clear               - Clear terminal output",
          "",
          "[TIP] Click the quick-access buttons on the right for common tasks.",
        ],
        status: "success",
      };
      setResults(prev => [...prev, helpResult]);
      setHistory(prev => [cmd, ...prev]);
      setHistoryIndex(-1);
      setCommand("");
      setIsRunning(false);
      return;
    }

    const newResult: CommandResult = {
      command: cmd,
      timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
      output: ["[INFO] Executing command..."],
      status: "running",
    };

    setResults(prev => [...prev, newResult]);
    setHistory(prev => [cmd, ...prev]);
    setHistoryIndex(-1);
    setCommand("");

    try {
      // Call the API endpoint to execute command
      const response = await fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });

      const data = await response.json();

      setResults(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          output: data.output || ["No output"],
          status: data.status || "success",
        };
        return updated;
      });
    } catch (error) {
      setResults(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          output: [`[ERROR] ${error instanceof Error ? error.message : "Unknown error"}`],
          status: "error",
        };
        return updated;
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      executeCommand(command);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setCommand(history[nextIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const prevIndex = historyIndex - 1;
        setHistoryIndex(prevIndex);
        setCommand(history[prevIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand("");
      }
    }
  };

  const clearTerminal = () => {
    setResults([]);
  };

  return (
    <div style={{
      flex: 1, overflowY: "auto", padding: "24px 28px",
      display: "flex", flexDirection: "column", gap: 20,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 6,
            background: P.cgnDim, border: `1px solid ${P.bHi}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <I n="terminal" sz={20} col={P.cognac} />
          </div>
          <div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond',serif", fontSize: "2rem",
              fontWeight: 400, letterSpacing: "-0.01em", color: P.ivory, lineHeight: 1,
            }}>Terminal Override</h2>
            <p style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: "0.62rem",
              color: P.whisper, marginTop: 5,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: P.sage, display: "inline-block", boxShadow: `0 0 4px ${P.sage}`,
              }} />
              LIVE COMMAND EXECUTION · TYPE HELP FOR COMMANDS
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Terminal + History */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 300px", gap: 16,
        flex: 1, minHeight: 0,
      }}>
        {/* Terminal Window - Linux-style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: "rgba(10,15,20,0.95)", border: `1px solid rgba(0,255,0,0.15)`,
            borderRadius: 8, display: "flex", flexDirection: "column",
            overflow: "hidden", backdropFilter: "blur(16px)",
            boxShadow: "0 0 28px rgba(0,255,0,0.1), inset 0 0 20px rgba(0,255,0,0.01)",
          }}
        >
          {/* Terminal Header - Linux-style */}
          <div style={{
            height: 44, background: "rgba(15,20,25,0.95)", borderBottom: `1px solid rgba(0,255,0,0.15)`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 16px", flexShrink: 0,
            backgroundImage: "repeating-linear-gradient(90deg, rgba(0,255,0,0.01) 0px, transparent 1px)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "#00FF00", boxShadow: "0 0 4px rgba(0,255,0,0.5)",
              }} />
              <span style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem",
                color: "#00FF00", letterSpacing: "0.08em",
                textShadow: "0 0 3px rgba(0,255,0,0.2)",
              }}>guardian-ota@localhost</span>
              <span style={{
                color: "#666", margin: "0 6px",
              }}>—</span>
              <span style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem",
                color: "#888",
              }}>Terminal • Press 'help' for commands</span>
            </div>
            <button
              onClick={clearTerminal}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                padding: "4px 8px", borderRadius: 3, transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 5,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,255,0,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              title="Clear terminal"
            >
              <I n="delete_sweep" sz={14} col="#00FF00" />
            </button>
          </div>

          {/* Terminal Output */}
          <div
            ref={outputRef}
            style={{
              flex: 1, overflowY: "auto", padding: "16px 20px",
              fontFamily: "'JetBrains Mono',monospace", fontSize: "0.85rem",
              lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 0,
              background: "rgba(10,15,20,0.8)",
              backgroundImage: "repeating-linear-gradient(0deg, rgba(0,255,0,0.02) 0px, transparent 1px)",
            }}
          >
            {results.map((result, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {/* Command prompt - only show if command exists */}
                {result.command && (
                  <div style={{
                    display: "flex", gap: 8, alignItems: "flex-start",
                    marginBottom: 4,
                  }}>
                    <span style={{
                      color: "#00FF00", fontWeight: 700, fontSize: "0.9rem",
                      textShadow: "0 0 4px rgba(0,255,0,0.3)",
                    }}>root@guardian:~$</span>
                    <span style={{
                      color: "#E0E0E0", flex: 1, wordBreak: "break-all",
                      fontWeight: 500,
                    }}>{result.command}</span>
                  </div>
                )}
                
                {/* Output lines */}
                {result.output.map((line, j) => {
                  let textColor = "#E0E0E0";
                  let textGlow = "none";
                  
                  if (result.status === "error" && line.toLowerCase().includes("error")) {
                    textColor = "#FF6B6B";
                    textGlow = "0 0 6px rgba(255,107,107,0.3)";
                  } else if (result.status === "success" && line.toLowerCase().includes("✓")) {
                    textColor = "#51CF66";
                    textGlow = "0 0 6px rgba(81,207,102,0.3)";
                  } else if (line.includes("[INFO]")) {
                    textColor = "#4DAEFF";
                    textGlow = "0 0 6px rgba(77,174,255,0.2)";
                  } else if (line.includes("[WARNING]") || line.includes("⚠")) {
                    textColor = "#FFD700";
                    textGlow = "0 0 6px rgba(255,215,0,0.2)";
                  } else if (line.startsWith("╔") || line.startsWith("║") || line.startsWith("╚")) {
                    textColor = "#00FF00";
                    textGlow = "0 0 4px rgba(0,255,0,0.2)";
                  } else if (line.trim() === "") {
                    return <div key={j} style={{ height: "0.5rem" }} />;
                  }
                  
                  return (
                    <div
                      key={j}
                      style={{
                        color: textColor,
                        textShadow: textGlow,
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                        marginBottom: "0.2rem",
                      }}
                    >
                      {line}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Input Area - Linux-like terminal prompt */}
          <div style={{
            background: "rgba(10,15,20,0.9)", borderTop: `1px solid rgba(0,255,0,0.1)`,
            padding: "12px 20px", flexShrink: 0,
            display: "flex", alignItems: "center", gap: 8,
            backgroundImage: "repeating-linear-gradient(0deg, rgba(0,255,0,0.01) 0px, transparent 1px)",
          }}>
            <span style={{
              color: "#00FF00", fontWeight: 700, fontSize: "0.9rem",
              textShadow: "0 0 4px rgba(0,255,0,0.3)",
              minWidth: "fit-content",
            }}>root@guardian:~$</span>
            
            <input
              ref={inputRef}
              value={command}
              onChange={e => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isRunning}
              placeholder="Enter command..."
              autoFocus
              style={{
                flex: 1, background: "transparent", border: "none",
                color: "#E0E0E0", fontFamily: "'JetBrains Mono',monospace",
                fontSize: "0.85rem", outline: "none",
                opacity: isRunning ? 0.5 : 1,
                caretColor: "#00FF00",
                textShadow: isRunning ? "none" : "0 0 2px rgba(0,255,0,0.2)",
              }}
            />
            
            {isRunning && (
              <span style={{
                width: 10, height: 10, borderRadius: "50%",
                background: "#FF6B6B", animation: "pulse 1s infinite",
                boxShadow: "0 0 6px rgba(255,107,107,0.5)",
              }} />
            )}
          </div>
          
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
            @keyframes blink {
              0%, 49% { opacity: 1; }
              50%, 100% { opacity: 0; }
            }
          `}</style>
        </motion.div>

        {/* Right Sidebar: Command History + Config */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 16, minHeight: 0,
        }}>
          {/* Command History Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            style={{
              background: "rgba(240,235,224,0.033)", border: `1px solid rgba(240,235,224,0.07)`,
              borderRadius: 8, overflow: "hidden", backdropFilter: "blur(16px)",
              flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
            }}
          >
            <div style={{
              padding: "16px", background: P.cockpit,
              borderBottom: `1px solid ${P.bDim}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <I n="history" sz={16} col={P.cognac} />
                <span style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem",
                  color: P.whisper, letterSpacing: "0.1em", textTransform: "uppercase",
                }}>History</span>
              </div>
              <span style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: "0.55rem",
                color: P.whisper,
              }}>{history.length}</span>
            </div>

            <div style={{
              flex: 1, overflowY: "auto", padding: "8px",
              display: "flex", flexDirection: "column", gap: 4,
            }}>
              {history.length === 0 ? (
                <div style={{
                  color: P.whisper, opacity: 0.4, textAlign: "center",
                  padding: "24px 8px", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem",
                }}>
                  No commands yet
                </div>
              ) : (
                history.map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCommand(cmd);
                      inputRef.current?.focus();
                    }}
                    style={{
                      padding: "8px 12px", background: "transparent",
                      border: `1px solid ${P.bMid}`, borderRadius: 3,
                      color: P.parchment, cursor: "pointer",
                      fontFamily: "'JetBrains Mono',monospace", fontSize: "0.7rem",
                      textAlign: "left", overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: "nowrap", transition: "all 0.2s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = P.dash;
                      e.currentTarget.style.color = P.ivory;
                      e.currentTarget.style.borderColor = P.bHi;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = P.parchment;
                      e.currentTarget.style.borderColor = P.bMid;
                    }}
                    title={cmd}
                  >
                    {cmd}
                  </button>
                ))
              )}
            </div>
          </motion.div>

          {/* Quick Commands Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            style={{
              background: "rgba(240,235,224,0.033)", border: `1px solid rgba(240,235,224,0.07)`,
              borderRadius: 8, overflow: "hidden", backdropFilter: "blur(16px)",
              flexShrink: 0,
            }}
          >
            <div style={{
              padding: "16px", background: P.cockpit,
              borderBottom: `1px solid ${P.bDim}`,
            }}>
              <span style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem",
                color: P.whisper, letterSpacing: "0.1em", textTransform: "uppercase",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <I n="flash_on" sz={14} col={P.cognac} />
                Quick Commands
              </span>
            </div>

            <div style={{
              padding: "12px", display: "flex", flexDirection: "column", gap: 8,
            }}>
              {[
                { cmd: "fleet list", icon: "list_alt" },
                { cmd: "logs show 20", icon: "assignment" },
                { cmd: "blockchain status", icon: "security" },
                { cmd: "device reboot ", icon: "restart_alt" },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => executeCommand(item.cmd)}
                  disabled={isRunning}
                  style={{
                    padding: "10px 12px", background: P.cgnDim, color: P.cognac,
                    border: `1px solid ${P.bHi}`, borderRadius: 3,
                    cursor: isRunning ? "not-allowed" : "pointer",
                    fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem",
                    opacity: isRunning ? 0.5 : 1,
                    transition: "all 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                  onMouseEnter={e => {
                    if (!isRunning) {
                      e.currentTarget.style.background = P.cgnGlow;
                      e.currentTarget.style.color = P.ivory;
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = P.cgnDim;
                    e.currentTarget.style.color = P.cognac;
                  }}
                >
                  <I n={item.icon} sz={12} col="inherit" />
                  {item.cmd.split(" ")[0]}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom PSA */}
      <div style={{
        background: "rgba(196,107,107,0.08)", border: `1px solid rgba(196,107,107,0.2)`,
        borderRadius: 6, padding: "14px 16px", display: "flex", alignItems: "start", gap: 12,
      }}>
        <div style={{ marginTop: 2, flexShrink: 0 }}>
          <I n="warning" sz={18} col={P.burg} />
        </div>
        <div>
          <p style={{
            fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem",
            color: P.burg, fontWeight: 600, letterSpacing: "0.04em",
            textTransform: "uppercase", marginBottom: 4,
          }}>⚠️ Command Execution</p>
          <p style={{
            fontFamily: "'JetBrains Mono',monospace", fontSize: "0.62rem",
            color: P.parchment, lineHeight: 1.5,
          }}>
            Ensure all commands are validated before execution. Git operations will affect the repository.
          </p>
        </div>
      </div>
    </div>
  );
}
