import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBidDetail, getBsisAmount, type BidKind } from '@/lib/nara';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const kind = (searchParams.get('kind') ?? 'servc') as BidKind;
  const bidNtceNo = searchParams.get('bidNtceNo');

  if (!bidNtceNo) {
    return NextResponse.json({ error: 'bidNtceNo는 필수입니다.' }, { status: 400 });
  }

  try {
    const [detail, bsisAmount] = await Promise.all([
      getBidDetail(kind, bidNtceNo),
      getBsisAmount(kind, bidNtceNo).catch(() => null),
    ]);

    if (!detail) {
      return NextResponse.json({ error: '해당 입찰공고번호를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ detail, bsisAmount });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '조회 실패' }, { status: 502 });
  }
}
