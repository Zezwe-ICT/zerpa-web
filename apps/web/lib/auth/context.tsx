/**
 * @file lib/auth/context.tsx
 * @description Global Authentication Context for the ZERPA application.
 * Manages user, token and company state. Provides signIn, register, selectCompany,
 * addCompany and signOut functions. Persists state to localStorage.
 * Auth state is hydrated on mount from zerpa_user / zerpa_company storage keys.
 */
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  signIn as apiSignIn,
  register as apiRegister,
  getCompanies as apiGetCompanies,
  createCompany as apiCreateCompany,
} from "@/lib/api/auth";
import type {
  SignInPayload,
  RegisterPayload,
  AuthResponse,
  AuthCompany,
  CreateCompanyPayload,
} from "@/lib/api/auth";
import { clearToken, getToken, setToken } from "@/lib/api/client";

/**
 * Represents an authenticated user in the ZERPA system
 * Contains basic user identity information
 * @typedef {Object} AuthUser
 * @property {string} id - Unique user identifier from backend
 * @property {string} email - User email address (unique, used for sign-in)
 * @property {string} fullName - User display name (set during registration)
 */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

/**
 * Represents a company that a user has access to
 * Can have different roles and vertical-specific configurations
 * @typedef {Object} AuthCompany
 * @property {string} id - Unique company identifier
 * @property {string} name - Company display name
 * @property {string} role - User's role in this company (e.g., "OWNER", "MEMBER")
 * @property {string} vertical - Industry vertical (FUNERAL, AUTO, RESTAURANT, SPA)
 * @property {string} [workspaceSlug] - URL-safe company slug (optional)
 * @property {string} [phone] - Company phone number (optional)
 */

/**
 * Complete AuthContext interface containing all auth-related state and functions
 * Used by useAuth hook for type safety across the app
 * @typedef {Object} AuthContextValue
 * @property {AuthUser | null} user - Current authenticated user or null
 * @property {AuthCompany | null} company - Currently selected company or null
 * @property {AuthCompany[]} companies - All companies user has access to
 * @property {boolean} isLoading - Initial auth state hydration from localStorage
 * @property {boolean} isAuthenticated - Quick check if user is logged in
 * @property {Function} signIn - Sign in user with email/password
 * @property {Function} register - Register new user account
 * @property {Function} selectCompany - Switch to different company
 * @property {Function} addCompany - Create new company (during registration)
 * @property {Function} setCompany - Manually update active company
 * @property {Function} signOut - Clear auth state and logout
 */
interface AuthContextValue {
  user: AuthUser | null;
  company: AuthCompany | null;
  companies: AuthCompany[];
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (payload: SignInPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  selectCompany: (companyId: string) => void;
  addCompany: (payload: CreateCompanyPayload) => Promise<AuthCompany>;
  setCompany: (company: AuthCompany) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Storage keys for persisting auth state to localStorage
 * Using "zerpa_" prefix to namespace and avoid conflicts with other apps
 */
const USER_KEY = "zerpa_user";      // Stores AuthUser object
const COMPANY_KEY = "zerpa_company";    // Stores currently selected AuthCompany
const COMPANIES_KEY = "zerpa_companies"; // Stores array of all user's companies

/**
 * AuthProvider Component
 *
 * Purpose:
 * Wraps the entire application to provide authentication context to all child components.
 * Handles initial state hydration from localStorage and provides auth functions.
 *
 * Lifecycle:
 * 1. Mount: Load auth state from localStorage (sync)
 * 2. Render: Provide context to all children (may show loading state)
 * 3. Child components: Can call useAuth() to access auth state and functions
 *
 * Key Features:
 * - useCallback for all functions to optimize React re-renders
 * - localStorage persistence across browser sessions
 * - Error handling for corrupted stored data
 * - Multi-company support with switching capability
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @returns {React.ReactElement} - Context provider wrapping children
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  // Auth state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [company, setCompanyState] = useState<AuthCompany | null>(null);
  const [companies, setCompaniesState] = useState<AuthCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Effect: Rehydrate auth state from localStorage on component mount
   * 
   * Runs once on mount to restore user session if available.
   * Silently clears corrupted data (try/catch with fallback).
   * Sets isLoading=false after hydration completes.
   *
   * Order of operations:
   * 1. Check if token exists in cookie/header (from api/client.ts)
   * 2. Load user from localStorage (only if token exists)
   * 3. Load active company from localStorage
   * 4. Load all companies from localStorage
   * 5. Mark hydration complete (isLoading=false)
   */
  useEffect(() => {
    const token = getToken();
    const storedUser = localStorage.getItem(USER_KEY);
    const storedCompany = localStorage.getItem(COMPANY_KEY);
    const storedCompanies = localStorage.getItem(COMPANIES_KEY);

    // Only load user if we have a valid token
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // Data corrupted, clear auth
        clearToken();
        localStorage.removeItem(USER_KEY);
      }
    }

    // Load active company (regardless of token)
    if (storedCompany) {
      try {
        setCompanyState(JSON.parse(storedCompany));
      } catch {
        // Data corrupted, clear it
        localStorage.removeItem(COMPANY_KEY);
      }
    }

    // Load all companies (regardless of token)
    if (storedCompanies) {
      try {
        setCompaniesState(JSON.parse(storedCompanies));
      } catch {
        // Data corrupted, clear it
        localStorage.removeItem(COMPANIES_KEY);
      }
    }

    // Mark rehydration complete
    setIsLoading(false);
  }, []);

  /**
   * Function: signIn
   * 
   * Purpose:
   * Authenticate user with email/password and fetch all their companies.
   * Routes user based on company count:
   * - 0 companies: /onboarding (create first company)
   * - 1 company: /dashboard (auto-select company)
   * - 2+ companies: /select-company (let user choose)
   *
   * Implementation Details:
   * 1. Call backend API with email/password
   * 2. Store JWT token in secure storage (httpOnly cookie preferred, fallback to sessionStorage)
   * 3. Save user object to localStorage
   * 4. IMPORTANT: Always fetch all companies from /companies endpoint
   *    (Not just from sign-in response, which may only return default company)
   * 5. Fall back to response.companies if /companies fetch fails (network error recovery)
   * 6. Save companies list to localStorage
   * 7. Route based on company count
   *
   * Error Handling:
   * - Network errors: Fallback to response.company from sign-in
   * - Empty company list: Route to /onboarding
   *
   * @param {SignInPayload} payload - {email, password}
   * @throws {Error} - If API call fails (displayed to user in UI)
   */
  const signIn = useCallback(
    async (payload: SignInPayload) => {
      // Authenticate with backend
      const res = await apiSignIn(payload);
      
      // Store JWT token (for subsequent API calls)
      setToken(res.token);
      
      // Store user info in localStorage and context
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      setUser(res.user);

      /**
       * Critical: Always fetch full company list via separate API call
       * 
       * Why separate call? Backend sign-in response may only return:
       * - The last used company, OR
       * - The default company, OR
       * - A single company
       * 
       * But user may have 2+ companies and need to choose.
       * So we make a separate GET /companies to fetch ALL.
       */
      let companiesList: AuthCompany[] = [];
      try {
        const fetched = await apiGetCompanies();
        companiesList = Array.isArray(fetched) ? fetched : [];
      } catch {
        // Network error: Fall back to response data
        companiesList = res.companies || (res.company ? [res.company] : []);
      }

      // Save all companies to localStorage
      if (companiesList.length > 0) {
        localStorage.setItem(COMPANIES_KEY, JSON.stringify(companiesList));
        setCompaniesState(companiesList);

        /**
         * Route based on company count
         * This is the key logic for the multi-tenant sign-in flow
         */
        if (companiesList.length === 1) {
          // Only one company: Auto-select and go to dashboard
          localStorage.setItem(COMPANY_KEY, JSON.stringify(companiesList[0]));
          setCompanyState(companiesList[0]);
          router.push("/dashboard");
        } else {
          // Multiple companies: User must choose
          router.push("/select-company");
        }
      } else {
        // No companies: User must create one
        router.push("/onboarding");
      }
    },
    [router]
  );

  /**
   * Function: selectCompany
   * 
   * Purpose:
   * Switch to a different company (for users with multiple companies).
   * Updates active company in context and localStorage, then navigates to dashboard.
   *
   * Implementation:
   * 1. Find company by ID in companies array
   * 2. Save to localStorage as active company
   * 3. Update context state
   * 4. Navigate to /dashboard
   *
   * Note: Does nothing if companyId not found (silent fail)
   *
   * @param {string} companyId - ID of company to select
   */
  const selectCompany = useCallback(
    (companyId: string) => {
      const selected = companies.find((c) => c.id === companyId);
      if (selected) {
        // Persist active company choice
        localStorage.setItem(COMPANY_KEY, JSON.stringify(selected));
        setCompanyState(selected);
        // Navigate to company dashboard
        router.push("/dashboard");
      }
    },
    [companies, router]
  );

  /**
   * Function: addCompany
   * 
   * Purpose:
   * Create a new company during registration flow.
   * Adds company to context state AND backend storage.
   *
   * Flow:
   * 1. Call backend API to create company (POST /companies)
   * 2. Add returned company to companies array
   * 3. Save updated array to localStorage
   * 4. Set as active company (auto-select new company)
   * 5. Return the company object
   *
   * Important: Updates BOTH context and localStorage atomically
   * This ensures /select-company page shows new company immediately
   *
   * @param {CreateCompanyPayload} payload - Company creation data (name, vertical, details)
   * @returns {Promise<AuthCompany>} - The newly created company
   * @throws {Error} - If API call fails
   */
  const addCompany = useCallback(
    async (payload: CreateCompanyPayload) => {
      // Create company on backend
      const newCompany = await apiCreateCompany(payload);
      
      // Update companies list in context and storage
      const updated = [...companies, newCompany];
      localStorage.setItem(COMPANIES_KEY, JSON.stringify(updated));
      setCompaniesState(updated);
      
      // Set as active company
      localStorage.setItem(COMPANY_KEY, JSON.stringify(newCompany));
      setCompanyState(newCompany);
      
      return newCompany;
    },
    [companies]
  );

  /**
   * Function: register
   * 
   * Purpose:
   * Register a new user account (email, password, full name).
   * Does NOT create company here—company is created in addCompany() during step 3.
   *
   * Flow:
   * 1. Call backend API to create user account
   * 2. Store JWT token from response
   * 3. Save user to context and localStorage
   * 4. If company returned from API, also save to context/storage
   *    (e.g., if backend returned a default company)
   * 5. Return response for caller to handle next step
   *
   * Note: This is step 1 of 3-step registration. Companies created in step 3.
   *
   * @param {RegisterPayload} payload - {email, password, fullName}
   * @returns {Promise<AuthResponse>} - User and optional company from backend
   * @throws {Error} - If API call fails
   */
  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await apiRegister(payload);
    setToken(res.token);
    
    // Save user to context and storage
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
    
    // If company came back from API, save it too
    if (res.company) {
      localStorage.setItem(COMPANY_KEY, JSON.stringify(res.company));
      setCompanyState(res.company);
      const companiesList = [res.company];
      localStorage.setItem(COMPANIES_KEY, JSON.stringify(companiesList));
      setCompaniesState(companiesList);
    }
    
    return res;
  }, []);

  /**
   * Function: setCompany
   * 
   * Purpose:
   * Manually update the active company in context and localStorage.
   * Lower-level than selectCompany (doesn't route or search).
   *
   * Use case: When you have a company object and want to set it active.
   * selectCompany() is preferred in most cases (includes navigation).
   *
   * @param {AuthCompany} c - Company object to set as active
   */
  const setCompany = useCallback((c: AuthCompany) => {
    localStorage.setItem(COMPANY_KEY, JSON.stringify(c));
    setCompanyState(c);
  }, []);

  /**
   * Function: signOut
   * 
   * Purpose:
   * Clear all auth state and return user to login page.
   * Clears both context state AND localStorage.
   *
   * Flow:
   * 1. Clear JWT token from storage
   * 2. Remove all auth data from localStorage
   * 3. Set all context state to null
   * 4. Navigate to /login
   *
   * Note: Should be called when user clicks logout or token expires
   */
  const signOut = useCallback(() => {
    // Clear token from secure storage
    clearToken();
    
    // Clear auth data from localStorage
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(COMPANY_KEY);
    localStorage.removeItem(COMPANIES_KEY);
    
    // Clear context state
    setUser(null);
    setCompanyState(null);
    setCompaniesState([]);
    
    // Return to login
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        companies,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        register,
        selectCompany,
        addCompany,
        setCompany,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook: useAuth
 * 
 * Purpose:
 * Access the auth context from anywhere in the app.
 * Provides type-safe access to user, company, and auth functions.
 *
 * Usage:
 * ```tsx
 * const { user, company, signIn, signOut } = useAuth();
 * 
 * if (!user) return <Redirect to="/login" />;
 * return <div>User: {user.fullName}, Company: {company.name}</div>;
 * ```
 *
 * Rules:
 * - Must be called inside a component wrapped by <AuthProvider>
 * - Throws error if called outside provider
 * - Safe to call multiple times (returns same context)
 * - Causes re-render when any context value changes
 *
 * Required Provider:
 * The app must be wrapped with <AuthProvider> before using this hook.
 * Typically done in app/layout.tsx.
 *
 * @returns {AuthContextValue} - Auth state and functions
 * @throws {Error} - If called outside AuthProvider
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
