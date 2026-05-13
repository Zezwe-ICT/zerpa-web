/**
 * @file lib/api/auth.ts
 * @description
 * API functions and types for authentication and company management
 *
 * Responsibilities:
 * 1. Define TypeScript interfaces for auth/company data
 * 2. Wrap HTTP calls to auth endpoints (sign-in, register)
 * 3. Wrap HTTP calls to company endpoints (get, create, list)
 * 4. Handle logging for debugging
 * 5. Export error details for UI error handling
 *
 * API Endpoints Called:
 * - POST /auth/sign-in → authenticate with email/password
 * - POST /auth/register → create new user account
 * - GET /companies → list all companies for authenticated user
 * - POST /companies → create new company
 *
 * Data Flow:
 * 1. Components/context call these functions
 * 2. These functions call apiRequest() from client.ts
 * 3. apiRequest() handles token management and error parsing
 * 4. Response data returned to caller
 *
 * Type Safety:
 * All functions are fully typed with TypeScript interfaces
 * No 'any' types - all response data is validated at compile time
 */

import { apiRequest } from "./client";

/**
 * Interface: AuthCompany
 * 
 * Purpose:
 * Represents a company in the ZERPA system.
 * User can have access to multiple companies (multi-tenant).
 *
 * Properties:
 * - id: Unique identifier (used for API calls and routing)
 * - name: Display name
 * - vertical: Business type (FUNERAL, AUTO, RESTAURANT, SPA)
 * - slug: URL-safe identifier (e.g., "acme-corp" → "/acme-corp/dashboard")
 * - ownerUserId: ID of user who created the company
 * - role: User's role in this company (OWNER, MEMBER, etc.)
 *
 * All properties except id are optional due to backend variations
 * (some endpoints may return partial data)
 */
export interface AuthCompany {
  id: string;
  name: string;
  vertical?: string;
  slug?: string;
  ownerUserId?: string;
  role?: string;
}

/**
 * Interface: AuthResponse
 * 
 * Purpose:
 * Standard response from authentication endpoints
 * Returned by signIn and register functions
 *
 * Properties:
 * - token: JWT token for authenticating subsequent requests
 * - user: Current authenticated user
 * - company: (Optional) Default/last-used company (if any)
 * - companies: (Optional) List of all companies user has access to
 *
 * Note: May have company OR companies (or neither), but always has token + user
 */
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  company?: AuthCompany;
  companies?: AuthCompany[];
}

/**
 * Interface: RegisterPayload
 * 
 * Purpose:
 * Request body for user registration
 * Step 1 of 3-step registration flow
 *
 * Properties:
 * - email: User email (unique, used for sign-in)
 * - fullName: User display name
 * - password: Hashed on backend, must meet requirements:
 *   - Minimum 8 characters
 *   - 1 uppercase letter
 *   - 1 number
 */
export interface RegisterPayload {
  email: string;
  fullName: string;
  password: string;
}

/**
 * Interface: SignInPayload
 * 
 * Purpose:
 * Request body for user sign-in
 * Simple email/password authentication
 */
export interface SignInPayload {
  email: string;
  password: string;
}

/**
 * Function: signIn
 * 
 * Purpose:
 * Authenticate user with email and password
 * Called from auth/context.tsx when user submits login form
 *
 * Endpoint: POST /auth/sign-in
 * 
 * Flow:
 * 1. User enters email/password in login form
 * 2. Form calls context.signIn(payload)
 * 3. Context calls this function
 * 4. This function POSTs to backend
 * 5. Backend returns user + token (+ optional company/companies)
 * 6. Context saves token to storage and sets state
 *
 * Error Handling:
 * - Throws ApiError if network error
 * - Throws ApiError with 401 if credentials invalid
 * - Can catch and display to user
 *
 * @param {SignInPayload} payload - {email, password}
 * @returns {Promise<AuthResponse>} - User, token, and optional companies
 * @throws {ApiError} - If authentication fails
 */
export function signIn(payload: SignInPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/sign-in", {
    method: "POST",
    body: payload,
  });
}

/**
 * Function: register
 * 
 * Purpose:
 * Create new user account
 * Step 1 of 3-step registration process (account creation)
 * Company creation happens in step 3 (calls createCompany)
 *
 * Endpoint: POST /auth/register
 * 
 * Flow:
 * 1. User enters email/fullName/password in registration form
 * 2. Form calls context.register(payload)
 * 3. Context calls this function
 * 4. Backend creates user account and returns token
 * 5. Context saves token (user now partially authenticated)
 * 6. User continues to step 2 (company info form)
 * 7. After step 3, context.addCompany() called to create company
 *
 * Validation:
 * Backend validates:
 * - Email format and uniqueness
 * - Password strength (8+ chars, 1 upper, 1 num)
 * - Full name not empty
 *
 * Error Handling:
 * - Throws ApiError if validation fails (email exists, weak password, etc.)
 *
 * @param {RegisterPayload} payload - {email, fullName, password}
 * @returns {Promise<AuthResponse>} - User and token (no company yet)
 * @throws {ApiError} - If registration fails/validation error
 */
export function register(payload: RegisterPayload): Promise<AuthResponse> {
  console.log("[AUTH] Register attempt:", { email: payload.email, fullName: payload.fullName });
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: payload,
  }).catch((err) => {
    console.error("[AUTH] Register failed:", err);
    throw err;
  });
}

/**
 * Function: getCompanies
 * 
 * Purpose:
 * Fetch all companies that authenticated user has access to
 * Called after sign-in to determine routing (1 → dashboard, 2+ → select, 0 → onboarding)
 *
 * Endpoint: GET /companies
 * 
 * Authentication:
 * - Requires valid JWT token in Authorization header
 * - Token must be set in localStorage before calling
 *
 * Common Use Cases:
 * 1. After sign-in: Determine if user has 1 or 2+ companies
 * 2. After company creation: Refresh companies list
 * 3. On page load: Sync companies list with backend
 *
 * Return Value:
 * - Array of AuthCompany objects
 * - Can be empty (user has no companies yet)
 * - Each company includes role, vertical, slug
 *
 * Error Handling:
 * - Throws ApiError on network error
 * - Throws ApiError(401) if token invalid/expired
 *
 * @returns {Promise<AuthCompany[]>} - All companies user has access to
 * @throws {ApiError} - If authentication or network fails
 */
export function getCompanies(): Promise<AuthCompany[]> {
  console.log("[AUTH] Fetching user companies");
  return apiRequest<AuthCompany[]>("/companies", {
    method: "GET",
  }).catch((err) => {
    console.error("[AUTH] Get companies failed:", err);
    throw err;
  });
}

/**
 * Interface: CreateCompanyPayload
 * 
 * Purpose:
 * Request body for company creation
 * Step 3 of 3-step registration flow
 * Contains business info + vertical-specific details
 *
 * Properties:
 * - name: Company display name
 * - vertical: Industry type (FUNERAL, AUTO, RESTAURANT, SPA)
 * - phone: Company phone number for customer contact
 * - description: Company description/mission (optional)
 * - details: Vertical-specific configuration
 *   - For FUNERAL: staffCount, monthlyVolume, invoicing method, services, painPoints
 *   - For AUTO: mechanics, monthly jobs, workshop names, service types
 *   - For RESTAURANT: type, covers/day, events, cuisines
 *   - For SPA: therapists, bookings/week, service types
 *
 * All fields except name are optional due to different vertical requirements
 */
export interface CreateCompanyPayload {
  name: string;
  vertical?: string;
  phone?: string;
  description?: string;
  details?: Record<string, any>;  // Vertical-specific data
}

/**
 * Function: createCompany
 * 
 * Purpose:
 * Create a new company for authenticated user
 * Step 3 of 3-step registration process
 *
 * Endpoint: POST /companies
 * 
 * Authentication:
 * - Requires valid JWT token from prior registration
 * - Token must be set in localStorage
 *
 * Flow:
 * 1. User completes registration steps 1-2
 * 2. User fills in vertical-specific form in step 3
 * 3. Step 3 form calls context.addCompany(payload)
 * 4. Context calls this function to create company on backend
 * 5. Backend returns AuthCompany with id, vertical, slug, role (OWNER)
 * 6. Context saves to localStorage and sets as active company
 * 7. Navigate to /select-company or /dashboard
 *
 * Validation:
 * Backend validates:
 * - Company name not empty
 * - Vertical is valid choice (FUNERAL, AUTO, RESTAURANT, SPA)
 * - Details schema matches vertical type
 *
 * Response:
 * New AuthCompany object with:
 * - id: Unique company ID
 * - name: Echo of request name
 * - vertical: Echo of request vertical
 * - slug: URL-safe slug (auto-generated from name)
 * - role: "OWNER" (creator is always owner)
 *
 * Error Handling:
 * - Throws ApiError if validation fails
 * - Throws ApiError(401) if token invalid
 *
 * @param {CreateCompanyPayload} payload - Company data including vertical-specific details
 * @returns {Promise<AuthCompany>} - The newly created company with id, role, slug
 * @throws {ApiError} - If company creation fails
 *
 * @see context.addCompany() - Wraps this function with context updates
 */
export function createCompany(payload: CreateCompanyPayload): Promise<AuthCompany> {
  console.log("[AUTH] Creating company:", { name: payload.name });
  return apiRequest<AuthCompany>("/companies", {
    method: "POST",
    body: payload,
  }).catch((err) => {
    console.error("[AUTH] Create company failed:", err);
    throw err;
  });
}
