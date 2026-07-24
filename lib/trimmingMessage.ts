// トリミング見積もりの LINE 送信メッセージ生成

import { format, parseISO } from 'date-fns';
import {
  COURSE_DESC,
  LARGE_TYPE_LABELS,
  TIME_SLOT_LABELS,
  TRIM_SIZE_LABELS,
  type TrimInput,
  type TrimResult,
} from './trimming';
import { prepayMessageLines } from './prepay';

const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;
const price = (n: number, from: boolean) => `${yen(n)}${from ? '〜' : ''}`;
const jpDate = (iso: string) => format(parseISO(iso), 'yyyy/MM/dd');

const ORD = ['第1希望', '第2希望', '第3希望'];

// ご希望日時（日付のある希望のみ列挙。第1/第2/第3 は元の位置で対応）
const prefLines = (input: TrimInput): string[] => {
  const filled = (input.prefs ?? [])
    .map((p, i) => ({ p, i }))
    .filter((x) => x.p?.date);
  if (!filled.length) return [];
  const lines = ['📅 ご希望日時'];
  for (const { p, i } of filled) {
    const time = `（${TIME_SLOT_LABELS[p.time ?? 'any']}）`; // 既定は「どこでも」
    lines.push(`　${ORD[i] ?? `第${i + 1}希望`}：${jpDate(p.date!)}${time}`);
  }
  return lines;
};

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
      ...prefLines(input),
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
    ...prefLines(input),
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
