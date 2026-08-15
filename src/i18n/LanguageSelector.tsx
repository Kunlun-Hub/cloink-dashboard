"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select";
import { useI18n } from "./I18nProvider";
import { Locale, locales } from "./messages";

export function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-nb-gray-400">{t("settings.language")}</span>
      <Select
        value={locale}
        onValueChange={(value) => setLocale(value as Locale)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {locales.map((code) => (
            <SelectItem key={code} value={code}>
              {t(
                `common.language.${code}` as
                  | "common.language.en"
                  | "common.language.zh-CN",
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
