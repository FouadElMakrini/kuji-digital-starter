import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const sessionId = String(formData.get("sessionId") ?? "");
  const kujiId = String(formData.get("kujiId") ?? "");

  if (!sessionId || !kujiId) {
    return NextResponse.redirect(
      new URL(`/admin/kujis/${kujiId}?error=session_revoke`, request.url),
      303
    );
  }

  await prisma.clientSession.update({
    where: { id: sessionId },
    data: { status: "revoked" }
  });

  return NextResponse.redirect(
    new URL(`/admin/kujis/${kujiId}?success=session_revoked`, request.url),
    303
  );
}