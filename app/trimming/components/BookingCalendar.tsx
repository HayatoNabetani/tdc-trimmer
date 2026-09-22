'use client';

import { useState } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, format, parseISO, startOfMonth } from 'date-fns';
import { isTrimDateAvailable, TRIM_STORES, type TrimStore } from '@/lib/trimming';

export function BookingCalendar({ store, value, label, onChange }: {
  store?: TrimStore;
  value: string;
  label: string;
  onChange: (date: string) => void;
}) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [month, setMonth] = useState(() => startOfMonth(parseISO(value || today)));
  const days = eachDayOfInterval({ start: month, end: endOfMonth(month) });
  return (
    <div role="group" aria-label={label} className="rounded-lg border border-gray-300 bg-white p-3">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" aria-label={`${label}：前の月`} disabled={month <= startOfMonth(parseISO(today))}
          onClick={() => setMonth(addMonths(month, -1))} className="rounded px-3 py-2 disabled:opacity-30">‹</button>
        <span className="text-sm font-bold">{format(month, 'yyyy年M月')}</span>
        <button type="button" aria-label={`${label}：次の月`} onClick={() => setMonth(addMonths(month, 1))}
          className="rounded px-3 py-2">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {['日', '月', '火', '水', '木', '金', '土'].map((day) => <span key={day} className="py-1 text-xs text-gray-500">{day}</span>)}
        {Array.from({ length: month.getDay() }, (_, i) => <span key={`blank-${i}`} />)}
        {days.map((day) => {
          const date = format(day, 'yyyy-MM-dd');
          const available = !!store && isTrimDateAvailable(store, date, today);
          return <button key={date} type="button" disabled={!available} aria-pressed={value === date}
            aria-label={`${label}：${format(day, 'yyyy年M月d日')}${available ? '' : '（選択不可）'}`}
            onClick={() => onChange(date)}
            className={`rounded py-2 disabled:bg-gray-100 disabled:text-gray-300 ${value === date ? 'bg-[#06c755] font-bold text-white' : 'text-gray-800'}`}>
            {format(day, 'd')}
          </button>;
        })}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {store ? `${TRIM_STORES[store].closedLabel}は定休日です。` : '先に店舗を選んでください。'}
      </p>
      <p aria-live="polite" className="mt-2 text-sm font-medium text-gray-700">
        {value ? `選択日：${format(parseISO(value), 'yyyy/MM/dd')}` : '日付を選んでください'}
      </p>
    </div>
  );
}
