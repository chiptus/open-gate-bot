import { Keyboard } from "grammy";
import type { BotContext } from "../i18n.ts";

type TFn = BotContext["t"];

export function userKeyboard(t: TFn) {
  return new Keyboard().text(t("button-open")).resized().persistent();
}

export function adminKeyboard(t: TFn) {
  return new Keyboard().text(t("button-open")).text(t("button-manage")).resized().persistent();
}
