import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Card } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";

/** Add-friend link of the LINE Official Account, e.g. https://lin.ee/AbCdEf — card stays hidden while empty. */
export const LINE_OA_URL = (import.meta.env.VITE_LINE_OA_URL ?? "").trim();

function useQrDataUrl(target: string): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("qrcode")
      .then((qrcode) => qrcode.toDataURL(target, { margin: 1, width: 320, color: { dark: "#1b1d2e", light: "#ffffff" } }))
      .then((encoded) => !cancelled && setDataUrl(encoded))
      .catch((qrError: unknown) => console.warn("LINE QR code could not be generated", qrError));
    return () => {
      cancelled = true;
    };
  }, [target]);

  return dataUrl;
}

export function LineFollowCard({ reportId }: { reportId: string }) {
  const { t } = useI18n();
  const text = t.reportLost;
  const qrDataUrl = useQrDataUrl(LINE_OA_URL);
  return (
    <Card className="mt-6 flex flex-col items-center gap-5 p-6 sm:flex-row sm:items-center">
      {qrDataUrl && <img src={qrDataUrl} alt={text.lineQrAlt} className="hidden size-32 shrink-0 rounded-sm border border-line bg-white p-1.5 sm:block" />}
      <div className="flex-1 text-center sm:text-left">
        <h2 className="text-lg font-semibold">{text.lineTitle}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{text.lineBody(reportId)}</p>
        <a
          href={LINE_OA_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-[#06c755] px-5 text-[15px] font-semibold text-[#06281a] shadow-paper transition-[filter,translate] duration-150 hover:brightness-105 active:translate-y-px"
        >
          <MessageCircle className="size-5" /> {text.lineButton}
        </a>
      </div>
    </Card>
  );
}
