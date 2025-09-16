import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Plus, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Facebook, 
  Copy, 
  Download,
  Trash2,
  Edit3
} from 'lucide-react';

interface FacebookCookie {
  name: string;
  value: string;
  domain: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
}

interface FacebookAccount {
  id: string;
  name: string;
  token: string;
  userAgent: string;
  cookies: FacebookCookie[];
  proxy?: string;
  group?: string;
  status: 'active' | 'inactive' | 'error';
  lastChecked?: string;
  adAccounts?: string[];
}

interface MultiTokenData {
  cookies: FacebookCookie[];
  ua: string;
  token: string;
}

export const FacebookAccountManager: React.FC = () => {
  const [accounts, setAccounts] = useState<FacebookAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('single');
  const [showBulkImport, setShowBulkImport] = useState(false);

  // Single account form
  const [singleAccount, setSingleAccount] = useState({
    name: '',
    multiToken: '',
    proxy: '',
    group: 'no',
    newGroupName: '',
    notes: ''
  });

  // Bulk import form
  const [bulkAccounts, setBulkAccounts] = useState('');
  const [bulkSettings, setBulkSettings] = useState({
    proxyType: 'import',
    namesType: 'import',
    userAgentType: 'import',
    groupType: 'no',
    newGroupName: '',
    cookieType: 'import'
  });

  const [alerts, setAlerts] = useState<Array<{id: string, type: 'success' | 'error', message: string}>>([]);

  // Обробник URL параметрів (для автозаповнення з розширення)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const multitoken = urlParams.get('multitoken');
    
    if (multitoken) {
      try {
        const decoded = JSON.parse(atob(multitoken));
        setSingleAccount(prev => ({
          ...prev,
          multiToken: multitoken,
          name: `Facebook Account ${Date.now()}`
        }));
        setActiveTab('single');
        
        addAlert('success', '🎉 Мультитокен автоматично завантажено з розширення!');
      } catch (error) {
        addAlert('error', 'Помилка декодування мультитокена з URL');
      }
    }
  }, []);

  const addAlert = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setAlerts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 5000);
  };

  // Декодування мультитокена
  const decodeMultiToken = (multiToken: string): MultiTokenData | null => {
    try {
      const decoded = JSON.parse(atob(multiToken));
      if (decoded.token && decoded.cookies && decoded.ua) {
        return decoded;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // Валідація мультитокена
  const validateMultiToken = (multiToken: string): boolean => {
    const decoded = decodeMultiToken(multiToken);
    return decoded !== null && decoded.token.startsWith('EAAB');
  };

  // Додавання одного акаунта
  const handleAddSingleAccount = async () => {
    if (!singleAccount.name || !singleAccount.multiToken) {
      addAlert('error', 'Заповніть всі обов\'язкові поля');
      return;
    }

    if (!validateMultiToken(singleAccount.multiToken)) {
      addAlert('error', 'Невірний формат мультитокена');
      return;
    }

    setIsLoading(true);

    try {
      const decoded = decodeMultiToken(singleAccount.multiToken)!;
      
      const newAccount: FacebookAccount = {
        id: Date.now().toString(),
        name: singleAccount.name,
        token: decoded.token,
        userAgent: decoded.ua,
        cookies: decoded.cookies,
        proxy: singleAccount.proxy || undefined,
        group: singleAccount.group === 'new' ? singleAccount.newGroupName : 
               singleAccount.group === 'no' ? undefined : singleAccount.group,
        status: 'active',
        lastChecked: new Date().toISOString()
      };

      // Відправка на бекенд
      const response = await fetch('/api/facebook/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAccount)
      });

      if (response.ok) {
        const savedAccount = await response.json();
        setAccounts(prev => [...prev, savedAccount]);
        
        // Очистка форми
        setSingleAccount({
          name: '',
          multiToken: '',
          proxy: '',
          group: 'no',
          newGroupName: '',
          notes: ''
        });

        addAlert('success', `Акаунт "${singleAccount.name}" успішно додано!`);
      } else {
        const error = await response.json();
        addAlert('error', `Помилка додавання акаунта: ${error.message}`);
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Невідома помилка';
      addAlert('error', `Помилка: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Масове додавання акаунтів
  const handleBulkImport = async () => {
    if (!bulkAccounts.trim()) {
      addAlert('error', 'Введіть дані для імпорту');
      return;
    }

    setIsLoading(true);

    try {
      const lines = bulkAccounts.trim().split('\n');
      const newAccounts: FacebookAccount[] = [];

      for (const line of lines) {
        const parts = line.split('|');
        if (parts.length < 1) continue;

        const multiToken = parts[0].trim();
        const proxy = parts[1]?.trim();
        const name = parts[2]?.trim() || `Account ${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const notes = parts[3]?.trim();

        if (!validateMultiToken(multiToken)) {
          addAlert('error', `Невірний мультитокен в рядку: ${line.substring(0, 50)}...`);
          continue;
        }

        const decoded = decodeMultiToken(multiToken)!;
        
        const account: FacebookAccount = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          name,
          token: decoded.token,
          userAgent: decoded.ua,
          cookies: decoded.cookies,
          proxy: proxy || undefined,
          group: bulkSettings.groupType === 'new' ? bulkSettings.newGroupName : undefined,
          status: 'active',
          lastChecked: new Date().toISOString()
        };

        newAccounts.push(account);
      }

      if (newAccounts.length > 0) {
        // Відправка на бекенд
        const response = await fetch('/api/facebook/accounts/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accounts: newAccounts })
        });

        if (response.ok) {
          const savedAccounts = await response.json();
          setAccounts(prev => [...prev, ...savedAccounts]);
          
          setBulkAccounts('');
          addAlert('success', `Успішно додано ${newAccounts.length} акаунтів!`);
        } else {
          const error = await response.json();
          addAlert('error', `Помилка масового додавання: ${error.message}`);
        }
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Невідома помилка';
      addAlert('error', `Помилка: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Перевірка статусу акаунта
  const checkAccountStatus = async (accountId: string) => {
    try {
      const response = await fetch(`/api/facebook/accounts/${accountId}/status`);
      const status = await response.json();
      
      setAccounts(prev => prev.map(acc => 
        acc.id === accountId 
          ? { ...acc, status: status.isValid ? 'active' : 'error', lastChecked: new Date().toISOString() }
          : acc
      ));
    } catch (error) {
      console.error('Помилка перевірки статусу:', error);
    }
  };

  // Видалення акаунта
  const deleteAccount = async (accountId: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цей акаунт?')) return;

    try {
      const response = await fetch(`/api/facebook/accounts/${accountId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setAccounts(prev => prev.filter(acc => acc.id !== accountId));
        addAlert('success', 'Акаунт видалено');
      } else {
        addAlert('error', 'Помилка видалення акаунта');
      }
    } catch (error) {
      addAlert('error', 'Помилка видалення акаунта');
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {alerts.map(alert => (
        <Alert key={alert.id} className={alert.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {alert.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-600" />
            Управління Facebook акаунтами
          </CardTitle>
          <CardDescription>
            Додавайте Facebook акаунти через мультитокен з браузерного розширення
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Один акаунт</TabsTrigger>
              <TabsTrigger value="bulk">Масовий імпорт</TabsTrigger>
            </TabsList>

            {/* Додавання одного акаунта */}
            <TabsContent value="single" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account-name">Назва акаунта</Label>
                  <Input
                    id="account-name"
                    placeholder="Технічна назва акаунта"
                    value={singleAccount.name}
                    onChange={(e) => setSingleAccount(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proxy">Проксі (опціонально)</Label>
                  <Input
                    id="proxy"
                    placeholder="ip:port:login:pass"
                    value={singleAccount.proxy}
                    onChange={(e) => setSingleAccount(prev => ({ ...prev, proxy: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="multitoken">Мультитокен</Label>
                <Textarea
                  id="multitoken"
                  placeholder="Вставте мультитокен з браузерного розширення..."
                  className="min-h-[100px] font-mono text-sm"
                  value={singleAccount.multiToken}
                  onChange={(e) => setSingleAccount(prev => ({ ...prev, multiToken: e.target.value }))}
                />
                {singleAccount.multiToken && (
                  <div className="flex items-center gap-2">
                    {validateMultiToken(singleAccount.multiToken) ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Валідний мультитокен
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Невалідний мультитокен
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="group">Група</Label>
                  <Select value={singleAccount.group} onValueChange={(value) => setSingleAccount(prev => ({ ...prev, group: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Виберіть групу" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">Без групи</SelectItem>
                      <SelectItem value="new">Нова група</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {singleAccount.group === 'new' && (
                  <div className="space-y-2">
                    <Label htmlFor="new-group">Назва нової групи</Label>
                    <Input
                      id="new-group"
                      placeholder="Назва групи"
                      value={singleAccount.newGroupName}
                      onChange={(e) => setSingleAccount(prev => ({ ...prev, newGroupName: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              <Button 
                onClick={handleAddSingleAccount} 
                disabled={isLoading || !singleAccount.name || !singleAccount.multiToken}
                className="w-full"
              >
                {isLoading ? 'Додаю...' : 'Додати акаунт'}
              </Button>
            </TabsContent>

            {/* Масовий імпорт */}
            <TabsContent value="bulk" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-accounts">Масовий імпорт</Label>
                <Textarea
                  id="bulk-accounts"
                  placeholder="Кожен акаунт з нової стрічки в форматі: мультитокен|проксі|назва|нотатки"
                  className="min-h-[150px] font-mono text-sm"
                  value={bulkAccounts}
                  onChange={(e) => setBulkAccounts(e.target.value)}
                />
                <div className="text-sm text-gray-600">
                  <strong>Формат:</strong> мультитокен|проксі|назва|нотатки
                  <br />
                  <strong>Приклад:</strong> eyJjb29raWVzIjo...|ip:port:login:pass|Мій акаунт|Тестовий акаунт
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Група для всіх акаунтів</Label>
                  <Select value={bulkSettings.groupType} onValueChange={(value) => setBulkSettings(prev => ({ ...prev, groupType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">Без групи</SelectItem>
                      <SelectItem value="new">Нова група</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {bulkSettings.groupType === 'new' && (
                  <div className="space-y-2">
                    <Label>Назва групи</Label>
                    <Input
                      placeholder="Назва групи"
                      value={bulkSettings.newGroupName}
                      onChange={(e) => setBulkSettings(prev => ({ ...prev, newGroupName: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              <Button 
                onClick={handleBulkImport} 
                disabled={isLoading || !bulkAccounts.trim()}
                className="w-full"
              >
                {isLoading ? 'Імпортую...' : 'Імпортувати акаунти'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Список акаунтів */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Додані акаунти ({accounts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium">{account.name}</div>
                      <div className="text-sm text-gray-500">
                        Token: {account.token.substring(0, 20)}...
                      </div>
                      {account.group && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {account.group}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={account.status === 'active' ? 'default' : 'destructive'}
                      className={account.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {account.status === 'active' ? 'Активний' : 'Помилка'}
                    </Badge>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => checkAccountStatus(account.id)}
                    >
                      Перевірити
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteAccount(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};