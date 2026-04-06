import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildTicketSeeds } from "@/lib/kuji-builder";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const kujiId = String(formData.get("kujiId") ?? "");

  if (!kujiId) {
    return NextResponse.redirect(
      new URL("/admin/dashboard?error=kuji_duplicate", request.url),
      303
    );
  }

  const source = await prisma.kuji.findUnique({
    where: { id: kujiId },
    include: {
      prizeTiers: { orderBy: { displayOrder: "asc" } }
    }
  });

  if (!source) {
    return NextResponse.redirect(
      new URL("/admin/dashboard?error=kuji_duplicate", request.url),
      303
    );
  }

  const tiers = source.prizeTiers.map((tier) => ({
    letter: tier.letter,
    label: tier.label,
    quantity: tier.quantity
  }));

  const duplicated = await prisma.$transaction(async (tx) => {
    const copy = await tx.kuji.create({
      data: {
        name: `${source.name} — copie`,
        description: source.description,
        status: "draft",
        gridColumns: source.gridColumns,
        coverImageUrl: source.coverImageUrl,
        sourceUrl: source.sourceUrl ? `${source.sourceUrl}#copy` : null
      }
    });

    await tx.prizeTier.createMany({
      data: source.prizeTiers.map((tier) => ({
        kujiId: copy.id,
        letter: tier.letter,
        label: tier.label,
        quantity: tier.quantity,
        imageUrl: tier.imageUrl,
        displayOrder: tier.displayOrder
      }))
    });

    const tickets = buildTicketSeeds(tiers, 1, 0).map((ticket) => ({
      ...ticket,
      kujiId: copy.id
    }));

    await tx.ticket.createMany({
      data: tickets
    });

    return copy;
  });

  return NextResponse.redirect(
    new URL(`/admin/kujis/${duplicated.id}?success=kuji_duplicated`, request.url),
    303
  );
}