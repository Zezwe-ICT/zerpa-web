# Updated: POST /api/v1/auth/sign-in
## Login Endpoint—MUST Return Company Data

**Issue:** When users log in, the frontend doesn't know if they have a company created, so it keeps redirecting to onboarding.

**Solution:** Include company data in the sign-in response.

---

## Request

```json
POST /api/v1/auth/sign-in

{
  "email": "owner@business.com",
  "password": "StrongPass123!"
}
```

---

## Response (200 OK)

```json
{
  "token": "<jwt_token>",
  "user": {
    "id": "user-uuid",
    "email": "owner@business.com",
    "fullName": "Owner Name"
  },
  "company": {
    "id": "company-uuid",
    "name": "Business Name",
    "vertical": "FUNERAL",
    "slug": "business-name"
  }
}
```

**Note:** If the user exists but NO company has been created yet, return:

```json
{
  "token": "<jwt_token>",
  "user": {
    "id": "user-uuid",
    "email": "owner@business.com",
    "fullName": "Owner Name"
  }
  // "company" field omitted or null
}
```

---

## Implementation Logic (Pseudocode)

```typescript
// POST /api/v1/auth/sign-in
async function signIn(req, res) {
  const { email, password } = req.body;
  
  // 1. Find user by email
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  // 2. Verify password
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  // 3. Generate JWT
  const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: "7d" });
  
  // 4. Find company (new step!)
  const company = await db.company.findFirst({
    where: { userId: user.id }
  });
  
  // 5. Return response with optional company
  return res.status(200).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName
    },
    ...(company && {
      company: {
        id: company.id,
        name: company.name,
        vertical: company.vertical,
        slug: company.slug
      }
    })
  });
}
```

---

## Changes Required

### Database Query
```typescript
// In your company repository/service:
const company = await prisma.company.findFirst({
  where: { userId: user.id }
});
```

### Response Type
```typescript
// Update Prisma schema if using Prisma:
model SignInResponse {
  token: String
  user: {
    id: String
    email: String
    fullName: String
  }
  company?: {  // Optional
    id: String
    name: String
    vertical: String
    slug?: String
  }
}
```

---

## Frontend Impact

✅ Frontend updated to handle `company` in response  
✅ When company is present: redirects to `/dashboard`  
✅ When company is null/missing: redirects to `/onboarding`  
✅ No more asking to re-create company on login

---

## Testing

```bash
# Test 1: Login with company created
curl -X POST https://localhost:3000/api/v1/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@business.com",
    "password": "StrongPass123!"
  }'

# Expected: Response includes "company" object
# Frontend: Redirects to /dashboard (pre-fills company data)

# Test 2: Login without company created
curl -X POST https://localhost:3000/api/v1/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@mail.com",
    "password": "AnotherPass123!"
  }'

# Expected: Response does NOT include "company"
# Frontend: Redirects to /onboarding (prompts to create company)
```

---

## Files Modified

1. **Frontend:** `/apps/web/lib/api/auth.ts` — Added `AuthCompany` type to `AuthResponse`
2. **Frontend:** `/apps/web/lib/auth/context.tsx` — Updated `signIn()` to extract and store company from response
3. **Backend:** `/api/v1/auth/sign-in` — ⬅️ **THIS NEEDS TO BE UPDATED BY BACKEND TEAM**

---

## Summary

**Before:** Login returned only user → frontend checks localStorage → redirects to /onboarding  
**After:** Login returns user + company → frontend saves company → redirects to /dashboard

User never sees re-onboarding prompt again after first login. ✅
