import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import dayjs from "dayjs";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DatePickerWithRange } from "@components/DatePickerWithRange";

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as typeof ResizeObserver;

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({
    locale: "zh-CN",
    t: (key: string) =>
      ({
        "datePicker.last1Hour": "最近 1 小时",
        "datePicker.last5Minutes": "最近 5 分钟",
        "datePicker.last15Minutes": "最近 15 分钟",
        "datePicker.last30Minutes": "最近 30 分钟",
        "datePicker.lastMonth": "最近一个月",
        "datePicker.last14Days": "最近 14 天",
        "datePicker.last2Days": "最近 2 天",
        "datePicker.last7Days": "最近 7 天",
        "datePicker.yesterday": "昨天",
        "datePicker.today": "今天",
        "datePicker.selectDateRange": "选择日期范围",
      })[key] ?? key,
  }),
}));

afterEach(cleanup);

describe("DatePickerWithRange", () => {
  it("does not offer the all-time preset", () => {
    render(
      <DatePickerWithRange
        value={{
          from: dayjs().subtract(1, "hour").toDate(),
          to: dayjs().toDate(),
        }}
      />,
    );

    fireEvent.click(document.querySelector("button#date") as HTMLButtonElement);
    expect(screen.queryByText("全部时间")).toBeNull();
    expect(screen.getByText("今天")).toBeTruthy();
  });

  it("only activates the matching same-day preset", () => {
    render(
      <DatePickerWithRange
        value={{
          from: dayjs().subtract(5, "minute").toDate(),
          to: dayjs().toDate(),
        }}
      />,
    );

    fireEvent.click(document.querySelector("button#date") as HTMLButtonElement);
    const last5Minutes = screen
      .getAllByText("最近 5 分钟")
      .map((element) => element.closest("button"))
      .find((button) => button?.className.includes("py-1.5"));
    const today = screen.getByText("今天").closest("button");

    expect(last5Minutes?.className).toContain("bg-nb-gray-800");
    expect(today?.className).not.toContain("bg-nb-gray-800");
  });
});
