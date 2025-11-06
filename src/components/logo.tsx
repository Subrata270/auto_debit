import { Gem } from 'lucide-react';

export default function Logo({ size = 'md', hideText = false }: { size?: 'sm' | 'md' | 'lg', hideText?: boolean }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  };
  
  const textSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <div className={`flex items-center justify-center rounded-lg bg-primary text-primary-foreground ${sizeClasses[size]}`}>
        <Gem className="h-2/3 w-2/3" />
      </div>
      {!hideText && <span className={`font-bold ${textSizeClasses[size]}`}>AutoTrack Pro</span>}
    </div>
  );
}
