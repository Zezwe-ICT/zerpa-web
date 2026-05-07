# ZERPA Business Onboarding Framework
## Complete Integration Architecture: Sales Process, Automation Engine & Multi-Tier Model

**Version:** 1.0  
**Date:** May 7, 2026  
**Status:** Architecture & Planning

---


## PROGRESS TRACKER


**Overall Completion:** 50% (16 of 33 work items completed)


| Section | Status | Completion |
|---------|--------|-----------|
| Multi-Tier Business Model | ✅ Complete | 100% |
| The Nest Package | ✅ Complete | 100% |
| Database Schema | ✅ Complete | 100% |
| API Enhancements | ✅ Complete | 100% |
| Frontend: Auth & Companies | ✅ Complete | 100% |
| Multiple Companies Feature | ✅ Complete | 100% |
| Automation Engine | 🔲 Not Started | 0% |
| Pre-Built Templates | 🔲 Not Started | 0% |
| Rule Builder UI | 🔲 Not Started | 0% |
| Integration Testing | ⏳ In Progress | 50% |


---  

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Multi-Tier Business Model](#multi-tier-business-model)
3. [The Nest Package](#the-nest-package)
4. [Multi-Step Onboarding Flow](#multi-step-onboarding-flow)
5. [Database Schema](#database-schema)
6. [Automation Engine Architecture](#automation-engine-architecture)
7. [Integration with ZERPA Spec](#integration-with-zerpa-spec)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Automation Rules & Triggers](#automation-rules--triggers)
10. [No Breaking Changes](#no-breaking-changes)

---

## EXECUTIVE SUMMARY

ZERPA operates on a **multi-tier SaaS model** where the same business automation framework is reused at multiple levels:

### Tier 1: ZERPA HQ (Your Company)
- Uses ZERPA to sell "The Nest" package to customers
- Implements the 7-stage sales process documented in `SALES_PROCESS.md`
- Tracks leads → Converts to Nest Sales → Generates revenue (R4,500 setup + R14,800-R37,000/month)

### Tier 2: Your Customers (Operating within ZERPA)
- Funeral homes, auto shops, restaurants, spas
- Use the identical CRM + Nest Sales + Automation framework
- But configured for THEIR business (selling services to families, car owners, diners, spa clients)
- They implement their own version of the sales process using ZERPA's tools

**Key Insight:** The Nest isn't just your onboarding—it's the blueprint framework that every business using ZERPA will implement.

---

## MULTI-TIER BUSINESS MODEL

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      TIER 1: ZERPA HQ                              │
│                                                                     │
│  Using ZERPA to sell:                                             │
│  • Lead management (CRM)                                          │
│  • Nest Sales module (R4,500 setup + R14,800-R37,000/month)      │
│  • Automation engine (rules, email sequences, task management)    │
│                                                                     │
│  Customers: Funeral homes, auto shops, restaurants, spas         │
│  Sales force: 1-2 agents (initially)                             │
│  Revenue model: SaaS subscriptions                                │
│                                                                     │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
        Each customer signs contract
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓              ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  TIER 2A:    │ │  TIER 2B:    │ │  TIER 2C:    │ │  TIER 2D:    │
│  Funeral     │ │  Auto Shop   │ │  Restaurant  │ │  Spa         │
│  Home        │ │              │ │              │ │              │
├──────────────┤ ├──────────────┤ ├──────────────┤ ├──────────────┤
│ Using ZERPA: │ │ Using ZERPA: │ │ Using ZERPA: │ │ Using ZERPA: │
│              │ │              │ │              │ │              │
│ • CRM        │ │ • CRM        │ │ • CRM        │ │ • CRM        │
│   (cases)    │ │   (job cards)│ │   (bookings) │ │   (bookings) │
│              │ │              │ │              │ │              │
│ • Nest Sales │ │ • Nest Sales │ │ • Nest Sales │ │ • Nest Sales │
│   (families) │ │   (car owners)│ │  (clients)   │ │  (clients)   │
│              │ │              │ │              │ │              │
│ • Invoicing  │ │ • Invoicing  │ │ • Invoicing  │ │ • Invoicing  │
│   Portal     │ │   Portal     │ │   Portal     │ │   Portal     │
│              │ │              │ │              │ │              │
│ • Automation │ │ • Automation │ │ • Automation │ │ • Automation │
│   (email,    │ │   (email,    │ │   (email,    │ │   (email,    │
│    tasks)    │ │    tasks)    │ │    tasks)    │ │    tasks)    │
│              │ │              │ │              │ │              │
│ Revenue:     │ │ Revenue:     │ │ Revenue:     │ │ Revenue:     │
│ Sells        │ │ Sells        │ │ Sells        │ │ Sells        │
│ services to  │ │ repairs to   │ │ food/events  │ │ services to  │
│ families     │ │ car owners   │ │ to clients   │ │ clients      │
│              │ │              │ │              │ │              │
│ (Pays ZERPA  │ │ (Pays ZERPA  │ │ (Pays ZERPA  │ │ (Pays ZERPA  │
│ R{X}/month)  │ │ R{X}/month)  │ │ R{X}/month)  │ │ R{X}/month)  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘


```

### Revenue Waterfall

```
ZERPA sells Nest to Funeral Home
  R4,500 setup (ZERPA keeps 100%)
  R22,200/month (ZERPA keeps 100%)
  
    ↓ Funeral Home goes live ↓
  
Funeral Home sells services to Family
  R8,500 for funeral service (families have invoice portal)
  R1,200 additional support (families pay online via portal)
  
    ↓ (Funeral home keeps 100%, ZERPA takes their monthly fee)
```

---

## THE NEST PACKAGE

### What is "The Nest"?

**The Nest** is an 8-task onboarding/provisioning service that bridges the gap between sales contract and active subscription.

#### The 8 Tasks (Current ZERPA Onboarding)

```
☐ 1. Landline + WhatsApp linked
☐ 2. Microsoft 365 account 1 created
☐ 3. Microsoft 365 account 2 created
☐ 4. 5-page website live
☐ 5. Facebook profile set up
☐ 6. Instagram profile set up
☐ 7. IVR + call recording configured
☐ 8. Bulk SMS account activated
```

#### Pricing

- **Setup fee:** R4,500 (one-time, due before trial starts)
- **Trial period:** 3 months (free access, no billing)
- **Monthly subscription:** R14,800 (Starter) | R22,200 (Professional) | R37,000 (Enterprise)
- **Billing start:** First day of month 4

#### Timeline

```
Day 1: Contract signed → Nest Sale created
Day 1-21: Setup phase (8 tasks)
Day 21: All tasks complete → Nest activated
Day 22-92: Trial period (no billing)
Day 93: First invoice (R{monthly_fee}) + ongoing

If stuck (tasks incomplete for 15+ days):
  → Auto-escalate to manager
  → Send "Let's unblock this" email
  → Schedule call with customer success
```

### Why Nest Matters

Most SaaS companies lose 30-40% of customers during implementation. ZERPA's Nest:

✅ **Prevents failures** — Can't go live until setup complete
✅ **Tracks progress** — Every task is visible and assigned
✅ **Identifies blockers early** — Stuck for 3+ days triggers alert
✅ **Creates engagement** — Customer is involved in setup process
✅ **Generates upsell moment** — "Tasks done, let's add payment processing" conversation

### Nest for Your Customers (Tier 2)

When a funeral home goes live, THEIR customer (family) sees a simplified Nest during booking:

```
ZERPA Tier 1 Nest (Your checklist):
☐ Landline + WhatsApp
☐ Microsoft 365 accounts
☐ Website
☐ Social media
☐ IVR/call recording
☐ SMS account

Funeral Home's Tier 2 Nest (Family checklist):
☐ Service details confirmed
☐ Preferences logged
☐ Payment method provided
☐ Family contact info verified
☐ Flowers/music preferences noted
☐ Catering details locked
☐ Photography permissions signed
☐ Complimentary items selected
```

**Same framework. Different tasks. Different vertical.**

---

## MULTI-STEP ONBOARDING FLOW

### Design: Progressive Disclosure

Instead of overwhelming new customers with a 25-field form, capture information progressively:

```
USER JOURNEY
─────────────────────────────────────────────────────────────

1. Visits: https://zerpa.co.za
2. Clicks: "Get Started" → /register

STEP 1: User Account (30 seconds) ✓ Fast
├─ Email ✓
├─ Password ✓
├─ Full Name ✓
└─ [Next →]
   ↓ User created, JWT issued, auto-login

STEP 2: Business Profile (2 minutes) ✓ Essential
├─ Company Name ✓
├─ Business Type (dropdown) [FUNERAL | AUTO | RESTAURANT | SPA] ✓
├─ Contact Phone ✓
└─ [Next →]
   ↓ Lead created in CRM, assigned to agent

STEP 3: Pain Points & Details (5 minutes) ✓ Vertical-specific
├─ [FUNERAL HOME BRANCH]
│  ├─ Staff count
│  ├─ Monthly case volume
│  ├─ Current invoicing method
│  ├─ Pain points (checkboxes)
│  └─ Describe your business
│
├─ [AUTO SHOP BRANCH]
│  ├─ Number of mechanics
│  ├─ Monthly repair volume
│  ├─ Current job card method
│  └─ Service types offered
│
├─ [RESTAURANT BRANCH]
│  ├─ Restaurant type
│  ├─ Avg covers per day
│  ├─ Event booking volume
│  └─ Current booking system
│
└─ [SPA BRANCH]
   ├─ Services offered (multi-select)
   ├─ Staff count
   ├─ Avg bookings per week
   └─ Current booking system

[Create account]
   ↓ Company saved, Nest Sale created, automation triggered
   ↓ Redirect to /client-portal/{vertical}/dashboard
```
    
### Frontend Flow (Code Structure)

```typescript
// app/(public)/register/page.tsx
// → Step 1: User account form
// → Step 2: Business profile form  
// → Step 3: Vertical-specific details form
// → POST to /api/v1/auth/register (enhanced)
// → Handle response + redirect

// Components needed:
// • MultiStepForm wrapper
// • Step1UserDetails
// • Step2BusinessProfile
// • Step3FuneralDetails | Step3AutoDetails | Step3RestaurantDetails | Step3SpaDetails
// • ProgressIndicator (3-step bar)
// • ValidationMessaging


```

### API Enhancement

```
POST /api/v1/auth/register

Request:
{
  "email": "owner@business.com",
  "fullName": "Owner Name",
  "password": "StrongPass123!",
  
  "company": {
    "name": "Company Name",
    "vertical": "FUNERAL",  // FUNERAL | AUTOMOTIVE | RESTAURANT | SPA
    "phone": "012 345 6789",
    "description": "Optional description",
    
    "details": {
      // Vertical-specific fields
      "staffCount": 5,
      "monthlyVolume": 8,
      "currentInvoicing": "spreadsheet",
      "painPoints": ["manual work", "poor communication"],
      "servicesOffered": ["burials", "cremations"],
      // ... etc per vertical
    }
  }
}

Response (201):
{
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "email": "owner@business.com",
    "fullName": "Owner Name"
  },
  
  "company": {
    "id": "uuid",
    "name": "Company Name",
    "vertical": "FUNERAL",
    "phone": "012 345 6789"
  },
  
  "lead": {
    "id": "uuid",
    "stage": "NEW",
    "estValue": 22200,
    "assignedAgentId": "agent-uuid"
  }, 


  "nestSale": {
    "id": "uuid",
    "status": "PENDING",
    "setupFeeAmount": 4500,
    "monthlyFeeAmount": 22200,
    "tasks": [ /* 8 task objects */ ]
  }
}


```
---

## DATABASE SCHEMA

### New/Extended Tables

```typescript
// Company table (NEW)
Company {
  id: string;
  userId: string;  // FK → User (who registered)
  name: string;
  vertical: "FUNERAL" | "AUTOMOTIVE" | "RESTAURANT" | "SPA";
  phone: string;
  email: string;
  description?: string;
  
  // Vertical-specific details (JSON blob for flexibility)
  details: {
    // Universal
    staffCount?: number;
    monthlyVolume?: number;
    currentInvoicing?: string;
    painPoints?: string[];
    
    // Funeral-specific
    burialServices?: boolean;
    cremationServices?: boolean;
    embalming?: boolean;
    
    // Auto-specific
    mechanicsCount?: number;
    workshopLocation?: string;
    serviceTypes?: string[];
    
    // Restaurant-specific
    restaurantType?: string;  // "fine_dining" | "casual" | "catering"
    avgCoversPerDay?: number;
    cuisineTypes?: string[];
    
    // Spa-specific
    therapists?: string[];
    servicesOffered?: string[];
    appointmentFrequency?: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
}


// Extend Lead table
Lead {
  // ... existing fields ...
  
  // NEW FIELDS
  companyId: string;  // FK → Company
  source: "SELF_REGISTRATION" | "FACEBOOK" | "REFERRAL" | "ADS" | "LINKEDIN" | "CONTENT" | "OTHER";
  sourceDetails?: string;
  leadScore: number;  // 1-100, calculated by automation
  nextFollowUpDate?: Date;
  previousInteractionDate?: Date;
  
  // Trial tracking
  trialStartDate?: Date;
  trialEndDate?: Date;
  
  // Auto-capture from company
  estimatedValue: number;  // R14,800-R37,000 pre-set
  painPoints?: string[];
  
  // Engagement tracking
  emailSequenceStage?: number;
  lastEmailSentAt?: Date;
  hasDownloadedMaterials?: boolean;
  demoAttended?: boolean;
  contractSignedDate?: Date;
}

// Extend NestSale table
NestSale {
  // ... existing fields ...
  
  // NEW FIELDS
  companyId: string;  // FK → Company
  leadId: string;  // FK → Lead
  
  // Timeline
  createdAt: Date;
  startDate: Date;
  trialStartDate: Date;
  trialEndDate: Date;
  billingStartDate: Date;
  
  // Pricing
  setupFeeAmount: number;
  monthlyFeeAmount: number;
  setupFeePaid: boolean;
  setupFeeInvoiceId?: string;
  
  // Tasks
  tasks: {
    id: string;
    label: string;
    description: string;
    assignedTo?: string;  // Agent ID
    completedAt?: Date;
    completedBy?: string;  // Agent ID who marked complete
    completionNotes?: string;
    priority: number;  // 1-8
    isBlocked?: boolean;
    blockReason?: string;
  }[];
  tasksCompletedCount: number;
  allTasksCompletedAt?: Date;
  
  // Status tracking
  status: "PENDING" | "IN_SETUP" | "ACTIVE" | "SUSPENDED" | "CHURNED";
  lastStatusChangeAt: Date;
  
  // Engagement
  setupCallScheduledAt?: Date;
  setupCallCompletedAt?: Date;
  onboardingAgentId?: string;
}

// NEW: Automation configuration table
AutomationConfig {
  id: string;
  tenantId?: string;  // null = ZERPA internal, "X" = customer
  name: string;
  description?: string;
  
  // Rules
  rules: {
    id: string;
    name: string;
    enabled: boolean;
    
    // Trigger 
    trigger: "LEAD_CREATED" | "STAGE_CHANGED" | "INTERACTION_LOGGED" | 
             "TRIAL_ACTIVATED" | "DAYS_SINCE_CONTACT" | "NEST_ALL_TASKS_DONE" | 
             "INVOICE_CREATED" | "PAYMENT_RECEIVED";
    triggerConditions?: {
      field: string;
      operator: "=" | "!=" | ">" | "<" | "IN" | "CONTAINS";
      value: any;
    }[];
    
    // Action
    action: "SEND_EMAIL" | "CREATE_TASK" | "SEND_SLACK" | "UPDATE_LEAD" | 
            "CREATE_NEST_SALE" | "SCORE_LEAD" | "ASSIGN_AGENT" | "CREATE_INVOICE";
    actionPayload: {
      templateId?: string;
      taskName?: string;
      taskDescription?: string;
      slackChannel?: string;
      fieldUpdates?: Record<string, any>;
      scoreDelta?: number;
    };
  }[];
  
  // Email templates
  emailTemplates: {
    id: string;
    name: string;
    subject: string;
    body: string;  // HTML with {{variables}} 
    tags: string[];
  }[];
  
  // Task checklists
  taskChecklists: {
    id: string;
    name: string;
    description: string;
    tasks: {
      id: string;
      label: string;
      description: string;
      priority: number;
    }[];
  }[];
  
  createdAt: Date;
  updatedAt: Date;
}


```

---

## AUTOMATION ENGINE ARCHITECTURE

### Overview

The automation engine is a **rules-based workflow system** that:
- Triggers on events (lead created, stage changed, trial ends)
- Evaluates conditions (vertical = FUNERAL, days since contact > 7)
- Executes actions (send email, create task, score lead, assign agent)
- Logs all activity for compliance and analysis

### Multi-Tenant Design

```typescript
// Every automation is scoped to a tenant
AutomationRule {
  tenantId: null;        // Internal ZERPA rules
  trigger: "LEAD_CREATED";
  action: "SEND_EMAIL";
  // This rule runs only for ZERPA internal leads

  tenantId: "tenant-001";  // Funeral home specific rules
  trigger: "CASE_SCHEDULED";
  action: "GENERATE_INVOICE";
  // This rule runs only for Dignity Funeral Home
}
```

### Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│  EVENT TRIGGERED (e.g., Lead created)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  QUERY: Find all rules where:                               │
│  • trigger = "LEAD_CREATED"                                 │
│  • tenantId = {current user's tenant}                       │
│  • enabled = true                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  EVALUATE CONDITIONS (if any)                               │
│  E.g., vertical = "FUNERAL" AND verticalscore < 50         │
│  Result: true/false                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
            ┌────────┴────────┐
            ↓                 ↓
      Conditions    Conditions
      met (true)    not met (false)
           │              │
           ↓              ↓
      ┌─────────┐    ┌──────────┐
      │ EXECUTE │    │ SKIP     │
      │ ACTION  │    │ THIS RULE│
      └────┬────┘    └──────────┘
           │
           ↓
┌─────────────────────────────────────────────────────────────┐
│  ACTION EXECUTION                                           │
│  • Send email (from template, substitute {{variables}})     │
│  • Create task (assign to agent, set due date)              │
│  • Score lead (+X points if condition Y)                    │
│  • Update field (stage, status, etc.)                       │
│  • Create record (invoice, nest sale, etc.)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌────────────── ──────────────────────────────────────────────┐
│  LOG ACTIVITY (Audit trail)                                 │
│  • What rule ran                                            │
│  • When it ran                                              │
│  • What action executed                                     │
│  • Result (success/error)                                   │
└─────────────────────────────────────────────────────────────┘

```

### Pre-Built Rule Templates

ZERPA comes with these rules pre-configured but customizable:

**FOR ZERPA HQ:**
- "Lead Created" → Send welcome email + assign agent + create task
- "Lead is Funeral (FLAGSHIP)" → Score +25 points
- "Stage Changed to PROPOSAL" → Send pricing email
- "Nest Sale Created" → Send onboarding email
- "Nest Tasks Incomplete 15+ days" → Escalate to manager
- "All Nest Tasks Done" → Activate subscription + send invoice

**FOR FUNERAL HOME (TIER 2):**
- "Case Scheduled" → Send family confirmation email
- "Service Date Tomorrow" → Send reminder SMS
- "Service Completed" → Generate invoice + send payment link
- "Invoice Unpaid 7 days" → Send payment reminder
- "Payment Received" → Mark case COMPLETED

---

## INTEGRATION WITH ZERPA SPEC

### Where It Lives in the UI

```
ZERPA Frontend (ZERPA_FRONTEND_SPECIFICATION.md)

TIER 1: ZERPA Internal Dashboard
├─ Dashboard (KPIs: active clients, MRR, open leads)
├─ CRM
│  ├─ Leads list (pipeline view, sorted by vertical)
│  ├─ Lead detail (stage tracker, interactions, convert button)
│  └─ Contacts list
├─ Nest Sales
│  ├─ Active sales overview (stats chips)
│  ├─ Nest sales table (client, vertical, status, checklist progress)
│  └─ Nest detail (8-task checklist, timeline, activate button)
├─ Billing
│  ├─ Invoices list
│  ├─ Create invoice
│  └─ Invoice detail
├─ Clients
│  └─ All customers list + their Nest status
└─ Settings
   └─ Automation rules manager (NEW)

TIER 2: Customer Portal (Funeral Home, Auto Shop, etc.)
├─ Vertical-specific dashboard
├─ CRM for their business (cases, job cards, bookings)
├─ Nest Sales module (their customer onboarding)
├─ Billing (their invoices)
└─ Automation rules (their configured workflows)
```

### New Components Needed

```
// Automation Engine UI
components/
├─ automation/
│  ├─ RuleBuilder.tsx          # Drag-and-drop rule creator
│  ├─ TriggerSelect.tsx        # Choose trigger event
│  ├─ ConditionBuilder.tsx     # Add IF conditions
│  ├─ ActionExecutor.tsx       # Choose action (email, task, etc.)
│  ├─ TemplateManager.tsx      # Email template CRUD
│  ├─ RulesList.tsx            # View/edit/delete rules
│  └─ RuleHistory.tsx          # Audit log of executed rules

```

### New Routes

```
(internal)/
├─ settings/automation/            # Main automation dashboard
├─ settings/automation/rules        # Rule management
├─ settings/automation/templates    # Email template management
└─ settings/automation/history      # Activity log

(client-portal)/
├─ {vertical}/settings/automation/  # Customer's automation settings
└─ {vertical}/settings/templates/   # Customer's email templates

```

---

## IMPLEMENTATION ROADMAP

**Timeline:** 8 weeks | **Current Week:** Week 1 | **Overall Progress:** 15%

### Phase 1: Foundation (Weeks 1-2)
**Status:** ⏳ IN PROGRESS  
**Goal:** Get basic lead capture and CRM integration working  
**Progress:** 30% (3 of 10 tasks started)

**Frontend Tasks:**
- [x] Build multi-step registration form (Step 1, 2, 3)
- [x] Create vertical-specific form branches
- [x] Add form validation
- [x] Add "+ Add Company" button to registration
- [x] Create company selector page (for multiple companies)
- [x] Build company switcher component (dashboard)
- [x] Update auth context for multiple companies support
- [ ] Test form submission flow
- [ ] Connect to enhanced register endpoint

**Backend Tasks:**
- [x] Extend `/api/v1/auth/register` to accept company data
- [x] Fix `/api/v1/auth/sign-in` to return company (PRIORITY)
- [x] Implement GET `/api/v1/companies` endpoint
- [x] Create `Company` table schema
- [x] Create migration scripts
- [x] Test end-to-end: register → create lead/company/nest

**Status Check:** 
- [x] Test registration flow works without errors
- [x] Database records created correctly
- [x] User can log back in without re-onboarding prompt
- [x] Multiple companies supported in auth flow
- [ ] Company selector shows for multiple companies
- [ ] Add company button works in registration

**Deliverable:** ✅ Customers can register + create multiple companies + login with company selector

---

### Phase 2: Automation Engine (Weeks 3-4)
**Status:** 🔲 NOT STARTED  
**Goal:** Build the rules engine and email automation  
**Progress:** 0% (0 of 10 tasks started)

**Backend Tasks:**
- [ ] Create `AutomationConfig` table
- [ ] Create `AutomationRule` table
- [ ] Create `EmailTemplate` table
- [ ] Implement rule triggering system (event listener)
- [ ] Build email template system with variable substitution
- [ ] Create email action execution
- [ ] Create task creation action
- [ ] Build rule evaluation logic (conditions)
- [ ] Create rule history logging
- [ ] Add error handling and rollback

**Testing:**
- [ ] Unit test: rule triggering
- [ ] Unit test: condition evaluation
- [ ] Integration test: full rule execution
- [ ] Load test: 1000+ rules executing


**Deliverable:** ✅ Automation rules can run → emails send automatically


---

### Phase 3: Pre-Built Templates (Week 5)
**Status:** 🔲 NOT STARTED  
**Goal:** Ship with pre-configured rules per vertical  
**Progress:** 0% (0 of 5 templates created)

**Templates to Create:**
- [ ] ZERPA Nest Sales rule set (6-8 rules)
- [ ] Funeral Home rule set (6-8 rules)
- [ ] Auto Shop rule set (6-8 rules)
- [ ] Restaurant rule set (6-8 rules)
- [ ] Spa rule set (6-8 rules)

**Implementation:**
- [ ] Create rule import/duplication system
- [ ] Test rule activation for new customers
- [ ] Document customization instructions
- [ ] Create template library UI

**Deliverable:** ✅ New customers activate vertical rules on day 1

---

### Phase 4: Rule Builder UI (Weeks 6-7)
**Status:** 🔲 NOT STARTED  
**Goal:** Customers can create custom automation without code  
**Progress:** 0% (0 of 8 components started)

**Frontend Components:**
- [ ] RuleBuilder wrapper component
- [ ] TriggerSelect component
- [ ] ConditionBuilder component
- [ ] ActionSelector component
- [ ] TemplateEditor component
- [ ] RulePreview component
- [ ] RulesList component
- [ ] RuleHistory component


**Routes to Create:**
- [ ] `/settings/automation` (dashboard)
- [ ] `/settings/automation/rules` (list/edit)
- [ ] `/settings/automation/templates` (email templates)
- [ ] `/settings/automation/history` (audit log)


**Features:**
- [ ] Drag-and-drop rule creation
- [ ] Rule preview/test capability
- [ ] Deploy rules (activate/deactivate)
- [ ] Duplicate/clone existing rules


**Deliverable:** ✅ Non-technical users can build automation


---

### Phase 5: Advanced Features (Weeks 8+)
**Status:** 🔲 NOT STARTED  
**Goal:** Scoring, escalation, bulk operations  
**Progress:** 0% (0 of 8 features started)

**Features:**
- [ ] Lead scoring system (points-based)
- [ ] Escalation rules (manager alerts for stuck deals)
- [ ] Bulk actions (send email to all leads in stage X)
- [ ] Webhook integration (external system triggers)
- [ ] SMS automation (in addition to email)
- [ ] Slack notifications (agent alerts)
- [ ] Analytics dashboard (rule execution metrics)
- [ ] Performance optimization (caching, indexing)

**Deliverable:** ✅ Enterprise-grade automation platform

---

## AUTOMATION RULES & TRIGGERS

### ZERPA Tier 1: Nest Sales Rules

```
RULE 1: Welcome to Zerpa
├─ TRIGGER: Lead created + source = SELF_REGISTRATION
├─ CONDITION: None
├─ ACTION: Send email
│  └─ Template: "Welcome to Zerpa"
│     Subject: "Welcome to Zerpa, {firstName}!"
│     Body: "You're all set. Let's get {companyName} set up..."
└─ AUTO-RUN: YES

RULE 2: Assign Agent by Vertical
├─ TRIGGER: Lead created
├─ CONDITION: vertical = FUNERAL
├─ ACTION: Assign to agent
│  └─ Assignment logic: Round-robin from funeral agents
└─ AUTO-RUN: YES

RULE 3: Lead Scoring — Funeral Premium
├─ TRIGGER: Lead created
├─ CONDITION: vertical = FUNERAL AND monthlyVolume >= 10
├─ ACTION: Score lead
│  └─ Add 25 points (high-value funeral)
└─ AUTO-RUN: YES

RULE 4: Onboarding Call Scheduled
├─ TRIGGER: Lead created
├─ CONDITION: None
├─ ACTION: Create task
│  └─ Task: "Schedule onboarding call"
│     Assigned: To assigned agent
│     Due: 1 day from now
└─ AUTO-RUN: YES

RULE 5: Nest Tasks Stuck Alert
├─ TRIGGER: Daily at midnight
├─ CONDITION: Nest Sale status = IN_SETUP AND 
│             lastTaskUpdate > 3 days ago
├─ ACTION: Escalate task + send email
│  ├─ Create escalation task for manager
│  ├─ Send email: "Onboarding stuck for {clientName}"
│  └─ Alert assigned agent via Slack
└─ AUTO-RUN: YES

RULE 6: All Tasks Complete → Activate
├─ TRIGGER: Last Nest task marked complete
├─ CONDITION: Nest Sale has all 8 tasks done
├─ ACTION: Auto-activate subscription
│  ├─ Update Nest status → ACTIVE
│  ├─ Generate first invoice (R{monthlyFee})
│  ├─ Send "You're live!" email
│  └─ Log in activity feed
└─ AUTO-RUN: YES

RULE 7: Trial Ending In 7 Days
├─ TRIGGER: Daily at 9am
├─ CONDITION: Nest Sale trial_end_date = 7 days from today
├─ ACTION: Send email
│  └─ Template: "Your Zerpa trial ends in 7 days"
│     Content: "Billing starts on {date}, charged to {card}"
└─ AUTO-RUN: YES

RULE 8: First Invoice Sent (Billing Start)
├─ TRIGGER: Monthly (day after trial ends)
├─ CONDITION: Nest Sale status = ACTIVE
├─ ACTION: Generate and send invoice
│  ├─ Amount: R{monthlyFeeAmount}
│  ├─ To: company admin email
│  └─ Include payment link
└─ AUTO-RUN: YES


```

### Funeral Home Tier 2: Customer Case Rules


```
RULE 1: New Case Created
├─ TRIGGER: Case created
├─ CONDITION: None
├─ ACTION: Send email
│  └─ To: Family members
│     Subj: "Service scheduled for {deceasedName}"
│     Body: "Please confirm if these details are correct..."
└─ AUTO-RUN: YES


RULE 2: Service Date Reminder
├─ TRIGGER: Daily at 6pm
├─ CONDITION: Case.serviceDate = tomorrow
├─ ACTION: Send SMS reminder
│  └─ Message: "Reminder: {deceasedName}'s service is tomorrow at {time}"
└─ AUTO-RUN: YES


RULE 3: Service Complete → Invoice
├─ TRIGGER: Case status changed to COMPLETED
├─ CONDITION: None
├─ ACTION: Generate invoice
│  ├─ Items: Service fee (R{amount}) + extras
│  ├─ Send to family email
│  ├─ Include payment link
│  └─ Set due: 7 days
└─ AUTO-RUN: YES


RULE 4: Invoice Unpaid 7 Days
├─ TRIGGER: Daily at 9am
├─ CONDITION: Invoice status = UNPAID AND 
│             created > 7 days ago
├─ ACTION: Send payment reminder email
│  └─ Message: "Invoice {#} due today - pay now →"
└─ AUTO-RUN: YES


RULE 5: Payment Received
├─ TRIGGER: Payment marked received
├─ CONDITION: None
├─ ACTION: Send receipt email + update case
│  ├─ Email receipt to family
│  ├─ Update Invoice status → PAID
│  └─ Update Case status → CLOSED
└─ AUTO-RUN: YES

```

---

## NO BREAKING CHANGES

### Compatibility Analysis

This entire framework fits **cleanly into the existing ZERPA architecture** without modifications:

✅ **CRM Module** — Extends existing Lead table, no breaking changes
✅ **Nest Sales Module** — Extends NestSale table, no breaking changes
✅ **Invoicing** — Automation can trigger invoice creation, no changes needed
✅ **Client Portal** — Scope by `tenantId`, no UI changes needed
✅ **Authentication** — `/api/v1/auth/register` enhanced to accept optional `company` field
✅ **Database** — New tables (`Company`, `AutomationConfig`) don't affect existing ones

### Migration Plan

For existing customers (if any):

```
1. Add new tables (Company, AutomationConfig, etc.)
   → Existing data untouched

2. Make company field optional in registration
   → Old registrations: company = null
   → New registrations: company = {data}

3. Assign default rules to new customers
   → ZERPA customers: ZERPA ruleset
   → Funeral homes: Funeral ruleset
   → etc.

4. Existing leads
   → Manually create Company records if needed
   → Or leave as null + backfill later

Zero impact on existing live customers.

```

---

## SUMMARY: The Complete System

```
┌─────────────────────────────────────────────────────────────────┐
│              CUSTOMER REGISTRATION (Multi-Step)                 │
│                                                                 │
│  Step 1: Email + Password + Name                              │
│  Step 2: Business name + Vertical + Phone                     │
│  Step 3: Vertical-specific pain points + details              │
│  ↓                                                             │
│  → POST /api/v1/auth/register (enhanced)                     │
│  → Creates: User, Company, Lead (NEW stage), Nest Sale       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│            AUTOMATION ENGINE (Rules-Based)                      │
│                                                                 │
│  1. Triggers fire (lead created, task done, payment received) │
│  2. Rules evaluated (conditions checked)                      │
│  3. Actions execute (email sent, task created, lead scored)   │
│  4. Activity logged (audit trail)                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓ (for ZERPA HQ)
┌─────────────────────────────────────────────────────────────────┐
│              NEST SALES ONBOARDING (8 Tasks)                    │
│                                                                 │
│  ☐ Landline + WhatsApp          → Agent tracks progress        │
│  ☐ Microsoft 365 accounts       → Auto-emails family/staff     │
│  ☐ Website setup                → Invoice triggers if stuck    │
│  ☐ Social media (FB, IG)        → Escalates if 3+ days late    │
│  ☐ IVR + call recording         → Auto-activates when done     │
│  ☐ Bulk SMS account             → Starts R22,200/month bill    │
│  ↓                                                              │
│  All complete → ACTIVE status, subscription begins              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓ (customer goes live)
┌─────────────────────────────────────────────────────────────────┐
│           TIER 2: CUSTOMER USING SAME FRAMEWORK                 │
│                                                                 │
│  Funeral Home                   Auto Shop                       │
│  ├─ CRM: Cases                  ├─ CRM: Job Cards               │
│  ├─ Nest: Family checklist      ├─ Nest: Car owner checklist    │
│  ├─ Rules: Service → Invoice    ├─ Rules: Repair → Invoice      │
│  ├─ Portal: Family invoice view ├─ Portal: Owner invoice view   │
│  └─ Revenue: R{service fee}     └─ Revenue: R{repair cost}      │
│                                                                 │
│  (Pays ZERPA R22,200/month)     (Pays ZERPA R14,800/month)      │
└─────────────────────────────────────────────────────────────────┘


```

---

## NEXT STEPS

**� COMPLETED (This Week):**
- [x] Boss: Implemented company lookup in `/api/v1/auth/sign-in` ✅
- [x] Frontend: Multiple companies support in auth context ✅
- [x] Frontend: Company selector page for multiple companies ✅
- [x] Frontend: Add company button + modal in registration ✅
- [x] Frontend: Company switcher dropdown in dashboard ✅

**🔴 IMMEDIATE (Next):**
- [ ] Test: Sign up → create company → see "Add Company" button
- [ ] Test: Sign up with 2 companies → log out → log in → company selector shows
- [ ] Test: Company switcher in dashboard switches between companies
- [ ] Deploy: Updated frontend to Amplify
- [ ] Verify: All endpoints working with updated OpenAPI spec

**🟠 SHORT TERM (Weeks 1-2):**
- [ ] Test end-to-end registration → company creation → dashboard
- [ ] Multi-step registration form polish
- [ ] Add company flow testing with backend
- [ ] Database: Verify Company, Lead, NestSale records created

**🟡 MEDIUM TERM (Weeks 3-5):**
- [ ] Build automation engine (rule execution) - Phase 2
- [ ] Create pre-built rule templates per vertical
- [ ] Implement lead scoring system
- [ ] Development environment setup for testing

**🟢 LONG TERM (Weeks 6+):**
- [ ] Rule builder UI (drag-and-drop)
- [ ] Advanced automation features (SMS, Slack, webhooks)
- [ ] Customer testing & feedback
- [ ] GA launch with full feature set



---

**Document Version:** 1.1  
**Last Updated:** May 7, 2026 (Multiple Companies Added)  
**Owner:** Product & Engineering Team  
**Status:** Ready for Testing  
**Progress:** Tracking actively


