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

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}



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

const USER_KEY = "zerpa_user";
const COMPANY_KEY = "zerpa_company";
const COMPANIES_KEY = "zerpa_companies";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [company, setCompanyState] = useState<AuthCompany | null>(null);
  const [companies, setCompaniesState] = useState<AuthCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const token = getToken();
    const storedUser = localStorage.getItem(USER_KEY);
    const storedCompany = localStorage.getItem(COMPANY_KEY);
    const storedCompanies = localStorage.getItem(COMPANIES_KEY);

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        clearToken();
        localStorage.removeItem(USER_KEY);
      }
    }

    if (storedCompany) {
      try {
        setCompanyState(JSON.parse(storedCompany));
      } catch {
        localStorage.removeItem(COMPANY_KEY);
      }
    }

    if (storedCompanies) {
      try {
        setCompaniesState(JSON.parse(storedCompanies));
      } catch {
        localStorage.removeItem(COMPANIES_KEY);
      }
    }
    }

    setIsLoading(false);
  }, []);

  const signIn = useCallback(
    async (payload: SignInPayload) => {
      const res = await apiSignIn(payload);
      setToken(res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      setUser(res.user);

      // Handle multiple companies from response
      const companiesList = res.companies || (res.company ? [res.company] : []);
      
      if (companiesList.length > 0) {
        localStorage.setItem(COMPANIES_KEY, JSON.stringify(companiesList));
        setCompaniesState(companiesList);

        if (companiesList.length === 1) {
          // Single company: auto-select and go to dashboard
          localStorage.setItem(COMPANY_KEY, JSON.stringify(companiesList[0]));
          setCompanyState(companiesList[0]);
          router.push("/dashboard");
        } else {
          // Multiple companies: show selector
          router.push("/select-company");
        }
      } else {
        // No company: go to onboarding
        router.push("/onboarding");
      }
    },
    [router]
  );

  const selectCompany = useCallback(
    (companyId: string) => {
      const selected = companies.find((c) => c.id === companyId);
      if (selected) {
        localStorage.setItem(COMPANY_KEY, JSON.stringify(selected));
        setCompanyState(selected);
        router.push("/dashboard");
      }
    },
    [companies, router]
  );

  const addCompany = useCallback(
    async (payload: CreateCompanyPayload) => {
      const newCompany = await apiCreateCompany(payload);
      const updated = [...companies, newCompany];
      localStorage.setItem(COMPANIES_KEY, JSON.stringify(updated));
      setCompaniesState(updated);
      localStorage.setItem(COMPANY_KEY, JSON.stringify(newCompany));
      setCompanyState(newCompany);
      return newCompany;
    },
    [companies]
  );

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await apiRegister(payload);
    setToken(res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
    // If company returned from API (multi-step registration), save it
    if (res.company) {
      localStorage.setItem(COMPANY_KEY, JSON.stringify(res.company));
      setCompanyState(res.company);
      const companiesList = [res.company];
      localStorage.setItem(COMPANIES_KEY, JSON.stringify(companiesList));
      setCompaniesState(companiesList);
    }
    return res;
  }, []);

  const setCompany = useCallback((c: AuthCompany) => {
    localStorage.setItem(COMPANY_KEY, JSON.stringify(c));
    setCompanyState(c);
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(COMPANY_KEY);
    localStorage.removeItem(COMPANIES_KEY);
    setUser(null);
    setCompanyState(null);
    setCompaniesState([]);
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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
