import type { CallbackQueryContext, CommandContext, Context } from "grammy";
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

function displayName(ctx: Context): string {
  const f = ctx.from;
  if (!f) return "unknown";
  return [f.first_name, f.last_name].filter(Boolean).join(" ") || f.username || String(f.id);
}

export async function handleStart(ctx: CommandContext<Context>): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  const isAdmin = userId === config.ADMIN_TELEGRAM_ID;
  if (isAdmin) {
    await ctx.reply("Welcome, admin. Tap to open the gate or manage users.", {
      reply_markup: adminKeyboard(),
    });
    return;
  }

  if (isAuthorized(userId)) {
    await ctx.reply("You're authorized. Tap below to open the gate.", {
      reply_markup: userKeyboard(),
    });
    return;
  }

  const existing = getAccessRequest(userId);
  if (existing?.status === "pending") {
    await ctx.reply("Your request is pending admin approval.");
    return;
  }

  await ctx.reply("Hi! You're not authorized yet. Tap below to request access.", {
    reply_markup: new InlineKeyboard().text("Request access", "request-access"),
  });
}

export async function handleRequestAccess(ctx: CallbackQueryContext<Context>): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  if (userId === config.ADMIN_TELEGRAM_ID || isAuthorized(userId)) {
    await ctx.answerCallbackQuery("You're already authorized.");
    return;
  }

  const name = displayName(ctx);
  const username = ctx.from?.username ?? null;
  upsertAccessRequest(userId, name, username);

  await ctx.editMessageText("Request sent. The admin will review it.");
  await ctx.answerCallbackQuery();

  const adminMsg =
    `🔔 Access request:\n\n` +
    `Name: ${name}\n` +
    `${username ? `Username: @${username}\n` : ""}` +
    `Telegram ID: \`${userId}\``;

  await ctx.api.sendMessage(config.ADMIN_TELEGRAM_ID, adminMsg, {
    parse_mode: "Markdown",
    reply_markup: new InlineKeyboard()
      .text("✅ Approve", `approve:${userId}`)
      .text("❌ Deny", `deny:${userId}`),
  });
}

export async function handleApprove(ctx: CallbackQueryContext<Context>): Promise<void> {
  if (ctx.from?.id !== config.ADMIN_TELEGRAM_ID) {
    await ctx.answerCallbackQuery("Admin only.");
    return;
  }
  const idStr = ctx.match?.[1];
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    await ctx.answerCallbackQuery("Bad request id.");
    return;
  }
  const req = getAccessRequest(id);
  if (!req) {
    await ctx.answerCallbackQuery("Request not found.");
    return;
  }
  addUser(id, req.name, req.username, config.ADMIN_TELEGRAM_ID);
  setRequestStatus(id, "approved");

  await ctx.editMessageText(`✅ Approved ${req.name} (${id})`);
  await ctx.answerCallbackQuery();

  try {
    await ctx.api.sendMessage(id, "You've been approved! Tap below to open the gate.", {
      reply_markup: userKeyboard(),
    });
  } catch (err) {
    console.error("Failed to notify approved user:", err);
  }
}

export async function handleDeny(ctx: CallbackQueryContext<Context>): Promise<void> {
  if (ctx.from?.id !== config.ADMIN_TELEGRAM_ID) {
    await ctx.answerCallbackQuery("Admin only.");
    return;
  }
  const idStr = ctx.match?.[1];
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    await ctx.answerCallbackQuery("Bad request id.");
    return;
  }
  setRequestStatus(id, "denied");
  await ctx.editMessageText(`❌ Denied ${id}`);
  await ctx.answerCallbackQuery();
}
