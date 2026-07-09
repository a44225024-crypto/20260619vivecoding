export type ChecklistStatus = 'todo' | 'inprogress' | 'done';

export interface ChecklistItem {
  id: string;
  label: string;
  status: ChecklistStatus;
}

export interface BidInfo {
  id: string;
  fileName: string;
  공고명: string;
  발주기관: string;
  예정금액: string;
  용역기간: string;
  마감일: string;
  참가자격: string;
  checklist: ChecklistItem[];
  uploadedAt: string;
  bidNtceNo?: string;
  bidNtceOrd?: string;
  공고구분?: string;
}

export interface ProjectRecord {
  id: string;
  용역명: string;
  발주처: string;
  계약금액: string;
  수행기간: string;
  주요내용: string;
}

export interface CareerRecord {
  id: string;
  성명: string;
  직위: string;
  보유자격: string;
  주요경력: string;
}
