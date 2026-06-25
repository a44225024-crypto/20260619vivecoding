'use client';

import { useCallback, useEffect, useState } from 'react';
import type { BidInfo } from '@/types';
import { loadBids, saveBids } from '@/lib/storage';
import { parsePDF } from '@/lib/pdfExtract';
import UploadZone from '@/components/UploadZone';
import BidCard from '@/components/BidCard';
import CompareView from '@/components/CompareView';
import Sidebar from '@/components/Sidebar';
import KpiCards from '@/components/KpiCards';
import DashboardCharts from '@/components/DashboardCharts';

type View = 'dashboard' | 'compare';

export default function Home() {
  const [bids, setBids] = useState<BidInfo[]>([]);
  const [view, setView] = useState<View>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadBids();
    setBids(loaded);
    if (loaded.length > 0) setSelectedId(loaded[0].id);
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
            id: `bid-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            uploadedAt: new Date().toISOString(),
          } satisfies BidInfo;
        })
      );
      setBids((prev) => {
        const next = [...prev, ...parsed];
        saveBids(next);
        return next;
      });
      if (parsed.length > 0) setSelectedId(parsed[0].id);
    } catch (e) {
      console.error(e);
      setError('PDF 파싱 중 오류가 발생했습니다. 파일을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBid = useCallback((updated: BidInfo) => {
    setBids((prev) => {
      const next = prev.map((b) => (b.id === updated.id ? updated : b));
      saveBids(next);
      return next;
    });
  }, []);

  const deleteBid = useCallback(
    (id: string) => {
      setBids((prev) => {
        const next = prev.filter((b) => b.id !== id);
        saveBids(next);
        if (selectedId === id) setSelectedId(next[0]?.id ?? null);
        return next;
      });
    },
    [selectedId]
  );

  const selectedBid = bids.find((b) => b.id === selectedId) ?? null;

  const headerTitle =
    view === 'compare'
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
        onSelect={(id) => { setSelectedId(id); setView('dashboard'); }}
        onDelete={deleteBid}
        onUpload={handleFiles}
        loading={loading}
        view={view}
        onViewChange={setView}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 border-b border-purple-200 bg-purple-100 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-gray-900">{headerTitle}</h2>
              <p className="text-[11px] text-gray-400">
                {new Date().toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })}
              </p>
            </div>
            {error && (
              <div className="ml-4 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">
                {error}
              </div>
            )}
          </div>
        </header>

        {/* Scrollable main */}
        <main className="flex-1 overflow-y-auto p-6">
          {bids.length === 0 ? (
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
