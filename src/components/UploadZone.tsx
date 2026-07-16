'use client';

import { useCallback, useState } from 'react';

interface Props {
  onFiles: (files: File[]) => void;
  loading: boolean;
}

export default function UploadZone({ onFiles, loading }: Props) {
  const [dragging, setDragging] = useState(false);

  const pick = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const pdfs = Array.from(files).filter((f) => f.type === 'application/pdf');
      if (pdfs.length) onFiles(pdfs);
    },
    [onFiles]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files); }}
      className={`rounded-2xl border-2 border-dashed p-20 text-center transition-colors ${
        dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
      }`}
    >
      <div aria-hidden="true" className="text-5xl mb-4">📄</div>
      <p className="text-lg font-semibold text-gray-700 mb-1">
        공고문 PDF를 여기에 끌어다 놓으세요
      </p>
      <p className="text-sm text-gray-400 mb-6">여러 파일을 동시에 올릴 수 있습니다</p>
      <label
        className={`inline-block cursor-pointer rounded-lg px-6 py-3 text-sm font-medium transition-colors focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-1 ${
          loading
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {loading ? '분석 중…' : '파일 선택'}
        <input
          type="file"
          accept=".pdf"
          multiple
          disabled={loading}
          className="sr-only"
          onChange={(e) => { pick(e.target.files); e.target.value = ''; }}
        />
      </label>
    </div>
  );
}
