import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import AutoUploadPage from "./pages/AutoUploadPage";
import StatisticsPage from "./pages/StatisticsPage";
import CreativesPage from "./pages/CreativesPage";
import AiAnalystPage from "./pages/AiAnalystPage";
import AccountsPage from "./pages/AccountsPage";
import FacebookAccountsPage from "./pages/FacebookAccountsPage";
import FacebookAdAccountsPage from "./pages/FacebookAdAccountsPage";
import FacebookPagesPage from "./pages/FacebookPagesPage";
import FacebookProxyPage from "./pages/FacebookProxyPage";
import TeamPage from "./pages/TeamPage";
import AutoRulesPage from "./pages/AutoRulesPage";
import BillingsPage from "./pages/BillingsPage";
import ConsolePage from "./pages/ConsolePage";
import SettingsPage from "./pages/SettingsPage";
import { FacebookTestPage } from "./pages/FacebookTestPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="autoupload" element={<AutoUploadPage />} />
            <Route path="statistics" element={<StatisticsPage />} />
            <Route path="creatives" element={<CreativesPage />} />
            <Route path="ai-analyst" element={<AiAnalystPage />} />
            <Route path="accounts" element={<AccountsPage />} />
            <Route path="facebook-accounts" element={<FacebookAccountsPage />} />
            <Route path="facebook-ad-accounts" element={<FacebookAdAccountsPage />} />
            <Route path="facebook-pages" element={<FacebookPagesPage />} />
            <Route path="facebook-proxy" element={<FacebookProxyPage />} />
            <Route path="facebook-groups" element={<div>Groups Management - Coming Soon</div>} />
            <Route path="team" element={<TeamPage />} />
            <Route path="auto-rules" element={<AutoRulesPage />} />
            <Route path="billings" element={<BillingsPage />} />
            <Route path="console" element={<ConsolePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="facebook-test" element={<FacebookTestPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
