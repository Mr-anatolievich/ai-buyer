import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ArrowLeft, Play, Pause, Copy, X, Edit, TrendingUp, BarChart3, Zap, Settings } from 'lucide-react';
import { StatisticsTable, CampaignData } from '@/components/statistics/StatisticsTable';
import { StatisticsFilters, FilterState } from '@/components/statistics/StatisticsFilters';
import { AiInsightsPanel } from '@/components/statistics/AiInsightsPanel';
import { FacebookAccountManager } from '@/components/facebook/FacebookAccountManager';
import { useTranslations } from '@/lib/translations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ViewLevel = 'campaign' | 'adset' | 'ad';

// Mock data following the API contract
const MOCK_CAMPAIGNS: CampaignData[] = [
  {
    id: 'cmp_123',
    status: 'ACTIVE',
    name: '[UA] Autumn Promo',
    delivery: 'ELIGIBLE',
    bid_strategy: 'LOWEST_COST',
    budget: { type: 'DAILY', amount: 150.0, currency: 'USD' },
    results: { value: 127, type: 'PURCHASE' },
    reach: 42135,
    impressions: 118204,
    frequency: 2.81,
    clicks: 8421,
    ctr: 0.0712,
    cpc: 0.37,
    cpm: 26.4,
    spend: 3120.45,
    conversions: 127,
    cvr: 0.0151,
    cpa: 24.57,
    revenue: 4980.00,
    roas: 1.595,
    aov: 39.21,
    ends: null,
    learning: false,
    issues: [],
    ai_decision: { rec: 'SCALE', budget_change: 0.2, confidence: 0.78, why: ['ROAS 1.59 ≥ 1.3', 'Freq 2.81 < 3.5', 'CTR +9% WoW'] },
    hasChildren: true,
  },
  {
    id: 'cmp_124',
    status: 'ACTIVE',
    name: 'Holiday Collection 2024',
    delivery: 'ELIGIBLE',
    bid_strategy: 'COST_CAP',
    budget: { type: 'DAILY', amount: 200.0, currency: 'USD' },
    results: { value: 89, type: 'PURCHASE' },
    reach: 38420,
    impressions: 95680,
    frequency: 2.49,
    clicks: 6890,
    ctr: 0.0720,
    cpc: 0.42,
    cpm: 29.1,
    spend: 2894.80,
    conversions: 89,
    cvr: 0.0129,
    cpa: 32.52,
    revenue: 3567.00,
    roas: 1.232,
    aov: 40.08,
    ends: null,
    learning: false,
    issues: [],
    ai_decision: { rec: 'DUPLICATE', confidence: 0.65, why: ['Freq 2.49 approx 3.0', 'Good ROAS 1.23', 'Audience saturation'] },
    hasChildren: true,
  },
  {
    id: 'cmp_125',
    status: 'PAUSED',
    name: 'Summer Sale Retargeting',
    delivery: 'LIMITED',
    bid_strategy: 'LOWEST_COST',
    budget: { type: 'LIFETIME', amount: 1000.0, currency: 'USD' },
    results: { value: 23, type: 'PURCHASE' },
    reach: 12340,
    impressions: 28450,
    frequency: 2.31,
    clicks: 1420,
    ctr: 0.0499,
    cpc: 0.89,
    cpm: 44.5,
    spend: 1265.48,
    conversions: 23,
    cvr: 0.0162,
    cpa: 55.02,
    revenue: 920.00,
    roas: 0.727,
    aov: 40.00,
    ends: '2024-12-31',
    learning: false,
    issues: ['LOW_PERFORMANCE'],
    ai_decision: { rec: 'CLOSE', confidence: 0.92, why: ['ROAS 0.73 < 0.8', 'High CPA $55', 'Limited delivery'] },
    hasChildren: true,
  },
];

const MOCK_ADSETS: CampaignData[] = [
  {
    id: 'ads_201',
    status: 'ACTIVE',
    name: 'Women 25-35 Fashion Lovers',
    delivery: 'ELIGIBLE',
    bid_strategy: 'LOWEST_COST',
    budget: { type: 'DAILY', amount: 75.0, currency: 'USD' },
    results: { value: 67, type: 'PURCHASE' },
    reach: 22350,
    impressions: 62840,
    frequency: 2.81,
    clicks: 4520,
    ctr: 0.0719,
    cpc: 0.35,
    cpm: 25.2,
    spend: 1582.00,
    conversions: 67,
    cvr: 0.0148,
    cpa: 23.61,
    revenue: 2640.00,
    roas: 1.669,
    aov: 39.40,
    ends: null,
    learning: false,
    issues: [],
    hasChildren: true,
  },
  {
    id: 'ads_202',
    status: 'ACTIVE',
    name: 'Lookalike Audience - Purchasers',
    delivery: 'ELIGIBLE',
    bid_strategy: 'LOWEST_COST',
    budget: { type: 'DAILY', amount: 75.0, currency: 'USD' },
    results: { value: 60, type: 'PURCHASE' },
    reach: 19785,
    impressions: 55364,
    frequency: 2.80,
    clicks: 3901,
    ctr: 0.0705,
    cpc: 0.39,
    cpm: 27.6,
    spend: 1538.45,
    conversions: 60,
    cvr: 0.0154,
    cpa: 25.64,
    revenue: 2340.00,
    roas: 1.521,
    aov: 39.00,
    ends: null,
    learning: false,
    issues: [],
    hasChildren: true,
  },
];

const MOCK_ADS: CampaignData[] = [
  {
    id: 'ad_301',
    status: 'ACTIVE',
    name: 'Summer Dress Video',
    delivery: 'ELIGIBLE',
    bid_strategy: 'LOWEST_COST',
    budget: { type: 'DAILY', amount: 25.0, currency: 'USD' },
    results: { value: 34, type: 'PURCHASE' },
    reach: 12450,
    impressions: 28640,
    frequency: 2.30,
    clicks: 2100,
    ctr: 0.0733,
    cpc: 0.30,
    cpm: 21.8,
    spend: 624.00,
    conversions: 34,
    cvr: 0.0162,
    cpa: 18.35,
    revenue: 1326.00,
    roas: 2.125,
    aov: 39.00,
    ends: null,
    learning: false,
    issues: [],
    hasChildren: false,
  },
  {
    id: 'ad_302',
    status: 'ACTIVE',
    name: 'Beach Collection Carousel',
    delivery: 'ELIGIBLE',
    bid_strategy: 'LOWEST_COST',
    budget: { type: 'DAILY', amount: 25.0, currency: 'USD' },
    results: { value: 33, type: 'PURCHASE' },
    reach: 9900,
    impressions: 34200,
    frequency: 3.45,
    clicks: 1420,
    ctr: 0.0415,
    cpc: 0.44,
    cpm: 18.2,
    spend: 622.80,
    conversions: 33,
    cvr: 0.0232,
    cpa: 18.87,
    revenue: 1314.00,
    roas: 2.109,
    aov: 39.82,
    ends: null,
    learning: false,
    issues: [],
    ai_decision: { rec: 'PAUSE', confidence: 0.71, why: ['High frequency 3.45', 'CTR declining', 'Creative fatigue'] },
    hasChildren: false,
  },
];

export default function StatisticsPage() {
  const t = useTranslations();
  const [currentLevel, setCurrentLevel] = useState<ViewLevel>('campaign');
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [selectedAdSet, setSelectedAdSet] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showFacebookManager, setShowFacebookManager] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date(),
    },
    status: [],
    objective: [],
    search: '',
    breakdowns: [],
    account: '',
    columnPreset: 'performance',
  });

  const [savedViews] = useState([
    { id: '1', name: 'Активні кампанії', filters: { ...filters, status: ['active'] } },
    { id: '2', name: 'Низька ефективність', filters: { ...filters, status: ['active'] } },
  ]);

  // Load saved config on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('facebook_config');
    if (savedConfig) {
      try {
        setFacebookConfig(JSON.parse(savedConfig));
      } catch (err) {
        console.error('Failed to parse saved Facebook config:', err);
      }
    }
  }, []);

  // Handle Facebook config save
  const handleConfigSave = (config: FacebookConfig) => {
    setFacebookConfig(config);
    localStorage.setItem('facebook_config', JSON.stringify(config));
    setShowConfigDialog(false);
  };

  // Get current data based on level and source
  const getCurrentData = (): CampaignData[] => {
    if (isConfigured) {
      // Use Facebook data if configured
      if (currentLevel === 'campaign') {
        return facebookCampaigns;
      } else if (currentLevel === 'adset') {
        return facebookAdSets;
      } else {
        return facebookAds;
      }
    } else {
      // Fallback to mock data
      if (currentLevel === 'campaign') {
        return MOCK_CAMPAIGNS;
      } else if (currentLevel === 'adset') {
        return MOCK_ADSETS;
      } else {
        return MOCK_ADS;
      }
    }
  };

  // Get loading state
  const isLoading = isConfigured ? 
    (currentLevel === 'campaign' ? campaignsLoading : 
     currentLevel === 'adset' ? adSetsLoading : adsLoading) : 
    loading;

  const handleRowClick = (row: CampaignData) => {
    if (currentLevel === 'campaign') {
      setSelectedCampaign(row.id);
      setCurrentLevel('adset');
    } else if (currentLevel === 'adset') {
      setSelectedAdSet(row.id);
      setCurrentLevel('ad');
    }
  };

  const handleBack = () => {
    if (currentLevel === 'ad') {
      setCurrentLevel('adset');
      setSelectedAdSet(null);
    } else if (currentLevel === 'adset') {
      setCurrentLevel('campaign');
      setSelectedCampaign(null);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedRows.length === 0) {
      toast.error('Оберіть рядки для дії');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const actionLabels = {
        pause: 'призупинено',
        enable: 'активовано',
        duplicate: 'дубльовано',
        edit_budget: 'змінено бюджет',
      };
      
      toast.success(`${selectedRows.length} елементів ${actionLabels[action as keyof typeof actionLabels]}`);
      setSelectedRows([]);
    } catch (error) {
      toast.error('Помилка виконання дії');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    toast.success('Експорт розпочато');
  };

  const handleSaveView = (name: string) => {
    toast.success(`Вигляд "${name}" збережено`);
  };

  const handleLoadView = (viewId: string) => {
    const view = savedViews.find(v => v.id === viewId);
    if (view) {
      setFilters(view.filters);
      toast.success(`Вигляд "${view.name}" завантажено`);
    }
  };

  const renderBreadcrumb = () => (
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink 
          onClick={() => {
            setCurrentLevel('campaign');
            setSelectedCampaign(null);
            setSelectedAdSet(null);
          }}
          className="cursor-pointer hover:text-foreground"
        >
          Кампанії
        </BreadcrumbLink>
      </BreadcrumbItem>
      {selectedCampaign && (
        <>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink 
              onClick={() => {
                setCurrentLevel('adset');
                setSelectedAdSet(null);
              }}
              className="cursor-pointer hover:text-foreground"
            >
              Групи оголошень
            </BreadcrumbLink>
          </BreadcrumbItem>
        </>
      )}
      {selectedAdSet && (
        <>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Оголошення</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      )}
    </BreadcrumbList>
  );

  return (
    <div className="flex gap-6">
      {/* Main content */}
      <div className={cn("space-y-6 transition-all duration-300", showAiPanel ? "flex-1" : "w-full")}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentLevel !== 'campaign' && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gradient-primary">Статистика</h1>
              <Breadcrumb className="mt-1">
                {renderBreadcrumb()}
              </Breadcrumb>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfigDialog(true)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Facebook API
            </Button>
            <Button
              variant={showAiPanel ? "default" : "outline"}
              onClick={() => setShowAiPanel(!showAiPanel)}
              className="gap-2"
            >
              <Zap className="w-4 h-4" />
              ШІ Аналітика
            </Button>
          </div>
        </div>

      {/* Filters */}
      <StatisticsFilters
        filters={filters}
        onFiltersChange={setFilters}
        onExport={handleExport}
        savedViews={savedViews}
        onSaveView={handleSaveView}
        onLoadView={handleLoadView}
      />

      {/* Bulk Actions Bar */}
      {selectedRows.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border">
          <span className="text-sm font-medium">
            Вибрано: {selectedRows.length}
          </span>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleBulkAction('pause')}
              disabled={loading}
            >
              <Pause className="w-4 h-4 mr-2" />
              Призупинити
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleBulkAction('enable')}
              disabled={loading}
            >
              <Play className="w-4 h-4 mr-2" />
              Активувати
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleBulkAction('duplicate')}
              disabled={loading}
            >
              <Copy className="w-4 h-4 mr-2" />
              Дублювати
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleBulkAction('edit_budget')}
              disabled={loading}
            >
              <Edit className="w-4 h-4 mr-2" />
              Змінити бюджет
            </Button>
          </div>
          <div className="flex-1" />
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setSelectedRows([])}
          >
            <X className="w-4 h-4" />
            Скасувати вибір
          </Button>
        </div>
      )}

        {/* AI Insights Banner */}
        <div className="ai-recommendation opportunity animate-fade-in hover-lift">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-green-900 dark:text-green-100">
                ШІ рекомендації готові
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Знайдено 3 можливості для масштабування (+$3,200 потенційного доходу)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right text-xs">
                <div className="font-medium text-green-600">89% довіра</div>
                <div className="text-green-500">Високий пріоритет</div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-green-300 text-green-700 hover:bg-green-50"
                onClick={() => setShowAiPanel(true)}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Переглянути
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Table */}
        <StatisticsTable
          data={getCurrentData()}
          level={currentLevel}
          onRowClick={handleRowClick}
          loading={isLoading}
          selectedRows={selectedRows}
          onRowSelection={setSelectedRows}
        />
        
        {/* Show error if Facebook API fails */}
        {campaignsError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">Помилка завантаження даних з Facebook: {campaignsError}</p>
          </div>
        )}
      </div>

      {/* AI Insights Panel */}
      {showAiPanel && (
        <div className="w-96 animate-slide-right">
          <AiInsightsPanel className="sticky top-6" />
        </div>
      )}

      {/* Facebook Config Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Налаштування Facebook Marketing API</DialogTitle>
          </DialogHeader>
          <FacebookConfigForm 
            onConfigSave={handleConfigSave}
            initialConfig={facebookConfig || undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}