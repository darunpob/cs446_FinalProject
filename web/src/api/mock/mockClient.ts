import { ApiError } from "../errors";
import { messages } from "../../i18n/locale";
import type {
  CampusStats,
  Claim,
  ClaimOutcome,
  FoundItem,
  FindStage,
  FoundItemQuery,
  LostFoundApi,
  LostNoticeProgress,
  LostReportQuery,
  LostReportReceipt,
  MyClaim,
  MyFind,
  MyLostReport,
  MyLostReports,
  NewAccount,
  NewClaim,
  NewFoundItem,
  NewLostReport,
  PasswordChange,
  ProfileUpdate,
  PublicLostReport,
  RewardCheckout,
  Session,
  Submission,
  StaleItem,
  UserProfile,
} from "../contract";
import { DESCRIPTION_MAX_LENGTH, LOST_REPORT_EXPIRY_DAYS, MAX_PHOTOS, PICKUP_HOLD_DAYS, SUBMISSION_ANSWER_DAYS, MIN_PASSWORD_LENGTH, REWARD_MAX_BAHT, REWARD_MIN_BAHT, TITLE_MAX_LENGTH, isUniversityEmail } from "../contract";
import { campusDirectoryFixture, simulatedAiLabels } from "../../fixtures/mockData";
import { MAX_CLAIM_ATTEMPTS, MAX_ITEM_ATTEMPTS, answerMatches, daysBetween, findPossibleMatches, generatePickupCode } from "./claimRules";
import type { RandomFill } from "./claimRules";
import { readGoogleIdentity } from "./googleIdToken";
import type { MockDatabaseHandle, StoredAccount, StoredClaim, StoredFoundItem, StoredLostReport } from "./mockDatabase";
import { isValidRewardAmount, openReward, releaseOnReturn, settleWithoutFinder, toFinderReward, toPayout, toReward } from "./rewardLedger";

type ClaimantDetails = Pick<NewClaim, "claimantName" | "studentId" | "contact">;

export interface MockApiOptions {
  database: MockDatabaseHandle;
  now?: () => Date;
  latencyMs?: number;
  randomBytes?: RandomFill;
  /** Bearer token of the signed-in user, read the same way the HTTP client reads it. */
  getAccessToken?: () => string | null;
  /** OAuth client ID the Google ID token must be issued for; empty disables Google sign-in. */
  googleClientId?: string;
}

function toPublicItem(stored: StoredFoundItem): FoundItem {
  const { verificationAnswer: _hiddenAnswer, returnedAt: _returnedAt, finderEmail: _finderEmail, answersLostReportId: _answers, declinedByOwner: _declined, ...publicFields } = stored;
  return publicFields;
}

function toPublicClaim(stored: StoredClaim): Claim {
  const { ownerEmail: _ownerEmail, lostReportId: _lostReportId, ...claim } = stored;
  return claim;
}

function toMyClaim(stored: StoredClaim): MyClaim {
  const { id, itemId, itemTitle, itemCategory, pickupCode, dropOffPointId, status, createdAt } = stored;
  return { claimId: id, itemId, itemTitle, itemCategory, pickupCode, dropOffPointId, status, createdAt };
}

/** A find sent to `report` through "I found this" that still waits at the drop-off point for the owner's answer. */
function isOpenSubmission(stored: StoredFoundItem, report: StoredLostReport): boolean {
  return stored.answersLostReportId === report.id && !stored.declinedByOwner && stored.status === "available";
}

const DAY_MS = 86_400_000;

function daysAfter(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * DAY_MS).toISOString();
}

function placeName(placeId: string): string {
  return campusDirectoryFixture.foundLocations.find((place) => place.id === placeId)?.name ?? "";
}

function matchesText(haystack: string, q: string | undefined): boolean {
  if (!q) return true;
  const text = haystack.toLowerCase();
  return q.toLowerCase().trim().split(/\s+/).every((term) => text.includes(term));
}

function matchesQuery(stored: StoredFoundItem, query: FoundItemQuery): boolean {
  if (query.category && stored.category !== query.category) return false;
  if (query.location && stored.foundLocationId !== query.location) return false;
  if (query.status && stored.status !== query.status) return false;
  return matchesText(`${stored.title} ${stored.description} ${placeName(stored.foundLocationId)} ${stored.aiLabels.join(" ")}`, query.q);
}

function matchesLostQuery(report: StoredLostReport, query: LostReportQuery): boolean {
  if (query.category && report.category !== query.category) return false;
  if (query.location && report.lastSeenLocationId !== query.location) return false;
  return matchesText(`${report.title} ${report.description} ${placeName(report.lastSeenLocationId)}`, query.q);
}

function readBlobAsDataUrl(photo: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new ApiError("SERVER", messages().errors.readPhotoFailed));
    reader.readAsDataURL(photo);
  });
}

function requireText(value: string, fieldLabel: string): void {
  if (!value.trim()) throw new ApiError("VALIDATION", messages().errors.required(fieldLabel), 400);
}

function requireMaxLength(value: string, maxLength: number, fieldLabel: string): void {
  if (value.trim().length > maxLength) throw new ApiError("VALIDATION", messages().errors.tooLong(fieldLabel, maxLength), 400);
}

function requireNoticeText(title: string, description: string, titleLabel: string): void {
  requireText(title, titleLabel);
  requireMaxLength(title, TITLE_MAX_LENGTH, titleLabel);
  requireMaxLength(description, DESCRIPTION_MAX_LENGTH, messages().errors.fields.description);
}

function isSameMonth(iso: string | null, reference: Date): boolean {
  if (!iso) return false;
  const stamp = new Date(iso);
  return stamp.getFullYear() === reference.getFullYear() && stamp.getMonth() === reference.getMonth();
}

const MOCK_TOKEN_PATTERN = /^mock\.\d+\.(.+)$/;
const PHONE_PATTERN = /^0\d{8,9}$/;
const STUDENT_ID_PATTERN = /^\d{10}$/;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function issueSession(account: StoredAccount, issuedAt: number): Session {
  const user = { email: account.email, displayName: account.displayName, role: account.role };
  return { accessToken: `mock.${issuedAt}.${account.email}`, user };
}

function toProfile(account: StoredAccount): UserProfile {
  const { password: _hiddenPassword, ...profile } = account;
  return profile;
}

function requirePasswordLength(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) throw new ApiError("VALIDATION", messages().errors.passwordTooShort(MIN_PASSWORD_LENGTH), 400);
}

function validateProfileUpdate(update: ProfileUpdate): void {
  requireText(update.displayName, messages().errors.fields.displayName);
  const studentId = update.studentId.trim();
  if (studentId && !STUDENT_ID_PATTERN.test(studentId)) throw new ApiError("VALIDATION", messages().reportLost.studentIdInvalid, 400);
  const phone = update.phone.replace(/[\s-]/g, "");
  if (phone && !PHONE_PATTERN.test(phone)) throw new ApiError("VALIDATION", messages().reportLost.phoneInvalid, 400);
}

export class MockLostFoundApi implements LostFoundApi {
  private readonly database: MockDatabaseHandle;
  private readonly now: () => Date;
  private readonly latencyMs: number;
  private readonly randomBytes: RandomFill;
  private readonly getAccessToken: () => string | null;
  private readonly googleClientId: string;
  private idCounter = Date.now() % 100_000;

  constructor(options: MockApiOptions) {
    this.database = options.database;
    this.now = options.now ?? (() => new Date());
    this.latencyMs = options.latencyMs ?? 350;
    this.randomBytes = options.randomBytes ?? ((bytes) => crypto.getRandomValues(bytes));
    this.getAccessToken = options.getAccessToken ?? (() => null);
    this.googleClientId = options.googleClientId ?? "";
  }

  private get db() {
    return this.database.db;
  }

  private settle<Body>(produce: () => Body): Promise<Body> {
    const jitter = this.latencyMs ? this.latencyMs * (0.6 + Math.random() * 0.8) : 0;
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          resolve(produce());
        } catch (failure) {
          reject(failure);
        }
      }, jitter);
    });
  }

  private nextId(prefix: string): string {
    this.idCounter += 1;
    const salt = this.randomBytes(new Uint8Array(1))[0].toString(16);
    return `${prefix}-${this.idCounter.toString(36)}${salt}`;
  }

  private findStored(itemId: string): StoredFoundItem {
    const stored = this.db.foundItems.find((candidate) => candidate.id === itemId);
    if (!stored) throw new ApiError("NOT_FOUND", messages().errors.itemNotFound, 404);
    return stored;
  }

  getDirectory() {
    return this.settle(() => structuredClone(campusDirectoryFixture));
  }

  getStats() {
    return this.settle((): CampusStats => {
      this.sweepDeadlines();
      const current = this.now();
      const open = this.db.lostReports.filter((report) => report.status === "searching");
      return {
        waiting: this.db.foundItems.filter((stored) => stored.status === "available").length,
        awaitingPickup: this.db.claims.filter((claim) => claim.status === "verified").length,
        returnedThisMonth: this.db.foundItems.filter((stored) => isSameMonth(stored.returnedAt, current)).length,
        lostSearching: open.length,
        lostFoundThisMonth: this.db.lostReports.filter((report) => report.status === "found" && isSameMonth(report.closedAt, current)).length,
        lostAwaitingPickup: open.filter((report) => this.noticeProgress(report) === "awaiting_pickup").length,
      };
    });
  }

  private answeredReport(stored: StoredFoundItem): StoredLostReport | undefined {
    if (!stored.answersLostReportId) return undefined;
    return this.db.lostReports.find((report) => report.id === stored.answersLostReportId);
  }

  /** Finds sent to an open notice stay between the finder and that notice's owner until the owner declines them. */
  private isHiddenSubmission(stored: StoredFoundItem): boolean {
    return !stored.declinedByOwner && this.answeredReport(stored)?.status === "searching";
  }

  private publicItems(): StoredFoundItem[] {
    return this.db.foundItems.filter((stored) => !this.isHiddenSubmission(stored));
  }

  private noticeProgress(report: StoredLostReport): LostNoticeProgress {
    if (this.pickupClaim(report)) return "awaiting_pickup";
    return this.db.foundItems.some((stored) => isOpenSubmission(stored, report)) ? "found" : "searching";
  }

  listFoundItems(query: FoundItemQuery) {
    return this.settle(() => {
      this.sweepDeadlines();
      return this.publicItems()
        .filter((stored) => matchesQuery(stored, query))
        .sort((left, right) => right.foundAt.localeCompare(left.foundAt))
        .map(toPublicItem);
    });
  }

  /** Unknown keys are dropped, the same way the real backend ignores keys it never issued. */
  private resolveImages(imageKeys: string[]): string[] {
    if (imageKeys.length > MAX_PHOTOS) throw new ApiError("VALIDATION", messages().errors.tooManyPhotos(MAX_PHOTOS), 400);
    return imageKeys.flatMap((imageKey) => this.db.images[imageKey] ?? []);
  }

  /** A private find is visible to its finder and to the owner of the notice it answers; to anyone else it does not exist. */
  private findVisible(itemId: string): StoredFoundItem {
    const stored = this.findStored(itemId);
    if (!this.isHiddenSubmission(stored)) return stored;
    const viewer = this.signedInAccount()?.email;
    if (viewer && (viewer === stored.finderEmail || viewer === this.answeredReport(stored)?.ownerEmail)) return stored;
    throw new ApiError("NOT_FOUND", messages().errors.itemNotFound, 404);
  }

  getFoundItem(itemId: string) {
    return this.settle(() => toPublicItem(this.findVisible(itemId)));
  }

  async uploadImage(photo: Blob) {
    const imageUrl = await readBlobAsDataUrl(photo);
    const imageKey = `uploads/${this.nextId("img")}.jpg`;
    this.db.images[imageKey] = imageUrl;
    return this.settle(() => ({ imageKey, imageUrl }));
  }

  createFoundItem(draft: NewFoundItem) {
    return this.settle(() => {
      const finder = this.requireSignedIn();
      requireNoticeText(draft.title, draft.description, messages().errors.fields.itemTitle);
      const answered = this.requireAnswerable(draft.answersLostReportId ?? "", finder);
      if (!answered) {
        requireText(draft.verificationQuestion, messages().errors.fields.question);
        requireText(draft.verificationAnswer, messages().errors.fields.answer);
      }
      const imageUrls = this.resolveImages(draft.imageKeys);
      const stored: StoredFoundItem = {
        id: this.nextId("itm"),
        title: draft.title.trim(),
        description: draft.description.trim(),
        category: draft.category,
        foundLocationId: draft.foundLocationId,
        dropOffPointId: draft.dropOffPointId,
        foundAt: draft.foundAt,
        reportedAt: this.now().toISOString(),
        imageUrl: imageUrls[0] ?? null,
        imageUrls,
        cardNumberMasked: false,
        status: "available",
        verificationQuestion: draft.verificationQuestion.trim(),
        verificationAnswer: draft.verificationAnswer.trim(),
        aiLabels: imageUrls.length > 0 ? simulatedAiLabels[draft.category] : [],
        returnedAt: null,
        finderEmail: finder.email,
        answersLostReportId: null,
        answerDueAt: null,
      };
      stored.answersLostReportId = answered?.id ?? null;
      stored.answerDueAt = answered ? daysAfter(stored.reportedAt, SUBMISSION_ANSWER_DAYS) : null;
      this.db.foundItems.unshift(stored);
      if (answered) this.notifyOwner(answered, stored);
      this.database.persist();
      return toPublicItem(stored);
    });
  }

  /** A finder may only answer a notice that is still open; answering their own simply posts the item publicly. */
  private requireAnswerable(reportId: string, finder: StoredAccount): StoredLostReport | null {
    if (!reportId) return null;
    const report = this.db.lostReports.find((candidate) => candidate.id === reportId);
    if (report?.status !== "searching") throw new ApiError("VALIDATION", messages().errors.lostReportLinkInvalid, 400);
    return report.ownerEmail === finder.email ? null : report;
  }

  /** The real backend sends this through SES with a link to /#/my-reports?report=<id>. */
  private notifyOwner(report: StoredLostReport, stored: StoredFoundItem): void {
    this.db.outbox.push({ to: report.ownerEmail, lostReportId: report.id, itemId: stored.id, sentAt: this.now().toISOString() });
  }

  createLostReport(draft: NewLostReport) {
    return this.settle((): LostReportReceipt => {
      const owner = this.requireSignedIn();
      requireNoticeText(draft.title, draft.description, messages().errors.fields.lostWhat);
      requireText(draft.contact.name, messages().errors.fields.reporterName);
      if (!isUniversityEmail(draft.contact.email)) throw new ApiError("VALIDATION", messages().reportLost.emailNotUniversity, 400);
      if (!isValidRewardAmount(draft.rewardAmount)) throw new ApiError("VALIDATION", messages().errors.rewardInvalid(REWARD_MIN_BAHT, REWARD_MAX_BAHT), 400);
      const report: StoredLostReport = {
        ...draft,
        imageUrls: this.resolveImages(draft.imageKeys),
        id: this.nextId("lst"),
        createdAt: this.now().toISOString(),
        ownerEmail: owner.email,
        status: "searching",
        closedAt: null,
        reward: openReward(this.nextId("rwd"), draft.rewardAmount),
      };
      this.db.lostReports.unshift(report);
      this.database.persist();
      const candidates = this.publicItems().map(toPublicItem);
      return { id: report.id, createdAt: report.createdAt, possibleMatches: findPossibleMatches(draft, candidates), reward: toReward(report.reward) };
    });
  }

  /**
   * Stands in for the scheduled EventBridge job: closes notices open longer than LOST_REPORT_EXPIRY_DAYS and refunds
   * their reward minus the fee. A notice with a find still waiting for the owner, or a confirmed pickup, is left open.
   */
  private expireOldReports(): number {
    const cutoff = new Date(this.now().getTime() - LOST_REPORT_EXPIRY_DAYS * DAY_MS).toISOString();
    const stale = this.db.lostReports.filter((report) => report.status === "searching" && report.createdAt <= cutoff && this.noticeProgress(report) === "searching");
    stale.forEach((report) => {
      report.status = "expired";
      report.closedAt = this.now().toISOString();
      settleWithoutFinder(report.reward, this.now());
    });
    return stale.length;
  }

  private answerDeadline(stored: StoredFoundItem): string {
    return stored.answerDueAt ?? daysAfter(stored.reportedAt, SUBMISSION_ANSWER_DAYS);
  }

  private pickupClaim(report: StoredLostReport): StoredClaim | undefined {
    return this.db.claims.find((claim) => claim.lostReportId === report.id && claim.status === "verified");
  }

  /** An owner who never came: the pickup code lapses and the find waits for their answer again, with a fresh deadline. */
  private releaseLapsedPickup(claim: StoredClaim): void {
    this.db.claims = this.db.claims.filter((candidate) => candidate.id !== claim.id);
    const stored = this.findStored(claim.itemId);
    stored.status = "available";
    stored.answerDueAt = daysAfter(this.now().toISOString(), SUBMISSION_ANSWER_DAYS);
  }

  /**
   * Stands in for the daily scheduled job, so no case waits on a person forever: lapsed pickups are released, finds the
   * owner ignored for SUBMISSION_ANSWER_DAYS go public as if declined, then old notices expire.
   */
  private sweepDeadlines(): void {
    const nowIso = this.now().toISOString();
    const lapsed = this.db.claims.filter((claim) => claim.lostReportId && claim.status === "verified" && daysAfter(claim.createdAt, PICKUP_HOLD_DAYS) <= nowIso);
    lapsed.forEach((claim) => this.releaseLapsedPickup(claim));
    const ignored = this.db.foundItems.filter((stored) => stored.status === "available" && this.isHiddenSubmission(stored) && this.answerDeadline(stored) <= nowIso);
    ignored.forEach((stored) => { stored.declinedByOwner = true; });
    if (lapsed.length + ignored.length + this.expireOldReports() > 0) this.database.persist();
  }

  private toSubmission(stored: StoredFoundItem): Submission {
    return { ...toPublicItem(stored), answerBy: this.answerDeadline(stored) };
  }

  private toMyLostReport(report: StoredLostReport): MyLostReport {
    const { id, title, description, category, lastSeenLocationId, lostAt, imageUrls, createdAt, status, closedAt } = report;
    const searching = status === "searching";
    const submissions = searching ? this.db.foundItems.filter((stored) => isOpenSubmission(stored, report)).map((stored) => this.toSubmission(stored)) : [];
    const pickup = searching ? this.pickupClaim(report) : undefined;
    const candidates = this.publicItems().filter((stored) => stored.answersLostReportId !== report.id).map(toPublicItem);
    return {
      id, title, description, category, lastSeenLocationId, lostAt, imageUrls, createdAt, status, closedAt,
      progress: searching ? this.noticeProgress(report) : "searching",
      submissions,
      pickupBy: pickup ? daysAfter(pickup.createdAt, PICKUP_HOLD_DAYS) : null,
      possibleMatches: searching ? findPossibleMatches(report, candidates) : [],
      reward: toReward(report.reward),
    };
  }

  private toPublicLostReport(report: StoredLostReport): PublicLostReport {
    const { id, title, description, category, lastSeenLocationId, lostAt, imageUrls } = report;
    const progress = report.status === "found" ? "returned" : this.noticeProgress(report);
    return { id, title, description, category, lastSeenLocationId, lostAt, imageUrls, hasReward: report.reward?.status === "held", progress };
  }

  listMyLostReports() {
    return this.settle((): MyLostReports => {
      const owner = this.requireSignedIn();
      this.sweepDeadlines();
      return {
        reports: this.db.lostReports.filter((report) => report.ownerEmail === owner.email).map((report) => this.toMyLostReport(report)),
        claims: this.db.claims.filter((claim) => claim.ownerEmail === owner.email).map(toMyClaim),
      };
    });
  }

  private findOwnReport(reportId: string, owner: StoredAccount): StoredLostReport {
    const report = this.db.lostReports.find((candidate) => candidate.id === reportId && candidate.ownerEmail === owner.email);
    if (!report) throw new ApiError("NOT_FOUND", messages().errors.lostReportNotFound, 404);
    return report;
  }

  startRewardCheckout(reportId: string) {
    return this.settle((): RewardCheckout => {
      const report = this.findOwnReport(reportId, this.requireSignedIn());
      if (report.status !== "searching" || report.reward?.status !== "awaiting_payment") {
        throw new ApiError("CONFLICT", messages().errors.rewardNotPayable, 409);
      }
      report.reward.checkoutSessionId = this.nextId("cs_test");
      this.database.persist();
      return { checkoutUrl: `#/test-checkout/${report.reward.checkoutSessionId}` };
    });
  }

  listPendingPayouts() {
    return this.settle(() =>
      this.db.lostReports.flatMap((report) => {
        const reward = report.reward;
        if (reward?.status !== "pending_payout") return [];
        return [toPayout(report, reward, this.findAccount(reward.finderEmail ?? ""))];
      }),
    );
  }

  confirmPayout(rewardId: string) {
    return this.settle(() => {
      const report = this.db.lostReports.find((candidate) => candidate.reward?.id === rewardId);
      const reward = report?.reward;
      if (!report || !reward) throw new ApiError("NOT_FOUND", messages().errors.payoutNotFound, 404);
      if (reward.status !== "pending_payout") throw new ApiError("CONFLICT", messages().errors.payoutDone, 409);
      reward.status = "paid_out";
      this.database.persist();
      return toPayout(report, reward, this.findAccount(reward.finderEmail ?? ""));
    });
  }

  /** An owner who found the item alone cancels: nobody earned the reward, so it goes back minus the fee. */
  cancelLostReport(reportId: string) {
    return this.settle(() => {
      const report = this.findOwnReport(reportId, this.requireSignedIn());
      if (report.status !== "searching") throw new ApiError("CONFLICT", messages().errors.lostReportClosed, 409);
      const progress = this.noticeProgress(report);
      if (progress === "awaiting_pickup") throw new ApiError("CONFLICT", messages().errors.reportAwaitingPickup, 409);
      if (progress === "found") throw new ApiError("CONFLICT", messages().errors.reportHasSubmissions, 409);
      report.status = "cancelled";
      report.closedAt = this.now().toISOString();
      settleWithoutFinder(report.reward, this.now());
      this.database.persist();
      return this.toMyLostReport(report);
    });
  }

  private findOpenSubmission(reportId: string, itemId: string): { report: StoredLostReport; stored: StoredFoundItem; owner: StoredAccount } {
    const owner = this.requireSignedIn();
    const report = this.findOwnReport(reportId, owner);
    const stored = this.db.foundItems.find((candidate) => candidate.id === itemId);
    if (report.status !== "searching" || !stored || !isOpenSubmission(stored, report)) {
      throw new ApiError("NOT_FOUND", messages().errors.submissionNotFound, 404);
    }
    return { report, stored, owner };
  }

  confirmSubmission(reportId: string, itemId: string) {
    return this.settle((): MyClaim => {
      const { report, stored, owner } = this.findOpenSubmission(reportId, itemId);
      if (this.noticeProgress(report) === "awaiting_pickup") throw new ApiError("CONFLICT", messages().errors.submissionAlreadyConfirmed, 409);
      const contact = report.contact.phone || report.contact.lineId || owner.email;
      const claimant = { claimantName: report.contact.name || owner.displayName, studentId: report.studentId || owner.studentId, contact };
      return toMyClaim(this.recordVerifiedClaim(stored, claimant, report.id));
    });
  }

  declineSubmission(reportId: string, itemId: string) {
    return this.settle(() => {
      this.findOpenSubmission(reportId, itemId).stored.declinedByOwner = true;
      this.database.persist();
    });
  }

  private findStage(stored: StoredFoundItem, report: StoredLostReport | undefined): FindStage {
    if (stored.status === "returned") return "returned";
    if (stored.status === "claimed") return "confirmed";
    return report?.status === "searching" ? "sent" : "posted";
  }

  private toMyFind(stored: StoredFoundItem): MyFind {
    const report = stored.declinedByOwner ? undefined : this.answeredReport(stored);
    return {
      item: toPublicItem(stored),
      stage: this.findStage(stored, report),
      noticeTitle: report?.title ?? null,
      reward: report ? toFinderReward(report.reward, stored) : null,
    };
  }

  listMyFinds() {
    return this.settle(() => {
      const finder = this.requireSignedIn();
      this.sweepDeadlines();
      return this.db.foundItems
        .filter((stored) => stored.finderEmail === finder.email)
        .sort((left, right) => right.reportedAt.localeCompare(left.reportedAt))
        .map((stored) => this.toMyFind(stored));
    });
  }

  listOpenLostReports(query: LostReportQuery = {}) {
    return this.settle(() => {
      this.sweepDeadlines();
      return this.db.lostReports
        .filter((report) => (report.status === "searching" || (query.history === true && report.status === "found")) && matchesLostQuery(report, query))
        .sort((left, right) => right.lostAt.localeCompare(left.lostAt))
        .map((report) => this.toPublicLostReport(report));
    });
  }

  submitClaim(draft: NewClaim) {
    return this.settle(() => this.evaluateClaim(draft));
  }

  /**
   * A find sent to a notice can only reach that notice's owner through confirmSubmission. Once they declined it, neither
   * their account nor their student ID may claim it from the public board — that would dodge the reward.
   */
  private requireNotDeclinedOwner(stored: StoredFoundItem, claimant: StoredAccount, studentId: string): void {
    const report = this.answeredReport(stored);
    if (!report) return;
    const sameStudent = report.studentId !== "" && studentId.trim() === report.studentId;
    if (claimant.email === report.ownerEmail || sameStudent) throw new ApiError("FORBIDDEN", messages().errors.declinedOwnFind, 403);
  }

  private evaluateClaim(draft: NewClaim): ClaimOutcome {
    const claimant = this.requireSignedIn();
    const stored = this.findVisible(draft.itemId);
    if (stored.status !== "available") throw new ApiError("CONFLICT", messages().errors.alreadyClaimed, 409);
    this.requireNotDeclinedOwner(stored, claimant, draft.studentId);
    const attemptKey = `${draft.itemId}:${draft.studentId.trim()}`;
    const itemKey = `${draft.itemId}:*`;
    const usedAttempts = this.db.failedAttempts[attemptKey] ?? 0;
    const itemAttempts = this.db.failedAttempts[itemKey] ?? 0;
    if (usedAttempts >= MAX_CLAIM_ATTEMPTS || itemAttempts >= MAX_ITEM_ATTEMPTS) {
      throw new ApiError("TOO_MANY_ATTEMPTS", messages().errors.tooManyAttempts, 429);
    }
    if (!answerMatches(draft.answer, stored.verificationAnswer)) {
      this.db.failedAttempts[attemptKey] = usedAttempts + 1;
      this.db.failedAttempts[itemKey] = itemAttempts + 1;
      this.database.persist();
      const attemptsLeft = Math.min(MAX_CLAIM_ATTEMPTS - usedAttempts, MAX_ITEM_ATTEMPTS - itemAttempts) - 1;
      return { status: "rejected", attemptsLeft };
    }
    const claim = this.recordVerifiedClaim(stored, draft, null);
    return { status: "verified", claimId: claim.id, pickupCode: claim.pickupCode, dropOffPointId: claim.dropOffPointId };
  }

  /** `lostReportId` is set only by confirmSubmission, so a reward follows nothing but a find sent to its notice. */
  private recordVerifiedClaim(stored: StoredFoundItem, draft: ClaimantDetails, lostReportId: string | null): StoredClaim {
    const claim: StoredClaim = {
      id: this.nextId("clm"),
      itemId: stored.id,
      itemTitle: stored.title,
      itemCategory: stored.category,
      claimantName: draft.claimantName.trim(),
      studentId: draft.studentId.trim(),
      contact: draft.contact.trim(),
      dropOffPointId: stored.dropOffPointId,
      pickupCode: generatePickupCode(this.randomBytes),
      status: "verified",
      createdAt: this.now().toISOString(),
      returnedAt: null,
      ownerEmail: this.signedInAccount()?.email ?? null,
      lostReportId,
    };
    stored.status = "claimed";
    this.db.claims.unshift(claim);
    this.database.persist();
    return claim;
  }

  private closeLinkedReport(claim: StoredClaim, returnedItem: StoredFoundItem): void {
    const report = this.db.lostReports.find((candidate) => candidate.id === claim.lostReportId);
    if (report?.status !== "searching") return;
    report.status = "found";
    report.closedAt = this.now().toISOString();
    releaseOnReturn(report, returnedItem, this.now());
  }

  listPendingReturns() {
    return this.settle(() => {
      this.sweepDeadlines();
      return this.db.claims.filter((claim) => claim.status === "verified").map(toPublicClaim);
    });
  }

  confirmReturn(claimId: string) {
    return this.settle(() => {
      const claim = this.db.claims.find((candidate) => candidate.id === claimId);
      if (!claim) throw new ApiError("NOT_FOUND", messages().errors.claimNotFound, 404);
      if (claim.status === "returned") throw new ApiError("CONFLICT", messages().errors.alreadyReturned, 409);
      const returnedAt = this.now().toISOString();
      claim.status = "returned";
      claim.returnedAt = returnedAt;
      const stored = this.findStored(claim.itemId);
      stored.status = "returned";
      stored.returnedAt = returnedAt;
      this.closeLinkedReport(claim, stored);
      this.database.persist();
      return toPublicClaim(claim);
    });
  }

  listStaleItems(minDays: number) {
    return this.settle(() =>
      this.db.foundItems
        .filter((stored) => stored.status === "available")
        .map((stored): StaleItem => ({ ...toPublicItem(stored), daysWaiting: daysBetween(stored.foundAt, this.now()) }))
        .filter((stale) => stale.daysWaiting >= minDays)
        .sort((left, right) => right.daysWaiting - left.daysWaiting),
    );
  }

  private findAccount(email: string): StoredAccount | undefined {
    return this.db.accounts.find((candidate) => candidate.email === normalizeEmail(email));
  }

  private signedInAccount(): StoredAccount | undefined {
    const token = this.getAccessToken() ?? "";
    const email = MOCK_TOKEN_PATTERN.exec(token)?.[1];
    return email ? this.findAccount(email) : undefined;
  }

  private requireSignedIn(): StoredAccount {
    const account = this.signedInAccount();
    if (!account) throw new ApiError("UNAUTHORIZED", messages().errors.sessionExpired, 401);
    return account;
  }

  login(email: string, password: string) {
    return this.settle(() => {
      const account = this.findAccount(email);
      if (!account || !account.password || account.password !== password) throw new ApiError("UNAUTHORIZED", messages().errors.badLogin, 401);
      return issueSession(account, this.now().getTime());
    });
  }

  loginWithGoogle(idToken: string) {
    return this.settle(() => {
      if (!this.googleClientId) throw new ApiError("UNAUTHORIZED", messages().errors.googleSignInFailed, 401);
      const identity = readGoogleIdentity(idToken, this.googleClientId, this.now());
      const existing = this.findAccount(identity.email);
      if (existing) return issueSession(existing, this.now().getTime());
      const account: StoredAccount = { ...identity, password: "", role: "student", studentId: "", phone: "", lineId: "" };
      this.db.accounts.push(account);
      this.database.persist();
      return issueSession(account, this.now().getTime());
    });
  }

  register(draft: NewAccount) {
    return this.settle(() => {
      const email = normalizeEmail(draft.email);
      requireText(draft.displayName, messages().errors.fields.displayName);
      if (!isUniversityEmail(email)) throw new ApiError("VALIDATION", messages().reportLost.emailNotUniversity, 400);
      requirePasswordLength(draft.password);
      if (this.findAccount(email)) throw new ApiError("CONFLICT", messages().errors.emailTaken, 409);
      const account: StoredAccount = { email, password: draft.password, displayName: draft.displayName.trim(), role: "student", studentId: "", phone: "", lineId: "" };
      this.db.accounts.push(account);
      this.database.persist();
      return issueSession(account, this.now().getTime());
    });
  }

  getProfile() {
    return this.settle(() => toProfile(this.requireSignedIn()));
  }

  updateProfile(update: ProfileUpdate) {
    return this.settle(() => {
      const account = this.requireSignedIn();
      validateProfileUpdate(update);
      account.displayName = update.displayName.trim();
      account.studentId = update.studentId.trim();
      account.phone = update.phone.replace(/[\s-]/g, "");
      account.lineId = update.lineId.trim();
      this.database.persist();
      return toProfile(account);
    });
  }

  changePassword(change: PasswordChange) {
    return this.settle(() => {
      const account = this.requireSignedIn();
      if (account.password !== change.currentPassword) throw new ApiError("VALIDATION", messages().errors.wrongCurrentPassword, 400);
      requirePasswordLength(change.newPassword);
      account.password = change.newPassword;
      this.database.persist();
    });
  }
}
