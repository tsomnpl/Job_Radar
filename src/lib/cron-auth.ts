export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");
  if (secret) return authorization === `Bearer ${secret}`;
  return request.headers.get("x-vercel-cron") === "1";
}
