import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = (await request.json()) as { code?: string };
  const code = String(body.code ?? "").trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ ok: false, error: "Code manquant." }, { status: 400 });
  }

  const session = await prisma.clientSession.findUnique({
    where: { accessCode: code },
    include: {
      kuji: {
        select: { id: true, name: true }
      }
    }
  });

  if (!session) {
    return NextResponse.json({ ok: false, error: "Code invalide." }, { status: 404 });
  }

  if (session.status !== "active") {
    return NextResponse.json(
      { ok: false, error: "Cette session n’est plus active." },
      { status: 400 }
    );
  }

  if (session.expiresAt && session.expiresAt.getTime() < Date.now()) {
    await prisma.clientSession.update({
      where: { id: session.id },
      data: { status: "expired" }
    });

    return NextResponse.json(
      { ok: false, error: "Cette session a expiré." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    session: {
      code: session.accessCode,
      kujiId: session.kuji.id,
      kujiName: session.kuji.name,
      remainingDraws: session.allowedDraws - session.usedDraws
    }
  });
}
