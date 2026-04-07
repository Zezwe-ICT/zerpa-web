export const CONFIG = {
  useMock: process.env.NEXT_PUBLIC_USE_MOCK === "true",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Zerpa ERP",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  cognito: {
    region: process.env.NEXT_PUBLIC_COGNITO_REGION || "af-south-1",
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "",
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "",
  },

  features: {
    invoicePdfDownload: true,
    bulkInvoiceSend: false,
    realtimeDashboard: false,
    reportExports: false,
  },

  // Sales priority hierarchy for display ordering
  verticalPriority: {
    FUNERAL: 1,
    AUTOMOTIVE: 2,
    RESTAURANT: 3,
    SPA: 3,
  },
} as const;
