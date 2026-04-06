import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildAdminSessionToken,
  getAdminSessionCookieName,
  getAdminSessionCookieOptions,
  verifyPassword
} from "@/lib/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return NextResponse.redirect(new URL("/admin/login?error=missing", request.url), 303);
  }

  try {
    const admin = await prisma.adminUser.findUnique({
      where: { email }
    });

    if (!admin) {
      return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url), 303);
    }

    const isValid = await verifyPassword(password, admin.passwordHash);

    if (!isValid) {
      return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url), 303);
    }

    const response = NextResponse.redirect(new URL("/admin/dashboard", request.url), 303);
    response.cookies.set(
      getAdminSessionCookieName(),
      buildAdminSessionToken(admin.id),
      getAdminSessionCookieOptions()
    );
    return response;
  } catch (error) {
    console.error("Admin login failed:", error);
    return NextResponse.redirect(new URL("/admin/login?error=session", request.url), 303);
  }
}
