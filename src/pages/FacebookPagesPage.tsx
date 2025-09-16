import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslations } from '@/lib/translations';
import { Search, Globe, ExternalLink, Users, Eye, EyeOff, X, Check } from 'lucide-react';

interface FacebookPage {
  id: string;
  name: string;
  accountId: string;
  businessManager?: string;
  category: string;
  followers: number;
  isPublished: boolean;
  notificationsDisabled: boolean;
  hasInstagram: boolean;
  isRestricted: boolean;
  imageUrl?: string;
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

const mockFacebookPages: FacebookPage[] = [
  {
    id: '809440478915008',
    name: 'Testovacia sada SK',
    accountId: '18679684',
    category: 'Маркетингове агентство',
    followers: 1,
    isPublished: true,
    notificationsDisabled: true,
    hasInstagram: false,
    isRestricted: false
  },
  {
    id: '733557603176576',
    name: 'Hemmelig boks DK',
    accountId: '18679684',
    businessManager: 'ไตรพิมพ์ BM (4108679449402553)',
    category: 'Магазин товарів для дому',
    followers: 2,
    isPublished: true,
    notificationsDisabled: true,
    hasInstagram: false,
    isRestricted: false
  },
  {
    id: '170715202783691',
    name: 'Akční nabídka CZ',
    accountId: '18679684',
    businessManager: 'BM PHƯỚC AUG (24213037301650756)',
    category: 'Маркетингове агентство',
    followers: 5,
    isPublished: true,
    notificationsDisabled: true,
    hasInstagram: false,
    isRestricted: false
  },
  {
    id: '170187489504235',
    name: 'Geheimbox CH',
    accountId: '18679684',
    businessManager: 'BM PHƯỚC AUG (24213037301650756)',
    category: 'Маркетингове агентство',
    followers: 1,
    isPublished: true,
    notificationsDisabled: true,
    hasInstagram: false,
    isRestricted: false
  },
  {
    id: '169799396209855',
    name: 'Testni set BA',
    accountId: '18679684',
    businessManager: 'BM PHƯỚC AUG (24213037301650756)',
    category: 'Маркетингове агентство',
    followers: 33,
    isPublished: true,
    notificationsDisabled: true,
    hasInstagram: false,
    isRestricted: false
  },
  {
    id: '168197233037637',
    name: 'Aktion auf Rucksäcke AT',
    accountId: '18679684',
    businessManager: 'BM PHƯỚC AUG (24213037301650756)',
    category: 'Спорт і відпочинок',
    followers: 0,
    isPublished: true,
    notificationsDisabled: true,
    hasInstagram: false,
    isRestricted: false
  },
  {
    id: '165448643313559',
    name: 'Smartphone Promotion SL',
    accountId: '18679684',
    businessManager: 'BM PHƯỚC AUG (24213037301650756)',
    category: 'Маркетингове агентство',
    followers: 2,
    isPublished: true,
    notificationsDisabled: true,
    hasInstagram: false,
    isRestricted: false
  },
  {
    id: '170116132845033',
    name: 'Laura Sánchez',
    accountId: '18679684',
    businessManager: 'BM PHƯỚC AUG (24213037301650756)',
    category: 'Особистий блог',
    followers: 7,
    isPublished: true,
    notificationsDisabled: true,
    hasInstagram: false,
    isRestricted: false
  },
  {
    id: '170024252853357',
    name: 'Claudia Meier',
    accountId: '18679684',
    businessManager: 'BM PHƯỚC AUG (24213037301650756)',
    category: 'Особистий блог',
    followers: 0,
    isPublished: true,
    notificationsDisabled: true,
    hasInstagram: false,
    isRestricted: false
  },
  {
    id: '168136156377551',
    name: 'Susan Mitchell',
    accountId: '18679684',
    businessManager: 'BM PHƯỚC AUG (24213037301650756)',
    category: 'Особистий блог',
    followers: 0,
    isPublished: true,
    notificationsDisabled: true,
    hasInstagram: false,
    isRestricted: false
  }
];

export default function FacebookPagesPage() {
  const t = useTranslations();
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedFacebookAccount = mockFacebookAccounts.find(acc => acc.id === selectedAccount);
  const pages = selectedAccount ? mockFacebookPages.filter(page => page.accountId === selectedAccount) : [];
  
  const filteredPages = pages.filter(page => {
    return page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           page.id.includes(searchTerm) ||
           page.category.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const togglePageSelection = (pageId: string) => {
    setSelectedPages(prev => 
      prev.includes(pageId) 
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };

  const selectAllPages = () => {
    if (selectedPages.length === filteredPages.length) {
      setSelectedPages([]);
    } else {
      setSelectedPages(filteredPages.map(page => page.id));
    }
  };

  const togglePagePublishStatus = (pageId: string) => {
    // In a real app, this would make API call
    console.log('Toggle publish status for page:', pageId);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t.pages}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Налаштування вибору акаунта
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="account-select">Виберіть акаунт</Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount} name="account-select">
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
                Створити сторінку
              </Button>
              {selectedPages.length > 0 && (
                <Button 
                  variant="default" 
                  size="sm"
                >
                  Обрано ({selectedPages.length})
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedAccount && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Сторінки акаунта #{selectedAccount} - "{selectedFacebookAccount?.name}"
              </CardTitle>
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
                        checked={selectedPages.length === filteredPages.length && filteredPages.length > 0}
                        onCheckedChange={selectAllPages}
                      />
                    </TableHead>
                    <TableHead className="w-16"></TableHead>
                    <TableHead>Сторінка</TableHead>
                    <TableHead>Категорія</TableHead>
                    <TableHead className="text-center">Відкл. сповіщення</TableHead>
                    <TableHead className="text-center">Підписники</TableHead>
                    <TableHead className="text-center">Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPages.includes(page.id)}
                          onCheckedChange={() => togglePageSelection(page.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={page.imageUrl} alt={page.name} />
                          <AvatarFallback className="bg-muted">
                            <Globe className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">ФП нового типу</Badge>
                          </div>
                          <div className="text-sm space-y-1">
                            <p><strong>Назва:</strong> {page.name}</p>
                            <p>
                              <strong>ID:</strong> 
                              <a 
                                href={`https://www.facebook.com/${page.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline ml-1 inline-flex items-center gap-1"
                              >
                                {page.id}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </p>
                            {page.businessManager && (
                              <p><strong>БМ:</strong> {page.businessManager}</p>
                            )}
                            <p>
                              <strong>Акаунт:</strong> 
                              <a href="#" className="text-primary hover:underline ml-1">
                                #{page.accountId}
                              </a>
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{page.category}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        {page.notificationsDisabled ? (
                          <X className="w-4 h-4 text-destructive mx-auto" />
                        ) : (
                          <Check className="w-4 h-4 text-success mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{page.followers}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <Badge 
                            className={page.isPublished ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}
                          >
                            {page.isPublished ? 'Опублікована' : 'Не опублікована'}
                          </Badge>
                          {page.isPublished && (
                            <div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-6"
                                onClick={() => togglePagePublishStatus(page.id)}
                              >
                                <EyeOff className="w-3 h-3 mr-1" />
                                Зняти з публікації
                              </Button>
                            </div>
                          )}
                          {!page.isPublished && (
                            <div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-6"
                                onClick={() => togglePagePublishStatus(page.id)}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Опублікувати
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredPages.length === 0 && selectedAccount && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Немає сторінок для обраного акаунта</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedAccount && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Оберіть акаунт для перегляду Facebook сторінок</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}