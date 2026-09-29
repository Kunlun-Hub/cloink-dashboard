/**
 * NOTE (cloink fork): Commercial license detection is removed.
 *
 * Cloink is self-developed, not a purchased NetBird license. There is no
 * license server to probe and no NETBIRD_LICENSED flag to honor. Features
 * are gated by whether cloink-server implements them (open-source), not by
 * a commercial license.
 *
 * This hook is kept as a static stub so existing call sites continue to
 * compile; it always reports unlicensed and never makes a network probe.
 * Feature-specific availability (e.g. event-streaming, notifications) is
 * decided at each call site, not here.
 */
export const useIsLicensed = (): {
  isLicensed: boolean;
  isLoading: boolean;
} => {
  return { isLicensed: false, isLoading: false };
};
