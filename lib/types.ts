// 見積もりフォームで使う型定義（仕様書 7章 + 料金詳細反映）

export type DogSize = 'small' | 'medium' | 'large' | 'xlarge';
export type StayType = 'daycare' | 'overnight';

// お迎え時間帯のスロットID（実体は pricing.ts の PICKUP_SLOTS で定義）
// by12   : 〜12:00（追加なし）
// by18   : 12:00〜18:00（半日分加算）
// over18_* : 18:00以降（半日分 ＋ 1時間ごと延長料金）
export type PickupSlotId = 'by12' | 'by18' | 'over18_1' | 'over18_2' | 'over18_3';

// 料金計算の対象になるサイズ（xlarge は要お問い合わせのため除外）
export type PricedSize = Exclude<DogSize, 'xlarge'>;

export interface EstimateInput {
  size: DogSize | null;
  stayType: StayType;
  checkIn?: string; // 'YYYY-MM-DD'（宿泊時）
  checkOut?: string; // 'YYYY-MM-DD'（宿泊時）
  pickupSlot?: PickupSlotId; // 宿泊時のお迎え時間帯
  daycareDate?: string; // 日帰り時の利用日（任意）
}

export interface PriceRule {
  daycare: number | null; // 日帰り料金（大型犬は日帰りなし → null）
  perNight: number; // 1泊（お預かり日〜翌日12:00）
  halfDay: number; // 12:00超のお迎えで加算する半日分
}

export type PriceTable = Record<PricedSize, PriceRule>;

// お迎え時間帯スロット
export interface PickupSlot {
  id: PickupSlotId;
  label: string; // 'お迎え 〜12:00' など
  needsHalfDay: boolean; // 半日分を加算するか
  overtimeHours: number; // 18:00以降の延長時間数（×時間単価）
}

// 特別料金期間（繁忙期・特定日）
export interface SpecialPeriod {
  id: string;
  name: string; // '特別料金' など
  start: string; // 'YYYY-MM-DD'（inclusive）
  end: string; // 'YYYY-MM-DD'（inclusive・最終宿泊日）
  // 方式A：1泊単価の上書き
  perNight?: Record<PricedSize, number>;
  // 方式B：通常料金への加算（今回の運用はこちら：+550/泊）
  surcharge?: Record<PricedSize, number>;
  // 任意：半日・日帰りにも特別料金を適用する場合
  halfDay?: Record<PricedSize, number>;
  daycare?: Record<PricedSize, number>;
}

// 日別の料金内訳（特別料金の可視化に使用）
export interface NightBreakdown {
  date: string; // 'YYYY-MM-DD'
  amount: number;
  label: string; // '通常' / '特別料金' など
  isSpecial: boolean;
}

export interface EstimateResult {
  needsContact: boolean; // true なら要お問い合わせ
  total: number | null;
  nights: number;
  label: string; // 例: '2泊半' / '日帰り'
  breakdown: NightBreakdown[]; // 宿泊の日別内訳（特別料金含む）
  halfDayFee: number; // 半日加算分（0なら未適用）
  overtimeFee: number; // 18:00以降の延長料金（0なら未適用）
  hasSpecial: boolean; // 特別料金が1泊でも含まれるか
  isEstimateFrom: boolean; // 「〜」表記（大型犬など下限価格）か
}

// サイズの表示ラベル（画面・送信メッセージで共用）
export const SIZE_LABELS: Record<DogSize, string> = {
  small: '小型犬（7kg未満）',
  medium: '中型犬（12kg未満）',
  large: '大型犬（12〜25kg未満）',
  xlarge: '大型犬（25kg以上）',
};
