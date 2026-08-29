import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export function Card({ children, className = '', glow = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[#121316] border border-[#27282D] rounded-xl p-5 transition-all text-[#E5E6EA]',
        glow && 'hover:border-[#0EA5FF]/40 hover:shadow-[0_0_25px_rgba(14,165,255,0.1)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center justify-between pb-3 mb-3 border-b border-[#1A1B1F]', className)}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-base font-semibold text-white tracking-tight', className)}>{children}</h3>;
}
