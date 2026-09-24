import { describe, expect, it } from "vitest";
import { NetworkTrafficGroup } from "@/cloud/traffic-events/interfaces/NetworkTrafficGroup";
import { isNoisyTrafficGroup, isSystemLocalAddress } from "./noise";

const group = (source: string, destination: string): NetworkTrafficGroup =>
  ({
    source: { address: source },
    destination: { address: destination },
  }) as NetworkTrafficGroup;

describe("isSystemLocalAddress", () => {
  it("treats host-local and link-local addresses as noise", () => {
    expect(isSystemLocalAddress("0.0.0.0")).toBe(true);
    expect(isSystemLocalAddress("127.0.0.1:53")).toBe(true);
    expect(isSystemLocalAddress("169.254.10.1")).toBe(true);
    expect(isSystemLocalAddress("224.0.0.251:5353")).toBe(true);
    expect(isSystemLocalAddress("255.255.255.255")).toBe(true);
    expect(isSystemLocalAddress("::")).toBe(true);
    expect(isSystemLocalAddress("[::1]:5353")).toBe(true);
    expect(isSystemLocalAddress("ff02::fb")).toBe(true);
    expect(isSystemLocalAddress("fe80::1")).toBe(true);
  });

  it("keeps routable and overlay addresses", () => {
    expect(isSystemLocalAddress("100.80.130.45:443")).toBe(false);
    expect(isSystemLocalAddress("10.202.10.247")).toBe(false);
    expect(isSystemLocalAddress("fd00::1")).toBe(false);
    expect(isSystemLocalAddress("example.internal:8080")).toBe(false);
    expect(isSystemLocalAddress("2001:db8::1")).toBe(false);
  });
});

describe("isNoisyTrafficGroup", () => {
  it("drops discovery chatter and self-directed flows", () => {
    expect(isNoisyTrafficGroup(group("224.0.0.251:5353", "100.80.1.2"))).toBe(
      true,
    );
    expect(isNoisyTrafficGroup(group("100.80.1.2:53", "100.80.1.2:53"))).toBe(
      true,
    );
  });

  it("keeps real peer and resource traffic", () => {
    expect(isNoisyTrafficGroup(group("100.80.1.2", "100.80.1.9:443"))).toBe(
      false,
    );
    expect(isNoisyTrafficGroup(group("100.80.1.2", "10.10.0.5:3306"))).toBe(
      false,
    );
  });
});
