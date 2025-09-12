import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar as CalendarIcon, 
  Filter, 
  Search, 
  X, 
  Settings2, 
  Download,
  Eye,
  Columns3
} from 'lucide-react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface FilterState {
  dateRange: {
    from: Date;
    to: Date;
  };
  status: string[];
  objective: string[];
  search: string;
  breakdowns: string[];
  account: string;
  columnPreset: string;
}

interface StatisticsFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onExport: () => void;
  savedViews: Array<{ id: string; name: string; filters: FilterState }>;
  onSaveView: (name: string) => void;
  onLoadView: (viewId: string) => void;
}

const DATE_PRESETS = [
  { label: 'Вчора', value: 'yesterday' },
  { label: 'Останні 7 днів', value: 'last_7_days' },
  { label: 'Останні 14 днів', value: 'last_14_days' },
  { label: 'Останні 30 днів', value: 'last_30_days' },
  { label: 'Цей місяць', value: 'this_month' },
  { label: 'Минулий місяць', value: 'last_month' },
];

const STATUS_OPTIONS = [
  { label: 'Активні', value: 'active' },
  { label: 'Призупинені', value: 'paused' },
  { label: 'Навчання', value: 'learning' },
  { label: 'Обмежені', value: 'limited' },
  { label: 'Помилки', value: 'error' },
];

const OBJECTIVE_OPTIONS = [
  { label: 'Конверсії', value: 'conversions' },
  { label: 'Трафік', value: 'traffic' },
  { label: 'Охоплення', value: 'reach' },
  { label: 'Взаємодія', value: 'engagement' },
  { label: 'Встановлення додатків', value: 'app_installs' },
  { label: 'Переглядання відео', value: 'video_views' },
];

const BREAKDOWN_OPTIONS = [
  { label: 'Країна', value: 'country' },
  { label: 'Розміщення', value: 'placement' },
  { label: 'Платформа', value: 'platform' },
  { label: 'Пристрій', value: 'device' },
  { label: 'Вік', value: 'age' },
  { label: 'Стать', value: 'gender' },
  { label: 'Година дня', value: 'hour' },
];

const COLUMN_PRESETS = [
  { label: 'Ефективність', value: 'performance' },
  { label: 'Доставка', value: 'delivery' },
  { label: 'Взаємодія', value: 'engagement' },
  { label: 'Відео', value: 'video' },
  { label: 'Додатки', value: 'app' },
  { label: 'ROAS', value: 'roas' },
  { label: 'Кастомний', value: 'custom' },
];

export function StatisticsFilters({
  filters,
  onFiltersChange,
  onExport,
  savedViews,
  onSaveView,
  onLoadView,
}: StatisticsFiltersProps) {
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [saveViewName, setSaveViewName] = useState('');
  const [isSaveViewOpen, setIsSaveViewOpen] = useState(false);

  const updateFilters = (updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const applyDatePreset = (preset: string) => {
    const now = new Date();
    let from: Date, to: Date;

    switch (preset) {
      case 'yesterday':
        from = to = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'last_7_days':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        to = now;
        break;
      case 'last_14_days':
        from = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        to = now;
        break;
      case 'last_30_days':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        to = now;
        break;
      default:
        return;
    }

    updateFilters({ dateRange: { from, to } });
    setIsDateOpen(false);
  };

  const toggleBreakdown = (breakdown: string) => {
    const newBreakdowns = filters.breakdowns.includes(breakdown)
      ? filters.breakdowns.filter(b => b !== breakdown)
      : [...filters.breakdowns, breakdown];
    
    updateFilters({ breakdowns: newBreakdowns });
  };

  const clearAllFilters = () => {
    updateFilters({
      status: [],
      objective: [],
      search: '',
      breakdowns: [],
      account: '',
    });
  };

  const activeFiltersCount = [
    ...filters.status,
    ...filters.objective,
    ...filters.breakdowns,
    filters.search ? 1 : 0,
    filters.account ? 1 : 0,
  ].length;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Label htmlFor="date-range" className="text-sm font-medium">
              Період:
            </Label>
            <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-60 justify-start text-left font-normal",
                    !filters.dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange?.from ? (
                    filters.dateRange.to ? (
                      <>
                        {format(filters.dateRange.from, "dd MMM", { locale: uk })} -{" "}
                        {format(filters.dateRange.to, "dd MMM", { locale: uk })}
                      </>
                    ) : (
                      format(filters.dateRange.from, "dd MMM", { locale: uk })
                    )
                  ) : (
                    "Оберіть період"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex">
                  <div className="p-3 border-r">
                    <div className="space-y-1">
                      {DATE_PRESETS.map((preset) => (
                        <Button
                          key={preset.value}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => applyDatePreset(preset.value)}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={filters.dateRange?.from}
                    selected={filters.dateRange}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        updateFilters({ dateRange: { from: range.from, to: range.to } });
                        setIsDateOpen(false);
                      }
                    }}
                    numberOfMonths={2}
                    locale={uk}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Статус:</Label>
            <Select 
              value={filters.status.join(',')} 
              onValueChange={(value) => updateFilters({ status: value ? value.split(',') : [] })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Всі" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Objective Filter */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Цель:</Label>
            <Select 
              value={filters.objective.join(',')} 
              onValueChange={(value) => updateFilters({ objective: value ? value.split(',') : [] })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Всі" />
              </SelectTrigger>
              <SelectContent>
                {OBJECTIVE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Пошук по назві..."
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="pl-8 w-60"
              />
            </div>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Breakdowns */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Розбиття:</Label>
            <Popover open={isBreakdownOpen} onOpenChange={setIsBreakdownOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Settings2 className="h-4 w-4" />
                  Розбиття
                  {filters.breakdowns.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {filters.breakdowns.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60" align="start">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Розбити по:</h4>
                  <div className="space-y-2">
                    {BREAKDOWN_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={option.value}
                          checked={filters.breakdowns.includes(option.value)}
                          onChange={() => toggleBreakdown(option.value)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={option.value} className="text-sm">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Column Preset */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Колонки:</Label>
            <Select 
              value={filters.columnPreset} 
              onValueChange={(value) => updateFilters({ columnPreset: value })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLUMN_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {activeFiltersCount} фільтр(ів)
              </Badge>
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4" />
                Очистити
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Saved Views */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Вигляди
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60" align="end">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Збережені вигляди</h4>
                  <div className="space-y-1">
                    {savedViews.map((view) => (
                      <Button
                        key={view.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => onLoadView(view.id)}
                      >
                        {view.name}
                      </Button>
                    ))}
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Input
                      placeholder="Назва нового вигляду"
                      value={saveViewName}
                      onChange={(e) => setSaveViewName(e.target.value)}
                    />
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        if (saveViewName.trim()) {
                          onSaveView(saveViewName.trim());
                          setSaveViewName('');
                        }
                      }}
                      disabled={!saveViewName.trim()}
                    >
                      Зберегти поточний вигляд
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Export */}
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Експорт
            </Button>
          </div>
        </div>

        {/* Active Breakdown Tags */}
        {filters.breakdowns.length > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <span className="text-sm text-muted-foreground">Розбиття по:</span>
            {filters.breakdowns.map((breakdown) => {
              const option = BREAKDOWN_OPTIONS.find(opt => opt.value === breakdown);
              return (
                <Badge key={breakdown} variant="outline" className="gap-1">
                  {option?.label}
                  <button
                    onClick={() => toggleBreakdown(breakdown)}
                    className="ml-1 hover:bg-muted rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}