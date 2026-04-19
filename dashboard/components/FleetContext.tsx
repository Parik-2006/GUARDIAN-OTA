"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { DeviceState, ECUKey } from "@/types";
import type { CarVariant } from "./CarModel3D";

/* ═══════════════════════════════════════════════════════════════
   FLEET VEHICLE — extends DeviceState with display metadata
═══════════════════════════════════════════════════════════════ */
export interface FleetVehicle extends DeviceState {
  name: string;
  model: "Interceptor" | "Sentinel" | "Voyager" | "Phantom" | "Eclipse";
  carVariant: CarVariant;
  status: "online" | "offline" | "updating";
  encryptionEnabled: boolean;
  otaStatus?: string; // raw MQTT status: ack | downloading | verifying | success | online | error
}

export type ViewMode = "fleet" | "insight" | "terminal" | "documentation";

interface FleetContextValue {
  fleet: FleetVehicle[];
  setFleet: React.Dispatch<React.SetStateAction<FleetVehicle[]>>;
  currentView: ViewMode;
  selectedVehicleId: string | null;
  activeEcu: string | null;
  setActiveEcu: (ecu: string | null) => void;
  selectVehicle: (id: string) => void;
  goToDashboard: () => void;
  goToTerminal: () => void;
  goToDocumentation: () => void;
  addDevice: (id: string, name: string) => void;
  deleteDevice: (deviceId: string) => void;
  toggleEncryption: (vehicleId: string) => void;
}

const FleetContext = createContext<FleetContextValue | null>(null);

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
const MODELS: FleetVehicle["model"][] = ["Interceptor", "Sentinel", "Voyager", "Phantom", "Eclipse"];
const CAR_VARIANTS: CarVariant[] = ["audi-a8", "mercedes-s", "bmw-m5"];

export function randomModel(): FleetVehicle["model"] {
  return MODELS[Math.floor(Math.random() * MODELS.length)];
}

export function randomCarVariant(): CarVariant {
  return CAR_VARIANTS[Math.floor(Math.random() * CAR_VARIANTS.length)];
}

export function createDefaultVehicle(id: string, name: string, carVariant: CarVariant): FleetVehicle {
  const ecuStates: Record<ECUKey, string> = {
    brake: "green",
    powertrain: "green",
    sensor: "green",
    infotainment: "green",
  };
  return {
    deviceId: id,
    name,
    model: randomModel(),
    carVariant,
    status: "online",
    primary: false,
    otaVersion: "1.0.0",
    safetyState: "SAFE",
    ecuStates,
    lastSeen: new Date().toISOString(),
    threatLevel: "LOW",
    otaProgress: 0,
    signatureOk: true,
    integrityOk: true,
    tlsHealthy: true,
    rollbackArmed: true,
    encryptionEnabled: true,
  };
}

/* ═══════════════════════════════════════════════════════════════
   DEFAULT FLEET — 3 initial vehicles
═══════════════════════════════════════════════════════════════ */
export function createDefaultFleet(): FleetVehicle[] {
  return []; // Start empty. Let the backend populate the dashboard!
}

/* ═══════════════════════════════════════════════════════════════
   PROVIDER
═══════════════════════════════════════════════════════════════ */
export function FleetProvider({ children }: { children: ReactNode }) {
  const [fleet, setFleet] = useState<FleetVehicle[]>(createDefaultFleet);
  const [currentView, setCurrentView] = useState<ViewMode>("fleet");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [activeEcu, setActiveEcu] = useState<string | null>(null);

  const selectVehicle = useCallback((id: string) => {
    setSelectedVehicleId(id);
    setActiveEcu(null);
    setCurrentView("insight");
  }, []);

  const goToDashboard = useCallback(() => {
    setCurrentView("fleet");
    setSelectedVehicleId(null);
    setActiveEcu(null);
  }, []);

  const goToTerminal = useCallback(() => {
    setCurrentView("terminal");
    setSelectedVehicleId(null);
    setActiveEcu(null);
  }, []);

  const goToDocumentation = useCallback(() => {
    setCurrentView("documentation");
    setSelectedVehicleId(null);
    setActiveEcu(null);
  }, []);

  const addDevice = useCallback((id: string, name: string) => {
    setFleet(prev => [...prev, createDefaultVehicle(id, name, randomCarVariant())]);
  }, []);

  const deleteDevice = useCallback((deviceId: string) => {
    setFleet(prev => prev.filter(v => v.deviceId !== deviceId));
    setSelectedVehicleId(null);
    setCurrentView("fleet");
  }, []);

  const toggleEncryption = useCallback((vehicleId: string) => {
    setFleet(prev =>
      prev.map(v =>
        v.deviceId === vehicleId
          ? { ...v, encryptionEnabled: !v.encryptionEnabled }
          : v
      )
    );
  }, []);

  return (
    <FleetContext.Provider value={{
      fleet, setFleet, currentView, selectedVehicleId, activeEcu,
      setActiveEcu, selectVehicle, goToDashboard, goToTerminal, goToDocumentation, addDevice, deleteDevice, toggleEncryption,
    }}>
      {children}
    </FleetContext.Provider>
  );
}

export function useFleet() {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error("useFleet must be used within FleetProvider");
  return ctx;
}
