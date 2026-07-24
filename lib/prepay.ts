// 事前決済まわりの共通ロジック（ホテル/トリミング共通）

import type { PrepayFields } from './types';

// 送信メッセージ用の行
export function prepayMessageLines(input: PrepayFields): string[] {
  if (input.prepay !== 'yes') return [];
  const method = input.prepayContact === 'email' ? 'メール' : 'SMS';
  const value = input.prepayValue?.trim();
  return [
    '💳 事前決済：希望',
    ...(value ? [`　${method}：${value}`] : []),
    '　※後ほど決済のご案内をお送りします。',
  ];
}

// 「希望する」なら連絡方法・連絡先が必要。未入力ならガイド文を返す（OKなら null）。
export function prepayGuide(input: PrepayFields): string | null {
  if (input.prepay !== 'yes') return null;
  if (!input.prepayContact) return '決済案内の連絡方法を選んでください';
  if (!input.prepayValue?.trim()) {
    return input.prepayContact === 'email'
      ? 'メールアドレスをご記入ください'
      : '携帯番号をご記入ください';
  }
  return null;
}
