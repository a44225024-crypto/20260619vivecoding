import { createClient } from '@/lib/supabase/server'

export default async function SupabaseTestPage() {
  const supabase = await createClient()

  // 연결 테스트: Auth 서버 응답 확인
  const { error: authError } = await supabase.auth.getSession()

  // DB 응답 확인: 존재하지 않는 테이블에 접근하면 네트워크 오류가 아닌 DB 오류가 반환됨
  const { error: dbError } = await supabase.from('_connection_check').select().limit(0)
  const isDbReachable = dbError?.message !== 'Failed to fetch'

  const isConnected = !authError
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  return (
    <div className="min-h-screen bg-purple-50 p-8">
      <div className="mx-auto max-w-2xl space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-purple-900">Supabase 연결 확인</h1>
          <p className="mt-1 text-sm text-gray-500">현재 프로젝트와 Supabase의 연결 상태를 보여줍니다.</p>
        </div>

        {/* 연결 상태 */}
        <div className={`rounded-xl border p-5 ${isConnected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{isConnected ? '✅' : '❌'}</span>
            <div>
              <p className={`font-semibold ${isConnected ? 'text-green-800' : 'text-red-800'}`}>
                {isConnected ? '연결 성공' : '연결 실패'}
              </p>
              <p className="text-sm text-gray-600">
                {isConnected ? 'Supabase Auth 서버 응답 정상' : `오류: ${authError?.message}`}
              </p>
            </div>
          </div>
        </div>

        {/* 프로젝트 정보 */}
        <div className="rounded-xl border border-purple-200 bg-white p-5 space-y-3">
          <h2 className="font-semibold text-purple-900">프로젝트 정보</h2>
          <div className="space-y-2 text-sm">
            <Row label="URL" value={projectUrl} />
            <Row
              label="Anon Key"
              value={`${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 24)}...`}
            />
          </div>
        </div>

        {/* DB 응답 확인 */}
        <div className="rounded-xl border border-purple-200 bg-white p-5 space-y-3">
          <h2 className="font-semibold text-purple-900">DB 응답 확인</h2>
          <div className="flex items-center gap-2 text-sm">
            <span>{isDbReachable ? '✅' : '❌'}</span>
            <span className="text-gray-700">
              {isDbReachable
                ? 'DB 서버 응답 정상 (테이블 없음)'
                : 'DB 서버 응답 없음 — URL 또는 키를 확인하세요'}
            </span>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          이 페이지는 개발 확인용입니다 — 운영 배포 시 제거하세요.
        </p>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-24 shrink-0 font-medium text-gray-500">{label}</span>
      <span className="break-all font-mono text-xs text-gray-800 self-center">{value}</span>
    </div>
  )
}
