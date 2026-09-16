import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "Product terms for using JobRadar as an opportunity radar, not as an employer.",
};

export default function TermsPage() {
  return (
    <article className="panel mx-auto max-w-3xl space-y-4 p-6 md:p-8 text-sm leading-7">
      <h1 className="text-3xl font-semibold">Terms</h1>
      <p className="text-muted">
        These terms describe how the JobRadar product works. They are not a professionally validated legal contract.
      </p>
      <h2 className="pt-2 text-lg font-semibold">The product</h2>
      <p>
        JobRadar helps you search real opportunities, understand a match score, and open the official application URL.
        JobRadar is not the employer and does not hire you.
      </p>
      <h2 className="pt-2 text-lg font-semibold">Opportunities</h2>
      <p>
        Listings come from public boards, admin imports, or URLs you provide. Missing fields show “Not specified”.
        An application link available is not a verified company.
      </p>
      <h2 className="pt-2 text-lg font-semibold">Matching and AI</h2>
      <p>
        Compatibility scores are calculated by JobRadar’s deterministic matching code. RodiumAI may explain or
        extract text. JobRadar does not promise that you will get the role.
      </p>
      <h2 className="pt-2 text-lg font-semibold">Accounts</h2>
      <p>
        You are responsible for the CV and profile data you upload. Do not upload content you do not have the right
        to use. Admin access is limited to configured verified emails.
      </p>
    </article>
  );
}
