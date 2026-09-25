/**
 * Loxy High-Performance PWA Manager
 * Powered by Workbox & vite-plugin-pwa
 *
 * Provides:
 * - Instant offline-first app-shell loading via byte-hashed asset precaching
 * - Background auto-updates with zero user friction
 * - Native install prompts (iOS / Android / Desktop)
 * - Safe area & standalone display mode detection
 */

import { registerSW } from 'virtual:pwa-register';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const installListeners = new Set<(canInstall: boolean) => void>();

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('[Loxy PWA] New build available. Updating cache in background...');
        updateSW(true);
      },
      onOfflineReady() {
        console.log('[Loxy PWA] App shell precached. 100% offline-ready.');
      },
      onRegisterError(error) {
        console.error('[Loxy PWA] Registration error:', error);
      },
    });

    // Capture browser install prompt
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      installListeners.forEach(listener => listener(true));
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      installListeners.forEach(listener => listener(false));
      console.log('[Loxy PWA] App installed successfully.');
    });
  }
}

export function subscribeToInstallPrompt(callback: (canInstall: boolean) => void): () => void {
  installListeners.add(callback);
  callback(Boolean(deferredPrompt));
  return () => {
    installListeners.delete(callback);
  };
}

export async function promptPwaInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  try {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    installListeners.forEach(listener => listener(false));
    return choice.outcome === 'accepted';
  } catch (err) {
    console.error('[Loxy PWA] Install prompt failed:', err);
    return false;
  }
}

export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    Boolean((navigator as unknown as { standalone?: boolean }).standalone)
  );
}
