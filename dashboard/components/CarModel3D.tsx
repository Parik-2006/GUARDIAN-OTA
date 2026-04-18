"use client";

import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useFleet } from "./FleetContext";

/* ═══════════════════════════════════════════════════════════════
   ECU COMPONENT DEFINITIONS
   Each ECU has a name, position, geometry type, and scale.
═══════════════════════════════════════════════════════════════ */
interface ECUDef {
  name: string;
  position: [number, number, number];
  geometry: "box" | "sphere" | "cylinder" | "octahedron";
  scale: [number, number, number];
  color: string;
}

const ECU_DEFS: ECUDef[] = [
  { name: "Telematics",     position: [1.2, 0.1, 0.6],    geometry: "sphere",      scale: [0.22, 0.22, 0.22], color: "#6A9DB8" },
  { name: "Brake ECU",      position: [-1.4, -0.2, 0.5],  geometry: "box",         scale: [0.28, 0.18, 0.22], color: "#C46B6B" },
  { name: "Powertrain",     position: [0, -0.1, 0],       geometry: "cylinder",    scale: [0.25, 0.35, 0.25], color: "#D4A96A" },
  { name: "Sensor Array",   position: [0, 0.65, 0],       geometry: "octahedron",  scale: [0.2, 0.2, 0.2],    color: "#7AB88A" },
  { name: "Infotainment",   position: [0.6, 0.2, 0.8],    geometry: "box",         scale: [0.35, 0.15, 0.18], color: "#D4956A" },
  { name: "ADAS",           position: [-1.6, 0.05, 0],    geometry: "sphere",      scale: [0.18, 0.18, 0.18], color: "#B87C3A" },
];

export { ECU_DEFS };

// Car model variants
export type CarVariant = "audi-a8" | "bmw-i7" | "mercedes-s";

interface CarModelDef {
  name: string;
  bodyColor: string;
  accentColor: string;
  wheelColor: string;
}

/* ═══════════════════════════════════════════════════════════════
   ECU COMPONENT — Removed duplicate, see below
═══════════════════════════════════════════════════════════════ */

const CAR_MODELS: Record<CarVariant, CarModelDef> = {
  "audi-a8": {
    name: "Audi A8 e-tron",
    bodyColor: "#2C3E50",
    accentColor: "#FF6B6B",
    wheelColor: "#34495E"
  },
  "bmw-i7": {
    name: "BMW i7 M Sport",
    bodyColor: "#1A472A",
    accentColor: "#00D4FF",
    wheelColor: "#2C3E50"
  },
  "mercedes-s": {
    name: "Mercedes-AMG S63",
    bodyColor: "#1C1C1C",
    accentColor: "#FFD700",
    wheelColor: "#3D3D3D"
  }
};

/* ═══════════════════════════════════════════════════════════════
   ECU COMPONENT — 3D object with highlight animation
═══════════════════════════════════════════════════════════════ */
function ECUComponent({ def, isActive }: { def: ECUDef; isActive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshStandardMaterial>(null!);

  const targetColor = useMemo(
    () => new THREE.Color(isActive ? "#00FF88" : def.color),
    [isActive, def.color]
  );
  const targetEmissive = useMemo(
    () => new THREE.Color(isActive ? "#00FF88" : "#000000"),
    [isActive]
  );

  useFrame(() => {
    if (matRef.current) {
      matRef.current.color.lerp(targetColor, 0.08);
      matRef.current.emissive.lerp(targetEmissive, 0.08);
      matRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        matRef.current.emissiveIntensity,
        isActive ? 0.8 : 0,
        0.08
      );
    }
  });

  const geo = useMemo(() => {
    switch (def.geometry) {
      case "sphere": return <sphereGeometry args={[0.5, 16, 16]} />;
      case "cylinder": return <cylinderGeometry args={[0.5, 0.5, 1, 16]} />;
      case "octahedron": return <octahedronGeometry args={[0.5, 0]} />;
      default: return <boxGeometry args={[1, 1, 1]} />;
    }
  }, [def.geometry]);

  return (
    <mesh ref={meshRef} position={def.position} scale={def.scale}>
      {geo}
      <meshStandardMaterial
        ref={matRef}
        color={def.color}
        transparent
        opacity={isActive ? 0.95 : 0.75}
        roughness={0.3}
        metalness={0.6}
      />
      {isActive && (
        <mesh position={[0, 0, 0]} scale={[1.3, 1.3, 1.3]}>
          {geo}
          <meshBasicMaterial color="#00FF88" transparent opacity={0.2} />
        </mesh>
      )}
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CAR SHELL — Realistic car models
═══════════════════════════════════════════════════════════════ */
function CarShell({ variant }: { variant: CarVariant }) {
  const model = CAR_MODELS[variant];
  const groupRef = useRef<THREE.Group>(null!);

  return (
    <group ref={groupRef}>
      {/* Main body - sleek sedan shape */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3.8, 0.7, 1.6]} />
        <meshPhysicalMaterial
          color={model.bodyColor}
          transparent
          opacity={0.12}
          wireframe={false}
          roughness={0.1}
          metalness={0.9}
          transmission={0.5}
          thickness={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Body wireframe overlay */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3.8, 0.7, 1.6]} />
        <meshBasicMaterial color={model.accentColor} wireframe transparent opacity={0.25} />
      </mesh>

      {/* Front fascia - hood with slope */}
      <mesh position={[-1.5, 0.2, 0]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[1.4, 0.35, 1.55]} />
        <meshStandardMaterial
          color={model.bodyColor}
          metalness={0.95}
          roughness={0.08}
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Hood wireframe */}
      <mesh position={[-1.5, 0.2, 0]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[1.4, 0.35, 1.55]} />
        <meshBasicMaterial color={model.accentColor} wireframe transparent opacity={0.2} />
      </mesh>

      {/* Cabin - glazed area */}
      <mesh position={[0.1, 0.45, 0]}>
        <boxGeometry args={[2.2, 0.65, 1.35]} />
        <meshPhysicalMaterial
          color={model.bodyColor}
          transparent
          opacity={0.08}
          wireframe={false}
          roughness={0.15}
          metalness={0.85}
          transmission={0.8}
          thickness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Cabin wireframe */}
      <mesh position={[0.1, 0.45, 0]}>
        <boxGeometry args={[2.2, 0.65, 1.35]} />
        <meshBasicMaterial color={model.accentColor} wireframe transparent opacity={0.22} />
      </mesh>

      {/* Trunk - rear overhang */}
      <mesh position={[1.6, 0.15, 0]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[0.9, 0.4, 1.55]} />
        <meshStandardMaterial
          color={model.bodyColor}
          metalness={0.92}
          roughness={0.12}
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Trunk wireframe */}
      <mesh position={[1.6, 0.15, 0]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[0.9, 0.4, 1.55]} />
        <meshBasicMaterial color={model.accentColor} wireframe transparent opacity={0.2} />
      </mesh>

      {/* Bumpers - front and rear accent */}
      <mesh position={[-1.95, -0.15, 0]}>
        <boxGeometry args={[0.4, 0.25, 1.6]} />
        <meshStandardMaterial color={model.accentColor} metalness={1} roughness={0.05} transparent opacity={0.3} />
      </mesh>

      <mesh position={[2.0, -0.15, 0]}>
        <boxGeometry args={[0.35, 0.25, 1.6]} />
        <meshStandardMaterial color={model.accentColor} metalness={1} roughness={0.05} transparent opacity={0.3} />
      </mesh>

      {/* Wheels - realistic spoke design */}
      {[
        [-1.2, -0.45, 0.85],
        [-1.2, -0.45, -0.85],
        [1.2, -0.45, 0.85],
        [1.2, -0.45, -0.85],
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          {/* Wheel rim */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.28, 0.1, 8, 20]} />
            <meshStandardMaterial color={model.wheelColor} metalness={0.9} roughness={0.15} />
          </mesh>

          {/* Tire */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.32, 0.12, 8, 20]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.1} roughness={0.8} />
          </mesh>

          {/* Spokes */}
          {[0, 1, 2, 3, 4].map(spoke => (
            <mesh
              key={spoke}
              position={[0, 0, 0]}
              rotation={[Math.PI / 2, (spoke / 5) * Math.PI * 2, 0]}
            >
              <cylinderGeometry args={[0.015, 0.015, 0.45, 6]} />
              <meshStandardMaterial color={model.wheelColor} metalness={0.85} />
            </mesh>
          ))}

          {/* Center cap */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <circleGeometry args={[0.06, 16]} />
            <meshStandardMaterial color={model.accentColor} metalness={1} roughness={0.05} />
          </mesh>
        </group>
      ))}

      {/* Axles */}
      <mesh position={[-1.2, -0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 1.7, 8]} />
        <meshStandardMaterial color={model.wheelColor} metalness={0.8} roughness={0.2} transparent opacity={0.4} />
      </mesh>

      <mesh position={[1.2, -0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 1.7, 8]} />
        <meshStandardMaterial color={model.wheelColor} metalness={0.8} roughness={0.2} transparent opacity={0.4} />
      </mesh>

      {/* Dynamic lines - accent lighting */}
      <mesh position={[0.5, 0.1, 0.8]}>
        <boxGeometry args={[3.2, 0.05, 0.08]} />
        <meshBasicMaterial color={model.accentColor} transparent opacity={0.4} />
      </mesh>

      <mesh position={[0.5, 0.1, -0.8]}>
        <boxGeometry args={[3.2, 0.05, 0.08]} />
        <meshBasicMaterial color={model.accentColor} transparent opacity={0.4} />
      </mesh>

      {/* Neon undercarriage glow */}
      <pointLight position={[0, -0.55, 0]} color={model.accentColor} intensity={1.2} distance={3} />

      {/* Grid floor */}
      <gridHelper args={[10, 20, model.accentColor, "#2E2820"]} position={[0, -0.8, 0]} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN 3D SCENE - With user controls
═══════════════════════════════════════════════════════════════ */
interface CarModel3DProps {
  variant?: CarVariant;
}

export default function CarModel3D({ variant = "audi-a8" }: CarModel3DProps) {
  const { activeEcu } = useFleet();
  const [showControls, setShowControls] = useState(true);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Info overlay */}
      {showControls && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            fontSize: "0.75rem",
            color: "#C8914A",
            fontFamily: "'JetBrains Mono'",
            zIndex: 10,
            background: "rgba(13,11,8,0.8)",
            padding: "8px 12px",
            borderRadius: "3px",
            border: "1px solid rgba(200,145,74,0.3)"
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "4px" }}>
            {CAR_MODELS[variant].name}
          </div>
          <div style={{ fontSize: "0.65rem", color: "rgba(238,230,211,0.6)" }}>
            Drag to rotate • Scroll to zoom
          </div>
        </div>
      )}

      <Canvas
        camera={{ position: [4.5, 2.2, 4.5], fov: 50 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        {/* Lighting setup for luxury automotive feel */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[6, 8, 6]} intensity={1} color="#F0EBE0" />
        <pointLight position={[-5, 3, -4]} intensity={0.6} color={CAR_MODELS[variant].accentColor} />
        <pointLight position={[4, 1, 5]} intensity={0.5} color="#6A9DB8" />

        <group>
          <CarShell variant={variant} />
          {ECU_DEFS.map(def => (
            <ECUComponent key={def.name} def={def} isActive={activeEcu === def.name} />
          ))}
        </group>

        {/* User-controlled orbit (NO auto-rotation) */}
        <OrbitControls
          enablePan={false}
          enableDamping={true}
          dampingFactor={0.08}
          autoRotate={false}
          minDistance={3.5}
          maxDistance={12}
          minPolarAngle={Math.PI * 0.3}
          maxPolarAngle={Math.PI * 0.7}
        />
      </Canvas>
    </div>
  );
}
