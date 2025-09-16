import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PerformanceIndicatorProps {
  value: number;
  threshold?: {
    high: number;
    medium: number;
  };
  format?: 'number' | 'currency' | 'percentage';
  showTrend?: boolean;
  trend?: number;
  label?: string;
  className?: string;
}

export function PerformanceIndicator({
  value,
  threshold = { high: 1.5, medium: 1.0 },
  format = 'number',
  showTrend = false,
  trend,
  label,
  className,
}: PerformanceIndicatorProps) {
  // Визначаємо рівень продуктивності
  const getPerformanceLevel = () => {
    if (value >= threshold.high) return 'high';
    if (value >= threshold.medium) return 'medium';
    return 'low';
  };

  const performanceLevel = getPerformanceLevel();

  // Форматування значення
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('uk-UA', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
        }).format(val);
      case 'percentage':
        return new Intl.NumberFormat('uk-UA', {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 2,
        }).format(val / 100);
      default:
        return new Intl.NumberFormat('uk-UA', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(val);
    }
  };

  // Отримуємо кольори для індикатора
  const getIndicatorClasses = () => {
    switch (performanceLevel) {
      case 'high':
        return 'performance-high';
      case 'medium':
        return 'performance-medium';
      case 'low':
        return 'performance-low';
      default:
        return 'performance-medium';
    }
  };

  // Отримуємо іконку тренду
  const getTrendIcon = () => {
    if (!showTrend || trend === undefined) return null;
    
    if (trend > 0) return <TrendingUp className="w-3 h-3 text-green-600" />;
    if (trend < 0) return <TrendingDown className="w-3 h-3 text-red-600" />;
    return <Minus className="w-3 h-3 text-gray-500" />;
  };

  const content = (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('performance-indicator', getIndicatorClasses())} />
      <div className="flex flex-col">
        <span className="font-medium text-sm">{formatValue(value)}</span>
        {showTrend && trend !== undefined && (
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            <span className={cn(
              'text-xs',
              trend > 0 && 'text-green-600',
              trend < 0 && 'text-red-600',
              trend === 0 && 'text-gray-500'
            )}>
              {Math.abs(trend).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (label) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium">{label}</div>
              <div className="text-muted-foreground">
                {performanceLevel === 'high' && 'Висока продуктивність'}
                {performanceLevel === 'medium' && 'Середня продуктивність'}
                {performanceLevel === 'low' && 'Низька продуктивність'}
              </div>
              {trend !== undefined && (
                <div className="text-xs mt-1">
                  Зміна: {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

// Компонент прогрес-бару з анімацією
interface AnimatedProgressProps {
  value: number;
  max: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export function AnimatedProgress({
  value,
  max,
  label,
  showValue = true,
  className,
}: AnimatedProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  // Визначаємо клас залежно від відсотка
  const getProgressClass = () => {
    if (percentage >= 80) return 'high';
    if (percentage >= 50) return 'medium';
    return 'low';
  };

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex justify-between items-center text-xs">
        {label && <span className="text-muted-foreground">{label}</span>}
        {showValue && (
          <span className="font-medium">
            {new Intl.NumberFormat('uk-UA').format(value)} / {new Intl.NumberFormat('uk-UA').format(max)}
          </span>
        )}
      </div>
      <div className="progress-bar bg-muted">
        <div
          className={cn('progress-fill animate-fade-in', getProgressClass())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}