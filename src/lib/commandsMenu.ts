import type { Api } from "grammy";
import { LOCALES, i18n, resolveLocaleFor, type Locale } from "../i18n.ts";
import { config } from "../config.ts";

const DEFAULT_COMMANDS = [
  { command: "start", key: "cmd-start" },
  { command: "open", key: "cmd-open" },
  { command: "lang", key: "cmd-lang" },
] as const;

const ADMIN_COMMANDS = [
  ...DEFAULT_COMMANDS,
  { command: "users", key: "cmd-users" },
  { command: "adduser", key: "cmd-adduser" },
  { command: "revoke", key: "cmd-revoke" },
  { command: "gates", key: "cmd-gates" },
  { command: "log", key: "cmd-log" },
] as const;

function buildCommands(specs: readonly { command: string; key: string }[], locale: Locale) {
  return specs.map(({ command, key }) => ({
    command,
    description: i18n.t(locale, key),
  }));
}

/** Default-scope menus per language_code. Set once at boot. */
export async function setDefaultCommands(api: Api): Promise<void> {
  // Fallback for any language we don't have a catalogue for.
  await api.setMyCommands(buildCommands(DEFAULT_COMMANDS, config.DEFAULT_LOCALE), {
    scope: { type: "default" },
  });
  for (const locale of LOCALES) {
    await api.setMyCommands(buildCommands(DEFAULT_COMMANDS, locale), {
      scope: { type: "default" },
      language_code: locale,
    });
  }
}

/**
 * Admin chat-scope menu. Best-effort: fails until the admin has DM'd the bot
 * (Telegram requires the chat to exist). Call again whenever admin's locale
 * changes via /lang.
 */
export async function setAdminCommands(api: Api): Promise<void> {
  const locale = resolveLocaleFor(config.ADMIN_TELEGRAM_ID);
  try {
    await api.setMyCommands(buildCommands(ADMIN_COMMANDS, locale), {
      scope: { type: "chat", chat_id: config.ADMIN_TELEGRAM_ID },
    });
  } catch (err) {
    console.warn("Skipping admin-scoped commands:", err instanceof Error ? err.message : err);
  }
}
