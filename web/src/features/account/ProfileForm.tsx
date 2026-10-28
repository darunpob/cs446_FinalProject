import { useState } from "react";
import type { FormEvent } from "react";
import { AtSign, IdCard, MessageCircle, Phone, UserRound } from "lucide-react";
import { api } from "../../api/client";
import type { ProfileUpdate, UserProfile } from "../../api/contract";
import { describeError } from "../../api/errors";
import { Button } from "../../design-system/Button";
import { Field, TextInput } from "../../design-system/Field";
import { Card, ErrorNotice } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";
import { normalizePhone, validateProfile } from "./accountForms";
import type { ProfileErrors } from "./accountForms";
import { SavedNotice } from "./SavedNotice";

interface ProfileFormProps {
  profile: UserProfile;
  onSaved: (profile: UserProfile) => void;
}

function toDraft(profile: UserProfile): ProfileUpdate {
  return { displayName: profile.displayName, studentId: profile.studentId, phone: profile.phone, lineId: profile.lineId };
}

export function ProfileForm({ profile, onSaved }: ProfileFormProps) {
  const { t } = useI18n();
  const text = t.account;
  const [draft, setDraft] = useState<ProfileUpdate>(() => toDraft(profile));
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const setField = (field: keyof ProfileUpdate, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSaved(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validateProfile(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    setFailure(null);
    try {
      const updated = await api.updateProfile({ displayName: draft.displayName.trim(), studentId: draft.studentId.trim(), phone: normalizePhone(draft.phone), lineId: draft.lineId.trim() });
      setDraft(toDraft(updated));
      setSaved(true);
      onSaved(updated);
    } catch (saveError) {
      setFailure(describeError(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5 sm:p-7">
      <h2 className="text-lg font-semibold">{text.profileTitle}</h2>
      <p className="mt-0.5 text-sm text-ink-2">{text.profileDescription}</p>
      <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
        {failure && <ErrorNotice message={failure} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={text.nameLabel} error={errors.displayName}>
            {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} invalid={Boolean(errors.displayName)} value={draft.displayName} onChange={(event) => setField("displayName", event.target.value)} leading={<UserRound className="size-4" />} autoComplete="name" />}
          </Field>
          <Field label={t.login.email} hint={text.emailLocked}>
            {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} type="email" value={profile.email} readOnly leading={<AtSign className="size-4" />} className="read-only:bg-surface-2 read-only:text-ink-2" />}
          </Field>
        </div>
        <Field label={t.reportLost.studentIdLabel} optional error={errors.studentId} hint={text.studentIdHint}>
          {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} invalid={Boolean(errors.studentId)} value={draft.studentId} onChange={(event) => setField("studentId", event.target.value)} inputMode="numeric" maxLength={10} leading={<IdCard className="size-4" />} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.reportLost.phoneLabel} optional error={errors.phone}>
            {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} type="tel" inputMode="tel" invalid={Boolean(errors.phone)} value={draft.phone} onChange={(event) => setField("phone", event.target.value)} leading={<Phone className="size-4" />} autoComplete="tel" />}
          </Field>
          <Field label={t.reportLost.lineIdLabel} optional>
            {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} value={draft.lineId} onChange={(event) => setField("lineId", event.target.value)} leading={<MessageCircle className="size-4" />} />}
          </Field>
        </div>
        {saved && <SavedNotice message={text.saved} />}
        <Button type="submit" loading={saving} className="w-full sm:w-auto sm:self-end sm:px-8">{text.save}</Button>
      </form>
    </Card>
  );
}
