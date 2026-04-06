import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accessCode = String(body.accessCode ?? body.code ?? "")
      .trim()
      .toUpperCase();
    const ticketId = String(body.ticketId ?? "");

    if (!accessCode || !ticketId) {
      return NextResponse.json(
        { message: "Code ou ticket manquant." },
        { status: 400 }
      );
    }

    const draw = await prisma.$transaction(
      async (tx) => {
        const session = await tx.clientSession.findUnique({
          where: { accessCode },
          select: {
            id: true,
            kujiId: true,
            status: true,
            allowedDraws: true,
            usedDraws: true,
            expiresAt: true
          }
        });

        if (!session) {
          throw new Error("Code invalide.");
        }

        if (session.status !== "active") {
          throw new Error("Cette session n’est plus active.");
        }

        if (session.expiresAt && session.expiresAt.getTime() < Date.now()) {
          await tx.clientSession.update({
            where: { id: session.id },
            data: { status: "expired" }
          });
          throw new Error("Cette session a expiré.");
        }

        if (session.usedDraws >= session.allowedDraws) {
          await tx.clientSession.update({
            where: { id: session.id },
            data: { status: "completed" }
          });
          throw new Error("Tous les tirages ont déjà été utilisés.");
        }

        const ticket = await tx.ticket.findUnique({
          where: { id: ticketId },
          select: {
            id: true,
            kujiId: true,
            status: true,
            letter: true,
            serialNumber: true,
            gridPosition: true
          }
        });

        if (!ticket || ticket.kujiId !== session.kujiId) {
          throw new Error("Ticket invalide.");
        }

        if (ticket.status !== "available") {
          throw new Error("Ce ticket a déjà été ouvert.");
        }

        const updatedTickets = await tx.ticket.updateMany({
          where: {
            id: ticket.id,
            status: "available"
          },
          data: {
            status: "opened",
            openedAt: new Date(),
            openedBySessionId: session.id
          }
        });

        if (updatedTickets.count !== 1) {
          throw new Error("Le ticket vient d’être pris par une autre action.");
        }

        const prizeTier = await tx.prizeTier.findFirst({
          where: {
            kujiId: session.kujiId,
            letter: ticket.letter
          },
          select: {
            label: true,
            imageUrl: true
          }
        });

        const newUsedDraws = session.usedDraws + 1;
        const nextStatus =
          newUsedDraws >= session.allowedDraws ? "completed" : "active";

        await tx.clientSession.update({
          where: { id: session.id },
          data: {
            usedDraws: { increment: 1 },
            status: nextStatus
          }
        });

        await tx.drawLog.create({
          data: {
            kujiId: session.kujiId,
            sessionId: session.id,
            ticketId: ticket.id,
            ticketSerialNumber: ticket.serialNumber,
            gridPosition: ticket.gridPosition,
            letter: ticket.letter
          }
        });

        return {
          ticketId: ticket.id,
          ticketSerialNumber: ticket.serialNumber,
          letter: ticket.letter,
          lotLabel: prizeTier?.label ?? `Lot ${ticket.letter}`,
          lotImageUrl: prizeTier?.imageUrl ?? null,
          remainingDraws: session.allowedDraws - newUsedDraws
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      }
    );

    return NextResponse.json(draw);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible d’ouvrir le ticket.";
    return NextResponse.json({ message }, { status: 400 });
  }
}