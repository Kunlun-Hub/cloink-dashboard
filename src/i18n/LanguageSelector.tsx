"use client";

import {
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@components/DropdownMenu";
import { CheckIcon, GlobeIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select";
import { useI18n } from "./I18nProvider";
import { Locale, locales } from "./messages";

const languageMessageKeys = {
  en: "common.language.en",
  "zh-CN": "common.language.zh-CN",
} as const;

/**
 * Language control for the account menu. Keeping this next to the existing
 * settings selector makes both entry points use the same locale state and
 * translations if another compact layout needs one in the future.
 */
export function LanguageMenuItem({
  onLocaleChange,
}: {
  onLocaleChange?: () => void;
}) {
  const { locale, setLocale, t } = useI18n();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        className="gap-3"
        aria-label={t("common.language")}
      >
        <GlobeIcon size={14} aria-hidden="true" />
        <span>{t("common.language")}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="w-40">
          {locales.map((code) => {
            const selected = locale === code;

            return (
              <DropdownMenuItem
                key={code}
                role="menuitemradio"
                aria-checked={selected}
                closeOnSelect
                onSelect={() => {
                  setLocale(code);
                  onLocaleChange?.();
                }}
                className="gap-2"
              >
                <span>{t(languageMessageKeys[code])}</span>
                {selected && (
                  <CheckIcon
                    size={14}
                    className="ml-auto"
                    aria-label={t("common.selected")}
                  />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}

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
              {t(languageMessageKeys[code])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
