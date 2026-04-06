import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "kuji_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 14; // 14 days

type SessionPayload = {
  adminUserId: string;
  exp: number;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is missing in environment variables.");
  }
  return secret;
}

function toBase64Url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function signValue(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function encodeSession(payload: SessionPayload) {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function decodeSession(token: string): SessionPayload | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signValue(encodedPayload);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length) return null;

  const valid = crypto.timingSafeEqual(providedBuffer, expectedBuffer);

  if (!valid) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.adminUserId || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getAdminSessionCookieName() {
  return COOKIE_NAME;
}

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS
  };
}

export function buildAdminSessionToken(adminUserId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  return encodeSession({ adminUserId, exp: expiresAt });
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createAdminSession(adminUserId: string) {
  const token = buildAdminSessionToken(adminUserId);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, getAdminSessionCookieOptions());
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;
  const payload = decodeSession(token);
  if (!payload) return null;

  const admin = await prisma.adminUser.findUnique({
    where: { id: payload.adminUserId },
    select: { id: true, email: true }
  });

  return admin;
}

export async function requireAdmin() {
  const admin = await getAdminSession();
  if (!admin) {
    redirect("/admin/login");
  }
  return admin;
}
