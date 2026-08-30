import type { Api } from "grammy";
import { InlineKeyboard } from "grammy";
import type { User } from "grammy/types";
import { getAccessRequest, upsertAccessRequest } from "../db.ts";
import { config } from "../config.ts";
import { i18n, resolveLocaleFor } from "../i18n.ts";
import { hasGateAccess } from "./access.ts";
import { escapeMarkdown } from "./markdown.ts";

function displayName(from: User): string {
  return (
    [from.first_name, from.last_name].filter(Boolean).join(" ") ||
    from.username ||
    String(from.id)
  );
}

async function notifyAdminOfRequest(
  api: Api,
  userId: number,
  name: string,
  username: string | null,
): Promise<void> {
  const adminLocale = resolveLocaleFor(config.ADMIN_TELEGRAM_ID);
  const usernameLine = username
    ? i18n.t(adminLocale, "access-username-line", {
        username: escapeMarkdown(username),
      }) + "\n"
    : "";
  const adminMsg = i18n.t(adminLocale, "access-admin-dm", {
    name: escapeMarkdown(name),
    id: String(userId),
    usernameLine,
  });

  await api.sendMessage(config.ADMIN_TELEGRAM_ID, adminMsg, {
    parse_mode: "Markdown",
    reply_markup: new InlineKeyboard()
      .text(i18n.t(adminLocale, "button-approve"), `approve:${userId}`)
      .text(i18n.t(adminLocale, "button-deny"), `deny:${userId}`),
  });
}

/**
 * Files (or re-files, e.g. after a denial) an access request for `from`
 * and DMs the admin — without requiring the explicit "Request access" tap.
 */
export async function ensureAccessRequested(
  api: Api,
  from: User | undefined,
): Promise<"already" | "pending" | "sent"> {
  if (!from) return "sent";
  const userId = from.id;

  if (hasGateAccess(userId)) return "already";

  const existing = getAccessRequest(userId);
  if (existing?.status === "pending") return "pending";

  const name = displayName(from);
  const username = from.username ?? null;
  upsertAccessRequest(userId, name, username);
  await notifyAdminOfRequest(api, userId, name, username);
  return "sent";
}
