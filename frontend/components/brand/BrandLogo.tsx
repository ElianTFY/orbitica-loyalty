import Link from 'next/link';
import { cn } from '@/lib/utils';
import BrandSymbol from './BrandSymbol';

interface BrandLogoProps {
  href?: string;
  product?: string;
  variant?: 'horizontal' | 'compact' | 'symbol';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function BrandLogo({
  href = '/',
  product = 'LOYALTY',
  variant = 'horizontal',
  size = 'md',
  className = '',
}: BrandLogoProps) {
  const symbolSize = size === 'sm' ? 24 : size === 'lg' ? 40 : 32;

  const content = (
    <span className={cn('inline-flex items-center gap-2.5 font-sans tracking-wide text-white group', className)}>
      <BrandSymbol size={symbolSize} />
      {variant !== 'symbol' && (
        <span className="flex flex-col leading-none">
          <span className="flex items-center gap-1.5 text-base font-bold tracking-widest text-[#E5E6EA] font-display">
            ORBÍTICA
            {variant === 'horizontal' && (
              <span className="text-[10px] uppercase font-normal tracking-widest text-[#CFCFD4] opacity-80">
                STUDIO
              </span>
            )}
          </span>
          {product && (
            <span className="text-[10px] font-semibold tracking-widest text-[#0EA5FF] uppercase mt-0.5">
              {product}
            </span>
          )}
        </span>
      )}
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="inline-flex items-center no-underline transition-opacity hover:opacity-90">
      {content}
    </Link>
  );
}
