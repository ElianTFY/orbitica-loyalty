import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0EA5FF] focus:ring-offset-2 focus:ring-offset-[#0A0A0A] disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

    const variants = {
      primary: 'bg-[#0EA5FF] text-white hover:bg-[#0091EA] active:bg-[#0077C2] shadow-[0_0_20px_rgba(14,165,255,0.25)] border border-[#38bdf8]/40',
      secondary: 'bg-[#1A1B1F] text-[#E5E6EA] hover:bg-[#27282D] border border-[#27282D] hover:border-[#3F4046]',
      ghost: 'bg-transparent text-[#CFCFD4] hover:text-white hover:bg-[#1A1B1F]/60',
      danger: 'bg-[#EF4444] text-white hover:bg-[#DC2626] border border-red-500/30',
      outline: 'bg-transparent text-[#E5E6EA] border border-[#27282D] hover:border-[#0EA5FF] hover:text-[#0EA5FF]',
      soft: 'bg-[#0EA5FF]/10 text-[#0EA5FF] hover:bg-[#0EA5FF]/20 border border-[#0EA5FF]/20',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        {...props}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);
Button.displayName = 'Button';
