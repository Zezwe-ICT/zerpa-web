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

// ── Billing shared primitives ────────────────────────────────
/** Document-level discount mode used on quotes and invoices. */
export type DiscountType = "none" | "percent" | "fixed";

/**
 * Lightweight customer reference for billing documents.
 * In this app "customers" are CLOSED_WON leads (see lib/data/billing-customers.ts),
 * projected into this shape for quote/invoice/automation selectors.
 */
export interface BillingCustomer {
  id: string;
  name: string;
  vertical?: Vertical;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  vatNumber?: string;
  postalAddress?: string;
  deliveryAddress?: string;
  /** Default payment terms in days for invoices raised against this customer. */
  paymentTermsDays?: number;
}

// ── Products & Services ──────────────────────────────────────
export type ProductCategory =
  | "managed_service"
  | "once_off"
  | "hardware"
  | "licence"
  | "project"
  | "other";

export type ProductBillingCycle = "monthly" | "annually" | "once_off";

export interface ProductService {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  unit?: string | null;
  unitPrice: number;
  taxRate: number; // default 15
  billingCycle: ProductBillingCycle;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Shared billing line item ─────────────────────────────────
/**
 * Rich line item shared by quotes, invoices and automation configs.
 * lineTotal is qty × unitPrice × (1 - discountPercent/100), tax added separately.
 */
export interface BillingLineItem {
  id?: string;
  productServiceId?: string | null;
  description: string;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  discountPercent?: number; // line-level, default 0
  taxRate?: number; // default 15
  lineTotal?: number;
  sortOrder?: number;
}

// ── Quotes ───────────────────────────────────────────────────
export type QuoteStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "declined"
  | "expired"
  | "converted"
  | "void";

export type QuoteLineItem = BillingLineItem;

export interface Quote {
  id: string;
  quoteNumber: string; // QUO-YYYY-XXXX
  customerId: string;
  customerName: string;
  contactPerson?: string | null;
  contactEmail?: string | null;
  status: QuoteStatus;
  reference?: string | null;
  issueDate: string;
  expiryDate: string; // "VALID UNTIL"
  currency: string;
  salesRep?: string | null;
  subject?: string | null;
  scopeOfWork?: string | null;
  termsAndConditions?: string | null;
  paymentTerms?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
  discountType: DiscountType;
  discountValue: number;
  subtotal: number;
  discountAmount: number;
  taxTotal: number;
  total: number;
  convertedInvoiceId?: string | null;
  lineItems: QuoteLineItem[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  sentAt?: string | null;
}

// ── Invoices ─────────────────────────────────────────────────
export type InvoiceStatus =
  | "DRAFT"
  | "APPROVED"
  | "SENT"
  | "PAID"
  | "OVERDUE"
  | "PARTIALLY_PAID"
  | "CANCELLED"
  | "VOID";

export type InvoiceType = "SETUP" | "SUBSCRIPTION" | "AD_HOC";

export type InvoiceSource = "manual" | "converted_quote" | "automated";

export type PaymentMethod = "eft" | "cash" | "card" | "other";

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
  createdAt: string;
}

/**
 * Invoice line item. Kept backward-compatible with the original
 * {description, quantity, unitPrice, total} shape used by the client portals,
 * while adding the richer fields (unit, discountPercent, taxRate, lineTotal)
 * described in ZERPA_BILLING_SPEC.md.
 */
export interface InvoiceLineItem {
  id?: string;
  productServiceId?: string | null;
  description: string;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  discountPercent?: number;
  taxRate?: number;
  lineTotal?: number;
  sortOrder?: number;
  /** Original simple total (retained for existing consumers). */
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // INV-YYYY-XXXX (legacy data may be ZRP-YYYY-XXXX)
  tenantId: string;
  tenantName: string;
  tenantVertical: Vertical; // for client portal filtering
  type: InvoiceType;
  status: InvoiceStatus;

  // Provenance
  source?: InvoiceSource;
  quoteId?: string | null;
  automatedConfigId?: string | null;
  reference?: string | null;
  contactEmail?: string | null;
  salesRep?: string | null;
  subject?: string | null;

  // Amounts
  subtotal: number;
  taxAmount: number;
  total: number;
  taxRate?: number;
  currency: string;

  // Document-level discount
  discountType?: DiscountType;
  discountValue?: number;
  discountAmount?: number;

  // Payment tracking
  amountPaid?: number;
  balanceDue?: number;
  payments?: Payment[];

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
  internalNotes?: string | null;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ── Automated Invoices ───────────────────────────────────────
export type AutomationRecurrence =
  | "monthly_indefinite"
  | "monthly_fixed_term"
  | "once";

export type AutomationGenerationMode = "draft" | "auto_send";

export type OneTimeAdditionStatus = "pending" | "billed" | "cancelled";

export interface AutomatedInvoiceConfigLineItem {
  id: string;
  productServiceId?: string | null;
  customDescription?: string | null;
  customUnitPrice?: number | null;
  description: string;
  unit?: string | null;
  unitPrice: number;
  taxRate?: number;
  quantity: number;
  sortOrder?: number;
}

export interface AutomatedInvoiceOneTimeAddition {
  id: string;
  configId: string;
  billingMonth: string; // first-of-month ISO date
  productServiceId?: string | null;
  description: string;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  taxRate?: number;
  notes?: string | null;
  status: OneTimeAdditionStatus;
  createdAt: string;
}

export interface AutomatedInvoiceConfig {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  isActive: boolean;
  recurrence: AutomationRecurrence;
  startDate: string;
  endDate?: string | null;
  dayOfMonth: number; // 1–28
  generationMode: AutomationGenerationMode;
  paymentTermsDays: number;
  subjectTemplate: string;
  notesTemplate?: string | null;
  internalNotes?: string | null;
  nextRunDate: string;
  lastRunDate?: string | null;
  lineItems: AutomatedInvoiceConfigLineItem[];
  oneTimeAdditions: AutomatedInvoiceOneTimeAddition[];
  createdAt: string;
  updatedAt: string;
}

// ── Billing Settings (singleton) ─────────────────────────────
export interface BillingSettings {
  invoicePrefix: string; // "INV"
  quotePrefix: string; // "QUO"
  defaultPaymentTermsDays: number; // 30
  defaultVatRate: number; // 15
  defaultQuoteValidityDays: number; // 30
  invoiceEmailSubjectTemplate: string;
  invoiceEmailBodyTemplate: string;
  quoteEmailSubjectTemplate: string;
  companyName: string;
  companyVatNumber?: string;
  companyRegistrationNumber?: string;
  companyPostalAddress?: string;
  companyDeliveryAddress?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankBranchCode?: string;
  bankBranchName?: string;
  bankSwiftCode?: string;
  proofOfPaymentEmail?: string;
  logoUrl?: string;
  footerNotes?: string;
  overdueReminderDays: number[]; // e.g. [3, 7, 14, 30]
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

export type LeadActivityType = "CALL" | "EMAIL" | "MEETING" | "NOTE" | "STAGE_CHANGE";

export interface LeadActivity {
  id: string;
  leadId: string;
  type: LeadActivityType;
  date: string;
  summary: string;
  notes?: string;
  nextSteps?: string;
  agentName?: string;
  durationMinutes?: number;
  stageChangedTo?: LeadStatus;
  stageChangedFrom?: LeadStatus;
}

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
  /** Deal title – distinguishes leads from companies with similar names */
  title?: string;
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
  activities?: LeadActivity[];
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

// ── Lead Finder (map-based prospecting) ──────────────────────
/** A business returned by a lead-finder provider (e.g. SerpApi Google Maps). */
export interface ScrapedBusiness {
  /** Provider place id (Google place_id via SerpApi). Stable dedupe key. */
  id: string;
  name: string;
  category?: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviews?: number;
  latitude?: number;
  longitude?: number;
  thumbnail?: string;
  /** Provider the result came from, e.g. "serpapi_google_maps". */
  source: string;
}

export interface LeadFinderSearchParams {
  /** What to search for, e.g. "funeral parlour". */
  query: string;
  /** Free-text location appended to the query, e.g. "Soweto, Johannesburg". */
  location?: string;
  /** Country bias (Google gl), default "za". */
  country?: string;
  /** Result page (0-based); maps to SerpApi start offset. */
  page?: number;
}

export interface LeadFinderSearchResponse {
  results: ScrapedBusiness[];
  provider: string;
  query: string;
  error?: string;
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
