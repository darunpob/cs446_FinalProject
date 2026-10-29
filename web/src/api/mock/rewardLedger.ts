import type { EarnedReward, Reward, RewardPayout } from "../contract";
import { REWARD_HOLD_DAYS, REWARD_MAX_BAHT, REWARD_MIN_BAHT, rewardFee } from "../contract";
import type { StoredAccount, StoredFoundItem, StoredLostReport, StoredReward } from "./mockDatabase";

const DAY_MS = 86_400_000;

export function isValidRewardAmount(amount: number): boolean {
  if (amount === 0) return true;
  return Number.isInteger(amount) && amount >= REWARD_MIN_BAHT && amount <= REWARD_MAX_BAHT;
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
export function holdReward(reward: StoredReward, now: Date): void {
  reward.status = "held";
  reward.paidAt = now.toISOString();
  reward.expiresAt = new Date(now.getTime() + REWARD_HOLD_DAYS * DAY_MS).toISOString();
}

/** Ends a reward without paying anyone: held money goes back to the owner, an unpaid checkout is voided. */
export function settleWithoutFinder(reward: StoredReward | null, now: Date): void {
  if (reward?.status === "held") reward.status = "refunded";
  else if (reward?.status === "awaiting_payment") reward.status = "voided";
  else return;
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

/** Stands in for the scheduled EventBridge job: refunds held rewards whose hold period has ended. */
export function refundExpiredRewards(reports: StoredLostReport[], now: Date): boolean {
  const expired = reports.filter((report) => report.reward?.status === "held" && report.reward.expiresAt !== null && report.reward.expiresAt <= now.toISOString());
  expired.forEach((report) => settleWithoutFinder(report.reward, now));
  return expired.length > 0;
}

export function toEarnedReward(reward: StoredReward): EarnedReward {
  return {
    rewardId: reward.id,
    itemTitle: reward.itemTitle ?? "",
    netAmount: reward.amount - reward.fee,
    status: reward.status === "paid_out" ? "paid_out" : "pending_payout",
    releasedAt: reward.settledAt ?? "",
  };
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
