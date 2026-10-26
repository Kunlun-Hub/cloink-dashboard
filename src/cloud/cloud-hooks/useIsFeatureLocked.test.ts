import { describe, expect, it } from "vitest";
import { isOpenSourceFeature, PlanFeatures } from "./useIsFeatureLocked";

describe("isOpenSourceFeature", () => {
  it("keeps device approvals available on self-hosted deployments", () => {
    expect(isOpenSourceFeature(PlanFeatures.DEVICE_APPROVALS)).toBe(true);
  });

  it("keeps other management features unlocked", () => {
    expect(isOpenSourceFeature(PlanFeatures.POSTURE_CHECKS)).toBe(true);
  });

  it("leaves commercial-only features gated", () => {
    expect(isOpenSourceFeature(PlanFeatures.EDR)).toBe(false);
  });
});
