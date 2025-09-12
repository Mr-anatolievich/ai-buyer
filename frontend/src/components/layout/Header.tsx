import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bot, Globe, User, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useTranslations } from '@/lib/translations';
import { useTheme } from 'next-themes';

const LANGUAGES = {
  en: 'EN',
  uk: 'УКР', 
  ru: 'RU'
} as const;

export function Header() {
  const { user, language, setLanguage, setAiAnalystOpen } = useAppStore();
  const t = useTranslations();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 shadow-sm">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="hover:bg-accent/80 transition-colors" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg ring-2 ring-primary/20">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              AI Buyer
            </span>
            <p className="text-xs text-muted-foreground -mt-1">Smart Ads Management</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* AI Analyst Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAiAnalystOpen(true)}
          className="gap-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 transition-all duration-200"
        >
          <Bot className="w-4 h-4 text-primary" />
          <span className="hidden md:inline">{t.aiAnalyst}</span>
        </Button>

        <div className="flex items-center bg-muted/50 rounded-lg p-1 gap-1">
          {/* Theme Switcher */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-8 w-8 p-0 hover:bg-background/80 transition-all duration-200"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 hover:bg-background/80 transition-all duration-200">
                <Globe className="w-4 h-4" />
                <span className="text-xs font-medium">{LANGUAGES[language]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setLanguage('en')} className="gap-2">
                🇺🇸 English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('uk')} className="gap-2">
                🇺🇦 Українська
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('ru')} className="gap-2">
                🇷🇺 Русский
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-3 px-3 h-12 hover:bg-muted/70 transition-all duration-200">
              <Avatar className="w-9 h-9 ring-2 ring-primary/20">
                <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-primary/20 to-primary/10">
                  {user?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden lg:block">
                <div className="text-sm font-semibold">{user?.name}</div>
                <Badge variant="secondary" className="text-xs font-medium">
                  {user?.role}
                </Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2">
            <div className="px-2 py-2 mb-2 border-b">
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuItem className="gap-2 rounded-md">
              <User className="w-4 h-4" />
              {t.profile}
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 rounded-md">
              <Settings className="w-4 h-4" />
              {t.settings}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-destructive rounded-md focus:text-destructive">
              <LogOut className="w-4 h-4" />
              {t.signOut}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}