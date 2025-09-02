import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOCK_STATS = [
  {
    title: 'Total Spend',
    value: '$12,426',
    change: '+12.3%',
    trend: 'up' as const,
    icon: DollarSign,
  },
  {
    title: 'Conversions',
    value: '1,847',
    change: '+8.7%',
    trend: 'up' as const,
    icon: TrendingUp,
  },
  {
    title: 'Reach',
    value: '47.2K',
    change: '-2.1%',
    trend: 'down' as const,
    icon: Users,
  },
  {
    title: 'Active Campaigns',
    value: '23',
    change: '+3',
    trend: 'up' as const,
    icon: BarChart3,
  },
];

const RECENT_CAMPAIGNS = [
  {
    id: '1',
    name: 'Summer Collection 2024',
    status: 'Active',
    spend: '$2,840',
    conversions: 127,
    cpa: '$22.36',
  },
  {
    id: '2',
    name: 'Holiday Promo Campaign',
    status: 'Active',
    spend: '$1,963',
    conversions: 89,
    cpa: '$22.06',
  },
  {
    id: '3',
    name: 'Brand Awareness Q4',
    status: 'Paused',
    spend: '$4,521',
    conversions: 203,
    cpa: '$22.27',
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's your advertising performance overview.
          </p>
        </div>
        <Button onClick={() => navigate('/autoupload')} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Campaign
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_STATS.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 text-sm mt-1">
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 text-success" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-destructive" />
                )}
                <span className={stat.trend === 'up' ? 'text-success' : 'text-destructive'}>
                  {stat.change}
                </span>
                <span className="text-muted-foreground">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
            <CardDescription>Your latest advertising campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {RECENT_CAMPAIGNS.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{campaign.name}</h4>
                      <Badge variant={campaign.status === 'Active' ? 'default' : 'secondary'}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {campaign.conversions} conversions • CPA: {campaign.cpa}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{campaign.spend}</div>
                    <div className="text-sm text-muted-foreground">spent</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Key metrics for this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Budget Utilization</span>
                <span>74%</span>
              </div>
              <Progress value={74} className="h-2" />
            </div>
            
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Conversion Rate</span>
                <span>3.2%</span>
              </div>
              <Progress value={32} className="h-2" />
            </div>
            
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Click-through Rate</span>
                <span>1.8%</span>
              </div>
              <Progress value={18} className="h-2" />
            </div>

            <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/statistics')}>
              View Detailed Statistics
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}