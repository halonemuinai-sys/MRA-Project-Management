// Shared admin guard — returns user if admin, null otherwise
import { NextRequest } from "next/server";
import { getAuthRole, getAuthUser } from "@/app/api/_auth";

export async function requireAdmin(req: NextRequest) {
  const role = await getAuthRole(req);
  if (!role || role !== "ADMIN") return null;
  return getAuthUser(req);
}
