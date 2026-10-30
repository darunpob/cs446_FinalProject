import type { MyFind, Reward, RewardPayout } from "../contract";
import { LOST_REPORT_EXPIRY_DAYS, REWARD_MAX_BAHT, REWARD_MIN_BAHT, rewardFee } from "../contract";
import type { StoredAccount, StoredFoundItem, StoredLostReport, StoredReward } from "./mockDatabase";

const DAY_MS = 86_400_000;

export function isValidRewardAmount(amount: number): boolean {
  if (amount === 0) return true;
  return Number.isInteger(amount) && amount >= REWARD_MIN_BAHT && amount <= REWARD_MAX_BAHT;
}

/** The moment an open notice posted at `createdAt` expires, and with it any reward nobody earned. */
export function noticeExpiresAt(createdAt: string): string {
  return new Date(new Date(createdAt).getTime() + LOST_REPORT_EXPIRY_DAYS * DAY_MS).toISOString();
}

export function openReward(rewardId: string, amount: number): StoredReward | null {
  if (amount === 0) return null;
  return {
    id: rewardId,
    amount,
    fee: rewardFee(amount),
    status: "awaiting_payment",
    paidAt: null,
    expiresAt: null,
    settledAt: null,
    refundAmount: null,
    checkoutSessionId: null,
    finderEmail: null,
    itemTitle: null,
  };
}

export function toReward(stored: StoredReward | null): Reward | null {
  if (!stored) return null;
  const { checkoutSessionId: _session, finderEmail: _finder, itemTitle: _itemTitle, ...reward } = stored;
  return reward;
}

/** What the payment webhook does once the gateway reports a successful test charge. */
export function holdReward(reward: StoredReward, now: Date, expiresAt: string): void {
  reward.status = "held";
  reward.paidAt = now.toISOString();
  reward.expiresAt = expiresAt;
}

/** Ends a reward without paying anyone: held money goes back to the owner minus the fee, an unpaid checkout is voided. */
export function settleWithoutFinder(reward: StoredReward | null, now: Date): void {
  if (reward?.status === "held") {
    reward.status = "refunded";
    reward.refundAmount = reward.amount - reward.fee;
  } else if (reward?.status === "awaiting_payment") {
    reward.status = "voided";
  } else {
    return;
  }
  reward.settledAt = now.toISOString();
}

/** Only a signed-in finder who is not the owner can receive the reward; otherwise it is refunded. */
export function releaseOnReturn(report: StoredLostReport, returnedItem: StoredFoundItem, now: Date): void {
  const reward = report.reward;
  const finderEmail = returnedItem.finderEmail;
  if (reward?.status !== "held" || !finderEmail || finderEmail === report.ownerEmail) {
    settleWithoutFinder(reward, now);
    return;
  }
  reward.status = "pending_payout";
  reward.finderEmail = finderEmail;
  reward.itemTitle = returnedItem.title;
  reward.settledAt = now.toISOString();
}

/** The reward as the finder of `find` sees it: promised while held, theirs once released to them, otherwise forfeited. */
export function toFinderReward(reward: StoredReward | null, find: StoredFoundItem): MyFind["reward"] {
  if (!reward || reward.status === "awaiting_payment" || reward.status === "voided") return null;
  const netAmount = reward.amount - reward.fee;
  if (reward.status === "held") return { netAmount, status: "promised" };
  const releasedToThisFinder = reward.finderEmail === find.finderEmail;
  if (reward.status === "refunded" || !releasedToThisFinder) return { netAmount, status: "forfeited" };
  return { netAmount, status: reward.status };
}

export function toPayout(report: StoredLostReport, reward: StoredReward, finder: StoredAccount | undefined): RewardPayout {
  return {
    rewardId: reward.id,
    lostReportId: report.id,
    itemTitle: reward.itemTitle ?? report.title,
    finderName: finder?.displayName ?? "",
    finderEmail: reward.finderEmail ?? "",
    finderStudentId: finder?.studentId ?? "",
    grossAmount: reward.amount,
    fee: reward.fee,
    netAmount: reward.amount - reward.fee,
    releasedAt: reward.settledAt ?? "",
  };
}
