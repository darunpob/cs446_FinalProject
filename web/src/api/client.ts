import type { LostFoundApi } from "./contract";
import { createHttpApi } from "./httpClient";
import { MockLostFoundApi } from "./mock/mockClient";
import { browserStorage, openMockDatabase } from "./mock/mockDatabase";
import { readSession } from "../features/auth/sessionStore";

const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").trim();

export const isMockMode = configuredBaseUrl === "";

const mockDatabase = isMockMode ? openMockDatabase(browserStorage(), () => new Date()) : null;

export const api: LostFoundApi = mockDatabase
  ? new MockLostFoundApi({ database: mockDatabase })
  : createHttpApi(configuredBaseUrl, () => readSession()?.accessToken ?? null);

export function resetMockData(): void {
  if (!mockDatabase) throw new Error("resetMockData is only available in mock mode");
  mockDatabase.reset();
}
