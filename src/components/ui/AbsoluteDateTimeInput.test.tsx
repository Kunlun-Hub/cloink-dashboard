import { cleanup, fireEvent, render } from "@testing-library/react";
import dayjs from "dayjs";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AbsoluteDateTimeInput } from "@components/ui/AbsoluteDateTimeInput";

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as typeof ResizeObserver;

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ locale: "zh-CN" }),
}));

afterEach(cleanup);

describe("AbsoluteDateTimeInput", () => {
  it("does not emit dates while syncing from props", async () => {
    const onChange = vi.fn();
    const lastHour = {
      from: dayjs().subtract(1, "hour").toDate(),
      to: dayjs().toDate(),
    };
    const allTime = {
      from: dayjs("1970-01-01").startOf("day").toDate(),
      to: dayjs().endOf("day").toDate(),
    };

    const { rerender } = render(
      <AbsoluteDateTimeInput value={lastHour} onChange={onChange} />,
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(onChange).not.toHaveBeenCalled();

    rerender(<AbsoluteDateTimeInput value={allTime} onChange={onChange} />);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("still emits user edits", async () => {
    const onChange = vi.fn();
    const value = {
      from: dayjs("2026-10-21T10:00:00Z").toDate(),
      to: dayjs("2026-10-21T11:00:00Z").toDate(),
    };
    const { container } = render(
      <AbsoluteDateTimeInput value={value} onChange={onChange} />,
    );
    const yearInput = container.querySelectorAll("input")[0];

    fireEvent.focus(yearInput);
    fireEvent.keyDown(yearInput, { key: "ArrowUp" });
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onChange).toHaveBeenCalled();
  });
});
