import { CreditCard, Gift } from "lucide-react";
import { LOST_REPORT_EXPIRY_DAYS, REWARD_MAX_BAHT, REWARD_MIN_BAHT, rewardFee } from "../../api/contract";
import { Field, TextInput } from "../../design-system/Field";
import { useI18n } from "../../i18n/useI18n";

const PRESET_AMOUNTS = [0, 50, 100, 200];

interface RewardPickerProps {
  value: string;
  onChange: (reward: string) => void;
  error?: string;
}

export function RewardPicker({ value, onChange, error }: RewardPickerProps) {
  const { t } = useI18n();
  const text = t.reward;
  const amount = value.trim() ? Number(value) : 0;
  const showBreakdown = !error && Number.isInteger(amount) && amount >= REWARD_MIN_BAHT && amount <= REWARD_MAX_BAHT;
  return (
    <div className="flex flex-col gap-4">
      <div role="radiogroup" aria-label={text.sectionTitle} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PRESET_AMOUNTS.map((preset) => {
          const selected = amount === preset;
          return (
            <button key={preset} type="button" role="radio" aria-checked={selected} onClick={() => onChange(preset ? String(preset) : "")}
              className={`h-11 cursor-pointer rounded-md border-2 text-sm font-semibold transition-[border-color,background-color] duration-150 ${selected ? "border-ink bg-stock-yellow/60" : "border-line-strong bg-field hover:border-ink-3"}`}>
              {preset ? text.amount(preset) : text.none}
            </button>
          );
        })}
      </div>
      <Field label={text.customLabel} optional error={error} hint={text.ruleCap(REWARD_MAX_BAHT)}>
        {(controlId, describedBy) => (
          <TextInput id={controlId} aria-describedby={describedBy} invalid={Boolean(error)} value={value} onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
            inputMode="numeric" maxLength={4} placeholder={`${REWARD_MIN_BAHT}–${REWARD_MAX_BAHT}`} leading={<Gift className="size-4" />} />
        )}
      </Field>
      {showBreakdown && <p className="text-sm font-semibold">{text.breakdown(rewardFee(amount), amount - rewardFee(amount))}</p>}
      <ul className="flex list-disc flex-col gap-1 pl-5 text-[13px] leading-relaxed text-ink-2">
        <li>{text.ruleRefund(LOST_REPORT_EXPIRY_DAYS)}</li>
        <li>{text.ruleBoard}</li>
      </ul>
      <p className="flex items-center gap-2 rounded-sm bg-surface-2 px-3 py-2 text-[13px] text-ink-2">
        <CreditCard className="size-4 shrink-0" aria-hidden /> {text.testModeNote}
      </p>
    </div>
  );
}
