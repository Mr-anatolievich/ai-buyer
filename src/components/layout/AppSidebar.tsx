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
      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
      : 'hover:bg-sidebar-accent/50 text-sidebar-foreground transition-colors duration-150';

  const renderMenuSection = (items: typeof mainItems, label: string, Icon?: React.ComponentType<any>) => (
    <SidebarGroup className="mb-1">
      <SidebarGroupLabel className={`${collapsed ? 'sr-only' : ''} flex items-center gap-2 text-sidebar-foreground/60 font-medium px-1 mb-1`}>
        {Icon && <Icon className="w-3 h-3" />}
        <span className="text-xs">{label}</span>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="space-y-0.5">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild className="h-9">
                <NavLink 
                  to={item.url} 
                  className={`${getNavClassName(item.url)} rounded-md border border-transparent hover:border-sidebar-border/30`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="ml-2 text-sm font-medium">{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar className={`${collapsed ? 'w-16' : 'w-64'} border-r`} collapsible="icon">
      <SidebarHeader className="border-b p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-base text-sidebar-foreground">AI Buyer</h2>
              <p className="text-xs text-sidebar-foreground/60 -mt-0.5">Ads Management</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-2 space-y-4">
        {renderMenuSection(mainItems, 'Main', LayoutDashboard)}
        
        <Separator className="bg-sidebar-border/30 mx-2" />
        {renderMenuSection(analyticsItems, 'Analytics', TrendingUp)}
        
        <Separator className="bg-sidebar-border/30 mx-2" />
        {renderMenuSection(managementItems, 'Management', ShieldCheck)}
        
        <Separator className="bg-sidebar-border/30 mx-2" />
        {renderMenuSection(systemItems, 'System', Settings)}
      </SidebarContent>
    </Sidebar>
  );
}