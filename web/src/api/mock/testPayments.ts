import { ApiError } from "../errors";
import { messages } from "../../i18n/locale";
import type { MockDatabaseHandle, StoredLostReport } from "./mockDatabase";
import { holdReward } from "./rewardLedger";

/** The same public test card numbers Stripe and Omise accept in test mode. */
export const TEST_CARDS = {
  success: "4242424242424242",
  declined: "4000000000000002",
} as const;

export interface TestCheckoutSession {
  sessionId: string;
  reportTitle: string;
  amount: number;
}

export interface TestPaymentGateway {
  describe(sessionId: string): TestCheckoutSession | null;
  /** Charges a test card and fires the "payment succeeded" webhook in one step. */
  pay(sessionId: string, cardNumber: string): void;
}

export function createTestPaymentGateway(database: MockDatabaseHandle, now: () => Date): TestPaymentGateway {
  const findPayable = (sessionId: string): StoredLostReport | undefined =>
    database.db.lostReports.find((report) => report.reward?.checkoutSessionId === sessionId && report.reward.status === "awaiting_payment");

  return {
    describe(sessionId) {
      const report = findPayable(sessionId);
      if (!report?.reward) return null;
      return { sessionId, reportTitle: report.title, amount: report.reward.amount };
    },
    pay(sessionId, cardNumber) {
      const report = findPayable(sessionId);
      if (!report?.reward) throw new ApiError("NOT_FOUND", messages().errors.checkoutNotFound, 404);
      const digits = cardNumber.replace(/\D/g, "");
      if (digits === TEST_CARDS.declined) throw new ApiError("VALIDATION", messages().errors.cardDeclined, 402);
      if (digits !== TEST_CARDS.success) throw new ApiError("VALIDATION", messages().errors.testCardOnly, 400);
      holdReward(report.reward, now());
      database.persist();
    },
  };
}
