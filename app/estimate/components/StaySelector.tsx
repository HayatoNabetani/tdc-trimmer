'use client';

import { format } from 'date-fns';
import type { EstimateInput, PickupSlotId, StayType } from '@/lib/types';
import { PICKUP_SLOTS, pickupSlotForTime } from '@/lib/pricing';

// 今日（YYYY-MM-DD）。date input の min に使い、過去日付の選択を防ぐ。
// このコンポーネントは liff 初期化後（クライアント）にのみ描画されるためSSR不整合は起きない。
const today = () => format(new Date(), 'yyyy-MM-dd');

type Props = {
  input: EstimateInput;
  dateError: string | null;
  onChange: (patch: Partial<EstimateInput>) => void;
  enableExactTimes?: boolean;
};

const tabClass = (active: boolean) =>
  [
    'flex-1 rounded-lg py-2.5 text-sm font-bold transition',
    active ? 'bg-white text-[#06c755] shadow-sm' : 'text-gray-500',
  ].join(' ');

const fieldClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-800 focus:border-[#06c755] focus:outline-none';

const HOURS = Array.from({ length: 24 }, (_, hour) =>
  String(hour).padStart(2, '0'),
);

export function StaySelector({
  input,
  dateError,
  onChange,
  enableExactTimes = false,
}: Props) {
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
          startTime={input.daycareStartTime ?? ''}
          endTime={input.daycareEndTime ?? ''}
          enableExactTimes={enableExactTimes}
          onChange={onChange}
        />
      ) : (
        <OvernightFields
          input={input}
          dateError={dateError}
          onChange={onChange}
          enableExactTimes={enableExactTimes}
        />
      )}
    </section>
  );
}

function DaycareFields({
  value,
  startTime,
  endTime,
  enableExactTimes,
  onChange,
}: {
  value: string;
  startTime: string;
  endTime: string;
  enableExactTimes: boolean;
  onChange: (patch: Partial<EstimateInput>) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-gray-700">
          ご利用日{' '}
          {!enableExactTimes && (
            <span className="text-xs text-gray-400">（任意）</span>
          )}
        </span>
        <input
          type="date"
          className={fieldClass}
          min={today()}
          value={value}
          onChange={(e) => onChange({ daycareDate: e.target.value })}
        />
      </label>
      {enableExactTimes && (
        <div className="grid grid-cols-2 gap-3">
          <TimeField
            label="お預け時刻"
            value={startTime}
            onChange={(daycareStartTime) => onChange({ daycareStartTime })}
          />
          <TimeField
            label="お迎え時刻"
            value={endTime}
            onChange={(daycareEndTime) => onChange({ daycareEndTime })}
          />
        </div>
      )}
    </div>
  );
}

function OvernightFields({
  input,
  dateError,
  onChange,
  enableExactTimes,
}: {
  input: EstimateInput;
  dateError: string | null;
  onChange: (patch: Partial<EstimateInput>) => void;
  enableExactTimes: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
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
          {enableExactTimes && (
            <TimeField
              label="チェックイン時刻"
              value={input.checkInTime ?? ''}
              onChange={(checkInTime) => onChange({ checkInTime })}
              compact
            />
          )}
        </div>
        <div>
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
          {enableExactTimes && (
            <TimeField
              label="チェックアウト時刻"
              value={input.checkOutTime ?? ''}
              onChange={(checkOutTime) =>
                onChange({
                  checkOutTime,
                  pickupSlot: pickupSlotForTime(checkOutTime),
                })
              }
              compact
              max="22:00"
            />
          )}
        </div>
      </div>

      {dateError && (
        <p className="text-sm font-medium text-red-500">{dateError}</p>
      )}

      {!enableExactTimes && (
        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium text-gray-700">
            お迎え予定の時間帯
          </legend>
          <div className="space-y-2">
            {PICKUP_SLOTS.map((slot) => {
              const note = !slot.needsHalfDay
                ? '追加なし'
                : slot.overtimeFee === 0
                  ? '半日分を加算'
                  : `半日分 ＋ 夜間¥${slot.overtimeFee.toLocaleString('ja-JP')}`;
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
      )}
      {enableExactTimes && input.checkOutTime && input.pickupSlot && (
        <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
          お迎え時刻に応じて、料金が変更になります。
        </p>
      )}
    </div>
  );
}

function TimeField({
  label,
  value,
  onChange,
  compact = false,
  min = '09:00',
  max = '22:00',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
  min?: string;
  max?: string;
}) {
  const [hour = '', minute = ''] = value.split(':');
  const minHour = min.slice(0, 2);
  const maxHour = max?.slice(0, 2);
  const maxMinute = max?.slice(3, 5);
  const hours = HOURS.filter(
    (item) => item >= minHour && (!maxHour || item <= maxHour),
  );
  const minute30Disabled = hour === maxHour && maxMinute === '00';

  return (
    <label className={compact ? 'mt-2 block' : 'block'}>
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <span className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
        <select
          aria-label={`${label}（時）`}
          className={fieldClass}
          value={hour}
          onChange={(e) => {
            const nextHour = e.target.value;
            if (!nextHour) {
              onChange('');
              return;
            }
            const nextMinute =
              nextHour === maxHour && maxMinute === '00' ? '00' : minute || '00';
            onChange(`${nextHour}:${nextMinute}`);
          }}
        >
          <option value="">時</option>
          {hours.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <span aria-hidden="true" className="font-bold text-gray-500">
          :
        </span>
        <select
          aria-label={`${label}（分）`}
          className={fieldClass}
          value={minute}
          disabled={!hour}
          onChange={(e) => onChange(`${hour}:${e.target.value}`)}
        >
          <option value="" disabled>
            分
          </option>
          <option value="00">00</option>
          <option value="30" disabled={minute30Disabled}>
            30
          </option>
        </select>
      </span>
    </label>
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
