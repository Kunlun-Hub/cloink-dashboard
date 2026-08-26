import { expect, type Page, test } from "@playwright/test";

const androidRelease = {
  id: "android-universal",
  version: "0.77.1",
  platform: "android",
  architecture: "universal",
  channel: "stable",
  downloadUrl: "/api/version-releases/files/android-universal",
  sha256: "c".repeat(64),
  isLatest: true,
  createdAt: "2026-08-26T10:00:00Z",
  updatedAt: "2026-08-26T10:00:00Z",
};

async function mockVersionReleases(
  page: Page,
  androidReleases = [androidRelease],
) {
  await page.route(/\/api\/version-releases\/public\?.*/, async (route) => {
    const url = new URL(route.request().url());
    const releases =
      url.searchParams.get("platform") === "android" ? androidReleases : [];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(releases),
    });
  });
}

test.describe("Public install modal", () => {
  test("defaults to Windows and omits the footer", async ({ page }) => {
    const transformedArtifactRequests: string[] = [];
    page.on("request", (request) => {
      if (
        request.url().includes("/api/version-releases/files/") &&
        request.url().includes("__next._tree.txt")
      ) {
        transformedArtifactRequests.push(request.url());
      }
    });
    await mockVersionReleases(page);
    await page.goto("/install");

    await expect(page.getByRole("tab", { name: "Windows" })).toHaveAttribute(
      "data-state",
      "active",
    );
    await expect(
      page.getByText(/After that you should be connected/i),
    ).toHaveCount(0);
    await expect(page.getByText("Installation Guide")).toHaveCount(0);
    expect(transformedArtifactRequests).toEqual([]);
  });

  test("downloads Android from the published release catalog", async ({
    page,
  }) => {
    await mockVersionReleases(page);
    await page.goto("/install");
    await page.getByRole("tab", { name: "Android" }).click();

    const releaseSelect = page.getByTestId("android-release-select");
    await expect(releaseSelect).toContainText("v0.77.1");
    await expect(releaseSelect).toContainText(/Universal|通用/);
    await expect(
      page.locator('a[href*="/api/version-releases/files/android-universal"]'),
    ).toBeVisible();
    await expect(page.locator('a[href*="play.google.com"]')).toHaveCount(0);
  });

  test("does not fall back to Google Play without an Android release", async ({
    page,
  }) => {
    await mockVersionReleases(page, []);
    await page.goto("/install");
    await page.getByRole("tab", { name: "Android" }).click();

    await expect(page.getByTestId("android-release-select")).toBeDisabled();
    await expect(
      page.getByText(/No Android release|暂无 Android/),
    ).toBeVisible();
    await expect(page.locator('a[href*="play.google.com"]')).toHaveCount(0);
  });
});
