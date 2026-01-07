/**
 * PWA Notification utilities for TurfHub
 * Handles push notifications, permission requests, and mobile-optimized notifications
 */

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  vibrate?: number[];
  requireInteraction?: boolean;
  type?: 'bet_result' | 'match_update' | 'payment' | 'general';
}

class NotificationManager {
  private static instance: NotificationManager;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.permission = Notification.permission;
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Show a local notification
   */
  async showNotification(options: NotificationOptions): Promise<boolean> {
    // Check if we have permission
    if (this.permission !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return false;
      }
    }

    // Check if service worker is available for better notification handling
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        const registration = await navigator.serviceWorker.ready;

        const notificationOptions = {
          body: options.body,
          icon: options.icon || '/logo.svg',
          badge: options.badge || '/logo.svg',
          tag: options.tag || 'turfmate',
          data: options.data,
          actions: options.actions || [],
          requireInteraction: options.requireInteraction || false,
        };

        await registration.showNotification(options.title, notificationOptions);
        return true;
      } catch (error) {
        console.error('Error showing service worker notification:', error);
        // Fall back to regular notification
      }
    }

    // Fallback to regular notification
    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/logo.svg',
        tag: options.tag || 'turfmate',
        data: options.data,
        requireInteraction: options.requireInteraction || false,
      });

      // Handle click for regular notifications
      notification.onclick = () => {
        window.focus();
        notification.close();

        if (options.data?.url && typeof options.data.url === 'string') {
          window.location.href = options.data.url;
        }
      };

      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  /**
   * Show betting result notification
   */
  async showBetResult(result: 'won' | 'lost', amount: number, payout?: number): Promise<boolean> {
    const options: NotificationOptions = {
      title: result === 'won' ? '🎉 Bet Won!' : '😔 Bet Lost',
      body:
        result === 'won' ? `Congratulations! You won ₦${payout?.toLocaleString()}!` : `Better luck next time! You lost ₦${amount.toLocaleString()}.`,
      type: 'bet_result',
      tag: 'bet-result',
      vibrate: result === 'won' ? [100, 50, 100, 50, 100] : [200],
      requireInteraction: true,
      actions: [
        {
          action: 'view_history',
          title: 'View History',
        },
        {
          action: 'place_new_bet',
          title: 'Place New Bet',
        },
      ],
      data: {
        url: '/app/betting/history',
        result,
        amount,
        payout,
      },
    };

    return this.showNotification(options);
  }

  /**
   * Show match update notification
   */
  async showMatchUpdate(matchTitle: string, score: string, matchUrl?: string): Promise<boolean> {
    const options: NotificationOptions = {
      title: '⚽ Match Update',
      body: `${matchTitle}: ${score}`,
      type: 'match_update',
      tag: 'match-update',
      vibrate: [100, 50, 100],
      actions: [
        {
          action: 'view_match',
          title: 'View Match',
        },
        {
          action: 'bet_now',
          title: 'Bet Now',
        },
      ],
      data: {
        url: matchUrl || '/app/betting',
        matchUrl,
      },
    };

    return this.showNotification(options);
  }

  /**
   * Show payment notification
   */
  async showPaymentUpdate(type: 'success' | 'failed', amount: number, description?: string): Promise<boolean> {
    const options: NotificationOptions = {
      title: type === 'success' ? '✅ Payment Successful' : '❌ Payment Failed',
      body:
        type === 'success'
          ? `₦${amount.toLocaleString()} payment completed${description ? ` for ${description}` : ''}`
          : `₦${amount.toLocaleString()} payment failed${description ? ` for ${description}` : ''}`,
      type: 'payment',
      tag: 'payment',
      vibrate: type === 'success' ? [100, 50, 100] : [200, 100, 200],
      data: {
        url: '/app/wallet',
        type,
        amount,
      },
    };

    return this.showNotification(options);
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Get current permission status
   */
  getPermission(): NotificationPermission {
    return this.permission;
  }

  /**
   * Subscribe to push notifications (requires service worker)
   */
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Subscribe to push notifications
        const vapidKey = process.env.VITE_VAPID_PUBLIC_KEY || '';
        if (vapidKey) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(vapidKey) as BufferSource,
          });
        } else {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
          });
        }
      }

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Export singleton instance
export const notificationManager = NotificationManager.getInstance();

// Export hook for React components
export const useNotifications = () => {
  const [permission, setPermission] = React.useState<NotificationPermission>(notificationManager.getPermission());

  const requestPermission = async () => {
    const newPermission = await notificationManager.requestPermission();
    setPermission(newPermission);
    return newPermission;
  };

  const showNotification = (options: NotificationOptions) => {
    return notificationManager.showNotification(options);
  };

  const showBetResult = (result: 'won' | 'lost', amount: number, payout?: number) => {
    return notificationManager.showBetResult(result, amount, payout);
  };

  const showMatchUpdate = (matchTitle: string, score: string, matchUrl?: string) => {
    return notificationManager.showMatchUpdate(matchTitle, score, matchUrl);
  };

  const showPaymentUpdate = (type: 'success' | 'failed', amount: number, description?: string) => {
    return notificationManager.showPaymentUpdate(type, amount, description);
  };

  return {
    permission,
    isSupported: notificationManager.isSupported(),
    requestPermission,
    showNotification,
    showBetResult,
    showMatchUpdate,
    showPaymentUpdate,
    subscribeToPush: notificationManager.subscribeToPush.bind(notificationManager),
  };
};

// Import React for the hook
import React from 'react';
