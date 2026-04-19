"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { DeviceState, ECUKey } from "@/types";
import type { CarVariant } from "./CarModel3D";

/* ═══════════════════════════════════════════════════════════════
   ACTIVITY LOG TYPES
═══════════════════════════════════════════════════════════════ */
export interface ActivityLog {
  id: string;
  timestamp: Date;
  type: "device_added" | "device_deleted" | "ota_started" | "ota_completed" | "device_connected" | "device_disconnected" | "encryption_toggled" | "ecu_status_changed";
  vehicleId?: string;
  vehicleName?: string;
  message: string;
  metadata?: Record<string, any>;
}

/* ═══════════════════════════════════════════════════════════════
   FLEET VEHICLE — extends DeviceState with display metadata
═══════════════════════════════════════════════════════════════ */
export interface FleetVehicle extends DeviceState {
  name: string;
  model: "Interceptor" | "Sentinel" | "Voyager" | "Phantom" | "Eclipse";
  carVariant: CarVariant;
  status: "online" | "offline" | "updating";
  encryptionEnabled: boolean;
  companyLogoIndex: number;
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
  addDevice: (id: string) => void;
  deleteDevice: (deviceId: string) => void;
  toggleEncryption: (vehicleId: string) => void;
  detectDeviceInfo: (deviceId: string) => { model: FleetVehicle["model"]; variant: CarVariant; name: string };
  getModelColor: (model: FleetVehicle["model"]) => { primary: string; glow: string; accent: string };
  activityLogs: ActivityLog[];
  addActivityLog: (log: Omit<ActivityLog, "id" | "timestamp">) => void;
}

const FleetContext = createContext<FleetContextValue | null>(null);

/* ═══════════════════════════════════════════════════════════════
   HELPERS & AUTO-DETECTION SYSTEM
═══════════════════════════════════════════════════════════════ */
const MODELS: FleetVehicle["model"][] = ["Interceptor", "Sentinel", "Voyager", "Phantom", "Eclipse"];
const CAR_VARIANTS: CarVariant[] = ["audi-a8", "mercedes-s", "bmw-m5"];

// Device Model Detection & Naming System
const DEVICE_MODELS_MAP: Record<string, { model: FleetVehicle["model"]; variant: CarVariant; names: string[] }> = {
  "Interceptor": {
    model: "Interceptor",
    variant: "audi-a8",
    names: ["Audi A8 e-tron", "Audi A8 Quantum", "Audi Guardian Alpha", "Audi A8 Sentinel"],
  },
  "Sentinel": {
    model: "Sentinel",
    variant: "mercedes-s",
    names: ["Mercedes-AMG S63", "Mercedes S-Class Guard", "Mercedes Elite Defender", "Mercedes S63 Sentinel"],
  },
  "Voyager": {
    model: "Voyager",
    variant: "bmw-m5",
    names: ["BMW M5 Sedan", "BMW M5 Navigator", "BMW M Series Guardian", "BMW M5 Voyager"],
  },
  "Phantom": {
    model: "Phantom",
    variant: "audi-a8",
    names: ["Audi A8 Ghost", "Audi Phantom Protocol", "Audi A8 Stealth", "Audi A8 Covert"],
  },
  "Eclipse": {
    model: "Eclipse",
    variant: "bmw-m5",
    names: ["BMW M5 Eclipse", "BMW M Series Shadow", "BMW M5 Twilight", "BMW M5 Nova"],
  },
};

// Color mapping for models
const MODEL_COLORS: Record<FleetVehicle["model"], { primary: string; glow: string; accent: string }> = {
  "Interceptor": { primary: "#D4A96A", glow: "rgba(212,169,106,0.3)", accent: "#E6C88F" },
  "Sentinel": { primary: "#6A9DB8", glow: "rgba(106,157,184,0.3)", accent: "#8DBBDB" },
  "Voyager": { primary: "#7AB88A", glow: "rgba(122,184,138,0.3)", accent: "#A3D4A8" },
  "Phantom": { primary: "#9B7BA3", glow: "rgba(155,123,163,0.3)", accent: "#B8A3C4" },
  "Eclipse": { primary: "#D4956A", glow: "rgba(212,149,106,0.3)", accent: "#E6B88F" },
};

// Auto-detect vehicle model based on device ID or sequence
function detectVehicleModel(deviceId: string, existingFleet: FleetVehicle[]): { model: FleetVehicle["model"]; variant: CarVariant; name: string } {
  // Extract number from device ID (e.g., VEH-004 -> 4)
  const match = deviceId.match(/\d+/);
  const deviceNum = match ? parseInt(match[0]) : Math.floor(Math.random() * 5);

  // Deterministic model assignment based on device number
  const modelIndex = deviceNum % 5;
  const modelKey = MODELS[modelIndex];
  const modelConfig = DEVICE_MODELS_MAP[modelKey];

  // Get a name that isn't already used in the fleet
  const usedNames = new Set(existingFleet.map(v => v.name));
  let selectedName = modelConfig.names[0];
  
  for (const name of modelConfig.names) {
    if (!usedNames.has(name)) {
      selectedName = name;
      break;
    }
  }

  return {
    model: modelConfig.model,
    variant: modelConfig.variant,
    name: selectedName,
  };
}

function randomModel(): FleetVehicle["model"] {
  return MODELS[Math.floor(Math.random() * MODELS.length)];
}

function randomCarVariant(): CarVariant {
  return CAR_VARIANTS[Math.floor(Math.random() * CAR_VARIANTS.length)];
}

function createDefaultVehicle(id: string, name: string, model: FleetVehicle["model"], carVariant: CarVariant): FleetVehicle {
  const ecuStates: Record<ECUKey, string> = {
    brake: "green",
    powertrain: "green",
    sensor: "green",
    infotainment: "green",
  };
  return {
    deviceId: id,
    name,
    model,
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
    companyLogoIndex: Math.floor(Math.random() * 15),
  };
}

/* ═══════════════════════════════════════════════════════════════
   DEFAULT FLEET — 3 initial vehicles
═══════════════════════════════════════════════════════════════ */
export function createDefaultFleet(): FleetVehicle[] {
  const defaults: { id: string; name: string; model: FleetVehicle["model"]; carVariant: CarVariant; primary: boolean }[] = [
    { id: "VEH-001", name: "Audi A8 e-tron",    model: "Interceptor", carVariant: "audi-a8",    primary: true },
    { id: "VEH-002", name: "Mercedes-AMG S63",  model: "Sentinel",    carVariant: "mercedes-s", primary: false },
    { id: "VEH-003", name: "BMW M5 Sedan",      model: "Voyager",     carVariant: "bmw-m5",     primary: false },
  ];
  return defaults.map(d => ({
    ...createDefaultVehicle(d.id, d.name, d.model, d.carVariant),
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
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

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

  const addActivityLog = useCallback((log: Omit<ActivityLog, "id" | "timestamp">) => {
    setActivityLogs(prev => [{
      ...log,
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    }, ...prev]);
  }, []);

  const addDevice = useCallback((id: string) => {
    setFleet(prev => {
      // Auto-detect model, variant, and name based on device ID
      const detectedInfo = detectVehicleModel(id, prev);
      return [...prev, createDefaultVehicle(id, detectedInfo.name, detectedInfo.model, detectedInfo.variant)];
    });
    // Log the device addition activity
    const detectedInfo = detectVehicleModel(id, fleet);
    addActivityLog({
      type: "device_added",
      vehicleId: id,
      vehicleName: detectedInfo.name,
      message: `✓ Device added: ${detectedInfo.name} (${id})`,
    });
  }, [fleet, addActivityLog]);

  const deleteDevice = useCallback((deviceId: string) => {
    const vehicle = fleet.find(v => v.deviceId === deviceId);
    setFleet(prev => prev.filter(v => v.deviceId !== deviceId));
    setSelectedVehicleId(null);
    setCurrentView("fleet");
    if (vehicle) {
      addActivityLog({
        type: "device_deleted",
        vehicleId: deviceId,
        vehicleName: vehicle.name,
        message: `✗ Device removed: ${vehicle.name} (${deviceId})`,
      });
    }
  }, [fleet, addActivityLog]);

  const toggleEncryption = useCallback((vehicleId: string) => {
    const vehicle = fleet.find(v => v.deviceId === vehicleId);
    setFleet(prev =>
      prev.map(v =>
        v.deviceId === vehicleId
          ? { ...v, encryptionEnabled: !v.encryptionEnabled }
          : v
      )
    );
    if (vehicle) {
      addActivityLog({
        type: "encryption_toggled",
        vehicleId: vehicleId,
        vehicleName: vehicle.name,
        message: `🔐 Encryption ${!vehicle.encryptionEnabled ? "enabled" : "disabled"} on ${vehicle.name}`,
        metadata: { encryptionEnabled: !vehicle.encryptionEnabled },
      });
    }
  }, [fleet, addActivityLog]);

  const detectDeviceInfo = useCallback((deviceId: string) => {
    return detectVehicleModel(deviceId, fleet);
  }, [fleet]);

  const getModelColor = useCallback((model: FleetVehicle["model"]) => {
    return MODEL_COLORS[model];
  }, []);

  return (
    <FleetContext.Provider value={{
      fleet, setFleet, currentView, selectedVehicleId, activeEcu,
      setActiveEcu, selectVehicle, goToDashboard, goToTerminal, goToDocumentation, addDevice, deleteDevice, toggleEncryption,
      detectDeviceInfo, getModelColor, activityLogs, addActivityLog,
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
