'use client';

import { useState } from 'react';
import type { BidInfo, ChecklistItem } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type Kind = 'servc' | 'cnstwk';

interface NaraItem {
  bidNtceNo?: string;
  bidNtceOrd?: string;
  bidNtceNm?: string;
  ntceInsttNm?: string;
  dminsttNm?: string;
  bidClseDt?: string;
  cntrctCnclsMthdNm?: string;
  [key: string]: string | undefined;
}

interface Props {
  onAdd: (bid: BidInfo) => Promise<void> | void;
}

function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 'def-1', label: '입찰서', status: 'todo' },
  { id: 'def-2', label: '사업자등록증 사본', status: 'todo' },
  { id: 'def-3', label: '제안서', status: 'todo' },
];

export default function NaraSearchPanel({ onAdd }: Props) {
  const [kind, setKind] = useState<Kind>('servc');
  const [keyword, setKeyword] = useState('');
  const [instt, setInstt] = useState('');
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<NaraItem[]>([]);
  const [addingNo, setAddingNo] = useState<string | null>(null);

  const search = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        kind,
        keyword,
        instt,
        bgnDt: `${todayStr(-days)}0000`,
        endDt: `${todayStr(0)}2359`,
      });
      const res = await fetch(`/api/nara/search?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '조회 실패');
      setItems(json.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '조회 실패');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (item: NaraItem) => {
    if (!item.bidNtceNo) return;
    setAddingNo(item.bidNtceNo);
    try {
      const bid: BidInfo = {
        id: crypto.randomUUID(),
        fileName: `나라장터_${item.bidNtceNo}`,
        공고명: item.bidNtceNm ?? '',
        발주기관: item.ntceInsttNm || item.dminsttNm || '',
        예정금액: '',
        용역기간: '',
        마감일: (item.bidClseDt ?? '').slice(0, 10),
        참가자격: '',
        checklist: DEFAULT_CHECKLIST,
        uploadedAt: new Date().toISOString(),
        bidNtceNo: item.bidNtceNo,
        bidNtceOrd: item.bidNtceOrd,
        공고구분: kind === 'servc' ? '용역' : '공사',
      };
      await onAdd(bid);
    } finally {
      setAddingNo(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex rounded-lg bg-purple-50 p-1 text-xs font-semibold">
            <button
              onClick={() => setKind('servc')}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                kind === 'servc' ? 'bg-white text-purple-700 shadow-sm' : 'text-purple-400'
              }`}
            >
              용역
            </button>
            <button
              onClick={() => setKind('cnstwk')}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                kind === 'cnstwk' ? 'bg-white text-purple-700 shadow-sm' : 'text-purple-400'
              }`}
            >
              공사
            </button>
          </div>

          <div className="min-w-[180px] flex-1">
            <label htmlFor="nara-keyword" className="mb-1 block text-xs text-gray-500">공고명 키워드</label>
            <input
              id="nara-keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="예: 열수송관 측량"
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-1"
            />
          </div>

          <div className="min-w-[140px]">
            <label htmlFor="nara-instt" className="mb-1 block text-xs text-gray-500">발주기관</label>
            <input
              id="nara-instt"
              value={instt}
              onChange={(e) => setInstt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="예: 한국지역난방공사"
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-1"
            />
          </div>

          <div className="w-28">
            <label htmlFor="nara-days" className="mb-1 block text-xs text-gray-500">조회기간</label>
            <select
              id="nara-days"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-1"
            >
              <option value={7}>최근 7일</option>
              <option value={14}>최근 14일</option>
              <option value={30}>최근 30일</option>
            </select>
          </div>

          <Button onClick={search} loading={loading} className="rounded-lg px-4 py-1.5 text-sm">
            {loading ? '조회 중…' : '조회'}
          </Button>
        </div>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {items.length > 0 && (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-3 py-2 font-medium">공고명</th>
                <th className="px-3 py-2 font-medium">발주기관</th>
                <th className="px-3 py-2 font-medium">마감일</th>
                <th className="px-3 py-2 font-medium">계약방법</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={`${item.bidNtceNo}-${item.bidNtceOrd}`} className="hover:bg-purple-50/50">
                  <td className="max-w-xs px-3 py-2 text-gray-900">{item.bidNtceNm}</td>
                  <td className="px-3 py-2 text-gray-600">{item.ntceInsttNm || item.dminsttNm}</td>
                  <td className="px-3 py-2 text-gray-600">{(item.bidClseDt ?? '').slice(0, 16)}</td>
                  <td className="px-3 py-2 text-gray-600">{item.cntrctCnclsMthdNm}</td>
                  <td className="px-3 py-2">
                    <Button
                      onClick={() => handleAdd(item)}
                      loading={addingNo === item.bidNtceNo}
                      className="rounded-md px-2.5 py-1 text-[11px]"
                    >
                      {addingNo === item.bidNtceNo ? '추가 중…' : '+ 추가'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-400">
          조건을 입력하고 조회를 눌러주세요
        </div>
      )}
    </div>
  );
}
