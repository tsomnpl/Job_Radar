import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser, isPersistedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LANG_COOKIE, parseLang } from "@/i18n/messages";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { lang?: string } | null;
  const lang = parseLang(body?.lang);
  const jar = await cookies();
  jar.set(LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  try {
    const user = await getSessionUser();
    if (user && isPersistedUser(user)) {
      await prisma.user.update({ where: { id: user.id }, data: { locale: lang } });
    }
  } catch {
    /* locale cookie still set */
  }
  return NextResponse.json({ lang });
}
