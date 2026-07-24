'use client';

import { useState } from 'react';
import type { EstimateInput, RequestOptionKey } from '@/lib/types';
import { REQUEST_OPTIONS } from '@/lib/request';

type Props = {
  input: EstimateInput;
  onChange: (patch: Partial<EstimateInput>) => void;
};

// 「初めてのご利用や特別なオーダーがある方」向けの開閉式ご要望欄。
// 通常利用の人はスクロールせずに済むよう、デフォルトは閉じている。
export function RequestSection({ input, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const options = input.options ?? [];

  const toggle = (key: RequestOptionKey) => {
    const next = options.includes(key)
      ? options.filter((k) => k !== key)
      : [...options, key];
    onChange({ options: next });
  };

  return (
    <section>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left"
      >
        <span className="text-sm font-bold text-gray-800">
          初めてのご利用や特別なオーダーがある方
        </span>
        <span
          className={[
            'ml-2 shrink-0 text-gray-400 transition-transform',
            open ? 'rotate-180' : '',
          ].join(' ')}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-4 rounded-xl bg-gray-50 p-4">
          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-gray-700">
              ご持参いただくもの
              <span className="ml-2 align-middle text-xs font-normal text-gray-400">
                任意・複数選択可
              </span>
            </legend>
            <div className="space-y-2">
              {REQUEST_OPTIONS.map((opt) => {
                const checked = options.includes(opt.key);
                return (
                  <label
                    key={opt.key}
                    className={[
                      'flex items-center gap-2.5 rounded-lg border-2 px-3 py-2.5 transition',
                      checked
                        ? 'border-[#06c755] bg-[#06c755]/10'
                        : 'border-gray-200 bg-white',
                    ].join(' ')}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(opt.key)}
                      className="h-5 w-5 shrink-0 accent-[#06c755]"
                    />
                    <span className="text-sm font-medium text-gray-800">
                      {opt.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* アレルギー（持参物とは別扱い） */}
          <label
            className={[
              'flex items-center gap-2.5 rounded-lg border-2 px-3 py-2.5 transition',
              input.allergy
                ? 'border-[#06c755] bg-[#06c755]/10'
                : 'border-gray-200 bg-white',
            ].join(' ')}
          >
            <input
              type="checkbox"
              checked={!!input.allergy}
              onChange={(e) => onChange({ allergy: e.target.checked })}
              className="h-5 w-5 shrink-0 accent-[#06c755]"
            />
            <span className="text-sm font-medium text-gray-800">
              アレルギーあり
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              その他ご要望
              <span className="ml-2 align-middle text-xs font-normal text-gray-400">
                任意
              </span>
            </span>
            <input
              type="text"
              value={input.note ?? ''}
              onChange={(e) => onChange({ note: e.target.value })}
              placeholder="ご要望"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-800 placeholder:text-gray-400 focus:border-[#06c755] focus:outline-none"
            />
          </label>
        </div>
      )}
    </section>
  );
}
