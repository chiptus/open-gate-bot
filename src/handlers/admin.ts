import type { Context } from "grammy";
import { addUser, listActiveUsers, recentEvents, revokeUser } from "../db.ts";
import { config } from "../config.ts";
import { deviceDisplayName, deviceId, listDevices } from "../palgate/client.ts";

export function isAdmin(ctx: Context): boolean {
  return ctx.from?.id === config.ADMIN_TELEGRAM_ID;
}

function requireAdmin(ctx: Context): boolean {
  if (!isAdmin(ctx)) {
    void ctx.reply("Admin only.");
    return false;
  }
  return true;
}

export async function handleAddUser(ctx: Context): Promise<void> {
  if (!requireAdmin(ctx)) return;
  const args = ctx.match?.toString().trim().split(/\s+/) ?? [];
  const idStr = args[0];
  const name = args.slice(1).join(" ");
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0 || !name) {
    await ctx.reply("Usage: /adduser <telegram_id> <name>");
    return;
  }
  addUser(id, name, null, config.ADMIN_TELEGRAM_ID);
  await ctx.reply(`✅ Added ${name} (${id})`);
}

export async function handleRevoke(ctx: Context): Promise<void> {
  if (!requireAdmin(ctx)) return;
  const idStr = ctx.match?.toString().trim();
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    await ctx.reply("Usage: /revoke <telegram_id>");
    return;
  }
  revokeUser(id);
  await ctx.reply(`🚫 Revoked ${id}`);
}

export async function handleUsers(ctx: Context): Promise<void> {
  if (!requireAdmin(ctx)) return;
  const users = listActiveUsers();
  if (users.length === 0) {
    await ctx.reply("No authorized users (other than you).");
    return;
  }
  const lines = users.map((u) => `• ${u.name} — \`${u.telegram_id}\`${u.username ? ` (@${u.username})` : ""}`);
  await ctx.reply(`Authorized users:\n${lines.join("\n")}`, { parse_mode: "Markdown" });
}

export async function handleGates(ctx: Context): Promise<void> {
  if (!requireAdmin(ctx)) return;
  try {
    const devices = await listDevices();
    if (devices.length === 0) {
      await ctx.reply("No gates returned by Palgate.");
      return;
    }
    const lines = devices.map((d) => {
      const id = deviceId(d);
      const marker = id === config.GATE_DEVICE_ID ? " ← configured" : "";
      const status: string[] = [];
      if (d.output1Disabled !== undefined) {
        status.push(d.output1Disabled ? "🔓 latched open" : "🔒 closed (openable)");
      }
      if (d.simStatus && d.simStatus !== "activated") status.push(`SIM: ${d.simStatus}`);
      if (d.validUntil) status.push(`valid until ${d.validUntil.slice(0, 10)}`);
      const statusLine = status.length ? `\n  ${status.join(" · ")}` : "";
      return `• ${deviceDisplayName(d)}${marker}\n  \`${id}\`${statusLine}`;
    });
    await ctx.reply(`Gates on your Palgate account:\n\n${lines.join("\n")}`, {
      parse_mode: "Markdown",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await ctx.reply(`Failed to list gates: ${msg}`);
  }
}

export async function handleLog(ctx: Context): Promise<void> {
  if (!requireAdmin(ctx)) return;
  const events = recentEvents(20);
  if (events.length === 0) {
    await ctx.reply("No events yet.");
    return;
  }
  const lines = events.map((e) => {
    const when = new Date(e.ts * 1000).toISOString().replace("T", " ").slice(0, 19);
    const flag = e.success ? "✅" : "❌";
    return `${flag} ${when} — ${e.telegram_id}${e.error ? ` — ${e.error}` : ""}`;
  });
  await ctx.reply(lines.join("\n"));
}
