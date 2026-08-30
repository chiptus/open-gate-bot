/**
 * Escapes legacy Telegram Markdown (parse_mode "Markdown") special characters
 * in user-controlled text (names, usernames) so a stray `_`, `*`, `` ` ``, or
 * `[` can't leave an entity unclosed and make `sendMessage`/`editMessageText`
 * fail with "can't parse entities".
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/([_*`[])/g, "\\$1");
}
