import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchBids, type BidKind } from '@/lib/nara';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const kind = (searchParams.get('kind') ?? 'servc') as BidKind;
  const keyword = searchParams.get('keyword') ?? undefined;
  const instt = searchParams.get('instt') ?? undefined;
  const bgnDt = searchParams.get('bgnDt');
  const endDt = searchParams.get('endDt');

  if (!bgnDt || !endDt) {
    return NextResponse.json({ error: 'bgnDt, endDt는 필수입니다.' }, { status: 400 });
  }

  try {
    const { items, totalCount } = await searchBids(kind, { keyword, instt, bgnDt, endDt });
    return NextResponse.json({ items, totalCount });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '조회 실패' }, { status: 502 });
  }
}
