// 見積もりフォームで使う型定義（仕様書 7章）

export type DogSize = 'small' | 'medium' | 'large' | 'xlarge';
export type StayType = 'daycare' | 'overnight';
export type PickupTime = 'morning' | 'afternoon';

// 料金計算の対象になるサイズ（xlarge は要お問い合わせのため除外）
export type PricedSize = Exclude<DogSize, 'xlarge'>;

export interface EstimateInput {
  size: DogSize | null;
  stayType: StayType;
  checkIn?: string; // 'YYYY-MM-DD'（宿泊時）
  checkOut?: string; // 'YYYY-MM-DD'（宿泊時）
  pickupTime?: PickupTime; // 宿泊時
  daycareDate?: string; // 日帰り時の利用日（任意）
}

export interface PriceRule {
  daycare: number;
  perNight: number;
  halfDay: number;
}

export type PriceTable = Record<PricedSize, PriceRule>;

// 特別料金期間（繁忙期・特定日）
export interface SpecialPeriod {
  id: string;
  name: string; // 'お盆特別料金'
  start: string; // 'YYYY-MM-DD'（inclusive）
  end: string; // 'YYYY-MM-DD'（inclusive・最終宿泊日）
  // 方式A：1泊単価の上書き（推奨）
  perNight?: Record<PricedSize, number>;
  // 方式B：通常料金への加算（運用次第・任意）
  surcharge?: Record<PricedSize, number>;
  // 任意：半日・日帰りにも特別料金を適用する場合
  halfDay?: Record<PricedSize, number>;
  daycare?: Record<PricedSize, number>;
}

// 日別の料金内訳（特別料金の可視化に使用）
export interface NightBreakdown {
  date: string; // 'YYYY-MM-DD'
  amount: number;
  label: string; // '通常' / 'お盆特別料金' など
  isSpecial: boolean;
}

export interface EstimateResult {
  needsContact: boolean; // true なら要お問い合わせ
  total: number | null;
  nights: number;
  label: string; // 例: '2泊半' / '日帰り'
  breakdown: NightBreakdown[]; // 宿泊の日別内訳（特別料金含む）
  halfDayFee: number; // 半日加算分（0なら未適用）
  hasSpecial: boolean; // 特別料金が1泊でも含まれるか
}

// サイズの表示ラベル（画面・送信メッセージで共用）
export const SIZE_LABELS: Record<DogSize, string> = {
  small: '小型犬（7kg未満）',
  medium: '中型犬（12kg未満）',
  large: '大型犬（12〜25kg未満）',
  xlarge: '大型犬（25kg以上）',
};
