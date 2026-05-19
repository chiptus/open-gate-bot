import { addUser, listActiveUsers, recentEvents, revokeUser } from "../db.ts";
import { config } from "../config.ts";
import { deviceDisplayName, deviceId, listDevices } from "../palgate/client.ts";
import type { BotContext } from "../i18n.ts";

export function isAdmin(ctx: BotContext): boolean {
  return ctx.from?.id === config.ADMIN_TELEGRAM_ID;
}

function requireAdmin(ctx: BotContext): boolean {
  if (!isAdmin(ctx)) {
    void ctx.reply(ctx.t("admin-only"));
    return false;
  }
  return true;
}

export async function handleAddUser(ctx: BotContext): Promise<void> {
  if (!requireAdmin(ctx)) return;
  const args = ctx.match?.toString().trim().split(/\s+/) ?? [];
  const idStr = args[0];
  const name = args.slice(1).join(" ");
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0 || !name) {
    await ctx.reply(ctx.t("adduser-usage"));
    return;
  }
  addUser(id, name, null, config.ADMIN_TELEGRAM_ID);
  await ctx.reply(ctx.t("adduser-ok", { name, id }));
}

export async function handleRevoke(ctx: BotContext): Promise<void> {
  if (!requireAdmin(ctx)) return;
  const idStr = ctx.match?.toString().trim();
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    await ctx.reply(ctx.t("revoke-usage"));
    return;
  }
  revokeUser(id);
  await ctx.reply(ctx.t("revoke-ok", { id }));
}

export async function handleUsers(ctx: BotContext): Promise<void> {
  if (!requireAdmin(ctx)) return;
  const users = listActiveUsers();
  if (users.length === 0) {
    await ctx.reply(ctx.t("users-empty"));
    return;
  }
  const lines = users.map(
    (u) => `• ${u.name} — \`${u.telegram_id}\`${u.username ? ` (@${u.username})` : ""}`,
  );
  await ctx.reply(`${ctx.t("users-header")}\n${lines.join("\n")}`, { parse_mode: "Markdown" });
}

export async function handleGates(ctx: BotContext): Promise<void> {
  if (!requireAdmin(ctx)) return;
  try {
    const devices = await listDevices();
    if (devices.length === 0) {
      await ctx.reply(ctx.t("gates-empty"));
      return;
    }
    const lines = devices.map((d) => {
      const id = deviceId(d);
      const marker = id === config.GATE_DEVICE_ID ? ` ${ctx.t("gates-marker-configured")}` : "";
      const status: string[] = [];
      if (d.output1Disabled !== undefined) {
        status.push(
          d.output1Disabled ? ctx.t("gates-status-latched-open") : ctx.t("gates-status-closed"),
        );
      }
      if (d.simStatus && d.simStatus !== "activated") {
        status.push(ctx.t("gates-status-sim", { status: d.simStatus }));
      }
      if (d.validUntil) {
        status.push(ctx.t("gates-status-valid-until", { date: d.validUntil.slice(0, 10) }));
      }
      const statusLine = status.length ? `\n  ${status.join(" · ")}` : "";
      return `• ${deviceDisplayName(d)}${marker}\n  \`${id}\`${statusLine}`;
    });
    await ctx.reply(`${ctx.t("gates-header")}\n\n${lines.join("\n")}`, { parse_mode: "Markdown" });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    await ctx.reply(ctx.t("gates-failed", { reason }));
  }
}

export async function handleLog(ctx: BotContext): Promise<void> {
  if (!requireAdmin(ctx)) return;
  const events = recentEvents(20);
  if (events.length === 0) {
    await ctx.reply(ctx.t("log-empty"));
    return;
  }
  const lines = events.map((e) => {
    const when = new Date(e.ts * 1000).toISOString().replace("T", " ").slice(0, 19);
    const flag = e.success ? "✅" : "❌";
    return `${flag} ${when} — ${e.telegram_id}${e.error ? ` — ${e.error}` : ""}`;
  });
  await ctx.reply(lines.join("\n"));
}
