// LIFF 初期化ラッパー（仕様書 6.3）
//
// LIFF SDK はクライアントサイド実行のため、利用側は 'use client' で呼ぶこと。

import liff from '@line/liff';

let initPromise: Promise<void> | null = null;

export type LiffState = {
  ready: boolean;
  isInClient: boolean;
  loggedIn: boolean;
  error: string | null;
};

/**
 * NEXT_PUBLIC_LIFF_ID を正規化する。
 * 誤って LIFF URL（https://liff.line.me/xxxx）全体を入れてしまっても
 * ID 部分だけを取り出す。前後の空白・改行も除去。
 */
export function normalizeLiffId(raw: string): string {
  const v = raw.trim();
  const m = v.match(/liff\.line\.me\/([^/?#\s]+)/);
  return m ? m[1] : v;
}

/**
 * liff.init を一度だけ実行する（多重初期化を防ぐためにキャッシュ）。
 * パスごとに別のLIFFアプリを使う場合は rawId を渡す（未指定なら NEXT_PUBLIC_LIFF_ID）。
 * 失敗時は呼び出し側でハンドリングできるよう例外を投げる。
 */
export function initLiff(rawId?: string): Promise<void> {
  if (initPromise) return initPromise;

  const raw = rawId || process.env.NEXT_PUBLIC_LIFF_ID;
  if (!raw) {
    return Promise.reject(
      new Error('LIFF ID が未設定です（.env / Vercel の環境変数を確認）'),
    );
  }

  initPromise = liff.init({ liffId: normalizeLiffId(raw) });
  return initPromise;
}

// LINEアプリ内で開かれているか
export function isInClient(): boolean {
  return liff.isInClient();
}

/**
 * テキストメッセージをトークへ送信する。
 * chat_message.write スコープが必要（仕様書 3章）。
 */
export async function sendTextMessage(text: string): Promise<void> {
  await liff.sendMessages([{ type: 'text', text }]);
}

export function closeWindow(): void {
  liff.closeWindow();
}

export { liff };
