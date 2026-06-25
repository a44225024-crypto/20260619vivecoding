'use client';

import { useMemo, useState } from 'react';
import type { BidInfo } from '@/types';

const FIELDS: { key: keyof BidInfo; label: string }[] = [
  { key: '공고명', label: '공고명' },
  { key: '발주기관', label: '발주기관' },
  { key: '예정금액', label: '예정금액' },
  { key: '용역기간', label: '용역기간' },
  { key: '마감일', label: '마감일' },
  { key: '참가자격', label: '참가자격' },
];

function daysLeft(raw: string): number {
  if (!raw) return Infinity;
  const cleaned = raw
    .replace(/년/g, '-').replace(/월/g, '-').replace(/일/g, '')
    .replace(/\.\s*/g, '-').replace(/\s/g, '').replace(/-+$/, '');
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - today.getTime()) / 86400000);
}

function DdayBadge({ raw }: { raw: string }) {
  const diff = daysLeft(raw);
  if (diff === Infinity) return null;
  const label = diff < 0 ? '마감' : `D-${diff}`;
  const cls =
    diff < 0
      ? 'bg-gray-100 text-gray-500'
      : diff <= 7
      ? 'bg-red-100 text-red-700'
      : 'bg-blue-100 text-blue-700';
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${cls}`}>
      {label}
    </span>
  );
}

interface Props {
  bids: BidInfo[];
  onUpdate: (b: BidInfo) => void;
}

export default function CompareView({ bids, onUpdate }: Props) {
  const [sortByDeadline, setSortByDeadline] = useState(true);

  const sorted = useMemo(
    () =>
      sortByDeadline
        ? [...bids].sort((a, b) => daysLeft(a.마감일) - daysLeft(b.마감일))
        : bids,
    [bids, sortByDeadline]
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-600">{bids.length}개 공고 비교</span>
        <button
          onClick={() => setSortByDeadline((v) => !v)}
          className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
            sortByDeadline
              ? 'border-blue-500 bg-blue-50 text-blue-600'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          마감일 순 정렬
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="w-24 border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500">
                항목
              </th>
              {sorted.map((bid) => (
                <th
                  key={bid.id}
                  className="min-w-48 border border-gray-200 px-4 py-3 text-left"
                >
                  <p className="line-clamp-2 text-xs font-medium text-gray-800">{bid.fileName}</p>
                  <div className="mt-1">
                    <DdayBadge raw={bid.마감일} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FIELDS.map(({ key, label }) => (
              <tr key={key} className="hover:bg-gray-50">
                <td className="border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">
                  {label}
                </td>
                {sorted.map((bid) => (
                  <td key={bid.id} className="border border-gray-200 px-4 py-3 text-xs text-gray-800">
                    {(bid[key] as string) || (
                      <span className="italic text-gray-300">미추출</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}

            {/* Progress row */}
            <tr className="hover:bg-gray-50">
              <td className="border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">
                진행률
              </td>
              {sorted.map((bid) => {
                const done = bid.checklist.filter((i) => i.status === 'done').length;
                const total = bid.checklist.length;
                const pct = total ? Math.round((done / total) * 100) : 0;
                return (
                  <td key={bid.id} className="border border-gray-200 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-green-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-xs text-gray-600">{pct}%</span>
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
