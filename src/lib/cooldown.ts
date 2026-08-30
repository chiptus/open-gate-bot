const COOLDOWN_MS = 10_000;
const lastOpen = new Map<number, number>();

export function checkCooldown(
  userId: number,
): { ok: true } | { ok: false; waitMs: number } {
  const now = Date.now();
  const last = lastOpen.get(userId);
  if (last !== undefined && now - last < COOLDOWN_MS) {
    return { ok: false, waitMs: COOLDOWN_MS - (now - last) };
  }
  lastOpen.set(userId, now);
  return { ok: true };
}
