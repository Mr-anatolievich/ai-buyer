import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
  Activity,
  FileText,
  Settings,
  RefreshCw
} from 'lucide-react';

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

export default function AiAnalystPage() {
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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {AI_RECOMMENDATIONS.map((rec) => {
        const campaign = CAMPAIGNS.find(c => c.id === rec.campaignId);
        if (!campaign) return null;

        return (
          <Card key={rec.campaignId} className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base leading-tight">{campaign.name}</CardTitle>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={`${getActionColor(rec.action)} border text-xs`}>
                    {getActionIcon(rec.action)}
                    {rec.action}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">{rec.confidence}%</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="text-center">
                  <div className="text-muted-foreground text-xs">ROAS</div>
                  <div className="font-semibold">{campaign.roas}</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground text-xs">CPA</div>
                  <div className="font-semibold">${campaign.cpa}</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground text-xs">Freq</div>
                  <div className="font-semibold">{campaign.frequency}</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" />
                  Обґрунтування:
                </h4>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  {rec.reasons.slice(0, 2).map((reason, i) => (
                    <li key={i}>• {reason}</li>
                  ))}
                </ul>
              </div>

              {rec.expectedOutcome && (
                <div className="p-2 bg-muted/30 rounded text-xs">
                  <div className="grid grid-cols-2 gap-2 mb-1">
                    <span>Очік. CPA: <strong>${rec.expectedOutcome.cpa}</strong></span>
                    <span>ROAS: <strong>{rec.expectedOutcome.roas}</strong></span>
                  </div>
                  {rec.expectedOutcome.risk && (
                    <div className="text-amber-600 text-xs">⚠️ {rec.expectedOutcome.risk}</div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button size="sm" className="flex-1 text-xs">
                  Виконати
                </Button>
                <Button size="sm" variant="outline" className="px-2">
                  <Eye className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderOverviewStats = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Активні кампанії</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">12</div>
          <p className="text-xs text-muted-foreground">+2 за останній тиждень</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Рекомендацій</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">8</div>
          <p className="text-xs text-muted-foreground">3 високої пріоритетності</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Потенційна економія</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$2,340</div>
          <p className="text-xs text-muted-foreground">При виконанні рекомендацій</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Середня впевненість</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">78%</div>
          <p className="text-xs text-muted-foreground">Базується на ML моделі</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="w-8 h-8 text-primary" />
            ШІ Аналітик Рішень
          </h1>
          <p className="text-muted-foreground">
            Автоматичні рекомендації для масштабування, дублювання та оптимізації кампаній
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-1" />
            Налаштування
          </Button>
          <Button size="sm">
            <RefreshCw className="w-4 h-4 mr-1" />
            Оновити аналіз
          </Button>
        </div>
      </div>

      {renderOverviewStats()}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="decisions">Рішення по кампаніях</TabsTrigger>
          <TabsTrigger value="anomalies">Аномалії</TabsTrigger>
          <TabsTrigger value="actions">Пріоритетні дії</TabsTrigger>
          <TabsTrigger value="overview">Health Score</TabsTrigger>
        </TabsList>

        <TabsContent value="decisions" className="space-y-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Швидкі рекомендації</h2>
            <Badge variant="secondary">{AI_RECOMMENDATIONS.length} активних</Badge>
          </div>
          {renderDecisionCards()}
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-semibold">Аномалії за 24-72 години</h2>
            <Badge variant="secondary">{ANOMALIES.length} виявлено</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ANOMALIES.map((anomaly) => (
              <Card key={anomaly.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <Badge className={`${getSeverityColor(anomaly.severity)} border text-xs`}>
                      {anomaly.severity}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{anomaly.campaignName}</CardTitle>
                  <CardDescription className="text-xs">{anomaly.timeframe}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium">{anomaly.change}</div>
                  <Button size="sm" variant="outline" className="w-full mt-3">
                    <Eye className="w-3 h-3 mr-1" />
                    Детальніше
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Пріоритетні дії на сьогодні</h2>
            <Badge variant="secondary">{PRIORITY_ACTIONS.length} завдань</Badge>
          </div>
          <div className="space-y-4">
            {PRIORITY_ACTIONS.map((action, index) => (
              <Card key={action.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.impact}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline" className="text-xs">{action.effort}</Badge>
                        <span className="text-sm font-medium text-green-600">{action.expectedLift}</span>
                      </div>
                    </div>
                    <Button>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Загальний Health Score</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Показники ефективності
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Економіка (ROAS/CPA)</span>
                  <div className="flex items-center gap-2">
                    <Progress value={78} className="w-24 h-2" />
                    <span className="text-sm font-medium">78%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Трафік (CTR/CPC)</span>
                  <div className="flex items-center gap-2">
                    <Progress value={65} className="w-24 h-2" />
                    <span className="text-sm font-medium">65%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Аудиторія (Reach/Freq)</span>
                  <div className="flex items-center gap-2">
                    <Progress value={82} className="w-24 h-2" />
                    <span className="text-sm font-medium">82%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Креативи (Fatigue)</span>
                  <div className="flex items-center gap-2">
                    <Progress value={45} className="w-24 h-2" />
                    <span className="text-sm font-medium">45%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Радар ризиків
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Overspend ризик</span>
                  <Badge variant="outline" className="text-green-600">Низький</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Відхил креативів</span>
                  <Badge variant="outline" className="text-yellow-600">Середній</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Частота показів</span>
                  <Badge variant="outline" className="text-red-600">Високий</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Насиченість аудиторії</span>
                  <Badge variant="outline" className="text-yellow-600">Середній</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}