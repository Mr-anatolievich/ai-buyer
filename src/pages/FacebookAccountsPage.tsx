import { useState, useEffect } from 'react';
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
  facebook_id: string;
  group_name?: string;
  status: 'active' | 'inactive' | 'banned';
  token_status: 'active' | 'expired' | 'invalid';
  balance?: string;
  daily_limit?: string;
  cookies_loaded: boolean;
  primary_cabinet: string;
  primary_cabinet_id: string;
  total_cabinets: number;
}

const mockAccounts: FacebookAccount[] = [
  {
    id: '18679684',
    name: 'seesf',
    facebook_id: '100084267251976',
    status: 'active',
    token_status: 'active',
    balance: '825300 IDR',
    daily_limit: '825300 IDR/день',
    cookies_loaded: true,
    primary_cabinet: 'Yus Supriyadi',
    primary_cabinet_id: '429902116796948',
    total_cabinets: 15,
  },
];

export default function FacebookAccountsPage() {
  const t = useTranslations();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FacebookAccount | null>(null);
  
  // Real accounts from API
  const [realAccounts, setRealAccounts] = useState<FacebookAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  
  // Form data for adding new account
  const [multitoken, setMultitoken] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    token: '',
    userAgent: '',
    cookies: '',
    proxy: '',
    group: ''
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    token: '',
    userAgent: '',
    cookies: '',
    proxy: '',
    group: '',
    facebookId: '',
    status: 'active' as 'active' | 'inactive' | 'banned',
    tokenStatus: 'active' as 'active' | 'expired' | 'invalid'
  });
  const [notificationSettings, setNotificationSettings] = useState({
    autoCleanComments: false,
    billingNotifications: false,
    moderationNotifications: false,
    statusNotifications: true
  });

  // Load accounts from API
  const loadAccounts = async () => {
    setAccountsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/facebook/accounts');
      const result = await response.json();
      
      if (response.ok && result.status === 'success') {
        setRealAccounts(result.data);
      } else {
        console.error('Failed to load accounts:', result);
        // Fall back to mock data if API fails
        setRealAccounts(mockAccounts);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      // Fall back to mock data if API fails
      setRealAccounts(mockAccounts);
    } finally {
      setAccountsLoading(false);
    }
  };

  // Load accounts on component mount
  useEffect(() => {
    loadAccounts();
  }, []);

  // Handle multitoken parsing
  const parseMultitoken = (multitokenString: string) => {
    try {
      // Try to decode as base64 first, then parse JSON
      let decodedData;
      try {
        decodedData = JSON.parse(atob(multitokenString.trim()));
      } catch {
        // If base64 fails, try direct JSON parse
        decodedData = JSON.parse(multitokenString.trim());
      }
      
      // Auto-fill form data
      setFormData(prev => ({
        ...prev,
        token: decodedData.token || '',
        userAgent: decodedData.ua || '',
        cookies: JSON.stringify(decodedData.cookies, null, 2) || ''
      }));
      
      console.log('Multitoken parsed successfully:', decodedData);
    } catch (error) {
      console.error('Error parsing multitoken:', error);
      // Don't show alert for empty strings
      if (multitokenString.trim()) {
        alert('Ошибка при парсинге мультитокена. Проверьте формат данных.');
      }
    }
  };

  // Clear form when modal closes
  const handleModalChange = (open: boolean) => {
    setShowAddModal(open);
    if (!open) {
      // Reset form when closing
      setMultitoken('');
      setFormData({
        name: '',
        token: '',
        userAgent: '',
        cookies: '',
        proxy: '',
        group: ''
      });
      setNotificationSettings({
        autoCleanComments: false,
        billingNotifications: false,
        moderationNotifications: false,
        statusNotifications: true
      });
    }
  };

  // Handle edit modal
  const handleEditModalChange = (open: boolean) => {
    setShowEditModal(open);
    if (!open) {
      setEditingAccount(null);
      setEditFormData({
        name: '',
        token: '',
        userAgent: '',
        cookies: '',
        proxy: '',
        group: '',
        facebookId: '',
        status: 'active',
        tokenStatus: 'active'
      });
    }
  };

  // Open edit modal with account data
  const handleEditAccount = (account: FacebookAccount) => {
    setEditingAccount(account);
    setEditFormData({
      name: account.name,
      token: '', // Don't show token for security
      userAgent: '', // Will be loaded from DB if needed
      cookies: '', // Will be loaded from DB if needed
      proxy: '',
      group: account.group_name || '',
      facebookId: account.facebook_id,
      status: account.status,
      tokenStatus: account.token_status
    });
    setShowEditModal(true);
  };

  // Handle form submission
  const handleAddAccount = async () => {
    if (!formData.name || !formData.token) {
      alert('Пожалуйста, заполните обязательные поля (Название и Токен)');
      return;
    }

    setLoading(true);
    try {
      // Парсимо cookies якщо вони є
      let parsedCookies = null;
      if (formData.cookies) {
        try {
          parsedCookies = JSON.parse(formData.cookies);
        } catch (e) {
          console.warn('Invalid cookies JSON, sending as string');
          parsedCookies = formData.cookies;
        }
      }

      const response = await fetch('http://localhost:8000/api/facebook/accounts/from-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: formData.token,
          name: formData.name,
          group_name: formData.group || null,
          user_agent: formData.userAgent || null,
          cookies: parsedCookies,
          // Додаткові поля
          proxy_id: formData.proxy || null,
          notification_settings: notificationSettings
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('Аккаунт успешно добавлен!');
        handleModalChange(false); // Close modal and reset form
        await loadAccounts(); // Refresh the accounts list
      } else {
        alert(`Ошибка: ${result.detail || result.message || 'Не удалось добавить аккаунт'}`);
      }
    } catch (error) {
      console.error('Error creating account:', error);
      alert('Ошибка сети при создании аккаунта');
    } finally {
      setLoading(false);
    }
  };

  // Handle update account
  const handleUpdateAccount = async () => {
    if (!editingAccount || !editFormData.name) {
      alert('Пожалуйста, заполните обязательные поля');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/facebook/accounts/${editingAccount.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editFormData.name,
          group_name: editFormData.group || null,
          status: editFormData.status,
          token_status: editFormData.tokenStatus,
          // Включаємо токен тільки якщо він був змінений
          ...(editFormData.token && { access_token: editFormData.token }),
          ...(editFormData.userAgent && { user_agent: editFormData.userAgent }),
          ...(editFormData.cookies && { cookies: editFormData.cookies })
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('✅ Аккаунт успешно обновлен!');
        handleEditModalChange(false);
        await loadAccounts(); // Refresh the accounts list
      } else {
        alert(`❌ Ошибка при обновлении:\n\n${result.detail || result.message || 'Не удалось обновить аккаунт'}`);
      }
    } catch (error) {
      console.error('Error updating account:', error);
      alert('❌ Ошибка сети при обновлении аккаунта\n\nПроверьте соединение с интернетом и попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAccounts(realAccounts.map(acc => acc.id));
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

  // Handle account deletion
  const handleDeleteAccount = async (accountId: string, accountName: string) => {
    // Confirm deletion with detailed message
    const confirmed = window.confirm(
      `⚠️ ВНИМАНИЕ: Удаление аккаунта\n\n` +
      `Вы действительно хотите удалить аккаунт:\n` +
      `"${accountName}" (ID: ${accountId})\n\n` +
      `Это действие нельзя отменить!\n` +
      `Все данные аккаунта будут потеряны навсегда.\n\n` +
      `Нажмите "OK" для подтверждения удаления.`
    );
    
    if (!confirmed) {
      return;
    }

    setDeletingAccountId(accountId);
    
    try {
      const response = await fetch(`http://localhost:8000/api/facebook/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Успешно!\n\nАккаунт "${accountName}" был удален из системы.`);
        await loadAccounts(); // Refresh the accounts list
        
        // Remove from selected accounts if it was selected
        setSelectedAccounts(prev => prev.filter(id => id !== accountId));
      } else {
        const result = await response.json();
        alert(`❌ Ошибка при удалении:\n\n${result.detail || result.message || 'Не удалось удалить аккаунт'}`);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('❌ Ошибка сети при удалении аккаунта\n\nПроверьте соединение с интернетом и попробуйте еще раз.');
    } finally {
      setDeletingAccountId(null);
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
            <Dialog open={showAddModal} onOpenChange={handleModalChange}>
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
                  <div className="grid gap-2 p-4 bg-blue-50 rounded-md">
                    <Label htmlFor="multitoken" className="text-blue-700">Мультитокен з розширення</Label>
                    <Textarea 
                      id="multitoken" 
                      placeholder="Скопіюйте та вставте мультитокен з браузерного розширення..." 
                      value={multitoken}
                      onChange={(e) => {
                        const value = e.target.value;
                        setMultitoken(value);
                        if (value.trim()) {
                          parseMultitoken(value);
                        }
                      }}
                      rows={3}
                      className="bg-white"
                    />
                    <p className="text-sm text-blue-600">
                      При вставці мультитокена поля нижче заповняться автоматично
                    </p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 font-medium mb-4">Параметри аккаунта:</p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="account-name">Название *</Label>
                    <Input 
                      id="account-name" 
                      placeholder="Техническое название" 
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="token">Токен *</Label>
                    <Input 
                      id="token" 
                      placeholder="Токен аккаунта" 
                      value={formData.token}
                      onChange={(e) => setFormData(prev => ({...prev, token: e.target.value}))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="useragent">UserAgent</Label>
                    <Input 
                      id="useragent" 
                      value={formData.userAgent}
                      onChange={(e) => setFormData(prev => ({...prev, userAgent: e.target.value}))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="proxy">Прокси</Label>
                    <Select value={formData.proxy} onValueChange={(value) => setFormData(prev => ({...prev, proxy: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите прокси" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Новый прокси</SelectItem>
                        <SelectItem value="existing">Существующий прокси</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="group">Группа</Label>
                    <Select value={formData.group} onValueChange={(value) => setFormData(prev => ({...prev, group: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите группу" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">Без группы</SelectItem>
                        <SelectItem value="new">Новая группа</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cookies">Cookie (автоматически заполнено)</Label>
                    <Textarea 
                      id="cookies" 
                      placeholder="Cookie в формате JSON" 
                      value={formData.cookies}
                      onChange={(e) => setFormData(prev => ({...prev, cookies: e.target.value}))}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                  
                  {/* Auto-clean comments */}
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="comments-status" 
                        checked={notificationSettings.autoCleanComments}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, autoCleanComments: checked}))}
                      />
                      <Label htmlFor="comments-status">Авточистка комментариев</Label>
                    </div>
                  </div>
                  
                  {/* Notifications */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium">Настройки уведомлений</h4>
                    <div className="grid gap-2">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="billing-ntf" 
                          checked={notificationSettings.billingNotifications}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, billingNotifications: checked}))}
                        />
                        <Label htmlFor="billing-ntf">Уведомления о биллингах</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="moderation-ntf" 
                          checked={notificationSettings.moderationNotifications}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, moderationNotifications: checked}))}
                        />
                        <Label htmlFor="moderation-ntf">Уведомления о модерации</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="status-ntf" 
                          checked={notificationSettings.statusNotifications}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, statusNotifications: checked}))}
                        />
                        <Label htmlFor="status-ntf">Уведомления о статусе кабинета</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      className="flex-1" 
                      onClick={handleAddAccount}
                      disabled={loading}
                    >
                      {loading ? 'Добавление...' : 'Добавить'}
                    </Button>
                    <Button variant="outline" onClick={() => handleModalChange(false)}>Закрыть</Button>
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
                      checked={selectedAccounts.length === realAccounts.length && realAccounts.length > 0}
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
                {accountsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Загрузка аккаунтов...
                    </TableCell>
                  </TableRow>
                ) : realAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Нет добавленных аккаунтов
                    </TableCell>
                  </TableRow>
                ) : realAccounts.map((account) => (
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
                        <div className="font-medium">{account.name} ({account.facebook_id})</div>
                        {account.cookies_loaded && (
                          <Badge variant="secondary" className="text-xs">Куки загружены</Badge>
                        )}
                        <div className="text-sm text-muted-foreground">
                          Основной кабинет: <strong>{account.primary_cabinet}</strong>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <strong>({account.primary_cabinet_id})</strong>{' '}
                          <Badge variant="outline" className="text-xs">
                            Все кабинеты ({account.total_cabinets})
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
                        {account.daily_limit && <div><strong>Лимит:</strong> {account.daily_limit}</div>}
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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditAccount(account)}
                          title={`Редактировать аккаунт "${account.name}"`}
                        >
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
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteAccount(account.id, account.name)}
                          title={`Удалить аккаунт "${account.name}"`}
                          disabled={deletingAccountId === account.id}
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingAccountId === account.id && (
                            <span className="ml-1 text-xs">...</span>
                          )}
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

      {/* Edit Account Modal */}
      <Dialog open={showEditModal} onOpenChange={handleEditModalChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать аккаунт</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-account-name">Название *</Label>
              <Input 
                id="edit-account-name" 
                placeholder="Техническое название" 
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({...prev, name: e.target.value}))}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-facebook-id">Facebook ID</Label>
              <Input 
                id="edit-facebook-id" 
                value={editFormData.facebookId}
                disabled
                className="bg-gray-50"
              />
              <p className="text-sm text-gray-500">Facebook ID нельзя изменить</p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-token">Новый токен (оставьте пустым, чтобы не менять)</Label>
              <Input 
                id="edit-token" 
                placeholder="Новый токен аккаунта" 
                value={editFormData.token}
                onChange={(e) => setEditFormData(prev => ({...prev, token: e.target.value}))}
                type="password"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Статус кабинета</Label>
              <Select 
                value={editFormData.status} 
                onValueChange={(value: 'active' | 'inactive' | 'banned') => 
                  setEditFormData(prev => ({...prev, status: value}))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Активен</SelectItem>
                  <SelectItem value="inactive">Неактивен</SelectItem>
                  <SelectItem value="banned">Заблокован</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-token-status">Статус токена</Label>
              <Select 
                value={editFormData.tokenStatus} 
                onValueChange={(value: 'active' | 'expired' | 'invalid') => 
                  setEditFormData(prev => ({...prev, tokenStatus: value}))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Активен</SelectItem>
                  <SelectItem value="expired">Истек</SelectItem>
                  <SelectItem value="invalid">Недействителен</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-group">Группа</Label>
              <Select 
                value={editFormData.group || "none"} 
                onValueChange={(value) => setEditFormData(prev => ({...prev, group: value === "none" ? "" : value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите группу" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без группы</SelectItem>
                  <SelectItem value="Основная группа">Основная группа</SelectItem>
                  <SelectItem value="Тестовая группа">Тестовая группа</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-useragent">UserAgent (необязательно)</Label>
              <Input 
                id="edit-useragent" 
                placeholder="Новый User Agent"
                value={editFormData.userAgent}
                onChange={(e) => setEditFormData(prev => ({...prev, userAgent: e.target.value}))}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1" 
                onClick={handleUpdateAccount}
                disabled={loading}
              >
                {loading ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
              <Button variant="outline" onClick={() => handleEditModalChange(false)}>
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}