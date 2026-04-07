import type { User } from "@zerpa/shared-types";

export const MOCK_ZERPA_USER: User = {
  sub: "mock-user-001",
  email: "agent@zerpa.co.za",
  fullName: "Test Agent",
  role: "zerpa_agent",
  tenantId: undefined,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

export const MOCK_CLIENT_USER: User = {
  sub: "mock-tenant-user-001",
  email: "admin@dignityfuneralhome.co.za",
  fullName: "Funeral Admin",
  role: "tenant_admin",
  tenantId: "tenant-001",
  vertical: "FUNERAL",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

export const MOCK_AUTOMOTIVE_USER: User = {
  sub: "mock-auto-user-001",
  email: "admin@autoshop.co.za",
  fullName: "Auto Shop Admin",
  role: "tenant_admin",
  tenantId: "tenant-002",
  vertical: "AUTOMOTIVE",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

export const MOCK_RESTAURANT_USER: User = {
  sub: "mock-rest-user-001",
  email: "manager@restaurants.co.za",
  fullName: "Restaurant Manager",
  role: "tenant_admin",
  tenantId: "tenant-003",
  vertical: "RESTAURANT",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

export const MOCK_SPA_USER: User = {
  sub: "mock-spa-user-001",
  email: "owner@spa.co.za",
  fullName: "Spa Owner",
  role: "tenant_admin",
  tenantId: "tenant-004",
  vertical: "SPA",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};
