import type { BidInfo, ProjectRecord, CareerRecord } from '@/types';

const KEYS = {
  bids: 'bid-analyzer-bids',
  projects: 'bid-analyzer-projects',
  careers: 'bid-analyzer-careers',
};

function load<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

export const loadBids = () => load<BidInfo>(KEYS.bids);
export const saveBids = (d: BidInfo[]) => save(KEYS.bids, d);
export const loadProjects = () => load<ProjectRecord>(KEYS.projects);
export const saveProjects = (d: ProjectRecord[]) => save(KEYS.projects, d);
export const loadCareers = () => load<CareerRecord>(KEYS.careers);
export const saveCareers = (d: CareerRecord[]) => save(KEYS.careers, d);
