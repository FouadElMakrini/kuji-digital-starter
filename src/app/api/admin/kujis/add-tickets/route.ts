import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildTicketSeeds } from "@/lib/kuji-builder";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const kujiId = String(formData.get("kujiId") ?? "");
  const password = String(formData.get("password") ?? "");

  const redirectUrl = new URL(`/admin/kujis/${kujiId}`, request.url);

  if (!kujiId) {
    redirectUrl.searchParams.set("error", "add_blocked");
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    redirectUrl.searchParams.set("error", "wrong_password");
    return NextResponse.redirect(redirectUrl, 303);
  }

  const kuji = await prisma.kuji.findUnique({
    where: { id: kujiId },
    include: {
      prizeTiers: { orderBy: { displayOrder: "asc" } },
      tickets: {
        select: {
          serialNumber: true,
          gridPosition: true
        }
      }
    }
  });

  if (!kuji || kuji.status !== "active") {
    redirectUrl.searchParams.set("error", "add_blocked");
    return NextResponse.redirect(redirectUrl, 303);
  }

  const additions = Array.from(formData.entries())
    .filter(([key]) => key.startsWith("tier_"))
    .map(([key, value]) => ({
      tierId: key.replace("tier_", ""),
      quantity: Math.max(0, Number(value ?? 0))
    }))
    .filter((entry) => entry.quantity > 0);

  if (additions.length === 0) {
    redirectUrl.searchParams.set("error", "no_extra_tickets");
    return NextResponse.redirect(redirectUrl, 303);
  }

  const tierMap = new Map(kuji.prizeTiers.map((tier) => [tier.id, tier]));
  const maxSerialNumber = kuji.tickets.reduce(
    (max, ticket) => Math.max(max, ticket.serialNumber),
    0
  );
  const maxGridPosition = kuji.tickets.reduce(
    (max, ticket) => Math.max(max, ticket.gridPosition),
    -1
  );

  const extraTierSeeds = additions
    .map((entry) => {
      const tier = tierMap.get(entry.tierId);
      if (!tier) return null;

      return {
        id: tier.id,
        letter: tier.letter,
        label: tier.label,
        quantity: entry.quantity
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    letter: string;
    label: string;
    quantity: number;
  }>;

  const ticketsToCreate = buildTicketSeeds(
    extraTierSeeds.map((tier) => ({
      letter: tier.letter,
      label: tier.label,
      quantity: tier.quantity
    })),
    maxSerialNumber + 1,
    maxGridPosition + 1
  ).map((ticket) => ({
    ...ticket,
    kujiId
  }));

  await prisma.$transaction(async (tx) => {
    for (const tier of extraTierSeeds) {
      await tx.prizeTier.update({
        where: { id: tier.id },
        data: {
          quantity: { increment: tier.quantity }
        }
      });
    }

    await tx.ticket.createMany({
      data: ticketsToCreate
    });
  });

  redirectUrl.searchParams.set("success", "tickets_added");
  return NextResponse.redirect(redirectUrl, 303);
}