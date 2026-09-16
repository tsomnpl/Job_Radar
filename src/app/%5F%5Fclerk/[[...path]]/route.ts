import "server-only";

import { NextResponse } from "next/server";
import { appUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Clerk Frontend API origin for Production proxying (docs: proxying does not work on development instances). */
const FAPI_ORIGIN = "https://frontend-api.clerk.dev";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function proxyClerkFrontendApi(request: Request, context: RouteContext): Promise<Response> {
  const secret = process.env.CLERK_SECRET_KEY?.trim();
  if (!secret) {
    return NextResponse.json({ error: "CLERK_NOT_CONFIGURED" }, { status: 503 });
  }

  const { path = [] } = await context.params;
  const incoming = new URL(request.url);
  const target = new URL(`/${path.join("/")}`, FAPI_ORIGIN);
  target.search = incoming.search;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "host" || lower === "connection" || lower === "content-length") return;
    headers.set(key, value);
  });

  const app = appUrl();
  headers.set("Clerk-Proxy-Url", `${app}/__clerk`);
  headers.set("Clerk-Secret-Key", secret);
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  headers.set("X-Forwarded-For", clientIp);

  const body =
    request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS"
      ? undefined
      : await request.arrayBuffer();

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body,
    redirect: "manual",
  });

  const out = new Headers(upstream.headers);
  out.delete("content-encoding");
  out.delete("transfer-encoding");
  return new NextResponse(upstream.body, { status: upstream.status, headers: out });
}

export const GET = proxyClerkFrontendApi;
export const POST = proxyClerkFrontendApi;
export const PUT = proxyClerkFrontendApi;
export const PATCH = proxyClerkFrontendApi;
export const DELETE = proxyClerkFrontendApi;
export const OPTIONS = proxyClerkFrontendApi;
