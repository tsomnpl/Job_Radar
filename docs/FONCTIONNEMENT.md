# Comment JobRadar fonctionne

Ce document décrit **ce qui est réellement dans le code**, pour comparer avec un autre projet. Rien n’est inventé ici.

## 1. Qu’est-ce que c’est

**JobRadar** = radar d’opportunités (emplois, stages, missions, ONG, international), pas un générateur de CV.

Tagline : *Your next opportunity, before you miss it.*

Stack : Next.js 16 (App Router) · Clerk · Prisma / PostgreSQL · RodiumAI (`POST https://api.rodiumai.io/v1/chat/completions`) · Tailwind.

Repo GitHub : `tsomnpl/Job_Radar`. Production : `https://job-radar-six-ochre.vercel.app`.

## 2. Compte (Clerk)

Deux instances distinctes — **ne pas les mélanger** :

| | Development | Production |
| --- | --- | --- |
| Clés | `pk_test_` / `sk_test_` | `pk_live_` / `sk_live_` |
| Frontend API | `*.clerk.accounts.dev` | domaine **que tu possèdes** |
| `*.vercel.app` | OK (origines autorisées) | **interdit** comme domaine Clerk Production (DNS / Frontend API) |
| Proxy `/__clerk` | **désactivé** (Clerk : le proxy ne marche pas en Development) | à activer dans le Dashboard après le domaine perso |

JobRadar est branché sur l’app `app_3JKP12NGJMbeVuqi5HAaeGLEQYX`. Les clés **Production** (`pk_live_`) ne sont **jamais** remplacées automatiquement par `pk_test_`.

`pk_test_` sur Vercel = Clerk Development utilisable (Sign In / Sign Up / widget). Ce n’est **pas** Clerk Production terminé.

Checklist Dashboard Production (vérifiée une par une via `GET /api/status`, pas juste « les variables existent ») :

1. **Set up environment variables** — `pk_live_` + `sk_live_` + `NEXT_PUBLIC_APP_URL=https://<domaine-à-toi>` (pas `*.vercel.app`).
2. **Configure app proxy /__clerk** — route `src/app/%5F%5Fclerk/` déjà dans le repo (`GET/POST /__clerk/*` → `https://frontend-api.clerk.dev`, headers `Clerk-Proxy-Url`, `Clerk-Secret-Key`, `X-Forwarded-For`). SDK `@clerk/nextjs@6.39.6` n’a pas `frontendApiProxy` : le route handler est l’équivalent documenté. À **activer** dans Clerk → Domains → Set proxy configuration = `https://<votre-domaine>/__clerk`. `proxyUrl` n’est passé à `ClerkProvider` / `clerkMiddleware` **que** si la clé est `pk_live_`.
3. **Create your first user in production** — Sign Up sur ce domaine, puis Dashboard → Apply (URL officielle `http(s)` uniquement). Un compte Development sur `*.vercel.app` ne compte pas.

Parcours une fois le compte chargé :

1. **Connexion** / **Inscription** dans le header (composants Clerk) → `/sign-in` / `/sign-up`.
2. Après inscription / connexion, redirection vers **`/dashboard`**.
3. Un utilisateur Prisma est créé (`clerkUserId`). **Profil, CV, offres, candidatures = 0.**
4. Les pages restent visibles sans session. La sauvegarde (CV, radar, admin import) exige un compte.
5. Si `ADMIN_EMAIL` n’est **pas** configuré (et `ADMIN_CLERK_USER_IDS` vide), **personne n’est admin**. L’email Clerk vérifié doit correspondre à `ADMIN_EMAIL`.
6. Sans clés Clerk, mode local (profil `demo_local_user`, rôle USER sauf si `ADMIN_EMAIL=demo@jobradar.local`).

État réel : `GET /api/status` (aucune clé n’est renvoyée). `clerk.developmentAuthUsable` vs `clerk.productionReady`.

Variables : `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PROXY_URL` (Production seulement), URLs `/sign-in` `/sign-up`.

## 2b. Emails (Gmail SMTP)

Transport live : Nodemailer → `smtp.gmail.com:587` (`src/server/email-service.ts`). Resend n’est pas le transport actif.

- `GMAIL_USER` = adresse Gmail (ou Google Workspace) d’envoi.
- `GMAIL_APP_PASSWORD` = **mot de passe d’application** (2FA Google obligatoire), pas le mot de passe du compte.
- `EMAIL_FROM_NAME` = nom d’affichage (défaut `JobRadar`).
- Tant que `GMAIL_USER` **et** `GMAIL_APP_PASSWORD` ne sont pas configurés, **aucun envoi** (`email.functional: false`).
- Usages : welcome (1× à la création de compte), nouvelles opportunités (opt-in `emailNotifications` + `newOpportunityAlerts`), rappels J-2 (`deadlineAlerts`), digest lundi (`weeklyDigest` off par défaut), test admin, notice Apply.
- Idempotence : table `EmailLog.eventKey`. Un échec SMTP ne casse pas la recherche ni le cron.

## 3. Données : tout part de zéro

- Le seed fictif **n’est plus chargé**. Une migration **supprime** les offres `source = seed`, `id LIKE cat_%` et `ai-proposal`.
- `npm run db:seed` refuse de recréer le catalogue. Ajoutez de vraies opportunités depuis Admin.
- Dashboard / Offres / Landing affichent **0** tant qu’aucune offre réelle n’est collectée ou importée.
- **Sources réelles** :
  - Recherche : Jobicy, Remote OK, Remotive, The Muse (stages), Himalayas. Seules les offres avec titre, entreprise, description et URL `http(s)` officielle sont gardées.
  - Cron quotidien `GET /api/cron/radar` (06:00 UTC) pour alimenter le stock.
  - **Admin** : coller une annonce brute (IA extraie depuis le texte) ou CSV/JSON.
- Rodium **n’invente jamais** une offre. Il parse l’intention / le CV / un texte déjà fourni.

Postgres obligatoire pour **persister**. `DATABASE_URL` = `postgres://…` **sans crochets `[]`**.  
L’app accepte aussi `Job_POSTGRES_URL` / `POSTGRES_URL` et retire les `["…"]`.

SQLite `file:./dev.db` **ne marche pas** sur Vercel.

## 4. Recherche (cœur produit)

Page `/search?q=…` :

1. **Intention** (`src/server/search.ts`) : RodiumAI parse la phrase (lieu, contrat, skills). Sinon parseur déterministe (`src/lib/intent.ts`).
2. **Collecte** en parallèle (`src/server/collect.ts`) : Jobicy, Remote OK, Remotive, The Muse (stages), Himalayas. Timeout 7 s. Filtre de pertinence + URL officielle obligatoire. Rien n’est fabriqué si les APIs sont vides ou hors sujet.
3. **Matching** (`src/lib/matching.ts`) contre le **stock vérifié** uniquement :  
   skills 35 % · requête 20 % · lieu 15 % · séniorité 10 % · remote 10 % · langue 5 % · fraîcheur 5 %.  
   Score + raisons + écarts (explicable). Une offre remote **restreinte** (ex. APAC/Europe) ne match **pas** une recherche Togo.
4. **Si aucune offre vérifiée n’atteint un score ≥ 55** : **aucun résultat inventé.** Message : *No matching opportunities found.* JobRadar ne fabrique pas d’offre, d’entreprise, ni d’URL.
5. **Postuler** ouvre uniquement une URL `http(s)` provenant de la source. Pas connecté → *Sign in to continue*. Sans URL → *Not specified*, bouton Apply désactivé.
6. La recherche est mémorisée (`Search` + `Match`) si l’utilisateur est persisté.

## 5. Pages

| Page | Rôle |
| --- | --- |
| `/` | Landing logo + tagline + champ NL + CTA compte. 0 offre tant que le stock est vide. |
| `/search` | Intention + offres vérifiées. Sinon : *No matching opportunities found.* Jamais d’offre inventée. |
| `/jobs` | Liste du stock uniquement (0 si vide). |
| `/jobs/[id]` | Fiche : type, durée, lieu, score, pourquoi, écarts, sauver, candidature, lettre IA. |
| `/dashboard` | Compte : compteurs, profil, matchs, sauvegardes, candidatures, dernière recherche. |
| `/saved-jobs` | Offres gardées sur le radar (Clerk). |
| `/applications` | Candidatures suivies après Apply officiel (Clerk). |
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
5. **Admin** (optionnel) : coller des offres CSV/JSON. La recherche alimente aussi le stock depuis Jobicy / Remote OK / Remotive.
6. **Recherche** : « stage data remote Lomé ».
   - Collecte les boards publics, puis match (score ≥ 55) → vraies offres + URL officielle.
   - Sinon → *No matching opportunities found.* (aucune fausse offre).
7. Sur une fiche : sauver / **Apply** vers le site officiel si une URL http(s) existe.

## 8. Fichiers clés

- Auth : `src/lib/auth.ts`, `src/proxy.ts`, `src/app/%5F%5Fclerk/`
- Emails Gmail SMTP : `src/server/email-service.ts`, `src/server/alerts.ts`, `src/server/email-log.ts`
- Matching : `src/lib/matching.ts`
- Stock : `src/server/jobs-store.ts`
- Collecte publique : `src/server/collect.ts`, `src/server/public-sources.ts`
- Apply officiel : `src/components/apply-official-button.tsx`
- Rodium : `src/server/rodium.ts`
- Prisma : `prisma/schema.prisma`

## 9. Ce qui n’est pas encore dans le code

- Scraping LinkedIn (volontairement interdit)
- ReliefWeb jobs API (v1 410, v2 exige un `appname` approuvé — non utilisé)
- Envoi email **réel** tant que Gmail n’a pas `GMAIL_USER` + `GMAIL_APP_PASSWORD` (App Password)
- Clerk **Production** tant que le domaine perso + Dashboard proxy + premier Sign Up Production ne sont pas faits
