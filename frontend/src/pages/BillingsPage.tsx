import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Download, AlertCircle, CheckCircle } from 'lucide-react';

const MOCK_INVOICES = [
  {
    id: 'INV-2024-001',
    date: '2024-01-20',
    amount: '$2,450.00',
    status: 'Paid',
    period: 'Jan 1-20, 2024'
  },
  {
    id: 'INV-2024-002',
    date: '2024-01-05', 
    amount: '$1,890.50',
    status: 'Paid',
    period: 'Dec 21-31, 2023'
  },
  {
    id: 'INV-2024-003',
    date: '2024-01-21',
    amount: '$3,120.75',
    status: 'Pending',
    period: 'Jan 21-31, 2024'
  }
];

export default function BillingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your billing information and payment history
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <CreditCard className="w-4 h-4" />
          Update Payment Method
        </Button>
      </div>

      {/* Current Balance & Usage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">$1,245.50</div>
            <p className="text-sm text-muted-foreground">Available credit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$3,450.80</div>
            <p className="text-sm text-muted-foreground">Total spend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Budget Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>$3,450 / $5,000</span>
              <span>69%</span>
            </div>
            <Progress value={69} />
          </CardContent>
        </Card>
      </div>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Method
          </CardTitle>
          <CardDescription>
            Your default payment method for advertising charges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-gradient-primary rounded flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <div className="font-medium">•••• •••• •••• 4532</div>
                <div className="text-sm text-muted-foreground">Expires 12/2026</div>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              <CheckCircle className="w-3 h-3" />
              Verified
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>
            Your billing history and invoice downloads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {MOCK_INVOICES.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-medium">{invoice.id}</div>
                    <div className="text-sm text-muted-foreground">{invoice.period}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium">{invoice.amount}</div>
                    <div className="text-sm text-muted-foreground">{invoice.date}</div>
                  </div>
                  
                  <Badge 
                    variant={invoice.status === 'Paid' ? 'default' : 'secondary'}
                    className="gap-1"
                  >
                    {invoice.status === 'Paid' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    {invoice.status}
                  </Badge>
                  
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}