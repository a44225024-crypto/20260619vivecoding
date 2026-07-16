'use client';

import { useEffect, useState } from 'react';
import type { ProjectRecord, CareerRecord } from '@/types';
import {
  loadCareers, loadProjects,
  upsertCareer, upsertProject,
  deleteCareer as dbDeleteCareer,
  deleteProject as dbDeleteProject,
} from '@/lib/storage';

const uid = () => crypto.randomUUID();

const emptyProject = (): ProjectRecord => ({
  id: uid(), 용역명: '', 발주처: '', 계약금액: '', 수행기간: '', 주요내용: '',
});
const emptyCareer = (): CareerRecord => ({
  id: uid(), 성명: '', 직위: '', 보유자격: '', 주요경력: '',
});

interface Props { bidName: string; }

export default function ResumeForm({ bidName }: Props) {
  const [tab, setTab] = useState<'proj' | 'career'>('proj');
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [careers, setCareers] = useState<CareerRecord[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([loadProjects(), loadCareers()]).then(([p, c]) => {
      setProjects(p.length ? p : [emptyProject()]);
      setCareers(c.length ? c : [emptyCareer()]);
    });
  }, []);

  const updateProj = (id: string, field: keyof ProjectRecord, val: string) => {
    const updated = projects.map((p) => (p.id === id ? { ...p, [field]: val } : p));
    setProjects(updated);
    const record = updated.find((p) => p.id === id);
    if (record) void upsertProject(record);
  };

  const updateCareer = (id: string, field: keyof CareerRecord, val: string) => {
    const updated = careers.map((c) => (c.id === id ? { ...c, [field]: val } : c));
    setCareers(updated);
    const record = updated.find((c) => c.id === id);
    if (record) void upsertCareer(record);
  };

  const doExport = async () => {
    setExporting(true);
    try {
      const { exportToDocx } = await import('@/lib/docxExport');
      await exportToDocx(projects, careers, bidName);
    } catch {
      alert('내보내기 중 오류가 발생했습니다.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex rounded-lg border border-gray-200 overflow-hidden">
        {(['proj', 'career'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === key ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {key === 'proj' ? '유사용역 실적' : '기술자 경력'}
          </button>
        ))}
      </div>

      {tab === 'proj' && (
        <div className="space-y-3">
          {projects.map((p, idx) => (
            <div key={p.id} className="rounded-lg border border-gray-200 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">실적 {idx + 1}</span>
                {projects.length > 1 && (
                  <button
                    onClick={() => {
                      setProjects((prev) => prev.filter((x) => x.id !== p.id));
                      void dbDeleteProject(p.id);
                    }}
                    aria-label={`실적 ${idx + 1} 삭제`}
                    className="text-gray-300 hover:text-red-400 focus-visible:outline-2 focus-visible:outline-red-400 text-sm"
                  >×</button>
                )}
              </div>
              {(
                [['용역명', '용역명'], ['발주처', '발주처'], ['계약금액', '계약금액'], ['수행기간', '수행기간'], ['주요내용', '주요 내용']] as [keyof ProjectRecord, string][]
              ).map(([field, label]) => {
                const inputId = `proj-${p.id}-${field}`;
                return (
                <div key={field} className="flex items-start gap-2">
                  <label htmlFor={inputId} className="w-16 shrink-0 pt-1 text-xs text-gray-500">{label}</label>
                  {field === '주요내용' ? (
                    <textarea
                      id={inputId}
                      value={p[field]}
                      onChange={(e) => updateProj(p.id, field, e.target.value)}
                      rows={2}
                      className="flex-1 resize-none rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1"
                    />
                  ) : (
                    <input
                      id={inputId}
                      value={p[field]}
                      onChange={(e) => updateProj(p.id, field, e.target.value)}
                      className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1"
                    />
                  )}
                </div>
                );
              })}
            </div>
          ))}
          <button
            onClick={() => {
              const newProj = emptyProject();
              setProjects((prev) => [...prev, newProj]);
              void upsertProject(newProj);
            }}
            className="w-full rounded-lg border border-dashed border-gray-300 py-2 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            + 실적 추가
          </button>
        </div>
      )}

      {tab === 'career' && (
        <div className="space-y-3">
          {careers.map((c, idx) => (
            <div key={c.id} className="rounded-lg border border-gray-200 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">기술자 {idx + 1}</span>
                {careers.length > 1 && (
                  <button
                    onClick={() => {
                      setCareers((prev) => prev.filter((x) => x.id !== c.id));
                      void dbDeleteCareer(c.id);
                    }}
                    aria-label={`기술자 ${idx + 1} 삭제`}
                    className="text-gray-300 hover:text-red-400 focus-visible:outline-2 focus-visible:outline-red-400 text-sm"
                  >×</button>
                )}
              </div>
              {(
                [['성명', '성명'], ['직위', '직위'], ['보유자격', '보유자격'], ['주요경력', '주요 경력']] as [keyof CareerRecord, string][]
              ).map(([field, label]) => {
                const inputId = `career-${c.id}-${field}`;
                return (
                <div key={field} className="flex items-start gap-2">
                  <label htmlFor={inputId} className="w-16 shrink-0 pt-1 text-xs text-gray-500">{label}</label>
                  {field === '주요경력' ? (
                    <textarea
                      id={inputId}
                      value={c[field]}
                      onChange={(e) => updateCareer(c.id, field, e.target.value)}
                      rows={2}
                      className="flex-1 resize-none rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1"
                    />
                  ) : (
                    <input
                      id={inputId}
                      value={c[field]}
                      onChange={(e) => updateCareer(c.id, field, e.target.value)}
                      className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1"
                    />
                  )}
                </div>
                );
              })}
            </div>
          ))}
          <button
            onClick={() => {
              const newCareer = emptyCareer();
              setCareers((prev) => [...prev, newCareer]);
              void upsertCareer(newCareer);
            }}
            className="w-full rounded-lg border border-dashed border-gray-300 py-2 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            + 기술자 추가
          </button>
        </div>
      )}

      <button
        onClick={doExport}
        disabled={exporting}
        className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300"
      >
        {exporting ? '내보내는 중…' : '📥 Word 문서로 내보내기 (.docx)'}
      </button>
    </div>
  );
}
