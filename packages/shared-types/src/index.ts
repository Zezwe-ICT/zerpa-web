// Core domain types for ZERPA ERP

// ── Verticals ───────────────────────────────────────────────
export type Vertical = "FUNERAL" | "AUTOMOTIVE" | "RESTAURANT" | "SPA";

export type VerticalPriority = "FLAGSHIP" | "PRIORITY" | "STANDARD";

export interface VerticalConfig {
  id: Vertical;
  name: string;
  priority: VerticalPriority;
  description: string;
}

// ── Users & Auth ─────────────────────────────────────────────
export interface User {
  sub: string;
  email: string;
  fullName: string;
  role: "zerpa_admin" | "zerpa_agent" | "zerpa_support" | "tenant_admin" | "tenant_staff";
  tenantId?: string;
  vertical?: Vertical;
  createdAt: string;
  updatedAt: string;
}

// ── Tenants / Clients ────────────────────────────────────────
export type TenantStatus = "TRIAL" | "ACTIVE" | "SUSPENDED" | "CANCELLED";

export interface Tenant {
  id: string;
  name: string;
  vertical: Vertical;
  status: TenantStatus;
  billingEmail: string;
  billingPhone: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country: string;
  createdAt: string;
  updatedAt: string;
  trialEndsAt?: string;
}

// ── Invoices ─────────────────────────────────────────────────
export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "VOID";

export type InvoiceType = "SETUP" | "SUBSCRIPTION" | "AD_HOC";

export interface InvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // ZRP-YYYY-XXXX format
  tenantId: string;
  tenantName: string;
  tenantVertical: Vertical; // for client portal filtering
  type: InvoiceType;
  status: InvoiceStatus;
  
  // Amounts
  subtotal: number;
  taxAmount: number;
  total: number;
  taxRate?: number;
  currency: string;
  
  // Dates
  issuedDate: string;
  dueDate: string;
  
  // Status tracking
  paidAt?: string;
  sentAt?: string;
  voidedAt?: string;
  
  // Details
  lineItems: InvoiceLineItem[];
  notes?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ── CRM & Leads ──────────────────────────────────────────────
export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "CLOSED_WON"
  | "CLOSED_LOST";

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  contactId: string;
  contact?: Contact;
  company: string;
  vertical: Vertical;
  status: LeadStatus;
  estimatedValue: number;
  currency: string;
  assignedAgentId?: string;
  assignedAgent?: User;
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
  notes?: string;
}

// ── Nest Sales ───────────────────────────────────────────────
export type NestSaleStatus = "PENDING" | "SETUP" | "ACTIVE" | "SUSPENDED";

export interface NestSale {
  id: string;
  tenantId: string;
  tenant?: Tenant;
  status: NestSaleStatus;
  setupFeeAmount: number;
  setupFeePaid: boolean;
  setupFeePaidAt?: string;
  monthlyAmount: number;
  trialStartAt: string;
  trialEndsAt: string;
  billingStartAt: string;
  assignedAgentId?: string;
  assignedAgent?: User;
  createdAt: string;
  updatedAt: string;
}

export interface ProvisioningChecklistItem {
  id: string;
  nestSaleId: string;
  label: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
  order: number;
}

// ── Funeral Vertical ─────────────────────────────────────────
export type FuneralServiceType = "BURIAL" | "CREMATION" | "REPATRIATION";

export type FuneralCaseStatus = "INTAKE" | "ACTIVE" | "PENDING_BURIAL" | "CLOSED";

export interface FuneralCase {
  id: string;
  tenantId: string;
  caseNumber: string; // FUN-YYYY-XXX format
  deceasedFirstName: string;
  deceasedLastName: string;
  deceasedIdNumber?: string;
  dateOfBirth?: string;
  dateOfDeath: string;
  causeOfDeath?: string;
  serviceType: FuneralServiceType;
  funeralDate: string;
  funeralTime: string;
  nextOfKinName: string;
  nextOfKinRelationship: string;
  nextOfKinPhone: string;
  nextOfKinEmail?: string;
  alternativeContactName?: string;
  alternativeContactPhone?: string;
  chapelId?: string;
  hearseRequired: boolean;
  packageId?: string;
  packagePrice?: number;
  depositPaid: number;
  paymentPlan?: boolean;
  status: FuneralCaseStatus;
  complianceDocs?: {
    deathCertificate?: { uploaded: boolean; url?: string };
    burialOrder?: { uploaded: boolean; url?: string };
    policeClearance?: { uploaded: boolean; url?: string };
    cremationPermit?: { uploaded: boolean; url?: string };
  };
  createdAt: string;
  updatedAt: string;
}

// ── Automotive Vertical ──────────────────────────────────────
export type JobCardStatus = "CHECKED_IN" | "DIAGNOSED" | "IN_PROGRESS" | "QUALITY_CHECK" | "READY" | "COLLECTED";

export interface AutomobileJobCard {
  id: string;
  tenantId: string;
  jobNumber: string; // AUTO-YYYY-XXX format
  vehicleRegistration: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  ownerName: string;
  ownerPhone?: string;
  mileage: number;
  status: JobCardStatus;
  bayId?: string;
  mechanicId?: string;
  mechanic?: User;
  workDescription?: string;
  labourItems: {
    id?: string;
    description: string;
    hours: number;
    ratePerHour: number;
  }[];
  partsUsed: {
    id?: string;
    partNumber: string;
    description: string;
    qty: number;
    unitPrice: number;
  }[];
  quoteAmount?: number;
  finalAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  tenantId: string;
  partNumber: string;
  description: string;
  category: string;
  stockLevel: number;
  reorderThreshold: number;
  unitCost: number;
  supplierId?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Restaurant Vertical ──────────────────────────────────────
export type RestaurantOrderStatus = "RECEIVED" | "IN_KITCHEN" | "READY" | "SERVED";

export interface RestaurantOrderItem {
  id: string;
  menuItemId: string;
  name: string;
  qty: number;
  specialInstructions?: string;
  ready: boolean;
}

export interface RestaurantOrder {
  id: string;
  tenantId: string;
  orderNumber: string; // ORD-YYYY-XXX format
  status: RestaurantOrderStatus;
  tableNumber?: string;
  customerName?: string;
  isPdq: boolean;
  items: RestaurantOrderItem[];
  notes?: string;
  receivedAt: string;
  readyAt?: string;
  servedAt?: string;
  totalAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  available: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Spa / Wellness Vertical ──────────────────────────────────
export interface SpatherapistService {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}

export interface SpaTherapist {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  services: SpatherapistService[];
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SpaBooking {
  id: string;
  tenantId: string;
  bookingNumber: string; // BK-YYYY-XXX format
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  therapistId: string;
  therapist?: SpaTherapist;
  serviceId: string;
  service?: SpatherapistService;
  bookingDate: string;
  bookingTime: string;
  durationMinutes: number;
  status: "CONFIRMED" | "COMPLETED" | "CANCELLED";
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Activity / Timeline ──────────────────────────────────────
export interface TimelineEvent {
  id: string;
  entityType: "lead" | "invoice" | "case" | "order" | "booking";
  entityId: string;
  action: string;
  description: string;
  userId?: string;
  createdAt: string;
}
