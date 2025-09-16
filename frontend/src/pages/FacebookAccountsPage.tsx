import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, Edit, Trash2, Settings, BarChart3, Users, MessageSquare, MoreVertical } from 'lucide-react';
import { useTranslations } from '@/lib/translations';

interface FacebookAccount {
  id: number;
  name: string;
  facebook_id: string;
  group_name?: string;
  status: 'active' | 'inactive' | 'banned' | 'error';
  token_status: 'active' | 'expired' | 'invalid' | 'unknown';
  balance?: number;
  daily_limit?: number;
  cookies_loaded: boolean;
  primary_cabinet?: string;
  primary_cabinet_id?: string;
  total_cabinets: number;
  created_at: string;
  user_agent: string;
  access_token: string;
}

export default function FacebookAccountsPage() {
  const t = useTranslations();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [accounts, setAccounts] = useState<FacebookAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const API_BASE_URL = 'http://localhost:8001';
  
  // Стан для даних з multitoken
  const [newAccountData, setNewAccountData] = useState({
    name: '',
    token: '',
    userAgent: '',
    cookies: '',
    group: 'default',
    proxy: ''
  });

  // Завантаження акаунтів з API
  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/facebook/accounts`);
      
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      } else {
        console.error('Помилка завантаження акаунтів:', response.status);
        setAccounts([]);
      }
    } catch (error) {
      console.error('Помилка з\'єднання з API:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  // Завантажуємо акаунти при першому завантаженні
  useEffect(() => {
    loadAccounts();
  }, []);

  // Обробка multitoken параметра з URL
  useEffect(() => {
    const multitokenParam = searchParams.get('multitoken');
    if (multitokenParam) {
      try {
        // Декодуємо base64
        const decodedData = JSON.parse(atob(multitokenParam));
        
        // Заповнюємо поля форми
        setNewAccountData(prev => ({
          ...prev,
          token: decodedData.token || '',
          userAgent: decodedData.ua || '',
          cookies: JSON.stringify(decodedData.cookies || [], null, 2),
          name: `Facebook Account ${Date.now()}` // Автоматична назва
        }));
        
        // Автоматично відкриваємо модальне вікно
        setShowAddModal(true);
      } catch (error) {
        console.error('Помилка декодування multitoken:', error);
      }
    }
  }, [searchParams]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAccounts(accounts.map(acc => acc.id.toString()));
    } else {
      setSelectedAccounts([]);
    }
  };

  const handleSelectAccount = (accountId: string, checked: boolean) => {
    if (checked) {
      setSelectedAccounts([...selectedAccounts, accountId]);
    } else {
      setSelectedAccounts(selectedAccounts.filter(id => id !== accountId));
    }
  };

  const handleSaveAccount = async () => {
    try {
      setSaving(true);
      
      // Валідація
      if (!newAccountData.name.trim()) {
        alert('Введіть назву акаунта');
        return;
      }
      if (!newAccountData.token.trim()) {
        alert('Введіть токен');
        return;
      }

      // Створюємо multitoken для API
      const multitokenData = {
        token: newAccountData.token,
        ua: newAccountData.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        cookies: newAccountData.cookies ? JSON.parse(newAccountData.cookies) : [
          { name: 'c_user', value: '123456789', domain: '.facebook.com', path: '/', httpOnly: true },
          { name: 'xs', value: 'session_value', domain: '.facebook.com', path: '/', httpOnly: true },
          { name: 'datr', value: 'fingerprint_value', domain: '.facebook.com', path: '/', httpOnly: true }
        ]
      };

      const multitoken = btoa(JSON.stringify(multitokenData));
      
      // API запит для створення акаунта
      const params = new URLSearchParams({
        name: newAccountData.name,
        multitoken: multitoken,
        group_name: newAccountData.group || 'default'
      });

      if (newAccountData.proxy) {
        params.append('proxy_url', newAccountData.proxy);
      }

      const response = await fetch(`${API_BASE_URL}/api/facebook/accounts/multitoken?${params}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const createdAccount = await response.json();
        console.log('Акаунт створено:', createdAccount);
        
        // Показуємо успішне повідомлення
        alert(`Акаунт "${createdAccount.name}" успішно додано!`);
        
        // Очищаємо форму та закриваємо модальне вікно
        setNewAccountData({
          name: '',
          token: '',
          userAgent: '',
          cookies: '',
          group: 'default',
          proxy: ''
        });
        setShowAddModal(false);
        
        // Перезавантажуємо список акаунтів
        await loadAccounts();
        
        // Перенаправляємо на головну сторінку акаунтів (очищаємо URL від multitoken)
        window.history.pushState({}, '', '/accounts');
      } else {
        const error = await response.json();
        console.error('Помилка API:', error);
        alert(`Помилка: ${error.detail}`);
      }
      
    } catch (error) {
      console.error('Помилка збереження акаунта:', error);
      alert('Помилка збереження акаунта');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Активен</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Неактивен</Badge>;
      case 'banned':
        return <Badge variant="destructive">Заблоковано</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Аккаунти Facebook</h1>
          <p className="text-muted-foreground">Управління Facebook аккаунтами</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="group-filter">Група</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger id="group-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="no">Без группы</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="search">Пошук</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Пошук аккаунтів..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Додати аккаунт
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Новий аккаунт</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="account-name">Название</Label>
                    <Input 
                      id="account-name" 
                      placeholder="Техническое название"
                      value={newAccountData.name}
                      onChange={(e) => setNewAccountData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="token">Токен</Label>
                    <Input 
                      id="token" 
                      placeholder="Токен аккаунта"
                      value={newAccountData.token}
                      onChange={(e) => setNewAccountData(prev => ({ ...prev, token: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="useragent">UserAgent</Label>
                    <Input 
                      id="useragent"
                      value={newAccountData.userAgent}
                      onChange={(e) => setNewAccountData(prev => ({ ...prev, userAgent: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="proxy">Прокси</Label>
                    <Input 
                      id="proxy" 
                      placeholder="http://user:pass@ip:port"
                      value={newAccountData.proxy}
                      onChange={(e) => setNewAccountData(prev => ({ ...prev, proxy: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="group">Группа</Label>
                    <Select 
                      value={newAccountData.group} 
                      onValueChange={(value) => setNewAccountData(prev => ({ ...prev, group: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите группу" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Без группы</SelectItem>
                        <SelectItem value="test">Тестовая группа</SelectItem>
                        <SelectItem value="main">Основная группа</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cookies">Cookie</Label>
                    <Textarea 
                      id="cookies" 
                      placeholder="Cookie в формате JSON"
                      value={newAccountData.cookies}
                      onChange={(e) => setNewAccountData(prev => ({ ...prev, cookies: e.target.value }))}
                      className="min-h-[100px] font-mono text-sm"
                    />
                  </div>
                  
                  {/* Auto-clean comments */}
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="comments-status" />
                      <Label htmlFor="comments-status">Авточистка комментариев</Label>
                    </div>
                  </div>
                  
                  {/* Notifications */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium">Настройки уведомлений</h4>
                    <div className="grid gap-2">
                      <div className="flex items-center space-x-2">
                        <Switch id="billing-ntf" />
                        <Label htmlFor="billing-ntf">Уведомления о биллингах</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="moderation-ntf" />
                        <Label htmlFor="moderation-ntf">Уведомления о модерации</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="status-ntf" defaultChecked />
                        <Label htmlFor="status-ntf">Уведомления о статусе кабинета</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      className="flex-1"
                      onClick={handleSaveAccount}
                      disabled={saving || !newAccountData.name.trim() || !newAccountData.token.trim()}
                    >
                      {saving ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          <span>Збереження...</span>
                        </div>
                      ) : (
                        'Добавить'
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAddModal(false);
                        // Очищаємо URL від multitoken при закритті
                        if (searchParams.get('multitoken')) {
                          window.history.pushState({}, '', '/accounts');
                        }
                      }}
                    >
                      Закрыть
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Список аккаунтів</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedAccounts.length === accounts.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Аккаунт</TableHead>
                  <TableHead>Группа</TableHead>
                  <TableHead>Финансы</TableHead>
                  <TableHead>Статус кабинета</TableHead>
                  <TableHead>Статус токена</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span>Завантаження акаунтів...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : accounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Акаунтів поки немає</p>
                        <p className="text-sm">Додайте перший акаунт, натиснувши кнопку "Додати аккаунт"</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  accounts.map((account) => (
                    <TableRow key={account.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedAccounts.includes(account.id.toString())}
                        onCheckedChange={(checked) => handleSelectAccount(account.id.toString(), checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-mono">#{account.id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{account.name} ({account.facebook_id})</div>
                        {account.cookies_loaded && (
                          <Badge variant="secondary" className="text-xs">Куки загружены</Badge>
                        )}
                        <div className="text-sm text-muted-foreground">
                          Основной кабинет: <strong>{account.primary_cabinet || 'Не указан'}</strong>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <strong>({account.primary_cabinet_id || 'N/A'})</strong>{' '}
                          <Badge variant="outline" className="text-xs">
                            Все кабинеты ({account.total_cabinets})
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-primary">{account.group_name || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {account.balance && <div><strong>Баланс:</strong> {account.balance}</div>}
                        {account.daily_limit && <div><strong>Лимит:</strong> {account.daily_limit}</div>}
                        {!account.balance && !account.daily_limit && <span className="text-muted-foreground">Не указано</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(account.status)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(account.token_status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Settings className="h-4 w-4 mr-2" />
                              Управление
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="h-4 w-4 mr-2" />
                              Страницы
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Статистика
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Комментарии
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Bulk Actions */}
          {selectedAccounts.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Выбрано аккаунтов: {selectedAccounts.length}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>Действия</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Создать БМ</DropdownMenuItem>
                    <DropdownMenuItem>Создать страницу</DropdownMenuItem>
                    <DropdownMenuItem>Переместить в группу</DropdownMenuItem>
                    <DropdownMenuItem>Сменить прокси</DropdownMenuItem>
                    <DropdownMenuItem>Включить ПРОФ режим</DropdownMenuItem>
                    <DropdownMenuItem>Выключить ПРОФ режим</DropdownMenuItem>
                    <DropdownMenuItem>Автоправила</DropdownMenuItem>
                    <DropdownMenuItem>Уведомления</DropdownMenuItem>
                    <DropdownMenuItem>Авточистка комментариев</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      Удалить выбранные
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}