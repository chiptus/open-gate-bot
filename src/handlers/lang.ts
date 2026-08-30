import { InlineKeyboard } from "grammy";
import type { CallbackQueryContext, CommandContext } from "grammy";
import type { BotContext } from "../i18n.ts";
import { LOCALES, normaliseLocale, type Locale } from "../i18n.ts";
import { setLocale } from "../db.ts";
import { config } from "../config.ts";
import { setAdminCommands } from "../lib/commandsMenu.ts";

const LABEL: Record<Locale, string> = {
  en: "🇬🇧 English",
  he: "🇮🇱 עברית",
};

function picker() {
  const kb = new InlineKeyboard();
  for (const loc of LOCALES) kb.text(LABEL[loc], `setlang:${loc}`);
  return kb;
}

export async function handleLang(
  ctx: CommandContext<BotContext>,
): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  const arg = ctx.match?.toString().trim().toLowerCase();
  const requested = normaliseLocale(arg || undefined);

  if (!requested) {
    await ctx.reply("Choose your language / בחר שפה:", {
      reply_markup: picker(),
    });
    return;
  }

  setLocale(userId, requested);
  await ctx.i18n.renegotiateLocale();
  if (userId === config.ADMIN_TELEGRAM_ID) await setAdminCommands(ctx.api);
  await ctx.reply(`✅ ${LABEL[requested]}`);
}

export async function handleLangCallback(
  ctx: CallbackQueryContext<BotContext>,
): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  const requested = normaliseLocale(ctx.match?.[1]);
  if (!requested) {
    await ctx.answerCallbackQuery("Unknown language.");
    return;
  }

  setLocale(userId, requested);
  await ctx.i18n.renegotiateLocale();
  if (userId === config.ADMIN_TELEGRAM_ID) await setAdminCommands(ctx.api);
  await ctx.editMessageText(`✅ ${LABEL[requested]}`);
  await ctx.answerCallbackQuery();
}
