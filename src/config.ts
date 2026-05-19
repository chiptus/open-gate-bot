import { z } from "zod";

const schema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  ADMIN_TELEGRAM_ID: z.coerce.number().int().positive(),
  GATE_DEVICE_ID: z.string().min(1),
  PALGATE_PHONE: z.coerce.number().int().positive(),
  PALGATE_TOKEN: z.string().regex(/^[0-9a-fA-F]{32}$/, "PALGATE_TOKEN must be 32 hex chars"),
  PALGATE_TOKEN_TYPE: z.coerce.number().int().refine((n) => n === 0 || n === 1 || n === 2, {
    message: "PALGATE_TOKEN_TYPE must be 0, 1, or 2",
  }),
  DB_PATH: z.string().default("/data/bot.db"),
  DEFAULT_LOCALE: z.enum(["en", "he"]).default("en"),
});

export type Config = z.infer<typeof schema>;

export const config: Config = schema.parse(process.env);
