import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { getAuthSecret, isSupabaseConfigured } from "@/lib/mode";

import { updateSession } from "@/lib/supabase/middleware";

const publicPaths = new Set(["/login", "/signup"]);

async function hasLocalSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(getAuthSecret()));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = publicPaths.has(pathname);

  if (isSupabaseConfigured()) {
    const { supabaseResponse, user } = await updateSession(request);

    if (!user && !isPublic && pathname !== "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (user && isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/today";
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  const loggedIn = await hasLocalSession(request);

  if (!loggedIn && !isPublic && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (loggedIn && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/today";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
