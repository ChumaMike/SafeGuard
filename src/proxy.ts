import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "sg_session";

/**
 * Route guard for the ops area. Checks only that a session cookie exists; every page and action
 * re-validates the session against the database and every mutation calls can() server-side.
 */
export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/dashboard/:path*", "/cases/:path*", "/dev/:path*"],
};
