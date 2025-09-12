import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Header } from './Header';
import { AppSidebar } from './AppSidebar';
import { AiAnalystDrawer } from '@/components/ai/AiAnalystDrawer';
import { useAppStore } from '@/store/useAppStore';

export function MainLayout() {
  const { sidebarCollapsed } = useAppStore();

  return (
    <SidebarProvider defaultOpen={!sidebarCollapsed}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <Header />
          
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
        
        <AiAnalystDrawer />
      </div>
    </SidebarProvider>
  );
}