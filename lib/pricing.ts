// 通常料金テーブル + お迎えスロット + 見積もり計算ロジック（仕様書 5章 + 料金詳細反映）
//
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
  PickupSlot,
  PriceTable,
  SpecialPeriod,
} from './types';
import { SPECIAL_PERIODS } from './specialPricing';

// 通常料金テーブル（クライアント提供の料金表より）
// - 1泊 ＝ お預かり日〜翌日12:00
// - 大型犬は日帰りなし（daycare: null）。1泊は「10,000円〜」の下限値
// - ⚠️ halfDay（12:00超のお迎えで加算する半日分）の金額は未提示のため暫定。
//   暫定で「日帰り料金」を半日分とみなして設定。大型は日帰りが無いため暫定値。→ 要確認
export const PRICE_TABLE: PriceTable = {
  small: { daycare: 3300, perNight: 4950, halfDay: 3300 },
  medium: { daycare: 3800, perNight: 7700, halfDay: 3800 },
  large: { daycare: null, perNight: 10000, halfDay: 5000 }, // halfDay 暫定・要確認
};

// 大型犬の 1泊料金は「10,000円〜」の下限表示
export const LARGE_IS_FROM = true;

// 18:00以降の延長料金（1時間ごと）
export const OVERTIME_HOURLY = 1100;

// お迎え時間帯のスロット定義
// 12:00超 → 半日分加算 / 18:00以降 → さらに1時間ごと延長料金
export const PICKUP_SLOTS: PickupSlot[] = [
  { id: 'by12', label: '〜12:00', needsHalfDay: false, overtimeHours: 0 },
  { id: 'by18', label: '12:00〜18:00', needsHalfDay: true, overtimeHours: 0 },
  { id: 'over18_1', label: '18:00〜19:00', needsHalfDay: true, overtimeHours: 1 },
  { id: 'over18_2', label: '19:00〜20:00', needsHalfDay: true, overtimeHours: 2 },
  { id: 'over18_3', label: '20:00〜21:00', needsHalfDay: true, overtimeHours: 3 },
];

export function findPickupSlot(id?: string): PickupSlot | null {
  return PICKUP_SLOTS.find((s) => s.id === id) ?? null;
}

const empty = (): EstimateResult => ({
  needsContact: false,
  total: null,
  nights: 0,
  label: '',
  breakdown: [],
  halfDayFee: 0,
  overtimeFee: 0,
  hasSpecial: false,
  isEstimateFrom: false,
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

  // 日帰り（特別料金適用は運用次第。v1は通常料金。大型は日帰り無し）
  if (input.stayType === 'daycare') {
    if (rule.daycare == null) return empty();
    return { ...empty(), total: rule.daycare, label: '日帰り' };
  }

  // 宿泊
  if (!input.checkIn || !input.checkOut || !input.pickupSlot) return empty();
  const slot = findPickupSlot(input.pickupSlot);
  if (!slot) return empty();
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

  const halfDayFee = slot.needsHalfDay ? rule.halfDay : 0;
  const overtimeFee = slot.overtimeHours * OVERTIME_HOURLY;
  const total = base + halfDayFee + overtimeFee;

  // ラベル：◯泊（＋半 / ＋延長Nh）
  let label = `${dates.length}泊`;
  if (slot.needsHalfDay) label += '半';
  if (slot.overtimeHours > 0) label += `＋延長${slot.overtimeHours}h`;

  return {
    needsContact: false,
    total,
    nights: dates.length,
    label,
    breakdown,
    halfDayFee,
    overtimeFee,
    hasSpecial,
    isEstimateFrom: size === 'large' && LARGE_IS_FROM,
  };
}
