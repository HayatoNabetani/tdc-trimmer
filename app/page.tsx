import { redirect } from 'next/navigation';

// ルートはフォーム本体へ誘導（LIFFエンドポイントは /estimate）
export default function Home() {
  redirect('/estimate');
}
