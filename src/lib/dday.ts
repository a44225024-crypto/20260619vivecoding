export interface DdayInfo {
  label: string;
  urgent: boolean;
  expired: boolean;
}

function parseDate(raw: string): Date | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/년/g, '-').replace(/월/g, '-').replace(/일/g, '')
    .replace(/\.\s*/g, '-').replace(/\s/g, '').replace(/-+$/, '');
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
}

export function daysUntil(raw: string): number | null {
  const d = parseDate(raw);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - today.getTime()) / 86400000);
}

export function calcDday(raw: string): DdayInfo | null {
  const diff = daysUntil(raw);
  if (diff === null) return null;
  if (diff < 0) return { label: '마감', urgent: false, expired: true };
  return { label: `D-${diff}`, urgent: diff <= 7, expired: false };
}
