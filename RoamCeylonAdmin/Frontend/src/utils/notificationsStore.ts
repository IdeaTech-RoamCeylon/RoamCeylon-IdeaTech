import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type Listener = () => void;
let listeners: Listener[] = [];
let cachedNotifications: Notification[] = [];
let cachedUnreadCount: number = 0;
let cachedError: string | null = null;

const getApiUrl = () => process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';

const getHeaders = async () => {
  const token = await SecureStore.getItemAsync('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const notificationsStore = {
  getNotifications: () => cachedNotifications,
  getUnreadCount: () => cachedUnreadCount,
  getError: () => cachedError,
  
  fetchData: async () => {
    try {
      cachedError = null;
      const headers = await getHeaders();
      const res = await fetch(`${getApiUrl()}/tour-guide/notifications`, { headers });
      if (res.ok) {
        const data = await res.json();
        cachedNotifications = Array.isArray(data) ? data : (data.data || []);
        cachedUnreadCount = cachedNotifications.filter(n => !n.isRead).length;
        notificationsStore.notify();
      } else {
        cachedError = `HTTP Error: ${res.status}`;
        notificationsStore.notify();
      }
    } catch (error: any) {
      cachedError = error.message || 'Fetch failed';
      console.error('Failed to fetch notifications:', error);
      notificationsStore.notify();
    }
  },

  markAllRead: async () => {
    // Optimistic UI update
    cachedNotifications.forEach(n => n.isRead = true);
    cachedUnreadCount = 0;
    notificationsStore.notify();

    try {
      const headers = await getHeaders();
      await fetch(`${getApiUrl()}/tour-guide/notifications/read-all`, {
        method: 'PATCH',
        headers,
      });
    } catch (error) {
      console.error('Failed to mark all read:', error);
      // Re-fetch on error
      notificationsStore.fetchData();
    }
  },
  
  markRead: async (id: string) => {
    const n = cachedNotifications.find(n => n.id === id);
    if (n && !n.isRead) {
      // Optimistic UI update
      n.isRead = true;
      cachedUnreadCount = Math.max(0, cachedUnreadCount - 1);
      notificationsStore.notify();

      try {
        const headers = await getHeaders();
        await fetch(`${getApiUrl()}/tour-guide/notifications/${id}/read`, {
          method: 'PATCH',
          headers,
        });
      } catch (error) {
        console.error('Failed to mark read:', error);
        // Re-fetch on error
        notificationsStore.fetchData();
      }
    }
  },

  subscribe: (listener: Listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },

  notify: () => {
    listeners.forEach(listener => listener());
  }
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState(notificationsStore.getNotifications());
  const [unreadCount, setUnreadCount] = useState(notificationsStore.getUnreadCount());
  const [error, setError] = useState(notificationsStore.getError());

  useEffect(() => {
    // Fetch fresh data when hook mounts
    notificationsStore.fetchData();

    const unsubscribe = notificationsStore.subscribe(() => {
      setNotifications([...notificationsStore.getNotifications()]);
      setUnreadCount(notificationsStore.getUnreadCount());
      setError(notificationsStore.getError());
    });
    return unsubscribe;
  }, []);

  return {
    notifications,
    unreadCount,
    error,
    markAllRead: notificationsStore.markAllRead,
    markRead: notificationsStore.markRead,
    refresh: notificationsStore.fetchData,
  };
};
