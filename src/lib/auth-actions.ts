"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  adminPassword,
  clearAdminCookie,
  clearUserCookie,
  getCurrentUser,
  normalizeUserName,
  requireAdmin,
  setAdminCookie,
  setUserCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function loginWithName(formData: FormData) {
  const name = normalizeUserName(String(formData.get("name") || ""));
  if (!name) {
    redirect("/anmelden?fehler=name");
  }
  const user = await prisma.user.findUnique({
    where: { name },
  });
  if (!user) {
    redirect("/anmelden?fehler=unbekannt");
  }
  await setUserCookie(user.id);
  redirect("/");
}

export async function logoutAction() {
  await clearUserCookie();
  redirect("/anmelden");
}

export async function adminLogin(formData: FormData) {
  const password = String(formData.get("password") || "");
  const expected = adminPassword();
  if (!expected || password !== expected) {
    redirect("/verwaltung?fehler=passwort");
  }
  await setAdminCookie();
  redirect("/verwaltung");
}

export async function adminLogout() {
  await clearAdminCookie();
  redirect("/anmelden");
}

export async function createUserAction(formData: FormData) {
  await requireAdmin();
  const name = normalizeUserName(String(formData.get("name") || ""));
  if (name.length < 2) {
    redirect("/verwaltung?fehler=name");
  }
  const exists = await prisma.user.findUnique({
    where: { name },
  });
  if (exists) {
    redirect("/verwaltung?fehler=exists");
  }
  await prisma.user.create({ data: { name } });
  revalidatePath("/verwaltung");
  redirect("/verwaltung");
}

export async function deleteUserAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const me = await getCurrentUser();
  await prisma.user.delete({ where: { id } }).catch(() => null);
  if (me?.id === id) {
    await clearUserCookie();
  }
  revalidatePath("/verwaltung");
  redirect("/verwaltung");
}
