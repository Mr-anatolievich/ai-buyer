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

const OBJECTIVES: { value: CampaignObjective; label: string; description: string }[] = [
  { value: 'Conversions', label: 'Conversions', description: 'Drive actions on your website' },
  { value: 'Traffic', label: 'Traffic', description: 'Send people to your website' },
  { value: 'Engagement', label: 'Engagement', description: 'Get more likes, comments, and shares' },
  { value: 'Leads', label: 'Leads', description: 'Collect leads for your business' },
  { value: 'Brand Awareness', label: 'Brand Awareness', description: 'Increase awareness of your brand' },
];

export function CampaignStep() {
  const { draft, updateCampaignDraft, validateStep } = useAppStore();
  const { campaign } = draft;

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
        <Label htmlFor="campaign-name">Campaign Name *</Label>
        <Input
          id="campaign-name"
          value={campaign.name}
          onChange={(e) => updateCampaignDraft({ name: e.target.value })}
          placeholder="e.g., Summer Collection 2024"
          className={!campaign.name.trim() && !isValid ? 'border-destructive' : ''}
        />
        {!campaign.name.trim() && !isValid && (
          <p className="text-sm text-destructive">Campaign name is required</p>
        )}
      </div>

      {/* Campaign Objective */}
      <div className="space-y-2">
        <Label>Campaign Objective *</Label>
        <Select value={campaign.objective} onValueChange={handleObjectiveChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select campaign objective" />
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
          <h3 className="text-lg font-medium">Budget & Schedule</h3>
          <p className="text-sm text-muted-foreground">Set your campaign budget and schedule</p>
        </div>

        {/* Budget Type */}
        <div className="space-y-2">
          <Label>Budget Type *</Label>
          <Select value={campaign.budgetType} onValueChange={handleBudgetTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily Budget</SelectItem>
              <SelectItem value="lifetime">Lifetime Budget</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Budget Amount */}
        {campaign.budgetType === 'daily' && (
          <div className="space-y-2">
            <Label htmlFor="daily-budget">Daily Budget (USD) *</Label>
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
              <p className="text-sm text-destructive">Daily budget must be greater than 0</p>
            )}
          </div>
        )}

        {campaign.budgetType === 'lifetime' && (
          <div className="space-y-2">
            <Label htmlFor="lifetime-budget">Lifetime Budget (USD) *</Label>
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
            Campaign Budget Optimization (CBO)
          </CardTitle>
          <CardDescription>
            Let Facebook automatically distribute your budget across ad sets to get the best results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable CBO</p>
              <p className="text-sm text-muted-foreground">
                Recommended for most campaigns
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
          Your campaign will be created in <strong>Draft</strong> status. You can review and publish it after completing all steps.
        </AlertDescription>
      </Alert>
    </div>
  );
}