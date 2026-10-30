import type { Claim, FoundItem, LostReportStatus, NewLostReport, Reward, UserProfile } from "../contract";
import { SAMPLE_FINDER_EMAIL, SAMPLE_OWNER_EMAIL, demoAccounts, foundItemSeeds, lostReportSeeds, pendingClaimSeeds } from "../../fixtures/mockData";
import type { FoundItemSeed, LostReportSeed } from "../../fixtures/mockData";
import { holdReward, noticeExpiresAt, openReward } from "./rewardLedger";

export interface StoredFoundItem extends FoundItem {
  verificationAnswer: string;
  returnedAt: string | null;
  /** Account of a signed-in finder — the only person a reward can be released to. */
  finderEmail: string | null;
  /** Lost notice the finder answered from the public board; optional so databases saved before v7 still load. */
  answersLostReportId?: string | null;
  /** The notice owner said this find is not theirs: it is public now, and that owner may not claim it. */
  declinedByOwner?: boolean;
}

export interface StoredReward extends Reward {
  checkoutSessionId: string | null;
  finderEmail: string | null;
  itemTitle: string | null;
}

export interface StoredLostReport extends NewLostReport {
  id: string;
  createdAt: string;
  /** Account email taken from the session token, never from the contact form. */
  ownerEmail: string;
  imageUrls: string[];
  status: LostReportStatus;
  closedAt: string | null;
  reward: StoredReward | null;
}

export interface StoredClaim extends Claim {
  /** Account email of a signed-in claimant; null for anonymous claims. */
  ownerEmail: string | null;
  lostReportId: string | null;
}

/** Stands in for the SES e-mail telling a notice owner that a finder sent something in. */
export interface StoredNotification {
  to: string;
  lostReportId: string;
  itemId: string;
  sentAt: string;
}

/** Plain-text password is acceptable only because this database never leaves the browser. */
export interface StoredAccount extends UserProfile {
  password: string;
}

export interface MockDatabase {
  schemaVersion: 1;
  foundItems: StoredFoundItem[];
  lostReports: StoredLostReport[];
  claims: StoredClaim[];
  failedAttempts: Record<string, number>;
  images: Record<string, string>;
  accounts: StoredAccount[];
  outbox: StoredNotification[];
}

/** Bumped to v3 so browsers holding a v2 database pick up the sample lost notices. */
const STORAGE_KEY = "bu-lf-mock-db-v3";
const HOUR_MS = 3_600_000;

function seedTimestamp(now: Date, seed: Pick<FoundItemSeed, "daysAgo" | "hour">): Date {
  const stamp = new Date(now);
  stamp.setDate(stamp.getDate() - seed.daysAgo);
  stamp.setHours(seed.hour, 15, 0, 0);
  return stamp > now ? new Date(now.getTime() - HOUR_MS) : stamp;
}

function seedFoundItem(now: Date, seed: FoundItemSeed): StoredFoundItem {
  const foundAt = seedTimestamp(now, seed);
  const reportedAt = new Date(Math.min(foundAt.getTime() + HOUR_MS / 2, now.getTime()));
  const returnedAt = seed.status === "returned" ? new Date(foundAt.getTime() + 26 * HOUR_MS) : null;
  return {
    id: seed.id,
    title: seed.title,
    description: seed.description,
    category: seed.category,
    foundLocationId: seed.foundLocationId,
    dropOffPointId: seed.dropOffPointId,
    foundAt: foundAt.toISOString(),
    reportedAt: reportedAt.toISOString(),
    imageUrl: null,
    imageUrls: [],
    cardNumberMasked: false,
    status: seed.status,
    verificationQuestion: seed.verificationQuestion,
    aiLabels: seed.aiLabels,
    verificationAnswer: seed.verificationAnswer,
    returnedAt: returnedAt ? returnedAt.toISOString() : null,
    finderEmail: seed.answersLostReportId ? SAMPLE_FINDER_EMAIL : null,
    answersLostReportId: seed.answersLostReportId ?? null,
  };
}

function seedLostReport(now: Date, seed: LostReportSeed): StoredLostReport {
  const lostAt = seedTimestamp(now, seed);
  const createdAt = new Date(Math.min(lostAt.getTime() + HOUR_MS, now.getTime())).toISOString();
  const reward = openReward(`rwd-${seed.id}`, seed.rewardAmount);
  if (reward) holdReward(reward, new Date(createdAt), noticeExpiresAt(createdAt));
  return {
    id: seed.id,
    title: seed.title,
    description: seed.description,
    category: seed.category,
    lastSeenLocationId: seed.lastSeenLocationId,
    lostAt: lostAt.toISOString(),
    imageKeys: [],
    imageUrls: [],
    studentId: "",
    contact: { name: "", email: SAMPLE_OWNER_EMAIL, lineId: "", phone: "" },
    rewardAmount: seed.rewardAmount,
    createdAt,
    ownerEmail: SAMPLE_OWNER_EMAIL,
    status: "searching",
    closedAt: null,
    reward,
  };
}

function seedClaims(now: Date, foundItems: StoredFoundItem[]): StoredClaim[] {
  return pendingClaimSeeds.flatMap((seed) => {
    const claimedItem = foundItems.find((candidate) => candidate.id === seed.itemId);
    if (!claimedItem) return [];
    return [{
      id: seed.id,
      itemId: claimedItem.id,
      itemTitle: claimedItem.title,
      itemCategory: claimedItem.category,
      claimantName: seed.claimantName,
      studentId: seed.studentId,
      contact: seed.contact,
      dropOffPointId: claimedItem.dropOffPointId,
      pickupCode: seed.pickupCode,
      status: "verified" as const,
      createdAt: new Date(now.getTime() - seed.hoursAgo * HOUR_MS).toISOString(),
      returnedAt: null,
      ownerEmail: seed.ownerEmail ?? null,
      lostReportId: seed.lostReportId ?? null,
    }];
  });
}

function seedAccounts(): StoredAccount[] {
  return demoAccounts.map((account) => ({ ...account, studentId: "", phone: "", lineId: "" }));
}

export function seedDatabase(now: Date): MockDatabase {
  const foundItems = foundItemSeeds.map((seed) => seedFoundItem(now, seed));
  return {
    schemaVersion: 1,
    foundItems,
    lostReports: lostReportSeeds.map((seed) => seedLostReport(now, seed)),
    claims: seedClaims(now, foundItems),
    failedAttempts: {},
    images: {},
    accounts: seedAccounts(),
    outbox: [],
  };
}

function isMockDatabase(candidate: unknown): candidate is MockDatabase {
  return typeof candidate === "object" && candidate !== null && (candidate as MockDatabase).schemaVersion === 1;
}

export interface MockDatabaseHandle {
  db: MockDatabase;
  persist(): void;
  reset(): void;
}

export function openMockDatabase(storage: Storage | null, now: () => Date): MockDatabaseHandle {
  const handle: MockDatabaseHandle = {
    db: loadDatabase(storage) ?? seedDatabase(now()),
    persist: () => saveDatabase(storage, handle.db),
    reset: () => {
      handle.db = seedDatabase(now());
      handle.persist();
    },
  };
  return handle;
}

/** Databases saved before reports had owners or rewards keep loading; old reports belong to no one and carry no reward. */
function upgradeOwnership(db: MockDatabase): void {
  db.lostReports = db.lostReports.map((report) => ({
    ...report,
    ownerEmail: report.ownerEmail ?? "",
    status: report.status ?? "searching",
    closedAt: report.closedAt ?? null,
    rewardAmount: report.rewardAmount ?? 0,
    reward: report.reward ?? null,
    imageKeys: report.imageKeys ?? [],
    imageUrls: report.imageUrls ?? [],
  }));
  db.claims = db.claims.map((claim) => ({ ...claim, ownerEmail: claim.ownerEmail ?? null, lostReportId: claim.lostReportId ?? null }));
  db.foundItems = db.foundItems.map((stored) => ({
    ...stored,
    finderEmail: stored.finderEmail ?? null,
    imageUrls: stored.imageUrls ?? (stored.imageUrl ? [stored.imageUrl] : []),
    cardNumberMasked: stored.cardNumberMasked ?? false,
  }));
  db.outbox = db.outbox ?? [];
}

function loadDatabase(storage: Storage | null): MockDatabase | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!isMockDatabase(parsed)) return null;
    if (!Array.isArray(parsed.accounts)) parsed.accounts = seedAccounts();
    upgradeOwnership(parsed);
    return parsed;
  } catch (storageError) {
    console.warn("Mock database could not be loaded; starting fresh", storageError);
    return null;
  }
}

function saveDatabase(storage: Storage | null, db: MockDatabase): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (storageError) {
    console.warn("Mock database could not be saved; changes stay in memory only", storageError);
  }
}

export function browserStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch (storageError) {
    console.warn("localStorage is unavailable", storageError);
    return null;
  }
}
