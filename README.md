# ペットホテル見積もりフォーム（LIFF）

LINE公式アカウントのリッチメニューから起動する、犬のお預かり料金の概算見積もりフォーム。
仕様書 v0.2 に基づく実装（Next.js App Router / LIFF SDK v2）。

## セットアップ

```bash
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_LIFF_ID を設定
npm run dev                         # http://localhost:3000/estimate
```

`NEXT_PUBLIC_LIFF_ID` は LINE Developers の `esti` ログインチャネル配下に作成した
LIFFアプリのID。Vercel にデプロイし、その URL（`/estimate`）を LIFF エンドポイントに登録する。

> LIFF はLINEアプリ内でのみ正常動作する（`liff.isInClient()` 判定）。
> **本番**で外部ブラウザから `/estimate` を開くと「LINEアプリから開いてください」案内が出る。

### 開発モード（localhost）

開発ビルド（`NODE_ENV !== 'production'`）では LINE外でもフォームを確認できるよう、
以下を自動でバイパスする（本番ビルドでは従来どおりの挙動）。

- `isInClient()` が `false` でも案内画面で止めず、フォームを表示する
- `NEXT_PUBLIC_LIFF_ID` 未設定で `liff.init` が失敗しても UI を表示する
- 送信ボタンは `sendMessages` を呼ばず、**送信文面をコンソールにプレビュー出力**する
  （画面上部に「開発モード（LINE外）」バナーを表示）

実機のトーク送信まで確認したい場合は、Vercel 等にデプロイし LINE アプリ内から開く。

## 構成

```
app/estimate/page.tsx                  フォーム本体（状態管理・LIFF初期化・送信）
app/estimate/components/
  SizeSelector.tsx                     ① サイズ選択
  StaySelector.tsx                     ② 日帰り/宿泊・日付・お迎え時間帯
  EstimateSummary.tsx                  ③ 下部固定サマリー＋④送信ボタン
lib/
  types.ts                             型定義（仕様書7章）
  pricing.ts                           通常料金テーブル＋計算 calcEstimate()
  specialPricing.ts                    特別料金期間データ（繁忙期・特定日）
  message.ts                           LINE送信テキスト生成（仕様書8章）
  liff.ts                              liff.init / sendMessages ラッパー
```

## 料金モデル（クライアント提供の料金表より）

### ベース料金（`lib/pricing.ts` の `PRICE_TABLE`）

| サイズ | 日帰り | 1泊 |
|---|---|---|
| 小型犬（7kg未満） | ¥3,300 | ¥4,950 |
| 中型犬（12kg未満） | ¥3,800 | ¥7,700 |
| 大型犬（12〜25kg未満） | なし | ¥10,000〜 |
| それ以上（25kg〜） | — | 要お問い合わせ |

- 1泊 ＝ お預かり日〜**翌日12:00**まで。
- 大型犬は日帰りなし／1泊は「10,000円〜」の下限表示（画面・メッセージで「〜」付き）。

### お迎え時間による加算（`PICKUP_SLOTS` / `OVERTIME_HOURLY`）

| お迎え時間帯 | 加算 |
|---|---|
| 〜12:00 | なし |
| 12:00〜18:00 | ＋半日分 |
| 18:00以降 | ＋半日分 ＋ 1時間ごと ¥1,100 |

### 特別料金（`lib/specialPricing.ts` の `SPECIAL_PERIODS`）

- 対象期間：**7/18〜7/20 / 8/8〜8/16 / 9/19〜9/23**（2026年）、各泊 **＋¥550**
- 方式B（加算 / `surcharge`）で運用。`end` はその日を最終宿泊日として含む（inclusive）
- **1泊ごと**に判定するため、一部の夜だけ特別料金になるケースも自然に計算される

## 要確認事項（実装は暫定値）

- **「半日分」の金額が未提示**。暫定で「日帰り料金」を半日分とみなして設定
  （小型¥3,300／中型¥3,800／大型¥5,000）。`PRICE_TABLE` の `halfDay` で調整。**要確認**
- **特別料金を日帰り・半日加算にも適用するか未確定**。現状は宿泊1泊単価のみ加算
- **18:00以降の最終お迎え時刻**（現状 21:00 まで）と各時間帯の境界。`PICKUP_SLOTS` で調整
- 料金表中の「12kg以上は550円追加」注記は、weight別カテゴリ選択（大型犬＝12kg以上）で
  既に区分されるため二重加算していない。中型枠に12kg超を含める運用なら別途要検討
- 税込/税抜表示は「（税込）」固定。方針確定後に文言調整（仕様書11章 #7）

## 実装メモ

- 日付入力は `min`（今日）を設定し**過去日付を選べない**。チェックアウトは
  チェックイン日以降のみ。逆転（チェックアウト ≦ チェックイン）はバリデーションでも弾く。
- v1 はプレーンテキスト送信。Flex Message 化はフェーズ2（仕様書8章末尾 / 10章）。
- 見積もりログのDB保存（Supabase）は未実装（フェーズ2 / 仕様書10章）。
