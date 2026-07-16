'use client';

import type { BidInfo } from '@/types';
import { daysUntil } from '@/lib/dday';
import Card from '@/components/ui/Card';

function calcDays(raw: string): number {
  return daysUntil(raw) ?? Infinity;
}

interface KpiCardProps {
  label: string;
  value: string | number;
  sub: string;
  accent: string;
  iconBg: string;
  icon: string;
}

function KpiCard({ label, value, sub, accent, iconBg, icon }: KpiCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <p className="truncate text-xs font-medium text-gray-500">{label}</p>
        <span aria-hidden="true" className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${iconBg}`}>
          {icon}
        </span>
      </div>
      <p className={`mt-3 text-2xl font-bold ${accent}`}>{value}</p>
      <p className="mt-0.5 truncate text-xs text-gray-400">{sub}</p>
    </Card>
  );
}

interface Props {
  bids: BidInfo[];
}

export default function KpiCards({ bids }: Props) {
  const active = bids.filter((b) => calcDays(b.마감일) >= 0);
  const urgent = bids.filter((b) => {
    const d = calcDays(b.마감일);
    return d >= 0 && d <= 7;
  });

  const totalItems = bids.reduce((s, b) => s + b.checklist.length, 0);
  const doneItems = bids.reduce(
    (s, b) => s + b.checklist.filter((i) => i.status === 'done').length,
    0
  );
  const avgProgress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  const expired = bids.filter((b) => calcDays(b.마감일) < 0);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard
        label="전체 공고"
        value={bids.length}
        sub={`진행중 ${active.length}건 · 마감 ${expired.length}건`}
        accent="text-blue-600"
        iconBg="bg-blue-50"
        icon="📋"
      />
      <KpiCard
        label="마감 임박"
        value={urgent.length}
        sub="7일 이내 마감 건수"
        accent={urgent.length > 0 ? 'text-red-600' : 'text-gray-400'}
        iconBg={urgent.length > 0 ? 'bg-red-50' : 'bg-gray-50'}
        icon="⏰"
      />
      <KpiCard
        label="평균 진행률"
        value={`${avgProgress}%`}
        sub={`${doneItems} / ${totalItems} 서류 완료`}
        accent="text-green-600"
        iconBg="bg-green-50"
        icon="✅"
      />
      <KpiCard
        label="완료 서류"
        value={doneItems}
        sub={`전체 ${totalItems}건 중`}
        accent="text-indigo-600"
        iconBg="bg-indigo-50"
        icon="📁"
      />
    </div>
  );
}
