"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";
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
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CAR SHELL — Wireframe X-ray body
═══════════════════════════════════════════════════════════════ */
function CarShell() {
  const groupRef = useRef<THREE.Group>(null!);

  return (
    <group ref={groupRef}>
      {/* Main body */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[3.8, 0.7, 1.6]} />
        <meshPhysicalMaterial
          color="#C8914A"
          transparent
          opacity={0.08}
          wireframe={false}
          roughness={0.2}
          metalness={0.8}
          transmission={0.6}
          thickness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Body wireframe overlay */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[3.8, 0.7, 1.6]} />
        <meshBasicMaterial color="#C8914A" wireframe transparent opacity={0.15} />
      </mesh>

      {/* Cabin */}
      <mesh position={[0.2, 0.4, 0]}>
        <boxGeometry args={[2.2, 0.6, 1.4]} />
        <meshPhysicalMaterial
          color="#C8914A"
          transparent
          opacity={0.06}
          wireframe={false}
          roughness={0.2}
          metalness={0.8}
          transmission={0.7}
          thickness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Cabin wireframe */}
      <mesh position={[0.2, 0.4, 0]}>
        <boxGeometry args={[2.2, 0.6, 1.4]} />
        <meshBasicMaterial color="#C8914A" wireframe transparent opacity={0.12} />
      </mesh>

      {/* Hood */}
      <mesh position={[-1.4, 0.05, 0]} rotation={[0, 0, -0.08]}>
        <boxGeometry args={[1.2, 0.3, 1.5]} />
        <meshBasicMaterial color="#D4A96A" wireframe transparent opacity={0.1} />
      </mesh>

      {/* Trunk */}
      <mesh position={[1.5, 0, 0]}>
        <boxGeometry args={[0.8, 0.35, 1.4]} />
        <meshBasicMaterial color="#D4A96A" wireframe transparent opacity={0.1} />
      </mesh>

      {/* Wheels */}
      {[
        [-1.2, -0.45, 0.85],
        [-1.2, -0.45, -0.85],
        [1.1, -0.45, 0.85],
        [1.1, -0.45, -0.85],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.25, 0.08, 8, 16]} />
          <meshBasicMaterial color="#A8A29A" wireframe transparent opacity={0.25} />
        </mesh>
      ))}

      {/* Axles */}
      {[-1.2, 1.1].map((x, i) => (
        <mesh key={i} position={[x, -0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.7, 6]} />
          <meshBasicMaterial color="#A8A29A" transparent opacity={0.15} />
        </mesh>
      ))}

      {/* Grid floor */}
      <gridHelper args={[8, 16, "#2E2820", "#1D1912"]} position={[0, -0.75, 0]} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN 3D SCENE
═══════════════════════════════════════════════════════════════ */
export default function CarModel3D() {
  const { activeEcu } = useFleet();

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        camera={{ position: [3, 2, 4], fov: 45 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.7} color="#F0EBE0" />
        <pointLight position={[-3, 2, -2]} intensity={0.4} color="#C8914A" />
        <pointLight position={[2, -1, 3]} intensity={0.3} color="#6A9DB8" />

        <Float speed={0.8} rotationIntensity={0.1} floatIntensity={0.3}>
          <group>
            <CarShell />
            {ECU_DEFS.map(def => (
              <ECUComponent
                key={def.name}
                def={def}
                isActive={activeEcu === def.name}
              />
            ))}
          </group>
        </Float>

        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={10}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
