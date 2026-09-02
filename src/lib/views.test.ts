import { describe, expect, it } from "vitest";
import { buildSeed } from "./seed";
import { currentUser } from "./views";

describe("currentUser", () => {
  it("does not default to Mira", () => {
    const s = buildSeed();
    expect(currentUser(s, undefined)).toBeNull();
  });

  it("rejects seed desks unless the switcher is on", () => {
    const prev = process.env.SPARKBOARD_DEV_SWITCHER;
    delete process.env.SPARKBOARD_DEV_SWITCHER;
    const s = buildSeed();
    expect(currentUser(s, "user_mira")).toBeNull();
    if (prev === undefined) delete process.env.SPARKBOARD_DEV_SWITCHER;
    else process.env.SPARKBOARD_DEV_SWITCHER = prev;
  });

  it("never returns the oracle", () => {
    const s = buildSeed();
    expect(currentUser(s, "user_desk")).toBeNull();
  });
});
