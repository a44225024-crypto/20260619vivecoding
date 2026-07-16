'use client';

import { useState } from 'react';
import type { ChecklistItem, ChecklistStatus } from '@/types';

const LABELS: Record<ChecklistStatus, string> = {
  todo: '미시작',
  inprogress: '진행중',
  done: '완료',
};

const COLORS: Record<ChecklistStatus, string> = {
  todo: 'bg-gray-100 text-gray-600',
  inprogress: 'bg-yellow-100 text-yellow-700',
  done: 'bg-green-100 text-green-700',
};

const NEXT: Record<ChecklistStatus, ChecklistStatus> = {
  todo: 'inprogress',
  inprogress: 'done',
  done: 'todo',
};

interface Props {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}

export default function Checklist({ items, onChange }: Props) {
  const [input, setInput] = useState('');

  const toggle = (id: string) =>
    onChange(items.map((i) => (i.id === id ? { ...i, status: NEXT[i.status] } : i)));

  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));

  const add = () => {
    const label = input.trim();
    if (!label) return;
    onChange([...items, { id: `cl-${Date.now()}`, label, status: 'todo' }]);
    setInput('');
  };

  const done = items.filter((i) => i.status === 'done').length;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        {done}/{items.length} 완료
      </p>

      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 group">
            <button
              onClick={() => toggle(item.id)}
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 ${COLORS[item.status]}`}
              title="클릭하여 상태 변경"
            >
              {LABELS[item.status]}
            </button>
            <span
              className={`flex-1 text-xs ${
                item.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'
              }`}
            >
              {item.label}
            </span>
            <button
              onClick={() => remove(item.id)}
              aria-label="서류 삭제"
              className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity text-sm"
              title="삭제"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="서류 추가…"
          className="flex-1 rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1"
        />
        <button
          onClick={add}
          className="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
        >
          추가
        </button>
      </div>
    </div>
  );
}
