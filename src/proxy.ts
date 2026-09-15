import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { clerkAuthorizedParties, clerkClientProxyUrl, isClerkConfigured, isClerkProduction } from "@/lib/env";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/cv(.*)",
  "/saved-jobs(.*)",
  "/applications(.*)",
  "/admin(.*)",
]);

const clerkProxy = clerkMiddleware(
  async (auth, req) => {
    if (!isProtectedRoute(req)) return;
    try {
      await auth.protect({ unauthenticatedUrl: "/sign-in" });
    } catch {
      const signIn = new URL("/sign-in", req.url);
      signIn.searchParams.set("redirect_url", req.nextUrl.pathname);
      return NextResponse.redirect(signIn);
    }
  },
  {
    authorizedParties: clerkAuthorizedParties(),
    // Clerk docs: proxying does not work on development instances (pk_test_).
    ...(isClerkProduction() ? { proxyUrl: clerkClientProxyUrl() } : {}),
  },
);

export default isClerkConfigured()
  ? clerkProxy
  : function proxy() {
      return NextResponse.next();
    };

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
    "/__clerk/(.*)",
  ],
};
