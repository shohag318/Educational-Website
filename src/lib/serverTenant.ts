// src/lib/serverTenant.ts
// Central Server-side Tenant Resolution for complete Multi-Institution Data Isolation

import { prisma } from "@/lib/prisma";

export interface TenantContext {
  id: string;
  code: string;
  name: string;
  nameBn?: string | null;
}

/**
 * Resolves the active institution tenant for an incoming HTTP request.
 * Priority:
 * 1. Request Header: `x-institution-id`
 * 2. Request Header: `x-institution-code` or `x-eiin`
 * 3. URL Query Parameter: `institutionId`
 * 4. URL Query Parameter: `institutionCode` or `eiin` or `code`
 * 5. Fallback: First Active Institution in database
 */
export async function getTenantInstitution(req?: Request | null): Promise<TenantContext> {
  let targetId: string | null = null;
  let targetCode: string | null = null;

  if (req) {
    try {
      // 1. Check Request Headers
      const hId = req.headers.get("x-institution-id");
      const hCode = req.headers.get("x-institution-code") || req.headers.get("x-eiin");
      if (hId && hId.trim()) targetId = hId.trim();
      if (hCode && hCode.trim()) targetCode = hCode.trim();

      // 2. Check Query Parameters
      if (!targetId && !targetCode && req.url) {
        const url = new URL(req.url);
        const qId = url.searchParams.get("institutionId");
        const qCode =
          url.searchParams.get("institutionCode") ||
          url.searchParams.get("eiin") ||
          url.searchParams.get("code");

        if (qId && qId.trim()) targetId = qId.trim();
        if (qCode && qCode.trim()) targetCode = qCode.trim();
      }
    } catch {
      // In case URL parsing fails
    }
  }

  // 3. Query Database for Target Institution
  if (targetId) {
    const inst = await prisma.institution.findUnique({
      where: { id: targetId },
      select: { id: true, code: true, name: true, nameBn: true },
    });
    if (inst) {
      return { id: inst.id, code: inst.code, name: inst.name, nameBn: inst.nameBn };
    }
  }

  if (targetCode) {
    const inst = await prisma.institution.findUnique({
      where: { code: targetCode },
      select: { id: true, code: true, name: true, nameBn: true },
    });
    if (inst) {
      return { id: inst.id, code: inst.code, name: inst.name, nameBn: inst.nameBn };
    }
  }

  // 4. Fallback to first available active institution in DB
  const defaultInst = await prisma.institution.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    select: { id: true, code: true, name: true, nameBn: true },
  });

  if (defaultInst) {
    return {
      id: defaultInst.id,
      code: defaultInst.code,
      name: defaultInst.name,
      nameBn: defaultInst.nameBn,
    };
  }

  // Any institution fallback
  const anyInst = await prisma.institution.findFirst({
    select: { id: true, code: true, name: true, nameBn: true },
  });

  if (anyInst) {
    return {
      id: anyInst.id,
      code: anyInst.code,
      name: anyInst.name,
      nameBn: anyInst.nameBn,
    };
  }

  // If DB completely empty, create root default
  const created = await prisma.institution.create({
    data: {
      code: "108254",
      name: "Dhaka Ideal Model High School & College",
      nameBn: "ঢাকা আইডিয়াল মডেল হাই স্কুল অ্যান্ড কলেজ",
      address: "Mirpur, Dhaka, Bangladesh",
    },
    select: { id: true, code: true, name: true, nameBn: true },
  });

  return {
    id: created.id,
    code: created.code,
    name: created.name,
    nameBn: created.nameBn,
  };
}
