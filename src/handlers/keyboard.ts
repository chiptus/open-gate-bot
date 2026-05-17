import { Keyboard } from "grammy";

export const OPEN_BUTTON = "🚪 Open Gate";
export const MANAGE_BUTTON = "👥 Manage Users";

export function userKeyboard() {
  return new Keyboard().text(OPEN_BUTTON).resized().persistent();
}

export function adminKeyboard() {
  return new Keyboard().text(OPEN_BUTTON).text(MANAGE_BUTTON).resized().persistent();
}
