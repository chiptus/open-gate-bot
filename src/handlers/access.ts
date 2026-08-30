import type { CallbackQueryContext, CommandContext } from "grammy";
import { addUser, getAccessRequest, setRequestStatus } from "../db.ts";
import { config } from "../config.ts";
import { adminKeyboard, userKeyboard } from "./keyboard.ts";
import { i18n, resolveLocaleFor, type BotContext } from "../i18n.ts";
import { isAdmin, hasGateAccess } from "../lib/access.ts";
import { ensureAccessRequested } from "../lib/accessRequests.ts";

export async function handleStart(
  ctx: CommandContext<BotContext>,
): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  if (isAdmin(userId)) {
    await ctx.reply(ctx.t("start-welcome-admin"), {
      reply_markup: adminKeyboard(ctx.t),
    });
    return;
  }

  if (hasGateAccess(userId)) {
    await ctx.reply(ctx.t("start-welcome-user"), {
      reply_markup: userKeyboard(ctx.t),
    });
    return;
  }

  const result = await ensureAccessRequested(ctx.api, ctx.from);
  await ctx.reply(
    ctx.t(
      result === "pending" ? "start-request-pending" : "start-not-authorized",
    ),
  );
}

/**
 * Any free-text message ("hi") from an unauthorized user files an access
 * request the same way /start does, so the admin doesn't need the user to
 * find and tap the "Request access" button.
 */
export async function handleImplicitAccessRequest(
  ctx: BotContext,
): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId || isAdmin(userId) || hasGateAccess(userId)) return;

  const result = await ensureAccessRequested(ctx.api, ctx.from);
  if (result === "pending") {
    await ctx.reply(ctx.t("start-request-pending"));
  } else if (result === "sent") {
    await ctx.reply(ctx.t("access-request-sent"));
  }
}

export async function handleRequestAccess(
  ctx: CallbackQueryContext<BotContext>,
): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  const result = await ensureAccessRequested(ctx.api, ctx.from);
  if (result === "already") {
    await ctx.answerCallbackQuery(ctx.t("access-already-authorized"));
    return;
  }

  await ctx.editMessageText(ctx.t("access-request-sent"));
  await ctx.answerCallbackQuery();
}

export async function handleApprove(
  ctx: CallbackQueryContext<BotContext>,
): Promise<void> {
  const idStr = ctx.match?.[1];
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    await ctx.answerCallbackQuery(ctx.t("access-bad-request-id"));
    return;
  }
  const req = getAccessRequest(id);
  if (!req) {
    await ctx.answerCallbackQuery(ctx.t("access-request-not-found"));
    return;
  }
  addUser(id, req.name, req.username, config.ADMIN_TELEGRAM_ID);
  setRequestStatus(id, "approved");

  await ctx.editMessageText(
    ctx.t("access-approved-ack", { name: req.name, id }),
  );
  await ctx.answerCallbackQuery();

  const userLocale = resolveLocaleFor(id);
  try {
    await ctx.api.sendMessage(id, i18n.t(userLocale, "access-approved-dm"), {
      reply_markup: userKeyboard((key, vars) => i18n.t(userLocale, key, vars)),
    });
  } catch (err) {
    console.error("Failed to notify approved user:", err);
  }
}

export async function handleDeny(
  ctx: CallbackQueryContext<BotContext>,
): Promise<void> {
  const idStr = ctx.match?.[1];
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    await ctx.answerCallbackQuery(ctx.t("access-bad-request-id"));
    return;
  }
  setRequestStatus(id, "denied");
  await ctx.editMessageText(ctx.t("access-denied-ack", { id }));
  await ctx.answerCallbackQuery();
}
