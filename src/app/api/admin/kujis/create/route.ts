import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildTicketSeeds, normalizePrizeTiers } from "@/lib/kuji-builder";

const allowedStatuses = new Set(["draft", "active", "closed"]);

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "draft");
  const gridColumns = Math.max(2, Math.min(12, Number(formData.get("gridColumns") ?? 8)));
  const rawPrizeTiers = String(formData.get("prizeTiers") ?? "[]");
  const coverImageUrl = String(formData.get("coverImageUrl") ?? "").trim();
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();

  console.log("CREATE KUJI DEBUG", {
    name,
    description,
    status,
    gridColumns,
    rawPrizeTiers,
    coverImageUrl,
    sourceUrl
  });
  
  if (!name || !allowedStatuses.has(status)) {
    return NextResponse.redirect(
      new URL("/admin/kujis/new?error=create_invalid", request.url),
      303
    );
  }

  let prizeTiers;
  try {
    prizeTiers = normalizePrizeTiers(JSON.parse(rawPrizeTiers));
  } catch {
    return NextResponse.redirect(
      new URL("/admin/kujis/new?error=create_invalid", request.url),
      303
    );
  }

  const kuji = await prisma.$transaction(async (tx) => {
    const createdKuji = await tx.kuji.create({
      data: {
        name,
        description,
        status: status as "draft" | "active" | "closed",
        gridColumns,
        coverImageUrl: coverImageUrl || null,
        sourceUrl: sourceUrl || null
      }
    });

    await tx.prizeTier.createMany({
      data: prizeTiers.map((tier, index) => ({
        kujiId: createdKuji.id,
        letter: tier.letter,
        label: tier.label,
        quantity: tier.quantity,
        imageUrl: typeof (tier as { imageUrl?: unknown }).imageUrl === "string" ? String((tier as { imageUrl?: unknown }).imageUrl).trim() || null : null,
        displayOrder: index
      }))
    });

    const tickets = buildTicketSeeds(prizeTiers, 1, 0).map((ticket) => ({
      ...ticket,
      kujiId: createdKuji.id
    }));

    await tx.ticket.createMany({
      data: tickets
    });

    return createdKuji;
  });

  return NextResponse.redirect(
    new URL(`/admin/kujis/${kuji.id}?success=kuji_created`, request.url),
    303
  );
}