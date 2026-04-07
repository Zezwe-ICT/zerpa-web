import { CONFIG } from "@/lib/config";
import {
  getMockFuneralCases,
  getMockFuneralCaseById,
} from "@/lib/mock/funeral-cases";
import type { FuneralCase } from "@zerpa/shared-types";

export async function getFuneralCases(
  status?: string
): Promise<FuneralCase[]> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 300));
    const cases = await getMockFuneralCases();
    return status
      ? cases.filter((c) => c.status === status)
      : cases;
  }

  // TODO: Implement API call
  return [];
}

export async function getFuneralCaseById(id: string): Promise<FuneralCase | undefined> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 200));
    return getMockFuneralCaseById(id);
  }

  // TODO: Implement API call
  return undefined;
}

export async function updateFuneralCaseStatus(
  id: string,
  status: string
): Promise<FuneralCase> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 300));
    const funeralCase = await getMockFuneralCaseById(id);
    if (!funeralCase) throw new Error("Case not found");

    return {
      ...funeralCase,
      status: status as any,
      updatedAt: new Date().toISOString(),
    };
  }

  // TODO: Implement API call
  throw new Error("Not implemented");
}
