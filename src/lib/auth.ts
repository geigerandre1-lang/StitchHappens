import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { assignLegacyPatterns, prisma } from "@/lib/db";
import { ADMIN_COOKIE, USER_COOKIE } from "@/lib/auth-constants";

export { ADMIN_COOKIE, USER_COOKIE };

const USER_MAX_AGE = 60 * 60 * 24 * 30;
const ADMIN_MAX_AGE = 60 * 60 * 12;

export type SessionUser = { id: string; name: string };

export function normalizeUserName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, 40);
}

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}

function adminToken(): string {
  const secret = adminPassword();
  if (!secret) return "";
  return createHmac("sha256", secret).update("haekel-admin").digest("hex");
}

export function isAdminToken(value: string | undefined): boolean {
  const expected = adminToken();
  if (!expected || !value) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(value);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  await assignLegacyPatterns();
  const jar = await cookies();
  const id = jar.get(USER_COOKIE)?.value;
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  return { id: user.id, name: user.name };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/anmelden");
  return user;
}

export async function isAdminSession(): Promise<boolean> {
  const jar = await cookies();
  return isAdminToken(jar.get(ADMIN_COOKIE)?.value);
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminSession())) redirect("/verwaltung");
}

export async function setUserCookie(userId: string) {
  const jar = await cookies();
  jar.set(USER_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: USER_MAX_AGE,
  });
}

export async function clearUserCookie() {
  const jar = await cookies();
  jar.delete(USER_COOKIE);
}

export async function setAdminCookie() {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_MAX_AGE,
  });
}

export async function clearAdminCookie() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}
