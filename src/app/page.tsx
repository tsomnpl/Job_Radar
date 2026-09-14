import Link from "next/link";
import { Pill, RadarMark } from "@/components/brand";
import { SearchBox } from "@/components/search-box";

const EXAMPLES = [
  "stage data remote Cotonou",
  "CDI product designer Accra hybride",
  "freelance fullstack francophone",
  "junior marketing Dakar",
];

export default function HomePage() {
  return (
    <div className="space-y-12 pb-16">
      <section className="panel radar-ring relative overflow-hidden px-6 py-14 md:px-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-center">
          <div className="max-w-2xl space-y-5">
            <p className="text-xs uppercase tracking-[0.25em] text-[#2ee6d6]">AI Opportunity Intelligence</p>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Trouvez l&apos;offre. Comprenez pourquoi elle match.
            </h1>
            <p className="text-lg text-[#b9d4d4]">
              JobRadar n&apos;est pas un job board. C&apos;est un radar : requête en langage naturel, matching
              explicable, lecture de CV, et import d&apos;opportunités côté admin.
            </p>
            <SearchBox />
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <Link key={example} href={`/search?q=${encodeURIComponent(example)}`}>
                  <Pill>{example}</Pill>
                </Link>
              ))}
            </div>
          </div>
          <div className="mx-auto hidden md:block">
            <RadarMark size={180} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Recherche NL",
            body: "Décrivez le poste comme à un recruteur. JobRadar structure l'intention, avec RodiumAI si la clé est présente, sinon un parseur déterministe.",
          },
          {
            title: "Matching explicable",
            body: "Chaque score décompose compétences, localisation, séniorité, modalité, langue et fraîcheur. Les écarts sont listés, pas cachés.",
          },
          {
            title: "CV + admin import",
            body: "Le CV nourrit le profil. L'admin injecte des offres CSV/JSON sans mélanger ce produit avec FlyerMint.",
          },
        ].map((item) => (
          <article key={item.title} className="panel p-6">
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="mt-3 text-sm text-[#b9d4d4]">{item.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
