# ZERPA API - Endpoints Implementation Checklist

This document outlines which API endpoints are required for different phases of the application. Use this to track implementation and testing progress.

**Last Updated:** May 6, 2026  
**API Version:** v1  
**Base URL:** `https://api.zerpa.co.za`

---

## Phase 1: MVP - User Authentication (CRITICAL)

These endpoints are **required** for the app to be usable. Without them, users cannot register or log in.

### ✅ 1.1 Health Check Endpoint

**Endpoint:** `GET /health`

**Status:** ✅ Working

**Required by:** Deployment monitoring, DevOps health checks

**Testing:**
```bash
curl https://api.zerpa.co.za/health

# Expected Response (200 OK):
{
  "status": "ok",
  "ts": 1778065672251,
  "database": {
    "available": true,
    "tableCount": 3
  }
}
```

**Notes:**
- No authentication required
- Returns DB connection status
- Critical for ops/monitoring

---

### 🔴 1.2 Register Endpoint

**Endpoint:** `POST /api/v1/auth/register`

**Status:** ⚠️ Implemented but timing out on Beanstalk (Nginx routing issue)

**Required by:** Frontend registration page (public)

**Request:**
```json
{
  "email": "user@example.com",
  "fullName": "John Doe",
  "password": "SecurePass123"
}
```

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid-1234",
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

**Error Responses:**
- `400` - Validation error (invalid email, weak password, missing fields)
- `409` - Email already registered

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 number (0-9)

**Testing:**
```bash
curl -X POST https://api.zerpa.co.za/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "fullName": "Test User",
    "password": "TestPass123"
  }'
```

**Blocker:** Nginx not routing `/api/v1/*` requests to backend on port 8080

---

### 🔴 1.3 Sign-In Endpoint

**Endpoint:** `POST /api/v1/auth/sign-in`

**Status:** ⚠️ Implemented but not tested due to register timeout

**Required by:** Frontend login page (public)

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid-1234",
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

**Error Responses:**
- `400` - Validation error (missing fields)
- `401` - Invalid credentials (wrong password or email not found)

**Testing:**
```bash
curl -X POST https://api.zerpa.co.za/api/v1/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

**Blocker:** Nginx routing issue (same as register)

---

## Phase 2: Multi-Tenancy - Company Management

These endpoints enable team collaboration and company setup. Required for the onboarding flow.

### 🔴 2.1 Create Company Endpoint

**Endpoint:** `POST /api/v1/companies`

**Status:** ⚠️ Implemented but not tested

**Required by:** Onboarding flow - Step 1

**Authentication:** ✅ Required (`Authorization: Bearer <token>`)

**Request:**
```json
{
  "name": "Apollo Holdings Ltd"
}
```

**Response (201 Created):**
```json
{
  "id": "company-uuid-5678",
  "name": "Apollo Holdings Ltd",
  "slug": "apollo-holdings-ltd",
  "ownerUserId": "user-uuid-1234"
}
```

**Error Responses:**
- `400` - Validation error (missing name)
- `401` - Missing/invalid authentication token
- `409` - Company name already exists

**Notes:**
- Creates user as `OWNER` member automatically
- Slug is auto-generated from name (lowercase, hyphens)
- Authenticated users only

**Testing:**
```bash
curl -X POST https://api.zerpa.co.za/api/v1/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Test Company"
  }'
```

**Blocker:** Nginx routing issue

---

### 🔴 2.2 Add Team Member Endpoint

**Endpoint:** `POST /api/v1/companies/:companyId/team-members`

**Status:** ⚠️ Implemented but not tested

**Required by:** Team management, onboarding staff

**Authentication:** ✅ Required (`Authorization: Bearer <token>`)

**Permissions:** Caller must be `OWNER` or `ADMIN` of company

**Request:**
```json
{
  "email": "staff@company.com",
  "fullName": "Jane Smith",
  "password": "StaffPass123",  // Required only if user doesn't exist
  "role": "STAFF"  // or "ADMIN"
}
```

**Response (201 Created):**
```json
{
  "createdUser": true,  // false if user already existed
  "membership": {
    "id": "membership-uuid",
    "role": "STAFF",
    "user": {
      "id": "uuid-5678",
      "email": "staff@company.com",
      "fullName": "Jane Smith"
    }
  }
}
```

**Error Responses:**
- `400` - Validation error (missing fields, weak password for new user)
- `401` - Missing/invalid token
- `403` - Not OWNER/ADMIN of company
- `409` - User already a member of this company

**Behavior:**
- If email doesn't exist: Creates new user + membership
- If email exists: Adds to company only (must provide password for new users)
- Password required only when creating new user

**Testing:**
```bash
# Add new staff member
curl -X POST https://api.zerpa.co.za/api/v1/companies/company-uuid-5678/team-members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "email": "staff@company.com",
    "fullName": "Jane Smith",
    "password": "StaffPass123",
    "role": "STAFF"
  }'

# Add existing user to company
curl -X POST https://api.zerpa.co.za/api/v1/companies/company-uuid-5678/team-members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "email": "existing@example.com",
    "fullName": "Existing User",
    "role": "ADMIN"
  }'
```

**Blocker:** Nginx routing issue

---

## Phase 3: Additional Features (FUTURE)

These endpoints are defined in the API manual but not yet critical. Plan for future phases.

### 📋 3.1 Get Companies (Proposed)

**Endpoint:** `GET /api/v1/companies`

**Status:** ❌ Not implemented

**Purpose:** List all companies for authenticated user

**Would return:** Array of companies user is member of

### 📋 3.2 Get Company Members (Proposed)

**Endpoint:** `GET /api/v1/companies/:companyId/team-members`

**Status:** ❌ Not implemented

**Purpose:** List team members of a company

**Notes:** Should Check `OWNER`/`ADMIN` permissions

### 📋 3.3 Update Company (Proposed)

**Endpoint:** `PUT /api/v1/companies/:companyId`

**Status:** ❌ Not implemented

**Notes:** Should be restricted to OWNER

### 📋 3.4 Remove Team Member (Proposed)

**Endpoint:** `DELETE /api/v1/companies/:companyId/team-members/:memberId`

**Status:** ❌ Not implemented

### 📋 3.5 Billing/Invoicing Endpoints (Proposed)

**Endpoints:** TBD (based on ZERPA_FRONTEND_SPECIFICATION.md)

**Status:** ❌ Not specified in current API manual

---

## Current Blockers & Issues

### 🔴 CRITICAL: Nginx Routing Issue

**Problem:** Requests to `https://api.zerpa.co.za/api/v1/auth/register` timeout

**Root Cause:** Nginx (reverse proxy) on Elastic Beanstalk is not routing `/api/v1/*` requests to the Node.js backend running on port 8080

**Solution Needed:**
1. Create/update `.platform/nginx/conf.d/elasticbeanstalk/01_proxy.conf` with:
```nginx
location /api {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

2. Deploy to Elastic Beanstalk to apply config

3. Test again with curl/browser

---

## Implementation Order (Recommended)

### ✅ Already Done
1. Database schema (Prisma)
2. Health endpoint
3. Auth endpoints implementation
4. Company endpoints implementation

### ⏳ TODO - Priority 1 (BLOCKING)
1. **Fix Nginx routing** - CRITICAL
2. Test register endpoint with curl
3. Test sign-in endpoint with curl
4. Test in browser with DevTools

### ⏳ TODO - Priority 2 (Phase 2)
1. Implement missing endpoints (Get companies, Get members, etc.)
2. Add role-based access control
3. Add input validation improvements

### ⏳ TODO - Priority 3 (Phase 3)
1. Billing/Invoice endpoints
2. CRM endpoints
3. Funeral vertical endpoints
4. Other business logic endpoints

---

## Quick Reference: Endpoint Status Matrix

| Endpoint | Method | Path | Status | Tested | Notes |
|----------|--------|------|--------|--------|-------|
| Health | GET | `/health` | ✅ | ✅ | Working |
| Register | POST | `/api/v1/auth/register` | ✅ Code | ❌ Timeout | Nginx issue |
| Sign-In | POST | `/api/v1/auth/sign-in` | ✅ Code | ❌ Not tested | Nginx issue |
| Create Company | POST | `/api/v1/companies` | ✅ Code | ❌ Not tested | Nginx issue |
| Add Team Member | POST | `/api/v1/companies/:id/team-members` | ✅ Code | ❌ Not tested | Nginx issue |
| Get Companies | GET | `/api/v1/companies` | ❌ | ❌ | Not implemented |
| Get Members | GET | `/api/v1/companies/:id/team-members` | ❌ | ❌ | Not implemented |

---

## Environment Setup Checklist

- [x] DATABASE_URL set in Elastic Beanstalk
- [x] JWT_SECRET set in Elastic Beanstalk
- [x] ALLOWED_ORIGINS configured
- [ ] Nginx routing configured
- [ ] API listening on port 8080
- [ ] Requests reaching API

---

## Testing After Nginx Fix

Once Nginx is configured, test all endpoints:

```bash
# 1. Health Check
curl https://api.zerpa.co.za/health

# 2. Register New User
curl -X POST https://api.zerpa.co.za/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "fullName": "Test User",
    "password": "TestPass123"
  }'

# 3. Sign In
curl -X POST https://api.zerpa.co.za/api/v1/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'

# 4. Create Company (with token from step 2)
curl -X POST https://api.zerpa.co.za/api/v1/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Test Company"
  }'

# 5. Add Team Member
curl -X POST "https://api.zerpa.co.za/api/v1/companies/<company-id>/team-members" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "email": "staff@example.com",
    "fullName": "Staff Member",
    "password": "StaffPass123",
    "role": "STAFF"
  }'
```

---

## Next Steps

1. **Create Nginx configuration file** in the repo at `.platform/nginx/conf.d/elasticbeanstalk/01_proxy.conf`
2. **Push to GitHub** and redeploy to Elastic Beanstalk
3. **Test with curl** to verify routing works
4. **Test in browser** with DevTools console logs
5. **Update this checklist** as endpoints are verified
