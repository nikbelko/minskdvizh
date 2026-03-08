import { useEffect } from 'react';
import { tg, isTelegram } from '@/lib/telegram';

export function useTelegramTheme() {
  useEffect(() => {
    if (!isTelegram() || !tg) return;

    const applyTheme = () => {
      try {
        const params = tg.themeParams;
        if (!params) return;
        const root = document.documentElement;
        if (params.bg_color) root.style.setProperty('--tg-bg', params.bg_color);
        if (params.text_color) root.style.setProperty('--tg-text', params.text_color);
      } catch {
        // ignore
      }
    };

    applyTheme();

    try {
      tg.onEvent('themeChanged', applyTheme);
      return () => {
        tg.offEvent('themeChanged', applyTheme);
      };
    } catch {
      // ignore
    }
  }, []);
}
