import { NextResponse } from "next/server";
import { isEmailConfigured } from "@/lib/env";
import { clerkInstanceStatus } from "@/server/clerk-instance";
import { emailStatus } from "@/server/email";

export const dynamic = "force-dynamic";

export async function GET() {
  const clerk = await clerkInstanceStatus();
  const email = emailStatus();

  return NextResponse.json({
    clerk: {
      ...clerk,
      ready: clerk.productionReady,
      firstProductionUser: clerk.productionReady
        ? "present"
        : clerk.instance === "development"
          ? "not a production user — Development Sign Up on *.vercel.app does not complete the Production checklist"
          : clerk.userCount && clerk.userCount > 0
            ? "present"
            : "unknown or none — create a user via Sign Up on the production domain",
    },
    email: {
      ...email,
      configured: isEmailConfigured(),
      functional: isEmailConfigured(),
    },
  });
}
