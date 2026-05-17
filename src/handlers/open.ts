import type { Context } from "grammy";
import { isAuthorized, logEvent } from "../db.ts";
import { config } from "../config.ts";
import { openGate, PalgateAuthError } from "../palgate/client.ts";
import { checkCooldown } from "../lib/cooldown.ts";
import { alertAdmin } from "../lib/adminAlert.ts";
import { gateLabel } from "../lib/gateInfo.ts";

export async function handleOpen(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  const isAdmin = userId === config.ADMIN_TELEGRAM_ID;
  if (!isAdmin && !isAuthorized(userId)) {
    await ctx.reply("You're not authorized. Send /start to request access.");
    return;
  }

  const cd = checkCooldown(userId);
  if (!cd.ok) {
    await ctx.reply(`Slow down — try again in ${Math.ceil(cd.waitMs / 1000)}s.`);
    return;
  }

  try {
    console.log(`[open] firing for ${userId}`);
    await openGate();
    logEvent(userId, true);
    console.log(`[open] success for ${userId}`);
    await ctx.reply(`🚪 ${gateLabel()} opening…`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logEvent(userId, false, msg);

    if (err instanceof PalgateAuthError) {
      await alertAdmin(
        ctx.api,
        "palgate-auth",
        `Palgate auth failed (HTTP ${err.status}). Re-run the token extractor and update PALGATE_TOKEN.`,
      );
      await ctx.reply("Gate didn't open — admin notified.");
      return;
    }

    await ctx.reply(`Gate didn't open: ${msg}`);
  }
}
