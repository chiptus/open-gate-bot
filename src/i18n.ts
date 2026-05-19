import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { I18n, type I18nFlavor } from "@grammyjs/i18n";
import type { Context } from "grammy";
import { config } from "./config.ts";
import { getLocale } from "./db.ts";

export const LOCALES = ["en", "he"] as const;
export type Locale = (typeof LOCALES)[number];

/** Some Telegram clients still emit `iw` instead of `he`. */
const ALIASES: Record<string, Locale> = { iw: "he" };

/** Normalise an arbitrary BCP-47-ish code to one of LOCALES, or null. */
export function normaliseLocale(raw: string | undefined | null): Locale | null {
  if (!raw) return null;
  const two = raw.slice(0, 2).toLowerCase();
  const canonical = ALIASES[two] ?? two;
  return (LOCALES as readonly string[]).includes(canonical) ? (canonical as Locale) : null;
}

/**
 * Resolve a locale for a known telegram_id, with no grammY ctx available.
 * Used by tokenWatcher / alertAdmin when DMing the super admin.
 */
export function resolveLocaleFor(telegramId: number): Locale {
  return normaliseLocale(getLocale(telegramId)) ?? config.DEFAULT_LOCALE;
}

export type BotContext = Context & I18nFlavor;

const here = dirname(fileURLToPath(import.meta.url));

export const i18n = new I18n<BotContext>({
  defaultLocale: config.DEFAULT_LOCALE,
  localeNegotiator: (ctx) => {
    const id = ctx.from?.id;
    if (id !== undefined) {
      const stored = normaliseLocale(getLocale(id));
      if (stored) return stored;
    }
    const fromTelegram = normaliseLocale(ctx.from?.language_code);
    if (fromTelegram) return fromTelegram;
    return config.DEFAULT_LOCALE;
  },
});

i18n.loadLocalesDirSync(resolve(here, "..", "locales"));
