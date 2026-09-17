import { logDbError } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export async function notifyUser(input: {
  userId: string;
  title: string;
  body: string;
  href?: string | null;
  type?: string;
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type ?? "SYSTEM",
        title: input.title,
        body: input.body,
        href: input.href ?? null,
      },
    });
  } catch (error) {
    logDbError("notifyUser", error);
  }
}

export async function listUserNotifications(userId: string, take = 12) {
  try {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
    });
  } catch (error) {
    logDbError("listUserNotifications", error);
    return [];
  }
}
