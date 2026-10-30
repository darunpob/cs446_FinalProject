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

/**
 * Filters for the public lost board; `location` matches where the item was last seen.
 * `history` adds notices closed by a guard-confirmed return, so the board can show what was found.
 */
export interface LostReportQuery extends Omit<FoundItemQuery, "status"> {
  history?: boolean;
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
  /** Optional when answering a notice: the owner confirms from their own account instead of answering a question. */
  verificationQuestion: string;
  verificationAnswer: string;
  /**
   * The public lost notice the finder came from via "I found this", or "". The item then stays off the public board,
   * only that notice's owner sees it, and its reward follows it when the owner confirms it.
   */
  answersLostReportId?: string;
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
/** A notice still open this many days after it was posted is closed as "expired" and leaves the board. */
export const LOST_REPORT_EXPIRY_DAYS = 30;

/** A find the owner has not answered within this many days goes to the public board, as if declined. */
export const SUBMISSION_ANSWER_DAYS = 7;

/** A confirmed find not picked up within this many days loses its pickup code and waits for the owner again. */
export const PICKUP_HOLD_DAYS = 7;

export function rewardFee(amount: number): number {
  return Math.round(amount * REWARD_FEE_RATE);
}

/**
 * awaiting_payment → held (escrow) → pending_payout (guard confirmed the return) → paid_out (admin marked the transfer).
 * A held reward is refunded, minus the fee, when the owner cancels or the notice expires before anyone's find is returned.
 */
export type RewardStatus = "awaiting_payment" | "held" | "pending_payout" | "paid_out" | "refunded" | "voided";

export interface Reward {
  id: string;
  amount: number;
  fee: number;
  status: RewardStatus;
  paidAt: string | null;
  /** When the notice expires and an unclaimed reward is refunded; null until paid. */
  expiresAt: string | null;
  settledAt: string | null;
  /** What went back to the owner (amount − fee) once refunded, otherwise null. */
  refundAmount: number | null;
}

export interface RewardCheckout {
  checkoutUrl: string;
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

/** "found" is set only by the guard confirming a return; owners can only cancel, and old notices expire. */
export type LostReportStatus = "searching" | "found" | "cancelled" | "expired";

/**
 * Where a notice stands: nobody has answered it, a finder sent something in ("found"), the owner confirmed one of those
 * finds and is on the way to pick it up ("awaiting_pickup"), or a guard handed it over ("returned", board history only).
 */
export type LostNoticeProgress = "searching" | "found" | "awaiting_pickup" | "returned";

/**
 * A lost report as its owner sees it. `submissions` are finds sent in through "I found this" that wait for the owner's
 * answer; only the owner sees them. `possibleMatches` is recomputed on every read and is [] once closed.
 */
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
  progress: LostNoticeProgress;
  closedAt: string | null;
  submissions: Submission[];
  /** Last moment to collect a confirmed find before its pickup code lapses; null when nothing is confirmed. */
  pickupBy: string | null;
  possibleMatches: FoundItem[];
  reward: Reward | null;
}

/** A find sent to the owner's notice. `reportedAt` is when it was sent; after `answerBy` it is published unanswered. */
export interface Submission extends FoundItem {
  answerBy: string;
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
}

/**
 * How far a find has travelled: on the public board ("posted"), sent privately to a notice owner ("sent"),
 * confirmed by the owner and waiting at the drop-off point ("confirmed"), or handed over ("returned").
 */
export type FindStage = "posted" | "sent" | "confirmed" | "returned";

/** "promised" until the owner picks the item up; "forfeited" when the notice closed without this find being returned. */
export type FinderRewardStatus = "promised" | "pending_payout" | "paid_out" | "forfeited";

/** Something the signed-in user reported as found. `reward` is set only when it answered a notice with a paid reward. */
export interface MyFind {
  item: FoundItem;
  stage: FindStage;
  noticeTitle: string | null;
  reward: { netAmount: number; status: FinderRewardStatus } | null;
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
  progress: LostNoticeProgress;
}

/** Claims on public items never carry a notice link: rewards follow only finds sent in through a notice. */
export interface NewClaim {
  itemId: string;
  answer: string;
  claimantName: string;
  studentId: string;
  contact: string;
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
  /** Open notices on the public lost board. */
  lostSearching: number;
  /** Lost reports closed as found this calendar month. */
  lostFoundThisMonth: number;
  /** Open notices whose owner confirmed a find and has not picked it up yet. */
  lostAwaitingPickup: number;
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
  /** Refunds a held reward minus the fee. Refused while a find waits for the owner's answer or pickup. */
  cancelLostReport(reportId: string): Promise<MyLostReport>;
  /** The owner says a find sent to their notice is theirs: issues a pickup code tied to the notice and its reward. */
  confirmSubmission(reportId: string, itemId: string): Promise<MyClaim>;
  /** The owner says a find is not theirs: it moves to the public board, and the owner can no longer claim it. */
  declineSubmission(reportId: string, itemId: string): Promise<void>;
  listMyFinds(): Promise<MyFind[]>;
  listOpenLostReports(query?: LostReportQuery): Promise<PublicLostReport[]>;
  startRewardCheckout(reportId: string): Promise<RewardCheckout>;
  listPendingPayouts(): Promise<RewardPayout[]>;
  confirmPayout(rewardId: string): Promise<RewardPayout>;
  submitClaim(draft: NewClaim): Promise<ClaimOutcome>;
  listPendingReturns(): Promise<Claim[]>;
  confirmReturn(claimId: string): Promise<Claim>;
  listStaleItems(minDays: number): Promise<StaleItem[]>;
  login(email: string, password: string): Promise<Session>;
  /** Exchanges a Google ID token for a session; only verified @bumail.net / @bu.ac.th accounts get one. */
  loginWithGoogle(idToken: string): Promise<Session>;
  register(draft: NewAccount): Promise<Session>;
  getProfile(): Promise<UserProfile>;
  updateProfile(update: ProfileUpdate): Promise<UserProfile>;
  changePassword(change: PasswordChange): Promise<void>;
}
