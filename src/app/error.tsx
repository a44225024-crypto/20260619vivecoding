'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-purple-50 px-4 text-center">
      <p className="text-sm font-semibold text-gray-900">문제가 발생했습니다.</p>
      <p className="max-w-sm text-xs text-gray-500">{error.message || '알 수 없는 오류입니다.'}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-400"
      >
        다시 시도
      </button>
    </div>
  );
}
