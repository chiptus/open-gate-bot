import { deviceDisplayName, getDevice, type PalgateDevice } from "../palgate/client.ts";
import { config } from "../config.ts";

let cached: PalgateDevice | null = null;

export async function loadGateInfo(): Promise<void> {
  try {
    cached = await getDevice(config.GATE_DEVICE_ID);
    console.log(`[gateInfo] Configured gate: ${gateLabel()}`);
  } catch (err) {
    console.warn(
      "[gateInfo] could not fetch device info:",
      err instanceof Error ? err.message : err,
    );
  }
}

export function gateLabel(): string {
  return cached ? deviceDisplayName(cached) : "Gate";
}
