import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { config } from "./config.ts";

mkdirSync(dirname(config.DB_PATH), { recursive: true });

export const db = new Database(config.DB_PATH);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    telegram_id INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,
    username    TEXT,
    is_active   INTEGER NOT NULL DEFAULT 1,
    added_at    INTEGER NOT NULL,
    added_by    INTEGER
  );

  CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER NOT NULL,
    ts          INTEGER NOT NULL,
    success     INTEGER NOT NULL,
    error       TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts DESC);

  CREATE TABLE IF NOT EXISTS access_requests (
    telegram_id  INTEGER PRIMARY KEY,
    name         TEXT NOT NULL,
    username     TEXT,
    requested_at INTEGER NOT NULL,
    status       TEXT NOT NULL DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS locale_preferences (
    telegram_id INTEGER PRIMARY KEY,
    locale      TEXT NOT NULL
  );
`);

export type UserRow = {
  telegram_id: number;
  name: string;
  username: string | null;
  is_active: number;
  added_at: number;
  added_by: number | null;
};

export type EventRow = {
  id: number;
  telegram_id: number;
  ts: number;
  success: number;
  error: string | null;
};

export type AccessRequestRow = {
  telegram_id: number;
  name: string;
  username: string | null;
  requested_at: number;
  status: "pending" | "approved" | "denied";
};

const stmts = {
  getUser: db.query<UserRow, [number]>("SELECT * FROM users WHERE telegram_id = ?"),
  listActiveUsers: db.query<UserRow, []>("SELECT * FROM users WHERE is_active = 1 ORDER BY added_at DESC"),
  upsertUser: db.query<
    null,
    [number, string, string | null, number, number]
  >(`INSERT INTO users (telegram_id, name, username, added_at, added_by)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(telegram_id) DO UPDATE SET
       name = excluded.name,
       username = excluded.username,
       is_active = 1`),
  revokeUser: db.query<null, [number]>("UPDATE users SET is_active = 0 WHERE telegram_id = ?"),

  logEvent: db.query<null, [number, number, number, string | null]>(
    "INSERT INTO events (telegram_id, ts, success, error) VALUES (?, ?, ?, ?)",
  ),
  recentEvents: db.query<EventRow, [number]>("SELECT * FROM events ORDER BY ts DESC LIMIT ?"),

  getRequest: db.query<AccessRequestRow, [number]>("SELECT * FROM access_requests WHERE telegram_id = ?"),
  upsertRequest: db.query<null, [number, string, string | null, number]>(
    `INSERT INTO access_requests (telegram_id, name, username, requested_at, status)
     VALUES (?, ?, ?, ?, 'pending')
     ON CONFLICT(telegram_id) DO UPDATE SET
       name = excluded.name,
       username = excluded.username,
       requested_at = excluded.requested_at,
       status = 'pending'`,
  ),
  setRequestStatus: db.query<null, [string, number]>(
    "UPDATE access_requests SET status = ? WHERE telegram_id = ?",
  ),
};

export function getUser(telegramId: number): UserRow | null {
  return stmts.getUser.get(telegramId);
}

export function isAuthorized(telegramId: number): boolean {
  const u = stmts.getUser.get(telegramId);
  return !!u && u.is_active === 1;
}

export function listActiveUsers(): UserRow[] {
  return stmts.listActiveUsers.all();
}

export function addUser(
  telegramId: number,
  name: string,
  username: string | null,
  addedBy: number,
): void {
  stmts.upsertUser.run(telegramId, name, username, Math.floor(Date.now() / 1000), addedBy);
}

export function revokeUser(telegramId: number): void {
  stmts.revokeUser.run(telegramId);
}

export function logEvent(telegramId: number, success: boolean, error: string | null = null): void {
  stmts.logEvent.run(telegramId, Math.floor(Date.now() / 1000), success ? 1 : 0, error);
}

export function recentEvents(limit = 20): EventRow[] {
  return stmts.recentEvents.all(limit);
}

export function getAccessRequest(telegramId: number): AccessRequestRow | null {
  return stmts.getRequest.get(telegramId);
}

export function upsertAccessRequest(
  telegramId: number,
  name: string,
  username: string | null,
): void {
  stmts.upsertRequest.run(telegramId, name, username, Math.floor(Date.now() / 1000));
}

export function setRequestStatus(telegramId: number, status: "approved" | "denied"): void {
  stmts.setRequestStatus.run(status, telegramId);
}

const localeStmts = {
  get: db.query<{ locale: string }, [number]>(
    "SELECT locale FROM locale_preferences WHERE telegram_id = ?",
  ),
  upsert: db.query<null, [number, string]>(
    `INSERT INTO locale_preferences (telegram_id, locale) VALUES (?, ?)
     ON CONFLICT(telegram_id) DO UPDATE SET locale = excluded.locale`,
  ),
};

export function getLocale(telegramId: number): string | null {
  return localeStmts.get.get(telegramId)?.locale ?? null;
}

export function setLocale(telegramId: number, locale: string): void {
  localeStmts.upsert.run(telegramId, locale);
}
