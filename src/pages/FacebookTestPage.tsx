import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function FacebookTestPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const ACCESS_TOKEN = 'EAAK6iOQnyksBPcyaqKnpq3MxQjyGajXnUvnDZCpJs1w6ZBcCYOAGpdPUwfaFvZBZBbMGFFfd6YM09FsAVyjWqDIZA3CIJrePPVipuiR6557YReAhZBphDbq1ZBYS62GC03gfAT7hUtLypHTMx4310jbhW1LOBRG0ahCbP3XLIHkTmpUPalAZAyYA01qzk7kAkmhOQdZCeKZBwbmOgRamRxHybGZBFLR9LRZCFIsMlqadzou2jaSGW4hurPADCAZBBn1DG3P8ZD';

  const testFacebookApi = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${ACCESS_TOKEN}`);
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Facebook API Test</CardTitle>
          <CardDescription>
            Тестування вашого Facebook Access Token
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testFacebookApi} disabled={loading}>
            {loading ? 'Тестування...' : 'Тестувати API'}
          </Button>
          
          {result && (
            <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-96">
              {result}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}