import type { Api } from "grammy";
import { config } from "../config.ts";

const ALERT_THROTTLE_MS = 60 * 60 * 1000;
const lastAlertByKey = new Map<string, number>();

export async function alertAdmin(api: Api, key: string, message: string): Promise<void> {
  const now = Date.now();
  const last = lastAlertByKey.get(key);
  if (last !== undefined && now - last < ALERT_THROTTLE_MS) return;
  lastAlertByKey.set(key, now);
  try {
    await api.sendMessage(config.ADMIN_TELEGRAM_ID, `⚠️ ${message}`);
  } catch (err) {
    console.error("Failed to DM admin:", err);
  }
}
