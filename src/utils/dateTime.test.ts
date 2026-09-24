import { describe, expect, it } from "vitest";
import { timeFormatFor } from "./dateTime";

describe("timeFormatFor", () => {
  it("uses a 24-hour clock for the Chinese locale", () => {
    expect(timeFormatFor("zh-CN")).toBe("HH:mm:ss");
    expect(timeFormatFor("zh-CN", false)).toBe("HH:mm");
  });

  it("keeps the 12-hour clock with an AM/PM marker for English", () => {
    expect(timeFormatFor("en")).toBe("h:mm:ss A");
    expect(timeFormatFor("en", false)).toBe("h:mm A");
  });
});
