import { z } from "zod";
import { config } from "../config.ts";
import { generateTemporalToken, type TokenTypeValue } from "./token.ts";

const BASE_URL = "https://api1.pal-es.com/v1/bt";

export class PalgateAuthError extends Error {
  constructor(public readonly status: number, body: string) {
    super(`Palgate auth failed (${status}): ${body}`);
    this.name = "PalgateAuthError";
  }
}

export class PalgateError extends Error {
  constructor(public readonly status: number, body: string) {
    super(`Palgate request failed (${status}): ${body}`);
    this.name = "PalgateError";
  }
}

// HTTP 200, but Palgate refused the action (e.g. output disabled, gate latched).
export class PalgateRejectedError extends Error {
  constructor(message: string, public readonly response: PalgateGenericResponse) {
    super(message);
    this.name = "PalgateRejectedError";
  }
}

// Loose schemas: declare the fields we read, accept everything else via passthrough.
// Palgate's response shape is undocumented and varies by device/account.

// The list endpoint returns `_id`; the single-device endpoint returns `id`.
// Display name lives in `customName1` (user override) or `name1` (factory),
// rarely `name`. We accept all and normalise via the helpers below.
export const PalgateDeviceSchema = z
  .object({
    _id: z.string().optional(),
    id: z.string().optional(),
    name: z.string().optional(),
    name1: z.string().optional(),
    customName1: z.string().optional(),
    address: z.string().optional(),
    model: z.string().optional(),
    validUntil: z.string().optional(),
    output1Disabled: z.boolean().optional(),
    simStatus: z.string().optional(),
  })
  .passthrough();

export type PalgateDevice = z.infer<typeof PalgateDeviceSchema>;

export function deviceId(d: PalgateDevice): string {
  return d._id ?? d.id ?? "";
}

export function deviceDisplayName(d: PalgateDevice): string {
  return d.customName1 || d.name1 || d.name || d.address || "Gate";
}

const DevicesResponseSchema = z
  .object({
    devices: z.array(PalgateDeviceSchema).optional(),
    status: z.string().optional(),
    msg: z.string().optional(),
  })
  .passthrough();

const DeviceResponseSchema = z
  .object({
    device: PalgateDeviceSchema.optional(),
    status: z.string().optional(),
    msg: z.string().optional(),
  })
  .passthrough();

const GenericResponseSchema = z
  .object({
    status: z.string().optional(),
    msg: z.string().optional(),
    err: z.unknown().optional(),
    confirmed: z.boolean().optional(),
  })
  .passthrough();

export type PalgateGenericResponse = z.infer<typeof GenericResponseSchema>;

async function call(path: string): Promise<unknown> {
  const temporalToken = generateTemporalToken(
    config.PALGATE_TOKEN,
    config.PALGATE_PHONE,
    config.PALGATE_TOKEN_TYPE as TokenTypeValue,
  );

  const res = await fetch(`${BASE_URL}/${path}`, {
    method: "GET",
    headers: {
      "x-bt-token": temporalToken,
      Accept: "*/*",
      "Accept-Language": "en-us",
      "Content-Type": "application/json",
      "User-Agent": "okhttp/4.9.3",
    },
  });

  const body = await res.text().catch(() => "");
  console.log(`[palgate] GET ${path} → ${res.status} ${body}`);

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new PalgateAuthError(res.status, body);
    }
    throw new PalgateError(res.status, body);
  }

  return body ? JSON.parse(body) : {};
}

export async function openGate(): Promise<PalgateGenericResponse> {
  const raw = await call(`device/${config.GATE_DEVICE_ID}/open-gate?outputNum=1`);
  const res = GenericResponseSchema.parse(raw);
  // Palgate returns HTTP 200 even when it refuses the action; the real outcome
  // is in `confirmed` and `err`.
  if (res.confirmed === false || (res.err !== null && res.err !== undefined)) {
    throw new PalgateRejectedError(res.msg || String(res.err) || "Gate refused command", res);
  }
  return res;
}

export async function listDevices(): Promise<PalgateDevice[]> {
  const raw = await call("devices/");
  // Some accounts return {devices: [...]}, others return the array directly.
  if (Array.isArray(raw)) return z.array(PalgateDeviceSchema).parse(raw);
  return DevicesResponseSchema.parse(raw).devices ?? [];
}

export async function getDevice(deviceId: string): Promise<PalgateDevice> {
  const raw = await call(`device/${deviceId}/`);
  const parsed = DeviceResponseSchema.parse(raw);
  return parsed.device ?? PalgateDeviceSchema.parse(raw);
}

export async function checkToken(): Promise<PalgateGenericResponse> {
  const ts = Math.floor(Date.now() / 1000);
  const raw = await call(`user/check-token?ts=${ts}&ts_diff=0`);
  return GenericResponseSchema.parse(raw);
}
