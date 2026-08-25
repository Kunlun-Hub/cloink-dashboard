import { expect, type Page, test } from "@playwright/test";

const linuxReleases = [
  {
    id: "linux-amd64",
    version: "0.77.1",
    platform: "linux",
    architecture: "amd64",
    channel: "stable",
    downloadUrl: "/api/version-releases/files/linux-amd64",
    sha256: "a".repeat(64),
    isLatest: true,
    createdAt: "2026-08-25T06:00:00Z",
    updatedAt: "2026-08-25T06:00:00Z",
  },
  {
    id: "linux-arm64",
    version: "0.77.1",
    platform: "linux",
    architecture: "arm64",
    channel: "stable",
    downloadUrl: "/api/version-releases/files/linux-arm64",
    sha256: "b".repeat(64),
    isLatest: false,
    createdAt: "2026-08-25T05:00:00Z",
    updatedAt: "2026-08-25T05:00:00Z",
  },
];

async function mockLinuxReleases(page: Page, releases = linuxReleases) {
  await page.route(/\/api\/version-releases\/public\?.*/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(releases),
    });
  });
}

async function openLinuxInstall(page: Page) {
  await page.goto("/install");
  const modal = page.getByTestId("setup-netbird-modal");
  await modal.waitFor();
  await page.getByRole("tab", { name: /linux/i }).click();
  await page.getByTestId("linux-release-select").waitFor();
  return modal;
}

test.describe("Setup modal Linux version releases", () => {
  test("uses the latest published release and Cloink install script", async ({
    page,
  }) => {
    await mockLinuxReleases(page);
    const modal = await openLinuxInstall(page);

    await expect(modal).toContainText(/Install Cloink|安装 Cloink/);
    await expect(page.getByTestId("linux-release-select")).toContainText(
      "0.77.1",
    );
    await expect(page.getByTestId("linux-release-select")).toContainText(
      /AMD64/i,
    );
    await expect(modal).toContainText("install.sh");
    await expect(modal).toContainText('--version "0.77.1"');
    await expect(modal).toContainText('--architecture "amd64"');
    await expect(modal).toContainText("cloink up");
    await expect(modal).not.toContainText("netbird up");
    await expect(modal).not.toContainText("pkgs.netbird.io");
    await expect(modal).not.toContainText("apt-get install netbird");
  });

  test("switches architecture and manual artifact URL together", async ({
    page,
  }) => {
    await mockLinuxReleases(page);
    const modal = await openLinuxInstall(page);

    await page.getByTestId("linux-release-select").click();
    await page.getByRole("option", { name: /0\.77\.1.*ARM64/i }).click();
    await expect(modal).toContainText('--architecture "arm64"');

    await page.getByText(/Manual installation|手动安装/).click();
    await page.getByTestId("linux-manual-release-select").waitFor();
    await expect(page.getByTestId("linux-manual-release-select")).toContainText(
      /ARM64/i,
    );
    await expect(modal).toContainText(
      "/api/version-releases/files/linux-arm64",
    );
    await expect(
      modal.getByRole("button", { name: /Download|下载/ }),
    ).toBeEnabled();
  });

  test("does not fall back to official installers when no release exists", async ({
    page,
  }) => {
    await mockLinuxReleases(page, []);
    const modal = await openLinuxInstall(page);

    await expect(page.getByTestId("linux-release-select")).toBeDisabled();
    await expect(modal).toContainText(/No Linux release|暂无 Linux 发布版本/);
    await expect(modal).not.toContainText("install.sh | sh");
    await expect(modal).not.toContainText("pkgs.netbird.io");
  });

  test("serves the self-hosted installer script", async ({ request }) => {
    const response = await request.get("/install.sh");
    expect(response.ok()).toBeTruthy();
    const script = await response.text();
    expect(script).toContain("/api/version-releases/public");
    expect(script).toContain("SHA256 verification failed");
    expect(script).not.toContain("pkgs.netbird.io");
  });
});
