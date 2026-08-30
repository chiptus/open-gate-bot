import type { CommandContext } from "grammy";
import type { BotContext } from "../i18n.ts";
import { gitBranch, gitCommit } from "../version.ts";

export async function handleVersion(
  ctx: CommandContext<BotContext>,
): Promise<void> {
  await ctx.reply(
    ctx.t("version-info", { branch: gitBranch, commit: gitCommit }),
  );
}
