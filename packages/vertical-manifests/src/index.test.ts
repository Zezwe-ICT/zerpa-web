import { describe, expect, it } from "vitest";
import { normalizeVerticalId, getVerticalManifest, LAUNCH_ORDER } from "../src/index";

describe("vertical manifests", () => {
  it("normalizes AUTO to AUTOMOTIVE", () => {
    expect(normalizeVerticalId("AUTO")).toBe("AUTOMOTIVE");
  });

  it("maps TECH to MSP", () => {
    expect(normalizeVerticalId("TECH")).toBe("MSP");
  });

  it("includes MSP and TELECOM in launch order", () => {
    expect(LAUNCH_ORDER[0]).toBe("MSP");
    expect(LAUNCH_ORDER[1]).toBe("TELECOM");
  });

  it("exposes ticket label for MSP", () => {
    expect(getVerticalManifest("MSP").workItemLabel).toBe("Ticket");
  });
});
