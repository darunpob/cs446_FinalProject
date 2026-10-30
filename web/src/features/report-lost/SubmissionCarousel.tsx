import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Expand, Inbox, Store, X } from "lucide-react";
import { api } from "../../api/client";
import type { FoundItem } from "../../api/contract";
import { describeError } from "../../api/errors";
import { Button } from "../../design-system/Button";
import { useI18n } from "../../i18n/useI18n";
import { useDirectory } from "../catalog/DirectoryProvider";
import { formatDateTime } from "../catalog/thaiTime";
import { ItemVisual } from "../items/ItemVisual";
import { PhotoLightbox } from "../items/PhotoLightbox";

type Answer = "confirm" | "decline";

const ROUND_BUTTON = "grid size-9 cursor-pointer place-items-center rounded-full border border-line-strong bg-surface text-ink transition-colors duration-150 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40";

/** Two-step buttons: the first press arms an answer, the second sends it. */
function useSubmissionAnswer(reportId: string, itemId: string, onAnswered: () => void) {
  const [armed, setArmed] = useState<Answer | null>(null);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const choose = async (answer: Answer) => {
    if (armed !== answer) return setArmed(answer);
    setSaving(true);
    setFailure(null);
    try {
      if (answer === "confirm") await api.confirmSubmission(reportId, itemId);
      else await api.declineSubmission(reportId, itemId);
      onAnswered();
    } catch (answerError) {
      setFailure(describeError(answerError));
      setArmed(null);
    } finally {
      setSaving(false);
    }
  };
  return { armed, saving, failure, choose };
}

function SubmissionPhoto({ submission }: { submission: FoundItem }) {
  const { t } = useI18n();
  const [viewerOpen, setViewerOpen] = useState(false);
  const visual = <ItemVisual foundItem={submission} iconSize="size-10" className="aspect-[4/3] w-full rounded-sm" />;
  if (submission.imageUrls.length === 0) return visual;
  return (
    <>
      <button type="button" onClick={() => setViewerOpen(true)} aria-label={t.photo.openViewer(submission.imageUrls.length)} className="group relative block w-full cursor-zoom-in overflow-hidden rounded-sm">
        {visual}
        <span className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-ink/70 text-surface opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden>
          <Expand className="size-4" />
        </span>
      </button>
      {viewerOpen && <PhotoLightbox title={submission.title} imageUrls={submission.imageUrls} startIndex={0} onClose={() => setViewerOpen(false)} />}
    </>
  );
}

function SubmissionSlide({ reportId, submission, onAnswered }: { reportId: string; submission: FoundItem; onAnswered: () => void }) {
  const { placeName, dropOffPoint } = useDirectory();
  const { t } = useI18n();
  const text = t.myReports;
  const answer = useSubmissionAnswer(reportId, submission.id, onAnswered);
  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr]">
      <SubmissionPhoto submission={submission} />
      <div className="flex min-w-0 flex-col gap-2">
        <h4 className="text-base leading-snug font-semibold wrap-anywhere">{submission.title}</h4>
        {submission.description && <p className="line-clamp-4 text-sm leading-relaxed whitespace-pre-line text-ink-2 wrap-anywhere">{submission.description}</p>}
        <p className="text-[13px] text-ink-2">{text.submissionMeta(placeName(submission.foundLocationId), formatDateTime(submission.foundAt))}</p>
        <p className="flex items-center gap-1.5 text-[13px] text-ink-2">
          <Store className="size-3.5 shrink-0 text-ink-3" aria-hidden /> {t.myFinds.dropOffAt(dropOffPoint(submission.dropOffPointId)?.name ?? t.claim.dropOffFallback)}
        </p>
        {answer.failure && <p role="alert" className="text-[13px] text-danger">{answer.failure}</p>}
        <div className="mt-auto flex flex-wrap justify-end gap-2 pt-2">
          <Button size="sm" variant={answer.armed === "decline" ? "danger" : "ghost"} loading={answer.saving && answer.armed === "decline"} disabled={answer.saving}
            onClick={() => answer.choose("decline")} icon={<X className="size-4" aria-hidden />}>
            {answer.armed === "decline" ? text.declineArmed : text.declineNotMine}
          </Button>
          <Button size="sm" variant={answer.armed === "confirm" ? "success" : "primary"} loading={answer.saving && answer.armed === "confirm"} disabled={answer.saving}
            onClick={() => answer.choose("confirm")} icon={<Check className="size-4" aria-hidden />}>
            {answer.armed === "confirm" ? text.confirmMineArmed : text.confirmMine}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PageDots({ count, current, onPick }: { count: number; current: number; onPick: (index: number) => void }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: count }, (_, dotIndex) => (
        <button key={dotIndex} type="button" onClick={() => onPick(dotIndex)} aria-label={t.myReports.slideLabel(dotIndex + 1, count)} aria-current={dotIndex === current}
          className={`h-2 cursor-pointer rounded-full transition-[width,background-color] duration-200 ${dotIndex === current ? "w-5 bg-ink" : "w-2 bg-line-strong hover:bg-ink-3"}`} />
      ))}
    </div>
  );
}

/** Finds sent to this notice through "I found this", one at a time; only the notice owner ever sees them. */
export function SubmissionCarousel({ reportId, submissions, onAnswered }: { reportId: string; submissions: FoundItem[]; onAnswered: () => void }) {
  const { t } = useI18n();
  const [requested, setRequested] = useState(0);
  const count = submissions.length;
  const current = Math.min(requested, count - 1);
  const shown = submissions[current];
  if (!shown) return null;
  return (
    <section aria-roledescription="carousel" aria-label={t.myReports.submissionsTitle(count)} className="flex flex-col gap-3 rounded-md border-2 border-stock-mint bg-surface p-4">
      <div>
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Inbox className="size-4 text-success" aria-hidden /> {t.myReports.submissionsTitle(count)}
        </p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">{t.myReports.submissionsHint}</p>
      </div>
      <div aria-roledescription="slide" aria-label={t.myReports.slideLabel(current + 1, count)}>
        <SubmissionSlide key={shown.id} reportId={reportId} submission={shown} onAnswered={onAnswered} />
      </div>
      {count > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
          <button type="button" onClick={() => setRequested(current - 1)} disabled={current === 0} aria-label={t.myReports.previous} className={ROUND_BUTTON}>
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <PageDots count={count} current={current} onPick={setRequested} />
          <button type="button" onClick={() => setRequested(current + 1)} disabled={current === count - 1} aria-label={t.myReports.next} className={ROUND_BUTTON}>
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      )}
    </section>
  );
}
