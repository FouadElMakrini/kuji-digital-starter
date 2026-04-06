import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const allowedStatuses = new Set(["draft", "active", "closed"]);

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const kujiId = String(formData.get("kujiId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!kujiId || !allowedStatuses.has(status)) {
    return NextResponse.redirect(
      new URL(`/admin/dashboard?error=status_update`, request.url),
      303
    );
  }

  await prisma.kuji.update({
    where: { id: kujiId },
    data: { status: status as "draft" | "active" | "closed" }
  });

  return NextResponse.redirect(
    new URL(`/admin/kujis/${kujiId}?success=status_updated`, request.url),
    303
  );
}