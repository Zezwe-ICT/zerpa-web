/**
 * @file lib/api/announcements.ts
 * @description Banners and "What's new" entries published from Zerpa HQ for this company.
 */
import { apiRequest } from "./client";

export interface Announcement {
  id: string;
  kind: "banner" | "whats_new";
  tone: "info" | "success" | "warning";
  title: string;
  body: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  publishedAt: string;
  seen: boolean;
}
export interface AnnouncementFeed { banners: Announcement[]; whatsNew: Announcement[]; unread: number }

let inflight: Promise<AnnouncementFeed> | null = null;
/** One request shared by the banner and the What's new button. */
export function loadAnnouncements(fresh = false) {
  if (!inflight || fresh) {
    inflight = apiRequest<AnnouncementFeed>("/announcements").catch(() => ({ banners: [], whatsNew: [], unread: 0 }));
  }
  return inflight;
}

export const markAnnouncement = (id: string, action: "seen" | "dismiss" | "click") =>
  apiRequest(`/announcements/${id}/${action}`, { method: "POST" }).catch(() => undefined);
export const markAllSeen = () => apiRequest("/announcements/seen", { method: "POST" }).catch(() => undefined);
