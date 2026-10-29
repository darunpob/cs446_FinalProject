/**
 * Shared shapes for the REST API (CloudFront /api/* → ALB → EC2 Auto Scaling → RDS).
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
  imageUrl: string | null;
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
  imageKey: string | null;
  verificationQuestion: string;
  verificationAnswer: string;
}

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
  /** 10-digit student ID, or "" — lets the backend match a photographed student card to this report. */
  studentId: string;
  contact: ContactChannels;
}

export interface LostReportReceipt {
  id: string;
  createdAt: string;
  possibleMatches: FoundItem[];
}

export type LostReportStatus = "searching" | "found" | "cancelled";

export type LostReportCloseReason = Exclude<LostReportStatus, "searching">;

/** A lost report as its owner sees it. `possibleMatches` is recomputed on every read and is [] once closed. */
export interface MyLostReport {
  id: string;
  title: string;
  description: string;
  category: CategoryId;
  lastSeenLocationId: string;
  lostAt: string;
  createdAt: string;
  status: LostReportStatus;
  closedAt: string | null;
  possibleMatches: FoundItem[];
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
 * All the public "still looking for" board may show. Description, student ID and contact are left out
 * on purpose: an owner's description often holds the answer to a finder's verification question.
 */
export interface PublicLostReport {
  id: string;
  title: string;
  category: CategoryId;
  lastSeenLocationId: string;
  lostAt: string;
}

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
