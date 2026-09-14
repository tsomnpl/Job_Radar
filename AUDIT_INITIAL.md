# AUDIT INITIAL — JobRadar

Date : 2026-09-14  
Repo : `https://github.com/tsomnpl/Job_Radar`  
Branche observée : `main`

## 1) État Git réel

Constat au démarrage de cet agent :

- Dépôt distant quasi vide : un seul commit `22f370e Initial commit`
- Fichier unique : `README.md` (`# Job_Radar`)
- Working tree propre
- Transcript de l'agent précédent (`bc-9e16729c-26f8-47ee-930a-3d770925233a`) **inaccessible** depuis cet environnement (agent sur un autre repo / droits GitHub insuffisants à l'époque)

Conclusion : le MVP n'était pas sur GitHub. Reconstruction from scratch dans ce repo, **sans** code FlyerMint / `1st_SaaS`.

## 2) Périmètre MVP reconstruit

- Clerk (avec mode démo si clés absentes)
- RodiumAI OpenAI-compatible (`/v1/chat/completions`) + fallbacks déterministes
- Recherche langage naturel
- Catalogue d'offres + fiche offre
- Matching explicable (poids compétences / intention / lieu / séniorité / modalité / langue / fraîcheur)
- Parsing CV → profil
- Dashboard
- Import admin CSV/JSON avec déduplication par fingerprint

## 3) Hors scope (volontaire)

- FlyerMint, Mints, Money Fusion, génération d'affiches
- Scraping massif de job boards (l'admin importe ; le seed démarre le catalogue)

## 4) Blocages éventuels

- Clerk et RodiumAI nécessitent des secrets hors repo
- Sans ces secrets, le produit reste utilisable en mode démo + matching déterministe
