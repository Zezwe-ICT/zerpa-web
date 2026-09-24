/**
 * The signed-in person's notifications (bell) and notification preferences.
 */
import { apiRequest } from "./client";

export interface AppNotification {
  id: string;
  kind: "quote_accepted" | "quote_declined" | "payment_received" | string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationKindPref {
  key: string;
  label: string;
  description: string;
  inApp: boolean;
  email: boolean;
}

export const getNotifications = (limit = 20) =>
  apiRequest<{ unread: number; items: AppNotification[] }>(`/notifications?limit=${limit}`);

export const markNotificationsRead = (body: { ids: string[] } | { all: true }) =>
  apiRequest<{ marked: number }>("/notifications/read", { method: "POST", body });

export const getNotificationPreferences = () =>
  apiRequest<{ kinds: NotificationKindPref[]; email: string }>("/notifications/preferences");

export const updateNotificationPreferences = (kinds: Record<string, { inApp: boolean; email: boolean }>) =>
  apiRequest<{ kinds: NotificationKindPref[]; email: string }>("/notifications/preferences", {
    method: "PUT",
    body: { kinds },
  });
