import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Settings, BarChart3 } from 'lucide-react';

const MOCK_ACCOUNTS = [
  {
    id: '1',
    name: 'Main Business Account',
    type: 'Business Manager',
    status: 'Active',
    spend: '$24,680',
    campaigns: 15,
    lastActivity: '2024-01-20'
  },
  {
    id: '2',
    name: 'Secondary Account',
    type: 'Ad Account',
    status: 'Active',
    spend: '$8,420',
    campaigns: 7,
    lastActivity: '2024-01-19'
  }
];

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your advertising accounts and access permissions
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MOCK_ACCOUNTS.map((account) => (
          <Card key={account.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {account.name}
                </CardTitle>
                <Badge variant={account.status === 'Active' ? 'default' : 'secondary'}>
                  {account.status}
                </Badge>
              </div>
              <CardDescription>{account.type}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Total Spend</div>
                  <div className="font-medium text-lg">{account.spend}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Campaigns</div>
                  <div className="font-medium text-lg">{account.campaigns}</div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Last activity: {account.lastActivity}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  View Stats
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}