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
 * liff.init を一度だけ実行する（多重初期化を防ぐためにキャッシュ）。
 * 失敗時は呼び出し側でハンドリングできるよう例外を投げる。
 */
export function initLiff(): Promise<void> {
  if (initPromise) return initPromise;

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) {
    return Promise.reject(
      new Error('NEXT_PUBLIC_LIFF_ID が未設定です（.env.local を確認）'),
    );
  }

  initPromise = liff.init({ liffId });
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
