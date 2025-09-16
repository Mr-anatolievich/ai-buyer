import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUpDown, ChevronRight, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/translations';
import { SparklineChart } from './SparklineChart';
import { PerformanceIndicator, AnimatedProgress } from './PerformanceIndicator';

export type CampaignData = {
  id: string;
  status: 'ACTIVE' | 'PAUSED' | 'LEARNING' | 'LIMITED' | 'ERROR';
  name: string;
  delivery: 'ELIGIBLE' | 'LIMITED' | 'REJECTED';
  bid_strategy: 'LOWEST_COST' | 'COST_CAP' | 'BID_CAP';
  budget: {
    type: 'DAILY' | 'LIFETIME';
    amount: number;
    currency: string;
  };
  results: {
    value: number;
    type: 'PURCHASE' | 'LEAD' | 'INSTALL';
  };
  reach: number;
  impressions: number;
  frequency: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  spend: number;
  conversions: number;
  cvr: number;
  cpa: number;
  revenue?: number;
  roas?: number;
  aov?: number;
  ends?: string | null;
  learning: boolean;
  issues: string[];
  ai_decision?: {
    rec: 'SCALE' | 'DUPLICATE' | 'PAUSE' | 'CLOSE';
    budget_change?: number;
    confidence: number;
    why: string[];
  };
  path?: string;
  hasChildren?: boolean;
};

interface StatisticsTableProps {
  data: CampaignData[];
  level: 'campaign' | 'adset' | 'ad';
  onRowClick?: (row: CampaignData) => void;
  loading?: boolean;
  selectedRows?: string[];
  onRowSelection?: (selectedIds: string[]) => void;
}

export function StatisticsTable({
  data,
  level,
  onRowClick,
  loading = false,
  selectedRows = [],
  onRowSelection,
}: StatisticsTableProps) {
  const t = useTranslations();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const formatCurrency = (value: number, currency = 'USD') => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('uk-UA').format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getStatusBadge = (status: CampaignData['status']) => {
    const variants = {
      ACTIVE: { className: 'status-badge-active', label: 'Активна' },
      PAUSED: { className: 'status-badge-paused', label: 'Призупинена' },
      LEARNING: { className: 'status-badge-learning', label: 'Навчання' },
      LIMITED: { className: 'status-badge-limited', label: 'Обмежена' },
      ERROR: { className: 'status-badge-error', label: 'Помилка' },
    };
    
    const config = variants[status];
    return <Badge className={cn('border-none text-white font-medium px-2 py-1', config.className)}>{config.label}</Badge>;
  };

  const getAiDecisionBadge = (aiDecision?: CampaignData['ai_decision']) => {
    if (!aiDecision) return null;
    
    const variants = {
      SCALE: { color: 'text-green-600', icon: TrendingUp, label: 'Масштабувати' },
      DUPLICATE: { color: 'text-blue-600', icon: ChevronRight, label: 'Дублювати' },
      PAUSE: { color: 'text-yellow-600', icon: AlertTriangle, label: 'Призупинити' },
      CLOSE: { color: 'text-red-600', icon: AlertTriangle, label: 'Закрити' },
    };
    
    const config = variants[aiDecision.rec];
    const Icon = config.icon;
    
    return (
      <div className="flex items-center gap-1 text-xs">
        <Icon className={cn("w-3 h-3", config.color)} />
        <span className={config.color}>
          {config.label} ({Math.round(aiDecision.confidence * 100)}%)
        </span>
      </div>
    );
  };

  const columns = useMemo<ColumnDef<CampaignData>[]>(
    () => [
      // Selection checkbox
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Вибрати всі"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Вибрати рядок"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },
      // Status (pinned)
      {
        accessorKey: 'status',
        header: 'Статус',
        cell: ({ row }) => getStatusBadge(row.getValue('status')),
        size: 100,
      },
      // Name (pinned)
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Назва
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium">{row.getValue('name')}</div>
            {row.original.ai_decision && getAiDecisionBadge(row.original.ai_decision)}
            {/* Mini sparkline for performance trend */}
            <SparklineChart
              data={[1.2, 1.1, 1.3, 1.4, 1.6, 1.5, row.original.roas || 1.0]}
              color={row.original.roas && row.original.roas > 1.3 ? 'positive' : 'negative'}
              width={50}
              height={12}
              className="opacity-60"
            />
          </div>
        ),
        minSize: 200,
      },
      // Delivery
      {
        accessorKey: 'delivery',
        header: 'Доставка',
        cell: ({ row }) => {
          const delivery = row.getValue('delivery') as string;
          const variants = {
            ELIGIBLE: { className: 'status-badge-active', label: 'Підходить' },
            LIMITED: { className: 'status-badge-limited', label: 'Обмежена' },
            REJECTED: { className: 'status-badge-error', label: 'Відхилена' },
          };
          const config = variants[delivery as keyof typeof variants];
          return <Badge className={cn('border-none text-white font-medium px-2 py-1 text-xs', config.className)}>{config.label}</Badge>;
        },
        size: 120,
      },
      // Budget
      {
        accessorKey: 'budget',
        header: 'Бюджет',
        cell: ({ row }) => {
          const budget = row.getValue('budget') as CampaignData['budget'];
          return (
            <div className="text-sm">
              <div>{formatCurrency(budget.amount, budget.currency)}</div>
              <div className="text-muted-foreground text-xs">
                {budget.type === 'DAILY' ? 'щодня' : 'загалом'}
              </div>
            </div>
          );
        },
        size: 120,
      },
      // Results
      {
        accessorKey: 'results',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Результати
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const results = row.getValue('results') as CampaignData['results'];
          const types = {
            PURCHASE: 'Покупки',
            LEAD: 'Ліди',
            INSTALL: 'Встановлення',
          };
          
          // Generate mock trend data
          const trendData = Array.from({ length: 7 }, (_, i) => 
            results.value * (0.8 + Math.random() * 0.4)
          );
          
          return (
            <div className="flex items-center gap-2">
              <div className="text-sm">
                <div className="font-medium">{formatNumber(results.value)}</div>
                <div className="text-muted-foreground text-xs">{types[results.type]}</div>
              </div>
              <SparklineChart
                data={trendData}
                color="positive"
                width={40}
                height={16}
                showSpots
                className="opacity-70"
              />
            </div>
          );
        },
        size: 100,
      },
      // Reach
      {
        accessorKey: 'reach',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Охоплення
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => formatNumber(row.getValue('reach')),
        size: 100,
      },
      // Impressions
      {
        accessorKey: 'impressions',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Покази
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => formatNumber(row.getValue('impressions')),
        size: 100,
      },
      // Frequency
      {
        accessorKey: 'frequency',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Частота
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (row.getValue('frequency') as number).toFixed(2),
        size: 80,
      },
      // Clicks
      {
        accessorKey: 'clicks',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Кліки
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => formatNumber(row.getValue('clicks')),
        size: 80,
      },
      // CTR
      {
        accessorKey: 'ctr',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            CTR
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => formatPercentage(row.getValue('ctr')),
        size: 80,
      },
      // CPC
      {
        accessorKey: 'cpc',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            CPC
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => formatCurrency(row.getValue('cpc')),
        size: 90,
      },
      // CPM
      {
        accessorKey: 'cpm',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            CPM
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => formatCurrency(row.getValue('cpm')),
        size: 90,
      },
      // Amount Spent (pinned right)
      {
        accessorKey: 'spend',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Витрачено
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{formatCurrency(row.getValue('spend'))}</div>
        ),
        size: 120,
      },
      // CPA (pinned right)
      {
        accessorKey: 'cpa',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            CPA
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{formatCurrency(row.getValue('cpa'))}</div>
        ),
        size: 100,
      },
      // ROAS (pinned right)
      {
        accessorKey: 'roas',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            ROAS
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const roas = row.getValue('roas') as number | undefined;
          return roas ? (
            <PerformanceIndicator
              value={roas}
              threshold={{ high: 1.5, medium: 1.0 }}
              format="number"
              showTrend
              trend={5.2} // Mock trend
              label="ROAS Performance"
            />
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
        size: 80,
      },
      // Actions
      {
        id: 'actions',
        cell: ({ row }) => (
          row.original.hasChildren && (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )
        ),
        size: 40,
      },
    ],
    [t]
  );

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' 
        ? updater(table.getState().rowSelection)
        : updater;
      
      const selectedIds = Object.keys(newSelection).filter(id => newSelection[id]);
      onRowSelection?.(selectedIds);
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection: selectedRows.reduce((acc, id) => ({ ...acc, [id]: true }), {}),
    },
  });

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted/50 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border shadow-sm bg-card animate-fade-in">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className={cn(
                      header.column.getIsPinned() === 'left' && "sticky left-0 bg-background z-20",
                      header.column.getIsPinned() === 'right' && "sticky right-0 bg-background z-20"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    "table-row-hover animate-fade-in",
                    row.getIsSelected() && "table-row-selected",
                    onRowClick && row.original.hasChildren && "cursor-pointer"
                  )}
                  onClick={() => {
                    if (onRowClick && row.original.hasChildren) {
                      onRowClick(row.original);
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className={cn(
                        cell.column.getIsPinned() === 'left' && "sticky left-0 bg-background z-10",
                        cell.column.getIsPinned() === 'right' && "sticky right-0 bg-background z-10"
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Немає даних для відображення.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer with totals */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Показано {table.getRowModel().rows.length} з {data.length} рядків
        </div>
        <div className="flex gap-4">
          <span>Загальні витрати: {formatCurrency(data.reduce((sum, row) => sum + row.spend, 0))}</span>
          <span>Загальні результати: {formatNumber(data.reduce((sum, row) => sum + row.results.value, 0))}</span>
        </div>
      </div>
    </div>
  );
}