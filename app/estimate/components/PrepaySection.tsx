'use client';

import type {
  EstimateInput,
  PrepayContact,
  PrepayWish,
} from '@/lib/types';

type Props = {
  input: EstimateInput;
  onChange: (patch: Partial<EstimateInput>) => void;
};

const optBtn = (active: boolean) =>
  [
    'flex-1 rounded-lg border-2 py-2.5 text-sm font-bold transition',
    active
      ? 'border-[#06c755] bg-[#06c755]/10 text-gray-800'
      : 'border-gray-200 bg-white text-gray-600',
  ].join(' ');

export function PrepaySection({ input, onChange }: Props) {
  const wish: PrepayWish = input.prepay ?? 'none';
  const contact = input.prepayContact;

  const setWish = (w: PrepayWish) => onChange({ prepay: w });
  const setContact = (c: PrepayContact) => onChange({ prepayContact: c });

  const isEmail = contact === 'email';

  return (
    <section>
      <h2 className="mb-2 text-base font-bold text-gray-800">事前決済のご希望</h2>
      <div className="flex gap-2">
        <button
          type="button"
          className={optBtn(wish === 'none')}
          onClick={() => setWish('none')}
        >
          希望しない
        </button>
        <button
          type="button"
          className={optBtn(wish === 'yes')}
          onClick={() => setWish('yes')}
        >
          希望する
        </button>
      </div>

      {wish === 'yes' && (
        <div className="mt-3 space-y-3 rounded-xl bg-gray-50 p-4">
          <p className="text-xs text-gray-500">
            決済のご案内をお送りする連絡方法をお選びください。後ほど決済リンクをお送りします。
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className={optBtn(contact === 'sms')}
              onClick={() => setContact('sms')}
            >
              SMS（携帯番号）
            </button>
            <button
              type="button"
              className={optBtn(isEmail)}
              onClick={() => setContact('email')}
            >
              メール
            </button>
          </div>

          {contact && (
            <input
              type={isEmail ? 'email' : 'tel'}
              inputMode={isEmail ? 'email' : 'tel'}
              value={input.prepayValue ?? ''}
              onChange={(e) => onChange({ prepayValue: e.target.value })}
              placeholder={isEmail ? 'example@email.com' : '090-1234-5678'}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-800 placeholder:text-gray-400 focus:border-[#06c755] focus:outline-none"
            />
          )}
        </div>
      )}
    </section>
  );
}
