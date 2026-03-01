"use client";

import { useEffect, useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

type NotificationPermission = "default" | "granted" | "denied";

type UsePushNotificationsReturn = {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
};

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const saveSub = useMutation(api.pushSubscriptions.savePushSubscription);
  const deleteSub = useMutation(api.pushSubscriptions.deletePushSubscription);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setIsSupported(supported);

    if (!supported) return;

    setPermission(Notification.permission);

    void navigator.serviceWorker
      .register("/sw.js")
      .then(async (registration) => {
        const existing = await registration.pushManager.getSubscription();
        setSubscription(existing);
      })
      .catch(() => {
        // SW registration failed silently
      });
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported) return;

    setIsLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") return;

      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        throw new Error("VAPID public key is not configured.");
      }

      const pushSub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      setSubscription(pushSub);

      const json = pushSub.toJSON();
      await saveSub({
        endpoint: pushSub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, saveSub]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return;

    setIsLoading(true);
    try {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      setSubscription(null);
      await deleteSub({ endpoint });
    } finally {
      setIsLoading(false);
    }
  }, [subscription, deleteSub]);

  return {
    isSupported,
    permission,
    isSubscribed: subscription !== null,
    isLoading,
    subscribe,
    unsubscribe,
  };
}
