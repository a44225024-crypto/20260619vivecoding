import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { summarizeBid, GeminiError, type BidSummaryInput } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  let body: Partial<BidSummaryInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
  }

  const input: BidSummaryInput = {
    공고명: body.공고명 ?? '',
    발주기관: body.발주기관 ?? '',
    예정금액: body.예정금액 ?? '',
    용역기간: body.용역기간 ?? '',
    마감일: body.마감일 ?? '',
    참가자격: body.참가자격 ?? '',
  };

  const hasContent = Object.values(input).some((v) => v.trim().length > 0);
  if (!hasContent) {
    return NextResponse.json(
      { error: '요약할 공고 정보가 없습니다. 먼저 공고 정보를 입력해주세요.' },
      { status: 400 }
    );
  }

  try {
    const result = await summarizeBid(input);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof GeminiError) {
      if (e.code === 'RATE_LIMIT') {
        return NextResponse.json(
          { error: 'AI 요약 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' },
          { status: 429 }
        );
      }
      if (e.code === 'NOT_CONFIGURED') {
        return NextResponse.json(
          { error: 'AI 요약 기능이 아직 설정되지 않았습니다. 관리자에게 문의해주세요.' },
          { status: 500 }
        );
      }
    }
    return NextResponse.json(
      { error: '요약 생성에 실패했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 502 }
    );
  }
}
