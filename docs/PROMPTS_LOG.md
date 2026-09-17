# JobRadar — journal des prompts produit

Ce fichier liste les consignes produit appliquées dans le code. Ce n’est pas un historique de chat.

## Règles stables

- JobRadar n’invente jamais une offre, une entreprise, une deadline, une URL ou un score.
- Champ manquant = `Not specified` / `Non spécifié`.
- Recherche vide = `No matching opportunities found` / `Aucune opportunité correspondante trouvée`.
- Apply ouvre uniquement une URL officielle `http(s)` et enregistre le suivi `Postulé` / `Marked as applied`. JobRadar n’envoie pas la candidature à la place de l’utilisateur.
- Catalogue vide autorisé. Pas de seed fictif.
- Clerk live reste `pk_test_` tant qu’un domaine perso n’est pas branché. Ne jamais remplacer `pk_live_` par `pk_test_`.
- Admin fail-closed : `ADMIN_EMAIL` vs email Clerk **vérifié** uniquement.
- Emails : Gmail SMTP 587 + Nodemailer. Resend n’est pas le transport live.
- `appUrl()` n’émet jamais `localhost` sur Vercel / production.

## Finalisation (2026-09-16)

- URL publique / SEO : `NEXT_PUBLIC_APP_URL`, fallback hôte Vercel, `metadataBase`.
- Prisma : `category`, prefs email, `JobView`, `EmailLog`, archive via `status=archived`.
- Admin : Category / Source / Status, Archive ≠ Delete, Send test email.
- Apply : persist job live `pending` puis `Application`, sinon lien officiel non suivi.
- My Radar : domaines, types, keywords, notifications opt-in.
- CV vs offre + Copilot avec `cvText` réel.
- i18n cookie `jobradar-lang` (FR défaut, EN).
- Crons : ingest+alertes 06:00 UTC, deadlines 07:00, digest lundi 08:00.
- Logo compressé. 404 générique vs 404 offre.
