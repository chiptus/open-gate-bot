import type { MiddlewareFn } from "grammy";
import type { BotContext } from "../i18n.ts";
import { isAdmin, hasGateAccess } from "../lib/access.ts";

export const requireAdmin: MiddlewareFn<BotContext> = async (ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  if (!isAdmin(userId)) {
    await ctx.reply(ctx.t("admin-only"));
    return;
  }
  await next();
};

export const requireGateAccess: MiddlewareFn<BotContext> = async (
  ctx,
  next,
) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  if (!hasGateAccess(userId)) {
    await ctx.reply(ctx.t("open-not-authorized"));
    return;
  }
  await next();
};
