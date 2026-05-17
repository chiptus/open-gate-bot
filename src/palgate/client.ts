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

export type PalgateDevice = {
  _id: string;
  address?: string;
  name?: string;
  [key: string]: unknown;
};

async function call<T = unknown>(path: string): Promise<T> {
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

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new PalgateAuthError(res.status, body);
    }
    throw new PalgateError(res.status, body);
  }

  return (body ? JSON.parse(body) : {}) as T;
}

export async function openGate(): Promise<void> {
  await call(`device/${config.GATE_DEVICE_ID}/open-gate?outputNum=1`);
}

export async function listDevices(): Promise<PalgateDevice[]> {
  const res = await call<{ devices?: PalgateDevice[] } | PalgateDevice[]>("devices/");
  if (Array.isArray(res)) return res;
  return res.devices ?? [];
}

export async function getDevice(deviceId: string): Promise<PalgateDevice> {
  const res = await call<{ device?: PalgateDevice } & PalgateDevice>(`device/${deviceId}/`);
  return res.device ?? res;
}

export async function checkToken(): Promise<void> {
  const ts = Math.floor(Date.now() / 1000);
  await call(`user/check-token?ts=${ts}&ts_diff=0`);
}
