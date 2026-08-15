import en from "./locales/en";
import zhCN from "./locales/zh-CN";

export const locales = ["en", "zh-CN"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "zh-CN";

export const messages = {
  en,
  "zh-CN": zhCN,
} as const;

export type MessageKey = keyof (typeof messages)["en"];
