import type { Metadata } from 'next';

// LIFFのヘッダー等に出るページタイトル（/estimate 用）
export const metadata: Metadata = {
  title: 'ペットホテル見積もりシミュレーター',
};

export default function EstimateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
