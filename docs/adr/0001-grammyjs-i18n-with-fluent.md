# ADR 0001: Use @grammyjs/i18n with Fluent for internationalisation

Date: 2026-05-18

## Status

Accepted

## Context

The bot's primary users speak Hebrew; the operator (super admin) reads English fine but lives in the same Hebrew-speaking deployment. We need translated UI for ~15–25 strings (welcome, open replies, errors, keyboard labels, BotFather command descriptions).

Two viable approaches:

- **Flat JSON + small DIY `t()` helper.** No new deps, minimal code, type-safe via `keyof typeof en`.
- **`@grammyjs/i18n` with Fluent `.ftl` files.** Official grammY plugin, ~250 kB, supports plurals/selectors/genders, exposes `ctx.t()`.

For 15 strings without plurals or grammatical-gender selection (we deliberately phrase neutrally), JSON would suffice. We chose Fluent anyway.

## Decision

Use **`@grammyjs/i18n` with Fluent** as the i18n layer.

## Consequences

### Positive

- Hebrew gendered/plural forms remain available without library swap if we ever need them ("אתה מורשה" vs "את מורשית").
- `ctx.t("key")` integrates with grammY's middleware chain — no manual `t(key, locale)` plumbing at call sites.
- `.ftl` syntax handles complex message references and ICU-style placeables out of the box.

### Negative

- ~250 kB of deps for a ~15-string bot. Docker image grows slightly.
- Fluent's `.ftl` syntax is unfamiliar to most JS developers; small learning cost.
- We accept the migration cost (rewrite every `ctx.t()` call site) if we ever change libraries — judged low because all call sites share one helper shape.

### Neutral

- Locale set stays hardcoded as `const LOCALES = ["en", "he"] as const`. Filesystem-scan or env-driven locale lists are explicitly avoided (see CONTEXT.md → Locale).
- Locale preference storage stays in our own `locale_preferences` table, not in `@grammyjs/i18n`'s session-based storage. The plugin is used purely for translation; preference resolution is ours.
