/**
 * Account security: forgot/reset password, email verification and change password.
 */
import { apiRequest } from "./client";

export const requestPasswordReset = (email: string) =>
  apiRequest<{ ok: boolean; message: string }>("/auth/password-reset", { method: "POST", body: { email } });

export const confirmPasswordReset = (uid: string, token: string, password: string) =>
  apiRequest<{ ok: boolean; message: string }>("/auth/password-reset/confirm", {
    method: "POST",
    body: { uid, token, password },
  });

export const verifyEmail = (token: string) =>
  apiRequest<{ ok: boolean; email: string }>("/auth/verify-email", { method: "POST", body: { token } });

export const resendVerification = () =>
  apiRequest<{ ok: boolean; message?: string; alreadyVerified?: boolean }>("/auth/verify-email/resend", {
    method: "POST",
    body: {},
  });

export const getSession = () => apiRequest<{ ok: boolean; emailVerified: boolean }>("/auth/session");

export const changePassword = (currentPassword: string, newPassword: string) =>
  apiRequest<{
    token: string;
    refreshToken: string;
    user: { id: string; email: string; fullName: string; emailVerified: boolean };
    message: string;
  }>("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } });

/** Same rules as the API (apps/core/accounts.py password_problem). */
export const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
  { label: "One capital letter", test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "One number", test: (pw: string) => /[0-9]/.test(pw) },
];

// ── Two-step sign-in ──────────────────────────────────────────────────────

export const getMfaStatus = () => apiRequest<{ enabled: boolean; backupCodesLeft: number }>("/auth/2fa");

export const startMfaSetup = () =>
  apiRequest<{ secret: string; otpauthUri: string }>("/auth/2fa/setup", { method: "POST", body: {} });

export const enableMfa = (code: string) =>
  apiRequest<{ enabled: true; backupCodes: string[] }>("/auth/2fa/enable", { method: "POST", body: { code } });

export const disableMfa = (password: string, code: string) =>
  apiRequest<{ enabled: false }>("/auth/2fa/disable", { method: "POST", body: { password, code } });

export const newBackupCodes = (code: string) =>
  apiRequest<{ backupCodes: string[] }>("/auth/2fa/backup-codes", { method: "POST", body: { code } });

// ── Your data (POPIA) ────────────────────────────────────────────────────

export const deleteMyAccount = (password: string, code?: string) =>
  apiRequest<{ deleted: boolean }>("/auth/delete-account", { method: "POST", body: { password, code } });

/** Downloads a file from an authenticated API endpoint (JSON or CSV) and saves it in the browser. */
export async function downloadFromApi(path: string, filename: string) {
  const { CONFIG } = await import("@/lib/config");
  const { getToken } = await import("./client");
  const companyRaw = typeof window !== "undefined" ? localStorage.getItem("zerpa_company") : null;
  const companyId = companyRaw ? (JSON.parse(companyRaw) as { id?: string }).id : undefined;
  const res = await fetch(`${CONFIG.apiUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${getToken() ?? ""}`,
      ...(companyId ? { "X-Company-Id": companyId } : {}),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || "Download failed");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
