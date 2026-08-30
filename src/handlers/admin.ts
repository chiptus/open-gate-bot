import {
  addUser,
  getUserByUsername,
  listActiveUsers,
  recentEvents,
  revokeUser,
} from "../db.ts";
import { config } from "../config.ts";
import { deviceDisplayName, deviceId, listDevices } from "../palgate/client.ts";
import type { BotContext } from "../i18n.ts";
import { escapeMarkdown } from "../lib/markdown.ts";

export async function handleManage(ctx: BotContext): Promise<void> {
  await ctx.reply(ctx.t("admin-manage-help"));
}

export async function handleAddUser(ctx: BotContext): Promise<void> {
  const args = ctx.match?.toString().trim().split(/\s+/) ?? [];
  const first = args[0];

  if (first?.startsWith("@")) {
    const username = first.slice(1);
    const nameOverride = args.slice(1).join(" ");

    let chat: Awaited<ReturnType<typeof ctx.api.getChat>>;
    try {
      chat = await ctx.api.getChat(first);
    } catch {
      await ctx.reply(ctx.t("adduser-username-not-found", { username }));
      return;
    }
    if (chat.type !== "private") {
      await ctx.reply(ctx.t("adduser-username-not-found", { username }));
      return;
    }

    const id = chat.id;
    const resolvedName =
      nameOverride ||
      [chat.first_name, chat.last_name].filter(Boolean).join(" ") ||
      username;
    addUser(
      id,
      resolvedName,
      chat.username ?? username,
      config.ADMIN_TELEGRAM_ID,
    );
    await ctx.reply(
      ctx.t("adduser-ok", { name: resolvedName, id: String(id) }),
    );
    return;
  }

  const idStr = first;
  const name = args.slice(1).join(" ");
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0 || !name) {
    await ctx.reply(ctx.t("adduser-usage"));
    return;
  }
  addUser(id, name, null, config.ADMIN_TELEGRAM_ID);
  await ctx.reply(ctx.t("adduser-ok", { name, id: String(id) }));
}

export async function handleRevoke(ctx: BotContext): Promise<void> {
  const arg = ctx.match?.toString().trim();

  if (arg?.startsWith("@")) {
    const username = arg.slice(1);
    const user = getUserByUsername(username);
    if (!user) {
      await ctx.reply(ctx.t("revoke-username-not-found", { username }));
      return;
    }
    revokeUser(user.telegram_id);
    await ctx.reply(ctx.t("revoke-ok", { id: String(user.telegram_id) }));
    return;
  }

  const id = Number(arg);
  if (!Number.isInteger(id) || id <= 0) {
    await ctx.reply(ctx.t("revoke-usage"));
    return;
  }
  revokeUser(id);
  await ctx.reply(ctx.t("revoke-ok", { id: String(id) }));
}

export async function handleUsers(ctx: BotContext): Promise<void> {
  const users = listActiveUsers();
  if (users.length === 0) {
    await ctx.reply(ctx.t("users-empty"));
    return;
  }
  const lines = users.map(
    (u) =>
      `• ${escapeMarkdown(u.name)} — \`${u.telegram_id}\`${u.username ? ` (@${escapeMarkdown(u.username)})` : ""}`,
  );
  await ctx.reply(`${ctx.t("users-header")}\n${lines.join("\n")}`, {
    parse_mode: "Markdown",
  });
}

export async function handleGates(ctx: BotContext): Promise<void> {
  try {
    const devices = await listDevices();
    if (devices.length === 0) {
      await ctx.reply(ctx.t("gates-empty"));
      return;
    }
    const lines = devices.map((d) => {
      const id = deviceId(d);
      const marker =
        id === config.GATE_DEVICE_ID
          ? ` ${ctx.t("gates-marker-configured")}`
          : "";
      const status: string[] = [];
      if (d.output1Disabled !== undefined) {
        status.push(
          d.output1Disabled
            ? ctx.t("gates-status-latched-open")
            : ctx.t("gates-status-closed"),
        );
      }
      if (d.simStatus && d.simStatus !== "activated") {
        status.push(ctx.t("gates-status-sim", { status: d.simStatus }));
      }
      if (d.validUntil) {
        status.push(
          ctx.t("gates-status-valid-until", {
            date: d.validUntil.slice(0, 10),
          }),
        );
      }
      const statusLine = status.length ? `\n  ${status.join(" · ")}` : "";
      return `• ${escapeMarkdown(deviceDisplayName(d))}${marker}\n  \`${id}\`${statusLine}`;
    });
    await ctx.reply(`${ctx.t("gates-header")}\n\n${lines.join("\n")}`, {
      parse_mode: "Markdown",
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    await ctx.reply(ctx.t("gates-failed", { reason }));
  }
}

export async function handleLog(ctx: BotContext): Promise<void> {
  const events = recentEvents(20);
  if (events.length === 0) {
    await ctx.reply(ctx.t("log-empty"));
    return;
  }
  const lines = events.map((e) => {
    const when = new Date(e.ts * 1000)
      .toISOString()
      .replace("T", " ")
      .slice(0, 19);
    const flag = e.success ? "✅" : "❌";
    return `${flag} ${when} — ${e.telegram_id}${e.error ? ` — ${e.error}` : ""}`;
  });
  await ctx.reply(lines.join("\n"));
}
