# open-gate-bot

A self-hosted Telegram bot that opens a Palgate-controlled gate. Approved users tap a button in the chat; the bot fires the open command. No open ports — uses Telegram long polling, so it sits safely behind your home router.

## Features

- 🚪 Open the gate with one tap (reply keyboard) or `/open`
- 👥 RBAC — super admin via env var; approved users stored in SQLite
- 📥 Self-serve onboarding — non-authorized users tap "Request access"; you get a Telegram DM with Approve/Deny buttons
- 📋 Audit log of every open attempt
- ⏱️ Per-user 10s cooldown (no finger-spam)
- 🔔 Admin DM alert when the Palgate token gets rejected

## Prerequisites

- [Bun](https://bun.sh) (only if running outside Docker)
- [Docker](https://www.docker.com/) + Docker Compose (recommended via [OrbStack](https://orbstack.dev/))
- [direnv](https://direnv.net/) for loading `.envrc`
- A Palgate account that controls the gate, with the **mobile app installed** on your phone (for one-time device-linking)

You'll also collect three IDs during setup (steps below): a Telegram bot token, your Telegram user ID, and your Palgate gate device ID.

## Setup

### 1. Create a Telegram bot

1. Open Telegram, message [@BotFather](https://t.me/BotFather).
2. Send `/newbot`.
3. Pick a display name (e.g. "Village Gate") and a username ending in `bot` (e.g. `mygate_bot`).
4. BotFather replies with a token like `7891234567:AAH-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`. Save it as `TELEGRAM_BOT_TOKEN`.

### 2. Get your Telegram user ID

DM [@userinfobot](https://t.me/userinfobot) — it replies with your numeric ID. Save it as `ADMIN_TELEGRAM_ID`. (Alternative: [@RawDataBot](https://t.me/RawDataBot), look at `message.from.id`.)

### 3. Extract your Palgate credentials (one-time)

The bot needs three Palgate values: phone number, session token (32 hex chars), and token type (1 or 2). Use [RoeiOfri/homebridge-palgate-opener](https://github.com/RoeiOfri/homebridge-palgate-opener)'s Docker utility:

```bash
git clone https://github.com/RoeiOfri/homebridge-palgate-opener
cd homebridge-palgate-opener/extraction_tool   # or wherever the Dockerfile lives
docker build -t pylgate-runner .
docker run -it pylgate-runner
```

A QR code appears in your terminal. In the Palgate mobile app: **Menu → Device linking → Link a device** → scan. The tool prints:

```
Phone number (user id): <number>
Session token: <32 hex chars>
Token type: 1 (TokenType.PRIMARY)
```

Save these — you'll paste them into `.envrc` next.

### 4. Find your gate device ID

The extractor above usually prints your gates' IDs alongside the token. If not, query Palgate directly with the session token you just got:

```bash
curl -H "x-bt-user-token: <YOUR_SESSION_TOKEN>" https://api1.pal-es.com/v1/bt/devices/
```

The response JSON lists each gate with an `_id` field. Pick the gate you want this bot to open (probably the main entrance) and save its `_id` as `GATE_DEVICE_ID`.

### 5. Configure this bot

```bash
git clone <this repo>
cd open-gate-bot
cp .envrc.example .envrc
$EDITOR .envrc
direnv allow
```

`.envrc` needs:

```bash
export TELEGRAM_BOT_TOKEN=...        # from @BotFather
export ADMIN_TELEGRAM_ID=...         # your numeric Telegram ID

export GATE_DEVICE_ID=...            # your Palgate device ID
export PALGATE_PHONE=...             # from extractor
export PALGATE_TOKEN=...             # from extractor (32 hex)
export PALGATE_TOKEN_TYPE=1          # from extractor (1=primary, 2=secondary)

export DB_PATH=./data/bot.db         # in container, /data/bot.db
```

### 6. Run

```bash
docker compose up --build -d
docker compose logs -f
```

Open Telegram, find your bot, send `/start`. As the admin, you'll see the "🚪 Open Gate" + "👥 Manage Users" keyboard immediately.

## Usage

### Users

- `/start` — get the open-gate keyboard (if authorized) or request access (if not)
- `/open` or tap **🚪 Open Gate** — opens the gate

### Admin (you)

- `/users` — list authorized users
- `/adduser <telegram_id> <name>` — add a user manually
- `/revoke <telegram_id>` — revoke access (history preserved)
- `/log` — last 20 open events
- When someone requests access, the bot DMs you with **Approve** / **Deny** buttons — one tap

## Data

SQLite database at `./data/bot.db` (mounted into the container at `/data`). Three tables: `users`, `events`, `access_requests`. Survives container restarts/rebuilds.

## Updating the Palgate token

Linked-device tokens are long-lived but not eternal. If the bot starts replying "admin notified," re-run the extractor (step 1), update `PALGATE_TOKEN` in `.envrc`, and `docker compose up -d --force-recreate`.

## Credit

- Palgate API + token derivation reverse-engineered by [DonutByte/pylgate](https://github.com/DonutByte/pylgate)
- JavaScript port by [RoeiOfri/homebridge-palgate-opener](https://github.com/RoeiOfri/homebridge-palgate-opener) — this project ports their `token_generator.js` to TypeScript (GPL-3.0)
