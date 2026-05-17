import { config } from "../config.ts";
import { generateTemporalToken, type TokenTypeValue } from "./token.ts";

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

export async function openGate(): Promise<void> {
  const temporalToken = generateTemporalToken(
    config.PALGATE_TOKEN,
    config.PALGATE_PHONE,
    config.PALGATE_TOKEN_TYPE as TokenTypeValue,
  );

  const url = `https://api1.pal-es.com/v1/bt/device/${config.GATE_DEVICE_ID}/open-gate?outputNum=1`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-bt-token": temporalToken,
      Accept: "*/*",
      "Accept-Language": "en-us",
      "Content-Type": "application/json",
      "User-Agent": "okhttp/4.9.3",
    },
  });

  if (res.ok) return;

  const body = await res.text().catch(() => "");
  if (res.status === 401 || res.status === 403) {
    throw new PalgateAuthError(res.status, body);
  }
  throw new PalgateError(res.status, body);
}
