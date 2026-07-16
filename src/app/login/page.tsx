'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { login, signup, sendMagicLink } from './actions';
import Button from '@/components/ui/Button';

type Mode = 'password' | 'magic';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const message = searchParams.get('message');
  const [mode, setMode] = useState<Mode>('password');
  const [pending, setPending] = useState(false);

  const wrap = (action: (formData: FormData) => Promise<void>) =>
    async (formData: FormData) => {
      setPending(true);
      await action(formData);
      setPending(false);
    };

  return (
    <div className="flex min-h-screen items-center justify-center bg-purple-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-purple-200 bg-white p-8 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-widest text-purple-400">선엔지니어링</p>
        <h1 className="mt-0.5 text-lg font-semibold text-gray-900">입찰 공고 분석기</h1>
        <p className="mt-1 text-xs text-gray-400">수주전략팀 로그인</p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            {message}
          </div>
        )}

        {/* Mode switch */}
        <div className="mt-6 flex rounded-lg bg-purple-50 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('password')}
            className={`flex-1 rounded-md py-1.5 transition-colors ${
              mode === 'password' ? 'bg-white text-purple-700 shadow-sm' : 'text-purple-400'
            }`}
          >
            이메일 + 비밀번호
          </button>
          <button
            type="button"
            onClick={() => setMode('magic')}
            className={`flex-1 rounded-md py-1.5 transition-colors ${
              mode === 'magic' ? 'bg-white text-purple-700 shadow-sm' : 'text-purple-400'
            }`}
          >
            매직 링크
          </button>
        </div>

        {mode === 'password' ? (
          <form action={wrap(login)} className="mt-5 space-y-3">
            <div>
              <label htmlFor="login-email" className="mb-1 block text-xs font-medium text-gray-600">이메일</label>
              <input
                id="login-email"
                type="email"
                name="email"
                required
                pattern=".+@seon\.co\.kr"
                title="@seon.co.kr 이메일만 사용할 수 있습니다"
                className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-1"
                placeholder="you@seon.co.kr"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="mb-1 block text-xs font-medium text-gray-600">비밀번호</label>
              <input
                id="login-password"
                type="password"
                name="password"
                required
                minLength={6}
                className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-1"
                placeholder="********"
              />
            </div>
            <Button type="submit" disabled={pending} className="w-full rounded-lg py-2 text-sm">
              로그인
            </Button>
            <Button
              type="submit"
              variant="outline"
              formAction={wrap(signup)}
              disabled={pending}
              className="w-full rounded-lg py-2 text-sm"
            >
              회원가입
            </Button>
          </form>
        ) : (
          <form action={wrap(sendMagicLink)} className="mt-5 space-y-3">
            <div>
              <label htmlFor="magic-email" className="mb-1 block text-xs font-medium text-gray-600">이메일</label>
              <input
                id="magic-email"
                type="email"
                name="email"
                required
                pattern=".+@seon\.co\.kr"
                title="@seon.co.kr 이메일만 사용할 수 있습니다"
                className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-1"
                placeholder="you@seon.co.kr"
              />
            </div>
            <Button type="submit" disabled={pending} className="w-full rounded-lg py-2 text-sm">
              로그인 링크 받기
            </Button>
            <p className="text-[11px] text-gray-400">
              입력한 이메일로 로그인 링크를 보내드려요. 메일함에서 링크를 클릭하면 바로 로그인됩니다.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
