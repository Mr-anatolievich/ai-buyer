import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslations } from '@/lib/translations';
import { MoreHorizontal, Search, Filter, CreditCard, TrendingUp, DollarSign, Calendar, AlertTriangle } from 'lucide-react';

interface AdAccount {
  id: string;
  name: string;
  accountId: string;
  businessManager?: string;
  timezone: string;
  currency: string;
  country: string;
  totalSpent: number;
  billingAmount: number;
  billingLimit: number;
  dailyLimit?: number;
  spendLimit?: number;
  hasCard: boolean;
  cardType?: string;
  cardLast4?: string;
  status: 'active' | 'disabled' | 'risk_payment' | 'unsettled';
  nextBillingDate: string;
  autoComments: boolean;
  notifications: {
    billings: boolean;
    moderation: boolean;
    status: boolean;
  };
}

interface FacebookAccount {
  id: string;
  name: string;
  username: string;
}

const mockFacebookAccounts: FacebookAccount[] = [
  { id: '18679684', name: 'seesf', username: 'Yus Supriyadi' },
  { id: '12345678', name: 'Test Account', username: 'Test User' },
];

const mockAdAccounts: AdAccount[] = [
  {
    id: '429902116796948',
    name: 'Yus Supriyadi',
    accountId: '18679684',
    timezone: 'Asia/Ho_Chi_Minh',
    currency: 'IDR',
    country: 'ID',
    totalSpent: 0,
    billingAmount: 0,
    billingLimit: 0,
    dailyLimit: 825300,
    hasCard: false,
    status: 'active',
    nextBillingDate: '2025-09-17',
    autoComments: false,
    notifications: { billings: false, moderation: false, status: true }
  },
  {
    id: '593095547230149',
    name: 'ADS-Yarmo +3 13',
    accountId: '18679684',
    businessManager: 'ไตรพิมพ์ BM (4108679449402553)',
    timezone: 'Europe/Sofia',
    currency: 'USD',
    country: 'US',
    totalSpent: 16.06,
    billingAmount: 1.9,
    billingLimit: 5,
    dailyLimit: 250,
    spendLimit: 15.98,
    hasCard: true,
    cardType: 'VISA',
    cardLast4: '3314',
    status: 'active',
    nextBillingDate: '2025-09-21',
    autoComments: false,
    notifications: { billings: false, moderation: false, status: true }
  },
  {
    id: '2222150628302039',  
    name: 'ADS-Yarmo +3 3',
    accountId: '18679684',
    businessManager: 'ไตรพิมพ์ BM (4108679449402553)',
    timezone: 'Asia/Kuwait',
    currency: 'USD',
    country: 'US',
    totalSpent: 4528.1,
    billingAmount: 44.49,
    billingLimit: 231,
    hasCard: true,
    cardType: 'Mastercard',
    cardLast4: '1466',
    status: 'active',
    nextBillingDate: '2025-10-14',
    autoComments: false,
    notifications: { billings: false, moderation: false, status: true }
  },
  {
    id: '658099930640807',
    name: 'ADS-Yarmo +3 6',
    accountId: '18679684',
    businessManager: 'ไตรพิมพ์ BM (4108679449402553)',
    timezone: 'Europe/Chisinau',
    currency: 'USD',
    country: 'US',
    totalSpent: 0,
    billingAmount: 0,
    billingLimit: 170,
    spendLimit: 1,
    hasCard: false,
    status: 'risk_payment',
    nextBillingDate: '2025-09-28',
    autoComments: false,
    notifications: { billings: false, moderation: false, status: true }
  }
];

export default function FacebookAdAccountsPage() {
  const t = useTranslations();
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedAdAccounts, setSelectedAdAccounts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const selectedFacebookAccount = mockFacebookAccounts.find(acc => acc.id === selectedAccount);
  const adAccounts = selectedAccount ? mockAdAccounts.filter(acc => acc.accountId === selectedAccount) : [];
  
  const filteredAdAccounts = adAccounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.id.includes(searchTerm);
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(account.status);
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success text-success-foreground">Активен</Badge>;
      case 'disabled':
        return <Badge variant="secondary">Відключений</Badge>;
      case 'risk_payment':
        return <Badge className="bg-warning text-warning-foreground">RISK_PAYMENT</Badge>;
      case 'unsettled':
        return <Badge className="bg-destructive text-destructive-foreground">UNSETTLED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const toggleAdAccountSelection = (adAccountId: string) => {
    setSelectedAdAccounts(prev => 
      prev.includes(adAccountId) 
        ? prev.filter(id => id !== adAccountId)
        : [...prev, adAccountId]
    );
  };

  const selectAllAdAccounts = () => {
    if (selectedAdAccounts.length === filteredAdAccounts.length) {
      setSelectedAdAccounts([]);
    } else {
      setSelectedAdAccounts(filteredAdAccounts.map(acc => acc.id));
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t.adAccounts}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Налаштування вибору акаунта
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="multiselect"
              checked={multiSelect}
              onCheckedChange={setMultiSelect}
            />
            <Label htmlFor="multiselect">Мультивибір</Label>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="account-select">Виберіть акаунт</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger id="account-select" className="w-full">
                  <SelectValue placeholder="Оберіть акаунт..." />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {mockFacebookAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      #{account.id} - {account.name} ({account.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAccount && (
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm">
                  Створити БМ
                </Button>
                <Button variant="outline" size="sm">
                  Управління БМами
                </Button>
                <Button variant="outline" size="sm">
                  Сторінки акаунта
                </Button>
                {multiSelect && (
                  <Button 
                    variant="default" 
                    size="sm"
                    disabled={selectedAdAccounts.length === 0}
                  >
                    Застосувати ({selectedAdAccounts.length})
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedAccount && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Рекламні кабінети - {selectedFacebookAccount?.name}
              </CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Пошук..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={statusFilter.join(',')} onValueChange={(value) => setStatusFilter(value ? value.split(',') : [])}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Фільтр" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="">Всі статуси</SelectItem>
                    <SelectItem value="active">Активні</SelectItem>
                    <SelectItem value="risk_payment">RISK_PAYMENT</SelectItem>
                    <SelectItem value="disabled">Відключені</SelectItem>
                    <SelectItem value="unsettled">UNSETTLED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedAdAccounts.length === filteredAdAccounts.length && filteredAdAccounts.length > 0}
                        onCheckedChange={selectAllAdAccounts}
                      />
                    </TableHead>
                    <TableHead>Кабінет</TableHead>
                    <TableHead>Фінанси</TableHead>
                    <TableHead className="text-center">Автокоментарі</TableHead>
                    <TableHead className="text-center">Сповіщення</TableHead>
                    <TableHead className="text-center">Статус кабінету</TableHead>
                    <TableHead className="text-center">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdAccounts.map((account) => (
                    <TableRow key={account.id} className={account.status === 'active' ? 'bg-success/5' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selectedAdAccounts.includes(account.id)}
                          onCheckedChange={() => toggleAdAccountSelection(account.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <h6 className="font-medium">{account.name}</h6>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p><strong>ID:</strong> {account.id}</p>
                            {account.businessManager && (
                              <p><strong>БМ:</strong> {account.businessManager}</p>
                            )}
                            <p><strong>Часовий пояс:</strong> {account.timezone}</p>
                            <p><strong>Валюта:</strong> {account.currency}</p>
                            <p><strong>Країна:</strong> {account.country}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          {account.billingAmount > 0 && (
                            <p><strong>Біллінг:</strong> {account.billingAmount}/{account.billingLimit} {account.currency}</p>
                          )}
                          <p><strong>Витрачено всього:</strong> {account.totalSpent} {account.currency}</p>
                          <p><strong>Дата списання:</strong> {account.nextBillingDate}</p>
                          {account.dailyLimit && (
                            <p><strong>Ліміт:</strong> {account.spendLimit ? `${account.spendLimit} з ` : ''}{account.dailyLimit} {account.currency}/день</p>
                          )}
                          <p><strong>Карта:</strong> {account.hasCard ? `${account.cardType} *${account.cardLast4}` : 'Немає'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={account.autoComments ? "default" : "outline"}>
                          {account.autoComments ? 'Увімк' : 'Вимк'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col gap-1">
                          <Badge variant={account.notifications.billings ? "default" : "outline"} className="text-xs">
                            Біллінги
                          </Badge>
                          <Badge variant={account.notifications.moderation ? "default" : "outline"} className="text-xs">
                            Модерація
                          </Badge>
                          <Badge variant={account.notifications.status ? "default" : "outline"} className="text-xs">
                            Статус
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(account.status)}
                        {account.status === 'risk_payment' && (
                          <div className="mt-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="text-xs">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Подати на розбан
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-background border z-50">
                                <DropdownMenuItem>Через списання</DropdownMenuItem>
                                <DropdownMenuItem>Новий тікет</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-background border z-50">
                            <DropdownMenuItem>
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Статистика
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              Консоль
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <DollarSign className="w-4 h-4 mr-2" />
                              Біллінги
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Видалити
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredAdAccounts.length === 0 && selectedAccount && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Немає рекламних кабінетів для обраного акаунта</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedAccount && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Оберіть акаунт для перегляду рекламних кабінетів</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}