import type { FoundItem, NewLostReport } from "../contract";

export const MAX_CLAIM_ATTEMPTS = 3;

export type RandomFill = (bytes: Uint8Array<ArrayBuffer>) => Uint8Array<ArrayBuffer>;

const PICKUP_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeAnswer(answer: string): string {
  return answer.normalize("NFC").toLowerCase().replace(/\s+/g, "");
}

export function answerMatches(given: string, expected: string): boolean {
  const normalizedGiven = normalizeAnswer(given);
  const normalizedExpected = normalizeAnswer(expected);
  if (!normalizedGiven || !normalizedExpected) return false;
  if (normalizedGiven === normalizedExpected) return true;
  const withinGuessBudget = normalizedGiven.length <= normalizedExpected.length * 2 + 4;
  return normalizedExpected.length >= 2 && withinGuessBudget && normalizedGiven.includes(normalizedExpected);
}

export function generatePickupCode(randomSource: RandomFill): string {
  const bytes = randomSource(new Uint8Array(6));
  return Array.from(bytes, (byte) => PICKUP_ALPHABET[byte % PICKUP_ALPHABET.length]).join("");
}

function keywordsOf(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,./()+\-]+/)
    .filter((word) => word.length >= 2);
}

export function matchScore(report: NewLostReport, candidate: FoundItem): number {
  if (candidate.status !== "available") return 0;
  const reportWords = new Set(keywordsOf(`${report.title} ${report.description}`));
  const sharedWords = keywordsOf(candidate.title).filter((word) => reportWords.has(word)).length;
  const categoryPoints = candidate.category === report.category ? 2 : 0;
  const locationPoints = candidate.foundLocationId === report.lastSeenLocationId ? 1 : 0;
  return categoryPoints + locationPoints + sharedWords;
}

export function findPossibleMatches(report: NewLostReport, candidates: FoundItem[], limit = 3): FoundItem[] {
  return candidates
    .map((candidate) => ({ candidate, score: matchScore(report, candidate) }))
    .filter((scored) => scored.score >= 2)
    .sort((left, right) => right.score - left.score || right.candidate.foundAt.localeCompare(left.candidate.foundAt))
    .slice(0, limit)
    .map((scored) => scored.candidate);
}

export function daysBetween(fromIso: string, to: Date): number {
  return Math.floor((to.getTime() - new Date(fromIso).getTime()) / 86_400_000);
}
