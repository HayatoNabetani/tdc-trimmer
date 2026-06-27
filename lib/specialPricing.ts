// 特別料金期間データ（繁忙期・特定日）（仕様書 5.2）
//
// 運用：方式B（加算 / surcharge）。対象期間の各泊に +¥550。
// 「終了(end)」は その日を最後の宿泊日として含む（inclusive）。
// 重なり判定は start <= 宿泊日 <= end。
//
// ※ 年は 2026 で設定。年が変わる場合はここを更新する。
// ※ 日帰り・半日加算への適用有無は未確定（現状は宿泊1泊単価のみ加算）→ 要確認。

import type { SpecialPeriod } from './types';

const SURCHARGE_550 = { small: 550, medium: 550, large: 550 };

export const SPECIAL_PERIODS: SpecialPeriod[] = [
  {
    id: 'special-2026-07',
    name: '特別料金',
    start: '2026-07-18',
    end: '2026-07-20',
    surcharge: SURCHARGE_550,
  },
  {
    id: 'special-2026-08',
    name: '特別料金',
    start: '2026-08-08',
    end: '2026-08-16',
    surcharge: SURCHARGE_550,
  },
  {
    id: 'special-2026-09',
    name: '特別料金',
    start: '2026-09-19',
    end: '2026-09-23',
    surcharge: SURCHARGE_550,
  },
];
