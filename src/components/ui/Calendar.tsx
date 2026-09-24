"use client";

import { buttonVariants } from "@components/ui/CalendarButton";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/utils/helpers";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  formatters,
  ...props
}: CalendarProps) {
  const { locale, t } = useI18n();
  const dayjsLocale = locale === "zh-CN" ? "zh-cn" : "en";
  // The caption pattern is locale-specific: zh reads "2026年9月" while en
  // needs the month name ("September 2026").
  const captionFormat = locale === "zh-CN" ? "YYYY年M月" : "MMMM YYYY";

  // react-day-picker ships its own English month/weekday labels. Reuse the
  // dayjs locale the app already configures so the calendar follows the UI
  // language instead of staying English.
  const localizedFormatters = React.useMemo(
    () => ({
      formatCaption: (month: Date) =>
        dayjs(month).locale(dayjsLocale).format(captionFormat),
      formatWeekdayName: (weekday: Date) =>
        dayjs(weekday).locale(dayjsLocale).format("dd"),
      ...formatters,
    }),
    [dayjsLocale, captionFormat, formatters],
  );

  // Screen readers use the day buttons' ARIA labels, which react-day-picker
  // renders in English by default ("Today, Thursday, September 24th, 2026").
  const dayLabelFormat =
    locale === "zh-CN" ? "YYYY年M月D日 dddd" : "dddd, MMMM Do, YYYY";
  const localizedLabels = React.useMemo(() => {
    const formatDayLabel = (
      date: Date,
      modifiers?: { today?: boolean; selected?: boolean },
    ) => {
      const parts = [
        dayjs(date).locale(dayjsLocale).format(dayLabelFormat),
      ];
      if (modifiers?.today) parts.unshift(t("datePicker.today"));
      if (modifiers?.selected) parts.push(t("common.selected"));
      return parts.join(locale === "zh-CN" ? "，" : ", ");
    };
    return {
      labelDayButton: formatDayLabel,
      labelGridcell: formatDayLabel,
    };
  }, [dayjsLocale, dayLabelFormat, locale, t]);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      formatters={localizedFormatters}
      labels={localizedLabels}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-y-0 relative",
        month: "space-y-4 pr-4 last:pr-0",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-nb-gray-100",
        nav: "space-x-1 flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-0 top-0 z-10",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-0 top-0 z-10",
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-nb-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-netbird/10 [&:has([aria-selected])]:bg-netbird/10 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day_button: cn("h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
        range_end: "day-range-end rounded-r-md",
        range_start: "day-range-start rounded-l-md",
        selected:
          "bg-netbird text-white hover:bg-netbird-500 hover:text-white focus:bg-netbird focus:text-white",
        today: "text-netbird font-semibold",
        outside:
          "day-outside text-nb-gray-500 opacity-50 aria-selected:bg-netbird/10 aria-selected:text-nb-gray-400 aria-selected:opacity-60",
        disabled: "text-nb-gray-500 opacity-50",
        range_middle:
          "aria-selected:bg-netbird/10 aria-selected:text-nb-gray-100 rounded-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
