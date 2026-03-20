import { cn } from '../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        {
          'bg-primary text-white hover:bg-primary-hover': variant === 'primary',
          'bg-muted text-foreground hover:bg-gray-200': variant === 'secondary',
          'hover:bg-muted': variant === 'ghost',
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-4 text-sm': size === 'md',
          'h-12 px-6 text-base': size === 'lg',
        },
        className
      )}
      {...props}
    />
  );
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-default bg-white shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: CardProps) {
  return (
    <h3 className={cn('text-lg font-semibold leading-none', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('p-4 pt-0', className)} {...props}>
      {children}
    </div>
  );
}

interface ProgressProps {
  value: number;
  className?: string;
}

export function Progress({ value, className }: ProgressProps) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-gray-200', className)}>
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

interface TabsProps {
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ children, className }: TabsProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {children}
    </div>
  );
}

interface TabProps {
  value: string;
  currentValue: string;
  onClick: (value: string) => void;
  children: React.ReactNode;
}

export function Tab({ value, currentValue, onClick, children }: TabProps) {
  const isActive = value === currentValue;
  return (
    <button
      onClick={() => onClick(value)}
      className={cn(
        'px-4 py-2 text-sm font-medium rounded-md transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted hover:text-foreground hover:bg-muted'
      )}
    >
      {children}
    </button>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'destructive';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        {
          'bg-red-500 text-white': variant === 'destructive',
          'bg-primary/10 text-primary border border-primary/30': variant === 'outline',
          'bg-primary/10 text-primary': variant === 'default',
        },
        className
      )}
    >
      {children}
    </span>
  );
}

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ScrollArea({ className, children, ...props }: ScrollAreaProps) {
  return (
    <div className={cn('overflow-auto scrollbar-thin', className)} {...props}>
      {children}
    </div>
  );
}
