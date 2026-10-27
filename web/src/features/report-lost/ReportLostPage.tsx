import type { FormEvent } from "react";
import { AtSign, BellRing, MessageCircle, Phone, Sparkles } from "lucide-react";
import type { LostReportReceipt } from "../../api/contract";
import { Button, ButtonLink } from "../../design-system/Button";
import { Field, TextArea, TextInput } from "../../design-system/Field";
import { FormSection, PageHeading } from "../../design-system/FormSection";
import { Card, ErrorNotice } from "../../design-system/Surface";
import { useAuth } from "../auth/AuthProvider";
import { CategoryPicker } from "../catalog/CategoryPicker";
import { PlaceSelect } from "../catalog/PlaceSelect";
import { ItemCard } from "../items/ItemCard";
import { useLostReportForm } from "./useLostReportForm";

function LostReceipt({ receipt }: { receipt: LostReportReceipt }) {
  const matches = receipt.possibleMatches;
  return (
    <div className="animate-rise">
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute -top-16 -right-16 size-48 rounded-full bg-brand/10 blur-2xl" aria-hidden />
        <span className="relative grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
          <BellRing className="size-6" />
        </span>
        <h1 className="relative mt-4 font-display text-2xl font-bold sm:text-3xl">รับเรื่องแล้ว เราช่วยจับตาให้</h1>
        <p className="relative mt-2 max-w-xl text-ink-2">
          หมายเลขแจ้ง <strong className="text-ink">{receipt.id}</strong> · เมื่อมีคนแจ้งเจอของที่ใกล้เคียง ระบบจะส่งแจ้งเตือนหาคุณทาง LINE / อีเมลทันที
        </p>
      </Card>
      <div className="mt-10 mb-4 flex items-center gap-2">
        <Sparkles className="size-5 text-accent" />
        <h2 className="font-display text-xl font-semibold">{matches.length > 0 ? "อาจเป็นของคุณ" : "ยังไม่มีของที่ตรงกันตอนนี้"}</h2>
      </div>
      {matches.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((foundItem, index) => <ItemCard key={foundItem.id} foundItem={foundItem} index={index} />)}
        </div>
      ) : (
        <p className="text-ink-2">ลองกลับมาดูหน้ารายการเป็นระยะ หรือรอรับแจ้งเตือนได้เลย</p>
      )}
      <ButtonLink to="/" variant="secondary" className="mt-8">ดูของที่เจอทั้งหมด</ButtonLink>
    </div>
  );
}

export function ReportLostPage() {
  const { session } = useAuth();
  const { draft, errors, setField, submit, submitting, failure, receipt } = useLostReportForm(session?.user.displayName ?? "", session?.user.email ?? "");

  if (receipt) return <LostReceipt receipt={receipt} />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const accepted = await submit();
    if (!accepted) document.querySelector("[aria-invalid='true'], [role='alert']")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading eyebrow="แจ้งของหาย" title="บอกเราว่าหายอะไร เดี๋ยวช่วยตามให้" description="ระบบจะเทียบกับของที่มีคนแจ้งเจอทันที และเฝ้าดูรายการใหม่ ๆ ให้ เมื่อเจอของที่น่าจะใช่จะส่งแจ้งเตือนหาคุณ" />
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <FormSection step={1} title="หายอะไร">
          <Field label="สิ่งที่หาย" error={errors.title}>
            {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} invalid={Boolean(errors.title)} value={draft.title} onChange={(event) => setField("title", event.target.value)} placeholder="เช่น กระเป๋าสตางค์หนังสีน้ำตาล" />}
          </Field>
          <div className="flex flex-col gap-1.5">
            <span id="lost-category-label" className="text-sm font-medium">หมวดหมู่</span>
            <CategoryPicker value={draft.category} onChange={(category) => setField("category", category)} invalid={Boolean(errors.category)} labelledBy="lost-category-label" />
            {errors.category && <p className="text-[13px] text-danger">{errors.category}</p>}
          </div>
          <Field label="ลักษณะเด่น" optional hint="สี ยี่ห้อ ขนาด หรือของที่อยู่ข้างใน">
            {(controlId, describedBy) => <TextArea id={controlId} aria-describedby={describedBy} value={draft.description} onChange={(event) => setField("description", event.target.value)} rows={3} />}
          </Field>
        </FormSection>

        <FormSection step={2} title="หายแถวไหน">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="บริเวณที่น่าจะหาย" error={errors.lastSeenLocationId}>
              {(controlId, describedBy) => <PlaceSelect id={controlId} describedBy={describedBy} value={draft.lastSeenLocationId} onChange={(placeId) => setField("lastSeenLocationId", placeId)} invalid={Boolean(errors.lastSeenLocationId)} placeholder="เลือกอาคาร / พื้นที่" />}
            </Field>
            <Field label="เห็นครั้งล่าสุดเมื่อ" error={errors.lostAtLocal}>
              {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} type="datetime-local" invalid={Boolean(errors.lostAtLocal)} value={draft.lostAtLocal} onChange={(event) => setField("lostAtLocal", event.target.value)} />}
            </Field>
          </div>
        </FormSection>

        <FormSection step={3} title="ติดต่อคุณทางไหน" description="ใส่อย่างน้อย 1 ช่องทาง แนะนำ LINE เพื่อรับแจ้งเตือนเร็วที่สุด">
          <Field label="ชื่อ" error={errors.name}>
            {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} invalid={Boolean(errors.name)} value={draft.name} onChange={(event) => setField("name", event.target.value)} autoComplete="name" />}
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="LINE ID" optional>
              {(controlId) => <TextInput id={controlId} leading={<MessageCircle className="size-4" />} invalid={Boolean(errors.contact)} value={draft.lineId} onChange={(event) => setField("lineId", event.target.value)} />}
            </Field>
            <Field label="เบอร์โทร" optional error={errors.phone}>
              {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} type="tel" inputMode="tel" leading={<Phone className="size-4" />} invalid={Boolean(errors.phone || errors.contact)} value={draft.phone} onChange={(event) => setField("phone", event.target.value)} />}
            </Field>
            <Field label="อีเมล" optional error={errors.email}>
              {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} type="email" leading={<AtSign className="size-4" />} invalid={Boolean(errors.email || errors.contact)} value={draft.email} onChange={(event) => setField("email", event.target.value)} autoComplete="email" />}
            </Field>
          </div>
          {errors.contact && <p role="alert" className="-mt-2 text-[13px] text-danger">{errors.contact}</p>}
        </FormSection>

        {failure && <ErrorNotice message={failure} />}
        <Button type="submit" size="lg" loading={submitting} className="w-full sm:w-auto sm:self-end sm:px-10">
          {submitting ? "กำลังส่ง" : "แจ้งของหาย"}
        </Button>
      </form>
    </div>
  );
}
