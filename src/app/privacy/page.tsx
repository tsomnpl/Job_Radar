import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How JobRadar handles account, profile, and opportunity data.",
};

export default function PrivacyPage() {
  return (
    <article className="panel mx-auto max-w-3xl space-y-4 p-6 md:p-8 text-sm leading-7">
      <h1 className="text-3xl font-semibold">Privacy</h1>
      <p className="text-muted">
        This page describes data JobRadar actually collects in the product. It is a product draft, not legal advice
        and not a lawyer-reviewed policy.
      </p>
      <h2 className="pt-2 text-lg font-semibold">What we store</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Clerk account identifiers and email if you sign in.</li>
        <li>Profile, CV text, skills, locations, and remote preference you submit.</li>
        <li>Saved jobs, applications marked as applied, searches, and in-app notifications.</li>
        <li>Opportunities imported or collected from public boards, including source and application URLs.</li>
      </ul>
      <h2 className="pt-2 text-lg font-semibold">What we do not do</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>JobRadar does not invent companies, salaries, or deadlines.</li>
        <li>JobRadar does not submit applications to employers. “Marked as applied” is only your tracking status.</li>
        <li>RodiumAI, Clerk, and the database keys stay on the server. They are not shown in pages.</li>
      </ul>
      <h2 className="pt-2 text-lg font-semibold">Your controls</h2>
      <p>
        From Dashboard or CV you can delete your JobRadar profile or all JobRadar data. That does not delete your
        Clerk login. Contact the operator of this instance if you need an account removed at Clerk.
      </p>
    </article>
  );
}
