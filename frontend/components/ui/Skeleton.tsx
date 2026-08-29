import { cn } from '@/lib/utils';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cn('animate-pulse bg-[#1A1B1F] rounded-lg', className)} />;
}
