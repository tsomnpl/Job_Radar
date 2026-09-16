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

  return (
    <ProfileQuickForm
      initialHeadline={profile?.headline ?? ""}
      initialSkills={asJsonArray(profile?.skillsJson).join(", ")}
      initialLocations={asJsonArray(profile?.locationsJson).join(", ")}
      initialSeniority={profile?.seniority ?? ""}
      initialRemote={profile?.remotePreference ?? ""}
      hasProfile={Boolean(profile)}
    />
  );
}
