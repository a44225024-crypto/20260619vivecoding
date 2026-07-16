// Google Gemini API 서버 전용 클라이언트
// 절대 클라이언트 컴포넌트에서 import하지 말 것 — API 키가 노출됨

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export type GeminiErrorCode = 'NOT_CONFIGURED' | 'RATE_LIMIT' | 'CALL_FAILED';

export class GeminiError extends Error {
  code: GeminiErrorCode;
  constructor(code: GeminiErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export interface BidSummaryInput {
  공고명: string;
  발주기관: string;
  예정금액: string;
  용역기간: string;
  마감일: string;
  참가자격: string;
}

export interface BidSummaryResult {
  핵심요약: string;
  참가자격: string;
  마감일: string;
}

function buildPrompt(bid: BidSummaryInput): string {
  return `당신은 입찰 공고를 검토하는 수주전략팀 보조 담당자입니다.
아래 공고 정보를 바탕으로 실무자가 한눈에 파악할 수 있도록 정리하세요.

[공고 정보]
공고명: ${bid.공고명 || '(정보 없음)'}
발주기관: ${bid.발주기관 || '(정보 없음)'}
예정금액: ${bid.예정금액 || '(정보 없음)'}
용역기간: ${bid.용역기간 || '(정보 없음)'}
마감일: ${bid.마감일 || '(정보 없음)'}
참가자격 원문: ${bid.참가자격 || '(정보 없음)'}

아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.
{
  "핵심요약": "공고의 핵심 내용을 2~3문장으로 요약",
  "참가자격": "참가자격을 실무자가 바로 확인할 수 있도록 정리한 요약 (원문에 정보가 없으면 '원문 확인 필요'라고 표기)",
  "마감일": "마감일 정보를 알기 쉽게 정리 (원문에 정보가 없으면 '원문 확인 필요'라고 표기)"
}`;
}

export async function summarizeBid(bid: BidSummaryInput): Promise<BidSummaryResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiError('NOT_CONFIGURED', 'GEMINI_API_KEY가 설정되지 않았습니다.');

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/${MODEL}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: buildPrompt(bid) }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
      }),
    });
  } catch {
    throw new GeminiError('CALL_FAILED', 'Gemini API 호출 중 네트워크 오류가 발생했습니다.');
  }

  if (res.status === 429) {
    throw new GeminiError('RATE_LIMIT', 'Gemini API 요청 한도를 초과했습니다.');
  }
  if (!res.ok) {
    throw new GeminiError('CALL_FAILED', `Gemini API 호출 실패 (HTTP ${res.status})`);
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new GeminiError('CALL_FAILED', 'Gemini 응답이 비어 있습니다.');

  try {
    const parsed = JSON.parse(text);
    return {
      핵심요약: String(parsed.핵심요약 ?? ''),
      참가자격: String(parsed.참가자격 ?? ''),
      마감일: String(parsed.마감일 ?? ''),
    };
  } catch {
    throw new GeminiError('CALL_FAILED', 'Gemini 응답을 해석할 수 없습니다.');
  }
}
