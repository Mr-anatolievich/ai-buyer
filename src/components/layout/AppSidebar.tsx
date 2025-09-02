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
  Settings 
} from 'lucide-react';
import { useTranslations } from '@/lib/translations';

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';
  const t = useTranslations();

  const menuItems = [
    { title: t.dashboard, url: '/', icon: LayoutDashboard },
    { title: t.autoupload, url: '/autoupload', icon: Upload },
    { title: t.statistics, url: '/statistics', icon: BarChart3 },
    { title: t.creatives, url: '/creatives', icon: Image },
    { title: t.aiAnalyst, url: '/ai-analyst', icon: Bot },
    { title: t.accounts, url: '/accounts', icon: Users },
    { title: t.team, url: '/team', icon: UsersIcon },
    { title: t.autoRules, url: '/auto-rules', icon: Zap },
    { title: t.billings, url: '/billings', icon: CreditCard },
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
      : 'hover:bg-sidebar-accent/50 text-sidebar-foreground';

  return (
    <Sidebar className={collapsed ? 'w-16' : 'w-64'} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? 'sr-only' : ''}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClassName(item.url)}
                    >
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}