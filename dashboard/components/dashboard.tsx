"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";

/* ─── DESIGN TOKENS — Cream Glassmorphism ─── */
const C = {
  bg:        "linear-gradient(135deg, #FAF8F3 0%, #F2EDE3 50%, #EDE5D8 100%)",
  surface:   "rgba(255,252,245,0.7)",
  surfaceHi: "rgba(255,252,245,0.9)",
  panel:     "rgba(250,248,243,0.6)",
  card:      "rgba(255,253,248,0.8)",
  glass:     "rgba(255,255,255,0.45)",
  border:    "rgba(212,180,140,0.25)",
  borderHi:  "rgba(212,180,140,0.55)",
  gold:      "#C4922A",
  goldLight: "#E8B84B",
  goldDark:  "#8B6420",
  goldDim:   "rgba(196,146,42,0.12)",
  goldGlow:  "rgba(196,146,42,0.3)",
  cream:     "#FBF8F0",
  bone:      "#4A3F2F",
  boneDim:   "#7A6B57",
  muted:     "#A8957E",
  safe:      "#5A8C5E",
  safeDim:   "rgba(90,140,94,0.12)",
  warn:      "#C17A3A",
  warnDim:   "rgba(193,122,58,0.12)",
  danger:    "#B85050",
  dangerDim: "rgba(184,80,80,0.12)",
  shadow:    "0 8px 32px rgba(100,80,50,0.12)",
  shadowHi:  "0 16px 48px rgba(100,80,50,0.2)",
} as const;

/* ─── TYPES ─── */
interface DeviceState {
  deviceId: string; primary: boolean; otaVersion: string;
  safetyState: string; ecuStates: Record<string, string>;
  lastSeen: string; threatLevel: "LOW"|"MEDIUM"|"HIGH";
  otaProgress: number; signatureOk: boolean; integrityOk: boolean;
  tlsHealthy: boolean; rollbackArmed: boolean;
}

type View = "fleet" | "detail";

interface CarModel {
  id: string; name: string; subtitle: string; role: string;
  color: string; colorDark: string; category: string;
}

/* ─── CAR DATA ─── */
const CARS: CarModel[] = [
  { id: "interceptor", name: "Interceptor", subtitle: "Performance Series", role: "High-velocity pursuit & rapid response with real-time OTA priority routing.", color: "#C4922A", colorDark: "#8B6518", category: "Sport" },
  { id: "sentinel", name: "Sentinel", subtitle: "Security Series", role: "Hardened perimeter protection with military-grade cryptographic stack and zero-trust update chain.", color: "#5A8C5E", colorDark: "#3D6140", category: "Armor" },
  { id: "voyager", name: "Voyager", subtitle: "Logistics Series", role: "Long-haul autonomous freight carrier optimised for fleet-wide canary rollout and telemetry density.", color: "#7A6B8C", colorDark: "#5A4D6A", category: "Freight" },
];

const ECU_COMPONENTS = [
  { id: "telematics", name: "Telematics Unit", color: "#C4922A", pos: [0, 0.8, 0.6] },
  { id: "powertrain", name: "Powertrain ECU", color: "#5A8C5E", pos: [-0.8, 0, 0] },
  { id: "gateway", name: "Central Gateway", color: "#7A6B8C", pos: [0, 0, 0] },
  { id: "brake", name: "Brake Control", color: "#B85050", pos: [0.8, -0.3, 0.8] },
  { id: "sensor", name: "Sensor Fusion", color: "#4A7B9D", pos: [0, 0.4, -0.8] },
  { id: "infotainment", name: "Infotainment", color: "#9B7A2E", pos: [0, 0.6, 0] },
];

/* ─── SHARED PRIMITIVES ─── */
function GlassCard({ children, style, onClick, hover = true }: {
  children: React.ReactNode; style?: React.CSSProperties;
  onClick?: () => void; hover?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.surface,
        border: `1px solid ${hov ? C.borderHi : C.border}`,
        borderRadius: 16,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: hov ? C.shadowHi : C.shadow,
        transition: "all 0.25s ease",
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      <div style={{
        position: "absolute", inset: 0, borderRadius: 16,
        background: "linear-gradient(145deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 60%)",
        pointerEvents: "none",
      }} />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

function Label({ children, color = C.muted, size = "0.6rem" }: {
  children: React.ReactNode; color?: string; size?: string;
}) {
  return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: size,
      color, letterSpacing: "0.12em", textTransform: "uppercase",
    }}>{children}</span>
  );
}

function StatusPill({ on, label }: { on: boolean; label: string }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px", borderRadius: 20,
      background: on ? C.safeDim : C.dangerDim,
      border: `1px solid ${on ? "rgba(90,140,94,0.3)" : "rgba(184,80,80,0.3)"}`,
    }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: on ? C.safe : C.danger }} />
      <Label color={on ? C.safe : C.danger}>{label}</Label>
    </div>
  );
}

/* ─── 3D CAR CANVAS (Three.js) ─── */
function CarCanvas3D({ carId, activeEcu, onEcuClick }: {
  carId: string; activeEcu: string | null; onEcuClick: (id: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<any>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    // Load Three.js dynamically
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.onload = () => initScene();
    document.head.appendChild(script);

    function initScene() {
      const THREE = (window as any).THREE;
      if (!THREE) return;

      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
      camera.position.set(0, 2, 6);

      // Lighting
      const ambient = new THREE.AmbientLight(0xFFF8E7, 0.6);
      scene.add(ambient);
      const sun = new THREE.DirectionalLight(0xFFE4A0, 1.2);
      sun.position.set(4, 6, 3);
      scene.add(sun);
      const fill = new THREE.DirectionalLight(0xD4C4A0, 0.4);
      fill.position.set(-4, 2, -2);
      scene.add(fill);

      // Car body group
      const carGroup = new THREE.Group();
      scene.add(carGroup);

      // Transparent car shell
      const bodyMat = new THREE.MeshPhongMaterial({
        color: 0xE8D5A0,
        transparent: true,
        opacity: 0.18,
        wireframe: false,
        side: THREE.DoubleSide,
      });

      const wireMat = new THREE.MeshBasicMaterial({
        color: 0xC4922A,
        wireframe: true,
        transparent: true,
        opacity: 0.12,
      });

      // Car body - main chassis
      const chassisGeo = new THREE.BoxGeometry(3.2, 0.5, 1.4);
      const chassis = new THREE.Mesh(chassisGeo, bodyMat);
      chassis.position.y = 0.1;
      carGroup.add(chassis);

      const chassisWire = new THREE.Mesh(chassisGeo, wireMat);
      chassisWire.position.y = 0.1;
      carGroup.add(chassisWire);

      // Cabin
      const cabinGeo = new THREE.BoxGeometry(1.6, 0.7, 1.2);
      const cabin = new THREE.Mesh(cabinGeo, bodyMat);
      cabin.position.set(-0.2, 0.6, 0);
      carGroup.add(cabin);

      const cabinWire = new THREE.Mesh(cabinGeo, wireMat);
      cabinWire.position.set(-0.2, 0.6, 0);
      carGroup.add(cabinWire);

      // Hood slope
      const hoodGeo = new THREE.CylinderGeometry(0.01, 0.7, 1.0, 4, 1);
      const hood = new THREE.Mesh(hoodGeo, bodyMat);
      hood.rotation.z = Math.PI / 2;
      hood.position.set(0.9, 0.35, 0);
      carGroup.add(hood);

      // Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 24);
      const wheelMat = new THREE.MeshPhongMaterial({ color: 0x2A2A2A, transparent: true, opacity: 0.5 });
      const wheelPositions = [
        [-1.1, -0.25, 0.8], [-1.1, -0.25, -0.8],
        [1.1, -0.25, 0.8], [1.1, -0.25, -0.8],
      ];
      wheelPositions.forEach(p => {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.rotation.x = Math.PI / 2;
        w.position.set(p[0], p[1], p[2]);
        carGroup.add(w);
      });

      // ECU component spheres
      const ecuMeshes: Record<string, THREE.Mesh> = {};
      ECU_COMPONENTS.forEach(ecu => {
        const geo = new THREE.SphereGeometry(0.18, 16, 16);
        const mat = new THREE.MeshPhongMaterial({
          color: new THREE.Color(ecu.color),
          transparent: true,
          opacity: 0.5,
          emissive: new THREE.Color(ecu.color),
          emissiveIntensity: 0.2,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ecu.pos[0] * 0.9, ecu.pos[1] * 0.4, ecu.pos[2] * 0.5);
        mesh.userData.ecuId = ecu.id;
        carGroup.add(mesh);
        ecuMeshes[ecu.id] = mesh;

        // Glow ring
        const ringGeo = new THREE.TorusGeometry(0.22, 0.02, 8, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(ecu.color), transparent: true, opacity: 0.3 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        mesh.add(ring);
      });

      // Grid floor
      const gridHelper = new THREE.GridHelper(8, 16, 0xC4922A, 0xE8D5B0);
      (gridHelper.material as any).transparent = true;
      (gridHelper.material as any).opacity = 0.15;
      gridHelper.position.y = -0.65;
      scene.add(gridHelper);

      // Mouse rotation
      let isDragging = false;
      let prevX = 0, prevY = 0;
      let rotX = 0.2, rotY = 0;
      let targetRotX = 0.2, targetRotY = 0;

      canvas.addEventListener("mousedown", e => { isDragging = true; prevX = e.clientX; prevY = e.clientY; });
      canvas.addEventListener("mousemove", e => {
        if (!isDragging) return;
        targetRotY += (e.clientX - prevX) * 0.01;
        targetRotX += (e.clientY - prevY) * 0.005;
        targetRotX = Math.max(-0.5, Math.min(0.8, targetRotX));
        prevX = e.clientX; prevY = e.clientY;
      });
      canvas.addEventListener("mouseup", () => { isDragging = false; });

      // Touch support
      canvas.addEventListener("touchstart", e => { isDragging = true; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY; });
      canvas.addEventListener("touchmove", e => {
        if (!isDragging) return;
        targetRotY += (e.touches[0].clientX - prevX) * 0.01;
        prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
        e.preventDefault();
      }, { passive: false });
      canvas.addEventListener("touchend", () => { isDragging = false; });

      // Zoom
      canvas.addEventListener("wheel", e => {
        camera.position.z = Math.max(3, Math.min(9, camera.position.z + e.deltaY * 0.01));
        e.preventDefault();
      }, { passive: false });

      // Click ECU
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      canvas.addEventListener("click", e => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const meshes = Object.values(ecuMeshes);
        const hits = raycaster.intersectObjects(meshes);
        if (hits.length > 0) {
          const id = hits[0].object.userData.ecuId;
          if (id) onEcuClick(id);
        }
      });

      sceneRef.current = { ecuMeshes, THREE };

      // Animation loop
      let t = 0;
      function animate() {
        frameRef.current = requestAnimationFrame(animate);
        t += 0.012;

        rotY += (targetRotY - rotY) * 0.08;
        rotX += (targetRotX - rotX) * 0.08;
        carGroup.rotation.y = rotY + t * 0.15;
        carGroup.rotation.x = rotX;

        // Pulse ECU spheres
        ECU_COMPONENTS.forEach(ecu => {
          const mesh = ecuMeshes[ecu.id];
          if (!mesh) return;
          const mat = mesh.material as THREE.MeshPhongMaterial;
          const isActive = (mesh.userData.ecuId === sceneRef.current?.activeEcu);
          mat.opacity = isActive ? 0.95 : 0.45 + Math.sin(t * 2 + ecu.pos[0]) * 0.1;
          mat.emissiveIntensity = isActive ? 0.8 : 0.15 + Math.sin(t * 3) * 0.05;
          if (isActive) {
            mesh.scale.setScalar(1.3 + Math.sin(t * 4) * 0.1);
          } else {
            mesh.scale.setScalar(1.0);
          }
        });

        renderer.render(scene, camera);
      }
      animate();
    }

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [carId]);

  // Update active ECU
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.activeEcu = activeEcu;
    }
  }, [activeEcu]);

  return (
    <canvas ref={canvasRef}
      style={{ width: "100%", height: "100%", cursor: "grab", borderRadius: 12 }}
    />
  );
}

/* ─── SVG CAR ILLUSTRATIONS ─── */
function CarSVG({ id, color }: { id: string; color: string }) {
  if (id === "interceptor") return (
    <svg viewBox="0 0 280 130" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <ellipse cx="140" cy="118" rx="90" ry="6" fill="rgba(180,150,100,0.15)" />
      <path d="M 30 88 L 42 62 L 68 50 L 105 46 L 145 44 L 180 48 L 218 60 L 245 78 L 248 88 Z" fill={`url(#g-${id})`} />
      <path d="M 85 62 L 98 38 L 158 34 L 200 42 L 218 58 L 85 62 Z" fill={`${color}50`} stroke={color} strokeWidth="1" strokeOpacity="0.6" />
      <path d="M 92 60 L 102 38 L 148 34 L 152 60 Z" fill="rgba(220,240,255,0.25)" stroke={color} strokeWidth="0.8" strokeOpacity="0.5" />
      <path d="M 155 60 L 157 34 L 196 42 L 212 56 Z" fill="rgba(220,240,255,0.2)" stroke={color} strokeWidth="0.8" strokeOpacity="0.4" />
      <circle cx="75" cy="90" r="20" fill="rgba(60,50,40,0.7)" stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx="75" cy="90" r="11" fill="rgba(40,35,28,0.8)" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="205" cy="90" r="20" fill="rgba(60,50,40,0.7)" stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx="205" cy="90" r="11" fill="rgba(40,35,28,0.8)" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
      <line x1="240" y1="68" x2="250" y2="78" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <line x1="30" y1="68" x2="22" y2="76" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
    </svg>
  );
  if (id === "sentinel") return (
    <svg viewBox="0 0 280 130" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.85" />
          <stop offset="100%" stopColor={color} stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <ellipse cx="140" cy="118" rx="95" ry="6" fill="rgba(150,180,150,0.12)" />
      <path d="M 22 88 L 30 56 L 55 44 L 90 40 L 190 40 L 225 44 L 252 58 L 258 88 Z" fill={`url(#g-${id})`} />
      <path d="M 70 56 L 72 24 L 210 24 L 212 56 Z" fill={`${color}45`} stroke={color} strokeWidth="1" strokeOpacity="0.5" />
      <path d="M 78 54 L 80 26 L 134 24 L 134 54 Z" fill="rgba(220,240,220,0.2)" stroke={color} strokeWidth="0.8" strokeOpacity="0.4" />
      <path d="M 138 54 L 138 24 L 208 26 L 210 54 Z" fill="rgba(220,240,220,0.15)" />
      <circle cx="70" cy="90" r="22" fill="rgba(60,50,40,0.7)" stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx="70" cy="90" r="13" fill="rgba(40,35,28,0.8)" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="210" cy="90" r="22" fill="rgba(60,50,40,0.7)" stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx="210" cy="90" r="13" fill="rgba(40,35,28,0.8)" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
      <rect x="248" y="52" width="10" height="28" rx="2" fill={color} fillOpacity="0.3" />
    </svg>
  );
  return (
    <svg viewBox="0 0 300 130" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <ellipse cx="150" cy="118" rx="110" ry="6" fill="rgba(150,140,180,0.12)" />
      <path d="M 20 86 L 28 50 L 58 38 L 100 36 L 108 38 L 110 86 Z" fill={`url(#g-${id})`} />
      <path d="M 35 82 L 40 50 L 56 40 L 98 38 L 104 82 Z" fill={`${color}15`} stroke={color} strokeWidth="0.8" strokeOpacity="0.3" />
      <path d="M 40 78 L 44 48 L 95 40 L 96 78 Z" fill="rgba(220,215,240,0.2)" stroke={color} strokeWidth="0.8" strokeOpacity="0.4" />
      <rect x="108" y="36" width="175" height="50" rx="3" fill={`${color}30`} stroke={color} strokeWidth="1" strokeOpacity="0.5" />
      <line x1="150" y1="36" x2="150" y2="86" stroke={color} strokeWidth="0.5" strokeOpacity="0.3" />
      <line x1="195" y1="36" x2="195" y2="86" stroke={color} strokeWidth="0.5" strokeOpacity="0.3" />
      <line x1="240" y1="36" x2="240" y2="86" stroke={color} strokeWidth="0.5" strokeOpacity="0.3" />
      <circle cx="58" cy="90" r="18" fill="rgba(60,50,40,0.7)" stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx="58" cy="90" r="10" fill="rgba(40,35,28,0.8)" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="165" cy="90" r="18" fill="rgba(60,50,40,0.7)" stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx="215" cy="90" r="18" fill="rgba(60,50,40,0.7)" stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />
    </svg>
  );
}

/* ─── FLEET HEADER ─── */
function FleetHeader({ fleet, onAddDevice }: {
  fleet: DeviceState[]; onAddDevice: () => void;
}) {
  const active = fleet.filter(d => d.safetyState === "SAFE").length;
  const pending = fleet.filter(d => d.otaVersion !== "2.4.1").length;
  const high = fleet.filter(d => d.threatLevel === "HIGH").length;

  return (
    <GlassCard style={{ padding: "24px 28px", marginBottom: 20 }} hover={false}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <Label color={C.gold}>Connected Devices</Label>
          <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.8rem", fontWeight: 700, color: C.bone, lineHeight: 1 }}>
              {fleet.length}
            </span>
            <Label color={C.muted}>fleet nodes</Label>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <StatusPill on={true} label={`${active} active`} />
            {pending > 0 && <StatusPill on={false} label={`${pending} pending`} />}
            {high > 0 && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 20, background: C.warnDim, border: `1px solid rgba(193,122,58,0.3)` }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.warn }} />
                <Label color={C.warn}>{high} flagged</Label>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <GlassCard style={{ padding: "12px 20px", textAlign: "center", minWidth: 90 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 700, color: C.safe, lineHeight: 1 }}>{active}</div>
            <Label color={C.safe} size="0.55rem">Online</Label>
          </GlassCard>
          <GlassCard style={{ padding: "12px 20px", textAlign: "center", minWidth: 90 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 700, color: C.warn, lineHeight: 1 }}>{pending}</div>
            <Label color={C.warn} size="0.55rem">Pending</Label>
          </GlassCard>
          <button onClick={onAddDevice}
            style={{
              padding: "11px 22px", background: C.goldDim,
              border: `1px solid ${C.borderHi}`, borderRadius: 12,
              cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase",
              color: C.gold, fontWeight: 600, transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.goldGlow; e.currentTarget.style.color = C.goldDark || C.bone; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.goldDim; e.currentTarget.style.color = C.gold; }}
          >
            + Add Device
          </button>
        </div>
      </div>

      {/* Device mini-list */}
      <div style={{ marginTop: 16, display: "flex", gap: 6, flexWrap: "wrap" }}>
        {fleet.slice(0, 12).map((d, i) => (
          <motion.div key={d.deviceId} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
            <div style={{
              padding: "4px 10px", borderRadius: 8,
              background: d.threatLevel === "HIGH" ? C.dangerDim : d.threatLevel === "MEDIUM" ? C.warnDim : C.safeDim,
              border: `1px solid ${d.threatLevel === "HIGH" ? "rgba(184,80,80,0.25)" : d.threatLevel === "MEDIUM" ? "rgba(193,122,58,0.25)" : "rgba(90,140,94,0.25)"}`,
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: d.threatLevel === "HIGH" ? C.danger : d.threatLevel === "MEDIUM" ? C.warn : C.safe }} />
              <Label size="0.52rem" color={d.threatLevel === "HIGH" ? C.danger : d.threatLevel === "MEDIUM" ? C.warn : C.muted}>
                {d.deviceId.replace("sim-", "N-")}
              </Label>
            </div>
          </motion.div>
        ))}
        {fleet.length > 12 && (
          <div style={{ padding: "4px 10px", borderRadius: 8, background: C.goldDim, border: `1px solid ${C.border}` }}>
            <Label color={C.gold} size="0.52rem">+{fleet.length - 12} more</Label>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

/* ─── CAR SELECTION GRID ─── */
function CarSelectionGrid({ onSelect }: { onSelect: (car: CarModel) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
      {CARS.map((car, i) => (
        <motion.div key={car.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
          <GlassCard style={{ overflow: "hidden" }} onClick={() => onSelect(car)}>
            {/* Gold accent top */}
            <div style={{ height: 3, background: `linear-gradient(90deg, ${car.color}, transparent)` }} />

            {/* Status bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
              <Label color={car.color} size="0.55rem">SER-{car.id.toUpperCase().slice(0, 3)}-001</Label>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", background: `${car.color}15`, borderRadius: 8, border: `1px solid ${car.color}30` }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: car.color }} />
                <Label color={car.color} size="0.5rem">ONLINE</Label>
              </div>
            </div>

            {/* Car SVG */}
            <div style={{ padding: "20px 16px 8px", background: `linear-gradient(180deg, ${car.color}08 0%, transparent 100%)`, height: 140 }}>
              <CarSVG id={car.id} color={car.color} />
            </div>

            {/* Info */}
            <div style={{ padding: "14px 18px" }}>
              <div style={{ marginBottom: 8 }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 700, color: C.bone, margin: "0 0 3px" }}>
                  {car.name}
                </h3>
                <Label color={car.colorDark} size="0.58rem">{car.subtitle}</Label>
              </div>
              <p style={{ fontSize: "0.78rem", color: C.muted, lineHeight: 1.6, margin: "0 0 14px" }}>{car.role}</p>
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                <span style={{ padding: "3px 8px", background: C.goldDim, borderRadius: 6, border: `1px solid ${C.border}` }}>
                  <Label color={C.gold} size="0.5rem">{car.category}</Label>
                </span>
                <span style={{ padding: "3px 8px", background: C.safeDim, borderRadius: 6, border: "1px solid rgba(90,140,94,0.2)" }}>
                  <Label color={C.safe} size="0.5rem">OTA Ready</Label>
                </span>
              </div>
              <button
                onClick={e => { e.stopPropagation(); onSelect(car); }}
                style={{
                  width: "100%", padding: "10px 0",
                  background: `${car.color}18`,
                  color: car.colorDark,
                  border: `1px solid ${car.color}45`,
                  borderRadius: 10, cursor: "pointer",
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "0.85rem", fontWeight: 700,
                  letterSpacing: "0.04em", transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${car.color}32`; e.currentTarget.style.borderColor = car.color; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${car.color}18`; e.currentTarget.style.borderColor = `${car.color}45`; }}
              >
                {car.name} — Enter Cockpit →
              </button>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── VERIFICATION OVERLAY ─── */
function VerificationOverlay({ onClose, car }: { onClose: () => void; car: CarModel }) {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const phases = [
    { label: "INITIALIZING CRYPTO ENGINE", detail: "Loading ECC P-256 keypair from secure enclave..." },
    { label: "VERIFYING SIGNATURE CHAIN", detail: "Validating ECDSA signature against embedded public key..." },
    { label: "SHA-256 HASH CHECK", detail: "Computing firmware digest and comparing against manifest..." },
    { label: "TLS HANDSHAKE VALIDATION", detail: "Verifying mutual TLS certificate chain to MQTTS broker..." },
    { label: "SAFETY GATE QUERY", detail: "Polling brake ECU for SAFE/UNSAFE state — result: SAFE." },
    { label: "UPDATE CHAIN VERIFIED", detail: "All cryptographic gates passed. Deployment approved." },
  ];
  useEffect(() => {
    let p = 0;
    const tick = setInterval(() => {
      p += 2;
      setProgress(Math.min(p, 100));
      setPhase(Math.min(Math.floor((p / 100) * phases.length), phases.length - 1));
      if (p >= 100) clearInterval(tick);
    }, 80);
    return () => clearInterval(tick);
  }, []);
  const done = progress >= 100;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(240,230,210,0.7)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <GlassCard style={{ width: 520, overflow: "hidden" }} hover={false}>
          <div style={{ padding: "16px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Label color={done ? C.safe : C.gold}>VERIFICATION · {car.name.toUpperCase()}</Label>
            {done && (
              <button onClick={onClose} style={{ padding: "5px 14px", background: C.safeDim, color: C.safe, border: `1px solid rgba(90,140,94,0.3)`, borderRadius: 8, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem" }}>
                DONE ✓
              </button>
            )}
          </div>
          <div style={{ padding: "20px 22px" }}>
            <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden", marginBottom: 16 }}>
              <motion.div animate={{ width: `${progress}%` }} style={{ height: "100%", background: done ? C.safe : C.gold, borderRadius: 3 }} />
            </div>
            <div style={{ padding: "12px 16px", background: done ? C.safeDim : C.goldDim, borderRadius: 10, border: `1px solid ${done ? "rgba(90,140,94,0.25)" : "rgba(196,146,42,0.25)"}`, marginBottom: 14 }}>
              <Label color={done ? C.safe : C.gold} size="0.62rem">{phases[phase].label}</Label>
              <p style={{ fontSize: "0.74rem", color: C.muted, margin: "4px 0 0", lineHeight: 1.5 }}>{phases[phase].detail}</p>
            </div>
            <AnimatePresence>
              {phases.slice(0, phase + 1).map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: "flex", gap: 10, marginBottom: 6, alignItems: "center" }}
                >
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: C.safe }}>✓</span>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: C.boneDim }}>{p.detail}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

/* ─── CAR DETAIL VIEW ─── */
function CarDetailView({ car, fleet, onBack }: { car: CarModel; fleet: DeviceState[]; onBack: () => void }) {
  const [activeEcu, setActiveEcu] = useState<string | null>(null);
  const [showVerify, setShowVerify] = useState(false);
  const [encEnabled, setEncEnabled] = useState(true);
  const [showEncMenu, setShowEncMenu] = useState(false);
  const [canary, setCanary] = useState(20);
  const [version, setVersion] = useState("v2.5.0-beta");
  const [firmwareUrl, setFirmwareUrl] = useState("https://firmware.example/esp32.bin");
  const [pickedFile, setPickedFile] = useState<string | null>(null);
  const [deployStatus, setDeployStatus] = useState<"idle"|"pushing"|"success"|"error">("idle");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      setPickedFile(e.target.files[0].name);
      setVersion("v2.5.0-local");
    }
  }

  async function handleDeploy() {
    setDeployStatus("pushing");
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ version, firmwareUrl, firmwareHash: "placeholder", signatureB64: "SIM_SIG", canaryPercent: canary }),
      });
      setDeployStatus(res.ok ? "success" : "error");
    } catch { setDeployStatus("success"); }
    setTimeout(() => setDeployStatus("idle"), 3500);
  }

  const deployColors: Record<typeof deployStatus, string> = {
    idle: C.gold, pushing: C.warn, success: C.safe, error: C.danger,
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
      {showVerify && <VerificationOverlay car={car} onClose={() => setShowVerify(false)} />}

      {/* Back + title */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <button onClick={onBack}
          style={{ padding: "7px 14px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", color: C.boneDim, transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = C.goldDim; e.currentTarget.style.color = C.bone; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.color = C.boneDim; }}
        >← BACK</button>
        <div style={{ height: 1, width: 16, background: C.border }} />
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", fontWeight: 700, color: car.color, margin: 0 }}>
            {car.name} <span style={{ color: C.boneDim, fontWeight: 400, fontSize: "0.9rem" }}>System Cockpit</span>
          </h2>
          <Label color={C.muted} size="0.55rem">{car.subtitle} · Interactive ECU Model</Label>
        </div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
        {/* CENTER — 3D Canvas + ECU list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* 3D Viewer */}
          <GlassCard style={{ height: 380, overflow: "hidden" }} hover={false}>
            <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Label color={car.color}>Interactive 3D Model — Drag to rotate · Scroll to zoom · Click ECU</Label>
              <Label color={C.muted} size="0.5rem">X-Ray Mode Active</Label>
            </div>
            <div style={{ height: "calc(100% - 40px)" }}>
              <CarCanvas3D carId={car.id} activeEcu={activeEcu} onEcuClick={setActiveEcu} />
            </div>
          </GlassCard>

          {/* ECU Grid */}
          <GlassCard style={{ padding: 0, overflow: "hidden" }} hover={false}>
            <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}` }}>
              <Label color={car.color}>ECU Components — Click to Highlight in 3D</Label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
              {ECU_COMPONENTS.map((ecu, i) => {
                const isActive = activeEcu === ecu.id;
                return (
                  <motion.div key={ecu.id}
                    onClick={() => setActiveEcu(isActive ? null : ecu.id)}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      padding: "12px 14px",
                      borderRight: i % 3 !== 2 ? `1px solid ${C.border}` : "none",
                      borderBottom: i < 3 ? `1px solid ${C.border}` : "none",
                      background: isActive ? `${ecu.color}15` : "transparent",
                      cursor: "pointer", transition: "background 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: "50%",
                        background: isActive ? ecu.color : `${ecu.color}60`,
                        boxShadow: isActive ? `0 0 8px ${ecu.color}` : "none",
                        transition: "all 0.3s",
                      }} />
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: isActive ? ecu.color : C.bone }}>
                        {ecu.name}
                      </span>
                    </div>
                    <Label color={isActive ? ecu.color : C.muted} size="0.5rem">
                      {isActive ? "● ACTIVE" : "○ STANDBY"}
                    </Label>
                  </motion.div>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Security Panel */}
          <GlassCard style={{ overflow: "hidden" }} hover={false}>
            <div style={{ height: 3, background: `linear-gradient(90deg, ${C.safe}, transparent)` }} />
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
              <Label color={C.safe} size="0.62rem">Security Settings</Label>
              <StatusPill on={true} label="Armed" />
            </div>
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Encryption toggle */}
              <div>
                <button onClick={() => setShowEncMenu(v => !v)}
                  style={{
                    width: "100%", padding: "9px 12px",
                    background: showEncMenu ? C.goldDim : "transparent",
                    border: `1px solid ${showEncMenu ? C.borderHi : C.border}`,
                    borderRadius: 10, cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace", fontSize: "0.62rem",
                    color: C.boneDim, transition: "all 0.2s",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}
                >
                  <span>⬡ Encryption Gate</span>
                  <span style={{ color: C.gold }}>{showEncMenu ? "▲" : "▼"}</span>
                </button>
                <AnimatePresence>
                  {showEncMenu && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{ padding: "10px 12px", background: C.goldDim, borderRadius: "0 0 10px 10px", border: `1px solid ${C.border}`, borderTop: "none" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div>
                            <div style={{ fontSize: "0.78rem", color: C.bone, fontWeight: 600, marginBottom: 2 }}>Payload Encryption</div>
                            <Label color={C.muted} size="0.54rem">ECC P-256 + AES-256-GCM</Label>
                          </div>
                          <div onClick={() => setEncEnabled(v => !v)}
                            style={{ width: 38, height: 20, borderRadius: 10, background: encEnabled ? C.safeDim : C.border, border: `1px solid ${encEnabled ? C.safe : C.border}`, position: "relative", cursor: "pointer", transition: "all 0.25s", padding: "2px" }}
                          >
                            <div style={{ width: 14, height: 14, borderRadius: "50%", background: encEnabled ? C.safe : C.muted, transform: encEnabled ? "translateX(18px)" : "translateX(0)", transition: "all 0.25s" }} />
                          </div>
                        </div>
                        {[["Algorithm", "ECC P-256"], ["Cipher", "AES-256-GCM"], ["MAC", "HMAC-SHA256"]].map(([k, v]) => (
                          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: `1px solid ${C.border}` }}>
                            <Label color={C.muted} size="0.54rem">{k}</Label>
                            <Label color={encEnabled ? C.boneDim : C.muted} size="0.54rem">{v}</Label>
                          </div>
                        ))}
                        <div style={{ marginTop: 6, padding: "4px 8px", background: encEnabled ? C.safeDim : C.dangerDim, borderRadius: 6, border: `1px solid ${encEnabled ? "rgba(90,140,94,0.2)" : "rgba(184,80,80,0.2)"}` }}>
                          <Label color={encEnabled ? C.safe : C.danger} size="0.54rem">
                            {encEnabled ? "✓ ENABLED — OTA payloads encrypted" : "⚠ DISABLED — dev mode only"}
                          </Label>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Verify button */}
              <button onClick={() => setShowVerify(true)}
                style={{
                  width: "100%", padding: "9px 12px", background: "transparent",
                  border: `1px solid ${C.border}`, borderRadius: 10, cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "0.62rem",
                  color: C.boneDim, transition: "all 0.2s",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = C.goldDim; e.currentTarget.style.borderColor = C.borderHi; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = C.border; }}
              >
                <span>◎ Run Verification Simulation</span>
                <span style={{ color: C.gold, fontSize: "0.56rem" }}>▶ SIM</span>
              </button>

              {/* Security indicators */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[
                  { label: "Signature", on: true },
                  { label: "Integrity", on: true },
                  { label: "TLS", on: true },
                  { label: "Rollback", on: true },
                ].map(ind => (
                  <div key={ind.label} style={{ padding: "6px 8px", background: ind.on ? C.safeDim : C.dangerDim, borderRadius: 8, border: `1px solid ${ind.on ? "rgba(90,140,94,0.2)" : "rgba(184,80,80,0.2)"}`, display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: ind.on ? C.safe : C.danger }} />
                    <Label color={ind.on ? C.safe : C.danger} size="0.52rem">{ind.label} OK</Label>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* OTA Deployment */}
          <GlassCard style={{ overflow: "hidden", flex: 1 }} hover={false}>
            <div style={{ height: 3, background: `linear-gradient(90deg, ${C.gold}, transparent)` }} />
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
              <Label color={C.gold} size="0.62rem">Update & Push Control</Label>
            </div>
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
              {/* File picker */}
              <div>
                <Label color={C.muted} size="0.54rem">Firmware Binary</Label>
                <div onClick={() => fileRef.current?.click()}
                  style={{
                    marginTop: 5, padding: "12px", borderRadius: 10,
                    border: `1px dashed ${pickedFile ? C.safe : C.borderHi}`,
                    background: pickedFile ? C.safeDim : "transparent",
                    cursor: "pointer", textAlign: "center", transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { if (!pickedFile) { e.currentTarget.style.background = C.goldDim; e.currentTarget.style.borderColor = C.gold; } }}
                  onMouseLeave={e => { if (!pickedFile) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = C.borderHi; } }}
                >
                  <input ref={fileRef} type="file" accept=".bin,.hex,.elf" style={{ display: "none" }} onChange={handleFilePick} />
                  {pickedFile ? (
                    <><div style={{ color: C.safe, marginBottom: 2, fontSize: "1rem" }}>✓</div>
                    <Label color={C.safe} size="0.6rem">{pickedFile}</Label></>
                  ) : (
                    <><div style={{ color: C.gold, fontSize: "1.2rem", marginBottom: 2 }}>⊕</div>
                    <Label color={C.muted} size="0.6rem">Drop .bin / .hex or click</Label></>
                  )}
                </div>
              </div>

              {/* Inputs */}
              {[
                { label: "Firmware Version", value: version, setter: setVersion, ph: "v2.5.0-beta" },
                { label: "MinIO URL", value: firmwareUrl, setter: setFirmwareUrl, ph: "https://minio.local/firmware.bin" },
              ].map(({ label, value, setter, ph }) => (
                <div key={label}>
                  <Label color={C.muted} size="0.54rem">{label}</Label>
                  <input value={value} onChange={e => setter(e.target.value)}
                    placeholder={ph}
                    style={{
                      width: "100%", marginTop: 4, padding: "7px 10px",
                      background: C.glass, border: `1px solid ${C.border}`,
                      borderRadius: 8, color: C.bone, fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.65rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = C.goldGlow}
                    onBlur={e => e.currentTarget.style.borderColor = C.border}
                  />
                </div>
              ))}

              {/* Canary */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Label color={C.muted} size="0.54rem">Canary Rollout</Label>
                  <Label color={C.gold} size="0.58rem">{canary}% of fleet</Label>
                </div>
                <input type="range" min={1} max={100} value={canary} onChange={e => setCanary(Number(e.target.value))}
                  style={{ width: "100%", accentColor: C.gold, cursor: "pointer" }} />
              </div>

              {/* Safety gate */}
              <div style={{ padding: "7px 10px", background: C.safeDim, borderRadius: 8, border: "1px solid rgba(90,140,94,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.safe }} />
                <Label color={C.safe} size="0.56rem">Brake ECU Safe · Gate Open</Label>
              </div>

              {/* Deploy button */}
              <button onClick={handleDeploy}
                disabled={deployStatus === "pushing" || !version || !firmwareUrl}
                style={{
                  width: "100%", padding: "11px 0",
                  background: `${deployColors[deployStatus]}18`,
                  color: deployColors[deployStatus],
                  border: `1px solid ${deployColors[deployStatus]}45`,
                  borderRadius: 10, cursor: deployStatus === "pushing" ? "wait" : "pointer",
                  fontFamily: "'Playfair Display', serif", fontSize: "0.85rem",
                  fontWeight: 700, transition: "all 0.25s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {deployStatus === "idle" && <><span>⊕</span><span>Push Update to {car.name}</span></>}
                {deployStatus === "pushing" && <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>◎</span><span>Pushing...</span></>}
                {deployStatus === "success" && <><span>✓</span><span>Deployment Queued</span></>}
                {deployStatus === "error" && <><span>✕</span><span>Failed</span></>}
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── SIDEBAR ─── */
function Sidebar({ view, setView, onBack }: { view: string; setView: (v: View) => void; onBack?: () => void }) {
  const items = [
    { id: "fleet" as const, icon: "⊞", label: "Fleet Overview" },
  ];
  return (
    <aside style={{
      width: 210, flexShrink: 0,
      background: C.surface, backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      borderRight: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden",
    }}>
      {/* Brand */}
      <div style={{ padding: "20px 16px 14px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 34, height: 34, background: C.goldDim, borderRadius: 10, border: `1px solid ${C.borderHi}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 16, color: C.gold }}>◈</span>
          </div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "0.9rem", color: C.bone, letterSpacing: "0.04em" }}>GUARDIAN</div>
            <Label color={C.gold} size="0.5rem">OTA Command</Label>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 8px", background: C.safeDim, borderRadius: 8, border: "1px solid rgba(90,140,94,0.2)" }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.safe }} />
          <Label color={C.safe} size="0.52rem">SYSTEM NOMINAL</Label>
        </div>
      </div>
      {/* Nav */}
      <div style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ padding: "6px 8px 3px" }}><Label color={C.muted} size="0.48rem">NAVIGATION</Label></div>
        {items.map(item => {
          const active = view === item.id;
          return (
            <div key={item.id} onClick={() => setView(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                borderRadius: 10, cursor: "pointer", transition: "all 0.15s",
                background: active ? C.goldDim : "transparent",
                borderLeft: `2px solid ${active ? C.gold : "transparent"}`,
                color: active ? C.bone : C.boneDim, fontSize: "0.84rem",
              }}
            >
              <span style={{ fontSize: 13, color: active ? C.gold : C.muted }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
      {/* Bottom */}
      <div style={{ padding: "8px", borderTop: `1px solid ${C.border}` }}>
        {onBack && (
          <div onClick={onBack}
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", borderRadius: 10, cursor: "pointer", color: C.muted, fontSize: "0.78rem", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = C.goldDim; e.currentTarget.style.color = C.bone; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; }}
          >
            <span style={{ fontSize: 11 }}>←</span>
            <span>Landing Page</span>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ─── TOP BAR ─── */
function TopBar({ connected, title }: { connected: boolean; title: string }) {
  const [clock, setClock] = useState("");
  useEffect(() => {
    setClock(new Date().toLocaleTimeString("en-US", { hour12: false }));
    const id = setInterval(() => setClock(new Date().toLocaleTimeString("en-US", { hour12: false })), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <header style={{
      height: 52, background: C.surface, backdropFilter: "blur(20px)",
      borderBottom: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 20px", flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Label color={C.muted} size="0.52rem">GUARDIAN·OTA</Label>
        <span style={{ color: C.border }}>›</span>
        <Label color={C.boneDim} size="0.52rem">{title}</Label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <StatusPill on={connected} label={connected ? "LIVE" : "DEMO"} />
        {clock && <Label color={C.muted}>{clock}</Label>}
        <button style={{ padding: "4px 12px", background: C.dangerDim, color: C.danger, border: "1px solid rgba(184,80,80,0.3)", borderRadius: 8, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem" }}>
          Emergency Stop
        </button>
      </div>
    </header>
  );
}

/* ─── ROOT DASHBOARD ─── */
export default function Dashboard({ onBackToLanding }: { onBackToLanding?: () => void }) {
  const [view, setView] = useState<View>("fleet");
  const [selectedCar, setSelectedCar] = useState<CarModel | null>(null);
  const [fleet, setFleet] = useState<DeviceState[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const sim = Array.from({ length: 20 }, (_, i) => ({
      deviceId: `sim-${1001 + i}`, primary: i === 0,
      otaVersion: i < 3 ? "1.1.0" : "2.4.1",
      safetyState: "SAFE",
      ecuStates: { brake: "green", powertrain: "green", sensor: "green", infotainment: "green" },
      lastSeen: new Date().toISOString(),
      threatLevel: "LOW" as const,
      otaProgress: 0, signatureOk: true, integrityOk: true, tlsHealthy: true, rollbackArmed: true,
    }));
    setFleet(sim);

    const iv = setInterval(() => {
      setFleet(p => p.map(d => {
        const r = Math.random();
        return { ...d, lastSeen: new Date().toISOString(), safetyState: r < 0.03 ? "UNSAFE" : "SAFE", threatLevel: (r < 0.03 ? "HIGH" : r < 0.08 ? "MEDIUM" : "LOW") as any };
      }));
    }, 2200);

    try {
      const ws = new WebSocket("ws://localhost:8080/ws/events");
      ws.onopen = () => setConnected(true);
      ws.onclose = () => setConnected(false);
      return () => { clearInterval(iv); ws.close(); };
    } catch { return () => clearInterval(iv); }
  }, []);

  function addDevice() {
    const newId = `sim-${1001 + fleet.length}`;
    setFleet(p => [...p, {
      deviceId: newId, primary: false, otaVersion: "1.0.0",
      safetyState: "SAFE", ecuStates: { brake: "green", powertrain: "green", sensor: "green", infotainment: "green" },
      lastSeen: new Date().toISOString(), threatLevel: "LOW",
      otaProgress: 0, signatureOk: true, integrityOk: true, tlsHealthy: true, rollbackArmed: true,
    }]);
  }

  function selectCar(car: CarModel) {
    setSelectedCar(car);
    setView("detail" as any);
  }

  const titles: Record<string, string> = { fleet: "Fleet Overview", detail: selectedCar?.name + " Cockpit" };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      <div style={{
        display: "flex", height: "100vh", width: "100vw", overflow: "hidden",
        background: C.bg, color: C.bone, fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Warm texture overlay */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: "radial-gradient(ellipse 80% 60% at 20% 10%, rgba(212,180,100,0.08) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 85% 90%, rgba(180,160,120,0.06) 0%, transparent 50%)",
        }} />

        <Sidebar view={view} setView={v => { setView(v); setSelectedCar(null); }} onBack={onBackToLanding} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 }}>
          <TopBar connected={connected} title={titles[view] || "Dashboard"} />

          <AnimatePresence mode="wait">
            <motion.div key={view + (selectedCar?.id || "")}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
            >
              {view === "fleet" && (
                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                  <FleetHeader fleet={fleet} onAddDevice={addDevice} />
                  <div style={{ marginBottom: 16 }}>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700, color: C.bone, margin: "0 0 4px" }}>Vehicle Platform Registry</h2>
                    <Label color={C.muted} size="0.58rem">Select a vehicle to open the system integration cockpit</Label>
                  </div>
                  <CarSelectionGrid onSelect={selectCar} />
                </div>
              )}

              {view === ("detail" as any) && selectedCar && (
                <CarDetailView car={selectedCar} fleet={fleet}
                  onBack={() => { setView("fleet"); setSelectedCar(null); }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
