// 通常料金テーブル + 見積もり計算ロジック（仕様書 5章）
//
// ⚠️ 金額はすべて仮。クライアント確認後に確定する（仕様書 11章）。
// 料金は変更が入りやすいので、このファイルに集約している。

import {
  differenceInCalendarDays,
  parseISO,
  addDays,
  format,
} from 'date-fns';
import type {
  EstimateInput,
  EstimateResult,
  NightBreakdown,
  PriceTable,
  SpecialPeriod,
} from './types';
import { SPECIAL_PERIODS } from './specialPricing';

// 通常料金テーブル（税込／税抜の方針は要確認・仕様書 11章）
export const PRICE_TABLE: PriceTable = {
  small: { daycare: 3000, perNight: 4500, halfDay: 2000 },
  medium: { daycare: 4000, perNight: 5500, halfDay: 2500 },
  large: { daycare: 5000, perNight: 7000, halfDay: 3000 },
};

const empty = (): EstimateResult => ({
  needsContact: false,
  total: null,
  nights: 0,
  label: '',
  breakdown: [],
  halfDayFee: 0,
  hasSpecial: false,
});

// 宿泊する各日付（チェックイン 〜 チェックアウト前日）
export function nightDates(checkIn: string, checkOut: string): string[] {
  const start = parseISO(checkIn);
  const n = differenceInCalendarDays(parseISO(checkOut), start);
  if (n < 1) return [];
  return Array.from({ length: n }, (_, i) =>
    format(addDays(start, i), 'yyyy-MM-dd'),
  );
}

// その日付に適用される特別料金期間を返す（なければ null）
export function findSpecial(
  date: string,
  specials: SpecialPeriod[],
): SpecialPeriod | null {
  return specials.find((p) => p.start <= date && date <= p.end) ?? null;
}

export function calcEstimate(
  input: EstimateInput,
  table: PriceTable = PRICE_TABLE,
  specials: SpecialPeriod[] = SPECIAL_PERIODS,
): EstimateResult {
  // 要お問い合わせ
  if (input.size === 'xlarge') {
    return { ...empty(), needsContact: true, label: '要お問い合わせ' };
  }
  if (!input.size) return empty();

  const size = input.size;
  const rule = table[size];

  // 日帰り（特別料金適用は運用次第。v1は通常料金）
  if (input.stayType === 'daycare') {
    return { ...empty(), total: rule.daycare, label: '日帰り' };
  }

  // 宿泊
  if (!input.checkIn || !input.checkOut || !input.pickupTime) return empty();
  const dates = nightDates(input.checkIn, input.checkOut);
  if (dates.length < 1) return empty(); // checkOut <= checkIn はバリデーションで弾く

  let base = 0;
  let hasSpecial = false;
  const breakdown: NightBreakdown[] = dates.map((date) => {
    const sp = findSpecial(date, specials);
    // 方式A（単価上書き）優先。なければ方式B（加算）、どちらも無ければ通常
    let amount = rule.perNight;
    if (sp?.perNight?.[size] != null) amount = sp.perNight[size];
    else if (sp?.surcharge?.[size] != null)
      amount = rule.perNight + sp.surcharge[size];
    const isSpecial = !!sp;
    if (isSpecial) hasSpecial = true;
    base += amount;
    return { date, amount, label: sp?.name ?? '通常', isSpecial };
  });

  const isHalf = input.pickupTime === 'afternoon';
  const halfDayFee = isHalf ? rule.halfDay : 0;
  const total = base + halfDayFee;
  const label = `${dates.length}泊${isHalf ? '半' : ''}`;

  return {
    needsContact: false,
    total,
    nights: dates.length,
    label,
    breakdown,
    halfDayFee,
    hasSpecial,
  };
}
