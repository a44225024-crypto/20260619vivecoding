'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import type { BidInfo } from '@/types';

function calcDays(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/년/g, '-').replace(/월/g, '-').replace(/일/g, '')
    .replace(/\.\s*/g, '-').replace(/\s/g, '').replace(/-+$/, '');
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - today.getTime()) / 86400000);
}

const PIE_COLORS = ['#d1d5db', '#fbbf24', '#22c55e'];

interface Props {
  bids: BidInfo[];
}

export default function DashboardCharts({ bids }: Props) {
  const barData = useMemo(
    () =>
      bids
        .map((b) => {
          const days = calcDays(b.마감일);
          const displayDays = days === null ? 0 : days < 0 ? 0 : days;
          const name = (b.공고명 || b.fileName).slice(0, 14);
          return { name, days: displayDays, expired: days !== null && days < 0 };
        })
        .sort((a, b) => a.days - b.days),
    [bids]
  );

  const pieData = useMemo(() => {
    const todo = bids.reduce(
      (s, b) => s + b.checklist.filter((i) => i.status === 'todo').length,
      0
    );
    const inprogress = bids.reduce(
      (s, b) => s + b.checklist.filter((i) => i.status === 'inprogress').length,
      0
    );
    const done = bids.reduce(
      (s, b) => s + b.checklist.filter((i) => i.status === 'done').length,
      0
    );
    return [
      { name: '미시작', value: todo },
      { name: '진행중', value: inprogress },
      { name: '완료', value: done },
    ].filter((d) => d.value > 0);
  }, [bids]);

  const barHeight = Math.max(140, barData.length * 48);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* D-Day 현황 (2/3) */}
      <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-gray-700">공고별 마감일 현황</p>
        {barData.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs text-gray-400">
            공고 없음
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={barHeight}>
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 8, bottom: 0 }}
            >
              <XAxis
                type="number"
                domain={[0, 'dataMax']}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickFormatter={(v) => `D-${v}`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 11, fill: '#374151' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) =>
                  typeof v === 'number' && v > 0 ? `D-${v}일 남음` : '마감됨'
                }
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="days" radius={[0, 4, 4, 0]} barSize={18}>
                {barData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={
                      entry.expired
                        ? '#e5e7eb'
                        : entry.days <= 7
                        ? '#ef4444'
                        : '#3b82f6'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="mt-3 flex items-center gap-4 text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded-sm bg-red-400" /> 7일 이내
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded-sm bg-blue-400" /> 8일 이상
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded-sm bg-gray-200" /> 마감
          </span>
        </div>
      </div>

      {/* 서류 준비 현황 (1/3) */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-gray-700">서류 준비 현황</p>
        {pieData.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-xs text-gray-400">
            체크리스트 없음
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                innerRadius={44}
                outerRadius={64}
                dataKey="value"
                paddingAngle={3}
              >
                {pieData.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
