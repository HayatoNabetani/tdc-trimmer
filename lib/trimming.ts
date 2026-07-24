// トリミング見積もりの料金モデル・計算（クライアント提供の料金表より・すべて税込）

export type TrimSize = 'small' | 'medium' | 'large' | 'other';
export type LargeType = 'miniature' | 'medium' | 'standard';
export type TrimCourse = 'shampoo' | 'trimming';
export type TrimOptionKey = 'overWeight' | 'allShears' | 'matting' | 'spa';

export interface TrimInput {
  size: TrimSize | null;
  largeType?: LargeType; // 大型犬のみ
  course: TrimCourse;
  seniorOrHealth?: boolean; // 13歳以上／健康に不安 → 要お問い合わせ
  options?: TrimOptionKey[];
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
};

export const COURSE_DESC: Record<TrimCourse, string> = {
  shampoo: 'シャンプー&ブロー＋爪・足廻りの整え、耳掃除、簡単なムダ毛処理',
  trimming: 'シャンプーコース＋全身カット',
};

// 小型・中型の基本料金
const PRICE: Record<'small' | 'medium', Record<TrimCourse, number>> = {
  small: { shampoo: 6600, trimming: 8250 },
  medium: { shampoo: 7700, trimming: 9350 },
};

// 大型（ドゥードゥル等）は下限（〜）価格
const LARGE_PRICE: Record<LargeType, Record<TrimCourse, number>> = {
  miniature: { shampoo: 9350, trimming: 12350 },
  medium: { shampoo: 12000, trimming: 15000 },
  standard: { shampoo: 16000, trimming: 19000 },
};

// 規定体重超過の別途料金（小型7kg／中型12kg以上）
export const OVER_WEIGHT_FEE = 550;

// オプション定義（チェックボックス）
export const TRIM_OPTIONS: {
  key: TrimOptionKey;
  label: string;
  note: string; // 送信メッセージ・画面に出す別途料金説明
  sizes?: TrimSize[]; // 表示対象サイズ（未指定なら全サイズ）
  makesFrom?: boolean; // 選ぶと「〜（目安）」表記にする
}[] = [
  {
    key: 'overWeight',
    label: '規定体重を超える（小型7kg／中型12kg以上）',
    note: `別途 ¥${OVER_WEIGHT_FEE.toLocaleString('ja-JP')}`,
    sizes: ['small', 'medium'],
  },
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

  const opts = input.options ?? [];
  const courseLabel = COURSE_LABELS[input.course];

  // 基本料金
  let base: number | null;
  let isFrom = false;
  if (input.size === 'large') {
    if (!input.largeType) return empty(); // タイプ未選択
    base = LARGE_PRICE[input.largeType][input.course];
    isFrom = true; // 大型は「〜」
  } else {
    base = PRICE[input.size][input.course];
  }

  // 別途料金オプション
  const extraNotes: string[] = [];
  for (const meta of TRIM_OPTIONS) {
    if (!opts.includes(meta.key)) continue;
    if (meta.sizes && !meta.sizes.includes(input.size)) continue;
    if (meta.key === 'overWeight') {
      base += OVER_WEIGHT_FEE; // 固定加算
    } else {
      if (meta.makesFrom) isFrom = true; // 範囲オプションは「〜」に
    }
    extraNotes.push(`${meta.label}：${meta.note}`);
  }

  return { needsContact: false, base, isFrom, courseLabel, extraNotes };
}

// 選択済みオプションの表示ラベル（画面で対象外サイズは除外）
export function visibleTrimOptions(size: TrimSize | null) {
  return TRIM_OPTIONS.filter((o) => !o.sizes || (size && o.sizes.includes(size)));
}
