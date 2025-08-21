import { NextResponse, type NextRequest } from "next/server";

// Guard auth-required routes using a lightweight cookie written at login
// Note: JWT remains in localStorage; cookie is only for routing behavior
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuthed = req.cookies.get("auth")?.value === "1";

  const authRequired = pathname.startsWith("/create") || pathname.startsWith("/account");
  const guestOnly = pathname === "/login" || pathname === "/signup";

  if (authRequired && !isAuthed) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (guestOnly && isAuthed) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/create",
    "/account/:path*",
    "/login",
    "/signup",
  ],
};
