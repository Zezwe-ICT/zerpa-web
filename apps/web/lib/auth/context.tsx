"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { signIn as apiSignIn, register as apiRegister } from "@/lib/api/auth";
import type { SignInPayload, RegisterPayload, AuthResponse } from "@/lib/api/auth";
import { clearToken, getToken, setToken } from "@/lib/api/client";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

export interface AuthCompany {
  id: string;
  name: string;
  slug: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  company: AuthCompany | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (payload: SignInPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  setCompany: (company: AuthCompany) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = "zerpa_user";
const COMPANY_KEY = "zerpa_company";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [company, setCompanyState] = useState<AuthCompany | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const token = getToken();
    const storedUser = localStorage.getItem(USER_KEY);
    const storedCompany = localStorage.getItem(COMPANY_KEY);

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

    setIsLoading(false);
  }, []);

  const signIn = useCallback(async (payload: SignInPayload) => {
    const res = await apiSignIn(payload);
    setToken(res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
    // If no company on record, send to onboarding; otherwise dashboard
    const hasCompany = !!localStorage.getItem(COMPANY_KEY);
    router.push(hasCompany ? "/dashboard" : "/onboarding");
  }, [router]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await apiRegister(payload);
    setToken(res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
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
    setUser(null);
    setCompanyState(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        register,
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
