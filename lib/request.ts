// ご要望のチェック項目（任意）。ラベルを1か所に集約。

import type { RequestOptionKey } from './types';

export const REQUEST_OPTIONS: { key: RequestOptionKey; label: string }[] = [
  { key: 'meal', label: '日数分のお食事' },
  { key: 'treat', label: 'おやつ' },
  { key: 'toilet', label: 'トイレ' },
  { key: 'dish', label: '食器' },
  { key: 'allergy', label: 'アレルギー有無' },
];

// 選択済みキー配列 → 表示ラベル配列（定義順を維持）
export function selectedRequestLabels(options?: RequestOptionKey[]): string[] {
  if (!options?.length) return [];
  return REQUEST_OPTIONS.filter((o) => options.includes(o.key)).map(
    (o) => o.label,
  );
}
