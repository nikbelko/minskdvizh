declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

export const tg = window.Telegram?.WebApp ?? null;

export const isTelegram = (): boolean => {
  try {
    return !!tg?.initData;
  } catch {
    return false;
  }
};

export function tgReady() {
  try {
    if (!tg) return;
    tg.ready();
    tg.expand();
  } catch {
    // silently ignore
  }
}

export function haptic(type: 'light' | 'medium' | 'soft' | 'selection' = 'light') {
  try {
    if (!tg) return;
    if (type === 'selection') {
      tg.HapticFeedback?.selectionChanged();
    } else {
      tg.HapticFeedback?.impactOccurred(type);
    }
  } catch {
    // silently ignore
  }
}

export function getTelegramUser() {
  try {
    return tg?.initDataUnsafe?.user ?? null;
  } catch {
    return null;
  }
}

export function showBackButton(onClick: () => void) {
  try {
    if (!tg) return;
    tg.BackButton.show();
    tg.BackButton.onClick(onClick);
  } catch {
    // silently ignore
  }
}

export function hideBackButton() {
  try {
    if (!tg) return;
    tg.BackButton.hide();
  } catch {
    // silently ignore
  }
}

export function showMainButton(text: string, onClick: () => void) {
  try {
    if (!tg) return;
    tg.MainButton.setText(text);
    tg.MainButton.show();
    tg.MainButton.onClick(onClick);
  } catch {
    // silently ignore
  }
}

export function hideMainButton() {
  try {
    if (!tg) return;
    tg.MainButton.hide();
  } catch {
    // silently ignore
  }
}

export function openLink(url: string) {
  try {
    if (tg) {
      tg.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  } catch {
    window.open(url, '_blank');
  }
}
