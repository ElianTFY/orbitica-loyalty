import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BrandSymbolProps {
  size?: number;
  className?: string;
}

export default function BrandSymbol({ size = 32, className = '' }: BrandSymbolProps) {
  return (
    <span
      className={cn('inline-flex items-center justify-center select-none shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <img
        src="/brand/orbitica-symbol.svg"
        alt="Orbítica"
        width={size}
        height={size}
        className="w-full h-full object-contain"
      />
    </span>
  );
}
