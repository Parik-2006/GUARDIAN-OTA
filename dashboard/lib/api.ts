import { OTADeployPayload } from "@/types";

const backend = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export async function deployFirmware(payload: OTADeployPayload) {
  const res = await fetch(`${backend}/api/ota/deploy`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

export async function fetchFleet() {
  const res = await fetch(`${backend}/api/fleet`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Unable to fetch fleet");
  }
  const data = await res.json();
  return data.devices;
}

