import type { AppLang } from "@/i18n/messages";
import { absoluteAppUrl } from "@/lib/email-config";

function layout(lang: AppLang, body: string): { html: string; text: string } {
  const tagline =
    lang === "fr"
      ? "Your next opportunity, before you miss it."
      : "Your next opportunity, before you miss it.";
  const html = `<div style="font-family:Arial,sans-serif;color:#071033;line-height:1.5">
  <p style="letter-spacing:.16em;text-transform:uppercase;color:#1A6DFF;font-size:12px">JobRadar</p>
  ${body}
  <p style="color:#5b6b8c;font-size:12px;margin-top:24px">${tagline}</p>
</div>`;
  return { html, text: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() };
}

export function welcomeEmail(lang: AppLang, name: string | null) {
  const who = name?.trim() || (lang === "fr" ? "là" : "there");
  const subject = lang === "fr" ? "Bienvenue sur JobRadar" : "Welcome to JobRadar";
  const body =
    lang === "fr"
      ? `<h1>Bienvenue ${who}</h1>
<p>JobRadar est un radar d’opportunités réelles : recherche en langage naturel, score explicable, candidature sur le site officiel.</p>
<p><a href="${absoluteAppUrl("/dashboard")}">Configurer My Radar</a> · <a href="${absoluteAppUrl("/cv")}">Ajouter un CV</a></p>`
      : `<h1>Welcome ${who}</h1>
<p>JobRadar is an opportunity radar for real roles: natural-language search, explainable scores, apply on the official site.</p>
<p><a href="${absoluteAppUrl("/dashboard")}">Set up My Radar</a> · <a href="${absoluteAppUrl("/cv")}">Add a CV</a></p>`;
  return { subject, ...layout(lang, body) };
}

export function newOpportunityEmail(
  lang: AppLang,
  jobs: Array<{ title: string; company: string; location: string; score: number; href: string; deadline?: string | null }>,
) {
  const subject =
    lang === "fr"
      ? `${jobs.length} opportunité${jobs.length > 1 ? "s" : ""} sur votre radar`
      : `${jobs.length} opportunit${jobs.length > 1 ? "ies" : "y"} on your radar`;
  const rows = jobs
    .map(
      (job) =>
        `<li><strong>${job.title}</strong> · ${job.company} · ${job.location} · ${job.score}%
        ${job.deadline ? ` · ${job.deadline}` : ""}<br/><a href="${job.href}">JobRadar</a></li>`,
    )
    .join("");
  const intro =
    lang === "fr"
      ? "<p>Nouvelles opportunités qui correspondent à votre radar. JobRadar n’invente aucune offre.</p>"
      : "<p>New opportunities that match your radar. JobRadar never invents a listing.</p>";
  return { subject, ...layout(lang, `${intro}<ul>${rows}</ul>`) };
}

export function deadlineReminderEmail(
  lang: AppLang,
  job: { title: string; company: string; href: string; deadline: string },
) {
  const subject =
    lang === "fr" ? `Deadline bientôt : ${job.title}` : `Deadline soon: ${job.title}`;
  const body =
    lang === "fr"
      ? `<p>L’offre <strong>${job.title}</strong> chez ${job.company} se termine le ${job.deadline}.</p><p><a href="${job.href}">Ouvrir sur JobRadar</a></p>`
      : `<p><strong>${job.title}</strong> at ${job.company} closes on ${job.deadline}.</p><p><a href="${job.href}">Open on JobRadar</a></p>`;
  return { subject, ...layout(lang, body) };
}

export function weeklyDigestEmail(
  lang: AppLang,
  jobs: Array<{ title: string; company: string; score: number; href: string }>,
) {
  const subject = lang === "fr" ? "Votre digest JobRadar" : "Your JobRadar digest";
  if (!jobs.length) {
    const empty =
      lang === "fr"
        ? "<p>Aucune nouvelle opportunité pertinente cette semaine.</p>"
        : "<p>No matching opportunities this week.</p>";
    return { subject, ...layout(lang, empty) };
  }
  const rows = jobs
    .map((job) => `<li><a href="${job.href}">${job.title}</a> · ${job.company} · ${job.score}%</li>`)
    .join("");
  return { subject, ...layout(lang, `<p>${jobs.length}</p><ul>${rows}</ul>`) };
}

export function testEmail(lang: AppLang) {
  const subject = lang === "fr" ? "Test SMTP JobRadar" : "JobRadar SMTP test";
  const body =
    lang === "fr"
      ? "<p>Le transport Gmail SMTP répond. Ceci n’est pas une alerte d’offre.</p>"
      : "<p>Gmail SMTP is responding. This is not an opportunity alert.</p>";
  return { subject, ...layout(lang, body) };
}
