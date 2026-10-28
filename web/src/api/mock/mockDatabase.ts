import type { Claim, FoundItem, NewLostReport, UserProfile } from "../contract";
import { demoAccounts, foundItemSeeds, pendingClaimSeeds } from "../../fixtures/mockData";
import type { FoundItemSeed } from "../../fixtures/mockData";

export interface StoredFoundItem extends FoundItem {
  verificationAnswer: string;
  returnedAt: string | null;
}

export interface StoredLostReport extends NewLostReport {
  id: string;
  createdAt: string;
}

/** Plain-text password is acceptable only because this database never leaves the browser. */
export interface StoredAccount extends UserProfile {
  password: string;
}

export interface MockDatabase {
  schemaVersion: 1;
  foundItems: StoredFoundItem[];
  lostReports: StoredLostReport[];
  claims: Claim[];
  failedAttempts: Record<string, number>;
  images: Record<string, string>;
  accounts: StoredAccount[];
}

const STORAGE_KEY = "bu-lf-mock-db-v2";
const HOUR_MS = 3_600_000;

function seedTimestamp(now: Date, seed: FoundItemSeed): Date {
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
    status: seed.status,
    verificationQuestion: seed.verificationQuestion,
    aiLabels: seed.aiLabels,
    verificationAnswer: seed.verificationAnswer,
    returnedAt: returnedAt ? returnedAt.toISOString() : null,
  };
}

function seedClaims(now: Date, foundItems: StoredFoundItem[]): Claim[] {
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
    lostReports: [],
    claims: seedClaims(now, foundItems),
    failedAttempts: {},
    images: {},
    accounts: seedAccounts(),
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

function loadDatabase(storage: Storage | null): MockDatabase | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!isMockDatabase(parsed)) return null;
    if (!Array.isArray(parsed.accounts)) parsed.accounts = seedAccounts();
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
