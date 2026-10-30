import { describe, expect, it } from "vitest";
import { MockLostFoundApi } from "../src/api/mock/mockClient";
import { openMockDatabase } from "../src/api/mock/mockDatabase";
import { TEST_CARDS, createTestPaymentGateway } from "../src/api/mock/testPayments";
import type { NewFoundItem, NewLostReport } from "../src/api/contract";

const DAY_MS = 86_400_000;

function freshWorld() {
  const clock = { current: new Date("2026-10-29T10:00:00+07:00") };
  const now = () => clock.current;
  const database = openMockDatabase(null, now);
  const tokenHolder: { current: string | null } = { current: null };
  const api = new MockLostFoundApi({ database, now, latencyMs: 0, getAccessToken: () => tokenHolder.current });
  const gateway = createTestPaymentGateway(database, now);
  const signInAs = async (email: string, password: string) => {
    tokenHolder.current = (await api.login(email, password)).accessToken;
  };
  const signOut = () => {
    tokenHolder.current = null;
  };
  return { api, database, gateway, clock, signInAs, signOut };
}

type World = ReturnType<typeof freshWorld>;

const lostBag: NewLostReport = {
  title: "กระเป๋าเป้สีดำ",
  description: "มีสติกเกอร์โดราเอมอน",
  category: "bag",
  lastSeenLocationId: "loc-library",
  lostAt: "2026-10-28T09:00:00.000Z",
  imageKeys: [],
  studentId: "1650000000",
  contact: { name: "นักศึกษาทดลอง", email: "student@bumail.net", lineId: "", phone: "" },
  rewardAmount: 100,
};

const foundBag: NewFoundItem = {
  title: "กระเป๋าเป้สีดำ มีสติกเกอร์",
  description: "",
  category: "bag",
  foundLocationId: "loc-library",
  dropOffPointId: "drop-library",
  foundAt: "2026-10-29T01:00:00.000Z",
  imageKeys: [],
  verificationQuestion: "บนกระเป๋ามีสติกเกอร์อะไร",
  verificationAnswer: "โดราเอมอน",
};

async function fileAndPay(world: World) {
  await world.signInAs("student@bumail.net", "student1234");
  const receipt = await world.api.createLostReport(lostBag);
  const { checkoutUrl } = await world.api.startRewardCheckout(receipt.id);
  world.gateway.pay(checkoutUrl.split("/").pop() ?? "", TEST_CARDS.success);
  return receipt.id;
}

async function registerFinder(world: World) {
  await world.api.register({ email: "finder.k@bumail.net", password: "finder1234", displayName: "คนเก็บได้" });
  await world.signInAs("finder.k@bumail.net", "finder1234");
}

/** The finder taps "I found this" on the notice: no verification question, the item goes to the owner only. */
async function answerNotice(world: World, reportId: string) {
  await registerFinder(world);
  return world.api.createFoundItem({ ...foundBag, verificationQuestion: "", verificationAnswer: "", answersLostReportId: reportId });
}

async function myReport(world: World, reportId: string) {
  await world.signInAs("student@bumail.net", "student1234");
  return (await world.api.listMyLostReports()).reports.find((report) => report.id === reportId);
}

async function boardNotice(world: World, reportId: string) {
  return (await world.api.listOpenLostReports({ history: true })).find((notice) => notice.id === reportId);
}

async function myFinds(world: World) {
  await world.signInAs("finder.k@bumail.net", "finder1234");
  return world.api.listMyFinds();
}

describe("setting a reward", () => {
  it("accepts 0 or a whole amount inside the cap, and quotes the 10% fee", async () => {
    const world = freshWorld();
    await world.signInAs("student@bumail.net", "student1234");
    await expect(world.api.createLostReport({ ...lostBag, rewardAmount: 5 })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(world.api.createLostReport({ ...lostBag, rewardAmount: 501 })).rejects.toMatchObject({ code: "VALIDATION" });
    expect((await world.api.createLostReport({ ...lostBag, rewardAmount: 0 })).reward).toBeNull();
    const receipt = await world.api.createLostReport(lostBag);
    expect(receipt.reward).toMatchObject({ amount: 100, fee: 10, status: "awaiting_payment", paidAt: null, refundAmount: null });
  });

  it("holds the money until the notice expires and shows only a reward tag on the board", async () => {
    const world = freshWorld();
    const reportId = await fileAndPay(world);
    expect((await myReport(world, reportId))?.reward).toMatchObject({ status: "held", expiresAt: "2026-11-28T03:00:00.000Z" });
    expect(await boardNotice(world, reportId)).toEqual({
      id: reportId, title: lostBag.title, description: lostBag.description, category: "bag", lastSeenLocationId: "loc-library",
      lostAt: lostBag.lostAt, imageUrls: [], hasReward: true, progress: "searching",
    });
  });

  it("leaves the reward unpaid when the test card is declined", async () => {
    const world = freshWorld();
    await world.signInAs("student@bumail.net", "student1234");
    const { id } = await world.api.createLostReport(lostBag);
    const sessionId = (await world.api.startRewardCheckout(id)).checkoutUrl.split("/").pop() ?? "";
    expect(() => world.gateway.pay(sessionId, TEST_CARDS.declined)).toThrow();
    expect(() => world.gateway.pay(sessionId, "5555 5555 5555 4444")).toThrow();
    expect((await myReport(world, id))?.reward?.status).toBe("awaiting_payment");
    expect((await boardNotice(world, id))?.hasReward).toBe(false);
  });
});

describe("answering a notice", () => {
  it("keeps the find between the finder and the owner, and e-mails the owner", async () => {
    const world = freshWorld();
    const reportId = await fileAndPay(world);
    const item = await answerNotice(world, reportId);

    expect((await world.api.listFoundItems({})).map((found) => found.id)).not.toContain(item.id);
    await expect(world.api.getFoundItem(item.id)).resolves.toMatchObject({ id: item.id });
    await world.signInAs("guard@bu.ac.th", "guard1234");
    await expect(world.api.getFoundItem(item.id)).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect(await myReport(world, reportId)).toMatchObject({ progress: "found", submissions: [expect.objectContaining({ id: item.id })] });
    expect(await boardNotice(world, reportId)).toMatchObject({ progress: "found" });
    expect(world.database.db.outbox).toEqual([expect.objectContaining({ to: "student@bumail.net", lostReportId: reportId, itemId: item.id })]);
  });

  it("pays the finder once the owner confirms and the guard hands the item over", async () => {
    const world = freshWorld();
    const reportId = await fileAndPay(world);
    const item = await answerNotice(world, reportId);
    await world.signInAs("student@bumail.net", "student1234");
    const pickup = await world.api.confirmSubmission(reportId, item.id);
    expect(pickup).toMatchObject({ itemId: item.id, status: "verified" });
    expect(await boardNotice(world, reportId)).toMatchObject({ progress: "awaiting_pickup" });
    expect(await myFinds(world)).toEqual([expect.objectContaining({ stage: "confirmed", noticeTitle: lostBag.title, reward: { netAmount: 90, status: "promised" } })]);

    await world.signInAs("guard@bu.ac.th", "guard1234");
    await world.api.confirmReturn(pickup.claimId);
    const [payout] = await world.api.listPendingPayouts();
    expect(payout).toMatchObject({ lostReportId: reportId, finderEmail: "finder.k@bumail.net", grossAmount: 100, fee: 10, netAmount: 90 });
    expect(await myReport(world, reportId)).toMatchObject({ status: "found", reward: { status: "pending_payout" } });
    expect(await myFinds(world)).toEqual([expect.objectContaining({ stage: "returned", reward: { netAmount: 90, status: "pending_payout" } })]);

    await world.signInAs("guard@bu.ac.th", "guard1234");
    await expect(world.api.confirmPayout(payout.rewardId)).resolves.toMatchObject({ netAmount: 90 });
    await expect(world.api.confirmPayout(payout.rewardId)).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await myFinds(world))[0].reward).toEqual({ netAmount: 90, status: "paid_out" });
  });

  it("does not let the owner cancel while a find waits for an answer or a pickup", async () => {
    const world = freshWorld();
    const reportId = await fileAndPay(world);
    const item = await answerNotice(world, reportId);
    await world.signInAs("student@bumail.net", "student1234");
    await expect(world.api.cancelLostReport(reportId)).rejects.toMatchObject({ code: "CONFLICT" });
    await world.api.confirmSubmission(reportId, item.id);
    await expect(world.api.cancelLostReport(reportId)).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(world.api.confirmSubmission(reportId, item.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("publishes a declined find, and never lets that owner claim it afterwards", async () => {
    const world = freshWorld();
    const reportId = await fileAndPay(world);
    const item = await answerNotice(world, reportId);
    await world.signInAs("student@bumail.net", "student1234");
    await world.api.declineSubmission(reportId, item.id);

    expect((await world.api.listFoundItems({})).map((found) => found.id)).toContain(item.id);
    const claim = { itemId: item.id, answer: "", claimantName: "เจ้าของ", studentId: "1659999999", contact: "line" };
    await expect(world.api.submitClaim(claim)).rejects.toMatchObject({ code: "FORBIDDEN" });
    world.signOut();
    await world.api.register({ email: "friend@bumail.net", password: "friend1234", displayName: "เพื่อน" });
    await world.signInAs("friend@bumail.net", "friend1234");
    await expect(world.api.submitClaim({ ...claim, studentId: lostBag.studentId })).rejects.toMatchObject({ code: "FORBIDDEN" });

    expect(await myFinds(world)).toEqual([expect.objectContaining({ stage: "posted", noticeTitle: null, reward: null })]);
  });

  it("requires a signed-in finder, and treats an owner answering their own notice as a public post", async () => {
    const world = freshWorld();
    const reportId = await fileAndPay(world);
    world.signOut();
    await expect(world.api.createFoundItem({ ...foundBag, answersLostReportId: reportId })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await world.signInAs("student@bumail.net", "student1234");
    await expect(world.api.createFoundItem({ ...foundBag, verificationQuestion: "", answersLostReportId: reportId })).rejects.toMatchObject({ code: "VALIDATION" });
    const ownPost = await world.api.createFoundItem({ ...foundBag, answersLostReportId: reportId });
    expect((await world.api.listFoundItems({})).map((found) => found.id)).toContain(ownPost.id);
    expect((await myReport(world, reportId))?.submissions).toEqual([]);
  });

  it("leaves the reward alone when the owner claims an unrelated public item", async () => {
    const world = freshWorld();
    const reportId = await fileAndPay(world);
    const outcome = await world.api.submitClaim({ itemId: "itm-1003", answer: "honda", claimantName: "เจ้าของ", studentId: "1650000000", contact: "line" });
    if (outcome.status !== "verified") throw new Error("expected a verified claim");
    await world.signInAs("guard@bu.ac.th", "guard1234");
    await world.api.confirmReturn(outcome.claimId);
    expect(await myReport(world, reportId)).toMatchObject({ status: "searching", reward: { status: "held" } });
  });
});

describe("refunds", () => {
  it("refunds a held reward minus the fee when the owner cancels, and voids an unpaid one", async () => {
    const world = freshWorld();
    const paidId = await fileAndPay(world);
    const unpaid = await world.api.createLostReport(lostBag);
    expect((await world.api.cancelLostReport(paidId)).reward).toMatchObject({ status: "refunded", refundAmount: 90 });
    expect((await world.api.cancelLostReport(unpaid.id)).reward).toMatchObject({ status: "voided", refundAmount: null });
    await expect(world.api.cancelLostReport(paidId)).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("expires a notice after 30 days, refunds it minus the fee and takes it off the board", async () => {
    const world = freshWorld();
    const reportId = await fileAndPay(world);
    world.clock.current = new Date(world.clock.current.getTime() + 30 * DAY_MS + 1);
    expect(await boardNotice(world, reportId)).toBeUndefined();
    expect(await myReport(world, reportId)).toMatchObject({ status: "expired", reward: { status: "refunded", refundAmount: 90 } });
  });

  it("keeps a notice open past 30 days while a find sent late still waits for the owner", async () => {
    const world = freshWorld();
    const reportId = await fileAndPay(world);
    world.clock.current = new Date(world.clock.current.getTime() + 25 * DAY_MS);
    await answerNotice(world, reportId);
    world.clock.current = new Date(world.clock.current.getTime() + 6 * DAY_MS);
    expect(await myReport(world, reportId)).toMatchObject({ status: "searching", progress: "found", reward: { status: "held" } });
  });
});

describe("deadlines keep cases from waiting on a person", () => {
  it("publishes a find the owner leaves unanswered for 7 days, and the owner still cannot claim it", async () => {
    const world = freshWorld();
    const reportId = await fileAndPay(world);
    const item = await answerNotice(world, reportId);
    const [submission] = (await myReport(world, reportId))?.submissions ?? [];
    expect(submission).toMatchObject({ id: item.id, answerBy: "2026-11-05T03:00:00.000Z" });

    world.clock.current = new Date(world.clock.current.getTime() + 7 * DAY_MS);
    expect((await world.api.listFoundItems({})).map((found) => found.id)).toContain(item.id);
    expect(await myReport(world, reportId)).toMatchObject({ progress: "searching", submissions: [] });
    const claim = { itemId: item.id, answer: "", claimantName: "เจ้าของ", studentId: "1659999999", contact: "line" };
    await expect(world.api.submitClaim(claim)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("lapses a pickup after 7 days and gives the owner a fresh week to answer", async () => {
    const world = freshWorld();
    const reportId = await fileAndPay(world);
    const item = await answerNotice(world, reportId);
    await world.signInAs("student@bumail.net", "student1234");
    await world.api.confirmSubmission(reportId, item.id);
    expect((await myReport(world, reportId))?.pickupBy).toBe("2026-11-05T03:00:00.000Z");

    world.clock.current = new Date(world.clock.current.getTime() + 7 * DAY_MS);
    const report = await myReport(world, reportId);
    expect(report).toMatchObject({ progress: "found", pickupBy: null, submissions: [expect.objectContaining({ id: item.id, answerBy: "2026-11-12T03:00:00.000Z" })] });
    await world.signInAs("guard@bu.ac.th", "guard1234");
    expect((await world.api.listPendingReturns()).map((claim) => claim.itemId)).not.toContain(item.id);
    expect(await world.api.listFoundItems({})).not.toContainEqual(expect.objectContaining({ id: item.id }));
  });
});
