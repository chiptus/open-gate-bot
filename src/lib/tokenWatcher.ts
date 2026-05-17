import type { Api } from "grammy";
import { checkToken, PalgateAuthError } from "../palgate/client.ts";
import { alertAdmin } from "./adminAlert.ts";

const INTERVAL_MS = 24 * 60 * 60 * 1000;

export function startTokenWatcher(api: Api): void {
  const tick = async () => {
    try {
      await checkToken();
      console.log("[tokenWatcher] Palgate token OK.");
    } catch (err) {
      if (err instanceof PalgateAuthError) {
        console.error(`[tokenWatcher] Palgate token rejected (HTTP ${err.status}).`);
        await alertAdmin(
          api,
          "palgate-auth",
          `Palgate token rejected on daily check (HTTP ${err.status}). ` +
            `Re-run the token extractor and update PALGATE_TOKEN before users notice.`,
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
