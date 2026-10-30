import { describe, expect, it } from "vitest";
import { MockLostFoundApi } from "../src/api/mock/mockClient";
import { openMockDatabase } from "../src/api/mock/mockDatabase";
import type { NewLostReport } from "../src/api/contract";
import { foundReportPrefillPath } from "../src/features/report-lost/LostBoardPage";

function freshApi() {
  const now = () => new Date("2026-10-29T10:00:00+07:00");
  const tokenHolder: { current: string | null } = { current: null };
  const api = new MockLostFoundApi({ database: openMockDatabase(null, now), now, latencyMs: 0, getAccessToken: () => tokenHolder.current });
  const signInAs = async (email: string, password: string) => {
    tokenHolder.current = (await api.login(email, password)).accessToken;
  };
  return { api, tokenHolder, signInAs };
}

const lostKeys: NewLostReport = {
  title: "กุญแจรถมอเตอร์ไซค์",
  description: "พวงกุญแจมีสติกเกอร์โดราเอมอน",
  category: "keys",
  lastSeenLocationId: "loc-parking",
  lostAt: "2026-10-28T09:00:00.000Z",
  imageKeys: [],
  studentId: "1650707093",
  contact: { name: "ธนพล", email: "someone.else@bumail.net", lineId: "thanaphon.j", phone: "0812345678" },
  rewardAmount: 0,
};

const lostUmbrella: NewLostReport = { ...lostKeys, title: "ร่มสีดำ", description: "", category: "other", studentId: "" };

describe("lost reports belong to the signed-in account", () => {
  it("requires a session to file a report", async () => {
    const { api } = freshApi();
    await expect(api.createLostReport(lostKeys)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("takes the owner from the token, not from the contact email", async () => {
    const { api, signInAs } = freshApi();
    await signInAs("student@bumail.net", "student1234");
    const receipt = await api.createLostReport(lostKeys);
    const mine = await api.listMyLostReports();
    expect(mine.reports.map((report) => report.id)).toEqual([receipt.id]);
    expect(mine.reports[0]).toMatchObject({ status: "searching", closedAt: null });

    await signInAs("guard@bu.ac.th", "guard1234");
    expect((await api.listMyLostReports()).reports).toEqual([]);
  });

  it("recomputes possible matches on every read", async () => {
    const { api, signInAs } = freshApi();
    await signInAs("student@bumail.net", "student1234");
    await api.createLostReport(lostUmbrella);
    const matchIds = async () => (await api.listMyLostReports()).reports[0].possibleMatches.map((found) => found.id);
    const before = await matchIds();

    const umbrella = await api.createFoundItem({
      title: "ร่มสีดำ ด้ามไม้", description: "", category: "other", foundLocationId: "loc-parking", dropOffPointId: "drop-gate2",
      foundAt: "2026-10-29T01:00:00.000Z", imageKeys: [], verificationQuestion: "ด้ามร่มมีอะไรติดอยู่", verificationAnswer: "พวงกุญแจ",
    });
    expect(before).not.toContain(umbrella.id);
    expect(await matchIds()).toContain(umbrella.id);
    const [report] = (await api.listMyLostReports()).reports;
    expect(report.possibleMatches[0]).not.toHaveProperty("verificationAnswer");
  });
});

describe("cancelling a lost report", () => {
  it("cancels it, drops its matches and refuses a second cancel", async () => {
    const { api, signInAs } = freshApi();
    await signInAs("student@bumail.net", "student1234");
    const { id } = await api.createLostReport(lostKeys);
    const closed = await api.cancelLostReport(id);
    expect(closed).toMatchObject({ id, status: "cancelled", possibleMatches: [], submissions: [] });
    expect(closed.closedAt).not.toBeNull();
    await expect(api.cancelLostReport(id)).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("answers 404 when someone else tries to close it", async () => {
    const { api, signInAs } = freshApi();
    await signInAs("student@bumail.net", "student1234");
    const { id } = await api.createLostReport(lostKeys);
    await signInAs("guard@bu.ac.th", "guard1234");
    await expect(api.cancelLostReport(id)).rejects.toMatchObject({ code: "NOT_FOUND", httpStatus: 404 });
  });
});

describe("pickup codes stay reachable after the claim dialog closes", () => {
  it("lists only the signed-in user's own claims", async () => {
    const { api, tokenHolder, signInAs } = freshApi();
    await signInAs("guard@bu.ac.th", "guard1234");
    await api.submitClaim({ itemId: "itm-1001", answer: "แมว", claimantName: "Other", studentId: "1650000009", contact: "x" });
    await signInAs("student@bumail.net", "student1234");
    const outcome = await api.submitClaim({ itemId: "itm-1003", answer: "Honda", claimantName: "B", studentId: "1650000000", contact: "line" });
    if (outcome.status !== "verified") throw new Error("expected a verified claim");

    const { claims } = await api.listMyLostReports();
    expect(claims).toEqual([expect.objectContaining({ claimId: outcome.claimId, itemId: "itm-1003", pickupCode: outcome.pickupCode, dropOffPointId: "drop-gate2", status: "verified" })]);

    tokenHolder.current = null;
    const pending = await api.listPendingReturns();
    expect(pending.every((claim) => !("ownerEmail" in claim))).toBe(true);
  });
});

describe("public lost board", () => {
  it("shows only open reports with name, category, area and date", async () => {
    const { api, signInAs } = freshApi();
    await signInAs("student@bumail.net", "student1234");
    const kept = await api.createLostReport(lostKeys);
    const withdrawn = await api.createLostReport(lostUmbrella);
    await api.cancelLostReport(withdrawn.id);

    const board = (await api.listOpenLostReports()).filter((notice) => notice.id === kept.id || notice.id === withdrawn.id);
    expect(board).toEqual([{
      id: kept.id, title: lostKeys.title, description: lostKeys.description, category: "keys", lastSeenLocationId: "loc-parking",
      lostAt: lostKeys.lostAt, imageUrls: [], hasReward: false, progress: "searching",
    }]);
    expect(JSON.stringify(board)).not.toMatch(/1650707093|bumail|0812345678|thanaphon/);
  });

  it("filters by search text, category and where it was lost", async () => {
    const { api, signInAs } = freshApi();
    await signInAs("student@bumail.net", "student1234");
    const keys = await api.createLostReport(lostKeys);
    const umbrella = await api.createLostReport({ ...lostUmbrella, lastSeenLocationId: "loc-library" });
    const mine = [keys.id, umbrella.id];
    const ids = async (query: Parameters<typeof api.listOpenLostReports>[0]) =>
      (await api.listOpenLostReports(query)).map((report) => report.id).filter((reportId) => mine.includes(reportId));

    expect(await ids({ q: "โดราเอมอน" })).toEqual([keys.id]);
    expect(await ids({ category: "other" })).toEqual([umbrella.id]);
    expect(await ids({ location: "loc-parking" })).toEqual([keys.id]);
    expect(await ids({ q: "ร่ม", category: "keys" })).toEqual([]);
  });

  it("counts open notices, confirmed pickups and the ones found this month", async () => {
    const { api, signInAs } = freshApi();
    await signInAs("student@bumail.net", "student1234");
    const notice = await api.createLostReport(lostUmbrella);
    const before = await api.getStats();
    await api.register({ email: "finder.k@bumail.net", password: "finder1234", displayName: "คนเก็บได้" });
    await signInAs("finder.k@bumail.net", "finder1234");
    const answer = await api.createFoundItem({
      title: "ร่มสีดำ", description: "", category: "other", foundLocationId: "loc-parking", dropOffPointId: "drop-gate2",
      foundAt: "2026-10-29T01:00:00.000Z", imageKeys: [], verificationQuestion: "", verificationAnswer: "", answersLostReportId: notice.id,
    });
    await signInAs("student@bumail.net", "student1234");
    const pickup = await api.confirmSubmission(notice.id, answer.id);
    expect((await api.getStats()).lostAwaitingPickup).toBe(before.lostAwaitingPickup + 1);

    await api.confirmReturn(pickup.claimId);
    const after = await api.getStats();
    expect(after).toMatchObject({ lostSearching: before.lostSearching - 1, lostAwaitingPickup: before.lostAwaitingPickup, lostFoundThisMonth: before.lostFoundThisMonth + 1 });
  });

  it("hands the found form only what the board already shows, plus the notice id", () => {
    const path = foundReportPrefillPath({
      id: "lst-1", title: "ร่ม & กุญแจ", description: "สีดำ", category: "keys", lastSeenLocationId: "loc-parking",
      lostAt: "2026-10-28T09:00:00.000Z", imageUrls: [], hasReward: false, progress: "searching",
    });
    const params = new URLSearchParams(path.split("?")[1]);
    expect(path.startsWith("/report-found?")).toBe(true);
    expect(Object.fromEntries(params)).toEqual({ title: "ร่ม & กุญแจ", category: "keys", location: "loc-parking", answers: "lst-1" });
  });
});

describe("lost board history", () => {
  it("lists notices still searching by default, and pending and returned ones with history", async () => {
    const { api } = freshApi();
    const openIds = (await api.listOpenLostReports()).map((notice) => notice.id);
    expect(openIds).toContain("lst-9001");
    expect(openIds).toContain("lst-9003");
    expect(openIds).not.toContain("lst-9004");
    expect(openIds).not.toContain("lst-9005");
    const withHistory = await api.listOpenLostReports({ history: true });
    expect(withHistory.find((notice) => notice.id === "lst-9005")).toMatchObject({ progress: "returned" });
    expect(withHistory.find((notice) => notice.id === "lst-9004")).toMatchObject({ progress: "awaiting_pickup" });
  });
});
