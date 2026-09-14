import { Pill } from "@/components/brand";
import { CvForm } from "@/components/cv-form";
import { CvOptimizeButton } from "@/components/cv-optimize-button";
import { getSessionUser, isPersistedUser } from "@/lib/auth";
import { withDb } from "@/lib/db";
import { asJsonArray } from "@/lib/normalize";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { isClerkConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function CvPage() {
  const user = await getSessionUser();
  if (!user && isClerkConfigured()) redirect("/sign-in");
  const profile =
    user && isPersistedUser(user)
      ? await withDb("cv.profile", () => prisma.profile.findUnique({ where: { userId: user.id } }), null)
      : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold">CV & profil</h1>
        <p className="mt-2 text-muted">
          Importez le texte de votre CV. JobRadar en extrait un profil structuré (RodiumAI si configuré, sinon
          parseur déterministe) pour alimenter le radar.
        </p>
        {!user || !isPersistedUser(user) ? (
          <p className="text-sm text-warn">
            Sans Postgres, le parsing fonctionne mais le profil ne sera pas enregistré.
          </p>
        ) : null}
        <CvForm initialText={profile?.cvText ?? ""} />
        <CvOptimizeButton cvText={profile?.cvText ?? ""} />
      </section>
      <aside className="panel h-fit space-y-3 p-6">
        <h2 className="font-semibold">Profil actuel</h2>
        <p className="text-sm">{profile?.headline ?? "—"}</p>
        <p className="text-xs text-muted">{profile?.seniority ?? "séniorité inconnue"}</p>
        <p className="text-xs text-muted">{asJsonArray(profile?.locationsJson).join(" · ") || "lieux à préciser"}</p>
        <div className="flex flex-wrap gap-2">
          {asJsonArray(profile?.skillsJson).map((skill) => (
            <Pill key={skill}>{skill}</Pill>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {asJsonArray(profile?.languagesJson).map((lang) => (
            <Pill key={lang}>{lang}</Pill>
          ))}
        </div>
      </aside>
    </div>
  );
}
