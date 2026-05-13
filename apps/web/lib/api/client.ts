/**
 * @file lib/api/client.ts
 * @description
 * HTTP Client for ZERPA API communication
 *
 * Responsibilities:
 * 1. Abstract fetch() API calls with error handling
 * 2. Manage JWT token storage and inclusion in requests
 * 3. Handle API errors and parse error responses
 * 4. Log requests/responses for debugging
 * 5. Support CORS for development environments
 *
 * Architecture:
 * - apiRequest(): Generic wrapper for all HTTP calls
 * - Token helpers: getToken, setToken, clearToken
 * - ApiError: Custom error class with status and details
 *
 * Token Management:
 * - Stored in localStorage (should be httpOnly cookie in production)
 * - Sent as "Bearer {token}" in Authorization header
 * - Cleared on logout via clearToken()
 *
 * Usage:
 * ```typescript
 * // GET request
 * const user = await apiRequest<User>('/users/me');
 *
 * // POST request
 * const newCompany = await apiRequest<Company>(
 *   '/companies',
 *   { method: 'POST', body: { name: 'ACME' } }
 * );
 * ```
 */

import { CONFIG } from "@/lib/config";

/**
 * Storage key for JWT token in localStorage
 * Using "zerpa_token" prefix to namespace and avoid conflicts
 */
const TOKEN_KEY = "zerpa_token";

/**
 * Function: getToken
 * 
 * Purpose: Retrieve JWT token from localStorage for API authentication
 * 
 * Implementation notes:
 * - Returns null during SSR (when window is undefined)
 * - Returns null if token not found (user not logged in)
 * - Token is automatically included in all apiRequest() calls
 *
 * @returns {string | null} JWT token or null
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Function: setToken
 * 
 * Purpose: Store JWT token in localStorage for persistence across sessions
 * 
 * Called by:
 * - Auth context after sign-in
 * - Auth context after registration
 *
 * Implementation notes:
 * - Should only be called from auth context (not from components)
 * - Token persists across browser sessions
 * - Token NOT automatically cleared when expired (manual signOut required)
 *
 * Security note: In production, use httpOnly cookie instead of localStorage
 *
 * @param {string} token - JWT token from backend
 */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Function: clearToken
 * 
 * Purpose: Remove JWT token from localStorage on logout
 * 
 * Called by:
 * - Auth context signOut() function
 * - Manually when session should end
 *
 * @see useAuth.signOut()
 */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Type: RequestOptions
 * 
 * Purpose: Extend standard RequestInit with custom body typing
 * 
 * Allows passing objects/arrays that will be JSON serialized
 * Instead of requiring pre-stringified body
 *
 * Example:
 * ```typescript
 * apiRequest('/', {
 *   method: 'POST',
 *   body: { name: 'Test' }  // Automatically JSON.stringify
 * });
 * ```
 */
type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;  // Typed body that will be JSON.stringify'd
};

/**
 * Class: ApiError
 * 
 * Custom error class for API failures
 * 
 * Purpose:
 * Wrap API errors with structured information for better error handling.
 * Allows components to check error.status and error.details.
 *
 * Usage:
 * ```typescript
 * try {
 *   await apiRequest('/users');
 * } catch (error) {
 *   if (error instanceof ApiError && error.status === 404) {
 *     console.log('User not found');
 *   }
 * }
 * ```
 *
 * Properties:
 * - status: HTTP status code
 * - message: Error message (human readable)
 * - details: Additional error details (validation errors, reasons, etc.)
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Function: apiRequest
 * 
 * Purpose:
 * Make HTTP requests to the backend API with automatic error handling.
 * This is the ONLY way to call the backend—all other functions use this.
 *
 * Responsibilities:
 * 1. Add JWT token to Authorization header if logged in
 * 2. JSON.stringify request body
 * 3. Parse response JSON
 * 4. Handle errors (network, HTTP errors, server errors)
 * 5. Log all requests/responses for debugging
 * 6. Type the response with generic parameter <T>
 *
 * Flow:
 * 1. Build request headers (Content-Type + Authorization)
 * 2. Resolve full API URL from path
 * 3. Log request details
 * 4. Fetch from backend
 * 5. If error, log and throw ApiError
 * 6. If success, parse JSON and return
 *
 * Networking:
 * - Network errors (no connection) throw ApiError(0, 'Network error...')
 * - HTTP errors (4xx, 5xx) throw ApiError(status, message, details)
 * - Success (2xx) returns parsed JSON
 *
 * Logging (in console):
 * - [API] Request: method, URL, headers preview
 * - [API] Response: status code
 * - [API] Error: status, message, details
 * - [API] Success: full response body
 *
 * Error Handling:
 * - Network error: "Network error — could not reach {url}"
 * - HTTP error: Tries to parse error.message from response
 * - Special handling: Extracts Zod validation field errors
 *
 * Type Safety:
 * Caller specifies response type as generic parameter:
 * ```typescript
 * const user = await apiRequest<User>('/users/me');
 * // user is typed as User
 * ```
 *
 * @template T - Response data type (inferred from usage)
 * @param {string} path - API endpoint path (e.g., '/auth/sign-in')
 * @param {RequestOptions} options - Request options (method, body, headers, etc.)
 * @returns {Promise<T>} - Parsed response data
 * @throws {ApiError} - If request fails (network or HTTP error)
 *
 * Example:
 * ```typescript
 * // GET
 * const companies = await apiRequest<Company[]>('/companies');
 *
 * // POST
 * const result = await apiRequest<AuthResponse>('/auth/sign-in', {
 *   method: 'POST',
 *   body: { email: 'user@example.com', password: '...' }
 * });
 *
 * // Error handling
 * try {
 *   await apiRequest<User>('/nonexistent');
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     console.error(`HTTP ${error.status}: ${error.message}`);
 *   }
 * }
 * ```
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  // Extract body and merge headers
  const { body, headers: extraHeaders, ...rest } = options;

  // Build headers with content type and auth token
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string>),
  };

  // Add JWT token to Authorization header if logged in
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Resolve full API URL
  // Handle both /api/v1/... paths and direct /auth/... paths
  const url = path.startsWith("/api") || path.startsWith("/health")
    ? `${CONFIG.apiUrl.replace("/api/v1", "")}${path}`
    : `${CONFIG.apiUrl}${path}`;

  // Log request for debugging
  console.log(`[API] ${rest.method || "GET"} ${url}`, {
    headers,
    bodyPreview: body ? JSON.stringify(body).substring(0, 100) : undefined,
  });

  // Execute fetch with error handling
  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    // Network error (no internet, CORS blocked, invalid URL, etc.)
    const error = `Network error — could not reach ${url}. Check CORS or server availability.`;
    console.error(`[API] Network Error on ${rest.method || "GET"} ${url}:`, networkErr);
    console.error(`[API] Error Details:`, error);
    throw new ApiError(0, error);
  }

  // Log response status
  console.log(`[API] Response Status: ${res.status} ${res.statusText}`);

  // Handle HTTP errors (4xx, 5xx)
  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    let details: unknown;
    try {
      // Try to parse error response
      const data = await res.json();
      errorMessage = data.error ?? data.message ?? errorMessage;
      details = data.details;
      
      // Special handling for Zod validation errors
      // Extract first field error for better UX
      if (
        errorMessage === "Validation failed" &&
        data.details?.fieldErrors
      ) {
        const fieldErrors = data.details.fieldErrors as Record<string, string[]>;
        const firstField = Object.keys(fieldErrors)[0];
        if (firstField && fieldErrors[firstField]?.length) {
          const label = firstField.charAt(0).toUpperCase() + firstField.slice(1);
          errorMessage = `${label}: ${fieldErrors[firstField][0]}`;
        }
      }
    } catch {
      // Could not parse error response, use default message
    }
    
    console.error(`[API] Error Response (${res.status}):`, {
      message: errorMessage,
      details,
    });
    throw new ApiError(res.status, errorMessage, details);
  }

  // Success: parse and return response
  const responseData = await res.json();
  console.log(`[API] Success Response:`, responseData);
  return responseData as Promise<T>;
}
