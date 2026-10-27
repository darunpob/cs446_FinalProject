import { describe, expect, it } from "vitest";
import { MockLostFoundApi } from "../src/api/mock/mockClient";
import { openMockDatabase } from "../src/api/mock/mockDatabase";
import { ApiError } from "../src/api/errors";

function freshApi() {
  const now = () => new Date("2026-10-27T10:00:00+07:00");
  return new MockLostFoundApi({ database: openMockDatabase(null, now), now, latencyMs: 0 });
}

describe("MockLostFoundApi", () => {
  it("never exposes verification answers", async () => {
    const api = freshApi();
    const [first] = await api.listFoundItems({});
    expect(first).not.toHaveProperty("verificationAnswer");
  });

  it("filters by category, location and text", async () => {
    const api = freshApi();
    const electronics = await api.listFoundItems({ category: "electronics" });
    expect(electronics.every((found) => found.category === "electronics")).toBe(true);
    const library = await api.listFoundItems({ location: "loc-library" });
    expect(library.map((found) => found.id)).toContain("itm-1001");
    const searched = await api.listFoundItems({ q: "iphone" });
    expect(searched.map((found) => found.id)).toEqual(["itm-1001"]);
  });

  it("verifies a correct claim, then lets a guard confirm the return", async () => {
    const api = freshApi();
    const outcome = await api.submitClaim({ itemId: "itm-1003", answer: "Honda", claimantName: "B", studentId: "1650000000", contact: "line" });
    expect(outcome.status).toBe("verified");
    expect((await api.getFoundItem("itm-1003")).status).toBe("claimed");

    const pending = await api.listPendingReturns();
    const claim = pending.find((candidate) => candidate.itemId === "itm-1003");
    expect(claim).toBeDefined();
    await api.confirmReturn(claim!.id);
    expect((await api.getFoundItem("itm-1003")).status).toBe("returned");
  });

  it("locks a claimant out after three wrong answers", async () => {
    const api = freshApi();
    const attempt = () => api.submitClaim({ itemId: "itm-1002", answer: "wrong", claimantName: "C", studentId: "1650000001", contact: "x" });
    expect(await attempt()).toEqual({ status: "rejected", attemptsLeft: 2 });
    await attempt();
    expect(await attempt()).toEqual({ status: "rejected", attemptsLeft: 0 });
    await expect(attempt()).rejects.toBeInstanceOf(ApiError);
  });

  it("lists stale items oldest first", async () => {
    const stale = await freshApi().listStaleItems(30);
    expect(stale.length).toBeGreaterThan(0);
    expect(stale.every((found) => found.daysWaiting >= 30 && found.status === "available")).toBe(true);
    expect(stale[0].daysWaiting).toBeGreaterThanOrEqual(stale[stale.length - 1].daysWaiting);
  });

  it("caps guesses per item even when the student ID keeps changing", async () => {
    const api = freshApi();
    const guessAs = (studentId: string) => api.submitClaim({ itemId: "itm-1005", answer: "wrong", claimantName: "D", studentId, contact: "x" });
    const outcomes = [];
    for (const studentId of ["1650000010", "1650000011", "1650000012", "1650000013", "1650000014", "1650000015"]) {
      outcomes.push(await guessAs(studentId));
    }
    expect(outcomes.at(-1)).toEqual({ status: "rejected", attemptsLeft: 0 });
    await expect(guessAs("1650000016")).rejects.toMatchObject({ code: "TOO_MANY_ATTEMPTS" });
  });

  it("searches Rekognition labels as well as the title", async () => {
    const api = freshApi();
    const byLabel = await api.listFoundItems({ q: "teddy bear" });
    expect(byLabel.map((found) => found.id)).toEqual(["itm-1003"]);
    expect(byLabel[0].aiLabels).toContain("Keychain");
  });
});
