import * as React from 'react';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'warning';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

/**
 * Kleine Hilfsfunktion zum Kombinieren von CSS-Klassen.
 * Entspricht der bisherigen cn()-Funktion aus lib/utils.
 */
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
  secondary: 'bg-gray-100 text-gray-800 border border-gray-200',
  outline: 'bg-transparent text-gray-800 border border-gray-300',
  warning: 'bg-orange-100 text-orange-800 border border-orange-200',
};

export function Badge({
  variant = 'default',
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

// Falls irgendwo ein Default-Import verwendet wird (import Badge from '...'):
export default Badge;