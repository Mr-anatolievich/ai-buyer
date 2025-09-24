import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AddAccountPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Form data states
  const [formData, setFormData] = useState({
    name: '',
    token: '',
    userAgent: '',
    cookies: '',
    groupName: ''
  });

  // Handle multitoken parameter from browser extension
  useEffect(() => {
    const multitoken = searchParams.get('multitoken');
    if (multitoken) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(multitoken));
        
        // Auto-fill form data
        setFormData(prev => ({
          ...prev,
          token: decodedData.token || '',
          userAgent: decodedData.ua || '',
          cookies: JSON.stringify(decodedData.cookies, null, 2) || ''
        }));
      } catch (error) {
        console.error('Error parsing multitoken:', error);
      }
    }
  }, [searchParams]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.token) {
      alert('Пожалуйста, заполните обязательные поля (Название и Токен)');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/facebook/accounts/from-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: formData.token,
          name: formData.name,
          group_name: formData.groupName || null
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('Аккаунт успешно добавлен!');
        navigate('/facebook-accounts');
      } else {
        alert(`Ошибка: ${result.detail || 'Не удалось добавить аккаунт'}`);
      }
    } catch (error) {
      console.error('Error creating account:', error);
      alert('Ошибка сети при создании аккаунта');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Добавить Facebook аккаунт</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="account-name">Название *</Label>
              <Input 
                id="account-name" 
                placeholder="Техническое название" 
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="token">Токен *</Label>
              <Input 
                id="token" 
                placeholder="Токен аккаунта" 
                value={formData.token}
                onChange={(e) => setFormData(prev => ({...prev, token: e.target.value}))}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="useragent">UserAgent</Label>
              <Input 
                id="useragent" 
                placeholder="UserAgent браузера"
                value={formData.userAgent}
                onChange={(e) => setFormData(prev => ({...prev, userAgent: e.target.value}))}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="group">Группа</Label>
              <Select 
                value={formData.groupName} 
                onValueChange={(value) => setFormData(prev => ({...prev, groupName: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите группу" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Без группы</SelectItem>
                  <SelectItem value="Основная группа">Основная группа</SelectItem>
                  <SelectItem value="Группа 1">Группа 1</SelectItem>
                  <SelectItem value="Тестовая">Тестовая</SelectItem>
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
            
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Добавление...' : 'Добавить аккаунт'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/facebook-accounts')}
              >
                Отмена
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}