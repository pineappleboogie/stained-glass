'use client';

import { cn } from '@/lib/utils';

interface DividerProps {
  className?: string;
}

export function Divider({ className }: DividerProps) {
  return <div className={cn('divider my-5', className)} />;
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
    <div className={cn('text-center py-6 px-4', className)}>
      <h1 className="text-xl tracking-[0.2em] text-foreground">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1 italic">
          {subtitle}
        </p>
      )}
    </div>
  );
}
