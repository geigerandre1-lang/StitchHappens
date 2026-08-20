import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, USER_COOKIE } from "@/lib/auth-constants";

const PUBLIC = new Set(["/anmelden", "/verwaltung"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC.has(pathname)) return NextResponse.next();

  const user = request.cookies.get(USER_COOKIE)?.value;
  if (user) return NextResponse.next();

  const admin = request.cookies.get(ADMIN_COOKIE)?.value;
  if (admin && pathname.startsWith("/verwaltung")) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/anmelden";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
