import { cn } from '@/lib/utils';

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: 'positive' | 'negative' | 'neutral';
  showSpots?: boolean;
  className?: string;
}

export function SparklineChart({
  data,
  width = 60,
  height = 20,
  color = 'neutral',
  showSpots = false,
  className,
}: SparklineChartProps) {
  // Валідація та очищення даних
  const validData = data && Array.isArray(data) && data.length > 0 
    ? data.filter(d => typeof d === 'number' && !isNaN(d))
    : [1, 1, 1]; // Fallback data

  // Якщо немає валідних даних, показуємо простий індикатор
  if (validData.length < 2) {
    return (
      <div className={cn('inline-block w-4 h-4 rounded-full bg-gray-300', className)} />
    );
  }

  const colors = {
    positive: '#10b981', // green-500
    negative: '#ef4444',  // red-500
    neutral: '#6b7280',   // gray-500
  };

  const sparkColor = colors[color];

  // Визначаємо тренд
  const trend = validData.length >= 2 ? (validData[validData.length - 1] > validData[0] ? 'up' : 'down') : 'neutral';

  // Нормалізуємо дані для відображення
  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const range = max - min || 1;

  // Створюємо точки для SVG path
  const points = validData.map((value, index) => {
    const x = (index / (validData.length - 1)) * (width - 4) + 2;
    const y = height - 2 - ((value - min) / range) * (height - 4);
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;

  return (
    <div className={cn('sparkline-container inline-flex items-center gap-1', className)}>
      <svg width={width} height={height} className="overflow-visible">
        <path
          d={pathData}
          stroke={sparkColor}
          strokeWidth={1.5}
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        {showSpots && validData.map((value, index) => {
          const x = (index / (validData.length - 1)) * (width - 4) + 2;
          const y = height - 2 - ((value - min) / range) * (height - 4);
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={1.5}
              fill={sparkColor}
              stroke={sparkColor}
              strokeWidth={0.5}
            />
          );
        })}
      </svg>
      
      {/* Trend indicator */}
      <div className={cn(
        'w-1 h-1 rounded-full',
        trend === 'up' && 'bg-green-500',
        trend === 'down' && 'bg-red-500',
        trend === 'neutral' && 'bg-gray-400'
      )} />
    </div>
  );
}

// Компонент для відображення спарклайну з метрикою
interface MetricSparklineProps {
  label: string;
  value: string | number;
  data: number[];
  change?: number;
  format?: 'currency' | 'percentage' | 'number';
  className?: string;
}

export function MetricSparkline({
  label,
  value,
  data,
  change,
  format = 'number',
  className,
}: MetricSparklineProps) {
  const formatValue = (val: string | number) => {
    const numVal = typeof val === 'string' ? parseFloat(val) : val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('uk-UA', {
          style: 'currency',
          currency: 'USD',
        }).format(numVal);
      case 'percentage':
        return new Intl.NumberFormat('uk-UA', {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 2,
        }).format(numVal / 100);
      default:
        return new Intl.NumberFormat('uk-UA').format(numVal);
    }
  };

  const changeColor = change && change > 0 ? 'positive' : change && change < 0 ? 'negative' : 'neutral';

  return (
    <div className={cn('flex items-center justify-between p-2 rounded-lg bg-muted/30', className)}>
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{formatValue(value)}</div>
        {change !== undefined && (
          <div className={cn(
            'text-xs flex items-center gap-1',
            change > 0 && 'text-green-600',
            change < 0 && 'text-red-600',
            change === 0 && 'text-gray-500'
          )}>
            {change > 0 && '↗'}
            {change < 0 && '↘'}
            {change === 0 && '→'}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <SparklineChart
        data={data}
        color={changeColor}
        showSpots
        className="ml-2"
      />
    </div>
  );
}