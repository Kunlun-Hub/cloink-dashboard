"use client";

import loadConfig from "@utils/config";
import { useEffect, useMemo, useState } from "react";
import type {
  ArchitectureType,
  PlatformType,
} from "@/modules/settings/VersionReleasesTab";

// Public shape served by /api/version-releases/public — only releases that
// carry a sha256 checksum are listed there, so every entry is installable.
export type PublicVersionRelease = {
  id: string;
  version: string;
  platform: PlatformType;
  architecture: ArchitectureType;
  channel: string;
  downloadUrl: string;
  isLatest?: boolean;
};

const config = loadConfig();

// Download URLs stored on a release may be relative artifact paths
// ("/api/version-releases/files/<id>"); resolve them against the management
// API origin so the links work from the dashboard origin too.
export function resolveReleaseDownloadURL(downloadUrl: string) {
  try {
    return new URL(downloadUrl, `${config.apiOrigin}/`).toString();
  } catch {
    return downloadUrl;
  }
}

/**
 * Fetch releases published in Settings → Version Releases for a
 * platform. The endpoint is unauthenticated so the hook also works on the
 * public /install page. Returns an empty list until data arrives or when the
 * server has no published releases.
 */
export default function useVersionReleases(platform: PlatformType) {
  const [releases, setReleases] = useState<PublicVersionRelease[]>([]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ channel: "stable", platform });
    fetch(`${config.apiOrigin}/api/version-releases/public?${params}`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (!cancelled) setReleases(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setReleases([]);
      });
    return () => {
      cancelled = true;
    };
  }, [platform]);

  // Latest-flagged entries first so single-link consumers can take the head.
  return useMemo(
    () =>
      [...releases].sort(
        (left, right) => Number(!!right.isLatest) - Number(!!left.isLatest),
      ),
    [releases],
  );
}
