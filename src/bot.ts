import { Bot } from "grammy";
import { hears } from "@grammyjs/i18n";
import { config } from "./config.ts";
import { type BotContext, i18n } from "./i18n.ts";
import { checkToken, PalgateAuthError } from "./palgate/client.ts";
import { startTokenWatcher } from "./lib/tokenWatcher.ts";
import { setAdminCommands, setDefaultCommands } from "./lib/commandsMenu.ts";
import { handleOpen } from "./handlers/open.ts";
import {
  handleAddUser,
  handleGates,
  handleLog,
  handleManage,
  handleRevoke,
  handleUsers,
} from "./handlers/admin.ts";
import {
  handleApprove,
  handleDeny,
  handleImplicitAccessRequest,
  handleRequestAccess,
  handleStart,
} from "./handlers/access.ts";
import { handleLang, handleLangCallback } from "./handlers/lang.ts";
import { handleVersion } from "./handlers/version.ts";
import { loadGateInfo } from "./lib/gateInfo.ts";
import { requireAdmin, requireGateAccess } from "./middleware/access.ts";

const bot = new Bot<BotContext>(config.TELEGRAM_BOT_TOKEN);

bot.use(i18n);

bot.use(async (ctx, next) => {
  const from = ctx.from;
  const who = from
    ? `${from.id}${from.username ? ` @${from.username}` : ""}`
    : "?";
  const what =
    ctx.message?.text ?? ctx.callbackQuery?.data ?? ctx.update.update_id;
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
bot.command("open", requireGateAccess, handleOpen);
bot.command("lang", handleLang);
bot.command("version", handleVersion);
bot.command("adduser", requireAdmin, handleAddUser);
bot.command("revoke", requireAdmin, handleRevoke);
bot.command("users", requireAdmin, handleUsers);
bot.command("gates", requireAdmin, handleGates);
bot.command("log", requireAdmin, handleLog);

// Match the reply-keyboard buttons across all locales via i18n's hears() filter.
bot.filter(hears("button-open"), requireGateAccess, handleOpen);
bot.filter(hears("button-manage"), requireAdmin, handleManage);

bot.callbackQuery("request-access", handleRequestAccess);
bot.callbackQuery(/^approve:(\d+)$/, requireAdmin, handleApprove);
bot.callbackQuery(/^deny:(\d+)$/, requireAdmin, handleDeny);
bot.callbackQuery(/^setlang:(\w+)$/, handleLangCallback);

// Any other text (unmatched commands, "hi", etc.) from an unauthorized user
// files an access request, same as tapping "Request access".
bot.on("message:text", handleImplicitAccessRequest);

bot.catch((err) => {
  console.error("Bot error:", err);
});

await loadGateInfo();

await setDefaultCommands(bot.api);
await setAdminCommands(bot.api);

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
    console.warn(
      "Palgate token check failed (non-auth):",
      err instanceof Error ? err.message : err,
    );
  }
}

startTokenWatcher(bot.api);

console.log("Bot started. Listening for updates…");
await bot.start();
