"use server";

import { redirect } from "next/navigation";
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

  throw new Error("Failed to generate a unique session code.");
}

export async function createClientSessionAction(formData: FormData) {
  await requireAdmin();

  const result = createSessionSchema.safeParse({
    kujiId: String(formData.get("kujiId") ?? ""),
    allowedDraws: Number(formData.get("allowedDraws") ?? 1),
    expiresInMinutes: Number(formData.get("expiresInMinutes") ?? 0)
  });

  if (!result.success) {
    redirect(`/admin/kujis/${String(formData.get("kujiId") ?? "")}?error=session_validation`);
  }

  const { kujiId, allowedDraws, expiresInMinutes } = result.data;
  const accessCode = await createUniqueCode();

  const expiresAt =
    expiresInMinutes > 0 ? new Date(Date.now() + expiresInMinutes * 60 * 1000) : null;

  await prisma.clientSession.create({
    data: {
      kujiId,
      accessCode,
      allowedDraws,
      expiresAt
    }
  });

  redirect(`/admin/kujis/${kujiId}?createdCode=${accessCode}`);
}

export async function revokeSessionAction(formData: FormData) {
  await requireAdmin();

  const sessionId = String(formData.get("sessionId") ?? "");
  const kujiId = String(formData.get("kujiId") ?? "");

  if (!sessionId || !kujiId) {
    redirect(`/admin/kujis/${kujiId}?error=session_revoke`);
  }

  await prisma.clientSession.update({
    where: { id: sessionId },
    data: { status: "revoked" }
  });

  redirect(`/admin/kujis/${kujiId}`);
}

export async function deleteKujiAction(formData: FormData) {
  await requireAdmin();

  const kujiId = String(formData.get("kujiId") ?? "");

  if (!kujiId) {
    redirect("/admin/dashboard?error=kuji_delete");
  }

  const kuji = await prisma.kuji.findUnique({
    where: { id: kujiId },
    select: {
      id: true,
      _count: {
        select: {
          sessions: true,
          drawLogs: true
        }
      },
      tickets: {
        where: { status: "opened" },
        select: { id: true },
        take: 1
      }
    }
  });

  if (!kuji) {
    redirect("/admin/dashboard?error=kuji_delete");
  }

  const hasOpenedTickets = kuji.tickets.length > 0;
  const hasSessions = kuji._count.sessions > 0;
  const hasDrawLogs = kuji._count.drawLogs > 0;

  if (hasOpenedTickets || hasSessions || hasDrawLogs) {
    redirect(`/admin/kujis/${kujiId}?error=delete_blocked`);
  }

  await prisma.kuji.delete({
    where: { id: kujiId }
  });

  redirect("/admin/dashboard?success=kuji_deleted");
}