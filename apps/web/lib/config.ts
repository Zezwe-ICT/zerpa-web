/**
 * @file lib/config.ts
 * @description
 * Centralized application configuration from environment variables
 * 
 * Purpose:
 * - Load environment variables with sensible defaults
 * - Provide type-safe config object throughout app
 * - Support feature flags for gradual rollout
 * - Define vertical priority ordering
 * - Use 'as const' for type narrowing
 *
 * Environment Variables:
 * All values come from .env.local or deployment config
 * NEXT_PUBLIC_* variables are exposed to browser (safe, public)
 * Use carefully—never put secrets in NEXT_PUBLIC_ variables
 *
 * Usage:
 * ```typescript
 * import { CONFIG } from '@/lib/config';
 * 
 * if (CONFIG.useMock) {
 *   // Use mock data instead of API
 * }
 * 
 * const fullUrl = `${CONFIG.apiUrl}/companies`;
 * ```
 */

export const CONFIG = {
  /**
   * useMock: boolean
   * 
   * Purpose: Toggle between real API and mock data
   * 
   * Behavior:
   * - true: Use mock data from lib/mock/* files (for local development)
   * - false: Use real backend API
   * 
   * Set by: NEXT_PUBLIC_USE_MOCK environment variable
   * Default: false
   *
   * Use Cases:
   * - Development: Set to true to avoid backend dependency
   * - Testing: Mock data ensures consistent results
   * - Demo: Run frontend standalone without backend
   *
   * Implementation:
   * - Mock functions in lib/mock/* check this flag
   * - API functions in lib/api/* still called, but intercepted
   * - Or lib/api/* functions can check and return mock data
   */
  useMock: process.env.NEXT_PUBLIC_USE_MOCK === "true",

  /**
   * apiUrl: string
   * 
   * Purpose: Base URL for all backend API calls
   * 
   * Format: "http(s)://host:port/api/v1"
   * Examples:
   * - Local dev: "http://localhost:4000/api/v1"
   * - Staging: "https://api-staging.zerpa.io/api/v1"
   * - Production: "https://api.zerpa.io/api/v1"
   *
   * Set by: NEXT_PUBLIC_API_URL environment variable
   * Default: "http://localhost:4000/api/v1"
   *
   * Used in:
   * - lib/api/client.ts: apiRequest() prepends this URL
   * - All API endpoints are relative to this base
   * - CORS must be configured on backend
   *
   * Example:
   * apiUrl = "http://localhost:4000/api/v1"
   * POST /auth/sign-in → http://localhost:4000/api/v1/auth/sign-in
   */
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1",

  /**
   * appName: string
   * 
   * Purpose: Display name for the application
   * 
   * Usage:
   * - Page titles: "Zerpa ERP - Billing"
   * - Email templates: "Welcome to Zerpa ERP"
   * - Branding in UI
   *
   * Set by: NEXT_PUBLIC_APP_NAME environment variable
   * Default: "Zerpa ERP"
   */
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Zerpa ERP",

  /**
   * appUrl: string
   * 
   * Purpose: Base URL for frontend (used for links in emails, etc.)
   * 
   * Format: "http(s)://host:port"
   * Examples:
   * - Local: "http://localhost:3000"
   * - Staging: "https://app-staging.zerpa.io"
   * - Production: "https://app.zerpa.io"
   *
   * Set by: NEXT_PUBLIC_APP_URL environment variable
   * Default: "http://localhost:3000"
   *
   * Used in:
   * - Email templates: "Click here to login: {appUrl}/login"
   * - Password reset links: "{appUrl}/reset-password?token=..."
   * - Invite links: "{appUrl}/onboarding?invite=..."
   */
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  /**
   * cognito: object
   * 
   * Purpose: AWS Cognito configuration (for future auth)
   * 
   * Note: Currently using custom JWT auth, not Cognito
   * These values prepared for future migration
   *
   * Properties:
   * - region: AWS region for Cognito pool (e.g., "af-south-1" for Africa)
   * - userPoolId: Cognito User Pool ID
   * - clientId: Cognito App Client ID
   *
   * Set by: NEXT_PUBLIC_COGNITO_* environment variables
   * Default: Empty strings (not used unless data provided)
   *
   * Migration Note:
   * If switching to Cognito:
   * 1. Add cognito-identity-js dependency
   * 2. Replace custom JWT in auth/context.tsx with Cognito auth
   * 3. Update lib/api/client.ts to use Cognito token
   * 4. Remove custom sign-in/register endpoints
   */
  cognito: {
    region: process.env.NEXT_PUBLIC_COGNITO_REGION || "af-south-1",
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "",
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "",
  },

  /**
   * features: object
   * 
   * Purpose: Feature flags for gradual rollout and A/B testing
   * 
   * Benefits:
   * - Rollout features to subset of users
   * - Disable broken features without deploying
   * - A/B test new features
   * - Gradual migration paths
   *
   * Flags:
   * - invoicePdfDownload: Allow PDF export of invoices
   * - bulkInvoiceSend: Batch email sending (email campaigns)
   * - realtimeDashboard: Analytics dashboard with live updates
   * - reportExports: Download reports as CSV/Excel
   *
   * Usage:
   * ```typescript
   * if (CONFIG.features.invoicePdfDownload) {
   *   // Show PDF download button
   * }
   * ```
   *
   * Future:
   * - Move to database or feature flag service (LaunchDarkly, Unleash)
   * - Add user/company-level overrides
   * - Add analytics on feature usage
   */
  features: {
    invoicePdfDownload: true,      // ✅ Enabled
    bulkInvoiceSend: false,        // ❌ In progress
    realtimeDashboard: false,      // ❌ Planned for Phase 4
    reportExports: false,          // ❌ Planned for Phase 4
  },

  /**
   * verticalPriority: object
   * 
   * Purpose: Sort order for industry verticals in UI
   * 
   * Verticals:
   * - FUNERAL: Funeral homes (priority 1 - primary market)
   * - AUTOMOTIVE: Auto shops and mechanics (priority 2 - secondary)
   * - RESTAURANT: Restaurants and food service (priority 3)
   * - SPA: Spas, salons, wellness (priority 3)
   *
   * Usage:
   * When displaying vertical dropdowns or filters, sort by this priority.
   * Lower number = higher priority = shown first
   *
   * Example:
   * ```typescript
   * const sortedVerticals = ['RESTAURANT', 'FUNERAL', 'SPA', 'AUTOMOTIVE']
   *   .sort((a, b) => 
   *     CONFIG.verticalPriority[a] - CONFIG.verticalPriority[b]
   *   );
   * // Result: ['FUNERAL', 'AUTOMOTIVE', 'RESTAURANT', 'SPA']
   * ```
   *
   * Sales Focus:
   * FUNERAL listed first because:
   * - Largest TAM (Total Addressable Market)
   * - Highest ARPU (Average Revenue Per User)
   * - Fastest sales cycle
   * - Best fit for product
   *
   * Update as market priorities shift
   */
  verticalPriority: {
    FUNERAL: 1,
    AUTOMOTIVE: 2,
    RESTAURANT: 3,
    SPA: 3,
  },
} as const;  // 'as const' ensures type narrowing and prevents accidental mutations
