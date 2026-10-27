import type { FormEvent } from "react";
import { CircleCheckBig, Clock3, EyeOff, Lightbulb, Lock, ShieldCheck, Store } from "lucide-react";
import type { FoundItem } from "../../api/contract";
import { Button, ButtonLink } from "../../design-system/Button";
import { Field, TextArea, TextInput } from "../../design-system/Field";
import { FormSection, PageHeading } from "../../design-system/FormSection";
import { Card, ErrorNotice } from "../../design-system/Surface";
import { CategoryPicker } from "../catalog/CategoryPicker";
import { useDirectory } from "../catalog/DirectoryProvider";
import { PlaceSelect } from "../catalog/PlaceSelect";
import { ItemVisual } from "../items/ItemVisual";
import { PhotoPicker } from "./PhotoPicker";
import { useFoundReportForm } from "./useFoundReportForm";

const QUESTION_IDEAS = ["สีของเคส / ปลอก คืออะไร", "มีสติกเกอร์หรือพวงกุญแจรูปอะไร", "ข้างในมีอะไรอยู่บ้าง", "รูปพื้นหลังหน้าจอล็อกคืออะไร"];

function DropOffPicker({ value, onChange, error }: { value: string; onChange: (dropOffId: string) => void; error?: string }) {
  const { directory } = useDirectory();
  return (
    <div role="radiogroup" aria-label="จุดรับฝาก" className="grid gap-2 sm:grid-cols-2">
      {directory.dropOffPoints.map((point) => {
        const selected = value === point.id;
        const ring = selected ? "border-brand ring-4 ring-brand/15 bg-brand-soft/60" : error ? "border-danger/60" : "border-line hover:border-line-strong";
        return (
          <button key={point.id} type="button" role="radio" aria-checked={selected} onClick={() => onChange(point.id)}
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border bg-surface p-4 text-left transition-[border-color,box-shadow,background-color] duration-150 ${ring}`}>
            <span className={`grid size-9 shrink-0 place-items-center rounded-xl transition-colors duration-150 ${selected ? "bg-brand text-white dark:text-bg" : "bg-surface-2 text-ink-2"}`}>
              <Store className="size-[18px]" />
            </span>
            <span>
              <span className="block text-sm font-semibold">{point.name}</span>
              <span className="mt-0.5 flex items-center gap-1 text-[13px] text-ink-3"><Clock3 className="size-3.5" /> {point.hours}</span>
            </span>
          </button>
        );
      })}
      {error && <p className="text-[13px] text-danger sm:col-span-2">{error}</p>}
    </div>
  );
}

function TipsAside() {
  const tips = [
    { icon: Lightbulb, text: "ถ่ายรูปให้เห็นตัวของชัด ๆ แต่ไม่ต้องโชว์ข้อมูลส่วนตัว เช่น เลขบัตร" },
    { icon: EyeOff, text: "อย่าใส่รายละเอียดที่เป็นคำตอบของคำถามยืนยันในคำอธิบาย" },
    { icon: ShieldCheck, text: "นำของไปฝากที่จุดรับฝากที่เลือกภายในวันเดียวกัน" },
  ];
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <Card className="p-5">
        <h2 className="font-display font-semibold">เคล็ดลับเล็ก ๆ</h2>
        <ul className="mt-4 flex flex-col gap-4">
          {tips.map(({ icon: Icon, text }) => (
            <li key={text} className="flex gap-3 text-sm leading-relaxed text-ink-2">
              <Icon className="mt-0.5 size-[18px] shrink-0 text-accent" /> {text}
            </li>
          ))}
        </ul>
      </Card>
    </aside>
  );
}

function FoundSuccess({ foundItem, onAnother }: { foundItem: FoundItem; onAnother: () => void }) {
  const { dropOffPoint } = useDirectory();
  return (
    <div className="mx-auto max-w-lg animate-rise py-6 text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-success-soft text-success">
        <CircleCheckBig className="size-8" />
      </span>
      <h1 className="mt-5 font-display text-3xl font-bold">ขอบคุณที่ช่วยเหลือ!</h1>
      <p className="mt-2 text-ink-2">
        ประกาศขึ้นระบบแล้ว อย่าลืมนำของไปฝากที่ <strong className="text-ink">{dropOffPoint(foundItem.dropOffPointId)?.name}</strong>
      </p>
      <Card className="mt-6 flex items-center gap-4 p-3 text-left">
        <ItemVisual foundItem={foundItem} iconSize="size-7" className="size-16 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{foundItem.title}</p>
          <p className="text-sm text-ink-3">รหัสรายการ {foundItem.id}</p>
        </div>
      </Card>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <ButtonLink to={`/items/${foundItem.id}`} variant="secondary">ดูประกาศ</ButtonLink>
        <Button onClick={onAnother}>แจ้งชิ้นต่อไป</Button>
      </div>
    </div>
  );
}

export function ReportFoundPage() {
  const { draft, errors, setField, submit, submitting, failure, setFailure, created, reset } = useFoundReportForm();

  if (created) return <FoundSuccess foundItem={created} onAnother={reset} />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const accepted = await submit();
    if (!accepted) document.querySelector("[aria-invalid='true'], [role='alert']")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      <PageHeading eyebrow="แจ้งเจอของ" title="เจอของใครทำหาย? ช่วยส่งคืนกัน" description="กรอกข้อมูลไม่ถึง 2 นาที ระบบจะประกาศให้ทั้งมหาวิทยาลัยเห็น และแจ้งเตือนคนที่แจ้งของหายที่ตรงกันผ่าน LINE" />
      <form onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-6">
          <FormSection step={1} title="เจออะไร" description="รูปช่วยให้เจ้าของจำของตัวเองได้เร็วขึ้นมาก">
            <PhotoPicker photo={draft.photo} onChange={(photo) => setField("photo", photo)} onReject={setFailure} />
            <Field label="ชื่อสิ่งของ" error={errors.title}>
              {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} invalid={Boolean(errors.title)} value={draft.title} onChange={(event) => setField("title", event.target.value)} placeholder="เช่น iPhone เคสสีม่วง, กุญแจรถ Honda" />}
            </Field>
            <div className="flex flex-col gap-1.5">
              <span id="found-category-label" className="text-sm font-medium">หมวดหมู่</span>
              <CategoryPicker value={draft.category} onChange={(category) => setField("category", category)} invalid={Boolean(errors.category)} labelledBy="found-category-label" />
              {errors.category && <p className="text-[13px] text-danger">{errors.category}</p>}
            </div>
            <Field label="รายละเอียดเพิ่มเติม" optional hint="บอกลักษณะทั่วไป แต่เก็บจุดสังเกตเฉพาะไว้ตั้งเป็นคำถามยืนยัน">
              {(controlId, describedBy) => <TextArea id={controlId} aria-describedby={describedBy} value={draft.description} onChange={(event) => setField("description", event.target.value)} rows={3} />}
            </Field>
          </FormSection>

          <FormSection step={2} title="เจอที่ไหน เมื่อไร">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="จุดที่เจอ" error={errors.foundLocationId}>
                {(controlId, describedBy) => <PlaceSelect id={controlId} describedBy={describedBy} value={draft.foundLocationId} onChange={(placeId) => setField("foundLocationId", placeId)} invalid={Boolean(errors.foundLocationId)} placeholder="เลือกอาคาร / พื้นที่" />}
              </Field>
              <Field label="เวลาที่เจอ" error={errors.foundAtLocal}>
                {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} type="datetime-local" invalid={Boolean(errors.foundAtLocal)} value={draft.foundAtLocal} onChange={(event) => setField("foundAtLocal", event.target.value)} />}
              </Field>
            </div>
          </FormSection>

          <FormSection step={3} title="นำไปฝากไว้ที่ไหน" description="เลือกจุดรับฝากที่สะดวกที่สุด เจ้าของจะมารับที่นี่">
            <DropOffPicker value={draft.dropOffPointId} onChange={(dropOffId) => setField("dropOffPointId", dropOffId)} error={errors.dropOffPointId} />
          </FormSection>

          <FormSection step={4} title="ตั้งคำถามยืนยันความเป็นเจ้าของ" description="ป้องกันคนแอบอ้าง — คนที่กด “นี่ของฉัน” ต้องตอบให้ถูกก่อน">
            <Field label="คำถาม" error={errors.verificationQuestion}>
              {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} invalid={Boolean(errors.verificationQuestion)} value={draft.verificationQuestion} onChange={(event) => setField("verificationQuestion", event.target.value)} placeholder="เช่น มีสติกเกอร์รูปอะไรอยู่บนเคส" />}
            </Field>
            <div className="-mt-2 flex flex-wrap gap-2">
              {QUESTION_IDEAS.map((idea) => (
                <button key={idea} type="button" onClick={() => setField("verificationQuestion", idea)} className="cursor-pointer rounded-full border border-dashed border-line-strong px-3 py-1 text-[13px] text-ink-2 transition-colors duration-150 hover:border-brand hover:text-brand-ink">
                  + {idea}
                </button>
              ))}
            </div>
            <Field label="คำตอบที่ถูกต้อง" error={errors.verificationAnswer} hint="เก็บเป็นความลับ ไม่แสดงบนหน้าเว็บ">
              {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} invalid={Boolean(errors.verificationAnswer)} value={draft.verificationAnswer} onChange={(event) => setField("verificationAnswer", event.target.value)} leading={<Lock className="size-4" />} autoComplete="off" />}
            </Field>
          </FormSection>

          {failure && <ErrorNotice message={failure} />}
          <Button type="submit" size="lg" loading={submitting} className="w-full sm:w-auto sm:self-end sm:px-10">
            {submitting ? "กำลังบันทึก" : "ประกาศของที่เจอ"}
          </Button>
        </div>
        <TipsAside />
      </form>
    </>
  );
}
