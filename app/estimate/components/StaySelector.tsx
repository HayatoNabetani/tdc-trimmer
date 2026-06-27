'use client';

import { format } from 'date-fns';
import type { EstimateInput, PickupSlotId, StayType } from '@/lib/types';
import { PICKUP_SLOTS } from '@/lib/pricing';

// 今日（YYYY-MM-DD）。date input の min に使い、過去日付の選択を防ぐ。
// このコンポーネントは liff 初期化後（クライアント）にのみ描画されるためSSR不整合は起きない。
const today = () => format(new Date(), 'yyyy-MM-dd');

type Props = {
  input: EstimateInput;
  dateError: string | null;
  onChange: (patch: Partial<EstimateInput>) => void;
};

const tabClass = (active: boolean) =>
  [
    'flex-1 rounded-lg py-2.5 text-sm font-bold transition',
    active ? 'bg-white text-[#06c755] shadow-sm' : 'text-gray-500',
  ].join(' ');

const fieldClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-800 focus:border-[#06c755] focus:outline-none';

export function StaySelector({ input, dateError, onChange }: Props) {
  const { stayType } = input;
  // 大型犬は日帰りなし → 宿泊のみ
  const daycareAvailable = input.size !== 'large';

  return (
    <section>
      <h2 className="mb-3 text-base font-bold text-gray-800">
        ② ご利用内容
        <span className="ml-2 align-middle text-xs font-normal text-red-500">
          必須
        </span>
      </h2>

      {/* 日帰り / 宿泊 タブ（大型犬は宿泊のみ） */}
      {daycareAvailable && (
        <div className="mb-4 flex gap-1 rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            className={tabClass(stayType === 'daycare')}
            onClick={() => onChange({ stayType: 'daycare' })}
          >
            日帰り
          </button>
          <button
            type="button"
            className={tabClass(stayType === 'overnight')}
            onClick={() => onChange({ stayType: 'overnight' })}
          >
            宿泊
          </button>
        </div>
      )}

      {stayType === 'daycare' && daycareAvailable ? (
        <DaycareFields
          value={input.daycareDate ?? ''}
          onChange={(daycareDate) => onChange({ daycareDate })}
        />
      ) : (
        <OvernightFields input={input} dateError={dateError} onChange={onChange} />
      )}
    </section>
  );
}

function DaycareFields({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        ご利用日 <span className="text-xs text-gray-400">（任意）</span>
      </span>
      <input
        type="date"
        className={fieldClass}
        min={today()}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function OvernightFields({
  input,
  dateError,
  onChange,
}: {
  input: EstimateInput;
  dateError: string | null;
  onChange: (patch: Partial<EstimateInput>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700">
            チェックイン
          </span>
          <input
            type="date"
            className={fieldClass}
            min={today()}
            value={input.checkIn ?? ''}
            onChange={(e) => onChange({ checkIn: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700">
            チェックアウト
          </span>
          <input
            type="date"
            className={fieldClass}
            value={input.checkOut ?? ''}
            min={input.checkIn ?? today()}
            onChange={(e) => onChange({ checkOut: e.target.value })}
          />
        </label>
      </div>

      {dateError && (
        <p className="text-sm font-medium text-red-500">{dateError}</p>
      )}

      <fieldset>
        <legend className="mb-1.5 block text-sm font-medium text-gray-700">
          お迎え予定の時間帯
        </legend>
        <div className="space-y-2">
          {PICKUP_SLOTS.map((slot) => {
            const note = !slot.needsHalfDay
              ? '追加なし'
              : slot.overtimeHours === 0
                ? '半日分を加算'
                : `半日分 ＋ 延長${slot.overtimeHours}時間分`;
            return (
              <PickupOption
                key={slot.id}
                label={slot.label}
                note={note}
                active={input.pickupSlot === slot.id}
                onClick={() => onChange({ pickupSlot: slot.id })}
              />
            );
          })}
        </div>
        <p className="mt-1.5 text-xs text-gray-400">
          1泊はお預かり日〜翌日12:00まで。以降のお迎えは加算されます。
        </p>
      </fieldset>
    </div>
  );
}

function PickupOption({
  label,
  note,
  active,
  onClick,
}: {
  label: string;
  note: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={[
        'flex w-full items-center justify-between rounded-xl border-2 p-3 text-left transition',
        active
          ? 'border-[#06c755] bg-[#06c755]/10'
          : 'border-gray-200 bg-white active:bg-gray-50',
      ].join(' ')}
    >
      <span className="text-sm font-bold text-gray-800">{label}</span>
      <span className="text-xs text-gray-500">{note}</span>
    </button>
  );
}

export type { PickupSlotId, StayType };
