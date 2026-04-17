export type ECUKey = "brake" | "powertrain" | "sensor" | "infotainment";

export interface DeviceState {
  deviceId: string;
  primary: boolean;
  otaVersion: string;
  safetyState: string;
  ecuStates: Record<ECUKey, string>;
  lastSeen: string;
  threatLevel: "LOW" | "MEDIUM" | "HIGH";
  otaProgress: number;
  signatureOk: boolean;
  integrityOk: boolean;
  tlsHealthy: boolean;
  rollbackArmed: boolean;
}

export interface OTADeployPayload {
  version: string;
  firmwareUrl: string;
  firmwareHash: string;
  signatureB64: string;
  canaryPercent: number;
}

