"use client";

import Button from "@components/Button";
import { MoonIcon, SunIcon } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useTheme } from "@/contexts/ThemeProvider";
import { useI18n } from "@/i18n/I18nProvider";

const subscribe = () => () => undefined;

export default function DarkModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useI18n();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  if (!mounted) {
    return <div className="h-[38px] w-[38px]" aria-hidden={true} />;
  }

  const isDark = resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";
  const label = t(
    isDark ? "darkModeToggle.switchToLight" : "darkModeToggle.switchToDark",
  );
  const Icon = isDark ? MoonIcon : SunIcon;

  return (
    <Button
      size={"xs"}
      variant={"default-outline"}
      className={"!rounded-full h-[38px] w-[38px] !p-0"}
      title={label}
      aria-label={label}
      data-testid={"theme-toggle"}
      onClick={() => setTheme(nextTheme)}
    >
      <Icon size={18} />
    </Button>
  );
}
