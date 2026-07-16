'use client';

import { useState } from 'react';
import type { BidInfo } from '@/types';

interface Result {
  핵심요약: string;
  참가자격: string;
  마감일: string;
}

interface Props {
  bid: BidInfo;
}

export default function AISummaryCard({ bid }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          공고명: bid.공고명,
          발주기관: bid.발주기관,
          예정금액: bid.예정금액,
          용역기간: bid.용역기간,
          마감일: bid.마감일,
          참가자격: bid.참가자격,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '요약 생성에 실패했습니다.');
      setResult(json as Result);
    } catch (e) {
      setError(e instanceof Error ? e.message : '요약 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={generate}
        disabled={loading}
        className="w-full rounded-lg bg-purple-500 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-400 disabled:cursor-not-allowed disabled:bg-purple-300"
      >
        {loading ? 'AI 요약 생성 중…' : result ? '다시 요약하기' : 'AI 요약 생성'}
      </button>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3 rounded-xl border border-purple-100 bg-purple-50/50 p-4">
          <div>
            <p className="mb-1 text-xs font-semibold text-purple-700">핵심 요약</p>
            <p className="text-xs leading-relaxed text-gray-800">{result.핵심요약 || '정보 없음'}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-purple-700">참가 자격</p>
            <p className="text-xs leading-relaxed text-gray-800">{result.참가자격 || '정보 없음'}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-purple-700">마감일</p>
            <p className="text-xs leading-relaxed text-gray-800">{result.마감일 || '정보 없음'}</p>
          </div>
        </div>
      )}

      {!loading && !error && !result && (
        <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">
          버튼을 눌러 AI 요약을 생성하세요
        </div>
      )}
    </div>
  );
}
