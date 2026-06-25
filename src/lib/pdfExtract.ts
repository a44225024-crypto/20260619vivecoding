import type { BidInfo, ChecklistItem } from '@/types';

let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfjs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
  }
  return pdfjsLib;
}

async function extractText(file: File): Promise<string> {
  const pdfjs = await getPdfjs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
  }
  return pages.join('\n');
}

// 값에서 다음 섹션 구분자 이후를 잘라냄
function trimValue(val: string, maxLen = 120): string {
  return val
    .replace(/\s+\d+\.\s+[가-힣A-Z][\s\S]*$/, '')   // "2. 가-힣" 이후 제거
    .replace(/\s+[가나다라마바사아자차카타파하]\s*\.\s+[\s\S]*$/, '') // "나. " 이후 제거
    .replace(/\s+[①②③④⑤⑥⑦⑧⑨⑩][\s\S]*$/, '')         // 원문자 이후 제거
    .trim()
    .replace(/\s{2,}/g, ' ')
    .slice(0, maxLen);
}

function matchField(text: string, keywords: string[]): string {
  for (const kw of keywords) {
    const m = text.match(new RegExp(`${kw}[\\s:：]*([^\\n]{1,200})`, 'i'));
    if (m) return trimValue(m[1]);
  }
  return '';
}

// 발주기관: 명시적 키워드 없으면 서명부·한국계 기관명에서 추출
function extractOrg(text: string): string {
  const explicit = matchField(text, ['수요기관', '발주기관', '발주처', '발주청', '공고기관']);
  if (explicit) return explicit;

  // "공고합니다 ... [기관명]" 서명부 패턴
  const signing = text.match(
    /공고합니다[^가-힣]{0,60}([가-힣]{2,20}(?:공사|기관|청|원|처)(?:\s*[가-힣]{1,10}지사|지역|본부)?)/
  );
  if (signing) return signing[1].trim();

  // "한국" + 기관유형 패턴
  const korOrg = text.match(/한국[가-힣]{2,12}(?:공사|기관|청|원|처)/);
  if (korOrg) return korOrg[0];

  return '';
}

// 마감일: 입찰 진행일정 섹션에서 마감 날짜 우선 탐색
function matchDate(text: string): string {
  // 1. 진행일정 섹션 내 "마감" 날짜
  const schedule = text.match(/입찰\s*진행일정([\s\S]{0,1000})(?=\d+\.\s+[가-힣]|$)/);
  if (schedule) {
    const deadlineLine = schedule[1].match(
      /마감[^\d]{0,30}(\d{4}[.\-]\s*\d{1,2}[.\-]\s*\d{1,2})/
    );
    if (deadlineLine) return deadlineLine[1].replace(/\s/g, '');

    // 2번째 날짜(첫 번째는 보통 접수개시일)
    const dates = schedule[1].match(/\d{4}[.\-]\s*\d{1,2}[.\-]\s*\d{1,2}/g);
    if (dates && dates.length >= 2) return dates[1].replace(/\s/g, '');
    if (dates?.length) return dates[0].replace(/\s/g, '');
  }

  // 2. "마감일시" 바로 뒤 날짜
  const direct = text.match(/마감일시\s*[:\s]*(\d{4}[.\-]\s*\d{1,2}[.\-]\s*\d{1,2})/);
  if (direct) return direct[1].replace(/\s/g, '');

  // 3. 마감 키워드 근처 날짜
  const fallback = text.match(/마감[^\d]{0,60}(\d{4}[.\-]\d{1,2}[.\-]\d{1,2})/);
  if (fallback) return fallback[1];

  return '';
}

// 제출서류: 명시적 섹션 → 서류 유형 단어 → 기본값
function extractChecklist(text: string): ChecklistItem[] {
  // 1. 명시적 제출서류 섹션
  const sec = text.match(
    /(제출서류|제출 서류|입찰서류)\s*[:\n]([\s\S]{0,3000}?)(?=\n\s*\d+\s*[.。]\s*[가-힣A-Z]|$)/i
  );
  if (sec) {
    const block = sec[2];
    const raw =
      block.match(/[①②③④⑤⑥⑦⑧⑨⑩○●□■-]\s*[^\n①②③④⑤⑥⑦⑧⑨⑩○●□■]{3,80}/g) ||
      block.match(/\d+[).\s]\s*[^\n\d]{3,80}/g) ||
      [];
    const seen = new Set<string>();
    const items: ChecklistItem[] = [];
    raw.forEach((line, idx) => {
      const label = line.replace(/^[①②③④⑤⑥⑦⑧⑨⑩○●□■\d).\s-]+/, '').trim();
      if (label.length > 2 && !seen.has(label)) {
        seen.add(label);
        items.push({ id: `cl-${Date.now()}-${idx}`, label, status: 'todo' });
      }
    });
    if (items.length > 0) return items.slice(0, 20);
  }

  // 2. 참가자격 섹션에서 서류 유형 단어 추출
  const eligibility = text.match(/참가자격([\s\S]{0,3000})(?=\d+\.\s+[가-힣])/);
  const src = eligibility ? eligibility[1] : text;
  const docMatches = src.match(
    /[<「『]?[가-힣]{2,20}(?:증명서|확인서|확인증|서약서|보증서|면허증|등록증|신고서|면허|등록)[>」』]?/g
  );
  if (docMatches) {
    const seen = new Set<string>();
    const items: ChecklistItem[] = [];
    docMatches.forEach((doc, idx) => {
      const label = doc.replace(/[<>「」『』]/g, '').trim();
      if (label && !seen.has(label) && label.length >= 4 && label.length <= 25) {
        seen.add(label);
        items.push({ id: `cl-doc-${idx}`, label, status: 'todo' });
      }
    });
    if (items.length > 0) return items.slice(0, 15);
  }

  return [
    { id: 'def-1', label: '입찰서', status: 'todo' },
    { id: 'def-2', label: '사업자등록증 사본', status: 'todo' },
    { id: 'def-3', label: '제안서', status: 'todo' },
  ];
}

export async function parsePDF(
  file: File
): Promise<Omit<BidInfo, 'id' | 'uploadedAt'>> {
  const text = await extractText(file);
  const checklist = extractChecklist(text);

  return {
    fileName: file.name,
    공고명: matchField(text, ['공고명', '입찰공고명', '용역명', '사업명']),
    발주기관: extractOrg(text),
    예정금액: matchField(text, ['추정가격', '추정금액', '예정금액', '기초금액', '예산금액']),
    용역기간: matchField(text, ['용역기간', '계약기간', '사업기간', '이행기간']),
    마감일: matchDate(text),
    참가자격: matchField(text, ['참가자격', '입찰참가자격', '자격요건']),
    checklist,
  };
}
