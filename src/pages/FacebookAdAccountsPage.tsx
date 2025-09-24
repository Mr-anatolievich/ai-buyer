import { useState, useEffect } from 'react';
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
  account_status: string;
  currency: string;
  timezone: string;
  business?: string;
  spend_cap: number;
  daily_spend_limit: number;
  amount_spent: number;
  balance: number;
}

interface FacebookAccount {
  id: string;
  name: string;
  facebook_id: string;
  status: string;
  token_status: string;
}

export default function FacebookAdAccountsPage() {
  const t = useTranslations();
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedAdAccounts, setSelectedAdAccounts] = useState<string[]>([]);
  const [multiSelect, setMultiSelect] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  
  // States for dynamic data
  const [facebookAccounts, setFacebookAccounts] = useState<FacebookAccount[]>([]);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load Facebook accounts from API
  const loadFacebookAccounts = async () => {
    setAccountsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/facebook/accounts');
      const result = await response.json();
      
      if (response.ok && result.status === 'success') {
        setFacebookAccounts(result.data);
      } else {
        setError('Помилка завантаження аккаунтів');
      }
    } catch (err) {
      setError('Помилка з\'єднання з сервером');
      console.error('Load accounts error:', err);
    } finally {
      setAccountsLoading(false);
    }
  };

  // Load ad accounts for selected Facebook account
  const loadAdAccounts = async (accountId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/api/facebook/accounts/${accountId}/adaccounts`);
      const result = await response.json();
      
      if (response.ok && result.status === 'success') {
        setAdAccounts(result.data);
      } else {
        // Показуємо детальну інформацію про помилку
        let errorMessage = result.detail || 'Помилка завантаження рекламних кабінетів';
        
        if (result.suggestion) {
          errorMessage += `\n💡 ${result.suggestion}`;
        }
        
        // Додаткові поради для користувача
        if (errorMessage.includes('токен') || errorMessage.includes('token')) {
          errorMessage += '\n\n🔧 Як виправити: Перейдіть в налаштування аккаунта та оновіть токен доступу.';
        } else if (errorMessage.includes('permission') || errorMessage.includes('дозвіл')) {
          errorMessage += '\n\n🔧 Як виправити: Переконайтеся що токен має дозвіл "ads_read".';
        }
        
        setError(errorMessage);
        setAdAccounts([]);
      }
    } catch (err) {
      setError('Помилка з\'єднання з сервером. Перевірте чи працює backend.');
      setAdAccounts([]);
      console.error('Load ad accounts error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Facebook accounts on component mount
  useEffect(() => {
    loadFacebookAccounts();
  }, []);

  // Load ad accounts when account is selected
  useEffect(() => {
    if (selectedAccount) {
      loadAdAccounts(selectedAccount);
    } else {
      setAdAccounts([]);
    }
  }, [selectedAccount]);

  const selectedFacebookAccount = facebookAccounts.find(acc => acc.id === selectedAccount);
  
  const filteredAdAccounts = adAccounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.id.includes(searchTerm);
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(account.account_status);
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-success text-success-foreground">Активен</Badge>;
      case 'DISABLED':
        return <Badge variant="secondary">Відключений</Badge>;
      case 'UNSETTLED':
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

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="text-destructive text-sm whitespace-pre-line">{error}</div>
        </div>
      )}

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
                  {accountsLoading ? (
                    <SelectItem value="loading" disabled>Завантаження...</SelectItem>
                  ) : facebookAccounts.length === 0 ? (
                    <SelectItem value="no-accounts" disabled>Немає доступних аккаунтів</SelectItem>
                  ) : (
                    facebookAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        #{account.id} - {account.name} ({account.facebook_id})
                      </SelectItem>
                    ))
                  )}
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
                <Select value={statusFilter.length === 0 ? "all" : statusFilter.join(',')} onValueChange={(value) => setStatusFilter(value === "all" ? [] : value.split(','))}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Фільтр" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="all">Всі статуси</SelectItem>
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
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Завантаження рекламних кабінетів...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-destructive">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : filteredAdAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {selectedAccount ? 'Немає рекламних кабінетів для цього аккаунта' : 'Оберіть аккаунт для перегляду рекламних кабінетів'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAdAccounts.map((account) => (
                      <TableRow key={account.id} className={account.account_status === 'ACTIVE' ? 'bg-success/5' : ''}>
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
                              {account.business && (
                                <p><strong>БМ:</strong> {account.business}</p>
                              )}
                              <p><strong>Часовий пояс:</strong> {account.timezone}</p>
                              <p><strong>Валюта:</strong> {account.currency}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <p><strong>Витрачено:</strong> {account.amount_spent} {account.currency}</p>
                            <p><strong>Баланс:</strong> {account.balance} {account.currency}</p>
                            {account.spend_cap > 0 && (
                              <p><strong>Ліміт витрат:</strong> {account.spend_cap} {account.currency}</p>
                            )}
                            {account.daily_spend_limit > 0 && (
                              <p><strong>Денний ліміт:</strong> {account.daily_spend_limit} {account.currency}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            Вимк
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="text-xs">
                              Біллінги
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Модерація
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Статус
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(account.account_status)}
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
                    ))
                  )}
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