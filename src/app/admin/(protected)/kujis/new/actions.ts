"use server";

import { redirect } from "next/navigation";
import { KujiStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildRandomizedTickets } from "@/lib/ticket-grid";
import { createKujiSchema } from "@/lib/validations";

export async function createKujiAction(formData: FormData) {
  await requireAdmin();

  const rawPrizeTiers = String(formData.get("prizeTiers") ?? "[]");

  let parsedPrizeTiers: unknown = [];
  try {
    parsedPrizeTiers = JSON.parse(rawPrizeTiers);
  } catch {
    redirect("/admin/kujis/new?error=tiers");
  }

  const result = createKujiSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    status: String(formData.get("status") ?? "draft"),
    gridColumns: Number(formData.get("gridColumns") ?? 6),
    prizeTiers: parsedPrizeTiers
  });

  if (!result.success) {
    redirect("/admin/kujis/new?error=validation");
  }

  const { name, description, status, gridColumns, prizeTiers } = result.data;
  const tickets = buildRandomizedTickets(prizeTiers);

  const kuji = await prisma.kuji.create({
    data: {
      name,
      description: description || null,
      status: status as KujiStatus,
      gridColumns,
      prizeTiers: {
        create: prizeTiers.map((tier, index) => ({
          letter: tier.letter.trim().toUpperCase(),
          label: tier.label.trim(),
          quantity: tier.quantity,
          displayOrder: index
        }))
      },
      tickets: {
        create: tickets
      }
    },
    select: { id: true }
  });

  redirect(`/admin/kujis/${kuji.id}`);
}
