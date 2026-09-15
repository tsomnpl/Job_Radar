# Comment JobRadar fonctionne

Ce document décrit **ce qui est réellement dans le code**, pour comparer avec un autre projet. Rien n’est inventé ici.

## 1. Qu’est-ce que c’est

**JobRadar** = radar d’opportunités (emplois, stages, missions, ONG, international), pas un générateur de CV.

Tagline : *Your next opportunity, before you miss it.*

Stack : Next.js 16 (App Router) · Clerk · Prisma / PostgreSQL · RodiumAI (`POST https://api.rodiumai.io/v1/chat/completions`) · Tailwind.

Repo GitHub : `tsomnpl/Job_Radar`. Branche de travail actuelle : `cursor/jobradar-vercel-db-2d46` (PR #3).

## 2. Compte (Clerk)

1. L’utilisateur clique **Créer un compte** → `/sign-up` (composant Clerk).
2. Après inscription / connexion, redirection vers **`/dashboard`**.
3. Un utilisateur Prisma est créé (`clerkUserId`). **Profil, CV, offres, candidatures = 0.**
4. Routes protégées (middleware `src/proxy.ts`) : `/dashboard`, `/cv`, `/admin`. Sans session → `/sign-in`.
5. Si `ADMIN_CLERK_USER_IDS` est **vide**, tout compte connecté est admin (MVP). Sinon seuls les IDs listés le sont.
6. Sans clés Clerk, mode démo local (un profil admin `demo_local_user`).

Variables : `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, URLs `/sign-in` `/sign-up`.  
Dans Clerk : autoriser le domaine Vercel (`job-radar-six-ochre.vercel.app`).

## 3. Données : tout part de zéro

- **Plus de 20 offres seed** au démarrage. `prepare-db` fait seulement `prisma migrate deploy`.
- Une migration **dépublie** les offres `source = seed` déjà en base (si un deploy précédent les avait injectées).
- `npm run db:seed` existe encore **si vous voulez** recharger un échantillon, ce n’est **pas** automatique.
- Dashboard / Offres / Landing affichent **0** tant que personne n’importe. Les pistes IA d’une recherche **ne remplissent pas** `/jobs`.
- **Vous** remplissez :
  - **CV / profil** : headline, compétences, lieux, séniorité, ou collage de CV.
  - **Admin** : coller une annonce brute (IA extraie) ou CSV/JSON, publier / dépublier.

Postgres obligatoire pour **persister**. `DATABASE_URL` = `postgres://…` **sans crochets `[]`**.  
L’app accepte aussi `Job_POSTGRES_URL` / `POSTGRES_URL` et retire les `["…"]`.

SQLite `file:./dev.db` **ne marche pas** sur Vercel.

## 4. Recherche (cœur produit)

Page `/search?q=…` :

1. **Intention** (`src/server/search.ts`) : RodiumAI parse la phrase (lieu, contrat, skills). Sinon parseur déterministe (`src/lib/intent.ts`).
2. **Matching** (`src/lib/matching.ts`) contre le **stock importé vérifié** uniquement :  
   skills 35 % · requête 20 % · lieu 15 % · séniorité 10 % · remote 10 % · langue 5 % · fraîcheur 5 %.  
   Score + raisons + écarts (explicable).
3. **Si aucune offre vérifiée n’atteint un score ≥ 55** : **aucun résultat inventé.** Message : *No matching opportunities found.* JobRadar ne fabrique pas d’offre, d’entreprise, ni d’URL.
4. **Postuler** ouvre uniquement une URL `http(s)` provenant de la source. Pas connecté → *Sign in to continue*. Sans URL → *Not specified*, bouton Apply désactivé.
5. La recherche est mémorisée (`Search` + `Match`) si l’utilisateur est persisté.

## 5. Pages

| Page | Rôle |
| --- | --- |
| `/` | Landing logo + tagline + champ NL + CTA compte. 0 offre tant que le stock est vide. |
| `/search` | Intention + offres vérifiées. Sinon : *No matching opportunities found.* Jamais d’offre inventée. |
| `/jobs` | Liste du stock uniquement (0 si vide). |
| `/jobs/[id]` | Fiche : type, durée, lieu, score, pourquoi, écarts, sauver, candidature, lettre IA. |
| `/dashboard` | Compte : compteurs à 0, formulaire profil, puis matchs / sauvegardes / candidatures. |
| `/cv` | Profil court + collage CV + coaching IA. |
| `/admin` | Stats, extraction texte brut, CSV/JSON, publier/dépublier. |
| `/sign-in` `/sign-up` | Clerk (ou mode démo). |

## 6. IA (Rodium) — où elle est branchée

Toujours **serveur** (`src/server/rodium.ts`) : header `Authorization: Bearer rd_sk_…`, jamais exposé au client. Timeout 8 s. Réponse lue dans `choices[0].message.content`. Fallback déterministe si clé absente / erreur.

- Intention de recherche
- Parse CV
- Narratif de match
- Extraction d’offre depuis texte brut (admin)
- Lettre de motivation (offre vérifiée)
- Conseils d’optimisation CV

Pas de Money Fusion. Pas de crawl 24 h / CAPTCHA / LinkedIn-only.

## 7. Comment ça doit se passer pour vous (parcours)

1. Merger / déployer la PR #3. Mettre `DATABASE_URL` postgres. Redéployer.
2. Ouvrir le site : landing blanche, **0 offre**.
3. **Créer un compte** Clerk → dashboard **vide** (c’est voulu).
4. Remplir le profil ou coller un CV.
5. **Admin** : coller des vraies offres (ou CSV). Elles apparaissent dans `/jobs`.
6. **Recherche** : « stage data remote Lomé ».
   - S’il y a des offres importées qui matchent (score ≥ 55) → elles s’affichent avec score et source.
   - Sinon → *No matching opportunities found.* (aucune fausse offre).
7. Sur une fiche : sauver / **Apply** vers le site officiel si une URL http(s) existe.

## 8. Fichiers clés

- Auth : `src/lib/auth.ts`, `src/proxy.ts`
- Matching : `src/lib/matching.ts`
- Stock : `src/server/jobs-store.ts`
- Apply officiel : `src/components/apply-official-button.tsx`
- Rodium : `src/server/rodium.ts`
- Prisma : `prisma/schema.prisma`

## 9. Ce qui n’est pas encore dans le code

- Collecte automatique 24 h (ONG, ONU, RSS) — l’admin importe encore les offres
- Emails de notification
- Scraping LinkedIn (volontairement interdit)
