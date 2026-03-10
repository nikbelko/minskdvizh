import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { tgReady } from '@/lib/telegram';
import { useTelegramTheme } from '@/hooks/useTelegramTheme';

const queryClient = new QueryClient();

const AppInner = () => {
  useEffect(() => { tgReady(); }, []);
  useTelegramTheme();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    fetch('https://minskdvizh.up.railway.app/api/webapp-ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: tg?.initDataUnsafe?.user?.id ?? null,
        username: tg?.initDataUnsafe?.user?.username ?? null,
        first_name: tg?.initDataUnsafe?.user?.first_name ?? null,
      }),
    }).catch(() => {});
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
