import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { CampaignObjective, BudgetType } from '@/store/useAppStore';
import { useTranslations } from '@/lib/translations';

export function CampaignStep() {
  const { draft, updateCampaignDraft, validateStep } = useAppStore();
  const { campaign } = draft;
  const t = useTranslations();

  const OBJECTIVES: { value: CampaignObjective; label: string; description: string }[] = [
    { value: 'Conversions', label: 'Конверсії', description: 'Стимулювання дій на вашому веб-сайті' },
    { value: 'Traffic', label: 'Трафік', description: 'Направлення людей на ваш веб-сайт' },
    { value: 'Engagement', label: 'Залученість', description: 'Отримання більше лайків, коментарів та поширень' },
    { value: 'Leads', label: 'Ліди', description: 'Збір лідів для вашого бізнесу' },
    { value: 'Brand Awareness', label: 'Впізнаваність бренду', description: 'Підвищення обізнаності про ваш бренд' },
  ];

  const isValid = validateStep(1);

  const handleObjectiveChange = (value: CampaignObjective) => {
    updateCampaignDraft({ objective: value });
  };

  const handleBudgetTypeChange = (value: BudgetType) => {
    updateCampaignDraft({ budgetType: value });
  };

  return (
    <div className="space-y-6">
      {/* Campaign Name */}
      <div className="space-y-2">
        <Label htmlFor="campaign-name">{t.campaignNameLabel} *</Label>
        <Input
          id="campaign-name"
          value={campaign.name}
          onChange={(e) => updateCampaignDraft({ name: e.target.value })}
          placeholder={t.campaignNamePlaceholder}
          className={!campaign.name.trim() && !isValid ? 'border-destructive' : ''}
        />
        {!campaign.name.trim() && !isValid && (
          <p className="text-sm text-destructive">Назва кампанії є обов'язковою</p>
        )}
      </div>

      {/* Campaign Objective */}
      <div className="space-y-2">
        <Label>{t.objective} *</Label>
        <Select value={campaign.objective} onValueChange={handleObjectiveChange}>
          <SelectTrigger>
            <SelectValue placeholder="Виберіть мету кампанії" />
          </SelectTrigger>
          <SelectContent>
            {OBJECTIVES.map((objective) => (
              <SelectItem key={objective.value} value={objective.value}>
                <div>
                  <div className="font-medium">{objective.label}</div>
                  <div className="text-sm text-muted-foreground">{objective.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Budget Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Бюджет та розклад</h3>
          <p className="text-sm text-muted-foreground">Встановіть бюджет та розклад вашої кампанії</p>
        </div>

        {/* Budget Type */}
        <div className="space-y-2">
          <Label>{t.budgetType} *</Label>
          <Select value={campaign.budgetType} onValueChange={handleBudgetTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">{t.daily} бюджет</SelectItem>
              <SelectItem value="lifetime">{t.lifetime} бюджет</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Budget Amount */}
        {campaign.budgetType === 'daily' && (
          <div className="space-y-2">
            <Label htmlFor="daily-budget">{t.dailyBudget} (USD) *</Label>
            <Input
              id="daily-budget"
              type="number"
              min="1"
              value={campaign.dailyBudget}
              onChange={(e) => updateCampaignDraft({ dailyBudget: Number(e.target.value) })}
              placeholder="50"
              className={campaign.dailyBudget <= 0 && !isValid ? 'border-destructive' : ''}
            />
            {campaign.dailyBudget <= 0 && !isValid && (
              <p className="text-sm text-destructive">Щоденний бюджет повинен бути більше 0</p>
            )}
          </div>
        )}

        {campaign.budgetType === 'lifetime' && (
          <div className="space-y-2">
            <Label htmlFor="lifetime-budget">Довічний бюджет (USD) *</Label>
            <Input
              id="lifetime-budget"
              type="number"
              min="1"
              value={campaign.lifetimeBudget || ''}
              onChange={(e) => updateCampaignDraft({ lifetimeBudget: Number(e.target.value) })}
              placeholder="1000"
            />
          </div>
        )}
      </div>

      <Separator />

      {/* CBO Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4" />
            Оптимізація бюджету кампанії (CBO)
          </CardTitle>
          <CardDescription>
            Дозвольте Facebook автоматично розподіляти ваш бюджет між групами оголошень для отримання найкращих результатів.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Увімкнути CBO</p>
              <p className="text-sm text-muted-foreground">
                Рекомендується для більшості кампаній
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Status Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Ваша кампанія буде створена зі статусом <strong>Чернетка</strong>. Ви можете переглянути та опублікувати її після завершення всіх кроків.
        </AlertDescription>
      </Alert>
    </div>
  );
}