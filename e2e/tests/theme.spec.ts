import { navigateTo } from "../helpers/auth";
import { expect, test } from "../helpers/fixtures";

const THEME_KEY = "netbird-theme";

async function expectTheme(
  page: import("@playwright/test").Page,
  theme: "light" | "dark",
) {
  await expect
    .poll(() =>
      page.evaluate(() => ({
        isDark: document.documentElement.classList.contains("dark"),
        colorScheme: document.documentElement.style.colorScheme,
      })),
    )
    .toEqual({ isDark: theme === "dark", colorScheme: theme });
}

test.describe.serial("Theme @theme", () => {
  test("switches themes and persists the selection", async ({
    dashboardAsOwner: page,
  }) => {
    await page.evaluate((key) => localStorage.setItem(key, "dark"), THEME_KEY);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expectTheme(page, "dark");

    await page.getByTestId("user-dropdown").click();
    await page.getByTestId("theme-light").click();
    await expectTheme(page, "light");
    await expect
      .poll(() => page.evaluate((key) => localStorage.getItem(key), THEME_KEY))
      .toBe("light");

    await page.reload({ waitUntil: "domcontentloaded" });
    await expectTheme(page, "light");

    await page.getByTestId("user-dropdown").click();
    await page.getByTestId("theme-dark").click();
    await expectTheme(page, "dark");
  });

  test("keeps dark loading states dark across dashboard routes", async ({
    dashboardAsOwner: page,
  }) => {
    await page.evaluate((key) => localStorage.setItem(key, "dark"), THEME_KEY);

    for (const path of [
      "/peers",
      "/network-routes",
      "/networks",
      "/relays",
      "/settings",
    ]) {
      await navigateTo(page, path);
      await expectTheme(page, "dark");

      const colors = await page.evaluate(() => {
        const body = getComputedStyle(document.body).backgroundColor;
        const skeleton = document.querySelector<HTMLElement>(
          ".react-loading-skeleton",
        );
        return {
          body,
          skeleton: skeleton
            ? getComputedStyle(skeleton).getPropertyValue("--base-color")
            : null,
        };
      });

      expect(colors.body).not.toBe("rgb(255, 255, 255)");
      if (colors.skeleton) {
        expect(colors.skeleton.match(/\d+/g)?.join(",")).toBe("37,40,45");
      }
    }
  });
});
