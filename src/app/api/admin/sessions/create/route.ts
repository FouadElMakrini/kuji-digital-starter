import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAccessCode } from "@/lib/codes";
import { createSessionSchema } from "@/lib/validations";

async function createUniqueCode() {
  for (let i = 0; i < 10; i += 1) {
    const candidate = generateAccessCode();
    const exists = await prisma.clientSession.findUnique({
      where: { accessCode: candidate },
      select: { id: true }
    });

    if (!exists) return candidate;
  }

  throw new Error("Impossible de générer un code unique.");
}

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();

  const kujiId = String(formData.get("kujiId") ?? "");
  const allowedDraws = Number(formData.get("allowedDraws") ?? 1);
  const expiresInMinutes = Number(formData.get("expiresInMinutes") ?? 0);
  const rawRedirectTo = String(formData.get("redirectTo") ?? "").trim();

  const redirectPath =
    rawRedirectTo.startsWith("/admin") ? rawRedirectTo : `/admin/kujis/${kujiId}`;

  const redirectUrl = new URL(redirectPath, request.url);

  const result = createSessionSchema.safeParse({
    kujiId,
    allowedDraws,
    expiresInMinutes
  });

  if (!result.success) {
    redirectUrl.searchParams.set("error", "session_validation");
    return NextResponse.redirect(redirectUrl, 303);
  }

  const accessCode = await createUniqueCode();
  const expiresAt =
    expiresInMinutes > 0
      ? new Date(Date.now() + expiresInMinutes * 60 * 1000)
      : null;

  await prisma.clientSession.create({
    data: {
      kujiId,
      accessCode,
      allowedDraws,
      expiresAt
    }
  });

  redirectUrl.searchParams.set("createdCode", accessCode);
  redirectUrl.searchParams.set("success", "session_created");
  return NextResponse.redirect(redirectUrl, 303);
}