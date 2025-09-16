import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatisticsTable } from '@/components/statistics/StatisticsTable';
import { StatisticsFilters } from '@/components/statistics/StatisticsFilters';
import { AiInsightsPanel } from '@/components/statistics/AiInsightsPanel';
import { FacebookAccountManager } from '@/components/facebook/FacebookAccountManager';
import { useTranslations } from '@/lib/translations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Settings, Users, TrendingUp, BarChart3, Facebook } from 'lucide-react';

type ViewLevel = 'campaign' | 'adset' | 'ad';

interface FilterState {
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

// Mock data for development
const mockData = {
  campaigns: [
    {
      id: '1',
      name: 'Summer Sale Campaign',
      status: 'Active',
      budget: 1000,
      spent: 750,
      impressions: 125000,
      clicks: 3250,
      conversions: 45,
      ctr: 2.6,
      cpc: 0.23,
      cpm: 6.0,
      roas: 3.2
    },
    {
      id: '2', 
      name: 'Brand Awareness Q3',
      status: 'Paused',
      budget: 2000,
      spent: 1800,
      impressions: 200000,
      clicks: 4000,
      conversions: 60,
      ctr: 2.0,
      cpc: 0.45,
      cpm: 9.0,
      roas: 2.8
    }
  ]
};

export default function StatisticsPage() {
  const { t } = useTranslations();
  
  // State management
  const [currentLevel, setCurrentLevel] = useState<ViewLevel>('campaign');
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [selectedAdSet, setSelectedAdSet] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
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

  // Mock data for current level
  const getCurrentData = () => {
    switch (currentLevel) {
      case 'campaign':
        return mockData.campaigns;
      case 'adset':
        return []; // Empty for now
      case 'ad':
        return []; // Empty for now
      default:
        return [];
    }
  };

  const handleFiltersChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleRowSelection = (selectedIds: string[]) => {
    setSelectedRows(selectedIds);
  };

  const handleBulkAction = (action: string) => {
    if (selectedRows.length === 0) {
      toast.error(t('statistics.selectRowsFirst'));
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast.success(t('statistics.actionCompleted', { action, count: selectedRows.length }));
      setSelectedRows([]);
      setLoading(false);
    }, 1000);
  };

  const handleAiAnalysis = () => {
    if (selectedRows.length === 0) {
      toast.error(t('statistics.selectRowsForAnalysis'));
      return;
    }
    setShowAiPanel(true);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t('statistics.title')}</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowFacebookManager(true)}
            className="flex items-center gap-2"
          >
            <Facebook className="h-4 w-4" />
            {t('statistics.manageFacebookAccounts')}
          </Button>
          <Button
            variant="outline"
            onClick={handleAiAnalysis}
            disabled={selectedRows.length === 0}
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            {t('statistics.aiAnalysis')}
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statistics.totalSpent')}</CardTitle>
            <Badge variant="secondary">
              <BarChart3 className="h-4 w-4" />
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2,550</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statistics.totalImpressions')}</CardTitle>
            <Badge variant="secondary">
              <Users className="h-4 w-4" />
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">325,000</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statistics.averageCTR')}</CardTitle>
            <Badge variant="secondary">
              <TrendingUp className="h-4 w-4" />
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3%</div>
            <p className="text-xs text-muted-foreground">+0.3% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statistics.averageROAS')}</CardTitle>
            <Badge variant="secondary">
              <BarChart3 className="h-4 w-4" />
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.0x</div>
            <p className="text-xs text-muted-foreground">+0.2x from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('statistics.overview')}</TabsTrigger>
          <TabsTrigger value="campaigns">{t('statistics.campaigns')}</TabsTrigger>
          <TabsTrigger value="adsets">{t('statistics.adSets')}</TabsTrigger>
          <TabsTrigger value="ads">{t('statistics.ads')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('statistics.performanceOverview')}</CardTitle>
              <CardDescription>
                {t('statistics.overviewDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {t('statistics.connectFacebookFirst')}
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => setShowFacebookManager(true)}
                >
                  {t('statistics.connectFacebookAccount')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('statistics.campaigns')}</CardTitle>
              <CardDescription>
                {t('statistics.campaignsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StatisticsFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                level="campaign"
              />
              <StatisticsTable
                data={getCurrentData()}
                level="campaign"
                loading={loading}
                selectedRows={selectedRows}
                onRowSelection={handleRowSelection}
                onBulkAction={handleBulkAction}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adsets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('statistics.adSets')}</CardTitle>
              <CardDescription>
                {t('statistics.adSetsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {t('statistics.selectCampaignFirst')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('statistics.ads')}</CardTitle>
              <CardDescription>
                {t('statistics.adsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {t('statistics.selectAdSetFirst')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Facebook Account Manager Dialog */}
      {showFacebookManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t('statistics.facebookAccountManager')}</h3>
                <Button
                  variant="ghost"
                  onClick={() => setShowFacebookManager(false)}
                >
                  ×
                </Button>
              </div>
              <FacebookAccountManager />
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Panel */}
      {showAiPanel && (
        <AiInsightsPanel
          selectedData={getCurrentData().filter(item => selectedRows.includes(item.id))}
          onClose={() => setShowAiPanel(false)}
        />
      )}
    </div>
  );
}