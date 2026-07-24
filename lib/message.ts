// LINE送信メッセージ生成（仕様書 8章 + 料金詳細反映）

import { format, parseISO } from 'date-fns';
import type { EstimateInput, EstimateResult } from './types';
import { SIZE_LABELS } from './types';
import { findPickupSlot, isFromPrice, perNightOf } from './pricing';
import { selectedRequestLabels } from './request';
import {
  cancelNote,
  CANCEL_TITLE,
  ESTIMATE_FOOTER as FOOTER,
  TRIMMING_NOTE,
} from './notices';

const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;
const jpDate = (iso: string) => format(parseISO(iso), 'yyyy/MM/dd');
const mdDate = (iso: string) => format(parseISO(iso), 'M/d');
// 大型犬など下限価格は「〜」付き
const price = (n: number, from: boolean) => `${yen(n)}${from ? '〜' : ''}`;

// ご要望（任意）。チェック項目＋一言があれば行を返す。
const requestLines = (input: EstimateInput): string[] => {
  const labels = selectedRequestLabels(input.options);
  const note = input.note?.trim();
  if (!labels.length && !note) return [];
  const lines: string[] = [];
  if (labels.length) lines.push(`📝 ご要望：${labels.join('、')}`);
  if (note) lines.push(labels.length ? `　${note}` : `📝 ご要望：${note}`);
  return lines;
};

const cancelLine = (input: EstimateInput) =>
  `※${CANCEL_TITLE}｜${cancelNote(perNightOf(input.size), isFromPrice(input.size))}`;

/**
 * 見積もり内容から LINE トーク送信用のテキストを生成する。
 * - xlarge（要お問い合わせ）は相談導線の文面
 * - 特別料金・半日加算・延長料金が含まれる宿泊は内訳を添える
 */
export function buildMessage(
  input: EstimateInput,
  result: EstimateResult,
): string {
  const sizeLabel = input.size ? SIZE_LABELS[input.size] : '';

  // 8.3 「それ以上」＝要お問い合わせ
  if (result.needsContact) {
    return [
      '【お預かりのご相談】',
      `🐶 ワンちゃんのサイズ：${sizeLabel}`,
      `${sizeLabel}のお預かり料金について相談したいです。`,
      'ご希望日程など、追ってメッセージします。',
      ...requestLines(input),
    ].join('\n');
  }

  // 8.2 日帰り
  if (input.stayType === 'daycare') {
    const useLine = input.daycareDate
      ? `日帰り（${jpDate(input.daycareDate)}）`
      : '日帰り';
    return [
      '【ホテル予約リクエスト】',
      `🐶 ワンちゃんのサイズ：${sizeLabel}`,
      `📅 ご利用：${useLine}`,
      `💰 概算料金：${price(result.total ?? 0, result.isEstimateFrom)}（税込）`,
      ...(result.hasSpecial ? ['　※特別料金期間を含みます'] : []),
      ...requestLines(input),
      '',
      TRIMMING_NOTE,
      cancelLine(input),
      FOOTER,
    ].join('\n');
  }

  // 8.1 / 8.2.1 宿泊
  const slot = findPickupSlot(input.pickupSlot);
  const pickupLabel = slot ? `お迎え${slot.label}` : '';
  const lines: string[] = [
    '【ホテル予約リクエスト】',
    `🐶 ワンちゃんのサイズ：${sizeLabel}`,
    `📅 ご利用：宿泊 ${result.label}`,
  ];

  if (input.checkIn) lines.push(`　チェックイン：${jpDate(input.checkIn)}`);
  if (input.checkOut) {
    lines.push(`　チェックアウト：${jpDate(input.checkOut)}（${pickupLabel}）`);
  }

  // 特別料金が含まれる場合は日別内訳を添える（8.2.1）
  if (result.hasSpecial) {
    for (const b of result.breakdown) {
      lines.push(`　・${mdDate(b.date)}（${b.label}）：${yen(b.amount)}`);
    }
  }
  if (result.halfDayFee > 0) {
    lines.push(`　・半日加算（12:00超のお迎え）：${yen(result.halfDayFee)}`);
  }
  if (result.overtimeFee > 0) {
    lines.push(`　・夜間料金（18:00以降のお迎え）：${yen(result.overtimeFee)}`);
  }

  lines.push(
    `💰 概算料金：${price(result.total ?? 0, result.isEstimateFrom)}（税込）`,
  );
  if (result.hasSpecial) {
    lines.push('　※特別料金期間を含みます');
  }
  lines.push(...requestLines(input));
  lines.push('', TRIMMING_NOTE, cancelLine(input), FOOTER);

  return lines.join('\n');
}
