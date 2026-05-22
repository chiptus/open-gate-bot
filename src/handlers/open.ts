import { logEvent } from "../db.ts";
import { config } from "../config.ts";
import {
  openGate,
  PalgateAuthError,
  PalgateRejectedError,
} from "../palgate/client.ts";
import { checkCooldown } from "../lib/cooldown.ts";
import { alertAdmin } from "../lib/adminAlert.ts";
import { gateLabel } from "../lib/gateInfo.ts";
import { i18n, resolveLocaleFor, type BotContext } from "../i18n.ts";

export async function handleOpen(ctx: BotContext): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  const cd = checkCooldown(userId);
  if (!cd.ok) {
    await ctx.reply(
      ctx.t("open-cooldown", { seconds: Math.ceil(cd.waitMs / 1000) }),
    );
    return;
  }

  try {
    console.log(`[open] firing for ${userId}`);
    await openGate();
    logEvent(userId, true);
    console.log(`[open] success for ${userId}`);
    await ctx.reply(ctx.t("open-firing", { gate: gateLabel() }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logEvent(userId, false, msg);

    if (err instanceof PalgateRejectedError) {
      await ctx.reply(ctx.t("open-rejected", { reason: err.message }));
      return;
    }

    if (err instanceof PalgateAuthError) {
      const adminLocale = resolveLocaleFor(config.ADMIN_TELEGRAM_ID);
      await alertAdmin(
        ctx.api,
        "palgate-auth",
        i18n.t(adminLocale, "alert-palgate-auth-on-open", {
          status: err.status,
        }),
      );
      await ctx.reply(ctx.t("open-auth-failed"));
      return;
    }

    await ctx.reply(ctx.t("open-failed", { reason: msg }));
  }
}
