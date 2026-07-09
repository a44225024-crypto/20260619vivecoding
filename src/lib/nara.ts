// 조달청 나라장터 입찰공고정보서비스 (data.go.kr) 서버 전용 클라이언트
// 절대 클라이언트 컴포넌트에서 import하지 말 것 — API 키가 노출됨

const BASE_URL = 'https://apis.data.go.kr/1230000/ad/BidPublicInfoService';

export type BidKind = 'servc' | 'cnstwk';

const ENDPOINT = {
  search: { servc: 'getBidPblancListInfoServcPPSSrch', cnstwk: 'getBidPblancListInfoCnstwkPPSSrch' },
  detail: { servc: 'getBidPblancListInfoServc', cnstwk: 'getBidPblancListInfoCnstwk' },
  bsisAmount: { servc: 'getBidPblancListInfoServcBsisAmount', cnstwk: 'getBidPblancListInfoCnstwkBsisAmount' },
} as const;

interface NaraItem {
  [key: string]: string | undefined;
}

async function callNara(endpoint: string, params: Record<string, string | number | undefined>) {
  const apiKey = process.env.NARA_API_KEY;
  if (!apiKey) throw new Error('NARA_API_KEY가 설정되지 않았습니다.');

  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set('ServiceKey', apiKey);
  url.searchParams.set('type', 'json');
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`나라장터 API 호출 실패 (HTTP ${res.status})`);

  const json = await res.json();
  const body = json?.response?.body;
  const header = json?.response?.header;

  if (header && header.resultCode !== '00') {
    throw new Error(header.resultMsg || '나라장터 API 오류');
  }

  const items = body?.items;
  if (!items) return { items: [] as NaraItem[], totalCount: 0 };

  const list: NaraItem[] = Array.isArray(items) ? items : [items];
  return { items: list, totalCount: Number(body?.totalCount ?? list.length) };
}

export function searchBids(
  kind: BidKind,
  opts: { keyword?: string; instt?: string; bgnDt: string; endDt: string; pageNo?: number; numOfRows?: number }
) {
  return callNara(ENDPOINT.search[kind], {
    inqryDiv: 1,
    inqryBgnDt: opts.bgnDt,
    inqryEndDt: opts.endDt,
    bidNtceNm: opts.keyword,
    ntceInsttNm: opts.instt,
    pageNo: opts.pageNo ?? 1,
    numOfRows: opts.numOfRows ?? 20,
  });
}

export async function getBidDetail(kind: BidKind, bidNtceNo: string) {
  const { items } = await callNara(ENDPOINT.detail[kind], {
    inqryDiv: 2,
    bidNtceNo,
    pageNo: 1,
    numOfRows: 10,
  });
  return items[0] ?? null;
}

export async function getBsisAmount(kind: BidKind, bidNtceNo: string) {
  const { items } = await callNara(ENDPOINT.bsisAmount[kind], {
    inqryDiv: 2,
    bidNtceNo,
    pageNo: 1,
    numOfRows: 10,
  });
  return items[0] ?? null;
}
