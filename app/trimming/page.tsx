'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  closeWindow,
  initLiff,
  isInClient,
  sendTextMessage,
} from '@/lib/liff';
import {
  calcTrim,
  COURSE_DESC,
  COURSE_LABELS,
  LARGE_TYPE_LABELS,
  TRIM_SIZE_LABELS,
  visibleTrimOptions,
  type LargeType,
  type TrimCourse,
  type TrimInput,
  type TrimOptionKey,
  type TrimSize,
} from '@/lib/trimming';
import { buildTrimMessage, TRIM_POLICY_NOTES } from '@/lib/trimmingMessage';
import { prepayGuide } from '@/lib/prepay';
import { PrepaySection } from '../estimate/components/PrepaySection';

const DEV = process.env.NODE_ENV !== 'production';
const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;

const INITIAL: TrimInput = { size: null, course: 'trimming' };

type LiffStatus = 'loading' | 'ready' | 'outside' | 'error';

const SIZES: TrimSize[] = ['small', 'medium', 'large', 'other'];
const LARGE_TYPES: LargeType[] = ['miniature', 'medium', 'standard'];
const COURSES: TrimCourse[] = ['shampoo', 'trimming'];

export default function TrimmingPage() {
  const [input, setInput] = useState<TrimInput>(INITIAL);
  const [liffStatus, setLiffStatus] = useState<LiffStatus>('loading');
  const [liffError, setLiffError] = useState<string | null>(null);
  const [inClient, setInClient] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    setAgreed(false);
  }, [input]);

  useEffect(() => {
    let active = true;
    // トリミング専用LIFFがあればそれを使い、無ければホテル用にフォールバック
    const trimLiffId =
      process.env.NEXT_PUBLIC_LIFF_ID_TRIMMING ||
      process.env.NEXT_PUBLIC_LIFF_ID;
    initLiff(trimLiffId)
      .then(() => {
        if (!active) return;
        const within = isInClient();
        setInClient(within);
        setLiffStatus(within || DEV ? 'ready' : 'outside');
      })
      .catch((e: unknown) => {
        if (!active) return;
        if (DEV) {
          setLiffStatus('ready');
          return;
        }
        setLiffError(e instanceof Error ? e.message : String(e));
        setLiffStatus('error');
      });
    return () => {
      active = false;
    };
  }, []);

  const patch = (p: Partial<TrimInput>) =>
    setInput((prev) => ({ ...prev, ...p }));

  const result = useMemo(() => calcTrim(input), [input]);

  const toggleOption = (key: TrimOptionKey) => {
    const opts = input.options ?? [];
    patch({
      options: opts.includes(key)
        ? opts.filter((k) => k !== key)
        : [...opts, key],
    });
  };

  const { canSubmit, guide } = useMemo(() => {
    if (!input.size) {
      return { canSubmit: false, guide: 'ワンちゃんのサイズを選んでください' };
    }
    if (result.needsContact) return { canSubmit: true, guide: null };
    if (input.size === 'large' && !input.largeType) {
      return { canSubmit: false, guide: '大型犬のタイプを選んでください' };
    }
    if (result.base == null) {
      return { canSubmit: false, guide: 'サイズとコースを選んでください' };
    }
    const pg = prepayGuide(input);
    if (pg) return { canSubmit: false, guide: pg };
    return { canSubmit: true, guide: null };
  }, [input, result]);

  const handleSubmit = async () => {
    if (!canSubmit || !agreed || sending) return;
    setSending(true);
    setToast(null);
    try {
      const text = buildTrimMessage(input, result);
      if (DEV && !inClient) {
        console.log('[DEV] 送信プレビュー:\n' + text);
        setToast('（開発モード）送信せずコンソールにプレビュー出力しました');
        setSending(false);
        return;
      }
      await sendTextMessage(text);
      closeWindow();
    } catch {
      setToast('送信に失敗しました。もう一度お試しください');
      setSending(false);
    }
  };

  if (liffStatus === 'loading') return <Center title="読み込み中…" />;
  if (liffStatus === 'error')
    return (
      <Center
        title="読み込みに失敗しました"
        body={liffError ?? 'しばらくしてから再度お試しください。'}
      />
    );
  if (liffStatus === 'outside')
    return (
      <Center
        title="LINEアプリから開いてください"
        body="このフォームはLINEのトーク内から起動してご利用ください。"
      />
    );

  const options = visibleTrimOptions(input.size);
  const canSend = canSubmit && agreed;
  const ctaLabel = result.needsContact
    ? '相談する'
    : 'この内容で予約リクエストを送る';

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col">
      {DEV && !inClient && (
        <p className="bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-800">
          開発モード（LINE外）: 送信はプレビュー出力のみ
        </p>
      )}

      <div className="flex-1 space-y-6 px-4 pb-4 pt-5">
        {/* ① サイズ */}
        <section>
          <h2 className="mb-3 text-base font-bold text-gray-800">
            ① ワンちゃんのサイズ
            <span className="ml-2 align-middle text-xs font-normal text-red-500">
              必須
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {SIZES.map((s) => (
              <Card
                key={s}
                active={input.size === s}
                onClick={() =>
                  patch({ size: s, largeType: undefined })
                }
                title={TRIM_SIZE_LABELS[s].replace(/（.*）/, '')}
                note={
                  TRIM_SIZE_LABELS[s].match(/（(.*)）/)?.[1] ??
                  '応相談'
                }
              />
            ))}
          </div>

          {/* 大型のタイプ */}
          {input.size === 'large' && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {LARGE_TYPES.map((lt) => (
                <button
                  key={lt}
                  type="button"
                  onClick={() => patch({ largeType: lt })}
                  className={pill(input.largeType === lt)}
                >
                  {LARGE_TYPE_LABELS[lt]}
                </button>
              ))}
            </div>
          )}
          {input.size === 'other' && (
            <p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
              その他大型犬は料金が応相談となります。下のボタンからご相談ください。
            </p>
          )}
        </section>

        {/* ② コース（要問い合わせ時は隠す） */}
        {input.size && !result.needsContact && (
          <section>
            <h2 className="mb-3 text-base font-bold text-gray-800">
              ② コース
              <span className="ml-2 align-middle text-xs font-normal text-red-500">
                必須
              </span>
            </h2>
            <div className="space-y-2">
              {COURSES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => patch({ course: c })}
                  className={[
                    'flex w-full flex-col items-start rounded-xl border-2 p-3 text-left transition',
                    input.course === c
                      ? 'border-[#06c755] bg-[#06c755]/10'
                      : 'border-gray-200 bg-white',
                  ].join(' ')}
                >
                  <span className="text-sm font-bold text-gray-800">
                    {COURSE_LABELS[c]}
                  </span>
                  <span className="mt-0.5 text-xs text-gray-500">
                    {COURSE_DESC[c]}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ③ オプション */}
        {input.size && !result.needsContact && (
          <section>
            <h2 className="mb-2 text-base font-bold text-gray-800">
              ③ オプション
              <span className="ml-2 align-middle text-xs font-normal text-gray-400">
                任意
              </span>
            </h2>
            <div className="space-y-2">
              {options.map((opt) => {
                const checked = (input.options ?? []).includes(opt.key);
                return (
                  <label
                    key={opt.key}
                    className={[
                      'flex items-start gap-2.5 rounded-lg border-2 px-3 py-2.5 transition',
                      checked
                        ? 'border-[#06c755] bg-[#06c755]/10'
                        : 'border-gray-200 bg-white',
                    ].join(' ')}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOption(opt.key)}
                      className="mt-0.5 h-5 w-5 shrink-0 accent-[#06c755]"
                    />
                    <span>
                      <span className="text-sm font-medium text-gray-800">
                        {opt.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500">
                        {opt.note}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        )}

        {/* 13歳以上・健康不安 */}
        {input.size && input.size !== 'other' && (
          <label className="flex items-start gap-2.5 rounded-xl border-2 border-gray-200 bg-white px-4 py-3">
            <input
              type="checkbox"
              checked={!!input.seniorOrHealth}
              onChange={(e) => patch({ seniorOrHealth: e.target.checked })}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[#06c755]"
            />
            <span>
              <span className="text-sm font-bold text-gray-800">
                13歳以上／健康に不安がある
              </span>
              <span className="mt-0.5 block text-xs text-gray-500">
                投薬等が必要な場合があるため、可否をご相談させてください
              </span>
            </span>
          </label>
        )}

        {/* ④ ご要望 */}
        {input.size && (
          <label className="block">
            <span className="mb-1.5 block text-base font-bold text-gray-800">
              ④ ご要望
              <span className="ml-2 align-middle text-xs font-normal text-gray-400">
                任意
              </span>
            </span>
            <input
              type="text"
              value={input.note ?? ''}
              onChange={(e) => patch({ note: e.target.value })}
              placeholder="ご要望"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-800 placeholder:text-gray-400 focus:border-[#06c755] focus:outline-none"
            />
          </label>
        )}

        {/* 事前決済のご希望 */}
        {input.size && !result.needsContact && (
          <PrepaySection input={input} onChange={patch} />
        )}

        {/* 予約に関する注意 */}
        {input.size && (
          <div className="space-y-1 rounded-lg bg-gray-100 p-3 text-xs leading-relaxed text-gray-500">
            {TRIM_POLICY_NOTES.map((n) => (
              <p key={n}>※{n}</p>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className="px-4 pb-2">
          <p className="rounded-lg bg-red-50 p-3 text-center text-sm font-medium text-red-600">
            {toast}
          </p>
        </div>
      )}

      {/* サマリー */}
      <div className="sticky bottom-0 border-t border-gray-200 bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur">
        <div className="mx-auto max-w-md">
          {guide ? (
            <p className="mb-3 text-center text-sm text-gray-500">{guide}</p>
          ) : (
            <div className="mb-3">
              {result.needsContact ? (
                <p className="text-lg font-bold text-gray-800">応相談</p>
              ) : (
                <>
                  <p className="text-xs text-gray-500">{result.courseLabel}</p>
                  <p className="mt-0.5 text-2xl font-extrabold text-gray-900">
                    {yen(result.base ?? 0)}
                    {result.isFrom && <span className="text-xl">〜</span>}
                    <span className="ml-1 text-sm font-medium text-gray-500">
                      （税込）
                    </span>
                  </p>
                  {result.extraNotes.length > 0 && (
                    <ul className="mt-2 space-y-0.5 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
                      {result.extraNotes.map((n) => (
                        <li key={n}>・{n}</li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}

          {canSubmit && (
            <label className="mb-3 flex items-start gap-2.5 rounded-lg bg-gray-50 p-3">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[#06c755]"
              />
              <span className="text-sm font-medium text-gray-700">
                内容を確認しました
              </span>
            </label>
          )}

          <button
            type="button"
            disabled={!canSend || sending}
            onClick={handleSubmit}
            className={[
              'w-full rounded-xl py-3.5 text-center text-base font-bold transition',
              canSend && !sending
                ? 'bg-[#06c755] text-white active:bg-[#05b34c]'
                : 'cursor-not-allowed bg-gray-200 text-gray-400',
            ].join(' ')}
          >
            {sending ? '送信中…' : ctaLabel}
          </button>
        </div>
      </div>
    </main>
  );
}

function Card({
  active,
  onClick,
  title,
  note,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  note: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={[
        'flex flex-col items-start rounded-xl border-2 p-4 text-left transition',
        active
          ? 'border-[#06c755] bg-[#06c755]/10'
          : 'border-gray-200 bg-white active:bg-gray-50',
      ].join(' ')}
    >
      <span className="text-base font-bold text-gray-800">{title}</span>
      <span className="mt-0.5 text-xs text-gray-500">{note}</span>
    </button>
  );
}

function pill(active: boolean) {
  return [
    'rounded-lg border-2 py-2 text-sm font-bold transition',
    active
      ? 'border-[#06c755] bg-[#06c755]/10 text-gray-800'
      : 'border-gray-200 bg-white text-gray-600',
  ].join(' ');
}

function Center({ title, body }: { title: string; body?: string }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-8 text-center">
      <h1 className="text-lg font-bold text-gray-800">{title}</h1>
      {body && <p className="mt-2 text-sm text-gray-500">{body}</p>}
    </main>
  );
}
