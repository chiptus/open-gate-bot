import { config } from "../config.ts";
import { getUser } from "../db.ts";

export const isAdmin = (userId: number): boolean =>
  userId === config.ADMIN_TELEGRAM_ID;

const isActiveUser = (userId: number): boolean => {
  const u = getUser(userId);
  return !!u && u.is_active === 1;
};

// gateId unused until per-gate permissions are added
export const hasGateAccess = (
  userId: number,
  _gateId = config.GATE_DEVICE_ID,
): boolean => isAdmin(userId) || isActiveUser(userId);
