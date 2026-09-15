import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { isClerkConfigured } from "@/lib/env";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/cv(.*)", "/admin(.*)"]);

const clerkProxy = clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) return;
  try {
    await auth.protect({ unauthenticatedUrl: "/sign-in" });
  } catch {
    const signIn = new URL("/sign-in", req.url);
    signIn.searchParams.set("redirect_url", req.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }
});

export default isClerkConfigured()
  ? clerkProxy
  : function proxy() {
      return NextResponse.next();
    };

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
