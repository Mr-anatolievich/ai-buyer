import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Palette, Sparkles, Sunset } from 'lucide-react';

interface ThemeOption {
  id: string;
  name: string;
  description: string;
  icon: any;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string;
  };
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'purple-blue',
    name: 'Modern Purple-Blue',
    description: 'Як Linear, Stripe - професійний і сучасний',
    icon: Sparkles,
    colors: {
      primary: '262 83% 58%',
      secondary: '217 91% 60%', 
      accent: '270 91% 65%',
      gradient: 'linear-gradient(135deg, hsl(262 83% 58%), hsl(270 91% 65%))'
    }
  },
  {
    id: 'emerald-teal',
    name: 'Emerald-Teal',
    description: 'Як Figma - творчий і натхненний',
    icon: Palette,
    colors: {
      primary: '156 72% 47%',
      secondary: '174 72% 56%',
      accent: '45 93% 67%',
      gradient: 'linear-gradient(135deg, hsl(156 72% 47%), hsl(174 72% 56%))'
    }
  },
  {
    id: 'sunset-gradient',
    name: 'Sunset Gradient',
    description: 'Тренд 2024 - теплий і енергійний',
    icon: Sunset,
    colors: {
      primary: '14 100% 57%',
      secondary: '340 82% 65%',
      accent: '280 100% 70%',
      gradient: 'linear-gradient(135deg, hsl(14 100% 57%), hsl(340 82% 65%))'
    }
  }
];

export function ThemeDemo() {
  const applyTheme = async (theme: ThemeOption) => {
    const root = document.documentElement;
    
    // Apply theme colors
    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--secondary', theme.colors.secondary);  
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--ring', theme.colors.primary);
    root.style.setProperty('--sidebar-primary', theme.colors.primary);
    root.style.setProperty('--sidebar-ring', theme.colors.primary);
    
    // Apply specific theme variations
    if (theme.id === 'purple-blue') {
      root.style.setProperty('--primary-hover', '270 91% 65%');
      root.style.setProperty('--secondary-foreground', '0 0% 98%');
      root.style.setProperty('--accent-foreground', '0 0% 98%');
    } else if (theme.id === 'emerald-teal') {
      root.style.setProperty('--primary-hover', '156 72% 40%');
      root.style.setProperty('--secondary-foreground', '0 0% 98%');
      root.style.setProperty('--accent-foreground', '217 19% 27%');
      root.style.setProperty('--warning', '45 93% 67%');
    } else if (theme.id === 'sunset-gradient') {
      root.style.setProperty('--primary-hover', '14 100% 50%');
      root.style.setProperty('--secondary-foreground', '0 0% 98%');
      root.style.setProperty('--accent-foreground', '0 0% 98%');
      root.style.setProperty('--success', '156 72% 47%');
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Оберіть дизайн теми
        </CardTitle>
        <CardDescription>
          Клікніть на будь-який варіант, щоб побачити його в дії
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {THEME_OPTIONS.map((theme) => (
            <Card 
              key={theme.id} 
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
              onClick={() => applyTheme(theme)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <theme.icon className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold text-sm">{theme.name}</h4>
                    <p className="text-xs text-muted-foreground">{theme.description}</p>
                  </div>
                </div>
                
                {/* Color Preview */}
                <div className="flex gap-2 mb-3">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                  />
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: `hsl(${theme.colors.secondary})` }}
                  />
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: `hsl(${theme.colors.accent})` }}
                  />
                </div>
                
                {/* Gradient Preview */}
                <div 
                  className="h-8 rounded-md"
                  style={{ background: theme.colors.gradient }}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Demo Elements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h5 className="font-medium text-sm">Елементи інтерфейсу:</h5>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm">Основна кнопка</Button>
              <Button size="sm" variant="secondary">Вторинна</Button>
              <Button size="sm" variant="outline">Обведена</Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge>Активна</Badge>
              <Badge variant="secondary">Вторинна</Badge>
              <Badge variant="outline">Обведена</Badge>
            </div>
          </div>
          
          <div className="space-y-3">
            <h5 className="font-medium text-sm">Індикатори прогресу:</h5>
            <div>
              <div className="text-sm mb-1">Використання бюджету: 74%</div>
              <Progress value={74} className="h-2" />
            </div>
            <div>
              <div className="text-sm mb-1">Конверсії: 32%</div>
              <Progress value={32} className="h-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}