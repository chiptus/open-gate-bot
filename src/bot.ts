import { Bot } from "grammy";
import { config } from "./config.ts";
import { handleOpen } from "./handlers/open.ts";
import {
  handleAddUser,
  handleGates,
  handleLog,
  handleRevoke,
  handleUsers,
} from "./handlers/admin.ts";
import {
  handleApprove,
  handleDeny,
  handleRequestAccess,
  handleStart,
} from "./handlers/access.ts";
import { OPEN_BUTTON, MANAGE_BUTTON } from "./handlers/keyboard.ts";

const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

bot.use(async (ctx, next) => {
  const from = ctx.from;
  const who = from ? `${from.id}${from.username ? ` @${from.username}` : ""}` : "?";
  const what = ctx.message?.text ?? ctx.callbackQuery?.data ?? ctx.update.update_id;
  const start = Date.now();
  console.log(`→ ${who}: ${what}`);
  try {
    await next();
    console.log(`← ${who}: ok (${Date.now() - start}ms)`);
  } catch (err) {
    console.error(`← ${who}: error (${Date.now() - start}ms)`, err);
    throw err;
  }
});

bot.command("start", handleStart);
bot.command("open", handleOpen);
bot.command("adduser", handleAddUser);
bot.command("revoke", handleRevoke);
bot.command("users", handleUsers);
bot.command("gates", handleGates);
bot.command("log", handleLog);

bot.hears(OPEN_BUTTON, handleOpen);
bot.hears(MANAGE_BUTTON, async (ctx) => {
  if (ctx.from?.id !== config.ADMIN_TELEGRAM_ID) return;
  await ctx.reply(
    "Admin commands:\n" +
      "/users — list authorized users\n" +
      "/adduser <id> <name> — add user manually\n" +
      "/revoke <id> — revoke access\n" +
      "/log — last 20 events",
  );
});

bot.callbackQuery("request-access", handleRequestAccess);
bot.callbackQuery(/^approve:(\d+)$/, handleApprove);
bot.callbackQuery(/^deny:(\d+)$/, handleDeny);

bot.catch((err) => {
  console.error("Bot error:", err);
});

await bot.api.setMyCommands(
  [
    { command: "start", description: "Get started" },
    { command: "open", description: "Open the gate" },
  ],
  { scope: { type: "default" } },
);

try {
  await bot.api.setMyCommands(
    [
      { command: "start", description: "Get started" },
      { command: "open", description: "Open the gate" },
      { command: "users", description: "List authorized users" },
      { command: "adduser", description: "Add a user: <id> <name>" },
      { command: "revoke", description: "Revoke a user: <id>" },
      { command: "gates", description: "List gates on your Palgate account" },
      { command: "log", description: "Last 20 open events" },
    ],
    { scope: { type: "chat", chat_id: config.ADMIN_TELEGRAM_ID } },
  );
} catch (err) {
  // Admin hasn't DM'd the bot yet — Telegram doesn't know the chat exists.
  // Will succeed on next startup after admin sends /start.
  console.warn("Skipping admin-scoped commands:", err instanceof Error ? err.message : err);
}

console.log("Bot started. Listening for updates…");
await bot.start();
