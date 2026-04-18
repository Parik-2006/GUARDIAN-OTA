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

export interface Campaign {
  id: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  status: "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CANCELLED";
  targetCount: number;
  completedCount: number;
  failedCount: number;
  canaryPercent: number;
}

export interface OTAEvent {
  id: string;
  timestamp: string;
  deviceId: string;
  type: string;
  message: string;
  severity: "INFO" | "WARN" | "ERROR";
  campaignId?: string;
}


