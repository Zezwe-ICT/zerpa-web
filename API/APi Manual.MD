# ZERPA API Manual (Frontend Integration)

This manual documents the currently implemented API in `apps/api` for frontend teams.

Machine-readable API contract: `openapi.yaml` (repository root).

Base URL (production target):

- `https://api.zerpa.co.za`

Version prefix:

- `/api/v1`

---

## 1) Authentication Model (Current)

Current implementation uses JWT bearer tokens returned by the API.

- Register endpoint creates user and returns token.
- Sign-in endpoint returns token for existing user.
- Protected routes require `Authorization: Bearer <token>`.

> Note: long-term architecture will migrate to Cognito-backed auth while preserving route contracts where possible.

---

## 2) Health Endpoint

### `GET /health`

Purpose:

- service liveness and readiness
- DB availability check
- DB table count output

Success (`200`):

```json
{
  "status": "ok",
  "ts": 1775828820000,
  "database": {
    "available": true,
    "tableCount": 3
  }
}
```

Failure (`503`):

```json
{
  "status": "degraded",
  "ts": 1775828820000,
  "database": {
    "available": false,
    "tableCount": null
  }
}
```

---

## 3) Auth Endpoints

### `POST /api/v1/auth/register`

Creates a new user account.

Request body:

```json
{
  "email": "owner@company.com",
  "fullName": "Owner User",
  "password": "StrongPass123!"
}
```

Response (`201`):

```json
{
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "email": "owner@company.com",
    "fullName": "Owner User"
  }
}
```

Possible errors:

- `409` email already exists
- `400` validation error

---

### `POST /api/v1/auth/sign-in`

Signs in an existing user.

Request body:

```json
{
  "email": "owner@company.com",
  "password": "StrongPass123!"
}
```

Response (`200`):

```json
{
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "email": "owner@company.com",
    "fullName": "Owner User"
  }
}
```

Possible errors:

- `401` invalid credentials
- `400` validation error

---

## 4) Company Endpoints

All endpoints in this section require:

- `Authorization: Bearer <jwt>`

### `POST /api/v1/companies`

Creates a new company and sets current authenticated user as `OWNER`.

Request body:

```json
{
  "name": "Apollo Holdings"
}
```

Response (`201`):

```json
{
  "id": "company-uuid",
  "name": "Apollo Holdings",
  "slug": "apollo-holdings",
  "ownerUserId": "user-uuid"
}
```

Possible errors:

- `401` missing/invalid token
- `400` validation error

---

### `POST /api/v1/companies/:companyId/team-members`

Adds a user to a company with role `ADMIN` or `STAFF`.

Permissions:

- caller must be `OWNER` or `ADMIN` member of that company

Request body:

```json
{
  "email": "staff1@company.com",
  "fullName": "Team Member",
  "password": "TeamPass123!",
  "role": "STAFF"
}
```

Behavior:

- If email does not exist: creates user (password required) and membership.
- If email already exists: creates membership only.

Response (`201`):

```json
{
  "createdUser": true,
  "membership": {
    "id": "membership-uuid",
    "role": "STAFF",
    "user": {
      "id": "user-uuid",
      "email": "staff1@company.com",
      "fullName": "Team Member"
    }
  }
}
```

Possible errors:

- `401` missing/invalid token
- `403` caller is not company OWNER/ADMIN
- `409` user already a member
- `400` validation error (including password missing for new user)

---

## 5) Common Error Format

Current error response shape:

```json
{
  "error": "Human readable message"
}
```

Validation errors include:

```json
{
  "error": "Validation failed",
  "details": {
    "fieldErrors": {},
    "formErrors": []
  }
}
```

---

## 6) Frontend Integration Flow (Recommended)

1. Register or sign in user.
2. Store JWT securely (memory + secure storage strategy per app).
3. Call `POST /api/v1/companies` once to create tenant company.
4. Call team-member endpoint to onboard additional users.
5. Use `/health` in diagnostics/ops views.

---

## 7) Environment Expectations (For API Deployment)

The backend supports either:

- `DATABASE_URL`, or
- split DB vars:
  - `DB_HOST`
  - `DB_PORT`
  - `DB_NAME`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_SSL`

Required:

- `JWT_SECRET`

Recommended:

- `JWT_EXPIRES_IN`
- `ALLOWED_ORIGINS`
- `NODE_ENV`
- `PORT`

