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

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Clerk
- Prisma + SQLite
- RodiumAI (`POST /v1/chat/completions`)
- Vitest

## Setup

```bash
npm install
cp .env.example .env
npx prisma db push
npm run db:seed
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Variables utiles :

| Variable | Rôle |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Auth. Vides = mode démo |
| `RODIUMAI_API_KEY` | LLM. Vide = parseurs déterministes |
| `RODIUMAI_BASE_URL` | `https://api.rodiumai.io/v1` |
| `ADMIN_CLERK_USER_IDS` | IDs Clerk admin (import) |
| `DATABASE_URL` | `file:./dev.db` par défaut |

## Scripts

```bash
npm test
npm run lint
npm run build
```

## Import admin

CSV colonnes : `title,company,location,description` (plus `country,remoteType,contractType,seniority,skills,...`).

Exemple : `data/sample-jobs.csv`.
