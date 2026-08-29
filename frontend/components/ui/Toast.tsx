'use client';
import React from 'react';
import { useToast, ToastItem } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function ToastContainer() {
  const { toasts } = useToast();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <ToastCard key={t.id} item={t} />
      ))}
    </div>
  );
}

function ToastCard({ item }: { item: ToastItem }) {
  const borderColors = {
    success: 'border-emerald-500/40 bg-[#0A1A12]',
    error: 'border-rose-500/40 bg-[#1A0A0E]',
    warning: 'border-amber-500/40 bg-[#1A140A]',
    info: 'border-[#0EA5FF]/40 bg-[#0A141A]',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl text-sm backdrop-blur-md transition-all',
        borderColors[item.type]
      )}
    >
      <span className="font-bold text-base">{icons[item.type]}</span>
      <div className="flex-1">
        {item.title && <strong className="block text-white font-semibold mb-0.5">{item.title}</strong>}
        <span className="text-[#E5E6EA]">{item.message}</span>
      </div>
    </div>
  );
}
