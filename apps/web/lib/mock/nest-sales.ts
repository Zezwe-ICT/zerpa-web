import type { NestSale, ProvisioningChecklistItem } from "@zerpa/shared-types";

export const MOCK_NEST_SALES: NestSale[] = [
  {
    id: "nest-001",
    tenantId: "tenant-001",
    status: "ACTIVE",
    setupFeeAmount: 4500,
    setupFeePaid: true,
    setupFeePaidAt: "2025-01-15T08:00:00Z",
    monthlyAmount: 1500,
    trialStartAt: "2024-12-15T00:00:00Z",
    trialEndsAt: "2025-01-15T00:00:00Z",
    billingStartAt: "2025-01-15T00:00:00Z",
    assignedAgentId: "agent-001",
    createdAt: "2024-12-15T10:00:00Z",
    updatedAt: "2025-01-15T14:30:00Z",
  },
  {
    id: "nest-002",
    tenantId: "tenant-002",
    status: "ACTIVE",
    setupFeeAmount: 4500,
    setupFeePaid: true,
    setupFeePaidAt: "2025-02-01T10:00:00Z",
    monthlyAmount: 1500,
    trialStartAt: "2025-01-15T00:00:00Z",
    trialEndsAt: "2025-02-15T00:00:00Z",
    billingStartAt: "2025-02-15T00:00:00Z",
    assignedAgentId: "agent-002",
    createdAt: "2025-01-15T09:00:00Z",
    updatedAt: "2025-02-01T10:00:00Z",
  },
  {
    id: "nest-003",
    tenantId: "tenant-003",
    status: "SETUP",
    setupFeeAmount: 4500,
    setupFeePaid: true,
    setupFeePaidAt: "2025-02-10T14:00:00Z",
    monthlyAmount: 1500,
    trialStartAt: "2025-02-01T00:00:00Z",
    trialEndsAt: "2025-03-01T00:00:00Z",
    billingStartAt: "2025-03-01T00:00:00Z",
    assignedAgentId: "agent-001",
    createdAt: "2025-02-01T11:00:00Z",
    updatedAt: "2025-02-10T14:00:00Z",
  },
  {
    id: "nest-004",
    tenantId: "tenant-004",
    status: "PENDING",
    setupFeeAmount: 4500,
    setupFeePaid: false,
    monthlyAmount: 1500,
    trialStartAt: "2025-03-01T00:00:00Z",
    trialEndsAt: "2025-04-01T00:00:00Z",
    billingStartAt: "2025-04-01T00:00:00Z",
    assignedAgentId: "agent-002",
    createdAt: "2025-02-25T15:00:00Z",
    updatedAt: "2025-02-25T15:00:00Z",
  },
];

export const MOCK_PROVISIONING_CHECKLISTS: Record<string, ProvisioningChecklistItem[]> = {
  "nest-001": [
    {
      id: "check-001",
      nestSaleId: "nest-001",
      label: "System Access Setup — Email & Portal",
      completed: true,
      completedBy: "agent-001",
      completedAt: "2024-12-20T10:00:00Z",
      order: 1,
    },
    {
      id: "check-002",
      nestSaleId: "nest-001",
      label: "Data Migration from Legacy Systems",
      completed: true,
      completedBy: "tech-001",
      completedAt: "2025-01-05T14:30:00Z",
      order: 2,
    },
    {
      id: "check-003",
      nestSaleId: "nest-001",
      label: "Staff Training Session",
      completed: true,
      completedBy: "trainer-001",
      completedAt: "2025-01-10T09:00:00Z",
      order: 3,
    },
    {
      id: "check-004",
      nestSaleId: "nest-001",
      label: "Go-Live & Live Support",
      completed: true,
      completedBy: "agent-001",
      completedAt: "2025-01-15T08:00:00Z",
      order: 4,
    },
  ],
  "nest-002": [
    {
      id: "check-005",
      nestSaleId: "nest-002",
      label: "System Access Setup — Email & Portal",
      completed: true,
      completedBy: "agent-002",
      completedAt: "2025-01-20T11:00:00Z",
      order: 1,
    },
    {
      id: "check-006",
      nestSaleId: "nest-002",
      label: "Data Migration from Legacy Systems",
      completed: true,
      completedBy: "tech-001",
      completedAt: "2025-02-01T09:00:00Z",
      order: 2,
    },
    {
      id: "check-007",
      nestSaleId: "nest-002",
      label: "Staff Training Session",
      completed: true,
      completedBy: "trainer-001",
      completedAt: "2025-02-03T10:00:00Z",
      order: 3,
    },
    {
      id: "check-008",
      nestSaleId: "nest-002",
      label: "Go-Live & Live Support",
      completed: true,
      completedBy: "agent-002",
      completedAt: "2025-02-15T08:00:00Z",
      order: 4,
    },
  ],
  "nest-003": [
    {
      id: "check-009",
      nestSaleId: "nest-003",
      label: "System Access Setup — Email & Portal",
      completed: true,
      completedBy: "agent-001",
      completedAt: "2025-02-05T10:00:00Z",
      order: 1,
    },
    {
      id: "check-010",
      nestSaleId: "nest-003",
      label: "Data Migration from Legacy Systems",
      completed: true,
      completedBy: "tech-001",
      completedAt: "2025-02-10T14:00:00Z",
      order: 2,
    },
    {
      id: "check-011",
      nestSaleId: "nest-003",
      label: "Staff Training Session",
      completed: false,
      order: 3,
    },
    {
      id: "check-012",
      nestSaleId: "nest-003",
      label: "Go-Live & Live Support",
      completed: false,
      order: 4,
    },
  ],
  "nest-004": [
    {
      id: "check-013",
      nestSaleId: "nest-004",
      label: "System Access Setup — Email & Portal",
      completed: false,
      order: 1,
    },
    {
      id: "check-014",
      nestSaleId: "nest-004",
      label: "Data Migration from Legacy Systems",
      completed: false,
      order: 2,
    },
    {
      id: "check-015",
      nestSaleId: "nest-004",
      label: "Staff Training Session",
      completed: false,
      order: 3,
    },
    {
      id: "check-016",
      nestSaleId: "nest-004",
      label: "Go-Live & Live Support",
      completed: false,
      order: 4,
    },
  ],
};

export async function getMockNestSales(): Promise<NestSale[]> {
  return MOCK_NEST_SALES;
}

export async function getMockNestSaleById(id: string): Promise<NestSale | undefined> {
  return MOCK_NEST_SALES.find((sale) => sale.id === id);
}

export async function getMockProvisioningChecklist(
  nestSaleId: string
): Promise<ProvisioningChecklistItem[]> {
  return MOCK_PROVISIONING_CHECKLISTS[nestSaleId] || [];
}
