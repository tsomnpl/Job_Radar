import { Pill } from "@/components/brand";
import { CvForm } from "@/components/cv-form";
import { getSessionUser } from "@/lib/auth";
import { asJsonArray } from "@/lib/normalize";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { isClerkConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function CvPage() {
  const user = await getSessionUser();
  if (!user && isClerkConfigured()) redirect("/sign-in");
  const profile = user ? await prisma.profile.findUnique({ where: { userId: user.id } }) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold">CV & profil</h1>
        <p className="text-[#b9d4d4]">
          Collez le texte de votre CV. JobRadar en extrait un profil structuré (RodiumAI si configuré, sinon parseur
          déterministe).
        </p>
        <CvForm initialText={profile?.cvText ?? ""} />
      </section>
      <aside className="panel h-fit space-y-3 p-6">
        <h2 className="font-semibold">Profil actuel</h2>
        <p className="text-sm">{profile?.headline ?? "—"}</p>
        <p className="text-xs text-[#8eacb0]">{profile?.seniority ?? "séniorité inconnue"}</p>
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
