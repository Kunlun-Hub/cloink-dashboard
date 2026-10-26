const { execFileSync } = require("child_process");

// Upstream release builds inject the dashboard tag through
// NEXT_PUBLIC_DASHBOARD_VERSION. Local Cloink builds used to inherit the
// management version instead, which made the dashboard report e.g. v0.81.3.
// Fall back to the nearest official dashboard tag so the console version stays
// aligned with the upstream release it is based on.
function dashboardVersion() {
  if (process.env.NEXT_PUBLIC_DASHBOARD_VERSION) {
    return process.env.NEXT_PUBLIC_DASHBOARD_VERSION;
  }

  try {
    return (
      execFileSync(
        "git",
        ["describe", "--tags", "--abbrev=0", "--match", "v[0-9]*"],
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
      ).trim() || "development"
    );
  } catch {
    // Source archives and environments without a Git checkout have no tag.
    return "development";
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  reactStrictMode: false,
  env: {
    APP_ENV: process.env.APP_ENV || "production",
    NEXT_PUBLIC_DASHBOARD_VERSION: dashboardVersion(),
  },
};

module.exports = nextConfig;
