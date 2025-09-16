import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { FacebookConfig } from '@/services/facebookApi';

interface FacebookConfigFormProps {
  onConfigSave: (config: FacebookConfig) => void;
  initialConfig?: Partial<FacebookConfig>;
}

export function FacebookConfigForm({ onConfigSave, initialConfig }: FacebookConfigFormProps) {
  const [config, setConfig] = useState<Partial<FacebookConfig>>({
    accessToken: initialConfig?.accessToken || import.meta.env.VITE_FACEBOOK_ACCESS_TOKEN || '',
    appId: initialConfig?.appId || import.meta.env.VITE_FACEBOOK_APP_ID || '',
    appSecret: initialConfig?.appSecret || import.meta.env.VITE_FACEBOOK_APP_SECRET || '',
    adAccountId: initialConfig?.adAccountId || import.meta.env.VITE_FACEBOOK_AD_ACCOUNT_ID || '',
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleInputChange = (field: keyof FacebookConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setTestResult(null); // Скидаємо результат тесту при зміні конфігурації
  };

  const testConnection = async () => {
    if (!config.accessToken || !config.adAccountId) {
      toast.error('Введіть Access Token та Ad Account ID для тестування');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Тестуємо з'єднання, спробувавши отримати базову інформацію про рекламний кабінет
      const response = await fetch(
        `https://graph.facebook.com/v18.0/act_${config.adAccountId}?fields=id,name,account_status&access_token=${config.accessToken}`
      );

      if (response.ok) {
        const data = await response.json();
        setTestResult({
          success: true,
          message: `Успішно підключено до: ${data.name} (${data.account_status})`
        });
        toast.success('З\'єднання успішне!');
      } else {
        const error = await response.json();
        setTestResult({
          success: false,
          message: error.error?.message || 'Невідома помилка'
        });
        toast.error('Помилка з\'єднання');
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Не вдалося з\'єднатися з Facebook API'
      });
      toast.error('Помилка з\'єднання');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!config.accessToken || !config.appId || !config.appSecret || !config.adAccountId) {
      toast.error('Заповніть всі обов\'язкові поля');
      return;
    }

    onConfigSave(config as FacebookConfig);
    toast.success('Конфігурація збережена');
  };

  const isConfigComplete = config.accessToken && config.appId && config.appSecret && config.adAccountId;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Налаштування Facebook Marketing API</CardTitle>
        <CardDescription>
          Введіть дані для підключення до Facebook Marketing API. Ви можете отримати їх у{' '}
          <a 
            href="https://developers.facebook.com/apps/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Facebook Developers
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="accessToken">Access Token *</Label>
          <Input
            id="accessToken"
            type="password"
            placeholder="EAAG..."
            value={config.accessToken}
            onChange={(e) => handleInputChange('accessToken', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="appId">App ID *</Label>
          <Input
            id="appId"
            placeholder="1234567890"
            value={config.appId}
            onChange={(e) => handleInputChange('appId', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="appSecret">App Secret *</Label>
          <Input
            id="appSecret"
            type="password"
            placeholder="abc123..."
            value={config.appSecret}
            onChange={(e) => handleInputChange('appSecret', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="adAccountId">Ad Account ID *</Label>
          <Input
            id="adAccountId"
            placeholder="1234567890 (без act_ префіксу)"
            value={config.adAccountId}
            onChange={(e) => handleInputChange('adAccountId', e.target.value)}
          />
        </div>

        {testResult && (
          <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {testResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
              {testResult.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={testConnection} 
            disabled={!config.accessToken || !config.adAccountId || testing}
            variant="outline"
            className="flex-1"
          >
            {testing ? 'Тестуємо...' : 'Тестувати з\'єднання'}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!isConfigComplete}
            className="flex-1"
          >
            Зберегти конфігурацію
          </Button>
        </div>

        <div className="text-sm text-muted-foreground mt-4">
          <p className="font-medium mb-2">Інструкції для отримання даних:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Перейдіть на <a href="https://developers.facebook.com/apps/" className="text-primary hover:underline">Facebook Developers</a></li>
            <li>Створіть нову програму або виберіть існуючу</li>
            <li>Додайте продукт "Marketing API"</li>
            <li>Згенеруйте Access Token з необхідними дозволами</li>
            <li>Знайдіть ID вашого рекламного кабінету в Ads Manager</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
