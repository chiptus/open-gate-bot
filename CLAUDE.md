# open-gate-bot

Telegram bot that opens a Palgate-controlled gate.

## Stack

- Bun + TypeScript
- grammY (Telegram, long polling — no open ports)
- `bun:sqlite` at `${DB_PATH}` (default `/data/bot.db` in container)
- zod for env validation

## Layout

- `src/bot.ts` — grammY setup, command/keyboard wiring, `setMyCommands` per scope
- `src/config.ts` — env vars (zod)
- `src/db.ts` — schema init + typed helpers (`users`, `events`, `access_requests`)
- `src/palgate/token.ts` — AES-128 temporal-token derivation, ported from `RoeiOfri/homebridge-palgate-opener` (GPL-3.0)
- `src/palgate/client.ts` — `openGate()` → GET `api1.pal-es.com/v1/bt/device/{id}/open-gate?outputNum=1` with `x-bt-token` header
- `src/handlers/` — `open`, `admin`, `access` (request flow), `keyboard`
- `src/lib/cooldown.ts` — 10s per-user, in-memory
- `src/lib/adminAlert.ts` — DM admin on Palgate auth failures, 1/hour throttle

## Gotchas

- Palgate `PALGATE_TOKEN` is the **session token** (32 hex chars). The temporal token sent on every request is **derived locally** from it + phone + token_type + current timestamp. Server tolerates ~small clock skew (the port uses a +2s offset).
- Token-type values: `0` SMS, `1` PRIMARY (linked-device first), `2` SECONDARY. The extractor returns one.
- API call is **GET**, header is **`x-bt-token`** (not `x-auth-token`). Don't change to POST.
- Super admin is implicit — never stored in `users` table; check `config.ADMIN_TELEGRAM_ID` directly.
- Cooldown map is in-memory only; resets on container restart (intentional).

## Run

```bash
direnv allow              # loads .envrc
bun install
bun run dev               # local
# or
docker compose up --build # containerized
```

## Token extraction (one-time)

See README. Uses `RoeiOfri/homebridge-palgate-opener`'s `pylgate-runner` Docker image + QR scan in Palgate app.
