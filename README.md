# JobRadar — AI Opportunity Intelligence

JobRadar n'est pas un job board. C'est un radar d'opportunités : la requête se dit en langage naturel, le matching s'explique, le CV structure le profil, l'admin importe le flux d'offres.

Produit indépendant. **Ne pas mélanger avec FlyerMint / `1st_SaaS`.**

## MVP inclus

- **Clerk** (auth) — si les clés sont absentes, un mode démo local démarre
- **RodiumAI** — parsing d'intention, parsing de CV, narratif de match (fallback déterministe sinon)
- Recherche NL + liste d'offres
- Matching explicable (score, facteurs, écarts)
- CV → profil structuré
- Dashboard (recherches, matches, radar)
- Import admin CSV / JSON
- Collecte d’offres **réelles** (Jobicy, Remote OK, Remotive, The Muse, Himalayas) + cron quotidien
- **Resend** — emails de matching / digest / Apply (serveur uniquement ; inactif sans `RESEND_API_KEY` + `EMAIL_FROM` vérifié)
- Radar personnel : sauvegardes `/saved-jobs`, candidatures `/applications`

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Clerk
- Resend (emails, serveur)
- Prisma + **PostgreSQL** (stock vide au départ, puis APIs publiques + import admin)
- RodiumAI (`POST /v1/chat/completions`) — parse l’intention, jamais une offre inventée
- Vitest

## Setup local

```bash
docker compose up -d
cp .env.example .env
npm install
npx prisma migrate deploy
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Le site démarre **vide** (0 offre, profil vide). `npm run db:seed` est optionnel si vous voulez un échantillon.

Sans Postgres, `npm run dev` démarre quand même : dashboard / CV à 0 ; une recherche interroge les APIs publiques et n’affiche que des offres réelles (sinon *No matching opportunities found*). CV persisté, sauvegardes et import admin exigent Postgres.

## Vercel / production

Les pages `/search`, `/jobs`, `/dashboard` tapent la base. **SQLite (`file:./dev.db`) ne fonctionne pas sur Vercel** — d'où les 500 même si Clerk et Rodium sont configurés.

1. Créer une base **Postgres** (intégration Prisma Postgres, Vercel Storage, ou Neon).
2. La variable doit s'appeler **`DATABASE_URL`** et la valeur doit commencer par `postgres://` ou `postgresql://` — **sans crochets `[]`**.
   - Si Prisma affiche `Job_POSTGRES_URL=["postgres://..."]` et que les 3 lignes sont identiques : prends n'importe laquelle, copie **uniquement** ce qui est entre les guillemets à l'intérieur, et colle ça dans `DATABASE_URL`.
   - L'app accepte aussi `POSTGRES_URL` / `Job_POSTGRES_URL` et retire les `[]` toute seule, mais le plus simple reste `DATABASE_URL=postgres://...`
3. Vérifier aussi (noms exacts, Production + Preview) :
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — **Development** `pk_test_…` · **Production** `pk_live_…`
   - `CLERK_SECRET_KEY` — même instance (`sk_test_…` ou `sk_live_…`)
   - `NEXT_PUBLIC_CLERK_PROXY_URL` — **Production seulement** `https://<votre-domaine>/__clerk`. Laisser vide avec `pk_test_` (Clerk : le proxy ne marche pas en Development).
   - `NEXT_PUBLIC_APP_URL=https://<votre-domaine>` (Production : un domaine que tu possèdes, pas `*.vercel.app`)
   - `RODIUMAI_API_KEY` (`rd_sk_…`, serveur uniquement)
   - `RODIUMAI_BASE_URL=https://api.rodiumai.io/v1`
   - `RODIUMAI_MODEL=rodiumai/smart`
   - `RESEND_API_KEY` / `EMAIL_FROM` (serveur uniquement ; les deux + domaine Resend vérifié, sinon aucun email n’est envoyé)
   - `CRON_SECRET` (optionnel mais recommandé)
4. **Clerk Production vs Development**
   - JobRadar est branché sur l’app Clerk `app_3JKP12NGJMbeVuqi5HAaeGLEQYX`. Les clés **Production** (`pk_live_`) ne doivent **pas** être remplacées par `pk_test_`.
   - Clerk n’accepte pas `*.vercel.app` comme domaine Production (DNS / Frontend API). Il faut un domaine que tu possèdes, ajouté dans Vercel **et** Clerk → Domains.
   - `pk_test_` sur Vercel = Development **utilisable**. Ce n’est pas Production terminé. JobRadar n’active `/__clerk` que pour `pk_live_`.
   - Checklist Dashboard (état réel : `GET /api/status`, pas « les env existent ») : (1) env vars Production = `pk_live_`/`sk_live_` + `NEXT_PUBLIC_APP_URL` sur le domaine perso ; (2) proxy app `https://<domaine>/__clerk` activé dans Clerk Dashboard ; (3) premier utilisateur via **Sign Up** sur ce domaine.
   - `pk_test_` n’est pertinent que si tu choisis volontairement l’instance **Development** en attendant un domaine. Ce n’est pas une raison de jeter les clés `pk_live_`.
5. **Redéployer** après chaque changement d'env.

Le build exécute `prisma migrate deploy` (sans seed) si `DATABASE_URL` est Postgres. Si la base est indisponible, le site reste lisible et vide : la recherche n’invente pas d’offres.

Voir `docs/FONCTIONNEMENT.md` pour le parcours produit (compte, collecte publique, import admin). Jamais d’offres inventées.

## Variables

| Variable | Rôle |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Auth. `pk_live_` = Production, `pk_test_` = Development. Vides = mode démo |
| `NEXT_PUBLIC_CLERK_PROXY_URL` | Proxy Frontend API (`/__clerk`). **Production seulement** — ne pas le définir avec `pk_test_` |
| `RODIUMAI_API_KEY` | LLM. Vide = parseurs déterministes |
| `RODIUMAI_BASE_URL` | `https://api.rodiumai.io/v1` |
| `ADMIN_CLERK_USER_IDS` | IDs Clerk admin (import) |
| `DATABASE_URL` | `postgresql://…` obligatoire en production |
| `RESEND_API_KEY` / `EMAIL_FROM` | Emails (serveur). Les deux obligatoires, sinon aucun envoi |
| `CRON_SECRET` | Auth du cron `/api/cron/radar` (quotidien 06:00 UTC) |

Ne jamais committer ni afficher les secrets (`sk_`, `rd_sk_`, `re_`).

## Scripts

```bash
npm test
npm run lint
npm run build
```

## Import admin

CSV colonnes : `title,company,location,description` (plus `country,remoteType,contractType,seniority,skills,...`).

Exemple : `data/sample-jobs.csv`.
