# Prompt maître — JobRadar (AI Opportunity Intelligence)

Tu travailles **uniquement** sur JobRadar. Interdiction de copier ou fusionner FlyerMint / `1st_SaaS` (affiches, Mints, Money Fusion).

## Produit

JobRadar aide un candidat (Afrique francophone + remote) à :

1. Décrire ce qu'il cherche en langage naturel
2. Voir des offres classées
3. Comprendre **pourquoi** une offre match (et ce qui manque)
4. Nourrir le radar avec son CV
5. Laisser un admin importer un flux d'offres

## Règles produit

- Le matching n'est pas une boîte noire : chaque score a des facteurs, un détail, une polarité, des écarts.
- RodiumAI est le LLM (clé `RODIUMAI_API_KEY`, base `https://api.rodiumai.io/v1`). Si la clé manque, les parseurs déterministes restent la source de vérité.
- Clerk authentifie. Si les clés manquent, un mode démo local est acceptable pour le développement.
- SQLite par défaut pour un MVP bootable. PostgreSQL plus tard si besoin, sans changer le domaine.
- UI en français, données FR/EN.

## Surfaces

- `/` landing + search
- `/search?q=`
- `/jobs` et `/jobs/[id]`
- `/dashboard`
- `/cv`
- `/admin` import
- API : `/api/search`, `/api/cv`, `/api/jobs`, `/api/jobs/import`, `/api/jobs/[id]/save`
