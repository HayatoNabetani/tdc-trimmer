'use client';

import { format, parseISO } from 'date-fns';
import type { EstimateInput, EstimateResult } from '@/lib/types';
import { SIZE_LABELS } from '@/lib/types';

const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;
const mdDate = (iso: string) => format(parseISO(iso), 'M/d');

type Props = {
  input: EstimateInput;
  result: EstimateResult;
  canSubmit: boolean;
  sending: boolean;
  guide: string | null;
  onSubmit: () => void;
};

/** 入力内容の1行サマリー（例：中型犬・宿泊 2泊半（午後お迎え）） */
function useText(input: EstimateInput, result: EstimateResult): string {
  if (!input.size) return '';
  const size = SIZE_LABELS[input.size].replace(/（.*）/, '');
  if (result.needsContact) return `${size}・お預かりのご相談`;
  if (input.stayType === 'daycare') return `${size}・日帰り`;
  const pickup = input.pickupTime === 'afternoon' ? '午後お迎え' : '午前お迎え';
  return `${size}・宿泊 ${result.label}（${pickup}）`;
}

export function EstimateSummary({
  input,
  result,
  canSubmit,
  sending,
  guide,
  onSubmit,
}: Props) {
  const summary = useText(input, result);
  const ctaLabel = result.needsContact
    ? '料金を相談する'
    : 'この内容でLINEに送る';

  return (
    <div className="sticky bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur">
      <div className="mx-auto max-w-md">
        {guide ? (
          <p className="mb-3 text-center text-sm text-gray-500">{guide}</p>
        ) : (
          <div className="mb-3">
            <p className="text-xs text-gray-500">{summary}</p>

            {result.needsContact ? (
              <p className="mt-1 text-lg font-bold text-gray-800">
                個別お見積もり
              </p>
            ) : (
              <p className="mt-0.5 text-2xl font-extrabold text-gray-900">
                {yen(result.total ?? 0)}
                <span className="ml-1 text-sm font-medium text-gray-500">
                  （税込）
                </span>
              </p>
            )}

            {/* 特別料金が含まれる場合の日別内訳 */}
            {result.hasSpecial && (
              <div className="mt-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
                <p className="font-bold">特別料金期間を含みます</p>
                <ul className="mt-1 space-y-0.5">
                  {result.breakdown.map((b) => (
                    <li
                      key={b.date}
                      className="flex justify-between tabular-nums"
                    >
                      <span>
                        {mdDate(b.date)}（{b.label}）
                      </span>
                      <span>{yen(b.amount)}</span>
                    </li>
                  ))}
                  {result.halfDayFee > 0 && (
                    <li className="flex justify-between tabular-nums">
                      <span>半日加算（午後お迎え）</span>
                      <span>{yen(result.halfDayFee)}</span>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          disabled={!canSubmit || sending}
          onClick={onSubmit}
          className={[
            'w-full rounded-xl py-3.5 text-center text-base font-bold transition',
            canSubmit && !sending
              ? 'bg-[#06c755] text-white active:bg-[#05b34c]'
              : 'cursor-not-allowed bg-gray-200 text-gray-400',
          ].join(' ')}
        >
          {sending ? '送信中…' : ctaLabel}
        </button>
      </div>
    </div>
  );
}
