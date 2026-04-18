"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { DeviceState, ECUKey } from "@/types";

/* ═══════════════════════════════════════════════════════════════
   FLEET VEHICLE — extends DeviceState with display metadata
═══════════════════════════════════════════════════════════════ */
export interface FleetVehicle extends DeviceState {
  name: string;
  model: "Interceptor" | "Sentinel" | "Voyager" | "Phantom" | "Eclipse";
  status: "online" | "offline" | "updating";
  encryptionEnabled: boolean;
}

export type ViewMode = "fleet" | "insight";

interface FleetContextValue {
  fleet: FleetVehicle[];
  setFleet: React.Dispatch<React.SetStateAction<FleetVehicle[]>>;
  currentView: ViewMode;
  selectedVehicleId: string | null;
  activeEcu: string | null;
  setActiveEcu: (ecu: string | null) => void;
  selectVehicle: (id: string) => void;
  goToDashboard: () => void;
  addDevice: (id: string, name: string) => void;
  toggleEncryption: (vehicleId: string) => void;
}

const FleetContext = createContext<FleetContextValue | null>(null);

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
const MODELS: FleetVehicle["model"][] = ["Interceptor", "Sentinel", "Voyager", "Phantom", "Eclipse"];

function randomModel(): FleetVehicle["model"] {
  return MODELS[Math.floor(Math.random() * MODELS.length)];
}

function createDefaultVehicle(id: string, name: string): FleetVehicle {
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
  const defaults: { id: string; name: string; model: FleetVehicle["model"]; primary: boolean }[] = [
    { id: "VEH-001", name: "BMW M3 Competition", model: "Interceptor", primary: true },
    { id: "VEH-002", name: "BMW M5 Sedan",      model: "Sentinel",    primary: false },
    { id: "VEH-003", name: "BMW i8 Roadster",   model: "Voyager",     primary: false },
  ];
  return defaults.map(d => ({
    ...createDefaultVehicle(d.id, d.name),
    model: d.model,
    primary: d.primary,
    otaVersion: d.primary ? "2.4.1" : "2.4.0",
  }));
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

  const addDevice = useCallback((id: string, name: string) => {
    setFleet(prev => [...prev, createDefaultVehicle(id, name)]);
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
      setActiveEcu, selectVehicle, goToDashboard, addDevice, toggleEncryption,
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
