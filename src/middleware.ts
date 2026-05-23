import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const authRoutes = [
  "/signin",
  "/signup",
  "/forgot-password",
  "/otp-verify",
  "/reset-password",
];

const sessionCookieNames = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

function isAuthRoute(pathname: string) {
  return authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function redirectToSignin(request: NextRequest, reason?: string) {
  const signinUrl = new URL("/signin", request.url);

  if (reason) {
    signinUrl.searchParams.set("error", reason);
  }

  if (!isAuthRoute(request.nextUrl.pathname)) {
    signinUrl.searchParams.set("callbackUrl", request.nextUrl.href);
  }

  return NextResponse.redirect(signinUrl);
}

function clearSessionCookies(response: NextResponse) {
  sessionCookieNames.forEach((cookieName) => {
    response.cookies.delete(cookieName);
  });

  return response;
}

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;
  const authRoute = isAuthRoute(pathname);

  if (!token) {
    return authRoute ? NextResponse.next() : redirectToSignin(request);
  }

  if (token.role !== "ADMIN") {
    return clearSessionCookies(redirectToSignin(request, "AccessDenied"));
  }

  if (authRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|images).*)"],
};
