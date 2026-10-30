import { describe, expect, it } from "vitest";
import { MockLostFoundApi } from "../src/api/mock/mockClient";
import { openMockDatabase } from "../src/api/mock/mockDatabase";
import { ApiError } from "../src/api/errors";
import { validateRegistration } from "../src/features/auth/registerForm";

function freshApi() {
  const now = () => new Date("2026-10-28T10:00:00+07:00");
  const tokenHolder: { current: string | null } = { current: null };
  const api = new MockLostFoundApi({ database: openMockDatabase(null, now), now, latencyMs: 0, getAccessToken: () => tokenHolder.current });
  return { api, tokenHolder };
}

const newcomer = { email: "Somchai.K@bumail.net", password: "longenough", displayName: "สมชาย" };

describe("mock accounts", () => {
  it("registers a student and signs them in", async () => {
    const { api } = freshApi();
    const session = await api.register(newcomer);
    expect(session.user).toEqual({ email: "somchai.k@bumail.net", displayName: "สมชาย", role: "student" });
    await expect(api.login("somchai.k@bumail.net", "longenough")).resolves.toHaveProperty("accessToken");
  });

  it("rejects duplicate, non-university and short-password sign-ups", async () => {
    const { api } = freshApi();
    await api.register(newcomer);
    await expect(api.register(newcomer)).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(api.register({ ...newcomer, email: "x@gmail.com" })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(api.register({ ...newcomer, email: "y@bumail.net", password: "short" })).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("no longer signs in unknown emails", async () => {
    const { api } = freshApi();
    await expect(api.login("nobody@bumail.net", "whatever123")).rejects.toBeInstanceOf(ApiError);
  });

  it("lets any role read and update their own profile", async () => {
    const { api, tokenHolder } = freshApi();
    tokenHolder.current = (await api.login("guard@bu.ac.th", "guard1234")).accessToken;
    const updated = await api.updateProfile({ displayName: "รปภ. ประตู 2", studentId: "", phone: "081-234-5678", lineId: "gate2" });
    expect(updated).toMatchObject({ role: "guard", displayName: "รปภ. ประตู 2", phone: "0812345678", lineId: "gate2" });
    expect(updated).not.toHaveProperty("password");
    await expect(api.getProfile()).resolves.toEqual(updated);
  });

  it("requires a session for profile endpoints", async () => {
    const { api } = freshApi();
    await expect(api.getProfile()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("changes the password only with the current one", async () => {
    const { api, tokenHolder } = freshApi();
    tokenHolder.current = (await api.login("student@bumail.net", "student1234")).accessToken;
    await expect(api.changePassword({ currentPassword: "wrong", newPassword: "brandnew123" })).rejects.toMatchObject({ code: "VALIDATION" });
    await api.changePassword({ currentPassword: "student1234", newPassword: "brandnew123" });
    await expect(api.login("student@bumail.net", "student1234")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(api.login("student@bumail.net", "brandnew123")).resolves.toHaveProperty("accessToken");
  });
});

describe("validateRegistration", () => {
  const complete = { displayName: "สมชาย", email: "somchai.k@bumail.net", password: "longenough", confirmPassword: "longenough" };

  it("accepts a complete draft", () => {
    expect(validateRegistration(complete)).toEqual({});
  });

  it("flags mismatched confirmation and non-university email", () => {
    const errors = validateRegistration({ ...complete, email: "a@gmail.com", confirmPassword: "different1" });
    expect(Object.keys(errors).sort()).toEqual(["confirmPassword", "email"]);
  });
});

const GOOGLE_CLIENT_ID = "test-client.apps.googleusercontent.com";

function fakeGoogleToken(claims: Record<string, unknown>): string {
  const encode = (part: object) => Buffer.from(JSON.stringify(part)).toString("base64url");
  const base = { iss: "https://accounts.google.com", aud: GOOGLE_CLIENT_ID, exp: Date.parse("2026-10-28T11:00:00+07:00") / 1000, email_verified: true };
  return `${encode({ alg: "RS256" })}.${encode({ ...base, ...claims })}.signature`;
}

function googleApi() {
  const now = () => new Date("2026-10-28T10:00:00+07:00");
  return new MockLostFoundApi({ database: openMockDatabase(null, now), now, latencyMs: 0, googleClientId: GOOGLE_CLIENT_ID });
}

describe("mock Google sign-in", () => {
  it("creates a student account for a verified university Google account and reuses it", async () => {
    const api = googleApi();
    const token = fakeGoogleToken({ email: "Nida.S@bumail.net", name: "นิดา" });
    const first = await api.loginWithGoogle(token);
    expect(first.user).toEqual({ email: "nida.s@bumail.net", displayName: "นิดา", role: "student" });
    await expect(api.loginWithGoogle(token)).resolves.toMatchObject({ user: { email: "nida.s@bumail.net" } });
    await expect(api.login("nida.s@bumail.net", "")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("accepts staff @bu.ac.th accounts", async () => {
    await expect(googleApi().loginWithGoogle(fakeGoogleToken({ email: "staff@bu.ac.th" }))).resolves.toHaveProperty("accessToken");
  });

  it("rejects non-university, unverified, expired and foreign-audience tokens", async () => {
    const api = googleApi();
    await expect(api.loginWithGoogle(fakeGoogleToken({ email: "someone@gmail.com" }))).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(api.loginWithGoogle(fakeGoogleToken({ email: "a@bumail.net", email_verified: false }))).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(api.loginWithGoogle(fakeGoogleToken({ email: "a@bumail.net", exp: 1 }))).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(api.loginWithGoogle(fakeGoogleToken({ email: "a@bumail.net", aud: "other" }))).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(api.loginWithGoogle("not-a-jwt")).rejects.toBeInstanceOf(ApiError);
  });
});
