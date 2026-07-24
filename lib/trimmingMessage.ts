// トリミング見積もりの LINE 送信メッセージ生成

import { format, parseISO } from 'date-fns';
import {
  COURSE_DESC,
  LARGE_TYPE_LABELS,
  TRIM_SIZE_LABELS,
  type TrimInput,
  type TrimResult,
} from './trimming';
import { prepayMessageLines } from './prepay';

const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;
const price = (n: number, from: boolean) => `${yen(n)}${from ? '〜' : ''}`;
const jpDate = (iso: string) => format(parseISO(iso), 'yyyy/MM/dd');
const dateLines = (iso?: string): string[] =>
  iso ? [`📅 ご希望日：${jpDate(iso)}`] : [];

// フォーム・メッセージ共通の予約に関する注意書き（画像より）
export const TRIM_POLICY_NOTES = [
  '完全予約制です。当日のご来店はお断りする場合がございます。',
  '土日は混み合うため、お早めのご予約をおすすめします。',
  'トリミング可能なワンちゃんは13歳までです（13歳以上・健康に不安のある子は要ご相談）。',
];

const FOOTER =
  '※こちらは概算です。正式なお見積もり・空き状況はスタッフよりご案内します。';

const noteLines = (note?: string): string[] => {
  const t = note?.trim();
  return t ? [`📝 ご要望：${t}`] : [];
};

export function buildTrimMessage(input: TrimInput, result: TrimResult): string {
  const sizeLabel = input.size ? TRIM_SIZE_LABELS[input.size] : '';

  // 要お問い合わせ（その他大型 / 13歳以上・健康不安）
  if (result.needsContact) {
    const reason =
      input.size === 'other'
        ? 'その他大型犬のトリミングについて相談したいです。'
        : '13歳以上／健康に不安があるため、トリミング可否を相談したいです。';
    return [
      '【トリミングのご相談】',
      `🐶 ワンちゃんのサイズ：${sizeLabel || '—'}`,
      reason,
      'ご希望のスタイル・日程など、追ってメッセージします。',
      ...dateLines(input.date),
      ...noteLines(input.note),
      ...prepayMessageLines(input),
    ].join('\n');
  }

  const largeType =
    input.size === 'large' && input.largeType
      ? `（${LARGE_TYPE_LABELS[input.largeType]}）`
      : '';

  const lines: string[] = [
    '【トリミング ご予約リクエスト】',
    `🐶 ワンちゃんのサイズ：${sizeLabel}${largeType}`,
    `✂️ コース：${result.courseLabel}`,
    `　（${COURSE_DESC[input.course]}）`,
    ...dateLines(input.date),
    `💰 概算料金：${price(result.base ?? 0, result.isFrom)}（税込）`,
  ];

  if (result.extraNotes.length) {
    lines.push(
      input.course === 'single' ? '＜単品メニュー内訳＞' : '＜オプション・別途料金＞',
    );
    for (const n of result.extraNotes) lines.push(`　・${n}`);
  }

  lines.push(...noteLines(input.note));
  lines.push(...prepayMessageLines(input));
  lines.push('');
  for (const n of TRIM_POLICY_NOTES) lines.push(`※${n}`);
  lines.push(FOOTER);

  return lines.join('\n');
}
