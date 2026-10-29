import { useState } from "react";
import { CircleCheckBig, Sparkles, X } from "lucide-react";
import { api } from "../../api/client";
import type { LostReportCloseReason, LostReportStatus, MyLostReport } from "../../api/contract";
import { describeError } from "../../api/errors";
import { Button } from "../../design-system/Button";
import { Badge, Card } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";
import { categoryMeta } from "../catalog/categories";
import { useDirectory } from "../catalog/DirectoryProvider";
import { formatDate, formatRelative } from "../catalog/thaiTime";
import { ItemCard, NOTICE_GRID } from "../items/ItemCard";

const STATUS_TONE: Record<LostReportStatus, "stamp" | "success" | "neutral"> = {
  searching: "stamp",
  found: "success",
  cancelled: "neutral",
};

function CloseActions({ reportId, onClosed }: { reportId: string; onClosed: () => void }) {
  const { t } = useI18n();
  const [armed, setArmed] = useState<LostReportCloseReason | null>(null);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const close = async (reason: LostReportCloseReason) => {
    setSaving(true);
    setFailure(null);
    try {
      await api.closeLostReport(reportId, reason);
      onClosed();
    } catch (closeError) {
      setFailure(describeError(closeError));
      setArmed(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-4">
      {failure && <p role="alert" className="text-[13px] text-danger">{failure}</p>}
      {armed ? (
        <div className="flex flex-wrap justify-end gap-2">
          {!saving && <Button size="sm" variant="ghost" onClick={() => setArmed(null)}>{t.myReports.keepOpen}</Button>}
          <Button size="sm" variant={armed === "found" ? "success" : "danger"} loading={saving} onClick={() => close(armed)}>
            {armed === "found" ? t.myReports.confirmFound : t.myReports.confirmCancel}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" variant="ghost" icon={<X className="size-4" aria-hidden />} onClick={() => setArmed("cancelled")}>{t.myReports.cancelReport}</Button>
          <Button size="sm" variant="secondary" icon={<CircleCheckBig className="size-4" aria-hidden />} onClick={() => setArmed("found")}>{t.myReports.markFound}</Button>
        </div>
      )}
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
            <h3 className="text-lg leading-snug font-semibold">{report.title}</h3>
            <p className="text-sm text-ink-2">{t.myReports.lostAtPlace(placeName(report.lastSeenLocationId), formatDate(report.lostAt))}</p>
            <p className="text-xs text-ink-3 tabular-nums">
              {report.id}{report.closedAt && ` · ${t.myReports.closedAgo(formatRelative(report.closedAt))}`}
            </p>
          </div>
          <Badge tone={STATUS_TONE[report.status]}>{t.myReports.status[report.status]}</Badge>
        </header>
        {searching && <PossibleMatches report={report} />}
        {searching && <CloseActions reportId={report.id} onClosed={onClosed} />}
      </div>
    </Card>
  );
}
