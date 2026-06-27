// 特別料金期間データ（繁忙期・特定日）（仕様書 5.2）
//
// ⚠️ 期間・金額はすべて仮。クライアント確認後に確定する（仕様書 11章）。
// v1は「方式A（単価上書き / perNight）」を基準に運用。
// 加算方式に切り替える場合は perNight を外し surcharge を設定する。
//
// 「終了(end)」は その日を最後の宿泊日として含む（inclusive）。
// 重なり判定は start <= 宿泊日 <= end。

import type { SpecialPeriod } from './types';

export const SPECIAL_PERIODS: SpecialPeriod[] = [
  {
    id: 'obon-2026',
    name: 'お盆特別料金',
    start: '2026-08-10',
    end: '2026-08-17',
    perNight: { small: 6500, medium: 8000, large: 9500 },
  },
  {
    id: 'newyear-2026',
    name: '年末年始',
    start: '2026-12-29',
    end: '2027-01-03',
    perNight: { small: 7000, medium: 8500, large: 10000 },
  },
];
