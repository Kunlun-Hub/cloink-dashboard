"use client";

import { cn } from "@utils/helpers";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useSyncExternalStore } from "react";
import { type Theme, useTheme } from "@/contexts/ThemeProvider";
import { useI18n } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/messages";

const OPTIONS: {
  value: Theme;
  labelKey: MessageKey;
  icon: typeof SunIcon;
}[] = [
  { value: "light", labelKey: "darkModeToggle.light", icon: SunIcon },
  { value: "dark", labelKey: "darkModeToggle.dark", icon: MoonIcon },
  { value: "system", labelKey: "darkModeToggle.system", icon: MonitorIcon },
];

const subscribe = () => () => undefined;

export default function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  if (!mounted) return null;

  return (
    <div className="flex items-center justify-between gap-3 py-1.5 pl-3 pr-2 text-sm">
      <span className="text-nb-gray-300">{t("darkModeToggle.theme")}</span>
      <div className="flex items-center gap-1">
        {OPTIONS.map(({ value, labelKey, icon: Icon }) => {
          const label = t(labelKey);
          return (
            <button
              key={value}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={theme === value}
              data-testid={`theme-${value}`}
              onClick={() => setTheme(value)}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                theme === value
                  ? "bg-nb-gray-900 text-nb-gray-100"
                  : "text-nb-gray-400 hover:bg-nb-gray-900 hover:text-nb-gray-100",
              )}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
