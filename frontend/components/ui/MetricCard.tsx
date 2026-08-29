import React from 'react';
import { Card } from './Card';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function MetricCard({ label, value, hint, icon, className = '' }: MetricCardProps) {
  return (
    <Card className={cn('flex flex-col gap-2', className)} glow>
      <div className="flex items-center justify-between text-xs font-medium text-[#8F9098] uppercase tracking-wider">
        <span>{label}</span>
        {icon && <span className="text-[#0EA5FF] opacity-80">{icon}</span>}
      </div>
      <div className="text-2xl lg:text-3xl font-bold text-white tracking-tight font-display">
        {typeof value === 'number' ? value.toLocaleString('es-CR') : value}
      </div>
      {hint && <div className="text-xs text-[#8F9098] font-normal mt-0.5">{hint}</div>}
    </Card>
  );
}
