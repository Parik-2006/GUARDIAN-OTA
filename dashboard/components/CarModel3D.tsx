"use client";

import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useFleet } from "./FleetContext";

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
export type CarVariant = "bmw-m3" | "bmw-m5" | "bmw-i8

interface CarModelDef {
  name: string;
  bodyColor: string;
  accentColor: string;
  wheelColor: string;
  scale: number;
  bodyDim: [number, number, number];
  hoodDim: [number, number, number];
  cabinDim: [number, number, number];
  trunkDim: [number, number, number];
  wheelOffset: number;
  wheelRadius: number;
}

const CAR_MODELS: Record<CarVariant, CarModelDef> = {
  "bmw-m3": {
    name: "BMW M3 Competition",
    bodyColor: "#2C3E50",
    accentColor: "#FF6B6B",
    wheelColor: "#34495E",
    scale: 0.95,
    bodyDim: [3.6, 0.7, 1.6],
    hoodDim: [1.3, 0.35, 1.55],
    cabinDim: [2.1, 0.65, 1.35],
    trunkDim: [0.85, 0.4, 1.55],
    wheelOffset: 1.15,
    wheelRadius: 0.26
  },
  "bmw-m5": {
    name: "BMW M5 Sedan",
    bodyColor: "#1A472A",
    accentColor: "#00D4FF",
    wheelColor: "#2C3E50",
    scale: 1.0,
    bodyDim: [3.8, 0.75, 1.65],
    hoodDim: [1.4, 0.38, 1.62],
    cabinDim: [2.2, 0.68, 1.40],
    trunkDim: [0.9, 0.42, 1.62],
    wheelOffset: 1.2,
    wheelRadius: 0.28
  },
  "bmw-i8": {
    name: "BMW i8 Roadster",
    bodyColor: "#1C1C1C",
    accentColor: "#FFD700",
    wheelColor: "#3D3D3D",
    scale: 1.08,
    bodyDim: [4.1, 0.72, 1.62],
    hoodDim: [1.5, 0.36, 1.58],
    cabinDim: [2.35, 0.63, 1.38],
    trunkDim: [0.95, 0.39, 1.58],
    wheelOffset: 1.28,
    wheelRadius: 0.30
  }
};

function ECUComponent({ def, isActive, variantScale }: { def: ECUDef; isActive: boolean; variantScale: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowMeshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshStandardMaterial>(null!);

  const scaledPos = [def.position[0] * variantScale, def.position[1] * variantScale, def.position[2] * variantScale] as [number, number, number];
  const scaledScale = [def.scale[0] * variantScale, def.scale[1] * variantScale, def.scale[2] * variantScale] as [number, number, number];

  useFrame(() => {
    if (matRef.current) {
      const targetColor = new THREE.Color(isActive ? "#00FF88" : def.color);
      const targetEmissive = new THREE.Color(isActive ? "#00FF88" : "#000000");
      
      matRef.current.color.lerp(targetColor, 0.1);
      matRef.current.emissive.lerp(targetEmissive, 0.1);
      matRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        matRef.current.emissiveIntensity,
        isActive ? 1.0 : 0,
        0.1
      );
    }
    
    if (glowMeshRef.current) {
      glowMeshRef.current.visible = isActive;
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
    <mesh ref={meshRef} position={scaledPos} scale={scaledScale}>
      {geo}
      <meshStandardMaterial
        ref={matRef}
        color={def.color}
        emissive={isActive ? "#00FF88" : "#000000"}
        emissiveIntensity={isActive ? 0.8 : 0}
        transparent
        opacity={0.9}
        roughness={0.3}
        metalness={0.6}
      />
      
      {isActive && (
        <mesh ref={glowMeshRef} position={[0, 0, 0]} scale={[1.4, 1.4, 1.4]}>
          {geo}
          <meshBasicMaterial color="#00FF88" transparent opacity={0.25} toneMapped={false} />
        </mesh>
      )}
    </mesh>
  );
}

function CarShell({ variant }: { variant: CarVariant }) {
  const model = CAR_MODELS[variant];
  const groupRef = useRef<THREE.Group>(null!);
  const [bodyL, bodyH, bodyW] = model.bodyDim;
  const [hoodL, hoodH, hoodW] = model.hoodDim;
  const [cabinL, cabinH, cabinW] = model.cabinDim;
  const [trunkL, trunkH, trunkW] = model.trunkDim;

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[bodyL, bodyH, bodyW]} />
        <meshPhysicalMaterial color={model.bodyColor} transparent opacity={0.12} wireframe={false} roughness={0.1} metalness={0.9} transmission={0.5} thickness={0.8} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[bodyL, bodyH, bodyW]} />
        <meshBasicMaterial color={model.accentColor} wireframe transparent opacity={0.25} />
      </mesh>

      <mesh position={[-(bodyL / 2.7), 0.2, 0]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[hoodL, hoodH, hoodW]} />
        <meshStandardMaterial color={model.bodyColor} metalness={0.95} roughness={0.08} transparent opacity={0.15} />
      </mesh>

      <mesh position={[-(bodyL / 2.7), 0.2, 0]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[hoodL, hoodH, hoodW]} />
        <meshBasicMaterial color={model.accentColor} wireframe transparent opacity={0.2} />
      </mesh>

      <mesh position={[bodyL / 35, 0.45, 0]}>
        <boxGeometry args={[cabinL, cabinH, cabinW]} />
        <meshPhysicalMaterial color={model.bodyColor} transparent opacity={0.08} wireframe={false} roughness={0.15} metalness={0.85} transmission={0.8} thickness={0.4} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[bodyL / 35, 0.45, 0]}>
        <boxGeometry args={[cabinL, cabinH, cabinW]} />
        <meshBasicMaterial color={model.accentColor} wireframe transparent opacity={0.22} />
      </mesh>

      <mesh position={[bodyL / 2.5, 0.15, 0]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[trunkL, trunkH, trunkW]} />
        <meshStandardMaterial color={model.bodyColor} metalness={0.92} roughness={0.12} transparent opacity={0.15} />
      </mesh>

      <mesh position={[bodyL / 2.5, 0.15, 0]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[trunkL, trunkH, trunkW]} />
        <meshBasicMaterial color={model.accentColor} wireframe transparent opacity={0.2} />
      </mesh>

      <mesh position={[-(bodyL / 3.1), -0.15, 0]}>
        <boxGeometry args={[0.4, 0.25, bodyW]} />
        <meshStandardMaterial color={model.accentColor} metalness={1} roughness={0.05} transparent opacity={0.3} />
      </mesh>

      <mesh position={[bodyL / 3.1, -0.15, 0]}>
        <boxGeometry args={[0.35, 0.25, bodyW]} />
        <meshStandardMaterial color={model.accentColor} metalness={1} roughness={0.05} transparent opacity={0.3} />
      </mesh>

      {[[-model.wheelOffset, -0.45, bodyW / 2.2], [-model.wheelOffset, -0.45, -bodyW / 2.2], [model.wheelOffset, -0.45, bodyW / 2.2], [model.wheelOffset, -0.45, -bodyW / 2.2]].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[model.wheelRadius, 0.1, 8, 20]} />
            <meshStandardMaterial color={model.wheelColor} metalness={0.9} roughness={0.15} />
          </mesh>

          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[model.wheelRadius + 0.04, 0.12, 8, 20]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.1} roughness={0.8} />
          </mesh>

          {[0, 1, 2, 3, 4].map(spoke => (
            <mesh key={spoke} position={[0, 0, 0]} rotation={[Math.PI / 2, (spoke / 5) * Math.PI * 2, 0]}>
              <cylinderGeometry args={[0.015, 0.015, model.wheelRadius * 1.6, 6]} />
              <meshStandardMaterial color={model.wheelColor} metalness={0.85} />
            </mesh>
          ))}

          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <circleGeometry args={[0.06, 16]} />
            <meshStandardMaterial color={model.accentColor} metalness={1} roughness={0.05} />
          </mesh>
        </group>
      ))}

      <mesh position={[-model.wheelOffset, -0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, bodyW, 8]} />
        <meshStandardMaterial color={model.wheelColor} metalness={0.8} roughness={0.2} transparent opacity={0.4} />
      </mesh>

      <mesh position={[model.wheelOffset, -0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, bodyW, 8]} />
        <meshStandardMaterial color={model.wheelColor} metalness={0.8} roughness={0.2} transparent opacity={0.4} />
      </mesh>

      <mesh position={[bodyL / 7.6, 0.1, bodyW / 2.1]}>
        <boxGeometry args={[bodyL * 0.84, 0.05, 0.08]} />
        <meshBasicMaterial color={model.accentColor} transparent opacity={0.4} />
      </mesh>

      <mesh position={[bodyL / 7.6, 0.1, -bodyW / 2.1]}>
        <boxGeometry args={[bodyL * 0.84, 0.05, 0.08]} />
        <meshBasicMaterial color={model.accentColor} transparent opacity={0.4} />
      </mesh>

      <pointLight position={[0, -0.55, 0]} color={model.accentColor} intensity={1.2} distance={3} />
      <gridHelper args={[10, 20, model.accentColor, "#2E2820"]} position={[0, -0.8, 0]} />
    </group>
  );
}

function RotationController({ rotationRef, rotation }: { rotationRef: React.MutableRefObject<THREE.Group | null>; rotation: number }) {
  useFrame(() => {
    if (rotationRef.current) {
      rotationRef.current.rotation.y = rotation;
    }
  });
  return null;
}

interface CarModel3DProps {
  variant?: CarVariant;
}

export default function CarModel3D({ variant = "audi-a8" }: CarModel3DProps) {
  const { activeEcu } = useFleet();
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef<THREE.Group>(null!);

  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const deg = parseFloat(e.target.value);
    const rad = (deg / 360) * Math.PI * 2;
    setRotation(rad);
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div style={{ position: "absolute", top: 10, left: 10, fontSize: "0.75rem", color: "#C8914A", fontFamily: "'JetBrains Mono'", zIndex: 10, background: "rgba(13,11,8,0.8)", padding: "8px 12px", borderRadius: "3px", border: "1px solid rgba(200,145,74,0.3)" }}>
        <div style={{ fontWeight: 600, marginBottom: "4px" }}>{CAR_MODELS[variant].name}</div>
        <div style={{ fontSize: "0.65rem", color: "rgba(238,230,211,0.6)" }}>Drag to rotate • Scroll to zoom</div>
      </div>

      <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 10, display: "flex", alignItems: "center", gap: 12, background: "rgba(13,11,8,0.9)", padding: "12px 16px", borderRadius: 6, border: "1px solid rgba(200,145,74,0.4)", minWidth: 280 }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.62rem", color: "#C8914A", fontWeight: 600, whiteSpace: "nowrap" }}>ROTATION:</span>
        
        <input type="range" min="0" max="360" value={(rotation / (Math.PI * 2)) * 360} onChange={handleRotationChange} style={{ flex: 1, height: 5, borderRadius: 3, border: "none", background: "linear-gradient(to right, #C8914A 0%, #FF6B6B 50%, #C8914A 100%)", outline: "none", cursor: "pointer" } as any} />
        
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.62rem", color: "#C8914A", minWidth: 35, textAlign: "right" }}>{Math.round((rotation / (Math.PI * 2)) * 360)}°</span>
      </div>

      <Canvas camera={{ position: [4.5, 2.2, 4.5], fov: 50 }} style={{ background: "transparent" }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[6, 8, 6]} intensity={1} color="#F0EBE0" />
        <pointLight position={[-5, 3, -4]} intensity={0.6} color={CAR_MODELS[variant].accentColor} />
        <pointLight position={[4, 1, 5]} intensity={0.5} color="#6A9DB8" />

        <group ref={rotationRef}>
          <CarShell variant={variant} />
          {ECU_DEFS.map(def => (
            <ECUComponent key={def.name} def={def} isActive={activeEcu === def.name} variantScale={CAR_MODELS[variant].scale} />
          ))}
        </group>

        <RotationController rotationRef={rotationRef} rotation={rotation} />

        <OrbitControls enablePan={false} enableDamping={true} dampingFactor={0.08} autoRotate={false} minDistance={3.5} maxDistance={12} minPolarAngle={Math.PI * 0.3} maxPolarAngle={Math.PI * 0.7} />
      </Canvas>
    </div>
  );
}

