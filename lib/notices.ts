// 画面・送信メッセージで共用する注意書き（文言を1か所に集約）

// トリミング希望（チェックボックス）。別途料金の説明を添える。
export const TRIMMING_LABEL = 'トリミングも希望する';
export const TRIMMING_FEE_NOTE = '別途料金がかかります';

// キャンセル規定：ご利用日の7日前まで、キャンセル料はサイズの「1泊分」。
// 金額はサイズにより変わるため、1泊単価を受け取って文言を組み立てる。
export const CANCEL_TITLE = 'キャンセル規定';
export function cancelNote(perNight: number | null, isFrom = false): string {
  const portion =
    perNight == null
      ? 'わんちゃんのサイズの1泊分'
      : `1泊分（¥${perNight.toLocaleString('ja-JP')}${isFrom ? '〜' : ''}・税込）`;
  return `ご利用日の7日前まで：キャンセル料として${portion}を申し受けます。`;
}

export const ESTIMATE_FOOTER =
  '※こちらは概算です。正式なお見積もり・空き状況はスタッフよりご案内します。';
