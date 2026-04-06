import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const rawCode = String(formData.get("code") ?? "");
  const code = rawCode.trim().toUpperCase();

  if (!code) {
    return NextResponse.redirect(new URL("/play?error=missing_code", request.url), 303);
  }

  return NextResponse.redirect(
    new URL(`/play/session/${encodeURIComponent(code)}`, request.url),
    303
  );
}