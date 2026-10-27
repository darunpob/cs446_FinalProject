/**
 * The single entry point every page uses to talk to the backend.
 *
 *   USE_MOCK = true   → in-browser fake backend (src/fixtures/mockData.ts)
 *   USE_MOCK = false  → real REST API at API_BASE (see docs/API_CONTRACT.md)
 *
 * Both are read from .env files at build time:
 *   npm run build      → .env      (mock, for Vercel / local demos)
 *   npm run build:aws  → .env.aws  (real API, for S3 + CloudFront)
 */
import type { LostFoundApi } from "./contract";
import { createHttpApi } from "./httpClient";
import { MockLostFoundApi } from "./mock/mockClient";
import { browserStorage, openMockDatabase } from "./mock/mockDatabase";
import { readSession } from "../features/auth/sessionStore";

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

export const API_BASE = import.meta.env.VITE_API_BASE || "/api";

function createApi(): LostFoundApi {
  if (USE_MOCK) {
    const database = openMockDatabase(browserStorage(), () => new Date());
    resetMockData = database.reset;
    return new MockLostFoundApi({ database });
  }
  return createHttpApi(API_BASE, () => readSession()?.accessToken ?? null);
}

export let resetMockData: () => void = () => {
  throw new Error("resetMockData is only available when USE_MOCK is true");
};

export const api: LostFoundApi = createApi();
