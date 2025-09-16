import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Zap,
  Brain,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SparklineChart, MetricSparkline } from './SparklineChart';
import { PerformanceIndicator, AnimatedProgress } from './PerformanceIndicator';

interface AiInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'optimization' | 'trend';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  confidence: number;
  recommendation: {
    action: string;
    expectedLift: string;
    timeframe: string;
  };
  data?: number[];
}

const MOCK_INSIGHTS: AiInsight[] = [
  {
    id: '1',
    type: 'opportunity',
    priority: 'high',
    title: 'Масштабування топ-кампанії',
    description: 'Кампанія "[UA] Autumn Promo" показує стабільний ROAS 1.59 при низькій частоті показів',
    impact: '+$2,400 очікуваного доходу',
    confidence: 89,
    recommendation: {
      action: 'Збільшити бюджет на 25%',
      expectedLift: '+18% конверсій',
      timeframe: '3-5 днів'
    },
    data: [1.2, 1.3, 1.4, 1.5, 1.59, 1.62, 1.58]
  },
  {
    id: '2',
    type: 'warning',
    priority: 'high',
    title: 'Втома креативу детектована',
    description: 'Ad "Beach Collection Carousel" має зростаючу частоту (3.45) і падаючий CTR',
    impact: 'Ризик втрати $300/день',
    confidence: 76,
    recommendation: {
      action: 'Ротація креативів',
      expectedLift: '+12% CTR',
      timeframe: '1-2 дні'
    },
    data: [2.1, 2.3, 2.8, 3.1, 3.2, 3.4, 3.45]
  },
  {
    id: '3',
    type: 'optimization',
    priority: 'medium',
    title: 'Оптимізація аудиторії',
    description: 'Lookalike аудиторія готова до дублювання з новими інтересами',
    impact: '+$800 потенційного доходу',
    confidence: 72,
    recommendation: {
      action: 'Створити дублікат з розширенням',
      expectedLift: '+25% охоплення',
      timeframe: '5-7 днів'
    },
    data: [0.8, 1.1, 1.2, 1.3, 1.52, 1.48, 1.51]
  },
  {
    id: '4',
    type: 'trend',
    priority: 'low',
    title: 'Сезонний тренд',
    description: 'CPM знижується на 15% через зменшення конкуренції',
    impact: 'Можливість економії $200/день',
    confidence: 68,
    recommendation: {
      action: 'Підвищити ставки для більшого охоплення',
      expectedLift: '+20% impression share',
      timeframe: 'Негайно'
    },
    data: [32, 30, 28, 26, 25, 24, 23]
  }
];

interface AiInsightsPanelProps {
  className?: string;
}

export function AiInsightsPanel({ className }: AiInsightsPanelProps) {
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [selectedInsights, setSelectedInsights] = useState<string[]>([]);

  // Групуємо інсайти за пріоритетом
  const groupedInsights = {
    high: MOCK_INSIGHTS.filter(i => i.priority === 'high'),
    medium: MOCK_INSIGHTS.filter(i => i.priority === 'medium'),
    low: MOCK_INSIGHTS.filter(i => i.priority === 'low'),
  };

  const getInsightIcon = (type: AiInsight['type']) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'optimization':
        return <Target className="w-4 h-4" />;
      case 'trend':
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getInsightColor = (type: AiInsight['type']) => {
    switch (type) {
      case 'opportunity':
        return 'text-green-600';
      case 'warning':
        return 'text-red-600';
      case 'optimization':
        return 'text-blue-600';
      case 'trend':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityBadge = (priority: AiInsight['priority']) => {
    const variants = {
      high: { variant: 'destructive' as const, label: 'Високий' },
      medium: { variant: 'secondary' as const, label: 'Середній' },
      low: { variant: 'outline' as const, label: 'Низький' },
    };
    
    const config = variants[priority];
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  const toggleInsight = (insightId: string) => {
    setExpandedInsight(expandedInsight === insightId ? null : insightId);
  };

  const toggleInsightSelection = (insightId: string) => {
    setSelectedInsights(prev => 
      prev.includes(insightId) 
        ? prev.filter(id => id !== insightId)
        : [...prev, insightId]
    );
  };

  const applySelectedInsights = () => {
    console.log('Applying insights:', selectedInsights);
    // TODO: Implement insight application logic
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header з загальною статистикою */}
      <Card className="gradient-card border-none shadow-colored">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <CardTitle className="text-gradient-primary">ШІ Інсайти</CardTitle>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              {MOCK_INSIGHTS.length} рекомендацій
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Потенційний вплив */}
          <div className="grid grid-cols-2 gap-4">
            <MetricSparkline
              label="Потенційний дохід"
              value="3500"
              format="currency"
              data={[2800, 3000, 3200, 3400, 3500, 3450, 3500]}
              change={12.5}
              className="gradient-card-hover"
            />
            <MetricSparkline
              label="Очікувані конверсії"
              value="89"
              data={[65, 72, 78, 83, 87, 88, 89]}
              change={8.2}
              className="gradient-card-hover"
            />
          </div>

          {/* Прогрес виконання рекомендацій */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Виконано рекомендацій цього тижня</span>
              <span className="font-medium">7 з 12</span>
            </div>
            <AnimatedProgress value={7} max={12} />
          </div>
        </CardContent>
      </Card>

      {/* Інсайти за пріоритетом */}
      {Object.entries(groupedInsights).map(([priority, insights]) => {
        if (insights.length === 0) return null;
        
        return (
          <Card key={priority} className="animate-fade-in">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  priority === 'high' && 'bg-red-500',
                  priority === 'medium' && 'bg-yellow-500',
                  priority === 'low' && 'bg-green-500'
                )} />
                <h3 className="font-medium capitalize">
                  {priority === 'high' ? 'Високий пріоритет' : 
                   priority === 'medium' ? 'Середній пріоритет' : 
                   'Низький пріоритет'}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {insights.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className={cn(
                    'ai-recommendation',
                    insight.type,
                    'transition-all duration-200 cursor-pointer hover-lift',
                    expandedInsight === insight.id && 'ring-1 ring-primary/20'
                  )}
                  onClick={() => toggleInsight(insight.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn('mt-0.5', getInsightColor(insight.type))}>
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{insight.title}</h4>
                          {getPriorityBadge(insight.priority)}
                        </div>
                        <p className="text-xs text-muted-foreground">{insight.description}</p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="font-medium text-primary">{insight.impact}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Довіра:</span>
                            <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${insight.confidence}%` }}
                              />
                            </div>
                            <span className="font-medium">{insight.confidence}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {insight.data && (
                        <SparklineChart
                          data={insight.data}
                          color={insight.type === 'warning' ? 'negative' : 'positive'}
                          width={40}
                          height={16}
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto"
                      >
                        {expandedInsight === insight.id ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Розширена інформація */}
                  {expandedInsight === insight.id && (
                    <div className="mt-4 pt-3 border-t border-border/50 animate-fade-in-up">
                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium text-sm mb-2">Рекомендована дія:</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div className="space-y-1">
                              <span className="text-muted-foreground">Дія:</span>
                              <p className="font-medium">{insight.recommendation.action}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-muted-foreground">Очікуваний результат:</span>
                              <p className="font-medium text-green-600">{insight.recommendation.expectedLift}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-muted-foreground">Термін:</span>
                              <p className="font-medium">{insight.recommendation.timeframe}</p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedInsights.includes(insight.id)}
                              onChange={() => toggleInsightSelection(insight.id)}
                              className="rounded border-gray-300"
                            />
                            Застосувати цю рекомендацію
                          </label>
                          <Button size="sm" variant="outline" className="gap-1">
                            Детальніше
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Панель дій */}
      {selectedInsights.length > 0 && (
        <Card className="border-primary/50 bg-primary/5 animate-scale-in">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="font-medium">
                  Вибрано {selectedInsights.length} рекомендацій
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedInsights([])}
                >
                  Скасувати
                </Button>
                <Button
                  size="sm"
                  onClick={applySelectedInsights}
                  className="gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Застосувати ({selectedInsights.length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}