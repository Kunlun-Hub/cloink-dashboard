"use client";

import Button from "@components/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@components/Popover";
import { AbsoluteDateTimeInput } from "@components/ui/AbsoluteDateTimeInput";
import { Calendar } from "@components/ui/Calendar";
import { cn } from "@utils/helpers";
import dayjs from "dayjs";
import { debounce } from "lodash";
import { Calendar as CalendarIcon } from "lucide-react";
import React, { useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { useI18n } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/messages";

interface Props {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  className?: string;
  disabled?: boolean;
}

const defaultRanges = {
  today: {
    from: dayjs().startOf("day").toDate(),
    to: dayjs().endOf("day").toDate(),
  },
  yesterday: {
    from: dayjs().subtract(1, "day").startOf("day").toDate(),
    to: dayjs().subtract(1, "day").endOf("day").toDate(),
  },
  last14Days: {
    from: dayjs().subtract(14, "day").startOf("day").toDate(),
    to: dayjs().endOf("day").toDate(),
  },
  last2Days: {
    from: dayjs().subtract(2, "day").startOf("day").toDate(),
    to: dayjs().endOf("day").toDate(),
  },
  last7Days: {
    from: dayjs().subtract(7, "day").startOf("day").toDate(),
    to: dayjs().endOf("day").toDate(),
  },
  lastMonth: {
    from: dayjs().subtract(1, "month").startOf("day").toDate(),
    to: dayjs().endOf("day").toDate(),
  },
  allTime: {
    from: dayjs("1970-01-01").startOf("day").toDate(),
    to: dayjs().endOf("day").toDate(),
  },
};

const recentRanges = () => ({
  last5Minutes: {
    from: dayjs().subtract(5, "minute").toDate(),
    to: dayjs().toDate(),
  },
  last15Minutes: {
    from: dayjs().subtract(15, "minute").toDate(),
    to: dayjs().toDate(),
  },
  last30Minutes: {
    from: dayjs().subtract(30, "minute").toDate(),
    to: dayjs().toDate(),
  },
  last1Hour: {
    from: dayjs().subtract(1, "hour").toDate(),
    to: dayjs().toDate(),
  },
});

const isRecentRange = (value: DateRange | undefined, minutes: number) => {
  if (!value?.from || !value.to) return false;
  const duration = dayjs(value.to).diff(dayjs(value.from), "second");
  return Math.abs(duration - minutes * 60) <= 2;
};

const isEqualDateRange = (a: DateRange | undefined, b: DateRange) => {
  if (!a) return false;
  const aFromDay = dayjs(a.from).format("YYYY-MM-DD");
  const aToDay = dayjs(a.to).format("YYYY-MM-DD");
  const bFromDay = dayjs(b.from).format("YYYY-MM-DD");
  const bToDay = dayjs(b.to).format("YYYY-MM-DD");
  return aFromDay === bFromDay && aToDay === bToDay;
};

// dateRangePresetLabel returns the human label of the matching quick-range
// preset (e.g. "Last 14 Days", "Last Month") for a value, or null when the
// value is a custom range (or empty). Shared so date-filter chips read the same
// way as the picker's own button.
export function dateRangePresetLabel(
  value: DateRange | undefined,
  t: (key: MessageKey) => string,
): string | null {
  if (!value?.from && !value?.to) return null;
  if (isRecentRange(value, 5)) return t("datePicker.last5Minutes");
  if (isRecentRange(value, 15)) return t("datePicker.last15Minutes");
  if (isRecentRange(value, 30)) return t("datePicker.last30Minutes");
  if (isRecentRange(value, 60)) return t("datePicker.last1Hour");
  if (isEqualDateRange(value, defaultRanges.allTime))
    return t("datePicker.allTime");
  if (isEqualDateRange(value, defaultRanges.lastMonth))
    return t("datePicker.lastMonth");
  if (isEqualDateRange(value, defaultRanges.last14Days))
    return t("datePicker.last14Days");
  if (isEqualDateRange(value, defaultRanges.last2Days))
    return t("datePicker.last2Days");
  if (isEqualDateRange(value, defaultRanges.last7Days))
    return t("datePicker.last7Days");
  if (isEqualDateRange(value, defaultRanges.yesterday))
    return t("datePicker.yesterday");
  if (isEqualDateRange(value, defaultRanges.today))
    return t("datePicker.today");
  return null;
}

export function DatePickerWithRange({
  className,
  value,
  onChange,
  disabled = false,
}: Readonly<Props>) {
  const { t } = useI18n();

  const isActive = useMemo(() => {
    return {
      today: isEqualDateRange(value, defaultRanges.today),
      last5Minutes: isRecentRange(value, 5),
      last15Minutes: isRecentRange(value, 15),
      last30Minutes: isRecentRange(value, 30),
      last1Hour: isRecentRange(value, 60),
      yesterday: isEqualDateRange(value, defaultRanges.yesterday),
      last14Days: isEqualDateRange(value, defaultRanges.last14Days),
      last2Days: isEqualDateRange(value, defaultRanges.last2Days),
      last7Days: isEqualDateRange(value, defaultRanges.last7Days),
      lastMonth: isEqualDateRange(value, defaultRanges.lastMonth),
      allTime: isEqualDateRange(value, defaultRanges.allTime),
    };
  }, [value]);

  const displayDateValue = useMemo(() => {
    if (!value) return t("datePicker.selectDateRange");

    const preset = dateRangePresetLabel(value, t);
    if (preset) return preset;

    if (!value.to) return dayjs(value.from).format("MMM DD, YYYY").toString();
    return `${dayjs(value.from).format("MMM DD, YYYY")} - ${dayjs(
      value.to,
    ).format("MMM DD, YYYY")}`;
  }, [t, value]);

  const [calendarOpen, setCalendarOpen] = useState(false);

  const updateRangeAndClose = (range: DateRange) => {
    onChange?.(range);
  };

  const debouncedOnChange = useMemo(() => {
    return onChange ? debounce(onChange, 500) : undefined;
  }, [onChange]);

  const handleOnSelect = (range?: DateRange) => {
    let from = range?.from
      ? dayjs(range.from).startOf("day").toDate()
      : undefined;
    let to = range?.to ? dayjs(range.to).endOf("day").toDate() : undefined;
    if (!from && !to) {
      onChange?.(undefined);
      return;
    }
    onChange?.({ from, to });
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"secondary"}
            disabled={disabled}
            className={cn("max-w-[260px] justify-start text-left font-normal")}
          >
            <CalendarIcon size={16} className={"shrink-0"} />
            {displayDateValue}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
          side={"right"}
          sideOffset={10}
          alignOffset={-100}
        >
          <div
            className={
              "px-3 py-2 flex flex-wrap gap-2 max-w-[280px] sm:max-w-none border-b border-nb-gray-800 items-center justify-between w-full"
            }
          >
            <div className={"flex gap-2 flex-wrap"}>
              <CalendarButton
                label={t("datePicker.last5Minutes")}
                active={isActive.last5Minutes}
                onClick={() => updateRangeAndClose(recentRanges().last5Minutes)}
              />
              <CalendarButton
                label={t("datePicker.last15Minutes")}
                active={isActive.last15Minutes}
                onClick={() =>
                  updateRangeAndClose(recentRanges().last15Minutes)
                }
              />
              <CalendarButton
                label={t("datePicker.last30Minutes")}
                active={isActive.last30Minutes}
                onClick={() =>
                  updateRangeAndClose(recentRanges().last30Minutes)
                }
              />
              <CalendarButton
                label={t("datePicker.last1Hour")}
                active={isActive.last1Hour}
                onClick={() => updateRangeAndClose(recentRanges().last1Hour)}
              />
            </div>
            <div>
              <CalendarButton
                label={
                  <>
                    <CalendarIcon size={14} className={"shrink-0"} />
                    {t("datePicker.allTime")}
                  </>
                }
                active={isActive.allTime}
                onClick={() => updateRangeAndClose(defaultRanges.allTime)}
              />
            </div>
            <div className={"flex gap-2 flex-wrap"}>
              <CalendarButton
                label={t("datePicker.lastMonth")}
                active={isActive.lastMonth}
                onClick={() => updateRangeAndClose(defaultRanges.lastMonth)}
              />
              <CalendarButton
                label={t("datePicker.last14Days")}
                active={isActive.last14Days}
                onClick={() => updateRangeAndClose(defaultRanges.last14Days)}
              />
              <CalendarButton
                label={t("datePicker.yesterday")}
                active={isActive.yesterday}
                onClick={() => updateRangeAndClose(defaultRanges.yesterday)}
              />
              <CalendarButton
                label={t("datePicker.today")}
                active={isActive.today}
                onClick={() => updateRangeAndClose(defaultRanges.today)}
              />
            </div>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={handleOnSelect}
            numberOfMonths={2}
          />
          <AbsoluteDateTimeInput value={value} onChange={debouncedOnChange} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

type CalendarButtonProps = {
  label: string | React.ReactNode;
  onClick: () => void;
  active?: boolean;
};

function CalendarButton({
  label,
  onClick,
  active,
}: Readonly<CalendarButtonProps>) {
  return (
    <button
      className={cn(
        "py-1.5 leading-none px-2.5 rounded-md text-center text-xs transition-all flex gap-2",
        active
          ? "bg-nb-gray-800 text-nb-gray-100"
          : "bg-transparent text-nb-gray-300 hover:bg-nb-gray-900 hover:text-nb-gray-100",
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
