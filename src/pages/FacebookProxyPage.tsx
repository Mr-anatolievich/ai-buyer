import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslations } from '@/lib/translations';
import { Search, Plus, Copy, RefreshCw, Edit, Trash2, ChevronDown, ExternalLink, Info, AlertTriangle } from 'lucide-react';

interface Proxy {
  id: string;
  proxy: string;
  name?: string;
  status: 'active' | 'error' | 'inactive';
  accountsCount: number;
  type: 'http' | 'socks5';
}

const mockProxies: Proxy[] = [
  {
    id: '1119443',
    proxy: '46.232.38.50:62416:twDkFJtm:PTM9vT4X',
    name: '',
    status: 'active',
    accountsCount: 1,
    type: 'http'
  },
  {
    id: '1119444',
    proxy: '192.168.1.1:8080:user:pass',
    name: 'Test Proxy',
    status: 'error',
    accountsCount: 0,
    type: 'http'
  },
  {
    id: '1119445',
    proxy: '10.0.0.1:1080:admin:admin123',
    name: 'Local Proxy',
    status: 'active',
    accountsCount: 3,
    type: 'socks5'
  }
];

export default function FacebookProxyPage() {
  const t = useTranslations();
  const [proxies, setProxies] = useState<Proxy[]>(mockProxies);
  const [selectedProxies, setSelectedProxies] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProxyText, setNewProxyText] = useState('');

  const filteredProxies = proxies.filter(proxy => {
    return proxy.proxy.toLowerCase().includes(searchTerm.toLowerCase()) ||
           proxy.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           proxy.id.includes(searchTerm);
  });

  const toggleProxySelection = (proxyId: string) => {
    setSelectedProxies(prev => 
      prev.includes(proxyId) 
        ? prev.filter(id => id !== proxyId)
        : [...prev, proxyId]
    );
  };

  const selectAllProxies = () => {
    if (selectedProxies.length === filteredProxies.length) {
      setSelectedProxies([]);
    } else {
      setSelectedProxies(filteredProxies.map(proxy => proxy.id));
    }
  };

  const copyProxyToClipboard = async (proxyString: string) => {
    try {
      await navigator.clipboard.writeText(proxyString);
      // In a real app, show toast notification
      console.log('Proxy copied to clipboard');
    } catch (err) {
      console.error('Failed to copy proxy:', err);
    }
  };

  const checkProxy = (proxyId: string) => {
    // In a real app, this would make API call to check proxy
    console.log('Checking proxy:', proxyId);
    setProxies(prev => 
      prev.map(proxy => 
        proxy.id === proxyId 
          ? { ...proxy, status: 'active' as const }
          : proxy
      )
    );
  };

  const deleteProxy = (proxyId: string) => {
    if (confirm('Ви впевнені, що хочете видалити цей проксі?')) {
      setProxies(prev => prev.filter(proxy => proxy.id !== proxyId));
      setSelectedProxies(prev => prev.filter(id => id !== proxyId));
    }
  };

  const bulkCheckProxies = () => {
    selectedProxies.forEach(proxyId => checkProxy(proxyId));
  };

  const bulkDeleteProxies = () => {
    if (confirm(`Ви впевнені, що хочете видалити ${selectedProxies.length} проксі?`)) {
      setProxies(prev => prev.filter(proxy => !selectedProxies.includes(proxy.id)));
      setSelectedProxies([]);
    }
  };

  const deleteUnusedProxies = () => {
    if (confirm('Ви впевнені, що хочете видалити всі невикористовувані проксі?')) {
      setProxies(prev => prev.filter(proxy => proxy.accountsCount > 0));
      setSelectedProxies([]);
    }
  };

  const checkErrorProxies = () => {
    if (confirm('Перевірити проксі з помилками?')) {
      proxies
        .filter(proxy => proxy.status === 'error')
        .forEach(proxy => checkProxy(proxy.id));
    }
  };

  const handleAddProxy = () => {
    if (!newProxyText.trim()) return;

    const lines = newProxyText.trim().split('\n');
    const newProxies: Proxy[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      let proxyData = trimmedLine;
      let name = '';
      
      // Check if name is specified with @
      if (trimmedLine.includes('@')) {
        const parts = trimmedLine.split('@');
        proxyData = parts[0];
        name = parts[1] || '';
      }

      const newProxy: Proxy = {
        id: `${Date.now()}_${index}`,
        proxy: proxyData,
        name,
        status: 'active',
        accountsCount: 0,
        type: proxyData.includes(':socks5') ? 'socks5' : 'http'
      };

      newProxies.push(newProxy);
    });

    setProxies(prev => [...prev, ...newProxies]);
    setNewProxyText('');
    setShowAddDialog(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success text-success-foreground">Активна</Badge>;
      case 'error':
        return <Badge className="bg-destructive text-destructive-foreground">Помилка</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Неактивна</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t.proxyManagement}</h1>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Додати
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Додати проксі</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="proxy-textarea">Проксі</Label>
                <Textarea
                  id="proxy-textarea"
                  placeholder="Якщо проксі декілька, то кожну вказувати з нового рядка"
                  rows={10}
                  value={newProxyText}
                  onChange={(e) => setNewProxyText(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <h5 className="font-semibold mb-2">Доступні формати</h5>
                  <div className="text-sm space-y-1">
                    <p className="font-medium text-warning">
                      Увага, для найбільш стабільної роботи ми рекомендуємо додавати проксі тільки через http порт і по можливості не використовувати socks5!
                    </p>
                    <p><code>ip:port:login:password</code></p>
                    <p><code>ip:port:login:password:type</code></p>
                    <p className="mt-2">За бажанням для майбутньої зручності при пошуку проксі можна одразу вказати її назву через параметр name:</p>
                    <p><code>ip:port:login:password@name</code></p>
                    <p><code>ip:port:login:password:type@name</code></p>
                    <p className="mt-2">Якщо не вказувати параметр type, то буде використовуватися протокол http(s), для використання socks5 вкажіть socks5</p>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Назад
                </Button>
                <Button onClick={handleAddProxy}>
                  Зберегти
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Список проксі</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Пошук..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
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
                      checked={selectedProxies.length === filteredProxies.length && filteredProxies.length > 0}
                      onCheckedChange={selectAllProxies}
                    />
                  </TableHead>
                  <TableHead className="w-20">ID</TableHead>
                  <TableHead>Проксі</TableHead>
                  <TableHead>Назва</TableHead>
                  <TableHead className="text-center">Статус</TableHead>
                  <TableHead className="text-center">Акаунтів</TableHead>
                  <TableHead className="text-center w-32">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProxies.map((proxy) => (
                  <TableRow key={proxy.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProxies.includes(proxy.id)}
                        onCheckedChange={() => toggleProxySelection(proxy.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{proxy.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{proxy.proxy}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyProxyToClipboard(proxy.proxy)}
                          title="Скопіювати проксі в буфер обміну"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{proxy.name || '-'}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(proxy.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      {proxy.accountsCount > 0 ? (
                        <a
                          href="#"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                          title="Відкрити акаунти на цьому проксі"
                        >
                          {proxy.accountsCount}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => checkProxy(proxy.id)}
                          title="Перевірити"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Редагувати"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteProxy(proxy.id)}
                          title="Видалити"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredProxies.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Проксі не знайдено</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedProxies.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Обрано: {selectedProxies.length}
              </span>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    Групові дії
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background border z-50">
                  <DropdownMenuItem onClick={bulkCheckProxies}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Перевірити
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={bulkDeleteProxies} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Видалити
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="destructive"
                onClick={deleteUnusedProxies}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Видалити невикористовувані
              </Button>

              <Button
                variant="outline"
                onClick={checkErrorProxies}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Перевірити з помилками
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}