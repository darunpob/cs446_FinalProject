import { afterEach, describe, expect, it, vi } from "vitest";
import { createHttpApi } from "../src/api/httpClient";
import { ApiError } from "../src/api/errors";

interface RecordedCall {
  url: string;
  method: string;
  body: unknown;
  authorization: string | null;
}

function stubFetch(status: number, responseBody: unknown): RecordedCall[] {
  const calls: RecordedCall[] = [];
  vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    calls.push({
      url,
      method: init.method ?? "GET",
      body: init.body ? JSON.parse(String(init.body)) : null,
      authorization: headers.get("Authorization"),
    });
    return new Response(JSON.stringify(responseBody), { status });
  });
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

describe("createHttpApi follows docs/API_CONTRACT.md", () => {
  it("sends filters as q, category, location, status under /api/items", async () => {
    const calls = stubFetch(200, { items: [] });
    await createHttpApi("/api", () => null).listFoundItems({ q: "iphone", category: "electronics", location: "loc-library", status: "available" });
    expect(calls[0].url).toBe("/api/items?q=iphone&category=electronics&location=loc-library&status=available");
  });

  it("posts claims to /api/items/{id}/claims without repeating the id in the body", async () => {
    const calls = stubFetch(200, { status: "rejected", attemptsLeft: 2 });
    const claimForm = { answer: "Honda", claimantName: "B", studentId: "1650000000", contact: "line" };
    await createHttpApi("/api/", () => null).submitClaim({ itemId: "itm-1003", ...claimForm });
    expect(calls[0]).toMatchObject({ url: "/api/items/itm-1003/claims", method: "POST", body: claimForm });
  });

  it("attaches the bearer token for admin calls", async () => {
    const calls = stubFetch(200, { claims: [] });
    await createHttpApi("/api", () => "token-123").listPendingReturns();
    expect(calls[0]).toMatchObject({ url: "/api/admin/claims?status=verified", authorization: "Bearer token-123" });
  });

  it("reads my lost reports from /api/lost-reports/mine with the bearer token", async () => {
    const calls = stubFetch(200, { reports: [], claims: [] });
    await expect(createHttpApi("/api", () => "token-123").listMyLostReports()).resolves.toEqual({ reports: [], claims: [] });
    expect(calls[0]).toMatchObject({ url: "/api/lost-reports/mine", method: "GET", authorization: "Bearer token-123" });
  });

  it("cancels a lost report and answers finds sent to it", async () => {
    const calls = stubFetch(200, { id: "lst-8f2a", status: "cancelled" });
    const api = createHttpApi("/api", () => "token-123");
    await api.cancelLostReport("lst-8f2a");
    await api.confirmSubmission("lst-8f2a", "itm-9");
    await api.declineSubmission("lst-8f2a", "itm-9");
    expect(calls.map((call) => call.url)).toEqual([
      "/api/lost-reports/lst-8f2a/cancel",
      "/api/lost-reports/lst-8f2a/submissions/itm-9/confirm",
      "/api/lost-reports/lst-8f2a/submissions/itm-9/decline",
    ]);
    expect(calls.every((call) => call.method === "POST" && call.authorization === "Bearer token-123")).toBe(true);
  });

  it("unwraps my finds from /api/items/mine", async () => {
    const calls = stubFetch(200, { finds: [] });
    await expect(createHttpApi("/api", () => "token-123").listMyFinds()).resolves.toEqual([]);
    expect(calls[0]).toMatchObject({ url: "/api/items/mine", method: "GET", authorization: "Bearer token-123" });
  });

  it("unwraps the public lost board from /api/lost-reports", async () => {
    const notice = { id: "lst-1", title: "ร่ม", category: "other", lastSeenLocationId: "loc-library", lostAt: "2026-10-28T09:00:00.000Z" };
    const calls = stubFetch(200, { reports: [notice] });
    await expect(createHttpApi("/api", () => null).listOpenLostReports()).resolves.toEqual([notice]);
    expect(calls[0]).toMatchObject({ url: "/api/lost-reports", method: "GET", authorization: null });
  });

  it("starts a reward checkout for the owner's report", async () => {
    const calls = stubFetch(200, { checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_1" });
    await expect(createHttpApi("/api", () => "token-123").startRewardCheckout("lst-8f2a")).resolves.toEqual({ checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_1" });
    expect(calls[0]).toMatchObject({ url: "/api/lost-reports/lst-8f2a/reward/checkout", method: "POST", authorization: "Bearer token-123" });
  });

  it("lists and confirms reward payouts under /api/admin/payouts", async () => {
    const calls = stubFetch(200, { payouts: [] });
    await expect(createHttpApi("/api", () => "guard-token").listPendingPayouts()).resolves.toEqual([]);
    expect(calls[0].url).toBe("/api/admin/payouts?status=pending_payout");
    const confirmCalls = stubFetch(200, { rewardId: "rwd-1" });
    await createHttpApi("/api", () => "guard-token").confirmPayout("rwd-1");
    expect(confirmCalls[0]).toMatchObject({ url: "/api/admin/payouts/rwd-1/paid", method: "POST", authorization: "Bearer guard-token" });
  });

  it("turns the error envelope into an ApiError with the server message", async () => {
    stubFetch(409, { error: { code: "CONFLICT", message: "มีผู้ยืนยันแล้ว" } });
    const failure = await createHttpApi("/api", () => null).getFoundItem("itm-1").catch((caught: unknown) => caught);
    expect(failure).toBeInstanceOf(ApiError);
    expect(failure).toMatchObject({ code: "CONFLICT", message: "มีผู้ยืนยันแล้ว", httpStatus: 409 });
  });
});
