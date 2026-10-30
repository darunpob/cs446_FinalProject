import { useState } from "react";
import { api } from "../../api/client";
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from "../../api/contract";
import type { CategoryId, FoundItem } from "../../api/contract";
import { describeError } from "../../api/errors";
import { messages } from "../../i18n/locale";
import { fromLocalInputValue, toLocalInputValue } from "../catalog/thaiTime";
import { uploadPhotos } from "./photoCompression";

export interface FoundReportDraft {
  photos: File[];
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

/** Fields the public lost board may hand over when a finder taps "I found this". */
export type FoundReportPrefill = Partial<Pick<FoundReportDraft, "title" | "category" | "foundLocationId">>;

function blankDraft(prefill: FoundReportPrefill = {}): FoundReportDraft {
  return {
    photos: [],
    title: "",
    category: null,
    description: "",
    foundLocationId: "",
    foundAtLocal: toLocalInputValue(new Date()),
    dropOffPointId: "",
    verificationQuestion: "",
    verificationAnswer: "",
    ...prefill,
  };
}

function foundAtError(foundAtLocal: string, now: Date): string | undefined {
  const text = messages().reportFound;
  if (!foundAtLocal) return text.timeRequired;
  if (new Date(foundAtLocal) > now) return text.timeInFuture;
  return undefined;
}

/** Shared by the found and lost forms: titles must fit a notice card on a phone. */
export function titleError(title: string, tooShort: string): string | undefined {
  const length = title.trim().length;
  if (length < 3) return tooShort;
  return length > TITLE_MAX_LENGTH ? messages().errors.titleTooLong(TITLE_MAX_LENGTH) : undefined;
}

export function validateFoundReport(draft: FoundReportDraft, now: Date = new Date()): FoundReportErrors {
  const text = messages().reportFound;
  const checks: FoundReportErrors = {
    title: titleError(draft.title, text.titleTooShort),
    description: draft.description.trim().length > DESCRIPTION_MAX_LENGTH ? messages().errors.tooLong(messages().errors.fields.description, DESCRIPTION_MAX_LENGTH) : undefined,
    category: draft.category ? undefined : text.categoryRequired,
    foundLocationId: draft.foundLocationId ? undefined : text.locationRequired,
    foundAtLocal: foundAtError(draft.foundAtLocal, now),
    dropOffPointId: draft.dropOffPointId ? undefined : text.dropOffRequired,
    verificationQuestion: draft.verificationQuestion.trim().length < 5 ? text.questionTooShort : undefined,
    verificationAnswer: draft.verificationAnswer.trim() ? undefined : text.answerRequired,
  };
  return Object.fromEntries(Object.entries(checks).filter(([, message]) => message)) as FoundReportErrors;
}

export function useFoundReportForm(prefill: FoundReportPrefill = {}) {
  const [draft, setDraft] = useState<FoundReportDraft>(() => blankDraft(prefill));
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
      const imageKeys = await uploadPhotos(draft.photos);
      const foundItem = await api.createFoundItem({
        title: draft.title.trim(),
        description: draft.description.trim(),
        category: draft.category,
        foundLocationId: draft.foundLocationId,
        dropOffPointId: draft.dropOffPointId,
        foundAt: fromLocalInputValue(draft.foundAtLocal),
        imageKeys,
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
