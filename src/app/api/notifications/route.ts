import { NextResponse } from "next/server";
import { isPersistedUser, requireUser } from "@/lib/auth";
import { listUserNotifications } from "@/server/notifications";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireUser();
    if (!isPersistedUser(user)) return NextResponse.json({ notifications: [] });
    const notifications = await listUserNotifications(user.id);
    return NextResponse.json({ notifications });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    return NextResponse.json({ notifications: [] });
  }
}

export async function POST() {
  try {
    const user = await requireUser();
    if (!isPersistedUser(user)) return NextResponse.json({ ok: false });
    await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    return NextResponse.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 });
  }
}
