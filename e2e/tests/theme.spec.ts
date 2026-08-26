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

async function sampleDarkTransition(
  page: import("@playwright/test").Page,
  path: string,
) {
  return page.evaluate(async (targetPath) => {
    const button = document.querySelector<HTMLButtonElement>(
      `[data-nav-item="${targetPath}"] button`,
    );
    if (!button) throw new Error(`Navigation item not found: ${targetPath}`);

    const samples: {
      body: string;
      html: string;
      isDark: boolean;
      largeLightSurfaces: number;
      skeletonColors: string[];
    }[] = [];
    const startedAt = performance.now();

    button.click();

    while (performance.now() - startedAt < 900) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );

      const largeLightSurfaces = [
        ...document.querySelectorAll<HTMLElement>("body *"),
      ].filter((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.width * rect.height < innerWidth * innerHeight * 0.2) {
          return false;
        }
        if (
          rect.bottom <= 0 ||
          rect.right <= 0 ||
          rect.top >= innerHeight ||
          rect.left >= innerWidth
        ) {
          return false;
        }
        const color = getComputedStyle(element).backgroundColor;
        const channels = color.match(/[\d.]+/g)?.map(Number);
        return (
          !!channels &&
          channels.length >= 3 &&
          channels[0] >= 245 &&
          channels[1] >= 245 &&
          channels[2] >= 245 &&
          (channels[3] ?? 1) >= 0.8
        );
      }).length;

      samples.push({
        body: getComputedStyle(document.body).backgroundColor,
        html: getComputedStyle(document.documentElement).backgroundColor,
        isDark: document.documentElement.classList.contains("dark"),
        largeLightSurfaces,
        skeletonColors: [
          ...document.querySelectorAll<HTMLElement>(".react-loading-skeleton"),
        ].map((element) =>
          getComputedStyle(element).getPropertyValue("--base-color"),
        ),
      });
    }

    return samples;
  }, path);
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

  test("keeps every client-side navigation frame dark", async ({
    dashboardAsOwner: page,
  }) => {
    await page.evaluate((key) => localStorage.setItem(key, "dark"), THEME_KEY);
    await navigateTo(page, "/peers");
    await expectTheme(page, "dark");

    for (const path of ["/relays", "/settings", "/peers", "/control-center"]) {
      const samples = await sampleDarkTransition(page, path);

      expect(samples.length).toBeGreaterThan(0);
      expect(samples.every((sample) => sample.isDark)).toBe(true);
      expect(
        samples.every(
          (sample) =>
            sample.body === "rgb(24, 26, 29)" &&
            sample.html === "rgb(24, 26, 29)",
        ),
      ).toBe(true);
      expect(samples.every((sample) => sample.largeLightSurfaces === 0)).toBe(
        true,
      );
      expect(
        samples.every((sample) =>
          sample.skeletonColors.every(
            (color) => color.match(/\d+/g)?.join(",") === "37,40,45",
          ),
        ),
      ).toBe(true);
      await expect.poll(() => new URL(page.url()).pathname).toBe(path);
    }
  });
});
