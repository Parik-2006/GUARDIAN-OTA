"use client";

import { useRef, useMemo, useState } from "react";
import { useFrame, Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useFleet } from "./FleetContext";
import { P } from "./theme";

interface ECUDef {
  name: string;
  position: [number, number, number];
  geometry: "box" | "sphere" | "cylinder" | "octahedron";
  scale: [number, number, number];
  color: string;
}

export type CarVariant = "audi-a8" | "mercedes-s" | "bmw-m5";

// ECU definitions per variant
const ECU_DEFS_BY_VARIANT: Record<CarVariant, ECUDef[]> = {
  "audi-a8": [
    { name: "Telematics",     position: [0.2, 0.6, 1.3],    geometry: "sphere",      scale: [0.35, 0.35, 0.35], color: "#6A9DB8" },
    { name: "Brake ECU",      position: [-2.0, 0.0, -0.7],  geometry: "box",         scale: [0.4, 0.3, 0.3],    color: "#C46B6B" },
    { name: "Powertrain",     position: [-2.4, -0.6, 0.2],  geometry: "cylinder",    scale: [0.35, 0.45, 0.35], color: "#D4A96A" },
    { name: "Sensor Array",   position: [0, 1.1, 0.3],      geometry: "octahedron",  scale: [0.35, 0.35, 0.35], color: "#7AB88A" },
    { name: "Infotainment",   position: [1.6, 0.3, 0.3],    geometry: "box",         scale: [0.4, 0.25, 0.25],  color: "#D4956A" },
    { name: "ADAS",           position: [0, 0.7, 1.4],      geometry: "sphere",      scale: [0.3, 0.3, 0.3],    color: "#B87C3A" },
  ],
  "mercedes-s": [
    { name: "Telematics",     position: [0.1, 0.55, 1.35],  geometry: "sphere",      scale: [0.35, 0.35, 0.35], color: "#6A9DB8" },
    { name: "Brake ECU",      position: [-2.1, 0.05, -0.8], geometry: "box",         scale: [0.4, 0.3, 0.3],    color: "#C46B6B" },
    { name: "Powertrain",     position: [-2.5, -0.55, 0.1], geometry: "cylinder",    scale: [0.35, 0.45, 0.35], color: "#D4A96A" },
    { name: "Sensor Array",   position: [0, 1.15, 0.25],    geometry: "octahedron",  scale: [0.35, 0.35, 0.35], color: "#7AB88A" },
    { name: "Infotainment",   position: [1.7, 0.35, 0.25],  geometry: "box",         scale: [0.4, 0.25, 0.25],  color: "#D4956A" },
    { name: "ADAS",           position: [0.05, 0.75, 1.45], geometry: "sphere",      scale: [0.3, 0.3, 0.3],    color: "#B87C3A" },
  ],
  "bmw-m5": [
    { name: "Telematics",     position: [0, 0.5, 1.2],      geometry: "sphere",      scale: [0.35, 0.35, 0.35], color: "#6A9DB8" },
    { name: "Brake ECU",      position: [-1.8, -0.1, -0.6], geometry: "box",         scale: [0.4, 0.3, 0.3],    color: "#C46B6B" },
    { name: "Powertrain",     position: [-2.2, -0.7, 0.3],  geometry: "cylinder",    scale: [0.35, 0.45, 0.35], color: "#D4A96A" },
    { name: "Sensor Array",   position: [0, 1.0, 0.2],      geometry: "octahedron",  scale: [0.35, 0.35, 0.35], color: "#7AB88A" },
    { name: "Infotainment",   position: [1.4, 0.2, 0.2],    geometry: "box",         scale: [0.4, 0.25, 0.25],  color: "#D4956A" },
    { name: "ADAS",           position: [0.1, 0.6, 1.3],    geometry: "sphere",      scale: [0.3, 0.3, 0.3],    color: "#B87C3A" },
  ],
};

export function getECUDefs(variant: CarVariant): ECUDef[] {
  return ECU_DEFS_BY_VARIANT[variant];
}

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
  "audi-a8": {
    name: "Audi A8 e-tron",
    bodyColor: "#1E3A5F",
    accentColor: "#FF9500",
    wheelColor: "#2C3E50",
    scale: 0.98,
    bodyDim: [3.85, 0.76, 1.68],
    hoodDim: [1.45, 0.38, 1.65],
    cabinDim: [2.25, 0.70, 1.42],
    trunkDim: [0.92, 0.42, 1.65],
    wheelOffset: 1.25,
    wheelRadius: 0.29
  },
  "mercedes-s": {
    name: "Mercedes-AMG S63",
    bodyColor: "#1C1C2E",
    accentColor: "#00D4FF",
    wheelColor: "#3D3D3D",
    scale: 1.02,
    bodyDim: [3.92, 0.78, 1.71],
    hoodDim: [1.52, 0.40, 1.68],
    cabinDim: [2.35, 0.72, 1.48],
    trunkDim: [0.98, 0.44, 1.68],
    wheelOffset: 1.30,
    wheelRadius: 0.30
  },
  "bmw-m5": {
    name: "BMW M5 Sedan",
    bodyColor: "#1A472A",
    accentColor: "#E74C3C",
    wheelColor: "#2C3E50",
    scale: 1.0,
    bodyDim: [3.8, 0.75, 1.65],
    hoodDim: [1.4, 0.38, 1.62],
    cabinDim: [2.2, 0.68, 1.40],
    trunkDim: [0.9, 0.42, 1.62],
    wheelOffset: 1.2,
    wheelRadius: 0.28
  }
};

function ECUComponent({ def, isActive, variantScale, liveColor }: { def: ECUDef; isActive: boolean; variantScale: number; liveColor: string }) {
  const scaledPos = [def.position[0] * variantScale, def.position[1] * variantScale, def.position[2] * variantScale] as [number, number, number];
  const color = liveColor === "red" ? P.burg : liveColor === "green" ? "#7AB88A" : def.color;

  return (
    <>
      {/* Dynamic lighting */}
      {isActive && (
        <>
          <pointLight position={scaledPos} intensity={4.5} color={color} distance={5.0} decay={2} />
          <pointLight position={[scaledPos[0], scaledPos[1] - 0.3, scaledPos[2]]} intensity={3.5} color={color} distance={4.5} decay={2} />
        </>
      )}

      {/* Visible block only when active */}
      {isActive && (
        <mesh position={scaledPos}>
          <boxGeometry args={[0.4, 0.35, 0.35]} />
          <meshPhysicalMaterial 
            color={color} 
            emissive={color}
            emissiveIntensity={0.7}
            transparent 
            opacity={0.55}
            metalness={0.8}
            roughness={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </>
  );
}

function CarShell({ variant }: { variant: CarVariant }) {
  switch (variant) {
    case "audi-a8":
      return <AudiA8Model />;
    case "mercedes-s":
      return <MercedesSModel />;
    case "bmw-m5":
      return <BMWM5Model />;
    default:
      return <BMWM5Model />;
  }
}

function AudiA8Model() {
  const model = CAR_MODELS["audi-a8"];
  const [bodyL, bodyH, bodyW] = model.bodyDim;

  return (
    <group>
      {/* Lower main body - extended */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[bodyL * 0.92, bodyH * 0.65, bodyW]} />
        <meshPhysicalMaterial color={model.bodyColor} metalness={0.88} roughness={0.12} transparent opacity={0.18} />
      </mesh>
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[bodyL * 0.92, bodyH * 0.65, bodyW]} />
        <meshBasicMaterial color={model.accentColor} wireframe transparent opacity={0.2} />
      </mesh>

      {/* Elegant sloped hood - Audi signature */}
      <mesh position={[-(bodyL / 2.3), 0.35, 0]} rotation={[0.22, 0, 0]}>
        <boxGeometry args={[bodyL * 0.28, bodyH * 0.4, bodyW * 0.95]} />
        <meshStandardMaterial color={model.bodyColor} metalness={0.92} roughness={0.1} transparent opacity={0.16} />
      </mesh>
      <mesh position={[-(bodyL / 2.3), 0.35, 0]} rotation={[0.22, 0, 0]}>
        <boxGeometry args={[bodyL * 0.28, bodyH * 0.4, bodyW * 0.95]} />
        <meshBasicMaterial color={model.accentColor} wireframe transparent opacity={0.18} />
      </mesh>

      {/* Tall, elegant cabin - Audi hallmark */}
      <mesh position={[0.05, 0.52, 0]}>
        <boxGeometry args={[bodyL * 0.58, bodyH * 0.75, bodyW * 0.92]} />
        <meshPhysicalMaterial color={model.bodyColor} transparent opacity={0.1} wireframe={false} roughness={0.18} metalness={0.82} transmission={0.85} thickness={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.05, 0.52, 0]}>
        <boxGeometry args={[bodyL * 0.58, bodyH * 0.75, bodyW * 0.92]} />
        <meshBasicMaterial color={model.accentColor} wireframe transparent opacity={0.19} />
      </mesh>

      {/* Sloped trunk - graceful taper */}
      <mesh position={[bodyL / 2.2, 0.25, 0]} rotation={[-0.18, 0, 0]}>
        <boxGeometry args={[bodyL * 0.25, bodyH * 0.35, bodyW * 0.93]} />
        <meshStandardMaterial color={model.bodyColor} metalness={0.89} roughness={0.11} transparent opacity={0.15} />
      </mesh>
      <mesh position={[bodyL / 2.2, 0.25, 0]} rotation={[-0.18, 0, 0]}>
        <boxGeometry args={[bodyL * 0.25, bodyH * 0.35, bodyW * 0.93]} />
        <meshBasicMaterial color={model.accentColor} wireframe transparent opacity={0.18} />
      </mesh>

      {/* Front fenders - sculpted sides */}
      <mesh position={[-(bodyL / 3.2), 0.1, bodyW / 2.15]}>
        <boxGeometry args={[bodyL * 0.75, bodyH * 0.5, 0.12]} />
        <meshStandardMaterial color={model.accentColor} metalness={0.85} roughness={0.15} transparent opacity={0.25} />
      </mesh>
      <mesh position={[-(bodyL / 3.2), 0.1, -bodyW / 2.15]}>
        <boxGeometry args={[bodyL * 0.75, bodyH * 0.5, 0.12]} />
        <meshStandardMaterial color={model.accentColor} metalness={0.85} roughness={0.15} transparent opacity={0.25} />
      </mesh>

      {/* Wheels - refined Audi style */}
      {[[-model.wheelOffset, -0.48, bodyW / 2.2], [-model.wheelOffset, -0.48, -bodyW / 2.2], [model.wheelOffset, -0.48, bodyW / 2.2], [model.wheelOffset, -0.48, -bodyW / 2.2]].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[model.wheelRadius, 0.11, 8, 20]} />
            <meshStandardMaterial color={model.wheelColor} metalness={0.92} roughness={0.12} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[model.wheelRadius + 0.045, 0.14, 8, 20]} />
            <meshStandardMaterial color="#0d0d0d" metalness={0.08} roughness={0.85} />
          </mesh>
          {[0, 1, 2, 3, 4].map(spoke => (
            <mesh key={spoke} rotation={[Math.PI / 2, (spoke / 5) * Math.PI * 2, 0]}>
              <cylinderGeometry args={[0.018, 0.018, model.wheelRadius * 1.7, 6]} />
              <meshStandardMaterial color={model.wheelColor} metalness={0.88} />
            </mesh>
          ))}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.068, 16]} />
            <meshStandardMaterial color={model.accentColor} metalness={1} roughness={0.06} />
          </mesh>
        </group>
      ))}

      {/* Axles */}
      <mesh position={[-model.wheelOffset, -0.48, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.038, 0.038, bodyW, 8]} />
        <meshStandardMaterial color={model.wheelColor} metalness={0.78} roughness={0.22} transparent opacity={0.35} />
      </mesh>
      <mesh position={[model.wheelOffset, -0.48, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.038, 0.038, bodyW, 8]} />
        <meshStandardMaterial color={model.wheelColor} metalness={0.78} roughness={0.22} transparent opacity={0.35} />
      </mesh>

      {/* Audi lighting strip */}
      <mesh position={[-(bodyL / 2.5), 0.25, bodyW / 2.08]}>
        <boxGeometry args={[bodyL * 0.2, 0.06, 0.05]} />
        <meshBasicMaterial color={model.accentColor} transparent opacity={0.5} />
      </mesh>
      <mesh position={[bodyL / 2.3, 0.3, bodyW / 2.08]}>
        <boxGeometry args={[bodyL * 0.18, 0.05, 0.05]} />
        <meshBasicMaterial color={model.accentColor} transparent opacity={0.5} />
      </mesh>

      <pointLight position={[0, -0.6, 0]} color={model.accentColor} intensity={1.3} distance={3.2} />
      <gridHelper args={[10, 20, model.accentColor, "#2E2820"]} position={[0, -0.8, 0]} />
    </group>
  );
}

function MercedesSModel() {
  const model = CAR_MODELS["mercedes-s"];
  const [bodyL, bodyH, bodyW] = model.bodyDim;

  return (
    <group>
      {/* Wide, low main body - Mercedes aggressive stance */}
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[bodyL * 0.94, bodyH * 0.6, bodyW * 1.02]} />
        <meshPhysicalMaterial color={model.bodyColor} metalness={0.9} roughness={0.1} transparent opacity={0.19} />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[bodyL * 0.94, bodyH * 0.6, bodyW * 1.02]} />
        <meshBasicMaterial color={model.accentColor} wireframe transparent opacity={0.21} />
      </mesh>

      {/* Aggressive sloped hood - Mercedes performance */}
      <mesh position={[-(bodyL / 2.15), 0.32, 0]} rotation={[0.28, 0, 0]}>
        <boxGeometry args={[bodyL * 0.32, bodyH * 0.38, bodyW * 0.98]} />
        <meshStandardMaterial color={model.bodyColor} metalness={0.95} roughness={0.08} transparent opacity={0.17} />
      </mesh>
      <mesh position={[-(bodyL / 2.15), 0.32, 0]} rotation={[0.28, 0, 0]}>
        <boxGeometry args={[bodyL * 0.32, bodyH * 0.38, bodyW * 0.98]} />
        <meshBasicMaterial color={model.accentColor} wireframe transparent opacity={0.19} />
      </mesh>

      {/* Sleek cabin - shorter but wider for sporty look */}
      <mesh position={[0.1, 0.48, 0]}>
        <boxGeometry args={[bodyL * 0.56, bodyH * 0.68, bodyW * 0.96]} />
        <meshPhysicalMaterial color={model.bodyColor} transparent opacity={0.12} wireframe={false} roughness={0.16} metalness={0.85} transmission={0.8} thickness={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.1, 0.48, 0]}>
        <boxGeometry args={[bodyL * 0.56, bodyH * 0.68, bodyW * 0.96]} />
        <meshBasicMaterial color={model.accentColor} wireframe transparent opacity={0.2} />
      </mesh>

      {/* Sharp trunk - Mercedes power stance */}
      <mesh position={[bodyL / 2.1, 0.2, 0]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[bodyL * 0.28, bodyH * 0.32, bodyW * 0.96]} />
        <meshStandardMaterial color={model.bodyColor} metalness={0.91} roughness={0.09} transparent opacity={0.16} />
      </mesh>
      <mesh position={[bodyL / 2.1, 0.2, 0]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[bodyL * 0.28, bodyH * 0.32, bodyW * 0.96]} />
        <meshBasicMaterial color={model.accentColor} wireframe transparent opacity={0.19} />
      </mesh>

      {/* Wide muscular fenders */}
      <mesh position={[-(bodyL / 3.1), 0.05, bodyW / 2.1]}>
        <boxGeometry args={[bodyL * 0.8, bodyH * 0.55, 0.14]} />
        <meshStandardMaterial color={model.accentColor} metalness={0.88} roughness={0.13} transparent opacity={0.28} />
      </mesh>
      <mesh position={[-(bodyL / 3.1), 0.05, -bodyW / 2.1]}>
        <boxGeometry args={[bodyL * 0.8, bodyH * 0.55, 0.14]} />
        <meshStandardMaterial color={model.accentColor} metalness={0.88} roughness={0.13} transparent opacity={0.28} />
      </mesh>

      {/* Performance wheels - larger profile */}
      {[[-model.wheelOffset, -0.5, bodyW / 2.2], [-model.wheelOffset, -0.5, -bodyW / 2.2], [model.wheelOffset, -0.5, bodyW / 2.2], [model.wheelOffset, -0.5, -bodyW / 2.2]].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[model.wheelRadius, 0.115, 8, 20]} />
            <meshStandardMaterial color={model.wheelColor} metalness={0.94} roughness={0.1} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[model.wheelRadius + 0.048, 0.15, 8, 20]} />
            <meshStandardMaterial color="#0a0a0a" metalness={0.05} roughness={0.9} />
          </mesh>
          {[0, 1, 2, 3, 4, 5].map(spoke => (
            <mesh key={spoke} rotation={[Math.PI / 2, (spoke / 6) * Math.PI * 2, 0]}>
              <cylinderGeometry args={[0.02, 0.02, model.wheelRadius * 1.8, 6]} />
              <meshStandardMaterial color={model.wheelColor} metalness={0.9} />
            </mesh>
          ))}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.072, 16]} />
            <meshStandardMaterial color={model.accentColor} metalness={1} roughness={0.04} />
          </mesh>
        </group>
      ))}

      {/* Axles */}
      <mesh position={[-model.wheelOffset, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, bodyW, 8]} />
        <meshStandardMaterial color={model.wheelColor} metalness={0.8} roughness={0.2} transparent opacity={0.4} />
      </mesh>
      <mesh position={[model.wheelOffset, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, bodyW, 8]} />
        <meshStandardMaterial color={model.wheelColor} metalness={0.8} roughness={0.2} transparent opacity={0.4} />
      </mesh>

      {/* Mercedes LED lighting */}
      <mesh position={[-(bodyL / 2.4), 0.22, bodyW / 2.09]}>
        <boxGeometry args={[bodyL * 0.22, 0.08, 0.06]} />
        <meshBasicMaterial color={model.accentColor} transparent opacity={0.6} />
      </mesh>
      <mesh position={[bodyL / 2.2, 0.28, bodyW / 2.09]}>
        <boxGeometry args={[bodyL * 0.2, 0.07, 0.06]} />
        <meshBasicMaterial color={model.accentColor} transparent opacity={0.6} />
      </mesh>

      <pointLight position={[0, -0.65, 0]} color={model.accentColor} intensity={1.4} distance={3.3} />
      <gridHelper args={[10, 20, model.accentColor, "#2E2820"]} position={[0, -0.8, 0]} />
    </group>
  );
}

function BMWM5Model() {
  const model = CAR_MODELS["bmw-m5"];
  const [bodyL, bodyH, bodyW] = model.bodyDim;

  return (
    <group>
      {/* Athletic muscular body - BMW M stance */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[bodyL * 0.9, bodyH * 0.7, bodyW * 1.0]} />
        <meshPhysicalMaterial color={model.bodyColor} metalness={0.87} roughness={0.14} transparent opacity={0.17} />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[bodyL * 0.9, bodyH * 0.7, bodyW * 1.0]} />
        <meshBasicMaterial color={model.accentColor} wireframe transparent opacity={0.22} />
      </mesh>

      {/* Pronounced hood - BMW M sport aggression */}
      <mesh position={[-(bodyL / 2.25), 0.38, 0]} rotation={[0.19, 0, 0]}>
        <boxGeometry args={[bodyL * 0.3, bodyH * 0.42, bodyW * 0.97]} />
        <meshStandardMaterial color={model.bodyColor} metalness={0.93} roughness={0.11} transparent opacity={0.16} />
      </mesh>
      <mesh position={[-(bodyL / 2.25), 0.38, 0]} rotation={[0.19, 0, 0]}>
        <boxGeometry args={[bodyL * 0.3, bodyH * 0.42, bodyW * 0.97]} />
        <meshBasicMaterial color={model.accentColor} wireframe transparent opacity={0.2} />
      </mesh>

      {/* Sport cabin - balanced proportions */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[bodyL * 0.6, bodyH * 0.7, bodyW * 0.94]} />
        <meshPhysicalMaterial color={model.bodyColor} transparent opacity={0.11} wireframe={false} roughness={0.17} metalness={0.83} transmission={0.82} thickness={0.32} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[bodyL * 0.6, bodyH * 0.7, bodyW * 0.94]} />
        <meshBasicMaterial color={model.accentColor} wireframe transparent opacity={0.21} />
      </mesh>

      {/* Assertive trunk - M sport character */}
      <mesh position={[bodyL / 2.3, 0.18, 0]} rotation={[-0.12, 0, 0]}>
        <boxGeometry args={[bodyL * 0.26, bodyH * 0.38, bodyW * 0.95]} />
        <meshStandardMaterial color={model.bodyColor} metalness={0.9} roughness={0.12} transparent opacity={0.15} />
      </mesh>
      <mesh position={[bodyL / 2.3, 0.18, 0]} rotation={[-0.12, 0, 0]}>
        <boxGeometry args={[bodyL * 0.26, bodyH * 0.38, bodyW * 0.95]} />
        <meshBasicMaterial color={model.accentColor} wireframe transparent opacity={0.2} />
      </mesh>

      {/* Sculpted M fenders - performance-ready */}
      <mesh position={[-(bodyL / 3.0), 0.08, bodyW / 2.12]}>
        <boxGeometry args={[bodyL * 0.77, bodyH * 0.52, 0.13]} />
        <meshStandardMaterial color={model.accentColor} metalness={0.86} roughness={0.14} transparent opacity={0.26} />
      </mesh>
      <mesh position={[-(bodyL / 3.0), 0.08, -bodyW / 2.12]}>
        <boxGeometry args={[bodyL * 0.77, bodyH * 0.52, 0.13]} />
        <meshStandardMaterial color={model.accentColor} metalness={0.86} roughness={0.14} transparent opacity={0.26} />
      </mesh>

      {/* M Performance wheels */}
      {[[-model.wheelOffset, -0.46, bodyW / 2.2], [-model.wheelOffset, -0.46, -bodyW / 2.2], [model.wheelOffset, -0.46, bodyW / 2.2], [model.wheelOffset, -0.46, -bodyW / 2.2]].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[model.wheelRadius, 0.11, 8, 20]} />
            <meshStandardMaterial color={model.wheelColor} metalness={0.91} roughness={0.13} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[model.wheelRadius + 0.042, 0.13, 8, 20]} />
            <meshStandardMaterial color="#0f0f0f" metalness={0.07} roughness={0.87} />
          </mesh>
          {[0, 1, 2, 3, 4].map(spoke => (
            <mesh key={spoke} rotation={[Math.PI / 2, (spoke / 5) * Math.PI * 2, 0]}>
              <cylinderGeometry args={[0.017, 0.017, model.wheelRadius * 1.6, 6]} />
              <meshStandardMaterial color={model.wheelColor} metalness={0.87} />
            </mesh>
          ))}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.065, 16]} />
            <meshStandardMaterial color={model.accentColor} metalness={1} roughness={0.05} />
          </mesh>
        </group>
      ))}

      {/* Axles */}
      <mesh position={[-model.wheelOffset, -0.46, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.036, 0.036, bodyW, 8]} />
        <meshStandardMaterial color={model.wheelColor} metalness={0.79} roughness={0.21} transparent opacity={0.38} />
      </mesh>
      <mesh position={[model.wheelOffset, -0.46, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.036, 0.036, bodyW, 8]} />
        <meshStandardMaterial color={model.wheelColor} metalness={0.79} roughness={0.21} transparent opacity={0.38} />
      </mesh>

      {/* M Sport lighting signature */}
      <mesh position={[-(bodyL / 2.45), 0.28, bodyW / 2.09]}>
        <boxGeometry args={[bodyL * 0.21, 0.07, 0.05]} />
        <meshBasicMaterial color={model.accentColor} transparent opacity={0.55} />
      </mesh>
      <mesh position={[bodyL / 2.25, 0.32, bodyW / 2.09]}>
        <boxGeometry args={[bodyL * 0.19, 0.06, 0.05]} />
        <meshBasicMaterial color={model.accentColor} transparent opacity={0.55} />
      </mesh>

      <pointLight position={[0, -0.58, 0]} color={model.accentColor} intensity={1.25} distance={3.1} />
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

export default function CarModel3D({ variant = "bmw-m5" }: CarModel3DProps) {
  const { activeEcu, fleet, selectedVehicleId } = useFleet();
  const vehicle = fleet.find(v => v.deviceId === selectedVehicleId);
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
        <ambientLight intensity={0.6} />
        <directionalLight position={[6, 8, 6]} intensity={1.2} color="#F0EBE0" />
        <pointLight position={[-5, 3, -4]} intensity={0.8} color={CAR_MODELS[variant].accentColor} />
        <pointLight position={[4, 1, 5]} intensity={0.7} color="#6A9DB8" />

        <group ref={rotationRef}>
          <CarShell variant={variant} />
          {getECUDefs(variant).map(def => {
            // Map ECU name (e.g. "Brake ECU") to twin key (e.g. "brake")
            const lookupKey = def.name.toLowerCase().split(" ")[0];
            const liveColor = vehicle?.ecuStates?.[lookupKey] || "green";
            
            return (
              <ECUComponent 
                key={def.name} 
                def={def} 
                isActive={activeEcu === def.name} 
                variantScale={CAR_MODELS[variant].scale}
                liveColor={liveColor}
              />
            );
          })}
        </group>

        <RotationController rotationRef={rotationRef} rotation={rotation} />

        <OrbitControls enablePan={false} enableDamping={true} dampingFactor={0.08} autoRotate={false} minDistance={3.5} maxDistance={12} minPolarAngle={Math.PI * 0.3} maxPolarAngle={Math.PI * 0.7} />
      </Canvas>
    </div>
  );
}

