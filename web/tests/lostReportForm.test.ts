import { describe, expect, it } from "vitest";
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from "../src/api/contract";
import { validateLostReport } from "../src/features/report-lost/useLostReportForm";
import type { LostReportDraft } from "../src/features/report-lost/useLostReportForm";

const completeDraft: LostReportDraft = {
  title: "บัตรนักศึกษา",
  category: "card",
  description: "",
  photos: [],
  lastSeenLocationId: "loc-library",
  lostAtLocal: "2026-10-27T09:00",
  studentId: "",
  name: "ธนพล",
  lineId: "",
  phone: "",
  email: "thanaphon.j@bumail.net",
  reward: "",
};

describe("validateLostReport", () => {
  it("accepts email as the only contact channel", () => {
    expect(validateLostReport(completeDraft)).toEqual({});
  });

  it("requires an email because notifications go by email", () => {
    const errors = validateLostReport({ ...completeDraft, email: "", lineId: "thanaphon.j", phone: "0812345678" });
    expect(Object.keys(errors)).toEqual(["email"]);
  });

  it("accepts only university email domains", () => {
    expect(validateLostReport({ ...completeDraft, email: "darunpob7093@gmail.com" })).toHaveProperty("email");
    expect(validateLostReport({ ...completeDraft, email: "someone@bumail.net.evil.com" })).toHaveProperty("email");
    expect(validateLostReport({ ...completeDraft, email: "Guard@BU.ac.th" })).toEqual({});
  });

  it("checks the optional student ID is 10 digits when given", () => {
    expect(validateLostReport({ ...completeDraft, studentId: "12345" })).toHaveProperty("studentId");
    expect(validateLostReport({ ...completeDraft, studentId: "1650707093" })).toEqual({});
  });

  it("caps the title so long English names cannot overflow notice cards", () => {
    expect(validateLostReport({ ...completeDraft, title: "A".repeat(TITLE_MAX_LENGTH) })).toEqual({});
    expect(validateLostReport({ ...completeDraft, title: "A".repeat(TITLE_MAX_LENGTH + 1) })).toHaveProperty("title");
    expect(validateLostReport({ ...completeDraft, description: "x".repeat(DESCRIPTION_MAX_LENGTH + 1) })).toHaveProperty("description");
  });
});
