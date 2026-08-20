"use client";

import "dayjs/locale/zh-cn";
import dayjs from "dayjs";
import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  defaultLocale,
  Locale,
  locales,
  messages,
} from "./messages";

type TranslationValues = Record<string, unknown>;

type I18nContextValue = {
  locale: Locale;
  locales: readonly Locale[];
  setLocale: (locale: Locale) => void;
  t: (key: string, values?: TranslationValues) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function interpolate(template: string, values?: TranslationValues): string {
  if (!values) return template;

  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = values[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}

export function I18nProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [locale, setLocale] = useLocalStorage<Locale>(
    "netbird-locale",
    defaultLocale,
  );
  const activeLocale = locales.includes(locale) ? locale : defaultLocale;

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = activeLocale;
    dayjs.locale(activeLocale === "zh-CN" ? "zh-cn" : "en");
  }, [activeLocale]);

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale: activeLocale,
      locales,
      setLocale,
      t: (key, values) => {
        const localeMessages = messages[activeLocale] as Record<string, string>;
        const enMessages = messages.en as Record<string, string>;
        const message = localeMessages[key] ?? enMessages[key] ?? key;
        return interpolate(message, values);
      },
    };
  }, [activeLocale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}
