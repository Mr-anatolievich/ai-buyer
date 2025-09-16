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
  id: string;
  name: string;
  facebookId: string;
  group?: string;
  status: 'active' | 'inactive' | 'banned';
  tokenStatus: 'active' | 'expired' | 'invalid';
  balance?: string;
  dailyLimit?: string;
  cookiesLoaded: boolean;
  primaryCabinet: string;
  primaryCabinetId: string;
  totalCabinets: number;
}

const mockAccounts: FacebookAccount[] = [
  {
    id: '18679684',
    name: 'seesf',
    facebookId: '100084267251976',
    status: 'active',
    tokenStatus: 'active',
    balance: '825300 IDR',
    dailyLimit: '825300 IDR/день',
    cookiesLoaded: true,
    primaryCabinet: 'Yus Supriyadi',
    primaryCabinetId: '429902116796948',
    totalCabinets: 15,
  },
];

export default function FacebookAccountsPage() {
  const t = useTranslations();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Стан для даних з multitoken
  const [newAccountData, setNewAccountData] = useState({
    name: '',
    token: '',
    userAgent: '',
    cookies: '',
    group: 'default',
    proxy: ''
  });

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
      setSelectedAccounts(mockAccounts.map(acc => acc.id));
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
      // Валідація
      if (!newAccountData.name.trim()) {
        alert('Введіть назву акаунта');
        return;
      }
      if (!newAccountData.token.trim()) {
        alert('Введіть токен');
        return;
      }

      // Тут буде API запит для збереження акаунта
      console.log('Збереження акаунта:', newAccountData);
      
      // Показуємо успішне повідомлення
      alert('Акаунт успішно додано!');
      
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
      
      // Перенаправляємо на головну сторінку акаунтів (очищаємо URL від multitoken)
      window.history.pushState({}, '', '/accounts');
      
    } catch (error) {
      console.error('Помилка збереження акаунта:', error);
      alert('Помилка збереження акаунта');
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
                      disabled={!newAccountData.name.trim() || !newAccountData.token.trim()}
                    >
                      Добавить
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
                      checked={selectedAccounts.length === mockAccounts.length}
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
                {mockAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedAccounts.includes(account.id)}
                        onCheckedChange={(checked) => handleSelectAccount(account.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-mono">#{account.id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{account.name} ({account.facebookId})</div>
                        {account.cookiesLoaded && (
                          <Badge variant="secondary" className="text-xs">Куки загружены</Badge>
                        )}
                        <div className="text-sm text-muted-foreground">
                          Основной кабинет: <strong>{account.primaryCabinet}</strong>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <strong>({account.primaryCabinetId})</strong>{' '}
                          <Badge variant="outline" className="text-xs">
                            Все кабинеты ({account.totalCabinets})
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-primary">—</span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {account.balance && <div><strong>Баланс:</strong> {account.balance}</div>}
                        {account.dailyLimit && <div><strong>Лимит:</strong> {account.dailyLimit}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(account.status)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(account.tokenStatus)}
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
                ))}
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