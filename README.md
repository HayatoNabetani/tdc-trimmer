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
> 外部ブラウザで `/estimate` を開くと「LINEアプリから開いてください」案内が出る。

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

## 料金の変更

- **通常料金**: `lib/pricing.ts` の `PRICE_TABLE`
- **特別料金（お盆・年末年始など）**: `lib/specialPricing.ts` の `SPECIAL_PERIODS`
  - 方式A（単価上書き / `perNight`）で運用中。加算方式にするなら `perNight` を外し `surcharge` を設定
  - `end` はその日を最終宿泊日として含む（inclusive）

金額・期間はすべて**仮の値**。クライアント確認後に確定すること（仕様書11章）。

## 実装メモ・仕様書との差分

- 宿泊料金は **1泊ごと（チェックイン〜チェックアウト前日の各日）** に特別料金を判定。
- **§5.4 の計算例④（中型犬 8/12→8/14）の `¥13,500` は §5.2 のデータと不整合**。
  §5.2 ではお盆 = 8/10〜8/17 のため 8/12・8/13 とも特別料金となり、正しくは **¥16,000**。
  本実装は §5.2 のデータ＋「1泊ごとに判定」ルールに忠実。例文はお盆を 8/13 開始と
  みなした別前提で書かれている。**お盆期間の正しい開始日をクライアントに要確認。**
- 税込/税抜表示は「（税込）」固定。方針確定後に文言調整（仕様書11章 #7）。
- v1 はプレーンテキスト送信。Flex Message 化はフェーズ2（仕様書8章末尾 / 10章）。
- 見積もりログのDB保存（Supabase）は未実装（フェーズ2 / 仕様書10章）。
```
