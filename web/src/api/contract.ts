/**
 * Shared shapes for the REST API (ALB /api/* → EC2 Auto Scaling → RDS).
 * Mirrors docs/API_CONTRACT.md — change both together.
 */

export type CategoryId =
  | "electronics"
  | "wallet"
  | "card"
  | "keys"
  | "bag"
  | "bottle"
  | "clothing"
  | "other";

export type FoundItemStatus = "available" | "claimed" | "returned";

export interface CampusPlace {
  id: string;
  name: string;
  zone: string;
}

export interface DropOffPoint {
  id: string;
  name: string;
  hours: string;
  phone: string;
}

export interface CampusDirectory {
  foundLocations: CampusPlace[];
  dropOffPoints: DropOffPoint[];
}

export interface FoundItem {
  id: string;
  title: string;
  description: string;
  category: CategoryId;
  foundLocationId: string;
  dropOffPointId: string;
  foundAt: string;
  reportedAt: string;
  /** Cover photo — always imageUrls[0], or null when there are no photos. */
  imageUrl: string | null;
  /** Up to MAX_PHOTOS public photo URLs, cover first. Card numbers are already masked out of them. */
  imageUrls: string[];
  /** True when the backend found and blacked out a card / ID number in at least one photo. */
  cardNumberMasked: boolean;
  status: FoundItemStatus;
  verificationQuestion: string;
  /** Amazon Rekognition DetectLabels output (English, top 5). Empty until the photo is analysed. */
  aiLabels: string[];
}

export interface FoundItemQuery {
  q?: string;
  category?: CategoryId;
  location?: string;
  status?: FoundItemStatus;
}

export interface NewFoundItem {
  title: string;
  description: string;
  category: CategoryId;
  foundLocationId: string;
  dropOffPointId: string;
  foundAt: string;
  /** Keys from uploadImage, cover first, at most MAX_PHOTOS. */
  imageKeys: string[];
  verificationQuestion: string;
  verificationAnswer: string;
}

export const MAX_PHOTOS = 4;
export const TITLE_MAX_LENGTH = 60;
export const DESCRIPTION_MAX_LENGTH = 500;

export interface UploadedImage {
  imageKey: string;
  imageUrl: string;
}

export interface UploadTicket extends UploadedImage {
  uploadUrl: string;
}

export interface ContactChannels {
  name: string;
  lineId: string;
  phone: string;
  /** Must end with one of UNIVERSITY_EMAIL_DOMAINS — the backend rejects others with 400. */
  email: string;
}

export const UNIVERSITY_EMAIL_DOMAINS = ["bumail.net", "bu.ac.th"] as const;

export function isUniversityEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1] ?? "";
  return UNIVERSITY_EMAIL_DOMAINS.some((allowed) => domain === allowed);
}

export interface NewLostReport {
  title: string;
  description: string;
  category: CategoryId;
  lastSeenLocationId: string;
  lostAt: string;
  /** Keys from uploadImage, cover first, at most MAX_PHOTOS. Shown on the public board. */
  imageKeys: string[];
  /** 10-digit student ID, or "" — lets the backend match a photographed student card to this report. */
  studentId: string;
  contact: ContactChannels;
  /** Whole baht; 0 = no reward, otherwise REWARD_MIN_BAHT..REWARD_MAX_BAHT. */
  rewardAmount: number;
}

/** Payments run in the gateway's test mode only: taking real money needs a registered business. */
export const REWARD_MIN_BAHT = 20;
export const REWARD_MAX_BAHT = 500;
export const REWARD_FEE_RATE = 0.1;
export const REWARD_HOLD_DAYS = 30;

export function rewardFee(amount: number): number {
  return Math.round(amount * REWARD_FEE_RATE);
}

/**
 * awaiting_payment → held (escrow) → pending_payout (guard confirmed the return) → paid_out (admin marked the transfer).
 * A held reward is refunded when the owner closes the report, after REWARD_HOLD_DAYS, or when no eligible finder exists.
 */
export type RewardStatus = "awaiting_payment" | "held" | "pending_payout" | "paid_out" | "refunded" | "voided";

export interface Reward {
  id: string;
  amount: number;
  fee: number;
  status: RewardStatus;
  paidAt: string | null;
  /** When the hold ends and an unclaimed reward is refunded; null until paid. */
  expiresAt: string | null;
  settledAt: string | null;
}

export interface RewardCheckout {
  checkoutUrl: string;
}

/** A reward released to the signed-in user as the finder. `netAmount` is after the fee. */
export interface EarnedReward {
  rewardId: string;
  itemTitle: string;
  netAmount: number;
  status: Extract<RewardStatus, "pending_payout" | "paid_out">;
  releasedAt: string;
}

export interface RewardPayout {
  rewardId: string;
  lostReportId: string;
  itemTitle: string;
  finderName: string;
  finderEmail: string;
  finderStudentId: string;
  grossAmount: number;
  fee: number;
  netAmount: number;
  releasedAt: string;
}

export interface LostReportReceipt {
  id: string;
  createdAt: string;
  possibleMatches: FoundItem[];
  reward: Reward | null;
}

export type LostReportStatus = "searching" | "found" | "cancelled";

export type LostReportCloseReason = "found" | "cancelled";

/** A lost report as its owner sees it. `possibleMatches` is recomputed on every read and is [] once closed. */
export interface MyLostReport {
  id: string;
  title: string;
  description: string;
  category: CategoryId;
  lastSeenLocationId: string;
  lostAt: string;
  imageUrls: string[];
  createdAt: string;
  status: LostReportStatus;
  closedAt: string | null;
  possibleMatches: FoundItem[];
  reward: Reward | null;
}

/** A verified claim made while signed in, so the pickup code can be looked up again after the dialog closes. */
export interface MyClaim {
  claimId: string;
  itemId: string;
  itemTitle: string;
  itemCategory: CategoryId;
  pickupCode: string;
  dropOffPointId: string;
  status: ClaimStatus;
  createdAt: string;
}

export interface MyLostReports {
  reports: MyLostReport[];
  claims: MyClaim[];
  earnedRewards: EarnedReward[];
}

/**
 * All the public "still looking for" board may show. Student ID and contact are left out on purpose.
 * The description is public, so the lost form warns owners to keep secret marks out of it.
 */
export interface PublicLostReport {
  id: string;
  title: string;
  description: string;
  category: CategoryId;
  lastSeenLocationId: string;
  lostAt: string;
  imageUrls: string[];
  /** Only whether a reward is held — never the amount, so the board does not price stolen goods. */
  hasReward: boolean;
}

export interface NewClaim {
  itemId: string;
  answer: string;
  claimantName: string;
  studentId: string;
  contact: string;
  /** The claimant's own open lost report this item answers, or "" — links the reward to the return. */
  lostReportId: string;
}

export type ClaimOutcome =
  | { status: "verified"; claimId: string; pickupCode: string; dropOffPointId: string }
  | { status: "rejected"; attemptsLeft: number };

export type ClaimStatus = "verified" | "returned";

export interface Claim {
  id: string;
  itemId: string;
  itemTitle: string;
  itemCategory: CategoryId;
  claimantName: string;
  studentId: string;
  contact: string;
  dropOffPointId: string;
  pickupCode: string;
  status: ClaimStatus;
  createdAt: string;
  returnedAt: string | null;
}

export interface StaleItem extends FoundItem {
  daysWaiting: number;
}

export interface CampusStats {
  waiting: number;
  awaitingPickup: number;
  returnedThisMonth: number;
}

export type UserRole = "student" | "guard";

export interface SessionUser {
  email: string;
  displayName: string;
  role: UserRole;
}

export interface Session {
  accessToken: string;
  user: SessionUser;
}

export const MIN_PASSWORD_LENGTH = 8;

/** Self-registration always creates a "student" account; guard accounts are seeded by staff. */
export interface NewAccount {
  email: string;
  password: string;
  displayName: string;
}

export interface UserProfile extends SessionUser {
  /** 10-digit student ID, or "". */
  studentId: string;
  phone: string;
  lineId: string;
}

export interface ProfileUpdate {
  displayName: string;
  studentId: string;
  phone: string;
  lineId: string;
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
}

export interface LostFoundApi {
  getDirectory(): Promise<CampusDirectory>;
  getStats(): Promise<CampusStats>;
  listFoundItems(query: FoundItemQuery): Promise<FoundItem[]>;
  getFoundItem(itemId: string): Promise<FoundItem>;
  uploadImage(photo: Blob): Promise<UploadedImage>;
  createFoundItem(draft: NewFoundItem): Promise<FoundItem>;
  createLostReport(draft: NewLostReport): Promise<LostReportReceipt>;
  listMyLostReports(): Promise<MyLostReports>;
  closeLostReport(reportId: string, reason: LostReportCloseReason): Promise<MyLostReport>;
  listOpenLostReports(): Promise<PublicLostReport[]>;
  startRewardCheckout(reportId: string): Promise<RewardCheckout>;
  listPendingPayouts(): Promise<RewardPayout[]>;
  confirmPayout(rewardId: string): Promise<RewardPayout>;
  submitClaim(draft: NewClaim): Promise<ClaimOutcome>;
  listPendingReturns(): Promise<Claim[]>;
  confirmReturn(claimId: string): Promise<Claim>;
  listStaleItems(minDays: number): Promise<StaleItem[]>;
  login(email: string, password: string): Promise<Session>;
  register(draft: NewAccount): Promise<Session>;
  getProfile(): Promise<UserProfile>;
  updateProfile(update: ProfileUpdate): Promise<UserProfile>;
  changePassword(change: PasswordChange): Promise<void>;
}
