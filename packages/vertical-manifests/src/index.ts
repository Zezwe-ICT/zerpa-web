/**
 * Vertical pack manifests — versioned configuration for navigation, roles,
 * onboarding, dashboards, workflows, and assistant skills.
 */

export type VerticalId =
  | "MSP"
  | "TELECOM"
  | "FUNERAL"
  | "SPA"
  | "RESTAURANT"
  | "AUTOMOTIVE"
  | "GENERIC";

export type VerticalPriority = "FLAGSHIP" | "PRIORITY" | "STANDARD";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  children?: NavItem[];
}

export interface RolePreset {
  id: string;
  label: string;
  permissions: string[];
}

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  required: boolean;
}

export interface WorkflowTemplate {
  id: string;
  label: string;
  entity: string;
  states: string[];
}

export interface AssistantSkill {
  id: string;
  label: string;
  description: string;
  requiresApproval: boolean;
}

export interface VerticalManifest {
  id: VerticalId;
  name: string;
  version: string;
  priority: VerticalPriority;
  description: string;
  workItemLabel: string;
  workItemLabelPlural: string;
  accentColor: string;
  navigation: NavItem[];
  roles: RolePreset[];
  onboarding: OnboardingStep[];
  dashboards: { id: string; label: string; kpis: string[] }[];
  workflows: WorkflowTemplate[];
  assistantSkills: AssistantSkill[];
  modules: string[];
}

const coreCrmNav: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "dashboard", icon: "LayoutDashboard" },
  { id: "customers", label: "Customers", href: "clients", icon: "Building2" },
  { id: "crm", label: "CRM", href: "crm/leads", icon: "Users" },
  { id: "billing", label: "Billing", href: "billing/invoices", icon: "Receipt" },
  { id: "reports", label: "Reports", href: "reports", icon: "BarChart3" },
  { id: "settings", label: "Settings", href: "settings", icon: "Settings" },
];

const coreRoles: RolePreset[] = [
  {
    id: "owner",
    label: "Owner",
    permissions: ["*"],
  },
  {
    id: "admin",
    label: "Admin",
    permissions: ["company.read", "company.write", "users.manage", "billing.*", "crm.*", "work.*"],
  },
  {
    id: "staff",
    label: "Staff",
    permissions: ["company.read", "crm.read", "crm.write", "work.read", "work.write", "billing.read"],
  },
  {
    id: "finance",
    label: "Finance",
    permissions: ["company.read", "billing.*", "crm.read", "reports.read"],
  },
  {
    id: "portal_user",
    label: "Portal User",
    permissions: ["portal.read", "portal.write_own"],
  },
];

const nestOnboarding: OnboardingStep[] = [
  { id: "account", label: "Account & MFA", description: "Verify email and enable MFA", required: true },
  { id: "company", label: "Company & location", description: "Legal entity and first branch", required: true },
  { id: "pack", label: "Vertical pack", description: "Needs assessment and pack install", required: true },
  { id: "team", label: "Invite team", description: "Role presets and least privilege", required: true },
  { id: "import", label: "Import data", description: "CSV customers/products with preview", required: false },
  { id: "integrations", label: "Integrations", description: "Email, payments, vertical systems", required: false },
  { id: "branding", label: "Branding & VAT", description: "Invoice details and business hours", required: true },
  { id: "nest", label: "Nest launch checklist", description: "Guided first transaction", required: true },
  { id: "golive", label: "Go live", description: "Final checks and 30-day adoption", required: true },
];

export const MSP_MANIFEST: VerticalManifest = {
  id: "MSP",
  name: "Managed Service Provider",
  version: "1.0.0",
  priority: "FLAGSHIP",
  description: "MSP process OS: client onboarding, agreements, commercial billing, and optional work bridge to existing PSA/RMM.",
  workItemLabel: "Ticket",
  workItemLabelPlural: "Tickets",
  accentColor: "#1d4ed8",
  navigation: [
    ...coreCrmNav.slice(0, 2),
    { id: "onboarding", label: "Client Onboarding", href: "client-onboarding", icon: "Workflow" },
    { id: "agreements", label: "Agreements", href: "agreements", icon: "FileText" },
    { id: "tickets", label: "Work Bridge", href: "tickets", icon: "Ticket" },
    { id: "dispatcher", label: "Dispatcher", href: "dispatcher", icon: "Workflow" },
    { id: "assets", label: "Assets", href: "assets", icon: "Server" },
    { id: "time", label: "Time", href: "time", icon: "Clock" },
    ...coreCrmNav.slice(2),
  ],
  roles: [
    ...coreRoles,
    {
      id: "service_manager",
      label: "Service Manager",
      permissions: ["work.*", "crm.*", "agreements.*", "reports.read", "billing.read"],
    },
    {
      id: "technician",
      label: "Technician",
      permissions: ["work.read", "work.write", "time.write", "assets.read", "crm.read"],
    },
    {
      id: "dispatcher",
      label: "Dispatcher",
      permissions: ["work.*", "crm.read", "assets.read"],
    },
  ],
  onboarding: nestOnboarding,
  dashboards: [
    {
      id: "ops",
      label: "Service Operations",
      kpis: ["open_tickets", "sla_at_risk", "utilization", "mrr"],
    },
  ],
  workflows: [
    {
      id: "ticket_lifecycle",
      label: "Ticket lifecycle",
      entity: "ticket",
      states: ["new", "triaged", "in_progress", "waiting_customer", "resolved", "closed", "cancelled"],
    },
  ],
  assistantSkills: [
    { id: "ticket_summary", label: "Summarize ticket", description: "Summarize history and assets", requiresApproval: false },
    { id: "suggest_priority", label: "Suggest priority", description: "Recommend priority/category", requiresApproval: false },
    { id: "sla_risk", label: "SLA risk warning", description: "Flag SLA breach risk", requiresApproval: false },
    { id: "draft_reply", label: "Draft customer reply", description: "Customer-safe response draft", requiresApproval: true },
    { id: "draft_time", label: "Draft time entry", description: "Propose billable time", requiresApproval: true },
    { id: "qbr-pack", label: "QBR pack", description: "Approval-gated QBR summary", requiresApproval: true },
  ],
  modules: ["crm", "tickets", "agreements", "assets", "time", "billing", "portal", "knowledge"],
};

export const TELECOM_MANIFEST: VerticalManifest = {
  id: "TELECOM",
  name: "ISP & Telecom Reseller",
  version: "1.0.0",
  priority: "FLAGSHIP",
  description: "Subscriber CRM, RICA, orders, provisioning, recurring billing, and dunning for ISPs/resellers.",
  workItemLabel: "Service Order",
  workItemLabelPlural: "Service Orders",
  accentColor: "#0f766e",
  navigation: [
    ...coreCrmNav.slice(0, 2),
    { id: "subscribers", label: "Subscribers", href: "subscribers", icon: "UserCheck" },
    { id: "orders", label: "Orders", href: "orders", icon: "Package" },
    { id: "installs", label: "Installs", href: "installs", icon: "Wrench" },
    { id: "porting", label: "Porting", href: "porting", icon: "Phone" },
    { id: "services", label: "Services", href: "services", icon: "Wifi" },
    { id: "rica", label: "RICA", href: "rica", icon: "ShieldCheck" },
    { id: "outages", label: "Outages", href: "outages", icon: "AlertTriangle" },
    { id: "dunning", label: "Dunning", href: "dunning", icon: "AlertCircle" },
    ...coreCrmNav.slice(2),
  ],
  roles: [
    ...coreRoles,
    {
      id: "provisioning",
      label: "Provisioning",
      permissions: ["orders.*", "services.*", "crm.read", "work.*"],
    },
    {
      id: "rica_reviewer",
      label: "RICA Reviewer",
      permissions: ["rica.*", "crm.read", "documents.*"],
    },
    {
      id: "field_installer",
      label: "Field Installer",
      permissions: ["work.read", "work.write", "orders.read", "services.read"],
    },
    {
      id: "noc",
      label: "NOC / Support",
      permissions: ["outages.*", "services.read", "work.*", "crm.read"],
    },
  ],
  onboarding: nestOnboarding,
  dashboards: [
    {
      id: "ops",
      label: "Network & Subscribers",
      kpis: ["active_subscribers", "orders_in_flight", "rica_pending", "arrears"],
    },
  ],
  workflows: [
    {
      id: "order_to_activate",
      label: "Order to activation",
      entity: "service_order",
      states: [
        "lead",
        "qualified",
        "quoted",
        "rica_pending",
        "provisioning",
        "installing",
        "active",
        "suspended",
        "cancelled",
      ],
    },
  ],
  assistantSkills: [
    { id: "order_deps", label: "Missing dependencies", description: "Check order blockers", requiresApproval: false },
    { id: "provision_summary", label: "Provisioning summary", description: "Summarize activation steps", requiresApproval: false },
    { id: "outage_impact", label: "Outage impact", description: "List impacted subscribers", requiresApproval: false },
    { id: "billing_anomaly", label: "Billing anomaly", description: "Explain bill variance", requiresApproval: false },
    { id: "customer_update", label: "Draft customer update", description: "Status message draft", requiresApproval: true },
  ],
  modules: ["crm", "subscribers", "orders", "rica", "services", "devices", "billing", "dunning", "portal"],
};

export const FUNERAL_MANIFEST: VerticalManifest = {
  id: "FUNERAL",
  name: "Funeral Parlour",
  version: "1.0.0",
  priority: "PRIORITY",
  description: "Case intake, arrangements, compliance docs, scheduling, and family portal.",
  workItemLabel: "Case",
  workItemLabelPlural: "Cases",
  accentColor: "#6d28d9",
  navigation: [
    ...coreCrmNav.slice(0, 2),
    { id: "cases", label: "Cases", href: "cases", icon: "FolderHeart" },
    { id: "schedule", label: "Schedule", href: "schedule", icon: "Calendar" },
    ...coreCrmNav.slice(2),
  ],
  roles: [
    ...coreRoles,
    {
      id: "arranger",
      label: "Funeral Arranger",
      permissions: ["cases.*", "crm.*", "documents.*", "billing.read"],
    },
  ],
  onboarding: nestOnboarding,
  dashboards: [
    { id: "ops", label: "Cases & Schedule", kpis: ["active_cases", "funerals_this_week", "missing_docs", "outstanding"] },
  ],
  workflows: [
    {
      id: "case_lifecycle",
      label: "Case lifecycle",
      entity: "funeral_case",
      states: ["intake", "active", "pending_burial", "completed", "closed"],
    },
  ],
  assistantSkills: [
    { id: "case_summary", label: "Summarize case", description: "Family-safe case summary", requiresApproval: false },
    { id: "missing_docs", label: "Missing documents", description: "List compliance gaps", requiresApproval: false },
  ],
  modules: ["crm", "cases", "schedule", "compliance", "billing", "portal"],
};

export const SPA_MANIFEST: VerticalManifest = {
  id: "SPA",
  name: "Spa & Wellness",
  version: "1.0.0",
  priority: "STANDARD",
  description: "Bookings, therapists, packages/memberships, POS retail, and consented treatment notes.",
  workItemLabel: "Booking",
  workItemLabelPlural: "Bookings",
  accentColor: "#065f46",
  navigation: [
    ...coreCrmNav.slice(0, 2),
    { id: "bookings", label: "Bookings", href: "bookings", icon: "Calendar" },
    ...coreCrmNav.slice(2),
  ],
  roles: [
    ...coreRoles,
    {
      id: "therapist",
      label: "Therapist",
      permissions: ["bookings.read", "bookings.write_own", "clients.read", "notes.write"],
    },
    {
      id: "front_desk",
      label: "Front Desk",
      permissions: ["bookings.*", "crm.*", "billing.write", "memberships.read"],
    },
  ],
  onboarding: nestOnboarding,
  dashboards: [
    { id: "ops", label: "Bookings", kpis: ["today_bookings", "utilization", "memberships_active", "retail_sales"] },
  ],
  workflows: [
    {
      id: "booking_lifecycle",
      label: "Booking lifecycle",
      entity: "spa_booking",
      states: ["booked", "checked_in", "in_service", "completed", "cancelled", "no_show"],
    },
  ],
  assistantSkills: [
    { id: "rebook_suggest", label: "Suggest rebooking", description: "Next visit recommendation", requiresApproval: false },
  ],
  modules: ["crm", "bookings", "therapists", "memberships", "pos", "billing", "portal"],
};

export const RESTAURANT_MANIFEST: VerticalManifest = {
  id: "RESTAURANT",
  name: "Restaurant",
  version: "1.0.0",
  priority: "STANDARD",
  description: "Guest CRM, reservations, catering pipeline, loyalty, and POS integrations.",
  workItemLabel: "Reservation",
  workItemLabelPlural: "Reservations",
  accentColor: "#065f46",
  navigation: [
    ...coreCrmNav.slice(0, 2),
    { id: "reservations", label: "Reservations", href: "reservations", icon: "Calendar" },
    ...coreCrmNav.slice(2),
  ],
  roles: [
    ...coreRoles,
    {
      id: "host",
      label: "Host",
      permissions: ["reservations.*", "guests.read", "guests.write"],
    },
  ],
  onboarding: nestOnboarding,
  dashboards: [
    { id: "ops", label: "Front of house", kpis: ["covers_today", "no_shows", "loyalty_redemptions", "catering_pipeline"] },
  ],
  workflows: [
    {
      id: "reservation_lifecycle",
      label: "Reservation lifecycle",
      entity: "reservation",
      states: ["booked", "seated", "completed", "cancelled", "no_show"],
    },
  ],
  assistantSkills: [
    { id: "recovery", label: "Feedback recovery", description: "Draft recovery outreach", requiresApproval: true },
  ],
  modules: ["crm", "reservations", "loyalty", "catering", "billing", "pos_integration"],
};

export const AUTOMOTIVE_MANIFEST: VerticalManifest = {
  id: "AUTOMOTIVE",
  name: "Automotive Workshop",
  version: "1.0.0",
  priority: "STANDARD",
  description: "Vehicles, job cards, estimates, parts, and customer portal.",
  workItemLabel: "Job Card",
  workItemLabelPlural: "Job Cards",
  accentColor: "#1d4ed8",
  navigation: [
    ...coreCrmNav.slice(0, 2),
    { id: "job_cards", label: "Job Cards", href: "job-cards", icon: "Wrench" },
    ...coreCrmNav.slice(2),
  ],
  roles: [
    ...coreRoles,
    {
      id: "mechanic",
      label: "Mechanic",
      permissions: ["job_cards.read", "job_cards.write", "vehicles.read", "inventory.read"],
    },
    {
      id: "service_advisor",
      label: "Service Advisor",
      permissions: ["job_cards.*", "crm.*", "billing.write", "vehicles.*"],
    },
  ],
  onboarding: nestOnboarding,
  dashboards: [
    { id: "ops", label: "Workshop", kpis: ["open_jobs", "waiting_approval", "low_stock", "revenue_month"] },
  ],
  workflows: [
    {
      id: "job_card_lifecycle",
      label: "Job card lifecycle",
      entity: "job_card",
      states: [
        "booked",
        "checked_in",
        "diagnosing",
        "awaiting_approval",
        "in_progress",
        "qa",
        "ready",
        "invoiced",
        "collected",
        "cancelled",
      ],
    },
  ],
  assistantSkills: [
    { id: "estimate_summary", label: "Estimate summary", description: "Summarize labour and parts", requiresApproval: false },
  ],
  modules: ["crm", "job_cards", "vehicles", "inventory", "billing", "portal"],
};

export const GENERIC_MANIFEST: VerticalManifest = {
  id: "GENERIC",
  name: "Generic CRM",
  version: "1.0.0",
  priority: "STANDARD",
  description: "Shared CRM kernel for companies without a specialised vertical pack yet.",
  workItemLabel: "Task",
  workItemLabelPlural: "Tasks",
  accentColor: "#1d3461",
  navigation: coreCrmNav,
  roles: coreRoles,
  onboarding: nestOnboarding,
  dashboards: [
    { id: "ops", label: "Pipeline", kpis: ["open_leads", "pipeline_value", "overdue_invoices", "tasks_due"] },
  ],
  workflows: [
    {
      id: "lead_pipeline",
      label: "Lead pipeline",
      entity: "lead",
      states: ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"],
    },
  ],
  assistantSkills: [
    { id: "lead_summary", label: "Summarize lead", description: "Pipeline and activity summary", requiresApproval: false },
  ],
  modules: ["crm", "billing", "tasks", "portal"],
};

export const VERTICAL_MANIFESTS: Record<VerticalId, VerticalManifest> = {
  MSP: MSP_MANIFEST,
  TELECOM: TELECOM_MANIFEST,
  FUNERAL: FUNERAL_MANIFEST,
  SPA: SPA_MANIFEST,
  RESTAURANT: RESTAURANT_MANIFEST,
  AUTOMOTIVE: AUTOMOTIVE_MANIFEST,
  GENERIC: GENERIC_MANIFEST,
};

export const LAUNCH_ORDER: VerticalId[] = [
  "MSP",
  "TELECOM",
  "FUNERAL",
  "SPA",
  "RESTAURANT",
  "AUTOMOTIVE",
  "GENERIC",
];

/** Normalize legacy aliases to canonical IDs. */
export function normalizeVerticalId(raw?: string | null): VerticalId {
  if (!raw) return "GENERIC";
  const key = raw.trim().toUpperCase();
  if (key === "AUTO") return "AUTOMOTIVE";
  if (key === "TECH" || key === "ICT") return "MSP";
  if (key in VERTICAL_MANIFESTS) return key as VerticalId;
  return "GENERIC";
}

export function getVerticalManifest(id: string | null | undefined): VerticalManifest {
  return VERTICAL_MANIFESTS[normalizeVerticalId(id)];
}
