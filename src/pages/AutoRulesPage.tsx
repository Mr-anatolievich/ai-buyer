import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Zap, Plus, TrendingUp, TrendingDown, Pause } from 'lucide-react';

const MOCK_RULES = [
  {
    id: '1',
    name: 'Pause Low Performing Ads',
    description: 'Automatically pause ads with CPA above $30',
    condition: 'CPA > $30 for 3 days',
    action: 'Pause Ad',
    status: 'Active',
    triggered: 5,
    icon: Pause
  },
  {
    id: '2', 
    name: 'Increase Budget for Winners',
    description: 'Increase budget by 20% for high-performing campaigns',
    condition: 'ROAS > 300% for 2 days',
    action: 'Increase Budget +20%',
    status: 'Active',
    triggered: 12,
    icon: TrendingUp
  },
  {
    id: '3',
    name: 'Decrease Budget on High CPA',
    description: 'Reduce budget when cost per acquisition is too high',
    condition: 'CPA > $25 for 24 hours',
    action: 'Decrease Budget -15%',
    status: 'Inactive',
    triggered: 0,
    icon: TrendingDown
  }
];

export default function AutoRulesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Auto Rules</h1>
          <p className="text-muted-foreground mt-1">
            Automate your campaign optimization with custom rules
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {MOCK_RULES.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <rule.icon className="w-5 h-5" />
                  {rule.name}
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Badge variant={rule.status === 'Active' ? 'default' : 'secondary'}>
                    {rule.status}
                  </Badge>
                  <Switch defaultChecked={rule.status === 'Active'} />
                </div>
              </div>
              <CardDescription>{rule.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Condition</div>
                  <div className="font-medium">{rule.condition}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Action</div>
                  <div className="font-medium">{rule.action}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Times Triggered</div>
                  <div className="font-medium">{rule.triggered}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Edit Rule
                </Button>
                <Button variant="outline" size="sm">
                  View History
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Rule Templates
          </CardTitle>
          <CardDescription>
            Quick start with proven automation rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              'Pause high CPA campaigns',
              'Scale successful ad sets',
              'Activate backup ads'
            ].map((template) => (
              <Button key={template} variant="outline" className="h-auto p-4">
                <div className="text-center">
                  <Zap className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">{template}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}