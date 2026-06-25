'use client';

import { useMemo, useState } from 'react';
import type { BidInfo } from '@/types';
import Checklist from './Checklist';
import ResumeForm from './ResumeForm';

type Tab = 'info' | 'checklist' | 'resume';

const FIELDS = [
  { key: '공고명' as const, label: '공고명' },
  { key: '발주기관' as const, label: '발주기관' },
  { key: '예정금액' as const, label: '예정금액' },
  { key: '용역기간' as const, label: '용역기간' },
  { key: '마감일' as const, label: '마감일' },
  { key: '참가자격' as const, label: '참가자격' },
];

function calcDday(raw: string): { label: string; urgent: boolean; expired: boolean } | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/년/g, '-').replace(/월/g, '-').replace(/일/g, '')
    .replace(/\.\s*/g, '-').replace(/\s/g, '').replace(/-+$/, '');
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { label: '마감', urgent: false, expired: true };
  return { label: `D-${diff}`, urgent: diff <= 7, expired: false };
}

interface Props {
  bid: BidInfo;
  onUpdate: (b: BidInfo) => void;
  onDelete: (id: string) => void;
}

export default function BidCard({ bid, onUpdate, onDelete }: Props) {
  const [tab, setTab] = useState<Tab>('info');
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  const dday = useMemo(() => calcDday(bid.마감일), [bid.마감일]);
  const progress = useMemo(() => {
    if (!bid.checklist.length) return 0;
    return Math.round(
      (bid.checklist.filter((i) => i.status === 'done').length / bid.checklist.length) * 100
    );
  }, [bid.checklist]);

  const startEdit = (key: string, val: string) => { setEditKey(key); setEditVal(val); };
  const commitEdit = () => {
    if (!editKey) return;
    onUpdate({ ...bid, [editKey]: editVal });
    setEditKey(null);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Warning banner */}
      <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2">
        <span className="text-amber-500">⚠</span>
        <span className="text-xs font-medium text-amber-700">
          원문 확인 필요 — 추출 결과에 오류가 있을 수 있습니다
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-gray-400">{bid.fileName}</p>
          <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-gray-900">
            {bid.공고명 || '(공고명 미추출)'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {dday && (
            <span
              className={`rounded-full px-2 py-1 text-xs font-bold ${
                dday.expired
                  ? 'bg-gray-100 text-gray-500'
                  : dday.urgent
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {dday.label}
            </span>
          )}
          <button
            onClick={() => onDelete(bid.id)}
            className="text-lg leading-none text-gray-300 hover:text-red-400 transition-colors"
            title="삭제"
          >
            ×
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="shrink-0 text-xs text-gray-500">{progress}%</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-t border-gray-100">
        {(
          [
            ['info', '기본정보'],
            ['checklist', '체크리스트'],
            ['resume', '실적·경력'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === key
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 420 }}>
        {tab === 'info' && (
          <dl className="space-y-3">
            {FIELDS.map(({ key, label }) => (
              <div key={key} className="flex gap-3">
                <dt className="w-16 shrink-0 pt-0.5 text-xs text-gray-500">{label}</dt>
                <dd className="min-w-0 flex-1">
                  {editKey === key ? (
                    <div className="flex gap-1">
                      <input
                        autoFocus
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdit();
                          if (e.key === 'Escape') setEditKey(null);
                        }}
                        className="flex-1 rounded border border-blue-400 px-2 py-0.5 text-xs outline-none"
                      />
                      <button onClick={commitEdit} className="text-xs font-medium text-blue-600">
                        저장
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(key, bid[key])}
                      className="group flex w-full items-start gap-1 text-left text-xs text-gray-900 hover:text-blue-600"
                    >
                      <span className={`flex-1 ${!bid[key] ? 'italic text-gray-300' : ''}`}>
                        {bid[key] || '미추출 — 클릭하여 입력'}
                      </span>
                      <span className="opacity-0 group-hover:opacity-100 text-gray-400">✎</span>
                    </button>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {tab === 'checklist' && (
          <Checklist
            items={bid.checklist}
            onChange={(checklist) => onUpdate({ ...bid, checklist })}
          />
        )}

        {tab === 'resume' && <ResumeForm bidName={bid.공고명} />}
      </div>
    </div>
  );
}
