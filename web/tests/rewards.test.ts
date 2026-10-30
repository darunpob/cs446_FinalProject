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
  return { api, gateway, clock, signInAs, signOut };
}

const lostBag: NewLostReport = {
  title: "กระเป๋าเป้สีดำ",
  description: "มีสติกเกอร์โดราเอมอน",
  category: "bag",
  lastSeenLocationId: "loc-library",
  lostAt: "2026-10-28T09:00:00.000Z",
  imageKeys: [],
  studentId: "",
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

async function fileAndPay(world: ReturnType<typeof freshWorld>) {
  await world.signInAs("student@bumail.net", "student1234");
  const receipt = await world.api.createLostReport(lostBag);
  const { checkoutUrl } = await world.api.startRewardCheckout(receipt.id);
  world.gateway.pay(checkoutUrl.split("/").pop() ?? "", TEST_CARDS.success);
  return receipt.id;
}

async function returnThroughGuard(world: ReturnType<typeof freshWorld>, reportId: string, finder: "signed-in" | "anonymous") {
  if (finder === "signed-in") {
    await world.api.register({ email: "finder.k@bumail.net", password: "finder1234", displayName: "คนเก็บได้" });
    await world.signInAs("finder.k@bumail.net", "finder1234");
  } else {
    world.signOut();
  }
  const item = await world.api.createFoundItem(foundBag);
  await world.signInAs("student@bumail.net", "student1234");
  const outcome = await world.api.submitClaim({ itemId: item.id, answer: "โดราเอมอน", claimantName: "เจ้าของ", studentId: "1650000000", contact: "line", lostReportId: reportId });
  if (outcome.status !== "verified") throw new Error("expected a verified claim");
  await world.signInAs("guard@bu.ac.th", "guard1234");
  await world.api.confirmReturn(outcome.claimId);
}

async function myReport(world: ReturnType<typeof freshWorld>, reportId: string) {
  await world.signInAs("student@bumail.net", "student1234");
  return (await world.api.listMyLostReports()).reports.find((report) => report.id === reportId);
}

describe("setting a reward", () => {
  it("accepts 0 or a whole amount inside the cap, and quotes the 10% fee", async () => {
    const world = freshWorld();
    await world.signInAs("student@bumail.net", "student1234");
    await expect(world.api.createLostReport({ ...lostBag, rewardAmount: 5 })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(world.api.createLostReport({ ...lostBag, rewardAmount: 501 })).rejects.toMatchObject({ code: "VALIDATION" });
    expect((await world.api.createLostReport({ ...lostBag, rewardAmount: 0 })).reward).toBeNull();
    const receipt = await world.api.createLostReport(lostBag);
    expect(receipt.reward).toMatchObject({ amount: 100, fee: 10, status: "awaiting_payment", paidAt: null });
  });

  it("holds the money after a test card payment and shows only a reward tag on the board", async () => {
    const world = freshWorld();
    const reportId = await fileAndPay(world);
    expect((await myReport(world, reportId))?.reward).toMatchObject({ status: "held", expiresAt: "2026-11-28T03:00:00.000Z" });
    const [notice] = await world.api.listOpenLostReports();
    expect(notice).toEqual({
      id: reportId, title: lostBag.title, description: lostBag.description, category: "bag", lastSeenLocationId: "loc-library",
      lostAt: lostBag.lostAt, imageUrls: [], hasReward: true,
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
    expect((await world.api.listOpenLostReports())[0].hasReward).toBe(false);
  });
});

describe("releasing the reward", () => {
  it("waits for the guard's return, then queues the net amount for the signed-in finder", async () => {
    const world = freshWorld();
    const reportId = await fileAndPay(world);
    await returnThroughGuard(world, reportId, "signed-in");

    const [payout] = await world.api.listPendingPayouts();
    expect(payout).toMatchObject({ lostReportId: reportId, finderEmail: "finder.k@bumail.net", grossAmount: 100, fee: 10, netAmount: 90 });
    expect(await myReport(world, reportId)).toMatchObject({ status: "found", reward: { status: "pending_payout" } });

    await world.signInAs("finder.k@bumail.net", "finder1234");
    expect((await world.api.listMyLostReports()).earnedRewards).toEqual([expect.objectContaining({ netAmount: 90, status: "pending_payout" })]);

    await world.signInAs("guard@bu.ac.th", "guard1234");
    await expect(world.api.confirmPayout(payout.rewardId)).resolves.toMatchObject({ netAmount: 90 });
    await expect(world.api.confirmPayout(payout.rewardId)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(await world.api.listPendingPayouts()).toEqual([]);
  });

  it("refunds the owner when the item was handed in anonymously", async () => {
    const world = freshWorld();
    const reportId = await fileAndPay(world);
    await returnThroughGuard(world, reportId, "anonymous");
    expect((await myReport(world, reportId))?.reward?.status).toBe("refunded");
    expect(await world.api.listPendingPayouts()).toEqual([]);
  });

  it("refuses to link a claim to someone else's report", async () => {
    const world = freshWorld();
    const reportId = await fileAndPay(world);
    await world.signInAs("guard@bu.ac.th", "guard1234");
    const claim = { itemId: "itm-1003", answer: "honda", claimantName: "X", studentId: "1650000001", contact: "x", lostReportId: reportId };
    await expect(world.api.submitClaim(claim)).rejects.toMatchObject({ code: "VALIDATION" });
  });
});

describe("refunds", () => {
  it("refunds a held reward when the owner cancels and voids an unpaid one", async () => {
    const world = freshWorld();
    const paidId = await fileAndPay(world);
    const unpaid = await world.api.createLostReport(lostBag);
    expect((await world.api.closeLostReport(paidId, "cancelled")).reward?.status).toBe("refunded");
    expect((await world.api.closeLostReport(unpaid.id, "cancelled")).reward?.status).toBe("voided");
  });

  it("refunds automatically after the hold period but keeps the notice open", async () => {
    const world = freshWorld();
    const reportId = await fileAndPay(world);
    world.clock.current = new Date(world.clock.current.getTime() + 30 * DAY_MS + 1);
    expect((await world.api.listOpenLostReports())[0]).toMatchObject({ id: reportId, hasReward: false });
    expect(await myReport(world, reportId)).toMatchObject({ status: "searching", reward: { status: "refunded" } });
  });
});

async function registerFinder(world: ReturnType<typeof freshWorld>) {
  await world.api.register({ email: "finder.k@bumail.net", password: "finder1234", displayName: "คนเก็บได้" });
  await world.signInAs("finder.k@bumail.net", "finder1234");
}

async function claimAsOwner(world: ReturnType<typeof freshWorld>, itemId: string, options: { lostReportId: string; studentId?: string; signedIn?: boolean }) {
  if (options.signedIn === false) world.signOut();
  else await world.signInAs("student@bumail.net", "student1234");
  const outcome = await world.api.submitClaim({
    itemId, answer: "โดราเอมอน", claimantName: "เจ้าของ", studentId: options.studentId ?? "1650000000", contact: "line", lostReportId: options.lostReportId,
  });
  if (outcome.status !== "verified") throw new Error("expected a verified claim");
  await world.signInAs("guard@bu.ac.th", "guard1234");
  await world.api.confirmReturn(outcome.claimId);
}

describe("owners cannot dodge a reward", () => {
  it("follows the finder's link even when the owner answers 'not related'", async () => {
    const world = freshWorld();
    const reportId = await fileAndPay(world);
    await registerFinder(world);
    const item = await world.api.createFoundItem({ ...foundBag, answersLostReportId: reportId });
    await claimAsOwner(world, item.id, { lostReportId: "" });

    expect(await world.api.listPendingPayouts()).toEqual([expect.objectContaining({ lostReportId: reportId, finderEmail: "finder.k@bumail.net" })]);
    expect(await myReport(world, reportId)).toMatchObject({ status: "found", reward: { status: "pending_payout" } });
  });

  it("links a signed-out claim to the notice when the student ID matches it", async () => {
    const world = freshWorld();
    await world.signInAs("student@bumail.net", "student1234");
    const receipt = await world.api.createLostReport({ ...lostBag, studentId: "1650000000" });
    world.gateway.pay((await world.api.startRewardCheckout(receipt.id)).checkoutUrl.split("/").pop() ?? "", TEST_CARDS.success);
    await registerFinder(world);
    const item = await world.api.createFoundItem({ ...foundBag, answersLostReportId: receipt.id });
    await claimAsOwner(world, item.id, { lostReportId: "", signedIn: false });

    expect((await myReport(world, receipt.id))?.reward?.status).toBe("pending_payout");
  });

  it("sends the reward to a guard instead of refunding when the owner closes after taking a similar item", async () => {
    const world = freshWorld();
    const reportId = await fileAndPay(world);
    await registerFinder(world);
    const item = await world.api.createFoundItem(foundBag);
    await claimAsOwner(world, item.id, { lostReportId: "" });
    await world.signInAs("student@bumail.net", "student1234");
    expect((await world.api.closeLostReport(reportId, "cancelled")).reward?.status).toBe("in_review");

    await world.signInAs("finder.k@bumail.net", "finder1234");
    expect((await world.api.listMyLostReports()).earnedRewards).toEqual([]);

    await world.signInAs("guard@bu.ac.th", "guard1234");
    const [review] = await world.api.listRewardReviews();
    expect(review).toMatchObject({ lostReportId: reportId, itemId: item.id, finderName: "คนเก็บได้", amount: 100, reason: "owner_claimed_similar" });
    await world.api.resolveRewardReview(review.rewardId, "release");
    await expect(world.api.resolveRewardReview(review.rewardId, "release")).rejects.toMatchObject({ code: "CONFLICT" });
    expect(await world.api.listPendingPayouts()).toEqual([expect.objectContaining({ finderEmail: "finder.k@bumail.net", netAmount: 90 })]);
  });

  it("lets the guard refund when the returned item was not the one on the notice", async () => {
    const world = freshWorld();
    const reportId = await fileAndPay(world);
    await registerFinder(world);
    const item = await world.api.createFoundItem(foundBag);
    await claimAsOwner(world, item.id, { lostReportId: "" });
    await world.signInAs("student@bumail.net", "student1234");
    await world.api.closeLostReport(reportId, "found");

    await world.signInAs("guard@bu.ac.th", "guard1234");
    const [review] = await world.api.listRewardReviews();
    await expect(world.api.resolveRewardReview(review.rewardId, "pay-me" as never)).rejects.toMatchObject({ code: "VALIDATION" });
    await world.api.resolveRewardReview(review.rewardId, "refund");
    expect(await world.api.listRewardReviews()).toEqual([]);
    expect((await myReport(world, reportId))?.reward?.status).toBe("refunded");
  });

  it("freezes instead of auto-refunding when the hold ends after a linked item was claimed by someone else", async () => {
    const world = freshWorld();
    const reportId = await fileAndPay(world);
    await registerFinder(world);
    const item = await world.api.createFoundItem({ ...foundBag, answersLostReportId: reportId });
    await claimAsOwner(world, item.id, { lostReportId: "", signedIn: false, studentId: "1659999999" });
    world.clock.current = new Date(world.clock.current.getTime() + 30 * DAY_MS + 1);

    expect(await myReport(world, reportId)).toMatchObject({ status: "searching", reward: { status: "in_review" } });
    await world.signInAs("guard@bu.ac.th", "guard1234");
    expect((await world.api.listRewardReviews())[0]).toMatchObject({ reason: "linked_item_claimed" });
  });

  it("still refunds a plain cancel when no finder's item went back", async () => {
    const world = freshWorld();
    const reportId = await fileAndPay(world);
    expect((await world.api.closeLostReport(reportId, "cancelled")).reward?.status).toBe("refunded");
  });

  it("rejects links to closed or unknown notices and ignores an owner answering their own notice", async () => {
    const world = freshWorld();
    const reportId = await fileAndPay(world);
    await expect(world.api.createFoundItem({ ...foundBag, answersLostReportId: "lst-missing" })).rejects.toMatchObject({ code: "VALIDATION" });
    const ownFind = await world.api.createFoundItem({ ...foundBag, answersLostReportId: reportId });
    await claimAsOwner(world, ownFind.id, { lostReportId: "" });
    await world.signInAs("student@bumail.net", "student1234");
    expect((await world.api.closeLostReport(reportId, "found")).reward?.status).toBe("refunded");
    await expect(world.api.createFoundItem({ ...foundBag, answersLostReportId: reportId })).rejects.toMatchObject({ code: "VALIDATION" });
  });
});
