import { cache, Suspense } from "react";
import { Pill } from "@/components/brand";
import { AuthCallout } from "@/components/page-shell";
import { CvForm } from "@/components/cv-form";
import { CvOptimizeButton } from "@/components/cv-optimize-button";
import { ProfileQuickForm } from "@/components/profile-quick-form";
import { getSessionUser, isPersistedUser } from "@/lib/auth";
import { withDb } from "@/lib/db";
import { asJsonArray } from "@/lib/normalize";
import { prisma } from "@/lib/prisma";
import { isClerkConfigured } from "@/lib/env";
import { withTimeout } from "@/lib/timeout";

export const dynamic = "force-dynamic";

export default function CvPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold">CV & profil</h1>
        <p className="text-muted">
          Remplissez les champs ou collez un CV. Rien n&apos;est prérempli, JobRadar n&apos;invente pas de parcours.
        </p>
        <AuthCallout next="/cv" clerkEnabled={isClerkConfigured()} />
        <p className="text-sm text-muted">
          Sans compte ou sans Postgres, l&apos;enregistrement peut échouer — le formulaire reste utilisable à
          l&apos;écran.
        </p>
        <div className="panel space-y-4 p-6">
          <h2 className="font-semibold">Profil rapide</h2>
          <ProfileQuickForm />
        </div>
        <div className="panel space-y-4 p-6">
          <h2 className="font-semibold">Coller un CV</h2>
          <CvForm />
          <Suspense fallback={<CvOptimizeButton cvText="" />}>
            <CvOptimizeFromProfile />
          </Suspense>
        </div>
      </section>
      <aside className="panel h-fit space-y-3 p-6">
        <h2 className="font-semibold">Profil actuel</h2>
        <Suspense fallback={<p className="text-sm text-muted">Chargement du profil enregistré…</p>}>
          <CvProfileAside />
        </Suspense>
      </aside>
    </div>
  );
}

const loadCvProfile = cache(async () => {
  const user = await getSessionUser();
  if (!user || !isPersistedUser(user)) return null;
  return withTimeout(
    withDb("cv.profile", () => prisma.profile.findUnique({ where: { userId: user.id } }), null),
    2500,
    null,
  );
});

async function CvOptimizeFromProfile() {
  const profile = await loadCvProfile();
  return <CvOptimizeButton cvText={profile?.cvText ?? ""} />;
}

async function CvProfileAside() {
  const profile = await loadCvProfile();
  const skills = asJsonArray(profile?.skillsJson);

  return (
    <>
      <p className="text-sm">{profile?.headline || "Pas encore de headline"}</p>
      <p className="text-xs text-muted">{profile?.seniority || "séniorité à préciser"}</p>
      <p className="text-xs text-muted">{asJsonArray(profile?.locationsJson).join(" · ") || "lieux à préciser"}</p>
      <div className="flex flex-wrap gap-2">
        {skills.length ? (
          skills.map((skill) => <Pill key={skill}>{skill}</Pill>)
        ) : (
          <p className="text-sm text-muted">Compétences : à remplir dans le formulaire.</p>
        )}
      </div>
    </>
  );
}
