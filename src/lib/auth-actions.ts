"use server";

import { revalidatePath } from "next/cache";
import {
  adminPassword,
  clearAdminCookie,
  clearUserCookie,
  getCurrentUser,
  isAdminSession,
  normalizeUserName,
  setAdminCookie,
  setUserCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function loginWithName(formData: FormData): Promise<string> {
  const name = normalizeUserName(String(formData.get("name") || ""));
  if (!name) {
    return "/anmelden?fehler=name";
  }
  const user = await prisma.user.findUnique({
    where: { name },
  });
  if (!user) {
    return "/anmelden?fehler=unbekannt";
  }
  await setUserCookie(user.id);
  return "/";
}

export async function logoutAction(_formData?: FormData): Promise<string> {
  await clearUserCookie();
  return "/anmelden";
}

export async function adminLogin(formData: FormData): Promise<string> {
  const password = String(formData.get("password") || "");
  const expected = adminPassword();
  if (!expected || password !== expected) {
    return "/verwaltung?fehler=passwort";
  }
  await setAdminCookie();
  return "/verwaltung";
}

export async function adminLogout(_formData?: FormData): Promise<string> {
  await clearAdminCookie();
  return "/anmelden";
}

export async function createUserAction(formData: FormData): Promise<string> {
  if (!(await isAdminSession())) {
    return "/verwaltung?fehler=passwort";
  }
  const name = normalizeUserName(String(formData.get("name") || ""));
  if (name.length < 2) {
    return "/verwaltung?fehler=name";
  }
  const exists = await prisma.user.findUnique({
    where: { name },
  });
  if (exists) {
    return "/verwaltung?fehler=exists";
  }
  await prisma.user.create({ data: { name } });
  revalidatePath("/verwaltung");
  return "/verwaltung";
}

export async function deleteUserAction(formData: FormData): Promise<string> {
  if (!(await isAdminSession())) {
    return "/verwaltung?fehler=passwort";
  }
  const id = String(formData.get("id") || "");
  if (!id) return "/verwaltung";
  const me = await getCurrentUser();
  await prisma.user.delete({ where: { id } }).catch(() => null);
  if (me?.id === id) {
    await clearUserCookie();
    return "/anmelden";
  }
  revalidatePath("/verwaltung");
  return "/verwaltung";
}
