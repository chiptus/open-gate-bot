import { Bot } from "grammy";
import { hears } from "@grammyjs/i18n";
import { config } from "./config.ts";
import { type BotContext, i18n } from "./i18n.ts";
import { checkToken, PalgateAuthError } from "./palgate/client.ts";
import { startTokenWatcher } from "./lib/tokenWatcher.ts";
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
import { handleLang, handleLangCallback } from "./handlers/lang.ts";
import { loadGateInfo } from "./lib/gateInfo.ts";

const bot = new Bot<BotContext>(config.TELEGRAM_BOT_TOKEN);

bot.use(i18n);

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
bot.command("lang", handleLang);
bot.command("adduser", handleAddUser);
bot.command("revoke", handleRevoke);
bot.command("users", handleUsers);
bot.command("gates", handleGates);
bot.command("log", handleLog);

// Match the reply-keyboard buttons across all locales via i18n's hears() filter.
bot.filter(hears("button-open"), handleOpen);
bot.filter(hears("button-manage"), async (ctx) => {
  if (ctx.from?.id !== config.ADMIN_TELEGRAM_ID) return;
  await ctx.reply(ctx.t("admin-manage-help"));
});

bot.callbackQuery("request-access", handleRequestAccess);
bot.callbackQuery(/^approve:(\d+)$/, handleApprove);
bot.callbackQuery(/^deny:(\d+)$/, handleDeny);
bot.callbackQuery(/^setlang:(\w+)$/, handleLangCallback);

bot.catch((err) => {
  console.error("Bot error:", err);
});

await loadGateInfo();

await bot.api.setMyCommands(
  [
    { command: "start", description: "Get started" },
    { command: "open", description: "Open the gate" },
    { command: "lang", description: "Change your language" },
  ],
  { scope: { type: "default" } },
);

try {
  await bot.api.setMyCommands(
    [
      { command: "start", description: "Get started" },
      { command: "open", description: "Open the gate" },
      { command: "lang", description: "Change your language" },
      { command: "users", description: "List authorized users" },
      { command: "adduser", description: "Add a user: <id> <name>" },
      { command: "revoke", description: "Revoke a user: <id>" },
      { command: "gates", description: "List gates on your Palgate account" },
      { command: "log", description: "Last 20 open events" },
    ],
    { scope: { type: "chat", chat_id: config.ADMIN_TELEGRAM_ID } },
  );
} catch (err) {
  console.warn("Skipping admin-scoped commands:", err instanceof Error ? err.message : err);
}

try {
  await checkToken();
  console.log("Palgate token OK.");
} catch (err) {
  if (err instanceof PalgateAuthError) {
    console.error(
      `Palgate token rejected at startup (HTTP ${err.status}). ` +
        `Re-run the token extractor and update PALGATE_TOKEN.`,
    );
  } else {
    console.warn("Palgate token check failed (non-auth):", err instanceof Error ? err.message : err);
  }
}

startTokenWatcher(bot.api);

console.log("Bot started. Listening for updates…");
await bot.start();
