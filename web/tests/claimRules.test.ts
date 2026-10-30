import { describe, expect, it } from "vitest";
import { answerMatches, findPossibleMatches, generatePickupCode } from "../src/api/mock/claimRules";
import type { FoundItem, NewLostReport } from "../src/api/contract";

const walletItem: FoundItem = {
  id: "itm-1", title: "กระเป๋าสตางค์หนังสีน้ำตาล", description: "", category: "wallet",
  foundLocationId: "loc-canteen", dropOffPointId: "drop-gate1", foundAt: "2026-10-20T05:00:00.000Z",
  reportedAt: "2026-10-20T05:30:00.000Z", imageUrl: null, imageUrls: [], cardNumberMasked: false, status: "available", verificationQuestion: "?", aiLabels: [],
};

const lostWallet: NewLostReport = {
  title: "กระเป๋าสตางค์", description: "สีน้ำตาล", category: "wallet", lastSeenLocationId: "loc-canteen",
  lostAt: "2026-10-20T04:00:00.000Z", imageKeys: [], studentId: "", contact: { name: "A", lineId: "a", phone: "", email: "" }, rewardAmount: 0,
};

describe("answerMatches", () => {
  it("ignores case and whitespace", () => {
    expect(answerMatches("  HONDA ", "honda")).toBe(true);
    expect(answerMatches("แมว สีส้ม", "แมว")).toBe(true);
  });

  it("rejects wrong or empty answers", () => {
    expect(answerMatches("yamaha", "honda")).toBe(false);
    expect(answerMatches("   ", "honda")).toBe(false);
  });

  it("rejects a long list of guesses stuffed into one answer", () => {
    expect(answerMatches("yamaha suzuki kawasaki honda vespa", "honda")).toBe(false);
  });
});

describe("findPossibleMatches", () => {
  it("returns available items in the same category", () => {
    expect(findPossibleMatches(lostWallet, [walletItem]).map((match) => match.id)).toEqual(["itm-1"]);
  });

  it("skips items that are already claimed or returned", () => {
    expect(findPossibleMatches(lostWallet, [{ ...walletItem, status: "claimed" }])).toEqual([]);
  });
});

describe("generatePickupCode", () => {
  it("creates a 6 character code without ambiguous characters", () => {
    const code = generatePickupCode((bytes) => bytes.map((_, slot) => slot * 37));
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  });
});
