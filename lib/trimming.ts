// トリミング見積もりの料金モデル・計算（クライアント提供の料金表より・すべて税込）

import type { PrepayFields } from './types';

export type TrimSize = 'small' | 'medium' | 'large' | 'other';
export type LargeType = 'miniature' | 'medium' | 'standard';
export type TrimCourse = 'shampoo' | 'trimming' | 'single';
export type TrimOptionKey = 'allShears' | 'matting' | 'spa';
export type SingleItemKey =
  | 'beard'
  | 'earHair'
  | 'teeth'
  | 'pawPad'
  | 'partialCut';

// お迎え/来店の時間帯
export type TrimTimeSlot = 'morning' | 'afternoon' | 'evening';

// ご希望日時（第1〜第3希望）
export interface TrimPref {
  date?: string; // 'YYYY-MM-DD'
  time?: TrimTimeSlot;
}

export const PREF_COUNT = 3;

export interface TrimInput extends PrepayFields {
  size: TrimSize | null;
  largeType?: LargeType; // 大型犬のみ
  course: TrimCourse;
  prefs?: TrimPref[]; // ご希望日時（[0]=第1希望…必須）
  seniorOrHealth?: boolean; // 13歳以上／健康に不安 → 要お問い合わせ
  options?: TrimOptionKey[]; // シャンプー/トリミングの別途オプション
  singleItems?: SingleItemKey[]; // 単品メニューの選択項目
  note?: string; // ご要望（一言）
}

export interface TrimResult {
  needsContact: boolean; // その他大型・13歳以上等 → 要お問い合わせ
  base: number | null; // コース基本料金（＋体重超過分）
  isFrom: boolean; // 「〜（目安）」表記か
  courseLabel: string;
  extraNotes: string[]; // 別途料金の説明（オールシザー・毛玉・スパ）
}

// サイズ表示ラベル
export const TRIM_SIZE_LABELS: Record<TrimSize, string> = {
  small: '小型犬（7kg未満）',
  medium: '中型犬（12kg未満）',
  large: '大型犬（12〜25kg未満）',
  other: 'その他大型犬',
};

export const LARGE_TYPE_LABELS: Record<LargeType, string> = {
  miniature: 'ミニチュア',
  medium: 'ミディアム',
  standard: 'スタンダード',
};

export const COURSE_LABELS: Record<TrimCourse, string> = {
  shampoo: 'シャンプーコース',
  trimming: 'トリミングコース',
  single: '単品メニュー',
};

// 時間帯（画面ボタン用の短ラベル＋補足、メッセージ用のフルラベル）
export const TIME_SLOTS: { key: TrimTimeSlot; label: string; note: string }[] = [
  { key: 'morning', label: '午前中', note: '' },
  { key: 'afternoon', label: '午後', note: '13:00〜15:00' },
  { key: 'evening', label: '夕方', note: '16:00〜18:00' },
];

export const TIME_SLOT_LABELS: Record<TrimTimeSlot, string> = {
  morning: '午前中',
  afternoon: '午後 13:00〜15:00',
  evening: '夕方 16:00〜18:00',
};

export const COURSE_DESC: Record<TrimCourse, string> = {
  shampoo: 'シャンプー&ブロー＋爪・足廻りの整え、耳掃除、簡単なムダ毛処理',
  trimming: 'シャンプーコース＋全身カット',
  single: 'ヒゲカット・耳毛抜き等（1箇所¥660〜）／部分カット（1箇所¥1,100）',
};

// 単品メニュー（1箇所ごとの料金）
export const SINGLE_ITEMS: { key: SingleItemKey; label: string; price: number }[] =
  [
    { key: 'beard', label: 'ヒゲカット', price: 660 },
    { key: 'earHair', label: '耳毛抜き', price: 660 },
    { key: 'teeth', label: 'ハミガキ', price: 660 },
    { key: 'pawPad', label: '足裏バリカン', price: 660 },
    { key: 'partialCut', label: '部分カット', price: 1100 },
  ];

// サイズ×コースで料金が決まるコース（単品メニューは除く）
type SizedCourse = Exclude<TrimCourse, 'single'>;

// 小型・中型の基本料金
const PRICE: Record<'small' | 'medium', Record<SizedCourse, number>> = {
  small: { shampoo: 6600, trimming: 8250 },
  medium: { shampoo: 7700, trimming: 9350 },
};

// 大型（ドゥードゥル等）は下限（〜）価格
const LARGE_PRICE: Record<LargeType, Record<SizedCourse, number>> = {
  miniature: { shampoo: 9350, trimming: 12350 },
  medium: { shampoo: 12000, trimming: 15000 },
  standard: { shampoo: 16000, trimming: 19000 },
};

// オプション定義（チェックボックス）
export const TRIM_OPTIONS: {
  key: TrimOptionKey;
  label: string;
  note: string; // 送信メッセージ・画面に出す別途料金説明
  sizes?: TrimSize[]; // 表示対象サイズ（未指定なら全サイズ）
  makesFrom?: boolean; // 選ぶと「〜（目安）」表記にする
}[] = [
  {
    key: 'allShears',
    label: 'オールシザー希望',
    note: '別途 ¥1,100〜4,400（スタイル・犬種による）',
    makesFrom: true,
  },
  {
    key: 'matting',
    label: '毛玉あり',
    note: '別途 ¥1,100〜3,300（毛玉料金）',
    makesFrom: true,
  },
  {
    key: 'spa',
    label: '温泉スパ希望',
    note: '別途料金（別府温泉の素で薬浴・要ご相談）',
  },
];

const empty = (): TrimResult => ({
  needsContact: false,
  base: null,
  isFrom: false,
  courseLabel: '',
  extraNotes: [],
});

export function calcTrim(input: TrimInput): TrimResult {
  if (!input.size) return empty();

  // その他大型・13歳以上/健康不安 → 要お問い合わせ
  if (input.size === 'other' || input.seniorOrHealth) {
    return { ...empty(), needsContact: true };
  }

  const courseLabel = COURSE_LABELS[input.course];

  // 単品メニュー：選択項目の合計（各1箇所ぶん・「〜」表記）
  if (input.course === 'single') {
    const items = input.singleItems ?? [];
    if (!items.length) return { ...empty(), courseLabel }; // 未選択 → 未確定
    let base = 0;
    const extraNotes: string[] = [];
    for (const it of SINGLE_ITEMS) {
      if (!items.includes(it.key)) continue;
      base += it.price;
      const suffix = it.key === 'partialCut' ? '' : '〜';
      extraNotes.push(
        `${it.label}：¥${it.price.toLocaleString('ja-JP')}${suffix}（1箇所）`,
      );
    }
    return { needsContact: false, base, isFrom: true, courseLabel, extraNotes };
  }

  const sized: SizedCourse = input.course;
  const opts = input.options ?? [];

  // 基本料金（サイズ×コース）
  let base: number | null;
  let isFrom = false;
  if (input.size === 'large') {
    if (!input.largeType) return { ...empty(), courseLabel }; // タイプ未選択
    base = LARGE_PRICE[input.largeType][sized];
    isFrom = true; // 大型は「〜」
  } else {
    base = PRICE[input.size][sized];
  }

  // 別途料金オプション（すべて別途扱い。範囲オプションは概算を「〜」に）
  const extraNotes: string[] = [];
  for (const meta of TRIM_OPTIONS) {
    if (!opts.includes(meta.key)) continue;
    if (meta.sizes && !meta.sizes.includes(input.size)) continue;
    if (meta.makesFrom) isFrom = true;
    extraNotes.push(`${meta.label}：${meta.note}`);
  }

  return { needsContact: false, base, isFrom, courseLabel, extraNotes };
}

// 選択済みオプションの表示ラベル（画面で対象外サイズは除外）
export function visibleTrimOptions(size: TrimSize | null) {
  return TRIM_OPTIONS.filter((o) => !o.sizes || (size && o.sizes.includes(size)));
}
