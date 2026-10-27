import { useState } from "react";
import { api } from "../../api/client";
import type { CategoryId, FoundItem } from "../../api/contract";
import { describeError } from "../../api/errors";
import { fromLocalInputValue, toLocalInputValue } from "../catalog/thaiTime";
import { compressPhoto } from "./photoCompression";

export interface FoundReportDraft {
  photo: File | null;
  title: string;
  category: CategoryId | null;
  description: string;
  foundLocationId: string;
  foundAtLocal: string;
  dropOffPointId: string;
  verificationQuestion: string;
  verificationAnswer: string;
}

export type FoundReportErrors = Partial<Record<keyof FoundReportDraft, string>>;

function blankDraft(): FoundReportDraft {
  return {
    photo: null,
    title: "",
    category: null,
    description: "",
    foundLocationId: "",
    foundAtLocal: toLocalInputValue(new Date()),
    dropOffPointId: "",
    verificationQuestion: "",
    verificationAnswer: "",
  };
}

function foundAtError(foundAtLocal: string, now: Date): string | undefined {
  if (!foundAtLocal) return "ระบุเวลาที่เจอ";
  if (new Date(foundAtLocal) > now) return "เวลาที่เจอต้องไม่อยู่ในอนาคต";
  return undefined;
}

export function validateFoundReport(draft: FoundReportDraft, now: Date = new Date()): FoundReportErrors {
  const checks: FoundReportErrors = {
    title: draft.title.trim().length < 3 ? "บอกชื่อสิ่งของสั้น ๆ อย่างน้อย 3 ตัวอักษร" : undefined,
    category: draft.category ? undefined : "เลือกหมวดหมู่",
    foundLocationId: draft.foundLocationId ? undefined : "เลือกจุดที่เจอ",
    foundAtLocal: foundAtError(draft.foundAtLocal, now),
    dropOffPointId: draft.dropOffPointId ? undefined : "เลือกจุดที่จะนำของไปฝาก",
    verificationQuestion: draft.verificationQuestion.trim().length < 5 ? "ตั้งคำถามที่เจ้าของตัวจริงเท่านั้นจะตอบได้" : undefined,
    verificationAnswer: draft.verificationAnswer.trim() ? undefined : "ใส่คำตอบที่ถูกต้อง (เจ้าของจะไม่เห็นช่องนี้)",
  };
  return Object.fromEntries(Object.entries(checks).filter(([, message]) => message)) as FoundReportErrors;
}

export function useFoundReportForm() {
  const [draft, setDraft] = useState<FoundReportDraft>(blankDraft);
  const [errors, setErrors] = useState<FoundReportErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [created, setCreated] = useState<FoundItem | null>(null);

  const setField = <Field extends keyof FoundReportDraft>(field: Field, value: FoundReportDraft[Field]) => {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const submit = async () => {
    const nextErrors = validateFoundReport(draft);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean) || !draft.category) return false;
    setSubmitting(true);
    setFailure(null);
    try {
      const uploaded = draft.photo ? await api.uploadImage(await compressPhoto(draft.photo)) : null;
      const foundItem = await api.createFoundItem({
        title: draft.title,
        description: draft.description,
        category: draft.category,
        foundLocationId: draft.foundLocationId,
        dropOffPointId: draft.dropOffPointId,
        foundAt: fromLocalInputValue(draft.foundAtLocal),
        imageKey: uploaded?.imageKey ?? null,
        verificationQuestion: draft.verificationQuestion,
        verificationAnswer: draft.verificationAnswer,
      });
      setCreated(foundItem);
      return true;
    } catch (submitError) {
      setFailure(describeError(submitError));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setDraft(blankDraft());
    setErrors({});
    setCreated(null);
  };

  return { draft, errors, setField, submit, submitting, failure, setFailure, created, reset };
}
