import { ProfileQuickForm } from "@/components/profile-quick-form";
import { getSessionUser, isPersistedUser } from "@/lib/auth";
import { withDb } from "@/lib/db";
import { asJsonArray } from "@/lib/normalize";
import { prisma } from "@/lib/prisma";
import { withTimeout } from "@/lib/timeout";

export async function ProfileEditor() {
  const user = await getSessionUser();
  const profile =
    user && isPersistedUser(user)
      ? await withTimeout(
          withDb("profile.editor", () => prisma.profile.findUnique({ where: { userId: user.id } }), null),
          2500,
          null,
        )
      : null;
  const prefs =
    user && isPersistedUser(user)
      ? await withTimeout(
          withDb(
            "profile.prefs",
            () =>
              prisma.user.findUnique({
                where: { id: user.id },
                select: {
                  emailNotifications: true,
                  newOpportunityAlerts: true,
                  deadlineAlerts: true,
                  weeklyDigest: true,
                },
              }),
            null,
          ),
          2500,
          null,
        )
      : null;

  return (
    <ProfileQuickForm
      initialHeadline={profile?.headline ?? ""}
      initialSkills={asJsonArray(profile?.skillsJson).join(", ")}
      initialLocations={asJsonArray(profile?.locationsJson).join(", ")}
      initialSeniority={profile?.seniority ?? ""}
      initialRemote={profile?.remotePreference ?? ""}
      initialDomains={asJsonArray(profile?.domainsJson).join(", ")}
      initialTypes={asJsonArray(profile?.contractTypesJson).join(", ")}
      initialKeywords={asJsonArray(profile?.keywordsJson).join(", ")}
      emailNotifications={prefs?.emailNotifications ?? false}
      newOpportunityAlerts={prefs?.newOpportunityAlerts ?? true}
      deadlineAlerts={prefs?.deadlineAlerts ?? true}
      weeklyDigest={prefs?.weeklyDigest ?? false}
      hasProfile={Boolean(profile)}
    />
  );
}
