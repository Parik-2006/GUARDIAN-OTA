"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import * as THREE from "three";

const COLORS = { bg: "#0D0D0D", cream: "#F5F5DC", gold: "#D4AF37", goldGlow: "rgba(212,175,55,0.4)", safe: "#5A8C5E", danger: "#B85050", glassLight: "rgba(245,245,220,0.08)", glassBorder: "rgba(245,245,220,0.10)" };
const ECU_COMPONENTS: Array<{ id: string; name: string; position: [number, number, number]; color: string }> = [
  { id: "telematics", name: "Telematics", position: [2, 1, 0], color: "#D4AF37" },
  { id: "brake", name: "Brake ECU", position: [-2, 0.5, -1.5], color: "#5A8C5E" },
  { id: "powertrain", name: "Powertrain", position: [0, -1, 1.5], color: "#4A7B9D" },
  { id: "gateway", name: "Gateway", position: [1.5, 0, -0.5], color: "#C17A3A" },
  { id: "sensor", name: "Sensor Fusion", position: [-1.5, 1.5, 0.8], color: "#B85050" },
  { id: "infotainment", name: "Infotainment", position: [0, -1.5, -1], color: "#9B7A2E" },
];

function Car3DViewer({ activeEcu, onEcuSelect }) {
  return (
    <Canvas camera={{ position: [4, 3, 5], fov: 50 }}>
      <ambientLight intensity={0.6} color={0xFFF8E7} />
      <directionalLight position={[8, 10, 5]} intensity={1.2} color={0xFFE4A0} />
      <Sphere args={[2.5, 32, 32]}>
        <meshPhongMaterial color={0xE8D5A0} transparent opacity={0.15} side={THREE.DoubleSide} />
      </Sphere>
      {ECU_COMPONENTS.map((ecu) => (
        <group key={ecu.id} onClick={() => onEcuSelect(ecu.id)}>
          <Sphere args={[0.3, 24, 24]} position={ecu.position} onClick={(e) => { e.stopPropagation(); onEcuSelect(ecu.id); }}>
            <meshPhongMaterial color={new THREE.Color(ecu.color)} emissive={new THREE.Color(ecu.color)} emissiveIntensity={activeEcu === ecu.id ? 1 : 0.2} transparent opacity={activeEcu === ecu.id ? 1 : 0.6} />
          </Sphere>
          <mesh position={ecu.position}>
            <torusGeometry args={[0.45, 0.04, 8, 32]} />
            <meshBasicMaterial color={new THREE.Color(ecu.color)} transparent opacity={activeEcu === ecu.id ? 0.8 : 0.2} />
          </mesh>
        </group>
      ))}
      <OrbitControls enableZoom autoRotate autoRotateSpeed={2} />
    </Canvas>
  );
}

function ConnectedDevicesBar({ devices, onAddDevice, onExit }) {
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 40, height: "56px", background: COLORS.glassLight, backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", borderBottom: `1px solid ${COLORS.glassBorder}`, display: "flex", alignItems: "center", gap: "12px", paddingLeft: "20px", paddingRight: "20px" }}>
      <button onClick={onExit} style={{ background: "transparent", border: "none", color: COLORS.gold, fontSize: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px" }}>⌂</button>
      <span style={{ fontSize: "0.65rem", color: COLORS.gold, letterSpacing: "0.2em", textTransform: "uppercase", whiteSpace: "nowrap" }}>FLEET NODES</span>
      <div style={{ display: "flex", gap: "10px", flex: 1, overflow: "auto" }}>
        {devices.map((d) => (
          <motion.div key={d.deviceId} whileHover={{ scale: 1.05 }} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 10px", background: COLORS.glassLight, border: `1px solid ${COLORS.glassBorder}`, borderRadius: "4px", fontSize: "0.65rem", color: COLORS.cream, whiteSpace: "nowrap" }}>
            <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: d.safetyState === "SAFE" ? COLORS.safe : COLORS.danger }} />
            <span>{d.deviceId.substring(0, 8)}</span>
          </motion.div>
        ))}
      </div>
      <button onClick={onAddDevice} style={{ background: COLORS.goldGlow, border: `1px solid ${COLORS.gold}`, color: COLORS.gold, padding: "6px 12px", borderRadius: "4px", fontSize: "0.65rem", cursor: "pointer", textTransform: "uppercase", whiteSpace: "nowrap" }}>+ ADD</button>
    </motion.div>
  );
}

const CAR_MODELS = [{ id: "interceptor", name: "Interceptor" }, { id: "sentinel", name: "Sentinel" }, { id: "voyager", name: "Voyager" }];

function AddDeviceModal({ isOpen, onClose, onSubmit }) {
  const [deviceId, setDeviceId] = useState("");
  const [carModel, setCarModel] = useState("interceptor");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }} />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 51, width: "90%", maxWidth: "400px", background: COLORS.glassLight, backdropFilter: "blur(30px)", border: `1px solid ${COLORS.glassBorder}`, borderRadius: "12px", padding: "32px" }}>
            <h2 style={{ fontSize: "1.1rem", color: COLORS.cream, marginBottom: "20px", fontWeight: 600 }}>ADD NEW DEVICE</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <input type="text" placeholder="Device ID" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} style={{ width: "100%", padding: "10px", background: COLORS.glassLight, border: `1px solid ${COLORS.glassBorder}`, color: COLORS.cream, borderRadius: "6px" }} />
              <select value={carModel} onChange={(e) => setCarModel(e.target.value)} style={{ width: "100%", padding: "10px", background: COLORS.glassLight, border: `1px solid ${COLORS.glassBorder}`, color: COLORS.cream, borderRadius: "6px" }}>
                {CAR_MODELS.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => { onSubmit({ deviceId, carModel }); setDeviceId(""); onClose(); }} style={{ flex: 1, padding: "10px", background: COLORS.goldGlow, border: `1px solid ${COLORS.gold}`, color: COLORS.gold, cursor: "pointer", borderRadius: "6px" }}>DEPLOY</button>
                <button onClick={onClose} style={{ flex: 1, padding: "10px", background: "transparent", border: `1px solid ${COLORS.glassBorder}`, color: COLORS.cream, cursor: "pointer", borderRadius: "6px" }}>CANCEL</button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function BorderIgnitionCard({ children, onClick }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onClick={onClick} style={{ position: "relative", borderRadius: "12px", overflow: "hidden", cursor: "pointer" }}>
      <div style={{ position: "absolute", inset: 0, background: COLORS.glassLight, border: `1px solid ${isHovered ? COLORS.gold : COLORS.glassBorder}`, borderRadius: "12px", backdropFilter: "blur(30px)", zIndex: 1, transition: "all 0.3s" }} />
      <div style={{ position: "relative", zIndex: 2, padding: "20px" }}>{children}</div>
    </motion.div>
  );
}

function FleetGrid({ devices, onSelectDevice }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", padding: "20px" }}>
      {devices.map((device) => (
        <BorderIgnitionCard key={device.deviceId} onClick={() => onSelectDevice(device)}>
          <h3 style={{ fontSize: "0.9rem", color: COLORS.cream, margin: 0, fontWeight: 600 }}>{device.deviceId}</h3>
          <p style={{ fontSize: "0.7rem", color: COLORS.gold, margin: "4px 0" }}>v{device.otaVersion}</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
            <div style={{ fontSize: "0.65rem", color: COLORS.gold }}>THREAT: {device.threatLevel}</div>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: device.safetyState === "SAFE" ? COLORS.safe : COLORS.danger }} />
          </div>
          <button onClick={(e) => { e.stopPropagation(); onSelectDevice(device); }} style={{ width: "100%", marginTop: "12px", padding: "8px", background: COLORS.goldGlow, border: `1px solid ${COLORS.gold}`, color: COLORS.gold, cursor: "pointer", borderRadius: "6px", fontSize: "0.7rem", textTransform: "uppercase" }}>? VIEW COCKPIT</button>
        </BorderIgnitionCard>
      ))}
    </div>
  );
}

function EncryptionGatePanel() {
  const [encEnabled, setEncEnabled] = useState(true);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: COLORS.glassLight, border: `1px solid ${COLORS.glassBorder}`, backdropFilter: "blur(30px)", borderRadius: "12px", padding: "24px" }}>
      <h3 style={{ fontSize: "0.85rem", color: COLORS.cream, marginBottom: "16px", letterSpacing: "0.1em", textTransform: "uppercase" }}>? ENCRYPTION GATE</h3>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
        <span style={{ fontSize: "0.7rem", color: COLORS.gold }}>ECC P-256 + AES-256-GCM</span>
        <button onClick={() => setEncEnabled(!encEnabled)} style={{ width: "40px", height: "24px", background: encEnabled ? COLORS.safe : COLORS.danger, border: `1px solid ${encEnabled ? COLORS.safe : COLORS.danger}`, borderRadius: "12px", cursor: "pointer", position: "relative" }}>
          <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: COLORS.cream, position: "absolute", top: "2px", left: encEnabled ? "20px" : "2px", transition: "all 0.2s" }} />
        </button>
      </div>
      <p style={{ fontSize: "0.65rem", color: COLORS.gold, margin: 0 }}>STATUS: {encEnabled ? "ACTIVE" : "INACTIVE"}</p>
    </motion.div>
  );
}

function OTAUpdatePanel() {
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: COLORS.glassLight, border: `1px solid ${COLORS.glassBorder}`, backdropFilter: "blur(30px)", borderRadius: "12px", padding: "24px" }}>
      <h3 style={{ fontSize: "0.85rem", color: COLORS.cream, marginBottom: "16px", textTransform: "uppercase" }}>?? OTA DEPLOYMENT</h3>
      <div onClick={() => fileInputRef.current?.click()} style={{ border: `2px dashed ${COLORS.gold}`, borderRadius: "8px", padding: "20px", textAlign: "center", cursor: "pointer", background: COLORS.goldGlow, marginBottom: "12px" }}>
        <div style={{ fontSize: "0.7rem", color: COLORS.cream, fontWeight: 600 }}>DROP .BIN / .HEX</div>
        <div style={{ fontSize: "0.6rem", color: COLORS.gold }}>OR CLICK</div>
        {selectedFile && <div style={{ fontSize: "0.65rem", color: COLORS.gold, marginTop: "8px" }}>?? {selectedFile}</div>}
      </div>
      <input ref={fileInputRef} type="file" accept=".bin,.hex" onChange={(e) => setSelectedFile(e.target.files?.[0]?.name ?? null)} style={{ display: "none" }} />
      <button disabled={!selectedFile} style={{ width: "100%", padding: "10px", background: selectedFile ? COLORS.goldGlow : "rgba(212,175,55,0.1)", border: `1px solid ${COLORS.gold}`, color: COLORS.gold, cursor: selectedFile ? "pointer" : "not-allowed", borderRadius: "6px", opacity: selectedFile ? 1 : 0.5 }}>?? DEPLOY</button>
    </motion.div>
  );
}

export default function Dashboard({ onBackToLanding }) {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeEcu, setActiveEcu] = useState(null);
  const [view, setView] = useState("fleet");

  useEffect(() => {
    const initialFleet = Array.from({ length: 12 }, (_, i) => ({
      deviceId: `GUARDIAN-${1000 + i}`,
      otaVersion: `${i < 3 ? "1" : "2"}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
      safetyState: Math.random() > 0.1 ? "SAFE" : "UNSAFE",
      threatLevel: (["LOW", "MEDIUM", "HIGH"])[Math.floor(Math.random() * 3)],
    }));
    setDevices(initialFleet);
  }, []);

  const handleAddDevice = (data) => {
    setDevices([...devices, { ...data, otaVersion: "1.0.0", safetyState: "SAFE", threatLevel: "LOW" }]);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: COLORS.bg, color: COLORS.cream, fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "fixed", inset: 0, background: `radial-gradient(ellipse 100% 80% at 50% -20%, rgba(212, 175, 55, 0.08) 0%, transparent 50%), radial-gradient(ellipse 80% 100% at 0% 100%, rgba(90, 140, 94, 0.05) 0%, transparent 60%)`, pointerEvents: "none", zIndex: 0 }} />
      <ConnectedDevicesBar devices={devices} onAddDevice={() => setShowAddModal(true)} onExit={onBackToLanding} />
      <AddDeviceModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleAddDevice} />
      <div style={{ flex: 1, overflow: "auto", marginTop: "56px", position: "relative", zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {view === "fleet" ? (
            <motion.div key="fleet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ padding: "20px" }}>
                <h1 style={{ fontSize: "1.8rem", margin: "0 0 20px", color: COLORS.cream }}><span style={{ color: COLORS.gold }}>?</span> FLEET OVERVIEW</h1>
                <FleetGrid devices={devices} onSelectDevice={(device) => { setSelectedDevice(device); setView("detail"); }} />
              </div>
            </motion.div>
          ) : (
            <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ padding: "20px", maxWidth: "1400px" }}>
                <button onClick={() => { setView("fleet"); setSelectedDevice(null); setActiveEcu(null); }} style={{ background: "transparent", border: "none", color: COLORS.gold, fontSize: "1rem", cursor: "pointer", marginBottom: "20px" }}>? BACK</button>
                <h1 style={{ fontSize: "1.6rem", margin: 0, color: COLORS.cream, marginBottom: "20px" }}>{selectedDevice?.deviceId} COCKPIT</h1>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "20px" }}>
                  <div style={{ background: COLORS.glassLight, border: `1px solid ${COLORS.glassBorder}`, borderRadius: "12px", padding: "16px", height: "500px" }}>
                    <Car3DViewer activeEcu={activeEcu} onEcuSelect={setActiveEcu} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <h3 style={{ fontSize: "0.85rem", color: COLORS.gold, margin: 0, textTransform: "uppercase" }}>ECU COMPONENTS</h3>
                    {ECU_COMPONENTS.map((ecu) => (
                      <button key={ecu.id} onClick={() => setActiveEcu(ecu.id)} style={{ background: activeEcu === ecu.id ? COLORS.goldGlow : COLORS.glassLight, border: `1px solid ${activeEcu === ecu.id ? COLORS.gold : COLORS.glassBorder}`, color: COLORS.cream, padding: "10px", borderRadius: "6px", cursor: "pointer", textAlign: "left" }}>
                        <div style={{ color: ecu.color, fontWeight: 600 }}>? {ecu.name}</div>
                        <div style={{ fontSize: "0.6rem", opacity: 0.7 }}>{ecu.id}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <EncryptionGatePanel />
                  <OTAUpdatePanel />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
