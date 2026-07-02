/**
 * @file lib/data/settings.ts
 * @description Mock settings data for the ZERPA settings module
 */

export interface NotificationPreference {
  id: string;
  name: string;
  description: string;
  channels: {
    email: boolean;
    inApp: boolean;
    sms: boolean;
  };
}

export interface SecuritySetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface EmailConfig {
  provider: "smtp" | "aws-ses" | "mailgun";
  host?: string;
  port?: number;
  username?: string;
  isConfigured: boolean;
}

export interface IntegrationStatus {
  id: string;
  name: string;
  description: string;
  status: "connected" | "disconnected" | "error";
  connectedAt?: string;
}

// Notification preferences
export const NOTIFICATION_PREFERENCES: NotificationPreference[] = [
  {
    id: "invoice-reminder",
    name: "Invoice Reminders",
    description: "Get notified when invoices are due or overdue",
    channels: { email: true, inApp: true, sms: false },
  },
  {
    id: "lead-updates",
    name: "Lead Status Changes",
    description: "Alerts when leads move between stages",
    channels: { email: true, inApp: true, sms: true },
  },
  {
    id: "system-alerts",
    name: "System Alerts",
    description: "Important system notifications and maintenance notices",
    channels: { email: true, inApp: true, sms: false },
  },
  {
    id: "payment-received",
    name: "Payment Received",
    description: "Notifications when payments are received",
    channels: { email: true, inApp: true, sms: true },
  },
  {
    id: "new-lead",
    name: "New Leads",
    description: "Alerts when new leads are assigned to you",
    channels: { email: true, inApp: false, sms: false },
  },
];

// Security settings
export const SECURITY_SETTINGS: SecuritySetting[] = [
  {
    id: "two-factor",
    name: "Two-Factor Authentication",
    description: "Require 2FA for account login",
    enabled: false,
  },
  {
    id: "ip-whitelist",
    name: "IP Whitelist",
    description: "Only allow access from specific IP addresses",
    enabled: false,
  },
  {
    id: "session-timeout",
    name: "Auto Session Timeout",
    description: "Automatically log out after 30 minutes of inactivity",
    enabled: true,
  },
  {
    id: "api-keys",
    name: "API Key Management",
    description: "Generate and manage API keys for integrations",
    enabled: true,
  },
  {
    id: "data-encryption",
    name: "End-to-End Encryption",
    description: "Encrypt sensitive data at rest",
    enabled: true,
  },
];

// Email configuration options
export const EMAIL_PROVIDERS = [
  { id: "smtp", label: "SMTP Server", description: "Use your own SMTP server" },
  { id: "aws-ses", label: "AWS SES", description: "Amazon Simple Email Service" },
  { id: "mailgun", label: "Mailgun", description: "Mailgun email service" },
];

// Current email config
export const CURRENT_EMAIL_CONFIG: EmailConfig = {
  provider: "smtp",
  host: "smtp.gmail.com",
  port: 587,
  username: "noreply@zerpa.co.za",
  isConfigured: true,
};

// Integrations
export const INTEGRATIONS: IntegrationStatus[] = [
  {
    id: "quickbooks",
    name: "QuickBooks",
    description: "Sync invoices and payments with QuickBooks",
    status: "connected",
    connectedAt: "2024-01-15",
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Automate workflows with Zapier",
    status: "disconnected",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Receive notifications in Slack",
    status: "connected",
    connectedAt: "2024-02-10",
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    description: "Export data to Google Sheets",
    status: "disconnected",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Accept payments via Stripe",
    status: "connected",
    connectedAt: "2023-12-20",
  },
  {
    id: "webhooks",
    name: "Custom Webhooks",
    description: "Configure custom webhooks for events",
    status: "connected",
    connectedAt: "2024-03-01",
  },
];

// Appearance settings
export interface AppearanceSettings {
  theme: "light" | "dark" | "system";
  primaryColor: string;
  fontSize: "small" | "medium" | "large";
  sidebarCollapsed: boolean;
}

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  theme: "light",
  primaryColor: "#7c3aed",
  fontSize: "medium",
  sidebarCollapsed: false,
};

// Localisation settings
export interface LocalisationSettings {
  currency: string;
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  language: string;
}

export const DEFAULT_LOCALISATION_SETTINGS: LocalisationSettings = {
  currency: "ZAR",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24H",
  timezone: "Africa/Johannesburg",
  language: "en",
};

// Available options
export const CURRENCY_OPTIONS = [
  { id: "ZAR", label: "South African Rand (R)" },
  { id: "USD", label: "US Dollar ($)" },
  { id: "EUR", label: "Euro (€)" },
  { id: "GBP", label: "British Pound (£)" },
];

export const DATE_FORMAT_OPTIONS = [
  { id: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { id: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { id: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

export const TIME_FORMAT_OPTIONS = [
  { id: "24H", label: "24-Hour (14:30)" },
  { id: "12H", label: "12-Hour (2:30 PM)" },
];

export const TIMEZONE_OPTIONS = [
  { id: "Africa/Johannesburg", label: "Africa/Johannesburg (SAST)" },
  { id: "Africa/Cairo", label: "Africa/Cairo (EAT)" },
  { id: "Africa/Lagos", label: "Africa/Lagos (WAT)" },
  { id: "Europe/London", label: "Europe/London (GMT)" },
  { id: "Europe/Paris", label: "Europe/Paris (CET)" },
  { id: "America/New_York", label: "America/New_York (EST)" },
  { id: "America/Los_Angeles", label: "America/Los_Angeles (PST)" },
  { id: "Asia/Singapore", label: "Asia/Singapore (SGT)" },
  { id: "Australia/Sydney", label: "Australia/Sydney (AEDT)" },
];

export const LANGUAGE_OPTIONS = [
  { id: "en", label: "English" },
  { id: "af", label: "Afrikaans" },
  { id: "zu", label: "Zulu" },
  { id: "xh", label: "Xhosa" },
];
