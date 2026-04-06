import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { importKujiFrom1Kuji } from "@/lib/one-kuji-import";

function normalizeImportError(error: unknown) {
  const message = error instanceof Error ? error.message : "Import impossible.";

  if (
    message.includes("Kuji.sourceUrl") ||
    message.includes("PrizeTier.imageUrl") ||
    message.includes("coverImageUrl")
  ) {
    return "La base PostgreSQL n’est pas à jour. Lance `npx prisma migrate reset` puis `npx prisma generate`, puis reconnecte-toi.";
  }

  return message;
}

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim();
  const gridColumns = Math.max(3, Math.min(10, Number(formData.get("gridColumns") ?? 8)));

  const redirectUrl = new URL("/admin/import", request.url);
  redirectUrl.searchParams.set("sourceUrl", sourceUrl);

  if (!sourceUrl) {
    redirectUrl.searchParams.set("error", "missing_url");
    return NextResponse.redirect(redirectUrl, 303);
  }

  try {
    const imported = await importKujiFrom1Kuji(sourceUrl);

    const prefill = {
      name: imported.name,
      description: "",
      status: status === "active" || status === "closed" ? status : "draft",
      gridColumns,
      coverImageUrl: imported.coverImageUrl ?? "",
      sourceUrl: imported.sourceUrl,
      prizeTiers: imported.prizeTiers.map((tier) => ({
        letter: tier.code,
        label: tier.label,
        quantity: tier.quantity,
        imageUrl: tier.imageUrl ?? ""
      }))
    };

    const nextUrl = new URL("/admin/kujis/new", request.url);
    nextUrl.searchParams.set("prefill", encodeURIComponent(JSON.stringify(prefill)));
    nextUrl.searchParams.set("fromImport", "1");
    return NextResponse.redirect(nextUrl, 303);
  } catch (error) {
    const message = normalizeImportError(error);
    redirectUrl.searchParams.set("error", "import_failed");
    redirectUrl.searchParams.set("message", message);
    return NextResponse.redirect(redirectUrl, 303);
  }
}
