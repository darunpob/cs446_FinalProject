import { ApiError } from "../errors";
import { messages } from "../../i18n/locale";
import type {
  CampusStats,
  Claim,
  ClaimOutcome,
  FoundItem,
  FoundItemQuery,
  LostFoundApi,
  LostReportReceipt,
  NewClaim,
  NewFoundItem,
  NewLostReport,
  Session,
  StaleItem,
} from "../contract";
import { campusDirectoryFixture, demoAccounts } from "../../fixtures/mockData";
import { MAX_CLAIM_ATTEMPTS, answerMatches, daysBetween, findPossibleMatches, generatePickupCode } from "./claimRules";
import type { RandomFill } from "./claimRules";
import type { MockDatabaseHandle, StoredFoundItem } from "./mockDatabase";

export interface MockApiOptions {
  database: MockDatabaseHandle;
  now?: () => Date;
  latencyMs?: number;
  randomBytes?: RandomFill;
}

function toPublicItem(stored: StoredFoundItem): FoundItem {
  const { verificationAnswer: _hiddenAnswer, returnedAt: _returnedAt, ...publicFields } = stored;
  return publicFields;
}

function placeName(placeId: string): string {
  return campusDirectoryFixture.foundLocations.find((place) => place.id === placeId)?.name ?? "";
}

function matchesQuery(stored: StoredFoundItem, query: FoundItemQuery): boolean {
  if (query.category && stored.category !== query.category) return false;
  if (query.location && stored.foundLocationId !== query.location) return false;
  if (query.status && stored.status !== query.status) return false;
  if (!query.q) return true;
  const haystack = `${stored.title} ${stored.description} ${placeName(stored.foundLocationId)}`.toLowerCase();
  return query.q.toLowerCase().trim().split(/\s+/).every((term) => haystack.includes(term));
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

function isSameMonth(iso: string | null, reference: Date): boolean {
  if (!iso) return false;
  const stamp = new Date(iso);
  return stamp.getFullYear() === reference.getFullYear() && stamp.getMonth() === reference.getMonth();
}

function authenticateDemoAccount(email: string, password: string): Session {
  const normalizedEmail = email.trim().toLowerCase();
  const account = demoAccounts.find((candidate) => candidate.email === normalizedEmail);
  const issuedAt = Date.now();
  if (account && account.password === password) {
    const user = { email: account.email, displayName: account.displayName, role: account.role };
    return { accessToken: `mock.${account.role}.${issuedAt}`, user };
  }
  if (!account && normalizedEmail.endsWith("@bumail.net") && password.length >= 6) {
    const user = { email: normalizedEmail, displayName: normalizedEmail.split("@")[0], role: "student" as const };
    return { accessToken: `mock.student.${issuedAt}`, user };
  }
  throw new ApiError("UNAUTHORIZED", messages().errors.badLogin, 401);
}

export class MockLostFoundApi implements LostFoundApi {
  private readonly database: MockDatabaseHandle;
  private readonly now: () => Date;
  private readonly latencyMs: number;
  private readonly randomBytes: RandomFill;
  private idCounter = Date.now() % 100_000;

  constructor(options: MockApiOptions) {
    this.database = options.database;
    this.now = options.now ?? (() => new Date());
    this.latencyMs = options.latencyMs ?? 350;
    this.randomBytes = options.randomBytes ?? ((bytes) => crypto.getRandomValues(bytes));
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
      const current = this.now();
      return {
        waiting: this.db.foundItems.filter((stored) => stored.status === "available").length,
        awaitingPickup: this.db.claims.filter((claim) => claim.status === "verified").length,
        returnedThisMonth: this.db.foundItems.filter((stored) => isSameMonth(stored.returnedAt, current)).length,
      };
    });
  }

  listFoundItems(query: FoundItemQuery) {
    return this.settle(() =>
      this.db.foundItems
        .filter((stored) => matchesQuery(stored, query))
        .sort((left, right) => right.foundAt.localeCompare(left.foundAt))
        .map(toPublicItem),
    );
  }

  getFoundItem(itemId: string) {
    return this.settle(() => toPublicItem(this.findStored(itemId)));
  }

  async uploadImage(photo: Blob) {
    const imageUrl = await readBlobAsDataUrl(photo);
    const imageKey = `uploads/${this.nextId("img")}.jpg`;
    this.db.images[imageKey] = imageUrl;
    return this.settle(() => ({ imageKey, imageUrl }));
  }

  createFoundItem(draft: NewFoundItem) {
    return this.settle(() => {
      requireText(draft.title, messages().errors.fields.itemTitle);
      requireText(draft.verificationQuestion, messages().errors.fields.question);
      requireText(draft.verificationAnswer, messages().errors.fields.answer);
      const stored: StoredFoundItem = {
        id: this.nextId("itm"),
        title: draft.title.trim(),
        description: draft.description.trim(),
        category: draft.category,
        foundLocationId: draft.foundLocationId,
        dropOffPointId: draft.dropOffPointId,
        foundAt: draft.foundAt,
        reportedAt: this.now().toISOString(),
        imageUrl: draft.imageKey ? this.db.images[draft.imageKey] ?? null : null,
        status: "available",
        verificationQuestion: draft.verificationQuestion.trim(),
        verificationAnswer: draft.verificationAnswer.trim(),
        returnedAt: null,
      };
      this.db.foundItems.unshift(stored);
      this.database.persist();
      return toPublicItem(stored);
    });
  }

  createLostReport(draft: NewLostReport) {
    return this.settle((): LostReportReceipt => {
      requireText(draft.title, messages().errors.fields.lostWhat);
      requireText(draft.contact.name, messages().errors.fields.reporterName);
      const report = { ...draft, id: this.nextId("lst"), createdAt: this.now().toISOString() };
      this.db.lostReports.unshift(report);
      this.database.persist();
      const candidates = this.db.foundItems.map(toPublicItem);
      return { id: report.id, createdAt: report.createdAt, possibleMatches: findPossibleMatches(draft, candidates) };
    });
  }

  submitClaim(draft: NewClaim) {
    return this.settle(() => this.evaluateClaim(draft));
  }

  private evaluateClaim(draft: NewClaim): ClaimOutcome {
    const stored = this.findStored(draft.itemId);
    if (stored.status !== "available") throw new ApiError("CONFLICT", messages().errors.alreadyClaimed, 409);
    const attemptKey = `${draft.itemId}:${draft.studentId.trim()}`;
    const usedAttempts = this.db.failedAttempts[attemptKey] ?? 0;
    if (usedAttempts >= MAX_CLAIM_ATTEMPTS) {
      throw new ApiError("TOO_MANY_ATTEMPTS", messages().errors.tooManyAttempts, 429);
    }
    if (!answerMatches(draft.answer, stored.verificationAnswer)) {
      this.db.failedAttempts[attemptKey] = usedAttempts + 1;
      this.database.persist();
      return { status: "rejected", attemptsLeft: MAX_CLAIM_ATTEMPTS - usedAttempts - 1 };
    }
    const claim = this.recordVerifiedClaim(stored, draft);
    return { status: "verified", claimId: claim.id, pickupCode: claim.pickupCode, dropOffPointId: claim.dropOffPointId };
  }

  private recordVerifiedClaim(stored: StoredFoundItem, draft: NewClaim): Claim {
    const claim: Claim = {
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
    };
    stored.status = "claimed";
    this.db.claims.unshift(claim);
    this.database.persist();
    return claim;
  }

  listPendingReturns() {
    return this.settle(() => this.db.claims.filter((claim) => claim.status === "verified").map((claim) => ({ ...claim })));
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
      this.database.persist();
      return { ...claim };
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

  login(email: string, password: string) {
    return this.settle(() => authenticateDemoAccount(email, password));
  }
}
