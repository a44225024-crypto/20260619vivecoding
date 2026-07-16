'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { BidInfo } from '@/types';
import { loadBids, upsertBid, deleteBid as dbDeleteBid } from '@/lib/storage';
import { parsePDF } from '@/lib/pdfExtract';
import UploadZone from '@/components/UploadZone';
import BidCard from '@/components/BidCard';
import CompareView from '@/components/CompareView';
import Sidebar from '@/components/Sidebar';
import KpiCards from '@/components/KpiCards';
import LogoutButton from '@/components/LogoutButton';
import NaraSearchPanel from '@/components/NaraSearchPanel';

const DashboardCharts = dynamic(() => import('@/components/DashboardCharts'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="h-56 animate-pulse rounded-xl border border-gray-200 bg-white lg:col-span-2" />
      <div className="h-56 animate-pulse rounded-xl border border-gray-200 bg-white" />
    </div>
  ),
});

type View = 'dashboard' | 'compare' | 'search';

export default function Home() {
  const [bids, setBids] = useState<BidInfo[]>([]);
  const [view, setView] = useState<View>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadBids().then((loaded) => {
      setBids(loaded);
      if (loaded.length > 0) setSelectedId(loaded[0].id);
    });
  }, []);

  const handleFiles = useCallback(async (files: File[]) => {
    setLoading(true);
    setError(null);
    try {
      const parsed = await Promise.all(
        files.map(async (file) => {
          const data = await parsePDF(file);
          return {
            ...data,
            id: crypto.randomUUID(),
            uploadedAt: new Date().toISOString(),
          } satisfies BidInfo;
        })
      );
      setBids((prev) => [...prev, ...parsed]);
      await Promise.all(parsed.map(upsertBid));
      if (parsed.length > 0) setSelectedId(parsed[0].id);
    } catch (e) {
      console.error(e);
      setError('PDF 파싱 중 오류가 발생했습니다. 파일을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }, []);

  const addBidFromNara = useCallback(async (bid: BidInfo) => {
    setBids((prev) => [bid, ...prev]);
    setSelectedId(bid.id);
    setView('dashboard');
    await upsertBid(bid);
  }, []);

  const updateBid = useCallback((updated: BidInfo) => {
    setBids((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    void upsertBid(updated);
  }, []);

  const deleteBid = useCallback(
    (id: string) => {
      setBids((prev) => {
        const next = prev.filter((b) => b.id !== id);
        if (selectedId === id) setSelectedId(next[0]?.id ?? null);
        return next;
      });
      void dbDeleteBid(id);
    },
    [selectedId]
  );

  const selectedBid = bids.find((b) => b.id === selectedId) ?? null;

  const headerTitle =
    view === 'search'
      ? '나라장터 검색'
      : view === 'compare'
      ? '공고 비교'
      : selectedBid
      ? selectedBid.공고명 || '(공고명 미추출)'
      : bids.length > 0
      ? '대시보드'
      : '입찰 공고 분석기';

  return (
    <div className="flex h-screen overflow-hidden bg-purple-50">
      <Sidebar
        bids={bids}
        selectedId={selectedId}
        onSelect={(id) => { setSelectedId(id); setView('dashboard'); setSidebarOpen(false); }}
        onDelete={deleteBid}
        onUpload={handleFiles}
        loading={loading}
        view={view}
        onViewChange={(v) => { setView(v); setSidebarOpen(false); }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 border-b border-purple-200 bg-purple-100 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                aria-label="메뉴 열기"
                onClick={() => setSidebarOpen(true)}
                className="shrink-0 rounded-lg p-1.5 text-gray-600 hover:bg-purple-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 md:hidden"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold text-gray-900">{headerTitle}</h1>
                <p className="text-[11px] text-gray-400">
                  {new Date().toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short',
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">
                  {error}
                </div>
              )}
              <LogoutButton />
            </div>
          </div>
        </header>

        {/* Scrollable main */}
        <main className="flex-1 overflow-y-auto p-6">
          {view === 'search' ? (
            <NaraSearchPanel onAdd={addBidFromNara} />
          ) : bids.length === 0 ? (
            <UploadZone onFiles={handleFiles} loading={loading} />
          ) : view === 'compare' && bids.length > 1 ? (
            <CompareView bids={bids} onUpdate={updateBid} />
          ) : (
            <div className="space-y-5">
              <KpiCards bids={bids} />
              <DashboardCharts bids={bids} />
              {selectedBid ? (
                <BidCard bid={selectedBid} onUpdate={updateBid} onDelete={deleteBid} />
              ) : (
                <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-400">
                  왼쪽 목록에서 공고를 선택하세요
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
