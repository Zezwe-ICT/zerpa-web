# Multiple Companies Feature - Implementation Summary

**Date:** May 7, 2026  
**Status:** ✅ Ready for Testing  
**Progress:** 50% Overall Completion

---

## ✅ What's Been Implemented

### 1. **Auth Context with Multiple Companies Support**
- **File:** `apps/web/lib/auth/context.tsx`
- **Changes:**
  - Added `companies: AuthCompany[]` to auth state
  - New method: `selectCompany(companyId)` - switch between companies
  - New method: `addCompany(payload)` - create new company
  - Enhanced `signIn()` to return and handle multiple companies
  - Enhanced `register()` to save companies from registration

### 2. **Auth API Functions**
- **File:** `apps/web/lib/api/auth.ts`
- **New Functions:**
  - `getCompanies()` - GET `/api/v1/companies`
  - `createCompany()` - POST `/api/v1/companies`
- **Updated Types:**
  - `AuthResponse` now includes `companies?: AuthCompany[]`
  - `CreateCompanyPayload` with name, vertical, phone, details

### 3. **Company Selector Page**
- **File:** `apps/web/app/(public)/select-company/page.tsx`
- **Route:** `/select-company`
- **Purpose:** Shows when user logs in with multiple companies
- **Features:**
  - Display all companies user has access to
  - Click to select and enter dashboard
  - "+ Add New Company" button at bottom
  - Auto-selects if only 1 company

### 4. **Add Company Modal**
- **File:** `apps/web/components/modals/add-company-modal.tsx`
- **Features:**
  - Form fields: Company Name, Business Type, Phone (optional)
  - Vertical options: Funeral, Automotive, Restaurant, Spa
  - Input validation
  - Error handling with toast notifications
  - Submit creates company and updates auth context

### 5. **Company Switcher Dropdown**
- **File:** `apps/web/components/company-switcher.tsx`
- **Purpose:** Dashboard header component to switch companies
- **Features:**
  - Shows current company
  - Dropdown list of all companies
  - Green checkmark for selected company
  - "+ Add Company" option at bottom
  - Only shows if user has 2+ companies

### 6. **Add Company Button**
- **File:** `apps/web/components/add-company-button.tsx`
- **Purpose:** Reusable button for adding companies in forms
- **Usage:** Can be added to registration flow or anywhere needed
- **Features:**
  - Opens AddCompanyModal
  - Optional label customization
  - Callback on success

---

## 🔄 User Flow

### **New User Registration (Multiple Companies)**
```
1. User → https://zerpa.co.za
2. Register form Step 1: Email, Password, Name
3. Register form Step 2: Company name, Vertical, Phone
   └─ [+ Add Another Company] button appears here
4. Register form Step 3: Vertical-specific details
5. Submit → Creates User + Company + Lead + NestSale
6. Auto-login → Single company goes to /dashboard
             → Multiple companies go to /select-company
7. User sees company selector, clicks "Enter" to select one
8. Redirected to /dashboard with company loaded
9. User can use Company Switcher (top nav) to:
   - See all their companies
   - Switch between them
   - Add another company (from switcher menu)
```

### **Existing User with Multiple Companies**
```
1. User → /login
2. Enter email + password
3. Backend returns user + all companies
4. Frontend checks: companies.length
5. If 1 company → Auto-select → /dashboard
6. If 2+ companies → /select-company (company selector)
7. User selects which company → /dashboard with that company
8. Company switcher available in nav for easy switching
```

---

## 🧪 Components Ready to Test

| Component | Location | Purpose |
|-----------|----------|---------|
| **SelectCompanyPage** | `/select-company` route | Company selector modal |
| **AddCompanyModal** | `components/modals/add-company-modal.tsx` | Add company dialog |
| **CompanySwitcher** | `components/company-switcher.tsx` | Dashboard nav dropdown |
| **AddCompanyButton** | `components/add-company-button.tsx` | Reusable add button |

---

## 📝 Testing Checklist

### Registration Flow
- [ ] Register user → create first company
- [ ] See "+ Add Another Company" button/option
- [ ] Click + Add Company → modal opens
- [ ] Fill in company details → create
- [ ] Multiple companies saved
- [ ] After registration redirected to `/select-company`

### Login with Single Company
- [ ] Register with 1 company
- [ ] Log out
- [ ] Log back in
- [ ] Auto-redirected to `/dashboard` (no selector)
- [ ] Company selector hidden (only shows for 2+)

### Login with Multiple Companies
- [ ] Register with 2+ companies
- [ ] Log out
- [ ] Log back in
- [ ] Redirected to `/select-company`
- [ ] See all companies listed
- [ ] Click one → Enter dashboard with that company

### Company Switcher in Dashboard
- [ ] Navigate to `/dashboard`
- [ ] With 1 company → No switcher in nav
- [ ] With 2+ companies → Company switcher visible
- [ ] Click switcher → Dropdown shows all companies
- [ ] Select different company → Switch immediately
- [ ] "+ Add Company" in menu → Opens modal
- [ ] Create company → Appears in switcher

### API Verification
- [ ] POST `/api/v1/auth/register` accepts company data
- [ ] POST `/api/v1/auth/sign-in` returns all companies
- [ ] POST `/api/v1/companies` works with auth token
- [ ] GET `/api/v1/companies` returns user's companies

---

## 🔗 Integration Points with Backend

### Required Endpoints (already implemented)
1. **POST `/api/v1/auth/register`**
   - Accept: password, email, fullName, company (optional)
   - Return: token, user, company (if created), companies (all user owns)

2. **POST `/api/v1/auth/sign-in`**
   - Accept: email, password
   - Return: token, user, **companies (all user owns)** ← **KEY CHANGE**

3. **POST `/api/v1/companies`**
   - Accept: name, vertical, phone, description, details
   - Return: company object with id, name, slug, etc.

4. **GET `/api/v1/companies`** (if not implemented yet)
   - Return: `{ companies: [...] }`
   - All companies owned by authenticated user

---

## 🚀 How to Use Newly Created Components

### In Registration Form (Step 2/3)
```typescript
import { AddCompanyButton } from "@/components/add-company-button";

// Inside your form:
<AddCompanyButton 
  onSuccess={() => console.log("Company added")}
  className="mt-4"
/>
```

### In Dashboard Navbar
```typescript
import { CompanySwitcher } from "@/components/company-switcher";

// In your nav/header component:
<nav className="flex items-center gap-4">
  <CompanySwitcher />
  {/* other nav items */}
</nav>
```

### To Create a Company Programmatically
```typescript
import { useAuth } from "@/lib/auth/context";

const MyComponent = () => {
  const { addCompany } = useAuth();
  
  const handleAddCompany = async () => {
    try {
      const company = await addCompany({
        name: "My Company",
        vertical: "FUNERAL",
        phone: "012 345 6789"
      });
      console.log("Created:", company);
    } catch (error) {
      console.error("Failed:", error);
    }
  };
  
  return <button onClick={handleAddCompany}>Add</button>;
};
```

---

## 📊 Database Models (No Changes - Uses Existing)

### User → Companies Relationship
```
User (1:N) Company
├─ User.id
├─ Company.userId (FK)
├─ Company.name
├─ Company.vertical
└─ Company.ownerUserId (also references User)
```

---

## 🔐 Security Notes

1. **Company Isolation:** Companies scoped by `userId` in backend
2. **No Cross-Tenant Data:** Company switcher only shows user's companies
3. **Auth Required:** All company endpoints use JWT bearer token
4. **Clean Logout:** All company data cleared from localStorage on signOut

---

## 🎯 What's Next (Testing Phase)

1. **Deploy frontend** to Amplify with new components
2. **Verify endpoints** are returning correct data with multiple companies
3. **Test registration** → company creation flow end-to-end
4. **Test login** → company selector appears for 2+ companies
5. **Test company switcher** in dashboard
6. **Test add company** from switcher modal

---

## 📋 Files Created/Modified

### Created Files (4)
- `apps/web/app/(public)/select-company/page.tsx` - Company selector page
- `apps/web/components/modals/add-company-modal.tsx` - Add company modal
- `apps/web/components/company-switcher.tsx` - Dashboard company switcher
- `apps/web/components/add-company-button.tsx` - Reusable add button

### Modified Files (2)
- `apps/web/lib/api/auth.ts` - Added getCompanies, createCompany
- `apps/web/lib/auth/context.tsx` - Updated auth state & methods
- `BUSINESS_ONBOARDING_FRAMEWORK.md` - Updated progress tracker

---

**Status:** Ready for Frontend Testing ✅  
**Next:** Deploy and verify with backend endpoints
