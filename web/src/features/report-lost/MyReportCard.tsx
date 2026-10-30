import { useState } from "react";
import { PackageCheck, Sparkles, X } from "lucide-react";
import { api } from "../../api/client";
import type { LostReportStatus, MyLostReport, Reward } from "../../api/contract";
import { describeError } from "../../api/errors";
import { Button } from "../../design-system/Button";
import { Badge, Card } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";
import { categoryMeta } from "../catalog/categories";
import { useDirectory } from "../catalog/DirectoryProvider";
import { formatDate, formatRelative } from "../catalog/thaiTime";
import { ItemCard, NOTICE_GRID } from "../items/ItemCard";
import { ItemVisual } from "../items/ItemVisual";
import { RewardPanel } from "./RewardPanel";
import { SubmissionCarousel } from "./SubmissionCarousel";

const STATUS_TONE: Record<LostReportStatus, "stamp" | "success" | "neutral"> = {
  searching: "stamp",
  found: "success",
  cancelled: "neutral",
  expired: "neutral",
};

/**
 * Owners can only cancel: "got it back" is set by the guard confirming a return, so a reward can never be dodged
 * by closing the notice first.
 */
function CancelAction({ reportId, reward, onClosed }: { reportId: string; reward: Reward | null; onClosed: () => void }) {
  const { t } = useI18n();
  const [armed, setArmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const refundNote = reward?.status === "held" ? t.myReports.selfFoundNote(reward.amount - reward.fee, reward.fee) : t.myReports.selfFoundNoteNoReward;

  const cancel = async () => {
    setSaving(true);
    setFailure(null);
    try {
      await api.cancelLostReport(reportId);
      onClosed();
    } catch (closeError) {
      setFailure(describeError(closeError));
      setArmed(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-4">
      <p className="text-[13px] leading-relaxed text-ink-2">{refundNote}</p>
      {failure && <p role="alert" className="text-[13px] text-danger">{failure}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        {armed && !saving && <Button size="sm" variant="ghost" onClick={() => setArmed(false)}>{t.myReports.keepOpen}</Button>}
        {armed ? (
          <Button size="sm" variant="danger" loading={saving} onClick={cancel}>{t.myReports.confirmCancel}</Button>
        ) : (
          <Button size="sm" variant="ghost" icon={<X className="size-4" aria-hidden />} onClick={() => setArmed(true)}>{t.myReports.cancelReport}</Button>
        )}
      </div>
    </div>
  );
}

function PossibleMatches({ report }: { report: MyLostReport }) {
  const { t } = useI18n();
  if (report.possibleMatches.length === 0) return <p className="text-sm text-ink-2">{t.myReports.noMatchesYet}</p>;
  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-1.5 text-sm font-semibold">
        <Sparkles className="size-4 text-stamp" aria-hidden /> {t.myReports.matchesTitle(report.possibleMatches.length)}
      </p>
      <div className={NOTICE_GRID}>
        {report.possibleMatches.map((foundItem) => <ItemCard key={foundItem.id} foundItem={foundItem} />)}
      </div>
    </div>
  );
}

function OpenNoticeBody({ report, onChanged }: { report: MyLostReport; onChanged: () => void }) {
  const { t } = useI18n();
  if (report.progress === "awaiting_pickup") {
    return (
      <p role="status" className="flex gap-2 rounded-md bg-verify-soft p-3 text-[13px] leading-relaxed text-ink">
        <PackageCheck className="mt-0.5 size-4 shrink-0 text-verify" aria-hidden /> {t.myReports.confirmedNote}
      </p>
    );
  }
  if (report.submissions.length > 0) return <SubmissionCarousel reportId={report.id} submissions={report.submissions} onAnswered={onChanged} />;
  return (
    <>
      <PossibleMatches report={report} />
      <CancelAction reportId={report.id} reward={report.reward} onClosed={onChanged} />
    </>
  );
}

export function MyReportCard({ report, onClosed }: { report: MyLostReport; onClosed: () => void }) {
  const { placeName } = useDirectory();
  const { t } = useI18n();
  const category = categoryMeta(report.category);
  const searching = report.status === "searching";
  return (
    <Card className={`overflow-hidden ${searching ? "" : "opacity-80"}`}>
      <div className={`h-2 ${category.stock}`} aria-hidden />
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <header className="flex flex-wrap items-start gap-3">
          <span className={`grid size-10 shrink-0 place-items-center rounded-sm text-stock-ink ${category.stock}`}>
            <category.icon className="size-5" aria-label={t.categories[category.id]} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg leading-snug font-semibold wrap-anywhere">{report.title}</h3>
            <p className="text-sm text-ink-2 wrap-anywhere">{t.myReports.lostAtPlace(placeName(report.lastSeenLocationId), formatDate(report.lostAt))}</p>
            <p className="text-xs text-ink-3 tabular-nums">
              {report.id}{report.closedAt && ` · ${t.myReports.closedAgo(formatRelative(report.closedAt))}`}
            </p>
          </div>
          <Badge tone={STATUS_TONE[report.status]}>{t.myReports.status[report.status]}</Badge>
        </header>
        {report.description && <p className="text-sm leading-relaxed whitespace-pre-line text-ink-2 wrap-anywhere">{report.description}</p>}
        {report.imageUrls.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label={t.item.photosLabel}>
            {report.imageUrls.map((imageUrl, photoIndex) => (
              <li key={imageUrl}>
                <ItemVisual foundItem={{ category: report.category, title: t.photo.previewAlt(photoIndex + 1), imageUrl }} className="size-20 rounded-sm" />
              </li>
            ))}
          </ul>
        )}
        {report.reward && <RewardPanel reportId={report.id} reward={report.reward} />}
        {searching && <OpenNoticeBody report={report} onChanged={onClosed} />}
      </div>
    </Card>
  );
}
