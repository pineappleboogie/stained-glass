'use client';

import { cn } from '@/lib/utils';

interface DividerProps {
  className?: string;
}

export function Divider({ className }: DividerProps) {
  return (
    <div className={cn('flex items-center gap-3 my-5', className)}>
      <div className="flex-1 divider" />
      <span className="text-border text-xs">◆</span>
      <div className="flex-1 divider" />
    </div>
  );
}

interface SectionHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionHeader({ children, className }: SectionHeaderProps) {
  return (
    <h3
      className={cn(
        'text-xs tracking-[0.15em] uppercase text-muted-foreground mb-3',
        className
      )}
    >
      {children}
    </h3>
  );
}

interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function PanelHeader({ title, subtitle, className }: PanelHeaderProps) {
  return (
    <div className={cn('text-center pt-4 pb-1 px-4', className)}>
      <h1 className="text-xl tracking-[0.1em] text-foreground font-serif">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-0.5 italic font-serif">
          {subtitle}
        </p>
      )}
    </div>
  );
}
