import type { Metadata } from 'next';

// LIFFのヘッダー等に出るページタイトル（/trimming 用）
export const metadata: Metadata = {
  title: 'トリミング見積もりシミュレーター',
};

export default function TrimmingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
