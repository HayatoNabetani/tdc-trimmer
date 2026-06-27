'use client';

import type { DogSize } from '@/lib/types';

const OPTIONS: { value: DogSize; label: string; note: string }[] = [
  { value: 'small', label: '小型犬', note: '7kg未満' },
  { value: 'medium', label: '中型犬', note: '12kg未満' },
  { value: 'large', label: '大型犬', note: '12〜25kg未満' },
  { value: 'xlarge', label: 'それ以上', note: '25kg〜・要相談' },
];

export function SizeSelector({
  value,
  onChange,
}: {
  value: DogSize | null;
  onChange: (size: DogSize) => void;
}) {
  return (
    <section>
      <h2 className="mb-3 text-base font-bold text-gray-800">
        ① ワンちゃんのサイズ
        <span className="ml-2 align-middle text-xs font-normal text-red-500">
          必須
        </span>
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(opt.value)}
              className={[
                'flex flex-col items-start rounded-xl border-2 p-4 text-left transition',
                selected
                  ? 'border-[#06c755] bg-[#06c755]/10'
                  : 'border-gray-200 bg-white active:bg-gray-50',
              ].join(' ')}
            >
              <span className="text-base font-bold text-gray-800">
                {opt.label}
              </span>
              <span className="mt-0.5 text-xs text-gray-500">{opt.note}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
