// Core domain types for ZERPA ERP
// Canonical vertical IDs — see docs/GLOSSARY.md and @zerpa/vertical-manifests

// ── Verticals ───────────────────────────────────────────────
export type Vertical =
  | "MSP"
  | "TELECOM"
  | "FUNERAL"
  | "SPA"
  | "RESTAURANT"
  | "AUTOMOTIVE"
  | "GENERIC";

/** @deprecated Use AUTOMOTIVE */
export type LegacyVerticalAlias = "AUTO" | "TECH";

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
  /** Set when the customer's personal details were erased on request (POPIA). */
  erasedAt?: string | null;
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
  /** Stock-lite (once-off products only). */
  sku?: string | null;
  trackStock?: boolean;
  stockOnHand?: number;
  reorderLevel?: number;
  costPrice?: number;
  lowStock?: boolean;
  /** Create only: starting quantity when tracking stock. */
  openingStock?: number;
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
  /** Customer link for viewing and accepting online, once shared. */
  shareUrl?: string | null;
  /** When and by whom the customer accepted or declined online. */
  respondedAt?: string | null;
  responderName?: string | null;
  responderEmail?: string | null;
  /** Set when the company requires approval for quotes over a limit. */
  approval?: {
    required: boolean;
    limit: number | null;
    status: "approved" | "pending" | "rejected" | "cancelled" | "stale" | null;
    requestId?: string | null;
    note?: string | null;
  };
  /** Evidence captured when the customer signed online. */
  signature?: {
    method: "drawn" | "typed";
    image: string | null;
    name: string;
    email: string | null;
    at: string | null;
    ip: string | null;
    userAgent: string | null;
    contentHash: string;
    /** False if the quote was changed after it was signed. */
    unchanged: boolean;
  } | null;
  declineReason?: string | null;
  /** Deposit asked for on acceptance, as a % of the total (0 = none). */
  depositPercent?: number;
  deposit?: QuoteDeposit | null;
  emailDelivery?: { status: "queued" | "sent" | "failed"; at?: string; note?: string } | null;
}

export interface QuoteDeposit {
  percent: number;
  amount: number;
  invoiceId: string | null;
  invoiceNumber: string | null;
  invoiceStatus: string | null;
  payUrl: string | null;
  paid: boolean;
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
  | "VOID"
  | "ISSUED"
  // Cleared by credit notes rather than payment
  | "CREDITED"
  // Credit notes: fully used against the invoice, or refund paid out
  | "APPLIED"
  | "REFUNDED";

export type InvoiceType = "SETUP" | "SUBSCRIPTION" | "AD_HOC" | "CREDIT";

export type InvoiceSource = "manual" | "converted_quote" | "automated";

export type PaymentMethod = "eft" | "cash" | "card" | "other" | "instant_eft" | "credit_note";

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
  /** manual | payfast | ozow | bank_import */
  provider?: string;
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

export interface InvoiceIssuer {
  name: string;
  email?: string;
  phone?: string;
  vatNumber?: string;
  address?: string;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  branchCode?: string;
  accountType?: string;
  logoUrl?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // INV-YYYY-XXXX (legacy data may be ZRP-YYYY-XXXX)
  tenantId: string;
  tenantName: string;
  /** The company that issued this invoice. Shown on the customer portal. */
  issuer?: InvoiceIssuer;
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
  /** Public pay page link, once one has been created. */
  payUrl?: string | null;
  /** Latest customer email for this document. */
  emailDelivery?: { status: "queued" | "sent" | "failed"; at?: string; note?: string } | null;
  creditOfId?: string | null;
  /** Credit notes issued against this invoice (invoice detail only). */
  creditNotes?: Array<{ id: string; number: string; total: number; status: string; issuedDate: string | null }>;
  /** On a credit note: the invoice it corrects and how the credit was used. */
  creditOfNumber?: string | null;
  appliedAmount?: number;
  refundedAmount?: number;
  refundDue?: number;
  reason?: string | null;

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
  accountHolder?: string;
  bankAccountType?: string;
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
  nextStep?: string | null;
  quoteId?: string | null;
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
  entityType:
    | "lead"
    | "invoice"
    | "case"
    | "order"
    | "booking"
    | "ticket"
    | "service_order"
    | "subscriber";
  entityId: string;
  action: string;
  description: string;
  userId?: string;
  createdAt: string;
}

// ── Tenancy primitives ───────────────────────────────────────
export interface CompanyLocation {
  id: string;
  companyId: string;
  name: string;
  address?: string;
  city?: string;
  postalCode?: string;
  isPrimary: boolean;
}

export interface CompanyMembership {
  id: string;
  companyId: string;
  userId: string;
  role: string;
  permissions: string[];
  createdAt: string;
}

export interface InstalledPack {
  companyId: string;
  vertical: Vertical;
  version: string;
  installedAt: string;
  modules: string[];
}

// ── MSP Vertical ─────────────────────────────────────────────
export type TicketStatus =
  | "new"
  | "triaged"
  | "in_progress"
  | "waiting_customer"
  | "waiting"
  | "resolved"
  | "closed"
  | "cancelled";

export type TicketPriority = "low" | "medium" | "high" | "critical";

export type TicketType = "incident" | "request" | "problem" | "change";

export interface MspAgreement {
  id: string;
  companyId: string;
  accountId: string;
  name: string;
  status: string;
  monthlyFee: number;
  slaResponseMinutes: number;
  slaResolveMinutes: number;
  includedHours?: number;
  overageRate?: number;
  billingCadence?: string;
  amendmentNotes?: string;
  currency?: string;
  startsAt?: string;
  endsAt?: string;
}

export interface MspAsset {
  id: string;
  companyId: string;
  accountId: string;
  siteId?: string;
  name: string;
  assetType: string;
  serialNumber?: string;
  status: "active" | "retired" | "in_repair";
  warrantyEnds?: string | null;
  notes?: string;
}

export interface MspTicket {
  id: string;
  companyId: string;
  number: string;
  accountId: string;
  contactId?: string;
  agreementId?: string;
  assetId?: string;
  parentTicketId?: string | null;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description?: string;
  assigneeId?: string;
  slaRespondBy?: string;
  slaResolveBy?: string;
  slaBreached?: boolean;
  source: "email" | "portal" | "phone" | "rmm" | "manual" | "psa" | "security" | "sentinel" | "soc" | "defender";
  externalRef?: string | null;
  runbookUrl?: string;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MspTimeEntry {
  id: string;
  companyId: string;
  ticketId: string;
  userId: string;
  minutes: number;
  billable: boolean;
  note?: string;
  workDate: string;
  createdAt: string;
}

// ── Telecom Vertical ─────────────────────────────────────────
export type RicaStatus = "not_started" | "pending" | "approved" | "rejected" | "expired";

export type ServiceOrderStatus =
  | "lead"
  | "qualified"
  | "quoted"
  | "rica_pending"
  | "provisioning"
  | "installing"
  | "active"
  | "suspended"
  | "cancelled";

export interface TelecomSubscriber {
  id: string;
  companyId: string;
  accountId: string;
  contactId?: string;
  status: "prospect" | "active" | "suspended" | "cancelled";
  serviceAddress?: string;
  coverageStatus?: "unknown" | "serviceable" | "not_serviceable" | "waitlist";
  ricaStatus: RicaStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TelecomRicaRecord {
  id: string;
  companyId: string;
  subscriberId: string;
  idDocumentType: "sa_id" | "passport" | "asylum";
  idNumberMasked: string;
  proofOfAddressUploaded: boolean;
  status: RicaStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  retentionUntil?: string;
  createdAt: string;
}

export interface TelecomServiceOrder {
  id: string;
  companyId: string;
  number: string;
  subscriberId: string;
  productName: string;
  status: ServiceOrderStatus;
  upstreamOrderRef?: string;
  installDate?: string;
  activatedAt?: string;
  monthlyFee: number;
  onceOffFee: number;
  currency: string;
  blockers?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TelecomService {
  id: string;
  companyId: string;
  subscriberId: string;
  orderId?: string;
  serviceType: "fibre" | "lte" | "voip" | "other";
  status: "pending" | "active" | "suspended" | "cancelled";
  circuitId?: string;
  phoneNumber?: string;
  simIccid?: string;
  cpeSerial?: string;
  activatedAt?: string;
  suspendedAt?: string;
}

export interface TelecomOutage {
  id: string;
  companyId: string;
  title: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  startedAt: string;
  resolvedAt?: string;
  impactedServiceIds: string[];
  summary?: string;
  noticeStatus?: string | null;
  noticeCount?: number;
}

// ── Workflow & Automation ────────────────────────────────────
export interface WorkflowTransition {
  from: string;
  to: string;
  action: string;
  requiredFields?: string[];
  requiredPermission?: string;
}

export interface AutomationRule {
  id: string;
  companyId: string | null;
  name: string;
  enabled: boolean;
  trigger: string;
  conditions?: { field: string; operator: string; value: unknown }[];
  action: string;
  actionPayload?: Record<string, unknown>;
}

// ── Assistant ────────────────────────────────────────────────
export interface AssistantProposal {
  id: string;
  companyId: string;
  skillId: string;
  recordType: string;
  recordId: string;
  summary: string;
  citedRecordIds: string[];
  proposedAction?: {
    type: string;
    payload: Record<string, unknown>;
    requiresApproval: boolean;
  };
  status: "draft" | "approved" | "rejected" | "executed";
  createdAt: string;
}
