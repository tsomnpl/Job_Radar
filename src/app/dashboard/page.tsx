import Link from "next/link";
import { Pill, ScoreRing } from "@/components/brand";
import { getSessionUser } from "@/lib/auth";
import { asJsonArray } from "@/lib/normalize";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  const [profile, searches, matches, saved] = await Promise.all([
    user ? prisma.profile.findUnique({ where: { userId: user.id } }) : null,
    user
      ? prisma.search.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 6 })
      : [],
    user
      ? prisma.match.findMany({
          where: { userId: user.id },
          include: { job: true },
          orderBy: { score: "desc" },
          take: 6,
        })
      : [],
    user
      ? prisma.savedJob.findMany({
          where: { userId: user.id },
          include: { job: true },
          orderBy: { createdAt: "desc" },
          take: 6,
        })
      : [],
  ]);

  const skills = asJsonArray(profile?.skillsJson);
  const completeness = [
    Boolean(profile?.cvText),
    skills.length > 0,
    Boolean(profile?.seniority),
    asJsonArray(profile?.locationsJson).length > 0,
  ].filter(Boolean).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-[#b9d4d4]">
          {user?.name ?? "Profil"} · {user?.isDemo ? "session locale démo" : user?.email}
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="panel p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8eacb0]">Profil</p>
          <p className="mt-3 text-3xl font-semibold">{completeness}/4</p>
          <p className="mt-1 text-sm text-[#b9d4d4]">champs structurés</p>
        </article>
        <article className="panel p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8eacb0]">Recherches</p>
          <p className="mt-3 text-3xl font-semibold">{searches.length}</p>
        </article>
        <article className="panel p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8eacb0]">Matches</p>
          <p className="mt-3 text-3xl font-semibold">{matches.length}</p>
        </article>
        <article className="panel p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8eacb0]">Radar</p>
          <p className="mt-3 text-3xl font-semibold">{saved.length}</p>
        </article>
      </section>

      <section className="panel p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">CV structuré</h2>
          <Link href="/cv" className="text-sm text-[#2ee6d6]">
            Mettre à jour
          </Link>
        </div>
        <p className="mt-2 text-sm text-[#b9d4d4]">{profile?.headline ?? "Aucun headline encore."}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {skills.slice(0, 10).map((skill) => (
            <Pill key={skill}>{skill}</Pill>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-6">
          <h2 className="font-semibold">Dernières recherches</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {searches.map((search) => (
              <li key={search.id}>
                <Link href={`/search?q=${encodeURIComponent(search.query)}`} className="hover:text-[#2ee6d6]">
                  {search.query}
                </Link>
                <span className="ml-2 text-[#8eacb0]">{search.resultCount} résultats</span>
              </li>
            ))}
            {searches.length === 0 ? <li className="text-[#8eacb0]">Lancez une recherche NL.</li> : null}
          </ul>
        </section>
        <section className="panel p-6">
          <h2 className="font-semibold">Meilleurs matches</h2>
          <ul className="mt-4 space-y-3">
            {matches.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3">
                <Link href={`/jobs/${item.jobId}`} className="text-sm hover:text-[#2ee6d6]">
                  {item.job.title}
                  <span className="block text-xs text-[#8eacb0]">{item.job.company}</span>
                </Link>
                <ScoreRing score={item.score} />
              </li>
            ))}
            {matches.length === 0 ? <p className="text-sm text-[#8eacb0]">Aucun match persisté.</p> : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
