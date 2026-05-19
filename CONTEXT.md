# Domain Glossary

A glossary, not a spec. Terms only; implementation details belong in code/ADRs.

## Authorization

**Super admin** — the single Telegram user identified by `ADMIN_TELEGRAM_ID`. Implicit: never stored in the `users` table. All admin commands check `ctx.from.id === ADMIN_TELEGRAM_ID` directly.

**Authorized user** — a row in `users` with `is_active = 1`. Can open the gate. Approved by the super admin via the access-request flow.

**Access request** — a non-authorized user's request to be added. Lives in `access_requests` until approved or denied. Approve/Deny are inline buttons on the admin DM. Approved requests become rows in `users`.

## Locale

**Locale** — one of a small hardcoded set: `"en" | "he"`. Source of truth: `const LOCALES = ["en", "he"] as const`. Adding a language = one line plus a new `.ftl` file.

**Locale preference** — a UI display setting, separate from authorization. Stored in `locale_preferences(telegram_id, locale)`. Anyone may set their own preference via `/lang`, including unauthorized users mid-onboarding. Does **not** imply authorization.

**Locale negotiation** — resolution order when picking which locale to render for a caller:
1. Stored preference in `locale_preferences` (if any)
2. `ctx.from.language_code` from Telegram (normalised: `iw` → `he`, region suffix stripped)
3. `DEFAULT_LOCALE` env var
4. `"en"` hardcoded fallback

For callers without a `ctx` (e.g. `tokenWatcher` cron tick), only steps 1, 3, 4 apply against the super admin's stored preference.

**Default locale** — `DEFAULT_LOCALE` env var. Ships as `he` (the bot's primary deployment is a Hebrew-speaking village).

## Gate

**Gate** — a Palgate-controlled physical barrier. Identified by `_id` (list endpoint) or `id` (single-device endpoint). The bot is configured for exactly one via `GATE_DEVICE_ID`.

**Output** — a Palgate device has one or more outputs (relays). We always use `outputNum=1`. A Palgate `output1Disabled: true` field on a device indicates the gate is currently latched open by schedule (e.g. during daytime) — open commands will be rejected.

**Configured gate** — the one device targeted by `GATE_DEVICE_ID`. `/gates` lists all gates on the account and marks this one.

**Temporal token** — a one-shot AES-derived token sent in `x-bt-token`. Generated locally per request from the long-lived session token + phone number + token type + current timestamp. Not stored.

**Session token** — the long-lived 32-hex string from `PALGATE_TOKEN`, obtained once via the device-linking handshake. Server-reported expiry lives in `validUntil` on the device details.

## Events

**Event** — a row in `events` recording one open attempt: who, when, success/failure, error text if any. Audit log only; no Palgate-side equivalent exists.
