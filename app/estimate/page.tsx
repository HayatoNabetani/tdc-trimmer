'use client';

import { useEffect, useMemo, useState } from 'react';
import { calcEstimate } from '@/lib/pricing';
import { buildMessage } from '@/lib/message';
import {
  closeWindow,
  initLiff,
  isInClient,
  sendTextMessage,
} from '@/lib/liff';
import type { DogSize, EstimateInput } from '@/lib/types';
import { SizeSelector } from './components/SizeSelector';
import { StaySelector } from './components/StaySelector';
import { EstimateSummary } from './components/EstimateSummary';

const INITIAL: EstimateInput = {
  size: null,
  stayType: 'overnight',
};

type LiffStatus = 'loading' | 'ready' | 'outside' | 'error';

// 開発時（localhost）はLINEアプリ外なので isInClient()=false / LIFF_ID未設定で
// 初期化が失敗してもフォームを確認できるようバイパスする。本番では従来どおり弾く。
const DEV = process.env.NODE_ENV !== 'production';

export default function EstimatePage() {
  const [input, setInput] = useState<EstimateInput>(INITIAL);
  const [liffStatus, setLiffStatus] = useState<LiffStatus>('loading');
  const [liffError, setLiffError] = useState<string | null>(null);
  const [inClient, setInClient] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // LIFF 初期化（6.3）
  useEffect(() => {
    let active = true;
    initLiff()
      .then(() => {
        if (!active) return;
        const within = isInClient();
        setInClient(within);
        // LINE内 → ready / LINE外 → 本番は outside、開発は ready
        setLiffStatus(within || DEV ? 'ready' : 'outside');
      })
      .catch((e: unknown) => {
        if (!active) return;
        // 開発時はLIFF_ID未設定でもUI確認できるよう ready に倒す
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

  const patch = (p: Partial<EstimateInput>) =>
    setInput((prev) => ({ ...prev, ...p }));

  const handleSize = (size: DogSize) => patch({ size });

  // 日程バリデーション（9章）
  const dateError = useMemo(() => {
    if (input.stayType !== 'overnight') return null;
    if (!input.checkIn || !input.checkOut) return null;
    if (input.checkOut <= input.checkIn)
      return 'お迎え日はお預け日より後を選んでください';
    return null;
  }, [input.stayType, input.checkIn, input.checkOut]);

  const result = useMemo(() => calcEstimate(input), [input]);

  // 送信可否・ガイド文の判定（4.4 / 9章）
  const { canSubmit, guide } = useMemo(() => {
    if (!input.size) {
      return { canSubmit: false, guide: 'まずはワンちゃんのサイズを選んでください' };
    }
    if (result.needsContact) {
      // 大型犬は料金計算なしで相談送信できる
      return { canSubmit: true, guide: null };
    }
    if (input.stayType === 'daycare') {
      return { canSubmit: true, guide: null };
    }
    // 宿泊
    if (!input.checkIn || !input.checkOut) {
      return { canSubmit: false, guide: '宿泊日程を選んでください' };
    }
    if (dateError) return { canSubmit: false, guide: null };
    if (!input.pickupTime) {
      return { canSubmit: false, guide: 'お迎えの時間帯を選んでください' };
    }
    if (result.total == null) {
      return { canSubmit: false, guide: 'サイズと日程を選んでください' };
    }
    return { canSubmit: true, guide: null };
  }, [input, result, dateError]);

  const handleSubmit = async () => {
    if (!canSubmit || sending) return;
    setSending(true);
    setToast(null);
    try {
      const text = buildMessage(input, result);
      // 開発時かつLINE外では sendMessages が使えないのでプレビュー出力に切替
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

  // LINE外ブラウザ・初期化エラーの案内（9章）
  if (liffStatus === 'loading') {
    return <CenterMessage title="読み込み中…" />;
  }
  if (liffStatus === 'error') {
    return (
      <CenterMessage
        title="読み込みに失敗しました"
        body={liffError ?? 'しばらくしてから再度お試しください。'}
      />
    );
  }
  if (liffStatus === 'outside') {
    return (
      <CenterMessage
        title="LINEアプリから開いてください"
        body="この見積もりフォームはLINEのトーク内から起動してご利用ください。"
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col">
      {DEV && !inClient && (
        <p className="bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-800">
          開発モード（LINE外）: 送信はプレビュー出力のみ
        </p>
      )}
      <header className="px-4 pb-2 pt-5">
        <h1 className="text-xl font-extrabold text-gray-900">
          お預かり見積もりシミュレーター
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          数タップで概算料金をご確認いただけます。
        </p>
      </header>

      <div className="flex-1 space-y-6 px-4 py-4">
        <SizeSelector value={input.size} onChange={handleSize} />

        {/* xlarge（要相談）のときは日程選択を出さない */}
        {input.size && input.size !== 'xlarge' && (
          <StaySelector input={input} dateError={dateError} onChange={patch} />
        )}

        {input.size === 'xlarge' && (
          <p className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
            大型犬（25kg以上）のお預かりは個別お見積もりとなります。
            下のボタンからお気軽にご相談ください。
          </p>
        )}
      </div>

      {toast && (
        <div className="px-4 pb-2">
          <p className="rounded-lg bg-red-50 p-3 text-center text-sm font-medium text-red-600">
            {toast}
          </p>
        </div>
      )}

      <EstimateSummary
        input={input}
        result={result}
        canSubmit={canSubmit}
        sending={sending}
        guide={guide}
        onSubmit={handleSubmit}
      />
    </main>
  );
}

function CenterMessage({ title, body }: { title: string; body?: string }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-8 text-center">
      <h1 className="text-lg font-bold text-gray-800">{title}</h1>
      {body && <p className="mt-2 text-sm text-gray-500">{body}</p>}
    </main>
  );
}
