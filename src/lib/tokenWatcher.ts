import type { Api } from "grammy";
import { checkToken, PalgateAuthError } from "../palgate/client.ts";
import { alertAdmin } from "./adminAlert.ts";
import { i18n, resolveLocaleFor } from "../i18n.ts";
import { config } from "../config.ts";

const INTERVAL_MS = 24 * 60 * 60 * 1000;

export function startTokenWatcher(api: Api): void {
  const tick = async () => {
    try {
      await checkToken();
      console.log("[tokenWatcher] Palgate token OK.");
    } catch (err) {
      if (err instanceof PalgateAuthError) {
        console.error(
          `[tokenWatcher] Palgate token rejected (HTTP ${err.status}).`,
        );
        const adminLocale = resolveLocaleFor(config.ADMIN_TELEGRAM_ID);
        await alertAdmin(
          api,
          "palgate-auth",
          i18n.t(adminLocale, "alert-palgate-auth-daily", {
            status: err.status,
          }),
        );
      } else {
        console.warn(
          "[tokenWatcher] check failed (non-auth):",
          err instanceof Error ? err.message : err,
        );
      }
    }
  };

  setInterval(tick, INTERVAL_MS).unref();
}
