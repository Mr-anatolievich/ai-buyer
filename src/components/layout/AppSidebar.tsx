import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  Upload, 
  BarChart3, 
  Image, 
  Bot, 
  Users, 
  UsersIcon, 
  Zap, 
  CreditCard, 
  Terminal, 
  Settings,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { useTranslations } from '@/lib/translations';
import { Separator } from '@/components/ui/separator';

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';
  const t = useTranslations();

  const mainItems = [
    { title: t.dashboard, url: '/', icon: LayoutDashboard },
    { title: t.autoupload, url: '/autoupload', icon: Upload },
    { title: t.statistics, url: '/statistics', icon: BarChart3 },
    { title: t.creatives, url: '/creatives', icon: Image },
  ];

  const analyticsItems = [
    { title: t.aiAnalyst, url: '/ai-analyst', icon: Bot },
    { title: t.autoRules, url: '/auto-rules', icon: Zap },
  ];

  const managementItems = [
    { title: t.accounts, url: '/accounts', icon: Users },
    { title: t.team, url: '/team', icon: UsersIcon },
    { title: t.billings, url: '/billings', icon: CreditCard },
  ];

  const systemItems = [
    { title: t.console, url: '/console', icon: Terminal },
    { title: t.settings, url: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const getNavClassName = (path: string) =>
    isActive(path) 
      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm' 
      : 'hover:bg-sidebar-accent/70 text-sidebar-foreground transition-all duration-200 hover:translate-x-1';

  const renderMenuSection = (items: typeof mainItems, label: string, Icon?: React.ComponentType<any>) => (
    <SidebarGroup className="mb-2">
      <SidebarGroupLabel className={`${collapsed ? 'sr-only' : ''} flex items-center gap-2 text-sidebar-foreground/60 font-medium`}>
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent className="mt-2">
        <SidebarMenu className="space-y-1">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild className="h-10">
                <NavLink 
                  to={item.url} 
                  className={`${getNavClassName(item.url)} rounded-lg border border-transparent hover:border-sidebar-border/50`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="ml-3 font-medium">{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar className={`${collapsed ? 'w-16' : 'w-72'} border-r border-sidebar-border/50`} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/50 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-lg text-sidebar-foreground">AI Buyer</h2>
              <p className="text-xs text-sidebar-foreground/60">Ads Management</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4 space-y-6">
        {renderMenuSection(mainItems, 'Main', LayoutDashboard)}
        
        <Separator className="bg-sidebar-border/30" />
        {renderMenuSection(analyticsItems, 'Analytics', TrendingUp)}
        
        <Separator className="bg-sidebar-border/30" />
        {renderMenuSection(managementItems, 'Management', ShieldCheck)}
        
        <Separator className="bg-sidebar-border/30" />
        {renderMenuSection(systemItems, 'System', Settings)}
      </SidebarContent>
    </Sidebar>
  );
}