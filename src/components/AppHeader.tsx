import { getCurrentUser, isAdminSession } from "@/lib/auth";
import { Header } from "@/components/Header";

export async function AppHeader() {
  const user = await getCurrentUser();
  const isAdmin = await isAdminSession();
  return <Header userName={user?.name ?? null} isAdmin={isAdmin} />;
}
