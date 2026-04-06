import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const kujiId = String(formData.get("kujiId") ?? "");

  if (!kujiId) {
    return NextResponse.redirect(
      new URL("/admin/dashboard?error=kuji_delete", request.url),
      303
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.drawLog.deleteMany({ where: { kujiId } });
    await tx.ticket.deleteMany({ where: { kujiId } });
    await tx.clientSession.deleteMany({ where: { kujiId } });
    await tx.prizeTier.deleteMany({ where: { kujiId } });
    await tx.kuji.delete({ where: { id: kujiId } });
  });

  return NextResponse.redirect(
    new URL("/admin/dashboard?success=kuji_deleted", request.url),
    303
  );
}