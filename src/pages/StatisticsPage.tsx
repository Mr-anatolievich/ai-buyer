import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Download, ChevronRight, ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const MOCK_CAMPAIGNS = [
  {
    id: '1',
    name: 'Summer Collection 2024',
    status: 'Active',
    objective: 'Conversions',
    budget: '$500/day',
    spend: '$2,840',
    conversions: 127,
    cpa: '$22.36',
    adSets: 3,
  },
  {
    id: '2',
    name: 'Holiday Promo Campaign',
    status: 'Active',
    objective: 'Traffic',
    budget: '$300/day',
    spend: '$1,963',
    conversions: 89,
    cpa: '$22.06',
    adSets: 2,
  },
];

const MOCK_AD_SETS = [
  {
    id: '1',
    name: 'Women 25-35 Fashion Lovers',
    targeting: 'US, 25-35, Female, Fashion interests',
    budget: '$200/day',
    spend: '$1,240',
    conversions: 67,
    cpa: '$18.51',
    ads: 4,
  },
  {
    id: '2',
    name: 'Lookalike Audience - Purchasers',
    targeting: 'US, 23-45, All genders, Lookalike',
    budget: '$300/day',
    spend: '$1,600',
    conversions: 60,
    cpa: '$26.67',
    ads: 3,
  },
];

const MOCK_ADS = [
  {
    id: '1',
    name: 'Summer Dress Video',
    status: 'Active',
    spend: '$620',
    impressions: '12,450',
    ctr: '2.3%',
    conversions: 34,
    cpa: '$18.24',
  },
  {
    id: '2',  
    name: 'Beach Collection Carousel',
    status: 'Active',
    spend: '$620',
    impressions: '15,230',
    ctr: '1.8%',
    conversions: 33,
    cpa: '$18.79',
  },
];

const CHART_DATA = [
  { date: '2024-01-01', spend: 420, impressions: 8500, clicks: 190, conversions: 12 },
  { date: '2024-01-02', spend: 380, impressions: 7200, clicks: 165, conversions: 8 },
  { date: '2024-01-03', spend: 520, impressions: 9800, clicks: 245, conversions: 18 },
  { date: '2024-01-04', spend: 340, impressions: 6900, clicks: 155, conversions: 11 },
  { date: '2024-01-05', spend: 680, impressions: 12400, clicks: 310, conversions: 25 },
  { date: '2024-01-06', spend: 590, impressions: 11200, clicks: 275, conversions: 22 },
  { date: '2024-01-07', spend: 450, impressions: 8900, clicks: 205, conversions: 15 },
];

const GEO_DATA = [
  { name: 'United States', value: 45, color: '#3b82f6' },
  { name: 'Canada', value: 25, color: '#10b981' },
  { name: 'United Kingdom', value: 20, color: '#f59e0b' },
  { name: 'Australia', value: 10, color: '#ef4444' },
];

type ViewLevel = 'campaigns' | 'adSets' | 'ads';

export default function StatisticsPage() {
  const [currentLevel, setCurrentLevel] = useState<ViewLevel>('campaigns');
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [selectedAdSet, setSelectedAdSet] = useState<string | null>(null);

  const handleDrillDown = (level: ViewLevel, id?: string) => {
    if (level === 'adSets') {
      setSelectedCampaign(id || null);
      setCurrentLevel('adSets');
    } else if (level === 'ads') {
      setSelectedAdSet(id || null);
      setCurrentLevel('ads');
    }
  };

  const handleBack = () => {
    if (currentLevel === 'ads') {
      setCurrentLevel('adSets');
      setSelectedAdSet(null);
    } else if (currentLevel === 'adSets') {
      setCurrentLevel('campaigns');
      setSelectedCampaign(null);
    }
  };

  const renderBreadcrumb = () => (
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink onClick={() => {
          setCurrentLevel('campaigns');
          setSelectedCampaign(null);
          setSelectedAdSet(null);
        }}>
          Campaigns
        </BreadcrumbLink>
      </BreadcrumbItem>
      {selectedCampaign && (
        <>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => {
              setCurrentLevel('adSets');
              setSelectedAdSet(null);
            }}>
              Ad Sets
            </BreadcrumbLink>
          </BreadcrumbItem>
        </>
      )}
      {selectedAdSet && (
        <>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Ads</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      )}
    </BreadcrumbList>
  );

  const renderTable = () => {
    let data, columns;
    
    if (currentLevel === 'campaigns') {
      data = MOCK_CAMPAIGNS;
      columns = ['Campaign Name', 'Status', 'Objective', 'Budget', 'Spend', 'Conversions', 'CPA', ''];
    } else if (currentLevel === 'adSets') {
      data = MOCK_AD_SETS;
      columns = ['Ad Set Name', 'Targeting', 'Budget', 'Spend', 'Conversions', 'CPA', ''];
    } else {
      data = MOCK_ADS;
      columns = ['Ad Name', 'Status', 'Spend', 'Impressions', 'CTR', 'Conversions', 'CPA'];
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col}>{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row: any) => (
            <TableRow 
              key={row.id} 
              className={currentLevel !== 'ads' ? 'cursor-pointer hover:bg-muted/50' : ''}
              onClick={currentLevel !== 'ads' ? () => handleDrillDown(
                currentLevel === 'campaigns' ? 'adSets' : 'ads', 
                row.id
              ) : undefined}
            >
              <TableCell className="font-medium">{row.name}</TableCell>
              {currentLevel === 'campaigns' && (
                <>
                  <TableCell>
                    <Badge variant={row.status === 'Active' ? 'default' : 'secondary'}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.objective}</TableCell>
                  <TableCell>{row.budget}</TableCell>
                </>
              )}
              {currentLevel === 'adSets' && (
                <>
                  <TableCell className="max-w-xs truncate">{row.targeting}</TableCell>
                  <TableCell>{row.budget}</TableCell>
                </>
              )}
              {currentLevel === 'ads' && (
                <TableCell>
                  <Badge variant={row.status === 'Active' ? 'default' : 'secondary'}>
                    {row.status}
                  </Badge>
                </TableCell>
              )}
              <TableCell>{row.spend}</TableCell>
              {currentLevel === 'ads' && <TableCell>{row.impressions}</TableCell>}
              {currentLevel === 'ads' && <TableCell>{row.ctr}</TableCell>}
              <TableCell>{row.conversions}</TableCell>
              <TableCell>{row.cpa}</TableCell>
              {currentLevel !== 'ads' && (
                <TableCell><ChevronRight className="w-4 h-4" /></TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {currentLevel !== 'campaigns' && (
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold">Statistics</h1>
            <Breadcrumb className="mt-1">
              {renderBreadcrumb()}
            </Breadcrumb>
          </div>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
            <CardDescription>Daily spend and conversions over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="spend" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance by Geography</CardTitle>
            <CardDescription>Conversion distribution by country</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={GEO_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {GEO_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {GEO_DATA.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span>{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {currentLevel === 'campaigns' && 'Campaigns Overview'}
            {currentLevel === 'adSets' && 'Ad Sets Performance'}
            {currentLevel === 'ads' && 'Individual Ads Performance'}
          </CardTitle>
          <CardDescription>
            {currentLevel === 'campaigns' && 'Click on campaigns to view ad sets'}
            {currentLevel === 'adSets' && 'Click on ad sets to view individual ads'}
            {currentLevel === 'ads' && 'Detailed performance metrics for each ad'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderTable()}
        </CardContent>
      </Card>
    </div>
  );
}