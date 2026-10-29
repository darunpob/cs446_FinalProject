import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { CreditCard, FlaskConical, Lock, SearchX } from "lucide-react";
import { testPaymentGateway } from "../../api/client";
import { describeError } from "../../api/errors";
import { TEST_CARDS } from "../../api/mock/testPayments";
import { Button, ButtonLink } from "../../design-system/Button";
import { Field, TextInput } from "../../design-system/Field";
import { Card, EmptyState, ErrorNotice } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";

function groupCardDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** Mock-only stand-in for the gateway's hosted test checkout; the real build redirects to the gateway instead. */
export function TestCheckoutPage() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const text = t.reward;
  const [session] = useState(() => testPaymentGateway?.describe(sessionId) ?? null);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("12/34");
  const [cvc, setCvc] = useState("123");
  const [failure, setFailure] = useState<string | null>(null);

  if (!session || !testPaymentGateway) {
    const backLink = <ButtonLink to="/my-reports" className="mt-2">{text.backToReports}</ButtonLink>;
    return <EmptyState icon={<SearchX className="size-7" />} title={text.checkoutGone} action={backLink} />;
  }
  const gateway = testPaymentGateway;

  const handlePay = (event: FormEvent) => {
    event.preventDefault();
    setFailure(null);
    try {
      gateway.pay(sessionId, cardNumber);
      navigate("/my-reports?paid=1", { replace: true });
    } catch (paymentError) {
      setFailure(describeError(paymentError));
    }
  };

  const testCards = [
    { number: TEST_CARDS.success, label: text.testCardOk },
    { number: TEST_CARDS.declined, label: text.testCardDeclined },
  ];

  return (
    <div className="mx-auto max-w-md">
      <Card pinned className="overflow-hidden">
        <div className="flex items-center gap-2 bg-stock-yellow px-5 py-2 text-xs font-bold text-stock-ink">
          <FlaskConical className="size-4" aria-hidden /> {text.testModeNote}
        </div>
        <form onSubmit={handlePay} noValidate className="flex flex-col gap-4 p-6">
          <div>
            <h1 className="font-display text-3xl">{text.checkoutTitle}</h1>
            <p className="mt-1 text-sm text-ink-2">{text.checkoutFor(session.reportTitle)}</p>
            <p className="mt-3 text-3xl font-bold tabular-nums">{text.amount(session.amount)}</p>
          </div>
          {failure && <ErrorNotice message={failure} />}
          <Field label={text.cardNumber}>
            {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} value={cardNumber} onChange={(event) => setCardNumber(groupCardDigits(event.target.value))} inputMode="numeric" autoComplete="off" placeholder="4242 4242 4242 4242" leading={<CreditCard className="size-4" />} />}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={text.expiry}>
              {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} value={expiry} onChange={(event) => setExpiry(event.target.value)} inputMode="numeric" maxLength={5} />}
            </Field>
            <Field label={text.cvc}>
              {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} value={cvc} onChange={(event) => setCvc(event.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={4} />}
            </Field>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-ink-3">{text.testCardsTitle}</p>
            {testCards.map((card) => (
              <button key={card.number} type="button" onClick={() => setCardNumber(groupCardDigits(card.number))}
                className="flex cursor-pointer items-center justify-between rounded-sm border border-dashed border-line-strong px-3 py-2 text-left text-[13px] transition-colors duration-150 hover:border-ink hover:bg-surface-2">
                <span className="font-mono tabular-nums">{groupCardDigits(card.number)}</span>
                <span className="text-ink-2">{card.label}</span>
              </button>
            ))}
          </div>
          <Button type="submit" size="lg" icon={<Lock className="size-4" aria-hidden />} className="mt-2 w-full">{text.payButton(session.amount)}</Button>
          <ButtonLink to="/my-reports" variant="ghost" className="w-full">{text.backToReports}</ButtonLink>
        </form>
      </Card>
    </div>
  );
}
