import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '【検証用】ペットホテル見積もり',
};

export default function DevHotelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
