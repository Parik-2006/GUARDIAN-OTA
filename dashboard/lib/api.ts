// lib/api.ts — Complete typed API integration layer for GUARDIAN-OTA backend

import type { DeviceState, OTADeployPayload, Campaign, OTAEvent } from "@/types";

const backend = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

// ── Fleet ────────────────────────────────────────────────────────────────

export async function fetchFleet(): Promise<DeviceState[]> {
  const res = await fetch(`${backend}/api/fleet`, { cache: "no-store" });
  if (!res.ok) throw new Error("fetchFleet: " + res.statusText);
  const data = await res.json();
  return data.devices as DeviceState[];
}

// ── OTA Deploy ───────────────────────────────────────────────────────────

export interface DeployResult {
  queued:     boolean;
  campaignId: string;
  targets:    string[];
  count:      number;
}

export async function deployFirmware(payload: OTADeployPayload): Promise<DeployResult> {
  const res = await fetch(`${backend}/api/ota/deploy`, {
    method:  "POST",
    headers: { "content-type": "application/json" },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || "deploy failed");
  }
  return res.json();
}

// ── Campaigns ────────────────────────────────────────────────────────────

export async function fetchCampaigns(): Promise<Campaign[]> {
  const res = await fetch(`${backend}/api/campaigns`, { cache: "no-store" });
  if (!res.ok) throw new Error("fetchCampaigns: " + res.statusText);
  const data = await res.json();
  return data.campaigns as Campaign[];
}

export async function fetchCampaign(id: string): Promise<Campaign> {
  const res = await fetch(`${backend}/api/campaigns/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("fetchCampaign: " + res.statusText);
  return res.json();
}

// ── Events ───────────────────────────────────────────────────────────────

export async function fetchEvents(eventType?: string, limit = 50): Promise<OTAEvent[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (eventType) params.set("type", eventType);
  const res = await fetch(`${backend}/api/events?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error("fetchEvents: " + res.statusText);
  const data = await res.json();
  return data.events as OTAEvent[];
}
