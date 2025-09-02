import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  TrendingUp, 
  TrendingDown, 
  Pause, 
  Play, 
  Copy, 
  X, 
  AlertTriangle, 
  Target, 
  Eye,
  ChevronRight,
  Zap,
  Shield,
  BarChart3,
  Users,
  Lightbulb,
  DollarSign,
  MousePointer,
  Activity
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface CampaignData {
  id: string;
  name: string;
  status: 'active' | 'paused';
  spend: number;
  roas: number;
  cpa: number;
  ctr: number;
  frequency: number;
  conversions: number;
  targetCPA: number;
  targetROAS: number;
  trend7d: 'up' | 'down' | 'stable';
}

interface AIRecommendation {
  campaignId: string;
  action: 'SCALE' | 'DUPLICATE' | 'PAUSE' | 'CLOSE';
  confidence: number;
  budgetChange?: number;
  reasons: string[];
  expectedOutcome: {
    cpa: number;
    roas: number;
    risk: string;
  };
  guardrails: string[];
}

interface Anomaly {
  id: string;
  type: 'spend_spike' | 'ctr_drop' | 'cpa_rise' | 'saturation';
  campaignName: string;
  severity: 'low' | 'medium' | 'high';
  change: string;
  timeframe: string;
}

// Mock data
const CAMPAIGNS: CampaignData[] = [
  {
    id: 'cmp_1',
    name: 'Summer Collection 2024',
    status: 'active',
    spend: 2450,
    roas: 1.45,
    cpa: 12.3,
    ctr: 2.1,
    frequency: 2.3,
    conversions: 198,
    targetCPA: 15,
    targetROAS: 1.3,
    trend7d: 'up'
  },
  {
    id: 'cmp_2', 
    name: 'Winter Sale Promo',
    status: 'active',
    spend: 1890,
    roas: 0.85,
    cpa: 18.7,
    ctr: 1.4,
    frequency: 4.2,
    conversions: 101,
    targetCPA: 15,
    targetROAS: 1.2,
    trend7d: 'down'
  },
  {
    id: 'cmp_3',
    name: 'Brand Awareness Q4',
    status: 'active', 
    spend: 3200,
    roas: 2.1,
    cpa: 8.9,
    ctr: 3.2,
    frequency: 1.8,
    conversions: 359,
    targetCPA: 12,
    targetROAS: 1.8,
    trend7d: 'stable'
  }
];

const AI_RECOMMENDATIONS: AIRecommendation[] = [
  {
    campaignId: 'cmp_1',
    action: 'SCALE',
    confidence: 78,
    budgetChange: 0.25,
    reasons: [
      'ROAS 1.45 ≥ 1.30 (D7)',
      'Frequency 2.3 < 3.5 (no saturation)', 
      'CTR +12% WoW; CPA -9% WoW'
    ],
    expectedOutcome: {
      cpa: 11.8,
      roas: 1.52,
      risk: 'Можлива втома креативу за 3-5 днів'
    },
    guardrails: ['auto-rollback if CPA +15% within 24h']
  },
  {
    campaignId: 'cmp_2',
    action: 'PAUSE',
    confidence: 85,
    reasons: [
      'CPA 18.7 > 15.0 × 1.2 (2 дні поспіль)',
      'ROAS 0.85 < порога 1.0',
      'Frequency 4.2 > 3.5 (saturation)'
    ],
    expectedOutcome: {
      cpa: 0,
      roas: 0,
      risk: 'Збереження бюджету для сильніших груп'
    },
    guardrails: ['Review creatives and audience after pause']
  },
  {
    campaignId: 'cmp_3',
    action: 'DUPLICATE',
    confidence: 72,
    reasons: [
      'ROAS 2.1 > цільового 1.8',
      'Low frequency 1.8 < 2.5',
      'High conversion volume potential'
    ],
    expectedOutcome: {
      cpa: 9.2,
      roas: 2.0,
      risk: 'Потреба в новій аудиторії для масштабування'
    },
    guardrails: ['Test with 30% of original budget initially']
  }
];

const ANOMALIES: Anomaly[] = [
  {
    id: 'anom_1',
    type: 'spend_spike',
    campaignName: 'Summer Collection 2024',
    severity: 'medium',
    change: '+340% витрат',
    timeframe: 'останні 6 годин'
  },
  {
    id: 'anom_2', 
    type: 'ctr_drop',
    campaignName: 'Winter Sale Promo',
    severity: 'high',
    change: '-45% CTR',
    timeframe: 'останні 24 години'
  },
  {
    id: 'anom_3',
    type: 'saturation',
    campaignName: 'Brand Awareness Q4',
    severity: 'low', 
    change: 'Frequency > 4.0',
    timeframe: 'останні 48 годин'
  }
];

const PRIORITY_ACTIONS = [
  {
    id: 'act_1',
    title: 'Призупинити кампанію Winter Sale',
    impact: 'Висока економія бюджету',
    effort: 'Низькі зусилля',
    expectedLift: '+$890 збережених коштів'
  },
  {
    id: 'act_2', 
    title: 'Масштабувати Summer Collection на +25%',
    impact: 'Приріст конверсій',
    effort: 'Середні зусилля',
    expectedLift: '+18% конверсій'
  },
  {
    id: 'act_3',
    title: 'Дублювати Brand Awareness з новою аудиторією',
    impact: 'Розширення охоплення',
    effort: 'Високі зусилля',
    expectedLift: '+25% нового трафіку'
  }
];

export function AiAnalystDrawer() {
  const { aiAnalystOpen, setAiAnalystOpen } = useAppStore();
  const [activeTab, setActiveTab] = useState('decisions');

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'SCALE': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'DUPLICATE': return <Copy className="w-4 h-4 text-blue-600" />;
      case 'PAUSE': return <Pause className="w-4 h-4 text-yellow-600" />;
      case 'CLOSE': return <X className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'SCALE': return 'bg-green-50 text-green-700 border-green-200';
      case 'DUPLICATE': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PAUSE': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'CLOSE': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const renderDecisionCards = () => (
    <div className="space-y-4">
      {AI_RECOMMENDATIONS.map((rec) => {
        const campaign = CAMPAIGNS.find(c => c.id === rec.campaignId);
        if (!campaign) return null;

        return (
          <Card key={rec.campaignId} className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{campaign.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={`${getActionColor(rec.action)} border`}>
                    {getActionIcon(rec.action)}
                    {rec.action}
                  </Badge>
                  <Badge variant="secondary">{rec.confidence}%</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">ROAS:</span>
                  <div className="font-medium">{campaign.roas}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">CPA:</span>
                  <div className="font-medium">${campaign.cpa}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Freq:</span>
                  <div className="font-medium">{campaign.frequency}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" />
                  Чому саме так:
                </h4>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  {rec.reasons.map((reason, i) => (
                    <li key={i}>• {reason}</li>
                  ))}
                </ul>
              </div>

              {rec.expectedOutcome && (
                <div className="p-2 bg-muted/50 rounded text-xs">
                  <div className="flex items-center gap-4">
                    <span>Очікуваний CPA: <strong>${rec.expectedOutcome.cpa}</strong></span>
                    <span>ROAS: <strong>{rec.expectedOutcome.roas}</strong></span>
                  </div>
                  {rec.expectedOutcome.risk && (
                    <div className="mt-1 text-amber-600">⚠️ {rec.expectedOutcome.risk}</div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  Виконати рекомендацію
                </Button>
                <Button size="sm" variant="outline">
                  <Eye className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderAnomalies = () => (
    <div className="space-y-3">
      {ANOMALIES.map((anomaly) => (
        <Card key={anomaly.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <div>
                <div className="font-medium text-sm">{anomaly.campaignName}</div>
                <div className="text-xs text-muted-foreground">{anomaly.timeframe}</div>
              </div>
            </div>
            <div className="text-right">
              <Badge className={`${getSeverityColor(anomaly.severity)} border text-xs`}>
                {anomaly.severity}
              </Badge>
              <div className="text-xs font-medium mt-1">{anomaly.change}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderPriorityActions = () => (
    <div className="space-y-3">
      {PRIORITY_ACTIONS.map((action, index) => (
        <Card key={action.id} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              {index + 1}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{action.title}</div>
              <div className="text-xs text-muted-foreground">{action.impact}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-green-600">{action.expectedLift}</div>
              <Button size="sm" className="mt-1">
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-medium">Загальний Health Score</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Економіка (ROAS/CPA)</span>
            <div className="flex items-center gap-2">
              <Progress value={78} className="w-20 h-2" />
              <span className="text-sm font-medium">78%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Трафік (CTR/CPC)</span>
            <div className="flex items-center gap-2">
              <Progress value={65} className="w-20 h-2" />
              <span className="text-sm font-medium">65%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Аудиторія (Reach/Freq)</span>
            <div className="flex items-center gap-2">
              <Progress value={82} className="w-20 h-2" />
              <span className="text-sm font-medium">82%</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-medium">Радар ризиків</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Overspend ризик</span>
            <Badge variant="outline" className="text-green-600">Низький</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Відхил креативів</span>
            <Badge variant="outline" className="text-yellow-600">Середній</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Частота показів</span>
            <Badge variant="outline" className="text-red-600">Високий</Badge>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <Sheet open={aiAnalystOpen} onOpenChange={setAiAnalystOpen}>
      <SheetContent side="right" className="w-[500px] sm:w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            ШІ Аналітик Рішень
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 h-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="decisions" className="text-xs">Рішення</TabsTrigger>
              <TabsTrigger value="anomalies" className="text-xs">Аномалії</TabsTrigger>
              <TabsTrigger value="actions" className="text-xs">Дії</TabsTrigger>
              <TabsTrigger value="overview" className="text-xs">Огляд</TabsTrigger>
            </TabsList>

            <div className="flex-1 mt-4">
              <ScrollArea className="h-full pr-4">
                <TabsContent value="decisions" className="space-y-4 mt-0">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-primary" />
                    <h3 className="font-medium">Швидкі рекомендації</h3>
                  </div>
                  {renderDecisionCards()}
                </TabsContent>

                <TabsContent value="anomalies" className="space-y-4 mt-0">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <h3 className="font-medium">Аномалії за 24-72 год</h3>
                  </div>
                  {renderAnomalies()}
                </TabsContent>

                <TabsContent value="actions" className="space-y-4 mt-0">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-4 h-4 text-primary" />
                    <h3 className="font-medium">Пріоритетні дії</h3>
                  </div>
                  {renderPriorityActions()}
                </TabsContent>

                <TabsContent value="overview" className="space-y-4 mt-0">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <h3 className="font-medium">Загальний огляд</h3>
                  </div>
                  {renderOverview()}
                </TabsContent>
              </ScrollArea>
            </div>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}