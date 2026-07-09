'use client';

import type { BidInfo } from '@/types';

function calcDday(raw: string) {
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
  bids: BidInfo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onUpload: (files: File[]) => void;
  loading: boolean;
  view: 'dashboard' | 'compare' | 'search';
  onViewChange: (v: 'dashboard' | 'compare' | 'search') => void;
}

export default function Sidebar({
  bids, selectedId, onSelect, onDelete, onUpload, loading, view, onViewChange,
}: Props) {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-purple-200 bg-purple-900">
      {/* Brand */}
      <div className="border-b border-purple-700 px-4 py-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-purple-300">선엔지니어링</p>
        <h1 className="mt-0.5 text-sm font-semibold text-white">입찰 공고 분석기</h1>
        <p className="mt-0.5 text-[10px] text-purple-400">수주전략팀</p>
      </div>

      {/* Upload */}
      <div className="px-3 pt-3 pb-1">
        <label
          className={`flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${
            loading
              ? 'bg-purple-800 text-purple-400 cursor-not-allowed'
              : 'bg-purple-500 text-white hover:bg-purple-400'
          }`}
        >
          {loading ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              분석 중…
            </>
          ) : (
            '+ 공고 추가'
          )}
          <input
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            disabled={loading}
            onChange={(e) => {
              if (e.target.files) onUpload(Array.from(e.target.files));
              e.currentTarget.value = '';
            }}
          />
        </label>

        <button
          onClick={() => onViewChange('search')}
          className={`mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${
            view === 'search'
              ? 'bg-purple-500 text-white'
              : 'bg-purple-800 text-purple-200 hover:bg-purple-700'
          }`}
        >
          🔍 나라장터 검색
        </button>
      </div>

      {/* Bid list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-purple-300">
          공고 목록 ({bids.length})
        </p>
        {bids.length === 0 && (
          <p className="px-3 py-6 text-center text-xs leading-5 text-purple-300">
            PDF를 업로드하면<br />여기에 표시됩니다
          </p>
        )}
        <ul className="space-y-0.5">
          {bids.map((bid) => {
            const dday = calcDday(bid.마감일);
            const isSelected = bid.id === selectedId;
            const done = bid.checklist.filter((i) => i.status === 'done').length;
            const total = bid.checklist.length;
            const pct = total ? Math.round((done / total) * 100) : 0;

            return (
              <li key={bid.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(bid.id)}
                  onKeyDown={(e) => e.key === 'Enter' && onSelect(bid.id)}
                  className={`group cursor-pointer rounded-lg px-2.5 py-2.5 transition-colors ${
                    isSelected ? 'bg-purple-700' : 'hover:bg-purple-800'
                  }`}
                >
                  <div className="flex items-start gap-1">
                    <p
                      className={`flex-1 truncate text-xs font-medium leading-snug ${
                        isSelected ? 'text-white' : 'text-purple-200'
                      }`}
                    >
                      {bid.공고명 || bid.fileName}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(bid.id);
                      }}
                      className="shrink-0 text-sm leading-none text-gray-300 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>

                  <div className="mt-1.5 flex items-center gap-2">
                    {dday && (
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
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
                    <div className="flex flex-1 items-center gap-1 min-w-0">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-green-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-[9px] text-gray-400">{pct}%</span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* View toggle */}
      {bids.length > 1 && (
        <div className="border-t border-purple-700 px-3 py-3">
          <div className="flex overflow-hidden rounded-lg border border-purple-600">
            {(['dashboard', 'compare'] as const).map((v) => (
              <button
                key={v}
                onClick={() => onViewChange(v)}
                className={`flex-1 py-1.5 text-[11px] font-medium transition-colors ${
                  view === v
                    ? 'bg-purple-500 text-white'
                    : 'bg-purple-800 text-purple-300 hover:bg-purple-700'
                }`}
              >
                {v === 'dashboard' ? '대시보드' : '비교 뷰'}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
