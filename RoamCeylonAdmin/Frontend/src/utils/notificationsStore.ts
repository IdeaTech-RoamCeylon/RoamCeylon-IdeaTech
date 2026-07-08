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
      const res = await fetch(`${getApiUrl()}/notifications`, { headers });
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
    try {
      const headers = await getHeaders();
      await fetch(`${getApiUrl()}/notifications/read-all`, {
        method: 'PATCH',
        headers,
      });
      cachedNotifications = cachedNotifications.map(n => ({ ...n, isRead: true }));
      cachedUnreadCount = 0;
      notificationsStore.notify();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  },
  
  markRead: async (id: string) => {
    try {
      const headers = await getHeaders();
      // Optimistic update
      cachedNotifications = cachedNotifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      );
      cachedUnreadCount = Math.max(0, cachedUnreadCount - 1);
      notificationsStore.notify();

      await fetch(`${getApiUrl()}/notifications/${id}/read`, {
        method: 'PATCH',
        headers,
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
      // Re-fetch on error
      notificationsStore.fetchData();
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

export const useNotifications = (module?: string) => {
  const [state, setState] = useState({
    notifications: notificationsStore.getNotifications(),
    unreadCount: notificationsStore.getUnreadCount(),
    error: notificationsStore.getError(),
  });

  useEffect(() => {
    // Initial fetch if empty
    if (notificationsStore.getNotifications().length === 0 && !notificationsStore.getError()) {
      notificationsStore.fetchData();
    }

    const unsubscribe = notificationsStore.subscribe(() => {
      const allNotifications = notificationsStore.getNotifications();
      let filteredNotifications = allNotifications;

      // Basic filtering based on module parameter
      if (module === 'activity') {
        filteredNotifications = allNotifications.filter(n => 
          n.type?.toLowerCase().includes('activity') || 
          n.title?.toLowerCase().includes('activity')
        );
      } else if (module === 'shopping') {
        filteredNotifications = allNotifications.filter(n => 
          n.type?.toLowerCase().includes('shop') || 
          n.title?.toLowerCase().includes('shop')
        );
      } else if (module === 'guide') {
        filteredNotifications = allNotifications.filter(n => 
          n.type?.toLowerCase().includes('booking') || 
          n.title?.toLowerCase().includes('booking')
        );
      } else if (module === 'booking') {
        filteredNotifications = allNotifications.filter(n => 
          n.type?.toLowerCase().includes('hotel') || 
          n.title?.toLowerCase().includes('hotel') ||
          n.type?.toLowerCase().includes('room') ||
          n.title?.toLowerCase().includes('room')
        );
      }

      setState({
        notifications: filteredNotifications,
        unreadCount: filteredNotifications.filter(n => !n.isRead).length,
        error: notificationsStore.getError(),
      });
    });

    // Polling for real-time updates
    const pollInterval = setInterval(() => {
      notificationsStore.fetchData();
    }, 15000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [module]);

  return {
    ...state,
    markAllRead: notificationsStore.markAllRead,
    markRead: notificationsStore.markRead,
    refresh: notificationsStore.fetchData,
  };
};
