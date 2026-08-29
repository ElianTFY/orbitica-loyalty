import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  help?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, help, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium uppercase tracking-wider text-[#CFCFD4]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-[#121316] text-[#E5E6EA] placeholder-[#64656A] text-sm px-3.5 py-2 rounded-lg border border-[#27282D] focus:outline-none focus:border-[#0EA5FF] focus:ring-1 focus:ring-[#0EA5FF] transition-all disabled:opacity-50',
            error && 'border-red-500/60 focus:border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-400 font-normal">{error}</span>}
        {help && !error && <span className="text-xs text-[#64656A]">{help}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
