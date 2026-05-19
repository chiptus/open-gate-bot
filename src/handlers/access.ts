import type { CallbackQueryContext, CommandContext } from "grammy";
import { InlineKeyboard } from "grammy";
import {
  addUser,
  getAccessRequest,
  isAuthorized,
  setRequestStatus,
  upsertAccessRequest,
} from "../db.ts";
import { config } from "../config.ts";
import { adminKeyboard, userKeyboard } from "./keyboard.ts";
import { i18n, resolveLocaleFor, type BotContext } from "../i18n.ts";

function displayName(ctx: BotContext): string {
  const f = ctx.from;
  if (!f) return "unknown";
  return [f.first_name, f.last_name].filter(Boolean).join(" ") || f.username || String(f.id);
}

export async function handleStart(ctx: CommandContext<BotContext>): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  const isAdmin = userId === config.ADMIN_TELEGRAM_ID;
  if (isAdmin) {
    await ctx.reply(ctx.t("start-welcome-admin"), { reply_markup: adminKeyboard(ctx.t) });
    return;
  }

  if (isAuthorized(userId)) {
    await ctx.reply(ctx.t("start-welcome-user"), { reply_markup: userKeyboard(ctx.t) });
    return;
  }

  const existing = getAccessRequest(userId);
  if (existing?.status === "pending") {
    await ctx.reply(ctx.t("start-request-pending"));
    return;
  }

  await ctx.reply(ctx.t("start-not-authorized"), {
    reply_markup: new InlineKeyboard().text(ctx.t("button-request-access"), "request-access"),
  });
}

export async function handleRequestAccess(ctx: CallbackQueryContext<BotContext>): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  if (userId === config.ADMIN_TELEGRAM_ID || isAuthorized(userId)) {
    await ctx.answerCallbackQuery(ctx.t("access-already-authorized"));
    return;
  }

  const name = displayName(ctx);
  const username = ctx.from?.username ?? null;
  upsertAccessRequest(userId, name, username);

  await ctx.editMessageText(ctx.t("access-request-sent"));
  await ctx.answerCallbackQuery();

  const adminLocale = resolveLocaleFor(config.ADMIN_TELEGRAM_ID);
  const usernameLine = username ? i18n.t(adminLocale, "access-username-line", { username }) + "\n" : "";
  const adminMsg = i18n.t(adminLocale, "access-admin-dm", {
    name,
    id: userId,
    usernameLine,
  });

  await ctx.api.sendMessage(config.ADMIN_TELEGRAM_ID, adminMsg, {
    parse_mode: "Markdown",
    reply_markup: new InlineKeyboard()
      .text(i18n.t(adminLocale, "button-approve"), `approve:${userId}`)
      .text(i18n.t(adminLocale, "button-deny"), `deny:${userId}`),
  });
}

export async function handleApprove(ctx: CallbackQueryContext<BotContext>): Promise<void> {
  if (ctx.from?.id !== config.ADMIN_TELEGRAM_ID) {
    await ctx.answerCallbackQuery(ctx.t("access-admin-only"));
    return;
  }
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

  await ctx.editMessageText(ctx.t("access-approved-ack", { name: req.name, id }));
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

export async function handleDeny(ctx: CallbackQueryContext<BotContext>): Promise<void> {
  if (ctx.from?.id !== config.ADMIN_TELEGRAM_ID) {
    await ctx.answerCallbackQuery(ctx.t("access-admin-only"));
    return;
  }
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
